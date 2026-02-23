'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createVendor, createTenant } from '@/lib/actions/properties';
import { toast } from 'sonner';
import { useUpgradeModal } from '@/components/dashboard/upgrade-modal';
import { handleActionError, handleActionResult } from '@/lib/handle-action-error';
interface SimpleProperty {
  id: string;
  name: string;
}

interface SimpleEntity {
  id: string;
  company_name: string;
  property_id: string | null;
}

interface UploadCOIDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  properties: SimpleProperty[];
  vendors: SimpleEntity[];
  tenants: SimpleEntity[];
}

type Mode = 'choose' | 'existing' | 'new';

export function UploadCOIDialog({
  open,
  onOpenChange,
  properties,
  vendors,
  tenants,
}: UploadCOIDialogProps) {
  const router = useRouter();
  const { showUpgradeModal } = useUpgradeModal();

  const [mode, setMode] = useState<Mode>('choose');
  const [saving, setSaving] = useState(false);

  // Existing entity selection
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [entityType, setEntityType] = useState<'vendor' | 'tenant'>('vendor');
  const [selectedEntityId, setSelectedEntityId] = useState('');

  // New entity form
  const [newPropertyId, setNewPropertyId] = useState('');
  const [newEntityType, setNewEntityType] = useState<'vendor' | 'tenant'>('vendor');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');

  function reset() {
    setMode('choose');
    setSelectedPropertyId('');
    setEntityType('vendor');
    setSelectedEntityId('');
    setNewPropertyId('');
    setNewEntityType('vendor');
    setNewName('');
    setNewEmail('');
    setSaving(false);
  }

  function handleOpenChange(v: boolean) {
    if (!v) reset();
    onOpenChange(v);
  }

  // Filtered entities based on selected property
  const filteredVendors = selectedPropertyId
    ? vendors.filter((v) => v.property_id === selectedPropertyId)
    : vendors;
  const filteredTenants = selectedPropertyId
    ? tenants.filter((t) => t.property_id === selectedPropertyId)
    : tenants;
  const entityList = entityType === 'vendor' ? filteredVendors : filteredTenants;

  function handleExistingSubmit() {
    if (!selectedEntityId) return;
    const param = entityType === 'vendor' ? 'vendorId' : 'tenantId';
    router.push(`/dashboard/certificates/upload?${param}=${selectedEntityId}`);
    handleOpenChange(false);
  }

  async function handleNewSubmit() {
    if (!newPropertyId || !newName.trim()) return;
    setSaving(true);

    try {
      let entityId: string;
      if (newEntityType === 'vendor') {
        const result = await createVendor({
          property_id: newPropertyId,
          company_name: newName.trim(),
          contact_email: newEmail.trim() || undefined,
        });
        if (handleActionResult(result, 'Failed to create vendor', showUpgradeModal)) {
          setSaving(false);
          return;
        }
        entityId = (result as { id: string }).id;
        toast.success(`Vendor "${newName.trim()}" created`);
      } else {
        const result = await createTenant({
          property_id: newPropertyId,
          company_name: newName.trim(),
          contact_email: newEmail.trim() || undefined,
        });
        if (handleActionResult(result, 'Failed to create tenant', showUpgradeModal)) {
          setSaving(false);
          return;
        }
        entityId = (result as { id: string }).id;
        toast.success(`Tenant "${newName.trim()}" created`);
      }

      const param = newEntityType === 'vendor' ? 'vendorId' : 'tenantId';
      router.push(`/dashboard/certificates/upload?${param}=${entityId}`);
      handleOpenChange(false);
    } catch (err) {
      handleActionError(err, 'Failed to create entity', showUpgradeModal);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Certificate of Insurance</DialogTitle>
          <DialogDescription>
            Choose how you&apos;d like to upload a COI.
          </DialogDescription>
        </DialogHeader>

        {mode === 'choose' && (
          <div className="space-y-3 pt-2">
            <button
              type="button"
              className="w-full rounded-lg border border-slate-200 p-4 text-left transition-colors hover:border-brand hover:bg-slate-50"
              onClick={() => setMode('existing')}
            >
              <p className="text-sm font-semibold text-foreground">
                Upload for existing vendor/tenant
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Select from your current vendors or tenants
              </p>
            </button>
            <button
              type="button"
              className="w-full rounded-lg border border-slate-200 p-4 text-left transition-colors hover:border-brand hover:bg-slate-50"
              onClick={() => setMode('new')}
            >
              <p className="text-sm font-semibold text-foreground">
                Add new vendor/tenant and upload COI
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Create a new entity and upload their certificate in one step
              </p>
            </button>
            <button
              type="button"
              className="w-full rounded-lg border border-slate-200 p-4 text-left transition-colors hover:border-brand hover:bg-slate-50"
              onClick={() => {
                handleOpenChange(false);
                router.push('/dashboard/certificates/bulk-upload');
              }}
            >
              <p className="text-sm font-semibold text-foreground">
                Bulk upload multiple COIs
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Drop all your COI PDFs and build your vendor/tenant roster at once
              </p>
            </button>
          </div>
        )}

        {mode === 'existing' && (
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Property (optional)</Label>
              <Select value={selectedPropertyId} onValueChange={(v) => { setSelectedPropertyId(v); setSelectedEntityId(''); }}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="All properties" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Entity type</Label>
              <Select value={entityType} onValueChange={(v) => { setEntityType(v as 'vendor' | 'tenant'); setSelectedEntityId(''); }}>
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vendor">Vendor</SelectItem>
                  <SelectItem value="tenant">Tenant</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">{entityType === 'vendor' ? 'Vendor' : 'Tenant'}</Label>
              <Select value={selectedEntityId} onValueChange={setSelectedEntityId}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder={`Select ${entityType}`} />
                </SelectTrigger>
                <SelectContent>
                  {entityList.length === 0 ? (
                    <SelectItem value="_none" disabled>
                      No {entityType}s found
                    </SelectItem>
                  ) : (
                    entityList.map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.company_name}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setMode('choose')}>Back</Button>
              <Button onClick={handleExistingSubmit} disabled={!selectedEntityId}>
                Continue to Upload
              </Button>
            </div>
          </div>
        )}

        {mode === 'new' && (
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Property</Label>
              <Select value={newPropertyId} onValueChange={setNewPropertyId}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Select property" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Type</Label>
              <Select value={newEntityType} onValueChange={(v) => setNewEntityType(v as 'vendor' | 'tenant')}>
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vendor">Vendor</SelectItem>
                  <SelectItem value="tenant">Tenant</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Company name</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="ABC Contractors"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Contact email (optional)</Label>
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="contact@example.com"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setMode('choose')}>Back</Button>
              <Button
                onClick={handleNewSubmit}
                disabled={!newPropertyId || !newName.trim() || saving}
              >
                {saving ? 'Creating...' : 'Create & Upload COI'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
