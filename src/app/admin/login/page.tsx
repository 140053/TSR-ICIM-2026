"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/* ─── INPUT FIELD ─── */
function Field({
  label, icon, type = "text", placeholder, value, onChange, error,
}: {
  label: string; icon: string; type?: string; placeholder: string;
  value: string; onChange: (v: string) => void; error?: string;
}) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-bold tracking-widest uppercase text-[#7BAF84]">
        {icon} {label}
      </label>
      <div className="relative">
        <Input
          type={isPassword && show ? "text" : type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "bg-[#0A180E] border text-white placeholder:text-[#3A5A40] rounded-xl h-12 px-4 pr-11 transition-all focus-visible:ring-0",
            error
              ? "border-red-500 focus-visible:border-red-500"
              : "border-[#1E3524] focus-visible:border-[#4A9B7F]"
          )}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3A5A40] hover:text-[#7BAF84] text-sm transition-colors"
          >
            {show ? "🙈" : "👁️"}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-400 font-semibold">{error}</p>}
    </div>
  );
}

/* ─── ADMIN LOGIN PAGE ─── */
function AdminLoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [errors,   setErrors]   = useState<{ email?: string; password?: string; general?: string }>({});
  const [loading,  setLoading]  = useState(false);

  const validate = (): typeof errors => {
    const e: typeof errors = {};
    if (!email.trim())                    e.email    = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email    = "Enter a valid email.";
    if (!password)                        e.password = "Password is required.";
    else if (password.length < 6)         e.password = "At least 6 characters.";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method:      "POST",
        headers:     { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email:    email.trim().toLowerCase(),
          password,
          role:     "ADMIN",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrors({ general: data.error ?? "Login failed. Please try again." });
        setLoading(false);
        return;
      }

      const redirectTo =
        searchParams.get("redirect") ??
        data.redirectTo ??
        "/admin";

      router.push(redirectTo);
      router.refresh();
    } catch {
      setErrors({ general: "Network error. Please check your connection." });
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) handleSubmit();
  };

  return (
    <>
      <style>{`
        @keyframes card-in {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        @keyframes shield-pulse {
          0%, 100% { filter: drop-shadow(0 0 10px rgba(74,155,127,0.4)); }
          50%       { filter: drop-shadow(0 0 22px rgba(74,155,127,0.75)); }
        }
        @keyframes scan-line {
          0%   { transform: translateY(-100%); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translateY(400%);  opacity: 0; }
        }
        .card-animate   { animation: card-in 0.45s cubic-bezier(.34,1.56,.64,1) both; }
        .shield-animate { animation: shield-pulse 3s ease-in-out infinite; }
        .scan-line      { animation: scan-line 4s ease-in-out 1s infinite; }
        .font-cinzel    { font-family: var(--font-cinzel, 'Cinzel', serif); }
        .font-nunito    { font-family: var(--font-nunito, 'Nunito', sans-serif); }
      `}</style>

      <main
        className="relative min-h-screen bg-[#050E08] text-white flex items-center justify-center p-6 overflow-hidden"
        onKeyDown={handleKeyDown}
      >
        {/* Grid background */}
        <div
          className="fixed inset-0 z-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(74,155,127,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(74,155,127,0.06) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Radial glow */}
        <div
          className="fixed inset-0 z-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 55% 45% at 50% 50%, rgba(74,155,127,0.08) 0%, transparent 70%)",
          }}
        />

        {/* Corner accents */}
        <div className="fixed top-0 left-0 w-32 h-32 pointer-events-none z-0"
          style={{ background: "radial-gradient(circle at 0 0, rgba(74,155,127,0.12) 0%, transparent 70%)" }} />
        <div className="fixed bottom-0 right-0 w-32 h-32 pointer-events-none z-0"
          style={{ background: "radial-gradient(circle at 100% 100%, rgba(74,155,127,0.12) 0%, transparent 70%)" }} />

        {/* Card */}
        <div className="relative z-10 w-full max-w-sm card-animate">

          {/* Brand */}
          <div className="text-center mb-7">
            <div className="shield-animate inline-block text-5xl mb-3 select-none">🛡️</div>
            <h1 className="font-cinzel text-xl font-bold tracking-widest text-[#4A9B7F] mb-1 uppercase">
              System Administration
            </h1>
            <p className="text-[#3A5A40] text-xs tracking-widest uppercase font-semibold">
              TSR · Authorized Access Only
            </p>
          </div>

          {/* Main card */}
          <div className="relative bg-[#0B1E10] border border-[#1E3524] rounded-2xl p-7 shadow-[0_8px_48px_rgba(0,0,0,0.6)] overflow-hidden">

            {/* Top border accent */}
            <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#4A9B7F] to-transparent" />

            {/* Scan-line animation */}
            <div
              className="scan-line absolute left-0 right-0 h-[1px] bg-[#4A9B7F] opacity-20 pointer-events-none z-10"
              style={{ top: "0" }}
            />

            <div className="relative z-10 flex flex-col gap-5">

              {/* Portal badge */}
              <div className="flex items-center gap-2 px-3 py-2 bg-[#0A180E] border border-[#1E3524] rounded-xl w-fit">
                <span className="w-2 h-2 rounded-full bg-[#4A9B7F] shadow-[0_0_6px_#4A9B7F]" />
                <span className="text-[11px] font-bold tracking-widest uppercase text-[#4A9B7F]">
                  Admin Portal
                </span>
              </div>

              <div>
                <h2 className="font-nunito text-lg font-extrabold text-white">
                  Administrator Sign In
                </h2>
                <p className="text-xs text-[#3A5A40] mt-0.5">
                  Enter your credentials to access the control panel.
                </p>
              </div>

              {/* Fields */}
              <div className="flex flex-col gap-4">
                <Field
                  label="Admin Email" icon="📧" type="email"
                  placeholder="admin@school.edu.ph"
                  value={email} onChange={setEmail} error={errors.email}
                />
                <Field
                  label="Password" icon="🔑" type="password"
                  placeholder="••••••••"
                  value={password} onChange={setPassword} error={errors.password}
                />
              </div>

              {/* General error */}
              {errors.general && (
                <div className="flex items-start gap-2.5 px-4 py-3 bg-red-950/40 border border-red-500/40 rounded-xl">
                  <span className="text-red-400 flex-shrink-0 mt-0.5">⚠️</span>
                  <p className="text-sm text-red-300 font-semibold leading-snug">{errors.general}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-nunito font-extrabold text-sm bg-[#4A9B7F] hover:bg-[#3A8A6E] text-white shadow-[0_0_24px_rgba(74,155,127,0.25)] hover:shadow-[0_4px_32px_rgba(74,155,127,0.4)] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loading ? "⏳ Authenticating…" : "🛡️ Access Control Panel"}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-[#1E3524]" />
                <span className="text-[10px] text-[#3A5A40] font-bold tracking-widest uppercase">not admin?</span>
                <div className="flex-1 h-px bg-[#1E3524]" />
              </div>

              {/* Back to regular login */}
              <p className="text-center text-xs text-[#3A5A40]">
                Go to{" "}
                <a
                  href="/login"
                  className="text-[#4A9B7F] hover:text-[#7BAF84] font-bold transition-colors"
                >
                  Student / Teacher Login
                </a>
              </p>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-[10px] text-[#1E3524] mt-5 font-semibold tracking-widest uppercase">
            Secured · TSR v1.0 · Restricted Access
          </p>
        </div>
      </main>
    </>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <AdminLoginForm />
    </Suspense>
  );
}
