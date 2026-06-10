// app/admin/users/new/page.tsx
import { redirect } from "next/navigation";
import { getSessionUserFast } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import NewUserClient from "./_components/NewUserClient";

export type SectionOption = { id: number; name: string; emoji: string; schoolId: number | null };
export type SchoolOption  = { id: number; name: string };

export default async function NewUserPage() {
  const session = await getSessionUserFast();
  if (!session || session.role !== "ADMIN") redirect("/login");

  const [sections, schools] = await Promise.all([
    prisma.section.findMany({
      where:   { isActive: true },
      select:  { id: true, name: true, emoji: true, schoolId: true },
      orderBy: { name: "asc" },
    }),
    prisma.school.findMany({
      where:   { isActive: true },
      select:  { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return <NewUserClient sections={sections} schools={schools} />;
}
