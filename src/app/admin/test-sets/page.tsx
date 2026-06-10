"use client";
// /admin/test-sets — Manage Pre-Test and Post-Test sets

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────
interface AdminUser { id: number; name: string; email: string; role: string; }

interface ModuleOption  { id: number; title: string; icon: string; }
interface SectionOption {
  id: number; name: string; emoji: string; schoolId: number | null;
  isActive: boolean; teacher: { name: string } | null; _count: { students: number };
}
interface SchoolOption  { id: number; name: string; isActive: boolean; }

interface TestSetRow {
  id:          number;
  title:       string;
  type:        "PRE_TEST" | "POST_TEST";
  description: string | null;
  timeLimit:   number | null;
  isActive:    boolean;
  createdAt:   string;
  module:      ModuleOption | null;
  assignments: { sectionId: number }[];
  _count:      { questions: number; results: number };
}

type FormState = {
  title: string; type: "PRE_TEST" | "POST_TEST";
  moduleId: number | null; description: string; timeLimit: string;
};
const BLANK: FormState = { title: "", type: "PRE_TEST", moduleId: null, description: "", timeLimit: "" };

type SortCol = "title" | "type" | "questions" | "results" | "sections" | "time" | null;
type SortDir = "asc" | "desc";

// ─── Helpers ───────────────────────────────────────────────────
function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

const TYPE_BADGE: Record<string, string> = {
  PRE_TEST:  "bg-[#DBEAFE] dark:bg-[#1e3a5f] text-[#3B82C4] border-[#3B82C4]/40",
  POST_TEST: "bg-[#EDE9FE] dark:bg-[#2e1065] text-[#8B5CF6] border-[#8B5CF6]/40",
};
const TYPE_LABEL: Record<string, string> = { PRE_TEST: "Pre-Test", POST_TEST: "Post-Test" };

// ─── Sort indicator ─────────────────────────────────────────────
function SortIcon({ col, active, dir }: { col: string; active: boolean; dir: SortDir }) {
  if (!active) return <span className="text-[#CBD5E1] ml-1">↕</span>;
  return <span className="text-[#8B5CF6] ml-1">{dir === "asc" ? "↑" : "↓"}</span>;
}

// ─── Page ──────────────────────────────────────────────────────
export default function TestSetsAdminPage() {
  const router = useRouter();

  // ── Sidebar state ───────────────────────────────────────────
  const [adminUser,   setAdminUser]   = useState<AdminUser | null>(null);
  const [theme,       setTheme]       = useState<"light" | "dark">("light");
  const [mobileOpen,  setMobileOpen]  = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("admin-theme") as "light" | "dark" | null;
    if (saved) setTheme(saved);
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { if (d.success) setAdminUser(d.user); });
  }, []);

  function toggleTheme() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("admin-theme", next);
  }

  // ── Data state ─────────────────────────────────────────────
  const [testSets,  setTestSets]  = useState<TestSetRow[]>([]);
  const [modules,   setModules]   = useState<ModuleOption[]>([]);
  const [sections,  setSections]  = useState<SectionOption[]>([]);
  const [schools,   setSchools]   = useState<SchoolOption[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [success,   setSuccess]   = useState<string | null>(null);

  // ── DataTable state ────────────────────────────────────────
  const [search,      setSearch]      = useState("");
  const [typeFilter,  setTypeFilter]  = useState<"all" | "PRE_TEST" | "POST_TEST">("all");
  const [sortCol,     setSortCol]     = useState<SortCol>(null);
  const [sortDir,     setSortDir]     = useState<SortDir>("asc");
  const [page,        setPage]        = useState(1);
  const PAGE_SIZE = 10;

  // ── Edit / Create form state ───────────────────────────────
  const [editId, setEditId] = useState<number | null>(null);
  const [form,   setForm]   = useState<FormState>(BLANK);

  // ── Reset state ────────────────────────────────────────────
  const [resetTarget, setResetTarget] = useState<TestSetRow | null>(null);
  const [resetting,   setResetting]   = useState(false);

  // ── Delete modal state ────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<TestSetRow | null>(null);
  const [deleting,     setDeleting]     = useState(false);
  const [deleteError,  setDeleteError]  = useState<string | null>(null);

  // ── Assign state ───────────────────────────────────────────
  const [assignTarget,   setAssignTarget]   = useState<TestSetRow | null>(null);
  const [assignSelected, setAssignSelected] = useState<Set<number>>(new Set());
  const [assignSaving,   setAssignSaving]   = useState(false);
  const [assignError,    setAssignError]    = useState<string | null>(null);

  // ── Load ──────────────────────────────────────────────────
  const load = async () => {
    setLoading(true);
    const res  = await fetch("/api/admin/test-sets", { credentials: "include" });
    const data = await res.json();
    if (data.success) {
      setTestSets(data.testSets);
      setModules(data.modules);
      setSections(data.sections ?? []);
      setSchools(data.schools  ?? []);
    }
    setLoading(false);
  };
  useEffect(() => { void load(); }, []);

  // ── Sort + filter ─────────────────────────────────────────
  const sorted = useMemo(() => {
    let rows = testSets.filter((ts) => {
      const matchType   = typeFilter === "all" || ts.type === typeFilter;
      const matchSearch = !search.trim() ||
        ts.title.toLowerCase().includes(search.toLowerCase()) ||
        (ts.module?.title ?? "").toLowerCase().includes(search.toLowerCase());
      return matchType && matchSearch;
    });
    if (sortCol) {
      rows = [...rows].sort((a, b) => {
        let av: number | string = 0, bv: number | string = 0;
        if (sortCol === "title")     { av = a.title; bv = b.title; }
        if (sortCol === "type")      { av = a.type;  bv = b.type;  }
        if (sortCol === "questions") { av = a._count.questions; bv = b._count.questions; }
        if (sortCol === "results")   { av = a._count.results;   bv = b._count.results;   }
        if (sortCol === "sections")  { av = a.assignments.length; bv = b.assignments.length; }
        if (sortCol === "time")      { av = a.timeLimit ?? 0; bv = b.timeLimit ?? 0; }
        if (typeof av === "string")  return sortDir === "asc" ? av.localeCompare(bv as string) : (bv as string).localeCompare(av);
        return sortDir === "asc" ? (av as number) - (bv as number) : (bv as number) - (av as number);
      });
    }
    return rows;
  }, [testSets, search, typeFilter, sortCol, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageRows   = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleSort(col: SortCol) {
    if (sortCol === col) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
    setPage(1);
  }

  // ── CRUD handlers ─────────────────────────────────────────
  const openNew  = () => { setEditId(-1); setForm(BLANK); setError(null); };
  const openEdit = (ts: TestSetRow) => {
    setEditId(ts.id);
    setForm({
      title:       ts.title,
      type:        ts.type,
      moduleId:    ts.module?.id ?? null,
      description: ts.description ?? "",
      timeLimit:   ts.timeLimit != null ? String(Math.round(ts.timeLimit / 60)) : "",
    });
    setError(null);
  };
  const closeForm = () => { setEditId(null); setError(null); };

  const handleSave = async () => {
    if (!form.title.trim()) { setError("Title is required."); return; }
    setSaving(true); setError(null);
    const timeLimitSec = form.timeLimit.trim() !== "" ? parseInt(form.timeLimit) * 60 : null;
    let res: Response;
    if (editId === -1) {
      res = await fetch("/api/admin/test-sets", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: form.title.trim(), type: form.type, moduleId: form.moduleId, description: form.description.trim() || null, timeLimit: timeLimitSec }),
      });
    } else {
      res = await fetch(`/api/admin/test-sets/${editId}`, {
        method: "PATCH", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: form.title.trim(), type: form.type, moduleId: form.moduleId, description: form.description.trim() || null, timeLimit: timeLimitSec }),
      });
    }
    const data = await res.json();
    setSaving(false);
    if (!data.success) { setError(data.error ?? "Failed to save."); return; }
    setSuccess(editId === -1 ? "Test set created!" : "Test set updated!");
    closeForm(); void load();
    setTimeout(() => setSuccess(null), 3000);
  };

  function openDelete(ts: TestSetRow) {
    setDeleteTarget(ts);
    setDeleteError(null);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true); setDeleteError(null);
    const res  = await fetch(`/api/admin/test-sets/${deleteTarget.id}`, { method: "DELETE", credentials: "include" });
    const data = await res.json();
    setDeleting(false);
    if (!data.success) { setDeleteError(data.error ?? "Delete failed."); return; }
    setDeleteTarget(null);
    setSuccess("Test set deleted."); void load();
    setTimeout(() => setSuccess(null), 3000);
  }

  const toggleActive = async (ts: TestSetRow) => {
    await fetch(`/api/admin/test-sets/${ts.id}`, {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !ts.isActive }),
    });
    void load();
  };

  // ── Reset handler ─────────────────────────────────────────
  const handleReset = async () => {
    if (!resetTarget) return;
    setResetting(true);
    const res  = await fetch(`/api/admin/test-sets/${resetTarget.id}/reset`, { method: "POST", credentials: "include" });
    const data = await res.json();
    setResetting(false); setResetTarget(null);
    if (!data.success) { setError(data.error ?? "Reset failed."); return; }
    setSuccess(`Cleared ${data.deletedCount} result(s) for "${resetTarget.title}".`);
    void load(); setTimeout(() => setSuccess(null), 4000);
  };

  // ── Assign handlers ───────────────────────────────────────
  function openAssign(ts: TestSetRow) {
    setAssignTarget(ts);
    setAssignSelected(new Set(ts.assignments.map((a) => a.sectionId)));
    setAssignError(null); setEditId(null);
  }
  function toggleSection(id: number) {
    setAssignSelected((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }
  function toggleSchool(schoolId: number, checked: boolean) {
    const ids = sections.filter((s) => s.schoolId === schoolId).map((s) => s.id);
    setAssignSelected((prev) => { const next = new Set(prev); ids.forEach((id) => checked ? next.add(id) : next.delete(id)); return next; });
  }
  async function saveAssign() {
    if (!assignTarget) return;
    setAssignSaving(true); setAssignError(null);
    try {
      const res  = await fetch(`/api/admin/test-sets/${assignTarget.id}/assign`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionIds: Array.from(assignSelected) }),
      });
      const data = await res.json();
      if (!data.success) { setAssignError(data.error ?? "Failed to save."); return; }
      setAssignTarget(null);
      setSuccess(`Assignments saved for "${assignTarget.title}".`);
      void load(); setTimeout(() => setSuccess(null), 3000);
    } catch { setAssignError("Network error. Please try again."); }
    finally  { setAssignSaving(false); }
  }

  const sectionsBySchool    = schools.map((sch) => ({ school: sch, sections: sections.filter((s) => s.schoolId === sch.id) })).filter((g) => g.sections.length > 0);
  const unschooledSections  = sections.filter((s) => s.schoolId === null);

  // ── Logout ───────────────────────────────────────────────
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.push("/login"); router.refresh();
  }

  // ── Nav items ────────────────────────────────────────────
  const navMain = [
    { icon: "🏠", label: "Overview",  path: "/admin" },
    { icon: "👥", label: "Users",     path: "/admin#users" },
    { icon: "📦", label: "Modules",   path: "/admin#modules" },
    { icon: "🏫", label: "Sections",  path: "/admin#sections" },
    { icon: "🏛️", label: "Schools",   path: "/admin#schools" },
    { icon: "⚙️", label: "System",    path: "/admin#system" },
  ];
  const navModels = [
    { icon: "🏷️", label: "Contexts",      path: "/admin/contexts" },
    { icon: "🔑", label: "Invite Codes",  path: "/admin/invite-codes" },
    { icon: "📝", label: "Test Sets",     path: "/admin/test-sets" },
  ];

  // ── Sidebar JSX ──────────────────────────────────────────
  const SidebarContent = (
    <>
      {/* Logo */}
      <div className="px-6 pb-5 border-b border-[#E2E8F0] dark:border-white/10 mb-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#3B82C4] flex items-center justify-center text-white font-extrabold text-base font-nunito mb-2.5">A</div>
        <h2 className="font-nunito text-sm font-extrabold leading-snug dark:text-white">Think–Solve<br />–Reflect</h2>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-[11px] text-[#64748B] dark:text-white/50">Admin Panel</span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#EDE9FE] dark:bg-white/10 text-[#8B5CF6] border border-[#8B5CF6]/30">ADMIN</span>
        </div>
      </div>

      {/* Dashboard nav */}
      <div className="px-3.5 py-1 text-[10px] font-bold tracking-[0.1em] uppercase text-[#94A3B8] dark:text-white/40 mb-1">Dashboard</div>
      {navMain.map((n) => (
        <button
          key={n.path}
          onClick={() => { setMobileOpen(false); router.push(n.path); }}
          className="flex items-center gap-2.5 px-[18px] py-2.5 mx-2.5 rounded-xl text-sm font-medium text-[#64748B] dark:text-white/60 hover:bg-[#EEF2F8] dark:hover:bg-white/10 transition-all w-[calc(100%-20px)]"
        >
          <span className="text-[17px] w-5 text-center shrink-0">{n.icon}</span>
          <span className="flex-1 text-left">{n.label}</span>
        </button>
      ))}

      {/* Models nav */}
      <div className="px-3.5 py-1 mt-4 text-[10px] font-bold tracking-[0.1em] uppercase text-[#94A3B8] dark:text-white/40 mb-1">Models</div>
      {navModels.map((n) => (
        <button
          key={n.path}
          onClick={() => { setMobileOpen(false); router.push(n.path); }}
          className={cn(
            "flex items-center gap-2.5 px-[18px] py-2.5 mx-2.5 rounded-xl text-sm font-medium transition-all w-[calc(100%-20px)]",
            n.path === "/admin/test-sets"
              ? "bg-[#EDE9FE] dark:bg-white/15 text-[#8B5CF6] dark:text-white font-bold"
              : "text-[#64748B] dark:text-white/60 hover:bg-[#EEF2F8] dark:hover:bg-white/10"
          )}
        >
          <span className="text-[17px] w-5 text-center shrink-0">{n.icon}</span>
          <span className="flex-1 text-left">{n.label}</span>
        </button>
      ))}

      {/* App Views */}
      <div className="px-3.5 py-1 mt-4 text-[10px] font-bold tracking-[0.1em] uppercase text-[#94A3B8] dark:text-white/40 mb-1">App Views</div>
      <button
        onClick={() => { setMobileOpen(false); router.push("/admin/application-flow"); }}
        className="flex items-center gap-2.5 px-[18px] py-2.5 mx-2.5 rounded-xl text-sm font-medium text-[#64748B] dark:text-white/60 hover:bg-[#EEF2F8] dark:hover:bg-white/10 transition-all w-[calc(100%-20px)]"
      >
        <span className="text-[17px] w-5 text-center shrink-0">🗺️</span>
        <span className="flex-1 text-left">Application Workflow</span>
      </button>

      {/* Bottom: theme + user */}
      <div className="mt-auto pt-4 border-t border-[#E2E8F0] dark:border-white/10 px-3.5 flex flex-col gap-2">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className={cn(
            "flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs font-bold transition-all border",
            theme === "dark"
              ? "bg-white/10 text-white hover:bg-white/20 border-white/20"
              : "bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0] border-[#E2E8F0]"
          )}
        >
          <span className="text-base leading-none">{theme === "dark" ? "☀️" : "🌙"}</span>
          <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
          <span className={cn("ml-auto w-9 h-5 rounded-full relative shrink-0 transition-colors overflow-hidden", theme === "dark" ? "bg-[#8B5CF6]" : "bg-[#CBD5E1]")}>
            <span className={cn("absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200", theme === "dark" ? "translate-x-4" : "translate-x-0")} />
          </span>
        </button>

        {/* User card */}
        {adminUser && (
          <div className="flex items-center gap-2.5 p-2.5 rounded-xl">
            <div className="w-9 h-9 rounded-full bg-[#EDE9FE] dark:bg-white/10 flex items-center justify-center text-[#8B5CF6] dark:text-white text-sm font-extrabold font-nunito shrink-0">
              {initials(adminUser.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold truncate dark:text-white">{adminUser.name}</p>
              <p className="text-[11px] text-[#64748B] dark:text-white/50 truncate">{adminUser.email}</p>
            </div>
          </div>
        )}
        <div className="flex justify-end pr-1 -mt-1">
          <button
            onClick={logout}
            className="text-xs text-[#64748B] dark:text-white/50 hover:text-[#E05C5C] font-semibold px-2 py-1 rounded-lg hover:bg-[#FEE2E2] dark:hover:bg-[#450a0a] transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </>
  );

  // ── Table column header ───────────────────────────────────
  function Th({ col, label, className }: { col: SortCol; label: string; className?: string }) {
    return (
      <th
        onClick={() => col && handleSort(col)}
        className={cn(
          "px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wide text-[#64748B] dark:text-[#94A3B8] select-none whitespace-nowrap",
          col && "cursor-pointer hover:text-[#8B5CF6] transition-colors",
          className
        )}
      >
        {label}
        {col && <SortIcon col={col} active={sortCol === col} dir={sortDir} />}
      </th>
    );
  }

  return (
    <>
      <style>{`.font-nunito { font-family: var(--font-nunito,'Nunito',sans-serif); }`}</style>

      {/* ── Modals (rendered above layout) ── */}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => !deleting && setDeleteTarget(null)}>
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl p-6 w-full max-w-md border border-[#E2E8F0] dark:border-[#334155]"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-[#FEE2E2] dark:bg-[#450a0a] flex items-center justify-center text-xl shrink-0">🗑️</div>
              <div>
                <h3 className="font-nunito font-extrabold text-base mb-1">Delete Test Set?</h3>
                <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
                  <span className="font-bold text-[#1E293B] dark:text-white">&ldquo;{deleteTarget.title}&rdquo;</span>
                  {" "}will be permanently deleted along with all its questions.
                </p>
                {deleteTarget._count.results > 0 && (
                  <p className="text-xs text-[#E05C5C] font-semibold mt-1.5">
                    ⚠️ This test has {deleteTarget._count.results} student result{deleteTarget._count.results !== 1 ? "s" : ""} — deletion is blocked. Reset progress first.
                  </p>
                )}
              </div>
            </div>
            {deleteError && (
              <div className="mb-4 px-3.5 py-2.5 bg-[#FEE2E2] dark:bg-[#450a0a] border border-[#E05C5C]/30 rounded-xl text-sm text-[#E05C5C] font-semibold">
                {deleteError}
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={confirmDelete}
                disabled={deleting || deleteTarget._count.results > 0}
                className="flex-1 py-2.5 rounded-xl text-sm font-extrabold font-nunito bg-[#E05C5C] hover:bg-[#c94b4b] text-white disabled:opacity-50 transition-colors">
                {deleting ? "Deleting…" : "Yes, Delete"}
              </button>
              <button onClick={() => setDeleteTarget(null)} disabled={deleting}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-[#64748B] border border-[#E2E8F0] dark:border-[#334155] hover:border-[#8B5CF6] hover:text-[#8B5CF6] hover:bg-[#EDE9FE] dark:hover:bg-[#2e1065] transition-all">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit test set modal */}
      {editId !== null && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => !saving && closeForm()}>
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl w-full max-w-lg border border-[#E2E8F0] dark:border-[#334155] flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0] dark:border-[#334155] shrink-0">
              <h2 className="font-nunito font-extrabold text-base dark:text-white">
                {editId === -1 ? "New Test Set" : "Edit Test Set"}
              </h2>
              <button onClick={closeForm} disabled={saving}
                className="text-[#64748B] hover:text-[#E05C5C] text-xl leading-none transition-colors disabled:opacity-40">×</button>
            </div>
            {/* Body */}
            <div className="overflow-y-auto p-6 space-y-3 flex-1">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]">Title *</label>
                <input autoFocus value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Module 1 Pre-Assessment"
                  className="w-full px-3 py-2 text-sm bg-[#F8FAFC] dark:bg-[#0F1E2E] border border-[#E2E8F0] dark:border-[#334155] rounded-xl focus:outline-none focus:border-[#8B5CF6]" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]">Type *</label>
                <div className="flex gap-2">
                  {(["PRE_TEST","POST_TEST"] as const).map((t) => (
                    <button key={t} type="button" onClick={() => setForm((f) => ({ ...f, type: t }))}
                      className={cn("flex-1 py-2 rounded-xl text-sm font-bold border-[1.5px] transition-all",
                        form.type === t
                          ? t === "PRE_TEST" ? "border-[#3B82C4] bg-[#DBEAFE] dark:bg-[#1e3a5f] text-[#3B82C4]" : "border-[#8B5CF6] bg-[#EDE9FE] dark:bg-[#2e1065] text-[#8B5CF6]"
                          : "border-[#E2E8F0] dark:border-[#334155] text-[#64748B] hover:border-[#8B5CF6]")}>
                      {t === "PRE_TEST" ? "📋 Pre-Test" : "📊 Post-Test"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]">Linked Module</label>
                  <select value={form.moduleId ?? ""} onChange={(e) => setForm((f) => ({ ...f, moduleId: e.target.value ? parseInt(e.target.value) : null }))}
                    className="w-full px-3 py-2 text-sm bg-[#F8FAFC] dark:bg-[#0F1E2E] border border-[#E2E8F0] dark:border-[#334155] rounded-xl focus:outline-none focus:border-[#8B5CF6]">
                    <option value="">— No module —</option>
                    {modules.map((m) => <option key={m.id} value={m.id}>{m.icon} {m.title}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]">Time Limit (min)</label>
                  <input type="number" min={1} value={form.timeLimit} onChange={(e) => setForm((f) => ({ ...f, timeLimit: e.target.value }))}
                    placeholder="blank = none"
                    className="w-full px-3 py-2 text-sm bg-[#F8FAFC] dark:bg-[#0F1E2E] border border-[#E2E8F0] dark:border-[#334155] rounded-xl focus:outline-none focus:border-[#8B5CF6]" />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]">Description</label>
                <textarea rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Optional instructions for students"
                  className="w-full px-3 py-2 text-sm bg-[#F8FAFC] dark:bg-[#0F1E2E] border border-[#E2E8F0] dark:border-[#334155] rounded-xl focus:outline-none focus:border-[#8B5CF6] resize-none" />
              </div>
              {error && (
                <p className="text-sm text-[#E05C5C] bg-[#FEE2E2] dark:bg-[#450a0a] px-3.5 py-2 rounded-xl font-semibold">⚠️ {error}</p>
              )}
            </div>
            {/* Footer */}
            <div className="px-6 py-4 border-t border-[#E2E8F0] dark:border-[#334155] shrink-0 flex gap-2">
              <button onClick={handleSave} disabled={saving || !form.title.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm font-extrabold font-nunito bg-[#8B5CF6] text-white hover:bg-[#7c3aed] disabled:opacity-50 transition-colors">
                {saving ? "Saving…" : editId === -1 ? "Create Test Set" : "Save Changes"}
              </button>
              <button onClick={closeForm} disabled={saving}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-[#64748B] border border-[#E2E8F0] dark:border-[#334155] hover:border-[#8B5CF6] hover:text-[#8B5CF6] transition-all">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset confirmation */}
      {resetTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => !resetting && setResetTarget(null)}>
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl p-6 w-full max-w-md border border-[#E2E8F0] dark:border-[#334155]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-[#FEF3C7] dark:bg-[#3d2800] flex items-center justify-center text-xl shrink-0">🔄</div>
              <div>
                <h3 className="font-extrabold text-base mb-1">Reset Progress?</h3>
                <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
                  This will permanently delete all{" "}
                  <span className="font-bold text-[#1E293B] dark:text-white">{resetTarget._count.results} result{resetTarget._count.results !== 1 ? "s" : ""}</span>{" "}
                  for <span className="font-bold text-[#1E293B] dark:text-white">&ldquo;{resetTarget.title}&rdquo;</span>. Students will be able to retake the test.
                </p>
                {resetTarget._count.results === 0 && (
                  <p className="text-sm text-[#4A9B7F] font-semibold mt-2">✓ No results to clear.</p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleReset} disabled={resetting || resetTarget._count.results === 0}
                className="flex-1 py-2.5 rounded-xl text-sm font-extrabold bg-[#F59E0B] hover:bg-[#d97706] text-white disabled:opacity-50 transition-colors">
                {resetting ? "Resetting…" : "Yes, Reset Progress"}
              </button>
              <button onClick={() => setResetTarget(null)} disabled={resetting}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-[#64748B] border border-[#E2E8F0] dark:border-[#334155] hover:bg-[#F8FAFC] dark:hover:bg-[#162032] transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign modal */}
      {assignTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => !assignSaving && setAssignTarget(null)}>
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl w-full max-w-lg border border-[#E2E8F0] dark:border-[#334155] flex flex-col max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-[#E2E8F0] dark:border-[#334155] shrink-0">
              <div className="flex items-start gap-3">
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0", assignTarget.type === "PRE_TEST" ? "bg-[#DBEAFE] dark:bg-[#1e3a5f] text-[#3B82C4]" : "bg-[#EDE9FE] dark:bg-[#2e1065] text-[#8B5CF6]")}>
                  {assignTarget.type === "PRE_TEST" ? "📋" : "📊"}
                </div>
                <div className="min-w-0">
                  <h3 className="font-extrabold text-base leading-tight">Assign to Sections</h3>
                  <p className="text-xs text-[#64748B] dark:text-[#94A3B8] truncate mt-0.5">{assignTarget.title}</p>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {sections.length === 0 ? (
                <p className="text-sm text-[#64748B] text-center py-6">No sections available.</p>
              ) : (
                <>
                  {sectionsBySchool.map(({ school, sections: secList }) => {
                    const ids = secList.map((s) => s.id);
                    const allChecked  = ids.every((id) => assignSelected.has(id));
                    const someChecked = ids.some((id) => assignSelected.has(id));
                    return (
                      <div key={school.id}>
                        <label className="flex items-center gap-2 cursor-pointer mb-2">
                          <input type="checkbox" checked={allChecked}
                            ref={(el) => { if (el) el.indeterminate = someChecked && !allChecked; }}
                            onChange={(e) => toggleSchool(school.id, e.target.checked)}
                            className="w-4 h-4 rounded accent-[#8B5CF6]" />
                          <span className="text-xs font-extrabold uppercase tracking-wide">🏛️ {school.name}</span>
                          <span className="text-[10px] text-[#94A3B8]">{secList.length} section{secList.length !== 1 ? "s" : ""}</span>
                        </label>
                        <div className="ml-6 space-y-1">
                          {secList.map((sec) => (
                            <label key={sec.id} className="flex items-center gap-2.5 cursor-pointer rounded-xl px-3 py-2 hover:bg-[#F8FAFC] dark:hover:bg-white/5 transition-colors">
                              <input type="checkbox" checked={assignSelected.has(sec.id)} onChange={() => toggleSection(sec.id)} className="w-4 h-4 rounded accent-[#8B5CF6]" />
                              <span className="text-base leading-none">{sec.emoji}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold truncate">{sec.name}</p>
                                <p className="text-[10px] text-[#94A3B8]">{sec.teacher?.name ?? "No teacher"} · {sec._count.students} students</p>
                              </div>
                              {assignTarget.assignments.some((a) => a.sectionId === sec.id) && (
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
                      <p className="text-xs font-extrabold text-[#94A3B8] uppercase tracking-wide mb-2">No School</p>
                      <div className="space-y-1">
                        {unschooledSections.map((sec) => (
                          <label key={sec.id} className="flex items-center gap-2.5 cursor-pointer rounded-xl px-3 py-2 hover:bg-[#F8FAFC] dark:hover:bg-white/5 transition-colors">
                            <input type="checkbox" checked={assignSelected.has(sec.id)} onChange={() => toggleSection(sec.id)} className="w-4 h-4 rounded accent-[#8B5CF6]" />
                            <span className="text-base leading-none">{sec.emoji}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate">{sec.name}</p>
                              <p className="text-[10px] text-[#94A3B8]">{sec._count.students} students</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
              {assignError && <p className="text-xs text-[#E05C5C] font-semibold">{assignError}</p>}
            </div>
            <div className="p-5 border-t border-[#E2E8F0] dark:border-[#334155] shrink-0 flex items-center gap-2">
              <span className="text-xs text-[#64748B] flex-1">{assignSelected.size} section{assignSelected.size !== 1 ? "s" : ""} selected</span>
              <button onClick={() => setAssignTarget(null)} disabled={assignSaving} className="px-4 py-2 rounded-xl text-sm font-bold text-[#64748B] border border-[#E2E8F0] dark:border-[#334155] hover:bg-[#F8FAFC] transition-colors">Cancel</button>
              <button onClick={saveAssign} disabled={assignSaving} className="px-4 py-2 rounded-xl text-sm font-extrabold bg-[#8B5CF6] hover:bg-[#7c3aed] text-white disabled:opacity-50 transition-colors">
                {assignSaving ? "Saving…" : "Save Assignments"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Layout ── */}
      <div className={cn("flex min-h-screen bg-[#F5F7FA] text-[#1E293B] font-nunito", theme === "dark" && "dark")}
           style={theme === "dark" ? { background: "#000", color: "#fff" } : undefined}>

        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-[240px] min-h-screen bg-white dark:bg-black border-r border-[#E2E8F0] dark:border-white/10 flex-col py-7 shrink-0 sticky top-0 h-screen overflow-y-auto">
          {SidebarContent}
        </aside>

        {/* Mobile top bar */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-30 h-14 bg-white dark:bg-black border-b border-[#E2E8F0] dark:border-white/10 flex items-center px-4 gap-3 shadow-sm">
          <button onClick={() => setMobileOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#EEF2F8] dark:bg-white/10 border border-[#E2E8F0] dark:border-white/20 text-[#64748B] dark:text-white">
            <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
              <rect y="0"  width="18" height="2" rx="1" fill="currentColor"/>
              <rect y="6"  width="14" height="2" rx="1" fill="currentColor"/>
              <rect y="12" width="18" height="2" rx="1" fill="currentColor"/>
            </svg>
          </button>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#3B82C4] flex items-center justify-center text-white font-extrabold text-sm font-nunito shrink-0">A</div>
          <p className="font-nunito text-[13px] font-extrabold truncate flex-1 dark:text-white">Test Sets</p>
        </div>

        {/* Mobile drawer */}
        {mobileOpen && (
          <>
            <div className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
            <aside className="md:hidden fixed top-0 left-0 z-50 h-full w-[240px] bg-white dark:bg-black border-r border-[#E2E8F0] dark:border-white/10 flex flex-col py-7 overflow-y-auto"
                   style={{ animation: "slideIn .26s cubic-bezier(.34,1.1,.64,1) both" }}>
              <style>{`@keyframes slideIn{from{transform:translateX(-100%)}to{transform:translateX(0)}}`}</style>
              {SidebarContent}
            </aside>
          </>
        )}

        {/* Main content */}
        <div className="flex-1 min-w-0 flex flex-col">

          {/* Page header */}
          <div className="sticky top-0 z-20 bg-white dark:bg-black border-b border-[#E2E8F0] dark:border-white/10 px-6 h-14 flex items-center gap-3 shadow-sm mt-14 md:mt-0">
            <h1 className="font-nunito font-extrabold text-base dark:text-white">📝 Test Sets</h1>
            <span className="text-xs text-[#64748B] dark:text-white/40 hidden sm:inline">Manage pre-tests and post-tests</span>
            <div className="ml-auto flex items-center gap-2">
              <button onClick={openNew}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#8B5CF6] text-white hover:bg-[#7c3aed] transition-all shadow-sm">
                + New Test Set
              </button>
            </div>
          </div>

          <div className="p-6 flex flex-col gap-5 flex-1">

            {/* Success / Error banners */}
            {success && (
              <div className="px-4 py-2.5 bg-[#D1FAE5] dark:bg-[#063c28] border border-[#4A9B7F]/40 rounded-xl text-sm font-semibold text-[#4A9B7F]">
                ✓ {success}
              </div>
            )}
            {error && (
              <div className="px-4 py-2.5 bg-[#FEE2E2] dark:bg-[#450a0a] border border-[#E05C5C]/30 rounded-xl text-sm font-semibold text-[#E05C5C]">
                ⚠️ {error}
              </div>
            )}

            {/* ── DataTable ── */}
            <div className="bg-white dark:bg-[#111] border border-[#E2E8F0] dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">

              {/* Toolbar */}
              <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-[#E2E8F0] dark:border-white/10 bg-[#F8FAFC] dark:bg-[#0a0a0a]">
                {/* Search */}
                <div className="relative flex-1 min-w-[160px] max-w-[260px]">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[#94A3B8]">🔍</span>
                  <input
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    placeholder="Search title or module…"
                    className="w-full pl-7 pr-3 py-1.5 text-xs bg-white dark:bg-black border border-[#E2E8F0] dark:border-white/10 rounded-lg focus:outline-none focus:border-[#8B5CF6]"
                  />
                </div>

                {/* Type filter pills */}
                <div className="flex gap-1">
                  {(["all","PRE_TEST","POST_TEST"] as const).map((t) => (
                    <button key={t} onClick={() => { setTypeFilter(t); setPage(1); }}
                      className={cn("text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all",
                        typeFilter === t ? "bg-[#8B5CF6] text-white border-[#8B5CF6]" : "border-[#E2E8F0] dark:border-white/10 text-[#64748B] hover:border-[#8B5CF6] hover:text-[#8B5CF6]")}>
                      {{ all: "All", PRE_TEST: "Pre-Tests", POST_TEST: "Post-Tests" }[t]}
                    </button>
                  ))}
                </div>

                <span className="ml-auto text-[11px] text-[#94A3B8]">
                  {sorted.length} row{sorted.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Table */}
              {loading ? (
                <div className="text-center py-16 text-[#94A3B8] text-sm">Loading…</div>
              ) : sorted.length === 0 ? (
                <div className="text-center py-16 text-[#94A3B8] text-sm">No test sets found.</div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-[#E2E8F0] dark:border-white/10 bg-[#F8FAFC] dark:bg-[#0a0a0a]">
                          <Th col="title"     label="Title" />
                          <Th col="type"      label="Type" />
                          <Th col={null}      label="Module"    className="hidden md:table-cell" />
                          <Th col="questions" label="Q's"       className="text-center" />
                          <Th col="results"   label="Results"   className="hidden sm:table-cell" />
                          <Th col="sections"  label="Sections"  className="hidden sm:table-cell" />
                          <Th col="time"      label="Time"      className="hidden md:table-cell" />
                          <Th col={null}      label="Active"    className="text-center" />
                          <th className="px-3 py-2 text-right text-[10px] font-bold uppercase tracking-wide text-[#64748B] dark:text-[#94A3B8]">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pageRows.map((ts) => (
                          <tr key={ts.id} className="border-b border-[#E2E8F0] dark:border-white/5 last:border-0 hover:bg-[#F8FAFC] dark:hover:bg-white/5 transition-colors">

                            {/* Title */}
                            <td className="px-3 py-2 max-w-[200px]">
                              <p className="font-semibold text-xs truncate dark:text-white">{ts.title}</p>
                              {ts.description && (
                                <p className="text-[10px] text-[#94A3B8] truncate">{ts.description}</p>
                              )}
                            </td>

                            {/* Type */}
                            <td className="px-3 py-2 whitespace-nowrap">
                              <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", TYPE_BADGE[ts.type])}>
                                {TYPE_LABEL[ts.type]}
                              </span>
                            </td>

                            {/* Module */}
                            <td className="px-3 py-2 hidden md:table-cell text-[11px] text-[#64748B] dark:text-[#94A3B8] max-w-[140px] truncate">
                              {ts.module ? `${ts.module.icon} ${ts.module.title}` : "—"}
                            </td>

                            {/* Questions */}
                            <td className="px-3 py-2 text-center text-xs font-bold text-[#8B5CF6]">
                              {ts._count.questions}
                            </td>

                            {/* Results */}
                            <td className="px-3 py-2 hidden sm:table-cell text-[11px] text-[#64748B] dark:text-[#94A3B8] text-center">
                              {ts._count.results}
                            </td>

                            {/* Sections */}
                            <td className="px-3 py-2 hidden sm:table-cell text-center">
                              {ts.assignments.length > 0 ? (
                                <span className="text-[10px] font-bold text-[#4A9B7F] bg-[#D1FAE5] dark:bg-[#064e35] px-2 py-0.5 rounded-full">
                                  {ts.assignments.length}
                                </span>
                              ) : (
                                <span className="text-[11px] text-[#CBD5E1]">—</span>
                              )}
                            </td>

                            {/* Time */}
                            <td className="px-3 py-2 hidden md:table-cell text-[11px] text-[#64748B] dark:text-[#94A3B8] whitespace-nowrap">
                              {ts.timeLimit ? `${Math.round(ts.timeLimit / 60)} min` : "—"}
                            </td>

                            {/* Active toggle */}
                            <td className="px-3 py-2 text-center">
                              <button onClick={() => toggleActive(ts)} title={ts.isActive ? "Deactivate" : "Activate"}
                                className={cn("w-9 h-5 rounded-full relative inline-flex shrink-0 transition-colors overflow-hidden",
                                  ts.isActive ? "bg-[#8B5CF6]" : "bg-[#CBD5E1] dark:bg-[#334155]")}>
                                <span className={cn("block w-4 h-4 rounded-full bg-white shadow mx-0.5 my-0.5 transition-transform",
                                  ts.isActive ? "translate-x-4" : "translate-x-0")} />
                              </button>
                            </td>

                            {/* Actions */}
                            <td className="px-3 py-2 text-right">
                              <div className="flex items-center justify-end gap-1 flex-nowrap">
                                <button onClick={() => router.push(`/admin/test-sets/${ts.id}/questions`)}
                                  className="text-[10px] font-bold px-2 py-1 rounded-lg border border-[#E2E8F0] dark:border-white/10 text-[#64748B] hover:border-[#8B5CF6] hover:text-[#8B5CF6] hover:bg-[#EDE9FE] dark:hover:bg-[#2e1065] transition-all whitespace-nowrap">
                                  Questions
                                </button>
                                <button onClick={() => openAssign(ts)}
                                  className="text-[10px] font-bold px-2 py-1 rounded-lg border border-[#E2E8F0] dark:border-white/10 text-[#64748B] hover:border-[#4A9B7F] hover:text-[#4A9B7F] hover:bg-[#D1FAE5] dark:hover:bg-[#064e35] transition-all whitespace-nowrap">
                                  📌 Assign
                                </button>
                                <button onClick={() => { setResetTarget(ts); setEditId(null); }}
                                  className="text-[10px] font-bold px-2 py-1 rounded-lg border border-[#E2E8F0] dark:border-white/10 text-[#64748B] hover:border-[#F59E0B] hover:text-[#F59E0B] hover:bg-[#FEF3C7] dark:hover:bg-[#3d2800] transition-all">
                                  🔄
                                </button>
                                <button onClick={() => openEdit(ts)}
                                  className="text-[10px] font-bold px-2 py-1 rounded-lg border border-[#E2E8F0] dark:border-white/10 text-[#64748B] hover:border-[#8B5CF6] hover:text-[#8B5CF6] hover:bg-[#EDE9FE] dark:hover:bg-[#2e1065] transition-all">
                                  ✏️
                                </button>
                                <button onClick={() => openDelete(ts)}
                                  className="text-[10px] font-bold px-2 py-1 rounded-lg border border-[#E2E8F0] dark:border-white/10 text-[#64748B] hover:border-[#E05C5C] hover:text-[#E05C5C] hover:bg-[#FEE2E2] dark:hover:bg-[#450a0a] transition-all">
                                  🗑️
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-2.5 border-t border-[#E2E8F0] dark:border-white/10 bg-[#F8FAFC] dark:bg-[#0a0a0a]">
                      <span className="text-[11px] text-[#94A3B8]">
                        {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sorted.length)} of {sorted.length}
                      </span>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                          className="px-2.5 py-1 text-xs font-bold rounded-lg border border-[#E2E8F0] dark:border-white/10 text-[#64748B] hover:border-[#8B5CF6] hover:text-[#8B5CF6] disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                          ← Prev
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                          .reduce<(number | "…")[]>((acc, p, i, arr) => {
                            if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("…");
                            acc.push(p);
                            return acc;
                          }, [])
                          .map((p, i) =>
                            p === "…" ? (
                              <span key={`e${i}`} className="px-1.5 text-[#94A3B8] text-xs">…</span>
                            ) : (
                              <button key={p} onClick={() => setPage(p as number)}
                                className={cn("w-7 h-7 text-xs font-bold rounded-lg transition-all",
                                  page === p ? "bg-[#8B5CF6] text-white" : "border border-[#E2E8F0] dark:border-white/10 text-[#64748B] hover:border-[#8B5CF6] hover:text-[#8B5CF6]")}>
                                {p}
                              </button>
                            )
                          )}
                        <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                          className="px-2.5 py-1 text-xs font-bold rounded-lg border border-[#E2E8F0] dark:border-white/10 text-[#64748B] hover:border-[#8B5CF6] hover:text-[#8B5CF6] disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                          Next →
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
