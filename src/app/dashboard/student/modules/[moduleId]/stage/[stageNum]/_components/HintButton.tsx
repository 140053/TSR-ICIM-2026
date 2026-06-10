// HintButton.tsx
// Difficulty-aware hint toggle for the stage player.
//
//   APPRENTICE  → free hint, instant reveal, "Free" badge
//   ADVENTURER  → one confirmation step warning about potential score impact
//   CHAMPION    → renders null (hints disabled)
//
// Usage:
//   <HintButton hint={hint} difficulty={difficulty} color={color}
//               open={showHint} onToggle={setShowHint} />
//   …and separately in the animated content area:
//   <HintBox hint={hint} open={showHint} />
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// ─── HintBox ─────────────────────────────────────────────────
// Animated reveal box; place inside the page's motion.div.

export function HintBox({ hint, open }: { hint: string | null; open: boolean }) {
  return (
    <AnimatePresence>
      {open && hint && (
        <motion.div
          key="hint-box"
          initial={{ opacity: 0, y: -10, scale: 0.97 }}
          animate={{ opacity: 1, y: 0,   scale: 1     }}
          exit={{    opacity: 0, y: -8,  scale: 0.97  }}
          transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
          className="mx-3 sm:mx-5 mt-4 rounded-xl border text-sm leading-relaxed overflow-hidden"
          style={{ borderColor: "#F59E0B" }}
        >
          {/* Top bar */}
          <div className="flex items-center gap-2 px-4 py-2 bg-[#FEF3C7] dark:bg-[#3d2800] border-b border-[#FDE68A] dark:border-[#78350f]">
            <span className="text-base">💡</span>
            <span
              className="text-xs font-extrabold text-[#B45309]"
              style={{ fontFamily: "var(--font-nunito,'Nunito',sans-serif)" }}
            >
              Hint
            </span>
          </div>
          {/* Body */}
          <div className="px-4 py-3 bg-[#FFFBEB] dark:bg-[#2a1f00] text-[#92400E] dark:text-[#FDE68A]">
            {hint}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Adventurer confirmation popover ─────────────────────────

function ConfirmPopover({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel:  () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.93, y: -4 }}
      animate={{ opacity: 1, scale: 1,    y: 0   }}
      exit={{    opacity: 0, scale: 0.93, y: -4  }}
      transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
      className="absolute right-0 top-full mt-2 z-50 w-64 bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#2D3F55] rounded-2xl shadow-2xl overflow-hidden"
      style={{ fontFamily: "var(--font-nunito,'Nunito',sans-serif)" }}
    >
      <div className="px-4 py-2.5 bg-[#FEF3C7] dark:bg-[#3d2800] border-b border-[#FDE68A] dark:border-[#78350f] flex items-center gap-2">
        <span>⚠️</span>
        <p className="text-xs font-extrabold text-[#B45309]">Score Impact Warning</p>
      </div>
      <div className="px-4 py-3">
        <p className="text-xs text-[#64748B] dark:text-[#94A3B8] leading-relaxed mb-3">
          As an{" "}
          <span className="font-bold text-[#1E293B] dark:text-[#E2E8F0]">Adventurer</span>,
          using a hint may reduce your maximum score for this stage. Continue?
        </p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-1.5 rounded-xl text-xs font-bold border border-[#E2E8F0] dark:border-[#2D3F55] text-[#64748B] hover:bg-[#F8FAFC] dark:hover:bg-[#162032] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-1.5 rounded-xl text-xs font-bold text-white transition-all hover:-translate-y-0.5"
            style={{ background: "#F59E0B" }}
          >
            Show Hint
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── HintButton ───────────────────────────────────────────────

interface HintButtonProps {
  hint:       string | null;
  difficulty: "APPRENTICE" | "ADVENTURER" | "CHAMPION";
  color:      string;
  open:       boolean;
  onToggle:   (v: boolean) => void;
}

export default function HintButton({
  hint, difficulty, color, open, onToggle,
}: HintButtonProps) {
  const [confirm, setConfirm] = useState(false);

  // No hint available or CHAMPION — render nothing
  if (!hint || difficulty === "CHAMPION") return null;

  const handleClick = () => {
    if (open) {
      onToggle(false);
      setConfirm(false);
      return;
    }
    if (difficulty === "ADVENTURER") {
      setConfirm(v => !v);
    } else {
      // APPRENTICE — instant
      onToggle(true);
    }
  };

  const handleConfirm = () => {
    setConfirm(false);
    onToggle(true);
  };

  // Difficulty badge
  const badge =
    difficulty === "APPRENTICE"
      ? { label: "Free",   bg: "#D1FAE5", text: "#065f46" }
      : { label: "−pts",   bg: "#FEF3C7", text: "#92400E" };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleClick}
        aria-pressed={open}
        className={cn(
          "flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border transition-all",
          open
            ? "bg-[#FEF3C7] dark:bg-[#3d2800] border-[#F59E0B] text-[#F59E0B]"
            : "border-[#E2E8F0] dark:border-[#2D3F55] text-[#64748B] hover:border-[#F59E0B] hover:text-[#F59E0B]"
        )}
      >
        <span>💡</span>
        <span>Hint</span>
        {!open && (
          <span
            className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full leading-none"
            style={{ background: badge.bg, color: badge.text }}
          >
            {badge.label}
          </span>
        )}
        {open && <span className="text-[10px] opacity-60 ml-0.5">✕</span>}
      </button>

      {/* Adventurer confirmation popover */}
      <AnimatePresence>
        {confirm && (
          <ConfirmPopover onConfirm={handleConfirm} onCancel={() => setConfirm(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
