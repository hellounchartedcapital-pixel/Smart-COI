'use client';

import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, Sparkles, FileText, List, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUpgradeModal } from '@/components/dashboard/upgrade-modal';
import { updateVendor, updateTenant } from '@/lib/actions/properties';
import { createTemplateWithRequirements } from '@/lib/actions/templates';
import { handleActionError, handleActionResult } from '@/lib/handle-action-error';
import {
  getCoverageLabel,
  LIMIT_TYPE_LABELS,
  COMMON_COVERAGE_TYPES,
  ALL_LIMIT_TYPES,
  formatLimit,
} from '@/components/templates/template-labels';
import type { RequirementTemplate, LimitType, TemplateCategory } from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TemplateAssignmentNudgeProps {
  entityType: 'vendor' | 'tenant';
  entityId: string;
  entityName: string;
  certificateId: string;
  vendorType?: string | null;
  templates: RequirementTemplate[];
  onTemplateAssigned: () => void;
}

interface EditableRequirement {
  id: string;
  included: boolean;
  coverage_type: string;
  limit_type: LimitType | null;
  minimum_limit: number | null;
  requires_additional_insured: boolean;
  requires_waiver_of_subrogation: boolean;
  requires_primary_noncontributory: boolean;
  reasoning?: string;
}

type ActionMode = 'idle' | 'existing' | 'ai' | 'lease';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TemplateAssignmentNudge({
  entityType,
  entityId,
  entityName,
  certificateId,
  vendorType,
  templates,
  onTemplateAssigned,
}: TemplateAssignmentNudgeProps) {
  const { showUpgradeModal } = useUpgradeModal();
  const fileRef = useRef<HTMLInputElement>(null);

  // Mode
  const [mode, setMode] = useState<ActionMode>('idle');

  // Existing template selection
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [assigningExisting, setAssigningExisting] = useState(false);

  // AI recommendation state
  const [aiVendorType, setAiVendorType] = useState(vendorType || '');
  const [aiPropertyType, setAiPropertyType] = useState('');
  const [aiPropertyDetails, setAiPropertyDetails] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiRequirements, setAiRequirements] = useState<EditableRequirement[]>([]);
  const [aiTemplateName, setAiTemplateName] = useState('');
  const [aiStep, setAiStep] = useState<'form' | 'generating' | 'review'>('form');
  const [aiSaving, setAiSaving] = useState(false);

  // Lease extraction state
  const [leaseFile, setLeaseFile] = useState<File | null>(null);
  const [leaseTemplateName, setLeaseTemplateName] = useState('');
  const [leaseExtracting, setLeaseExtracting] = useState(false);
  const [leaseExtractionError, setLeaseExtractionError] = useState<string | null>(null);
  const [leaseRequirements, setLeaseRequirements] = useState<EditableRequirement[]>([]);
  const [leaseStep, setLeaseStep] = useState<'upload' | 'extracting' | 'review'>('upload');
  const [leaseSaving, setLeaseSaving] = useState(false);

  // Filtered templates by entity category
  const filteredTemplates = templates.filter((t) => t.category === entityType);

  // ---------------------------------------------------------------------------
  // Assign existing template
  // ---------------------------------------------------------------------------

  const handleAssignExisting = useCallback(async () => {
    if (!selectedTemplateId) {
      toast.error('Please select a template');
      return;
    }

    setAssigningExisting(true);
    try {
      if (entityType === 'vendor') {
        const result = await updateVendor(entityId, {
          company_name: entityName,
          template_id: selectedTemplateId,
        });
        if (handleActionResult(result, 'Failed to assign template', showUpgradeModal)) {
          setAssigningExisting(false);
          return;
        }
      } else {
        const result = await updateTenant(entityId, {
          company_name: entityName,
          template_id: selectedTemplateId,
        });
        if (handleActionResult(result, 'Failed to assign template', showUpgradeModal)) {
          setAssigningExisting(false);
          return;
        }
      }

      toast.success('Template assigned and compliance calculated');
      onTemplateAssigned();
    } catch (err) {
      handleActionError(err, 'Failed to assign template', showUpgradeModal);
    } finally {
      setAssigningExisting(false);
    }
  }, [selectedTemplateId, entityType, entityId, entityName, showUpgradeModal, onTemplateAssigned]);

  // ---------------------------------------------------------------------------
  // AI recommendation
  // ---------------------------------------------------------------------------

  const handleAiGenerate = useCallback(async () => {
    if (!aiVendorType.trim()) {
      toast.error('Please enter a vendor type');
      return;
    }

    setAiGenerating(true);
    setAiStep('generating');

    try {
      const response = await fetch('/api/templates/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendor_type: aiVendorType.trim(),
          property_type: aiPropertyType.trim() || undefined,
          property_details: aiPropertyDetails.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (data.upgrade) {
        showUpgradeModal(data.error);
        setAiStep('form');
        setAiGenerating(false);
        return;
      }

      if (!data.success) {
        toast.error(data.message || data.error || 'Recommendation failed');
        setAiStep('form');
        setAiGenerating(false);
        return;
      }

      // Map to editable requirements
      const editableReqs: EditableRequirement[] = data.coverages.map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (c: any, i: number) => ({
          id: `ai-req-${i}`,
          included: true,
          coverage_type: c.coverage_name,
          limit_type: c.limit_type || 'per_occurrence',
          minimum_limit: c.recommended_limit,
          requires_additional_insured: c.requires_additional_insured ?? false,
          requires_waiver_of_subrogation: c.requires_waiver_of_subrogation ?? false,
          requires_primary_noncontributory: c.requires_primary_noncontributory ?? false,
          reasoning: c.reasoning || undefined,
        })
      );

      setAiRequirements(editableReqs);
      setAiTemplateName(`${aiVendorType.trim()} — AI Recommended`);
      setAiStep('review');
    } catch (err) {
      console.error('AI recommendation error:', err);
      toast.error('Something went wrong. Please try again.');
      setAiStep('form');
    } finally {
      setAiGenerating(false);
    }
  }, [aiVendorType, aiPropertyType, aiPropertyDetails, showUpgradeModal]);

  const handleAiSaveAndAssign = useCallback(async () => {
    const included = aiRequirements.filter((r) => r.included);
    if (included.length === 0) {
      toast.error('Include at least one coverage requirement');
      return;
    }
    if (!aiTemplateName.trim()) {
      toast.error('Please enter a template name');
      return;
    }

    setAiSaving(true);
    try {
      const result = await createTemplateWithRequirements({
        name: aiTemplateName.trim(),
        description: `AI recommended template for ${aiVendorType} vendor`,
        category: 'vendor' as TemplateCategory,
        risk_level: 'standard',
        source_type: 'ai_recommended',
        requirements: included.map((r) => ({
          coverage_type: r.coverage_type,
          is_required: true,
          minimum_limit: r.minimum_limit,
          limit_type: r.limit_type,
          requires_additional_insured: r.requires_additional_insured,
          requires_waiver_of_subrogation: r.requires_waiver_of_subrogation,
          requires_primary_noncontributory: r.requires_primary_noncontributory,
        })),
      });

      if (handleActionResult(result, 'Failed to create template', showUpgradeModal)) {
        setAiSaving(false);
        return;
      }

      // Assign template to entity
      const templateId = (result as { id: string }).id;
      const assignResult = await updateVendor(entityId, {
        company_name: entityName,
        template_id: templateId,
      });

      if (handleActionResult(assignResult, 'Failed to assign template', showUpgradeModal)) {
        setAiSaving(false);
        return;
      }

      toast.success('Template created, assigned, and compliance calculated');
      onTemplateAssigned();
    } catch (err) {
      handleActionError(err, 'Failed to create template', showUpgradeModal);
    } finally {
      setAiSaving(false);
    }
  }, [aiRequirements, aiTemplateName, aiVendorType, entityId, entityName, showUpgradeModal, onTemplateAssigned]);

  function updateAiRequirement(id: string, field: string, value: unknown) {
    setAiRequirements((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  }

  // ---------------------------------------------------------------------------
  // Lease extraction
  // ---------------------------------------------------------------------------

  function handleLeaseFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f && f.type === 'application/pdf') {
      setLeaseFile(f);
      setLeaseExtractionError(null);
    }
  }

  function handleLeaseDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f && f.type === 'application/pdf') {
      setLeaseFile(f);
      setLeaseExtractionError(null);
    }
  }

  const handleLeaseExtract = useCallback(async () => {
    if (!leaseFile) return;
    if (!leaseTemplateName.trim()) {
      toast.error('Please enter a template name');
      return;
    }

    setLeaseExtracting(true);
    setLeaseExtractionError(null);
    setLeaseStep('extracting');

    try {
      const buffer = await leaseFile.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );

      const response = await fetch('/api/leases/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdfBase64: base64 }),
      });

      const data = await response.json();

      if (data.upgrade) {
        showUpgradeModal(data.error);
        setLeaseStep('upload');
        setLeaseExtracting(false);
        return;
      }

      if (!data.success) {
        setLeaseExtractionError(data.message || 'Extraction failed');
        setLeaseStep('upload');
        setLeaseExtracting(false);
        return;
      }

      const editableReqs: EditableRequirement[] = data.requirements.map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (r: any, i: number) => ({
          id: `lease-req-${i}`,
          included: true,
          coverage_type: r.coverage_type,
          limit_type: r.limit_type || 'per_occurrence',
          minimum_limit: r.minimum_limit,
          requires_additional_insured: r.requires_additional_insured ?? false,
          requires_waiver_of_subrogation: r.requires_waiver_of_subrogation ?? false,
          requires_primary_noncontributory: r.requires_primary_noncontributory ?? false,
        })
      );

      setLeaseRequirements(editableReqs);
      setLeaseStep('review');
    } catch (err) {
      console.error('Lease extraction error:', err);
      setLeaseExtractionError('Something went wrong. Please try again.');
      setLeaseStep('upload');
    } finally {
      setLeaseExtracting(false);
    }
  }, [leaseFile, leaseTemplateName, showUpgradeModal]);

  const handleLeaseSaveAndAssign = useCallback(async () => {
    const included = leaseRequirements.filter((r) => r.included);
    if (included.length === 0) {
      toast.error('Include at least one coverage requirement');
      return;
    }
    if (!leaseTemplateName.trim()) {
      toast.error('Please enter a template name');
      return;
    }

    setLeaseSaving(true);
    try {
      const result = await createTemplateWithRequirements({
        name: leaseTemplateName.trim(),
        description: 'Extracted from uploaded lease document',
        category: 'tenant' as TemplateCategory,
        risk_level: 'standard',
        source_type: 'lease_extraction',
        requirements: included.map((r) => ({
          coverage_type: r.coverage_type,
          is_required: true,
          minimum_limit: r.minimum_limit,
          limit_type: r.limit_type,
          requires_additional_insured: r.requires_additional_insured,
          requires_waiver_of_subrogation: r.requires_waiver_of_subrogation,
          requires_primary_noncontributory: r.requires_primary_noncontributory,
        })),
      });

      if (handleActionResult(result, 'Failed to create template', showUpgradeModal)) {
        setLeaseSaving(false);
        return;
      }

      // Assign template to entity
      const templateId = (result as { id: string }).id;
      const assignResult = await updateTenant(entityId, {
        company_name: entityName,
        template_id: templateId,
      });

      if (handleActionResult(assignResult, 'Failed to assign template', showUpgradeModal)) {
        setLeaseSaving(false);
        return;
      }

      toast.success('Template created from lease, assigned, and compliance calculated');
      onTemplateAssigned();
    } catch (err) {
      handleActionError(err, 'Failed to create template', showUpgradeModal);
    } finally {
      setLeaseSaving(false);
    }
  }, [leaseRequirements, leaseTemplateName, entityId, entityName, showUpgradeModal, onTemplateAssigned]);

  function updateLeaseRequirement(id: string, field: string, value: unknown) {
    setLeaseRequirements((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  }

  // ---------------------------------------------------------------------------
  // Editable requirements table (shared renderer)
  // ---------------------------------------------------------------------------

  function renderRequirementsTable(
    requirements: EditableRequirement[],
    updateFn: (id: string, field: string, value: unknown) => void,
    datalistId: string,
  ) {
    return (
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Coverage Requirements ({requirements.filter((r) => r.included).length} included)
        </Label>
        <div className="space-y-2">
          {requirements.map((req) => (
            <div
              key={req.id}
              className={`rounded-lg border p-3 transition-colors ${
                req.included
                  ? 'border-slate-200 bg-white'
                  : 'border-slate-100 bg-slate-50 opacity-60'
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Include toggle */}
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 accent-emerald-600"
                  checked={req.included}
                  onChange={(e) => updateFn(req.id, 'included', e.target.checked)}
                />

                {/* Coverage type — freetext with suggestions */}
                <Input
                  className="w-[200px] text-xs h-8"
                  value={getCoverageLabel(req.coverage_type)}
                  onChange={(e) => updateFn(req.id, 'coverage_type', e.target.value)}
                  list={datalistId}
                  placeholder="e.g., General Liability"
                />

                {/* Limit type */}
                <Select
                  value={req.limit_type ?? 'per_occurrence'}
                  onValueChange={(v) => updateFn(req.id, 'limit_type', v)}
                >
                  <SelectTrigger className="w-[150px] text-xs h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_LIMIT_TYPES.map((lt) => (
                      <SelectItem key={lt} value={lt} className="text-xs">
                        {LIMIT_TYPE_LABELS[lt]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Limit amount */}
                {req.limit_type !== 'statutory' ? (
                  <Input
                    type="number"
                    className="w-[120px] text-xs h-8"
                    placeholder="Amount"
                    value={req.minimum_limit ?? ''}
                    onChange={(e) =>
                      updateFn(
                        req.id,
                        'minimum_limit',
                        e.target.value ? Number(e.target.value) : null
                      )
                    }
                  />
                ) : (
                  <span className="w-[120px] text-xs text-muted-foreground px-2">
                    Statutory
                  </span>
                )}

                {/* Reasoning tooltip for AI recommendations */}
                {req.reasoning && (
                  <span
                    className="ml-1 text-xs text-amber-600 cursor-help"
                    title={req.reasoning}
                  >
                    ?
                  </span>
                )}
              </div>

              {/* Toggles row */}
              <div className="mt-2 flex gap-4 pl-7">
                <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <input
                    type="checkbox"
                    className="h-3 w-3 rounded border-slate-300 accent-emerald-600"
                    checked={req.requires_additional_insured}
                    onChange={(e) =>
                      updateFn(req.id, 'requires_additional_insured', e.target.checked)
                    }
                  />
                  Additional Insured
                </label>
                <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <input
                    type="checkbox"
                    className="h-3 w-3 rounded border-slate-300 accent-emerald-600"
                    checked={req.requires_waiver_of_subrogation}
                    onChange={(e) =>
                      updateFn(req.id, 'requires_waiver_of_subrogation', e.target.checked)
                    }
                  />
                  Waiver of Subrogation
                </label>
                <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <input
                    type="checkbox"
                    className="h-3 w-3 rounded border-slate-300 accent-emerald-600"
                    checked={req.requires_primary_noncontributory}
                    onChange={(e) =>
                      updateFn(req.id, 'requires_primary_noncontributory', e.target.checked)
                    }
                  />
                  Primary &amp; Non-Contributory
                </label>
              </div>
            </div>
          ))}
        </div>

        <datalist id={datalistId}>
          {COMMON_COVERAGE_TYPES.map((ct) => (
            <option key={ct} value={ct} />
          ))}
        </datalist>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="rounded-lg border-2 border-amber-300 bg-amber-50/60 p-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-amber-900">
            No requirements template assigned
          </h3>
          <p className="mt-1 text-sm text-amber-800">
            Compliance can&apos;t be calculated without a requirements template for{' '}
            <span className="font-medium">{entityName}</span>.
          </p>

          {/* Action buttons — shown when idle */}
          {mode === 'idle' && (
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 border-amber-300 bg-white text-amber-900 hover:bg-amber-100"
                onClick={() => setMode('existing')}
              >
                <List className="h-3.5 w-3.5" />
                Choose Existing Template
              </Button>

              {entityType === 'vendor' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 border-amber-300 bg-white text-amber-900 hover:bg-amber-100"
                  onClick={() => setMode('ai')}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  AI Recommended
                </Button>
              )}

              {entityType === 'tenant' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 border-amber-300 bg-white text-amber-900 hover:bg-amber-100"
                  onClick={() => setMode('lease')}
                >
                  <FileText className="h-3.5 w-3.5" />
                  Extract from Lease
                </Button>
              )}
            </div>
          )}

          {/* ── Existing Template Selection ── */}
          {mode === 'existing' && (
            <div className="mt-4 space-y-3">
              <div className="flex items-end gap-2">
                <div className="flex-1 space-y-1.5">
                  <Label className="text-xs text-amber-800">
                    Select a {entityType} template
                  </Label>
                  <Select
                    value={selectedTemplateId}
                    onValueChange={setSelectedTemplateId}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Choose a template..." />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredTemplates.length === 0 ? (
                        <div className="px-3 py-2 text-xs text-muted-foreground">
                          No {entityType} templates found
                        </div>
                      ) : (
                        filteredTemplates.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name}
                            {t.coverage_requirements
                              ? ` (${t.coverage_requirements.length} requirements)`
                              : ''}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  size="sm"
                  onClick={handleAssignExisting}
                  disabled={!selectedTemplateId || assigningExisting}
                >
                  {assigningExisting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                      Assigning...
                    </>
                  ) : (
                    'Assign'
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setMode('idle');
                    setSelectedTemplateId('');
                  }}
                  disabled={assigningExisting}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* ── AI Recommendation (vendors only) ── */}
          {mode === 'ai' && aiStep === 'form' && (
            <div className="mt-4 space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-amber-800">Vendor type *</Label>
                <Input
                  value={aiVendorType}
                  onChange={(e) => setAiVendorType(e.target.value)}
                  placeholder="e.g., HVAC Contractor, Janitorial, Landscaping"
                  className="bg-white"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs text-amber-800">Property type (optional)</Label>
                  <Input
                    value={aiPropertyType}
                    onChange={(e) => setAiPropertyType(e.target.value)}
                    placeholder="e.g., Office, Retail, Industrial"
                    className="bg-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-amber-800">Property details (optional)</Label>
                  <Input
                    value={aiPropertyDetails}
                    onChange={(e) => setAiPropertyDetails(e.target.value)}
                    placeholder="e.g., 10-story office building"
                    className="bg-white"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <Button
                  size="sm"
                  onClick={handleAiGenerate}
                  disabled={!aiVendorType.trim() || aiGenerating}
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1" />
                  Generate
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setMode('idle');
                    setAiVendorType(vendorType || '');
                    setAiPropertyType('');
                    setAiPropertyDetails('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {mode === 'ai' && aiStep === 'generating' && (
            <div className="mt-4 flex flex-col items-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
              <p className="mt-3 text-sm font-medium text-slate-700">
                Generating AI recommendations...
              </p>
              <p className="mt-1 text-xs text-slate-400">
                This may take a few seconds.
              </p>
            </div>
          )}

          {mode === 'ai' && aiStep === 'review' && (
            <div className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-amber-800">Template name *</Label>
                <Input
                  value={aiTemplateName}
                  onChange={(e) => setAiTemplateName(e.target.value)}
                  placeholder="Template name"
                  className="bg-white"
                />
              </div>

              {renderRequirementsTable(aiRequirements, updateAiRequirement, 'ai-coverage-suggestions')}

              <div className="flex justify-between gap-2 pt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setAiStep('form');
                    setAiRequirements([]);
                  }}
                  disabled={aiSaving}
                >
                  Back
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setMode('idle');
                      setAiStep('form');
                      setAiRequirements([]);
                      setAiVendorType(vendorType || '');
                      setAiPropertyType('');
                      setAiPropertyDetails('');
                    }}
                    disabled={aiSaving}
                  >
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleAiSaveAndAssign} disabled={aiSaving}>
                    {aiSaving ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                        Saving...
                      </>
                    ) : (
                      'Save & Assign'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ── Lease Extraction (tenants only) ── */}
          {mode === 'lease' && leaseStep === 'upload' && (
            <div className="mt-4 space-y-3">
              {/* Drop zone */}
              <div
                className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-white p-6 transition-colors hover:border-emerald-300 hover:bg-emerald-50/30 cursor-pointer"
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleLeaseDrop}
              >
                <FileText className="h-7 w-7 text-slate-400" />
                {leaseFile ? (
                  <p className="mt-2 text-sm font-medium text-emerald-700">{leaseFile.name}</p>
                ) : (
                  <>
                    <p className="mt-2 text-sm font-medium text-slate-600">
                      Drop a lease PDF here or click to select
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">PDF files only</p>
                  </>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={handleLeaseFileChange}
                />
              </div>

              {leaseExtractionError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                  <p className="text-sm text-red-700">{leaseExtractionError}</p>
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs text-amber-800">Template name *</Label>
                <Input
                  value={leaseTemplateName}
                  onChange={(e) => setLeaseTemplateName(e.target.value)}
                  placeholder={`e.g., ${entityName} Lease Requirements`}
                  className="bg-white"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <Button
                  size="sm"
                  onClick={() => {
                    if (!leaseTemplateName.trim()) {
                      setLeaseTemplateName(`${entityName} — Lease Requirements`);
                    }
                    handleLeaseExtract();
                  }}
                  disabled={!leaseFile || leaseExtracting}
                >
                  <FileText className="h-3.5 w-3.5 mr-1" />
                  Extract Requirements
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setMode('idle');
                    setLeaseFile(null);
                    setLeaseTemplateName('');
                    setLeaseExtractionError(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {mode === 'lease' && leaseStep === 'extracting' && (
            <div className="mt-4 flex flex-col items-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
              <p className="mt-3 text-sm font-medium text-slate-700">
                Extracting insurance requirements from lease...
              </p>
              <p className="mt-1 text-xs text-slate-400">
                This may take up to 30 seconds for large documents.
              </p>
            </div>
          )}

          {mode === 'lease' && leaseStep === 'review' && (
            <div className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-amber-800">Template name *</Label>
                <Input
                  value={leaseTemplateName}
                  onChange={(e) => setLeaseTemplateName(e.target.value)}
                  placeholder="Template name"
                  className="bg-white"
                />
              </div>

              {renderRequirementsTable(leaseRequirements, updateLeaseRequirement, 'lease-nudge-coverage-suggestions')}

              <div className="flex justify-between gap-2 pt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setLeaseStep('upload');
                    setLeaseRequirements([]);
                  }}
                  disabled={leaseSaving}
                >
                  Back
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setMode('idle');
                      setLeaseStep('upload');
                      setLeaseRequirements([]);
                      setLeaseFile(null);
                      setLeaseTemplateName('');
                      setLeaseExtractionError(null);
                    }}
                    disabled={leaseSaving}
                  >
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleLeaseSaveAndAssign} disabled={leaseSaving}>
                    {leaseSaving ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                        Saving...
                      </>
                    ) : (
                      'Save & Assign'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
