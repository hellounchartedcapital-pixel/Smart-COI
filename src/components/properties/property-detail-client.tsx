'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { ComplianceBadge } from './compliance-badge';
import { EditPropertyDialog } from './edit-property-dialog';
import { AddVendorDialog } from './add-vendor-dialog';
import { AddTenantDialog } from './add-tenant-dialog';
import { ConfirmDialog } from './confirm-dialog';
import {
  deleteProperty,
  softDeleteVendor,
  softDeleteTenant,
  restoreVendor,
  restoreTenant,
  bulkArchiveVendors,
  bulkDeleteVendors,
  bulkArchiveTenants,
  bulkDeleteTenants,
} from '@/lib/actions/properties';
import { sendManualFollowUp } from '@/lib/actions/notifications';
import { toast } from 'sonner';
import { useUpgradeModal } from '@/components/dashboard/upgrade-modal';
import { handleActionError, handleActionResult } from '@/lib/handle-action-error';
import type {
  Property,
  PropertyEntity,
  Vendor,
  Tenant,
  RequirementTemplate,
  ComplianceStatus,
  PropertyType,
} from '@/types';

const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  office: 'Office',
  retail: 'Retail',
  industrial: 'Industrial',
  mixed_use: 'Mixed-Use',
  multifamily: 'Multifamily',
  other: 'Other',
};

type SortField = 'name' | 'status';
type SortDir = 'asc' | 'desc';

const STATUS_ORDER: Record<ComplianceStatus, number> = {
  expired: 0,
  non_compliant: 1,
  expiring_soon: 2,
  under_review: 3,
  pending: 4,
  compliant: 5,
};

interface PropertyDetailClientProps {
  property: Property;
  entities: PropertyEntity[];
  vendors: (Vendor & { template?: RequirementTemplate | null; coi_expiration_date?: string | null })[];
  tenants: (Tenant & { template?: RequirementTemplate | null; coi_expiration_date?: string | null })[];
  archivedVendors: (Vendor & { template?: RequirementTemplate | null })[];
  archivedTenants: (Tenant & { template?: RequirementTemplate | null })[];
  templates: RequirementTemplate[];
}

export function PropertyDetailClient({
  property,
  entities,
  vendors,
  tenants,
  archivedVendors,
  archivedTenants,
  templates,
}: PropertyDetailClientProps) {
  const router = useRouter();
  const { showUpgradeModal } = useUpgradeModal();

  // Dialog states
  const [editOpen, setEditOpen] = useState(false);
  const [addVendorOpen, setAddVendorOpen] = useState(false);
  const [addTenantOpen, setAddTenantOpen] = useState(false);
  const [deletePropertyOpen, setDeletePropertyOpen] = useState(false);
  const [deleteVendorId, setDeleteVendorId] = useState<string | null>(null);
  const [deleteTenantId, setDeleteTenantId] = useState<string | null>(null);
  const [hardDeleteVendorId, setHardDeleteVendorId] = useState<string | null>(null);
  const [hardDeleteTenantId, setHardDeleteTenantId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [sendingFollowUp, setSendingFollowUp] = useState(false);
  const [coiPrompt, setCoiPrompt] = useState<{ type: 'vendor' | 'tenant'; id: string; name: string } | null>(null);

  // Vendor table state
  const [vendorStatusFilter, setVendorStatusFilter] = useState<string>('all');
  const [vendorSort, setVendorSort] = useState<{ field: SortField; dir: SortDir }>({
    field: 'name',
    dir: 'asc',
  });

  // Tenant table state
  const [tenantStatusFilter, setTenantStatusFilter] = useState<string>('all');
  const [tenantSort, setTenantSort] = useState<{ field: SortField; dir: SortDir }>({
    field: 'name',
    dir: 'asc',
  });

  // Bulk selection state
  const [selectedVendorIds, setSelectedVendorIds] = useState<Set<string>>(new Set());
  const [selectedTenantIds, setSelectedTenantIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<{
    type: 'archive' | 'delete';
    entity: 'vendor' | 'tenant';
  } | null>(null);
  const [bulkActing, setBulkActing] = useState(false);

  // Address formatting
  const addressParts = [
    property.address,
    property.city,
    property.state ? `${property.state} ${property.zip ?? ''}`.trim() : property.zip,
  ].filter(Boolean);
  const fullAddress = addressParts.length > 0 ? addressParts.join(', ') : null;

  const certHolders = entities.filter((e) => e.entity_type === 'certificate_holder');
  const additionalInsured = entities.filter((e) => e.entity_type === 'additional_insured');

  // Sort + filter logic
  function sortItems<T extends { company_name: string; compliance_status: ComplianceStatus }>(
    items: T[],
    sort: { field: SortField; dir: SortDir },
    statusFilter: string
  ): T[] {
    let filtered = items;
    if (statusFilter !== 'all') {
      filtered = items.filter((i) => i.compliance_status === statusFilter);
    }

    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sort.field === 'name') {
        cmp = a.company_name.localeCompare(b.company_name);
      } else {
        cmp = STATUS_ORDER[a.compliance_status] - STATUS_ORDER[b.compliance_status];
      }
      return sort.dir === 'asc' ? cmp : -cmp;
    });
  }

  function toggleSort(
    current: { field: SortField; dir: SortDir },
    field: SortField,
    setter: (v: { field: SortField; dir: SortDir }) => void
  ) {
    if (current.field === field) {
      setter({ field, dir: current.dir === 'asc' ? 'desc' : 'asc' });
    } else {
      setter({ field, dir: 'asc' });
    }
  }

  const filteredVendors = useMemo(
    () => sortItems(vendors, vendorSort, vendorStatusFilter),
    [vendors, vendorSort, vendorStatusFilter]
  );

  const filteredTenants = useMemo(
    () => sortItems(tenants, tenantSort, tenantStatusFilter),
    [tenants, tenantSort, tenantStatusFilter]
  );

  // Delete handlers
  async function handleDeleteProperty() {
    setDeleting(true);
    try {
      await deleteProperty(property.id);
      toast.success('Property deleted');
      router.push('/dashboard/properties');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete property');
    } finally {
      setDeleting(false);
      setDeletePropertyOpen(false);
    }
  }

  async function handleDeleteVendor() {
    if (!deleteVendorId) return;
    setDeleting(true);
    try {
      await softDeleteVendor(deleteVendorId, property.id);
      toast.success('Vendor removed');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove vendor');
    } finally {
      setDeleting(false);
      setDeleteVendorId(null);
    }
  }

  async function handleDeleteTenant() {
    if (!deleteTenantId) return;
    setDeleting(true);
    try {
      await softDeleteTenant(deleteTenantId, property.id);
      toast.success('Tenant archived');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to archive tenant');
    } finally {
      setDeleting(false);
      setDeleteTenantId(null);
    }
  }

  async function handleHardDeleteVendor() {
    if (!hardDeleteVendorId) return;
    setDeleting(true);
    try {
      const { permanentlyDeleteVendor } = await import('@/lib/actions/properties');
      await permanentlyDeleteVendor(hardDeleteVendorId, property.id);
      toast.success('Vendor deleted');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete vendor');
    } finally {
      setDeleting(false);
      setHardDeleteVendorId(null);
    }
  }

  async function handleHardDeleteTenant() {
    if (!hardDeleteTenantId) return;
    setDeleting(true);
    try {
      const { permanentlyDeleteTenant } = await import('@/lib/actions/properties');
      await permanentlyDeleteTenant(hardDeleteTenantId, property.id);
      toast.success('Tenant deleted');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete tenant');
    } finally {
      setDeleting(false);
      setHardDeleteTenantId(null);
    }
  }

  const [restoring, setRestoring] = useState(false);

  async function handleRestoreVendor(vendorId: string) {
    setRestoring(true);
    try {
      await restoreVendor(vendorId, property.id);
      toast.success('Vendor restored');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to restore vendor');
    } finally {
      setRestoring(false);
    }
  }

  async function handleRestoreTenant(tenantId: string) {
    setRestoring(true);
    try {
      await restoreTenant(tenantId, property.id);
      toast.success('Tenant restored');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to restore tenant');
    } finally {
      setRestoring(false);
    }
  }

  async function handleSendFollowUp(entityType: 'vendor' | 'tenant', entityId: string) {
    setSendingFollowUp(true);
    try {
      const result = await sendManualFollowUp(entityType, entityId);
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

  function handleVendorCreated(id: string, name: string) {
    setCoiPrompt({ type: 'vendor', id, name });
  }

  function handleTenantCreated(id: string, name: string) {
    setCoiPrompt({ type: 'tenant', id, name });
  }

  // Bulk selection helpers
  function toggleVendorSelection(id: string) {
    setSelectedVendorIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllVendors() {
    if (selectedVendorIds.size === filteredVendors.length) {
      setSelectedVendorIds(new Set());
    } else {
      setSelectedVendorIds(new Set(filteredVendors.map((v) => v.id)));
    }
  }

  function toggleTenantSelection(id: string) {
    setSelectedTenantIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllTenants() {
    if (selectedTenantIds.size === filteredTenants.length) {
      setSelectedTenantIds(new Set());
    } else {
      setSelectedTenantIds(new Set(filteredTenants.map((t) => t.id)));
    }
  }

  async function handleBulkAction() {
    if (!bulkAction) return;
    setBulkActing(true);
    try {
      const ids = bulkAction.entity === 'vendor'
        ? Array.from(selectedVendorIds)
        : Array.from(selectedTenantIds);

      if (bulkAction.entity === 'vendor' && bulkAction.type === 'archive') {
        await bulkArchiveVendors(ids, property.id);
        toast.success(`${ids.length} vendor(s) archived`);
      } else if (bulkAction.entity === 'vendor' && bulkAction.type === 'delete') {
        await bulkDeleteVendors(ids, property.id);
        toast.success(`${ids.length} vendor(s) deleted`);
      } else if (bulkAction.entity === 'tenant' && bulkAction.type === 'archive') {
        await bulkArchiveTenants(ids, property.id);
        toast.success(`${ids.length} tenant(s) archived`);
      } else if (bulkAction.entity === 'tenant' && bulkAction.type === 'delete') {
        await bulkDeleteTenants(ids, property.id);
        toast.success(`${ids.length} tenant(s) deleted`);
      }

      setSelectedVendorIds(new Set());
      setSelectedTenantIds(new Set());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Bulk action failed');
    } finally {
      setBulkActing(false);
      setBulkAction(null);
    }
  }

  function SortIndicator({ field, current }: { field: SortField; current: { field: SortField; dir: SortDir } }) {
    if (current.field !== field) return <ArrowUpDown className="ml-1 inline h-3.5 w-3.5 text-slate-300" />;
    return current.dir === 'asc'
      ? <ArrowUp className="ml-1 inline h-3.5 w-3.5" />
      : <ArrowDown className="ml-1 inline h-3.5 w-3.5" />;
  }

  function StatusFilterSelect({
    value,
    onChange,
  }: {
    value: string;
    onChange: (v: string) => void;
  }) {
    return (
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8 w-[160px] text-xs">
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="compliant">Compliant</SelectItem>
          <SelectItem value="non_compliant">Non-Compliant</SelectItem>
          <SelectItem value="expiring_soon">Expiring Soon</SelectItem>
          <SelectItem value="expired">Expired</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="under_review">Under Review</SelectItem>
        </SelectContent>
      </Select>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {property.name}
            </h1>
            <Badge variant="secondary" className="text-xs">
              {PROPERTY_TYPE_LABELS[property.property_type]}
            </Badge>
          </div>
          {fullAddress && (
            <p className="mt-1 text-sm text-muted-foreground">{fullAddress}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            Edit Property
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01" />
                </svg>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setDeletePropertyOpen(true)}
              >
                Delete Property
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Entity Requirements */}
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            Entity Requirements
          </h2>
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            Edit Entities
          </Button>
        </div>

        <div className="mt-3 space-y-3">
          {certHolders.length > 0 && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Certificate Holder
              </p>
              {certHolders.map((e) => (
                <div key={e.id} className="mt-1">
                  <p className="text-sm font-medium text-foreground">
                    {e.entity_name}
                  </p>
                  {e.entity_address && (
                    <p className="text-xs text-muted-foreground">
                      {e.entity_address}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
          {additionalInsured.length > 0 && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Additional Insured
              </p>
              {additionalInsured.map((e) => (
                <div key={e.id} className="mt-1">
                  <p className="text-sm font-medium text-foreground">
                    {e.entity_name}
                  </p>
                  {e.entity_address && (
                    <p className="text-xs text-muted-foreground">
                      {e.entity_address}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
          {certHolders.length === 0 && additionalInsured.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No entities configured. Click &quot;Edit Entities&quot; to add certificate
              holders and additional insured entities.
            </p>
          )}
        </div>
      </div>

      {/* Vendors / Tenants / Archived Tabs */}
      <Tabs defaultValue="vendors">
        <TabsList>
          <TabsTrigger value="vendors">
            Vendors ({vendors.length})
          </TabsTrigger>
          <TabsTrigger value="tenants">
            Tenants ({tenants.length})
          </TabsTrigger>
          {(archivedVendors.length > 0 || archivedTenants.length > 0) && (
            <TabsTrigger value="archived">
              Archived ({archivedVendors.length + archivedTenants.length})
            </TabsTrigger>
          )}
        </TabsList>

        {/* Vendors Tab */}
        <TabsContent value="vendors" className="space-y-4">
          <div className="flex items-center justify-between">
            <StatusFilterSelect
              value={vendorStatusFilter}
              onChange={setVendorStatusFilter}
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  router.push(
                    `/dashboard/certificates/bulk-upload?propertyId=${property.id}`
                  )
                }
              >
                Bulk Upload
              </Button>
              <Button size="sm" onClick={() => setAddVendorOpen(true)}>
                + Add Vendor
              </Button>
            </div>
          </div>

          {vendors.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white py-12 text-center">
              <p className="text-sm text-muted-foreground">
                No vendors for this property yet.
              </p>
              <div className="mt-3 flex justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    router.push(
                      `/dashboard/certificates/bulk-upload?propertyId=${property.id}`
                    )
                  }
                >
                  Bulk Upload COIs
                </Button>
                <Button size="sm" onClick={() => setAddVendorOpen(true)}>
                  + Add Vendor
                </Button>
              </div>
            </div>
          ) : filteredVendors.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-white py-8 text-center">
              <p className="text-sm text-muted-foreground">
                No vendors match the selected filter.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-slate-200 bg-white">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-300 accent-emerald-600"
                        checked={filteredVendors.length > 0 && selectedVendorIds.size === filteredVendors.length}
                        onChange={toggleAllVendors}
                      />
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => toggleSort(vendorSort, 'name', setVendorSort)}
                    >
                      Name <SortIndicator field="name" current={vendorSort} />
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">
                      Template
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => toggleSort(vendorSort, 'status', setVendorSort)}
                    >
                      Status <SortIndicator field="status" current={vendorSort} />
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                      COI Expiration
                    </TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVendors.map((v) => (
                    <TableRow key={v.id} className={selectedVendorIds.has(v.id) ? 'bg-emerald-50/50' : ''}>
                      <TableCell>
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-300 accent-emerald-600"
                          checked={selectedVendorIds.has(v.id)}
                          onChange={() => toggleVendorSelection(v.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <Link
                          href={`/dashboard/vendors/${v.id}`}
                          className="hover:underline"
                        >
                          {v.company_name}
                        </Link>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <span className="text-sm text-muted-foreground">
                          {v.template?.name ?? '—'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <ComplianceBadge status={v.compliance_status} />
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {(() => {
                          const d = v.coi_expiration_date;
                          if (!d) return <span className="text-sm text-slate-400">—</span>;
                          const exp = new Date(d + 'T00:00:00');
                          const now = new Date();
                          now.setHours(0, 0, 0, 0);
                          const diffDays = Math.floor((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                          let colorClass = 'text-muted-foreground';
                          if (diffDays < 0) colorClass = 'text-red-600';
                          else if (diffDays <= 30) colorClass = 'text-amber-600';
                          return <span className={`text-sm ${colorClass}`}>{formatDate(d)}</span>;
                        })()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01" />
                              </svg>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/dashboard/vendors/${v.id}`)}>
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/dashboard/certificates/upload?vendorId=${v.id}`)}>
                              Upload COI
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={sendingFollowUp}
                              onClick={() => handleSendFollowUp('vendor', v.id)}
                            >
                              Send Follow-up
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-amber-600 focus:text-amber-600"
                              onClick={() => setDeleteVendorId(v.id)}
                            >
                              Archive
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600"
                              onClick={() => setHardDeleteVendorId(v.id)}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* Tenants Tab */}
        <TabsContent value="tenants" className="space-y-4">
          <div className="flex items-center justify-between">
            <StatusFilterSelect
              value={tenantStatusFilter}
              onChange={setTenantStatusFilter}
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  router.push(
                    `/dashboard/certificates/bulk-upload?propertyId=${property.id}&entityType=tenant`
                  )
                }
              >
                Bulk Upload
              </Button>
              <Button size="sm" onClick={() => setAddTenantOpen(true)}>
                + Add Tenant
              </Button>
            </div>
          </div>

          {tenants.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white py-12 text-center">
              <p className="text-sm text-muted-foreground">
                No tenants for this property yet.
              </p>
              <div className="mt-3 flex justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    router.push(
                      `/dashboard/certificates/bulk-upload?propertyId=${property.id}&entityType=tenant`
                    )
                  }
                >
                  Bulk Upload COIs
                </Button>
                <Button size="sm" onClick={() => setAddTenantOpen(true)}>
                  + Add Tenant
                </Button>
              </div>
            </div>
          ) : filteredTenants.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-white py-8 text-center">
              <p className="text-sm text-muted-foreground">
                No tenants match the selected filter.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-slate-200 bg-white">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-300 accent-emerald-600"
                        checked={filteredTenants.length > 0 && selectedTenantIds.size === filteredTenants.length}
                        onChange={toggleAllTenants}
                      />
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => toggleSort(tenantSort, 'name', setTenantSort)}
                    >
                      Name <SortIndicator field="name" current={tenantSort} />
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">
                      Template
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => toggleSort(tenantSort, 'status', setTenantSort)}
                    >
                      Status <SortIndicator field="status" current={tenantSort} />
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                      COI Expiration
                    </TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTenants.map((t) => (
                    <TableRow key={t.id} className={selectedTenantIds.has(t.id) ? 'bg-emerald-50/50' : ''}>
                      <TableCell>
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-300 accent-emerald-600"
                          checked={selectedTenantIds.has(t.id)}
                          onChange={() => toggleTenantSelection(t.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <Link
                          href={`/dashboard/tenants/${t.id}`}
                          className="hover:underline"
                        >
                          {t.company_name}
                          {t.unit_suite && (
                            <span className="ml-1 text-xs text-muted-foreground">
                              ({t.unit_suite})
                            </span>
                          )}
                        </Link>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <span className="text-sm text-muted-foreground">
                          {t.template?.name ?? '—'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <ComplianceBadge status={t.compliance_status} />
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {(() => {
                          const d = t.coi_expiration_date;
                          if (!d) return <span className="text-sm text-slate-400">—</span>;
                          const exp = new Date(d + 'T00:00:00');
                          const now = new Date();
                          now.setHours(0, 0, 0, 0);
                          const diffDays = Math.floor((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                          let colorClass = 'text-muted-foreground';
                          if (diffDays < 0) colorClass = 'text-red-600';
                          else if (diffDays <= 30) colorClass = 'text-amber-600';
                          return <span className={`text-sm ${colorClass}`}>{formatDate(d)}</span>;
                        })()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01" />
                              </svg>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/dashboard/tenants/${t.id}`)}>
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/dashboard/certificates/upload?tenantId=${t.id}`)}>
                              Upload COI
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={sendingFollowUp}
                              onClick={() => handleSendFollowUp('tenant', t.id)}
                            >
                              Send Follow-up
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-amber-600 focus:text-amber-600"
                              onClick={() => setDeleteTenantId(t.id)}
                            >
                              Archive
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600"
                              onClick={() => setHardDeleteTenantId(t.id)}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* Archived Tab */}
        <TabsContent value="archived" className="space-y-4">
          {archivedVendors.length === 0 && archivedTenants.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-white py-8 text-center">
              <p className="text-sm text-muted-foreground">No archived vendors or tenants.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {archivedVendors.length > 0 && (
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Archived Vendors
                  </h3>
                  <div className="rounded-lg border border-slate-200 bg-white">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead className="hidden lg:table-cell">Template</TableHead>
                          <TableHead className="w-24" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {archivedVendors.map((v) => (
                          <TableRow key={v.id} className="text-muted-foreground">
                            <TableCell className="font-medium">{v.company_name}</TableCell>
                            <TableCell className="hidden lg:table-cell">
                              {v.template?.name ?? '—'}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs"
                                disabled={restoring}
                                onClick={() => handleRestoreVendor(v.id)}
                              >
                                Restore
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
              {archivedTenants.length > 0 && (
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Archived Tenants
                  </h3>
                  <div className="rounded-lg border border-slate-200 bg-white">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead className="hidden lg:table-cell">Template</TableHead>
                          <TableHead className="w-24" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {archivedTenants.map((t) => (
                          <TableRow key={t.id} className="text-muted-foreground">
                            <TableCell className="font-medium">{t.company_name}</TableCell>
                            <TableCell className="hidden lg:table-cell">
                              {t.template?.name ?? '—'}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs"
                                disabled={restoring}
                                onClick={() => handleRestoreTenant(t.id)}
                              >
                                Restore
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <EditPropertyDialog
        property={property}
        entities={entities}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <AddVendorDialog
        propertyId={property.id}
        templates={templates}
        open={addVendorOpen}
        onOpenChange={setAddVendorOpen}
        onCreated={handleVendorCreated}
      />
      <AddTenantDialog
        propertyId={property.id}
        templates={templates}
        open={addTenantOpen}
        onOpenChange={setAddTenantOpen}
        onCreated={handleTenantCreated}
      />
      <ConfirmDialog
        open={deletePropertyOpen}
        onOpenChange={setDeletePropertyOpen}
        title="Delete Property"
        description={
          vendors.length > 0 || tenants.length > 0
            ? 'This property has active vendors or tenants. Remove them before deleting the property.'
            : 'Are you sure you want to delete this property? This action cannot be undone.'
        }
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={handleDeleteProperty}
      />
      <ConfirmDialog
        open={deleteVendorId !== null}
        onOpenChange={(open) => !open && setDeleteVendorId(null)}
        title="Archive Vendor"
        description="Archive this vendor? They won't appear in your active lists or compliance calculations, but their data and history will be preserved. You can restore them anytime from the Archived tab."
        confirmLabel="Archive"
        destructive={false}
        loading={deleting}
        onConfirm={handleDeleteVendor}
      />
      <ConfirmDialog
        open={deleteTenantId !== null}
        onOpenChange={(open) => !open && setDeleteTenantId(null)}
        title="Archive Tenant"
        description="Archive this tenant? They won't appear in your active lists or compliance calculations, but their data and history will be preserved. You can restore them anytime from the Archived tab."
        confirmLabel="Archive"
        destructive={false}
        loading={deleting}
        onConfirm={handleDeleteTenant}
      />
      <ConfirmDialog
        open={hardDeleteVendorId !== null}
        onOpenChange={(open) => !open && setHardDeleteVendorId(null)}
        title="Delete Vendor"
        description="Permanently delete this vendor? This will remove all their certificates, compliance data, and history. This action cannot be undone."
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={handleHardDeleteVendor}
      />
      <ConfirmDialog
        open={hardDeleteTenantId !== null}
        onOpenChange={(open) => !open && setHardDeleteTenantId(null)}
        title="Delete Tenant"
        description="Permanently delete this tenant? This will remove all their certificates, compliance data, and history. This action cannot be undone."
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={handleHardDeleteTenant}
      />
      <Dialog open={coiPrompt !== null} onOpenChange={(open) => !open && setCoiPrompt(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{coiPrompt?.type === 'vendor' ? 'Vendor' : 'Tenant'} Added</DialogTitle>
            <DialogDescription>
              Would you like to upload a COI for {coiPrompt?.name} now?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setCoiPrompt(null)}>
              Skip for Now
            </Button>
            <Button
              onClick={() => {
                if (coiPrompt) {
                  const param = coiPrompt.type === 'vendor' ? 'vendorId' : 'tenantId';
                  router.push(`/dashboard/certificates/upload?${param}=${coiPrompt.id}`);
                  setCoiPrompt(null);
                }
              }}
            >
              Upload COI
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk action confirmation dialog */}
      <ConfirmDialog
        open={bulkAction !== null}
        onOpenChange={(open) => !open && setBulkAction(null)}
        title={
          bulkAction?.type === 'archive'
            ? `Archive ${bulkAction.entity === 'vendor' ? selectedVendorIds.size : selectedTenantIds.size} ${bulkAction.entity}${(bulkAction.entity === 'vendor' ? selectedVendorIds.size : selectedTenantIds.size) !== 1 ? 's' : ''}?`
            : `Delete ${bulkAction?.entity === 'vendor' ? selectedVendorIds.size : selectedTenantIds.size} ${bulkAction?.entity ?? ''}${((bulkAction?.entity === 'vendor' ? selectedVendorIds.size : selectedTenantIds.size)) !== 1 ? 's' : ''}?`
        }
        description={
          bulkAction?.type === 'archive'
            ? `They'll be hidden from active lists but can be restored from the Archived tab.`
            : `Permanently delete the selected ${bulkAction?.entity ?? ''}s? This cannot be undone.`
        }
        confirmLabel={bulkAction?.type === 'archive' ? 'Archive' : 'Delete'}
        destructive={bulkAction?.type === 'delete'}
        loading={bulkActing}
        onConfirm={handleBulkAction}
      />

      {/* Floating action bar for bulk selection */}
      {(selectedVendorIds.size > 0 || selectedTenantIds.size > 0) && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-lg">
            <span className="text-sm font-medium text-foreground">
              {selectedVendorIds.size > 0
                ? `${selectedVendorIds.size} vendor${selectedVendorIds.size !== 1 ? 's' : ''}`
                : `${selectedTenantIds.size} tenant${selectedTenantIds.size !== 1 ? 's' : ''}`}{' '}
              selected
            </span>
            <div className="h-5 w-px bg-slate-200" />
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setBulkAction({
                  type: 'archive',
                  entity: selectedVendorIds.size > 0 ? 'vendor' : 'tenant',
                })
              }
            >
              Archive Selected
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() =>
                setBulkAction({
                  type: 'delete',
                  entity: selectedVendorIds.size > 0 ? 'vendor' : 'tenant',
                })
              }
            >
              Delete Selected
            </Button>
            <button
              type="button"
              className="ml-1 text-muted-foreground hover:text-foreground"
              onClick={() => {
                setSelectedVendorIds(new Set());
                setSelectedTenantIds(new Set());
              }}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
