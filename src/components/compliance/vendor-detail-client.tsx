'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ComplianceBadge } from '@/components/properties/compliance-badge';
import { COIHistory } from './coi-history';
import { NotificationHistory } from './notification-history';
import { EditVendorDialog } from './edit-vendor-dialog';
import { SplitPanelView } from './split-panel-view';
import { CompliancePanel } from './compliance-panel';
import { ConfirmDialog } from '@/components/properties/confirm-dialog';
import {
  softDeleteVendor,
  toggleVendorNotifications,
} from '@/lib/actions/properties';
import { sendManualFollowUp, generatePortalLink } from '@/lib/actions/notifications';
import { summarizeExpiredCoverages } from '@/lib/compliance/calculate';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { useUpgradeModal } from '@/components/dashboard/upgrade-modal';
import { handleActionError, handleActionResult } from '@/lib/handle-action-error';
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
}: VendorDetailClientProps) {
  const router = useRouter();
  const { showUpgradeModal } = useUpgradeModal();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [hardDeleteOpen, setHardDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [togglingNotif, setTogglingNotif] = useState(false);
  const [sendingFollowUp, setSendingFollowUp] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);

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

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {vendor.company_name}
            </h1>
            <ComplianceBadge status={vendor.compliance_status} />
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
          Edit Vendor
        </Button>
      </div>

      {/* Main content: two-column on desktop */}
      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        {/* Left column: main content */}
        <div className="space-y-6">
          {/* Quick info row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm">
            {vendor.vendor_type && (
              <span className="text-muted-foreground">
                Type: <span className="text-foreground font-medium">{vendor.vendor_type}</span>
              </span>
            )}
            <span className="text-muted-foreground">
              Template:{' '}
              {template ? (
                <Link href={`/dashboard/templates/${template.id}`} className="text-brand-dark hover:underline font-medium">
                  {template.name}
                </Link>
              ) : (
                <span className="text-foreground">None assigned</span>
              )}
            </span>
          </div>

          {/* Expired alert banner — compact, consolidated */}
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

          {/* Split-panel: PDF viewer + Compliance panel */}
          {(() => {
            const latestCert = certificates
              .slice()
              .sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime())[0];
            const certIdForPdf = latestCert?.file_path ? latestCert.id : null;

            return (
              <SplitPanelView certificateId={certIdForPdf}>
                <CompliancePanel
                  entityType="vendor"
                  entityId={vendor.id}
                  entityName={vendor.company_name}
                  contactEmail={vendor.contact_email}
                  contactName={vendor.contact_name}
                  contactPhone={vendor.contact_phone}
                  complianceStatus={vendor.compliance_status}
                  certificates={certificates}
                  extractedCoverages={extractedCoverages}
                  complianceResults={complianceResults}
                  entityResults={entityResults}
                  propertyEntities={propertyEntities}
                  templateRequirements={templateRequirements}
                  notifications={notifications}
                  hasCertificate={hasCertificate}
                  onEditContact={() => setEditOpen(true)}
                />
              </SplitPanelView>
            );
          })()}

          {/* COI History */}
          <COIHistory certificates={certificates} />

          {/* Notification History */}
          <NotificationHistory notifications={notifications} />
        </div>

        {/* Right column: actions panel */}
        <div className="space-y-3">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-foreground">Actions</h3>
            <div className="mt-3 space-y-2">
              <Button
                className="w-full"
                onClick={() => router.push(`/dashboard/certificates/upload?vendorId=${vendor.id}`)}
              >
                Upload COI
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleSendFollowUp}
                disabled={sendingFollowUp}
              >
                {sendingFollowUp ? 'Sending...' : 'Send Follow-Up'}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleGeneratePortalLink}
                disabled={generatingLink}
              >
                {generatingLink ? 'Generating...' : 'Generate Portal Link'}
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-foreground">Notifications</h4>
                <p className="text-xs text-muted-foreground">
                  {vendor.notifications_paused ? 'Paused' : 'Active'}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={!vendor.notifications_paused}
                onClick={handleToggleNotifications}
                disabled={togglingNotif}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 ${
                  !vendor.notifications_paused ? 'bg-brand' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    !vendor.notifications_paused ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-2">
            {vendor.archived_at ? (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                disabled={deleting}
                onClick={async () => {
                  setDeleting(true);
                  try {
                    const { restoreVendor } = await import('@/lib/actions/properties');
                    await restoreVendor(vendor.id, vendor.property_id ?? '');
                    toast.success('Vendor restored');
                    router.refresh();
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : 'Failed to restore');
                  } finally {
                    setDeleting(false);
                  }
                }}
              >
                {deleting ? 'Restoring...' : 'Restore Vendor'}
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-amber-600 border-amber-200 hover:bg-amber-50"
                  onClick={() => setDeleteOpen(true)}
                >
                  Archive Vendor
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => setHardDeleteOpen(true)}
                >
                  Delete Vendor
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <EditVendorDialog
        vendor={vendor}
        templates={orgTemplates}
        open={editOpen}
        onOpenChange={setEditOpen}
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
    </div>
  );
}
