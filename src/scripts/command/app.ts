// The command center: signs in with the owner's key, asks the Worker for one
// range of numbers (/api/command/query), and draws them. Nothing here is cached
// anywhere but this tab, and the key never leaves the browser except as the
// Authorization header to this site's own API.

import { barList, columnChart, heatmap, lineChart, tableView, type BarRow, type Series } from './charts';
import { fmt, h, sum, type Child } from './dom';

type Row = Record<string, any>;
type Site = 'cb' | 'nd';
interface Labels {
  pages: Record<string, string>;
  topics: Record<string, string>;
  nd: Record<string, [string, string]>;
}
interface Payload {
  generated: number;
  range: string;
  site: 'all' | Site;
  /** Whether data-centre sessions are included. */
  dc: boolean;
  start: number;
  bucket: number;
  tz: number;
  retentionDays: number;
  rowsRead: number;
  here?: Here | null;
  data: Record<string, Row[]>;
}
/** The network this dashboard is being viewed from, as the Worker sees it. */
interface Here {
  display: string;
  excluded: boolean;
  org: string | null;
}
interface Networks {
  here: Here | null;
  networks: { key: string; display: string; label: string | null; org: string | null; added_ts: number; last_seen_ts: number | null }[];
  /** What the last "add" saved. */
  added?: string[];
}

const SITES: Record<Site, { label: string; color: string }> = {
  cb: { label: 'CertBlueprint', color: 'var(--s-cb)' },
  nd: { label: 'NetDrill', color: 'var(--s-nd)' },
};
const RANGES: Record<string, string> = { '24h': 'last 24 hours', '7d': 'last 7 days', '30d': 'last 30 days', '90d': 'last 90 days', '365d': 'last 12 months' };
const KEY_STORE = 'cc:key';
const DAY_MS = 86_400_000;
const OFF_KEY = 'cb:t:off';

const labels: Labels = JSON.parse(document.getElementById('cc-labels')?.textContent || '{"pages":{},"topics":{},"nd":{}}');
const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

const state = {
  range: '7d',
  site: 'all' as 'all' | Site,
  /** Include sessions from data-centre networks (off: most of them are scripts). */
  dc: false,
  key: '',
  payload: null as Payload | null,
  networks: null as Networks | null,
  loading: false,
  timer: 0,
};

// ─── Key storage: this tab by default, this device if asked ───

function storedKey() {
  try {
    return sessionStorage.getItem(KEY_STORE) || localStorage.getItem(KEY_STORE) || '';
  } catch {
    return '';
  }
}
function storeKey(key: string, remember: boolean) {
  try {
    sessionStorage.setItem(KEY_STORE, key);
    if (remember) localStorage.setItem(KEY_STORE, key);
    else localStorage.removeItem(KEY_STORE);
  } catch {
    /* private mode: the key lives in memory for this page */
  }
}
function forgetKey() {
  try {
    sessionStorage.removeItem(KEY_STORE);
    localStorage.removeItem(KEY_STORE);
  } catch {
    /* nothing stored */
  }
}

async function sha256(text: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function newKey() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return 'cbk_' + btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// ─── API ───

class Unauthorized extends Error {}

async function api(path: string, body: unknown) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { authorization: `Bearer ${state.key}`, 'content-type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  if (res.status === 401) throw new Unauthorized();
  if (!res.ok) throw new Error(`${path} answered ${res.status}`);
  return res.json();
}

// ─── Gate: sign in, or make a key ───

function copyButton(text: string) {
  const button = h('button', { type: 'button', class: 'cc-btn cc-btn-quiet' }, 'Copy');
  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(text);
      button.textContent = 'Copied';
    } catch {
      button.textContent = 'Select and copy';
    }
    setTimeout(() => (button.textContent = 'Copy'), 2000);
  });
  return button;
}

function keyMaker(intro: string) {
  const out = h('div', { class: 'cc-keymaker' });
  const make = h('button', { type: 'button', class: 'cc-btn cc-btn-primary' }, 'Make a key');
  make.addEventListener('click', async () => {
    const key = newKey();
    const print = await sha256(key);
    out.replaceChildren(
      h('div', { class: 'cc-secret' },
        h('p', { class: 'cc-label' }, 'Your key: keep it secret'),
        h('div', { class: 'cc-copyline' }, h('code', null, key), copyButton(key)),
        h('p', { class: 'cc-hint' }, 'Save it in your password manager now. This page shows it once and stores it nowhere. Never paste it into a chat or a file.'),
      ),
      h('div', { class: 'cc-secret' },
        h('p', { class: 'cc-label' }, 'Its fingerprint: safe to share'),
        h('div', { class: 'cc-copyline' }, h('code', null, print), copyButton(print)),
        h('p', { class: 'cc-hint' }, 'Send this to Claude to switch the key on. The fingerprint cannot unlock anything; it only lets the server recognise the key. It goes into wrangler.toml as COMMAND_KEY_HASH, and the old key stops working when that deploys.'),
      ),
      h('p', { class: 'cc-hint' }, 'Once that deploy is live (a minute or two), sign in here with the key.'),
    );
  });
  out.append(h('p', { class: 'cc-hint' }, intro), make);
  return out;
}

async function showGate(message?: string) {
  $('cc-board').hidden = true;
  const gate = $('cc-gate');
  gate.hidden = false;
  let status = { database: false, key: false };
  try {
    status = await (await fetch('/api/command/status', { cache: 'no-store' })).json();
  } catch {
    /* shown as not set up */
  }

  const form = h('form', { class: 'cc-signin', autocomplete: 'on' });
  const user = h('input', { type: 'text', name: 'username', autocomplete: 'username', value: 'CertBlueprint command center', class: 'sr-only', tabindex: -1, 'aria-hidden': 'true', readonly: true });
  const input = h('input', { type: 'password', name: 'password', autocomplete: 'current-password', required: true, spellcheck: 'false', id: 'cc-key', placeholder: 'cbk_…' });
  const remember = h('input', { type: 'checkbox', id: 'cc-remember' });
  const error = h('p', { class: 'cc-error', role: 'alert' }, message ?? '');
  form.append(
    user,
    h('label', { for: 'cc-key', class: 'cc-label' }, 'Your key'),
    h('div', { class: 'cc-row' }, input, h('button', { type: 'submit', class: 'cc-btn cc-btn-primary' }, 'Unlock')),
    h('label', { class: 'cc-check' }, remember, ' Remember on this device'),
    error,
  );
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    state.key = input.value.trim();
    error.textContent = '';
    try {
      await load();
      storeKey(state.key, remember.checked);
      openBoard();
    } catch (err) {
      state.key = '';
      error.textContent = err instanceof Unauthorized ? 'That key does not match.' : `Could not load: ${(err as Error).message}`;
    }
  });

  const lost = h('details', { class: 'cc-lost' }, h('summary', null, 'Lost the key?'), keyMaker('Make a new one and send its fingerprint to Claude. When it deploys, the old key stops working everywhere.'));

  gate.replaceChildren(
    h('div', { class: 'cc-gate-card' },
      h('h1', null, 'Command center'),
      h('p', { class: 'cc-sub' }, 'Private usage numbers for certblueprint.com and NetDrill.'),
      status.key ? form : h('div', { class: 'cc-stack' },
        h('h2', null, 'Set up your key'),
        keyMaker('The key is made here, in your browser. Only you will ever see it.'),
        h('p', { class: 'cc-hint' }, 'Already have a key and sent its fingerprint? The deploy is not live yet: give it a minute and reload.'),
      ),
      status.key ? lost : null,
      h('p', { class: 'cc-status' },
        h('span', { class: `cc-pill ${status.database ? 'is-good' : 'is-warn'}` }, status.database ? '✓ Database connected' : '! Database not connected yet'),
        h('span', { class: `cc-pill ${status.key ? 'is-good' : 'is-warn'}` }, status.key ? '✓ Key set' : '! No key set'),
      ),
    ),
  );
  if (status.key) input.focus();
}

function openBoard() {
  $('cc-gate').hidden = true;
  $('cc-board').hidden = false;
  renderDevices();
  render();
  loadNetworks().catch((err) => renderDevices(`Could not load your networks: ${(err as Error).message}`));
}

// ─── Loading ───

async function load() {
  state.loading = true;
  $('cc-board').classList.add('is-loading');
  try {
    state.payload = (await api('/api/command/query', { range: state.range, site: state.site === 'all' ? undefined : state.site, dc: state.dc, tz: new Date().getTimezoneOffset() })) as Payload;
  } finally {
    state.loading = false;
    $('cc-board').classList.remove('is-loading');
  }
}

async function refresh() {
  try {
    await load();
    render();
  } catch (err) {
    if (err instanceof Unauthorized) {
      forgetKey();
      state.key = '';
      showGate('That key no longer works. It may have been replaced.');
    } else {
      $('cc-updated').textContent = `Could not refresh: ${(err as Error).message}`;
    }
  }
}

// ─── Labels ───

const siteOf = (s: string): Site => (s === 'nd' ? 'nd' : 'cb');
const siteColor = (s: string) => SITES[siteOf(s)].color;
const siteLabel = (s: string) => SITES[siteOf(s)].label;

function pageLabel(path: string | null | undefined) {
  if (!path) return '(unknown)';
  return labels.pages[path] ?? labels.pages[path.endsWith('/') ? path : path + '/'] ?? path;
}
function ndLabel(id: string | null | undefined) {
  if (!id || id === '/' || id === 'home') return 'NetDrill home';
  return labels.nd[id]?.[0] ?? id;
}
function placeLabel(site: string, place: string | null | undefined) {
  return site === 'nd' ? ndLabel(place) : pageLabel(place);
}
const TOPIC_KINDS: Record<string, string> = { cert: 'Cert', vendor: 'Vendor', path: 'Career path', role: 'Role', field: 'Field', compare: 'Compare', plan: 'Plan', navigator: 'Navigator' };
function topicLabel(key: string | null | undefined) {
  if (!key) return '(none)';
  if (labels.topics[key]) return labels.topics[key];
  const [kind, slug] = key.split(':');
  if (!slug) return kind.charAt(0).toUpperCase() + kind.slice(1);
  return `${TOPIC_KINDS[kind] ?? kind} · ${slug.replace(/-/g, ' ')}`;
}
function placementLabel(p: string) {
  const [kind, where] = p.split(':');
  const WHERE: Record<string, string> = {
    header: 'header button (every page)',
    footer: 'footer link',
    'cert-guide': 'practice labs on cert guides',
    role: 'practice list on role pages',
    path: 'practice box on career paths',
    trial: 'weekend trials',
    technology: 'technologies page',
    page: 'other pages',
  };
  if (kind === 'netdrill') return `NetDrill · ${WHERE[where] ?? where}`;
  if (kind === 'affiliate') return `Affiliate · ${where}`;
  return p;
}
const regionNames = (() => {
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' });
  } catch {
    return null;
  }
})();
function country(code: string | null) {
  if (!code || code === 'XX' || code === 'T1') return 'Unknown';
  try {
    return regionNames?.of(code) ?? code;
  } catch {
    return code;
  }
}

const KINDS: Record<string, string> = { netdrill: 'NetDrill', affiliate: 'Affiliate', outbound: 'Other site', internal: 'On this site' };

// ─── Building blocks ───

function card(title: string, sub?: string, ...body: Child[]) {
  return h('section', { class: 'cc-card' }, h('header', null, h('h2', null, title), sub ? h('p', null, sub) : null), ...body);
}

function legend(sites: Site[], mark: 'line' | 'rect') {
  if (sites.length < 2) return null;
  return h('div', { class: 'cc-legend' }, sites.map((s) => h('span', null, h('span', { class: `cc-key cc-key-${mark}`, style: `background:${SITES[s].color}` }), SITES[s].label)));
}

interface Col<T> {
  label: string;
  num?: boolean;
  value: (r: T) => Child;
  bar?: (r: T) => { value: number; color: string }[];
  title?: string;
}

function table<T extends Row>(cols: Col<T>[], rows: T[], empty = 'Nothing yet in this range.', onRow?: (r: T, tr: HTMLTableRowElement) => void, limit = 10) {
  if (rows.length === 0) return h('p', { class: 'cc-empty' }, empty);
  const maxes = cols.map((c) => (c.bar ? Math.max(1, ...rows.map((r) => sum(c.bar!(r), (p) => p.value))) : 1));
  return h(
    'div',
    { class: `cc-scroll${rows.length > limit ? ' cc-limited' : ''}` },
    h(
      'table',
      { class: 'cc-table' },
      h('thead', null, h('tr', null, cols.map((c) => h('th', { class: c.num ? 'num' : '', title: c.title }, c.label)))),
      h(
        'tbody',
        null,
        rows.map((r, n) => {
          const tr = h(
            'tr',
            n >= limit ? { class: 'cc-extra' } : null,
            cols.map((c, i) => {
              const value = c.value(r);
              if (!c.bar) return h('td', { class: c.num ? 'num' : '' }, value);
              const parts = c.bar(r).filter((p) => p.value > 0);
              return h(
                'td',
                { class: 'num' },
                h('div', { class: 'cc-barcell' },
                  h('span', { class: 'cc-cellbar' }, parts.map((p, k) => h('span', { class: `cc-seg${k === parts.length - 1 ? ' cc-seg-end' : ''}`, style: `width:${(p.value / maxes[i]) * 100}%;background:${p.color}` }))),
                  h('span', null, value),
                ),
              );
            }),
          );
          onRow?.(r, tr);
          return tr;
        }),
      ),
    ),
    rows.length > limit ? moreButton(rows.length) : null,
  );
}

/** Long tables show their top rows; the rest are a click away, not a scroll away. */
function moreButton(count: number) {
  const button = h('button', { type: 'button', class: 'cc-btn cc-btn-quiet cc-more' }, `Show all ${count}`);
  button.addEventListener('click', () => {
    const open = button.parentElement!.classList.toggle('is-open');
    button.textContent = open ? 'Show fewer' : `Show all ${count}`;
  });
  return button;
}

function delta(now: number, before: number, opts: { upIsGood?: boolean; points?: boolean; period: string }) {
  if (!Number.isFinite(now) || !Number.isFinite(before) || (!opts.points && before === 0)) {
    return h('p', { class: 'cc-delta' }, `no data for the previous ${opts.period}`);
  }
  const change = opts.points ? (now - before) * 100 : ((now - before) / before) * 100;
  if (Math.abs(change) < 0.5) return h('p', { class: 'cc-delta' }, `→ flat vs previous ${opts.period}`);
  const up = change > 0;
  const good = up === (opts.upIsGood ?? true);
  const amount = opts.points ? `${Math.abs(change).toFixed(1)} pts` : `${Math.abs(change) >= 10 ? Math.round(Math.abs(change)) : Math.abs(change).toFixed(1)}%`;
  return h('p', { class: `cc-delta ${good ? 'is-good' : 'is-bad'}` }, h('span', { 'aria-hidden': 'true' }, up ? '▲ ' : '▼ '), `${up ? 'up' : 'down'} ${amount}`, h('span', { class: 'cc-delta-vs' }, ` vs previous ${opts.period}`));
}

function tile(label: string, value: string, deltaEl: Node | null, note?: string) {
  return h('div', { class: 'cc-tile' }, h('p', { class: 'cc-tile-label' }, label), h('p', { class: 'cc-tile-value' }, value), deltaEl, note ? h('p', { class: 'cc-tile-note' }, note) : null);
}

// ─── Totals ───

interface Totals {
  sessions: number;
  /** Recognised visitors (a visitor id), summed over sites only where a site is shown alone. */
  visitors: number;
  /** Sessions without a visitor id. */
  anon: number;
  views: number;
  reloads: number;
  opens: number;
  bounces: number;
  clicked: number;
  active: number;
  span: number;
  consented: number;
}
function totals(rows: Row[] = []): Totals {
  return {
    sessions: sum(rows, (r) => r.sessions),
    visitors: sum(rows, (r) => r.visitors),
    anon: sum(rows, (r) => r.anon),
    views: sum(rows, (r) => r.views),
    reloads: sum(rows, (r) => r.reloads),
    opens: sum(rows, (r) => r.opens),
    bounces: sum(rows, (r) => r.bounces),
    clicked: sum(rows, (r) => r.clicked),
    active: sum(rows, (r) => r.active_ms),
    span: sum(rows, (r) => r.span_ms),
    consented: sum(rows, (r) => r.consented),
  };
}
const ratio = (a: number, b: number) => (b > 0 ? a / b : NaN);

// ─── Render ───

function render() {
  const p = state.payload;
  if (!p) return;
  const d = p.data;
  const sites: Site[] = p.site === 'all' ? ['cb', 'nd'] : [p.site];
  const period = RANGES[p.range] ?? p.range;
  const prevPeriod = period.replace('last ', '');
  const t = totals(d.totals);
  const prev = totals(d.previous);

  document.querySelectorAll<HTMLButtonElement>('[data-range]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.range === state.range)));
  document.querySelectorAll<HTMLButtonElement>('[data-site]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.site === state.site)));
  document.querySelectorAll<HTMLButtonElement>('[data-dc]').forEach((b) => b.setAttribute('aria-pressed', String((b.dataset.dc === '1') === state.dc)));
  $('cc-updated').textContent = `Updated ${fmt.time(p.generated)}`;
  const live = d.live ?? [];
  $('cc-live-pill').textContent = `${live.length} on now`;
  netPill(p.here ?? state.networks?.here ?? null);

  const sections: Node[] = [];

  // Right now
  sections.push(
    card('Right now', 'Sessions with activity in the last 5 minutes.',
      live.length === 0
        ? h('p', { class: 'cc-empty' }, 'Nobody on the sites this minute.')
        : h('ul', { class: 'cc-live' }, live.map((s) => h('li', null,
            h('span', { class: 'cc-key cc-key-rect', style: `background:${siteColor(s.site)}`, title: siteLabel(s.site) }),
            h('span', { class: 'cc-live-where' }, placeLabel(s.site, s.exit)),
            h('span', { class: 'cc-live-meta' }, `${siteLabel(s.site)} · ${country(s.country)} · ${s.device ?? ''} · ${s.views} view${s.views === 1 ? '' : 's'}${s.opens ? ` · ${s.opens} lab${s.opens === 1 ? '' : 's'}` : ''} · ${fmt.ago(s.last_ts, p.generated)}`),
          ))),
    ),
  );

  // Headline numbers. Recognised visitors are people with a visitor id, which
  // exists only with consent. They are never added across the two sites (one
  // person on both would count twice), and sessions without an id are counted
  // beside them, never as people.
  const returning = d.returning ?? [];
  const visitorsOf = (rows: Row[] | undefined, s: Site) => Number((rows ?? []).find((r) => r.site === s)?.visitors) || 0;
  const cbShown = sites.includes('cb');
  const cbBack = returning.find((r) => r.site === 'cb') ?? {};
  const known = Number(cbBack.visitors) || 0;
  const back = Number(cbBack.came_back) || 0;
  const ndBack = d.ndReturning?.[0] ?? { sessions: 0, returning_sessions: 0 };
  const hiddenDc = sum(d.hidden ?? [], (r) => r.n);
  sections.push(
    h('section', { class: 'cc-headline' },
      h('div', { class: 'cc-hero' },
        h('p', { class: 'cc-tile-label' }, `Recognised visitors${sites.length > 1 ? ' on certblueprint.com' : ''}, ${period}`),
        h('p', { class: 'cc-hero-value' }, cbShown ? fmt.int(visitorsOf(d.totals, 'cb')) : '–'),
        cbShown ? delta(visitorsOf(d.totals, 'cb'), visitorsOf(d.previous, 'cb'), { period: prevPeriod }) : null,
        h('p', { class: 'cc-tile-note' }, cbShown
          ? 'People who accepted analytics cookies, each counted once. NetDrill has no visitor id, so it has no figure here.'
          : 'NetDrill has no visitor id: it counts sessions, never people.'),
        h('div', { class: 'cc-hero-side' },
          h('p', { class: 'cc-tile-label' }, 'Sessions without an id'),
          h('p', { class: 'cc-tile-value' }, fmt.int(t.anon)),
          h('p', { class: 'cc-tile-note' }, `${fmt.pct(ratio(t.anon, t.sessions))} of sessions${sites.length > 1 ? ' on the two sites' : ''}. Counted beside the visitors above, not added to them.`),
        ),
      ),
      h('div', { class: 'cc-tiles' },
        tile('Sessions', fmt.int(t.sessions), delta(t.sessions, prev.sessions, { period: prevPeriod }), !state.dc && hiddenDc ? `${fmt.int(hiddenDc)} from data centres left out` : undefined),
        tile(sites.includes('nd') && !sites.includes('cb') ? 'App loads' : 'Views', fmt.int(t.views), delta(t.views, prev.views, { period: prevPeriod }), sites.length > 1 ? 'Page views plus NetDrill app loads' : undefined),
        tile('Views per session', fmt.dec(ratio(t.views, t.sessions)), delta(ratio(t.views, t.sessions), ratio(prev.views, prev.sessions), { period: prevPeriod })),
        tile('Bounce rate', fmt.pct(ratio(t.bounces, t.sessions)), delta(ratio(t.bounces, t.sessions), ratio(prev.bounces, prev.sessions), { period: prevPeriod, points: true, upIsGood: false }), 'One view, no click, under 10 s in use'),
        tile('Engaged time per session', fmt.duration(ratio(t.active, t.sessions)), delta(ratio(t.active, t.sessions), ratio(prev.active, prev.sessions), { period: prevPeriod }), 'Page visible and in use'),
        tile('Session length', fmt.duration(ratio(t.span, t.sessions)), delta(ratio(t.span, t.sessions), ratio(prev.span, prev.sessions), { period: prevPeriod }), 'First to last activity, idle included'),
        tile('Click rate', fmt.pct(ratio(t.clicked, t.sessions)), delta(ratio(t.clicked, t.sessions), ratio(prev.clicked, prev.sessions), { period: prevPeriod, points: true }), 'Sessions with at least one click'),
        tile('Reloads', fmt.int(t.reloads), delta(t.reloads, prev.reloads, { period: prevPeriod, upIsGood: false }), `${fmt.pct(ratio(t.reloads, t.views))} of views were a refresh`),
        cbShown ? tile('Returning visitors', known ? fmt.pct(back / known) : '–', null, known ? `${fmt.int(back)} of ${fmt.int(known)} recognised visitors made a return visit` : 'Needs visitors who accepted analytics cookies') : null,
        sites.includes('nd') ? tile('NetDrill labs opened', fmt.int(t.opens), delta(t.opens, prev.opens, { period: prevPeriod })) : null,
        sites.includes('nd') && ndBack.sessions ? tile('NetDrill returning sessions', fmt.pct(ndBack.returning_sessions / ndBack.sessions), null, 'From a browser that had used NetDrill before') : null,
      ),
    ),
  );

  // Traffic over time
  const tz = p.tz;
  const firstB = Math.floor((p.start + tz) / p.bucket);
  const lastB = Math.floor((p.generated + tz) / p.bucket);
  const buckets = Array.from({ length: lastB - firstB + 1 }, (_, i) => firstB + i);
  const xs = buckets.map((b) => b * p.bucket - tz);
  const hourly = p.bucket < 86_400_000;
  const xTick = (x: number) => (hourly ? new Date(x).toLocaleTimeString('en-US', { hour: 'numeric' }) : new Date(x).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
  const xTitle = (x: number) =>
    hourly
      ? `${new Date(x).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}, ${new Date(x).toLocaleTimeString('en-US', { hour: 'numeric' })}`
      : new Date(x).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const seriesFor = (metric: 'visitors' | 'sessions' | 'views'): Series[] =>
    sites.map((s) => {
      const byB = new Map((d.series ?? []).filter((r) => r.site === s).map((r) => [r.b, Number(r[metric]) || 0]));
      return { key: s, label: SITES[s].label, color: SITES[s].color, values: buckets.map((b) => byB.get(b) ?? 0) };
    });
  const sessionsChart = h('div', { class: 'cc-chart' });
  const visitorsChart = h('div', { class: 'cc-chart' });
  const viewsChart = h('div', { class: 'cc-chart' });
  const vis = seriesFor('visitors');
  const ses = seriesFor('sessions');
  const vws = seriesFor('views');
  sections.push(
    card(hourly ? 'Sessions by hour' : 'Sessions by day', `Your local time. ${sites.length > 1 ? 'One line per site.' : ''}`,
      legend(sites, 'line'),
      sessionsChart,
      h('div', { class: 'cc-multiples' },
        h('div', null, h('h3', null, 'Recognised visitors'), visitorsChart),
        h('div', null, h('h3', null, sites.length === 1 && sites[0] === 'nd' ? 'App loads' : 'Views'), viewsChart),
      ),
      tableView(
        ['When', ...sites.flatMap((s) => [`${SITES[s].label} sessions`, `${SITES[s].label} recognised visitors`, `${SITES[s].label} views`])],
        xs.map((x, i) => [xTitle(x), ...sites.flatMap((_, k) => [ses[k].values[i], vis[k].values[i], vws[k].values[i]])]),
      ),
    ),
  );

  // When and how long
  const grid = Array.from({ length: 7 }, () => Array(24).fill(0));
  for (const r of d.heat ?? []) grid[r.d][r.h] += r.n;
  const heatHost = h('div', { class: 'cc-chart' });
  const LENGTHS = ['<10s', '10–30s', '30s–1m', '1–3m', '3–10m', '10–30m', '30m+'];
  const lengthSeries: Series[] = sites.map((s) => ({
    key: s,
    label: SITES[s].label,
    color: SITES[s].color,
    values: LENGTHS.map((_, k) => sum((d.lengths ?? []).filter((r) => r.site === s && r.k === k), (r) => r.n)),
  }));
  const lengthHost = h('div', { class: 'cc-chart' });
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  sections.push(
    h('div', { class: 'cc-grid' },
      card('When people come', 'Sessions started, by weekday and hour, your local time.', heatHost,
        tableView(['Day', ...Array.from({ length: 24 }, (_, i) => `${i}h`)], [1, 2, 3, 4, 5, 6, 0].map((day) => [DAYS[day], ...grid[day]]))),
      card('How long sessions last', 'Engaged time per session: the page visible and in use.', legend(sites, 'rect'), lengthHost,
        tableView(['Engaged time', ...sites.map((s) => SITES[s].label)], LENGTHS.map((l, k) => [l, ...lengthSeries.map((s) => s.values[k])]))),
    ),
  );

  // Coming back: recognised visitors only. A return visit is a session that
  // starts more than 30 minutes after the visitor's last activity.
  const FREQ = ['1', '2', '3–5', '6–10', '11+'];
  const GAPS = ['under a day', '1–3 days', '3–7 days', '1–4 weeks', '30+ days'];
  // Visitor ids exist only on certblueprint.com (NetDrill has no consent banner), so these charts are its alone.
  const backSites = sites.filter((s) => s === 'cb');
  const freqSeries: Series[] = backSites.map((s) => {
    const r = returning.find((x) => x.site === s) ?? {};
    return { key: s, label: SITES[s].label, color: SITES[s].color, values: ['f1', 'f2', 'f3', 'f6', 'f11'].map((k) => Number(r[k]) || 0) };
  });
  const gapSeries: Series[] = backSites.map((s) => {
    const r = (d.gaps ?? []).find((x) => x.site === s) ?? {};
    return { key: s, label: SITES[s].label, color: SITES[s].color, values: ['g0', 'g1', 'g3', 'g7', 'g30'].map((k) => Number(r[k]) || 0) };
  });
  const freqHost = h('div', { class: 'cc-chart' });
  const gapHost = h('div', { class: 'cc-chart' });
  sections.push(
    card('Coming back', `Recognised visitors only: ${fmt.int(known)} in this range, ${fmt.int(back)} of them made a return visit. A return visit starts more than 30 minutes after their last activity, so a second tab is not one.`,
      sites.includes('nd') && ndBack.sessions
        ? h('p', { class: 'cc-hint' }, `NetDrill has no visitor id. ${fmt.pct(ndBack.returning_sessions / ndBack.sessions)} of its ${fmt.int(ndBack.sessions)} sessions came from a browser that had used NetDrill before, read from the progress NetDrill saves for the learner. Its labs table shows the same per lab.`)
        : null,
      known === 0
        ? h('p', { class: 'cc-empty' }, 'No recognised visitors in this range yet.')
        : h('div', { class: 'cc-stack' },
            legend(backSites, 'rect'),
            h('div', { class: 'cc-multiples' },
              h('div', null, h('h3', null, `Visits per recognised visitor, ${period}`), freqHost),
              h('div', null, h('h3', null, 'Time between visits'), gapHost),
            ),
            tableView(['', ...backSites.map((s) => SITES[s].label)], [
              ...FREQ.map((f, k) => [`${f} visit${f === '1' ? '' : 's'}`, ...freqSeries.map((s) => s.values[k])]),
              ...GAPS.map((g, k) => [`Return visits after ${g}`, ...gapSeries.map((s) => s.values[k])]),
              ['Known before this range', ...backSites.map((s) => Number(returning.find((x) => x.site === s)?.seen_before) || 0)],
            ]),
          ),
    ),
  );

  // Return windows: weekly groups of first visits, each window shown once it has passed.
  if (cbShown) {
    const WINDOWS = [
      { key: 'r7', days: 7, label: 'Back within 7 days' },
      { key: 'r30', days: 30, label: 'Back within 30 days' },
      { key: 'r90', days: 90, label: 'Back within 90 days' },
    ];
    const weekStart = (w: number) => w * 7 * DAY_MS - 3 * DAY_MS - p.tz;
    const passed = (w: number, days: number) => weekStart(w) + (7 + days) * DAY_MS <= p.generated;
    const cohorts = (d.windows ?? []).filter((r) => r.site === 'cb').sort((x, y) => y.week - x.week);
    const summary = WINDOWS.map((w) => {
      const done = cohorts.filter((r) => passed(r.week, w.days));
      return { ...w, n: sum(done, (r) => r.cohort), k: sum(done, (r) => r[w.key]) };
    });
    sections.push(
      card('Return windows', 'Recognised visitors grouped by the week of their first visit, over the last 26 weeks whatever the range above: how many made a return visit within 7, 30 and 90 days. A week shows a figure once its whole window has passed.',
        h('div', { class: 'cc-tiles' }, summary.map((w) => tile(w.label, w.n ? fmt.pct(w.k / w.n) : '–', null, w.n ? `${fmt.int(w.k)} of ${fmt.int(w.n)} first-time visitors` : 'No week has finished this window yet'))),
        table<Row>([
          { label: 'Week of first visit', value: (r) => new Date(weekStart(r.week)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) },
          { label: 'First-time visitors', num: true, value: (r) => fmt.int(r.cohort), bar: (r) => [{ value: r.cohort, color: SITES.cb.color }] },
          ...WINDOWS.map((w): Col<Row> => ({
            label: w.label.replace('Back within ', ''),
            num: true,
            value: (r) => (passed(r.week, w.days) ? `${fmt.pct(ratio(r[w.key], r.cohort))} · ${fmt.int(r[w.key])}` : h('span', { class: 'cc-muted' }, 'not yet')),
          })),
        ], cohorts, 'No recognised first visits in the last 26 weeks.'),
      ),
    );
  }

  // New and returning: the same session figures for each kind of visitor.
  const WHO: Record<string, string> = { new: 'New recognised visitors', returning: 'Returning recognised visitors', none: 'Sessions without an id' };
  const engRows = ['new', 'returning', 'none']
    .map((who) => {
      const rows = (d.engagement ?? []).filter((r) => r.who === who);
      return { who, sessions: sum(rows, (r) => r.sessions), views: sum(rows, (r) => r.views), active_ms: sum(rows, (r) => r.active_ms), bounces: sum(rows, (r) => r.bounces) };
    })
    .filter((r) => r.sessions > 0);
  sections.push(
    card('New and returning', 'Sessions of first-time and returning recognised visitors side by side, with sessions that have no id for reference.',
      table<Row>([
        { label: 'Who', value: (r) => WHO[r.who] },
        { label: 'Sessions', num: true, value: (r) => fmt.int(r.sessions), bar: (r) => [{ value: r.sessions, color: r.who === 'none' ? 'var(--muted)' : SITES.cb.color }] },
        { label: 'Views per session', num: true, value: (r) => fmt.dec(ratio(r.views, r.sessions)) },
        { label: 'Engaged per session', num: true, value: (r) => fmt.duration(ratio(r.active_ms, r.sessions)) },
        { label: 'Bounce rate', num: true, value: (r) => fmt.pct(ratio(r.bounces, r.sessions)) },
      ], engRows, 'No sessions in this range.'),
    ),
  );

  // Page requests the server counted, against the views the beacon reported.
  let hitsDraw: (() => void) | null = null;
  if (cbShown) {
    const hits = d.hits ?? [];
    const people = (r: Row) => (Number(r.human) || 0) + (p.dc ? Number(r.dc) || 0 : 0);
    const requests = sum(hits, people);
    const beacon = sum(hits, (r) => r.beacon);
    const hitsHost = h('div', { class: 'cc-chart' });
    const utc = (day: number, opts: Intl.DateTimeFormatOptions) => new Date(day * DAY_MS).toLocaleDateString('en-US', { ...opts, timeZone: 'UTC' });
    const hitSeries: Series[] = [
      { key: 'requests', label: 'Page requests', color: SITES.cb.color, values: hits.map(people) },
      { key: 'beacon', label: 'Views the beacon reported', color: 'var(--muted)', values: hits.map((r) => Number(r.beacon) || 0) },
    ];
    const paths = d.hitPaths ?? [];
    sections.push(
      card('Page requests the server counted', `Every certblueprint.com page the Worker served, counted with no id, no cookie and no address. It includes the visits the beacon must not measure (no consent in Europe, a decline, Global Privacy Control) or cannot (ad blockers, no JavaScript). Days are UTC.${p.dc ? '' : ' People excludes data-centre networks.'}`,
        hits.length === 0
          ? h('p', { class: 'cc-empty' }, 'No page requests counted in this range yet. Counting started with the release that added this panel.')
          : h('div', { class: 'cc-stack' },
              h('div', { class: 'cc-tiles' },
                tile('Page requests', fmt.int(requests), null, p.dc ? 'People and data centres' : 'People: not bots, not data centres'),
                tile('Measured by the beacon', fmt.pct(ratio(beacon, requests)), null, `${fmt.int(beacon)} views reported on the same days`),
                tile('Bots', fmt.int(sum(hits, (r) => r.bot)), null, 'Said so in their user agent'),
                tile('Data centres', fmt.int(sum(hits, (r) => r.dc)), null, 'Cloud and hosting networks'),
              ),
              hits.length > 1 ? h('div', { class: 'cc-legend' }, hitSeries.map((x) => h('span', null, h('span', { class: 'cc-key cc-key-line', style: `background:${x.color}` }), x.label))) : null,
              hits.length > 1 ? hitsHost : null,
              h('p', { class: 'cc-hint' }, `Counting began ${utc(hits[0].day, { month: 'short', day: 'numeric' })}${hits[0].day * DAY_MS > p.start ? ', partway through that day, so its share reads high' : ''}. The beacon can report more views than requests: a page restored with the Back button, or a tab coming back after 30 idle minutes, is a new view without a new request.`),
              tableView(['Day (UTC)', 'Page requests', 'Beacon views', 'Bots', 'Data centres'], hits.map((r) => [utc(r.day, { weekday: 'short', month: 'short', day: 'numeric' }), people(r), Number(r.beacon) || 0, Number(r.bot) || 0, Number(r.dc) || 0])),
              h('h3', null, 'By page'),
              table<Row>([
                { label: 'Page', value: (r) => h('span', null, pageLabel(r.path), h('small', null, r.path)) },
                { label: 'Requests', num: true, value: (r) => fmt.int(people(r)), bar: (r) => [{ value: people(r), color: SITES.cb.color }] },
                { label: 'Beacon views', num: true, value: (r) => fmt.int(r.beacon) },
                { label: 'Measured', num: true, value: (r) => fmt.pct(ratio(r.beacon, people(r))), title: 'Beacon views as a share of page requests' },
                { label: 'Bots', num: true, value: (r) => fmt.int(r.bot) },
                { label: 'Data centres', num: true, value: (r) => fmt.int(r.dc) },
              ], paths, 'No page requests counted in this range yet.'),
            ),
      ),
    );
    if (hits.length > 1) {
      hitsDraw = () =>
        lineChart(hitsHost, {
          xs: hits.map((r) => r.day * DAY_MS),
          series: hitSeries,
          xTick: (x) => utc(x / DAY_MS, { month: 'short', day: 'numeric' }),
          xTitle: (x) => utc(x / DAY_MS, { weekday: 'short', month: 'short', day: 'numeric' }),
          format: fmt.compact,
          height: 200,
          label: 'Page requests and beacon views per day',
        });
    }
  }

  // certblueprint topics and pages
  if (sites.includes('cb')) {
    const tv = new Map((d.topicVisitors ?? []).map((r) => [r.topic, r]));
    sections.push(
      card('Topics on certblueprint.com', 'Pages grouped by what they are about: a certification, role, career path, vendor or tool.',
        table<Row>([
          { label: 'Topic', value: (r) => topicLabel(r.topic) },
          { label: 'Sessions', num: true, value: (r) => fmt.int(r.sessions), bar: (r) => [{ value: r.sessions, color: SITES.cb.color }] },
          { label: 'Views', num: true, value: (r) => fmt.int(r.views) },
          { label: 'Engaged time', num: true, value: (r) => fmt.duration(r.ms), title: 'Total engaged time on this topic' },
          { label: 'Per session', num: true, value: (r) => fmt.duration(ratio(r.ms, r.sessions)) },
          { label: 'Re-read in session', num: true, value: (r) => fmt.pct(ratio(r.repeat_sessions, r.sessions)), title: 'Sessions that viewed this topic more than once' },
          { label: 'Came back to it', num: true, value: (r) => { const v = tv.get(r.topic); return v && v.visitors ? `${fmt.int(v.repeaters)} of ${fmt.int(v.visitors)}` : '–'; }, title: 'Visitors with consent who returned to this topic in another session' },
        ], d.topics ?? []),
      ),
    );
  }

  // NetDrill labs
  if (sites.includes('nd')) {
    const labCols = (name: string, labelOf: (r: Row) => Child): Col<Row>[] => [
      { label: name, value: labelOf },
      { label: 'Opens', num: true, value: (r) => fmt.int(r.opens), bar: (r) => [{ value: r.opens, color: SITES.nd.color }] },
      { label: 'Sessions', num: true, value: (r) => fmt.int(r.sessions) },
      { label: 'Time in it', num: true, value: (r) => fmt.duration(r.ms) },
      { label: 'Per open', num: true, value: (r) => fmt.duration(ratio(r.ms, r.opens)) },
      { label: 'Commands', num: true, value: (r) => fmt.int(r.commands), title: 'Commands typed, counted (never their text)' },
      { label: 'Reopened in session', num: true, value: (r) => fmt.pct(ratio(r.repeat_sessions, r.sessions)) },
      { label: 'Came back to it', num: true, value: (r) => fmt.pct(ratio(r.resumed, r.opens)), title: 'Opens by a browser that had opened it on an earlier visit (from NetDrill’s saved progress)' },
    ];
    const kinds = (d.labKinds ?? []).map((r): BarRow => ({ label: r.kind ?? 'Other', parts: [{ label: 'Opens', color: SITES.nd.color, value: r.opens }], value: `${fmt.int(r.opens)} opens · ${fmt.int(r.sessions)} sessions` }));
    const kindHost = h('div');
    barList(kindHost, kinds, fmt.int);
    sections.push(
      card('NetDrill labs', 'What gets opened, how long people stay in it, and what they come back to. Right or wrong answers are not recorded.',
        h('div', { class: 'cc-narrow' }, h('h3', null, 'Opens by kind of practice'), kindHost),
        table<Row>(labCols('Lab', (r) => h('span', null, ndLabel(r.k), r.kind ? h('small', { class: 'cc-chip' }, r.kind) : null)), d.labs ?? []),
      ),
      card('NetDrill topics', 'The same, added up per topic.', table<Row>(labCols('Topic', (r) => r.k), d.labTopics ?? [])),
    );
  }

  if (sites.includes('cb')) {
    sections.push(
      card('Pages', 'certblueprint.com pages by views.',
        table<Row>([
          { label: 'Page', value: (r) => h('span', null, pageLabel(r.path), h('small', null, r.path)) },
          { label: 'Views', num: true, value: (r) => fmt.int(r.views), bar: (r) => [{ value: r.views, color: SITES.cb.color }] },
          { label: 'Sessions', num: true, value: (r) => fmt.int(r.sessions) },
          { label: 'Engaged per view', num: true, value: (r) => fmt.duration(ratio(r.ms, r.views)) },
          { label: 'Scrolled', num: true, value: (r) => (r.scroll == null ? '–' : `${Math.round(r.scroll)}%`), title: 'Average of how far down each view got' },
          { label: 'Reloaded', num: true, value: (r) => fmt.pct(ratio(r.reloads, r.views)), title: 'Views that were a refresh' },
          { label: 'Click rate', num: true, value: (r) => fmt.pct(ratio(r.clicked, r.views)), title: 'Views with at least one click' },
        ], d.pages ?? []),
      ),
    );
  }

  // Landing and exit
  sections.push(
    h('div', { class: 'cc-grid' },
      card('Where sessions start', 'Entry page (NetDrill: the lab open on arrival) and how often that was the whole visit.',
        table<Row>([
          { label: 'Entry', value: (r) => h('span', null, placeLabel(r.site, r.entry), sites.length > 1 ? h('small', null, siteLabel(r.site)) : null) },
          { label: 'Sessions', num: true, value: (r) => fmt.int(r.sessions), bar: (r) => [{ value: r.sessions, color: siteColor(r.site) }] },
          { label: 'Bounce', num: true, value: (r) => fmt.pct(ratio(r.bounces, r.sessions)) },
          { label: 'Engaged', num: true, value: (r) => fmt.duration(ratio(r.active_ms, r.sessions)), title: 'Engaged time per session' },
        ], d.landing ?? []),
      ),
      card('Where sessions go quiet', 'The last page (NetDrill: the last lab opened) before a session ended or went idle.',
        table<Row>([
          { label: 'Last place', value: (r) => h('span', null, placeLabel(r.site, r.exit), sites.length > 1 ? h('small', null, siteLabel(r.site)) : null) },
          { label: 'Sessions', num: true, value: (r) => fmt.int(r.sessions), bar: (r) => [{ value: r.sessions, color: siteColor(r.site) }] },
          { label: 'Avg length', num: true, value: (r) => fmt.duration(ratio(r.span_ms, r.sessions)) },
        ], d.exits ?? []),
      ),
    ),
  );

  // Click-through
  const cbViews = sum((d.totals ?? []).filter((r) => r.site === 'cb'), (r) => r.views);
  const placements = (d.placements ?? []).map((r) => {
    const always = r.placement.endsWith(':header') && Number(r.seen) === 0;
    return { ...r, seen: always ? cbViews : r.seen, estimated: always };
  });
  sections.push(
    card('Click-through', 'Placements: how many views had it on screen for a second, and how many of those clicked it. The header button is on every page, so its views are all page views.',
      table<Row>([
        { label: 'Placement', value: (r) => placementLabel(r.placement) },
        { label: 'Seen', num: true, value: (r) => `${fmt.int(r.seen)}${r.estimated ? '*' : ''}`, bar: (r) => [{ value: r.seen, color: siteColor(r.site) }], title: 'Views where it was on screen' },
        { label: 'Clicked', num: true, value: (r) => fmt.int(r.clicked), title: 'Views where it was clicked' },
        { label: 'CTR', num: true, value: (r) => fmt.pct(ratio(r.clicked, r.seen)) },
        { label: 'Clicks', num: true, value: (r) => fmt.int(r.clicks) },
      ], placements, 'No placements seen yet in this range.'),
    ),
    card('Clicks out', 'Links to NetDrill, affiliates and other sites.',
      table<Row>([
        { label: 'Kind', value: (r) => KINDS[r.kind] ?? r.kind },
        { label: 'Where to', value: (r) => (r.kind === 'netdrill' ? ndLabel(r.item) : r.item ?? '') },
        { label: 'Clicks', num: true, value: (r) => fmt.int(r.clicks), bar: (r) => [{ value: r.clicks, color: siteColor(r.site) }] },
        { label: 'Sessions', num: true, value: (r) => fmt.int(r.sessions) },
      ], (d.clicks ?? []).filter((r) => r.kind !== 'internal')),
    ),
  );

  // Acquisition
  const CHANNELS: Record<string, string> = { search: 'Search engines', direct: 'Direct or unknown', referral: 'Other sites', social: 'Social and forums', ai: 'AI assistants', campaign: 'Campaign links', 'cross-site': 'Between CertBlueprint and NetDrill' };
  const channelNames = [...new Set((d.channels ?? []).map((r) => r.channel))];
  const channelRows: BarRow[] = channelNames
    .map((ch) => ({
      label: CHANNELS[ch] ?? ch,
      parts: sites.map((s) => ({ label: SITES[s].label, color: SITES[s].color, value: sum((d.channels ?? []).filter((r) => r.channel === ch && r.site === s), (r) => r.sessions) })),
    }))
    .sort((a, b) => sum(b.parts, (x) => x.value) - sum(a.parts, (x) => x.value));
  const channelHost = h('div');
  barList(channelHost, channelRows, fmt.int);
  sections.push(
    h('div', { class: 'cc-grid' },
      card('How people arrive', 'Sessions by where they came from.', legend(sites, 'rect'), channelHost),
      card('Referring sites', undefined,
        table<Row>([
          { label: 'Site', value: (r) => r.ref },
          { label: 'Sessions', num: true, value: (r) => fmt.int(r.sessions), bar: (r) => sites.map((s) => ({ value: Number(r[s]) || 0, color: SITES[s].color })) },
          { label: 'Bounce', num: true, value: (r) => fmt.pct(ratio(r.bounces, r.sessions)) },
          { label: 'Engaged', num: true, value: (r) => fmt.duration(ratio(r.active_ms, r.sessions)) },
        ], d.referrers ?? [], 'No referring sites in this range.'),
        (d.campaigns ?? []).length
          ? h('div', null, h('h3', null, 'Campaign links (utm_ or ?ref=)'),
              table<Row>([
                { label: 'Campaign', value: (r) => r.src },
                { label: 'Sessions', num: true, value: (r) => fmt.int(r.sessions) },
                { label: 'Bounce', num: true, value: (r) => fmt.pct(ratio(r.bounces, r.sessions)) },
                { label: 'Engaged', num: true, value: (r) => fmt.duration(ratio(r.active_ms, r.sessions)) },
              ], d.campaigns ?? []))
          : null,
      ),
    ),
  );

  // Search
  if (sites.includes('cb')) {
    const searches = d.search ?? [];
    const nothing = searches.filter((r) => Number(r.results) === 0);
    sections.push(
      h('div', { class: 'cc-grid' },
        card('What people search for', 'Site search on certblueprint.com.',
          table<Row>([
            { label: 'Search', value: (r) => r.q },
            { label: 'Times', num: true, value: (r) => fmt.int(r.searches), bar: (r) => [{ value: r.searches, color: SITES.cb.color }] },
            { label: 'Results', num: true, value: (r) => fmt.int(r.results) },
            { label: 'Opened one', num: true, value: (r) => fmt.pct(ratio(r.picked, r.searches)) },
          ], searches, 'No searches in this range.'),
        ),
        card('Searched for, found nothing', 'Content people looked for that the site does not have, or does not call by that name.',
          table<Row>([
            { label: 'Search', value: (r) => r.q },
            { label: 'Times', num: true, value: (r) => fmt.int(r.searches) },
            { label: 'Sessions', num: true, value: (r) => fmt.int(r.sessions) },
          ], nothing, 'Every search found something.'),
        ),
      ),
    );
  }

  // Audience
  const audience = d.audience ?? [];
  const dimRows = (dim: string, name: (k: string) => string, limit = 10): BarRow[] => {
    const keys = [...new Set(audience.filter((r) => r.dim === dim).map((r) => r.k ?? ''))];
    return keys
      .map((k) => ({ label: name(k), parts: sites.map((s) => ({ label: SITES[s].label, color: SITES[s].color, value: sum(audience.filter((r) => r.dim === dim && (r.k ?? '') === k && r.site === s), (r) => r.n) })) }))
      .sort((a, b) => sum(b.parts, (x) => x.value) - sum(a.parts, (x) => x.value))
      .slice(0, limit);
  };
  const audienceHosts = ['device', 'browser', 'os', 'country'].map(() => h('div'));
  barList(audienceHosts[0], dimRows('device', (k) => k || 'Unknown'), fmt.int);
  barList(audienceHosts[1], dimRows('browser', (k) => k || 'Unknown'), fmt.int);
  barList(audienceHosts[2], dimRows('os', (k) => k || 'Unknown'), fmt.int);
  barList(audienceHosts[3], dimRows('country', country, 12), fmt.int);
  sections.push(
    card('Who', 'Sessions by device, browser, system and country.', legend(sites, 'rect'),
      h('div', { class: 'cc-quad' },
        h('div', null, h('h3', null, 'Device'), audienceHosts[0]),
        h('div', null, h('h3', null, 'Browser'), audienceHosts[1]),
        h('div', null, h('h3', null, 'System'), audienceHosts[2]),
        h('div', null, h('h3', null, 'Country'), audienceHosts[3]),
      ),
    ),
  );

  // Errors
  sections.push(
    card('Script errors', 'Uncaught errors in the page, grouped by message.',
      table<Row>([
        { label: 'Message', value: (r) => h('code', null, r.message) },
        { label: 'Site', value: (r) => siteLabel(r.site) },
        { label: 'Times', num: true, value: (r) => fmt.int(r.n) },
        { label: 'Sessions', num: true, value: (r) => fmt.int(r.sessions) },
        { label: 'Last', num: true, value: (r) => fmt.ago(r.last_ts, p.generated) },
      ], d.errors ?? [], 'No script errors in this range.'),
    ),
  );

  // Sessions
  const status = (s: Row) => {
    const idle = p.generated - s.last_ts;
    if (idle < 5 * 60_000) return h('span', { class: 'cc-status-cell is-good' }, h('span', { 'aria-hidden': 'true' }, '● '), 'Active now');
    if (idle < 30 * 60_000) return h('span', { class: 'cc-status-cell is-warn' }, h('span', { 'aria-hidden': 'true' }, '◐ '), `Idle ${fmt.duration(idle)}`);
    return h('span', { class: 'cc-status-cell' }, h('span', { 'aria-hidden': 'true' }, '○ '), `Went quiet ${fmt.ago(s.last_ts, p.generated)}`);
  };
  sections.push(
    card('Sessions', 'The latest 60 in this range. Open one to see what happened in order.',
      table<Row>([
        { label: 'Started', value: (r) => h('span', { class: 'cc-nowrap' }, fmt.dateTime(r.start_ts)) },
        { label: 'Now', value: status },
        { label: 'Site', value: (r) => h('span', { class: 'cc-nowrap' }, h('span', { class: 'cc-key cc-key-rect', style: `background:${siteColor(r.site)}` }), siteLabel(r.site)) },
        { label: 'Length', num: true, value: (r) => h('span', null, fmt.duration(r.last_ts - r.start_ts), h('small', null, `${fmt.duration(r.active_ms)} engaged`)) },
        { label: 'Did', value: (r) => h('span', { class: 'cc-did' }, [
            `${r.views} view${r.views === 1 ? '' : 's'}`,
            r.reloads ? `${r.reloads} reload${r.reloads === 1 ? '' : 's'}` : '',
            r.clicks ? `${r.clicks} click${r.clicks === 1 ? '' : 's'}` : '',
            r.opens ? `${r.opens} lab${r.opens === 1 ? '' : 's'}` : '',
          ].filter(Boolean).join(' · ')) },
        { label: 'Started on → ended on', value: (r) => h('span', { class: 'cc-path' }, placeLabel(r.site, r.entry), h('small', null, `→ ${placeLabel(r.site, r.exit)}`)) },
        { label: 'From', value: (r) => r.src || r.ref || (CHANNELS[r.channel] ?? 'Direct') },
        { label: 'Who', value: (r) => h('span', null, country(r.country), h('small', null, `${r.device ?? ''} · ${r.browser ?? ''} · ${r.is_returning ? 'returning' : r.known ? 'new' : 'no id'}${r.dc ? ' · data centre' : ''}`)) },
      ], d.recent ?? [], 'No sessions in this range.', (r, tr) => {
        tr.classList.add('cc-clickable');
        tr.tabIndex = 0;
        const toggle = () => openSession(r, tr);
        tr.addEventListener('click', toggle);
        tr.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggle();
          }
        });
      }, 20),
    ),
  );

  // Your own visits, then notes
  sections.push(devicesCard);
  const stored = d.stored?.[0] ?? {};
  const exportBtn = h('button', { type: 'button', class: 'cc-btn cc-btn-quiet' }, 'Download this view as JSON');
  exportBtn.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(state.payload, null, 2)], { type: 'application/json' });
    const a = h('a', { href: URL.createObjectURL(blob), download: `command-center-${p.site}-${p.range}-${new Date(p.generated).toISOString().slice(0, 10)}.json` });
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
  sections.push(
    card('About these numbers', undefined,
      h('ul', { class: 'cc-notes' },
        h('li', null, 'A session ends after 30 minutes without activity. Engaged time counts only while the page is visible and someone has used it in the last minute.'),
        h('li', null, 'Bounce: a session with one view, no click, under 10 seconds in use, and no engaged signal. The page sends that signal as soon as a view reaches 10 seconds in use or is clicked, so a bounce does not depend on the last beacon arriving.'),
        h('li', null, 'Who is measured: in the EEA, the UK and Switzerland, only visitors who accepted analytics cookies; elsewhere, everyone who has not declined them. A decline or Global Privacy Control stops the beacon everywhere. The server’s page-request count covers every visit, measured or not.'),
        h('li', null, 'Recognised visitors have a random id, kept only for people who accepted analytics cookies, so they are part of the traffic, not all of it. Everyone else is counted in sessions, never as people. A return visit starts more than 30 minutes after the visitor’s last activity.'),
        h('li', null, `Sessions from cloud and hosting networks are ${p.dc ? 'included in this view' : 'left out unless you pick “With data centres”'}: most are scripts posing as browsers, though some are people on a VPN.`),
        h('li', null, `Stored: about ${fmt.int(stored.events ?? 0)} events${stored.since ? ` since ${new Date(stored.since).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}. Kept for ${p.retentionDays} days, then deleted. This view read ${fmt.int(p.rowsRead)} rows.`),
      ),
      exportBtn,
    ),
  );

  $('cc-sections').replaceChildren(...sections);

  // Charts draw once their hosts are in the page and have a width.
  lineChart(sessionsChart, { xs, series: ses, xTick, xTitle, format: fmt.compact, height: 260, label: `Sessions per ${hourly ? 'hour' : 'day'}` });
  lineChart(visitorsChart, { xs, series: vis, xTick, xTitle, format: fmt.compact, height: 170, label: 'Recognised visitors' });
  lineChart(viewsChart, { xs, series: vws, xTick, xTitle, format: fmt.compact, height: 170, label: 'Views' });
  heatmap(heatHost, { grid, format: fmt.int, label: 'Sessions started by weekday and hour' });
  columnChart(lengthHost, { categories: LENGTHS, series: lengthSeries, format: fmt.compact, label: 'Sessions by engaged time' });
  if (known) {
    columnChart(freqHost, { categories: FREQ, series: freqSeries, format: fmt.compact, height: 180, label: 'Recognised visitors by number of visits' });
    columnChart(gapHost, { categories: GAPS.map((g) => g.replace('under a day', '<1 day')), series: gapSeries, format: fmt.compact, height: 180, label: 'Return visits by time since the last visit' });
  }
  hitsDraw?.();
}

// ─── Your own visits: excluded networks ───

const devicesCard = h('section', { class: 'cc-card', id: 'cc-devices' });

function netPill(here: Here | null) {
  const pill = $('cc-net-pill');
  pill.hidden = !here;
  if (!here) return;
  pill.className = `cc-pill ${here.excluded ? 'is-good' : 'is-warn'}`;
  pill.textContent = here.excluded ? '✓ Your network is left out' : '! This network is counted';
  pill.title = `${here.org ? `${here.org} · ` : ''}${here.display}`;
}

async function loadNetworks(body: Record<string, unknown> = {}) {
  state.networks = (await api('/api/command/networks', body)) as Networks;
  netPill(state.networks.here);
  renderDevices();
}

/** This connection's IPv4 or IPv6 address from an address-echo service: the Worker only sees the one the request used. */
async function addressFrom(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { cache: 'no-store', credentials: 'omit', signal: AbortSignal.timeout(4000) });
    const text = (await res.text()).trim();
    return res.ok && text.length <= 45 && /^[0-9a-f.:]+$/i.test(text) ? text : null;
  } catch {
    return null;
  }
}

function renderDevices(message?: string) {
  const n = state.networks;
  if (!n) {
    devicesCard.replaceChildren(h('header', null, h('h2', null, 'Leave out your own visits')), h('p', { class: 'cc-hint' }, 'Loading…'));
    return;
  }
  const here = n.here;
  const label = h('input', { type: 'text', value: 'Home', maxlength: 60, 'aria-label': 'Name for this network', class: 'cc-input-small' });
  const add = h('button', { type: 'button', class: 'cc-btn cc-btn-primary' }, 'Leave out this network');
  add.addEventListener('click', async () => {
    add.disabled = true;
    add.textContent = 'Finding this connection’s addresses…';
    const ips = (await Promise.all([addressFrom('https://api.ipify.org'), addressFrom('https://api6.ipify.org')])).filter((ip): ip is string => !!ip);
    try {
      await loadNetworks({ action: 'add', label: label.value.trim() || 'Home', ips });
      const added = state.networks?.added ?? [];
      renderDevices(added.length ? `Left out: ${added.join(' and ')}. Every device on this network stops counting within a minute.` : undefined);
    } catch (err) {
      renderDevices(`Could not save: ${(err as Error).message}`);
    }
  });

  const status = here
    ? h('div', { class: `cc-netstatus ${here.excluded ? 'is-good' : 'is-warn'}` },
        h('p', null, h('strong', null, here.excluded ? '✓ This network is left out.' : 'This network is counted.'), ` You’re connected through ${here.org ?? 'an unknown provider'} at ${here.display}.`),
        here.excluded
          ? null
          : h('div', { class: 'cc-row' }, label, add),
        here.excluded
          ? null
          : h('p', { class: 'cc-hint' }, 'Only do this on your own home or office network. On mobile data or public Wi-Fi the address is shared with strangers, and their visits would disappear too.'),
      )
    : h('p', { class: 'cc-hint' }, 'The server could not read this connection’s address.');

  const rows = n.networks;
  const parts: (Node | null)[] = [
    h('header', null,
      h('h2', null, 'Leave out your own visits'),
      h('p', null, 'Every device on a left-out network is ignored on both sites: your phone, tablet and computer, in any browser, with nothing to set on each one. The server checks each visit’s address against this list and never stores visitors’ addresses.'),
    ),
    status,
    message ? h('p', { class: 'cc-hint', role: 'status' }, message) : null,
    rows.length
      ? table<Row>([
          { label: 'Name', value: (r) => r.label ?? '' },
          { label: 'Network', value: (r) => h('code', null, r.display) },
          { label: 'Provider', value: (r) => r.org ?? '–' },
          { label: 'Added', value: (r) => fmt.ago(r.added_ts) },
          { label: 'Last caught a visit', value: (r) => (r.last_seen_ts ? fmt.ago(r.last_seen_ts) : 'not yet') },
          {
            label: '',
            value: (r) => {
              const remove = h('button', { type: 'button', class: 'cc-btn cc-btn-quiet' }, 'Remove');
              remove.addEventListener('click', async () => {
                remove.disabled = true;
                try {
                  await loadNetworks({ action: 'remove', key: r.key });
                } catch (err) {
                  renderDevices(`Could not remove: ${(err as Error).message}`);
                }
              });
              return remove;
            },
          },
        ], rows as unknown as Row[])
      : null,
    h('p', { class: 'cc-hint' }, 'Home addresses can change now and then. If the badge at the top says this network is counted while you’re at home, leave it out again here and remove the old one.'),
    awayFromHome(),
  ];
  devicesCard.replaceChildren(...parts.filter((x): x is Node => x !== null));
}

/** For a device away from home (a phone on mobile data): a per-browser switch. */
function awayFromHome() {
  let off = false;
  try {
    off = localStorage.getItem(OFF_KEY) === '1';
  } catch {
    /* storage blocked */
  }
  const box = h('input', { type: 'checkbox', checked: off });
  box.addEventListener('change', () => {
    try {
      if (box.checked) localStorage.setItem(OFF_KEY, '1');
      else localStorage.removeItem(OFF_KEY);
    } catch {
      /* storage blocked */
    }
  });
  return h('details', { class: 'cc-lost' },
    h('summary', null, 'Away from home?'),
    h('div', { class: 'cc-stack' },
      h('p', { class: 'cc-hint' }, 'A phone on mobile data is not on your home network. To leave out one browser wherever it is:'),
      h('label', { class: 'cc-check' }, box, ' Ignore certblueprint.com visits from this browser'),
      h('p', { class: 'cc-hint' }, 'For NetDrill, open ', h('a', { href: 'https://netdrill.certblueprint.com/?notrack=1', target: '_blank', rel: 'noopener' }, 'netdrill.certblueprint.com/?notrack=1'), ' once in that browser (?notrack=0 undoes it).'),
    ),
  );
}

// ─── One session, in order ───

function describe(e: Row, site: string): string {
  const where = site === 'nd' ? ndLabel(e.item) : pageLabel(e.path);
  switch (e.type) {
    case 'view':
      if (site === 'nd') return `Opened NetDrill${e.nav === 'reload' ? ' (refresh)' : ''}${e.path && e.path !== '/' ? ` on ${ndLabel(e.path)}` : ''}`;
      return `${e.nav === 'reload' ? 'Refreshed' : e.nav === 'resume' ? 'Came back after being idle to' : e.nav === 'back_forward' ? 'Went back to' : 'Viewed'} ${pageLabel(e.path)}`;
    case 'leave':
      return `Left the page or switched tab: ${fmt.duration(e.ms)} engaged${e.n != null && site === 'cb' ? `, scrolled ${e.n}%` : ''}${e.c ? `, ${e.c} click${e.c === 1 ? '' : 's'}` : ''}`;
    case 'click':
      return `Clicked ${e.kind === 'netdrill' ? `NetDrill: ${ndLabel(e.item)}` : `${e.kind}: ${e.item}`}${e.topic ? ` (${placementLabel(e.topic)})` : ''}`;
    case 'impr':
      return `Saw ${placementLabel(e.topic ?? '')}`;
    case 'search':
      return `Searched “${e.item}”: ${e.n} result${e.n === 1 ? '' : 's'}${e.kind === 'picked' ? `, opened ${pageLabel(e.topic)}` : ', opened none'}`;
    case 'open':
      return `Opened ${where}${e.kind ? ` (${e.kind})` : ''}`;
    case 'time':
      return `${fmt.duration(e.ms)} in ${where}${e.n ? `, ${e.n} command${e.n === 1 ? '' : 's'}` : ''}`;
    case 'error':
      return `Script error: ${e.item}`;
    default:
      return e.type;
  }
}

async function openSession(r: Row, tr: HTMLTableRowElement) {
  const next = tr.nextElementSibling;
  if (next?.classList.contains('cc-detail')) {
    next.remove();
    return;
  }
  const cell = h('td', { colspan: tr.children.length }, h('p', { class: 'cc-hint' }, 'Loading…'));
  tr.after(h('tr', { class: 'cc-detail' }, cell));
  try {
    const { events, session } = (await api('/api/command/session', { sid: r.sid })) as { events: Row[]; session: Row };
    const t0 = session.start_ts;
    const gap = (ms: number) => {
      const s = Math.round(ms / 1000);
      return `+${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    };
    cell.replaceChildren(
      h('ol', { class: 'cc-timeline' },
        events.map((e) => h('li', null, h('span', { class: 'cc-when', title: fmt.dateTime(e.ts) }, gap(e.ts - t0)), describe(e, session.site))),
        h('li', { class: 'cc-end' }, h('span', { class: 'cc-when' }, gap(session.last_ts - t0)), `Last activity at ${fmt.time(session.last_ts)}. ${Date.now() - session.last_ts > 30 * 60_000 ? 'The session ended there.' : 'Still open.'}`),
      ),
    );
  } catch (err) {
    cell.replaceChildren(h('p', { class: 'cc-error' }, `Could not load the session: ${(err as Error).message}`));
  }
}

// ─── Controls ───

function readHash() {
  const params = new URLSearchParams(location.hash.slice(1));
  const range = params.get('range');
  const site = params.get('site');
  if (range && range in RANGES) state.range = range;
  if (site === 'cb' || site === 'nd' || site === 'all') state.site = site;
  state.dc = params.get('dc') === '1';
}
function writeHash() {
  history.replaceState(null, '', `#range=${state.range}&site=${state.site}${state.dc ? '&dc=1' : ''}`);
}

function setTheme(theme: string) {
  if (theme === 'light' || theme === 'dark') document.documentElement.setAttribute('data-theme', theme);
  else document.documentElement.removeAttribute('data-theme');
  try {
    localStorage.setItem('cc:theme', theme);
  } catch {
    /* not remembered */
  }
  $('cc-theme').textContent = theme === 'light' ? 'Light' : theme === 'dark' ? 'Dark' : 'Auto';
  $('cc-theme').setAttribute('aria-label', `Colour theme: ${$('cc-theme').textContent}. Change`);
}

function wire() {
  document.querySelectorAll<HTMLButtonElement>('[data-range]').forEach((b) =>
    b.addEventListener('click', () => {
      state.range = b.dataset.range!;
      writeHash();
      void refresh();
    }),
  );
  document.querySelectorAll<HTMLButtonElement>('[data-site]').forEach((b) =>
    b.addEventListener('click', () => {
      state.site = b.dataset.site as 'all' | Site;
      writeHash();
      void refresh();
    }),
  );
  document.querySelectorAll<HTMLButtonElement>('[data-dc]').forEach((b) =>
    b.addEventListener('click', () => {
      state.dc = b.dataset.dc === '1';
      writeHash();
      void refresh();
    }),
  );
  $('cc-refresh').addEventListener('click', () => void refresh());
  $('cc-lock').addEventListener('click', () => {
    forgetKey();
    state.key = '';
    state.payload = null;
    $('cc-sections').replaceChildren();
    void showGate();
  });
  let theme = 'auto';
  try {
    theme = localStorage.getItem('cc:theme') || 'auto';
  } catch {
    /* default */
  }
  setTheme(theme);
  $('cc-theme').addEventListener('click', () => {
    const order = ['auto', 'light', 'dark'];
    let current = 'auto';
    try {
      current = localStorage.getItem('cc:theme') || 'auto';
    } catch {
      /* default */
    }
    setTheme(order[(order.indexOf(current) + 1) % order.length]);
  });
  // Fresh numbers every five minutes while the tab is in front.
  state.timer = window.setInterval(() => {
    if (document.visibilityState === 'visible' && state.key && !state.loading && !$('cc-board').hidden) void refresh();
  }, 5 * 60_000);
}

async function start() {
  readHash();
  wire();
  state.key = storedKey();
  if (!state.key) return showGate();
  try {
    await load();
    openBoard();
  } catch (err) {
    forgetKey();
    state.key = '';
    showGate(err instanceof Unauthorized ? 'Your saved key no longer works. It may have been replaced.' : `Could not load: ${(err as Error).message}`);
  }
}

void start();
