// app/dashboard/teacher/tests/_components/TestResultsClient.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from "recharts";
import TeacherSidebar from "../../_components/TeacherSidebar";
import type {
  TestResultsData, TestSectionData, StudentTestRow, TestSetRow,
} from "../page";

// ─── Helpers ──────────────────────────────────────────────────
function scoreColor(pct: number | null) {
  if (pct === null) return "text-[#64748B] dark:text-[#94A3B8]";
  if (pct >= 80) return "text-[#4A9B7F]";
  if (pct >= 60) return "text-[#F59E0B]";
  return "text-[#E05C5C]";
}
function scoreBg(pct: number | null) {
  if (pct === null) return "bg-[#EEF2F8] dark:bg-[#162032]";
  if (pct >= 80) return "bg-[#D1FAE5] dark:bg-[#063c28]";
  if (pct >= 60) return "bg-[#FEF3C7] dark:bg-[#3d2800]";
  return "bg-[#FEE2E2] dark:bg-[#450a0a]";
}
function gainColor(g: number | null) {
  if (g === null) return "text-[#64748B] dark:text-[#94A3B8]";
  if (g > 0) return "text-[#4A9B7F]";
  if (g < 0) return "text-[#E05C5C]";
  return "text-[#64748B] dark:text-[#94A3B8]";
}
function gainLabel(g: number | null) {
  if (g === null) return "—";
  if (g > 0) return `+${g}%`;
  if (g < 0) return `${g}%`;
  return "0%";
}
function fmtTime(secs: number | null) {
  if (!secs) return "Untimed";
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return s ? `${m}m ${s}s` : `${m} min`;
}

function difficultyBadge(d: string) {
  if (d === "CHAMPION")   return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#EDE9FE] dark:bg-[#2e1065] text-[#8B5CF6] font-bold">Champion</span>;
  if (d === "ADVENTURER") return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#DBEAFE] dark:bg-[#1e3a5f] text-[#3B82C4] font-bold">Adventurer</span>;
  return <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#D1FAE5] dark:bg-[#063c28] text-[#4A9B7F] font-bold">Apprentice</span>;
}

// ─── Stat Card ────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color }: {
  icon: string; label: string; value: string; sub?: string;
  color: "blue" | "purple" | "amber" | "green";
}) {
  const bars   = { blue: "#3B82C4", purple: "#8B5CF6", amber: "#F59E0B", green: "#4A9B7F" };
  const iconBg = { blue: "bg-[#DBEAFE] dark:bg-[#1e3a5f]", purple: "bg-[#EDE9FE] dark:bg-[#2e1065]", amber: "bg-[#FEF3C7] dark:bg-[#3d2800]", green: "bg-[#D1FAE5] dark:bg-[#063c28]" };
  return (
    <div className="relative bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl p-5 shadow-sm overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-0.75" style={{ background: bars[color] }} />
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-lg mb-3", iconBg[color])}>{icon}</div>
      <div className="font-nunito text-3xl font-extrabold mb-0.5">{value}</div>
      <div className="text-xs text-[#64748B] dark:text-[#94A3B8]">{label}</div>
      {sub && <div className="text-[11px] font-semibold mt-2 text-[#64748B] dark:text-[#94A3B8]">{sub}</div>}
    </div>
  );
}

// ─── Score Cell ───────────────────────────────────────────────
function ScoreCell({ pct, raw }: { pct: number | null; raw: string | null }) {
  if (pct === null) return (
    <div className="flex flex-col items-center">
      <span className="text-[13px] text-[#94A3B8]">—</span>
      <span className="text-[10px] text-[#94A3B8]">Not taken</span>
    </div>
  );
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className={cn("text-[15px] font-extrabold font-nunito", scoreColor(pct))}>{pct}%</span>
      {raw && <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8]">{raw}</span>}
    </div>
  );
}

// ─── Student Row ──────────────────────────────────────────────
function StudentRow({ student, rank }: { student: StudentTestRow; rank: number }) {
  return (
    <tr className="border-b border-[#E2E8F0] dark:border-[#334155] hover:bg-[#F5F7FA] dark:hover:bg-[#162032] transition-colors">
      {/* # — hidden on mobile */}
      <td className="px-3 py-3 text-center hidden sm:table-cell">
        <span className="text-[12px] font-bold text-[#64748B] dark:text-[#94A3B8]">#{rank}</span>
      </td>
      {/* Student */}
      <td className="px-3 py-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#D1FAE5] dark:bg-[#063c28] flex items-center justify-center text-sm font-extrabold font-nunito text-[#4A9B7F] shrink-0">
            {student.initials}
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold truncate">{student.name}</p>
            <div className="mt-0.5 hidden sm:block">{difficultyBadge(student.difficulty)}</div>
          </div>
        </div>
      </td>
      {/* Pre-test */}
      <td className="px-3 py-3 text-center">
        <ScoreCell pct={student.preScore} raw={student.preRaw} />
        {student.preTakenAt && (
          <p className="text-[10px] text-[#94A3B8] mt-0.5 hidden md:block">{student.preTakenAt}</p>
        )}
      </td>
      {/* Post-test */}
      <td className="px-3 py-3 text-center">
        <ScoreCell pct={student.postScore} raw={student.postRaw} />
        {student.postTakenAt && (
          <p className="text-[10px] text-[#94A3B8] mt-0.5 hidden md:block">{student.postTakenAt}</p>
        )}
      </td>
      {/* Gain */}
      <td className="px-3 py-3 text-center">
        {student.gain !== null ? (
          <span className={cn("inline-block text-[13px] font-extrabold font-nunito px-2 py-1 rounded-lg", scoreBg(student.postScore), gainColor(student.gain))}>
            {gainLabel(student.gain)}
          </span>
        ) : <span className="text-[13px] text-[#94A3B8]">—</span>}
      </td>
      {/* Status — hidden on mobile */}
      <td className="px-3 py-3 text-center hidden sm:table-cell">
        {student.preScore !== null && student.postScore !== null ? (
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#D1FAE5] dark:bg-[#063c28] text-[#4A9B7F] font-bold">Complete</span>
        ) : student.preScore !== null ? (
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#FEF3C7] dark:bg-[#3d2800] text-[#F59E0B] font-bold">Pre only</span>
        ) : student.postScore !== null ? (
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#DBEAFE] dark:bg-[#1e3a5f] text-[#3B82C4] font-bold">Post only</span>
        ) : (
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#EEF2F8] dark:bg-[#162032] text-[#64748B] font-bold">Not taken</span>
        )}
      </td>
    </tr>
  );
}

// ─── Pre vs Post Bar Chart ────────────────────────────────────
function PrePostChart({ students }: { students: StudentTestRow[] }) {
  const chartData = students
    .filter((s) => s.preScore !== null || s.postScore !== null)
    .map((s) => ({
      name:        s.name.split(" ")[0], // first name only to keep axis tidy
      "Pre-test":  s.preScore  ?? null,
      "Post-test": s.postScore ?? null,
    }));

  if (chartData.length === 0) return null;

  return (
    <div className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="font-nunito text-[14px] font-extrabold">Pre vs Post Score — Per Student</h3>
        <p className="text-[12px] text-[#64748B] dark:text-[#94A3B8] mt-0.5">
          Each student's pre-test (blue) and post-test (green) scores side by side.
          Dashed line = 75% target.
        </p>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={chartData}
          margin={{ top: 8, right: 8, left: -16, bottom: 4 }}
          barCategoryGap="22%"
          barGap={3}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.12)" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: "#64748B", fontWeight: 600 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fontSize: 11, fill: "#64748B" }}
            axisLine={false}
            tickLine={false}
            ticks={[0, 25, 50, 75, 100]}
          />
          <Tooltip
            cursor={{ fill: "rgba(100,116,139,0.06)" }}
            formatter={(value) =>
              value != null ? [`${value}%`] : ["—"]
            }
            contentStyle={{
              background: "#fff",
              border: "1px solid #E2E8F0",
              borderRadius: 12,
              fontSize: 12,
              fontWeight: 600,
              boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
            }}
            labelStyle={{ fontWeight: 700, fontSize: 12, marginBottom: 4 }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, fontWeight: 700, paddingTop: 8 }}
            iconType="circle"
            iconSize={8}
          />
          <ReferenceLine
            y={75}
            stroke="#F59E0B"
            strokeDasharray="5 3"
            strokeWidth={1.5}
            label={{ value: "75%", position: "right", fontSize: 10, fill: "#F59E0B", fontWeight: 700 }}
          />
          <Bar dataKey="Pre-test"  fill="#3B82C4" radius={[4, 4, 0, 0]} maxBarSize={28} />
          <Bar dataKey="Post-test" fill="#4A9B7F" radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Section Panel ────────────────────────────────────────────
function SectionPanel({ section }: { section: TestSectionData }) {
  const { students, preTakers, postTakers, avgPre, avgPost, avgGain } = section;
  const total  = students.length;
  const sorted = [...students].sort((a, b) => {
    const aC = a.preScore !== null && a.postScore !== null ? 0 : a.preScore !== null ? 1 : 2;
    const bC = b.preScore !== null && b.postScore !== null ? 0 : b.preScore !== null ? 1 : 2;
    if (aC !== bC) return aC - bC;
    return (b.gain ?? -Infinity) - (a.gain ?? -Infinity);
  });

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="📝" label="Took Pre-test" color="blue" value={`${preTakers} / ${total}`} sub={total > 0 ? `${Math.round((preTakers / total) * 100)}% participation` : undefined} />
        <StatCard icon="✅" label="Took Post-test" color="green" value={`${postTakers} / ${total}`} sub={total > 0 ? `${Math.round((postTakers / total) * 100)}% participation` : undefined} />
        <StatCard icon="📊" label="Class Avg Pre" color="purple" value={avgPre !== null ? `${avgPre}%` : "—"} sub={avgPre !== null ? (avgPre >= 75 ? "Above target" : "Below target") : "No data yet"} />
        <StatCard icon="📈" label="Class Avg Gain" color="amber" value={avgGain !== null ? gainLabel(avgGain) : "—"} sub={avgPost !== null ? `Post avg: ${avgPost}%` : "No post-test data"} />
      </div>

      <PrePostChart students={students} />

      {(avgPre !== null || avgPost !== null) && (
        <div className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl p-5 shadow-sm">
          <h3 className="font-nunito text-[14px] font-extrabold mb-4">Class Average Summary</h3>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="text-[12px] font-semibold w-16 text-right text-[#3B82C4]">Pre-test</span>
              <div className="flex-1 h-4 bg-[#EEF2F8] dark:bg-[#162032] rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-[#3B82C4] transition-all duration-700" style={{ width: `${avgPre ?? 0}%` }} />
              </div>
              <span className="text-[13px] font-extrabold font-nunito text-[#3B82C4] w-10">{avgPre !== null ? `${avgPre}%` : "—"}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[12px] font-semibold w-16 text-right text-[#4A9B7F]">Post-test</span>
              <div className="flex-1 h-4 bg-[#EEF2F8] dark:bg-[#162032] rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-[#4A9B7F] transition-all duration-700" style={{ width: `${avgPost ?? 0}%` }} />
              </div>
              <span className="text-[13px] font-extrabold font-nunito text-[#4A9B7F] w-10">{avgPost !== null ? `${avgPost}%` : "—"}</span>
            </div>
          </div>
          {avgGain !== null && (
            <p className={cn("text-[12px] font-bold mt-3", gainColor(avgGain))}>
              {avgGain > 0 ? `↑ Average gain of ${avgGain} points after module completion` :
               avgGain < 0 ? `↓ Average drop of ${Math.abs(avgGain)} points` :
               "No change between pre and post test"}
            </p>
          )}
        </div>
      )}

      <div className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-[#E2E8F0] dark:border-[#334155]">
          <h3 className="font-nunito text-[14px] font-extrabold">Student Results</h3>
          <Badge className="bg-[#DBEAFE] dark:bg-[#1e3a5f] text-[#3B82C4] border-0 text-xs font-bold">
            {students.length} students
          </Badge>
        </div>
        {students.length === 0 ? (
          <p className="text-sm text-[#64748B] dark:text-[#94A3B8] text-center py-10">No students in this section yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#F5F7FA] dark:bg-[#0F172A]">
                  {[
                    { h: "#",         cls: "hidden sm:table-cell" },
                    { h: "Student",   cls: "text-left" },
                    { h: "Pre-test",  cls: "" },
                    { h: "Post-test", cls: "" },
                    { h: "Gain",      cls: "" },
                    { h: "Status",    cls: "hidden sm:table-cell" },
                  ].map(({ h, cls }) => (
                    <th key={h} className={cn("text-center text-[11px] font-bold tracking-[0.06em] uppercase text-[#64748B] dark:text-[#94A3B8] py-2.5 px-3", cls)}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((student, i) => (
                  <StudentRow key={student.userId} student={student} rank={i + 1} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Test Set Card ────────────────────────────────────────────
function TestSetCard({
  ts,
  onToggle,
  onDelete,
  onEdit,
}: {
  ts:       TestSetRow;
  onToggle: (id: number, current: boolean) => void;
  onDelete: (id: number, title: string) => void;
  onEdit:   (id: number) => void;
}) {
  const isPost   = ts.type === "POST_TEST";
  const typeColor = isPost ? "#4A9B7F" : "#3B82C4";
  const typeBg    = isPost ? "bg-[#D1FAE5] dark:bg-[#063c28]" : "bg-[#DBEAFE] dark:bg-[#1e3a5f]";
  const typeLabel = isPost ? "Post-test" : "Pre-test";

  return (
    <div className={cn(
      "bg-white dark:bg-[#1E293B] border rounded-2xl p-5 shadow-sm transition-all",
      ts.isActive
        ? "border-[#E2E8F0] dark:border-[#334155]"
        : "border-dashed border-[#CBD5E1] dark:border-[#334155] opacity-60"
    )}>
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className={cn("text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0", typeBg)} style={{ color: typeColor }}>
            {typeLabel}
          </span>
          <h3 className="font-nunito text-[15px] font-extrabold truncate">{ts.title}</h3>
        </div>
        {/* Active toggle */}
        <button
          onClick={() => onToggle(ts.id, ts.isActive)}
          className={cn(
            "shrink-0 relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none",
            ts.isActive ? "bg-[#4A9B7F]" : "bg-[#CBD5E1] dark:bg-[#334155]"
          )}
          title={ts.isActive ? "Deactivate" : "Activate"}
        >
          <span className={cn(
            "inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform",
            ts.isActive ? "translate-x-4" : "translate-x-0.5"
          )} />
        </button>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#64748B] dark:text-[#94A3B8] mb-3">
        <span>📋 {ts.questionCount} question{ts.questionCount !== 1 ? "s" : ""}</span>
        <span>⏱ {fmtTime(ts.timeLimit)}</span>
        <span>👥 {ts.resultCount} submission{ts.resultCount !== 1 ? "s" : ""}</span>
        <span>📅 Created {ts.createdAt}</span>
      </div>

      {ts.moduleTitle && (
        <div className="flex items-center gap-1.5 mb-3 text-[11px] font-semibold text-[#64748B] dark:text-[#94A3B8]">
          <span>{ts.moduleIcon}</span>
          <span>Linked to: {ts.moduleTitle}</span>
        </div>
      )}

      {ts.description && (
        <p className="text-[12px] text-[#64748B] dark:text-[#94A3B8] line-clamp-2 mb-3">{ts.description}</p>
      )}

      {/* Active status pill + actions */}
      <div className="flex items-center justify-between mt-2">
        <span className={cn(
          "text-[11px] font-bold px-2 py-0.5 rounded-full",
          ts.isActive
            ? "bg-[#D1FAE5] dark:bg-[#063c28] text-[#4A9B7F]"
            : "bg-[#EEF2F8] dark:bg-[#162032] text-[#64748B]"
        )}>
          {ts.isActive ? "Active" : "Inactive"}
        </span>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onEdit(ts.id)}
            className="text-[11px] font-bold text-[#3B82C4] hover:underline transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(ts.id, ts.title)}
            disabled={ts.resultCount > 0}
            title={ts.resultCount > 0 ? `Cannot delete — ${ts.resultCount} submission(s) exist` : "Delete test set"}
            className="text-[11px] font-bold text-[#94A3B8] hover:text-[#E05C5C] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Manage Tab ───────────────────────────────────────────────
function ManageTab({
  testSets, onToggle, onDelete, onEdit, onCreate,
}: {
  testSets: TestSetRow[];
  onToggle: (id: number, current: boolean) => void;
  onDelete: (id: number, title: string) => void;
  onEdit:   (id: number) => void;
  onCreate: () => void;
}) {
  const [filter, setFilter] = useState<"ALL" | "PRE_TEST" | "POST_TEST">("ALL");

  const pre  = testSets.filter((t) => t.type === "PRE_TEST");
  const post = testSets.filter((t) => t.type === "POST_TEST");
  const shown = filter === "ALL" ? testSets : testSets.filter((t) => t.type === filter);

  return (
    <div className="space-y-6">
      {/* Summary chips + filter */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#DBEAFE] dark:bg-[#1e3a5f] rounded-xl text-[12px] font-bold text-[#3B82C4]">
          📝 {pre.length} Pre-test{pre.length !== 1 ? "s" : ""}
          {pre.filter((t) => t.isActive).length > 0 && (
            <span className="ml-1 text-[10px] bg-[#3B82C4] text-white px-1.5 py-0.5 rounded-full">
              {pre.filter((t) => t.isActive).length} active
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#D1FAE5] dark:bg-[#063c28] rounded-xl text-[12px] font-bold text-[#4A9B7F]">
          ✅ {post.length} Post-test{post.length !== 1 ? "s" : ""}
          {post.filter((t) => t.isActive).length > 0 && (
            <span className="ml-1 text-[10px] bg-[#4A9B7F] text-white px-1.5 py-0.5 rounded-full">
              {post.filter((t) => t.isActive).length} active
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 sm:ml-auto flex-wrap">
          {(["ALL", "PRE_TEST", "POST_TEST"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all",
                filter === f
                  ? "bg-[#1E293B] dark:bg-[#F1F5F9] text-white dark:text-[#1E293B]"
                  : "bg-[#EEF2F8] dark:bg-[#162032] text-[#64748B] hover:text-[#1E293B] dark:hover:text-[#F1F5F9]"
              )}
            >
              {f === "ALL" ? "All" : f === "PRE_TEST" ? "Pre" : "Post"}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {shown.length === 0 ? (
        <div className="bg-white dark:bg-[#1E293B] border border-dashed border-[#CBD5E1] dark:border-[#334155] rounded-2xl p-12 text-center">
          <p className="text-4xl mb-3">📋</p>
          <p className="font-nunito font-extrabold text-[15px] mb-1">No test sets yet</p>
          <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mb-5">Create a pre-test or post-test to get started.</p>
          <button
            onClick={onCreate}
            className="px-5 py-2.5 rounded-xl font-nunito font-bold text-sm bg-[#4A9B7F] hover:bg-[#3a7a63] text-white shadow-sm transition-all"
          >
            + Create Test Set
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {shown.map((ts) => (
            <TestSetCard key={ts.id} ts={ts} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Client Component ────────────────────────────────────
export default function TestResultsClient({ data }: { data: TestResultsData }) {
  const router = useRouter();
  const { teacher, sections, pendingGradeCount, totalStudents } = data;

  const [tab,           setTab]           = useState<"results" | "manage">("results");
  const [activeSection, setActiveSection] = useState(0);
  const [testSets,      setTestSets]      = useState<TestSetRow[]>(data.testSets);
  const [toastMsg,      setToastMsg]      = useState("");
  const [toastErr,      setToastErr]      = useState(false);

  const current = sections[activeSection];

  function showToast(msg: string, err = false) {
    setToastMsg(msg);
    setToastErr(err);
    setTimeout(() => setToastMsg(""), 3000);
  }

  async function handleToggle(id: number, current: boolean) {
    const res  = await fetch(`/api/teacher/tests/${id}`, {
      method:      "PATCH",
      headers:     { "Content-Type": "application/json" },
      credentials: "include",
      body:        JSON.stringify({ isActive: !current }),
    });
    const json = await res.json();
    if (json.success) {
      setTestSets((prev) => prev.map((t) => t.id === id ? { ...t, isActive: json.isActive } : t));
      showToast(json.isActive ? "Test set activated." : "Test set deactivated.");
    } else {
      showToast(json.error ?? "Failed to update.", true);
    }
  }

  function handleEdit(id: number) {
    router.push(`/dashboard/teacher/tests/${id}/edit`);
  }

  async function handleDelete(id: number, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    const res  = await fetch(`/api/teacher/tests/${id}`, {
      method: "DELETE", credentials: "include",
    });
    const json = await res.json();
    if (json.success) {
      setTestSets((prev) => prev.filter((t) => t.id !== id));
      showToast("Test set deleted.");
    } else {
      showToast(json.error ?? "Failed to delete.", true);
    }
  }

  return (
    <>
      <style>{`
        .font-nunito { font-family: var(--font-nunito, 'Nunito', sans-serif); }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fadeUp 0.35s ease forwards; }
      `}</style>

      {/* Toast */}
      {toastMsg && (
        <div className={cn(
          "fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl text-sm font-bold shadow-lg transition-all",
          toastErr
            ? "bg-[#FEE2E2] dark:bg-[#450a0a] text-[#E05C5C] border border-[#E05C5C]"
            : "bg-[#D1FAE5] dark:bg-[#063c28] text-[#4A9B7F] border border-[#4A9B7F]"
        )}>
          {toastMsg}
        </div>
      )}

      <div className="flex min-h-screen bg-[#F5F7FA] dark:bg-[#0F172A] text-[#1E293B] dark:text-[#F1F5F9]">

        <TeacherSidebar
          teacherName={teacher.name}
          teacherInitials={teacher.initials}
          teacherSection={teacher.section}
          totalStudents={totalStudents}
          pendingGradeCount={pendingGradeCount}
          activePath="tests"
        />

        <div className="flex-1 px-4 md:px-8 pb-8 pt-14 md:pt-8 overflow-x-hidden">

          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-3 mb-6 fade-up">
            <div>
              <h1 className="font-nunito text-xl md:text-[22px] font-extrabold">Tests</h1>
              <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                Pre/post-tests and student results
              </p>
            </div>
            <button
              onClick={() => router.push("/dashboard/teacher/tests/create")}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-nunito font-bold bg-[#4A9B7F] hover:bg-[#3a7a63] text-white shadow-sm transition-all"
            >
              + Create Test Set
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-[#EEF2F8] dark:bg-[#162032] rounded-xl mb-6 w-full sm:w-fit">
            {(["results", "manage"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "px-5 py-2 rounded-lg text-sm font-bold transition-all",
                  tab === t
                    ? "bg-white dark:bg-[#1E293B] text-[#1E293B] dark:text-[#F1F5F9] shadow-sm"
                    : "text-[#64748B] dark:text-[#94A3B8] hover:text-[#1E293B] dark:hover:text-[#F1F5F9]"
                )}
              >
                {t === "results" ? "📊 Results" : "⚙️ Manage Tests"}
              </button>
            ))}
          </div>

          {/* ── Results tab ── */}
          {tab === "results" && (
            sections.length === 0 ? (
              <div className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl p-12 text-center shadow-sm">
                <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">No active sections found.</p>
              </div>
            ) : (
              <>
                {sections.length > 1 && (
                  <div className="flex gap-2 mb-6 flex-wrap">
                    {sections.map((sec, i) => (
                      <button
                        key={sec.sectionId}
                        onClick={() => setActiveSection(i)}
                        className={cn(
                          "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all",
                          activeSection === i
                            ? "bg-[#4A9B7F] text-white shadow-sm"
                            : "bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] text-[#64748B] dark:text-[#94A3B8] hover:border-[#4A9B7F] hover:text-[#4A9B7F]"
                        )}
                      >
                        <span>{sec.sectionEmoji}</span>
                        <span>{sec.sectionName}</span>
                        <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-bold", activeSection === i ? "bg-white/20 text-white" : "bg-[#EEF2F8] dark:bg-[#162032] text-[#64748B]")}>
                          {sec.students.length}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                {current && (
                  <div key={current.sectionId} className="fade-up">
                    {sections.length === 1 && (
                      <div className="flex items-center gap-2 mb-5">
                        <span className="text-xl">{current.sectionEmoji}</span>
                        <div>
                          <h2 className="font-nunito text-[17px] font-extrabold">{current.sectionName}</h2>
                          <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">{current.gradeLevel} · {current.students.length} students</p>
                        </div>
                      </div>
                    )}
                    <SectionPanel section={current} />
                  </div>
                )}
              </>
            )
          )}

          {/* ── Manage tab ── */}
          {tab === "manage" && (
            <ManageTab
              testSets={testSets}
              onToggle={handleToggle}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onCreate={() => router.push("/dashboard/teacher/tests/create")}
            />
          )}
        </div>
      </div>
    </>
  );
}
