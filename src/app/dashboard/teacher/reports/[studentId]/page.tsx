// app/dashboard/teacher/reports/[studentId]/page.tsx
// Server Component — full diagnostic report for one student, teacher view.

import { redirect, notFound } from "next/navigation";
import { getSessionUserFast } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import StudentReportClient from "./_components/StudentReportClient";

// ─── Exported types ───────────────────────────────────────────
export interface StageRow {
  stageNumber: number;
  title:       string;
  phase:       string;
  stageType:   string;
  score:       number | null;
  maxScore:    number;
  isCorrect:   boolean | null;
  gradedAt:    string | null;
  teacherNote: string | null;
  autoScored:  boolean;
}

export interface ModuleReport {
  moduleId:          number;
  moduleTitle:       string;
  moduleIcon:        string;
  context:           string;
  overallScore:      number | null;
  needsIntervention: boolean;
  interventionNote:  string | null;
  understanding:     number | null;
  understandingLevel:string | null;
  analysis:          number | null;
  analysisLevel:     string | null;
  solution:          number | null;
  solutionLevel:     string | null;
  reflection:        number | null;
  reflectionLevel:   string | null;
  completedAt:       string | null;
  generatedAt:       string | null;
  stages:            StageRow[];
}

export interface StudentReportData {
  student: {
    userId:      number;
    name:        string;
    initials:    string;
    avatarEmoji: string;
    avatarName:  string;
    difficulty:  string;
    section:     string;
    xp:          number;
    level:       number;
  };
  teacher: { name: string };
  reports: ModuleReport[];
}

// ─── Helpers ─────────────────────────────────────────────────
function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}
const AUTO_SCORED_STAGES = new Set([1, 2, 5, 7, 9, 10, 11]);

// ─── Page ─────────────────────────────────────────────────────
export default async function StudentReportPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const session = await getSessionUserFast();
  if (!session || session.role !== "TEACHER") redirect("/login");

  const { studentId: sid } = await params;
  const studentId = parseInt(sid);
  if (isNaN(studentId)) notFound();

  // Verify the student is in one of this teacher's sections
  const profile = await prisma.studentProfile.findUnique({
    where:   { userId: studentId },
    include: {
      user:    true,
      section: true,
    },
  });

  if (!profile) notFound();

  // Confirm teacher owns this section
  if (profile.sectionId) {
    const section = await prisma.section.findUnique({
      where: { id: profile.sectionId },
    });
    if (!section || section.teacherId !== session.id) notFound();
  }

  // Fetch all completed module progress + diagnostic reports + stage responses + contexts
  const [allProgress, diagReports, allResponses, ctxList] = await Promise.all([
    prisma.moduleProgress.findMany({
      where:   { userId: studentId, status: "COMPLETED" },
      include: { module: { select: { id: true, title: true, icon: true, context: true } } },
      orderBy: { lastActiveAt: "desc" },
    }),
    prisma.diagnosticReport.findMany({
      where: { userId: studentId },
    }),
    prisma.stageResponse.findMany({
      where:   { userId: studentId },
      select: {
        stageId:     true,
        moduleId:    true,
        score:       true,
        isCorrect:   true,
        gradedAt:    true,
        teacherNote: true,
      },
    }),
    prisma.scenarioContext.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  const ctxMap = new Map(ctxList.map((c) => [c.key, c]));
  const contextLabel = (key: string) => {
    const c = ctxMap.get(key);
    return c ? `${c.icon} ${c.description ?? c.label}` : key;
  };

  const diagMap = new Map(diagReports.map((d) => [d.moduleId, d]));

  // Fetch all 12 stages for each completed module — source of truth for stage names
  const completedModuleIds = allProgress.map((p) => p.moduleId);
  const allStages = completedModuleIds.length > 0
    ? await prisma.stage.findMany({
        where:   { moduleId: { in: completedModuleIds } },
        select:  { id: true, moduleId: true, stageNumber: true, title: true, phase: true, maxScore: true, type: true },
        orderBy: { stageNumber: "asc" },
      })
    : [];

  // Index stages by moduleId → stageNumber
  const stagesByModule = new Map<number, typeof allStages>();
  for (const s of allStages) {
    if (!stagesByModule.has(s.moduleId)) stagesByModule.set(s.moduleId, []);
    stagesByModule.get(s.moduleId)!.push(s);
  }

  // Index responses by stageId for quick lookup
  const responseByStageId = new Map<number, typeof allResponses[number]>();
  for (const r of allResponses) {
    responseByStageId.set(r.stageId, r);
  }

  const reports: ModuleReport[] = allProgress.map((p) => {
    const diag   = diagMap.get(p.moduleId);
    const stages = stagesByModule.get(p.moduleId) ?? [];

    // Build one row per stage from the module definition; overlay response data where it exists
    const stageRows: StageRow[] = stages.map((s) => {
      const resp = responseByStageId.get(s.id) ?? null;
      return {
        stageNumber: s.stageNumber,
        title:       s.title,          // always the module's own stage title
        phase:       s.phase,
        stageType:   s.type,
        score:       resp?.score       ?? null,
        maxScore:    s.maxScore,
        isCorrect:   resp?.isCorrect   ?? null,
        gradedAt:    resp?.gradedAt
          ? resp.gradedAt.toLocaleDateString("en-PH", { month: "short", day: "numeric" })
          : null,
        teacherNote: resp?.teacherNote ?? null,
        autoScored:  AUTO_SCORED_STAGES.has(s.stageNumber),
      };
    });

    return {
      moduleId:          p.module.id,
      moduleTitle:       p.module.title,
      moduleIcon:        p.module.icon,
      context:           contextLabel(p.module.context),
      overallScore:      diag?.overallScore      ?? null,
      needsIntervention: diag?.needsIntervention ?? false,
      interventionNote:  diag?.interventionNote  ?? null,
      understanding:     diag?.understandingScore ?? null,
      understandingLevel:diag?.understandingLevel ?? null,
      analysis:          diag?.analysisScore      ?? null,
      analysisLevel:     diag?.analysisLevel      ?? null,
      solution:          diag?.solutionScore      ?? null,
      solutionLevel:     diag?.solutionLevel      ?? null,
      reflection:        diag?.reflectionScore    ?? null,
      reflectionLevel:   diag?.reflectionLevel    ?? null,
      completedAt: p.lastActiveAt
        ? p.lastActiveAt.toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" })
        : null,
      generatedAt: diag
        ? diag.generatedAt.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })
        : null,
      stages: stageRows,
    };
  });

  const data: StudentReportData = {
    student: {
      userId:      studentId,
      name:        profile.user.name,
      initials:    initials(profile.user.name),
      avatarEmoji: profile.avatarEmoji ?? "🧙‍♂️",
      avatarName:  profile.avatarName  ?? "",
      difficulty:  profile.difficulty,
      section:     profile.section?.name ?? "—",
      xp:          profile.xp,
      level:       profile.level,
    },
    teacher: { name: session.name },
    reports,
  };

  return <StudentReportClient data={data} />;
}
