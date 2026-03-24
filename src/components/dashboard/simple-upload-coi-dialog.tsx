'use client';

import { useState, useRef, useCallback } from 'react';
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
import { Upload, CheckCircle2, FileText, X } from 'lucide-react';

interface SimpleUploadCOIDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  properties: { id: string; name: string }[];
  vendors: { id: string; company_name: string; property_id: string | null }[];
  tenants: { id: string; company_name: string; property_id: string | null }[];
}

export function SimpleUploadCOIDialog({
  open,
  onOpenChange,
  properties,
  vendors,
  tenants,
}: SimpleUploadCOIDialogProps) {
  const router = useRouter();
  const { showUpgradeModal } = useUpgradeModal();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File state
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Entity selection
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [entityType, setEntityType] = useState<'vendor' | 'tenant'>('vendor');
  const [selectedEntityId, setSelectedEntityId] = useState('');

  // Inline create new entity
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [creating, setCreating] = useState(false);

  // Entity search
  const [entitySearch, setEntitySearch] = useState('');

  function reset() {
    setFile(null);
    setIsDragging(false);
    setSelectedPropertyId('');
    setEntityType('vendor');
    setSelectedEntityId('');
    setShowCreateNew(false);
    setNewCompanyName('');
    setCreating(false);
    setEntitySearch('');
  }

  function handleOpenChange(v: boolean) {
    if (!v) reset();
    onOpenChange(v);
  }

  // Auto-select property if only one exists
  const effectivePropertyId =
    properties.length === 1 ? properties[0].id : selectedPropertyId;

  // Filtered entities based on selected property, type, and search
  const allEntities = entityType === 'vendor' ? vendors : tenants;
  const filteredByProperty = effectivePropertyId
    ? allEntities.filter((e) => e.property_id === effectivePropertyId)
    : allEntities;
  const filteredEntities = entitySearch.trim()
    ? filteredByProperty.filter((e) =>
        e.company_name.toLowerCase().includes(entitySearch.trim().toLowerCase())
      )
    : filteredByProperty;

  // File validation
  function validateAndSetFile(f: File) {
    if (f.type !== 'application/pdf') {
      toast.error('Please select a PDF file.');
      return;
    }
    setFile(f);
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  }, []);

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
    // Reset input so the same file can be re-selected
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function removeFile() {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function handlePropertyChange(value: string) {
    setSelectedPropertyId(value);
    setSelectedEntityId('');
    setShowCreateNew(false);
    setNewCompanyName('');
    setEntitySearch('');
  }

  function handleEntityTypeChange(type: 'vendor' | 'tenant') {
    setEntityType(type);
    setSelectedEntityId('');
    setShowCreateNew(false);
    setNewCompanyName('');
    setEntitySearch('');
  }

  function handleEntityChange(value: string) {
    if (value === '__create_new__') {
      setSelectedEntityId('');
      setShowCreateNew(true);
      setNewCompanyName('');
    } else {
      setSelectedEntityId(value);
      setShowCreateNew(false);
      setNewCompanyName('');
    }
  }

  async function handleCreateEntity() {
    if (!effectivePropertyId || !newCompanyName.trim()) return;
    setCreating(true);

    try {
      let entityId: string;
      if (entityType === 'vendor') {
        const result = await createVendor({
          property_id: effectivePropertyId,
          company_name: newCompanyName.trim(),
        });
        if (handleActionResult(result, 'Failed to create vendor', showUpgradeModal)) {
          setCreating(false);
          return;
        }
        entityId = (result as { id: string }).id;
        toast.success(`Vendor "${newCompanyName.trim()}" created`);
      } else {
        const result = await createTenant({
          property_id: effectivePropertyId,
          company_name: newCompanyName.trim(),
        });
        if (handleActionResult(result, 'Failed to create tenant', showUpgradeModal)) {
          setCreating(false);
          return;
        }
        entityId = (result as { id: string }).id;
        toast.success(`Tenant "${newCompanyName.trim()}" created`);
      }

      setSelectedEntityId(entityId);
      setShowCreateNew(false);
      setNewCompanyName('');
    } catch (err) {
      handleActionError(err, 'Failed to create entity', showUpgradeModal);
    } finally {
      setCreating(false);
    }
  }

  function handleUploadAndCheck() {
    if (!selectedEntityId) return;
    const param = entityType === 'vendor' ? 'vendorId' : 'tenantId';
    router.push(`/dashboard/certificates/upload?${param}=${selectedEntityId}`);
    handleOpenChange(false);
  }

  const canSubmit = file && selectedEntityId;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Certificate of Insurance</DialogTitle>
          <DialogDescription>
            Upload a COI PDF and assign it to a vendor or tenant.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Hero drop zone / file selected indicator */}
          {!file ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 transition-colors ${
                isDragging
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-slate-300 bg-slate-50 hover:border-emerald-400 hover:bg-emerald-50/50'
              }`}
            >
              <Upload
                className={`mb-3 h-10 w-10 ${
                  isDragging ? 'text-emerald-500' : 'text-slate-400'
                }`}
                strokeWidth={1.5}
              />
              <p className="text-sm font-medium text-slate-700">
                Drag &amp; drop your COI PDF here
              </p>
              <p className="mt-1 text-xs text-slate-500">or click to browse</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-600" />
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <FileText className="h-4 w-4 flex-shrink-0 text-emerald-600" />
                <span className="truncate text-sm font-medium text-emerald-900">
                  {file.name}
                </span>
              </div>
              <button
                type="button"
                onClick={removeFile}
                className="flex-shrink-0 rounded p-1 text-emerald-600 transition-colors hover:bg-emerald-100 hover:text-emerald-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Assignment controls — revealed after file is selected */}
          {file && (
            <>
              {/* Property dropdown (auto-selected if only one) */}
              <div className="space-y-1.5">
                <Label className="text-xs">Property</Label>
                {properties.length === 1 ? (
                  <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-foreground">
                    {properties[0].name}
                  </div>
                ) : (
                  <Select
                    value={selectedPropertyId}
                    onValueChange={handlePropertyChange}
                  >
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
                )}
              </div>

              {/* Entity type toggle */}
              <div className="space-y-1.5">
                <Label className="text-xs">Type</Label>
                <div className="flex gap-1 rounded-lg border border-slate-200 p-1">
                  <button
                    type="button"
                    onClick={() => handleEntityTypeChange('vendor')}
                    className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                      entityType === 'vendor'
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Vendor
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEntityTypeChange('tenant')}
                    className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                      entityType === 'tenant'
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Tenant
                  </button>
                </div>
              </div>

              {/* Entity dropdown with search and create new */}
              <div className="space-y-1.5">
                <Label className="text-xs">
                  {entityType === 'vendor' ? 'Vendor' : 'Tenant'}
                </Label>
                {!showCreateNew ? (
                  <Select
                    value={selectedEntityId}
                    onValueChange={handleEntityChange}
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder={`Select ${entityType}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Searchable input inside dropdown */}
                      <div className="px-2 pb-2">
                        <Input
                          placeholder={`Search ${entityType}s...`}
                          value={entitySearch}
                          onChange={(e) => setEntitySearch(e.target.value)}
                          className="h-8 text-sm"
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                        />
                      </div>
                      {filteredEntities.length === 0 && (
                        <div className="px-2 py-1.5 text-center text-xs text-muted-foreground">
                          No {entityType}s found
                        </div>
                      )}
                      {filteredEntities.map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.company_name}
                        </SelectItem>
                      ))}
                      <div className="border-t border-slate-100 pt-1">
                        <SelectItem
                          value="__create_new__"
                          className="font-medium text-emerald-600"
                        >
                          + Create New{' '}
                          {entityType === 'vendor' ? 'Vendor' : 'Tenant'}
                        </SelectItem>
                      </div>
                    </SelectContent>
                  </Select>
                ) : (
                  /* Inline create new entity form */
                  <div className="space-y-2 rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
                    <p className="text-xs font-medium text-emerald-800">
                      New {entityType === 'vendor' ? 'Vendor' : 'Tenant'}
                    </p>
                    <Input
                      placeholder="Company name"
                      value={newCompanyName}
                      onChange={(e) => setNewCompanyName(e.target.value)}
                      className="h-8 bg-white text-sm"
                      autoFocus
                      onKeyDown={(e) => {
                        if (
                          e.key === 'Enter' &&
                          newCompanyName.trim() &&
                          effectivePropertyId
                        ) {
                          handleCreateEntity();
                        }
                      }}
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={handleCreateEntity}
                        disabled={
                          !effectivePropertyId ||
                          !newCompanyName.trim() ||
                          creating
                        }
                        className="h-7 px-3 text-xs"
                      >
                        {creating ? 'Creating...' : 'Create'}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setShowCreateNew(false);
                          setNewCompanyName('');
                        }}
                        className="h-7 px-3 text-xs"
                      >
                        Cancel
                      </Button>
                    </div>
                    {!effectivePropertyId && (
                      <p className="text-xs text-amber-600">
                        Select a property first to create a new {entityType}.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Upload & Check Compliance button */}
              <Button
                className="w-full"
                onClick={handleUploadAndCheck}
                disabled={!canSubmit}
              >
                Upload &amp; Check Compliance
              </Button>
            </>
          )}

          {/* Bulk upload link — always visible */}
          <p className="text-center text-xs text-muted-foreground">
            Need to upload multiple COIs?{' '}
            <button
              type="button"
              className="font-medium text-emerald-600 underline-offset-2 hover:underline"
              onClick={() => {
                handleOpenChange(false);
                router.push('/dashboard/certificates/bulk-upload');
              }}
            >
              Use bulk upload
            </button>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
