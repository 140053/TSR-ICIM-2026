// app/api/diagnostic/[userId]/[moduleId]/route.ts
//
// GET /api/diagnostic/[userId]/[moduleId]
//   Returns a student's DiagnosticReport for a module.
//   Access rules:
//     STUDENT  — can only access their own report (userId must match session)
//     TEACHER  — can access reports for students in their sections
//     ADMIN    — can access any report

import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ userId: string; moduleId: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const { userId: userIdStr, moduleId: modStr } = await params;
    const targetUserId = parseInt(userIdStr);
    const moduleId     = parseInt(modStr);

    if (isNaN(targetUserId) || isNaN(moduleId)) {
      return NextResponse.json({ success: false, error: "Invalid parameters." }, { status: 400 });
    }

    // ── Access control ────────────────────────────────────────
    if (session.role === "STUDENT") {
      if (session.id !== targetUserId) {
        return NextResponse.json({ success: false, error: "Access denied." }, { status: 403 });
      }
    } else if (session.role === "TEACHER") {
      // Verify the student belongs to one of this teacher's sections
      const profile = await prisma.studentProfile.findUnique({
        where:  { userId: targetUserId },
        select: { section: { select: { teacherId: true } } },
      });
      if (profile?.section?.teacherId !== session.id) {
        return NextResponse.json({ success: false, error: "Access denied." }, { status: 403 });
      }
    }
    // ADMIN: no additional check

    // ── Fetch data ────────────────────────────────────────────
    const [report, module, targetUser, responses] = await Promise.all([
      prisma.diagnosticReport.findUnique({
        where: { userId_moduleId: { userId: targetUserId, moduleId } },
      }),
      prisma.module.findUnique({
        where:  { id: moduleId },
        select: { id: true, title: true, icon: true },
      }),
      prisma.user.findUnique({
        where:  { id: targetUserId },
        select: { id: true, name: true, profile: { select: { avatarEmoji: true, avatarName: true, difficulty: true } } },
      }),
      prisma.stageResponse.findMany({
        where:   { userId: targetUserId, moduleId },
        include: { stage: { select: { stageNumber: true, title: true, phase: true, maxScore: true } } },
        orderBy: { stage: { stageNumber: "asc" } },
      }),
    ]);

    if (!module)      return NextResponse.json({ success: false, error: "Module not found." },  { status: 404 });
    if (!targetUser)  return NextResponse.json({ success: false, error: "User not found." },    { status: 404 });
    if (!report)      return NextResponse.json({ success: false, error: "Report not yet generated." }, { status: 404 });

    return NextResponse.json({
      success: true,
      module,
      student: {
        id:          targetUser.id,
        name:        targetUser.name,
        avatarEmoji: targetUser.profile?.avatarEmoji ?? "🧙‍♂️",
        avatarName:  targetUser.profile?.avatarName  ?? "",
        difficulty:  targetUser.profile?.difficulty  ?? "ADVENTURER",
      },
      report: {
        overallScore:      report.overallScore,
        needsIntervention: report.needsIntervention,
        interventionNote:  report.interventionNote,
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
          teacherNote: r.teacherNote ?? null,
        })),
        generatedAt: report.generatedAt.toISOString(),
        updatedAt:   report.updatedAt.toISOString(),
      },
    });
  } catch (err) {
    console.error("[DIAGNOSTIC]", err);
    return NextResponse.json({ success: false, error: "Failed to load diagnostic." }, { status: 500 });
  }
}
