// app/dashboard/teacher/profile/page.tsx
// Server Component — teacher profile view/edit

import { redirect } from "next/navigation";
import { getSessionUserFast } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import TeacherProfileClient from "./_components/TeacherProfileClient";

export interface TeacherProfileData {
  teacher: {
    id:        number;
    name:      string;
    initials:  string;
    email:     string;
    section:   string;
    joinedAt:  string;
  };
  sidebar: {
    teacherName:       string;
    teacherInitials:   string;
    teacherSection:    string;
    totalStudents:     number;
    pendingGradeCount: number;
  };
}

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

export default async function TeacherProfilePage() {
  const session = await getSessionUserFast();
  if (!session || session.role !== "TEACHER") redirect("/login");

  const [teacher, pendingCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.id },
      include: {
        teacherOf: {
          where:   { isActive: true },
          orderBy: { name: "asc" },
          include: {
            students: { select: { userId: true } },
          },
        },
      },
    }),
    prisma.stageResponse.count({
      where: {
        score:     null,
        gradedAt:  null,
        user: { profile: { section: { teacherId: session.id } } },
      },
    }),
  ]);

  if (!teacher) redirect("/login");

  const primarySection = teacher.teacherOf[0];
  const totalStudents  = teacher.teacherOf.reduce((sum, sec) => sum + sec.students.length, 0);

  const data: TeacherProfileData = {
    teacher: {
      id:       teacher.id,
      name:     teacher.name,
      initials: initials(teacher.name),
      email:    teacher.email,
      section:  primarySection?.name ?? "—",
      joinedAt: teacher.createdAt.toLocaleDateString("en-PH", {
        month: "long", day: "numeric", year: "numeric",
      }),
    },
    sidebar: {
      teacherName:       teacher.name,
      teacherInitials:   initials(teacher.name),
      teacherSection:    primarySection?.name ?? "—",
      totalStudents,
      pendingGradeCount: pendingCount,
    },
  };

  return <TeacherProfileClient data={data} />;
}
