---
description: Run a full consistency audit across the SmartCOI codebase
---

Run a comprehensive consistency audit across the entire SmartCOI codebase. Check every public-facing page, dashboard reference, comparison page, blog post, and SEO metadata for consistency.

Check for:
1. **Pricing:** Every mention of pricing must match the source of truth in CLAUDE.md (Starter $79, Growth $149, Professional $249 — no Enterprise tier)
2. **Product name:** Must be "SmartCOI" everywhere in user-facing text (not "Smart COI", "smartcoi", etc.)
3. **Feature claims:** No references to lease extraction, third-party integrations, shared vendor networks, or any features that don't exist
4. **SEO metadata:** All public pages have proper title tags (<60 chars), meta descriptions (<160 chars), absolute canonical URLs, and are included in the sitemap
5. **Internal links:** No broken links, no links to auth-gated pages from public pages
6. **CTA consistency:** Primary CTA should be "Upload 50 COIs Free" on the landing page
7. **Stripe price IDs:** Verify all three tiers have real (non-placeholder) price IDs in stripe-prices.ts

Report format:
- List every file checked
- Flag every inconsistency found with what was wrong and what needs to change
- Note files that were already correct
- ⚠️ Flag any manual steps at the end

$ARGUMENTS
