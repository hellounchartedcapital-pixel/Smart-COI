'use client';

import { useEffect, useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { getComplianceTrend, type ComplianceTrendPoint } from '@/lib/actions/compliance-snapshots';

export function ComplianceTrendChart() {
  const [data, setData] = useState<ComplianceTrendPoint[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getComplianceTrend()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200/60 bg-white p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900">Compliance Trend</h3>
        </div>
        <div className="h-24 flex items-center justify-center">
          <div className="h-4 w-4 rounded-full border-2 border-emerald-200 border-t-emerald-500 animate-spin" />
        </div>
      </div>
    );
  }

  if (!data || data.length < 2) {
    return (
      <div className="rounded-2xl border border-slate-200/60 bg-white p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900">Compliance Trend</h3>
        </div>
        <p className="text-xs text-slate-400">
          Compliance trends will appear after a few days of tracking.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900">Compliance Trend</h3>
        </div>
        <span className="text-xs text-slate-400">Last 30 days</span>
      </div>
      <MiniLineChart data={data} />
    </div>
  );
}

function MiniLineChart({ data }: { data: ComplianceTrendPoint[] }) {
  const width = 280;
  const height = 80;
  const padding = { top: 8, right: 8, bottom: 20, left: 32 };

  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const rates = data.map((d) => d.rate);
  const minRate = Math.max(0, Math.min(...rates) - 5);
  const maxRate = Math.min(100, Math.max(...rates) + 5);
  const range = maxRate - minRate || 1;

  const points = data.map((d, i) => {
    const x = padding.left + (i / (data.length - 1)) * chartW;
    const y = padding.top + chartH - ((d.rate - minRate) / range) * chartH;
    return { x, y, rate: d.rate, date: d.date };
  });

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');

  // Area fill
  const areaD = `${pathD} L ${points[points.length - 1].x.toFixed(1)} ${(padding.top + chartH).toFixed(1)} L ${points[0].x.toFixed(1)} ${(padding.top + chartH).toFixed(1)} Z`;

  const latestRate = data[data.length - 1].rate;
  const firstRate = data[0].rate;
  const delta = latestRate - firstRate;

  // Format date for label
  const formatShortDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#059669" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#059669" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Y-axis labels */}
        <text x={padding.left - 4} y={padding.top + 4} textAnchor="end" className="fill-slate-400" fontSize="9">
          {maxRate}%
        </text>
        <text x={padding.left - 4} y={padding.top + chartH + 3} textAnchor="end" className="fill-slate-400" fontSize="9">
          {minRate}%
        </text>

        {/* X-axis labels */}
        <text x={padding.left} y={height - 4} textAnchor="start" className="fill-slate-400" fontSize="9">
          {formatShortDate(data[0].date)}
        </text>
        <text x={width - padding.right} y={height - 4} textAnchor="end" className="fill-slate-400" fontSize="9">
          {formatShortDate(data[data.length - 1].date)}
        </text>

        {/* Grid line */}
        <line
          x1={padding.left}
          y1={padding.top + chartH / 2}
          x2={width - padding.right}
          y2={padding.top + chartH / 2}
          stroke="#e2e8f0"
          strokeWidth="0.5"
          strokeDasharray="3,3"
        />

        {/* Area fill */}
        <path d={areaD} fill="url(#trendFill)" />

        {/* Line */}
        <path d={pathD} fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {/* End dot */}
        <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="3" fill="#059669" />
      </svg>

      {/* Summary */}
      <div className="flex items-center justify-between mt-2">
        <span className="text-lg font-bold text-emerald-600">{latestRate}%</span>
        <span className={`text-xs font-medium ${delta >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
          {delta >= 0 ? '+' : ''}{delta}% from 30d ago
        </span>
      </div>
    </div>
  );
}
