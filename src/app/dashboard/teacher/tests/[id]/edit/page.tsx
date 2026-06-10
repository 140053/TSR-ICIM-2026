// app/dashboard/teacher/tests/[id]/edit/page.tsx
// Server Component — load existing test set and pass to edit client.

import { redirect, notFound } from "next/navigation";
import { getSessionUserFast } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import EditTestClient from "./_components/EditTestClient";

export interface EditTestQuestion {
  id:           number;
  questionNum:  number;
  context:      string;
  questionText: string;
  answerType:   string;
  answer:       string;
  choices:      [string, string, string, string] | null;
  difficulty:   string;
  melc:         string;
  points:       number;
}

export interface EditTestData {
  id:           number;
  title:        string;
  type:         "PRE_TEST" | "POST_TEST";
  description:  string;
  timeLimit:    string;   // minutes as string for the form
  moduleId:     number | null;
  questions:    EditTestQuestion[];
  resultCount:  number;   // if > 0, questions are locked
}

export default async function EditTestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSessionUserFast();
  if (!session || session.role !== "TEACHER") redirect("/login");

  const { id } = await params;
  const testSetId = parseInt(id);
  if (isNaN(testSetId)) notFound();

  const testSet = await prisma.testSet.findUnique({
    where:   { id: testSetId },
    include: { questions: { orderBy: { questionNum: "asc" } } },
  });

  if (!testSet) notFound();

  const resultCount = await prisma.testResult.count({ where: { testSetId } });

  const data: EditTestData = {
    id:          testSet.id,
    title:       testSet.title,
    type:        testSet.type as "PRE_TEST" | "POST_TEST",
    description: testSet.description ?? "",
    timeLimit:   testSet.timeLimit ? String(Math.round(testSet.timeLimit / 60)) : "",
    moduleId:    testSet.moduleId ?? null,
    resultCount,
    questions:   testSet.questions.map((q) => ({
      id:           q.id,
      questionNum:  q.questionNum,
      context:      q.context,
      questionText: q.questionText,
      answerType:   q.answerType,
      answer:       q.answer,
      choices:      q.choices
        ? (JSON.parse(q.choices) as [string, string, string, string])
        : null,
      difficulty:   q.difficulty,
      melc:         q.melc ?? "",
      points:       q.points,
    })),
  };

  return <EditTestClient data={data} />;
}
