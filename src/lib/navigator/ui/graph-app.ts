/**
 * The career map application.
 *
 * Progressive enhancement over the server-rendered SVG in CareerGraph.astro:
 * the page is a complete, crawlable, keyboard-navigable drawing of the graph
 * before this file runs. What this adds is the things a drawing cannot do —
 * route between two roles, explain a move, overlay skills and certifications,
 * and keep you on the map while you read.
 *
 * Deliberate choices:
 *  • No graph library. The layout is already computed at build time with label
 *    placement and a legibility assertion; a general-purpose engine would
 *    replace that with worse labels and add more JavaScript than the whole
 *    site currently ships.
 *  • Routing follows authored moves in the direction they were authored. A
 *    reverse move nobody wrote is not evidence that the move makes sense, so
 *    the honest answer to "no route" is to say so.
 *  • Nothing is sent anywhere. State lives in the URL fragment (which browsers
 *    do not send to servers) and in this browser.
 */

export type Mode = 'explore' | 'path' | 'entry' | 'compare' | 'skills' | 'certs';

interface RoleRecord {
  slug: string;
  name: string;
  purpose: string;
  label: string;
  domains: string[];
  fieldNames: string[];
  entry: 'first-job' | 'second-job' | 'senior';
  degree: number;
  x: number;
  y: number;
  r: number;
  reality: string;
  technologies: string[];
  certs: Array<{ title: string; stage: string; reason: string; href: string | null }>;
  trials: Array<{ slug: string; name: string; time: string; cost: string }>;
  pathSlug: string | null;
  entryPay: string | null;
}

interface MoveRecord {
  from: string;
  to: string;
  reason: string;
  mutual: boolean;
}

interface Payload {
  schemaVersion: number;
  fields: Array<{ id: string; name: string; accent: string }>;
  roles: RoleRecord[];
  moves: MoveRecord[];
  technologies: Array<{ slug: string; name: string; aka: string[]; blurb: string; roles: string[] }>;
  certifications: Array<{ key: string; title: string; href: string | null; roles: Array<{ slug: string; stage: string }> }>;
  comparisons: Array<{ a: string; b: string; overlap: number; href: string }>;
  viewBox: { x: number; y: number; width: number; height: number };
}

interface State {
  mode: Mode;
  role: string | null;
  from: string | null;
  to: string | null;
  compareA: string | null;
  compareB: string | null;
  tech: string | null;
  cert: string | null;
  field: string;
  mine: boolean;
}

const STORAGE_KEY = 'cb-nav-map-v1';
const INVENTORY_KEY = 'cb-nav-inventory-v1';
const ENTRY_LABEL: Record<RoleRecord['entry'], string> = {
  'first-job': 'Reachable as a first job',
  'second-job': 'Usually a second job',
  senior: 'A senior destination',
};

const MODE_HINT: Record<Mode, string> = {
  explore: 'Pick any role to see what it connects to, what it pays to start, and what it leads to.',
  path: 'Choose where you are now, then where you want to get to. Routes follow moves people actually make.',
  entry: 'These roles can be reached with no IT experience. Pick one to see everything it opens up.',
  compare: 'Pick two roles that look similar. Only pairs worth comparing are offered.',
  skills: 'Search a technology to see which roles use it — or highlight everything you have already touched.',
  certs: 'Pick a certification to see the roles that actually ask for it, and at which stage.',
};

function esc(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function initCareerMap(): void {
  const root = document.querySelector<HTMLElement>('.nav-map');
  const graph = document.querySelector<HTMLElement>('.nav-graph');
  const svg = document.getElementById('nav-graph-svg') as SVGSVGElement | null;
  if (!root || !graph || !svg) return;

  const nodes = Array.from(svg.querySelectorAll<SVGGElement>('.nav-graph__node'));
  const edges = Array.from(svg.querySelectorAll<SVGLineElement>('.nav-graph__edge'));
  const nodeBySlug = new Map<string, SVGGElement>();
  for (const node of nodes) nodeBySlug.set(node.dataset.slug ?? '', node);

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Pre-data behaviour: hover/focus still reveals connections ─────── */
  let data: Payload | null = null;

  function setDim(keep: Set<string> | null): void {
    if (!keep) {
      graph!.classList.remove('is-filtered');
      for (const n of nodes) n.removeAttribute('data-dim');
      for (const e of edges) e.removeAttribute('data-dim');
      return;
    }
    graph!.classList.add('is-filtered');
    for (const n of nodes) n.setAttribute('data-dim', keep.has(n.dataset.slug ?? '') ? '0' : '1');
    for (const e of edges) {
      const on = keep.has(e.dataset.a ?? '') && keep.has(e.dataset.b ?? '');
      e.setAttribute('data-dim', on ? '0' : '1');
    }
  }

  function neighbourSet(node: SVGGElement): Set<string> {
    const keep = new Set<string>([node.dataset.slug ?? '']);
    for (const s of (node.dataset.neighbours ?? '').split(' ')) if (s) keep.add(s);
    return keep;
  }

  for (const node of nodes) {
    node.addEventListener('mouseenter', () => {
      if (!data) setDim(neighbourSet(node));
      else if (!state.role && state.mode === 'explore' && state.field === 'all' && !state.tech && !state.cert) {
        hoverSlug = node.dataset.slug ?? null;
        paint();
      }
    });
    node.addEventListener('mouseleave', () => {
      if (!data) setDim(null);
      else if (hoverSlug) {
        hoverSlug = null;
        paint();
      }
    });
  }

  /* ── Viewport (pan / zoom) ────────────────────────────────────────── */
  const base = (() => {
    const [x, y, width, height] = (svg.getAttribute('viewBox') ?? '0 0 1280 880').split(/\s+/).map(Number);
    return { x, y, width, height };
  })();
  let view = { ...base };

  function applyView(): void {
    svg!.setAttribute('viewBox', `${view.x} ${view.y} ${view.width} ${view.height}`);
  }

  /**
   * The shape of the box the drawing is actually being rendered into.
   *
   * Everything below derives the view's height from its width using this
   * rather than the viewBox's own fixed proportions. The drawing is about
   * 1.8:1 and its container is nearer square once the detail panel has taken
   * a column, and an SVG reconciles that by letterboxing: close to half the
   * canvas was empty bands above and below the map, the drawing was scaled
   * down to fit the dimension it did not need, and every label shrank with
   * it — which is why the names were arriving on screen at about six pixels
   * and why so little of the map fitted before anyone had to pan.
   *
   * It also settles the pointer arithmetic. `svgPoint` maps client
   * coordinates as though the viewBox filled the element, which under
   * letterboxing it did not, so dragging moved the map less than the cursor
   * on whichever axis was being padded. Matching the aspect makes that
   * mapping exact rather than approximately right.
   */
  function boxAspect(): number {
    const rect = svg!.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return base.height / base.width;
    return rect.height / rect.width;
  }

  /**
   * Re-proportion the current view when the box changes shape.
   *
   * Holds the vertical coverage and derives the width from it, which holds the
   * magnification: the detail panel takes a column of canvas away and gives
   * back the same map at the same size, minus the strip the panel is standing
   * on. Deriving it the other way around would rescale the whole drawing every
   * time a role was opened or closed, and a map that changes size underneath
   * you while you are reading it is worse than one that is slightly too small.
   *
   * The exception is the whole-map view on a tall, narrow window, where there
   * is no width to hold: that is grown to fit rather than quietly cropped.
   */
  function reshape(): void {
    const aspect = boxAspect();
    let width = view.height / aspect;
    if (view.height >= base.height && width < base.width) width = base.width;
    const height = aspect * width;
    const cx = view.x + view.width / 2;
    const cy = view.y + view.height / 2;
    view = { x: cx - width / 2, y: cy - height / 2, width, height };
    applyView();
  }

  function clampZoom(width: number): number {
    return Math.min(Math.max(width, base.width / 6), base.width * 1.6);
  }

  function zoomTo(width: number, cx?: number, cy?: number): void {
    const next = clampZoom(width);
    const height = boxAspect() * next;
    const px = cx ?? view.x + view.width / 2;
    const py = cy ?? view.y + view.height / 2;
    view = {
      width: next,
      height,
      x: px - (px - view.x) * (next / view.width),
      y: py - (py - view.y) * (height / view.height),
    };
    applyView();
  }

  function svgPoint(clientX: number, clientY: number): { x: number; y: number } {
    const rect = svg!.getBoundingClientRect();
    return {
      x: view.x + ((clientX - rect.left) / rect.width) * view.width,
      y: view.y + ((clientY - rect.top) / rect.height) * view.height,
    };
  }

  function fitTo(slugs: string[]): void {
    if (!data) return;
    const points = slugs.map((s) => data!.roles.find((r) => r.slug === s)).filter(Boolean) as RoleRecord[];
    if (points.length === 0) return reset();
    const aspect = boxAspect();
    const pad = 140;
    const x1 = Math.min(...points.map((p) => p.x)) - pad;
    const x2 = Math.max(...points.map((p) => p.x)) + pad;
    const y1 = Math.min(...points.map((p) => p.y)) - pad;
    const y2 = Math.max(...points.map((p) => p.y)) + pad;
    // Never zoom out past the whole map. The padding is generous so that a
    // couple of highlighted roles are not pressed against the edge, and on a
    // wide, short canvas that generosity was enough to make "Fit" with nothing
    // selected show a smaller map than "Reset" does — more empty margin than
    // the entire drawing needs.
    const wholeMap = Math.max(base.width, base.height / aspect);
    const width = Math.min(wholeMap, clampZoom(Math.max(x2 - x1, (y2 - y1) / aspect)));
    const height = aspect * width;
    view = { x: (x1 + x2) / 2 - width / 2, y: (y1 + y2) / 2 - height / 2, width, height };
    applyView();
  }

  /** The whole map, filling the box rather than letterboxed inside it. */
  function reset(): void {
    view = { ...base };
    reshape();
  }

  // The box changes shape on a window resize, on entering full screen, and
  // every time the detail panel takes or gives back its column. Observing it
  // is what keeps the drawing filling the canvas in all of those cases; the
  // first callback fires on observe, which is also what sets the opening
  // view, so there is no separate initialisation.
  if (typeof ResizeObserver !== 'undefined') {
    let frame = 0;
    new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(reshape);
    }).observe(svg);
  }

  // Dragging to pan, on the background only — dragging from a node would fight
  // with clicking it.
  let dragging: { x: number; y: number } | null = null;
  const touches = new Map<number, { x: number; y: number }>();
  let pinch: { distance: number } | null = null;

  svg.addEventListener('pointerdown', (event) => {
    touches.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (touches.size === 2) {
      const [a, b] = [...touches.values()];
      pinch = { distance: Math.hypot(a.x - b.x, a.y - b.y) };
      dragging = null;
      return;
    }
    if ((event.target as Element).closest('.nav-graph__node')) return;
    dragging = { x: event.clientX, y: event.clientY };
    svg.setPointerCapture(event.pointerId);
    graph.classList.add('is-dragging');
  });

  svg.addEventListener('pointermove', (event) => {
    if (touches.has(event.pointerId)) touches.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pinch && touches.size === 2) {
      const [a, b] = [...touches.values()];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      if (distance > 0 && pinch.distance > 0) {
        const centre = svgPoint((a.x + b.x) / 2, (a.y + b.y) / 2);
        zoomTo(view.width * (pinch.distance / distance), centre.x, centre.y);
      }
      pinch = { distance };
      return;
    }

    if (!dragging) return;
    const rect = svg.getBoundingClientRect();
    view.x -= ((event.clientX - dragging.x) / rect.width) * view.width;
    view.y -= ((event.clientY - dragging.y) / rect.height) * view.height;
    dragging = { x: event.clientX, y: event.clientY };
    applyView();
  });

  const endPointer = (event: PointerEvent) => {
    touches.delete(event.pointerId);
    if (touches.size < 2) pinch = null;
    dragging = null;
    graph.classList.remove('is-dragging');
  };
  svg.addEventListener('pointerup', endPointer);
  svg.addEventListener('pointercancel', endPointer);

  // Ctrl/⌘ + wheel zooms. Plain wheel keeps scrolling the page, because
  // hijacking the scroll of a page that is still a document is hostile.
  svg.addEventListener(
    'wheel',
    (event) => {
      if (!event.ctrlKey && !event.metaKey && !document.fullscreenElement) return;
      event.preventDefault();
      const point = svgPoint(event.clientX, event.clientY);
      zoomTo(view.width * (event.deltaY > 0 ? 1.15 : 0.87), point.x, point.y);
    },
    { passive: false },
  );

  /* ── State ────────────────────────────────────────────────────────── */
  const state: State = {
    mode: 'explore',
    role: null,
    from: null,
    to: null,
    compareA: null,
    compareB: null,
    tech: null,
    cert: null,
    field: 'all',
    mine: false,
  };
  let hoverSlug: string | null = null;

  const bar = root.querySelector<HTMLElement>('.nav-map__bar')!;
  const hint = document.getElementById('nav-map-hint')!;
  const status = document.getElementById('nav-map-status')!;
  const panel = document.getElementById('nav-map-panel') as HTMLElement;
  const panelBody = document.getElementById('nav-map-panel-body') as HTMLElement;
  const search = document.getElementById('nav-map-search') as HTMLInputElement;
  const results = document.getElementById('nav-map-results') as HTMLElement;
  const overlay = document.getElementById('nav-map-route') as unknown as SVGGElement;

  /* ── Indexes ──────────────────────────────────────────────────────── */
  let roleBySlug = new Map<string, RoleRecord>();
  let outMoves = new Map<string, MoveRecord[]>();
  let inMoves = new Map<string, MoveRecord[]>();
  let comparisonsFor = new Map<string, Array<{ other: string; overlap: number; href: string }>>();

  function buildIndexes(payload: Payload): void {
    roleBySlug = new Map(payload.roles.map((r) => [r.slug, r]));
    outMoves = new Map();
    inMoves = new Map();
    for (const move of payload.moves) {
      if (!outMoves.has(move.from)) outMoves.set(move.from, []);
      if (!inMoves.has(move.to)) inMoves.set(move.to, []);
      outMoves.get(move.from)!.push(move);
      inMoves.get(move.to)!.push(move);
    }
    comparisonsFor = new Map();
    for (const c of payload.comparisons) {
      if (!comparisonsFor.has(c.a)) comparisonsFor.set(c.a, []);
      if (!comparisonsFor.has(c.b)) comparisonsFor.set(c.b, []);
      comparisonsFor.get(c.a)!.push({ other: c.b, overlap: c.overlap, href: c.href });
      comparisonsFor.get(c.b)!.push({ other: c.a, overlap: c.overlap, href: c.href });
    }
  }

  /** Fewest authored moves from → to. Direction matters; no reverse guessing. */
  function route(from: string, to: string): MoveRecord[] | null {
    if (from === to) return [];
    const previous = new Map<string, MoveRecord>();
    const seen = new Set<string>([from]);
    const queue = [from];
    while (queue.length > 0) {
      const current = queue.shift()!;
      for (const move of outMoves.get(current) ?? []) {
        if (seen.has(move.to)) continue;
        seen.add(move.to);
        previous.set(move.to, move);
        if (move.to === to) {
          const steps: MoveRecord[] = [];
          let cursor = to;
          while (cursor !== from) {
            const step = previous.get(cursor)!;
            steps.unshift(step);
            cursor = step.from;
          }
          return steps;
        }
        queue.push(move.to);
      }
    }
    return null;
  }

  /**
   * The shortest authored route from `from` into any role in `targets`.
   *
   * Same breadth-first walk as `route`, stopping at the first member of a set
   * rather than at one named role. It exists for the dead end: picking Data
   * while Wireless Engineer is open is a fair question with a depressing
   * answer — no direct move — and "everything is faded" is not what the person
   * wanted to know. What they wanted is how to get there, which the map knows.
   */
  function routeIntoSet(from: string, targets: Set<string>): MoveRecord[] | null {
    if (targets.has(from)) return [];
    const previous = new Map<string, MoveRecord>();
    const seen = new Set<string>([from]);
    const queue = [from];
    while (queue.length > 0) {
      const current = queue.shift()!;
      for (const move of outMoves.get(current) ?? []) {
        if (seen.has(move.to)) continue;
        seen.add(move.to);
        previous.set(move.to, move);
        if (targets.has(move.to)) {
          const steps: MoveRecord[] = [];
          let cursor = move.to;
          while (cursor !== from) {
            const step = previous.get(cursor)!;
            steps.unshift(step);
            cursor = step.from;
          }
          return steps;
        }
        queue.push(move.to);
      }
    }
    return null;
  }

  /** Roles reachable from a role, keyed by how many moves away they are. */
  function hopsFrom(start: string): Map<string, number> {
    const hops = new Map<string, number>([[start, 0]]);
    const queue = [start];
    while (queue.length > 0) {
      const current = queue.shift()!;
      for (const move of outMoves.get(current) ?? []) {
        if (hops.has(move.to)) continue;
        hops.set(move.to, hops.get(current)! + 1);
        queue.push(move.to);
      }
    }
    return hops;
  }

  function inventorySlugs(): string[] {
    try {
      const raw = window.localStorage.getItem(INVENTORY_KEY);
      const parsed = raw ? (JSON.parse(raw) as unknown) : [];
      return Array.isArray(parsed) ? (parsed as string[]) : [];
    } catch {
      return [];
    }
  }

  /* ── Painting ─────────────────────────────────────────────────────── */
  function highlightSets(): {
    keep: Set<string> | null;
    marks: Map<string, string>;
    routeSteps: MoveRecord[] | null;
    fieldStat: { inside: number; total: number } | null;
    offField: Set<string>;
    /** Set when the drawn route is a bridge into the chosen field, not a mode. */
    fieldBridge: MoveRecord[] | null;
  } {
    const marks = new Map<string, string>();
    let keep: Set<string> | null = null;
    let routeSteps: MoveRecord[] | null = null;
    let fieldBridge: MoveRecord[] | null = null;

    /* The field is applied at the END of this function, not here.
       Every branch below assigns `keep` outright, so a field set computed now
       was simply overwritten — which is exactly what used to happen. Picking
       Cybersecurity in any mode but plain Explore, or while a role was open,
       lit the chip and changed nothing on screen; Ways in, Data and Support
       all drew the identical picture. */
    const fieldSet =
      state.field === 'all'
        ? null
        : new Set(
            data!.roles
              .filter((role) =>
                state.field === 'first-job' ? role.entry === 'first-job' : role.domains.includes(state.field),
              )
              .map((role) => role.slug),
          );

    if (state.mode === 'entry') {
      const focus = state.role;
      keep = new Set<string>();
      if (focus) {
        for (const [slug, hop] of hopsFrom(focus)) {
          keep.add(slug);
          marks.set(slug, hop === 0 ? 'primary' : `hop${Math.min(hop, 3)}`);
        }
      } else {
        for (const role of data!.roles) if (role.entry === 'first-job') keep.add(role.slug);
      }
    } else if (state.mode === 'path' && state.from && state.to) {
      routeSteps = route(state.from, state.to);
      if (routeSteps) {
        keep = new Set<string>([state.from]);
        for (const step of routeSteps) keep.add(step.to);
        marks.set(state.from, 'from');
        marks.set(state.to, 'to');
      }
    } else if (state.mode === 'compare') {
      if (state.compareA) marks.set(state.compareA, 'from');
      if (state.compareB) marks.set(state.compareB, 'to');
      if (state.compareA && !state.compareB) {
        keep = new Set<string>([state.compareA, ...(comparisonsFor.get(state.compareA) ?? []).map((c) => c.other)]);
      }
    } else if (state.mode === 'skills') {
      if (state.mine) {
        const owned = new Set(inventorySlugs());
        keep = new Set<string>();
        for (const tech of data!.technologies) {
          if (!owned.has(tech.slug)) continue;
          for (const slug of tech.roles) {
            keep.add(slug);
            marks.set(slug, 'primary');
          }
        }
      } else if (state.tech) {
        const tech = data!.technologies.find((t) => t.slug === state.tech);
        keep = new Set<string>(tech?.roles ?? []);
        for (const slug of tech?.roles ?? []) marks.set(slug, 'primary');
      }
    } else if (state.mode === 'certs' && state.cert) {
      const cert = data!.certifications.find((c) => c.key === state.cert);
      keep = new Set<string>((cert?.roles ?? []).map((r) => r.slug));
      for (const r of cert?.roles ?? []) marks.set(r.slug, 'primary');
    }

    const focusSlug = state.role ?? hoverSlug;
    const focusApplies = state.mode === 'explore' || state.mode === 'skills' || state.mode === 'certs';
    if (focusSlug && focusApplies) {
      const related = new Set<string>([focusSlug]);
      for (const move of outMoves.get(focusSlug) ?? []) related.add(move.to);
      for (const move of inMoves.get(focusSlug) ?? []) related.add(move.from);
      keep = keep ? new Set([...keep].filter((s) => related.has(s) || s === focusSlug)) : related;
      for (const slug of related) if (!marks.has(slug)) marks.set(slug, 'secondary');
      marks.set(focusSlug, 'primary');
      if (keep.size < 2) keep = related;
    }

    /* The field, applied last so it composes with whatever the mode singled
       out rather than being replaced by it.

       With nothing else on screen it filters outright, as it always did. With
       a focused role or a drawn route it must not delete nodes — half a route
       is a lie — so those roles stay drawn and are marked instead, and the hint
       reports the count. Either way the chip visibly does something, which is
       the entire point of a filter. */
    let fieldStat: { inside: number; total: number } | null = null;
    const offField = new Set<string>();
    if (fieldSet) {
      if (!keep) {
        keep = fieldSet;
        fieldStat = { inside: fieldSet.size, total: data!.roles.length };
      } else {
        let inside = 0;
        for (const slug of keep) {
          if (fieldSet.has(slug)) inside += 1;
          else if (slug !== focusSlug) offField.add(slug);
        }
        fieldStat = { inside, total: keep.size };

        /* Nothing next to this role belongs to the field. Three chips in a row
           can produce that answer, and three identical faded pictures read as a
           broken filter rather than as three honest noes. So answer the question
           the click was really asking — how do I get from here to there — by
           drawing the shortest authored route into the field instead. */
        if (inside === 0 && focusSlug && !routeSteps && state.mode === 'explore') {
          const bridge = routeIntoSet(focusSlug, fieldSet);
          if (bridge && bridge.length > 0) {
            routeSteps = bridge;
            fieldBridge = bridge;
            keep = new Set<string>([focusSlug, ...bridge.map((step) => step.to)]);
            offField.clear();
            for (const slug of keep) if (!fieldSet.has(slug) && slug !== focusSlug) offField.add(slug);
            marks.set(focusSlug, 'from');
            marks.set(bridge[bridge.length - 1].to, 'to');
          }
        }
      }
    }

    return { keep, marks, routeSteps, fieldStat, offField, fieldBridge };
  }

  /**
   * One arrow from `from` to `to`, trimmed clear of both dots.
   *
   * The trim is asymmetric on purpose: the arrowhead needs more clearance than
   * the tail or it sits inside the target dot.
   */
  function arrow(from: string, to: string, className: string): SVGLineElement | null {
    const a = roleBySlug.get(from);
    const b = roleBySlug.get(to);
    if (!a || !b) return null;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const length = Math.hypot(dx, dy) || 1;
    const ux = dx / length;
    const uy = dy / length;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', String(a.x + ux * (a.r + 3)));
    line.setAttribute('y1', String(a.y + uy * (a.r + 3)));
    line.setAttribute('x2', String(b.x - ux * (b.r + 9)));
    line.setAttribute('y2', String(b.y - uy * (b.r + 9)));
    line.setAttribute('class', className);
    line.setAttribute('marker-end', className.includes('is-in') ? 'url(#nav-map-arrow-in)' : 'url(#nav-map-arrow)');
    return line;
  }

  function drawRoute(steps: MoveRecord[] | null): void {
    overlay.textContent = '';
    if (!steps || steps.length === 0) return;
    for (const step of steps) {
      const line = arrow(step.from, step.to, 'nav-map__route-line');
      if (line) overlay.appendChild(line);
    }
  }

  /**
   * The moves in and out of the focused role, drawn as travelling arrows.
   *
   * An undirected grey line between two dots says they are related. It does not
   * say which way people actually move, which is the one thing the map exists
   * to answer — so when a role is open its own moves are redrawn on top as
   * directed, animated paths: outward in the accent, inward in the role's own
   * field colour, each flowing toward its destination. Follow the motion and
   * you are following a career.
   *
   * Static under prefers-reduced-motion: the arrowheads still carry direction,
   * so nothing is lost but the movement.
   */
  function drawFlow(focus: string | null): void {
    if (!focus) return;
    for (const move of outMoves.get(focus) ?? []) {
      const line = arrow(focus, move.to, 'nav-map__flow is-out');
      if (line) overlay.appendChild(line);
    }
    for (const move of inMoves.get(focus) ?? []) {
      const line = arrow(move.from, focus, 'nav-map__flow is-in');
      if (line) overlay.appendChild(line);
    }
  }

  /** The chip's own label, so the hint can name what was actually clicked. */
  function fieldLabel(): string {
    if (state.field === 'first-job') return 'Ways in';
    return data!.fields.find((f) => f.id === state.field)?.name ?? state.field;
  }

  /**
   * What the hint says once a field is on.
   *
   * A mode description is the right thing to read before you touch anything and
   * the wrong thing to keep reading afterwards. With a field selected the hint
   * becomes the answer to the question the click asked — how much of this is
   * Cybersecurity? — which is also the proof that the chip did something.
   */
  function hintText(
    fieldStat: { inside: number; total: number } | null,
    fieldBridge: MoveRecord[] | null,
  ): string {
    if (!fieldStat) return MODE_HINT[state.mode];
    const { inside, total } = fieldStat;
    const entry = state.field === 'first-job';
    const name = fieldLabel();
    const focus = state.role ? roleBySlug.get(state.role)?.name : null;
    // "1 of 12 roles are in Ways in" reads like a bug report. The entry filter
    // is a claim about reachability, not membership, so it gets its own phrasing.
    const belong = entry ? 'can be reached with no experience' : `${inside === 1 ? 'is' : 'are'} in ${name}`;

    if (focus) {
      if (fieldBridge) {
        const last = roleBySlug.get(fieldBridge[fieldBridge.length - 1].to)?.name ?? '';
        const moves = `${fieldBridge.length} ${fieldBridge.length === 1 ? 'move' : 'moves'}`;
        return `${focus} has no direct move into ${name}. The shortest authored route there is ${moves}, ending at ${last} — it is drawn below.`;
      }
      if (inside === 0) {
        return entry
          ? `Nothing next to ${focus} can be reached with no experience — every move here starts somewhere else.`
          : `${focus} has no move into ${name}, and no authored route reaches it from here at all.`;
      }
      return `${focus} — ${inside} of ${total} roles on screen ${belong}. The rest are faded, not hidden.`;
    }
    return `${name} — ${inside} of ${total} roles ${belong}.`;
  }

  function paint(): void {
    if (!data) return;
    const { keep, marks, routeSteps, fieldStat, offField, fieldBridge } = highlightSets();
    setDim(keep);
    for (const node of nodes) {
      const slug = node.dataset.slug ?? '';
      const mark = marks.get(slug);
      if (mark) node.setAttribute('data-mark', mark);
      else node.removeAttribute('data-mark');
      if (offField.has(slug)) node.setAttribute('data-field', 'out');
      else node.removeAttribute('data-field');
    }
    drawRoute(routeSteps);
    // A route is already a path to follow; two sets of arrows would compete.
    if (!routeSteps) drawFlow(state.role);
    hint.textContent = hintText(fieldStat, fieldBridge);
    // The bridge is drawn on the map, but the card still belongs to the role
    // that is open — swapping it for a route card would lose the thing the
    // person was reading when they reached for the filter.
    renderPanel(fieldBridge ? null : routeSteps);
    syncHash();
    persist();
  }

  /* ── Panel ────────────────────────────────────────────────────────── */
  function openPanel(): void {
    panel.hidden = false;
    root!.dataset.panel = 'open';
  }

  function closePanel(): void {
    panel.hidden = true;
    delete root!.dataset.panel;
    state.role = null;
    paint();
  }

  function roleCard(role: RoleRecord): string {
    const out = outMoves.get(role.slug) ?? [];
    const into = inMoves.get(role.slug) ?? [];
    const comparisons = (comparisonsFor.get(role.slug) ?? []).sort((a, b) => b.overlap - a.overlap).slice(0, 3);
    const certs = role.certs.slice(0, 4);
    return `
      <p class="nav-map__eyebrow">${esc(role.fieldNames.join(' · '))}</p>
      <h2 class="nav-map__title" id="nav-map-panel-title" tabindex="-1">${esc(role.name)}</h2>
      <p class="nav-map__stage-label">${esc(ENTRY_LABEL[role.entry])}${role.entryPay ? ` · starts around ${esc(role.entryPay)}` : ''}</p>
      <p class="nav-map__purpose">${esc(role.purpose)}</p>
      <p class="nav-map__reality"><strong>The honest downside:</strong> ${esc(role.reality)}</p>

      ${
        out.length > 0
          ? `<h3 class="nav-map__h3">Where it leads</h3>
             <ul class="nav-map__moves">
               ${out
                 .map(
                   (m) => `<li><button type="button" class="nav-map__move" data-select="${esc(m.to)}">
                     <span class="nav-map__move-name">${esc(roleBySlug.get(m.to)?.name ?? m.to)} →</span>
                     <span class="nav-map__move-why">${esc(m.reason)}</span>
                   </button></li>`,
                 )
                 .join('')}
             </ul>`
          : ''
      }

      ${
        into.length > 0
          ? `<h3 class="nav-map__h3">How people get here</h3>
             <ul class="nav-map__chips">
               ${into
                 .map(
                   (m) =>
                     `<li><button type="button" class="nav-map__chip" data-select="${esc(m.from)}">${esc(
                       roleBySlug.get(m.from)?.name ?? m.from,
                     )}</button></li>`,
                 )
                 .join('')}
             </ul>`
          : `<p class="nav-map__note">No role on this map lists ${esc(role.name)} as its next step yet.</p>`
      }

      ${
        certs.length > 0
          ? `<h3 class="nav-map__h3">Certifications that matter here</h3>
             <ul class="nav-map__certs">
               ${certs
                 .map(
                   (c) =>
                     `<li><span class="nav-map__cert-stage">${esc(c.stage)}</span>${
                       c.href ? `<a href="${esc(c.href)}">${esc(c.title)}</a>` : `<span>${esc(c.title)}</span>`
                     }<span class="nav-map__cert-why">${esc(c.reason)}</span></li>`,
                 )
                 .join('')}
             </ul>`
          : ''
      }

      ${
        role.technologies.length > 0
          ? `<h3 class="nav-map__h3">Tools you would touch</h3>
             <p class="nav-map__tech">${esc(role.technologies.slice(0, 12).join(' · '))}</p>`
          : ''
      }

      ${
        role.trials.length > 0
          ? `<h3 class="nav-map__h3">Try the work first</h3>
             <ul class="nav-map__chips">
               ${role.trials
                 .map(
                   (t) =>
                     `<li><a class="nav-map__chip" href="/navigator/trials/#${esc(t.slug)}">${esc(t.name)} · ${esc(
                       t.time,
                     )}</a></li>`,
                 )
                 .join('')}
             </ul>`
          : ''
      }

      ${
        comparisons.length > 0
          ? `<h3 class="nav-map__h3">Often confused with</h3>
             <ul class="nav-map__chips">
               ${comparisons
                 .map(
                   (c) =>
                     `<li><a class="nav-map__chip" href="${esc(c.href)}">vs ${esc(
                       roleBySlug.get(c.other)?.name ?? c.other,
                     )} · ${c.overlap}% shared</a></li>`,
                 )
                 .join('')}
             </ul>`
          : ''
      }

      <div class="nav-map__actions">
        <button type="button" class="nav-map__btn" data-action="path-from" data-slug="${esc(role.slug)}">Build a path from here</button>
        <button type="button" class="nav-map__btn" data-action="path-to" data-slug="${esc(role.slug)}">Find a path to here</button>
        <a class="nav-map__btn nav-map__btn--primary" href="/navigator/roles/${esc(role.slug)}/">Full role profile →</a>
        ${role.pathSlug ? `<a class="nav-map__btn" href="/paths/${esc(role.pathSlug)}/">Study roadmap</a>` : ''}
      </div>`;
  }

  function pathCard(steps: MoveRecord[] | null): string {
    const from = state.from ? roleBySlug.get(state.from) : null;
    const to = state.to ? roleBySlug.get(state.to) : null;
    if (!from || !to) {
      return `
        <h2 class="nav-map__title" id="nav-map-panel-title" tabindex="-1">Build a path</h2>
        <p class="nav-map__purpose">${
          from
            ? `Starting at <strong>${esc(from.name)}</strong>. Now pick where you want to get to.`
            : 'Pick the role closest to what you do now — on the map, or with search.'
        }</p>`;
    }
    if (!steps) {
      const back = route(to.slug, from.slug);
      return `
        <h2 class="nav-map__title" id="nav-map-panel-title" tabindex="-1">No authored route</h2>
        <p class="nav-map__purpose">Nobody has written a move that gets from <strong>${esc(from.name)}</strong> to
        <strong>${esc(to.name)}</strong>, so this map will not invent one.</p>
        ${
          back
            ? `<p class="nav-map__note">The opposite direction does exist — ${esc(to.name)} to ${esc(
                from.name,
              )} takes ${back.length} ${back.length === 1 ? 'move' : 'moves'}.
               <button type="button" class="nav-map__link" data-action="swap">Swap the two →</button></p>`
            : '<p class="nav-map__note">Try a nearby role: most routes pass through a networking, systems or support role first.</p>'
        }`;
    }
    if (steps.length === 0) {
      return `<h2 class="nav-map__title" id="nav-map-panel-title" tabindex="-1">Same role</h2>
        <p class="nav-map__purpose">Pick two different roles to see the moves between them.</p>`;
    }
    return `
      <h2 class="nav-map__title" id="nav-map-panel-title" tabindex="-1">${steps.length} ${
        steps.length === 1 ? 'move' : 'moves'
      } from ${esc(from.name)}</h2>
      <p class="nav-map__purpose">Each step is a move someone on this site has written down, in the direction it was written.</p>
      <ol class="nav-map__route-list">
        ${steps
          .map(
            (step, i) => `<li>
              <p class="nav-map__route-step">${i + 1}. ${esc(roleBySlug.get(step.from)?.name ?? step.from)} →
                <button type="button" class="nav-map__link" data-select="${esc(step.to)}">${esc(
                  roleBySlug.get(step.to)?.name ?? step.to,
                )}</button></p>
              <p class="nav-map__move-why">${esc(step.reason)}</p>
            </li>`,
          )
          .join('')}
      </ol>
      <div class="nav-map__actions">
        <button type="button" class="nav-map__btn" data-action="swap">Reverse direction</button>
        <button type="button" class="nav-map__btn" data-action="clear-path">Clear</button>
        <a class="nav-map__btn nav-map__btn--primary" href="/navigator/roles/${esc(to.slug)}/">About ${esc(to.name)} →</a>
      </div>`;
  }

  function compareCard(): string {
    const a = state.compareA ? roleBySlug.get(state.compareA) : null;
    const b = state.compareB ? roleBySlug.get(state.compareB) : null;
    if (!a) {
      return `<h2 class="nav-map__title" id="nav-map-panel-title" tabindex="-1">Compare two roles</h2>
        <p class="nav-map__purpose">Pick the first role on the map.</p>`;
    }
    if (!b) {
      const options = (comparisonsFor.get(a.slug) ?? []).sort((x, y) => y.overlap - x.overlap);
      return `<h2 class="nav-map__title" id="nav-map-panel-title" tabindex="-1">${esc(a.name)} vs…</h2>
        <p class="nav-map__purpose">These are the roles it is genuinely confused with. Pick one, on the map or here.</p>
        <ul class="nav-map__chips">
          ${options
            .map(
              (o) =>
                `<li><button type="button" class="nav-map__chip" data-compare="${esc(o.other)}">${esc(
                  roleBySlug.get(o.other)?.name ?? o.other,
                )} · ${o.overlap}%</button></li>`,
            )
            .join('')}
        </ul>`;
    }
    const pair = (comparisonsFor.get(a.slug) ?? []).find((c) => c.other === b.slug);
    if (!pair) {
      return `<h2 class="nav-map__title" id="nav-map-panel-title" tabindex="-1">Not a comparison we wrote</h2>
        <p class="nav-map__purpose">${esc(a.name)} and ${esc(b.name)} are far enough apart that a side-by-side would
        be padding. Comparisons exist where the two are genuinely confusable or one leads to the other.</p>
        <div class="nav-map__actions">
          <button type="button" class="nav-map__btn" data-action="clear-compare">Pick another pair</button>
        </div>`;
    }
    return `<h2 class="nav-map__title" id="nav-map-panel-title" tabindex="-1">${esc(a.name)} vs ${esc(b.name)}</h2>
      <p class="nav-map__purpose"><strong>${pair.overlap}% shared working profile</strong> across the 41 dimensions the
      assessment scores. The full comparison covers what overlaps, what genuinely differs, and who should pick which.</p>
      <div class="nav-map__actions">
        <a class="nav-map__btn nav-map__btn--primary" href="${esc(pair.href)}">Full side-by-side →</a>
        <button type="button" class="nav-map__btn" data-action="clear-compare">Compare two others</button>
      </div>`;
  }

  function listCard(): string {
    if (state.mode === 'skills') {
      const owned = inventorySlugs();
      const tech = state.tech ? data!.technologies.find((t) => t.slug === state.tech) : null;
      return `<h2 class="nav-map__title" id="nav-map-panel-title" tabindex="-1">${
        tech ? esc(tech.name) : 'Skills on the map'
      }</h2>
        ${
          tech
            ? `<p class="nav-map__purpose">${esc(tech.blurb)}</p>
               <h3 class="nav-map__h3">Roles that use it</h3>
               <ul class="nav-map__chips">${tech.roles
                 .map(
                   (s) =>
                     `<li><button type="button" class="nav-map__chip" data-select="${esc(s)}">${esc(
                       roleBySlug.get(s)?.name ?? s,
                     )}</button></li>`,
                 )
                 .join('')}</ul>`
            : `<p class="nav-map__purpose">Search any technology above — ${data!.technologies.length} of them are mapped to the roles that use them.</p>`
        }
        <div class="nav-map__actions">
          <button type="button" class="nav-map__btn${state.mine ? ' is-on' : ''}" data-action="mine">
            ${owned.length > 0 ? `Highlight what I already know (${owned.length})` : 'Build a technology inventory'}
          </button>
          ${owned.length === 0 ? '<a class="nav-map__btn" href="/navigator/inventory/">Open the inventory →</a>' : ''}
        </div>`;
    }
    const cert = state.cert ? data!.certifications.find((c) => c.key === state.cert) : null;
    return `<h2 class="nav-map__title" id="nav-map-panel-title" tabindex="-1">${
      cert ? esc(cert.title) : 'Certifications on the map'
    }</h2>
      ${
        cert
          ? `<p class="nav-map__purpose">Roles whose page lists this certification, and where it sits for them.</p>
             <ul class="nav-map__certs">
               ${cert.roles
                 .map(
                   (r) =>
                     `<li><span class="nav-map__cert-stage">${esc(r.stage)}</span>
                       <button type="button" class="nav-map__link" data-select="${esc(r.slug)}">${esc(
                         roleBySlug.get(r.slug)?.name ?? r.slug,
                       )}</button></li>`,
                 )
                 .join('')}
             </ul>
             ${cert.href ? `<div class="nav-map__actions"><a class="nav-map__btn nav-map__btn--primary" href="${esc(cert.href)}">Study guide →</a></div>` : ''}`
          : `<p class="nav-map__purpose">Search a certification above, or pick one of the ones that show up across the most roles:</p>
             <ul class="nav-map__chips">${data!.certifications
               .slice(0, 8)
               .map((c) => `<li><button type="button" class="nav-map__chip" data-cert="${esc(c.key)}">${esc(c.title)}</button></li>`)
               .join('')}</ul>`
      }`;
  }

  function entryCard(): string {
    const focus = state.role ? roleBySlug.get(state.role) : null;
    if (!focus) {
      const entries = data!.roles.filter((r) => r.entry === 'first-job');
      return `<h2 class="nav-map__title" id="nav-map-panel-title" tabindex="-1">${entries.length} ways in</h2>
        <p class="nav-map__purpose">These roles are reachable with no IT experience. Every other role on this map can be
        reached from one of them — that is checked when the site is built.</p>
        <ul class="nav-map__chips">${entries
          .map((r) => `<li><button type="button" class="nav-map__chip" data-select="${esc(r.slug)}">${esc(r.name)}</button></li>`)
          .join('')}</ul>`;
    }
    const hops = hopsFrom(focus.slug);
    const byHop = [1, 2, 3].map((n) => [...hops.entries()].filter(([, h]) => h === n).map(([s]) => s));
    return `<h2 class="nav-map__title" id="nav-map-panel-title" tabindex="-1">From ${esc(focus.name)}</h2>
      <p class="nav-map__purpose">${hops.size - 1} roles open up from here by following moves people actually make.</p>
      ${byHop
        .map((slugs, i) =>
          slugs.length === 0
            ? ''
            : `<h3 class="nav-map__h3">${i + 1} ${i === 0 ? 'move' : 'moves'} away — ${slugs.length}</h3>
               <ul class="nav-map__chips">${slugs
                 .map(
                   (s) =>
                     `<li><button type="button" class="nav-map__chip" data-select="${esc(s)}">${esc(
                       roleBySlug.get(s)?.name ?? s,
                     )}</button></li>`,
                 )
                 .join('')}</ul>`,
        )
        .join('')}
      <div class="nav-map__actions">
        <a class="nav-map__btn nav-map__btn--primary" href="/navigator/roles/${esc(focus.slug)}/">About ${esc(focus.name)} →</a>
        <button type="button" class="nav-map__btn" data-action="explore-role" data-slug="${esc(focus.slug)}">Open it on the map</button>
      </div>`;
  }

  function renderPanel(steps: MoveRecord[] | null): void {
    let html = '';
    if (state.mode === 'path') html = pathCard(steps);
    else if (state.mode === 'compare') html = compareCard();
    else if (state.mode === 'entry') html = entryCard();
    else if (state.mode === 'skills' || state.mode === 'certs') html = state.role ? roleCard(roleBySlug.get(state.role)!) : listCard();
    else if (state.role) html = roleCard(roleBySlug.get(state.role)!);

    if (!html) {
      panel.hidden = true;
      delete root!.dataset.panel;
      return;
    }
    panelBody.innerHTML = html;
    openPanel();
  }

  /* ── Selection ────────────────────────────────────────────────────── */
  /**
   * @param origin Where the click came from. Selecting a role from the panel
   *   means clicking a name, not a dot — the dot may be off screen or behind
   *   the panel, so the map moves to it and the panel starts from the top.
   *   Selecting on the map moves nothing: you already looked at the thing you
   *   clicked, and yanking the viewport from under a deliberate click is the
   *   fastest way to make a map feel like it is fighting you.
   */
  function select(slug: string, viaKeyboard = false, origin: 'map' | 'panel' = 'map'): void {
    if (!roleBySlug.has(slug)) return;
    if (state.mode === 'path') {
      if (!state.from || (state.from && state.to)) {
        state.from = slug;
        state.to = null;
      } else {
        state.to = slug;
      }
      announce(state.to ? 'Route calculated.' : 'Start set. Now pick where you want to get to.');
    } else if (state.mode === 'compare') {
      if (!state.compareA || (state.compareA && state.compareB)) {
        state.compareA = slug;
        state.compareB = null;
      } else {
        state.compareB = slug;
      }
    } else {
      state.role = slug;
    }
    if (state.mode === 'entry') state.role = slug;
    paint();
    if (origin === 'panel') {
      panelBody.scrollTop = 0;
      panel.scrollTop = 0;
      const anchor = state.role ?? state.to ?? state.compareB ?? slug;
      fitTo([
        anchor,
        ...(outMoves.get(anchor) ?? []).map((m) => m.to),
        ...(inMoves.get(anchor) ?? []).map((m) => m.from),
      ]);
    }
    if (viaKeyboard) {
      const title = document.getElementById('nav-map-panel-title');
      title?.focus();
    }
  }

  function announce(message: string): void {
    status.textContent = message;
  }

  /* ── Wiring ───────────────────────────────────────────────────────── */
  svg.addEventListener('click', (event) => {
    const node = (event.target as Element).closest<SVGGElement>('.nav-graph__node');
    if (!node || !data) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || (event as MouseEvent).button !== 0) return;
    event.preventDefault();
    select(node.dataset.slug ?? '');
  });

  svg.addEventListener('keydown', (event) => {
    const node = (event.target as Element).closest<SVGGElement>('.nav-graph__node');
    if (!node || !data) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      select(node.dataset.slug ?? '', true);
      return;
    }
    if (event.key.startsWith('Arrow')) {
      event.preventDefault();
      const current = roleBySlug.get(node.dataset.slug ?? '');
      if (!current) return;
      const axis = event.key === 'ArrowLeft' || event.key === 'ArrowRight' ? 'x' : 'y';
      const forward = event.key === 'ArrowRight' || event.key === 'ArrowDown';
      const candidates = data.roles
        .filter((r) => r.slug !== current.slug && (forward ? r[axis] > current[axis] : r[axis] < current[axis]))
        .sort((a, b) => Math.hypot(a.x - current.x, a.y - current.y) - Math.hypot(b.x - current.x, b.y - current.y));
      const next = candidates[0];
      if (next) nodeBySlug.get(next.slug)?.focus();
    }
  });

  root.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    const selectBtn = target.closest<HTMLElement>('[data-select]');
    if (selectBtn) {
      select(selectBtn.dataset.select ?? '', false, 'panel');
      return;
    }
    const compareBtn = target.closest<HTMLElement>('[data-compare]');
    if (compareBtn) {
      state.compareB = compareBtn.dataset.compare ?? null;
      paint();
      return;
    }
    const certBtn = target.closest<HTMLElement>('[data-cert]');
    if (certBtn) {
      state.cert = certBtn.dataset.cert ?? null;
      paint();
      return;
    }
    const action = target.closest<HTMLElement>('[data-action]')?.dataset.action;
    if (!action) return;
    const slug = target.closest<HTMLElement>('[data-slug]')?.dataset.slug ?? null;
    if (action === 'path-from') {
      setMode('path');
      state.role = null;
      state.from = slug;
      state.to = null;
      announce('Start set. Now pick where you want to get to.');
    } else if (action === 'path-to') {
      setMode('path');
      state.role = null;
      state.to = slug;
      if (!state.from) announce('Destination set. Now pick where you are starting from.');
    } else if (action === 'swap') {
      const from = state.from;
      state.from = state.to;
      state.to = from;
    } else if (action === 'clear-path') {
      state.from = null;
      state.to = null;
    } else if (action === 'clear-compare') {
      state.compareA = null;
      state.compareB = null;
    } else if (action === 'explore-role') {
      setMode('explore');
      state.role = slug;
    } else if (action === 'mine') {
      if (inventorySlugs().length === 0) {
        window.location.href = '/navigator/inventory/';
        return;
      }
      state.mine = !state.mine;
      state.tech = null;
    } else if (action === 'close') {
      closePanel();
      return;
    } else if (action === 'zoom-in') {
      zoomTo(view.width * 0.8);
      return;
    } else if (action === 'zoom-out') {
      zoomTo(view.width * 1.25);
      return;
    } else if (action === 'fit') {
      const keep = highlightSets().keep;
      fitTo(keep ? [...keep] : data!.roles.map((r) => r.slug));
      return;
    } else if (action === 'reset') {
      state.role = null;
      state.from = null;
      state.to = null;
      state.compareA = null;
      state.compareB = null;
      state.tech = null;
      state.cert = null;
      state.mine = false;
      state.field = 'all';
      reset();
      syncChips();
    } else if (action === 'fullscreen') {
      toggleFullscreen();
      return;
    }
    paint();
  });

  function setMode(mode: Mode): void {
    state.mode = mode;
    for (const button of root!.querySelectorAll<HTMLButtonElement>('[data-mode]')) {
      button.setAttribute('aria-pressed', String(button.dataset.mode === mode));
    }
    search.placeholder =
      mode === 'skills' ? 'Search a technology…' : mode === 'certs' ? 'Search a certification…' : 'Search roles, skills, certifications…';
    announce(MODE_HINT[mode]);
  }

  for (const button of root.querySelectorAll<HTMLButtonElement>('[data-mode]')) {
    button.addEventListener('click', () => {
      setMode(button.dataset.mode as Mode);
      // A role selected in one mode must not survive into the next: it used to
      // keep rendering its own card over the certification list, and narrowed
      // Path mode's highlighting to that role's neighbours.
      state.role = null;
      paint();
    });
  }

  function syncChips(): void {
    for (const chip of graph!.querySelectorAll<HTMLButtonElement>('.nav-graph__chip')) {
      chip.classList.toggle('is-on', (chip.dataset.filter ?? 'all') === state.field);
    }
  }

  for (const chip of graph.querySelectorAll<HTMLButtonElement>('.nav-graph__chip')) {
    chip.addEventListener('click', () => {
      state.field = chip.dataset.filter ?? 'all';
      syncChips();
      if (data) paint();
      else setDim(state.field === 'all' ? null : new Set(nodes.filter((n) => (state.field === 'first-job' ? n.dataset.entry === 'first-job' : (n.dataset.domains ?? '').split(' ').includes(state.field))).map((n) => n.dataset.slug ?? '')));
    });
  }

  function toggleFullscreen(): void {
    const target = root!;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
      return;
    }
    if (document.fullscreenEnabled && target.requestFullscreen) {
      void target.requestFullscreen().catch(() => target.classList.add('is-focus-mode'));
    } else {
      target.classList.toggle('is-focus-mode');
    }
  }

  /* ── Search ───────────────────────────────────────────────────────── */
  function runSearch(query: string): void {
    const q = query.trim().toLowerCase();
    if (!data || q.length < 2) {
      results.hidden = true;
      results.textContent = '';
      return;
    }
    const hits: Array<{ label: string; kind: string; action: string; value: string }> = [];
    for (const role of data.roles) {
      if (role.name.toLowerCase().includes(q) || role.label.toLowerCase().includes(q)) {
        hits.push({ label: role.name, kind: 'Role', action: 'select', value: role.slug });
      }
    }
    for (const tech of data.technologies) {
      if (tech.name.toLowerCase().includes(q) || tech.aka.some((a) => a.toLowerCase().includes(q))) {
        hits.push({ label: tech.name, kind: 'Technology', action: 'tech', value: tech.slug });
      }
    }
    for (const cert of data.certifications) {
      if (cert.title.toLowerCase().includes(q)) hits.push({ label: cert.title, kind: 'Certification', action: 'cert', value: cert.key });
    }
    for (const field of data.fields) {
      if (field.name.toLowerCase().includes(q)) hits.push({ label: field.name, kind: 'Field', action: 'field', value: field.id });
    }
    const top = hits.slice(0, 8);
    results.innerHTML = top
      .map(
        (h, i) =>
          `<li><button type="button" class="nav-map__result" data-result="${i}" data-kind="${esc(h.action)}" data-value="${esc(
            h.value,
          )}"><span>${esc(h.label)}</span><span class="nav-map__result-kind">${esc(h.kind)}</span></button></li>`,
      )
      .join('');
    results.hidden = top.length === 0;
  }

  search.addEventListener('input', () => runSearch(search.value));
  search.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      results.hidden = true;
      search.value = '';
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      results.querySelector<HTMLButtonElement>('.nav-map__result')?.focus();
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      results.querySelector<HTMLButtonElement>('.nav-map__result')?.click();
    }
  });

  results.addEventListener('click', (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('.nav-map__result');
    if (!button) return;
    const kind = button.dataset.kind;
    const value = button.dataset.value ?? '';
    results.hidden = true;
    search.value = '';
    if (kind === 'select') {
      select(value);
      fitTo([value, ...(outMoves.get(value) ?? []).map((m) => m.to)]);
    } else if (kind === 'tech') {
      setMode('skills');
      state.tech = value;
      state.mine = false;
      paint();
    } else if (kind === 'cert') {
      setMode('certs');
      state.cert = value;
      paint();
    } else if (kind === 'field') {
      state.field = value;
      syncChips();
      paint();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.target instanceof HTMLInputElement) return;
    if (event.key === '/') {
      const rect = root!.getBoundingClientRect();
      if (rect.top > window.innerHeight || rect.bottom < 0) return;
      event.preventDefault();
      search.focus();
    } else if (event.key === 'Escape') {
      if (root!.classList.contains('is-focus-mode')) root!.classList.remove('is-focus-mode');
      else if (!panel.hidden) closePanel();
    }
  });

  panel.querySelector<HTMLButtonElement>('[data-action="close"]')?.addEventListener('click', closePanel);

  /* ── URL + storage ────────────────────────────────────────────────── */
  function syncHash(): void {
    const parts: string[] = [];
    if (state.mode !== 'explore') parts.push(`mode=${state.mode}`);
    if (state.role) parts.push(`role=${state.role}`);
    if (state.from) parts.push(`from=${state.from}`);
    if (state.to) parts.push(`to=${state.to}`);
    if (state.compareA) parts.push(`a=${state.compareA}`);
    if (state.compareB) parts.push(`b=${state.compareB}`);
    if (state.tech) parts.push(`tech=${state.tech}`);
    if (state.cert) parts.push(`cert=${encodeURIComponent(state.cert)}`);
    if (state.field !== 'all') parts.push(`field=${state.field}`);
    const next = parts.length > 0 ? `#${parts.join('&')}` : '';
    if (next !== window.location.hash) {
      window.history.replaceState(null, '', `${window.location.pathname}${next}`);
    }
  }

  function readHash(): boolean {
    const raw = window.location.hash.replace(/^#/, '');
    if (!raw) return false;
    const params = new URLSearchParams(raw.replace(/&/g, '&'));
    // The hash carries the complete state, so anything absent from it returns
    // to its default. Without this, arriving at #role=… from a page already in
    // Path mode kept Path mode and showed the wrong panel.
    const mode = params.get('mode') as Mode | null;
    state.mode = mode && MODE_HINT[mode] ? mode : 'explore';
    state.role = params.get('role');
    state.from = params.get('from');
    state.to = params.get('to');
    state.compareA = params.get('a');
    state.compareB = params.get('b');
    state.tech = params.get('tech');
    state.cert = params.get('cert');
    state.field = params.get('field') ?? 'all';
    return true;
  }

  function persist(): void {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ mode: state.mode, role: state.role }));
    } catch {
      /* private mode, quota, or storage disabled — the map does not need it */
    }
  }

  function restore(): void {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as { mode?: Mode; role?: string | null };
      if (saved.mode && MODE_HINT[saved.mode]) state.mode = saved.mode;
      if (saved.role) state.role = saved.role;
    } catch {
      /* ignore */
    }
  }

  window.addEventListener('hashchange', () => {
    if (readHash()) {
      setMode(state.mode);
      syncChips();
      paint();
    }
  });

  /* ── Go ───────────────────────────────────────────────────────────── */
  fetch('/navigator/graph-data.json')
    .then((response) => (response.ok ? response.json() : null))
    .then((payload: Payload | null) => {
      if (!payload) return;
      data = payload;
      buildIndexes(payload);
      root.dataset.ready = '1';
      bar.hidden = false;
      if (!readHash()) restore();
      setMode(state.mode);
      syncChips();
      paint();
      // Arriving on a shared #role= link should land on that role's
      // neighbourhood, not on the whole map with one lit corner. Both
      // directions count: most roles are reached more often than they lead on.
      if (state.role) {
        fitTo([
          state.role,
          ...(outMoves.get(state.role) ?? []).map((m) => m.to),
          ...(inMoves.get(state.role) ?? []).map((m) => m.from),
        ]);
      }
    })
    .catch(() => {
      /* The drawing, its links and the written-out map below all still work. */
    });
}
