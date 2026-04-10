'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import posthog from 'posthog-js';
import { createClient } from '@/lib/supabase/client';
import { createOrgAfterSignup, completeOnboarding } from '@/lib/actions/auth';
import { validatePDFFile, computeFileHash } from '@/lib/utils/file-validation';
import { BatchProgressTracker } from '@/components/dashboard/batch-progress-tracker';
import { INDUSTRY_OPTIONS } from '@/lib/constants/industries';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Upload, FileText, X, CheckCircle2, Loader2 } from 'lucide-react';
import type { Industry } from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type OnboardingStep = 'industry' | 'upload';

interface FileEntry {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'extracting' | 'done' | 'failed';
  error?: string;
  certificateId?: string;
  fileHash?: string;
}

const MAX_FREE_UPLOADS = 50;

let nextFileId = 0;
function generateFileId(): string {
  return `ob_file_${Date.now()}_${nextFileId++}`;
}

// ---------------------------------------------------------------------------
// Onboarding page — simplified 2-step flow (industry → upload)
// ---------------------------------------------------------------------------

export default function OnboardingSetupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<OnboardingStep>('industry');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auth state
  const [orgId, setOrgId] = useState<string | null>(null);
  const authUserIdRef = useRef<string | null>(null);
  const authEmailRef = useRef<string | null>(null);
  const authNameRef = useRef<string | null>(null);

  // Step 1: Industry
  const [selectedIndustry, setSelectedIndustry] = useState<Industry | null>(null);

  // Step 2: Upload
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [batchTotalCerts, setBatchTotalCerts] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ---- Bootstrap auth (run once) ----
  const didLoad = useRef(false);
  useEffect(() => {
    if (didLoad.current) return;
    didLoad.current = true;

    async function loadUserOrg() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      authUserIdRef.current = user.id;
      authEmailRef.current = user.email ?? '';
      authNameRef.current = user.user_metadata?.full_name ?? '';

      const { data: profile } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (profile?.organization_id) {
        setOrgId(profile.organization_id);

        // If industry already selected, skip to upload step
        const { data: org } = await supabase
          .from('organizations')
          .select('industry')
          .eq('id', profile.organization_id)
          .single();

        if (org?.industry) {
          setSelectedIndustry(org.industry as Industry);
          setStep('upload');
        }
      }
    }

    loadUserOrg();
  }, [supabase, router]);

  // ---- Ensure org exists ----
  async function ensureOrgAndProfile(): Promise<string> {
    if (orgId) return orgId;
    if (!authUserIdRef.current) throw new Error('Not authenticated. Please refresh and try again.');

    const { orgId: newOrgId } = await createOrgAfterSignup(
      authUserIdRef.current,
      authEmailRef.current ?? '',
      authNameRef.current ?? '',
    );
    setOrgId(newOrgId);
    return newOrgId;
  }

  // ---- Finish onboarding → dashboard ----
  async function finishOnboarding() {
    let currentOrgId = orgId;
    if (!currentOrgId) {
      currentOrgId = await ensureOrgAndProfile();
    }
    await completeOnboarding(currentOrgId);
    posthog.capture('onboarding_completed');
    router.push('/dashboard');
    router.refresh();
  }

  // ---- Step 1: Save industry → advance to upload ----
  async function handleIndustrySubmit() {
    if (!selectedIndustry) return;
    setSaving(true);
    setError(null);

    try {
      const currentOrgId = await ensureOrgAndProfile();

      const { error: updateError } = await supabase
        .from('organizations')
        .update({ industry: selectedIndustry })
        .eq('id', currentOrgId);

      if (updateError) throw updateError;

      posthog.capture('onboarding_step_completed', { step: 'select_industry', industry: selectedIndustry });
      setStep('upload');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save industry');
    } finally {
      setSaving(false);
    }
  }

  // ---- Step 2: Upload files → batch extract ----
  async function addFiles(newFiles: FileList | File[]) {
    const entries: FileEntry[] = [];
    for (const f of Array.from(newFiles)) {
      const validation = await validatePDFFile(f);
      entries.push(
        validation.valid
          ? { file: f, id: generateFileId(), status: 'pending' }
          : { file: f, id: generateFileId(), status: 'failed', error: validation.error }
      );
    }
    setFiles((prev) => {
      const combined = [...prev, ...entries];
      return combined.length > MAX_FREE_UPLOADS ? combined.slice(0, MAX_FREE_UPLOADS) : combined;
    });
  }

  function removeFile(id: string) {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }

  async function handleStartUpload() {
    if (!orgId) return;
    const pending = files.filter((f) => f.status === 'pending');
    if (pending.length === 0) return;

    setUploading(true);
    setError(null);

    // Phase 1: Upload all files to storage + create certificate records
    const certificateIds: string[] = [];

    for (const entry of pending) {
      setFiles((prev) =>
        prev.map((f) => (f.id === entry.id ? { ...f, status: 'uploading', error: undefined } : f))
      );

      try {
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
        posthog.capture('coi_uploaded', { source: 'onboarding' });

        setFiles((prev) =>
          prev.map((f) =>
            f.id === entry.id ? { ...f, status: 'extracting', certificateId: cert.id, fileHash } : f
          )
        );
        certificateIds.push(cert.id);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Upload failed';
        setFiles((prev) =>
          prev.map((f) => (f.id === entry.id ? { ...f, status: 'failed', error: message } : f))
        );
      }
    }

    if (certificateIds.length === 0) {
      setUploading(false);
      return;
    }

    // Phase 2: Submit to background batch extraction
    try {
      const res = await fetch('/api/certificates/batch-extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ certificateIds }),
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
      setError(message);
      setFiles((prev) =>
        prev.map((f) => (f.status === 'extracting' ? { ...f, status: 'failed', error: message } : f))
      );
      setUploading(false);
    }
  }

  const handleBatchComplete = useCallback(async () => {
    setBatchId(null);
    setUploading(false);

    // Mark all extracting files as done
    setFiles((prev) =>
      prev.map((f) =>
        f.status === 'extracting' ? { ...f, status: 'done' } : f
      )
    );

    // Complete onboarding and go to dashboard
    try {
      await finishOnboarding();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete setup');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  // ---- Skip upload → finish onboarding ----
  async function handleSkipUpload() {
    setSaving(true);
    setError(null);
    try {
      await finishOnboarding();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to finish setup');
    } finally {
      setSaving(false);
    }
  }

  // ---- Derived state ----
  const pendingCount = files.filter((f) => f.status === 'pending').length;
  const doneCount = files.filter((f) => f.status === 'done').length;
  const failedCount = files.filter((f) => f.status === 'failed').length;
  const stepNumber = step === 'industry' ? 1 : 2;

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="space-y-10">
      {/* Step indicator */}
      <div className="space-y-3">
        <div className="flex items-center justify-center gap-4">
          {['Select Industry', 'Upload COIs'].map((label, idx) => {
            const num = idx + 1;
            const isActive = num === stepNumber;
            const isComplete = num < stepNumber;
            return (
              <React.Fragment key={label}>
                {idx > 0 && <div className="h-px w-10 bg-slate-200" />}
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                      isComplete
                        ? 'bg-brand text-white'
                        : isActive
                          ? 'bg-brand text-white'
                          : 'border-2 border-slate-300 bg-white text-slate-400'
                    }`}
                  >
                    {isComplete ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      num
                    )}
                  </div>
                  <span
                    className={`text-sm ${
                      isActive ? 'font-semibold text-foreground' : isComplete ? 'font-medium text-brand-dark' : 'text-muted-foreground'
                    }`}
                  >
                    {label}
                  </span>
                </div>
              </React.Fragment>
            );
          })}
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-brand transition-all duration-500"
            style={{ width: `${(stepNumber / 2) * 100}%` }}
          />
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* ================================================================ */}
      {/* STEP 1: SELECT INDUSTRY                                          */}
      {/* ================================================================ */}
      {step === 'industry' && (
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Welcome to SmartCOI</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              What industry are you in? This helps us tailor the experience for you.
            </p>
          </div>

          <div className="space-y-2">
            <Select
              value={selectedIndustry ?? undefined}
              onValueChange={(v) => setSelectedIndustry(v as Industry)}
            >
              <SelectTrigger className="w-full text-sm">
                <SelectValue placeholder="Select your industry..." />
              </SelectTrigger>
              <SelectContent>
                {INDUSTRY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              size="lg"
              className="w-full font-semibold"
              disabled={saving || !selectedIndustry}
              onClick={handleIndustrySubmit}
            >
              {saving ? 'Saving...' : 'Continue'}
            </Button>
            <button
              type="button"
              onClick={handleSkipUpload}
              className="text-center text-sm text-muted-foreground hover:text-foreground"
              disabled={saving}
            >
              Skip to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* STEP 2: UPLOAD COIs                                              */}
      {/* ================================================================ */}
      {step === 'upload' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Upload your COIs</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Drop your certificates below. Our AI will extract coverage data, verify compliance, and build your vendor roster automatically.
            </p>
          </div>

          {/* Upload limit badge */}
          <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
            <Upload className="h-5 w-5 text-emerald-600" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-emerald-800">
                Upload up to {MAX_FREE_UPLOADS} COIs free
              </p>
              <p className="text-xs text-emerald-700">
                {files.length > 0
                  ? `${files.length} of ${MAX_FREE_UPLOADS} slots used`
                  : 'Drag & drop PDF certificates to get started'}
              </p>
            </div>
          </div>

          {/* Drop zone (hidden during processing) */}
          {!uploading && !batchId && (
            <div
              className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
                dragActive
                  ? 'border-brand bg-emerald-50'
                  : 'border-slate-300 bg-white hover:border-brand hover:bg-slate-50'
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
              }}
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
              <p className="text-sm font-medium text-foreground">Drag &amp; drop PDF certificates here</p>
              <p className="mt-1 text-xs text-muted-foreground">or click to browse &middot; up to {MAX_FREE_UPLOADS} files</p>
            </div>
          )}

          {/* Batch progress tracker */}
          {batchId && (
            <BatchProgressTracker
              batchId={batchId}
              totalCerts={batchTotalCerts}
              onComplete={handleBatchComplete}
            />
          )}

          {/* File list */}
          {files.length > 0 && !batchId && (
            <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-200 bg-white">
              {files.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 border-b border-slate-100 px-4 py-2.5 last:border-0"
                >
                  {entry.status === 'done' ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                  ) : entry.status === 'failed' ? (
                    <X className="h-4 w-4 shrink-0 text-red-500" />
                  ) : entry.status === 'uploading' || entry.status === 'extracting' ? (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin text-brand" />
                  ) : (
                    <FileText className="h-4 w-4 shrink-0 text-slate-400" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-foreground">{entry.file.name}</p>
                    {entry.error && (
                      <p className="truncate text-xs text-red-500">{entry.error}</p>
                    )}
                  </div>
                  {!uploading && entry.status !== 'done' && (
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
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3">
            {!uploading && !batchId && pendingCount > 0 && (
              <Button
                size="lg"
                className="w-full font-semibold"
                onClick={handleStartUpload}
              >
                Upload &amp; Extract {pendingCount} COI{pendingCount !== 1 ? 's' : ''}
              </Button>
            )}

            {uploading && !batchId && (
              <Button size="lg" className="w-full font-semibold" disabled>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading files...
              </Button>
            )}

            {/* Show completion summary */}
            {!uploading && !batchId && doneCount > 0 && pendingCount === 0 && (
              <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {doneCount} COI{doneCount !== 1 ? 's' : ''} extracted successfully.
                {failedCount > 0 && ` ${failedCount} failed.`}
              </div>
            )}

            {!uploading && !batchId && (
              <button
                type="button"
                onClick={handleSkipUpload}
                className="text-center text-sm text-muted-foreground hover:text-foreground"
                disabled={saving}
              >
                {files.length === 0 ? 'Skip — I\u2019ll upload later' : saving ? 'Finishing...' : 'Continue to Dashboard'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
