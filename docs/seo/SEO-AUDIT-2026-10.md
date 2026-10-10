# SEO audit — redirects, soft 404s, noindex, validation (2026-10-10)

**Inputs:** Search Console performance export (Web, last 3 months: 250 pages,
28,997 impressions, 133 clicks) · Screaming Frog crawl of 2026-10-10 (277
internal URLs) · a live HTTP check of every URL in the Search Console export,
run 2026-10-10 · a local build of this branch.

**Deliverables:** [`redirects-2026-10.csv`](redirects-2026-10.csv) ·
[`redirects-2026-10.htaccess`](redirects-2026-10.htaccess) ·
[`redirects-2026-10.nginx.conf`](redirects-2026-10.nginx.conf) · the live map,
`RETIRED` in [`worker/index.js`](../../worker/index.js).

## Bottom line

- **No traffic has been displaced.** Of the 250 URLs in the export, 2 return
  404, and they have **1 impression each and 0 clicks**. That is 2 of 28,997
  impressions (0.007%).
- **`/navigator/plan/cybersecurity/` does 404, but it has no impressions in
  the export and was never a page.** Plan URLs have been keyed by career
  path (`/navigator/plan/soc-analyst/`) since the navigator shipped (commit
  `17a5fcd`). Git history has no field-level plan route, and no code builds one.
- **The low clicks are on live pages.** Eight cert and vendor guides take 65%
  of all impressions with a 0.35% click-through rate, because they rank on
  pages 2–4 (average position 19–38). That is a ranking problem; redirects
  will not fix it.
- **The redirects were added anyway.** They are cheap, and they remove the
  404s that do exist. Anything added later is checked by the build (see §3).

## 1. Search Console URLs that do not return 200

Status codes are from the live site on 2026-10-10.

| URL | Live status | Impressions | Clicks | Action |
| --- | --- | ---: | ---: | --- |
| `/vendors/google/google-cybersecurity-certificate-review-cost-worth-it-security/` | 404 | 1 | 0 | 301 → `/vendors/google/google-cybersecurity/` |
| `/navigator/compare/application-software-engineer-vs-software-developer/` | 404 | 1 | 0 | 301 → `/navigator/compare/application-security-engineer-vs-software-developer/` |
| `/navigator/compare/cloud-engineer-vs-cloud-security-engineer` | 307 → slash | 4 | 0 | 307 becomes 301 (§3) |
| `/navigator/compare/application-security-engineer-vs-software-developer` | 307 → slash | 1 | 0 | 307 becomes 301 |
| `/navigator/compare/cloud-architect-vs-cloud-security-engineer` | 307 → slash | 1 | 0 | 307 becomes 301 |
| `/navigator/compare/network-security-engineer-vs-ot-security-engineer` | 307 → slash | 1 | 0 | 307 becomes 301 |
| `www.certblueprint.com/navigator/compare/cloud-security-engineer-vs-security-engineer/` | 301 → apex | 1 | 0 | Already correct |
| `www.certblueprint.com/compare/ccna-vs-ccst-networking/` | 301 → apex | 1 | 0 | Already correct |

Neither 404 URL was ever published. `application-software-engineer` has never
been a role in this repository, so both URLs came from outside the site,
probably mistyped links. Each target is the page the URL was obviously
reaching for.

**Where the impressions actually are** (ranking, not 404s):

| Page | Impressions | Clicks | CTR | Avg. position |
| --- | ---: | ---: | ---: | ---: |
| `/vendors/microsoft/` | 4,456 | 1 | 0.02% | 29.9 |
| `/vendors/cisco/ccna/` | 3,866 | 36 | 0.93% | 19.2 |
| `/vendors/microsoft/az-104/` | 2,762 | 3 | 0.11% | 32.8 |
| `/vendors/google/google-cybersecurity/` | 2,495 | 7 | 0.28% | 28.8 |
| `/vendors/aws/aws-saa/` | 1,945 | 4 | 0.21% | 25.0 |
| `/vendors/google/google-it-support/` | 1,486 | 5 | 0.34% | 27.7 |
| `/vendors/comptia/network-plus/` | 1,020 | 9 | 0.88% | 27.1 |
| `/vendors/comptia/security-plus/` | 961 | 2 | 0.21% | 38.4 |

## 2. The 301 redirect map

| Source | Target | Evidence |
| --- | --- | --- |
| `/navigator/plan/networking/` | `/navigator/explore/networking/` | Requested; live 404; no impressions |
| `/navigator/plan/cybersecurity/` | `/navigator/explore/cybersecurity/` | Requested; live 404; no impressions |
| `/navigator/plan/systems/` | `/navigator/explore/systems/` | Requested; live 404; no impressions |
| `/navigator/plan/cloud/` | `/navigator/explore/cloud/` | Requested; live 404; no impressions |
| `/navigator/plan/software/` | `/navigator/explore/software/` | Requested; live 404; no impressions |
| `/navigator/plan/data/` | `/navigator/explore/data/` | Requested; live 404; no impressions |
| `/navigator/plan/operations/` | `/navigator/explore/operations/` | Requested; live 404; no impressions |
| `/vendors/google/google-cybersecurity-certificate-review-cost-worth-it-security/` | `/vendors/google/google-cybersecurity/` | GSC: 1 impression; live 404 |
| `/navigator/compare/application-software-engineer-vs-software-developer/` | `/navigator/compare/application-security-engineer-vs-software-developer/` | GSC: 1 impression; live 404 |
| `/navigator-app`, `/navigator-app/`, `/navigator-app.html` | `/navigator/` | Already live; kept so the map is complete |

Every rule matches the source with or without its trailing slash and keeps the
query string.

**Why the field plan URLs go to `/navigator/explore/<field>/`:**

- **Not to a per-path plan such as `/navigator/plan/soc-analyst/`.** All 11
  path plans are `noindex`. A 301 into a `noindex` page hands its signals to a
  URL Google drops from the index, which loses them anyway.
- **Not to `/navigator/explore/<role>/`.** Explore pages are keyed by field
  (`networking`, `cybersecurity`, `systems`, `cloud`, `software`, `data`,
  `operations`), not by role. Role pages live at `/navigator/roles/<role>/`.
  Each field's explore page is indexable, links to every role in that field,
  and is the closest match for "a plan for the cybersecurity field".

## 3. How it is deployed

Production is a Cloudflare Worker that runs before the static assets
(`run_worker_first`). The map that actually takes effect is `RETIRED` in
`worker/index.js`. This branch changes it as follows:

- Adds the 9 new rules. A source now matches with or without its trailing
  slash.
- Keeps the query string on retired-URL redirects. Before this change,
  `/navigator-app?utm_source=x` redirected to `/navigator/` and lost the query.
- Turns Cloudflare's trailing-slash **307s into 301s**. The asset layer adds
  or removes the slash with a temporary redirect. That redirect points at the
  canonical URL, so it should be permanent.
- **Adds a build check** in `astro.config.mjs`. The build fails if a redirect
  target stops being built, or if a real page appears at a redirect source
  (the Worker would hide that page). Negative-tested: pointing one rule at a
  missing page and adding a rule that shadowed `/about/` both failed the build.

The `.htaccess` and nginx files are the same map for another host. **Nothing
on the current host reads them.** Both were loaded into a real Apache 2.4
(`.htaccess`, `AllowOverride All`) and a real nginx, and tested on every row:
slashed, slashless, and with a query string. Near-misses that must not
redirect were also tested, such as `/navigator/plan/cloud-engineer/`, which is
a real page. The Apache file uses anchored `RedirectMatch` rather than
`Redirect 301`, because `Redirect` is a prefix match.
`Redirect 301 /navigator/plan/cloud/ …` would also catch
`/navigator/plan/cloud/anything`. If the site leaves Cloudflare, the new host
also needs www → apex and slash canonicalisation, which the Worker does today.

**Deployed 2026-10-10** through Cloudflare Workers Builds (pushes to `main`
now deploy on their own). All 37 checks against the live site passed:
every redirect, the 301 slash fix, the untouched pages, and the
`/navigator-lab` structure.

## 4. Screaming Frog issues

### Soft 404 pages (4)

The issues overview gives a count but does not name the URLs. One of them is
almost certainly a false positive: `/vendors/comptia/pentest-plus/` says *"The
PT0-003 exam runs about $404–$425 USD"*, and "404" in body text is the kind of
string Screaming Frog matches. Google classifies soft 404s by what the page
is, not by a price, so this page is not at risk.

No other built page contains error-page wording ("page not found", "can't be
found", "no longer available" and similar). "Does not exist" appears in 12 role
pages and the trials page, inside a Terraform exercise. That is too many pages
to be the remaining three. So the other three cannot be identified from the
files supplied. **Export *Content → Soft 404 Pages* from the crawl** to name
them.

A real soft 404 that the crawl did not reach: `https://certblueprint.com/404`
serves the error page with **status 200**. It is `noindex` and nothing links
to it, so it is harmless today. It is still worth making the Worker answer
`/404` with a 404 status.

### `noindex` directives (11) — intended; keep them

The 11 URLs are exactly the 11 career-path progress trackers,
`/navigator/plan/<path>/` (cloud-engineer, data-analyst,
field-telecom-technician, help-desk-technician, it-project-coordinator,
microsoft-365-administrator, network-administrator, qa-engineer, soc-analyst,
software-developer, systems-administrator). The `noindex` is deliberate:

- `src/pages/navigator/plan/[path].astro` sets it.
- `astro.config.mjs` also removes these URLs from the sitemap.

Each tracker is a checklist whose state lives in the visitor's browser. The
indexable content for each path is `/paths/<slug>/`, which links to its
tracker. Search Console shows **zero impressions for any tracker**, so the
directive is working. Recommendations:

- Keep the `noindex`.
- Never redirect anything into a tracker (see §2).
- Treat this warning as expected in Screaming Frog.

`/navigator/plan/` itself, the plan index, is indexable and correct.
`/navigator/results/` is also `noindex`, deliberately: it is rendered on the
client from session state. The crawl did not reach it because only client
script links to it.

### Validation: missing `<body>`, missing `<head>`, `<head>` not first (1 URL, fixed)

All three flags are the same page, `/navigator-lab`. It is a hand-written
document (`src/lab/navigator-lab.html`) that omitted `<head>` and `<body>`
entirely, which is legal HTML5. Browsers and Googlebot infer both tags. Only
`<meta>`, `<title>`, `<link>`, `<script>` and `<style>` appear before the first
visible element, so the inferred head holds all the metadata, and the real
SEO risk was close to nil. It is still fixed: the template now has explicit
`<head>` and `<body>`, and the built page opens with `<head>`.

## 5. After deploying

1. Spot-check the live site:
   ```sh
   curl -sI https://certblueprint.com/navigator/plan/cybersecurity/   # 301 → /navigator/explore/cybersecurity/
   curl -sI https://certblueprint.com/navigator/compare/cloud-engineer-vs-cloud-security-engineer   # 301, not 307
   curl -sI https://certblueprint.com/navigator/plan/soc-analyst/   # 200, untouched
   ```
2. In Search Console, inspect the two former 404 URLs. If they appear under
   *Pages → Not found (404)*, click *Validate fix*.
3. Re-crawl with Screaming Frog. Expected: 0 validation issues; `noindex` still
   11 (intended); soft 404 at least 1 (the PenTest+ false positive).
4. If the Search Console *Page indexing → Not found (404)* report lists URLs
   that are not here, export it and add them to `RETIRED`. That report is not
   in the performance export this audit used. The build check will catch any
   target that does not resolve.
