// app/api/student/tests/submit/route.ts
// POST — student submits answers for a pre-test or post-test.
// Scores each answer, creates TestResult + TestResponse records.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { z } from "zod";

const SubmitSchema = z.object({
  testSetId:  z.number().int().positive(),
  timeSpent:  z.number().int().min(0).optional().default(0),
  answers: z.array(z.object({
    questionId:    z.number().int().positive(),
    studentAnswer: z.string(),
  })).min(1),
});

// ─── Score one answer ─────────────────────────────────────────
function scoreAnswer(
  studentAnswer: string,
  correctAnswer: string,
  answerType:    string,
): boolean {
  const s = studentAnswer.trim();
  const c = correctAnswer.trim();
  if (!s) return false;

  if (answerType === "multiple_choice") {
    // student sends "A"/"B"/"C"/"D"; correct answer stored as same letter
    return s.toUpperCase() === c.toUpperCase();
  }

  if (answerType === "number") {
    const sn = parseFloat(s.replace(/,/g, ""));
    const cn = parseFloat(c.replace(/,/g, ""));
    if (isNaN(sn) || isNaN(cn)) return false;
    return Math.abs(sn - cn) < 0.01; // small float tolerance
  }

  if (answerType === "time") {
    // Normalise "1:30" / "01:30" / "1h30m" etc. → compare lowercased
    return s.replace(/\s/g, "").toLowerCase() === c.replace(/\s/g, "").toLowerCase();
  }

  // text — case-insensitive
  return s.toLowerCase() === c.toLowerCase();
}

// ─── POST handler ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== "STUDENT") {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const body   = await req.json();
    const parsed = SubmitSchema.safeParse(body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return NextResponse.json(
        { success: false, error: issue?.message ?? "Invalid data." },
        { status: 400 }
      );
    }

    const { testSetId, timeSpent, answers } = parsed.data;

    // Load the test set + questions
    const testSet = await prisma.testSet.findUnique({
      where:   { id: testSetId },
      include: { questions: true },
    });

    if (!testSet || !testSet.isActive) {
      return NextResponse.json({ success: false, error: "Test not found or inactive." }, { status: 404 });
    }

    // Guard: one attempt per test
    const existing = await prisma.testResult.findUnique({
      where: { userId_testSetId: { userId: session.id, testSetId } },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "You have already submitted this test." },
        { status: 409 }
      );
    }

    // Build question map for fast lookup
    const qMap = new Map(testSet.questions.map((q) => [q.id, q]));

    // Score each answer
    let score = 0;
    const scoredAnswers = answers.map(({ questionId, studentAnswer }) => {
      const q = qMap.get(questionId);
      if (!q) return { questionId, studentAnswer, isCorrect: false };
      const isCorrect = scoreAnswer(studentAnswer, q.answer, q.answerType);
      if (isCorrect) score += q.points;
      return { questionId, studentAnswer, isCorrect };
    });

    const totalPoints  = testSet.questions.reduce((s, q) => s + q.points, 0) || 1;
    const totalItems   = testSet.questions.length;
    const percentScore = (score / totalPoints) * 100;

    // Persist in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const testResult = await tx.testResult.create({
        data: {
          userId:       session.id,
          testSetId,
          type:         testSet.type,
          score,
          totalItems,
          percentScore,
          timeSpent:    timeSpent || null,
        },
      });

      await tx.testResponse.createMany({
        data: scoredAnswers.map(({ questionId, studentAnswer, isCorrect }) => ({
          testResultId:  testResult.id,
          questionId,
          studentAnswer,
          isCorrect,
        })),
      });

      return testResult;
    });

    return NextResponse.json({
      success: true,
      result: {
        score:        result.score,
        totalItems:   result.totalItems,
        percentScore: Math.round(result.percentScore),
        submittedAt:  result.submittedAt.toLocaleDateString("en-PH", {
          month: "long", day: "numeric", year: "numeric",
        }),
      },
    }, { status: 201 });

  } catch (err) {
    console.error("[STUDENT/TESTS/SUBMIT]", err);
    return NextResponse.json(
      { success: false, error: "Failed to submit test. Please try again." },
      { status: 500 }
    );
  }
}
