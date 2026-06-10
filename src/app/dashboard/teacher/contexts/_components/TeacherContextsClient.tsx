"use client";
// app/dashboard/teacher/contexts/_components/TeacherContextsClient.tsx

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import TeacherSidebar from "../../_components/TeacherSidebar";
import type { TeacherContextsPageData } from "../page";

// ─── Types ─────────────────────────────────────────────────────
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

type FormState = Omit<ScenarioCtx, "id"> & { key: string };

const BLANK: FormState = {
  key: "", label: "", description: "", icon: "📦",
  color: "#4A9B7F", isActive: true, sortOrder: 0,
};

const PRESET_COLORS = [
  "#4A9B7F", "#3B82C4", "#8B5CF6", "#F59E0B", "#E05C5C",
  "#22C55E", "#0EA5E9", "#EC4899", "#F97316", "#64748B",
];

type SortCol = "label" | "key" | "sortOrder" | null;
type SortDir = "asc" | "desc";

const PAGE_SIZE = 8;

// ─── Sort indicator ─────────────────────────────────────────────
function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <span className="ml-1 text-[#92A894]">↕</span>;
  return <span className="ml-1 text-[#4A9B7F]">{dir === "asc" ? "↑" : "↓"}</span>;
}

// ─── Main Client Component ─────────────────────────────────────
export default function TeacherContextsClient({ data }: { data: TeacherContextsPageData }) {
  const router = useRouter();

  // ── Data state ────────────────────────────────────────────────
  const [contexts, setContexts] = useState<ScenarioCtx[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [success,  setSuccess]  = useState<string | null>(null);

  // ── Form state ────────────────────────────────────────────────
  const [editId, setEditId] = useState<number | null>(null);
  const [form,   setForm]   = useState<FormState>(BLANK);

  // ── Delete modal state ────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<ScenarioCtx | null>(null);
  const [deleting,     setDeleting]     = useState(false);
  const [deleteError,  setDeleteError]  = useState<string | null>(null);

  // ── DataTable state ───────────────────────────────────────────
  const [search,   setSearch]   = useState("");
  const [sortCol,  setSortCol]  = useState<SortCol>(null);
  const [sortDir,  setSortDir]  = useState<SortDir>("asc");
  const [page,     setPage]     = useState(1);

  // Derived key preview while typing the label on new form
  const derivedKey = form.label.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "");

  // ── Load ──────────────────────────────────────────────────────
  const load = async () => {
    setLoading(true);
    const res  = await fetch("/api/teacher/contexts", { credentials: "include" });
    const json = await res.json();
    if (json.success) setContexts(json.contexts);
    setLoading(false);
  };
  useEffect(() => { void load(); }, []);

  // ── Sort + filter ─────────────────────────────────────────────
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

  // ── Form handlers ─────────────────────────────────────────────
  const openNew = () => {
    setEditId(-1);
    setForm({ ...BLANK, sortOrder: contexts.length + 1 });
    setError(null);
  };

  const openEdit = (ctx: ScenarioCtx) => {
    setEditId(ctx.id);
    setForm({
      key:         ctx.key,
      label:       ctx.label,
      description: ctx.description ?? "",
      icon:        ctx.icon,
      color:       ctx.color,
      isActive:    ctx.isActive,
      sortOrder:   ctx.sortOrder,
    });
    setError(null);
  };

  const closeForm = () => { setEditId(null); setError(null); };

  const handleSave = async () => {
    if (!form.label.trim()) { setError("Label is required."); return; }
    setSaving(true);
    setError(null);

    let res: Response;
    if (editId === -1) {
      res = await fetch("/api/teacher/contexts", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          key:         derivedKey || form.key,
          label:       form.label,
          description: form.description || undefined,
          icon:        form.icon,
          color:       form.color,
        }),
      });
    } else {
      res = await fetch(`/api/teacher/contexts/${editId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          label:       form.label,
          description: form.description || null,
          icon:        form.icon,
          color:       form.color,
          isActive:    form.isActive,
          sortOrder:   form.sortOrder,
        }),
      });
    }

    const json = await res.json();
    setSaving(false);
    if (!json.success) { setError(json.error ?? "Failed to save."); return; }
    setSuccess(editId === -1 ? "Context created!" : "Context updated!");
    closeForm();
    void load();
    setTimeout(() => setSuccess(null), 3000);
  };

  // ── Delete modal handlers ─────────────────────────────────────
  function openDelete(ctx: ScenarioCtx) {
    setDeleteTarget(ctx);
    setDeleteError(null);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    const res  = await fetch(`/api/teacher/contexts/${deleteTarget.id}`, {
      method: "DELETE", credentials: "include",
    });
    const json = await res.json();
    setDeleting(false);
    if (!json.success) {
      setDeleteError(json.error ?? "Delete failed.");
      return;
    }
    setDeleteTarget(null);
    setSuccess("Context deleted.");
    void load();
    setTimeout(() => setSuccess(null), 3000);
  }

  const toggleActive = async (ctx: ScenarioCtx) => {
    await fetch(`/api/teacher/contexts/${ctx.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ isActive: !ctx.isActive }),
    });
    void load();
  };

  const { teacher, totalStudents, pendingGradeCount } = data;

  // ── Sortable th helper ────────────────────────────────────────
  function Th({ col, label, className }: { col: SortCol; label: string; className?: string }) {
    return (
      <th
        onClick={() => col && handleSort(col)}
        className={cn(
          "text-[10px] font-bold tracking-[0.08em] uppercase text-[#5A7860] dark:text-[#7BAF84] px-4 py-3 text-left select-none whitespace-nowrap",
          col && "cursor-pointer hover:text-[#4A9B7F] transition-colors",
          className
        )}
      >
        {label}
        {col && <SortIcon active={sortCol === col} dir={sortDir} />}
      </th>
    );
  }

  return (
    <>
      <style>{`.font-nunito { font-family: var(--font-nunito,'Nunito',sans-serif); }`}</style>

      {/* ── Create / Edit modal ── */}
      {editId !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => !saving && closeForm()}
        >
          <div
            className="bg-white dark:bg-[#132018] rounded-2xl shadow-2xl w-full max-w-lg border border-[#DDE8DF] dark:border-[#1E3524] flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#DDE8DF] dark:border-[#1E3524] shrink-0">
              <h2 className="font-nunito font-extrabold text-base">
                {editId === -1 ? "New Context" : "Edit Context"}
              </h2>
              <button
                onClick={closeForm}
                disabled={saving}
                className="text-[#5A7860] hover:text-[#E05C5C] text-xl leading-none transition-colors disabled:opacity-40"
              >×</button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto p-6 flex-1 space-y-4">

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Label */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold tracking-[0.08em] uppercase text-[#5A7860] dark:text-[#7BAF84]">
                    Label *
                  </label>
                  <Input
                    autoFocus
                    value={form.label}
                    onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                    placeholder="e.g. School Market Planner"
                    className="bg-[#EBF0EC] dark:bg-[#0A180E] border-[#DDE8DF] dark:border-[#1E3524] rounded-xl focus-visible:border-[#4A9B7F] focus-visible:ring-[#4A9B7F]/30"
                  />
                  {editId === -1 && form.label.trim() && (
                    <p className="text-[10px] text-[#5A7860] dark:text-[#7BAF84]">
                      Key: <span className="font-mono font-bold">{derivedKey || "…"}</span>
                    </p>
                  )}
                </div>

                {/* Description */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold tracking-[0.08em] uppercase text-[#5A7860] dark:text-[#7BAF84]">
                    Description
                  </label>
                  <Input
                    value={form.description ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="e.g. Fractions & Measurement"
                    className="bg-[#EBF0EC] dark:bg-[#0A180E] border-[#DDE8DF] dark:border-[#1E3524] rounded-xl focus-visible:border-[#4A9B7F] focus-visible:ring-[#4A9B7F]/30"
                  />
                </div>

                {/* Icon */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold tracking-[0.08em] uppercase text-[#5A7860] dark:text-[#7BAF84]">
                    Icon (emoji)
                  </label>
                  <Input
                    value={form.icon}
                    onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                    placeholder="📦"
                    className="bg-[#EBF0EC] dark:bg-[#0A180E] border-[#DDE8DF] dark:border-[#1E3524] rounded-xl focus-visible:border-[#4A9B7F] focus-visible:ring-[#4A9B7F]/30"
                  />
                </div>

                {/* Sort order (edit only) */}
                {editId !== -1 && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold tracking-[0.08em] uppercase text-[#5A7860] dark:text-[#7BAF84]">
                      Sort Order
                    </label>
                    <Input
                      type="number"
                      min={0}
                      value={form.sortOrder}
                      onChange={(e) => setForm((f) => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))}
                      className="bg-[#EBF0EC] dark:bg-[#0A180E] border-[#DDE8DF] dark:border-[#1E3524] rounded-xl focus-visible:border-[#4A9B7F] focus-visible:ring-[#4A9B7F]/30"
                    />
                  </div>
                )}
              </div>

              {/* Color picker */}
              <div>
                <label className="block text-[10px] font-bold tracking-[0.08em] uppercase text-[#5A7860] dark:text-[#7BAF84] mb-2">
                  Color
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, color: c }))}
                      className="w-7 h-7 rounded-full border-[3px] transition-all"
                      style={{ background: c, borderColor: form.color === c ? "#1A2E1C" : "transparent" }}
                    />
                  ))}
                  <input
                    type="color"
                    value={form.color}
                    onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                    className="w-8 h-7 rounded cursor-pointer border border-[#DDE8DF] dark:border-[#1E3524]"
                  />
                  <span className="text-xs font-mono text-[#5A7860] dark:text-[#7BAF84]">{form.color}</span>
                  <span
                    className="ml-2 px-3 py-1 rounded-full text-xs font-bold"
                    style={{ background: form.color + "22", color: form.color, border: `1px solid ${form.color}44` }}
                  >
                    {form.icon} {form.label || "Preview"}
                  </span>
                </div>
              </div>

              {/* Active toggle (edit only) */}
              {editId !== -1 && (
                <label className="flex items-center gap-3 cursor-pointer select-none w-fit">
                  <div
                    onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}
                    className={cn(
                      "w-10 h-5 rounded-full transition-colors relative cursor-pointer shrink-0 overflow-hidden",
                      form.isActive ? "bg-[#4A9B7F]" : "bg-[#DDE8DF] dark:bg-[#1E3524]"
                    )}
                  >
                    <div className={cn(
                      "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
                      form.isActive ? "translate-x-5" : "translate-x-0"
                    )} />
                  </div>
                  <span className="text-sm font-semibold text-[#5A7860] dark:text-[#7BAF84]">
                    {form.isActive ? "Active" : "Inactive"}
                  </span>
                </label>
              )}

              {error && (
                <p className="text-sm text-[#E05C5C] bg-[#FEE2E2] dark:bg-[#450a0a] px-3.5 py-2.5 rounded-xl font-semibold">
                  ⚠️ {error}
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-[#DDE8DF] dark:border-[#1E3524] shrink-0 flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving || !form.label.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm font-nunito font-extrabold bg-[#4A9B7F] text-white hover:bg-[#2E7A60] disabled:opacity-50 shadow-[0_4px_14px_rgba(74,155,127,0.25)] transition-all"
              >
                {saving ? "Saving…" : editId === -1 ? "Create Context" : "Save Changes"}
              </button>
              <button
                onClick={closeForm}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl text-sm font-nunito font-bold border border-[#DDE8DF] dark:border-[#1E3524] text-[#5A7860] dark:text-[#7BAF84] hover:border-[#4A9B7F] hover:text-[#4A9B7F] transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirmation modal ── */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => !deleting && setDeleteTarget(null)}
        >
          <div
            className="bg-white dark:bg-[#132018] rounded-2xl shadow-2xl p-6 w-full max-w-md border border-[#DDE8DF] dark:border-[#1E3524]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 mb-5">
              {/* Context color swatch */}
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
                style={{ background: deleteTarget.color + "22", border: `1.5px solid ${deleteTarget.color}55` }}
              >
                {deleteTarget.icon}
              </div>
              <div>
                <h3 className="font-nunito font-extrabold text-base mb-1">
                  Delete Context?
                </h3>
                <p className="text-sm text-[#5A7860] dark:text-[#7BAF84]">
                  <span className="font-bold text-[#1A2E1C] dark:text-[#E8F5EB]">
                    {deleteTarget.label}
                  </span>{" "}
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
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl text-sm font-extrabold font-nunito bg-[#E05C5C] hover:bg-[#c94b4b] text-white disabled:opacity-50 transition-colors"
              >
                {deleting ? "Deleting…" : "Yes, Delete"}
              </button>
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-[#5A7860] border border-[#DDE8DF] dark:border-[#1E3524] hover:border-[#4A9B7F] hover:text-[#4A9B7F] hover:bg-[#D1FAE5] dark:hover:bg-[#064e35] transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex min-h-screen bg-[#F4F7F5] dark:bg-[#0D1F12] text-[#1A2E1C] dark:text-[#E8F5EB]">

        {/* Sidebar */}
        <TeacherSidebar
          activePath="contexts"
          teacherName={teacher.name}
          teacherInitials={teacher.initials}
          teacherSection={teacher.section}
          totalStudents={totalStudents}
          pendingGradeCount={pendingGradeCount}
        />

        {/* Main */}
        <main className="flex-1 px-4 md:px-10 pb-9 pt-14 md:pt-9 overflow-x-hidden min-w-0">

          {/* Page header */}
          <div className="flex flex-wrap items-start justify-between gap-3 mb-7">
            <div>
              <h1 className="font-nunito text-xl md:text-[26px] font-black mb-1">🏷️ Scenario Contexts</h1>
              <p className="text-sm text-[#5A7860] dark:text-[#7BAF84]">
                Manage the real-life contexts available when creating modules
              </p>
            </div>
            <button
              onClick={openNew}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-nunito font-bold text-sm bg-[#4A9B7F] text-white hover:bg-[#2E7A60] shadow-[0_4px_14px_rgba(74,155,127,0.3)] transition-all"
            >
              ＋ New Context
            </button>
          </div>

          {/* Success banner */}
          {success && (
            <div className="mb-5 px-4 py-3 bg-[#D1FAE5] dark:bg-[#063c28] border border-[#4A9B7F]/40 rounded-xl text-sm font-semibold text-[#4A9B7F]">
              ✓ {success}
            </div>
          )}

          {/* ── DataTable ── */}
          {loading ? (
            <div className="text-center py-20 text-[#92A894]">Loading…</div>
          ) : contexts.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-[#DDE8DF] dark:border-[#1E3524] rounded-2xl bg-white dark:bg-[#132018]">
              <div className="text-5xl mb-4">🏷️</div>
              <h3 className="font-nunito text-lg font-extrabold mb-2">No contexts yet</h3>
              <p className="text-sm text-[#5A7860] dark:text-[#7BAF84] mb-5">
                Click &ldquo;+ New Context&rdquo; to add the first one.
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-[#132018] border border-[#DDE8DF] dark:border-[#1E3524] rounded-2xl overflow-hidden shadow-sm">

              {/* Toolbar */}
              <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-[#DDE8DF] dark:border-[#1E3524] bg-[#EBF0EC] dark:bg-[#0A180E]">
                <div className="relative flex-1 min-w-[180px] max-w-[280px]">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[#92A894]">🔍</span>
                  <input
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    placeholder="Search label, key or description…"
                    className="w-full pl-7 pr-3 py-1.5 text-xs bg-white dark:bg-[#132018] border border-[#DDE8DF] dark:border-[#1E3524] rounded-lg focus:outline-none focus:border-[#4A9B7F]"
                  />
                </div>
                <span className="ml-auto text-[11px] text-[#92A894]">
                  {filtered.length} context{filtered.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Table */}
              {filtered.length === 0 ? (
                <div className="text-center py-10 text-sm text-[#92A894]">No contexts match your search.</div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-[#DDE8DF] dark:border-[#1E3524] bg-[#EBF0EC] dark:bg-[#0A180E]">
                          <Th col="label"     label="Context" />
                          <Th col="key"       label="Key"        className="hidden sm:table-cell" />
                          <Th col="sortOrder" label="Order"      className="hidden md:table-cell" />
                          <Th col={null}      label="Active"     className="text-center" />
                          <th className="px-4 py-3 text-right text-[10px] font-bold tracking-[0.08em] uppercase text-[#5A7860] dark:text-[#7BAF84]">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {pageRows.map((ctx) => (
                          <tr
                            key={ctx.id}
                            className="border-b border-[#DDE8DF] dark:border-[#1E3524] last:border-0 hover:bg-[#EBF0EC] dark:hover:bg-[#0A180E] transition-colors"
                          >
                            {/* Context info */}
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-3">
                                <span
                                  className="w-8 h-8 rounded-xl flex items-center justify-center text-base shrink-0"
                                  style={{ background: ctx.color + "22", border: `1.5px solid ${ctx.color}44` }}
                                >
                                  {ctx.icon}
                                </span>
                                <div>
                                  <p className="font-bold text-xs leading-tight">{ctx.label}</p>
                                  {ctx.description && (
                                    <p className="text-[10px] text-[#5A7860] dark:text-[#7BAF84] mt-0.5">{ctx.description}</p>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Key */}
                            <td className="px-3 py-2.5 hidden sm:table-cell">
                              <span className="text-[10px] font-mono text-[#5A7860] dark:text-[#7BAF84] bg-[#EBF0EC] dark:bg-[#0A180E] border border-[#DDE8DF] dark:border-[#1E3524] px-2 py-0.5 rounded-lg">
                                {ctx.key}
                              </span>
                            </td>

                            {/* Sort order */}
                            <td className="px-3 py-2.5 hidden md:table-cell text-xs text-[#5A7860] dark:text-[#7BAF84] text-center">
                              {ctx.sortOrder}
                            </td>

                            {/* Active toggle */}
                            <td className="px-4 py-2.5 text-center">
                              <button
                                onClick={() => toggleActive(ctx)}
                                title={ctx.isActive ? "Click to deactivate" : "Click to activate"}
                                className={cn(
                                  "w-9 h-5 rounded-full transition-colors relative inline-flex shrink-0 overflow-hidden",
                                  ctx.isActive ? "bg-[#4A9B7F]" : "bg-[#DDE8DF] dark:bg-[#1E3524]"
                                )}
                              >
                                <span className={cn(
                                  "block w-4 h-4 rounded-full bg-white shadow mx-0.5 my-0.5 transition-transform",
                                  ctx.isActive ? "translate-x-4" : "translate-x-0"
                                )} />
                              </button>
                            </td>

                            {/* Actions */}
                            <td className="px-4 py-2.5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => openEdit(ctx)}
                                  className="text-[10px] font-bold px-2.5 py-1 rounded-lg border border-[#DDE8DF] dark:border-[#1E3524] text-[#5A7860] hover:border-[#4A9B7F] hover:text-[#4A9B7F] hover:bg-[#D1FAE5] dark:hover:bg-[#064e35] transition-all"
                                >
                                  ✏️ Edit
                                </button>
                                <button
                                  onClick={() => openDelete(ctx)}
                                  className="text-[10px] font-bold px-2.5 py-1 rounded-lg border border-[#DDE8DF] dark:border-[#1E3524] text-[#5A7860] hover:border-[#E05C5C] hover:text-[#E05C5C] hover:bg-[#FEE2E2] dark:hover:bg-[#450a0a] transition-all"
                                >
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
                    <div className="flex items-center justify-between px-4 py-2.5 border-t border-[#DDE8DF] dark:border-[#1E3524] bg-[#EBF0EC] dark:bg-[#0A180E]">
                      <span className="text-[11px] text-[#92A894]">
                        {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={page === 1}
                          className="px-2.5 py-1 text-xs font-bold rounded-lg border border-[#DDE8DF] dark:border-[#1E3524] text-[#5A7860] hover:border-[#4A9B7F] hover:text-[#4A9B7F] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
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
                              <span key={`e${i}`} className="px-1 text-[#92A894] text-xs">…</span>
                            ) : (
                              <button
                                key={p}
                                onClick={() => setPage(p as number)}
                                className={cn(
                                  "w-7 h-7 text-xs font-bold rounded-lg transition-all",
                                  page === p
                                    ? "bg-[#4A9B7F] text-white"
                                    : "border border-[#DDE8DF] dark:border-[#1E3524] text-[#5A7860] hover:border-[#4A9B7F] hover:text-[#4A9B7F]"
                                )}
                              >
                                {p}
                              </button>
                            )
                          )}
                        <button
                          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                          disabled={page === totalPages}
                          className="px-2.5 py-1 text-xs font-bold rounded-lg border border-[#DDE8DF] dark:border-[#1E3524] text-[#5A7860] hover:border-[#4A9B7F] hover:text-[#4A9B7F] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                          Next →
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
