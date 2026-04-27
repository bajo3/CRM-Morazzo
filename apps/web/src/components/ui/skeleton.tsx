import { cn } from "../../lib/cn";

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-stone-100", className)} />;
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-panel">
      <div className="bg-stone-50 px-4 py-3">
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="divide-y divide-stone-100">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4 px-4 py-3">
            {Array.from({ length: cols }).map((_, j) => (
              <Skeleton key={j} className={cn("h-5", j === 0 ? "w-40" : j === cols - 1 ? "w-20" : "w-28")} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="rounded-[28px] border border-line bg-white p-5 shadow-panel">
      <Skeleton className="mb-4 h-6 w-36" />
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className={cn("h-10", i % 2 === 0 ? "w-full" : "w-4/5")} />
        ))}
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-[28px] border border-line bg-white p-5 shadow-panel">
      <Skeleton className="mb-2 h-3 w-20" />
      <Skeleton className="h-8 w-28" />
    </div>
  );
}
