import { GRAPH_EDGES, GRAPH_NODES, assertGraphIntegrity } from '../../lib/navigator/data/graph';
import { layoutGraph, assertLayoutLegible } from '../../lib/navigator/engine/layout';
import { ROLES, ROLE_BY_SLUG } from '../../lib/navigator/data/roles';
import { DOMAINS, DOMAIN_BY_ID, ACCENT_VAR } from '../../lib/navigator/data/domains';
import { TECHNOLOGIES, TECHNOLOGY_BY_SLUG } from '../../lib/navigator/data/technologies';
import { trialsForRole } from '../../lib/navigator/data/trials';
import { ROLE_PAIRS } from '../../lib/navigator/data/role-pairs';
import { comparePath } from '../../lib/navigator/engine/compare';
import { ROLE_SALARY } from '../../lib/navigator/data/salary';

/**
 * The canonical payload behind the interactive career map.
 *
 * One generated file, from the same role data every other page renders, so the
 * map cannot drift from the role pages it links to. Fetched once by the map
 * application; the page itself is server-rendered and works without it.
 *
 * The important modelling decision here: **moves are directed**. Role adjacency
 * is authored one way at a time, with a reason written from the source role's
 * point of view ("you already own the paths; securing them is the same job
 * with policy added"). data/graph.ts collapses that into undirected edges
 * because a drawn line has no direction, but routing does: "how do I get from
 * help desk to security architect" is a different question from the reverse,
 * and a reverse move nobody authored is not evidence that the move is sensible.
 */

export interface GraphMove {
  from: string;
  to: string;
  reason: string;
  /** True when the opposite direction is authored too. */
  mutual: boolean;
}

function buildMoves(): GraphMove[] {
  const authored = new Set<string>();
  for (const role of ROLES) {
    for (const adj of role.adjacent) {
      if (ROLE_BY_SLUG[adj.slug]) authored.add(`${role.slug}>${adj.slug}`);
    }
  }
  const moves: GraphMove[] = [];
  for (const role of ROLES) {
    for (const adj of role.adjacent) {
      if (!ROLE_BY_SLUG[adj.slug]) continue;
      moves.push({
        from: role.slug,
        to: adj.slug,
        reason: adj.reason,
        mutual: authored.has(`${adj.slug}>${role.slug}`),
      });
    }
  }
  return moves;
}

/** Roles reachable by following authored moves in the direction they are authored. */
function directedReachable(starts: string[], moves: GraphMove[]): Set<string> {
  const out = new Map<string, string[]>();
  for (const m of moves) {
    if (!out.has(m.from)) out.set(m.from, []);
    out.get(m.from)!.push(m.to);
  }
  const seen = new Set<string>(starts);
  const queue = [...starts];
  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const next of out.get(current) ?? []) {
      if (seen.has(next)) continue;
      seen.add(next);
      queue.push(next);
    }
  }
  return seen;
}

export function GET() {
  assertGraphIntegrity();

  const layout = layoutGraph(GRAPH_NODES, GRAPH_EDGES);
  assertLayoutLegible(layout);

  const moves = buildMoves();
  const positions = new Map(layout.nodes.map((n) => [n.slug, n]));
  const entrySlugs = GRAPH_NODES.filter((n) => n.entry === 'first-job').map((n) => n.slug);
  const reachable = directedReachable(entrySlugs, moves);

  /* ── Build-time integrity. A map that sends people to a role page that does
        not exist, or draws a node with no position, is worse than no map. ── */
  const errors: string[] = [];
  const slugs = new Set(ROLES.map((r) => r.slug));

  for (const role of ROLES) {
    if (!positions.has(role.slug)) errors.push(`${role.slug} has no layout position`);
  }
  for (const m of moves) {
    if (!slugs.has(m.from)) errors.push(`move from unknown role: ${m.from}`);
    if (!slugs.has(m.to)) errors.push(`move to unknown role: ${m.to}`);
    if (m.from === m.to) errors.push(`${m.from} moves to itself`);
    if (!m.reason.trim()) errors.push(`move ${m.from} → ${m.to} has no reason`);
  }
  const moveKeys = new Set<string>();
  for (const m of moves) {
    const key = `${m.from}>${m.to}`;
    if (moveKeys.has(key)) errors.push(`duplicate move: ${key}`);
    moveKeys.add(key);
  }
  for (const p of ROLE_PAIRS) {
    if (!slugs.has(p.a.slug) || !slugs.has(p.b.slug)) errors.push(`comparison references unknown role: ${p.a.slug} / ${p.b.slug}`);
  }

  // The claim the map makes out loud, checked rather than asserted: every role
  // can be reached from a first job by following authored moves forwards.
  const unreachable = ROLES.filter((r) => !reachable.has(r.slug)).map((r) => r.slug);
  if (unreachable.length > 0) {
    errors.push(
      `not reachable from any first-job role by authored moves: ${unreachable.join(', ')} — ` +
        'either author a move into it, or stop claiming every role is reachable.',
    );
  }

  /* Every field must be reachable from every role.
     The map offers a field filter on an open role, and when nothing in that
     field is adjacent it falls back to drawing the shortest authored route
     there. That fallback is only honest if a route exists — otherwise the
     answer is "you cannot get there from here", which was true of Data for 19
     of 38 roles and was an authoring gap, not a fact about IT careers.
     Reachability is checked per field rather than per role because a single
     missing move can isolate an entire cluster without isolating any one
     node: every role had a route somewhere, just never into Data. */
  const outMoves = new Map<string, string[]>();
  for (const m of moves) {
    if (!outMoves.has(m.from)) outMoves.set(m.from, []);
    outMoves.get(m.from)!.push(m.to);
  }
  for (const domain of DOMAINS) {
    const members = new Set(ROLES.filter((r) => r.domains.includes(domain.id)).map((r) => r.slug));
    if (members.size === 0) continue;
    const stranded = ROLES.filter((r) => {
      const seen = directedReachable([r.slug], moves);
      return ![...seen].some((s) => members.has(s));
    }).map((r) => r.slug);
    if (stranded.length > 0) {
      errors.push(
        `no authored route into ${domain.name} from ${stranded.length} role(s): ${stranded.join(', ')} — ` +
          'author the moves people actually make into that field, rather than leaving the map unable to answer.',
      );
    }
  }

  if (errors.length > 0) {
    throw new Error(`Career map data is broken:\n  ${errors.join('\n  ')}`);
  }

  /* ── Payload ─────────────────────────────────────────────────── */
  const fields = [...DOMAINS]
    .sort((a, b) => a.order - b.order)
    .map((d) => ({ id: d.id, name: d.name, accent: ACCENT_VAR[d.accent] }));

  const roles = ROLES.map((role) => {
    const node = positions.get(role.slug)!;
    const salary = ROLE_SALARY[role.slug];
    return {
      slug: role.slug,
      name: role.name,
      purpose: role.purpose,
      label: role.shortLabel,
      domains: role.domains,
      fieldNames: role.domains.map((d) => DOMAIN_BY_ID[d].name),
      entry: role.entry,
      degree: node.degree,
      x: Math.round(node.x * 10) / 10,
      y: Math.round(node.y * 10) / 10,
      r: node.radius,
      reality: role.reality,
      technologies: role.technologies.map((t) => TECHNOLOGY_BY_SLUG[t]?.name ?? t),
      certs: role.certs.map((c) => ({
        title: c.title,
        stage: c.stage,
        reason: c.reason,
        href: c.slug && c.vendorSlug ? `/vendors/${c.vendorSlug}/${c.slug}/` : null,
      })),
      trials: trialsForRole(role.slug).map((t) => ({ slug: t.slug, name: t.name, time: t.time, cost: t.cost })),
      pathSlug: role.pathSlug ?? null,
      entryPay: salary?.entry ?? null,
    };
  });

  const technologies = TECHNOLOGIES.map((t) => ({
    slug: t.slug,
    name: t.name,
    aka: t.aka ?? [],
    blurb: t.blurb,
    roles: t.roles.filter((r) => slugs.has(r)),
  })).filter((t) => t.roles.length > 0);

  // Certification → roles, derived from the role records so the overlay cannot
  // claim a certification matters to a role the role page does not mention.
  const certIndex = new Map<string, { title: string; href: string | null; roles: Array<{ slug: string; stage: string }> }>();
  for (const role of ROLES) {
    for (const c of role.certs) {
      const key = c.slug && c.vendorSlug ? `${c.vendorSlug}/${c.slug}` : c.title;
      if (!certIndex.has(key)) {
        certIndex.set(key, {
          title: c.title,
          href: c.slug && c.vendorSlug ? `/vendors/${c.vendorSlug}/${c.slug}/` : null,
          roles: [],
        });
      }
      certIndex.get(key)!.roles.push({ slug: role.slug, stage: c.stage });
    }
  }
  const certifications = [...certIndex.entries()]
    .map(([key, v]) => ({ key, ...v }))
    .sort((a, b) => b.roles.length - a.roles.length || a.title.localeCompare(b.title));

  const comparisons = ROLE_PAIRS.map((p) => ({
    a: p.a.slug,
    b: p.b.slug,
    overlap: p.overlap,
    href: comparePath(p.a.slug, p.b.slug),
  }));

  return new Response(
    JSON.stringify({
      schemaVersion: 1,
      fields,
      roles,
      moves,
      technologies,
      certifications,
      comparisons,
      viewBox: layout.viewBox,
    }),
    {
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'public, max-age=3600',
      },
    },
  );
}
