"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { ClassReportsData, SectionData, StudentRow } from "../page";
import TeacherSidebar from "../../_components/TeacherSidebar";
import DiagnosticHeatmap from "./DiagnosticHeatmap";

// ─── Constants ────────────────────────────────────────────────
const CLUSTER_COLORS = {
  understanding: "#3B82C4",
  analysis:      "#8B5CF6",
  solution:      "#F59E0B",
  reflection:    "#4A9B7F",
};

const AVATAR_COLORS = [
  "bg-[#DBEAFE] dark:bg-[#1e3a5f] text-[#3B82C4]",
  "bg-[#D1FAE5] dark:bg-[#063c28] text-[#4A9B7F]",
  "bg-[#EDE9FE] dark:bg-[#2e1065] text-[#8B5CF6]",
  "bg-[#FEF3C7] dark:bg-[#3d2800] text-[#F59E0B]",
];

// ─── Helpers ─────────────────────────────────────────────────
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

function avg(vals: (number | null)[]): number | null {
  const nums = vals.filter((v): v is number => v != null);
  if (!nums.length) return null;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

// ─── Stat Card ────────────────────────────────────────────────
function StatCard({ icon, value, label, color }: {
  icon: string; value: string; label: string;
  color: "blue" | "green" | "amber" | "red";
}) {
  const bar = { blue: "#3B82C4", green: "#4A9B7F", amber: "#F59E0B", red: "#E05C5C" }[color];
  const bg  = { blue: "bg-[#DBEAFE] dark:bg-[#1e3a5f]", green: "bg-[#D1FAE5] dark:bg-[#063c28]", amber: "bg-[#FEF3C7] dark:bg-[#3d2800]", red: "bg-[#FEE2E2] dark:bg-[#450a0a]" }[color];
  return (
    <div className="relative bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl p-5 shadow-sm overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: bar }} />
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3", bg)}>{icon}</div>
      <div className="font-nunito text-3xl font-extrabold mb-0.5">{value}</div>
      <div className="text-xs text-[#64748B] dark:text-[#94A3B8]">{label}</div>
    </div>
  );
}

// ─── Student Card ─────────────────────────────────────────────
function StudentCard({ student, modules, idx, onView }: {
  student: StudentRow;
  modules: { id: number; title: string; icon: string }[];
  idx: number;
  onView: () => void;
}) {
  const diff = diffLabel(student.difficulty);
  const completedModules = student.reports.filter((r) => r.status === "COMPLETED");
  const needsHelp = student.reports.some((r) => r.needsIntervention);
  const overallAvg = avg(student.reports.map((r) => r.overallScore));

  return (
    <div
      className={cn(
        "bg-white dark:bg-[#1E293B] border rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer",
        needsHelp
          ? "border-red-200 dark:border-red-900/50"
          : "border-[#E2E8F0] dark:border-[#334155]"
      )}
      onClick={onView}
    >
      {/* Student header */}
      <div className="flex items-center gap-3 mb-4">
        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-sm font-extrabold font-nunito shrink-0", AVATAR_COLORS[idx % 4])}>
          {student.initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-nunito font-extrabold truncate">{student.name}</p>
          <p className={cn("text-[11px] font-semibold", diff.cls)}>{diff.label} Mode</p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {overallAvg != null ? (
            <span className="font-nunito font-black text-lg" style={{ color: overallColor(overallAvg) }}>
              {overallAvg}%
            </span>
          ) : (
            <span className="text-sm text-[#94A3B8] font-semibold">—</span>
          )}
          <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8]">
            {completedModules.length}/{modules.length} done
          </span>
        </div>
      </div>

      {/* Intervention warning */}
      {needsHelp && (
        <div className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl mb-3">
          <span className="text-red-500 text-sm shrink-0">⚠️</span>
          <p className="text-xs text-red-600 dark:text-red-400 font-semibold">Needs intervention</p>
        </div>
      )}

      {/* Cluster bars (average across modules) */}
      <div className="flex flex-col gap-1.5 mb-4">
        {(["understanding", "analysis", "solution", "reflection"] as const).map((c) => {
          const val = avg(student.reports.map((r) => r[c]));
          const color = CLUSTER_COLORS[c];
          return (
            <div key={c} className="flex items-center gap-2">
              <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8] w-20 capitalize shrink-0">{c}</span>
              <div className="flex-1 h-1.5 bg-[#F1F5F9] dark:bg-[#334155] rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: val != null ? `${val}%` : "0%", background: color }} />
              </div>
              <span className="text-[10px] font-bold w-8 text-right shrink-0" style={{ color: val != null ? color : "#94A3B8" }}>
                {val != null ? `${val}%` : "—"}
              </span>
            </div>
          );
        })}
      </div>

      {/* Module status pills */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {student.reports.map((r) => (
          <span
            key={r.moduleId}
            className={cn(
              "text-[10px] font-bold px-2 py-0.5 rounded-full border",
              r.status === "COMPLETED"   ? "bg-[#D1FAE5] dark:bg-[#063c28] text-[#4A9B7F] border-[#4A9B7F]/30" :
              r.status === "IN_PROGRESS" ? "bg-[#FEF3C7] dark:bg-[#3d2800] text-[#F59E0B] border-[#F59E0B]/30" :
                                           "bg-[#F1F5F9] dark:bg-[#162032] text-[#94A3B8] border-transparent"
            )}
          >
            {r.moduleIcon} {r.status === "COMPLETED" ? "Done" : r.status === "IN_PROGRESS" ? "In Progress" : "Not Started"}
          </span>
        ))}
      </div>

      <button
        className="w-full py-2 rounded-xl text-xs font-bold border border-[#E2E8F0] dark:border-[#334155] text-[#64748B] dark:text-[#94A3B8] hover:border-[#4A9B7F] hover:text-[#4A9B7F] transition-all"
        onClick={(e) => { e.stopPropagation(); onView(); }}
      >
        View Full Report →
      </button>
    </div>
  );
}

// ─── Main Client ─────────────────────────────────────────────
export default function ClassReportsClient({ data }: { data: ClassReportsData }) {
  const router = useRouter();

  const [activeSectionIdx, setActiveSectionIdx] = useState(0);
  const activeSection: SectionData | undefined   = data.sections[activeSectionIdx];

  if (!activeSection) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] dark:bg-[#0F172A] flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">📋</div>
          <h2 className="font-nunito font-extrabold text-xl mb-2">No sections assigned</h2>
          <p className="text-[#64748B] dark:text-[#94A3B8] text-sm">You have no active sections yet.</p>
        </div>
      </div>
    );
  }

  // Per-section stats
  const totalStudents = activeSection.students.length;
  const completedAny  = activeSection.students.filter((s) => s.reports.some((r) => r.status === "COMPLETED")).length;
  const allOveralls   = activeSection.students.flatMap((s) => s.reports.map((r) => r.overallScore)).filter((v): v is number => v != null);
  const classAvg      = allOveralls.length ? Math.round(allOveralls.reduce((a, b) => a + b, 0) / allOveralls.length) : null;
  const interventionCount = activeSection.students.filter((s) => s.reports.some((r) => r.needsIntervention)).length;

  return (
    <>
      <style>{`
        .font-nunito { font-family: var(--font-nunito, 'Nunito', sans-serif); }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fade-up 0.35s ease both; }
      `}</style>

      <div className="flex min-h-screen bg-[#F5F7FA] dark:bg-[#0F172A] text-[#1E293B] dark:text-[#F1F5F9]">

        <TeacherSidebar
          teacherName={data.teacher.name}
          teacherInitials={data.teacher.initials}
          teacherSection={data.teacher.section}
          totalStudents={data.totalStudents}
          pendingGradeCount={data.pendingGradeCount}
          activePath="reports"
        />

        <div className="flex-1 overflow-x-hidden pt-14 md:pt-0">

        {/* Header */}
        <div className="sticky top-0 z-30 bg-white dark:bg-[#1E293B] border-b border-[#E2E8F0] dark:border-[#334155] shadow-sm">
          <div className="px-6 py-4 flex items-center gap-4">
            <div className="flex-1">
              <h1 className="font-nunito font-extrabold text-lg leading-tight">Class Reports</h1>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                Diagnostic overview for all students · {data.teacher.name}
              </p>
            </div>
          </div>

          {/* Section tabs */}
          {data.sections.length > 1 && (
            <div className="px-6 pb-3 flex gap-2 overflow-x-auto">
              {data.sections.map((sec, i) => (
                <button
                  key={sec.sectionId}
                  onClick={() => setActiveSectionIdx(i)}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold border transition-all whitespace-nowrap",
                    i === activeSectionIdx
                      ? "bg-[#D1FAE5] dark:bg-[#063c28] border-[#4A9B7F] text-[#4A9B7F]"
                      : "border-[#E2E8F0] dark:border-[#334155] text-[#64748B] hover:border-[#4A9B7F]"
                  )}
                >
                  {sec.sectionEmoji} {sec.sectionName}
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-current/10">
                    {sec.students.length}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-8 space-y-8">

          {/* Section info banner */}
          <div className="fade-up flex items-center gap-3 px-5 py-3.5 bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl shadow-sm">
            <span className="text-2xl">{activeSection.sectionEmoji}</span>
            <div>
              <p className="font-nunito font-extrabold">{activeSection.sectionName} — {activeSection.gradeLevel}</p>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                {activeSection.assignedModules.length} module{activeSection.assignedModules.length !== 1 ? "s" : ""} assigned ·{" "}
                {activeSection.assignedModules.map((m) => `${m.icon} ${m.title}`).join(", ")}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 fade-up">
            <StatCard icon="👥" value={String(totalStudents)} label="Total Students"         color="blue"  />
            <StatCard icon="✅" value={String(completedAny)}  label="Completed a Module"    color="green" />
            <StatCard icon="📈" value={classAvg != null ? `${classAvg}%` : "—"} label="Class Avg Score" color="amber" />
            <StatCard icon="⚠️" value={String(interventionCount)} label="Need Intervention" color="red"   />
          </div>

          {activeSection.students.length === 0 ? (
            <div className="fade-up flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-[#1E293B] rounded-2xl border border-[#E2E8F0] dark:border-[#334155]">
              <div className="text-5xl mb-4 opacity-40">👥</div>
              <h2 className="font-nunito font-extrabold text-xl mb-2">No students yet</h2>
              <p className="text-[#64748B] dark:text-[#94A3B8] text-sm">
                Students will appear here once they are enrolled in this section.
              </p>
            </div>
          ) : (
            <>
              {/* Heatmap */}
              <div className="fade-up bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="font-nunito font-extrabold text-[15px]">🗺️ Diagnostic Heatmap</h2>
                    <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                      Average cluster scores per student across all assigned modules
                    </p>
                  </div>
                  <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-[#DBEAFE] dark:bg-[#1e3a5f] text-[#3B82C4]">
                    {activeSection.students.length} students
                  </span>
                </div>
                <DiagnosticHeatmap
                  students={activeSection.students}
                  modules={activeSection.assignedModules}
                  onStudentClick={(id) => router.push(`/dashboard/teacher/reports/${id}`)}
                />
              </div>

              {/* Student cards grid */}
              <div className="fade-up">
                <h2 className="font-nunito font-extrabold text-[15px] mb-4">
                  📋 Individual Student Reports
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {activeSection.students.map((student, idx) => (
                    <StudentCard
                      key={student.userId}
                      student={student}
                      modules={activeSection.assignedModules}
                      idx={idx}
                      onView={() => router.push(`/dashboard/teacher/reports/${student.userId}`)}
                    />
                  ))}
                </div>
              </div>

              {/* Cluster averages summary */}
              <div className="fade-up bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl p-6 shadow-sm">
                <h2 className="font-nunito font-extrabold text-[15px] mb-5">📊 Class Cluster Averages</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {(["understanding", "analysis", "solution", "reflection"] as const).map((c) => {
                    const vals = activeSection.students.flatMap((s) =>
                      s.reports.map((r) => r[c]).filter((v): v is number => v != null)
                    );
                    const clsAvg = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
                    const color  = CLUSTER_COLORS[c];
                    const label  = c.charAt(0).toUpperCase() + c.slice(1);

                    return (
                      <div key={c} className="flex flex-col gap-3 p-4 rounded-2xl border border-[#E2E8F0] dark:border-[#334155]">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">{label}</span>
                          <span className="font-nunito font-black text-xl" style={{ color }}>
                            {clsAvg != null ? `${clsAvg}%` : "—"}
                          </span>
                        </div>
                        <div className="h-2 bg-[#F1F5F9] dark:bg-[#334155] rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: clsAvg != null ? `${clsAvg}%` : "0%", background: color }} />
                        </div>
                        <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                          {vals.length} student{vals.length !== 1 ? "s" : ""} with data
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
        </div>
      </div>
    </>
  );
}
