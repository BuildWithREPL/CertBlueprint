/**
 * Check every outbound link on the built site.
 *
 * Outbound links rot silently: a vendor reorganises its site and a study guide
 * quietly sends people to a 404. The build cannot check this — builds must work
 * offline and must not depend on someone else's uptime — so this is a separate
 * script to run every month or two:
 *
 *     npm run build && node scripts/check-external-links.mjs
 *
 * Reading the output: plenty of sites refuse anything that is not a browser, so
 * a failure here is a "look at this", not proof of a dead link. Known bot
 * blockers are listed below and reported separately. When something genuinely
 * fails, open it in a real browser before changing any URL — and when you fix
 * one, fix it at the source (content JSON or data file), never in dist/.
 *
 * Verified-by-hand cases worth remembering:
 *   • cool.osd.mil serves 403 to scripts but works in a browser. The Navy is
 *     /usn/, the Air Force is on AFVEC, and there is no Space Force COOL.
 *   • trk.udemy.com (affiliate redirector) and pmi.org always 403 here.
 */
import fs from 'node:fs';
import path from 'node:path';

const DIST = path.join(process.cwd(), 'dist');
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const CONCURRENCY = 8;
const TIMEOUT_MS = 20000;

/** Hosts that refuse non-browser traffic. Failures here are reported quietly. */
const BOT_BLOCKERS = [
  /(^|\.)udemy\.com$/,
  /(^|\.)pmi\.org$/,
  /(^|\.)amazon\.com$/,
  /(^|\.)tryhackme\.com$/,
  // Verified working in a browser on 2026-09-24; they 403 or challenge scripts.
  /(^|\.)exercism\.org$/,
  /(^|\.)learning\.cisa\.gov$/,
  /(^|\.)youradchoices\.com$/,
  /(^|\.)cool\.osd\.mil$/,
  /(^|\.)labex\.io$/,
];

if (!fs.existsSync(DIST)) {
  console.error('No dist/ — run `npx astro build` first.');
  process.exit(1);
}

const links = new Map();
(function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full);
    else if (name.endsWith('.html')) {
      const html = fs.readFileSync(full, 'utf8').replace(/<script[\s\S]*?<\/script>/g, '');
      for (const match of html.matchAll(/href="(https?:\/\/[^"]+)"/g)) {
        const url = match[1].replace(/&amp;/g, '&');
        if (url.includes('certblueprint.com')) continue;
        if (!links.has(url)) links.set(url, new Set());
        links.get(url).add('/' + path.relative(DIST, full).split(path.sep).join('/'));
      }
    }
  }
})(DIST);

async function probe(url) {
  const headers = { 'user-agent': UA, accept: 'text/html,application/xhtml+xml,*/*;q=0.8', 'accept-language': 'en-US,en;q=0.9' };
  for (const method of ['HEAD', 'GET']) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
      const res = await fetch(url, { method, headers, redirect: 'follow', signal: controller.signal });
      clearTimeout(timer);
      if (res.status < 400 || method === 'GET') return { status: res.status };
    } catch (error) {
      if (method === 'GET') return { status: 0, error: String(error.cause?.code ?? error.name) };
    }
  }
  return { status: 0 };
}

const entries = [...links.entries()].map(([url, pages]) => ({ url, pages: [...pages] }));
const results = [];
const queue = [...entries];
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length > 0) {
      const item = queue.shift();
      results.push({ ...item, ...(await probe(item.url)) });
    }
  }),
);

const failed = results.filter((r) => r.status === 0 || r.status >= 400);
const blocked = failed.filter((r) => BOT_BLOCKERS.some((re) => re.test(new URL(r.url).host)));
const suspect = failed.filter((r) => !blocked.includes(r));

console.log(`Checked ${results.length} outbound links across the built site.\n`);
if (suspect.length === 0) {
  console.log('Nothing to look at.');
} else {
  console.log(`${suspect.length} to check in a browser before changing anything:\n`);
  for (const item of suspect.sort((a, b) => a.url.localeCompare(b.url))) {
    console.log(`  ${String(item.status).padEnd(4)} ${item.error ?? ''} ${item.url}`);
    console.log(`       on ${item.pages.slice(0, 3).join(', ')}${item.pages.length > 3 ? ` +${item.pages.length - 3} more` : ''}`);
  }
}
if (blocked.length > 0) {
  console.log(`\n${blocked.length} from hosts that always refuse scripts (Udemy, PMI, Amazon, TryHackMe) — ignore unless a reader reports one.`);
}
process.exit(suspect.length > 0 ? 1 : 0);
