// app/admin/page.tsx
// Server Component — system-wide stats for the admin dashboard

import { redirect } from "next/navigation";
import { getSessionUserFast } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import AdminDashboard from "./_components/AdminDashboard";

// ─── Exported types ───────────────────────────────────────────
export interface AdminStats {
  totalUsers:      number;
  totalStudents:   number;
  totalTeachers:   number;
  totalModules:    number;
  activeModules:   number;
  draftModules:    number;
  totalSections:   number;
  totalSchools:    number;
  totalResponses:  number;
  pendingGrades:   number;
  completedModules:number;
  activeToday:     number;
}

export interface UserRow {
  id:        number;
  name:      string;
  email:     string;
  role:      "STUDENT" | "TEACHER" | "ADMIN";
  section:   string | null;
  createdAt: string;
  status:    "active" | "inactive";
}

export interface ModuleRow {
  id:           number;
  title:        string;
  icon:         string;
  subtitle:     string | null;
  context:      string;       // display label
  contextKey:   string;       // raw key for edit form
  scenario:     string;
  bannerUrl:    string | null;
  status:       string;
  isLocked:     boolean;
  unlockAfter:  number | null;
  gradeLevel:   string;
  timeEstimate: number | null;
  stageCount:   number;
  assignedTo:   string[];
  completions:  number;
  createdAt:    string;
}

export interface SectionRow {
  id:           number;
  name:         string;
  emoji:        string;
  gradeLevel:   string;
  schoolYear:   string | null;
  isActive:     boolean;
  teacher:      string;
  teacherId:    number | null;
  schoolId:     number | null;
  studentCount: number;
  activeModule: string | null;
}

export interface SchoolRow {
  id:           number;
  name:         string;
  address:      string | null;
  isActive:     boolean;
  sectionCount: number;
  studentCount: number;
  sections:     { id: number; name: string; emoji: string; isActive: boolean; teacher: string | null }[];
  createdAt:    string;
}

export interface RecentActivity {
  id:        number;
  type:      "register" | "module_complete" | "module_start" | "grade_pending";
  text:      string;
  sub:       string;
  time:      string;
  color:     "blue" | "green" | "amber" | "purple";
}

export interface ContextOption {
  key:   string;
  label: string;
  icon:  string;
}

export interface AdminDashboardData {
  admin:          { name: string; initials: string; email: string };
  stats:          AdminStats;
  users:          UserRow[];
  modules:        ModuleRow[];
  sections:       SectionRow[];
  schools:        SchoolRow[];
  contexts:       ContextOption[];
  recentActivity: RecentActivity[];
  systemHealth: {
    dbConnected:    boolean;
    totalSessions:  number;
    activeSessions: number;
  };
}

// ─── Helpers ─────────────────────────────────────────────────
function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}
function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)   return "just now";
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
// ─── Server Component ─────────────────────────────────────────
export default async function AdminPage() {
  const session = await getSessionUserFast();
  if (!session || session.role !== "ADMIN") redirect("/login");

  const admin = await prisma.user.findUnique({ where: { id: session.id } });
  if (!admin) redirect("/login");

  // ── Parallel queries ─────────────────────────────────────────
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    allUsers,
    allModules,
    allSections,
    totalResponses,
    pendingGrades,
    completedCount,
    activeToday,
    activeSessions,
    recentUsers,
    recentCompletions,
    pendingGradeItems,
    ctxList,
    allSchools,
  ] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: { profile: { include: { section: true } } },
      take: 100,
    }),
    prisma.module.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        stages:     { select: { id: true } },
        assignments:{ include: { section: true } },
      },
    }),
    prisma.section.findMany({
      include: {
        teacher:  true,
        students: true,
        moduleAssignments: { include: { module: { select: { title: true } } }, take: 1 },
      },
      orderBy: { name: "asc" },
    }),
    prisma.stageResponse.count(),
    prisma.stageResponse.count({ where: { isCorrect: null, gradedAt: null } }),
    prisma.moduleProgress.count({ where: { status: "COMPLETED" } }),
    prisma.stageResponse.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.userSession.count({ where: { expiresAt: { gt: new Date() } } }),
    prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.moduleProgress.findMany({
      where:   { status: "COMPLETED" },
      orderBy: { lastActiveAt: "desc" },
      take: 5,
      include: { user: true, module: { select: { title: true, icon: true } } },
    }),
    prisma.stageResponse.findMany({
      where:   { isCorrect: null, gradedAt: null },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: { user: true },
    }),
    prisma.scenarioContext.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.school.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { sections: true, students: true } },
        sections: {
          select: {
            id: true, name: true, emoji: true, isActive: true,
            teacher: { select: { name: true } },
          },
          orderBy: { name: "asc" },
        },
      },
    }),
  ]);

  const ctxMap = new Map(ctxList.map((c) => [c.key, c]));
  const contextLabel = (key: string) => ctxMap.get(key)?.label ?? key;

  const students = allUsers.filter((u) => u.role === "STUDENT");
  const teachers = allUsers.filter((u) => u.role === "TEACHER");

  // ── Stats ────────────────────────────────────────────────────
  const stats: AdminStats = {
    totalUsers:       allUsers.length,
    totalStudents:    students.length,
    totalTeachers:    teachers.length,
    totalModules:     allModules.length,
    activeModules:    allModules.filter((m) => m.status === "ACTIVE").length,
    draftModules:     allModules.filter((m) => m.status === "DRAFT").length,
    totalSections:    allSections.length,
    totalSchools:     allSchools.length,
    totalResponses,
    pendingGrades,
    completedModules: completedCount,
    activeToday,
  };

  // ── User rows ────────────────────────────────────────────────
  const users: UserRow[] = allUsers.slice(0, 50).map((u) => ({
    id:        u.id,
    name:      u.name,
    email:     u.email,
    role:      u.role as "STUDENT" | "TEACHER" | "ADMIN",
    section:   u.profile?.section?.name ?? null,
    createdAt: u.createdAt.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }),
    status:    "active",
  }));

  // ── Module rows ───────────────────────────────────────────────
  const moduleCompletions = await prisma.moduleProgress.groupBy({
    by: ["moduleId"],
    where: { status: "COMPLETED" },
    _count: { _all: true },
  });
  const completionsMap = new Map(moduleCompletions.map((m) => [m.moduleId, m._count._all]));

  const modules: ModuleRow[] = allModules.slice(0, 20).map((m) => ({
    id:           m.id,
    title:        m.title,
    icon:         m.icon,
    subtitle:     m.subtitle ?? null,
    context:      contextLabel(m.context),
    contextKey:   m.context,
    scenario:     m.scenario,
    bannerUrl:    m.bannerUrl ?? null,
    status:       m.status.toLowerCase(),
    isLocked:     m.isLocked,
    unlockAfter:  m.unlockAfter ?? null,
    gradeLevel:   m.gradeLevel,
    timeEstimate: m.timeEstimate ?? null,
    stageCount:   m.stages.length,
    assignedTo:   m.assignments.map((a) => a.section.name),
    completions:  completionsMap.get(m.id) ?? 0,
    createdAt:    m.createdAt.toLocaleDateString("en-PH", { month: "short", day: "numeric" }),
  }));

  // ── Section rows ──────────────────────────────────────────────
  const sections: SectionRow[] = allSections.map((s) => ({
    id:           s.id,
    name:         s.name,
    emoji:        s.emoji,
    gradeLevel:   s.gradeLevel,
    schoolYear:   s.schoolYear ?? null,
    isActive:     s.isActive,
    teacher:      s.teacher?.name ?? "Unassigned",
    teacherId:    s.teacherId ?? null,
    schoolId:     s.schoolId ?? null,
    studentCount: s.students.length,
    activeModule: s.moduleAssignments[0]?.module?.title ?? null,
  }));

  // ── Recent activity ───────────────────────────────────────────
  const activity: RecentActivity[] = [
    ...recentUsers.map((u, i) => ({
      id:    i,
      type:  "register" as const,
      text:  `${u.name} registered`,
      sub:   u.role.toLowerCase(),
      time:  timeAgo(u.createdAt),
      color: "blue" as const,
    })),
    ...recentCompletions.map((p, i) => ({
      id:    100 + i,
      type:  "module_complete" as const,
      text:  `${p.user.name} completed`,
      sub:   `${p.module.icon} ${p.module.title}`,
      time:  timeAgo(p.lastActiveAt ?? new Date()),
      color: "green" as const,
    })),
    ...pendingGradeItems.map((r, i) => ({
      id:    200 + i,
      type:  "grade_pending" as const,
      text:  `${r.user.name} needs grading`,
      sub:   "Open-ended response",
      time:  timeAgo(r.createdAt),
      color: "amber" as const,
    })),
  ].sort(() => Math.random() - 0.5).slice(0, 8);

  const schools: SchoolRow[] = allSchools.map((s) => ({
    id:           s.id,
    name:         s.name,
    address:      s.address ?? null,
    isActive:     s.isActive,
    sectionCount: s._count.sections,
    studentCount: s._count.students,
    sections:     s.sections.map((sec) => ({
      id:      sec.id,
      name:    sec.name,
      emoji:   sec.emoji,
      isActive:sec.isActive,
      teacher: sec.teacher?.name ?? null,
    })),
    createdAt: s.createdAt.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }),
  }));

  const data: AdminDashboardData = {
    admin: { name: admin.name, initials: initials(admin.name), email: admin.email },
    stats,
    users,
    modules,
    sections,
    schools,
    contexts: ctxList.map((c) => ({ key: c.key, label: c.label, icon: c.icon })),
    recentActivity: activity,
    systemHealth: {
      dbConnected:   true,
      totalSessions: await prisma.userSession.count(),
      activeSessions,
    },
  };

  return <AdminDashboard data={data} />;
}