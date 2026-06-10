"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AchievementsData, BadgeCategory, BadgeWithStatus } from "../page";

const CATEGORIES: BadgeCategory[] = ["Progress", "Mastery", "Testing", "XP", "Streak"];

const CATEGORY_META: Record<BadgeCategory, { emoji: string; color: string }> = {
  Progress: { emoji: "📈", color: "#3B82C4" },
  Mastery:  { emoji: "🧠", color: "#8B5CF6" },
  Testing:  { emoji: "📋", color: "#F59E0B" },
  XP:       { emoji: "⭐", color: "#F59E0B" },
  Streak:   { emoji: "🔥", color: "#E05C5C" },
};

// ─── Badge card ───────────────────────────────────────────────
function BadgeCard({ badge }: { badge: BadgeWithStatus }) {
  const dateStr = badge.unlockedAt
    ? new Date(badge.unlockedAt).toLocaleDateString("en-PH", {
        month: "short", day: "numeric", year: "numeric",
      })
    : null;

  return (
    <div
      className={`relative flex flex-col items-center text-center p-4 rounded-2xl border transition-all ${
        badge.earned
          ? "bg-white dark:bg-[#1E293B] border-[#E2E8F0] dark:border-[#334155] shadow-sm"
          : "bg-[#F8FAFC] dark:bg-[#111827] border-[#E2E8F0] dark:border-[#1E293B] opacity-50"
      }`}
    >
      {/* Earned indicator */}
      {badge.earned && (
        <span className="absolute top-2.5 right-2.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#D1FAE5] dark:bg-[#063c28] text-[#4A9B7F]">
          ✓
        </span>
      )}

      {/* Emoji */}
      <div
        className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-3 ${
          badge.earned
            ? "bg-gradient-to-br from-white to-[#F1F5F9] dark:from-[#1E293B] dark:to-[#0F172A] shadow-sm"
            : "bg-[#F1F5F9] dark:bg-[#1E293B] grayscale"
        }`}
        style={badge.earned ? { boxShadow: `0 0 0 2px ${badge.color}30` } : undefined}
      >
        {badge.earned ? badge.emoji : "🔒"}
      </div>

      {/* Name */}
      <p className="font-nunito font-extrabold text-[13px] leading-tight mb-1">
        {badge.name}
      </p>

      {/* Description */}
      <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] leading-snug">
        {badge.description}
      </p>

      {/* Unlock date */}
      {dateStr && (
        <p className="mt-2 text-[10px] font-semibold" style={{ color: badge.color }}>
          {dateStr}
        </p>
      )}
    </div>
  );
}

// ─── Stat chip ────────────────────────────────────────────────
function StatChip({
  label, value, color,
}: { label: string; value: string; color: string }) {
  return (
    <div className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl p-4 text-center shadow-sm">
      <p className="font-nunito font-black text-xl" style={{ color }}>{value}</p>
      <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-0.5">{label}</p>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────
export default function AchievementsClient({ data }: { data: AchievementsData }) {
  const router = useRouter();
  const { student, stats, badges } = data;

  const [activeCategory, setActiveCategory] = useState<BadgeCategory | "All">("All");

  const filtered = activeCategory === "All"
    ? badges
    : badges.filter((b) => b.category === activeCategory);

  const xpPct    = ((student.xp % 1000) / 1000) * 100;
  const xpToNext = 1000 - (student.xp % 1000);

  return (
    <>
      <style>{`
        .font-nunito { font-family: var(--font-nunito, 'Nunito', sans-serif); }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fade-up 0.3s ease both; }
      `}</style>

      <div className="min-h-screen bg-[#F5F7FA] dark:bg-[#0F172A] text-[#1E293B] dark:text-[#F1F5F9]">

        {/* ── Top bar ────────────────────────────────────────── */}
        <div className="sticky top-0 z-30 bg-white dark:bg-[#1E293B] border-b border-[#E2E8F0] dark:border-[#334155] shadow-sm px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard/student")}
              className="p-2 rounded-xl hover:bg-[#F1F5F9] dark:hover:bg-[#334155] transition-colors text-[#64748B]"
            >
              ←
            </button>
            <div>
              <h1 className="font-nunito font-extrabold text-lg leading-tight">Achievements</h1>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                {stats.earned} of {stats.total} badges earned
              </p>
            </div>
          </div>
          {/* Trophy count */}
          <div className="flex items-center gap-1.5 bg-[#FEF3C7] dark:bg-[#422006] px-3 py-1.5 rounded-full">
            <span className="text-base">🏆</span>
            <span className="font-nunito font-extrabold text-sm text-[#F59E0B]">
              {stats.earned}
            </span>
          </div>
        </div>

        <div className="px-6 py-8 max-w-2xl mx-auto space-y-6">

          {/* ── Avatar + XP hero ────────────────────────────── */}
          <div className="fade-up flex items-center gap-5 p-5 bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#3B82C4] to-[#4A9B7F] flex items-center justify-center text-3xl flex-shrink-0">
              {student.avatarEmoji}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-nunito font-extrabold text-lg truncate">{student.name}</p>
              <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">{student.avatarName}</p>
              <div className="flex gap-2 mt-1.5 flex-wrap">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#EDE9FE] dark:bg-[#2e1065] text-[#8B5CF6]">
                  Lv. {student.level}
                </span>
                {student.streak > 0 && (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#FEE2E2] dark:bg-[#450a0a] text-[#E05C5C]">
                    🔥 {student.streak}-day streak
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ── XP bar ──────────────────────────────────────── */}
          <div className="fade-up -mt-2 px-1">
            <div className="flex justify-between text-[10px] text-[#94A3B8] mb-1">
              <span>{student.xp % 1000} / 1000 XP to Level {student.level + 1}</span>
              <span>{xpToNext} XP to go</span>
            </div>
            <div className="h-2.5 bg-[#EEF2F8] dark:bg-[#162032] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#3B82C4] to-[#4A9B7F] rounded-full transition-all duration-700"
                style={{ width: `${xpPct}%` }}
              />
            </div>
          </div>

          {/* ── Stats row ───────────────────────────────────── */}
          <div className="fade-up grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatChip label="Modules Done"  value={String(stats.modulesCompleted)} color="#4A9B7F" />
            <StatChip label="Stages Done"   value={String(stats.stagesDone)}       color="#3B82C4" />
            <StatChip label="Best Score"    value={stats.bestScore !== null ? `${stats.bestScore}%` : "—"} color="#8B5CF6" />
            <StatChip label="Total XP"      value={`${student.xp} XP`}             color="#F59E0B" />
          </div>

          {/* ── Category filter ─────────────────────────────── */}
          <div className="fade-up flex gap-2 flex-wrap">
            {(["All", ...CATEGORIES] as const).map((cat) => {
              const meta = cat === "All" ? null : CATEGORY_META[cat];
              const count = cat === "All"
                ? badges.filter((b) => b.earned).length
                : badges.filter((b) => b.category === cat && b.earned).length;
              const total = cat === "All"
                ? badges.length
                : badges.filter((b) => b.category === cat).length;
              const active = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-bold border transition-all ${
                    active
                      ? "bg-[#1E293B] dark:bg-white text-white dark:text-[#1E293B] border-transparent shadow-sm"
                      : "bg-white dark:bg-[#1E293B] border-[#E2E8F0] dark:border-[#334155] text-[#64748B] dark:text-[#94A3B8] hover:border-[#CBD5E1]"
                  }`}
                >
                  {meta && <span>{meta.emoji}</span>}
                  {cat}
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    active ? "bg-white/20 dark:bg-black/20" : "bg-[#F1F5F9] dark:bg-[#334155]"
                  }`}>
                    {count}/{total}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ── Badge grid ──────────────────────────────────── */}
          <div className="fade-up grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filtered.map((badge) => (
              <BadgeCard key={badge.id} badge={badge} />
            ))}
          </div>

          {/* ── Footer ──────────────────────────────────────── */}
          <div className="fade-up pb-4">
            <button
              onClick={() => router.push("/dashboard/student")}
              className="text-sm text-[#64748B] dark:text-[#94A3B8] hover:text-[#3B82C4] transition-colors font-semibold"
            >
              ← Back to Dashboard
            </button>
          </div>

        </div>
      </div>
    </>
  );
}
