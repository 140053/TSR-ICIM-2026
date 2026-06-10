// app/dashboard/teacher/grade/page.tsx
// Server Component — loads all pending (ungraded) open-ended stage responses
// across every student in the teacher's sections.

import { redirect }           from "next/navigation";
import { getSessionUserFast } from "@/lib/auth/session";
import { prisma }             from "@/lib/prisma";
import TeacherSidebar         from "../_components/TeacherSidebar";
import GradeQueueClient       from "./_components/GradeQueueClient";
import type { GradeQueueData } from "./_components/GradeQueueClient";

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

export default async function GradePage() {
  const session = await getSessionUserFast();
  if (!session || session.role !== "TEACHER") redirect("/login");

  // ── 1. Teacher + sections + students ──────────────────────────
  const teacher = await prisma.user.findUnique({
    where:   { id: session.id },
    include: {
      teacherOf: {
        where:   { isActive: true },
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

  const sectionName  = teacher.teacherOf[0]?.name ?? "—";
  const studentIds   = teacher.teacherOf.flatMap((s) => s.students.map((st) => st.userId));
  const totalStudents = studentIds.length;

  // ── 2. Pending grade count (for sidebar badge) ─────────────────
  const totalPending = await prisma.stageResponse.count({
    where: { userId: { in: studentIds }, score: null, gradedAt: null },
  });

  // ── 3. All pending responses with full stage + student data ────
  const pending = await prisma.stageResponse.findMany({
    where: { userId: { in: studentIds }, score: null, gradedAt: null },
    include: {
      user: {
        include: { profile: true },
      },
      stage: {
        include: {
          module: { select: { id: true, title: true, icon: true } },
        },
      },
    },
    orderBy: [
      { user: { name: "asc" } },
      { stage: { stageNumber: "asc" } },
    ],
  });

  // ── 4. Build typed client data ─────────────────────────────────
  const data: GradeQueueData = {
    pendingGradeCount: totalPending,
    items: pending.map((r) => ({
      responseId:        r.id,
      studentId:         r.userId,
      studentName:       r.user.name,
      studentAvatar:     r.user.profile?.avatarEmoji ?? "🧑",
      studentDifficulty: r.user.profile?.difficulty  ?? "ADVENTURER",
      moduleName:        r.stage.module.title,
      moduleIcon:        r.stage.module.icon,
      stageNum:          r.stage.stageNumber,
      stageTitle:        r.stage.title,
      stageType:         r.stage.type,
      phase:             r.stage.phase,
      maxScore:          r.stage.maxScore,
      answer:            r.answer,
      stageOptions:      (r.stage.options ?? {}) as Record<string, unknown>,
      submittedAt:       r.createdAt.toISOString(),
      hintsUsed:         r.hintsUsed,
      timeSpent:         r.timeSpent,
    })),
  };

  return (
    <>
      <style>{`.font-nunito { font-family: var(--font-nunito,'Nunito',sans-serif); }`}</style>
      <div className="flex min-h-screen bg-[#F5F7FA] dark:bg-[#0F172A] text-[#1E293B] dark:text-[#F1F5F9]">

        <TeacherSidebar
          teacherName={teacher.name}
          teacherInitials={initials(teacher.name)}
          teacherSection={sectionName}
          totalStudents={totalStudents}
          pendingGradeCount={totalPending}
          activePath="grade"
        />

        <div className="flex-1 min-w-0 pt-14 md:pt-0">
          <GradeQueueClient data={data} />
        </div>

      </div>
    </>
  );
}
