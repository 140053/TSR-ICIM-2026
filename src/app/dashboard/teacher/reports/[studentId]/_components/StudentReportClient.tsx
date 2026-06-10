"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useReactToPrint } from "react-to-print";
import { cn } from "@/lib/utils";
import type { StudentReportData, ModuleReport } from "../page";

// ─── Constants ────────────────────────────────────────────────
const CLUSTER_META = [
  { key: "understanding", label: "Understanding", color: "#3B82C4", stages: "1–3"  },
  { key: "analysis",      label: "Analysis",      color: "#8B5CF6", stages: "4–7"  },
  { key: "solution",      label: "Solution",      color: "#F59E0B", stages: "8–10" },
  { key: "reflection",    label: "Reflection",    color: "#4A9B7F", stages: "11–12"},
] as const;

const PHASE_COLORS: Record<string, string> = {
  UNDERSTANDING: "#3B82C4",
  ANALYSIS:      "#8B5CF6",
  SOLUTION:      "#F59E0B",
  REFLECTION:    "#4A9B7F",
};

const TYPE_LABELS: Record<string, { label: string; short: string }> = {
  MULTIPLE_CHOICE:   { label: "Multiple Choice",  short: "MC"       },
  RANKING:           { label: "Ranking",           short: "Rank"     },
  OPEN_ENDED:        { label: "Open Ended",        short: "Open"     },
  TABLE_INPUT:       { label: "Table Input",       short: "Table"    },
  CHECKLIST:         { label: "Checklist",         short: "Check"    },
  COMPUTATION:       { label: "Computation",       short: "Calc"     },
  MULTI_PLAN:        { label: "Multi-Plan",        short: "Plan"     },
  BUDGET_CHECK:      { label: "Budget Check",      short: "Budget"   },
  SELECT_JUSTIFY:    { label: "Choose & Justify",  short: "S+J"      },
  REFLECTION_SLIDER: { label: "Reflection Slider", short: "Reflect"  },
};

// ─── Helpers ─────────────────────────────────────────────────
function levelBadge(level: string | null) {
  if (level === "PROFICIENT") return { label: "Proficient", cls: "bg-[#D1FAE5] text-[#4A9B7F] border-[#4A9B7F]/30",  print: "#4A9B7F" };
  if (level === "DEVELOPING") return { label: "Developing", cls: "bg-[#FEF3C7] text-[#F59E0B] border-[#F59E0B]/30",  print: "#F59E0B" };
  if (level === "STRUGGLING") return { label: "Struggling", cls: "bg-[#FEE2E2] text-[#E05C5C] border-[#E05C5C]/30",  print: "#E05C5C" };
  return                               { label: "Pending",   cls: "bg-[#F1F5F9] text-[#94A3B8] border-transparent", print: "#94A3B8" };
}

function overallColor(v: number | null) {
  if (v == null) return "#94A3B8";
  if (v >= 80)   return "#4A9B7F";
  if (v >= 60)   return "#F59E0B";
  return "#E05C5C";
}

function diffLabel(d: string) {
  if (d === "APPRENTICE") return "🌱 Apprentice";
  if (d === "CHAMPION")   return "🔥 Champion";
  return "⚔️ Adventurer";
}

function pctLabel(v: number | null) {
  return v != null ? `${Math.round(v)}%` : "—";
}

// ─── Printable cluster bars ───────────────────────────────────
function PrintClusterBars({ report }: { report: ModuleReport }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "8px", marginBottom: "12px" }}>
      {CLUSTER_META.map(({ key, label, color, stages }) => {
        const val   = report[key as keyof ModuleReport] as number | null;
        const lvKey = `${key}Level` as keyof ModuleReport;
        const lv    = report[lvKey] as string | null;
        const badge = levelBadge(lv);
        const pct   = val != null ? Math.round(val) : null;
        return (
          <div key={key} style={{ border: "1px solid #E2E8F0", borderRadius: "10px", padding: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <span style={{ fontSize: "9px", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
              <span style={{ fontSize: "9px", color: "#94A3B8" }}>S{stages}</span>
            </div>
            <div style={{ fontSize: "22px", fontWeight: 900, color, lineHeight: 1, marginBottom: "4px" }}>
              {pct != null ? `${pct}%` : "—"}
            </div>
            <div style={{ height: "4px", background: "#F1F5F9", borderRadius: "99px", overflow: "hidden", marginBottom: "6px" }}>
              <div style={{ height: "100%", width: pct != null ? `${pct}%` : "0%", background: color, borderRadius: "99px" }} />
            </div>
            <span style={{ fontSize: "9px", fontWeight: 700, color: badge.print, background: `${badge.print}18`,
              border: `1px solid ${badge.print}40`, borderRadius: "99px", padding: "2px 7px" }}>
              {badge.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Printable stage table ────────────────────────────────────
function PrintStageTable({ stages }: { stages: ModuleReport["stages"] }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10px" }}>
      <thead>
        <tr style={{ background: "#F8FAFC" }}>
          {["#", "Stage Title", "Phase", "Type", "Score", "Result", "Note"].map((h) => (
            <th key={h} style={{ textAlign: "left", fontWeight: 700, fontSize: "9px", textTransform: "uppercase",
              letterSpacing: "0.05em", color: "#64748B", padding: "6px 8px", borderBottom: "1px solid #E2E8F0" }}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {stages.map((s) => {
          const phaseColor = PHASE_COLORS[s.phase] ?? "#64748B";
          const scorePct   = s.maxScore > 0 && s.score != null ? Math.round((s.score / s.maxScore) * 100) : null;
          const typeLabel  = TYPE_LABELS[s.stageType]?.short ?? s.stageType;

          let resultColor = "#94A3B8";
          let resultText  = "—";
          if (s.score != null) {
            if (s.isCorrect === true)       { resultColor = "#4A9B7F"; resultText = "✓ Correct"; }
            else if (s.isCorrect === false) { resultColor = "#E05C5C"; resultText = "✗ Incorrect"; }
            else                            { resultColor = "#3B82C4"; resultText = scorePct != null ? `${scorePct}%` : "Graded"; }
          } else if (!s.autoScored && s.gradedAt == null) {
            resultColor = "#F59E0B"; resultText = "Pending";
          }

          return (
            <tr key={s.stageNumber}>
              <td style={{ padding: "6px 8px", borderBottom: "1px solid #F1F5F9" }}>
                <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: phaseColor,
                  color: "white", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "9px", fontWeight: 800 }}>{s.stageNumber}</div>
              </td>
              <td style={{ padding: "6px 8px", borderBottom: "1px solid #F1F5F9", fontWeight: 600 }}>{s.title}</td>
              <td style={{ padding: "6px 8px", borderBottom: "1px solid #F1F5F9" }}>
                <span style={{ fontSize: "9px", fontWeight: 700, color: phaseColor,
                  background: `${phaseColor}18`, borderRadius: "99px", padding: "2px 6px" }}>
                  {s.phase.charAt(0) + s.phase.slice(1).toLowerCase()}
                </span>
              </td>
              <td style={{ padding: "6px 8px", borderBottom: "1px solid #F1F5F9" }}>
                <span style={{ fontSize: "9px", fontWeight: 700, color: "#64748B",
                  background: "#F1F5F9", borderRadius: "4px", padding: "2px 6px" }}>
                  {typeLabel}
                </span>
              </td>
              <td style={{ padding: "6px 8px", borderBottom: "1px solid #F1F5F9" }}>
                {s.score != null ? (
                  <div>
                    <span style={{ fontWeight: 700, color: overallColor(scorePct) }}>{s.score}</span>
                    <span style={{ color: "#94A3B8" }}>/{s.maxScore}</span>
                    <div style={{ marginTop: "3px", height: "3px", width: "48px", background: "#F1F5F9", borderRadius: "99px" }}>
                      <div style={{ height: "100%", width: `${scorePct ?? 0}%`, background: overallColor(scorePct), borderRadius: "99px" }} />
                    </div>
                  </div>
                ) : <span style={{ color: "#94A3B8" }}>—</span>}
              </td>
              <td style={{ padding: "6px 8px", borderBottom: "1px solid #F1F5F9" }}>
                <span style={{ fontSize: "9px", fontWeight: 700, color: resultColor }}>{resultText}</span>
              </td>
              <td style={{ padding: "6px 8px", borderBottom: "1px solid #F1F5F9",
                color: "#64748B", fontStyle: "italic", maxWidth: "140px" }}>
                {s.teacherNote ?? "—"}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ─── Printable full report ────────────────────────────────────
function PrintableReport({ data, printedAt }: { data: StudentReportData; printedAt: string }) {
  const { student } = data;
  const allScores = data.reports.map((r) => r.overallScore).filter((v): v is number => v != null);
  const grandAvg  = allScores.length ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : null;

  return (
    <div style={{ fontFamily: "'Nunito', 'DM Sans', sans-serif", color: "#1E293B",
      background: "white", padding: "32px", maxWidth: "860px", margin: "0 auto" }}>

      {/* Cover header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        borderBottom: "3px solid #3B82C4", paddingBottom: "16px", marginBottom: "20px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px",
              background: "linear-gradient(135deg,#3B82C4,#4A9B7F)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "white", fontSize: "14px", fontWeight: 900 }}>T</div>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748B", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Think · Solve · Reflect
            </span>
          </div>
          <h1 style={{ fontSize: "22px", fontWeight: 900, margin: 0, lineHeight: 1.2 }}>Student Diagnostic Report</h1>
          <p style={{ fontSize: "11px", color: "#64748B", margin: "4px 0 0" }}>Grade 6 Mathematics · TSR Problem-Solving Module</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "11px", color: "#64748B" }}>Generated by</div>
          <div style={{ fontWeight: 700 }}>{data.teacher.name}</div>
          <div style={{ fontSize: "10px", color: "#94A3B8", marginTop: "2px" }}>{printedAt}</div>
        </div>
      </div>

      {/* Student summary */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", background: "#F8FAFC",
        border: "1px solid #E2E8F0", borderRadius: "12px", padding: "16px", marginBottom: "24px" }}>
        <div style={{ fontSize: "40px" }}>{student.avatarEmoji}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "18px", fontWeight: 900 }}>{student.name}</div>
          {student.avatarName && <div style={{ fontSize: "12px", color: "#64748B" }}>{student.avatarName}</div>}
          <div style={{ display: "flex", gap: "6px", marginTop: "6px", flexWrap: "wrap" }}>
            {[
              { label: student.section,                           color: "#3B82C4" },
              { label: `Level ${student.level} · ${student.xp} XP`, color: "#4A9B7F" },
              { label: diffLabel(student.difficulty),             color: "#8B5CF6" },
              { label: `${data.reports.length} Module${data.reports.length !== 1 ? "s" : ""} Completed`, color: "#64748B" },
            ].map(({ label, color }) => (
              <span key={label} style={{ fontSize: "10px", fontWeight: 700, color,
                background: `${color}18`, border: `1px solid ${color}40`, borderRadius: "99px", padding: "2px 8px" }}>
                {label}
              </span>
            ))}
          </div>
        </div>
        {grandAvg != null && (
          <div style={{ textAlign: "center" }}>
            <div style={{ width: "64px", height: "64px", borderRadius: "50%",
              border: `4px solid ${overallColor(grandAvg)}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "18px", fontWeight: 900, color: overallColor(grandAvg) }}>
              {grandAvg}%
            </div>
            <div style={{ fontSize: "10px", color: "#94A3B8", marginTop: "4px" }}>Overall Avg</div>
          </div>
        )}
      </div>

      {/* Module summary table (when multiple modules) */}
      {data.reports.length > 1 && (
        <div style={{ marginBottom: "24px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748B", textTransform: "uppercase",
            letterSpacing: "0.06em", marginBottom: "8px" }}>Module Summary</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
            <thead>
              <tr style={{ background: "#F8FAFC" }}>
                {["Module", "Overall", "Understanding", "Analysis", "Solution", "Reflection", "Intervention"].map((h) => (
                  <th key={h} style={{ textAlign: "left", fontWeight: 700, fontSize: "9px", textTransform: "uppercase",
                    letterSpacing: "0.05em", color: "#64748B", padding: "6px 8px", borderBottom: "2px solid #E2E8F0" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.reports.map((r) => (
                <tr key={r.moduleId} style={{ borderBottom: "1px solid #F1F5F9" }}>
                  <td style={{ padding: "6px 8px", fontWeight: 600, maxWidth: "160px" }}>{r.moduleIcon} {r.moduleTitle}</td>
                  <td style={{ padding: "6px 8px", fontWeight: 900, color: overallColor(r.overallScore) }}>{pctLabel(r.overallScore)}</td>
                  <td style={{ padding: "6px 8px", color: "#3B82C4", fontWeight: 700 }}>{pctLabel(r.understanding)}</td>
                  <td style={{ padding: "6px 8px", color: "#8B5CF6", fontWeight: 700 }}>{pctLabel(r.analysis)}</td>
                  <td style={{ padding: "6px 8px", color: "#F59E0B", fontWeight: 700 }}>{pctLabel(r.solution)}</td>
                  <td style={{ padding: "6px 8px", color: "#4A9B7F", fontWeight: 700 }}>{pctLabel(r.reflection)}</td>
                  <td style={{ padding: "6px 8px" }}>
                    {r.needsIntervention
                      ? <span style={{ fontSize: "9px", fontWeight: 700, color: "#E05C5C",
                          background: "#FEE2E2", borderRadius: "99px", padding: "2px 7px" }}>⚠️ Yes</span>
                      : <span style={{ fontSize: "9px", color: "#4A9B7F" }}>✓ OK</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* One section per module */}
      {data.reports.length === 0 ? (
        <p style={{ color: "#94A3B8", textAlign: "center", padding: "32px 0" }}>No completed modules yet.</p>
      ) : data.reports.map((report, i) => {
        const score  = report.overallScore != null ? Math.round(report.overallScore) : null;
        const oColor = overallColor(report.overallScore);
        return (
          <div key={report.moduleId} style={{ pageBreakInside: "avoid", marginBottom: "28px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px",
              background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "10px 10px 0 0",
              padding: "12px 14px", borderBottom: "none" }}>
              <div style={{ fontSize: "22px" }}>{report.moduleIcon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 900, fontSize: "14px" }}>{report.moduleTitle}</div>
                <div style={{ fontSize: "10px", color: "#64748B" }}>{report.context}</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontWeight: 900, fontSize: "20px", color: oColor }}>{score != null ? `${score}%` : "—"}</div>
                <div style={{ fontSize: "9px", color: "#94A3B8" }}>Overall</div>
              </div>
              {report.needsIntervention && (
                <span style={{ fontSize: "10px", fontWeight: 700, color: "#E05C5C",
                  background: "#FEE2E2", border: "1px solid #E05C5C40",
                  borderRadius: "99px", padding: "3px 10px" }}>⚠️ Intervention</span>
              )}
            </div>
            <div style={{ border: "1px solid #E2E8F0", borderRadius: "0 0 10px 10px", padding: "14px" }}>
              <PrintClusterBars report={report} />
              <PrintStageTable stages={report.stages} />
              <div style={{ marginTop: "8px", fontSize: "10px", color: "#94A3B8", textAlign: "right" }}>
                Completed {report.completedAt ?? "—"} · Report generated {report.generatedAt ?? "pending"}
              </div>
            </div>
            {i < data.reports.length - 1 && <div style={{ pageBreakAfter: "always" }} />}
          </div>
        );
      })}

      {/* Footer */}
      <div style={{ borderTop: "1px solid #E2E8F0", marginTop: "16px", paddingTop: "12px",
        display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#94A3B8" }}>
        <span>TSR · Think–Solve–Reflect · Grade 6 Mathematics</span>
        <span>Printed {printedAt}</span>
      </div>
    </div>
  );
}

// ─── Module Report Card (interactive) ────────────────────────
function ModuleReportCard({ report, expanded, onToggle, onGrade }: {
  report: ModuleReport;
  expanded: boolean;
  onToggle: () => void;
  onGrade: () => void;
}) {
  const score        = report.overallScore != null ? Math.round(report.overallScore) : null;
  const oColor       = overallColor(report.overallScore);
  const pendingCount = report.stages.filter((s) => !s.autoScored && s.score == null).length;
  const gradedCount  = report.stages.filter((s) => s.score != null).length;

  return (
    <div className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl shadow-sm overflow-hidden">

      {/* Progress bar at top */}
      <div className="h-1 w-full bg-[#F1F5F9] dark:bg-[#334155]">
        <div className="h-full transition-all rounded-full" style={{ width: `${(gradedCount / 12) * 100}%`, background: oColor }} />
      </div>

      {/* Header */}
      <div className="flex items-center gap-4 p-5 cursor-pointer hover:bg-[#F8FAFC] dark:hover:bg-[#162032] transition-colors" onClick={onToggle}>
        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0"
          style={{ background: `${oColor}18`, border: `1.5px solid ${oColor}40` }}>
          {report.moduleIcon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-nunito font-extrabold truncate">{report.moduleTitle}</p>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">{report.context}</p>
          <div className="flex items-center gap-3 mt-1 text-[10px] text-[#94A3B8]">
            <span>{gradedCount}/12 stages graded</span>
            {report.completedAt && <span>· Completed {report.completedAt}</span>}
          </div>
        </div>
        <div className="flex flex-col items-center shrink-0 mr-1">
          <span className="font-nunito font-black text-2xl" style={{ color: oColor }}>
            {score != null ? `${score}%` : "—"}
          </span>
          <span className="text-[10px] text-[#94A3B8]">Overall</span>
        </div>
        <div className="flex flex-col gap-1 shrink-0">
          {report.needsIntervention && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FEE2E2] dark:bg-[#450a0a] text-[#E05C5C] border border-[#E05C5C]/30">
              ⚠️ Intervention
            </span>
          )}
          {pendingCount > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FEF3C7] dark:bg-[#3d2800] text-[#F59E0B] border border-[#F59E0B]/30">
              {pendingCount} ungraded
            </span>
          )}
        </div>
        <span className="text-[#94A3B8] text-sm ml-1">{expanded ? "▲" : "▼"}</span>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-[#E2E8F0] dark:border-[#334155] p-5 space-y-5">

          {report.needsIntervention && (
            <div className="flex items-start gap-2.5 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl">
              <span className="text-red-500 text-base shrink-0 mt-0.5">⚠️</span>
              <div>
                <p className="text-sm text-red-600 dark:text-red-400 font-bold">Intervention Recommended</p>
                {report.interventionNote && (
                  <p className="text-xs text-red-500 dark:text-red-300 mt-0.5">{report.interventionNote}</p>
                )}
              </div>
            </div>
          )}

          {/* Cluster bars */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {CLUSTER_META.map(({ key, label, color, stages }) => {
              const val   = report[key as keyof ModuleReport] as number | null;
              const lvKey = `${key}Level` as keyof ModuleReport;
              const lv    = report[lvKey] as string | null;
              const badge = levelBadge(lv);
              const pct   = val != null ? Math.round(val) : null;
              return (
                <div key={key} className="p-4 rounded-2xl border border-[#E2E8F0] dark:border-[#334155] flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">{label}</span>
                    <span className="text-[10px] text-[#94A3B8]">S{stages}</span>
                  </div>
                  <span className="font-nunito font-black text-2xl" style={{ color }}>
                    {pct != null ? `${pct}%` : "—"}
                  </span>
                  <div className="h-1.5 bg-[#F1F5F9] dark:bg-[#334155] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: pct != null ? `${pct}%` : "0%", background: color }} />
                  </div>
                  <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border w-fit", badge.cls)}>
                    {badge.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Stage table */}
          <div>
            <h3 className="font-nunito font-extrabold text-sm mb-3 text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">
              Stage Breakdown
            </h3>
            <div className="overflow-x-auto rounded-xl border border-[#E2E8F0] dark:border-[#334155]">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-[#F8FAFC] dark:bg-[#162032]">
                    {["#", "Stage Title", "Phase", "Type", "Score", "Result", "Note"].map((h) => (
                      <th key={h} className="text-left font-bold tracking-wider uppercase text-[10px] text-[#64748B] dark:text-[#94A3B8] px-3 py-2.5 border-b border-[#E2E8F0] dark:border-[#334155] whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {report.stages.map((s) => {
                    const phaseColor = PHASE_COLORS[s.phase] ?? "#64748B";
                    const scorePct   = s.maxScore > 0 && s.score != null ? Math.round((s.score / s.maxScore) * 100) : null;
                    const typeMeta   = TYPE_LABELS[s.stageType] ?? { label: s.stageType, short: s.stageType };

                    let resultCls  = "text-[#94A3B8]";
                    let resultText = "—";
                    if (s.score != null) {
                      if (s.isCorrect === true)       { resultCls = "text-[#4A9B7F] font-bold"; resultText = "✓ Correct"; }
                      else if (s.isCorrect === false) { resultCls = "text-[#E05C5C] font-bold"; resultText = "✗ Incorrect"; }
                      else                            { resultCls = "text-[#3B82C4] font-bold"; resultText = scorePct != null ? `${scorePct}%` : "Graded"; }
                    } else if (!s.autoScored && !s.gradedAt) {
                      resultCls = "text-[#F59E0B] font-bold"; resultText = "⏳ Pending";
                    }

                    return (
                      <tr key={s.stageNumber} className="hover:bg-[#F8FAFC] dark:hover:bg-[#162032] transition-colors">

                        {/* # */}
                        <td className="px-3 py-2.5 border-b border-[#E2E8F0] dark:border-[#334155]">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-extrabold shrink-0"
                            style={{ background: phaseColor }}>
                            {s.stageNumber}
                          </div>
                        </td>

                        {/* Stage Title */}
                        <td className="px-3 py-2.5 border-b border-[#E2E8F0] dark:border-[#334155] max-w-[180px]">
                          <span className="font-semibold line-clamp-2 leading-snug">{s.title}</span>
                        </td>

                        {/* Phase */}
                        <td className="px-3 py-2.5 border-b border-[#E2E8F0] dark:border-[#334155]">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
                            style={{ background: `${phaseColor}18`, color: phaseColor }}>
                            {s.phase.charAt(0) + s.phase.slice(1).toLowerCase()}
                          </span>
                        </td>

                        {/* Type */}
                        <td className="px-3 py-2.5 border-b border-[#E2E8F0] dark:border-[#334155]">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#F1F5F9] dark:bg-[#334155] text-[#64748B] dark:text-[#94A3B8] whitespace-nowrap">
                            {typeMeta.label}
                          </span>
                        </td>

                        {/* Score */}
                        <td className="px-3 py-2.5 border-b border-[#E2E8F0] dark:border-[#334155]">
                          {s.score != null ? (
                            <div className="flex flex-col gap-1 min-w-[60px]">
                              <div>
                                <span className="font-bold tabular-nums" style={{ color: overallColor(scorePct) }}>{s.score}</span>
                                <span className="text-[#94A3B8]">/{s.maxScore}</span>
                                {scorePct != null && (
                                  <span className="ml-1 text-[10px] text-[#94A3B8]">({scorePct}%)</span>
                                )}
                              </div>
                              <div className="h-1 w-14 bg-[#F1F5F9] dark:bg-[#334155] rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${scorePct ?? 0}%`, background: overallColor(scorePct) }} />
                              </div>
                            </div>
                          ) : (
                            <span className="text-[#94A3B8]">—</span>
                          )}
                        </td>

                        {/* Result */}
                        <td className={cn("px-3 py-2.5 border-b border-[#E2E8F0] dark:border-[#334155] text-[10px] whitespace-nowrap", resultCls)}>
                          {resultText}
                        </td>

                        {/* Note */}
                        <td className="px-3 py-2.5 border-b border-[#E2E8F0] dark:border-[#334155] max-w-[200px]">
                          {s.teacherNote
                            ? <span className="text-[#64748B] dark:text-[#94A3B8] italic line-clamp-2 text-[11px]">{s.teacherNote}</span>
                            : <span className="text-[#CBD5E1] dark:text-[#475569]">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex gap-2.5 flex-wrap items-center">
            {pendingCount > 0 && (
              <button onClick={onGrade}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#4A9B7F] hover:bg-[#3a7a63] text-white shadow-[0_2px_8px_rgba(74,155,127,0.3)] transition-all">
                ✍️ Grade {pendingCount} Response{pendingCount > 1 ? "s" : ""}
              </button>
            )}
            <p className="ml-auto text-[11px] text-[#94A3B8]">
              Completed {report.completedAt ?? "—"} · Diagnostic {report.generatedAt ?? "pending"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Client ─────────────────────────────────────────────
export default function StudentReportClient({ data }: { data: StudentReportData }) {
  const router                  = useRouter();
  const printRef                = useRef<HTMLDivElement>(null);
  const [printing, setPrinting] = useState(false);
  const [pdfing,   setPdfing]   = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(
    data.reports.length === 1 ? data.reports[0].moduleId : null
  );

  const printedAt = new Date().toLocaleDateString("en-PH", {
    month: "long", day: "numeric", year: "numeric",
  });

  // Browser print (backup)
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `${data.student.name} — TSR Diagnostic Report`,
    onBeforePrint: () => { setPrinting(true); return Promise.resolve(); },
    onAfterPrint:  () => setPrinting(false),
  });

  // True PDF download using html2canvas + jsPDF
  const handleExportPDF = async () => {
    if (!printRef.current) return;
    setPdfing(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF }   = await import("jspdf");

      // Temporarily make it visible for canvas capture
      const el = printRef.current;
      const prev = el.style.display;
      el.style.display = "block";
      el.style.position = "fixed";
      el.style.top = "-9999px";
      el.style.left = "0";
      el.style.width = "860px";
      el.style.zIndex = "-1";

      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        windowWidth: 860,
        // Strip all global stylesheets from the clone — PrintableReport uses
        // 100% inline styles, so Tailwind's lab()/oklch color functions never
        // reach html2canvas and the "unsupported color function" error is avoided.
        onclone: (clonedDoc) => {
          clonedDoc.querySelectorAll('link[rel="stylesheet"], style').forEach((n) => n.remove());
        },
      });

      // Restore
      el.style.display = prev;
      el.style.position = "";
      el.style.top = "";
      el.style.left = "";
      el.style.width = "";
      el.style.zIndex = "";

      const imgData   = canvas.toDataURL("image/png");
      const pdfW      = 210;           // A4 width in mm
      const pdfH      = Math.round((canvas.height / canvas.width) * pdfW);
      const pageH     = 297;           // A4 height in mm

      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      let yOffset = 0;

      while (yOffset < pdfH) {
        if (yOffset > 0) pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, -yOffset, pdfW, pdfH);
        yOffset += pageH;
      }

      pdf.save(`${data.student.name.replace(/\s+/g, "_")}_TSR_Report.pdf`);
    } catch (err) {
      console.error("[PDF/EXPORT]", err);
    } finally {
      setPdfing(false);
    }
  };

  const { student } = data;
  const allScores = data.reports.map((r) => r.overallScore).filter((v): v is number => v != null);
  const grandAvg  = allScores.length ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : null;
  const needsAny  = data.reports.some((r) => r.needsIntervention);
  const totalPending = data.reports.reduce((n, r) =>
    n + r.stages.filter((s) => !s.autoScored && s.score == null).length, 0);

  return (
    <>
      <style>{`
        .font-nunito { font-family: var(--font-nunito, 'Nunito', sans-serif); }
        @keyframes fade-up { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fade-up 0.35s ease both; }
        @media print {
          body > * { display: none !important; }
          #tsr-print-root { display: block !important; }
        }
      `}</style>

      {/* Hidden printable document */}
      <div id="tsr-print-root" style={{ display: "none" }}>
        <div ref={printRef}>
          <PrintableReport data={data} printedAt={printedAt} />
        </div>
      </div>

      {/* Screen UI */}
      <div className="min-h-screen bg-[#F5F7FA] dark:bg-[#0F172A] text-[#1E293B] dark:text-[#F1F5F9]">

        {/* Sticky header */}
        <div className="sticky top-0 z-30 bg-white dark:bg-[#1E293B] border-b border-[#E2E8F0] dark:border-[#334155] shadow-sm">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-3 flex-wrap">
            <button
              onClick={() => router.push("/dashboard/teacher/reports")}
              className="p-2 rounded-xl hover:bg-[#F1F5F9] dark:hover:bg-[#162032] text-[#64748B] hover:text-[#1E293B] dark:hover:text-white transition-colors shrink-0"
            >←</button>
            <div className="flex-1 min-w-0">
              <h1 className="font-nunito font-extrabold text-lg truncate">{student.name}</h1>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                {student.section} · {diffLabel(student.difficulty)}
                {totalPending > 0 && <span className="ml-2 text-[#F59E0B] font-bold">· {totalPending} ungraded</span>}
              </p>
            </div>
            <button
              onClick={() => router.push(`/dashboard/teacher/students/${student.userId}`)}
              className="shrink-0 px-4 py-2 rounded-xl text-xs font-bold border border-[#E2E8F0] dark:border-[#334155] text-[#64748B] hover:border-[#4A9B7F] hover:text-[#4A9B7F] transition-all"
            >✍️ Review Responses</button>
            <button
              onClick={() => handlePrint()}
              disabled={printing || data.reports.length === 0}
              className="shrink-0 px-4 py-2 rounded-xl text-xs font-bold border border-[#E2E8F0] dark:border-[#334155] text-[#64748B] hover:border-[#3B82C4] hover:text-[#3B82C4] transition-all disabled:opacity-40"
            >🖨️ Print</button>
            <button
              onClick={handleExportPDF}
              disabled={pdfing || data.reports.length === 0}
              className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#3B82C4] hover:bg-[#2563A0] text-white shadow-[0_2px_8px_rgba(59,130,196,0.3)] transition-all disabled:opacity-50"
            >
              {pdfing ? "⏳ Generating…" : "⬇️ Export PDF"}
            </button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">

          {/* Student hero card */}
          <div className="fade-up bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-5 flex-wrap">
              <div className="text-5xl">{student.avatarEmoji}</div>
              <div className="flex-1 min-w-0">
                <h2 className="font-nunito font-extrabold text-xl">{student.name}</h2>
                {student.avatarName && (
                  <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">{student.avatarName}</p>
                )}
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#DBEAFE] dark:bg-[#1e3a5f] text-[#3B82C4] border border-[#3B82C4]/30">
                    {student.section}
                  </span>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#D1FAE5] dark:bg-[#063c28] text-[#4A9B7F] border border-[#4A9B7F]/30">
                    Lv {student.level} · {student.xp} XP
                  </span>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#EDE9FE] dark:bg-[#2e1065] text-[#8B5CF6] border border-[#8B5CF6]/30">
                    {diffLabel(student.difficulty)}
                  </span>
                  {needsAny && (
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#FEE2E2] dark:bg-[#450a0a] text-[#E05C5C] border border-[#E05C5C]/30">
                      ⚠️ Needs Intervention
                    </span>
                  )}
                </div>
              </div>
              {grandAvg != null && (
                <div className="flex flex-col items-center shrink-0">
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center border-4 font-nunito font-black text-2xl"
                    style={{ borderColor: overallColor(grandAvg), color: overallColor(grandAvg) }}
                  >{grandAvg}%</div>
                  <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-1.5">Overall Avg</span>
                </div>
              )}
            </div>

            {/* Summary stat row */}
            {data.reports.length > 0 && (
              <div className="grid grid-cols-4 gap-3 mt-5 pt-5 border-t border-[#E2E8F0] dark:border-[#334155]">
                {CLUSTER_META.map(({ key, label, color }) => {
                  const scores = data.reports
                    .map((r) => r[key as keyof ModuleReport] as number | null)
                    .filter((v): v is number => v != null);
                  const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
                  return (
                    <div key={key} className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color }}>{label}</span>
                      <span className="font-nunito font-black text-xl" style={{ color }}>
                        {avg != null ? `${avg}%` : "—"}
                      </span>
                      <div className="h-1.5 bg-[#F1F5F9] dark:bg-[#334155] rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: avg != null ? `${avg}%` : "0%", background: color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Report cards */}
          {data.reports.length === 0 ? (
            <div className="fade-up flex flex-col items-center justify-center py-20 bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl text-center">
              <div className="text-5xl mb-4 opacity-30">📋</div>
              <h3 className="font-nunito font-extrabold text-lg mb-2">No completed modules yet</h3>
              <p className="text-[#64748B] dark:text-[#94A3B8] text-sm">
                Reports will appear here once {student.name} completes a module.
              </p>
            </div>
          ) : (
            <div className="space-y-4 fade-up">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-[#64748B] dark:text-[#94A3B8]">
                  {data.reports.length} completed module{data.reports.length > 1 ? "s" : ""}
                </p>
                <button
                  onClick={() => setExpandedId(expandedId ? null : (data.reports[0]?.moduleId ?? null))}
                  className="text-xs font-bold text-[#4A9B7F] hover:underline"
                >
                  {expandedId ? "Collapse all" : "Expand first"}
                </button>
              </div>
              {data.reports.map((report) => (
                <ModuleReportCard
                  key={report.moduleId}
                  report={report}
                  expanded={expandedId === report.moduleId}
                  onToggle={() => setExpandedId((id) => id === report.moduleId ? null : report.moduleId)}
                  onGrade={() => router.push(`/dashboard/teacher/students/${student.userId}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
