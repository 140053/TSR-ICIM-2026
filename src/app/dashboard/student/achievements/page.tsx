// app/dashboard/student/achievements/page.tsx
// Server Component — queries stats, computes & awards badges, hands off to client.

import { redirect } from "next/navigation";
import { getSessionUserFast } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import AchievementsClient from "./_components/AchievementsClient";

// ─── Types exported for the client component ──────────────────
export type BadgeCategory = "Progress" | "Mastery" | "Testing" | "XP" | "Streak";

export interface BadgeDef {
  id:          string;
  name:        string;
  emoji:       string;
  description: string;
  category:    BadgeCategory;
  color:       string;
}

export interface BadgeWithStatus extends BadgeDef {
  earned:     boolean;
  unlockedAt: string | null;
}

export interface AchievementsData {
  student: {
    name:        string;
    avatarEmoji: string;
    avatarName:  string;
    xp:          number;
    level:       number;
    streak:      number;
  };
  stats: {
    modulesCompleted: number;
    stagesDone:       number;
    bestScore:        number | null;
    earned:           number;
    total:            number;
  };
  badges: BadgeWithStatus[];
}

// ─── Badge catalogue ──────────────────────────────────────────
const ALL_BADGES: BadgeDef[] = [
  // Progress
  { id: "first_stage",    name: "First Step",          emoji: "🐾", description: "Submit your first stage response",                  category: "Progress", color: "#3B82C4" },
  { id: "stage_6",        name: "Halfway There",        emoji: "⚡", description: "Complete 6 or more stages across any modules",      category: "Progress", color: "#3B82C4" },
  { id: "first_module",   name: "Module Master",        emoji: "📦", description: "Complete your first full module",                   category: "Progress", color: "#3B82C4" },
  { id: "three_modules",  name: "Adventurer",           emoji: "🗺️", description: "Complete 3 or more full modules",                  category: "Progress", color: "#3B82C4" },
  // Mastery
  { id: "score_80",       name: "Scholar",              emoji: "🎓", description: "Score 80% or higher on a completed module",         category: "Mastery",  color: "#8B5CF6" },
  { id: "score_100",      name: "Perfectionist",        emoji: "💎", description: "Score 100% on a completed module",                  category: "Mastery",  color: "#8B5CF6" },
  { id: "understanding",  name: "Understanding Pro",    emoji: "🔵", description: "Achieve Proficient in Problem Understanding",       category: "Mastery",  color: "#3B82C4" },
  { id: "analysis",       name: "Analysis Expert",      emoji: "🟣", description: "Achieve Proficient in Analysis",                   category: "Mastery",  color: "#8B5CF6" },
  { id: "solution",       name: "Solution Builder",     emoji: "🟠", description: "Achieve Proficient in Solution Development",       category: "Mastery",  color: "#F59E0B" },
  { id: "reflection",     name: "Reflective Thinker",   emoji: "🟢", description: "Achieve Proficient in Reflection",                 category: "Mastery",  color: "#4A9B7F" },
  { id: "all_proficient", name: "TSR Champion",         emoji: "🏆", description: "Achieve Proficient in all 4 diagnostic clusters",  category: "Mastery",  color: "#8B5CF6" },
  // Testing
  { id: "pre_test",       name: "Test Ready",           emoji: "📝", description: "Complete the pre-test",                            category: "Testing",  color: "#F59E0B" },
  { id: "post_test",      name: "Test Champion",        emoji: "🎯", description: "Complete the post-test",                           category: "Testing",  color: "#F59E0B" },
  // XP
  { id: "xp_100",         name: "Rising Star",          emoji: "✨", description: "Earn 100 XP",                                      category: "XP",       color: "#F59E0B" },
  { id: "xp_500",         name: "Dedicated Learner",    emoji: "🌙", description: "Earn 500 XP",                                      category: "XP",       color: "#F59E0B" },
  { id: "level_2",        name: "Level 2 Hero",         emoji: "🦸", description: "Reach Level 2",                                    category: "XP",       color: "#8B5CF6" },
  // Streak
  { id: "streak_3",       name: "On Fire",              emoji: "🔥", description: "Maintain a 3-day learning streak",                 category: "Streak",   color: "#E05C5C" },
  { id: "streak_7",       name: "Unstoppable",          emoji: "💫", description: "Maintain a 7-day learning streak",                 category: "Streak",   color: "#E05C5C" },
];

// ─── Stored badge shape ───────────────────────────────────────
interface StoredBadge { id: string; unlockedAt: string; }

function parseStoredBadges(raw: unknown): StoredBadge[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (b): b is StoredBadge =>
      typeof b === "object" && b !== null &&
      typeof (b as StoredBadge).id === "string" &&
      typeof (b as StoredBadge).unlockedAt === "string"
  );
}

// ─── Server Component ─────────────────────────────────────────
export default async function AchievementsPage() {
  const session = await getSessionUserFast();
  if (!session || session.role !== "STUDENT") redirect("/login");

  // Fetch all data in parallel
  const [profile, allProgress, stagesDone, testResults, diagnostics] = await Promise.all([
    prisma.studentProfile.findUnique({
      where:   { userId: session.id },
      include: { user: true },
    }),
    prisma.moduleProgress.findMany({
      where: { userId: session.id },
    }),
    prisma.stageResponse.count({ where: { userId: session.id } }),
    prisma.testResult.findMany({
      where:  { userId: session.id },
      select: { type: true },
    }),
    prisma.diagnosticReport.findMany({
      where:  { userId: session.id },
      select: {
        understandingLevel: true,
        analysisLevel:      true,
        solutionLevel:      true,
        reflectionLevel:    true,
      },
    }),
  ]);

  if (!profile) redirect("/onboarding");

  // Derived stats
  const completedModules = allProgress.filter((p) => p.status === "COMPLETED");
  const bestScore = completedModules.length
    ? Math.max(...completedModules.map((p) => p.percentScore ?? 0))
    : null;
  const hasPreTest  = testResults.some((t) => t.type === "PRE_TEST");
  const hasPostTest = testResults.some((t) => t.type === "POST_TEST");

  const hasProficient = (level: string | null) => level === "PROFICIENT";
  const anyUnderstanding = diagnostics.some((d) => hasProficient(d.understandingLevel));
  const anyAnalysis      = diagnostics.some((d) => hasProficient(d.analysisLevel));
  const anySolution      = diagnostics.some((d) => hasProficient(d.solutionLevel));
  const anyReflection    = diagnostics.some((d) => hasProficient(d.reflectionLevel));
  const allFourProficient = anyUnderstanding && anyAnalysis && anySolution && anyReflection;

  // ── Compute which badges are now earned ─────────────────────
  const earnedNow = new Set<string>();

  if (stagesDone >= 1)                           earnedNow.add("first_stage");
  if (stagesDone >= 6)                           earnedNow.add("stage_6");
  if (completedModules.length >= 1)              earnedNow.add("first_module");
  if (completedModules.length >= 3)              earnedNow.add("three_modules");
  if (bestScore !== null && bestScore >= 80)     earnedNow.add("score_80");
  if (bestScore !== null && bestScore >= 100)    earnedNow.add("score_100");
  if (anyUnderstanding)                          earnedNow.add("understanding");
  if (anyAnalysis)                               earnedNow.add("analysis");
  if (anySolution)                               earnedNow.add("solution");
  if (anyReflection)                             earnedNow.add("reflection");
  if (allFourProficient)                         earnedNow.add("all_proficient");
  if (hasPreTest)                                earnedNow.add("pre_test");
  if (hasPostTest)                               earnedNow.add("post_test");
  if (profile.xp >= 100)                        earnedNow.add("xp_100");
  if (profile.xp >= 500)                        earnedNow.add("xp_500");
  if (profile.level >= 2)                        earnedNow.add("level_2");
  if (profile.streak >= 3)                       earnedNow.add("streak_3");
  if (profile.streak >= 7)                       earnedNow.add("streak_7");

  // ── Persist any newly earned badges ─────────────────────────
  const stored     = parseStoredBadges(profile.badges);
  const storedIds  = new Set(stored.map((b) => b.id));
  const newlyEarned = [...earnedNow].filter((id) => !storedIds.has(id));

  let finalStored = stored;
  if (newlyEarned.length > 0) {
    const now = new Date().toISOString();
    finalStored = [
      ...stored,
      ...newlyEarned.map((id) => ({ id, unlockedAt: now })),
    ];
    await prisma.studentProfile.update({
      where: { userId: session.id },
      data:  { badges: finalStored as object[] },
    });
  }

  const unlockedAtMap = new Map(finalStored.map((b) => [b.id, b.unlockedAt]));

  // ── Build badges list for client ─────────────────────────────
  const badges: BadgeWithStatus[] = ALL_BADGES.map((def) => ({
    ...def,
    earned:     earnedNow.has(def.id),
    unlockedAt: unlockedAtMap.get(def.id) ?? null,
  }));

  const data: AchievementsData = {
    student: {
      name:        profile.user.name,
      avatarEmoji: profile.avatarEmoji,
      avatarName:  profile.avatarName,
      xp:          profile.xp,
      level:       profile.level,
      streak:      profile.streak,
    },
    stats: {
      modulesCompleted: completedModules.length,
      stagesDone,
      bestScore:        bestScore !== null ? Math.round(bestScore) : null,
      earned:           badges.filter((b) => b.earned).length,
      total:            ALL_BADGES.length,
    },
    badges,
  };

  return <AchievementsClient data={data} />;
}
