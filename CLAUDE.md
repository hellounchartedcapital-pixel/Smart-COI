# SmartCOI

*Last updated: March 31, 2026*

SmartCOI — B2B SaaS platform automating Certificate of Insurance (COI) compliance tracking for commercial property managers. Automates COI collection, AI extraction, compliance verification, and vendor/tenant follow-up notifications.

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
- Export Report button (PDF via browser print, CSV download) for compliance reports
- 6-step interactive dashboard tour with data-tour attributes, light tooltip style
- Properties / vendors / tenants CRUD with compliance tracking
- Certificate holder and additional insured fields on property creation
- Vendor/tenant names clickable in property list
- COI Expiration column (color-coded dates, Current/Expired labels) in property vendor/tenant list
- Status badges fixed to single line (whitespace-nowrap)
- Bulk COI upload with AI extraction, retry logic (exponential backoff: 2s/4s/8s), batch processing (5 concurrent files)
- COI type selection (vendor vs tenant) during bulk upload
- Contact capture during bulk upload (contact name, email pre-populated from extraction)
- Auto-assignment of COIs to property created during onboarding
- AI-powered data extraction (coverage types, limits, dates, named insureds, certificate holder, additional insured, endorsements)
- Two-pass AI extraction: Pass 1 = ACORD 25 data (page 1), Pass 2 = endorsement verification (pages 2+)
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
- Waiver/override tracking with reason, expiration, audit trail
- Coverage gap details with specific shortfalls (e.g., "GL limit is $500K but requirement is $1M")
- Vendor/tenant detail pages: two-column layout (PDF viewer left, compliance checklist right)
- Self-service vendor/tenant portal (token-based, no auth required)
- Automated notifications & follow-up emails (expiration warnings)
- Stripe billing with three tiers and trial enforcement
- Archive, delete, and bulk actions for vendors/tenants
- SEO content pages and blog (MDX)
- 57 programmatic pages under /insurance-requirements/
- 11 blog posts (MDX) with inline CTAs and bottom-of-post CTAs
- 10 competitor comparison pages under /compare/ (TrustLayer, Certificial, Billy, SmartCompliance, PINS, CertFocus, BCS, Jones, MyCOI, Spreadsheets)
- 7 vertical landing pages under /for/
- 2 alternatives pages under /alternatives/
- www to non-www 301 redirect
- Session expiration (24h standard / 7d with "Remember me") with cookie-based middleware gate
- Real-time dashboard & reporting

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

#### SEO: ACORD 25 Post Upgrade (Apr 2026)

- Expanded `/blog/acord-25-certificate-explained` from ~190 lines to ~300+ lines for deeper content and better rankings
- Updated meta title to "ACORD 25 Certificate of Insurance Explained (2026 Guide)" and description for SEO
- Added anchor-linked table of contents below intro
- Expanded "ACORD 25 vs ACORD 28" section with when-to-request guidance
- Added new "What Property Managers Need to Check on Every ACORD 25" section (8-point verification)
- Expanded "Common Mistakes" section with 8 specific liability gaps (entity name errors, blanket AI without endorsement, umbrella gaps)
- Added FAQ section (5 Q&As) with FAQPage JSON-LD structured data (in blog page component)
- Added internal links to ACORD 28, Additional Insured, COI compliance, expiration tracking, and COI tracking software pages

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

- Anthropic API 529 errors during bulk upload (retry logic with exponential backoff in place)
- Tutorial walkthrough positioning edge cases

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

## Important Patterns

- **Server actions** use `requireAuth()` from `src/lib/actions/auth.ts` to get `{ userId, orgId }`. Throws if not authenticated.
- **Service role client** (`src/lib/supabase/service.ts`) bypasses RLS for admin operations like portal uploads, profile creation, plan checks.
- **Plan enforcement:** `checkActivePlan()` from `src/lib/require-active-plan.ts` returns `{ error }` for inactive plans. `checkVendorTenantLimit()` and `checkExtractionLimit()` from `src/lib/plan-limits.ts` enforce per-plan quotas. Trial extraction limit is 50.
- **After mutations:** call `revalidatePath()` to refresh server components.
- **Middleware** (`src/middleware.ts`) checks for `smartcoi-session` cookie before refreshing auth tokens. No cookie = expired session = redirect to `/login`. Redirects unauthenticated users to `/login`.
- **Session management** (`src/lib/session.ts`) uses a browser cookie (`smartcoi-session`) as a server-readable session marker (24h or 7d max-age) plus localStorage for inactivity tracking. `SessionGuard` component in the dashboard layout checks both.
- **Compliance pipeline:** No manual review step. Extraction → automatic compliance calculation. Fuzzy name matching for certificate holder and additional insured.
- **Bulk upload:** Batch processing with 5 concurrent files, exponential backoff retry (2s/4s/8s) on Anthropic API 529 errors.
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
