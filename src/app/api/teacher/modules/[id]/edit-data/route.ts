// GET /api/teacher/modules/[id]/edit-data
// Returns module metadata + all 12 stages for the teacher edit page.

import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  const session = await getSessionUser(req);
  if (!session || session.role !== "TEACHER")
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { id: idStr } = await params;
  const moduleId = parseInt(idStr);
  if (isNaN(moduleId))
    return NextResponse.json({ success: false, error: "Invalid module id" }, { status: 400 });

  // Access check: assigned to teacher's section, or unassigned draft
  const assignment = await prisma.moduleAssignment.findFirst({
    where: { moduleId, section: { teacherId: session.id } },
  });
  if (!assignment) {
    const anyAssignment = await prisma.moduleAssignment.findFirst({ where: { moduleId } });
    if (anyAssignment)
      return NextResponse.json({ success: false, error: "Not authorized" }, { status: 403 });
  }

  const module = await prisma.module.findUnique({
    where:   { id: moduleId },
    include: { stages: { orderBy: { stageNumber: "asc" } } },
  });

  if (!module)
    return NextResponse.json({ success: false, error: "Module not found" }, { status: 404 });

  return NextResponse.json({
    success: true,
    module: {
      id:           module.id,
      title:        module.title,
      subtitle:     module.subtitle,
      scenario:     module.scenario,
      bannerUrl:    module.bannerUrl,
      context:      module.context,
      icon:         module.icon,
      status:       module.status,
      timeEstimate: module.timeEstimate,
    },
    stages: module.stages.map(s => ({
      stageNumber:   s.stageNumber,
      title:         s.title,
      instruction:   s.instruction,
      hint:          s.hint,
      maxScore:      s.maxScore,
      type:          s.type,
      options:       s.options,
      correctAnswer: s.correctAnswer,
    })),
  });
}
