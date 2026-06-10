// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { z } from "zod";

// ─── Validation schemas ───────────────────────────────────────
const BaseSchema = z.object({
  firstName: z.string().min(1, "First name is required.").max(50),
  lastName:  z.string().min(1, "Last name is required.").max(50),
  email:     z.string().email("Enter a valid email address."),
  password:  z
    .string()
    .min(6,  "Password must be at least 6 characters.")
    .max(72, "Password is too long."),
});

const StudentSchema = BaseSchema.extend({
  role:     z.literal("STUDENT"),
  schoolId: z.number().int().positive("Please choose your school."),
  section:  z.string().min(1, "Please choose your section."),
});

const TeacherSchema = BaseSchema.extend({
  role:     z.literal("TEACHER"),
  schoolId: z.number().int().positive("Please choose your school."),
  subject:  z.string().min(2, "Subject / department is required.").max(100),
  code:     z.string().min(4, "Invite code is required.").max(32),
});

const RegisterSchema = z.discriminatedUnion("role", [StudentSchema, TeacherSchema]);

// ─── JWT helpers ─────────────────────────────────────────────
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "tsr-dev-secret-change-in-production"
);
const SESSION_DAYS = 7;

async function signToken(payload: Record<string, unknown>) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(JWT_SECRET);
}

// ─── Teacher invite code validation ──────────────────────────
// Checks DB first; falls back to env TEACHER_INVITE_CODES for legacy seeds.
async function validateAndConsumeTeacherCode(
  code: string,
  userId: number
): Promise<boolean> {
  const upper = code.trim().toUpperCase();

  // 1. DB-based codes
  const dbCode = await prisma.teacherInviteCode.findFirst({
    where: { code: upper, isActive: true, usedById: null },
  });

  if (dbCode) {
    const now = new Date();
    if (dbCode.expiresAt && dbCode.expiresAt < now) return false;

    await prisma.teacherInviteCode.update({
      where:  { id: dbCode.id },
      data:   { usedById: userId, usedAt: now, isActive: false },
    });
    return true;
  }

  // 2. Env fallback (legacy / seeded codes)
  const envCodes = new Set(
    (process.env.TEACHER_INVITE_CODES ?? "")
      .split(",")
      .map((c) => c.trim().toUpperCase())
      .filter(Boolean)
  );
  return envCodes.has(upper);
}

// ─── POST /api/auth/register ──────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    // 1. Parse + validate
    const body   = await req.json();
    const parsed = RegisterSchema.safeParse(body);

    if (!parsed.success) {
      // .issues is the canonical property on ZodError — always available
      // regardless of how complex the union schema is.
      const issue = parsed.error.issues[0];
      return NextResponse.json(
        {
          success: false,
          error:   issue?.message ?? "Invalid request data.",
          // path[0] is the top-level field name (e.g. "email", "section")
          field:   typeof issue?.path[0] === "string" ? issue.path[0] : undefined,
        },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // 2. Duplicate email check
    const existing = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase().trim() },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "An account with this email already exists.", field: "email" },
        { status: 409 }
      );
    }

    // 3. Teacher invite code — pre-check existence (consume after user creation)
    if (data.role === "TEACHER") {
      const upper = data.code.trim().toUpperCase();
      const dbCode = await prisma.teacherInviteCode.findFirst({
        where: { code: upper, isActive: true, usedById: null },
      });
      const envCodes = new Set(
        (process.env.TEACHER_INVITE_CODES ?? "")
          .split(",").map((c) => c.trim().toUpperCase()).filter(Boolean)
      );
      const codeExists = !!dbCode || envCodes.has(upper);
      if (!codeExists) {
        return NextResponse.json(
          { success: false, error: "Invalid invite code. Please contact your school administrator.", field: "code" },
          { status: 403 }
        );
      }
      // Expiry pre-check for DB codes
      if (dbCode?.expiresAt && dbCode.expiresAt < new Date()) {
        return NextResponse.json(
          { success: false, error: "This invite code has expired.", field: "code" },
          { status: 403 }
        );
      }
    }

    // 4a. Validate teacher school exists
    if (data.role === "TEACHER") {
      const school = await prisma.school.findFirst({
        where: { id: data.schoolId, isActive: true },
      });
      if (!school) {
        return NextResponse.json(
          { success: false, error: "Selected school not found. Please contact your administrator.", field: "schoolId" },
          { status: 400 }
        );
      }
    }

    // 4b. Resolve section → sectionId (students only)
    let sectionId: number | null = null;
    if (data.role === "STUDENT") {
      const section = await prisma.section.findFirst({
        where: { name: data.section, isActive: true, schoolId: data.schoolId },
      });
      if (!section) {
        return NextResponse.json(
          { success: false, error: "Selected section not found. Please contact your administrator.", field: "section" },
          { status: 400 }
        );
      }
      sectionId = section.id;
    }

    // 5. Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12);

    // 6. Create user + profile in a transaction
    const fullName = `${data.firstName.trim()} ${data.lastName.trim()}`;

    const user = await prisma.$transaction(async (tx) => {
      // Create the base user
      const newUser = await tx.user.create({
        data: {
          name:     fullName,
          email:    data.email.toLowerCase().trim(),
          password: hashedPassword,
          role:     data.role,
        },
      });

      // Create student profile
      if (data.role === "STUDENT") {
        await tx.studentProfile.create({
          data: {
            userId:    newUser.id,
            sectionId,
            schoolId:  data.schoolId,
            setupDone: false,
          },
        });
      }

      return newUser;
    });

    // 6b. Consume DB invite code (if one was used)
    if (data.role === "TEACHER") {
      await validateAndConsumeTeacherCode(data.code, user.id);
    }

    // 7. Sign JWT
    const tokenPayload = {
      sub:       String(user.id),
      userId:    user.id,
      name:      user.name,
      email:     user.email,
      role:      user.role,
      setupDone: user.role === "STUDENT" ? false : undefined,
      ...(sectionId && { sectionId }),
    };

    const token = await signToken(tokenPayload);

    // 8. Persist session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + SESSION_DAYS);

    await prisma.userSession.create({
      data: { userId: user.id, token, expiresAt },
    });

    // 9. Determine redirect
    //    Students → /onboarding (avatar + difficulty picker)
    //    Teachers → /dashboard/teacher
    const redirectTo =
      user.role === "STUDENT" ? "/onboarding" : "/dashboard/teacher";

    // 10. Build response + set cookie
    const response = NextResponse.json(
      {
        success: true,
        message: "Account created successfully.",
        user: {
          id:        user.id,
          name:      user.name,
          email:     user.email,
          role:      user.role,
          sectionId,
          setupDone: user.role === "STUDENT" ? false : undefined,
        },
        redirectTo,
      },
      { status: 201 }
    );

    response.cookies.set("tsr_session", token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "lax",
      path:     "/",
      maxAge:   60 * 60 * 24 * SESSION_DAYS,
    });

    return response;
  } catch (err) {
    console.error("[AUTH/REGISTER]", err);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

// ─── Helpers ─────────────────────────────────────────────────
function sectionEmoji(name: string): string {
  const map: Record<string, string> = {
    Narra:    "🌲",
    Molave:   "🌿",
    Kamagong: "🌳",
    Yakal:    "🍃",
  };
  return map[name] ?? "🏫";
}