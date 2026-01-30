// TenantUploadModal.jsx
// Modal for uploading tenant insurance and auto-creating tenant records

import React, { useState, useEffect } from 'react';
import { X, Upload, FileText, Loader2, CheckCircle, AlertCircle, Building2, Home } from 'lucide-react';
import { supabase } from './supabaseClient';

// Format currency for display
function formatCurrency(amount) {
  if (!amount) return '$0';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
}

export function TenantUploadModal({ isOpen, onClose, onUploadComplete, properties }) {
  const [step, setStep] = useState(1); // 1: select property/unit, 2: upload, 3: result
  const [selectedProperty, setSelectedProperty] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [units, setUnits] = useState([]);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [defaultSettings, setDefaultSettings] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Load default settings on mount
  useEffect(() => {
    if (isOpen) {
      loadDefaultSettings();
      setStep(1);
      setSelectedProperty('');
      setSelectedUnit('');
      setResult(null);
      setError(null);
    }
  }, [isOpen]);

  // Load units when property changes
  useEffect(() => {
    if (selectedProperty) {
      loadUnits(selectedProperty);
    } else {
      setUnits([]);
      setSelectedUnit('');
    }
  }, [selectedProperty]);

  const loadDefaultSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setDefaultSettings({
          liabilityMin: data.tenant_default_liability_min || 100000,
          autoLiabilityMin: data.tenant_default_auto_liability_min || 0,
          workersComp: data.tenant_default_workers_comp || false,
          employersLiabilityMin: data.tenant_default_employers_liability_min || 0,
          requiresAdditionalInsured: data.tenant_default_requires_additional_insured !== false,
          additionalInsuredText: data.tenant_default_additional_insured_text || '',
          certificateHolderName: data.tenant_default_certificate_holder_name || '',
          certificateHolderAddress: data.tenant_default_certificate_holder_address || '',
          cancellationNoticeDays: data.tenant_default_cancellation_notice_days || 30,
          requiresDeclarationsPage: data.tenant_default_requires_declarations_page !== false,
          requiresEndorsementPages: data.tenant_default_requires_endorsement_pages !== false
        });
      } else {
        // Use defaults if no settings found
        setDefaultSettings({
          liabilityMin: 100000,
          autoLiabilityMin: 0,
          workersComp: false,
          employersLiabilityMin: 0,
          requiresAdditionalInsured: true,
          additionalInsuredText: '',
          certificateHolderName: '',
          certificateHolderAddress: '',
          cancellationNoticeDays: 30,
          requiresDeclarationsPage: true,
          requiresEndorsementPages: true
        });
      }
    } catch (err) {
      console.error('Error loading settings:', err);
    }
  };

  const loadUnits = async (propertyId) => {
    try {
      setLoadingUnits(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('units')
        .select('*')
        .eq('property_id', propertyId)
        .eq('user_id', user.id)
        .order('unit_number', { ascending: true });

      setUnits(data || []);
    } catch (err) {
      console.error('Error loading units:', err);
    } finally {
      setLoadingUnits(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file) => {
    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB.');
      return;
    }

    setUploading(true);
    setUploadStatus('Uploading file...');
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Step 1: Upload file to storage
      const tempId = crypto.randomUUID();
      const fileName = `tenants/${user.id}/${tempId}/${Date.now()}.pdf`;

      const { error: uploadError } = await supabase.storage
        .from('coi-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Step 2: Extract data using AI
      setUploadStatus('Analyzing insurance document...');

      // Convert file to base64
      const base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Build requirements from defaults
      const requirements = {
        general_liability: defaultSettings?.liabilityMin || 100000,
        auto_liability: defaultSettings?.autoLiabilityMin || 0,
        workers_comp: defaultSettings?.workersComp ? 'Statutory' : null,
        employers_liability: defaultSettings?.employersLiabilityMin || 0,
        require_additional_insured: defaultSettings?.requiresAdditionalInsured || false,
        is_tenant_policy: true
      };

      // Call extraction Edge Function
      const { data: extractionResult, error: extractionError } = await supabase.functions.invoke('extract-coi', {
        body: {
          pdfBase64: base64Data,
          requirements: requirements
        }
      });

      let extractedData = {};
      let insuranceStatus = 'pending';
      let issues = [];

      if (extractionError) {
        console.error('Extraction error:', extractionError);
      } else if (extractionResult?.success && extractionResult?.data) {
        extractedData = extractionResult.data;

        // Check expiration
        const today = new Date();
        const parseLocalDate = (dateString) => {
          if (!dateString) return null;
          const [year, month, day] = dateString.split('-').map(Number);
          return new Date(year, month - 1, day);
        };

        // Check coverage compliance
        const liabilityAmount = extractedData.coverage?.generalLiability?.amount || 0;
        if (defaultSettings?.liabilityMin > 0 && liabilityAmount < defaultSettings.liabilityMin) {
          issues.push(`Personal Liability coverage ${formatCurrency(liabilityAmount)} is below the required ${formatCurrency(defaultSettings.liabilityMin)}`);
        }

        if (defaultSettings?.autoLiabilityMin > 0) {
          const autoAmount = extractedData.coverage?.autoLiability?.amount || 0;
          if (autoAmount < defaultSettings.autoLiabilityMin) {
            issues.push(`Auto Liability coverage ${formatCurrency(autoAmount)} is below the required ${formatCurrency(defaultSettings.autoLiabilityMin)}`);
          }
        }

        // Check additional insured
        if (defaultSettings?.requiresAdditionalInsured) {
          const additionalInsuredOnPolicy = (extractedData.additionalInsured || '').toLowerCase();
          if (!additionalInsuredOnPolicy || additionalInsuredOnPolicy.length < 5) {
            issues.push('Additional Insured endorsement not found on policy');
          }
        }

        // Check expiration dates
        if (extractedData.expirationDate) {
          const expDate = parseLocalDate(extractedData.expirationDate);
          if (expDate) {
            const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const daysUntil = Math.floor((expDate - todayLocal) / (1000 * 60 * 60 * 24));
            if (daysUntil < 0) {
              insuranceStatus = 'expired';
            } else if (daysUntil <= 30) {
              insuranceStatus = 'expiring';
            } else if (issues.length > 0) {
              insuranceStatus = 'non-compliant';
            } else {
              insuranceStatus = 'compliant';
            }
          }
        } else if (issues.length > 0) {
          insuranceStatus = 'non-compliant';
        } else {
          insuranceStatus = 'compliant';
        }
      }

      // Step 3: Create tenant record
      setUploadStatus('Creating tenant record...');

      const uploadToken = crypto.randomUUID();
      const tokenExpiry = new Date();
      tokenExpiry.setDate(tokenExpiry.getDate() + 30);

      const tenantData = {
        user_id: user.id,
        name: extractedData.name || extractedData.companyName || 'New Tenant',
        email: '',
        phone: '',
        property_id: selectedProperty || null,
        unit_id: selectedUnit || null,
        status: 'active',
        insurance_status: insuranceStatus,
        // Requirements from defaults
        required_liability_min: defaultSettings?.liabilityMin || 100000,
        required_property_damage_min: 0,
        required_auto_liability_min: defaultSettings?.autoLiabilityMin || 0,
        required_workers_comp: defaultSettings?.workersComp || false,
        workers_comp_exempt: false,
        required_employers_liability_min: defaultSettings?.employersLiabilityMin || 0,
        requires_additional_insured: defaultSettings?.requiresAdditionalInsured !== false,
        additional_insured_text: defaultSettings?.additionalInsuredText || '',
        certificate_holder_name: defaultSettings?.certificateHolderName || '',
        certificate_holder_address: defaultSettings?.certificateHolderAddress || '',
        cancellation_notice_days: defaultSettings?.cancellationNoticeDays || 30,
        requires_declarations_page: defaultSettings?.requiresDeclarationsPage !== false,
        requires_endorsement_pages: defaultSettings?.requiresEndorsementPages !== false,
        // Policy data
        policy_expiration_date: extractedData.expirationDate || null,
        policy_liability_amount: extractedData.coverage?.generalLiability?.amount || 0,
        policy_auto_liability_amount: extractedData.coverage?.autoLiability?.amount || 0,
        policy_coverage: extractedData.coverage || null,
        policy_additional_insured: extractedData.additionalInsured || null,
        has_additional_insured: !!extractedData.additionalInsured,
        policy_certificate_holder: extractedData.certificateHolder || null,
        insurance_company: extractedData.insuranceCompany || null,
        policy_document_path: fileName,
        compliance_issues: issues.length > 0 ? issues : null,
        raw_policy_data: extractedData.rawData || null,
        policy_uploaded_at: new Date().toISOString(),
        upload_token: uploadToken,
        upload_token_expires_at: tokenExpiry.toISOString()
      };

      const { data: newTenant, error: insertError } = await supabase
        .from('tenants')
        .insert(tenantData)
        .select(`
          *,
          unit:units(id, unit_number),
          property:properties(id, name, address)
        `)
        .single();

      if (insertError) throw insertError;

      setResult({
        success: true,
        tenant: newTenant,
        status: insuranceStatus,
        issues: issues,
        coverage: extractedData.coverage || {}
      });
      setStep(3);

      if (onUploadComplete) {
        onUploadComplete(newTenant);
      }

    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to process upload');
    } finally {
      setUploading(false);
      setUploadStatus('');
    }
  };

  const handleProceedToUpload = () => {
    setStep(2);
  };

  if (!isOpen) return null;

  const selectedPropertyObj = properties?.find(p => p.id === selectedProperty);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Upload Tenant Insurance</h2>
            <p className="text-sm text-gray-500 mt-1">
              {step === 1 && 'Select property and unit'}
              {step === 2 && 'Upload insurance document'}
              {step === 3 && 'Upload complete'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Select Property/Unit */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Building2 size={16} className="inline mr-2" />
                  Property (Optional)
                </label>
                <select
                  value={selectedProperty}
                  onChange={(e) => setSelectedProperty(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="">Select property (or skip)...</option>
                  {properties?.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {selectedProperty && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Home size={16} className="inline mr-2" />
                    Unit (Optional)
                  </label>
                  {loadingUnits ? (
                    <div className="flex items-center gap-2 text-gray-500 py-2">
                      <Loader2 size={16} className="animate-spin" />
                      <span>Loading units...</span>
                    </div>
                  ) : (
                    <select
                      value={selectedUnit}
                      onChange={(e) => setSelectedUnit(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    >
                      <option value="">Select unit (or skip)...</option>
                      {units.map(u => (
                        <option key={u.id} value={u.id}>{u.unit_number}</option>
                      ))}
                    </select>
                  )}
                  {units.length === 0 && !loadingUnits && (
                    <p className="text-xs text-amber-600 mt-1">No units found for this property. You can add units later.</p>
                  )}
                </div>
              )}

              {/* Default Requirements Preview */}
              {defaultSettings && (
                <div className="bg-gray-50 rounded-lg p-4 mt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Default Requirements Applied:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Personal Liability: minimum {formatCurrency(defaultSettings.liabilityMin)}</li>
                    {defaultSettings.autoLiabilityMin > 0 && (
                      <li>• Auto Liability: minimum {formatCurrency(defaultSettings.autoLiabilityMin)}</li>
                    )}
                    {defaultSettings.requiresAdditionalInsured && (
                      <li>• Additional Insured required</li>
                    )}
                  </ul>
                  <p className="text-xs text-gray-500 mt-2">
                    Configure defaults in Settings. You can adjust after upload.
                  </p>
                </div>
              )}

              <button
                onClick={handleProceedToUpload}
                className="w-full py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 font-semibold mt-4"
              >
                Continue to Upload
              </button>
            </div>
          )}

          {/* Step 2: Upload File */}
          {step === 2 && (
            <div>
              {selectedPropertyObj && (
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Property:</span> {selectedPropertyObj.name}
                    {selectedUnit && units.find(u => u.id === selectedUnit) && (
                      <span> • Unit {units.find(u => u.id === selectedUnit).unit_number}</span>
                    )}
                  </p>
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4 flex items-start gap-3">
                  <AlertCircle size={20} className="text-red-500 flex-shrink-0" />
                  <p className="text-red-800">{error}</p>
                </div>
              )}

              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-300 hover:border-emerald-400'
                }`}
              >
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileInput}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={uploading}
                />

                {uploading ? (
                  <div>
                    <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">{uploadStatus || 'Processing...'}</p>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-700 mb-2">
                      Drag and drop insurance document
                    </p>
                    <p className="text-gray-500 mb-4">or click to browse files</p>
                    <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                      <FileText size={16} />
                      <span>PDF files only, max 10MB</span>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => setStep(1)}
                className="w-full py-2 text-gray-600 hover:text-gray-900 font-medium mt-4"
                disabled={uploading}
              >
                ← Back to property selection
              </button>
            </div>
          )}

          {/* Step 3: Result */}
          {step === 3 && result && (
            <div className="text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                result.status === 'compliant' ? 'bg-emerald-100' : 'bg-amber-100'
              }`}>
                {result.status === 'compliant' ? (
                  <CheckCircle className="w-8 h-8 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-8 h-8 text-amber-600" />
                )}
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Tenant Added Successfully!
              </h3>

              <p className="text-gray-600 mb-4">
                <span className="font-medium">{result.tenant?.name}</span>
                {result.tenant?.property?.name && (
                  <span className="text-gray-500">
                    {' '}• {result.tenant.property.name}
                    {result.tenant?.unit?.unit_number && ` Unit ${result.tenant.unit.unit_number}`}
                  </span>
                )}
              </p>

              {/* Status */}
              <div className={`rounded-lg p-4 mb-4 ${
                result.status === 'compliant'
                  ? 'bg-emerald-50 border border-emerald-200'
                  : result.status === 'expired'
                    ? 'bg-red-50 border border-red-200'
                    : 'bg-amber-50 border border-amber-200'
              }`}>
                <p className={`font-medium ${
                  result.status === 'compliant'
                    ? 'text-emerald-800'
                    : result.status === 'expired'
                      ? 'text-red-800'
                      : 'text-amber-800'
                }`}>
                  {result.status === 'compliant' && '✓ Insurance meets all requirements'}
                  {result.status === 'expired' && '⚠ Insurance has expired'}
                  {result.status === 'expiring' && '⚠ Insurance expiring soon'}
                  {result.status === 'non-compliant' && '⚠ Insurance has compliance issues'}
                  {result.status === 'pending' && 'Insurance status pending review'}
                </p>
              </div>

              {/* Issues */}
              {result.issues && result.issues.length > 0 && (
                <div className="text-left bg-gray-50 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Issues Found:</h4>
                  <ul className="space-y-1">
                    {result.issues.map((issue, idx) => (
                      <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-red-500">•</span>
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="text-sm text-gray-500 mb-4">
                You can edit the tenant's details and requirements from the Tenants tab.
              </p>

              <button
                onClick={onClose}
                className="w-full py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 font-semibold"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
