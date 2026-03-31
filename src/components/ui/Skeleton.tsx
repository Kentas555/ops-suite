/** Skeleton primitives with shimmer animation */

export function SkeletonLine({ width = '100%', height = 12 }: { width?: string | number; height?: number }) {
  return <div className="skeleton-shimmer rounded" style={{ width, height, minHeight: height }} />;
}


export function SkeletonBlock({ height = 80, className = '' }: { height?: number; className?: string }) {
  return <div className={`skeleton-shimmer rounded-lg ${className}`} style={{ height }} />;
}

/* ── Page-specific skeletons ── */

export function DashboardSkeleton() {
  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Date + stats */}
      <div>
        <SkeletonLine width={180} height={14} />
        <div className="flex items-center gap-6 mt-3">
          <div className="flex items-center gap-2"><SkeletonLine width={32} height={28} /><SkeletonLine width={90} height={12} /></div>
          <div className="flex items-center gap-2"><SkeletonLine width={32} height={28} /><SkeletonLine width={90} height={12} /></div>
        </div>
      </div>
      {/* Focus area */}
      <SkeletonBlock height={140} className="border border-slate-200 dark:border-slate-700" />
      {/* Today section */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-4 py-2.5 flex items-center justify-between" style={{ background: 'var(--surface-1)' }}>
          <SkeletonLine width={140} height={11} />
          <SkeletonLine width={50} height={11} />
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="px-4 py-3 flex items-center gap-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="flex-1 space-y-1.5"><SkeletonLine width="70%" height={13} /><SkeletonLine width="40%" height={10} /></div>
            <SkeletonLine width={52} height={18} />
          </div>
        ))}
      </div>
      {/* Tomorrow section */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-4 py-2.5" style={{ background: 'var(--surface-1)' }}><SkeletonLine width={120} height={11} /></div>
        <div className="px-4 py-3 flex items-center gap-3"><div className="flex-1 space-y-1.5"><SkeletonLine width="60%" height={13} /><SkeletonLine width="35%" height={10} /></div></div>
      </div>
      {/* Clients section */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-4 py-2.5" style={{ background: 'var(--surface-1)' }}><SkeletonLine width={180} height={11} /></div>
        {[1, 2].map(i => (
          <div key={i} className="px-4 py-3 flex items-center gap-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="flex-1 space-y-1.5"><SkeletonLine width="50%" height={13} /><SkeletonLine width="65%" height={10} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TableSkeleton({ columns = 5, rows = 6 }: { columns?: number; rows?: number }) {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <SkeletonLine width={160} height={24} />
        <SkeletonLine width={120} height={36} />
      </div>
      <div className="flex items-center gap-3 mb-4">
        <SkeletonLine width={240} height={36} />
        <SkeletonLine width={130} height={36} />
      </div>
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border-default)', background: 'var(--surface-0)' }}>
        <div className="flex gap-4 px-4 py-3 border-b" style={{ borderColor: 'var(--border-default)', background: 'var(--surface-1)' }}>
          {Array.from({ length: columns }).map((_, i) => <SkeletonLine key={i} width={i === 0 ? '25%' : '15%'} height={10} />)}
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
            {Array.from({ length: columns }).map((_, j) => <SkeletonLine key={j} width={j === 0 ? '25%' : '15%'} height={12} />)}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <SkeletonLine width={160} height={24} />
        <SkeletonLine width={120} height={36} />
      </div>
      <div className="flex items-center gap-3 mb-4">
        <SkeletonLine width={200} height={36} />
        <SkeletonLine width={100} height={36} />
      </div>
      <div className="space-y-2">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="rounded-lg border px-4 py-3 flex items-center gap-3" style={{ borderColor: 'var(--border-default)', background: 'var(--surface-0)' }}>
            <div className="flex-1 space-y-1.5"><SkeletonLine width="55%" height={14} /><SkeletonLine width="80%" height={10} /></div>
            <SkeletonLine width={60} height={20} />
            <SkeletonLine width={70} height={12} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function KanbanSkeleton() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <SkeletonLine width={100} height={24} />
        <SkeletonLine width={120} height={36} />
      </div>
      <div className="flex items-center gap-3 mb-4">
        <SkeletonLine width={200} height={36} />
        <SkeletonLine width={100} height={30} />
        <SkeletonLine width={100} height={30} />
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(col => (
          <div key={col} className="rounded-lg p-3 space-y-2" style={{ background: 'var(--surface-1)' }}>
            <SkeletonLine width={80} height={12} />
            {Array.from({ length: col === 1 ? 3 : 2 }).map((_, i) => (
              <div key={i} className="rounded-lg border p-3 space-y-1.5" style={{ borderColor: 'var(--border-default)', background: 'var(--surface-0)' }}>
                <SkeletonLine width="80%" height={13} />
                <SkeletonLine width="50%" height={10} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
