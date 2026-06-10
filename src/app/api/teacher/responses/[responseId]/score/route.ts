// app/api/teacher/responses/[responseId]/score/route.ts
//
// PATCH { score: number, teacherNote?: string }
//   Teacher grades an open-ended stage response.
//   Verifies the student belongs to a section the teacher owns.

import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const Schema = z.object({
  score:       z.number().int().min(0),
  teacherNote: z.string().max(500).optional(),
});

type Ctx = { params: Promise<{ responseId: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== "TEACHER") {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const { responseId: idStr } = await params;
    const responseId = parseInt(idStr);
    if (isNaN(responseId)) {
      return NextResponse.json({ success: false, error: "Invalid ID." }, { status: 400 });
    }

    const body   = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? "Invalid data." },
        { status: 400 }
      );
    }

    const { score, teacherNote } = parsed.data;

    // Fetch response + verify student belongs to one of this teacher's sections
    const response = await prisma.stageResponse.findUnique({
      where:   { id: responseId },
      include: {
        user:  { include: { profile: { include: { section: true } } } },
        stage: { select: { maxScore: true } },
      },
    });

    if (!response) {
      return NextResponse.json({ success: false, error: "Response not found." }, { status: 404 });
    }

    if (response.user.profile?.section?.teacherId !== session.id) {
      return NextResponse.json({ success: false, error: "Forbidden." }, { status: 403 });
    }

    const clampedScore = Math.min(score, response.stage.maxScore);

    await prisma.stageResponse.update({
      where: { id: responseId },
      data: {
        score:       clampedScore,
        teacherNote: teacherNote ?? null,
        gradedAt:    new Date(),
        updatedAt:   new Date(),
      },
    });

    return NextResponse.json({ success: true, score: clampedScore });
  } catch (err) {
    console.error("[TEACHER/GRADE]", err);
    return NextResponse.json({ success: false, error: "Failed to save grade." }, { status: 500 });
  }
}
