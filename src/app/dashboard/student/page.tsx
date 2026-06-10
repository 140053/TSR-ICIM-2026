// app/dashboard/student/page.tsx
//
// Server Component — auth guard + DB queries, then hands off to
// the pure-client <StudentDashboard /> component.

import { redirect } from "next/navigation";
import { getSessionUserFast } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import StudentDashboard from "./_components/StudentDashboard";


// ─── Data types exported so the client component can import them ──
export interface StudentInfo {
  id:          number;
  name:        string;
  initials:    string;
  avatarEmoji: string;
  avatarName:  string;
  difficulty:  string;
  section:     string;
  xp:          number;
  level:       number;
}

export interface ActiveModule {
  id:           number;
  title:        string;
  icon:         string;
  context:      string;
  scenario:     string;
  currentStage: number;
  totalStages:  number;          // always 12
  percentScore: number;
  dueDate:      string | null;
  difficulty:   string;
  stageStatuses: StageStatus[];
}

export interface StageStatus {
  num:    number;
  title:  string;
  sub:    string;
  status: "done" | "current" | "locked";
  score:  string;
}

export interface DiagnosticCluster {
  label:    string;
  icon:     string;
  pct:      number;
  color:    string;
  badge:    string;
  badgeCls: string;
  pending:  boolean;
}

export interface UpcomingModule {
  id:    number;
  title: string;
  icon:  string;
}

export interface StudentDashboardData {
  student:        StudentInfo;
  stats: {
    modulesAssigned: number;
    stagesCompleted: number;
    totalStages:     number;
    overallScore:    number | null;
    timeSpentToday:  number;          // minutes
  };
  activeModule:    ActiveModule | null;
  diagnostic:      DiagnosticCluster[];
  upcomingModules: UpcomingModule[];
  hasPreTest:      boolean;
  hasPostTest:     boolean;
}

// ─── Helpers ─────────────────────────────────────────────────
function initials(name: string): string {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function difficultyLabel(d: string): string {
  if (d === "APPRENTICE") return "🌱 Apprentice";
  if (d === "CHAMPION")   return "🔥 Champion";
  return "⚔️ Adventurer";
}

function phaseOf(stageNum: number): "blue" | "purple" | "amber" | "green" {
  if (stageNum <= 3)  return "blue";
  if (stageNum <= 7)  return "purple";
  if (stageNum <= 10) return "amber";
  return "green";
}

function badgeFor(pct: number): { badge: string; badgeCls: string } {
  if (pct >= 80) return { badge: "Good",    badgeCls: "bg-[#D1FAE5] text-[#4A9B7F]" };
  if (pct >= 60) return { badge: "Fair",    badgeCls: "bg-[#FEF3C7] text-[#F59E0B]" };
  return             { badge: "Needs Help", badgeCls: "bg-[#FEE2E2] text-[#E05C5C]" };
}

const STAGE_TITLES: Record<number, { title: string; sub: string }> = {
  1:  { title: "Identify & Categorize",     sub: "Understanding the problem type"  },
  2:  { title: "Select & Prioritize",        sub: "Ranking what matters most"       },
  3:  { title: "Define the Problem",         sub: "Restate in your own words"       },
  4:  { title: "Analyze Information",        sub: "Extract given data"              },
  5:  { title: "Identify Constraints",       sub: "What are the limits?"            },
  6:  { title: "Root Causes",                sub: "Why does this problem exist?"    },
  7:  { title: "Data Analysis",              sub: "Crunch the numbers"              },
  8:  { title: "Develop Possible Solutions", sub: "Propose your plans"              },
  9:  { title: "Anticipate Problems",        sub: "What could go wrong?"            },
  10: { title: "Trial Implementation",       sub: "Check your budget plan"          },
  11: { title: "Choose Best Solution",       sub: "Decide and justify"              },
  12: { title: "Reflect & Review",           sub: "What did you learn?"             },
};

// ─── Server Component ─────────────────────────────────────────
export default async function StudentDashboardPage() {
  // 1. Auth guard
  const session = await getSessionUserFast();
  if (!session || session.role !== "STUDENT") redirect("/login");

  // 2. Student profile + section
  const profile = await prisma.studentProfile.findUnique({
    where:   { userId: session.id },
    include: {
      user:    true,
      section: true,
    },
  });

  if (!profile) redirect("/onboarding");
  if (!profile.setupDone) redirect("/onboarding");

  // 3. All module progress for this student
  const allProgress = await prisma.moduleProgress.findMany({
    where:   { userId: session.id },
    include: { module: true },
    orderBy: { lastActiveAt: "desc" },
  });

  // Active = IN_PROGRESS; completed = COMPLETED
  const activeProgress  = allProgress.find((p) => p.status === "IN_PROGRESS");
  const completedCount  = allProgress.filter((p) => p.status === "COMPLETED").length;

  // 4. Stages completed count (responses submitted)
  const stagesDone = await prisma.stageResponse.count({
    where: { userId: session.id },
  });

  // 5. Overall score across all completed modules
  const completedModules = allProgress.filter(
    (p) => p.status === "COMPLETED" && p.percentScore != null
  );
  const overallScore = completedModules.length
    ? Math.round(
        completedModules.reduce((s, p) => s + (p.percentScore ?? 0), 0) /
          completedModules.length
      )
    : null;

  // 6. Time spent today (sum of stage responses created today)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayResponses = await prisma.stageResponse.findMany({
    where: {
      userId:    session.id,
      createdAt: { gte: todayStart },
      timeSpent: { not: null },
    },
    select: { timeSpent: true },
  });
  const timeSpentToday = Math.round(
    todayResponses.reduce((s, r) => s + (r.timeSpent ?? 0), 0) / 60
  );

  // 7. Build the active module block
  let activeModule: ActiveModule | null = null;

  if (activeProgress) {
    // Fetch all stage responses for this module
    const responses = await prisma.stageResponse.findMany({
      where:   { userId: session.id, moduleId: activeProgress.moduleId },
      include: { stage: true },
      orderBy: { stage: { stageNumber: "asc" } },
    });

    const responseMap = new Map(
      responses.map((r) => [r.stage.stageNumber, r])
    );

    const stageStatuses: StageStatus[] = Array.from({ length: 12 }, (_, i) => {
      const num = i + 1;
      const res = responseMap.get(num);
      const meta = STAGE_TITLES[num] ?? { title: `Stage ${num}`, sub: "" };

      let status: "done" | "current" | "locked" = "locked";
      let score = "—";

      if (res) {
        status = "done";
        score  = res.score != null ? `${res.score}/${res.stage.maxScore}` : "—/10";
      } else if (num === activeProgress.currentStage) {
        status = "current";
        score  = "▶";
      }

      return { num, title: meta.title, sub: meta.sub, status, score };
    });

    const assignment = await prisma.moduleAssignment.findFirst({
      where: { moduleId: activeProgress.moduleId },
    });

    activeModule = {
      id:           activeProgress.moduleId,
      title:        activeProgress.module.title,
      icon:         activeProgress.module.icon,
      context:      activeProgress.module.context,
      scenario:     activeProgress.module.scenario.slice(0, 180),
      currentStage: activeProgress.currentStage,
      totalStages:  12,
      percentScore: Math.round(activeProgress.percentScore ?? 0),
      dueDate:      assignment?.dueDate
        ? assignment.dueDate.toLocaleDateString("en-PH", { month: "short", day: "numeric" })
        : null,
      difficulty:   difficultyLabel(profile.difficulty),
      stageStatuses,
    };
  }

  // 8. Diagnostic report for the active module
  const diagReport = activeProgress
    ? await prisma.diagnosticReport.findUnique({
        where: { userId_moduleId: { userId: session.id, moduleId: activeProgress.moduleId } },
      })
    : null;

  const diagnostic: DiagnosticCluster[] = [
    {
      label: "🔵 Problem Understanding", icon: "🔵",
      color: "#3B82C4",
      pct:   Math.round(diagReport?.understandingScore ?? 0),
      pending: diagReport?.understandingScore == null,
      ...badgeFor(Math.round(diagReport?.understandingScore ?? 0)),
    },
    {
      label: "🟣 Analysis", icon: "🟣",
      color: "#8B5CF6",
      pct:   Math.round(diagReport?.analysisScore ?? 0),
      pending: diagReport?.analysisScore == null,
      ...badgeFor(Math.round(diagReport?.analysisScore ?? 0)),
    },
    {
      label: "🟠 Solution Development", icon: "🟠",
      color: "#F59E0B",
      pct:   Math.round(diagReport?.solutionScore ?? 0),
      pending: diagReport?.solutionScore == null,
      ...badgeFor(Math.round(diagReport?.solutionScore ?? 0)),
    },
    {
      label: "🟢 Reflection", icon: "🟢",
      color: "#4A9B7F",
      pct:   Math.round(diagReport?.reflectionScore ?? 0),
      pending: diagReport?.reflectionScore == null,
      ...badgeFor(Math.round(diagReport?.reflectionScore ?? 0)),
    },
  ];

  // 9. Upcoming / not-started modules assigned to this section
  const assignments = profile.sectionId
    ? await prisma.moduleAssignment.findMany({
        where:   { sectionId: profile.sectionId },
        include: { module: true },
      })
    : [];

  const assignedModuleIds = new Set(allProgress.map((p) => p.moduleId));

  const upcomingModules: UpcomingModule[] = assignments
    .filter((a) => !assignedModuleIds.has(a.moduleId) && a.module.status === "ACTIVE")
    .slice(0, 3)
    .map((a) => ({
      id:    a.module.id,
      title: a.module.title,
      icon:  a.module.icon,
    }));

  // 10. Pre/Post test status
  const testResults = await prisma.testResult.findMany({
    where: { userId: session.id },
    select: { type: true },
  });
  const hasPreTest  = testResults.some((t) => t.type === "PRE_TEST");
  const hasPostTest = testResults.some((t) => t.type === "POST_TEST");

  // 11. Build final data object
  const data: StudentDashboardData = {
    student: {
      id:          session.id,
      name:        profile.user.name,
      initials:    initials(profile.user.name),
      avatarEmoji: profile.avatarEmoji,
      avatarName:  profile.avatarName,
      difficulty:  difficultyLabel(profile.difficulty),
      section:     profile.section?.name ?? "—",
      xp:          profile.xp,
      level:       profile.level,
    },
    stats: {
      modulesAssigned: assignments.length || allProgress.length,
      stagesCompleted: stagesDone,
      totalStages:     allProgress.length * 12,
      overallScore,
      timeSpentToday,
    },
    activeModule,
    diagnostic,
    upcomingModules,
    hasPreTest,
    hasPostTest,
  };

  return <StudentDashboard data={data} />;
}