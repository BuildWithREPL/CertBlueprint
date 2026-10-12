/**
 * First-party usage telemetry for certblueprint.com and netdrill.certblueprint.com,
 * and the private command center that reads it.
 *
 *   POST /api/pulse            beacons from both sites, written to D1
 *   GET  /api/command/status   whether the database and the key are set up (no secrets)
 *   POST /api/command/query    every number on /command/; needs the key
 *   POST /api/command/session  one session's timeline; needs the key
 *   scheduled                  deletes anything older than RETENTION_DAYS
 *
 * What is kept, per event: the page path or NetDrill lab id, time spent, scroll
 * depth, which link was clicked, a random session id, and a random visitor id
 * only when the visitor accepted analytics cookies. Per session: country (from
 * Cloudflare), device type, browser and OS (parsed here from the user agent,
 * which is then dropped), the referring site and campaign tags. No IP address,
 * no user agent string, and nothing anyone types except search terms.
 *
 * The key: /command/ makes one in the browser and shows its SHA-256 fingerprint.
 * Only the fingerprint is configured here (COMMAND_KEY_HASH in wrangler.toml);
 * the key itself is never stored anywhere. Replacing the fingerprint retires the
 * old key at the next deploy.
 */

export const RETENTION_DAYS = 395; // about 13 months, so a year can be compared with the one before

const DAY = 86_400_000;
const MAX_BODY = 16_384;
const MAX_EVENTS = 50;

/** Where beacons may come from, and which site each origin is. */
const ORIGINS = {
  "https://certblueprint.com": "cb",
  "https://netdrill.certblueprint.com": "nd",
};

const TYPES = new Set([
  "view", // a page (certblueprint) or the app (netdrill) loaded
  "leave", // the page was hidden: active ms since the last leave, max scroll %, clicks
  "click", // a tracked link: netdrill, affiliate, outbound, or inside a placement
  "impr", // a placement (data-impression) was on screen for a second
  "search", // a site search: the query, how many results, the page picked if any
  "error", // an uncaught script error
  "open", // netdrill: a lab, lesson or rep was opened
  "time", // netdrill: active ms (and commands typed) on one lab
]);

const ID = /^[A-Za-z0-9_-]{8,40}$/;

const BOTS =
  /bot\b|bot\/|crawl|spider|slurp|archiver|facebookexternalhit|embedly|preview|headless|phantom|lighthouse|pagespeed|gtmetrix|pingdom|uptime|curl\/|wget|python-|go-http|java\/|okhttp|axios|node-fetch|httpclient/i;

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY,
    ts INTEGER NOT NULL,
    site TEXT NOT NULL,
    sid TEXT NOT NULL,
    vid TEXT,
    pv TEXT,
    type TEXT NOT NULL,
    path TEXT,
    item TEXT,
    topic TEXT,
    kind TEXT,
    nav TEXT,
    ms INTEGER,
    n INTEGER,
    c INTEGER
  )`,
  `CREATE INDEX IF NOT EXISTS events_type_ts ON events (type, ts)`,
  `CREATE INDEX IF NOT EXISTS events_sid ON events (sid)`,
  `CREATE TABLE IF NOT EXISTS sessions (
    sid TEXT PRIMARY KEY,
    site TEXT NOT NULL,
    vid TEXT,
    start_ts INTEGER NOT NULL,
    last_ts INTEGER NOT NULL,
    views INTEGER NOT NULL DEFAULT 0,
    reloads INTEGER NOT NULL DEFAULT 0,
    clicks INTEGER NOT NULL DEFAULT 0,
    active_ms INTEGER NOT NULL DEFAULT 0,
    opens INTEGER NOT NULL DEFAULT 0,
    entry TEXT,
    exit TEXT,
    ref TEXT,
    channel TEXT,
    src TEXT,
    country TEXT,
    device TEXT,
    browser TEXT,
    os TEXT
  )`,
  `CREATE INDEX IF NOT EXISTS sessions_start ON sessions (start_ts)`,
  `CREATE INDEX IF NOT EXISTS sessions_last ON sessions (last_ts)`,
  `CREATE INDEX IF NOT EXISTS sessions_vid ON sessions (vid, start_ts) WHERE vid IS NOT NULL`,
];

let schemaReady;
function ensureSchema(db) {
  schemaReady ??= db.batch(SCHEMA.map((sql) => db.prepare(sql))).catch((error) => {
    schemaReady = undefined;
    throw error;
  });
  return schemaReady;
}

// ─── Ingest ──────────────────────────────────────────────────────────────────

function str(value, max) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, max) : null;
}

function int(value, max) {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.min(max, Math.round(value))) : null;
}

function cleanHost(value) {
  const host = str(value, 120)?.toLowerCase().replace(/^www\./, "");
  return host && /^[a-z0-9.-]+$/.test(host) ? host : null;
}

function hostIs(host, domains) {
  return domains.some((d) => host === d || host.endsWith("." + d));
}

/** How a session arrived. Campaign tags win; then the referring site decides. */
export function channelOf(ref, src) {
  if (src) return "campaign";
  if (!ref) return "direct";
  if (hostIs(ref, ["certblueprint.com"])) return "cross-site";
  if (hostIs(ref, ["chatgpt.com", "chat.openai.com", "perplexity.ai", "claude.ai", "gemini.google.com", "copilot.microsoft.com", "you.com", "phind.com", "meta.ai", "chat.deepseek.com", "grok.com"])) return "ai";
  if (/(^|\.)google\.[a-z.]+$/.test(ref) || hostIs(ref, ["bing.com", "duckduckgo.com", "yahoo.com", "yandex.ru", "yandex.com", "baidu.com", "ecosia.org", "search.brave.com", "startpage.com", "qwant.com", "kagi.com", "naver.com"])) return "search";
  if (hostIs(ref, ["facebook.com", "fb.com", "instagram.com", "linkedin.com", "lnkd.in", "twitter.com", "x.com", "t.co", "reddit.com", "youtube.com", "youtu.be", "tiktok.com", "pinterest.com", "discord.com", "threads.net", "bsky.app", "news.ycombinator.com", "dev.to", "medium.com", "quora.com", "stackoverflow.com", "stackexchange.com"])) return "social";
  return "referral";
}

export function deviceOf(ua) {
  if (/iPad|Tablet|PlayBook|Silk|Kindle|Android(?!.*Mobile)/i.test(ua)) return "tablet";
  if (/Mobi|iPhone|iPod|Android|Windows Phone/i.test(ua)) return "mobile";
  return "desktop";
}

export function browserOf(ua) {
  if (/Edg(A|iOS)?\//.test(ua)) return "Edge";
  if (/OPR\/|Opera/.test(ua)) return "Opera";
  if (/SamsungBrowser/.test(ua)) return "Samsung Internet";
  if (/Firefox\/|FxiOS/.test(ua)) return "Firefox";
  if (/CriOS|Chrome\//.test(ua)) return "Chrome";
  if (/Safari\//.test(ua)) return "Safari";
  return "Other";
}

export function osOf(ua) {
  if (/iPhone|iPad|iPod/.test(ua)) return "iOS";
  if (/Android/.test(ua)) return "Android";
  if (/CrOS/.test(ua)) return "ChromeOS";
  if (/Windows/.test(ua)) return "Windows";
  if (/Mac OS X|Macintosh/.test(ua)) return "macOS";
  if (/Linux/.test(ua)) return "Linux";
  return "Other";
}

/**
 * What a certblueprint.com path is about, so time and repeat visits can be
 * added up per subject rather than per URL. NetDrill sends its own topic.
 */
export function topicOf(path) {
  const parts = path.split(/[?#]/)[0].split("/").filter(Boolean);
  const [a, b, c] = parts;
  if (!a) return "home";
  if (a === "vendors") return c ? `cert:${c}` : b ? `vendor:${b}` : "vendors";
  if (a === "paths") return b ? `path:${b}` : "paths";
  if (a === "compare") return b ? `compare:${b}` : "compare";
  if (a === "navigator-lab") return "navigator:lab";
  if (a === "navigator") {
    if (b === "roles" && c) return `role:${c}`;
    if (b === "explore" && c) return `field:${c}`;
    if (b === "compare" && c) return `compare:${c}`;
    if (b === "plan" && c) return `plan:${c}`;
    return b ? `navigator:${b}` : "navigator";
  }
  if (a === "legal") return "legal";
  return a;
}

function origin(request, env) {
  const value = request.headers.get("origin");
  if (value && ORIGINS[value]) return ORIGINS[value];
  // Local testing only: PULSE_DEV_ORIGINS="http://localhost:8787=cb,http://localhost:5173=nd".
  for (const pair of String(env.PULSE_DEV_ORIGINS || "").split(",")) {
    const [o, site] = pair.split("=");
    if (o && value === o.trim() && (site === "cb" || site === "nd")) return site;
  }
  return null;
}

export async function handlePulse(request, env, ctx) {
  const site = origin(request, env);
  // NetDrill posts from another origin with fetch() in cors mode: sendBeacon would
  // go out as no-cors, and under NetDrill's no-referrer policy that sends
  // "Origin: null". cors mode keeps the real Origin, so it needs these headers back.
  const cors = site ? { "access-control-allow-origin": request.headers.get("origin"), vary: "Origin" } : {};
  const done = (status, note) => new Response(null, { status, headers: { "x-pulse": note, "cache-control": "no-store", ...cors } });
  if (request.method === "OPTIONS" && site) {
    return new Response(null, {
      status: 204,
      headers: { ...cors, "access-control-allow-methods": "POST", "access-control-allow-headers": "content-type", "access-control-max-age": "86400" },
    });
  }
  if (request.method !== "POST") return done(405, "method");
  if (!site) return done(403, "origin");
  const ua = request.headers.get("user-agent") || "";
  if (!ua || BOTS.test(ua)) return done(204, "bot");
  if (Number(request.headers.get("content-length") || 0) > MAX_BODY) return done(413, "size");

  let body;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY) return done(413, "size");
    body = JSON.parse(text);
  } catch {
    return done(400, "json");
  }
  if (!body || body.v !== 1 || !ID.test(body.sid) || !Array.isArray(body.e)) return done(400, "shape");
  const sid = body.sid;
  const vid = typeof body.vid === "string" && ID.test(body.vid) ? body.vid : null;
  const now = Date.now();

  const rows = [];
  for (const raw of body.e.slice(0, MAX_EVENTS)) {
    if (!raw || !TYPES.has(raw.t)) continue;
    const path = str(raw.p, 200);
    rows.push({
      ts: now - (int(raw.dt, 3_600_000) ?? 0),
      type: raw.t,
      pv: typeof raw.pv === "string" && ID.test(raw.pv) ? raw.pv : null,
      path,
      item: str(raw.i, 200),
      topic: site === "cb" && (raw.t === "view" || raw.t === "leave") && path ? topicOf(path) : str(raw.tp, 120),
      kind: str(raw.k, 40),
      nav: str(raw.nav, 20),
      ms: int(raw.ms, 6 * 3_600_000),
      n: int(raw.n, 1_000_000),
      c: int(raw.c, 10_000),
      ref: raw.t === "view" ? cleanHost(raw.r) : null,
      src: raw.t === "view" ? str(raw.u, 100) : null,
    });
  }
  if (rows.length === 0) return done(204, "empty");
  if (!env.DB) return done(204, "no-db");

  const views = rows.filter((r) => r.type === "view");
  const first = views[0];
  // Where the session was last: the last page on certblueprint; on NetDrill, the
  // last lab opened (its "pages" are labs inside one app).
  const opened = rows.filter((r) => r.type === "open" && r.item);
  const lastPlace = site === "nd" && opened.length ? opened[opened.length - 1].item : views[views.length - 1]?.path ?? null;
  const ref = first?.ref ?? null;
  const src = first?.src ?? null;
  const cf = request.cf || {};
  const session = {
    start: Math.min(...rows.map((r) => r.ts)),
    last: Math.max(...rows.map((r) => r.ts)),
    views: views.length,
    reloads: views.filter((r) => r.nav === "reload").length,
    clicks: rows.reduce((n, r) => n + (r.type === "leave" ? r.c ?? 0 : 0), 0),
    active: rows.reduce((n, r) => n + (r.type === "leave" ? r.ms ?? 0 : 0), 0),
    opens: rows.filter((r) => r.type === "open").length,
  };

  const write = async () => {
    const db = env.DB;
    await ensureSchema(db);
    const insert = db.prepare(
      "INSERT INTO events (ts, site, sid, vid, pv, type, path, item, topic, kind, nav, ms, n, c) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    );
    // A session's acquisition (entry page, referrer, channel) comes from its first
    // view, whichever beacon carries it: a leave can arrive before the view does.
    const upsert = db.prepare(
      `INSERT INTO sessions (sid, site, vid, start_ts, last_ts, views, reloads, clicks, active_ms, opens, entry, exit, ref, channel, src, country, device, browser, os)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (sid) DO UPDATE SET
         vid = COALESCE(excluded.vid, sessions.vid),
         start_ts = MIN(sessions.start_ts, excluded.start_ts),
         last_ts = MAX(sessions.last_ts, excluded.last_ts),
         entry = CASE WHEN sessions.views = 0 AND excluded.views > 0 THEN excluded.entry ELSE sessions.entry END,
         ref = CASE WHEN sessions.views = 0 AND excluded.views > 0 THEN excluded.ref ELSE sessions.ref END,
         channel = CASE WHEN sessions.views = 0 AND excluded.views > 0 THEN excluded.channel ELSE sessions.channel END,
         src = CASE WHEN sessions.views = 0 AND excluded.views > 0 THEN excluded.src ELSE sessions.src END,
         exit = COALESCE(excluded.exit, sessions.exit),
         views = sessions.views + excluded.views,
         reloads = sessions.reloads + excluded.reloads,
         clicks = sessions.clicks + excluded.clicks,
         active_ms = sessions.active_ms + excluded.active_ms,
         opens = sessions.opens + excluded.opens`,
    );
    await db.batch([
      ...rows.map((r) =>
        insert.bind(r.ts, site, sid, vid, r.pv, r.type, r.path, r.item, r.topic, r.kind, r.nav, r.ms, r.n, r.c),
      ),
      upsert.bind(
        sid, site, vid, session.start, session.last,
        session.views, session.reloads, session.clicks, session.active, session.opens,
        first?.path ?? null, lastPlace, ref, views.length ? channelOf(ref, src) : null, src,
        typeof cf.country === "string" ? cf.country : null, deviceOf(ua), browserOf(ua), osOf(ua),
      ),
    ]);
  };
  ctx.waitUntil(write().catch((error) => console.error("pulse write failed", error)));
  return done(204, "ok");
}

// ─── Command center API ──────────────────────────────────────────────────────

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-robots-tag": "noindex, nofollow",
    },
  });
}

function keyHash(env) {
  const hash = String(env.COMMAND_KEY_HASH || "").trim().toLowerCase();
  return /^[0-9a-f]{64}$/.test(hash) ? hash : null;
}

async function authorized(request, env) {
  const want = keyHash(env);
  const header = request.headers.get("authorization") || "";
  const key = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!want || !key || key.length > 200) return false;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(key));
  const got = new TextEncoder().encode([...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join(""));
  const expected = new TextEncoder().encode(want);
  if (crypto.subtle.timingSafeEqual) return crypto.subtle.timingSafeEqual(got, expected);
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= got[i] ^ expected[i];
  return diff === 0;
}

async function refuse() {
  // A wrong key costs the guesser a moment; the key itself is 256 random bits.
  await new Promise((resolve) => setTimeout(resolve, 400));
  return json({ error: "unauthorized" }, 401);
}

const RANGES = { "24h": DAY, "7d": 7 * DAY, "30d": 30 * DAY, "90d": 90 * DAY, "365d": 365 * DAY };

const BOUNCE = "(views <= 1 AND clicks = 0 AND active_ms < 10000)";

/**
 * Every query the dashboard runs. Fixed SQL, parameters only: nothing from the
 * request is ever spliced into a statement except the site filter, which is
 * chosen from two literals.
 */
function queries(db, { start, end, prevStart, bucket, tz, site, now }) {
  const S = site ? " AND site = ?" : "";
  const sp = site ? [site] : [];
  const range = [start, end, ...sp];
  const q = (sql, ...params) => db.prepare(sql).bind(...params);
  const cb = site === "nd" ? null : "cb";
  const nd = site === "cb" ? null : "nd";
  const sessionTotals = `SELECT site, COUNT(*) AS sessions, COUNT(DISTINCT COALESCE(vid, sid)) AS visitors,
      SUM(views) AS views, SUM(reloads) AS reloads, SUM(opens) AS opens, SUM(clicks) AS clicks,
      SUM(CASE WHEN ${BOUNCE} THEN 1 ELSE 0 END) AS bounces,
      SUM(CASE WHEN clicks > 0 THEN 1 ELSE 0 END) AS clicked,
      SUM(active_ms) AS active_ms, SUM(last_ts - start_ts) AS span_ms,
      SUM(CASE WHEN vid IS NOT NULL THEN 1 ELSE 0 END) AS consented
    FROM sessions WHERE start_ts >= ? AND start_ts < ?${S} GROUP BY site`;
  // Page views of certblueprint, one row per view: its path, time, scroll, clicks.
  const pageViews = `WITH pv AS (
      SELECT pv, MAX(path) AS path, MAX(topic) AS topic, MAX(sid) AS sid, MAX(vid) AS vid,
        MAX(type = 'view') AS viewed,
        MAX(CASE WHEN type = 'view' AND nav = 'reload' THEN 1 ELSE 0 END) AS reload,
        SUM(CASE WHEN type = 'leave' THEN ms ELSE 0 END) AS ms,
        MAX(CASE WHEN type = 'leave' THEN n END) AS scroll,
        SUM(CASE WHEN type = 'leave' THEN c ELSE 0 END) AS clicks
      FROM events WHERE type IN ('view', 'leave') AND ts >= ? AND ts < ? AND site = 'cb' AND pv IS NOT NULL
      GROUP BY pv)`;

  const list = {
    totals: q(sessionTotals, ...range),
    previous: q(sessionTotals, prevStart, start, ...sp),
    series: q(
      `SELECT site, CAST((start_ts + ?) / ? AS INTEGER) AS b, COUNT(*) AS sessions,
         COUNT(DISTINCT COALESCE(vid, sid)) AS visitors, SUM(views) AS views
       FROM sessions WHERE start_ts >= ? AND start_ts < ?${S} GROUP BY site, b ORDER BY b`,
      tz, bucket, ...range,
    ),
    heat: q(
      `SELECT CAST(((start_ts + ?) / 3600000) % 24 AS INTEGER) AS h,
         CAST((((start_ts + ?) / 86400000) + 4) % 7 AS INTEGER) AS d, COUNT(*) AS n
       FROM sessions WHERE start_ts >= ? AND start_ts < ?${S} GROUP BY h, d`,
      tz, tz, ...range,
    ),
    lengths: q(
      `SELECT site, CASE WHEN active_ms < 10000 THEN 0 WHEN active_ms < 30000 THEN 1 WHEN active_ms < 60000 THEN 2
         WHEN active_ms < 180000 THEN 3 WHEN active_ms < 600000 THEN 4 WHEN active_ms < 1800000 THEN 5 ELSE 6 END AS k,
         COUNT(*) AS n
       FROM sessions WHERE start_ts >= ? AND start_ts < ?${S} GROUP BY site, k`,
      ...range,
    ),
    returning: q(
      `WITH v AS (
         SELECT site, vid, COUNT(*) AS c, MIN(start_ts) AS f, MAX(start_ts) AS l
         FROM sessions WHERE vid IS NOT NULL AND start_ts >= ? AND start_ts < ?${S} GROUP BY site, vid),
       e AS (
         SELECT s.site, s.vid, MIN(s.start_ts) AS ever FROM sessions s JOIN v ON v.vid = s.vid AND v.site = s.site
         GROUP BY s.site, s.vid)
       SELECT v.site AS site, COUNT(*) AS visitors,
         SUM(CASE WHEN e.ever < ? OR v.c > 1 THEN 1 ELSE 0 END) AS came_back,
         SUM(CASE WHEN e.ever < ? THEN 1 ELSE 0 END) AS seen_before,
         SUM(CASE WHEN v.c = 1 THEN 1 ELSE 0 END) AS f1,
         SUM(CASE WHEN v.c = 2 THEN 1 ELSE 0 END) AS f2,
         SUM(CASE WHEN v.c BETWEEN 3 AND 5 THEN 1 ELSE 0 END) AS f3,
         SUM(CASE WHEN v.c BETWEEN 6 AND 10 THEN 1 ELSE 0 END) AS f6,
         SUM(CASE WHEN v.c > 10 THEN 1 ELSE 0 END) AS f11,
         SUM(CASE WHEN v.c > 1 AND (v.l - v.f) / (v.c - 1) < 86400000 THEN 1 ELSE 0 END) AS g0,
         SUM(CASE WHEN v.c > 1 AND (v.l - v.f) / (v.c - 1) >= 86400000 AND (v.l - v.f) / (v.c - 1) < 259200000 THEN 1 ELSE 0 END) AS g1,
         SUM(CASE WHEN v.c > 1 AND (v.l - v.f) / (v.c - 1) >= 259200000 AND (v.l - v.f) / (v.c - 1) < 604800000 THEN 1 ELSE 0 END) AS g3,
         SUM(CASE WHEN v.c > 1 AND (v.l - v.f) / (v.c - 1) >= 604800000 AND (v.l - v.f) / (v.c - 1) < 2592000000 THEN 1 ELSE 0 END) AS g7,
         SUM(CASE WHEN v.c > 1 AND (v.l - v.f) / (v.c - 1) >= 2592000000 THEN 1 ELSE 0 END) AS g30
       FROM v JOIN e ON e.vid = v.vid AND e.site = v.site GROUP BY v.site`,
      ...range, start, start,
    ),
    channels: q(
      `SELECT site, COALESCE(channel, 'direct') AS channel, COUNT(*) AS sessions,
         SUM(CASE WHEN ${BOUNCE} THEN 1 ELSE 0 END) AS bounces, SUM(active_ms) AS active_ms
       FROM sessions WHERE start_ts >= ? AND start_ts < ?${S} GROUP BY site, channel`,
      ...range,
    ),
    referrers: q(
      `SELECT ref, MAX(channel) AS channel, COUNT(*) AS sessions,
         SUM(CASE WHEN ${BOUNCE} THEN 1 ELSE 0 END) AS bounces, SUM(active_ms) AS active_ms,
         SUM(CASE WHEN site = 'cb' THEN 1 ELSE 0 END) AS cb, SUM(CASE WHEN site = 'nd' THEN 1 ELSE 0 END) AS nd
       FROM sessions WHERE ref IS NOT NULL AND start_ts >= ? AND start_ts < ?${S}
       GROUP BY ref ORDER BY sessions DESC LIMIT 25`,
      ...range,
    ),
    campaigns: q(
      `SELECT src, COUNT(*) AS sessions, SUM(CASE WHEN ${BOUNCE} THEN 1 ELSE 0 END) AS bounces, SUM(active_ms) AS active_ms
       FROM sessions WHERE src IS NOT NULL AND start_ts >= ? AND start_ts < ?${S}
       GROUP BY src ORDER BY sessions DESC LIMIT 25`,
      ...range,
    ),
    landing: q(
      `SELECT site, entry, COUNT(*) AS sessions, SUM(CASE WHEN ${BOUNCE} THEN 1 ELSE 0 END) AS bounces,
         SUM(active_ms) AS active_ms, SUM(views) AS views
       FROM sessions WHERE entry IS NOT NULL AND start_ts >= ? AND start_ts < ?${S}
       GROUP BY site, entry ORDER BY sessions DESC LIMIT 25`,
      ...range,
    ),
    exits: q(
      `SELECT site, exit, COUNT(*) AS sessions, SUM(last_ts - start_ts) AS span_ms
       FROM sessions WHERE exit IS NOT NULL AND start_ts >= ? AND start_ts < ?${S}
       GROUP BY site, exit ORDER BY sessions DESC LIMIT 15`,
      ...range,
    ),
    audience: q(
      `SELECT 'device' AS dim, site, device AS k, COUNT(*) AS n FROM sessions WHERE start_ts >= ? AND start_ts < ?${S} GROUP BY site, device
       UNION ALL SELECT 'browser', site, browser, COUNT(*) FROM sessions WHERE start_ts >= ? AND start_ts < ?${S} GROUP BY site, browser
       UNION ALL SELECT 'os', site, os, COUNT(*) FROM sessions WHERE start_ts >= ? AND start_ts < ?${S} GROUP BY site, os
       UNION ALL SELECT 'country', site, country, COUNT(*) FROM sessions WHERE start_ts >= ? AND start_ts < ?${S} GROUP BY site, country`,
      ...range, ...range, ...range, ...range,
    ),
    placements: q(
      `SELECT site, topic AS placement,
         COUNT(DISTINCT CASE WHEN type = 'impr' THEN pv END) AS seen,
         COUNT(DISTINCT CASE WHEN type = 'click' THEN pv END) AS clicked,
         SUM(CASE WHEN type = 'click' THEN 1 ELSE 0 END) AS clicks
       FROM events WHERE type IN ('impr', 'click') AND topic IS NOT NULL AND ts >= ? AND ts < ?${S}
       GROUP BY site, topic ORDER BY seen DESC, clicks DESC LIMIT 30`,
      ...range,
    ),
    clicks: q(
      `SELECT site, kind, item, COUNT(*) AS clicks, COUNT(DISTINCT sid) AS sessions
       FROM events WHERE type = 'click' AND ts >= ? AND ts < ?${S}
       GROUP BY site, kind, item ORDER BY clicks DESC LIMIT 40`,
      ...range,
    ),
    search: q(
      `SELECT item AS q, COUNT(*) AS searches, MIN(n) AS results,
         SUM(CASE WHEN kind = 'picked' THEN 1 ELSE 0 END) AS picked, COUNT(DISTINCT sid) AS sessions
       FROM events WHERE type = 'search' AND item IS NOT NULL AND ts >= ? AND ts < ?${S}
       GROUP BY item ORDER BY searches DESC LIMIT 40`,
      ...range,
    ),
    errors: q(
      `SELECT site, item AS message, COUNT(*) AS n, COUNT(DISTINCT sid) AS sessions, MAX(path) AS path, MAX(ts) AS last_ts
       FROM events WHERE type = 'error' AND ts >= ? AND ts < ?${S}
       GROUP BY site, item ORDER BY n DESC LIMIT 15`,
      ...range,
    ),
    live: q(
      `SELECT sid, site, vid IS NOT NULL AS known, start_ts, last_ts, views, opens, exit, country, device
       FROM sessions WHERE last_ts >= ?${S} ORDER BY last_ts DESC LIMIT 25`,
      now - 5 * 60_000, ...sp,
    ),
    recent: q(
      `SELECT s.sid, s.site, s.vid IS NOT NULL AS known, s.start_ts, s.last_ts, s.views, s.reloads, s.clicks,
         s.active_ms, s.opens, s.entry, s.exit, s.channel, s.ref, s.src, s.country, s.device, s.browser, s.os,
         (s.vid IS NOT NULL AND EXISTS (SELECT 1 FROM sessions p WHERE p.vid = s.vid AND p.site = s.site AND p.start_ts < s.start_ts)) AS is_returning
       FROM sessions s WHERE s.start_ts >= ? AND s.start_ts < ?${S.replace("site", "s.site")}
       ORDER BY s.last_ts DESC LIMIT 60`,
      ...range,
    ),
    stored: q(`SELECT (SELECT MAX(id) FROM events) AS events, (SELECT ts FROM events ORDER BY id LIMIT 1) AS since`),
  };

  if (cb) {
    list.pages = q(
      `${pageViews}
       SELECT path, MAX(topic) AS topic, COUNT(*) AS views, COUNT(DISTINCT sid) AS sessions, SUM(ms) AS ms,
         AVG(scroll) AS scroll, SUM(reload) AS reloads, SUM(CASE WHEN clicks > 0 THEN 1 ELSE 0 END) AS clicked
       FROM pv WHERE viewed = 1 GROUP BY path ORDER BY views DESC LIMIT 40`,
      start, end,
    );
    list.topics = q(
      `${pageViews}, t AS (SELECT topic, sid, COUNT(*) AS k, SUM(ms) AS ms FROM pv WHERE viewed = 1 GROUP BY topic, sid)
       SELECT topic, SUM(k) AS views, COUNT(*) AS sessions, SUM(ms) AS ms,
         SUM(CASE WHEN k > 1 THEN 1 ELSE 0 END) AS repeat_sessions
       FROM t GROUP BY topic ORDER BY sessions DESC LIMIT 40`,
      start, end,
    );
    list.topicVisitors = q(
      `WITH u AS (SELECT topic, vid, COUNT(DISTINCT sid) AS s FROM events
         WHERE type = 'view' AND site = 'cb' AND vid IS NOT NULL AND ts >= ? AND ts < ? GROUP BY topic, vid)
       SELECT topic, COUNT(*) AS visitors, SUM(CASE WHEN s > 1 THEN 1 ELSE 0 END) AS repeaters FROM u GROUP BY topic`,
      start, end,
    );
  }
  if (nd) {
    const opened = (col) => `WITH o AS (
        SELECT ${col} AS k, MAX(kind) AS kind, MAX(topic) AS topic, COUNT(*) AS opens, COUNT(DISTINCT sid) AS sessions,
          SUM(CASE WHEN n = 1 THEN 1 ELSE 0 END) AS resumed
        FROM events WHERE type = 'open' AND site = 'nd' AND ts >= ? AND ts < ? AND ${col} IS NOT NULL GROUP BY ${col}),
      r AS (
        SELECT k, SUM(CASE WHEN c > 1 THEN 1 ELSE 0 END) AS repeat_sessions FROM (
          SELECT ${col} AS k, sid, COUNT(*) AS c FROM events WHERE type = 'open' AND site = 'nd' AND ts >= ? AND ts < ? AND ${col} IS NOT NULL GROUP BY ${col}, sid)
        GROUP BY k),
      u AS (
        SELECT k, COUNT(*) AS visitors, SUM(CASE WHEN s > 1 THEN 1 ELSE 0 END) AS repeaters FROM (
          SELECT ${col} AS k, vid, COUNT(DISTINCT sid) AS s FROM events WHERE type = 'open' AND site = 'nd' AND vid IS NOT NULL AND ts >= ? AND ts < ? AND ${col} IS NOT NULL GROUP BY ${col}, vid)
        GROUP BY k),
      t AS (
        SELECT ${col} AS k, SUM(ms) AS ms, SUM(n) AS commands FROM events WHERE type = 'time' AND site = 'nd' AND ts >= ? AND ts < ? AND ${col} IS NOT NULL GROUP BY ${col})
      SELECT o.k AS k, o.kind, o.topic, o.opens, o.sessions, o.resumed, COALESCE(r.repeat_sessions, 0) AS repeat_sessions,
        COALESCE(u.visitors, 0) AS visitors, COALESCE(u.repeaters, 0) AS repeaters,
        COALESCE(t.ms, 0) AS ms, COALESCE(t.commands, 0) AS commands
      FROM o LEFT JOIN r ON r.k = o.k LEFT JOIN u ON u.k = o.k LEFT JOIN t ON t.k = o.k
      ORDER BY o.opens DESC LIMIT 50`;
    list.labs = q(opened("item"), start, end, start, end, start, end, start, end);
    list.labTopics = q(opened("topic"), start, end, start, end, start, end, start, end);
    // NetDrill has no visitor id. Whether a browser had used it before comes from
    // NetDrill's own saved progress, sent as a yes or no on each session's view.
    list.ndReturning = q(
      `SELECT COUNT(DISTINCT sid) AS sessions, COUNT(DISTINCT CASE WHEN kind = 'returning' THEN sid END) AS returning_sessions
       FROM events WHERE type = 'view' AND site = 'nd' AND ts >= ? AND ts < ?`,
      start, end,
    );
    list.labKinds = q(
      `SELECT kind, COUNT(*) AS opens, COUNT(DISTINCT sid) AS sessions FROM events
       WHERE type = 'open' AND site = 'nd' AND ts >= ? AND ts < ? GROUP BY kind ORDER BY opens DESC`,
      start, end,
    );
  }
  return list;
}

async function handleQuery(request, env) {
  if (!(await authorized(request, env))) return refuse();
  if (!env.DB) return json({ error: "no_database" }, 503);
  let body = {};
  try {
    body = await request.json();
  } catch {
    /* defaults below */
  }
  const len = RANGES[body.range] ?? RANGES["7d"];
  const site = body.site === "cb" || body.site === "nd" ? body.site : null;
  const tzMinutes = Number.isFinite(body.tz) ? Math.max(-840, Math.min(840, Math.round(body.tz))) : 0;
  const now = Date.now();
  const params = {
    now,
    end: now + 60_000,
    start: now - len,
    prevStart: now - 2 * len,
    bucket: len <= DAY ? 3_600_000 : DAY,
    tz: -tzMinutes * 60_000,
    site,
  };
  await ensureSchema(env.DB);
  const list = queries(env.DB, params);
  const names = Object.keys(list);
  const results = await env.DB.batch(names.map((n) => list[n]));
  const data = {};
  let rowsRead = 0;
  names.forEach((name, i) => {
    data[name] = results[i].results;
    rowsRead += results[i].meta?.rows_read ?? 0;
  });
  return json({
    generated: now,
    range: Object.keys(RANGES).find((k) => RANGES[k] === len),
    site: site ?? "all",
    start: params.start,
    bucket: params.bucket,
    tz: params.tz,
    retentionDays: RETENTION_DAYS,
    rowsRead,
    data,
  });
}

async function handleSession(request, env) {
  if (!(await authorized(request, env))) return refuse();
  if (!env.DB) return json({ error: "no_database" }, 503);
  let sid = "";
  try {
    sid = (await request.json()).sid;
  } catch {
    /* rejected below */
  }
  if (typeof sid !== "string" || !ID.test(sid)) return json({ error: "bad_request" }, 400);
  await ensureSchema(env.DB);
  const [session, events] = await env.DB.batch([
    env.DB.prepare("SELECT * FROM sessions WHERE sid = ?").bind(sid),
    env.DB.prepare("SELECT ts, type, path, item, topic, kind, nav, ms, n, c FROM events WHERE sid = ? ORDER BY ts, id LIMIT 500").bind(sid),
  ]);
  const row = session.results[0];
  if (!row) return json({ error: "not_found" }, 404);
  delete row.vid; // whether a visitor id exists is enough here
  return json({ session: row, events: events.results });
}

export async function handleCommand(request, env, pathname) {
  if (pathname === "/api/command/status") {
    return json({ database: Boolean(env.DB), key: Boolean(keyHash(env)) });
  }
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  if (pathname === "/api/command/query") return handleQuery(request, env);
  if (pathname === "/api/command/session") return handleSession(request, env);
  return json({ error: "not_found" }, 404);
}

// ─── Retention ───────────────────────────────────────────────────────────────

export async function pruneTelemetry(env) {
  if (!env.DB) return;
  await ensureSchema(env.DB);
  const cutoff = Date.now() - RETENTION_DAYS * DAY;
  // Ids grow with time, so the oldest kept event's id bounds everything older:
  // a rowid range delete, rather than a scan of the whole table for old ts.
  const keep = await env.DB.prepare("SELECT id FROM events WHERE type = 'view' AND ts >= ? ORDER BY ts LIMIT 1").bind(cutoff).first("id");
  const oldest = await env.DB.prepare("SELECT MIN(id) AS id FROM events").first("id");
  if (keep != null && oldest != null && keep > oldest) {
    await env.DB.prepare("DELETE FROM events WHERE id < ?").bind(keep).run();
  } else if (keep == null) {
    await env.DB.prepare("DELETE FROM events WHERE ts < ?").bind(cutoff).run();
  }
  await env.DB.prepare("DELETE FROM sessions WHERE start_ts < ?").bind(cutoff).run();
}
