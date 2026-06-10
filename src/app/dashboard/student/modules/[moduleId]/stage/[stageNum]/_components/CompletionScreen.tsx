"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface CompletionScreenProps {
  moduleId:    number;
  moduleTitle: string;
  moduleIcon:  string;
}

// ─── Types ────────────────────────────────────────────────────
interface ClusterResult {
  phase: string;
  score: number | null;
  level: string | null;
}

interface CompletionData {
  overallScore:      number | null;
  needsIntervention: boolean;
  clusters:          ClusterResult[];
}

// ─── Phase meta ───────────────────────────────────────────────
const PHASE_META: Record<string, { label: string; color: string; lt: string }> = {
  UNDERSTANDING: { label: "Understanding", color: "#3B82C4", lt: "#DBEAFE" },
  ANALYSIS:      { label: "Analysis",      color: "#8B5CF6", lt: "#EDE9FE" },
  SOLUTION:      { label: "Solution",      color: "#F59E0B", lt: "#FEF3C7" },
  REFLECTION:    { label: "Reflection",    color: "#4A9B7F", lt: "#D1FAE5" },
};

const LEVEL_BADGE: Record<string, { label: string; color: string }> = {
  PROFICIENT: { label: "Proficient", color: "#4A9B7F" },
  DEVELOPING: { label: "Developing", color: "#F59E0B" },
  STRUGGLING: { label: "Struggling", color: "#E05C5C" },
};

// ─── Static confetti pieces ───────────────────────────────────
const CONFETTI = [
  { left: "5%",  color: "#3B82C4", size: 8,  delay: "0s",    dur: "3s"   },
  { left: "10%", color: "#F59E0B", size: 10, delay: "0.2s",  dur: "2.8s" },
  { left: "18%", color: "#4A9B7F", size: 6,  delay: "0.5s",  dur: "3.2s" },
  { left: "25%", color: "#8B5CF6", size: 9,  delay: "0.1s",  dur: "2.6s" },
  { left: "32%", color: "#EC4899", size: 7,  delay: "0.7s",  dur: "3.4s" },
  { left: "40%", color: "#F59E0B", size: 11, delay: "0.3s",  dur: "2.9s" },
  { left: "48%", color: "#3B82C4", size: 8,  delay: "0.9s",  dur: "3.1s" },
  { left: "55%", color: "#4A9B7F", size: 6,  delay: "0.4s",  dur: "2.7s" },
  { left: "62%", color: "#EC4899", size: 10, delay: "0.6s",  dur: "3.5s" },
  { left: "70%", color: "#8B5CF6", size: 7,  delay: "0.2s",  dur: "2.8s" },
  { left: "78%", color: "#F59E0B", size: 9,  delay: "0.8s",  dur: "3.2s" },
  { left: "85%", color: "#3B82C4", size: 6,  delay: "0.1s",  dur: "3.0s" },
  { left: "92%", color: "#4A9B7F", size: 11, delay: "0.5s",  dur: "2.6s" },
  { left: "15%", color: "#EC4899", size: 7,  delay: "1.1s",  dur: "3.3s" },
  { left: "35%", color: "#8B5CF6", size: 8,  delay: "1.3s",  dur: "2.9s" },
  { left: "58%", color: "#F59E0B", size: 6,  delay: "1.0s",  dur: "3.6s" },
  { left: "75%", color: "#3B82C4", size: 10, delay: "1.2s",  dur: "2.7s" },
  { left: "88%", color: "#4A9B7F", size: 7,  delay: "0.4s",  dur: "3.1s" },
  { left: "22%", color: "#F59E0B", size: 9,  delay: "1.5s",  dur: "2.8s" },
  { left: "45%", color: "#8B5CF6", size: 8,  delay: "0.7s",  dur: "3.4s" },
];

// ─── Count-up hook ────────────────────────────────────────────
// Animates from 0 → target over `duration` ms (ease-out cubic).
// Returns null until `target` is known.
function useCountUp(target: number | null, duration = 1400): number | null {
  const [display, setDisplay] = useState<number | null>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    if (target === null) return;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed  = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplay(Math.round(target * eased));
      if (progress < 1) frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);

  return display;
}

// ─── Circular score ring ──────────────────────────────────────
function ScoreRing({
  score,
  color,
  done,
}: {
  score: number;
  color: string;
  done:  boolean;
}) {
  const r            = 52;
  const circumference = 2 * Math.PI * r;
  const offset       = circumference - (score / 100) * circumference;

  return (
    <div className={`relative w-36 h-36 mx-auto${done ? " score-done" : ""}`}>
      <svg className="w-full h-full" viewBox="0 0 128 128" style={{ transform: "rotate(-90deg)" }}>
        {/* Track */}
        <circle cx="64" cy="64" r={r} fill="none" stroke="#1E2D3D" strokeWidth="11" />
        {/* Arc */}
        <circle
          cx="64" cy="64" r={r}
          fill="none"
          stroke={color}
          strokeWidth="11"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(0.34,1.1,0.64,1)" }}
        />
      </svg>
      {/* Centre label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={`font-nunito font-extrabold leading-none${done ? " ring-pop" : ""}`}
          style={{ fontSize: 32, color }}
        >
          {score}%
        </span>
        <span className="text-[10px] font-bold text-[#7A9CC4] uppercase tracking-wider mt-1">
          Overall
        </span>
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────
export default function CompletionScreen({ moduleId, moduleTitle, moduleIcon }: CompletionScreenProps) {
  const router = useRouter();
  const [result,    setResult]    = useState<CompletionData | null>(null);
  const [barsReady, setBarsReady] = useState(false);

  // Fetch diagnostic for cluster breakdown
  useEffect(() => {
    fetch(`/api/student/modules/${moduleId}/diagnostic`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setResult({
            overallScore:      d.report.overallScore,
            needsIntervention: d.report.needsIntervention,
            clusters:          d.report.clusters,
          });
        }
      })
      .catch(() => {
        fetch(`/api/student/modules/${moduleId}/completion`, { credentials: "include" })
          .then((r) => r.json())
          .then((d) => {
            if (d.success) {
              setResult({ overallScore: d.overallScore, needsIntervention: d.needsIntervention, clusters: [] });
            }
          })
          .catch(() => {});
      });
  }, [moduleId]);

  // Let the DOM render with bars at 0 width first, then animate
  useEffect(() => {
    if (!result) return;
    const t = setTimeout(() => setBarsReady(true), 80);
    return () => clearTimeout(t);
  }, [result]);

  const target      = result?.overallScore != null ? Math.round(result.overallScore) : null;
  const displayScore = useCountUp(target);
  const scoreDone   = displayScore !== null && displayScore === target;

  const scoreColor =
    target == null ? "#7A9CC4" :
    target >= 80   ? "#4A9B7F" :
    target >= 60   ? "#F59E0B" : "#E05C5C";

  return (
    <>
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(-20px) rotate(0deg);   opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes popIn {
          0%   { transform: scale(0.4); opacity: 0; }
          70%  { transform: scale(1.1); }
          100% { transform: scale(1);   opacity: 1; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ringPop {
          0%   { transform: scale(1); }
          35%  { transform: scale(1.18); }
          65%  { transform: scale(0.94); }
          100% { transform: scale(1); }
        }
        @keyframes shimmer {
          0%   { opacity: 0.5; }
          50%  { opacity: 1;   }
          100% { opacity: 0.5; }
        }
        .pop-in    { animation: popIn  0.6s cubic-bezier(.34,1.56,.64,1) both; }
        .fade-up   { animation: fadeUp 0.5s ease both; }
        .ring-pop  { animation: ringPop 0.5s cubic-bezier(.34,1.56,.64,1) both; }
        .shimmer   { animation: shimmer 1.4s ease-in-out infinite; }
        .font-nunito { font-family: var(--font-nunito,'Nunito',sans-serif); }
        .font-cinzel { font-family: var(--font-cinzel,'Cinzel',serif); }
      `}</style>

      {/* Confetti layer */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
        {CONFETTI.map((p, i) => (
          <div
            key={i}
            style={{
              position:     "absolute",
              left:         p.left,
              top:          "-16px",
              width:        p.size,
              height:       p.size,
              background:   p.color,
              borderRadius: i % 3 === 0 ? "50%" : "2px",
              animation:    `confettiFall ${p.dur} ${p.delay} ease-in infinite`,
              opacity:      0.85,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="min-h-screen bg-[#0B1628] flex items-center justify-center p-6" style={{ position: "relative", zIndex: 1 }}>
        <div className="w-full max-w-md">

          {/* Trophy + title */}
          <div className="text-center mb-6">
            <div className="text-7xl mb-3 pop-in">🏆</div>
            <h1
              className="font-cinzel text-3xl font-bold text-white mb-1 fade-up"
              style={{ animationDelay: "0.2s" }}
            >
              Quest Complete!
            </h1>
            <p
              className="text-[#7A9CC4] text-sm fade-up"
              style={{ animationDelay: "0.35s" }}
            >
              {moduleIcon} {moduleTitle}
            </p>
          </div>

          {/* Score card */}
          <div
            className="bg-[#0F1E2E] border border-[#1E3A5F] rounded-2xl p-5 mb-4 fade-up"
            style={{ animationDelay: "0.45s" }}
          >
            {/* ── Circular score ring ── */}
            <div className="mb-5">
              {displayScore !== null ? (
                <ScoreRing score={displayScore} color={scoreColor} done={scoreDone} />
              ) : (
                /* Loading placeholder — pulse ring */
                <div className="relative w-36 h-36 mx-auto">
                  <svg className="w-full h-full" viewBox="0 0 128 128" style={{ transform: "rotate(-90deg)" }}>
                    <circle cx="64" cy="64" r={52} fill="none" stroke="#1E2D3D" strokeWidth="11" />
                    <circle cx="64" cy="64" r={52} fill="none" stroke="#243558" strokeWidth="11"
                      strokeDasharray={`${2 * Math.PI * 52 * 0.25} ${2 * Math.PI * 52 * 0.75}`}
                      className="shimmer"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-nunito text-[#3B82C4] text-sm font-bold shimmer">Calculating…</span>
                  </div>
                </div>
              )}
            </div>

            {/* ── Cluster bars ── */}
            {result && result.clusters.length > 0 ? (
              <div className="flex flex-col gap-3">
                {result.clusters.map((c, idx) => {
                  const meta  = PHASE_META[c.phase];
                  const badge = c.level ? LEVEL_BADGE[c.level] : null;
                  const pct   = c.score != null ? Math.round(c.score) : null;
                  return (
                    <div key={c.phase}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-nunito font-bold text-[#94A3B8]">{meta?.label}</span>
                        <div className="flex items-center gap-2">
                          {badge && (
                            <span
                              className="text-[10px] font-bold px-2 py-0.5 rounded-full fade-up"
                              style={{
                                background:     `${badge.color}22`,
                                color:          badge.color,
                                animationDelay: `${0.8 + idx * 0.12}s`,
                              }}
                            >
                              {badge.label}
                            </span>
                          )}
                          <span
                            className="text-xs font-extrabold font-nunito fade-up"
                            style={{
                              color:          meta?.color ?? "#7A9CC4",
                              animationDelay: `${0.8 + idx * 0.12}s`,
                            }}
                          >
                            {pct != null ? `${pct}%` : "—"}
                          </span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-[#1E2D3D] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width:      barsReady ? `${Math.min(pct ?? 0, 100)}%` : "0%",
                            background: meta?.color ?? "#3B82C4",
                            transition: `width 0.8s cubic-bezier(0.34,1.1,0.64,1) ${0.3 + idx * 0.14}s`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : result ? (
              /* Result loaded but no clusters — show static coloured bars */
              <div className="flex gap-2 justify-center">
                {(["#3B82C4","#8B5CF6","#F59E0B","#4A9B7F"] as const).map((c, i) => (
                  <div key={i} className="h-1.5 flex-1 rounded-full bg-[#1E2D3D] overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width:      barsReady ? "75%" : "0%",
                        background: c,
                        transition: `width 0.8s cubic-bezier(0.34,1.1,0.64,1) ${0.3 + i * 0.12}s`,
                      }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              /* Still fetching */
              <div className="flex gap-2 justify-center">
                {["#3B82C4","#8B5CF6","#F59E0B","#4A9B7F"].map((c, i) => (
                  <div key={i} className="h-1.5 flex-1 rounded-full bg-[#1E2D3D] overflow-hidden">
                    <div className="h-full rounded-full shimmer" style={{ width: "60%", background: c }} />
                  </div>
                ))}
              </div>
            )}

            {/* Intervention note */}
            {result?.needsIntervention && (
              <div className="mt-4 p-3 rounded-xl bg-[#2A1515] border border-[#E05C5C]/40 text-xs text-[#E05C5C] font-nunito">
                Your teacher has been notified to provide additional support in some areas.
              </div>
            )}
          </div>

          {/* Buttons */}
          <div
            className="flex flex-col gap-3 fade-up"
            style={{ animationDelay: "0.6s" }}
          >
            <button
              onClick={() => router.push(`/dashboard/student/report/${moduleId}`)}
              className="w-full py-4 rounded-2xl font-nunito font-extrabold text-sm text-white transition-all hover:-translate-y-0.5"
              style={{ background: "linear-gradient(135deg,#4A9B7F,#2E7A60)", boxShadow: "0 4px 20px rgba(74,155,127,0.35)" }}
            >
              📊 View Full Diagnostic Report
            </button>
            <button
              onClick={() => router.push("/dashboard/student/modules")}
              className="w-full py-3.5 rounded-2xl font-nunito font-bold text-sm border border-[#243558] text-[#7A9CC4] hover:border-[#3B82C4] hover:text-[#3B82C4] transition-all"
            >
              ↩ Back to My Modules
            </button>
          </div>

        </div>
      </div>
    </>
  );
}
