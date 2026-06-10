"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { InviteCodeRow } from "../page";

// ─── Types ─────────────────────────────────────────────────────
interface AdminUser { id: number; name: string; email: string; role: string; }

// ─── Helpers ───────────────────────────────────────────────────
function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  function copy(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(text);
      setTimeout(() => setCopied(null), 2000);
    });
  }
  return { copied, copy };
}

// ─── Generate Modal ────────────────────────────────────────────
function GenerateModal({
  onClose,
  onCreated,
}: {
  onClose:   () => void;
  onCreated: (row: InviteCodeRow) => void;
}) {
  const [label,     setLabel]     = useState("");
  const [expires,   setExpires]   = useState("");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [generated, setGenerated] = useState<string | null>(null);
  const { copied, copy } = useCopy();

  async function handleGenerate() {
    setError(null);
    setLoading(true);
    try {
      const res  = await fetch("/api/admin/invite-codes", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ label: label.trim() || undefined, expiresAt: expires || undefined }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "Failed to generate code.");
      } else {
        setGenerated(json.code.code);
        onCreated({
          id:          json.code.id,
          code:        json.code.code,
          label:       json.code.label,
          isActive:    true,
          expiresAt:   expires ? new Date(expires).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) : null,
          createdAt:   new Date().toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }),
          createdBy:   "You",
          usedBy:      null,
          usedByEmail: null,
          usedAt:      null,
        });
      }
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E2E8F0] dark:border-[#334155]">
          <h2 className="font-nunito font-extrabold text-lg">Generate Invite Code</h2>
          <button onClick={onClose} className="text-[#64748B] hover:text-[#E05C5C] text-xl leading-none">×</button>
        </div>
        <div className="p-6 space-y-4">
          {!generated ? (
            <>
              <div>
                <label className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] block mb-1.5">
                  Label <span className="font-normal">(optional — e.g. "Batch 2026-A")</span>
                </label>
                <input value={label} onChange={(e) => setLabel(e.target.value)}
                  placeholder="Batch 2026" maxLength={120}
                  className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A] text-sm focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]" />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] block mb-1.5">
                  Expiry Date <span className="font-normal">(optional)</span>
                </label>
                <input type="datetime-local" value={expires} onChange={(e) => setExpires(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A] text-sm focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]" />
              </div>
              {error && (
                <div className="bg-[#FEE2E2] dark:bg-[#450a0a] border border-[#E05C5C]/30 rounded-xl px-4 py-3 text-sm text-[#E05C5C]">
                  ⚠️ {error}
                </div>
              )}
              <button onClick={handleGenerate} disabled={loading}
                className="w-full h-11 rounded-xl bg-[#8B5CF6] hover:bg-[#7c3aed] text-white text-sm font-bold shadow-[0_4px_14px_rgba(139,92,246,0.3)] transition-all disabled:opacity-60">
                {loading ? "Generating…" : "Generate Code"}
              </button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="text-center py-2">
                <div className="text-4xl mb-3">🎉</div>
                <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mb-3">
                  Invite code generated. Share this with the teacher:
                </p>
                <div className="flex items-center gap-2 bg-[#EDE9FE] dark:bg-[#1a0e35] border border-[#8B5CF6]/30 rounded-xl px-4 py-3">
                  <code className="flex-1 font-mono text-[#8B5CF6] font-bold text-lg tracking-widest">{generated}</code>
                  <button onClick={() => copy(generated)}
                    className="text-xs font-semibold text-[#8B5CF6] hover:text-[#7c3aed] px-2 py-1 rounded-lg hover:bg-white dark:hover:bg-[#1E293B] transition-colors">
                    {copied === generated ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
              <button onClick={onClose}
                className="w-full h-10 rounded-xl border border-[#E2E8F0] dark:border-[#334155] text-sm font-semibold text-[#64748B] hover:border-[#8B5CF6] hover:text-[#8B5CF6] transition-all">
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ──────────────────────────────────────
function DeleteModal({
  row,
  onConfirm,
  onCancel,
  deleting,
  error,
}: {
  row:      InviteCodeRow;
  onConfirm: () => void;
  onCancel:  () => void;
  deleting:  boolean;
  error:     string | null;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={() => !deleting && onCancel()}>
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl p-6 w-full max-w-md border border-[#E2E8F0] dark:border-[#334155]"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[#FEE2E2] dark:bg-[#450a0a] flex items-center justify-center text-lg shrink-0">🗑️</div>
          <div>
            <h3 className="font-nunito font-extrabold text-base mb-1">Delete Invite Code?</h3>
            <p className="text-sm text-[#64748B] dark:text-[#94A3B8]">
              Code{" "}
              <code className="font-mono font-bold text-[#8B5CF6]">{row.code}</code>
              {row.label && <span> ({row.label})</span>}
              {" "}will be permanently removed.
            </p>
          </div>
        </div>
        {error && (
          <div className="mb-4 px-3.5 py-2.5 bg-[#FEE2E2] dark:bg-[#450a0a] border border-[#E05C5C]/30 rounded-xl text-sm text-[#E05C5C] font-semibold">
            {error}
          </div>
        )}
        <div className="flex gap-2">
          <button onClick={onConfirm} disabled={deleting}
            className="flex-1 py-2.5 rounded-xl text-sm font-extrabold font-nunito bg-[#E05C5C] hover:bg-[#c94b4b] text-white disabled:opacity-50 transition-colors">
            {deleting ? "Deleting…" : "Yes, Delete"}
          </button>
          <button onClick={onCancel} disabled={deleting}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-[#64748B] border border-[#E2E8F0] dark:border-[#334155] hover:border-[#8B5CF6] hover:text-[#8B5CF6] hover:bg-[#EDE9FE] dark:hover:bg-[#2e1065] transition-all">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Code Card ─────────────────────────────────────────────────
function CodeRow({
  row, onToggle, onDelete,
}: {
  row:      InviteCodeRow;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  const { copied, copy } = useCopy();
  const used = !!row.usedBy;

  return (
    <div className={cn(
      "bg-white dark:bg-[#1E293B] border rounded-2xl p-5 transition-all",
      used        ? "border-[#E2E8F0] dark:border-[#334155] opacity-70"
      : row.isActive ? "border-[#8B5CF6]/40 shadow-sm"
                  : "border-[#E2E8F0] dark:border-[#334155]"
    )}>
      <div className="flex items-start gap-4">
        <div className={cn("w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0",
          used ? "bg-[#3B82C4]" : row.isActive ? "bg-[#4A9B7F]" : "bg-[#64748B]")} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <code className="font-mono font-bold text-base tracking-widest text-[#8B5CF6]">{row.code}</code>
            {!used && (
              <button onClick={() => copy(row.code)}
                className="text-[11px] font-semibold text-[#8B5CF6] hover:text-[#7c3aed] px-2 py-0.5 rounded-lg hover:bg-[#EDE9FE] dark:hover:bg-[#1a0e35] transition-colors">
                {copied === row.code ? "Copied!" : "Copy"}
              </button>
            )}
          </div>
          {row.label && <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mb-1">{row.label}</p>}
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[#94A3B8]">
            <span>Created {row.createdAt}</span>
            {row.expiresAt && <span>Expires {row.expiresAt}</span>}
            {used && (
              <span className="text-[#3B82C4] font-semibold">
                Used by {row.usedBy} ({row.usedByEmail}) on {row.usedAt}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={cn("text-[10px] font-bold px-2.5 py-1 rounded-full border",
            used         ? "bg-[#DBEAFE] dark:bg-[#1e3a5f] text-[#3B82C4] border-[#3B82C4]"
            : row.isActive ? "bg-[#D1FAE5] dark:bg-[#064e35] text-[#4A9B7F] border-[#4A9B7F]"
                          : "bg-[#EEF2F8] dark:bg-[#162032] text-[#64748B] border-[#64748B]")}>
            {used ? "Used" : row.isActive ? "Active" : "Revoked"}
          </span>
          {!used && (
            <>
              <button onClick={() => onToggle(row.id)}
                title={row.isActive ? "Revoke" : "Re-activate"}
                className={cn("w-8 h-8 rounded-lg border text-sm transition-all",
                  row.isActive
                    ? "border-[#F59E0B]/40 text-[#F59E0B] hover:bg-[#FEF3C7] dark:hover:bg-[#3d2800]"
                    : "border-[#4A9B7F]/40 text-[#4A9B7F] hover:bg-[#D1FAE5] dark:hover:bg-[#064e35]")}>
                {row.isActive ? "⏸" : "▶"}
              </button>
              <button onClick={() => onDelete(row.id)}
                title="Delete"
                className="w-8 h-8 rounded-lg border border-[#E05C5C]/40 text-[#E05C5C] hover:bg-[#FEE2E2] dark:hover:bg-[#450a0a] text-sm transition-all">
                🗑
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Client ───────────────────────────────────────────────
export default function InviteCodesClient({
  codes: initialCodes,
}: {
  codes:   InviteCodeRow[];
  adminId: number;
}) {
  const router = useRouter();

  // ── Sidebar state ──────────────────────────────────────────
  const [adminUser,  setAdminUser]  = useState<AdminUser | null>(null);
  const [theme,      setTheme]      = useState<"light" | "dark">("light");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("admin-theme") as "light" | "dark" | null;
    if (saved) setTheme(saved);
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { if (d.success) setAdminUser(d.user); });
  }, []);

  function toggleTheme() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("admin-theme", next);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.push("/login"); router.refresh();
  }

  // ── Data state ─────────────────────────────────────────────
  const [codes,        setCodes]        = useState<InviteCodeRow[]>(initialCodes);
  const [showGenerate, setShowGenerate] = useState(false);
  const [filter,       setFilter]       = useState<"all" | "active" | "used" | "revoked">("all");

  // ── Delete modal state ─────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<InviteCodeRow | null>(null);
  const [deleting,     setDeleting]     = useState(false);
  const [deleteError,  setDeleteError]  = useState<string | null>(null);

  function handleCreated(row: InviteCodeRow) {
    setCodes((prev) => [row, ...prev]);
  }

  async function handleToggle(id: number) {
    const res  = await fetch(`/api/admin/invite-codes/${id}`, { method: "PATCH", credentials: "include" });
    const json = await res.json();
    if (json.success) {
      setCodes((prev) => prev.map((c) => c.id === id ? { ...c, isActive: json.isActive } : c));
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true); setDeleteError(null);
    const res  = await fetch(`/api/admin/invite-codes/${deleteTarget.id}`, { method: "DELETE", credentials: "include" });
    const json = await res.json();
    setDeleting(false);
    if (!json.success) { setDeleteError(json.error ?? "Delete failed."); return; }
    setCodes((prev) => prev.filter((c) => c.id !== deleteTarget.id));
    setDeleteTarget(null);
  }

  const filtered = codes.filter((c) => {
    if (filter === "active")  return c.isActive && !c.usedBy;
    if (filter === "used")    return !!c.usedBy;
    if (filter === "revoked") return !c.isActive && !c.usedBy;
    return true;
  });

  const activeCount  = codes.filter((c) => c.isActive && !c.usedBy).length;
  const usedCount    = codes.filter((c) => !!c.usedBy).length;
  const revokedCount = codes.filter((c) => !c.isActive && !c.usedBy).length;

  // ── Nav items ──────────────────────────────────────────────
  const navMain = [
    { icon: "🏠", label: "Overview", path: "/admin" },
    { icon: "👥", label: "Users",    path: "/admin#users" },
    { icon: "📦", label: "Modules",  path: "/admin#modules" },
    { icon: "🏫", label: "Sections", path: "/admin#sections" },
    { icon: "🏛️", label: "Schools",  path: "/admin#schools" },
    { icon: "⚙️", label: "System",   path: "/admin#system" },
  ];
  const navModels = [
    { icon: "🏷️", label: "Contexts",     path: "/admin/contexts" },
    { icon: "🔑", label: "Invite Codes", path: "/admin/invite-codes" },
    { icon: "📝", label: "Test Sets",    path: "/admin/test-sets" },
  ];

  // ── Sidebar JSX ────────────────────────────────────────────
  const SidebarContent = (
    <>
      <div className="px-6 pb-5 border-b border-[#E2E8F0] dark:border-white/10 mb-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#3B82C4] flex items-center justify-center text-white font-extrabold text-base font-nunito mb-2.5">A</div>
        <h2 className="font-nunito text-sm font-extrabold leading-snug dark:text-white">Think–Solve<br />–Reflect</h2>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-[11px] text-[#64748B] dark:text-white/50">Admin Panel</span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#EDE9FE] dark:bg-white/10 text-[#8B5CF6] border border-[#8B5CF6]/30">ADMIN</span>
        </div>
      </div>

      <div className="px-3.5 py-1 text-[10px] font-bold tracking-widest uppercase text-[#94A3B8] dark:text-white/40 mb-1">Dashboard</div>
      {navMain.map((n) => (
        <button key={n.path} onClick={() => { setMobileOpen(false); router.push(n.path); }}
          className="flex items-center gap-2.5 px-[18px] py-2.5 mx-2.5 rounded-xl text-sm font-medium text-[#64748B] dark:text-white/60 hover:bg-[#EEF2F8] dark:hover:bg-white/10 transition-all w-[calc(100%-20px)]">
          <span className="text-[17px] w-5 text-center shrink-0">{n.icon}</span>
          <span className="flex-1 text-left">{n.label}</span>
        </button>
      ))}

      <div className="px-3.5 py-1 mt-4 text-[10px] font-bold tracking-widest uppercase text-[#94A3B8] dark:text-white/40 mb-1">Models</div>
      {navModels.map((n) => (
        <button key={n.path} onClick={() => { setMobileOpen(false); router.push(n.path); }}
          className={cn(
            "flex items-center gap-2.5 px-[18px] py-2.5 mx-2.5 rounded-xl text-sm font-medium transition-all w-[calc(100%-20px)]",
            n.path === "/admin/invite-codes"
              ? "bg-[#EDE9FE] dark:bg-white/15 text-[#8B5CF6] dark:text-white font-bold"
              : "text-[#64748B] dark:text-white/60 hover:bg-[#EEF2F8] dark:hover:bg-white/10"
          )}>
          <span className="text-[17px] w-5 text-center shrink-0">{n.icon}</span>
          <span className="flex-1 text-left">{n.label}</span>
        </button>
      ))}

      <div className="px-3.5 py-1 mt-4 text-[10px] font-bold tracking-widest uppercase text-[#94A3B8] dark:text-white/40 mb-1">App Views</div>
      <button onClick={() => { setMobileOpen(false); router.push("/admin/application-flow"); }}
        className="flex items-center gap-2.5 px-[18px] py-2.5 mx-2.5 rounded-xl text-sm font-medium text-[#64748B] dark:text-white/60 hover:bg-[#EEF2F8] dark:hover:bg-white/10 transition-all w-[calc(100%-20px)]">
        <span className="text-[17px] w-5 text-center shrink-0">🗺️</span>
        <span className="flex-1 text-left">Application Workflow</span>
      </button>

      <div className="mt-auto pt-4 border-t border-[#E2E8F0] dark:border-white/10 px-3.5 flex flex-col gap-2">
        <button onClick={toggleTheme}
          className={cn("flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs font-bold transition-all border",
            theme === "dark" ? "bg-white/10 text-white hover:bg-white/20 border-white/20" : "bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0] border-[#E2E8F0]")}>
          <span className="text-base leading-none">{theme === "dark" ? "☀️" : "🌙"}</span>
          <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
          <span className={cn("ml-auto w-9 h-5 rounded-full relative shrink-0 transition-colors overflow-hidden", theme === "dark" ? "bg-[#8B5CF6]" : "bg-[#CBD5E1]")}>
            <span className={cn("absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200", theme === "dark" ? "translate-x-4" : "translate-x-0")} />
          </span>
        </button>
        {adminUser && (
          <div className="flex items-center gap-2.5 p-2.5 rounded-xl">
            <div className="w-9 h-9 rounded-full bg-[#EDE9FE] dark:bg-white/10 flex items-center justify-center text-[#8B5CF6] dark:text-white text-sm font-extrabold font-nunito shrink-0">
              {initials(adminUser.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold truncate dark:text-white">{adminUser.name}</p>
              <p className="text-[11px] text-[#64748B] dark:text-white/50 truncate">{adminUser.email}</p>
            </div>
          </div>
        )}
        <div className="flex justify-end pr-1 -mt-1">
          <button onClick={logout}
            className="text-xs text-[#64748B] dark:text-white/50 hover:text-[#E05C5C] font-semibold px-2 py-1 rounded-lg hover:bg-[#FEE2E2] dark:hover:bg-[#450a0a] transition-colors">
            Sign out
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      <style>{`.font-nunito { font-family: var(--font-nunito,'Nunito',sans-serif); }`}</style>

      {/* ── Delete confirmation modal ── */}
      {deleteTarget && (
        <DeleteModal
          row={deleteTarget}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
          deleting={deleting}
          error={deleteError}
        />
      )}

      {/* ── Layout ── */}
      <div className={cn("flex min-h-screen bg-[#F5F7FA] text-[#1E293B] font-nunito", theme === "dark" && "dark")}
        style={theme === "dark" ? { background: "#000", color: "#fff" } : undefined}>

        {/* Desktop sidebar */}
        <aside className="hidden md:flex w-[240px] min-h-screen bg-white dark:bg-black border-r border-[#E2E8F0] dark:border-white/10 flex-col py-7 shrink-0 sticky top-0 h-screen overflow-y-auto">
          {SidebarContent}
        </aside>

        {/* Mobile top bar */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-30 h-14 bg-white dark:bg-black border-b border-[#E2E8F0] dark:border-white/10 flex items-center px-4 gap-3 shadow-sm">
          <button onClick={() => setMobileOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#EEF2F8] dark:bg-white/10 border border-[#E2E8F0] dark:border-white/20 text-[#64748B] dark:text-white">
            <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
              <rect y="0"  width="18" height="2" rx="1" fill="currentColor"/>
              <rect y="6"  width="14" height="2" rx="1" fill="currentColor"/>
              <rect y="12" width="18" height="2" rx="1" fill="currentColor"/>
            </svg>
          </button>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#3B82C4] flex items-center justify-center text-white font-extrabold text-sm font-nunito shrink-0">A</div>
          <p className="font-nunito text-[13px] font-extrabold truncate flex-1 dark:text-white">Invite Codes</p>
        </div>

        {/* Mobile drawer */}
        {mobileOpen && (
          <>
            <div className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
            <aside className="md:hidden fixed top-0 left-0 z-50 h-full w-[240px] bg-white dark:bg-black border-r border-[#E2E8F0] dark:border-white/10 flex flex-col py-7 overflow-y-auto"
              style={{ animation: "slideIn .26s cubic-bezier(.34,1.1,.64,1) both" }}>
              <style>{`@keyframes slideIn{from{transform:translateX(-100%)}to{transform:translateX(0)}}`}</style>
              {SidebarContent}
            </aside>
          </>
        )}

        {/* Main content */}
        <div className="flex-1 min-w-0 flex flex-col">

          {/* Page header */}
          <div className="sticky top-0 z-20 bg-white dark:bg-black border-b border-[#E2E8F0] dark:border-white/10 px-6 h-14 flex items-center gap-3 shadow-sm mt-14 md:mt-0">
            <div>
              <p className="text-[10px] font-bold tracking-widest uppercase text-[#8B5CF6]">Admin · Teachers</p>
              <h1 className="font-nunito font-extrabold text-base leading-tight dark:text-white">🔑 Teacher Invite Codes</h1>
            </div>
            <button onClick={() => setShowGenerate(true)}
              className="ml-auto flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7c3aed] text-white text-xs font-bold shadow-sm transition-all">
              + Generate Code
            </button>
          </div>

          <div className="p-6 space-y-6 flex-1">

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Active",  value: activeCount,  color: "#4A9B7F", bg: "bg-[#D1FAE5] dark:bg-[#064e35]", icon: "✅" },
                { label: "Used",    value: usedCount,    color: "#3B82C4", bg: "bg-[#DBEAFE] dark:bg-[#1e3a5f]", icon: "👤" },
                { label: "Revoked", value: revokedCount, color: "#64748B", bg: "bg-[#EEF2F8] dark:bg-[#162032]",  icon: "⏸" },
              ].map((s) => (
                <div key={s.label} className="bg-white dark:bg-[#111] border border-[#E2E8F0] dark:border-white/10 rounded-2xl p-5 relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: s.color }} />
                  <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center text-sm mb-2", s.bg)}>{s.icon}</div>
                  <div className="font-nunito text-2xl font-extrabold dark:text-white">{s.value}</div>
                  <div className="text-xs text-[#64748B] dark:text-[#94A3B8]">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 flex-wrap">
              {(["all", "active", "used", "revoked"] as const).map((f) => (
                <button key={f} onClick={() => setFilter(f)}
                  className={cn("px-4 py-1.5 rounded-full text-xs font-bold transition-all capitalize",
                    filter === f
                      ? "bg-[#8B5CF6] text-white"
                      : "bg-white dark:bg-[#111] border border-[#E2E8F0] dark:border-white/10 text-[#64748B] hover:border-[#8B5CF6] hover:text-[#8B5CF6]")}>
                  {f === "all" ? `All (${codes.length})` : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            {/* Code list */}
            {filtered.length === 0 ? (
              <div className="text-center py-16 text-[#64748B] dark:text-[#94A3B8]">
                <div className="text-4xl mb-3">🔑</div>
                <p className="font-semibold">No codes yet</p>
                <p className="text-sm mt-1">Generate a code and share it with a teacher to let them register.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((row) => (
                  <CodeRow
                    key={row.id}
                    row={row}
                    onToggle={handleToggle}
                    onDelete={(id) => {
                      const target = codes.find((c) => c.id === id);
                      if (target) { setDeleteTarget(target); setDeleteError(null); }
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Generate modal */}
      {showGenerate && (
        <GenerateModal
          onClose={() => setShowGenerate(false)}
          onCreated={handleCreated}
        />
      )}
    </>
  );
}
