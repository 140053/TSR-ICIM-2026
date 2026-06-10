// app/dashboard/student/pre-test/page.tsx
// Server Component — load the active PRE_TEST set for this student.

import { redirect } from "next/navigation";
import { getSessionUserFast } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { seededShuffle } from "@/lib/shuffle";
import PreTestClient from "./_components/PreTestClient";

// ─── Exported types ────────────────────────────────────────────
export interface TestQuestion {
  id:           number;
  questionNum:  number;
  context:      string;
  questionText: string;
  answerType:   string;  // "number" | "text" | "time" | "multiple_choice"
  choices:      string[] | null;
  difficulty:   string;
  points:       number;
  melc:         string | null;
}

export interface PreTestData {
  testSetId:   number;
  title:       string;
  description: string | null;
  timeLimit:   number | null;  // seconds; null = untimed
  questions:   TestQuestion[];
  studentName: string;
}

export interface PreTestResult {
  score:       number;
  totalItems:  number;
  percentScore: number;
  submittedAt: string;
}

// ─── Page ─────────────────────────────────────────────────────
export default async function PreTestPage() {
  const session = await getSessionUserFast();
  if (!session || session.role !== "STUDENT") redirect("/login");

  // Find the active PRE_TEST set
  const testSet = await prisma.testSet.findFirst({
    where:   { type: "PRE_TEST", isActive: true },
    include: {
      questions: { orderBy: { questionNum: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Check if student already took this pre-test
  const existingResult = testSet
    ? await prisma.testResult.findUnique({
        where: { userId_testSetId: { userId: session.id, testSetId: testSet.id } },
      })
    : null;

  // If already taken — show completed state with score
  if (existingResult) {
    const result: PreTestResult = {
      score:        existingResult.score,
      totalItems:   existingResult.totalItems,
      percentScore: Math.round(existingResult.percentScore),
      submittedAt:  existingResult.submittedAt.toLocaleDateString("en-PH", {
        month: "long", day: "numeric", year: "numeric",
      }),
    };
    return (
      <PreTestClient
        data={null}
        alreadyTaken={result}
        studentName={session.name}
      />
    );
  }

  // No active pre-test available
  if (!testSet || testSet.questions.length === 0) {
    return (
      <PreTestClient
        data={null}
        alreadyTaken={null}
        studentName={session.name}
      />
    );
  }

  const data: PreTestData = {
    testSetId:   testSet.id,
    title:       testSet.title,
    description: testSet.description ?? null,
    timeLimit:   testSet.timeLimit   ?? null,
    // Shuffle deterministically: same student + same test → same order
    questions: seededShuffle(
      testSet.questions.map((q) => ({
        id:           q.id,
        questionNum:  q.questionNum,
        context:      q.context,
        questionText: q.questionText,
        answerType:   q.answerType,
        choices:      q.choices ? JSON.parse(q.choices) as string[] : null,
        difficulty:   q.difficulty,
        points:       q.points,
        melc:         q.melc ?? null,
      })),
      session.id * 31 + testSet.id,
    ),
    studentName: session.name,
  };

  return <PreTestClient data={data} alreadyTaken={null} studentName={session.name} />;
}
