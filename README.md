# CertBlueprint.com

IT-certification roadmaps, study plans, and curated resources — plus the
**IT Career Navigator** (a guided assessment and an AI "talk it out" reader).

- **Stack:** Astro 6 (fully static output) + Tailwind CSS 4, deployed as a
  Cloudflare **Worker with static assets** (`wrangler.toml`). The Worker
  (`worker/index.js`) serves one API route, `POST /api/navigator/read`,
  backed by **Workers AI** (Llama 3.3 70B) for the Navigator Lab; everything
  else falls through to the built `dist/` assets.
- **Content model:** all guide/vendor/path/comparison content lives as JSON in
  `src/content/` validated by strict Zod schemas in `src/content.config.ts`
  (rich-content floors: a cert guide cannot be published thin — the build fails).
  Sixteen original cert guides are bespoke static routes; everything newer is
  collection-driven through `src/pages/vendors/[vendor]/[cert]/` and renders via
  the shared `CertGuide` component.

## Layout

```
certblueprint/
├── src/
│   ├── content/          # JSON content collections (certifications, vendors, domains, paths, comparisons)
│   ├── pages/            # Astro routes (bespoke + collection-driven)
│   ├── components/       # CertGuide, AffiliateCTA, SearchModal, etc.
│   ├── layouts/          # BaseLayout (SEO/OG/JSON-LD, analytics, theming), LegalLayout
│   └── lib/schema.js     # structured-data builders
├── public/               # static passthrough: robots.txt, _headers, ads.txt,
│                         #   navigator-app.html (guided assessment, iframed),
│                         #   navigator-lab.html (AI conversation UI)
├── worker/index.js       # Cloudflare Worker: /api/navigator/read + asset fallback
├── scripts/submit-indexnow.mjs  # IndexNow ping, last step of `npm run deploy`
├── scripts/check-external-links.mjs # sweeps outbound links on the built site
├── scripts/audit-map.mjs # career-map shape: field reachability and fragility
├── gsc-index.mjs         # optional Google Indexing API nudger (needs service-account.json
│                         #   + `npm i google-auth-library`; both intentionally not committed)
└── audit-content.cjs     # crawls the live site and flags thin pages
```

## Commands

| Command           | Action                                                   |
| :---------------- | :------------------------------------------------------- |
| `npm install`     | Install dependencies                                     |
| `npm run dev`     | Astro dev server at `localhost:4321` (site only, no API) |
| `npx wrangler dev`| Full local run: Worker + built assets (build first)      |
| `npm run build`   | Build the static site to `./dist/`                       |
| `npm run astro -- check` | Typecheck (`.astro` + TS) — keep this at 0 errors |
| `npm run deploy`  | Build, `wrangler deploy`, then IndexNow submit           |
| `npm run check:links` | Sweep every outbound link on the built site (run monthly) |
| `npm run audit:map`   | Career-map shape after editing roles — see below     |

## Operational notes

- **Deploys happen on push to `main`.** The Worker is connected to this
  repository through Cloudflare Workers Builds: build command `npm run build`,
  deploy command `npx wrangler deploy && node scripts/submit-indexnow.mjs`.
  `npm run deploy` does the same by hand from a machine with
  `CLOUDFLARE_API_TOKEN` set.

- **After editing roles or their `adjacent` moves, run `npm run build && npm run
  audit:map`.** The build already fails on a move to a role that does not exist,
  a page nothing links to, and a field no role can reach. The audit asks the
  question those cannot: is the map's *shape* still honest? It reports how far
  each field is from every role, whether any field is held up by a single move,
  and the in/out balance of each field.

  Read its output rather than flattening it. Several asymmetries are the honest
  answer: Support & Operations has 17 moves out and 3 in because people leave the
  help desk and do not go back, and Cloud has no entry-level role because the
  industry does not have one. A map that showed those as balanced would be the
  one that was lying. The thing to act on is a *stranded* role or a field
  resting on one move — that is how the Data gap happened (see
  `docs/NAVIGATOR-REDESIGN.md` §22p).

- **NetDrill links.** Practice links to netdrill.certblueprint.com (cert guides,
  roles, paths, trials, the technology map) come from a committed snapshot of
  NetDrill's catalog, `src/data/labs/netdrill-catalog.json`. After a NetDrill
  release, refresh it from a netdrill checkout with
  `npm run catalog:snapshot -- ../CertBlueprint/src/data/labs/netdrill-catalog.json`
  and build. Which labs each page shows is picked by hand in `src/lib/netdrill.ts`,
  by topic and stage; the build fails on a pick NetDrill no longer has.

- **Secrets:** `.env` holds `CLOUDFLARE_API_TOKEN` for wrangler and is
  gitignored. Never commit it. `service-account.json` (Google Indexing API)
  is likewise gitignored.
- **404s:** `wrangler.toml` sets `not_found_handling = "404-page"` so the
  built `dist/404.html` is served for unknown URLs.
- **Affiliate links:** Amazon links carry the `certblueprint-20` tag and render
  through `AffiliateCTA` (`rel="sponsored"` only for true affiliate links).
- **Search:** `SearchModal.astro` uses a hand-maintained `SEARCH_INDEX` array —
  add an entry when adding a page.
- **Navigator lab:** conversation state lives entirely in the client; the
  Worker is stateless and enforces turn/length caps before calling Workers AI.
