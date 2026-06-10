// app/api/onboarding/complete/route.ts
//
// Called after a newly registered student completes the
// avatar → difficulty → quest selection flow.
// Saves the StudentProfile choices and marks setupDone = true.
// Returns a refreshed JWT so the session cookie reflects the
// new avatar + difficulty immediately.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserFast } from "@/lib/auth/session";
import { SignJWT } from "jose";
import { z } from "zod";

// ─── Validation ───────────────────────────────────────────────
const Schema = z.object({
  avatar:     z.enum([
    "WIZARD","ELF","HERO","CHAMPION","EXPLORER",
    "FOX","DRAGON","LION","EAGLE","WOLF",
  ] as const),
  avatarEmoji: z.string().min(1).max(10),
  avatarName:  z.string().min(1).max(30),
  difficulty:  z.enum(["APPRENTICE","ADVENTURER","CHAMPION"] as const),
  moduleId:    z.number().int().positive(),
});

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

// ─── POST /api/onboarding/complete ────────────────────────────
export async function POST(req: NextRequest) {
  try {
    // 1. Auth check — must be a logged-in STUDENT
    const session = await getSessionUserFast();
    if (!session || session.role !== "STUDENT") {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    // 2. Validate body
    const body   = await req.json();
    const parsed = Schema.safeParse(body);

    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return NextResponse.json(
        { success: false, error: issue?.message ?? "Invalid data.", field: issue?.path[0] },
        { status: 400 }
      );
    }

    const { avatar, avatarEmoji, avatarName, difficulty, moduleId } = parsed.data;

    // 3. Verify the module exists and is ACTIVE
    const module = await prisma.module.findUnique({
      where: { id: moduleId, status: "ACTIVE" },
    });

    if (!module) {
      return NextResponse.json(
        { success: false, error: "Selected module not found or inactive.", field: "moduleId" },
        { status: 404 }
      );
    }

    // 4. Get the student's profile
    const profile = await prisma.studentProfile.findUnique({
      where: { userId: session.id },
    });

    if (!profile) {
      return NextResponse.json(
        { success: false, error: "Student profile not found." },
        { status: 404 }
      );
    }

    // 5. Update profile + create initial ModuleProgress in a transaction
    await prisma.$transaction(async (tx) => {
      // Update avatar, difficulty, mark setup done
      await tx.studentProfile.update({
        where: { userId: session.id },
        data: {
          avatar,
          avatarEmoji,
          avatarName,
          difficulty,
          setupDone: true,
        },
      });

      // Create module progress (NOT_STARTED — they'll start on the quest page)
      await tx.moduleProgress.upsert({
        where:  { userId_moduleId: { userId: session.id, moduleId } },
        update: {},  // don't overwrite if they somehow already started
        create: {
          userId:       session.id,
          moduleId,
          difficulty,
          status:       "NOT_STARTED",
          currentStage: 1,
        },
      });
    });

    // 6. Revoke the old session and issue a new JWT that includes
    //    the updated avatar + difficulty + setupDone: true
    const oldToken = req.cookies.get("tsr_session")?.value;
    if (oldToken) {
      await prisma.userSession.deleteMany({ where: { token: oldToken } });
    }

    const newPayload = {
      sub:         String(session.id),
      userId:      session.id,
      name:        session.name,
      email:       session.email,
      role:        session.role,
      avatar,
      avatarEmoji,
      difficulty,
      sectionId:   profile.sectionId,
      setupDone:   true,
    };

    const newToken = await signToken(newPayload);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + SESSION_DAYS);
    await prisma.userSession.create({
      data: { userId: session.id, token: newToken, expiresAt },
    });

    // 7. Respond + refresh the session cookie
    const response = NextResponse.json(
      {
        success:    true,
        message:    "Onboarding complete!",
        redirectTo: "/dashboard/student",
      },
      { status: 200 }
    );

    response.cookies.set("tsr_session", newToken, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "lax",
      path:     "/",
      maxAge:   60 * 60 * 24 * SESSION_DAYS,
    });

    return response;
  } catch (err) {
    console.error("[ONBOARDING/COMPLETE]", err);
    return NextResponse.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}