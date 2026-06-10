// app/dashboard/teacher/_components/TeacherDashboard.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import TeacherSidebar from "./TeacherSidebar";
import type { DashboardData, DashboardStudent, SectionDashboardData } from "../page";

/* ─── STAT CARD ─── */
function StatCard({
  icon, value, label, delta, deltaUp, color,
}: {
  icon: string; value: string; label: string;
  delta?: string; deltaUp?: boolean;
  color: "blue" | "purple" | "amber" | "green";
}) {
  const bars  = { blue: "#3B82C4", purple: "#8B5CF6", amber: "#F59E0B", green: "#4A9B7F" };
  const icons = {
    blue:   "bg-[#DBEAFE] dark:bg-[#1e3a5f]",
    purple: "bg-[#EDE9FE] dark:bg-[#2e1065]",
    amber:  "bg-[#FEF3C7] dark:bg-[#3d2800]",
    green:  "bg-[#D1FAE5] dark:bg-[#063c28]",
  };
  return (
    <div className="relative bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl p-5 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-0.75" style={{ background: bars[color] }} />
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-lg mb-3", icons[color])}>
        {icon}
      </div>
      <div className="font-nunito text-3xl font-extrabold mb-0.5">{value}</div>
      <div className="text-xs text-[#64748B] dark:text-[#94A3B8]">{label}</div>
      {delta && (
        <div className={cn("text-[11px] font-semibold mt-2", deltaUp ? "text-[#22C55E]" : "text-[#E05C5C]")}>
          {delta}
        </div>
      )}
    </div>
  );
}

/* ─── HEAT CELL ─── */
function HeatCell({ value }: { value: number }) {
  const cls =
    value >= 80 ? "bg-[#D1FAE5] dark:bg-[#063c28] text-[#4A9B7F]" :
    value >= 60 ? "bg-[#FEF3C7] dark:bg-[#3d2800] text-[#F59E0B]" :
    value >= 0  ? "bg-[#FEE2E2] dark:bg-[#450a0a] text-[#E05C5C]" :
                  "bg-[#EEF2F8] dark:bg-[#162032] text-[#64748B]";
  return (
    <span className={cn("inline-flex items-center justify-center w-7 h-7 rounded-lg text-[10px] font-bold", cls)}>
      {value >= 0 ? value : "—"}
    </span>
  );
}

const AV_COLORS = {
  blue:  "bg-[#DBEAFE] dark:bg-[#1e3a5f] text-[#3B82C4]",
  green: "bg-[#D1FAE5] dark:bg-[#063c28] text-[#4A9B7F]",
  amber: "bg-[#FEF3C7] dark:bg-[#3d2800] text-[#F59E0B]",
};

/* ─── BAR GROUP ─── */
function BarGroup({ pre, post, color }: { pre: number; post: number; color: string }) {
  const scale = (v: number) => Math.max(4, Math.round((v / 100) * 110));
  return (
    <div className="flex flex-col items-center gap-0">
      <div className="flex items-end gap-1">
        <div className="flex flex-col items-center gap-1">
          <span className="text-[11px] font-bold" style={{ color }}>{pre}%</span>
          <div className="w-7 rounded-t-md" style={{ height: scale(pre), background: color, opacity: 0.45 }} />
          <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8]">Pre</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-[11px] font-bold" style={{ color }}>{post}%</span>
          <div className="w-7 rounded-t-md" style={{ height: scale(post), background: color }} />
          <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8]">Post</span>
        </div>
      </div>
    </div>
  );
}

/* ─── REFLECTION CARD ─── */
function ReflectionCard({ text, who }: { text: string; who: string }) {
  return (
    <div className="border-l-4 border-[#4A9B7F] pl-4 py-3.5 pr-4 bg-[#D1FAE5] dark:bg-[#063c28] rounded-r-xl">
      <p className="text-[13px] leading-relaxed text-[#1E293B] dark:text-[#F1F5F9]">{text}</p>
      <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] font-semibold mt-1.5">{who}</p>
    </div>
  );
}

/* ─── SECTION PANEL ─── */
function SectionPanel({
  sec,
  pendingGradeCount,
  router,
}: {
  sec: SectionDashboardData;
  pendingGradeCount: number;
  router: ReturnType<typeof useRouter>;
}) {
  const { stats, students, preAvg, postAvg, reflections, interventionCount } = sec;
  const gain      = postAvg.understanding - preAvg.understanding;
  const gainLabel = gain >= 0 ? `+${gain}% avg gain` : `${gain}% avg change`;

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon="👥"
          value={String(stats.totalStudents)}
          label="Total Students"
          delta={`${sec.name} Section`}
          color="blue"
        />
        <StatCard
          icon="✅"
          value={String(stats.completedModule)}
          label="Completed Module"
          delta={`↑ ${stats.totalStudents > 0 ? Math.round((stats.completedModule / stats.totalStudents) * 100) : 0}% completion rate`}
          deltaUp
          color="green"
        />
        <StatCard
          icon="📈"
          value={`${stats.classAvgScore}%`}
          label="Class Avg Score"
          delta={preAvg.understanding > 0 ? `↑ from ${preAvg.understanding}% pre-test` : "No pre-test data yet"}
          deltaUp={preAvg.understanding > 0}
          color="purple"
        />
        <StatCard
          icon="⚠️"
          value={String(stats.needIntervention)}
          label="Need Intervention"
          delta={stats.needIntervention > 0 ? "Struggling in Analysis" : "All students on track"}
          deltaUp={stats.needIntervention === 0}
          color="amber"
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4 mb-4">

        {/* Heatmap */}
        <div className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl p-6 shadow-sm">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h3 className="font-nunito text-[15px] font-extrabold">🗺️ Class Diagnostic Heatmap</h3>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">Stage cluster scores per student</p>
            </div>
            <Badge className="bg-[#DBEAFE] dark:bg-[#1e3a5f] text-[#3B82C4] border-0 text-xs font-bold">Live</Badge>
          </div>

          {students.length === 0 ? (
            <p className="text-sm text-[#64748B] dark:text-[#94A3B8] py-6 text-center">
              No students have started a module yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {["Student", "Understanding S1–3", "Analysis S4–7", "Solution S8–10", "Reflect S11–12", "Total"].map((h) => (
                      <th
                        key={h}
                        className="text-left text-[11px] font-bold tracking-[0.06em] uppercase text-[#64748B] dark:text-[#94A3B8] pb-2.5 px-3 border-b border-[#E2E8F0] dark:border-[#334155] whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {students.map((s: DashboardStudent) => (
                    <tr
                      key={s.name}
                      className="hover:bg-[#EEF2F8] dark:hover:bg-[#162032] transition-colors cursor-pointer"
                      onClick={() => router.push(`/dashboard/teacher/students?name=${encodeURIComponent(s.name)}`)}
                    >
                      <td className="py-3 px-3 border-b border-[#E2E8F0] dark:border-[#334155]">
                        <div className="flex items-center gap-2">
                          <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-extrabold font-nunito shrink-0", AV_COLORS[s.color])}>
                            {s.initials}
                          </div>
                          <span className="text-sm font-medium">{s.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 border-b border-[#E2E8F0] dark:border-[#334155]"><HeatCell value={s.understanding} /></td>
                      <td className="py-3 px-3 border-b border-[#E2E8F0] dark:border-[#334155]"><HeatCell value={s.analysis} /></td>
                      <td className="py-3 px-3 border-b border-[#E2E8F0] dark:border-[#334155]"><HeatCell value={s.solution} /></td>
                      <td className="py-3 px-3 border-b border-[#E2E8F0] dark:border-[#334155]"><HeatCell value={s.reflect} /></td>
                      <td className={cn("py-3 px-3 border-b border-[#E2E8F0] dark:border-[#334155] text-sm font-bold", s.totalColor)}>
                        {s.total}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex gap-4 mt-4 flex-wrap">
            {([
              ["bg-[#D1FAE5] dark:bg-[#063c28] text-[#4A9B7F]", "Proficient (80+)"],
              ["bg-[#FEF3C7] dark:bg-[#3d2800] text-[#F59E0B]", "Developing (60–79)"],
              ["bg-[#FEE2E2] dark:bg-[#450a0a] text-[#E05C5C]", "Struggling (<60)"],
            ] as [string, string][]).map(([cls, lbl]) => (
              <span key={lbl} className="flex items-center gap-1.5 text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                <span className={cn("w-4 h-4 rounded", cls)} />
                {lbl}
              </span>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">

          {/* Pre vs Post */}
          <div className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-nunito text-[15px] font-extrabold">📈 Pre vs Post Test</h3>
              <Badge className="bg-[#D1FAE5] dark:bg-[#063c28] text-[#4A9B7F] border-0 text-xs font-bold">
                {gainLabel}
              </Badge>
            </div>

            {preAvg.understanding === 0 && postAvg.understanding === 0 ? (
              <p className="text-sm text-[#64748B] dark:text-[#94A3B8] py-4 text-center">
                No test data available yet.
              </p>
            ) : (
              <>
                <div className="flex items-end gap-3 h-32.5 pt-2">
                  <BarGroup pre={preAvg.understanding} post={postAvg.understanding} color="#3B82C4" />
                  <div className="w-px bg-[#E2E8F0] dark:bg-[#334155] self-stretch mx-1" />
                  <BarGroup pre={preAvg.analysis}      post={postAvg.analysis}      color="#8B5CF6" />
                  <div className="w-px bg-[#E2E8F0] dark:bg-[#334155] self-stretch mx-1" />
                  <BarGroup pre={preAvg.solution}      post={postAvg.solution}      color="#F59E0B" />
                </div>
                <div className="flex gap-4 mt-3 text-[11px] text-[#64748B] dark:text-[#94A3B8] flex-wrap">
                  <span>🔵 Understanding</span>
                  <span>🟣 Analysis</span>
                  <span>🟠 Solution</span>
                </div>
              </>
            )}
          </div>

          {/* Intervention */}
          <div className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-nunito text-[15px] font-extrabold">⚠️ Needs Intervention</h3>
              <Badge className="bg-[#FEE2E2] dark:bg-[#450a0a] text-[#E05C5C] border-0 text-xs font-bold">
                {interventionCount} student{interventionCount !== 1 ? "s" : ""}
              </Badge>
            </div>

            {interventionCount === 0 ? (
              <div className="px-3.5 py-3 bg-[#D1FAE5] dark:bg-[#063c28] rounded-xl text-sm text-[#4A9B7F] font-semibold">
                ✅ No students currently flagged for intervention. Great work!
              </div>
            ) : (
              (() => {
                // Find weakest cluster across flagged students
                const flagged = students.filter(
                  (s) => (s.understanding >= 0 && s.understanding < 60) ||
                          (s.analysis >= 0 && s.analysis < 60) ||
                          (s.solution >= 0 && s.solution < 60) ||
                          (s.reflect >= 0 && s.reflect < 60)
                );
                const clusterScores = {
                  understanding: flagged.filter((s) => s.understanding >= 0).map((s) => s.understanding),
                  analysis:      flagged.filter((s) => s.analysis >= 0).map((s) => s.analysis),
                  solution:      flagged.filter((s) => s.solution >= 0).map((s) => s.solution),
                  reflect:       flagged.filter((s) => s.reflect >= 0).map((s) => s.reflect),
                };
                const clusterAvgs = {
                  understanding: clusterScores.understanding.length ? Math.round(clusterScores.understanding.reduce((a,b)=>a+b,0)/clusterScores.understanding.length) : 100,
                  analysis:      clusterScores.analysis.length      ? Math.round(clusterScores.analysis.reduce((a,b)=>a+b,0)/clusterScores.analysis.length)           : 100,
                  solution:      clusterScores.solution.length      ? Math.round(clusterScores.solution.reduce((a,b)=>a+b,0)/clusterScores.solution.length)           : 100,
                  reflect:       clusterScores.reflect.length       ? Math.round(clusterScores.reflect.reduce((a,b)=>a+b,0)/clusterScores.reflect.length)             : 100,
                };
                const weakest = Object.entries(clusterAvgs).sort((a, b) => a[1] - b[1])[0];
                const clusterInfo: Record<string, { label: string; stages: string; emoji: string }> = {
                  understanding: { label: "Understanding", stages: "Stages 1–3",   emoji: "🔵" },
                  analysis:      { label: "Analysis",      stages: "Stages 4–7",   emoji: "🟣" },
                  solution:      { label: "Solution",      stages: "Stages 8–10",  emoji: "🟠" },
                  reflect:       { label: "Reflection",    stages: "Stages 11–12", emoji: "🟢" },
                };
                const wc = clusterInfo[weakest[0]];
                return (
                  <div className="flex flex-col gap-3">
                    <div className="border-l-4 border-[#E05C5C] pl-4 py-3.5 pr-4 bg-[#FEE2E2] dark:bg-[#450a0a] rounded-r-xl">
                      <p className="text-[13px] leading-relaxed text-[#1E293B] dark:text-[#F1F5F9]">
                        <strong>{interventionCount} student{interventionCount !== 1 ? "s" : ""}</strong> scored below 60% in one or more clusters.
                        Weakest area: <strong>{wc.emoji} {wc.label} ({wc.stages})</strong> with an average of <strong>{weakest[1]}%</strong>.
                      </p>
                      <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] font-semibold mt-1.5">💡 Diagnostic Insight · Based on student data</p>
                    </div>
                    <div className="border-l-4 border-[#4A9B7F] pl-4 py-3.5 pr-4 bg-[#D1FAE5] dark:bg-[#063c28] rounded-r-xl">
                      <p className="text-[13px] leading-relaxed text-[#1E293B] dark:text-[#F1F5F9]">
                        Review responses for flagged students and provide targeted feedback. Use the <strong>Grade Queue</strong> to add notes to their open-ended answers.
                      </p>
                      <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] font-semibold mt-1.5">👩‍🏫 Recommended Action</p>
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        </div>
      </div>

      {/* Reflections */}
      <div className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-nunito text-[15px] font-extrabold">💬 Student Reflections — Stage 12</h3>
          <Badge className={cn(
            "border-0 text-xs font-bold",
            pendingGradeCount > 0
              ? "bg-[#EDE9FE] dark:bg-[#2e1065] text-[#8B5CF6]"
              : "bg-[#D1FAE5] dark:bg-[#063c28] text-[#4A9B7F]"
          )}>
            {pendingGradeCount > 0 ? `Needs Manual Grading · ${pendingGradeCount} pending` : "All caught up ✅"}
          </Badge>
        </div>

        {reflections.length === 0 ? (
          <p className="text-sm text-[#64748B] dark:text-[#94A3B8] py-4 text-center">
            No reflections submitted yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {reflections.map((r, i) => (
              <ReflectionCard key={i} text={r.text} who={r.who} />
            ))}
          </div>
        )}

        <div className="flex gap-2.5 mt-4">
          <Button
            onClick={() => router.push("/dashboard/teacher/grade")}
            className="text-sm font-nunito font-bold bg-[#4A9B7F] hover:bg-[#3a7a63] text-white"
            disabled={pendingGradeCount === 0}
          >
            ✍️ Start Grading
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/teacher/reports")}
            className="text-sm font-nunito font-bold border-[#E2E8F0] dark:border-[#334155]"
          >
            View All Reports
          </Button>
        </div>
      </div>
    </>
  );
}

/* ─── GREETING ─── */
function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

/* ─── MAIN CLIENT COMPONENT ─── */
export default function TeacherDashboard({ data }: { data: DashboardData }) {
  const router = useRouter();
  const { teacher, sections, pendingGradeCount, totalStudents } = data;

  const [activeIdx, setActiveIdx] = useState(0);
  const sec = sections[activeIdx] ?? sections[0];

  const sidebarSection =
    sections.length === 1
      ? sections[0].name
      : sections.length > 1
        ? `${sections.length} Sections`
        : "—";

  const firstName = teacher.name.split(" ")[0];

  const totalCompleted  = sections.reduce((n, s) => n + s.stats.completedModule, 0);
  const totalIntervention = sections.reduce((n, s) => n + s.interventionCount, 0);

  return (
    <>
      <style>{`
        .font-nunito { font-family: var(--font-nunito, 'Nunito', sans-serif); }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up  { animation: fadeUp 0.4s ease forwards; }
        .delay-1  { animation-delay: 0.05s; opacity: 0; }
        .delay-2  { animation-delay: 0.10s; opacity: 0; }
        .delay-3  { animation-delay: 0.15s; opacity: 0; }
        .delay-4  { animation-delay: 0.20s; opacity: 0; }
        .delay-5  { animation-delay: 0.25s; opacity: 0; }
      `}</style>

      <div className="flex min-h-screen bg-[#F5F7FA] dark:bg-[#0F172A] text-[#1E293B] dark:text-[#F1F5F9]">

        <TeacherSidebar
          activePath="dashboard"
          teacherName={teacher.name}
          teacherInitials={teacher.initials}
          teacherSection={sidebarSection}
          totalStudents={totalStudents}
          pendingGradeCount={pendingGradeCount}
        />

        <main className="flex-1 px-8 pb-8 pt-14 md:pt-8 overflow-x-hidden">

          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6 fade-up">
            <div>
              <p className="text-xs font-bold tracking-widest uppercase text-[#4A9B7F] mb-0.5">
                Teacher Dashboard
              </p>
              <h1 className="font-nunito text-[22px] font-extrabold leading-tight">
                {greeting()}, {firstName}! 👋
              </h1>
              <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mt-1">
                {sections.length === 0
                  ? "No sections assigned yet."
                  : sections.length === 1
                  ? `${sections[0].emoji} ${sections[0].name} · ${sections[0].gradeLevel} · ${totalStudents} student${totalStudents !== 1 ? "s" : ""}`
                  : `${sections.length} sections · ${totalStudents} student${totalStudents !== 1 ? "s" : ""} total`}
              </p>
            </div>

            {/* Quick actions */}
            <div className="flex items-center gap-2 flex-wrap">
              {pendingGradeCount > 0 && (
                <button
                  onClick={() => router.push("/dashboard/teacher/grade")}
                  className="relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold border border-[#F59E0B]/50 bg-[#FEF3C7] dark:bg-[#3d2800] text-[#F59E0B] hover:bg-[#FDE68A] dark:hover:bg-[#4d3400] transition-all"
                >
                  ✍️ Grade Queue
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#E05C5C] text-white text-[10px] font-extrabold flex items-center justify-center">
                    {pendingGradeCount > 9 ? "9+" : pendingGradeCount}
                  </span>
                </button>
              )}
              <button
                onClick={() => router.push("/dashboard/teacher/reports")}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold border border-[#E2E8F0] dark:border-[#334155] text-[#64748B] hover:border-[#4A9B7F] hover:text-[#4A9B7F] hover:bg-[#D1FAE5] dark:hover:bg-[#064e35] transition-all"
              >
                📊 Reports
              </button>
              <button
                onClick={() => router.push("/dashboard/teacher/students")}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold border border-[#E2E8F0] dark:border-[#334155] text-[#64748B] hover:border-[#3B82C4] hover:text-[#3B82C4] hover:bg-[#DBEAFE] dark:hover:bg-[#1e3a5f] transition-all"
              >
                👥 Students
              </button>
              <Button
                onClick={() => router.push("/dashboard/teacher/modules")}
                className="text-sm font-nunito font-bold bg-[#4A9B7F] hover:bg-[#3a7a63] text-white shadow-[0_4px_14px_rgba(74,155,127,0.3)]"
              >
                📦 Modules
              </Button>
            </div>
          </div>

          {/* Summary badges row */}
          {sections.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6 fade-up delay-1">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-[#DBEAFE] dark:bg-[#1e3a5f] text-[#3B82C4] border border-[#3B82C4]/20">
                👥 {totalStudents} Student{totalStudents !== 1 ? "s" : ""}
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-[#D1FAE5] dark:bg-[#064e35] text-[#4A9B7F] border border-[#4A9B7F]/20">
                ✅ {totalCompleted} Completed
              </span>
              {pendingGradeCount > 0 && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-[#FEF3C7] dark:bg-[#3d2800] text-[#F59E0B] border border-[#F59E0B]/20">
                  ✍️ {pendingGradeCount} Pending Grade{pendingGradeCount !== 1 ? "s" : ""}
                </span>
              )}
              {totalIntervention > 0 && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-[#FEE2E2] dark:bg-[#450a0a] text-[#E05C5C] border border-[#E05C5C]/20">
                  ⚠️ {totalIntervention} Need{totalIntervention === 1 ? "s" : ""} Intervention
                </span>
              )}
            </div>
          )}

          {/* Section tabs — only shown when teacher has multiple sections */}
          {sections.length > 1 && (
            <div className="flex gap-2 mb-6 overflow-x-auto pb-1 fade-up delay-1">
              {sections.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => setActiveIdx(idx)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all border",
                    activeIdx === idx
                      ? "bg-[#4A9B7F] text-white border-[#4A9B7F] shadow-[0_4px_12px_rgba(74,155,127,0.3)]"
                      : "bg-white dark:bg-[#1E293B] text-[#64748B] dark:text-[#94A3B8] border-[#E2E8F0] dark:border-[#334155] hover:border-[#4A9B7F] hover:text-[#4A9B7F]"
                  )}
                >
                  <span>{s.emoji}</span>
                  <span>{s.name}</span>
                  <span className={cn(
                    "text-[11px] px-1.5 py-0.5 rounded-full font-semibold",
                    activeIdx === idx
                      ? "bg-white/20 text-white"
                      : "bg-[#EEF2F8] dark:bg-[#162032] text-[#64748B] dark:text-[#94A3B8]"
                  )}>
                    {s.stats.totalStudents}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Section label when viewing a single section */}
          {sections.length === 1 && sec && (
            <div className="flex items-center gap-2 mb-5 fade-up delay-1">
              <span className="text-xl">{sec.emoji}</span>
              <span className="font-nunito text-[15px] font-extrabold">{sec.name}</span>
              <span className="text-xs text-[#64748B] dark:text-[#94A3B8]">{sec.gradeLevel}</span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-[#EEF2F8] dark:bg-[#162032] text-[#64748B] font-semibold">
                {sec.stats.totalStudents} students
              </span>
            </div>
          )}

          {sections.length === 0 ? (
            <div className="bg-white dark:bg-[#1E293B] border border-dashed border-[#E2E8F0] dark:border-[#334155] rounded-2xl p-12 text-center">
              <div className="text-5xl mb-4">🏫</div>
              <h3 className="font-nunito font-extrabold text-lg mb-2">No sections assigned yet</h3>
              <p className="text-sm text-[#64748B] dark:text-[#94A3B8] max-w-sm mx-auto">
                Your account hasn&apos;t been linked to a class section. Contact your administrator to get assigned.
              </p>
            </div>
          ) : sec ? (
            <SectionPanel
              key={sec.id}
              sec={sec}
              pendingGradeCount={pendingGradeCount}
              router={router}
            />
          ) : null}

        </main>
      </div>
    </>
  );
}
