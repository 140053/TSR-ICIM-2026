import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const [modules, progress, responses, diagnostics] = await Promise.all([
    prisma.module.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        stages: { orderBy: { stageNumber: "asc" } },
        assignments: {
          include: {
            section: { select: { id: true, name: true, emoji: true, gradeLevel: true } },
          },
        },
      },
    }),

    prisma.moduleProgress.findMany({
      orderBy: { startedAt: "asc" },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    }),

    prisma.stageResponse.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        stage: { select: { stageNumber: true, moduleId: true, phase: true, type: true } },
        user: { select: { id: true, name: true } },
      },
    }),

    prisma.diagnosticReport.findMany({
      orderBy: { generatedAt: "asc" },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    }),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    exportedBy: { id: user.id, email: user.email },
    summary: {
      totalModules:    modules.length,
      totalProgress:   progress.length,
      totalResponses:  responses.length,
      totalDiagnostics: diagnostics.length,
    },
    modules,
    progress,
    stageResponses: responses,
    diagnosticReports: diagnostics,
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type":        "application/json",
      "Content-Disposition": `attachment; filename="tsr-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
