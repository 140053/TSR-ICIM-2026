// ─────────────────────────────────────────────────────────────
// app/dashboard/teacher/page.tsx
// ─────────────────────────────────────────────────────────────

import { redirect } from "next/navigation";
import { getSessionUserFast } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import TeacherDashboard from "./_components/TeacherDashboard";

// ─── Data shapes ─────────────────────────────────────────────

export interface DashboardStudent {
  initials:      string;
  name:          string;
  color:         "blue" | "green" | "amber";
  understanding: number;
  analysis:      number;
  solution:      number;
  reflect:       number;
  total:         string;
  totalColor:    string;
}

export interface DashboardStats {
  totalStudents:    number;
  completedModule:  number;
  classAvgScore:    number;
  needIntervention: number;
}

export interface ReflectionEntry {
  text: string;
  who:  string;
}

export interface SectionDashboardData {
  id:                number;
  name:              string;
  emoji:             string;
  gradeLevel:        string;
  stats:             DashboardStats;
  students:          DashboardStudent[];
  preAvg:            { understanding: number; analysis: number; solution: number };
  postAvg:           { understanding: number; analysis: number; solution: number };
  reflections:       ReflectionEntry[];
  interventionCount: number;
}

export interface DashboardData {
  teacher:           { name: string; initials: string };
  sections:          SectionDashboardData[];
  pendingGradeCount: number;
  totalStudents:     number;
}

// ─── Helpers ─────────────────────────────────────────────────

function initials(name: string): string {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function avatarColor(index: number): "blue" | "green" | "amber" {
  return (["blue", "green", "amber"] as const)[index % 3];
}

function scoreColor(pct: number): string {
  if (pct >= 80) return "text-[#4A9B7F]";
  if (pct >= 60) return "";
  return "text-[#E05C5C]";
}

const avg = (arr: number[]) =>
  arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

// ─── Server Component ─────────────────────────────────────────

export default async function TeacherDashboardPage() {
  const session = await getSessionUserFast();
  if (!session || session.role !== "TEACHER") redirect("/login");

  const teacher = await prisma.user.findUnique({
    where: { id: session.id },
    include: {
      teacherOf: {
        where:   { isActive: true },
        include: { students: { include: { user: true }, orderBy: { user: { name: "asc" } } } },
        orderBy: { name: "asc" },
      },
    },
  });

  if (!teacher) redirect("/login");

  const allStudentIds = teacher.teacherOf.flatMap((s) => s.students.map((st) => st.userId));

  // ── Batch queries across all sections ────────────────────────
  const [diagnostics, testResults, stage12s, allModuleProgress, pendingGradeCount] =
    await Promise.all([
      prisma.diagnosticReport.findMany({
        where:   { userId: { in: allStudentIds } },
        orderBy: { generatedAt: "desc" },
      }),
      prisma.testResult.findMany({ where: { userId: { in: allStudentIds } } }),
      prisma.stage.findMany({ where: { stageNumber: 12 }, select: { id: true } }),
      prisma.moduleProgress.findMany({
        where:  { userId: { in: allStudentIds } },
        select: { userId: true, status: true, percentScore: true },
      }),
      prisma.stageResponse.count({
        where: { userId: { in: allStudentIds }, score: null, gradedAt: null },
      }),
    ]);

  const stage12Ids = stage12s.map((s) => s.id);
  const reflectionResponses = await prisma.stageResponse.findMany({
    where:   { userId: { in: allStudentIds }, stageId: { in: stage12Ids } },
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take:    6 * Math.max(teacher.teacherOf.length, 1),
  });

  // Latest diagnostic per student
  const diagMap = new Map<number, typeof diagnostics[number]>();
  for (const d of diagnostics) {
    if (!diagMap.has(d.userId)) diagMap.set(d.userId, d);
  }

  // ── Build per-section data ────────────────────────────────────
  const sections: SectionDashboardData[] = teacher.teacherOf.map((section) => {
    const ids    = new Set(section.students.map((s) => s.userId));
    const sTests = testResults.filter((r) => ids.has(r.userId));
    const sProg  = allModuleProgress.filter((r) => ids.has(r.userId));
    const sRefl  = reflectionResponses.filter((r) => ids.has(r.userId)).slice(0, 6);

    const preResults  = sTests.filter((r) => r.type === "PRE_TEST");
    const postResults = sTests.filter((r) => r.type === "POST_TEST");

    const completedCount    = sProg.filter((p) => p.status === "COMPLETED").length;
    const allScores         = sProg.filter((p) => p.percentScore !== null).map((p) => p.percentScore!);
    const classAvg          = avg(allScores);
    const interventionCount = diagnostics.filter((d) => ids.has(d.userId) && d.needsIntervention).length;

    const studentRows: DashboardStudent[] = section.students.slice(0, 10).map((profile, idx) => {
      const diag    = diagMap.get(profile.userId);
      const u       = Math.round(diag?.understandingScore ?? -1);
      const a       = Math.round(diag?.analysisScore      ?? -1);
      const s       = Math.round(diag?.solutionScore      ?? -1);
      const r       = Math.round(diag?.reflectionScore    ?? -1);
      const overall = Math.round(diag?.overallScore       ?? -1);
      return {
        initials:      initials(profile.user.name),
        name:          profile.user.name,
        color:         avatarColor(idx),
        understanding: u,
        analysis:      a,
        solution:      s,
        reflect:       r,
        total:         overall >= 0 ? `${overall}%` : "—",
        totalColor:    overall >= 0 ? scoreColor(overall) : "",
      };
    });

    const reflections: ReflectionEntry[] = sRefl.map((r) => {
      let text = r.answer;
      try {
        const parsed = JSON.parse(r.answer) as { texts?: Record<string, string> };
        const firstText = parsed.texts
          ? Object.values(parsed.texts).find((v) => v && v.trim())
          : undefined;
        if (firstText) text = firstText;
      } catch { /* raw text */ }
      return { text: text.slice(0, 200), who: `${r.user.name} · Stage 12 Reflection` };
    });

    return {
      id:         section.id,
      name:       section.name,
      emoji:      (section as { emoji?: string }).emoji ?? "📚",
      gradeLevel: (section as { gradeLevel?: string }).gradeLevel ?? "Grade 6",
      stats: {
        totalStudents:    section.students.length,
        completedModule:  completedCount,
        classAvgScore:    classAvg,
        needIntervention: interventionCount,
      },
      students:          studentRows,
      preAvg: {
        understanding: avg(preResults.map((r) => r.percentScore)),
        analysis:      avg(preResults.map((r) => Math.round(r.percentScore * 0.9))),
        solution:      avg(preResults.map((r) => Math.round(r.percentScore * 1.05))),
      },
      postAvg: {
        understanding: avg(postResults.map((r) => r.percentScore)),
        analysis:      avg(postResults.map((r) => Math.round(r.percentScore * 0.9))),
        solution:      avg(postResults.map((r) => Math.round(r.percentScore * 1.05))),
      },
      reflections,
      interventionCount,
    };
  });

  const data: DashboardData = {
    teacher:           { name: teacher.name, initials: initials(teacher.name) },
    sections,
    pendingGradeCount,
    totalStudents:     allStudentIds.length,
  };

  return <TeacherDashboard data={data} />;
}
