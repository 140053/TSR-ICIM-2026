"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import TeacherSidebar from "../../_components/TeacherSidebar";
import type { TeacherProfileData } from "../page";

// ─── Section card wrapper ─────────────────────────────────────
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl p-6 shadow-sm">
      <h2 className="font-nunito font-extrabold text-[15px] mb-5">{title}</h2>
      {children}
    </div>
  );
}

// ─── Input field ─────────────────────────────────────────────
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
            : "bg-white dark:bg-[#0F172A] border-[#E2E8F0] dark:border-[#334155] focus:border-[#4A9B7F]"
        )}
      />
    </div>
  );
}

// ─── Alert banner ─────────────────────────────────────────────
function Alert({ type, msg }: { type: "success" | "error"; msg: string }) {
  const cls = type === "success"
    ? "bg-[#D1FAE5] dark:bg-[#063c28] border-[#4A9B7F] text-[#4A9B7F]"
    : "bg-[#FEE2E2] dark:bg-[#450a0a] border-[#E05C5C] text-[#E05C5C]";
  return (
    <p className={cn("text-sm font-semibold px-4 py-2.5 rounded-xl border", cls)}>{msg}</p>
  );
}

// ─── Main ─────────────────────────────────────────────────────
export default function TeacherProfileClient({ data }: { data: TeacherProfileData }) {
  const router = useRouter();
  const { teacher, sidebar } = data;

  // Name form
  const [name,       setName]       = useState(teacher.name);
  const [nameMsg,    setNameMsg]    = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [nameBusy,   setNameBusy]   = useState(false);

  // Password form
  const [curPwd,     setCurPwd]     = useState("");
  const [newPwd,     setNewPwd]     = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdMsg,     setPwdMsg]     = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [pwdBusy,    setPwdBusy]    = useState(false);

  async function saveName() {
    if (!name.trim()) { setNameMsg({ type: "error", msg: "Name cannot be empty." }); return; }
    setNameBusy(true);
    setNameMsg(null);
    const res = await fetch("/api/teacher/profile", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    const json = await res.json();
    setNameBusy(false);
    if (json.success) {
      setNameMsg({ type: "success", msg: "Name updated successfully." });
      router.refresh();
    } else {
      setNameMsg({ type: "error", msg: json.error ?? "Failed to update name." });
    }
  }

  async function savePassword() {
    if (newPwd !== confirmPwd) { setPwdMsg({ type: "error", msg: "New passwords do not match." }); return; }
    if (newPwd.length < 6)     { setPwdMsg({ type: "error", msg: "Password must be at least 6 characters." }); return; }
    setPwdBusy(true);
    setPwdMsg(null);
    const res = await fetch("/api/teacher/profile", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: curPwd, newPassword: newPwd }),
    });
    const json = await res.json();
    setPwdBusy(false);
    if (json.success) {
      setPwdMsg({ type: "success", msg: "Password changed successfully." });
      setCurPwd(""); setNewPwd(""); setConfirmPwd("");
    } else {
      setPwdMsg({ type: "error", msg: json.error ?? "Failed to change password." });
    }
  }

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

      <div className="flex min-h-screen bg-[#F5F7FA] dark:bg-[#0F172A] text-[#1E293B] dark:text-[#F1F5F9]">

        <TeacherSidebar
          teacherName={sidebar.teacherName}
          teacherInitials={sidebar.teacherInitials}
          teacherSection={sidebar.teacherSection}
          totalStudents={sidebar.totalStudents}
          pendingGradeCount={sidebar.pendingGradeCount}
          activePath="profile"
        />

        <div className="flex-1 overflow-x-hidden pt-14 md:pt-0">

          {/* Header */}
          <div className="sticky top-0 z-30 bg-white dark:bg-[#1E293B] border-b border-[#E2E8F0] dark:border-[#334155] shadow-sm px-6 py-4">
            <h1 className="font-nunito font-extrabold text-lg leading-tight">My Profile</h1>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">Manage your account details</p>
          </div>

          <div className="px-6 py-8 max-w-2xl space-y-6">

            {/* Avatar + info banner */}
            <div className="fade-up flex items-center gap-5 p-5 bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#4A9B7F] to-[#8B5CF6] flex items-center justify-center text-white text-2xl font-extrabold font-nunito flex-shrink-0">
                {teacher.initials}
              </div>
              <div>
                <p className="font-nunito font-extrabold text-lg">{teacher.name}</p>
                <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">{teacher.email}</p>
                <div className="flex gap-2 mt-1.5 flex-wrap">
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#D1FAE5] dark:bg-[#063c28] text-[#4A9B7F]">
                    Teacher
                  </span>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#EDE9FE] dark:bg-[#2e1065] text-[#8B5CF6]">
                    {teacher.section}
                  </span>
                  <span className="text-[11px] text-[#94A3B8]">Joined {teacher.joinedAt}</span>
                </div>
              </div>
            </div>

            {/* Account info */}
            <div className="fade-up">
              <Card title="👤 Account Details">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                  <Field
                    label="Full Name"
                    value={name}
                    onChange={setName}
                    placeholder="Your full name"
                  />
                  <Field label="Email Address" value={teacher.email} readOnly />
                  <Field label="Section" value={teacher.section} readOnly />
                  <Field label="Role" value="Teacher" readOnly />
                </div>
                {nameMsg && <div className="mb-4"><Alert type={nameMsg.type} msg={nameMsg.msg} /></div>}
                <button
                  onClick={saveName}
                  disabled={nameBusy || name.trim() === teacher.name}
                  className="px-5 py-2.5 rounded-xl bg-[#4A9B7F] hover:bg-[#3a8a6e] text-white text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {nameBusy ? "Saving…" : "Save Name"}
                </button>
              </Card>
            </div>

            {/* Password change */}
            <div className="fade-up">
              <Card title="🔒 Change Password">
                <div className="flex flex-col gap-4 mb-5">
                  <Field
                    label="Current Password"
                    type="password"
                    value={curPwd}
                    onChange={setCurPwd}
                    placeholder="Enter current password"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field
                      label="New Password"
                      type="password"
                      value={newPwd}
                      onChange={setNewPwd}
                      placeholder="Min. 6 characters"
                    />
                    <Field
                      label="Confirm New Password"
                      type="password"
                      value={confirmPwd}
                      onChange={setConfirmPwd}
                      placeholder="Repeat new password"
                    />
                  </div>
                </div>
                {pwdMsg && <div className="mb-4"><Alert type={pwdMsg.type} msg={pwdMsg.msg} /></div>}
                <button
                  onClick={savePassword}
                  disabled={pwdBusy || !curPwd || !newPwd || !confirmPwd}
                  className="px-5 py-2.5 rounded-xl bg-[#3B82C4] hover:bg-[#2563EB] text-white text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {pwdBusy ? "Changing…" : "Change Password"}
                </button>
              </Card>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
