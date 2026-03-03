'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { createOrgAfterSignup, completeOnboarding } from '@/lib/actions/auth';
import { StepOrgSetup, type OrgSetupData } from '@/components/onboarding/step-org-setup';
import { StepProperty, type PropertyData } from '@/components/onboarding/step-property';
import { StepBulkUpload } from '@/components/onboarding/step-bulk-upload';
import { StepTemplates, type SelectedTemplate } from '@/components/onboarding/step-templates';

const STEP_LABELS = ['Organization', 'Property', 'Upload COIs', 'Requirements'];
const TOTAL_STEPS = STEP_LABELS.length;

export default function OnboardingSetupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data from each step
  const [orgId, setOrgId] = useState<string | null>(null);
  const [orgData, setOrgData] = useState<OrgSetupData>({
    companyName: '',
    certificateHolder: null,
    additionalInsured: [],
  });
  const [propertyData, setPropertyData] = useState<PropertyData | null>(null);
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [propertyName, setPropertyName] = useState('');

  // Store auth user ID for creating org/profile when missing
  const authUserIdRef = useRef<string | null>(null);
  const authEmailRef = useRef<string | null>(null);
  const authNameRef = useRef<string | null>(null);

  // Load the current user's org ID on mount (run once)
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

        // Pre-fill the company name if the org already exists
        const { data: org } = await supabase
          .from('organizations')
          .select('name')
          .eq('id', profile.organization_id)
          .single();

        if (org?.name && !org.name.endsWith("'s Organization")) {
          setOrgData((prev) => ({ ...prev, companyName: org.name }));
        }
      }
    }

    loadUserOrg();
  }, [supabase, router]);

  // Helper: ensure org and user profile exist, return orgId
  async function ensureOrgAndProfile(companyName: string): Promise<string> {
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

  // Skip to dashboard from any step
  async function handleSkipToDashboard() {
    setSaving(true);
    setError(null);
    try {
      // Ensure org exists before completing
      let currentOrgId = orgId;
      if (!currentOrgId) {
        currentOrgId = await ensureOrgAndProfile(orgData.companyName || 'My Organization');
      }
      await completeOnboarding(currentOrgId);
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to finish setup');
    } finally {
      setSaving(false);
    }
  }

  // Step 1: Save org name
  async function handleOrgSetupNext(data: OrgSetupData) {
    setSaving(true);
    setError(null);
    setOrgData(data);

    try {
      const currentOrgId = await ensureOrgAndProfile(data.companyName);

      // Update organization name
      const { error: orgError } = await supabase
        .from('organizations')
        .update({ name: data.companyName })
        .eq('id', currentOrgId);

      if (orgError) throw orgError;

      // Save default entities if provided
      if (data.certificateHolder || data.additionalInsured.length > 0) {
        await supabase
          .from('organization_default_entities')
          .delete()
          .eq('organization_id', currentOrgId);

        const entitiesToInsert: {
          organization_id: string;
          entity_name: string;
          entity_address: string;
          entity_type: 'certificate_holder' | 'additional_insured';
        }[] = [];

        if (data.certificateHolder && data.certificateHolder.entity_name) {
          entitiesToInsert.push({
            organization_id: currentOrgId,
            entity_name: data.certificateHolder.entity_name,
            entity_address: data.certificateHolder.entity_address,
            entity_type: 'certificate_holder',
          });
        }

        for (const ai of data.additionalInsured) {
          if (ai.entity_name.trim()) {
            entitiesToInsert.push({
              organization_id: currentOrgId,
              entity_name: ai.entity_name,
              entity_address: ai.entity_address,
              entity_type: 'additional_insured',
            });
          }
        }

        if (entitiesToInsert.length > 0) {
          const { error: entError } = await supabase
            .from('organization_default_entities')
            .insert(entitiesToInsert);
          if (entError) throw entError;
        }
      }

      setCurrentStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save organization');
    } finally {
      setSaving(false);
    }
  }

  // Step 2: Save property
  async function handlePropertyNext(data: PropertyData) {
    if (!orgId) {
      setError('Organization not set up. Please go back to Step 1.');
      return;
    }
    setSaving(true);
    setError(null);
    setPropertyData(data);

    try {
      const { data: property, error: propError } = await supabase
        .from('properties')
        .insert({
          organization_id: orgId,
          name: data.name,
          address: data.address || null,
          city: data.city || null,
          state: data.state || null,
          zip: data.zip || null,
          property_type: data.property_type,
        })
        .select('id')
        .single();

      if (propError) throw propError;

      // Insert property entities
      if (data.entities.length > 0) {
        const entityRows = data.entities.map((e) => ({
          property_id: property.id,
          entity_name: e.entity_name,
          entity_address: e.entity_address || null,
          entity_type: e.entity_type,
        }));

        const { error: entError } = await supabase
          .from('property_entities')
          .insert(entityRows);
        if (entError) throw entError;
      }

      setPropertyId(property.id);
      setPropertyName(data.name);
      setCurrentStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save property');
    } finally {
      setSaving(false);
    }
  }

  function handlePropertySkip() {
    setPropertyId(null);
    setPropertyName('');
    setCurrentStep(3);
  }

  // Step 3: Bulk upload complete → move to requirements
  function handleBulkUploadNext() {
    setCurrentStep(4);
  }

  // Step 4: Save templates, complete onboarding, go to dashboard
  async function handleTemplatesNext(selected: SelectedTemplate[]) {
    if (!orgId) {
      setError('Organization not set up. Please go back to Step 1.');
      return;
    }
    setSaving(true);
    setError(null);

    try {
      for (const { template, adjustedRequirements } of selected) {
        const { data: newTemplate, error: tplError } = await supabase
          .from('requirement_templates')
          .insert({
            organization_id: orgId,
            name: template.name,
            description: template.description,
            category: template.category,
            risk_level: template.risk_level,
            is_system_default: false,
          })
          .select('id')
          .single();

        if (tplError) throw tplError;

        if (adjustedRequirements.length > 0) {
          const reqRows = adjustedRequirements.map((r) => ({
            template_id: newTemplate.id,
            coverage_type: r.coverage_type,
            is_required: r.is_required,
            minimum_limit: r.minimum_limit,
            limit_type: r.limit_type,
            requires_additional_insured: r.requires_additional_insured,
            requires_waiver_of_subrogation: r.requires_waiver_of_subrogation,
          }));

          const { error: reqError } = await supabase
            .from('template_coverage_requirements')
            .insert(reqRows);
          if (reqError) throw reqError;
        }
      }

      // Complete onboarding and go to dashboard
      await completeOnboarding(orgId);
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save templates');
    } finally {
      setSaving(false);
    }
  }

  async function handleTemplatesSkip() {
    if (!orgId) {
      setError('Organization not set up. Please go back to Step 1.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await completeOnboarding(orgId);
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to finish onboarding');
    } finally {
      setSaving(false);
    }
  }

  const progressPercent = (currentStep / TOTAL_STEPS) * 100;

  return (
    <div className="space-y-8">
      {/* Step indicator with named stepper */}
      <div className="space-y-3">
        {/* Step labels */}
        <div className="flex items-center justify-between">
          {STEP_LABELS.map((label, idx) => {
            const stepNum = idx + 1;
            const isActive = stepNum === currentStep;
            const isComplete = stepNum < currentStep;
            return (
              <div key={label} className="flex items-center gap-2">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                    isComplete
                      ? 'bg-brand text-white'
                      : isActive
                        ? 'bg-brand text-white'
                        : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {isComplete ? (
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    stepNum
                  )}
                </div>
                <span
                  className={`hidden text-sm font-medium sm:inline ${
                    isActive ? 'text-foreground' : isComplete ? 'text-brand' : 'text-muted-foreground'
                  }`}
                >
                  {label}
                </span>
                {/* Connector line */}
                {idx < STEP_LABELS.length - 1 && (
                  <div className="mx-1 hidden h-px w-8 bg-slate-200 sm:block lg:w-12" />
                )}
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-brand transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Mobile step label */}
        <p className="text-center text-sm text-muted-foreground sm:hidden">
          Step {currentStep} of {TOTAL_STEPS}: {STEP_LABELS[currentStep - 1]}
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Steps */}
      {currentStep === 1 && (
        <StepOrgSetup
          data={orgData}
          onNext={handleOrgSetupNext}
          onSkip={handleSkipToDashboard}
          saving={saving}
        />
      )}
      {currentStep === 2 && (
        <StepProperty
          orgData={orgData}
          data={propertyData}
          onNext={handlePropertyNext}
          onSkip={handlePropertySkip}
          saving={saving}
        />
      )}
      {currentStep === 3 && (
        <StepBulkUpload
          propertyId={propertyId}
          propertyName={propertyName}
          onNext={handleBulkUploadNext}
          onSkip={handleSkipToDashboard}
          saving={saving}
        />
      )}
      {currentStep === 4 && (
        <StepTemplates
          onNext={handleTemplatesNext}
          onSkip={handleTemplatesSkip}
          saving={saving}
        />
      )}
    </div>
  );
}
