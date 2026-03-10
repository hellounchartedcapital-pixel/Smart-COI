---
description: Generate a new SmartCOI blog post in MDX format
---

Create a new blog post for SmartCOI on the topic: $ARGUMENTS

Requirements:
- Follow the exact same MDX format, frontmatter structure, and file location as existing posts in `src/content/blog/`
- Frontmatter must include: title, description, date (use today's date in YYYY-MM-DD format), author (use "SmartCOI Team"), slug (generate from topic)
- 800-1,200 words
- Written for commercial property managers (not insurance experts)
- Practical, direct tone
- Naturally reference SmartCOI where relevant without being overly promotional
- End with a brief CTA linking to /signup
- SEO metadata: title under 60 chars, meta description under 160 chars
- Do NOT reference lease extraction, integrations, or any features SmartCOI doesn't currently have (see CLAUDE.md "Features That DO NOT EXIST")
- After creating the post, verify it appears on the blog index page and is included in the sitemap
- ⚠️ Flag any manual steps (like submitting to Google Search Console) at the end
