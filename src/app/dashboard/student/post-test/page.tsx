// app/dashboard/student/post-test/page.tsx
// Server Component — load the active POST_TEST set for this student.

import { redirect } from "next/navigation";
import { getSessionUserFast } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { seededShuffle } from "@/lib/shuffle";
import PostTestClient from "./_components/PostTestClient";

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

export interface PostTestData {
  testSetId:   number;
  title:       string;
  description: string | null;
  timeLimit:   number | null;  // seconds; null = untimed
  questions:   TestQuestion[];
  studentName: string;
}

export interface PostTestResult {
  score:        number;
  totalItems:   number;
  percentScore: number;
  submittedAt:  string;
}

// ─── Page ─────────────────────────────────────────────────────
export default async function PostTestPage() {
  const session = await getSessionUserFast();
  if (!session || session.role !== "STUDENT") redirect("/login");

  // Get student's section so we only show post-tests for assigned modules
  const profile = await prisma.studentProfile.findUnique({
    where:  { userId: session.id },
    select: { sectionId: true },
  });

  const sectionId = profile?.sectionId ?? null;

  // Find modules assigned to this student's section
  const assignedModuleIds = sectionId
    ? (await prisma.moduleAssignment.findMany({
        where:  { sectionId },
        select: { moduleId: true },
      })).map((a) => a.moduleId)
    : [];

  // Find active POST_TEST test set for one of the assigned modules
  // Use id: 0 (impossible match) when no modules assigned so TypeScript infers
  // the full include type from a single non-conditional query.
  const testSet = await prisma.testSet.findFirst({
    where: {
      type:     "POST_TEST",
      isActive: true,
      moduleId: assignedModuleIds.length > 0
        ? { in: assignedModuleIds }
        : { in: [] },
    },
    include: {
      questions: { orderBy: { questionNum: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Check if student already submitted this post-test
  const existingResult = testSet
    ? await prisma.testResult.findUnique({
        where: { userId_testSetId: { userId: session.id, testSetId: testSet.id } },
      })
    : null;

  // Already taken — show score
  if (existingResult) {
    const result: PostTestResult = {
      score:        existingResult.score,
      totalItems:   existingResult.totalItems,
      percentScore: Math.round(existingResult.percentScore),
      submittedAt:  existingResult.submittedAt.toLocaleDateString("en-PH", {
        month: "long", day: "numeric", year: "numeric",
      }),
    };
    return (
      <PostTestClient
        data={null}
        alreadyTaken={result}
        locked={false}
        studentName={session.name}
      />
    );
  }

  // No post-test assigned to this student's section
  if (!testSet || testSet.questions.length === 0) {
    return (
      <PostTestClient
        data={null}
        alreadyTaken={null}
        locked={false}
        studentName={session.name}
      />
    );
  }

  // Gate: student must have completed the module this post-test is for
  const completedModule = testSet.moduleId
    ? await prisma.moduleProgress.findUnique({
        where: {
          userId_moduleId: { userId: session.id, moduleId: testSet.moduleId },
        },
        select: { status: true },
      })
    : await prisma.moduleProgress.findFirst({
        where:  { userId: session.id, status: "COMPLETED" },
        select: { status: true },
      });

  if (!completedModule || completedModule.status !== "COMPLETED") {
    return (
      <PostTestClient
        data={null}
        alreadyTaken={null}
        locked={true}
        studentName={session.name}
      />
    );
  }

  const data: PostTestData = {
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

  return (
    <PostTestClient
      data={data}
      alreadyTaken={null}
      locked={false}
      studentName={session.name}
    />
  );
}
