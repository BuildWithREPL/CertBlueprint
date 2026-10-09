import type { Answer, DimensionId, RoleCore, Scenario, Vector } from '../types';
import { DIMENSIONS_BY_GROUP } from '../data/dimensions';
import { BROAD_SCENARIOS, DIFFERENTIATOR_SCENARIOS } from '../data/scenarios';
// Cores only — never `../data/roles`, which pulls every role's page content
// into the browser bundle.
import { ROLE_CORES } from '../data/roles/cores';
import { addVectors, normalizeByExposure } from './vector';
import { exposureForScenarios, weightedCosine } from './scoring';
import { SCENARIO_BY_ID } from '../data/scenarios';

/* ═══════════════════════════════════════════════════════════════════
   ADAPTIVE SELECTION

   Phase 1 — Breadth (8 scenarios).
     Fixed count, chosen for category spread. We are not trying to be clever
     here; we are trying to touch enough different kinds of work that the user's
     shape starts to show. Asking an adaptive question before there is any signal
     to adapt to just produces a confidently wrong early commitment.

   Phase 2 — Discrimination (up to 10 more, usually 4–7).
     Now we know roughly where the user sits, so we stop asking questions whose
     answer we can already predict and start asking the ones that would actually
     change the ranking.

     For each eligible scenario we simulate every option: what would the top role
     be if the user picked it? A scenario where all options lead to the same
     leader tells us nothing new. A scenario where different options produce
     different leaders is exactly the question worth asking. That is the
     discrimination score.

     This is a greedy one-step-lookahead rather than true information gain. It is
     within a rounding error of the same result for a bank this size, and it is
     something a maintainer can read and reason about — which matters more here
     than the last percent of optimality.

   Stopping.
     Stop when the leader is clear and stable, or at a hard cap. Never run to a
     fixed length: a person with a sharp, consistent profile should be finished
     in twelve questions, and dragging them to twenty teaches them to game it.
   ═══════════════════════════════════════════════════════════════════ */

export const BROAD_PHASE_LENGTH = 8;
export const MIN_QUESTIONS = 11;
export const MAX_QUESTIONS = 18;

/** Top-K candidate roles considered when measuring discrimination. */
const CANDIDATE_POOL = 8;

/** A dimension counts as "live" once it reaches this share of its available signal. */
const LIVE_THRESHOLD = 0.35;

/**
 * Below this discrimination score, the best remaining question cannot change
 * the leader and moves the scores by under a percentage point. See the
 * exhaustion stop in nextScenario().
 */
const EXHAUSTION_THRESHOLD = 1;

/** Deterministic per-session shuffle so repeat runs vary without being random. */
function seededOrder<T>(items: T[], seed: number): T[] {
  const out = [...items];
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 16807) % 2147483647;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const DOMAIN_DIMS: DimensionId[] = DIMENSIONS_BY_GROUP.domain.map((d) => d.id);

/**
 * Order the breadth phase so that every field gets offered early.
 *
 * Naive category rotation was not enough. Phase 2 only unlocks a cloud question
 * once cloud signal already exists, so if the first eight scenarios happened to
 * offer little cloud work, a genuinely cloud-shaped person could never build
 * enough signal to be asked about it — the assessment would confidently conclude
 * they were something else. A chicken-and-egg bug that only shows up as a
 * plausible wrong answer is the worst kind.
 *
 * So the sequence is built greedily: at each step take the scenario that most
 * improves coverage of whichever domains are still thin, with diminishing
 * returns on domains already well covered, and a penalty for repeating a recent
 * category so it still reads as varied. Ties fall back to a seeded shuffle, so
 * the order is stable per session but not identical for everyone.
 */
export function broadSequence(seed: number): Scenario[] {
  const pool = seededOrder(BROAD_SCENARIOS, seed);
  const out: Scenario[] = [];
  const covered: Vector = {};
  const recentCategories: string[] = [];

  while (pool.length > 0) {
    let bestIndex = 0;
    let bestScore = -Infinity;

    pool.forEach((scenario, index) => {
      const offered = exposureForScenarios([scenario]);
      let score = 0;
      for (const dim of DOMAIN_DIMS) {
        const already = covered[dim] ?? 0;
        // Diminishing returns: the first chance to express a domain is worth
        // far more than the fifth.
        score += (offered[dim] ?? 0) / (1 + already);
      }
      if (recentCategories.slice(-2).includes(scenario.category)) score -= 1.5;
      if (score > bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    });

    const [picked] = pool.splice(bestIndex, 1);
    out.push(picked);
    recentCategories.push(picked.category);
    for (const [dim, value] of Object.entries(exposureForScenarios([picked])) as [DimensionId, number][]) {
      covered[dim] = (covered[dim] ?? 0) + value;
    }
  }

  return out;
}

function liveDimensions(normalized: Vector): Set<DimensionId> {
  const live = new Set<DimensionId>();
  for (const [id, value] of Object.entries(normalized) as [DimensionId, number][]) {
    if (value >= LIVE_THRESHOLD) live.add(id);
  }
  return live;
}

/**
 * A differentiator is eligible when the user has shown signal in at least half
 * of its trigger dimensions. Untriggered scenarios stay out of the pool entirely
 * — a person with no security signal is never asked to choose between detection
 * and prevention, because whichever they picked would be noise.
 */
function isEligible(scenario: Scenario, live: Set<DimensionId>): boolean {
  if (!scenario.triggers || scenario.triggers.length === 0) return true;
  const hits = scenario.triggers.filter((t) => live.has(t)).length;
  return hits >= Math.ceil(scenario.triggers.length / 2);
}

function topSlug(vector: Vector, pool: RoleCore[]): string | null {
  let best: string | null = null;
  let bestScore = -Infinity;
  for (const role of pool) {
    const score = weightedCosine(vector, role.vector);
    if (score > bestScore) {
      bestScore = score;
      best = role.slug;
    }
  }
  return best;
}

/**
 * How much would asking this scenario change the answer?
 *
 * Simulates each option against the current top candidates and counts how many
 * distinct roles could end up leading. Ties are broken by score spread, so
 * between two scenarios that could both flip the leader we prefer the one that
 * moves the numbers further.
 */
export function discriminationScore(scenario: Scenario, raw: Vector, exposure: Vector): number {
  const currentNormalized = normalizeByExposure(raw, exposure);
  const candidates = ROLE_CORES.map((role) => ({ role, score: weightedCosine(currentNormalized, role.vector) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, CANDIDATE_POOL)
    .map((c) => c.role);

  // Asking this scenario would also add its own exposure, so the projection has
  // to account for both sides of the fraction — otherwise every candidate looks
  // artificially stronger simply because one more question was asked.
  const projectedExposure = addVectors(exposure, exposureForScenarios([scenario]));

  const leaders = new Set<string>();
  let minTop = Infinity;
  let maxTop = -Infinity;

  for (const option of scenario.options) {
    const projected = normalizeByExposure(addVectors(raw, option.weights), projectedExposure);
    const leader = topSlug(projected, candidates);
    if (leader) leaders.add(leader);
    const leaderScore = Math.max(...candidates.map((r) => weightedCosine(projected, r.vector)));
    minTop = Math.min(minTop, leaderScore);
    maxTop = Math.max(maxTop, leaderScore);
  }

  const spread = Number.isFinite(maxTop - minTop) ? maxTop - minTop : 0;
  return (leaders.size - 1) * 10 + spread * 100;
}

export interface NextQuestion {
  scenario: Scenario | null;
  /** 0–1, drives the ambient progress indicator. Never shown as "n of m". */
  progress: number;
  done: boolean;
}

/**
 * Pick the next scenario, or signal completion.
 *
 * `confidenceIsHigh` is passed in rather than recomputed so the caller keeps a
 * single source of truth for confidence (engine/scoring.ts).
 */
export function nextScenario(
  answers: Answer[],
  seed: number,
  confidenceIsHigh: boolean,
): NextQuestion {
  const answeredIds = new Set(answers.map((a) => a.scenarioId));
  const count = answers.length;

  // ── Phase 1: breadth ──────────────────────────────────────────────
  if (count < BROAD_PHASE_LENGTH) {
    const sequence = broadSequence(seed);
    const next = sequence.find((s) => !answeredIds.has(s.id)) ?? null;
    return { scenario: next, progress: count / MIN_QUESTIONS, done: next === null };
  }

  // ── Stop conditions ───────────────────────────────────────────────
  if (count >= MAX_QUESTIONS) return { scenario: null, progress: 1, done: true };
  if (count >= MIN_QUESTIONS && confidenceIsHigh) return { scenario: null, progress: 1, done: true };

  // ── Phase 2: discrimination ───────────────────────────────────────
  let raw: Vector = {};
  const seen: Scenario[] = [];
  for (const answer of answers) {
    const scenario = SCENARIO_BY_ID[answer.scenarioId];
    if (!scenario) continue;
    seen.push(scenario);
    const option = scenario.options.find((o) => o.id === answer.optionId);
    if (option) raw = addVectors(raw, option.weights);
  }
  const exposure = exposureForScenarios(seen);
  const live = liveDimensions(normalizeByExposure(raw, exposure));

  const pool = DIFFERENTIATOR_SCENARIOS.filter((s) => !answeredIds.has(s.id) && isEligible(s, live));

  // Fall back to any remaining broad scenario if the differentiator pool is dry.
  if (pool.length === 0) {
    const leftover = broadSequence(seed).find((s) => !answeredIds.has(s.id)) ?? null;
    return {
      scenario: leftover,
      progress: Math.min(1, count / MIN_QUESTIONS),
      done: leftover === null,
    };
  }

  let best = pool[0];
  let bestScore = -Infinity;
  for (const scenario of seededOrder(pool, seed + count)) {
    const score = discriminationScore(scenario, raw, exposure);
    if (score > bestScore) {
      bestScore = score;
      best = scenario;
    }
  }

  /*
   * Exhaustion stop: if the single most discriminating question left could not
   * change who is leading, and barely moves the numbers, there is nothing more
   * to learn. Continuing to the hard cap would only pad the experience — and
   * padding is how an assessment teaches people to start guessing at what it
   * wants. When two roles are genuinely tied, the honest move is to stop and
   * say they are tied, which is exactly what the confidence message does.
   */
  if (count >= MIN_QUESTIONS && bestScore < EXHAUSTION_THRESHOLD) {
    return { scenario: null, progress: 1, done: true };
  }

  return { scenario: best, progress: Math.min(0.95, count / MIN_QUESTIONS), done: false };
}
