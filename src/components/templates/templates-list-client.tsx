'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CreateTemplateDialog } from './create-template-dialog';
import { ExtractLeaseDialog } from './extract-lease-dialog';
import { toast } from 'sonner';
import { useUpgradeModal } from '@/components/dashboard/upgrade-modal';
import { useTerminology } from '@/hooks/useTerminology';
import {
  RISK_LEVEL_LABELS,
  RISK_LEVEL_COLORS,
  COVERAGE_SHORT_LABELS,
} from './template-labels';
import type {
  RequirementTemplate,
  TemplateCoverageRequirement,
  CoverageType,
} from '@/types';

interface TemplateWithUsage extends RequirementTemplate {
  coverage_requirements: TemplateCoverageRequirement[];
  vendor_count: number;
  tenant_count: number;
}

interface TemplatesListClientProps {
  vendorTemplates: TemplateWithUsage[];
  tenantTemplates: TemplateWithUsage[];
  hasCustomTemplates: boolean;
}

export function TemplatesListClient({
  vendorTemplates,
  tenantTemplates,
  hasCustomTemplates,
}: TemplatesListClientProps) {
  const { showUpgradeModal } = useUpgradeModal();
  const { terminology } = useTerminology();
  const [createOpen, setCreateOpen] = useState(false);
  const [leaseOpen, setLeaseOpen] = useState(false);

  function coverageSummary(reqs: TemplateCoverageRequirement[]): string {
    const required = reqs.filter((r) => r.is_required);
    const shortNames = required.map(
      (r) => COVERAGE_SHORT_LABELS[r.coverage_type as CoverageType]
    );
    // Deduplicate (GL might appear twice for per_occurrence + aggregate)
    const unique = [...new Set(shortNames)];
    return `${unique.length} coverage${unique.length !== 1 ? 's' : ''}: ${unique.join(', ')}`;
  }

  function TemplateCard({ template }: { template: TemplateWithUsage }) {
    const isSystem = template.is_system_default;
    const reqs = template.coverage_requirements ?? [];
    const usageCount =
      template.category === 'vendor' ? template.vendor_count : template.tenant_count;
    const usageLabel =
      template.category === 'vendor'
        ? `Used by ${usageCount} vendor${usageCount !== 1 ? 's' : ''}`
        : `Used by ${usageCount} tenant${usageCount !== 1 ? 's' : ''}`;

    return (
      <Link href={`/dashboard/templates/${template.id}`}>
        <Card className="h-full transition-shadow hover:shadow-md cursor-pointer">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold text-foreground">
                    {template.name}
                  </h3>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${RISK_LEVEL_COLORS[template.risk_level]}`}
                  >
                    {RISK_LEVEL_LABELS[template.risk_level]}
                  </Badge>
                  {isSystem && (
                    <Badge variant="secondary" className="text-[10px]">
                      System Default
                    </Badge>
                  )}
                  {template.source_type === 'lease_extraction' && (
                    <Badge variant="outline" className="text-[10px] bg-violet-50 text-violet-700 border-violet-200">
                      Extracted from Lease
                    </Badge>
                  )}
                  {template.source_type === 'ai_recommended' && (
                    <Badge variant="outline" className="text-[10px] bg-sky-50 text-sky-700 border-sky-200">
                      AI Recommended
                    </Badge>
                  )}
                </div>
                {template.description && (
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                    {template.description}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-3 space-y-1.5">
              <p className="text-xs text-muted-foreground">
                {reqs.length > 0 ? coverageSummary(reqs) : 'No coverages defined'}
              </p>
              <p className="text-xs text-muted-foreground">
                {usageCount > 0 ? usageLabel : `No ${template.category}s assigned`}
              </p>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  function TemplateGroup({
    title,
    templates,
  }: {
    title: string;
    templates: TemplateWithUsage[];
  }) {
    const systemTemplates = templates.filter((t) => t.is_system_default);
    const orgTemplates = templates.filter((t) => !t.is_system_default);

    return (
      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {systemTemplates.map((t) => (
            <TemplateCard key={t.id} template={t} />
          ))}
          {orgTemplates.map((t) => (
            <TemplateCard key={t.id} template={t} />
          ))}
        </div>
      </div>
    );
  }

  const noTemplates = vendorTemplates.length === 0 && tenantTemplates.length === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Requirement Templates
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage insurance requirement templates{terminology.hasTenants ? ` for ${terminology.entityPlural.toLowerCase()} and ${terminology.tenantPlural?.toLowerCase()}` : ''}.

          </p>
        </div>
        <div className="flex gap-2">
          {terminology.hasTenants && (
            <Button variant="outline" onClick={() => setLeaseOpen(true)}>
              Extract from Lease
            </Button>
          )}
          <Button onClick={() => setCreateOpen(true)}>+ Create Template</Button>
        </div>
      </div>

      {noTemplates ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <p className="mt-3 text-sm font-medium text-foreground">
              No templates available
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Create a template to define insurance requirements.
            </p>
            <Button className="mt-4" onClick={() => setCreateOpen(true)}>
              + Create Template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {vendorTemplates.length > 0 && (
            <TemplateGroup title="Vendor Templates" templates={vendorTemplates} />
          )}
          {tenantTemplates.length > 0 && (
            <TemplateGroup title="Tenant Templates" templates={tenantTemplates} />
          )}
        </div>
      )}

      <CreateTemplateDialog open={createOpen} onOpenChange={setCreateOpen} />
      <ExtractLeaseDialog open={leaseOpen} onOpenChange={setLeaseOpen} />
    </div>
  );
}
