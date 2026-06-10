"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import type { SectionOption, SchoolOption } from "../page";

type Role = "STUDENT" | "TEACHER" | "ADMIN";

const ROLE_OPTIONS: { value: Role; label: string; icon: string; color: string; desc: string }[] = [
  {
    value: "STUDENT", icon: "🎒", label: "Student",
    color: "border-[#3B82C4] bg-[#DBEAFE] dark:bg-[#1e3a5f] text-[#3B82C4]",
    desc: "Can access modules and take tests",
  },
  {
    value: "TEACHER", icon: "📋", label: "Teacher",
    color: "border-[#4A9B7F] bg-[#D1FAE5] dark:bg-[#064e35] text-[#4A9B7F]",
    desc: "Can manage sections, grade responses",
  },
  {
    value: "ADMIN", icon: "🛡️", label: "Admin",
    color: "border-[#8B5CF6] bg-[#EDE9FE] dark:bg-[#2e1065] text-[#8B5CF6]",
    desc: "Full system access",
  },
];

export default function NewUserClient({ sections, schools }: { sections: SectionOption[]; schools: SchoolOption[] }) {
  const router = useRouter();

  const [role,      setRole]      = useState<Role>("STUDENT");
  const [firstName, setFirstName] = useState("");
  const [lastName,  setLastName]  = useState("");
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [subject,   setSubject]   = useState("");
  const [schoolId,  setSchoolId]  = useState<number | null>(null);
  const [sectionId, setSectionId] = useState<number | null>(null);
  const [showPw,    setShowPw]    = useState(false);

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    const body: Record<string, unknown> = {
      role, firstName, lastName, email, password,
    };
    if (role === "STUDENT") { body.sectionId = sectionId; body.schoolId = schoolId; }
    if (role === "TEACHER") body.subject   = subject;

    try {
      const res  = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const json = await res.json();

      if (!json.success) {
        setError(json.error ?? "Failed to create user.");
      } else {
        setSuccess(json.message);
        // After 1.2s, navigate to the new user's detail page
        setTimeout(() => router.push(`/admin/users/${json.userId}`), 1200);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const selectedRole = ROLE_OPTIONS.find((r) => r.value === role)!;

  return (
    <div className="min-h-screen bg-[#F5F7FA] dark:bg-[#0B1628] text-[#1E293B] dark:text-[#F1F5F9]">

      {/* ── Header ── */}
      <div className="bg-white dark:bg-[#1E293B] border-b border-[#E2E8F0] dark:border-[#334155] px-8 py-5 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-xl bg-[#EEF2F8] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] flex items-center justify-center text-sm text-[#64748B] hover:border-[#8B5CF6] hover:text-[#8B5CF6] transition-colors"
        >
          ←
        </button>
        <div>
          <div className="text-xs font-bold tracking-widest uppercase text-[#8B5CF6] mb-0.5">
            Admin · Users
          </div>
          <h1 className="font-nunito text-xl font-extrabold">Create New User</h1>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-[680px] mx-auto px-6 py-10">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Role picker */}
          <div className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl p-6">
            <p className="text-sm font-bold mb-4">Select Role</p>
            <div className="grid grid-cols-3 gap-3">
              {ROLE_OPTIONS.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center",
                    role === r.value
                      ? r.color
                      : "border-[#E2E8F0] dark:border-[#334155] bg-transparent text-[#64748B] dark:text-[#94A3B8] hover:border-[#8B5CF6]"
                  )}
                >
                  <span className="text-2xl">{r.icon}</span>
                  <span className="text-sm font-bold">{r.label}</span>
                  <span className="text-[11px] leading-snug opacity-75">{r.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Basic info */}
          <div className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl p-6 space-y-4">
            <p className="text-sm font-bold">Account Details</p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] block mb-1.5">
                  First Name
                </label>
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Juan"
                  required
                  className="bg-[#F8FAFC] dark:bg-[#0F172A]"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] block mb-1.5">
                  Last Name
                </label>
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="dela Cruz"
                  required
                  className="bg-[#F8FAFC] dark:bg-[#0F172A]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] block mb-1.5">
                Email Address
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="juan@school.edu.ph"
                required
                className="bg-[#F8FAFC] dark:bg-[#0F172A]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] block mb-1.5">
                Password
              </label>
              <div className="relative">
                <Input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  required
                  minLength={6}
                  className="bg-[#F8FAFC] dark:bg-[#0F172A] pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#1E293B] dark:hover:text-white text-xs"
                >
                  {showPw ? "Hide" : "Show"}
                </button>
              </div>
            </div>
          </div>

          {/* Role-specific fields */}
          {role === "STUDENT" && (
            <div className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl p-6 space-y-4">
              <p className="text-sm font-bold">Student Details</p>
              <div>
                <label className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] block mb-1.5">
                  School <span className="text-[#94A3B8] font-normal">(optional)</span>
                </label>
                <select
                  value={schoolId ?? ""}
                  onChange={(e) => {
                    const val = e.target.value ? Number(e.target.value) : null;
                    setSchoolId(val);
                    setSectionId(null);
                  }}
                  className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A] text-sm text-[#1E293B] dark:text-[#F1F5F9] focus:outline-none focus:ring-2 focus:ring-[#3B82C4]"
                >
                  <option value="">— No school —</option>
                  {schools.map((sch) => (
                    <option key={sch.id} value={sch.id}>{sch.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] block mb-1.5">
                  Section <span className="text-[#94A3B8] font-normal">(optional — can be assigned later)</span>
                </label>
                <select
                  value={sectionId ?? ""}
                  onChange={(e) => setSectionId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A] text-sm text-[#1E293B] dark:text-[#F1F5F9] focus:outline-none focus:ring-2 focus:ring-[#3B82C4]"
                >
                  <option value="">— No section —</option>
                  {sections
                    .filter((s) => schoolId == null || s.schoolId === schoolId)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.emoji} {s.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          )}

          {role === "TEACHER" && (
            <div className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl p-6">
              <p className="text-sm font-bold mb-4">Teacher Details</p>
              <div>
                <label className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] block mb-1.5">
                  Subject / Department <span className="text-[#94A3B8] font-normal">(optional)</span>
                </label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Mathematics"
                  className="bg-[#F8FAFC] dark:bg-[#0F172A]"
                />
              </div>
            </div>
          )}

          {role === "ADMIN" && (
            <div className="bg-[#EDE9FE] dark:bg-[#1a0e35] border border-[#8B5CF6]/30 rounded-2xl p-4 flex gap-3 items-start">
              <span className="text-lg mt-0.5">🛡️</span>
              <p className="text-sm text-[#8B5CF6] font-medium">
                This account will have full system access — including user management, module control, and all admin tools.
              </p>
            </div>
          )}

          {/* Feedback */}
          {error && (
            <div className="bg-[#FEE2E2] dark:bg-[#450a0a] border border-[#E05C5C]/30 rounded-xl px-4 py-3 text-sm text-[#E05C5C] font-medium">
              ⚠️ {error}
            </div>
          )}
          {success && (
            <div className="bg-[#D1FAE5] dark:bg-[#064e35] border border-[#4A9B7F]/30 rounded-xl px-4 py-3 text-sm text-[#4A9B7F] font-medium">
              ✅ {success} — redirecting…
            </div>
          )}

          {/* Submit */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 h-11 rounded-xl border border-[#E2E8F0] dark:border-[#334155] text-sm font-semibold text-[#64748B] hover:border-[#8B5CF6] hover:text-[#8B5CF6] transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !!success}
              className={cn(
                "flex-1 h-11 rounded-xl text-sm font-bold text-white transition-all",
                selectedRole.value === "STUDENT" && "bg-[#3B82C4] hover:bg-[#2563A0] shadow-[0_4px_14px_rgba(59,130,196,0.3)]",
                selectedRole.value === "TEACHER" && "bg-[#4A9B7F] hover:bg-[#3a7d66] shadow-[0_4px_14px_rgba(74,155,127,0.3)]",
                selectedRole.value === "ADMIN"   && "bg-[#8B5CF6] hover:bg-[#7c3aed] shadow-[0_4px_14px_rgba(139,92,246,0.3)]",
                (loading || !!success) && "opacity-60 cursor-not-allowed"
              )}
            >
              {loading ? "Creating…" : `Create ${selectedRole.label}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
