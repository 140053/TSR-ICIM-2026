// app/admin/modules/[id]/quiz/page.tsx
// Admin quiz editor page — reuses teacher quiz API (supports ADMIN role)

import { redirect } from "next/navigation";
import { getSessionUserFast } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import QuizEditorClient from "./_components/QuizEditorClient";

export interface QuizQuestionData {
  id:             number;
  questionNum:    number;
  questionText:   string;
  type:           string;
  options:        unknown;
  correctAnswer:  string | null;
  hint:           string | null;
  maxScore:       number;
}

export interface ModuleQuizData {
  id:    number;
  title: string;
  icon:  string;
  questions: QuizQuestionData[];
}

type Ctx = { params: Promise<{ id: string }> };

export default async function AdminQuizPage({ params }: Ctx) {
  const session = await getSessionUserFast();
  if (!session || session.role !== "ADMIN") redirect("/login");

  const { id: idStr } = await params;
  const moduleId = parseInt(idStr);
  if (isNaN(moduleId)) redirect("/admin");

  const module = await prisma.module.findUnique({
    where: { id: moduleId },
    select: { id: true, title: true, icon: true },
  });
  if (!module) redirect("/admin");

  const questions = await prisma.moduleQuizQuestion.findMany({
    where:   { moduleId },
    orderBy: { questionNum: "asc" },
  });

  const data: ModuleQuizData = {
    id:    module.id,
    title: module.title,
    icon:  module.icon,
    questions: questions.map((q) => ({
      id:             q.id,
      questionNum:    q.questionNum,
      questionText:   q.questionText,
      type:           q.type,
      options:        q.options,
      correctAnswer:  q.correctAnswer,
      hint:           q.hint,
      maxScore:       q.maxScore,
    })),
  };

  return <QuizEditorClient data={data} />;
}