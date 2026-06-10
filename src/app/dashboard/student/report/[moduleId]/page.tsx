// app/dashboard/student/report/[moduleId]/page.tsx
// Server Component — fetches diagnostic data and passes to client renderer.

import { redirect, notFound } from "next/navigation";
import { getSessionUserFast } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import DiagnosticReport from "./_components/DiagnosticReport";

// ─── Types exported for the client component ──────────────────
export interface ClusterData {
  phase: "UNDERSTANDING" | "ANALYSIS" | "SOLUTION" | "REFLECTION";
  score: number | null;
  level: "PROFICIENT" | "DEVELOPING" | "STRUGGLING" | null;
}

export interface StageBreakdownItem {
  stageNumber: number;
  title:       string;
  phase:       string;
  score:       number | null;
  maxScore:    number;
  gradedAt:    string | null;
  teacherNote: string | null;
}

export interface ReportData {
  student: {
    name:        string;
    avatarEmoji: string;
    avatarName:  string;
    difficulty:  string;
  };
  module: {
    title: string;
    icon:  string;
  };
  overallScore:      number | null;
  needsIntervention: boolean;
  interventionNote:  string | null;
  clusters:          ClusterData[];
  stageBreakdown:    StageBreakdownItem[];
  generatedAt:       string;
}

// ─── Page ─────────────────────────────────────────────────────
export default async function ReportPage({
  params,
}: {
  params: Promise<{ moduleId: string }>;
}) {
  const session = await getSessionUserFast();
  if (!session || session.role !== "STUDENT") redirect("/login");

  const { moduleId: modStr } = await params;
  const moduleId = parseInt(modStr);
  if (isNaN(moduleId)) notFound();

  const [report, module, profile, responses] = await Promise.all([
    prisma.diagnosticReport.findUnique({
      where: { userId_moduleId: { userId: session.id, moduleId } },
    }),
    prisma.module.findUnique({
      where:  { id: moduleId },
      select: { id: true, title: true, icon: true },
    }),
    prisma.studentProfile.findUnique({
      where:  { userId: session.id },
      include: { user: { select: { name: true } } },
    }),
    prisma.stageResponse.findMany({
      where:   { userId: session.id, moduleId },
      include: { stage: { select: { stageNumber: true, title: true, phase: true, maxScore: true } } },
      orderBy: { stage: { stageNumber: "asc" } },
    }),
  ]);

  if (!module) notFound();

  if (!report) {
    // Module not yet completed — redirect back
    redirect(`/dashboard/student/modules/${moduleId}`);
  }

  const data: ReportData = {
    student: {
      name:        profile?.user.name   ?? session.name,
      avatarEmoji: profile?.avatarEmoji ?? "🧙‍♂️",
      avatarName:  profile?.avatarName  ?? "",
      difficulty:  profile?.difficulty  ?? "ADVENTURER",
    },
    module: {
      title: module.title,
      icon:  module.icon,
    },
    overallScore:      report.overallScore,
    needsIntervention: report.needsIntervention,
    interventionNote:  report.interventionNote ?? null,
    clusters: [
      { phase: "UNDERSTANDING", score: report.understandingScore, level: report.understandingLevel as ClusterData["level"] },
      { phase: "ANALYSIS",      score: report.analysisScore,      level: report.analysisLevel      as ClusterData["level"] },
      { phase: "SOLUTION",      score: report.solutionScore,      level: report.solutionLevel      as ClusterData["level"] },
      { phase: "REFLECTION",    score: report.reflectionScore,    level: report.reflectionLevel    as ClusterData["level"] },
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
  };

  return <DiagnosticReport data={data} moduleId={moduleId} />;
}
