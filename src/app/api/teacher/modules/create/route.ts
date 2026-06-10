// app/api/teacher/modules/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { z } from "zod";

// ─── Stage schema ─────────────────────────────────────────────
const StageSchema = z.object({
  stageNumber:   z.number().int().min(1).max(12),
  title:         z.string().min(1, "Stage title is required."),
  instruction:   z.string().min(1, "Stage instruction is required."),
  // type is set per-stage from the page; accept all valid DB enum values
  type: z.enum([
    "MULTIPLE_CHOICE",
    "RANKING",
    "OPEN_ENDED",
    "TABLE_INPUT",
    "CHECKLIST",
    "COMPUTATION",
    "MULTI_PLAN",
    "BUDGET_CHECK",
    "SELECT_JUSTIFY",
    "REFLECTION_SLIDER",
  ] as const).optional().default("OPEN_ENDED"),
  hint:          z.string().optional().nullable(),
  options:       z.any().optional().nullable(),
  correctAnswer: z.string().optional().nullable(),
  maxScore:      z.number().int().min(0).default(10),
  timeLimit:     z.number().int().min(0).optional().nullable(),
  melc:          z.string().optional().nullable(),
});

// ─── Module schema ────────────────────────────────────────────
const ModuleSchema = z.object({
  title:        z.string().min(2, "Title is required.").max(120),
  subtitle:     z.string().optional().nullable(),
  context:      z.string().min(1, "Context is required."),
  scenario:     z.string().min(10, "Scenario description is required."),
  icon:         z.string().default("📦"),
  timeEstimate: z.number().int().min(0).optional().nullable(),
  melcTags:     z.array(z.string()).optional().nullable(),
  bannerUrl:    z.string().optional().nullable(),
  sectionIds:   z.array(z.number().int()).optional(),  // assign immediately
  dueDate:      z.string().optional().nullable(),
  stages:       z.array(StageSchema).length(12, "All 12 stages are required."),
  saveAsDraft:  z.boolean().default(false),
  quizQuestions: z.array(z.object({
    questionNum:  z.number().int().min(1),
    questionText: z.string().min(1),
    type:         z.enum(["multiple_choice", "ranking", "open_ended"]),
    options:      z.any().optional().nullable(),
    correctAnswer:z.string().optional().nullable(),
    hint:         z.string().optional().nullable(),
    maxScore:     z.number().int().min(1).default(10),
  })).optional().default([]),
});

// ─── POST /api/teacher/modules/create ─────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN")) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const body   = await req.json();
    const parsed = ModuleSchema.safeParse(body);

    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return NextResponse.json(
        { success: false, error: issue?.message ?? "Invalid data.", field: issue?.path.join(".") },
        { status: 400 }
      );
    }

    const { title, subtitle, context, scenario, icon, timeEstimate,
            melcTags, bannerUrl, sectionIds, dueDate, stages, saveAsDraft, quizQuestions } = parsed.data;

    // Determine which phases each stage belongs to
    const phaseOf = (n: number) => {
      if (n <= 3)  return "UNDERSTANDING";
      if (n <= 7)  return "ANALYSIS";
      if (n <= 10) return "SOLUTION";
      return "REFLECTION";
    };

    // Derive type from stage number if not explicitly provided
    const typeByStage: Record<number, string> = {
      1:"MULTIPLE_CHOICE", 2:"RANKING",     3:"OPEN_ENDED",
      4:"TABLE_INPUT",     5:"CHECKLIST",   6:"OPEN_ENDED",
      7:"COMPUTATION",     8:"MULTI_PLAN",  9:"CHECKLIST",
      10:"BUDGET_CHECK",   11:"SELECT_JUSTIFY", 12:"REFLECTION_SLIDER",
    };

    const isDraft   = saveAsDraft || false;
    const moduleStatus = isDraft ? "DRAFT" : "ACTIVE";

    // For teachers publishing (not draft): fetch their active sections to auto-assign
    const teacherSections = (session.role === "TEACHER" && !isDraft)
      ? await prisma.section.findMany({
          where:  { teacherId: session.id, isActive: true },
          select: { id: true },
        })
      : [];

    const module = await prisma.$transaction(async (tx) => {
      // 1. Create module — record who created it so teachers can find their own drafts
      const newModule = await tx.module.create({
        data: {
          title,
          subtitle:        subtitle ?? null,
          context,
          scenario,
          icon,
          status:          moduleStatus as any,
          timeEstimate:    timeEstimate ?? null,
          melcTags:        melcTags    ?? undefined,
          bannerUrl:       bannerUrl   ?? null,
          createdByUserId: session.id,
          gradeLevel:      "Grade 6",
        },
      });

      // 2. Create all 12 stages
      await tx.stage.createMany({
        data: stages.map((s) => ({
          moduleId:      newModule.id,
          stageNumber:   s.stageNumber,
          phase:         phaseOf(s.stageNumber) as any,
          title:         s.title,
          instruction:   s.instruction,
          type:          (s.type ?? typeByStage[s.stageNumber] ?? "OPEN_ENDED") as any,
          hint:          s.hint          ?? null,
          options:       s.options       ?? null,
          correctAnswer: s.correctAnswer ?? null,
          maxScore:      s.maxScore,
          timeLimit:     s.timeLimit     ?? null,
          melc:          s.melc          ?? null,
        })),
      });

      // 3. Assign to sections
      //    Draft modules are NEVER assigned — they stay private until published.
      //    Publishing teachers: auto-assign to ALL their active sections.
      //    Admins publishing: use explicitly provided sectionIds.
      const sectionsToAssign = isDraft
        ? []
        : session.role === "TEACHER"
          ? teacherSections
          : (sectionIds && sectionIds.length > 0)
            ? await tx.section.findMany({ where: { id: { in: sectionIds }, isActive: true } })
            : [];

      if (sectionsToAssign.length > 0) {
        const due = dueDate ? new Date(dueDate) : null;
        await tx.moduleAssignment.createMany({
          data: sectionsToAssign.map((sec) => ({
            moduleId:  newModule.id,
            sectionId: sec.id,
            dueDate:   due,
          })),
          skipDuplicates: true,
        });
      }

      // 4. Create quiz questions if provided
      if (quizQuestions && quizQuestions.length > 0) {
        await tx.moduleQuizQuestion.createMany({
          data: quizQuestions.map((q) => ({
            moduleId:      newModule.id,
            questionNum:   q.questionNum,
            questionText:  q.questionText,
            type:          q.type,
            options:       q.options ?? null,
            correctAnswer: q.correctAnswer ?? null,
            hint:          q.hint ?? null,
            maxScore:      q.maxScore,
          })),
        });
      }

      return newModule;
    });

    return NextResponse.json(
      {
        success:  true,
        message:  saveAsDraft ? "Module saved as draft." : "Module created successfully.",
        moduleId: module.id,
        redirectTo: `/dashboard/teacher/modules`,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[TEACHER/MODULES/CREATE]", err);
    return NextResponse.json(
      { success: false, error: "Failed to create module. Please try again." },
      { status: 500 }
    );
  }
}

// ─── GET /api/teacher/modules/create ─────────────────────────
// Returns sections so the form can populate the assign dropdown
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN")) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    // Admins see all active sections; teachers see only their own
    const where = session.role === "ADMIN"
      ? { isActive: true }
      : { teacherId: session.id, isActive: true };

    const sections = await prisma.section.findMany({
      where,
      select:  { id: true, name: true, emoji: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, sections }, { status: 200 });
  } catch (err) {
    console.error("[TEACHER/MODULES/CREATE GET]", err);
    return NextResponse.json({ success: false, error: "Failed to load sections." }, { status: 500 });
  }
}