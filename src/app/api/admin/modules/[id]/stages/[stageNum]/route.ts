// POST  /api/admin/modules/[id]/stages/[stageNum]  — create a missing stage
// PATCH /api/admin/modules/[id]/stages/[stageNum]  — update any field of an existing stage

import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string; stageNum: string }> };

const VALID_TYPES = new Set([
  "MULTIPLE_CHOICE", "RANKING", "OPEN_ENDED", "TABLE_INPUT",
  "CHECKLIST", "COMPUTATION", "MULTI_PLAN", "BUDGET_CHECK",
  "SELECT_JUSTIFY", "REFLECTION_SLIDER",
]);

function phaseOf(n: number): string {
  if (n <= 3)  return "UNDERSTANDING";
  if (n <= 7)  return "ANALYSIS";
  if (n <= 10) return "SOLUTION";
  return "REFLECTION";
}

// ─── POST — create a stage that doesn't exist yet ────────────
export async function POST(req: NextRequest, { params }: Ctx) {
  const session = await getSessionUser(req);
  if (!session || session.role !== "ADMIN")
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { id: idStr, stageNum: numStr } = await params;
  const moduleId = parseInt(idStr);
  const stageNum = parseInt(numStr);

  if (isNaN(moduleId) || isNaN(stageNum) || stageNum < 1 || stageNum > 12)
    return NextResponse.json({ success: false, error: "Invalid params" }, { status: 400 });

  const module = await prisma.module.findUnique({ where: { id: moduleId }, select: { id: true } });
  if (!module)
    return NextResponse.json({ success: false, error: "Module not found" }, { status: 404 });

  const existing = await prisma.stage.findUnique({
    where: { moduleId_stageNumber: { moduleId, stageNumber: stageNum } },
  });
  if (existing)
    return NextResponse.json({ success: false, error: "Stage already exists" }, { status: 409 });

  const body = await req.json();
  const { type, title, instruction, hint, maxScore, timeLimit, melc, options, correctAnswer } = body;

  if (!type || !VALID_TYPES.has(type))
    return NextResponse.json({ success: false, error: `Invalid type: ${type}` }, { status: 400 });
  if (!title?.trim())
    return NextResponse.json({ success: false, error: "Stage title is required." }, { status: 400 });
  if (!instruction?.trim())
    return NextResponse.json({ success: false, error: "Stage instruction is required." }, { status: 400 });

  try {
    const stage = await prisma.stage.create({
      data: {
        moduleId,
        stageNumber:   stageNum,
        phase:         phaseOf(stageNum) as any,
        type:          type as any,
        title:         title.trim(),
        instruction:   instruction.trim(),
        hint:          typeof hint === "string" && hint.trim() ? hint.trim() : null,
        maxScore:      Math.max(0, Number(maxScore) || 10),
        timeLimit:     timeLimit != null ? Math.max(0, Number(timeLimit)) : null,
        melc:          typeof melc === "string" && melc.trim() ? melc.trim() : null,
        options:       options ?? null,
        correctAnswer: typeof correctAnswer === "string" && correctAnswer.trim() ? correctAnswer.trim() : null,
      },
    });
    return NextResponse.json({ success: true, stage: { id: stage.id } }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create stage.";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// ─── PATCH — update an existing stage ────────────────────────
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await getSessionUser(req);
  if (!session || session.role !== "ADMIN")
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { id: idStr, stageNum: numStr } = await params;
  const moduleId = parseInt(idStr);
  const stageNum = parseInt(numStr);

  if (isNaN(moduleId) || isNaN(stageNum) || stageNum < 1 || stageNum > 12)
    return NextResponse.json({ success: false, error: "Invalid params" }, { status: 400 });

  const stage = await prisma.stage.findUnique({
    where: { moduleId_stageNumber: { moduleId, stageNumber: stageNum } },
  });
  if (!stage)
    return NextResponse.json({ success: false, error: "Stage not found" }, { status: 404 });

  const body = await req.json();
  const { type, title, instruction, hint, maxScore, timeLimit, melc, options, correctAnswer } = body;

  const data: Record<string, unknown> = {};

  if (typeof type === "string" && VALID_TYPES.has(type)) data.type = type;
  else if (type !== undefined)
    return NextResponse.json({ success: false, error: `Invalid type: ${type}` }, { status: 400 });

  if (typeof title       === "string" && title.trim())       data.title       = title.trim();
  if (typeof instruction === "string" && instruction.trim()) data.instruction = instruction.trim();
  if (hint          !== undefined) data.hint          = typeof hint === "string" && hint.trim() ? hint.trim() : null;
  if (maxScore      !== undefined) data.maxScore      = Math.max(0, Number(maxScore) || 0);
  if (timeLimit     !== undefined) data.timeLimit     = timeLimit != null ? Math.max(0, Number(timeLimit)) : null;
  if (melc          !== undefined) data.melc          = typeof melc === "string" && melc.trim() ? melc.trim() : null;
  if (options       !== undefined) data.options       = options;
  if (correctAnswer !== undefined)
    data.correctAnswer = typeof correctAnswer === "string" && correctAnswer.trim() ? correctAnswer.trim() : null;

  if (Object.keys(data).length === 0)
    return NextResponse.json({ success: false, error: "No fields to update." }, { status: 400 });

  try {
    await prisma.stage.update({
      where: { moduleId_stageNumber: { moduleId, stageNumber: stageNum } },
      data,
    });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update stage.";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
