"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

/* ─── TYPES ─── */
interface QuestState {
  name: string;
  email: string;
  section: string;
  avatar: string;
  avatarName: string;
  diff: string;
  scenario: string;
  scenarioIcon: string;
  scenarioDesc: string;
}

/* ─── STARFIELD ─── */
function Starfield({ theme }: { theme: "dark" | "light" }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let animId: number;

    const stars = Array.from({ length: 160 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.5 + 0.3,
      a: Math.random(),
      da: (Math.random() - 0.5) * 0.006,
      dy: Math.random() * 0.08 + 0.02,
    }));

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const dark = theme === "dark";
      stars.forEach((s) => {
        s.a += s.da;
        if (s.a <= 0 || s.a >= 1) s.da *= -1;
        s.y -= s.dy;
        if (s.y < -2) s.y = canvas.height + 2;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = dark
          ? `rgba(200,220,255,${s.a * 0.7})`
          : `rgba(59,130,196,${s.a * 0.25})`;
        ctx.fill();
      });
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
    />
  );
}

/* ─── STEP INDICATOR ─── */
const STEP_LABELS = ["Identity", "Hero", "Difficulty", "Quest", "★"];

function StepBar({ current }: { current: number }) {
  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-0 bg-[#162240] border border-[#243558] rounded-full px-3 py-1.5 shadow-[0_0_30px_rgba(96,165,250,0.25)]">
      {STEP_LABELS.map((label, i) => {
        const n = i + 1;
        const isDone = n < current;
        const isActive = n === current;
        return (
          <div key={n} className="flex items-center">
            <div
              className={cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all",
                isActive && "bg-blue-500 text-white",
                isDone && "text-emerald-400",
                !isActive && !isDone && "text-[#4a6a94]"
              )}
            >
              <span
                className={cn(
                  "w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-extrabold transition-all",
                  isActive && "bg-white/30 text-white",
                  isDone && "bg-emerald-400 text-white",
                  !isActive && !isDone && "bg-[#243558] text-[#4a6a94]"
                )}
              >
                {isDone ? "✓" : n === 5 ? "★" : n}
              </span>
              {label}
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div className="w-5 h-px bg-[#243558]" />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── CARD WRAPPER ─── */
function Card({
  children,
  className,
  glowColor = "rgba(96,165,250,0.08)",
}: {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
}) {
  return (
    <div
      className={cn(
        "relative bg-[#162240] border border-[#243558] rounded-3xl p-10 shadow-[0_8px_48px_rgba(0,0,0,0.4)] w-full overflow-hidden",
        "animate-in fade-in slide-in-from-bottom-8 duration-500",
        className
      )}
    >
      {/* Top glow */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 70% 40% at 50% 0%, ${glowColor} 0%, transparent 70%)`,
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

/* ─── PAGE TAG ─── */
function PageTag({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-1.5 bg-blue-950 border border-blue-500 text-blue-400 text-[11px] font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-3">
      {children}
    </div>
  );
}

/* ─── STEP 1: IDENTITY ─── */
const SECTIONS = [
  { label: "🌲 Narra", value: "Narra" },
  { label: "🌿 Molave", value: "Molave" },
  { label: "🌳 Kamagong", value: "Kamagong" },
  { label: "🍃 Yakal", value: "Yakal" },
];

function Step1({
  state,
  setState,
  onNext,
}: {
  state: QuestState;
  setState: (s: QuestState) => void;
  onNext: () => void;
}) {
  return (
    <Card className="max-w-3xl mx-auto">
      <PageTag>⚔️ Step 1 of 4 · Begin Your Quest</PageTag>
      <h1 className="font-cinzel text-3xl font-bold mb-2 leading-tight">
        Who is the brave<br />problem-solver?
      </h1>
      <p className="text-sm text-[#7A9CC4] mb-7 leading-relaxed">
        Enter your name and section to begin your adventure. Your teacher will track your journey through all 12 stages.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <div className="flex flex-col gap-2">
          <label className="text-[11px] font-bold tracking-widest uppercase text-[#7A9CC4]">⚔️ Your Name</label>
          <Input
            className="bg-[#101f38] border-[#243558] text-white placeholder:text-[#4a6a94] focus:border-blue-400 rounded-xl"
            placeholder="e.g. Juan Dela Cruz"
            value={state.name}
            onChange={(e) => setState({ ...state, name: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[11px] font-bold tracking-widest uppercase text-[#7A9CC4]">🏫 School Email (optional)</label>
          <Input
            className="bg-[#101f38] border-[#243558] text-white placeholder:text-[#4a6a94] focus:border-blue-400 rounded-xl"
            placeholder="juan@school.edu.ph"
            type="email"
            value={state.email}
            onChange={(e) => setState({ ...state, email: e.target.value })}
          />
        </div>
      </div>

      <div className="mb-7">
        <label className="text-[11px] font-bold tracking-widest uppercase text-[#7A9CC4] block mb-2">🛡️ Choose Your Section</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          {SECTIONS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setState({ ...state, section: value })}
              className={cn(
                "py-2.5 px-2 rounded-xl border text-sm font-bold font-nunito transition-all",
                state.section === value
                  ? "border-blue-400 text-blue-400 bg-blue-950 shadow-[0_0_24px_rgba(96,165,250,0.25)]"
                  : "border-[#243558] text-[#7A9CC4] bg-[#101f38] hover:border-blue-400 hover:text-blue-400 hover:bg-blue-950"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-[#7A9CC4]">🔒 Your info is saved securely</span>
        <Button
          onClick={onNext}
          className="bg-gradient-to-br from-blue-400 to-blue-600 text-white font-bold rounded-xl px-7 py-3 shadow-[0_0_24px_rgba(96,165,250,0.3)] hover:translate-y-[-2px] hover:shadow-[0_8px_32px_rgba(96,165,250,0.4)] transition-all"
        >
          Continue →
        </Button>
      </div>
    </Card>
  );
}

/* ─── STEP 2: AVATAR ─── */
const AVATARS = [
  { emoji: "🧙‍♂️", name: "The Wizard" },
  { emoji: "🧝‍♀️", name: "The Elf" },
  { emoji: "🦸‍♂️", name: "The Hero" },
  { emoji: "🦸‍♀️", name: "The Champion" },
  { emoji: "🧑‍🚀", name: "The Explorer" },
  { emoji: "🦊", name: "The Fox" },
  { emoji: "🐉", name: "The Dragon" },
  { emoji: "🦁", name: "The Lion" },
  { emoji: "🦅", name: "The Eagle" },
  { emoji: "🐺", name: "The Wolf" },
];

function Step2({
  state,
  setState,
  onNext,
  onBack,
}: {
  state: QuestState;
  setState: (s: QuestState) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <Card className="max-w-3xl mx-auto">
      <PageTag>🧙 Step 2 of 4 · Choose Your Hero</PageTag>
      <h1 className="font-cinzel text-3xl font-bold mb-2">Pick your hero avatar</h1>
      <p className="text-sm text-[#7A9CC4] mb-6 leading-relaxed">
        Your avatar represents you throughout the quest. Choose the one that matches your spirit!
      </p>

      <div className="grid grid-cols-5 gap-3.5 mb-6">
        {AVATARS.map(({ emoji, name }) => (
          <button
            key={name}
            onClick={() => setState({ ...state, avatar: emoji, avatarName: name })}
            className={cn(
              "relative flex flex-col items-center gap-2 py-4 px-2 rounded-2xl border-2 transition-all",
              state.avatar === emoji
                ? "border-yellow-400 bg-yellow-950 shadow-[0_0_24px_rgba(252,211,77,0.3)] -translate-y-1"
                : "border-[#243558] bg-[#101f38] hover:border-blue-400 hover:-translate-y-1 hover:bg-[#1c2d50]"
            )}
          >
            {state.avatar === emoji && (
              <span className="absolute top-1.5 right-1.5 w-[18px] h-[18px] rounded-full bg-yellow-400 text-black text-[9px] font-black flex items-center justify-center">
                ✓
              </span>
            )}
            <span className="text-4xl leading-none">{emoji}</span>
            <span className={cn(
              "text-[10px] font-bold text-center",
              state.avatar === emoji ? "text-yellow-400" : "text-[#7A9CC4]"
            )}>
              {name}
            </span>
          </button>
        ))}
      </div>

      {/* Preview bar */}
      <div className="flex items-center gap-4 bg-[#101f38] border border-[#243558] rounded-2xl p-4 mb-5">
        <span className="text-5xl leading-none">{state.avatar || "❓"}</span>
        <div>
          <p className="font-extrabold text-base">{state.name || "Your Name"}</p>
          <span className="text-sm text-[#7A9CC4]">
            {state.section ? `🛡️ ${state.section}` : "No section yet"}
            {state.avatarName ? ` · ${state.avatarName}` : ""}
          </span>
        </div>
        <Badge className="ml-auto bg-blue-950 border border-blue-400 text-blue-400 px-3 py-1 rounded-full text-xs font-bold">
          {state.avatarName || "Awaiting Hero"}
        </Badge>
      </div>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={onBack}
          className="border-[#243558] text-[#7A9CC4] bg-transparent hover:border-blue-400 hover:text-blue-400 hover:bg-blue-950 rounded-xl px-6"
        >
          ← Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!state.avatar}
          className="bg-gradient-to-br from-blue-400 to-blue-600 text-white font-bold rounded-xl px-7 shadow-[0_0_24px_rgba(96,165,250,0.3)] hover:shadow-[0_8px_32px_rgba(96,165,250,0.4)] disabled:opacity-40 transition-all"
        >
          Continue →
        </Button>
      </div>
    </Card>
  );
}

/* ─── STEP 3: DIFFICULTY ─── */
const DIFFICULTIES = [
  {
    key: "easy",
    icon: "🌱",
    name: "Apprentice",
    tag: "Easy",
    desc: "Guided hints at every stage. Best for first-time problem solvers.",
    pips: 3,
    color: "var(--color-emerald-400)",
    borderActive: "border-emerald-400",
    bgActive: "bg-emerald-950",
    shadow: "shadow-[0_0_24px_rgba(110,231,183,0.25)]",
    tagClass: "bg-emerald-950 text-emerald-400",
    barClass: "bg-emerald-400",
    topBar: "bg-emerald-400",
  },
  {
    key: "average",
    icon: "⚔️",
    name: "Adventurer",
    tag: "Average",
    desc: "Hints available on request. Balanced challenge for most learners.",
    pips: 4,
    color: "var(--color-blue-400)",
    borderActive: "border-blue-400",
    bgActive: "bg-blue-950",
    shadow: "shadow-[0_0_24px_rgba(96,165,250,0.25)]",
    tagClass: "bg-blue-950 text-blue-400",
    barClass: "bg-blue-400",
    topBar: "bg-blue-400",
  },
  {
    key: "hard",
    icon: "🔥",
    name: "Champion",
    tag: "Difficult",
    desc: "No hints. Full problem-solving challenge for advanced thinkers.",
    pips: 5,
    color: "var(--color-amber-400)",
    borderActive: "border-amber-400",
    bgActive: "bg-amber-950",
    shadow: "shadow-[0_0_24px_rgba(252,211,77,0.25)]",
    tagClass: "bg-amber-950 text-amber-400",
    barClass: "bg-amber-400",
    topBar: "bg-amber-400",
  },
];

function Step3({
  state,
  setState,
  onNext,
  onBack,
}: {
  state: QuestState;
  setState: (s: QuestState) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <Card className="max-w-3xl mx-auto">
      <PageTag>⚡ Step 3 of 4 · Choose Your Challenge</PageTag>
      <h1 className="font-cinzel text-3xl font-bold mb-2">Select your difficulty</h1>
      <p className="text-sm text-[#7A9CC4] mb-6 leading-relaxed">
        Pick a challenge level that matches your readiness. You can always unlock harder quests later!
      </p>

      <div className="grid grid-cols-3 gap-3.5 mb-6">
        {DIFFICULTIES.map((d) => {
          const isSelected = state.diff === d.key;
          return (
            <button
              key={d.key}
              onClick={() => setState({ ...state, diff: d.key })}
              className={cn(
                "relative flex flex-col items-center text-center p-6 rounded-2xl border-2 transition-all overflow-hidden",
                isSelected
                  ? `${d.borderActive} ${d.bgActive} ${d.shadow} -translate-y-1`
                  : "border-[#243558] bg-[#101f38] hover:-translate-y-1"
              )}
            >
              {/* Top accent bar */}
              <div
                className={cn(
                  "absolute top-0 left-0 right-0 h-[3px] transition-opacity",
                  d.topBar,
                  isSelected ? "opacity-100" : "opacity-0"
                )}
              />
              <div className="text-4xl mb-3">{d.icon}</div>
              <div className="font-extrabold text-base mb-1">{d.name}</div>
              <span className={cn("text-[10px] font-bold tracking-widest uppercase px-2.5 py-0.5 rounded-full mb-2.5", d.tagClass)}>
                {d.tag}
              </span>
              <p className="text-xs text-[#7A9CC4] leading-relaxed mb-3">{d.desc}</p>
              {/* Pip bar */}
              <div className="flex gap-1 justify-center">
                {Array.from({ length: 5 }, (_, i) => (
                  <div
                    key={i}
                    className={cn("h-1 w-4 rounded-full transition-opacity", d.barClass, i < d.pips ? "opacity-100" : "opacity-20")}
                  />
                ))}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={onBack}
          className="border-[#243558] text-[#7A9CC4] bg-transparent hover:border-blue-400 hover:text-blue-400 hover:bg-blue-950 rounded-xl px-6"
        >
          ← Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!state.diff}
          className="bg-gradient-to-br from-blue-400 to-blue-600 text-white font-bold rounded-xl px-7 shadow-[0_0_24px_rgba(96,165,250,0.3)] disabled:opacity-40 transition-all"
        >
          Continue →
        </Button>
      </div>
    </Card>
  );
}

/* ─── STEP 4: SCENARIO ─── */
const SCENARIOS = [
  {
    icon: "🍱",
    title: "Barangay Feeding Program",
    desc: "The barangay plans a feeding program for 120 children. You must manage a ₱6,000 budget wisely — buying rice, canned goods, and juice without going over.",
    pills: ["💰 Money", "➗ Operations", "⭐ Recommended"],
    tag: "✦ Active",
    tagClass: "bg-emerald-950 text-emerald-400",
    borderActive: "border-emerald-400",
    shadow: "shadow-[0_0_24px_rgba(110,231,183,0.2)]",
    locked: false,
  },
  {
    icon: "🏪",
    title: "Sari-Sari Store Manager",
    desc: "Run a small community store. Compute profits, manage change, and decide how many items to restock within a limited daily budget.",
    pills: ["💸 Decimals", "🧮 Computation"],
    tag: "✦ Active",
    tagClass: "bg-blue-950 text-blue-400",
    borderActive: "border-blue-400",
    shadow: "shadow-[0_0_24px_rgba(96,165,250,0.2)]",
    locked: false,
  },
  {
    icon: "📐",
    title: "School Garden Planner",
    desc: "Help design the school garden. Calculate area, perimeter, and the number of plants that can fit — then present your plan to the principal.",
    pills: ["📏 Measurement", "🔷 Geometry"],
    tag: "✦ Active",
    tagClass: "bg-purple-950 text-purple-400",
    borderActive: "border-purple-400",
    shadow: "shadow-[0_0_24px_rgba(167,139,250,0.2)]",
    locked: false,
  },
  {
    icon: "🚌",
    title: "Travel & Distance Planner",
    desc: "Plan efficient routes for barangay deliveries. Solve problems involving time, distance, and schedule optimization.",
    pills: ["⏱️ Time", "📍 Distance", "🔒 Complete 2 quests"],
    tag: "🔒 Locked",
    tagClass: "bg-[#1c2d50] text-[#4a6a94]",
    borderActive: "",
    shadow: "",
    locked: true,
  },
];

function Step4({
  state,
  setState,
  onNext,
  onBack,
}: {
  state: QuestState;
  setState: (s: QuestState) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <Card className="max-w-4xl mx-auto">
      <PageTag>🗺️ Step 4 of 4 · Choose Your Quest</PageTag>
      <h1 className="font-cinzel text-3xl font-bold mb-2">Select a problem quest</h1>
      <p className="text-sm text-[#7A9CC4] mb-6 leading-relaxed">
        Each quest is a real-life scenario. Choose one and guide your barangay through 12 stages of mathematical problem-solving!
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-6">
        {SCENARIOS.map((s) => {
          const isSelected = state.scenario === s.title;
          return (
            <button
              key={s.title}
              onClick={() => {
                if (s.locked) return;
                setState({
                  ...state,
                  scenario: s.title,
                  scenarioIcon: s.icon,
                  scenarioDesc: s.desc,
                });
              }}
              className={cn(
                "relative flex flex-col items-start text-left p-5 rounded-2xl border-2 transition-all overflow-hidden",
                s.locked
                  ? "border-[#243558] bg-[#101f38] opacity-55 cursor-not-allowed"
                  : isSelected
                  ? `${s.borderActive} bg-[#101f38] ${s.shadow} -translate-y-1`
                  : "border-[#243558] bg-[#101f38] hover:-translate-y-1 hover:border-[#2e4270]"
              )}
            >
              {/* Checkmark */}
              {!s.locked && isSelected && (
                <span className="absolute top-3 right-3 z-10 w-[22px] h-[22px] rounded-full bg-blue-400 text-white text-[10px] font-black flex items-center justify-center">
                  ✓
                </span>
              )}

              <div className="flex items-start justify-between w-full mb-3">
                <span className="text-3xl">{s.icon}</span>
                <span className={cn("text-[10px] font-bold px-2.5 py-1 rounded-full", s.tagClass)}>
                  {s.tag}
                </span>
              </div>
              <div className="font-extrabold text-sm mb-1.5">{s.title}</div>
              <p className="text-xs text-[#7A9CC4] leading-relaxed mb-3">{s.desc}</p>
              <div className="flex flex-wrap gap-1.5">
                {s.pills.map((p) => (
                  <span key={p} className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[#162240] border border-[#243558] text-[#7A9CC4]">
                    {p}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={onBack}
          className="border-[#243558] text-[#7A9CC4] bg-transparent hover:border-blue-400 hover:text-blue-400 hover:bg-blue-950 rounded-xl px-6"
        >
          ← Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!state.scenario}
          className="bg-gradient-to-br from-blue-400 to-blue-600 text-white font-bold rounded-xl px-7 shadow-[0_0_24px_rgba(96,165,250,0.3)] disabled:opacity-40 transition-all"
        >
          Begin Quest →
        </Button>
      </div>
    </Card>
  );
}

/* ─── STEP 5: LAUNCH ─── */
const STAGE_MAP = [
  { n: 1, label: "Identify", phase: "blue" },
  { n: 2, label: "Prioritize", phase: "blue" },
  { n: 3, label: "Define", phase: "blue" },
  { n: 4, label: "Analyze", phase: "purple" },
  { n: 5, label: "Constraints", phase: "purple" },
  { n: 6, label: "Root Cause", phase: "purple" },
  { n: 7, label: "Data", phase: "purple" },
  { n: 8, label: "Solutions", phase: "amber" },
  { n: 9, label: "Anticipate", phase: "amber" },
  { n: 10, label: "Trial", phase: "amber" },
  { n: 11, label: "Choose", phase: "green" },
  { n: 12, label: "Reflect", phase: "green" },
];

const PHASE_STYLES: Record<string, string> = {
  blue: "border-blue-400 text-blue-400 bg-blue-950",
  purple: "border-purple-400 text-purple-400 bg-purple-950",
  amber: "border-amber-400 text-amber-400 bg-amber-950",
  green: "border-emerald-400 text-emerald-400 bg-emerald-950",
};

const DIFF_LABELS: Record<string, string> = {
  easy: "🌱 Apprentice",
  average: "⚔️ Adventurer",
  hard: "🔥 Champion",
};

function Step5({
  state,
  onBack,
}: {
  state: QuestState;
  onBack: () => void;
}) {
  const [launching, setLaunching] = useState(false);
  const [launched, setLaunched] = useState(false);

  const handleLaunch = () => {
    setLaunching(true);
    setTimeout(() => {
      setLaunched(true);
      setTimeout(() => {
        // In real app: router.push('/module/1/stage/1')
        alert(
          `Quest started!\n\nHero: ${state.name}\nSection: ${state.section}\nAvatar: ${state.avatar} ${state.avatarName}\nDifficulty: ${DIFF_LABELS[state.diff]}\nQuest: ${state.scenario}\n\nIn the real app, this redirects to Stage 1!`
        );
        setLaunching(false);
        setLaunched(false);
      }, 1200);
    }, 1000);
  };

  return (
    <Card
      className="max-w-xl mx-auto text-center"
      glowColor="rgba(245,158,11,0.12)"
    >
      <div className="animate-[pulse-scale_2s_ease-in-out_infinite] text-7xl mb-2">
        {state.avatar || "🧙‍♂️"}
      </div>
      <h2 className="font-cinzel text-2xl font-bold mb-1">{state.name || "Hero"}</h2>
      <p className="text-[#7A9CC4] text-sm mb-7">is ready to begin the quest!</p>

      <div className="flex flex-wrap gap-2.5 justify-center mb-8">
        {[
          `🛡️ ${state.section || "—"}`,
          DIFF_LABELS[state.diff] || "⚡ —",
          `${state.scenarioIcon} ${state.scenario || "—"}`,
        ].map((tag) => (
          <div key={tag} className="flex items-center gap-1.5 bg-[#1c2d50] border border-[#243558] text-sm font-semibold px-4 py-2 rounded-full">
            {tag}
          </div>
        ))}
      </div>

      {/* Stage map */}
      <div className="bg-[#101f38] border border-[#243558] rounded-2xl p-5 mb-7 text-left">
        <div className="flex items-center gap-2.5 mb-4">
          <span className="text-lg">🗺️</span>
          <div>
            <div className="font-extrabold text-sm">Your 12-Stage Journey Awaits</div>
            <div className="text-xs text-[#7A9CC4]">Complete all stages to finish the quest</div>
          </div>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {STAGE_MAP.map((s) => (
            <div key={s.n} className="flex flex-col items-center gap-1" style={{ flex: "1 0 auto", minWidth: 0 }}>
              <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-extrabold border-[1.5px] transition-all", PHASE_STYLES[s.phase])}>
                {s.n}
              </div>
              <div className="text-[8px] font-bold text-[#4a6a94] text-center leading-tight">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleLaunch}
        disabled={launching}
        className="w-full py-5 rounded-2xl font-extrabold text-lg font-nunito bg-gradient-to-br from-yellow-300 to-amber-500 text-black shadow-[0_0_30px_rgba(245,158,11,0.3)] hover:shadow-[0_12px_40px_rgba(245,158,11,0.45)] hover:-translate-y-1 disabled:opacity-60 transition-all"
      >
        {launched ? "✅ Quest Started! Redirecting..." : launching ? "⚔️ Loading Quest..." : "⚔️ Begin Quest!"}
      </button>

      <p className="mt-3.5 text-xs text-[#7A9CC4]">Your progress is saved automatically at every stage.</p>

      <div className="flex justify-start mt-4">
        <Button
          variant="outline"
          onClick={onBack}
          className="border-[#243558] text-[#7A9CC4] bg-transparent hover:border-blue-400 hover:text-blue-400 hover:bg-blue-950 rounded-xl px-6 text-sm"
        >
          ← Back
        </Button>
      </div>
    </Card>
  );
}

/* ─── MAIN PAGE ─── */
export default function Page() {
  const [step, setStep] = useState(1);
  const [theme] = useState<"dark" | "light">("dark");
  const [state, setState] = useState<QuestState>({
    name: "",
    email: "",
    section: "",
    avatar: "",
    avatarName: "",
    diff: "",
    scenario: "",
    scenarioIcon: "",
    scenarioDesc: "",
  });

  const next = () => setStep((s) => Math.min(s + 1, 5));
  const back = () => setStep((s) => Math.max(s - 1, 1));

  return (
    <>
      {/* Global font styles — add Cinzel + Nunito to your layout.tsx instead */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Cinzel:wght@600;700&family=DM+Sans:wght@400;500&display=swap');
        .font-cinzel { font-family: 'Cinzel', serif; }
        .font-nunito { font-family: 'Nunito', sans-serif; }
        body { font-family: 'DM Sans', sans-serif; }
        @keyframes pulse-scale {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.06); }
        }
      `}</style>

      <main className="relative min-h-screen bg-[#0B1628] text-white flex flex-col items-center justify-center p-6 pt-24 overflow-x-hidden">
        <Starfield theme={theme} />

        {/* Step indicator */}
        <StepBar current={step} />

        {/* Pages */}
        <div className="relative z-10 w-full flex justify-center">
          {step === 1 && <Step1 state={state} setState={setState} onNext={next} />}
          {step === 2 && <Step2 state={state} setState={setState} onNext={next} onBack={back} />}
          {step === 3 && <Step3 state={state} setState={setState} onNext={next} onBack={back} />}
          {step === 4 && <Step4 state={state} setState={setState} onNext={next} onBack={back} />}
          {step === 5 && <Step5 state={state} onBack={back} />}
        </div>
      </main>
    </>
  );
}