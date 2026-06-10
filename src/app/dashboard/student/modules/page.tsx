// app/dashboard/student/modules/page.tsx
// Server Component — auth guard + DB queries → MyModulesClient

import { redirect } from "next/navigation";
import { getSessionUserFast } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import MyModulesClient from "./_components/MyModulesClient";

// ─── Exported types ───────────────────────────────────────────
export type ModuleStatus = "in_progress" | "completed" | "not_started" | "locked";

export interface StageRow {
  num:    number;
  title:  string;
  sub:    string;
  status: "done" | "current" | "locked";
  score:  string;
  phase:  "blue" | "purple" | "amber" | "green";
}

export interface DiagSnapshot {
  label:    string;
  icon:     string;
  pct:      number;
  color:    string;
  badge:    string;
  badgeCls: string;
  pending:  boolean;
}

export interface PhaseBreakdown {
  label:      string;
  color:      string;
  stageDone:  number;
  stageTotal: number;
  pct:        number | null;
  status:     "done" | "active" | "locked";
}

export interface ModuleCard {
  id:            number;
  icon:          string;
  title:         string;
  context:       string;
  scenario:      string;   // raw HTML from rich-text editor
  bannerUrl:     string | null;
  status:        ModuleStatus;
  currentStage:  number;
  percentScore:  number;
  difficulty:    string;
  dueDate:       string | null;
  pips:          ("blue"|"purple"|"amber"|"green"|"current"|"empty")[];
  progressText:  string;
  phases:        PhaseBreakdown[];
  stageRows:     StageRow[];
  diag:          DiagSnapshot[];
  melcTags:      string[];
  timeEstimate:  number | null;
  unlockAfter:   number | null;
  completedCount:number;
}

export interface StudentInfo {
  name:        string;
  avatarEmoji: string;
  avatarName:  string;
  difficulty:  string;
  section:     string;
  xp:          number;
  level:       number;
}

export interface MyModulesData {
  student:         StudentInfo;
  modules:         ModuleCard[];
  completedCount:  number;
  inProgressCount: number;
}

// ─── Helpers ─────────────────────────────────────────────────
const STAGE_TITLES: Record<number, { title: string; sub: string }> = {
  1:  { title: "Identify & Categorize",   sub: "Problem type recognition"  },
  2:  { title: "Select & Prioritize",      sub: "Rank key information"      },
  3:  { title: "Define the Problem",       sub: "Restate in your own words" },
  4:  { title: "Analyze Information",      sub: "Extract given data"        },
  5:  { title: "Identify Constraints",     sub: "What are the limits?"      },
  6:  { title: "Root Causes",              sub: "Why does this exist?"      },
  7:  { title: "Data Analysis",            sub: "Crunch the numbers"        },
  8:  { title: "Develop Solutions",        sub: "Propose your plans"        },
  9:  { title: "Anticipate Problems",      sub: "What could go wrong?"      },
  10: { title: "Trial Implementation",     sub: "Check your plan"           },
  11: { title: "Choose Best Solution",     sub: "Decide and justify"        },
  12: { title: "Reflect & Review",         sub: "What did you learn?"       },
};

function phaseOf(n: number): "blue" | "purple" | "amber" | "green" {
  if (n <= 3)  return "blue";
  if (n <= 7)  return "purple";
  if (n <= 10) return "amber";
  return "green";
}

function diffLabel(d: string) {
  if (d === "APPRENTICE") return "🌱 Apprentice";
  if (d === "CHAMPION")   return "🔥 Champion";
  return "⚔️ Adventurer";
}

// contextLabel — built dynamically from DB at runtime in the page function

function badgeFor(pct: number | null): { badge: string; badgeCls: string } {
  if (pct == null) return { badge: "Pending",    badgeCls: "bg-[#FEF3C7] text-[#F59E0B]" };
  if (pct >= 80)   return { badge: "Good",       badgeCls: "bg-[#D1FAE5] text-[#4A9B7F]" };
  if (pct >= 60)   return { badge: "Fair",       badgeCls: "bg-[#FEF3C7] text-[#F59E0B]" };
  return             { badge: "Needs Help",      badgeCls: "bg-[#FEE2E2] text-[#E05C5C]" };
}

function phaseStatus(
  rows: StageRow[],
  from: number,
  to: number
): "done" | "active" | "locked" {
  const slice = rows.slice(from, to);
  if (slice.every((s) => s.status === "done"))                         return "done";
  if (slice.some((s) => s.status === "done" || s.status === "current")) return "active";
  return "locked";
}

// ─── Server Component ─────────────────────────────────────────
export default async function MyModulesPage() {
  const session = await getSessionUserFast();
  if (!session || session.role !== "STUDENT") redirect("/login");

  const profile = await prisma.studentProfile.findUnique({
    where:   { userId: session.id },
    include: { user: true, section: true },
  });
  if (!profile || !profile.setupDone) redirect("/onboarding");

  const completedCount = await prisma.moduleProgress.count({
    where: { userId: session.id, status: "COMPLETED" },
  });

  // All assignments for this student's section
  const assignments = profile.sectionId
    ? await prisma.moduleAssignment.findMany({
        where:   { sectionId: profile.sectionId },
        orderBy: { assignedAt: "asc" },
      })
    : [];

  // Fetch modules + stages for each assigned moduleId
  const assignedModuleIds = assignments.map((a) => a.moduleId);
  const modulesWithStages = assignedModuleIds.length
    ? await prisma.module.findMany({
        where:   { id: { in: assignedModuleIds } },
        include: { stages: { orderBy: { stageNumber: "asc" } } },
      })
    : [];
  const moduleMap = new Map(modulesWithStages.map((m) => [m.id, m]));

  // All progress rows
  const allProgress = await prisma.moduleProgress.findMany({
    where:   { userId: session.id },
    orderBy: { lastActiveAt: "desc" },
  });
  const progressMap = new Map(allProgress.map((p) => [p.moduleId, p]));

  // Scenario contexts + diagnostic reports
  const [diagReports, ctxList] = await Promise.all([
    prisma.diagnosticReport.findMany({ where: { userId: session.id } }),
    prisma.scenarioContext.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  const diagMap = new Map(diagReports.map((d) => [d.moduleId, d]));
  const ctxMap  = new Map(ctxList.map((c) => [c.key, c]));
  const contextLabel = (key: string) => {
    const c = ctxMap.get(key);
    return c ? `${c.icon} ${c.description ?? c.label}` : key;
  };

  // Stage responses per module — moduleId is a direct field on StageResponse
  const allResponses = await prisma.stageResponse.findMany({
    where:   { userId: session.id },
    include: {
      stage: { select: { stageNumber: true, maxScore: true, title: true } },
    },
  });
  const responsesByModule = new Map<number, typeof allResponses>();
  for (const r of allResponses) {
    // r.moduleId is a plain Int field on StageResponse
    if (!responsesByModule.has(r.moduleId)) responsesByModule.set(r.moduleId, []);
    responsesByModule.get(r.moduleId)!.push(r);
  }

  // Build cards
  const modules: ModuleCard[] = assignments.flatMap((a) => {
    const mod = moduleMap.get(a.moduleId);
    if (!mod) return []; // skip if module not found
    const progress  = progressMap.get(mod.id) ?? null;
    const diag      = diagMap.get(mod.id) ?? null;
    const responses = responsesByModule.get(mod.id) ?? [];
    const resMap    = new Map(responses.map((r) => [r.stage.stageNumber, r]));

    const isLocked = mod.isLocked && (mod.unlockAfter ?? 0) > completedCount;
    const status: ModuleStatus =
      isLocked          ? "locked"       :
      !progress         ? "not_started"  :
      progress.status === "COMPLETED"    ? "completed"   :
      progress.status === "IN_PROGRESS"  ? "in_progress" : "not_started";

    const currentStage = progress?.currentStage ?? 1;
    const pct = Math.round(progress?.percentScore ?? 0);

    // Pips
    const pips: ModuleCard["pips"] = Array.from({ length: 12 }, (_, i) => {
      const n = i + 1;
      if (isLocked) return "empty";
      if (resMap.get(n)) return phaseOf(n);
      if (n === currentStage && status === "in_progress") return "current";
      return "empty";
    });

    // Stage rows
    const stageRows: StageRow[] = Array.from({ length: 12 }, (_, i) => {
      const n    = i + 1;
      const res  = resMap.get(n);
      const meta = STAGE_TITLES[n] ?? { title: `Stage ${n}`, sub: "" };
      let st: StageRow["status"] = "locked";
      let sc = "—";
      if (res) {
        st = "done";
        sc = res.score != null ? `${res.score}/${res.stage.maxScore}` : "✓";
      } else if (n === currentStage && status === "in_progress") {
        st = "current"; sc = "▶";
      }
      return { num: n, title: meta.title, sub: meta.sub, status: st, score: sc, phase: phaseOf(n) };
    });

    // Phase breakdown
    const phases: PhaseBreakdown[] = [
      {
        label:"Understanding", color:"#3B82C4",
        stageDone:  stageRows.slice(0,3).filter(s=>s.status==="done").length,
        stageTotal: 3,
        pct:        diag?.understandingScore!=null ? Math.round(diag.understandingScore) : null,
        status:     phaseStatus(stageRows, 0, 3),
      },
      {
        label:"Analysis",      color:"#8B5CF6",
        stageDone:  stageRows.slice(3,7).filter(s=>s.status==="done").length,
        stageTotal: 4,
        pct:        diag?.analysisScore!=null ? Math.round(diag.analysisScore) : null,
        status:     phaseStatus(stageRows, 3, 7),
      },
      {
        label:"Solution",      color:"#F59E0B",
        stageDone:  stageRows.slice(7,10).filter(s=>s.status==="done").length,
        stageTotal: 3,
        pct:        diag?.solutionScore!=null ? Math.round(diag.solutionScore) : null,
        status:     phaseStatus(stageRows, 7, 10),
      },
      {
        label:"Reflection",    color:"#4A9B7F",
        stageDone:  stageRows.slice(10).filter(s=>s.status==="done").length,
        stageTotal: 2,
        pct:        diag?.reflectionScore!=null ? Math.round(diag.reflectionScore) : null,
        status:     phaseStatus(stageRows, 10, 12),
      },
    ];

    // Diag snapshot
    const diagSnap: DiagSnapshot[] = [
      { label:"Understanding", icon:"🔵", pct:Math.round(diag?.understandingScore??0), color:"#3B82C4", pending:diag?.understandingScore==null, ...badgeFor(diag?.understandingScore??null) },
      { label:"Analysis",      icon:"🟣", pct:Math.round(diag?.analysisScore??0),      color:"#8B5CF6", pending:diag?.analysisScore==null,      ...badgeFor(diag?.analysisScore??null)      },
      { label:"Solution",      icon:"🟠", pct:Math.round(diag?.solutionScore??0),      color:"#F59E0B", pending:diag?.solutionScore==null,       ...badgeFor(diag?.solutionScore??null)       },
      { label:"Reflection",    icon:"🟢", pct:Math.round(diag?.reflectionScore??0),    color:"#4A9B7F", pending:diag?.reflectionScore==null,     ...badgeFor(diag?.reflectionScore??null)     },
    ];

    const PHASE_LABEL: Record<number, string> = {
      1:"Understanding",2:"Understanding",3:"Understanding",
      4:"Analysis",5:"Analysis",6:"Analysis",7:"Analysis",
      8:"Solution",9:"Solution",10:"Solution",
      11:"Reflection",12:"Reflection",
    };

    const progressText =
      status === "completed"    ? "All 12 stages complete! 🎉" :
      status === "in_progress"  ? `Stage ${currentStage} of 12 · ${PHASE_LABEL[currentStage]} Phase` :
      status === "locked"       ? `Unlocks after ${mod.unlockAfter} completed quest${(mod.unlockAfter??0)>1?"s":""}` :
      "Not started yet";

    return [{
      id:           mod.id,
      icon:         mod.icon,
      title:        mod.title,
      context:      contextLabel(mod.context),
      scenario:     mod.scenario,       // raw HTML — client renders or strips tags
      bannerUrl:    mod.bannerUrl ?? null,
      status,
      currentStage,
      percentScore: pct,
      difficulty:   diffLabel(profile.difficulty),
      dueDate:      a.dueDate
        ? a.dueDate.toLocaleDateString("en-PH", { month:"short", day:"numeric" })
        : null,
      pips,
      progressText,
      phases,
      stageRows,
      diag:          diagSnap,
      melcTags:      Array.isArray(mod.melcTags) ? (mod.melcTags as string[]) : [],
      timeEstimate:  mod.timeEstimate,
      unlockAfter:   mod.unlockAfter,
      completedCount,
    }];
  });

  const data: MyModulesData = {
    student: {
      name:        profile.user.name,
      avatarEmoji: profile.avatarEmoji ?? "🧙‍♂️",
      avatarName:  profile.avatarName  ?? "Hero",
      difficulty:  diffLabel(profile.difficulty),
      section:     profile.section?.name ?? "—",
      xp:          profile.xp,
      level:       profile.level,
    },
    modules,
    completedCount,
    inProgressCount: allProgress.filter((p) => p.status === "IN_PROGRESS").length,
  };

  return <MyModulesClient data={data} />;
}