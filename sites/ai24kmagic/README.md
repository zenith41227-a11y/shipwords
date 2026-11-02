# 24K Magic AI

- **Status**: In development
- **Domain**: 24kmagicai.com (not purchased yet; written into config so the scaffold matches the domain Zenith will buy)
- **Directory**: `sites/ai24kmagic` — `pnpm new-site` rejects `24kmagicai` because a directory name must match `^[a-z][a-z0-9-]{1,30}[a-z0-9]$` (starts with a letter). Worker, D1, and R2 names follow this directory (`ai24kmagic`, `ai24kmagic-outputs`).
- **Target keyword**: 24K Magic AI Dance
- **Search intent**: Someone with a photo of themselves (or a few people) wants a short cruise-deck dance video in a “24K Magic” mood (gold, funk, yacht-deck energy) and will search that phrase to make one.
- **Competitors**: [tinydeskai.io](https://tinydeskai.io/) (`sites/tinydeskai-example`). It already does photo → performance video, but only for the Tiny Desk / “Outstanding” band-on-a-desk scene.
- **Launch date**:
- **Payment account**: (Stripe or PayPal, legal entity, account name — not chosen)
- **Metrics**: GA4 property ID, Rybbit siteId, GSC — not set
- **Created**: 2026-11-02

## How this site differs from competitors

Same job as Tiny Desk AI (upload a photo, get a performance clip back), different keyword and different picture.

- **Scene**: a cruise-deck dance, not an NPR Tiny Desk studio.
- **Look**: night sea and champagne gold. The page is a four-seat dance line (Lead, Port, Starboard, Rail), not a band collage.
- **Query**: “24K Magic AI Dance”. Do not try to rank as another Tiny Desk site.

The generator is the effect pipeline from `sites/tinydeskai-example`, copied into this site (sites do not import each other):

- Public slots in `site.models.ts`. Prompts, the Kling model, and asset keys in `src/models.server.ts`.
- Each photo is prepped into a three-view strip, then the whole dance is one Kling 4.0 edit. Compose (`ComposeContainer`, ffmpeg in `packages/jobs/compose`) retimes that edit to 12 seconds, mixes `assets/deck/track.m4a`, and also writes a silent file.
- One video is 10 credits for 1 to 4 people. Packs are a starting price (`$9.98` / `$24.99` / `$59.99`), not a measured quote for this clip.
- Face check and shot repair are in `src/models.server.ts` but **off** (`MEASURED = false`) until the real clip is measured. With that flag on, a charged render is not refunded just because a face was missed (`onMiss: 'deliver'`).

## Licensed assets Zenith must supply

Do not commit Bruno Mars’ master, the official “24K Magic” video, or any unlicensed clip. Nothing in `public/` is that footage. `public/deck.svg` is an original stand-in drawing.

Put these in this site’s R2 bucket (local: `pnpm wrangler r2 object put … --local`):

| Key                     | What it must be                                                                                                                                                                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `assets/deck/dance.mp4` | A dance this site has rights to. 720×1280, 24 fps, 12 seconds. The prompt in `src/models.server.ts` names four dancers (gold jacket center, white shirt left, black jacket right, sequins at the rail). Change those sentences so they match this file. |
| `assets/deck/track.m4a` | 12 seconds of music this site has rights to, mixed back in by compose. Not the official recording unless you license it.                                                                                                                                |

Before anyone pays: run a few real generations, record cost and likeness, set `maxCost` from that, replace the placeholder face points, set `MEASURED` to true only if the clip has hard cuts within 0.5 s of 4 s and 8 s, and rewrite `DESIGN.md` only if the look changes. `check-site` still fails until `database_id` is set and the policy `TODO`s are replaced.

Local mock (`UPSTREAM_MOCK=1` in `.dev.vars.example`) does not call Yir. It still needs `assets/deck/dance.mp4` in local R2 before a mock job can finish, because the mock echoes that reference video.

## Log

- 2026-11-02 Created from templates/ai-site (`pnpm new-site ai24kmagic --domain 24kmagicai.com --name "24K Magic AI"`).
- 2026-11-02 Replaced the image generator with the cruise-deck dance effect. No Cloudflare resources, no copyrighted audio or video.
