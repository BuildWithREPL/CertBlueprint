import type {
  Answer,
  AssessmentResult,
  Confidence,
  DimensionId,
  DomainId,
  RoleCore,
  RoleMatch,
  Scenario,
  Vector,
} from '../types';
import { GROUP_WEIGHT } from '../data/dimensions';
// Cores only — see the note in engine/adaptive.ts.
import { ROLE_CORES } from '../data/roles/cores';
import { SCENARIO_BY_ID } from '../data/scenarios';
import {
  addVectors,
  blendVectors,
  groupOf,
  normalizeByExposure,
  normalizeByGroup,
  rankDimensions,
  unionKeys,
} from './vector';

/* ═══════════════════════════════════════════════════════════════════
   THE MODEL — group-weighted cosine similarity on group-normalized vectors.

   Why cosine rather than Euclidean distance or raw weighted totals:

   • Raw totals reward answering more questions, and reward roles whose vectors
     happen to be dense. A role authored with 25 dimensions would beat one
     authored with 15 for reasons that are purely about the data entry. Cosine
     compares DIRECTION, so a sparse, sharply-defined role competes fairly.

   • Euclidean distance would penalise a user for having weaker overall signal
     than a role's idealised profile. Someone who answered ten questions has a
     smaller vector than the Network Security Engineer profile by construction —
     but their *shape* can still match it perfectly. Direction is the thing we
     actually mean by "this kind of work attracts you".

   • Group weights are applied inside the cosine (as sqrt weights on both
     vectors), so the metric stays a true cosine while letting us say that domain
     affinity matters more than work-rhythm preference.

   The one thing cosine will not do is tell you HOW MUCH someone wants any of
   this. That is what the confidence calculation is for, and why a low-signal
   result says so instead of inventing a 94% match.
   ═══════════════════════════════════════════════════════════════════ */

/**
 * Similarity floor and ceiling for the display percentage.
 *
 * Cosine over sparse vectors of this kind naturally lands between about 0.30
 * (unrelated) and 0.95 (a genuinely close match). Mapping that band onto 0–100
 * keeps the numbers honest: an unrelated role reads ~0%, not ~45%, and nothing
 * ever reads 100% because no real person is a perfect instance of a job profile.
 */
const SIM_FLOOR = 0.3;
const SIM_CEIL = 0.95;

export function weightedCosine(user: Vector, role: Vector): number {
  let dot = 0;
  let userMag = 0;
  let roleMag = 0;
  for (const id of unionKeys(user, role)) {
    const w = GROUP_WEIGHT[groupOf(id)];
    const u = (user[id] ?? 0) * w;
    const r = (role[id] ?? 0) * w;
    dot += u * r;
    userMag += u * u;
    roleMag += r * r;
  }
  if (userMag === 0 || roleMag === 0) return 0;
  return dot / (Math.sqrt(userMag) * Math.sqrt(roleMag));
}

function toPercent(sim: number): number {
  const scaled = (sim - SIM_FLOOR) / (SIM_CEIL - SIM_FLOOR);
  return Math.max(0, Math.min(99, Math.round(scaled * 100)));
}

/**
 * Dimensions doing the most work in a given match — the intersection of what
 * the user leans toward and what the role requires. Used verbatim for the
 * "why this appeared" explanation, so it must be the real contribution, not a
 * post-hoc rationalisation.
 */
function driversFor(user: Vector, role: Vector, limit = 5): DimensionId[] {
  const contributions: Array<[DimensionId, number]> = [];
  for (const id of unionKeys(user, role)) {
    const w = GROUP_WEIGHT[groupOf(id)];
    const c = (user[id] ?? 0) * (role[id] ?? 0) * w * w;
    if (c > 0) contributions.push([id, c]);
  }
  return contributions
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id);
}

/**
 * Flags a match as an intersection when the role spans two domains AND the user
 * showed real signal in both. Without the second condition every multi-domain
 * role would be labelled an intersection, which would make the label meaningless.
 */
function intersectionFor(normalized: Vector, role: RoleCore): [DomainId, DomainId] | undefined {
  if (role.domains.length < 2) return undefined;
  const strong = role.domains.filter((d) => (normalized[`dom.${d}` as DimensionId] ?? 0) >= 0.55);
  if (strong.length >= 2) return [strong[0], strong[1]];
  return undefined;
}

/** Accumulate the raw interest vector from a set of answers. */
export function vectorFromAnswers(answers: Answer[]): Vector {
  let v: Vector = {};
  for (const answer of answers) {
    const scenario = SCENARIO_BY_ID[answer.scenarioId];
    if (!scenario) continue;
    const option = scenario.options.find((o) => o.id === answer.optionId);
    if (!option) continue;
    v = addVectors(v, option.weights);
  }
  return v;
}

/**
 * The most a person COULD have scored on each dimension, given the specific
 * scenarios they were shown. Per scenario this is the best single option for
 * that dimension, because they only get to choose one.
 *
 * This is the denominator that makes the result independent of how balanced the
 * content happens to be — see normalizeByExposure in vector.ts.
 */
export function exposureForScenarios(scenarios: Scenario[]): Vector {
  let total: Vector = {};
  for (const scenario of scenarios) {
    const best: Vector = {};
    for (const option of scenario.options) {
      for (const [id, value] of Object.entries(option.weights) as [DimensionId, number][]) {
        best[id] = Math.max(best[id] ?? 0, value);
      }
    }
    total = addVectors(total, best);
  }
  return total;
}

export function exposureFromAnswers(answers: Answer[]): Vector {
  return exposureForScenarios(
    answers.map((a) => SCENARIO_BY_ID[a.scenarioId]).filter((s): s is Scenario => Boolean(s)),
  );
}

/**
 * How much the technology inventory contributes relative to scenario answers.
 * Deliberately well below 1: having run something is weaker evidence about what
 * you would enjoy than choosing it when nothing forced you to.
 */
const INVENTORY_WEIGHT = 0.35;

export function matchRoles(normalized: Vector, roles: RoleCore[] = ROLE_CORES): RoleMatch[] {
  return roles
    .map((role) => {
      const score = weightedCosine(normalized, role.vector);
      return {
        slug: role.slug,
        role,
        score,
        percent: toPercent(score),
        drivers: driversFor(normalized, role.vector),
        intersection: intersectionFor(normalized, role),
      } satisfies RoleMatch;
    })
    .sort((a, b) => b.score - a.score);
}

/**
 * Confidence is deliberately conservative. Faking precision is the failure mode
 * that makes assessments feel like horoscopes: three roles separated by 0.4% get
 * presented as a ranking, the user acts on the top one, and the tool was never
 * actually able to distinguish them.
 */
export function computeConfidence(matches: RoleMatch[], answered: number, normalized: Vector): Confidence {
  const top = matches[0];
  const second = matches[1];
  if (!top) {
    return { level: 'low', margin: 0, coverage: 0, tied: [], message: 'No signal yet.' };
  }

  // Margin is measured in the SAME units the user sees. A gap the results page
  // renders as "84% and 81%" should not be called decisive by internal maths the
  // reader has no access to.
  const margin = second ? (top.percent - second.percent) / 100 : 1;

  // Coverage: how many of the five dimension groups received any signal at all.
  const groupsSeen = new Set(Object.keys(normalized).map((id) => groupOf(id as DimensionId)));
  const coverage = groupsSeen.size / 5;

  const tied = matches
    .slice(1)
    .filter((m) => top.percent - m.percent <= 3)
    .map((m) => m.slug);

  let level: Confidence['level'];
  if (answered >= 11 && margin >= 0.04 && coverage >= 0.6) level = 'high';
  else if (answered >= 8 && (margin >= 0.02 || coverage >= 0.6)) level = 'moderate';
  else level = 'low';

  let message: string;
  if (level === 'low') {
    message =
      'There is not enough signal here to say much yet. Treat these as directions worth reading about rather than as a result.';
  } else if (tied.length > 0) {
    const names = [top.role.name, ...tied.slice(0, 2).map((s) => matches.find((m) => m.slug === s)!.role.name)];
    message = `Your answers point almost equally at ${listPhrase(names)}. That is a real result, not a failure to decide — these roles overlap heavily in practice, and people move between them.`;
  } else if (level === 'moderate') {
    message =
      'The pattern is reasonably clear, though the top few are close. Read the first two or three rather than fixating on the order.';
  } else {
    message = 'The pattern here is consistent across your answers. The top matches are meaningfully ahead of the rest.';
  }

  return { level, margin, coverage, tied, message };
}

function listPhrase(items: string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

/** Deduplicated rationale phrases from the options the user actually chose. */
export function driversFromAnswers(answers: Answer[], limit = 6): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const answer of answers) {
    const scenario = SCENARIO_BY_ID[answer.scenarioId];
    const option = scenario?.options.find((o) => o.id === answer.optionId);
    if (!option) continue;
    const phrase = option.rationale;
    if (seen.has(phrase)) continue;
    seen.add(phrase);
    out.push(phrase);
  }
  return out.slice(0, limit);
}

export function domainScores(normalized: Vector): Array<{ id: DomainId; score: number }> {
  return rankDimensions(normalized, 'domain').map(([id, score]) => ({
    id: id.replace('dom.', '') as DomainId,
    score,
  }));
}

/**
 * The single entry point the UI calls. Everything above is exported for tests
 * and for the inventory feature, but pages should use this.
 */
export function scoreAssessment(answers: Answer[], seedVector: Vector = {}): AssessmentResult {
  const raw = vectorFromAnswers(answers);
  const answerSignal = normalizeByExposure(raw, exposureFromAnswers(answers));
  // The inventory has no scenarios behind it, so it is normalized within its own
  // groups and then blended in at a lower weight.
  const inventorySignal = Object.keys(seedVector).length > 0 ? normalizeByGroup(seedVector) : {};
  const normalized = blendVectors(answerSignal, inventorySignal, INVENTORY_WEIGHT);

  const matches = matchRoles(normalized);
  return {
    vector: raw,
    normalized,
    matches,
    confidence: computeConfidence(matches, answers.length, normalized),
    domainScores: domainScores(normalized),
    drivers: driversFromAnswers(answers),
    answered: answers.length,
  };
}
