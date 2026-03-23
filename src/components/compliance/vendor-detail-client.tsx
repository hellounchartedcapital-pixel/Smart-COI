'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ComplianceBadge } from '@/components/properties/compliance-badge';
import { COIHistory } from './coi-history';
import { NotificationHistory } from './notification-history';
import { EditVendorDialog } from './edit-vendor-dialog';
import { CompactComplianceView } from './compact-compliance-view';
import { ConfirmDialog } from '@/components/properties/confirm-dialog';
import { GrantWaiverDialog, WaiverBadge, WaiverHistory } from './waiver-dialog';
import {
  softDeleteVendor,
  toggleVendorNotifications,
} from '@/lib/actions/properties';
import { sendManualFollowUp, generatePortalLink } from '@/lib/actions/notifications';
import { recheckCompliance, reExtractCertificate } from '@/lib/actions/certificates';
import { summarizeExpiredCoverages } from '@/lib/compliance/calculate';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { useUpgradeModal } from '@/components/dashboard/upgrade-modal';
import { handleActionError, handleActionResult } from '@/lib/handle-action-error';
import { PdfViewer } from './pdf-viewer';
import {
  Upload,
  Send,
  LinkIcon,
  ShieldOff,
  MoreHorizontal,
  Pencil,
  RefreshCw,
  RotateCcw,
} from 'lucide-react';
import type { ComplianceWaiver } from '@/lib/actions/waivers';
import type {
  Vendor,
  Property,
  RequirementTemplate,
  TemplateCoverageRequirement,
  ExtractedCoverage,
  ComplianceResult,
  EntityComplianceResult,
  PropertyEntity,
  Certificate,
  Notification,
} from '@/types';

interface VendorDetailClientProps {
  vendor: Vendor;
  property: Property | null;
  template: RequirementTemplate | null;
  templateRequirements: TemplateCoverageRequirement[];
  extractedCoverages: ExtractedCoverage[];
  complianceResults: ComplianceResult[];
  entityResults: EntityComplianceResult[];
  propertyEntities: PropertyEntity[];
  certificates: (Certificate & { compliance_results?: ComplianceResult[] })[];
  notifications: Notification[];
  orgTemplates: RequirementTemplate[];
  hasCertificate: boolean;
  activeWaiver?: ComplianceWaiver | null;
  waiverHistory?: ComplianceWaiver[];
}

export function VendorDetailClient({
  vendor,
  property,
  template,
  templateRequirements,
  extractedCoverages,
  complianceResults,
  entityResults,
  propertyEntities,
  certificates,
  notifications,
  orgTemplates,
  hasCertificate,
  activeWaiver,
  waiverHistory = [],
}: VendorDetailClientProps) {
  const router = useRouter();
  const { showUpgradeModal } = useUpgradeModal();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [hardDeleteOpen, setHardDeleteOpen] = useState(false);
  const [waiverOpen, setWaiverOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [togglingNotif, setTogglingNotif] = useState(false);
  const [sendingFollowUp, setSendingFollowUp] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [showSecondaryActions, setShowSecondaryActions] = useState(false);
  const [recheckingCompliance, setRecheckingCompliance] = useState(false);
  const [reExtracting, setReExtracting] = useState(false);
  const [reExtractConfirmOpen, setReExtractConfirmOpen] = useState(false);

  const latestCert = certificates
    .slice()
    .sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime())[0];
  const certIdForPdf = latestCert?.file_path ? latestCert.id : null;

  async function handleSendFollowUp() {
    setSendingFollowUp(true);
    try {
      const result = await sendManualFollowUp('vendor', vendor.id);
      if (handleActionResult(result, 'Failed to send follow-up', showUpgradeModal)) return;
      if ('devMode' in result && result.devMode) {
        toast.info('Email logged to console (Resend not configured)');
      } else {
        toast.success('Follow-up email sent');
      }
      router.refresh();
    } catch (err) {
      handleActionError(err, 'Failed to send follow-up', showUpgradeModal);
    } finally {
      setSendingFollowUp(false);
    }
  }

  async function handleGeneratePortalLink() {
    setGeneratingLink(true);
    try {
      const result = await generatePortalLink('vendor', vendor.id);
      if (handleActionResult(result, 'Failed to generate portal link', showUpgradeModal)) return;
      await navigator.clipboard.writeText(result as string);
      toast.success('Portal link copied to clipboard');
    } catch (err) {
      handleActionError(err, 'Failed to generate portal link', showUpgradeModal);
    } finally {
      setGeneratingLink(false);
    }
  }

  async function handleDelete() {
    if (!vendor.property_id) return;
    setDeleting(true);
    try {
      await softDeleteVendor(vendor.id, vendor.property_id);
      toast.success('Vendor archived');
      router.push(`/dashboard/properties/${vendor.property_id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to archive vendor');
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  }

  async function handleHardDelete() {
    if (!vendor.property_id) return;
    setDeleting(true);
    try {
      const { permanentlyDeleteVendor } = await import('@/lib/actions/properties');
      await permanentlyDeleteVendor(vendor.id, vendor.property_id);
      toast.success('Vendor deleted');
      router.push(`/dashboard/properties/${vendor.property_id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete vendor');
    } finally {
      setDeleting(false);
      setHardDeleteOpen(false);
    }
  }

  async function handleToggleNotifications() {
    setTogglingNotif(true);
    try {
      await toggleVendorNotifications(vendor.id, !vendor.notifications_paused);
      toast.success(vendor.notifications_paused ? 'Notifications resumed' : 'Notifications paused');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update notifications');
    } finally {
      setTogglingNotif(false);
    }
  }

  async function handleRecheckCompliance() {
    setRecheckingCompliance(true);
    try {
      const result = await recheckCompliance('vendor', vendor.id);
      if ('error' in result) {
        toast.error(result.error);
      } else {
        toast.success('Compliance rechecked');
        router.refresh();
      }
    } catch (err) {
      handleActionError(err, 'Failed to recheck compliance', showUpgradeModal);
    } finally {
      setRecheckingCompliance(false);
    }
  }

  async function handleReExtract() {
    setReExtracting(true);
    try {
      const result = await reExtractCertificate('vendor', vendor.id);
      if ('error' in result) {
        handleActionResult(result, 'Failed to re-extract certificate', showUpgradeModal);
      } else {
        toast.success('Certificate re-extracted and compliance updated');
        router.refresh();
      }
    } catch (err) {
      handleActionError(err, 'Failed to re-extract certificate', showUpgradeModal);
    } finally {
      setReExtracting(false);
      setReExtractConfirmOpen(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/dashboard/properties" className="hover:text-foreground">
          Properties
        </Link>
        <span>/</span>
        {property && (
          <>
            <Link
              href={`/dashboard/properties/${property.id}`}
              className="hover:text-foreground"
            >
              {property.name}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-foreground">Vendors</span>
        <span>/</span>
        <span className="text-foreground font-medium">{vendor.company_name}</span>
      </div>

      {/* Expired alert banner */}
      {vendor.compliance_status === 'expired' && (() => {
        const summary = summarizeExpiredCoverages(extractedCoverages, formatDate);
        if (summary.expiredCount === 0) return null;
        return (
          <div className="flex items-start gap-3 rounded-lg border-2 border-red-300 bg-red-50 px-4 py-3">
            <svg className="h-5 w-5 flex-shrink-0 text-red-600 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-red-800">
                {summary.singleLine
                  ? `This vendor\u2019s certificate has expired. ${summary.singleLine}.`
                  : `This vendor\u2019s certificate has expired coverage (${summary.expiredCount} of ${summary.totalCount}). An updated certificate is required.`}
              </p>
              {!summary.allSameDate && summary.groupedLines.length > 0 && (
                <p className="mt-1 text-sm text-red-700">
                  {summary.groupedLines.map((g, i) => (
                    <span key={i}>
                      {i > 0 && ' · '}
                      {g.types} — expired {g.date}
                    </span>
                  ))}
                </p>
              )}
            </div>
          </div>
        );
      })()}

      {/* Active waiver notice */}
      {activeWaiver && (
        <WaiverBadge waiver={activeWaiver} onRevoke={() => router.refresh()} />
      )}

      {/* Two-column layout: Left (PDF + history) | Right (info + actions + compliance) */}
      <div className="grid gap-6 lg:grid-cols-[55fr_45fr]">
        {/* LEFT COLUMN: PDF viewer + COI History + Notification History */}
        <div className="space-y-4">
          <PdfViewer certificateId={certIdForPdf} />

          <COIHistory certificates={certificates} />
          <NotificationHistory notifications={notifications} />
          <WaiverHistory waivers={waiverHistory} />
        </div>

        {/* RIGHT COLUMN: Name + badge, actions, coverage, certificate details */}
        <div className="space-y-4">
          {/* Header: Name + compliance badge */}
          <div className="rounded-lg border border-slate-200 bg-white px-5 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <h1 className="text-xl font-bold tracking-tight text-foreground truncate">
                  {vendor.company_name}
                </h1>
                <ComplianceBadge status={vendor.compliance_status} />
              </div>
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                <Pencil className="mr-1.5 h-3.5 w-3.5" />
                Edit Vendor
              </Button>
            </div>
            {vendor.vendor_type && (
              <p className="mt-1 text-sm text-muted-foreground">{vendor.vendor_type}</p>
            )}
          </div>

          {/* Actions panel — compact row layout */}
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => router.push(`/dashboard/certificates/upload?vendorId=${vendor.id}`)}
              >
                <Upload className="mr-1.5 h-3.5 w-3.5" />
                Upload COI
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSendFollowUp}
                disabled={sendingFollowUp}
              >
                <Send className="mr-1.5 h-3.5 w-3.5" />
                {sendingFollowUp ? 'Sending...' : 'Send Follow-Up'}
              </Button>
              {hasCertificate && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRecheckCompliance}
                  disabled={recheckingCompliance}
                >
                  <RefreshCw className={`mr-1.5 h-3.5 w-3.5${recheckingCompliance ? ' animate-spin' : ''}`} />
                  {recheckingCompliance ? 'Rechecking...' : 'Recheck Compliance'}
                </Button>
              )}
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSecondaryActions(!showSecondaryActions)}
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
                {showSecondaryActions && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowSecondaryActions(false)} />
                    <div className="absolute right-0 top-full z-20 mt-1 w-52 rounded-md border border-slate-200 bg-white py-1 shadow-lg">
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-slate-50"
                        onClick={() => {
                          setShowSecondaryActions(false);
                          handleGeneratePortalLink();
                        }}
                        disabled={generatingLink}
                      >
                        <LinkIcon className="h-3.5 w-3.5 text-slate-500" />
                        {generatingLink ? 'Generating...' : 'Generate Portal Link'}
                      </button>
                      {hasCertificate && (
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-slate-50"
                          onClick={() => {
                            setShowSecondaryActions(false);
                            setReExtractConfirmOpen(true);
                          }}
                          disabled={reExtracting}
                        >
                          <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
                          {reExtracting ? 'Re-extracting...' : 'Re-extract Certificate'}
                        </button>
                      )}
                      {!activeWaiver && vendor.compliance_status !== 'compliant' && vendor.compliance_status !== 'pending' && (
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-amber-600 hover:bg-amber-50"
                          onClick={() => {
                            setShowSecondaryActions(false);
                            setWaiverOpen(true);
                          }}
                        >
                          <ShieldOff className="h-3.5 w-3.5" />
                          Grant Waiver
                        </button>
                      )}
                      <div className="my-1 border-t border-slate-100" />
                      <div className="flex items-center justify-between px-3 py-2">
                        <span className="text-sm text-foreground">Notifications</span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={!vendor.notifications_paused}
                          onClick={handleToggleNotifications}
                          disabled={togglingNotif}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 ${
                            !vendor.notifications_paused ? 'bg-emerald-500' : 'bg-slate-200'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              !vendor.notifications_paused ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Coverage Requirements + Certificate Details — flat, non-scrollable */}
          <CompactComplianceView
            entityType="vendor"
            entityId={vendor.id}
            hasCertificate={hasCertificate}
            templateRequirements={templateRequirements}
            complianceResults={complianceResults}
            extractedCoverages={extractedCoverages}
            entityResults={entityResults}
            propertyEntities={propertyEntities}
            latestCert={latestCert}
          />
        </div>
      </div>

      {/* Dialogs */}
      <GrantWaiverDialog
        open={waiverOpen}
        onClose={() => setWaiverOpen(false)}
        entityType="vendor"
        entityId={vendor.id}
        entityName={vendor.company_name}
      />
      <EditVendorDialog
        vendor={vendor}
        templates={orgTemplates}
        open={editOpen}
        onOpenChange={setEditOpen}
        onArchive={() => setDeleteOpen(true)}
        onDelete={() => setHardDeleteOpen(true)}
      />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Archive Vendor"
        description={`Archive ${vendor.company_name}? They won't appear in your active lists or compliance calculations, but their data and history will be preserved. You can restore them anytime.`}
        confirmLabel="Archive"
        destructive={false}
        loading={deleting}
        onConfirm={handleDelete}
      />
      <ConfirmDialog
        open={hardDeleteOpen}
        onOpenChange={setHardDeleteOpen}
        title="Delete Vendor"
        description={`Permanently delete ${vendor.company_name}? This will remove all their certificates, compliance data, and history. This action cannot be undone.`}
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={handleHardDelete}
      />
      <ConfirmDialog
        open={reExtractConfirmOpen}
        onOpenChange={setReExtractConfirmOpen}
        title="Re-extract Certificate"
        description="This will re-process the certificate using AI and will use 1 extraction credit. Continue?"
        confirmLabel="Re-extract"
        destructive={false}
        loading={reExtracting}
        onConfirm={handleReExtract}
      />
    </div>
  );
}
