# 24K Magic AI

- **Status**: In development
- **Domain**: 24kmagicai.com (not purchased yet; written into config so the scaffold matches the domain Zenith will buy)
- **Directory**: `sites/ai24kmagic` — `pnpm new-site` rejects `24kmagicai` because a directory name must match `^[a-z][a-z0-9-]{1,30}[a-z0-9]$` (lowercase letters, digits, and hyphens, 3–32 characters, starting with a letter). Worker, D1, and R2 names follow this directory (`ai24kmagic`, `ai24kmagic-outputs`). The public site name and URL stay 24K Magic AI / `https://24kmagicai.com`.
- **Target keyword**: 24K Magic AI Dance
- **Search intent**: Someone with a photo of themselves (or a few people) wants a short cruise-deck dance video in the style of Bruno Mars' "24K Magic" (gold, funk, yacht-deck energy) and will search that phrase to make one.
- **Competitors**: [tinydeskai.io](https://tinydeskai.io/) (`sites/tinydeskai-example`). It already does photo → performance video, but only for the Tiny Desk / “Outstanding” band-on-a-desk scene. Generic “AI dance” generators also exist; they do not own this keyword or this cruise-deck scene.
- **Launch date**:
- **Payment account**: (Stripe or PayPal, legal entity, account name — not chosen)
- **Metrics**: GA4 property ID, Rybbit siteId (analytics in site.config.ts), GSC — not set
- **Created**: 2026-11-02

## How this site differs from competitors

Same job as Tiny Desk AI (upload a photo, get a performance clip back), different keyword and different picture.

- **Scene**: a cruise-deck / yacht dance, not an NPR Tiny Desk studio with a band seated at a desk.
- **Look**: 24K Magic-era styling — gold, funk, night-deck lighting, dance — not the intimate Tiny Desk concert.
- **Query**: rank for “24K Magic AI Dance” and close variants. Do not try to be another Tiny Desk site, and do not expect tinydeskai.io to rank for this scene.

Do not launch until that difference is actually in the product. This directory is still the `templates/ai-site` image generator (prompt → image). The dance effect — photo slots, a reference clip, one-pass edit, and compose — is not built yet. Adapt the pattern in `sites/tinydeskai-example`, and only with music and footage this site has the rights to use (or AI-generated bases). Do not ship the official “24K Magic” master or video.

`DESIGN.md`, home-page copy, model prices, and the `TODO` policy text are still the template. `check-site` is supposed to fail until those are written and `database_id` is set after `wrangler d1 create`.

## Log

- 2026-11-02 Created from templates/ai-site (`pnpm new-site ai24kmagic --domain 24kmagicai.com --name "24K Magic AI"`).
- 2026-11-02 Filled the keyword, intent, and differentiation versus tinydeskai. No Cloudflare resources created.
