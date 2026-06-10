// app/dashboard/teacher/students/page.tsx
// Server Component — lists all students in teacher's sections with module progress.

import { redirect }           from "next/navigation";
import Link                   from "next/link";
import { getSessionUserFast } from "@/lib/auth/session";
import { prisma }             from "@/lib/prisma";
import TeacherSidebar         from "../_components/TeacherSidebar";
import StudentsClient         from "./_components/StudentsClient";
import type { StudentsData }  from "./_components/StudentsClient";

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

export default async function StudentsPage() {
  const session = await getSessionUserFast();
  if (!session || session.role !== "TEACHER") redirect("/login");

  const teacher = await prisma.user.findUnique({
    where:   { id: session.id },
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

  const allStudentIds = teacher.teacherOf.flatMap((s) => s.students.map((st) => st.userId));

  const [allProgress, pendingCounts] = await Promise.all([
    prisma.moduleProgress.findMany({
      where:   { userId: { in: allStudentIds } },
      include: { module: { select: { title: true, icon: true } } },
      orderBy: { lastActiveAt: "desc" },
    }),
    prisma.stageResponse.groupBy({
      by:     ["userId"],
      where:  { userId: { in: allStudentIds }, score: null, gradedAt: null },
      _count: { id: true },
    }),
  ]);

  // Latest progress per student
  const progressMap = new Map<number, typeof allProgress[number]>();
  for (const p of allProgress) {
    if (!progressMap.has(p.userId)) progressMap.set(p.userId, p);
  }

  const pendingMap   = new Map(pendingCounts.map((r) => [r.userId, r._count.id]));
  const totalPending = pendingCounts.reduce((sum, r) => sum + r._count.id, 0);

  const data: StudentsData = {
    sections: teacher.teacherOf.map((sec) => ({
      sectionId:    sec.id,
      sectionName:  sec.name,
      sectionEmoji: sec.emoji,
      gradeLevel:   sec.gradeLevel,
      students: sec.students.map((profile) => {
        const progress = progressMap.get(profile.userId);
        return {
          userId:       profile.userId,
          name:         profile.user.name,
          initials:     initials(profile.user.name),
          avatarEmoji:  profile.avatarEmoji ?? "",
          avatarName:   profile.avatarName  ?? "",
          difficulty:   profile.difficulty,
          xp:           profile.xp,
          level:        profile.level,
          moduleId:     progress?.moduleId    ?? null,
          moduleTitle:  progress?.module?.title ?? null,
          moduleIcon:   progress?.module?.icon  ?? null,
          status:       progress?.status ?? "NOT_STARTED",
          currentStage: progress?.currentStage ?? 0,
          percentScore: progress?.percentScore ?? null,
          pendingCount: pendingMap.get(profile.userId) ?? 0,
        };
      }),
    })),
  };

  const teacherSection = teacher.teacherOf[0]?.name ?? "—";

  return (
    <>
      <style>{`.font-nunito { font-family: var(--font-nunito,'Nunito',sans-serif); }`}</style>
      <div className="flex min-h-screen bg-[#F5F7FA] dark:bg-[#0F172A] text-[#1E293B] dark:text-[#F1F5F9]">

        <TeacherSidebar
          teacherName={teacher.name}
          teacherInitials={initials(teacher.name)}
          teacherSection={teacherSection}
          totalStudents={allStudentIds.length}
          pendingGradeCount={totalPending}
          activePath="students"
        />

        <div className="flex-1 px-8 pb-8 pt-14 md:pt-8 overflow-x-hidden">

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Link
              href="/dashboard/teacher"
              className="text-sm text-[#64748B] hover:text-[#4A9B7F] transition-colors"
            >
              ← Dashboard
            </Link>
            <span className="text-[#E2E8F0] dark:text-[#334155]">/</span>
            <span className="text-sm font-semibold">Students</span>
          </div>

          <div className="flex items-start justify-between mb-7">
            <div>
              <h1 className="font-nunito text-2xl font-extrabold mb-1">All Students</h1>
              <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
                {allStudentIds.length} student{allStudentIds.length !== 1 ? "s" : ""} across {teacher.teacherOf.length} section{teacher.teacherOf.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <StudentsClient data={data} />

        </div>
      </div>
    </>
  );
}
