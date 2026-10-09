import type { DomainId, Role } from '../types';
import { ROLES, ROLE_BY_SLUG } from './roles';

/* ═══════════════════════════════════════════════════════════════════
   THE CAREER GRAPH

   "IT careers are a graph, not a ladder" is the claim every role page makes.
   This is that claim drawn out — nodes are roles, edges are the moves people
   actually make, taken from the same authored adjacency the role pages list.

   Edges are undirected here even though adjacency is authored one way at a
   time. A move from support to networking is the same edge as networking to
   support; drawing it twice would double every line and imply a distinction
   the data does not make.
   ═══════════════════════════════════════════════════════════════════ */

export interface GraphNode {
  slug: string;
  name: string;
  /** The field it is drawn in. Multi-domain roles keep the full list. */
  domains: DomainId[];
  entry: Role['entry'];
  /** How many moves connect here — hubs are the roles worth knowing about. */
  degree: number;
}

export interface GraphEdge {
  a: string;
  b: string;
  /** True when both roles name each other. Drawn slightly stronger. */
  mutual: boolean;
}

function build(): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const seen = new Map<string, GraphEdge>();

  for (const role of ROLES) {
    for (const adj of role.adjacent) {
      if (!ROLE_BY_SLUG[adj.slug]) continue;
      const [a, b] = role.slug < adj.slug ? [role.slug, adj.slug] : [adj.slug, role.slug];
      const key = `${a}--${b}`;
      const existing = seen.get(key);
      if (existing) {
        existing.mutual = true;
        continue;
      }
      seen.set(key, { a, b, mutual: false });
    }
  }

  const edges = [...seen.values()];
  const degree = new Map<string, number>();
  for (const e of edges) {
    degree.set(e.a, (degree.get(e.a) ?? 0) + 1);
    degree.set(e.b, (degree.get(e.b) ?? 0) + 1);
  }

  const nodes: GraphNode[] = ROLES.map((role) => ({
    slug: role.slug,
    name: role.name,
    domains: role.domains,
    entry: role.entry,
    degree: degree.get(role.slug) ?? 0,
  }));

  return { nodes, edges };
}

const graph = build();
export const GRAPH_NODES = graph.nodes;
export const GRAPH_EDGES = graph.edges;

/** Everything reachable from `start` by following moves. */
function reachableFrom(start: string): Set<string> {
  const adjacency = new Map<string, string[]>();
  for (const e of GRAPH_EDGES) {
    if (!adjacency.has(e.a)) adjacency.set(e.a, []);
    if (!adjacency.has(e.b)) adjacency.set(e.b, []);
    adjacency.get(e.a)!.push(e.b);
    adjacency.get(e.b)!.push(e.a);
  }

  const seen = new Set<string>([start]);
  const queue = [start];
  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const next of adjacency.get(current) ?? []) {
      if (seen.has(next)) continue;
      seen.add(next);
      queue.push(next);
    }
  }
  return seen;
}

/** Roles you can reach from any first job, by any number of moves. */
export function reachableFromEntryRoles(): Set<string> {
  const reachable = new Set<string>();
  for (const node of GRAPH_NODES) {
    if (node.entry !== 'first-job') continue;
    for (const slug of reachableFrom(node.slug)) reachable.add(slug);
  }
  return reachable;
}

/**
 * Fails the build if the drawing would contradict the claim it exists to make.
 *
 * The connectivity check is the one that earns its place: a role in its own
 * disconnected island is a job this site tells people about and then shows no
 * way into. That is invisible in an adjacency list — each role page still looks
 * complete — and obvious the moment the graph is drawn.
 */
export function assertGraphIntegrity(): void {
  const errors: string[] = [];
  const slugs = new Set(GRAPH_NODES.map((n) => n.slug));

  for (const e of GRAPH_EDGES) {
    if (!slugs.has(e.a)) errors.push(`edge references unknown role: ${e.a}`);
    if (!slugs.has(e.b)) errors.push(`edge references unknown role: ${e.b}`);
    if (e.a === e.b) errors.push(`${e.a} links to itself`);
  }

  for (const node of GRAPH_NODES) {
    if (node.degree === 0) errors.push(`${node.slug} has no moves in or out — it is an island`);
  }

  // One connected component: every role must be reachable from every other.
  if (GRAPH_NODES.length > 0 && errors.length === 0) {
    const reached = reachableFrom(GRAPH_NODES[0].slug);
    const stranded = GRAPH_NODES.filter((n) => !reached.has(n.slug)).map((n) => n.slug);
    if (stranded.length > 0) {
      errors.push(
        `the career graph is not connected — unreachable from ${GRAPH_NODES[0].slug}: ${stranded.join(', ')}`,
      );
    }
  }

  // The site tells beginners IT is enterable. If a role cannot be reached from
  // any first job by any route, that is not true of it.
  if (errors.length === 0) {
    const reachable = reachableFromEntryRoles();
    const unreachable = GRAPH_NODES.filter((n) => !reachable.has(n.slug)).map((n) => n.slug);
    if (unreachable.length > 0) {
      errors.push(`no route from any first job to: ${unreachable.join(', ')}`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Navigator career graph is broken:\n  ${errors.join('\n  ')}`);
  }
}
