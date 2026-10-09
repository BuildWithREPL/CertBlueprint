import type { DimensionId, RoleCore, Vector } from '../types';
import { GROUP_WEIGHT } from '../data/dimensions';
import { groupOf, unionKeys } from './vector';
import { weightedCosine } from './scoring';

/* ═══════════════════════════════════════════════════════════════════
   COMPARING TWO ROLES

   The assessment answers "which roles suit you". This answers the question
   people actually ask next, and the one the results page provokes by design
   when it refuses to fake precision: "these two came out almost the same —
   what is the actual difference?"

   Everything here is derived from the same vectors the matcher uses. Nothing
   is authored per pair. That is deliberate: 100+ hand-written comparisons
   would drift out of step with the role data the first time a vector changed,
   and nobody would notice which ones.
   ═══════════════════════════════════════════════════════════════════ */

/**
 * Scale a role's vector by its own strongest dimension.
 *
 * Role vectors are authored 0–10 where only relative magnitude WITHIN a role
 * is meaningful, so they must be put on a common footing before any
 * cross-role subtraction means anything.
 *
 * Note this is NOT `normalizeByGroup`, which is right for rendering one
 * person's profile and quietly wrong here: normalizing each group to its own
 * maximum would give a role that barely touches security the same full-height
 * top security bar as a role that does nothing else, erasing exactly the
 * difference someone opened this page to see.
 */
function scaleToSelf(v: Vector): Vector {
  let max = 0;
  for (const value of Object.values(v)) max = Math.max(max, value);
  if (max <= 0) return {};
  const out: Vector = {};
  for (const [id, value] of Object.entries(v) as [DimensionId, number][]) {
    // Rounded so threshold comparisons are decidable. Vectors are authored in
    // whole numbers, so a gap of exactly 0.2 is common — and unrounded it
    // evaluates to 0.19999999999999998, which quietly filed "Troubleshooting
    // 70 vs 50" under what two roles have in common.
    if (value > 0) out[id] = Math.round((value / max) * 1000) / 1000;
  }
  return out;
}

export interface DimensionDelta {
  id: DimensionId;
  /** 0–1, this role's relative emphasis. */
  a: number;
  b: number;
  /** Absolute gap, before group weighting. */
  gap: number;
  /** Which side this dimension favours. */
  leans: 'a' | 'b';
}

export interface RoleComparison {
  a: RoleCore;
  b: RoleCore;
  /** 0–100. How much of the two profiles is genuinely the same shape. */
  overlap: number;
  /** What makes these two feel alike — usually why someone is torn. */
  shared: DimensionDelta[];
  /** What actually separates them, strongest first. */
  divergent: DimensionDelta[];
  /** Divergent dimensions belonging to each side, for the "lean toward" lists. */
  favoursA: DimensionDelta[];
  favoursB: DimensionDelta[];
}

/** Both roles lean on this dimension at least this much for it to count as shared. */
const SHARED_FLOOR = 0.45;
/** Below this the gap is noise from authoring, not a real difference. */
const DIVERGENCE_FLOOR = 0.2;
/**
 * The role that wins a dimension must genuinely lean on it — at least half of
 * its own strongest trait.
 *
 * Without this the largest relative gaps are dimensions nobody does. Network
 * Administrator scores 3 on project delivery and NOC Technician scores 0, which
 * is the biggest proportional gap between them and completely uninformative:
 * neither job is project work. It topped the list on the first build and would
 * have told every reader the wrong thing about both roles.
 */
const PRESENCE_FLOOR = 0.5;

/**
 * Gaps are ranked by group weight as well as size, so a split over what the
 * work IS outranks a split over its rhythm. Same weights the matcher uses —
 * a comparison that ordered differences by a different notion of importance
 * than the engine that produced the match would be quietly contradicting it.
 */
function rankScore(d: DimensionDelta): number {
  return d.gap * GROUP_WEIGHT[groupOf(d.id)];
}

export function compareRoles(a: RoleCore, b: RoleCore): RoleComparison {
  const va = scaleToSelf(a.vector);
  const vb = scaleToSelf(b.vector);

  const shared: DimensionDelta[] = [];
  const divergent: DimensionDelta[] = [];

  for (const id of unionKeys(va, vb)) {
    const x = va[id] ?? 0;
    const y = vb[id] ?? 0;
    const gap = Math.round(Math.abs(x - y) * 1000) / 1000;
    const delta: DimensionDelta = { id, a: x, b: y, gap, leans: x >= y ? 'a' : 'b' };

    if (gap >= DIVERGENCE_FLOOR && Math.max(x, y) >= PRESENCE_FLOOR) divergent.push(delta);
    if (Math.min(x, y) >= SHARED_FLOOR && gap < DIVERGENCE_FLOOR) shared.push(delta);
  }

  divergent.sort((p, q) => rankScore(q) - rankScore(p));
  shared.sort(
    (p, q) =>
      Math.min(q.a, q.b) * GROUP_WEIGHT[groupOf(q.id)] -
      Math.min(p.a, p.b) * GROUP_WEIGHT[groupOf(p.id)],
  );

  return {
    a,
    b,
    overlap: overlapPercent(a.vector, b.vector),
    shared,
    divergent,
    favoursA: divergent.filter((d) => d.leans === 'a'),
    favoursB: divergent.filter((d) => d.leans === 'b'),
  };
}

/**
 * The same weighted cosine the matcher scores people with, so "84% overlap"
 * on this page and a match percentage on the results page mean the same thing.
 *
 * Unlike the match percentage it is NOT floored and stretched: two roles really
 * can be almost unrelated, and saying 6% is more useful than saying 0%.
 */
export function overlapPercent(a: Vector, b: Vector): number {
  return Math.round(weightedCosine(a, b) * 100);
}

/**
 * The few dimensions to lead with when saying "lean toward this one if…".
 *
 * Takes at most one per dimension group. Straight ranking produced lists like
 * "Data" followed by "Data & storage" — two near-synonyms filling two of the
 * three slots and saying one thing twice, while the genuinely different reason
 * sat just below the cut. Spreading across groups gives a reader one reason
 * about the subject matter, one about the way of working, and one about rhythm.
 */
export function leanHighlights(deltas: DimensionDelta[], limit = 3): DimensionDelta[] {
  const picked: DimensionDelta[] = [];
  const usedGroups = new Set<string>();

  for (const d of deltas) {
    const group = groupOf(d.id);
    if (usedGroups.has(group)) continue;
    usedGroups.add(group);
    picked.push(d);
    if (picked.length === limit) return picked;
  }

  // Only if there genuinely are not enough groups represented.
  for (const d of deltas) {
    if (picked.includes(d)) continue;
    picked.push(d);
    if (picked.length === limit) break;
  }
  return picked;
}

/** Canonical, order-independent identity for a pair. */
export function pairKey(a: string, b: string): string {
  return a < b ? `${a}--${b}` : `${b}--${a}`;
}

/** Canonical URL for a pair, always in the same order whichever way it is asked for. */
export function comparePath(a: string, b: string): string {
  const [first, second] = a < b ? [a, b] : [b, a];
  return `/navigator/compare/${first}-vs-${second}/`;
}
