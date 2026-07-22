// gsc-index.mjs — submit URLs to Google's Indexing API (nudges a crawl)
// Run the SAME command once a day:   node gsc-index.mjs
// It submits the next 11 pages each run and remembers what's done.
// One-time setup is documented at the bottom of this file.

import { JWT } from 'google-auth-library';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const KEY_PATH   = './service-account.json';
const STATE_PATH = './.gsc-progress.json';   // auto-created; tracks what's submitted
const BATCH_SIZE = 11;                        // pages per run (API allows up to 200/day)

// All 27 pages, ordered best-first: money pages → vendor hubs → supporting/legal.
// Day 1 does the top 11, Day 2 the next 11, Day 3 the last 5. Then it's done.
const URLS = [
  // ── Day 1: highest-value cert pages ──
  'https://certblueprint.com/',
  'https://certblueprint.com/vendors/comptia/network-plus/',
  'https://certblueprint.com/vendors/cisco/ccna/',
  'https://certblueprint.com/vendors/comptia/security-plus/',
  'https://certblueprint.com/vendors/comptia/a-plus/',
  'https://certblueprint.com/vendors/aws/aws-saa/',
  'https://certblueprint.com/vendors/aws/aws-cloud-practitioner/',
  'https://certblueprint.com/vendors/microsoft/az-104/',
  'https://certblueprint.com/vendors/microsoft/az-900/',
  'https://certblueprint.com/vendors/comptia/cysa-plus/',
  'https://certblueprint.com/vendors/cisco/ccna-cybersecurity/',
  // ── Day 2: remaining cert pages + vendor hubs ──
  'https://certblueprint.com/vendors/comptia/cloud-plus/',
  'https://certblueprint.com/vendors/comptia/linux-plus/',
  'https://certblueprint.com/vendors/comptia/pentest-plus/',
  'https://certblueprint.com/vendors/cisco/ccna-automation/',
  'https://certblueprint.com/vendors/aws/aws-developer-associate/',
  'https://certblueprint.com/vendors/microsoft/sc-900/',
  'https://certblueprint.com/vendors/',
  'https://certblueprint.com/vendors/aws/',
  'https://certblueprint.com/vendors/cisco/',
  'https://certblueprint.com/vendors/comptia/',
  // ── Day 3: last hub + supporting/legal pages ──
  'https://certblueprint.com/vendors/microsoft/',
  'https://certblueprint.com/about/',
  'https://certblueprint.com/contact/',
  'https://certblueprint.com/legal/affiliate-disclosure/',
  'https://certblueprint.com/legal/privacy-policy/',
  'https://certblueprint.com/legal/terms-of-use/',
];

// ── Load progress (which URLs are already submitted) ──
let done = [];
if (existsSync(STATE_PATH)) {
  try { done = JSON.parse(readFileSync(STATE_PATH, 'utf8')).done || []; } catch {}
}

const remaining = URLS.filter(u => !done.includes(u));
if (remaining.length === 0) {
  console.log('All pages already submitted. Delete .gsc-progress.json to start over.');
  process.exit(0);
}

const batch = remaining.slice(0, BATCH_SIZE);
console.log(`Submitting ${batch.length} pages (${remaining.length - batch.length} will remain for tomorrow)\n`);

const key = JSON.parse(readFileSync(KEY_PATH, 'utf8'));
const client = new JWT({
  email: key.client_email,
  key: key.private_key,
  scopes: ['https://www.googleapis.com/auth/indexing'],
});

let ok = 0, fail = 0;
for (const url of batch) {
  try {
    const res = await client.request({
      url: 'https://indexing.googleapis.com/v3/urlNotifications:publish',
      method: 'POST',
      data: { url, type: 'URL_UPDATED' },
    });
    console.log(`OK  ${res.status}  ${url}`);
    done.push(url);                                   // record only on success
    ok++;
  } catch (e) {
    const msg = e?.response?.data?.error?.message || e.message;
    console.error(`FAIL  ${url}\n      ${msg}`);      // failed ones retry next run
    fail++;
  }
  await new Promise(r => setTimeout(r, 300));          // be polite to the API
}

// ── Save progress ──
writeFileSync(STATE_PATH, JSON.stringify({ done }, null, 2));

const left = URLS.filter(u => !done.includes(u)).length;
console.log(`\nDone. ${ok} submitted, ${fail} failed. ${left} pages left — run again tomorrow.`);
if (left === 0) console.log('That was the last batch. All pages submitted. ✅');

/* ────────────────────────────────────────────────────────────────────────
ONE-TIME SETUP (~10 min)

1. console.cloud.google.com → create a project (e.g. "certblueprint-indexing").
2. APIs & Services → Library → search "Indexing API" → ENABLE.
3. IAM & Admin → Service Accounts → Create. Give it a name, skip roles, Done.
4. Click the new service account → Keys → Add Key → Create new key → JSON.
   Save the downloaded file as  service-account.json  next to this script.
   (Keep it private — it's a credential. Don't share or upload it anywhere.)
5. Copy the service account email (something@your-project.iam.gserviceaccount.com).
6. Google Search Console → Settings → Users and permissions → Add user →
   paste that email → set role to OWNER (must be Owner, not Full).
7. In this folder:   npm install google-auth-library
8. Run it once a day: node gsc-index.mjs

HOW THE DAILY BATCHING WORKS
- Each run submits the next 11 pages and saves progress to .gsc-progress.json.
- Just run the same command tomorrow; it continues where it left off.
- 27 pages = 3 days (11 + 11 + 5), then it says "all submitted."
- To re-submit everything later (e.g. after big content updates), delete
  .gsc-progress.json and run again.
- Want it all in ONE run instead of 3 days? Set BATCH_SIZE = 27 above.

NOTES
- API quota is 200 URLs/day — the 11/day cadence is just pacing, not a limit.
- This officially targets job/livestream pages; for regular pages it usually
  still triggers a crawl within hours-days, but Google may ignore it. It does
  NOT replace submitting your sitemap once in the GSC dashboard.
──────────────────────────────────────────────────────────────────────────── */
