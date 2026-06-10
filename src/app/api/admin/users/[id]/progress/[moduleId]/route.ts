// DELETE /api/admin/users/[id]/progress/[moduleId]
// Resets a student's progress for one module: removes ModuleProgress,
// all StageResponses, and the DiagnosticReport for that user+module pair.

import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string; moduleId: string }> };

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const session = await getSessionUser(req);
  if (!session || session.role !== "ADMIN")
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { id, moduleId: moduleIdStr } = await params;
  const userId   = parseInt(id);
  const moduleId = parseInt(moduleIdStr);

  if (isNaN(userId) || isNaN(moduleId))
    return NextResponse.json({ success: false, error: "Invalid params" }, { status: 400 });

  try {
    await prisma.$transaction([
      prisma.stageResponse.deleteMany({ where: { userId, moduleId } }),
      prisma.diagnosticReport.deleteMany({ where: { userId, moduleId } }),
      prisma.moduleProgress.deleteMany({ where: { userId, moduleId } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to reset progress.";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
