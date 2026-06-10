// /api/admin/test-sets/[id]/questions/[qid]
// PATCH  → update a question
// DELETE → delete a question

import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string; qid: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await getSessionUser(req);
  if (!session || session.role !== "ADMIN")
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { id, qid } = await params;
  const tsId = parseInt(id);
  const qId  = parseInt(qid);
  if (isNaN(tsId) || isNaN(qId))
    return NextResponse.json({ success: false, error: "Invalid id" }, { status: 400 });

  const body = await req.json() as Partial<{
    questionNum:  number;
    context:      string;
    questionText: string;
    answer:       string;
    answerType:   string;
    choices:      string[] | null;
    difficulty:   string;
    melc:         string | null;
    points:       number;
  }>;

  // If changing questionNum, check uniqueness
  if (body.questionNum !== undefined) {
    const conflict = await prisma.testQuestion.findFirst({
      where: {
        testSetId:   tsId,
        questionNum: body.questionNum,
        id:          { not: qId },
      },
    });
    if (conflict)
      return NextResponse.json(
        { success: false, error: `Question #${body.questionNum} already exists.` },
        { status: 409 }
      );
  }

  const updated = await prisma.testQuestion.update({
    where: { id: qId },
    data: {
      ...(body.questionNum  !== undefined && { questionNum:  body.questionNum  }),
      ...(body.context      !== undefined && { context:      body.context?.trim() ?? "" }),
      ...(body.questionText !== undefined && { questionText: body.questionText?.trim() ?? "" }),
      ...(body.answer       !== undefined && { answer:       body.answer?.trim() ?? "" }),
      ...(body.answerType   !== undefined && { answerType:   body.answerType }),
      ...(body.choices      !== undefined && { choices:      body.choices ? JSON.stringify(body.choices) : null }),
      ...(body.difficulty   !== undefined && { difficulty:   body.difficulty }),
      ...(body.melc         !== undefined && { melc:         body.melc?.trim() || null }),
      ...(body.points       !== undefined && { points:       body.points }),
    },
  });

  return NextResponse.json({ success: true, question: updated });
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const session = await getSessionUser(req);
  if (!session || session.role !== "ADMIN")
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { qid } = await params;
  const qId = parseInt(qid);
  if (isNaN(qId))
    return NextResponse.json({ success: false, error: "Invalid id" }, { status: 400 });

  // Check if any test responses reference this question
  const responseCount = await prisma.testResponse.count({ where: { questionId: qId } });
  if (responseCount > 0)
    return NextResponse.json(
      { success: false, error: `Cannot delete — ${responseCount} student response(s) are linked to this question.` },
      { status: 409 }
    );

  await prisma.testQuestion.delete({ where: { id: qId } });

  return NextResponse.json({ success: true });
}
