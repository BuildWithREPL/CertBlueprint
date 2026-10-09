import type { Role } from '../types';
import { ROLES, ROLE_BY_SLUG } from './roles';
import { overlapPercent, pairKey } from '../engine/compare';

/* ═══════════════════════════════════════════════════════════════════
   WHICH PAIRS GET A PAGE

   Thirty-eight roles make 703 possible pairings, and almost all of them are
   nonsense — nobody is torn between Wireless Engineer and GRC Analyst. Building
   all 703 would also be the textbook programmatic-SEO footprint: a 142-page site
   suddenly sprouting 700 near-identical pages, which is the pattern search
   engines demote and, more to the point, the pattern that would make this site
   worse to use.

   So a pair earns a page one of two ways, both derived from data that already
   exists:

     1. Someone authored the move. If a role lists the other as adjacent, real
        people make that jump and will want to know what changes.
     2. The vectors say they are confusable. High overlap AND a shared domain —
        the combination that puts two roles two points apart on a results page
        and leaves someone stuck.

   Everything else has no page, on purpose. "These two are not really
   comparable" is a true and useful answer.
   ═══════════════════════════════════════════════════════════════════ */

/** Vector overlap at or above which two roles in the same field are genuinely confusable. */
const CONFUSABLE_AT = 78;

/**
 * Ceiling on computed pairs per role. Hub roles (Security Engineer sits near
 * almost everything) would otherwise generate a page against half the graph and
 * bury the comparisons that matter. Authored adjacency is never capped — that
 * one is a human saying the move is real.
 */
const MAX_COMPUTED_PER_ROLE = 5;

export interface RolePair {
  a: Role;
  b: Role;
  overlap: number;
  /** Why this pair exists — shown on the page, because a comparison should say why it is one. */
  reasons: Array<'adjacent' | 'confusable'>;
  /** The authored reason for the move, when one of them declares the other adjacent. */
  adjacencyNote?: string;
}

function buildPairs(): RolePair[] {
  const found = new Map<string, RolePair>();

  const record = (
    a: Role,
    b: Role,
    reason: 'adjacent' | 'confusable',
    note?: string,
  ): void => {
    // Canonical order so a→b and b→a are one page, not two competing ones.
    const [first, second] = a.slug < b.slug ? [a, b] : [b, a];
    const key = pairKey(a.slug, b.slug);
    const existing = found.get(key);
    if (existing) {
      if (!existing.reasons.includes(reason)) existing.reasons.push(reason);
      if (note && !existing.adjacencyNote) existing.adjacencyNote = note;
      return;
    }
    found.set(key, {
      a: first,
      b: second,
      overlap: overlapPercent(first.vector, second.vector),
      reasons: [reason],
      adjacencyNote: note,
    });
  };

  // 1. Authored moves, in both directions.
  for (const role of ROLES) {
    for (const adj of role.adjacent) {
      const other = ROLE_BY_SLUG[adj.slug];
      if (other) record(role, other, 'adjacent', adj.reason);
    }
  }

  // 2. Confusable pairs — same field, near-identical shape.
  for (const role of ROLES) {
    const candidates = ROLES.filter(
      (other) =>
        other.slug !== role.slug &&
        other.domains.some((d) => role.domains.includes(d)),
    )
      .map((other) => ({ other, overlap: overlapPercent(role.vector, other.vector) }))
      .filter((c) => c.overlap >= CONFUSABLE_AT)
      .sort((x, y) => y.overlap - x.overlap)
      .slice(0, MAX_COMPUTED_PER_ROLE);

    for (const c of candidates) record(role, c.other, 'confusable');
  }

  return [...found.values()].sort((x, y) => y.overlap - x.overlap);
}

export const ROLE_PAIRS: RolePair[] = buildPairs();

export const PAIR_KEYS: Set<string> = new Set(ROLE_PAIRS.map((p) => pairKey(p.a.slug, p.b.slug)));

/** Every comparison a given role takes part in, most similar first. */
export function pairsForRole(slug: string): RolePair[] {
  return ROLE_PAIRS.filter((p) => p.a.slug === slug || p.b.slug === slug);
}

export function hasPair(a: string, b: string): boolean {
  return PAIR_KEYS.has(pairKey(a, b));
}

/**
 * Fails the build rather than shipping a comparison that cannot be reached or
 * one that compares a role with itself.
 *
 * The coverage check is the one worth having: a role in no comparison at all is
 * a dead end for anyone who lands on it while deciding between two things, and
 * nothing else in the codebase would ever surface that.
 */
export function assertRolePairIntegrity(): void {
  const errors: string[] = [];
  const covered = new Set<string>();

  for (const pair of ROLE_PAIRS) {
    if (pair.a.slug === pair.b.slug) errors.push(`${pair.a.slug} is paired with itself`);
    if (pair.a.slug >= pair.b.slug) {
      errors.push(`${pair.a.slug} / ${pair.b.slug} is not in canonical order`);
    }
    if (pair.reasons.length === 0) errors.push(`${pair.a.slug} / ${pair.b.slug} has no stated reason`);
    covered.add(pair.a.slug);
    covered.add(pair.b.slug);
  }

  for (const role of ROLES) {
    if (!covered.has(role.slug)) {
      errors.push(`${role.slug} appears in no comparison — nothing links to it from a decision`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Navigator role pairs are broken:\n  ${errors.join('\n  ')}`);
  }
}
