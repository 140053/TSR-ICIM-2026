// app/dashboard/student/profile/page.tsx
// Server Component — student profile view/edit

import { redirect } from "next/navigation";
import { getSessionUserFast } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import StudentProfileClient from "./_components/StudentProfileClient";

export interface StudentProfileData {
  student: {
    id:          number;
    name:        string;
    initials:    string;
    email:       string;
    avatarEmoji: string;
    avatarName:  string;
    difficulty:  string;
    section:     string;
    xp:          number;
    level:       number;
    joinedAt:    string;
  };
  nav: {
    modulesAssigned: number;
  };
}

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function diffLabel(d: string) {
  if (d === "APPRENTICE") return "🌱 Apprentice";
  if (d === "CHAMPION")   return "🔥 Champion";
  return "⚔️ Adventurer";
}

export default async function StudentProfilePage() {
  const session = await getSessionUserFast();
  if (!session || session.role !== "STUDENT") redirect("/login");

  const [user, modulesAssigned] = await Promise.all([
    prisma.user.findUnique({
      where:   { id: session.id },
      include: {
        profile: {
          include: { section: { select: { name: true } } },
        },
      },
    }),
    prisma.moduleAssignment.count({
      where: {
        section: {
          students: { some: { userId: session.id } },
        },
      },
    }),
  ]);

  if (!user || !user.profile) redirect("/login");

  const p = user.profile;

  const data: StudentProfileData = {
    student: {
      id:          user.id,
      name:        user.name,
      initials:    initials(user.name),
      email:       user.email,
      avatarEmoji: p.avatarEmoji,
      avatarName:  p.avatarName,
      difficulty:  diffLabel(p.difficulty),
      section:     p.section?.name ?? "—",
      xp:          p.xp,
      level:       p.level,
      joinedAt:    user.createdAt.toLocaleDateString("en-PH", {
        month: "long", day: "numeric", year: "numeric",
      }),
    },
    nav: { modulesAssigned },
  };

  return <StudentProfileClient data={data} />;
}
