/**
 * NetDrill: the free network simulator at netdrill.certblueprint.com, made by the
 * same team as this site. Pages link to one exact lab with `#open=<id>`.
 *
 * The data is a committed snapshot of NetDrill's catalog
 * (src/data/labs/netdrill-catalog.json), written in the netdrill repo by
 * `npm run catalog:snapshot -- <path>`. Refresh it after a NetDrill release.
 * Builds never fetch it, so a deploy here never depends on NetDrill's state.
 *
 * Which labs a page shows is chosen by hand below, by topic and stage rather
 * than by id, so the picks survive NetDrill adding labs. Every pick is resolved
 * when this module loads: a topic NetDrill renamed, or a stage it no longer
 * has, fails the build with the pick that broke instead of shipping a dead link.
 */
import snapshot from '../data/labs/netdrill-catalog.json';
import { ROLE_BY_SLUG } from './navigator/data/roles';
import { TECHNOLOGY_BY_SLUG } from './navigator/data/technologies';
import { TRIAL_BY_SLUG } from './navigator/data/trials';

export type Stage = 'read' | 'learn' | 'build' | 'fix' | 'expand';

export interface NetDrillItem {
  id: string;
  kind: 'lab' | 'lesson' | 'reps';
  title: string;
  summary?: string;
  stage?: Stage;
  capstone?: 'build' | 'operate';
  track: string;
  level?: string;
  topic?: string;
  difficulty?: string;
  minutes?: number;
  tab: 'path' | 'designs' | 'capstones' | 'reps';
  group: string;
}

interface Group {
  tab: NetDrillItem['tab'];
  label: string;
  track: string;
  phase?: string;
  ids: string[];
}

interface Objective {
  id: string;
  domain: number;
  summary: string;
  coverage: string;
  labs: string[];
  lessons: string[];
}

interface Exam {
  id: string;
  name: string;
  code: string;
  track: string;
  domains: Array<{ id: number; name: string; weight: number }>;
  objectives: Objective[];
}

interface Catalog {
  format: string;
  version: number;
  site: string;
  generated?: string;
  commit?: string;
  groups: Group[];
  items: NetDrillItem[];
  exams: Exam[];
}

const catalog = snapshot as Catalog;
if (catalog.format !== 'netdrill-catalog' || catalog.version !== 1) {
  throw new Error(
    `NetDrill snapshot: expected format "netdrill-catalog" version 1, found "${catalog.format}" version ${catalog.version}. ` +
      'A new version is a code change in src/lib/netdrill.ts, not a data refresh.',
  );
}

export const NETDRILL_URL = catalog.site;
export const NETDRILL_SNAPSHOT_DATE = catalog.generated;

const ITEMS = new Map(catalog.items.map((i) => [i.id, i]));
const GROUPS = new Map(catalog.groups.map((g) => [`${g.tab}:${g.label}`, g]));

/** The NetDrill URL that opens this item, the way NetDrill's own menu opens it. */
export function netdrillUrl(id: string): string {
  if (!ITEMS.has(id)) throw new Error(`NetDrill snapshot has no item "${id}"`);
  return `${NETDRILL_URL}#open=${id}`;
}

export function item(id: string): NetDrillItem {
  const found = ITEMS.get(id);
  if (!found) throw new Error(`NetDrill snapshot has no item "${id}"`);
  return found;
}

/** The label NetDrill's menu gives an item's kind: Learn, Build, Fault drill, Capstone, Reps… */
export function kindLabel(i: NetDrillItem): string {
  if (i.kind === 'reps') return 'Reps';
  if (i.capstone) return i.capstone === 'build' ? 'Capstone' : 'Operate';
  return { read: 'Read', learn: 'Learn', build: 'Build', fix: 'Fault drill', expand: 'Expand' }[i.stage ?? 'build'];
}

/** The title without the stage word its kind label already shows: "Build it: OSPF triangle" → "OSPF triangle". */
export function displayTitle(i: NetDrillItem): string {
  const title = i.kind === 'reps' ? i.title.replace(/ reps$/, '') : i.title.replace(/^(Capstone|Learn|Build it|Build|Expand|Fix|Know it|Read): /, '');
  // "read a port's story" → "Read a port's story", but "eBGP with a provider" keeps its case.
  return /^[a-z][a-z]/.test(title) ? title.charAt(0).toUpperCase() + title.slice(1) : title;
}

// ─── Picks ──────────────────────────────────────────────────────────────────

/**
 * One link, chosen by hand. `topic` is a NetDrill path topic (its menu label);
 * `stage` picks the lab in it: 'start' is the first hands-on lab (Learn, or
 * Build where a topic has no Learn), else that stage's first lab. `id` names a
 * capstone, design or reps directly.
 */
export type Pick = { topic: string; stage: Stage | 'start' } | { id: string };

function resolve(pick: Pick): NetDrillItem {
  if ('id' in pick) return item(pick.id);
  const group = GROUPS.get(`path:${pick.topic}`);
  if (!group) throw new Error(`NetDrill snapshot has no path topic "${pick.topic}"`);
  const entries = group.ids.map(item);
  const found =
    pick.stage === 'start'
      ? (entries.find((e) => e.stage === 'learn') ?? entries.find((e) => e.stage !== 'read') ?? entries[0])
      : entries.find((e) => e.stage === pick.stage);
  if (!found) throw new Error(`NetDrill topic "${pick.topic}" has no ${pick.stage} lab`);
  return found;
}

const t = (topic: string, stage: Stage | 'start' = 'start'): Pick => ({ topic, stage });
const id = (itemId: string): Pick => ({ id: itemId });

export interface Practice {
  /** One sentence on why these, for this reader. */
  intro: string;
  picks: Pick[];
}

/** Navigator roles whose daily work NetDrill can put in front of someone. */
const ROLE_PRACTICE: Record<string, Practice> = {
  'network-engineer': {
    intro: 'Routing and switching from the command line, then a whole multi-building network to build.',
    picks: [t('OSPF', 'build'), t('Spanning tree', 'fix'), t('BGP', 'build'), id('capstone-buildings'), id('rep:ospf')],
  },
  'network-administrator': {
    intro: 'The changes and fixes that fill an administrator’s week, on a network you can break without a ticket.',
    picks: [t('VLANs and inter-VLAN routing', 'build'), t('DHCP', 'fix'), t('ACLs', 'fix'), id('capstone-campus-edge'), id('rep:vlan')],
  },
  'noc-technician': {
    intro: 'A NOC is fault-finding under time pressure. These drop you into a broken network and grade the fix.',
    picks: [t('Foundations', 'fix'), t('Logging and troubleshooting tools', 'start'), t('OSPF', 'fix'), id('capstone-campus-edge-operate')],
  },
  'service-provider-network-engineer': {
    intro: 'The provider core: an IGP, labels, customer VPNs on top, and a backbone to run.',
    picks: [t('IS-IS', 'build'), t('MPLS and LDP', 'build'), t('MPLS Layer 3 VPNs', 'fix'), t('Segment routing: SR-MPLS', 'build'), id('capstone-sp-core')],
  },
  'network-security-engineer': {
    intro: 'The network side of security: filtering, a firewall edge, encrypted tunnels and switch-port protection.',
    picks: [t('ACLs', 'fix'), t('Firewall', 'build'), t('Layer 2 security', 'build'), t('Remote-access VPN', 'build'), id('capstone-dmz')],
  },
  'network-automation-engineer': {
    intro: 'Configuration from code instead of a keyboard, checked against the devices it changed.',
    picks: [t('Ansible', 'build'), t('NETCONF and RESTCONF', 'build'), t('Embedded Event Manager', 'build'), t('Model-driven telemetry', 'start')],
  },
  'cloud-network-engineer': {
    intro: 'What a cloud network still runs on: BGP, encrypted tunnels and segmentation.',
    picks: [t('BGP', 'build'), t('WAN tunnels and failover', 'build'), t('VRFs', 'build'), id('capstone-hybrid-cloud')],
  },
  'data-center-engineer': {
    intro: 'A leaf-spine fabric from the underlay up: VXLAN, BGP EVPN and a gateway on every leaf.',
    picks: [t('VXLAN', 'build'), t('BGP EVPN', 'build'), t('Anycast gateway', 'build'), t('EVPN troubleshooting', 'fix'), id('spine-leaf-build')],
  },
};

/** Career paths with real NetDrill overlap. */
const PATH_PRACTICE: Record<string, Practice> = {
  'network-administrator': ROLE_PRACTICE['network-administrator'],
  'help-desk-technician': {
    intro: 'The network half of help-desk tickets: a PC that can’t reach anything, and why.',
    picks: [t('Windows PCs', 'build'), t('Clients: Windows, macOS, Linux', 'fix'), t('DHCP', 'fix'), t('DNS', 'fix')],
  },
};

/** Weekend trials whose next step is a NetDrill lab: one link, after the reflection. */
const TRIAL_PRACTICE: Record<string, Pick> = {
  'follow-a-packet': id('f2-pc'),
  'design-it-on-paper': id('capstone-sdwan'),
  'walk-the-physical-layer': t('Interfaces and cables'),
  'make-the-computer-do-it': t('Ansible'),
};

/** Technologies on the map that NetDrill teaches with an IOS-style CLI. */
const TECH_PRACTICE: Record<string, Pick> = {
  'cisco-ios': id('f1-cli'),
  ospf: t('OSPF'),
  bgp: t('BGP'),
  mpls: t('MPLS and LDP'),
  vlans: t('VLANs and inter-VLAN routing'),
  'dns-dhcp': t('DHCP'),
  netflow: t('NetFlow'),
  ansible: t('Ansible'),
  'ipsec-tls-pki': t('WAN tunnels and failover', 'build'),
};

export interface ResolvedPractice {
  intro: string;
  items: NetDrillItem[];
}

const resolvePractice = (p: Practice): ResolvedPractice => ({ intro: p.intro, items: p.picks.map(resolve) });

// Resolve every pick now, so a broken one fails the build.
const ROLES = Object.fromEntries(Object.entries(ROLE_PRACTICE).map(([k, v]) => [k, resolvePractice(v)]));
const PATHS = Object.fromEntries(Object.entries(PATH_PRACTICE).map(([k, v]) => [k, resolvePractice(v)]));
const TRIALS = Object.fromEntries(Object.entries(TRIAL_PRACTICE).map(([k, v]) => [k, resolve(v)]));
const TECHS = Object.fromEntries(Object.entries(TECH_PRACTICE).map(([k, v]) => [k, resolve(v)]));

export const practiceForRole = (slug: string): ResolvedPractice | undefined => ROLES[slug];
export const practiceForPath = (slug: string): ResolvedPractice | undefined => PATHS[slug];
export const practiceForTrial = (slug: string): NetDrillItem | undefined => TRIALS[slug];
export const practiceForTech = (slug: string): NetDrillItem | undefined => TECHS[slug];

// And the other end: a pick for a role, trial or technology this site no longer has would never show.
for (const [kind, picked, known] of [
  ['role', ROLE_PRACTICE, ROLE_BY_SLUG],
  ['trial', TRIAL_PRACTICE, TRIAL_BY_SLUG],
  ['technology', TECH_PRACTICE, TECHNOLOGY_BY_SLUG],
] as const) {
  for (const slug of Object.keys(picked)) {
    if (!known[slug]) throw new Error(`NetDrill picks name a ${kind} this site doesn't have: "${slug}" (src/lib/netdrill.ts)`);
  }
}

/** Path slugs with picks: the paths collection is read asynchronously, so the paths page checks these. */
export const PICKED_PATHS = Object.keys(PATH_PRACTICE);

// ─── Exams ──────────────────────────────────────────────────────────────────

/** The guides whose exams NetDrill maps objective by objective. */
const CERT_EXAMS: Record<string, { exams: string[]; capstones: string[] }> = {
  ccna: { exams: ['ccna'], capstones: ['Tier 1 · Foundation (CCNA)'] },
  'ccnp-enterprise': { exams: ['encor', 'enarsi'], capstones: ['Tier 2 · Professional (CCNA to ENCOR)', 'Tier 3 · Advanced (ENCOR, ENARSI)'] },
  'ccnp-service-provider': { exams: ['spcor', 'spri'], capstones: ['Service provider (CCNP SP, SPRI)'] },
};

export interface DomainPractice {
  id: number;
  name: string;
  weight: number;
  objectives: number;
  /** Objectives NetDrill grades hands-on as the exam asks (its "verified"). */
  graded: number;
  /** Whether any NetDrill lab or lesson practices this domain, even if its topics are listed under another one. */
  practiced: boolean;
  /** Path topics whose labs mostly practice this domain, in NetDrill's menu order, each opening at its first hands-on lab. */
  topics: Array<{ label: string; entry: NetDrillItem }>;
}

export interface ExamPractice {
  id: string;
  name: string;
  code: string;
  objectives: number;
  graded: number;
  domains: DomainPractice[];
}

export interface CertPractice {
  exams: ExamPractice[];
  capstones: NetDrillItem[];
  reps: NetDrillItem[];
}

function examPractice(exam: Exam): ExamPractice {
  // A topic's labs can serve objectives in several domains (VLAN labs also practice addressing and routing), so
  // listing every topic under every domain it touches buries the point. Each topic is listed once, under the
  // domain most of its mapped labs and lessons practice (the earlier domain on a tie).
  const tally = new Map<string, Map<number, number>>();
  for (const o of exam.objectives) {
    for (const i of [...o.labs, ...o.lessons].map(item)) {
      if (i.tab !== 'path') continue;
      const byDomain = tally.get(i.group) ?? new Map<number, number>();
      byDomain.set(o.domain, (byDomain.get(o.domain) ?? 0) + 1);
      tally.set(i.group, byDomain);
    }
  }
  const home = new Map(
    [...tally].map(([label, byDomain]) => [label, [...byDomain].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0][0]]),
  );
  const topicOrder = catalog.groups.filter((g) => g.tab === 'path').map((g) => g.label);
  const domains = exam.domains.map((d) => {
    const objectives = exam.objectives.filter((o) => o.domain === d.id);
    const topics = topicOrder.filter((label) => home.get(label) === d.id).map((label) => ({ label, entry: resolve(t(label)) }));
    const practiced = objectives.some((o) => o.labs.length + o.lessons.length > 0);
    return { ...d, objectives: objectives.length, graded: objectives.filter((o) => o.coverage === 'verified').length, practiced, topics };
  });
  return {
    id: exam.id,
    name: exam.name,
    code: exam.code,
    objectives: exam.objectives.length,
    graded: exam.objectives.filter((o) => o.coverage === 'verified').length,
    domains,
  };
}

function certPractice(slug: string): CertPractice | undefined {
  const spec = CERT_EXAMS[slug];
  if (!spec) return undefined;
  const exams = spec.exams.map((examId) => {
    const exam = catalog.exams.find((e) => e.id === examId);
    if (!exam) throw new Error(`NetDrill snapshot has no exam "${examId}" (for /${slug}/)`);
    return examPractice(exam);
  });
  const capstones = spec.capstones.flatMap((label) => {
    const group = GROUPS.get(`capstones:${label}`);
    if (!group) throw new Error(`NetDrill snapshot has no capstone group "${label}" (for /${slug}/)`);
    return group.ids.map(item).filter((i) => i.capstone === 'build');
  });
  const track = catalog.exams.find((e) => e.id === spec.exams[0])!.track;
  const reps = catalog.items.filter((i) => i.kind === 'reps' && i.track === track);
  return { exams, capstones, reps };
}

const CERTS = Object.fromEntries(Object.keys(CERT_EXAMS).map((slug) => [slug, certPractice(slug)!]));

export const practiceForCert = (slug: string): CertPractice | undefined => CERTS[slug];
