// DOM and formatting helpers for the command center. Everything that reaches the
// page from the database (paths, search terms, referrers, error messages) is set
// as text, never as HTML: h() and svg() only ever create text nodes for strings.

export type Child = Node | string | number | null | undefined | false;
type Attrs = Record<string, string | number | boolean | null | undefined | EventListener>;

function apply(el: Element, attrs: Attrs | null | undefined) {
  if (!attrs) return;
  for (const [name, value] of Object.entries(attrs)) {
    if (value == null || value === false) continue;
    if (typeof value === 'function') el.addEventListener(name.replace(/^on/, ''), value);
    else el.setAttribute(name, value === true ? '' : String(value));
  }
}

function append(el: Element, children: (Child | Child[])[]) {
  for (const child of children.flat()) {
    if (child == null || child === false) continue;
    el.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
}

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs?: Attrs | null,
  ...children: (Child | Child[])[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  apply(el, attrs);
  append(el, children);
  return el;
}

export function svg<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs?: Attrs | null,
  ...children: (Child | Child[])[]
): SVGElementTagNameMap[K] {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  apply(el, attrs);
  append(el, children);
  return el;
}

const whole = new Intl.NumberFormat('en-US');
const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });

export const fmt = {
  int: (n: number) => whole.format(Math.round(n || 0)),
  compact: (n: number) => (Math.abs(n) < 10_000 ? whole.format(Math.round(n || 0)) : compact.format(n)),
  pct(ratio: number) {
    if (!Number.isFinite(ratio)) return '–';
    const p = ratio * 100;
    return `${p > 0 && p < 10 ? p.toFixed(1) : Math.round(p)}%`;
  },
  dec: (n: number, digits = 1) => (Number.isFinite(n) ? n.toFixed(digits) : '–'),
  duration(ms: number) {
    if (!Number.isFinite(ms) || ms <= 0) return '0s';
    const s = Math.round(ms / 1000);
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ${String(s % 60).padStart(2, '0')}s`;
    const hr = Math.floor(m / 60);
    if (hr < 48) return `${hr}h ${String(m % 60).padStart(2, '0')}m`;
    return `${Math.round(hr / 24)}d`;
  },
  ago(ts: number, now = Date.now()) {
    const s = Math.max(0, Math.round((now - ts) / 1000));
    if (s < 45) return 'just now';
    if (s < 3600) return `${Math.round(s / 60)} min ago`;
    if (s < 86_400) return `${Math.round(s / 3600)} h ago`;
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  },
  time: (ts: number) => new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
  dateTime: (ts: number) =>
    new Date(ts).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
};

export function sum<T>(rows: T[], pick: (row: T) => number) {
  return rows.reduce((total, row) => total + (Number(pick(row)) || 0), 0);
}

/** 0, 1, 2, 2.5, 5 × 10ⁿ steps; about `count` ticks from 0 to just past max. Every chart counts things, so no step is under 1. */
export function niceTicks(max: number, count = 4): number[] {
  if (!(max > 0)) return [0, 1];
  const raw = max / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = Math.max(1, [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? 10 * mag);
  const ticks: number[] = [];
  for (let v = 0; v < max + step * 0.999; v += step) ticks.push(Math.round(v * 1e6) / 1e6);
  if (ticks.length < 2) ticks.push(step);
  return ticks;
}

// ─── Tooltip: one for the page, rows of value + label, keyed by a short line or square ───

let tip: HTMLDivElement | null = null;

export interface TipRow {
  value: string;
  label: string;
  color?: string;
  key?: 'line' | 'rect';
}

export function showTip(x: number, y: number, title: string, rows: TipRow[]) {
  tip ??= document.body.appendChild(h('div', { class: 'cc-tip', role: 'tooltip' }));
  tip.replaceChildren(
    h('div', { class: 'cc-tip-title' }, title),
    ...rows.map((r) =>
      h(
        'div',
        { class: 'cc-tip-row' },
        r.color ? h('span', { class: `cc-key cc-key-${r.key ?? 'line'}`, style: `background:${r.color}` }) : null,
        h('strong', null, r.value),
        h('span', null, r.label),
      ),
    ),
  );
  tip.style.display = 'block';
  const { width, height } = tip.getBoundingClientRect();
  const left = Math.min(window.innerWidth - width - 8, Math.max(8, x + 14));
  const top = y - height - 12 < 8 ? y + 16 : y - height - 12;
  tip.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`;
}

export function hideTip() {
  if (tip) tip.style.display = 'none';
}

/** Tooltip anchored to an element (keyboard focus): top-centre of its box. */
export function tipAt(el: Element, title: string, rows: TipRow[]) {
  const r = el.getBoundingClientRect();
  showTip(r.left + r.width / 2 - 14, r.top, title, rows);
}
