// app/api/student/modules/[moduleId]/stage/[stageNum]/route.ts
//
// POST { answer: string, timeSpent: number }
//   Saves (or updates) the student's stage response.
//   Updates ModuleProgress.currentStage if advancing.
//   Triggers diagnostic computation on stage 12.

import { NextRequest, NextResponse } from "next/server";
import { getSessionUserFast } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const Schema = z.object({
  answer:    z.string().min(1, "Answer is required."),
  timeSpent: z.number().int().min(0).optional().default(0),
});

type Ctx = { params: Promise<{ moduleId: string; stageNum: string }> };

export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    const session = await getSessionUserFast();
    if (!session || session.role !== "STUDENT") {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const { moduleId: modStr, stageNum: stageStr } = await params;
    const moduleId = parseInt(modStr);
    const stageNum = parseInt(stageStr);

    if (isNaN(moduleId) || isNaN(stageNum) || stageNum < 1 || stageNum > 12) {
      return NextResponse.json({ success: false, error: "Invalid params." }, { status: 400 });
    }

    const body   = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? "Invalid data." },
        { status: 400 }
      );
    }

    const { answer, timeSpent } = parsed.data;

    // 1. Verify stage exists and belongs to this module
    const stage = await prisma.stage.findUnique({
      where: { moduleId_stageNumber: { moduleId, stageNumber: stageNum } },
    });
    if (!stage) {
      return NextResponse.json({ success: false, error: "Stage not found." }, { status: 404 });
    }

    // 2. Auto-score based on stage type
    let isCorrect: boolean | null = null;
    let score: number | null = null;

    try {
      switch (stage.type) {
        case "MULTIPLE_CHOICE": {
          const opts = stage.options as { correctChoiceIndex?: number } | null;
          const correctIdx = opts?.correctChoiceIndex;
          const selected   = parseInt(answer);
          if (correctIdx !== undefined && !isNaN(selected)) {
            isCorrect = selected === correctIdx;
            score     = isCorrect ? stage.maxScore : Math.floor(stage.maxScore * 0.3);
          }
          break;
        }
        case "RANKING": {
          if (stage.correctAnswer) {
            const submitted: { text: string }[] = JSON.parse(answer);
            const correct: string[]             = JSON.parse(stage.correctAnswer);
            const matches = submitted.filter((item, i) => item.text === correct[i]).length;
            score     = Math.round((matches / Math.max(correct.length, 1)) * stage.maxScore);
            isCorrect = matches === correct.length;
          }
          break;
        }
        case "CHECKLIST": {
          if (stage.correctAnswer) {
            const raw = JSON.parse(answer);
            // Support both flat { [k]: bool } and nested { selected: { [k]: bool } } formats
            const checked: Record<number, boolean> = raw?.selected ?? raw;
            const correct: Record<number, boolean> = JSON.parse(stage.correctAnswer);
            const keys = Object.keys(correct).map(Number);
            const hits = keys.filter((k) => !!checked[k] === !!correct[k]).length;
            score     = Math.round((hits / Math.max(keys.length, 1)) * stage.maxScore);
            isCorrect = hits === keys.length;
          }
          break;
        }
        case "COMPUTATION": {
          const qtys: Record<number, number> = JSON.parse(answer);
          const opts = stage.options as { calcItems?: { price: number }[]; budget?: number } | null;
          const calcItems = opts?.calcItems ?? [];
          const budget    = opts?.budget    ?? 6000;
          const total     = calcItems.reduce((s, item, i) => s + (qtys[i] ?? 0) * item.price, 0);
          isCorrect = total > 0 && total <= budget;
          score     = isCorrect ? stage.maxScore : total > 0 ? Math.floor(stage.maxScore * 0.5) : 0;
          break;
        }
        case "BUDGET_CHECK": {
          const qtys: Record<string, number> = JSON.parse(answer);
          const opts = stage.options as { trialItems?: { id: string; price: number }[]; trialBudget?: number } | null;
          const trialItems = opts?.trialItems  ?? [];
          const budget     = opts?.trialBudget ?? 6000;
          const total      = trialItems.reduce((s, item) => s + (qtys[item.id] ?? 0) * item.price, 0);
          isCorrect = total > 0 && total <= budget;
          score     = isCorrect ? stage.maxScore : total > 0 ? Math.floor(stage.maxScore * 0.5) : 0;
          break;
        }
        case "SELECT_JUSTIFY": {
          const state: { chosen: "A" | "B" | null; justify: string } = JSON.parse(answer);
          if (state.chosen && state.justify?.trim()) {
            if (stage.correctAnswer) {
              isCorrect = state.chosen === stage.correctAnswer;
              score     = isCorrect
                ? Math.floor(stage.maxScore * 0.6)   // 60% auto; teacher adds rest for justification
                : Math.floor(stage.maxScore * 0.2);
            } else {
              score = Math.floor(stage.maxScore * 0.5);
              // isCorrect stays null — teacher will review justification
            }
          }
          break;
        }
        // OPEN_ENDED, TABLE_INPUT, MULTI_PLAN, REFLECTION_SLIDER — teacher-graded, score stays null
      }
    } catch {
      // If parsing fails, leave isCorrect/score null — teacher will grade
    }

    // (formerly checked by stage number; now type-based — teacher-graded types stay null)

    // 3. Upsert the stage response
    await prisma.stageResponse.upsert({
      where:  { userId_stageId: { userId: session.id, stageId: stage.id } },
      create: {
        userId:    session.id,
        stageId:   stage.id,
        moduleId,
        answer,
        isCorrect,
        score,
        timeSpent: timeSpent ?? 0,
        hintsUsed: 0,
        attempts:  1,
      },
      update: {
        answer,
        isCorrect,
        score,
        timeSpent: timeSpent ?? 0,
        updatedAt: new Date(),
        attempts:  { increment: 1 },
      },
    });

    // 4. Update module progress
    const progress = await prisma.moduleProgress.findUnique({
      where: { userId_moduleId: { userId: session.id, moduleId } },
    });

    const nextStage   = Math.min(stageNum + 1, 12);
    const isLastStage = stageNum === 12;

    if (progress) {
      const newCurrentStage = isLastStage
        ? 12
        : Math.max(progress.currentStage, nextStage);

      await prisma.moduleProgress.update({
        where: { userId_moduleId: { userId: session.id, moduleId } },
        data: {
          currentStage: newCurrentStage,
          status:       isLastStage ? "COMPLETED" : "IN_PROGRESS",
          lastActiveAt: new Date(),
          ...(isLastStage && { completedAt: new Date() }),
        },
      });
    } else {
      await prisma.moduleProgress.create({
        data: {
          userId:       session.id,
          moduleId,
          difficulty:   "ADVENTURER",
          status:       isLastStage ? "COMPLETED" : "IN_PROGRESS",
          currentStage: isLastStage ? 12 : nextStage,
          lastActiveAt: new Date(),
          ...(isLastStage && { completedAt: new Date() }),
        },
      });
    }

    // 5. On final stage — compute diagnostic scores
    if (isLastStage) {
      await computeDiagnostic(session.id, moduleId);
    }

    return NextResponse.json({
      success: true,
      isCorrect,
      score,
      maxScore:    stage.maxScore,
      isLastStage,
      nextStageUrl: isLastStage
        ? null
        : `/dashboard/student/modules/${moduleId}/stage/${nextStage}`,
    });
  } catch (err) {
    console.error("[STUDENT/STAGE/SUBMIT]", err);
    return NextResponse.json(
      { success: false, error: "Failed to save response. Please try again." },
      { status: 500 }
    );
  }
}

// ─── DIAGNOSTIC ENGINE ────────────────────────────────────────
async function computeDiagnostic(userId: number, moduleId: number) {
  try {
    // Fetch all responses + stages for this module
    const responses = await prisma.stageResponse.findMany({
      where:   { userId, moduleId },
      include: { stage: { select: { stageNumber: true, maxScore: true, phase: true } } },
    });

    if (responses.length === 0) return;

    // Group by phase
    const byPhase: Record<string, { earned: number; max: number }> = {
      UNDERSTANDING: { earned: 0, max: 0 },
      ANALYSIS:      { earned: 0, max: 0 },
      SOLUTION:      { earned: 0, max: 0 },
      REFLECTION:    { earned: 0, max: 0 },
    };

    let totalEarned = 0;
    let totalMax    = 0;

    for (const r of responses) {
      const phase = r.stage.phase;
      const max   = r.stage.maxScore;
      const earned = r.score ?? 0;           // ungraded = 0 for now
      if (byPhase[phase]) {
        byPhase[phase].earned += earned;
        byPhase[phase].max    += max;
      }
      totalEarned += earned;
      totalMax    += max;
    }

    const pct = (grp: { earned: number; max: number }) =>
      grp.max > 0 ? (grp.earned / grp.max) * 100 : null;

    const uScore = pct(byPhase.UNDERSTANDING);
    const aScore = pct(byPhase.ANALYSIS);
    const sScore = pct(byPhase.SOLUTION);
    const rScore = pct(byPhase.REFLECTION);
    const overall = totalMax > 0 ? (totalEarned / totalMax) * 100 : null;

    const level = (s: number | null) => {
      if (s == null) return null;
      if (s >= 80) return "PROFICIENT";
      if (s >= 60) return "DEVELOPING";
      return "STRUGGLING";
    };

    const needsIntervention =
      [uScore, aScore, sScore, rScore].some((s) => s !== null && s < 60);

    // Upsert diagnostic report
    await prisma.diagnosticReport.upsert({
      where:  { userId_moduleId: { userId, moduleId } },
      create: {
        userId,
        moduleId,
        understandingScore: uScore,
        analysisScore:      aScore,
        solutionScore:      sScore,
        reflectionScore:    rScore,
        overallScore:       overall,
        understandingLevel: level(uScore)  as any,
        analysisLevel:      level(aScore)  as any,
        solutionLevel:      level(sScore)  as any,
        reflectionLevel:    level(rScore)  as any,
        needsIntervention,
      },
      update: {
        understandingScore: uScore,
        analysisScore:      aScore,
        solutionScore:      sScore,
        reflectionScore:    rScore,
        overallScore:       overall,
        understandingLevel: level(uScore)  as any,
        analysisLevel:      level(aScore)  as any,
        solutionLevel:      level(sScore)  as any,
        reflectionLevel:    level(rScore)  as any,
        needsIntervention,
        updatedAt:          new Date(),
      },
    });

    // Update module progress with final scores
    await prisma.moduleProgress.update({
      where: { userId_moduleId: { userId, moduleId } },
      data: {
        totalScore:   totalEarned,
        maxPossible:  totalMax,
        percentScore: overall,
      },
    });

    // Award XP
    const xpGain = Math.round((overall ?? 0) * 0.5) + 50; // base 50 + up to 50 from score
    await prisma.studentProfile.update({
      where: { userId },
      data: { xp: { increment: xpGain } },
    });
  } catch (err) {
    console.error("[DIAGNOSTIC/COMPUTE]", err);
    // Non-fatal — don't fail the request
  }
}