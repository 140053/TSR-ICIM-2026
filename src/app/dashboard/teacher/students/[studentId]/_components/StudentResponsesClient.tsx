// app/dashboard/teacher/students/[studentId]/_components/StudentResponsesClient.tsx
"use client";

import { useState }    from "react";
import Link            from "next/link";
import { useRouter }   from "next/navigation";
import { cn }          from "@/lib/utils";

// ─── EXPORTED TYPES (used by parent page.tsx) ─────────────────
export interface ResponseRow {
  id:           number;
  stageNum:     number;
  stageTitle:   string;
  stageType:    string;
  phase:        "UNDERSTANDING" | "ANALYSIS" | "SOLUTION" | "REFLECTION";
  answer:       string;
  isCorrect:    boolean | null;
  score:        number | null;
  maxScore:     number;
  timeSpent:    number | null;
  hintsUsed:    number;
  teacherNote:  string | null;
  gradedAt:     string | null;
  stageOptions: Record<string, unknown>;
}

export interface StudentDetailData {
  student: {
    id:          number;
    name:        string;
    avatarEmoji: string;
    avatarName:  string;
    difficulty:  string;
    sectionName: string;
  };
  moduleId:    number;
  moduleTitle: string;
  moduleIcon:  string;
  progress: {
    status:       string;
    currentStage: number;
    percentScore: number | null;
    totalScore:   number | null;
    maxPossible:  number | null;
  } | null;
  diagnostic: {
    understandingScore: number | null;
    analysisScore:      number | null;
    solutionScore:      number | null;
    reflectionScore:    number | null;
    overallScore:       number | null;
    needsIntervention:  boolean;
  } | null;
  responses:    ResponseRow[];
  pendingCount: number;
}

// ─── PHASE CONFIG ─────────────────────────────────────────────
const PHASE = {
  UNDERSTANDING: { label: "Understanding", color: "#3B82C4", bg: "#DBEAFE", darkBg: "#1e3a5f" },
  ANALYSIS:      { label: "Analysis",      color: "#8B5CF6", bg: "#EDE9FE", darkBg: "#2e1065" },
  SOLUTION:      { label: "Solution",      color: "#F59E0B", bg: "#FEF3C7", darkBg: "#3d2800" },
  REFLECTION:    { label: "Reflection",    color: "#4A9B7F", bg: "#D1FAE5", darkBg: "#064e35" },
};

// Stage types that require teacher grading (score stays null until teacher sets it)
const TEACHER_GRADED_TYPES = new Set([
  "OPEN_ENDED", "TABLE_INPUT", "MULTI_PLAN", "SELECT_JUSTIFY", "REFLECTION_SLIDER",
]);

function fmt(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

// ─── PER-STAGE ANSWER RENDERER (type-based dispatch) ──────────
function AnswerDisplay({
  stageType, answer, opts,
}: {
  stageType: string;
  answer:    string;
  opts:      Record<string, unknown>;
}) {
  const base = "text-sm text-[#1E293B] dark:text-[#E2E8F0] leading-relaxed";
  const box  = "bg-[#F8FAFC] dark:bg-[#0F1E2E] border border-[#E2E8F0] dark:border-[#2D3F55] rounded-xl p-3";

  try {
    // ── MULTIPLE_CHOICE — show selected option with icon
    if (stageType === "MULTIPLE_CHOICE") {
      const idx     = parseInt(answer);
      const choices = (opts.choices as { icon: string; title: string; desc: string }[]) ?? [];
      const c       = choices[idx];
      return c
        ? <p className={base}><span className="text-lg mr-1">{c.icon}</span><strong>{c.title}</strong> — <span className="text-[#64748B] dark:text-[#94A3B8]">{c.desc}</span></p>
        : <p className={base}>{answer}</p>;
    }

    // ── RANKING — ordered list with drag-position
    if (stageType === "RANKING") {
      const items: { emoji: string; text: string; sub: string }[] = JSON.parse(answer);
      return (
        <ol className="space-y-1.5">
          {items.map((item, i) => (
            <li key={i} className="flex items-center gap-2.5 text-sm">
              <span className="w-6 h-6 rounded-full text-white text-[11px] font-black flex items-center justify-center shrink-0"
                style={{ background: PHASE.UNDERSTANDING.color }}>
                {i + 1}
              </span>
              <span className="text-lg">{item.emoji}</span>
              <div>
                <p className="font-semibold">{item.text}</p>
                <p className="text-[11px] text-[#94A3B8]">{item.sub}</p>
              </div>
            </li>
          ))}
        </ol>
      );
    }

    // ── OPEN_ENDED — plain text or prompted Q&A (distinguished by opts.prompts)
    if (stageType === "OPEN_ENDED") {
      const prompts = (opts.prompts as string[]) ?? [];
      if (prompts.length > 0) {
        // Prompted form (e.g. root-cause stage)
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
      // Plain open-ended
      return <p className={cn(base, box, "whitespace-pre-wrap")}>{answer}</p>;
    }

    // ── TABLE_INPUT — Given / Missing / Assumed grid
    if (stageType === "TABLE_INPUT") {
      const cells: Record<string, string> = JSON.parse(answer);
      const cols    = ["given", "missing", "assumed"] as const;
      const headers = { given: "Given", missing: "Missing", assumed: "Assumed" };
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
              {Array.from(new Set(Object.keys(cells).map((k) => k.split("-")[0]))).map((rowIdx) => (
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

    // ── CHECKLIST — constraint check or risk assessment (distinguished by opts.riskItems)
    if (stageType === "CHECKLIST") {
      const riskItems = (opts.riskItems as { emoji: string; title: string; sub: string }[] | undefined);

      if (riskItems && riskItems.length > 0) {
        // Risk-assessment variant
        const state  = JSON.parse(answer) as { selected: Record<number, boolean>; note: string };
        const picked = riskItems.filter((_, i) => state.selected?.[i]);
        return (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {picked.length > 0
                ? picked.map((item, i) => (
                    <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-[#FEE2E2] dark:bg-[#450a0a] text-[#E05C5C] font-semibold">
                      {item.emoji} {item.title}
                    </span>
                  ))
                : <span className="text-xs text-[#94A3B8]">No risks selected.</span>
              }
            </div>
            {state.note && <p className={cn("text-sm italic whitespace-pre-wrap", box)}>"{state.note}"</p>}
          </div>
        );
      }

      // Standard constraint checklist
      const raw     = JSON.parse(answer);
      const checked: Record<number, boolean> = raw?.selected ?? raw;
      const items   = (opts.checkItems as { text: string; desc: string }[]) ?? [];
      return (
        <ul className="space-y-1.5">
          {items.map((item, i) => (
            <li key={i} className={cn("flex items-start gap-2 text-sm rounded-lg px-3 py-2",
              checked[i] ? "bg-[#D1FAE5] dark:bg-[#063c28]" : "bg-[#F8FAFC] dark:bg-[#0F1E2E] opacity-50")}>
              <span className={checked[i] ? "text-[#4A9B7F]" : "text-[#94A3B8]"}>{checked[i] ? "✓" : "○"}</span>
              <div>
                <p className="font-semibold">{item.text}</p>
                <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">{item.desc}</p>
              </div>
            </li>
          ))}
        </ul>
      );
    }

    // ── COMPUTATION — budget allocation table + total
    if (stageType === "COMPUTATION") {
      const qtys   = JSON.parse(answer) as Record<number, number>;
      const items  = (opts.calcItems as { icon: string; label: string; price: number; unit: string }[]) ?? [];
      const budget = (opts.budget as number) ?? 6000;
      const total  = items.reduce((s, item, i) => s + (qtys[i] ?? 0) * item.price, 0);
      const over   = total > budget;
      return (
        <div className="space-y-1.5">
          {items.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-[#64748B] dark:text-[#94A3B8]">{item.icon} {item.label}</span>
              <span>
                <strong>{qtys[i] ?? 0}</strong> {item.unit} × ₱{item.price} =
                <strong className="ml-1">₱{((qtys[i] ?? 0) * item.price).toLocaleString()}</strong>
              </span>
            </div>
          ))}
          <div className={cn("flex justify-between text-sm font-bold mt-2 pt-2 border-t border-[#E2E8F0] dark:border-[#2D3F55]", over ? "text-[#E05C5C]" : "text-[#4A9B7F]")}>
            <span>Total</span>
            <span>₱{total.toLocaleString()} / ₱{budget.toLocaleString()} {over ? "⚠️ Over" : "✅ Within budget"}</span>
          </div>
        </div>
      );
    }

    // ── MULTI_PLAN — Plan A / Plan B side-by-side
    if (stageType === "MULTI_PLAN") {
      const plans  = JSON.parse(answer) as [Record<string, unknown>, Record<string, unknown>];
      const fields = (opts.planFields as { label: string; key: string; type: string }[]) ?? [];
      const labels = (opts.planLabels as [string, string]) ?? ["Plan A", "Plan B"];
      const budget = (opts.planBudget as number) ?? 6000;
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
              {(() => {
                const prices: Record<string, number> = { rice: 52, canned: 28, juice: 15 };
                const est = fields.filter(f => f.type === "number").reduce((s, f) => s + (Number(plans[i]?.[f.key] ?? 0)) * (prices[f.key] ?? 0), 0);
                if (est <= 0) return null;
                return <p className={cn("text-xs font-bold mt-1", est > budget ? "text-[#E05C5C]" : "text-[#4A9B7F]")}>Est. ₱{est.toLocaleString()} {est > budget ? "⚠️" : "✅"}</p>;
              })()}
            </div>
          ))}
        </div>
      );
    }

    // ── BUDGET_CHECK — trial implementation spending table
    if (stageType === "BUDGET_CHECK") {
      const qtys   = JSON.parse(answer) as Record<string, number>;
      const items  = (opts.trialItems as { id: string; icon: string; name: string; price: number; unit: string }[]) ?? [];
      const budget = (opts.trialBudget as number) ?? 6000;
      const total  = items.reduce((s, it) => s + (qtys[it.id] ?? 0) * it.price, 0);
      const over   = total > budget;
      return (
        <div className="space-y-1.5">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-[#64748B] dark:text-[#94A3B8]">{item.icon} {item.name}</span>
              <span>
                <strong>{qtys[item.id] ?? 0}</strong> × ₱{item.price} =
                <strong className="ml-1">₱{((qtys[item.id] ?? 0) * item.price).toLocaleString()}</strong>
              </span>
            </div>
          ))}
          <div className={cn("flex justify-between text-sm font-bold mt-2 pt-2 border-t border-[#E2E8F0] dark:border-[#2D3F55]", over ? "text-[#E05C5C]" : "text-[#4A9B7F]")}>
            <span>Total</span>
            <span>₱{total.toLocaleString()} / ₱{budget.toLocaleString()} {over ? "⚠️ Over budget" : "✅ Within budget"}</span>
          </div>
        </div>
      );
    }

    // ── SELECT_JUSTIFY — chosen plan + written justification
    if (stageType === "SELECT_JUSTIFY") {
      const state = JSON.parse(answer) as { chosen: "A" | "B" | null; justify: string };
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#64748B] dark:text-[#94A3B8] font-semibold">Chosen plan:</span>
            {state.chosen
              ? <span className="text-sm font-extrabold px-3 py-1 rounded-full"
                  style={{ background: state.chosen === "A" ? "#DBEAFE" : "#EDE9FE", color: state.chosen === "A" ? "#3B82C4" : "#8B5CF6" }}>
                  Plan {state.chosen}
                </span>
              : <span className="text-xs text-[#94A3B8]">None chosen</span>
            }
          </div>
          {state.justify && (
            <div>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] font-semibold mb-1">Justification:</p>
              <p className={cn("text-sm whitespace-pre-wrap", box)}>{state.justify}</p>
            </div>
          )}
        </div>
      );
    }

    // ── REFLECTION_SLIDER — sliders + open reflection texts
    if (stageType === "REFLECTION_SLIDER") {
      const state       = JSON.parse(answer) as { sliders: Record<string, number>; texts: Record<string, string> };
      const sliders     = (opts.sliderQuestions as { key: string; question: string; loLabel: string; hiLabel: string }[]) ?? [];
      const reflections = (opts.openReflections as { key: string; question: string }[]) ?? [];
      return (
        <div className="space-y-4">
          {sliders.length > 0 && (
            <div className="space-y-2">
              {sliders.map((s) => {
                const val = state.sliders?.[s.key] ?? 5;
                return (
                  <div key={s.key} className="flex items-center gap-3">
                    <div className="flex-1">
                      <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mb-1">{s.question}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[#94A3B8]">{s.loLabel}</span>
                        <div className="flex-1 h-1.5 bg-[#E2E8F0] dark:bg-[#2D3F55] rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-[#4A9B7F]" style={{ width: `${(val / 10) * 100}%` }} />
                        </div>
                        <span className="text-[10px] text-[#94A3B8]">{s.hiLabel}</span>
                        <span className="text-xs font-bold text-[#4A9B7F] w-8 text-right">{val}/10</span>
                      </div>
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
  } catch {
    // Fallback for unparseable answers
  }

  return <p className="text-sm text-[#64748B] font-mono break-all bg-[#F8FAFC] dark:bg-[#0F1E2E] rounded-xl p-3">{answer}</p>;
}

// ─── GRADING FORM ─────────────────────────────────────────────
function GradeForm({
  responseId, maxScore, existing, note: initNote, onSaved,
}: {
  responseId: number;
  maxScore:   number;
  existing:   number | null;
  note:       string | null;
  onSaved:    (score: number, note: string) => void;
}) {
  const [score,   setScore]   = useState(existing ?? 0);
  const [note,    setNote]    = useState(initNote ?? "");
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);

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
      onSaved(d.score, note);
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border-t border-[#E2E8F0] dark:border-[#2D3F55] pt-4 mt-4 space-y-3">
      <p className="text-xs font-bold uppercase tracking-widest text-[#64748B] dark:text-[#94A3B8]">
        Teacher Grade
      </p>

      {/* Score slider */}
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
        <div className="flex items-baseline gap-0.5 min-w-[60px] justify-end">
          <input
            type="number"
            min={0}
            max={maxScore}
            value={score}
            onChange={(e) => setScore(Math.min(maxScore, Math.max(0, parseInt(e.target.value) || 0)))}
            className="w-12 text-right font-extrabold text-lg bg-transparent focus:outline-none text-[#4A9B7F]"
          />
          <span className="text-xs text-[#94A3B8]">/ {maxScore}</span>
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
        className="px-4 py-2 rounded-xl text-sm font-bold bg-[#4A9B7F] text-white hover:bg-[#3a7a63] disabled:opacity-50 transition-all"
      >
        {saving ? "Saving…" : "Save Grade"}
      </button>
    </div>
  );
}

// ─── SCORE BADGE ──────────────────────────────────────────────
function ScoreBadge({ score, maxScore, isCorrect, gradedAt }: {
  score:     number | null;
  maxScore:  number;
  isCorrect: boolean | null;
  gradedAt:  string | null;
}) {
  if (score === null) {
    return (
      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#FEF3C7] dark:bg-[#3d2800] text-[#F59E0B]">
        Ungraded
      </span>
    );
  }
  const pct = Math.round((score / maxScore) * 100);
  const cls = pct >= 80 ? "bg-[#D1FAE5] dark:bg-[#063c28] text-[#4A9B7F]"
            : pct >= 60 ? "bg-[#FEF3C7] dark:bg-[#3d2800] text-[#F59E0B]"
            :             "bg-[#FEE2E2] dark:bg-[#450a0a] text-[#E05C5C]";
  const autoLabel = isCorrect === true ? " ✓" : isCorrect === false ? " ✗" : "";
  return (
    <span className={cn("text-[11px] font-bold px-2.5 py-1 rounded-full", cls)}>
      {score}/{maxScore}{autoLabel}
      {gradedAt && <span className="opacity-60 ml-1 font-normal">· graded</span>}
    </span>
  );
}

// ─── CLUSTER BAR ──────────────────────────────────────────────
function ClusterBar({ label, score, color }: { label: string; score: number | null; color: string }) {
  const pct = score ?? -1;
  return (
    <div className="flex-1 min-w-[100px]">
      <div className="flex justify-between mb-1">
        <p className="text-[11px] font-bold" style={{ color }}>{label}</p>
        <p className="text-[11px] font-bold text-[#64748B]">{pct >= 0 ? `${Math.round(pct)}%` : "—"}</p>
      </div>
      <div className="h-1.5 bg-[#E2E8F0] dark:bg-[#334155] rounded-full overflow-hidden">
        {pct >= 0 && (
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: color }}
          />
        )}
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────
export default function StudentResponsesClient({ data }: { data: StudentDetailData }) {
  const router = useRouter();
  const { student, moduleTitle, moduleIcon, progress, diagnostic, responses } = data;

  // Local score state — updated after teacher saves a grade
  const [localScores, setLocalScores] = useState<Record<number, { score: number; note: string; graded: boolean }>>(
    Object.fromEntries(
      responses
        .filter((r) => r.score !== null)
        .map((r) => [r.id, { score: r.score!, note: r.teacherNote ?? "", graded: !!r.gradedAt }])
    )
  );

  const handleSaved = (responseId: number, score: number, note: string) => {
    setLocalScores((prev) => ({ ...prev, [responseId]: { score, note, graded: true } }));
  };

  const diffLabel = student.difficulty === "APPRENTICE" ? "Easy" : student.difficulty === "CHAMPION" ? "Hard" : "Normal";
  const diffColor = student.difficulty === "APPRENTICE" ? "#4A9B7F" : student.difficulty === "CHAMPION" ? "#E05C5C" : "#F59E0B";

  const pendingNow = responses.filter((r) => {
    const ls = localScores[r.id];
    return ls === undefined && r.score === null && r.gradedAt === null;
  }).length;

  return (
    <>
      <style>{`.font-nunito { font-family: var(--font-nunito,'Nunito',sans-serif); }`}</style>
      <div className="min-h-screen bg-[#F5F7FA] dark:bg-[#0F172A] text-[#1E293B] dark:text-[#F1F5F9]">
        <div className="max-w-4xl mx-auto px-6 py-8">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-6 text-sm">
            <button onClick={() => router.push("/dashboard/teacher")} className="text-[#64748B] hover:text-[#4A9B7F]">
              Dashboard
            </button>
            <span className="text-[#CBD5E1]">/</span>
            <Link href="/dashboard/teacher/students" className="text-[#64748B] hover:text-[#4A9B7F]">
              Students
            </Link>
            <span className="text-[#CBD5E1]">/</span>
            <span className="font-semibold">{student.name}</span>
          </div>

          {/* Student header */}
          <div className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl p-6 mb-5 shadow-sm">
            <div className="flex items-start gap-4 flex-wrap">
              <div className="w-14 h-14 rounded-2xl bg-[#EEF2F8] dark:bg-[#162032] flex items-center justify-center text-3xl flex-shrink-0">
                {student.avatarEmoji}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="font-nunito text-xl font-extrabold">{student.name}</h1>
                <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
                  {student.avatarName} · {student.sectionName} Section
                </p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#EEF2F8] dark:bg-[#162032]" style={{ color: diffColor }}>
                    {diffLabel} mode
                  </span>
                  {progress && (
                    <span className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                      {moduleIcon} {moduleTitle} · Stage {progress.currentStage}/12
                    </span>
                  )}
                  {pendingNow > 0 && (
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#FEE2E2] dark:bg-[#450a0a] text-[#E05C5C]">
                      {pendingNow} response{pendingNow !== 1 ? "s" : ""} to grade
                    </span>
                  )}
                </div>
              </div>
              {progress?.percentScore !== null && progress?.percentScore !== undefined && (
                <div className="text-right flex-shrink-0">
                  <div className="font-nunito text-3xl font-extrabold" style={{
                    color: (progress.percentScore ?? 0) >= 80 ? "#4A9B7F" : (progress.percentScore ?? 0) >= 60 ? "#F59E0B" : "#E05C5C"
                  }}>
                    {Math.round(progress.percentScore)}%
                  </div>
                  <p className="text-[11px] text-[#94A3B8]">
                    {progress.totalScore ?? "—"} / {progress.maxPossible ?? "—"} pts
                  </p>
                </div>
              )}
            </div>

            {/* Diagnostic cluster bars */}
            {diagnostic && (
              <div className="flex gap-4 mt-5 flex-wrap">
                <ClusterBar label="Understanding" score={diagnostic.understandingScore} color="#3B82C4" />
                <ClusterBar label="Analysis"      score={diagnostic.analysisScore}      color="#8B5CF6" />
                <ClusterBar label="Solution"      score={diagnostic.solutionScore}      color="#F59E0B" />
                <ClusterBar label="Reflection"    score={diagnostic.reflectionScore}    color="#4A9B7F" />
              </div>
            )}
            {diagnostic?.needsIntervention && (
              <div className="mt-3 px-3 py-2 rounded-lg bg-[#FEE2E2] dark:bg-[#450a0a] text-[#E05C5C] text-xs font-semibold">
                ⚠️ This student is flagged for intervention (at least one cluster below 60%).
              </div>
            )}
          </div>

          {/* No responses yet */}
          {responses.length === 0 && (
            <div className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl p-10 text-center">
              <p className="text-[#64748B] dark:text-[#94A3B8] text-sm">
                {progress ? "No stage responses submitted yet." : "This student has not started a module yet."}
              </p>
            </div>
          )}

          {/* Stage response cards */}
          <div className="space-y-3">
            {responses.map((r) => {
              const phase    = PHASE[r.phase];
              const ls       = localScores[r.id];
              const currScore    = ls?.score   ?? r.score;
              const currNote     = ls?.note    ?? r.teacherNote ?? "";
              const currGraded   = ls?.graded  ?? !!r.gradedAt;
              const needsGrade   = currScore === null && !currGraded;

              return (
                <div
                  key={r.id}
                  className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl p-5 shadow-sm"
                  style={{ borderLeft: `4px solid ${phase.color}` }}
                >
                  {/* Stage header */}
                  <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-extrabold font-nunito text-white flex-shrink-0"
                        style={{ background: phase.color }}
                      >
                        {r.stageNum}
                      </div>
                      <div>
                        <p className="font-bold text-sm">{r.stageTitle}</p>
                        <p className="text-[11px]" style={{ color: phase.color }}>{phase.label} Phase · {r.stageType.replace(/_/g, " ")}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {r.timeSpent !== null && (
                        <span className="text-[11px] text-[#94A3B8]">⏱ {fmt(r.timeSpent)}</span>
                      )}
                      {r.hintsUsed > 0 && (
                        <span className="text-[11px] text-[#94A3B8]">💡 {r.hintsUsed} hint{r.hintsUsed !== 1 ? "s" : ""}</span>
                      )}
                      <ScoreBadge
                        score={currScore}
                        maxScore={r.maxScore}
                        isCorrect={r.isCorrect}
                        gradedAt={currGraded ? r.gradedAt : null}
                      />
                    </div>
                  </div>

                  {/* Answer */}
                  <AnswerDisplay stageType={r.stageType} answer={r.answer} opts={r.stageOptions} />

                  {/* Teacher note (if already graded) */}
                  {currNote && !needsGrade && (
                    <div className="mt-3 px-3 py-2 rounded-lg bg-[#EEF2F8] dark:bg-[#162032] text-sm text-[#64748B] dark:text-[#94A3B8]">
                      <span className="font-semibold text-[11px] uppercase tracking-widest">Teacher note: </span>{currNote}
                    </div>
                  )}

                  {/* Grading form — show when ungraded OR always for teacher-graded types */}
                  {(needsGrade || TEACHER_GRADED_TYPES.has(r.stageType)) && (
                    <GradeForm
                      key={`${r.id}-${currScore}`}
                      responseId={r.id}
                      maxScore={r.maxScore}
                      existing={currScore}
                      note={currNote || null}
                      onSaved={(score, note) => handleSaved(r.id, score, note)}
                    />
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </>
  );
}
