// FeedbackCard.tsx
// Animated result card shown after a stage is saved.
// Auto-scored stages → correct / partial / wrong result
// Teacher-graded stages → "Submitted for review"
"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────

export interface FeedbackResult {
  isCorrect:  boolean | null; // null = teacher-graded
  score:      number | null;
  maxScore:   number;
  stageNum:   number;
  phaseColor: string;
}

interface FeedbackCardProps {
  result:     FeedbackResult | null;
  onContinue: () => void;
}

// ─── Copy per result state ────────────────────────────────────

const CORRECT_MSGS = [
  "Excellent work! You nailed it.",
  "That's exactly right! Keep going.",
  "Well done — perfect answer!",
  "Outstanding! You've got this.",
];

const PARTIAL_MSGS = [
  "Good effort! Every point counts.",
  "Nice try — keep pushing forward.",
  "Not quite full marks, but you're on track!",
  "Good attempt! Review and move on.",
];

const WRONG_MSGS = [
  "Don't worry — mistakes help you learn.",
  "Keep going, you'll get it next time!",
  "That's okay — every stage builds on the last.",
  "Noted! Move forward and keep trying.",
];

const REVIEW_MSGS = [
  "Your teacher will grade this stage.",
  "Great work writing that out!",
  "Submitted! Your teacher will give feedback.",
  "Your response is saved for teacher review.",
];

function pickMsg(msgs: string[], seed: number) {
  return msgs[seed % msgs.length];
}

// ─── Score bar + badge ────────────────────────────────────────

function ScoreDisplay({
  score, maxScore, color,
}: { score: number | null; maxScore: number; color: string }) {
  if (score == null) return null;
  const pct = Math.round((score / Math.max(maxScore, 1)) * 100);
  return (
    <div className="mt-4 flex flex-col items-center gap-2 w-full">
      <div className="flex items-baseline gap-1.5">
        <span
          className="text-4xl font-extrabold font-nunito leading-none"
          style={{ color }}
        >
          {score}
        </span>
        <span className="text-lg font-semibold text-[#94A3B8]">/ {maxScore}</span>
      </div>
      {/* Progress bar */}
      <div className="w-48 h-2.5 bg-[#E2E8F0] dark:bg-[#2D3F55] rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1], delay: 0.15 }}
        />
      </div>
      <span className="text-sm font-bold" style={{ color }}>{pct}%</span>
    </div>
  );
}

// ─── Main card ────────────────────────────────────────────────

export default function FeedbackCard({ result, onContinue }: FeedbackCardProps) {
  // Close on Escape
  useEffect(() => {
    if (!result) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Enter" || e.key === "Escape") onContinue(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [result, onContinue]);

  // Derive display values
  const isTeacherGraded = result?.isCorrect === null;
  const isCorrect       = result?.isCorrect === true;
  const isPartial       = result?.isCorrect === false && result?.score != null && result.score > 0;
  const isWrong         = result?.isCorrect === false && (result?.score == null || result.score === 0);

  const seed = (result?.stageNum ?? 0);

  const { emoji, headline, msg, accent } = (() => {
    if (!result) return { emoji: "", headline: "", msg: "", accent: "#3B82C4" };
    if (isTeacherGraded)
      return { emoji: "📝", headline: "Submitted!", msg: pickMsg(REVIEW_MSGS, seed), accent: result.phaseColor };
    if (isCorrect)
      return { emoji: "✅", headline: "Correct!", msg: pickMsg(CORRECT_MSGS, seed), accent: "#4A9B7F" };
    if (isPartial)
      return { emoji: "🟡", headline: "Partial Credit", msg: pickMsg(PARTIAL_MSGS, seed), accent: "#F59E0B" };
    return { emoji: "❌", headline: "Not Quite", msg: pickMsg(WRONG_MSGS, seed), accent: "#E05C5C" };
  })();

  return (
    <AnimatePresence>
      {result && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onContinue}
          />

          {/* Card */}
          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 flex justify-center pb-6 px-4 pointer-events-none"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
          >
            <div
              className="pointer-events-auto w-full max-w-md bg-white dark:bg-[#1E293B] rounded-3xl shadow-2xl overflow-hidden border border-[#E2E8F0] dark:border-[#2D3F55]"
              style={{ fontFamily: "var(--font-nunito,'Nunito',sans-serif)" }}
            >
              {/* Colour band */}
              <div
                className="px-6 pt-7 pb-5 flex flex-col items-center text-center"
                style={{ background: `${accent}14` }}
              >
                {/* Bounce-in emoji */}
                <motion.div
                  className="text-5xl mb-2 select-none"
                  initial={{ scale: 0.4, rotate: -12 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 22, delay: 0.05 }}
                >
                  {emoji}
                </motion.div>

                <motion.h2
                  className="text-2xl font-extrabold"
                  style={{ color: accent }}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.25 }}
                >
                  {headline}
                </motion.h2>

                <motion.p
                  className="text-sm text-[#64748B] dark:text-[#94A3B8] mt-1 leading-relaxed"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.18, duration: 0.25 }}
                >
                  {msg}
                </motion.p>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                >
                  <ScoreDisplay score={result.score} maxScore={result.maxScore} color={accent} />
                </motion.div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 flex items-center justify-between border-t border-[#E2E8F0] dark:border-[#2D3F55]">
                <span className="text-xs text-[#94A3B8] font-semibold">
                  Stage {result.stageNum} of 12 · Press Enter to continue
                </span>
                <motion.button
                  onClick={onContinue}
                  className="font-extrabold text-sm px-6 py-2.5 rounded-xl text-white shadow-md hover:-translate-y-0.5 transition-transform"
                  style={{ background: accent }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Continue →
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
