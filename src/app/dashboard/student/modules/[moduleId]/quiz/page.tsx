// app/dashboard/student/modules/[moduleId]/quiz/page.tsx
// Server Component — loads module quiz questions for a student.
// Only accessible after the student has completed all 12 stages.

import { redirect, notFound } from "next/navigation";
import { getSessionUserFast } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import ModuleQuizClient from "./_components/ModuleQuizClient";

export interface QuizQuestionData {
  id:           number;
  questionNum:  number;
  questionText: string;
  type:         string;
  options:      Record<string, unknown>;
  hint:         string | null;
  maxScore:     number;
  // Pre-filled if already answered
  existingAnswer: string | null;
  existingScore:  number | null;
}

export interface ModuleQuizData {
  moduleId:    number;
  moduleTitle: string;
  moduleIcon:  string;
  questions:   QuizQuestionData[];
  student: {
    name:        string;
    avatarEmoji: string;
    avatarName:  string;
    difficulty:  string;
  };
}

export default async function ModuleQuizPage({
  params,
}: {
  params: Promise<{ moduleId: string }>;
}) {
  const session = await getSessionUserFast();
  if (!session || session.role !== "STUDENT") redirect("/login");

  const { moduleId: modStr } = await params;
  const moduleId = parseInt(modStr);
  if (isNaN(moduleId)) notFound();

  const profile = await prisma.studentProfile.findUnique({
    where:   { userId: session.id },
    include: { user: true },
  });
  if (!profile || !profile.setupDone) redirect("/onboarding");

  // Fetch module + quiz questions
  const [module, questions, existingResponses] = await Promise.all([
    prisma.module.findUnique({ where: { id: moduleId }, select: { id: true, title: true, icon: true, status: true } }),
    prisma.moduleQuizQuestion.findMany({ where: { moduleId }, orderBy: { questionNum: "asc" } }),
    prisma.moduleQuizResponse.findMany({ where: { userId: session.id, moduleId } }),
  ]);

  if (!module || module.status === "ARCHIVED") notFound();
  if (questions.length === 0) redirect(`/dashboard/student/modules`);

  const responseMap = new Map(existingResponses.map((r) => [r.questionId, r]));

  const data: ModuleQuizData = {
    moduleId,
    moduleTitle: module.title,
    moduleIcon:  module.icon,
    student: {
      name:        profile.user.name,
      avatarEmoji: profile.avatarEmoji ?? "🧙‍♂️",
      avatarName:  profile.avatarName  ?? "",
      difficulty:  profile.difficulty,
    },
    questions: questions.map((q) => {
      const resp = responseMap.get(q.id);
      return {
        id:             q.id,
        questionNum:    q.questionNum,
        questionText:   q.questionText,
        type:           q.type,
        options:        (q.options ?? {}) as Record<string, unknown>,
        hint:           q.hint,
        maxScore:       q.maxScore,
        existingAnswer: resp?.answer ?? null,
        existingScore:  resp?.score  ?? null,
      };
    }),
  };

  return <ModuleQuizClient data={data} />;
}
