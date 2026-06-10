// app/api/teacher/tests/[id]/route.ts
// PUT — full update (metadata + questions); PATCH — toggle isActive; DELETE — remove

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

// ─── PUT — full update ─────────────────────────────────────────
const QuestionSchema = z.object({
  questionNum:  z.number().int().min(1),
  context:      z.string().default("General"),
  questionText: z.string().min(1),
  answer:       z.string().min(1),
  answerType:   z.enum(["number", "text", "time", "multiple_choice"]).default("number"),
  choices:      z.array(z.string()).length(4).optional().nullable(),
  difficulty:   z.enum(["easy", "average", "difficult"]).default("average"),
  melc:         z.string().optional().nullable(),
  points:       z.number().int().min(1).default(1),
});

const UpdateSchema = z.object({
  title:       z.string().min(2),
  type:        z.enum(["PRE_TEST", "POST_TEST"]),
  description: z.string().optional().nullable(),
  timeLimit:   z.number().int().min(0).optional().nullable(),
  moduleId:    z.number().int().optional().nullable(),
  questions:   z.array(QuestionSchema).min(1).optional(),
});

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== "TEACHER") {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await params;
    const testSetId = parseInt(id);
    if (isNaN(testSetId)) {
      return NextResponse.json({ success: false, error: "Invalid ID." }, { status: 400 });
    }

    const body   = await req.json();
    const parsed = UpdateSchema.safeParse(body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return NextResponse.json(
        { success: false, error: issue?.message ?? "Invalid data." },
        { status: 400 }
      );
    }

    const { title, type, description, timeLimit, moduleId, questions } = parsed.data;

    // Check if any students have already submitted this test
    const resultCount = await prisma.testResult.count({ where: { testSetId } });

    if (questions && resultCount > 0) {
      return NextResponse.json(
        { success: false, error: `Cannot edit questions — ${resultCount} student submission${resultCount !== 1 ? "s" : ""} already exist. Only metadata can be updated.` },
        { status: 409 }
      );
    }

    await prisma.$transaction(async (tx) => {
      // Always update metadata
      await tx.testSet.update({
        where: { id: testSetId },
        data:  {
          title,
          type:        type as any,
          description: description ?? null,
          timeLimit:   timeLimit   ?? null,
          moduleId:    moduleId    ?? null,
        },
      });

      // Replace questions only if no submissions exist
      if (questions) {
        await tx.testQuestion.deleteMany({ where: { testSetId } });
        await tx.testQuestion.createMany({
          data: questions.map((q) => ({
            testSetId,
            questionNum:  q.questionNum,
            context:      q.context,
            questionText: q.questionText,
            answer:       q.answer,
            answerType:   q.answerType,
            choices:      q.choices ? JSON.stringify(q.choices) : null,
            difficulty:   q.difficulty,
            melc:         q.melc ?? null,
            points:       q.points,
          })),
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[TEACHER/TESTS/:id PUT]", err);
    return NextResponse.json({ success: false, error: "Failed to update." }, { status: 500 });
  }
}

// ─── PATCH — toggle isActive ───────────────────────────────────
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== "TEACHER") {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await params;
    const testSetId = parseInt(id);
    if (isNaN(testSetId)) {
      return NextResponse.json({ success: false, error: "Invalid ID." }, { status: 400 });
    }

    const body = await req.json() as { isActive?: boolean };

    const testSet = await prisma.testSet.findUnique({ where: { id: testSetId } });
    if (!testSet) {
      return NextResponse.json({ success: false, error: "Test set not found." }, { status: 404 });
    }

    const updated = await prisma.testSet.update({
      where: { id: testSetId },
      data:  { isActive: body.isActive ?? !testSet.isActive },
    });

    return NextResponse.json({ success: true, isActive: updated.isActive });
  } catch (err) {
    console.error("[TEACHER/TESTS/:id PATCH]", err);
    return NextResponse.json({ success: false, error: "Failed to update." }, { status: 500 });
  }
}

// ─── DELETE — remove test set ──────────────────────────────────
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== "TEACHER") {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await params;
    const testSetId = parseInt(id);
    if (isNaN(testSetId)) {
      return NextResponse.json({ success: false, error: "Invalid ID." }, { status: 400 });
    }

    // Block deletion if students have already taken this test
    const resultCount = await prisma.testResult.count({ where: { testSetId } });
    if (resultCount > 0) {
      return NextResponse.json(
        { success: false, error: `Cannot delete — ${resultCount} student result${resultCount !== 1 ? "s" : ""} exist.` },
        { status: 409 }
      );
    }

    await prisma.testSet.delete({ where: { id: testSetId } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[TEACHER/TESTS/:id DELETE]", err);
    return NextResponse.json({ success: false, error: "Failed to delete." }, { status: 500 });
  }
}
