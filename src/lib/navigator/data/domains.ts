import type { Domain, DomainId } from '../types';

/**
 * Seven domains on the map — deliberately not twenty.
 *
 * Subdomains carry the long tail (network automation, OT security, forensics …)
 * so the first screen stays legible while nothing real gets dropped. Roles are
 * listed under EVERY subdomain they genuinely belong to; the overlap is the
 * product, not an accident to be normalised away.
 */
export const DOMAINS: Domain[] = [
  {
    id: 'networking',
    name: 'Networking',
    purpose: 'Build and operate the infrastructure that moves information.',
    intro:
      'Everything else in IT sits on top of a network. This is the world of routes, addresses, paths and packets — deciding how traffic gets from one place to another, and finding out why it suddenly does not. It is one of the last fields where you can still see the whole system end to end.',
    order: 1,
    accent: 'blue',
    signature: ['dom.networking', 'abs.network', 'sty.troubleshooting'],
    subdomains: [
      {
        slug: 'enterprise-networking',
        name: 'Enterprise Networking',
        blurb: 'The switches, routers and Wi-Fi that a company runs on, across offices and campuses.',
        roles: ['network-engineer', 'network-administrator', 'wireless-engineer', 'network-security-engineer'],
      },
      {
        slug: 'service-provider',
        name: 'Service Provider & Transport',
        blurb: 'The carrier side — the backbones and circuits that connect everyone else’s networks together.',
        roles: ['service-provider-network-engineer', 'network-engineer'],
      },
      {
        slug: 'wireless',
        name: 'Wireless',
        blurb: 'Radio, coverage, interference and the physics of getting a signal where people are.',
        roles: ['wireless-engineer', 'network-engineer'],
      },
      {
        slug: 'data-center-networking',
        name: 'Data Center Networking',
        blurb: 'High-density fabrics where thousands of servers talk to each other at line rate.',
        roles: ['network-engineer', 'data-center-engineer', 'cloud-network-engineer'],
      },
      {
        slug: 'network-automation',
        name: 'Network Automation',
        blurb: 'Configuring a thousand devices with code instead of a thousand SSH sessions.',
        roles: ['network-automation-engineer', 'network-engineer', 'devops-engineer'],
      },
      {
        slug: 'cloud-networking',
        name: 'Cloud Networking',
        blurb: 'The same routing problems, expressed as API calls inside AWS or Azure.',
        roles: ['cloud-network-engineer', 'cloud-engineer', 'network-engineer'],
      },
      {
        slug: 'network-security',
        name: 'Network Security',
        blurb: 'Firewalls, segmentation and access control — the intersection with cybersecurity.',
        roles: ['network-security-engineer', 'security-engineer', 'zero-trust-engineer'],
      },
    ],
  },

  {
    id: 'cybersecurity',
    name: 'Cybersecurity',
    purpose: 'Protect systems, identities, networks, applications, and data.',
    intro:
      'Security is not one job — it is a dozen very different ones that happen to share a goal. Some of it is investigation, some is engineering, some is design, some is arguing about risk in a spreadsheet. Almost none of it is a first job, and anyone who tells you otherwise is selling something. The road in runs through networking, systems or support.',
    order: 2,
    accent: 'red',
    signature: ['dom.cybersecurity', 'sec.detection', 'sty.investigation'],
    subdomains: [
      {
        slug: 'security-operations',
        name: 'SOC & Blue Team',
        blurb: 'Watching for the alert that actually matters, and deciding what to do about it.',
        roles: ['soc-analyst', 'threat-hunter', 'incident-responder', 'detection-engineer'],
      },
      {
        slug: 'incident-response',
        name: 'Incident Response & Forensics',
        blurb: 'Taking control of a live compromise, then reconstructing exactly what happened.',
        roles: ['incident-responder', 'digital-forensics-analyst', 'threat-hunter'],
      },
      {
        slug: 'security-engineering',
        name: 'Security Engineering',
        blurb: 'Building and running the controls everyone else depends on.',
        roles: ['security-engineer', 'network-security-engineer', 'cloud-security-engineer', 'detection-engineer'],
      },
      {
        slug: 'offensive-security',
        name: 'Penetration Testing & Red Team',
        blurb: 'Breaking in with written permission, so the gaps get closed before someone else finds them.',
        roles: ['penetration-tester', 'application-security-engineer'],
      },
      {
        slug: 'identity-security',
        name: 'Identity & Access',
        blurb: 'Accounts, groups, permissions, MFA — the control plane attackers want most.',
        roles: ['identity-engineer', 'zero-trust-engineer', 'security-engineer'],
      },
      {
        slug: 'zero-trust',
        name: 'Zero Trust & Segmentation',
        blurb: 'Assuming the network is already hostile, and designing accordingly.',
        roles: ['zero-trust-engineer', 'network-security-engineer', 'security-architect'],
      },
      {
        slug: 'cloud-security',
        name: 'Cloud Security',
        blurb: 'Securing infrastructure that can be created and destroyed in seconds.',
        roles: ['cloud-security-engineer', 'security-engineer', 'devsecops-engineer'],
      },
      {
        slug: 'endpoint-security',
        name: 'Endpoint Security',
        blurb: 'Laptops and servers — hardening them, and knowing when one has gone bad.',
        roles: ['security-engineer', 'soc-analyst', 'systems-engineer'],
      },
      {
        slug: 'vulnerability-management',
        name: 'Vulnerability Management',
        blurb: 'Knowing what is broken across ten thousand machines, and what to fix first.',
        roles: ['security-engineer', 'vulnerability-analyst', 'systems-engineer'],
      },
      {
        slug: 'security-architecture',
        name: 'Security Architecture',
        blurb: 'Designing the whole shape of defence, and defending the design in a meeting.',
        roles: ['security-architect', 'zero-trust-engineer', 'cloud-security-engineer'],
      },
      {
        slug: 'grc',
        name: 'Governance, Risk & Compliance',
        blurb: 'Translating between what auditors require and what engineers build.',
        roles: ['grc-analyst', 'security-architect'],
      },
      {
        slug: 'ot-security',
        name: 'OT / ICS Security',
        blurb: 'Securing factories, utilities and physical processes where a reboot is not an option.',
        roles: ['ot-security-engineer', 'network-security-engineer'],
      },
    ],
  },

  {
    id: 'systems',
    name: 'Systems & Infrastructure',
    purpose: 'Operate the servers, platforms, and identities applications depend on.',
    intro:
      'When people say "the server is down", this is whose phone rings. Systems work is about the machines and services underneath everything — operating systems, directories, storage, virtualization — and about the unglamorous discipline of keeping them boring. It is also the most common launch pad into cloud and security.',
    order: 3,
    accent: 'violet',
    signature: ['dom.systems', 'abs.os', 'wrk.continuous'],
    subdomains: [
      {
        slug: 'windows-administration',
        name: 'Windows Administration',
        blurb: 'Windows Server, Group Policy, patching, and the fleet of machines staff actually use.',
        roles: ['systems-engineer', 'systems-administrator', 'identity-engineer'],
      },
      {
        slug: 'linux-administration',
        name: 'Linux Administration',
        blurb: 'The operating system most of the internet runs on, driven from a command line.',
        roles: ['systems-engineer', 'systems-administrator', 'platform-engineer', 'devops-engineer'],
      },
      {
        slug: 'virtualization',
        name: 'Virtualization',
        blurb: 'Running many machines on one, and moving them around without anyone noticing.',
        roles: ['systems-engineer', 'data-center-engineer', 'cloud-engineer'],
      },
      {
        slug: 'storage',
        name: 'Storage',
        blurb: 'Where the data physically lives, how fast it is reachable, and how it comes back.',
        roles: ['systems-engineer', 'data-center-engineer'],
      },
      {
        slug: 'directory-identity',
        name: 'Active Directory & Identity',
        blurb: 'The system that decides who every user is and what they can open.',
        roles: ['identity-engineer', 'systems-engineer', 'security-engineer'],
      },
      {
        slug: 'platform-engineering',
        name: 'Platform Engineering',
        blurb: 'Building the internal platform other engineers deploy onto.',
        roles: ['platform-engineer', 'devops-engineer', 'cloud-engineer'],
      },
    ],
  },

  {
    id: 'cloud',
    name: 'Cloud',
    purpose: 'Build and operate computing environments across modern cloud platforms.',
    intro:
      'Cloud is the same infrastructure problems — compute, network, identity, storage — expressed entirely through APIs and code. That changes the job more than it sounds: you stop configuring boxes and start describing systems. Honest note: cloud is usually a second job, reached from support, systems or networking.',
    order: 4,
    accent: 'cyan',
    signature: ['dom.cloud', 'abs.cloud', 'wrk.automation'],
    subdomains: [
      {
        slug: 'cloud-administration',
        name: 'Cloud Administration',
        blurb: 'Running what already exists in AWS or Azure — accounts, cost, access, uptime.',
        roles: ['cloud-engineer', 'systems-engineer'],
      },
      {
        slug: 'cloud-engineering',
        name: 'Cloud Engineering',
        blurb: 'Building the environment itself, in code, so it can be rebuilt tomorrow.',
        roles: ['cloud-engineer', 'devops-engineer', 'platform-engineer'],
      },
      {
        slug: 'cloud-architecture',
        name: 'Cloud Architecture',
        blurb: 'Choosing the shape of a system, and living with the trade-offs you picked.',
        roles: ['cloud-architect', 'security-architect', 'cloud-engineer'],
      },
      {
        slug: 'cloud-networking-domain',
        name: 'Cloud Networking',
        blurb: 'VPCs, peering, transit and hybrid links between cloud and the office.',
        roles: ['cloud-network-engineer', 'network-engineer', 'cloud-engineer'],
      },
      {
        slug: 'cloud-security-domain',
        name: 'Cloud Security',
        blurb: 'Identity-first security in an environment with no perimeter to defend.',
        roles: ['cloud-security-engineer', 'security-engineer', 'devsecops-engineer'],
      },
      {
        slug: 'devops',
        name: 'DevOps & SRE',
        blurb: 'The pipeline from a developer’s laptop to production, and the reliability of what lands.',
        roles: ['devops-engineer', 'platform-engineer', 'site-reliability-engineer'],
      },
    ],
  },

  {
    id: 'software',
    name: 'Software & Automation',
    purpose: 'Build applications, and automate the infrastructure everything runs on.',
    intro:
      'Not all code is a software career. Some of the highest-leverage code in IT is written by people who do not call themselves developers — the script that configures 400 switches, the pipeline that rebuilds an environment, the tool that pulls evidence out of ten systems at once. This domain covers both ends of that.',
    order: 5,
    accent: 'amber',
    signature: ['dom.software', 'abs.code', 'sty.building'],
    subdomains: [
      {
        slug: 'software-development',
        name: 'Software Development',
        blurb: 'Designing and writing the applications people use every day.',
        roles: ['software-developer', 'application-security-engineer'],
      },
      {
        slug: 'scripting',
        name: 'Scripting',
        blurb: 'Short, sharp code that removes a chore — usually PowerShell, Bash or Python.',
        roles: ['systems-engineer', 'network-automation-engineer', 'devops-engineer'],
      },
      {
        slug: 'network-automation-domain',
        name: 'Network Automation',
        blurb: 'Treating network configuration as code, tested and version controlled.',
        roles: ['network-automation-engineer', 'network-engineer', 'devops-engineer'],
      },
      {
        slug: 'infrastructure-as-code',
        name: 'Infrastructure as Code',
        blurb: 'Whole environments defined in text files, reviewable like any other change.',
        roles: ['devops-engineer', 'cloud-engineer', 'platform-engineer'],
      },
      {
        slug: 'devsecops',
        name: 'DevSecOps',
        blurb: 'Putting the security checks inside the pipeline instead of after it.',
        roles: ['devsecops-engineer', 'application-security-engineer', 'cloud-security-engineer'],
      },
    ],
  },

  {
    id: 'data',
    name: 'Data',
    purpose: 'Move, store, and make sense of information at scale.',
    intro:
      'Data work runs from answering a business question with a query, through building the pipelines that make the question answerable, to training models on the result. It overlaps with security more than people expect — a SIEM is a data platform, and detection engineering is data engineering with adversaries.',
    order: 6,
    accent: 'emerald',
    signature: ['dom.data', 'abs.data', 'sty.analysis'],
    subdomains: [
      {
        slug: 'databases',
        name: 'Databases',
        blurb: 'Keeping the system of record fast, correct, and recoverable.',
        roles: ['database-administrator', 'systems-engineer'],
      },
      {
        slug: 'data-engineering',
        name: 'Data Engineering',
        blurb: 'Building the pipelines that get data from where it is made to where it is used.',
        roles: ['data-engineer', 'devops-engineer'],
      },
      {
        slug: 'data-analytics',
        name: 'Data Analytics',
        blurb: 'Turning a messy extract into an answer somebody can act on.',
        roles: ['data-analyst', 'grc-analyst'],
      },
      {
        slug: 'ai-ml',
        name: 'AI / Machine Learning',
        blurb: 'Training and running models — and increasingly, running the infrastructure they need.',
        roles: ['data-engineer', 'platform-engineer'],
      },
    ],
  },

  {
    id: 'operations',
    name: 'Support & Operations',
    purpose: 'Keep people working and live systems healthy — the real front door to IT.',
    intro:
      'This is where most IT careers actually begin, and it is badly undersold. A year on a service desk or a NOC floor teaches you how systems fail, how organisations behave under pressure, and which part of the stack you find yourself reaching for. Almost every senior engineer in the other six domains started here.',
    order: 7,
    accent: 'slate',
    signature: ['dom.operations', 'sty.support', 'wrk.reactive'],
    subdomains: [
      {
        slug: 'help-desk',
        name: 'Help Desk & Desktop Support',
        blurb: 'The first person who hears about every problem, on every layer, every day.',
        roles: ['help-desk-technician', 'systems-administrator'],
      },
      {
        slug: 'noc',
        name: 'NOC — Network Operations',
        blurb: 'A 24/7 floor watching every circuit and device, triaging what breaks.',
        roles: ['noc-technician', 'network-administrator', 'network-engineer'],
      },
      {
        slug: 'soc-ops',
        name: 'SOC — Security Operations',
        blurb: 'The security equivalent of the NOC — alerts, triage, escalation.',
        roles: ['soc-analyst', 'incident-responder'],
      },
      {
        slug: 'technical-operations',
        name: 'Technical Operations',
        blurb: 'Change windows, runbooks, and the discipline of not breaking production.',
        roles: ['systems-administrator', 'network-administrator', 'site-reliability-engineer'],
      },
      {
        slug: 'field-engineering',
        name: 'Field Engineering',
        blurb: 'On-site work — hands on the actual hardware, in the actual building.',
        roles: ['field-engineer', 'wireless-engineer'],
      },
    ],
  },
];

export const DOMAIN_BY_ID: Record<DomainId, Domain> = Object.fromEntries(
  DOMAINS.map((d) => [d.id, d]),
) as Record<DomainId, Domain>;

export const DOMAIN_IDS: DomainId[] = DOMAINS.map((d) => d.id);

/** Accent → CSS custom property values, resolved in navigator.css. */
export const ACCENT_VAR: Record<Domain['accent'], string> = {
  blue: '--nav-blue',
  red: '--nav-red',
  violet: '--nav-violet',
  cyan: '--nav-cyan',
  amber: '--nav-amber',
  emerald: '--nav-emerald',
  slate: '--nav-slate',
};
