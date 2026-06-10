// app/dashboard/teacher/modules/_components/TeacherModulesClient.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import TeacherSidebar from "../../_components/TeacherSidebar";
import Link from "next/link";
import type {
  TeacherModulesData,
  TeacherSectionOption,
  ModuleData,
  StudentRow,
  ModuleStatusType,
  LibraryModuleItem,
  ContextItem,
  ModuleTestData,
  ModuleTestStudentRow,
  LinkedTest,
  SectionCompletion,
} from "../page";

// ─── TYPES ────────────────────────────────────────────────────
type FilterKey   = "all" | ModuleStatusType;
type TabKey      = "assigned" | "library" | "results";
type AssignTarget = { dbId: number; title: string };

// Strip HTML tags for plain-text search matching
function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

// ─── STAT CARD ────────────────────────────────────────────────
function StatCard({
  icon, value, label, delta, deltaUp, color, iconBg,
}: {
  icon: string; value: string; label: string;
  delta?: string; deltaUp?: boolean; color: string; iconBg: string;
}) {
  return (
    <div className="relative bg-white dark:bg-[#132018] border border-[#DDE8DF] dark:border-[#1E3524] rounded-2xl p-5 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: color }} />
      <div className="w-9 h-9 rounded-[9px] flex items-center justify-center text-base mb-2.5" style={{ background: iconBg }}>
        {icon}
      </div>
      <div className="font-nunito text-[26px] font-black">{value}</div>
      <div className="text-xs text-[#5A7860] dark:text-[#7BAF84] mt-0.5">{label}</div>
      {delta && (
        <div className={cn("text-[11px] font-semibold mt-1.5", deltaUp ? "text-[#22C55E]" : "text-[#E05C5C]")}>
          {delta}
        </div>
      )}
    </div>
  );
}

// ─── STUDENT AVATAR ───────────────────────────────────────────
const STATUS_RING: Record<string, string> = {
  done:     "border-[#4A9B7F] bg-[#D1FAE5] dark:bg-[#064e35]",
  inprog:   "border-[#F59E0B] bg-[#FEF3C7] dark:bg-[#3d2800]",
  stuck:    "border-[#E05C5C] bg-[#FEE2E2] dark:bg-[#450a0a]",
  notstart: "border-[#DDE8DF] dark:border-[#1E3524] bg-[#EBF0EC] dark:bg-[#0A180E]",
};

function StudentAvatar({
  s, onOpen,
}: {
  s: StudentRow;
  onOpen: (s: StudentRow) => void;
}) {
  return (
    <button
      onClick={() => s.drawerData && onOpen(s)}
      className="flex flex-col items-center gap-1 group"
      title={s.name}
    >
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center text-[15px] border-2 transition-all relative",
        STATUS_RING[s.status],
        s.drawerData && "group-hover:scale-110 cursor-pointer"
      )}>
        {s.emoji}
        <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-white dark:bg-[#132018] border border-[#DDE8DF] dark:border-[#1E3524] text-[8px] font-black font-nunito flex items-center justify-center">
          {s.stage}
        </span>
      </div>
      <span className="text-[9px] text-[#5A7860] dark:text-[#7BAF84] font-semibold max-w-[40px] truncate">
        {s.short}
      </span>
    </button>
  );
}

// ─── CLUSTER CELL ─────────────────────────────────────────────
function ClusterCell({ icon, label, pct, quality }: {
  icon: string; label: string; pct: number; quality: "good" | "fair" | "weak";
}) {
  const cls = {
    good: "bg-[#D1FAE5] dark:bg-[#064e35] border-[#4A9B7F] text-[#4A9B7F]",
    fair: "bg-[#FEF3C7] dark:bg-[#3d2800] border-[#F59E0B] text-[#F59E0B]",
    weak: "bg-[#FEE2E2] dark:bg-[#450a0a] border-[#E05C5C] text-[#E05C5C]",
  }[quality];

  return (
    <div className={cn("px-2.5 py-2.5 rounded-xl text-center border", cls)}>
      <div className="text-sm mb-1">{icon}</div>
      <div className="font-nunito text-[15px] font-black">{pct > 0 ? `${pct}%` : "—"}</div>
      <div className="text-[10px] font-semibold text-[#5A7860] dark:text-[#7BAF84] mt-0.5">{label}</div>
    </div>
  );
}

// ─── MODULE CARD ──────────────────────────────────────────────
function ModuleCard({
  mod, onOpenDrawer, onOpenAssign, onEdit, onViewReports, onGrade, onArchive,
}: {
  mod: ModuleData;
  onOpenDrawer:  (s: StudentRow) => void;
  onOpenAssign:  (t: AssignTarget) => void;
  onEdit:        (dbId: number) => void;
  onViewReports: (dbId: number) => void;
  onGrade:       () => void;
  onArchive:     (dbId: number) => void;
}) {
  const isActive  = mod.status === "active";
  const isDraft   = mod.status === "draft";

  const statusBadge = {
    active:   <Badge className="bg-[#D1FAE5] dark:bg-[#064e35] text-[#4A9B7F] border border-[#4A9B7F] text-[10px] font-bold tracking-wide uppercase">● Active</Badge>,
    draft:    <Badge className="bg-[#FEF3C7] dark:bg-[#3d2800] text-[#F59E0B] border border-[#F59E0B] text-[10px] font-bold tracking-wide uppercase">◐ Draft</Badge>,
    archived: <Badge className="bg-[#EBF0EC] dark:bg-[#0A180E] text-[#92A894] border border-[#DDE8DF] text-[10px] font-bold tracking-wide uppercase">✦ Archived</Badge>,
  }[mod.status];

  const headerGrad = isActive
    ? "from-[rgba(74,155,127,0.08)] to-[rgba(59,130,196,0.06)]"
    : isDraft
    ? "from-[rgba(139,92,246,0.06)] to-[rgba(245,158,11,0.06)]"
    : "from-[rgba(148,163,184,0.06)] to-transparent";

  return (
    <div className={cn(
      "bg-white dark:bg-[#132018] border-[1.5px] border-[#DDE8DF] dark:border-[#1E3524] rounded-[20px] overflow-hidden shadow-sm hover:shadow-[0_12px_48px_rgba(74,155,127,0.18)] transition-all",
      mod.wide && "lg:col-span-2"
    )}>
      {/* Banner image */}
      {mod.bannerUrl && (
        <div className="relative w-full h-32 overflow-hidden">
          <img src={mod.bannerUrl} alt={`${mod.title} banner`} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>
      )}

      {/* Header */}
      <div className={cn(
        "flex items-center gap-4 px-6 py-5 border-b border-[#DDE8DF] dark:border-[#1E3524] bg-gradient-to-r",
        headerGrad
      )}>
        <div
          className="w-[52px] h-[52px] rounded-[14px] flex items-center justify-center text-[26px] shrink-0"
          style={{ background: mod.contextColor + "22" }}
        >
          {mod.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold tracking-[0.1em] uppercase mb-1" style={{ color: mod.contextColor }}>
            {mod.context}
          </p>
          <h3 className="font-nunito text-base font-black leading-tight truncate">{mod.title}</h3>
          <p className="text-xs text-[#5A7860] dark:text-[#7BAF84] mt-0.5">{mod.duration}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          {statusBadge}
          <span className="text-[11px] text-[#5A7860] dark:text-[#7BAF84] font-semibold">{mod.dueTag}</span>
        </div>
      </div>

      {/* Body */}
      <div className={cn("p-4 md:p-6", mod.wide && "lg:grid lg:grid-cols-2 lg:gap-6 lg:items-start")}>
        <div>
          {/* Scenario — rendered as rich text */}
          <div
            className="text-[13px] text-[#5A7860] dark:text-[#7BAF84] leading-relaxed mb-5 p-3.5 bg-[#EBF0EC] dark:bg-[#0A180E] rounded-xl border-l-[3px] prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 line-clamp-4"
            style={{ borderColor: mod.scenarioBorder }}
            dangerouslySetInnerHTML={{ __html: mod.scenario }}
          />

          {/* Draft tags */}
          {isDraft && mod.tags && mod.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {mod.tags.map((t) => (
                <span key={t} className="text-xs font-semibold px-3 py-1 rounded-full border border-[#DDE8DF] dark:border-[#1E3524] bg-[#EBF0EC] dark:bg-[#0A180E] text-[#5A7860] dark:text-[#7BAF84]">
                  {t}
                </span>
              ))}
            </div>
          )}

          {/* Completion bar — overall */}
          {isActive && mod.completion.total > 0 && (
            <div className="mb-5">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-bold">Class Completion</span>
                <span className="font-nunito text-sm font-black" style={{ color: mod.contextColor }}>
                  {mod.completion.pct}% ({mod.completion.done}/{mod.completion.total})
                </span>
              </div>
              <div className="flex h-2.5 rounded-full overflow-hidden mb-1.5">
                <div className="h-full bg-[#4A9B7F]" style={{ width: `${(mod.completion.done  / mod.completion.total) * 100}%` }} />
                <div className="h-full bg-[#F59E0B]" style={{ width: `${(mod.completion.inprog / mod.completion.total) * 100}%` }} />
                <div className="h-full bg-[#DDE8DF] dark:bg-[#1E3524]" style={{ width: `${(mod.completion.notstart / mod.completion.total) * 100}%` }} />
              </div>
              <div className="flex gap-3.5 flex-wrap mb-3">
                {[
                  ["#4A9B7F", `${mod.completion.done} Completed`],
                  ["#F59E0B", `${mod.completion.inprog} In Progress`],
                  ["#DDE8DF", `${mod.completion.notstart} Not Started`],
                ].map(([c, l]) => (
                  <span key={l} className="flex items-center gap-1 text-[11px] text-[#5A7860] dark:text-[#7BAF84]">
                    <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: c }} />{l}
                  </span>
                ))}
              </div>

              {/* Per-section breakdown (only when > 1 section) */}
              {mod.sectionCompletion.length > 1 && (
                <div className="space-y-2 border-t border-[#DDE8DF] dark:border-[#1E3524] pt-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#92A894]">By Section</p>
                  {mod.sectionCompletion.map((sec) => (
                    <div key={sec.sectionId}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-semibold text-[#5A7860] dark:text-[#7BAF84]">
                          {sec.sectionEmoji} {sec.sectionName}
                        </span>
                        <span className="text-[11px] font-bold" style={{ color: sec.pct >= 80 ? "#4A9B7F" : sec.pct >= 40 ? "#F59E0B" : "#E05C5C" }}>
                          {sec.pct}% · {sec.done}/{sec.total}
                        </span>
                      </div>
                      <div className="flex h-1.5 rounded-full overflow-hidden bg-[#EBF0EC] dark:bg-[#0A180E]">
                        {sec.total > 0 && (
                          <>
                            <div className="h-full bg-[#4A9B7F]" style={{ width: `${(sec.done    / sec.total) * 100}%` }} />
                            <div className="h-full bg-[#F59E0B]" style={{ width: `${(sec.inprog  / sec.total) * 100}%` }} />
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Per-section completion when only 1 section (single section, still show detail) */}
          {isActive && mod.completion.total > 0 && mod.sectionCompletion.length === 1 && (
            <div className="flex items-center gap-2 -mt-3 mb-4 text-[11px] text-[#5A7860] dark:text-[#7BAF84]">
              <span>{mod.sectionCompletion[0].sectionEmoji}</span>
              <span className="font-semibold">{mod.sectionCompletion[0].sectionName}</span>
              <span className="ml-auto text-[10px] text-[#92A894]">
                {mod.sectionCompletion[0].done} done · {mod.sectionCompletion[0].inprog} in progress · {mod.sectionCompletion[0].notstart} not started
              </span>
            </div>
          )}

          {/* Student avatars */}
          {isActive && mod.students.length > 0 && (
            <>
              <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-[#92A894] mb-2.5">
                Students (click to inspect)
              </p>
              <div className="grid grid-cols-6 gap-1.5 mb-3">
                {mod.students.slice(0, 11).map((s) => (
                  <StudentAvatar key={s.name} s={s} onOpen={onOpenDrawer} />
                ))}
                {mod.students.length > 11 && (
                  <div className="flex flex-col items-center gap-1 opacity-50">
                    <div className="w-8 h-8 rounded-full bg-[#EBF0EC] dark:bg-[#0A180E] border-2 border-[#DDE8DF] dark:border-[#1E3524] flex items-center justify-center text-[11px] text-[#92A894] font-bold">
                      +{mod.students.length - 11}
                    </div>
                    <span className="text-[9px] text-[#92A894]">more</span>
                  </div>
                )}
              </div>
              {/* Legend */}
              <div className="flex gap-3 flex-wrap mb-5">
                {[
                  ["#4A9B7F","Completed"],
                  ["#F59E0B","In Progress"],
                  ["#E05C5C","Struggling"],
                  ["#DDE8DF","Not Started"],
                ].map(([c, l]) => (
                  <span key={l} className="flex items-center gap-1.5 text-[11px] text-[#5A7860] dark:text-[#7BAF84] font-semibold">
                    <span className="w-2 h-2 rounded-full" style={{ background: c }} />{l}
                  </span>
                ))}
              </div>
            </>
          )}

          {/* Clusters */}
          {isActive && mod.clusters.length > 0 && (
            <>
              <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-[#92A894] mb-2.5">
                Class Diagnostic Averages
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                {mod.clusters.map((c) => (
                  <ClusterCell key={c.label} {...c} />
                ))}
              </div>
            </>
          )}

          {/* Insight */}
          <div className={cn(
            "px-3.5 py-2.5 rounded-xl text-[13px] font-semibold",
            mod.insight.type === "good"
              ? "bg-[#D1FAE5] dark:bg-[#064e35] text-[#4A9B7F]"
              : "bg-[#FEE2E2] dark:bg-[#450a0a] text-[#E05C5C]"
          )}>
            {mod.insight.text}
          </div>
        </div>

        {/* Draft checklist */}
        {isDraft && mod.checklist && (
          <div>
            <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-[#92A894] mb-3">
              Module Checklist
            </p>
            <div className="flex flex-col gap-2">
              {mod.checklist.map((item) => (
                <div
                  key={item.label}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2.5 rounded-xl border",
                    item.done
                      ? "bg-[#D1FAE5] dark:bg-[#064e35] border-[#4A9B7F]"
                      : "bg-[#FEF3C7] dark:bg-[#3d2800] border-[#F59E0B]"
                  )}
                >
                  <span>{item.done ? "✅" : "⏳"}</span>
                  <span className={cn("text-[13px] font-semibold", !item.done && "text-[#F59E0B]")}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Pre/Post test links */}
      <div className="flex items-center gap-2 px-4 md:px-6 py-3 border-t border-[#DDE8DF] dark:border-[#1E3524] flex-wrap bg-[#F4F7F5] dark:bg-[#0D1F12]">
        <span className="text-[11px] font-bold text-[#5A7860] dark:text-[#7BAF84] uppercase tracking-widest mr-1">Tests</span>
        {mod.preTest ? (
          <Link
            href={`/dashboard/teacher/tests/${mod.preTest.id}/edit`}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all",
              mod.preTest.isActive
                ? "border-[#3B82C4] bg-[#DBEAFE] dark:bg-[#1e3a5f] text-[#3B82C4] hover:bg-[#3B82C4] hover:text-white"
                : "border-[#DDE8DF] dark:border-[#1E3524] text-[#5A7860] hover:border-[#3B82C4] hover:text-[#3B82C4]"
            )}
          >
            📋 Pre: {mod.preTest.title}
            {!mod.preTest.isActive && <span className="ml-1 opacity-60">(inactive)</span>}
          </Link>
        ) : (
          <Link
            href={`/dashboard/teacher/tests/create?type=PRE_TEST&moduleId=${mod.dbId}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border border-dashed border-[#DDE8DF] dark:border-[#1E3524] text-[#92A894] hover:border-[#3B82C4] hover:text-[#3B82C4] transition-all"
          >
            + Link pre-test
          </Link>
        )}
        {mod.postTest ? (
          <Link
            href={`/dashboard/teacher/tests/${mod.postTest.id}/edit`}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all",
              mod.postTest.isActive
                ? "border-[#8B5CF6] bg-[#EDE9FE] dark:bg-[#2e1065] text-[#8B5CF6] hover:bg-[#8B5CF6] hover:text-white"
                : "border-[#DDE8DF] dark:border-[#1E3524] text-[#5A7860] hover:border-[#8B5CF6] hover:text-[#8B5CF6]"
            )}
          >
            ✅ Post: {mod.postTest.title}
            {!mod.postTest.isActive && <span className="ml-1 opacity-60">(inactive)</span>}
          </Link>
        ) : (
          <Link
            href={`/dashboard/teacher/tests/create?type=POST_TEST&moduleId=${mod.dbId}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border border-dashed border-[#DDE8DF] dark:border-[#1E3524] text-[#92A894] hover:border-[#8B5CF6] hover:text-[#8B5CF6] transition-all"
          >
            + Link post-test
          </Link>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 px-4 md:px-6 py-4 border-t border-[#DDE8DF] dark:border-[#1E3524] flex-wrap">
        {isActive ? (
          <>
            <button
              onClick={() => onViewReports(mod.dbId)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#4A9B7F] text-white text-xs font-nunito font-bold hover:bg-[#2E7A60] transition-all">
              📊 View Reports
            </button>
            <button
              onClick={onGrade}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#EBF0EC] dark:bg-[#0A180E] text-[#5A7860] dark:text-[#7BAF84] border border-[#DDE8DF] dark:border-[#1E3524] text-xs font-nunito font-bold hover:border-[#4A9B7F] hover:text-[#4A9B7F] transition-all">
              ✍️ Grade Items {mod.gradeCount > 0 && `(${mod.gradeCount})`}
            </button>
            <button
              onClick={() => onOpenAssign({ dbId: mod.dbId, title: mod.title })}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#FEF3C7] dark:bg-[#3d2800] text-[#F59E0B] border border-[#F59E0B] text-xs font-nunito font-bold hover:bg-[#F59E0B] hover:text-black transition-all"
            >
              📋 Edit Assignment
            </button>
            <button
              onClick={() => onEdit(mod.dbId)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#EBF0EC] dark:bg-[#0A180E] text-[#5A7860] border border-[#DDE8DF] dark:border-[#1E3524] text-xs font-nunito font-bold hover:border-[#4A9B7F] hover:text-[#4A9B7F] transition-all">
              ✏️ Edit Module
            </button>
            <button
              onClick={() => onArchive(mod.dbId)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#FEE2E2] dark:bg-[#450a0a] text-[#E05C5C] border border-[#E05C5C] text-xs font-nunito font-bold hover:bg-[#E05C5C] hover:text-white transition-all ml-auto">
              🗄 Archive
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => onOpenAssign({ dbId: mod.dbId, title: mod.title })}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#4A9B7F] text-white text-xs font-nunito font-bold hover:bg-[#2E7A60] transition-all"
            >
              ＋ Assign to Section
            </button>
            <button
              onClick={() => onEdit(mod.dbId)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#EBF0EC] dark:bg-[#0A180E] text-[#5A7860] border border-[#DDE8DF] dark:border-[#1E3524] text-xs font-nunito font-bold hover:border-[#4A9B7F] hover:text-[#4A9B7F] transition-all">
              ✏️ Edit Module
            </button>
            <button
              onClick={() => onArchive(mod.dbId)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#FEE2E2] dark:bg-[#450a0a] text-[#E05C5C] border border-[#E05C5C] text-xs font-nunito font-bold hover:bg-[#E05C5C] hover:text-white transition-all ml-auto">
              🗑 Delete Draft
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── ASSIGN MODAL ─────────────────────────────────────────────
function AssignModal({
  open, mod, onClose, sections,
}: {
  open: boolean;
  mod: AssignTarget | null;
  onClose: () => void;
  sections: TeacherSectionOption[];
}) {
  const [checked, setChecked]   = useState<string[]>(sections.map((s) => s.name));
  const [dueDate, setDueDate]   = useState("");
  const [unlock,  setUnlock]    = useState("no-requirement");
  const [loading, setLoading]   = useState(false);
  const [error,   setError]     = useState<string | null>(null);
  const router = useRouter();

  const toggle = (v: string) =>
    setChecked((prev) => prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]);

  const handleAssign = async () => {
    if (!mod || checked.length === 0) {
      setError("Please select at least one section.");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/teacher/modules/assign", {
        method:      "POST",
        headers:     { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          moduleId:    mod.dbId,
          sections:    checked,
          dueDate:     dueDate || null,
          unlockAfter: unlock === "no-requirement" ? null : parseInt(unlock),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error ?? "Failed to assign module.");
        setLoading(false);
        return;
      }

      onClose();
      router.refresh(); // re-fetch server data
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-[560px] bg-white dark:bg-[#132018] border border-[#DDE8DF] dark:border-[#1E3524] rounded-3xl p-9 shadow-[0_12px_48px_rgba(74,155,127,0.18)]">
        <DialogTitle className="sr-only">Assign Module</DialogTitle>

        <div className="text-4xl mb-3">📋</div>
        <h2 className="font-nunito text-xl font-black mb-1.5">Assign Module to Section</h2>
        <p className="text-sm text-[#5A7860] dark:text-[#7BAF84] mb-2 leading-relaxed">
          Assigning: <strong>{mod?.title}</strong>
        </p>
        <p className="text-sm text-[#5A7860] dark:text-[#7BAF84] mb-6 leading-relaxed">
          Students will see this in their My Modules page immediately.
        </p>

        {/* Section checkboxes */}
        <div className="flex flex-col gap-1.5 mb-4">
          <label className="text-[11px] font-bold tracking-[0.08em] uppercase text-[#5A7860] dark:text-[#7BAF84]">
            🛡️ Assign to Sections
          </label>
          <div className="grid grid-cols-2 gap-2">
            {sections.map((s) => (
              <button
                key={s.name}
                type="button"
                onClick={() => toggle(s.name)}
                className={cn(
                  "flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border-[1.5px] transition-all text-sm font-bold",
                  checked.includes(s.name)
                    ? "border-[#4A9B7F] bg-[#D1FAE5] dark:bg-[#064e35]"
                    : "border-[#DDE8DF] dark:border-[#1E3524] bg-[#EBF0EC] dark:bg-[#0A180E] text-[#5A7860] dark:text-[#7BAF84] hover:border-[#4A9B7F]"
                )}
              >
                <div className={cn(
                  "w-[18px] h-[18px] rounded-[5px] border-2 flex items-center justify-center text-xs font-black flex-shrink-0",
                  checked.includes(s.name)
                    ? "bg-[#4A9B7F] border-[#4A9B7F] text-white"
                    : "border-[#DDE8DF] dark:border-[#1E3524]"
                )}>
                  {checked.includes(s.name) ? "✓" : ""}
                </div>
                {s.emoji} {s.name}
              </button>
            ))}
          </div>
        </div>

        {/* Due date + unlock */}
        <div className="grid grid-cols-2 gap-3.5 mb-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold tracking-[0.08em] uppercase text-[#5A7860] dark:text-[#7BAF84]">
              📅 Due Date
            </label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="bg-[#EBF0EC] dark:bg-[#0A180E] border-[#DDE8DF] dark:border-[#1E3524] focus-visible:ring-[#4A9B7F]/30 focus-visible:border-[#4A9B7F] rounded-xl h-11"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold tracking-[0.08em] uppercase text-[#5A7860] dark:text-[#7BAF84]">
              🔒 Unlock After
            </label>
            <select
              value={unlock}
              onChange={(e) => setUnlock(e.target.value)}
              className="w-full px-3.5 py-[11px] rounded-xl border border-[#DDE8DF] dark:border-[#1E3524] bg-[#EBF0EC] dark:bg-[#0A180E] text-sm focus:outline-none focus:border-[#4A9B7F]"
            >
              <option value="no-requirement">No requirement</option>
              <option value="1">1 completed module</option>
              <option value="2">2 completed modules</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-4 px-3.5 py-2.5 bg-[#FEE2E2] dark:bg-[#450a0a] rounded-xl text-sm text-[#E05C5C] font-semibold">
            ⚠️ {error}
          </div>
        )}

        <div className="flex gap-2.5">
          <button
            onClick={handleAssign}
            disabled={loading}
            className="flex-1 py-3.5 rounded-xl bg-[#4A9B7F] text-white font-nunito font-extrabold text-sm hover:bg-[#2E7A60] shadow-[0_4px_14px_rgba(74,155,127,0.3)] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? "⏳ Assigning…" : "✅ Assign Module"}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3.5 rounded-xl bg-[#EBF0EC] dark:bg-[#0A180E] text-[#5A7860] dark:text-[#7BAF84] border border-[#DDE8DF] dark:border-[#1E3524] font-nunito font-extrabold text-sm hover:border-[#4A9B7F] hover:text-[#4A9B7F] transition-all flex items-center justify-center"
          >
            Cancel
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── STUDENT DRAWER ───────────────────────────────────────────
function StudentDrawer({
  open, student, onClose,
}: {
  open: boolean; student: StudentRow | null; onClose: () => void;
}) {
  const d = student?.drawerData;
  const router = useRouter();
  if (!d) return null;

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent
        side="right"
        className="w-[420px] max-w-full bg-white dark:bg-[#132018] border-l border-[#DDE8DF] dark:border-[#1E3524] p-0 overflow-y-auto"
      >
        <SheetTitle className="sr-only">{student?.name}</SheetTitle>

        {/* Header */}
        <div className="flex items-center gap-3.5 px-6 py-5 border-b border-[#DDE8DF] dark:border-[#1E3524] sticky top-0 bg-white dark:bg-[#132018] z-10">
          <span className="text-4xl">{student?.emoji}</span>
          <div className="flex-1">
            <h3 className="font-nunito text-lg font-black">{student?.name}</h3>
            <p className="text-[13px] text-[#5A7860] dark:text-[#7BAF84]">
              Stage {d.stage} · {d.score} overall
            </p>
          </div>
        </div>

        <div className="px-6 py-5 flex flex-col gap-5">
          {/* Stats */}
          <div>
            <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-[#92A894] mb-2.5">Overview</p>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { val: d.stage, label: "Current Stage", color: "#F59E0B" },
                { val: d.score, label: "Score So Far",  color: "#4A9B7F" },
                { val: d.time,  label: "Time Spent",    color: undefined  },
              ].map((s) => (
                <div key={s.label} className="bg-[#EBF0EC] dark:bg-[#0A180E] border border-[#DDE8DF] dark:border-[#1E3524] rounded-xl px-3 py-3.5 text-center">
                  <div className="font-nunito text-[22px] font-black" style={{ color: s.color }}>{s.val}</div>
                  <div className="text-[11px] text-[#5A7860] dark:text-[#7BAF84] mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Clusters */}
          <div>
            <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-[#92A894] mb-2.5">Diagnostic Clusters</p>
            <div className="flex flex-col gap-2.5">
              {d.clusters.map((c) => (
                <div key={c.label} className="flex items-center gap-2.5">
                  <span className="text-[13px] font-semibold w-[120px] flex-shrink-0">{c.label}</span>
                  <div className="flex-1 h-2 bg-[#DDE8DF] dark:bg-[#1E3524] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${c.pct}%`, background: c.color }} />
                  </div>
                  <span className="text-[12px] font-extrabold w-8 text-right" style={{ color: c.color }}>
                    {c.pct > 0 ? `${c.pct}%` : "—"}
                  </span>
                  <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0", c.badgeCls)}>
                    {c.badge}
                  </span>
                </div>
              ))}
            </div>
            {d.alert && (
              <div className="mt-3 px-3.5 py-2.5 bg-[#FEE2E2] dark:bg-[#450a0a] rounded-xl text-[13px] text-[#E05C5C] font-semibold">
                {d.alert}
              </div>
            )}
          </div>

          {/* Stage list */}
          <div>
            <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-[#92A894] mb-2.5">Stage Progress</p>
            <div className="flex flex-col gap-1.5">
              {d.stages.map((s) => (
                <div
                  key={s.num}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2.5 rounded-xl border",
                    s.status === "done"    && "bg-[#D1FAE5] dark:bg-[#064e35] border-[#4A9B7F]",
                    s.status === "current" && "bg-[#FEF3C7] dark:bg-[#3d2800] border-[#F59E0B]",
                    s.status === "pending" && "bg-[#EBF0EC] dark:bg-[#0A180E] border-[#DDE8DF] dark:border-[#1E3524]",
                  )}
                >
                  <div className={cn(
                    "w-[26px] h-[26px] rounded-full flex items-center justify-center text-[11px] font-black font-nunito flex-shrink-0",
                    s.status === "done"    && "bg-[#4A9B7F] text-white",
                    s.status === "current" && "bg-[#F59E0B] text-black",
                    s.status === "pending" && "bg-[#DDE8DF] dark:bg-[#1E3524] text-[#92A894]",
                  )}>
                    {s.num}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-bold truncate">{s.title}</p>
                    <span className="text-[11px] text-[#5A7860] dark:text-[#7BAF84]">{s.sub}</span>
                  </div>
                  <span className={cn(
                    "text-[12px] font-extrabold flex-shrink-0",
                    s.status === "done"    && "text-[#4A9B7F]",
                    s.status === "current" && "text-[#F59E0B]",
                    s.status === "pending" && "text-[#92A894]",
                  )}>
                    {s.score}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2.5">
            <Button
              onClick={() => { onClose(); router.push(`/dashboard/teacher/reports/${student?.userId}`); }}
              className="flex-1 bg-[#4A9B7F] hover:bg-[#2E7A60] text-white font-nunito font-bold text-sm shadow-[0_4px_14px_rgba(74,155,127,0.3)]">
              📊 Full Report
            </Button>
            <Button
              onClick={() => { onClose(); router.push("/dashboard/teacher/grade"); }}
              variant="outline" className="flex-1 font-nunito font-bold text-sm border-[#DDE8DF] dark:border-[#1E3524] text-[#5A7860] hover:border-[#4A9B7F] hover:text-[#4A9B7F]">
              ✍️ Grade Open Items
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── LIBRARY CARD ─────────────────────────────────────────────
function LibraryCard({
  mod, onAssign, onActivate, onViewProgress,
}: {
  mod: LibraryModuleItem;
  onAssign:       (t: AssignTarget) => void;
  onActivate:     (id: number) => void;
  onViewProgress: () => void;
}) {
  const isDraft = mod.status === "draft";

  return (
    <div className={cn(
      "bg-white dark:bg-[#132018] border rounded-[18px] overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col",
      isDraft
        ? "border-[#F59E0B]/40 dark:border-[#F59E0B]/30"
        : "border-[#DDE8DF] dark:border-[#1E3524]"
    )}>
      {/* Banner image */}
      {mod.bannerUrl ? (
        <div className="relative w-full h-24 overflow-hidden">
          <img src={mod.bannerUrl} alt={`${mod.title} banner`} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-[3px]" style={{ background: isDraft ? "#F59E0B" : mod.contextColor }} />
        </div>
      ) : (
        /* Status bar (only when no banner) */
        <div className="h-[3px]" style={{ background: isDraft ? "#F59E0B" : mod.contextColor }} />
      )}

      {/* Header */}
      <div className="flex items-start gap-3 px-5 pt-4 pb-3 border-b border-[#DDE8DF] dark:border-[#1E3524]">
        <div
          className="w-10 h-10 rounded-[10px] flex items-center justify-center text-xl shrink-0"
          style={{ background: mod.contextColor + "22" }}
        >
          {mod.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold tracking-[0.1em] uppercase mb-0.5" style={{ color: mod.contextColor }}>
            {mod.context}
          </p>
          <h3 className="font-nunito text-sm font-black leading-snug line-clamp-2">{mod.title}</h3>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0 ml-1">
          {isDraft
            ? <Badge className="bg-[#FEF3C7] dark:bg-[#3d2800] text-[#F59E0B] border border-[#F59E0B] text-[10px] font-bold">◐ Draft</Badge>
            : <Badge className="bg-[#D1FAE5] dark:bg-[#064e35] text-[#4A9B7F] border border-[#4A9B7F] text-[10px] font-bold">● Active</Badge>
          }
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-3 flex-1 flex flex-col gap-2.5">
        {isDraft && (
          <div className="flex items-center gap-2 px-3 py-2 bg-[#FEF3C7] dark:bg-[#3d2800] rounded-lg border border-[#F59E0B]/30 text-[11px] font-semibold text-[#92400E] dark:text-[#F59E0B]">
            ◐ Draft — activate to make available to students
          </div>
        )}
        {/* Scenario rendered as rich text */}
        <div
          className="text-[12px] text-[#5A7860] dark:text-[#7BAF84] leading-relaxed line-clamp-3 italic prose prose-sm max-w-none prose-p:my-0.5"
          dangerouslySetInnerHTML={{ __html: mod.scenario }}
        />

        {mod.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {mod.tags.slice(0, 3).map((t) => (
              <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-[#EBF0EC] dark:bg-[#0A180E] text-[#5A7860] dark:text-[#7BAF84] border border-[#DDE8DF] dark:border-[#1E3524]">
                {t}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 mt-auto pt-1 text-[11px] text-[#92A894]">
          <span>⏱ ~{mod.timeEstimate} min</span>
          <span>📋 12 stages</span>
          {mod.dueDate && <span className="text-[#F59E0B] font-semibold">📅 Due {mod.dueDate}</span>}
          <span className="ml-auto">{mod.createdAt}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 px-5 py-3 border-t border-[#DDE8DF] dark:border-[#1E3524]">
        {isDraft ? (
          <>
            <button
              onClick={() => onActivate(mod.id)}
              className="flex-1 py-2 rounded-lg bg-[#4A9B7F] text-white text-xs font-nunito font-bold hover:bg-[#2E7A60] shadow-[0_4px_14px_rgba(74,155,127,0.2)] transition-all"
            >
              ✅ Activate Module
            </button>
            <button
              onClick={() => onAssign({ dbId: mod.id, title: mod.title })}
              className="py-2 px-3.5 rounded-lg bg-[#EBF0EC] dark:bg-[#0A180E] text-[#5A7860] border border-[#DDE8DF] dark:border-[#1E3524] text-xs font-nunito font-bold hover:border-[#4A9B7F] hover:text-[#4A9B7F] transition-all"
            >
              📋 Assign
            </button>
          </>
        ) : (
          <>
            <button
              onClick={onViewProgress}
              className="flex-1 py-2 rounded-lg bg-[#EBF0EC] dark:bg-[#0A180E] text-[#5A7860] dark:text-[#7BAF84] border border-[#DDE8DF] dark:border-[#1E3524] text-xs font-nunito font-bold hover:border-[#4A9B7F] hover:text-[#4A9B7F] transition-all">
              📊 View Progress
            </button>
            <button
              onClick={() => onAssign({ dbId: mod.id, title: mod.title })}
              className="flex-1 py-2 rounded-lg bg-[#FEF3C7] dark:bg-[#3d2800] text-[#F59E0B] border border-[#F59E0B] text-xs font-nunito font-bold hover:bg-[#F59E0B] hover:text-black transition-all"
            >
              📋 Edit Assignment
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── LIBRARY VIEW ──────────────────────────────────────────────
function LibraryView({
  library, contexts, onAssign, onActivate, onViewProgress,
}: {
  library: LibraryModuleItem[];
  contexts: ContextItem[];
  onAssign:       (t: AssignTarget) => void;
  onActivate:     (id: number) => void;
  onViewProgress: () => void;
}) {
  const [search,    setSearch]    = useState("");
  const [ctxFilter, setCtxFilter] = useState("all");
  const [showOnly,  setShowOnly]  = useState<"all" | "active" | "draft">("all");

  const filtered = library.filter((m) => {
    const q = search.toLowerCase();
    const matchSearch = !q || m.title.toLowerCase().includes(q) || stripHtml(m.scenario).toLowerCase().includes(q);
    const matchCtx    = ctxFilter === "all" || m.contextKey === ctxFilter;
    const matchStatus = showOnly === "all"
      || (showOnly === "active" && m.status === "active")
      || (showOnly === "draft"  && m.status === "draft");
    return matchSearch && matchCtx && matchStatus;
  });

  const activeCount = library.filter((m) => m.status === "active").length;
  const draftCount  = library.filter((m) => m.status === "draft").length;

  return (
    <div>
      {/* Summary row */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 mb-5">
        <div className="flex flex-wrap gap-2">
          {(["all","active","draft"] as const).map((key) => {
            const labels = {
              all:    `📦 ${library.length} Total`,
              active: `✅ ${activeCount} Active`,
              draft:  `◐ ${draftCount} Draft`,
            };
            const active = showOnly === key;
            return (
              <button
                key={key}
                onClick={() => setShowOnly(key)}
                className={cn(
                  "font-nunito font-bold text-xs px-3.5 py-1.5 rounded-full border-[1.5px] transition-all",
                  active
                    ? "bg-[#4A9B7F] text-white border-[#4A9B7F]"
                    : "bg-white dark:bg-[#132018] text-[#5A7860] dark:text-[#7BAF84] border-[#DDE8DF] dark:border-[#1E3524] hover:border-[#4A9B7F] hover:text-[#4A9B7F]"
                )}
              >
                {labels[key]}
              </button>
            );
          })}
        </div>
        <div className="relative sm:ml-auto w-full sm:w-auto">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#92A894] pointer-events-none">🔍</span>
          <Input
            placeholder="Search library…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-[13px] bg-white dark:bg-[#132018] border-[#DDE8DF] dark:border-[#1E3524] rounded-xl w-full sm:w-[200px] focus-visible:ring-[#4A9B7F]/30 focus-visible:border-[#4A9B7F]"
          />
        </div>
      </div>

      {/* Context filter chips */}
      {contexts.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setCtxFilter("all")}
            className={cn(
              "font-nunito font-bold text-xs px-3.5 py-1.5 rounded-full border-[1.5px] transition-all",
              ctxFilter === "all"
                ? "bg-[#4A9B7F] text-white border-[#4A9B7F]"
                : "bg-white dark:bg-[#132018] text-[#5A7860] dark:text-[#7BAF84] border-[#DDE8DF] dark:border-[#1E3524] hover:border-[#4A9B7F] hover:text-[#4A9B7F]"
            )}
          >
            All Contexts
          </button>
          {contexts.map((c) => (
            <button
              key={c.key}
              onClick={() => setCtxFilter(ctxFilter === c.key ? "all" : c.key)}
              className={cn(
                "font-nunito font-bold text-xs px-3.5 py-1.5 rounded-full border-[1.5px] transition-all",
                ctxFilter === c.key
                  ? "text-white border-transparent"
                  : "bg-white dark:bg-[#132018] text-[#5A7860] dark:text-[#7BAF84] border-[#DDE8DF] dark:border-[#1E3524] hover:border-[#4A9B7F] hover:text-[#4A9B7F]"
              )}
              style={ctxFilter === c.key ? { background: c.color, borderColor: c.color } : {}}
            >
              {c.icon} {c.label}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {filtered.map((mod) => (
            <LibraryCard key={mod.id} mod={mod} onAssign={onAssign} onActivate={onActivate} onViewProgress={onViewProgress} />
          ))}
        </div>
      ) : library.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-[#DDE8DF] dark:border-[#1E3524] rounded-2xl bg-white dark:bg-[#132018]">
          <div className="text-5xl mb-4">📦</div>
          <h3 className="font-nunito text-lg font-extrabold mb-2">No modules yet</h3>
          <p className="text-sm text-[#5A7860] dark:text-[#7BAF84] mb-4">
            Create a module and it will appear here automatically assigned to your section.
          </p>
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed border-[#DDE8DF] dark:border-[#1E3524] rounded-2xl bg-white dark:bg-[#132018]">
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="font-nunito text-lg font-extrabold mb-2">No modules match</h3>
          <p className="text-sm text-[#5A7860] dark:text-[#7BAF84] mb-4">
            Try a different search, status, or context filter.
          </p>
          <button
            onClick={() => { setSearch(""); setCtxFilter("all"); setShowOnly("all"); }}
            className="font-nunito font-bold text-sm px-5 py-2 rounded-xl border border-[#DDE8DF] dark:border-[#1E3524] text-[#5A7860] dark:text-[#7BAF84] hover:border-[#4A9B7F] hover:text-[#4A9B7F] transition-all"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}

// ─── PRE/POST RESULTS VIEW ────────────────────────────────────
function scoreColor(pct: number | null) {
  if (pct === null) return "text-[#64748B] dark:text-[#94A3B8]";
  if (pct >= 80) return "text-[#4A9B7F]";
  if (pct >= 60) return "text-[#F59E0B]";
  return "text-[#E05C5C]";
}
function scoreBg(pct: number | null) {
  if (pct === null) return "bg-[#EEF2F8] dark:bg-[#0A180E]";
  if (pct >= 80) return "bg-[#D1FAE5] dark:bg-[#064e35]";
  if (pct >= 60) return "bg-[#FEF3C7] dark:bg-[#3d2800]";
  return "bg-[#FEE2E2] dark:bg-[#450a0a]";
}
function gainColor(g: number | null) {
  if (g === null) return "text-[#64748B] dark:text-[#94A3B8]";
  if (g > 0) return "text-[#4A9B7F]";
  if (g < 0) return "text-[#E05C5C]";
  return "text-[#64748B] dark:text-[#94A3B8]";
}
function gainLabel(g: number | null) {
  if (g === null) return "—";
  if (g > 0) return `+${g}%`;
  if (g < 0) return `${g}%`;
  return "±0%";
}

const AVATAR_COLORS_PPR = [
  "bg-[#DBEAFE] dark:bg-[#1e3a5f] text-[#3B82C4]",
  "bg-[#D1FAE5] dark:bg-[#064e35] text-[#4A9B7F]",
  "bg-[#EDE9FE] dark:bg-[#2e1065] text-[#8B5CF6]",
  "bg-[#FEF3C7] dark:bg-[#3d2800] text-[#F59E0B]",
];

function ModuleResultsPanel({ mod }: { mod: ModuleTestData }) {
  const [open, setOpen] = useState(false);

  const hasAnyData = mod.preTakers > 0 || mod.postTakers > 0;

  return (
    <div className="bg-white dark:bg-[#132018] border border-[#DDE8DF] dark:border-[#1E3524] rounded-2xl overflow-hidden shadow-sm">

      {/* Header — always visible, click to expand */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-4 px-6 py-4 hover:bg-[#EBF0EC] dark:hover:bg-[#0A180E] transition-colors text-left"
      >
        <div className="w-10 h-10 rounded-xl bg-[#D1FAE5] dark:bg-[#064e35] flex items-center justify-center text-xl shrink-0">
          {mod.moduleEmoji}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-nunito font-black text-sm truncate">{mod.moduleTitle}</p>
          {/* Test link chips inline */}
          <div className="flex items-center gap-1.5 mt-1 flex-wrap" onClick={(e) => e.stopPropagation()}>
            {mod.preTest ? (
              <Link
                href={`/dashboard/teacher/tests/${mod.preTest.id}/edit`}
                className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#3B82C4] bg-[#DBEAFE] dark:bg-[#1e3a5f] text-[#3B82C4] hover:bg-[#3B82C4] hover:text-white transition-all"
              >
                📋 Pre: {mod.preTest.title}
              </Link>
            ) : (
              <Link
                href={`/dashboard/teacher/tests/create?type=PRE_TEST&moduleId=${mod.moduleId}`}
                className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border border-dashed border-[#DDE8DF] dark:border-[#1E3524] text-[#92A894] hover:border-[#3B82C4] hover:text-[#3B82C4] transition-all"
              >
                + Link pre-test
              </Link>
            )}
            {mod.postTest ? (
              <Link
                href={`/dashboard/teacher/tests/${mod.postTest.id}/edit`}
                className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#8B5CF6] bg-[#EDE9FE] dark:bg-[#2e1065] text-[#8B5CF6] hover:bg-[#8B5CF6] hover:text-white transition-all"
              >
                ✅ Post: {mod.postTest.title}
              </Link>
            ) : (
              <Link
                href={`/dashboard/teacher/tests/create?type=POST_TEST&moduleId=${mod.moduleId}`}
                className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border border-dashed border-[#DDE8DF] dark:border-[#1E3524] text-[#92A894] hover:border-[#8B5CF6] hover:text-[#8B5CF6] transition-all"
              >
                + Link post-test
              </Link>
            )}
          </div>
        </div>

        {/* Summary chips */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
          <span className={cn(
            "text-[11px] font-bold px-2.5 py-1 rounded-full",
            mod.avgPre !== null
              ? scoreBg(mod.avgPre)
              : "bg-[#EBF0EC] dark:bg-[#0A180E] text-[#5A7860] dark:text-[#7BAF84]"
          )}>
            Pre: {mod.avgPre !== null ? `${mod.avgPre}%` : "—"}
          </span>
          <span className={cn(
            "text-[11px] font-bold px-2.5 py-1 rounded-full",
            mod.avgPost !== null
              ? scoreBg(mod.avgPost)
              : "bg-[#EBF0EC] dark:bg-[#0A180E] text-[#5A7860] dark:text-[#7BAF84]"
          )}>
            Post: {mod.avgPost !== null ? `${mod.avgPost}%` : "—"}
          </span>
          {mod.avgGain !== null && (
            <span className={cn("text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#EBF0EC] dark:bg-[#0A180E]", gainColor(mod.avgGain))}>
              {gainLabel(mod.avgGain)} gain
            </span>
          )}
          <span className="text-[#92A894] text-sm ml-1">{open ? "▲" : "▼"}</span>
        </div>
      </button>

      {/* Expandable body */}
      {open && (
        <div className="border-t border-[#DDE8DF] dark:border-[#1E3524]">

          {/* Test set action bar */}
          <div className="flex items-center gap-3 px-6 py-3 bg-[#F4F7F5] dark:bg-[#0D1F12] border-b border-[#DDE8DF] dark:border-[#1E3524] flex-wrap">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#5A7860] dark:text-[#7BAF84]">Tests</span>
            {mod.preTest ? (
              <Link
                href={`/dashboard/teacher/tests/${mod.preTest.id}/edit`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border border-[#3B82C4] bg-[#DBEAFE] dark:bg-[#1e3a5f] text-[#3B82C4] hover:bg-[#3B82C4] hover:text-white transition-all"
              >
                📋 {mod.preTest.title}
                <span className="opacity-70 font-normal">({mod.preTest.questionCount}Q)</span>
                {!mod.preTest.isActive && <span className="ml-1 text-[9px] px-1 py-0.5 rounded bg-[#F59E0B]/20 text-[#F59E0B]">inactive</span>}
              </Link>
            ) : (
              <Link
                href={`/dashboard/teacher/tests/create?type=PRE_TEST&moduleId=${mod.moduleId}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border border-dashed border-[#DDE8DF] dark:border-[#1E3524] text-[#92A894] hover:border-[#3B82C4] hover:text-[#3B82C4] transition-all"
              >
                + Create pre-test
              </Link>
            )}
            {mod.postTest ? (
              <Link
                href={`/dashboard/teacher/tests/${mod.postTest.id}/edit`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border border-[#8B5CF6] bg-[#EDE9FE] dark:bg-[#2e1065] text-[#8B5CF6] hover:bg-[#8B5CF6] hover:text-white transition-all"
              >
                ✅ {mod.postTest.title}
                <span className="opacity-70 font-normal">({mod.postTest.questionCount}Q)</span>
                {!mod.postTest.isActive && <span className="ml-1 text-[9px] px-1 py-0.5 rounded bg-[#F59E0B]/20 text-[#F59E0B]">inactive</span>}
              </Link>
            ) : (
              <Link
                href={`/dashboard/teacher/tests/create?type=POST_TEST&moduleId=${mod.moduleId}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border border-dashed border-[#DDE8DF] dark:border-[#1E3524] text-[#92A894] hover:border-[#8B5CF6] hover:text-[#8B5CF6] transition-all"
              >
                + Create post-test
              </Link>
            )}
          </div>

          {/* Stat row */}
          <div className="grid grid-cols-3 gap-3 px-6 py-4 bg-[#F4F7F5] dark:bg-[#0D1F12]">
            {[
              {
                label: "Avg Pre-Test",
                value: mod.avgPre !== null ? `${mod.avgPre}%` : "—",
                sub:   `${mod.preTakers} of ${mod.students.length} took it`,
                color: "#3B82C4",
              },
              {
                label: "Avg Post-Test",
                value: mod.avgPost !== null ? `${mod.avgPost}%` : "—",
                sub:   `${mod.postTakers} of ${mod.students.length} took it`,
                color: "#8B5CF6",
              },
              {
                label: "Avg Gain",
                value: gainLabel(mod.avgGain),
                sub:   mod.avgGain !== null
                  ? mod.avgGain > 0 ? "Improvement ✓" : mod.avgGain < 0 ? "Regression ⚠" : "No change"
                  : "Not enough data",
                color: mod.avgGain !== null && mod.avgGain >= 0 ? "#4A9B7F" : "#E05C5C",
              },
            ].map(({ label, value, sub, color }) => (
              <div key={label} className="bg-white dark:bg-[#132018] border border-[#DDE8DF] dark:border-[#1E3524] rounded-xl px-4 py-3.5 shadow-sm">
                <div className="font-nunito font-black text-[22px]" style={{ color }}>{value}</div>
                <div className="text-xs font-bold text-[#1A2E1C] dark:text-[#E8F5EB] mt-0.5">{label}</div>
                <div className="text-[11px] text-[#5A7860] dark:text-[#7BAF84] mt-0.5">{sub}</div>
              </div>
            ))}
          </div>

          {/* No data state */}
          {!hasAnyData && (
            <div className="px-6 py-8 text-center text-sm text-[#5A7860] dark:text-[#7BAF84]">
              {(!mod.preTest && !mod.postTest)
                ? "No test sets are linked to this module yet."
                : "No students have taken the tests yet."}
            </div>
          )}

          {/* Student table */}
          {hasAnyData && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-[#EBF0EC] dark:bg-[#0A180E]">
                    {["Student", "Pre-Test", "Post-Test", "Gain", "Pre Taken", "Post Taken"].map((h) => (
                      <th key={h} className={cn(
                        "text-[10px] font-bold uppercase tracking-wider text-[#5A7860] dark:text-[#7BAF84] px-4 py-3 border-b border-[#DDE8DF] dark:border-[#1E3524]",
                        h === "Student" ? "text-left" : "text-center",
                        (h === "Pre Taken" || h === "Post Taken") && "hidden md:table-cell",
                      )}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mod.students.map((s, idx) => (
                    <tr key={s.userId} className="border-b border-[#DDE8DF] dark:border-[#1E3524] last:border-0 hover:bg-[#EBF0EC] dark:hover:bg-[#0A180E] transition-colors">

                      {/* Student */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className={cn(
                            "w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-extrabold shrink-0",
                            AVATAR_COLORS_PPR[idx % 4]
                          )}>
                            {s.initials}
                          </div>
                          <div>
                            <p className="font-bold text-sm leading-tight">{s.name}</p>
                            <p className="text-[10px] text-[#5A7860] dark:text-[#7BAF84]">
                              {s.difficulty === "CHAMPION" ? "🔥 Champion" : s.difficulty === "APPRENTICE" ? "🌱 Apprentice" : "⚔️ Adventurer"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Pre score */}
                      <td className="px-4 py-3 text-center">
                        {s.preScore !== null ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <span className={cn("inline-flex items-center justify-center w-14 h-7 rounded-lg text-[11px] font-bold", scoreBg(s.preScore))}>
                              {s.preScore}%
                            </span>
                            <span className="text-[10px] text-[#5A7860] dark:text-[#7BAF84]">{s.preRaw}</span>
                          </div>
                        ) : (
                          <span className="text-[#92A894] text-xs">—</span>
                        )}
                      </td>

                      {/* Post score */}
                      <td className="px-4 py-3 text-center">
                        {s.postScore !== null ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <span className={cn("inline-flex items-center justify-center w-14 h-7 rounded-lg text-[11px] font-bold", scoreBg(s.postScore))}>
                              {s.postScore}%
                            </span>
                            <span className="text-[10px] text-[#5A7860] dark:text-[#7BAF84]">{s.postRaw}</span>
                          </div>
                        ) : (
                          <span className="text-[#92A894] text-xs">—</span>
                        )}
                      </td>

                      {/* Gain */}
                      <td className="px-4 py-3 text-center">
                        <span className={cn("text-sm font-bold tabular-nums", gainColor(s.gain))}>
                          {gainLabel(s.gain)}
                        </span>
                      </td>

                      {/* Dates */}
                      <td className="px-4 py-3 text-center hidden md:table-cell text-[11px] text-[#5A7860] dark:text-[#7BAF84]">
                        {s.preTakenAt ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-center hidden md:table-cell text-[11px] text-[#5A7860] dark:text-[#7BAF84]">
                        {s.postTakenAt ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>

                {/* Class averages footer */}
                {mod.students.length > 1 && (mod.avgPre !== null || mod.avgPost !== null) && (
                  <tfoot>
                    <tr className="bg-[#EBF0EC] dark:bg-[#0A180E]">
                      <td className="px-4 py-2.5 border-t border-[#DDE8DF] dark:border-[#1E3524]">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#5A7860] dark:text-[#7BAF84]">Class Avg</span>
                      </td>
                      <td className="px-4 py-2.5 border-t border-[#DDE8DF] dark:border-[#1E3524] text-center">
                        {mod.avgPre !== null && (
                          <span className={cn("inline-flex items-center justify-center w-14 h-7 rounded-lg text-[11px] font-bold", scoreBg(mod.avgPre))}>
                            {mod.avgPre}%
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 border-t border-[#DDE8DF] dark:border-[#1E3524] text-center">
                        {mod.avgPost !== null && (
                          <span className={cn("inline-flex items-center justify-center w-14 h-7 rounded-lg text-[11px] font-bold", scoreBg(mod.avgPost))}>
                            {mod.avgPost}%
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 border-t border-[#DDE8DF] dark:border-[#1E3524] text-center">
                        <span className={cn("text-sm font-bold", gainColor(mod.avgGain))}>
                          {gainLabel(mod.avgGain)}
                        </span>
                      </td>
                      <td colSpan={2} className="hidden md:table-cell border-t border-[#DDE8DF] dark:border-[#1E3524]" />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PrePostResultsView({ results }: { results: ModuleTestData[] }) {
  if (results.length === 0) {
    return (
      <div className="text-center py-16 border-2 border-dashed border-[#DDE8DF] dark:border-[#1E3524] rounded-2xl bg-white dark:bg-[#132018]">
        <div className="text-5xl mb-4">📊</div>
        <h3 className="font-nunito text-lg font-extrabold mb-2">No Modules Assigned</h3>
        <p className="text-sm text-[#5A7860] dark:text-[#7BAF84]">
          Assign modules to your section to track pre/post test results.
        </p>
      </div>
    );
  }

  const hasLinkedTests = results.some((r) => r.preTest || r.postTest);

  return (
    <div className="space-y-4">
      {/* Intro hint */}
      <div className="flex items-start gap-3 px-5 py-3.5 bg-white dark:bg-[#132018] border border-[#DDE8DF] dark:border-[#1E3524] rounded-2xl text-sm text-[#5A7860] dark:text-[#7BAF84] shadow-sm">
        <span className="text-lg shrink-0">ℹ️</span>
        <p>
          Click any module row to expand its results. Use the{" "}
          <strong className="text-[#1A2E1C] dark:text-[#E8F5EB]">📋 / ✅ test chips</strong>{" "}
          to view or edit a linked test, or{" "}
          <strong className="text-[#1A2E1C] dark:text-[#E8F5EB]">+ Create</strong>{" "}
          to link a new one directly from here.
        </p>
      </div>

      {!hasLinkedTests && (
        <div className="px-5 py-3.5 bg-[#FEF3C7] dark:bg-[#3d2800] border border-[#F59E0B]/40 rounded-2xl text-sm font-semibold text-[#F59E0B]">
          ⚠️ None of the assigned modules have linked test sets yet. Click a module row and use "+ Create" to add one.
        </div>
      )}

      {results.map((mod) => (
        <ModuleResultsPanel key={mod.moduleId} mod={mod} />
      ))}
    </div>
  );
}

// ─── MAIN CLIENT COMPONENT ────────────────────────────────────
export default function TeacherModulesClient({ data }: { data: TeacherModulesData }) {
  const router = useRouter();

  const [activeTab,     setActiveTab]     = useState<TabKey>("assigned");
  const [filter,        setFilter]        = useState<FilterKey>("all");
  const [search,        setSearch]        = useState("");
  const [assignMod,     setAssignMod]     = useState<AssignTarget | null>(null);
  const [drawerStu,     setDrawerStu]     = useState<StudentRow | null>(null);
  const [activatingId,  setActivatingId]  = useState<number | null>(null);
  const [archivingId,   setArchivingId]   = useState<number | null>(null);

  const handleActivate = async (moduleId: number) => {
    setActivatingId(moduleId);
    try {
      const res  = await fetch(`/api/teacher/modules/${moduleId}`, {
        method:      "PATCH",
        headers:     { "Content-Type": "application/json" },
        credentials: "include",
        body:        JSON.stringify({ status: "ACTIVE" }),
      });
      const json = await res.json();
      if (json.success) router.refresh();
    } finally {
      setActivatingId(null);
    }
  };

  const handleArchive = async (moduleId: number) => {
    if (!confirm("Archive this module? It will no longer be visible to students. You can restore it later.")) return;
    setArchivingId(moduleId);
    try {
      const res  = await fetch(`/api/teacher/modules/${moduleId}`, {
        method:      "PATCH",
        headers:     { "Content-Type": "application/json" },
        credentials: "include",
        body:        JSON.stringify({ status: "ARCHIVED" }),
      });
      const json = await res.json();
      if (json.success) router.refresh();
    } finally {
      setArchivingId(null);
    }
  };

  const { teacher, modules, stats } = data;

  // Filter modules
  const filtered = modules.filter((m) => {
    const matchFilter = filter === "all" || m.status === filter;
    const matchSearch = m.title.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <>
      <style>{`
        .font-nunito { font-family: var(--font-nunito, 'Nunito', sans-serif); }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.4s ease both; }
        .d1{animation-delay:.05s} .d2{animation-delay:.10s}
        .d3{animation-delay:.15s} .d4{animation-delay:.20s} .d5{animation-delay:.25s}
      `}</style>

      <div className="flex min-h-screen bg-[#F4F7F5] dark:bg-[#0D1F12] text-[#1A2E1C] dark:text-[#E8F5EB]">

        {/* ── SIDEBAR ── */}
        <TeacherSidebar
          activePath="modules"
          teacherName={teacher.name}
          teacherInitials={teacher.initials}
          teacherSection={teacher.section}
          totalStudents={stats.totalStudents}
          pendingGradeCount={data.pendingGradeCount}
        />

        {/* ── MAIN ── */}
        <main className="flex-1 px-4 md:px-10 pb-9 pt-14 md:pt-9 overflow-x-hidden min-w-0">

          {/* Topbar */}
          <div className="flex flex-wrap items-start justify-between mb-6 gap-3 fade-up">
            <div>
              <h1 className="font-nunito text-xl md:text-[26px] font-black mb-1">📦 Module Management</h1>
              <p className="text-sm text-[#5A7860] dark:text-[#7BAF84]">
                {teacher.section} Section · School Year 2025–2026
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                onClick={() => router.push("/dashboard/teacher/modules/new")}
                variant="outline" className="font-nunito font-bold text-xs md:text-sm border-[#DDE8DF] dark:border-[#1E3524] text-[#5A7860] hover:border-[#4A9B7F] hover:text-[#4A9B7F] hover:bg-[#D1FAE5]">
                + New Module
              </Button>
              <Button
                onClick={() => { const m = filtered[0]; if (m) setAssignMod({ dbId: m.dbId, title: m.title }); }}
                className="font-nunito font-bold text-xs md:text-sm bg-[#4A9B7F] hover:bg-[#2E7A60] text-white shadow-[0_4px_14px_rgba(74,155,127,0.30)]"
              >
                ＋ Assign Module
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
            <div className="fade-up d1"><StatCard icon="📦" value={String(stats.totalModules)}     label="Modules Assigned"    delta="↑ Active quests"         deltaUp color="#4A9B7F" iconBg="#D1FAE522" /></div>
            <div className="fade-up d2"><StatCard icon="👥" value={String(stats.totalStudents)}    label="Total Students"       delta={`${teacher.section} Section`}   color="#3B82C4" iconBg="#DBEAFE22" /></div>
            <div className="fade-up d3"><StatCard icon="⚡" value={String(stats.activeStudents)}   label="Currently Active"     delta="↑ Engagement"  deltaUp color="#F59E0B" iconBg="#FEF3C722" /></div>
            <div className="fade-up d4"><StatCard icon="✅" value={String(stats.completedCount)}   label="Completed a Module"   delta="↑ Completion"   deltaUp color="#22C55E" iconBg="#DCFCE722" /></div>
            <div className="fade-up d5"><StatCard icon="⚠️" value={String(stats.needIntervention)} label="Need Intervention"    delta={stats.needIntervention > 0 ? "Struggling" : "All on track"} deltaUp={stats.needIntervention === 0} color="#E05C5C" iconBg="#FEE2E222" /></div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b-2 border-[#DDE8DF] dark:border-[#1E3524] mb-6 fade-up d2 overflow-x-auto pb-0">
            {([
              ["assigned", "📋 Assigned", "📋 Assigned Modules"],
              ["library",  "📚 Library",  "📚 Module Library"],
              ["results",  "📊 Results",  "📊 Pre/Post Results"],
            ] as const).map(([key, short, full]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={cn(
                  "font-nunito font-bold text-xs md:text-sm px-3 md:px-5 py-2.5 rounded-t-xl border border-b-0 transition-all relative top-0.5 whitespace-nowrap shrink-0",
                  activeTab === key
                    ? "bg-white dark:bg-[#132018] text-[#4A9B7F] border-[#DDE8DF] dark:border-[#1E3524]"
                    : "bg-transparent text-[#5A7860] dark:text-[#7BAF84] border-transparent hover:bg-[#EBF0EC] dark:hover:bg-[#0A180E]"
                )}
              >
                <span className="md:hidden">{short}</span>
                <span className="hidden md:inline">{full}</span>
              </button>
            ))}
          </div>

          {/* ── Assigned Modules tab ── */}
          {activeTab === "assigned" && (
            <>
              {/* Filter + search */}
              <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2.5 mb-6 fade-up d3">
                <div className="flex flex-wrap items-center gap-2">
                  {(["all","active","draft","archived"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={cn(
                        "font-nunito font-bold text-xs px-3.5 py-1.5 rounded-full border-[1.5px] transition-all",
                        filter === f
                          ? "bg-[#4A9B7F] text-white border-[#4A9B7F]"
                          : "bg-white dark:bg-[#132018] text-[#5A7860] dark:text-[#7BAF84] border-[#DDE8DF] dark:border-[#1E3524] hover:border-[#4A9B7F] hover:text-[#4A9B7F]"
                      )}
                    >
                      {{ all:"All", active:"Active", draft:"Draft", archived:"Archived" }[f]}
                    </button>
                  ))}
                </div>
                <div className="relative sm:ml-auto w-full sm:w-auto">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#92A894] pointer-events-none">🔍</span>
                  <Input
                    placeholder="Search modules…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 h-9 text-[13px] bg-white dark:bg-[#132018] border-[#DDE8DF] dark:border-[#1E3524] rounded-xl w-full sm:w-[200px] focus-visible:ring-[#4A9B7F]/30 focus-visible:border-[#4A9B7F]"
                  />
                </div>
              </div>

              {/* Module grid */}
              {filtered.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-10 fade-up d3">
                  {filtered.map((mod) => (
                    <ModuleCard
                      key={mod.dbId}
                      mod={mod}
                      onOpenDrawer={(s) => setDrawerStu(s)}
                      onOpenAssign={(m) => setAssignMod(m)}
                      onEdit={(id) => router.push(`/dashboard/teacher/modules/${id}/edit`)}
                      onViewReports={(id) => router.push(`/dashboard/teacher/reports?moduleId=${id}`)}
                      onGrade={() => router.push("/dashboard/teacher/grade")}
                      onArchive={handleArchive}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 border-2 border-dashed border-[#DDE8DF] dark:border-[#1E3524] rounded-2xl bg-white dark:bg-[#132018] fade-up">
                  <div className="text-5xl mb-4">📦</div>
                  <h3 className="font-nunito text-lg font-extrabold mb-2">No modules found</h3>
                  <p className="text-sm text-[#5A7860] dark:text-[#7BAF84] mb-6">
                    Try adjusting your filter or search term.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => { setFilter("all"); setSearch(""); }}
                    className="font-nunito font-bold border-[#DDE8DF] dark:border-[#1E3524]"
                  >
                    Clear Filters
                  </Button>
                </div>
              )}
            </>
          )}

          {/* ── Module Library tab ── */}
          {activeTab === "library" && (
            <div className="fade-up d3">
              <LibraryView
                library={data.library}
                contexts={data.contexts}
                onAssign={(t) => setAssignMod(t)}
                onActivate={handleActivate}
                onViewProgress={() => setActiveTab("assigned")}
              />
            </div>
          )}

          {/* ── Pre/Post Results tab ── */}
          {activeTab === "results" && (
            <div className="fade-up d3">
              <PrePostResultsView results={data.prePostResults} />
            </div>
          )}
        </main>
      </div>

      {/* Assign modal */}
      <AssignModal
        open={!!assignMod}
        mod={assignMod}
        onClose={() => setAssignMod(null)}
        sections={data.sections}
      />

      {/* Student drawer */}
      <StudentDrawer
        open={!!drawerStu}
        student={drawerStu}
        onClose={() => setDrawerStu(null)}
      />
    </>
  );
}