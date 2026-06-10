"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/* ─── CANVAS PARTICLES ─── */
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let animId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const COLORS = ["#3B82C4", "#4A9B7F", "#8B5CF6", "#F59E0B"];
    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 2.5 + 0.5,
      dx: (Math.random() - 0.5) * 0.3,
      dy: (Math.random() - 0.5) * 0.3,
      a: Math.random() * 0.5 + 0.1,
      color: COLORS[Math.floor(Math.random() * 4)],
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        const hex = Math.floor(p.a * 255).toString(16).padStart(2, "0");
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color + hex;
        ctx.fill();
        p.x += p.dx; p.y += p.dy;
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;
        if (p.y < -10) p.y = canvas.height + 10;
        if (p.y > canvas.height + 10) p.y = -10;
      });
      // connecting lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i], b = particles[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(59,130,196,${(1 - dist / 100) * 0.05})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none opacity-55"
    />
  );
}

/* ─── SCROLL REVEAL HOOK ─── */
function useReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("tsr-visible"); }),
      { threshold: 0.12 }
    );
    document.querySelectorAll(".tsr-reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

/* ─── NAVBAR ─── */
function Navbar({ onScrollTo }: { onScrollTo: (id: string) => void }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-8 md:px-12 py-3.5 sm:py-4.5 transition-all duration-300",
        scrolled
          ? "bg-white/85 dark:bg-[#0B1628]/88 backdrop-blur-xl shadow-[0_1px_0_#E2E8F0] dark:shadow-[0_1px_0_#2D3F55]"
          : "bg-transparent"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#2D3F55] pl-2 pr-3.5 py-1.5 rounded-full shadow-sm">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#3B82C4] to-[#4A9B7F] flex items-center justify-center text-white text-sm font-black font-nunito">
            T
          </div>
          <span className="text-sm font-extrabold font-nunito">
            <span className="text-[#3B82C4]">TSR</span> · Math 6
          </span>
        </div>
      </div>

      {/* Links */}
      <div className="hidden md:flex items-center gap-1">
        {[["how", "How It Works"], ["features", "Features"], ["context", "Contexts"]].map(([id, label]) => (
          <button
            key={id}
            onClick={() => onScrollTo(id)}
            className="text-sm font-medium text-[#64748B] dark:text-[#94A3B8] px-4 py-2 rounded-lg hover:bg-[#EEF2F8] dark:hover:bg-[#1E293B] hover:text-[#1E293B] dark:hover:text-[#F1F5F9] transition-all"
          >
            {label}
          </button>
        ))}
        <a
          href="/manual"
          className="text-sm font-medium text-[#64748B] dark:text-[#94A3B8] px-4 py-2 rounded-lg hover:bg-[#EEF2F8] dark:hover:bg-[#1E293B] hover:text-[#1E293B] dark:hover:text-[#F1F5F9] transition-all"
        >
          Manual
        </a>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Manual link — visible on mobile only */}
        <a
          href="/manual"
          className="sm:hidden text-sm font-bold font-nunito px-4 py-2 rounded-xl border border-[#E2E8F0] dark:border-[#2D3F55] bg-transparent text-[#1E293B] dark:text-[#F1F5F9] hover:border-[#3B82C4] hover:text-[#3B82C4] hover:bg-[#DBEAFE] dark:hover:bg-[#1e3654] transition-all"
        >
          📖 Manual
        </a>
        {/* Sign In — visible on sm+ */}
        <a
          href="/login"
          className="hidden sm:inline-flex text-sm font-bold font-nunito px-4 py-2 rounded-xl border border-[#E2E8F0] dark:border-[#2D3F55] bg-transparent text-[#1E293B] dark:text-[#F1F5F9] hover:border-[#3B82C4] hover:text-[#3B82C4] hover:bg-[#DBEAFE] dark:hover:bg-[#1e3654] transition-all"
        >
          Sign In
        </a>
        <button
          onClick={() => onScrollTo("cta")}
          className="text-sm font-bold font-nunito px-4 py-2 rounded-xl bg-[#3B82C4] text-white shadow-[0_4px_14px_rgba(59,130,196,0.35)] hover:bg-[#2563A0] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(59,130,196,0.45)] transition-all"
        >
          Get Started →
        </button>
      </div>
    </nav>
  );
}

/* ─── STAGE MARQUEE ─── */
const STAGES = [
  { n: 1,  label: "Identify & Categorize",  color: "#3B82C4" },
  { n: 2,  label: "Select & Prioritize",    color: "#3B82C4" },
  { n: 3,  label: "Define the Problem",     color: "#3B82C4" },
  { n: 4,  label: "Analyze Information",    color: "#8B5CF6" },
  { n: 5,  label: "Identify Constraints",   color: "#8B5CF6" },
  { n: 6,  label: "Root Causes",            color: "#8B5CF6" },
  { n: 7,  label: "Data Analysis",          color: "#8B5CF6" },
  { n: 8,  label: "Develop Solutions",      color: "#F59E0B" },
  { n: 9,  label: "Anticipate Problems",    color: "#F59E0B" },
  { n: 10, label: "Trial Implementation",   color: "#F59E0B" },
  { n: 11, label: "Choose Best Solution",   color: "#4A9B7F" },
  { n: 12, label: "Reflect & Review",       color: "#4A9B7F" },
];

function Marquee() {
  const doubled = [...STAGES, ...STAGES];
  return (
    <div className="relative z-10 py-10 overflow-hidden border-t border-b border-[#E2E8F0] dark:border-[#2D3F55] bg-white dark:bg-[#1E293B]">
      <p className="text-center text-[11px] font-bold tracking-[0.12em] uppercase text-[#64748B] dark:text-[#94A3B8] mb-5">
        The 12 Problem-Solving Stages
      </p>
      <div className="flex gap-3.5 w-max animate-[marquee_28s_linear_infinite] hover:[animation-play-state:paused]">
        {doubled.map(({ n, label, color }, i) => (
          <div
            key={i}
            className="flex items-center gap-2 bg-[#EEF2F8] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#2D3F55] px-4 py-2.5 rounded-full whitespace-nowrap text-sm font-semibold cursor-default hover:border-[#3B82C4] hover:text-[#3B82C4] hover:bg-[#DBEAFE] dark:hover:bg-[#1e3654] transition-all"
          >
            <span
              className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-[11px] font-extrabold text-white font-nunito shrink-0"
              style={{ background: color }}
            >
              {n}
            </span>
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── HOW IT WORKS ─── */
const HOW_CARDS = [
  {
    num: "01", icon: "🎯", title: "Understanding",
    stages: "Stages 1–3",
    desc: "Learners identify & categorize the problem, rank the key information by priority, then define a clear problem statement — building a solid foundation before any computation begins.",
    color: "#3B82C4", iconBg: "#DBEAFE",
  },
  {
    num: "02", icon: "🔍", title: "Analysis",
    stages: "Stages 4–7",
    desc: "Students organize data in tables, identify constraints with a checklist, investigate root causes, and perform guided computations — all within a real-world context they recognize.",
    color: "#8B5CF6", iconBg: "#EDE9FE",
  },
  {
    num: "03", icon: "💡", title: "Solution Development",
    stages: "Stages 8–10",
    desc: "Learners propose multiple solution plans, anticipate risks and obstacles, then run a trial budget to test whether their best plan is financially feasible.",
    color: "#F59E0B", iconBg: "#FEF3C7",
  },
  {
    num: "04", icon: "🌱", title: "Reflection",
    stages: "Stages 11–12",
    desc: "Students select and justify the best solution with evidence, then complete a metacognitive reflection — evaluating their own problem-solving process from start to finish.",
    color: "#4A9B7F", iconBg: "#D1FAE5",
  },
];

function HowItWorks() {
  return (
    <section id="how" className="relative z-10 max-w-[1140px] mx-auto px-6 py-24">
      <div className="tsr-reveal mb-14">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold tracking-[0.12em] uppercase text-[#3B82C4] bg-[#DBEAFE] dark:bg-[#1e3654] px-3 py-1 rounded-full mb-4">
          ✦ How It Works
        </div>
        <h2 className="font-nunito text-[clamp(28px,4vw,42px)] font-extrabold leading-[1.15] mb-4">
          A learning journey, not just a worksheet.
        </h2>
        <p className="text-[17px] text-[#64748B] dark:text-[#94A3B8] leading-relaxed max-w-[520px]">
          Each module anchors on one rich, real-life scenario and guides learners through all 4 phases of mathematical problem solving.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {HOW_CARDS.map((c, i) => (
          <div
            key={c.num}
            className={cn(
              "tsr-reveal bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#2D3F55] rounded-2xl p-8 relative overflow-hidden cursor-default group transition-all duration-250 hover:-translate-y-1.5 hover:shadow-[0_12px_48px_rgba(59,130,196,0.16)]",
              i === 0 && "tsr-delay-1",
              i === 1 && "tsr-delay-2",
              i === 2 && "tsr-delay-3",
              i === 3 && "tsr-delay-4"
            )}
            style={{ "--card-color": c.color } as React.CSSProperties}
          >
            {/* top bar */}
            <div className="absolute top-0 left-0 right-0 h-[3px] transition-opacity" style={{ background: c.color }} />
            <div className="font-nunito text-[52px] font-black text-[#E2E8F0] dark:text-[#2D3F55] leading-none mb-2 group-hover:text-[var(--card-color)] transition-colors">
              {c.num}
            </div>
            <div className="text-[10px] font-bold tracking-widest uppercase mb-3" style={{ color: c.color }}>{c.stages}</div>
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-4"
              style={{ background: c.iconBg }}
            >
              {c.icon}
            </div>
            <h3 className="font-nunito text-lg font-extrabold mb-2.5">{c.title}</h3>
            <p className="text-sm text-[#64748B] dark:text-[#94A3B8] leading-relaxed">{c.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── DIAGNOSTIC VISUAL ─── */
function DiagnosticVisual() {
  const bars = [
    { label: "🔵 Understanding", pct: 88, color: "#3B82C4", badge: "Good",     badgeCls: "bg-[#D1FAE5] text-[#4A9B7F]" },
    { label: "🟣 Analysis",      pct: 61, color: "#8B5CF6", badge: "Fair",     badgeCls: "bg-[#FEF3C7] text-[#F59E0B]" },
    { label: "🟠 Solution",      pct: 45, color: "#F59E0B", badge: "Needs Help", badgeCls: "bg-[#FEE2E2] text-[#E05C5C]" },
    { label: "🟢 Reflection",    pct: 78, color: "#4A9B7F", badge: "Fair",     badgeCls: "bg-[#FEF3C7] text-[#F59E0B]" },
  ];
  return (
    <div className="bg-[#EEF2F8] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#2D3F55] rounded-xl p-5">
      <p className="text-xs font-bold tracking-widest uppercase text-[#64748B] dark:text-[#94A3B8] mb-3.5">
        Juan R. — Diagnostic Snapshot
      </p>
      <div className="flex flex-col gap-3">
        {bars.map((b) => (
          <div key={b.label} className="flex items-center gap-2.5">
            <span className="text-xs font-semibold w-22.5 sm:w-27.5 shrink-0 leading-tight">{b.label}</span>
            <div className="flex-1 h-2 bg-[#E2E8F0] dark:bg-[#2D3F55] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{ width: `${b.pct}%`, background: b.color }}
              />
            </div>
            <span className="text-xs font-bold w-8 text-right" style={{ color: b.color }}>{b.pct}%</span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0", b.badgeCls)}>
              {b.badge}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3.5 p-2.5 bg-[#FEE2E2] dark:bg-[#450a0a] rounded-lg text-xs font-semibold text-[#E05C5C]">
        ⚠️ Focus on: Solution Development (Stages 8–10)
      </div>
    </div>
  );
}

/* ─── FEATURES ─── */
const FEAT_SMALL = [
  {
    icon: "🗺️", iconBg: "#D1FAE5", title: "12-Stage Journey Tracker",
    desc: "A visual progress map shows learners exactly where they are in the problem-solving process, color-coded by phase.",
    accent: "#4A9B7F",
  },
  {
    icon: "⚡", iconBg: "#FEF3C7", title: "Instant Feedback & Hints",
    desc: "Every stage delivers immediate scoring, contextual hints, and guided prompts — so learners never feel stuck.",
    accent: "#F59E0B",
  },
  {
    icon: "🧪", iconBg: "#EDE9FE", title: "Pre-Test & Post-Test",
    desc: "Teacher-assigned baseline and summative assessments measure actual learning gains for every section.",
    accent: "#8B5CF6",
  },
  {
    icon: "⚔️", iconBg: "#DBEAFE", title: "XP, Levels & Difficulty Modes",
    desc: "Students earn XP as they progress, unlock levels, and choose from three difficulty paths — Apprentice, Adventurer, or Champion.",
    accent: "#3B82C4",
  },
];

function Features() {
  return (
    <section
      id="features"
      className="relative z-10 bg-[#EEF2F8] dark:bg-[#0F172A] py-16 sm:py-24 px-5 sm:px-12"
    >
      <div className="max-w-[1140px] mx-auto">
        <div className="tsr-reveal mb-14">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold tracking-[0.12em] uppercase text-[#3B82C4] bg-[#DBEAFE] dark:bg-[#1e3654] px-3 py-1 rounded-full mb-4">
            ✦ Features
          </div>
          <h2 className="font-nunito text-[clamp(28px,4vw,42px)] font-extrabold leading-[1.15]">
            Built for learners.<br />Designed for teachers.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Large diagnostic card */}
          <div className="tsr-reveal md:col-span-2 bg-white dark:bg-[#1E293B] border-t-[3px] border-[#3B82C4] border-x border-b border-[#E2E8F0] dark:border-[#2D3F55] rounded-2xl p-8 hover:-translate-y-1 hover:shadow-[0_12px_48px_rgba(59,130,196,0.16)] transition-all cursor-default">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#DBEAFE] flex items-center justify-center text-2xl mb-4">📊</div>
                <h3 className="font-nunito text-xl font-extrabold mb-3">Automatic Diagnostic Reports</h3>
                <p className="text-sm text-[#64748B] dark:text-[#94A3B8] leading-relaxed mb-3">
                  After each module, TSR automatically generates a per-student diagnostic report grouped into 4 cognitive phases. Teachers see <em>exactly</em> where each learner struggles — not just a final score, but the specific phase where understanding breaks down.
                </p>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                  Phases tracked: Understanding (Stages 1–3) · Analysis (4–7) · Solution (8–10) · Reflection (11–12)
                </p>
              </div>
              <DiagnosticVisual />
            </div>
          </div>

          {/* Small feature cards */}
          {FEAT_SMALL.map((f, i) => (
            <div
              key={f.title}
              className={cn(
                "tsr-reveal bg-white dark:bg-[#1E293B] border-[#E2E8F0] dark:border-[#2D3F55] border-x border-b border-t-[3px] rounded-2xl p-7 hover:-translate-y-1 hover:shadow-[0_12px_48px_rgba(59,130,196,0.16)] transition-all cursor-default",
                i === 0 && "tsr-delay-1",
                i === 1 && "tsr-delay-2",
                i === 2 && "tsr-delay-1",
                i === 3 && "tsr-delay-2"
              )}
              style={{ borderTopColor: f.accent }}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl mb-4" style={{ background: f.iconBg }}>
                {f.icon}
              </div>
              <h3 className="font-nunito text-[17px] font-extrabold mb-2">{f.title}</h3>
              <p className="text-sm text-[#64748B] dark:text-[#94A3B8] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── CONTEXTS — loaded from DB ─── */
interface CtxItem { id: number; key: string; label: string; icon: string; color: string; description: string | null; }

function Contexts() {
  const [contexts, setContexts] = useState<CtxItem[]>([]);

  useEffect(() => {
    fetch("/api/contexts")
      .then((r) => r.json())
      .then((d) => { if (d.success) setContexts(d.contexts); });
  }, []);

  return (
    <section id="context" className="relative z-10 max-w-[1140px] mx-auto px-6 py-24">
      <div className="tsr-reveal text-center max-w-[560px] mx-auto mb-14">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold tracking-[0.12em] uppercase text-[#3B82C4] bg-[#DBEAFE] dark:bg-[#1e3654] px-3 py-1 rounded-full mb-4">
          ✦ Contextualization
        </div>
        <h2 className="font-nunito text-[clamp(28px,4vw,42px)] font-extrabold leading-[1.15] mb-4">
          Real problems.<br />Familiar situations.
        </h2>
        <p className="text-[17px] text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
          Every module is anchored in a real-world Filipino Grade 6 scenario — making math meaningful, not abstract.
        </p>
      </div>

      {contexts.length === 0 ? (
        /* Skeleton placeholders while loading */
        <div className="tsr-reveal grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#2D3F55] rounded-2xl p-5 text-center animate-pulse h-24" />
          ))}
        </div>
      ) : (
        <div className={cn(
          "tsr-reveal grid gap-3.5",
          contexts.length <= 3
            ? "grid-cols-1 sm:grid-cols-3 max-w-[600px] mx-auto"
            : contexts.length === 4
            ? "grid-cols-2 sm:grid-cols-4"
            : "grid-cols-2 sm:grid-cols-3 md:grid-cols-5"
        )}>
          {contexts.map((c) => (
            <div
              key={c.id}
              className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#2D3F55] rounded-2xl p-5 text-center cursor-default group transition-all hover:-translate-y-1 hover:shadow-[0_4px_24px_rgba(59,130,196,0.12)]"
              style={{ "--ctx-color": c.color } as React.CSSProperties}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = c.color + "88";
                (e.currentTarget as HTMLElement).style.backgroundColor = c.color + "11";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "";
                (e.currentTarget as HTMLElement).style.backgroundColor = "";
              }}
            >
              <div className="text-3xl mb-2.5">{c.icon}</div>
              <p className="text-xs font-bold leading-snug transition-colors" style={{ color: c.color }}>
                {c.label}
              </p>
              {c.description && (
                <p className="text-[10px] text-[#94A3B8] mt-1 leading-snug">{c.description}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* ─── STATS ─── */
const STATS = [
  { num: "12",   label: "Problem-Solving Stages" },
  { num: "4",    label: "Cognitive Phases"        },
  { num: "5",    label: "Real-Life Contexts"      },
  { num: "3",    label: "Difficulty Levels"       },
];

function Stats() {
  return (
    <section className="relative z-10 max-w-[1140px] mx-auto px-6 pb-24">
      <div
        className="tsr-reveal rounded-3xl p-8 sm:p-14 grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-center relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #3B82C4, #4A9B7F)" }}
      >
        {/* Pattern overlay */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        {STATS.map((s) => (
          <div key={s.label} className="relative">
            <div className="font-nunito text-[36px] sm:text-[44px] font-black text-white leading-none mb-2">{s.num}</div>
            <div className="text-sm text-white/75 font-medium">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ─── CTA ─── */
function CTA() {
  return (
    <section id="cta" className="relative z-10 text-center px-5 sm:px-6 pb-20 sm:pb-28 pt-4">
      <div className="tsr-reveal max-w-[680px] mx-auto bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#2D3F55] rounded-[28px] p-8 sm:p-16 shadow-[0_12px_48px_rgba(59,130,196,0.16)] relative overflow-hidden">
        {/* Glow */}
        <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,#DBEAFE_0%,transparent_70%)] dark:bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(96,165,250,0.08)_0%,transparent_70%)]" />
        <div className="relative z-10">
          <div className="text-5xl mb-5">⚔️</div>
          <h2 className="font-nunito text-[clamp(22px,5vw,34px)] font-black mb-3.5 leading-tight">
            Ready to begin your<br />problem-solving quest?
          </h2>
          <p className="text-base text-[#64748B] dark:text-[#94A3B8] mb-8 leading-relaxed">
            Students dive into interactive 12-stage modules and earn XP. Teachers manage sections, assign modules, grade responses, and view diagnostic reports.
          </p>
          <div className="flex gap-3.5 justify-center flex-wrap">
            <a
              href="/register"
              className="flex flex-col items-center gap-1.5 bg-[#EEF2F8] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#2D3F55] px-8 py-5 rounded-2xl cursor-pointer hover:-translate-y-1 hover:border-[#3B82C4] hover:bg-[#DBEAFE] dark:hover:bg-[#1e3654] hover:shadow-[0_4px_24px_rgba(59,130,196,0.1)] transition-all no-underline"
            >
              <span className="text-[28px]">🎒</span>
              <span className="font-nunito text-sm font-extrabold text-[#1E293B] dark:text-[#F1F5F9]">I'm a Student</span>
              <span className="text-xs text-[#64748B] dark:text-[#94A3B8]">Create your account</span>
            </a>
            <a
              href="/login"
              className="flex flex-col items-center gap-1.5 bg-[#EEF2F8] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#2D3F55] px-8 py-5 rounded-2xl cursor-pointer hover:-translate-y-1 hover:border-[#4A9B7F] hover:bg-[#D1FAE5] dark:hover:bg-[#064e35] hover:shadow-[0_4px_24px_rgba(74,155,127,0.1)] transition-all no-underline"
            >
              <span className="text-[28px]">📋</span>
              <span className="font-nunito text-sm font-extrabold text-[#1E293B] dark:text-[#F1F5F9]">I'm a Teacher</span>
              <span className="text-xs text-[#64748B] dark:text-[#94A3B8]">Sign in to dashboard</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── FOOTER ─── */
function Footer() {
  return (
    <footer className="relative z-10 border-t border-[#E2E8F0] dark:border-[#2D3F55] px-5 sm:px-12 py-8 flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-[#64748B] dark:text-[#94A3B8] text-center md:text-left">
      <div className="flex items-center gap-2 font-nunito font-bold">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#3B82C4] to-[#4A9B7F] flex items-center justify-center text-white text-xs font-black">
          T
        </div>
        Think · Solve · Reflect
      </div>
      <span>Grade 6 Mathematics · Stage-Based Interactive Module</span>
      <span>Built with Next.js · Prisma · PostgreSQL</span>
    </footer>
  );
}

/* ─── MAIN PAGE ─── */
export default function WelcomePage() {
  useReveal();

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <style>{`
        /* ── fonts ── */
        .font-nunito { font-family: var(--font-nunito, 'Nunito', sans-serif); }

        /* ── marquee ── */
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }

        /* ── scroll reveal ── */
        .tsr-reveal {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.6s ease, transform 0.6s ease;
        }
        .tsr-reveal.tsr-visible { opacity: 1; transform: translateY(0); }
        .tsr-delay-1 { transition-delay: 0.1s; }
        .tsr-delay-2 { transition-delay: 0.2s; }
        .tsr-delay-3 { transition-delay: 0.3s; }
        .tsr-delay-4 { transition-delay: 0.4s; }

        /* ── hero animations ── */
        @keyframes fadeUp   { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeDown { from { opacity:0; transform:translateY(-12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes blink    { 0%,100%{ opacity:1; } 50%{ opacity:0.3; } }
        @keyframes bounce   { 0%,100%{ transform:translateY(0); } 50%{ transform:translateY(5px); } }
        @keyframes floatOrb {
          0%   { transform: translate(0,0) rotate(0deg); }
          33%  { transform: translate(30px,-20px) rotate(120deg); }
          66%  { transform: translate(-20px,30px) rotate(240deg); }
          100% { transform: translate(0,0) rotate(360deg); }
        }

        .hero-badge-anim  { animation: fadeDown 0.6s ease both; }
        .hero-sub-anim    { animation: fadeUp 0.7s 0.18s ease both; }
        .hero-title-anim  { animation: fadeUp 0.7s 0.1s ease both; }
        .hero-desc-anim   { animation: fadeUp 0.7s 0.26s ease both; }
        .hero-cta-anim    { animation: fadeUp 0.7s 0.34s ease both; }
        .hero-scroll-anim { animation: fadeUp 0.7s 0.5s ease both; }
        .badge-dot        { animation: blink 2s infinite; }
        .scroll-bounce    { animation: bounce 2s infinite; }

        .orb {
          position: absolute; border-radius: 50%; filter: blur(60px);
          pointer-events: none;
        }
        .orb-1 { width:400px; height:400px; background:rgba(59,130,196,0.12); top:-100px; left:-100px; animation: floatOrb 20s linear infinite; }
        .orb-2 { width:300px; height:300px; background:rgba(74,155,127,0.10); bottom:-80px; right:-80px; animation: floatOrb 25s linear reverse infinite; }
        .orb-3 { width:200px; height:200px; background:rgba(245,158,11,0.08); top:40%; left:10%; animation: floatOrb 18s linear infinite; }
      `}</style>

      <div className="min-h-screen bg-[#F5F7FA] dark:bg-[#0B1628] text-[#1E293B] dark:text-[#F1F5F9] overflow-x-hidden">
        <ParticleCanvas />
        <Navbar onScrollTo={scrollTo} />

        {/* ── HERO ── */}
        <div className="relative min-h-screen flex items-center justify-center text-center px-5 pt-22.5 sm:pt-30 pb-16 sm:pb-20 overflow-hidden">
          {/* Mesh background */}
          <div
            className="absolute inset-0 z-[-1]"
            style={{
              background:
                "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(59,130,196,0.12) 0%, transparent 70%), radial-gradient(ellipse 50% 40% at 80% 80%, rgba(74,155,127,0.10) 0%, transparent 60%), radial-gradient(ellipse 40% 30% at 20% 60%, rgba(139,92,246,0.08) 0%, transparent 60%)",
            }}
          />
          <div className="orb orb-1" />
          <div className="orb orb-2" />
          <div className="orb orb-3" />

          <div className="relative z-10 max-w-[780px]">
            {/* Badge */}
            <div className="hero-badge-anim inline-flex items-center gap-2 bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#2D3F55] px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold text-[#64748B] dark:text-[#94A3B8] mb-6 shadow-sm max-w-[90vw] text-center leading-snug">
              <span className="badge-dot w-2 h-2 rounded-full bg-[#4A9B7F] shrink-0" />
              <span>Grade 6 Mathematics · 12-Stage Problem-Solving · 5 Real-World Scenarios</span>
            </div>

            {/* Sub-title */}
            <p className="hero-sub-anim text-[13px] font-extrabold tracking-[0.14em] uppercase text-[#64748B] dark:text-[#94A3B8] mb-3">
              A 12-Stage Problem-Solving Journey
            </p>

            {/* Main title */}
            <h1 className="hero-title-anim font-nunito font-black leading-[1.08] tracking-tight mb-3"
              style={{ fontSize: "clamp(42px,7vw,72px)" }}
            >
              <span className="text-[#3B82C4]">Think</span>
              <span className="text-[#64748B] dark:text-[#94A3B8] font-light"> · </span>
              <span className="text-[#4A9B7F]">Solve</span>
              <span className="text-[#64748B] dark:text-[#94A3B8] font-light"> · </span>
              <span className="text-[#F59E0B]">Reflect</span>
            </h1>

            {/* Description */}
            <p className="hero-desc-anim text-base sm:text-lg text-[#64748B] dark:text-[#94A3B8] leading-relaxed max-w-140 mx-auto mb-8 sm:mb-10">
              An interactive, stage-based mathematics module designed for Grade 6 learners — guiding them step-by-step through real-life problem solving while helping teachers identify exactly where students struggle.
            </p>

            {/* CTA buttons */}
            <div className="hero-cta-anim flex items-center justify-center gap-3 flex-wrap">
              <button
                onClick={() => scrollTo("cta")}
                className="font-nunito font-bold px-6 py-3.5 sm:px-8 sm:py-4 rounded-2xl bg-[#3B82C4] text-white text-sm sm:text-base shadow-[0_4px_14px_rgba(59,130,196,0.35)] hover:bg-[#2563A0] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(59,130,196,0.45)] transition-all"
              >
                🚀 Start Learning
              </button>
              <button
                onClick={() => scrollTo("how")}
                className="font-nunito font-bold px-6 py-3.5 sm:px-8 sm:py-4 rounded-2xl text-sm sm:text-base border border-[#E2E8F0] dark:border-[#2D3F55] bg-transparent text-[#1E293B] dark:text-[#F1F5F9] hover:border-[#3B82C4] hover:text-[#3B82C4] hover:bg-[#DBEAFE] dark:hover:bg-[#1e3654] transition-all"
              >
                See How It Works
              </button>
            </div>

            {/* Scroll hint */}
            <div className="hero-scroll-anim flex flex-col items-center gap-2 mt-10 sm:mt-16">
              <span className="text-xs tracking-[0.1em] uppercase text-[#64748B] dark:text-[#94A3B8]">Scroll to explore</span>
              <div className="scroll-bounce w-7 h-7 border border-[#E2E8F0] dark:border-[#2D3F55] rounded-full flex items-center justify-center text-xs text-[#64748B]">
                ↓
              </div>
            </div>
          </div>
        </div>

        <Marquee />
        <HowItWorks />
        <Features />
        <Contexts />
        <Stats />
        <CTA />
        <Footer />
      </div>
    </>
  );
}