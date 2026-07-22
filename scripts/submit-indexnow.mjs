// IndexNow submitter for certblueprint.com — runs as the LAST step of `npm run deploy`.
//
// Reads the JUST-BUILT sitemap from ./dist first (authoritative — no race with
// Cloudflare edge propagation, which briefly serves the previous deploy's files),
// falling back to the LIVE sitemap only if dist is missing. POSTs every page URL
// to IndexNow, which instantly notifies Bing / Yandex / Seznam to recrawl.
// NOTE: IndexNow does NOT feed Google — Google still discovers pages via the
// sitemap + normal crawling. This speeds the Bing side and is a freshness
// signal; it is not a Google-index or AdSense lever.
//
// Defaults are baked in for this repo; override via args if ever needed:
//   node scripts/submit-indexnow.mjs [host] [key] [sitemapUrl]
//
// Best-effort by design: the deploy has already succeeded by the time this runs,
// so a flaky search-engine endpoint must NOT fail the deploy. On anything other
// than 200/202 it warns and exits 0 (with one retry for the first-time 403
// "SiteVerificationNotCompleted", which just means the key file isn't fetched yet).

const HOST    = process.argv[2] || 'certblueprint.com';
const KEY     = process.argv[3] || '44e8212782c00869a7d0b05f8f7a880e';
const SITEMAP = process.argv[4] || 'https://certblueprint.com/sitemap-index.xml';
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;

async function fetchText(u) {
  const r = await fetch(u, { headers: { 'User-Agent': 'indexnow-submit/1.0' } });
  if (!r.ok) throw new Error(`${u} -> HTTP ${r.status}`);
  return r.text();
}

async function collect(sitemapUrl, seen = new Set()) {
  const xml = await fetchText(sitemapUrl);
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
  if (/<sitemapindex/i.test(xml)) {
    const out = [];
    for (const sm of locs) {
      if (!seen.has(sm)) {
        seen.add(sm);
        try { out.push(...(await collect(sm, seen))); }
        catch (e) { console.warn('  (skipped sub-sitemap)', String(e)); }
      }
    }
    return out;
  }
  return locs;
}

async function submit(urlList) {
  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList }),
  });
  return res;
}

import { readFileSync, readdirSync } from 'node:fs';

// Authoritative source: the sitemap files the build JUST wrote to ./dist.
// Eliminates the deploy-time race where the live URL still serves the previous
// deploy's sitemap from an edge PoP (observed: 40 URLs submitted when 53 existed).
function collectFromDist() {
  try {
    const files = readdirSync('./dist').filter((f) => /^sitemap.*\.xml$/.test(f) && !/index/.test(f));
    const locs = [];
    for (const f of files) {
      const xml = readFileSync(`./dist/${f}`, 'utf8');
      locs.push(...[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim()));
    }
    return locs;
  } catch {
    return [];
  }
}

try {
  let urlList = [...new Set(collectFromDist())].filter((u) => u.includes(HOST));
  if (urlList.length > 0) {
    console.log(`IndexNow: using local dist sitemap (${urlList.length} URLs — authoritative for this deploy).`);
  } else {
    console.log('IndexNow: dist sitemap not found — falling back to live sitemap fetch.');
    urlList = [...new Set(await collect(SITEMAP))].filter((u) => u.includes(HOST));
  }
  if (urlList.length === 0) {
    console.warn('IndexNow: no page URLs found in sitemap — skipping (deploy unaffected).');
    process.exit(0);
  }
  console.log(`IndexNow: submitting ${urlList.length} URLs for ${HOST}…`);

  let res = await submit(urlList);
  // First-time key verification can lag; retry once after a short wait.
  if (res.status === 403) {
    console.log('IndexNow: 403 (key not fetched yet) — retrying in 60s…');
    await new Promise((r) => setTimeout(r, 60_000));
    res = await submit(urlList);
  }

  console.log(`IndexNow: HTTP ${res.status} ${res.statusText}`);
  if (res.status === 200 || res.status === 202) {
    console.log('✓ accepted');
  } else {
    console.warn('IndexNow not accepted (non-blocking — deploy already succeeded):');
    console.warn((await res.text().catch(() => '')).slice(0, 300));
  }
} catch (e) {
  console.warn('IndexNow submit failed (non-blocking — deploy already succeeded):', String(e));
}
process.exit(0);
