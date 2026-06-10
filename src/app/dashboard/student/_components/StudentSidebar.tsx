// app/dashboard/student/_components/StudentSidebar.tsx
// Shared sidebar + bottom nav used by all student dashboard pages.
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

// ─── PUBLIC TYPES ─────────────────────────────────────────────
export interface SidebarStudent {
  name:        string;
  avatarEmoji: string;
  xp:          number;
  level:       number;
}

export interface StudentSidebarProps {
  student:         SidebarStudent;
  modulesAssigned: number;
  activeNav:       string;
  onNavigate:      (path: string, key: string) => void;
  mobileOpen:      boolean;
  onMobileOpen:    (open: boolean) => void;
}

// ─── XP BAR ───────────────────────────────────────────────────
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
          className="h-full bg-gradient-to-r from-yellow-300 to-yellow-400 rounded-full transition-all duration-700"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

// ─── NAV ITEM ─────────────────────────────────────────────────
function NavItem({
  icon, label, active, badge, onClick,
}: {
  icon: string; label: string; active?: boolean;
  badge?: string | number; onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-4 py-3 mx-2 rounded-2xl text-sm font-bold transition-all w-[calc(100%-16px)] min-h-[48px]",
        "hover:bg-[#EEF2F8]",
        active
          ? "bg-[#DBEAFE] text-[#3B82C4] shadow-sm"
          : "text-[#64748B]"
      )}
    >
      <span className="text-xl w-6 text-center flex-shrink-0">{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      {badge !== undefined && (
        <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-[#3B82C4] text-white min-w-[22px] text-center">
          {badge}
        </span>
      )}
    </button>
  );
}

// ─── LOGOUT BUTTON ────────────────────────────────────────────
function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const handleLogout = async () => {
    setBusy(true);
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.push("/login");
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      disabled={busy}
      className="w-full flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold text-[#64748B] hover:text-[#E05C5C] hover:bg-[#FEF2F2] transition-all disabled:opacity-50 min-h-[44px]"
    >
      <span>🚪</span>
      <span>{busy ? "Signing out…" : "Sign Out"}</span>
    </button>
  );
}

// ─── SIDEBAR INNER CONTENT ────────────────────────────────────
function SidebarInner({
  student, modulesAssigned, activeNav, onNavigate,
}: {
  student:         SidebarStudent;
  modulesAssigned: number;
  activeNav:       string;
  onNavigate:      (path: string, key: string) => void;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo + Student card */}
      <div className="px-5 pb-5 border-b border-[#E2E8F0] mb-3">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#3B82C4] to-[#4A9B7F] flex items-center justify-center text-white font-extrabold text-lg font-nunito shadow-sm">
            T
          </div>
          <div>
            <h2 className="font-nunito text-sm font-extrabold leading-snug">Think–Solve–Reflect</h2>
            <span className="text-[11px] text-[#94A3B8]">Grade 6 Mathematics</span>
          </div>
        </div>
        <div className="p-3 bg-gradient-to-r from-[#EFF6FF] to-[#F0FDF4] rounded-2xl">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-lg">{student.avatarEmoji}</span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-extrabold truncate">{student.name}</p>
              <p className="text-[11px] text-[#64748B]">⭐ Level {student.level} · {student.xp} XP</p>
            </div>
          </div>
          <div className="h-2 bg-white/60 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#3B82C4] to-[#4A9B7F] rounded-full transition-all"
              style={{ width: `${(student.xp % 1000) / 10}%` }}
            />
          </div>
        </div>
      </div>

      {/* Nav */}
      <div className="px-4 py-1 text-[10px] font-extrabold tracking-widest uppercase text-[#94A3B8] mb-1">
        Learning
      </div>
      <NavItem icon="🏠" label="Dashboard"  active={activeNav === "dashboard"}    onClick={() => onNavigate("/dashboard/student", "dashboard")} />
      <NavItem icon="📚" label="My Modules" active={activeNav === "modules"}      badge={modulesAssigned} onClick={() => onNavigate("/dashboard/student/modules", "modules")} />
      <NavItem icon="📝" label="Pre-Test"   active={activeNav === "pretest"}      onClick={() => onNavigate("/dashboard/student/pre-test", "pretest")} />
      <NavItem icon="✅" label="Post-Test"  active={activeNav === "posttest"}     onClick={() => onNavigate("/dashboard/student/post-test", "posttest")} />

      <div className="px-4 py-1 mt-3 text-[10px] font-extrabold tracking-widest uppercase text-[#94A3B8] mb-1">
        Progress
      </div>
      <NavItem icon="📊" label="My Report"    active={activeNav === "report"}       onClick={() => onNavigate("/dashboard/student/report", "report")} />
      <NavItem icon="🏆" label="Achievements" active={activeNav === "achievements"} onClick={() => onNavigate("/dashboard/student/achievements", "achievements")} />

      {/* Profile + logout */}
      <div className="mt-auto pt-3 border-t border-[#E2E8F0] px-2">
        <button
          onClick={() => onNavigate("/dashboard/student/profile", "profile")}
          className="flex items-center gap-2.5 p-3 rounded-2xl w-full hover:bg-[#EEF2F8] transition-all group min-h-[48px]"
        >
          <div className="text-2xl shrink-0">{student.avatarEmoji}</div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-bold truncate">{student.name}</p>
            <span className="text-[11px] text-[#64748B] group-hover:text-[#3B82C4] transition-colors">
              View Profile →
            </span>
          </div>
        </button>
        <LogoutButton />
      </div>
    </div>
  );
}

// ─── MAIN EXPORT: SIDEBAR (desktop + mobile overlay) ──────────
export function StudentSidebar({
  student, modulesAssigned, activeNav, onNavigate, mobileOpen, onMobileOpen,
}: StudentSidebarProps) {
  const innerProps = { student, modulesAssigned, activeNav, onNavigate };

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-[260px] min-h-screen bg-white border-r border-[#E2E8F0] flex-col py-6 flex-shrink-0 sticky top-0 h-screen overflow-y-auto shadow-sm">
        <SidebarInner {...innerProps} />
      </aside>

      {/* Mobile overlay + drawer */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
            onClick={() => onMobileOpen(false)}
          />
          <aside className="fixed top-0 left-0 bottom-0 z-50 w-[288px] bg-white border-r border-[#E2E8F0] flex flex-col py-6 overflow-y-auto md:hidden shadow-2xl slide-in-left">
            <button
              onClick={() => onMobileOpen(false)}
              className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-2xl bg-[#F1F5F9] text-[#64748B] hover:text-[#1E293B] transition-colors text-lg font-bold"
              aria-label="Close menu"
            >
              ✕
            </button>
            <SidebarInner {...innerProps} />
          </aside>
        </>
      )}
    </>
  );
}

// ─── BOTTOM NAV ───────────────────────────────────────────────
export function StudentBottomNav({
  activeNav,
  modulesAssigned,
  mobileOpen,
  onNavigate,
  onMobileOpen,
}: {
  activeNav:       string;
  modulesAssigned: number;
  mobileOpen:      boolean;
  onNavigate:      (path: string, key: string) => void;
  onMobileOpen:    (open: boolean) => void;
}) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white border-t-2 border-[#E2E8F0] shadow-[0_-4px_24px_rgba(0,0,0,0.08)] flex items-center px-2 pb-safe pt-1">
      <BottomNavBtn icon="🏠" label="Home"    active={activeNav === "dashboard"}    onClick={() => onNavigate("/dashboard/student", "dashboard")} />
      <BottomNavBtn icon="📚" label="Modules" active={activeNav === "modules"}      badge={modulesAssigned} onClick={() => onNavigate("/dashboard/student/modules", "modules")} />
      <BottomNavBtn icon="📊" label="Report"  active={activeNav === "report"}       onClick={() => onNavigate("/dashboard/student/report", "report")} />
      <BottomNavBtn icon="🏆" label="Badges"  active={activeNav === "achievements"} onClick={() => onNavigate("/dashboard/student/achievements", "achievements")} />
      <BottomNavBtn icon="☰"  label="More"    active={mobileOpen}                  onClick={() => onMobileOpen(true)} />
    </nav>
  );
}

function BottomNavBtn({
  icon, label, active, badge, onClick,
}: {
  icon: string; label: string; active?: boolean; badge?: number; onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-0.5 flex-1 py-2 px-1 rounded-2xl transition-all min-h-[56px] active:scale-95",
        active ? "bg-[#DBEAFE] text-[#3B82C4]" : "text-[#94A3B8]"
      )}
    >
      <span className="relative text-2xl leading-none">
        {icon}
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-1 -right-2 min-w-[18px] h-[18px] bg-[#3B82C4] text-white text-[10px] font-extrabold rounded-full flex items-center justify-center px-1">
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </span>
      <span className={cn("text-[11px] font-extrabold", active ? "text-[#3B82C4]" : "text-[#94A3B8]")}>
        {label}
      </span>
    </button>
  );
}

// ─── HAMBURGER BUTTON (mobile topbar) ─────────────────────────
export function HamburgerButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-2xl bg-white border border-[#E2E8F0] text-[#64748B] shadow-sm active:scale-95 transition-all"
      aria-label="Open menu"
    >
      <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
        <rect y="0"  width="18" height="2" rx="1" fill="currentColor"/>
        <rect y="6"  width="14" height="2" rx="1" fill="currentColor"/>
        <rect y="12" width="18" height="2" rx="1" fill="currentColor"/>
      </svg>
    </button>
  );
}
