export function PostSkeleton() {
  return (
    <div className="card animate-pulse space-y-3 p-5">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-slate-700" />
        <div className="space-y-2">
          <div className="h-3 w-28 rounded bg-slate-700" />
          <div className="h-2.5 w-16 rounded bg-slate-700/70" />
        </div>
      </div>
      <div className="h-4 w-3/4 rounded bg-slate-700" />
      <div className="space-y-2">
        <div className="h-3 w-full rounded bg-slate-700/70" />
        <div className="h-3 w-11/12 rounded bg-slate-700/70" />
        <div className="h-3 w-2/3 rounded bg-slate-700/70" />
      </div>
    </div>
  );
}

export function FeedSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-4" aria-busy="true">
      {Array.from({ length: count }, (_, i) => (
        <PostSkeleton key={i} />
      ))}
    </div>
  );
}

export function SidebarSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      {[140, 190, 120].map((h, i) => (
        <div key={i} className="card animate-pulse p-4" style={{ height: h }}>
          <div className="mb-4 h-3 w-24 rounded bg-slate-700" />
          <div className="space-y-2">
            <div className="h-3 w-full rounded bg-slate-700/70" />
            <div className="h-3 w-5/6 rounded bg-slate-700/70" />
          </div>
        </div>
      ))}
    </div>
  );
}
