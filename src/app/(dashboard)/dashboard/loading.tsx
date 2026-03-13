import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Portfolio Health Bar */}
      <div className="rounded-xl border bg-white p-5 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-baseline gap-2">
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-6 w-24" />
            </div>
            <Skeleton className="mt-2 h-4 w-64" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24 rounded-md" />
            <Skeleton className="h-9 w-28 rounded-md" />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-8 w-28 rounded-full" />
          ))}
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_380px]">
        {/* Left column */}
        <div className="space-y-6">
          {/* Properties grid */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="mt-1 h-3 w-24" />
                    <Skeleton className="mt-3 h-1.5 w-full rounded-full" />
                    <Skeleton className="mt-2 h-3 w-20" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Action queue */}
          <Card>
            <CardContent className="space-y-3 p-5">
              <Skeleton className="h-4 w-36" />
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Activity feed */}
          <Card>
            <CardContent className="space-y-3 p-5">
              <Skeleton className="h-4 w-28" />
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex gap-3 py-2">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-2 w-16" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick stats */}
          <Card>
            <CardContent className="p-5">
              <Skeleton className="h-4 w-24" />
              <div className="mt-3 grid grid-cols-2 gap-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="rounded-lg bg-slate-50 p-3">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="mt-2 h-6 w-8" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming expirations */}
          <Card>
            <CardContent className="p-5">
              <Skeleton className="h-4 w-40" />
              <div className="mt-3 space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="rounded-lg p-2">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="mt-1 h-2 w-24" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
