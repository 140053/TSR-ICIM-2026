"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const THEME_KEY = "teacher-theme";

function NavItem({
  icon, label, active, badge, badgeDanger, onClick,
}: {
  icon: string; label: string; active?: boolean;
  badge?: string | number; badgeDanger?: boolean; onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{ width: "calc(100% - 20px)" }}
      className={cn(
        "flex items-center gap-2.5 px-5 py-2.5 mx-2.5 rounded-xl text-sm font-medium transition-all",
        "hover:bg-[#EEF2F8] dark:hover:bg-[#162032] hover:text-[#1E293B] dark:hover:text-[#F1F5F9]",
        active
          ? "bg-[#D1FAE5] dark:bg-[#063c28] text-[#4A9B7F] font-bold"
          : "text-[#64748B] dark:text-[#94A3B8]"
      )}
    >
      <span className="text-[17px] w-5 text-center shrink-0">{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      {badge !== undefined && (
        <span className={cn(
          "text-[11px] font-bold px-2 py-0.5 rounded-full",
          badgeDanger ? "bg-[#E05C5C] text-white" : "bg-[#4A9B7F] text-white"
        )}>
          {badge}
        </span>
      )}
    </button>
  );
}

function ThemeToggle({ dark, onToggle }: { dark: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs font-bold transition-all border",
        dark
          ? "bg-white/10 text-white hover:bg-white/20 border-white/20"
          : "bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0] border-[#E2E8F0]"
      )}
    >
      <span className="text-base leading-none">{dark ? "☀️" : "🌙"}</span>
      <span>{dark ? "Light Mode" : "Dark Mode"}</span>
      <span className={cn(
        "ml-auto w-9 h-5 rounded-full relative shrink-0 transition-colors overflow-hidden",
        dark ? "bg-[#4A9B7F]" : "bg-[#CBD5E1]"
      )}>
        <span className={cn(
          "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200",
          dark ? "translate-x-4" : "translate-x-0"
        )} />
      </span>
    </button>
  );
}

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
      className="text-xs text-[#64748B] dark:text-[#94A3B8] hover:text-[#E05C5C] transition-colors font-semibold px-2 py-1 rounded-lg hover:bg-[#FEE2E2] dark:hover:bg-[#450a0a] disabled:opacity-50"
    >
      {busy ? "…" : "Sign out"}
    </button>
  );
}

export interface TeacherSidebarProps {
  teacherName:       string;
  teacherInitials:   string;
  teacherSection:    string;
  totalStudents:     number;
  pendingGradeCount: number;
  activePath:        "dashboard" | "students" | "reports" | "modules" | "tests" | "grade" | "contexts" | "profile";
}

function SidebarInner({
  teacherName, teacherInitials, teacherSection,
  totalStudents, pendingGradeCount, activePath, onNavigate,
  theme, onToggleTheme,
}: TeacherSidebarProps & {
  onNavigate:    (path: string) => void;
  theme:         "light" | "dark";
  onToggleTheme: () => void;
}) {
  return (
    <>
      {/* Logo */}
      <div className="px-6 pb-7 border-b border-[#E2E8F0] dark:border-[#334155] mb-4">
        <div className="w-[38px] h-[38px] rounded-xl bg-gradient-to-br from-[#4A9B7F] to-[#8B5CF6] flex items-center justify-center text-white font-extrabold text-base font-nunito mb-2.5">
          T
        </div>
        <h2 className="font-nunito text-[15px] font-extrabold leading-snug">Think–Solve<br />–Reflect</h2>
        <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">Teacher Portal</span>
      </div>

      {/* Nav */}
      <div className="px-2 py-1 text-[10px] font-bold tracking-[0.08em] uppercase text-[#64748B] dark:text-[#94A3B8] mb-1 pl-4">Overview</div>
      <NavItem icon="🏠" label="Dashboard"     active={activePath === "dashboard"} onClick={() => onNavigate("/dashboard/teacher")} />
      <NavItem icon="👥" label="Students"      active={activePath === "students"}  badge={totalStudents} onClick={() => onNavigate("/dashboard/teacher/students")} />
      <NavItem icon="📊" label="Class Reports" active={activePath === "reports"}   onClick={() => onNavigate("/dashboard/teacher/reports")} />

      <div className="px-2 py-1 mt-3 text-[10px] font-bold tracking-[0.08em] uppercase text-[#64748B] dark:text-[#94A3B8] mb-1 pl-4">Manage</div>
      <NavItem icon="📦" label="Modules"          active={activePath === "modules"}   onClick={() => onNavigate("/dashboard/teacher/modules")} />
      <NavItem icon="📝" label="Test Results"      active={activePath === "tests"}     onClick={() => onNavigate("/dashboard/teacher/tests")} />
      <NavItem
        icon="✍️"
        label="Grade Open Items"
        badge={pendingGradeCount > 0 ? pendingGradeCount : undefined}
        badgeDanger
        active={activePath === "grade"}
        onClick={() => onNavigate("/dashboard/teacher/grade")}
      />
      <NavItem icon="🏷️" label="Contexts"          active={activePath === "contexts"}  onClick={() => onNavigate("/dashboard/teacher/contexts")} />

      {/* User */}
      <div className="mt-auto pt-4 border-t border-[#E2E8F0] dark:border-[#334155] px-3.5 flex flex-col gap-2">
        <ThemeToggle dark={theme === "dark"} onToggle={onToggleTheme} />

        <button
          onClick={() => onNavigate("/dashboard/teacher/profile")}
          className={cn(
            "flex items-center gap-2.5 p-2.5 rounded-xl w-full transition-all hover:bg-[#EEF2F8] dark:hover:bg-[#162032] group",
            activePath === "profile" && "bg-[#D1FAE5] dark:bg-[#063c28]"
          )}
        >
          <div className={cn(
            "w-9 h-9 rounded-full flex items-center justify-center text-sm font-extrabold font-nunito shrink-0 transition-colors",
            activePath === "profile"
              ? "bg-[#4A9B7F] text-white"
              : "bg-[#D1FAE5] dark:bg-[#063c28] text-[#4A9B7F]"
          )}>
            {teacherInitials}
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className="text-[13px] font-bold truncate">{teacherName}</p>
            <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8] group-hover:text-[#4A9B7F] transition-colors">
              View Profile →
            </span>
          </div>
        </button>
        <div className="flex justify-end pr-1 mt-1">
          <LogoutButton />
        </div>
      </div>
    </>
  );
}

export default function TeacherSidebar(props: TeacherSidebarProps) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Read saved theme on mount and apply to <html>
  useEffect(() => {
    const saved = localStorage.getItem(THEME_KEY) as "light" | "dark" | null;
    const resolved = saved ?? "light";
    setTheme(resolved);
    if (resolved === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  function toggleTheme() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem(THEME_KEY, next);
    if (next === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }

  function navigate(path: string) {
    setMobileOpen(false);
    router.push(path);
  }

  return (
    <>
      <style>{`
        @keyframes tsrSlideIn {
          from { transform: translateX(-100%); }
          to   { transform: translateX(0); }
        }
        .tsr-slide-in { animation: tsrSlideIn 0.26s cubic-bezier(.34,1.1,.64,1) both; }
        .font-nunito  { font-family: var(--font-nunito, 'Nunito', sans-serif); }
      `}</style>

      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="hidden md:flex w-[240px] min-h-screen bg-white dark:bg-[#1E293B] border-r border-[#E2E8F0] dark:border-[#334155] flex-col py-7 flex-shrink-0 sticky top-0 h-screen overflow-y-auto">
        <SidebarInner {...props} onNavigate={(path) => router.push(path)} theme={theme} onToggleTheme={toggleTheme} />
      </aside>

      {/* ── MOBILE FIXED TOP BAR ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 h-14 bg-white dark:bg-[#1E293B] border-b border-[#E2E8F0] dark:border-[#334155] flex items-center px-4 gap-3 shadow-sm">
        <button
          onClick={() => setMobileOpen(true)}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#EEF2F8] dark:bg-[#162032] border border-[#E2E8F0] dark:border-[#334155] text-[#64748B] flex-shrink-0 active:scale-95 transition-all"
          aria-label="Open menu"
        >
          <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
            <rect y="0"  width="18" height="2" rx="1" fill="currentColor"/>
            <rect y="6"  width="14" height="2" rx="1" fill="currentColor"/>
            <rect y="12" width="18" height="2" rx="1" fill="currentColor"/>
          </svg>
        </button>
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#4A9B7F] to-[#8B5CF6] flex items-center justify-center text-white font-extrabold text-sm font-nunito flex-shrink-0">
          T
        </div>
        <div className="min-w-0">
          <p className="font-nunito text-[13px] font-extrabold leading-none truncate">Think–Solve–Reflect</p>
          <p className="text-[10px] text-[#64748B] dark:text-[#94A3B8] mt-0.5">Teacher Portal</p>
        </div>
      </div>

      {/* ── MOBILE OVERLAY + SLIDE-IN SIDEBAR ── */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed top-0 left-0 bottom-0 z-50 w-[280px] bg-white dark:bg-[#1E293B] border-r border-[#E2E8F0] dark:border-[#334155] flex flex-col py-7 overflow-y-auto md:hidden shadow-2xl tsr-slide-in">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-xl bg-[#EEF2F8] dark:bg-[#162032] text-[#64748B] hover:text-[#1E293B] dark:hover:text-white transition-colors text-base font-bold"
              aria-label="Close menu"
            >
              ✕
            </button>
            <SidebarInner {...props} onNavigate={navigate} theme={theme} onToggleTheme={toggleTheme} />
          </aside>
        </>
      )}
    </>
  );
}
