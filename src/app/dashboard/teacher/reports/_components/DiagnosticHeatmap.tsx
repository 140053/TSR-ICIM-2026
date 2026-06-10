"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import type { StudentRow, AssignedModule, ModuleReportItem } from "../page";

// ─── Types ────────────────────────────────────────────────────
type Cluster = "understanding" | "analysis" | "solution" | "reflection";
type SortKey = Cluster | "overall" | "name";
type SortDir = "asc" | "desc";

// ─── Constants ────────────────────────────────────────────────
const CLUSTER_COLORS: Record<Cluster, string> = {
  understanding: "#3B82C4",
  analysis:      "#8B5CF6",
  solution:      "#F59E0B",
  reflection:    "#4A9B7F",
};

const CLUSTERS: Cluster[] = ["understanding", "analysis", "solution", "reflection"];

const AVATAR_COLORS = [
  "bg-[#DBEAFE] dark:bg-[#1e3a5f] text-[#3B82C4]",
  "bg-[#D1FAE5] dark:bg-[#063c28] text-[#4A9B7F]",
  "bg-[#EDE9FE] dark:bg-[#2e1065] text-[#8B5CF6]",
  "bg-[#FEF3C7] dark:bg-[#3d2800] text-[#F59E0B]",
];

// ─── Helpers ─────────────────────────────────────────────────
function avg(vals: (number | null)[]): number | null {
  const nums = vals.filter((v): v is number => v != null);
  if (!nums.length) return null;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

function heatCls(v: number | null): string {
  if (v == null || v < 0) return "bg-[#EEF2F8] dark:bg-[#162032] text-[#94A3B8]";
  if (v >= 80) return "bg-[#D1FAE5] dark:bg-[#063c28] text-[#4A9B7F]";
  if (v >= 60) return "bg-[#FEF3C7] dark:bg-[#3d2800] text-[#F59E0B]";
  return "bg-[#FEE2E2] dark:bg-[#450a0a] text-[#E05C5C]";
}

function heatBarColor(v: number | null): string {
  if (v == null) return "#CBD5E1";
  if (v >= 80)   return "#4A9B7F";
  if (v >= 60)   return "#F59E0B";
  return "#E05C5C";
}

function overallColor(v: number | null): string {
  if (v == null) return "#94A3B8";
  if (v >= 80)   return "#4A9B7F";
  if (v >= 60)   return "#F59E0B";
  return "#E05C5C";
}

function diffLabel(d: string) {
  if (d === "APPRENTICE") return { label: "Easy",   cls: "text-[#4A9B7F]" };
  if (d === "CHAMPION")   return { label: "Hard",   cls: "text-[#E05C5C]" };
  return                         { label: "Normal", cls: "text-[#F59E0B]" };
}

/** Get the cluster/overall score for a student given the active module filter. */
function getScore(
  reports: ModuleReportItem[],
  cluster: Cluster | "overall",
  moduleId: number | null
): number | null {
  const relevant = moduleId == null ? reports : reports.filter((r) => r.moduleId === moduleId);
  if (cluster === "overall") return avg(relevant.map((r) => r.overallScore));
  return avg(relevant.map((r) => r[cluster]));
}

// ─── Cell ─────────────────────────────────────────────────────
function HeatCell({ value }: { value: number | null }) {
  return (
    <div className="flex flex-col items-center gap-1 min-w-[56px]">
      <span
        className={cn(
          "inline-flex items-center justify-center w-14 h-7 rounded-lg text-[11px] font-bold tabular-nums",
          heatCls(value)
        )}
      >
        {value != null ? `${value}%` : "—"}
      </span>
      {/* Mini bar */}
      <div className="w-14 h-1 bg-[#E2E8F0] dark:bg-[#334155] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width:      value != null ? `${value}%` : "0%",
            background: heatBarColor(value),
          }}
        />
      </div>
    </div>
  );
}

// ─── Sort indicator ───────────────────────────────────────────
function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <span className="opacity-25 text-[10px]">⇅</span>;
  return <span className="text-[10px]">{dir === "asc" ? "↑" : "↓"}</span>;
}

// ─── Props ────────────────────────────────────────────────────
interface DiagnosticHeatmapProps {
  students:       StudentRow[];
  modules:        AssignedModule[];
  onStudentClick: (userId: number) => void;
}

// ─── Component ───────────────────────────────────────────────
export default function DiagnosticHeatmap({
  students,
  modules,
  onStudentClick,
}: DiagnosticHeatmapProps) {
  const [moduleFilter, setModuleFilter] = useState<number | null>(null); // null = all
  const [search,       setSearch]       = useState("");
  const [sortKey,      setSortKey]      = useState<SortKey>("name");
  const [sortDir,      setSortDir]      = useState<SortDir>("asc");

  // Toggle sort: same key → flip dir; new key → asc
  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  // Filtered + sorted students
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = q ? students.filter((s) => s.name.toLowerCase().includes(q)) : [...students];

    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") {
        cmp = a.name.localeCompare(b.name);
      } else {
        const va = getScore(a.reports, sortKey, moduleFilter) ?? -1;
        const vb = getScore(b.reports, sortKey, moduleFilter) ?? -1;
        cmp = va - vb;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [students, search, sortKey, sortDir, moduleFilter]);

  // Class-average row
  const classAvgs = useMemo(() => {
    const result: Record<Cluster | "overall", number | null> = {
      understanding: null, analysis: null, solution: null, reflection: null, overall: null,
    };
    for (const key of [...CLUSTERS, "overall" as const]) {
      result[key] = avg(rows.map((s) => getScore(s.reports, key, moduleFilter)));
    }
    return result;
  }, [rows, moduleFilter]);

  // Stats line
  const proficientCount  = rows.filter((s) => (getScore(s.reports, "overall", moduleFilter) ?? 0) >= 80).length;
  const developingCount  = rows.filter((s) => { const v = getScore(s.reports, "overall", moduleFilter); return v != null && v >= 60 && v < 80; }).length;
  const strugglingCount  = rows.filter((s) => { const v = getScore(s.reports, "overall", moduleFilter); return v != null && v < 60; }).length;
  const noDataCount      = rows.filter((s) => getScore(s.reports, "overall", moduleFilter) == null).length;

  const colHeaders: { key: SortKey; label: string; color?: string }[] = [
    { key: "name",          label: "Student" },
    { key: "understanding", label: "Understanding", color: CLUSTER_COLORS.understanding },
    { key: "analysis",      label: "Analysis",      color: CLUSTER_COLORS.analysis      },
    { key: "solution",      label: "Solution",      color: CLUSTER_COLORS.solution      },
    { key: "reflection",    label: "Reflection",    color: CLUSTER_COLORS.reflection    },
    { key: "overall",       label: "Overall"                                            },
  ];

  return (
    <div className="space-y-4">

      {/* ── Toolbar ───────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">

        {/* Module filter */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setModuleFilter(null)}
            className={cn(
              "px-3 py-1 rounded-full text-[11px] font-bold border transition-all",
              moduleFilter == null
                ? "bg-[#1E293B] dark:bg-[#F1F5F9] text-white dark:text-[#1E293B] border-transparent"
                : "border-[#E2E8F0] dark:border-[#334155] text-[#64748B] hover:border-[#1E293B] dark:hover:border-[#94A3B8]"
            )}
          >
            All Modules
          </button>
          {modules.map((m) => (
            <button
              key={m.id}
              onClick={() => setModuleFilter(m.id)}
              className={cn(
                "px-3 py-1 rounded-full text-[11px] font-bold border transition-all",
                moduleFilter === m.id
                  ? "bg-[#1E293B] dark:bg-[#F1F5F9] text-white dark:text-[#1E293B] border-transparent"
                  : "border-[#E2E8F0] dark:border-[#334155] text-[#64748B] hover:border-[#1E293B] dark:hover:border-[#94A3B8]"
              )}
            >
              {m.icon} {m.title}
            </button>
          ))}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Search */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8] text-xs">🔍</span>
          <input
            type="text"
            placeholder="Search student…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-[#1E293B] dark:text-[#F1F5F9] placeholder-[#94A3B8] focus:outline-none focus:border-[#3B82C4] w-44 transition-colors"
          />
        </div>
      </div>

      {/* ── Summary strip ─────────────────────────────────────── */}
      <div className="flex gap-3 flex-wrap text-[11px]">
        {[
          { color: "#4A9B7F", label: "Proficient",  count: proficientCount  },
          { color: "#F59E0B", label: "Developing",  count: developingCount  },
          { color: "#E05C5C", label: "Struggling",  count: strugglingCount  },
          { color: "#94A3B8", label: "No data",     count: noDataCount      },
        ].map(({ color, label, count }) => (
          <span key={label} className="flex items-center gap-1.5 font-semibold text-[#64748B] dark:text-[#94A3B8]">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
            <span style={{ color }}>{count}</span>&nbsp;{label}
          </span>
        ))}
      </div>

      {/* ── Table ─────────────────────────────────────────────── */}
      <div className="overflow-x-auto rounded-xl border border-[#E2E8F0] dark:border-[#334155]">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-[#F8FAFC] dark:bg-[#162032]">
              {colHeaders.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="text-left pb-3 pt-3 px-4 border-b border-[#E2E8F0] dark:border-[#334155] whitespace-nowrap cursor-pointer select-none group"
                >
                  <div className="flex items-center gap-1.5">
                    {col.color && (
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: col.color }} />
                    )}
                    <span
                      className={cn(
                        "text-[11px] font-bold tracking-wider uppercase transition-colors",
                        sortKey === col.key
                          ? "text-[#1E293B] dark:text-[#F1F5F9]"
                          : "text-[#64748B] dark:text-[#94A3B8] group-hover:text-[#1E293B] dark:group-hover:text-[#F1F5F9]"
                      )}
                    >
                      {col.label}
                    </span>
                    <SortIcon active={sortKey === col.key} dir={sortDir} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12 text-center text-sm text-[#94A3B8]">
                  No students match your search.
                </td>
              </tr>
            )}

            {rows.map((s, idx) => {
              const diff = diffLabel(s.difficulty);
              return (
                <tr
                  key={s.userId}
                  onClick={() => onStudentClick(s.userId)}
                  className="hover:bg-[#F8FAFC] dark:hover:bg-[#162032] transition-colors cursor-pointer group/row"
                >
                  {/* Student name */}
                  <td className="py-3 px-4 border-b border-[#E2E8F0] dark:border-[#334155]">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-extrabold shrink-0",
                          AVATAR_COLORS[idx % 4]
                        )}
                      >
                        {s.initials}
                      </div>
                      <div>
                        <p className="font-semibold text-sm leading-tight group-hover/row:text-[#3B82C4] transition-colors">
                          {s.name}
                        </p>
                        <p className={cn("text-[10px] font-semibold", diff.cls)}>{diff.label}</p>
                      </div>
                    </div>
                  </td>

                  {/* Cluster cells */}
                  {CLUSTERS.map((c) => (
                    <td key={c} className="py-3 px-4 border-b border-[#E2E8F0] dark:border-[#334155]">
                      <HeatCell value={getScore(s.reports, c, moduleFilter)} />
                    </td>
                  ))}

                  {/* Overall */}
                  <td className="py-3 px-4 border-b border-[#E2E8F0] dark:border-[#334155]">
                    {(() => {
                      const overall = getScore(s.reports, "overall", moduleFilter);
                      return (
                        <span
                          className="font-bold text-sm tabular-nums"
                          style={{ color: overallColor(overall) }}
                        >
                          {overall != null ? `${overall}%` : "—"}
                        </span>
                      );
                    })()}
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* Class average footer */}
          {rows.length > 1 && (
            <tfoot>
              <tr className="bg-[#F1F5F9] dark:bg-[#1E293B]">
                <td className="py-2.5 px-4 border-t border-[#E2E8F0] dark:border-[#334155]">
                  <span className="text-[11px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">
                    Class Avg
                  </span>
                </td>
                {CLUSTERS.map((c) => (
                  <td key={c} className="py-2.5 px-4 border-t border-[#E2E8F0] dark:border-[#334155]">
                    <HeatCell value={classAvgs[c]} />
                  </td>
                ))}
                <td className="py-2.5 px-4 border-t border-[#E2E8F0] dark:border-[#334155]">
                  <span
                    className="font-bold text-sm tabular-nums"
                    style={{ color: overallColor(classAvgs.overall) }}
                  >
                    {classAvgs.overall != null ? `${classAvgs.overall}%` : "—"}
                  </span>
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* ── Legend ────────────────────────────────────────────── */}
      <div className="flex gap-4 flex-wrap">
        {([
          ["bg-[#D1FAE5] dark:bg-[#063c28] text-[#4A9B7F]", "≥ 80% Proficient"],
          ["bg-[#FEF3C7] dark:bg-[#3d2800] text-[#F59E0B]", "60–79% Developing"],
          ["bg-[#FEE2E2] dark:bg-[#450a0a] text-[#E05C5C]", "< 60% Struggling"],
          ["bg-[#EEF2F8] dark:bg-[#162032] text-[#94A3B8]", "No data"],
        ] as [string, string][]).map(([cls, lbl]) => (
          <span key={lbl} className="flex items-center gap-1.5 text-[11px] text-[#64748B] dark:text-[#94A3B8]">
            <span className={cn("w-4 h-4 rounded", cls)} />{lbl}
          </span>
        ))}
      </div>
    </div>
  );
}
