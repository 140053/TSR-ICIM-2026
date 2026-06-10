// app/api/student/modules/[moduleId]/completion/route.ts
// GET — returns final score after module completion

import { NextRequest, NextResponse } from "next/server";
import { getSessionUserFast } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  const session = await getSessionUserFast();
  if (!session || session.role !== "STUDENT") {
    return NextResponse.json({ success: false }, { status: 401 });
  }

  const { moduleId: modStr } = await params;
  const moduleId = parseInt(modStr);
  if (isNaN(moduleId)) {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  const [progress, diag] = await Promise.all([
    prisma.moduleProgress.findUnique({
      where: { userId_moduleId: { userId: session.id, moduleId } },
      select: { percentScore: true, completedAt: true, status: true },
    }),
    prisma.diagnosticReport.findUnique({
      where: { userId_moduleId: { userId: session.id, moduleId } },
      select: { overallScore: true, needsIntervention: true },
    }),
  ]);

  if (!progress || progress.status !== "COMPLETED") {
    return NextResponse.json({ success: false, error: "Module not completed." }, { status: 404 });
  }

  return NextResponse.json({
    success:       true,
    overallScore:  diag?.overallScore ?? progress.percentScore ?? 0,
    needsIntervention: diag?.needsIntervention ?? false,
    completedAt:   progress.completedAt?.toISOString() ?? null,
  });
}