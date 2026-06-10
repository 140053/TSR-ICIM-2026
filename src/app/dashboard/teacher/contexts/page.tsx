// app/dashboard/teacher/contexts/page.tsx
// Server component — auth + sidebar data, hands off to client for CRUD.

import { redirect } from "next/navigation";
import { getSessionUserFast } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import TeacherContextsClient from "./_components/TeacherContextsClient";

export interface TeacherContextsPageData {
  teacher: { name: string; initials: string; section: string };
  totalStudents:     number;
  pendingGradeCount: number;
}

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

export default async function TeacherContextsPage() {
  const session = await getSessionUserFast();
  if (!session || session.role !== "TEACHER") redirect("/login");

  const teacher = await prisma.user.findUnique({
    where:   { id: session.id },
    include: {
      teacherOf: {
        where:   { isActive: true },
        include: { students: true },
      },
    },
  });
  if (!teacher) redirect("/login");

  const section       = teacher.teacherOf[0];
  const sectionName   = section?.name ?? "—";
  const studentIds    = section?.students.map((s) => s.userId) ?? [];

  const pendingGradeCount = await prisma.stageResponse.count({
    where: { userId: { in: studentIds }, score: null, gradedAt: null },
  });

  const data: TeacherContextsPageData = {
    teacher: {
      name:     teacher.name,
      initials: initials(teacher.name),
      section:  sectionName,
    },
    totalStudents:     studentIds.length,
    pendingGradeCount,
  };

  return <TeacherContextsClient data={data} />;
}
