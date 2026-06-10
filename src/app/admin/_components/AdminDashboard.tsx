// app/admin/_components/AdminDashboard.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import RichTextEditor from "@/components/ui/rich-text-editor";
import BannerUpload from "@/components/ui/banner-upload";
import type {
  AdminDashboardData,
  AdminStats,
  UserRow,
  ModuleRow,
  SectionRow,
  SchoolRow,
  RecentActivity,
  ContextOption,
} from "../page";

// ─── TYPES ────────────────────────────────────────────────────
type Tab = "overview" | "users" | "modules" | "sections" | "schools" | "system";

// ─── HELPERS ─────────────────────────────────────────────────
const ROLE_COLOR: Record<string, string> = {
  STUDENT: "bg-[#DBEAFE] dark:bg-[#1e3a5f] text-[#3B82C4] border-[#3B82C4]",
  TEACHER: "bg-[#D1FAE5] dark:bg-[#064e35] text-[#4A9B7F] border-[#4A9B7F]",
  ADMIN:   "bg-[#EDE9FE] dark:bg-[#2e1065] text-[#8B5CF6] border-[#8B5CF6]",
};
const STATUS_COLOR: Record<string, string> = {
  active:   "bg-[#D1FAE5] dark:bg-[#064e35] text-[#4A9B7F] border-[#4A9B7F]",
  draft:    "bg-[#FEF3C7] dark:bg-[#3d2800] text-[#F59E0B] border-[#F59E0B]",
  archived: "bg-[#EEF2F8] dark:bg-white/5 text-[#64748B] border-[#64748B]",
};
const ACTIVITY_COLOR: Record<string, string> = {
  blue:   "bg-[#DBEAFE] dark:bg-[#1e3a5f] text-[#3B82C4]",
  green:  "bg-[#D1FAE5] dark:bg-[#064e35] text-[#4A9B7F]",
  amber:  "bg-[#FEF3C7] dark:bg-[#3d2800] text-[#F59E0B]",
  purple: "bg-[#EDE9FE] dark:bg-[#2e1065] text-[#8B5CF6]",
};
const ACTIVITY_ICON: Record<string, string> = {
  register:        "👤",
  module_complete: "✅",
  module_start:    "▶",
  grade_pending:   "✍️",
};

// ─── STAT CARD ────────────────────────────────────────────────
function StatCard({
  icon, value, label, delta, deltaUp, color,
}: {
  icon: string; value: string; label: string;
  delta?: string; deltaUp?: boolean;
  color: "blue" | "purple" | "amber" | "green" | "red";
}) {
  const bars  = { blue:"#3B82C4", purple:"#8B5CF6", amber:"#F59E0B", green:"#4A9B7F", red:"#E05C5C" };
  const ibg   = {
    blue:  "bg-[#DBEAFE] dark:bg-[#1e3a5f]",
    purple:"bg-[#EDE9FE] dark:bg-[#2e1065]",
    amber: "bg-[#FEF3C7] dark:bg-[#3d2800]",
    green: "bg-[#D1FAE5] dark:bg-[#064e35]",
    red:   "bg-[#FEE2E2] dark:bg-[#450a0a]",
  };
  return (
    <div className="relative bg-white dark:bg-black border border-[#E2E8F0] dark:border-white/10 rounded-2xl p-5 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: bars[color] }} />
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center text-base mb-3", ibg[color])}>
        {icon}
      </div>
      <div className="font-nunito text-3xl font-extrabold mb-0.5">{value}</div>
      <div className="text-xs text-[#64748B] dark:text-white/50">{label}</div>
      {delta && (
        <div className={cn("text-[11px] font-semibold mt-1.5", deltaUp ? "text-[#22C55E]" : "text-[#E05C5C]")}>
          {delta}
        </div>
      )}
    </div>
  );
}

// ─── THEME TOGGLE ────────────────────────────────────────────
function ThemeToggle({ dark, onToggle }: { dark: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs font-bold transition-all",
        dark
          ? "bg-white/10 text-white hover:bg-white/20 border border-white/20"
          : "bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0] border border-[#E2E8F0] dark:bg-white/5 dark:text-white/50 dark:border-white/10 dark:hover:bg-[#1e2d40]"
      )}
    >
      <span className="text-base leading-none">{dark ? "☀️" : "🌙"}</span>
      <span>{dark ? "Light Mode" : "Dark Mode"}</span>
      {/* pill track */}
      <span className={cn(
        "ml-auto w-9 h-5 rounded-full relative shrink-0 overflow-hidden transition-colors",
        dark ? "bg-[#8B5CF6]" : "bg-[#CBD5E1]"
      )}>
        <span className={cn(
          "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200",
          dark ? "translate-x-4" : "translate-x-0"
        )} />
      </span>
    </button>
  );
}

// ─── NAV ITEM ────────────────────────────────────────────────
function NavItem({
  icon, label, active, badge, badgeDanger, onClick,
}: {
  icon: string; label: string; active?: boolean;
  badge?: string | number; badgeDanger?: boolean; onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{ width: "calc(100% - 20px)" }}
      className={cn(
        "flex items-center gap-2.5 px-[18px] py-2.5 mx-2.5 rounded-xl text-sm font-medium transition-all",
        "hover:bg-[#EEF2F8] dark:hover:bg-white/10",
        active
          ? "bg-[#EDE9FE] dark:bg-white/15 text-[#8B5CF6] dark:text-white font-bold"
          : "text-[#64748B] dark:text-white/60"
      )}
    >
      <span className="text-[17px] w-5 text-center shrink-0">{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      {badge !== undefined && (
        <span className={cn(
          "text-[11px] font-bold px-2 py-0.5 rounded-full",
          badgeDanger ? "bg-[#E05C5C] text-white" : "bg-[#8B5CF6] text-white"
        )}>
          {badge}
        </span>
      )}
    </button>
  );
}

// ─── LOGOUT ───────────────────────────────────────────────────
function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      onClick={async () => {
        setBusy(true);
        await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
        router.push("/login");
        router.refresh();
      }}
      disabled={busy}
      className="text-xs text-[#64748B] dark:text-white/50 hover:text-[#E05C5C] font-semibold px-2 py-1 rounded-lg hover:bg-[#FEE2E2] dark:hover:bg-[#450a0a] transition-colors disabled:opacity-50"
    >
      {busy ? "…" : "Sign out"}
    </button>
  );
}

// ─── CONFIRM MODAL ────────────────────────────────────────────
function ConfirmModal({
  open, title, desc, onConfirm, onCancel, danger = false,
}: {
  open: boolean; title: string; desc: string;
  onConfirm: () => void; onCancel: () => void; danger?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-black border border-[#E2E8F0] dark:border-white/10 rounded-2xl p-7 shadow-xl max-w-sm w-full mx-4">
        <h3 className="font-nunito font-extrabold text-base mb-2">{title}</h3>
        <p className="text-sm text-[#64748B] dark:text-white/50 mb-6">{desc}</p>
        <div className="flex gap-2.5">
          <button
            onClick={onConfirm}
            className={cn(
              "flex-1 py-2.5 rounded-xl font-nunito font-bold text-sm transition-all",
              danger
                ? "bg-[#E05C5C] hover:bg-[#c04444] text-white"
                : "bg-[#8B5CF6] hover:bg-[#7c3aed] text-white"
            )}
          >
            Confirm
          </button>
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl font-nunito font-bold text-sm border border-[#E2E8F0] dark:border-white/10 text-[#64748B] hover:bg-[#EEF2F8] dark:hover:bg-[#162032] transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── OVERVIEW TAB ─────────────────────────────────────────────
function TabOverview({
  stats, recentActivity, systemHealth,
}: {
  stats: AdminStats;
  recentActivity: RecentActivity[];
  systemHealth: AdminDashboardData["systemHealth"];
}) {
  return (
    <div className="flex flex-col gap-6">
      {/* Stat grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon="👥" value={String(stats.totalUsers)}       label="Total Users"         delta={`${stats.totalStudents} students, ${stats.totalTeachers} teachers`} color="blue"   />
        <StatCard icon="📦" value={String(stats.totalModules)}     label="Total Modules"       delta={`${stats.activeModules} active, ${stats.draftModules} draft`}        color="purple" />
        <StatCard icon="✅" value={String(stats.completedModules)} label="Module Completions"  delta="↑ all time"  deltaUp color="green"  />
        <StatCard icon="✍️" value={String(stats.pendingGrades)}    label="Pending Grades"      delta={stats.pendingGrades > 0 ? "Needs attention" : "All caught up ✅"} deltaUp={stats.pendingGrades===0} color="amber" />
        <StatCard icon="⚡" value={String(stats.activeToday)}      label="Active Today"        delta="Stage responses" deltaUp={stats.activeToday > 0} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
        {/* Recent activity feed */}
        <div className="bg-white dark:bg-black border border-[#E2E8F0] dark:border-white/10 rounded-2xl p-6 shadow-sm">
          <h3 className="font-nunito text-[15px] font-extrabold mb-5">⚡ Recent Activity</h3>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-[#64748B] dark:text-white/50 text-center py-6">No recent activity.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {recentActivity.map((a) => (
                <div key={a.id} className="flex items-start gap-3">
                  <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0", ACTIVITY_COLOR[a.color])}>
                    {ACTIVITY_ICON[a.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{a.text}</p>
                    <p className="text-[11px] text-[#64748B] dark:text-white/50 truncate">{a.sub}</p>
                  </div>
                  <span className="text-[11px] text-[#64748B] dark:text-white/50 shrink-0">{a.time}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* System health + breakdowns */}
        <div className="flex flex-col gap-4">
          {/* System health */}
          <div className="bg-white dark:bg-black border border-[#E2E8F0] dark:border-white/10 rounded-2xl p-5 shadow-sm">
            <h3 className="font-nunito text-[15px] font-extrabold mb-4">🖥️ System Health</h3>
            <div className="flex flex-col gap-2.5">
              {[
                { label: "Database",        value: systemHealth.dbConnected ? "Connected" : "Error",  ok: systemHealth.dbConnected },
                { label: "Active Sessions", value: String(systemHealth.activeSessions), ok: true },
                { label: "Total Sessions",  value: String(systemHealth.totalSessions),  ok: true },
                { label: "Total Responses", value: String(stats.totalResponses),         ok: true },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between py-2 border-b border-[#E2E8F0] dark:border-white/10 last:border-0">
                  <span className="text-sm text-[#64748B] dark:text-white/50">{row.label}</span>
                  <span className={cn("text-sm font-bold", row.ok ? "text-[#4A9B7F]" : "text-[#E05C5C]")}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick breakdown */}
          <div className="bg-white dark:bg-black border border-[#E2E8F0] dark:border-white/10 rounded-2xl p-5 shadow-sm">
            <h3 className="font-nunito text-[15px] font-extrabold mb-4">📊 Breakdown</h3>
            {[
              { label: "Students",  val: stats.totalStudents,  of: stats.totalUsers,   color: "#3B82C4" },
              { label: "Teachers",  val: stats.totalTeachers,  of: stats.totalUsers,   color: "#8B5CF6" },
              { label: "Active Mods",val: stats.activeModules, of: stats.totalModules, color: "#4A9B7F" },
              { label: "Sections",  val: stats.totalSections,  of: stats.totalSections,color: "#F59E0B" },
            ].map((row) => (
              <div key={row.label} className="mb-3">
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-semibold text-[#64748B] dark:text-white/50">{row.label}</span>
                  <span className="text-xs font-bold" style={{ color: row.color }}>{row.val}</span>
                </div>
                <div className="h-1.5 bg-[#EEF2F8] dark:bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${row.of > 0 ? Math.round((row.val / row.of) * 100) : 0}%`, background: row.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── USERS TAB ────────────────────────────────────────────────
function TabUsers({ users }: { users: UserRow[] }) {
  const [search, setSearch]     = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | "STUDENT" | "TEACHER" | "ADMIN">("ALL");
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const router = useRouter();

  const filtered = users.filter((u) => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
                        u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole   = roleFilter === "ALL" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const handleDelete = async (id: number) => {
    await fetch(`/api/admin/users/${id}`, { method: "DELETE", credentials: "include" });
    setConfirmId(null);
    router.refresh();
  };

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2.5 mb-5">
        <div className="relative flex-1 min-w-[200px] max-w-[280px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#94A3B8]">🔍</span>
          <Input
            placeholder="Search users…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-sm bg-white dark:bg-black border-[#E2E8F0] dark:border-white/10 focus-visible:border-[#8B5CF6] rounded-xl"
          />
        </div>
        <div className="flex gap-1.5">
          {(["ALL","STUDENT","TEACHER","ADMIN"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={cn(
                "font-nunito font-bold text-xs px-3.5 py-1.5 rounded-full border transition-all",
                roleFilter === r
                  ? "bg-[#8B5CF6] text-white border-[#8B5CF6]"
                  : "border-[#E2E8F0] dark:border-white/10 text-[#64748B] hover:border-[#8B5CF6] hover:text-[#8B5CF6]"
              )}
            >
              {r}
            </button>
          ))}
        </div>
        <span className="text-xs text-[#64748B] dark:text-white/50 ml-auto">{filtered.length} users</span>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-black border border-[#E2E8F0] dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {["Name","Email","Role","Section","Joined","Actions"].map((h) => (
                  <th key={h} className="text-left text-[11px] font-bold tracking-[0.06em] uppercase text-[#64748B] dark:text-white/50 px-5 py-3.5 border-b border-[#E2E8F0] dark:border-white/10 bg-[#F8FAFC] dark:bg-white/5 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-sm text-[#64748B] dark:text-white/50">
                    No users found.
                  </td>
                </tr>
              ) : filtered.map((u) => (
                <tr key={u.id} className="hover:bg-[#EEF2F8] dark:hover:bg-[#162032] transition-colors">
                  <td className="px-5 py-3.5 border-b border-[#E2E8F0] dark:border-white/10">
                    <div className="flex items-center gap-2.5">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-extrabold font-nunito shrink-0",
                        u.role === "STUDENT" ? "bg-[#DBEAFE] dark:bg-[#1e3a5f] text-[#3B82C4]" :
                        u.role === "TEACHER" ? "bg-[#D1FAE5] dark:bg-[#064e35] text-[#4A9B7F]" :
                        "bg-[#EDE9FE] dark:bg-[#2e1065] text-[#8B5CF6]"
                      )}>
                        {u.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-sm font-semibold">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 border-b border-[#E2E8F0] dark:border-white/10 text-sm text-[#64748B] dark:text-white/50">{u.email}</td>
                  <td className="px-5 py-3.5 border-b border-[#E2E8F0] dark:border-white/10">
                    <span className={cn("text-[10px] font-bold px-2.5 py-1 rounded-full border", ROLE_COLOR[u.role])}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 border-b border-[#E2E8F0] dark:border-white/10 text-sm text-[#64748B] dark:text-white/50">
                    {u.section ?? "—"}
                  </td>
                  <td className="px-5 py-3.5 border-b border-[#E2E8F0] dark:border-white/10 text-xs text-[#64748B] dark:text-white/50 whitespace-nowrap">
                    {u.createdAt}
                  </td>
                  <td className="px-5 py-3.5 border-b border-[#E2E8F0] dark:border-white/10">
                    <div className="flex items-center gap-1.5">
                      <button
                        className="text-xs font-bold px-2.5 py-1 rounded-lg border border-[#E2E8F0] dark:border-white/10 text-[#64748B] hover:border-[#8B5CF6] hover:text-[#8B5CF6] hover:bg-[#EDE9FE] dark:hover:bg-[#2e1065] transition-all"
                        onClick={() => router.push(`/admin/users/${u.id}`)}
                      >
                        View
                      </button>
                      {u.role !== "ADMIN" && (
                        <button
                          className="text-xs font-bold px-2.5 py-1 rounded-lg border border-[#E2E8F0] dark:border-white/10 text-[#64748B] hover:border-[#E05C5C] hover:text-[#E05C5C] hover:bg-[#FEE2E2] dark:hover:bg-[#450a0a] transition-all"
                          onClick={() => setConfirmId(u.id)}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        open={confirmId !== null}
        title="Delete user?"
        desc="This will permanently remove the user and all their data. This cannot be undone."
        danger
        onConfirm={() => confirmId !== null && handleDelete(confirmId)}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  );
}

// ─── MODULES TAB ──────────────────────────────────────────────
type SortCol = "title" | "status" | "stages" | "completions" | "sections" | "time";
type SortDir = "asc" | "desc";

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <span className={cn("ml-1 inline-block text-[10px]", active ? "opacity-100" : "opacity-30")}>
      {active && dir === "desc" ? "▼" : "▲"}
    </span>
  );
}

function TabModules({
  modules, contexts, sections, schools,
}: {
  modules:  ModuleRow[];
  contexts: ContextOption[];
  sections: SectionRow[];
  schools:  SchoolRow[];
}) {
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatusFilter] = useState<"all"|"active"|"draft"|"archived">("all");
  const [sortCol, setSortCol]       = useState<SortCol>("title");
  const [sortDir, setSortDir]       = useState<SortDir>("asc");
  const [editingId, setEditingId]   = useState<number | null>(null);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting]     = useState(false);
  const [editForm, setEditForm]     = useState<{
    title: string; icon: string; subtitle: string; scenario: string;
    bannerUrl: string; contextKey: string; status: string; gradeLevel: string;
    isLocked: boolean; unlockAfter: string; timeEstimate: string;
  }>({
    title: "", icon: "", subtitle: "", scenario: "",
    bannerUrl: "", contextKey: "", status: "active", gradeLevel: "Grade 6",
    isLocked: false, unlockAfter: "", timeEstimate: "",
  });

  // Assign modal state
  const [assigningModule, setAssigningModule] = useState<ModuleRow | null>(null);
  const [assignSelected, setAssignSelected]   = useState<Set<number>>(new Set());
  const [assignDueDate, setAssignDueDate]     = useState("");
  const [assignSaving, setAssignSaving]       = useState(false);
  const [assignError, setAssignError]         = useState<string | null>(null);

  const router = useRouter();

  function openAssign(m: ModuleRow) {
    // Pre-check sections that are already assigned to this module
    const alreadyAssigned = new Set(
      sections.filter((s) => m.assignedTo.includes(s.name)).map((s) => s.id)
    );
    setAssigningModule(m);
    setAssignSelected(alreadyAssigned);
    setAssignDueDate("");
    setAssignError(null);
  }

  function toggleSection(id: number) {
    setAssignSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSchool(schoolId: number, checked: boolean) {
    const schoolSectionIds = sections.filter((s) => s.schoolId === schoolId).map((s) => s.id);
    setAssignSelected((prev) => {
      const next = new Set(prev);
      schoolSectionIds.forEach((id) => checked ? next.add(id) : next.delete(id));
      return next;
    });
  }

  async function saveAssign() {
    if (!assigningModule) return;
    setAssignSaving(true);
    setAssignError(null);
    try {
      const res = await fetch(`/api/admin/modules/${assigningModule.id}/assign`, {
        method:      "POST",
        headers:     { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          sectionIds: Array.from(assignSelected),
          dueDate:    assignDueDate || null,
        }),
      });
      const d = await res.json();
      if (!d.success) { setAssignError(d.error ?? "Failed to save assignments."); return; }
      setAssigningModule(null);
      router.refresh();
    } catch {
      setAssignError("Network error. Please try again.");
    } finally {
      setAssignSaving(false);
    }
  }

  // Group sections by school for the modal
  const sectionsBySchool = schools.map((school) => ({
    school,
    sections: sections.filter((s) => s.schoolId === school.id),
  })).filter((g) => g.sections.length > 0);
  const unschooledSections = sections.filter((s) => s.schoolId === null);

  const filtered = modules
    .filter((m) => {
      const matchSearch = m.title.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || m.status === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      let av: number | string = 0, bv: number | string = 0;
      if (sortCol === "title")       { av = a.title.toLowerCase(); bv = b.title.toLowerCase(); }
      if (sortCol === "status")      { av = a.status; bv = b.status; }
      if (sortCol === "stages")      { av = a.stageCount; bv = b.stageCount; }
      if (sortCol === "completions") { av = a.completions; bv = b.completions; }
      if (sortCol === "sections")    { av = a.assignedTo.length; bv = b.assignedTo.length; }
      if (sortCol === "time")        { av = a.timeEstimate ?? 0; bv = b.timeEstimate ?? 0; }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

  function toggleSort(col: SortCol) {
    if (sortCol === col) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  }

  function startEdit(m: ModuleRow) {
    setEditingId(m.id);
    setError(null);
    setEditForm({
      title:       m.title,
      icon:        m.icon,
      subtitle:    m.subtitle ?? "",
      scenario:    m.scenario,
      bannerUrl:   m.bannerUrl ?? "",
      contextKey:  m.contextKey,
      status:      m.status,
      gradeLevel:  m.gradeLevel,
      isLocked:    m.isLocked,
      unlockAfter: m.unlockAfter != null ? String(m.unlockAfter) : "",
      timeEstimate:m.timeEstimate != null ? String(m.timeEstimate) : "",
    });
  }

  async function saveEdit() {
    if (!editingId) return;
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/admin/modules/${editingId}`, {
      method:      "PATCH",
      headers:     { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        title:        editForm.title.trim(),
        icon:         editForm.icon.trim(),
        subtitle:     editForm.subtitle.trim() || null,
        scenario:     editForm.scenario.trim(),
        bannerUrl:    editForm.bannerUrl || null,
        context:      editForm.contextKey,
        status:       editForm.status.toUpperCase(),
        gradeLevel:   editForm.gradeLevel.trim(),
        isLocked:     editForm.isLocked,
        unlockAfter:  editForm.unlockAfter  ? parseInt(editForm.unlockAfter)  : null,
        timeEstimate: editForm.timeEstimate ? parseInt(editForm.timeEstimate) : null,
      }),
    });
    const d = await res.json();
    setSaving(false);
    if (!d.success) { setError(d.error ?? "Failed to save."); return; }
    setEditingId(null);
    router.refresh();
  }

  async function deleteModule() {
    if (confirmDeleteId === null) return;
    setDeleting(true);
    setError(null);
    const res = await fetch(`/api/admin/modules/${confirmDeleteId}`, {
      method: "DELETE", credentials: "include",
    });
    const d = await res.json();
    setDeleting(false);
    setConfirmDeleteId(null);
    if (!d.success) { setError(d.error ?? "Failed to delete."); return; }
    router.refresh();
  }

  const F = editForm;
  const setF = (patch: Partial<typeof editForm>) => setEditForm((f) => ({ ...f, ...patch }));

  const confirmTarget = confirmDeleteId !== null ? modules.find((m) => m.id === confirmDeleteId) : null;

  return (
    <div>
      {error && (
        <div className="mb-4 text-sm text-[#E05C5C] bg-[#FEE2E2] dark:bg-[#450a0a] border border-[#E05C5C]/30 rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* ── Assign modal (shadcn Dialog) ── */}
      <Dialog
        open={assigningModule !== null}
        onOpenChange={(open) => { if (!open && !assignSaving) setAssigningModule(null); }}
      >
        <DialogContent className="max-w-lg flex flex-col max-h-[85vh] p-0 gap-0">
          <DialogHeader className="p-5 border-b border-[#E2E8F0] dark:border-white/10 shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{assigningModule?.icon}</span>
              <div>
                <DialogTitle className="font-nunito font-extrabold text-base">Assign Module</DialogTitle>
                <DialogDescription className="text-xs truncate">{assigningModule?.title}</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Section list */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {sections.length === 0 ? (
              <p className="text-sm text-[#64748B] dark:text-white/50 text-center py-6">No sections available. Create sections first.</p>
            ) : (
              <>
                {sectionsBySchool.map(({ school, sections: secList }) => {
                  const schoolSectionIds = secList.map((s) => s.id);
                  const allChecked  = schoolSectionIds.every((id) => assignSelected.has(id));
                  const someChecked = schoolSectionIds.some((id) => assignSelected.has(id));
                  return (
                    <div key={school.id}>
                      <label className="flex items-center gap-2 cursor-pointer mb-2">
                        <input
                          type="checkbox"
                          checked={allChecked}
                          ref={(el) => { if (el) el.indeterminate = someChecked && !allChecked; }}
                          onChange={(e) => toggleSchool(school.id, e.target.checked)}
                          className="w-4 h-4 rounded accent-[#8B5CF6]"
                        />
                        <span className="text-xs font-extrabold font-nunito text-[#1E293B] dark:text-white uppercase tracking-wide">
                          🏛️ {school.name}
                        </span>
                        <span className="text-[10px] text-[#94A3B8]">{secList.length} section{secList.length !== 1 ? "s" : ""}</span>
                      </label>
                      <div className="ml-6 space-y-1.5">
                        {secList.map((sec) => (
                          <label key={sec.id} className="flex items-center gap-2.5 cursor-pointer rounded-xl px-3 py-2 hover:bg-[#F8FAFC] dark:hover:bg-white/5 transition-colors">
                            <input
                              type="checkbox"
                              checked={assignSelected.has(sec.id)}
                              onChange={() => toggleSection(sec.id)}
                              className="w-4 h-4 rounded accent-[#8B5CF6]"
                            />
                            <span className="text-base leading-none">{sec.emoji}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate">{sec.name}</p>
                              <p className="text-[10px] text-[#94A3B8]">
                                {sec.teacher !== "Unassigned" ? sec.teacher : "No teacher"} · {sec.studentCount} students
                              </p>
                            </div>
                            {assigningModule?.assignedTo.includes(sec.name) && (
                              <span className="text-[10px] font-bold text-[#4A9B7F] bg-[#D1FAE5] dark:bg-[#064e35] px-2 py-0.5 rounded-full shrink-0">assigned</span>
                            )}
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {unschooledSections.length > 0 && (
                  <div>
                    <p className="text-xs font-extrabold font-nunito text-[#94A3B8] uppercase tracking-wide mb-2">No School</p>
                    <div className="space-y-1.5">
                      {unschooledSections.map((sec) => (
                        <label key={sec.id} className="flex items-center gap-2.5 cursor-pointer rounded-xl px-3 py-2 hover:bg-[#F8FAFC] dark:hover:bg-white/5 transition-colors">
                          <input
                            type="checkbox"
                            checked={assignSelected.has(sec.id)}
                            onChange={() => toggleSection(sec.id)}
                            className="w-4 h-4 rounded accent-[#8B5CF6]"
                          />
                          <span className="text-base leading-none">{sec.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">{sec.name}</p>
                            <p className="text-[10px] text-[#94A3B8]">{sec.studentCount} students</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Due date */}
            <div className="pt-2 border-t border-[#E2E8F0] dark:border-white/10">
              <label className="text-[10px] font-bold text-[#64748B] dark:text-white/50 uppercase tracking-wide block mb-1.5">
                Due Date (optional)
              </label>
              <input
                type="date"
                value={assignDueDate}
                onChange={(e) => setAssignDueDate(e.target.value)}
                className="h-9 px-3 rounded-xl border border-[#E2E8F0] dark:border-white/10 bg-[#F8FAFC] dark:bg-black text-sm focus:outline-none focus:border-[#8B5CF6] w-full"
              />
            </div>

            {assignError && (
              <p className="text-xs text-[#E05C5C] font-semibold">{assignError}</p>
            )}
          </div>

          {/* Footer */}
          <DialogFooter className="p-5 border-t border-[#E2E8F0] dark:border-white/10 shrink-0 flex-row items-center gap-2">
            <span className="text-xs text-[#64748B] dark:text-white/50 flex-1">
              {assignSelected.size} section{assignSelected.size !== 1 ? "s" : ""} selected
            </span>
            <button
              onClick={() => setAssigningModule(null)}
              disabled={assignSaving}
              className="px-4 py-2 rounded-xl text-sm font-bold text-[#64748B] border border-[#E2E8F0] dark:border-white/10 hover:bg-[#F8FAFC] dark:hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={saveAssign}
              disabled={assignSaving}
              className="px-4 py-2 rounded-xl text-sm font-extrabold font-nunito bg-[#8B5CF6] hover:bg-[#7c3aed] text-white disabled:opacity-50 transition-colors"
            >
              {assignSaving ? "Saving…" : "Save Assignments"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirmation dialog (shadcn) ── */}
      <Dialog
        open={confirmTarget !== null}
        onOpenChange={(open) => { if (!open && !deleting) setConfirmDeleteId(null); }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FEE2E2] dark:bg-[#450a0a] flex items-center justify-center text-xl shrink-0">🗑️</div>
              <div>
                <DialogTitle className="font-nunito font-extrabold text-base">Delete Module?</DialogTitle>
                <DialogDescription className="text-sm text-[#64748B] dark:text-white/50 mt-0.5">
                  <span className="font-bold text-[#1E293B] dark:text-white">{confirmTarget?.icon} {confirmTarget?.title}</span>
                  {" "}will be permanently deleted along with all its stages, student responses, progress, and diagnostic reports.
                </DialogDescription>
              </div>
            </div>
            {confirmTarget && confirmTarget.completions > 0 && (
              <p className="text-sm text-[#E05C5C] font-semibold mt-2 pl-[52px]">
                ⚠️ This module has {confirmTarget.completions} completion{confirmTarget.completions > 1 ? "s" : ""}. This data will be lost.
              </p>
            )}
          </DialogHeader>
          <DialogFooter className="flex-row gap-2 sm:justify-start">
            <button
              onClick={deleteModule}
              disabled={deleting}
              className="flex-1 py-2.5 rounded-xl text-sm font-extrabold font-nunito bg-[#E05C5C] hover:bg-[#c94b4b] text-white disabled:opacity-50 transition-colors"
            >
              {deleting ? "Deleting…" : "Yes, Delete"}
            </button>
            <button
              onClick={() => setConfirmDeleteId(null)}
              disabled={deleting}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-[#64748B] border border-[#E2E8F0] dark:border-white/10 hover:bg-[#F8FAFC] dark:hover:bg-[#162032] transition-colors"
            >
              Cancel
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit dialog (shadcn) ── */}
      <Dialog
        open={editingId !== null}
        onOpenChange={(open) => { if (!open && !saving) { setEditingId(null); setError(null); } }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">
          <DialogHeader className="flex-row items-center gap-3 px-6 py-4 border-b border-[#E2E8F0] dark:border-white/10 shrink-0 space-y-0">
            <div className="w-10 h-10 rounded-xl bg-[#EDE9FE] dark:bg-[#2e1065] flex items-center justify-center text-xl shrink-0">
              {F.icon || "📦"}
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="font-nunito font-extrabold text-base truncate leading-snug">
                {F.title || "Edit Module"}
              </DialogTitle>
              <p className="text-[10px] text-[#94A3B8]">Module #{editingId}</p>
            </div>
          </DialogHeader>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
            {error && (
              <div className="text-sm text-[#E05C5C] bg-[#FEE2E2] dark:bg-[#450a0a] border border-[#E05C5C]/30 rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            {/* Row 1: Icon + Title + Subtitle */}
            <div className="grid grid-cols-[72px_1fr_1fr] gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#64748B] dark:text-white/50 uppercase tracking-wide">Icon</label>
                <Input value={F.icon} onChange={(e) => setF({ icon: e.target.value })}
                  className="h-9 text-base text-center" maxLength={4} placeholder="📦" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#64748B] dark:text-white/50 uppercase tracking-wide">Title *</label>
                <Input value={F.title} onChange={(e) => setF({ title: e.target.value })}
                  className="h-9 text-sm" placeholder="Module title" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#64748B] dark:text-white/50 uppercase tracking-wide">Subtitle</label>
                <Input value={F.subtitle} onChange={(e) => setF({ subtitle: e.target.value })}
                  className="h-9 text-sm" placeholder="Optional subtitle" />
              </div>
            </div>

            {/* Row 2: Context + Status + Grade + Time */}
            <div className="grid grid-cols-4 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#64748B] dark:text-white/50 uppercase tracking-wide">Context</label>
                <select
                  value={F.contextKey}
                  onChange={(e) => setF({ contextKey: e.target.value })}
                  className="h-9 rounded-xl border border-[#E2E8F0] dark:border-white/10 bg-white dark:bg-black text-sm px-2.5 focus:outline-none focus:border-[#8B5CF6]"
                >
                  {contexts.map((c) => (
                    <option key={c.key} value={c.key}>{c.icon} {c.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#64748B] dark:text-white/50 uppercase tracking-wide">Status</label>
                <select
                  value={F.status}
                  onChange={(e) => setF({ status: e.target.value })}
                  className="h-9 rounded-xl border border-[#E2E8F0] dark:border-white/10 bg-white dark:bg-black text-sm px-2.5 focus:outline-none focus:border-[#8B5CF6]"
                >
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#64748B] dark:text-white/50 uppercase tracking-wide">Grade Level</label>
                <Input value={F.gradeLevel} onChange={(e) => setF({ gradeLevel: e.target.value })}
                  className="h-9 text-sm" placeholder="Grade 6" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#64748B] dark:text-white/50 uppercase tracking-wide">Time (min)</label>
                <Input type="number" min={0} value={F.timeEstimate}
                  onChange={(e) => setF({ timeEstimate: e.target.value })}
                  className="h-9 text-sm" placeholder="e.g. 60" />
              </div>
            </div>

            {/* Row 3: Lock toggle */}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <div
                  onClick={() => setF({ isLocked: !F.isLocked })}
                  className={cn(
                    "w-9 h-5 rounded-full transition-colors relative cursor-pointer shrink-0",
                    F.isLocked ? "bg-[#8B5CF6]" : "bg-[#CBD5E1] dark:bg-[#334155]"
                  )}
                >
                  <div className={cn(
                    "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
                    F.isLocked ? "translate-x-4" : "translate-x-0.5"
                  )} />
                </div>
                <span className="text-xs font-bold text-[#64748B] dark:text-white/50">
                  {F.isLocked ? "🔒 Locked" : "Unlocked"}
                </span>
              </label>
              {F.isLocked && (
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-bold text-[#64748B] dark:text-white/50 uppercase tracking-wide whitespace-nowrap">Unlock after</label>
                  <Input type="number" min={1} value={F.unlockAfter}
                    onChange={(e) => setF({ unlockAfter: e.target.value })}
                    className="h-9 text-sm w-20" placeholder="1" />
                  <span className="text-xs text-[#64748B] dark:text-white/50">completions</span>
                </div>
              )}
            </div>

            {/* Row 4: Banner */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-[#64748B] dark:text-white/50 uppercase tracking-wide">Module Banner</label>
              <BannerUpload
                value={F.bannerUrl}
                onChange={(url) => setF({ bannerUrl: url })}
              />
            </div>

            {/* Row 5: Scenario */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-[#64748B] dark:text-white/50 uppercase tracking-wide">Scenario Text</label>
              <RichTextEditor
                value={F.scenario}
                onChange={(v) => setF({ scenario: v })}
                placeholder="The anchor problem scenario shown to students…"
                minHeight="100px"
              />
            </div>
          </div>

          <DialogFooter className="px-6 py-4 border-t border-[#E2E8F0] dark:border-white/10 shrink-0 flex-row gap-2 sm:justify-start">
            <button
              onClick={saveEdit}
              disabled={saving || !F.title.trim()}
              className="flex-1 py-2.5 rounded-xl text-sm font-extrabold font-nunito bg-[#8B5CF6] text-white hover:bg-[#7c3aed] disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
            <button
              onClick={() => { setEditingId(null); setError(null); }}
              disabled={saving}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-[#64748B] border border-[#E2E8F0] dark:border-white/10 hover:bg-[#F8FAFC] dark:hover:bg-[#162032] transition-colors"
            >
              Cancel
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-2.5 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-[260px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#94A3B8]">🔍</span>
          <Input
            placeholder="Search modules…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-sm bg-white dark:bg-black border-[#E2E8F0] dark:border-white/10 focus-visible:border-[#8B5CF6] rounded-xl"
          />
        </div>
        <div className="flex gap-1.5">
          {(["all","active","draft","archived"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "font-nunito font-bold text-xs px-3.5 py-1.5 rounded-full border capitalize transition-all",
                statusFilter === s
                  ? "bg-[#8B5CF6] text-white border-[#8B5CF6]"
                  : "border-[#E2E8F0] dark:border-white/10 text-[#64748B] hover:border-[#8B5CF6] hover:text-[#8B5CF6]"
              )}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-[#94A3B8]">{filtered.length} module{filtered.length !== 1 ? "s" : ""}</span>
          <button
            onClick={() => router.push("/admin/modules/new")}
            className="px-4 py-2 rounded-xl font-nunito font-bold text-sm bg-[#8B5CF6] hover:bg-[#7c3aed] text-white shadow-[0_4px_14px_rgba(139,92,246,0.3)] transition-all"
          >
            ＋ New Module
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white dark:bg-black border border-[#E2E8F0] dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-[#64748B] dark:text-white/50">No modules found.</p>
          </div>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#E2E8F0] dark:border-white/10 bg-[#F8FAFC] dark:bg-[#0a0a0a]">
                <th
                  className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-[#64748B] dark:text-[#94A3B8] cursor-pointer select-none hover:text-[#8B5CF6] transition-colors"
                  onClick={() => toggleSort("title")}
                >
                  Module
                  <SortIcon active={sortCol === "title"} dir={sortDir} />
                </th>
                <th
                  className="px-3 py-3 text-center text-[10px] font-bold uppercase tracking-wide text-[#64748B] dark:text-[#94A3B8] cursor-pointer select-none hover:text-[#8B5CF6] transition-colors hidden sm:table-cell"
                  onClick={() => toggleSort("status")}
                >
                  Status
                  <SortIcon active={sortCol === "status"} dir={sortDir} />
                </th>
                <th
                  className="px-3 py-3 text-center text-[10px] font-bold uppercase tracking-wide text-[#64748B] dark:text-[#94A3B8] cursor-pointer select-none hover:text-[#8B5CF6] transition-colors hidden md:table-cell"
                  onClick={() => toggleSort("stages")}
                >
                  Stages
                  <SortIcon active={sortCol === "stages"} dir={sortDir} />
                </th>
                <th
                  className="px-3 py-3 text-center text-[10px] font-bold uppercase tracking-wide text-[#64748B] dark:text-[#94A3B8] cursor-pointer select-none hover:text-[#8B5CF6] transition-colors hidden md:table-cell"
                  onClick={() => toggleSort("completions")}
                >
                  Completions
                  <SortIcon active={sortCol === "completions"} dir={sortDir} />
                </th>
                <th
                  className="px-3 py-3 text-center text-[10px] font-bold uppercase tracking-wide text-[#64748B] dark:text-[#94A3B8] cursor-pointer select-none hover:text-[#8B5CF6] transition-colors hidden lg:table-cell"
                  onClick={() => toggleSort("sections")}
                >
                  Sections
                  <SortIcon active={sortCol === "sections"} dir={sortDir} />
                </th>
                <th
                  className="px-3 py-3 text-center text-[10px] font-bold uppercase tracking-wide text-[#64748B] dark:text-[#94A3B8] cursor-pointer select-none hover:text-[#8B5CF6] transition-colors hidden lg:table-cell"
                  onClick={() => toggleSort("time")}
                >
                  Time
                  <SortIcon active={sortCol === "time"} dir={sortDir} />
                </th>
                <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wide text-[#64748B] dark:text-[#94A3B8]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr
                  key={m.id}
                  className={cn(
                    "border-b border-[#E2E8F0] dark:border-white/5 last:border-0 transition-colors",
                    editingId === m.id
                      ? "bg-[#F5F0FF] dark:bg-[#1a1040]"
                      : "hover:bg-[#F8FAFC] dark:hover:bg-white/[0.03]"
                  )}
                >
                  {/* Module name + meta */}
                  <td className="px-4 py-3 max-w-[260px]">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xl shrink-0 leading-none">{m.icon}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-nunito font-extrabold text-[13px] truncate">{m.title}</span>
                          {m.isLocked && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#EEF2F8] dark:bg-white/5 text-[#64748B] border border-[#94A3B8]/30 shrink-0">
                              🔒
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#94A3B8] truncate mt-0.5">{m.context}{m.subtitle ? ` · ${m.subtitle}` : ""}</p>
                      </div>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-3 py-3 text-center hidden sm:table-cell">
                    <span className={cn("text-[10px] font-bold px-2.5 py-1 rounded-full border", STATUS_COLOR[m.status] ?? STATUS_COLOR.active)}>
                      {m.status}
                    </span>
                  </td>

                  {/* Stages */}
                  <td className="px-3 py-3 text-center hidden md:table-cell">
                    <span className="text-[13px] font-bold text-[#8B5CF6]">{m.stageCount}</span>
                  </td>

                  {/* Completions */}
                  <td className="px-3 py-3 text-center hidden md:table-cell">
                    <span className="text-[13px] font-bold text-[#4A9B7F]">{m.completions}</span>
                  </td>

                  {/* Sections */}
                  <td className="px-3 py-3 text-center hidden lg:table-cell">
                    {m.assignedTo.length > 0 ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#D1FAE5] dark:bg-[#064e35] text-[#4A9B7F] border border-[#4A9B7F]/20">
                        {m.assignedTo.length}
                      </span>
                    ) : (
                      <span className="text-[11px] text-[#CBD5E1] dark:text-white/20">—</span>
                    )}
                  </td>

                  {/* Time */}
                  <td className="px-3 py-3 text-center hidden lg:table-cell">
                    <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                      {m.timeEstimate ? `${m.timeEstimate} min` : "—"}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        title="Stages"
                        onClick={() => router.push(`/admin/modules/${m.id}/stages`)}
                        className="h-7 px-2.5 rounded-lg text-[11px] font-bold border border-[#E2E8F0] dark:border-white/10 text-[#64748B] hover:border-[#3B82C4] hover:text-[#3B82C4] hover:bg-[#DBEAFE] dark:hover:bg-[#1e3a5f] transition-all whitespace-nowrap"
                      >
                        📋 Stages
                      </button>
                      <button
                        title="Scenario Question"
                        onClick={() => router.push(`/admin/modules/${m.id}/quiz`)}
                        className="h-7 px-2.5 rounded-lg text-[11px] font-bold border border-[#E2E8F0] dark:border-white/10 text-[#64748B] hover:border-[#8B5CF6] hover:text-[#8B5CF6] hover:bg-[#EDE9FE] dark:hover:bg-[#2e1065] transition-all hidden sm:inline-flex items-center"
                      >
                        📝 Scenario Question
                      </button>
                      <button
                        title="Assign to sections"
                        onClick={() => openAssign(m)}
                        className="h-7 px-2.5 rounded-lg text-[11px] font-bold border border-[#E2E8F0] dark:border-white/10 text-[#64748B] hover:border-[#4A9B7F] hover:text-[#4A9B7F] hover:bg-[#D1FAE5] dark:hover:bg-[#064e35] transition-all hidden md:inline-flex items-center"
                      >
                        📌 Assign
                      </button>
                      <button
                        title="Edit module"
                        onClick={() => startEdit(m)}
                        className="h-7 w-7 rounded-lg flex items-center justify-center border border-[#E2E8F0] dark:border-white/10 text-[#64748B] hover:border-[#8B5CF6] hover:text-[#8B5CF6] hover:bg-[#EDE9FE] dark:hover:bg-[#2e1065] transition-all text-base"
                      >
                        ✏️
                      </button>
                      <button
                        title="Delete module"
                        onClick={() => { setError(null); setConfirmDeleteId(m.id); }}
                        className="h-7 w-7 rounded-lg flex items-center justify-center border border-[#E2E8F0] dark:border-white/10 text-[#64748B] hover:border-[#E05C5C] hover:text-[#E05C5C] hover:bg-[#FEE2E2] dark:hover:bg-[#450a0a] transition-all text-base"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── SECTIONS TAB ─────────────────────────────────────────────
function TabSections({
  sections, schools, users,
}: {
  sections: SectionRow[];
  schools:  SchoolRow[];
  users:    UserRow[];
}) {
  const router = useRouter();

  // ── local state ──────────────────────────────────────────────
  const [editingId,   setEditingId]   = useState<number | null>(null);
  const [deletingId,  setDeletingId]  = useState<number | null>(null);
  const [adding,      setAdding]      = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [deleting,    setDeleting]    = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  // Assign-teacher state
  const [assignTeacherSecId,  setAssignTeacherSecId]  = useState<number | null>(null);
  const [assignTeacherId,     setAssignTeacherId]      = useState<string>("");
  const [assigningTeacher,    setAssigningTeacher]     = useState(false);
  const [assignTeacherError,  setAssignTeacherError]   = useState<string | null>(null);

  const teachers = users.filter((u) => u.role === "TEACHER");

  function openAssignTeacher(sec: SectionRow) {
    setAssignTeacherSecId(sec.id);
    setAssignTeacherId(sec.teacherId != null ? String(sec.teacherId) : "");
    setAssignTeacherError(null);
    setEditingId(null);
    setDeletingId(null);
  }

  async function saveAssignTeacher() {
    if (assignTeacherSecId === null) return;
    setAssigningTeacher(true);
    setAssignTeacherError(null);
    const res = await fetch(`/api/admin/sections/${assignTeacherSecId}`, {
      method:      "PATCH",
      headers:     { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        teacherId: assignTeacherId ? parseInt(assignTeacherId) : null,
      }),
    });
    const d = await res.json();
    setAssigningTeacher(false);
    if (!d.success) { setAssignTeacherError(d.error ?? "Failed to assign teacher."); return; }
    setAssignTeacherSecId(null);
    router.refresh();
  }
  const [editForm,    setEditForm]    = useState<{
    name: string; emoji: string; gradeLevel: string; schoolYear: string; isActive: boolean; schoolId: number | null;
  }>({ name: "", emoji: "", gradeLevel: "", schoolYear: "", isActive: true, schoolId: null });
  const [addForm,     setAddForm]     = useState<{
    name: string; emoji: string; gradeLevel: string; schoolYear: string; schoolId: number | null;
  }>({ name: "", emoji: "🌲", gradeLevel: "Grade 6", schoolYear: "", schoolId: null });

  async function addSection() {
    if (!addForm.name.trim()) return;
    setSaving(true);
    setError(null);
    const res = await fetch("/api/admin/sections", {
      method:      "POST",
      headers:     { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        name:       addForm.name.trim(),
        emoji:      addForm.emoji.trim() || "🌲",
        gradeLevel: addForm.gradeLevel.trim() || "Grade 6",
        schoolYear: addForm.schoolYear.trim() || null,
        schoolId:   addForm.schoolId,
      }),
    });
    const d = await res.json();
    setSaving(false);
    if (!d.success) { setError(d.error ?? "Failed to create."); return; }
    setAdding(false);
    setAddForm({ name: "", emoji: "🌲", gradeLevel: "Grade 6", schoolYear: "", schoolId: null });
    router.refresh();
  }

  function startEdit(sec: SectionRow) {
    setEditingId(sec.id);
    setDeletingId(null);
    setError(null);
    setEditForm({
      name:       sec.name,
      emoji:      sec.emoji,
      gradeLevel: sec.gradeLevel,
      schoolYear: sec.schoolYear ?? "",
      isActive:   sec.isActive,
      schoolId:   sec.schoolId ?? null,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setError(null);
  }

  async function saveEdit() {
    if (!editingId) return;
    setSaving(true);
    setError(null);
    const res  = await fetch(`/api/admin/sections/${editingId}`, {
      method:      "PATCH",
      headers:     { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        name:       editForm.name.trim(),
        emoji:      editForm.emoji.trim() || "🌲",
        gradeLevel: editForm.gradeLevel.trim(),
        schoolYear: editForm.schoolYear.trim() || null,
        schoolId:   editForm.schoolId,
        isActive:   editForm.isActive,
      }),
    });
    const d = await res.json();
    setSaving(false);
    if (!d.success) { setError(d.error ?? "Failed to save."); return; }
    setEditingId(null);
    router.refresh();
  }

  async function confirmDelete(sectionId: number, studentCount: number) {
    if (studentCount > 0) {
      setError(`Cannot delete — ${studentCount} student${studentCount > 1 ? "s are" : " is"} still assigned. Reassign them first.`);
      setDeletingId(null);
      return;
    }
    setDeleting(true);
    setError(null);
    const res = await fetch(`/api/admin/sections/${sectionId}`, {
      method: "DELETE", credentials: "include",
    });
    const d = await res.json();
    setDeleting(false);
    setDeletingId(null);
    if (!d.success) { setError(d.error ?? "Failed to delete."); return; }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">

      {/* ── Error banner ── */}
      {error && (
        <div className="text-sm text-[#E05C5C] bg-[#FEE2E2] dark:bg-[#450a0a] border border-[#E05C5C]/30 rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* ── clation panel ── */}
      {adding ? (
        <div className="bg-white dark:bg-black border border-[#3B82C4] rounded-2xl p-6 shadow-md">
          <h3 className="font-nunito font-extrabold text-base mb-4">➕ New Section</h3>
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2 flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wide">Name *</label>
                <Input
                  autoFocus
                  placeholder="e.g. Narra"
                  value={addForm.name}
                  onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                  className="h-8 text-sm"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wide">Emoji</label>
                <Input
                  placeholder="🌲"
                  value={addForm.emoji}
                  onChange={(e) => setAddForm((f) => ({ ...f, emoji: e.target.value }))}
                  className="h-8 text-sm text-center"
                  maxLength={4}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wide">Grade Level</label>
                <Input
                  placeholder="Grade 6"
                  value={addForm.gradeLevel}
                  onChange={(e) => setAddForm((f) => ({ ...f, gradeLevel: e.target.value }))}
                  className="h-8 text-sm"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wide">School Year</label>
                <Input
                  placeholder="2025-2026"
                  value={addForm.schoolYear}
                  onChange={(e) => setAddForm((f) => ({ ...f, schoolYear: e.target.value }))}
                  className="h-8 text-sm"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wide">School</label>
              <select
                value={addForm.schoolId ?? ""}
                onChange={(e) => setAddForm((f) => ({ ...f, schoolId: e.target.value ? Number(e.target.value) : null }))}
                className="h-8 text-sm rounded-md border border-[#E2E8F0] dark:border-white/10 bg-white dark:bg-black px-2 text-[#0F172A] dark:text-white"
              >
                <option value="">— No school —</option>
                {schools.map((sch) => (
                  <option key={sch.id} value={sch.id}>{sch.name}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={addSection}
                disabled={saving || !addForm.name.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm font-extrabold font-nunito bg-[#3B82C4] text-white hover:bg-[#2563EB] disabled:opacity-50 transition-colors"
              >
                {saving ? "Creating…" : "Create Section"}
              </button>
              <button
                onClick={() => { setAdding(false); setAddForm({ name: "", emoji: "🌲", gradeLevel: "Grade 6", schoolYear: "", schoolId: null }); setError(null); }}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-[#64748B] border border-[#E2E8F0] dark:border-white/10 hover:bg-[#F8FAFC] dark:hover:bg-[#162032] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => { setAdding(true); setEditingId(null); setDeletingId(null); setError(null); }}
          className="self-start flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-extrabold font-nunito bg-[#3B82C4] text-white hover:bg-[#2563EB] transition-colors shadow-sm"
        >
          + Add Section
        </button>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {sections.length === 0 ? (
          <p className="text-sm text-[#64748B] dark:text-white/50 col-span-2 text-center py-12">No sections yet.</p>
        ) : sections.map((sec) => (
          <div
            key={sec.id}
            className={cn(
              "bg-white dark:bg-black border rounded-2xl p-6 shadow-sm transition-all",
              editingId === sec.id
                ? "border-[#3B82C4] dark:border-[#3B82C4] shadow-md"
                : "border-[#E2E8F0] dark:border-white/10 hover:shadow-md"
            )}
          >
            {/* ── Card header ── */}
            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl bg-[#D1FAE5] dark:bg-[#064e35] shrink-0">
                {sec.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-nunito font-extrabold text-base truncate">{sec.name}</h3>
                <p className="text-xs text-[#64748B] dark:text-white/50">
                  {sec.gradeLevel}{sec.schoolYear ? ` · ${sec.schoolYear}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Badge className={cn(
                  "text-xs font-bold border-0",
                  sec.isActive
                    ? "bg-[#D1FAE5] dark:bg-[#064e35] text-[#4A9B7F]"
                    : "bg-[#EEF2F8] dark:bg-white/5 text-[#64748B]"
                )}>
                  {sec.isActive ? "Active" : "Inactive"}
                </Badge>
                <Badge className="bg-[#EDE9FE] dark:bg-[#2e1065] text-[#8B5CF6] border-0 text-xs font-bold">
                  {sec.studentCount} students
                </Badge>
              </div>
            </div>

            {/* ── Info rows ── */}
            {editingId !== sec.id && assignTeacherSecId !== sec.id && (
              <div className="flex flex-col gap-2.5 mb-4">
                <div className="flex items-center justify-between py-2 border-b border-[#E2E8F0] dark:border-white/10">
                  <span className="text-xs text-[#64748B] dark:text-white/50">Teacher</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold">{sec.teacher}</span>
                    <button
                      onClick={() => openAssignTeacher(sec)}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-lg border border-[#E2E8F0] dark:border-white/10 text-[#64748B] hover:border-[#4A9B7F] hover:text-[#4A9B7F] hover:bg-[#D1FAE5] dark:hover:bg-[#064e35] transition-all"
                    >
                      👤 Assign
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-xs text-[#64748B] dark:text-white/50">Active Module</span>
                  <span className="text-xs font-bold text-[#8B5CF6]">{sec.activeModule ?? "None assigned"}</span>
                </div>
              </div>
            )}

            {/* ── Assign teacher form ── */}
            {assignTeacherSecId === sec.id && (
              <div className="flex flex-col gap-3 mb-4 p-3 rounded-xl border border-[#4A9B7F]/40 bg-[#D1FAE5]/20 dark:bg-[#064e35]/20">
                <p className="text-[10px] font-bold text-[#4A9B7F] uppercase tracking-wide">Assign Teacher</p>
                <select
                  value={assignTeacherId}
                  onChange={(e) => setAssignTeacherId(e.target.value)}
                  className="h-9 text-sm rounded-xl border border-[#E2E8F0] dark:border-white/10 bg-white dark:bg-black px-3 focus:outline-none focus:border-[#4A9B7F]"
                >
                  <option value="">— Unassigned —</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                {assignTeacherError && (
                  <p className="text-xs text-[#E05C5C] font-semibold">{assignTeacherError}</p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={saveAssignTeacher}
                    disabled={assigningTeacher}
                    className="flex-1 py-2 rounded-xl text-xs font-extrabold font-nunito bg-[#4A9B7F] text-white hover:bg-[#3a7a64] disabled:opacity-50 transition-colors"
                  >
                    {assigningTeacher ? "Saving…" : "Save"}
                  </button>
                  <button
                    onClick={() => setAssignTeacherSecId(null)}
                    disabled={assigningTeacher}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-[#64748B] border border-[#E2E8F0] dark:border-white/10 hover:bg-[#F8FAFC] dark:hover:bg-[#162032] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* ── Inline edit form ── */}
            {editingId === sec.id && (
              <div className="flex flex-col gap-3 mb-4">
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2 flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wide">Name</label>
                    <Input
                      value={editForm.name}
                      onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wide">Emoji</label>
                    <Input
                      value={editForm.emoji}
                      onChange={(e) => setEditForm((f) => ({ ...f, emoji: e.target.value }))}
                      className="h-8 text-sm text-center"
                      maxLength={4}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wide">Grade Level</label>
                    <Input
                      value={editForm.gradeLevel}
                      onChange={(e) => setEditForm((f) => ({ ...f, gradeLevel: e.target.value }))}
                      className="h-8 text-sm"
                      placeholder="Grade 6"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wide">School Year</label>
                    <Input
                      value={editForm.schoolYear}
                      onChange={(e) => setEditForm((f) => ({ ...f, schoolYear: e.target.value }))}
                      className="h-8 text-sm"
                      placeholder="2025-2026"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wide">School</label>
                  <select
                    value={editForm.schoolId ?? ""}
                    onChange={(e) => setEditForm((f) => ({ ...f, schoolId: e.target.value ? Number(e.target.value) : null }))}
                    className="h-8 text-sm rounded-md border border-[#E2E8F0] dark:border-white/10 bg-white dark:bg-black px-2 text-[#0F172A] dark:text-white"
                  >
                    <option value="">— No school —</option>
                    {schools.map((sch) => (
                      <option key={sch.id} value={sch.id}>{sch.name}</option>
                    ))}
                  </select>
                </div>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <div
                    onClick={() => setEditForm((f) => ({ ...f, isActive: !f.isActive }))}
                    className={cn(
                      "w-9 h-5 rounded-full transition-colors relative shrink-0 cursor-pointer",
                      editForm.isActive ? "bg-[#4A9B7F]" : "bg-[#CBD5E1] dark:bg-[#334155]"
                    )}
                  >
                    <div className={cn(
                      "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
                      editForm.isActive ? "translate-x-4" : "translate-x-0.5"
                    )} />
                  </div>
                  <span className="text-xs font-bold text-[#64748B] dark:text-white/50">
                    {editForm.isActive ? "Active" : "Inactive"}
                  </span>
                </label>
              </div>
            )}

            {/* ── Action buttons ── */}
            {editingId === sec.id ? (
              <div className="flex gap-2">
                <button
                  onClick={saveEdit}
                  disabled={saving || !editForm.name.trim()}
                  className="flex-1 py-2 rounded-xl text-xs font-extrabold font-nunito bg-[#3B82C4] text-white hover:bg-[#2563EB] disabled:opacity-50 transition-colors"
                >
                  {saving ? "Saving…" : "Save Changes"}
                </button>
                <button
                  onClick={cancelEdit}
                  disabled={saving}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#64748B] border border-[#E2E8F0] dark:border-white/10 hover:bg-[#F8FAFC] dark:hover:bg-[#162032] transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : deletingId === sec.id ? (
              <div className="flex flex-col gap-2">
                <p className="text-xs text-[#E05C5C] font-bold text-center">
                  Delete &quot;{sec.name}&quot;? This cannot be undone.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => confirmDelete(sec.id, sec.studentCount)}
                    disabled={deleting}
                    className="flex-1 py-2 rounded-xl text-xs font-extrabold font-nunito bg-[#E05C5C] text-white hover:bg-[#C94040] disabled:opacity-50 transition-colors"
                  >
                    {deleting ? "Deleting…" : "Yes, Delete"}
                  </button>
                  <button
                    onClick={() => { setDeletingId(null); setError(null); }}
                    disabled={deleting}
                    className="flex-1 py-2 rounded-xl text-xs font-bold text-[#64748B] border border-[#E2E8F0] dark:border-white/10 hover:bg-[#F8FAFC] dark:hover:bg-[#162032] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => startEdit(sec)}
                  className="flex-1 py-2 rounded-xl text-xs font-bold text-[#3B82C4] border border-[#DBEAFE] dark:border-[#1e3a5f] hover:bg-[#EFF6FF] dark:hover:bg-[#162032] transition-colors"
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => { setDeletingId(sec.id); setEditingId(null); setError(null); }}
                  className="flex-1 py-2 rounded-xl text-xs font-bold text-[#E05C5C] border border-[#FEE2E2] dark:border-[#450a0a] hover:bg-[#FEF2F2] dark:hover:bg-[#2A1515] transition-colors"
                >
                  🗑️ Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SCHOOLS TAB ─────────────────────────────────────────────
function TabSchools({ schools }: { schools: SchoolRow[] }) {
  const router = useRouter();

  const [editingId,  setEditingId]  = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [adding,     setAdding]     = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [deleting,   setDeleting]   = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [addForm,    setAddForm]    = useState({ name: "", address: "" });
  const [editForm,   setEditForm]   = useState({ name: "", address: "", isActive: true });

  async function addSchool() {
    if (!addForm.name.trim()) return;
    setSaving(true); setError(null);
    const res = await fetch("/api/admin/schools", {
      method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
      body: JSON.stringify({ name: addForm.name.trim(), address: addForm.address.trim() || undefined }),
    });
    const d = await res.json();
    setSaving(false);
    if (!d.success) { setError(d.error ?? "Failed to create."); return; }
    setAdding(false);
    setAddForm({ name: "", address: "" });
    router.refresh();
  }

  function startEdit(school: SchoolRow) {
    setEditingId(school.id); setDeletingId(null); setError(null);
    setEditForm({ name: school.name, address: school.address ?? "", isActive: school.isActive });
  }

  async function saveEdit() {
    if (!editingId) return;
    setSaving(true); setError(null);
    const res = await fetch(`/api/admin/schools/${editingId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include",
      body: JSON.stringify({
        name:     editForm.name.trim(),
        address:  editForm.address.trim() || undefined,
        isActive: editForm.isActive,
      }),
    });
    const d = await res.json();
    setSaving(false);
    if (!d.success) { setError(d.error ?? "Failed to save."); return; }
    setEditingId(null);
    router.refresh();
  }

  async function confirmDelete(schoolId: number) {
    setDeleting(true); setError(null);
    const res = await fetch(`/api/admin/schools/${schoolId}`, { method: "DELETE", credentials: "include" });
    const d = await res.json();
    setDeleting(false); setDeletingId(null);
    if (!d.success) { setError(d.error ?? "Failed to delete."); return; }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">

      {error && (
        <div className="text-sm text-[#E05C5C] bg-[#FEE2E2] dark:bg-[#450a0a] border border-[#E05C5C]/30 rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* Add School panel */}
      {adding ? (
        <div className="bg-white dark:bg-black border border-[#3B82C4] rounded-2xl p-6 shadow-md">
          <h3 className="font-nunito font-extrabold text-base mb-4">➕ New School</h3>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wide">School Name *</label>
              <Input
                autoFocus
                placeholder="e.g. Lipa City National High School"
                value={addForm.name}
                onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                className="h-8 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wide">Address <span className="normal-case font-normal">(optional)</span></label>
              <Input
                placeholder="e.g. Brgy. Marawoy, Lipa City, Batangas"
                value={addForm.address}
                onChange={(e) => setAddForm((f) => ({ ...f, address: e.target.value }))}
                className="h-8 text-sm"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={addSchool}
                disabled={saving || !addForm.name.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm font-extrabold font-nunito bg-[#3B82C4] text-white hover:bg-[#2563EB] disabled:opacity-50 transition-colors"
              >
                {saving ? "Creating…" : "Create School"}
              </button>
              <button
                onClick={() => { setAdding(false); setAddForm({ name: "", address: "" }); setError(null); }}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-[#64748B] border border-[#E2E8F0] dark:border-white/10 hover:bg-[#F8FAFC] dark:hover:bg-[#162032] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => { setAdding(true); setEditingId(null); setDeletingId(null); setError(null); }}
          className="self-start flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-extrabold font-nunito bg-[#3B82C4] text-white hover:bg-[#2563EB] transition-colors shadow-sm"
        >
          + Add School
        </button>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {schools.length === 0 ? (
          <p className="text-sm text-[#64748B] dark:text-white/50 col-span-2 text-center py-12">No schools yet. Add one above.</p>
        ) : schools.map((school) => (
          <div
            key={school.id}
            className={cn(
              "bg-white dark:bg-black border rounded-2xl p-6 shadow-sm transition-all",
              editingId === school.id
                ? "border-[#3B82C4] dark:border-[#3B82C4] shadow-md"
                : "border-[#E2E8F0] dark:border-white/10 hover:shadow-md"
            )}
          >
            {/* Card header */}
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl bg-[#DBEAFE] dark:bg-[#1e3a5f] shrink-0">🏫</div>
                <div className="min-w-0">
                  <h3 className="font-nunito font-extrabold text-[15px] leading-snug truncate">{school.name}</h3>
                  {school.address && (
                    <p className="text-[11px] text-[#64748B] dark:text-white/50 truncate mt-0.5">{school.address}</p>
                  )}
                </div>
              </div>
              <Badge className={cn(
                "text-[10px] px-2 py-0.5 border shrink-0",
                school.isActive
                  ? "bg-[#D1FAE5] dark:bg-[#064e35] text-[#4A9B7F] border-[#4A9B7F]"
                  : "bg-[#EEF2F8] dark:bg-white/5 text-[#64748B] border-[#64748B]"
              )}>
                {school.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>

            {/* Stats row */}
            <div className="flex gap-4 mb-4 text-[11px] text-[#64748B] dark:text-white/50 font-semibold">
              <span>📚 {school.sectionCount} section{school.sectionCount !== 1 ? "s" : ""}</span>
              <span>🎒 {school.studentCount} student{school.studentCount !== 1 ? "s" : ""}</span>
              <span className="ml-auto">Added {school.createdAt}</span>
            </div>

            {/* Sections list */}
            {school.sections.length > 0 && (
              <div className="mb-4 flex flex-col gap-1.5">
                <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wide mb-1">Sections</p>
                {school.sections.map((sec) => (
                  <div key={sec.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F8FAFC] dark:bg-white/5 border border-[#E2E8F0] dark:border-white/10">
                    <span>{sec.emoji}</span>
                    <span className="text-xs font-semibold flex-1">{sec.name}</span>
                    {!sec.isActive && <span className="text-[10px] text-[#94A3B8]">inactive</span>}
                    <span className="text-[11px] text-[#64748B] dark:text-white/50">
                      {sec.teacher ?? <span className="italic">Unassigned</span>}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Edit form */}
            {editingId === school.id ? (
              <div className="flex flex-col gap-3 pt-2 border-t border-[#E2E8F0] dark:border-white/10">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wide">Name *</label>
                  <Input
                    value={editForm.name}
                    onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wide">Address</label>
                  <Input
                    value={editForm.address}
                    onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))}
                    className="h-8 text-sm"
                    placeholder="Optional"
                  />
                </div>
                <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={editForm.isActive}
                    onChange={(e) => setEditForm((f) => ({ ...f, isActive: e.target.checked }))}
                    className="rounded"
                  />
                  Active
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={saveEdit}
                    disabled={saving || !editForm.name.trim()}
                    className="flex-1 py-2 rounded-xl text-sm font-extrabold font-nunito bg-[#3B82C4] text-white hover:bg-[#2563EB] disabled:opacity-50 transition-colors"
                  >
                    {saving ? "Saving…" : "Save"}
                  </button>
                  <button
                    onClick={() => { setEditingId(null); setError(null); }}
                    className="px-4 py-2 rounded-xl text-sm font-bold text-[#64748B] border border-[#E2E8F0] dark:border-white/10 hover:bg-[#F8FAFC] dark:hover:bg-[#162032] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2 pt-3 border-t border-[#E2E8F0] dark:border-white/10">
                <button
                  onClick={() => startEdit(school)}
                  className="flex-1 py-2 rounded-xl text-sm font-bold text-[#3B82C4] border border-[#3B82C4]/30 hover:bg-[#DBEAFE] dark:hover:bg-[#1e3a5f] transition-colors"
                >
                  ✏️ Edit
                </button>
                {deletingId === school.id ? (
                  <div className="flex gap-1.5 flex-1">
                    <button
                      onClick={() => confirmDelete(school.id)}
                      disabled={deleting}
                      className="flex-1 py-2 rounded-xl text-sm font-bold bg-[#E05C5C] text-white hover:bg-[#c04444] disabled:opacity-50 transition-colors"
                    >
                      {deleting ? "Deleting…" : "Confirm"}
                    </button>
                    <button
                      onClick={() => setDeletingId(null)}
                      className="flex-1 py-2 rounded-xl text-sm font-bold text-[#64748B] border border-[#E2E8F0] dark:border-white/10 hover:bg-[#F8FAFC] dark:hover:bg-[#162032] transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setDeletingId(school.id); setEditingId(null); setError(null); }}
                    className="px-4 py-2 rounded-xl text-sm font-bold text-[#E05C5C] border border-[#E05C5C]/30 hover:bg-[#FEE2E2] dark:hover:bg-[#450a0a] transition-colors"
                  >
                    🗑️
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SYSTEM TAB ───────────────────────────────────────────────
function TabSystem({ data }: { data: AdminDashboardData }) {
  const router = useRouter();
  const [clearing, setClearing]     = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [exporting, setExporting]   = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  async function handleExport() {
    setExporting(true);
    setExportError(null);
    try {
      const res = await fetch("/api/admin/export", { credentials: "include" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setExportError(d.error ?? "Export failed.");
        return;
      }
      const blob     = await res.blob();
      const filename = res.headers.get("Content-Disposition")?.match(/filename="(.+)"/)?.[1]
        ?? `tsr-export-${new Date().toISOString().slice(0, 10)}.json`;
      const url  = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href     = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setExportError("Network error. Please try again.");
    } finally {
      setExporting(false);
    }
  }

  const clearSessions = async () => {
    setClearing(true);
    await fetch("/api/admin/sessions/clear", { method: "POST", credentials: "include" });
    setClearing(false);
    setConfirmClear(false);
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-5 max-w-2xl">
      {/* DB + session info */}
      <div className="bg-white dark:bg-black border border-[#E2E8F0] dark:border-white/10 rounded-2xl p-6 shadow-sm">
        <h3 className="font-nunito font-extrabold text-base mb-4">🖥️ Database & Sessions</h3>
        <div className="flex flex-col gap-0">
          {[
            { label: "Database Status",  value: data.systemHealth.dbConnected ? "✅ Connected" : "❌ Error", ok: data.systemHealth.dbConnected },
            { label: "Active Sessions",  value: String(data.systemHealth.activeSessions), ok: true },
            { label: "Total Sessions",   value: String(data.systemHealth.totalSessions),  ok: true },
            { label: "Stage Responses",  value: String(data.stats.totalResponses),         ok: true },
            { label: "Pending Grades",   value: String(data.stats.pendingGrades), ok: data.stats.pendingGrades === 0 },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between py-3 border-b border-[#E2E8F0] dark:border-white/10 last:border-0">
              <span className="text-sm text-[#64748B] dark:text-white/50">{row.label}</span>
              <span className={cn("text-sm font-bold", row.ok ? "text-[#4A9B7F]" : "text-[#E05C5C]")}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Admin actions */}
      <div className="bg-white dark:bg-black border border-[#E2E8F0] dark:border-white/10 rounded-2xl p-6 shadow-sm">
        <h3 className="font-nunito font-extrabold text-base mb-4">⚙️ Admin Actions</h3>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between p-3.5 bg-[#F8FAFC] dark:bg-white/5 rounded-xl border border-[#E2E8F0] dark:border-white/10">
            <div>
              <p className="text-sm font-bold">Clear Expired Sessions</p>
              <p className="text-xs text-[#64748B] dark:text-white/50">Remove expired JWT sessions from the database</p>
            </div>
            <button
              onClick={() => setConfirmClear(true)}
              disabled={clearing}
              className="px-3.5 py-2 rounded-xl font-nunito font-bold text-xs border border-[#E2E8F0] dark:border-white/10 text-[#64748B] hover:border-[#E05C5C] hover:text-[#E05C5C] hover:bg-[#FEE2E2] dark:hover:bg-[#450a0a] disabled:opacity-50 transition-all"
            >
              {clearing ? "Clearing…" : "Clear"}
            </button>
          </div>

          <div className="flex items-center justify-between p-3.5 bg-[#F8FAFC] dark:bg-white/5 rounded-xl border border-[#E2E8F0] dark:border-white/10">
            <div>
              <p className="text-sm font-bold">Export All Data</p>
              <p className="text-xs text-[#64748B] dark:text-white/50">Download a JSON export of all modules and progress</p>
              {exportError && (
                <p className="text-xs text-[#E05C5C] mt-1">{exportError}</p>
              )}
            </div>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="px-3.5 py-2 rounded-xl font-nunito font-bold text-xs border border-[#E2E8F0] dark:border-white/10 text-[#64748B] hover:border-[#8B5CF6] hover:text-[#8B5CF6] hover:bg-[#EDE9FE] dark:hover:bg-[#2e1065] disabled:opacity-50 transition-all"
            >
              {exporting ? "Exporting…" : "Export"}
            </button>
          </div>

          <div className="flex items-center justify-between p-3.5 bg-[#F8FAFC] dark:bg-white/5 rounded-xl border border-[#E2E8F0] dark:border-white/10">
            <div>
              <p className="text-sm font-bold">Invite Teacher</p>
              <p className="text-xs text-[#64748B] dark:text-white/50">Generate a new teacher invite code via env vars</p>
            </div>
            <button onClick={()=> {window.location.href="/admin/invite-codes"}} className="px-3.5 py-2 rounded-xl font-nunito font-bold text-xs border border-[#E2E8F0] dark:border-white/10 text-[#64748B] hover:border-[#4A9B7F] hover:text-[#4A9B7F] hover:bg-[#D1FAE5] dark:hover:bg-[#064e35] transition-all">
              Manage
            </button>
          </div>
        </div>
      </div>

      {/* Env info */}
      <div className="bg-[#FEF3C7] dark:bg-[#3d2800] border border-[#F59E0B] rounded-2xl p-5">
        <h4 className="font-nunito font-extrabold text-sm text-[#F59E0B] mb-2">⚠️ Required Environment Variables</h4>
        <div className="flex flex-col gap-1">
          {["JWT_SECRET","DATABASE_URL","TEACHER_INVITE_CODES"].map((k) => (
            <code key={k} className="text-xs bg-[#FEF3C7] dark:bg-[#3d2800] text-[#D97706] font-mono px-2 py-0.5 rounded">{k}</code>
          ))}
        </div>
      </div>

      <ConfirmModal
        open={confirmClear}
        title="Clear expired sessions?"
        desc="This removes all expired JWT session records from the database. Active users won't be affected."
        onConfirm={clearSessions}
        onCancel={() => setConfirmClear(false)}
      />
    </div>
  );
}

// ─── SIDEBAR BODY ─────────────────────────────────────────────
function SidebarBody({
  admin, stats, tab, router, onTabChange, onNavigate, theme, onThemeToggle,
}: {
  admin:          AdminDashboardData["admin"];
  stats:          AdminDashboardData["stats"];
  tab:            Tab;
  router:         ReturnType<typeof useRouter>;
  onTabChange:    (t: Tab) => void;
  onNavigate?:    () => void;
  theme:          "light" | "dark";
  onThemeToggle:  () => void;
}) {
  const tabConfig: { key: Tab; label: string; icon: string; badge?: number; badgeDanger?: boolean }[] = [
    { key: "overview", label: "Overview",  icon: "🏠" },
    { key: "users",    label: "Users",     icon: "👥", badge: stats.totalUsers },
    { key: "modules",  label: "Modules",   icon: "📦", badge: stats.totalModules },
    { key: "sections", label: "Sections",  icon: "🏫", badge: stats.totalSections },
    { key: "schools",  label: "Schools",   icon: "🏛️", badge: stats.totalSchools },
    { key: "system",   label: "System",    icon: "⚙️", badge: stats.pendingGrades > 0 ? stats.pendingGrades : undefined, badgeDanger: stats.pendingGrades > 0 },
  ];

  function nav(path: string) {
    onNavigate?.();
    router.push(path);
  }

  return (
    <>
      {/* Logo */}
      <div className="px-6 pb-6 border-b border-[#E2E8F0] dark:border-white/10 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#3B82C4] flex items-center justify-center text-white font-extrabold text-base font-nunito mb-2.5">A</div>
        <h2 className="font-nunito text-sm font-extrabold leading-snug dark:text-white">Think–Solve<br />–Reflect</h2>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-[11px] text-[#64748B] dark:text-white/50">Admin Panel</span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#EDE9FE] dark:bg-white/10 text-[#8B5CF6] dark:text-white border border-[#8B5CF6] dark:border-white/20">ADMIN</span>
        </div>
      </div>

      {/* Nav — Dashboard tabs */}
      <div className="px-3.5 py-1 text-[10px] font-bold tracking-[0.1em] uppercase text-[#94A3B8] dark:text-white/40 mb-1">Dashboard</div>
      {tabConfig.map((t) => (
        <NavItem
          key={t.key}
          icon={t.icon}
          label={t.label}
          active={tab === t.key}
          badge={t.badge}
          badgeDanger={t.badgeDanger}
          onClick={() => { onTabChange(t.key); onNavigate?.(); }}
        />
      ))}

      {/* Nav — Model management pages */}
      <div className="px-3.5 py-1 mt-4 text-[10px] font-bold tracking-[0.1em] uppercase text-[#94A3B8] dark:text-white/40 mb-1">Models</div>
      <NavItem icon="🏷️" label="Contexts"     onClick={() => nav("/admin/contexts")} />
      <NavItem icon="🔑" label="Invite Codes" onClick={() => nav("/admin/invite-codes")} />
      <NavItem icon="📝" label="Test Sets"    onClick={() => nav("/admin/test-sets")} />

      {/* Nav — External views */}
      <div className="px-3.5 py-1 mt-4 text-[10px] font-bold tracking-[0.1em] uppercase text-[#94A3B8] dark:text-white/40 mb-1">App Views</div>
      
      <NavItem icon="🗺️" label="Application Workflow" onClick={() => nav("/admin/application-flow")} />

      {/* User card + theme toggle */}
      <div className="mt-auto pt-4 border-t border-[#E2E8F0] dark:border-white/10 px-3.5 flex flex-col gap-2">
        <ThemeToggle dark={theme === "dark"} onToggle={onThemeToggle} />
        <div className="flex items-center gap-2.5 p-2.5 rounded-xl">
          <div className="w-9 h-9 rounded-full bg-[#EDE9FE] dark:bg-white/10 flex items-center justify-center text-[#8B5CF6] dark:text-white text-sm font-extrabold font-nunito shrink-0">
            {admin.initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold truncate dark:text-white">{admin.name}</p>
            <span className="text-[11px] text-[#64748B] dark:text-white/50 truncate">{admin.email}</span>
          </div>
        </div>
        <div className="flex justify-end pr-1 -mt-1">
          <LogoutButton />
        </div>
      </div>
    </>
  );
}

// ─── MAIN CLIENT COMPONENT ────────────────────────────────────
export default function AdminDashboard({ data }: { data: AdminDashboardData }) {
  const router   = useRouter();
  const [tab,        setTab]        = useState<Tab>("overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme,      setTheme]      = useState<"light" | "dark">("light");

  // Load saved theme on mount
  useEffect(() => {
    const saved = localStorage.getItem("admin-theme") as "light" | "dark" | null;
    if (saved === "dark" || saved === "light") setTheme(saved);
  }, []);

  function toggleTheme() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("admin-theme", next);
  }

  const { admin, stats, users, modules, sections, schools, contexts, recentActivity, systemHealth } = data;

  const sidebarProps = {
    admin, stats, tab, router,
    theme, onThemeToggle: toggleTheme,
  };

  return (
    <>
      <style>{`
        .font-nunito { font-family: var(--font-nunito, 'Nunito', sans-serif); }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.35s ease both; }
        @keyframes adminSlideIn {
          from { transform: translateX(-100%); }
          to   { transform: translateX(0); }
        }
        .admin-slide-in { animation: adminSlideIn 0.26s cubic-bezier(.34,1.1,.64,1) both; }
      `}</style>

      {/* Root wrapper — dark class toggles the entire admin UI */}
      <div className={cn("flex min-h-screen bg-[#F5F7FA] text-[#1E293B]", theme === "dark" && "dark")}
           style={theme === "dark" ? { background: "#000", color: "#fff" } : undefined}>

        {/* ── DESKTOP SIDEBAR ── */}
        <aside className="hidden md:flex w-[240px] min-h-screen bg-white dark:bg-black border-r border-[#E2E8F0] dark:border-white/10 flex-col py-7 shrink-0 sticky top-0 h-screen overflow-y-auto">
          <SidebarBody {...sidebarProps} onTabChange={(t) => setTab(t)} />
        </aside>

        {/* ── MOBILE FIXED TOP BAR ── */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-30 h-14 bg-white dark:bg-black border-b border-[#E2E8F0] dark:border-white/10 flex items-center px-4 gap-3 shadow-sm">
          <button
            onClick={() => setMobileOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#EEF2F8] dark:bg-white/10 border border-[#E2E8F0] dark:border-white/20 text-[#64748B] dark:text-white shrink-0 active:scale-95 transition-all"
            aria-label="Open menu"
          >
            <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
              <rect y="0"  width="18" height="2" rx="1" fill="currentColor"/>
              <rect y="6"  width="14" height="2" rx="1" fill="currentColor"/>
              <rect y="12" width="18" height="2" rx="1" fill="currentColor"/>
            </svg>
          </button>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#3B82C4] flex items-center justify-center text-white font-extrabold text-sm font-nunito shrink-0">A</div>
          <div className="min-w-0 flex-1">
            <p className="font-nunito text-[13px] font-extrabold leading-none truncate dark:text-white">Think–Solve–Reflect</p>
            <p className="text-[10px] text-[#64748B] dark:text-white/60 mt-0.5">Admin Panel</p>
          </div>
          {/* Mobile theme toggle */}
          <button
            onClick={toggleTheme}
            title={theme === "dark" ? "Light mode" : "Dark mode"}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#EEF2F8] dark:bg-white/10 border border-[#E2E8F0] dark:border-white/20 text-base shrink-0 active:scale-95 transition-all"
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
        </div>

        {/* ── MOBILE OVERLAY + SLIDE-IN SIDEBAR ── */}
        {mobileOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <aside className="fixed top-0 left-0 bottom-0 z-50 w-[280px] bg-white dark:bg-black border-r border-[#E2E8F0] dark:border-white/10 flex flex-col py-7 overflow-y-auto md:hidden shadow-2xl admin-slide-in">
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-xl bg-[#EEF2F8] dark:bg-white/10 text-[#64748B] dark:text-white hover:text-[#1E293B] dark:hover:text-white/60 transition-colors text-base font-bold"
                aria-label="Close menu"
              >
                ✕
              </button>
              <SidebarBody
                {...sidebarProps}
                onTabChange={(t) => { setTab(t); setMobileOpen(false); }}
                onNavigate={() => setMobileOpen(false)}
              />
            </aside>
          </>
        )}

        {/* ── MAIN ── */}
        <main className="flex-1 px-4 sm:px-8 pb-8 pt-14 md:pt-8 overflow-x-hidden bg-[#F5F7FA] dark:bg-[#111] text-[#1E293B] dark:text-white min-h-screen">

          {/* Header */}
          <div className="flex items-start justify-between mb-7 fade-up">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="font-nunito text-[22px] font-extrabold">
                  {{
                    overview: "System Overview 🏠",
                    users:    "User Management 👥",
                    modules:  "Modules 📦",
                    sections: "Sections 🏫",
                    schools:  "Schools 🏛️",
                    system:   "System & Settings ⚙️",
                  }[tab]}
                </h1>
              </div>
              <p className="text-sm text-[#64748B] dark:text-white/50">
                TSR Admin Panel · {new Date().toLocaleDateString("en-PH", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => router.refresh()}
                className="px-3.5 py-2 rounded-xl font-nunito font-bold text-sm border border-[#E2E8F0] dark:border-white/20 text-[#64748B] dark:text-white/70 hover:border-[#8B5CF6] hover:text-[#8B5CF6] transition-all"
              >
                ↻ Refresh
              </button>
              {tab === "users" && (
                <button
                  onClick={() => router.push("/admin/users/new")}
                  className="px-4 py-2 rounded-xl font-nunito font-bold text-sm bg-[#8B5CF6] hover:bg-[#7c3aed] text-white shadow-[0_4px_14px_rgba(139,92,246,0.3)] transition-all"
                >
                  ＋ Add User
                </button>
              )}
            </div>
          </div>

          {/* Tab content */}
          <div className="fade-up" key={tab}>
            {tab === "overview" && (
              <TabOverview stats={stats} recentActivity={recentActivity} systemHealth={systemHealth} />
            )}
            {tab === "users"    && <TabUsers    users={users} />}
            {tab === "modules"  && <TabModules  modules={modules} contexts={contexts} sections={sections} schools={schools} />}
            {tab === "sections" && <TabSections sections={sections} schools={schools} users={users} />}
            {tab === "schools"  && <TabSchools  schools={schools} />}
            {tab === "system"   && <TabSystem   data={data} />}
          </div>
        </main>
      </div>
    </>
  );
}