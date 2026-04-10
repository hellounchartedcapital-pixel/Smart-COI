'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import posthog from 'posthog-js';
import { createClient } from '@/lib/supabase/client';
import { validatePDFFile, computeFileHash } from '@/lib/utils/file-validation';
import { autoAssignCertificateToEntity } from '@/lib/actions/certificates';
import { BatchProgressTracker } from '@/components/dashboard/batch-progress-tracker';
import { Button } from '@/components/ui/button';
import { Upload, FileText, X, CheckCircle2, Loader2, AlertTriangle, Building2, Users, RotateCcw } from 'lucide-react';
import { getTerminology } from '@/lib/constants/terminology';
import type { Industry, CoveredEntityType } from '@/types';

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
  industry: Industry | null;
  onNext: (uploadedCount: number, coiType?: CoveredEntityType | null) => void;
  onSkip: () => void;
  saving: boolean;
}

// Config
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
  industry,
  onNext,
  onSkip,
  saving,
}: StepBulkUploadProps) {
  const supabase = createClient();
  const terms = getTerminology(industry);

  const [orgId, setOrgId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // For non-PM industries without tenants, auto-set the entity type
  const defaultEntityType: CoveredEntityType | null = (() => {
    if (industry === 'property_management') return null; // user must choose
    if (industry === 'construction') return 'subcontractor';
    if (industry === 'logistics') return 'carrier';
    if (industry === 'manufacturing') return 'supplier';
    return 'vendor';
  })();
  const [coiType, setCoiType] = useState<CoveredEntityType | null>(defaultEntityType);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [allDone, setAllDone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef(false);

  // Background batch processing state
  const [batchId, setBatchId] = useState<string | null>(null);
  const [batchTotalCerts, setBatchTotalCerts] = useState(0);

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

  // Track when all processing is complete (or canceled)
  useEffect(() => {
    if (processing && files.length > 0 && files.every((f) => f.status === 'done' || f.status === 'failed' || f.status === 'pending')) {
      // Only transition when no files are actively uploading/extracting
      const hasActive = files.some((f) => f.status === 'uploading' || f.status === 'extracting');
      if (!hasActive) {
        setAllDone(true);
        setProcessing(false);
      }
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

  const retryFile = useCallback((id: string) => {
    setFiles((prev) => prev.map((f) => f.id === id ? { ...f, status: 'pending' as const, error: undefined } : f));
  }, []);

  const retryAllFailed = useCallback(() => {
    setFiles((prev) => prev.map((f) => f.status === 'failed' ? { ...f, status: 'pending' as const, error: undefined } : f));
  }, []);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
  }, [addFiles]);

  // Process files: upload to storage, then hand off extraction to background batch
  const processFiles = useCallback(async () => {
    if (!orgId || !userId) return;

    setProcessing(true);
    setAllDone(false);
    abortRef.current = false;

    const pendingFiles = files.filter((f) => f.status === 'pending' || f.status === 'failed');

    // Phase 1: Upload all files to storage + create certificate records (client-side, fast)
    const certificateIds: string[] = [];

    for (const entry of pendingFiles) {
      if (abortRef.current) break;

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
              upload_source: 'user_upload',
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

        certificateIds.push(certId!);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Upload failed';
        setFiles((prev) =>
          prev.map((f) =>
            f.id === entry.id
              ? { ...f, status: 'failed', error: `Processing failed: ${message}`, attempts: (f.attempts || 0) + 1 }
              : f
          )
        );
      }
    }

    if (certificateIds.length === 0) return;

    // Phase 2: Submit all cert IDs to background batch extraction
    try {
      const res = await fetch('/api/certificates/batch-extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          certificateIds,
          propertyId: propertyId ?? null,
          entityType: coiType ?? 'vendor',
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Batch failed (HTTP ${res.status})`);
      }

      const { batchId: newBatchId, totalCerts } = await res.json();
      setBatchId(newBatchId);
      setBatchTotalCerts(totalCerts);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Batch submission failed';
      setFiles((prev) =>
        prev.map((f) =>
          f.status === 'extracting' ? { ...f, status: 'failed', error: message } : f
        )
      );
    }
  }, [orgId, userId, propertyId, coiType, files, supabase]);

  // Handle batch completion: fetch results, auto-assign entities, mark done
  const handleBatchComplete = useCallback(async () => {
    const certIds = files
      .filter((f) => f.certificateId && f.status === 'extracting')
      .map((f) => f.certificateId!);

    if (certIds.length > 0) {
      // Fetch final status for all certificates
      const { data: certs } = await supabase
        .from('certificates')
        .select('id, insured_name, processing_status')
        .in('id', certIds);

      const { data: coverages } = await supabase
        .from('extracted_coverages')
        .select('certificate_id')
        .in('certificate_id', certIds);

      const coverageCounts: Record<string, number> = {};
      coverages?.forEach((c) => {
        coverageCounts[c.certificate_id] = (coverageCounts[c.certificate_id] || 0) + 1;
      });

      // Auto-assign extracted certificates to entities
      if (certs && coiType && orgId) {
        for (const cert of certs) {
          if (cert.processing_status === 'extracted') {
            const insuredName = cert.insured_name || 'Unknown';
            try {
              await autoAssignCertificateToEntity({
                certificateId: cert.id,
                orgId,
                propertyId: propertyId ?? null,
                insuredName,
                entityType: coiType,
              });
            } catch (assignErr) {
              console.error('Auto-assign failed:', assignErr);
            }
          }
        }
      }

      // Update file statuses based on cert processing_status
      setFiles((prev) =>
        prev.map((f) => {
          if (!f.certificateId) return f;
          const cert = certs?.find((c) => c.id === f.certificateId);
          if (!cert) return f;

          if (cert.processing_status === 'extracted') {
            return {
              ...f,
              status: 'done' as const,
              error: undefined,
              extractedData: {
                insuredName: cert.insured_name ?? null,
                coverageCount: coverageCounts[cert.id] ?? 0,
              },
            };
          } else if (cert.processing_status === 'failed') {
            return { ...f, status: 'failed' as const, error: 'Extraction failed' };
          }
          return f;
        })
      );
    }

    setBatchId(null);
  }, [files, supabase, coiType, orgId, propertyId]);

  // Stats
  const pendingCount = files.filter((f) => f.status === 'pending').length;
  const doneCount = files.filter((f) => f.status === 'done').length;
  const failedCount = files.filter((f) => f.status === 'failed').length;
  const activeCount = files.filter((f) => f.status === 'uploading' || f.status === 'extracting').length;
  const totalCount = files.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Upload your COIs
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {propertyName ? (
            <>Drop your certificates for <span className="font-medium text-foreground">{propertyName}</span>. </>
          ) : null}
          Our AI will extract names, coverage types, limits, and dates automatically.
        </p>
      </div>

      {/* COI type selection — only shown for PM (which has vendor + tenant) */}
      {!coiType && terms.hasTenants && (
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
              <span className="text-sm font-semibold text-foreground">{terms.entity} COIs</span>
              <span className="text-xs text-muted-foreground text-center">
                {terms.entityDescription}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setCoiType('tenant')}
              className="flex flex-col items-center gap-2 rounded-xl border-2 border-slate-200 bg-white p-5 transition-all hover:border-brand hover:bg-emerald-50"
            >
              <Users className="h-7 w-7 text-emerald-600" />
              <span className="text-sm font-semibold text-foreground">{terms.tenant} COIs</span>
              <span className="text-xs text-muted-foreground text-center">
                {terms.tenantDescription}
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

          {/* Background batch progress tracker */}
          {batchId && (
            <BatchProgressTracker
              batchId={batchId}
              totalCerts={batchTotalCerts}
              onComplete={handleBatchComplete}
            />
          )}

          {/* Progress bar during upload phase (before batch handoff) */}
          {!batchId && (processing || allDone) && (
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-brand transition-all duration-500"
                style={{ width: `${totalCount > 0 ? (doneCount / totalCount) * 100 : 0}%` }}
              />
              {failedCount > 0 && (
                <div
                  className="h-full -mt-2 rounded-full bg-red-400 transition-all duration-500"
                  style={{ width: `${(failedCount / totalCount) * 100}%`, marginLeft: `${(doneCount / totalCount) * 100}%` }}
                />
              )}
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
                        Failed
                      </span>
                      {entry.error?.replace(/^Processing failed: /, '')}
                    </p>
                  )}
                </div>

                {/* Retry button for failed files */}
                {entry.status === 'failed' && !processing && (
                  <button
                    onClick={(e) => { e.stopPropagation(); retryFile(entry.id); }}
                    className="shrink-0 rounded p-1 text-amber-500 hover:text-amber-700"
                    title="Retry"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                )}

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
            disabled={!coiType || pendingCount === 0}
          >
            Upload &amp; Extract {pendingCount} COI{pendingCount !== 1 ? 's' : ''}
          </Button>
        )}

        {processing && !batchId && (
          <>
            <Button size="lg" className="w-full font-semibold" disabled>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading files...
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full font-semibold text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => { abortRef.current = true; }}
            >
              Cancel Upload
            </Button>
          </>
        )}

        {allDone && (
          <>
            <Button
              size="lg"
              className="w-full font-semibold"
              onClick={() => onNext(doneCount, coiType)}
              disabled={saving}
            >
              {saving ? 'Finishing...' : `Continue with ${doneCount} COI${doneCount !== 1 ? 's' : ''}`}
            </Button>
            {failedCount > 0 && (
              <Button
                size="lg"
                variant="outline"
                className="w-full font-semibold"
                onClick={() => { retryAllFailed(); setAllDone(false); }}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Retry {failedCount} Failed File{failedCount !== 1 ? 's' : ''}
              </Button>
            )}
          </>
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
