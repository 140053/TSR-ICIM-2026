// PATCH /api/teacher/modules/[id]/stages/[stageNum]
// Teacher-only: update a single stage's content.
// Verifies teacher has access to the module before allowing edits.

import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string; stageNum: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await getSessionUser(req);
  if (!session || session.role !== "TEACHER")
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { id: idStr, stageNum: numStr } = await params;
  const moduleId = parseInt(idStr);
  const stageNum = parseInt(numStr);

  if (isNaN(moduleId) || isNaN(stageNum) || stageNum < 1 || stageNum > 12)
    return NextResponse.json({ success: false, error: "Invalid params" }, { status: 400 });

  // Access check: module assigned to teacher's section, or unassigned draft
  const assignment = await prisma.moduleAssignment.findFirst({
    where: { moduleId, section: { teacherId: session.id } },
  });
  if (!assignment) {
    const anyAssignment = await prisma.moduleAssignment.findFirst({ where: { moduleId } });
    if (anyAssignment)
      return NextResponse.json({ success: false, error: "Not authorized" }, { status: 403 });
  }

  const stage = await prisma.stage.findUnique({
    where: { moduleId_stageNumber: { moduleId, stageNumber: stageNum } },
  });
  if (!stage)
    return NextResponse.json({ success: false, error: "Stage not found" }, { status: 404 });

  const body = await req.json();
  const { title, instruction, hint, maxScore, options, correctAnswer } = body;

  const data: Record<string, unknown> = {};
  if (typeof title       === "string" && title.trim())       data.title       = title.trim();
  if (typeof instruction === "string" && instruction.trim()) data.instruction = instruction.trim();
  if (hint !== undefined)
    data.hint = typeof hint === "string" && hint.trim() ? hint.trim() : null;
  if (maxScore !== undefined)
    data.maxScore = Math.max(0, Number(maxScore) || 0);
  if (options !== undefined)
    data.options = options;
  if (correctAnswer !== undefined)
    data.correctAnswer = typeof correctAnswer === "string" && correctAnswer.trim()
      ? correctAnswer.trim() : null;

  if (Object.keys(data).length === 0)
    return NextResponse.json({ success: false, error: "No fields to update." }, { status: 400 });

  try {
    await prisma.stage.update({
      where: { moduleId_stageNumber: { moduleId, stageNumber: stageNum } },
      data,
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to update stage.";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
