import type { Dimension, DimensionGroup, DimensionId } from '../types';

/**
 * The dimension registry — 41 axes in 5 groups.
 *
 * Labels are written for the results page, so they must read as things a person
 * could recognise about themselves ("Tracing why something broke"), not as
 * taxonomy jargon ("troubleshooting affinity coefficient").
 */
export const DIMENSIONS: Dimension[] = [
  /* ── Domain affinity ───────────────────────────────────────────── */
  { id: 'dom.networking', group: 'domain', label: 'Networking', blurb: 'How information moves between machines, sites, and users.' },
  { id: 'dom.cybersecurity', group: 'domain', label: 'Security', blurb: 'Keeping systems, identities, and data out of the wrong hands.' },
  { id: 'dom.systems', group: 'domain', label: 'Systems & infrastructure', blurb: 'The servers, platforms, and services everything else runs on.' },
  { id: 'dom.cloud', group: 'domain', label: 'Cloud', blurb: 'Computing that lives in someone else’s data centre, built by API.' },
  { id: 'dom.software', group: 'domain', label: 'Software', blurb: 'Writing the applications and tools other people use.' },
  { id: 'dom.data', group: 'domain', label: 'Data', blurb: 'Storing, moving, and making sense of large amounts of information.' },
  { id: 'dom.automation', group: 'domain', label: 'Automation', blurb: 'Making a machine do the repetitive part so nobody has to.' },
  { id: 'dom.operations', group: 'domain', label: 'Operations', blurb: 'Keeping live systems healthy, and people unblocked, right now.' },

  /* ── Problem style ─────────────────────────────────────────────── */
  { id: 'sty.troubleshooting', group: 'style', label: 'Troubleshooting', blurb: 'Narrowing down a broken thing until the cause is cornered.' },
  { id: 'sty.investigation', group: 'style', label: 'Investigation', blurb: 'Reconstructing what happened from evidence left behind.' },
  { id: 'sty.architecture', group: 'style', label: 'Design & architecture', blurb: 'Deciding how a system should be shaped before it gets built.' },
  { id: 'sty.building', group: 'style', label: 'Building', blurb: 'Making something new exist that did not exist yesterday.' },
  { id: 'sty.monitoring', group: 'style', label: 'Monitoring', blurb: 'Watching for the thing that is about to go wrong.' },
  { id: 'sty.automating', group: 'style', label: 'Automating', blurb: 'Replacing manual work with something repeatable.' },
  { id: 'sty.analysis', group: 'style', label: 'Analysis', blurb: 'Finding the pattern in a pile of numbers or events.' },
  { id: 'sty.policy', group: 'style', label: 'Policy & rules', blurb: 'Deciding what is allowed, and making systems enforce it.' },
  { id: 'sty.support', group: 'style', label: 'Helping people', blurb: 'Working directly with the person who is stuck.' },

  /* ── Technical abstraction ─────────────────────────────────────── */
  { id: 'abs.physical', group: 'abstraction', label: 'Physical hardware', blurb: 'Cables, racks, radios, and the equipment you can touch.' },
  { id: 'abs.network', group: 'abstraction', label: 'Network layer', blurb: 'Routes, addresses, packets, and paths.' },
  { id: 'abs.os', group: 'abstraction', label: 'Operating systems', blurb: 'Windows and Linux, processes, filesystems, services.' },
  { id: 'abs.application', group: 'abstraction', label: 'Applications', blurb: 'The software layer users actually interact with.' },
  { id: 'abs.identity', group: 'abstraction', label: 'Identity', blurb: 'Who someone is, and what they are allowed to reach.' },
  { id: 'abs.cloud', group: 'abstraction', label: 'Cloud platforms', blurb: 'Infrastructure created and destroyed through an API.' },
  { id: 'abs.code', group: 'abstraction', label: 'Code', blurb: 'Reading and writing instructions a machine executes.' },
  { id: 'abs.data', group: 'abstraction', label: 'Data & storage', blurb: 'Databases, pipelines, and where information lives.' },

  /* ── Security affinity ─────────────────────────────────────────── */
  { id: 'sec.detection', group: 'security', label: 'Detection', blurb: 'Noticing the thing nobody else noticed.' },
  { id: 'sec.prevention', group: 'security', label: 'Prevention', blurb: 'Closing the door before anyone tries it.' },
  { id: 'sec.identity', group: 'security', label: 'Identity security', blurb: 'Accounts, permissions, and proving who someone is.' },
  { id: 'sec.network', group: 'security', label: 'Network security', blurb: 'Controlling what is allowed to talk to what.' },
  { id: 'sec.endpoint', group: 'security', label: 'Endpoint security', blurb: 'Laptops, servers, and phones — the machines themselves.' },
  { id: 'sec.offensive', group: 'security', label: 'Offensive security', blurb: 'Breaking in on purpose, with permission, to prove it is possible.' },
  { id: 'sec.response', group: 'security', label: 'Incident response', blurb: 'Taking control of a situation that is happening right now.' },
  { id: 'sec.architecture', group: 'security', label: 'Security architecture', blurb: 'Designing systems that are hard to attack in the first place.' },
  { id: 'sec.governance', group: 'security', label: 'Governance & risk', blurb: 'Deciding what risk is acceptable, and proving the rules are followed.' },

  /* ── Work style ────────────────────────────────────────────────── */
  { id: 'wrk.reactive', group: 'work', label: 'Reactive work', blurb: 'Something broke and you are on it now.' },
  { id: 'wrk.proactive', group: 'work', label: 'Proactive work', blurb: 'Fixing the class of problem, not the instance.' },
  { id: 'wrk.deep', group: 'work', label: 'Deep focus', blurb: 'Long uninterrupted stretches on one hard thing.' },
  { id: 'wrk.continuous', group: 'work', label: 'Continuous operations', blurb: 'A system that never sleeps, and neither does the rota.' },
  { id: 'wrk.project', group: 'work', label: 'Project delivery', blurb: 'A defined thing to implement, with an end date.' },
  { id: 'wrk.design', group: 'work', label: 'Design work', blurb: 'Thinking it through on paper before anything is built.' },
  { id: 'wrk.automation', group: 'work', label: 'Automation-first', blurb: 'Instinctively asking "why am I doing this by hand?"' },
];

export const DIMENSION_BY_ID: Record<DimensionId, Dimension> = Object.fromEntries(
  DIMENSIONS.map((d) => [d.id, d]),
) as Record<DimensionId, Dimension>;

export const DIMENSION_IDS: DimensionId[] = DIMENSIONS.map((d) => d.id);

export const GROUPS: DimensionGroup[] = ['domain', 'style', 'abstraction', 'security', 'work'];

export const GROUP_LABEL: Record<DimensionGroup, string> = {
  domain: 'Fields you lean toward',
  style: 'Problems you like solving',
  abstraction: 'Layer you want to work at',
  security: 'Security flavour',
  work: 'Rhythm of work',
};

export const DIMENSIONS_BY_GROUP: Record<DimensionGroup, Dimension[]> = GROUPS.reduce(
  (acc, g) => {
    acc[g] = DIMENSIONS.filter((d) => d.group === g);
    return acc;
  },
  {} as Record<DimensionGroup, Dimension[]>,
);

/**
 * Group weights used by the similarity function.
 *
 * Domain and style carry the most signal about what someone will enjoy day to
 * day. Security is deliberately lighter: it only has meaning for people who
 * showed security interest at all, and over-weighting it would drag everyone
 * toward security roles just because they answered one firewall question.
 */
export const GROUP_WEIGHT: Record<DimensionGroup, number> = {
  domain: 1.0,
  style: 0.9,
  abstraction: 0.7,
  security: 0.55,
  work: 0.45,
};
