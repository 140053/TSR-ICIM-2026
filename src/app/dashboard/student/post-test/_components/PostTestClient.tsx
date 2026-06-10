// app/dashboard/student/post-test/_components/PostTestClient.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { PostTestData, PostTestResult, TestQuestion } from "../page";

// ─── Timer hook ───────────────────────────────────────────────
function useTimer(limitSecs: number | null) {
  const [secs, setSecs]       = useState(0);
  const [expired, setExpired] = useState(false);
  const ref = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    ref.current = setInterval(() => {
      setSecs((s) => {
        const next = s + 1;
        if (limitSecs !== null && next >= limitSecs) {
          clearInterval(ref.current!);
          setExpired(true);
        }
        return next;
      });
    }, 1000);
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [limitSecs]);

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const remaining = limitSecs !== null ? Math.max(0, limitSecs - secs) : null;

  return { secs, fmt: fmt(secs), remaining, remainingFmt: remaining !== null ? fmt(remaining) : null, expired };
}

// ─── Difficulty badge ─────────────────────────────────────────
function DiffBadge({ d }: { d: string }) {
  const map: Record<string, [string, string]> = {
    easy:      ["#4A9B7F", "#D1FAE5"],
    average:   ["#3B82C4", "#DBEAFE"],
    difficult: ["#E05C5C", "#FEE2E2"],
  };
  const [color, bg] = map[d] ?? ["#64748B", "#EEF2F8"];
  const label = d.charAt(0).toUpperCase() + d.slice(1);
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: bg, color }}>
      {label}
    </span>
  );
}

// ─── Answer input ─────────────────────────────────────────────
function AnswerInput({
  q, value, onChange,
}: { q: TestQuestion; value: string; onChange: (v: string) => void }) {
  const base = "w-full px-4 py-3 bg-[#F0FDF4] dark:bg-[#051510] border-2 border-[#D1FAE5] dark:border-[#063c28] rounded-2xl text-sm focus:outline-none focus:border-[#4A9B7F] dark:focus:border-[#4A9B7F] text-[#1E293B] dark:text-[#E2E8F0] placeholder:text-[#94A3B8] transition-colors font-nunito font-bold";

  if (q.answerType === "multiple_choice" && q.choices) {
    const letters = ["A", "B", "C", "D"] as const;
    return (
      <div className="grid grid-cols-1 gap-2">
        {q.choices.map((choice, i) => {
          const letter  = letters[i];
          const selected = value === letter;
          return (
            <button
              key={letter}
              type="button"
              onClick={() => onChange(selected ? "" : letter)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-2xl border-2 text-left transition-all",
                selected
                  ? "border-[#4A9B7F] bg-[#ECFDF5] dark:bg-[#051510] text-[#1E293B] dark:text-[#E2E8F0]"
                  : "border-[#E2E8F0] dark:border-[#1a3028] bg-white dark:bg-[#0a1a12] text-[#1E293B] dark:text-[#E2E8F0] hover:border-[#86EFAC] dark:hover:border-[#1a3028]"
              )}
            >
              <span className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-extrabold shrink-0 transition-all",
                selected ? "bg-[#4A9B7F] text-white" : "bg-[#EEF2F8] dark:bg-[#0f2a1e] text-[#64748B] dark:text-[#94A3B8]"
              )}>
                {letter}
              </span>
              <span className="text-sm font-semibold">{choice}</span>
            </button>
          );
        })}
      </div>
    );
  }

  if (q.answerType === "time") {
    return (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. 1:30"
        className={base}
      />
    );
  }
  if (q.answerType === "number") {
    return (
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter a number…"
        className={base}
      />
    );
  }
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={3}
      placeholder="Type your answer here…"
      className={cn(base, "resize-none leading-relaxed")}
    />
  );
}

// ─── Question card ────────────────────────────────────────────
function QuestionCard({
  q, total, answer, onChange,
}: {
  q: TestQuestion; total: number; answer: string; onChange: (v: string) => void;
}) {
  return (
    <div className="fade-in flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-[#4A9B7F] text-white flex items-center justify-center text-sm font-extrabold font-nunito">
            {q.questionNum}
          </div>
          <div>
            <p className="text-[11px] font-bold text-[#4A9B7F] uppercase tracking-wider">
              Question {q.questionNum} of {total}
            </p>
            {q.context && (
              <p className="text-[10px] text-[#64748B] dark:text-[#94A3B8]">{q.context}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DiffBadge d={q.difficulty} />
          <span className="text-[10px] font-bold text-[#64748B] dark:text-[#94A3B8]">
            {q.points} pt{q.points !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Question text */}
      <div className="px-5 py-4 bg-[#ECFDF5] dark:bg-[#051510] border border-[#A7F3D0] dark:border-[#063c28] rounded-2xl">
        <p className="text-[15px] font-semibold leading-relaxed text-[#1E293B] dark:text-[#E2E8F0]">
          {q.questionText}
        </p>
        {q.melc && (
          <p className="text-[10px] text-[#94A3B8] mt-2 font-mono">{q.melc}</p>
        )}
      </div>

      {/* Answer */}
      <div>
        <label className="block text-[11px] font-extrabold tracking-widest uppercase text-[#4A9B7F] mb-2">
          Your Answer
        </label>
        <AnswerInput q={q} value={answer} onChange={onChange} />
      </div>
    </div>
  );
}

// ─── Review screen ────────────────────────────────────────────
function ReviewScreen({
  questions, answers, onSubmit, onBack, submitting,
}: {
  questions:  TestQuestion[];
  answers:    Record<number, string>;
  onSubmit:   () => void;
  onBack:     () => void;
  submitting: boolean;
}) {
  const answered   = questions.filter((q) => (answers[q.id] ?? "").trim() !== "").length;
  const unanswered = questions.length - answered;

  return (
    <div className="flex flex-col gap-5 fade-in">
      <div>
        <h2 className="font-nunito text-xl font-extrabold mb-1">Review Your Answers</h2>
        <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
          Check your answers before submitting. You cannot change them after.
        </p>
      </div>

      {unanswered > 0 && (
        <div className="flex items-center gap-2 px-4 py-3 bg-[#FEF3C7] dark:bg-[#3d2800] border border-[#F59E0B] rounded-xl">
          <span className="text-lg">⚠️</span>
          <p className="text-sm font-semibold text-[#92400E] dark:text-[#F59E0B]">
            {unanswered} question{unanswered !== 1 ? "s" : ""} left blank. Blank answers will be marked incorrect.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2 max-h-[420px] overflow-y-auto pr-1">
        {questions.map((q) => {
          const ans = (answers[q.id] ?? "").trim();
          return (
            <div key={q.id} className="flex items-start gap-3 px-4 py-3 bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-xl">
              <div className="w-7 h-7 rounded-full bg-[#4A9B7F] text-white flex items-center justify-center text-[11px] font-extrabold shrink-0 mt-0.5">
                {q.questionNum}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold truncate text-[#1E293B] dark:text-[#E2E8F0]">{q.questionText}</p>
                <p className={cn("text-[12px] font-bold mt-0.5", ans ? "text-[#4A9B7F]" : "text-[#94A3B8] italic")}>
                  {ans
                    ? q.answerType === "multiple_choice" && q.choices
                      ? (() => {
                          const idx = ["A","B","C","D"].indexOf(ans);
                          return idx >= 0 ? `${ans} — ${q.choices[idx]}` : ans;
                        })()
                      : ans
                    : "No answer"}
                </p>
              </div>
              <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0", ans ? "bg-[#D1FAE5] text-[#4A9B7F]" : "bg-[#EEF2F8] dark:bg-[#162032] text-[#94A3B8]")}>
                {ans ? "Answered" : "Blank"}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={onBack}
          disabled={submitting}
          className="flex-1 py-3 rounded-2xl font-nunito font-bold text-sm border-2 border-[#E2E8F0] dark:border-[#334155] text-[#64748B] hover:border-[#4A9B7F] hover:text-[#4A9B7F] transition-all disabled:opacity-40"
        >
          ← Go Back
        </button>
        <button
          onClick={onSubmit}
          disabled={submitting}
          className="flex-[2] py-3 rounded-2xl font-nunito font-extrabold text-sm bg-[#4A9B7F] hover:bg-[#3a7a63] text-white shadow-[0_4px_14px_rgba(74,155,127,0.35)] transition-all disabled:opacity-50"
        >
          {submitting ? "Submitting…" : "Submit Post-test ✓"}
        </button>
      </div>
    </div>
  );
}

// ─── Results screen ───────────────────────────────────────────
function ResultsScreen({
  result, studentName, onDone,
}: { result: PostTestResult; studentName: string; onDone: () => void }) {
  const pct   = result.percentScore;
  const color = pct >= 75 ? "#4A9B7F" : pct >= 50 ? "#F59E0B" : "#E05C5C";
  const label = pct >= 75 ? "Excellent work!" : pct >= 50 ? "Good effort!" : "Keep it up!";

  return (
    <div className="flex flex-col items-center text-center gap-6 py-4 fade-in">
      <div className="w-28 h-28 rounded-full flex items-center justify-center border-4" style={{ borderColor: color, background: `${color}18` }}>
        <div>
          <p className="font-nunito text-4xl font-extrabold" style={{ color }}>{pct}%</p>
          <p className="text-[11px] font-bold" style={{ color }}>{result.score}/{result.totalItems}</p>
        </div>
      </div>

      <div>
        <p className="font-nunito text-2xl font-extrabold mb-1">{label}</p>
        <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
          Post-test completed, {studentName.split(" ")[0]}. Your teacher will review your results.
        </p>
        <p className="text-[11px] text-[#94A3B8] mt-1">Submitted on {result.submittedAt}</p>
      </div>

      <div className="w-full px-5 py-4 bg-[#ECFDF5] dark:bg-[#051510] border border-[#A7F3D0] dark:border-[#063c28] rounded-2xl text-left">
        <p className="text-xs font-bold text-[#4A9B7F] mb-2 uppercase tracking-wider">What happens next?</p>
        <ul className="text-sm text-[#1E293B] dark:text-[#E2E8F0] flex flex-col gap-1.5">
          <li className="flex items-start gap-2"><span className="mt-0.5">📊</span> Your teacher will compare your pre-test and post-test scores</li>
          <li className="flex items-start gap-2"><span className="mt-0.5">📋</span> A diagnostic report will be generated to show your growth</li>
          <li className="flex items-start gap-2"><span className="mt-0.5">🏆</span> Check your report under <strong>My Reports</strong> once it&apos;s ready</li>
        </ul>
      </div>

      <button
        onClick={onDone}
        className="w-full py-3 rounded-2xl font-nunito font-extrabold text-sm bg-[#4A9B7F] hover:bg-[#3a7a63] text-white shadow-[0_4px_14px_rgba(74,155,127,0.35)] transition-all"
      >
        Back to Dashboard →
      </button>
    </div>
  );
}

// ─── Already taken screen ─────────────────────────────────────
function AlreadyTakenScreen({
  result, studentName, onDone,
}: { result: PostTestResult; studentName: string; onDone: () => void }) {
  const pct   = result.percentScore;
  const color = pct >= 75 ? "#4A9B7F" : pct >= 50 ? "#F59E0B" : "#E05C5C";

  return (
    <div className="flex flex-col items-center text-center gap-6 py-4 fade-in">
      <div className="w-20 h-20 rounded-2xl bg-[#D1FAE5] dark:bg-[#063c28] flex items-center justify-center text-4xl">
        ✅
      </div>
      <div>
        <p className="font-nunito text-2xl font-extrabold mb-1">Post-test Already Completed</p>
        <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
          You already submitted the post-test on {result.submittedAt}, {studentName.split(" ")[0]}.
        </p>
      </div>

      <div className="w-full px-5 py-4 bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl">
        <p className="text-[11px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider mb-3">Your Score</p>
        <div className="flex items-center justify-center gap-4">
          <div className="text-center">
            <p className="font-nunito text-4xl font-extrabold" style={{ color }}>{pct}%</p>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">{result.score} / {result.totalItems} correct</p>
          </div>
        </div>
      </div>

      <button
        onClick={onDone}
        className="w-full py-3 rounded-2xl font-nunito font-extrabold text-sm bg-[#4A9B7F] hover:bg-[#3a7a63] text-white shadow-[0_4px_14px_rgba(74,155,127,0.35)] transition-all"
      >
        Back to Dashboard
      </button>
    </div>
  );
}

// ─── Locked screen ────────────────────────────────────────────
function LockedScreen({ onDone }: { onDone: () => void }) {
  return (
    <div className="flex flex-col items-center text-center gap-6 py-8 fade-in">
      <div className="w-20 h-20 rounded-2xl bg-[#FEF3C7] dark:bg-[#3d2800] flex items-center justify-center text-4xl">
        🔒
      </div>
      <div>
        <p className="font-nunito text-xl font-extrabold mb-1">Post-test Locked</p>
        <p className="text-sm text-[#64748B] dark:text-[#94A3B8] max-w-xs mx-auto">
          You need to complete at least one module before taking the post-test.
        </p>
      </div>
      <div className="w-full px-5 py-4 bg-[#FEF3C7] dark:bg-[#3d2800] border border-[#F59E0B] rounded-2xl text-left">
        <p className="text-xs font-bold text-[#F59E0B] mb-2 uppercase tracking-wider">How to unlock</p>
        <ul className="text-sm text-[#1E293B] dark:text-[#E2E8F0] flex flex-col gap-1.5">
          <li className="flex items-start gap-2"><span className="mt-0.5">📚</span> Go to <strong>My Modules</strong> in your dashboard</li>
          <li className="flex items-start gap-2"><span className="mt-0.5">✅</span> Complete all 12 stages of an assigned module</li>
          <li className="flex items-start gap-2"><span className="mt-0.5">🔓</span> Return here to take the post-test</li>
        </ul>
      </div>
      <button
        onClick={onDone}
        className="w-full py-3 rounded-2xl font-nunito font-extrabold text-sm bg-[#4A9B7F] hover:bg-[#3a7a63] text-white shadow-[0_4px_14px_rgba(74,155,127,0.35)] transition-all"
      >
        Go to My Modules →
      </button>
    </div>
  );
}

// ─── No test screen ───────────────────────────────────────────
function NoTestScreen({ onDone }: { onDone: () => void }) {
  return (
    <div className="flex flex-col items-center text-center gap-5 py-8 fade-in">
      <div className="w-20 h-20 rounded-2xl bg-[#EEF2F8] dark:bg-[#162032] flex items-center justify-center text-4xl">
        📋
      </div>
      <div>
        <p className="font-nunito text-xl font-extrabold mb-1">No Post-test Available</p>
        <p className="text-sm text-[#64748B] dark:text-[#94A3B8] max-w-xs mx-auto">
          Your teacher hasn&apos;t set up a post-test yet. Check back later or ask your teacher.
        </p>
      </div>
      <button
        onClick={onDone}
        className="px-6 py-2.5 rounded-xl font-nunito font-bold text-sm border-2 border-[#E2E8F0] dark:border-[#334155] text-[#64748B] hover:border-[#4A9B7F] hover:text-[#4A9B7F] transition-all"
      >
        Back to Dashboard
      </button>
    </div>
  );
}

// ─── Main client component ────────────────────────────────────
export default function PostTestClient({
  data,
  alreadyTaken,
  locked,
  studentName,
}: {
  data:         PostTestData | null;
  alreadyTaken: PostTestResult | null;
  locked:       boolean;
  studentName:  string;
}) {
  const router = useRouter();

  const [answers,    setAnswers]    = useState<Record<number, string>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [phase,      setPhase]      = useState<"test" | "review" | "done">("test");
  const [result,     setResult]     = useState<PostTestResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState("");

  const { secs, fmt, remainingFmt, expired } = useTimer(data?.timeLimit ?? null);

  // Auto-submit on timer expiry
  useEffect(() => {
    if (expired && phase === "test") handleSubmit();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expired]);

  if (!data) {
    if (alreadyTaken) {
      return (
        <Shell studentName={studentName}>
          <AlreadyTakenScreen result={alreadyTaken} studentName={studentName} onDone={() => router.push("/dashboard/student")} />
        </Shell>
      );
    }
    if (locked) {
      return (
        <Shell studentName={studentName}>
          <LockedScreen onDone={() => router.push("/dashboard/student/modules")} />
        </Shell>
      );
    }
    return (
      <Shell studentName={studentName}>
        <NoTestScreen onDone={() => router.push("/dashboard/student")} />
      </Shell>
    );
  }

  const questions = data.questions;
  const current   = questions[currentIdx];
  const isLast    = currentIdx === questions.length - 1;
  const answered  = Object.values(answers).filter((v) => v.trim() !== "").length;

  const setAnswer = (qId: number, val: string) =>
    setAnswers((prev) => ({ ...prev, [qId]: val }));

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const payload = {
        testSetId: data.testSetId,
        timeSpent: secs,
        answers:   questions.map((q) => ({
          questionId:    q.id,
          studentAnswer: (answers[q.id] ?? "").trim(),
        })),
      };
      const res  = await fetch("/api/student/tests/submit", {
        method:      "POST",
        headers:     { "Content-Type": "application/json" },
        credentials: "include",
        body:        JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) { setError(json.error ?? "Submission failed."); setSubmitting(false); return; }
      setResult(json.result as PostTestResult);
      setPhase("done");
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  };

  if (phase === "done" && result) {
    return (
      <Shell studentName={studentName}>
        <ResultsScreen result={result} studentName={studentName} onDone={() => router.push("/dashboard/student")} />
      </Shell>
    );
  }

  return (
    <Shell studentName={studentName}>
      {/* Top bar: progress + timer */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex-1 mr-4">
          <div className="flex items-center justify-between text-[11px] font-bold text-[#64748B] dark:text-[#94A3B8] mb-1.5">
            <span>{answered} / {questions.length} answered</span>
            <span>{phase === "review" ? "Review" : `Q${currentIdx + 1} of ${questions.length}`}</span>
          </div>
          <div className="h-2 bg-[#EEF2F8] dark:bg-[#162032] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#4A9B7F] rounded-full transition-all duration-500"
              style={{ width: `${(answered / questions.length) * 100}%` }}
            />
          </div>
        </div>
        <div className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-bold font-nunito shrink-0",
          data.timeLimit !== null
            ? (remainingFmt && parseInt(remainingFmt) < 5 * 60
                ? "bg-[#FEE2E2] dark:bg-[#450a0a] text-[#E05C5C]"
                : "bg-[#ECFDF5] dark:bg-[#051510] text-[#4A9B7F]")
            : "bg-[#EEF2F8] dark:bg-[#162032] text-[#64748B]"
        )}>
          ⏱ {data.timeLimit !== null ? (remainingFmt ?? "00:00") : fmt}
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-[#FEE2E2] dark:bg-[#450a0a] border border-[#E05C5C] rounded-xl text-sm text-[#E05C5C] font-semibold">
          ⚠️ {error}
        </div>
      )}

      {phase === "test" && current && (
        <>
          <QuestionCard
            q={current}
            total={questions.length}
            answer={answers[current.id] ?? ""}
            onChange={(v) => setAnswer(current.id, v)}
          />

          {/* Navigation */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
              disabled={currentIdx === 0}
              className="flex-1 py-3 rounded-2xl font-nunito font-bold text-sm border-2 border-[#E2E8F0] dark:border-[#334155] text-[#64748B] hover:border-[#4A9B7F] hover:text-[#4A9B7F] transition-all disabled:opacity-30"
            >
              ← Previous
            </button>

            {!isLast ? (
              <button
                onClick={() => setCurrentIdx((i) => Math.min(questions.length - 1, i + 1))}
                className="flex-[2] py-3 rounded-2xl font-nunito font-extrabold text-sm bg-[#4A9B7F] hover:bg-[#3a7a63] text-white shadow-[0_4px_14px_rgba(74,155,127,0.25)] transition-all"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={() => setPhase("review")}
                className="flex-[2] py-3 rounded-2xl font-nunito font-extrabold text-sm bg-[#4A9B7F] hover:bg-[#3a7a63] text-white shadow-[0_4px_14px_rgba(74,155,127,0.35)] transition-all"
              >
                Review Answers →
              </button>
            )}
          </div>

          {/* Question dots */}
          <div className="flex flex-wrap gap-1.5 justify-center mt-5">
            {questions.map((q, i) => (
              <button
                key={q.id}
                onClick={() => setCurrentIdx(i)}
                className={cn(
                  "w-7 h-7 rounded-full text-[11px] font-bold transition-all",
                  i === currentIdx
                    ? "bg-[#4A9B7F] text-white"
                    : (answers[q.id] ?? "").trim()
                      ? "bg-[#D1FAE5] dark:bg-[#063c28] text-[#4A9B7F]"
                      : "bg-[#EEF2F8] dark:bg-[#162032] text-[#94A3B8]"
                )}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </>
      )}

      {phase === "review" && (
        <ReviewScreen
          questions={questions}
          answers={answers}
          onSubmit={handleSubmit}
          onBack={() => { setPhase("test"); setCurrentIdx(questions.length - 1); }}
          submitting={submitting}
        />
      )}
    </Shell>
  );
}

// ─── Shell layout ─────────────────────────────────────────────
function Shell({ children, studentName }: { children: React.ReactNode; studentName: string }) {
  const router = useRouter();
  return (
    <>
      <style>{`
        .font-nunito { font-family: var(--font-nunito, 'Nunito', sans-serif); }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        .fade-in { animation: fadeIn 0.3s ease forwards; }
      `}</style>

      <div className="min-h-screen bg-[#F0FDF4] dark:bg-[#030f09] text-[#1E293B] dark:text-[#E2E8F0]">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-[#061210] border-b border-[#A7F3D0] dark:border-[#063c28] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard/student")}
              className="text-sm font-bold text-[#64748B] hover:text-[#4A9B7F] transition-colors"
            >
              ← Dashboard
            </button>
            <span className="text-[#A7F3D0] dark:text-[#063c28]">/</span>
            <div className="flex items-center gap-2">
              <span className="text-lg">📝</span>
              <span className="font-nunito font-extrabold text-[15px] text-[#4A9B7F]">Post-test</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#D1FAE5] dark:bg-[#063c28] flex items-center justify-center text-[#4A9B7F] text-[11px] font-extrabold font-nunito">
              {studentName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-2xl mx-auto px-6 py-8">
          {children}
        </div>
      </div>
    </>
  );
}
