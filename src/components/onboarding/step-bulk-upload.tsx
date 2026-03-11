'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import posthog from 'posthog-js';
import { createClient } from '@/lib/supabase/client';
import { validatePDFFile, computeFileHash } from '@/lib/utils/file-validation';
import { Button } from '@/components/ui/button';
import { Upload, FileText, X, CheckCircle2, Loader2, AlertTriangle, Building2, Users } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FileEntry {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'extracting' | 'done' | 'failed';
  error?: string;
  certificateId?: string;
  fileHash?: string;
  attempts: number;
  extractedData?: {
    insuredName: string | null;
    coverageCount: number;
  };
}

interface StepBulkUploadProps {
  propertyId: string | null;
  propertyName: string;
  onNext: (uploadedCount: number, coiType?: 'vendor' | 'tenant' | null) => void;
  onSkip: () => void;
  saving: boolean;
}

// Config — batch of 5 with 2s pause between batches, 3 retries with exponential backoff
const BATCH_SIZE = 5;
const BATCH_PAUSE_MS = 2_000;
const CLIENT_RETRY_DELAYS = [2_000, 4_000, 8_000]; // 3 retries with exponential backoff
const FETCH_TIMEOUT_MS = 120_000;
const MAX_FREE_UPLOADS = 50;

let nextFileId = 0;
function generateFileId(): string {
  return `ob_file_${Date.now()}_${nextFileId++}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StepBulkUpload({
  propertyId,
  propertyName,
  onNext,
  onSkip,
  saving,
}: StepBulkUploadProps) {
  const supabase = createClient();

  const [orgId, setOrgId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [coiType, setCoiType] = useState<'vendor' | 'tenant' | null>(null);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [allDone, setAllDone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef(false);

  // Bootstrap auth
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data: profile } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single();
      if (profile?.organization_id) setOrgId(profile.organization_id);
    })();
  }, [supabase]);

  // Track when all processing is complete
  useEffect(() => {
    if (processing && files.length > 0 && files.every((f) => f.status === 'done' || f.status === 'failed')) {
      setAllDone(true);
      setProcessing(false);
    }
  }, [files, processing]);

  // File handlers
  const addFiles = useCallback(async (newFiles: FileList | File[]) => {
    const entries: FileEntry[] = [];
    for (const f of Array.from(newFiles)) {
      const validation = await validatePDFFile(f);
      if (!validation.valid) {
        entries.push({ file: f, id: generateFileId(), status: 'failed', error: validation.error, attempts: 0 });
      } else {
        entries.push({ file: f, id: generateFileId(), status: 'pending', attempts: 0 });
      }
    }
    setFiles((prev) => {
      const combined = [...prev, ...entries];
      // Cap at 50 files
      if (combined.length > MAX_FREE_UPLOADS) {
        return combined.slice(0, MAX_FREE_UPLOADS);
      }
      return combined;
    });
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
  }, [addFiles]);

  // Process files: upload → extract
  const processFiles = useCallback(async () => {
    if (!orgId || !userId || !propertyId) return;

    setProcessing(true);
    setAllDone(false);
    abortRef.current = false;

    const pendingFiles = files.filter((f) => f.status === 'pending' || f.status === 'failed');

    async function processOne(entry: FileEntry) {
      if (abortRef.current) return;

      setFiles((prev) =>
        prev.map((f) => (f.id === entry.id ? { ...f, status: 'uploading', error: undefined } : f))
      );

      try {
        let certId = entry.certificateId;

        if (!certId) {
          const fileHash = await computeFileHash(entry.file);
          const storagePath = `bulk/${orgId}/${Date.now()}_${entry.file.name}`;

          const { error: uploadError } = await supabase.storage
            .from('coi-documents')
            .upload(storagePath, entry.file, { upsert: false });
          if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

          const { data: cert, error: certError } = await supabase
            .from('certificates')
            .insert({
              organization_id: orgId,
              file_path: storagePath,
              file_hash: fileHash,
              upload_source: 'pm_upload',
              processing_status: 'processing',
            })
            .select('id')
            .single();

          if (certError || !cert) throw new Error(`Record failed: ${certError?.message}`);
          certId = cert.id;
          posthog.capture('coi_uploaded', { source: 'onboarding_bulk' });

          setFiles((prev) =>
            prev.map((f) =>
              f.id === entry.id ? { ...f, status: 'extracting', certificateId: certId, fileHash } : f
            )
          );
        } else {
          setFiles((prev) =>
            prev.map((f) => (f.id === entry.id ? { ...f, status: 'extracting', error: undefined } : f))
          );
        }

        // Extract with retry
        let lastError = '';
        const maxAttempts = CLIENT_RETRY_DELAYS.length + 1;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          if (abortRef.current) return;

          setFiles((prev) =>
            prev.map((f) =>
              f.id === entry.id
                ? { ...f, status: 'extracting', error: attempt > 0 ? `Attempt ${attempt + 1}...` : undefined }
                : f
            )
          );

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

          let extractRes: Response;
          try {
            extractRes = await fetch('/api/certificates/extract', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ certificateId: certId }),
              signal: controller.signal,
            });
          } catch {
            clearTimeout(timeoutId);
            lastError = 'Network error';
            if (attempt < CLIENT_RETRY_DELAYS.length) {
              await new Promise((resolve) => setTimeout(resolve, CLIENT_RETRY_DELAYS[attempt]));
            }
            continue;
          }
          clearTimeout(timeoutId);

          if (extractRes.ok) {
            const extractBody = await extractRes.json();
            const { data: updatedCert } = await supabase
              .from('certificates')
              .select('insured_name')
              .eq('id', certId!)
              .single();

            // Auto-assign certificate to a vendor or tenant linked to the property
            const insuredName = updatedCert?.insured_name || entry.file.name.replace(/\.pdf$/i, '');
            if (propertyId && coiType) {
              try {
                if (coiType === 'vendor') {
                  // Check if vendor with same name already exists for this property
                  const { data: existing } = await supabase
                    .from('vendors')
                    .select('id')
                    .eq('organization_id', orgId!)
                    .eq('property_id', propertyId)
                    .ilike('company_name', insuredName)
                    .is('deleted_at', null)
                    .maybeSingle();

                  let vendorId = existing?.id;
                  if (!vendorId) {
                    const { data: newVendor } = await supabase
                      .from('vendors')
                      .insert({
                        organization_id: orgId!,
                        property_id: propertyId,
                        company_name: insuredName,
                        compliance_status: 'under_review',
                      })
                      .select('id')
                      .single();
                    vendorId = newVendor?.id;
                  }

                  if (vendorId) {
                    await supabase
                      .from('certificates')
                      .update({ vendor_id: vendorId })
                      .eq('id', certId!);
                  }
                } else {
                  // Tenant flow
                  const { data: existing } = await supabase
                    .from('tenants')
                    .select('id')
                    .eq('organization_id', orgId!)
                    .eq('property_id', propertyId)
                    .ilike('company_name', insuredName)
                    .is('deleted_at', null)
                    .maybeSingle();

                  let tenantId = existing?.id;
                  if (!tenantId) {
                    const { data: newTenant } = await supabase
                      .from('tenants')
                      .insert({
                        organization_id: orgId!,
                        property_id: propertyId,
                        company_name: insuredName,
                        compliance_status: 'under_review',
                      })
                      .select('id')
                      .single();
                    tenantId = newTenant?.id;
                  }

                  if (tenantId) {
                    await supabase
                      .from('certificates')
                      .update({ tenant_id: tenantId })
                      .eq('id', certId!);
                  }
                }
              } catch (assignErr) {
                console.error('Auto-assign failed:', assignErr);
                // Non-fatal: certificate is still extracted, just not assigned
              }
            }

            setFiles((prev) =>
              prev.map((f) =>
                f.id === entry.id
                  ? {
                      ...f,
                      status: 'done',
                      error: undefined,
                      attempts: attempt + 1,
                      extractedData: {
                        insuredName: updatedCert?.insured_name ?? null,
                        coverageCount: extractBody.coverages ?? 0,
                      },
                    }
                  : f
              )
            );
            return;
          }

          const body = await extractRes.json().catch(() => ({}));
          lastError = body.error ?? `Failed (HTTP ${extractRes.status})`;

          if (extractRes.status === 403 || extractRes.status === 422) {
            throw new Error(lastError);
          }

          if (attempt < CLIENT_RETRY_DELAYS.length) {
            await new Promise((resolve) => setTimeout(resolve, CLIENT_RETRY_DELAYS[attempt]));
          }
        }

        throw new Error(lastError);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Processing failed';
        // Mark as "Needs Review" in DB if we have a certificate ID
        if (entry.certificateId) {
          supabase
            .from('certificates')
            .update({ processing_status: 'needs_review' })
            .eq('id', entry.certificateId)
            .then(() => { /* fire and forget */ });
        }
        setFiles((prev) =>
          prev.map((f) =>
            f.id === entry.id
              ? { ...f, status: 'failed', error: `Needs Review: ${message}`, attempts: (f.attempts || 0) + 1 }
              : f
          )
        );
      }
    }

    // Batch processing: process BATCH_SIZE files concurrently, then pause before next batch
    const queue = [...pendingFiles];

    while (queue.length > 0 && !abortRef.current) {
      const batch = queue.splice(0, BATCH_SIZE);
      await Promise.all(batch.map((entry) => processOne(entry)));
      // Pause between batches to prevent API overload
      if (queue.length > 0 && !abortRef.current) {
        await new Promise((resolve) => setTimeout(resolve, BATCH_PAUSE_MS));
      }
    }
  }, [orgId, userId, propertyId, coiType, files, supabase]);

  // Stats
  const pendingCount = files.filter((f) => f.status === 'pending').length;
  const doneCount = files.filter((f) => f.status === 'done').length;
  const failedCount = files.filter((f) => f.status === 'failed').length;
  const activeCount = files.filter((f) => f.status === 'uploading' || f.status === 'extracting').length;
  const totalCount = files.length;

  // No property — show message
  if (!propertyId) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Upload your COIs
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Add a property first to start uploading certificates.
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
          <p className="text-sm text-muted-foreground">
            You skipped adding a property. You can upload COIs from the dashboard after adding one.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <Button size="lg" className="w-full font-semibold" onClick={() => onNext(0)} disabled={saving}>
            {saving ? 'Finishing...' : 'Continue to Requirements'}
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Upload your COIs
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Drop your certificates for <span className="font-medium text-foreground">{propertyName}</span>.
          Our AI will extract vendor names, coverage types, limits, and dates automatically.
        </p>
      </div>

      {/* COI type selection */}
      {!coiType && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">
            What type of COIs are you uploading?
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setCoiType('vendor')}
              className="flex flex-col items-center gap-2 rounded-xl border-2 border-slate-200 bg-white p-5 transition-all hover:border-brand hover:bg-emerald-50"
            >
              <Building2 className="h-7 w-7 text-emerald-600" />
              <span className="text-sm font-semibold text-foreground">Vendor COIs</span>
              <span className="text-xs text-muted-foreground text-center">
                Contractors, service providers, maintenance companies
              </span>
            </button>
            <button
              type="button"
              onClick={() => setCoiType('tenant')}
              className="flex flex-col items-center gap-2 rounded-xl border-2 border-slate-200 bg-white p-5 transition-all hover:border-brand hover:bg-emerald-50"
            >
              <Users className="h-7 w-7 text-emerald-600" />
              <span className="text-sm font-semibold text-foreground">Tenant COIs</span>
              <span className="text-xs text-muted-foreground text-center">
                Renters insurance, tenant liability certificates
              </span>
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            You can upload the other type after completing this batch.
          </p>
        </div>
      )}

      {/* Upload limit badge */}
      {coiType && (
      <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
        <Upload className="h-5 w-5 text-emerald-600" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-emerald-800">
            Upload up to {MAX_FREE_UPLOADS} {coiType} COIs free
          </p>
          <p className="text-xs text-emerald-700">
            {totalCount > 0
              ? `${totalCount} of ${MAX_FREE_UPLOADS} slots used`
              : 'Drag & drop PDF certificates to get started'}
          </p>
        </div>
        {!processing && !allDone && (
          <button
            type="button"
            onClick={() => { setCoiType(null); setFiles([]); setAllDone(false); }}
            className="text-xs font-medium text-emerald-700 hover:text-emerald-900 underline underline-offset-2"
          >
            Switch type
          </button>
        )}
      </div>
      )}

      {/* Drop zone (hidden when processing, done, or no type selected) */}
      {coiType && !processing && !allDone && (
        <div
          className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
            dragActive
              ? 'border-brand bg-emerald-50'
              : 'border-slate-300 bg-white hover:border-brand hover:bg-slate-50'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) addFiles(e.target.files);
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
          />
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
            <Upload className="h-6 w-6 text-emerald-600" />
          </div>
          <p className="text-sm font-medium text-foreground">
            Drag &amp; drop PDF certificates here
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            or click to browse &middot; up to {MAX_FREE_UPLOADS} files
          </p>
        </div>
      )}

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">
              {totalCount} file{totalCount !== 1 ? 's' : ''} selected
            </p>
            {(processing || allDone) && (
              <p className="text-xs text-muted-foreground">
                {doneCount} done{failedCount > 0 ? `, ${failedCount} failed` : ''}
                {activeCount > 0 ? `, ${activeCount} processing` : ''}
              </p>
            )}
          </div>

          {/* Progress bar during processing */}
          {(processing || allDone) && (
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-brand transition-all duration-500"
                style={{ width: `${totalCount > 0 ? ((doneCount + failedCount) / totalCount) * 100 : 0}%` }}
              />
            </div>
          )}

          <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-200 bg-white">
            {files.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-3 border-b border-slate-100 px-4 py-2.5 last:border-0"
              >
                {/* Icon */}
                {entry.status === 'done' ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                ) : entry.status === 'failed' ? (
                  <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
                ) : entry.status === 'uploading' || entry.status === 'extracting' ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-brand" />
                ) : (
                  <FileText className="h-4 w-4 shrink-0 text-slate-400" />
                )}

                {/* Name + status */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-foreground">{entry.file.name}</p>
                  {entry.status === 'done' && entry.extractedData?.insuredName && (
                    <p className="truncate text-xs text-emerald-600">
                      {entry.extractedData.insuredName}
                      {entry.extractedData.coverageCount > 0 && ` \u00b7 ${entry.extractedData.coverageCount} coverages`}
                    </p>
                  )}
                  {entry.status === 'extracting' && (
                    <p className="text-xs text-muted-foreground">
                      {entry.error || 'Extracting coverage data...'}
                    </p>
                  )}
                  {entry.status === 'uploading' && (
                    <p className="text-xs text-muted-foreground">Uploading...</p>
                  )}
                  {entry.status === 'failed' && (
                    <p className="truncate text-xs text-red-500">
                      <span className="inline-flex items-center rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700 mr-1">
                        Needs Review
                      </span>
                      {entry.error?.replace(/^Needs Review: /, '')}
                    </p>
                  )}
                </div>

                {/* Remove button (only when not processing) */}
                {!processing && !allDone && (
                  <button
                    onClick={(e) => { e.stopPropagation(); removeFile(entry.id); }}
                    className="shrink-0 rounded p-1 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3">
        {!processing && !allDone && pendingCount > 0 && (
          <Button
            size="lg"
            className="w-full font-semibold"
            onClick={processFiles}
            disabled={!propertyId || !coiType || pendingCount === 0}
          >
            Upload &amp; Extract {pendingCount} COI{pendingCount !== 1 ? 's' : ''}
          </Button>
        )}

        {processing && (
          <Button size="lg" className="w-full font-semibold" disabled>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing {activeCount} of {totalCount} files...
          </Button>
        )}

        {allDone && (
          <Button
            size="lg"
            className="w-full font-semibold"
            onClick={() => onNext(doneCount, coiType)}
            disabled={saving}
          >
            {saving ? 'Finishing...' : `Continue with ${doneCount} COI${doneCount !== 1 ? 's' : ''}`}
          </Button>
        )}

        {files.length === 0 && (
          <Button
            size="lg"
            className="w-full font-semibold"
            onClick={() => onNext(0)}
            disabled={saving}
          >
            {saving ? 'Finishing...' : 'Continue without uploading'}
          </Button>
        )}

        {!processing && (
          <button
            type="button"
            onClick={onSkip}
            className="text-center text-sm text-muted-foreground hover:text-foreground"
            disabled={saving || processing}
          >
            Skip to Dashboard
          </button>
        )}
      </div>
    </div>
  );
}
