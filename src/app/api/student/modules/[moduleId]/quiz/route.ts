// GET  /api/student/modules/[moduleId]/quiz  — fetch quiz questions (only after all 12 stages attempted)
// POST /api/student/modules/[moduleId]/quiz  — submit quiz answers

import { NextRequest, NextResponse } from "next/server";
import { getSessionUserFast, getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ moduleId: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  const session = await getSessionUserFast();
  if (!session || session.role !== "STUDENT")
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { moduleId: modStr } = await params;
  const moduleId = parseInt(modStr);
  if (isNaN(moduleId)) return NextResponse.json({ success: false, error: "Invalid module" }, { status: 400 });

  const questions = await prisma.moduleQuizQuestion.findMany({
    where:   { moduleId },
    orderBy: { questionNum: "asc" },
  });

  // Also return any existing responses so the UI can show already-answered state
  const responses = await prisma.moduleQuizResponse.findMany({
    where: { userId: session.id, moduleId },
  });
  const answeredMap = Object.fromEntries(responses.map((r) => [r.questionId, r]));

  return NextResponse.json({ success: true, questions, answeredMap });
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const session = await getSessionUser(req);
  if (!session || session.role !== "STUDENT")
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { moduleId: modStr } = await params;
  const moduleId = parseInt(modStr);
  if (isNaN(moduleId)) return NextResponse.json({ success: false, error: "Invalid module" }, { status: 400 });

  const body = await req.json() as {
    answers: Array<{ questionId: number; answer: string }>;
  };

  if (!Array.isArray(body.answers) || body.answers.length === 0)
    return NextResponse.json({ success: false, error: "No answers provided" }, { status: 400 });

  // Fetch questions to auto-score where possible
  const questions = await prisma.moduleQuizQuestion.findMany({ where: { moduleId } });
  const qMap = new Map(questions.map((q) => [q.id, q]));

  const results: Array<{ questionId: number; score: number | null; isCorrect: boolean | null }> = [];

  for (const { questionId, answer } of body.answers) {
    const q = qMap.get(questionId);
    if (!q) continue;

    let score:     number | null = null;
    let isCorrect: boolean | null = null;

    try {
      if (q.type === "multiple_choice" && q.correctAnswer !== null) {
        const opts = q.options as { correctChoiceIndex?: number } | null;
        const correctIdx = opts?.correctChoiceIndex ?? parseInt(q.correctAnswer ?? "-1");
        const selected   = parseInt(answer);
        if (!isNaN(selected) && !isNaN(correctIdx)) {
          isCorrect = selected === correctIdx;
          score     = isCorrect ? q.maxScore : Math.floor(q.maxScore * 0.3);
        }
      } else if (q.type === "ranking" && q.correctAnswer) {
        const submitted: { text: string }[] = JSON.parse(answer);
        const correct: string[]             = JSON.parse(q.correctAnswer);
        const matches = submitted.filter((item, i) => item.text === correct[i]).length;
        score     = Math.round((matches / Math.max(correct.length, 1)) * q.maxScore);
        isCorrect = matches === correct.length;
      } else if (q.type === "open_ended" && q.correctAnswer) {
        // Simple exact-match auto-scoring for open_ended with answer key
        isCorrect = answer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
        score     = isCorrect ? q.maxScore : 0;
      }
      // If no correctAnswer set → score stays null (teacher grades)
    } catch { /* parse failure → leave null */ }

    await prisma.moduleQuizResponse.upsert({
      where:  { userId_questionId: { userId: session.id, questionId } },
      create: { userId: session.id, moduleId, questionId, answer, score, isCorrect },
      update: { answer, score, isCorrect, updatedAt: new Date() },
    });
    results.push({ questionId, score, isCorrect });
  }

  return NextResponse.json({ success: true, results });
}
