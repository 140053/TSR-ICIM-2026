// app/admin/users/[id]/_components/AdminUserDetail.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type {
  AdminUserDetailData,
  UserRole,
  ModuleProgressRow,
  DiagnosticRow,
  ResponseRow,
  SessionRow,
  TeacherSection,
  SectionOption,
  SchoolOption,
} from "../page";

// ─── TYPES ────────────────────────────────────────────────────
type Tab = "overview" | "progress" | "diagnostics" | "responses" | "sessions" | "danger";

// ─── CONSTANTS ────────────────────────────────────────────────
const ROLE_STYLE: Record<UserRole, string> = {
  STUDENT: "bg-[#DBEAFE] dark:bg-[#1e3a5f] text-[#3B82C4] border-[#3B82C4]",
  TEACHER: "bg-[#D1FAE5] dark:bg-[#064e35] text-[#4A9B7F] border-[#4A9B7F]",
  ADMIN:   "bg-[#EDE9FE] dark:bg-[#2e1065] text-[#8B5CF6] border-[#8B5CF6]",
};
const ROLE_AVATAR: Record<UserRole, string> = {
  STUDENT: "bg-[#DBEAFE] dark:bg-[#1e3a5f] text-[#3B82C4]",
  TEACHER: "bg-[#D1FAE5] dark:bg-[#064e35] text-[#4A9B7F]",
  ADMIN:   "bg-[#EDE9FE] dark:bg-[#2e1065] text-[#8B5CF6]",
};
const DIFFICULTY_LABEL: Record<string, string> = {
  APPRENTICE: "🌱 Apprentice",
  ADVENTURER: "⚔️ Adventurer",
  CHAMPION:   "🔥 Champion",
};
const STATUS_STYLE: Record<string, string> = {
  completed:   "bg-[#D1FAE5] dark:bg-[#064e35] text-[#4A9B7F] border-[#4A9B7F]",
  in_progress: "bg-[#FEF3C7] dark:bg-[#3d2800] text-[#F59E0B] border-[#F59E0B]",
  not_started: "bg-[#EEF2F8] dark:bg-[#162032] text-[#64748B] border-[#64748B]",
};

// ─── HELPERS ─────────────────────────────────────────────────
function scoreColor(pct: number): string {
  if (pct >= 80) return "text-[#4A9B7F]";
  if (pct >= 60) return "text-[#F59E0B]";
  return "text-[#E05C5C]";
}
function phasePct(score: number): string {
  if (score >= 80) return "bg-[#4A9B7F]";
  if (score >= 60) return "bg-[#F59E0B]";
  return "bg-[#E05C5C]";
}

// ─── STAT CARD ────────────────────────────────────────────────
function StatCard({ icon, value, label, color }: {
  icon: string; value: string; label: string;
  color: "blue" | "purple" | "amber" | "green" | "red";
}) {
  const bars = { blue:"#3B82C4", purple:"#8B5CF6", amber:"#F59E0B", green:"#4A9B7F", red:"#E05C5C" };
  const ibg  = {
    blue:"bg-[#DBEAFE] dark:bg-[#1e3a5f]", purple:"bg-[#EDE9FE] dark:bg-[#2e1065]",
    amber:"bg-[#FEF3C7] dark:bg-[#3d2800]", green:"bg-[#D1FAE5] dark:bg-[#064e35]",
    red:"bg-[#FEE2E2] dark:bg-[#450a0a]",
  };
  return (
    <div className="relative bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl p-5 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: bars[color] }} />
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center text-base mb-2.5", ibg[color])}>
        {icon}
      </div>
      <div className="font-nunito text-2xl font-extrabold mb-0.5">{value}</div>
      <div className="text-xs text-[#64748B] dark:text-[#94A3B8]">{label}</div>
    </div>
  );
}

// ─── SECTION HEADING ──────────────────────────────────────────
function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-nunito font-extrabold text-sm text-[#1E293B] dark:text-[#F1F5F9] mb-3">
      {children}
    </h3>
  );
}

// ─── DETAIL ROW ───────────────────────────────────────────────
function DetailRow({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-[#E2E8F0] dark:border-[#334155] last:border-0">
      <span className="text-sm text-[#64748B] dark:text-[#94A3B8]">{label}</span>
      <span className={cn("text-sm font-semibold text-right", mono && "font-mono text-xs")}>{value}</span>
    </div>
  );
}

// ─── CONFIRM MODAL ────────────────────────────────────────────
function ConfirmModal({ open, title, desc, onConfirm, onCancel, danger }: {
  open: boolean; title: string; desc: string;
  onConfirm: () => void; onCancel: () => void; danger?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl p-7 shadow-xl max-w-sm w-full mx-4">
        <h3 className="font-nunito font-extrabold text-base mb-2">{title}</h3>
        <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mb-6">{desc}</p>
        <div className="flex gap-2.5">
          <button onClick={onConfirm} className={cn("flex-1 py-2.5 rounded-xl font-nunito font-bold text-sm", danger ? "bg-[#E05C5C] hover:bg-[#c04444] text-white" : "bg-[#8B5CF6] hover:bg-[#7c3aed] text-white")}>Confirm</button>
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl font-nunito font-bold text-sm border border-[#E2E8F0] dark:border-[#334155] text-[#64748B] hover:bg-[#EEF2F8] dark:hover:bg-[#162032]">Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ─── EDIT MODAL ───────────────────────────────────────────────
function EditModal({ open, user, onClose, onSave }: {
  open: boolean;
  user: AdminUserDetailData["user"];
  onClose: () => void;
  onSave: (name: string, email: string, role: UserRole) => Promise<void>;
}) {
  const [name,   setName]   = useState(user.name);
  const [email,  setEmail]  = useState(user.email);
  const [role,   setRole]   = useState<UserRole>(user.role);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState<string | null>(null);

  if (!open) return null;

  const handleSave = async () => {
    if (!name.trim() || !email.trim()) { setError("Name and email are required."); return; }
    setSaving(true);
    setError(null);
    try {
      await onSave(name.trim(), email.trim().toLowerCase(), role);
      onClose();
    } catch (e: any) {
      setError(e.message ?? "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const F = "w-full px-3.5 py-2.5 bg-[#EEF2F8] dark:bg-[#162032] border border-[#E2E8F0] dark:border-[#334155] rounded-xl text-sm focus:outline-none focus:border-[#8B5CF6] text-[#1E293B] dark:text-[#F1F5F9] placeholder:text-[#94A3B8]";
  const L = "text-[11px] font-bold tracking-widest uppercase text-[#64748B] dark:text-[#94A3B8] block mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl p-7 shadow-xl max-w-md w-full mx-4">
        <h3 className="font-nunito font-extrabold text-base mb-5">✏️ Edit User</h3>
        <div className="flex flex-col gap-4 mb-5">
          <div><label className={L}>Full Name</label><input value={name} onChange={e=>setName(e.target.value)} className={F+" h-10"} /></div>
          <div><label className={L}>Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} className={F+" h-10"} /></div>
          <div>
            <label className={L}>Role</label>
            <select value={role} onChange={e=>setRole(e.target.value as UserRole)} className={F+" h-10"}>
              <option value="STUDENT">STUDENT</option>
              <option value="TEACHER">TEACHER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>
        </div>
        {error && <p className="text-xs text-[#E05C5C] font-semibold mb-4">{error}</p>}
        <div className="flex gap-2.5">
          <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl font-nunito font-bold text-sm bg-[#8B5CF6] hover:bg-[#7c3aed] text-white disabled:opacity-50">
            {saving ? "Saving…" : "Save Changes"}
          </button>
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl font-nunito font-bold text-sm border border-[#E2E8F0] dark:border-[#334155] text-[#64748B] hover:bg-[#EEF2F8] dark:hover:bg-[#162032]">Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ─── RESET PASSWORD MODAL ─────────────────────────────────────
function ResetPasswordModal({ open, userId, onClose }: { open: boolean; userId: number; onClose: () => void }) {
  const [newPw,   setNewPw]   = useState("");
  const [saving,  setSaving]  = useState(false);
  const [done,    setDone]    = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  if (!open) return null;

  const F = "w-full px-3.5 py-2.5 bg-[#EEF2F8] dark:bg-[#162032] border border-[#E2E8F0] dark:border-[#334155] rounded-xl text-sm focus:outline-none focus:border-[#8B5CF6] text-[#1E293B] dark:text-[#F1F5F9] placeholder:text-[#94A3B8]";

  const handleReset = async () => {
    if (newPw.length < 8) { setError("Password must be at least 8 characters."); return; }
    setSaving(true); setError(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        credentials: "include", body: JSON.stringify({ newPassword: newPw }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) { setError(data.error ?? "Failed."); setSaving(false); return; }
      setDone(true);
    } catch { setError("Network error."); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl p-7 shadow-xl max-w-sm w-full mx-4">
        <h3 className="font-nunito font-extrabold text-base mb-2">🔑 Reset Password</h3>
        {done ? (
          <div className="text-center py-4">
            <div className="text-4xl mb-2">✅</div>
            <p className="text-sm font-semibold mb-4">Password updated successfully.</p>
            <button onClick={onClose} className="w-full py-2.5 rounded-xl font-nunito font-bold text-sm bg-[#4A9B7F] text-white">Done</button>
          </div>
        ) : (
          <>
            <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mb-4">Set a new password for this user. They will need to use it on their next login.</p>
            <input type="password" value={newPw} onChange={e=>setNewPw(e.target.value)} placeholder="New password (min 8 chars)" className={F+" h-10 mb-3"} />
            {error && <p className="text-xs text-[#E05C5C] font-semibold mb-3">{error}</p>}
            <div className="flex gap-2.5">
              <button onClick={handleReset} disabled={saving} className="flex-1 py-2.5 rounded-xl font-nunito font-bold text-sm bg-[#F59E0B] hover:bg-[#D97706] text-black disabled:opacity-50">{saving?"Resetting…":"Reset Password"}</button>
              <button onClick={onClose} className="flex-1 py-2.5 rounded-xl font-nunito font-bold text-sm border border-[#E2E8F0] dark:border-[#334155] text-[#64748B] hover:bg-[#EEF2F8] dark:hover:bg-[#162032]">Cancel</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── SECTION ASSIGN MODAL ────────────────────────────────────
function SectionAssignModal({
  open, userId, currentSectionId, currentSchoolId, sections, schools, onClose,
}: {
  open:             boolean;
  userId:           number;
  currentSectionId: number | null | undefined;
  currentSchoolId:  number | null | undefined;
  sections:         SectionOption[];
  schools:          SchoolOption[];
  onClose:          () => void;
}) {
  const router = useRouter();
  const [pickedSchoolId,   setPickedSchoolId]   = useState<number | null>(currentSchoolId ?? null);
  const [pickedSectionId,  setPickedSectionId]  = useState<number | null>(currentSectionId ?? null);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [done,    setDone]    = useState(false);

  if (!open) return null;

  const filteredSections = pickedSchoolId != null
    ? sections.filter((s) => s.schoolId === pickedSchoolId)
    : sections;

  const handleSchoolClick = (id: number) => {
    setPickedSchoolId(id);
    // Reset section if it doesn't belong to this school
    if (pickedSectionId != null) {
      const sec = sections.find((s) => s.id === pickedSectionId);
      if (sec?.schoolId !== id) setPickedSectionId(null);
    }
  };

  const handleSave = async () => {
    setSaving(true); setError(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}/assign-section`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ sectionId: pickedSectionId, schoolId: pickedSchoolId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) { setError(data.error ?? "Failed."); setSaving(false); return; }
      setDone(true);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally { setSaving(false); }
  };

  const selSchool  = schools.find((s) => s.id === pickedSchoolId);
  const selSection = sections.find((s) => s.id === pickedSectionId);

  const Radio = ({ active }: { active: boolean }) => (
    <div className={cn(
      "w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center text-[10px] font-black flex-shrink-0 transition-all",
      active ? "bg-[#4A9B7F] border-[#4A9B7F] text-white" : "border-[#E2E8F0] dark:border-[#334155]"
    )}>{active ? "✓" : ""}</div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl shadow-xl w-full max-w-md mx-auto max-h-[90vh] flex flex-col">
        {done ? (
          <div className="text-center py-10 px-7">
            <div className="text-4xl mb-3">✅</div>
            <h3 className="font-nunito font-extrabold text-base mb-2">Assignment updated!</h3>
            <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mb-5">
              {selSchool ? `School: 🏫 ${selSchool.name}` : "School cleared."}<br />
              {selSection ? `Section: ${selSection.emoji} ${selSection.name}` : "Section cleared."}
            </p>
            <button onClick={onClose} className="w-full py-2.5 rounded-xl font-nunito font-bold text-sm bg-[#4A9B7F] text-white hover:bg-[#2E7A60] transition-all">Done</button>
          </div>
        ) : (
          <>
            <div className="px-7 pt-6 pb-4 border-b border-[#E2E8F0] dark:border-[#334155]">
              <h3 className="font-nunito font-extrabold text-base mb-0.5">🏫 Assign School &amp; Section</h3>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">Pick a school first, then choose a section from that school.</p>
            </div>

            <div className="overflow-y-auto flex-1 px-7 py-4 flex flex-col gap-5">

              {/* ── Step 1: School ── */}
              <div>
                <p className="text-[10px] font-bold tracking-widest uppercase text-[#94A3B8] mb-2">1 · School</p>
                {schools.length === 0 ? (
                  <p className="text-xs text-[#94A3B8] italic">No schools in the system. Add one in the Schools tab first.</p>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {/* Clear school option */}
                    <button
                      type="button"
                      onClick={() => { setPickedSchoolId(null); setPickedSectionId(null); }}
                      className={cn(
                        "flex items-center gap-3 px-3.5 py-2.5 rounded-xl border-[1.5px] text-sm font-semibold transition-all text-left",
                        pickedSchoolId === null
                          ? "border-[#64748B] bg-[#EEF2F8] dark:bg-[#162032] text-[#64748B]"
                          : "border-[#E2E8F0] dark:border-[#334155] text-[#94A3B8] hover:border-[#64748B]"
                      )}
                    >
                      <Radio active={pickedSchoolId === null} />
                      <span>🚫 No School</span>
                      {currentSchoolId == null && <span className="ml-auto text-[10px] font-bold text-[#94A3B8]">Current</span>}
                    </button>
                    {schools.map((sch) => (
                      <button
                        key={sch.id}
                        type="button"
                        onClick={() => handleSchoolClick(sch.id)}
                        className={cn(
                          "flex items-center gap-3 px-3.5 py-2.5 rounded-xl border-[1.5px] text-sm font-semibold transition-all text-left",
                          pickedSchoolId === sch.id
                            ? "border-[#3B82C4] bg-[#DBEAFE] dark:bg-[#1e3a5f] text-[#3B82C4]"
                            : "border-[#E2E8F0] dark:border-[#334155] text-[#64748B] hover:border-[#3B82C4]"
                        )}
                      >
                        <Radio active={pickedSchoolId === sch.id} />
                        <span className="flex-1">🏫 {sch.name}</span>
                        {currentSchoolId === sch.id && <span className="text-[10px] font-bold text-[#3B82C4]">Current</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Step 2: Section ── */}
              <div>
                <p className="text-[10px] font-bold tracking-widest uppercase text-[#94A3B8] mb-2">
                  2 · Section {pickedSchoolId != null ? `— ${selSchool?.name ?? ""}` : "(all schools)"}
                </p>
                <div className="flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPickedSectionId(null)}
                    className={cn(
                      "flex items-center gap-3 px-3.5 py-2.5 rounded-xl border-[1.5px] text-sm font-semibold transition-all text-left",
                      pickedSectionId === null
                        ? "border-[#64748B] bg-[#EEF2F8] dark:bg-[#162032] text-[#64748B]"
                        : "border-[#E2E8F0] dark:border-[#334155] text-[#94A3B8] hover:border-[#64748B]"
                    )}
                  >
                    <Radio active={pickedSectionId === null} />
                    <span>🚫 No Section</span>
                    {currentSectionId == null && <span className="ml-auto text-[10px] font-bold text-[#94A3B8]">Current</span>}
                  </button>
                  {filteredSections.length === 0 ? (
                    <p className="text-xs text-[#94A3B8] italic px-1 py-2">
                      {pickedSchoolId != null ? "No active sections for this school." : "No active sections found."}
                    </p>
                  ) : filteredSections.map((sec) => (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => setPickedSectionId(sec.id)}
                      className={cn(
                        "flex items-center gap-3 px-3.5 py-2.5 rounded-xl border-[1.5px] text-sm font-semibold transition-all text-left",
                        pickedSectionId === sec.id
                          ? "border-[#4A9B7F] bg-[#D1FAE5] dark:bg-[#064e35] text-[#4A9B7F]"
                          : "border-[#E2E8F0] dark:border-[#334155] text-[#64748B] hover:border-[#4A9B7F]"
                      )}
                    >
                      <Radio active={pickedSectionId === sec.id} />
                      <span className="text-xl">{sec.emoji}</span>
                      <span className="flex-1">{sec.name}</span>
                      {currentSectionId === sec.id && <span className="text-[10px] font-bold text-[#4A9B7F]">Current</span>}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-7 pb-6 pt-3 border-t border-[#E2E8F0] dark:border-[#334155] flex flex-col gap-3">
              {error && (
                <div className="flex items-start gap-2 px-3.5 py-2.5 bg-[#FEE2E2] dark:bg-[#450a0a] border border-[#E05C5C] rounded-xl">
                  <span className="text-[#E05C5C] flex-shrink-0">⚠️</span>
                  <p className="text-xs text-[#E05C5C] font-semibold">{error}</p>
                </div>
              )}
              <div className="flex gap-2.5">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl font-nunito font-bold text-sm bg-[#4A9B7F] hover:bg-[#2E7A60] text-white disabled:opacity-50 transition-all"
                >
                  {saving ? "Saving…" : "Save Assignment"}
                </button>
                <button
                  onClick={onClose}
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl font-nunito font-bold text-sm border border-[#E2E8F0] dark:border-[#334155] text-[#64748B] hover:bg-[#EEF2F8] dark:hover:bg-[#162032] transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── TEACHER ASSIGN MODAL ────────────────────────────────────
function TeacherAssignModal({
  open, userId, sections, currentSectionIds, onClose,
}: {
  open:              boolean;
  userId:            number;
  sections:          SectionOption[];
  currentSectionIds: number[];
  onClose:           () => void;
}) {
  const router  = useRouter();
  const [selected, setSelected] = useState<number[]>(currentSectionIds);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [done,     setDone]     = useState(false);

  if (!open) return null;

  const toggle = (id: number) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}/assign-teacher-sections`, {
        method:      "POST",
        headers:     { "Content-Type": "application/json" },
        credentials: "include",
        body:        JSON.stringify({ sectionIds: selected }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error ?? "Failed to update sections.");
        setSaving(false);
        return;
      }
      setDone(true);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl p-7 shadow-xl w-full max-w-md mx-4 max-h-[90vh] flex flex-col">
        {done ? (
          <div className="text-center py-4">
            <div className="text-4xl mb-3">✅</div>
            <h3 className="font-nunito font-extrabold text-base mb-2">Sections updated!</h3>
            <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mb-5">
              {selected.length === 0
                ? "Teacher removed from all sections."
                : `Teacher assigned to ${selected.length} section${selected.length > 1 ? "s" : ""}.`}
            </p>
            <button onClick={onClose} className="w-full py-2.5 rounded-xl font-nunito font-bold text-sm bg-[#4A9B7F] text-white hover:bg-[#2E7A60] transition-all">Done</button>
          </div>
        ) : (
          <>
            <h3 className="font-nunito font-extrabold text-base mb-1.5">📋 Assign Teacher to Sections</h3>
            <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mb-4">
              Select which sections this teacher manages. Assigning a section that already has a teacher will replace them.
            </p>

            {sections.length === 0 ? (
              <p className="text-sm text-[#64748B] dark:text-[#94A3B8] py-4 text-center">No active sections found.</p>
            ) : (
              <div className="flex flex-col gap-2 overflow-y-auto flex-1 mb-4 pr-0.5">
                {sections.map((sec) => {
                  const isSelected = selected.includes(sec.id);
                  const isCurrent  = currentSectionIds.includes(sec.id);
                  const hasOtherT  = sec.teacherId !== null && sec.teacherId !== userId;
                  return (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => toggle(sec.id)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl border-[1.5px] text-sm font-semibold transition-all text-left",
                        isSelected
                          ? "border-[#4A9B7F] bg-[#D1FAE5] dark:bg-[#064e35] text-[#4A9B7F]"
                          : "border-[#E2E8F0] dark:border-[#334155] text-[#64748B] hover:border-[#4A9B7F]"
                      )}
                    >
                      <div className={cn(
                        "w-[18px] h-[18px] rounded-[5px] border-2 flex items-center justify-center text-[10px] font-black flex-shrink-0 transition-all",
                        isSelected ? "bg-[#4A9B7F] border-[#4A9B7F] text-white" : "border-[#E2E8F0] dark:border-[#334155]"
                      )}>
                        {isSelected ? "✓" : ""}
                      </div>
                      <span className="text-xl flex-shrink-0">{sec.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold truncate">{sec.name}</p>
                        {hasOtherT && <p className="text-[11px] text-[#F59E0B] truncate">⚠️ Currently: {sec.teacherName}</p>}
                        {isCurrent && !hasOtherT && <p className="text-[11px] text-[#4A9B7F]">Currently assigned</p>}
                        {!sec.teacherId && <p className="text-[11px] text-[#94A3B8]">No teacher yet</p>}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Overwrite warning */}
            {selected.some((id) => {
              const sec = sections.find((s) => s.id === id);
              return sec?.teacherId !== null && sec?.teacherId !== userId;
            }) && (
              <div className="flex items-start gap-2 px-3.5 py-2.5 bg-[#FEF3C7] dark:bg-[#3d2800] border border-[#F59E0B] rounded-xl mb-4">
                <span className="text-[#F59E0B] flex-shrink-0">⚠️</span>
                <p className="text-xs text-[#F59E0B] font-semibold">Some selected sections already have a teacher. Saving will replace them.</p>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 px-3.5 py-2.5 bg-[#FEE2E2] dark:bg-[#450a0a] border border-[#E05C5C] rounded-xl mb-4">
                <span className="text-[#E05C5C] flex-shrink-0">⚠️</span>
                <p className="text-xs text-[#E05C5C] font-semibold">{error}</p>
              </div>
            )}

            <div className="flex gap-2.5 mt-auto">
              <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl font-nunito font-bold text-sm bg-[#4A9B7F] hover:bg-[#2E7A60] text-white disabled:opacity-50 transition-all">
                {saving ? "Saving…" : "Save Assignments"}
              </button>
              <button onClick={onClose} disabled={saving} className="flex-1 py-2.5 rounded-xl font-nunito font-bold text-sm border border-[#E2E8F0] dark:border-[#334155] text-[#64748B] hover:bg-[#EEF2F8] dark:hover:bg-[#162032] transition-all">Cancel</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function TabOverview({
  data, onAssignSection, onAssignTeacherSections,
}: {
  data: AdminUserDetailData;
  onAssignSection: () => void;
  onAssignTeacherSections: () => void;
}) {
  const { user, stats, sections } = data;
  return (
    <div className="flex flex-col gap-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <StatCard icon="📝" value={String(stats.totalResponses)}                    label="Stage Responses"    color="blue"   />
        <StatCard icon="✅" value={String(stats.completedModules)}                  label="Modules Completed"  color="green"  />
        <StatCard icon="⭐" value={stats.avgScore != null ? `${stats.avgScore}%` : "—"} label="Avg Module Score"   color="purple" />
        <StatCard icon="⏱️" value={`${stats.totalTimeMin}m`}                        label="Total Time Spent"   color="amber"  />
        <StatCard icon="🔑" value={String(stats.activeSessions)}                    label="Active Sessions"    color={stats.activeSessions > 0 ? "green" : "blue"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Account info */}
        <div className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl p-6">
          <SectionHeading>👤 Account Information</SectionHeading>
          <DetailRow label="User ID"   value={<code className="text-xs font-mono bg-[#EEF2F8] dark:bg-[#162032] px-1.5 py-0.5 rounded">#{user.id}</code>} />
          <DetailRow label="Full Name" value={user.name} />
          <DetailRow label="Email"     value={user.email} mono />
          <DetailRow label="Role"      value={<span className={cn("text-[10px] font-bold px-2.5 py-1 rounded-full border", ROLE_STYLE[user.role])}>{user.role}</span>} />
          <DetailRow label="Joined"    value={user.createdAt} />
          <DetailRow label="Updated"   value={user.updatedAt} />
        </div>

        {/* Student or Teacher profile card */}
        {user.role === "STUDENT" && user.student ? (
          <div className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-nunito font-extrabold text-sm">🎒 Student Profile</h3>
              <button
                onClick={onAssignSection}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-nunito font-bold border border-[#E2E8F0] dark:border-[#334155] text-[#64748B] hover:border-[#4A9B7F] hover:text-[#4A9B7F] hover:bg-[#D1FAE5] dark:hover:bg-[#064e35] transition-all"
              >
                🏫 Assign Section
              </button>
            </div>
            <DetailRow label="Avatar"     value={`${user.student.avatarEmoji} ${user.student.avatarName}`} />
            <DetailRow label="Difficulty" value={DIFFICULTY_LABEL[user.student.difficulty] ?? user.student.difficulty} />
            <DetailRow
              label="Section"
              value={
                <div className="flex items-center gap-2">
                  <span>{user.student.section}</span>
                  <button onClick={onAssignSection} className="text-[10px] font-bold text-[#4A9B7F] hover:underline">Change</button>
                </div>
              }
            />
            <DetailRow label="Setup Done" value={user.student.setupDone ? <span className="text-[#4A9B7F] font-bold">✓ Yes</span> : <span className="text-[#F59E0B] font-bold">⏳ Pending</span>} />
            <DetailRow label="XP"         value={`${user.student.xp.toLocaleString()} XP`} />
            <DetailRow label="Level"      value={`Level ${user.student.level}`} />
          </div>
        ) : user.role === "TEACHER" ? (
          <div className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-nunito font-extrabold text-sm">📋 Teacher Profile</h3>
              <button
                onClick={onAssignTeacherSections}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-nunito font-bold border border-[#E2E8F0] dark:border-[#334155] text-[#64748B] hover:border-[#4A9B7F] hover:text-[#4A9B7F] hover:bg-[#D1FAE5] dark:hover:bg-[#064e35] transition-all"
              >
                🏫 Assign Sections
              </button>
            </div>
            {!sections || sections.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 gap-2">
                <p className="text-sm text-[#64748B] dark:text-[#94A3B8] text-center">No sections assigned yet.</p>
                <button
                  onClick={onAssignTeacherSections}
                  className="px-3.5 py-2 rounded-xl text-xs font-nunito font-bold bg-[#D1FAE5] dark:bg-[#064e35] text-[#4A9B7F] border border-[#4A9B7F] hover:bg-[#4A9B7F] hover:text-white transition-all"
                >
                  + Assign a Section
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {sections.map((sec) => (
                  <div key={sec.id} className="flex items-center gap-2.5 p-2.5 bg-[#EEF2F8] dark:bg-[#162032] rounded-xl border border-[#E2E8F0] dark:border-[#334155]">
                    <span className="text-xl">{sec.emoji}</span>
                    <span className="text-sm font-semibold flex-1">{sec.name}</span>
                    <span className="text-xs text-[#64748B] dark:text-[#94A3B8]">{sec.studentCount} students</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl p-6 flex items-center justify-center">
            <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">🛡️ Administrator account</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PROGRESS TAB ─────────────────────────────────────────────
function TabProgress({ progress, userId }: { progress: ModuleProgressRow[]; userId: number }) {
  const router = useRouter();
  const [confirmModuleId, setConfirmModuleId] = useState<number | null>(null);
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const handleReset = async () => {
    if (confirmModuleId == null) return;
    setResetting(true);
    setResetError(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}/progress/${confirmModuleId}`, {
        method: "DELETE", credentials: "include",
      });
      const d = await res.json();
      if (!d.success) { setResetError(d.error ?? "Failed to reset."); setResetting(false); return; }
      setConfirmModuleId(null);
      router.refresh();
    } catch {
      setResetError("Network error.");
    } finally {
      setResetting(false);
    }
  };

  const confirmTarget = progress.find((p) => p.moduleId === confirmModuleId);

  if (progress.length === 0) {
    return <p className="text-sm text-[#64748B] dark:text-[#94A3B8] py-8 text-center">No module progress recorded yet.</p>;
  }
  return (
    <div className="flex flex-col gap-3">
      {progress.map((p) => (
        <div key={p.moduleId} className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{p.moduleIcon}</span>
              <div>
                <p className="font-nunito font-extrabold text-sm">{p.moduleTitle}</p>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                  {DIFFICULTY_LABEL[p.difficulty] ?? p.difficulty} · Last active {p.lastActive}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={cn("text-[10px] font-bold px-2.5 py-1 rounded-full border", STATUS_STYLE[p.status] ?? STATUS_STYLE.not_started)}>
                {p.status.replace("_", " ")}
              </span>
              {p.percentScore != null && (
                <span className={cn("text-sm font-extrabold font-nunito", scoreColor(p.percentScore))}>
                  {p.percentScore}%
                </span>
              )}
              <button
                onClick={() => setConfirmModuleId(p.moduleId)}
                className="px-3 py-1.5 rounded-lg text-[11px] font-bold border border-[#E2E8F0] dark:border-[#334155] text-[#64748B] hover:border-[#E05C5C] hover:text-[#E05C5C] hover:bg-[#FEE2E2] dark:hover:bg-[#450a0a] transition-all"
                title="Reset all progress and responses for this module"
              >
                ↺ Reset
              </button>
            </div>
          </div>
          {/* Stage pip track */}
          <div className="flex gap-[3px] mb-1.5">
            {Array.from({ length: 12 }, (_, i) => {
              const n = i + 1;
              const phase =
                n <= 3  ? "#3B82C4" :
                n <= 7  ? "#8B5CF6" :
                n <= 10 ? "#F59E0B" : "#4A9B7F";
              const filled = n < p.currentStage;
              const active = n === p.currentStage && p.status === "in_progress";
              return (
                <div
                  key={n}
                  className={cn("flex-1 h-1.5 rounded-full transition-all", active && "animate-pulse")}
                  style={{ background: filled || active ? phase : "#E2E8F0" }}
                />
              );
            })}
          </div>
          <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
            Stage {p.currentStage} of 12
          </p>
        </div>
      ))}

      {resetError && (
        <p className="text-xs text-[#E05C5C] text-center">{resetError}</p>
      )}

      <ConfirmModal
        open={confirmModuleId != null}
        title="Reset module progress?"
        desc={`This will permanently delete all stage responses, scores, and the diagnostic report for "${confirmTarget?.moduleTitle ?? "this module"}". The student will start from Stage 1 again. This cannot be undone.`}
        danger
        onConfirm={handleReset}
        onCancel={() => { setConfirmModuleId(null); setResetError(null); }}
      />

      {resetting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl px-8 py-6 shadow-xl text-sm font-semibold">
            Resetting progress…
          </div>
        </div>
      )}
    </div>
  );
}

// ─── DIAGNOSTICS TAB ──────────────────────────────────────────
function TabDiagnostics({ diagnostics }: { diagnostics: DiagnosticRow[] }) {
  if (diagnostics.length === 0) {
    return <p className="text-sm text-[#64748B] dark:text-[#94A3B8] py-8 text-center">No diagnostic reports yet.</p>;
  }
  return (
    <div className="flex flex-col gap-4">
      {diagnostics.map((d, i) => (
        <div key={i} className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-nunito font-extrabold text-sm">{d.moduleTitle}</p>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">{d.generatedAt}</p>
            </div>
            <div className="flex items-center gap-2">
              {d.needsIntervention && (
                <Badge className="bg-[#FEE2E2] dark:bg-[#450a0a] text-[#E05C5C] border-0 text-xs font-bold">
                  ⚠️ Needs Intervention
                </Badge>
              )}
              <span className={cn("text-lg font-extrabold font-nunito", scoreColor(d.overallScore))}>
                {d.overallScore}%
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "🔵 Understanding", score: d.understandingScore, color: "#3B82C4" },
              { label: "🟣 Analysis",      score: d.analysisScore,      color: "#8B5CF6" },
              { label: "🟠 Solution",      score: d.solutionScore,      color: "#F59E0B" },
              { label: "🟢 Reflection",    score: d.reflectionScore,    color: "#4A9B7F" },
            ].map((cluster) => (
              <div key={cluster.label}>
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-semibold">{cluster.label}</span>
                  <span className="text-xs font-extrabold" style={{ color: cluster.color }}>
                    {cluster.score}%
                  </span>
                </div>
                <div className="h-2 bg-[#EEF2F8] dark:bg-[#162032] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${cluster.score}%`, background: cluster.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── RESPONSES TAB ────────────────────────────────────────────
function TabResponses({ responses }: { responses: ResponseRow[] }) {
  const [search, setSearch] = useState("");
  const filtered = responses.filter((r) =>
    r.moduleTitle.toLowerCase().includes(search.toLowerCase()) ||
    r.stageTitle.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div>
      <div className="mb-4 relative max-w-xs">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#94A3B8]">🔍</span>
        <Input
          placeholder="Search responses…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8 h-9 text-sm bg-white dark:bg-[#1E293B] border-[#E2E8F0] dark:border-[#334155] focus-visible:border-[#8B5CF6] rounded-xl"
        />
      </div>
      {filtered.length === 0 ? (
        <p className="text-sm text-[#64748B] dark:text-[#94A3B8] py-8 text-center">No responses found.</p>
      ) : (
        <div className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-[#F8FAFC] dark:bg-[#162032]">
                  {["Stage","Module","Score","Status","Graded","Time","Date"].map((h) => (
                    <th key={h} className="text-left text-[11px] font-bold tracking-[0.06em] uppercase text-[#64748B] dark:text-[#94A3B8] px-4 py-3 border-b border-[#E2E8F0] dark:border-[#334155] whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={i} className="hover:bg-[#EEF2F8] dark:hover:bg-[#162032] transition-colors">
                    <td className="px-4 py-3 border-b border-[#E2E8F0] dark:border-[#334155]">
                      <div>
                        <p className="font-semibold text-xs">{r.stageTitle}</p>
                        <p className="text-[11px] text-[#94A3B8]">S{r.stageNumber}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 border-b border-[#E2E8F0] dark:border-[#334155] text-xs text-[#64748B] dark:text-[#94A3B8] max-w-[160px] truncate">{r.moduleTitle}</td>
                    <td className="px-4 py-3 border-b border-[#E2E8F0] dark:border-[#334155]">
                      {r.score != null ? (
                        <span className={cn("text-sm font-extrabold font-nunito", scoreColor(Math.round((r.score / r.maxScore) * 100)))}>
                          {r.score}/{r.maxScore}
                        </span>
                      ) : <span className="text-xs text-[#94A3B8]">—</span>}
                    </td>
                    <td className="px-4 py-3 border-b border-[#E2E8F0] dark:border-[#334155]">
                      {r.isCorrect === true  && <span className="text-xs font-bold text-[#4A9B7F]">✓ Correct</span>}
                      {r.isCorrect === false && <span className="text-xs font-bold text-[#E05C5C]">✗ Incorrect</span>}
                      {r.isCorrect === null  && <span className="text-xs text-[#94A3B8]">Pending</span>}
                    </td>
                    <td className="px-4 py-3 border-b border-[#E2E8F0] dark:border-[#334155] text-xs text-[#64748B] dark:text-[#94A3B8]">{r.gradedAt ?? "—"}</td>
                    <td className="px-4 py-3 border-b border-[#E2E8F0] dark:border-[#334155] text-xs text-[#64748B] dark:text-[#94A3B8]">
                      {r.timeSpent ? `${Math.round(r.timeSpent / 60)}m` : "—"}
                    </td>
                    <td className="px-4 py-3 border-b border-[#E2E8F0] dark:border-[#334155] text-xs text-[#64748B] dark:text-[#94A3B8] whitespace-nowrap">{r.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SESSIONS TAB ────────────────────────────────────────────
function TabSessions({ sessions, userId }: { sessions: SessionRow[]; userId: number }) {
  const router = useRouter();
  const [revoking, setRevoking] = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState(false);

  const revokeAll = async () => {
    setRevoking(true);
    await fetch(`/api/admin/users/${userId}/revoke-sessions`, {
      method: "POST", credentials: "include",
    });
    setRevoking(false);
    setConfirmRevoke(false);
    router.refresh();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
          {sessions.filter((s) => s.isActive).length} active · {sessions.length} total (last 10)
        </p>
        <button
          onClick={() => setConfirmRevoke(true)}
          disabled={revoking || sessions.filter((s) => s.isActive).length === 0}
          className="px-3.5 py-2 rounded-xl font-nunito font-bold text-xs border border-[#E2E8F0] dark:border-[#334155] text-[#64748B] hover:border-[#E05C5C] hover:text-[#E05C5C] hover:bg-[#FEE2E2] dark:hover:bg-[#450a0a] disabled:opacity-40 transition-all"
        >
          Revoke All Sessions
        </button>
      </div>
      {sessions.length === 0 ? (
        <p className="text-sm text-[#64748B] dark:text-[#94A3B8] py-8 text-center">No sessions on record.</p>
      ) : (
        <div className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-[#F8FAFC] dark:bg-[#162032]">
                  {["Status","ID","Created","Expires"].map((h) => (
                    <th key={h} className="text-left text-[11px] font-bold tracking-[0.06em] uppercase text-[#64748B] dark:text-[#94A3B8] px-4 py-3 border-b border-[#E2E8F0] dark:border-[#334155]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s.id} className="hover:bg-[#EEF2F8] dark:hover:bg-[#162032] transition-colors">
                    <td className="px-4 py-3 border-b border-[#E2E8F0] dark:border-[#334155]">
                      <span className={cn("text-[10px] font-bold px-2.5 py-1 rounded-full border", s.isActive ? "bg-[#D1FAE5] dark:bg-[#064e35] text-[#4A9B7F] border-[#4A9B7F]" : "bg-[#EEF2F8] dark:bg-[#162032] text-[#64748B] border-[#E2E8F0]")}>
                        {s.isActive ? "Active" : "Expired"}
                      </span>
                    </td>
                    <td className="px-4 py-3 border-b border-[#E2E8F0] dark:border-[#334155] font-mono text-xs text-[#94A3B8]">#{s.id}</td>
                    <td className="px-4 py-3 border-b border-[#E2E8F0] dark:border-[#334155] text-xs text-[#64748B] dark:text-[#94A3B8] whitespace-nowrap">{s.createdAt}</td>
                    <td className="px-4 py-3 border-b border-[#E2E8F0] dark:border-[#334155] text-xs text-[#64748B] dark:text-[#94A3B8] whitespace-nowrap">{s.expiresAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <ConfirmModal
        open={confirmRevoke}
        title="Revoke all sessions?"
        desc="This will sign the user out from all devices immediately. They will need to log in again."
        danger
        onConfirm={revokeAll}
        onCancel={() => setConfirmRevoke(false)}
      />
    </div>
  );
}

// ─── DANGER ZONE TAB ─────────────────────────────────────────
function TabDanger({ user }: { user: AdminUserDetailData["user"] }) {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting,      setDeleting]      = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    await fetch(`/api/admin/users/${user.id}`, { method: "DELETE", credentials: "include" });
    router.push("/admin?tab=users");
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-4 max-w-lg">
      <div className="bg-[#FEE2E2] dark:bg-[#450a0a] border border-[#E05C5C] rounded-2xl p-6">
        <h3 className="font-nunito font-extrabold text-sm text-[#E05C5C] mb-1">⚠️ Danger Zone</h3>
        <p className="text-xs text-[#E05C5C] mb-4 leading-relaxed">
          Actions in this section are permanent and cannot be undone.
        </p>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between p-3.5 bg-white dark:bg-[#1E293B] rounded-xl border border-[#E05C5C]">
            <div>
              <p className="text-sm font-bold">Delete User Account</p>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">Permanently removes this user and all their data</p>
            </div>
            <button
              onClick={() => setConfirmDelete(true)}
              disabled={user.role === "ADMIN" || deleting}
              className="px-3.5 py-2 rounded-xl font-nunito font-bold text-xs bg-[#E05C5C] hover:bg-[#c04444] text-white disabled:opacity-40 transition-all"
            >
              Delete
            </button>
          </div>
        </div>
        {user.role === "ADMIN" && (
          <p className="text-xs text-[#E05C5C] mt-3 font-semibold">Admin accounts cannot be deleted from this panel.</p>
        )}
      </div>
      <ConfirmModal
        open={confirmDelete}
        title={`Delete ${user.name}?`}
        desc="This will permanently remove the user account, all progress, responses, and sessions. This cannot be undone."
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}

// ─── MAIN CLIENT COMPONENT ────────────────────────────────────
export default function AdminUserDetail({ data }: { data: AdminUserDetailData }) {
  const router = useRouter();
  const [tab,                    setTab]                    = useState<Tab>("overview");
  const [showEdit,               setShowEdit]               = useState(false);
  const [showReset,              setShowReset]              = useState(false);
  const [showAssignSection,      setShowAssignSection]      = useState(false);
  const [showAssignTeacherSects, setShowAssignTeacherSects] = useState(false);

  const { user } = data;

  const handleSaveUser = async (name: string, email: string, role: UserRole) => {
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name, email, role }),
    });
    const d = await res.json();
    if (!res.ok || !d.success) throw new Error(d.error ?? "Failed to update.");
    router.refresh();
  };

  const TABS: { key: Tab; label: string; icon: string }[] = [
    { key: "overview",     label: "Overview",     icon: "🏠" },
    { key: "progress",     label: "Progress",     icon: "📈" },
    { key: "diagnostics",  label: "Diagnostics",  icon: "📊" },
    { key: "responses",    label: "Responses",    icon: "📝" },
    { key: "sessions",     label: "Sessions",     icon: "🔑" },
    { key: "danger",       label: "Danger Zone",  icon: "⚠️" },
  ];

  return (
    <>
      <style>{`.font-nunito{font-family:var(--font-nunito,'Nunito',sans-serif);}@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}.fade-up{animation:fadeUp .35s ease both;}`}</style>

      <div className="min-h-screen bg-[#F5F7FA] dark:bg-[#0F172A] text-[#1E293B] dark:text-[#F1F5F9]">

        {/* ── TOPBAR ── */}
        <header className="sticky top-0 z-40 bg-white dark:bg-[#1E293B] border-b border-[#E2E8F0] dark:border-[#334155] px-6 py-4 flex items-center gap-4 shadow-sm">
          <button
            onClick={() => router.push("/admin")}
            className="p-2 rounded-xl hover:bg-[#EEF2F8] dark:hover:bg-[#162032] text-[#64748B] hover:text-[#8B5CF6] font-bold transition-colors"
          >
            ←
          </button>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center font-extrabold font-nunito text-sm flex-shrink-0", ROLE_AVATAR[user.role])}>
              {user.role === "STUDENT" && user.student ? user.student.avatarEmoji : user.initials}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-nunito font-extrabold text-base truncate">{user.name}</h1>
                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0", ROLE_STYLE[user.role])}>
                  {user.role}
                </span>
              </div>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] truncate">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {user.role === "STUDENT" && (
              <button
                onClick={() => setShowAssignSection(true)}
                className="px-3.5 py-2 rounded-xl font-nunito font-bold text-xs border border-[#E2E8F0] dark:border-[#334155] text-[#64748B] hover:border-[#4A9B7F] hover:text-[#4A9B7F] hover:bg-[#D1FAE5] dark:hover:bg-[#064e35] transition-all"
              >
                🏫 Assign Section
              </button>
            )}
            {user.role === "TEACHER" && (
              <button
                onClick={() => setShowAssignTeacherSects(true)}
                className="px-3.5 py-2 rounded-xl font-nunito font-bold text-xs border border-[#E2E8F0] dark:border-[#334155] text-[#64748B] hover:border-[#4A9B7F] hover:text-[#4A9B7F] hover:bg-[#D1FAE5] dark:hover:bg-[#064e35] transition-all"
              >
                🏫 Assign Sections
              </button>
            )}
            <button
              onClick={() => setShowReset(true)}
              className="px-3.5 py-2 rounded-xl font-nunito font-bold text-xs border border-[#E2E8F0] dark:border-[#334155] text-[#64748B] hover:border-[#F59E0B] hover:text-[#F59E0B] hover:bg-[#FEF3C7] dark:hover:bg-[#3d2800] transition-all"
            >
              🔑 Reset Password
            </button>
            <button
              onClick={() => setShowEdit(true)}
              className="px-3.5 py-2 rounded-xl font-nunito font-bold text-xs bg-[#8B5CF6] hover:bg-[#7c3aed] text-white shadow-[0_4px_14px_rgba(139,92,246,0.25)] transition-all"
            >
              ✏️ Edit User
            </button>
          </div>
        </header>

        {/* ── TAB NAV ── */}
        <div className="bg-white dark:bg-[#1E293B] border-b border-[#E2E8F0] dark:border-[#334155] px-6">
          <div className="flex gap-0.5 overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-3.5 text-sm font-nunito font-bold border-b-2 transition-all whitespace-nowrap",
                  tab === t.key
                    ? t.key === "danger"
                      ? "border-[#E05C5C] text-[#E05C5C]"
                      : "border-[#8B5CF6] text-[#8B5CF6]"
                    : "border-transparent text-[#64748B] dark:text-[#94A3B8] hover:text-[#1E293B] dark:hover:text-[#F1F5F9]"
                )}
              >
                <span className="text-base leading-none">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── CONTENT ── */}
        <div className="p-8 fade-up" key={tab}>
          {tab === "overview"    && <TabOverview    data={data} onAssignSection={() => setShowAssignSection(true)} onAssignTeacherSections={() => setShowAssignTeacherSects(true)} />}
          {tab === "progress"    && <TabProgress    progress={data.progress} userId={data.user.id} />}
          {tab === "diagnostics" && <TabDiagnostics diagnostics={data.diagnostics} />}
          {tab === "responses"   && <TabResponses   responses={data.responses} />}
          {tab === "sessions"    && <TabSessions    sessions={data.sessions} userId={user.id} />}
          {tab === "danger"      && <TabDanger      user={user} />}
        </div>
      </div>

      {/* Modals */}
      <EditModal
        open={showEdit}
        user={user}
        onClose={() => setShowEdit(false)}
        onSave={handleSaveUser}
      />
      <ResetPasswordModal
        open={showReset}
        userId={user.id}
        onClose={() => setShowReset(false)}
      />
      <SectionAssignModal
        open={showAssignSection}
        userId={user.id}
        currentSectionId={user.student?.sectionId ?? null}
        currentSchoolId={user.student?.schoolId ?? null}
        sections={data.allSections}
        schools={data.allSchools}
        onClose={() => setShowAssignSection(false)}
      />
      <TeacherAssignModal
        open={showAssignTeacherSects}
        userId={user.id}
        sections={data.allSections}
        currentSectionIds={data.allSections
          .filter((s) => s.teacherId === user.id)
          .map((s) => s.id)}
        onClose={() => setShowAssignTeacherSects(false)}
      />
    </>
  );
}