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
import { createTemplateWithRequirements } from '@/lib/actions/templates';
import { handleActionError, handleActionResult } from '@/lib/handle-action-error';
import {
  COVERAGE_LABELS,
  LIMIT_TYPE_LABELS,
  ALL_COVERAGE_TYPES,
  ALL_LIMIT_TYPES,
  formatLimit,
} from './template-labels';
import type { CoverageType, LimitType, TemplateCategory } from '@/types';

interface ExtractLeaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface EditableRequirement {
  id: string;
  included: boolean;
  coverage_type: CoverageType;
  limit_type: LimitType | null;
  minimum_limit: number | null;
  requires_additional_insured: boolean;
  requires_waiver_of_subrogation: boolean;
  requires_primary_noncontributory: boolean;
}

type Step = 'upload' | 'extracting' | 'review';

export function ExtractLeaseDialog({ open, onOpenChange }: ExtractLeaseDialogProps) {
  const router = useRouter();
  const { showUpgradeModal } = useUpgradeModal();
  const fileRef = useRef<HTMLInputElement>(null);

  // Upload step state
  const [file, setFile] = useState<File | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [category, setCategory] = useState<TemplateCategory>('tenant');

  // Extraction state
  const [step, setStep] = useState<Step>('upload');
  const [extracting, setExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);

  // Review step state
  const [requirements, setRequirements] = useState<EditableRequirement[]>([]);
  const [additionalInsuredName, setAdditionalInsuredName] = useState('');
  const [certificateHolderName, setCertificateHolderName] = useState('');
  const [saving, setSaving] = useState(false);

  function reset() {
    setFile(null);
    setTemplateName('');
    setCategory('tenant');
    setStep('upload');
    setExtracting(false);
    setExtractionError(null);
    setRequirements([]);
    setAdditionalInsuredName('');
    setCertificateHolderName('');
    setSaving(false);
  }

  function handleClose(open: boolean) {
    if (!open) reset();
    onOpenChange(open);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f && f.type === 'application/pdf') {
      setFile(f);
      setExtractionError(null);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f && f.type === 'application/pdf') {
      setFile(f);
      setExtractionError(null);
    }
  }

  const handleExtract = useCallback(async () => {
    if (!file) return;
    if (!templateName.trim()) {
      toast.error('Please enter a template name');
      return;
    }

    setExtracting(true);
    setExtractionError(null);
    setStep('extracting');

    try {
      // Convert file to base64
      const buffer = await file.arrayBuffer();
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
        setStep('upload');
        setExtracting(false);
        return;
      }

      if (!data.success) {
        setExtractionError(data.message || 'Extraction failed');
        setStep('upload');
        setExtracting(false);
        return;
      }

      // Map to editable requirements
      const editableReqs: EditableRequirement[] = data.requirements.map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (r: any, i: number) => ({
          id: `req-${i}`,
          included: true,
          coverage_type: r.coverage_type,
          limit_type: r.limit_type || 'per_occurrence',
          minimum_limit: r.minimum_limit,
          requires_additional_insured: r.requires_additional_insured ?? false,
          requires_waiver_of_subrogation: r.requires_waiver_of_subrogation ?? false,
          requires_primary_noncontributory: r.requires_primary_noncontributory ?? false,
        })
      );

      setRequirements(editableReqs);
      setAdditionalInsuredName(data.additional_insured_name || '');
      setCertificateHolderName(data.certificate_holder_name || '');
      setStep('review');
    } catch (err) {
      console.error('Lease extraction error:', err);
      setExtractionError('Something went wrong. Please try again.');
      setStep('upload');
    } finally {
      setExtracting(false);
    }
  }, [file, templateName, showUpgradeModal]);

  function updateRequirement(id: string, field: string, value: unknown) {
    setRequirements((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  }

  const handleSave = useCallback(async () => {
    const included = requirements.filter((r) => r.included);
    if (included.length === 0) {
      toast.error('Include at least one coverage requirement');
      return;
    }

    setSaving(true);
    try {
      const result = await createTemplateWithRequirements({
        name: templateName.trim(),
        description: `Extracted from uploaded lease document`,
        category,
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
        handleClose(false);
        return;
      }

      toast.success('Template created from lease');
      handleClose(false);
      router.push(`/dashboard/templates/${result.id}`);
    } catch (err) {
      handleActionError(err, 'Failed to create template', showUpgradeModal);
    } finally {
      setSaving(false);
    }
  }, [requirements, templateName, category, showUpgradeModal, router]);

  const defaultName = `Lease Requirements — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={step === 'review' ? 'max-w-3xl max-h-[85vh] overflow-y-auto' : 'max-w-md'}>
        <DialogHeader>
          <DialogTitle>
            {step === 'review' ? 'Review Extracted Requirements' : 'Extract from Lease'}
          </DialogTitle>
          <DialogDescription>
            {step === 'review'
              ? 'Review and adjust the extracted requirements before creating the template.'
              : 'Upload a tenant lease and our AI will extract the insurance requirements and create a compliance template automatically.'}
          </DialogDescription>
        </DialogHeader>

        {/* ── Upload Step ── */}
        {step === 'upload' && (
          <div className="space-y-4">
            {/* Drop zone */}
            <div
              className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-8 transition-colors hover:border-emerald-300 hover:bg-emerald-50/30 cursor-pointer"
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
            >
              <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              {file ? (
                <p className="mt-2 text-sm font-medium text-emerald-700">{file.name}</p>
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
                onChange={handleFileChange}
              />
            </div>

            {extractionError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-sm text-red-700">{extractionError}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Template name *</Label>
              <Input
                value={templateName || defaultName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g., Lease Requirements — Mar 24, 2026"
              />
            </div>

            <div className="space-y-2">
              <Label>Template type</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as TemplateCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tenant">Tenant</SelectItem>
                  <SelectItem value="vendor">Vendor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => handleClose(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!templateName.trim()) setTemplateName(defaultName);
                  handleExtract();
                }}
                disabled={!file || extracting}
              >
                Extract Requirements
              </Button>
            </div>
          </div>
        )}

        {/* ── Extracting Step ── */}
        {step === 'extracting' && (
          <div className="flex flex-col items-center py-12">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
            <p className="mt-4 text-sm font-medium text-slate-700">
              Extracting insurance requirements...
            </p>
            <p className="mt-1 text-xs text-slate-400">
              This may take up to 30 seconds for large documents.
            </p>
          </div>
        )}

        {/* ── Review Step ── */}
        {step === 'review' && (
          <div className="space-y-5">
            {/* Entity fields */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Additional Insured</Label>
                <Input
                  value={additionalInsuredName}
                  onChange={(e) => setAdditionalInsuredName(e.target.value)}
                  placeholder="Entity name"
                  className="text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Certificate Holder</Label>
                <Input
                  value={certificateHolderName}
                  onChange={(e) => setCertificateHolderName(e.target.value)}
                  placeholder="Entity name"
                  className="text-sm"
                />
              </div>
            </div>

            {/* Requirements table */}
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
                        onChange={(e) => updateRequirement(req.id, 'included', e.target.checked)}
                      />

                      {/* Coverage type */}
                      <Select
                        value={req.coverage_type}
                        onValueChange={(v) => updateRequirement(req.id, 'coverage_type', v)}
                      >
                        <SelectTrigger className="w-[200px] text-xs h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ALL_COVERAGE_TYPES.map((ct) => (
                            <SelectItem key={ct} value={ct} className="text-xs">
                              {COVERAGE_LABELS[ct]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Limit type */}
                      <Select
                        value={req.limit_type ?? 'per_occurrence'}
                        onValueChange={(v) => updateRequirement(req.id, 'limit_type', v)}
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
                            updateRequirement(
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
                    </div>

                    {/* Toggles row */}
                    <div className="mt-2 flex gap-4 pl-7">
                      <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <input
                          type="checkbox"
                          className="h-3 w-3 rounded border-slate-300 accent-emerald-600"
                          checked={req.requires_additional_insured}
                          onChange={(e) =>
                            updateRequirement(req.id, 'requires_additional_insured', e.target.checked)
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
                            updateRequirement(req.id, 'requires_waiver_of_subrogation', e.target.checked)
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
                            updateRequirement(req.id, 'requires_primary_noncontributory', e.target.checked)
                          }
                        />
                        Primary &amp; Non-Contributory
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep('upload')}
                disabled={saving}
              >
                Back
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handleClose(false)} disabled={saving}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? 'Creating...' : 'Create Template'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
