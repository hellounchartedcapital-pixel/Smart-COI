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
import { toast } from 'sonner';
import { validatePDFFile } from '@/lib/utils/file-validation';
import { Upload, CheckCircle2, FileText, X, UserPlus } from 'lucide-react';

interface SimpleUploadCOIDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  properties: { id: string; name: string }[];
  vendors: { id: string; company_name: string; property_id: string | null }[];
  tenants: { id: string; company_name: string; property_id: string | null }[];
  onOpenWizard?: (mode: 'vendor' | 'tenant', propertyId: string, coiFile?: File) => void;
}

export function SimpleUploadCOIDialog({
  open,
  onOpenChange,
  properties,
  vendors,
  tenants,
  onOpenWizard,
}: SimpleUploadCOIDialogProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File state
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Entity selection
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [entityType, setEntityType] = useState<'vendor' | 'tenant'>('vendor');
  const [selectedEntityId, setSelectedEntityId] = useState('');

  // Entity path: 'choose' = pick existing vs new, 'existing' = searchable dropdown
  const [entityPath, setEntityPath] = useState<'choose' | 'existing'>('choose');

  // Entity search
  const [entitySearch, setEntitySearch] = useState('');

  function reset() {
    setFile(null);
    setIsDragging(false);
    setSelectedPropertyId('');
    setEntityType('vendor');
    setSelectedEntityId('');
    setEntityPath('choose');
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
  async function validateAndSetFile(f: File) {
    const result = await validatePDFFile(f);
    if (!result.valid) {
      toast.error(result.error);
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
    setEntitySearch('');
  }

  function handleEntityTypeChange(type: 'vendor' | 'tenant') {
    setEntityType(type);
    setSelectedEntityId('');
    setEntityPath('choose');
    setEntitySearch('');
  }

  function handleUploadAndCheck() {
    if (!selectedEntityId) return;
    const param = entityType === 'vendor' ? 'vendorId' : 'tenantId';
    router.push(`/dashboard/certificates/upload?${param}=${selectedEntityId}`);
    handleOpenChange(false);
  }

  function handleAddNew() {
    if (!effectivePropertyId || !onOpenWizard) return;
    const coiToPass = file ?? undefined;
    handleOpenChange(false);
    onOpenWizard(entityType, effectivePropertyId, coiToPass);
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
              {/* Property dropdown */}
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

              {/* Entity selection: two-path choice or searchable dropdown */}
              <div className="space-y-1.5">
                <Label className="text-xs">
                  {entityType === 'vendor' ? 'Vendor' : 'Tenant'}
                </Label>

                {entityPath === 'choose' && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEntityPath('existing')}
                      className="flex flex-col items-center gap-1.5 rounded-lg border-2 border-slate-200 p-3 text-center transition-colors hover:border-emerald-400 hover:bg-emerald-50/50"
                    >
                      <FileText className="h-5 w-5 text-slate-400" />
                      <span className="text-sm font-medium text-slate-700">
                        Existing {entityType === 'vendor' ? 'Vendor' : 'Tenant'}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {filteredByProperty.length} available
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={handleAddNew}
                      disabled={!effectivePropertyId || !onOpenWizard}
                      className="flex flex-col items-center gap-1.5 rounded-lg border-2 border-slate-200 p-3 text-center transition-colors hover:border-emerald-400 hover:bg-emerald-50/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <UserPlus className="h-5 w-5 text-slate-400" />
                      <span className="text-sm font-medium text-slate-700">
                        New {entityType === 'vendor' ? 'Vendor' : 'Tenant'}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Add &amp; upload
                      </span>
                    </button>
                  </div>
                )}

                {entityPath === 'existing' && (
                  <>
                    <Select
                      value={selectedEntityId}
                      onValueChange={setSelectedEntityId}
                    >
                      <SelectTrigger className="text-sm">
                        <SelectValue placeholder={`Select ${entityType}`} />
                      </SelectTrigger>
                      <SelectContent>
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
                      </SelectContent>
                    </Select>
                    <button
                      type="button"
                      onClick={() => { setEntityPath('choose'); setSelectedEntityId(''); }}
                      className="text-xs text-slate-500 hover:text-slate-700"
                    >
                      Back
                    </button>
                  </>
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
