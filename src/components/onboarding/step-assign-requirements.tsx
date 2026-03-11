'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { runComplianceForEntity } from '@/lib/actions/properties';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Loader2, FileText } from 'lucide-react';

interface UploadedCOI {
  certificateId: string;
  insuredName: string;
  entityType: 'vendor' | 'tenant';
  entityId: string | null;
  templateId: string | null;
}

interface TemplateOption {
  id: string;
  name: string;
  category: 'vendor' | 'tenant';
  risk_level: string;
}

interface StepAssignRequirementsProps {
  propertyId: string | null;
  orgId: string | null;
  coiType: 'vendor' | 'tenant' | null;
  onNext: () => void;
  onSkip: () => void;
  saving: boolean;
}

export function StepAssignRequirements({
  propertyId,
  orgId,
  coiType,
  onNext,
  onSkip,
  saving,
}: StepAssignRequirementsProps) {
  const supabase = createClient();
  const [cois, setCois] = useState<UploadedCOI[]>([]);
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [runProgress, setRunProgress] = useState(0);
  const [done, setDone] = useState(false);

  const fetchData = useCallback(async () => {
    if (!orgId || !propertyId) {
      setLoading(false);
      return;
    }

    // Fetch uploaded COIs (extracted or needs_review) for this property
    const entityType = coiType ?? 'vendor';
    const entityTable = entityType === 'vendor' ? 'vendors' : 'tenants';
    const entityFK = entityType === 'vendor' ? 'vendor_id' : 'tenant_id';

    const { data: certs } = await supabase
      .from('certificates')
      .select(`id, insured_name, ${entityFK}`)
      .eq('organization_id', orgId)
      .in('processing_status', ['extracted', 'needs_review'])
      .order('uploaded_at', { ascending: false });

    if (certs && certs.length > 0) {
      // Get entity IDs to look up template assignments
      const entityIds = certs
        .map((c) => c[entityFK as keyof typeof c] as string | null)
        .filter(Boolean) as string[];

      let entityTemplateMap = new Map<string, string | null>();
      if (entityIds.length > 0) {
        const { data: entities } = await supabase
          .from(entityTable)
          .select('id, template_id')
          .in('id', entityIds);

        if (entities) {
          for (const e of entities) {
            entityTemplateMap.set(e.id, e.template_id);
          }
        }
      }

      const coiList: UploadedCOI[] = certs.map((c) => {
        const eid = c[entityFK as keyof typeof c] as string | null;
        return {
          certificateId: c.id,
          insuredName: c.insured_name || 'Unknown',
          entityType,
          entityId: eid,
          templateId: eid ? entityTemplateMap.get(eid) ?? null : null,
        };
      });
      setCois(coiList);

      // Pre-fill assignments from existing template_id
      const initial: Record<string, string> = {};
      for (const coi of coiList) {
        if (coi.templateId) {
          initial[coi.certificateId] = coi.templateId;
        }
      }
      setAssignments(initial);
    }

    // Fetch templates (org-specific ones created in step 4, plus system defaults)
    const { data: tpls } = await supabase
      .from('requirement_templates')
      .select('id, name, category, risk_level')
      .or(`organization_id.eq.${orgId},is_system_default.eq.true`)
      .order('name');

    if (tpls) {
      setTemplates(tpls as TemplateOption[]);
    }

    setLoading(false);
  }, [orgId, propertyId, coiType, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handleAssign(certId: string, templateId: string) {
    setAssignments((prev) => ({ ...prev, [certId]: templateId }));
  }

  function handleApplyToAll(templateId: string) {
    const newAssignments: Record<string, string> = {};
    for (const coi of cois) {
      newAssignments[coi.certificateId] = templateId;
    }
    setAssignments(newAssignments);
  }

  async function handleRunCompliance() {
    setRunning(true);
    setRunProgress(0);

    const assignedCois = cois.filter((c) => assignments[c.certificateId] && c.entityId);
    let completed = 0;

    for (const coi of assignedCois) {
      const templateId = assignments[coi.certificateId];
      if (!coi.entityId || !templateId) continue;

      try {
        // Update the entity's template_id
        const table = coi.entityType === 'vendor' ? 'vendors' : 'tenants';
        await supabase
          .from(table)
          .update({ template_id: templateId })
          .eq('id', coi.entityId);

        // Run compliance calculation
        await runComplianceForEntity(coi.entityId, coi.entityType);
      } catch (err) {
        console.error(`Compliance run failed for ${coi.entityId}:`, err);
      }

      completed++;
      setRunProgress(Math.round((completed / assignedCois.length) * 100));
    }

    setDone(true);
    setRunning(false);
  }

  // Filter templates by the COI type being uploaded
  const relevantTemplates = templates.filter(
    (t) => !coiType || t.category === coiType
  );

  const assignedCount = Object.keys(assignments).length;
  const totalCOIs = cois.length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Review &amp; Assign Requirements
          </h2>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
        </div>
      </div>
    );
  }

  if (cois.length === 0) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Review &amp; Assign Requirements
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            No uploaded COIs found to assign requirements to.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <Button size="lg" className="w-full font-semibold" onClick={onNext} disabled={saving}>
            {saving ? 'Finishing...' : 'Continue to Dashboard'}
          </Button>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Review &amp; Assign Requirements
          </h2>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6 text-center">
          <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-emerald-600" />
          <p className="text-sm font-semibold text-emerald-800">
            Compliance check complete!
          </p>
          <p className="mt-1 text-xs text-emerald-700">
            {assignedCount} COI{assignedCount !== 1 ? 's' : ''} have been assigned requirements and checked for compliance.
          </p>
        </div>
        <Button size="lg" className="w-full font-semibold" onClick={onNext} disabled={saving}>
          {saving ? 'Finishing...' : 'Go to Dashboard'}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Review &amp; Assign Requirements
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Assign a compliance template to each uploaded COI. The compliance engine will automatically check each certificate against the selected requirements.
        </p>
      </div>

      {/* Apply to all */}
      {relevantTemplates.length > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
          <span className="text-sm font-medium text-foreground shrink-0">Apply to all:</span>
          <select
            className="flex-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-foreground"
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) handleApplyToAll(e.target.value);
            }}
          >
            <option value="" disabled>Select a template...</option>
            {relevantTemplates.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* COI list */}
      <div className="max-h-80 overflow-y-auto rounded-lg border border-slate-200 bg-white">
        {cois.map((coi) => (
          <div
            key={coi.certificateId}
            className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-0"
          >
            <FileText className="h-4 w-4 shrink-0 text-slate-400" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {coi.insuredName}
              </p>
              <Badge variant="outline" className="text-[10px] mt-0.5">
                {coi.entityType}
              </Badge>
            </div>
            <select
              className="w-48 shrink-0 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs text-foreground"
              value={assignments[coi.certificateId] ?? ''}
              onChange={(e) => handleAssign(coi.certificateId, e.target.value)}
            >
              <option value="">No template</option>
              {relevantTemplates.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {/* Progress bar during compliance run */}
      {running && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Running compliance checks...</p>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-brand transition-all duration-300"
              style={{ width: `${runProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Stats */}
      <p className="text-xs text-muted-foreground">
        {assignedCount} of {totalCOIs} COIs assigned a template
      </p>

      <div className="flex flex-col gap-3">
        <Button
          size="lg"
          className="w-full font-semibold"
          disabled={running || assignedCount === 0}
          onClick={handleRunCompliance}
        >
          {running ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Checking compliance...
            </>
          ) : (
            `Assign & Check Compliance (${assignedCount} COI${assignedCount !== 1 ? 's' : ''})`
          )}
        </Button>

        {!running && (
          <button
            type="button"
            onClick={onSkip}
            className="text-center text-sm text-muted-foreground hover:text-foreground"
            disabled={saving}
          >
            Skip to Dashboard
          </button>
        )}
      </div>
    </div>
  );
}
