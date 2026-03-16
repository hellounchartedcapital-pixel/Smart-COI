# SmartCOI

*Last updated: March 16, 2026*

SmartCOI — B2B SaaS platform automating Certificate of Insurance (COI) compliance tracking for commercial property managers. Automates COI collection, AI extraction, compliance verification, and vendor/tenant follow-up notifications.

## Product Name

Always "SmartCOI" — capital S, capital C, capital O, capital I, one word.

Never use "Smart COI", "smartCOI", "smartcoi", or "SMARTCOI" in user-facing text.

## Tech Stack

- **Framework:** Next.js 15 (App Router), React 19, TypeScript 5.7
- **Database & Auth:** Supabase (Postgres with RLS, Auth, Storage, Edge Functions, Google OAuth)
- **AI:** Anthropic Claude API (Sonnet 4) for COI extraction
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

Product is feature-complete and in final testing before launch.

### Features That EXIST (reference these freely)

- Auth + onboarding wizard (5-step setup: create org → add property → bulk upload → assign requirements → review & assign requirements)
- Google OAuth login/signup (via Supabase, client ID configured)
- Forgot password / reset password flow
- Confirm password field on signup
- Dashboard with portfolio health bar, compliance stats, action items, activity feed, quick stats, upcoming expirations
- Dashboard two-column layout (65/35) — properties grid + Needs Your Attention on left, activity feed + quick stats + upcoming expirations on right
- Needs Your Attention section with per-item Request COI and Upload COI buttons
- Activity feed with relative timestamps and action-type icons
- Quick Stats card showing monthly activity counts
- Upcoming Expirations widget
- Single Upload COI button in dashboard header (no Bulk Upload button)
- 5-step interactive dashboard tour with data-tutorial attributes
- Properties / vendors / tenants CRUD with compliance tracking
- Certificate holder and additional insured fields on property creation
- Vendor/tenant names clickable in property list
- COI Expiration column (color-coded dates, Current/Expired labels) in property vendor/tenant list
- Status badges fixed to single line (whitespace-nowrap)
- Bulk COI upload with AI extraction, retry logic (exponential backoff: 2s/4s/8s), batch processing (5 concurrent files)
- COI type selection (vendor vs tenant) during bulk upload
- Contact capture during bulk upload (contact name, email pre-populated from extraction)
- Auto-assignment of COIs to property created during onboarding
- AI-powered data extraction (coverage types, limits, dates, named insureds, certificate holder, additional insured)
- Automatic compliance calculation — COIs go directly from extraction to compliance check (no manual review step)
- Fuzzy name matching in compliance engine for certificate holder and additional insured verification
- `accept_cert_holder_in_additional_insured` toggle on properties table
- Split-panel COI viewer (PDF left, compliance checklist right) with fuzzy matching indicator and auto follow-up status
- Compliance templates (vendor & tenant) with configurable requirements
- Self-service vendor/tenant portal (token-based, no auth required)
- Automated notifications & follow-up emails (expiration warnings)
- Stripe billing with three tiers and trial enforcement
- Archive, delete, and bulk actions for vendors/tenants
- SEO content pages and blog (MDX)
- 57 programmatic pages under /insurance-requirements/
- 6 competitor comparison pages (TrustLayer, Certificial, Billy, SmartCompliance, PINS, CertFocus)
- 7 vertical landing pages under /for/
- 2 alternatives pages under /alternatives/
- www to non-www 301 redirect
- Session expiration (24h standard / 7d with "Remember me") with cookie-based middleware gate
- Real-time dashboard & reporting

### Features That DO NOT EXIST (never reference)

- Manual review workflow (removed — compliance is now fully automatic after extraction)
- `review_confirmed` certificate status (removed)
- `confirmCertificate()` or `quickConfirmCertificate()` actions (removed)
- Lease PDF extraction
- Integrations with Procore, MRI, Yardi, AppFolio, or any third-party tools
- Shared vendor network/database
- Human/manual insurance review services
- Enterprise tier or custom pricing

### Known Issues

- Anthropic API 529 errors during bulk upload (retry logic with exponential backoff in place)
- Tutorial walkthrough positioning edge cases

## Architecture Notes

### Compliance Pipeline

COIs follow this flow: **Upload → AI Extraction → Automatic Compliance Calculation**. There is no manual review step. After extraction completes, compliance results are computed automatically using the property's assigned requirement template. Fuzzy name matching (Levenshtein distance) is used for certificate holder and additional insured verification, with a configurable `accept_cert_holder_in_additional_insured` toggle per property.

### Authentication

- Email/password with confirm password field on signup
- Google OAuth via Supabase Auth (client ID configured in Supabase dashboard)
- Forgot password / reset password flow via Supabase Auth
- Trial period (`trial_ends_at`) set correctly on org creation for both email and Google OAuth signups

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
│   │   ├── comparisons/       # 6 competitor comparison pages
│   │   ├── for/               # 7 vertical landing pages
│   │   └── alternatives/      # 2 alternatives pages
│   ├── api/                   # Route handlers (auth callback, webhooks, cron)
│   └── portal/[token]/        # Self-service vendor upload portal
├── components/
│   ├── landing/               # Landing page components
│   ├── dashboard/             # Sidebar, session guard, trial banner, upgrade modal
│   ├── settings/              # Settings page sections
│   ├── onboarding/            # Onboarding wizard components (5 steps)
│   └── ui/                    # shadcn/ui primitives
├── content/
│   └── blog/                  # MDX blog posts
├── lib/
│   ├── supabase/              # Supabase clients (client.ts, server.ts, service.ts)
│   ├── actions/               # Server actions (auth, billing, certificates, notifications, properties, settings, templates)
│   ├── ai/                    # AI extraction engine (extraction.ts)
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
└── migrations/                # Individual migration files (42 total)
```

No shared components between marketing and dashboard.

## Database

All migrations are consolidated in `supabase/consolidated_post_v2_migrations.sql`. Run migrations against production via the Supabase SQL Editor. The file is idempotent and safe to re-run.

17 tables with RLS scoped by `organization_id`: organizations, users, properties, property_entities, organization_default_entities, requirement_templates, template_coverage_requirements, vendors, tenants, certificates, extracted_coverages, extracted_entities, compliance_results, entity_compliance_results, notifications, upload_portal_tokens, activity_log.

Notable columns:
- `properties.accept_cert_holder_in_additional_insured` — boolean toggle for fuzzy matching flexibility
- `properties.certificate_holder` / `properties.additional_insured` — entity name fields for compliance verification

## Important Patterns

- **Server actions** use `requireAuth()` from `src/lib/actions/auth.ts` to get `{ userId, orgId }`. Throws if not authenticated.
- **Service role client** (`src/lib/supabase/service.ts`) bypasses RLS for admin operations like portal uploads, profile creation, plan checks.
- **Plan enforcement:** `checkActivePlan()` from `src/lib/require-active-plan.ts` returns `{ error }` for inactive plans. `checkVendorTenantLimit()` and `checkExtractionLimit()` from `src/lib/plan-limits.ts` enforce per-plan quotas. Trial extraction limit is 50.
- **After mutations:** call `revalidatePath()` to refresh server components.
- **Middleware** (`src/middleware.ts`) checks for `smartcoi-session` cookie before refreshing auth tokens. No cookie = expired session = redirect to `/login`. Redirects unauthenticated users to `/login`.
- **Session management** (`src/lib/session.ts`) uses a browser cookie (`smartcoi-session`) as a server-readable session marker (24h or 7d max-age) plus localStorage for inactivity tracking. `SessionGuard` component in the dashboard layout checks both.
- **Compliance pipeline:** No manual review step. Extraction → automatic compliance calculation. Fuzzy name matching for certificate holder and additional insured.
- **Bulk upload:** Batch processing with 5 concurrent files, exponential backoff retry (2s/4s/8s) on Anthropic API 529 errors.
- **Google OAuth:** Handled via Supabase Auth callback. Trial period assigned on org creation for both email and OAuth signups.

## Conventions

- Always flag manual steps (SQL migrations, env vars, Supabase dashboard settings, Stripe config) with ⚠️ ACTION REQUIRED at the end of every summary.
- Blog posts are MDX files in `src/content/blog/` with frontmatter: `title`, `description`, `date`, `author` (use "SmartCOI Team").
- All public pages must use absolute canonical URLs (`https://smartcoi.io/...`).
- `trailingSlash: false` in Next.js config.
- Sessions expire after 24 hours (7 days with "Remember me").

## Environment Variables

See `.env.example`. Required:

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase project
- `SUPABASE_SERVICE_ROLE_KEY` — Server-side admin operations
- `ANTHROPIC_API_KEY` — Claude AI for COI extraction
- `RESEND_API_KEY` — Transactional email
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` — Billing
- `CRON_SECRET` — Vercel Cron job authentication
- `NEXT_PUBLIC_APP_URL` — Application URL (used in emails, portal links)
