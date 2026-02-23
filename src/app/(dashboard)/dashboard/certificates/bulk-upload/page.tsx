'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { validatePDFFile, computeFileHash, formatFileSize } from '@/lib/utils/file-validation';
import { isPlanInactiveError, PLAN_INACTIVE_TAG } from '@/lib/plan-status';
import { useUpgradeModal } from '@/components/dashboard/upgrade-modal';
import { getBulkUploadCapacity } from '@/lib/actions/properties';
import {
  normalizeEntityName,
  findBestMatch,
  deduplicateExtractions,
  type ExistingEntity,
  type BatchEntry,
} from '@/lib/entity-matching';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Upload,
  FileText,
  X,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  Plus,
  RotateCcw,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PropertyOption {
  id: string;
  name: string;
}

interface FileEntry {
  file: File;
  id: string; // client-side unique ID
  status: 'pending' | 'uploading' | 'extracting' | 'done' | 'failed';
  error?: string;
  certificateId?: string;
  fileHash?: string;
  isDuplicate?: boolean;
  attempts: number; // how many extraction attempts
  extractedData?: {
    insuredName: string | null;
    coverageCount: number;
    entityCount: number;
  };
}

interface RosterRow {
  fileEntryId: string;
  fileName: string;
  certificateId: string;
  insuredName: string;
  entityType: 'vendor' | 'tenant';
  matchedEntityId: string | null; // existing entity ID if matched
  matchScore: number;
  isNew: boolean;
  propertyId: string;
  contactEmail: string;
  coverageCount: number;
  status: 'pending' | 'creating' | 'done' | 'failed';
  error?: string;
  createdEntityId?: string;
}

type BulkStep = 'files' | 'processing' | 'review' | 'summary';

// Max concurrent extractions — keep low to avoid Anthropic rate limits
const MAX_CONCURRENT = 2;

// Delay between starting each extraction (ms)
const STAGGER_DELAY_MS = 3_000;

// Client-side retry backoff for failed extractions (ms)
const CLIENT_RETRY_DELAYS = [5_000, 15_000];

let nextFileId = 0;
function generateFileId(): string {
  return `file_${Date.now()}_${nextFileId++}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function BulkUploadPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showUpgradeModal } = useUpgradeModal();
  const supabase = createClient();

  // Auth/org
  const [orgId, setOrgId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Step state
  const [step, setStep] = useState<BulkStep>('files');

  // Step 1: File selection
  const propertyIdParam = searchParams.get('propertyId');
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState(propertyIdParam ?? '');
  const [defaultEntityType, setDefaultEntityType] = useState<'vendor' | 'tenant'>('vendor');
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 2: Processing
  const [processingStarted, setProcessingStarted] = useState(false);
  const abortRef = useRef(false);
  const [processingMessage, setProcessingMessage] = useState<string | null>(null);
  const [processStartTime, setProcessStartTime] = useState<number | null>(null);
  const completedCountRef = useRef(0);

  // Step 3: Review roster
  const [roster, setRoster] = useState<RosterRow[]>([]);
  const [existingEntities, setExistingEntities] = useState<ExistingEntity[]>([]);

  // Step 4: Summary
  const [summaryStarted, setSummaryStarted] = useState(false);

  // Rate limiting
  const [extractionsRemaining, setExtractionsRemaining] = useState<number | null>(null);
  const [extractionsLimit, setExtractionsLimit] = useState<number>(0);

  // Error
  const [globalError, setGlobalError] = useState<string | null>(null);

  // ---- Bootstrap auth ----
  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data: profile } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single();
      if (!profile?.organization_id) return;
      setOrgId(profile.organization_id);
    })();
  }, [supabase]);

  // ---- Load capacity & properties ----
  useEffect(() => {
    if (!orgId) return;
    (async () => {
      const [propsRes, capacity] = await Promise.all([
        supabase.from('properties').select('id, name').eq('organization_id', orgId).order('name'),
        getBulkUploadCapacity(),
      ]);
      if (propsRes.data) setProperties(propsRes.data);
      setExtractionsRemaining(capacity.extractionsRemaining);
      setExtractionsLimit(capacity.extractionsLimit);
      if (!capacity.canAddEntities) {
        setGlobalError(capacity.entityError ?? 'Entity limit reached');
      }
    })();
  }, [orgId, supabase]);

  // ---- Load existing entities for matching (when property selected) ----
  useEffect(() => {
    if (!orgId) return;
    (async () => {
      const vendorQuery = supabase
        .from('vendors')
        .select('id, company_name, property_id')
        .eq('organization_id', orgId)
        .is('deleted_at', null)
        .is('archived_at', null);

      const tenantQuery = supabase
        .from('tenants')
        .select('id, company_name, property_id')
        .eq('organization_id', orgId)
        .is('deleted_at', null)
        .is('archived_at', null);

      const [vendorsRes, tenantsRes] = await Promise.all([vendorQuery, tenantQuery]);

      const entities: ExistingEntity[] = [
        ...(vendorsRes.data ?? []).map((v) => ({
          id: v.id,
          company_name: v.company_name,
          type: 'vendor' as const,
          property_id: v.property_id,
        })),
        ...(tenantsRes.data ?? []).map((t) => ({
          id: t.id,
          company_name: t.company_name,
          type: 'tenant' as const,
          property_id: t.property_id,
        })),
      ];
      setExistingEntities(entities);
    })();
  }, [orgId, supabase]);

  // ---- File handlers ----
  const addFiles = useCallback(
    async (newFiles: FileList | File[]) => {
      const entries: FileEntry[] = [];
      for (const f of Array.from(newFiles)) {
        const validation = await validatePDFFile(f);
        if (!validation.valid) {
          entries.push({
            file: f,
            id: generateFileId(),
            status: 'failed',
            error: validation.error,
            attempts: 0,
          });
        } else {
          entries.push({
            file: f,
            id: generateFileId(),
            status: 'pending',
            attempts: 0,
          });
        }
      }
      setFiles((prev) => [...prev, ...entries]);
    },
    []
  );

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragActive(false);
      if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const onDragLeave = useCallback(() => setDragActive(false), []);

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) addFiles(e.target.files);
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [addFiles]
  );

  // ---- Step 2: Process all files (upload + extract with staggered concurrency) ----
  const processFiles = useCallback(async () => {
    if (!orgId || !userId || !selectedPropertyId) return;

    // Cap at remaining extraction capacity
    if (extractionsRemaining !== null && extractionsRemaining <= 0) {
      setGlobalError('No extractions remaining this month. Please upgrade your plan.');
      return;
    }

    setProcessingStarted(true);
    setProcessStartTime(Date.now());
    completedCountRef.current = 0;
    abortRef.current = false;

    const pendingFiles = files.filter((f) => f.status === 'pending' || f.status === 'failed');
    const totalBatch = pendingFiles.length;

    // Helper: update processing message with ETA
    function updateProgress(completed: number) {
      completedCountRef.current = completed;
    }

    // Process a single file: upload → create record → extract (with client-side retry)
    async function processOne(entry: FileEntry) {
      if (abortRef.current) return;

      // Update status: uploading
      setFiles((prev) =>
        prev.map((f) => (f.id === entry.id ? { ...f, status: 'uploading', error: undefined } : f))
      );

      try {
        // Compute hash (only if not already uploaded)
        let certId = entry.certificateId;
        let fileHash = entry.fileHash;

        if (!certId) {
          fileHash = await computeFileHash(entry.file);

          // Check for duplicate in batch (same hash)
          const isDuplicate = files.some(
            (f) => f.id !== entry.id && f.fileHash === fileHash && f.status === 'done'
          );

          // Upload to storage
          const storagePath = `bulk/${orgId}/${Date.now()}_${entry.file.name}`;
          const { error: uploadError } = await supabase.storage
            .from('coi-documents')
            .upload(storagePath, entry.file, { upsert: false });

          if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

          // Create certificate record (without vendor/tenant yet)
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

          // Update with cert ID
          setFiles((prev) =>
            prev.map((f) =>
              f.id === entry.id
                ? { ...f, status: 'extracting', certificateId: certId, fileHash, isDuplicate }
                : f
            )
          );
        } else {
          // Already uploaded — skip to extraction
          setFiles((prev) =>
            prev.map((f) =>
              f.id === entry.id ? { ...f, status: 'extracting', error: undefined } : f
            )
          );
        }

        // Call extraction API with client-side retry for transient errors
        let lastError = '';
        const maxAttempts = CLIENT_RETRY_DELAYS.length + 1; // 3 total

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          if (abortRef.current) return;

          const extractRes = await fetch('/api/certificates/extract', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ certificateId: certId }),
          });

          if (extractRes.ok) {
            const extractBody = await extractRes.json();

            // Fetch the insured name from the updated certificate
            const { data: updatedCert } = await supabase
              .from('certificates')
              .select('insured_name')
              .eq('id', certId!)
              .single();

            setFiles((prev) =>
              prev.map((f) =>
                f.id === entry.id
                  ? {
                      ...f,
                      status: 'done',
                      attempts: attempt + 1,
                      extractedData: {
                        insuredName: updatedCert?.insured_name ?? null,
                        coverageCount: extractBody.coverages ?? 0,
                        entityCount: extractBody.entities ?? 0,
                      },
                    }
                  : f
              )
            );
            updateProgress(completedCountRef.current + 1);
            return; // success
          }

          // Failed — check if retryable
          const body = await extractRes.json().catch(() => ({}));
          lastError = body.error ?? 'Extraction failed';

          // Plan-related errors should not retry
          if (isPlanInactiveError(lastError) || extractRes.status === 403) {
            throw new Error(lastError);
          }

          // 422 is extraction failure (bad PDF, etc.) — don't retry
          if (extractRes.status === 422 && !lastError.includes('busy')) {
            throw new Error(lastError);
          }

          // Retryable — wait with backoff
          if (attempt < CLIENT_RETRY_DELAYS.length) {
            const delay = CLIENT_RETRY_DELAYS[attempt];
            setFiles((prev) =>
              prev.map((f) =>
                f.id === entry.id
                  ? { ...f, error: `Retrying in ${delay / 1000}s...`, attempts: attempt + 1 }
                  : f
              )
            );
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }

        // All retries exhausted
        throw new Error(lastError);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Processing failed';
        if (isPlanInactiveError(message)) {
          showUpgradeModal(message.replace(PLAN_INACTIVE_TAG, '').trim());
          abortRef.current = true;
        }
        setFiles((prev) =>
          prev.map((f) =>
            f.id === entry.id
              ? { ...f, status: 'failed', error: message, attempts: (f.attempts || 0) + 1 }
              : f
          )
        );
        updateProgress(completedCountRef.current + 1);
      }
    }

    // Process with staggered concurrency
    const queue = [...pendingFiles];
    const active: Promise<void>[] = [];

    async function runQueue() {
      while (queue.length > 0 && !abortRef.current) {
        // Wait until a slot is available
        while (active.length >= MAX_CONCURRENT && !abortRef.current) {
          await Promise.race(active);
        }
        if (abortRef.current) break;

        const next = queue.shift();
        if (!next) break;

        // Stagger: wait between starting each extraction
        if (active.length > 0) {
          setProcessingMessage(`Pacing requests to avoid API limits...`);
          await new Promise((resolve) => setTimeout(resolve, STAGGER_DELAY_MS));
          setProcessingMessage(null);
        }

        const promise = processOne(next).then(() => {
          const idx = active.indexOf(promise);
          if (idx >= 0) active.splice(idx, 1);
        });
        active.push(promise);
      }
      await Promise.all(active);
    }

    await runQueue();
  }, [orgId, userId, selectedPropertyId, files, supabase, showUpgradeModal, extractionsRemaining]);

  // ---- Build roster from extracted data ----
  const buildRoster = useCallback(() => {
    const doneFiles = files.filter((f) => f.status === 'done' && f.extractedData);

    // Build batch entries for deduplication
    const batchEntries: BatchEntry[] = doneFiles.map((f, i) => ({
      index: i,
      insuredName: f.extractedData?.insuredName ?? '',
      fileName: f.file.name,
    }));

    const groups = deduplicateExtractions(batchEntries);

    const rows: RosterRow[] = [];
    for (const group of groups) {
      // Use the first entry as the canonical one
      const primaryEntry = group.entries[0];
      const fileEntry = doneFiles[primaryEntry.index];
      if (!fileEntry?.certificateId) continue;

      const insuredName = group.canonicalName || fileEntry.file.name.replace(/\.pdf$/i, '');

      // Try to match against existing entities
      const match = findBestMatch(insuredName, existingEntities, selectedPropertyId);

      rows.push({
        fileEntryId: fileEntry.id,
        fileName: fileEntry.file.name,
        certificateId: fileEntry.certificateId,
        insuredName,
        entityType: match?.entity.type ?? defaultEntityType,
        matchedEntityId: match?.entity.id ?? null,
        matchScore: match?.score ?? 0,
        isNew: !match,
        propertyId: selectedPropertyId,
        contactEmail: '',
        coverageCount: fileEntry.extractedData?.coverageCount ?? 0,
        status: 'pending',
      });

      // If group has multiple entries (duplicates), add them too
      for (let i = 1; i < group.entries.length; i++) {
        const entry = group.entries[i];
        const fe = doneFiles[entry.index];
        if (!fe?.certificateId) continue;

        rows.push({
          fileEntryId: fe.id,
          fileName: fe.file.name,
          certificateId: fe.certificateId,
          insuredName,
          entityType: match?.entity.type ?? defaultEntityType,
          matchedEntityId: match?.entity.id ?? null,
          matchScore: match?.score ?? 0,
          isNew: !match,
          propertyId: selectedPropertyId,
          contactEmail: '',
          coverageCount: fe.extractedData?.coverageCount ?? 0,
          status: 'pending',
        });
      }
    }

    setRoster(rows);
    setStep('review');
  }, [files, existingEntities, selectedPropertyId, defaultEntityType]);

  // ---- Step 4: Create entities & assign certificates ----
  const finalizeRoster = useCallback(async () => {
    if (!orgId || !userId) return;
    setSummaryStarted(true);

    // Group rows by insured name to avoid creating duplicate entities
    const nameGroups = new Map<string, RosterRow[]>();
    for (const row of roster) {
      const key = normalizeEntityName(row.insuredName);
      const existing = nameGroups.get(key) ?? [];
      existing.push(row);
      nameGroups.set(key, existing);
    }

    for (const [, groupRows] of nameGroups) {
      const first = groupRows[0];

      // Update all rows in group to 'creating'
      setRoster((prev) =>
        prev.map((r) =>
          groupRows.some((gr) => gr.fileEntryId === r.fileEntryId)
            ? { ...r, status: 'creating' }
            : r
        )
      );

      try {
        let entityId: string;

        if (first.matchedEntityId && !first.isNew) {
          // Use existing entity
          entityId = first.matchedEntityId;
        } else {
          // Create new vendor or tenant
          const table = first.entityType === 'vendor' ? 'vendors' : 'tenants';
          const { data: created, error: createErr } = await supabase
            .from(table)
            .insert({
              organization_id: orgId,
              property_id: first.propertyId,
              company_name: first.insuredName,
              contact_email: first.contactEmail || null,
              compliance_status: 'pending',
            })
            .select('id')
            .single();

          if (createErr) throw new Error(createErr.message);
          entityId = created.id;

          // Log activity
          await supabase.from('activity_log').insert({
            organization_id: orgId,
            property_id: first.propertyId,
            [first.entityType === 'vendor' ? 'vendor_id' : 'tenant_id']: entityId,
            action: `${first.entityType}_created`,
            description: `${first.entityType === 'vendor' ? 'Vendor' : 'Tenant'} "${first.insuredName}" created via bulk upload`,
            performed_by: userId,
          });
        }

        // Assign all certificates in this group to the entity
        for (const row of groupRows) {
          const updateField =
            row.entityType === 'vendor'
              ? { vendor_id: entityId }
              : { tenant_id: entityId };

          await supabase
            .from('certificates')
            .update(updateField)
            .eq('id', row.certificateId);

          // Log upload activity
          await supabase.from('activity_log').insert({
            organization_id: orgId,
            certificate_id: row.certificateId,
            [row.entityType === 'vendor' ? 'vendor_id' : 'tenant_id']: entityId,
            action: 'coi_uploaded',
            description: `COI "${row.fileName}" assigned to ${row.entityType} "${row.insuredName}" via bulk upload`,
            performed_by: userId,
          });
        }

        // Mark all rows in group as done
        setRoster((prev) =>
          prev.map((r) =>
            groupRows.some((gr) => gr.fileEntryId === r.fileEntryId)
              ? { ...r, status: 'done', createdEntityId: entityId }
              : r
          )
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create entity';
        setRoster((prev) =>
          prev.map((r) =>
            groupRows.some((gr) => gr.fileEntryId === r.fileEntryId)
              ? { ...r, status: 'failed', error: message }
              : r
          )
        );
      }
    }
  }, [orgId, userId, roster, supabase]);

  // ---- Retry all failed extractions ----
  const retryAllFailed = useCallback(() => {
    setFiles((prev) =>
      prev.map((f) =>
        f.status === 'failed'
          ? { ...f, status: 'pending', error: undefined }
          : f
      )
    );
    setProcessingStarted(false);
  }, []);

  // ---- Computed state ----
  const pendingCount = files.filter((f) => f.status === 'pending').length;
  const processingCount = files.filter(
    (f) => f.status === 'uploading' || f.status === 'extracting'
  ).length;
  const doneCount = files.filter((f) => f.status === 'done').length;
  const failedCount = files.filter((f) => f.status === 'failed').length;
  const allProcessed = processingStarted && processingCount === 0 && pendingCount === 0;

  const rosterDone = roster.filter((r) => r.status === 'done').length;
  const rosterFailed = roster.filter((r) => r.status === 'failed').length;
  const rosterProcessing = roster.filter((r) => r.status === 'creating').length;
  const allRosterDone = summaryStarted && rosterProcessing === 0;

  const canStartProcessing =
    selectedPropertyId && files.some((f) => f.status === 'pending');

  // ---- Roster row update helpers ----
  function updateRosterRow(fileEntryId: string, updates: Partial<RosterRow>) {
    setRoster((prev) =>
      prev.map((r) => (r.fileEntryId === fileEntryId ? { ...r, ...updates } : r))
    );
  }

  // ---- Progress for step 2 ----
  const finishedCount = doneCount + failedCount;
  const progressPercent =
    files.length > 0 ? (finishedCount / files.length) * 100 : 0;

  // Time estimate
  const estimatedTimeRemaining = (() => {
    if (!processStartTime || finishedCount === 0) return null;
    const elapsed = Date.now() - processStartTime;
    const avgPerFile = elapsed / finishedCount;
    const remaining = files.length - finishedCount;
    if (remaining <= 0) return null;
    const remainMs = avgPerFile * remaining;
    const mins = Math.ceil(remainMs / 60_000);
    if (mins <= 1) return 'less than a minute';
    return `~${mins} minute${mins !== 1 ? 's' : ''}`;
  })();

  // High failure detection
  const failureRate = files.length > 0 ? failedCount / files.length : 0;
  const hasHighFailures = failedCount >= 3 && failureRate > 0.3;

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      {/* Header */}
      <div className="space-y-1">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Bulk Upload Certificates</h1>
        <p className="text-sm text-muted-foreground">
          Drop all your COI PDFs and we&apos;ll extract data and build your vendor/tenant roster.
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 text-sm">
        {(['files', 'processing', 'review', 'summary'] as BulkStep[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            {i > 0 && <div className="h-px w-6 bg-slate-300" />}
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${
                step === s
                  ? 'bg-brand text-white'
                  : (['files', 'processing', 'review', 'summary'].indexOf(step) >
                    i
                    ? 'bg-green-100 text-green-700'
                    : 'bg-slate-100 text-slate-500')
              }`}
            >
              {['files', 'processing', 'review', 'summary'].indexOf(step) > i ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                i + 1
              )}
            </div>
            <span
              className={`hidden sm:inline ${
                step === s ? 'font-medium text-foreground' : 'text-muted-foreground'
              }`}
            >
              {s === 'files' && 'Select Files'}
              {s === 'processing' && 'Processing'}
              {s === 'review' && 'Review Roster'}
              {s === 'summary' && 'Summary'}
            </span>
          </div>
        ))}
      </div>

      {/* Global error */}
      {globalError && (
        <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {globalError}
        </div>
      )}

      {/* ================================================================ */}
      {/* STEP 1: FILE SELECTION & SETUP                                   */}
      {/* ================================================================ */}
      {step === 'files' && (
        <div className="space-y-6">
          {/* Property & entity type */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Property</Label>
              <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Select property" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Default entity type</Label>
              <Select
                value={defaultEntityType}
                onValueChange={(v) => setDefaultEntityType(v as 'vendor' | 'tenant')}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vendor">Vendor</SelectItem>
                  <SelectItem value="tenant">Tenant</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Capacity indicator */}
          {extractionsRemaining !== null && (
            <div
              className={`rounded-lg border px-4 py-3 text-sm ${
                extractionsRemaining === 0
                  ? 'border-red-200 bg-red-50 text-red-700'
                  : extractionsRemaining < 10
                    ? 'border-amber-200 bg-amber-50 text-amber-700'
                    : 'border-slate-200 bg-slate-50 text-muted-foreground'
              }`}
            >
              <span className="font-medium">
                {extractionsRemaining}
              </span>{' '}
              of {extractionsLimit} extractions remaining this month.
              {files.filter((f) => f.status === 'pending').length > extractionsRemaining && (
                <span className="ml-1 font-medium text-amber-700">
                  Only {extractionsRemaining} of your {files.filter((f) => f.status === 'pending').length} files
                  can be processed.
                </span>
              )}
            </div>
          )}

          {/* Drop zone */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
            }}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-10 text-center transition-colors ${
              dragActive
                ? 'border-brand bg-brand/5'
                : 'border-slate-300 hover:border-brand hover:bg-slate-50'
            }`}
          >
            <Upload className="mb-3 h-10 w-10 text-slate-400" />
            <p className="text-sm font-medium text-foreground">
              Drop PDF files here or click to browse
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              PDF only, up to 10MB each. You can select multiple files.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              multiple
              className="hidden"
              onChange={onInputChange}
            />
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">
                  {files.length} file{files.length !== 1 ? 's' : ''} selected
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFiles([])}
                  className="text-xs text-muted-foreground"
                >
                  Clear all
                </Button>
              </div>
              <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-2">
                {files.map((entry) => (
                  <div
                    key={entry.id}
                    className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm ${
                      entry.status === 'failed'
                        ? 'bg-red-50 text-red-700'
                        : 'bg-slate-50'
                    }`}
                  >
                    <FileText className="h-4 w-4 flex-shrink-0 text-slate-400" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{entry.file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(entry.file.size)}
                        {entry.error && (
                          <span className="ml-2 text-red-600">{entry.error}</span>
                        )}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(entry.id);
                      }}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" asChild>
              <Link href="/dashboard">Cancel</Link>
            </Button>
            <Button
              disabled={!canStartProcessing}
              onClick={() => {
                setStep('processing');
                processFiles();
              }}
            >
              Process {files.filter((f) => f.status === 'pending').length} File
              {files.filter((f) => f.status === 'pending').length !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* STEP 2: PROCESSING                                               */}
      {/* ================================================================ */}
      {step === 'processing' && (
        <div className="space-y-6">
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">
                {allProcessed
                  ? `Processing complete — ${doneCount} of ${files.length} extracted successfully`
                  : `Processing ${finishedCount} of ${files.length} files...`}
              </span>
              {!allProcessed && estimatedTimeRemaining && (
                <span className="text-muted-foreground">
                  {estimatedTimeRemaining} remaining
                </span>
              )}
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-brand transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            {/* Pacing / status message */}
            {!allProcessed && processingMessage && (
              <p className="text-xs text-muted-foreground italic">
                {processingMessage}
              </p>
            )}
          </div>

          {/* High failure warning */}
          {hasHighFailures && !allProcessed && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <AlertTriangle className="mr-1.5 inline h-4 w-4" />
              Some extractions are failing due to high demand. The system will automatically retry.
              This may take a few extra minutes.
            </div>
          )}

          {/* File status list */}
          <div className="max-h-80 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-2">
            {files.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm"
              >
                {entry.status === 'pending' && (
                  <div className="h-4 w-4 rounded-full border-2 border-slate-300" />
                )}
                {entry.status === 'uploading' && (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                )}
                {entry.status === 'extracting' && (
                  <Loader2 className="h-4 w-4 animate-spin text-brand" />
                )}
                {entry.status === 'done' && (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                )}
                {entry.status === 'failed' && (
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{entry.file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {entry.status === 'uploading' && 'Uploading...'}
                    {entry.status === 'extracting' &&
                      (entry.error
                        ? entry.error // shows "Retrying in Xs..." during backoff
                        : 'Extracting data...')}
                    {entry.status === 'done' &&
                      entry.extractedData &&
                      `${entry.extractedData.insuredName ?? 'Unknown'} — ${entry.extractedData.coverageCount} coverages`}
                    {entry.status === 'failed' && (
                      <span className="text-red-600">{entry.error}</span>
                    )}
                  </p>
                </div>
                {entry.isDuplicate && (
                  <Badge variant="outline" className="text-xs text-amber-600 border-amber-200">
                    Duplicate
                  </Badge>
                )}
              </div>
            ))}
          </div>

          {/* Completion summary & actions */}
          {allProcessed && (
            <div className="space-y-4">
              {/* Summary banner */}
              {failedCount > 0 ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  {doneCount} of {files.length} extracted successfully. {failedCount} failed
                  — click &ldquo;Retry All Failed&rdquo; to try again.
                </div>
              ) : (
                <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  All {doneCount} files extracted successfully.
                </div>
              )}

              <div className="flex justify-end gap-2">
                {failedCount > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      retryAllFailed();
                      setTimeout(() => processFiles(), 100);
                    }}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Retry All Failed ({failedCount})
                  </Button>
                )}
                <Button
                  disabled={doneCount === 0}
                  onClick={buildRoster}
                >
                  Continue to Review ({doneCount} file{doneCount !== 1 ? 's' : ''})
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================================================================ */}
      {/* STEP 3: REVIEW & COMPLETE ROSTER                                 */}
      {/* ================================================================ */}
      {step === 'review' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold">Review & Complete Roster</h2>
            <p className="text-sm text-muted-foreground">
              Verify the extracted data, fix names, set entity types, and confirm matches.
            </p>
          </div>

          {/* Roster table */}
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Company Name</TableHead>
                  <TableHead className="w-[100px]">Type</TableHead>
                  <TableHead className="w-[120px]">Match</TableHead>
                  <TableHead className="w-[180px]">Email</TableHead>
                  <TableHead className="w-[80px] text-center">Coverages</TableHead>
                  <TableHead className="w-[140px]">File</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roster.map((row) => (
                  <TableRow key={row.fileEntryId}>
                    <TableCell>
                      <Input
                        value={row.insuredName}
                        onChange={(e) =>
                          updateRosterRow(row.fileEntryId, {
                            insuredName: e.target.value,
                          })
                        }
                        className="h-8 text-sm"
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={row.entityType}
                        onValueChange={(v) =>
                          updateRosterRow(row.fileEntryId, {
                            entityType: v as 'vendor' | 'tenant',
                          })
                        }
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="vendor">Vendor</SelectItem>
                          <SelectItem value="tenant">Tenant</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {row.matchedEntityId && !row.isNew ? (
                        <Badge
                          variant="outline"
                          className="text-xs text-green-700 border-green-200 bg-green-50"
                        >
                          Matched
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-xs text-blue-700 border-blue-200 bg-blue-50"
                        >
                          <Plus className="mr-0.5 h-3 w-3" />
                          New
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Input
                        value={row.contactEmail}
                        onChange={(e) =>
                          updateRosterRow(row.fileEntryId, {
                            contactEmail: e.target.value,
                          })
                        }
                        placeholder="contact@example.com"
                        className="h-8 text-xs"
                      />
                    </TableCell>
                    <TableCell className="text-center text-sm">
                      {row.coverageCount}
                    </TableCell>
                    <TableCell>
                      <p className="truncate text-xs text-muted-foreground" title={row.fileName}>
                        {row.fileName}
                      </p>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Summary counts */}
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>
              <span className="font-medium text-foreground">
                {roster.filter((r) => r.isNew).length}
              </span>{' '}
              new entities
            </span>
            <span>
              <span className="font-medium text-foreground">
                {roster.filter((r) => !r.isNew).length}
              </span>{' '}
              matched to existing
            </span>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setStep('processing');
              }}
            >
              Back
            </Button>
            <Button
              onClick={() => {
                setStep('summary');
                finalizeRoster();
              }}
              disabled={roster.length === 0}
            >
              Finalize {roster.length} Entr{roster.length !== 1 ? 'ies' : 'y'}
            </Button>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* STEP 4: SUMMARY                                                  */}
      {/* ================================================================ */}
      {step === 'summary' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold">
              {allRosterDone ? 'Bulk Upload Complete' : 'Finalizing...'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {allRosterDone
                ? 'All certificates have been assigned to vendors/tenants.'
                : 'Creating entities and assigning certificates...'}
            </p>
          </div>

          {/* Progress */}
          {!allRosterDone && (
            <div className="space-y-2">
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-brand transition-all duration-300"
                  style={{
                    width: `${roster.length > 0 ? ((rosterDone + rosterFailed) / roster.length) * 100 : 0}%`,
                  }}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                {rosterDone + rosterFailed} of {roster.length} processed
              </p>
            </div>
          )}

          {/* Results table */}
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Entity</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>File</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roster.map((row) => (
                  <TableRow key={row.fileEntryId}>
                    <TableCell className="font-medium">{row.insuredName}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs capitalize">
                        {row.entityType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {row.status === 'pending' && (
                        <span className="text-xs text-muted-foreground">Waiting...</span>
                      )}
                      {row.status === 'creating' && (
                        <div className="flex items-center gap-1 text-xs text-blue-600">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Creating...
                        </div>
                      )}
                      {row.status === 'done' && (
                        <div className="flex items-center gap-1 text-xs text-green-600">
                          <CheckCircle2 className="h-3 w-3" />
                          {row.isNew ? 'Created' : 'Assigned'}
                        </div>
                      )}
                      {row.status === 'failed' && (
                        <div className="flex items-center gap-1 text-xs text-red-600">
                          <AlertTriangle className="h-3 w-3" />
                          {row.error ?? 'Failed'}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <p className="truncate text-xs text-muted-foreground">
                        {row.fileName}
                      </p>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Final summary */}
          {allRosterDone && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <p className="text-sm font-medium text-green-800">
                  Successfully processed {rosterDone} certificate
                  {rosterDone !== 1 ? 's' : ''}.
                  {rosterFailed > 0 && (
                    <span className="text-red-700">
                      {' '}
                      {rosterFailed} failed.
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          {allRosterDone && (
            <div className="flex justify-end gap-2">
              <Button variant="outline" asChild>
                <Link href={`/dashboard/properties/${selectedPropertyId}`}>
                  View Property
                </Link>
              </Button>
              <Button asChild>
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
