# Labs on CertBlueprint: the plan

Written for whoever builds the hands-on side of CertBlueprint. It covers what changes in this repo, checked against
the code as of 2026-10-11 (CertBlueprint `dd76d29`, netdrill `50b8e18`).

The platform plan this is part of lives in NetDrill:
[`docs/PLATFORM-PLAN.md`](https://github.com/BuildWithREPL/netdrill/blob/main/docs/PLATFORM-PLAN.md). It covers the
runtime, accounts, billing, verified completions and the Systems, Security and Cloud phases. Read its §1–3 first.
This document is its Phase 2, plus what later phases need from this site.

---

## 1. What is already here to build on

CertBlueprint already has the competency graph the strategy memo asks for. It just isn't connected to any practice
yet: **"NetDrill" appears nowhere in this repo, and nothing exists at `/labs/`.**

- **Capabilities are the join key.** There are 55 Navigator capabilities in
  `src/lib/navigator/data/capabilities.ts`, such as `routing`, `switching`, `firewall-policy`, `os-administration`
  and `iac`. Each already links to fields, roles and certifications. The spine, in that file's own words, is
  "TECHNOLOGY → CAPABILITY → DOMAIN → ROLE → CERTIFICATION". Labs attach at the capability, just as Navigator
  trials do.
- **Roles.** There are 38, in `src/lib/navigator/data/roles/`. Each has `certs` and `adjacent` moves and is rendered
  by `RoleProfile.astro`.
- **Two field taxonomies.** There are 10 content `domains` (`src/content/domains/`) and 7 Navigator `DomainId`s
  (`src/lib/navigator/data/domains.ts`). The lab families (networking, systems, security, cloud) follow the
  Navigator ids `networking`, `systems`, `cybersecurity` and `cloud`, because that is where capabilities live.
- **Hands-on content already exists in two forms:**
  - **`paths.trial`** (`objective`, `time`, `cost`, `disclosure`), rendered as "Try it this weekend"
    (`src/pages/paths/[slug]/index.astro:193-204`).
  - **Twelve Navigator trials** (`src/lib/navigator/data/trials.ts`). `assertTrialIntegrity()` (`:797-829`) fails the
    build unless a trial is free, scoped for safety, at least four steps long, and says what enjoying it means.
  
  A NetDrill lab is not a trial and should not be squeezed into that type. Trials stay as they are; labs are a
  separate block next to them.
- **Cert guides.** `ccna` (bespoke, `src/pages/vendors/cisco/ccna/`), `ccnp-enterprise` and
  `ccnp-service-provider` (collection-driven) are the guides for the exams NetDrill maps objective by objective:
  CCNA, ENCOR, ENARSI, SPCOR and SPRI.

## 2. Decisions

1. **One source of lab data: NetDrill's published `catalog.json`.** NetDrill builds it (its Phase 0.3) at
   `https://netdrill.certblueprint.com/catalog.json`. Each lab has an ID, version, title, summary, stage, level,
   topic, difficulty, capabilities, exam objectives and tier.
2. **This site never fetches it during a build.** `scripts/sync-labs.mjs` (`npm run sync:labs`) downloads it,
   validates it, and writes `src/data/labs/netdrill-catalog.json`, which is committed. This keeps Workers Builds
   deterministic and makes every catalog change a reviewable diff. The trade-off is that the snapshot can go stale;
   §5 adds a warning for that.
3. **Pages are per topic, not per lab.** NetDrill has 380 labs, many of them variants ("X: find the fault",
   "Build it: X", "Expand: …"). One page per lab would produce hundreds of near-duplicate pages, the opposite of
   the rich-content floors `src/content.config.ts` enforces on cert guides. NetDrill has 88 topics. **56 of them have three or more labs**
   and get a page each. Capstones (15 topics) share one page, and the small design topologies share another.
4. **No pages for families that have no labs yet.** No "Security labs, coming soon" page. An empty page is thin
   content and a soft-404 risk. The hub instead says which security and automation capabilities NetDrill already
   teaches (`firewall-policy`, `vpn-tunneling`, `network-segmentation`, `authentication`, `scripting-automation`,
   `config-management`, `api-integration`, `observability`).
5. **Links go to NetDrill, not into an iframe.** NetDrill sends `X-Frame-Options: DENY` and
   `frame-ancestors 'none'` on purpose. A lab needs a full screen, and NetDrill's privacy posture (no ad or
   tag-manager scripts) should not share a page with this site's GTM, GA4 and AdSense.

## 3. Pages

| URL | What it is | Generated from |
|---|---|---|
| `/labs/` | The hub: what the labs are, how grading works ("the network's state, not your keystrokes"), that there is nothing to install and no account, the families that exist, and the security and automation capabilities already covered | Hand-written plus snapshot counts |
| `/labs/networking/` | The NetDrill family page: topics grouped by track (CCNA, CCNP Enterprise, CCNP Service Provider), with lab counts and stages | Snapshot |
| `/labs/networking/<topic>/` | One page per topic with three or more labs (56) | Snapshot, plus the capability and role data already in the repo |
| `/labs/networking/capstones/` | The 15 capstones: brief, tier, milestones | Snapshot |
| `/labs/networking/designs/` | Design topologies and the small topics | Snapshot |

**A topic page must carry real content, not a list of links.** It shows:
- what you practice, from the lab summaries grouped by stage (Learn, Build, Fault drill, Expand);
- the capabilities it builds, linked to `/navigator/technologies/`;
- the roles that use those capabilities (from `ROLES`), linked to `/navigator/roles/<role>/`;
- the exam objectives it covers, linked to the cert guide;
- an "Open in NetDrill" link per lab.

A topic page should pass the same kind of rich-content floor the cert guides have. If a topic cannot, it merges into
a neighbor rather than shipping thin.

**Deep links** take the form `https://netdrill.certblueprint.com/?src=cb-<pagetype>#open=<labId>`. The fragment opens
the lab (NetDrill Phase 0.2). The `src` value feeds NetDrill's anonymous `open` event, so the funnel from this site
can be measured without a cookie.

## 4. Links from existing pages

Every link below is chosen automatically through capabilities, so adding a role or a lab needs no hand-written link.

| Page | Addition |
|---|---|
| `RoleProfile.astro` (`/navigator/roles/<role>/`) | A "Practice it in the browser" block: up to six labs whose capabilities overlap the role's, starting with the role's entry certification track |
| `/paths/<slug>/` | The same block, under "Try it this weekend". The trial stays first, because a trial uses tools the reader already has. |
| CCNA, CCNP Enterprise and CCNP Service Provider guides | "Practice the objectives": exam objectives with the labs NetDrill maps to each, taken from the snapshot's `objectives`. On the bespoke CCNA page, add it by hand next to the existing study steps. |
| `TrialCard.astro` | One line, "Next: practice it in NetDrill", when the trial's capabilities have NetDrill topics. `Trial` gets no new field. |
| `src/pages/search-index.json.ts` | Entries for `/labs/` pages, with a new `'lab'` `Doc.type` and its badge in `SearchModal.astro` (around `:107-120`). Add `/labs/` and `/labs/networking/` to `STATIC_PAGES`. |
| Header or footer navigation | A "Labs" entry, once `/labs/` ships |

## 5. Rules, enforced at build time

These follow the pattern of the guards in `astro.config.mjs` (`internalLinkCheck`) and `assertTrialIntegrity()`:

1. **The snapshot's shape.** `format === "netdrill-catalog"` and `version === 1`, or the build fails. A new format
   version is a code change, not a silent data change.
2. **Every capability slug in the snapshot exists in `CAPABILITIES`.** NetDrill keeps its own copy of the allowlist,
   but this site is the owner of the taxonomy.
3. **Every lab ID this site links to exists in the snapshot.** NetDrill's ID-stability test guarantees IDs don't
   disappear upstream. This check catches a stale snapshot on this side.
4. **Hub coverage.** Every `/labs/networking/<topic>/` is linked from `/labs/networking/`. This extends the existing
   vendor and path hub rule.
5. **A stale snapshot is warned about, not failed.** `logger.warn` fires when the snapshot's `generated` date is more
   than 60 days old. A lab catalog that falls a little behind is not worth a failed deploy.

**Client cost: zero.** The pages are static; the snapshot is read at build time only.

## 6. Measurement

- **On this site:** a GA4 event on every "Open in NetDrill" click, `gtag('event', 'lab_open_click', { lab_id, from })`.
  It follows the affiliate click events in `AffiliateCTA.astro:63,79`. This site already declares GA4 in its privacy
  policy, so nothing new is collected.
- **On NetDrill:** its anonymous `open` event records `src`. Together, the two give page view → click → lab opened →
  first command → solve, without a cross-site identifier.

## 7. Later phases: what this site must do

**Accounts launch (platform Phase 3):**
- **Privacy policy.** `src/pages/legal/privacy-policy.astro:46` says "The Site has no user accounts, login forms, or
  contact forms". Accounts live on `labs.certblueprint.com`, but the policy must cover that subdomain or link to its
  own policy the day it launches. The terms of use need the same.
- **Hostnames.** `labs.certblueprint.com` is a separate Worker project. This Worker (`worker/index.js`) must not be
  bound to that hostname; if it ever is, the www redirect block would serve this site there.
- **Cookies.** GA's default cookie domain (`.certblueprint.com`) covers subdomains. The labs app does not load GTM,
  GA4, AdSense or CookieYes. Its session cookie is host-only on `labs.certblueprint.com`, so it is never sent to this
  site.
- **Pricing.** `/labs/` gets a pricing section only when paid tiers exist. Until then, the labs are free and the page
  says so.

**New lab families (platform Phases 5–7):** a family gets `/labs/<family>/` and its topic pages when its runtime
publishes a catalog in the same format (`LabManifest`, platform plan §4). The page templates are written for "a
family" from the start, so Systems needs data, not new templates.

## 8. Naming: "Labs" next to "Navigator Lab"

The AI conversation page calls itself "Navigator Lab" (`src/lab/navigator-lab.html:188`). The code also uses "lab"
for it (`LAB_FIELDS`, `lab-graph.json`, `/navigator-lab`). Next to a "Labs" section with hands-on practice, readers
will not know which is which.

**Recommendation (owner decision):** "Labs" means hands-on practice. The AI page's user-facing name changes, for
example to "Talk it out". The `/navigator-lab` URL and the internal identifiers stay, since renaming them buys nothing
and costs redirects.

## 9. Order of work

1. Wait for NetDrill Phase 0.2 to 0.4 (`#open=`, `catalog.json`, capability tags). That is a dependency, not a
   decision.
2. `scripts/sync-labs.mjs`, the snapshot, and guards 1–3.
3. `/labs/`, `/labs/networking/` and the 56 topic pages, then capstones and designs, with guard 4 and the search
   entries.
4. Links from roles, paths, cert guides and trials (§4).
5. The `lab_open_click` event.
6. Run `npm run build && npm run audit:map`, then `npm run check:links`. Ship.
