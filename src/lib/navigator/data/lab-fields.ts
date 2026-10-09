import { ROLE_CORE_BY_SLUG, ROLE_CORES } from './roles/cores';
import { TRIAL_BY_SLUG } from './trials';

/**
 * The bridge between the conversational lab and the role graph.
 *
 * The lab's AI reader writes prose. Prose is the one thing a language model is
 * genuinely good at, so it keeps that job. What it must NOT do is invent the
 * facts around the prose — a role that does not exist, a certification path
 * nobody verified, a weekend project with no safety scope. Every other surface
 * on this site is built from checked data, and the lab was the one place where
 * a model's guess reached the user unmediated.
 *
 * So the model now picks a `field_key` from this closed list, and the page
 * resolves that key against the real graph: real role pages, a real trial with
 * a real safety scope. If the key does not resolve, the prose still renders and
 * nothing is linked — a missing link is a far smaller failure than a confident
 * wrong one.
 *
 * IMPORTANT: these keys are duplicated in the worker's system prompt, because
 * that is where the model reads them. `pages/navigator/lab-graph.json.ts`
 * asserts at build time that the two lists are identical, so they cannot drift.
 */

export type LabTrack =
  /** Real role pages exist for this field. */
  | 'covered'
  /** Adjacent role pages exist, but the field itself is not modelled. */
  | 'partial'
  /** Honestly outside what this site maps. Say so rather than deflecting. */
  | 'none';

export interface LabField {
  key: string;
  /** Canonical display name. The model's own wording is kept for the prose. */
  label: string;
  track: LabTrack;
  /** Ordered — most representative first. Resolved to real role pages. */
  roles: string[];
  /** The trial that best captures what this work feels like. */
  trial?: string;
  /**
   * Shown when `track` is not 'covered'. The site says this itself rather than
   * relying on the model to admit a gap it has every incentive to paper over.
   */
  gap?: string;
}

export const LAB_FIELDS: LabField[] = [
  {
    key: 'it-support',
    label: 'IT support & service desk',
    track: 'covered',
    roles: ['help-desk-technician', 'systems-administrator', 'noc-technician', 'field-engineer'],
    trial: 'fix-someones-problem',
  },
  {
    key: 'systems-infrastructure',
    label: 'Systems & infrastructure',
    track: 'covered',
    roles: ['systems-engineer', 'systems-administrator'],
    trial: 'make-the-computer-do-it',
  },
  {
    key: 'network-engineering',
    label: 'Network engineering',
    track: 'covered',
    roles: [
      'network-engineer',
      'network-administrator',
      'network-automation-engineer',
      'service-provider-network-engineer',
    ],
    trial: 'follow-a-packet',
  },
  {
    key: 'field-infrastructure',
    label: 'Telecom, cabling & field infrastructure',
    track: 'covered',
    roles: ['field-engineer', 'data-center-engineer', 'wireless-engineer'],
    trial: 'walk-the-physical-layer',
  },
  {
    key: 'cloud-engineering',
    label: 'Cloud engineering',
    track: 'covered',
    roles: ['cloud-engineer', 'cloud-architect', 'cloud-network-engineer'],
    trial: 'declare-preview-destroy',
  },
  {
    key: 'devops-platform-sre',
    label: 'DevOps, platform & SRE',
    track: 'covered',
    roles: ['devops-engineer', 'platform-engineer', 'site-reliability-engineer', 'devsecops-engineer'],
    trial: 'make-the-computer-do-it',
  },
  {
    key: 'software-engineering',
    label: 'Software engineering',
    track: 'covered',
    roles: ['software-developer', 'application-security-engineer'],
    trial: 'break-your-own-app',
  },
  {
    key: 'qa-testing',
    label: 'QA & testing',
    track: 'partial',
    roles: ['software-developer', 'application-security-engineer'],
    trial: 'break-your-own-app',
    gap: 'CertBlueprint does not map QA and testing as its own track yet. The roles below are the closest neighbours — the testing mindset shows up strongly in both.',
  },
  {
    key: 'data-analytics',
    label: 'Data & analytics',
    track: 'covered',
    roles: ['data-analyst', 'data-engineer'],
    trial: 'ask-data-a-question',
  },
  {
    key: 'database-administration',
    label: 'Database administration',
    track: 'covered',
    roles: ['database-administrator', 'data-engineer'],
    trial: 'ask-data-a-question',
  },
  {
    key: 'cybersecurity-soc',
    label: 'Security operations',
    track: 'covered',
    roles: ['soc-analyst', 'incident-responder', 'detection-engineer'],
    trial: 'read-your-own-logs',
  },
  {
    key: 'cybersecurity-dfir',
    label: 'Digital forensics & incident response',
    track: 'covered',
    roles: ['digital-forensics-analyst', 'incident-responder', 'threat-hunter'],
    trial: 'read-your-own-logs',
  },
  {
    key: 'cybersecurity-grc',
    label: 'Governance, risk & compliance',
    track: 'covered',
    roles: ['grc-analyst', 'security-architect'],
    trial: 'design-it-on-paper',
  },
  {
    key: 'cybersecurity-iam',
    label: 'Identity & access',
    track: 'covered',
    roles: ['identity-engineer', 'zero-trust-engineer'],
    trial: 'audit-your-own-access',
  },
  {
    key: 'cybersecurity-offensive',
    label: 'Offensive security',
    track: 'covered',
    roles: ['penetration-tester', 'vulnerability-analyst'],
    trial: 'find-what-is-exposed',
  },
  {
    key: 'network-security',
    label: 'Network & infrastructure security',
    track: 'covered',
    roles: ['network-security-engineer', 'security-engineer', 'cloud-security-engineer'],
    trial: 'follow-a-packet',
  },
  {
    key: 'ot-security',
    label: 'OT & industrial control security',
    track: 'covered',
    roles: ['ot-security-engineer'],
    trial: 'find-what-is-exposed',
  },
  {
    key: 'architecture',
    label: 'Architecture',
    track: 'covered',
    roles: ['security-architect', 'cloud-architect'],
    trial: 'design-it-on-paper',
  },
  {
    key: 'ai-ml',
    label: 'AI & machine learning engineering',
    track: 'none',
    roles: ['data-engineer', 'platform-engineer'],
    gap: 'CertBlueprint has no AI/ML track yet, and pretending otherwise would waste your time. The roles below are the two most common routes people actually take into it — the data pipelines and the platform underneath.',
  },
  {
    key: 'it-project-management',
    label: 'IT project management',
    track: 'none',
    roles: [],
    gap: 'This site maps hands-on technical roles, and project management is not one of them. It is a real and well-paid direction — just not one CertBlueprint can honestly guide you through. Look at PMI and the CAPM/PMP route directly.',
  },
  {
    key: 'business-analysis',
    label: 'Business analysis',
    track: 'none',
    roles: [],
    gap: 'CertBlueprint does not cover business analysis. It sits between the business and the technology rather than inside the technology, and mapping it properly would need a different site. IIBA is the place to start.',
  },
  {
    key: 'technical-writing',
    label: 'Technical writing',
    track: 'none',
    roles: [],
    gap: 'Technical writing is not mapped here. It is one of the genuinely underrated ways into technology for people who can already write — but this site would only be guessing at the path.',
  },
];

export const LAB_FIELD_BY_KEY: Record<string, LabField> = Object.fromEntries(
  LAB_FIELDS.map((f) => [f.key, f]),
);

/**
 * Fails the build rather than shipping a dead link out of the lab.
 *
 * The reachability check is the one that matters most: a role nobody can arrive
 * at from the lab is invisible to everyone who chose the conversation over the
 * questionnaire, and nothing else in the codebase would ever notice.
 */
export function assertLabFieldIntegrity(): void {
  const errors: string[] = [];
  const seen = new Set<string>();
  const reachable = new Set<string>();

  for (const field of LAB_FIELDS) {
    if (seen.has(field.key)) errors.push(`duplicate field key: ${field.key}`);
    seen.add(field.key);

    for (const slug of field.roles) {
      if (!ROLE_CORE_BY_SLUG[slug]) {
        errors.push(`${field.key} references unknown role: ${slug}`);
        continue;
      }
      reachable.add(slug);
    }

    if (field.trial && !TRIAL_BY_SLUG[field.trial]) {
      errors.push(`${field.key} references unknown trial: ${field.trial}`);
    }

    if (field.track === 'covered' && field.roles.length === 0) {
      errors.push(`${field.key} claims covered but names no roles`);
    }
    if (field.track !== 'covered' && !field.gap) {
      errors.push(`${field.key} is not fully covered and must explain the gap`);
    }
  }

  for (const role of ROLE_CORES) {
    if (!reachable.has(role.slug)) {
      errors.push(`${role.slug} is unreachable from the lab — no field key names it`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Navigator lab field map is broken:\n  ${errors.join('\n  ')}`);
  }
}
