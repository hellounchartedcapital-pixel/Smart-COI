# SmartCOI

*Last updated: April 10, 2026*

SmartCOI — B2B SaaS platform automating Certificate of Insurance (COI) compliance tracking. Supports Property Management, Construction, Logistics, Healthcare, Manufacturing, Hospitality, Retail, and Other industries. Automates COI collection, AI extraction, compliance verification, and vendor/tenant follow-up notifications.

## Product Name

Always "SmartCOI" — capital S, capital C, capital O, capital I, one word.

Never use "Smart COI", "smartCOI", "smartcoi", or "SMARTCOI" in user-facing text.

## Tech Stack

- **Framework:** Next.js 15 (App Router), React 19, TypeScript 5.7
- **Database & Auth:** Supabase (Postgres with RLS, Auth, Storage, Edge Functions, Google OAuth)
- **AI:** Anthropic Claude API (Sonnet 4) for COI extraction and lease requirement extraction
- **Billing:** Stripe (subscriptions, trials, webhooks)
- **Email:** Resend for transactional notifications
- **Hosting:** Vercel with Vercel Cron for scheduled jobs
- **UI:** Tailwind CSS 3, shadcn/ui (Radix primitives), Lucide icons, Sonner toasts

## Pricing (Source of Truth)

Never deviate from these numbers. No enterprise tier. Fully self-serve.

| Tier | Monthly | Annual (20% off) | Certificate limit |
|---|---|---|---|
| Starter | $79/mo | $63/mo | Up to 50 |
| Growth | $149/mo | $119/mo | Up to 150 |
| Professional | $249/mo | $199/mo | Unlimited + priority support |

- All tiers include all features. 14-day free trial, no credit card required.
- Trial extraction limit: 50 COIs.
- Primary CTA: "Upload 50 COIs Free"

## Current Status

Product is feature-complete and launch-ready. All critical flows tested (7/7 PASS). P0 and P1 polish passes complete. Landing page updated to match current product.

### Multi-Industry Architecture (Apr 2026)

SmartCOI now supports 8 industries. Key architectural components:

**Industry system:**
- `organizations.industry` column (TEXT with CHECK constraint)
- Industry type: `src/types/index.ts` — union type
- Industry options: `src/lib/constants/industries.ts` — labels + icons for selection UI
- Industry templates: `src/lib/constants/industry-templates.ts` — 28 default templates across 8 industries

**Terminology mapping layer:**
- Definition: `src/lib/constants/terminology.ts` — `TERMINOLOGY_MAP` (Record<Industry, Terminology>) with 12 fields per industry
- Client hook: `src/hooks/useTerminology.ts` — use in React components
- Server helper: `src/lib/terminology-server.ts` — use in server components and API routes
- Helper functions: `getTerminology(industry)` and `formatTerm(template, terms)`

**Terminology fields per industry:** location, locationPlural, entity, entityPlural, tenant, tenantPlural, hasTenants, locationDescription, entityDescription, tenantDescription, uploadPrompt, requesterLabel

**Key behaviors:**
- Tenants only visible when `hasTenants === true` (PM only currently)
- Locations are optional — non-PM industries can track compliance without creating locations
- Lease extraction hidden for non-PM industries
- AI template recommendations are industry-aware

**Unified entity model:**
- Merged vendors/tenants into `entities` table with `type` field
- Legacy vendor/tenant tables still active via dual-writing (portal, notifications, detail pages still read from legacy)
- Entity detail page redirects to legacy vendor/tenant pages (with entities table fallback)

**KNOWN GAPS (in progress):**
- ~~\~30 dashboard components still have hardcoded "Vendor"/"Tenant" strings instead of using terminology~~ **FIXED** (Apr 2026)
- ~~Email templates have zero industry awareness (no industry in EmailMergeFields)~~ **FIXED** (Apr 2026)
- ~~Entity unification data flow broken — certificates, compliance, dashboard queries only checked one side of dual tables~~ **FIXED** (Apr 2026)
- Landing page is PM-specific (intentional for current marketing)

### Features That EXIST (reference these freely)

- Auth + onboarding wizard (5-step setup: create org → add property → bulk upload → assign requirements → review & assign requirements)
- Google OAuth login/signup (via Supabase, client ID configured)
- Forgot password / reset password flow
- Confirm password field on signup
- Dashboard with portfolio health bar, compliance stats, action items, activity feed (simplified layout)
- Dashboard two-column layout (65/35) — properties grid + Needs Your Attention on left, Recent Activity on right
- Personalized greeting: "Hello, [First Name]" (falls back to "Hello" or "Hello there")
- Needs Your Attention section capped at 5 items with "Show all [X] items" expansion, per-item Request COI and Upload COI buttons
- Recent Activity feed limited to 8 items with "View all activity >" link
- Single Upload COI button in dashboard header (no Bulk Upload button)
- Export Report button (PDF via browser print, CSV download, Compliance Audit PDF) for compliance reports
- 6-step interactive dashboard tour with data-tour attributes, light tooltip style
- Properties / vendors / tenants CRUD with compliance tracking
- Certificate holder and additional insured fields on property creation
- Vendor/tenant names clickable in property list
- COI Expiration column (color-coded dates, Current/Expired labels) in property vendor/tenant list
- Status badges fixed to single line (whitespace-nowrap)
- Bulk COI upload with AI extraction, parallel processing (5 concurrent files), per-item 429 retry with exponential backoff (4s/8s/16s)
- Background batch processing — server-side extraction via `after()` so users can close the browser; email notification on completion; real-time progress polling
- COI type selection (vendor vs tenant) during bulk upload
- Contact capture during bulk upload (contact name, email pre-populated from extraction)
- Auto-assignment of COIs to property created during onboarding
- AI-powered data extraction (coverage types, limits, dates, named insureds, certificate holder, additional insured, endorsements)
- Two-pass AI extraction: Pass 1 = ACORD 25 data (page 1), Pass 2 = endorsement verification (pages 2+), plus vendor type inference from insured name/description
- AI-inferred vendor type (13 trade categories) with confidence flag and recommended coverage requirements mapping
- Endorsement detection: CG 20 10, CG 20 37, Waiver of Subrogation, Primary & Non-Contributory
- Three-state endorsement verification: Indicated / Verified / Warning
- Automatic compliance calculation — COIs go directly from extraction to compliance check (no manual review step)
- Fuzzy name matching in compliance engine for certificate holder and additional insured verification
- `accept_cert_holder_in_additional_insured` toggle on properties table
- Split-panel COI viewer (PDF left, compliance checklist right) with fuzzy matching indicator and auto follow-up status
- Compliance templates (vendor & tenant) with configurable requirements
- Lease-based requirement extraction: upload tenant lease PDF → AI extracts insurance requirements → review/edit → save as template
- Templates show "Extracted from Lease" badge for lease-sourced templates
- Recheck Compliance button (free, re-runs compliance against current template)
- Re-extract Certificate button (uses AI credits, re-processes PDF)
- Compliance report export (PDF and CSV)
- Compliance report page at `/report/[reportId]` — visual report with donut chart, issue lists, vendor breakdown, action items, and upgrade CTA
- Waiver/override tracking with reason, expiration, audit trail
- Coverage gap details with specific shortfalls (e.g., "GL limit is $500K but requirement is $1M")
- Vendor/tenant detail pages: two-column layout (PDF viewer left, compliance checklist right)
- Self-service vendor/tenant portal (token-based, no auth required)
- Automated notifications & follow-up emails (expiration warnings)
- Stripe billing with three tiers and trial enforcement
- Archive, delete, and bulk actions for vendors/tenants
- SEO content pages and blog (MDX)
- 57 programmatic pages under /insurance-requirements/ (48 noindexed, 8 hub pages with unique content, 6 coverage guides)
- 13 blog posts (MDX) with inline CTAs and bottom-of-post CTAs
- 10 competitor comparison pages under /compare/ (TrustLayer, Certificial, Billy, SmartCompliance, PINS, CertFocus, BCS, Jones, MyCOI, Spreadsheets)
- 7 vertical landing pages under /for/
- 6 industry vertical pages under /for/ (Construction, Logistics, Healthcare, Manufacturing, Hospitality, Retail)
- 2 alternatives pages under /alternatives/
- Free assessment intake page at /free-assessment (email form → tony@smartcoi.io via Resend)
- $299 COI compliance audit service page at /audit (Stripe payment link)
- www to non-www 301 redirect
- Session expiration (24h standard / 7d with "Remember me") with cookie-based middleware gate
- Real-time dashboard & reporting
- Industry selector in onboarding (8 industries with icons)
- Terminology mapping layer — dashboard labels adapt based on org industry
- Unified entity model (entities table with type field, dual-writing to legacy tables)
- Locations optional — COI tracking works without creating properties/projects
- 28 industry-specific compliance templates across 8 industries
- Industry-aware AI template recommendations
- Conditional PM-only features (lease extraction, tenant entity type)
- Competitive comparison table on landing page ("Why teams switch to SmartCOI" — SmartCOI vs Typical COI Platform, 7 rows, no named competitors)
- Risk quantification engine — calculates dollar-value exposure gaps per entity and per coverage type, with prioritized action items (`src/lib/compliance/risk-quantification.ts`)
- Compliance audit PDF report generator — server-side PDF generation from risk quantification data with executive summary, portfolio overview, entity detail, expiration calendar, and recommendations (`src/lib/reports/compliance-audit-report.ts`)

### Features That DO NOT EXIST (never reference)

- Manual review workflow (removed — compliance is now fully automatic after extraction)
- `review_confirmed` certificate status (removed)
- `confirmCertificate()` or `quickConfirmCertificate()` actions (removed)
- Portfolio Overview sidebar card (removed — data already in compliance health bar)
- Compliance Score sidebar card (removed — redundant with health bar)
- Expiring Soon sidebar card (removed — redundant with action queue)
- Compliance Trend chart (removed from dashboard — can be added back in analytics)
- Quick Stats / "This Month" card (removed from dashboard)
- Upcoming Expirations sidebar widget (removed — redundant with action queue)
- Duplicate & Customize button on template cards (removed)
- Integrations with Procore, MRI, Yardi, AppFolio, or any third-party tools
- Shared vendor network/database
- Human/manual insurance review services
- Enterprise tier or custom pricing

### Recent Changes

#### Feature: Compliance Report Page at /report/[reportId] (Apr 2026)

Created a client-rendered compliance report page that fetches data from `GET /api/reports/compliance` and displays a full visual report. Requires authentication (middleware-gated, not in publicRoutes).

**Route:** `/report/[reportId]` — outside /dashboard route group, no dashboard shell/sidebar

**Page sections:**
1. **Hero** — large donut/ring chart (SVG) showing compliance score with red/amber/green color coding, total compliance gaps (big number), total dollar exposure estimate (big number)
2. **Critical Issues** — expired policies, missing required coverages. Red background/border styling. Green "No critical issues" banner when empty.
3. **Warnings** — expiring within 30 days, insufficient limits, missing endorsements. Amber styling. Green "No warnings" banner when empty.
4. **Vendor-by-Vendor Breakdown** — expandable cards per vendor: name + inferred type badge (or "Unclassified" if `vendorTypeNeedsReview`), status badge (compliant/non-compliant/expired/etc.), expandable detail with coverages on file table and requirements table with gap highlighting
5. **Recommended Actions** — numbered list ranked by severity (critical → warning → info), with vendor name, dollar exposure, action description, and top gap details
6. **Summary Stats** — 4-stat grid (total vendors, compliant %, expired, expiring in 30d) + coverage breakdown table by type (vendors affected, missing, insufficient, exposure)
7. **Vendors We Couldn't Classify** — entities with `vendorTypeNeedsReview: true`, shown with amber styling and current inferred type badge
8. **Upgrade CTA** — factual tone: "This report is accurate as of [date]. Certificates expire, vendors change..." with "Start Monitoring — $79/month" button linking to /#pricing

**Design:** shadcn/ui components (Card, Badge, Button, Skeleton), Lucide icons, Tailwind CSS. Emerald/slate palette matching SmartCOI dashboard. Mobile responsive. Loading skeleton while fetching. Error state with login link for 401s.

**Files created:**
- `src/app/report/[reportId]/page.tsx` — server component with metadata, renders ReportClient
- `src/app/report/[reportId]/report-client.tsx` — client component: fetches `/api/reports/compliance`, renders all 8 sections with SVG donut chart, expandable vendor cards, issue lists, and upgrade CTA

#### Feature: Compliance Report JSON API Endpoint (Apr 2026)

Created `GET /api/reports/compliance` — on-demand compliance report endpoint that returns structured JSON for the authenticated user's organization. No report entity or pre-generation required; data is computed live from current org state.

**Endpoint:** `GET /api/reports/compliance`
- Auth: requires authenticated user with organization (middleware-gated, not in publicRoutes)
- Returns: JSON with full compliance breakdown

**Response shape:**
- `generatedAt` — ISO timestamp
- `organizationName` — org display name
- `summary` — aggregate stats: `totalEntities`, `compliantCount`, `nonCompliantCount`, `complianceScore` (percentage), `totalGaps`, `totalExposure` (dollar value), `expiredCount`, `expiringIn30Days`, `needsSetupCount`, `underReviewCount`, `missingEndorsementCount`
- `issues[]` — flat list of all compliance issues with `severity: 'critical' | 'warning'`, `type` (expired_policy, expired_coverage, missing_coverage, expiring_soon, insufficient_coverage, missing_endorsement), and `description`
- `vendors[]` — per-entity breakdown: entity name/type, `inferredVendorType` + `inferredVendorTypeLabel`, `vendorTypeNeedsReview` flag, `complianceStatus`, `totalExposure`, `coveragesOnFile[]` (coverage type, carrier, limits, dates, isExpired), `requirements[]` (required coverage type, minimum limit, endorsement flags, compliance status, gap description, dollar gap), `gaps[]` (unmet requirements with gap type, dollar amount, description)
- `coverageBreakdown[]` — per-coverage-type aggregation: entity count, total exposure, missing/insufficient/endorsement gap counts
- `recommendedActions[]` — top 5 priority actions ranked by severity (expired → exposure amount), with action description and top gaps
- `needsReview[]` — entities where AI vendor type classification was low-confidence (`vendorTypeNeedsReview: true`)

**Data pipeline:** entities table → latest certificates (via entity_id/vendor_id/tenant_id) → parallel fetch of compliance_results + extracted_coverages + template_coverage_requirements → `quantifyRisk()` → structured JSON response

**Files created:**
- `src/app/api/reports/compliance/route.ts` — GET route handler with auth, data fetching, risk quantification, issues classification, and vendor breakdown

**Activity logging:** Logs `compliance_report_generated` to activity_log with entity count and compliance rate.

#### Feature: Auto-Entity Creation During Batch Extraction (Apr 2026)

After batch extraction completes for each certificate, the server now automatically creates vendor entities from the extracted insured names — no manual roster review step needed during onboarding.

**Changes to `src/app/api/certificates/batch-extract/route.ts`:**
- `extractSingleCertificate()` now returns `insuredName` in addition to vendor type data
- `onStatusChange` callback in the `after()` block now calls `autoAssignCertificateToEntity()` after each successful extraction, passing `insuredName`, `inferredVendorType`, `vendorTypeNeedsReview`, `propertyId`, and `entityType` from the batch context
- New `autoApplyRecommendedTemplate()` helper: after entity creation, looks up recommended coverage requirements via `getRecommendedRequirements(industry, vendorType)` and creates an AI-recommended template with those requirements, then assigns it to the entity
- Fetches org `industry` from the organizations table to pass to the requirements lookup
- Entity type defaults to `'vendor'` when not specified by the client (onboarding flow)
- Template creation is skipped if entity already has a template assigned (idempotent)

**Data flow:** COI PDF → AI extraction → `extractSingleCertificate` → `autoAssignCertificateToEntity` (creates entity with vendor type) → `autoApplyRecommendedTemplate` (creates template with recommended requirements, assigns to entity) → `runAutoCompliance` (calculates compliance against the new template)

**Works for both flows:**
- **Onboarding:** entities auto-created, templates auto-assigned → user goes straight to dashboard
- **Dashboard bulk upload:** entities auto-created in background → roster review step shows pre-matched entities

#### Refactor: Simplified 2-Step Onboarding Flow (Apr 2026)

Replaced the 6-step onboarding wizard with a streamlined 2-step flow: select industry → upload COIs → dashboard.

**New flow:**
1. **Select Industry** — single dropdown with 10 industry options (added `general_contractor` and `professional_services`)
2. **Upload COIs** — drag & drop PDFs, uses the existing batch-extract API with `BatchProgressTracker` for background processing. After batch completes, auto-completes onboarding and redirects to dashboard.
3. Users can skip the upload step to go straight to the dashboard.

**Old steps removed from the flow** (code preserved for future use):
- Organization setup (step 2) — org is auto-created from signup data
- Property/location setup (step 3) — can be done from dashboard settings
- Template configuration (step 5) — can be done from dashboard templates page
- Assign requirements (step 6) — can be done from dashboard

**Files changed:**
- `src/app/(onboarding)/setup/page.tsx` — rewrote from scratch with 2-step flow; uses `BatchProgressTracker` for upload progress; calls `completeOnboarding()` on finish
- `src/types/index.ts` — added `general_contractor` and `professional_services` to `Industry` union type
- `src/lib/constants/industries.ts` — added `General Contractor` and `Professional Services` to `INDUSTRY_OPTIONS`
- `supabase/migrations/20260410_add_new_industry_values.sql` — drops and re-creates `organizations_industry_check` with expanded industry values

**Preserved:**
- Old onboarding step components in `src/components/onboarding/` — not deleted, still importable
- `completeOnboarding()` and `isOrgOnboarded()` server actions — unchanged
- Dashboard/onboarding layout redirect logic — unchanged
- Onboarding-completed flag in `organizations.settings` JSONB — unchanged

⚠️ ACTION REQUIRED: Run `supabase/migrations/20260410_add_new_industry_values.sql` in Supabase SQL Editor.

#### Fix: Batch Completion UI Stuck on "Waiting for extraction..." (Apr 2026)

After batch processing completed (processing_batches showed status=complete), the bulk upload UI stayed stuck showing "Waiting for extraction..." instead of transitioning to the Review Roster step. Two root causes found and fixed:

**Root cause 1 — DB query silently failing on optional columns:**
- `handleBatchComplete` queried `inferred_vendor_type` and `vendor_type_needs_review` columns on the certificates table in a single SELECT. If the vendor type inference migration hadn't been run, PostgREST returned an error (data=null). The `if (certs)` check skipped the `setFiles` call, so files stayed in `'extracting'` status → `allProcessed` never became true → no "Continue to Review" button.
- **Fix:** Split into two queries: a core query (`id, insured_name, processing_status`) that always works, and a separate try/catch query for vendor type columns that fails gracefully. If the core query also fails, a fallback marks all extracting files as `'done'` so the UI always transitions.

**Root cause 2 — Stale `files` closure in `handleBatchComplete`:**
- `handleBatchComplete` was `useCallback([files, supabase])` and used `files` from the closure to compute `certIds`. If `files` was stale (captured before upload phase completed), `certIds` could be empty → no DB query → no status update.
- **Fix:** Read cert IDs from current state using `setFiles((prev) => { certIds = prev.filter(...); return prev; })` pattern. Removed `files` from `useCallback` deps.

**Files changed:**
- `src/app/(dashboard)/dashboard/certificates/bulk-upload/page.tsx` — rewrote `handleBatchComplete` with resilient DB queries, stale-closure fix, and fallback transitions
- `src/components/onboarding/step-bulk-upload.tsx` — same fixes applied to onboarding `handleBatchComplete`

#### Fix: All Certificate CHECK Constraints Blocking Batch Processing (Apr 2026)

Bulk uploads were failing with `certificates_upload_source_check` violation after the previous `certificates_has_entity_check` fix. Root cause: the v2 migration (`20260217_v2_schema_migration.sql`) created an inline CHECK on `upload_source` that only allows `('pm_upload', 'portal_upload')` — missing `'user_upload'` which all 4 client-side upload paths use.

Rather than fixing constraints one at a time, created a comprehensive migration that drops ALL existing CHECK constraints on the certificates table and re-creates them with correct values:

**Migration:** `supabase/migrations/20260410_fix_all_certificate_checks.sql`
- Dynamically finds and drops all CHECK constraints via `pg_constraint`
- Re-creates 3 named constraints:
  - `certificates_upload_source_check` — allows `'user_upload'`, `'pm_upload'`, `'portal_upload'`
  - `certificates_processing_status_check` — allows `'processing'`, `'extracted'`, `'review_confirmed'`, `'failed'`
  - `certificates_has_entity_check` — requires entity FK unless `processing_status = 'processing'`

⚠️ ACTION REQUIRED: Run `supabase/migrations/20260410_fix_all_certificate_checks.sql` in Supabase SQL Editor. This supersedes the previous `20260410_fix_certificate_entity_check.sql` — run this one instead (or after, it's idempotent).

#### Fix: Bulk Upload Entity Check Constraint Blocking Batch Processing (Apr 2026)

All bulk uploads were failing with: `new row for relation 'certificates' violates check constraint 'certificates_has_entity_check'`.

**Root cause:** The `certificates_has_entity_check` constraint (from `20260409_add_certificate_fk_check.sql`) required at least one of `entity_id`, `vendor_id`, or `tenant_id` to be non-null at INSERT time. But the batch processing flow (Phase 1B) creates certificate records before extraction and entity assignment — the cert is uploaded to storage first, then extracted in the background, then assigned to an entity after.

**Fix:** Modified the CHECK constraint to allow NULL entity FKs when `processing_status = 'processing'` (cert just created, extraction pending). All other statuses still require at least one entity FK to be set.

**Migration:** `supabase/migrations/20260410_fix_certificate_entity_check.sql` — drops old constraint, adds relaxed version

**Affected flows (2 broken, 3 unaffected):**
- `step-bulk-upload.tsx` (onboarding bulk) — inserts cert with no entity IDs, assigns later → **was broken, now fixed**
- `bulk-upload/page.tsx` (dashboard bulk) — inserts cert with no entity IDs, assigns during roster step → **was broken, now fixed**
- `entity-creation-wizard.tsx` — sets vendor_id/tenant_id at insert → unaffected
- `portal/[token]/upload/route.ts` — sets entity IDs at insert → unaffected
- `certificates/upload/page.tsx` (single upload) — sets all 3 IDs at insert → unaffected

⚠️ ACTION REQUIRED: Run `supabase/migrations/20260410_fix_certificate_entity_check.sql` in Supabase SQL Editor.

#### Fix: Bulk Upload Page Crash — Radix Select Empty Value + Polling Loop (Apr 2026)

The dashboard bulk upload page at `/dashboard/certificates/bulk-upload` was crashing with "Something went wrong" error boundary. Two issues found and fixed:

**Root cause 1 — Radix Select `value=""` runtime error:**
- `@radix-ui/react-select@2.x` throws at runtime: "A \<Select.Item /\> must have a value prop that is not an empty string"
- The Property select had `<SelectItem value="">No property — org level</SelectItem>` which crashed immediately on render
- **Fix:** Changed to sentinel value `__none__` — `<SelectItem value="__none__">` with value mapping in `onValueChange` to convert back to empty string

**Root cause 2 — BatchProgressTracker infinite polling loop:**
- `fetchStatus` callback depended on `onComplete` and `showEmailPrompt` via useCallback deps
- `onComplete` was recreated on every render (parent's `handleBatchComplete` depends on `files` state)
- This caused `fetchStatus` → `useEffect` → `setInterval` to re-run on every state update, stacking intervals
- **Fix:** Used refs (`onCompleteRef`, `showEmailPromptRef`) to read latest values without adding them to callback deps. `fetchStatus` now depends only on `[batchId]` — stable across renders

**Files changed:**
- `src/app/(dashboard)/dashboard/certificates/bulk-upload/page.tsx` — fixed empty-string SelectItem value
- `src/components/dashboard/batch-progress-tracker.tsx` — fixed useCallback/useEffect dependency loop with refs

#### Fix: Extraction Retry Logic + Failure Tracking + Sentry (Apr 2026)

Added automatic retries and structured failure tracking for COI extraction. Failures are no longer silently dropped — they persist in the DB with retry metadata and are reported to Sentry.

**Retry architecture (three non-conflicting layers):**
1. **`extraction.ts` (Anthropic API layer):** retries 429/529/502/503 with 5s→15s→30s→60s→90s backoff (5 retries) — handles transient Anthropic API issues
2. **`concurrent-queue.ts` (queue layer, batch only):** retries 429 rate-limit errors at the queue level with 4s→8s→16s backoff (3 retries) — prevents batch-wide rate-limit cascading
3. **`extraction-retry.ts` (route layer, NEW):** retries all OTHER failures (malformed PDFs, parse errors, timeouts, storage errors) with 2s→4s→8s backoff (3 retries) — 429 errors pass through to the lower layers

**Files changed:**
- `src/lib/utils/extraction-retry.ts` — **NEW** — `withExtractionRetry()` wrapper; retries non-rate-limit extraction failures up to 3 times with exponential backoff; provides `onAttempt` callback for per-attempt DB tracking
- `src/app/api/certificates/extract/route.ts` — wrapped AI extraction call with `withExtractionRetry()`; stores `retry_count` and `last_error` on certificate; reports failures to Sentry with `tags: { flow: 'single_extract', certificateId }` and `extra: { attempts, errorMessage }`
- `src/app/api/certificates/batch-extract/route.ts` — same retry wrapper in `extractSingleCertificate()`; Sentry reports with `tags: { flow: 'batch_extract' }`
- `supabase/migrations/20260410_add_extraction_retry_tracking.sql` — adds `retry_count INTEGER DEFAULT 0` and `last_error TEXT` columns to certificates table

**Key behaviors:**
- On success after retries: `retry_count` records total attempts, `last_error` cleared to null
- On final failure: `processing_status: 'failed'`, `retry_count` records total attempts, `last_error` stores the error message
- Activity log entries include attempt count: "COI extraction failed after 4 attempt(s): ..."
- Sentry receives structured error with flow tag, certificateId, orgId, and attempt count
- 429 rate-limit errors are NOT retried at this layer — they pass through immediately to the lower extraction.ts / concurrent-queue.ts layers that already handle them

⚠️ ACTION REQUIRED: Run `supabase/migrations/20260410_add_extraction_retry_tracking.sql` in Supabase SQL Editor.

#### Feature: AI Vendor Type Inference in Extraction Pipeline (Apr 2026)

Added vendor trade/type inference to the AI extraction pipeline. The AI now infers the vendor's trade from the insured name, description of operations, and coverage types on the certificate.

**Supported vendor types:** plumber, electrician, hvac, landscaper, general_contractor, roofing, painting, cleaning_janitorial, fire_protection, elevator, security, pest_control, other

**Files changed:**
- `src/lib/ai/extraction.ts` — added `inferred_vendor_type` section to system prompt with vendor type enum and confidence instructions; added `AIVendorTypeInference` interface to `AIExtractionResponse`; added `inferredVendorType` and `vendorTypeNeedsReview` fields to `ExtractionResult`; `mapToDbRows()` maps the AI response to these fields
- `src/lib/constants/vendor-requirements.ts` — **NEW** — vendor requirements mapping config; `getRecommendedRequirements(industry, vendorType)` returns recommended coverage types and minimum limits for a given industry + vendor type combination; property_management industry fully built out with per-trade requirements (e.g., electrician → GL $2M/$4M, WC, Auto, Umbrella $5M); other industries fall back to general_contractor defaults (Phase 2 stub)
- `src/lib/actions/certificates.ts` — `autoAssignCertificateToEntity()` now accepts `inferredVendorType` and `vendorTypeNeedsReview` params; stores vendor type in `entity_category` on entities table and `vendor_type` on legacy vendors table; for existing entities, backfills vendor type only if `entity_category` is null
- `src/app/api/certificates/extract/route.ts` — stores `inferred_vendor_type` and `vendor_type_needs_review` on certificate record; returns both in API response
- `src/app/api/certificates/batch-extract/route.ts` — same: stores vendor type on certificate during background extraction
- `src/components/onboarding/step-bulk-upload.tsx` — `handleBatchComplete` fetches `inferred_vendor_type` from certificates and passes to `autoAssignCertificateToEntity()`
- `src/app/(dashboard)/dashboard/certificates/bulk-upload/page.tsx` — `FileEntry.extractedData` extended with `inferredVendorType` and `vendorTypeNeedsReview`; `handleBatchComplete` fetches vendor type from certificates
- `src/types/index.ts` — added `vendor_type_needs_review` to Entity interface; added `inferred_vendor_type` and `vendor_type_needs_review` to Certificate interface
- `supabase/migrations/20260410_add_vendor_type_inference.sql` — adds `vendor_type_needs_review` column to entities and vendors tables; adds `inferred_vendor_type` and `vendor_type_needs_review` columns to certificates table

**Data flow:** COI PDF → AI extraction (infers vendor type + confidence) → stored on certificate record → passed to `autoAssignCertificateToEntity()` → stored on entity (`entity_category` + `vendor_type_needs_review`) → `getRecommendedRequirements()` available for compliance/template recommendation

**Key behaviors:**
- High confidence: vendor type stored directly (e.g., "ABC Plumbing Inc" → plumber/high)
- Low confidence: type stored as "other" with `vendor_type_needs_review: true`
- Existing entities: vendor type only backfilled if `entity_category` is currently null (preserves manual overrides)
- Industry lookup stubbed to default to "property_management" (Phase 2 will add real org industry lookup)

⚠️ ACTION REQUIRED: Run `supabase/migrations/20260410_add_vendor_type_inference.sql` in Supabase SQL Editor.

#### Feature: Background COI Batch Processing (Apr 2026)

Added server-side background processing for bulk COI uploads using Next.js `after()` (Vercel Fluid Compute, 800s max). Users no longer need to keep the browser open during extraction.

**Architecture:**
- **Batch extraction API** (`src/app/api/certificates/batch-extract/route.ts`) — receives certificate IDs, creates a `processing_batches` record, returns immediately with batch ID, then processes extractions in the background via `after()` using `processConcurrentQueue()` with concurrency of 5
- **Batch status polling API** (`src/app/api/certificates/batch-status/route.ts`) — GET returns batch progress (completed/failed counts), PATCH updates `client_active` flag for email decision
- **Processing batches table** (`supabase/migrations/20260410_add_processing_batches.sql`) — tracks batch status, progress counts, certificate IDs, property/entity context, and client polling state; RLS scoped to org via `get_user_organization_id()`
- **Batch completion email** (`src/lib/emails/batch-complete.ts`) — sent via Resend when batch completes and client has navigated away; subject "Your SmartCOI compliance report is ready"; includes cert count, compliance gaps, vendor count, and dashboard link
- **BatchProgressTracker component** (`src/components/dashboard/batch-progress-tracker.tsx`) — polls batch status every 4s, shows progress bar with ETA, handles page unload via `sendBeacon` to mark `client_active = false`, shows "we'll email you" prompt after 2 min, auto-completes on batch finish

**Client-side behavior:**
- Upload phase (file → storage → cert record) runs client-side for immediate feedback
- Extraction phase delegated to server background via batch-extract API
- `BatchProgressTracker` polls for progress and shows real-time updates
- On batch completion: fetches extracted data from DB, updates file statuses, transitions to next step
- On page unload: `sendBeacon` marks batch as `client_active = false` → server sends email on completion
- After 2 min wait: shows "This is taking a bit — we'll email you when it's ready" with dismiss option

**Files changed:**
- `src/components/onboarding/step-bulk-upload.tsx` — split upload/extraction phases; upload runs client-side, extraction delegated to batch-extract API; added `BatchProgressTracker` for background progress
- `src/app/(dashboard)/dashboard/certificates/bulk-upload/page.tsx` — same split; removed client-side `processConcurrentQueue` usage; added `BatchProgressTracker` and `handleBatchComplete` callback

⚠️ ACTION REQUIRED: Run `supabase/migrations/20260410_add_processing_batches.sql` in Supabase SQL Editor to create the `processing_batches` table.

#### Refactor: Parallel COI Bulk Upload Processing (Apr 2026)

Refactored bulk upload from sequential (one-at-a-time with 2s pause) to parallel processing with a concurrency pool of 5, reducing ~40 min for 50 COIs to ~10 min.

- Created `src/lib/utils/concurrent-queue.ts` — generic `processConcurrentQueue()` utility with configurable concurrency limit (default 5), per-item error isolation, progress callbacks, AbortSignal support, and 429 rate-limit exponential backoff retry (max 3 retries with 4s/8s/16s backoff)
- **Onboarding bulk upload** (`src/components/onboarding/step-bulk-upload.tsx`) — replaced sequential `for` loop with `processConcurrentQueue()` call; removed `BATCH_PAUSE_MS` constant; added `CONCURRENCY_LIMIT = 5`
- **Dashboard bulk upload** (`src/app/(dashboard)/dashboard/certificates/bulk-upload/page.tsx`) — replaced sequential `for` loop with `processConcurrentQueue()` call; removed `FILE_PAUSE_MS` constant; added `CONCURRENCY_LIMIT = 5`; reduced `EST_SECONDS_PER_FILE` from 25 to 8 for more accurate parallel ETA
- Both upload flows retain: per-file error handling (one failure doesn't block others), cancel/abort support, retry UI for failed files, duplicate detection, plan limit enforcement
- AI extraction logic (`src/lib/ai/extraction.ts`) and compliance calculation untouched — only the client-side orchestration layer changed
- Server-side retry (5 retries with 5s/15s/30s/60s/90s backoff for 529 errors) still runs per-request inside the extraction API route

#### Fix: Professional Plan Limits Match "Unlimited" Marketing (Apr 2026)

- `src/lib/plan-limits.ts` — raised Professional plan caps from 250 vendors/tenants + 200 extractions/month to 10,000 each (effectively unlimited), matching "Unlimited certificates" marketing
- Updated upgrade prompt messages from "250 vendors & tenants" / "200 extractions" to "unlimited"
- Starter and Growth plan limits unchanged

#### Free Assessment Page + Site-Wide Continuity Audit (Apr 2026)

**Free Assessment Intake Page (`/free-assessment`):**
- Created `src/app/free-assessment/page.tsx` — client-side intake form for free COI compliance assessment
- Form fields: Full Name, Company Name, Email, Phone (optional), Vendor Count (dropdown), Message (optional)
- Submits to `src/app/api/free-assessment/route.ts` which sends email notification to tony@smartcoi.io via Resend
- Success state: "Thanks! We'll reach out within 24 hours with instructions to submit your COI files."
- Subtle upsell to $299 paid audit below the form ("Learn About Our Full Audit — $299" → /audit)
- SEO meta tags with canonical URL `https://smartcoi.io/free-assessment`, Open Graph tags
- Added to middleware public routes (both page and API route)
- Added to sitemap with priority 0.8
- Added "Free Assessment" link to footer Resources section

**Homepage CTA Fix:**
- Changed "Not Ready for Software?" section CTA from `/audit` to `/free-assessment` — resolves free/paid confusion

**Site-Wide Continuity Audit — Issues Found and Fixed:**

*Dead links (2 fixes):*
- `insurance-requirements/coverage/[slug]/page.tsx:293` — broken link `/blog/additional-insured-endorsements-explained` → fixed to `/blog/what-is-additional-insured-commercial-real-estate`
- `insurance-requirements/coverage/[slug]/page.tsx:299` — broken link `/pricing` → fixed to `/#pricing`

*Blog CTA links (5 fixes):*
- `acord-28-evidence-of-property-insurance.mdx:138` — "Start your free trial" linked to homepage → fixed to `/signup`
- `subcontractor-insurance-requirements.mdx:118` — same fix
- `acord-25-certificate-explained.mdx:112` — "try it free" linked to homepage → fixed to `/signup`
- `acord-25-certificate-explained.mdx:160` — "Start your free trial" linked to homepage → fixed to `/signup`
- `coi-expiration-tracking-best-practices.mdx:128` — same fix

*PM-exclusive language (15+ fixes across compare, alternatives, and SEO pages):*
- `opengraph-image.tsx` — "for Commercial Property Managers" → "AI-Powered COI Tracking for Every Industry"
- `compare/smartcoi-vs-pins/page.tsx` — removed all "built exclusively for property managers" language
- `compare/smartcoi-vs-billy/page.tsx` — removed "purpose-built for commercial property managers"
- `compare/smartcoi-vs-smartcompliance/page.tsx` — removed "purpose-built for property managers"
- `compare/smartcoi-vs-trustlayer/page.tsx` — removed "Purpose-built for property managers"
- `compare/smartcoi-vs-mycoi/page.tsx` — removed "Purpose-built for commercial real estate"
- `compare/page.tsx` — removed "built exclusively for property managers" from PINS description
- `alternatives/mycoi/page.tsx` — removed "the only platform built exclusively for property managers"
- `alternatives/jones/page.tsx` — removed "Purpose-built for commercial real estate property managers"
- `certificate-of-insurance-tracking/page.tsx` — meta descriptions broadened to include contractors and operations teams
- `coi-tracking-software/page.tsx` — body text and JSON-LD broadened to include contractors and operations teams
- `terms/page.tsx` — "for commercial property managers" → "for businesses across multiple industries"
- `insurance-requirements/[property]/[coverage]/page.tsx` — removed "for property managers" from meta descriptions

*Missing OG tags (3 fixes):*
- `blog/page.tsx` — added openGraph metadata
- `terms/page.tsx` — added openGraph metadata
- `privacy/page.tsx` — added openGraph metadata

*Blog meta description fix:*
- `blog/page.tsx` — removed "for commercial property managers" from description

*Pricing consistency fix:*
- `best-coi-management-software.mdx` — added "(annual)" clarifier to Growth and Professional pricing

*Stale dates (2 fixes):*
- `alternatives/jones/page.tsx` — title year 2025 → 2026
- `alternatives/mycoi/page.tsx` — title year 2025 → 2026

#### Fix: P1 WARNING-Level Audit Findings (Apr 2026)

Fixed all 16 WARNING-level issues from the comprehensive QA audit:

**Signup (1 fix):**
- Added password length validation (min 6 chars) before Supabase signup call (`src/app/(auth)/signup/page.tsx`)

**Extraction (2 fixes):**
- Added structural validation for AI JSON response — ensures `coverages`, `endorsements` arrays and `named_insured` string exist before processing (`src/lib/ai/extraction.ts`)
- Documented endorsement checks as intentionally limited to required coverages only (`src/lib/compliance/calculate.ts`)

**Bulk upload (1 fix):**
- Progress bar now shows successful count only in green, failed count in red — no longer counts failures as "complete" (`src/components/onboarding/step-bulk-upload.tsx`)

**Reports (2 fixes):**
- Audit PDF now renders "No Certificate on File" and "Needs Configuration" sections for entities with `pending` and `needs_setup` statuses (`src/lib/reports/compliance-audit-report.ts`)
- Compliance rate calculation already excludes non-evaluable entities (from P0 fix)

**Portal (1 fix):**
- PM notification email failure now logged with entity name, recipient email, and error details; notification record updated to `status: 'failed'` (`src/app/portal/[token]/extract/route.ts`)

**Billing (2 fixes):**
- `subscription.updated` webhook now checks `subscription.status === 'active'` before updating plan — `past_due` subscriptions no longer treated as active (`src/app/api/webhooks/stripe/route.ts`)
- Documented extraction limit exclusion of failed extractions as intentional (`src/lib/plan-limits.ts`)

**Entity management (2 fixes):**
- `updateEntity()` now dual-writes `property_id` to legacy tables (`src/lib/actions/entities.ts`)
- `permanentlyDeleteEntity()` now explicitly cleans up legacy `vendor_id`/`tenant_id` references in certificates, notifications, and portal tokens before deletion

**Email notifications (3 fixes):**
- `getOrgStats()` now queries unified `entities` table instead of legacy `vendors` table (`src/lib/emails/trial-lifecycle.ts`)
- Notification deduplication key now includes threshold value to prevent same threshold firing multiple times (`src/lib/notifications/scheduler.ts`)
- Documented `sendManualFollowUp()` as intentionally ignoring `notifications_paused` — admin manual override by design (`src/lib/actions/notifications.ts`)

**Public pages (1 fix):**
- Fixed OpenGraph URL mismatch on `/features/coi-tracking` — now matches canonical URL `https://smartcoi.io/coi-tracking-software` (`src/app/features/coi-tracking/page.tsx`)

**Data integrity (1 migration):**
- Created `supabase/migrations/20260409_add_certificate_fk_check.sql` — adds CHECK constraint requiring at least one of `entity_id`, `vendor_id`, `tenant_id` to be non-null on certificates table

⚠️ ACTION REQUIRED: Run `supabase/migrations/20260409_add_certificate_fk_check.sql` in Supabase SQL Editor. Must run `20260408_fix_orphaned_bulk_upload_certs.sql` first to fix any existing orphaned records.

#### Fix: P0 Critical Fixes from QA Audit (Apr 2026)

Fixed all 9 CRITICAL issues from the comprehensive QA audit:

**Billing enforcement (3 fixes):**
- `getActivePlanStatus()` now checks `payment_failed` flag — paid plans with failed payments are blocked from operations (`src/lib/plan-status.ts`)
- `checkVendorTenantLimit()` now calls `getActivePlanStatus()` — expired trials and failed payments block entity creation (`src/lib/plan-limits.ts`)
- Stripe webhook error handler now returns HTTP 500 on failure — enables Stripe retry on transient DB errors (`src/app/api/webhooks/stripe/route.ts`)
- All callers of `getActivePlanStatus` updated to include `payment_failed` in their org select queries

**Extraction validation (1 fix):**
- Zero-coverage AI extractions now return `success: false` with user message "No insurance coverage data found" — prevents random PDFs from being accepted as valid COIs (`src/lib/ai/extraction.ts`)

**Bulk upload UX (2 fixes):**
- Added per-file "Retry" button and "Retry All Failed" button to onboarding bulk upload (`src/components/onboarding/step-bulk-upload.tsx`)
- Added "Cancel Upload" button during processing — sets abort flag to stop remaining files while keeping already-processed ones

**Report completeness (2 fixes):**
- Added `needs_setup` and `under_review` to compliance report status breakdown — both PDF and CSV exports now account for all 7 compliance statuses (`src/lib/actions/reports.ts`, `export-report-button.tsx`)
- Compliance rate now excludes `needs_setup` and `under_review` entities from denominator — prevents inflation from non-evaluable entities (`src/lib/compliance/risk-quantification.ts`)

**Portal security (1 fix):**
- Added in-memory rate limiter (10 requests/IP/minute) to portal token lookup — blocks automated UUID scanning (`src/app/portal/[token]/page.tsx`, `src/lib/rate-limit.ts`)

#### Audit: Comprehensive 10-Flow QA Audit (Apr 2026)

Full 10-flow QA audit covering signup, extraction, bulk upload, reports, portal, billing, entity management, emails, public routes, and data integrity. Found 10 CRITICAL, 14 WARNING, 10 INFO issues across all flows. Key findings:

**CRITICAL:**
- `payment_failed` flag not checked in `getActivePlanStatus()` — failed payments don't block operations (`src/lib/plan-status.ts`)
- `checkVendorTenantLimit()` doesn't check trial expiration — only checks `plan === 'canceled'` (`src/lib/plan-limits.ts:30-82`)
- Stripe webhook swallows errors and returns 200 — prevents Stripe from retrying failed events (`src/app/api/webhooks/stripe/route.ts:214-217`)
- `needs_setup` and `under_review` statuses missing from compliance report breakdown (`src/lib/actions/audit-report.ts`, `export-report-button.tsx`)
- Zero-coverage AI extractions accepted as valid — random PDFs pass extraction without warning (`src/lib/ai/extraction.ts`)
- No rate limiting on portal token lookup — brute-force enumeration possible (`src/app/portal/[token]/page.tsx`)
- Permanent delete doesn't explicitly clean up all related records across dual tables (`src/lib/actions/entities.ts:250-267`)
- Bulk upload missing retry button and cancel option in onboarding flow (`src/components/onboarding/step-bulk-upload.tsx`)

**WARNING:**
- Trial lifecycle stats query reads from legacy `vendors` table only, not `entities` (`src/lib/emails/trial-lifecycle.ts`)
- Entity `updateEntity()` doesn't dual-write `entity_type` or `property_id` to legacy tables (`src/lib/actions/entities.ts`)
- Notification deduplication key doesn't include threshold — may fire multiple times per month (`src/lib/notifications/scheduler.ts`)
- Report compliance rate counts `needs_setup` entities as evaluable, inflating the rate
- OpenGraph URL mismatch on `/features/coi-tracking` page
- PM notification email on portal upload fails silently (`src/app/portal/[token]/extract/route.ts`)
- Extraction limit excludes failed extractions from count — inconsistent with user expectations (`src/lib/plan-limits.ts`)
- `subscription.updated` webhook doesn't check if subscription status is active vs past_due

#### Fix: Hydration errors on vendor detail and dashboard pages (Apr 2026)

Fixed recurring "Hydration failed" Sentry errors on vendor detail pages (`/dashboard/vendors/{id}`) caused by `new Date()` calls during render producing different values on server vs client.

**Root cause:** Six client components used `new Date()` in the render path to compute time-dependent values (expiration status, days remaining, color classes). Since SSR and client hydration occur at different moments, the computed values could differ, causing React hydration mismatches.

**Files fixed:**
- `src/components/compliance/compact-compliance-view.tsx` — `hasExpiredCoverage` now computed in `useEffect` instead of render
- `src/components/compliance/waiver-dialog.tsx` — `WaiverHistory` isActive/isExpired now uses client-side `now` via `useState`+`useEffect`
- `src/components/dashboard/trial-banner.tsx` — trial days remaining deferred to client mount via `useState`+`useEffect`
- `src/components/properties/property-detail-client.tsx` — COI expiration date color coding deferred to client via `clientNow` state
- `src/components/compliance/certificate-review-client.tsx` — coverage expiration status computed in `useEffect`
- `src/app/(dashboard)/dashboard/settings/billing/billing-client.tsx` — trial expiration check deferred to client mount

**Pattern applied:** Replace `new Date()` in render with `useState(null)` + `useEffect(() => set(new Date()), [])`. On server render, time-dependent values default to safe initial state; on client mount, they update to correct values.

#### Landing page audit section + login sidebar copy fix (Apr 2026)

- Added "Not Ready for Software? Start With a Free Compliance Assessment" section to the landing page (`src/app/page.tsx`) after FAQ and before final CTA — links to `/audit`, uses secondary button style to avoid competing with main SaaS offering
- Fixed login page sidebar copy in `src/app/(auth)/layout.tsx` — changed "commercial property managers" to "property managers, contractors, and operations teams" to match industry-broadened messaging

#### Fix: /audit page redirecting to login (Apr 2026)

- Added `/audit` to `publicRoutes` in `src/middleware.ts` so the page is accessible without authentication, matching other marketing pages

#### COI Compliance Audit Service Page (Apr 2026)

- Created `/audit` page (`src/app/audit/page.tsx`) — one-time $299 COI compliance audit service offering as a lead generation play
- Page sections: hero with Stripe payment link CTA, 3-step "How It Works", "What's In Your Report" checklist, "Who This Is For" audience cards, pricing section with second CTA, founder credibility quote, soft SaaS upsell to SmartCOI platform
- Two CTA buttons link to Stripe payment link (`buy.stripe.com`)
- SEO meta tags: title, description, canonical URL (`https://smartcoi.io/audit`), Open Graph
- Added `/audit` to sitemap with priority 0.8
- Added "Get a COI Audit" to navbar Resources dropdown and "COI Audit Service" to footer Resources section
- Matches existing design system — Inter font, emerald/slate palette, consistent spacing and component patterns

#### Fix: P1 Landing Page Copy + All 16 WARNING-Level Audit Findings (Apr 2026)

Fixed 3 P1 CRITICALs (landing page PM-exclusive copy) and all 16 WARNINGs from the industry-agnostic audit.

**Landing page (3 CRITICALs fixed):**
- `hero-section.tsx:80` — trust bar now says "Built for property managers, GCs, logistics teams, and more"
- `features-grid.tsx:123` — subtitle now industry-neutral: "Everything your team needs to track vendor and contractor insurance — from upload to compliance."
- `pricing-section.tsx:57-61` — value anchor generalized from PM-specific labor costs to "costs teams 15-20 hours per month"

**Dashboard (4 WARNINGs fixed):**
- `export-report-button.tsx:51,136,144` — PDF export now uses dynamic `locationLabel`, `entityLabel`, `tenantLabel` from terminology; Tenants section hidden when `totalTenants === 0`
- `dashboard-client.tsx:695` — error toast uses terminology-aware entity label instead of raw DB `entityType`
- `dashboard-tutorial.tsx:28,58` — tour steps use dynamic `locationPlural` and `entityPlural` from terminology
- `upload_source: 'pm_upload'` → `'user_upload'` in 4 upload paths; DB CHECK updated to allow both values for backward compatibility

**Compliance (2 WARNINGs fixed):**
- `templates.ts:262-278` — `recalculateComplianceForTemplate()` now also queries the unified `entities` table with deduplication, and uses `.or()` for certificate lookup across all 3 ID columns
- `extraction.ts:90-219` — reviewed; no PM-specific language found in the AI extraction prompt (ACORD 25 references are industry-standard)

**Portal (4 WARNINGs fixed):**
- `email-templates.ts:35-36` — removed unused `location_label`/`entity_label` from `EmailMergeFields` interface
- `upload/route.ts:154` — added comment explaining `getTerminology(null)` fallback (org lookup failed, "compliance team" is correct)
- `extract/route.ts:259,338,344` — changed PM-specific comments to "admin notification"; renamed `pmEmail` → `adminEmail`
- Deleted dead code: `src/lib/emailTemplates.ts` (never imported anywhere)

**Public pages (4 WARNINGs fixed):**
- `for/[vertical]/page.tsx:134` — testimonial heading now dynamic: "What {vertical.name} Teams Are Saying"
- `for/[vertical]/page.tsx:214` — CTA changed from "Join property managers" to "Join teams"
- `blog/page.tsx:27-28` — changed "property management best practices" to "vendor management best practices"
- `compare/page.tsx:169` — changed PM-only tool names to "industry-specific tools like Yardi, Procore, or your TMS"

**Email templates (3 WARNINGs fixed):**
- `email-templates.ts:28-31` — made `pm_name`/`pm_email` optional; callers now populate `admin_name`/`admin_email` alongside deprecated fields
- `email-templates.ts:136,167,197,222` — subjects already use industry-neutral "COI"/"certificate" terminology (no change needed)
- `emailTemplates.ts` — deleted (dead code, never imported)

#### Fix: Add `needs_setup` compliance status for unconfigured entities (Apr 2026)

Entities without requirement templates were previously marked `under_review`, which is misleading — that status means "COI being processed." New `needs_setup` status clearly indicates "no requirements configured."

- Added `needs_setup` to `ComplianceStatus` type (`src/types/index.ts`)
- `runAutoCompliance()` and `runComplianceForEntity()` now set `needs_setup` instead of `under_review` when entity has no template
- Dashboard renders `needs_setup` as purple "Needs Setup" pill, distinct from blue "Under Review"
- Added to all UI: `STATUS_CONFIG`, filter pills, health bar segments, action queue, entities page, properties page, compliance badge, property detail filter
- Admin recheck endpoint also targets `needs_setup` entities
- Created `supabase/migrations/20260409_add_needs_setup_status.sql` — adds `needs_setup` to CHECK constraints on vendors, tenants, and entities tables

⚠️ ACTION REQUIRED: Run `supabase/migrations/20260409_add_needs_setup_status.sql` in Supabase SQL Editor to add `needs_setup` to the compliance_status CHECK constraints.

#### Fix: Industry-Agnostic P0 Critical Fixes (Apr 2026)

Four critical fixes from the industry-agnostic expansion audit that blocked non-PM users:

**Fix 1 — Onboarding Step 6 blocks non-PM users from seeing COIs:**
- `src/components/onboarding/step-assign-requirements.tsx:52` — removed `propertyId` from the early-return guard. Non-PM users who skip the property step now see their uploaded certificates. When `propertyId` exists, certificates are scoped to that property's entities; otherwise all org certificates are fetched.

**Fix 2 — `entity_compliance_results.property_entity_id` NOT NULL FK violation:**
- `supabase/migrations/20260217_fresh_setup.sql:207` and `20260217_v2_schema_migration.sql:507` — changed `property_entity_id` from NOT NULL to nullable. Non-PM entities use `organization_default_entities` for entity matching, whose IDs don't exist in `property_entities`.
- Created `supabase/migrations/20260409_nullable_property_entity_id.sql` for production ALTER TABLE.

**Fix 3 — Zero requirements = silent compliance pass:**
- `src/lib/actions/certificates.ts:256-271` — `runAutoCompliance()` now returns early with `'under_review'` status when entity has no template or template has zero requirements. Previously, empty requirements meant zero gaps → `'compliant'`, silently masking unconfigured entities.

**Fix 4 — "Assign Now" banner links to wrong route:**
- `src/components/dashboard/dashboard-client.tsx:226` — changed `href="/dashboard/vendors"` to `href="/dashboard/entities"`.

⚠️ ACTION REQUIRED: Run `supabase/migrations/20260409_nullable_property_entity_id.sql` in Supabase SQL Editor to drop the NOT NULL constraint on `entity_compliance_results.property_entity_id`.

#### Audit: Industry-Agnostic Expansion — Full Codebase Audit (Apr 2026)

Comprehensive 7-area audit of the multi-industry expansion. Found 7 CRITICAL, 16 WARNING, 5 INFO issues.

**CRITICAL findings (broken functionality):**
- **Onboarding Step 6 blocks non-PM users:** `step-assign-requirements.tsx:52` — `if (!orgId || !propertyId)` guard prevents certificate fetch when `propertyId` is null (non-PM industries skip property step). Users see "No uploaded COIs found" despite having certificates.
- **"Assign Now" banner links to `/dashboard/vendors`:** `dashboard-client.tsx:226` — should link to `/dashboard/entities` for non-PM industries.
- **`entity_compliance_results` FK violation:** `fresh_setup.sql:207` — `property_entity_id UUID NOT NULL` constraint fails when compliance runs for non-PM entities using `organization_default_entities` (IDs don't exist in `property_entities` table).
- **No template enforcement for non-PM entities:** `certificates.ts:247-254` — entities without `template_id` run compliance with zero requirements, silently passing compliance.
- **Landing page hero says "Purpose-built for commercial property managers":** `hero-section.tsx:80` — contradicts "AI-Powered COI Tracking for Every Industry" headline.
- **Features grid says "Purpose-built for commercial property managers":** `features-grid.tsx:123` — same PM-exclusive language.
- **Pricing value anchor only mentions property managers:** `pricing-section.tsx:57-61` — labor cost framing irrelevant to non-PM buyers.

**WARNING findings (inconsistency/UX issues):**
- `upload_source: 'pm_upload'` hardcoded in 4 upload paths + DB CHECK constraint
- PDF export hardcodes "Locations", "Tenants" labels instead of using terminology (`export-report-button.tsx:51,136,144`)
- Dashboard error toast shows raw DB `entityType` instead of terminology (`dashboard-client.tsx:683`)
- Tutorial text hardcodes "properties" and "locations" (`dashboard-tutorial.tsx:28,58`)
- Template recalculation skips `organization_default_entities` (`templates.ts:262-278`)
- Email templates accept but never use `location_label`/`entity_label` merge fields (`email-templates.ts:35-36`)
- Portal upload error uses `getTerminology(null)` instead of actual industry (`upload/route.ts:154`)
- Portal notification email bypasses terminology system entirely (`extract/route.ts:298-324`)
- PM-specific comments in portal extract route (`extract/route.ts:259,338,344`)
- Vertical page testimonial heading/CTA hardcode "Property Managers" (`for/[vertical]/page.tsx:134,214`)
- Blog index says "property management best practices" (`blog/page.tsx:27-28`)
- Compare page mentions PM-specific software only (`compare/page.tsx:169`)
- Dead code: `src/lib/emailTemplates.ts` is never imported
- Email subject lines don't use industry terminology (`email-templates.ts:136,167,197,222`)
- Deprecated `pm_name`/`pm_email` fields still required, migration never completed (`email-templates.ts:28-31`)
- AI extraction prompt heavily PM-biased with ACORD 25 references (`extraction.ts:90-219`)

**No issues found in:** Terminology system, industry templates, onboarding industry selector, bulk upload entity type defaults, database nullability for property_id/entity_id, `contactLine()` requester_label usage, trial lifecycle industry awareness.

#### Fix: Compliance Audit Report $0 Exposure / Endorsement Detection (Apr 2026)

Two bugs caused the compliance audit report to show $0 exposure and classify all gaps as "Endorsement Gap":

**Bug #1 — `extracted_coverage_id` not persisted by `runAutoCompliance()`:**
- `src/lib/actions/certificates.ts` `runAutoCompliance()` omitted `extracted_coverage_id` when inserting `compliance_results`. `calculateCompliance()` computed it correctly but the INSERT stripped it. `runComplianceForEntity()` in `properties.ts` saved it correctly.
- **Fix:** Added `extracted_coverage_id: r.extracted_coverage_id` to the compliance_results INSERT in `runAutoCompliance()`.

**Bug #2A — Compliance engine only checked Pass 1 endorsement flags:**
- The compliance calculation in `calculate.ts` only checked coverage-level `additional_insured_listed` and `waiver_of_subrogation` flags (from Pass 1 ACORD 25 extraction). It never checked `certificates.endorsement_data` (from Pass 2 endorsement page scanning). Many COIs have endorsement pages but the ADDL INSD / SUBR WVD checkboxes aren't marked on page 1.
- **Fix:** Added `endorsementData` option to `ComplianceOptions` interface. The endorsement check now falls back to certificate-level `endorsement_data` for CG 20 10/CG 20 37 (Additional Insured), Waiver of Subrogation, and Primary & Non-Contributory endorsements. Also added `requires_primary_noncontributory` to `RequirementInput`.
- Both `runAutoCompliance()` (certificates.ts) and `runComplianceForEntity()` (properties.ts) now pass `cert.endorsement_data` through to the compliance engine.

**Bug #2B — Endorsement gaps in risk quantification:**
- Added `EndorsementGapDetail` interface and `endorsementGapDetails` array to `RiskQuantificationResult` in `risk-quantification.ts`. Each detail includes entity name, type, and which specific endorsements are missing (Additional Insured, Waiver of Subrogation, Primary & Non-Contributory).

**Bug #2C — Audit report improvements:**
- **Executive summary:** When `totalExposureGap` is $0 but endorsement gaps exist, the explanatory paragraph now specifically describes missing endorsements and their risk implications instead of the generic "no coverage gaps" message.
- **Entity detail:** "Endorsement Gap" status label changed to "Endorsement Missing". Endorsement gap text now shows specific endorsement type per coverage (e.g., "Additional Insured (Commercial General Liability)").
- **Portfolio overview:** Added "Endorsement Gaps" table showing per-entity breakdown of missing endorsements, positioned between the Compliance Status Distribution and Coverage Type Breakdown tables.
- Entity header now shows "Endorsement Gaps" label when dollar exposure is $0 but endorsement gaps exist.

**Coverage type matching confirmed working correctly** — both AI extraction and templates use identical Title Case strings, and `coverageTypeMatchScore()` in `coverage-utils.ts` handles variations with fuzzy matching (0.7 threshold).

#### Fix: Compliance Audit Report — Real-World Testing Fixes (Apr 2026)

Four issues fixed from real-world testing of the compliance audit report:

**Issue 1 — Empty entity detail section for expired entities:**
- Entities entered the non-compliant list via `e.isExpired` but if all coverage limits/endorsements passed, `coverageGaps` was empty → header rendered but no table or detail below it.
- **Fix:** Added expiration detail rendering when `coverageGaps.length === 0` but entity is expired or partially expired, showing which coverages are expired and earliest expiration date.

**Issue 2 — Entity names containing full addresses:**
- AI extraction sometimes pulls the full insured block as entity name (e.g., "Blue Mesa Electric 527 Kalamath LLC 2875 W Oxford Englewood CO 80110").
- **Fix:** Added `cleanExtractedEntityName()` to `src/lib/utils.ts` — strips trailing address patterns (street addresses, city/state/zip) while preserving business name parts (LLC, Inc, DBA). Applied in `autoAssignCertificateToEntity()`.

**Issue 3 — Partially expired entities shown as fully expired:**
- `isExpired` was a simple boolean from `complianceStatus === 'expired'`, treating partial expiration (some coverages expired, others active) the same as full expiration.
- **Fix:** Added `isPartiallyExpired`, `expiredCoverageTypes` fields to `EntityRiskBreakdown` in `risk-quantification.ts`. `isExpired` now means ALL coverages expired; `isPartiallyExpired` means some but not all. Report shows "EXPIRED" badge for fully expired, "COVERAGE LAPSE" for partially expired with specific coverage detail.

**Issue 4 — Misleading $0 exposure display:**
- When exposure was $0 but expired certificates and endorsement gaps existed, the bold "$0" undermined the report's value.
- **Fix:** Redesigned executive summary exposure section with three modes: (1) dollar exposure > $0 → show large dollar figure, (2) $0 but expired/endorsement issues → show "KEY RISK AREAS" headline with expired count + missing endorsement count in large red text, secondary note "No coverage limit shortfalls identified", (3) fully compliant → green "All insurance requirements are currently met" bar.

#### Fix: Onboarding Bulk Upload — Orphaned Certificates (Apr 2026)

- **Root cause:** Onboarding bulk upload (`step-bulk-upload.tsx`) created certificate records without `entity_id`/`vendor_id`/`tenant_id`, then attempted to auto-assign entities via client-side Supabase calls that: (a) bypassed the `createEntity()` server action (no dual-write to legacy tables), (b) silently swallowed errors via try/catch, (c) ran auto-compliance before entity assignment (compliance returned early with "no entity"), and (d) never re-triggered compliance after assignment.
- **Fix:** Created `autoAssignCertificateToEntity()` server action in `certificates.ts` that: (1) finds or creates entity with dual-write to both `entities` and legacy `vendors`/`tenants` tables, (2) links certificate with all 3 ID columns (`entity_id`, `vendor_id`, `tenant_id`), (3) updates compliance status in both tables, and (4) triggers `runAutoCompliance()` after assignment so compliance is calculated immediately.
- **Onboarding component:** Replaced client-side entity creation + certificate update in `step-bulk-upload.tsx` with call to `autoAssignCertificateToEntity()` server action.
- **Single upload flow:** Verified correct — already sets all 3 ID columns at certificate INSERT time (`certificates/upload/page.tsx` lines 275-277).
- **Dashboard bulk upload:** Verified correct — uses `assignCertificateToEntity()` server action (already fixed) in the finalize step.
- **Data fix SQL:** Created `supabase/migrations/20260408_fix_orphaned_bulk_upload_certs.sql` — matches orphaned certificates to entities by `insured_name`, creates entities where no match exists, sets `entity_id` + `vendor_id`/`tenant_id`.

⚠️ ACTION REQUIRED: Run `supabase/migrations/20260408_fix_orphaned_bulk_upload_certs.sql` in Supabase SQL Editor to link existing orphaned certificates. Then run the admin recheck endpoint to recalculate compliance for affected entities.

#### Fix: Entity Unification Full Regression Fix (Apr 2026)

Complete end-to-end audit and fix of entity unification regressions. The multi-industry expansion merged vendors/tenants into an `entities` table but many parts of the codebase still only queried/wrote to one side, breaking certificate display, compliance calculation, dashboard stats, and notifications.

**Data Creation Fixes (dual-write everywhere):**
- **`createEntity()`** now dual-writes to legacy `vendors`/`tenants` table with the SAME ID
- **`createVendor()`/`createTenant()`** now dual-writes to unified `entities` table with the SAME ID
- **`assignCertificateToEntity()`** (bulk upload) now sets `entity_id` AND `vendor_id`/`tenant_id` on certificates, and updates BOTH `entities` and legacy tables for compliance status
- **`assignTemplateToEntity()`** (both `entities.ts` and `properties.ts` versions) now dual-writes to both tables
- **`updateEntity()`** now syncs key fields (name, contact, template) to legacy tables
- **Bulk archive/delete** in both `entities.ts` and `properties.ts` now dual-writes to both tables
- **Portal upload** now sets `entity_id` on certificates, updates `entities` table status, and falls back to `entities` table for org lookup

**Data Query Fixes (check all 3 ID columns):**
- **Dashboard certificate queries** (`dashboard/page.tsx`) now use `.or()` to check `entity_id`, `vendor_id`, AND `tenant_id` — fixes 0% health bar and empty action queue
- **Properties detail page** (`properties/[id]/page.tsx`) certificate expiration queries now check all 3 ID columns
- **Certificate review page** (`certificates/[id]/review/page.tsx`) now resolves entity from `entities` table first, falls back to legacy — fixes blank entity info
- **Notification scheduler** (`scheduler.ts`) certificate queries now check all 3 ID columns via 3-part parallel query with deduplication
- **Portal page** (`portal/[token]/page.tsx`) certificate query now uses `.or()` for all 3 columns
- **Portal extract route** ownership check now considers `entity_id` in addition to legacy columns; entity info lookup falls back to `entities` table
- **Portal upload route** duplicate check now uses `.or()` for all 3 ID columns

**Compliance Pipeline Fixes:**
- **`runAutoCompliance()`** (`certificates.ts`) now falls back to legacy `vendors`/`tenants` tables when entity not in `entities` table, and syncs `template_id` from legacy to entities when found
- **`saveAndRerunCompliance()`** now resolves entity via `entity_id` first, then legacy columns, and looks up entity type from entities table

**Activity Log Fixes:**
- Certificate extraction API route (`certificates/extract/route.ts`) now includes `entity_id` in activity log entries
- Portal extract route now includes `entity_id` in activity log entries

**Data Fix SQL:** Created `supabase/migrations/20260408_fix_entity_unification_data.sql` — idempotent migration that:
1. Creates missing `entities` records for orphaned `vendors`/`tenants`
2. Creates missing `vendors`/`tenants` records for orphaned `entities`
3. Syncs `template_id` bidirectionally between tables
4. Syncs `compliance_status` (prefers most specific status)
5. Sets `entity_id` on certificates that only have `vendor_id`/`tenant_id`
6. Sets `vendor_id`/`tenant_id` on certificates that only have `entity_id`
7. Outputs verification counts (all should be 0)

⚠️ ACTION REQUIRED: Run `supabase/migrations/20260408_fix_entity_unification_data.sql` in Supabase SQL Editor to fix existing broken data.

**Complete Data Flow Trace (reference for future changes):**

```
COI UPLOAD → EXTRACTION → COMPLIANCE — FULL DATA FLOW
======================================================

1. USER UPLOADS COI (single upload: certificates/upload/page.tsx)
   INSERT certificates: { entity_id, vendor_id, tenant_id, organization_id, file_path, file_hash, upload_source, processing_status: 'processing' }
   All 3 ID columns set at creation time.

2. AI EXTRACTION (api/certificates/extract/route.ts)
   INSERT extracted_coverages: { certificate_id, coverage_type, limits, dates, ... }
   INSERT extracted_entities: { certificate_id, entity_name, entity_type, ... }
   UPDATE certificates: { processing_status: 'extracted', insured_name }
   CALLS runAutoCompliance(certificateId, orgId)

3. AUTO-COMPLIANCE (lib/actions/certificates.ts → runAutoCompliance)
   a. Resolve entity: cert.entity_id ?? cert.vendor_id ?? cert.tenant_id
   b. Look up entity: entities table first → fallback to vendors/tenants
   c. Look up template: entity.template_id (sync from legacy if null)
   d. Fetch: extracted_coverages, extracted_entities, template_coverage_requirements, property_entities
   e. calculateCompliance() → overallStatus
   f. DELETE + INSERT compliance_results (per coverage requirement)
   g. DELETE + INSERT entity_compliance_results (per property entity)
   h. UPDATE entities SET compliance_status = result
   i. UPDATE vendors/tenants SET compliance_status = result (best-effort)
   j. INSERT activity_log: 'compliance_checked'

4. DASHBOARD LOADS (dashboard/page.tsx)
   SELECT entities WHERE org_id AND NOT deleted AND NOT archived
   → status counts, compliance rate, property overviews
   SELECT certificates WHERE entity_id/vendor_id/tenant_id IN (entity IDs) — OR filter
   → action queue items, gap counts, expirations

5. ENTITY DETAIL PAGE (vendors/[id]/page.tsx, tenants/[id]/page.tsx)
   SELECT vendors/tenants WHERE id — fallback to entities WHERE id
   SELECT certificates WHERE entity_id.eq.id OR vendor_id.eq.id (OR tenant_id.eq.id)
   → latest cert, all certs, notifications, waivers

6. ENTITY CREATION (lib/actions/entities.ts → createEntity)
   INSERT entities: { id, name, entity_type, template_id, ... }
   INSERT vendors/tenants: { id (SAME), company_name, template_id, ... } (dual-write)

7. TEMPLATE ASSIGNMENT (lib/actions/properties.ts → assignTemplateToEntity)
   UPDATE vendors/tenants SET template_id
   UPDATE entities SET template_id (dual-write)
   CALL runComplianceForEntity → recalculates compliance

8. BULK UPLOAD ASSIGNMENT (lib/actions/properties.ts → assignCertificateToEntity)
   UPDATE certificates SET entity_id, vendor_id/tenant_id (ALL 3 columns)
   UPDATE vendors/tenants SET compliance_status = 'under_review'
   UPDATE entities SET compliance_status = 'under_review'
   CALL runComplianceForEntity

KEY INVARIANT: Every entity MUST exist in BOTH the entities table AND
the appropriate legacy table (vendors or tenants) with the SAME ID.
Every certificate MUST have entity_id AND vendor_id/tenant_id set.
```

#### Fix: Entity Detail Page 404 + Delete/Archive for Unified Entities (Apr 2026)

- **Fixed vendor/tenant detail pages returning 404:** Detail pages at `/dashboard/vendors/[id]` and `/dashboard/tenants/[id]` only queried legacy `vendors`/`tenants` tables. Entities created via the unified `createEntity()` flow (onboarding, entity creation wizard) exist only in the `entities` table — legacy lookup failed → `notFound()` → 404. Both pages now fall back to the `entities` table and map Entity fields to the Vendor/Tenant shape expected by client components.
- **Fixed certificate/notification/waiver queries on detail pages:** All queries on vendor/tenant detail pages now use `or(entity_id, vendor_id/tenant_id)` filters instead of only legacy `vendor_id`/`tenant_id`. This ensures certificates, notifications, and waivers linked via `entity_id` are found.
- **Fixed archive/delete/restore for entities-only records:** `archiveVendor()`, `permanentlyDeleteVendor()`, `restoreVendor()`, `archiveTenant()`, `permanentlyDeleteTenant()`, `restoreTenant()` now dual-write to both legacy and `entities` tables. Also resolves entity name from `entities` table when not found in legacy table for activity log.

#### Fix: Under Review Status + Bulk Upload Retry Improvements (Apr 2026)

- **Fixed `runComplianceForEntity()` querying legacy tables:** Function in `src/lib/actions/properties.ts` was querying legacy `vendors`/`tenants` tables instead of the unified `entities` table. Entities created during onboarding exist only in the `entities` table, so the lookup returned null → template not found → compliance never calculated → status stuck at `under_review`. Now queries `entities` table first with fallback to legacy tables.
- **Fixed template_id lookup across tables:** When `entities.template_id` is null, `runComplianceForEntity()` now also checks the legacy `vendors`/`tenants` table for `template_id` (template assignments via `updateVendor()`/`updateTenant()` only wrote to legacy tables). If found, syncs `template_id` back to the `entities` table for future lookups.
- **Fixed template_id dual-write on update:** `updateVendor()` and `updateTenant()` now sync `template_id` to the `entities` table when a template is assigned, preventing future mismatches between legacy and unified tables.
- **Fixed certificate lookup in compliance calculation:** Certificate queries now use `or(entity_id, vendor_id, tenant_id)` filter instead of only legacy `vendor_id`/`tenant_id` match, ensuring certificates linked via `entity_id` are found.
- **Fixed compliance status dual-write:** Status updates now write to both `entities` table and legacy table (was only writing to legacy table). Activity log now includes `entity_id`.
- **Increased AI extraction retries from 3 to 5:** `BACKOFF_MS` in `src/lib/ai/extraction.ts` expanded from `[5s, 15s, 30s]` to `[5s, 15s, 30s, 60s, 90s]` to better handle Anthropic API 529 (overloaded) errors during bulk upload.
- **Bulk upload concurrency:** Processing uses parallel concurrency pool of 5 files via `processConcurrentQueue()` utility.
- **Retry UI already exists:** Verified "Retry All Failed" button and per-file "Retry" buttons are present in bulk upload UI.
- **Admin recheck route:** Created `src/app/api/admin/recheck-compliance/route.ts` — one-time POST endpoint (auth via `CRON_SECRET`) that finds all entities with `compliance_status = 'under_review'` or `null`, recalculates compliance using the fixed logic, and returns a summary with per-entity before/after status. Logs `compliance_checked` activity for each recalculated entity.

#### Compliance Audit PDF Report Generator (Apr 2026)

- Created `src/lib/reports/compliance-audit-report.ts` — server-side PDF report generator using jsPDF + jspdf-autotable (Vercel-compatible, no headless browser required)
- `generateComplianceAuditReport(result, meta)` takes a `RiskQuantificationResult` + `AuditReportOrgMetadata` and returns a `Buffer` containing a multi-page PDF
- **Page 1 — Executive Summary:** Org name, audit date, large compliance score percentage, 6-stat grid (total entities, non-compliant, expired, expiring 30d, missing endorsements, fully compliant), estimated uninsured exposure in bold, explanatory paragraph
- **Page 2 — Portfolio Overview:** Compliance status distribution table (compliant/non-compliant/expired/no certificate), gaps by coverage type table, expiration timeline (30/60/90 day counts)
- **Pages 3+ — Entity Detail:** One section per non-compliant entity with name, type, property, coverage gap table (Required vs Found vs Gap vs Status), missing endorsements, risk level badge (Critical/Warning/Minor)
- **Expiration Calendar:** Chronological list of all certificates expiring within 90 days with color-coded expired/expiring status
- **Recommendations:** Top 5 priority actions from risk quantification data with numbered badges, exposure amounts, gap descriptions, and SmartCOI CTA footer
- Design: white background, emerald (#059669) headers/accents, slate gray text, alternating row shading, page numbers ("Page X of Y"), confidential footer — consulting-firm aesthetic
- Calculation-only utility — no UI components, no database writes
- **Server action:** `src/lib/actions/audit-report.ts` — `generateAuditReportPDF()` server action fetches all active entities with compliance results, extracted coverages, and template requirements; runs `quantifyRisk()` then `generateComplianceAuditReport()`; returns base64-encoded PDF + filename
- Data pipeline: entities table → latest certificates (via entity_id/vendor_id/tenant_id) → parallel fetch of compliance_results + extracted_coverages + template_coverage_requirements → transform to `EntityComplianceData[]` → `quantifyRisk()` → PDF
- Logs `audit_report_generated` to activity_log with entity count and compliance rate
- **Dashboard UI:** Added "Compliance Audit" option to Export Report dropdown in `src/components/dashboard/export-report-button.tsx` — separated from existing PDF/CSV options by a divider, uses emerald ShieldCheck icon, shows "Generating audit report..." loading state, downloads PDF directly (no print dialog), success/error toasts

#### Risk Quantification Engine (Apr 2026)

- Created `src/lib/compliance/risk-quantification.ts` — calculates dollar-value exposure gaps across an organization's entities
- `quantifyRisk()` function takes an array of `EntityComplianceData` (entity + compliance results + extracted coverages + template requirements) and returns a `RiskQuantificationResult`
- Per-entity breakdown: each entity's coverage gaps with dollar amounts (e.g., "GL limit is $500K but $1M required — $500K gap"), gap type classification (missing, insufficient, endorsement, unquantifiable)
- Per-coverage-type breakdown: aggregated by coverage type showing which types have the most gaps across all entities
- Top 5 priority actions: highest-exposure entities sorted by expired status then dollar exposure, with concise action items and top gap descriptions
- Summary stats: totalExposureGap, entityCount, nonCompliantCount, expiredCount, expiringIn30/60/90Days, missingEndorsementCount, complianceRate
- Statutory requirements (e.g., Workers' Comp) flagged as "Missing — unquantifiable risk" with `dollarGap: null`
- Endorsement-only gaps (Additional Insured, Waiver of Subrogation) tracked separately from limit gaps
- Calculation-only utility — no UI, no database writes, no PDF generation

#### Landing Page Comparison Table (Apr 2026)

- Created `src/components/landing/comparison-table.tsx` — "Why teams switch to SmartCOI" section with 7-row comparison (SmartCOI vs Typical COI Platform)
- Rows: setup time, time to first result, pricing, free trial, portal fees, feature inclusion, contract terms
- Desktop: clean table layout with emerald/green SmartCOI column and neutral gray "Typical" column
- Mobile: stacked card layout for each comparison row
- Positioned after features grid and before pricing section on the landing page (`src/app/page.tsx`)
- No specific competitors named — focuses on category-level differentiation

#### Dashboard Edge Case Audit — No Locations & "Other" Industry (Apr 2026)

- **Health bar terminology:** Replaced hardcoded "location"/"locations" in compliance health summary (`dashboard-client.tsx`) with dynamic `terms.location`/`terms.locationPlural` from terminology system
- **Upload dialog terminology:** Replaced hardcoded "Property" label and "no property filter" placeholder in `simple-upload-coi-dialog.tsx` with dynamic `terms.location`
- **Upload dialog New Entity button:** Removed `!effectivePropertyId` guard that blocked creating entities when 0 locations exist — backend accepts `propertyId: null`, and locations are optional for non-PM industries
- **Properties page ComplianceSummary:** Replaced hardcoded "vendors"/"tenants" labels with `terms.entityPlural`/`terms.tenantPlural`; tenant summary now hidden when `hasTenants === false`
- **"Other" industry audit (no changes needed):** Verified neutral terminology ("Location"/"Vendor"/"compliance team"), sensible GENERIC templates (GL, WC, Auto, Umbrella, E&O), AI recommendations handle "other" gracefully, onboarding skips lease/tenant steps
- **No-location compliance audit (no calculation changes):** Confirmed health bar, status pills, and action queue all work correctly with 0 locations — compliance rate is computed from entities regardless of property association

#### Email Template Industry Awareness (Apr 2026)

- Added `location_label`, `entity_label`, `requester_label` fields to `EmailMergeFields` interface in `src/lib/notifications/email-templates.ts`
- Notification scheduler (`src/lib/notifications/scheduler.ts`) now fetches `organizations.industry`, resolves terminology via `getTerminology()`, and populates industry-aware merge fields
- Manual follow-up action (`src/lib/actions/notifications.ts`) now fetches org industry and includes terminology in merge fields
- `contactLine()` in email templates now renders requester role label (e.g., "Questions? Reach out to your project manager, John, at john@co.com")
- Old `src/lib/emailTemplates.ts`: `propertyBadge()` now accepts dynamic `locationLabel` parameter (was hardcoded "Location"); `EmailTemplateParams` extended with `locationLabel`
- Trial lifecycle emails (`src/lib/emails/trial-lifecycle.ts`): added `getIndustryValueProp()` for industry-specific value prop lines in day1 welcome and day3 feature emails (PM → vendor/tenant, Construction → subcontractor, Logistics → carrier, others → generic with entity term)
- Trial lifecycle now fetches `organizations.industry` and passes it through `buildEmail()`

#### Dynamic Terminology Strings (Apr 2026)

- Replaced hardcoded "Vendor"/"Tenant" strings in ~14 dashboard components with dynamic terminology from `useTerminology()` hook
- Components updated: entity-creation-wizard, simple-upload-coi-dialog, export-report-button, edit-vendor-dialog, edit-tenant-dialog, vendor-detail-client, tenant-detail-client, certificate-review-client, property-detail-client, certificates/upload page, dashboard-tutorial, template-assignment-nudge, extract-lease-dialog
- Dialog titles, toast messages, breadcrumbs, labels, and error messages now use industry-specific terms (e.g., "Subcontractor" for construction, "Carrier" for logistics)
- "Extract from Lease" option hidden for non-PM industries (where `hasTenants === false`)
- Dashboard tutorial tour steps use dynamic entity/tenant names
- Export report PDF uses dynamic type labels

#### Portal Industry Awareness (Apr 2026)

- Added `requesterLabel` field to Terminology interface (PM → "property manager", Construction → "project manager", Logistics → "operations team", etc.)
- Portal page now fetches `organizations.industry` and resolves terminology
- Replaced 4 hardcoded "property manager" strings in portal API routes (upload + extract) with dynamic `requesterLabel`
- Falls back to "compliance team" when industry is null

#### Multi-Industry Expansion (Apr 2026)

- Added industry selector to onboarding (Property Management, Construction, Logistics, Healthcare, Manufacturing, Hospitality, Retail, Other)
- Created terminology mapping layer (`src/lib/constants/terminology.ts`) with client hook and server helper
- Unified entity model — merged vendors/tenants into entities table with type field (dual-writing to legacy tables for backward compatibility)
- Made locations optional for non-PM industries
- Created 28 industry-specific compliance templates
- Made AI recommendation system industry-aware
- Hidden lease extraction and tenant features for non-PM industries
- UI refresh: Inter font, clean white design
- Redesigned 9 email templates (welcome, trial sequence, compliance alerts, portal requests)
- Redesigned landing page with industry-agnostic positioning
- Improved bulk upload reliability from 48% to 90%+ (removed retry amplification, parallel processing with concurrency pool of 5)

#### SEO Overhaul (Apr 2026)

- Noindexed 48 thin programmatic pages at /insurance-requirements/[property]/[coverage]
- Improved 8 property hub pages with 300-500 words unique content
- Created 6 coverage guide pages at /insurance-requirements/coverage/
- Created 6 industry vertical pages at /for/ (Construction, Logistics, Healthcare, Manufacturing, Hospitality, Retail)
- Updated internal linking and sitemap

#### Added Instantly visitor tracking pixel (Apr 2026)

- Added Instantly (leadsy.ai) visitor tracking script to root layout via `next/script` with `afterInteractive` strategy
- Applies to all pages (public and dashboard) — no adverse effects on authenticated routes

#### ToS & Privacy Policy Updates (Apr 2026)

- **Terms of Service:** Updated entity name in introduction, added Intellectual Property section (user data ownership + limited license), Vendor Portal terms, Indemnification section (including AI reliance disclaimer), Governing Law & Disputes (Colorado, binding arbitration, no class actions), updated refund policy with service failure exception
- **Privacy Policy:** Added vendor/tenant portal data collection disclosure, expanded Anthropic AI processing disclosure (commercial API, no model training), added PostHog to third-party services list, added Data Breach Notification section (72-hour email notice), added International Data Transfers section (US-based infrastructure)
- **Vendor Portal:** Added explicit consent text above footer: "By uploading documents through this portal, you agree to SmartCOI's Terms of Service and Privacy Policy" with links
- Both pages updated to "Last updated: April 2026"

#### Trial Lifecycle Emails (Apr 2026)

- Created 5-email trial lifecycle sequence: Day 1 welcome, Day 3 feature highlight (conditional on 0 uploads), Day 7 midpoint check-in (with real usage stats), Day 12 trial ending, Day 14 trial expired
- New service at `src/lib/emails/trial-lifecycle.ts` handles email selection, personalization, stat fetching, and deduplication
- Added `trial_emails_sent` JSONB column to organizations table (migration: 20260401_add_trial_emails_sent.sql) for tracking which emails have been delivered
- Extended daily cron job (`/api/cron/daily-check`) with Step 4: trial lifecycle email processing
- Emails use personal tone from "Tony from SmartCOI" (contact@smartcoi.io) with minimal HTML styling
- Day 3 email skipped automatically if user has already uploaded certificates
- Day 7 email includes real certificate count, vendor count, and compliance rate from the database

#### SEO: RSS Feed + Internal Linking (Apr 2026)

- Created RSS 2.0 feed at `/feed.xml` (src/app/feed.xml/route.ts) with all blog posts + pinned money pages
- Added RSS autodiscovery link to root layout metadata (`alternates.types`)
- Added "RSS Feed" link to site footer (Resources section)
- Added internal links to `/certificate-of-insurance-tracking` in 6 blog posts that were missing it
- Added internal links to `/coi-tracking-software` in 2 blog posts that were missing it
- Added links from `/coi-tracking-software` to 2 new blog posts (best COI management software, expiration tracking)
- Added links from `/certificate-of-insurance-tracking` to 2 new blog posts (best COI management software, compliance guide)
- Verified robots.txt does not block `/feed.xml`

#### SEO: New COI Management Software Blog Post (Apr 2026)

- Created `/blog/best-coi-management-software` — ~2,200 word comparison post targeting "coi management software" keyword cluster
- Compares 6 platforms: SmartCOI, Certificial, Jones, myCOI, BCS, Spreadsheets with honest pros/cons
- Includes comparison table, "How to Choose" decision framework, and FAQ section
- FAQPage JSON-LD structured data (4 Q&As) added to blog page component
- Related resources and internal links to compare pages, features, and compliance guide
- Target: position improvement from 46 → page 1 for buyer-intent queries

#### SEO: Sitemap Cleanup & Canonical Consolidation (Apr 2026)

- Removed 48 noindexed programmatic pages (`/insurance-requirements/[property]/[coverage]`) from sitemap — these were already noindexed but still in sitemap, sending mixed signals to Google
- Kept 8 hub pages (`/insurance-requirements/[property]`) and 6 coverage guides (`/insurance-requirements/coverage/[guide]`) in sitemap
- Added canonical tag `https://smartcoi.io/coi-tracking-software` to `/certificate-of-insurance-tracking` and `/features/coi-tracking` to consolidate ranking signals onto primary money page
- `/ai-coi-extraction` left independent (different enough content)
- No pages deleted or redirected — canonical tags only
- ⚠️ ACTION REQUIRED: Resubmit sitemap in Google Search Console after deployment

#### SEO: COI Expiration Tracking Post Optimization (Apr 2026)

- Optimized `/blog/coi-expiration-tracking-best-practices` for improved CTR (was 0.43% at position 6)
- Updated title to "COI Expiration Tracking: How to Never Miss a Renewal" and description for action-oriented CTR
- Added "Signs Your COI Tracking Process Is Broken" section (5 warning signs)
- Added "Manual vs Automated Expiration Tracking" section (5 comparison points)
- Added "What to Track Beyond Expiration Dates" section with internal links to ACORD 25, ACORD 28, and additional insured guides
- Added clear SmartCOI free trial CTA section
- Date updated to 2026-04-08

#### SEO: Meta Tag Optimization (Apr 2026)

- Updated meta titles and descriptions on 12 pages for improved CTR
- Pages updated: homepage, /compare (index + 4 individual), /coi-tracking-software, /certificate-of-insurance-tracking, /ai-coi-extraction, /tenant-insurance-tracking, 2 blog posts
- Added "(2026)" year tags to comparison and feature page titles
- Both `metadata.title`/`description` and `openGraph` title/description updated in sync

#### Blog: Subcontractor Insurance Requirements Post (Apr 2026)

- Created `/blog/subcontractor-insurance-requirements` — GC-focused guide to subcontractor COI compliance (~1,800 words of MDX)
- Covers standard coverage requirements by trade (baseline, higher-risk, lower-risk, specialty), insurance requirements matrix approach, 6 common compliance gaps, COI tracking progression, SmartCOI workflow
- FAQPage JSON-LD (5 Q&As) added to blog page component: required insurance, additional insured verification, renewal frequency, lapse consequences, portal cost
- Related resources added: Additional Insured guide, ACORD 25 guide, Construction vertical page
- Internal links to additional insured guide, COI expiration tracking, COI tracking software, ACORD 25 guide

#### SEO: ACORD 25 Post Upgrade (Apr 2026)

- Fully rewrote `/blog/acord-25-certificate-explained` with new expanded content (~180 lines of MDX) focused on field-by-field reading guide, common mistakes, and automation CTA
- Updated meta title to "ACORD 25 Certificate of Insurance Explained (2026 Guide)" and description to "Complete guide to the ACORD 25 certificate of liability insurance. Learn how to read every field, verify coverage, spot common mistakes, and automate compliance tracking."
- openGraph title/description synced via `generateMetadata` (reads from MDX frontmatter)
- Restructured sections: What Is an ACORD 25, ACORD 25 vs ACORD 28, How to Read (field-by-field with Producer/Insured/Coverage/Certificate Holder/Additional Insured/Description of Operations subsections), 8-point PM verification checklist, 8 common mistakes, SmartCOI automation section
- Updated FAQ section from 5 Q&As to 6 Q&As with FAQPage JSON-LD structured data (in blog page component): ACORD 25 vs 28, guarantee coverage, update frequency, who issues, additional insured meaning, forgery risk
- Internal links to ACORD 28, Additional Insured, COI expiration tracking, and COI tracking software pages
- Date updated to 2026-04-08

#### SEO: ACORD 28 Post Upgrade (Apr 2026)

- Fully rewrote `/blog/acord-28-evidence-of-property-insurance` with new expanded content focused on field-by-field reading guide, ACORD 27 vs 28 distinction, common compliance mistakes, and automation CTA
- Updated meta title to "ACORD 28 Evidence of Property Insurance: Complete Guide (2026)" and description to "Everything you need to know about the ACORD 28 form. Learn what it covers, how it differs from the ACORD 27, how to verify property coverage, and common compliance mistakes."
- openGraph title/description synced via `generateMetadata` (reads from MDX frontmatter)
- Restructured sections: What Is an ACORD 28, ACORD 28 vs ACORD 27, How to Read (section-by-section with Producer/Insured/Property/Coverage/Valuation/Coinsurance/Deductible/Certificate Holder/Endorsements subsections), When Required, 5 common mistakes, ACORD 28 vs 25 quick reference, automation section
- Moved FAQ JSON-LD from inline MDX to blog page component `faqData` map (5 Q&As): ACORD 28 usage, ACORD 27 vs 28, coverage guarantee, tenant limits, certificate holder
- Internal links to ACORD 25, COI tracking software pages
- Date updated to 2026-04-08

#### QA Warning Fixes (Apr 2026)

- **Immediate portal upload email:** Portal extract route now sends an email to the PM immediately via Resend when a vendor/tenant uploads a COI through the self-service portal (portal/[token]/extract/route.ts). Cron-based notifications remain unchanged.
- **Persist entity names on templates:** Added `additional_insured_name` and `certificate_holder_name` columns to `requirement_templates` table (migration: 20260401_add_template_entity_names.sql). Lease extraction dialog now passes entity names through to `createTemplateWithRequirements()`. Template editor displays and saves entity names for lease-extracted templates. Updated `RequirementTemplate` type, `CreateTemplateWithRequirementsInput`, and `UpdateTemplateInput` interfaces.

#### QA Audit (Apr 2026)

Full end-to-end audit of 7 critical user flows. **All 7 flows PASS** — no blocking bugs found. Warnings documented for Tony to triage:
- **WARN:** No explicit timeout on AI extraction `fetch()` call (extraction.ts) — relies on Node defaults
- **WARN:** Stripe webhook handles `invoice.payment_succeeded` but not `invoice.paid` — functionally equivalent but not best practice
- ~~**WARN:** Portal upload creates notification record in DB but doesn't trigger immediate email send — relies on cron scheduler~~ **FIXED**
- ~~**WARN:** Additional Insured / Certificate Holder entity names from lease extraction are displayed in review but not persisted to template (only boolean flags saved per requirement)~~ **FIXED**
- **WARN:** Trial banner won't auto-refresh if trial expires while dashboard is open (server-side blocking works correctly)

#### Landing Page Dashboard Preview Update (Apr 2026)

- **Removed Portfolio Overview card** from landing page mock sidebar (matches actual dashboard after P1 changes)
- **Updated Recent Activity** from 4 to 8 sample items with realistic entries (matches actual dashboard's 8-item feed)
- **Removed unused components:** `PortfolioOverviewCard`, `BuildingSmIcon` from hero-dashboard.tsx
- Action buttons and currency formatting verified as already consistent — no changes needed

#### P0 Critical Fixes (Mar 2026)

- **Vendor/tenant name overflow:** Breadcrumb names truncated to 40 chars, h1 headers truncated with CSS ellipsis + title tooltip for full name on hover (vendor-detail-client.tsx, tenant-detail-client.tsx)
- **Currency formatting:** Added `formatDisplayLimit()` utility in `lib/utils.ts`. All coverage limit number inputs now show formatted dollar amount hint below (e.g., "$1,000,000") in entity-creation-wizard, template-editor, extract-lease-dialog, template-assignment-nudge, and onboarding step-templates
- **Email validation:** Contact email in Add Vendor/Tenant wizard (Step 1) now validated with regex on blur. Invalid emails show inline error and prevent advancing to Step 2. Empty email is still allowed (optional field)
- **Consistent action queue buttons:** "Request COI" button now always shown for all action items (not just those with emails). Clicking without a contact email shows a toast: "No contact email on file. Edit this vendor to add one."
- **Auto-select single property:** Legacy upload-coi-dialog now auto-selects and shows static property name when only one property exists (SimpleUploadCOIDialog already had this)

#### P1 Polish Pass (Mar 2026)

- **Coverage comparison layout:** Vendor/tenant detail pages now show found vs required limits side by side ("$2,000,000 / $1,000,000 req") instead of at opposite ends of the row (compact-compliance-view.tsx)
- **Wizard coverage row cleanup:** Endorsement checkboxes replaced with compact toggleable chips (AI, WoS, P&NC) in entity-creation-wizard, extract-lease-dialog, and template-assignment-nudge. Coverage type inputs use `flex-1` for full width. "Why?" button uses emerald pill style with icon.
- **Lease extraction dialog:** Auto-generates template name from entity name if available (e.g., "Golds Gym — Lease Requirements"). Added review guidance note. Ambiguous/null limits show yellow "(review)" warning. `entityName` prop added to `ExtractLeaseDialog`.
- **Dashboard sidebar:** Removed redundant Portfolio Overview card (data already in compliance health bar). Activity feed increased from 5 to 8 items. Removed unused `SummaryCard`, `SummaryStatBlock` components, `Building2` import.
- **Title case utility:** Added `toTitleCase()` to `lib/utils.ts` (preserves LLC, HVAC, INC, etc.). Applied to AI-recommended and lease extraction template names in entity-creation-wizard.

### Known Issues

- Anthropic API 529 errors during bulk upload (retry logic with exponential backoff in place — increased to 5 retries with up to 90s backoff)
- Tutorial walkthrough positioning edge cases
- ~~**Compliance audit report shows $0 exposure / all "Endorsement Gap"**~~ **FIXED** (Apr 2026) — see fix entry below

## Architecture Notes

### Compliance Pipeline

COIs follow this flow: **Upload → AI Extraction (two-pass) → Automatic Compliance Calculation**. There is no manual review step. After extraction completes, compliance results are computed automatically using the property's assigned requirement template. Fuzzy name matching (Levenshtein distance) is used for certificate holder and additional insured verification, with a configurable `accept_cert_holder_in_additional_insured` toggle per property.

Two-pass AI extraction:
1. **Pass 1 (ACORD 25):** Extracts coverage types, limits (per-occurrence + aggregate as separate entries), dates, carriers, named insureds, certificate holder, additional insured from page 1.
2. **Pass 2 (Endorsements):** Scans pages 2+ for CG 20 10, CG 20 37, Waiver of Subrogation, Primary & Non-Contributory endorsements. Endorsement data stored in `certificates.endorsement_data` JSONB column.

### Lease Requirement Extraction

Lease PDFs can be uploaded to extract insurance requirements into compliance templates. Flow: **Upload Lease PDF → AI Extraction → Review/Edit Requirements → Save as Template**. Uses the same Anthropic API with a lease-specific prompt. Templates created this way have `source_type = 'lease_extraction'` and show an "Extracted from Lease" badge. Counts against extraction credits.

### Authentication

- Email/password with confirm password field on signup
- Google OAuth via Supabase Auth (client ID configured in Supabase dashboard)
- Forgot password / reset password flow via Supabase Auth
- Trial period (`trial_ends_at`) set correctly on org creation for both email and Google OAuth signups
- Auth callback (`/api/auth/callback`) uses request-aware Supabase client to correctly propagate auth cookies on redirect responses (critical for OAuth and email confirmation flows)

## Project Structure

```
src/
├── app/
│   ├── page.tsx               # Landing page
│   ├── (auth)/                # Login, signup, forgot-password, reset-password pages
│   ├── (dashboard)/           # Protected pages — own layout with DashboardShell, sidebar, auth guards
│   ├── (onboarding)/          # 5-step setup wizard
│   ├── (public)/              # Marketing pages (blog, comparisons, SEO pages, legal)
│   │   ├── features/          # Feature pages
│   │   ├── insurance-requirements/ # 57 programmatic SEO pages
│   │   ├── compare/            # 10 competitor comparison pages
│   │   ├── for/               # 7 vertical landing pages
│   │   └── alternatives/      # 2 alternatives pages
│   ├── api/                   # Route handlers (auth callback, webhooks, cron, lease extraction)
│   └── portal/[token]/        # Self-service vendor upload portal
├── components/
│   ├── landing/               # Landing page components
│   ├── dashboard/             # Sidebar, session guard, trial banner, upgrade modal
│   ├── compliance/            # Compliance views, template assignment nudge, waivers
│   ├── notifications/         # Notification list and detail components
│   ├── properties/            # Entity creation wizard, property detail, vendor/tenant detail
│   ├── templates/             # Template editor, lease extraction dialog, template labels
│   ├── settings/              # Settings page sections
│   ├── onboarding/            # Onboarding wizard components (5 steps)
│   └── ui/                    # shadcn/ui primitives
├── content/
│   └── blog/                  # MDX blog posts
├── lib/
│   ├── supabase/              # Supabase clients (client.ts, server.ts, service.ts)
│   ├── actions/               # Server actions (auth, billing, certificates, notifications, properties, settings, templates)
│   ├── ai/                    # AI extraction engine (extraction.ts, lease-extraction.ts)
│   ├── notifications/         # Email templates and sender
│   ├── compliance/            # Compliance checking logic (includes fuzzy name matching)
│   ├── auth.ts                # Client-side signOut helper
│   ├── session.ts             # Session timeout, activity tracking, cookie-based session marker
│   ├── require-active-plan.ts # Plan enforcement (requireActivePlan, checkActivePlan)
│   ├── plan-limits.ts         # Per-plan quotas (vendors/tenants, extractions)
│   └── plan-status.ts         # Plan status resolution (trial, starter, pro, enterprise)
├── hooks/                     # Custom React hooks
├── services/                  # Service modules
├── types/                     # TypeScript type definitions (index.ts)
└── middleware.ts              # Auth middleware with session cookie gate

supabase/
├── functions/                 # Edge functions (extract-coi, extract-lease-requirements, send-contact)
├── consolidated_post_v2_migrations.sql  # All migrations (run via SQL Editor)
└── migrations/                # Individual migration files (47 total)
```

No shared components between marketing and dashboard.

## Database

All migrations are consolidated in `supabase/consolidated_post_v2_migrations.sql`. Run migrations against production via the Supabase SQL Editor. The file is idempotent and safe to re-run.

19 tables with RLS scoped by `organization_id`: organizations, users, properties, property_entities, organization_default_entities, requirement_templates, template_coverage_requirements, vendors, tenants, certificates, extracted_coverages, extracted_entities, compliance_results, entity_compliance_results, notifications, upload_portal_tokens, activity_log, compliance_waivers, compliance_snapshots.

Notable columns:
- `properties.accept_cert_holder_in_additional_insured` — boolean toggle for fuzzy matching flexibility
- `properties.certificate_holder` / `properties.additional_insured` — entity name fields for compliance verification
- `certificates.endorsement_data` — JSONB column for endorsement extraction results
- `requirement_templates.source_type` — TEXT ('manual' | 'lease_extraction' | 'ai_recommended') indicating template origin
- `requirement_templates.additional_insured_name` / `requirement_templates.certificate_holder_name` — entity names extracted from leases, persisted for compliance matching
- `organizations.industry` — TEXT with CHECK constraint (property_management, construction, logistics, healthcare, manufacturing, hospitality, retail, other)
- `entities` table — unified entity model with `type` field, replaces separate vendor/tenant creation flow

## Important Patterns

- **Server actions** use `requireAuth()` from `src/lib/actions/auth.ts` to get `{ userId, orgId }`. Throws if not authenticated.
- **Service role client** (`src/lib/supabase/service.ts`) bypasses RLS for admin operations like portal uploads, profile creation, plan checks.
- **Plan enforcement:** `checkActivePlan()` from `src/lib/require-active-plan.ts` returns `{ error }` for inactive plans. `checkVendorTenantLimit()` and `checkExtractionLimit()` from `src/lib/plan-limits.ts` enforce per-plan quotas. Trial extraction limit is 50.
- **After mutations:** call `revalidatePath()` to refresh server components.
- **Middleware** (`src/middleware.ts`) checks for `smartcoi-session` cookie before refreshing auth tokens. No cookie = expired session = redirect to `/login`. Redirects unauthenticated users to `/login`.
- **Session management** (`src/lib/session.ts`) uses a browser cookie (`smartcoi-session`) as a server-readable session marker (24h or 7d max-age) plus localStorage for inactivity tracking. `SessionGuard` component in the dashboard layout checks both.
- **Compliance pipeline:** No manual review step. Extraction → automatic compliance calculation. Fuzzy name matching for certificate holder and additional insured.
- **Bulk upload:** Two-phase architecture: (1) client uploads files to Supabase Storage + creates certificate records, (2) sends certificate IDs to `/api/certificates/batch-extract` which returns immediately and processes extractions in the background via `after()` using `processConcurrentQueue()` utility (`src/lib/utils/concurrent-queue.ts`) with concurrency of 5. Client polls `/api/certificates/batch-status` every 4s. Completion email sent via Resend if client disconnects. Server-side extraction retry (5s/15s/30s/60s/90s — 5 retries) on Anthropic API 529 errors.
- **Google OAuth:** Handled via Supabase Auth callback at `/api/auth/callback`. Uses request-aware `createServerClient` (not `cookies()` from next/headers) to ensure auth tokens are set on the redirect response. Trial period assigned on org creation for both email and OAuth signups.
- **Lease extraction:** API route at `/api/leases/extract`. Uses `src/lib/ai/lease-extraction.ts` with lease-specific prompt. Counts against extraction credits via `checkExtractionLimit()`.

## Conventions

- Always flag manual steps (SQL migrations, env vars, Supabase dashboard settings, Stripe config) with ⚠️ ACTION REQUIRED at the end of every summary.
- Always read CLAUDE.md before starting work.
- Check existing code before making changes — update don't duplicate.
- Blog posts are MDX files in `src/content/blog/` with frontmatter: `title`, `description`, `date`, `author` (use "SmartCOI Team").
- All public pages must use absolute canonical URLs (`https://smartcoi.io/...`). Domain is smartcoi.io (not .com).
- `trailingSlash: false` in Next.js config.
- Sessions expire after 24 hours (7 days with "Remember me").
- Emerald-teal brand palette throughout dashboard and landing page.

## Slash Commands

- `/blog` — Blog post creation workflow (generates MDX with frontmatter)
- `/audit` — Full consistency audit across the codebase

## Outreach & Marketing Setup

- **Instantly.ai:** contact@smartcoi.io connected, warmup running (started ~March 24, ready ~April 7)
- **Apollo.io:** Lead list built — 38K property managers, filtered by title/industry/company size
- **Email sequences:** 3 variations drafted (founder story, pain point, comparison angle), 3-email cadence each
- **G2:** Profile live
- **Capterra/GetApp/Software Advice:** Submitted, pending review
- **Medium:** 2 articles published with backlinks to smartcoi.io

## Environment Variables

See `.env.example`. Required:

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase project
- `SUPABASE_SERVICE_ROLE_KEY` — Server-side admin operations
- `ANTHROPIC_API_KEY` — Claude AI for COI extraction
- `RESEND_API_KEY` — Transactional email
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` — Billing
- `CRON_SECRET` — Vercel Cron job authentication
- `NEXT_PUBLIC_APP_URL` — Application URL (used in emails, portal links)
