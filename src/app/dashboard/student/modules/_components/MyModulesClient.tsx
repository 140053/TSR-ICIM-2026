// app/dashboard/student/modules/_components/MyModulesClient.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { StudentSidebar, StudentBottomNav, HamburgerButton } from "../../_components/StudentSidebar";
import type {
  MyModulesData,
  ModuleCard,
  StageRow,
  DiagSnapshot,
  PhaseBreakdown,
  ModuleStatus,
} from "../page";

// Strip HTML tags for plain-text snippets
function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

// ─── CONSTANTS ────────────────────────────────────────────────
const PHASE_COLOR: Record<string, string> = {
  blue:   "#3B82C4",
  purple: "#8B5CF6",
  amber:  "#F59E0B",
  green:  "#4A9B7F",
};

const STATUS_CONFIG: Record<ModuleStatus, {
  label: string; dot: string; bg: string; border: string; text: string;
}> = {
  in_progress: { label:"⚡ In Progress",  dot:"bg-[#F59E0B]", bg:"bg-[#FEF3C7] dark:bg-[#3d2800]", border:"border-[#F59E0B]", text:"text-[#F59E0B]" },
  completed:   { label:"✅ Completed",    dot:"bg-[#4A9B7F]", bg:"bg-[#D1FAE5] dark:bg-[#064e35]", border:"border-[#4A9B7F]", text:"text-[#4A9B7F]" },
  not_started: { label:"○ Not Started",  dot:"bg-[#94A3B8]", bg:"bg-[#EEF2F8] dark:bg-[#162032]", border:"border-[#E2E8F0] dark:border-[#2D3F55]", text:"text-[#64748B] dark:text-[#94A3B8]" },
  locked:      { label:"🔒 Locked",      dot:"bg-[#64748B]", bg:"bg-[#EEF2F8] dark:bg-[#162032]", border:"border-[#E2E8F0] dark:border-[#2D3F55]", text:"text-[#64748B] dark:text-[#94A3B8]" },
};

// ─── HELPERS ─────────────────────────────────────────────────
function ScorePill({ score, label }: { score: number | null; label: string }) {
  if (score == null) return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EEF2F8] dark:bg-[#162032] text-[#94A3B8]">
      {label} — Pending
    </span>
  );
  const cls = score >= 80 ? "bg-[#D1FAE5] dark:bg-[#064e35] text-[#4A9B7F]"
            : score >= 60 ? "bg-[#FEF3C7] dark:bg-[#3d2800] text-[#F59E0B]"
            : "bg-[#FEE2E2] dark:bg-[#450a0a] text-[#E05C5C]";
  return (
    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", cls)}>
      {label}: {score}%
    </span>
  );
}

// ─── MODULE DETAIL DRAWER ────────────────────────────────────
function ModuleDrawer({
  mod,
  open,
  onClose,
}: {
  mod: ModuleCard | null;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  if (!mod) return null;

  const cfg = STATUS_CONFIG[mod.status];

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />
      {/* Drawer */}
      <div className={cn(
        "fixed right-0 top-0 bottom-0 z-50 w-full max-w-[520px] bg-white dark:bg-[#1E293B] shadow-2xl flex flex-col transition-transform duration-300",
        open ? "translate-x-0" : "translate-x-full"
      )}>
        {/* Banner */}
        {mod.bannerUrl && (
          <div className="relative w-full h-36 shrink-0 overflow-hidden">
            <img src={mod.bannerUrl} alt={`${mod.title} banner`} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-8 h-8 rounded-xl flex items-center justify-center bg-black/40 text-white hover:bg-black/60 transition-colors font-bold text-sm"
            >✕</button>
            <div className="absolute bottom-3 left-4 right-14">
              <h2 className="font-nunito font-extrabold text-base leading-snug text-white drop-shadow">{mod.title}</h2>
              <p className="text-xs text-white/80 mt-0.5">{mod.context}</p>
            </div>
          </div>
        )}

        {/* Header (shown when no banner) */}
        {!mod.bannerUrl && (
          <div className="flex items-center justify-between px-6 py-5 border-b border-[#E2E8F0] dark:border-[#2D3F55] shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{mod.icon}</span>
              <div>
                <h2 className="font-nunito font-extrabold text-base leading-snug">{mod.title}</h2>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">{mod.context}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-[#EEF2F8] dark:hover:bg-[#162032] text-[#94A3B8] transition-colors font-bold"
            >✕</button>
          </div>
        )}

        {/* Compact header row when banner is shown */}
        {mod.bannerUrl && (
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#E2E8F0] dark:border-[#2D3F55] shrink-0">
            <span className="text-xl">{mod.icon}</span>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8] flex-1 truncate">{mod.context}</p>
            <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[#EEF2F8] dark:hover:bg-[#162032] text-[#94A3B8] text-sm font-bold">✕</button>
          </div>
        )}

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">

          {/* Status + meta pills */}
          <div className="flex flex-wrap gap-2">
            <span className={cn("text-[11px] font-bold px-3 py-1.5 rounded-full border", cfg.bg, cfg.border, cfg.text)}>
              {cfg.label}
            </span>
            <span className="text-[11px] font-semibold px-3 py-1.5 rounded-full bg-[#EEF2F8] dark:bg-[#162032] text-[#64748B] dark:text-[#94A3B8] border border-[#E2E8F0] dark:border-[#2D3F55]">
              {mod.difficulty}
            </span>
            {mod.dueDate && (
              <span className="text-[11px] font-semibold px-3 py-1.5 rounded-full bg-[#EDE9FE] dark:bg-[#2e1065] text-[#8B5CF6] border border-[#8B5CF6]">
                📅 Due: {mod.dueDate}
              </span>
            )}
            {mod.timeEstimate && (
              <span className="text-[11px] font-semibold px-3 py-1.5 rounded-full bg-[#EEF2F8] dark:bg-[#162032] text-[#64748B] dark:text-[#94A3B8] border border-[#E2E8F0] dark:border-[#2D3F55]">
                ⏱️ ~{mod.timeEstimate} min
              </span>
            )}
          </div>

          {/* Scenario */}
          <div className="bg-[#F8FAFC] dark:bg-[#0F1E2E] border border-[#E2E8F0] dark:border-[#2D3F55] rounded-xl p-4">
            <p className="text-xs font-bold text-[#64748B] dark:text-[#94A3B8] mb-2 uppercase tracking-widest">Scenario</p>
            <div
              className="text-sm leading-relaxed text-[#1E293B] dark:text-[#E2E8F0] prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-ol:my-1"
              dangerouslySetInnerHTML={{ __html: mod.scenario }}
            />
          </div>

          {/* Pip track */}
          {mod.status !== "locked" && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold uppercase tracking-widest text-[#64748B] dark:text-[#94A3B8]">
                  Progress — {mod.progressText}
                </p>
                {mod.percentScore > 0 && (
                  <span className="text-sm font-extrabold font-nunito" style={{ color: mod.percentScore >= 80 ? "#4A9B7F" : mod.percentScore >= 60 ? "#F59E0B" : "#E05C5C" }}>
                    {mod.percentScore}%
                  </span>
                )}
              </div>
              <div className="flex gap-1 mb-2">
                {mod.pips.map((p, i) => (
                  <div
                    key={i}
                    className={cn("flex-1 h-2.5 rounded", p === "empty" && "bg-[#E2E8F0] dark:bg-[#2D3F55]", p === "current" && "animate-pulse")}
                    style={p !== "empty" ? { background: p === "current" ? "#F59E0B" : PHASE_COLOR[p] } : undefined}
                  />
                ))}
              </div>
              {/* Legend */}
              <div className="flex flex-wrap gap-3">
                {[["#3B82C4","Understanding (1–3)"],["#8B5CF6","Analysis (4–7)"],["#F59E0B","Solution (8–10)"],["#4A9B7F","Reflection (11–12)"]].map(([c,l])=>(
                  <span key={l} className="flex items-center gap-1.5 text-[10px] text-[#94A3B8] font-semibold">
                    <span className="w-2 h-2 rounded-sm" style={{ background: c }} />{l}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Phase breakdown */}
          {mod.status !== "locked" && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#64748B] dark:text-[#94A3B8] mb-2.5">Phase Breakdown</p>
              <div className="grid grid-cols-2 gap-2">
                {mod.phases.map((ph) => (
                  <div
                    key={ph.label}
                    className={cn(
                      "p-3.5 rounded-xl border",
                      ph.status === "done"   && "border-[#4A9B7F] bg-[#D1FAE5] dark:bg-[#064e35]",
                      ph.status === "active" && "border-[#F59E0B] bg-[#FEF3C7] dark:bg-[#3d2800]",
                      ph.status === "locked" && "border-[#E2E8F0] dark:border-[#2D3F55] bg-[#EEF2F8] dark:bg-[#162032]",
                    )}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold" style={{ color: ph.color }}>{ph.label}</span>
                      {ph.status === "done"   && <span className="text-[10px] text-[#4A9B7F] font-bold">✅ Done</span>}
                      {ph.status === "active" && <span className="text-[10px] text-[#F59E0B] font-bold">▶ Active</span>}
                      {ph.status === "locked" && <span className="text-[10px] text-[#94A3B8] font-bold">🔒</span>}
                    </div>
                    <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mb-1.5">
                      {ph.stageDone}/{ph.stageTotal} stages
                    </div>
                    <div className="h-1.5 bg-white/50 dark:bg-black/20 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${(ph.stageDone / ph.stageTotal) * 100}%`, background: ph.color }}
                      />
                    </div>
                    {ph.pct != null && (
                      <div className="text-[11px] font-bold mt-1.5" style={{ color: ph.color }}>
                        Score: {ph.pct}%
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stage journey */}
          {mod.status !== "locked" && mod.status !== "not_started" && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#64748B] dark:text-[#94A3B8] mb-2.5">
                Stage Journey
              </p>
              <div className="flex flex-col gap-1.5">
                {mod.stageRows.map((s) => (
                  <div
                    key={s.num}
                    className={cn(
                      "flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border transition-all",
                      s.status === "done"    && "bg-[#D1FAE5] dark:bg-[#063c28] border-[#4A9B7F]",
                      s.status === "current" && "bg-[#FEF3C7] dark:bg-[#3d2800] border-[#F59E0B]",
                      s.status === "locked"  && "bg-[#EEF2F8] dark:bg-[#162032] border-[#E2E8F0] dark:border-[#2D3F55]",
                    )}
                  >
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0",
                      s.status === "done"    && "bg-[#4A9B7F] text-white",
                      s.status === "current" && "bg-[#F59E0B] text-black",
                      s.status === "locked"  && "bg-[#E2E8F0] dark:bg-[#2D3F55] text-[#64748B]",
                    )}>
                      {s.num}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate">{s.title}</p>
                      <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">{s.sub}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-xs font-bold text-[#64748B] dark:text-[#94A3B8]">{s.score}</span>
                      <span className="text-sm">
                        {s.status === "done" ? "✅" : s.status === "current" ? "▶" : "🔒"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Diagnostic snapshot */}
          {mod.diag.some((d) => !d.pending) && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#64748B] dark:text-[#94A3B8] mb-2.5">
                📊 Diagnostic Snapshot
              </p>
              <div className="grid grid-cols-2 gap-3">
                {mod.diag.map((d) => (
                  <div key={d.label} className="bg-[#F8FAFC] dark:bg-[#0F1E2E] border border-[#E2E8F0] dark:border-[#2D3F55] rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold">{d.icon} {d.label}</span>
                      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", d.badgeCls)}>{d.badge}</span>
                    </div>
                    <div className="flex items-end gap-1.5 mb-1.5">
                      <span className="text-lg font-extrabold font-nunito" style={{ color: d.color }}>
                        {d.pending ? "—" : `${d.pct}%`}
                      </span>
                    </div>
                    <div className="h-1.5 bg-[#E2E8F0] dark:bg-[#2D3F55] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${d.pending ? 0 : d.pct}%`, background: d.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MELC tags */}
          {mod.melcTags.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#64748B] dark:text-[#94A3B8] mb-2">MELC Competencies</p>
              <div className="flex flex-wrap gap-1.5">
                {mod.melcTags.map((tag) => (
                  <span key={tag} className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-[#EEF2F8] dark:bg-[#162032] border border-[#E2E8F0] dark:border-[#2D3F55] text-[#64748B] dark:text-[#94A3B8] font-mono">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* CTA Footer */}
        <div className="px-6 py-4 border-t border-[#E2E8F0] dark:border-[#2D3F55] flex-shrink-0 flex gap-2.5">
          {mod.status === "in_progress" && (
            <button
              onClick={() => router.push(`/dashboard/student/modules/${mod.id}/stage/${mod.currentStage}`)}
              className="flex-1 py-3.5 rounded-xl font-nunito font-extrabold text-sm bg-gradient-to-br from-[#3B82C4] to-[#2563A0] text-white shadow-[0_4px_16px_rgba(59,130,196,0.3)] hover:-translate-y-0.5 transition-all"
            >
              ▶ Resume Stage {mod.currentStage}
            </button>
          )}
          {mod.status === "not_started" && (
            <button
              onClick={() => router.push(`/dashboard/student/modules/${mod.id}/stage/1`)}
              className="flex-1 py-3.5 rounded-xl font-nunito font-extrabold text-sm bg-gradient-to-br from-[#4A9B7F] to-[#2E7A60] text-white shadow-[0_4px_16px_rgba(74,155,127,0.3)] hover:-translate-y-0.5 transition-all"
            >
              ⚔️ Start Quest
            </button>
          )}
          {mod.status === "completed" && (
            <button
              onClick={() => router.push(`/dashboard/student/report`)}
              className="flex-1 py-3.5 rounded-xl font-nunito font-extrabold text-sm bg-gradient-to-br from-[#4A9B7F] to-[#2E7A60] text-white shadow-[0_4px_16px_rgba(74,155,127,0.3)] hover:-translate-y-0.5 transition-all"
            >
              📊 View Full Report
            </button>
          )}
          {mod.status === "locked" && (
            <div className="flex-1 py-3.5 rounded-xl font-nunito font-bold text-sm bg-[#EEF2F8] dark:bg-[#162032] text-[#94A3B8] text-center cursor-not-allowed">
              🔒 Complete {mod.unlockAfter} quest{(mod.unlockAfter ?? 0) > 1 ? "s" : ""} to unlock
            </div>
          )}
          <button
            onClick={onClose}
            className="px-4 py-3.5 rounded-xl font-nunito font-bold text-sm border border-[#E2E8F0] dark:border-[#2D3F55] text-[#64748B] hover:bg-[#EEF2F8] dark:hover:bg-[#162032] transition-all"
          >
            ✕
          </button>
        </div>
      </div>
    </>
  );
}

// ─── MODULE CARD ──────────────────────────────────────────────
function ModuleCardTile({
  mod,
  onOpen,
}: {
  mod: ModuleCard;
  onOpen: () => void;
}) {
  const router = useRouter();
  const cfg    = STATUS_CONFIG[mod.status];
  const isLocked = mod.status === "locked";

  return (
    <div
      className={cn(
        "group relative bg-white dark:bg-[#1E293B] border rounded-2xl overflow-hidden shadow-sm transition-all hover:shadow-md",
        isLocked
          ? "border-[#E2E8F0] dark:border-[#2D3F55] opacity-70"
          : "border-[#E2E8F0] dark:border-[#2D3F55] hover:-translate-y-0.5"
      )}
    >
      {/* Banner image */}
      {mod.bannerUrl ? (
        <div className="relative w-full h-28 overflow-hidden">
          <img src={mod.bannerUrl} alt={`${mod.title} banner`} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent" />
          {/* Status bar overlaid on banner */}
          <div className="absolute bottom-0 left-0 right-0 h-0.75"
            style={{
              background:
                mod.status === "completed"   ? "#4A9B7F" :
                mod.status === "in_progress" ? "#F59E0B" :
                mod.status === "locked"      ? "#94A3B8" : "#3B82C4",
            }}
          />
        </div>
      ) : (
        /* Color accent bar (no banner) */
        <div
          className="absolute top-0 left-0 right-0 h-0.75"
          style={{
            background:
              mod.status === "completed"   ? "#4A9B7F" :
              mod.status === "in_progress" ? "#F59E0B" :
              mod.status === "locked"      ? "#94A3B8" : "#3B82C4",
          }}
        />
      )}

      <div className={cn("p-5", mod.bannerUrl ? "" : "pt-6")}>
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl shrink-0">{mod.icon}</span>
            <div className="min-w-0">
              <h3 className="font-nunito font-extrabold text-sm leading-tight truncate">{mod.title}</h3>
              <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-0.5">{mod.context}</p>
            </div>
          </div>
          <span className={cn("text-[10px] font-bold px-2.5 py-1 rounded-full border whitespace-nowrap shrink-0", cfg.bg, cfg.border, cfg.text)}>
            {cfg.label}
          </span>
        </div>

        {/* Scenario snippet — stripped to plain text for compact display */}
        <p className="text-xs text-[#64748B] dark:text-[#94A3B8] leading-relaxed line-clamp-2 mb-3">
          {stripHtml(mod.scenario)}
        </p>

        {/* Pip track */}
        <div className="flex gap-[3px] mb-1.5">
          {mod.pips.map((p, i) => (
            <div
              key={i}
              className={cn(
                "flex-1 h-1.5 rounded-full",
                p === "empty" && "bg-[#E2E8F0] dark:bg-[#2D3F55]",
                p === "current" && "animate-pulse"
              )}
              style={p !== "empty" ? { background: p === "current" ? "#F59E0B" : PHASE_COLOR[p] } : undefined}
            />
          ))}
        </div>
        <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mb-3">{mod.progressText}</p>

        {/* Score + due */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {mod.percentScore > 0 && (
            <span className={cn(
              "text-[10px] font-bold px-2 py-0.5 rounded-full",
              mod.percentScore >= 80 ? "bg-[#D1FAE5] dark:bg-[#064e35] text-[#4A9B7F]" :
              mod.percentScore >= 60 ? "bg-[#FEF3C7] dark:bg-[#3d2800] text-[#F59E0B]" :
              "bg-[#FEE2E2] dark:bg-[#450a0a] text-[#E05C5C]"
            )}>
              ⭐ {mod.percentScore}%
            </span>
          )}
          {mod.dueDate && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#EDE9FE] dark:bg-[#2e1065] text-[#8B5CF6]">
              📅 {mod.dueDate}
            </span>
          )}
          {mod.timeEstimate && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#EEF2F8] dark:bg-[#162032] text-[#64748B] dark:text-[#94A3B8]">
              ⏱️ ~{mod.timeEstimate}m
            </span>
          )}
        </div>

        {/* Diag mini bars — only if data exists */}
        {mod.diag.some((d) => !d.pending) && (
          <div className="mb-4 grid grid-cols-4 gap-1">
            {mod.diag.map((d) => (
              <div key={d.label} title={`${d.label}: ${d.pending ? "Pending" : `${d.pct}%`}`}>
                <div className="h-1.5 bg-[#E2E8F0] dark:bg-[#2D3F55] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${d.pending ? 0 : d.pct}%`, background: d.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={onOpen}
            className="flex-1 py-2 rounded-xl text-xs font-nunito font-bold border border-[#E2E8F0] dark:border-[#2D3F55] text-[#64748B] hover:border-[#3B82C4] hover:text-[#3B82C4] hover:bg-[#DBEAFE] dark:hover:bg-[#1e3654] transition-all"
          >
            Details →
          </button>
          {!isLocked && (
            <button
              onClick={() => {
                if (mod.status === "in_progress" || mod.status === "not_started") {
                  router.push(`/dashboard/student/modules/${mod.id}/stage/${mod.currentStage}`);
                } else if (mod.status === "completed") {
                  router.push(`/dashboard/student/report`);
                }
              }}
              className={cn(
                "flex-1 py-2 rounded-xl text-xs font-nunito font-bold text-white transition-all hover:-translate-y-0.5",
                mod.status === "completed"   && "bg-[#4A9B7F] hover:bg-[#2E7A60]",
                mod.status === "in_progress" && "bg-[#F59E0B] hover:bg-[#D97706] text-black",
                mod.status === "not_started" && "bg-[#3B82C4] hover:bg-[#2563A0]",
              )}
            >
              {mod.status === "in_progress" ? `▶ Stage ${mod.currentStage}` :
               mod.status === "completed"   ? "📊 Report" :
               "⚔️ Start"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────
type Filter = "all" | "in_progress" | "completed" | "not_started" | "locked";

export default function MyModulesClient({ data }: { data: MyModulesData }) {
  const router = useRouter();
  const [filter,     setFilter]     = useState<Filter>("all");
  const [search,     setSearch]     = useState("");
  const [openMod,    setOpenMod]    = useState<ModuleCard | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const { student, modules, completedCount, inProgressCount } = data;

  const filtered = modules.filter((m) => {
    const matchStatus = filter === "all" || m.status === filter;
    const matchSearch = m.title.toLowerCase().includes(search.toLowerCase()) ||
                        m.context.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const FILTER_LABELS: Record<Filter, string> = {
    all:         "All",
    in_progress: "In Progress",
    completed:   "Completed",
    not_started: "Not Started",
    locked:      "Locked",
  };

  const counts: Record<Filter, number> = {
    all:         modules.length,
    in_progress: modules.filter(m=>m.status==="in_progress").length,
    completed:   modules.filter(m=>m.status==="completed").length,
    not_started: modules.filter(m=>m.status==="not_started").length,
    locked:      modules.filter(m=>m.status==="locked").length,
  };

  function navigate(path: string, key: string) {
    setMobileOpen(false);
    router.push(path);
  }

  return (
    <>
      <style>{`
        .font-nunito { font-family: var(--font-nunito, 'Nunito', sans-serif); }
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideInLeft { from { transform:translateX(-100%); } to { transform:translateX(0); } }
        .fade-up { animation: fadeUp 0.35s ease both; }
        .slide-in-left { animation: slideInLeft 0.25s cubic-bezier(.34,1.1,.64,1) both; }
        .line-clamp-2 { display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
      `}</style>

      <div className="flex min-h-screen bg-[#F0F4F8] text-[#1E293B]">

        <StudentSidebar
          student={student}
          modulesAssigned={modules.length}
          activeNav="modules"
          onNavigate={navigate}
          mobileOpen={mobileOpen}
          onMobileOpen={setMobileOpen}
        />

        {/* ── MAIN ── */}
        <main className="flex-1 min-w-0 overflow-x-hidden p-4 sm:p-6 lg:p-8 pb-28 md:pb-8">

          {/* Mobile topbar */}
          <div className="flex items-center gap-3 mb-4 md:hidden fade-up">
            <HamburgerButton onClick={() => setMobileOpen(true)} />
            <h1 className="font-nunito text-[17px] font-extrabold flex-1 truncate">🗺️ My Modules</h1>
          </div>

          {/* Desktop page title */}
          <div className="hidden md:block mb-6 fade-up">
            <h1 className="font-nunito text-2xl font-extrabold">🗺️ My Modules</h1>
            <p className="text-sm text-[#64748B] mt-0.5">
              {student.name} · {student.section} · {student.difficulty}
            </p>
          </div>

          {/* ── STAT CARDS ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 fade-up">
            {[
              { icon:"📦", val:String(modules.length),  label:"Total Quests",  color:"#3B82C4", bg:"bg-[#EFF6FF]" },
              { icon:"⚡", val:String(inProgressCount),  label:"In Progress",   color:"#F59E0B", bg:"bg-[#FFFBEB]" },
              { icon:"✅", val:String(completedCount),   label:"Completed",     color:"#4A9B7F", bg:"bg-[#F0FDF4]" },
              { icon:"🔒", val:String(counts.locked),    label:"Locked",        color:"#94A3B8", bg:"bg-[#F8FAFC]" },
            ].map((s) => (
              <div key={s.label} className={cn("relative rounded-2xl p-4 overflow-hidden border-0", s.bg)}>
                <div className="absolute top-0 left-0 w-1 h-full rounded-l-2xl" style={{ background: s.color }} />
                <div className="text-2xl mb-1">{s.icon}</div>
                <div className="font-nunito text-2xl font-extrabold mb-0.5" style={{ color: s.color }}>{s.val}</div>
                <div className="text-[13px] font-bold text-[#374151]">{s.label}</div>
              </div>
            ))}
          </div>

          {/* ── FILTER + SEARCH ── */}
          <div className="flex flex-wrap items-center gap-2 mb-5 fade-up">
            <div className="flex flex-wrap gap-1.5 flex-1">
              {(Object.entries(FILTER_LABELS) as [Filter, string][]).map(([f, label]) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "font-nunito font-bold text-xs px-3.5 py-2 rounded-2xl border-2 transition-all min-h-[36px]",
                    filter === f
                      ? "bg-[#3B82C4] text-white border-[#3B82C4]"
                      : "bg-white text-[#64748B] border-[#E2E8F0] hover:border-[#3B82C4] hover:text-[#3B82C4]"
                  )}
                >
                  {label}
                  {counts[f] > 0 && (
                    <span className={cn(
                      "ml-1.5 text-[10px] font-black px-1.5 py-0.5 rounded-full",
                      filter === f ? "bg-white/30 text-white" : "bg-[#EEF2F8] text-[#64748B]"
                    )}>
                      {counts[f]}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <div className="relative w-full sm:w-auto">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#94A3B8] pointer-events-none">🔍</span>
              <input
                placeholder="Search modules…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 h-10 text-sm bg-white border-2 border-[#E2E8F0] rounded-2xl w-full sm:w-[200px] focus:outline-none focus:border-[#3B82C4] text-[#1E293B] placeholder:text-[#94A3B8]"
              />
            </div>
          </div>

          {/* ── MODULE GRID ── */}
          {filtered.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-[#E2E8F0] rounded-3xl bg-white fade-up">
              <div className="text-5xl mb-3">🔍</div>
              <h3 className="font-nunito text-lg font-extrabold mb-1.5">
                {modules.length === 0 ? "No modules assigned yet" : "No modules found"}
              </h3>
              <p className="text-sm text-[#64748B] mb-5">
                {modules.length === 0
                  ? "Your teacher hasn't assigned any modules to your section yet."
                  : "Try adjusting your filter or search."}
              </p>
              {modules.length > 0 && (
                <button
                  onClick={() => { setFilter("all"); setSearch(""); }}
                  className="px-5 py-2.5 rounded-2xl font-nunito font-bold text-sm border-2 border-[#E2E8F0] text-[#64748B] hover:border-[#3B82C4] hover:text-[#3B82C4] transition-all"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 fade-up">
              {filtered.map((mod) => (
                <ModuleCardTile
                  key={mod.id}
                  mod={mod}
                  onOpen={() => setOpenMod(mod)}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Detail Drawer */}
      <ModuleDrawer
        mod={openMod}
        open={!!openMod}
        onClose={() => setOpenMod(null)}
      />

      <StudentBottomNav
        activeNav="modules"
        modulesAssigned={modules.length}
        mobileOpen={mobileOpen}
        onNavigate={navigate}
        onMobileOpen={setMobileOpen}
      />
    </>
  );
}