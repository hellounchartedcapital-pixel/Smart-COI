'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
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
import { toast } from 'sonner';
import { useUpgradeModal } from '@/components/dashboard/upgrade-modal';
import { createVendor, createTenant } from '@/lib/actions/properties';
import { createTemplateWithRequirements } from '@/lib/actions/templates';
import { handleActionError, handleActionResult } from '@/lib/handle-action-error';
import {
  getCoverageLabel,
  LIMIT_TYPE_LABELS,
  COMMON_COVERAGE_TYPES,
  ALL_LIMIT_TYPES,
} from '@/components/templates/template-labels';
import type { RequirementTemplate, LimitType } from '@/types';
import { Upload, FileText, X, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const VENDOR_TYPE_SUGGESTIONS = [
  'Janitorial',
  'HVAC',
  'Electrical',
  'Plumbing',
  'Roofing',
  'Landscaping',
  'Security',
  'Elevator',
  'Fire Protection',
  'General Contractor',
];

const TENANT_TYPE_SUGGESTIONS = [
  'Retail',
  'Restaurant',
  'Office',
  'Medical',
  'Warehouse',
  'Industrial',
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EntityCreationWizardProps {
  mode: 'vendor' | 'tenant';
  propertyId: string;
  propertyType?: string;
  templates: RequirementTemplate[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (id: string, name: string) => void;
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

type WizardStep = 1 | 2 | 3;
type TemplateOption = 'existing' | 'ai' | 'lease' | 'skip';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EntityCreationWizard({
  mode,
  propertyId,
  propertyType,
  templates,
  open,
  onOpenChange,
  onCreated,
}: EntityCreationWizardProps) {
  const router = useRouter();
  const { showUpgradeModal } = useUpgradeModal();
  const leaseFileRef = useRef<HTMLInputElement>(null);
  const coiFileRef = useRef<HTMLInputElement>(null);

  // ---------------------------------------------------------------------------
  // State — Step 1 (Entity Details)
  // ---------------------------------------------------------------------------
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [vendorType, setVendorType] = useState('');
  const [tenantType, setTenantType] = useState('');
  const [unitSuite, setUnitSuite] = useState('');
  const [showTypeSuggestions, setShowTypeSuggestions] = useState(false);

  // ---------------------------------------------------------------------------
  // State — Step 2 (Template)
  // ---------------------------------------------------------------------------
  const [templateOption, setTemplateOption] = useState<TemplateOption>('skip');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  // AI recommendation state (vendor)
  const [aiVendorType, setAiVendorType] = useState('');
  const [aiPropertyType, setAiPropertyType] = useState('');
  const [aiPropertyDetails, setAiPropertyDetails] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiRequirements, setAiRequirements] = useState<EditableRequirement[]>([]);
  const [aiError, setAiError] = useState<string | null>(null);

  // Lease extraction state (tenant)
  const [leaseFile, setLeaseFile] = useState<File | null>(null);
  const [leaseExtracting, setLeaseExtracting] = useState(false);
  const [leaseRequirements, setLeaseRequirements] = useState<EditableRequirement[]>([]);
  const [leaseError, setLeaseError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // State — Step 3 (COI Upload)
  // ---------------------------------------------------------------------------
  const [coiFile, setCoiFile] = useState<File | null>(null);

  // ---------------------------------------------------------------------------
  // State — Wizard
  // ---------------------------------------------------------------------------
  const [step, setStep] = useState<WizardStep>(1);
  const [saving, setSaving] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const entityLabel = mode === 'vendor' ? 'Vendor' : 'Tenant';
  const filteredTemplates = templates.filter((t) => t.category === mode);
  const typeSuggestions = mode === 'vendor' ? VENDOR_TYPE_SUGGESTIONS : TENANT_TYPE_SUGGESTIONS;
  const currentTypeValue = mode === 'vendor' ? vendorType : tenantType;
  const filteredSuggestions = typeSuggestions.filter((s) =>
    s.toLowerCase().includes(currentTypeValue.toLowerCase())
  );

  const hasData =
    companyName.trim() ||
    contactName.trim() ||
    contactEmail.trim() ||
    vendorType.trim() ||
    tenantType.trim() ||
    unitSuite.trim() ||
    selectedTemplateId ||
    aiRequirements.length > 0 ||
    leaseRequirements.length > 0 ||
    coiFile;

  // ---------------------------------------------------------------------------
  // Reset
  // ---------------------------------------------------------------------------
  function reset() {
    setCompanyName('');
    setContactName('');
    setContactEmail('');
    setContactPhone('');
    setVendorType('');
    setTenantType('');
    setUnitSuite('');
    setShowTypeSuggestions(false);
    setTemplateOption('skip');
    setSelectedTemplateId('');
    setAiVendorType('');
    setAiPropertyType('');
    setAiPropertyDetails('');
    setAiGenerating(false);
    setAiRequirements([]);
    setAiError(null);
    setLeaseFile(null);
    setLeaseExtracting(false);
    setLeaseRequirements([]);
    setLeaseError(null);
    setCoiFile(null);
    setStep(1);
    setSaving(false);
    setShowDiscardConfirm(false);
  }

  function handleClose(newOpen: boolean) {
    if (!newOpen && hasData) {
      setShowDiscardConfirm(true);
      return;
    }
    if (!newOpen) reset();
    onOpenChange(newOpen);
  }

  function confirmDiscard() {
    setShowDiscardConfirm(false);
    reset();
    onOpenChange(false);
  }

  // ---------------------------------------------------------------------------
  // Step 2 — AI Recommendation (Vendor)
  // ---------------------------------------------------------------------------
  const handleAiRecommend = useCallback(async () => {
    const vType = aiVendorType.trim() || vendorType.trim();
    if (!vType) {
      toast.error('Please enter a vendor type');
      return;
    }

    setAiGenerating(true);
    setAiError(null);

    try {
      const response = await fetch('/api/templates/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendor_type: vType,
          property_type: aiPropertyType.trim() || propertyType || undefined,
          property_details: aiPropertyDetails.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (data.upgrade) {
        showUpgradeModal(data.error);
        setAiGenerating(false);
        return;
      }

      if (!data.success) {
        setAiError(data.message || 'Recommendation failed');
        setAiGenerating(false);
        return;
      }

      const reqs: EditableRequirement[] = data.coverages.map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (c: any, i: number) => ({
          id: `ai-${i}`,
          included: true,
          coverage_type: c.coverage_type,
          limit_type: c.limit_type || 'per_occurrence',
          minimum_limit: c.minimum_limit,
          requires_additional_insured: c.requires_additional_insured ?? false,
          requires_waiver_of_subrogation: c.requires_waiver_of_subrogation ?? false,
          requires_primary_noncontributory: c.requires_primary_noncontributory ?? false,
          reasoning: c.reasoning,
        })
      );

      setAiRequirements(reqs);
    } catch (err) {
      console.error('AI recommendation error:', err);
      setAiError('Something went wrong. Please try again.');
    } finally {
      setAiGenerating(false);
    }
  }, [aiVendorType, vendorType, aiPropertyType, aiPropertyDetails, propertyType, showUpgradeModal]);

  // ---------------------------------------------------------------------------
  // Step 2 — Lease Extraction (Tenant)
  // ---------------------------------------------------------------------------
  const handleLeaseExtract = useCallback(async () => {
    if (!leaseFile) return;

    setLeaseExtracting(true);
    setLeaseError(null);

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
        setLeaseExtracting(false);
        return;
      }

      if (!data.success) {
        setLeaseError(data.message || 'Extraction failed');
        setLeaseExtracting(false);
        return;
      }

      const reqs: EditableRequirement[] = data.requirements.map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (r: any, i: number) => ({
          id: `lease-${i}`,
          included: true,
          coverage_type: r.coverage_type,
          limit_type: r.limit_type || 'per_occurrence',
          minimum_limit: r.minimum_limit,
          requires_additional_insured: r.requires_additional_insured ?? false,
          requires_waiver_of_subrogation: r.requires_waiver_of_subrogation ?? false,
          requires_primary_noncontributory: r.requires_primary_noncontributory ?? false,
        })
      );

      setLeaseRequirements(reqs);
    } catch (err) {
      console.error('Lease extraction error:', err);
      setLeaseError('Something went wrong. Please try again.');
    } finally {
      setLeaseExtracting(false);
    }
  }, [leaseFile, showUpgradeModal]);

  // ---------------------------------------------------------------------------
  // Update requirement helper
  // ---------------------------------------------------------------------------
  function updateRequirement(
    setFn: React.Dispatch<React.SetStateAction<EditableRequirement[]>>,
    id: string,
    field: string,
    value: unknown
  ) {
    setFn((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }

  // ---------------------------------------------------------------------------
  // Final submission
  // ---------------------------------------------------------------------------
  const handleCreate = useCallback(async () => {
    if (!companyName.trim()) return;
    setSaving(true);

    try {
      // Step A: Create template if AI or lease requirements were generated
      let templateId = selectedTemplateId || undefined;

      if (templateOption === 'ai' && aiRequirements.length > 0) {
        const included = aiRequirements.filter((r) => r.included);
        if (included.length > 0) {
          const tplResult = await createTemplateWithRequirements({
            name: `${companyName.trim()} — ${vendorType.trim() || 'Vendor'} Requirements`,
            description: `AI-recommended template for ${vendorType.trim() || 'vendor'}`,
            category: 'vendor',
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
          if (handleActionResult(tplResult, 'Failed to create template', showUpgradeModal)) {
            setSaving(false);
            return;
          }
          templateId = tplResult.id;
        }
      }

      if (templateOption === 'lease' && leaseRequirements.length > 0) {
        const included = leaseRequirements.filter((r) => r.included);
        if (included.length > 0) {
          const tplResult = await createTemplateWithRequirements({
            name: `${companyName.trim()} — Lease Requirements`,
            description: 'Extracted from uploaded lease document',
            category: 'tenant',
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
          if (handleActionResult(tplResult, 'Failed to create template', showUpgradeModal)) {
            setSaving(false);
            return;
          }
          templateId = tplResult.id;
        }
      }

      // Step B: Create the entity
      let entityId: string;

      if (mode === 'vendor') {
        const result = await createVendor({
          property_id: propertyId,
          company_name: companyName.trim(),
          contact_name: contactName.trim() || undefined,
          contact_email: contactEmail.trim() || undefined,
          contact_phone: contactPhone.trim() || undefined,
          vendor_type: vendorType.trim() || undefined,
          template_id: templateId,
        });
        if (handleActionResult(result, 'Failed to add vendor', showUpgradeModal)) {
          setSaving(false);
          return;
        }
        entityId = result.id;
      } else {
        const result = await createTenant({
          property_id: propertyId,
          company_name: companyName.trim(),
          contact_name: contactName.trim() || undefined,
          contact_email: contactEmail.trim() || undefined,
          contact_phone: contactPhone.trim() || undefined,
          unit_suite: unitSuite.trim() || undefined,
          tenant_type: tenantType.trim() || undefined,
          template_id: templateId,
        });
        if (handleActionResult(result, 'Failed to add tenant', showUpgradeModal)) {
          setSaving(false);
          return;
        }
        entityId = result.id;
      }

      toast.success(`${companyName.trim()} added successfully`);
      const name = companyName.trim();
      reset();
      onOpenChange(false);
      onCreated?.(entityId, name);

      // If a COI file was selected, navigate to the upload page
      if (coiFile) {
        const param = mode === 'vendor' ? 'vendorId' : 'tenantId';
        router.push(`/dashboard/certificates/upload?${param}=${entityId}`);
      }
    } catch (err) {
      handleActionError(err, `Failed to add ${mode}`, showUpgradeModal);
    } finally {
      setSaving(false);
    }
  }, [
    companyName, contactName, contactEmail, contactPhone,
    vendorType, tenantType, unitSuite,
    templateOption, selectedTemplateId,
    aiRequirements, leaseRequirements,
    mode, propertyId, coiFile,
    showUpgradeModal, onOpenChange, onCreated, router,
  ]);

  // ---------------------------------------------------------------------------
  // Render: Requirements review table (shared by AI and Lease)
  // ---------------------------------------------------------------------------
  function renderRequirementsTable(
    reqs: EditableRequirement[],
    setReqs: React.Dispatch<React.SetStateAction<EditableRequirement[]>>,
    datalistId: string
  ) {
    return (
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Coverage Requirements ({reqs.filter((r) => r.included).length} included)
        </Label>
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {reqs.map((req) => (
            <div
              key={req.id}
              className={`rounded-lg border p-3 transition-colors ${
                req.included
                  ? 'border-slate-200 bg-white'
                  : 'border-slate-100 bg-slate-50 opacity-60'
              }`}
            >
              <div className="flex items-center gap-3 flex-wrap">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 accent-emerald-600"
                  checked={req.included}
                  onChange={(e) => updateRequirement(setReqs, req.id, 'included', e.target.checked)}
                />
                <Input
                  className="w-[180px] text-xs h-8"
                  value={getCoverageLabel(req.coverage_type)}
                  onChange={(e) => updateRequirement(setReqs, req.id, 'coverage_type', e.target.value)}
                  list={datalistId}
                  placeholder="e.g., General Liability"
                />
                <Select
                  value={req.limit_type ?? 'per_occurrence'}
                  onValueChange={(v) => updateRequirement(setReqs, req.id, 'limit_type', v)}
                >
                  <SelectTrigger className="w-[140px] text-xs h-8">
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
                {req.limit_type !== 'statutory' ? (
                  <Input
                    type="number"
                    className="w-[110px] text-xs h-8"
                    placeholder="Amount"
                    value={req.minimum_limit ?? ''}
                    onChange={(e) =>
                      updateRequirement(
                        setReqs,
                        req.id,
                        'minimum_limit',
                        e.target.value ? Number(e.target.value) : null
                      )
                    }
                  />
                ) : (
                  <span className="w-[110px] text-xs text-muted-foreground px-2">Statutory</span>
                )}
                {req.reasoning && (
                  <span
                    className="text-xs text-emerald-600 cursor-help"
                    title={req.reasoning}
                  >
                    Why?
                  </span>
                )}
              </div>
              <div className="mt-2 flex gap-4 pl-7">
                <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <input
                    type="checkbox"
                    className="h-3 w-3 rounded border-slate-300 accent-emerald-600"
                    checked={req.requires_additional_insured}
                    onChange={(e) =>
                      updateRequirement(setReqs, req.id, 'requires_additional_insured', e.target.checked)
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
                      updateRequirement(setReqs, req.id, 'requires_waiver_of_subrogation', e.target.checked)
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
                      updateRequirement(setReqs, req.id, 'requires_primary_noncontributory', e.target.checked)
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
  const canAdvanceStep1 = companyName.trim().length > 0;
  const isWideDialog = step === 2 && (
    (templateOption === 'ai' && aiRequirements.length > 0) ||
    (templateOption === 'lease' && leaseRequirements.length > 0)
  );

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className={`${isWideDialog ? 'max-w-3xl max-h-[85vh] overflow-y-auto' : 'max-w-lg'}`}>
          <DialogHeader>
            <DialogTitle>
              Add {entityLabel}
            </DialogTitle>
            <DialogDescription>
              Step {step} of 3 — {step === 1 ? `${entityLabel} Details` : step === 2 ? 'Requirements Template' : 'Upload COI'}
            </DialogDescription>
          </DialogHeader>

          {/* ── Step 1: Entity Details ── */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Company name *</Label>
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder={mode === 'vendor' ? 'ABC Contractors' : 'Acme Corp'}
                  autoFocus
                />
              </div>

              {mode === 'tenant' && (
                <div className="space-y-2">
                  <Label>Unit / Suite</Label>
                  <Input
                    value={unitSuite}
                    onChange={(e) => setUnitSuite(e.target.value)}
                    placeholder="Suite 400"
                  />
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Contact name</Label>
                  <Input
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="John Smith"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contact email</Label>
                  <Input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div className="relative space-y-2">
                  <Label>{mode === 'vendor' ? 'Vendor type' : 'Tenant type'}</Label>
                  <Input
                    value={currentTypeValue}
                    onChange={(e) => {
                      if (mode === 'vendor') setVendorType(e.target.value);
                      else setTenantType(e.target.value);
                      setShowTypeSuggestions(true);
                    }}
                    onFocus={() => setShowTypeSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowTypeSuggestions(false), 150)}
                    placeholder={mode === 'vendor' ? 'e.g., HVAC, Janitorial' : 'e.g., Retail, Office'}
                  />
                  {showTypeSuggestions && (currentTypeValue.length === 0 || filteredSuggestions.length > 0) && (
                    <div className="absolute left-0 top-full z-10 mt-1 w-full rounded-md border bg-white shadow-md">
                      {(currentTypeValue.length === 0 ? typeSuggestions : filteredSuggestions).map((s) => (
                        <button
                          key={s}
                          type="button"
                          className="block w-full px-3 py-1.5 text-left text-sm hover:bg-slate-50"
                          onMouseDown={() => {
                            if (mode === 'vendor') setVendorType(s);
                            else setTenantType(s);
                            setShowTypeSuggestions(false);
                          }}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleClose(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={!canAdvanceStep1}
                  onClick={() => {
                    if (mode === 'vendor' && vendorType.trim()) {
                      setAiVendorType(vendorType.trim());
                    }
                    setStep(2);
                  }}
                >
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ── Step 2: Requirements Template ── */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Option cards */}
              <div className="grid gap-3 sm:grid-cols-3">
                <button
                  type="button"
                  className={`rounded-lg border-2 p-3 text-left transition-colors ${
                    templateOption === 'existing'
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                  onClick={() => setTemplateOption('existing')}
                >
                  <p className="text-sm font-medium">Choose Existing</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Select a {mode} template
                  </p>
                </button>

                {mode === 'vendor' ? (
                  <button
                    type="button"
                    className={`rounded-lg border-2 p-3 text-left transition-colors ${
                      templateOption === 'ai'
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                    onClick={() => setTemplateOption('ai')}
                  >
                    <p className="text-sm font-medium">AI Recommended</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Generate based on vendor type
                    </p>
                  </button>
                ) : (
                  <button
                    type="button"
                    className={`rounded-lg border-2 p-3 text-left transition-colors ${
                      templateOption === 'lease'
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                    onClick={() => setTemplateOption('lease')}
                  >
                    <p className="text-sm font-medium">Extract from Lease</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Upload lease to extract requirements
                    </p>
                  </button>
                )}

                <button
                  type="button"
                  className={`rounded-lg border-2 p-3 text-left transition-colors ${
                    templateOption === 'skip'
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                  onClick={() => setTemplateOption('skip')}
                >
                  <p className="text-sm font-medium">Skip for Now</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Assign a template later
                  </p>
                </button>
              </div>

              {/* Existing template dropdown */}
              {templateOption === 'existing' && (
                <div className="space-y-2">
                  <Label>Select template</Label>
                  <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select template..." />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredTemplates.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                      {filteredTemplates.length === 0 && (
                        <div className="px-3 py-2 text-sm text-muted-foreground">
                          No {mode} templates found
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* AI Recommendation (vendor) */}
              {templateOption === 'ai' && (
                <div className="space-y-3">
                  {aiRequirements.length === 0 && !aiGenerating && (
                    <>
                      <div className="space-y-2">
                        <Label>Vendor type</Label>
                        <Input
                          value={aiVendorType}
                          onChange={(e) => setAiVendorType(e.target.value)}
                          placeholder="e.g., HVAC, Janitorial"
                        />
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Property type (optional)</Label>
                          <Input
                            value={aiPropertyType}
                            onChange={(e) => setAiPropertyType(e.target.value)}
                            placeholder="e.g., Office, Multifamily"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Property details (optional)</Label>
                          <Input
                            value={aiPropertyDetails}
                            onChange={(e) => setAiPropertyDetails(e.target.value)}
                            placeholder="e.g., 50-unit complex"
                          />
                        </div>
                      </div>
                      {aiError && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                          <p className="text-sm text-red-700">{aiError}</p>
                        </div>
                      )}
                      <Button
                        type="button"
                        onClick={handleAiRecommend}
                        disabled={aiGenerating || !aiVendorType.trim()}
                      >
                        Generate Recommendations
                      </Button>
                    </>
                  )}

                  {aiGenerating && (
                    <div className="flex flex-col items-center py-8">
                      <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
                      <p className="mt-4 text-sm font-medium text-slate-700">
                        Generating recommendations...
                      </p>
                    </div>
                  )}

                  {aiRequirements.length > 0 && !aiGenerating &&
                    renderRequirementsTable(aiRequirements, setAiRequirements, 'wizard-ai-coverage')
                  }
                </div>
              )}

              {/* Lease Extraction (tenant) */}
              {templateOption === 'lease' && (
                <div className="space-y-3">
                  {leaseRequirements.length === 0 && !leaseExtracting && (
                    <>
                      <div
                        className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-6 transition-colors hover:border-emerald-300 hover:bg-emerald-50/30 cursor-pointer"
                        onClick={() => leaseFileRef.current?.click()}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const f = e.dataTransfer.files?.[0];
                          if (f && f.type === 'application/pdf') {
                            setLeaseFile(f);
                            setLeaseError(null);
                          }
                        }}
                      >
                        <FileText className="h-8 w-8 text-slate-400" />
                        {leaseFile ? (
                          <div className="mt-2 flex items-center gap-2">
                            <p className="text-sm font-medium text-emerald-700">{leaseFile.name}</p>
                            <button
                              type="button"
                              className="text-slate-400 hover:text-slate-600"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLeaseFile(null);
                              }}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <p className="mt-2 text-sm font-medium text-slate-600">
                              Drop a lease PDF here or click to select
                            </p>
                            <p className="mt-0.5 text-xs text-slate-400">PDF files only</p>
                          </>
                        )}
                        <input
                          ref={leaseFileRef}
                          type="file"
                          accept="application/pdf"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f && f.type === 'application/pdf') {
                              setLeaseFile(f);
                              setLeaseError(null);
                            }
                          }}
                        />
                      </div>

                      {leaseError && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                          <p className="text-sm text-red-700">{leaseError}</p>
                        </div>
                      )}

                      <Button
                        type="button"
                        onClick={handleLeaseExtract}
                        disabled={!leaseFile || leaseExtracting}
                      >
                        Extract Requirements
                      </Button>
                    </>
                  )}

                  {leaseExtracting && (
                    <div className="flex flex-col items-center py-8">
                      <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
                      <p className="mt-4 text-sm font-medium text-slate-700">
                        Extracting insurance requirements...
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        This may take up to 30 seconds.
                      </p>
                    </div>
                  )}

                  {leaseRequirements.length > 0 && !leaseExtracting &&
                    renderRequirementsTable(leaseRequirements, setLeaseRequirements, 'wizard-lease-coverage')
                  }
                </div>
              )}

              {/* Navigation buttons */}
              <div className="flex justify-between gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep(1)}
                  disabled={saving}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Back
                </Button>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCreate}
                    disabled={saving}
                  >
                    {saving ? 'Creating...' : `Create ${entityLabel}`}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setStep(3)}
                    disabled={saving || aiGenerating || leaseExtracting}
                  >
                    Next
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: Upload COI (Optional) ── */}
          {step === 3 && (
            <div className="space-y-4">
              <div
                className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-8 transition-colors hover:border-emerald-300 hover:bg-emerald-50/30 cursor-pointer"
                onClick={() => coiFileRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const f = e.dataTransfer.files?.[0];
                  if (f && f.type === 'application/pdf') setCoiFile(f);
                }}
              >
                <Upload className="h-8 w-8 text-slate-400" />
                {coiFile ? (
                  <div className="mt-2 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-emerald-600" />
                    <p className="text-sm font-medium text-emerald-700">{coiFile.name}</p>
                    <button
                      type="button"
                      className="text-slate-400 hover:text-slate-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCoiFile(null);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="mt-2 text-sm font-medium text-slate-600">
                      Drop a COI PDF here or click to select
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      Optional — you can upload later
                    </p>
                  </>
                )}
                <input
                  ref={coiFileRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f && f.type === 'application/pdf') setCoiFile(f);
                  }}
                />
              </div>

              {coiFile && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <p className="text-sm text-emerald-700">
                    After creation, you will be redirected to upload and extract this COI.
                  </p>
                </div>
              )}

              <div className="flex justify-between gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep(2)}
                  disabled={saving}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Back
                </Button>
                <div className="flex gap-2">
                  {!coiFile && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCreate}
                      disabled={saving}
                    >
                      {saving ? 'Creating...' : 'Skip & Create'}
                    </Button>
                  )}
                  <Button
                    type="button"
                    onClick={handleCreate}
                    disabled={saving}
                  >
                    {saving ? 'Creating...' : coiFile ? `Create & Upload` : `Create ${entityLabel}`}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Discard confirmation dialog */}
      <Dialog open={showDiscardConfirm} onOpenChange={setShowDiscardConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Discard changes?
            </DialogTitle>
            <DialogDescription>
              You have unsaved data. Are you sure you want to close?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowDiscardConfirm(false)}>
              Keep editing
            </Button>
            <Button variant="destructive" onClick={confirmDiscard}>
              Discard
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
