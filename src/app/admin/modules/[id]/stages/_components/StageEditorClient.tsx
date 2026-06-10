// StageEditorClient.tsx
// Admin-only stage content editor. Two-pane: stage list (left) + structured form (right).
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { ModuleEditorData, StageData } from "../page";

// ─── Constants ────────────────────────────────────────────────

const PHASE_META: Record<string, { label: string; color: string; lt: string }> = {
  UNDERSTANDING: { label: "Understanding", color: "#3B82C4", lt: "#DBEAFE" },
  ANALYSIS:      { label: "Analysis",      color: "#8B5CF6", lt: "#EDE9FE" },
  SOLUTION:      { label: "Solution",      color: "#F59E0B", lt: "#FEF3C7" },
  REFLECTION:    { label: "Reflection",    color: "#4A9B7F", lt: "#D1FAE5" },
};

const TYPE_LABEL: Record<string, string> = {
  MULTIPLE_CHOICE:    "Multiple Choice",
  RANKING:            "Drag-to-Rank",
  OPEN_ENDED:         "Open Ended",
  TABLE_INPUT:        "Table Input",
  CHECKLIST:          "Checklist",
  ROOT_CAUSE_PROMPTS: "Root Cause Prompts",
  COMPUTATION:        "Budget Calc",
  MULTI_PLAN:         "Multi-Plan",
  BUDGET_CHECK:       "Trial / Budget Check",
  SELECT_JUSTIFY:     "Select + Justify",
  REFLECTION_SLIDER:  "Reflection Slider",
};

// Valid DB enum values in display order
const ALL_TYPES: string[] = [
  "MULTIPLE_CHOICE", "RANKING", "OPEN_ENDED", "TABLE_INPUT",
  "CHECKLIST", "COMPUTATION", "MULTI_PLAN", "BUDGET_CHECK",
  "SELECT_JUSTIFY", "REFLECTION_SLIDER",
];

// Minimal valid defaults when switching to a new type
const TYPE_DEFAULTS: Record<string, { options: Record<string, unknown>; correctAnswer: string }> = {
  MULTIPLE_CHOICE:   { options: { choices: [], correctChoiceIndex: 0 }, correctAnswer: "" },
  RANKING:           { options: { rankItems: [] }, correctAnswer: "" },
  OPEN_ENDED:        { options: { starterChips: [], minChars: 50 }, correctAnswer: "" },
  TABLE_INPUT:       { options: { tableRows: [] }, correctAnswer: "" },
  CHECKLIST:         { options: { checkItems: [] }, correctAnswer: "{}" },
  COMPUTATION:       { options: { calcItems: [], budget: 0 }, correctAnswer: "" },
  MULTI_PLAN:        { options: { planLabels: ["Plan A", "Plan B"], planFields: [], planBudget: 0 }, correctAnswer: "" },
  BUDGET_CHECK:      { options: { trialItems: [], trialBudget: 0 }, correctAnswer: "" },
  SELECT_JUSTIFY:    { options: { planLabels: ["Plan A", "Plan B"], justifyLabel: "📝 Justify your choice" }, correctAnswer: "" },
  REFLECTION_SLIDER: { options: { sliderQuestions: [], openReflections: [] }, correctAnswer: "" },
};

// Default title + type per stage number — mirrors the /new page creation logic
const DEFAULT_TITLES: Record<number, string> = {
  1: "Identify & Categorize",    2: "Select & Prioritize",
  3: "Define the Problem",       4: "Analyze the Information",
  5: "Identify Constraints",     6: "Identify Root Causes",
  7: "Analyze Data",             8: "Develop Possible Solutions",
  9: "Anticipate Possible Problems", 10: "Trial Implementation",
  11: "Choose the Best Solution", 12: "Reflect & Review",
};
const DEFAULT_TYPE_BY_STAGE: Record<number, string> = {
  1: "MULTIPLE_CHOICE", 2: "RANKING",      3: "OPEN_ENDED",
  4: "TABLE_INPUT",     5: "CHECKLIST",    6: "OPEN_ENDED",
  7: "COMPUTATION",     8: "MULTI_PLAN",   9: "CHECKLIST",
  10: "BUDGET_CHECK",   11: "SELECT_JUSTIFY", 12: "REFLECTION_SLIDER",
};
function phaseOfStage(n: number): string {
  if (n <= 3)  return "UNDERSTANDING";
  if (n <= 7)  return "ANALYSIS";
  if (n <= 10) return "SOLUTION";
  return "REFLECTION";
}

// ─── Shared input style ───────────────────────────────────────

const inp = "px-3 py-1.5 rounded-lg border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-sm focus:outline-none focus:border-[#8B5CF6] w-full";
const inpSm = "px-2.5 py-1 rounded-lg border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-xs focus:outline-none focus:border-[#8B5CF6]";

// ─── Form state ───────────────────────────────────────────────

interface FormState {
  type:          string;
  title:         string;
  instruction:   string;
  hint:          string;
  maxScore:      string;
  timeLimit:     string;
  melc:          string;
  options:       Record<string, unknown>;
  correctAnswer: string; // serialized string as expected by API
}

function stageToForm(s: StageData): FormState {
  return {
    type:          s.type,
    title:         s.title,
    instruction:   s.instruction,
    hint:          s.hint ?? "",
    maxScore:      String(s.maxScore),
    timeLimit:     s.timeLimit != null ? String(s.timeLimit) : "",
    melc:          s.melc ?? "",
    options:       (s.options ?? {}) as Record<string, unknown>,
    correctAnswer: s.correctAnswer ?? "",
  };
}

// ─── Shared list-row wrapper ──────────────────────────────────

function ListRow({
  children, onRemove, onMoveUp, onMoveDown, canMoveUp, canMoveDown,
}: {
  children: React.ReactNode;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  return (
    <div className="flex items-start gap-2 p-3 bg-[#F8FAFC] dark:bg-[#0F172A] rounded-xl border border-[#E2E8F0] dark:border-[#334155]">
      <div className="flex flex-col shrink-0 gap-0.5 mt-0.5">
        <button onClick={onMoveUp} disabled={!canMoveUp}
          className="w-5 h-5 rounded text-[10px] font-bold border border-[#E2E8F0] dark:border-[#334155] disabled:opacity-30 hover:bg-[#EEF2F8] dark:hover:bg-[#162032] transition-colors leading-none">
          ↑
        </button>
        <button onClick={onMoveDown} disabled={!canMoveDown}
          className="w-5 h-5 rounded text-[10px] font-bold border border-[#E2E8F0] dark:border-[#334155] disabled:opacity-30 hover:bg-[#EEF2F8] dark:hover:bg-[#162032] transition-colors leading-none">
          ↓
        </button>
      </div>
      <div className="flex-1 min-w-0">{children}</div>
      <button onClick={onRemove}
        className="text-xs text-[#E05C5C] hover:bg-[#FEE2E2] dark:hover:bg-[#450a0a] w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors">
        ✕
      </button>
    </div>
  );
}

function AddBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="w-full py-2 rounded-xl border border-dashed border-[#CBD5E1] dark:border-[#334155] text-xs font-bold text-[#64748B] hover:border-[#8B5CF6] hover:text-[#8B5CF6] hover:bg-[#F5F3FF] dark:hover:bg-[#2e1065] transition-all">
      ＋ {label}
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] mb-2">
      {children}
    </p>
  );
}

// ─── move helpers ─────────────────────────────────────────────

function moveUp<T>(arr: T[], i: number): T[] {
  if (i === 0) return arr;
  const a = [...arr]; [a[i - 1], a[i]] = [a[i], a[i - 1]]; return a;
}
function moveDown<T>(arr: T[], i: number): T[] {
  if (i >= arr.length - 1) return arr;
  const a = [...arr]; [a[i], a[i + 1]] = [a[i + 1], a[i]]; return a;
}
function removeAt<T>(arr: T[], i: number): T[] {
  return arr.filter((_, idx) => idx !== i);
}

// ─── Per-type option editors ──────────────────────────────────

// Stage 1: MULTIPLE_CHOICE
type Choice = { icon: string; title: string; desc: string };
function MultipleChoiceEditor({
  options, correctAnswer, onOptions, onCorrectAnswer,
}: {
  options: Record<string, unknown>;
  correctAnswer: string;
  onOptions: (o: Record<string, unknown>) => void;
  onCorrectAnswer: (v: string) => void;
}) {
  const choices: Choice[] = Array.isArray(options.choices)
    ? (options.choices as Choice[])
    : [];
  const correctIdx = options.correctChoiceIndex as number | undefined;

  const setChoices = (c: Choice[]) =>
    onOptions({ ...options, choices: c });
  const setCorrectIdx = (i: number) =>
    onOptions({ ...options, correctChoiceIndex: i });

  return (
    <div className="flex flex-col gap-3">
      <SectionLabel>Answer Choices</SectionLabel>
      {choices.map((c, i) => (
        <ListRow key={i}
          onRemove={() => setChoices(removeAt(choices, i))}
          onMoveUp={() => setChoices(moveUp(choices, i))}
          onMoveDown={() => setChoices(moveDown(choices, i))}
          canMoveUp={i > 0} canMoveDown={i < choices.length - 1}>
          <div className="flex gap-2">
            <input value={c.icon} onChange={(e) => {
              const n = [...choices]; n[i] = { ...c, icon: e.target.value };
              setChoices(n);
            }} placeholder="🏠" className={cn(inpSm, "w-12 text-center")} maxLength={4} />
            <input value={c.title} onChange={(e) => {
              const n = [...choices]; n[i] = { ...c, title: e.target.value };
              setChoices(n);
            }} placeholder="Choice title" className={cn(inpSm, "flex-1")} />
          </div>
          <input value={c.desc} onChange={(e) => {
            const n = [...choices]; n[i] = { ...c, desc: e.target.value };
            setChoices(n);
          }} placeholder="Description (optional)" className={cn(inpSm, "mt-1.5")} />
        </ListRow>
      ))}
      <AddBtn label="Add Choice" onClick={() => setChoices([...choices, { icon: "🔲", title: "", desc: "" }])} />

      {choices.length > 0 && (
        <>
          <SectionLabel>Correct Answer</SectionLabel>
          <div className="flex flex-col gap-1.5">
            {choices.map((c, i) => (
              <label key={i} className="flex items-center gap-2.5 p-2.5 rounded-xl border border-[#E2E8F0] dark:border-[#334155] cursor-pointer hover:bg-[#F8FAFC] dark:hover:bg-[#162032] transition-colors">
                <input type="radio" name="mc-correct" checked={correctIdx === i}
                  onChange={() => { setCorrectIdx(i); onCorrectAnswer(""); }}
                  className="accent-[#8B5CF6]" />
                <span className="text-base">{c.icon || "🔲"}</span>
                <span className="text-sm font-semibold">{c.title || `Choice ${i + 1}`}</span>
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Stage 2: RANKING
type RankItem = { emoji: string; text: string; sub: string };
function RankingEditor({
  options, correctAnswer, onOptions, onCorrectAnswer,
}: {
  options: Record<string, unknown>;
  correctAnswer: string;
  onOptions: (o: Record<string, unknown>) => void;
  onCorrectAnswer: (v: string) => void;
}) {
  const items: RankItem[] = Array.isArray(options.rankItems)
    ? (options.rankItems as RankItem[])
    : [];

  // Parse or mirror from items
  let correctOrder: string[] = [];
  try { correctOrder = JSON.parse(correctAnswer); } catch { correctOrder = items.map((it) => it.text); }
  if (!Array.isArray(correctOrder) || correctOrder.length !== items.length) {
    correctOrder = items.map((it) => it.text);
  }

  const setItems = (arr: RankItem[]) => onOptions({ ...options, rankItems: arr });

  const moveCorrect = (i: number, dir: "up" | "down") => {
    const a = [...correctOrder];
    if (dir === "up" && i > 0) { [a[i - 1], a[i]] = [a[i], a[i - 1]]; }
    if (dir === "down" && i < a.length - 1) { [a[i], a[i + 1]] = [a[i + 1], a[i]]; }
    onCorrectAnswer(JSON.stringify(a));
  };

  return (
    <div className="flex flex-col gap-3">
      <SectionLabel>Rank Items (shown to student)</SectionLabel>
      {items.map((it, i) => (
        <ListRow key={i}
          onRemove={() => setItems(removeAt(items, i))}
          onMoveUp={() => setItems(moveUp(items, i))}
          onMoveDown={() => setItems(moveDown(items, i))}
          canMoveUp={i > 0} canMoveDown={i < items.length - 1}>
          <div className="flex gap-2">
            <input value={it.emoji} onChange={(e) => {
              const n = [...items]; n[i] = { ...it, emoji: e.target.value };
              setItems(n);
            }} placeholder="🌾" className={cn(inpSm, "w-12 text-center")} maxLength={4} />
            <input value={it.text} onChange={(e) => {
              const n = [...items]; n[i] = { ...it, text: e.target.value };
              setItems(n);
            }} placeholder="Item text" className={cn(inpSm, "flex-1")} />
          </div>
          <input value={it.sub} onChange={(e) => {
            const n = [...items]; n[i] = { ...it, sub: e.target.value };
            setItems(n);
          }} placeholder="Subtitle / detail" className={cn(inpSm, "mt-1.5")} />
        </ListRow>
      ))}
      <AddBtn label="Add Rank Item" onClick={() => setItems([...items, { emoji: "🔲", text: "", sub: "" }])} />

      {items.length > 1 && (
        <>
          <SectionLabel>Correct Order (drag items into correct sequence)</SectionLabel>
          <div className="flex flex-col gap-1.5">
            {correctOrder.map((text, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 bg-[#F8FAFC] dark:bg-[#0F172A] rounded-xl border border-[#E2E8F0] dark:border-[#334155]">
                <span className="text-[11px] font-black text-[#94A3B8] w-5 text-center">{i + 1}</span>
                <span className="flex-1 text-sm">{text || <span className="text-[#94A3B8]">(empty)</span>}</span>
                <div className="flex gap-1">
                  <button onClick={() => moveCorrect(i, "up")} disabled={i === 0}
                    className="w-6 h-6 rounded text-[10px] border border-[#E2E8F0] dark:border-[#334155] disabled:opacity-30 hover:bg-[#EEF2F8] dark:hover:bg-[#162032] transition-colors">↑</button>
                  <button onClick={() => moveCorrect(i, "down")} disabled={i === correctOrder.length - 1}
                    className="w-6 h-6 rounded text-[10px] border border-[#E2E8F0] dark:border-[#334155] disabled:opacity-30 hover:bg-[#EEF2F8] dark:hover:bg-[#162032] transition-colors">↓</button>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-[#94A3B8]">Saved as: <code className="font-mono">{JSON.stringify(correctOrder)}</code></p>
        </>
      )}
    </div>
  );
}

// Stage 3: OPEN_ENDED
type StarterChip = { label: string; text: string };
function OpenEndedEditor({ options, onOptions }: { options: Record<string, unknown>; onOptions: (o: Record<string, unknown>) => void }) {
  const chips: StarterChip[] = Array.isArray(options.starterChips) ? (options.starterChips as StarterChip[]) : [];
  const minChars = (options.minChars as number) ?? 50;
  const setChips = (c: StarterChip[]) => onOptions({ ...options, starterChips: c });
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <label className="text-xs font-bold text-[#64748B] whitespace-nowrap">Min characters</label>
        <input type="number" min={0} value={minChars}
          onChange={(e) => onOptions({ ...options, minChars: parseInt(e.target.value) || 0 })}
          className={cn(inpSm, "w-24")} />
      </div>
      <SectionLabel>Starter Chips (sentence starters for student)</SectionLabel>
      {chips.map((ch, i) => (
        <ListRow key={i}
          onRemove={() => setChips(removeAt(chips, i))}
          onMoveUp={() => setChips(moveUp(chips, i))}
          onMoveDown={() => setChips(moveDown(chips, i))}
          canMoveUp={i > 0} canMoveDown={i < chips.length - 1}>
          <div className="flex gap-2">
            <input value={ch.label} onChange={(e) => {
              const n = [...chips]; n[i] = { ...ch, label: e.target.value }; setChips(n);
            }} placeholder="Button label" className={cn(inpSm, "w-32")} />
            <input value={ch.text} onChange={(e) => {
              const n = [...chips]; n[i] = { ...ch, text: e.target.value }; setChips(n);
            }} placeholder="Text inserted into textarea" className={cn(inpSm, "flex-1")} />
          </div>
        </ListRow>
      ))}
      <AddBtn label="Add Starter Chip" onClick={() => setChips([...chips, { label: "I think…", text: "I think " }])} />
    </div>
  );
}

// Stage 4: TABLE_INPUT
type TableRow = { label: string; given: string; givenEditable: boolean; missing: string; missingEditable: boolean; assumed: string; assumedEditable: boolean };
function TableInputEditor({ options, onOptions }: { options: Record<string, unknown>; onOptions: (o: Record<string, unknown>) => void }) {
  const rows: TableRow[] = Array.isArray(options.tableRows) ? (options.tableRows as TableRow[]) : [];
  const setRows = (r: TableRow[]) => onOptions({ ...options, tableRows: r });
  const newRow = (): TableRow => ({ label: "", given: "", givenEditable: false, missing: "", missingEditable: true, assumed: "", assumedEditable: true });

  return (
    <div className="flex flex-col gap-3">
      <SectionLabel>Table Rows</SectionLabel>
      {rows.map((r, i) => (
        <ListRow key={i}
          onRemove={() => setRows(removeAt(rows, i))}
          onMoveUp={() => setRows(moveUp(rows, i))}
          onMoveDown={() => setRows(moveDown(rows, i))}
          canMoveUp={i > 0} canMoveDown={i < rows.length - 1}>
          <div className="flex flex-col gap-1.5">
            <input value={r.label} onChange={(e) => { const n = [...rows]; n[i] = { ...r, label: e.target.value }; setRows(n); }}
              placeholder="Row label (e.g. Rice)" className={inp} />
            {(["given", "missing", "assumed"] as const).map((col) => (
              <div key={col} className="grid grid-cols-[80px_1fr_auto] items-center gap-2">
                <span className="text-[10px] font-bold uppercase text-[#64748B] capitalize">{col}</span>
                <input value={r[col]} onChange={(e) => { const n = [...rows]; n[i] = { ...r, [col]: e.target.value }; setRows(n); }}
                  placeholder={`${col} value`} className={cn(inpSm, "flex-1")} />
                <label className="flex items-center gap-1 text-[10px] text-[#64748B] whitespace-nowrap cursor-pointer">
                  <input type="checkbox" checked={r[`${col}Editable` as keyof TableRow] as boolean}
                    onChange={(e) => { const n = [...rows]; n[i] = { ...r, [`${col}Editable`]: e.target.checked }; setRows(n); }}
                    className="accent-[#8B5CF6] w-3 h-3" />
                  editable
                </label>
              </div>
            ))}
          </div>
        </ListRow>
      ))}
      <AddBtn label="Add Row" onClick={() => setRows([...rows, newRow()])} />
    </div>
  );
}

// Stage 5: CHECKLIST
type CheckItem = { text: string; desc: string };
function ChecklistEditor({
  options, correctAnswer, onOptions, onCorrectAnswer,
}: {
  options: Record<string, unknown>;
  correctAnswer: string;
  onOptions: (o: Record<string, unknown>) => void;
  onCorrectAnswer: (v: string) => void;
}) {
  const items: CheckItem[] = Array.isArray(options.checkItems) ? (options.checkItems as CheckItem[]) : [];
  let correctMap: Record<string, boolean> = {};
  try { correctMap = JSON.parse(correctAnswer); } catch { /* empty */ }

  const setItems = (arr: CheckItem[]) => onOptions({ ...options, checkItems: arr });
  const toggleCorrect = (i: number) => {
    const m = { ...correctMap, [i]: !correctMap[i] };
    onCorrectAnswer(JSON.stringify(m));
  };

  return (
    <div className="flex flex-col gap-3">
      <SectionLabel>Checklist Items</SectionLabel>
      {items.map((it, i) => (
        <ListRow key={i}
          onRemove={() => setItems(removeAt(items, i))}
          onMoveUp={() => setItems(moveUp(items, i))}
          onMoveDown={() => setItems(moveDown(items, i))}
          canMoveUp={i > 0} canMoveDown={i < items.length - 1}>
          <input value={it.text} onChange={(e) => { const n = [...items]; n[i] = { ...it, text: e.target.value }; setItems(n); }}
            placeholder="Item text" className={inp} />
          <input value={it.desc} onChange={(e) => { const n = [...items]; n[i] = { ...it, desc: e.target.value }; setItems(n); }}
            placeholder="Description (optional)" className={cn(inp, "mt-1.5")} />
        </ListRow>
      ))}
      <AddBtn label="Add Checklist Item" onClick={() => setItems([...items, { text: "", desc: "" }])} />

      {items.length > 0 && (
        <>
          <SectionLabel>Correct Answers (check which items must be selected)</SectionLabel>
          <div className="flex flex-col gap-1.5">
            {items.map((it, i) => (
              <label key={i} className="flex items-center gap-2.5 p-2.5 rounded-xl border border-[#E2E8F0] dark:border-[#334155] cursor-pointer hover:bg-[#F8FAFC] dark:hover:bg-[#162032] transition-colors">
                <input type="checkbox" checked={!!correctMap[i]} onChange={() => toggleCorrect(i)}
                  className="accent-[#4A9B7F] w-4 h-4" />
                <span className="text-sm">{it.text || <span className="text-[#94A3B8]">(empty)</span>}</span>
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Stage 6: ROOT_CAUSE_PROMPTS
function PromptsEditor({ options, onOptions }: { options: Record<string, unknown>; onOptions: (o: Record<string, unknown>) => void }) {
  const prompts: string[] = Array.isArray(options.prompts) ? (options.prompts as string[]) : [];
  const setPrompts = (p: string[]) => onOptions({ ...options, prompts: p });
  return (
    <div className="flex flex-col gap-3">
      <SectionLabel>Root Cause Prompts</SectionLabel>
      {prompts.map((p, i) => (
        <ListRow key={i}
          onRemove={() => setPrompts(removeAt(prompts, i))}
          onMoveUp={() => setPrompts(moveUp(prompts, i))}
          onMoveDown={() => setPrompts(moveDown(prompts, i))}
          canMoveUp={i > 0} canMoveDown={i < prompts.length - 1}>
          <input value={p} onChange={(e) => { const n = [...prompts]; n[i] = e.target.value; setPrompts(n); }}
            placeholder="Ask the student…" className={inp} />
        </ListRow>
      ))}
      <AddBtn label="Add Prompt" onClick={() => setPrompts([...prompts, ""])} />
    </div>
  );
}

// Stage 7: COMPUTATION
type CalcItem = { icon: string; label: string; unit: string; price: number };
function ComputationEditor({ options, onOptions }: { options: Record<string, unknown>; onOptions: (o: Record<string, unknown>) => void }) {
  const items: CalcItem[] = Array.isArray(options.calcItems) ? (options.calcItems as CalcItem[]) : [];
  const budget = (options.budget as number) ?? 0;
  const setItems = (arr: CalcItem[]) => onOptions({ ...options, calcItems: arr });
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <label className="text-xs font-bold text-[#64748B] whitespace-nowrap">Budget (₱)</label>
        <input type="number" min={0} value={budget}
          onChange={(e) => onOptions({ ...options, budget: parseFloat(e.target.value) || 0 })}
          className={cn(inpSm, "w-32")} />
      </div>
      <SectionLabel>Calculation Items</SectionLabel>
      {items.map((it, i) => (
        <ListRow key={i}
          onRemove={() => setItems(removeAt(items, i))}
          onMoveUp={() => setItems(moveUp(items, i))}
          onMoveDown={() => setItems(moveDown(items, i))}
          canMoveUp={i > 0} canMoveDown={i < items.length - 1}>
          <div className="grid grid-cols-[36px_1fr_80px_80px] gap-2 items-center">
            <input value={it.icon} onChange={(e) => { const n = [...items]; n[i] = { ...it, icon: e.target.value }; setItems(n); }}
              placeholder="🌾" className={cn(inpSm, "text-center")} maxLength={4} />
            <input value={it.label} onChange={(e) => { const n = [...items]; n[i] = { ...it, label: e.target.value }; setItems(n); }}
              placeholder="Label" className={inpSm} />
            <input value={it.unit} onChange={(e) => { const n = [...items]; n[i] = { ...it, unit: e.target.value }; setItems(n); }}
              placeholder="unit" className={inpSm} />
            <input type="number" min={0} value={it.price} onChange={(e) => { const n = [...items]; n[i] = { ...it, price: parseFloat(e.target.value) || 0 }; setItems(n); }}
              placeholder="price" className={inpSm} />
          </div>
        </ListRow>
      ))}
      <AddBtn label="Add Item" onClick={() => setItems([...items, { icon: "🛒", label: "", unit: "kg", price: 0 }])} />
    </div>
  );
}

// Stage 8: MULTI_PLAN
type PlanField = { key: string; label: string; type: "number" | "text"; placeholder: string };
function MultiPlanEditor({ options, onOptions }: { options: Record<string, unknown>; onOptions: (o: Record<string, unknown>) => void }) {
  const planLabels: [string, string] = Array.isArray(options.planLabels)
    ? [String((options.planLabels as string[])[0] ?? "Plan A"), String((options.planLabels as string[])[1] ?? "Plan B")]
    : ["Plan A", "Plan B"];
  const planBudget = (options.planBudget as number) ?? 0;
  const fields: PlanField[] = Array.isArray(options.planFields) ? (options.planFields as PlanField[]) : [];

  const setLabels = (a: string, b: string) => onOptions({ ...options, planLabels: [a, b] });
  const setFields = (f: PlanField[]) => onOptions({ ...options, planFields: f });

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-[#64748B]">Plan A Label</label>
          <input value={planLabels[0]} onChange={(e) => setLabels(e.target.value, planLabels[1])} className={inp} placeholder="Plan A" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-[#64748B]">Plan B Label</label>
          <input value={planLabels[1]} onChange={(e) => setLabels(planLabels[0], e.target.value)} className={inp} placeholder="Plan B" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <label className="text-xs font-bold text-[#64748B] whitespace-nowrap">Plan Budget (₱)</label>
        <input type="number" min={0} value={planBudget}
          onChange={(e) => onOptions({ ...options, planBudget: parseFloat(e.target.value) || 0 })}
          className={cn(inpSm, "w-32")} />
      </div>
      <SectionLabel>Plan Input Fields</SectionLabel>
      {fields.map((f, i) => (
        <ListRow key={i}
          onRemove={() => setFields(removeAt(fields, i))}
          onMoveUp={() => setFields(moveUp(fields, i))}
          onMoveDown={() => setFields(moveDown(fields, i))}
          canMoveUp={i > 0} canMoveDown={i < fields.length - 1}>
          <div className="grid grid-cols-[80px_1fr] gap-2">
            <input value={f.key} onChange={(e) => { const n = [...fields]; n[i] = { ...f, key: e.target.value }; setFields(n); }}
              placeholder="key" className={inpSm} />
            <input value={f.label} onChange={(e) => { const n = [...fields]; n[i] = { ...f, label: e.target.value }; setFields(n); }}
              placeholder="Field label" className={inpSm} />
          </div>
          <div className="grid grid-cols-[100px_1fr] gap-2 mt-1.5">
            <select value={f.type} onChange={(e) => { const n = [...fields]; n[i] = { ...f, type: e.target.value as "number"|"text" }; setFields(n); }}
              className={cn(inpSm, "bg-white dark:bg-[#0F172A]")}>
              <option value="number">number</option>
              <option value="text">text</option>
            </select>
            <input value={f.placeholder} onChange={(e) => { const n = [...fields]; n[i] = { ...f, placeholder: e.target.value }; setFields(n); }}
              placeholder="Placeholder text" className={inpSm} />
          </div>
        </ListRow>
      ))}
      <AddBtn label="Add Field" onClick={() => setFields([...fields, { key: "", label: "", type: "number", placeholder: "" }])} />
    </div>
  );
}

// Stage 9: RISK_CHECKLIST
type RiskItem = { emoji: string; title: string; sub: string };
function RiskChecklistEditor({ options, onOptions }: { options: Record<string, unknown>; onOptions: (o: Record<string, unknown>) => void }) {
  const items: RiskItem[] = Array.isArray(options.riskItems) ? (options.riskItems as RiskItem[]) : [];
  const hasContingency = options.hasContingency !== false;
  const setItems = (arr: RiskItem[]) => onOptions({ ...options, riskItems: arr });
  return (
    <div className="flex flex-col gap-3">
      <label className="flex items-center gap-2.5 cursor-pointer select-none">
        <div onClick={() => onOptions({ ...options, hasContingency: !hasContingency })}
          className={cn("w-9 h-5 rounded-full transition-colors relative cursor-pointer shrink-0",
            hasContingency ? "bg-[#8B5CF6]" : "bg-[#CBD5E1] dark:bg-[#334155]")}>
          <div className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
            hasContingency ? "translate-x-4" : "translate-x-0.5")} />
        </div>
        <span className="text-xs font-bold text-[#64748B]">Show contingency text field</span>
      </label>
      <SectionLabel>Risk Items</SectionLabel>
      {items.map((it, i) => (
        <ListRow key={i}
          onRemove={() => setItems(removeAt(items, i))}
          onMoveUp={() => setItems(moveUp(items, i))}
          onMoveDown={() => setItems(moveDown(items, i))}
          canMoveUp={i > 0} canMoveDown={i < items.length - 1}>
          <div className="flex gap-2">
            <input value={it.emoji} onChange={(e) => { const n = [...items]; n[i] = { ...it, emoji: e.target.value }; setItems(n); }}
              placeholder="🚨" className={cn(inpSm, "w-12 text-center")} maxLength={4} />
            <input value={it.title} onChange={(e) => { const n = [...items]; n[i] = { ...it, title: e.target.value }; setItems(n); }}
              placeholder="Risk title" className={cn(inpSm, "flex-1")} />
          </div>
          <input value={it.sub} onChange={(e) => { const n = [...items]; n[i] = { ...it, sub: e.target.value }; setItems(n); }}
            placeholder="Subtitle / description" className={cn(inpSm, "mt-1.5")} />
        </ListRow>
      ))}
      <AddBtn label="Add Risk Item" onClick={() => setItems([...items, { emoji: "⚠️", title: "", sub: "" }])} />
    </div>
  );
}

// Stage 10: BUDGET_CHECK / TRIAL
type TrialItem = { id: string; icon: string; name: string; unit: string; price: number };
function TrialEditor({ options, onOptions }: { options: Record<string, unknown>; onOptions: (o: Record<string, unknown>) => void }) {
  const items: TrialItem[] = Array.isArray(options.trialItems) ? (options.trialItems as TrialItem[]) : [];
  const trialBudget = (options.trialBudget as number) ?? 0;
  const setItems = (arr: TrialItem[]) => onOptions({ ...options, trialItems: arr });
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <label className="text-xs font-bold text-[#64748B] whitespace-nowrap">Trial Budget (₱)</label>
        <input type="number" min={0} value={trialBudget}
          onChange={(e) => onOptions({ ...options, trialBudget: parseFloat(e.target.value) || 0 })}
          className={cn(inpSm, "w-32")} />
      </div>
      <SectionLabel>Trial Items</SectionLabel>
      {items.map((it, i) => (
        <ListRow key={i}
          onRemove={() => setItems(removeAt(items, i))}
          onMoveUp={() => setItems(moveUp(items, i))}
          onMoveDown={() => setItems(moveDown(items, i))}
          canMoveUp={i > 0} canMoveDown={i < items.length - 1}>
          <div className="grid grid-cols-[60px_36px_1fr_70px_70px] gap-2 items-center">
            <input value={it.id} onChange={(e) => { const n = [...items]; n[i] = { ...it, id: e.target.value }; setItems(n); }}
              placeholder="id" className={inpSm} />
            <input value={it.icon} onChange={(e) => { const n = [...items]; n[i] = { ...it, icon: e.target.value }; setItems(n); }}
              placeholder="🛒" className={cn(inpSm, "text-center")} maxLength={4} />
            <input value={it.name} onChange={(e) => { const n = [...items]; n[i] = { ...it, name: e.target.value }; setItems(n); }}
              placeholder="Name" className={inpSm} />
            <input value={it.unit} onChange={(e) => { const n = [...items]; n[i] = { ...it, unit: e.target.value }; setItems(n); }}
              placeholder="unit" className={inpSm} />
            <input type="number" min={0} value={it.price} onChange={(e) => { const n = [...items]; n[i] = { ...it, price: parseFloat(e.target.value) || 0 }; setItems(n); }}
              placeholder="price" className={inpSm} />
          </div>
        </ListRow>
      ))}
      <AddBtn label="Add Trial Item" onClick={() => setItems([...items, { id: "", icon: "🛒", name: "", unit: "", price: 0 }])} />
    </div>
  );
}

// Stage 11: SELECT_JUSTIFY
function SelectJustifyEditor({
  options, correctAnswer, onOptions, onCorrectAnswer,
}: {
  options: Record<string, unknown>;
  correctAnswer: string;
  onOptions: (o: Record<string, unknown>) => void;
  onCorrectAnswer: (v: string) => void;
}) {
  const planLabels: [string, string] = Array.isArray(options.planLabels)
    ? [String((options.planLabels as string[])[0] ?? "Plan A"), String((options.planLabels as string[])[1] ?? "Plan B")]
    : ["Plan A", "Plan B"];
  const justifyLabel = (options.justifyLabel as string) ?? "📝 Justify your choice";

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-[#64748B]">Plan A Label</label>
          <input value={planLabels[0]} onChange={(e) => onOptions({ ...options, planLabels: [e.target.value, planLabels[1]] })} className={inp} placeholder="Plan A" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-[#64748B]">Plan B Label</label>
          <input value={planLabels[1]} onChange={(e) => onOptions({ ...options, planLabels: [planLabels[0], e.target.value] })} className={inp} placeholder="Plan B" />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold text-[#64748B]">Justify Label</label>
        <input value={justifyLabel} onChange={(e) => onOptions({ ...options, justifyLabel: e.target.value })} className={inp} placeholder="📝 Justify your choice" />
      </div>
      <SectionLabel>Correct Answer</SectionLabel>
      <div className="flex flex-col gap-1.5">
        {[
          { value: "A", label: `${planLabels[0]}` },
          { value: "B", label: `${planLabels[1]}` },
          { value: "",  label: "Not set (teacher-graded)" },
        ].map(({ value, label }) => (
          <label key={value} className="flex items-center gap-2.5 p-2.5 rounded-xl border border-[#E2E8F0] dark:border-[#334155] cursor-pointer hover:bg-[#F8FAFC] dark:hover:bg-[#162032] transition-colors">
            <input type="radio" name="sj-correct" checked={correctAnswer === value}
              onChange={() => onCorrectAnswer(value)}
              className="accent-[#8B5CF6]" />
            <span className="text-sm font-semibold">{value ? `Plan ${value}: ` : ""}{label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

// Stage 12: REFLECTION_SLIDER
type SliderQ    = { key: string; question: string; loLabel: string; hiLabel: string };
type OpenReflection = { key: string; question: string };
function ReflectionSliderEditor({ options, onOptions }: { options: Record<string, unknown>; onOptions: (o: Record<string, unknown>) => void }) {
  const sliders: SliderQ[] = Array.isArray(options.sliderQuestions) ? (options.sliderQuestions as SliderQ[]) : [];
  const opens: OpenReflection[] = Array.isArray(options.openReflections) ? (options.openReflections as OpenReflection[]) : [];
  const setSliders = (s: SliderQ[]) => onOptions({ ...options, sliderQuestions: s });
  const setOpens   = (o: OpenReflection[]) => onOptions({ ...options, openReflections: o });

  return (
    <div className="flex flex-col gap-3">
      <SectionLabel>Slider Questions</SectionLabel>
      {sliders.map((s, i) => (
        <ListRow key={i}
          onRemove={() => setSliders(removeAt(sliders, i))}
          onMoveUp={() => setSliders(moveUp(sliders, i))}
          onMoveDown={() => setSliders(moveDown(sliders, i))}
          canMoveUp={i > 0} canMoveDown={i < sliders.length - 1}>
          <div className="flex gap-2">
            <input value={s.key} onChange={(e) => { const n = [...sliders]; n[i] = { ...s, key: e.target.value }; setSliders(n); }}
              placeholder="key" className={cn(inpSm, "w-24")} />
            <input value={s.question} onChange={(e) => { const n = [...sliders]; n[i] = { ...s, question: e.target.value }; setSliders(n); }}
              placeholder="Question" className={cn(inpSm, "flex-1")} />
          </div>
          <div className="grid grid-cols-2 gap-2 mt-1.5">
            <input value={s.loLabel} onChange={(e) => { const n = [...sliders]; n[i] = { ...s, loLabel: e.target.value }; setSliders(n); }}
              placeholder="Low label (1)" className={inpSm} />
            <input value={s.hiLabel} onChange={(e) => { const n = [...sliders]; n[i] = { ...s, hiLabel: e.target.value }; setSliders(n); }}
              placeholder="High label (5)" className={inpSm} />
          </div>
        </ListRow>
      ))}
      <AddBtn label="Add Slider Question" onClick={() => setSliders([...sliders, { key: "", question: "", loLabel: "Not at all", hiLabel: "Very much" }])} />

      <SectionLabel>Open Reflection Questions</SectionLabel>
      {opens.map((o, i) => (
        <ListRow key={i}
          onRemove={() => setOpens(removeAt(opens, i))}
          onMoveUp={() => setOpens(moveUp(opens, i))}
          onMoveDown={() => setOpens(moveDown(opens, i))}
          canMoveUp={i > 0} canMoveDown={i < opens.length - 1}>
          <div className="flex gap-2">
            <input value={o.key} onChange={(e) => { const n = [...opens]; n[i] = { ...o, key: e.target.value }; setOpens(n); }}
              placeholder="key" className={cn(inpSm, "w-24")} />
            <input value={o.question} onChange={(e) => { const n = [...opens]; n[i] = { ...o, question: e.target.value }; setOpens(n); }}
              placeholder="Open question" className={cn(inpSm, "flex-1")} />
          </div>
        </ListRow>
      ))}
      <AddBtn label="Add Reflection Question" onClick={() => setOpens([...opens, { key: "", question: "" }])} />
    </div>
  );
}

// ─── Options dispatcher ───────────────────────────────────────

function OptionsEditor({
  type, options, correctAnswer, onOptions, onCorrectAnswer,
}: {
  type: string;
  options: Record<string, unknown>;
  correctAnswer: string;
  onOptions: (o: Record<string, unknown>) => void;
  onCorrectAnswer: (v: string) => void;
}) {
  switch (type) {
    case "MULTIPLE_CHOICE":    return <MultipleChoiceEditor   options={options} correctAnswer={correctAnswer} onOptions={onOptions} onCorrectAnswer={onCorrectAnswer} />;
    case "RANKING":            return <RankingEditor          options={options} correctAnswer={correctAnswer} onOptions={onOptions} onCorrectAnswer={onCorrectAnswer} />;
    case "OPEN_ENDED":         return <OpenEndedEditor        options={options} onOptions={onOptions} />;
    case "TABLE_INPUT":        return <TableInputEditor       options={options} onOptions={onOptions} />;
    case "CHECKLIST":          return <ChecklistEditor        options={options} correctAnswer={correctAnswer} onOptions={onOptions} onCorrectAnswer={onCorrectAnswer} />;
    case "ROOT_CAUSE_PROMPTS": return <PromptsEditor          options={options} onOptions={onOptions} />;
    case "COMPUTATION":        return <ComputationEditor      options={options} onOptions={onOptions} />;
    case "MULTI_PLAN":         return <MultiPlanEditor        options={options} onOptions={onOptions} />;
    case "BUDGET_CHECK":       return <TrialEditor            options={options} onOptions={onOptions} />;
    case "SELECT_JUSTIFY":     return <SelectJustifyEditor    options={options} correctAnswer={correctAnswer} onOptions={onOptions} onCorrectAnswer={onCorrectAnswer} />;
    case "REFLECTION_SLIDER":  return <ReflectionSliderEditor options={options} onOptions={onOptions} />;
    default:                   return <RawJsonFallback        options={options} onOptions={onOptions} />;
  }
}

// Fallback raw JSON editor for unknown types
function RawJsonFallback({ options, onOptions }: { options: Record<string, unknown>; onOptions: (o: Record<string, unknown>) => void }) {
  const [raw, setRaw] = useState(() => JSON.stringify(options, null, 2));
  const valid = (() => { try { JSON.parse(raw); return true; } catch { return false; } })();
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-[#94A3B8]">Unknown stage type — edit raw JSON:</p>
      <textarea rows={10} value={raw}
        onChange={(e) => { setRaw(e.target.value); if (valid) try { onOptions(JSON.parse(e.target.value)); } catch { /* ignore */ } }}
        className={cn("w-full px-3 py-2 rounded-xl border text-xs font-mono bg-[#F8FAFC] dark:bg-[#0F172A] focus:outline-none resize-none",
          valid ? "border-[#E2E8F0] dark:border-[#334155] focus:border-[#8B5CF6]" : "border-[#E05C5C]")} />
      {!valid && <p className="text-xs text-[#E05C5C]">✗ Invalid JSON</p>}
    </div>
  );
}

// ─── Stage List Item ──────────────────────────────────────────

function StageListItem({
  stage, active, dirty, onClick,
}: {
  stage: StageData | null;
  stageNum: number;
  active: boolean;
  dirty: boolean;
  onClick: () => void;
}) {
  const num   = stage?.stageNumber ?? 0;
  const phase = stage ? PHASE_META[stage.phase] : null;
  const color = phase?.color ?? "#94A3B8";

  return (
    <button onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left transition-all border",
        active
          ? "border-[#8B5CF6] bg-[#EDE9FE] dark:bg-[#2e1065]"
          : "border-transparent hover:bg-[#F8FAFC] dark:hover:bg-[#162032]"
      )}>
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold text-white shrink-0"
        style={{ background: color }}>
        {num}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-bold truncate", active ? "text-[#8B5CF6]" : "")}>
          {stage?.title ?? `Stage ${num}`}
        </p>
        <p className="text-[10px] text-[#94A3B8] truncate">
          {stage ? `${phase?.label} · ${TYPE_LABEL[stage.type] ?? stage.type}` : "Not created"}
        </p>
      </div>
      {dirty && <span className="w-2 h-2 rounded-full bg-[#F59E0B] shrink-0" title="Unsaved changes" />}
      {!stage && (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FEE2E2] dark:bg-[#450a0a] text-[#E05C5C]">
          Missing
        </span>
      )}
    </button>
  );
}

// ─── Stage Editor Form ────────────────────────────────────────

function StageForm({
  stage, moduleId, onSaved,
}: {
  stage: StageData;
  moduleId: number;
  onSaved: () => void;
}) {
  const [form,    setForm]    = useState<FormState>(() => stageToForm(stage));
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [dirty,   setDirty]   = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  useEffect(() => {
    setForm(stageToForm(stage));
    setDirty(false);
    setError(null);
    setSuccess(false);
  }, [stage.id]);

  const update = (patch: Partial<FormState>) => {
    setForm((f) => ({ ...f, ...patch }));
    setDirty(true);
    setSuccess(false);
  };

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);

    const res = await fetch(`/api/admin/modules/${moduleId}/stages/${stage.stageNumber}`, {
      method:      "PATCH",
      headers:     { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        type:          form.type,
        title:         form.title.trim(),
        instruction:   form.instruction.trim(),
        hint:          form.hint.trim() || null,
        maxScore:      parseInt(form.maxScore) || 0,
        timeLimit:     form.timeLimit.trim() ? parseInt(form.timeLimit) : null,
        melc:          form.melc.trim() || null,
        options:       form.options,
        correctAnswer: form.correctAnswer.trim() || null,
      }),
    });

    const d = await res.json();
    setSaving(false);
    if (!d.success) { setError(d.error ?? "Failed to save."); return; }
    setDirty(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2500);
    onSaved();
  }, [form, moduleId, stage.stageNumber, onSaved]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (dirty && !saving) handleSave();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSave, dirty, saving]);

  const phase = PHASE_META[stage.phase];
  const color = phase.color;

  const handleTypeChange = (newType: string) => {
    const defaults = TYPE_DEFAULTS[newType] ?? { options: {}, correctAnswer: "" };
    update({ type: newType, options: defaults.options, correctAnswer: defaults.correctAnswer });
  };

  // Types that handle correctAnswer inside their own editor
  const caHandledInEditor = ["MULTIPLE_CHOICE", "RANKING", "CHECKLIST", "SELECT_JUSTIFY"];
  const showStandaloneCA = !caHandledInEditor.includes(form.type);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#E2E8F0] dark:border-[#334155] flex items-center gap-4"
        style={{ background: `${color}10` }}>
        <div className="w-11 h-11 rounded-full flex items-center justify-center text-lg font-black text-white shrink-0"
          style={{ background: color }}>
          {stage.stageNumber}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full"
              style={{ background: phase.lt, color }}>{phase.label}</span>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#EEF2F8] dark:bg-[#162032] text-[#64748B]">
              {TYPE_LABEL[form.type] ?? form.type}
              {form.type !== stage.type && <span className="ml-1 text-[#F59E0B]">●</span>}
            </span>
          </div>
          <p className="text-[11px] text-[#94A3B8] mt-0.5">ID #{stage.id} · Stage {stage.stageNumber} of 12</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {dirty  && <span className="text-xs font-semibold text-[#F59E0B]">● Unsaved</span>}
          {success && <span className="text-xs font-bold text-[#4A9B7F]">✓ Saved!</span>}
          <button onClick={handleSave} disabled={saving || !dirty}
            className="px-5 py-2 rounded-xl font-nunito font-extrabold text-sm text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:-translate-y-0.5"
            style={{ background: color }}>
            {saving ? "Saving…" : "Save Stage"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-4 px-4 py-3 bg-[#FEE2E2] dark:bg-[#450a0a] border border-[#E05C5C]/30 rounded-xl text-sm text-[#E05C5C]">
          {error}
        </div>
      )}

      {/* Form body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6">

        {/* ── Basic Info ── */}
        <section>
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] mb-3">Basic Info</h3>
          <div className="flex flex-col gap-3">
            {/* ── Stage Type picker ── */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#64748B]">Stage Type</label>
              <div className="flex flex-wrap gap-1.5">
                {ALL_TYPES.map((t) => (
                  <button key={t} type="button" onClick={() => { if (t !== form.type) handleTypeChange(t); }}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all",
                      form.type === t
                        ? "border-[#8B5CF6] bg-[#EDE9FE] dark:bg-[#2e1065] text-[#8B5CF6]"
                        : "border-[#E2E8F0] dark:border-[#334155] text-[#64748B] hover:border-[#8B5CF6] hover:text-[#8B5CF6] hover:bg-[#F5F3FF] dark:hover:bg-[#2e1065]"
                    )}>
                    {TYPE_LABEL[t] ?? t}
                  </button>
                ))}
              </div>
              {form.type !== stage.type && (
                <p className="text-[10px] text-[#F59E0B] flex items-center gap-1">
                  ⚠ Changing type resets stage options. Save to confirm.
                </p>
              )}
            </div>
            <div className="h-px bg-[#E2E8F0] dark:bg-[#334155]" />
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-[#64748B]">Stage Title <span className="text-[#E05C5C]">*</span></label>
              <input value={form.title} onChange={(e) => update({ title: e.target.value })}
                placeholder="e.g. Identify & Categorize"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A] text-sm focus:outline-none focus:border-[#8B5CF6]" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-[#64748B]">Instruction <span className="text-[#E05C5C]">*</span></label>
              <textarea value={form.instruction} onChange={(e) => update({ instruction: e.target.value })}
                rows={3} placeholder="What should the student do on this stage?"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A] text-sm focus:outline-none focus:border-[#8B5CF6] resize-none leading-relaxed" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-[#64748B]">
                Hint <span className="text-[#94A3B8] font-normal">(optional — hidden for Champion difficulty)</span>
              </label>
              <textarea value={form.hint} onChange={(e) => update({ hint: e.target.value })}
                rows={2} placeholder="A helpful hint shown to Apprentice/Adventurer students…"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A] text-sm focus:outline-none focus:border-[#8B5CF6] resize-none leading-relaxed" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#64748B]">Max Score</label>
                <input type="number" min={0} value={form.maxScore}
                  onChange={(e) => update({ maxScore: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A] text-sm focus:outline-none focus:border-[#8B5CF6]" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#64748B]">Time Limit (sec)</label>
                <input type="number" min={0} value={form.timeLimit}
                  onChange={(e) => update({ timeLimit: e.target.value })}
                  placeholder="None"
                  className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A] text-sm focus:outline-none focus:border-[#8B5CF6]" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#64748B]">MELC Code</label>
                <input value={form.melc} onChange={(e) => update({ melc: e.target.value })}
                  placeholder="M6NS-Ib-97"
                  className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A] text-sm focus:outline-none focus:border-[#8B5CF6]" />
              </div>
            </div>
          </div>
        </section>

        {/* ── Stage-specific Options ── */}
        <section>
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] mb-3">
            Stage Content — {TYPE_LABEL[form.type] ?? form.type}
          </h3>
          <OptionsEditor
            type={form.type}
            options={form.options}
            correctAnswer={form.correctAnswer}
            onOptions={(o) => update({ options: o })}
            onCorrectAnswer={(v) => update({ correctAnswer: v })}
          />
        </section>

        {/* ── Standalone correctAnswer (for non-handled types) ── */}
        {showStandaloneCA && (
          <section>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] mb-3">
              Correct Answer <span className="font-normal normal-case">(auto-scorer reference — leave empty if teacher-graded)</span>
            </h3>
            <textarea value={form.correctAnswer} onChange={(e) => update({ correctAnswer: e.target.value })}
              rows={3} spellCheck={false}
              placeholder='Leave empty for teacher-graded stages'
              className="w-full px-3.5 py-3 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A] text-xs font-mono focus:outline-none focus:border-[#8B5CF6] resize-none" />
          </section>
        )}

        {/* ── Raw JSON escape hatch ── */}
        <section className="pb-6">
          <button onClick={() => setShowRaw((v) => !v)}
            className="text-[10px] text-[#94A3B8] hover:text-[#64748B] font-semibold transition-colors">
            {showRaw ? "▲ Hide raw JSON" : "▼ View raw JSON (debug)"}
          </button>
          {showRaw && (
            <pre className="mt-2 px-4 py-3 bg-[#F8FAFC] dark:bg-[#0F172A] rounded-xl border border-[#E2E8F0] dark:border-[#334155] text-[10px] font-mono text-[#64748B] overflow-x-auto">
              {JSON.stringify(form.options, null, 2)}
            </pre>
          )}
        </section>
      </div>

      {/* Bottom save bar */}
      <div className="px-6 py-3 border-t border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#1E293B] flex items-center justify-between shrink-0">
        <p className="text-xs text-[#94A3B8]">{dirty ? "⌘S / Ctrl+S to save" : "No unsaved changes"}</p>
        <button onClick={handleSave} disabled={saving || !dirty}
          className="px-6 py-2.5 rounded-xl font-nunito font-extrabold text-sm text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:-translate-y-0.5 shadow-md"
          style={{ background: color }}>
          {saving ? "Saving…" : dirty ? "Save Stage" : "Saved ✓"}
        </button>
      </div>
    </div>
  );
}

// ─── Stage Create Form ────────────────────────────────────────
// Shown when a stage doesn't exist in the DB yet. Uses the same logic
// as /dashboard/teacher/modules/new — type from mode, full options structure.

function StageCreateForm({
  stageNum, moduleId, onCreated,
}: {
  stageNum:  number;
  moduleId:  number;
  onCreated: () => void;
}) {
  const defaultType = DEFAULT_TYPE_BY_STAGE[stageNum] ?? "OPEN_ENDED";
  const defaultOpts = TYPE_DEFAULTS[defaultType]?.options ?? {};

  const [form,    setForm]    = useState<FormState>({
    type:          defaultType,
    title:         DEFAULT_TITLES[stageNum] ?? `Stage ${stageNum}`,
    instruction:   "",
    hint:          "",
    maxScore:      "10",
    timeLimit:     "",
    melc:          "",
    options:       defaultOpts,
    correctAnswer: TYPE_DEFAULTS[defaultType]?.correctAnswer ?? "",
  });
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const update = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  const handleTypeChange = (newType: string) => {
    const defaults = TYPE_DEFAULTS[newType] ?? { options: {}, correctAnswer: "" };
    update({ type: newType, options: defaults.options, correctAnswer: defaults.correctAnswer });
  };

  const handleCreate = async () => {
    if (!form.title.trim() || !form.instruction.trim()) {
      setError("Title and instruction are required."); return;
    }
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/admin/modules/${moduleId}/stages/${stageNum}`, {
      method:      "POST",
      headers:     { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        type:          form.type,
        title:         form.title.trim(),
        instruction:   form.instruction.trim(),
        hint:          form.hint.trim() || null,
        maxScore:      parseInt(form.maxScore) || 10,
        timeLimit:     form.timeLimit.trim() ? parseInt(form.timeLimit) : null,
        melc:          form.melc.trim() || null,
        options:       form.options,
        correctAnswer: form.correctAnswer.trim() || null,
      }),
    });
    const d = await res.json();
    setSaving(false);
    if (!d.success) { setError(d.error ?? "Failed to create stage."); return; }
    onCreated();
  };

  const phase    = PHASE_META[phaseOfStage(stageNum)];
  const color    = phase.color;
  const caHandledInEditor = ["MULTIPLE_CHOICE", "RANKING", "CHECKLIST", "SELECT_JUSTIFY"];
  const showStandaloneCA  = !caHandledInEditor.includes(form.type);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#E2E8F0] dark:border-[#334155] flex items-center gap-4"
        style={{ background: `${color}10` }}>
        <div className="w-11 h-11 rounded-full flex items-center justify-center text-lg font-black text-white shrink-0"
          style={{ background: color }}>
          {stageNum}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full"
              style={{ background: phase.lt, color }}>{phase.label}</span>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#D1FAE5] dark:bg-[#064e35] text-[#4A9B7F]">
              New Stage
            </span>
          </div>
          <p className="text-[11px] text-[#94A3B8] mt-0.5">Stage {stageNum} of 12 — not yet in database</p>
        </div>
        <button onClick={handleCreate} disabled={saving || !form.title.trim() || !form.instruction.trim()}
          className="px-5 py-2 rounded-xl font-nunito font-extrabold text-sm text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:-translate-y-0.5"
          style={{ background: color }}>
          {saving ? "Creating…" : "Create Stage"}
        </button>
      </div>

      {error && (
        <div className="mx-6 mt-4 px-4 py-3 bg-[#FEE2E2] dark:bg-[#450a0a] border border-[#E05C5C]/30 rounded-xl text-sm text-[#E05C5C]">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6">
        {/* Basic Info */}
        <section>
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] mb-3">Basic Info</h3>
          <div className="flex flex-col gap-3">
            {/* Type picker */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#64748B]">Stage Type</label>
              <div className="flex flex-wrap gap-1.5">
                {ALL_TYPES.map((t) => (
                  <button key={t} type="button" onClick={() => { if (t !== form.type) handleTypeChange(t); }}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all",
                      form.type === t
                        ? "border-[#8B5CF6] bg-[#EDE9FE] dark:bg-[#2e1065] text-[#8B5CF6]"
                        : "border-[#E2E8F0] dark:border-[#334155] text-[#64748B] hover:border-[#8B5CF6] hover:text-[#8B5CF6] hover:bg-[#F5F3FF] dark:hover:bg-[#2e1065]"
                    )}>
                    {TYPE_LABEL[t] ?? t}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-px bg-[#E2E8F0] dark:bg-[#334155]" />
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-[#64748B]">Stage Title <span className="text-[#E05C5C]">*</span></label>
              <input value={form.title} onChange={(e) => update({ title: e.target.value })}
                placeholder="e.g. Identify & Categorize"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A] text-sm focus:outline-none focus:border-[#8B5CF6]" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-[#64748B]">Instruction <span className="text-[#E05C5C]">*</span></label>
              <textarea value={form.instruction} onChange={(e) => update({ instruction: e.target.value })}
                rows={3} placeholder="What should the student do on this stage?"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A] text-sm focus:outline-none focus:border-[#8B5CF6] resize-none leading-relaxed" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-[#64748B]">
                Hint <span className="text-[#94A3B8] font-normal">(optional)</span>
              </label>
              <textarea value={form.hint} onChange={(e) => update({ hint: e.target.value })}
                rows={2} placeholder="A helpful hint shown to Apprentice/Adventurer students…"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A] text-sm focus:outline-none focus:border-[#8B5CF6] resize-none leading-relaxed" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#64748B]">Max Score</label>
                <input type="number" min={0} value={form.maxScore}
                  onChange={(e) => update({ maxScore: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A] text-sm focus:outline-none focus:border-[#8B5CF6]" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#64748B]">Time Limit (sec)</label>
                <input type="number" min={0} value={form.timeLimit}
                  onChange={(e) => update({ timeLimit: e.target.value })}
                  placeholder="None"
                  className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A] text-sm focus:outline-none focus:border-[#8B5CF6]" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#64748B]">MELC Code</label>
                <input value={form.melc} onChange={(e) => update({ melc: e.target.value })}
                  placeholder="M6NS-Ib-97"
                  className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A] text-sm focus:outline-none focus:border-[#8B5CF6]" />
              </div>
            </div>
          </div>
        </section>

        {/* Stage-specific Options */}
        <section>
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] mb-3">
            Stage Content — {TYPE_LABEL[form.type] ?? form.type}
          </h3>
          <OptionsEditor
            type={form.type}
            options={form.options}
            correctAnswer={form.correctAnswer}
            onOptions={(o) => update({ options: o })}
            onCorrectAnswer={(v) => update({ correctAnswer: v })}
          />
        </section>

        {showStandaloneCA && (
          <section className="pb-6">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] mb-3">
              Correct Answer <span className="font-normal normal-case">(auto-scorer reference — leave empty if teacher-graded)</span>
            </h3>
            <textarea value={form.correctAnswer} onChange={(e) => update({ correctAnswer: e.target.value })}
              rows={3} spellCheck={false}
              placeholder="Leave empty for teacher-graded stages"
              className="w-full px-3.5 py-3 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A] text-xs font-mono focus:outline-none focus:border-[#8B5CF6] resize-none" />
          </section>
        )}
      </div>

      {/* Bottom bar */}
      <div className="px-6 py-3 border-t border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#1E293B] flex items-center justify-between shrink-0">
        <p className="text-xs text-[#94A3B8]">Fill in title and instruction to enable Create.</p>
        <button onClick={handleCreate} disabled={saving || !form.title.trim() || !form.instruction.trim()}
          className="px-6 py-2.5 rounded-xl font-nunito font-extrabold text-sm text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:-translate-y-0.5 shadow-md"
          style={{ background: color }}>
          {saving ? "Creating…" : "Create Stage"}
        </button>
      </div>
    </div>
  );
}

// ─── Main client component ────────────────────────────────────

export default function StageEditorClient({ data }: { data: ModuleEditorData }) {
  const router = useRouter();
  const [selectedNum, setSelectedNum] = useState(1);
  const [dirtyNums,   setDirtyNums]   = useState<Set<number>>(new Set());

  const stageMap = new Map(data.stages.map((s) => [s.stageNumber, s]));
  const selectedStage = stageMap.get(selectedNum) ?? null;

  const STATUS_COLOR: Record<string, string> = {
    active:   "bg-[#D1FAE5] text-[#4A9B7F]",
    draft:    "bg-[#FEF3C7] text-[#F59E0B]",
    archived: "bg-[#EEF2F8] text-[#64748B]",
  };

  return (
    <>
      <style>{`.font-nunito { font-family: var(--font-nunito,'Nunito',sans-serif); }`}</style>
      <div className="flex h-screen bg-[#F5F7FA] dark:bg-[#0F172A] text-[#1E293B] dark:text-[#F1F5F9] overflow-hidden">

        {/* LEFT: stage list */}
        <aside className="w-[260px] shrink-0 flex flex-col bg-white dark:bg-[#1E293B] border-r border-[#E2E8F0] dark:border-[#334155]">
          <div className="px-5 py-4 border-b border-[#E2E8F0] dark:border-[#334155]">
            <button onClick={() => router.push("/admin")}
              className="flex items-center gap-1.5 text-xs text-[#64748B] hover:text-[#8B5CF6] font-semibold mb-3 transition-colors">
              ← Back to Admin
            </button>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{data.icon}</span>
              <div className="flex-1 min-w-0">
                <h2 className="font-nunito font-extrabold text-sm leading-tight truncate">{data.title}</h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full", STATUS_COLOR[data.status] ?? STATUS_COLOR.active)}>
                    {data.status}
                  </span>
                  <span className="text-[10px] text-[#94A3B8]">{data.stages.length}/12 stages</span>
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 pt-3 pb-1 flex gap-2 flex-wrap">
            {Object.entries(PHASE_META).map(([, v]) => (
              <span key={v.label} className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: v.lt, color: v.color }}>{v.label}</span>
            ))}
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-0.5">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => (
              <StageListItem key={num}
                stage={stageMap.get(num) ?? null}
                stageNum={num}
                active={selectedNum === num}
                dirty={dirtyNums.has(num)}
                onClick={() => setSelectedNum(num)} />
            ))}
          </nav>

          <div className="px-4 py-3 border-t border-[#E2E8F0] dark:border-[#334155]">
            <p className="text-[10px] text-[#94A3B8] leading-relaxed">
              ⌘S / Ctrl+S to save. Orange dot = unsaved changes.
            </p>
          </div>
        </aside>

        {/* RIGHT: editor */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white dark:bg-[#1E293B]">
          {selectedStage ? (
            <StageForm
              key={selectedStage.id}
              stage={selectedStage}
              moduleId={data.id}
              onSaved={() => {
                setDirtyNums((prev) => { const n = new Set(prev); n.delete(selectedNum); return n; });
                router.refresh();
              }}
            />
          ) : (
            <StageCreateForm
              key={selectedNum}
              stageNum={selectedNum}
              moduleId={data.id}
              onCreated={() => router.refresh()}
            />
          )}
        </main>
      </div>
    </>
  );
}
