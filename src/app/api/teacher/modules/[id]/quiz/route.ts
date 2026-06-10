// GET  /api/teacher/modules/[id]/quiz  — fetch all quiz questions for a module
// POST /api/teacher/modules/[id]/quiz  — replace all quiz questions (set-based)
// Allowed: TEACHER (owns the module) or ADMIN

import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

async function checkAccess(session: Awaited<ReturnType<typeof getSessionUser>>, moduleId: number) {
  if (!session) return false;
  if (session.role === "ADMIN") return true;
  if (session.role === "TEACHER") {
    const mod = await prisma.module.findUnique({ where: { id: moduleId }, select: { createdByUserId: true } });
    if (!mod) return false;
    if (mod.createdByUserId === session.id) return true;
    const assignment = await prisma.moduleAssignment.findFirst({
      where: { moduleId, section: { teacherId: session.id } },
    });
    return !!assignment;
  }
  return false;
}

export async function GET(req: NextRequest, { params }: Ctx) {
  const session = await getSessionUser(req);
  const { id }  = await params;
  const moduleId = parseInt(id);
  if (isNaN(moduleId)) return NextResponse.json({ success: false, error: "Invalid id" }, { status: 400 });
  if (!(await checkAccess(session, moduleId)))
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const questions = await prisma.moduleQuizQuestion.findMany({
    where:   { moduleId },
    orderBy: { questionNum: "asc" },
  });
  return NextResponse.json({ success: true, questions });
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const session = await getSessionUser(req);
  const { id }  = await params;
  const moduleId = parseInt(id);
  if (isNaN(moduleId)) return NextResponse.json({ success: false, error: "Invalid id" }, { status: 400 });
  if (!(await checkAccess(session, moduleId)))
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    questions: Array<{
      questionNum:  number;
      questionText: string;
      type:         string;
      options?:     object;
      correctAnswer?: string | null;
      hint?:        string | null;
      maxScore:     number;
    }>;
  };

  // Replace all questions atomically
  await prisma.$transaction([
    prisma.moduleQuizQuestion.deleteMany({ where: { moduleId } }),
    ...(body.questions ?? []).map((q) =>
      prisma.moduleQuizQuestion.create({
        data: {
          moduleId,
          questionNum:   q.questionNum,
          questionText:  q.questionText,
          type:          q.type,
          options:       q.options ?? undefined,
          correctAnswer: q.correctAnswer ?? undefined,
          hint:          q.hint ?? undefined,
          maxScore:      q.maxScore,
        },
      })
    ),
  ]);

  return NextResponse.json({ success: true });
}
