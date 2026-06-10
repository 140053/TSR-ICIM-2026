// app/dashboard/student/modules/[moduleId]/stage/[stageNum]/_components/StagePlayer.tsx
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { RichTextView } from "@/components/RichTextEditor";
import { motion, useAnimation } from "framer-motion";
import type {
  StagePageData, StageOptions, ChoiceOption, RankItem,
  TableRow, CheckItem, CalcItem, PlanField, RiskItem,
  TrialItem, SliderQ,
} from "../page";
import CompletionScreen from "./CompletionScreen";
import FeedbackCard, { type FeedbackResult } from "./FeedbackCard";
import HintButton, { HintBox } from "./HintButton";

// ─── PHASE META ───────────────────────────────────────────────
const PHASE_META = {
  UNDERSTANDING: { label:"Understanding", color:"#3B82C4", lt:"#DBEAFE", dark:"#1e3a5f" },
  ANALYSIS:      { label:"Analysis",      color:"#8B5CF6", lt:"#EDE9FE", dark:"#2e1065" },
  SOLUTION:      { label:"Solution",      color:"#F59E0B", lt:"#FEF3C7", dark:"#3d2800" },
  REFLECTION:    { label:"Reflection",    color:"#4A9B7F", lt:"#D1FAE5", dark:"#064e35" },
};
const PC_COLOR: Record<string,string> = { blue:"#3B82C4", purple:"#8B5CF6", amber:"#F59E0B", green:"#4A9B7F" };

// ─── TIMER HOOK ───────────────────────────────────────────────
function useTimer() {
  const [secs, setSecs] = useState(0);
  const ref = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    ref.current = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => { if (ref.current) clearInterval(ref.current); };
  }, []);
  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2,"0")}:${String(s % 60).padStart(2,"0")}`;
  return { secs, fmt: fmt(secs) };
}

// ─── FIELD STYLES ─────────────────────────────────────────────
const TA = "w-full px-4 py-3 bg-[#F8FAFC] dark:bg-[#0F1E2E] border border-[#E2E8F0] dark:border-[#2D3F55] rounded-xl text-sm focus:outline-none focus:border-current placeholder:text-[#94A3B8] text-[#1E293B] dark:text-[#E2E8F0] resize-none leading-relaxed";
const INP = "w-full px-3.5 py-2.5 bg-[#F8FAFC] dark:bg-[#0F1E2E] border border-[#E2E8F0] dark:border-[#2D3F55] rounded-xl text-sm focus:outline-none focus:border-current text-[#1E293B] dark:text-[#E2E8F0] placeholder:text-[#94A3B8]";

// ─── RENDERERS — one per stage type ──────────────────────────

// S1 — Multiple Choice (choice cards 2×2)
function R_ChoiceCards({
  opts, color, answer, setAnswer,
}: { opts: StageOptions; color: string; answer: string; setAnswer:(v:string)=>void }) {
  const choices = opts.choices ?? [];
  const selected = answer ? parseInt(answer) : -1;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
      {choices.map((c, i) => (
        <button
          key={i}
          type="button"
          onClick={() => setAnswer(String(i))}
          className={cn(
            "flex flex-col items-center gap-3 p-5 rounded-2xl border-2 text-center transition-all hover:-translate-y-0.5",
            selected === i
              ? "border-current shadow-lg -translate-y-0.5"
              : "border-[#E2E8F0] dark:border-[#2D3F55] bg-[#F8FAFC] dark:bg-[#0F1E2E] hover:border-current/40"
          )}
          style={selected === i ? { borderColor: color, background: `${color}15` } : {}}
        >
          {selected === i && (
            <span className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white" style={{ background: color }}>✓</span>
          )}
          <span className="text-3xl sm:text-4xl">{c.icon}</span>
          <span className="text-sm font-extrabold font-nunito">{c.title}</span>
          <span className="text-xs text-[#64748B] dark:text-[#94A3B8] leading-relaxed">{c.desc}</span>
          <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-black transition-all", selected===i?"border-0 text-white":"border-[#E2E8F0] dark:border-[#2D3F55]")} style={selected===i?{background:color}:{}}>{selected===i?"✓":""}</div>
        </button>
      ))}
    </div>
  );
}

// S2 — Drag-to-Rank
function R_Ranking({
  opts, color, answer, setAnswer,
}: { opts: StageOptions; color: string; answer: string; setAnswer:(v:string)=>void }) {
  const initial: RankItem[] = opts.rankItems ?? [];
  const [items, setItems] = useState<RankItem[]>(() => {
    if (answer) { try { const p = JSON.parse(answer); return p.length ? p : initial; } catch {} }
    return initial;
  });
  const dragIdx = useRef<number | null>(null);

  useEffect(() => { setAnswer(JSON.stringify(items)); }, [items]);

  const onDragStart = (i: number) => { dragIdx.current = i; };
  const onDragOver  = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    if (dragIdx.current === null || dragIdx.current === i) return;
    const next = [...items];
    const [moved] = next.splice(dragIdx.current, 1);
    next.splice(i, 0, moved);
    dragIdx.current = i;
    setItems(next);
  };
  const onDragEnd = () => { dragIdx.current = null; };

  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mb-1">⬆⬇ Drag to reorder — #1 is most important</p>
      {items.map((item, i) => (
        <div
          key={`${item.text}-${i}`}
          draggable
          onDragStart={() => onDragStart(i)}
          onDragOver={(e) => onDragOver(e, i)}
          onDragEnd={onDragEnd}
          className="flex items-center gap-3.5 p-4 rounded-xl border border-[#E2E8F0] dark:border-[#2D3F55] bg-[#F8FAFC] dark:bg-[#0F1E2E] cursor-grab active:cursor-grabbing transition-all hover:border-current/40 select-none"
          style={{ borderColor: undefined }}
        >
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black text-white flex-shrink-0" style={{ background: color }}>{i + 1}</div>
          <span className="text-xl flex-shrink-0">{item.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold">{item.text}</p>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">{item.sub}</p>
          </div>
          <span className="text-[#94A3B8] text-xl flex-shrink-0">⠿</span>
        </div>
      ))}
    </div>
  );
}

// S3 — Open-Ended + Sentence Starters
function R_OpenEnded({
  opts, color, answer, setAnswer,
}: { opts: StageOptions; color: string; answer: string; setAnswer:(v:string)=>void }) {
  const chips = opts.starterChips ?? [];
  const minChars = opts.minChars ?? 50;
  const insertChip = (text: string) => {
    setAnswer(answer + text);
  };
  return (
    <div>
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {chips.map((chip, i) => (
            <button
              key={i}
              type="button"
              onClick={() => insertChip(chip.text)}
              className="text-xs font-semibold px-3 py-1.5 rounded-full border transition-all hover:text-white"
              style={{ borderColor: color, color, background: "transparent" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = color; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = color; }}
            >
              {chip.label}
            </button>
          ))}
        </div>
      )}
      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Write your answer here…"
        rows={6}
        className={TA}
        style={{ borderColor: answer.length >= minChars ? color : undefined }}
      />
      <div className="flex justify-between mt-1.5">
        <span className="text-xs text-[#94A3B8]">{answer.length} chars</span>
        {answer.length < minChars && (
          <span className="text-xs text-[#F59E0B] font-semibold">{minChars - answer.length} more chars to continue</span>
        )}
        {answer.length >= minChars && (
          <span className="text-xs font-semibold" style={{ color }}>✓ Ready to save</span>
        )}
      </div>
    </div>
  );
}

// S4 — Given / Missing / Assumed Table
function R_Table({
  opts, color, answer, setAnswer,
}: { opts: StageOptions; color: string; answer: string; setAnswer:(v:string)=>void }) {
  const rows = opts.tableRows ?? [];
  const [cells, setCells] = useState<Record<string,string>>(() => {
    if (answer) { try { return JSON.parse(answer); } catch {} }
    return {};
  });
  const setCell = (key: string, val: string) => {
    const next = { ...cells, [key]: val };
    setCells(next);
    setAnswer(JSON.stringify(next));
  };
  return (
    <div className="overflow-x-auto rounded-xl border border-[#E2E8F0] dark:border-[#2D3F55]">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr style={{ background: `${color}20` }}>
            {["Information","🔵 Given","❓ Missing","💭 Assumed"].map((h) => (
              <th key={h} className="text-left px-4 py-3 text-xs font-extrabold uppercase tracking-wide" style={{ color }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-[#E2E8F0] dark:border-[#2D3F55]">
              <td className="px-4 py-3 font-semibold text-xs">{row.label}</td>
              {(["given","missing","assumed"] as const).map((col) => {
                const editable = row[`${col}Editable` as keyof TableRow] as boolean;
                const staticVal = row[col] as string;
                const cellKey = `${i}-${col}`;
                return (
                  <td key={col} className="px-4 py-3">
                    {editable
                      ? <input value={cells[cellKey] ?? ""} onChange={(e) => setCell(cellKey, e.target.value)} placeholder="Enter…" className={INP + " h-8 text-xs"} style={{ borderColor: cells[cellKey] ? color : undefined }} />
                      : staticVal
                        ? <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#EEF2F8] dark:bg-[#162032] text-[#64748B] dark:text-[#94A3B8]">{staticVal}</span>
                        : <span className="text-[#94A3B8] text-xs">—</span>}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// S5 — Checklist
function R_Checklist({
  opts, color, answer, setAnswer,
}: { opts: StageOptions; color: string; answer: string; setAnswer:(v:string)=>void }) {
  const items = opts.checkItems ?? [];
  const [checked, setChecked] = useState<Record<number,boolean>>(() => {
    if (answer) { try { return JSON.parse(answer); } catch {} }
    return {};
  });
  const toggle = (i: number) => {
    const next = { ...checked, [i]: !checked[i] };
    setChecked(next);
    setAnswer(JSON.stringify(next));
  };
  return (
    <div className="flex flex-col gap-2.5">
      {items.map((item, i) => (
        <button
          key={i}
          type="button"
          onClick={() => toggle(i)}
          className={cn(
            "flex items-start gap-3.5 p-4 rounded-xl border-[1.5px] text-left transition-all hover:-translate-y-0.5",
            checked[i] ? "border-current" : "border-[#E2E8F0] dark:border-[#2D3F55] bg-[#F8FAFC] dark:bg-[#0F1E2E]"
          )}
          style={checked[i] ? { borderColor: color, background: `${color}12` } : {}}
        >
          <div className={cn("w-5 h-5 rounded-md border-2 flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5 transition-all", checked[i]?"border-0 text-white":"border-[#CBD5E1] dark:border-[#334155]")}
            style={checked[i] ? { background: color } : {}}>
            {checked[i] ? "✓" : ""}
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold">{item.text}</p>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">{item.desc}</p>
          </div>
        </button>
      ))}
    </div>
  );
}

// S6 — Root Cause Prompts
function R_Prompts({
  opts, color, answer, setAnswer,
}: { opts: StageOptions; color: string; answer: string; setAnswer:(v:string)=>void }) {
  const prompts = opts.prompts ?? [];
  const [vals, setVals] = useState<Record<number,string>>(() => {
    if (answer) { try { return JSON.parse(answer); } catch {} }
    return {};
  });
  const setVal = (i: number, v: string) => {
    const next = { ...vals, [i]: v };
    setVals(next);
    setAnswer(JSON.stringify(next));
  };
  return (
    <div className="flex flex-col gap-5">
      {prompts.map((q, i) => (
        <div key={i}>
          <p className="text-sm font-bold mb-2 flex items-baseline gap-2">
            <span className="font-extrabold font-nunito" style={{ color }}>Q{i+1}</span>
            {q}
          </p>
          <textarea
            value={vals[i] ?? ""}
            onChange={(e) => setVal(i, e.target.value)}
            placeholder="Write your answer…"
            rows={3}
            className={TA}
            style={{ borderColor: vals[i] ? color : undefined }}
          />
        </div>
      ))}
    </div>
  );
}

// S7 — Live Budget Calculator
function R_Calculator({
  opts, color, answer, setAnswer,
}: { opts: StageOptions; color: string; answer: string; setAnswer:(v:string)=>void }) {
  const items = opts.calcItems ?? [];
  const budget = opts.budget ?? 6000;
  const [qtys, setQtys] = useState<Record<number,number>>(() => {
    if (answer) { try { return JSON.parse(answer); } catch {} }
    return {};
  });
  const setQty = (i: number, v: number) => {
    const next = { ...qtys, [i]: v };
    setQtys(next);
    setAnswer(JSON.stringify(next));
  };
  const total = items.reduce((s, item, i) => s + (qtys[i] ?? 0) * item.price, 0);
  const pct   = Math.min(100, (total / budget) * 100);
  const over  = total > budget;
  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-5">
      <div className="flex flex-col gap-2.5">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-3.5 p-4 rounded-xl border border-[#E2E8F0] dark:border-[#2D3F55] bg-[#F8FAFC] dark:bg-[#0F1E2E]">
            <span className="text-2xl flex-shrink-0">{item.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold">{item.label}</p>
              <p className="text-xs text-[#94A3B8]">₱{item.price} per {item.unit}</p>
            </div>
            <span className="text-xs text-[#64748B] dark:text-[#94A3B8] flex-shrink-0">{item.unit}</span>
            <input
              type="number"
              min={0}
              value={qtys[i] ?? ""}
              onChange={(e) => setQty(i, parseInt(e.target.value) || 0)}
              placeholder="0"
              className="w-16 sm:w-20 px-2 sm:px-2.5 py-2 rounded-xl border border-[#E2E8F0] dark:border-[#2D3F55] bg-white dark:bg-[#1E293B] text-sm text-right font-bold focus:outline-none focus:border-current"
              style={{ borderColor: qtys[i] ? color : undefined }}
            />
          </div>
        ))}
      </div>
      <div className="bg-[#F8FAFC] dark:bg-[#0F1E2E] border border-[#E2E8F0] dark:border-[#2D3F55] rounded-xl p-5 flex flex-col gap-3">
        {items.map((item, i) => (
          <div key={i} className="flex justify-between text-sm">
            <span className="text-[#64748B] dark:text-[#94A3B8]">{item.icon} {item.label.split(" ")[0]}</span>
            <span className="font-bold">₱{((qtys[i]??0)*item.price).toLocaleString()}</span>
          </div>
        ))}
        <div className="border-t border-[#E2E8F0] dark:border-[#2D3F55] pt-3">
          <div className="flex justify-between mb-1"><span className="text-sm text-[#64748B]">Budget</span><span className="font-bold text-sm">₱{budget.toLocaleString()}</span></div>
          <div className="flex justify-between mb-3">
            <span className="text-sm text-[#64748B]">Total</span>
            <span className={cn("font-extrabold font-nunito text-lg", over ? "text-[#E05C5C]" : "")} style={!over?{color}:{}}>₱{total.toLocaleString()}</span>
          </div>
          <div className="h-3 bg-[#E2E8F0] dark:bg-[#2D3F55] rounded-full overflow-hidden mb-2">
            <div className="h-full rounded-full transition-all duration-500" style={{ width:`${pct}%`, background: over?"#E05C5C":color }} />
          </div>
          <div className={cn("text-xs font-bold text-center px-3 py-2 rounded-lg", over?"bg-[#FEE2E2] dark:bg-[#450a0a] text-[#E05C5C]":"bg-[#D1FAE5] dark:bg-[#064e35] text-[#4A9B7F]")}>
            {over ? `⚠️ Over by ₱${(total-budget).toLocaleString()}` : `✅ ₱${(budget-total).toLocaleString()} remaining`}
          </div>
          <div className="text-[11px] text-center text-[#94A3B8] mt-2">
            Cost per child: ₱{(total/120).toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
}

// S8 — Multi-Plan (Plan A / Plan B)
function R_MultiPlan({
  opts, color, answer, setAnswer,
}: { opts: StageOptions; color: string; answer: string; setAnswer:(v:string)=>void }) {
  const labels   = opts.planLabels   ?? ["Plan A","Plan B"];
  const fields   = opts.planFields   ?? [];
  const planBudget = opts.planBudget ?? 6000;

  type PlanData = Record<string, string|number>;
  const [activeTab, setActiveTab]   = useState(0);
  const [plans, setPlans] = useState<[PlanData, PlanData]>(() => {
    if (answer) { try { const p = JSON.parse(answer); return p; } catch {} }
    return [{},{}];
  });

  const setField = (key: string, val: string|number) => {
    const next: [PlanData,PlanData] = [{ ...plans[0] }, { ...plans[1] }];
    next[activeTab] = { ...next[activeTab], [key]: val };
    setPlans(next);
    setAnswer(JSON.stringify(next));
  };

  const estimateTotal = (plan: PlanData) => {
    // Auto-compute if fields have price metadata (key matches calcItem id pattern)
    const numericFields = fields.filter(f => f.type==="number");
    // Try to compute from known price fields rice/canned/juice
    const prices: Record<string,number> = { rice:52, canned:28, juice:15 };
    return numericFields.reduce((s, f) => {
      const v = Number(plan[f.key] ?? 0);
      return s + (prices[f.key] ? v * prices[f.key] : 0);
    }, 0);
  };

  const est = estimateTotal(plans[activeTab]);
  const over = est > planBudget && est > 0;

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {labels.map((lbl, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActiveTab(i)}
            className={cn("flex-1 py-3 rounded-xl border text-sm font-nunito font-extrabold transition-all",
              activeTab===i
                ? "border-current text-current"
                : "border-[#E2E8F0] dark:border-[#2D3F55] text-[#64748B] hover:border-current/50"
            )}
            style={activeTab===i ? { borderColor:color, color, background:`${color}12` } : {}}
          >
            📋 {lbl}
          </button>
        ))}
      </div>
      {/* Form */}
      <div className="flex flex-col gap-4">
        {fields.map((f) => (
          <div key={f.key}>
            <label className="text-[11px] font-bold uppercase tracking-widest text-[#64748B] dark:text-[#94A3B8] block mb-1.5">{f.label}</label>
            {f.type === "text"
              ? <textarea
                  value={String(plans[activeTab][f.key]??"")}
                  onChange={(e) => setField(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  rows={3}
                  className={TA}
                  style={{ borderColor: plans[activeTab][f.key] ? color : undefined }}
                />
              : <input
                  type="number"
                  min={0}
                  value={String(plans[activeTab][f.key]??"")}
                  onChange={(e) => setField(f.key, parseInt(e.target.value)||0)}
                  placeholder={f.placeholder}
                  className={INP + " h-11"}
                  style={{ borderColor: plans[activeTab][f.key] ? color : undefined }}
                />
            }
          </div>
        ))}
        {/* Estimate */}
        {est > 0 && (
          <div className={cn("px-4 py-3 rounded-xl text-sm font-semibold flex items-center justify-between", over?"bg-[#FEE2E2] dark:bg-[#450a0a] text-[#E05C5C]":"bg-[#EEF2F8] dark:bg-[#162032] text-[#64748B] dark:text-[#94A3B8]")}>
            <span>💰 Estimated total</span>
            <span className="font-extrabold font-nunito text-base" style={!over?{color}:{color:"#E05C5C"}}>
              ₱{est.toLocaleString()}
              {over && " ⚠️ Over!"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// S9 — Risk Cards + Contingency
function R_Risk({
  opts, color, answer, setAnswer,
}: { opts: StageOptions; color: string; answer: string; setAnswer:(v:string)=>void }) {
  const items = opts.riskItems ?? [];
  const [state, setState] = useState<{ selected: Record<number,boolean>; note: string }>(() => {
    if (answer) { try { return JSON.parse(answer); } catch {} }
    return { selected:{}, note:"" };
  });
  const toggle = (i: number) => {
    const next = { ...state, selected: { ...state.selected, [i]: !state.selected[i] } };
    setState(next);
    setAnswer(JSON.stringify(next));
  };
  const setNote = (note: string) => {
    const next = { ...state, note };
    setState(next);
    setAnswer(JSON.stringify(next));
  };
  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
        {items.map((item, i) => (
          <button
            key={i}
            type="button"
            onClick={() => toggle(i)}
            className={cn("p-4 rounded-xl border-[1.5px] text-left transition-all hover:-translate-y-0.5",
              state.selected[i] ? "border-current" : "border-[#E2E8F0] dark:border-[#2D3F55] bg-[#F8FAFC] dark:bg-[#0F1E2E]"
            )}
            style={state.selected[i]?{borderColor:color,background:`${color}12`}:{}}
          >
            <div className="flex items-start justify-between mb-1">
              <span className="text-2xl">{item.emoji}</span>
              <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center text-[8px] font-black text-white transition-all", state.selected[i]?"border-0":"border-[#CBD5E1] dark:border-[#334155]")}
                style={state.selected[i]?{background:color}:{}}>
                {state.selected[i]?"✓":""}
              </div>
            </div>
            <p className="text-xs font-bold leading-tight">{item.title}</p>
            <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-0.5">{item.sub}</p>
          </button>
        ))}
      </div>
      {opts.hasContingency !== false && (
        <div>
          <label className="text-[11px] font-bold uppercase tracking-widest text-[#64748B] dark:text-[#94A3B8] block mb-1.5">💬 What is your contingency plan?</label>
          <textarea
            value={state.note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="How will you handle these risks?"
            rows={3}
            className={TA}
            style={{ borderColor: state.note ? color : undefined }}
          />
        </div>
      )}
    </div>
  );
}

// S10 — Trial Implementation Checker
function R_Trial({
  opts, color, answer, setAnswer,
}: { opts: StageOptions; color: string; answer: string; setAnswer:(v:string)=>void }) {
  const items  = opts.trialItems  ?? [];
  const budget = opts.trialBudget ?? 6000;
  const [qtys, setQtys] = useState<Record<string,number>>(() => {
    if (answer) { try { return JSON.parse(answer); } catch {} }
    return {};
  });
  const setQty = (id: string, v: number) => {
    const next = { ...qtys, [id]: v };
    setQtys(next);
    setAnswer(JSON.stringify(next));
  };
  const total = items.reduce((s,it)=>s+(qtys[it.id]??0)*it.price, 0);
  const pct   = Math.min(100,(total/budget)*100);
  const over  = total > budget;
  return (
    <div>
      {/* Table */}
      <div className="rounded-xl border border-[#E2E8F0] dark:border-[#2D3F55] overflow-x-auto mb-4">
        <div className="grid grid-cols-[1fr_64px_80px_72px] sm:grid-cols-[1fr_90px_90px_90px] gap-2 px-3 sm:px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest" style={{background:`${color}18`,color}}>
          <span>Item</span><span className="text-center">Qty</span><span className="text-center">Price</span><span className="text-right">Cost</span>
        </div>
        {items.map((item) => (
          <div key={item.id} className="grid grid-cols-[1fr_64px_80px_72px] sm:grid-cols-[1fr_90px_90px_90px] gap-2 items-center px-3 sm:px-4 py-3 border-t border-[#E2E8F0] dark:border-[#2D3F55] bg-[#F8FAFC] dark:bg-[#0F1E2E]">
            <span className="text-sm font-bold">{item.icon} {item.name}</span>
            <input
              type="number"
              min={0}
              value={qtys[item.id] ?? ""}
              onChange={(e)=>setQty(item.id,parseInt(e.target.value)||0)}
              placeholder="0"
              className="h-9 rounded-lg border border-[#E2E8F0] dark:border-[#2D3F55] bg-white dark:bg-[#1E293B] text-sm text-center font-bold focus:outline-none focus:border-current w-full"
              style={{borderColor:qtys[item.id]?color:undefined}}
            />
            <span className="text-xs text-[#64748B] dark:text-[#94A3B8] text-center">₱{item.price}/{item.unit}</span>
            <span className="text-sm font-bold text-right" style={{color}}>₱{((qtys[item.id]??0)*item.price).toLocaleString()}</span>
          </div>
        ))}
      </div>
      {/* Budget bar */}
      <div className="bg-[#F8FAFC] dark:bg-[#0F1E2E] border border-[#E2E8F0] dark:border-[#2D3F55] rounded-xl p-4">
        <div className="flex justify-between mb-1"><span className="text-sm text-[#64748B]">Budget Limit</span><span className="font-bold text-sm">₱{budget.toLocaleString()}</span></div>
        <div className="flex justify-between mb-3">
          <span className="text-sm text-[#64748B]">Total Cost</span>
          <span className={cn("font-extrabold font-nunito text-xl",over?"text-[#E05C5C]":"")} style={!over?{color}:{}}> ₱{total.toLocaleString()}</span>
        </div>
        <div className="h-3 bg-[#E2E8F0] dark:bg-[#2D3F55] rounded-full overflow-hidden mb-2">
          <div className="h-full rounded-full transition-all duration-500" style={{width:`${pct}%`,background:over?"#E05C5C":color}} />
        </div>
        <div className={cn("text-xs font-bold text-center px-3 py-2 rounded-lg mb-2",over?"bg-[#FEE2E2] dark:bg-[#450a0a] text-[#E05C5C]":"bg-[#D1FAE5] dark:bg-[#064e35] text-[#4A9B7F]")}>
          {over ? `⚠️ Over budget by ₱${(total-budget).toLocaleString()}! Reduce quantities.` : `✅ Within budget! Remaining: ₱${(budget-total).toLocaleString()}`}
        </div>
        <div className="text-[11px] text-center text-[#94A3B8]">
          👦 Cost per child: <strong style={{color}}>₱{(total/120).toFixed(2)}</strong>
        </div>
      </div>
    </div>
  );
}

// S11 — Choose Best Solution (reads S8 plan data)
function R_ChooseJustify({
  opts, color, answer, setAnswer, planAnswerJson,
}: { opts: StageOptions; color: string; answer: string; setAnswer:(v:string)=>void; planAnswerJson: string|null }) {
  type Plans = [{rice?:number;canned?:number;juice?:number;reason?:string}|Record<string,number|string>, Record<string,number|string>];
  const plans: Plans = (() => {
    if (planAnswerJson) { try { const p = JSON.parse(planAnswerJson); if(Array.isArray(p) && p.length >= 2) return p as Plans; } catch {} }
    return [{},{}];
  })();

  const [state, setState] = useState<{chosen:"A"|"B"|null; justify:string}>(() => {
    if (answer) { try { return JSON.parse(answer); } catch {} }
    return { chosen:null, justify:"" };
  });
  const choose = (c:"A"|"B") => {
    const next = { ...state, chosen:c };
    setState(next);
    setAnswer(JSON.stringify(next));
  };
  const setJustify = (j:string) => {
    const next = { ...state, justify:j };
    setState(next);
    setAnswer(JSON.stringify(next));
  };

  const calcEst = (plan: Record<string,number|string>) => {
    const r = Number(plan.rice??0); const c2 = Number(plan.canned??0); const j = Number(plan.juice??0);
    return r*52 + c2*28 + j*15;
  };

  const planLabels = opts.planLabels ?? ["Plan A","Plan B"];
  const planColors = ["#3B82C4","#8B5CF6"];

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-5">
        {([0,1] as const).map((idx) => {
          const plan = plans[idx] as Record<string,number|string>;
          const est  = calcEst(plan);
          const over = est > 6000;
          const isSelected = state.chosen === (idx===0?"A":"B");
          return (
            <button
              key={idx}
              type="button"
              onClick={() => choose(idx===0?"A":"B")}
              className={cn("p-5 rounded-2xl border-2 text-left transition-all hover:-translate-y-0.5",
                isSelected ? "border-current shadow-lg -translate-y-0.5" : "border-[#E2E8F0] dark:border-[#2D3F55] bg-[#F8FAFC] dark:bg-[#0F1E2E]"
              )}
              style={isSelected?{borderColor:color,background:`${color}10`}:{}}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white" style={{background:planColors[idx]}}>📋 {planLabels[idx]}</span>
                {isSelected && <span className="text-xs font-bold" style={{color}}>✓ Selected</span>}
              </div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {Object.entries(plan).filter(([k])=>k!=="reason").map(([k,v])=>(
                  <span key={k} className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-[#EEF2F8] dark:bg-[#162032] text-[#64748B] dark:text-[#94A3B8]">
                    {k}: {v}
                  </span>
                ))}
              </div>
              {plan.reason && <p className="text-xs text-[#64748B] dark:text-[#94A3B8] italic mb-2 line-clamp-2">{String(plan.reason)}</p>}
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#94A3B8]">Est. Total</span>
                <span className={cn("text-sm font-extrabold font-nunito",over?"text-[#E05C5C]":"")} style={!over?{color}:{color:"#E05C5C"}}>
                  ₱{est.toLocaleString()} {over?"⚠️":"✅"}
                </span>
              </div>
              <div className="text-[11px] text-[#94A3B8] text-right">₱{(est/120).toFixed(2)}/child</div>
            </button>
          );
        })}
      </div>
      <div>
        <label className="text-[11px] font-bold uppercase tracking-widest text-[#64748B] dark:text-[#94A3B8] block mb-1.5">
          {opts.justifyLabel ?? "📝 Justify your choice using mathematics"}
        </label>
        <textarea
          value={state.justify}
          onChange={(e) => setJustify(e.target.value)}
          placeholder="Explain WHY you chose this plan. Use numbers to support your answer…"
          rows={5}
          className={TA}
          style={{ borderColor: state.justify ? color : undefined }}
        />
      </div>
    </div>
  );
}

// S12 — Reflection Sliders
function R_Reflection({
  opts, color, answer, setAnswer,
}: { opts: StageOptions; color: string; answer: string; setAnswer:(v:string)=>void }) {
  const sliders     = opts.sliderQuestions ?? [];
  const reflections = opts.openReflections ?? [];
  type State = { sliders: Record<string,number>; texts: Record<string,string> };
  const [state, setState] = useState<State>(() => {
    if (answer) { try { return JSON.parse(answer); } catch {} }
    const init: Record<string,number> = {};
    sliders.forEach(s => { init[s.key] = 5; });
    return { sliders: init, texts: {} };
  });
  const setSlider = (key:string, val:number) => {
    const next = { ...state, sliders: { ...state.sliders, [key]: val } };
    setState(next); setAnswer(JSON.stringify(next));
  };
  const setText = (key:string, val:string) => {
    const next = { ...state, texts: { ...state.texts, [key]: val } };
    setState(next); setAnswer(JSON.stringify(next));
  };
  return (
    <div className="flex flex-col gap-5">
      {sliders.map((s) => (
        <div key={s.key} className="bg-[#F8FAFC] dark:bg-[#0F1E2E] border border-[#E2E8F0] dark:border-[#2D3F55] rounded-xl p-5">
          <p className="text-sm font-bold mb-3">🎯 {s.question}</p>
          <div className="flex justify-between text-[11px] text-[#94A3B8] mb-1.5 font-semibold">
            <span>{s.loLabel}</span><span>{s.hiLabel}</span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            step={1}
            value={state.sliders[s.key] ?? 5}
            onChange={(e) => setSlider(s.key, parseInt(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
            style={{ accentColor: color }}
          />
          <div className="text-center font-nunito font-extrabold text-2xl mt-2" style={{ color }}>
            {state.sliders[s.key] ?? 5} / 10
          </div>
        </div>
      ))}
      {reflections.map((r) => (
        <div key={r.key} className="bg-[#F8FAFC] dark:bg-[#0F1E2E] border border-[#E2E8F0] dark:border-[#2D3F55] rounded-xl p-5">
          <p className="text-sm font-bold mb-2">💬 {r.question}</p>
          <textarea
            value={state.texts[r.key] ?? ""}
            onChange={(e) => setText(r.key, e.target.value)}
            placeholder="Write your reflection…"
            rows={3}
            className={TA}
            style={{ borderColor: state.texts[r.key] ? color : undefined }}
          />
        </div>
      ))}
    </div>
  );
}

// ─── STAGE DISPATCHER ─────────────────────────────────────────
function StageRenderer({
  data, answer, setAnswer,
}: { data: StagePageData; answer: string; setAnswer: (v:string)=>void }) {
  const phase = PHASE_META[data.phase];
  const color = phase.color;
  const props = { opts: data.options, color, answer, setAnswer };

  // Dispatch by stageType so both the legacy wizard (specific types per stage)
  // and the simplified wizard (MC/Ranking/OpenEnded on any stage) render correctly.
  // For OPEN_ENDED and CHECKLIST, fall back to stage-number variants that have
  // richer prompts/risk-card UI when the original type was used.
  switch (data.stageType) {
    case "MULTIPLE_CHOICE":   return <R_ChoiceCards   {...props} />;
    case "RANKING":           return <R_Ranking       {...props} />;
    case "OPEN_ENDED":        return data.stageNum === 6 ? <R_Prompts    {...props} /> : <R_OpenEnded {...props} />;
    case "TABLE_INPUT":       return <R_Table         {...props} />;
    case "CHECKLIST":         return data.stageNum === 9 ? <R_Risk       {...props} /> : <R_Checklist {...props} />;
    case "COMPUTATION":       return <R_Calculator    {...props} />;
    case "MULTI_PLAN":        return <R_MultiPlan     {...props} />;
    case "BUDGET_CHECK":      return <R_Trial         {...props} />;
    case "SELECT_JUSTIFY":    return <R_ChooseJustify {...props} planAnswerJson={data.planAnswerJson} />;
    case "REFLECTION_SLIDER": return <R_Reflection    {...props} />;
    default:                  return <p className="text-sm text-[#94A3B8]">Unknown stage type.</p>;
  }
}

// ─── MAIN STAGE PLAYER ────────────────────────────────────────
export default function StagePlayer({ data }: { data: StagePageData }) {
  const router  = useRouter();
  const { secs, fmt: timerFmt } = useTimer();

  const [answer,      setAnswer]      = useState(data.existingAnswer ?? "");
  const [showHint,    setShowHint]    = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [saveError,   setSaveError]   = useState<string|null>(null);
  const [savedToast,  setSavedToast]  = useState(false);
  const [completed,   setCompleted]   = useState(false);
  const [feedback,    setFeedback]    = useState<FeedbackResult | null>(null);
  // Pending navigation stored while the feedback card is visible
  const pendingNav = useRef<(() => void) | null>(null);

  // ─── Slide animation ──────────────────────────────────────────
  const animCtrl = useAnimation();
  const NAV_KEY  = "tsr_stage_nav";

  // On mount: determine entry direction from sessionStorage, then slide in
  useEffect(() => {
    const raw  = sessionStorage.getItem(NAV_KEY);
    const prev: { moduleId: number; stageNum: number } | null = raw ? JSON.parse(raw) : null;

    // Decide which side to enter from
    let fromX = 48; // default: forward (→ enters from right)
    if (prev && prev.moduleId === data.moduleId) {
      fromX = data.stageNum >= prev.stageNum ? 48 : -48;
    } else if (!prev) {
      fromX = 0; // very first visit — just fade in
    }

    animCtrl.set({ opacity: 0, x: fromX });
    void animCtrl.start({
      opacity: 1, x: 0,
      transition: { duration: 0.32, ease: [0.25, 0.1, 0.25, 1] },
    });

    // Remember current stage for the next transition
    return () => {
      sessionStorage.setItem(NAV_KEY, JSON.stringify({
        moduleId: data.moduleId, stageNum: data.stageNum,
      }));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Animate out, then push route
  const navigateTo = useCallback(async (url: string, direction: "forward" | "back") => {
    await animCtrl.start({
      opacity: 0,
      x: direction === "forward" ? -48 : 48,
      transition: { duration: 0.2, ease: "easeIn" },
    });
    router.push(url);
  }, [animCtrl, router]);

  const phase = PHASE_META[data.phase];
  const color = phase.color;

  const isAnswerReady = useCallback((): boolean => {
    if (!answer || answer.trim() === "" || answer === "{}" || answer === "[]") return false;
    // OPEN_ENDED: enforce minChars if set
    if (data.stageType === "OPEN_ENDED") {
      const minChars = data.options.starterChips ? (data.options.minChars ?? 50) : 0;
      return answer.length >= minChars;
    }
    // SELECT_JUSTIFY: needs both a chosen plan and a non-empty justification
    if (data.stageType === "SELECT_JUSTIFY") {
      try { const p = JSON.parse(answer); return !!p.chosen && !!p.justify?.trim(); } catch { return false; }
    }
    return true;
  }, [answer, data.stageType, data.options]);

  const handleSave = async (goNext = true) => {
    if (!isAnswerReady()) return;
    setSaving(true);
    setSaveError(null);

    try {
      const res = await fetch(`/api/student/modules/${data.moduleId}/stage/${data.stageNum}`, {
        method:      "POST",
        headers:     { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ answer, timeSpent: secs }),
      });
      const d = await res.json();

      if (!res.ok || !d.success) {
        setSaveError(d.error ?? "Failed to save. Please try again.");
        setSaving(false);
        return;
      }

      if (!goNext) {
        setSavedToast(true);
        setTimeout(() => setSavedToast(false), 2000);
        setSaving(false);
        return;
      }

      // Show feedback card — navigation happens when the user dismisses it
      const result: FeedbackResult = {
        isCorrect:  d.isCorrect  ?? null,
        score:      d.score      ?? null,
        maxScore:   d.maxScore   ?? 10,
        stageNum:   data.stageNum,
        phaseColor: color,
      };
      pendingNav.current = data.stageNum === 12
        ? async () => {
            const r = await fetch(`/api/student/modules/${data.moduleId}/quiz-check`, { credentials: "include" });
            const q = await r.json();
            if (q.hasQuestions) {
              await navigateTo(`/dashboard/student/modules/${data.moduleId}/quiz`, "forward");
            } else {
              setCompleted(true);
            }
          }
        : async () => navigateTo(`/dashboard/student/modules/${data.moduleId}/stage/${data.stageNum + 1}`, "forward");
      setFeedback(result);
    } catch {
      setSaveError("Network error. Please check your connection.");
    } finally {
      setSaving(false);
    }
  };

  const handleFeedbackContinue = useCallback(() => {
    const nav = pendingNav.current;
    pendingNav.current = null;
    setFeedback(null);
    if (nav) nav();
  }, []);

  if (completed) return <CompletionScreen moduleId={data.moduleId} moduleTitle={data.moduleTitle} moduleIcon={data.moduleIcon} />;

  return (
    <>
      <style>{`
        .font-nunito { font-family: var(--font-nunito,'Nunito',sans-serif); }
        .font-cinzel { font-family: var(--font-cinzel,'Cinzel',serif); }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation:fadeUp .35s ease both; }
        @keyframes toastIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes bounce { 0%{transform:scale(.5)} 60%{transform:scale(1.1)} 100%{transform:scale(1)} }
      `}</style>

      <div className="min-h-screen bg-[#F5F7FA] dark:bg-[#0F172A] text-[#1E293B] dark:text-[#F1F5F9] flex flex-col">

        {/* ── TOPBAR ── */}
        <header className="sticky top-0 z-40 bg-white dark:bg-[#1E293B] border-b border-[#E2E8F0] dark:border-[#2D3F55] px-3 sm:px-5 h-[60px] flex items-center gap-2 sm:gap-3 shadow-sm">
          <button
            onClick={() => void navigateTo(`/dashboard/student/modules`, "back")}
            className="p-2 rounded-xl hover:bg-[#EEF2F8] dark:hover:bg-[#162032] text-[#64748B] hover:text-[#3B82C4] font-bold transition-colors flex-shrink-0"
          >
            ←
          </button>

          {/* Module logo / banner thumbnail */}
          {data.moduleBannerUrl ? (
            <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-[#E2E8F0] dark:border-[#2D3F55]">
              <img src={data.moduleBannerUrl} alt="" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-extrabold shrink-0"
              style={{ background: `linear-gradient(135deg,${color},${PC_COLOR.green ?? "#4A9B7F"})` }}>
              T
            </div>
          )}

          <div className="flex-1 min-w-0">
            <p className="text-sm font-extrabold font-nunito leading-tight truncate">
              {data.moduleIcon} {data.moduleTitle}
            </p>
            <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">Grade 6 · {data.avatarEmoji} {data.avatarName}</p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Auto-save indicator */}
            <span className="text-[11px] text-[#94A3B8] hidden sm:block">💾 Auto-save</span>

            {/* Hint button — difficulty-aware */}
            <HintButton
              hint={data.hint}
              difficulty={data.difficulty}
              color={color}
              open={showHint}
              onToggle={setShowHint}
            />

            {/* Timer */}
            <div className="text-[11px] font-mono font-bold text-[#94A3B8] hidden sm:block">⏱️ {timerFmt}</div>
          </div>
        </header>

        {/* ── PIP TRACKER ── */}
        <div className="bg-white dark:bg-[#1E293B] border-b border-[#E2E8F0] dark:border-[#2D3F55] px-5 py-3 flex items-center gap-3">
          <div className="flex gap-[3px] flex-1">
            {data.pipStatuses.map((status, i) => {
              const c = PC_COLOR[data.phaseColors[i]];
              return (
                <button
                  key={i}
                  title={`Stage ${i+1}`}
                  onClick={() => void navigateTo(`/dashboard/student/modules/${data.moduleId}/stage/${i+1}`, i+1 >= data.stageNum ? "forward" : "back")}
                  className={cn("flex-1 h-[6px] rounded-full transition-all hover:opacity-80", status==="locked"&&"cursor-default hover:opacity-100")}
                  style={{
                    background: status==="done"    ? c :
                                status==="current" ? c :
                                status==="empty"   ? "#E2E8F0" : "#E2E8F0",
                    animation: status==="current" ? "pipBlink 1.5s ease-in-out infinite" : undefined,
                    opacity: status==="locked" ? 0.3 : 1,
                  }}
                />
              );
            })}
          </div>
          <div className="flex-shrink-0 text-right">
            <div className="text-xs font-extrabold font-nunito" style={{ color }}>
              Stage {data.stageNum} of 12
            </div>
            <div className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border" style={{ background:`${color}15`, borderColor:color, color }}>
              {phase.label}
            </div>
          </div>
        </div>

        {/* ── ANIMATED CONTENT ── */}
        <motion.div animate={animCtrl} style={{ willChange: "transform, opacity" }}>

          {/* ── HINT BOX ── */}
          <HintBox hint={data.hint} open={showHint} />

          {/* ── SCENARIO BANNER ── */}
          <div className="mx-3 sm:mx-5 mt-4 rounded-xl border border-[#E2E8F0] dark:border-[#2D3F55] bg-white dark:bg-[#1E293B] shadow-sm overflow-hidden"
            style={{ borderLeftWidth: data.moduleBannerUrl ? undefined : "4px", borderLeftColor: color }}>
            {/* Module banner image */}
            {data.moduleBannerUrl && (
              <div className="relative w-full h-32 overflow-hidden">
                <img
                  src={data.moduleBannerUrl}
                  alt={`${data.moduleTitle} banner`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 h-0.75" style={{ background: color }} />
              </div>
            )}
            {/* Scenario text */}
            <div className="p-3 sm:p-4 flex items-start gap-3">
              <span className="text-2xl shrink-0 mt-0.5">{data.moduleIcon}</span>
              <RichTextView html={data.moduleScenario} className="text-[#64748B] dark:text-[#94A3B8]" />
            </div>
          </div>

          {/* ── STAGE CARD ── */}
          <div className="mx-3 sm:mx-5 mt-4 mb-2 bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#2D3F55] rounded-2xl shadow-md overflow-hidden">
            {/* Card header */}
            <div className="px-4 sm:px-7 py-4 sm:py-5 border-b border-[#E2E8F0] dark:border-[#2D3F55] flex items-start gap-3 sm:gap-4"
              style={{ background:`${color}10` }}>
              <div className="w-11 h-11 rounded-full flex items-center justify-center text-lg font-black text-white flex-shrink-0 shadow-lg"
                style={{ background: color }}>
                {data.stageNum}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-nunito font-extrabold text-xl mb-1">{data.stageTitle}</h2>
                <p className="text-sm text-[#64748B] dark:text-[#94A3B8] leading-relaxed">{data.instruction}</p>
              </div>
            </div>

            {/* Already done banner */}
            {data.alreadyDone && (
              <div className="px-7 py-3 border-b border-[#E2E8F0] dark:border-[#2D3F55] flex items-center gap-2 bg-[#D1FAE5] dark:bg-[#064e35]">
                <span className="text-[#4A9B7F]">✅</span>
                <p className="text-sm font-semibold text-[#4A9B7F]">
                  You've already answered this stage
                  {data.existingScore != null && ` — Score: ${data.existingScore}/${data.maxScore}`}.
                  You can update your answer before moving on.
                </p>
              </div>
            )}

            {/* Card body */}
            <div className="px-4 sm:px-7 py-5 sm:py-7">
              <StageRenderer data={data} answer={answer} setAnswer={setAnswer} />
            </div>
          </div>

          {/* ── ERROR ── */}
          {saveError && (
            <div className="mx-3 sm:mx-5 mb-2 px-4 py-3 bg-[#FEE2E2] dark:bg-[#450a0a] border border-[#E05C5C] rounded-xl text-sm text-[#E05C5C] font-semibold flex items-start gap-2">
              <span>⚠️</span><span>{saveError}</span>
            </div>
          )}

        </motion.div>

        {/* ── NAV FOOTER ── */}
        <div className="sticky bottom-0 z-30 bg-white dark:bg-[#1E293B] border-t border-[#E2E8F0] dark:border-[#2D3F55] px-3 sm:px-5 py-3 sm:py-4 flex items-center justify-between gap-2 sm:gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
          {/* Back */}
          <button
            onClick={() => {
              if (data.stageNum > 1) void navigateTo(`/dashboard/student/modules/${data.moduleId}/stage/${data.stageNum - 1}`, "back");
              else void navigateTo(`/dashboard/student/modules`, "back");
            }}
            className={cn(
              "font-nunito font-bold text-sm px-5 py-3 rounded-xl border transition-all",
              "border-[#E2E8F0] dark:border-[#2D3F55] text-[#64748B]",
              "hover:border-current hover:text-current"
            )}
            style={{ '--tw-text-opacity':'1' } as React.CSSProperties}
          >
            ← {data.stageNum === 1 ? "My Modules" : "Previous"}
          </button>

          {/* Timer (mobile) */}
          <span className="text-[11px] font-mono font-bold text-[#94A3B8] sm:hidden">⏱️ {timerFmt}</span>

          {/* Save & Continue */}
          <button
            onClick={() => handleSave(true)}
            disabled={saving || !isAnswerReady()}
            className="font-nunito font-extrabold text-sm px-7 py-3 rounded-xl text-white transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none shadow-[0_4px_14px_rgba(0,0,0,0.15)]"
            style={{ background: color }}
          >
            {saving
              ? "⏳ Saving…"
              : data.stageNum === 12
              ? "Submit & Finish ✓"
              : "Save & Continue →"}
          </button>
        </div>

        {/* ── SAVE TOAST ── */}
        {savedToast && (
          <div className="fixed bottom-24 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl font-nunito font-bold text-sm text-white shadow-xl"
            style={{ background:"#4A9B7F", animation:"toastIn .3s cubic-bezier(.34,1.56,.64,1)" }}>
            ✅ Answer saved!
          </div>
        )}
      </div>

      {/* Pip blink keyframe */}
      <style>{`
        @keyframes pipBlink { 0%,100%{opacity:1} 50%{opacity:.45} }
      `}</style>

      {/* ── FEEDBACK CARD ── */}
      <FeedbackCard result={feedback} onContinue={handleFeedbackContinue} />
    </>
  );
}