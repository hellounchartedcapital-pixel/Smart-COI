# SmartCOI

AI-powered Certificate of Insurance (COI) compliance tracking SaaS for commercial property managers. Automates COI collection, AI extraction, compliance verification, and vendor/tenant follow-up notifications.

## Tech Stack

- **Framework:** Next.js 15 (App Router), React 19, TypeScript 5.7
- **Database & Auth:** Supabase (Postgres with RLS, Auth, Storage, Edge Functions)
- **AI:** Anthropic Claude API (Sonnet 4) for COI extraction
- **Billing:** Stripe (subscriptions, trials, webhooks)
- **Email:** Resend for transactional notifications
- **Hosting:** Vercel with Vercel Cron for scheduled jobs
- **UI:** Tailwind CSS 3, shadcn/ui (Radix primitives), Lucide icons, Sonner toasts

## Current Status

Product is feature-complete and in final testing before launch.

### Key Features Built

- Auth + onboarding wizard (3-step setup)
- Dashboard with compliance stats, action items, activity feed
- Properties / vendors / tenants CRUD with compliance tracking
- AI COI extraction (PDF → structured data via Claude)
- Compliance engine with configurable requirement templates
- Notification system (expiration warnings, follow-ups)
- Self-service vendor upload portal (token-based, no auth required)
- Stripe billing with trial enforcement and plan limits
- Bulk COI upload with automatic entity creation
- Archive, delete, and bulk actions for vendors/tenants
- SEO content pages and blog (MDX)
- Session expiration with activity tracking and "Remember me"

### Recent Work

- Security audit completed (26 findings, all fixed)
- Bulk upload feature built and being tested
- Session expiration added (8h inactivity / 30d with remember-me)

### Known Issues

- Anthropic API 529 errors during bulk upload (pacing/retry logic in place)
- Tutorial walkthrough positioning edge cases

## Database

All migrations are consolidated in `supabase/consolidated_post_v2_migrations.sql`. Run migrations against production via the Supabase SQL Editor. The file is idempotent and safe to re-run.

17 tables with RLS scoped by `organization_id`: organizations, users, properties, property_entities, organization_default_entities, requirement_templates, template_coverage_requirements, vendors, tenants, certificates, extracted_coverages, extracted_entities, compliance_results, entity_compliance_results, notifications, upload_portal_tokens, activity_log.

## Important Patterns

- **Server actions** use `requireAuth()` from `src/lib/actions/auth.ts` to get `{ userId, orgId }`. Throws if not authenticated.
- **Service role client** (`src/lib/supabase/service.ts`) bypasses RLS for admin operations like portal uploads, profile creation, plan checks.
- **Plan enforcement:** `checkActivePlan()` from `src/lib/require-active-plan.ts` returns `{ error }` for inactive plans. `checkVendorTenantLimit()` and `checkExtractionLimit()` from `src/lib/plan-limits.ts` enforce per-plan quotas.
- **After mutations:** call `revalidatePath()` to refresh server components.
- **Middleware** (`src/middleware.ts`) refreshes auth tokens and redirects unauthenticated users to `/login`.
- **Session management** (`src/lib/session.ts`) tracks activity in localStorage, enforces inactivity timeouts client-side via `SessionGuard` component in the dashboard layout.

## File Structure

```
src/
├── app/
│   ├── (auth)/              # Login, signup pages
│   ├── (dashboard)/         # All protected pages (dashboard, properties, settings, etc.)
│   ├── (onboarding)/        # Setup wizard
│   ├── (public)/            # Marketing pages (blog, features, terms, privacy)
│   ├── api/                 # Route handlers (auth callback, webhooks, cron)
│   └── portal/[token]/      # Self-service vendor upload portal
├── components/
│   ├── dashboard/           # Sidebar, session guard, trial banner, upgrade modal
│   ├── settings/            # Settings page sections
│   ├── onboarding/          # Onboarding wizard components
│   └── ui/                  # shadcn/ui primitives
├── lib/
│   ├── supabase/            # Supabase clients (client.ts, server.ts, service.ts)
│   ├── actions/             # Server actions (auth, billing, certificates, notifications, properties, settings, templates)
│   ├── ai/                  # AI extraction engine (extraction.ts)
│   ├── notifications/       # Email templates and sender
│   ├── compliance/          # Compliance checking logic
│   ├── auth.ts              # Client-side signOut helper
│   ├── session.ts           # Session timeout and activity tracking
│   ├── require-active-plan.ts  # Plan enforcement (requireActivePlan, checkActivePlan)
│   ├── plan-limits.ts       # Per-plan quotas (vendors/tenants, extractions)
│   └── plan-status.ts       # Plan status resolution (trial, starter, pro, enterprise)
├── hooks/                   # Custom React hooks
├── services/                # Service modules
├── types/                   # TypeScript type definitions (index.ts)
└── middleware.ts             # Auth middleware

supabase/
├── functions/               # Edge functions (extract-coi, extract-lease-requirements, send-contact)
├── consolidated_post_v2_migrations.sql  # All migrations (run via SQL Editor)
└── migrations/              # Individual migration files (42 total)
```

## Environment Variables

See `.env.example`. Required:

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase project
- `SUPABASE_SERVICE_ROLE_KEY` — Server-side admin operations
- `ANTHROPIC_API_KEY` — Claude AI for COI extraction
- `RESEND_API_KEY` — Transactional email
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` — Billing
- `CRON_SECRET` — Vercel Cron job authentication
- `NEXT_PUBLIC_APP_URL` — Application URL (used in emails, portal links)
