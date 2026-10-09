import type { AssessmentResult, DimensionGroup, DomainId, RoleMatch } from '../types';
import { ACCENT_VAR, DOMAIN_BY_ID } from '../data/domains';
import { DIMENSION_BY_ID, GROUP_LABEL } from '../data/dimensions';
import { rankDimensions } from '../engine/vector';

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function accentFor(match: RoleMatch): string {
  return `var(${ACCENT_VAR[DOMAIN_BY_ID[match.role.domains[0]].accent]})`;
}

function bar(label: string, percent: number, accent: string, valueLabel?: string): HTMLElement {
  const wrap = el('div');
  wrap.style.display = 'flex';
  wrap.style.flexDirection = 'column';
  wrap.style.gap = '0.25rem';

  const head = el('div');
  head.style.display = 'flex';
  head.style.justifyContent = 'space-between';
  head.style.alignItems = 'baseline';
  head.style.gap = '0.75rem';

  const name = el('span', undefined, label);
  name.style.fontSize = '0.875rem';
  name.style.color = 'var(--cb-text)';

  const value = el('span', undefined, valueLabel ?? `${percent}%`);
  value.style.fontFamily = 'ui-monospace, monospace';
  value.style.fontSize = '0.75rem';
  value.style.color = 'var(--cb-text-muted)';

  head.append(name, value);

  const track = el('div', 'nav-bar-track');
  track.setAttribute('role', 'img');
  track.setAttribute('aria-label', `${label}: ${valueLabel ?? `${percent}%`}`);
  const fill = el('div', 'nav-bar-fill');
  fill.style.setProperty('--nav-accent', accent);
  fill.style.width = '0%';
  track.appendChild(fill);

  // Animate on the next frame so the bar reads as a measurement settling.
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      fill.style.width = `${Math.max(0, Math.min(100, percent))}%`;
    }),
  );

  wrap.append(head, track);
  return wrap;
}

function section(heading: string, blurb?: string): HTMLElement {
  const s = el('section');
  s.style.marginBottom = '2.5rem';
  const h = el('h2', undefined, heading);
  h.style.fontSize = '1.35rem';
  h.style.fontWeight = '700';
  h.style.letterSpacing = '-0.01em';
  h.style.color = 'var(--cb-text)';
  h.style.marginBottom = blurb ? '0.35rem' : '1rem';
  s.appendChild(h);
  if (blurb) {
    const p = el('p', undefined, blurb);
    p.style.fontSize = '0.9rem';
    p.style.lineHeight = '1.6';
    p.style.color = 'var(--cb-text-sub)';
    p.style.maxWidth = '62ch';
    p.style.marginBottom = '1.1rem';
    s.appendChild(p);
  }
  return s;
}

/* ═══ Sections ════════════════════════════════════════════════════ */

function renderMatches(result: AssessmentResult): HTMLElement {
  const s = section(
    'Your strongest matches',
    'These are the roles whose day-to-day work most closely resembles the choices you kept making. A percentage here is a similarity score, not a probability of success.',
  );

  const list = el('div');
  list.style.display = 'flex';
  list.style.flexDirection = 'column';
  list.style.gap = '1.1rem';

  for (const match of result.matches.slice(0, 6)) {
    const row = el('div');

    const link = el('a');
    link.href = `/navigator/roles/${match.slug}/`;
    link.style.textDecoration = 'none';
    link.appendChild(bar(match.role.name, match.percent, accentFor(match)));
    row.appendChild(link);

    const meta = el('p');
    meta.style.fontSize = '0.8rem';
    meta.style.color = 'var(--cb-text-muted)';
    meta.style.marginTop = '0.35rem';
    meta.textContent = match.role.domains.map((d) => DOMAIN_BY_ID[d].name).join(' + ');

    if (match.intersection) {
      const flag = el('span', undefined, '  ·  sits between both of these for you');
      flag.style.color = 'var(--nav-cyan)';
      flag.style.fontWeight = '600';
      meta.appendChild(flag);
    }
    row.appendChild(meta);
    list.appendChild(row);
  }

  s.appendChild(list);
  return s;
}

function renderWhy(result: AssessmentResult): HTMLElement {
  const s = section(
    'Why these appeared',
    'Every one of these is something you actually chose. Nothing here is inferred from a personality model.',
  );

  const list = el('ul');
  list.style.display = 'flex';
  list.style.flexDirection = 'column';
  list.style.gap = '0.5rem';
  list.style.listStyle = 'none';
  list.style.padding = '0';

  for (const driver of result.drivers) {
    const li = el('li');
    li.style.display = 'flex';
    li.style.gap = '0.6rem';
    li.style.fontSize = '0.9rem';
    li.style.lineHeight = '1.55';
    li.style.color = 'var(--cb-text-sub)';

    const dot = el('span');
    dot.style.flexShrink = '0';
    dot.style.marginTop = '0.55rem';
    dot.style.width = '0.35rem';
    dot.style.height = '0.35rem';
    dot.style.borderRadius = '9999px';
    dot.style.background = 'var(--cb-accent)';

    li.append(dot, el('span', undefined, `You were drawn to ${driver}.`));
    list.appendChild(li);
  }

  s.appendChild(list);
  return s;
}

function renderPattern(result: AssessmentResult): HTMLElement {
  const s = section(
    'Your interest pattern',
    'The shape underneath the role names. This is what actually gets compared against each role — the job titles are a consequence of it.',
  );

  const grid = el('div');
  grid.style.display = 'grid';
  grid.style.gap = '1.75rem';

  const groups: DimensionGroup[] = ['domain', 'style', 'abstraction', 'security', 'work'];

  for (const group of groups) {
    const ranked = rankDimensions(result.normalized, group).slice(0, 6);
    // Security only means something for people who showed security interest.
    // Rendering an empty group would imply they scored zero on something they
    // were never actually asked about.
    if (ranked.length === 0) continue;

    const block = el('div');
    const h = el('h3', undefined, GROUP_LABEL[group]);
    h.style.fontSize = '0.7rem';
    h.style.fontWeight = '700';
    h.style.textTransform = 'uppercase';
    h.style.letterSpacing = '0.08em';
    h.style.color = 'var(--cb-text-muted)';
    h.style.marginBottom = '0.7rem';
    block.appendChild(h);

    const bars = el('div');
    bars.style.display = 'flex';
    bars.style.flexDirection = 'column';
    bars.style.gap = '0.6rem';

    for (const [id, value] of ranked) {
      const dimension = DIMENSION_BY_ID[id];
      const percent = Math.round(value * 100);
      // Domain bars carry their field's colour so the pattern chart reads as the
      // same map as the rest of the site; every other group uses the site accent.
      const domainForBar = group === 'domain' ? DOMAIN_BY_ID[id.replace('dom.', '') as DomainId] : null;
      const accent = domainForBar ? `var(${ACCENT_VAR[domainForBar.accent]})` : 'var(--cb-accent)';
      const b = bar(dimension.label, percent, accent);
      const note = el('p', undefined, dimension.blurb);
      note.style.fontSize = '0.72rem';
      note.style.color = 'var(--cb-text-muted)';
      note.style.marginTop = '0.15rem';
      b.appendChild(note);
      bars.appendChild(b);
    }

    block.appendChild(bars);
    grid.appendChild(block);
  }

  s.appendChild(grid);
  return s;
}

function renderIntersections(result: AssessmentResult): HTMLElement | null {
  const intersections = result.matches.slice(0, 8).filter((m) => m.intersection);
  if (intersections.length === 0) return null;

  const s = section(
    'You are sitting between two fields',
    'This is a result, not a problem to resolve. The roles below exist precisely because organisations need people who work across both, and they are usually harder to hire for — which tends to show up in the pay.',
  );

  const grid = el('div');
  grid.style.display = 'grid';
  grid.style.gap = '0.75rem';

  for (const match of intersections.slice(0, 4)) {
    const card = el('a', 'nav-card nav-card--railed');
    card.href = `/navigator/roles/${match.slug}/`;
    card.style.setProperty('--nav-accent', 'var(--nav-cyan)');
    card.style.display = 'block';
    card.style.padding = '1rem 1rem 1rem 1.25rem';
    card.style.textDecoration = 'none';

    const pair = el('p');
    pair.style.fontSize = '0.7rem';
    pair.style.fontWeight = '700';
    pair.style.textTransform = 'uppercase';
    pair.style.letterSpacing = '0.06em';
    pair.style.color = 'var(--nav-cyan)';
    pair.textContent = match.intersection!.map((d) => DOMAIN_BY_ID[d].name).join('  +  ');

    const name = el('p', undefined, match.role.name);
    name.style.fontWeight = '600';
    name.style.color = 'var(--cb-text)';
    name.style.margin = '0.25rem 0 0.2rem';

    const purpose = el('p', undefined, match.role.purpose);
    purpose.style.fontSize = '0.875rem';
    purpose.style.lineHeight = '1.55';
    purpose.style.color = 'var(--cb-text-sub)';

    card.append(pair, name, purpose);
    grid.appendChild(card);
  }

  s.appendChild(grid);
  return s;
}

function renderConfidence(result: AssessmentResult): HTMLElement {
  const card = el('div', 'nav-card');
  card.style.padding = '1.25rem';
  card.style.marginBottom = '2.5rem';
  card.style.setProperty(
    '--nav-accent',
    result.confidence.level === 'high' ? 'var(--nav-emerald)' : 'var(--nav-warn)',
  );

  const label = el(
    'p',
    undefined,
    result.confidence.level === 'high'
      ? 'Clear signal'
      : result.confidence.level === 'moderate'
        ? 'Reasonable signal'
        : 'Not enough signal yet',
  );
  label.style.fontSize = '0.7rem';
  label.style.fontWeight = '700';
  label.style.textTransform = 'uppercase';
  label.style.letterSpacing = '0.08em';
  label.style.color = 'var(--cb-text-muted)';
  label.style.marginBottom = '0.4rem';

  const message = el('p', undefined, result.confidence.message);
  message.style.fontSize = '0.9rem';
  message.style.lineHeight = '1.6';
  message.style.color = 'var(--cb-text-sub)';
  message.style.maxWidth = '64ch';

  card.append(label, message);
  return card;
}

function renderNextSteps(result: AssessmentResult): HTMLElement {
  const top = result.matches[0];
  const s = section('Where to go from here');

  const grid = el('div');
  grid.style.display = 'grid';
  grid.style.gap = '0.75rem';

  const primary = el('a', 'nav-card nav-card--railed');
  primary.href = `/navigator/roles/${top.slug}/`;
  primary.style.setProperty('--nav-accent', accentFor(top));
  primary.style.display = 'block';
  primary.style.padding = '1.1rem 1.1rem 1.1rem 1.35rem';
  primary.style.textDecoration = 'none';

  const primaryTitle = el('p', undefined, `Explore ${top.role.name}`);
  primaryTitle.style.fontWeight = '700';
  primaryTitle.style.color = 'var(--cb-text)';
  const primaryBody = el(
    'p',
    undefined,
    'What the job involves day to day, the technologies, the honest downside, where it leads next, and only then the certifications.',
  );
  primaryBody.style.fontSize = '0.875rem';
  primaryBody.style.lineHeight = '1.55';
  primaryBody.style.color = 'var(--cb-text-sub)';
  primaryBody.style.marginTop = '0.25rem';
  primary.append(primaryTitle, primaryBody);

  const map = el('a', 'nav-card');
  map.href = '/navigator/explore/';
  map.style.display = 'block';
  map.style.padding = '1.1rem';
  map.style.textDecoration = 'none';
  const mapTitle = el('p', undefined, 'Browse the whole map instead');
  mapTitle.style.fontWeight = '700';
  mapTitle.style.color = 'var(--cb-text)';
  const mapBody = el(
    'p',
    undefined,
    'Nothing here is binding. Reading three roles you did not match with is often more useful than reading the one you did.',
  );
  mapBody.style.fontSize = '0.875rem';
  mapBody.style.lineHeight = '1.55';
  mapBody.style.color = 'var(--cb-text-sub)';
  mapBody.style.marginTop = '0.25rem';
  map.append(mapTitle, mapBody);

  grid.append(primary, map);
  s.appendChild(grid);
  return s;
}

/* ═══ Close calls ═════════════════════════════════════════════════ */

/**
 * The page already refuses to fake precision when two roles land a couple of
 * points apart. Saying "these are the same answer" is honest but leaves the
 * person exactly where they started, so where a comparison exists, offer it.
 *
 * Which pairs have a page is decided at build time from the role graph, and the
 * list is embedded in this page rather than computed here — adjacency lives in
 * role content, which deliberately never reaches the browser.
 */
const CLOSE_WITHIN = 8;

function knownPairs(): Set<string> {
  const node = document.getElementById('nav-pairs');
  if (!node || !node.textContent) return new Set();
  try {
    return new Set(JSON.parse(node.textContent) as string[]);
  } catch {
    return new Set();
  }
}

function renderCloseCalls(result: AssessmentResult): HTMLElement | null {
  const pairs = knownPairs();
  if (pairs.size === 0) return null;

  const top = result.matches.slice(0, 4);
  const close: Array<[string, string, string]> = [];

  for (let i = 0; i < top.length; i++) {
    for (let j = i + 1; j < top.length; j++) {
      if (top[i].percent - top[j].percent > CLOSE_WITHIN) continue;
      const [x, y] = top[i].slug < top[j].slug ? [top[i], top[j]] : [top[j], top[i]];
      if (!pairs.has(`${x.slug}--${y.slug}`)) continue;
      close.push([x.slug, y.slug, `${x.role.name} vs ${y.role.name}`]);
    }
  }
  if (close.length === 0) return null;

  const s = section(
    'Two of these came out almost the same',
    'That is the scoring being accurate rather than vague — these roles really do overlap. Here is what actually separates them.',
  );

  const grid = el('div');
  grid.style.display = 'grid';
  grid.style.gap = '0.5rem';

  for (const [x, y, label] of close.slice(0, 3)) {
    const link = el('a', 'nav-card');
    link.href = `/navigator/compare/${x}-vs-${y}/`;
    link.style.display = 'block';
    link.style.padding = '0.85rem 1rem';
    link.style.textDecoration = 'none';

    const title = el('p', undefined, `${label} →`);
    title.style.fontWeight = '600';
    title.style.fontSize = '0.9rem';
    title.style.color = 'var(--cb-accent-text)';
    link.appendChild(title);
    grid.appendChild(link);
  }

  s.appendChild(grid);
  return s;
}

/* ═══ Entry point ═════════════════════════════════════════════════ */

export function renderResults(root: HTMLElement, result: AssessmentResult): void {
  root.replaceChildren();
  root.appendChild(renderConfidence(result));
  root.appendChild(renderMatches(result));

  const closeCalls = renderCloseCalls(result);
  if (closeCalls) root.appendChild(closeCalls);

  const intersections = renderIntersections(result);
  if (intersections) root.appendChild(intersections);

  root.appendChild(renderWhy(result));
  root.appendChild(renderPattern(result));
  root.appendChild(renderNextSteps(result));
}
