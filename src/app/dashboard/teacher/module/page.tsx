"use client";

import { useState } from "react";
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
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

/* ═══════════════════════════════════════════
   TYPES
═══════════════════════════════════════════ */
type ModuleStatus = "active" | "draft" | "archived";
type StudentStatus = "done" | "inprog" | "stuck" | "notstart";
type TabKey = "assigned" | "library" | "results";
type FilterKey = "all" | ModuleStatus;

interface Student {
  name: string;
  short: string;
  emoji: string;
  status: StudentStatus;
  stage: number;
  data?: StudentDrawerData;
}

interface ClusterScore {
  icon: string;
  label: string;
  pct: number;
  quality: "good" | "fair" | "weak";
}

interface ModuleCard {
  id: string;
  emoji: string;
  context: string;
  contextColor: string;
  title: string;
  duration: string;
  status: ModuleStatus;
  dueTag: string;
  scenario: string;
  scenarioBorder: string;
  completion: { pct: number; done: number; inprog: number; notstart: number; total: number };
  students: Student[];
  clusters: ClusterScore[];
  insight: { text: string; type: "good" | "warn" };
  gradeCount: number;
  wide?: boolean;
  checklist?: { done: boolean; label: string }[];
  tags?: string[];
}

interface StudentDrawerData {
  stage: string;
  score: string;
  time: string;
  alert: string | null;
  clusters: { label: string; color: string; pct: number; badge: string; badgeCls: string }[];
  stages: { num: number; title: string; sub: string; status: "done" | "current" | "pending"; score: string }[];
}

/* ═══════════════════════════════════════════
   DATA
═══════════════════════════════════════════ */
const JUAN_DATA: StudentDrawerData = {
  stage: "8/12", score: "67%", time: "43m",
  alert: "⚠️ Struggling in Analysis. Consider remediation before Stage 8.",
  clusters: [
    { label: "🔵 Understanding", color: "#3B82C4", pct: 80, badge: "Good",    badgeCls: "bg-[#D1FAE5] text-[#4A9B7F]" },
    { label: "🟣 Analysis",      color: "#8B5CF6", pct: 61, badge: "Fair",    badgeCls: "bg-[#FEF3C7] text-[#F59E0B]" },
    { label: "🟠 Solution",      color: "#F59E0B", pct: 0,  badge: "Pending", badgeCls: "bg-[#FEF3C7] text-[#F59E0B]" },
    { label: "🟢 Reflection",    color: "#4A9B7F", pct: 0,  badge: "Pending", badgeCls: "bg-[#FEF3C7] text-[#F59E0B]" },
  ],
  stages: [
    { num:1,  title:"Identify & Categorize",     sub:"Multiple choice · Auto-scored",     status:"done",    score:"9/10" },
    { num:2,  title:"Select & Prioritize",        sub:"Drag-to-rank · Auto-scored",        status:"done",    score:"8/10" },
    { num:3,  title:"Define the Problem",         sub:"Open-ended · Teacher graded",       status:"done",    score:"7/10" },
    { num:4,  title:"Analyze Information",        sub:"Table input · Auto-scored",         status:"done",    score:"6/10" },
    { num:5,  title:"Identify Constraints",       sub:"Checklist · Auto-scored",           status:"done",    score:"5/10" },
    { num:6,  title:"Root Causes",                sub:"Open-ended · Pending grading",      status:"done",    score:"—/10" },
    { num:7,  title:"Data Analysis",              sub:"Computation · Auto-scored",         status:"done",    score:"5/10" },
    { num:8,  title:"Develop Possible Solutions", sub:"Multi-plan · In progress",          status:"current", score:"▶"    },
    { num:9,  title:"Anticipate Problems",        sub:"Not started",                        status:"pending", score:"—"   },
    { num:10, title:"Trial Implementation",       sub:"Not started",                        status:"pending", score:"—"   },
    { num:11, title:"Choose Best Solution",       sub:"Not started",                        status:"pending", score:"—"   },
    { num:12, title:"Reflect & Review",           sub:"Not started",                        status:"pending", score:"—"   },
  ],
};

const DONE_DATA: StudentDrawerData = {
  ...JUAN_DATA, stage: "12/12", score: "89%", time: "62m", alert: null,
  clusters: [
    { label: "🔵 Understanding", color: "#3B82C4", pct: 93, badge: "Good", badgeCls: "bg-[#D1FAE5] text-[#4A9B7F]" },
    { label: "🟣 Analysis",      color: "#8B5CF6", pct: 84, badge: "Good", badgeCls: "bg-[#D1FAE5] text-[#4A9B7F]" },
    { label: "🟠 Solution",      color: "#F59E0B", pct: 90, badge: "Good", badgeCls: "bg-[#D1FAE5] text-[#4A9B7F]" },
    { label: "🟢 Reflection",    color: "#4A9B7F", pct: 88, badge: "Good", badgeCls: "bg-[#D1FAE5] text-[#4A9B7F]" },
  ],
};

const STUCK_DATA: StudentDrawerData = {
  ...JUAN_DATA, stage: "5/12", score: "41%", time: "28m",
  alert: "🚨 Significantly behind. Multiple clusters below 60%.",
};

const FEEDING_STUDENTS: Student[] = [
  { name:"Maria C.", short:"Maria", emoji:"🧝‍♀️", status:"done",     stage:12, data: DONE_DATA  },
  { name:"Juan R.",  short:"Juan",  emoji:"🧙‍♂️", status:"inprog",   stage:8,  data: JUAN_DATA  },
  { name:"Ana L.",   short:"Ana",   emoji:"🦸‍♀️", status:"done",     stage:12, data: DONE_DATA  },
  { name:"Pedro L.", short:"Pedro", emoji:"🦁",   status:"stuck",    stage:5,  data: STUCK_DATA },
  { name:"Karl B.",  short:"Karl",  emoji:"🐉",   status:"stuck",    stage:4,  data: STUCK_DATA },
  { name:"Rosa",     short:"Rosa",  emoji:"🦊",   status:"notstart", stage:0   },
  { name:"Ben A.",   short:"Ben",   emoji:"🦅",   status:"done",     stage:12, data: DONE_DATA  },
  { name:"Lena",     short:"Lena",  emoji:"🐺",   status:"inprog",   stage:6   },
  { name:"Carlo",    short:"Carlo", emoji:"🧑‍🚀", status:"done",     stage:12, data: DONE_DATA  },
  { name:"Tina",     short:"Tina",  emoji:"🦊",   status:"notstart", stage:0   },
  { name:"Mark",     short:"Mark",  emoji:"🧙‍♂️", status:"inprog",   stage:7   },
];

const STORE_STUDENTS: Student[] = [
  { name:"Maria C.", short:"Maria", emoji:"🧝‍♀️", status:"done",  stage:12 },
  { name:"Juan R.",  short:"Juan",  emoji:"🧙‍♂️", status:"done",  stage:12 },
  { name:"Ana L.",   short:"Ana",   emoji:"🦸‍♀️", status:"done",  stage:12 },
  { name:"Pedro L.", short:"Pedro", emoji:"🦁",   status:"inprog",stage:9  },
  { name:"Karl B.",  short:"Karl",  emoji:"🐉",   status:"done",  stage:12 },
  { name:"Rosa",     short:"Rosa",  emoji:"🦊",   status:"done",  stage:12 },
  { name:"Ben A.",   short:"Ben",   emoji:"🦅",   status:"done",  stage:12 },
  { name:"Lena",     short:"Lena",  emoji:"🐺",   status:"done",  stage:12 },
  { name:"Carlo",    short:"Carlo", emoji:"🧑‍🚀", status:"done",  stage:12 },
  { name:"Tina",     short:"Tina",  emoji:"🦊",   status:"notstart", stage:0 },
  { name:"Mark",     short:"Mark",  emoji:"🧙‍♂️", status:"done",  stage:12 },
];

const MODULES: ModuleCard[] = [
  {
    id: "feeding",
    emoji: "🍱", context: "💰 MONEY & OPERATIONS", contextColor: "#4A9B7F",
    title: "Barangay Feeding Program", duration: "12 Stages · ~90 min",
    status: "active", dueTag: "📅 Due: Mar 1",
    scenario: '"The barangay plans a feeding program for 120 children with a ₱6,000 budget. Students must decide how many kilos of rice, canned goods, and juice packs to buy."',
    scenarioBorder: "#4A9B7F",
    completion: { pct: 44, done: 14, inprog: 9, notstart: 9, total: 32 },
    students: FEEDING_STUDENTS,
    clusters: [
      { icon:"🔵", label:"Understanding", pct:80, quality:"good" },
      { icon:"🟣", label:"Analysis",      pct:62, quality:"fair" },
      { icon:"🟠", label:"Solution",      pct:51, quality:"weak" },
      { icon:"🟢", label:"Reflection",    pct:76, quality:"fair" },
    ],
    insight: { text: "⚠️ Class is struggling in Solution Development (Stages 8–10). Consider re-teaching before assigning Stage 8.", type: "warn" },
    gradeCount: 4,
  },
  {
    id: "store",
    emoji: "🏪", context: "💸 DECIMALS & PROFIT", contextColor: "#3B82C4",
    title: "Sari-Sari Store Manager", duration: "12 Stages · ~75 min",
    status: "active", dueTag: "📅 Due: Feb 28",
    scenario: '"Students run a community store, compute profits, manage change, and decide how many items to restock within a ₱500 daily budget."',
    scenarioBorder: "#3B82C4",
    completion: { pct: 81, done: 26, inprog: 4, notstart: 2, total: 32 },
    students: STORE_STUDENTS,
    clusters: [
      { icon:"🔵", label:"Understanding", pct:91, quality:"good" },
      { icon:"🟣", label:"Analysis",      pct:83, quality:"good" },
      { icon:"🟠", label:"Solution",      pct:88, quality:"good" },
      { icon:"🟢", label:"Reflection",    pct:85, quality:"good" },
    ],
    insight: { text: "✅ Class is performing well across all phases. Strong understanding and reflection scores.", type: "good" },
    gradeCount: 3,
  },
  {
    id: "garden",
    emoji: "📐", context: "📏 MEASUREMENT & GEOMETRY", contextColor: "#8B5CF6",
    title: "School Garden Planner", duration: "12 Stages · ~80 min · Not yet assigned to students",
    status: "draft", dueTag: "⚠️ Assign before Mar 10",
    scenario: '"Students help design the school garden. Calculate area, perimeter, and the number of plants that fit — then present their plan to the principal."',
    scenarioBorder: "#8B5CF6",
    completion: { pct: 0, done: 0, inprog: 0, notstart: 0, total: 0 },
    students: [],
    clusters: [],
    insight: { text: "⚠️ Draft: This module has not been assigned to any section yet.", type: "warn" },
    gradeCount: 0,
    wide: true,
    checklist: [
      { done: true,  label: "All 12 stages created" },
      { done: true,  label: "Answer keys defined" },
      { done: true,  label: "Hints added for all stages" },
      { done: false, label: "Assign to section pending" },
    ],
    tags: ["📐 Area & Perimeter", "🔷 Geometry", "📊 MELCs: M6ME-IIIi"],
  },
];

/* ═══════════════════════════════════════════
   SIDEBAR
═══════════════════════════════════════════ */
function NavItem({
  icon, label, active, badge, badgeDanger, onClick,
}: {
  icon: string; label: string; active?: boolean;
  badge?: string | number; badgeDanger?: boolean; onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{ width: "calc(100% - 20px)" }}
      className={cn(
        "flex items-center gap-2.5 px-[18px] py-2.5 mx-2.5 rounded-xl text-sm font-medium transition-all",
        "hover:bg-[#EBF0EC] dark:hover:bg-[#0F1C14]",
        active
          ? "bg-[#D1FAE5] dark:bg-[#064e35] text-[#4A9B7F] font-bold"
          : "text-[#5A7860] dark:text-[#7BAF84]"
      )}
    >
      <span className="text-[17px] w-5 text-center flex-shrink-0">{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      {badge !== undefined && (
        <span className={cn(
          "text-[11px] font-bold px-2 py-0.5 rounded-full",
          badgeDanger ? "bg-[#E05C5C] text-white" : "bg-[#4A9B7F] text-white"
        )}>
          {badge}
        </span>
      )}
    </button>
  );
}

/* ═══════════════════════════════════════════
   STAT CARD
═══════════════════════════════════════════ */
function StatCard({
  icon, value, label, delta, deltaUp, color, iconBg,
}: {
  icon: string; value: string; label: string;
  delta?: string; deltaUp?: boolean; color: string; iconBg: string;
}) {
  return (
    <div className="relative bg-white dark:bg-[#132018] border border-[#DDE8DF] dark:border-[#1E3524] rounded-2xl p-[18px] shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all overflow-hidden">
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

/* ═══════════════════════════════════════════
   STUDENT MINI AVATAR
═══════════════════════════════════════════ */
const STATUS_ARC: Record<StudentStatus, string> = {
  done:     "border-[#4A9B7F] bg-[#D1FAE5] dark:bg-[#064e35]",
  inprog:   "border-[#F59E0B] bg-[#FEF3C7] dark:bg-[#3d2800]",
  stuck:    "border-[#E05C5C] bg-[#FEE2E2] dark:bg-[#450a0a]",
  notstart: "border-[#DDE8DF] dark:border-[#1E3524] bg-[#EBF0EC] dark:bg-[#0A180E]",
};

function StudentAvatar({
  s, onOpen,
}: {
  s: Student; onOpen: (s: Student) => void;
}) {
  return (
    <button
      onClick={() => s.data && onOpen(s)}
      className="flex flex-col items-center gap-1 group"
    >
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center text-[15px] border-2 transition-all relative",
        STATUS_ARC[s.status],
        s.data && "group-hover:scale-110",
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

/* ═══════════════════════════════════════════
   CLUSTER CELL
═══════════════════════════════════════════ */
function ClusterCell({ c }: { c: ClusterScore }) {
  const cls = {
    good: "bg-[#D1FAE5] dark:bg-[#064e35] border-[#4A9B7F] text-[#4A9B7F]",
    fair: "bg-[#FEF3C7] dark:bg-[#3d2800] border-[#F59E0B] text-[#F59E0B]",
    weak: "bg-[#FEE2E2] dark:bg-[#450a0a] border-[#E05C5C] text-[#E05C5C]",
  }[c.quality];

  return (
    <div className={cn("px-2.5 py-2.5 rounded-xl text-center border", cls)}>
      <div className="text-sm mb-1">{c.icon}</div>
      <div className="font-nunito text-[15px] font-black">{c.pct}%</div>
      <div className="text-[10px] font-semibold text-[#5A7860] dark:text-[#7BAF84] mt-0.5">{c.label}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MODULE CARD
═══════════════════════════════════════════ */
function ModCard({
  mod, onOpenDrawer, onOpenAssign,
}: {
  mod: ModuleCard;
  onOpenDrawer: (s: Student) => void;
  onOpenAssign: () => void;
}) {
  const isActive = mod.status === "active";
  const isDraft  = mod.status === "draft";

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
      mod.wide && "col-span-2"
    )}>
      {/* Header */}
      <div className={cn("flex items-center gap-4 px-6 py-5 border-b border-[#DDE8DF] dark:border-[#1E3524] bg-gradient-to-r", headerGrad)}>
        <div
          className="w-[52px] h-[52px] rounded-[14px] flex items-center justify-center text-[26px] flex-shrink-0"
          style={{ background: mod.contextColor + "22" }}
        >
          {mod.emoji}
        </div>
        <div className="flex-1">
          <p className="text-[10px] font-bold tracking-[0.1em] uppercase mb-1" style={{ color: mod.contextColor }}>
            {mod.context}
          </p>
          <h3 className="font-nunito text-base font-black leading-tight">{mod.title}</h3>
          <p className="text-xs text-[#5A7860] dark:text-[#7BAF84] mt-0.5">{mod.duration}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          {statusBadge}
          <span className="text-[11px] text-[#5A7860] dark:text-[#7BAF84] font-semibold">{mod.dueTag}</span>
        </div>
      </div>

      {/* Body */}
      <div className={cn("p-6", mod.wide && "grid grid-cols-2 gap-6 items-start")}>
        <div>
          {/* Scenario */}
          <div
            className="text-[13px] text-[#5A7860] dark:text-[#7BAF84] leading-relaxed mb-5 p-3.5 bg-[#EBF0EC] dark:bg-[#0A180E] rounded-xl border-l-[3px] italic"
            style={{ borderColor: mod.scenarioBorder }}
          >
            {mod.scenario}
          </div>

          {/* Draft tags */}
          {isDraft && mod.tags && (
            <div className="flex flex-wrap gap-2 mb-4">
              {mod.tags.map((t) => (
                <span key={t} className="text-xs font-semibold px-3 py-1 rounded-full border border-[#DDE8DF] dark:border-[#1E3524] bg-[#EBF0EC] dark:bg-[#0A180E] text-[#5A7860] dark:text-[#7BAF84]" style={t.includes("Area") ? { background: "#EDE9FE33", borderColor: "#8B5CF6", color: "#8B5CF6" } : undefined}>
                  {t}
                </span>
              ))}
            </div>
          )}

          {/* Completion bar (active modules only) */}
          {isActive && (
            <div className="mb-5">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-bold">Class Completion</span>
                <span className="font-nunito text-sm font-black" style={{ color: mod.contextColor }}>
                  {mod.completion.pct}% ({mod.completion.done}/{mod.completion.total})
                </span>
              </div>
              <div className="flex h-2.5 rounded-full overflow-hidden mb-1.5">
                <div className="h-full bg-[#4A9B7F] transition-all" style={{ width: `${(mod.completion.done/mod.completion.total)*100}%` }} />
                <div className="h-full bg-[#F59E0B] transition-all" style={{ width: `${(mod.completion.inprog/mod.completion.total)*100}%` }} />
                <div className="h-full bg-[#DDE8DF] dark:bg-[#1E3524] transition-all" style={{ width: `${(mod.completion.notstart/mod.completion.total)*100}%` }} />
              </div>
              <div className="flex gap-3.5 flex-wrap">
                {[["#4A9B7F",`${mod.completion.done} Completed`],["#F59E0B",`${mod.completion.inprog} In Progress`],["#DDE8DF",`${mod.completion.notstart} Not Started`]].map(([c,l]) => (
                  <span key={l} className="flex items-center gap-1 text-[11px] text-[#5A7860] dark:text-[#7BAF84]">
                    <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: c }} /> {l}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Student avatars (active) */}
          {isActive && mod.students.length > 0 && (
            <>
              <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-[#92A894] mb-2.5">Students (click to inspect)</p>
              <div className="grid grid-cols-6 gap-1.5 mb-3">
                {mod.students.slice(0, 11).map((s) => (
                  <StudentAvatar key={s.name} s={s} onOpen={onOpenDrawer} />
                ))}
                <div className="flex flex-col items-center gap-1 opacity-50">
                  <div className="w-8 h-8 rounded-full bg-[#EBF0EC] dark:bg-[#0A180E] border-2 border-[#DDE8DF] dark:border-[#1E3524] flex items-center justify-center text-[11px] text-[#92A894] font-bold">
                    +20
                  </div>
                  <span className="text-[9px] text-[#92A894]">more</span>
                </div>
              </div>
              {/* Legend */}
              <div className="flex gap-3 flex-wrap mb-5">
                {[["#4A9B7F","Completed"],["#F59E0B","In Progress"],["#E05C5C","Struggling"],["#DDE8DF","Not Started"]].map(([c,l]) => (
                  <span key={l} className="flex items-center gap-1.5 text-[11px] text-[#5A7860] dark:text-[#7BAF84] font-semibold">
                    <span className="w-2 h-2 rounded-full" style={{ background: c }} />{l}
                  </span>
                ))}
              </div>
            </>
          )}

          {/* Cluster averages (active) */}
          {isActive && mod.clusters.length > 0 && (
            <>
              <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-[#92A894] mb-2.5">Class Diagnostic Averages</p>
              <div className="grid grid-cols-4 gap-2 mb-4">
                {mod.clusters.map((c) => <ClusterCell key={c.label} c={c} />)}
              </div>
            </>
          )}

          {/* Insight banner */}
          <div className={cn(
            "px-3.5 py-2.5 rounded-xl text-[13px] font-semibold",
            mod.insight.type === "good"
              ? "bg-[#D1FAE5] dark:bg-[#064e35] text-[#4A9B7F]"
              : "bg-[#FEE2E2] dark:bg-[#450a0a] text-[#E05C5C]"
          )}>
            {mod.insight.text}
          </div>
        </div>

        {/* Draft checklist (right column) */}
        {isDraft && mod.checklist && (
          <div>
            <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-[#92A894] mb-3">Module Checklist</p>
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

      {/* Card actions */}
      <div className="flex items-center gap-2 px-6 py-4 border-t border-[#DDE8DF] dark:border-[#1E3524]">
        {isActive ? (
          <>
            <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#4A9B7F] text-white text-xs font-nunito font-bold hover:bg-[#2E7A60] transition-all">
              📊 View Reports
            </button>
            <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#EBF0EC] dark:bg-[#0A180E] text-[#5A7860] dark:text-[#7BAF84] border border-[#DDE8DF] dark:border-[#1E3524] text-xs font-nunito font-bold hover:border-[#4A9B7F] hover:text-[#4A9B7F] transition-all">
              ✍️ Grade Items ({mod.gradeCount})
            </button>
            <button
              onClick={onOpenAssign}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#FEF3C7] dark:bg-[#3d2800] text-[#F59E0B] border border-[#F59E0B] text-xs font-nunito font-bold hover:bg-[#F59E0B] hover:text-black transition-all"
            >
              📋 Edit Assignment
            </button>
            <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#FEE2E2] dark:bg-[#450a0a] text-[#E05C5C] border border-[#E05C5C] text-xs font-nunito font-bold hover:bg-[#E05C5C] hover:text-white transition-all ml-auto">
              🗄 Archive
            </button>
          </>
        ) : (
          <>
            <button
              onClick={onOpenAssign}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#4A9B7F] text-white text-xs font-nunito font-bold hover:bg-[#2E7A60] transition-all"
            >
              ＋ Assign to Section
            </button>
            <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#EBF0EC] dark:bg-[#0A180E] text-[#5A7860] border border-[#DDE8DF] dark:border-[#1E3524] text-xs font-nunito font-bold hover:border-[#4A9B7F] hover:text-[#4A9B7F] transition-all">
              ✏️ Edit Module
            </button>
            <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#EBF0EC] dark:bg-[#0A180E] text-[#5A7860] border border-[#DDE8DF] dark:border-[#1E3524] text-xs font-nunito font-bold hover:border-[#4A9B7F] hover:text-[#4A9B7F] transition-all">
              👁 Preview as Student
            </button>
            <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#FEE2E2] dark:bg-[#450a0a] text-[#E05C5C] border border-[#E05C5C] text-xs font-nunito font-bold hover:bg-[#E05C5C] hover:text-white transition-all ml-auto">
              🗑 Delete Draft
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   ASSIGN MODAL
═══════════════════════════════════════════ */
const SECTIONS = [
  { value: "Narra",    label: "🌲 Narra"    },
  { value: "Molave",   label: "🌿 Molave"   },
  { value: "Kamagong", label: "🌳 Kamagong" },
  { value: "Yakal",    label: "🍃 Yakal"    },
];

function AssignModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [checked, setChecked] = useState<string[]>(["Narra"]);

  const toggle = (v: string) =>
    setChecked((prev) => prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-[560px] bg-white dark:bg-[#132018] border border-[#DDE8DF] dark:border-[#1E3524] rounded-3xl p-9 shadow-[0_12px_48px_rgba(74,155,127,0.18)]">
        <DialogTitle className="sr-only">Assign Module</DialogTitle>
        <div className="text-4xl mb-3">📋</div>
        <h2 className="font-nunito text-xl font-black mb-1.5">Assign Module to Section</h2>
        <p className="text-sm text-[#5A7860] dark:text-[#7BAF84] mb-6 leading-relaxed">
          Select which sections should receive this module and set a due date. Students will see it in their My Modules page.
        </p>

        {/* Module select */}
        <div className="flex flex-col gap-1.5 mb-4">
          <label className="text-[11px] font-bold tracking-[0.08em] uppercase text-[#5A7860] dark:text-[#7BAF84]">📦 Module</label>
          <select className="w-full px-3.5 py-3 rounded-xl border border-[#DDE8DF] dark:border-[#1E3524] bg-[#EBF0EC] dark:bg-[#0A180E] text-sm font-medium focus:outline-none focus:border-[#4A9B7F]">
            <option>Barangay Feeding Program</option>
            <option>Sari-Sari Store Manager</option>
            <option selected>School Garden Planner</option>
            <option>Travel & Distance Planner</option>
          </select>
        </div>

        {/* Section checkboxes */}
        <div className="flex flex-col gap-1.5 mb-4">
          <label className="text-[11px] font-bold tracking-[0.08em] uppercase text-[#5A7860] dark:text-[#7BAF84]">🛡️ Assign to Sections</label>
          <div className="grid grid-cols-2 gap-2">
            {SECTIONS.map((s) => (
              <button
                key={s.value}
                onClick={() => toggle(s.value)}
                className={cn(
                  "flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border-[1.5px] transition-all text-sm font-bold",
                  checked.includes(s.value)
                    ? "border-[#4A9B7F] bg-[#D1FAE5] dark:bg-[#064e35]"
                    : "border-[#DDE8DF] dark:border-[#1E3524] bg-[#EBF0EC] dark:bg-[#0A180E] text-[#5A7860] dark:text-[#7BAF84] hover:border-[#4A9B7F]"
                )}
              >
                <div className={cn(
                  "w-[18px] h-[18px] rounded-[5px] border-2 flex items-center justify-center text-xs font-black transition-all flex-shrink-0",
                  checked.includes(s.value)
                    ? "bg-[#4A9B7F] border-[#4A9B7F] text-white"
                    : "border-[#DDE8DF] dark:border-[#1E3524]"
                )}>
                  {checked.includes(s.value) ? "✓" : ""}
                </div>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Due date + unlock */}
        <div className="grid grid-cols-2 gap-3.5 mb-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold tracking-[0.08em] uppercase text-[#5A7860] dark:text-[#7BAF84]">📅 Due Date</label>
            <Input
              type="date"
              defaultValue="2026-03-10"
              className="bg-[#EBF0EC] dark:bg-[#0A180E] border-[#DDE8DF] dark:border-[#1E3524] focus-visible:ring-[#4A9B7F]/30 focus-visible:border-[#4A9B7F] rounded-xl"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold tracking-[0.08em] uppercase text-[#5A7860] dark:text-[#7BAF84]">🔒 Unlock After</label>
            <select className="w-full px-3.5 py-[11px] rounded-xl border border-[#DDE8DF] dark:border-[#1E3524] bg-[#EBF0EC] dark:bg-[#0A180E] text-sm focus:outline-none focus:border-[#4A9B7F]">
              <option>No requirement</option>
              <option>1 completed module</option>
              <option selected>2 completed modules</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2.5">
          <button
            className="flex-1 py-3.5 rounded-xl bg-[#4A9B7F] text-white font-nunito font-extrabold text-sm hover:bg-[#2E7A60] shadow-[0_4px_14px_rgba(74,155,127,0.3)] transition-all flex items-center justify-center gap-2"
          >
            ✅ Assign Module
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3.5 rounded-xl bg-[#EBF0EC] dark:bg-[#0A180E] text-[#5A7860] dark:text-[#7BAF84] border border-[#DDE8DF] dark:border-[#1E3524] font-nunito font-extrabold text-sm hover:border-[#4A9B7F] hover:text-[#4A9B7F] transition-all flex items-center justify-center"
          >
            Cancel
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ═══════════════════════════════════════════
   STUDENT DRAWER
═══════════════════════════════════════════ */
function StudentDrawer({
  open, student, onClose,
}: {
  open: boolean; student: Student | null; onClose: () => void;
}) {
  const d = student?.data;
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
              ⚔️ Adventurer · Narra · Stage {d.stage}
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

          {/* Diagnostic clusters */}
          <div>
            <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-[#92A894] mb-2.5">Diagnostic Clusters</p>
            <div className="flex flex-col gap-2.5">
              {d.clusters.map((c) => (
                <div key={c.label} className="flex items-center gap-2.5">
                  <span className="text-[13px] font-semibold w-[120px] flex-shrink-0">{c.label}</span>
                  <div className="flex-1 h-2 bg-[#DDE8DF] dark:bg-[#1E3524] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${c.pct}%`, background: c.color }} />
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
            <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-[#92A894] mb-2.5">Stage-by-Stage Progress</p>
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
                  <div className="flex-1">
                    <p className="text-[12px] font-bold">{s.title}</p>
                    <span className="text-[11px] text-[#5A7860] dark:text-[#7BAF84]">{s.sub}</span>
                  </div>
                  <span className={cn(
                    "text-[12px] font-extrabold",
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
            <Button className="flex-1 bg-[#4A9B7F] hover:bg-[#2E7A60] text-white font-nunito font-bold text-sm shadow-[0_4px_14px_rgba(74,155,127,0.3)]">
              📊 Full Report
            </Button>
            <Button variant="outline" className="flex-1 font-nunito font-bold text-sm border-[#DDE8DF] dark:border-[#1E3524] text-[#5A7860] hover:border-[#4A9B7F] hover:text-[#4A9B7F]">
              ✍️ Grade Open Items
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ═══════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════ */
export default function TeacherModulesPage() {
  const [activeNav, setActiveNav] = useState("modules");
  const [activeTab, setActiveTab] = useState<TabKey>("assigned");
  const [filter, setFilter]       = useState<FilterKey>("all");
  const [search, setSearch]       = useState("");
  const [assignOpen, setAssignOpen] = useState(false);
  const [drawerStudent, setDrawerStudent] = useState<Student | null>(null);

  const filtered = MODULES.filter((m) => {
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
        <aside className="w-[240px] min-h-screen bg-white dark:bg-[#132018] border-r border-[#DDE8DF] dark:border-[#1E3524] flex flex-col py-7 flex-shrink-0 sticky top-0 h-screen overflow-y-auto">
          <div className="px-[22px] pb-6 border-b border-[#DDE8DF] dark:border-[#1E3524] mb-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4A9B7F] to-[#0D9488] flex items-center justify-center text-white font-black text-lg font-nunito mb-2.5">T</div>
            <h2 className="font-nunito text-sm font-extrabold leading-snug">Think–Solve<br />–Reflect</h2>
            <span className="text-[11px] text-[#5A7860] dark:text-[#7BAF84]">Teacher Portal</span>
            <div className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#D1FAE5] dark:bg-[#064e35] text-[#4A9B7F] border border-[#4A9B7F] mt-2">
              👩‍🏫 Teacher
            </div>
          </div>

          <div className="px-3.5 py-1 text-[10px] font-bold tracking-[0.1em] uppercase text-[#92A894] mb-1">Overview</div>
          <NavItem icon="🏠" label="Dashboard"    active={activeNav==="dash"}    onClick={()=>setActiveNav("dash")} />
          <NavItem icon="👥" label="Students"     badge={32}                     onClick={()=>setActiveNav("students")} active={activeNav==="students"} />
          <NavItem icon="📊" label="Class Reports" active={activeNav==="reports"} onClick={()=>setActiveNav("reports")} />

          <div className="px-3.5 py-1 mt-3 text-[10px] font-bold tracking-[0.1em] uppercase text-[#92A894] mb-1">Manage</div>
          <NavItem icon="📦" label="Modules"      badge={3}  active={activeNav==="modules"}  onClick={()=>setActiveNav("modules")} />
          <NavItem icon="📝" label="Test Results" active={activeNav==="tests"}    onClick={()=>setActiveNav("tests")} />
          <NavItem icon="✍️" label="Grade Items"  badge={7}  badgeDanger active={activeNav==="grade"} onClick={()=>setActiveNav("grade")} />
          <NavItem icon="📅" label="Schedule"     active={activeNav==="schedule"} onClick={()=>setActiveNav("schedule")} />

          <div className="px-3.5 py-1 mt-3 text-[10px] font-bold tracking-[0.1em] uppercase text-[#92A894] mb-1">System</div>
          <NavItem icon="⚙️" label="Settings" active={activeNav==="settings"} onClick={()=>setActiveNav("settings")} />

          <div className="mt-auto pt-3.5 border-t border-[#DDE8DF] dark:border-[#1E3524] px-2.5">
            <button className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-[#EBF0EC] dark:hover:bg-[#0A180E] transition-colors">
              <div className="w-9 h-9 rounded-full bg-[#D1FAE5] dark:bg-[#064e35] flex items-center justify-center text-[#4A9B7F] text-sm font-extrabold font-nunito flex-shrink-0">MS</div>
              <div className="text-left">
                <p className="text-[13px] font-bold">Ma'am Santos</p>
                <span className="text-[11px] text-[#5A7860] dark:text-[#7BAF84]">Grade 6 — Narra</span>
              </div>
            </button>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main className="flex-1 px-10 py-9 overflow-x-hidden min-w-0">

          {/* Topbar */}
          <div className="flex items-start justify-between mb-8 gap-4 fade-up">
            <div>
              <h1 className="font-nunito text-[26px] font-black mb-1">📦 Module Management</h1>
              <p className="text-sm text-[#5A7860] dark:text-[#7BAF84]">Grade 6 — Narra Section · School Year 2025–2026</p>
            </div>
            <div className="flex items-center gap-2.5 flex-shrink-0">
              <Button variant="outline" className="font-nunito font-bold text-sm border-[#DDE8DF] dark:border-[#1E3524] text-[#5A7860] hover:border-[#4A9B7F] hover:text-[#4A9B7F] hover:bg-[#D1FAE5]">
                ⬇ Export Report
              </Button>
              <Button
                onClick={() => setAssignOpen(true)}
                className="font-nunito font-bold text-sm bg-[#4A9B7F] hover:bg-[#2E7A60] text-white shadow-[0_4px_14px_rgba(74,155,127,0.30)]"
              >
                ＋ Assign Module
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 mb-7">
            <div className="fade-up d1"><StatCard icon="📦" value="3"  label="Modules Assigned"  delta="↑ 1 added this week" deltaUp color="#4A9B7F" iconBg="#D1FAE522" /></div>
            <div className="fade-up d2"><StatCard icon="👥" value="32" label="Total Students"    delta="Narra Section"               color="#3B82C4" iconBg="#DBEAFE22" /></div>
            <div className="fade-up d3"><StatCard icon="⚡" value="18" label="Currently Active"  delta="↑ 56% engagement" deltaUp    color="#F59E0B" iconBg="#FEF3C722" /></div>
            <div className="fade-up d4"><StatCard icon="✅" value="14" label="Completed Module 1" delta="↑ 44% completion" deltaUp   color="#22C55E" iconBg="#DCFCE722" /></div>
            <div className="fade-up d5"><StatCard icon="⚠️" value="9"  label="Need Intervention" delta="↓ Struggling in Analysis"     color="#E05C5C" iconBg="#FEE2E222" /></div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b-2 border-[#DDE8DF] dark:border-[#1E3524] mb-6 fade-up d2">
            {([["assigned","📋 Assigned Modules"],["library","📚 Module Library"],["results","📊 Pre/Post Results"]] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={cn(
                  "font-nunito font-bold text-sm px-5 py-2.5 rounded-t-xl border border-b-0 transition-all relative top-0.5",
                  activeTab === key
                    ? "bg-white dark:bg-[#132018] text-[#4A9B7F] border-[#DDE8DF] dark:border-[#1E3524]"
                    : "bg-transparent text-[#5A7860] dark:text-[#7BAF84] border-transparent hover:bg-[#EBF0EC] dark:hover:bg-[#0A180E]"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Filter toolbar */}
          <div className="flex flex-wrap items-center gap-2.5 mb-6 fade-up d3">
            <span className="text-[13px] font-bold text-[#5A7860] dark:text-[#7BAF84] mr-1">Filter:</span>
            {(["all","active","draft","archived"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "font-nunito font-bold text-xs px-4 py-1.5 rounded-full border-[1.5px] transition-all",
                  filter === f
                    ? "bg-[#4A9B7F] text-white border-[#4A9B7F]"
                    : "bg-white dark:bg-[#132018] text-[#5A7860] dark:text-[#7BAF84] border-[#DDE8DF] dark:border-[#1E3524] hover:border-[#4A9B7F] hover:text-[#4A9B7F]"
                )}
              >
                {{ all:"All", active:"Active", draft:"Draft", archived:"Archived" }[f]}
              </button>
            ))}
            <div className="relative ml-auto">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#92A894] pointer-events-none">🔍</span>
              <Input
                placeholder="Search modules…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9 text-[13px] bg-white dark:bg-[#132018] border-[#DDE8DF] dark:border-[#1E3524] rounded-xl w-[200px] focus:w-[240px] transition-all focus-visible:ring-[#4A9B7F]/30 focus-visible:border-[#4A9B7F]"
              />
            </div>
          </div>

          {/* Modules grid */}
          {filtered.length > 0 ? (
            <div className="grid grid-cols-2 gap-5 mb-10 fade-up d3">
              {filtered.map((mod) => (
                <ModCard
                  key={mod.id}
                  mod={mod}
                  onOpenDrawer={(s) => setDrawerStudent(s)}
                  onOpenAssign={() => setAssignOpen(true)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 border-2 border-dashed border-[#DDE8DF] dark:border-[#1E3524] rounded-2xl bg-white dark:bg-[#132018] fade-up">
              <div className="text-5xl mb-4">📦</div>
              <h3 className="font-nunito text-lg font-extrabold mb-2">No modules found</h3>
              <p className="text-sm text-[#5A7860] dark:text-[#7BAF84] mb-6">Try adjusting your filter or search.</p>
              <Button
                variant="outline"
                onClick={() => { setFilter("all"); setSearch(""); }}
                className="font-nunito font-bold border-[#DDE8DF] dark:border-[#1E3524]"
              >
                Clear Filters
              </Button>
            </div>
          )}
        </main>
      </div>

      {/* ── MODALS ── */}
      <AssignModal open={assignOpen} onClose={() => setAssignOpen(false)} />
      <StudentDrawer
        open={!!drawerStudent}
        student={drawerStudent}
        onClose={() => setDrawerStudent(null)}
      />
    </>
  );
}