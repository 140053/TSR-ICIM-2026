// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { z } from "zod";

// ─── Validation schema ───────────────────────────────────────
const LoginSchema = z.object({
  email:    z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role:     z.enum(["STUDENT", "TEACHER", "ADMIN"]).default("STUDENT"),
});

// ─── JWT helpers ─────────────────────────────────────────────
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "tsr-dev-secret-change-in-production"
);
const SESSION_DURATION_DAYS = 7;

async function signToken(payload: Record<string, unknown>) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_DAYS}d`)
    .sign(JWT_SECRET);
}

// ─── POST /api/auth/login ─────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    // 1. Parse + validate body
    const body = await req.json();
    const parsed = LoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, password, role } = parsed.data;

    // 2. Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        profile: true, // StudentProfile if STUDENT
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // 3. Role check — make sure they're logging in as the right role
    if (user.role !== role) {
      const roleLabel = role === "STUDENT" ? "student" : role === "TEACHER" ? "teacher" : "administrator";
      return NextResponse.json(
        {
          success: false,
          error: `This account is not registered as a ${roleLabel}.`,
        },
        { status: 403 }
      );
    }

    // 4. Password check
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // 5. Build JWT payload
    const tokenPayload = {
      sub:    String(user.id),
      userId: user.id,
      name:   user.name,
      email:  user.email,
      role:   user.role,
      // Include student-specific data if available
      ...(user.profile && {
        avatar:     user.profile.avatar,
        avatarEmoji:user.profile.avatarEmoji,
        difficulty: user.profile.difficulty,
        sectionId:  user.profile.sectionId,
        setupDone:  user.profile.setupDone,
      }),
    };

    const token = await signToken(tokenPayload);

    // 6. Persist session to DB
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

    await prisma.userSession.create({
      data: {
        userId:    user.id,
        token,
        expiresAt,
      },
    });

    // 7. Build response with HTTP-only cookie
    const response = NextResponse.json(
      {
        success: true,
        message: "Login successful.",
        user: {
          id:    user.id,
          name:  user.name,
          email: user.email,
          role:  user.role,
          ...(user.profile && {
            avatar:     user.profile.avatar,
            avatarEmoji:user.profile.avatarEmoji,
            avatarName: user.profile.avatarName,
            difficulty: user.profile.difficulty,
            sectionId:  user.profile.sectionId,
            setupDone:  user.profile.setupDone,
            xp:         user.profile.xp,
            level:      user.profile.level,
          }),
        },
        redirectTo: getRedirectPath(user.role, user.profile?.setupDone),
      },
      { status: 200 }
    );

    // 8. Set HTTP-only cookie
    response.cookies.set("tsr_session", token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "lax",
      path:     "/",
      maxAge:   60 * 60 * 24 * SESSION_DURATION_DAYS, // 7 days in seconds
    });

    return response;
  } catch (err) {
    console.error("[AUTH/LOGIN]", err);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}

// ─── Helpers ─────────────────────────────────────────────────
function getRedirectPath(role: string, setupDone?: boolean): string {
  if (role === "TEACHER") return "/dashboard/teacher";
  if (role === "STUDENT") {
    // New students who haven't finished the quest setup go to onboarding
    if (setupDone === false) return "/onboarding";
    return "/dashboard/student";
  }
  if (role === "ADMIN") return "/admin";
  return "/";
}