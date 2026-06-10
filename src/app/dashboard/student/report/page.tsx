// app/dashboard/student/report/page.tsx
// Server Component — lists all completed modules with their diagnostic report summaries.

import { redirect } from "next/navigation";
import { getSessionUserFast } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import MyReportsClient from "./_components/MyReportsClient";

// ─── Exported types ───────────────────────────────────────────
export interface ReportSummaryCard {
  moduleId:          number;
  moduleIcon:        string;
  moduleTitle:       string;
  context:           string;
  overallScore:      number | null;
  needsIntervention: boolean;
  clusters: {
    phase: string;
    score: number | null;
    level: string | null;
  }[];
  completedAt: string;
  generatedAt: string;
}

export interface MyReportsData {
  student: {
    name:        string;
    avatarEmoji: string;
    difficulty:  string;
  };
  reports: ReportSummaryCard[];
}

// ─── Page ─────────────────────────────────────────────────────
export default async function MyReportsPage() {
  const session = await getSessionUserFast();
  if (!session || session.role !== "STUDENT") redirect("/login");

  const [profile, completedProgress, diagReports, ctxList] = await Promise.all([
    prisma.studentProfile.findUnique({
      where:   { userId: session.id },
      include: { user: { select: { name: true } } },
    }),
    prisma.moduleProgress.findMany({
      where:   { userId: session.id, status: "COMPLETED" },
      orderBy: { lastActiveAt: "desc" },
      include: { module: { select: { id: true, title: true, icon: true, context: true } } },
    }),
    prisma.diagnosticReport.findMany({
      where: { userId: session.id },
    }),
    prisma.scenarioContext.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  const ctxMap = new Map(ctxList.map((c) => [c.key, c]));
  const contextLabel = (key: string) => {
    const c = ctxMap.get(key);
    return c ? `${c.icon} ${c.description ?? c.label}` : key;
  };

  if (!profile || !profile.setupDone) redirect("/onboarding");

  const diagMap = new Map(diagReports.map((d) => [d.moduleId, d]));

  const reports: ReportSummaryCard[] = completedProgress.map((p) => {
    const diag = diagMap.get(p.moduleId);
    return {
      moduleId:          p.module.id,
      moduleIcon:        p.module.icon,
      moduleTitle:       p.module.title,
      context:           contextLabel(p.module.context),
      overallScore:      diag?.overallScore   ?? null,
      needsIntervention: diag?.needsIntervention ?? false,
      clusters: [
        { phase: "Understanding", score: diag?.understandingScore ?? null, level: diag?.understandingLevel ?? null },
        { phase: "Analysis",      score: diag?.analysisScore      ?? null, level: diag?.analysisLevel      ?? null },
        { phase: "Solution",      score: diag?.solutionScore      ?? null, level: diag?.solutionLevel      ?? null },
        { phase: "Reflection",    score: diag?.reflectionScore    ?? null, level: diag?.reflectionLevel    ?? null },
      ],
      completedAt: (p.lastActiveAt ?? new Date()).toLocaleDateString("en-PH", {
        month: "long", day: "numeric", year: "numeric",
      }),
      generatedAt: diag
        ? diag.generatedAt.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })
        : "—",
    };
  });

  const data: MyReportsData = {
    student: {
      name:        profile.user.name,
      avatarEmoji: profile.avatarEmoji ?? "🧙‍♂️",
      difficulty:  profile.difficulty,
    },
    reports,
  };

  return <MyReportsClient data={data} />;
}
