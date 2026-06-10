"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

// ─── Types ────────────────────────────────────────────────────
export interface StudentRow {
  userId:       number;
  name:         string;
  initials:     string;
  avatarEmoji:  string;
  avatarName:   string;
  difficulty:   string;
  xp:           number;
  level:        number;
  moduleId:     number | null;
  moduleTitle:  string | null;
  moduleIcon:   string | null;
  status:       string;
  currentStage: number;
  percentScore: number | null;
  pendingCount: number;
}

export interface SectionTab {
  sectionId:    number;
  sectionName:  string;
  sectionEmoji: string;
  gradeLevel:   string;
  students:     StudentRow[];
}

export interface StudentsData {
  sections: SectionTab[];
}

// ─── Constants ────────────────────────────────────────────────
const PAGE_SIZE = 10;

const AVATAR_COLORS = [
  "bg-[#DBEAFE] dark:bg-[#1e3a5f] text-[#3B82C4]",
  "bg-[#D1FAE5] dark:bg-[#063c28] text-[#4A9B7F]",
  "bg-[#EDE9FE] dark:bg-[#2e1065] text-[#8B5CF6]",
  "bg-[#FEF3C7] dark:bg-[#3d2800] text-[#F59E0B]",
];

type SortKey = "name" | "difficulty" | "status" | "score" | "pending" | "stage";
type SortDir = "asc" | "desc";

function statusMeta(status: string) {
  if (status === "COMPLETED")   return { label: "Completed",   cls: "bg-[#D1FAE5] dark:bg-[#063c28] text-[#4A9B7F]",   order: 0 };
  if (status === "IN_PROGRESS") return { label: "In Progress", cls: "bg-[#FEF3C7] dark:bg-[#3d2800] text-[#F59E0B]",   order: 1 };
  return                               { label: "Not Started", cls: "bg-[#EEF2F8] dark:bg-[#162032] text-[#64748B]",   order: 2 };
}

function difficultyMeta(d: string) {
  if (d === "APPRENTICE") return { label: "Easy",   cls: "text-[#4A9B7F]",  order: 0 };
  if (d === "CHAMPION")   return { label: "Hard",   cls: "text-[#E05C5C]",  order: 2 };
  return                         { label: "Normal", cls: "text-[#F59E0B]",  order: 1 };
}

// ─── Student Profile Drawer ───────────────────────────────────
function StudentProfileDrawer({ student, open, onClose }: {
  student: StudentRow | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!student) return null;

  const status   = statusMeta(student.status);
  const diff     = difficultyMeta(student.difficulty);
  const stagePct = Math.round((student.currentStage / 12) * 100);

  const diffIcon  = student.difficulty === "APPRENTICE" ? "🌱" : student.difficulty === "CHAMPION" ? "🔥" : "⚔️";
  const levelColor = student.xp >= 500 ? "#8B5CF6" : student.xp >= 200 ? "#3B82C4" : "#4A9B7F";

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto p-0">
        <div className="flex flex-col h-full">

          {/* Header */}
          <div className="px-6 pt-6 pb-5 border-b border-[#E2E8F0] dark:border-[#334155] bg-gradient-to-br from-[#F8FAFC] to-white dark:from-[#1E293B] dark:to-[#0F172A]">
            <SheetTitle className="sr-only">{student.name} — Profile</SheetTitle>
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#DBEAFE] to-[#EDE9FE] dark:from-[#1e3a5f] dark:to-[#2e1065] flex items-center justify-center text-3xl shrink-0 shadow-sm">
                {student.avatarEmoji || student.initials}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-nunito font-extrabold text-lg leading-tight">{student.name}</h2>
                {student.avatarName && (
                  <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mt-0.5">{student.avatarName}</p>
                )}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#DBEAFE] dark:bg-[#1e3a5f] text-[#3B82C4] border border-[#3B82C4]/30">
                    {diffIcon} {diff.label}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                    style={{ background: `${levelColor}18`, color: levelColor, borderColor: `${levelColor}40` }}>
                    Lv {student.level} · {student.xp} XP
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 px-6 py-5 space-y-5 overflow-y-auto">

            {/* Module progress */}
            <div className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl p-4 space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748B] dark:text-[#94A3B8]">Current Module</p>
              {student.moduleTitle ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{student.moduleIcon}</span>
                    <p className="font-nunito font-bold text-sm leading-snug">{student.moduleTitle}</p>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className={cn("font-bold px-2 py-0.5 rounded-full text-[10px]", status.cls)}>{status.label}</span>
                    <span className="text-[#94A3B8]">
                      {student.status !== "NOT_STARTED" ? `Stage ${student.currentStage} / 12` : "Not started"}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-[#94A3B8]">
                      <span>Progress</span>
                      <span className="font-bold text-[#4A9B7F]">{stagePct}%</span>
                    </div>
                    <div className="h-2 bg-[#F1F5F9] dark:bg-[#334155] rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-[#4A9B7F] transition-all" style={{ width: `${stagePct}%` }} />
                    </div>
                  </div>
                  {student.percentScore !== null && (
                    <div className="flex items-center justify-between px-3 py-2 bg-[#F8FAFC] dark:bg-[#0F172A] rounded-xl border border-[#E2E8F0] dark:border-[#334155]">
                      <span className="text-xs text-[#64748B] dark:text-[#94A3B8]">Module score</span>
                      <span className={cn("font-nunito font-black text-lg",
                        student.percentScore >= 80 ? "text-[#4A9B7F]" : student.percentScore >= 60 ? "text-[#F59E0B]" : "text-[#E05C5C]")}>
                        {Math.round(student.percentScore)}%
                      </span>
                    </div>
                  )}
                  {student.pendingCount > 0 && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-[#FEF3C7] dark:bg-[#3d2800] rounded-xl border border-[#F59E0B]/30 text-xs font-bold text-[#92400E] dark:text-[#F59E0B]">
                      ⏳ {student.pendingCount} response{student.pendingCount > 1 ? "s" : ""} pending grading
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-[#94A3B8]">No module started yet.</p>
              )}
            </div>

            {/* Quick actions */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748B] dark:text-[#94A3B8]">Quick Actions</p>
              <div className="grid grid-cols-1 gap-2">
                <Link
                  href={`/dashboard/teacher/reports/${student.userId}`}
                  onClick={onClose}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#1E293B] hover:border-[#3B82C4] hover:text-[#3B82C4] transition-all group"
                >
                  <span className="text-xl">📊</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold">View Diagnostic Report</p>
                    <p className="text-[11px] text-[#94A3B8]">Phase scores, cluster analysis, intervention flags</p>
                  </div>
                  <span className="text-[#94A3B8] group-hover:text-[#3B82C4] transition-colors">→</span>
                </Link>
                <Link
                  href={`/dashboard/teacher/students/${student.userId}`}
                  onClick={onClose}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#1E293B] hover:border-[#4A9B7F] hover:text-[#4A9B7F] transition-all group"
                >
                  <span className="text-xl">✍️</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold">Review Responses</p>
                    <p className="text-[11px] text-[#94A3B8]">Grade open-ended answers, add teacher notes</p>
                  </div>
                  <span className="text-[#94A3B8] group-hover:text-[#4A9B7F] transition-colors">→</span>
                </Link>
                {student.pendingCount > 0 && (
                  <Link
                    href="/dashboard/teacher/grade"
                    onClick={onClose}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[#F59E0B]/40 bg-[#FEF3C7] dark:bg-[#3d2800] hover:border-[#F59E0B] transition-all group"
                  >
                    <span className="text-xl">🎯</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#92400E] dark:text-[#F59E0B]">Go to Grade Queue</p>
                      <p className="text-[11px] text-[#92400E]/70 dark:text-[#F59E0B]/70">{student.pendingCount} item{student.pendingCount > 1 ? "s" : ""} waiting</p>
                    </div>
                    <span className="text-[#F59E0B]">→</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Section datatable ────────────────────────────────────────
function SectionTable({ students }: { students: StudentRow[] }) {
  const [search,      setSearch]      = useState("");
  const [sortKey,     setSortKey]     = useState<SortKey>("name");
  const [sortDir,     setSortDir]     = useState<SortDir>("asc");
  const [page,        setPage]        = useState(1);
  const [profileStudent, setProfileStudent] = useState<StudentRow | null>(null);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
    setPage(1);
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return students.filter((s) => s.name.toLowerCase().includes(q) || s.avatarName.toLowerCase().includes(q));
  }, [students, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name":       cmp = a.name.localeCompare(b.name); break;
        case "difficulty": cmp = difficultyMeta(a.difficulty).order - difficultyMeta(b.difficulty).order; break;
        case "status":     cmp = statusMeta(a.status).order - statusMeta(b.status).order; break;
        case "score":      cmp = (a.percentScore ?? -1) - (b.percentScore ?? -1); break;
        case "pending":    cmp = a.pendingCount - b.pendingCount; break;
        case "stage":      cmp = a.currentStage - b.currentStage; break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated  = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const SortBtn = ({ label, k }: { label: string; k: SortKey }) => (
    <button
      onClick={() => toggleSort(k)}
      className={cn(
        "flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.06em] transition-colors",
        sortKey === k ? "text-[#4A9B7F]" : "text-[#64748B] dark:text-[#94A3B8] hover:text-[#4A9B7F]"
      )}
    >
      {label}
      <span className="text-[10px]">
        {sortKey === k ? (sortDir === "asc" ? "▲" : "▼") : "⇅"}
      </span>
    </button>
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Search bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8] text-sm">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search students…"
            className="w-full pl-9 pr-3 h-9 text-sm bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-xl outline-none focus:border-[#4A9B7F] transition-colors"
          />
        </div>
        <span className="text-xs text-[#94A3B8]">
          {filtered.length} of {students.length} student{students.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl overflow-hidden shadow-sm">
        {students.length === 0 ? (
          <p className="text-sm text-[#94A3B8] py-10 text-center">No students in this section.</p>
        ) : paginated.length === 0 ? (
          <p className="text-sm text-[#94A3B8] py-10 text-center">No students match your search.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#162032]">
                  <th className="text-left px-5 py-3"><SortBtn label="Student" k="name" /></th>
                  <th className="text-left px-5 py-3"><SortBtn label="Difficulty" k="difficulty" /></th>
                  <th className="text-left px-5 py-3"><SortBtn label="Progress" k="stage" /></th>
                  <th className="text-left px-5 py-3"><SortBtn label="Status" k="status" /></th>
                  <th className="text-left px-5 py-3"><SortBtn label="Score" k="score" /></th>
                  <th className="text-left px-5 py-3"><SortBtn label="Pending" k="pending" /></th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {paginated.map((student, idx) => {
                  const status = statusMeta(student.status);
                  const diff   = difficultyMeta(student.difficulty);
                  const pct    = student.percentScore;

                  return (
                    <tr
                      key={student.userId}
                      className="border-b border-[#E2E8F0] dark:border-[#334155] last:border-0 hover:bg-[#F8FAFC] dark:hover:bg-[#162032] transition-colors"
                    >
                      {/* Student */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-9 h-9 rounded-full flex items-center justify-center text-sm font-extrabold font-nunito flex-shrink-0",
                            AVATAR_COLORS[idx % 4]
                          )}>
                            {student.avatarEmoji || student.initials}
                          </div>
                          <div>
                            <p className="font-semibold">{student.name}</p>
                            <p className="text-[11px] text-[#94A3B8]">{student.avatarName}</p>
                          </div>
                        </div>
                      </td>

                      {/* Difficulty */}
                      <td className="px-5 py-3.5">
                        <span className={cn("text-xs font-bold", diff.cls)}>{diff.label}</span>
                      </td>

                      {/* Progress bar */}
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col gap-1 min-w-[140px]">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-[#94A3B8]">
                              {student.status === "NOT_STARTED" ? "Not started" : `Stage ${student.currentStage}/12`}
                            </span>
                            <span className="font-bold text-[#4A9B7F]">
                              {student.status !== "NOT_STARTED" ? `${Math.round((student.currentStage / 12) * 100)}%` : ""}
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-[#E2E8F0] dark:bg-[#334155] rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[#4A9B7F] transition-all"
                              style={{ width: `${Math.round((student.currentStage / 12) * 100)}%` }}
                            />
                          </div>
                          {student.moduleTitle && (
                            <p className="text-[11px] text-[#94A3B8] truncate max-w-[160px]">
                              {student.moduleIcon} {student.moduleTitle}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        <span className={cn("text-[11px] font-bold px-2 py-0.5 rounded-full", status.cls)}>
                          {status.label}
                        </span>
                      </td>

                      {/* Score */}
                      <td className="px-5 py-3.5">
                        {pct !== null ? (
                          <span className={cn(
                            "font-extrabold font-nunito text-base",
                            pct >= 80 ? "text-[#4A9B7F]" : pct >= 60 ? "text-[#F59E0B]" : "text-[#E05C5C]"
                          )}>
                            {Math.round(pct)}%
                          </span>
                        ) : (
                          <span className="text-[#94A3B8] text-xs">—</span>
                        )}
                      </td>

                      {/* Pending */}
                      <td className="px-5 py-3.5">
                        {student.pendingCount > 0 ? (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#FEE2E2] dark:bg-[#450a0a] text-[#E05C5C]">
                            {student.pendingCount} to grade
                          </span>
                        ) : student.status !== "NOT_STARTED" ? (
                          <span className="text-[11px] text-[#4A9B7F] font-semibold">All graded</span>
                        ) : (
                          <span className="text-[#94A3B8] text-xs">—</span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => setProfileStudent(student)}
                            className="text-xs font-bold px-3 py-1.5 rounded-xl border border-[#E2E8F0] dark:border-[#334155] text-[#64748B] hover:border-[#3B82C4] hover:text-[#3B82C4] transition-all whitespace-nowrap"
                          >
                            👤 Profile
                          </button>
                          <Link
                            href={`/dashboard/teacher/students/${student.userId}`}
                            className="text-xs font-bold px-3 py-1.5 rounded-xl border border-[#4A9B7F] text-[#4A9B7F] hover:bg-[#4A9B7F] hover:text-white transition-all whitespace-nowrap"
                          >
                            ✍️ Responses
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-[#94A3B8]">
            Page {page} of {totalPages} · {sorted.length} result{sorted.length !== 1 ? "s" : ""}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-xs font-bold rounded-lg border border-[#E2E8F0] dark:border-[#334155] text-[#64748B] hover:border-[#4A9B7F] hover:text-[#4A9B7F] disabled:opacity-40 transition-all"
            >
              ← Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce<(number | "…")[]>((acc, p, i, arr) => {
                if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push("…");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "…" ? (
                  <span key={`ellipsis-${i}`} className="px-2 text-[#94A3B8] text-xs">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p as number)}
                    className={cn(
                      "w-8 h-8 text-xs font-bold rounded-lg border transition-all",
                      page === p
                        ? "border-[#4A9B7F] bg-[#4A9B7F] text-white"
                        : "border-[#E2E8F0] dark:border-[#334155] text-[#64748B] hover:border-[#4A9B7F] hover:text-[#4A9B7F]"
                    )}
                  >
                    {p}
                  </button>
                )
              )}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-xs font-bold rounded-lg border border-[#E2E8F0] dark:border-[#334155] text-[#64748B] hover:border-[#4A9B7F] hover:text-[#4A9B7F] disabled:opacity-40 transition-all"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Profile drawer */}
      <StudentProfileDrawer
        student={profileStudent}
        open={!!profileStudent}
        onClose={() => setProfileStudent(null)}
      />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────
export default function StudentsClient({ data }: { data: StudentsData }) {
  const [activeTab, setActiveTab] = useState(0);

  const section = data.sections[activeTab];

  return (
    <>
      <style>{`.font-nunito { font-family: var(--font-nunito,'Nunito',sans-serif); }`}</style>

      {data.sections.length === 0 ? (
        <div className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl p-10 text-center">
          <p className="text-[#64748B] dark:text-[#94A3B8] text-sm">No sections assigned yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Section tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {data.sections.map((sec, i) => (
              <button
                key={sec.sectionId}
                onClick={() => setActiveTab(i)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap border transition-all",
                  activeTab === i
                    ? "border-[#4A9B7F] bg-[#D1FAE5] dark:bg-[#063c28] text-[#4A9B7F]"
                    : "border-[#E2E8F0] dark:border-[#334155] text-[#64748B] dark:text-[#94A3B8] hover:border-[#4A9B7F] hover:text-[#4A9B7F] bg-white dark:bg-[#1E293B]"
                )}
              >
                <span>{sec.sectionEmoji}</span>
                <span>{sec.sectionName}</span>
                <span className={cn(
                  "text-[10px] font-extrabold px-1.5 py-0.5 rounded-full",
                  activeTab === i
                    ? "bg-[#4A9B7F] text-white"
                    : "bg-[#EEF2F8] dark:bg-[#162032] text-[#64748B]"
                )}>
                  {sec.students.length}
                </span>
              </button>
            ))}
          </div>

          {/* Active section info + table */}
          {section && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-[#94A3B8]">
                  {section.gradeLevel} · {section.students.length} student{section.students.length !== 1 ? "s" : ""}
                </span>
              </div>
              <SectionTable students={section.students} />
            </div>
          )}
        </div>
      )}
    </>
  );
}
