import { CAPABILITY_BY_SLUG } from './capabilities';

/* ═══════════════════════════════════════════════════════════════════
   MILITARY OCCUPATION → CAPABILITY

   Veterans are consistently underserved by career tools, in a specific way:
   the tools ask what you have done and then fail to understand the answer.
   "25B" means nothing to a recruiter's keyword filter and everything to the
   person who spent four years doing it.

   The mapping here is deliberately NOT a claim of equivalence, and never
   "you qualify for X". It says: this work builds these capabilities, and these
   are the civilian roles built from those capabilities. The same graph the
   technology inventory uses, entered through a different door.

   ── The honesty problem, and how it is handled ──────────────────────

   Occupation codes change. The Air Force consolidated its cyberspace support
   AFSCs in 2021; the Army has reorganised the 25-series more than once. A
   lookup table of codes is a rotting asset, and a career site quietly serving
   a stale one is worse than a site that never had it.

   So the code list is explicitly the SHORTCUT, not the source of truth:

   • Selecting an occupation pre-ticks capabilities. The user then edits them.
     What they actually did outranks what the table thinks their code means.
   • Anyone whose code is missing, renamed or reorganised uses the same
     capability picker directly and gets an identical-quality result.
   • Legacy codes are kept and labelled. A DD-214 carries the code from when
     you served, so the retired ones are exactly what people search for.
   • Every entry points at the service's own authoritative source.

   That structure means an out-of-date row costs a user one unticked checkbox,
   not a wrong answer.
   ═══════════════════════════════════════════════════════════════════ */

export const MILITARY_LAST_REVIEWED = 'Reviewed August 2026';

export type ServiceId = 'army' | 'navy' | 'air-force' | 'marines' | 'coast-guard' | 'space-force';

export interface Service {
  id: ServiceId;
  name: string;
  /** What the service calls its occupation codes. */
  codeName: string;
  /** The service's own credentialing site — the authority, not this page. */
  sourceName: string;
  sourceUrl: string;
}

/**
 * Service credentialing sites, taken from the DOW COOL portal's own service
 * list (cool.osd.mil) rather than guessed from the service name — the paths do
 * not match the obvious abbreviations: the Navy is /usn/, not /navy/, and the
 * Air Force left cool.osd.mil for AFVEC entirely. There is no Space Force COOL;
 * Air Force COOL covers enlisted Department of the Air Force members.
 *
 * cool.osd.mil returns 403 to anything that is not a browser, so these cannot
 * be checked from a script — see scripts/check-external-links.mjs.
 * Last verified in a browser: 2026-09-24.
 */
export const SERVICES: Service[] = [
  {
    id: 'army',
    name: 'Army',
    codeName: 'MOS',
    sourceName: 'Army COOL',
    sourceUrl: 'https://www.cool.osd.mil/army/index.html',
  },
  {
    id: 'navy',
    name: 'Navy',
    codeName: 'Rating',
    sourceName: 'Navy COOL',
    sourceUrl: 'https://www.cool.osd.mil/usn/index.html',
  },
  {
    id: 'air-force',
    name: 'Air Force',
    codeName: 'AFSC',
    sourceName: 'Air Force COOL',
    sourceUrl: 'https://afvec.us.af.mil/afvec/af-cool/welcome',
  },
  {
    id: 'marines',
    name: 'Marine Corps',
    codeName: 'MOS',
    sourceName: 'Marine Corps COOL',
    sourceUrl: 'https://www.cool.osd.mil/usmc/index.html',
  },
  {
    id: 'coast-guard',
    name: 'Coast Guard',
    codeName: 'Rating',
    sourceName: 'Coast Guard COOL',
    sourceUrl: 'https://www.cool.osd.mil/uscg/index.html',
  },
  {
    id: 'space-force',
    name: 'Space Force',
    codeName: 'AFSC',
    sourceName: 'Air Force COOL',
    sourceUrl: 'https://afvec.us.af.mil/afvec/af-cool/welcome',
  },
];

export const SERVICE_BY_ID: Record<string, Service> = Object.fromEntries(
  SERVICES.map((s) => [s.id, s]),
);

export interface MilitaryOccupation {
  code: string;
  title: string;
  service: ServiceId;
  /**
   * Capabilities this work genuinely builds — the starting selection, which the
   * person then corrects. Two people with the same code did different jobs.
   */
  capabilities: string[];
  /** What the civilian job market consistently fails to read out of this code. */
  undersold: string;
  /**
   * Set when the code has been retired or reorganised. Kept deliberately: a
   * DD-214 carries the code from the year it was issued.
   */
  legacy?: string;
}

export const OCCUPATIONS: MilitaryOccupation[] = [
  /* ── Army ───────────────────────────────────────────────────────── */
  {
    code: '25B',
    title: 'Information Technology Specialist',
    service: 'army',
    capabilities: [
      'os-administration',
      'user-support',
      'directory-services',
      'network-troubleshooting',
      'patch-management',
      'endpoint-management',
      'server-hardening',
    ],
    undersold:
      'Read as "help desk" and it is not. Running a network and its servers in the field means owning the whole stack with no vendor to escalate to, under configuration rules stricter than most companies enforce.',
  },
  {
    code: '25D',
    title: 'Cyber Network Defender',
    service: 'army',
    capabilities: [
      'log-analysis',
      'incident-triage',
      'siem-engineering',
      'threat-hunting',
      'continuous-monitoring',
      'vulnerability-scanning',
      'forensic-analysis',
    ],
    undersold:
      'This is defensive security operations by another name. The work maps almost directly onto a SOC analyst or incident responder seat — usually at a level of rigour civilian teams take years to reach.',
  },
  {
    code: '25H',
    title: 'Network Communications Systems Specialist',
    service: 'army',
    capabilities: [
      'routing',
      'switching',
      'wan-transport',
      'network-troubleshooting',
      'network-design',
      'vpn-tunneling',
      'physical-infrastructure',
    ],
    undersold:
      'Transport networks built and torn down repeatedly, under time pressure, with no second chance. That is routing and switching plus operational discipline most civilian network engineers never have to develop.',
  },
  {
    code: '25S',
    title: 'Satellite Communication Systems Operator-Maintainer',
    service: 'army',
    capabilities: [
      'wan-transport',
      'wireless-rf',
      'physical-infrastructure',
      'network-troubleshooting',
      'observability',
    ],
    undersold:
      'RF and link budgets are a genuinely rare civilian skill. It transfers to wireless engineering, service provider transport and data centre work far better than the job title suggests.',
  },
  {
    code: '25U',
    title: 'Signal Support Systems Specialist',
    service: 'army',
    capabilities: [
      'network-troubleshooting',
      'user-support',
      'physical-infrastructure',
      'wireless-rf',
      'endpoint-management',
    ],
    undersold:
      'Being the only technical person for a whole unit builds diagnostic range that specialists never develop. You learned to fix what was in front of you without knowing in advance what it would be.',
  },
  {
    code: '17C',
    title: 'Cyber Operations Specialist',
    service: 'army',
    capabilities: [
      'recon-enumeration',
      'exploitation',
      'vulnerability-scanning',
      'packet-analysis',
      'scripting-automation',
      'log-analysis',
      'threat-hunting',
    ],
    undersold:
      'Offensive experience with genuine authorisation behind it — the thing most civilian penetration testers spend years trying to demonstrate. The constraint is that much of the work is hard to describe on a CV.',
  },
  {
    code: '35T',
    title: 'Military Intelligence Systems Maintainer / Integrator',
    service: 'army',
    capabilities: [
      'os-administration',
      'network-troubleshooting',
      'server-hardening',
      'directory-services',
      'physical-infrastructure',
      'virtualization',
    ],
    undersold:
      'Systems integration across classified networks is systems engineering under the strictest change control there is. That habit is worth a great deal in regulated civilian industries.',
  },
  {
    code: '35N',
    title: 'Signals Intelligence Analyst',
    service: 'army',
    capabilities: ['log-analysis', 'query-analysis', 'threat-hunting', 'packet-analysis', 'continuous-monitoring'],
    undersold:
      'Finding the signal in overwhelming volume is exactly what detection engineering and threat hunting are. The analytical method transfers even where none of the tooling does.',
  },
  {
    code: '255A',
    title: 'Information Services Technician (Warrant Officer)',
    service: 'army',
    capabilities: [
      'network-design',
      'directory-services',
      'server-hardening',
      'virtualization',
      'risk-compliance',
      'os-administration',
      'observability',
    ],
    undersold:
      'A warrant officer technical track is closer to civilian architecture than to administration. The design authority and the accountability that came with it are the transferable part.',
  },

  /* ── Navy ───────────────────────────────────────────────────────── */
  {
    code: 'IT',
    title: 'Information Systems Technician',
    service: 'navy',
    capabilities: [
      'os-administration',
      'directory-services',
      'routing',
      'switching',
      'network-troubleshooting',
      'user-support',
      'server-hardening',
      'wan-transport',
    ],
    undersold:
      'Shipboard IT means being the entire IT department with no outside help for months. The breadth is unusual — most civilian roles specialise long before covering this much.',
  },
  {
    code: 'CTN',
    title: 'Cryptologic Technician (Networks)',
    service: 'navy',
    capabilities: [
      'packet-analysis',
      'log-analysis',
      'threat-hunting',
      'recon-enumeration',
      'detection-engineering',
      'incident-triage',
      'scripting-automation',
    ],
    undersold:
      'Among the most directly transferable technical roles in any service — network security operations under a different name, usually with a clearance already attached.',
  },
  {
    code: 'CTR',
    title: 'Cryptologic Technician (Collection)',
    service: 'navy',
    capabilities: ['log-analysis', 'query-analysis', 'continuous-monitoring', 'wireless-rf', 'threat-hunting'],
    undersold:
      'Signals collection and analysis is pattern work under volume. It maps to SOC and threat intelligence more cleanly than the title implies.',
  },
  {
    code: 'ET',
    title: 'Electronics Technician',
    service: 'navy',
    capabilities: [
      'physical-infrastructure',
      'wireless-rf',
      'network-troubleshooting',
      'wan-transport',
      'observability',
    ],
    undersold:
      'Fault isolation on complex systems with a schematic and a meter is the purest form of troubleshooting there is. Data centre, field engineering and transport roles want exactly this.',
  },
  {
    code: 'AT',
    title: 'Aviation Electronics Technician',
    service: 'navy',
    capabilities: ['physical-infrastructure', 'network-troubleshooting', 'wireless-rf', 'observability'],
    undersold:
      'Avionics work is diagnostics where being wrong is not survivable. That standard of methodical verification is rarer in civilian IT than it should be.',
  },

  /* ── Air Force ──────────────────────────────────────────────────── */
  {
    code: '1D7X1',
    title: 'Cyber Defense Operations',
    service: 'air-force',
    capabilities: [
      'log-analysis',
      'incident-triage',
      'siem-engineering',
      'continuous-monitoring',
      'vulnerability-scanning',
      'network-troubleshooting',
      'firewall-policy',
    ],
    undersold:
      'Defensive cyberspace operations is security operations with better funding and stricter process than most civilian SOCs run.',
  },
  {
    code: '1B4X1',
    title: 'Cyber Warfare Operations',
    service: 'air-force',
    capabilities: [
      'exploitation',
      'recon-enumeration',
      'scripting-automation',
      'packet-analysis',
      'threat-hunting',
      'vulnerability-scanning',
    ],
    undersold:
      'Operational offensive experience. The difficulty is not the skill — it is describing the work to an employer without disclosing what you cannot.',
  },
  {
    code: '1N4X1',
    title: 'Network Intelligence Analyst',
    service: 'air-force',
    capabilities: ['log-analysis', 'query-analysis', 'threat-hunting', 'packet-analysis', 'detection-engineering'],
    undersold:
      'Analysis of network activity at scale. Threat intelligence and detection engineering teams are built from exactly this skill set.',
  },
  {
    code: '3D0X2',
    title: 'Cyber Systems Operations',
    service: 'air-force',
    legacy:
      'Consolidated into the 1D7X1 series in the 2021 cyberspace career-field restructure. Kept here because it is the code printed on a DD-214 issued before then.',
    capabilities: [
      'os-administration',
      'directory-services',
      'virtualization',
      'server-hardening',
      'patch-management',
      'storage-management',
    ],
    undersold:
      'Server and directory administration at enterprise scale, under accreditation requirements most companies never face.',
  },
  {
    code: '3D1X1',
    title: 'Client Systems / Cyber Transport',
    service: 'air-force',
    legacy:
      'Realigned in the 2021 cyberspace restructure. Kept because pre-2021 separations carry this code.',
    capabilities: [
      'network-troubleshooting',
      'user-support',
      'endpoint-management',
      'physical-infrastructure',
      'switching',
    ],
    undersold:
      'Client systems and transport work covers the full path from a user’s device to the network. That end-to-end view is what makes a good network troubleshooter.',
  },

  /* ── Marine Corps ───────────────────────────────────────────────── */
  {
    code: '0651',
    title: 'Cyber Network Operator',
    service: 'marines',
    capabilities: [
      'routing',
      'switching',
      'network-troubleshooting',
      'firewall-policy',
      'vpn-tunneling',
      'network-segmentation',
      'wan-transport',
    ],
    undersold:
      'Network operations with the security controls built in rather than bolted on. That is the network security engineering skill set, learned in the right order.',
  },
  {
    code: '0671',
    title: 'Data Systems Administrator',
    service: 'marines',
    capabilities: [
      'os-administration',
      'directory-services',
      'server-hardening',
      'virtualization',
      'patch-management',
      'storage-management',
    ],
    undersold:
      'Systems administration in expeditionary conditions — build it, run it, break it down, do it again. The repetition builds a deployment discipline that maps straight onto infrastructure work.',
  },
  {
    code: '0621',
    title: 'Radio Operator',
    service: 'marines',
    capabilities: ['wireless-rf', 'physical-infrastructure', 'network-troubleshooting', 'wan-transport'],
    undersold:
      'RF fundamentals and link troubleshooting. Wireless engineering is a specialisation civilian networking struggles to hire for, and this is the foundation of it.',
  },

  /* ── Coast Guard ────────────────────────────────────────────────── */
  {
    code: 'IT',
    title: 'Information Systems Technician',
    service: 'coast-guard',
    capabilities: [
      'os-administration',
      'network-troubleshooting',
      'user-support',
      'directory-services',
      'wireless-rf',
      'physical-infrastructure',
    ],
    undersold:
      'Small-unit IT means no specialisation and no escalation path. You covered networking, systems and support at once, which is precisely what a first civilian infrastructure role asks for.',
  },
  {
    code: 'ET',
    title: 'Electronics Technician',
    service: 'coast-guard',
    capabilities: ['physical-infrastructure', 'wireless-rf', 'network-troubleshooting', 'observability'],
    undersold:
      'Communications and navigation electronics maintenance. Structured fault isolation is the transferable core, and it is worth more than the equipment knowledge.',
  },

  /* ── Space Force ────────────────────────────────────────────────── */
  {
    code: '5C0X1',
    title: 'Cyber Operations',
    service: 'space-force',
    capabilities: [
      'log-analysis',
      'incident-triage',
      'continuous-monitoring',
      'network-troubleshooting',
      'scripting-automation',
      'siem-engineering',
    ],
    undersold:
      'Space Force specialty codes are still settling, and civilian recruiters have almost no reference for them — which makes translating the work into plain capability language unusually important here.',
  },
];

export function occupationsForService(service: ServiceId): MilitaryOccupation[] {
  return OCCUPATIONS.filter((o) => o.service === service);
}

/** Unique key — codes repeat across services (Navy IT and Coast Guard IT). */
export function occupationKey(o: MilitaryOccupation): string {
  return `${o.service}:${o.code}`;
}

/**
 * Fails the build rather than shipping a mapping that points nowhere.
 *
 * The capability check is the one that matters: a typo'd slug is silently
 * dropped by the scoring engine, so the page would still render, still look
 * complete, and quietly under-credit whoever selected that occupation — which
 * is the exact failure this feature exists to correct.
 */
export function assertMilitaryIntegrity(): void {
  const errors: string[] = [];
  const seen = new Set<string>();
  const serviceIds = new Set(SERVICES.map((s) => s.id));

  for (const o of OCCUPATIONS) {
    const key = occupationKey(o);
    if (seen.has(key)) errors.push(`duplicate occupation: ${key}`);
    seen.add(key);

    if (!serviceIds.has(o.service)) errors.push(`${key} names an unknown service`);
    if (o.capabilities.length === 0) errors.push(`${key} maps to no capabilities`);

    const dupes = o.capabilities.filter((c, i) => o.capabilities.indexOf(c) !== i);
    if (dupes.length > 0) errors.push(`${key} repeats capability ${dupes[0]}`);

    for (const cap of o.capabilities) {
      if (!CAPABILITY_BY_SLUG[cap]) {
        errors.push(`${key} references unknown capability "${cap}" — it would be silently ignored`);
      }
    }
  }

  for (const service of SERVICES) {
    if (!OCCUPATIONS.some((o) => o.service === service.id)) {
      errors.push(`${service.id} is offered as a choice but has no occupations behind it`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Navigator military mapping is broken:\n  ${errors.join('\n  ')}`);
  }
}
