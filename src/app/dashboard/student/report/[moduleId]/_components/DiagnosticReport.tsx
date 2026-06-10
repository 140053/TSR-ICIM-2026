"use client";

import { useRouter } from "next/navigation";
import type { ReportData, ClusterData } from "../page";

// ─── Phase meta ───────────────────────────────────────────────
const PHASE_META: Record<string, { label: string; color: string; bg: string; stages: string }> = {
  UNDERSTANDING: { label: "Understanding", color: "#3B82C4", bg: "#0F1E3A", stages: "Stages 1–3"  },
  ANALYSIS:      { label: "Analysis",      color: "#8B5CF6", bg: "#1A0F3A", stages: "Stages 4–7"  },
  SOLUTION:      { label: "Solution",      color: "#F59E0B", bg: "#2A1A0A", stages: "Stages 8–10" },
  REFLECTION:    { label: "Reflection",    color: "#4A9B7F", bg: "#0A2419", stages: "Stages 11–12"},
};

const LEVEL_META: Record<string, { label: string; color: string; desc: string }> = {
  PROFICIENT: { label: "Proficient", color: "#4A9B7F", desc: "80–100% — Excellent work!" },
  DEVELOPING: { label: "Developing", color: "#F59E0B", desc: "60–79% — Keep practicing."  },
  STRUGGLING: { label: "Struggling", color: "#E05C5C", desc: "Below 60% — Needs support." },
};

const DIFF_LABEL: Record<string, string> = {
  APPRENTICE:  "Apprentice",
  ADVENTURER:  "Adventurer",
  CHAMPION:    "Champion",
};

// ─── Helpers ─────────────────────────────────────────────────
function scoreColor(pct: number | null): string {
  if (pct == null) return "#7A9CC4";
  if (pct >= 80) return "#4A9B7F";
  if (pct >= 60) return "#F59E0B";
  return "#E05C5C";
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-PH", {
    year: "numeric", month: "long", day: "numeric",
  });
}

// ─── Cluster card ────────────────────────────────────────────
function ClusterCard({ cluster }: { cluster: ClusterData }) {
  const meta  = PHASE_META[cluster.phase];
  const level = cluster.level ? LEVEL_META[cluster.level] : null;
  const pct   = cluster.score != null ? Math.round(cluster.score) : null;

  return (
    <div
      className="rounded-2xl p-4 border flex flex-col gap-3"
      style={{ background: meta.bg, borderColor: `${meta.color}33` }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] text-[#64748B] font-nunito">{meta.stages}</p>
          <p className="text-sm font-extrabold font-nunito" style={{ color: meta.color }}>{meta.label}</p>
        </div>
        {level && (
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: `${level.color}22`, color: level.color }}
          >
            {level.label}
          </span>
        )}
      </div>

      {/* Score bar */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-[#64748B] font-nunito">Score</span>
          <span className="text-xl font-extrabold font-nunito" style={{ color: meta.color }}>
            {pct != null ? `${pct}%` : "—"}
          </span>
        </div>
        <div className="h-2 bg-[#1E2D3D] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{ width: `${Math.min(pct ?? 0, 100)}%`, background: meta.color }}
          />
        </div>
      </div>

      {level && (
        <p className="text-[10px] text-[#64748B] font-nunito">{level.desc}</p>
      )}
    </div>
  );
}

// ─── Stage breakdown row ──────────────────────────────────────
function BreakdownRow({ item }: { item: ReportData["stageBreakdown"][0] }) {
  const meta  = PHASE_META[item.phase];
  const pct   = item.score != null ? Math.round((item.score / item.maxScore) * 100) : null;
  const color = scoreColor(pct);

  return (
    <tr className="border-b border-[#1E2D3D] last:border-0">
      <td className="py-2.5 pr-3">
        <div className="flex items-center gap-2">
          <span
            className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold text-white flex-shrink-0"
            style={{ background: meta?.color ?? "#64748B" }}
          >
            {item.stageNumber}
          </span>
          <span className="text-sm font-nunito text-[#CBD5E1]">{item.title}</span>
        </div>
      </td>
      <td className="py-2.5 px-2 text-center">
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: `${meta?.color ?? "#64748B"}22`, color: meta?.color ?? "#64748B" }}
        >
          {meta?.label}
        </span>
      </td>
      <td className="py-2.5 pl-3 text-right">
        {item.score != null ? (
          <span className="font-extrabold font-nunito text-sm" style={{ color }}>
            {item.score}/{item.maxScore}
          </span>
        ) : (
          <span className="text-xs text-[#64748B] font-nunito">
            {item.gradedAt ? "—" : "Pending"}
          </span>
        )}
      </td>
    </tr>
  );
}

// ─── Main component ───────────────────────────────────────────
export default function DiagnosticReport({
  data,
  moduleId,
}: {
  data:     ReportData;
  moduleId: number;
}) {
  const router  = useRouter();
  const overall = data.overallScore;
  const ovColor = scoreColor(overall);

  return (
    <>
      <style>{`
        .font-nunito { font-family: var(--font-nunito,'Nunito',sans-serif); }
        .font-cinzel { font-family: var(--font-cinzel,'Cinzel',serif); }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation: fadeUp .4s ease both; }
      `}</style>

      <div className="min-h-screen bg-[#0B1628] text-white pb-16">

        {/* ── Top bar ── */}
        <header className="sticky top-0 z-40 bg-[#0D1A2E] border-b border-[#1E3A5F] px-3 sm:px-5 h-[56px] flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard/student/modules")}
            className="p-2 rounded-xl text-[#7A9CC4] hover:text-white hover:bg-[#162240] transition-colors font-bold"
          >
            ←
          </button>
          <p className="font-cinzel text-sm font-bold text-white truncate">
            {data.module.icon} Diagnostic Report
          </p>
        </header>

        <div className="max-w-2xl mx-auto px-5 pt-6 flex flex-col gap-5">

          {/* ── Student + module info ── */}
          <div className="fade-up flex items-center gap-4 bg-[#0F1E2E] border border-[#1E3A5F] rounded-2xl p-4">
            <div className="text-4xl">{data.student.avatarEmoji}</div>
            <div className="flex-1 min-w-0">
              <p className="font-extrabold font-nunito text-white truncate">{data.student.name}</p>
              <p className="text-xs text-[#64748B] font-nunito">
                {data.student.avatarName} · {DIFF_LABEL[data.student.difficulty] ?? data.student.difficulty}
              </p>
              <p className="text-xs text-[#64748B] font-nunito mt-0.5">
                {data.module.title} · Generated {fmtDate(data.generatedAt)}
              </p>
            </div>
            {/* Overall score bubble */}
            <div className="flex-shrink-0 text-center">
              <div className="font-nunito text-3xl font-extrabold" style={{ color: ovColor }}>
                {overall != null ? `${Math.round(overall)}%` : "—"}
              </div>
              <div className="text-[10px] text-[#64748B] font-nunito">Overall</div>
            </div>
          </div>

          {/* ── Intervention alert ── */}
          {data.needsIntervention && (
            <div
              className="fade-up flex items-start gap-3 bg-[#2A1515] border border-[#E05C5C]/40 rounded-2xl p-4"
              style={{ animationDelay: "0.1s" }}
            >
              <span className="text-xl flex-shrink-0">⚠️</span>
              <div>
                <p className="text-sm font-extrabold font-nunito text-[#E05C5C]">Teacher Intervention Recommended</p>
                <p className="text-xs text-[#C084A0] font-nunito mt-0.5">
                  {data.interventionNote ?? "One or more skill clusters scored below 60%. Your teacher has been notified to provide additional support."}
                </p>
              </div>
            </div>
          )}

          {/* ── Cluster cards ── */}
          <div className="fade-up" style={{ animationDelay: "0.15s" }}>
            <h2 className="font-cinzel text-xs font-bold text-[#64748B] uppercase tracking-widest mb-3">
              Skill Cluster Results
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {data.clusters.map((c) => (
                <ClusterCard key={c.phase} cluster={c} />
              ))}
            </div>
          </div>

          {/* ── Stage breakdown ── */}
          <div className="fade-up" style={{ animationDelay: "0.25s" }}>
            <h2 className="font-cinzel text-xs font-bold text-[#64748B] uppercase tracking-widest mb-3">
              Stage-by-Stage Breakdown
            </h2>
            <div className="bg-[#0F1E2E] border border-[#1E3A5F] rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#1E3A5F]">
                    <th className="text-left text-[10px] font-bold text-[#64748B] font-nunito py-2.5 px-4 uppercase tracking-wide">Stage</th>
                    <th className="text-center text-[10px] font-bold text-[#64748B] font-nunito py-2.5 px-2 uppercase tracking-wide">Phase</th>
                    <th className="text-right text-[10px] font-bold text-[#64748B] font-nunito py-2.5 px-4 uppercase tracking-wide">Score</th>
                  </tr>
                </thead>
                <tbody className="px-4">
                  {data.stageBreakdown.length > 0 ? (
                    data.stageBreakdown.map((item) => (
                      <tr key={item.stageNumber} className="border-b border-[#1E2D3D] last:border-0">
                        <td className="py-2.5 pl-4 pr-3">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold text-white flex-shrink-0"
                              style={{ background: PHASE_META[item.phase]?.color ?? "#64748B" }}
                            >
                              {item.stageNumber}
                            </span>
                            <span className="text-sm font-nunito text-[#CBD5E1]">{item.title}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{
                              background: `${PHASE_META[item.phase]?.color ?? "#64748B"}22`,
                              color:       PHASE_META[item.phase]?.color ?? "#64748B",
                            }}
                          >
                            {PHASE_META[item.phase]?.label ?? item.phase}
                          </span>
                        </td>
                        <td className="py-2.5 pl-3 pr-4 text-right">
                          {item.score != null ? (
                            <span
                              className="font-extrabold font-nunito text-sm"
                              style={{ color: scoreColor(Math.round((item.score / item.maxScore) * 100)) }}
                            >
                              {item.score}/{item.maxScore}
                            </span>
                          ) : (
                            <span className="text-xs text-[#F59E0B] font-nunito">Pending</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-[#64748B] text-sm font-nunito">
                        No responses recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Actions ── */}
          <div className="fade-up flex flex-col gap-3" style={{ animationDelay: "0.35s" }}>
            <button
              onClick={() => router.push(`/dashboard/student/modules/${moduleId}/stage/1`)}
              className="w-full py-3.5 rounded-2xl font-nunito font-bold text-sm border border-[#1E3A5F] text-[#7A9CC4] hover:border-[#3B82C4] hover:text-[#3B82C4] transition-all"
            >
              🔄 Review My Answers
            </button>
            <button
              onClick={() => router.push("/dashboard/student/modules")}
              className="w-full py-3.5 rounded-2xl font-nunito font-bold text-sm border border-[#1E3A5F] text-[#64748B] hover:border-[#243558] hover:text-[#7A9CC4] transition-all"
            >
              ↩ Back to My Modules
            </button>
          </div>

        </div>
      </div>
    </>
  );
}
