// src/components/LoadingSkeleton.tsx
// Skeleton shells for all async data pages. Each export matches one route family.

import { Skeleton } from "@/components/ui/skeleton";

// ─── Shared primitives ────────────────────────────────────────

function SidebarShell({ accent }: { accent: "blue" | "green" }) {
  const activeBg = accent === "blue" ? "#DBEAFE" : "#D1FAE5";
  const activeColor = accent === "blue" ? "#3B82C4" : "#4A9B7F";
  return (
    <aside
      className="hidden md:flex flex-col shrink-0 border-r border-[#E2E8F0] dark:border-[#2D3F55] bg-white dark:bg-[#1E293B]"
      style={{ width: 240 }}
    >
      {/* Logo */}
      <div className="h-[64px] flex items-center gap-3 px-5 border-b border-[#E2E8F0] dark:border-[#2D3F55]">
        <Skeleton className="w-9 h-9 rounded-xl" />
        <Skeleton className="h-4 w-24 rounded-md" />
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-3 flex flex-col gap-1">
        {/* First item "active" */}
        <div
          className="mx-2.5 px-4 py-2.5 rounded-xl flex items-center gap-2.5"
          style={{ background: activeBg }}
        >
          <Skeleton className="w-5 h-5 rounded" style={{ background: `${activeColor}40` }} />
          <Skeleton className="h-3.5 w-24 rounded" style={{ background: `${activeColor}40` }} />
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="mx-2.5 px-4 py-2.5 rounded-xl flex items-center gap-2.5">
            <Skeleton className="w-5 h-5 rounded" />
            <Skeleton className="h-3.5 rounded" style={{ width: `${60 + i * 8}px` }} />
          </div>
        ))}
      </nav>

      {/* User card */}
      <div className="border-t border-[#E2E8F0] dark:border-[#2D3F55] p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
          <div className="flex-1 min-w-0 flex flex-col gap-1.5">
            <Skeleton className="h-3.5 w-28 rounded" />
            <Skeleton className="h-3 w-20 rounded" />
          </div>
        </div>
      </div>
    </aside>
  );
}

function MobileTopbarShell() {
  return (
    <header className="md:hidden h-14 border-b border-[#E2E8F0] dark:border-[#2D3F55] bg-white dark:bg-[#1E293B] flex items-center gap-3 px-4 shrink-0">
      <Skeleton className="w-8 h-8 rounded-xl" />
      <Skeleton className="h-4 w-32 rounded" />
      <div className="flex-1" />
      <Skeleton className="w-8 h-8 rounded-full" />
    </header>
  );
}

// ─── Card rows (generic content shimmer) ─────────────────────

function ContentCards({ rows = 3, tall = false }: { rows?: number; tall?: boolean }) {
  return (
    <div className="flex flex-col gap-4">
      {[...Array(rows)].map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#2D3F55] rounded-2xl p-5 flex flex-col gap-3"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
            <div className="flex-1 flex flex-col gap-2">
              <Skeleton className="h-4 w-48 rounded" />
              <Skeleton className="h-3 w-32 rounded" />
            </div>
            <Skeleton className="h-7 w-20 rounded-full shrink-0" />
          </div>
          {tall && (
            <>
              <Skeleton className="h-2.5 w-full rounded-full" />
              <div className="flex gap-2">
                {[...Array(4)].map((_, j) => (
                  <Skeleton key={j} className="h-6 flex-1 rounded-lg" />
                ))}
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

function StatCards() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#2D3F55] rounded-2xl p-4 flex flex-col gap-2"
        >
          <Skeleton className="w-8 h-8 rounded-lg" />
          <Skeleton className="h-6 w-14 rounded" />
          <Skeleton className="h-3 w-20 rounded" />
        </div>
      ))}
    </div>
  );
}

// ─── STUDENT layout ───────────────────────────────────────────

export function StudentPageSkeleton() {
  return (
    <div className="flex h-screen bg-[#F5F7FA] dark:bg-[#0F172A] overflow-hidden">
      <SidebarShell accent="blue" />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <MobileTopbarShell />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* Page header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-7 w-48 rounded-lg" />
              <Skeleton className="h-4 w-64 rounded" />
            </div>
            <Skeleton className="h-10 w-32 rounded-xl" />
          </div>
          <StatCards />
          <ContentCards rows={3} tall />
        </main>
      </div>
    </div>
  );
}

// ─── STUDENT MODULES list ────────────────────────────────────

export function StudentModulesSkeleton() {
  return (
    <div className="flex h-screen bg-[#F5F7FA] dark:bg-[#0F172A] overflow-hidden">
      <SidebarShell accent="blue" />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <MobileTopbarShell />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <Skeleton className="h-7 w-36 rounded-lg" />
            <Skeleton className="h-9 w-28 rounded-xl" />
          </div>
          {/* Module cards */}
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="mb-4 bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#2D3F55] rounded-2xl overflow-hidden"
            >
              {/* Card header */}
              <div className="px-5 py-4 flex items-center gap-4 border-b border-[#E2E8F0] dark:border-[#2D3F55]">
                <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
                <div className="flex-1 flex flex-col gap-2">
                  <Skeleton className="h-4 w-52 rounded" />
                  <Skeleton className="h-3 w-36 rounded" />
                </div>
                <Skeleton className="h-7 w-24 rounded-full shrink-0" />
              </div>
              {/* Pip bar */}
              <div className="px-5 py-3 flex gap-1">
                {[...Array(12)].map((_, j) => (
                  <Skeleton key={j} className="flex-1 h-2 rounded-full" />
                ))}
              </div>
              {/* Phases */}
              <div className="px-5 pb-4 grid grid-cols-4 gap-2">
                {[...Array(4)].map((_, j) => (
                  <Skeleton key={j} className="h-12 rounded-xl" />
                ))}
              </div>
            </div>
          ))}
        </main>
      </div>
    </div>
  );
}

// ─── STAGE PLAYER ─────────────────────────────────────────────

export function StagePlayerSkeleton() {
  return (
    <div className="min-h-screen bg-[#F5F7FA] dark:bg-[#0F172A] flex flex-col">
      {/* Topbar */}
      <header className="h-[60px] bg-white dark:bg-[#1E293B] border-b border-[#E2E8F0] dark:border-[#2D3F55] px-4 flex items-center gap-3 shrink-0">
        <Skeleton className="w-8 h-8 rounded-xl" />
        <Skeleton className="w-8 h-8 rounded-lg" />
        <div className="flex-1 flex flex-col gap-1.5">
          <Skeleton className="h-3.5 w-40 rounded" />
          <Skeleton className="h-3 w-28 rounded" />
        </div>
        <Skeleton className="h-8 w-16 rounded-xl" />
      </header>

      {/* Pip tracker */}
      <div className="bg-white dark:bg-[#1E293B] border-b border-[#E2E8F0] dark:border-[#2D3F55] px-5 py-3 flex items-center gap-3">
        <div className="flex gap-[3px] flex-1">
          {[...Array(12)].map((_, i) => (
            <Skeleton key={i} className="flex-1 h-[6px] rounded-full" />
          ))}
        </div>
        <div className="flex flex-col gap-1.5 items-end shrink-0">
          <Skeleton className="h-3.5 w-20 rounded" />
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>
      </div>

      {/* Scenario banner */}
      <div className="mx-4 mt-4 rounded-xl border border-[#E2E8F0] dark:border-[#2D3F55] bg-white dark:bg-[#1E293B] p-4 flex gap-3">
        <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
        <div className="flex-1 flex flex-col gap-2">
          <Skeleton className="h-3 w-full rounded" />
          <Skeleton className="h-3 w-4/5 rounded" />
        </div>
      </div>

      {/* Stage card */}
      <div className="mx-4 mt-4 mb-2 bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#2D3F55] rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#E2E8F0] dark:border-[#2D3F55] flex gap-4 bg-[#F8FAFC] dark:bg-[#162032]">
          <Skeleton className="w-11 h-11 rounded-full shrink-0" />
          <div className="flex-1 flex flex-col gap-2">
            <Skeleton className="h-5 w-56 rounded" />
            <Skeleton className="h-3.5 w-80 rounded" />
            <Skeleton className="h-3.5 w-64 rounded" />
          </div>
        </div>
        {/* Body */}
        <div className="px-6 py-7 flex flex-col gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      </div>

      {/* Footer nav */}
      <div className="sticky bottom-0 bg-white dark:bg-[#1E293B] border-t border-[#E2E8F0] dark:border-[#2D3F55] px-4 py-3 flex items-center justify-between">
        <Skeleton className="h-10 w-28 rounded-xl" />
        <Skeleton className="h-10 w-40 rounded-xl" />
      </div>
    </div>
  );
}

// ─── STUDENT REPORT list ─────────────────────────────────────

export function StudentReportsSkeleton() {
  return (
    <div className="flex h-screen bg-[#F5F7FA] dark:bg-[#0F172A] overflow-hidden">
      <SidebarShell accent="blue" />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <MobileTopbarShell />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Skeleton className="h-7 w-44 rounded-lg mb-5" />
          <ContentCards rows={4} tall />
        </main>
      </div>
    </div>
  );
}

// ─── SINGLE DIAGNOSTIC REPORT ─────────────────────────────────

export function DiagnosticReportSkeleton() {
  return (
    <div className="min-h-screen bg-[#F5F7FA] dark:bg-[#0F172A] p-4 sm:p-6">
      {/* Back + header */}
      <div className="mb-5 flex items-center gap-3">
        <Skeleton className="w-9 h-9 rounded-xl" />
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-6 w-52 rounded-lg" />
          <Skeleton className="h-3.5 w-36 rounded" />
        </div>
      </div>
      {/* Overall score card */}
      <div className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#2D3F55] rounded-2xl p-6 mb-5 flex flex-col gap-4">
        <Skeleton className="h-5 w-32 rounded" />
        <div className="flex gap-4">
          <Skeleton className="w-24 h-24 rounded-full shrink-0" />
          <div className="flex-1 flex flex-col gap-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-4 w-full rounded" />
            ))}
          </div>
        </div>
      </div>
      {/* Cluster cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#2D3F55] rounded-2xl p-5 flex flex-col gap-3"
          >
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-3 w-full rounded-full" />
            <div className="flex justify-between">
              <Skeleton className="h-3 w-16 rounded" />
              <Skeleton className="h-3 w-12 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── STUDENT PROFILE ─────────────────────────────────────────

export function StudentProfileSkeleton() {
  return (
    <div className="min-h-screen bg-[#F5F7FA] dark:bg-[#0F172A] flex flex-col">
      {/* Topbar */}
      <header className="h-[60px] bg-white dark:bg-[#1E293B] border-b border-[#E2E8F0] dark:border-[#2D3F55] px-4 flex items-center gap-3">
        <Skeleton className="w-9 h-9 rounded-xl" />
        <Skeleton className="h-4 w-32 rounded" />
      </header>
      <main className="flex-1 max-w-2xl mx-auto w-full p-4 sm:p-6 flex flex-col gap-5">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-3 py-6">
          <Skeleton className="w-24 h-24 rounded-2xl" />
          <Skeleton className="h-6 w-40 rounded-lg" />
          <Skeleton className="h-4 w-28 rounded" />
        </div>
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#2D3F55] rounded-2xl p-4 flex flex-col gap-2">
              <Skeleton className="h-6 w-12 rounded" />
              <Skeleton className="h-3 w-16 rounded" />
            </div>
          ))}
        </div>
        {/* Forms */}
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#2D3F55] rounded-2xl p-5 flex flex-col gap-3">
            <Skeleton className="h-5 w-36 rounded" />
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-32 rounded-xl" />
          </div>
        ))}
      </main>
    </div>
  );
}

// ─── TEACHER layout ───────────────────────────────────────────

export function TeacherPageSkeleton() {
  return (
    <div className="flex h-screen bg-[#F5F7FA] dark:bg-[#0F172A] overflow-hidden">
      <SidebarShell accent="green" />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <MobileTopbarShell />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-7 w-48 rounded-lg" />
              <Skeleton className="h-4 w-64 rounded" />
            </div>
            <Skeleton className="h-10 w-32 rounded-xl" />
          </div>
          <StatCards />
          <ContentCards rows={4} />
        </main>
      </div>
    </div>
  );
}

// ─── TEACHER REPORTS ─────────────────────────────────────────

export function TeacherReportsSkeleton() {
  return (
    <div className="flex h-screen bg-[#F5F7FA] dark:bg-[#0F172A] overflow-hidden">
      <SidebarShell accent="green" />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <MobileTopbarShell />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* Section tabs */}
          <div className="flex gap-2 mb-5">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-9 w-28 rounded-xl" />
            ))}
          </div>
          {/* Heatmap placeholder */}
          <div className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#2D3F55] rounded-2xl p-5 mb-4">
            <div className="flex items-center gap-3 mb-4">
              <Skeleton className="h-5 w-40 rounded" />
              <div className="flex-1" />
              <Skeleton className="h-8 w-32 rounded-xl" />
            </div>
            {/* Table header */}
            <div className="grid grid-cols-6 gap-2 mb-2">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-7 rounded-lg" />
              ))}
            </div>
            {/* Table rows */}
            {[...Array(5)].map((_, i) => (
              <div key={i} className="grid grid-cols-6 gap-2 mb-2">
                {[...Array(6)].map((_, j) => (
                  <Skeleton key={j} className="h-10 rounded-lg" />
                ))}
              </div>
            ))}
          </div>
          {/* Intervention list */}
          <ContentCards rows={3} />
        </main>
      </div>
    </div>
  );
}

// ─── TEACHER MODULES ─────────────────────────────────────────

export function TeacherModulesSkeleton() {
  return (
    <div className="flex h-screen bg-[#F5F7FA] dark:bg-[#0F172A] overflow-hidden">
      <SidebarShell accent="green" />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <MobileTopbarShell />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* Tabs */}
          <div className="flex gap-2 mb-5">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-9 w-28 rounded-xl" />
            ))}
          </div>
          <ContentCards rows={4} tall />
        </main>
      </div>
    </div>
  );
}

// ─── TEACHER STUDENTS ────────────────────────────────────────

export function TeacherStudentsSkeleton() {
  return (
    <div className="flex h-screen bg-[#F5F7FA] dark:bg-[#0F172A] overflow-hidden">
      <SidebarShell accent="green" />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <MobileTopbarShell />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <Skeleton className="h-7 w-36 rounded-lg" />
            <Skeleton className="h-9 w-28 rounded-xl" />
          </div>
          {/* Student table */}
          <div className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#2D3F55] rounded-2xl overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-5 gap-4 px-5 py-3 border-b border-[#E2E8F0] dark:border-[#2D3F55] bg-[#F8FAFC] dark:bg-[#162032]">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-4 rounded" />
              ))}
            </div>
            {/* Table rows */}
            {[...Array(6)].map((_, i) => (
              <div key={i} className="grid grid-cols-5 gap-4 items-center px-5 py-4 border-b border-[#E2E8F0] dark:border-[#2D3F55] last:border-0">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                  <Skeleton className="h-3.5 w-24 rounded" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-3.5 w-12 rounded" />
                <Skeleton className="h-8 w-20 rounded-xl" />
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

// ─── TEACHER STUDENT DETAIL ───────────────────────────────────

export function TeacherStudentDetailSkeleton() {
  return (
    <div className="flex h-screen bg-[#F5F7FA] dark:bg-[#0F172A] overflow-hidden">
      <SidebarShell accent="green" />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <MobileTopbarShell />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* Back + student header */}
          <div className="flex items-center gap-3 mb-6">
            <Skeleton className="w-9 h-9 rounded-xl" />
            <Skeleton className="w-12 h-12 rounded-2xl" />
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-5 w-40 rounded" />
              <Skeleton className="h-3.5 w-28 rounded" />
            </div>
          </div>
          <StatCards />
          {/* Response cards */}
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="mb-4 bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#2D3F55] rounded-2xl p-5 flex flex-col gap-3"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
                <Skeleton className="h-4 w-48 rounded" />
                <div className="flex-1" />
                <Skeleton className="h-7 w-16 rounded-full" />
              </div>
              <Skeleton className="h-16 w-full rounded-xl" />
              <div className="flex gap-2">
                <Skeleton className="h-9 flex-1 rounded-xl" />
                <Skeleton className="h-9 w-24 rounded-xl" />
              </div>
            </div>
          ))}
        </main>
      </div>
    </div>
  );
}

// ─── TEACHER PROFILE ─────────────────────────────────────────

export function TeacherProfileSkeleton() {
  return (
    <div className="flex h-screen bg-[#F5F7FA] dark:bg-[#0F172A] overflow-hidden">
      <SidebarShell accent="green" />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <MobileTopbarShell />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-2xl">
          {/* Avatar banner */}
          <div className="flex flex-col items-center gap-3 py-6 mb-4">
            <Skeleton className="w-20 h-20 rounded-2xl" />
            <Skeleton className="h-6 w-44 rounded-lg" />
            <Skeleton className="h-4 w-32 rounded" />
          </div>
          {/* Forms */}
          {[...Array(2)].map((_, i) => (
            <div key={i} className="mb-4 bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#2D3F55] rounded-2xl p-5 flex flex-col gap-3">
              <Skeleton className="h-5 w-40 rounded" />
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-32 rounded-xl" />
            </div>
          ))}
        </main>
      </div>
    </div>
  );
}
