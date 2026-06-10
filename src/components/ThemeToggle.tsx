// components/ThemeToggle.tsx
// Usage:
//   <ThemeToggle />                 — pill toggle (default)
//   <ThemeToggle variant="icon" />  — icon button only (topbar)
//   <ThemeToggle variant="pill" />  — pill with label text
//   <ThemeToggle variant="card" />  — settings row with description
//   <ThemeToggle variant="nav" />   — sidebar nav item with mini-toggle
"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

// ─── Icons ────────────────────────────────────────────────────
function SunIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className={className}>
      <circle cx="8" cy="8" r="3.5" />
      <line x1="8" y1="1"    x2="8"    y2="2.5" />
      <line x1="8" y1="13.5" x2="8"    y2="15"  />
      <line x1="1" y1="8"    x2="2.5"  y2="8"   />
      <line x1="13.5" y1="8" x2="15"   y2="8"   />
      <line x1="3"    y1="3"    x2="4.1"  y2="4.1"  />
      <line x1="11.9" y1="11.9" x2="13"   y2="13"   />
      <line x1="13"   y1="3"    x2="11.9" y2="4.1"  />
      <line x1="4.1"  y1="11.9" x2="3"    y2="13"   />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className}>
      <path
        d="M6.5 2.5a4.5 4.5 0 1 0 6 6A6.5 6.5 0 0 1 6.5 2.5z"
        fill="currentColor"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ─── Hook ─────────────────────────────────────────────────────
export function useTheme() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("tsr_theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = stored ? stored === "dark" : prefersDark;
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("tsr_theme", next ? "dark" : "light");
  };

  return { dark, toggle };
}

// ─── Variants ─────────────────────────────────────────────────
type Variant = "toggle" | "icon" | "pill" | "card" | "nav";

interface ThemeToggleProps {
  variant?: Variant;
  className?: string;
}

// ── Variant 1: pill toggle (default) ─────────────────────────
function PillToggle({ dark, toggle, className }: { dark: boolean; toggle: () => void; className?: string }) {
  return (
    <label
      className={cn("relative inline-flex items-center cursor-pointer select-none", className)}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <input
        type="checkbox"
        checked={dark}
        onChange={toggle}
        className="sr-only"
      />
      {/* Track */}
      <div className={cn(
        "w-[52px] h-7 rounded-full border transition-all duration-200",
        dark
          ? "bg-[#1A2E1C] border-[#4A9B7F]"
          : "bg-[#EBF0EC] dark:bg-[#0A180E] border-[#DDE8DF] dark:border-[#1E3524]"
      )} />
      {/* Thumb */}
      <div className={cn(
        "absolute top-1 left-1 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200",
        dark
          ? "translate-x-6 bg-[#4A9B7F] text-white"
          : "translate-x-0 bg-white dark:bg-[#334155] text-[#5A7860] dark:text-[#94A3B8] shadow-sm"
      )}>
        {dark
          ? <MoonIcon className="w-[11px] h-[11px]" />
          : <SunIcon  className="w-[11px] h-[11px]" />}
      </div>
    </label>
  );
}

// ── Variant 2: icon button ────────────────────────────────────
function IconButton({ dark, toggle, className }: { dark: boolean; toggle: () => void; className?: string }) {
  return (
    <button
      onClick={toggle}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "w-9 h-9 rounded-xl flex items-center justify-center transition-all",
        "border border-[#DDE8DF] dark:border-[#1E3524]",
        "bg-white dark:bg-[#132018] hover:bg-[#EBF0EC] dark:hover:bg-[#0A180E]",
        "text-[#5A7860] dark:text-[#7BAF84]",
        className
      )}
    >
      {dark
        ? <MoonIcon className="w-4 h-4" />
        : <SunIcon  className="w-4 h-4" />}
    </button>
  );
}

// ── Variant 3: pill with label ────────────────────────────────
function PillLabel({ dark, toggle, className }: { dark: boolean; toggle: () => void; className?: string }) {
  return (
    <button
      onClick={toggle}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium transition-all",
        "border-[#DDE8DF] dark:border-[#1E3524]",
        "bg-white dark:bg-[#132018] hover:bg-[#EBF0EC] dark:hover:bg-[#0A180E]",
        "text-[#5A7860] dark:text-[#7BAF84] hover:text-[#1A2E1C] dark:hover:text-[#E8F5EB]",
        className
      )}
    >
      {dark
        ? <MoonIcon className="w-3.5 h-3.5 flex-shrink-0" />
        : <SunIcon  className="w-3.5 h-3.5 flex-shrink-0" />}
      <span>{dark ? "Dark mode" : "Light mode"}</span>
    </button>
  );
}

// ── Variant 4: settings card row ─────────────────────────────
function CardRow({ dark, toggle, className }: { dark: boolean; toggle: () => void; className?: string }) {
  return (
    <div className={cn(
      "flex items-center justify-between gap-3 p-4",
      "bg-white dark:bg-[#132018] border border-[#DDE8DF] dark:border-[#1E3524] rounded-2xl",
      className
    )}>
      <div>
        <p className="text-sm font-bold text-[#1A2E1C] dark:text-[#E8F5EB]">Dark mode</p>
        <p className="text-xs text-[#5A7860] dark:text-[#7BAF84] mt-0.5">
          Switch between light and dark theme
        </p>
      </div>
      <PillToggle dark={dark} toggle={toggle} />
    </div>
  );
}

// ── Variant 5: sidebar nav item ───────────────────────────────
function NavItem({ dark, toggle, className }: { dark: boolean; toggle: () => void; className?: string }) {
  return (
    <button
      onClick={toggle}
      style={{ width: "calc(100% - 20px)" }}
      className={cn(
        "flex items-center gap-2.5 px-[18px] py-2.5 mx-2.5 rounded-xl text-sm font-medium transition-all",
        "hover:bg-[#EBF0EC] dark:hover:bg-[#0A180E]",
        "text-[#5A7860] dark:text-[#7BAF84]",
        className
      )}
    >
      {dark
        ? <MoonIcon className="w-[17px] h-[17px] flex-shrink-0" />
        : <SunIcon  className="w-[17px] h-[17px] flex-shrink-0" />}
      <span className="flex-1 text-left">{dark ? "Dark mode" : "Light mode"}</span>
      {/* Mini toggle indicator */}
      <div className={cn(
        "w-8 h-4 rounded-full border transition-all flex-shrink-0 relative",
        dark
          ? "bg-[#1A2E1C] border-[#4A9B7F]"
          : "bg-[#EBF0EC] dark:bg-[#0A180E] border-[#DDE8DF] dark:border-[#1E3524]"
      )}>
        <div className={cn(
          "absolute top-[2px] w-3 h-3 rounded-full transition-all duration-200",
          dark
            ? "left-[14px] bg-[#4A9B7F]"
            : "left-[2px] bg-[#92A894] dark:bg-[#5A7860]"
        )} />
      </div>
    </button>
  );
}

// ─── Main export ──────────────────────────────────────────────
export default function ThemeToggle({ variant = "toggle", className }: ThemeToggleProps) {
  const { dark, toggle } = useTheme();

  switch (variant) {
    case "icon":   return <IconButton dark={dark} toggle={toggle} className={className} />;
    case "pill":   return <PillLabel  dark={dark} toggle={toggle} className={className} />;
    case "card":   return <CardRow    dark={dark} toggle={toggle} className={className} />;
    case "nav":    return <NavItem    dark={dark} toggle={toggle} className={className} />;
    default:       return <PillToggle dark={dark} toggle={toggle} className={className} />;
  }
}

// ─── Named exports for individual use ─────────────────────────
export { PillToggle, IconButton, PillLabel, CardRow, NavItem };