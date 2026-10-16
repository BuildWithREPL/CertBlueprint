/**
 * First-party usage telemetry for certblueprint.com and netdrill.certblueprint.com,
 * and the private command center that reads it.
 *
 *   POST /api/pulse            beacons from both sites, written to D1
 *   GET  /api/pulse/policy     whether this visitor may be measured (NetDrill asks first)
 *   GET  /api/command/status   whether the database and the key are set up (no secrets)
 *   POST /api/command/query    every number on /command/; needs the key
 *   POST /api/command/session  one session's timeline; needs the key
 *
 * Anything older than RETENTION_DAYS is deleted by the collector itself, at most
 * every few hours per Worker instance (pruneTelemetry): a cron trigger would do
 * the same, but a deploy that cannot add one fails after going live.
 *
 * Who is measured (measureRule): in the EEA, the UK and Switzerland, or when the
 * country is unknown, only visitors who accepted analytics cookies. Elsewhere,
 * everyone who has not declined them. A decline or Global Privacy Control stops
 * the beacon everywhere. Pages carry the rule in <meta name="cb-measure">, so the
 * tracker knows before it stores or sends anything; this collector refuses
 * beacons that break it anyway. Every certblueprint.com page request is also
 * counted per path and day (countPage), with no identifiers at all.
 *
 * What is kept, per event: the page path or NetDrill lab id, time spent, scroll
 * depth, which link was clicked, a random session id, and a random visitor id
 * only when the visitor accepted analytics cookies. Per session: country (from
 * Cloudflare), device type, browser and OS (parsed here from the user agent,
 * which is then dropped), whether the network is a data centre (from its ASN),
 * the referring site and campaign tags. No IP address, no user agent string, and
 * nothing anyone types except search terms.
 *
 * The owner's own visits: /command/ can exclude networks (an IPv4 address or an
 * IPv6 /64, the block a home router gives all its devices). Every beacon from an
 * excluded network is dropped, from any device or browser, on both sites. Each
 * visitor's address is compared with that short list in memory and never stored.
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
  "engaged", // the view reached 10 s in use, or was clicked: the session is not a bounce
]);

const ID = /^[A-Za-z0-9_-]{8,40}$/;

const BOTS =
  /bot\b|bot\/|crawl|spider|slurp|archiver|facebookexternalhit|embedly|preview|headless|phantom|lighthouse|pagespeed|gtmetrix|pingdom|uptime|curl\/|wget|python-|go-http|java\/|okhttp|axios|node-fetch|httpclient/i;

// ─── Who may be measured ─────────────────────────────────────────────────────

/**
 * Where analytics needs consent first: the EEA (the EU, its outermost regions
 * that have their own country codes, Iceland, Liechtenstein, Norway), the UK
 * with the Crown dependencies and Gibraltar, and Switzerland.
 */
export const OPT_IN_REGIONS = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU",
  "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE",
  "AX", "GF", "GP", "MQ", "RE", "YT", "MF",
  "IS", "LI", "NO",
  "GB", "GG", "JE", "IM", "GI",
  "CH",
]);

/**
 * "opt-in": measure only after an accept. "opt-out": measure unless declined.
 * REGION_POLICY "regional" applies the list above; anything else, or no value,
 * keeps opt-in everywhere. An unknown country (none, XX, or T1 for Tor) is opt-in.
 */
export function measureRule(country, policy) {
  if (policy !== "regional") return "opt-in";
  if (typeof country !== "string" || !/^[A-Z]{2}$/.test(country) || country === "XX") return "opt-in";
  return OPT_IN_REGIONS.has(country) ? "opt-in" : "opt-out";
}

/** The banner state a beacon reports: an explicit choice, or none yet. */
export function bannerState(value) {
  return value === "granted" || value === "denied" || value === "unset" ? value : null;
}

/**
 * Whether a beacon may be stored, and why not. A decline or GPC wins
 * everywhere; an opt-in region also needs an accept. Beacons from trackers
 * older than the banner state (c missing) are allowed only where the rule is
 * opt-out.
 */
export function beaconVerdict(rule, c, gpc) {
  if (gpc) return "gpc";
  if (c === "denied") return "declined";
  if (rule === "opt-in" && c !== "granted") return "consent";
  return "ok";
}

/**
 * Networks of hosting and cloud providers. Requests from them are mostly
 * scripts and crawlers that say they are browsers; VPN users show up here too,
 * which is why it is a flag the dashboard can show, not a filter at intake.
 */
const DATA_CENTRES = new Set([
  16509, 14618, 8987, // Amazon AWS
  15169, 396982, 19527, // Google, Google Cloud
  8075, // Microsoft Azure
  31898, // Oracle Cloud
  14061, // DigitalOcean
  63949, // Linode / Akamai Connected Cloud
  20473, // Vultr (Choopa)
  16276, // OVHcloud
  24940, 213230, // Hetzner
  12876, // Scaleway
  51167, // Contabo
  60781, 28753, // Leaseweb
  36351, // IBM Cloud (SoftLayer)
  45102, 37963, // Alibaba Cloud
  132203, 45090, // Tencent Cloud
  136907, // Huawei Cloud
  47583, // Hostinger
  62567, // DigitalOcean (legacy)
  46606, // Unified Layer
  26496, // GoDaddy
  398101, // GoDaddy
  40021, // Contabo US
  202425, // IP Volume
]);

export function dcOf(asn) {
  return typeof asn === "number" && DATA_CENTRES.has(asn) ? 1 : 0;
}

function countryOf(request, env) {
  // Local testing only: wrangler dev --var PULSE_DEV_COUNTRY:DE.
  const dev = String(env.PULSE_DEV_COUNTRY || "");
  if (/^[A-Z]{2}$/.test(dev)) return dev;
  const country = request.cf?.country;
  return typeof country === "string" ? country : null;
}

/** The rule for this request, for the page meta tag and the collector alike. */
export function ruleFor(request, env) {
  return measureRule(countryOf(request, env), env.REGION_POLICY);
}

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
  `CREATE TABLE IF NOT EXISTS excluded_networks (
    key TEXT PRIMARY KEY,
    display TEXT NOT NULL,
    label TEXT,
    org TEXT,
    added_ts INTEGER NOT NULL,
    last_seen_ts INTEGER
  )`,
  // Page requests counted by the Worker as it serves them: no ids, no addresses.
  // day is days since 1970-01-01 (UTC); class is human, bot or dc (data centre).
  `CREATE TABLE IF NOT EXISTS page_hits (
    day INTEGER NOT NULL,
    site TEXT NOT NULL,
    path TEXT NOT NULL,
    class TEXT NOT NULL,
    n INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (day, site, path, class)
  )`,
];

/** Columns added after the first release. Adding one that exists fails harmlessly. */
const COLUMNS = [
  "ALTER TABLE events ADD COLUMN q INTEGER", // sequence within a page view: a resent event is ignored
  "ALTER TABLE sessions ADD COLUMN engaged INTEGER NOT NULL DEFAULT 0",
  "ALTER TABLE sessions ADD COLUMN dc INTEGER NOT NULL DEFAULT 0",
];

const INDEXES = [
  `CREATE UNIQUE INDEX IF NOT EXISTS events_pv_q ON events (pv, q) WHERE q IS NOT NULL`,
  `CREATE INDEX IF NOT EXISTS sessions_dc ON sessions (sid) WHERE dc = 1`,
];

async function migrate(db) {
  await db.batch(SCHEMA.map((sql) => db.prepare(sql)));
  for (const sql of COLUMNS) {
    try {
      await db.prepare(sql).run();
    } catch (error) {
      if (!/duplicate column/i.test(String(error?.message ?? error))) throw error;
    }
  }
  await db.batch(INDEXES.map((sql) => db.prepare(sql)));
}

let schemaReady;
function ensureSchema(db) {
  schemaReady ??= migrate(db).catch((error) => {
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

// ─── The owner's networks ────────────────────────────────────────────────────

/**
 * The network an address belongs to, as the owner would exclude it: an IPv4
 * address as it is, an IPv6 address by its /64 (every device behind a home
 * router shares one, while each device's own address keeps changing).
 */
export function networkOf(raw) {
  if (typeof raw !== "string") return null;
  let ip = raw.trim();
  const mapped = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (mapped) ip = mapped[1];
  const v4 = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4) {
    const parts = v4.slice(1).map(Number);
    if (parts.some((p) => p > 255)) return null;
    const display = parts.join(".");
    return { key: `v4:${display}`, display, family: 4 };
  }
  if (!/^[0-9a-f:]+$/i.test(ip) || ip.split("::").length > 2) return null;
  const [head, tail] = ip.split("::");
  const front = head ? head.split(":") : [];
  const back = tail === undefined ? [] : tail ? tail.split(":") : [];
  const fill = tail === undefined ? 0 : 8 - front.length - back.length;
  if (fill < 0 || (tail !== undefined && fill === 0)) return null;
  const groups = [...front, ...Array(fill).fill("0"), ...back];
  if (groups.length !== 8 || groups.some((g) => !/^[0-9a-f]{1,4}$/i.test(g))) return null;
  const prefix = groups.slice(0, 4).map((g) => g.toLowerCase());
  return {
    key: `v6:${prefix.map((g) => g.padStart(4, "0")).join(":")}::/64`,
    display: `${prefix.map((g) => g.replace(/^0+(?=.)/, "")).join(":")}::/64`,
    family: 6,
  };
}

const EXCLUSIONS_TTL = 60_000; // how stale this instance's copy of the list may get
let exclusions = { keys: new Set(), loaded: 0 };
const lastSeenWrite = new Map();

async function excludedKeys(db) {
  if (Date.now() - exclusions.loaded < EXCLUSIONS_TTL) return exclusions.keys;
  await ensureSchema(db);
  const { results } = await db.prepare("SELECT key FROM excluded_networks").all();
  exclusions = { keys: new Set(results.map((r) => r.key)), loaded: Date.now() };
  return exclusions.keys;
}

/** The network a request came from, and whether the owner has excluded it. */
async function requestNetwork(request, env) {
  const net = networkOf(request.headers.get("cf-connecting-ip"));
  if (!net || !env.DB) return net && { ...net, excluded: false };
  try {
    return { ...net, excluded: (await excludedKeys(env.DB)).has(net.key) };
  } catch {
    return { ...net, excluded: false };
  }
}

const gpcOf = (request) => request.headers.get("sec-gpc") === "1";

/**
 * GET /api/pulse/policy: NetDrill has no Worker in front of its pages, so it
 * asks here before it stores or sends anything. Nothing about the request is
 * kept. NetDrill has no consent banner, so where the rule is opt-in it is
 * never measured.
 */
export function handlePolicy(request, env) {
  const site = origin(request, env);
  const rule = ruleFor(request, env);
  const gpc = gpcOf(request);
  return new Response(JSON.stringify({ rule, gpc, measure: rule === "opt-out" && !gpc }), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "private, no-store",
      ...(site ? { "access-control-allow-origin": request.headers.get("origin"), vary: "Origin" } : {}),
    },
  });
}

/** What one beacon's stored events add to their session. */
export function sessionDelta(site, rows) {
  if (!rows.length) return null;
  const views = rows.filter((r) => r.type === "view");
  const first = views[0];
  // Where the session was last: the last page on certblueprint; on NetDrill, the
  // last lab opened (its "pages" are labs inside one app).
  const opened = rows.filter((r) => r.type === "open" && r.item);
  const clicks = rows.reduce((n, r) => n + (r.type === "leave" ? r.c ?? 0 : 0), 0);
  const active = rows.reduce((n, r) => n + (r.type === "leave" ? r.ms ?? 0 : 0), 0);
  return {
    start: Math.min(...rows.map((r) => r.ts)),
    last: Math.max(...rows.map((r) => r.ts)),
    views: views.length,
    reloads: views.filter((r) => r.nav === "reload").length,
    clicks,
    active,
    opens: rows.filter((r) => r.type === "open").length,
    entry: first?.path ?? null,
    exit: site === "nd" && opened.length ? opened[opened.length - 1].item : views[views.length - 1]?.path ?? null,
    ref: first?.ref ?? null,
    src: first?.src ?? null,
    channel: first ? channelOf(first.ref, first.src) : null,
    engaged: rows.some((r) => r.type === "engaged") || views.length >= 2 || clicks > 0 || active >= 10_000 ? 1 : 0,
  };
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
  if (gpcOf(request)) return done(204, "gpc");
  const net = await requestNetwork(request, env);
  if (net?.excluded) {
    // Note when the exclusion last caught something, so /command/ can show it works; at most every 10 minutes.
    const now = Date.now();
    if (now - (lastSeenWrite.get(net.key) ?? 0) > 10 * 60_000) {
      lastSeenWrite.set(net.key, now);
      ctx.waitUntil(env.DB.prepare("UPDATE excluded_networks SET last_seen_ts = ? WHERE key = ?").bind(now, net.key).run().catch(() => {}));
    }
    return done(204, "excluded");
  }

  let body;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY) return done(413, "size");
    body = JSON.parse(text);
  } catch {
    return done(400, "json");
  }
  if (!body || body.v !== 1 || !ID.test(body.sid) || !Array.isArray(body.e)) return done(400, "shape");
  // The page already held back if it knew the rule; this catches the rest
  // (a cached page, a tab that crossed a border, a tracker from before the rule).
  const c = bannerState(body.c);
  const verdict = beaconVerdict(ruleFor(request, env), c, false);
  if (verdict !== "ok") return done(204, verdict);
  const sid = body.sid;
  // A visitor id only travels with an accept; a tracker too old to send c gated it on consent itself.
  const vid = typeof body.vid === "string" && ID.test(body.vid) && (c === null || c === "granted") ? body.vid : null;
  const now = Date.now();

  const rows = [];
  for (const raw of body.e.slice(0, MAX_EVENTS)) {
    if (!raw || !TYPES.has(raw.t)) continue;
    const path = str(raw.p, 200);
    const pv = typeof raw.pv === "string" && ID.test(raw.pv) ? raw.pv : null;
    rows.push({
      ts: now - (int(raw.dt, 3_600_000) ?? 0),
      type: raw.t,
      pv,
      q: pv ? int(raw.q, 100_000) : null,
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

  const cf = request.cf || {};
  const write = async () => {
    const db = env.DB;
    await ensureSchema(db);
    // A resent event (same page view, same sequence number) is ignored, and only
    // the events actually stored count toward the session.
    const insert = db.prepare(
      "INSERT OR IGNORE INTO events (ts, site, sid, vid, pv, q, type, path, item, topic, kind, nav, ms, n, c) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    );
    const results = await db.batch(
      rows.map((r) => insert.bind(r.ts, site, sid, vid, r.pv, r.q, r.type, r.path, r.item, r.topic, r.kind, r.nav, r.ms, r.n, r.c)),
    );
    const kept = rows.filter((_, i) => (results[i]?.meta?.changes ?? 1) > 0);
    const session = sessionDelta(site, kept);
    if (!session) return;
    // A session's acquisition (entry page, referrer, channel) comes from its first
    // view, whichever beacon carries it: a leave can arrive before the view does.
    // engaged: an engaged event, or anything else that means it was no bounce.
    await db
      .prepare(
        `INSERT INTO sessions (sid, site, vid, start_ts, last_ts, views, reloads, clicks, active_ms, opens, entry, exit, ref, channel, src, country, device, browser, os, engaged, dc)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
           opens = sessions.opens + excluded.opens,
           engaged = MAX(sessions.engaged, excluded.engaged,
             sessions.views + excluded.views >= 2, sessions.clicks + excluded.clicks > 0, sessions.active_ms + excluded.active_ms >= 10000),
           dc = MAX(sessions.dc, excluded.dc)`,
      )
      .bind(
        sid, site, vid, session.start, session.last,
        session.views, session.reloads, session.clicks, session.active, session.opens,
        session.entry, session.exit, session.ref, session.channel, session.src,
        countryOf(request, env), deviceOf(ua), browserOf(ua), osOf(ua),
        session.engaged, dcOf(cf.asn),
      )
      .run();
  };
  ctx.waitUntil(
    write()
      .then(() => maybePrune(env))
      .catch((error) => console.error("pulse write failed", error)),
  );
  return done(204, "ok");
}

// ─── Page requests, counted as they are served ───────────────────────────────

/**
 * Every certblueprint.com page the Worker serves, counted per day, path and
 * class: no id, no address, no cookie, nothing in the browser. It counts the
 * visits the beacon must not or cannot measure (no consent, ad blockers, no
 * JavaScript), so /command/ can show how much of the traffic the beacon sees.
 *
 * Counts gather in memory and are written together a few seconds later, inside
 * the same requests' waitUntil, so nothing is left behind when the instance is
 * retired.
 */
const HITS_WINDOW = 15_000;
let hits = new Map();
let hitsFlush = null;

export function pageClass(ua, asn) {
  if (!ua || BOTS.test(ua)) return "bot";
  return dcOf(asn) ? "dc" : "human";
}

/** Whether a response is a page someone (or something) loaded. */
export function isPageLoad(method, status, contentType, accept, purpose) {
  if (method !== "GET") return false;
  if (/prefetch/i.test(purpose || "")) return false; // speculative: not a view unless it is opened
  if (status === 200) return /text\/html/i.test(contentType || "");
  if (status === 304) return /text\/html/i.test(accept || ""); // the browser's copy was still good
  return false;
}

export function countPage(request, env, ctx, response, pathname) {
  if (!env.DB || pathname === "/command" || pathname.startsWith("/command/")) return;
  const purpose = request.headers.get("sec-purpose") || request.headers.get("purpose");
  if (!isPageLoad(request.method, response.status, response.headers.get("content-type"), request.headers.get("accept"), purpose)) return;
  const cls = pageClass(request.headers.get("user-agent") || "", request.cf?.asn);
  const day = Math.floor(Date.now() / DAY);
  const path = pathname.slice(0, 200);
  ctx.waitUntil(
    (async () => {
      if ((await requestNetwork(request, env))?.excluded) return; // the owner's own visits
      const key = `${day}\t${path}\t${cls}`;
      hits.set(key, (hits.get(key) ?? 0) + 1);
      // The request that opens a window waits for it and writes it; the others only add to it.
      if (hitsFlush) return;
      hitsFlush = new Promise((resolve) => setTimeout(resolve, HITS_WINDOW)).then(() => flushHits(env));
      await hitsFlush;
    })().catch((error) => console.error("page count failed", error)),
  );
}

async function flushHits(env) {
  const batch = hits;
  hits = new Map();
  hitsFlush = null;
  if (!batch.size) return;
  await ensureSchema(env.DB);
  const upsert = env.DB.prepare(
    "INSERT INTO page_hits (day, site, path, class, n) VALUES (?, 'cb', ?, ?, ?) ON CONFLICT (day, site, path, class) DO UPDATE SET n = n + excluded.n",
  );
  await env.DB.batch(
    [...batch].map(([key, n]) => {
      const [day, path, cls] = key.split("\t");
      return upsert.bind(Number(day), path, cls, n);
    }),
  );
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

// A bounce: one view, no click, under 10 s in use, and no engaged event. Sessions
// from before the engaged column have engaged = 0, so the rest still decides them.
const BOUNCE = "(engaged = 0 AND views <= 1 AND clicks = 0 AND active_ms < 10000)";

// A recognised visitor's session that starts more than this after their last
// activity is a new visit. Sessions are per tab, so this keeps a second tab
// opened during the same visit from counting as a return.
const VISIT_GAP = 30 * 60_000;
const WEEK = 7 * DAY;
const COHORT_WEEKS = 26;

/**
 * Every query the dashboard runs. Fixed SQL, parameters only: nothing from the
 * request is ever spliced into a statement except the site and data-centre
 * filters, which are chosen from literals.
 */
function queries(db, { start, end, prevStart, bucket, tz, site, now, withDc }) {
  const sp = site ? [site] : [];
  // The filters: on sessions (with an optional table alias), and on events.
  const SF = (a = "") => (site ? ` AND ${a}site = ?` : "") + (withDc ? "" : ` AND ${a}dc = 0`);
  const S = SF();
  const DCE = withDc ? "" : " AND sid NOT IN (SELECT sid FROM sessions WHERE dc = 1)";
  const E = (site ? " AND site = ?" : "") + DCE;
  const range = [start, end, ...sp];
  const q = (sql, ...params) => db.prepare(sql).bind(...params);
  const cb = site === "nd" ? null : "cb";
  const nd = site === "cb" ? null : "nd";
  const day0 = Math.floor(start / DAY);

  // Visitors are recognised visitors only: a visitor id, which exists only with
  // consent. Sessions without one are counted beside them, never added to them.
  const sessionTotals = `SELECT site, COUNT(*) AS sessions, COUNT(DISTINCT vid) AS visitors,
      SUM(CASE WHEN vid IS NULL THEN 1 ELSE 0 END) AS anon,
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
      FROM events WHERE type IN ('view', 'leave') AND ts >= ? AND ts < ? AND site = 'cb' AND pv IS NOT NULL${DCE}
      GROUP BY pv)`;
  // Recognised visitors' sessions in order, each marked with the visit it belongs
  // to (visit_no) and, when it starts a new visit, the gap since the last one.
  // Parameters: end, then the site if filtered.
  const visits = `WITH s AS (
      SELECT sid, site, vid, start_ts, last_ts, views, clicks, active_ms, engaged,
        MAX(last_ts) OVER w AS prev_end,
        MIN(start_ts) OVER (PARTITION BY site, vid) AS first_ts
      FROM sessions WHERE vid IS NOT NULL AND start_ts < ?${S}
      WINDOW w AS (PARTITION BY site, vid ORDER BY start_ts, sid ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING)),
    v AS (
      SELECT *,
        CASE WHEN prev_end IS NULL OR start_ts - prev_end > ${VISIT_GAP} THEN 1 ELSE 0 END AS new_visit,
        CASE WHEN prev_end IS NOT NULL AND start_ts - prev_end > ${VISIT_GAP} THEN start_ts - prev_end END AS gap
      FROM s),
    n AS (
      SELECT *, SUM(new_visit) OVER (PARTITION BY site, vid ORDER BY start_ts, sid ROWS UNBOUNDED PRECEDING) AS visit_no FROM v)`;
  const vp = [end, ...sp];

  const list = {
    totals: q(sessionTotals, ...range),
    previous: q(sessionTotals, prevStart, start, ...sp),
    hidden: q(
      `SELECT site, COUNT(*) AS n FROM sessions WHERE dc = 1 AND start_ts >= ? AND start_ts < ?${site ? " AND site = ?" : ""} GROUP BY site`,
      ...range,
    ),
    series: q(
      `SELECT site, CAST((start_ts + ?) / ? AS INTEGER) AS b, COUNT(*) AS sessions,
         COUNT(DISTINCT vid) AS visitors, SUM(views) AS views
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
    // Recognised visitors in the range: how many came back (a visit that was not
    // their first, in or before the range), how many were known before it, and
    // how many visits each made in it.
    returning: q(
      `${visits},
       per AS (
         SELECT site, vid, MAX(CASE WHEN visit_no > 1 THEN 1 ELSE 0 END) AS back,
           MAX(CASE WHEN first_ts < ? THEN 1 ELSE 0 END) AS before, MAX(SUM(new_visit), 1) AS visits
         FROM n WHERE start_ts >= ? GROUP BY site, vid)
       SELECT site, COUNT(*) AS visitors, SUM(back) AS came_back, SUM(before) AS seen_before,
         SUM(CASE WHEN visits = 1 THEN 1 ELSE 0 END) AS f1,
         SUM(CASE WHEN visits = 2 THEN 1 ELSE 0 END) AS f2,
         SUM(CASE WHEN visits BETWEEN 3 AND 5 THEN 1 ELSE 0 END) AS f3,
         SUM(CASE WHEN visits BETWEEN 6 AND 10 THEN 1 ELSE 0 END) AS f6,
         SUM(CASE WHEN visits > 10 THEN 1 ELSE 0 END) AS f11
       FROM per GROUP BY site`,
      ...vp, start, start,
    ),
    // Every return visit in the range, by how long after the visitor's last activity it came.
    gaps: q(
      `${visits}
       SELECT site, COUNT(*) AS gaps,
         SUM(CASE WHEN gap < 86400000 THEN 1 ELSE 0 END) AS g0,
         SUM(CASE WHEN gap >= 86400000 AND gap < 259200000 THEN 1 ELSE 0 END) AS g1,
         SUM(CASE WHEN gap >= 259200000 AND gap < 604800000 THEN 1 ELSE 0 END) AS g3,
         SUM(CASE WHEN gap >= 604800000 AND gap < 2592000000 THEN 1 ELSE 0 END) AS g7,
         SUM(CASE WHEN gap >= 2592000000 THEN 1 ELSE 0 END) AS g30
       FROM n WHERE start_ts >= ? AND gap IS NOT NULL GROUP BY site`,
      ...vp, start,
    ),
    // Sessions of new and returning recognised visitors, and of sessions without an id.
    engagement: q(
      `${visits}
       SELECT site, CASE WHEN visit_no > 1 THEN 'returning' ELSE 'new' END AS who, COUNT(*) AS sessions, SUM(views) AS views,
         SUM(active_ms) AS active_ms, SUM(CASE WHEN ${BOUNCE} THEN 1 ELSE 0 END) AS bounces
       FROM n WHERE start_ts >= ? GROUP BY site, who
       UNION ALL
       SELECT site, 'none', COUNT(*), SUM(views), SUM(active_ms), SUM(CASE WHEN ${BOUNCE} THEN 1 ELSE 0 END)
       FROM sessions WHERE vid IS NULL AND start_ts >= ? AND start_ts < ?${S} GROUP BY site`,
      ...vp, start, ...range,
    ),
    // Weekly groups of first visits over the last 26 weeks, whatever the range:
    // how many came back within 7, 30 and 90 days. Weeks start on Monday, local time.
    windows: q(
      `${visits},
       c AS (
         SELECT site, vid, MIN(first_ts) AS first, MIN(CASE WHEN visit_no = 2 THEN start_ts END) AS back
         FROM n GROUP BY site, vid HAVING MIN(first_ts) >= ?)
       SELECT site, CAST((first + ? + 259200000) / ${WEEK} AS INTEGER) AS week, COUNT(*) AS cohort,
         SUM(CASE WHEN back - first <= ${7 * DAY} THEN 1 ELSE 0 END) AS r7,
         SUM(CASE WHEN back - first <= ${30 * DAY} THEN 1 ELSE 0 END) AS r30,
         SUM(CASE WHEN back - first <= ${90 * DAY} THEN 1 ELSE 0 END) AS r90
       FROM c GROUP BY site, week ORDER BY week`,
      ...vp, now - COHORT_WEEKS * WEEK, tz,
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
       FROM events WHERE type IN ('impr', 'click') AND topic IS NOT NULL AND ts >= ? AND ts < ?${E}
       GROUP BY site, topic ORDER BY seen DESC, clicks DESC LIMIT 30`,
      ...range,
    ),
    clicks: q(
      `SELECT site, kind, item, COUNT(*) AS clicks, COUNT(DISTINCT sid) AS sessions
       FROM events WHERE type = 'click' AND ts >= ? AND ts < ?${E}
       GROUP BY site, kind, item ORDER BY clicks DESC LIMIT 40`,
      ...range,
    ),
    search: q(
      `SELECT item AS q, COUNT(*) AS searches, MIN(n) AS results,
         SUM(CASE WHEN kind = 'picked' THEN 1 ELSE 0 END) AS picked, COUNT(DISTINCT sid) AS sessions
       FROM events WHERE type = 'search' AND item IS NOT NULL AND ts >= ? AND ts < ?${E}
       GROUP BY item ORDER BY searches DESC LIMIT 40`,
      ...range,
    ),
    errors: q(
      `SELECT site, item AS message, COUNT(*) AS n, COUNT(DISTINCT sid) AS sessions, MAX(path) AS path, MAX(ts) AS last_ts
       FROM events WHERE type = 'error' AND ts >= ? AND ts < ?${E}
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
         s.active_ms, s.opens, s.entry, s.exit, s.channel, s.ref, s.src, s.country, s.device, s.browser, s.os, s.dc,
         (s.vid IS NOT NULL AND EXISTS (SELECT 1 FROM sessions p WHERE p.vid = s.vid AND p.site = s.site
           AND p.start_ts < s.start_ts AND p.last_ts < s.start_ts - ${VISIT_GAP})) AS is_returning
       FROM sessions s WHERE s.start_ts >= ? AND s.start_ts < ?${SF("s.")}
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
         WHERE type = 'view' AND site = 'cb' AND vid IS NOT NULL AND ts >= ? AND ts < ?${DCE} GROUP BY topic, vid)
       SELECT topic, COUNT(*) AS visitors, SUM(CASE WHEN s > 1 THEN 1 ELSE 0 END) AS repeaters FROM u GROUP BY topic`,
      start, end,
    );
    // Page requests the Worker served, per UTC day, beside the views the beacon
    // reported on the same days (data centres follow the filter on both sides).
    list.hits = q(
      `WITH h AS (
         SELECT day, SUM(CASE WHEN class = 'human' THEN n ELSE 0 END) AS human,
           SUM(CASE WHEN class = 'bot' THEN n ELSE 0 END) AS bot, SUM(CASE WHEN class = 'dc' THEN n ELSE 0 END) AS dc
         FROM page_hits WHERE site = 'cb' AND day >= ? GROUP BY day),
       b AS (
         SELECT CAST(ts / 86400000 AS INTEGER) AS day, COUNT(*) AS views FROM events
         WHERE type = 'view' AND site = 'cb' AND ts >= ?${DCE} GROUP BY day)
       SELECT h.day, h.human, h.bot, h.dc, COALESCE(b.views, 0) AS beacon FROM h LEFT JOIN b ON b.day = h.day ORDER BY h.day`,
      day0, day0 * DAY,
    );
    list.hitPaths = q(
      `WITH h AS (
         SELECT path, SUM(CASE WHEN class = 'human' THEN n ELSE 0 END) AS human,
           SUM(CASE WHEN class = 'bot' THEN n ELSE 0 END) AS bot, SUM(CASE WHEN class = 'dc' THEN n ELSE 0 END) AS dc
         FROM page_hits WHERE site = 'cb' AND day >= ? GROUP BY path),
       b AS (
         SELECT path, COUNT(*) AS views FROM events
         WHERE type = 'view' AND site = 'cb' AND ts >= MAX(?, COALESCE((SELECT MIN(day) FROM page_hits WHERE site = 'cb'), 0) * 86400000)${DCE}
         GROUP BY path)
       SELECT h.path, h.human, h.bot, h.dc, COALESCE(b.views, 0) AS beacon FROM h LEFT JOIN b ON b.path = h.path
       ORDER BY h.human DESC, h.bot DESC LIMIT 40`,
      day0, day0 * DAY,
    );
  }
  if (nd) {
    const opened = (col) => `WITH o AS (
        SELECT ${col} AS k, MAX(kind) AS kind, MAX(topic) AS topic, COUNT(*) AS opens, COUNT(DISTINCT sid) AS sessions,
          SUM(CASE WHEN n = 1 THEN 1 ELSE 0 END) AS resumed
        FROM events WHERE type = 'open' AND site = 'nd' AND ts >= ? AND ts < ? AND ${col} IS NOT NULL${DCE} GROUP BY ${col}),
      r AS (
        SELECT k, SUM(CASE WHEN c > 1 THEN 1 ELSE 0 END) AS repeat_sessions FROM (
          SELECT ${col} AS k, sid, COUNT(*) AS c FROM events WHERE type = 'open' AND site = 'nd' AND ts >= ? AND ts < ? AND ${col} IS NOT NULL${DCE} GROUP BY ${col}, sid)
        GROUP BY k),
      u AS (
        SELECT k, COUNT(*) AS visitors, SUM(CASE WHEN s > 1 THEN 1 ELSE 0 END) AS repeaters FROM (
          SELECT ${col} AS k, vid, COUNT(DISTINCT sid) AS s FROM events WHERE type = 'open' AND site = 'nd' AND vid IS NOT NULL AND ts >= ? AND ts < ? AND ${col} IS NOT NULL${DCE} GROUP BY ${col}, vid)
        GROUP BY k),
      t AS (
        SELECT ${col} AS k, SUM(ms) AS ms, SUM(n) AS commands FROM events WHERE type = 'time' AND site = 'nd' AND ts >= ? AND ts < ? AND ${col} IS NOT NULL${DCE} GROUP BY ${col})
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
       FROM events WHERE type = 'view' AND site = 'nd' AND ts >= ? AND ts < ?${DCE}`,
      start, end,
    );
    list.labKinds = q(
      `SELECT kind, COUNT(*) AS opens, COUNT(DISTINCT sid) AS sessions FROM events
       WHERE type = 'open' AND site = 'nd' AND ts >= ? AND ts < ?${DCE} GROUP BY kind ORDER BY opens DESC`,
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
    // Sessions from data-centre networks are left out unless asked for.
    withDc: body.dc === true,
  };
  await ensureSchema(env.DB);
  const here = await requestNetwork(request, env);
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
    dc: params.withDc,
    start: params.start,
    bucket: params.bucket,
    tz: params.tz,
    retentionDays: RETENTION_DAYS,
    rowsRead,
    here: here && { display: here.display, excluded: here.excluded, org: orgOf(request) },
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

function orgOf(request) {
  const org = request.cf?.asOrganization;
  return typeof org === "string" ? org.slice(0, 120) : null;
}

/**
 * List, add or remove excluded networks. "add" always takes the network this
 * request came from, plus up to four addresses the page found for the same
 * connection (its IPv4 and IPv6 can differ from the one that reached us).
 */
async function handleNetworks(request, env) {
  if (!(await authorized(request, env))) return refuse();
  if (!env.DB) return json({ error: "no_database" }, 503);
  let body = {};
  try {
    body = await request.json();
  } catch {
    /* list */
  }
  await ensureSchema(env.DB);
  const db = env.DB;
  let added = [];
  if (body.action === "add") {
    const here = networkOf(request.headers.get("cf-connecting-ip"));
    const found = (Array.isArray(body.ips) ? body.ips.slice(0, 4) : []).map(networkOf);
    const nets = [...new Map([here, ...found].filter(Boolean).map((n) => [n.key, n])).values()];
    const label = str(body.label, 60) ?? "Home";
    const org = orgOf(request);
    if (nets.length) {
      await db.batch(
        nets.map((n) =>
          db
            .prepare(
              `INSERT INTO excluded_networks (key, display, label, org, added_ts) VALUES (?, ?, ?, ?, ?)
               ON CONFLICT (key) DO UPDATE SET label = excluded.label, org = COALESCE(excluded.org, excluded_networks.org)`,
            )
            .bind(n.key, n.display, label, org, Date.now()),
        ),
      );
    }
    added = nets.map((n) => n.display);
    exclusions.loaded = 0;
  } else if (body.action === "remove" && typeof body.key === "string") {
    await db.prepare("DELETE FROM excluded_networks WHERE key = ?").bind(body.key.slice(0, 80)).run();
    exclusions.loaded = 0;
  }
  const { results } = await db.prepare("SELECT key, display, label, org, added_ts, last_seen_ts FROM excluded_networks ORDER BY added_ts").all();
  const here = await requestNetwork(request, env);
  return json({ here: here && { display: here.display, excluded: here.excluded, org: orgOf(request) }, networks: results, added });
}

export async function handleCommand(request, env, pathname) {
  if (pathname === "/api/command/status") {
    return json({ database: Boolean(env.DB), key: Boolean(keyHash(env)) });
  }
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  if (pathname === "/api/command/query") return handleQuery(request, env);
  if (pathname === "/api/command/session") return handleSession(request, env);
  if (pathname === "/api/command/networks") return handleNetworks(request, env);
  return json({ error: "not_found" }, 404);
}

// ─── Retention ───────────────────────────────────────────────────────────────

const PRUNE_EVERY = 6 * 3_600_000;
let lastPrune = 0;

function maybePrune(env) {
  if (Date.now() - lastPrune < PRUNE_EVERY) return;
  lastPrune = Date.now();
  return pruneTelemetry(env);
}

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
  await env.DB.prepare("DELETE FROM page_hits WHERE day < ?").bind(Math.floor(cutoff / DAY)).run();
}
