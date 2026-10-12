// SVG and HTML charts for the command center. Specs: 2px lines with a crosshair
// that snaps to the nearest bucket; columns at most 24px wide with a 4px rounded
// data end, square at the baseline, 2px apart; hairline solid grid; text in ink
// tokens, never in a series colour; every chart has a table twin.

import { h, hideTip, niceTicks, showTip, svg, tipAt, type TipRow } from './dom';

export interface Series {
  key: string;
  label: string;
  color: string;
  values: number[];
}

const charts = new WeakMap<HTMLElement, () => void>();
const resize = new ResizeObserver((entries) => {
  for (const entry of entries) charts.get(entry.target as HTMLElement)?.();
});

function mount(host: HTMLElement, draw: () => void) {
  let lastWidth = -1;
  const redraw = () => {
    const width = Math.round(host.clientWidth);
    if (width === lastWidth || width === 0) return;
    lastWidth = width;
    draw();
  };
  charts.set(host, redraw);
  resize.observe(host);
  lastWidth = -1;
  redraw();
}

function columnPath(x: number, y: number, w: number, hgt: number) {
  const r = Math.min(4, w / 2, hgt);
  return `M${x},${y + hgt}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + hgt}Z`;
}

function yAxis(g: SVGGElement, ticks: number[], left: number, right: number, y: (v: number) => number, format: (n: number) => string) {
  for (const t of ticks) {
    const yy = Math.round(y(t)) + 0.5;
    g.append(
      svg('line', { x1: left, x2: right, y1: yy, y2: yy, class: t === 0 ? 'cc-base' : 'cc-gridline' }),
      svg('text', { x: left - 8, y: yy + 4, 'text-anchor': 'end', class: 'cc-tick' }, format(t)),
    );
  }
}

// ─── Line chart: one line per series over time buckets ───

export interface LineOptions {
  xs: number[];
  series: Series[];
  xTick: (x: number) => string;
  xTitle: (x: number) => string;
  format: (n: number) => string;
  height?: number;
  label: string;
}

export function lineChart(host: HTMLElement, o: LineOptions) {
  mount(host, () => {
    const W = Math.max(260, host.clientWidth);
    const H = o.height ?? 240;
    const n = o.xs.length;
    const max = Math.max(1, ...o.series.flatMap((s) => s.values));
    const ticks = niceTicks(max);
    const top = ticks[ticks.length - 1];
    const ends = o.series.map((s) => s.values[n - 1] ?? 0);
    const m = { t: 12, r: 16, b: 26, l: 8 + Math.max(...ticks.map((t) => o.format(t).length)) * 7 + 8 };
    // End labels (value, then series name) when they will not collide; else legend + tooltip carry it.
    const endY = (v: number) => m.t + (H - m.t - m.b) - (v / top) * (H - m.t - m.b);
    const sortedEnds = [...ends].map(endY).sort((a, b) => a - b);
    const endLabels = n > 1 && o.series.length <= 4 && sortedEnds.every((v, i) => i === 0 || v - sortedEnds[i - 1] >= 30);
    if (endLabels) m.r = 12 + Math.max(...o.series.map((s, i) => Math.max(s.label.length, o.format(ends[i]).length))) * 7;
    const pw = W - m.l - m.r;
    const ph = H - m.t - m.b;
    const x = (i: number) => m.l + (n <= 1 ? pw / 2 : (i * pw) / (n - 1));
    const y = (v: number) => m.t + ph - (v / top) * ph;

    const root = svg('svg', { width: W, height: H, viewBox: `0 0 ${W} ${H}`, class: 'cc-svg', role: 'img', tabindex: 0, 'aria-label': `${o.label}. Use the arrow keys to read each point; the table below has every value.` });
    const grid = svg('g');
    yAxis(grid, ticks, m.l, m.l + pw, y, o.format);
    root.append(grid);

    const every = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(pw / 84))));
    for (let i = 0; i < n; i += every) {
      const anchor = n > 1 && i === 0 ? 'start' : i >= n - every / 2 ? 'end' : 'middle';
      root.append(svg('text', { x: x(i), y: H - 8, 'text-anchor': anchor, class: 'cc-tick' }, o.xTick(o.xs[i])));
    }

    for (const s of o.series) {
      const d = s.values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('');
      root.append(svg('path', { d, class: 'cc-line', style: `stroke:${s.color}` }));
      if (n === 1) root.append(svg('circle', { cx: x(0), cy: y(s.values[0]), r: 4, class: 'cc-dot', style: `fill:${s.color}` }));
    }
    if (endLabels) {
      o.series.forEach((s, i) => {
        const ey = y(ends[i]);
        root.append(
          svg('circle', { cx: x(n - 1), cy: ey, r: 4, class: 'cc-dot', style: `fill:${s.color}` }),
          svg('text', { x: x(n - 1) + 10, y: ey + 1, class: 'cc-end-value' }, o.format(ends[i])),
          svg('text', { x: x(n - 1) + 10, y: ey + 14, class: 'cc-end-label' }, s.label),
        );
      });
    }

    const cross = svg('line', { y1: m.t, y2: m.t + ph, class: 'cc-cross', visibility: 'hidden' });
    const dots = o.series.map((s) => svg('circle', { r: 4, class: 'cc-dot', style: `fill:${s.color}`, visibility: 'hidden' }));
    const hit = svg('rect', { x: m.l - 6, y: m.t, width: pw + 12, height: ph, class: 'cc-hit' });
    root.append(cross, ...dots, hit);

    let current = -1;
    const show = (i: number, at?: { x: number; y: number }) => {
      current = Math.max(0, Math.min(n - 1, i));
      const cx = x(current);
      cross.setAttribute('x1', String(cx));
      cross.setAttribute('x2', String(cx));
      cross.setAttribute('visibility', 'visible');
      const rows: TipRow[] = o.series
        .map((s, k) => {
          dots[k].setAttribute('cx', String(cx));
          dots[k].setAttribute('cy', String(y(s.values[current])));
          dots[k].setAttribute('visibility', 'visible');
          return { value: o.format(s.values[current]), label: s.label, color: s.color, key: 'line' as const, v: s.values[current] };
        })
        .sort((a, b) => b.v - a.v);
      const box = root.getBoundingClientRect();
      if (at) showTip(at.x, at.y, o.xTitle(o.xs[current]), rows);
      else showTip(box.left + cx, box.top + m.t + 8, o.xTitle(o.xs[current]), rows);
    };
    const hide = () => {
      current = -1;
      cross.setAttribute('visibility', 'hidden');
      dots.forEach((d) => d.setAttribute('visibility', 'hidden'));
      hideTip();
    };
    hit.addEventListener('pointermove', (e) => {
      const box = root.getBoundingClientRect();
      const px = e.clientX - box.left;
      show(n <= 1 ? 0 : Math.round(((px - m.l) / pw) * (n - 1)), { x: e.clientX, y: e.clientY });
    });
    hit.addEventListener('pointerleave', hide);
    root.addEventListener('focus', () => show(n - 1));
    root.addEventListener('blur', hide);
    root.addEventListener('keydown', (e) => {
      const step = { ArrowLeft: -1, ArrowRight: 1 }[e.key];
      if (step) {
        e.preventDefault();
        show((current < 0 ? n - 1 : current) + step);
      } else if (e.key === 'Home' || e.key === 'End') {
        e.preventDefault();
        show(e.key === 'Home' ? 0 : n - 1);
      } else if (e.key === 'Escape') hide();
    });
    host.replaceChildren(root);
  });
}

// ─── Columns: categories along the bottom, one column per series in each ───

export interface ColumnOptions {
  categories: string[];
  series: Series[];
  format: (n: number) => string;
  height?: number;
  label: string;
}

export function columnChart(host: HTMLElement, o: ColumnOptions) {
  mount(host, () => {
    const W = Math.max(260, host.clientWidth);
    const H = o.height ?? 210;
    const max = Math.max(1, ...o.series.flatMap((s) => s.values));
    const ticks = niceTicks(max);
    const top = ticks[ticks.length - 1];
    const left = 8 + Math.max(...ticks.map((t) => o.format(t).length)) * 7 + 8;
    // Category labels that would touch their neighbours alternate between two rows.
    const stagger = Math.max(...o.categories.map((c) => c.length)) * 6.5 + 6 > (W - left - 8) / o.categories.length;
    const m = { t: 12, r: 8, b: stagger ? 42 : 28, l: left };
    const pw = W - m.l - m.r;
    const ph = H - m.t - m.b;
    const y = (v: number) => m.t + ph - (v / top) * ph;
    const band = pw / o.categories.length;
    const k = o.series.length;
    const bw = Math.max(4, Math.min(24, (band * 0.72 - (k - 1) * 2) / k));
    const groupW = k * bw + (k - 1) * 2;

    const root = svg('svg', { width: W, height: H, viewBox: `0 0 ${W} ${H}`, class: 'cc-svg', role: 'img', 'aria-label': o.label });
    const grid = svg('g');
    yAxis(grid, ticks, m.l, m.l + pw, y, o.format);
    root.append(grid);

    o.categories.forEach((cat, ci) => {
      const gx = m.l + ci * band + (band - groupW) / 2;
      root.append(svg('text', { x: m.l + ci * band + band / 2, y: H - 9 - (stagger && ci % 2 === 0 ? 14 : 0), 'text-anchor': 'middle', class: 'cc-tick' }, cat));
      o.series.forEach((s, si) => {
        const v = s.values[ci] ?? 0;
        const bx = gx + si * (bw + 2);
        const capY = y(v);
        const mark = svg('path', { d: columnPath(bx, capY, bw, Math.max(0, m.t + ph - capY)), class: 'cc-bar', style: `fill:${s.color}` });
        const hit = svg('rect', {
          x: bx - 1,
          y: m.t,
          width: bw + 2,
          height: ph,
          class: 'cc-hit',
          tabindex: 0,
          'aria-label': `${cat}, ${s.label}: ${o.format(v)}`,
        });
        const rows = [{ value: o.format(v), label: s.label, color: s.color, key: 'rect' as const }];
        const on = (e?: PointerEvent) => {
          mark.classList.add('is-hot');
          if (e) showTip(e.clientX, e.clientY, cat, rows);
          else tipAt(mark, cat, rows);
        };
        const off = () => {
          mark.classList.remove('is-hot');
          hideTip();
        };
        hit.addEventListener('pointermove', on);
        hit.addEventListener('pointerleave', off);
        hit.addEventListener('focus', () => on());
        hit.addEventListener('blur', off);
        root.append(mark, hit);
      });
    });
    host.replaceChildren(root);
  });
}

// ─── Heatmap: weekday × hour, one blue ramp, zero recedes to the surface ───

export interface HeatOptions {
  grid: number[][]; // [day 0=Sunday][hour]
  format: (n: number) => string;
  label: string;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const ORDER = [1, 2, 3, 4, 5, 6, 0]; // weeks read Monday first

export function heatmap(host: HTMLElement, o: HeatOptions) {
  mount(host, () => {
    const W = Math.max(260, host.clientWidth);
    const lw = 34;
    const cw = (W - lw) / 24;
    const ch = Math.max(14, Math.min(26, cw * 0.9));
    const H = ch * 7 + 22;
    const max = Math.max(0, ...o.grid.flat());
    const step = (v: number) => (v <= 0 || max <= 0 ? 0 : Math.min(7, 1 + Math.floor((v / max) * 6.999)));

    const root = svg('svg', { width: W, height: H, viewBox: `0 0 ${W} ${H}`, class: 'cc-svg', role: 'img', 'aria-label': o.label });
    ORDER.forEach((day, row) => {
      root.append(svg('text', { x: 0, y: row * ch + ch / 2 + 4, class: 'cc-tick' }, DAYS[day]));
      for (let hour = 0; hour < 24; hour++) {
        const v = o.grid[day]?.[hour] ?? 0;
        const cell = svg('rect', {
          x: lw + hour * cw + 1,
          y: row * ch + 1,
          width: Math.max(1, cw - 2),
          height: ch - 2,
          rx: 2,
          class: 'cc-cell',
          style: `fill:var(--q${step(v)})`,
        });
        const title = `${DAYS[day]} ${String(hour).padStart(2, '0')}:00–${String((hour + 1) % 24).padStart(2, '0')}:00`;
        const rows = [{ value: o.format(v), label: v === 1 ? 'session started' : 'sessions started' }];
        cell.addEventListener('pointermove', (e) => {
          cell.classList.add('is-hot');
          showTip(e.clientX, e.clientY, title, rows);
        });
        cell.addEventListener('pointerleave', () => {
          cell.classList.remove('is-hot');
          hideTip();
        });
        root.append(cell);
      }
    });
    for (let hour = 0; hour < 24; hour += 3) {
      root.append(svg('text', { x: lw + hour * cw + cw / 2, y: H - 6, 'text-anchor': 'middle', class: 'cc-tick' }, `${hour}h`));
    }
    const legend = h(
      'div',
      { class: 'cc-scale' },
      h('span', null, 'Fewer'),
      ...Array.from({ length: 8 }, (_, i) => h('span', { class: 'cc-swatch', style: `background:var(--q${i})` })),
      h('span', null, `More (busiest hour: ${o.format(max)})`),
    );
    host.replaceChildren(root, legend);
  });
}

// ─── Horizontal bars as HTML rows: label, bar (stacked by site), value ───

export interface BarRow {
  label: string;
  sub?: string;
  parts: { label: string; color: string; value: number }[];
  value?: string;
}

export function barList(host: HTMLElement, rows: BarRow[], format: (n: number) => string, empty = 'Nothing yet in this range.') {
  if (rows.length === 0) {
    host.replaceChildren(h('p', { class: 'cc-empty' }, empty));
    return;
  }
  const max = Math.max(1, ...rows.map((r) => r.parts.reduce((t, p) => t + p.value, 0)));
  host.replaceChildren(
    h(
      'ul',
      { class: 'cc-bars' },
      rows.map((r) => {
        const total = r.parts.reduce((t, p) => t + p.value, 0);
        const shown = r.parts.filter((p) => p.value > 0);
        const tipRows: TipRow[] = r.parts.length > 1 ? r.parts.map((p) => ({ value: format(p.value), label: p.label, color: p.color, key: 'rect' })) : [{ value: format(total), label: r.parts[0]?.label ?? '' }];
        const li = h(
          'li',
          { tabindex: 0 },
          h('span', { class: 'cc-bar-label', title: r.sub ? `${r.label} · ${r.sub}` : r.label }, r.label, r.sub ? h('small', null, r.sub) : null),
          h(
            'span',
            { class: 'cc-track' },
            shown.map((p, i) =>
              h('span', {
                class: `cc-seg${i === shown.length - 1 ? ' cc-seg-end' : ''}`,
                style: `width:${(p.value / max) * 100}%;background:${p.color}`,
              }),
            ),
          ),
          h('span', { class: 'cc-bar-value' }, r.value ?? format(total)),
        );
        li.addEventListener('pointermove', (e) => showTip(e.clientX, e.clientY, r.label, tipRows));
        li.addEventListener('pointerleave', hideTip);
        li.addEventListener('focus', () => tipAt(li, r.label, tipRows));
        li.addEventListener('blur', hideTip);
        return li;
      }),
    ),
  );
}

// ─── The table twin of a chart ───

export function tableView(columns: string[], rows: (string | number)[][], summary = 'Show as a table') {
  return h(
    'details',
    { class: 'cc-tableview' },
    h('summary', null, summary),
    h(
      'div',
      { class: 'cc-scroll' },
      h(
        'table',
        { class: 'cc-table' },
        h('thead', null, h('tr', null, columns.map((c, i) => h('th', { class: i ? 'num' : '' }, c)))),
        h('tbody', null, rows.map((r) => h('tr', null, r.map((c, i) => h('td', { class: i ? 'num' : '' }, c))))),
      ),
    ),
  );
}
