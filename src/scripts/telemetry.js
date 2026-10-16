// First-party usage telemetry for certblueprint.com, read on /command/. Sends
// small beacons to /api/pulse (worker/telemetry.js documents what is kept).
//
// Who is measured: the Worker writes the visitor's rule into every page as
// <meta name="cb-measure">. "opt-in" (the EEA, the UK, Switzerland, or an
// unknown country): nothing is stored or sent until the visitor accepts
// analytics cookies in CookieYes. "opt-out" (everywhere else): measured unless
// they decline. Declining, or Global Privacy Control, stops it everywhere, and
// whatever it had stored is deleted. Each beacon carries the banner state (c),
// and the collector refuses any that break the rule.
//
// - A random session id, in sessionStorage. A session ends after 30 minutes
//   with no activity.
// - A random visitor id, in localStorage, only while the visitor has accepted
//   analytics cookies. Withdrawing consent deletes it. While it exists the
//   session id lives next to it, so a session spans tabs.
// - Nothing anyone types is sent, except the words searched for in site search.
//
// No imports on purpose: navigator-lab.html.ts inlines this file as it is into
// the standalone lab page.

const ENDPOINT = "/api/pulse";
const IDLE_MS = 30 * 60 * 1000; // a session ends after this long without activity
const READING_MS = 60 * 1000; // after the last input, a visible page counts as being read for this long
const ENGAGED_MS = 10 * 1000; // in use this long, a view is engaged: the session is not a bounce
const SESSION_KEY = "cb:t:s";
const VISITOR_KEY = "cb:t:v";
const OFF_KEY = "cb:t:off"; // set by /command/ so the owner's own visits are not counted

function storage(kind) {
  try {
    return window[kind];
  } catch {
    return null;
  }
}
function get(kind, key) {
  try {
    return storage(kind)?.getItem(key) ?? null;
  } catch {
    return null;
  }
}
function put(kind, key, value) {
  try {
    if (value == null) storage(kind)?.removeItem(key);
    else storage(kind)?.setItem(key, value);
  } catch {
    /* storage full or blocked: telemetry degrades, the page does not */
  }
}

function randomId() {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** The page's rule. A page without the tag (served without the Worker) is treated as opt-in. */
const RULE = document.querySelector('meta[name="cb-measure"]')?.getAttribute("content") === "opt-out" ? "opt-out" : "opt-in";
const GPC = navigator.globalPrivacyControl === true;

/** What the visitor chose in the banner: "granted", "denied", or "unset" before any choice. */
function bannerState() {
  try {
    const consent = window.getCkyConsent?.();
    if (consent && consent.categories) {
      if (!consent.isUserActionCompleted) return "unset";
      return consent.categories.analytics === true ? "granted" : "denied";
    }
  } catch {
    /* fall through to the cookie */
  }
  const cookie = document.cookie.match(/(?:^|;\s*)cookieyes-consent=([^;]*)/);
  if (!cookie) return "unset";
  const value = decodeURIComponent(cookie[1]);
  if (!/(?:^|,)action:yes(?:,|$)/.test(value)) return "unset";
  return /(?:^|,)analytics:yes(?:,|$)/.test(value) ? "granted" : "denied";
}

/** Whether this visit may be measured at all, given the banner state. */
function allowed(c) {
  return !GPC && c !== "denied" && (c === "granted" || RULE === "opt-out");
}

const enabled =
  !navigator.webdriver &&
  typeof navigator.sendBeacon === "function" &&
  /^(certblueprint\.com|localhost|127\.0\.0\.1)$/.test(location.hostname);

let measuring = false;
let wired = false;
let visitor = null;
let session = null; // { id, t }
let pageview = null; // { id, path, q, active, flushedActive, clicks, flushedClicks, scroll, flushedScroll, engaged, impressions:Set, errors }
let queue = [];
let timer = 0;
let lastInput = performance.now();
let lastTick = performance.now();

function sessionStore() {
  return visitor ? "localStorage" : "sessionStorage";
}

function saveSession() {
  put(sessionStore(), SESSION_KEY, JSON.stringify(session));
}

function loadSession() {
  try {
    const saved = JSON.parse(get(sessionStore(), SESSION_KEY) || "null");
    if (saved && typeof saved.id === "string" && typeof saved.t === "number") return saved;
  } catch {
    /* corrupt: start over */
  }
  return null;
}

/** Visitor id follows consent: created on accept, deleted on withdrawal. */
function syncConsent() {
  const accepted = !GPC && bannerState() === "granted";
  if (accepted && !visitor) {
    visitor = get("localStorage", VISITOR_KEY) || randomId();
    put("localStorage", VISITOR_KEY, visitor);
    if (session) {
      put("sessionStorage", SESSION_KEY, null);
      saveSession();
    }
  } else if (!accepted && (visitor || get("localStorage", VISITOR_KEY))) {
    visitor = null;
    put("localStorage", VISITOR_KEY, null);
    put("localStorage", SESSION_KEY, null);
    if (session) saveSession();
  }
}

/** The current session, or a new one if the last activity was too long ago. */
function currentSession() {
  const now = Date.now();
  const shared = loadSession();
  if (shared && (!session || shared.id === session.id || shared.t > session.t)) session = shared;
  const fresh = !session || now - session.t > IDLE_MS;
  if (fresh) session = { id: randomId(), t: now };
  session.t = now;
  saveSession();
  return fresh;
}

function send(events) {
  if (!events.length || !session) return;
  const c = bannerState();
  // A choice made in another tab, or one the banner did not announce.
  if (!allowed(c)) return halt();
  const now = Date.now();
  const body = JSON.stringify({
    v: 1,
    sid: session.id,
    vid: visitor || undefined,
    c,
    e: events.map(({ at, ...event }) => ({ ...event, dt: now - at })),
  });
  if (!navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "text/plain" }))) {
    fetch(ENDPOINT, { method: "POST", body, keepalive: true, credentials: "omit" }).catch(() => {});
  }
}

function flush() {
  clearTimeout(timer);
  timer = 0;
  const events = queue;
  queue = [];
  send(events);
}

/** Queues an event for the current view. q numbers it within the view, so a resent one is ignored. */
function record(event, urgent) {
  if (!measuring || !pageview) return;
  queue.push({ ...event, p: pageview.path, pv: pageview.id, q: ++pageview.q, at: Date.now() });
  if (urgent || queue.length >= 20) flush();
  else if (!timer) timer = setTimeout(flush, 5000);
}

function campaign() {
  const params = new URLSearchParams(location.search);
  const parts = ["utm_source", "utm_medium", "utm_campaign"].map((k) => params.get(k)?.trim()).filter(Boolean);
  if (parts.length) return parts.join(" / ").slice(0, 100);
  return params.get("ref")?.trim().slice(0, 100) || undefined;
}

function externalReferrer() {
  try {
    if (!document.referrer) return undefined;
    const host = new URL(document.referrer).hostname.replace(/^www\./, "");
    return host && host !== location.hostname ? host : undefined;
  } catch {
    return undefined;
  }
}

function navigationType() {
  try {
    return performance.getEntriesByType("navigation")[0]?.type || "navigate";
  } catch {
    return "navigate";
  }
}

function startPageview(nav) {
  pageview = {
    id: randomId(),
    path: location.pathname,
    q: 0,
    active: 0,
    flushedActive: 0,
    clicks: 0,
    flushedClicks: 0,
    scroll: 0,
    flushedScroll: 0,
    engaged: false,
    impressions: new Set(),
    errors: 0,
  };
  lastInput = lastTick = performance.now();
  measureScroll();
  record({ t: "view", nav, r: externalReferrer(), u: campaign() }, true);
  observeImpressions();
}

/** Once per view: it reached 10 s in use, or was clicked. Rides the next beacon. */
function markEngaged() {
  if (!pageview || pageview.engaged) return;
  pageview.engaged = true;
  record({ t: "engaged" });
}

/** Called on every input: keeps the page "being read" and the session alive. */
function activity() {
  lastInput = performance.now();
  if (!measuring) return;
  if (session && Date.now() - session.t > IDLE_MS) {
    // Another tab may have kept the same session alive meanwhile.
    const shared = loadSession();
    if (shared && shared.id === session.id && shared.t > session.t) session.t = shared.t;
  }
  if (session && Date.now() - session.t > IDLE_MS) {
    // Came back to a tab left open past the idle limit: that is a new session,
    // and it starts on this page.
    leave();
    currentSession();
    startPageview("resume");
  } else if (session && Date.now() - session.t > 10_000) {
    session.t = Date.now();
    saveSession();
  }
}

function tick() {
  const now = performance.now();
  if (pageview && document.visibilityState === "visible" && now - lastInput < READING_MS) {
    pageview.active += Math.min(now - lastTick, 2000);
    if (pageview.active >= ENGAGED_MS) markEngaged();
  }
  lastTick = now;
}

function measureScroll() {
  if (!pageview) return;
  const doc = document.documentElement;
  const height = Math.max(doc.scrollHeight, 1);
  const seen = Math.min(100, Math.round(((window.scrollY + window.innerHeight) / height) * 100));
  if (seen > pageview.scroll) pageview.scroll = seen;
}

/** The page was hidden: report time, clicks and scroll since the last report, if there is any. */
function leave() {
  if (!pageview) return;
  tick();
  const ms = Math.round(pageview.active - pageview.flushedActive);
  const c = pageview.clicks - pageview.flushedClicks;
  if (ms >= 1000 || c > 0 || pageview.scroll > pageview.flushedScroll) {
    pageview.flushedActive = pageview.active;
    pageview.flushedClicks = pageview.clicks;
    pageview.flushedScroll = pageview.scroll;
    queue.push({ t: "leave", p: pageview.path, pv: pageview.id, q: ++pageview.q, ms, n: pageview.scroll, c, at: Date.now() });
  }
  flush();
}

// ─── Placements: data-impression="name" counts once per view when half on screen for a second ───

let impressionObserver = null;
const impressionTimers = new Map();

function stopImpressions() {
  impressionObserver?.disconnect();
  impressionObserver = null;
  impressionTimers.forEach((t) => clearTimeout(t));
  impressionTimers.clear();
}

function observeImpressions() {
  if (!("IntersectionObserver" in window)) return;
  stopImpressions();
  impressionObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const el = entry.target;
        const name = el.getAttribute("data-impression");
        const visible =
          entry.isIntersecting &&
          (entry.intersectionRatio >= 0.5 || entry.intersectionRect.height >= window.innerHeight * 0.5);
        if (visible && !impressionTimers.has(el)) {
          impressionTimers.set(
            el,
            setTimeout(() => {
              impressionObserver?.unobserve(el);
              if (!name || !pageview || pageview.impressions.has(name)) return;
              pageview.impressions.add(name);
              record({ t: "impr", tp: name.slice(0, 120) });
            }, 1000),
          );
        } else if (!visible && impressionTimers.has(el)) {
          clearTimeout(impressionTimers.get(el));
          impressionTimers.delete(el);
        }
      }
    },
    { threshold: [0, 0.25, 0.5, 0.75, 1] },
  );
  document.querySelectorAll("[data-impression]").forEach((el) => impressionObserver.observe(el));
}

// ─── Clicks ───

function onClick(event) {
  if (event.type === "auxclick" && event.button !== 1) return;
  const target = event.target instanceof Element ? event.target : null;
  const el = target?.closest("a, button, summary, [role='button'], input, select, label");
  if (!el || !pageview) return;
  pageview.clicks += 1;
  activity();
  markEngaged();
  if (!(el instanceof HTMLAnchorElement) || !el.href) return;

  let url;
  try {
    url = new URL(el.href, location.href);
  } catch {
    return;
  }
  const placement = el.closest("[data-impression]")?.getAttribute("data-impression") || undefined;
  const page = (u) => (u.hostname.replace(/^www\./, "") + u.pathname).replace(/\/$/, "").slice(0, 200);
  let kind;
  let item;
  let tp = placement;
  if (el.dataset.netdrill) {
    kind = "netdrill";
    item = el.dataset.netdrill;
    tp = placement || `netdrill:${el.dataset.netdrillFrom || "page"}`;
  } else if (el.dataset.affiliateProvider || /\bsponsored\b/.test(el.rel)) {
    kind = "affiliate";
    item = el.dataset.affiliateProvider ? `${el.dataset.affiliateProvider} · ${page(url)}` : page(url);
  } else if (/^https?:$/.test(url.protocol) && url.origin !== location.origin) {
    kind = "outbound";
    item = page(url);
  } else if (placement && url.origin === location.origin) {
    kind = "internal";
    item = url.pathname;
  } else {
    return;
  }
  record({ t: "click", k: kind, i: item, tp }, true);
}

// ─── Search (SearchModal reports what was searched for) ───

let lastSearch = "";

/** query: what was typed; results: how many matched; picked: the result opened, if any. */
export function trackSearch(query, results, picked) {
  if (!measuring) return;
  const q = String(query || "").trim().toLowerCase().replace(/\s+/g, " ").slice(0, 80);
  if (!q || (!picked && q === lastSearch)) return;
  lastSearch = q;
  record({ t: "search", i: q, n: results, k: picked ? "picked" : "no-pick", tp: picked || undefined }, true);
}

// ─── Errors ───

function onError(message, source) {
  if (!pageview || pageview.errors >= 5 || !message || message === "Script error.") return;
  if (source && !/^https?:\/\/(certblueprint\.com|localhost|127\.0\.0\.1)/.test(source)) return; // extensions, ad scripts
  pageview.errors += 1;
  const where = source ? ` @ ${source.replace(/^https?:\/\/[^/]+/, "").split("?")[0]}` : "";
  record({ t: "error", i: `${message}${where}`.slice(0, 200) });
}

// ─── Start and stop ───

function wire() {
  if (wired) return;
  wired = true;
  setInterval(tick, 1000);
  for (const type of ["pointerdown", "pointermove", "keydown", "wheel", "touchstart"]) {
    addEventListener(type, activity, { passive: true, capture: true });
  }
  addEventListener(
    "scroll",
    () => {
      activity();
      measureScroll();
    },
    { passive: true },
  );
  document.addEventListener("click", onClick, true);
  document.addEventListener("auxclick", onClick, true);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") leave();
    else activity();
  });
  addEventListener("pagehide", leave);
  addEventListener("error", (event) => onError(event.message, event.filename));
  addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    onError(reason instanceof Error ? reason.message : typeof reason === "string" ? reason : "", location.href);
  });
}

function begin(nav) {
  // The owner's own browsers, switched off on /command/.
  if (get("localStorage", OFF_KEY) === "1") return;
  measuring = true;
  wire();
  syncConsent();
  currentSession();
  startPageview(nav);
}

/** Not allowed (any more): stop, drop what is queued, and delete what was stored. */
function halt() {
  measuring = false;
  clearTimeout(timer);
  timer = 0;
  queue = [];
  pageview = null;
  session = null;
  visitor = null;
  stopImpressions();
  put("sessionStorage", SESSION_KEY, null);
  put("localStorage", SESSION_KEY, null);
  put("localStorage", VISITOR_KEY, null);
}

/** Runs at start and on every banner event: measure, keep measuring, or stop. */
function evaluate() {
  const ok = allowed(bannerState());
  if (ok && !measuring) begin(navigationType());
  else if (ok) syncConsent();
  else halt();
}

function start() {
  evaluate();
  document.addEventListener("cookieyes_consent_update", evaluate);
  document.addEventListener("cookieyes_banner_load", evaluate);
  addEventListener("pageshow", (event) => {
    // Restored from the back/forward cache: the scripts did not run again, but it is a new view.
    if (!event.persisted) return;
    if (!allowed(bannerState())) return halt();
    if (!measuring) return begin("back_forward");
    currentSession();
    startPageview("back_forward");
  });
}

function safeStart() {
  try {
    start();
  } catch {
    /* telemetry must never break the page it measures */
  }
}

if (enabled) {
  if (document.prerendering) document.addEventListener("prerenderingchange", safeStart, { once: true });
  else safeStart();
}
