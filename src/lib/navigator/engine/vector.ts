import type { DimensionGroup, DimensionId, Vector } from '../types';
import { DIMENSION_BY_ID, DIMENSIONS_BY_GROUP, GROUPS } from '../data/dimensions';

/** Add `b` into `a`, returning a new vector. Sparse in, sparse out. */
export function addVectors(a: Vector, b: Vector, scale = 1): Vector {
  const out: Vector = { ...a };
  for (const [k, v] of Object.entries(b) as [DimensionId, number][]) {
    out[k] = (out[k] ?? 0) + v * scale;
  }
  return out;
}

export function sumVectors(vectors: Vector[]): Vector {
  return vectors.reduce<Vector>((acc, v) => addVectors(acc, v), {});
}

export function magnitude(v: Vector): number {
  let sum = 0;
  for (const value of Object.values(v)) sum += value * value;
  return Math.sqrt(sum);
}

/**
 * Normalize each dimension GROUP independently to a 0–1 scale.
 *
 * This matters more than it looks. Domain affinity has 8 dimensions and
 * accumulates large raw totals; security affinity has 9 but only fires for some
 * users. Comparing raw sums would let whichever group happened to receive the
 * most weight dominate the similarity calculation regardless of what it meant.
 * Normalizing per group makes "strongly networking" and "strongly investigative"
 * comparable statements.
 *
 * Division is by the group's own maximum rather than by its L2 norm because the
 * result is also rendered directly as the interest-pattern bars — a user should
 * see their strongest dimension in a group as a full bar.
 */
export function normalizeByGroup(v: Vector): Vector {
  const out: Vector = {};
  for (const group of GROUPS) {
    const dims = DIMENSIONS_BY_GROUP[group];
    let max = 0;
    for (const d of dims) max = Math.max(max, v[d.id] ?? 0);
    if (max <= 0) continue;
    for (const d of dims) {
      const value = v[d.id] ?? 0;
      if (value > 0) out[d.id] = value / max;
    }
  }
  return out;
}

/**
 * Normalize against OPPORTUNITY rather than against other dimensions.
 *
 * This is the correction for the single biggest flaw a scenario bank can have.
 * Content is never perfectly balanced — when this was first measured, options
 * carrying cybersecurity weight outnumbered cloud ones six to one, purely
 * because security scenarios are easier and more fun to write. Under plain
 * group-max normalization that skew becomes the result: everybody drifts toward
 * security, and someone who is genuinely cloud-shaped cannot register it. That
 * is precisely the "it didn't identify my actual strength" failure.
 *
 * So instead of asking "how big is your networking score relative to your other
 * scores", we ask "of the chances you were GIVEN to choose networking work, how
 * many did you take". A dimension that was rarely offered is no longer punished
 * for being rarely offered, and the metric self-corrects as scenarios are added
 * or reworded — no recalibration pass, no magic per-dimension constants.
 *
 * `PRIOR` is Bayesian shrinkage toward zero. Without it, a dimension offered
 * exactly once and taken once would score a perfect 1.0 off a single click.
 * With it, one lucky pick reads as moderate interest and ten consistent picks
 * read as strong interest — which is what those two things actually mean.
 */
const PRIOR = 3;

export function normalizeByExposure(raw: Vector, exposure: Vector): Vector {
  const out: Vector = {};
  for (const [id, value] of Object.entries(raw) as [DimensionId, number][]) {
    const offered = exposure[id] ?? 0;
    if (offered <= 0 || value <= 0) continue;
    out[id] = Math.min(1, value / (offered + PRIOR));
  }
  return out;
}

/**
 * Combine the assessment signal with the technology-inventory signal.
 *
 * Kept as an explicit blend rather than summing raw vectors because the two
 * mean different things: the inventory says what you have DONE, the scenarios
 * say what you would CHOOSE. Choice is the better predictor of enjoyment, so it
 * dominates, and the weight that says so is one number in one place.
 */
export function blendVectors(primary: Vector, secondary: Vector, secondaryWeight: number): Vector {
  const out: Vector = { ...primary };
  for (const [id, value] of Object.entries(secondary) as [DimensionId, number][]) {
    out[id] = Math.min(1, (out[id] ?? 0) + value * secondaryWeight);
  }
  return out;
}

/** Which group a dimension belongs to. */
export function groupOf(id: DimensionId): DimensionGroup {
  return DIMENSION_BY_ID[id].group;
}

/** Dimensions present in either vector, so we never iterate all 41 unnecessarily. */
export function unionKeys(a: Vector, b: Vector): DimensionId[] {
  const keys = new Set<DimensionId>();
  for (const k of Object.keys(a) as DimensionId[]) keys.add(k);
  for (const k of Object.keys(b) as DimensionId[]) keys.add(k);
  return [...keys];
}

/** Sorted descending, omitting zeros. Used for bars and driver lists. */
export function rankDimensions(v: Vector, group?: DimensionGroup): Array<[DimensionId, number]> {
  return (Object.entries(v) as [DimensionId, number][])
    .filter(([id, value]) => value > 0 && (!group || groupOf(id) === group))
    .sort((a, b) => b[1] - a[1]);
}
