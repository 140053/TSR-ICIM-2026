// app/api/student/modules/[moduleId]/diagnostic/route.ts
//
// GET /api/student/modules/[moduleId]/diagnostic
//   Returns the student's own DiagnosticReport for a module, including
//   cluster scores and a stage-by-stage breakdown.
//   Only available after all 12 stages are complete (report auto-generated on stage 12).

import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ moduleId: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== "STUDENT") {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const { moduleId: modStr } = await params;
    const moduleId = parseInt(modStr);
    if (isNaN(moduleId)) {
      return NextResponse.json({ success: false, error: "Invalid module id." }, { status: 400 });
    }

    const [report, module, responses] = await Promise.all([
      prisma.diagnosticReport.findUnique({
        where: { userId_moduleId: { userId: session.id, moduleId } },
      }),
      prisma.module.findUnique({
        where:  { id: moduleId },
        select: { id: true, title: true, icon: true },
      }),
      prisma.stageResponse.findMany({
        where:   { userId: session.id, moduleId },
        include: { stage: { select: { stageNumber: true, title: true, phase: true, maxScore: true } } },
        orderBy: { stage: { stageNumber: "asc" } },
      }),
    ]);

    if (!module) {
      return NextResponse.json({ success: false, error: "Module not found." }, { status: 404 });
    }

    if (!report) {
      return NextResponse.json(
        { success: false, error: "Report not yet generated. Complete all 12 stages first." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      module,
      report: {
        overallScore:      report.overallScore,
        needsIntervention: report.needsIntervention,
        clusters: [
          { phase: "UNDERSTANDING", score: report.understandingScore, level: report.understandingLevel },
          { phase: "ANALYSIS",      score: report.analysisScore,      level: report.analysisLevel      },
          { phase: "SOLUTION",      score: report.solutionScore,      level: report.solutionLevel      },
          { phase: "REFLECTION",    score: report.reflectionScore,    level: report.reflectionLevel    },
        ],
        stageBreakdown: responses.map((r) => ({
          stageNumber: r.stage.stageNumber,
          title:       r.stage.title,
          phase:       r.stage.phase,
          score:       r.score,
          maxScore:    r.stage.maxScore,
          gradedAt:    r.gradedAt?.toISOString() ?? null,
        })),
        generatedAt: report.generatedAt.toISOString(),
      },
    });
  } catch (err) {
    console.error("[STUDENT/DIAGNOSTIC]", err);
    return NextResponse.json({ success: false, error: "Failed to load diagnostic." }, { status: 500 });
  }
}
