// app/dashboard/teacher/reports/page.tsx
// Server Component — class-wide diagnostic reports for all teacher sections.

import { redirect } from "next/navigation";
import { getSessionUserFast } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import ClassReportsClient from "./_components/ClassReportsClient";

// ─── Exported types ───────────────────────────────────────────
export interface ModuleReportItem {
  moduleId:          number;
  moduleTitle:       string;
  moduleIcon:        string;
  status:            "COMPLETED" | "IN_PROGRESS" | "NOT_STARTED";
  overallScore:      number | null;
  needsIntervention: boolean;
  understanding:     number | null;
  analysis:          number | null;
  solution:          number | null;
  reflection:        number | null;
  completedAt:       string | null;
}

export interface StudentRow {
  userId:      number;
  name:        string;
  initials:    string;
  avatarEmoji: string;
  difficulty:  string;
  reports:     ModuleReportItem[];
}

export interface AssignedModule {
  id:    number;
  title: string;
  icon:  string;
}

export interface SectionData {
  sectionId:       number;
  sectionName:     string;
  sectionEmoji:    string;
  gradeLevel:      string;
  students:        StudentRow[];
  assignedModules: AssignedModule[];
}

export interface ClassReportsData {
  teacher:           { name: string; initials: string; section: string };
  sections:          SectionData[];
  totalStudents:     number;
  pendingGradeCount: number;
}

// ─── Helpers ─────────────────────────────────────────────────
function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

// ─── Page ─────────────────────────────────────────────────────
export default async function ClassReportsPage() {
  const session = await getSessionUserFast();
  if (!session || session.role !== "TEACHER") redirect("/login");

  // Fetch teacher + all active sections with students + module assignments
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
          moduleAssignments: {
            include: { module: { select: { id: true, title: true, icon: true } } },
            orderBy: { assignedAt: "asc" },
          },
        },
      },
    },
  });

  if (!teacher) redirect("/login");

  // Collect all student IDs across all sections
  const allStudentIds = teacher.teacherOf.flatMap((sec) =>
    sec.students.map((s) => s.userId)
  );

  // Fetch all diagnostic reports + module progress + pending grades in parallel
  const [diagReports, allProgress, pendingCounts] = await Promise.all([
    prisma.diagnosticReport.findMany({
      where: { userId: { in: allStudentIds } },
    }),
    prisma.moduleProgress.findMany({
      where: { userId: { in: allStudentIds } },
    }),
    prisma.stageResponse.count({
      where: { userId: { in: allStudentIds }, score: null, gradedAt: null },
    }),
  ]);

  // Build lookup maps: (userId, moduleId) → diag / progress
  const diagKey  = (uid: number, mid: number) => `${uid}_${mid}`;
  const diagMap  = new Map(diagReports.map((d) => [diagKey(d.userId, d.moduleId), d]));
  const progKey  = (uid: number, mid: number) => `${uid}_${mid}`;
  const progMap  = new Map(allProgress.map((p) => [progKey(p.userId, p.moduleId), p]));

  // Build section data
  const sections: SectionData[] = teacher.teacherOf.map((sec) => {
    const assignedModules: AssignedModule[] = sec.moduleAssignments.map((a) => ({
      id:    a.module.id,
      title: a.module.title,
      icon:  a.module.icon,
    }));

    const students: StudentRow[] = sec.students.map((profile) => {
      const uid = profile.userId;

      const reports: ModuleReportItem[] = assignedModules.map((mod) => {
        const diag = diagMap.get(diagKey(uid, mod.id));
        const prog = progMap.get(progKey(uid, mod.id));

        const status =
          prog?.status === "COMPLETED"   ? "COMPLETED"   :
          prog?.status === "IN_PROGRESS" ? "IN_PROGRESS" : "NOT_STARTED";

        return {
          moduleId:          mod.id,
          moduleTitle:       mod.title,
          moduleIcon:        mod.icon,
          status,
          overallScore:      diag?.overallScore      ?? null,
          needsIntervention: diag?.needsIntervention ?? false,
          understanding:     diag?.understandingScore ?? null,
          analysis:          diag?.analysisScore      ?? null,
          solution:          diag?.solutionScore      ?? null,
          reflection:        diag?.reflectionScore    ?? null,
          completedAt: prog?.lastActiveAt && status === "COMPLETED"
            ? prog.lastActiveAt.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })
            : null,
        };
      });

      return {
        userId:      uid,
        name:        profile.user.name,
        initials:    initials(profile.user.name),
        avatarEmoji: profile.avatarEmoji ?? "🧙‍♂️",
        difficulty:  profile.difficulty,
        reports,
      };
    });

    return {
      sectionId:    sec.id,
      sectionName:  sec.name,
      sectionEmoji: sec.emoji,
      gradeLevel:   sec.gradeLevel,
      students,
      assignedModules,
    };
  });

  const data: ClassReportsData = {
    teacher: {
      name:     teacher.name,
      initials: initials(teacher.name),
      section:  teacher.teacherOf[0]?.name ?? "—",
    },
    sections,
    totalStudents:     allStudentIds.length,
    pendingGradeCount: pendingCounts,
  };

  return <ClassReportsClient data={data} />;
}
