"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────
export type QuizMode = "multiple_choice" | "ranking" | "open_ended";

export interface QuizChoiceItem { icon: string; title: string; desc: string; }
export interface QuizRankItem   { emoji: string; text: string; sub: string; }

export interface QuizQuestion {
  questionNum:        number;
  questionText:       string;
  mode:               QuizMode;
  choices:            QuizChoiceItem[];
  correctChoiceIndex: number;
  rankItems:          QuizRankItem[];
  correctOrder:       number[];   // indices into rankItems in correct order
  answerKey:          string;
  hint:               string;
  maxScore:           number;
}

const MODE_LABELS: Record<QuizMode, string> = {
  multiple_choice: "Multiple Choice",
  ranking:         "Arrangement",
  open_ended:      "Answer Input",
};

const MODE_ICONS: Record<QuizMode, string> = {
  multiple_choice: "🔘",
  ranking:         "📊",
  open_ended:      "✍️",
};

export function makeDefaultQuizQuestion(num: number): QuizQuestion {
  return {
    questionNum:        num,
    questionText:       "",
    mode:               "multiple_choice",
    choices:            [
      { icon: "🅐", title: "Option A", desc: "" },
      { icon: "🅑", title: "Option B", desc: "" },
      { icon: "🅒", title: "Option C", desc: "" },
      { icon: "🅓", title: "Option D", desc: "" },
    ],
    correctChoiceIndex: 0,
    rankItems:          [
      { emoji: "1️⃣", text: "Item 1", sub: "" },
      { emoji: "2️⃣", text: "Item 2", sub: "" },
      { emoji: "3️⃣", text: "Item 3", sub: "" },
    ],
    correctOrder:  [0, 1, 2],
    answerKey:     "",
    hint:          "",
    maxScore:      10,
  };
}

// ─── Shared field components ──────────────────────────────────
function FL({ c, dark }: { c: string; dark?: boolean }) {
  return (
    <label className={cn(
      "block text-[10px] font-extrabold tracking-widest uppercase mb-1.5",
      dark ? "text-slate-400" : "text-[#5A7860] dark:text-[#7BAF84]"
    )}>{c}</label>
  );
}
function TF({ value, onChange, placeholder, dark, rows }: {
  value: string; onChange: (v: string) => void; placeholder?: string; dark?: boolean; rows?: number;
}) {
  const cls = dark
    ? "w-full rounded-lg border border-white/10 bg-slate-800/60 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
    : "w-full rounded-xl border border-[#DDE8DF] dark:border-[#1E3524] bg-[#EBF0EC] dark:bg-[#0A180E] px-3 py-2 text-sm focus:outline-none focus:border-[#4A9B7F] resize-none";
  return rows
    ? <textarea className={cls} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} />
    : <input className={cls} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />;
}

// ─── Multiple-choice editor ───────────────────────────────────
function MCEditor({ q, upd, dark }: { q: QuizQuestion; upd: (q: QuizQuestion) => void; dark?: boolean }) {
  const setChoice = (i: number, field: keyof QuizChoiceItem, val: string) => {
    const next = q.choices.map((c, idx) => idx === i ? { ...c, [field]: val } : c);
    upd({ ...q, choices: next });
  };
  const addChoice = () => {
    if (q.choices.length >= 6) return;
    const letters = ["🅐","🅑","🅒","🅓","🅔","🅕"];
    upd({ ...q, choices: [...q.choices, { icon: letters[q.choices.length] ?? "•", title: `Option ${q.choices.length + 1}`, desc: "" }] });
  };
  const removeChoice = (i: number) => {
    const next = q.choices.filter((_, idx) => idx !== i);
    upd({ ...q, choices: next, correctChoiceIndex: Math.min(q.correctChoiceIndex, next.length - 1) });
  };

  const inputCls = dark
    ? "rounded bg-slate-700 border border-white/10 px-2 py-1 text-sm text-white placeholder:text-slate-500 focus:outline-none"
    : "rounded-lg border border-[#DDE8DF] dark:border-[#1E3524] bg-[#EBF0EC] dark:bg-[#0A180E] px-2 py-1 text-sm focus:outline-none focus:border-[#4A9B7F]";

  return (
    <div className="space-y-2">
      {q.choices.map((c, i) => {
        const isCorrect = q.correctChoiceIndex === i;
        return (
          <div key={i} className={cn("flex items-start gap-2 p-2 rounded-lg border transition-colors",
            isCorrect
              ? dark ? "border-green-500/40 bg-green-950/20" : "border-[#4A9B7F]/40 bg-[#D1FAE5]/30 dark:bg-[#064e35]/30"
              : dark ? "border-white/10 bg-slate-800/40" : "border-[#DDE8DF] dark:border-[#1E3524]"
          )}>
            <button type="button" onClick={() => upd({ ...q, correctChoiceIndex: i })}
              className={cn("mt-1 w-4 h-4 rounded-full border-2 shrink-0 transition-colors",
                isCorrect
                  ? dark ? "border-green-400 bg-green-400" : "border-[#4A9B7F] bg-[#4A9B7F]"
                  : dark ? "border-slate-500 hover:border-green-400" : "border-[#DDE8DF] hover:border-[#4A9B7F]"
              )} title="Mark as correct" />
            <div className="flex-1 space-y-1 min-w-0">
              <div className="flex gap-1.5">
                <input className={cn(inputCls, "w-10 text-center")} value={c.icon} maxLength={4}
                  onChange={e => setChoice(i, "icon", e.target.value)} placeholder="📦" />
                <input className={cn(inputCls, "flex-1")} value={c.title}
                  onChange={e => setChoice(i, "title", e.target.value)} placeholder={`Option ${i + 1} title`} />
              </div>
              <input className={cn(inputCls, "w-full text-xs")} value={c.desc}
                onChange={e => setChoice(i, "desc", e.target.value)} placeholder="Description (optional)" />
            </div>
            {q.choices.length > 2 && (
              <button type="button" onClick={() => removeChoice(i)}
                className={dark ? "text-slate-500 hover:text-red-400 text-lg" : "text-[#94A3B8] hover:text-[#E05C5C] text-lg"}>×</button>
            )}
          </div>
        );
      })}
      {q.choices.length < 6 && (
        <button type="button" onClick={addChoice}
          className={cn("w-full py-2 rounded-lg border border-dashed text-xs font-semibold transition-colors",
            dark ? "border-slate-600 text-slate-400 hover:border-purple-500 hover:text-purple-400"
                 : "border-[#DDE8DF] dark:border-[#1E3524] text-[#5A7860] hover:border-[#4A9B7F] hover:text-[#4A9B7F]"
          )}>
          + Add Option
        </button>
      )}
    </div>
  );
}

// ─── Ranking editor ───────────────────────────────────────────
function RankEditor({ q, upd, dark }: { q: QuizQuestion; upd: (q: QuizQuestion) => void; dark?: boolean }) {
  const items = q.rankItems;
  const order = q.correctOrder.length === items.length ? q.correctOrder : items.map((_, i) => i);

  const setItem = (i: number, field: keyof QuizRankItem, val: string) => {
    const next = items.map((it, idx) => idx === i ? { ...it, [field]: val } : it);
    upd({ ...q, rankItems: next });
  };
  const moveUp = (pos: number) => {
    if (pos === 0) return;
    const next = [...order];
    [next[pos - 1], next[pos]] = [next[pos], next[pos - 1]];
    upd({ ...q, correctOrder: next });
  };
  const moveDown = (pos: number) => {
    if (pos === order.length - 1) return;
    const next = [...order];
    [next[pos], next[pos + 1]] = [next[pos + 1], next[pos]];
    upd({ ...q, correctOrder: next });
  };
  const addItem = () => {
    if (items.length >= 8) return;
    const n = items.length + 1;
    upd({ ...q, rankItems: [...items, { emoji: `${n}️⃣`, text: `Item ${n}`, sub: "" }], correctOrder: [...order, items.length] });
  };
  const removeItem = (idx: number) => {
    const nextItems = items.filter((_, i) => i !== idx);
    const nextOrder = order.filter(i => i !== idx).map(i => i > idx ? i - 1 : i);
    upd({ ...q, rankItems: nextItems, correctOrder: nextOrder });
  };

  const inputCls = dark
    ? "rounded bg-slate-700 border border-white/10 px-2 py-1 text-sm text-white placeholder:text-slate-500 focus:outline-none"
    : "rounded-lg border border-[#DDE8DF] dark:border-[#1E3524] bg-[#EBF0EC] dark:bg-[#0A180E] px-2 py-1 text-sm focus:outline-none focus:border-[#4A9B7F]";

  return (
    <div className="space-y-2">
      <p className={cn("text-[10px] font-semibold uppercase tracking-widest mb-1",
        dark ? "text-slate-500" : "text-[#94A3B8]")}>
        Items (edit text) ↕ Correct order (drag ↑↓ buttons)
      </p>
      {/* Items editor */}
      <div className="space-y-1.5">
        {items.map((item, i) => (
          <div key={i} className={cn("flex items-center gap-1.5 p-2 rounded-lg border",
            dark ? "border-white/10 bg-slate-800/40" : "border-[#DDE8DF] dark:border-[#1E3524]")}>
            <input className={cn(inputCls, "w-9 text-center")} value={item.emoji} maxLength={4}
              onChange={e => setItem(i, "emoji", e.target.value)} />
            <input className={cn(inputCls, "flex-1")} value={item.text}
              onChange={e => setItem(i, "text", e.target.value)} placeholder={`Item ${i + 1}`} />
            {items.length > 2 && (
              <button type="button" onClick={() => removeItem(i)}
                className={dark ? "text-slate-500 hover:text-red-400" : "text-[#94A3B8] hover:text-[#E05C5C]"}>×</button>
            )}
          </div>
        ))}
      </div>
      {items.length < 8 && (
        <button type="button" onClick={addItem}
          className={cn("w-full py-1.5 rounded-lg border border-dashed text-xs font-semibold transition-colors",
            dark ? "border-slate-600 text-slate-400 hover:border-purple-500 hover:text-purple-400"
                 : "border-[#DDE8DF] text-[#5A7860] hover:border-[#4A9B7F] hover:text-[#4A9B7F]")}>
          + Add Item
        </button>
      )}
      {/* Correct order */}
      <div className={cn("mt-3 p-3 rounded-lg border", dark ? "border-purple-500/20 bg-purple-950/10" : "border-[#4A9B7F]/20 bg-[#D1FAE5]/20 dark:bg-[#064e35]/20")}>
        <p className={cn("text-[10px] font-bold uppercase tracking-widest mb-2",
          dark ? "text-purple-400" : "text-[#4A9B7F]")}>Correct Order (top = #1)</p>
        {order.map((itemIdx, pos) => {
          const item = items[itemIdx];
          if (!item) return null;
          return (
            <div key={pos} className="flex items-center gap-2 py-1">
              <span className={cn("text-[11px] font-bold w-5 text-center",
                dark ? "text-slate-400" : "text-[#94A3B8]")}>{pos + 1}.</span>
              <span className="text-sm flex-1">{item.emoji} {item.text}</span>
              <div className="flex gap-0.5">
                <button type="button" onClick={() => moveUp(pos)}
                  className={cn("text-xs px-1 rounded transition-colors",
                    dark ? "text-slate-400 hover:text-white" : "text-[#94A3B8] hover:text-[#1E293B]")}>↑</button>
                <button type="button" onClick={() => moveDown(pos)}
                  className={cn("text-xs px-1 rounded transition-colors",
                    dark ? "text-slate-400 hover:text-white" : "text-[#94A3B8] hover:text-[#1E293B]")}>↓</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Single question editor ───────────────────────────────────
function QuestionEditor({ q, upd, dark }: { q: QuizQuestion; upd: (q: QuizQuestion) => void; dark?: boolean }) {
  const btnActive = dark
    ? "border-purple-500 bg-purple-950/40 text-purple-400"
    : "border-[#4A9B7F] bg-[#D1FAE5] dark:bg-[#064e35] text-[#4A9B7F]";
  const btnInactive = dark
    ? "border-white/10 text-slate-400 hover:border-purple-400 hover:text-purple-400"
    : "border-[#DDE8DF] dark:border-[#1E3524] text-[#5A7860] hover:border-[#4A9B7F] hover:text-[#4A9B7F]";

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div>
        <FL c="Question Type" dark={dark} />
        <div className="flex gap-2 flex-wrap">
          {(["multiple_choice", "ranking", "open_ended"] as QuizMode[]).map((m) => (
            <button key={m} type="button"
              onClick={() => upd({ ...q, mode: m })}
              className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all",
                q.mode === m ? btnActive : btnInactive)}>
              {MODE_ICONS[m]} {MODE_LABELS[m]}
            </button>
          ))}
        </div>
      </div>

      {/* Question text */}
      <div>
        <FL c="Question Text *" dark={dark} />
        <TF value={q.questionText} onChange={v => upd({ ...q, questionText: v })}
          placeholder="Type the question…" dark={dark} rows={3} />
      </div>

      {/* Mode-specific editor */}
      {q.mode === "multiple_choice" && (
        <div>
          <FL c="Answer Choices (click ○ to mark correct)" dark={dark} />
          <MCEditor q={q} upd={upd} dark={dark} />
        </div>
      )}
      {q.mode === "ranking" && (
        <div>
          <FL c="Items & Correct Order" dark={dark} />
          <RankEditor q={q} upd={upd} dark={dark} />
        </div>
      )}
      {q.mode === "open_ended" && (
        <div>
          <FL c="Answer Key (optional — leave blank to require teacher grading)" dark={dark} />
          <TF value={q.answerKey} onChange={v => upd({ ...q, answerKey: v })}
            placeholder="Type the expected answer for auto-scoring, or leave blank for manual grading…"
            dark={dark} />
        </div>
      )}

      {/* Hint + Max score */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FL c="Hint (optional)" dark={dark} />
          <TF value={q.hint} onChange={v => upd({ ...q, hint: v })} placeholder="Hint shown to students…" dark={dark} />
        </div>
        <div>
          <FL c="Max Score" dark={dark} />
          <input type="number" min={1} max={100} value={q.maxScore}
            onChange={e => upd({ ...q, maxScore: parseInt(e.target.value) || 10 })}
            className={cn("w-full rounded-lg border px-3 py-2 text-sm focus:outline-none",
              dark ? "border-white/10 bg-slate-800/60 text-white focus:ring-2 focus:ring-purple-500"
                   : "border-[#DDE8DF] dark:border-[#1E3524] bg-[#EBF0EC] dark:bg-[#0A180E] focus:border-[#4A9B7F]"
            )} />
        </div>
      </div>
    </div>
  );
}

// ─── Main quiz editor ─────────────────────────────────────────
interface ModuleQuizEditorProps {
  questions:  QuizQuestion[];
  onChange:   (q: QuizQuestion[]) => void;
  dark?:      boolean;
}

export default function ModuleQuizEditor({ questions, onChange, dark }: ModuleQuizEditorProps) {
  const [activeIdx, setActiveIdx] = useState(0);

  const addQ = () => {
    const next = [...questions, makeDefaultQuizQuestion(questions.length + 1)];
    onChange(next);
    setActiveIdx(next.length - 1);
  };
  const removeQ = (idx: number) => {
    const next = questions.filter((_, i) => i !== idx).map((q, i) => ({ ...q, questionNum: i + 1 }));
    onChange(next);
    setActiveIdx(Math.min(activeIdx, next.length - 1));
  };
  const updQ = (idx: number, q: QuizQuestion) => {
    onChange(questions.map((old, i) => i === idx ? q : old));
  };

  const cardCls = dark
    ? "bg-slate-900/60 border border-white/10 rounded-2xl p-5"
    : "bg-white dark:bg-[#132018] border border-[#DDE8DF] dark:border-[#1E3524] rounded-2xl p-5";

  const activeQ = questions[activeIdx];

  if (questions.length === 0) {
    return (
      <div className={cn("text-center py-10", cardCls)}>
        <p className={cn("text-sm mb-4", dark ? "text-slate-400" : "text-[#5A7860] dark:text-[#7BAF84]")}>
          No quiz questions yet. Add at least one question, or skip to proceed without a quiz.
        </p>
        <button type="button" onClick={addQ}
          className={cn("px-4 py-2 rounded-xl text-sm font-bold transition-all",
            dark ? "bg-purple-600 hover:bg-purple-500 text-white"
                 : "bg-[#4A9B7F] hover:bg-[#2E7A60] text-white")}>
          + Add First Question
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-4">
      {/* Question list */}
      <div className={cn("p-3 flex flex-col gap-1 h-fit rounded-2xl",
        dark ? "bg-slate-900/60 border border-white/10" : "bg-white dark:bg-[#132018] border border-[#DDE8DF] dark:border-[#1E3524]")}>
        {questions.map((q, i) => {
          const ok = q.questionText.trim().length > 0;
          return (
            <button key={i} type="button" onClick={() => setActiveIdx(i)}
              className={cn("flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left border transition-all group",
                activeIdx === i
                  ? dark ? "border-purple-500 bg-purple-950/30" : "border-[#4A9B7F] bg-[#D1FAE5] dark:bg-[#064e35]"
                  : dark ? "border-transparent hover:bg-slate-800/60" : "border-transparent hover:bg-[#EBF0EC] dark:hover:bg-[#0A180E]"
              )}>
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black shrink-0"
                style={{ background: ok ? "#4A9B7F" : "#E2E8F0", color: ok ? "#fff" : "#94A3B8" }}>
                {ok ? "✓" : i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn("text-[11px] font-bold truncate",
                  activeIdx === i ? (dark ? "text-purple-300" : "text-[#4A9B7F]") : (dark ? "text-slate-300" : ""))}>
                  Q{i + 1}: {q.questionText || "(no text)"}
                </p>
                <p className={cn("text-[10px]", dark ? "text-slate-500" : "text-[#94A3B8]")}>
                  {MODE_ICONS[q.mode]} {MODE_LABELS[q.mode]}
                </p>
              </div>
              {questions.length > 1 && (
                <button type="button" onClick={e => { e.stopPropagation(); removeQ(i); }}
                  className="opacity-0 group-hover:opacity-100 text-xs font-bold transition-opacity px-1 text-[#E05C5C]">×</button>
              )}
            </button>
          );
        })}
        <button type="button" onClick={addQ}
          className={cn("mt-1 flex items-center justify-center gap-1 px-3 py-2 rounded-xl border-2 border-dashed text-[11px] font-bold transition-colors",
            dark ? "border-slate-600 text-slate-400 hover:border-purple-500 hover:text-purple-400"
                 : "border-[#DDE8DF] dark:border-[#1E3524] text-[#5A7860] hover:border-[#4A9B7F] hover:text-[#4A9B7F]")}>
          + Add Question
        </button>
      </div>

      {/* Editor panel */}
      {activeQ && (
        <div className={cardCls}>
          <div className="flex items-center justify-between mb-4">
            <span className={cn("font-bold text-sm", dark ? "text-white" : "")}>Question {activeQ.questionNum}</span>
            <span className={cn("text-[11px]", dark ? "text-slate-500" : "text-[#94A3B8]")}>{questions.length} total</span>
          </div>
          <QuestionEditor q={activeQ} upd={q => updQ(activeIdx, q)} dark={dark} />
        </div>
      )}
    </div>
  );
}
