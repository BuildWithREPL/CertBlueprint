import type { DomainId } from '../types';
import type { GraphEdge, GraphNode } from '../data/graph';

/* ═══════════════════════════════════════════════════════════════════
   FORCE-DIRECTED LAYOUT, COMPUTED AT BUILD TIME

   Roughly Fruchterman-Reingold with one addition: a weak pull toward a fixed
   anchor per field. Pure force layout on this graph produces a legible but
   meaningless arrangement — networking roles scattered through security ones —
   and the whole point of drawing it is to show that the fields are distinct
   AND connected. The anchors keep fields together; the edges pull the
   intersection roles into the gaps between them, which is exactly where those
   jobs actually sit.

   Two deliberate choices:

   • No dependency. This is about sixty lines of arithmetic, and d3-force would
     be 60 KB shipped or another build step for something the browser never
     needs to recompute.

   • No randomness. Nodes are seeded from their anchor at a fixed offset rather
     than scattered, so the same data always produces the same drawing. A layout
     that shifted every build would make any visual diff unreadable and would
     silently change every page that embeds it.
   ═══════════════════════════════════════════════════════════════════ */

export interface Point {
  x: number;
  y: number;
}

export interface PositionedNode extends GraphNode {
  x: number;
  y: number;
  /** Which side of the dot its name sits on. */
  side: 'start' | 'end';
  /** Vertical nudge applied to clear another label. */
  labelDy: number;
  radius: number;
}

export interface GraphLayout {
  nodes: PositionedNode[];
  /** Sized to contain the labels, not just the dots. */
  viewBox: { x: number; y: number; width: number; height: number };
}

export const CANVAS = { width: 1280, height: 880 };

/**
 * Fails the build when the drawing has become unreadable.
 *
 * Label placement is a search, and a search can run out of room. Add four roles
 * or rewire adjacency and the layout may quietly start stacking names on top of
 * each other — a picture that is still generated, still deployed, and no longer
 * says what it claims. Nothing else would catch that; the page renders fine.
 *
 * If this fires, the fix is more room (raise `K`, spread the field anchors),
 * not deleting the check.
 */
export function assertLayoutLegible(layout: GraphLayout): void {
  const { nodes, viewBox } = layout;
  const errors: string[] = [];
  const boxes = nodes.map((n) => ({ slug: n.slug, box: labelBox(n, n.side, n.labelDy) }));

  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i];
      const b = boxes[j];
      if (a.box.x1 < b.box.x2 && a.box.x2 > b.box.x1 && a.box.y1 < b.box.y2 && a.box.y2 > b.box.y1) {
        errors.push(`labels overlap: ${a.slug} / ${b.slug}`);
      }
    }
  }

  for (const { slug, box } of boxes) {
    for (const n of nodes) {
      if (n.slug === slug) continue;
      if (
        box.x1 < n.x + n.radius &&
        box.x2 > n.x - n.radius &&
        box.y1 < n.y + n.radius &&
        box.y2 > n.y - n.radius
      ) {
        errors.push(`"${slug}" label sits on the ${n.slug} dot and will read as its name`);
      }
    }
    if (
      box.x1 < viewBox.x ||
      box.x2 > viewBox.x + viewBox.width ||
      box.y1 < viewBox.y ||
      box.y2 > viewBox.y + viewBox.height
    ) {
      errors.push(`${slug} label is clipped by the viewBox`);
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `Navigator career map is unreadable:\n  ${errors.join('\n  ')}\n` +
        '  Give the layout more room (K, or the field anchors) rather than removing this check.',
    );
  }
}

/*
 * Rough size of a rendered label, in the drawing's own units.
 *
 * These track the font-size of `.nav-graph__label` in navigator.css and have
 * to be raised with it. Enlarge the type without enlarging these and the
 * collision search goes on believing names are smaller than they render,
 * which is precisely how two of them end up stacked — and the legibility
 * assertion below would agree that everything was fine.
 */
const CHAR_WIDTH = 7.3;
const LABEL_HEIGHT = 17;
const LABEL_GAP = 8;

function labelWidth(name: string): number {
  return name.length * CHAR_WIDTH;
}

/**
 * Where each field sits. Placed by hand rather than derived, because the map
 * reads better when related fields are neighbours: support sits next to systems
 * because that is the common first move, and security sits between networking
 * and systems because that is where those roles come from.
 */
const ANCHORS: Record<DomainId, Point> = {
  networking: { x: 250, y: 250 },
  cybersecurity: { x: 610, y: 170 },
  systems: { x: 300, y: 580 },
  cloud: { x: 700, y: 560 },
  software: { x: 960, y: 430 },
  data: { x: 930, y: 720 },
  operations: { x: 130, y: 430 },
};

const ITERATIONS = 600;
/** Ideal edge length. Sets the overall scale of the drawing. */
const K = 104;
const ANCHOR_PULL = 0.045;
const REPULSION = 1.15;
const ATTRACTION = 0.9;
/** Nothing may end up closer than this, so labels stay separable. */
const MIN_SEPARATION = 62;

function anchorFor(node: GraphNode): Point {
  // Multi-domain roles are pulled toward the average of their fields, which is
  // what lands Network Security Engineer between networking and security
  // instead of arbitrarily inside one of them.
  const points = node.domains.map((d) => ANCHORS[d]).filter(Boolean);
  if (points.length === 0) return { x: CANVAS.width / 2, y: CANVAS.height / 2 };
  return {
    x: points.reduce((s, p) => s + p.x, 0) / points.length,
    y: points.reduce((s, p) => s + p.y, 0) / points.length,
  };
}

/** Hubs are drawn larger — degree is the honest measure of "a lot connects here". */
export function radiusFor(degree: number): number {
  return 6 + Math.min(7, degree * 0.75);
}

export function layoutGraph(nodes: GraphNode[], edges: GraphEdge[]): GraphLayout {
  const anchors = new Map<string, Point>();
  const positioned: PositionedNode[] = nodes.map((node, i) => {
    const anchor = anchorFor(node);
    anchors.set(node.slug, anchor);
    // Deterministic starting offset: fan the nodes of a field around its anchor
    // so they begin apart without ever calling a random number generator.
    const angle = (i * 2.399963) % (Math.PI * 2); // golden angle, evenly spread
    return {
      ...node,
      x: anchor.x + Math.cos(angle) * 40,
      y: anchor.y + Math.sin(angle) * 40,
      side: 'start' as const,
      labelDy: 0,
      radius: radiusFor(node.degree),
    };
  });

  const byId = new Map(positioned.map((n) => [n.slug, n]));
  let temperature = 90;

  for (let step = 0; step < ITERATIONS; step++) {
    const dx = new Map<string, number>();
    const dy = new Map<string, number>();
    for (const n of positioned) {
      dx.set(n.slug, 0);
      dy.set(n.slug, 0);
    }

    // Repulsion — every node pushes every other away.
    for (let i = 0; i < positioned.length; i++) {
      for (let j = i + 1; j < positioned.length; j++) {
        const a = positioned[i];
        const b = positioned[j];
        let vx = a.x - b.x;
        let vy = a.y - b.y;
        let dist = Math.hypot(vx, vy);
        if (dist < 0.01) {
          // Coincident nodes have no direction to separate along. Nudge along a
          // fixed axis rather than a random one to keep the layout reproducible.
          vx = 0.01;
          vy = 0;
          dist = 0.01;
        }
        const force = (REPULSION * K * K) / dist;
        const fx = (vx / dist) * force;
        const fy = (vy / dist) * force;
        dx.set(a.slug, dx.get(a.slug)! + fx);
        dy.set(a.slug, dy.get(a.slug)! + fy);
        dx.set(b.slug, dx.get(b.slug)! - fx);
        dy.set(b.slug, dy.get(b.slug)! - fy);
      }
    }

    // Attraction along edges.
    for (const e of edges) {
      const a = byId.get(e.a);
      const b = byId.get(e.b);
      if (!a || !b) continue;
      const vx = a.x - b.x;
      const vy = a.y - b.y;
      const dist = Math.max(0.01, Math.hypot(vx, vy));
      const force = (ATTRACTION * dist * dist) / K;
      const fx = (vx / dist) * force;
      const fy = (vy / dist) * force;
      dx.set(a.slug, dx.get(a.slug)! - fx);
      dy.set(a.slug, dy.get(a.slug)! - fy);
      dx.set(b.slug, dx.get(b.slug)! + fx);
      dy.set(b.slug, dy.get(b.slug)! + fy);
    }

    // Field gravity.
    for (const n of positioned) {
      const anchor = anchors.get(n.slug)!;
      dx.set(n.slug, dx.get(n.slug)! + (anchor.x - n.x) * ANCHOR_PULL * K);
      dy.set(n.slug, dy.get(n.slug)! + (anchor.y - n.y) * ANCHOR_PULL * K);
    }

    // Apply, capped by the cooling temperature.
    for (const n of positioned) {
      const mx = dx.get(n.slug)!;
      const my = dy.get(n.slug)!;
      const mag = Math.max(0.01, Math.hypot(mx, my));
      const limit = Math.min(mag, temperature);
      n.x += (mx / mag) * limit;
      n.y += (my / mag) * limit;
    }

    temperature = Math.max(0.6, temperature * 0.992);
  }

  separate(positioned);
  const scaled = fitToCanvas(positioned);
  placeLabels(scaled);
  return { nodes: scaled, viewBox: boundsOf(scaled) };
}

interface Box {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

function labelBox(n: PositionedNode, side: 'start' | 'end', dy: number): Box {
  const offset = n.radius + 7;
  const w = labelWidth(n.name);
  const x1 = side === 'start' ? n.x + offset : n.x - offset - w;
  const cy = n.y + dy;
  return { x1, y1: cy - LABEL_HEIGHT / 2, x2: x1 + w, y2: cy + LABEL_HEIGHT / 2 };
}

function overlaps(a: Box, b: Box): boolean {
  return a.x1 < b.x2 + LABEL_GAP && a.x2 + LABEL_GAP > b.x1 && a.y1 < b.y2 && a.y2 > b.y1;
}

/**
 * Decide which side of each dot its name sits on, then nudge what still clashes.
 *
 * Placing every label on a side chosen purely by position produced a legible
 * outer ring and an unreadable middle, where "Network Security Engineer" landed
 * on top of "Vulnerability Management Analyst". Both names were there; neither
 * could be read, which is worse than either one being absent.
 *
 * Hubs are placed first because they are the labels a reader most needs, and
 * whoever is placed first gets the better side. Vertical nudging is capped:
 * past about 16px a label stops reading as belonging to its own dot, and a
 * label attached to the wrong circle is a factual error, not an aesthetic one.
 */
function placeLabels(nodes: PositionedNode[]): void {
  const MAX_DY = 16;
  const placed: Box[] = [];
  const order = [...nodes].sort((a, b) => b.degree - a.degree);
  const centreX = nodes.reduce((s, n) => s + n.x, 0) / nodes.length;

  // Other roles' dots are obstacles too. A name resting on someone else's
  // circle does not just look untidy — it reads as that circle's name, which
  // makes the drawing say something false.
  const dotBoxes = new Map<string, Box>(
    nodes.map((n) => [
      n.slug,
      { x1: n.x - n.radius - 2, y1: n.y - n.radius - 2, x2: n.x + n.radius + 2, y2: n.y + n.radius + 2 },
    ]),
  );

  for (const n of order) {
    // Preferred side points away from the middle, so labels radiate outward.
    const preferred: 'start' | 'end' = n.x >= centreX ? 'start' : 'end';
    const other: 'start' | 'end' = preferred === 'start' ? 'end' : 'start';

    const offsets = [0, -4, 4, -8, 8, -12, 12, -MAX_DY, MAX_DY];
    let best = { side: preferred, dy: 0, score: Infinity };

    for (const side of [preferred, other]) {
      for (const dy of offsets) {
        const box = labelBox(n, side, dy);
        const labelClashes = placed.filter((p) => overlaps(box, p)).length;
        let dotClashes = 0;
        for (const [slug, dot] of dotBoxes) {
          if (slug === n.slug) continue;
          if (box.x1 < dot.x2 && box.x2 > dot.x1 && box.y1 < dot.y2 && box.y2 > dot.y1) dotClashes++;
        }
        // A collision costs far more than either tie-breaker, so the search
        // only trades position for clarity, never the other way round.
        const score = (labelClashes + dotClashes) * 100 + Math.abs(dy) + (side === preferred ? 0 : 6);
        if (score < best.score) best = { side, dy, score };
      }
    }

    n.side = best.side;
    n.labelDy = best.dy;
    placed.push(labelBox(n, n.side, n.labelDy));
  }
}

/**
 * The viewBox has to contain the labels, not just the dots.
 *
 * Fitting to node positions alone clipped "Field Infrastructure Engineer" and
 * "Application Security Engineer" at the edges — the dots were comfortably
 * inside the canvas and their names ran off it.
 */
function boundsOf(nodes: PositionedNode[]): { x: number; y: number; width: number; height: number } {
  const PAD = 16;
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const n of nodes) {
    const box = labelBox(n, n.side, n.labelDy);
    minX = Math.min(minX, box.x1, n.x - n.radius - 6);
    maxX = Math.max(maxX, box.x2, n.x + n.radius + 6);
    minY = Math.min(minY, box.y1, n.y - n.radius - 6);
    maxY = Math.max(maxY, box.y2, n.y + n.radius + 6);
  }

  return {
    x: Math.round(minX - PAD),
    y: Math.round(minY - PAD),
    width: Math.round(maxX - minX + PAD * 2),
    height: Math.round(maxY - minY + PAD * 2),
  };
}

/**
 * Final pass pushing any two nodes apart that ended up too close to label.
 *
 * The force sim optimises the whole drawing and will accept a couple of
 * overlaps to keep everything else tidy — but an overlap is precisely where a
 * reader loses which label belongs to which circle.
 */
function separate(nodes: PositionedNode[]): void {
  for (let pass = 0; pass < 60; pass++) {
    let moved = false;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        let vx = a.x - b.x;
        let vy = a.y - b.y;
        let dist = Math.hypot(vx, vy);
        if (dist >= MIN_SEPARATION) continue;
        if (dist < 0.01) {
          vx = 0.01;
          vy = 0;
          dist = 0.01;
        }
        const push = (MIN_SEPARATION - dist) / 2;
        a.x += (vx / dist) * push;
        a.y += (vy / dist) * push;
        b.x -= (vx / dist) * push;
        b.y -= (vy / dist) * push;
        moved = true;
      }
    }
    if (!moved) break;
  }
}

/** Scale and centre the result so it always fills the same viewBox. */
function fitToCanvas(nodes: PositionedNode[]): PositionedNode[] {
  const PAD = 78;
  const xs = nodes.map((n) => n.x);
  const ys = nodes.map((n) => n.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const scale = Math.min(
    (CANVAS.width - PAD * 2) / Math.max(1, maxX - minX),
    (CANVAS.height - PAD * 2) / Math.max(1, maxY - minY),
  );

  const offsetX = (CANVAS.width - (maxX - minX) * scale) / 2;
  const offsetY = (CANVAS.height - (maxY - minY) * scale) / 2;

  return nodes.map((n) => ({
    ...n,
    x: Math.round(((n.x - minX) * scale + offsetX) * 10) / 10,
    y: Math.round(((n.y - minY) * scale + offsetY) * 10) / 10,
  }));
}
