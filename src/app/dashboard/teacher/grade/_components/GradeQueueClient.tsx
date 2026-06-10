"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

// ─── Exported types (used by parent page.tsx) ─────────────────
export interface GradeItem {
  responseId:        number;
  studentId:         number;
  studentName:       string;
  studentAvatar:     string;
  studentDifficulty: string;
  moduleName:        string;
  moduleIcon:        string;
  stageNum:          number;
  stageTitle:        string;
  stageType:         string;
  phase:             string;
  maxScore:          number;
  answer:            string;
  stageOptions:      Record<string, unknown>;
  submittedAt:       string;
  hintsUsed:         number;
  timeSpent:         number | null;
}

export interface GradeQueueData {
  pendingGradeCount: number;
  items:             GradeItem[];
}

// ─── Constants ────────────────────────────────────────────────
const PHASE: Record<string, { label: string; color: string; bg: string; darkBg: string }> = {
  UNDERSTANDING: { label: "Understanding", color: "#3B82C4", bg: "#DBEAFE", darkBg: "#1e3a5f" },
  ANALYSIS:      { label: "Analysis",      color: "#8B5CF6", bg: "#EDE9FE", darkBg: "#2e1065" },
  SOLUTION:      { label: "Solution",      color: "#F59E0B", bg: "#FEF3C7", darkBg: "#3d2800" },
  REFLECTION:    { label: "Reflection",    color: "#4A9B7F", bg: "#D1FAE5", darkBg: "#064e35" },
};

const TYPE_LABELS: Record<string, string> = {
  OPEN_ENDED:       "Open Ended",
  TABLE_INPUT:      "Table Input",
  MULTI_PLAN:       "Plans",
  SELECT_JUSTIFY:   "Choose & Justify",
  REFLECTION_SLIDER:"Reflection",
};

const DIFF_LABEL: Record<string, { label: string; color: string }> = {
  APPRENTICE: { label: "Easy",   color: "#4A9B7F" },
  ADVENTURER: { label: "Normal", color: "#F59E0B" },
  CHAMPION:   { label: "Hard",   color: "#E05C5C" },
};

function fmt(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ─── Answer renderer (teacher-graded stages only) ─────────────
function AnswerDisplay({ stageType, answer, opts }: {
  stageType: string;
  answer:    string;
  opts:      Record<string, unknown>;
}) {
  const box = "bg-[#F8FAFC] dark:bg-[#0F1E2E] border border-[#E2E8F0] dark:border-[#2D3F55] rounded-xl p-3";

  try {
    // OPEN_ENDED — plain text, or prompted text if opts.prompts is set
    if (stageType === "OPEN_ENDED") {
      const prompts = opts.prompts as string[] | undefined;
      if (prompts && prompts.length > 0) {
        const vals: Record<number, string> = JSON.parse(answer);
        return (
          <div className="space-y-3">
            {prompts.map((q, i) => (
              <div key={i}>
                <p className="text-xs font-bold text-[#64748B] dark:text-[#94A3B8] mb-1">Q{i + 1}: {q}</p>
                <p className={cn("text-sm whitespace-pre-wrap", box)}>{vals[i] || "—"}</p>
              </div>
            ))}
          </div>
        );
      }
      return <p className={cn("text-sm whitespace-pre-wrap leading-relaxed", box)}>{answer}</p>;
    }

    // TABLE_INPUT — Given / Missing / Assumed table
    if (stageType === "TABLE_INPUT") {
      const cells: Record<string, string> = JSON.parse(answer);
      const cols = ["given", "missing", "assumed"] as const;
      const headers = { given: "Given", missing: "Missing", assumed: "Assumed" };
      const rowIndices = [...new Set(Object.keys(cells).map((k) => k.split("-")[0]))];
      return (
        <div className="overflow-x-auto rounded-xl border border-[#E2E8F0] dark:border-[#2D3F55]">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                {cols.map((col) => (
                  <th key={col} className="text-left font-bold uppercase text-[#64748B] dark:text-[#94A3B8] px-3 py-2 border-b border-[#E2E8F0] dark:border-[#2D3F55] bg-[#F8FAFC] dark:bg-[#162032]">
                    {headers[col]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rowIndices.map((rowIdx) => (
                <tr key={rowIdx} className="border-t border-[#E2E8F0] dark:border-[#2D3F55]">
                  {cols.map((col) => (
                    <td key={col} className="px-3 py-2 text-sm">
                      {cells[`${rowIdx}-${col}`] || <span className="text-[#94A3B8]">—</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    // MULTI_PLAN — Plan A / Plan B
    if (stageType === "MULTI_PLAN") {
      const plans: [Record<string, unknown>, Record<string, unknown>] = JSON.parse(answer);
      const fields = (opts.planFields as { label: string; key: string; type: string }[]) ?? [];
      const labels = (opts.planLabels as [string, string]) ?? ["Plan A", "Plan B"];
      const planColors = ["#3B82C4", "#8B5CF6"];
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[0, 1].map((i) => (
            <div key={i} className={cn(box, "space-y-2")}>
              <p className="text-xs font-extrabold uppercase tracking-wide" style={{ color: planColors[i] }}>{labels[i]}</p>
              {fields.map((f) => (
                <div key={f.key}>
                  <p className="text-[11px] text-[#94A3B8] mb-0.5">{f.label}</p>
                  <p className={cn("text-sm font-medium", f.type === "text" ? "whitespace-pre-wrap" : "")}>
                    {String(plans[i]?.[f.key] ?? "—")}
                  </p>
                </div>
              ))}
            </div>
          ))}
        </div>
      );
    }

    // SELECT_JUSTIFY — Choose best solution + justify
    if (stageType === "SELECT_JUSTIFY") {
      const state = JSON.parse(answer) as { chosen: "A" | "B" | null; justify: string };
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#64748B] dark:text-[#94A3B8] font-semibold">Chosen plan:</span>
            {state.chosen
              ? <span className="text-sm font-extrabold px-3 py-1 rounded-full" style={{ background: state.chosen === "A" ? "#DBEAFE" : "#EDE9FE", color: state.chosen === "A" ? "#3B82C4" : "#8B5CF6" }}>Plan {state.chosen}</span>
              : <span className="text-xs text-[#94A3B8]">None chosen</span>}
          </div>
          {state.justify && (
            <>
              <p className="text-xs font-bold text-[#64748B] dark:text-[#94A3B8]">Justification:</p>
              <p className={cn("text-sm whitespace-pre-wrap", box)}>{state.justify}</p>
            </>
          )}
        </div>
      );
    }

    // REFLECTION_SLIDER — Sliders + open reflections
    if (stageType === "REFLECTION_SLIDER") {
      const state       = JSON.parse(answer) as { sliders: Record<string, number>; texts: Record<string, string> };
      const sliders     = (opts.sliderQuestions as { key: string; question: string }[]) ?? [];
      const reflections = (opts.openReflections as { key: string; question: string }[]) ?? [];
      return (
        <div className="space-y-4">
          {sliders.length > 0 && (
            <div className="space-y-2">
              {sliders.map((s) => {
                const val = state.sliders?.[s.key] ?? 5;
                return (
                  <div key={s.key} className="flex items-center gap-3">
                    <p className="text-xs text-[#64748B] dark:text-[#94A3B8] flex-1 leading-snug">{s.question}</p>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <div className="w-20 h-1.5 bg-[#E2E8F0] dark:bg-[#2D3F55] rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-[#4A9B7F]" style={{ width: `${(val / 10) * 100}%` }} />
                      </div>
                      <span className="text-xs font-bold text-[#4A9B7F] w-8 text-right">{val}/10</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {reflections.map((r) => (
            <div key={r.key}>
              <p className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] mb-1">{r.question}</p>
              <p className={cn("text-sm whitespace-pre-wrap", box)}>{state.texts?.[r.key] || "—"}</p>
            </div>
          ))}
        </div>
      );
    }
  } catch { /* fallback */ }

  return <p className="text-sm text-[#64748B] font-mono break-all bg-[#F8FAFC] dark:bg-[#0F1E2E] rounded-xl p-3">{answer}</p>;
}

// ─── Grade form ───────────────────────────────────────────────
function GradeForm({ responseId, maxScore, onSaved }: {
  responseId: number;
  maxScore:   number;
  onSaved:    (score: number) => void;
}) {
  const [score,  setScore]  = useState(maxScore);
  const [note,   setNote]   = useState("");
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState<string | null>(null);

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/teacher/responses/${responseId}/score`, {
        method:      "PATCH",
        headers:     { "Content-Type": "application/json" },
        credentials: "include",
        body:        JSON.stringify({ score, teacherNote: note || undefined }),
      });
      const d = await res.json();
      if (!res.ok || !d.success) { setError(d.error ?? "Failed to save."); return; }
      onSaved(d.score);
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  };

  const pct = Math.round((score / maxScore) * 100);

  return (
    <div className="border-t border-[#E2E8F0] dark:border-[#2D3F55] pt-4 mt-4 space-y-3">
      <p className="text-[11px] font-bold uppercase tracking-widest text-[#64748B] dark:text-[#94A3B8]">
        Teacher Grade
      </p>

      {/* Score slider + numeric input */}
      <div className="flex items-center gap-4">
        <input
          type="range"
          min={0}
          max={maxScore}
          step={1}
          value={score}
          onChange={(e) => setScore(parseInt(e.target.value))}
          className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer accent-[#4A9B7F]"
        />
        <div className="flex items-baseline gap-0.5 min-w-[72px] justify-end">
          <input
            type="number"
            min={0}
            max={maxScore}
            value={score}
            onChange={(e) => setScore(Math.min(maxScore, Math.max(0, parseInt(e.target.value) || 0)))}
            className="w-12 text-right font-extrabold text-lg bg-transparent focus:outline-none text-[#4A9B7F]"
          />
          <span className="text-xs text-[#94A3B8]">/ {maxScore}</span>
          <span className="text-xs text-[#94A3B8] ml-1">({pct}%)</span>
        </div>
      </div>

      {/* Note */}
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Optional teacher note…"
        rows={2}
        className="w-full px-3 py-2.5 text-sm bg-[#F8FAFC] dark:bg-[#0F1E2E] border border-[#E2E8F0] dark:border-[#2D3F55] rounded-xl focus:outline-none focus:border-[#4A9B7F] resize-none placeholder:text-[#94A3B8]"
      />

      {error && <p className="text-xs text-[#E05C5C]">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={saving}
        className="px-5 py-2 rounded-xl text-sm font-bold bg-[#4A9B7F] text-white hover:bg-[#3a7a63] disabled:opacity-50 transition-all"
      >
        {saving ? "Saving…" : "Save Grade"}
      </button>
    </div>
  );
}

// ─── Individual response card ─────────────────────────────────
function GradeCard({ item, onGraded }: { item: GradeItem; onGraded: (id: number) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [graded,   setGraded]   = useState(false);

  const phase = PHASE[item.phase];
  const diff  = DIFF_LABEL[item.studentDifficulty] ?? { label: "Normal", color: "#F59E0B" };

  if (graded) return null; // fade out by removing

  return (
    <div className={cn(
      "bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl overflow-hidden shadow-sm",
      "transition-all duration-200 hover:shadow-md hover:border-[#4A9B7F]/40"
    )}>
      {/* Phase top accent */}
      <div className="h-[3px]" style={{ background: phase?.color }} />

      {/* Card header */}
      <div className="px-5 py-4 flex items-start gap-4 flex-wrap">
        {/* Student avatar */}
        <div className="w-10 h-10 rounded-xl bg-[#EEF2F8] dark:bg-[#162032] flex items-center justify-center text-xl flex-shrink-0">
          {item.studentAvatar}
        </div>

        {/* Meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className="font-nunito font-extrabold text-sm">{item.studentName}</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: diff.color, background: `${diff.color}18` }}>
              {diff.label}
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-[#64748B] dark:text-[#94A3B8]">{item.moduleIcon} {item.moduleName}</span>
            <span className="text-[#CBD5E1] dark:text-[#334155]">·</span>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: `${phase?.color}18`, color: phase?.color }}
            >
              Stage {item.stageNum} · {phase?.label}
            </span>
          </div>
          <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-0.5 truncate">{item.stageTitle}</p>
        </div>

        {/* Right meta */}
        <div className="text-right flex-shrink-0 text-[11px] text-[#94A3B8] space-y-0.5">
          <p>{relTime(item.submittedAt)}</p>
          {item.timeSpent != null && <p>{fmt(item.timeSpent)} spent</p>}
          {item.hintsUsed > 0 && <p>{item.hintsUsed} hint{item.hintsUsed !== 1 ? "s" : ""}</p>}
        </div>
      </div>

      {/* Answer (collapsed / expanded) */}
      <div className="px-5 pb-4">
        <div className={cn("overflow-hidden transition-all duration-300", expanded ? "max-h-[2000px]" : "max-h-[200px]", "relative")}>
          <AnswerDisplay stageType={item.stageType} answer={item.answer} opts={item.stageOptions} />
          {!expanded && (
            <div className="absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-white dark:from-[#1E293B] to-transparent pointer-events-none" />
          )}
        </div>

        {/* Expand / collapse toggle */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 text-xs text-[#64748B] hover:text-[#4A9B7F] transition-colors font-semibold"
        >
          {expanded ? "▲ Show less" : "▼ Show full answer"}
        </button>

        {/* Grade form (only shown when expanded) */}
        {expanded && (
          <GradeForm
            responseId={item.responseId}
            maxScore={item.maxScore}
            onSaved={(score) => {
              setGraded(true);
              onGraded(item.responseId);
              void score;
            }}
          />
        )}
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="text-6xl mb-4">🎉</div>
      <h2 className="font-nunito font-extrabold text-xl mb-2">All caught up!</h2>
      <p className="text-sm text-[#64748B] dark:text-[#94A3B8] max-w-xs">
        No open-ended responses are waiting for a grade right now.
      </p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────
export default function GradeQueueClient({ data }: { data: GradeQueueData }) {
  const [items, setItems] = useState<GradeItem[]>(data.items);
  const [filter, setFilter] = useState<string | "all">("all");

  const handleGraded = (responseId: number) => {
    setItems((prev) => prev.filter((i) => i.responseId !== responseId));
  };

  const filtered = filter === "all" ? items : items.filter((i) => i.stageType === filter);

  // Group filtered items by student
  const studentGroups = filtered.reduce<Map<number, { name: string; avatar: string; items: GradeItem[] }>>(
    (map, item) => {
      if (!map.has(item.studentId)) {
        map.set(item.studentId, { name: item.studentName, avatar: item.studentAvatar, items: [] });
      }
      map.get(item.studentId)!.items.push(item);
      return map;
    },
    new Map()
  );

  // Available type filters (only types present in the queue)
  const typesPresent = [...new Set(data.items.map((i) => i.stageType))].sort();

  return (
    <>
      <style>{`.font-nunito { font-family: var(--font-nunito,'Nunito',sans-serif); }`}</style>

      <div className="px-6 sm:px-8 py-8 overflow-x-hidden">

        {/* Page header */}
        <div className="mb-6">
          <h1 className="font-nunito text-2xl font-extrabold mb-0.5">Grade Open Items</h1>
          <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
            {items.length > 0
              ? `${items.length} response${items.length !== 1 ? "s" : ""} waiting for a grade`
              : "No pending responses"}
          </p>
        </div>

        {/* Filter tabs */}
        {typesPresent.length > 1 && (
          <div className="flex flex-wrap gap-1.5 mb-6">
            <button
              onClick={() => setFilter("all")}
              className={cn(
                "text-xs font-bold px-3.5 py-1.5 rounded-full border transition-all",
                filter === "all"
                  ? "bg-[#4A9B7F] text-white border-[#4A9B7F]"
                  : "bg-white dark:bg-[#1E293B] text-[#64748B] dark:text-[#94A3B8] border-[#E2E8F0] dark:border-[#334155] hover:border-[#4A9B7F] hover:text-[#4A9B7F]"
              )}
            >
              All
              {items.length > 0 && (
                <span className={cn("ml-1.5 text-[10px] font-black px-1.5 py-0.5 rounded-full", filter === "all" ? "bg-white/30 text-white" : "bg-[#EEF2F8] dark:bg-[#162032] text-[#64748B]")}>
                  {items.length}
                </span>
              )}
            </button>
            {typesPresent.map((t) => {
              const count = items.filter((i) => i.stageType === t).length;
              return (
                <button
                  key={t}
                  onClick={() => setFilter(t)}
                  className={cn(
                    "text-xs font-bold px-3.5 py-1.5 rounded-full border transition-all",
                    filter === t
                      ? "bg-[#4A9B7F] text-white border-[#4A9B7F]"
                      : "bg-white dark:bg-[#1E293B] text-[#64748B] dark:text-[#94A3B8] border-[#E2E8F0] dark:border-[#334155] hover:border-[#4A9B7F] hover:text-[#4A9B7F]"
                  )}
                >
                  {TYPE_LABELS[t] ?? t}
                  {count > 0 && (
                    <span className={cn("ml-1.5 text-[10px] font-black px-1.5 py-0.5 rounded-full", filter === t ? "bg-white/30 text-white" : "bg-[#EEF2F8] dark:bg-[#162032] text-[#64748B]")}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Content */}
        {items.length === 0 ? (
          <EmptyState />
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-sm text-[#94A3B8]">
            No responses match this filter.
          </div>
        ) : (
          <div className="space-y-8">
            {[...studentGroups.entries()].map(([studentId, group]) => (
              <div key={studentId}>
                {/* Student group header */}
                <div className="flex items-center gap-2.5 mb-3">
                  <span className="text-xl">{group.avatar}</span>
                  <h2 className="font-nunito font-extrabold text-[15px]">{group.name}</h2>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#FEE2E2] dark:bg-[#450a0a] text-[#E05C5C]">
                    {group.items.length} pending
                  </span>
                </div>

                {/* Response cards for this student */}
                <div className="space-y-4">
                  {group.items.map((item) => (
                    <GradeCard key={item.responseId} item={item} onGraded={handleGraded} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
