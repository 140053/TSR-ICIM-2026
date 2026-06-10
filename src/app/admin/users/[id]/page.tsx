// app/admin/users/[id]/page.tsx
// Server Component — fetches full user data for the admin detail view

import { redirect, notFound } from "next/navigation";
import { getSessionUserFast } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import AdminUserDetail from "./_components/AdminUserDetail";

// ─── Exported types ───────────────────────────────────────────
export type UserRole = "STUDENT" | "TEACHER" | "ADMIN";

export interface UserDetailProfile {
  // Core
  id:          number;
  name:        string;
  email:       string;
  role:        UserRole;
  initials:    string;
  createdAt:   string;
  updatedAt:   string;
  // Student profile (if STUDENT)
  student?: {
    avatarEmoji:  string;
    avatarName:   string;
    difficulty:   string;
    section:      string;
    sectionId:    number | null;
    school:       string;
    schoolId:     number | null;
    setupDone:    boolean;
    xp:           number;
    level:        number;
  };
}

export interface ModuleProgressRow {
  moduleId:     number;
  moduleTitle:  string;
  moduleIcon:   string;
  status:       string;
  currentStage: number;
  percentScore: number | null;
  difficulty:   string;
  lastActive:   string;
}

export interface DiagnosticRow {
  moduleTitle:        string;
  understandingScore: number;
  analysisScore:      number;
  solutionScore:      number;
  reflectionScore:    number;
  overallScore:       number;
  needsIntervention:  boolean;
  generatedAt:        string;
}

export interface ResponseRow {
  stageNumber:  number;
  stageTitle:   string;
  moduleTitle:  string;
  score:        number | null;
  maxScore:     number;
  isCorrect:    boolean | null;
  gradedAt:     string | null;
  timeSpent:    number | null;
  createdAt:    string;
}

export interface SessionRow {
  id:        number;
  createdAt: string;
  expiresAt: string;
  isActive:  boolean;
}

export interface TeacherSection {
  id:           number;
  name:         string;
  emoji:        string;
  studentCount: number;
}

export interface SectionOption {
  id:              number;
  name:            string;
  emoji:           string;
  schoolId:        number | null;
  teacherId:       number | null;
  teacherName:     string | null;
}

export interface SchoolOption {
  id:   number;
  name: string;
}

export interface AdminUserDetailData {
  user:        UserDetailProfile;
  progress:    ModuleProgressRow[];
  diagnostics: DiagnosticRow[];
  responses:   ResponseRow[];
  sessions:    SessionRow[];
  allSections: SectionOption[];   // all active sections (for assign modal)
  allSchools:  SchoolOption[];    // all active schools (for assign modal)
  // teacher-specific
  sections?:   TeacherSection[];
  moduleCount?:number;
  stats: {
    totalResponses:  number;
    completedModules:number;
    avgScore:        number | null;
    totalTimeMin:    number;
    activeSessions:  number;
  };
}

// ─── Helpers ─────────────────────────────────────────────────
function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}
function fmt(date: Date) {
  return date.toLocaleDateString("en-PH", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}
function fmtDate(date: Date) {
  return date.toLocaleDateString("en-PH", {
    month: "short", day: "numeric", year: "numeric",
  });
}

// ─── Server Component ─────────────────────────────────────────
export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Auth
  const session = await getSessionUserFast();
  if (!session || session.role !== "ADMIN") redirect("/login");

  const { id: idStr } = await params;
  const userId = parseInt(idStr);
  if (isNaN(userId)) notFound();

  // Fetch user + all related data in parallel
  const [user, progressRows, diagnosticRows, responseRows, sessionRows, allSectionsRaw, allSchoolsRaw] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        include: {
          profile: { include: { section: true, school: true } },
          teacherOf: { include: { students: true } },
        },
      }),
      prisma.moduleProgress.findMany({
        where:   { userId },
        include: { module: { select: { title: true, icon: true } } },
        orderBy: { lastActiveAt: "desc" },
      }),
      prisma.diagnosticReport.findMany({
        where:   { userId },
        orderBy: { generatedAt: "desc" },
      }),
      prisma.stageResponse.findMany({
        where:   { userId },
        include: {
          stage: {
            select: {
              stageNumber: true,
              title:       true,
              maxScore:    true,
              module:      { select: { title: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take:    50,
      }),
      prisma.userSession.findMany({
        where:   { userId },
        orderBy: { expiresAt: "desc" },
        take:    10,
      }),
      prisma.section.findMany({
        where:   { isActive: true },
        select:  { id: true, name: true, emoji: true, schoolId: true, teacherId: true, teacher: { select: { name: true } } },
        orderBy: { name: "asc" },
      }),
      prisma.school.findMany({
        where:   { isActive: true },
        select:  { id: true, name: true },
        orderBy: { name: "asc" },
      }),
    ]);

  if (!user) notFound();

  // ── Build profile ─────────────────────────────────────────────
  const profile: UserDetailProfile = {
    id:        user.id,
    name:      user.name,
    email:     user.email,
    role:      user.role as UserRole,
    initials:  initials(user.name),
    createdAt: fmt(user.createdAt),
    updatedAt: fmt(user.updatedAt),
    ...(user.role === "STUDENT" && user.profile ? {
      student: {
        avatarEmoji: user.profile.avatarEmoji ?? "🧙‍♂️",
        avatarName:  user.profile.avatarName  ?? "—",
        difficulty:  user.profile.difficulty  ?? "ADVENTURER",
        section:     user.profile.section?.name ?? "—",
        sectionId:   user.profile.sectionId,
        school:      user.profile.school?.name  ?? "—",
        schoolId:    user.profile.schoolId,
        setupDone:   user.profile.setupDone,
        xp:          user.profile.xp,
        level:       user.profile.level,
      },
    } : {}),
  };

  // ── Progress rows ─────────────────────────────────────────────
  const progress: ModuleProgressRow[] = progressRows.map((p) => ({
    moduleId:     p.moduleId,
    moduleTitle:  p.module.title,
    moduleIcon:   p.module.icon,
    status:       p.status.toLowerCase(),
    currentStage: p.currentStage,
    percentScore: p.percentScore,
    difficulty:   p.difficulty,
    lastActive:   p.lastActiveAt ? fmtDate(p.lastActiveAt) : "—",
  }));

  // ── Diagnostic rows ───────────────────────────────────────────
  // DiagnosticReport has no module relation — look up title from progressRows
  const moduleTitleMap = new Map(
    progressRows.map((p) => [p.moduleId, p.module.title])
  );

  const diagnostics: DiagnosticRow[] = diagnosticRows.map((d) => ({
    moduleTitle:        moduleTitleMap.get(d.moduleId) ?? `Module #${d.moduleId}`,
    understandingScore: Math.round(d.understandingScore ?? 0),
    analysisScore:      Math.round(d.analysisScore      ?? 0),
    solutionScore:      Math.round(d.solutionScore      ?? 0),
    reflectionScore:    Math.round(d.reflectionScore    ?? 0),
    overallScore:       Math.round(d.overallScore       ?? 0),
    needsIntervention:  d.needsIntervention,
    generatedAt:        fmtDate(d.generatedAt),
  }));

  // ── Response rows ─────────────────────────────────────────────
  const responses: ResponseRow[] = responseRows.map((r) => ({
    stageNumber: r.stage.stageNumber,
    stageTitle:  r.stage.title,
    moduleTitle: r.stage.module?.title ?? "—",
    score:       r.score,
    maxScore:    r.stage.maxScore,
    isCorrect:   r.isCorrect,
    gradedAt:    r.gradedAt ? fmtDate(r.gradedAt) : null,
    timeSpent:   r.timeSpent,
    createdAt:   fmtDate(r.createdAt),
  }));

  // ── Session rows ──────────────────────────────────────────────
  const now = new Date();
  const sessions: SessionRow[] = sessionRows.map((s) => ({
    id:        s.id,
    createdAt: fmt(s.createdAt),
    expiresAt: fmt(s.expiresAt),
    isActive:  s.expiresAt > now,
  }));

  // ── Teacher sections ──────────────────────────────────────────
  const sections: TeacherSection[] | undefined =
    user.role === "TEACHER"
      ? user.teacherOf.map((sec) => ({
          id:           sec.id,
          name:         sec.name,
          emoji:        sec.emoji,
          studentCount: sec.students.length,
        }))
      : undefined;

  // ── Stats ─────────────────────────────────────────────────────
  const completedModules = progressRows.filter((p) => p.status === "COMPLETED").length;
  const scored = progressRows.filter((p) => p.percentScore != null);
  const avgScore = scored.length
    ? Math.round(scored.reduce((s, p) => s + (p.percentScore ?? 0), 0) / scored.length)
    : null;
  const totalTimeMin = Math.round(
    responseRows.reduce((s, r) => s + (r.timeSpent ?? 0), 0) / 60
  );
  const activeSessions = sessions.filter((s) => s.isActive).length;

  const data: AdminUserDetailData = {
    user: profile,
    progress,
    diagnostics,
    responses,
    sessions,
    allSections: allSectionsRaw.map((s) => ({
      id:          s.id,
      name:        s.name,
      emoji:       s.emoji,
      schoolId:    s.schoolId,
      teacherId:   s.teacherId,
      teacherName: s.teacher?.name ?? null,
    })),
    allSchools: allSchoolsRaw,
    sections,
    moduleCount: user.role === "TEACHER" ? (await prisma.module.count()) : undefined,
    stats: {
      totalResponses:  responseRows.length,
      completedModules,
      avgScore,
      totalTimeMin,
      activeSessions,
    },
  };

  return <AdminUserDetail data={data} />;
}