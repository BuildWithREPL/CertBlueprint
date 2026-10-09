import type { Capability, DomainId, Technology, Vector } from '../types';
import { CAPABILITY_BY_SLUG } from '../data/capabilities';
import { TECHNOLOGY_BY_SLUG } from '../data/technologies';
// Cores only — see the note in engine/adaptive.ts.
import { ROLE_CORE_BY_SLUG } from '../data/roles/cores';
import { addVectors, normalizeByGroup } from './vector';
import { matchRoles } from './scoring';

/* ═══════════════════════════════════════════════════════════════════
   EXPERIENCED-PROFESSIONAL INVENTORY

   The claim this feature exists to make: a lot of people are already doing work
   that belongs to a field they think they are not in.

   The mechanism is the graph, not a lookup table. Selecting FortiGate does not
   map to "Network Security Engineer". It maps to firewall-policy, traffic
   inspection, IDS/IPS, VPN, segmentation and policy enforcement — six
   capabilities that each carry their own vector contribution. The role match
   falls out of the accumulated capabilities, which is why it survives someone
   switching vendors, and why it can surface a role nobody would have guessed
   from any single technology on the list.

   Technologies contribute at a lower weight than scenario answers on purpose.
   Having touched something is weaker evidence about what you ENJOY than choosing
   it when nobody made you. The inventory sharpens the picture; it does not
   overrule the assessment.
   ═══════════════════════════════════════════════════════════════════ */

/** Capability weight per claimed technology. Deliberately below scenario weight. */
const CAPABILITY_WEIGHT = 0.55;
/** Direct technology vector weight, on top of its capabilities. */
const TECHNOLOGY_WEIGHT = 0.4;

export interface InventoryInsight {
  /** Capabilities the person demonstrably has, most-reinforced first. */
  capabilities: Array<{ capability: Capability; reinforcedBy: Technology[] }>;
  /** Domains their tooling actually spans, with a 0–1 strength. */
  domains: Array<{ id: DomainId; strength: number }>;
  /** The "you may have more of this than you realise" lines, deduplicated. */
  revelations: Array<{ technology: Technology; text: string }>;
  /** Roles implied by the capability set alone. */
  impliedRoles: Array<{ slug: string; name: string; percent: number }>;
  /** Certification slugs the tooling points at, most-referenced first. */
  certs: string[];
  vector: Vector;
}

export function vectorFromInventory(slugs: string[]): Vector {
  let v: Vector = {};
  for (const slug of slugs) {
    const tech = TECHNOLOGY_BY_SLUG[slug];
    if (!tech) continue;
    for (const capSlug of tech.capabilities) {
      const cap = CAPABILITY_BY_SLUG[capSlug];
      if (cap) v = addVectors(v, cap.vector, CAPABILITY_WEIGHT);
    }
    if (tech.vector) v = addVectors(v, tech.vector, TECHNOLOGY_WEIGHT);
  }
  return v;
}

/**
 * The same accumulation, entered from capabilities directly rather than through
 * the technologies that imply them.
 *
 * Used by the military mapping, where the person did the work but on equipment
 * whose name is meaningless to a civilian employer — and often on equipment
 * this site could not list without turning into a defence catalogue. Weighted
 * identically to the inventory: claimed experience is claimed experience,
 * whichever door it came through.
 */
export function vectorFromCapabilities(slugs: string[]): Vector {
  let v: Vector = {};
  for (const slug of slugs) {
    const cap = CAPABILITY_BY_SLUG[slug];
    if (cap) v = addVectors(v, cap.vector, CAPABILITY_WEIGHT);
  }
  return v;
}

/**
 * The complete "what you have already done" signal, from both doors.
 *
 * Technologies and military capabilities are the same kind of evidence — work
 * you have actually performed — so they are summed rather than ranked against
 * each other. `scoreAssessment` normalizes and weights the result, which is why
 * the two can be added here without either one drowning the other.
 */
export function seedVectorFrom(inventory: string[], military: string[]): Vector {
  return addVectors(vectorFromInventory(inventory), vectorFromCapabilities(military));
}

export interface CapabilityInsight {
  domains: Array<{ id: DomainId; strength: number }>;
  impliedRoles: Array<{ slug: string; name: string; percent: number }>;
  vector: Vector;
}

export function analyseCapabilities(slugs: string[]): CapabilityInsight {
  const capabilities = slugs.map((s) => CAPABILITY_BY_SLUG[s]).filter(Boolean);

  const domainCounts = new Map<DomainId, number>();
  for (const cap of capabilities) {
    for (const domain of cap.domains) {
      domainCounts.set(domain, (domainCounts.get(domain) ?? 0) + 1);
    }
  }
  const maxDomain = Math.max(1, ...domainCounts.values());
  const domains = [...domainCounts.entries()]
    .map(([id, count]) => ({ id, strength: count / maxDomain }))
    .sort((a, b) => b.strength - a.strength);

  const vector = vectorFromCapabilities(slugs);
  const impliedRoles = matchRoles(normalizeByGroup(vector))
    .slice(0, 6)
    .map((m) => ({ slug: m.slug, name: m.role.name, percent: m.percent }));

  return { domains, impliedRoles, vector };
}

export function analyseInventory(slugs: string[]): InventoryInsight {
  const technologies = slugs.map((s) => TECHNOLOGY_BY_SLUG[s]).filter(Boolean);

  // ── Capabilities, ranked by how many selected technologies reinforce them ──
  const capMap = new Map<string, Technology[]>();
  for (const tech of technologies) {
    for (const capSlug of tech.capabilities) {
      const list = capMap.get(capSlug) ?? [];
      list.push(tech);
      capMap.set(capSlug, list);
    }
  }
  const capabilities = [...capMap.entries()]
    .map(([slug, reinforcedBy]) => ({ capability: CAPABILITY_BY_SLUG[slug], reinforcedBy }))
    .filter((c) => Boolean(c.capability))
    .sort((a, b) => b.reinforcedBy.length - a.reinforcedBy.length);

  // ── Domain spread, from capabilities rather than from the tech's own labels ──
  const domainCounts = new Map<DomainId, number>();
  for (const { capability, reinforcedBy } of capabilities) {
    for (const domain of capability.domains) {
      domainCounts.set(domain, (domainCounts.get(domain) ?? 0) + reinforcedBy.length);
    }
  }
  const maxDomain = Math.max(1, ...domainCounts.values());
  const domains = [...domainCounts.entries()]
    .map(([id, count]) => ({ id, strength: count / maxDomain }))
    .sort((a, b) => b.strength - a.strength);

  const revelations = technologies
    .filter((t) => Boolean(t.revelation))
    .map((technology) => ({ technology, text: technology.revelation! }));

  const vector = vectorFromInventory(slugs);
  const impliedRoles = matchRoles(normalizeByGroup(vector))
    .slice(0, 6)
    .map((m) => ({ slug: m.slug, name: m.role.name, percent: m.percent }));

  // ── Certifications, ranked by how many selected technologies point at them ──
  const certCounts = new Map<string, number>();
  for (const tech of technologies) {
    for (const cert of tech.certs) certCounts.set(cert, (certCounts.get(cert) ?? 0) + 1);
  }
  const certs = [...certCounts.entries()].sort((a, b) => b[1] - a[1]).map(([slug]) => slug);

  return { capabilities, domains, revelations, impliedRoles, certs, vector };
}

/**
 * Roles that the selected technologies name directly, as opposed to roles the
 * vector maths implies. Useful as a sanity check on the graph — if the two lists
 * never overlap, either the vectors or the role tags are wrong.
 */
export function rolesNamedByTechnologies(slugs: string[]): string[] {
  const counts = new Map<string, number>();
  for (const slug of slugs) {
    const tech = TECHNOLOGY_BY_SLUG[slug];
    if (!tech) continue;
    for (const role of tech.roles) {
      if (ROLE_CORE_BY_SLUG[role]) counts.set(role, (counts.get(role) ?? 0) + 1);
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([slug]) => slug);
}
