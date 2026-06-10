// app/dashboard/teacher/tests/page.tsx
// Server Component — pre/post test results + test set management.

import { redirect } from "next/navigation";
import { getSessionUserFast } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import TestResultsClient from "./_components/TestResultsClient";

// ─── Exported types ────────────────────────────────────────────
export interface StudentTestRow {
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

export interface TestSectionData {
  sectionId:    number;
  sectionName:  string;
  sectionEmoji: string;
  gradeLevel:   string;
  students:     StudentTestRow[];
  preTakers:    number;
  postTakers:   number;
  avgPre:       number | null;
  avgPost:      number | null;
  avgGain:      number | null;
}

export interface TestSetRow {
  id:            number;
  title:         string;
  type:          "PRE_TEST" | "POST_TEST";
  description:   string | null;
  timeLimit:     number | null;  // seconds
  isActive:      boolean;
  moduleId:      number | null;
  moduleTitle:   string | null;
  moduleIcon:    string | null;
  questionCount: number;
  resultCount:   number;
  createdAt:     string;
}

export interface ModuleOption {
  id:    number;
  title: string;
  icon:  string;
}

export interface TestResultsData {
  teacher:           { name: string; initials: string; section: string };
  sections:          TestSectionData[];
  testSets:          TestSetRow[];
  modules:           ModuleOption[];
  totalStudents:     number;
  pendingGradeCount: number;
}

// ─── Helpers ──────────────────────────────────────────────────
function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function avg(arr: number[]): number | null {
  if (!arr.length) return null;
  return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
}

// ─── Page ─────────────────────────────────────────────────────
export default async function TestResultsPage() {
  const session = await getSessionUserFast();
  if (!session || session.role !== "TEACHER") redirect("/login");

  const teacher = await prisma.user.findUnique({
    where: { id: session.id },
    include: {
      teacherOf: {
        where:   { isActive: true },
        orderBy: { name: "asc" },
        include: {
          students: {
            include: { user: true },
            orderBy: { user: { name: "asc" } },
          },
        },
      },
    },
  });

  if (!teacher) redirect("/login");

  const allStudentIds = teacher.teacherOf.flatMap((sec) =>
    sec.students.map((s) => s.userId)
  );
  const sectionIds = teacher.teacherOf.map((sec) => sec.id);

  // Fetch everything in parallel
  const [testResults, rawTestSets, modules, pendingGradeCount] = await Promise.all([
    prisma.testResult.findMany({
      where: { userId: { in: allStudentIds } },
    }),
    prisma.testSet.findMany({
      where: { assignments: { some: { sectionId: { in: sectionIds } } } },
      orderBy: { createdAt: "desc" },
      include: {
        module:    { select: { id: true, title: true, icon: true } },
        _count:    { select: { questions: true, results: true } },
      },
    }),
    prisma.module.findMany({
      where:   { status: "ACTIVE" },
      select:  { id: true, title: true, icon: true },
      orderBy: { title: "asc" },
    }),
    prisma.stageResponse.count({
      where: { userId: { in: allStudentIds }, score: null, gradedAt: null },
    }),
  ]);

  // ─── Build results lookup ───────────────────────────────────
  const resultMap = new Map<number, { pre?: typeof testResults[number]; post?: typeof testResults[number] }>();
  for (const r of testResults) {
    if (!resultMap.has(r.userId)) resultMap.set(r.userId, {});
    const entry = resultMap.get(r.userId)!;
    if (r.type === "PRE_TEST")  entry.pre  = r;
    if (r.type === "POST_TEST") entry.post = r;
  }

  const sections: TestSectionData[] = teacher.teacherOf.map((sec) => {
    const students: StudentTestRow[] = sec.students.map((profile) => {
      const uid   = profile.userId;
      const entry = resultMap.get(uid) ?? {};

      const preScore  = entry.pre  ? Math.round(entry.pre.percentScore)  : null;
      const postScore = entry.post ? Math.round(entry.post.percentScore) : null;
      const fmt = (d: Date) =>
        d.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });

      return {
        userId:      uid,
        name:        profile.user.name,
        initials:    initials(profile.user.name),
        avatarEmoji: profile.avatarEmoji ?? "🧙‍♂️",
        difficulty:  profile.difficulty,
        preScore,
        preRaw:      entry.pre  ? `${entry.pre.score}/${entry.pre.totalItems}`   : null,
        preTakenAt:  entry.pre  ? fmt(entry.pre.submittedAt)                     : null,
        postScore,
        postRaw:     entry.post ? `${entry.post.score}/${entry.post.totalItems}` : null,
        postTakenAt: entry.post ? fmt(entry.post.submittedAt)                    : null,
        gain:        preScore !== null && postScore !== null ? postScore - preScore : null,
      };
    });

    const preScores  = students.flatMap((s) => s.preScore  !== null ? [s.preScore]  : []);
    const postScores = students.flatMap((s) => s.postScore !== null ? [s.postScore] : []);
    const gains      = students.flatMap((s) => s.gain      !== null ? [s.gain]      : []);

    return {
      sectionId:    sec.id,
      sectionName:  sec.name,
      sectionEmoji: sec.emoji,
      gradeLevel:   sec.gradeLevel,
      students,
      preTakers:    preScores.length,
      postTakers:   postScores.length,
      avgPre:       avg(preScores),
      avgPost:      avg(postScores),
      avgGain:      avg(gains),
    };
  });

  // ─── Build test sets list ───────────────────────────────────
  const testSets: TestSetRow[] = rawTestSets.map((ts) => ({
    id:            ts.id,
    title:         ts.title,
    type:          ts.type as "PRE_TEST" | "POST_TEST",
    description:   ts.description ?? null,
    timeLimit:     ts.timeLimit   ?? null,
    isActive:      ts.isActive,
    moduleId:      ts.moduleId    ?? null,
    moduleTitle:   ts.module?.title ?? null,
    moduleIcon:    ts.module?.icon  ?? null,
    questionCount: ts._count.questions,
    resultCount:   ts._count.results,
    createdAt:     ts.createdAt.toLocaleDateString("en-PH", {
      month: "short", day: "numeric", year: "numeric",
    }),
  }));

  const data: TestResultsData = {
    teacher: {
      name:     teacher.name,
      initials: initials(teacher.name),
      section:  teacher.teacherOf[0]?.name ?? "—",
    },
    sections,
    testSets,
    modules:           modules.map((m) => ({ id: m.id, title: m.title, icon: m.icon })),
    totalStudents:     allStudentIds.length,
    pendingGradeCount,
  };

  return <TestResultsClient data={data} />;
}
