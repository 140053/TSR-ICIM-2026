// app/api/teacher/tests/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { z } from "zod";

const QuestionSchema = z.object({
  questionNum:  z.number().int().min(1),
  context:      z.string().default("General"),
  questionText: z.string().min(1, "Question text is required."),
  answer:       z.string().min(1, "Answer is required."),
  answerType:   z.enum(["number", "text", "time", "multiple_choice"]).default("number"),
  choices:      z.array(z.string()).length(4).optional().nullable(),
  difficulty:   z.enum(["easy", "average", "difficult"]).default("average"),
  melc:         z.string().optional().nullable(),
  points:       z.number().int().min(1).default(1),
});

const TestSetSchema = z.object({
  title:       z.string().min(2, "Title is required."),
  type:        z.enum(["PRE_TEST", "POST_TEST"]),
  description: z.string().optional().nullable(),
  timeLimit:   z.number().int().min(0).optional().nullable(), // seconds
  moduleId:    z.number().int().optional().nullable(),
  questions:   z.array(QuestionSchema).min(1, "At least one question is required."),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== "TEACHER") {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const body   = await req.json();
    const parsed = TestSetSchema.safeParse(body);

    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return NextResponse.json(
        { success: false, error: issue?.message ?? "Invalid data.", field: issue?.path.join(".") },
        { status: 400 }
      );
    }

    const { title, type, description, timeLimit, moduleId, questions } = parsed.data;

    // Get the teacher's active sections so we can auto-assign the new test set
    const teacherSections = await prisma.section.findMany({
      where:  { teacherId: session.id, isActive: true },
      select: { id: true },
    });

    const testSet = await prisma.$transaction(async (tx) => {
      const newSet = await tx.testSet.create({
        data: {
          title,
          type:        type as any,
          description: description ?? null,
          timeLimit:   timeLimit   ?? null,
          moduleId:    moduleId    ?? null,
          isActive:    false,
        },
      });

      await tx.testQuestion.createMany({
        data: questions.map((q) => ({
          testSetId:    newSet.id,
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

      if (teacherSections.length > 0) {
        await tx.testSetAssignment.createMany({
          data: teacherSections.map((sec) => ({
            testSetId: newSet.id,
            sectionId: sec.id,
          })),
          skipDuplicates: true,
        });
      }

      return newSet;
    });

    return NextResponse.json(
      { success: true, testSetId: testSet.id, redirectTo: "/dashboard/teacher/tests" },
      { status: 201 }
    );
  } catch (err) {
    console.error("[TEACHER/TESTS/CREATE]", err);
    return NextResponse.json(
      { success: false, error: "Failed to create test set. Please try again." },
      { status: 500 }
    );
  }
}
