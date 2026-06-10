"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { ModuleQuizData, QuizQuestionData } from "../page";

// ─── Answer state per question ────────────────────────────────
type AnswerState = Record<number, string>; // questionId → answer string

// ─── Helpers ─────────────────────────────────────────────────
function diffLabel(d: string) {
  if (d === "APPRENTICE") return "🌱 Apprentice";
  if (d === "CHAMPION")   return "🔥 Champion";
  return "⚔️ Adventurer";
}

// ─── Multiple Choice question ─────────────────────────────────
function MCQuestion({ q, value, onChange, submitted }: {
  q: QuizQuestionData; value: string; onChange: (v: string) => void; submitted: boolean;
}) {
  const choices = (q.options.choices as { icon: string; title: string; desc: string }[]) ?? [];
  const selected = value === "" ? null : parseInt(value);

  return (
    <div className="space-y-2.5">
      {choices.map((c, i) => {
        const isSelected = selected === i;
        return (
          <button
            key={i}
            type="button"
            disabled={submitted}
            onClick={() => onChange(String(i))}
            className={cn(
              "w-full flex items-start gap-3.5 p-4 rounded-xl border-2 text-left transition-all",
              isSelected
                ? "border-[#3B82C4] bg-[#DBEAFE] dark:bg-[#1e3a5f]"
                : "border-[#E2E8F0] dark:border-[#2D3F55] bg-white dark:bg-[#1E293B] hover:border-[#3B82C4] hover:bg-[#F0F7FF] dark:hover:bg-[#1e3a5f]/40",
              submitted && "cursor-default"
            )}
          >
            <span className="text-2xl shrink-0 mt-0.5">{c.icon}</span>
            <div>
              <p className="font-semibold text-sm">{c.title}</p>
              {c.desc && <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">{c.desc}</p>}
            </div>
            {isSelected && <span className="ml-auto text-[#3B82C4] font-bold text-lg shrink-0">✓</span>}
          </button>
        );
      })}
    </div>
  );
}

// ─── Ranking question ─────────────────────────────────────────
function RankQuestion({ q, value, onChange, submitted }: {
  q: QuizQuestionData; value: string; onChange: (v: string) => void; submitted: boolean;
}) {
  const rankItems = (q.options.rankItems as { emoji: string; text: string; sub: string }[]) ?? [];
  let order: number[];
  try {
    order = value ? JSON.parse(value) : rankItems.map((_, i) => i);
  } catch {
    order = rankItems.map((_, i) => i);
  }
  if (order.length !== rankItems.length) order = rankItems.map((_, i) => i);

  const emit = (newOrder: number[]) => onChange(JSON.stringify(newOrder.map(i => ({ text: rankItems[i]?.text ?? "" }))));
  const moveUp   = (pos: number) => { if (pos === 0) return; const n=[...order];[n[pos-1],n[pos]]=[n[pos],n[pos-1]]; emit(n); };
  const moveDown = (pos: number) => { if (pos===order.length-1) return; const n=[...order];[n[pos],n[pos+1]]=[n[pos+1],n[pos]]; emit(n); };

  return (
    <div className="space-y-2">
      <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mb-2">
        Use ↑↓ to arrange in the correct order (#1 is most important).
      </p>
      {order.map((itemIdx, pos) => {
        const item = rankItems[itemIdx];
        if (!item) return null;
        return (
          <div key={pos} className="flex items-center gap-3 p-3 bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#2D3F55] rounded-xl">
            <span className="w-6 h-6 rounded-full bg-[#3B82C4] text-white text-[11px] font-bold flex items-center justify-center shrink-0">{pos + 1}</span>
            <span className="text-lg">{item.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{item.text}</p>
              {item.sub && <p className="text-xs text-[#94A3B8] truncate">{item.sub}</p>}
            </div>
            {!submitted && (
              <div className="flex gap-1">
                <button type="button" onClick={() => moveUp(pos)}
                  className="w-7 h-7 rounded-lg border border-[#E2E8F0] dark:border-[#2D3F55] text-[#64748B] hover:text-[#3B82C4] hover:border-[#3B82C4] text-sm font-bold transition-colors">↑</button>
                <button type="button" onClick={() => moveDown(pos)}
                  className="w-7 h-7 rounded-lg border border-[#E2E8F0] dark:border-[#2D3F55] text-[#64748B] hover:text-[#3B82C4] hover:border-[#3B82C4] text-sm font-bold transition-colors">↓</button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Open Input question ──────────────────────────────────────
function OpenQuestion({ q, value, onChange, submitted }: {
  q: QuizQuestionData; value: string; onChange: (v: string) => void; submitted: boolean;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={submitted}
      rows={4}
      placeholder="Type your answer here…"
      className="w-full bg-[#F8FAFC] dark:bg-[#0F1E2E] border border-[#E2E8F0] dark:border-[#2D3F55] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#3B82C4] resize-none placeholder:text-[#94A3B8] disabled:opacity-70"
    />
  );
}

// ─── Single question card ─────────────────────────────────────
function QuestionCard({ q, answer, onChange, submitted }: {
  q: QuizQuestionData; answer: string; onChange: (v: string) => void; submitted: boolean;
}) {
  const [showHint, setShowHint] = useState(false);
  const isAnswered = answer.trim() !== "";

  return (
    <div className={cn(
      "bg-white dark:bg-[#1E293B] border-2 rounded-2xl p-5 shadow-sm space-y-4 transition-all",
      isAnswered ? "border-[#3B82C4]" : "border-[#E2E8F0] dark:border-[#2D3F55]"
    )}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#3B82C4] text-white text-sm font-extrabold flex items-center justify-center shrink-0">
            {q.questionNum}
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748B] dark:text-[#94A3B8]">
              {q.type === "multiple_choice" ? "🔘 Multiple Choice" : q.type === "ranking" ? "🔀 Arrangement" : "✏️ Answer Input"}
            </p>
            <p className="font-semibold text-sm mt-0.5 leading-snug">{q.questionText}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isAnswered && <span className="text-[#3B82C4] text-lg">✓</span>}
          <span className="text-[10px] text-[#94A3B8] font-semibold">{q.maxScore} pts</span>
        </div>
      </div>

      {/* Hint */}
      {q.hint && (
        <div>
          <button type="button" onClick={() => setShowHint(v => !v)}
            className="text-[11px] text-[#F59E0B] font-bold hover:underline">
            💡 {showHint ? "Hide Hint" : "Show Hint"}
          </button>
          {showHint && (
            <p className="mt-1.5 text-xs text-[#F59E0B] bg-[#FEF3C7] dark:bg-[#3d2800] px-3 py-2 rounded-lg">{q.hint}</p>
          )}
        </div>
      )}

      {/* Input */}
      {q.type === "multiple_choice" && (
        <MCQuestion q={q} value={answer} onChange={onChange} submitted={submitted} />
      )}
      {q.type === "ranking" && (
        <RankQuestion q={q} value={answer} onChange={onChange} submitted={submitted} />
      )}
      {q.type === "open_ended" && (
        <OpenQuestion q={q} value={answer} onChange={onChange} submitted={submitted} />
      )}
    </div>
  );
}

// ─── Main client ──────────────────────────────────────────────
export default function ModuleQuizClient({ data }: { data: ModuleQuizData }) {
  const router = useRouter();

  const [answers, setAnswers] = useState<AnswerState>(() => {
    const init: AnswerState = {};
    for (const q of data.questions) {
      if (q.existingAnswer) init[q.id] = q.existingAnswer;
      else if (q.type === "ranking") {
        const items = (q.options.rankItems as { text: string }[]) ?? [];
        init[q.id] = JSON.stringify(items.map(it => ({ text: it.text })));
      } else {
        init[q.id] = "";
      }
    }
    return init;
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(() => data.questions.every(q => !!q.existingAnswer));
  const [error,      setError]      = useState("");

  const allAnswered = data.questions.every(q => (answers[q.id] ?? "").trim() !== "");
  const answered    = Object.values(answers).filter(v => v.trim() !== "").length;

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/student/modules/${data.moduleId}/quiz`, {
        method:      "POST",
        headers:     { "Content-Type": "application/json" },
        credentials: "include",
        body:        JSON.stringify({
          answers: data.questions.map(q => ({ questionId: q.id, answer: answers[q.id] ?? "" })),
        }),
      });
      const json = await res.json();
      if (!json.success) { setError(json.error ?? "Failed to submit."); return; }
      setSubmitted(true);
      setTimeout(() => router.push(`/dashboard/student/modules/${data.moduleId}/complete`), 1800);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <style>{`.font-nunito { font-family: var(--font-nunito,'Nunito',sans-serif); }`}</style>
      <div className="min-h-screen bg-[#F5F7FA] dark:bg-[#0F172A] text-[#1E293B] dark:text-[#F1F5F9]">

        {/* Header */}
        <header className="sticky top-0 z-30 bg-white dark:bg-[#1E293B] border-b border-[#E2E8F0] dark:border-[#334155] shadow-sm">
          <div className="max-w-2xl mx-auto px-6 py-4 flex items-center gap-3">
            <button onClick={() => router.push("/dashboard/student/modules")}
              className="p-2 rounded-xl hover:bg-[#F1F5F9] dark:hover:bg-[#162032] text-[#64748B] transition-colors">←</button>
            <div className="flex-1 min-w-0">
              <p className="font-nunito font-extrabold text-base truncate">{data.moduleIcon} {data.moduleTitle}</p>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">Scenario Questions · {data.student.avatarEmoji} {data.student.name}</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#DBEAFE] dark:bg-[#1e3a5f] text-[#3B82C4]">
              {answered}/{data.questions.length} answered
            </span>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-6 py-8 space-y-5">

          {/* Intro */}
          <div className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl p-5 shadow-sm">
            <p className="font-nunito font-extrabold text-lg mb-1">📝 Scenario Questions</p>
            <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
              Great work completing all 12 stages! Answer the following {data.questions.length} question{data.questions.length !== 1 ? "s" : ""} to finish the module.
            </p>
            <div className="flex items-center gap-2 mt-3">
              <div className="flex-1 h-2 bg-[#E2E8F0] dark:bg-[#334155] rounded-full overflow-hidden">
                <div className="h-full bg-[#3B82C4] rounded-full transition-all"
                  style={{ width: `${(answered / data.questions.length) * 100}%` }} />
              </div>
              <span className="text-xs font-bold text-[#3B82C4]">{Math.round((answered / data.questions.length) * 100)}%</span>
            </div>
          </div>

          {/* Questions */}
          {data.questions.map((q) => (
            <QuestionCard
              key={q.id}
              q={q}
              answer={answers[q.id] ?? ""}
              onChange={(v) => setAnswers(prev => ({ ...prev, [q.id]: v }))}
              submitted={submitted}
            />
          ))}

          {/* Submit */}
          {!submitted ? (
            <div className="space-y-3 pb-8">
              {error && <p className="text-xs text-[#E05C5C] font-semibold">{error}</p>}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !allAnswered}
                className="w-full py-4 rounded-2xl font-nunito font-extrabold text-base bg-[#3B82C4] hover:bg-[#2563A0] disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-[0_4px_14px_rgba(59,130,196,0.3)] transition-all"
              >
                {submitting ? "Submitting…" : !allAnswered ? `Answer all ${data.questions.length - answered} remaining question${data.questions.length - answered !== 1 ? "s" : ""} to submit` : "✓ Submit"}
              </button>
            </div>
          ) : (
            <div className="text-center py-10 space-y-3 pb-8">
              <div className="text-5xl">🎉</div>
              <p className="font-nunito font-extrabold text-xl text-[#4A9B7F]">Quiz Submitted!</p>
              <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">Your answers have been saved. Returning to your modules…</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
