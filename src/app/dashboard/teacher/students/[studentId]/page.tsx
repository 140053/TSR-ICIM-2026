// app/dashboard/teacher/students/[studentId]/page.tsx
// Server Component — loads all stage responses + diagnostic for one student.

import { redirect, notFound }  from "next/navigation";
import { getSessionUserFast }  from "@/lib/auth/session";
import { prisma }              from "@/lib/prisma";
import StudentResponsesClient  from "./_components/StudentResponsesClient";
import type { StudentDetailData } from "./_components/StudentResponsesClient";

type Ctx = { params: Promise<{ studentId: string }> };

export default async function StudentDetailPage({ params }: Ctx) {
  const session = await getSessionUserFast();
  if (!session || session.role !== "TEACHER") redirect("/login");

  const { studentId: idStr } = await params;
  const studentId = parseInt(idStr);
  if (isNaN(studentId)) notFound();

  // Fetch student profile + user + section
  const profile = await prisma.studentProfile.findUnique({
    where:   { userId: studentId },
    include: { user: true, section: true },
  });
  if (!profile) notFound();

  // Verify this student belongs to a section owned by the current teacher
  if (profile.section?.teacherId !== session.id) {
    redirect("/dashboard/teacher/students");
  }

  // Latest module progress for this student
  const progress = await prisma.moduleProgress.findFirst({
    where:   { userId: studentId },
    include: { module: { select: { id: true, title: true, icon: true } } },
    orderBy: { lastActiveAt: "desc" },
  });

  // All stage responses for the most recent module
  const responses = progress
    ? await prisma.stageResponse.findMany({
        where:   { userId: studentId, moduleId: progress.moduleId },
        include: {
          stage: {
            select: {
              stageNumber:   true,
              title:         true,
              type:          true,
              phase:         true,
              maxScore:      true,
              options:       true,
              correctAnswer: true,
            },
          },
        },
        orderBy: { stage: { stageNumber: "asc" } },
      })
    : [];

  // Latest diagnostic report
  const diagnostic = progress
    ? await prisma.diagnosticReport.findUnique({
        where: { userId_moduleId: { userId: studentId, moduleId: progress.moduleId } },
      })
    : null;

  // Build typed data for the client
  const data: StudentDetailData = {
    student: {
      id:          profile.userId,
      name:        profile.user.name,
      avatarEmoji: profile.avatarEmoji,
      avatarName:  profile.avatarName,
      difficulty:  profile.difficulty,
      sectionName: profile.section?.name ?? "—",
    },
    moduleId:    progress?.moduleId    ?? 0,
    moduleTitle: progress?.module?.title ?? "No module started",
    moduleIcon:  progress?.module?.icon  ?? "📦",
    progress: progress
      ? {
          status:       progress.status,
          currentStage: progress.currentStage,
          percentScore: progress.percentScore,
          totalScore:   progress.totalScore,
          maxPossible:  progress.maxPossible,
        }
      : null,
    diagnostic: diagnostic
      ? {
          understandingScore: diagnostic.understandingScore,
          analysisScore:      diagnostic.analysisScore,
          solutionScore:      diagnostic.solutionScore,
          reflectionScore:    diagnostic.reflectionScore,
          overallScore:       diagnostic.overallScore,
          needsIntervention:  diagnostic.needsIntervention,
        }
      : null,
    responses: responses.map((r) => ({
      id:          r.id,
      stageNum:    r.stage.stageNumber,
      stageTitle:  r.stage.title,
      stageType:   r.stage.type,
      phase:       r.stage.phase as StudentDetailData["responses"][number]["phase"],
      answer:      r.answer,
      isCorrect:   r.isCorrect,
      score:       r.score,
      maxScore:    r.stage.maxScore,
      timeSpent:   r.timeSpent,
      hintsUsed:   r.hintsUsed,
      teacherNote: r.teacherNote,
      gradedAt:    r.gradedAt?.toISOString() ?? null,
      stageOptions: (r.stage.options ?? {}) as Record<string, unknown>,
    })),
    pendingCount: responses.filter((r) => r.score === null && r.gradedAt === null).length,
  };

  return <StudentResponsesClient data={data} />;
}
