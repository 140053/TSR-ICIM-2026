// Server component — renders the CompletionScreen after quiz submission.

import { redirect, notFound } from "next/navigation";
import { getSessionUserFast } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import CompletionScreen from "../stage/[stageNum]/_components/CompletionScreen";

type Ctx = { params: Promise<{ moduleId: string }> };

export default async function CompletePage({ params }: Ctx) {
  const session = await getSessionUserFast();
  if (!session || session.role !== "STUDENT") redirect("/login");

  const { moduleId: idStr } = await params;
  const moduleId = parseInt(idStr);
  if (isNaN(moduleId)) notFound();

  const module = await prisma.module.findUnique({
    where:  { id: moduleId },
    select: { id: true, title: true, icon: true, status: true },
  });
  if (!module || module.status === "ARCHIVED") notFound();

  return (
    <CompletionScreen
      moduleId={module.id}
      moduleTitle={module.title}
      moduleIcon={module.icon}
    />
  );
}
