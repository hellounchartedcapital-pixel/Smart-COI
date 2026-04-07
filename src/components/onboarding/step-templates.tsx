'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCoverageType } from '@/lib/coverage-utils';
import { formatCurrency } from '@/lib/utils';
import { getTerminology } from '@/lib/constants/terminology';
import {
  getDefaultTemplates,
  COVERAGE_DISCLAIMER,
  type DefaultTemplate,
  type DefaultTemplateRequirement,
} from '@/lib/constants/industry-templates';
import type { Industry, LimitType } from '@/types';

const LIMIT_LABELS: Record<LimitType, string> = {
  per_occurrence: '/ Occ',
  aggregate: '/ Agg',
  combined_single_limit: '/ CSL',
  statutory: 'Statutory',
  per_person: '/ Person',
  per_accident: '/ Accident',
};

const RISK_COLORS: Record<string, string> = {
  standard: 'bg-emerald-100 text-emerald-800',
  high_risk: 'bg-red-100 text-red-800',
  professional_services: 'bg-blue-100 text-blue-800',
  restaurant: 'bg-amber-100 text-amber-800',
  industrial: 'bg-orange-100 text-orange-800',
};

function formatLimit(amount: number | null, limitType: LimitType | null): string {
  if (limitType === 'statutory') return 'Statutory';
  if (amount == null) return 'N/A';
  if (amount >= 1_000_000) return `$${amount / 1_000_000}M`;
  if (amount >= 1_000) return `$${amount / 1_000}K`;
  return `$${amount}`;
}

function summarizeCoverages(reqs: DefaultTemplateRequirement[]): string {
  if (reqs.length === 0) return 'No coverages defined';
  const parts: string[] = [];
  for (const r of reqs.slice(0, 4)) {
    const label = formatCoverageType(r.coverage_type);
    const short = label.length > 20 ? label.slice(0, 18) + '...' : label;
    parts.push(`${short}: ${formatLimit(r.minimum_limit, r.limit_type)}`);
  }
  if (reqs.length > 4) parts.push(`+${reqs.length - 4} more`);
  return parts.join(', ');
}

export interface SelectedTemplate {
  template: DefaultTemplate;
  adjustedRequirements: DefaultTemplateRequirement[];
}

interface StepTemplatesProps {
  industry: Industry | null;
  onNext: (selected: SelectedTemplate[]) => void;
  onSkip: () => void;
  saving: boolean;
}

export function StepTemplates({ industry, onNext, onSkip, saving }: StepTemplatesProps) {
  const terms = getTerminology(industry);
  const allTemplates = useMemo(() => getDefaultTemplates(industry), [industry]);

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [editedReqs, setEditedReqs] = useState<
    Record<number, DefaultTemplateRequirement[]>
  >(() => {
    const initial: Record<number, DefaultTemplateRequirement[]> = {};
    allTemplates.forEach((t, i) => {
      initial[i] = [...t.requirements];
    });
    return initial;
  });

  function toggleTemplate(idx: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  function updateReqLimit(templateIdx: number, reqIdx: number, value: string) {
    setEditedReqs((prev) => ({
      ...prev,
      [templateIdx]: prev[templateIdx].map((r, i) =>
        i === reqIdx
          ? { ...r, minimum_limit: value === '' ? null : Number(value) }
          : r
      ),
    }));
  }

  function handleSubmit() {
    const selected: SelectedTemplate[] = [];
    for (const idx of selectedIds) {
      selected.push({
        template: allTemplates[idx],
        adjustedRequirements: editedReqs[idx] || allTemplates[idx].requirements,
      });
    }
    onNext(selected);
  }

  const entityTemplates = allTemplates.filter((t) => t.category === 'vendor');
  const tenantTemplates = allTemplates.filter((t) => t.category === 'tenant');

  const entitySectionLabel = terms.hasTenants
    ? `${terms.entity} Templates`.toUpperCase()
    : 'Coverage Templates'.toUpperCase();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Set your compliance requirements
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Start with industry-standard templates and customize to fit your needs.
        </p>
      </div>

      {/* Entity Templates */}
      {entityTemplates.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {entitySectionLabel}
          </h3>
          <div className="space-y-3">
            {entityTemplates.map((t) => {
              const idx = allTemplates.indexOf(t);
              return (
                <TemplateCard
                  key={idx}
                  template={t}
                  selected={selectedIds.has(idx)}
                  onToggle={() => toggleTemplate(idx)}
                  editedReqs={editedReqs[idx] || t.requirements}
                  onUpdateLimit={(reqIdx, val) => updateReqLimit(idx, reqIdx, val)}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Tenant Templates — only for PM */}
      {tenantTemplates.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {terms.tenantPlural?.toUpperCase() ?? 'TENANT'} TEMPLATES
          </h3>
          <div className="space-y-3">
            {tenantTemplates.map((t) => {
              const idx = allTemplates.indexOf(t);
              return (
                <TemplateCard
                  key={idx}
                  template={t}
                  selected={selectedIds.has(idx)}
                  onToggle={() => toggleTemplate(idx)}
                  editedReqs={editedReqs[idx] || t.requirements}
                  onUpdateLimit={(reqIdx, val) => updateReqLimit(idx, reqIdx, val)}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Disclaimer + Tip */}
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
        <p className="text-sm font-medium text-emerald-800">
          Almost done!
        </p>
        <p className="mt-1 text-xs text-emerald-700">
          These templates define what coverage each {terms.entity.toLowerCase()} needs. You can always customize them later from Settings.
        </p>
        <p className="mt-2 text-[10px] text-emerald-600/80">
          {COVERAGE_DISCLAIMER}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <Button
          size="lg"
          className="w-full font-semibold"
          disabled={saving || selectedIds.size === 0}
          onClick={handleSubmit}
        >
          {saving
            ? 'Saving...'
            : `Continue with ${selectedIds.size} template${selectedIds.size !== 1 ? 's' : ''}`}
        </Button>
        <button
          type="button"
          onClick={onSkip}
          className="text-center text-sm text-muted-foreground hover:text-foreground"
          disabled={saving}
        >
          Skip to Dashboard
        </button>
      </div>
    </div>
  );
}

// --- Template Card Sub-component ---

function TemplateCard({
  template,
  selected,
  onToggle,
  editedReqs,
  onUpdateLimit,
}: {
  template: DefaultTemplate;
  selected: boolean;
  onToggle: () => void;
  editedReqs: DefaultTemplateRequirement[];
  onUpdateLimit: (reqIdx: number, value: string) => void;
}) {
  const reqs = editedReqs.length > 0 ? editedReqs : template.requirements;
  const summary = summarizeCoverages(reqs);

  return (
    <div
      className={`cursor-pointer rounded-lg border-2 bg-white p-4 transition-all ${
        selected
          ? 'border-brand shadow-sm'
          : 'border-slate-200 hover:border-slate-300'
      }`}
      onClick={onToggle}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-foreground">
              {template.name}
            </h4>
            <span
              className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${RISK_COLORS[template.risk_level] || 'bg-slate-100 text-slate-700'}`}
            >
              {template.risk_level.replace('_', ' ')}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{summary}</p>
        </div>
        <div
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
            selected ? 'border-brand bg-brand text-white' : 'border-slate-300'
          }`}
        >
          {selected && (
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>

      {/* Expanded edit section */}
      {selected && (
        <div
          className="mt-4 space-y-2 border-t border-slate-100 pt-4"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-xs font-medium text-muted-foreground">
            Adjust coverage limits:
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {reqs.map((req, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Label className="w-28 shrink-0 text-xs text-slate-600">
                  {formatCoverageType(req.coverage_type)}
                  {req.limit_type && (
                    <span className="ml-1 text-[10px] text-slate-400">
                      {LIMIT_LABELS[req.limit_type]}
                    </span>
                  )}
                </Label>
                {req.limit_type === 'statutory' ? (
                  <span className="text-xs text-slate-500">Statutory</span>
                ) : (
                  <div>
                    <Input
                      type="number"
                      className="h-8 text-xs"
                      value={req.minimum_limit ?? ''}
                      onChange={(e) => onUpdateLimit(idx, e.target.value)}
                      step={100000}
                      min={0}
                    />
                    {req.minimum_limit != null && (
                      <span className="text-[10px] text-muted-foreground mt-0.5 block">
                        {formatCurrency(req.minimum_limit)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
