// app/dashboard/student/modules/[moduleId]/stage/[stageNum]/page.tsx
// Server Component — loads stage + existing response → StagePlayer

import { redirect, notFound } from "next/navigation";
import { getSessionUserFast } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import StagePlayer from "./_components/StagePlayer";

// ─── Exported types ───────────────────────────────────────────
export interface ChoiceOption  { icon: string; title: string; desc: string; }
export interface RankItem      { emoji: string; text: string; sub: string; }
export interface StarterChip   { label: string; text: string; }
export interface TableRow      {
  label: string; given: string; missing: string; assumed: string;
  givenEditable: boolean; missingEditable: boolean; assumedEditable: boolean;
}
export interface CheckItem     { text: string; desc: string; }
export interface CalcItem      { icon: string; label: string; price: number; unit: string; }
export interface PlanField     { label: string; key: string; type: "number"|"text"; placeholder: string; }
export interface RiskItem      { emoji: string; title: string; sub: string; }
export interface TrialItem     { icon: string; name: string; price: number; unit: string; id: string; }
export interface SliderQ       { question: string; loLabel: string; hiLabel: string; key: string; }

export interface StageOptions {
  choices?:           ChoiceOption[];
  correctChoiceIndex?:number;
  rankItems?:         RankItem[];
  starterChips?:      StarterChip[];
  minChars?:          number;
  tableRows?:         TableRow[];
  checkItems?:        CheckItem[];
  prompts?:           string[];
  calcItems?:         CalcItem[];
  budget?:            number;
  planLabels?:        [string, string];
  planFields?:        PlanField[];
  planBudget?:        number;
  riskItems?:         RiskItem[];
  hasContingency?:    boolean;
  trialItems?:        TrialItem[];
  trialBudget?:       number;
  justifyLabel?:      string;
  sliderQuestions?:   SliderQ[];
  openReflections?:   { question: string; key: string }[];
}

export interface StagePageData {
  // Module
  moduleId:       number;
  moduleTitle:    string;
  moduleIcon:     string;
  moduleScenario: string;
  moduleBannerUrl:string | null;
  totalStages:    number;

  // Stage
  stageId:      number;
  stageNum:     number;
  stageTitle:   string;
  stageType:    string;
  phase:        "UNDERSTANDING" | "ANALYSIS" | "SOLUTION" | "REFLECTION";
  instruction:  string;
  hint:         string | null;
  maxScore:     number;
  options:      StageOptions;

  // Student
  difficulty:   "APPRENTICE" | "ADVENTURER" | "CHAMPION";
  avatarEmoji:  string;
  avatarName:   string;
  studentName:  string;

  // Existing answer (if already attempted)
  existingAnswer: string | null;
  existingScore:  number | null;
  alreadyDone:    boolean;

  // Nav — pip statuses for tracker
  pipStatuses: ("done" | "current" | "locked" | "empty")[];
  phaseColors: ("blue" | "purple" | "amber" | "green")[];

  // Stage 8 saved plan data (needed by stage 11)
  planAnswerJson: string | null;
}

// ─── Helpers ─────────────────────────────────────────────────
function parseOptions(raw: unknown): StageOptions {
  if (!raw) return {};
  if (typeof raw === "string") { try { return JSON.parse(raw); } catch { return {}; } }
  if (typeof raw === "object") return raw as StageOptions;
  return {};
}

function phaseColor(num: number): "blue" | "purple" | "amber" | "green" {
  if (num <= 3)  return "blue";
  if (num <= 7)  return "purple";
  if (num <= 10) return "amber";
  return "green";
}

// ─── Page ─────────────────────────────────────────────────────
export default async function StagePage({
  params,
}: {
  params: Promise<{ moduleId: string; stageNum: string }>;
}) {
  const session = await getSessionUserFast();
  if (!session || session.role !== "STUDENT") redirect("/login");

  const { moduleId: moduleIdStr, stageNum: stageNumStr } = await params;
  const moduleId = parseInt(moduleIdStr);
  const stageNum = parseInt(stageNumStr);
  if (isNaN(moduleId) || isNaN(stageNum) || stageNum < 1) notFound();

  // If trying to access a stage beyond 12, redirect to quiz page
  if (stageNum > 12) {
    redirect(`/dashboard/student/modules/${moduleId}/quiz`);
  }

  // 1. Fetch student profile
  const profile = await prisma.studentProfile.findUnique({
    where:   { userId: session.id },
    include: { user: true },
  });
  if (!profile || !profile.setupDone) redirect("/onboarding");

  // 2. Fetch module + the specific stage
  const [module, stage] = await Promise.all([
    prisma.module.findUnique({
      where:  { id: moduleId },
      select: { id: true, title: true, icon: true, scenario: true, bannerUrl: true, status: true },
    }),
    prisma.stage.findUnique({
      where: { moduleId_stageNumber: { moduleId, stageNumber: stageNum } },
    }),
  ]);

  if (!module) notFound();
  // Allow DRAFT for now so teachers can test; only block ARCHIVED
  if (module.status === "ARCHIVED") notFound();
  if (!stage) {
    // Stage not created yet — redirect back to modules
    redirect(`/dashboard/student/modules`);
  }

  // 3. Fetch or create module progress
  let progress = await prisma.moduleProgress.findUnique({
    where: { userId_moduleId: { userId: session.id, moduleId } },
  });

  if (!progress) {
    // Auto-create progress when student first opens a stage
    progress = await prisma.moduleProgress.create({
      data: {
        userId:       session.id,
        moduleId,
        difficulty:   profile.difficulty,
        status:       "IN_PROGRESS",
        currentStage: stageNum,
        lastActiveAt: new Date(),
      },
    });
  } else if (progress.status === "NOT_STARTED") {
    await prisma.moduleProgress.update({
      where: { userId_moduleId: { userId: session.id, moduleId } },
      data:  { status: "IN_PROGRESS", currentStage: stageNum, lastActiveAt: new Date() },
    });
  } else {
    // Update lastActiveAt
    await prisma.moduleProgress.update({
      where: { userId_moduleId: { userId: session.id, moduleId } },
      data:  { lastActiveAt: new Date() },
    });
  }

  // 4. All stage responses for this module (for pip track + stage 11 plan data)
  const allResponses = await prisma.stageResponse.findMany({
    where:   { userId: session.id, moduleId },
    include: { stage: { select: { stageNumber: true } } },
  });
  const responseMap = new Map(allResponses.map((r) => [r.stage.stageNumber, r]));

  // Existing answer for this stage
  const existing = responseMap.get(stageNum) ?? null;

  // Stage 8 plan data (needed by stage 11 choose-best renderer)
  const stage8Response = responseMap.get(8);
  const planAnswerJson = stage8Response?.answer ?? null;

  // 5. Build pip statuses
  const currentStage = progress?.currentStage ?? stageNum;
  const pipStatuses: StagePageData["pipStatuses"] = Array.from({ length: 12 }, (_, i) => {
    const n = i + 1;
    if (responseMap.has(n)) return "done";
    if (n === stageNum)     return "current";
    if (n <= currentStage)  return "empty";
    return "locked";
  });
  const phaseColors: StagePageData["phaseColors"] = Array.from({ length: 12 }, (_, i) =>
    phaseColor(i + 1)
  );

  const data: StagePageData = {
    moduleId,
    moduleTitle:     module.title,
    moduleIcon:      module.icon,
    moduleScenario:  module.scenario,
    moduleBannerUrl: module.bannerUrl ?? null,
    totalStages:     12,

    stageId:    stage.id,
    stageNum,
    stageTitle: stage.title,
    stageType:  stage.type,
    phase:      stage.phase as StagePageData["phase"],
    instruction:stage.instruction,
    hint:       stage.hint,
    maxScore:   stage.maxScore,
    options:    parseOptions(stage.options),

    difficulty:   profile.difficulty as StagePageData["difficulty"],
    avatarEmoji:  profile.avatarEmoji,
    avatarName:   profile.avatarName,
    studentName:  profile.user.name,

    existingAnswer: existing?.answer ?? null,
    existingScore:  existing?.score ?? null,
    alreadyDone:    !!existing,

    pipStatuses,
    phaseColors,
    planAnswerJson,
  };

  return <StagePlayer data={data} />;
}