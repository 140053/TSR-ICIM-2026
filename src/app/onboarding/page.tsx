// app/onboarding/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// ─── TYPES ────────────────────────────────────────────────────
type OnboardingState = {
  avatar:      string;
  avatarName:  string;
  avatarEmoji: string;
  diff:        string;
  moduleId:    number | null;
  moduleTitle: string;
  moduleIcon:  string;
};

// Maps UI diff key → DB enum
const DIFF_DB: Record<string, string> = {
  easy:    "APPRENTICE",
  average: "ADVENTURER",
  hard:    "CHAMPION",
};

// Maps UI avatar name → DB enum
const AVATAR_DB: Record<string, string> = {
  "The Wizard":    "WIZARD",
  "The Elf":       "ELF",
  "The Hero":      "HERO",
  "The Champion":  "CHAMPION",
  "The Explorer":  "EXPLORER",
  "The Fox":       "FOX",
  "The Dragon":    "DRAGON",
  "The Lion":      "LION",
  "The Eagle":     "EAGLE",
  "The Wolf":      "WOLF",
};

// ─── STARFIELD ────────────────────────────────────────────────
function Starfield() {
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
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach((s) => {
        s.a += s.da;
        if (s.a <= 0 || s.a >= 1) s.da *= -1;
        s.y -= s.dy;
        if (s.y < -2) s.y = canvas.height + 2;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200,220,255,${s.a * 0.7})`;
        ctx.fill();
      });
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" />
  );
}

// ─── STEP INDICATOR ───────────────────────────────────────────
const STEP_LABELS = ["Hero", "Difficulty", "Quest", "★"];

function StepBar({ current }: { current: number }) {
  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center bg-[#162240] border border-[#243558] rounded-full px-3 py-1.5 shadow-[0_0_30px_rgba(96,165,250,0.25)]">
      {STEP_LABELS.map((label, i) => {
        const n       = i + 1;
        const isDone  = n < current;
        const isActive = n === current;
        return (
          <div key={n} className="flex items-center">
            <div className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all",
              isActive && "bg-blue-500 text-white",
              isDone   && "text-emerald-400",
              !isActive && !isDone && "text-[#4a6a94]"
            )}>
              <span className={cn(
                "w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-extrabold",
                isActive && "bg-white/30 text-white",
                isDone   && "bg-emerald-400 text-white",
                !isActive && !isDone && "bg-[#243558] text-[#4a6a94]"
              )}>
                {isDone ? "✓" : n === 4 ? "★" : n}
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

// ─── CARD ─────────────────────────────────────────────────────
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
    <div className={cn(
      "relative bg-[#162240] border border-[#243558] rounded-3xl p-10 shadow-[0_8px_48px_rgba(0,0,0,0.4)] w-full overflow-hidden",
      "animate-in fade-in slide-in-from-bottom-8 duration-500",
      className,
    )}>
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse 70% 40% at 50% 0%, ${glowColor} 0%, transparent 70%)` }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function PageTag({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-1.5 bg-blue-950 border border-blue-500 text-blue-400 text-[11px] font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-3">
      {children}
    </div>
  );
}

// ─── STEP 1 — AVATAR ──────────────────────────────────────────
const AVATARS = [
  { emoji: "🧙‍♂️", name: "The Wizard",   db: "WIZARD"   },
  { emoji: "🧝‍♀️", name: "The Elf",      db: "ELF"      },
  { emoji: "🦸‍♂️", name: "The Hero",     db: "HERO"     },
  { emoji: "🦸‍♀️", name: "The Champion", db: "CHAMPION" },
  { emoji: "🧑‍🚀", name: "The Explorer", db: "EXPLORER" },
  { emoji: "🦊",   name: "The Fox",      db: "FOX"      },
  { emoji: "🐉",   name: "The Dragon",   db: "DRAGON"   },
  { emoji: "🦁",   name: "The Lion",     db: "LION"     },
  { emoji: "🦅",   name: "The Eagle",    db: "EAGLE"    },
  { emoji: "🐺",   name: "The Wolf",     db: "WOLF"     },
];

function StepAvatar({
  state, setState, onNext, studentName,
}: {
  state: OnboardingState;
  setState: (s: OnboardingState) => void;
  onNext: () => void;
  studentName: string;
}) {
  return (
    <Card className="max-w-3xl mx-auto">
      <PageTag>🧙 Step 1 of 3 · Choose Your Hero</PageTag>
      <h1 className="font-cinzel text-3xl font-bold mb-2 leading-tight">
        Pick your hero avatar
      </h1>
      <p className="text-sm text-[#7A9CC4] mb-6 leading-relaxed">
        Your avatar represents you throughout the quest, {studentName}. Choose the one that matches your spirit!
      </p>

      <div className="grid grid-cols-5 gap-3.5 mb-6">
        {AVATARS.map(({ emoji, name }) => {
          const isSelected = state.avatar === name;
          return (
            <button
              key={name}
              type="button"
              onClick={() => setState({ ...state, avatar: name, avatarEmoji: emoji, avatarName: name })}
              className={cn(
                "relative flex flex-col items-center gap-2 py-4 px-2 rounded-2xl border-2 transition-all",
                isSelected
                  ? "border-yellow-400 bg-yellow-950 shadow-[0_0_24px_rgba(252,211,77,0.3)] -translate-y-1"
                  : "border-[#243558] bg-[#101f38] hover:border-blue-400 hover:-translate-y-1 hover:bg-[#1c2d50]"
              )}
            >
              {isSelected && (
                <span className="absolute top-1.5 right-1.5 w-[18px] h-[18px] rounded-full bg-yellow-400 text-black text-[9px] font-black flex items-center justify-center">
                  ✓
                </span>
              )}
              <span className="text-4xl leading-none">{emoji}</span>
              <span className={cn(
                "text-[10px] font-bold text-center",
                isSelected ? "text-yellow-400" : "text-[#7A9CC4]"
              )}>
                {name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Preview */}
      <div className="flex items-center gap-4 bg-[#101f38] border border-[#243558] rounded-2xl p-4 mb-6">
        <span className="text-5xl leading-none">{state.avatarEmoji || "❓"}</span>
        <div>
          <p className="font-extrabold text-base">{studentName || "Your Name"}</p>
          <span className="text-sm text-[#7A9CC4]">
            {state.avatarName ? `${state.avatarName} — ready to quest!` : "Choose your avatar above"}
          </span>
        </div>
        <div className="ml-auto bg-blue-950 border border-blue-400 text-blue-400 text-xs font-bold px-3 py-1 rounded-full">
          {state.avatarName || "Awaiting Hero"}
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={onNext}
          disabled={!state.avatar}
          className="bg-gradient-to-br from-blue-400 to-blue-600 text-white font-bold rounded-xl px-7 py-3 shadow-[0_0_24px_rgba(96,165,250,0.3)] hover:-translate-y-0.5 disabled:opacity-40 transition-all"
        >
          Continue →
        </Button>
      </div>
    </Card>
  );
}

// ─── STEP 2 — DIFFICULTY ──────────────────────────────────────
const DIFFICULTIES = [
  {
    key: "easy",
    icon: "🌱", name: "Apprentice", tag: "Easy",
    desc: "Guided hints at every stage. Best for first-time problem solvers.",
    pips: 3,
    borderActive: "border-emerald-400", bgActive: "bg-emerald-950",
    shadow: "shadow-[0_0_24px_rgba(110,231,183,0.25)]",
    tagClass: "bg-emerald-950 text-emerald-400",
    barClass: "bg-emerald-400", topBar: "bg-emerald-400",
  },
  {
    key: "average",
    icon: "⚔️", name: "Adventurer", tag: "Average",
    desc: "Hints available on request. Balanced challenge for most learners.",
    pips: 4,
    borderActive: "border-blue-400", bgActive: "bg-blue-950",
    shadow: "shadow-[0_0_24px_rgba(96,165,250,0.25)]",
    tagClass: "bg-blue-950 text-blue-400",
    barClass: "bg-blue-400", topBar: "bg-blue-400",
  },
  {
    key: "hard",
    icon: "🔥", name: "Champion", tag: "Difficult",
    desc: "No hints. Full problem-solving challenge for advanced thinkers.",
    pips: 5,
    borderActive: "border-amber-400", bgActive: "bg-amber-950",
    shadow: "shadow-[0_0_24px_rgba(252,211,77,0.25)]",
    tagClass: "bg-amber-950 text-amber-400",
    barClass: "bg-amber-400", topBar: "bg-amber-400",
  },
];

function StepDifficulty({
  state, setState, onNext, onBack,
}: {
  state: OnboardingState;
  setState: (s: OnboardingState) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <Card className="max-w-3xl mx-auto">
      <PageTag>⚡ Step 2 of 3 · Choose Your Challenge</PageTag>
      <h1 className="font-cinzel text-3xl font-bold mb-2">Select your difficulty</h1>
      <p className="text-sm text-[#7A9CC4] mb-6 leading-relaxed">
        Pick a challenge level that matches your readiness. You can always try harder quests later!
      </p>

      <div className="grid grid-cols-3 gap-3.5 mb-6">
        {DIFFICULTIES.map((d) => {
          const isSelected = state.diff === d.key;
          return (
            <button
              key={d.key}
              type="button"
              onClick={() => setState({ ...state, diff: d.key })}
              className={cn(
                "relative flex flex-col items-center text-center p-6 rounded-2xl border-2 transition-all overflow-hidden",
                isSelected
                  ? `${d.borderActive} ${d.bgActive} ${d.shadow} -translate-y-1`
                  : "border-[#243558] bg-[#101f38] hover:-translate-y-1"
              )}
            >
              <div className={cn(
                "absolute top-0 left-0 right-0 h-[3px]",
                d.topBar,
                isSelected ? "opacity-100" : "opacity-0"
              )} />
              <div className="text-4xl mb-3">{d.icon}</div>
              <div className="font-extrabold text-base mb-1">{d.name}</div>
              <span className={cn("text-[10px] font-bold tracking-widest uppercase px-2.5 py-0.5 rounded-full mb-2.5", d.tagClass)}>
                {d.tag}
              </span>
              <p className="text-xs text-[#7A9CC4] leading-relaxed mb-3">{d.desc}</p>
              <div className="flex gap-1 justify-center">
                {Array.from({ length: 5 }, (_, i) => (
                  <div
                    key={i}
                    className={cn("h-1 w-4 rounded-full", d.barClass, i < d.pips ? "opacity-100" : "opacity-20")}
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

// ─── STEP 3 — QUEST ───────────────────────────────────────────
interface ModuleOption {
  id:     number;
  icon:   string;
  title:  string;
  desc:   string;
  pills:  string[];
  color:  string;
  tagCls: string;
  border: string;
  shadow: string;
  locked: boolean;
}

function StepQuest({
  state, setState, modules, onNext, onBack,
}: {
  state: OnboardingState;
  setState: (s: OnboardingState) => void;
  modules: ModuleOption[];
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <Card className="max-w-4xl mx-auto">
      <PageTag>🗺️ Step 3 of 3 · Choose Your Quest</PageTag>
      <h1 className="font-cinzel text-3xl font-bold mb-2">Select a problem quest</h1>
      <p className="text-sm text-[#7A9CC4] mb-6 leading-relaxed">
        Each quest is a real-life scenario. Choose one and guide your barangay through 12 stages of mathematical problem-solving!
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-6">
        {modules.map((m) => {
          const isSelected = state.moduleId === m.id;
          return (
            <button
              key={m.id}
              type="button"
              disabled={m.locked}
              onClick={() => {
                if (m.locked) return;
                setState({ ...state, moduleId: m.id, moduleTitle: m.title, moduleIcon: m.icon });
              }}
              className={cn(
                "relative flex flex-col items-start text-left p-5 rounded-2xl border-2 transition-all overflow-hidden",
                m.locked
                  ? "border-[#243558] bg-[#101f38] opacity-55 cursor-not-allowed"
                  : isSelected
                  ? `${m.border} bg-[#101f38] ${m.shadow} -translate-y-1`
                  : "border-[#243558] bg-[#101f38] hover:-translate-y-1 hover:border-[#2e4270]"
              )}
            >
              {!m.locked && isSelected && (
                <span className="absolute top-3 right-3 z-10 w-[22px] h-[22px] rounded-full bg-blue-400 text-white text-[10px] font-black flex items-center justify-center">
                  ✓
                </span>
              )}
              <div className="flex items-start justify-between w-full mb-3">
                <span className="text-3xl">{m.icon}</span>
                <span className={cn("text-[10px] font-bold px-2.5 py-1 rounded-full", m.tagCls)}>
                  {m.locked ? "🔒 Locked" : "✦ Active"}
                </span>
              </div>
              <div className="font-extrabold text-sm mb-1.5">{m.title}</div>
              <p className="text-xs text-[#7A9CC4] leading-relaxed mb-3">{m.desc}</p>
              <div className="flex flex-wrap gap-1.5">
                {m.pills.map((p) => (
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
          disabled={!state.moduleId}
          className="bg-gradient-to-br from-blue-400 to-blue-600 text-white font-bold rounded-xl px-7 shadow-[0_0_24px_rgba(96,165,250,0.3)] disabled:opacity-40 transition-all"
        >
          Begin Quest →
        </Button>
      </div>
    </Card>
  );
}

// ─── STEP 4 — LAUNCH ──────────────────────────────────────────
const STAGE_MAP = [
  { n: 1,  label: "Identify",    phase: "blue"   },
  { n: 2,  label: "Prioritize",  phase: "blue"   },
  { n: 3,  label: "Define",      phase: "blue"   },
  { n: 4,  label: "Analyze",     phase: "purple" },
  { n: 5,  label: "Constraints", phase: "purple" },
  { n: 6,  label: "Root Cause",  phase: "purple" },
  { n: 7,  label: "Data",        phase: "purple" },
  { n: 8,  label: "Solutions",   phase: "amber"  },
  { n: 9,  label: "Anticipate",  phase: "amber"  },
  { n: 10, label: "Trial",       phase: "amber"  },
  { n: 11, label: "Choose",      phase: "green"  },
  { n: 12, label: "Reflect",     phase: "green"  },
];

const PHASE_STYLES: Record<string, string> = {
  blue:   "border-blue-400 text-blue-400 bg-blue-950",
  purple: "border-purple-400 text-purple-400 bg-purple-950",
  amber:  "border-amber-400 text-amber-400 bg-amber-950",
  green:  "border-emerald-400 text-emerald-400 bg-emerald-950",
};

const DIFF_LABELS: Record<string, string> = {
  easy:    "🌱 Apprentice",
  average: "⚔️ Adventurer",
  hard:    "🔥 Champion",
};

function StepLaunch({
  state, studentName, onBack,
}: {
  state: OnboardingState;
  studentName: string;
  onBack: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const handleLaunch = async () => {
    if (!state.moduleId || !state.avatar || !state.diff) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/onboarding/complete", {
        method:      "POST",
        headers:     { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          avatar:      AVATAR_DB[state.avatarName] ?? "WIZARD",
          avatarEmoji: state.avatarEmoji,
          avatarName:  state.avatarName,
          difficulty:  DIFF_DB[state.diff] ?? "ADVENTURER",
          moduleId:    state.moduleId,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      // Go directly to stage 1 of the selected module
      router.push(`/dashboard/student/modules/${state.moduleId}/stage/1`);
      router.refresh();
    } catch {
      setError("Network error. Please check your connection.");
      setLoading(false);
    }
  };

  return (
    <Card
      className="max-w-xl mx-auto text-center"
      glowColor="rgba(245,158,11,0.12)"
    >
      {/* Avatar pulse */}
      <div className="text-7xl mb-2" style={{ animation: "pulse-scale 2s ease-in-out infinite" }}>
        {state.avatarEmoji || "🧙‍♂️"}
      </div>
      <h2 className="font-cinzel text-2xl font-bold mb-1">{studentName || "Hero"}</h2>
      <p className="text-[#7A9CC4] text-sm mb-7">is ready to begin the quest!</p>

      {/* Summary tags */}
      <div className="flex flex-wrap gap-2.5 justify-center mb-8">
        {[
          `🧙 ${state.avatarName || "—"}`,
          DIFF_LABELS[state.diff] || "⚡ —",
          `${state.moduleIcon} ${state.moduleTitle || "—"}`,
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
              <div className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-extrabold border-[1.5px]",
                PHASE_STYLES[s.phase]
              )}>
                {s.n}
              </div>
              <div className="text-[8px] font-bold text-[#4a6a94] text-center leading-tight">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 flex items-start gap-2.5 px-4 py-3 bg-red-950/60 border border-red-500/50 rounded-xl text-left">
          <span className="text-red-400 flex-shrink-0">⚠️</span>
          <p className="text-sm text-red-300 font-semibold">{error}</p>
        </div>
      )}

      {/* Launch */}
      <button
        type="button"
        onClick={handleLaunch}
        disabled={loading}
        className="w-full py-5 rounded-2xl font-extrabold text-lg font-nunito bg-gradient-to-br from-yellow-300 to-amber-500 text-black shadow-[0_0_30px_rgba(245,158,11,0.3)] hover:shadow-[0_12px_40px_rgba(245,158,11,0.45)] hover:-translate-y-1 disabled:opacity-60 transition-all"
      >
        {loading ? "⚔️ Starting your quest…" : "⚔️ Begin Quest!"}
      </button>

      <p className="mt-3.5 text-xs text-[#7A9CC4]">
        Your progress is saved automatically at every stage.
      </p>

      <div className="flex justify-start mt-4">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={loading}
          className="border-[#243558] text-[#7A9CC4] bg-transparent hover:border-blue-400 hover:text-blue-400 hover:bg-blue-950 rounded-xl px-6 text-sm"
        >
          ← Back
        </Button>
      </div>
    </Card>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────
export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [studentName, setStudentName] = useState("");
  const [loadingModules, setLoadingModules] = useState(true);
  const [modules, setModules] = useState<ModuleOption[]>([]);

  const [state, setState] = useState<OnboardingState>({
    avatar:      "",
    avatarName:  "",
    avatarEmoji: "",
    diff:        "",
    moduleId:    null,
    moduleTitle: "",
    moduleIcon:  "",
  });

  // Fetch current user name + active modules from the server on mount
  useEffect(() => {
    (async () => {
      try {
        // Get session user name
        const meRes  = await fetch("/api/auth/me", { credentials: "include" });
        const meData = await meRes.json();
        if (meData?.user?.name) setStudentName(meData.user.name.split(" ")[0]);

        // Get active modules for the student's section
        const modRes  = await fetch("/api/modules/available", { credentials: "include" });
        const modData = await modRes.json();

        if (modData?.success && Array.isArray(modData.modules)) {
          setModules(modData.modules);
        } else {
          // Fallback static modules if endpoint not ready yet
          setModules(FALLBACK_MODULES);
        }
      } catch {
        setModules(FALLBACK_MODULES);
      } finally {
        setLoadingModules(false);
      }
    })();
  }, []);

  const next = () => setStep((s) => Math.min(s + 1, 4));
  const back = () => setStep((s) => Math.max(s - 1, 1));

  return (
    <>
      <style>{`
        .font-cinzel { font-family: var(--font-cinzel, 'Cinzel', serif); }
        .font-nunito { font-family: var(--font-nunito, 'Nunito', sans-serif); }
        @keyframes pulse-scale {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.06); }
        }
      `}</style>

      <main className="relative min-h-screen bg-[#0B1628] text-white flex flex-col items-center justify-center p-6 pt-24 pb-12 overflow-x-hidden">
        <Starfield />
        <StepBar current={step} />

        <div className="relative z-10 w-full flex justify-center">
          {step === 1 && (
            <StepAvatar
              state={state}
              setState={setState}
              onNext={next}
              studentName={studentName}
            />
          )}
          {step === 2 && (
            <StepDifficulty
              state={state}
              setState={setState}
              onNext={next}
              onBack={back}
            />
          )}
          {step === 3 && (
            loadingModules ? (
              <div className="text-center text-[#7A9CC4] py-20">
                <div className="text-4xl mb-3 animate-spin">⚙️</div>
                <p className="text-sm">Loading available quests…</p>
              </div>
            ) : (
              <StepQuest
                state={state}
                setState={setState}
                modules={modules}
                onNext={next}
                onBack={back}
              />
            )
          )}
          {step === 4 && (
            <StepLaunch
              state={state}
              studentName={studentName}
              onBack={back}
            />
          )}
        </div>
      </main>
    </>
  );
}

// ─── FALLBACK MODULES (used if /api/modules/available fails) ──
const FALLBACK_MODULES: ModuleOption[] = [
  {
    id:     1,
    icon:   "🍱",
    title:  "Barangay Feeding Program",
    desc:   "Manage a ₱6,000 budget to prepare meals for 120 children. Balance rice, canned goods, and juice without exceeding the budget.",
    pills:  ["💰 Money", "➗ Operations", "⭐ Recommended"],
    color:  "#4A9B7F",
    tagCls: "bg-emerald-950 text-emerald-400",
    border: "border-emerald-400",
    shadow: "shadow-[0_0_24px_rgba(110,231,183,0.2)]",
    locked: false,
  },
  {
    id:     2,
    icon:   "🏪",
    title:  "Sari-Sari Store Manager",
    desc:   "Run a community store. Compute profits, manage change, and restock within a limited daily budget.",
    pills:  ["💸 Decimals", "🧮 Computation"],
    color:  "#3B82C4",
    tagCls: "bg-blue-950 text-blue-400",
    border: "border-blue-400",
    shadow: "shadow-[0_0_24px_rgba(96,165,250,0.2)]",
    locked: false,
  },
  {
    id:     3,
    icon:   "📐",
    title:  "School Garden Planner",
    desc:   "Help design the school garden. Calculate area, perimeter, and plant count — then present your plan.",
    pills:  ["📏 Measurement", "🔷 Geometry"],
    color:  "#8B5CF6",
    tagCls: "bg-purple-950 text-purple-400",
    border: "border-purple-400",
    shadow: "shadow-[0_0_24px_rgba(167,139,250,0.2)]",
    locked: false,
  },
  {
    id:     4,
    icon:   "🚌",
    title:  "Travel & Distance Planner",
    desc:   "Plan efficient routes for barangay deliveries. Solve time, distance, and schedule problems.",
    pills:  ["⏱️ Time", "📍 Distance", "🔒 Complete 2 quests"],
    color:  "#94A3B8",
    tagCls: "bg-[#1c2d50] text-[#4a6a94]",
    border: "border-[#243558]",
    shadow: "",
    locked: true,
  },
];