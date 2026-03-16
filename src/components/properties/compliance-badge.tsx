import { Badge } from '@/components/ui/badge';
import type { ComplianceStatus } from '@/types';

const STATUS_CONFIG: Record<
  ComplianceStatus,
  { label: string; className: string; dotColor: string }
> = {
  compliant: {
    label: 'COMPLIANT',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    dotColor: 'bg-emerald-500',
  },
  non_compliant: {
    label: 'NON-COMPLIANT',
    className: 'bg-red-50 text-red-700 border-red-100',
    dotColor: 'bg-red-500',
  },
  expiring_soon: {
    label: 'EXPIRING',
    className: 'bg-amber-50 text-amber-700 border-amber-100',
    dotColor: 'bg-amber-500',
  },
  expired: {
    label: 'EXPIRED',
    className: 'bg-red-50 text-red-700 border-red-100',
    dotColor: 'bg-red-600',
  },
  pending: {
    label: 'PENDING',
    className: 'bg-slate-50 text-slate-600 border-slate-100',
    dotColor: 'bg-slate-400',
  },
  under_review: {
    label: 'UNDER REVIEW',
    className: 'bg-blue-50 text-blue-700 border-blue-100',
    dotColor: 'bg-blue-500',
  },
};

export function ComplianceBadge({ status }: { status: ComplianceStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <Badge variant="outline" className={`whitespace-nowrap gap-1.5 text-[10px] font-semibold tracking-wide ${config.className}`}>
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${config.dotColor}`} />
      {config.label}
    </Badge>
  );
}
