// app/admin/modules/[id]/stages/page.tsx
// Server component — fetch module + all stages, pass to editor client.

import { redirect } from "next/navigation";
import { getSessionUserFast } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import StageEditorClient from "./_components/StageEditorClient";

export interface StageData {
  id:            number;
  stageNumber:   number;
  phase:         string;
  type:          string;
  title:         string;
  instruction:   string;
  hint:          string | null;
  maxScore:      number;
  timeLimit:     number | null;
  melc:          string | null;
  options:       unknown;        // raw JSON value
  correctAnswer: string | null;
}

export interface ModuleEditorData {
  id:     number;
  title:  string;
  icon:   string;
  status: string;
  stages: StageData[];
}

type Ctx = { params: Promise<{ id: string }> };

export default async function StageEditorPage({ params }: Ctx) {
  const session = await getSessionUserFast();
  if (!session || session.role !== "ADMIN") redirect("/login");

  const { id: idStr } = await params;
  const moduleId = parseInt(idStr);
  if (isNaN(moduleId)) redirect("/admin");

  const module = await prisma.module.findUnique({
    where:   { id: moduleId },
    include: { stages: { orderBy: { stageNumber: "asc" } } },
  });
  if (!module) redirect("/admin");

  const data: ModuleEditorData = {
    id:     module.id,
    title:  module.title,
    icon:   module.icon,
    status: module.status.toLowerCase(),
    stages: module.stages.map((s) => ({
      id:            s.id,
      stageNumber:   s.stageNumber,
      phase:         s.phase,
      type:          s.type,
      title:         s.title,
      instruction:   s.instruction,
      hint:          s.hint ?? null,
      maxScore:      s.maxScore,
      timeLimit:     s.timeLimit ?? null,
      melc:          s.melc ?? null,
      options:       s.options ?? null,
      correctAnswer: s.correctAnswer ?? null,
    })),
  };

  return <StageEditorClient data={data} />;
}
