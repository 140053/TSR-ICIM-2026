// app/dashboard/teacher/modules/page.tsx
//
// Server Component — auth guard + all DB queries for module management.
// Passes typed data to the pure-client <TeacherModulesClient />.

import { redirect } from "next/navigation";
import { getSessionUserFast } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import TeacherModulesClient from "./_components/TeacherModulesClient";


// ─── Exported types (used by client component) ────────────────
export type ModuleStatusType = "active" | "draft" | "archived";
export type StudentStatusType = "done" | "inprog" | "stuck" | "notstart";

export interface StudentRow {
  userId:      number;
  name:        string;
  short:       string;
  emoji:       string;
  status:      StudentStatusType;
  stage:       number;
  drawerData?: StudentDrawerData;
}

export interface StudentDrawerData {
  stage:    string;
  score:    string;
  time:     string;
  alert:    string | null;
  clusters: DrawerCluster[];
  stages:   DrawerStage[];
}

export interface DrawerCluster {
  label:    string;
  color:    string;
  pct:      number;
  badge:    string;
  badgeCls: string;
}

export interface DrawerStage {
  num:    number;
  title:  string;
  sub:    string;
  status: "done" | "current" | "pending";
  score:  string;
}

export interface ClusterAvg {
  icon:    string;
  label:   string;
  pct:     number;
  quality: "good" | "fair" | "weak";
}

export interface LinkedTest {
  id:       number;
  title:    string;
  isActive: boolean;
}

export interface SectionCompletion {
  sectionId:    number;
  sectionName:  string;
  sectionEmoji: string;
  done:         number;
  inprog:       number;
  notstart:     number;
  total:        number;
  pct:          number;
}

export interface ModuleData {
  id:                number;
  dbId:              number;
  emoji:             string;
  context:           string;
  contextColor:      string;
  title:             string;
  duration:          string;
  status:            ModuleStatusType;
  dueTag:            string;
  scenario:          string;   // raw HTML from rich-text editor
  scenarioBorder:    string;
  bannerUrl:         string | null;
  completion:        { pct: number; done: number; inprog: number; notstart: number; total: number };
  sectionCompletion: SectionCompletion[];
  students:          StudentRow[];
  clusters:          ClusterAvg[];
  insight:           { text: string; type: "good" | "warn" };
  gradeCount:        number;
  wide:              boolean;
  checklist?:        { done: boolean; label: string }[];
  tags?:             string[];
  preTest:           LinkedTest | null;
  postTest:          LinkedTest | null;
}

export interface LibraryModuleItem {
  id:           number;
  emoji:        string;
  context:      string;
  contextColor: string;
  contextKey:   string;
  title:        string;
  scenario:     string;
  timeEstimate: number;
  status:       ModuleStatusType;
  isAssigned:   boolean;
  dueDate:      string | null;
  tags:         string[];
  createdAt:    string;
  bannerUrl:    string | null;
}

export interface ContextItem {
  key:   string;
  label: string;
  icon:  string;
  color: string;
}

// ─── Pre/Post Results tab types ───────────────────────────────
export interface ModuleTestStudentRow {
  userId:      number;
  name:        string;
  initials:    string;
  avatarEmoji: string;
  difficulty:  string;
  preScore:    number | null;
  preRaw:      string | null;
  preTakenAt:  string | null;
  postScore:   number | null;
  postRaw:     string | null;
  postTakenAt: string | null;
  gain:        number | null;
}

export interface ModuleTestData {
  moduleId:    number;
  moduleTitle: string;
  moduleEmoji: string;
  preTest:     { id: number; title: string; questionCount: number; isActive: boolean } | null;
  postTest:    { id: number; title: string; questionCount: number; isActive: boolean } | null;
  students:    ModuleTestStudentRow[];
  preTakers:   number;
  postTakers:  number;
  avgPre:      number | null;
  avgPost:     number | null;
  avgGain:     number | null;
}

export interface TeacherSectionOption {
  id:    number;
  name:  string;
  emoji: string;
}

export interface TeacherModulesData {
  teacher:           { name: string; section: string; initials: string };
  sections:          TeacherSectionOption[];
  modules:           ModuleData[];
  library:           LibraryModuleItem[];
  contexts:          ContextItem[];
  prePostResults:    ModuleTestData[];
  pendingGradeCount: number;
  stats: {
    totalModules:    number;
    totalStudents:   number;
    activeStudents:  number;
    completedCount:  number;
    needIntervention:number;
  };
}

// ─── Helpers ─────────────────────────────────────────────────
function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function statusOf(
  progressStatus: string,
  currentStage: number,
  diagNeedsIntervention: boolean
): StudentStatusType {
  if (progressStatus === "COMPLETED") return "done";
  if (progressStatus === "IN_PROGRESS") {
    return diagNeedsIntervention ? "stuck" : "inprog";
  }
  return "notstart";
}

function qualityOf(pct: number): "good" | "fair" | "weak" {
  if (pct >= 80) return "good";
  if (pct >= 60) return "fair";
  return "weak";
}

// context helpers — built from DB at runtime in the page function

const STAGE_TITLES: Record<number, { title: string; sub: string }> = {
  1:  { title: "Identify & Categorize",     sub: "Multiple choice · Auto-scored"   },
  2:  { title: "Select & Prioritize",        sub: "Drag-to-rank · Auto-scored"      },
  3:  { title: "Define the Problem",         sub: "Open-ended · Teacher graded"     },
  4:  { title: "Analyze Information",        sub: "Table input · Auto-scored"       },
  5:  { title: "Identify Constraints",       sub: "Checklist · Auto-scored"         },
  6:  { title: "Root Causes",                sub: "Open-ended · Pending grading"    },
  7:  { title: "Data Analysis",              sub: "Computation · Auto-scored"       },
  8:  { title: "Develop Possible Solutions", sub: "Multi-plan · In progress"        },
  9:  { title: "Anticipate Problems",        sub: "Not started"                     },
  10: { title: "Trial Implementation",       sub: "Not started"                     },
  11: { title: "Choose Best Solution",       sub: "Not started"                     },
  12: { title: "Reflect & Review",           sub: "Not started"                     },
};

function drawerBadge(pct: number): { badge: string; badgeCls: string } {
  if (pct >= 80) return { badge: "Good",     badgeCls: "bg-[#D1FAE5] text-[#4A9B7F]" };
  if (pct >= 60) return { badge: "Fair",     badgeCls: "bg-[#FEF3C7] text-[#F59E0B]" };
  return             { badge: "Needs Help", badgeCls: "bg-[#FEE2E2] text-[#E05C5C]" };
}

// ─── Server Component ─────────────────────────────────────────
export default async function TeacherModulesPage() {
  // 1. Auth guard
  const session = await getSessionUserFast();
  if (!session || session.role !== "TEACHER") redirect("/login");

  // 2. Teacher info + their active sections
  const teacher = await prisma.user.findUnique({
    where:   { id: session.id },
    include: {
      teacherOf: {
        where:   { isActive: true },
        include: {
          students: {
            include: { user: true },
          },
          moduleAssignments: {
            include: { module: true },
          },
        },
      },
    },
  });

  if (!teacher) redirect("/login");

  const allSections = teacher.teacherOf;
  const sectionName = allSections[0]?.name ?? "—";

  // All students across every section this teacher manages
  const allStudents = allSections.flatMap((s) => s.students);
  const studentIds  = allStudents.map((s) => s.userId);

  // 3. Merge assignments from all sections — if the same module is assigned to
  //    multiple sections, pool the students so the card shows everyone.
  const assignmentMap = new Map<
    number,
    (typeof allSections[0]["moduleAssignments"][0]) & { sectionStudents: typeof allStudents }
  >();
  // Also track which sections (with their students) are assigned per module
  const sectionsByModule = new Map<number, typeof allSections>();
  for (const sec of allSections) {
    for (const a of sec.moduleAssignments) {
      if (!assignmentMap.has(a.moduleId)) {
        assignmentMap.set(a.moduleId, { ...a, sectionStudents: [...sec.students] });
      } else {
        assignmentMap.get(a.moduleId)!.sectionStudents.push(...sec.students);
      }
      if (!sectionsByModule.has(a.moduleId)) sectionsByModule.set(a.moduleId, []);
      sectionsByModule.get(a.moduleId)!.push(sec);
    }
  }
  const assignments = Array.from(assignmentMap.values());

  // 4. All module progress + diagnostic reports + scenario contexts + linked test sets
  const assignedModuleIdListEarly = assignments.map((a) => a.moduleId);
  const [allProgress, allDiagnostics, allResponses, pendingResponses, ctxList, linkedTestSetsEarly] =
    await Promise.all([
      prisma.moduleProgress.findMany({
        where: { userId: { in: studentIds } },
      }),
      prisma.diagnosticReport.findMany({
        where: { userId: { in: studentIds } },
      }),
      prisma.stageResponse.findMany({
        where: { userId: { in: studentIds } },
        include: { stage: true },
        orderBy: { stage: { stageNumber: "asc" } },
      }),
      prisma.stageResponse.count({
        where: { userId: { in: studentIds }, score: null, gradedAt: null },
      }),
      prisma.scenarioContext.findMany({ orderBy: { sortOrder: "asc" } }),
      prisma.testSet.findMany({
        where:   { moduleId: { in: assignedModuleIdListEarly } },
        include: { _count: { select: { questions: true } } },
      }),
    ]);

  // Build test-set-by-module map for module cards
  const testSetByModuleEarly = new Map<number, { pre?: typeof linkedTestSetsEarly[number]; post?: typeof linkedTestSetsEarly[number] }>();
  for (const ts of linkedTestSetsEarly) {
    if (!ts.moduleId) continue;
    if (!testSetByModuleEarly.has(ts.moduleId)) testSetByModuleEarly.set(ts.moduleId, {});
    const entry = testSetByModuleEarly.get(ts.moduleId)!;
    if (ts.type === "PRE_TEST")  entry.pre  = ts;
    if (ts.type === "POST_TEST") entry.post = ts;
  }

  // Context lookup helpers (replaces hardcoded maps)
  const ctxMap = new Map(ctxList.map((c) => [c.key, c]));
  const contextColorOf  = (key: string) => ctxMap.get(key)?.color ?? "#64748B";
  const contextEmoji    = (key: string, icon: string) => ctxMap.get(key)?.icon ?? icon;
  const contextLabel    = (key: string) => {
    const c = ctxMap.get(key);
    return c ? `${c.icon} ${c.description?.toUpperCase() ?? c.label.toUpperCase()}` : key;
  };
  const scenarioBorderOf = contextColorOf;

  // Index maps for fast lookup
  const progressByStudentModule = new Map<string, typeof allProgress[number]>();
  for (const p of allProgress) {
    progressByStudentModule.set(`${p.userId}-${p.moduleId}`, p);
  }

  const diagByStudentModule = new Map<string, typeof allDiagnostics[number]>();
  for (const d of allDiagnostics) {
    diagByStudentModule.set(`${d.userId}-${d.moduleId}`, d);
  }

  const responsesByStudentModule = new Map<string, typeof allResponses>();
  for (const r of allResponses) {
    const key = `${r.userId}-${r.moduleId}`;
    if (!responsesByStudentModule.has(key)) responsesByStudentModule.set(key, []);
    responsesByStudentModule.get(key)!.push(r);
  }

  // 5. Library: modules assigned to the teacher's sections OR drafts they created
  //    Draft modules are never assigned, so we use createdByUserId to surface them.
  const assignedModuleIds = new Set(assignments.map((a) => a.moduleId));
  const sectionIds         = allSections.map((s) => s.id);
  const allLibraryModules  = await prisma.module.findMany({
    where: {
      status: { in: ["ACTIVE", "DRAFT"] },
      OR: [
        { assignments: { some: { sectionId: { in: sectionIds } } } },
        { status: "DRAFT", createdByUserId: session.id },
      ],
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  // 6. Build ModuleData array
  const moduleDataList: ModuleData[] = [];

  // ── Assigned modules ──────────────────────────────────────
  for (const assignment of assignments) {
    const mod = assignment.module;
    const moduleStudents: StudentRow[] = [];
    let doneCount = 0, inprogCount = 0, notStartCount = 0;
    let totalU = 0, totalA = 0, totalS = 0, totalR = 0, clusterN = 0;
    let needInt = 0;

    for (const profile of assignment.sectionStudents) {
      const uid  = profile.userId;
      const prog = progressByStudentModule.get(`${uid}-${mod.id}`);
      const diag = diagByStudentModule.get(`${uid}-${mod.id}`);

      const progStatus   = prog?.status ?? "NOT_STARTED";
      const currentStage = prog?.currentStage ?? 1;
      const stuStatus    = statusOf(progStatus, currentStage, diag?.needsIntervention ?? false);

      if (stuStatus === "done")     doneCount++;
      else if (stuStatus === "inprog" || stuStatus === "stuck") inprogCount++;
      else                          notStartCount++;

      if (diag?.needsIntervention) needInt++;

      // Build diagnostic drawer data
      const stageResps = responsesByStudentModule.get(`${uid}-${mod.id}`) ?? [];
      const respMap    = new Map(stageResps.map((r) => [r.stage.stageNumber, r]));

      const drawerStages: DrawerStage[] = Array.from({ length: 12 }, (_, i) => {
        const n   = i + 1;
        const res = respMap.get(n);
        const meta = STAGE_TITLES[n] ?? { title: `Stage ${n}`, sub: "" };
        return {
          num:    n,
          title:  meta.title,
          sub:    meta.sub,
          status: res ? "done" : n === currentStage ? "current" : "pending",
          score:  res?.score != null ? `${res.score}/${res.stage.maxScore}` : (n === currentStage ? "▶" : "—"),
        };
      });

      const uScore = Math.round(diag?.understandingScore ?? 0);
      const aScore = Math.round(diag?.analysisScore ?? 0);
      const sScore = Math.round(diag?.solutionScore ?? 0);
      const rScore = Math.round(diag?.reflectionScore ?? 0);

      if (diag) {
        totalU += uScore; totalA += aScore; totalS += sScore; totalR += rScore;
        clusterN++;
      }

      const timeSpentMin = Math.round(
        stageResps.reduce((sum, r) => sum + (r.timeSpent ?? 0), 0) / 60
      );
      const overallPct = Math.round(prog?.percentScore ?? 0);

      const alertMsg =
        stuStatus === "stuck"
          ? "⚠️ Significantly behind. Multiple clusters below 60%."
          : diag?.interventionNote ?? null;

      const drawerData: StudentDrawerData = {
        stage:  `${currentStage}/12`,
        score:  overallPct > 0 ? `${overallPct}%` : "—",
        time:   `${timeSpentMin}m`,
        alert:  alertMsg,
        clusters: [
          { label: "🔵 Understanding", color: "#3B82C4", pct: uScore, ...drawerBadge(uScore) },
          { label: "🟣 Analysis",      color: "#8B5CF6", pct: aScore, ...drawerBadge(aScore) },
          { label: "🟠 Solution",      color: "#F59E0B", pct: sScore, ...drawerBadge(sScore) },
          { label: "🟢 Reflection",    color: "#4A9B7F", pct: rScore, ...drawerBadge(rScore) },
        ],
        stages: drawerStages,
      };

      const avatarEmoji = profile.avatarEmoji ?? "🧙‍♂️";

      moduleStudents.push({
        userId:      profile.userId,
        name:        profile.user.name,
        short:       profile.user.name.split(" ")[0],
        emoji:       avatarEmoji,
        status:      stuStatus,
        stage:       currentStage,
        drawerData,
      });
    }

    const total      = assignment.sectionStudents.length;
    const pct        = total > 0 ? Math.round((doneCount / total) * 100) : 0;
    const avgU       = clusterN > 0 ? Math.round(totalU / clusterN) : 0;
    const avgA       = clusterN > 0 ? Math.round(totalA / clusterN) : 0;
    const avgS       = clusterN > 0 ? Math.round(totalS / clusterN) : 0;
    const avgR       = clusterN > 0 ? Math.round(totalR / clusterN) : 0;

    const worstCluster = Math.min(avgU, avgA, avgS, avgR);
    const insight =
      worstCluster < 60
        ? { text: `⚠️ Class average below 60% in one or more clusters. Consider revisiting before moving to the next stage.`, type: "warn" as const }
        : { text: `✅ Class is performing well across all phases.`, type: "good" as const };

    // Pending grade count for this module
    const moduleGradeCount = await prisma.stageResponse.count({
      where: { userId: { in: studentIds }, moduleId: mod.id, isCorrect: null, gradedAt: null },
    });

    const dueTag = assignment.dueDate
      ? `📅 Due: ${assignment.dueDate.toLocaleDateString("en-PH", { month: "short", day: "numeric" })}`
      : "📅 No due date";

    const modTests = testSetByModuleEarly.get(mod.id) ?? {};

    // Per-section completion breakdown
    const sectionCompletion: SectionCompletion[] = (sectionsByModule.get(mod.id) ?? []).map((sec) => {
      let secDone = 0, secInprog = 0, secNotstart = 0;
      for (const profile of sec.students) {
        const prog = progressByStudentModule.get(`${profile.userId}-${mod.id}`);
        const diag = diagByStudentModule.get(`${profile.userId}-${mod.id}`);
        const st   = statusOf(prog?.status ?? "NOT_STARTED", prog?.currentStage ?? 1, diag?.needsIntervention ?? false);
        if (st === "done")                       secDone++;
        else if (st === "inprog" || st === "stuck") secInprog++;
        else                                     secNotstart++;
      }
      const total = sec.students.length;
      return {
        sectionId:    sec.id,
        sectionName:  sec.name,
        sectionEmoji: sec.emoji,
        done:         secDone,
        inprog:       secInprog,
        notstart:     secNotstart,
        total,
        pct: total > 0 ? Math.round((secDone / total) * 100) : 0,
      };
    });

    moduleDataList.push({
      id:             mod.id,
      dbId:           mod.id,
      emoji:          contextEmoji(mod.context, mod.icon),
      context:        contextLabel(mod.context),
      contextColor:   contextColorOf(mod.context),
      title:          mod.title,
      duration:       `12 Stages · ~${mod.timeEstimate ?? 90} min`,
      status:         mod.status.toLowerCase() as ModuleStatusType,
      dueTag,
      scenario:       mod.scenario,            // raw HTML — rendered by client
      scenarioBorder: scenarioBorderOf(mod.context),
      bannerUrl:      mod.bannerUrl ?? null,
      completion:     { pct, done: doneCount, inprog: inprogCount, notstart: notStartCount, total },
      students:       moduleStudents,
      clusters: [
        { icon: "🔵", label: "Understanding", pct: avgU, quality: qualityOf(avgU) },
        { icon: "🟣", label: "Analysis",      pct: avgA, quality: qualityOf(avgA) },
        { icon: "🟠", label: "Solution",      pct: avgS, quality: qualityOf(avgS) },
        { icon: "🟢", label: "Reflection",    pct: avgR, quality: qualityOf(avgR) },
      ],
      insight,
      gradeCount:    moduleGradeCount,
      wide:          false,
      sectionCompletion,
      preTest:  modTests.pre  ? { id: modTests.pre.id,  title: modTests.pre.title,  isActive: modTests.pre.isActive  } : null,
      postTest: modTests.post ? { id: modTests.post.id, title: modTests.post.title, isActive: modTests.post.isActive } : null,
    });
  }


  // 7. Build library list (all active/draft modules with assignment status)
  const library: LibraryModuleItem[] = allLibraryModules.map((mod) => {
    const assignment = assignments.find((a) => a.moduleId === mod.id);
    return {
      id:           mod.id,
      emoji:        contextEmoji(mod.context, mod.icon),
      context:      contextLabel(mod.context),
      contextColor: contextColorOf(mod.context),
      contextKey:   mod.context,
      title:        mod.title,
      scenario:     mod.scenario,              // raw HTML — client strips tags for search
      bannerUrl:    mod.bannerUrl ?? null,
      timeEstimate: mod.timeEstimate ?? 90,
      status:       mod.status.toLowerCase() as ModuleStatusType,
      isAssigned:   assignedModuleIds.has(mod.id),
      dueDate:      assignment?.dueDate
        ? assignment.dueDate.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })
        : null,
      tags:    mod.melcTags ? (mod.melcTags as string[]) : [],
      createdAt: mod.createdAt.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }),
    };
  });

  const contexts: ContextItem[] = ctxList.map((c) => ({
    key:   c.key,
    label: c.label,
    icon:  c.icon ?? "📦",
    color: c.color ?? "#64748B",
  }));

  // 8. Pre/Post Results — reuse already-fetched test sets + fetch student results
  const testResults = studentIds.length > 0
    ? await prisma.testResult.findMany({ where: { userId: { in: studentIds } } })
    : [];

  const linkedTestSets = linkedTestSetsEarly;
  const testSetByModule = testSetByModuleEarly;

  // Map: userId → { preByTestSet, postByTestSet }
  const resultByUserTestSet = new Map<string, typeof testResults[number]>();
  for (const r of testResults) {
    resultByUserTestSet.set(`${r.userId}_${r.testSetId}`, r);
  }

  const fmtDate = (d: Date) =>
    d.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });

  function avgNums(arr: number[]): number | null {
    if (!arr.length) return null;
    return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
  }

  const prePostResults: ModuleTestData[] = assignments.map((assignment) => {
    const mod   = assignment.module;
    const sets  = testSetByModule.get(mod.id) ?? {};
    const pre   = sets.pre  ?? null;
    const post  = sets.post ?? null;

    const students: ModuleTestStudentRow[] = assignment.sectionStudents.map((profile) => {
      const uid = profile.userId;

      const preResult  = pre  ? resultByUserTestSet.get(`${uid}_${pre.id}`)  : undefined;
      const postResult = post ? resultByUserTestSet.get(`${uid}_${post.id}`) : undefined;

      const preScore  = preResult  ? Math.round(preResult.percentScore)  : null;
      const postScore = postResult ? Math.round(postResult.percentScore) : null;

      return {
        userId:      uid,
        name:        profile.user.name,
        initials:    initials(profile.user.name),
        avatarEmoji: profile.avatarEmoji ?? "🧙‍♂️",
        difficulty:  profile.difficulty,
        preScore,
        preRaw:      preResult  ? `${preResult.score}/${preResult.totalItems}`   : null,
        preTakenAt:  preResult  ? fmtDate(preResult.submittedAt)                 : null,
        postScore,
        postRaw:     postResult ? `${postResult.score}/${postResult.totalItems}` : null,
        postTakenAt: postResult ? fmtDate(postResult.submittedAt)                : null,
        gain:        preScore !== null && postScore !== null ? postScore - preScore : null,
      };
    });

    const preScores  = students.flatMap((s) => s.preScore  !== null ? [s.preScore]  : []);
    const postScores = students.flatMap((s) => s.postScore !== null ? [s.postScore] : []);
    const gains      = students.flatMap((s) => s.gain      !== null ? [s.gain]      : []);

    return {
      moduleId:    mod.id,
      moduleTitle: mod.title,
      moduleEmoji: contextEmoji(mod.context, mod.icon),
      preTest:     pre  ? { id: pre.id,  title: pre.title,  questionCount: pre._count.questions,  isActive: pre.isActive  } : null,
      postTest:    post ? { id: post.id, title: post.title, questionCount: post._count.questions, isActive: post.isActive } : null,
      students,
      preTakers:   preScores.length,
      postTakers:  postScores.length,
      avgPre:      avgNums(preScores),
      avgPost:     avgNums(postScores),
      avgGain:     avgNums(gains),
    };
  });

  // 9. Stats
  const completedCount  = allProgress.filter((p) => p.status === "COMPLETED").length;
  const activeCount     = allProgress.filter((p) => p.status === "IN_PROGRESS").length;
  const interventionCnt = allDiagnostics.filter((d) => d.needsIntervention).length;

  const data: TeacherModulesData = {
    teacher: {
      name:     teacher.name,
      section:  sectionName,
      initials: initials(teacher.name),
    },
    sections: teacher.teacherOf.map((s) => ({ id: s.id, name: s.name, emoji: s.emoji })),
    modules:           moduleDataList,
    library,
    contexts,
    prePostResults,
    pendingGradeCount: pendingResponses,
    stats: {
      totalModules:     moduleDataList.length,
      totalStudents:    allStudents.length,
      activeStudents:   activeCount,
      completedCount,
      needIntervention: interventionCnt,
    },
  };

  return <TeacherModulesClient data={data} />;
}