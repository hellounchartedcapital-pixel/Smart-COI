import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

export default function SettingsLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Organization section */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-9 w-full max-w-sm" />
          <Skeleton className="h-9 w-20" />
        </CardContent>
      </Card>

      {/* Contact info section */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-5 w-36" />
          <div className="grid gap-4 sm:grid-cols-2 max-w-lg">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
          <Skeleton className="h-9 w-20" />
        </CardContent>
      </Card>

      {/* Default entities section */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-5 w-44" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-9 flex-1" />
              <Skeleton className="h-9 flex-1" />
              <Skeleton className="h-9 w-28" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Notification preferences */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-5 w-48" />
          <div className="flex gap-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-16 rounded-full" />
            ))}
          </div>
          <Skeleton className="h-9 w-20" />
        </CardContent>
      </Card>
    </div>
  );
}
