import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-2 h-4 w-72" />
      </div>

      {/* Two-column layout */}
      <div className="grid items-start gap-8 lg:grid-cols-[1fr_360px]">
        {/* Left column */}
        <div className="space-y-8">
          {/* Portfolio Health */}
          <div className="rounded-2xl border border-slate-200/60 bg-white p-6">
            <div className="flex items-baseline gap-2">
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-5 w-24" />
            </div>
            <Skeleton className="mt-2 h-4 w-64" />
            <div className="mt-5 flex flex-wrap gap-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-28 rounded-full" />
              ))}
            </div>
          </div>

          {/* Action queue */}
          <div className="rounded-2xl border border-slate-200/60 bg-white">
            <div className="px-6 py-5">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <Skeleton className="h-5 w-40" />
              </div>
            </div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 border-t border-slate-100 px-6 py-4">
                <Skeleton className="h-2.5 w-2.5 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}
          </div>

          {/* Properties */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-2xl border border-slate-200/60 bg-white p-5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="mt-2 h-3 w-24" />
                  <Skeleton className="mt-4 h-1.5 w-full rounded-full" />
                  <Skeleton className="mt-3 h-3 w-20" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-slate-200/60 bg-white p-5">
              <div className="flex items-center gap-2.5 mb-4">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <Skeleton className="h-4 w-28" />
              </div>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="mt-2 h-3 w-32" />
            </div>
          ))}

          {/* Activity */}
          <div className="rounded-2xl border border-slate-200/60 bg-white p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-4 w-28" />
            </div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-3 py-2.5">
                <Skeleton className="h-7 w-7 rounded-lg" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-2 w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
