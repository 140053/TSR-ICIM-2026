"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { StudentProfileData } from "../page";

// ─── Logout ───────────────────────────────────────────────────
function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const handleLogout = async () => {
    setBusy(true);
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.push("/login");
    router.refresh();
  };
  return (
    <button
      onClick={handleLogout}
      disabled={busy}
      className="text-xs text-[#64748B] hover:text-[#E05C5C] transition-colors font-semibold px-3 py-1.5 rounded-lg hover:bg-[#FEE2E2] dark:hover:bg-[#450a0a] border border-[#E2E8F0] dark:border-[#334155] disabled:opacity-50"
    >
      {busy ? "…" : "Sign out"}
    </button>
  );
}

// ─── Field ────────────────────────────────────────────────────
function Field({
  label, value, onChange, type = "text", readOnly = false, placeholder,
}: {
  label: string; value: string; onChange?: (v: string) => void;
  type?: string; readOnly?: boolean; placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]">
        {label}
      </label>
      <input
        type={type}
        value={value}
        readOnly={readOnly}
        placeholder={placeholder}
        onChange={(e) => onChange?.(e.target.value)}
        className={cn(
          "px-3.5 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none",
          readOnly
            ? "bg-[#F8FAFC] dark:bg-[#0F172A] border-[#E2E8F0] dark:border-[#334155] text-[#64748B] dark:text-[#94A3B8] cursor-default"
            : "bg-white dark:bg-[#0F172A] border-[#E2E8F0] dark:border-[#334155] focus:border-[#3B82C4]"
        )}
      />
    </div>
  );
}

// ─── Alert ────────────────────────────────────────────────────
function Alert({ type, msg }: { type: "success" | "error"; msg: string }) {
  const cls = type === "success"
    ? "bg-[#D1FAE5] dark:bg-[#063c28] border-[#4A9B7F] text-[#4A9B7F]"
    : "bg-[#FEE2E2] dark:bg-[#450a0a] border-[#E05C5C] text-[#E05C5C]";
  return <p className={cn("text-sm font-semibold px-4 py-2.5 rounded-xl border", cls)}>{msg}</p>;
}

// ─── Card ─────────────────────────────────────────────────────
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl p-6 shadow-sm">
      <h2 className="font-nunito font-extrabold text-[15px] mb-5">{title}</h2>
      {children}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────
export default function StudentProfileClient({ data }: { data: StudentProfileData }) {
  const router = useRouter();
  const { student, nav } = data;

  const [name,       setName]       = useState(student.name);
  const [nameMsg,    setNameMsg]    = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [nameBusy,   setNameBusy]   = useState(false);

  const [curPwd,     setCurPwd]     = useState("");
  const [newPwd,     setNewPwd]     = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdMsg,     setPwdMsg]     = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [pwdBusy,    setPwdBusy]    = useState(false);

  async function saveName() {
    if (!name.trim()) { setNameMsg({ type: "error", msg: "Name cannot be empty." }); return; }
    setNameBusy(true); setNameMsg(null);
    const res  = await fetch("/api/student/profile", {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    const json = await res.json();
    setNameBusy(false);
    if (json.success) { setNameMsg({ type: "success", msg: "Name updated." }); router.refresh(); }
    else              { setNameMsg({ type: "error",   msg: json.error ?? "Failed." }); }
  }

  async function savePassword() {
    if (newPwd !== confirmPwd) { setPwdMsg({ type: "error", msg: "Passwords do not match." }); return; }
    if (newPwd.length < 6)     { setPwdMsg({ type: "error", msg: "Min. 6 characters required." }); return; }
    setPwdBusy(true); setPwdMsg(null);
    const res  = await fetch("/api/student/profile", {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: curPwd, newPassword: newPwd }),
    });
    const json = await res.json();
    setPwdBusy(false);
    if (json.success) { setPwdMsg({ type: "success", msg: "Password changed." }); setCurPwd(""); setNewPwd(""); setConfirmPwd(""); }
    else              { setPwdMsg({ type: "error",   msg: json.error ?? "Failed." }); }
  }

  const xpToNext = 1000 - (student.xp % 1000);
  const xpPct    = ((student.xp % 1000) / 1000) * 100;

  return (
    <>
      <style>{`
        .font-nunito { font-family: var(--font-nunito, 'Nunito', sans-serif); }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fade-up 0.3s ease both; }
      `}</style>

      <div className="min-h-screen bg-[#F5F7FA] dark:bg-[#0F172A] text-[#1E293B] dark:text-[#F1F5F9]">

        {/* Top bar */}
        <div className="sticky top-0 z-30 bg-white dark:bg-[#1E293B] border-b border-[#E2E8F0] dark:border-[#334155] shadow-sm px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard/student")}
              className="p-2 rounded-xl hover:bg-[#F1F5F9] dark:hover:bg-[#334155] transition-colors text-[#64748B]"
            >
              ←
            </button>
            <div>
              <h1 className="font-nunito font-extrabold text-lg leading-tight">My Profile</h1>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">Account settings</p>
            </div>
          </div>
          <LogoutButton />
        </div>

        <div className="px-6 py-8 max-w-2xl mx-auto space-y-6">

          {/* Avatar hero */}
          <div className="fade-up flex items-center gap-5 p-5 bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#3B82C4] to-[#4A9B7F] flex items-center justify-center text-3xl flex-shrink-0">
              {student.avatarEmoji}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-nunito font-extrabold text-lg truncate">{student.name}</p>
              <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">{student.avatarName}</p>
              <div className="flex gap-2 mt-1.5 flex-wrap">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#DBEAFE] dark:bg-[#1e3a5f] text-[#3B82C4]">
                  {student.difficulty}
                </span>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#D1FAE5] dark:bg-[#063c28] text-[#4A9B7F]">
                  {student.section}
                </span>
              </div>
            </div>
          </div>

          {/* Level / XP */}
          <div className="fade-up grid grid-cols-3 gap-3">
            {[
              { label: "Level",         value: `Lv. ${student.level}`,      color: "#8B5CF6" },
              { label: "Total XP",      value: `${student.xp} XP`,          color: "#F59E0B" },
              { label: "Next level in", value: `${xpToNext} XP`,            color: "#3B82C4" },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl p-4 text-center shadow-sm">
                <p className="font-nunito font-black text-xl" style={{ color }}>{value}</p>
                <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-0.5">{label}</p>
              </div>
            ))}
          </div>
          {/* XP bar */}
          <div className="-mt-2 px-1 fade-up">
            <div className="flex justify-between text-[10px] text-[#94A3B8] mb-1">
              <span>{student.xp % 1000} / 1000 XP to Level {student.level + 1}</span>
              <span>{Math.round(xpPct)}%</span>
            </div>
            <div className="h-2 bg-[#EEF2F8] dark:bg-[#162032] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#3B82C4] to-[#4A9B7F] rounded-full transition-all duration-700"
                style={{ width: `${xpPct}%` }}
              />
            </div>
          </div>

          {/* Account details */}
          <div className="fade-up">
            <Card title="👤 Account Details">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                <Field label="Display Name" value={name} onChange={setName} placeholder="Your name" />
                <Field label="Email Address" value={student.email} readOnly />
                <Field label="Section"       value={student.section}    readOnly />
                <Field label="Joined"        value={student.joinedAt}   readOnly />
              </div>
              {nameMsg && <div className="mb-4"><Alert type={nameMsg.type} msg={nameMsg.msg} /></div>}
              <button
                onClick={saveName}
                disabled={nameBusy || name.trim() === student.name}
                className="px-5 py-2.5 rounded-xl bg-[#3B82C4] hover:bg-[#2563EB] text-white text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {nameBusy ? "Saving…" : "Save Name"}
              </button>
            </Card>
          </div>

          {/* Password */}
          <div className="fade-up">
            <Card title="🔒 Change Password">
              <div className="flex flex-col gap-4 mb-5">
                <Field label="Current Password" type="password" value={curPwd} onChange={setCurPwd} placeholder="Enter current password" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="New Password"     type="password" value={newPwd}     onChange={setNewPwd}     placeholder="Min. 6 characters" />
                  <Field label="Confirm Password" type="password" value={confirmPwd} onChange={setConfirmPwd} placeholder="Repeat new password" />
                </div>
              </div>
              {pwdMsg && <div className="mb-4"><Alert type={pwdMsg.type} msg={pwdMsg.msg} /></div>}
              <button
                onClick={savePassword}
                disabled={pwdBusy || !curPwd || !newPwd || !confirmPwd}
                className="px-5 py-2.5 rounded-xl bg-[#4A9B7F] hover:bg-[#3a8a6e] text-white text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {pwdBusy ? "Changing…" : "Change Password"}
              </button>
            </Card>
          </div>

          {/* Back link */}
          <div className="fade-up pb-4">
            <button
              onClick={() => router.push("/dashboard/student")}
              className="text-sm text-[#64748B] dark:text-[#94A3B8] hover:text-[#3B82C4] transition-colors font-semibold"
            >
              ← Back to Dashboard
            </button>
          </div>

        </div>
      </div>
    </>
  );
}
