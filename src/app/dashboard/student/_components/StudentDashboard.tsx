// app/dashboard/student/_components/StudentDashboard.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { StudentSidebar, StudentBottomNav, HamburgerButton } from "./StudentSidebar";
import type {
  StudentDashboardData,
  ActiveModule,
  DiagnosticCluster,
  StageStatus,
} from "../page";

// ─── PHASE COLOUR MAP ─────────────────────────────────────────
const PHASE_COLOR: Record<number, string> = {};
for (let i = 1;  i <= 3;  i++) PHASE_COLOR[i] = "#3B82C4";
for (let i = 4;  i <= 7;  i++) PHASE_COLOR[i] = "#8B5CF6";
for (let i = 8;  i <= 10; i++) PHASE_COLOR[i] = "#F59E0B";
for (let i = 11; i <= 12; i++) PHASE_COLOR[i] = "#4A9B7F";

const PHASE_LABELS = [
  { color: "#3B82C4", label: "Understanding", stages: "1–3" },
  { color: "#8B5CF6", label: "Analysis",      stages: "4–7" },
  { color: "#F59E0B", label: "Solution",       stages: "8–10" },
  { color: "#4A9B7F", label: "Reflection",     stages: "11–12" },
];

// ─── XP BAR (hero card only) ──────────────────────────────────
function XpBar({ xp, level }: { xp: number; level: number }) {
  const progress = (xp % 1000) / 10;
  const toNext   = 1000 - (xp % 1000);
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-bold text-white/90">⭐ Level {level}</span>
        <span className="text-[11px] text-white/70">{toNext} XP to next</span>
      </div>
      <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-yellow-300 to-yellow-400 rounded-full transition-all duration-700 shadow-sm"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

// ─── STAT CARD ────────────────────────────────────────────────
function StatCard({
  icon, value, label, sub, color,
}: {
  icon: string; value: string; label: string; sub?: string;
  color: "blue" | "purple" | "amber" | "green";
}) {
  const accent = { blue: "#3B82C4", purple: "#8B5CF6", amber: "#F59E0B", green: "#4A9B7F" };
  const bg = {
    blue:   "bg-[#EFF6FF]",
    purple: "bg-[#F5F3FF]",
    amber:  "bg-[#FFFBEB]",
    green:  "bg-[#F0FDF4]",
  };
  return (
    <div className={cn("relative rounded-2xl p-4 overflow-hidden border-0", bg[color])}>
      <div className="absolute top-0 left-0 w-1 h-full rounded-l-2xl" style={{ background: accent[color] }} />
      <div className="text-2xl mb-1">{icon}</div>
      <div className="font-nunito text-2xl font-extrabold leading-none mb-1" style={{ color: accent[color] }}>
        {value}
      </div>
      <div className="text-[13px] font-bold text-[#374151]">{label}</div>
      {sub && <div className="text-[11px] text-[#6B7280] mt-0.5">{sub}</div>}
    </div>
  );
}

// ─── STAGE PIP TRACK ─────────────────────────────────────────
function StagePip({ stageNum, status }: { stageNum: number; status: "done" | "current" | "empty" }) {
  if (status === "current") return (
    <div className="flex-1 h-2 rounded-full animate-pulse" style={{ background: "#F59E0B", boxShadow: "0 0 6px #F59E0B80" }} />
  );
  if (status === "done") return (
    <div className="flex-1 h-2 rounded-full" style={{ background: PHASE_COLOR[stageNum] }} />
  );
  return <div className="flex-1 h-2 rounded-full bg-[#E2E8F0]" />;
}

// ─── JOURNEY ITEM ────────────────────────────────────────────
function JourneyItem({ s }: { s: StageStatus }) {
  const isDone    = s.status === "done";
  const isCurrent = s.status === "current";
  const isLocked  = s.status === "locked";

  return (
    <div className={cn(
      "flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 transition-all",
      isDone    && "bg-[#F0FDF4] border-[#86EFAC]",
      isCurrent && "bg-[#FFFBEB] border-[#FCD34D] shadow-[0_0_0_3px_rgba(252,211,77,0.2)]",
      isLocked  && "bg-[#F8FAFC] border-[#E2E8F0]",
    )}>
      <div className={cn(
        "w-9 h-9 rounded-full flex items-center justify-center text-sm font-extrabold font-nunito flex-shrink-0",
        isDone    && "bg-[#22C55E] text-white",
        isCurrent && "bg-[#F59E0B] text-white",
        isLocked  && "bg-[#E2E8F0] text-[#94A3B8]",
      )}>
        {isDone ? "✓" : s.num}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-bold truncate", isLocked && "text-[#94A3B8]")}>{s.title}</p>
        <span className="text-[11px] text-[#6B7280]">{s.sub}</span>
      </div>
      <span className="text-base flex-shrink-0">
        {isDone ? "✅" : isCurrent ? "▶️" : "🔒"}
      </span>
    </div>
  );
}

// ─── DIAGNOSTIC BAR ───────────────────────────────────────────
function DiagBar({ d }: { d: DiagnosticCluster }) {
  const friendlyLabel = d.label.replace(/^[^\s]+\s/, ""); // strip emoji prefix
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-sm font-bold text-[#374151]">{d.label}</span>
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-extrabold" style={{ color: d.color }}>
            {d.pending ? "—" : `${d.pct}%`}
          </span>
          <span className={cn("text-[11px] font-bold px-2 py-0.5 rounded-full", d.badgeCls)}>
            {d.pending ? "Waiting" : d.badge}
          </span>
        </div>
      </div>
      <div className="h-3 bg-[#F1F5F9] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${d.pending ? 0 : d.pct}%`, background: d.color }}
        />
      </div>
    </div>
  );
}

// ─── ACTIVE MODULE PANEL ─────────────────────────────────────
function ActiveModulePanel({ mod, router }: { mod: ActiveModule; router: ReturnType<typeof useRouter> }) {
  const stagesDone  = mod.stageStatuses.filter((s) => s.status === "done").length;
  const pipStatuses = mod.stageStatuses.map((s) =>
    s.status === "done" ? "done" : s.status === "current" ? "current" : "empty"
  ) as ("done" | "current" | "empty")[];

  const focusStages = mod.stageStatuses.filter(
    (s) => s.status === "done" || s.status === "current"
  ).slice(-3);
  const lockedPeek  = mod.stageStatuses.filter((s) => s.status === "locked").slice(0, 2);
  const previewList = [...focusStages, ...lockedPeek];

  const pct = Math.round((stagesDone / 12) * 100);

  return (
    <div className="bg-white border-2 border-[#E2E8F0] rounded-3xl p-5 sm:p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="min-w-0 flex-1 pr-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">{mod.icon}</span>
            <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-[#FEF3C7] text-[#D97706]">
              IN PROGRESS
            </span>
          </div>
          <h3 className="font-nunito text-base font-extrabold text-[#1E293B] leading-snug">{mod.title}</h3>
          {mod.dueDate && (
            <p className="text-[12px] text-[#64748B] mt-0.5">📅 Due {mod.dueDate}</p>
          )}
        </div>
        <div className="text-right shrink-0">
          <div className="font-nunito text-2xl font-extrabold text-[#3B82C4]">{pct}%</div>
          <div className="text-[11px] text-[#64748B]">done</div>
        </div>
      </div>

      {/* Stage pip track */}
      <div className="mb-5 p-4 bg-[#F8FAFC] rounded-2xl">
        <div className="flex justify-between mb-2">
          <span className="text-xs font-bold text-[#64748B]">My Journey</span>
          <span className="text-xs font-extrabold text-[#374151]">{stagesDone} / {mod.totalStages} stages</span>
        </div>
        <div className="flex gap-1 mb-3">
          {Array.from({ length: 12 }, (_, i) => (
            <StagePip key={i} stageNum={i + 1} status={pipStatuses[i]} />
          ))}
        </div>
        <div className="flex gap-3 flex-wrap">
          {PHASE_LABELS.map(({ color, label }) => (
            <span key={label} className="flex items-center gap-1 text-[11px] text-[#6B7280] font-semibold">
              <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: color }} />
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Journey list */}
      <div className="flex flex-col gap-2 mb-5 max-h-[260px] overflow-y-auto pr-0.5">
        {previewList.map((s) => <JourneyItem key={s.num} s={s} />)}
      </div>

      {/* CTA */}
      <button
        onClick={() => router.push(`/dashboard/student/modules/${mod.id}/stage/${mod.currentStage}`)}
        className="w-full py-4 rounded-2xl bg-[#3B82C4] hover:bg-[#2563A0] active:scale-[0.98] text-white font-nunito font-extrabold text-base shadow-[0_6px_20px_rgba(59,130,196,0.35)] hover:shadow-[0_8px_24px_rgba(59,130,196,0.45)] transition-all"
      >
        ▶ Continue Stage {mod.currentStage}
      </button>
    </div>
  );
}

// ─── NO MODULE PANEL ─────────────────────────────────────────
function NoModulePanel({ router }: { router: ReturnType<typeof useRouter> }) {
  return (
    <div className="bg-white border-2 border-dashed border-[#CBD5E1] rounded-3xl p-8 flex flex-col items-center justify-center text-center gap-3">
      <span className="text-6xl">🗺️</span>
      <h3 className="font-nunito text-lg font-extrabold text-[#1E293B]">No Active Quest Yet!</h3>
      <p className="text-sm text-[#64748B] max-w-[280px]">
        Your teacher will assign a module soon, or you can browse what's available!
      </p>
      <button
        onClick={() => router.push("/dashboard/student/modules")}
        className="mt-2 px-6 py-3 rounded-2xl bg-[#DBEAFE] text-[#3B82C4] font-nunito font-extrabold text-sm hover:bg-[#3B82C4] hover:text-white transition-all active:scale-[0.98] shadow-sm"
      >
        Browse My Modules →
      </button>
    </div>
  );
}

// ─── HERO WELCOME CARD (mobile-first) ────────────────────────
function HeroCard({
  student,
  activeModule,
  router,
}: {
  student: StudentDashboardData["student"];
  activeModule: ActiveModule | null;
  router: ReturnType<typeof useRouter>;
}) {
  const hour     = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = student.name.split(" ")[0];

  return (
    <div
      className="rounded-3xl p-5 sm:p-6 text-white overflow-hidden relative"
      style={{
        background: "linear-gradient(135deg, #3B82C4 0%, #4A9B7F 100%)",
        boxShadow: "0 8px 32px rgba(59,130,196,0.25)",
      }}
    >
      {/* Decorative circles */}
      <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/10" />
      <div className="absolute -bottom-8 -left-4 w-24 h-24 rounded-full bg-white/10" />

      <div className="relative flex items-center gap-4 mb-4">
        {/* Avatar */}
        <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-4xl flex-shrink-0 shadow-lg border-2 border-white/30">
          {student.avatarEmoji}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-white/80">{greeting}! 👋</p>
          <h2 className="font-nunito text-xl sm:text-2xl font-extrabold leading-tight truncate">
            {firstName}
          </h2>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/20 border border-white/30">
              {student.difficulty}
            </span>
            <span className="text-xs text-white/70">{student.section}</span>
          </div>
        </div>
      </div>

      {/* XP Bar */}
      <div className="relative mb-4">
        <XpBar xp={student.xp} level={student.level} />
      </div>

      {/* Quick CTA */}
      {activeModule && (
        <button
          onClick={() => router.push(`/dashboard/student/modules/${activeModule.id}/stage/${activeModule.currentStage}`)}
          className="w-full py-3.5 rounded-2xl bg-white text-[#3B82C4] font-nunito font-extrabold text-base hover:bg-white/90 active:scale-[0.98] transition-all shadow-lg"
        >
          ▶ Continue Stage {activeModule.currentStage} of 12
        </button>
      )}
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────
export default function StudentDashboard({ data }: { data: StudentDashboardData }) {
  const router       = useRouter();
  const [nav,        setNav]        = useState("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);

  const { student, stats, activeModule, diagnostic, upcomingModules, hasPreTest, hasPostTest } = data;

  function navigate(path: string, key: string) {
    setNav(key);
    setMobileOpen(false);
    router.push(path);
  }

  return (
    <>
      <style>{`
        .font-nunito { font-family: var(--font-nunito, 'Nunito', sans-serif); }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInLeft {
          from { transform: translateX(-100%); }
          to   { transform: translateX(0); }
        }
        .fade-up       { animation: fadeUp      0.4s ease forwards; }
        .slide-in-left { animation: slideInLeft 0.25s cubic-bezier(.34,1.1,.64,1) both; }
        .d1 { animation-delay: 0.05s; opacity: 0; }
        .d2 { animation-delay: 0.10s; opacity: 0; }
        .d3 { animation-delay: 0.15s; opacity: 0; }
        .d4 { animation-delay: 0.20s; opacity: 0; }
        .d5 { animation-delay: 0.25s; opacity: 0; }
      `}</style>

      <div className="flex min-h-screen bg-[#F0F4F8] text-[#1E293B]">

        <StudentSidebar
          student={student}
          modulesAssigned={stats.modulesAssigned}
          activeNav={nav}
          onNavigate={navigate}
          mobileOpen={mobileOpen}
          onMobileOpen={setMobileOpen}
        />

        {/* ── MAIN ──────────────────────────────────────────── */}
        <main className="flex-1 min-w-0 overflow-x-hidden p-4 sm:p-6 lg:p-8 pb-28 md:pb-8">

          {/* Mobile topbar — hamburger only */}
          <div className="flex items-center gap-3 mb-4 md:hidden fade-up">
            <HamburgerButton onClick={() => setMobileOpen(true)} />
            <div className="flex-1 min-w-0">
              <h1 className="font-nunito text-[17px] font-extrabold truncate">Student Dashboard</h1>
            </div>
            {activeModule && (
              <button
                onClick={() => router.push(`/dashboard/student/modules/${activeModule.id}/stage/${activeModule.currentStage}`)}
                className="flex-shrink-0 h-11 px-4 rounded-2xl bg-[#3B82C4] text-white font-nunito font-extrabold text-sm active:scale-[0.98] transition-all shadow-md"
              >
                ▶ Go
              </button>
            )}
          </div>

          {/* Desktop topbar greeting */}
          <div className="hidden md:flex items-center justify-between mb-6 fade-up">
            <div>
              <h1 className="font-nunito text-2xl font-extrabold">
                {new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 17 ? "Good afternoon" : "Good evening"}, {student.name.split(" ")[0]}! 👋
              </h1>
              <p className="text-sm text-[#64748B] mt-0.5">
                {activeModule
                  ? `Stage ${activeModule.currentStage} of 12 is waiting for you.`
                  : "No active quest — check your modules!"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push("/dashboard/student/report")}
                className="h-10 px-4 rounded-2xl border border-[#E2E8F0] bg-white text-sm font-nunito font-bold text-[#64748B] hover:border-[#3B82C4] hover:text-[#3B82C4] transition-all"
              >
                📊 My Report
              </button>
              {activeModule && (
                <button
                  onClick={() => router.push(`/dashboard/student/modules/${activeModule.id}/stage/${activeModule.currentStage}`)}
                  className="h-10 px-5 rounded-2xl bg-[#3B82C4] hover:bg-[#2563A0] text-white font-nunito font-extrabold text-sm shadow-[0_4px_14px_rgba(59,130,196,0.35)] active:scale-[0.98] transition-all"
                >
                  ▶ Continue Stage {activeModule.currentStage}
                </button>
              )}
            </div>
          </div>

          {/* ── MOBILE HERO CARD ──────────────────────────── */}
          <div className="md:hidden mb-4 fade-up d1">
            <HeroCard student={student} activeModule={activeModule} router={router} />
          </div>

          {/* ── STATS ─────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <div className="fade-up d1">
              <StatCard
                icon="📚" color="blue"
                value={String(stats.modulesAssigned)}
                label="My Quests"
                sub={stats.modulesAssigned > 0 ? `${stats.modulesAssigned} assigned` : "None yet"}
              />
            </div>
            <div className="fade-up d2">
              <StatCard
                icon="🧩" color="purple"
                value={`${stats.stagesCompleted}`}
                label="Stages Done"
                sub={stats.totalStages > 0 ? `out of ${stats.totalStages}` : "Start one!"}
              />
            </div>
            <div className="fade-up d3">
              <StatCard
                icon="⭐" color="amber"
                value={stats.overallScore != null ? `${stats.overallScore}%` : "—"}
                label="My Score"
                sub={stats.overallScore == null ? "Finish a module" : stats.overallScore >= 80 ? "Excellent!" : stats.overallScore >= 60 ? "Keep going!" : "Keep trying!"}
              />
            </div>
            <div className="fade-up d4">
              <StatCard
                icon="⏱️" color="green"
                value={`${stats.timeSpentToday}m`}
                label="Today"
                sub={stats.timeSpentToday > 0 ? "Great session!" : "No activity yet"}
              />
            </div>
          </div>

          {/* ── MAIN GRID ─────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4 fade-up d3">

            {/* Active module */}
            {activeModule
              ? <ActiveModulePanel mod={activeModule} router={router} />
              : <NoModulePanel router={router} />
            }

            {/* Right column */}
            <div className="flex flex-col gap-4">

              {/* Diagnostic */}
              <div className="bg-white border-2 border-[#E2E8F0] rounded-3xl p-4 sm:p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-nunito text-base font-extrabold">📊 My Progress Report</h3>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#EFF6FF] text-[#3B82C4]">
                    Auto-generated
                  </span>
                </div>
                {activeModule == null ? (
                  <div className="text-center py-6">
                    <span className="text-4xl">📈</span>
                    <p className="text-sm text-[#64748B] mt-2">Start a module to see your report!</p>
                  </div>
                ) : (
                  <>
                    {diagnostic.map((d) => <DiagBar key={d.label} d={d} />)}
                    {diagnostic.some((d) => !d.pending && d.pct < 60) && (
                      <div className="mt-2 p-3 bg-[#FEF2F2] rounded-2xl border border-[#FECACA]">
                        <p className="text-sm text-[#DC2626] font-bold">
                          ⚠️ Need more practice:{" "}
                          {diagnostic.filter((d) => !d.pending && d.pct < 60).map((d) => d.label.replace(/^[^\s]+\s/, "")).join(", ")}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Upcoming */}
              <div className="bg-white border-2 border-[#E2E8F0] rounded-3xl p-4 sm:p-5 shadow-sm">
                <h3 className="font-nunito text-base font-extrabold mb-4">🗓️ Coming Up Next</h3>
                {upcomingModules.length === 0 ? (
                  <div className="text-center py-4">
                    <span className="text-3xl">🎉</span>
                    <p className="text-sm text-[#64748B] mt-2">No more modules waiting!</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5 mb-3">
                    {upcomingModules.map((m) => (
                      <button
                        key={m.id}
                        className="flex items-center gap-3 p-3.5 border-2 border-[#E2E8F0] rounded-2xl hover:border-[#3B82C4] hover:bg-[#EFF6FF] transition-all active:scale-[0.98] w-full text-left min-h-[52px]"
                        onClick={() => router.push("/dashboard/student/modules")}
                      >
                        <span className="text-2xl">{m.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate">{m.title}</p>
                          <span className="text-[11px] text-[#64748B]">Not started yet</span>
                        </div>
                        <span className="text-[#3B82C4] font-bold text-sm flex-shrink-0">→</span>
                      </button>
                    ))}
                  </div>
                )}

                {!hasPreTest && (
                  <button
                    onClick={() => router.push("/dashboard/student/pre-test")}
                    className="w-full py-3.5 rounded-2xl font-nunito font-extrabold text-sm border-2 border-[#BFDBFE] text-[#3B82C4] bg-[#EFF6FF] hover:bg-[#3B82C4] hover:text-white transition-all active:scale-[0.98] min-h-[48px]"
                  >
                    📝 Take Pre-Test First!
                  </button>
                )}
                {hasPreTest && !hasPostTest && (
                  <button
                    onClick={() => router.push("/dashboard/student/post-test")}
                    className="w-full py-3.5 rounded-2xl font-nunito font-extrabold text-sm border-2 border-[#86EFAC] text-[#16A34A] bg-[#F0FDF4] hover:bg-[#16A34A] hover:text-white transition-all active:scale-[0.98] min-h-[48px]"
                  >
                    ✅ Take Post-Test!
                  </button>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      <StudentBottomNav
        activeNav={nav}
        modulesAssigned={stats.modulesAssigned}
        mobileOpen={mobileOpen}
        onNavigate={navigate}
        onMobileOpen={setMobileOpen}
      />
    </>
  );
}
