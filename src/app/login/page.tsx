"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import AuthLayout from "@/components/auth/AuthLayout";

/* ─── TYPES ─── */
type Role = "student" | "teacher";

/* ─── ROLE TOGGLE ─── */
function RoleToggle({ role, onChange }: { role: Role; onChange: (r: Role) => void }) {
  return (
    <div className="relative flex bg-[#101f38] border border-[#243558] rounded-xl p-1 mb-7">
      <div
        className={cn(
          "absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-[10px] transition-all duration-300",
          role === "student"
            ? "left-1 bg-gradient-to-br from-blue-500 to-blue-700 shadow-[0_0_20px_rgba(96,165,250,0.35)]"
            : "left-[calc(50%+3px)] bg-gradient-to-br from-amber-400 to-amber-600 shadow-[0_0_20px_rgba(245,158,11,0.35)]"
        )}
      />
      {(["student", "teacher"] as Role[]).map((r) => (
        <button
          key={r}
          type="button"
          onClick={() => onChange(r)}
          className={cn(
            "relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[10px] text-sm font-bold font-nunito transition-colors duration-200",
            role === r ? "text-white" : "text-[#4a6a94] hover:text-[#7A9CC4]"
          )}
        >
          <span>{r === "student" ? "🎒" : "📋"}</span>
          {r === "student" ? "I'm a Student" : "I'm a Teacher"}
        </button>
      ))}
    </div>
  );
}

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
      <label className="text-[11px] font-bold tracking-widest uppercase text-[#7A9CC4]">
        {icon} {label}
      </label>
      <div className="relative">
        <Input
          type={isPassword && show ? "text" : type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "bg-[#101f38] border text-white placeholder:text-[#4a6a94] rounded-xl h-12 px-4 pr-11 transition-all",
            error
              ? "border-red-500 focus-visible:ring-red-500/30"
              : "border-[#243558] focus-visible:ring-blue-400/30 focus-visible:border-blue-400"
          )}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4a6a94] hover:text-[#7A9CC4] text-sm transition-colors"
          >
            {show ? "🙈" : "👁️"}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-400 font-semibold">{error}</p>}
    </div>
  );
}

/* ─── MAIN LOGIN PAGE ─── */
function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [role,     setRole]     = useState<Role>("student");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [errors,   setErrors]   = useState<{ email?: string; password?: string; general?: string }>({});
  const [loading,  setLoading]  = useState(false);

  const isStudent = role === "student";

  /* ── Validation ── */
  const validate = (): typeof errors => {
    const e: typeof errors = {};
    if (!email.trim())               e.email    = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Enter a valid email.";
    if (!password)                   e.password = "Password is required.";
    else if (password.length < 6)   e.password = "At least 6 characters.";
    return e;
  };

  /* ── Submit → POST /api/auth/login ── */
  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method:      "POST",
        headers:     { "Content-Type": "application/json" },
        credentials: "include",                       // send / receive cookies
        body: JSON.stringify({
          email:    email.trim().toLowerCase(),
          password,
          role:     role.toUpperCase(),               // API expects "STUDENT" | "TEACHER"
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrors({ general: data.error ?? "Login failed. Please try again." });
        setLoading(false);
        return;
      }

      // Respect ?redirect= param (set by proxy.ts when bouncing unauthenticated users)
      // otherwise fall back to the path the API suggests
      const redirectTo =
        searchParams.get("redirect") ??
        data.redirectTo ??
        (role === "student" ? "/dashboard/student" : "/dashboard/teacher");

      router.push(redirectTo);
      router.refresh(); // flush RSC cache so layouts re-read the new session cookie

    } catch {
      setErrors({ general: "Network error. Please check your connection." });
      setLoading(false);
    }
  };

  /* ── Submit on Enter key ── */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) handleSubmit();
  };

  return (
    <AuthLayout
      logoEmoji="⚔️"
      title="The Scholar's Quest"
      subtitle="Your adventure awaits — sign in to continue"
    >
      {/* Capture Enter key over the whole card area */}
      <div onKeyDown={handleKeyDown}>
        <div className="bg-[#162240] border border-[#243558] rounded-3xl p-8 shadow-[0_8px_48px_rgba(0,0,0,0.5)] relative overflow-hidden">

          {/* Dynamic top glow */}
          <div
            className="absolute inset-0 z-0 pointer-events-none transition-all duration-500"
            style={{
              background: isStudent
                ? "radial-gradient(ellipse 80% 35% at 50% 0%, rgba(96,165,250,0.09) 0%, transparent 70%)"
                : "radial-gradient(ellipse 80% 35% at 50% 0%, rgba(245,158,11,0.09) 0%, transparent 70%)",
            }}
          />

          {/* Accent top border */}
          <div
            className={cn(
              "absolute top-0 left-0 right-0 h-[2px] transition-all duration-500",
              isStudent
                ? "bg-gradient-to-r from-transparent via-blue-400 to-transparent"
                : "bg-gradient-to-r from-transparent via-amber-400 to-transparent"
            )}
          />

          <div className="relative z-10">

            {/* Role toggle */}
            <RoleToggle role={role} onChange={(r) => { setRole(r); setErrors({}); }} />

            {/* Portal badge + heading */}
            <div className="mb-6">
              <div className={cn(
                "inline-flex items-center gap-2 text-[11px] font-bold tracking-widest uppercase px-3 py-1 rounded-full border mb-3 transition-all duration-300",
                isStudent
                  ? "bg-blue-950 border-blue-500 text-blue-400"
                  : "bg-amber-950 border-amber-500 text-amber-400"
              )}>
                {isStudent ? "🎒 Student Portal" : "📋 Teacher Portal"}
              </div>
              <h2 className="font-cinzel text-xl font-bold leading-tight">
                {isStudent ? "Welcome back, Hero!" : "Welcome back, Sensei!"}
              </h2>
              <p className="text-sm text-[#7A9CC4] mt-1">
                {isStudent
                  ? "Sign in to resume your quest and track your progress."
                  : "Sign in to manage your class and monitor student journeys."}
              </p>
            </div>

            {/* Fields */}
            <div className="flex flex-col gap-4 mb-5">
              <Field
                label="Email Address" icon="📧" type="email"
                placeholder={isStudent ? "juan@school.edu.ph" : "teacher@school.edu.ph"}
                value={email} onChange={setEmail} error={errors.email}
              />
              <Field
                label="Password" icon="🔑" type="password"
                placeholder="••••••••"
                value={password} onChange={setPassword} error={errors.password}
              />
            </div>

            {/* General API error */}
            {errors.general && (
              <div className="mb-5 flex items-start gap-2.5 px-4 py-3 bg-red-950/60 border border-red-500/50 rounded-xl">
                <span className="text-red-400 text-base flex-shrink-0 mt-0.5">⚠️</span>
                <p className="text-sm text-red-300 font-semibold leading-snug">{errors.general}</p>
              </div>
            )}

            {/* Forgot password */}
            <div className="flex justify-end mb-6">
              <button
                type="button"
                className="text-xs text-[#7A9CC4] hover:text-blue-400 transition-colors font-semibold"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit button */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className={cn(
                "w-full py-4 rounded-2xl font-extrabold text-base font-nunito transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed",
                isStudent
                  ? "bg-gradient-to-br from-blue-400 to-blue-700 text-white shadow-[0_0_28px_rgba(96,165,250,0.35)] hover:shadow-[0_8px_36px_rgba(96,165,250,0.5)] hover:-translate-y-0.5"
                  : "bg-gradient-to-br from-amber-300 to-amber-600 text-black shadow-[0_0_28px_rgba(245,158,11,0.35)] hover:shadow-[0_8px_36px_rgba(245,158,11,0.5)] hover:-translate-y-0.5"
              )}
            >
              {loading
                ? "⏳ Signing in…"
                : isStudent
                ? "⚔️ Enter the Quest"
                : "📋 Enter the Classroom"}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-[#243558]" />
              <span className="text-[11px] text-[#4a6a94] font-semibold tracking-widest uppercase">or</span>
              <div className="flex-1 h-px bg-[#243558]" />
            </div>

            {/* Register link */}
            <p className="text-center text-sm text-[#7A9CC4]">
              {isStudent ? "New adventurer?" : "New to TSR?"}{" "}
              <a
                href="/register"
                className={cn(
                  "font-bold transition-colors",
                  isStudent ? "text-blue-400 hover:text-blue-300" : "text-amber-400 hover:text-amber-300"
                )}
              >
                {isStudent ? "Create your account" : "Request access"}
              </a>
            </p>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}