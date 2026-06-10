"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import AuthLayout, { AUTH_RUNES_REGISTER } from "@/components/auth/AuthLayout";

/* ─── TYPES ─── */
type Role = "student" | "teacher";
type Step = 1 | 2;

type FormState = {
  firstName: string;
  lastName:  string;
  email:     string;
  password:  string;
  confirm:   string;
  schoolId:  number | null; // student + teacher — chosen from DB
  section:   string;        // student only
  subject:   string;        // teacher only
  code:      string;        // teacher invite code
};

type FormErrors = Partial<Record<keyof FormState | "general", string>>;

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

/* ─── MINI STEP INDICATOR ─── */
function MiniSteps({ step }: { step: Step }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {([1, 2] as Step[]).map((s) => (
        <div key={s} className="flex items-center gap-2">
          <div className={cn(
            "w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold border-2 transition-all duration-300",
            step === s ? "border-blue-400 bg-blue-950 text-blue-400"
            : step > s ? "border-emerald-400 bg-emerald-950 text-emerald-400"
            : "border-[#243558] bg-[#101f38] text-[#4a6a94]"
          )}>
            {step > s ? "✓" : s}
          </div>
          <span className={cn(
            "text-xs font-bold transition-colors",
            step === s ? "text-[#7A9CC4]" : step > s ? "text-emerald-400" : "text-[#4a6a94]"
          )}>
            {s === 1 ? "Account Info" : "Identity"}
          </span>
          {s < 2 && <div className="w-8 h-px bg-[#243558]" />}
        </div>
      ))}
    </div>
  );
}

/* ─── INPUT FIELD ─── */
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
      {hint && !error && <p className="text-xs text-[#4a6a94]">{hint}</p>}
    </div>
  );
}

/* ─── SCHOOL PICKER ─── */
type SchoolOption = { id: number; name: string };

function SchoolPicker({
  value, onChange, error,
}: {
  value: number | null; onChange: (id: number, name: string) => void; error?: string;
}) {
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/schools")
      .then((r) => r.json())
      .then((data) => { if (data.success) setSchools(data.schools); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-bold tracking-widest uppercase text-[#7A9CC4]">
        🏫 Your School
      </label>
      {loading ? (
        <div className="grid grid-cols-1 gap-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-10 rounded-xl bg-[#101f38] border border-[#243558] animate-pulse" />
          ))}
        </div>
      ) : schools.length === 0 ? (
        <p className="text-xs text-[#4a6a94] font-semibold py-2">No schools available. Contact your administrator.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {schools.map(({ id, name }) => (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id, name)}
              className={cn(
                "py-2.5 px-4 rounded-xl border-[1.5px] text-sm font-bold font-nunito text-left transition-all",
                value === id
                  ? "border-blue-400 text-blue-400 bg-blue-950 shadow-[0_0_16px_rgba(96,165,250,0.2)]"
                  : "border-[#243558] text-[#7A9CC4] bg-[#101f38] hover:border-blue-400 hover:text-blue-400 hover:bg-blue-950"
              )}
            >
              🏫 {name}
            </button>
          ))}
        </div>
      )}
      {error && <p className="text-xs text-red-400 font-semibold">{error}</p>}
    </div>
  );
}

/* ─── SECTION PICKER ─── */
type SectionOption = { id: number; name: string; emoji: string };

function SectionPicker({
  value, onChange, error, isStudent, schoolId,
}: {
  value: string; onChange: (v: string) => void; error?: string; isStudent: boolean; schoolId?: number | null;
}) {
  const [sections, setSections] = useState<SectionOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isStudent) return;
    if (schoolId == null) { setSections([]); return; }
    setLoading(true);
    fetch(`/api/sections?schoolId=${schoolId}`)
      .then((r) => r.json())
      .then((data) => { if (data.success) setSections(data.sections); })
      .finally(() => setLoading(false));
  }, [isStudent, schoolId]);

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-bold tracking-widest uppercase text-[#7A9CC4]">
        🛡️ {isStudent ? "Your Section" : "Subject / Department"}
      </label>
      {isStudent ? (
        loading ? (
          <div className="grid grid-cols-2 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 rounded-xl bg-[#101f38] border border-[#243558] animate-pulse" />
            ))}
          </div>
        ) : sections.length === 0 ? (
          <p className="text-xs text-[#4a6a94] font-semibold py-2">No sections available. Contact your teacher.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {sections.map(({ id, name, emoji }) => (
              <button
                key={id}
                type="button"
                onClick={() => onChange(name)}
                className={cn(
                  "py-2.5 px-3 rounded-xl border-[1.5px] text-sm font-bold font-nunito transition-all",
                  value === name
                    ? "border-blue-400 text-blue-400 bg-blue-950 shadow-[0_0_16px_rgba(96,165,250,0.2)]"
                    : "border-[#243558] text-[#7A9CC4] bg-[#101f38] hover:border-blue-400 hover:text-blue-400 hover:bg-blue-950"
                )}
              >
                {emoji} {name}
              </button>
            ))}
          </div>
        )
      ) : (
        <Input
          placeholder="e.g. Mathematics, Science"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "bg-[#101f38] border text-white placeholder:text-[#4a6a94] rounded-xl h-12 px-4 transition-all",
            error
              ? "border-red-500"
              : "border-[#243558] focus-visible:ring-amber-400/30 focus-visible:border-amber-400"
          )}
        />
      )}
      {error && <p className="text-xs text-red-400 font-semibold">{error}</p>}
    </div>
  );
}

/* ─── PASSWORD STRENGTH METER ─── */
function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const checks = [password.length >= 8, /[A-Z]/.test(password), /[0-9]/.test(password), /[^A-Za-z0-9]/.test(password)];
  const score  = checks.filter(Boolean).length;
  const colors = ["", "bg-red-500", "bg-amber-400", "bg-blue-400", "bg-emerald-400"];
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const textCl = ["", "text-red-400", "text-amber-400", "text-blue-400", "text-emerald-400"];

  return (
    <div className="flex flex-col gap-1.5 mt-1.5">
      <div className="flex gap-1">
        {[1,2,3,4].map((i) => (
          <div key={i} className={cn("h-1 flex-1 rounded-full transition-all duration-300", i <= score ? colors[score] : "bg-[#243558]")} />
        ))}
      </div>
      {score > 0 && (
        <p className={cn("text-xs font-semibold", textCl[score])}>
          {labels[score]} password{score < 3 && " — add uppercase, numbers, or symbols"}
        </p>
      )}
    </div>
  );
}

/* ─── MAIN REGISTER PAGE ─── */
export default function RegisterPage() {
  const router = useRouter();

  const [role,    setRole]    = useState<Role>("student");
  const [step,    setStep]    = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [form,    setForm]    = useState<FormState>({
    firstName: "", lastName: "",  email: "",
    password:  "", confirm:  "",
    schoolId:  null, section: "", subject: "", code: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const isStudent = role === "student";
  const set       = (key: keyof FormState) => (val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const accentBlue  = "border-blue-400 text-blue-400 bg-blue-950";
  const accentAmber = "border-amber-400 text-amber-400 bg-amber-950";
  const accentTag   = isStudent ? accentBlue : accentAmber;

  /* ── Step 1 validation (client-side only) ── */
  const validateStep1 = (): FormErrors => {
    const e: FormErrors = {};
    if (!form.firstName.trim())   e.firstName = "First name is required.";
    if (!form.lastName.trim())    e.lastName  = "Last name is required.";
    if (!form.email.trim())       e.email     = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email.";
    if (!form.password)           e.password  = "Password is required.";
    else if (form.password.length < 6)         e.password = "At least 6 characters.";
    if (!form.confirm)            e.confirm   = "Please confirm your password.";
    else if (form.confirm !== form.password)   e.confirm = "Passwords do not match.";
    return e;
  };

  /* ── Step 2 validation (client-side only) ── */
  const validateStep2 = (): FormErrors => {
    const e: FormErrors = {};
    if (isStudent) {
      if (!form.schoolId)        e.schoolId = "Please choose your school.";
      if (!form.section)         e.section  = "Please choose your section.";
    } else {
      if (!form.schoolId)        e.schoolId = "Please choose your school.";
      if (!form.subject.trim())  e.subject  = "Subject is required.";
      if (!form.code.trim())     e.code     = "Invite code is required.";
    }
    return e;
  };

  const handleNext = () => {
    const e = validateStep1();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setStep(2);
  };

  const handleBack = () => { setErrors({}); setStep(1); };

  /* ── Final submit → POST /api/auth/register ── */
  const handleSubmit = async () => {
    const e = validateStep2();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setLoading(true);

    try {
      const base = {
        firstName: form.firstName.trim(),
        lastName:  form.lastName.trim(),
        email:     form.email.trim().toLowerCase(),
        password:  form.password,
        role:      role.toUpperCase(),
      };

      const payload = isStudent
        ? { ...base, schoolId: form.schoolId, section: form.section }
        : { ...base, schoolId: form.schoolId, subject: form.subject.trim(), code: form.code.trim().toUpperCase() };

      const res  = await fetch("/api/auth/register", {
        method:      "POST",
        headers:     { "Content-Type": "application/json" },
        credentials: "include",
        body:        JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        // Map a field-specific error back to the right field + step
        if (data.field) {
          const step1Fields = ["firstName","lastName","email","password","confirm"];
          if (step1Fields.includes(data.field)) {
            setErrors({ [data.field]: data.error });
            setStep(1); // go back to step 1 to show the field error
          } else {
            setErrors({ [data.field]: data.error });
            // stay on step 2
          }
        } else {
          setErrors({ general: data.error ?? "Registration failed. Please try again." });
        }
        setLoading(false);
        return;
      }

      // Success — redirect to onboarding (students) or teacher dashboard
      const redirectTo = data.redirectTo ?? (isStudent ? "/onboarding" : "/dashboard/teacher");
      router.push(redirectTo);
      router.refresh();

    } catch {
      setErrors({ general: "Network error. Please check your connection." });
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      logoEmoji="🏆"
      title="Join the Quest"
      subtitle="Create your account and begin your journey"
      runes={AUTH_RUNES_REGISTER}
      tallPage
    >
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

            {/* Accent top bar */}
            <div className={cn(
              "absolute top-0 left-0 right-0 h-[2px] transition-all duration-500",
              isStudent
                ? "bg-gradient-to-r from-transparent via-blue-400 to-transparent"
                : "bg-gradient-to-r from-transparent via-amber-400 to-transparent"
            )} />

            <div className="relative z-10">

              {/* Role toggle */}
              <RoleToggle
                role={role}
                onChange={(r) => { setRole(r); setErrors({}); setStep(1); setForm((f) => ({ ...f, schoolId: null, section: "", subject: "", code: "" })); }}
              />

              {/* Step indicator */}
              <MiniSteps step={step} />

              {/* Portal badge + heading */}
              <div className="mb-5">
                <div className={cn(
                  "inline-flex items-center gap-2 text-[11px] font-bold tracking-widest uppercase px-3 py-1 rounded-full border mb-2.5 transition-all duration-300",
                  accentTag
                )}>
                  {isStudent ? "🎒 New Adventurer" : "📋 New Educator"}
                </div>
                <h2 className="font-cinzel text-xl font-bold leading-tight">
                  {step === 1
                    ? "Create your account"
                    : isStudent
                    ? "Tell us about yourself"
                    : "Verify your access"}
                </h2>
                <p className="text-sm text-[#7A9CC4] mt-1">
                  {step === 1
                    ? "Step 1 of 2 — Basic account information"
                    : isStudent
                    ? "Step 2 of 2 — Your school & section"
                    : "Step 2 of 2 — Your school & invite code"}
                </p>
              </div>

              {/* ── STEP 1 ── */}
              {step === 1 && (
                <div className="step-animate flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="First Name" icon="👤" placeholder="Juan"
                      value={form.firstName} onChange={set("firstName")} error={errors.firstName} />
                    <Field label="Last Name" icon="👤" placeholder="Dela Cruz"
                      value={form.lastName}  onChange={set("lastName")}  error={errors.lastName} />
                  </div>

                  <Field
                    label="Email Address" icon="📧" type="email"
                    placeholder={isStudent ? "juan@school.edu.ph" : "teacher@school.edu.ph"}
                    value={form.email} onChange={set("email")} error={errors.email}
                  />

                  <div>
                    <Field
                      label="Password" icon="🔑" type="password"
                      placeholder="Create a strong password"
                      value={form.password} onChange={set("password")} error={errors.password}
                    />
                    <PasswordStrength password={form.password} />
                  </div>

                  <Field
                    label="Confirm Password" icon="🔒" type="password"
                    placeholder="Repeat your password"
                    value={form.confirm} onChange={set("confirm")} error={errors.confirm}
                  />

                  <button
                    type="button"
                    onClick={handleNext}
                    className={cn(
                      "w-full mt-1 py-4 rounded-2xl font-extrabold text-base font-nunito transition-all duration-200",
                      isStudent
                        ? "bg-gradient-to-br from-blue-400 to-blue-700 text-white shadow-[0_0_28px_rgba(96,165,250,0.3)] hover:shadow-[0_8px_36px_rgba(96,165,250,0.45)] hover:-translate-y-0.5"
                        : "bg-gradient-to-br from-amber-300 to-amber-600 text-black shadow-[0_0_28px_rgba(245,158,11,0.3)] hover:shadow-[0_8px_36px_rgba(245,158,11,0.45)] hover:-translate-y-0.5"
                    )}
                  >
                    Next — Identity →
                  </button>
                </div>
              )}

              {/* ── STEP 2 ── */}
              {step === 2 && (
                <div className="step-animate flex flex-col gap-4">
                  {isStudent ? (
                    <>
                      <SchoolPicker
                        value={form.schoolId}
                        onChange={(id) => setForm((f) => ({ ...f, schoolId: id, section: "" }))}
                        error={errors.schoolId}
                      />
                      <SectionPicker
                        value={form.section}
                        onChange={set("section")}
                        error={errors.section}
                        isStudent={true}
                        schoolId={form.schoolId}
                      />
                    </>
                  ) : (
                    <>
                      <SchoolPicker
                        value={form.schoolId}
                        onChange={(id) => setForm((f) => ({ ...f, schoolId: id }))}
                        error={errors.schoolId}
                      />
                      <SectionPicker
                        value={form.subject}
                        onChange={set("subject")}
                        error={errors.subject}
                        isStudent={false}
                      />
                      <Field
                        label="Teacher Invite Code" icon="🔐"
                        placeholder="Enter code from your school admin"
                        value={form.code} onChange={set("code")} error={errors.code}
                        hint="Contact your school administrator to get an invite code."
                      />
                    </>
                  )}

                  {/* General API error */}
                  {errors.general && (
                    <div className="flex items-start gap-2.5 px-4 py-3 bg-red-950/60 border border-red-500/50 rounded-xl">
                      <span className="text-red-400 text-base flex-shrink-0 mt-0.5">⚠️</span>
                      <p className="text-sm text-red-300 font-semibold leading-snug">{errors.general}</p>
                    </div>
                  )}

                  {/* Terms */}
                  <p className="text-xs text-[#4a6a94] leading-relaxed">
                    By creating an account you agree to TSR's{" "}
                    <a href="/terms" className="text-blue-400 hover:text-blue-300 font-semibold">Terms of Service</a>
                    {" "}and{" "}
                    <a href="/privacy" className="text-blue-400 hover:text-blue-300 font-semibold">Privacy Policy</a>.
                  </p>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleBack}
                      className="flex-none px-5 py-4 rounded-2xl font-bold font-nunito text-sm border border-[#243558] text-[#7A9CC4] bg-transparent hover:border-blue-400 hover:text-blue-400 hover:bg-blue-950 transition-all"
                    >
                      ← Back
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={loading}
                      className={cn(
                        "flex-1 py-4 rounded-2xl font-extrabold text-base font-nunito transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed",
                        isStudent
                          ? "bg-gradient-to-br from-blue-400 to-blue-700 text-white shadow-[0_0_28px_rgba(96,165,250,0.3)] hover:shadow-[0_8px_36px_rgba(96,165,250,0.45)] hover:-translate-y-0.5"
                          : "bg-gradient-to-br from-amber-300 to-amber-600 text-black shadow-[0_0_28px_rgba(245,158,11,0.3)] hover:shadow-[0_8px_36px_rgba(245,158,11,0.45)] hover:-translate-y-0.5"
                      )}
                    >
                      {loading
                        ? "⏳ Creating account…"
                        : isStudent
                        ? "⚔️ Begin My Quest!"
                        : "📋 Create Classroom"}
                    </button>
                  </div>
                </div>
              )}

              {/* Divider + sign-in link */}
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-[#243558]" />
                <span className="text-[11px] text-[#4a6a94] font-semibold tracking-widest uppercase">or</span>
                <div className="flex-1 h-px bg-[#243558]" />
              </div>

              <p className="text-center text-sm text-[#7A9CC4]">
                Already have an account?{" "}
                <a
                  href="/login"
                  className={cn(
                    "font-bold transition-colors",
                    isStudent ? "text-blue-400 hover:text-blue-300" : "text-amber-400 hover:text-amber-300"
                  )}
                >
                  Sign in instead
                </a>
              </p>
            </div>
          </div>

    </AuthLayout>
  );
}