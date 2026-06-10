// app/admin/setup/_components/AdminSetupClient.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

// ─── PASSWORD STRENGTH ────────────────────────────────────────
function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const bars  = ["", "bg-[#E05C5C]", "bg-[#F59E0B]", "bg-[#3B82C4]", "bg-[#4A9B7F]"];
  const texts = ["", "Weak", "Fair", "Good", "Strong"];
  const tclrs = ["", "text-[#E05C5C]", "text-[#F59E0B]", "text-[#3B82C4]", "text-[#4A9B7F]"];
  return (
    <div className="mt-2 flex flex-col gap-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={cn("h-1 flex-1 rounded-full transition-all", i <= score ? bars[score] : "bg-[#E2E8F0] dark:bg-[#334155]")} />
        ))}
      </div>
      {score > 0 && (
        <p className={cn("text-[11px] font-semibold", tclrs[score])}>
          {texts[score]}{score < 3 && " — add uppercase, numbers, or symbols"}
        </p>
      )}
    </div>
  );
}

// ─── FIELD ────────────────────────────────────────────────────
function Field({
  label, icon, type = "text", placeholder, value, onChange, error, hint,
}: {
  label: string; icon: string; type?: string; placeholder: string;
  value: string; onChange: (v: string) => void; error?: string; hint?: string;
}) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-bold tracking-widest uppercase text-[#64748B] dark:text-[#94A3B8]">
        {icon} {label}
      </label>
      <div className="relative">
        <Input
          type={isPassword && show ? "text" : type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "bg-[#EEF2F8] dark:bg-[#162032] border text-[#1E293B] dark:text-[#F1F5F9]",
            "placeholder:text-[#94A3B8] rounded-xl h-12 px-4 transition-all",
            error
              ? "border-[#E05C5C] focus-visible:ring-[#E05C5C]/30"
              : "border-[#E2E8F0] dark:border-[#334155] focus-visible:ring-[#8B5CF6]/30 focus-visible:border-[#8B5CF6]"
          )}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B] text-sm transition-colors"
          >
            {show ? "🙈" : "👁️"}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-[#E05C5C] font-semibold">{error}</p>}
      {hint && !error && <p className="text-xs text-[#94A3B8]">{hint}</p>}
    </div>
  );
}

// ─── INVALID TOKEN SCREEN ─────────────────────────────────────
function InvalidToken({ providedToken }: { providedToken: string }) {
  return (
    <main className="min-h-screen bg-[#F5F7FA] dark:bg-[#0F172A] flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center">
        <div className="text-5xl mb-4">🔒</div>
        <h1 className="font-nunito text-xl font-extrabold text-[#1E293B] dark:text-[#F1F5F9] mb-2">
          Access Denied
        </h1>
        <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mb-6 leading-relaxed">
          {providedToken
            ? "The setup token you provided is invalid or expired."
            : "A setup token is required to access this page."}
        </p>
        <div className="bg-[#FEE2E2] dark:bg-[#450a0a] border border-[#E05C5C] rounded-2xl p-4 mb-6 text-left">
          <p className="text-xs font-bold text-[#E05C5C] mb-2">To access this page:</p>
          <ol className="text-xs text-[#E05C5C] space-y-1 list-decimal list-inside leading-relaxed">
            <li>Set <code className="bg-[#FEE2E2] px-1 rounded font-mono">ADMIN_SETUP_TOKEN</code> in your <code className="bg-[#FEE2E2] px-1 rounded font-mono">.env</code></li>
            <li>Visit <code className="bg-[#FEE2E2] px-1 rounded font-mono">/admin/setup?token=YOUR_TOKEN</code></li>
          </ol>
        </div>
        <a
          href="/login"
          className="text-sm font-bold text-[#8B5CF6] hover:text-[#7c3aed] transition-colors"
        >
          ← Back to Login
        </a>
      </div>
    </main>
  );
}

// ─── SUCCESS SCREEN ───────────────────────────────────────────
function SuccessScreen({ name }: { name: string }) {
  const router = useRouter();
  return (
    <div className="text-center py-4">
      <div className="text-6xl mb-4 animate-bounce">🎉</div>
      <h2 className="font-nunito text-2xl font-extrabold mb-2">Admin account created!</h2>
      <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mb-6">
        Welcome, <strong className="text-[#1E293B] dark:text-[#F1F5F9]">{name}</strong>.<br />
        You are now signed in as an administrator.
      </p>
      <button
        onClick={() => router.push("/admin")}
        className="w-full py-4 rounded-2xl font-extrabold text-sm font-nunito bg-gradient-to-br from-[#8B5CF6] to-[#6D28D9] text-white shadow-[0_0_28px_rgba(139,92,246,0.35)] hover:shadow-[0_8px_36px_rgba(139,92,246,0.45)] hover:-translate-y-0.5 transition-all"
      >
        Go to Admin Dashboard →
      </button>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────
export default function AdminSetupClient({
  tokenValid,
  providedToken,
}: {
  tokenValid: boolean;
  providedToken: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "", email: "", password: "", confirm: "",
  });
  const [errors,  setErrors]  = useState<Partial<Record<string, string>>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successName, setSuccessName] = useState("");

  if (!tokenValid) return <InvalidToken providedToken={providedToken} />;

  const set = (k: keyof typeof form) => (v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim())      e.name     = "Full name is required.";
    if (!form.email.trim())     e.email    = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email.";
    if (!form.password)         e.password = "Password is required.";
    else if (form.password.length < 8)         e.password = "At least 8 characters.";
    if (!form.confirm)          e.confirm  = "Please confirm your password.";
    else if (form.confirm !== form.password)   e.confirm = "Passwords do not match.";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setLoading(true);

    try {
      const res  = await fetch("/api/admin/setup", {
        method:      "POST",
        headers:     { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name:       form.name.trim(),
          email:      form.email.trim().toLowerCase(),
          password:   form.password,
          setupToken: providedToken,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.field) {
          setErrors({ [data.field]: data.error });
        } else {
          setErrors({ general: data.error ?? "Something went wrong." });
        }
        setLoading(false);
        return;
      }

      setSuccessName(form.name.trim().split(" ")[0]);
      setSuccess(true);
    } catch {
      setErrors({ general: "Network error. Please try again." });
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .font-nunito { font-family: var(--font-nunito, 'Nunito', sans-serif); }
        .font-cinzel { font-family: var(--font-cinzel, 'Cinzel', serif); }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-8px); }
        }
        .float { animation: float 4s ease-in-out infinite; }
      `}</style>

      <main className="relative min-h-screen bg-[#F5F7FA] dark:bg-[#0F172A] text-[#1E293B] dark:text-[#F1F5F9] flex items-center justify-center p-6 py-12 overflow-hidden">

        {/* Subtle grid background */}
        <div
          className="fixed inset-0 z-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(#8B5CF6 1px, transparent 1px), linear-gradient(90deg, #8B5CF6 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        {/* Radial glow */}
        <div
          className="fixed inset-0 z-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 50% 40% at 50% 50%, rgba(139,92,246,0.06) 0%, transparent 70%)" }}
        />

        <div className="relative z-10 w-full max-w-md">

          {/* Brand header */}
          <div className="text-center mb-8">
            <div className="float inline-block text-5xl mb-3">🛡️</div>
            <h1 className="font-cinzel text-2xl font-bold tracking-wide mb-1">
              TSR Admin Setup
            </h1>
            <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
              Create the administrator account for this TSR instance
            </p>
          </div>

          {/* Card */}
          <div className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-3xl p-8 shadow-[0_8px_48px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_48px_rgba(0,0,0,0.5)] relative overflow-hidden">

            {/* Purple accent bar */}
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#8B5CF6] to-transparent" />

            {/* Top glow */}
            <div
              className="absolute inset-0 z-0 pointer-events-none"
              style={{ background: "radial-gradient(ellipse 80% 35% at 50% 0%, rgba(139,92,246,0.06) 0%, transparent 70%)" }}
            />

            <div className="relative z-10">
              {success ? (
                <SuccessScreen name={successName} />
              ) : (
                <>
                  {/* Badge */}
                  <div className="flex items-center gap-2 mb-5">
                    <div className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-widest uppercase px-3 py-1 rounded-full border border-[#8B5CF6] text-[#8B5CF6] bg-[#EDE9FE] dark:bg-[#2e1065]">
                      🔐 One-Time Setup
                    </div>
                    <div className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#D1FAE5] dark:bg-[#064e35] text-[#4A9B7F] border border-[#4A9B7F]">
                      ✓ Token verified
                    </div>
                  </div>

                  <h2 className="font-cinzel text-xl font-bold mb-1">Create Admin Account</h2>
                  <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mb-6">
                    This form can only be used once. Once an admin account exists, this page will redirect to login.
                  </p>

                  <div className="flex flex-col gap-4">
                    <Field
                      label="Full Name" icon="👤"
                      placeholder="e.g. Admin User"
                      value={form.name} onChange={set("name")} error={errors.name}
                    />
                    <Field
                      label="Email Address" icon="📧" type="email"
                      placeholder="admin@school.edu.ph"
                      value={form.email} onChange={set("email")} error={errors.email}
                    />
                    <div>
                      <Field
                        label="Password" icon="🔑" type="password"
                        placeholder="Create a strong password (min 8 chars)"
                        value={form.password} onChange={set("password")} error={errors.password}
                      />
                      <PasswordStrength password={form.password} />
                    </div>
                    <Field
                      label="Confirm Password" icon="🔒" type="password"
                      placeholder="Repeat your password"
                      value={form.confirm} onChange={set("confirm")} error={errors.confirm}
                    />

                    {/* General error */}
                    {errors.general && (
                      <div className="flex items-start gap-2 px-4 py-3 bg-[#FEE2E2] dark:bg-[#450a0a] border border-[#E05C5C] rounded-xl">
                        <span className="text-[#E05C5C] flex-shrink-0">⚠️</span>
                        <p className="text-sm text-[#E05C5C] font-semibold">{errors.general}</p>
                      </div>
                    )}

                    {/* Warning notice */}
                    <div className="flex items-start gap-2 px-4 py-3 bg-[#FEF3C7] dark:bg-[#3d2800] border border-[#F59E0B] rounded-xl">
                      <span className="text-[#F59E0B] flex-shrink-0 mt-0.5">⚠️</span>
                      <p className="text-xs text-[#F59E0B] font-semibold leading-relaxed">
                        After creating this account, remove or rotate your <code className="bg-[#FEF3C7] dark:bg-[#3d2800] px-1 rounded font-mono">ADMIN_SETUP_TOKEN</code> in <code className="bg-[#FEF3C7] dark:bg-[#3d2800] px-1 rounded font-mono">.env</code> to prevent unauthorized access.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={loading}
                      className="w-full mt-1 py-4 rounded-2xl font-extrabold text-sm font-nunito bg-gradient-to-br from-[#8B5CF6] to-[#6D28D9] text-white shadow-[0_0_28px_rgba(139,92,246,0.25)] hover:shadow-[0_8px_36px_rgba(139,92,246,0.4)] hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                    >
                      {loading ? "⏳ Creating account…" : "🛡️ Create Admin Account"}
                    </button>
                  </div>

                  <div className="flex items-center gap-3 my-5">
                    <div className="flex-1 h-px bg-[#E2E8F0] dark:bg-[#334155]" />
                    <span className="text-[11px] text-[#94A3B8] font-semibold tracking-widest uppercase">or</span>
                    <div className="flex-1 h-px bg-[#E2E8F0] dark:bg-[#334155]" />
                  </div>

                  <p className="text-center text-sm text-[#64748B] dark:text-[#94A3B8]">
                    Already have an account?{" "}
                    <a href="/login" className="font-bold text-[#8B5CF6] hover:text-[#7c3aed] transition-colors">
                      Sign in
                    </a>
                  </p>
                </>
              )}
            </div>
          </div>

          <p className="text-center text-xs text-[#94A3B8] mt-5 font-semibold tracking-wide">
            🔒 TSR Admin Setup · One-time use
          </p>
        </div>
      </main>
    </>
  );
}