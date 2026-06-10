"use client";

import { ReactNode } from "react";

// ─── Types ────────────────────────────────────────────────────
export type AuthRune = {
  emoji: string;
  top:   string;
  left:  string;
  size:  number;
  delay: string;
  dur:   string;
};

export const AUTH_RUNES_DEFAULT: AuthRune[] = [
  { emoji: "⚔️", top: "8%",  left: "4%",  size: 28, delay: "0s",   dur: "6s"   },
  { emoji: "🛡️", top: "15%", left: "91%", size: 24, delay: "1.2s", dur: "7s"   },
  { emoji: "🗺️", top: "72%", left: "6%",  size: 22, delay: "0.6s", dur: "8s"   },
  { emoji: "⭐",  top: "80%", left: "88%", size: 26, delay: "2s",   dur: "5.5s" },
  { emoji: "🔮", top: "42%", left: "2%",  size: 20, delay: "1.8s", dur: "9s"   },
  { emoji: "📜", top: "55%", left: "93%", size: 20, delay: "0.3s", dur: "7.5s" },
  { emoji: "🏆", top: "28%", left: "88%", size: 22, delay: "2.5s", dur: "6.5s" },
  { emoji: "🌟", top: "90%", left: "45%", size: 18, delay: "1s",   dur: "8.5s" },
];

export const AUTH_RUNES_REGISTER: AuthRune[] = [
  { emoji: "✨", top: "6%",  left: "5%",  size: 26, delay: "0s",   dur: "7s"   },
  { emoji: "🗺️", top: "18%", left: "92%", size: 22, delay: "1.4s", dur: "6s"   },
  { emoji: "🏆", top: "68%", left: "4%",  size: 24, delay: "0.8s", dur: "8s"   },
  { emoji: "⭐",  top: "82%", left: "90%", size: 20, delay: "2.1s", dur: "5.5s" },
  { emoji: "🔮", top: "45%", left: "1%",  size: 18, delay: "1.6s", dur: "9s"   },
  { emoji: "📜", top: "55%", left: "94%", size: 19, delay: "0.4s", dur: "7.5s" },
  { emoji: "⚔️", top: "30%", left: "90%", size: 22, delay: "2.8s", dur: "6.5s" },
  { emoji: "🌟", top: "92%", left: "42%", size: 17, delay: "1.1s", dur: "8.5s" },
];

// ─── Props ────────────────────────────────────────────────────
type AuthLayoutProps = {
  /** Large emoji shown above the card as the app logo */
  logoEmoji: string;
  /** Bold Cinzel heading below the logo */
  title: string;
  /** Muted subtitle below the heading */
  subtitle: string;
  /** The card and anything below it (rendered inside the centered column) */
  children: ReactNode;
  /** Floating background runes — defaults to the login set */
  runes?: AuthRune[];
  /** Tailwind max-width class for the centered column (default: max-w-md) */
  maxWidth?: string;
  /** Extra vertical padding on the outer <main> — useful for tall forms */
  tallPage?: boolean;
};

// ─── Component ───────────────────────────────────────────────
export default function AuthLayout({
  logoEmoji,
  title,
  subtitle,
  children,
  runes = AUTH_RUNES_DEFAULT,
  maxWidth = "max-w-md",
  tallPage = false,
}: AuthLayoutProps) {
  return (
    <>
      <style>{`
        @keyframes float-rune {
          0%, 100% { transform: translateY(0px)   rotate(0deg); }
          33%       { transform: translateY(-14px) rotate(4deg); }
          66%       { transform: translateY(8px)   rotate(-3deg); }
        }
        @keyframes card-in {
          from { opacity: 0; transform: translateY(28px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }
        @keyframes logo-pulse {
          0%, 100% { transform: scale(1);    filter: drop-shadow(0 0 12px rgba(96,165,250,0.4)); }
          50%       { transform: scale(1.05); filter: drop-shadow(0 0 24px rgba(96,165,250,0.7)); }
        }
        @keyframes step-slide {
          from { opacity: 0; transform: translateX(24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .card-animate { animation: card-in    0.5s  cubic-bezier(.34,1.56,.64,1) both; }
        .logo-animate { animation: logo-pulse 3s    ease-in-out infinite; }
        .step-animate { animation: step-slide 0.35s cubic-bezier(.34,1.56,.64,1) both; }
        .font-cinzel  { font-family: var(--font-cinzel, 'Cinzel',  serif); }
        .font-nunito  { font-family: var(--font-nunito, 'Nunito',  sans-serif); }
      `}</style>

      <main
        className={`relative min-h-screen bg-[#0B1628] text-white flex items-center justify-center p-6 overflow-hidden${tallPage ? " py-12" : ""}`}
      >
        {/* Blue dot-grid background */}
        <div
          className="fixed inset-0 z-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(#60A5FA 1px, transparent 1px), linear-gradient(90deg, #60A5FA 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        {/* Centre radial glow */}
        <div
          className="fixed inset-0 z-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(96,165,250,0.07) 0%, transparent 70%)",
          }}
        />

        {/* Floating runes */}
        {runes.map((r, i) => (
          <div
            key={i}
            className="fixed pointer-events-none select-none opacity-[0.07] z-0"
            style={{
              top:       r.top,
              left:      r.left,
              fontSize:  r.size,
              animation: `float-rune ${r.dur} ease-in-out ${r.delay} infinite`,
            }}
          >
            {r.emoji}
          </div>
        ))}

        {/* Centred column */}
        <div className={`relative z-10 w-full ${maxWidth} card-animate`}>

          {/* ── Brand header ── */}
          <div className="text-center mb-8">
            <div className="logo-animate inline-block text-5xl mb-3">{logoEmoji}</div>
            <h1 className="font-cinzel text-2xl font-bold tracking-wide mb-1">{title}</h1>
            <p className="text-[#7A9CC4] text-sm">{subtitle}</p>
          </div>

          {/* ── Page-specific content (card + extras) ── */}
          {children}

          {/* ── Footer ── */}
          <p className="text-center text-xs text-[#4a6a94] mt-5 font-semibold tracking-wide">
            🔒 Secured · 📜 TSR v1.0 · 🏫 For Schools
          </p>
        </div>
      </main>
    </>
  );
}
