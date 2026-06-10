// app/dashboard/teacher/tests/[id]/edit/_components/EditTestClient.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import type { EditTestData, EditTestQuestion } from "../page";

// ─── Types ────────────────────────────────────────────────────
type TestType   = "PRE_TEST" | "POST_TEST";
type AnswerType = "number" | "text" | "time" | "multiple_choice";
type Difficulty = "easy" | "average" | "difficult";
type Step       = "info" | "questions" | "review";

const CHOICE_LETTERS = ["A", "B", "C", "D"] as const;
type ChoiceLetter = typeof CHOICE_LETTERS[number];

interface QuestionDraft {
  questionNum:  number;
  context:      string;
  questionText: string;
  answerType:   AnswerType;
  answer:       string;
  choices:      [string, string, string, string];
  difficulty:   Difficulty;
  melc:         string;
  points:       number;
}

interface TestInfo {
  title:       string;
  type:        TestType;
  description: string;
  timeLimit:   string;
  moduleId:    string;
}

interface ContextOption { id: number; label: string; icon: string }
interface ModuleOption  { id: number; title: string; icon: string }

// ─── Constants ────────────────────────────────────────────────
const DIFFICULTY_META: Record<Difficulty, { label: string; color: string; bg: string }> = {
  easy:      { label: "Easy",    color: "#4A9B7F", bg: "#D1FAE5" },
  average:   { label: "Average", color: "#3B82C4", bg: "#DBEAFE" },
  difficult: { label: "Hard",    color: "#E05C5C", bg: "#FEE2E2" },
};

const OPEN_ANSWER_TYPES: { value: AnswerType; label: string }[] = [
  { value: "number", label: "Number" },
  { value: "text",   label: "Text" },
  { value: "time",   label: "Time (hh:mm)" },
];

// ─── Helpers ─────────────────────────────────────────────────
function makeQuestion(num: number): QuestionDraft {
  return { questionNum: num, context: "", questionText: "", answerType: "number", answer: "", choices: ["", "", "", ""], difficulty: "average", melc: "", points: 1 };
}

function fromExisting(q: EditTestQuestion): QuestionDraft {
  return {
    questionNum:  q.questionNum,
    context:      q.context,
    questionText: q.questionText,
    answerType:   q.answerType as AnswerType,
    answer:       q.answer,
    choices:      q.choices ?? ["", "", "", ""],
    difficulty:   q.difficulty as Difficulty,
    melc:         q.melc,
    points:       q.points,
  };
}

function questionOk(q: QuestionDraft): boolean {
  if (!q.questionText.trim()) return false;
  if (q.answerType === "multiple_choice") {
    return q.choices.every((c) => c.trim() !== "") &&
      (q.answer === "A" || q.answer === "B" || q.answer === "C" || q.answer === "D");
  }
  return q.answer.trim() !== "";
}

// ─── Shared UI ────────────────────────────────────────────────
function Lbl({ c }: { c: string }) {
  return <label className="block text-[11px] font-extrabold tracking-widest uppercase text-[#5A7860] dark:text-[#7BAF84] mb-1.5">{c}</label>;
}
function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("bg-white dark:bg-[#132018] border border-[#DDE8DF] dark:border-[#1E3524] rounded-2xl p-6 flex flex-col gap-5", className)}>
      {children}
    </div>
  );
}
function TA({ v, onChange, ph, rows = 3 }: { v: string; onChange: (s: string) => void; ph?: string; rows?: number }) {
  return (
    <textarea value={v} onChange={(e) => onChange(e.target.value)} placeholder={ph} rows={rows}
      className="w-full bg-[#EBF0EC] dark:bg-[#0A180E] border border-[#DDE8DF] dark:border-[#1E3524] focus:border-[#4A9B7F] rounded-xl px-3.5 py-2.5 text-sm resize-none outline-none transition-colors" />
  );
}
function Sel({ value, onChange, children }: { value: string; onChange: (s: string) => void; children: React.ReactNode }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full bg-[#EBF0EC] dark:bg-[#0A180E] border border-[#DDE8DF] dark:border-[#1E3524] focus:border-[#4A9B7F] rounded-xl px-3.5 h-11 text-sm outline-none transition-colors">
      {children}
    </select>
  );
}

// ─── MC choice editor ─────────────────────────────────────────
function MCEditor({ q, upd }: { q: QuestionDraft; upd: (q: QuestionDraft) => void }) {
  const setChoice = (idx: number, val: string) => {
    const next = [...q.choices] as [string, string, string, string];
    next[idx] = val;
    upd({ ...q, choices: next });
  };
  return (
    <div className="flex flex-col gap-3">
      <Lbl c="Answer Choices" />
      {CHOICE_LETTERS.map((letter, idx) => {
        const isCorrect = q.answer === letter;
        return (
          <div key={letter} className="flex items-center gap-2">
            <button type="button" onClick={() => upd({ ...q, answer: letter })}
              className={cn("w-8 h-8 rounded-full border-2 flex items-center justify-center text-[12px] font-extrabold shrink-0 transition-all",
                isCorrect ? "border-[#4A9B7F] bg-[#4A9B7F] text-white" : "border-[#DDE8DF] dark:border-[#1E3524] text-[#92A894] hover:border-[#4A9B7F]")}>
              {letter}
            </button>
            <Input value={q.choices[idx]} onChange={(e) => setChoice(idx, e.target.value)} placeholder={`Choice ${letter}…`}
              className={cn("flex-1 bg-[#EBF0EC] dark:bg-[#0A180E] border-[#DDE8DF] dark:border-[#1E3524] focus-visible:border-[#4A9B7F] rounded-xl h-10",
                isCorrect && "border-[#4A9B7F] bg-[#D1FAE5] dark:bg-[#064e35]")} />
            {isCorrect && <span className="text-[10px] font-bold text-[#4A9B7F] shrink-0">✓ Correct</span>}
          </div>
        );
      })}
      <p className="text-[10px] text-[#92A894]">Click a letter circle to mark it as the correct answer.</p>
    </div>
  );
}

// ─── MC preview ───────────────────────────────────────────────
function MCPreview({ q }: { q: QuestionDraft }) {
  return (
    <div className="grid grid-cols-2 gap-2 mt-2">
      {CHOICE_LETTERS.map((letter, idx) => {
        const isCorrect = q.answer === letter;
        return (
          <div key={letter} className={cn("flex items-center gap-2 px-3 py-2 rounded-xl border text-xs",
            isCorrect ? "border-[#4A9B7F] bg-[#D1FAE5] dark:bg-[#064e35] font-bold" : "border-[#DDE8DF] dark:border-[#1E3524] bg-[#EBF0EC] dark:bg-[#0A180E]")}>
            <span className={cn("w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0",
              isCorrect ? "bg-[#4A9B7F] text-white" : "bg-[#DDE8DF] dark:bg-[#1E3524] text-[#92A894]")}>{letter}</span>
            <span className="truncate">{q.choices[idx] || <span className="italic text-[#92A894]">Choice {letter}</span>}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Step 1 — Info ────────────────────────────────────────────
function StepInfo({ info, onChange, onNext, modules }: {
  info: TestInfo; onChange: (i: TestInfo) => void; onNext: () => void; modules: ModuleOption[];
}) {
  const ok = info.title.trim().length >= 3;
  return (
    <div className="max-w-xl mx-auto fade-in">
      <div className="mb-7">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-widest uppercase text-[#4A9B7F] bg-[#D1FAE5] dark:bg-[#064e35] px-3 py-1 rounded-full border border-[#4A9B7F] mb-3">Step 1 of 3</span>
        <h1 className="font-nunito text-2xl font-black">Test Details</h1>
        <p className="text-sm text-[#5A7860] dark:text-[#7BAF84] mt-1">Update the test set info.</p>
      </div>
      <Card>
        <div>
          <Lbl c="Test Title *" />
          <Input value={info.title} onChange={(e) => onChange({ ...info, title: e.target.value })}
            placeholder="e.g. Grade 6 Math Pre-test — Module 1"
            className="bg-[#EBF0EC] dark:bg-[#0A180E] border-[#DDE8DF] dark:border-[#1E3524] focus-visible:border-[#4A9B7F] rounded-xl h-11 font-nunito font-bold" />
        </div>
        <div>
          <Lbl c="Test Type *" />
          <div className="grid grid-cols-2 gap-3">
            {(["PRE_TEST", "POST_TEST"] as TestType[]).map((t) => (
              <button key={t} onClick={() => onChange({ ...info, type: t })}
                className={cn("flex flex-col items-start gap-1 p-4 rounded-xl border-2 transition-all text-left",
                  info.type === t ? "border-[#4A9B7F] bg-[#D1FAE5] dark:bg-[#064e35]"
                    : "border-[#DDE8DF] dark:border-[#1E3524] bg-[#EBF0EC] dark:bg-[#0A180E] hover:border-[#4A9B7F]")}>
                <span className="text-xl">{t === "PRE_TEST" ? "📋" : "✅"}</span>
                <span className="font-nunito font-extrabold text-sm">{t === "PRE_TEST" ? "Pre-test" : "Post-test"}</span>
                <span className="text-[11px] text-[#5A7860] dark:text-[#7BAF84]">
                  {t === "PRE_TEST" ? "Establishes baseline before the module" : "Measures learning gain after module"}
                </span>
              </button>
            ))}
          </div>
        </div>
        <div>
          <Lbl c="Linked Module (optional)" />
          <Sel value={info.moduleId} onChange={(v) => onChange({ ...info, moduleId: v })}>
            <option value="">— Not linked to a module —</option>
            {modules.map((m) => (
              <option key={m.id} value={String(m.id)}>{m.icon} {m.title}</option>
            ))}
          </Sel>
          <p className="text-[10px] text-[#92A894] mt-1">Link this test to a module so it appears on the module card.</p>
        </div>
        <div>
          <Lbl c="Description (optional)" />
          <TA v={info.description} onChange={(v) => onChange({ ...info, description: v })} ph="Brief description…" rows={2} />
        </div>
        <div>
          <Lbl c="Time Limit (minutes) — leave blank for untimed" />
          <Input type="number" min={0} value={info.timeLimit}
            onChange={(e) => onChange({ ...info, timeLimit: e.target.value })}
            placeholder="e.g. 45 — blank = no time limit"
            className="bg-[#EBF0EC] dark:bg-[#0A180E] border-[#DDE8DF] dark:border-[#1E3524] focus-visible:border-[#4A9B7F] rounded-xl h-11" />
        </div>
      </Card>
      <div className="flex justify-end mt-6">
        <button onClick={onNext} disabled={!ok}
          className="px-7 py-3 rounded-xl font-nunito font-extrabold text-sm bg-[#4A9B7F] hover:bg-[#2E7A60] disabled:opacity-40 text-white shadow-[0_4px_14px_rgba(74,155,127,0.3)] transition-all">
          Next → Questions
        </button>
      </div>
    </div>
  );
}

// ─── Step 2 — Questions ───────────────────────────────────────
function StepQuestions({ questions, onChange, onNext, onBack, locked, contexts }: {
  questions: QuestionDraft[]; onChange: (q: QuestionDraft[]) => void;
  onNext: () => void; onBack: () => void; locked: boolean; contexts: ContextOption[];
}) {
  const [active, setActive] = useState(0);
  const q = questions[active];

  const upd = (updated: QuestionDraft) =>
    onChange(questions.map((item, i) => i === active ? updated : item));

  const addQ = () => {
    const next = [...questions, makeQuestion(questions.length + 1)];
    onChange(next);
    setActive(next.length - 1);
  };

  const removeQ = (idx: number) => {
    if (questions.length <= 1) return;
    const next = questions.filter((_, i) => i !== idx).map((item, i) => ({ ...item, questionNum: i + 1 }));
    onChange(next);
    setActive(Math.min(active, next.length - 1));
  };

  const isMC  = q?.answerType === "multiple_choice";
  const allOk = questions.length > 0 && questions.every(questionOk);

  return (
    <div className="max-w-5xl mx-auto fade-in">
      <div className="mb-6">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-widest uppercase text-[#4A9B7F] bg-[#D1FAE5] dark:bg-[#064e35] px-3 py-1 rounded-full border border-[#4A9B7F] mb-3">Step 2 of 3</span>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-nunito text-2xl font-black">Questions</h1>
            <p className="text-sm text-[#5A7860] dark:text-[#7BAF84] mt-0.5">
              {questions.length} question{questions.length !== 1 ? "s" : ""}
              {locked && " — locked (students have already submitted)"}
            </p>
          </div>
          {!locked && (
            <button onClick={addQ} className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-nunito font-bold text-sm bg-[#4A9B7F] hover:bg-[#2E7A60] text-white transition-all">
              + Add Question
            </button>
          )}
        </div>
      </div>

      {locked && (
        <div className="mb-5 flex items-start gap-3 px-5 py-4 bg-[#FEF3C7] dark:bg-[#3d2800] border border-[#F59E0B] rounded-2xl">
          <span className="text-xl shrink-0">🔒</span>
          <div>
            <p className="font-bold text-[14px] text-[#92400E] dark:text-[#F59E0B]">Questions are locked</p>
            <p className="text-sm text-[#92400E] dark:text-[#F59E0B] mt-0.5">
              Students have already submitted answers. Questions cannot be changed to preserve result integrity.
              You can still edit the title, description, and time limit.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4">
        {/* Question list */}
        <div className="bg-white dark:bg-[#132018] border border-[#DDE8DF] dark:border-[#1E3524] rounded-2xl p-3 flex flex-col gap-1 h-fit">
          {questions.map((item, i) => {
            const ok   = questionOk(item);
            const diff = DIFFICULTY_META[item.difficulty];
            return (
              <button key={i} onClick={() => setActive(i)}
                className={cn("flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left border transition-all group",
                  active === i ? "border-[#4A9B7F] bg-[#D1FAE5] dark:bg-[#064e35]" : "border-transparent hover:bg-[#EBF0EC] dark:hover:bg-[#0A180E]")}>
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0"
                  style={{ background: ok ? "#4A9B7F" : "#E2E8F0", color: ok ? "#fff" : "#94A3B8" }}>
                  {ok ? "✓" : i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-[12px] font-bold truncate", active === i && "text-[#4A9B7F]")}>
                    {item.questionText || `Question ${i + 1}`}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {item.answerType === "multiple_choice" && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#EDE9FE] text-[#8B5CF6]">MC</span>}
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: diff.bg, color: diff.color }}>{diff.label}</span>
                    <span className="text-[10px] text-[#92A894]">{item.points}pt</span>
                  </div>
                </div>
                {!locked && questions.length > 1 && (
                  <button onClick={(e) => { e.stopPropagation(); removeQ(i); }}
                    className="opacity-0 group-hover:opacity-100 text-[#E05C5C] text-xs font-bold transition-opacity px-1">×</button>
                )}
              </button>
            );
          })}
          {!locked && (
            <button onClick={addQ}
              className="mt-1 flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl border-2 border-dashed border-[#DDE8DF] dark:border-[#1E3524] text-[12px] font-bold text-[#5A7860] dark:text-[#7BAF84] hover:border-[#4A9B7F] hover:text-[#4A9B7F] transition-colors">
              + Add Question
            </button>
          )}
        </div>

        {/* Question editor / read-only view */}
        {q && (
          <Card key={active}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#4A9B7F] text-white flex items-center justify-center text-sm font-black font-nunito">{q.questionNum}</div>
                <span className="font-nunito font-extrabold text-[15px]">Question {q.questionNum}</span>
              </div>
              <span className="text-[11px] text-[#92A894]">{questions.length} total</span>
            </div>

            {locked ? (
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#5A7860] dark:text-[#7BAF84] mb-1">Question</p>
                  <p className="text-sm font-semibold">{q.questionText}</p>
                </div>
                {q.context && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#5A7860] dark:text-[#7BAF84] mb-1">Context</p>
                    <p className="text-sm">{q.context}</p>
                  </div>
                )}
                {q.answerType === "multiple_choice" ? (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#5A7860] dark:text-[#7BAF84] mb-2">Choices</p>
                    <MCPreview q={q} />
                  </div>
                ) : (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#5A7860] dark:text-[#7BAF84] mb-1">Correct Answer</p>
                    <p className="text-sm font-bold text-[#4A9B7F]">{q.answer} <span className="text-[10px] font-normal text-[#92A894]">({q.answerType})</span></p>
                  </div>
                )}
                <div className="flex gap-4 text-[11px]">
                  <span className="font-bold px-2 py-0.5 rounded-full" style={{ background: DIFFICULTY_META[q.difficulty as Difficulty]?.bg, color: DIFFICULTY_META[q.difficulty as Difficulty]?.color }}>
                    {DIFFICULTY_META[q.difficulty as Difficulty]?.label}
                  </span>
                  <span className="text-[#92A894]">{q.points} pt{q.points !== 1 ? "s" : ""}</span>
                  {q.melc && <span className="text-[#92A894] font-mono">{q.melc}</span>}
                </div>
              </div>
            ) : (
              <>
                <div>
                  <Lbl c="Question Type" />
                  <div className="flex gap-2">
                    <button onClick={() => upd({ ...q, answerType: "number", answer: "", choices: ["", "", "", ""] })}
                      className={cn("flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold border-2 transition-all",
                        !isMC ? "border-[#4A9B7F] bg-[#D1FAE5] dark:bg-[#064e35] text-[#4A9B7F]"
                               : "border-[#DDE8DF] dark:border-[#1E3524] text-[#5A7860] hover:border-[#4A9B7F]")}>
                      ✏️ Open Answer
                    </button>
                    <button onClick={() => upd({ ...q, answerType: "multiple_choice", answer: "" })}
                      className={cn("flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold border-2 transition-all",
                        isMC ? "border-[#8B5CF6] bg-[#EDE9FE] dark:bg-[#2e1065] text-[#8B5CF6]"
                              : "border-[#DDE8DF] dark:border-[#1E3524] text-[#5A7860] hover:border-[#8B5CF6]")}>
                      🔘 Multiple Choice
                    </button>
                  </div>
                </div>
                <div>
                  <Lbl c="Context / Scenario" />
                  <Sel value={q.context} onChange={(v) => upd({ ...q, context: v })}>
                    <option value="">— Select context —</option>
                    {contexts.map((c) => (
                      <option key={c.id} value={c.label}>{c.icon} {c.label}</option>
                    ))}
                  </Sel>
                </div>
                <div>
                  <Lbl c="Question Text *" />
                  <TA v={q.questionText} onChange={(v) => upd({ ...q, questionText: v })} ph="Type the question…" rows={4} />
                </div>
                {isMC ? (
                  <MCEditor q={q} upd={upd} />
                ) : (
                  <div className="grid grid-cols-[1fr_160px] gap-3">
                    <div>
                      <Lbl c="Correct Answer *" />
                      <Input value={q.answer} onChange={(e) => upd({ ...q, answer: e.target.value })}
                        placeholder={q.answerType === "number" ? "e.g. 120" : q.answerType === "time" ? "e.g. 1:30" : "e.g. Rice"}
                        className="bg-[#EBF0EC] dark:bg-[#0A180E] border-[#DDE8DF] dark:border-[#1E3524] focus-visible:border-[#4A9B7F] rounded-xl h-11" />
                    </div>
                    <div>
                      <Lbl c="Answer Type" />
                      <Sel value={q.answerType} onChange={(v) => upd({ ...q, answerType: v as AnswerType })}>
                        {OPEN_ANSWER_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </Sel>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Lbl c="Difficulty" />
                    <Sel value={q.difficulty} onChange={(v) => upd({ ...q, difficulty: v as Difficulty })}>
                      <option value="easy">Easy</option>
                      <option value="average">Average</option>
                      <option value="difficult">Difficult</option>
                    </Sel>
                  </div>
                  <div>
                    <Lbl c="Points" />
                    <Input type="number" min={1} max={10} value={q.points}
                      onChange={(e) => upd({ ...q, points: parseInt(e.target.value) || 1 })}
                      className="bg-[#EBF0EC] dark:bg-[#0A180E] border-[#DDE8DF] dark:border-[#1E3524] focus-visible:border-[#4A9B7F] rounded-xl h-11" />
                  </div>
                  <div>
                    <Lbl c="MELC Code" />
                    <Input value={q.melc} onChange={(e) => upd({ ...q, melc: e.target.value })}
                      placeholder="M6NS-IIi-147"
                      className="bg-[#EBF0EC] dark:bg-[#0A180E] border-[#DDE8DF] dark:border-[#1E3524] focus-visible:border-[#4A9B7F] rounded-xl h-11" />
                  </div>
                </div>
                <div className="p-4 bg-[#EBF0EC] dark:bg-[#0A180E] rounded-xl border border-[#DDE8DF] dark:border-[#1E3524]">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#5A7860] dark:text-[#7BAF84] mb-2">Student Preview</p>
                  <p className="text-xs font-bold mb-1">
                    <span className={cn("mr-1", isMC ? "text-[#8B5CF6]" : "text-[#4A9B7F]")}>#{q.questionNum}</span>
                    {q.questionText || <span className="text-[#92A894] italic">Question text will appear here…</span>}
                  </p>
                  {q.context && <p className="text-[10px] text-[#5A7860] dark:text-[#7BAF84] mb-2">Context: {q.context}</p>}
                  {isMC ? <MCPreview q={q} /> : (
                    <div className="mt-1 h-8 bg-white dark:bg-[#132018] rounded-lg border border-[#DDE8DF] dark:border-[#1E3524] flex items-center px-3">
                      <span className="text-[11px] text-[#92A894]">
                        Student answer field ({OPEN_ANSWER_TYPES.find((t) => t.value === q.answerType)?.label})
                      </span>
                    </div>
                  )}
                </div>
              </>
            )}
          </Card>
        )}
      </div>

      <div className="flex items-center justify-between mt-6">
        <button onClick={onBack}
          className="px-5 py-3 rounded-xl font-nunito font-bold text-sm border border-[#DDE8DF] dark:border-[#1E3524] text-[#5A7860] hover:border-[#4A9B7F] hover:text-[#4A9B7F] transition-all">
          ← Back
        </button>
        <span className="text-xs">
          {locked
            ? <span className="text-[#F59E0B] font-semibold">🔒 Questions locked — view only</span>
            : allOk
              ? <span className="text-[#4A9B7F] font-bold">✓ All questions complete</span>
              : <span className="text-[#F59E0B]">⚠️ Fill in all required fields</span>}
        </span>
        <button onClick={onNext} disabled={!locked && !allOk}
          className="px-7 py-3 rounded-xl font-nunito font-extrabold text-sm bg-[#4A9B7F] hover:bg-[#2E7A60] disabled:opacity-40 text-white shadow-[0_4px_14px_rgba(74,155,127,0.3)] transition-all">
          Next → Review
        </button>
      </div>
    </div>
  );
}

// ─── Step 3 — Review & Save ───────────────────────────────────
function StepReview({ info, questions, onBack, onSave, saving, locked, modules }: {
  info: TestInfo; questions: QuestionDraft[]; onBack: () => void;
  onSave: () => void; saving: boolean; locked: boolean; modules: ModuleOption[];
}) {
  const totalPoints = questions.reduce((a, q) => a + q.points, 0);
  const mcCount     = questions.filter((q) => q.answerType === "multiple_choice").length;
  const openCount   = questions.length - mcCount;
  const diffCounts  = { easy: 0, average: 0, difficult: 0 };
  questions.forEach((q) => { diffCounts[q.difficulty as Difficulty]++; });

  const linkedModule = info.moduleId
    ? modules.find((m) => String(m.id) === info.moduleId)
    : null;

  return (
    <div className="max-w-3xl mx-auto fade-in">
      <div className="mb-7">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-widest uppercase text-[#4A9B7F] bg-[#D1FAE5] dark:bg-[#064e35] px-3 py-1 rounded-full border border-[#4A9B7F] mb-3">Step 3 of 3</span>
        <h1 className="font-nunito text-2xl font-black">Review & Save Changes</h1>
        <p className="text-sm text-[#5A7860] dark:text-[#7BAF84] mt-1">Confirm your edits before saving.</p>
      </div>

      {locked && (
        <div className="mb-4 flex items-center gap-2.5 px-4 py-3 bg-[#FEF3C7] dark:bg-[#3d2800] border border-[#F59E0B] rounded-xl">
          <span>🔒</span>
          <p className="text-sm font-semibold text-[#92400E] dark:text-[#F59E0B]">
            Only metadata (title, type, description, time limit, linked module) will be saved — questions are unchanged.
          </p>
        </div>
      )}

      <div className="bg-white dark:bg-[#132018] border border-[#DDE8DF] dark:border-[#1E3524] rounded-2xl overflow-hidden mb-4">
        <div className="px-6 py-4 border-b border-[#DDE8DF] dark:border-[#1E3524]" style={{ background: "#4A9B7F18" }}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{info.type === "PRE_TEST" ? "📋" : "✅"}</span>
            <div>
              <h2 className="font-nunito font-extrabold text-[17px]">{info.title}</h2>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#D1FAE5] dark:bg-[#064e35] text-[#4A9B7F]">
                  {info.type === "PRE_TEST" ? "Pre-test" : "Post-test"}
                </span>
                {linkedModule && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#DBEAFE] dark:bg-[#1e3a5f] text-[#3B82C4]">
                    {linkedModule.icon} {linkedModule.title}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 divide-x divide-[#DDE8DF] dark:divide-[#1E3524] border-b border-[#DDE8DF] dark:border-[#1E3524]">
          {[
            { label: "Questions",    value: questions.length },
            { label: "Total Points", value: totalPoints },
            { label: "Time Limit",   value: info.timeLimit ? `${info.timeLimit} min` : "Untimed" },
          ].map(({ label, value }) => (
            <div key={label} className="px-5 py-4 text-center">
              <p className="font-nunito text-xl font-extrabold">{value}</p>
              <p className="text-[11px] text-[#5A7860] dark:text-[#7BAF84]">{label}</p>
            </div>
          ))}
        </div>

        {!locked && (
          <div className="px-6 py-4 flex items-center gap-4 text-[12px] border-b border-[#DDE8DF] dark:border-[#1E3524] flex-wrap">
            <span className="font-bold text-[#5A7860] dark:text-[#7BAF84]">Question types:</span>
            {mcCount > 0 && <span className="font-bold px-2 py-0.5 rounded-full bg-[#EDE9FE] text-[#8B5CF6]">🔘 Multiple Choice: {mcCount}</span>}
            {openCount > 0 && <span className="font-bold px-2 py-0.5 rounded-full bg-[#D1FAE5] text-[#4A9B7F]">✏️ Open Answer: {openCount}</span>}
          </div>
        )}

        {info.description && (
          <div className="px-6 py-4 border-b border-[#DDE8DF] dark:border-[#1E3524]">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#5A7860] dark:text-[#7BAF84] mb-1">Description</p>
            <p className="text-sm">{info.description}</p>
          </div>
        )}

        {!locked && (
          <div className="px-6 py-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#5A7860] dark:text-[#7BAF84] mb-3">Questions</p>
            <div className="flex flex-col gap-2">
              {questions.map((q, i) => {
                const diff  = DIFFICULTY_META[q.difficulty];
                const isMCQ = q.answerType === "multiple_choice";
                return (
                  <div key={i} className="flex items-start gap-3 px-4 py-3 bg-[#EBF0EC] dark:bg-[#0A180E] rounded-xl">
                    <div className="w-6 h-6 rounded-full bg-[#4A9B7F] text-white flex items-center justify-center text-[11px] font-black shrink-0 mt-0.5">{q.questionNum}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold">{q.questionText}</p>
                      {isMCQ ? (
                        <div className="flex flex-col gap-1 mt-1.5">
                          {CHOICE_LETTERS.map((letter, idx) => (
                            <p key={letter} className={cn("text-[11px]", q.answer === letter ? "font-bold text-[#4A9B7F]" : "text-[#92A894]")}>
                              {letter}. {q.choices[idx]} {q.answer === letter && "← correct"}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: diff.bg, color: diff.color }}>{diff.label}</span>
                          <span className="text-[10px] text-[#92A894]">Ans: <strong>{q.answer}</strong></span>
                          {q.melc && <span className="text-[10px] text-[#5A7860] dark:text-[#7BAF84] font-mono">{q.melc}</span>}
                        </div>
                      )}
                    </div>
                    <span className="text-[11px] font-bold text-[#5A7860] dark:text-[#7BAF84] shrink-0">{q.points}pt</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <button onClick={onBack} disabled={saving}
          className="px-5 py-3 rounded-xl font-nunito font-bold text-sm border border-[#DDE8DF] dark:border-[#1E3524] text-[#5A7860] hover:border-[#4A9B7F] hover:text-[#4A9B7F] transition-all disabled:opacity-40">
          ← Back
        </button>
        <button onClick={onSave} disabled={saving}
          className="px-8 py-3 rounded-xl font-nunito font-extrabold text-sm bg-[#4A9B7F] hover:bg-[#2E7A60] disabled:opacity-50 text-white shadow-[0_4px_14px_rgba(74,155,127,0.3)] transition-all">
          {saving ? "Saving…" : "✅ Save Changes"}
        </button>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────
export default function EditTestClient({ data }: { data: EditTestData }) {
  const router = useRouter();
  const locked = data.resultCount > 0;
  const STEPS: Step[] = ["info", "questions", "review"];

  const [step,      setStep]      = useState<Step>("info");
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState("");
  const [contexts,  setContexts]  = useState<ContextOption[]>([]);
  const [modules,   setModules]   = useState<ModuleOption[]>([]);
  const [info,      setInfo]      = useState<TestInfo>({
    title:       data.title,
    type:        data.type,
    description: data.description,
    timeLimit:   data.timeLimit,
    moduleId:    data.moduleId ? String(data.moduleId) : "",
  });
  const [questions, setQuestions] = useState<QuestionDraft[]>(
    data.questions.map(fromExisting)
  );

  useEffect(() => {
    fetch("/api/contexts")
      .then((r) => r.json())
      .then((d) => { if (d.success) setContexts(d.contexts); })
      .catch(() => {});
    fetch("/api/teacher/modules", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { if (d.success) setModules(d.modules); })
      .catch(() => {});
  }, []);

  const stepIdx = STEPS.indexOf(step);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const body: Record<string, unknown> = {
        title:       info.title,
        type:        info.type,
        description: info.description || null,
        timeLimit:   info.timeLimit ? parseInt(info.timeLimit) * 60 : null,
        moduleId:    info.moduleId ? parseInt(info.moduleId) : null,
      };

      if (!locked) {
        body.questions = questions.map((q) => ({
          questionNum:  q.questionNum,
          context:      q.context || "General",
          questionText: q.questionText,
          answer:       q.answer,
          answerType:   q.answerType,
          choices:      q.answerType === "multiple_choice" ? q.choices : null,
          difficulty:   q.difficulty,
          melc:         q.melc || null,
          points:       q.points,
        }));
      }

      const res  = await fetch(`/api/teacher/tests/${data.id}`, {
        method:      "PUT",
        headers:     { "Content-Type": "application/json" },
        credentials: "include",
        body:        JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) { setError(json.error ?? "Failed to save."); setSaving(false); return; }
      router.push("/dashboard/teacher/tests");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setSaving(false);
    }
  };

  return (
    <>
      <style>{`
        .font-nunito { font-family: var(--font-nunito, 'Nunito', sans-serif); }
        @keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:none; } }
        .fade-in { animation: fadeIn 0.3s ease forwards; }
      `}</style>

      <div className="min-h-screen bg-[#F0F4F1] dark:bg-[#0A180E] text-[#1E293B] dark:text-[#E8F5EC]">
        <div className="sticky top-0 z-10 bg-white dark:bg-[#132018] border-b border-[#DDE8DF] dark:border-[#1E3524] px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/dashboard/teacher/tests")}
              className="text-sm font-bold text-[#5A7860] dark:text-[#7BAF84] hover:text-[#4A9B7F] transition-colors">
              ← Tests
            </button>
            <span className="text-[#DDE8DF] dark:text-[#1E3524]">/</span>
            <span className="font-nunito font-extrabold text-[15px]">Edit: {data.title}</span>
            {locked && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FEF3C7] dark:bg-[#3d2800] text-[#F59E0B]">
                🔒 Questions locked
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-1">
                <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-extrabold transition-all",
                  stepIdx >= i ? "bg-[#4A9B7F] text-white" : "bg-[#EBF0EC] dark:bg-[#0A180E] text-[#92A894]")}>
                  {stepIdx > i ? "✓" : i + 1}
                </div>
                {i < 2 && <div className={cn("w-8 h-0.5 rounded-full", stepIdx > i ? "bg-[#4A9B7F]" : "bg-[#DDE8DF] dark:bg-[#1E3524]")} />}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="mx-8 mt-4 px-4 py-3 bg-[#FEE2E2] dark:bg-[#450a0a] border border-[#E05C5C] rounded-xl text-sm text-[#E05C5C] font-semibold">
            ⚠️ {error}
          </div>
        )}

        <div className="p-8">
          {step === "info"      && <StepInfo info={info} onChange={setInfo} onNext={() => setStep("questions")} modules={modules} />}
          {step === "questions" && <StepQuestions questions={questions} onChange={setQuestions} onBack={() => setStep("info")} onNext={() => setStep("review")} locked={locked} contexts={contexts} />}
          {step === "review"    && <StepReview info={info} questions={questions} onBack={() => setStep("questions")} onSave={handleSave} saving={saving} locked={locked} modules={modules} />}
        </div>
      </div>
    </>
  );
}
