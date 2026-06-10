"use client";
// /admin/contexts — Manage scenario contexts dynamically

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────
interface AdminUser { id: number; name: string; email: string; role: string; }

interface ScenarioCtx {
  id:          number;
  key:         string;
  label:       string;
  description: string | null;
  icon:        string;
  color:       string;
  isActive:    boolean;
  sortOrder:   number;
}

const BLANK: Omit<ScenarioCtx, "id"> = {
  key: "", label: "", description: "", icon: "📦", color: "#4A9B7F", isActive: true, sortOrder: 0,
};

const PRESET_COLORS = [
  "#4A9B7F", "#3B82C4", "#8B5CF6", "#F59E0B", "#E05C5C",
  "#22C55E", "#0EA5E9", "#EC4899", "#F97316", "#64748B",
];

type SortCol = "label" | "key" | "sortOrder" | null;
type SortDir = "asc" | "desc";
const PAGE_SIZE = 8;

// ─── Helpers ───────────────────────────────────────────────────
function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <span className="ml-1 text-[#CBD5E1]">↕</span>;
  return <span className="ml-1 text-[#8B5CF6]">{dir === "asc" ? "↑" : "↓"}</span>;
}

// ─── Page ──────────────────────────────────────────────────────
export default function ContextsAdminPage() {
  const router = useRouter();

  // ── Sidebar state ──────────────────────────────────────────
  const [adminUser,  setAdminUser]  = useState<AdminUser | null>(null);
  const [theme,      setTheme]      = useState<"light" | "dark">("light");
  const [mobileOpen, setMobileOpen] = useState(false);

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

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.push("/login"); router.refresh();
  }

  // ── Data state ─────────────────────────────────────────────
  const [contexts, setContexts] = useState<ScenarioCtx[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [success,  setSuccess]  = useState<string | null>(null);

  // ── Form state ─────────────────────────────────────────────
  const [editId, setEditId] = useState<number | null>(null);
  const [form,   setForm]   = useState(BLANK);

  // ── Delete modal state ─────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<ScenarioCtx | null>(null);
  const [deleting,     setDeleting]     = useState(false);
  const [deleteError,  setDeleteError]  = useState<string | null>(null);

  // ── DataTable state ────────────────────────────────────────
  const [search,  setSearch]  = useState("");
  const [sortCol, setSortCol] = useState<SortCol>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page,    setPage]    = useState(1);

  // ── Load ───────────────────────────────────────────────────
  const load = async () => {
    setLoading(true);
    const res  = await fetch("/api/admin/contexts", { credentials: "include" });
    const data = await res.json();
    if (data.success) setContexts(data.contexts);
    setLoading(false);
  };
  useEffect(() => { void load(); }, []);

  // ── Sort + filter ──────────────────────────────────────────
  const filtered = useMemo(() => {
    let rows = contexts.filter((ctx) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        ctx.label.toLowerCase().includes(q) ||
        ctx.key.toLowerCase().includes(q) ||
        (ctx.description ?? "").toLowerCase().includes(q)
      );
    });
    if (sortCol) {
      rows = [...rows].sort((a, b) => {
        let av: string | number = 0, bv: string | number = 0;
        if (sortCol === "label")     { av = a.label;     bv = b.label; }
        if (sortCol === "key")       { av = a.key;       bv = b.key; }
        if (sortCol === "sortOrder") { av = a.sortOrder; bv = b.sortOrder; }
        if (typeof av === "string")
          return sortDir === "asc" ? av.localeCompare(bv as string) : (bv as string).localeCompare(av);
        return sortDir === "asc" ? (av as number) - (bv as number) : (bv as number) - (av as number);
      });
    }
    return rows;
  }, [contexts, search, sortCol, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleSort(col: SortCol) {
    if (sortCol === col) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
    setPage(1);
  }

  // ── Form handlers ──────────────────────────────────────────
  const openNew = () => {
    setEditId(-1);
    setForm({ ...BLANK, sortOrder: contexts.length + 1 });
    setError(null);
  };
  const openEdit = (ctx: ScenarioCtx) => {
    setEditId(ctx.id);
    setForm({ key: ctx.key, label: ctx.label, description: ctx.description ?? "", icon: ctx.icon, color: ctx.color, isActive: ctx.isActive, sortOrder: ctx.sortOrder });
    setError(null);
  };
  const closeForm = () => { setEditId(null); setError(null); };

  const handleSave = async () => {
    if (!form.label.trim()) { setError("Label is required."); return; }
    if (editId === -1 && !form.key.trim()) { setError("Key is required."); return; }
    setSaving(true); setError(null);
    const url    = editId === -1 ? "/api/admin/contexts" : `/api/admin/contexts/${editId}`;
    const method = editId === -1 ? "POST" : "PATCH";
    const body   = editId === -1 ? form : { label: form.label, description: form.description, icon: form.icon, color: form.color, isActive: form.isActive, sortOrder: form.sortOrder };
    const res  = await fetch(url, { method, credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    setSaving(false);
    if (!data.success) { setError(data.error ?? "Failed to save."); return; }
    setSuccess(editId === -1 ? "Context created!" : "Context updated!");
    closeForm(); void load();
    setTimeout(() => setSuccess(null), 3000);
  };

  // ── Delete handlers ────────────────────────────────────────
  function openDelete(ctx: ScenarioCtx) {
    setDeleteTarget(ctx);
    setDeleteError(null);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true); setDeleteError(null);
    const res  = await fetch(`/api/admin/contexts/${deleteTarget.id}`, { method: "DELETE", credentials: "include" });
    const data = await res.json();
    setDeleting(false);
    if (!data.success) { setDeleteError(data.error ?? "Delete failed."); return; }
    setDeleteTarget(null);
    setSuccess("Context deleted.");
    void load();
    setTimeout(() => setSuccess(null), 3000);
  }

  const toggleActive = async (ctx: ScenarioCtx) => {
    await fetch(`/api/admin/contexts/${ctx.id}`, {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !ctx.isActive }),
    });
    void load();
  };

  // ── Nav items ──────────────────────────────────────────────
  const navMain = [
    { icon: "🏠", label: "Overview",  path: "/admin" },
    { icon: "👥", label: "Users",     path: "/admin#users" },
    { icon: "📦", label: "Modules",   path: "/admin#modules" },
    { icon: "🏫", label: "Sections",  path: "/admin#sections" },
    { icon: "🏛️", label: "Schools",   path: "/admin#schools" },
    { icon: "⚙️", label: "System",    path: "/admin#system" },
  ];
  const navModels = [
    { icon: "🏷️", label: "Contexts",     path: "/admin/contexts" },
    { icon: "🔑", label: "Invite Codes", path: "/admin/invite-codes" },
    { icon: "📝", label: "Test Sets",    path: "/admin/test-sets" },
  ];

  // ── Sidebar JSX ────────────────────────────────────────────
  const SidebarContent = (
    <>
      <div className="px-6 pb-5 border-b border-[#E2E8F0] dark:border-white/10 mb-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#3B82C4] flex items-center justify-center text-white font-extrabold text-base font-nunito mb-2.5">A</div>
        <h2 className="font-nunito text-sm font-extrabold leading-snug dark:text-white">Think–Solve<br />–Reflect</h2>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-[11px] text-[#64748B] dark:text-white/50">Admin Panel</span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#EDE9FE] dark:bg-white/10 text-[#8B5CF6] border border-[#8B5CF6]/30">ADMIN</span>
        </div>
      </div>

      <div className="px-3.5 py-1 text-[10px] font-bold tracking-widest uppercase text-[#94A3B8] dark:text-white/40 mb-1">Dashboard</div>
      {navMain.map((n) => (
        <button key={n.path} onClick={() => { setMobileOpen(false); router.push(n.path); }}
          className="flex items-center gap-2.5 px-[18px] py-2.5 mx-2.5 rounded-xl text-sm font-medium text-[#64748B] dark:text-white/60 hover:bg-[#EEF2F8] dark:hover:bg-white/10 transition-all w-[calc(100%-20px)]">
          <span className="text-[17px] w-5 text-center shrink-0">{n.icon}</span>
          <span className="flex-1 text-left">{n.label}</span>
        </button>
      ))}

      <div className="px-3.5 py-1 mt-4 text-[10px] font-bold tracking-widest uppercase text-[#94A3B8] dark:text-white/40 mb-1">Models</div>
      {navModels.map((n) => (
        <button key={n.path} onClick={() => { setMobileOpen(false); router.push(n.path); }}
          className={cn(
            "flex items-center gap-2.5 px-[18px] py-2.5 mx-2.5 rounded-xl text-sm font-medium transition-all w-[calc(100%-20px)]",
            n.path === "/admin/contexts"
              ? "bg-[#EDE9FE] dark:bg-white/15 text-[#8B5CF6] dark:text-white font-bold"
              : "text-[#64748B] dark:text-white/60 hover:bg-[#EEF2F8] dark:hover:bg-white/10"
          )}>
          <span className="text-[17px] w-5 text-center shrink-0">{n.icon}</span>
          <span className="flex-1 text-left">{n.label}</span>
        </button>
      ))}

      <div className="px-3.5 py-1 mt-4 text-[10px] font-bold tracking-widest uppercase text-[#94A3B8] dark:text-white/40 mb-1">App Views</div>
      <button onClick={() => { setMobileOpen(false); router.push("/admin/application-flow"); }}
        className="flex items-center gap-2.5 px-[18px] py-2.5 mx-2.5 rounded-xl text-sm font-medium text-[#64748B] dark:text-white/60 hover:bg-[#EEF2F8] dark:hover:bg-white/10 transition-all w-[calc(100%-20px)]">
        <span className="text-[17px] w-5 text-center shrink-0">🗺️</span>
        <span className="flex-1 text-left">Application Workflow</span>
      </button>

      <div className="mt-auto pt-4 border-t border-[#E2E8F0] dark:border-white/10 px-3.5 flex flex-col gap-2">
        <button onClick={toggleTheme}
          className={cn("flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs font-bold transition-all border",
            theme === "dark" ? "bg-white/10 text-white hover:bg-white/20 border-white/20" : "bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0] border-[#E2E8F0]")}>
          <span className="text-base leading-none">{theme === "dark" ? "☀️" : "🌙"}</span>
          <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
          <span className={cn("ml-auto w-9 h-5 rounded-full relative shrink-0 transition-colors overflow-hidden", theme === "dark" ? "bg-[#8B5CF6]" : "bg-[#CBD5E1]")}>
            <span className={cn("absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200", theme === "dark" ? "translate-x-4" : "translate-x-0")} />
          </span>
        </button>
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
          <button onClick={logout}
            className="text-xs text-[#64748B] dark:text-white/50 hover:text-[#E05C5C] font-semibold px-2 py-1 rounded-lg hover:bg-[#FEE2E2] dark:hover:bg-[#450a0a] transition-colors">
            Sign out
          </button>
        </div>
      </div>
    </>
  );

  // ── Sortable th ────────────────────────────────────────────
  function Th({ col, label, className }: { col: SortCol; label: string; className?: string }) {
    return (
      <th onClick={() => col && handleSort(col)}
        className={cn(
          "px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-[#64748B] dark:text-[#94A3B8] select-none whitespace-nowrap",
          col && "cursor-pointer hover:text-[#8B5CF6] transition-colors",
          className
        )}>
        {label}
        {col && <SortIcon active={sortCol === col} dir={sortDir} />}
      </th>
    );
  }

  return (
    <>
      <style>{`.font-nunito { font-family: var(--font-nunito,'Nunito',sans-serif); }`}</style>

      {/* ── Delete confirmation modal ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => !deleting && setDeleteTarget(null)}>
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl p-6 w-full max-w-md border border-[#E2E8F0] dark:border-[#334155]"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-3 mb-5">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
                style={{ background: deleteTarget.color + "22", border: `1.5px solid ${deleteTarget.color}55` }}>
                {deleteTarget.icon}
              </div>
              <div>
                <h3 className="font-nunito font-extrabold text-base mb-1">Delete Context?</h3>
                <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
                  <span className="font-bold text-[#1E293B] dark:text-white">{deleteTarget.label}</span>{" "}
                  will be permanently removed.
                </p>
                <p className="text-xs text-[#E05C5C] font-semibold mt-2">
                  ⚠️ This will fail if any module currently uses this context.
                </p>
              </div>
            </div>

            {deleteError && (
              <div className="mb-4 px-3.5 py-2.5 bg-[#FEE2E2] dark:bg-[#450a0a] border border-[#E05C5C]/30 rounded-xl text-sm text-[#E05C5C] font-semibold">
                {deleteError}
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={confirmDelete} disabled={deleting}
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

      {/* ── Layout ── */}
      <div className={cn("flex min-h-screen bg-[#F5F7FA] text-[#1E293B] font-nunito", theme === "dark" && "dark")}
        style={theme === "dark" ? { background: "#000", color: "#fff" } : undefined}>

        {/* Desktop sidebar */}
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
          <p className="font-nunito text-[13px] font-extrabold truncate flex-1 dark:text-white">Contexts</p>
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
            <h1 className="font-nunito font-extrabold text-base dark:text-white">🏷️ Scenario Contexts</h1>
            <span className="text-xs text-[#64748B] dark:text-white/40 hidden sm:inline">Manage available learning contexts for modules</span>
            <div className="ml-auto">
              <button onClick={openNew}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#8B5CF6] text-white hover:bg-[#7c3aed] transition-all shadow-sm">
                + New Context
              </button>
            </div>
          </div>

          <div className="p-6 flex flex-col gap-5 flex-1">

            {/* Success / error banners */}
            {success && (
              <div className="px-4 py-2.5 bg-[#D1FAE5] dark:bg-[#063c28] border border-[#4A9B7F]/40 rounded-xl text-sm font-semibold text-[#4A9B7F]">
                ✓ {success}
              </div>
            )}
            {error && !editId && (
              <div className="px-4 py-2.5 bg-[#FEE2E2] dark:bg-[#450a0a] border border-[#E05C5C]/30 rounded-xl text-sm font-semibold text-[#E05C5C]">
                ⚠️ {error}
              </div>
            )}

            {/* Create / Edit form */}
            {editId !== null && (
              <div className="bg-white dark:bg-[#111] border border-[#E2E8F0] dark:border-white/10 rounded-2xl p-6 shadow-sm">
                <h2 className="font-nunito font-extrabold text-sm mb-4 dark:text-white">
                  {editId === -1 ? "New Context" : "Edit Context"}
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  {/* Key — new only */}
                  {editId === -1 && (
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold uppercase tracking-wide text-[#64748B] dark:text-[#94A3B8]">Key *</label>
                      <input value={form.key}
                        onChange={(e) => setForm((f) => ({ ...f, key: e.target.value.toUpperCase().replace(/\s+/g, "_") }))}
                        placeholder="e.g. SCHOOL_MARKET"
                        className="w-full px-3 py-2 text-sm bg-[#F8FAFC] dark:bg-[#0F1E2E] border border-[#E2E8F0] dark:border-[#334155] rounded-xl focus:outline-none focus:border-[#8B5CF6] font-mono" />
                      <p className="text-[10px] text-[#94A3B8]">Unique. Auto-uppercased. Cannot be changed after creation.</p>
                    </div>
                  )}

                  {/* Label */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-wide text-[#64748B] dark:text-[#94A3B8]">Label *</label>
                    <input autoFocus value={form.label}
                      onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                      placeholder="e.g. School Market Planner"
                      className="w-full px-3 py-2 text-sm bg-[#F8FAFC] dark:bg-[#0F1E2E] border border-[#E2E8F0] dark:border-[#334155] rounded-xl focus:outline-none focus:border-[#8B5CF6]" />
                  </div>

                  {/* Description */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-wide text-[#64748B] dark:text-[#94A3B8]">Description</label>
                    <input value={form.description ?? ""}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      placeholder="e.g. Fractions & Measurement"
                      className="w-full px-3 py-2 text-sm bg-[#F8FAFC] dark:bg-[#0F1E2E] border border-[#E2E8F0] dark:border-[#334155] rounded-xl focus:outline-none focus:border-[#8B5CF6]" />
                  </div>

                  {/* Icon */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-wide text-[#64748B] dark:text-[#94A3B8]">Icon (emoji)</label>
                    <input value={form.icon}
                      onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                      placeholder="📦"
                      className="w-full px-3 py-2 text-sm bg-[#F8FAFC] dark:bg-[#0F1E2E] border border-[#E2E8F0] dark:border-[#334155] rounded-xl focus:outline-none focus:border-[#8B5CF6]" />
                  </div>

                  {/* Sort order */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase tracking-wide text-[#64748B] dark:text-[#94A3B8]">Sort Order</label>
                    <input type="number" min={0} value={form.sortOrder}
                      onChange={(e) => setForm((f) => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 text-sm bg-[#F8FAFC] dark:bg-[#0F1E2E] border border-[#E2E8F0] dark:border-[#334155] rounded-xl focus:outline-none focus:border-[#8B5CF6]" />
                  </div>

                  {/* Active toggle (edit only) */}
                  {editId !== -1 && (
                    <div className="flex flex-col gap-1 justify-center">
                      <label className="text-[10px] font-bold uppercase tracking-wide text-[#64748B] dark:text-[#94A3B8]">Status</label>
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <div onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}
                          className={cn("w-9 h-5 rounded-full relative cursor-pointer shrink-0 transition-colors overflow-hidden",
                            form.isActive ? "bg-[#8B5CF6]" : "bg-[#CBD5E1] dark:bg-[#334155]")}>
                          <div className={cn("absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
                            form.isActive ? "translate-x-4" : "translate-x-0")} />
                        </div>
                        <span className="text-sm font-semibold text-[#64748B] dark:text-white/60">
                          {form.isActive ? "Active" : "Inactive"}
                        </span>
                      </label>
                    </div>
                  )}
                </div>

                {/* Color picker */}
                <div className="mb-4">
                  <label className="block text-[10px] font-bold uppercase tracking-wide text-[#64748B] dark:text-[#94A3B8] mb-2">Color</label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {PRESET_COLORS.map((c) => (
                      <button key={c} type="button" onClick={() => setForm((f) => ({ ...f, color: c }))}
                        className="w-7 h-7 rounded-full border-2 transition-all"
                        style={{ background: c, borderColor: form.color === c ? "#1E293B" : "transparent" }} />
                    ))}
                    <input type="color" value={form.color}
                      onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                      className="w-8 h-7 rounded cursor-pointer border border-[#E2E8F0] dark:border-[#334155]" />
                    <span className="text-xs font-mono text-[#64748B]">{form.color}</span>
                    <span className="ml-2 px-3 py-1 rounded-full text-xs font-bold"
                      style={{ background: form.color + "22", color: form.color, border: `1px solid ${form.color}44` }}>
                      {form.icon} {form.label || "Preview"}
                    </span>
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-[#E05C5C] bg-[#FEE2E2] dark:bg-[#450a0a] px-3.5 py-2 rounded-xl mb-3 font-semibold">⚠️ {error}</p>
                )}

                <div className="flex gap-2">
                  <button onClick={handleSave} disabled={saving || !form.label.trim()}
                    className="px-5 py-2 rounded-xl text-sm font-bold bg-[#8B5CF6] text-white hover:bg-[#7c3aed] disabled:opacity-50 transition-all">
                    {saving ? "Saving…" : editId === -1 ? "Create Context" : "Save Changes"}
                  </button>
                  <button onClick={closeForm} disabled={saving}
                    className="px-5 py-2 rounded-xl text-sm font-bold border border-[#E2E8F0] dark:border-[#334155] text-[#64748B] hover:border-[#8B5CF6] hover:text-[#8B5CF6] transition-all">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* ── DataTable ── */}
            {loading ? (
              <div className="text-center py-16 text-[#94A3B8] text-sm">Loading…</div>
            ) : contexts.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-[#E2E8F0] dark:border-white/10 rounded-2xl bg-white dark:bg-[#111]">
                <div className="text-5xl mb-3">🏷️</div>
                <p className="font-nunito font-extrabold text-base mb-1 dark:text-white">No contexts yet</p>
                <p className="text-sm text-[#64748B] dark:text-white/40">Click "+ New Context" to add the first one.</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-[#111] border border-[#E2E8F0] dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">

                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-[#E2E8F0] dark:border-white/10 bg-[#F8FAFC] dark:bg-[#0a0a0a]">
                  <div className="relative flex-1 min-w-[180px] max-w-[280px]">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[#94A3B8]">🔍</span>
                    <input value={search}
                      onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                      placeholder="Search label, key or description…"
                      className="w-full pl-7 pr-3 py-1.5 text-xs bg-white dark:bg-black border border-[#E2E8F0] dark:border-white/10 rounded-lg focus:outline-none focus:border-[#8B5CF6]" />
                  </div>
                  <span className="ml-auto text-[11px] text-[#94A3B8]">
                    {filtered.length} context{filtered.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {filtered.length === 0 ? (
                  <div className="text-center py-10 text-sm text-[#94A3B8]">No contexts match your search.</div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-sm">
                        <thead>
                          <tr className="border-b border-[#E2E8F0] dark:border-white/10 bg-[#F8FAFC] dark:bg-[#0a0a0a]">
                            <Th col="label"     label="Context" />
                            <Th col="key"       label="Key"    className="hidden sm:table-cell" />
                            <Th col="sortOrder" label="Order"  className="hidden md:table-cell text-center" />
                            <Th col={null}      label="Active" className="text-center" />
                            <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-wide text-[#64748B] dark:text-[#94A3B8]">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pageRows.map((ctx) => (
                            <tr key={ctx.id}
                              className="border-b border-[#E2E8F0] dark:border-white/5 last:border-0 hover:bg-[#F8FAFC] dark:hover:bg-white/5 transition-colors">

                              {/* Context */}
                              <td className="px-4 py-2.5">
                                <div className="flex items-center gap-3">
                                  <span className="w-8 h-8 rounded-xl flex items-center justify-center text-base shrink-0"
                                    style={{ background: ctx.color + "22", border: `1.5px solid ${ctx.color}44` }}>
                                    {ctx.icon}
                                  </span>
                                  <div className="min-w-0">
                                    <p className="font-bold text-xs truncate dark:text-white">{ctx.label}</p>
                                    {ctx.description && (
                                      <p className="text-[10px] text-[#64748B] dark:text-[#94A3B8] truncate">{ctx.description}</p>
                                    )}
                                  </div>
                                </div>
                              </td>

                              {/* Key */}
                              <td className="px-3 py-2.5 hidden sm:table-cell">
                                <span className="text-[10px] font-mono text-[#64748B] dark:text-[#94A3B8] bg-[#F1F5F9] dark:bg-[#334155]/40 border border-[#E2E8F0] dark:border-white/10 px-2 py-0.5 rounded-lg">
                                  {ctx.key}
                                </span>
                              </td>

                              {/* Sort order */}
                              <td className="px-3 py-2.5 hidden md:table-cell text-xs text-[#64748B] dark:text-[#94A3B8] text-center">
                                {ctx.sortOrder}
                              </td>

                              {/* Active toggle */}
                              <td className="px-4 py-2.5 text-center">
                                <button onClick={() => toggleActive(ctx)}
                                  title={ctx.isActive ? "Click to deactivate" : "Click to activate"}
                                  className={cn("w-9 h-5 rounded-full relative inline-flex shrink-0 transition-colors overflow-hidden",
                                    ctx.isActive ? "bg-[#8B5CF6]" : "bg-[#CBD5E1] dark:bg-[#334155]")}>
                                  <span className={cn("block w-4 h-4 rounded-full bg-white shadow mx-0.5 my-0.5 transition-transform",
                                    ctx.isActive ? "translate-x-4" : "translate-x-0")} />
                                </button>
                              </td>

                              {/* Actions */}
                              <td className="px-4 py-2.5 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button onClick={() => openEdit(ctx)}
                                    className="text-[10px] font-bold px-2.5 py-1 rounded-lg border border-[#E2E8F0] dark:border-white/10 text-[#64748B] hover:border-[#8B5CF6] hover:text-[#8B5CF6] hover:bg-[#EDE9FE] dark:hover:bg-[#2e1065] transition-all">
                                    ✏️ Edit
                                  </button>
                                  <button onClick={() => openDelete(ctx)}
                                    className="text-[10px] font-bold px-2.5 py-1 rounded-lg border border-[#E2E8F0] dark:border-white/10 text-[#64748B] hover:border-[#E05C5C] hover:text-[#E05C5C] hover:bg-[#FEE2E2] dark:hover:bg-[#450a0a] transition-all">
                                    🗑️ Delete
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
                          {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
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
                              acc.push(p); return acc;
                            }, [])
                            .map((p, i) =>
                              p === "…" ? (
                                <span key={`e${i}`} className="px-1 text-[#94A3B8] text-xs">…</span>
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
            )}
          </div>
        </div>
      </div>
    </>
  );
}
