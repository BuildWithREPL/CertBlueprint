import type { DomainId, Role, RoleContent } from '../../types';
import { ROLE_CORES, ROLE_CORE_BY_SLUG } from './cores';
import { NETWORKING_ROLES } from './networking';
import { SECURITY_ROLES } from './security';
import { SYSTEMS_CLOUD_ROLES } from './systems-cloud';
import { SOFTWARE_DATA_OPS_ROLES } from './software-data-ops';

/**
 * The merged role set — identity and vector from `cores.ts`, prose from the
 * per-domain content files.
 *
 * IMPORTANT: importing from this module pulls in every role's full page content.
 * That is correct for pages, which render it, and wrong for anything that runs
 * in the browser. The scoring engine imports `./cores` directly and must keep
 * doing so; role data was 51% of the client bundle before the two were split.
 */
export const ROLE_CONTENT: RoleContent[] = [
  ...NETWORKING_ROLES,
  ...SECURITY_ROLES,
  ...SYSTEMS_CLOUD_ROLES,
  ...SOFTWARE_DATA_OPS_ROLES,
];

const CONTENT_BY_SLUG: Record<string, RoleContent> = Object.fromEntries(
  ROLE_CONTENT.map((c) => [c.slug, c]),
);

export const ROLES: Role[] = ROLE_CORES.map((core) => {
  const content = CONTENT_BY_SLUG[core.slug];
  if (!content) {
    throw new Error(
      `Navigator: role "${core.slug}" has a core but no content. ` +
        `Add it to the matching file in data/roles/, or remove it from cores.ts.`,
    );
  }
  return { ...core, ...content };
});

export const ROLE_BY_SLUG: Record<string, Role> = Object.fromEntries(ROLES.map((r) => [r.slug, r]));

export const ROLE_SLUGS: string[] = ROLES.map((r) => r.slug);

/** Roles listed under a domain, primary-domain roles first. */
export function rolesForDomain(domain: DomainId): Role[] {
  return ROLES.filter((r) => r.domains.includes(domain)).sort((a, b) => {
    const aPrimary = a.domains[0] === domain ? 0 : 1;
    const bPrimary = b.domains[0] === domain ? 0 : 1;
    if (aPrimary !== bPrimary) return aPrimary - bPrimary;
    return a.name.localeCompare(b.name);
  });
}

/** Roles that genuinely span two or more domains — the intersection shelf. */
export const INTERSECTION_ROLES: Role[] = ROLES.filter((r) => r.domains.length > 1);

/**
 * Build-time guard. Called from the Navigator hub page so a broken graph fails
 * the build instead of rendering a dead link in production.
 *
 * Also checks that the core/content split has not drifted in either direction —
 * that is the one new failure mode the split introduced, so it is the one thing
 * worth asserting about it.
 */
export function assertRoleGraphIntegrity(): void {
  const problems: string[] = [];

  for (const content of ROLE_CONTENT) {
    if (!ROLE_CORE_BY_SLUG[content.slug]) {
      problems.push(`content "${content.slug}" has no entry in cores.ts`);
    }
  }

  for (const role of ROLES) {
    for (const slug of role.related) {
      if (!ROLE_BY_SLUG[slug]) problems.push(`${role.slug}.related → unknown role "${slug}"`);
    }
    for (const adj of role.adjacent) {
      if (!ROLE_BY_SLUG[adj.slug]) problems.push(`${role.slug}.adjacent → unknown role "${adj.slug}"`);
    }
    if (Object.keys(role.vector).length === 0) {
      problems.push(`${role.slug} has an empty vector — it can never match anyone`);
    }
  }

  if (problems.length) {
    throw new Error(`Navigator role graph is broken:\n  ${problems.join('\n  ')}`);
  }
}
