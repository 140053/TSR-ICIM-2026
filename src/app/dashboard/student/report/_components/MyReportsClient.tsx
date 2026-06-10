"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { MyReportsData, ReportSummaryCard } from "../page";

// ─── Constants ────────────────────────────────────────────────
const CLUSTER_COLORS: Record<string, string> = {
  Understanding: "#3B82C4",
  Analysis:      "#8B5CF6",
  Solution:      "#F59E0B",
  Reflection:    "#4A9B7F",
};

const CLUSTER_ICONS: Record<string, string> = {
  Understanding: "🔵",
  Analysis:      "🟣",
  Solution:      "🟠",
  Reflection:    "🟢",
};

// ─── Helpers ─────────────────────────────────────────────────
function scoreBadge(score: number | null): { label: string; cls: string } {
  if (score == null) return { label: "Pending",    cls: "bg-[#FEF3C7]/20 text-[#F59E0B] border-[#F59E0B]/40" };
  if (score >= 80)   return { label: "Proficient", cls: "bg-[#D1FAE5]/20 text-[#4A9B7F] border-[#4A9B7F]/40" };
  if (score >= 60)   return { label: "Developing", cls: "bg-[#FEF3C7]/20 text-[#F59E0B] border-[#F59E0B]/40" };
  return               { label: "Struggling",  cls: "bg-red-900/20 text-red-400 border-red-500/40" };
}

function overallColor(score: number | null): string {
  if (score == null) return "#4a6a94";
  if (score >= 80)   return "#4A9B7F";
  if (score >= 60)   return "#F59E0B";
  return "#E05C5C";
}

// ─── Report Card ─────────────────────────────────────────────
function ReportCard({ report, onView }: { report: ReportSummaryCard; onView: () => void }) {
  const badge   = scoreBadge(report.overallScore);
  const oColor  = overallColor(report.overallScore);
  const score   = report.overallScore != null ? Math.round(report.overallScore) : null;

  return (
    <div className="bg-[#162240] border border-[#243558] rounded-2xl overflow-hidden hover:border-[#3B82C4]/50 transition-all duration-200 hover:shadow-[0_4px_24px_rgba(59,130,196,0.12)]">

      {/* Header */}
      <div className="flex items-center gap-4 p-5 border-b border-[#243558]">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{ background: `${oColor}22`, border: `1.5px solid ${oColor}44` }}
        >
          {report.moduleIcon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-nunito font-extrabold text-white truncate">{report.moduleTitle}</p>
          <p className="text-xs text-[#4a6a94] mt-0.5">{report.context}</p>
        </div>

        {/* Overall score circle */}
        <div className="flex flex-col items-center flex-shrink-0">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center font-nunito font-black text-lg border-2"
            style={{ borderColor: oColor, color: oColor, background: `${oColor}15` }}
          >
            {score != null ? `${score}%` : "—"}
          </div>
          <span className={cn("mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full border", badge.cls)}>
            {badge.label}
          </span>
        </div>
      </div>

      {/* Intervention warning */}
      {report.needsIntervention && (
        <div className="mx-5 mt-4 flex items-center gap-2.5 px-3.5 py-2.5 bg-red-900/20 border border-red-500/30 rounded-xl">
          <span className="text-red-400 text-base flex-shrink-0">⚠️</span>
          <p className="text-xs text-red-300 font-semibold">
            One or more clusters scored below 60% — teacher intervention recommended.
          </p>
        </div>
      )}

      {/* Cluster bars */}
      <div className="p-5 flex flex-col gap-2.5">
        {report.clusters.map((c) => {
          const color = CLUSTER_COLORS[c.phase];
          const pct   = c.score != null ? Math.round(c.score) : null;
          return (
            <div key={c.phase} className="flex items-center gap-3">
              <span className="text-sm w-4 flex-shrink-0">{CLUSTER_ICONS[c.phase]}</span>
              <span className="text-xs text-[#7A9CC4] w-24 flex-shrink-0">{c.phase}</span>
              <div className="flex-1 h-2 bg-[#101f38] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: pct != null ? `${pct}%` : "0%", background: color }}
                />
              </div>
              <span
                className="text-xs font-bold w-9 text-right flex-shrink-0"
                style={{ color: pct != null ? color : "#4a6a94" }}
              >
                {pct != null ? `${pct}%` : "—"}
              </span>
              {c.level && (
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0"
                  style={{
                    color,
                    borderColor: `${color}50`,
                    background:  `${color}18`,
                  }}
                >
                  {c.level.charAt(0) + c.level.slice(1).toLowerCase()}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-5 pb-5 gap-3">
        <div>
          <p className="text-[11px] text-[#4a6a94]">
            Completed · <span className="text-[#7A9CC4] font-semibold">{report.completedAt}</span>
          </p>
          <p className="text-[11px] text-[#4a6a94] mt-0.5">
            Report generated · <span className="text-[#7A9CC4]">{report.generatedAt}</span>
          </p>
        </div>
        <button
          onClick={onView}
          className="flex-shrink-0 px-5 py-2.5 rounded-xl font-nunito font-extrabold text-sm bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-[0_0_16px_rgba(96,165,250,0.2)] hover:shadow-[0_4px_20px_rgba(96,165,250,0.35)] hover:-translate-y-0.5 transition-all duration-200"
        >
          View Full Report →
        </button>
      </div>
    </div>
  );
}

// ─── Empty State ─────────────────────────────────────────────
function EmptyState({ onGoModules }: { onGoModules: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-6xl mb-4 opacity-40">📋</div>
      <h2 className="font-nunito font-extrabold text-xl text-white mb-2">No reports yet</h2>
      <p className="text-[#4a6a94] text-sm max-w-xs mb-6">
        Complete a module to generate your first diagnostic report.
      </p>
      <button
        onClick={onGoModules}
        className="px-6 py-3 rounded-xl font-nunito font-extrabold text-sm bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-[0_0_20px_rgba(96,165,250,0.3)] hover:-translate-y-0.5 transition-all"
      >
        Go to My Modules →
      </button>
    </div>
  );
}

// ─── Main Client ─────────────────────────────────────────────
export default function MyReportsClient({ data }: { data: MyReportsData }) {
  const router = useRouter();

  return (
    <>
      <style>{`
        .font-nunito { font-family: var(--font-nunito, 'Nunito', sans-serif); }
        .font-cinzel  { font-family: var(--font-cinzel,  'Cinzel',  serif); }
      `}</style>

      <div className="min-h-screen bg-[#0B1628] text-white">

        {/* Header */}
        <div className="sticky top-0 z-30 bg-[#0B1628]/90 backdrop-blur border-b border-[#243558]">
          <div className="max-w-3xl mx-auto px-3 sm:px-5 py-3 sm:py-4 flex items-center gap-4">
            <button
              onClick={() => router.push("/dashboard/student")}
              className="p-2 rounded-xl hover:bg-[#162240] text-[#4a6a94] hover:text-white transition-colors flex-shrink-0"
            >
              ←
            </button>
            <div className="flex-1">
              <h1 className="font-nunito font-extrabold text-lg text-white leading-tight">My Reports</h1>
              <p className="text-xs text-[#4a6a94]">
                {data.reports.length > 0
                  ? `${data.reports.length} completed module${data.reports.length > 1 ? "s" : ""}`
                  : "No completed modules yet"}
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#162240] border border-[#243558] rounded-xl">
              <span className="text-base">{data.student.avatarEmoji}</span>
              <span className="text-xs font-bold text-[#7A9CC4]">{data.student.name}</span>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-5 py-6 sm:py-8">

          {/* Summary pills */}
          {data.reports.length > 0 && (
            <div className="flex flex-wrap gap-3 mb-8">
              <div className="flex items-center gap-2 px-4 py-2 bg-[#162240] border border-[#243558] rounded-xl">
                <span className="text-[#4A9B7F] font-black font-nunito text-lg">{data.reports.length}</span>
                <span className="text-xs text-[#7A9CC4] font-semibold">Modules Completed</span>
              </div>
              {(() => {
                const withScore = data.reports.filter((r) => r.overallScore != null);
                if (withScore.length === 0) return null;
                const avg = Math.round(withScore.reduce((s, r) => s + (r.overallScore ?? 0), 0) / withScore.length);
                const { label, cls } = scoreBadge(avg);
                return (
                  <div className="flex items-center gap-2 px-4 py-2 bg-[#162240] border border-[#243558] rounded-xl">
                    <span className="font-black font-nunito text-lg" style={{ color: overallColor(avg) }}>{avg}%</span>
                    <span className="text-xs text-[#7A9CC4] font-semibold">Avg. Score</span>
                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", cls)}>{label}</span>
                  </div>
                );
              })()}
              {data.reports.some((r) => r.needsIntervention) && (
                <div className="flex items-center gap-2 px-4 py-2 bg-red-900/20 border border-red-500/30 rounded-xl">
                  <span className="text-red-400">⚠️</span>
                  <span className="text-xs text-red-300 font-semibold">
                    {data.reports.filter((r) => r.needsIntervention).length} module{data.reports.filter((r) => r.needsIntervention).length > 1 ? "s need" : " needs"} attention
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Report cards or empty state */}
          {data.reports.length === 0 ? (
            <EmptyState onGoModules={() => router.push("/dashboard/student/modules")} />
          ) : (
            <div className="flex flex-col gap-5">
              {data.reports.map((report) => (
                <ReportCard
                  key={report.moduleId}
                  report={report}
                  onView={() => router.push(`/dashboard/student/report/${report.moduleId}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
