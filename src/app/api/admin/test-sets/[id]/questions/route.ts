// /api/admin/test-sets/[id]/questions
// GET  → list all questions for a test set
// POST → create a new question

import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  const session = await getSessionUser(req);
  if (!session || session.role !== "ADMIN")
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const tsId = parseInt(id);
  if (isNaN(tsId))
    return NextResponse.json({ success: false, error: "Invalid id" }, { status: 400 });

  const testSet = await prisma.testSet.findUnique({
    where: { id: tsId },
    include: {
      questions: { orderBy: { questionNum: "asc" } },
      module:    { select: { id: true, title: true, icon: true } },
    },
  });

  if (!testSet)
    return NextResponse.json({ success: false, error: "Test set not found" }, { status: 404 });

  return NextResponse.json({ success: true, testSet, questions: testSet.questions });
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const session = await getSessionUser(req);
  if (!session || session.role !== "ADMIN")
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const tsId = parseInt(id);
  if (isNaN(tsId))
    return NextResponse.json({ success: false, error: "Invalid id" }, { status: 400 });

  const body = await req.json() as {
    questionNum:  number;
    context:      string;
    questionText: string;
    answer:       string;
    answerType:   string;
    choices?:     string[] | null;
    difficulty?:  string;
    melc?:        string | null;
    points?:      number;
  };

  if (!body.questionText?.trim())
    return NextResponse.json({ success: false, error: "Question text is required." }, { status: 400 });
  if (!body.answer?.trim())
    return NextResponse.json({ success: false, error: "Answer is required." }, { status: 400 });
  if (!body.context?.trim())
    return NextResponse.json({ success: false, error: "Context is required." }, { status: 400 });

  // Check questionNum uniqueness within the test set
  const existing = await prisma.testQuestion.findUnique({
    where: { testSetId_questionNum: { testSetId: tsId, questionNum: body.questionNum } },
  });
  if (existing)
    return NextResponse.json(
      { success: false, error: `Question #${body.questionNum} already exists in this test set.` },
      { status: 409 }
    );

  const question = await prisma.testQuestion.create({
    data: {
      testSetId:    tsId,
      questionNum:  body.questionNum,
      context:      body.context.trim(),
      questionText: body.questionText.trim(),
      answer:       body.answer.trim(),
      answerType:   body.answerType ?? "number",
      choices:      body.choices ? JSON.stringify(body.choices) : null,
      difficulty:   body.difficulty ?? "average",
      melc:         body.melc?.trim() || null,
      points:       body.points ?? 1,
    },
  });

  return NextResponse.json({ success: true, question }, { status: 201 });
}
