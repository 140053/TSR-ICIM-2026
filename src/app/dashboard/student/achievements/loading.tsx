export default function AchievementsLoading() {
  return (
    <div className="min-h-screen bg-[#F5F7FA] dark:bg-[#0F172A]">
      {/* Top bar skeleton */}
      <div className="sticky top-0 z-30 bg-white dark:bg-[#1E293B] border-b border-[#E2E8F0] dark:border-[#334155] shadow-sm px-6 py-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-[#F1F5F9] dark:bg-[#334155] animate-pulse" />
        <div className="space-y-1.5">
          <div className="h-4 w-28 bg-[#F1F5F9] dark:bg-[#334155] rounded animate-pulse" />
          <div className="h-3 w-20 bg-[#F1F5F9] dark:bg-[#334155] rounded animate-pulse" />
        </div>
      </div>

      <div className="px-6 py-8 max-w-2xl mx-auto space-y-6">
        {/* Hero skeleton */}
        <div className="h-24 rounded-2xl bg-[#F1F5F9] dark:bg-[#1E293B] animate-pulse" />
        {/* XP bar */}
        <div className="h-3 rounded-full bg-[#F1F5F9] dark:bg-[#1E293B] animate-pulse -mt-2" />
        {/* Stats row */}
        <div className="grid grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-[#F1F5F9] dark:bg-[#1E293B] animate-pulse" />
          ))}
        </div>
        {/* Filter chips */}
        <div className="flex gap-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-8 w-20 rounded-full bg-[#F1F5F9] dark:bg-[#1E293B] animate-pulse" />
          ))}
        </div>
        {/* Badge grid */}
        <div className="grid grid-cols-3 gap-3">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="h-36 rounded-2xl bg-[#F1F5F9] dark:bg-[#1E293B] animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
