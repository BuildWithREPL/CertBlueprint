import type { Capability } from '../types';

/**
 * Capabilities are the middle layer of the graph:
 *
 *   TECHNOLOGY → CAPABILITY → DOMAIN → ROLE → CERTIFICATION
 *
 * A technology is a product that comes and goes. A capability is what you can
 * actually do, and it survives the product. That is why the inventory scores
 * through capabilities rather than mapping FortiGate straight to a job title:
 * someone who ran FortiGate for six years has network-security capability, and
 * that transfers to Palo Alto, to a cloud firewall, and to a design conversation.
 */
export const CAPABILITIES: Capability[] = [
  /* ── Networking ─────────────────────────────────────────────────── */
  {
    slug: 'routing',
    name: 'Routing',
    blurb: 'Deciding the path traffic takes between networks, and why it changed.',
    domains: ['networking'],
    roles: ['network-engineer', 'service-provider-network-engineer', 'cloud-network-engineer'],
    vector: { 'dom.networking': 3, 'abs.network': 3, 'sty.troubleshooting': 1, 'sty.architecture': 1 },
  },
  {
    slug: 'switching',
    name: 'Switching & VLANs',
    blurb: 'Carving a physical network into separate logical ones, and moving frames between them.',
    domains: ['networking'],
    roles: ['network-engineer', 'network-administrator', 'data-center-engineer'],
    vector: { 'dom.networking': 3, 'abs.network': 3, 'sec.network': 1 },
  },
  {
    slug: 'wan-transport',
    name: 'WAN & Transport',
    blurb: 'Carrying traffic between sites and across carrier networks.',
    domains: ['networking'],
    roles: ['service-provider-network-engineer', 'network-engineer'],
    vector: { 'dom.networking': 3, 'abs.network': 3, 'sty.architecture': 2, 'wrk.continuous': 1 },
  },
  {
    slug: 'network-troubleshooting',
    name: 'Network Troubleshooting',
    blurb: 'Working hop by hop until you find the exact point where traffic stops.',
    domains: ['networking', 'operations'],
    roles: ['network-engineer', 'noc-technician', 'network-administrator', 'wireless-engineer', 'data-center-engineer', 'help-desk-technician'],
    vector: { 'dom.networking': 2, 'sty.troubleshooting': 3, 'abs.network': 2, 'wrk.reactive': 2 },
  },
  {
    slug: 'packet-analysis',
    name: 'Packet Analysis',
    blurb: 'Reading the actual conversation between two machines, byte by byte.',
    domains: ['networking', 'cybersecurity'],
    roles: ['network-engineer', 'network-security-engineer', 'soc-analyst', 'incident-responder', 'wireless-engineer'],
    vector: { 'dom.networking': 2, 'sty.investigation': 3, 'abs.network': 3, 'sec.detection': 2, 'wrk.deep': 2 },
  },
  {
    slug: 'wireless-rf',
    name: 'Wireless & RF',
    blurb: 'Coverage, interference, roaming — the physics of a signal in a real building.',
    domains: ['networking'],
    roles: ['wireless-engineer', 'network-engineer', 'field-engineer'],
    vector: { 'dom.networking': 2, 'abs.physical': 3, 'sty.troubleshooting': 2 },
  },
  {
    slug: 'network-design',
    name: 'Network Design',
    blurb: 'Choosing the shape of a network before the cables go in.',
    domains: ['networking'],
    roles: ['network-engineer', 'security-architect', 'cloud-architect', 'service-provider-network-engineer', 'cloud-network-engineer', 'wireless-engineer', 'data-center-engineer'],
    vector: { 'dom.networking': 2, 'sty.architecture': 3, 'wrk.design': 3, 'abs.network': 2 },
  },

  /* ── Network security ───────────────────────────────────────────── */
  {
    slug: 'firewall-policy',
    name: 'Firewall Policy',
    blurb: 'Deciding what is allowed to reach what, and proving the rule does what you meant.',
    domains: ['cybersecurity', 'networking'],
    roles: ['network-security-engineer', 'security-engineer', 'network-engineer'],
    vector: { 'dom.cybersecurity': 3, 'dom.networking': 2, 'sec.network': 3, 'sec.prevention': 2, 'sty.policy': 2 },
  },
  {
    slug: 'deep-packet-inspection',
    name: 'Traffic Inspection',
    blurb: 'Looking inside the traffic itself, not just where it is going.',
    domains: ['cybersecurity', 'networking'],
    roles: ['network-security-engineer', 'security-engineer'],
    vector: { 'dom.cybersecurity': 3, 'sec.network': 3, 'sec.detection': 2, 'abs.network': 2 },
  },
  {
    slug: 'ids-ips',
    name: 'Intrusion Detection & Prevention',
    blurb: 'Recognising an attack in traffic and either flagging or stopping it.',
    domains: ['cybersecurity'],
    roles: ['network-security-engineer', 'soc-analyst', 'detection-engineer'],
    vector: { 'dom.cybersecurity': 3, 'sec.detection': 3, 'sec.network': 2, 'sty.monitoring': 2 },
  },
  {
    slug: 'vpn-tunneling',
    name: 'VPN & Encrypted Tunnels',
    blurb: 'Building a private path across a public network.',
    domains: ['cybersecurity', 'networking'],
    roles: ['network-security-engineer', 'network-engineer', 'cloud-network-engineer'],
    vector: { 'dom.cybersecurity': 2, 'dom.networking': 2, 'sec.network': 2, 'abs.network': 2 },
  },
  {
    slug: 'network-segmentation',
    name: 'Segmentation',
    blurb: 'Splitting a network so a problem in one part cannot spread to the rest.',
    domains: ['cybersecurity', 'networking'],
    roles: ['network-security-engineer', 'zero-trust-engineer', 'ot-security-engineer', 'security-architect', 'network-administrator'],
    vector: { 'dom.cybersecurity': 3, 'dom.networking': 2, 'sec.network': 3, 'sec.architecture': 2, 'sty.architecture': 2 },
  },
  {
    slug: 'nac',
    name: 'Network Access Control',
    blurb: 'Deciding whether a device is even allowed onto the network, before it gets an address.',
    domains: ['cybersecurity', 'networking'],
    roles: ['network-security-engineer', 'zero-trust-engineer', 'identity-engineer'],
    vector: { 'dom.cybersecurity': 3, 'sec.network': 3, 'sec.identity': 2, 'sec.prevention': 3, 'sty.policy': 2 },
  },
  {
    slug: 'device-profiling',
    name: 'Device Discovery & Profiling',
    blurb: 'Working out what every unknown thing on the network actually is.',
    domains: ['cybersecurity', 'networking'],
    roles: ['network-security-engineer', 'ot-security-engineer', 'soc-analyst', 'digital-forensics-analyst'],
    vector: { 'dom.cybersecurity': 2, 'sty.investigation': 2, 'sec.detection': 2, 'sec.endpoint': 2 },
  },
  {
    slug: 'posture-assessment',
    name: 'Endpoint Posture Assessment',
    blurb: 'Checking a machine is patched and healthy before trusting it.',
    domains: ['cybersecurity', 'systems'],
    roles: ['network-security-engineer', 'zero-trust-engineer', 'security-engineer'],
    vector: { 'dom.cybersecurity': 2, 'sec.endpoint': 3, 'sec.prevention': 2, 'sty.policy': 2 },
  },
  {
    slug: 'zero-trust-enforcement',
    name: 'Zero Trust Enforcement',
    blurb: 'Verifying every request instead of trusting anything for being "inside".',
    domains: ['cybersecurity'],
    roles: ['zero-trust-engineer', 'network-security-engineer', 'identity-engineer', 'security-architect'],
    vector: { 'dom.cybersecurity': 3, 'sec.architecture': 3, 'sec.identity': 2, 'sec.network': 2, 'sty.architecture': 2 },
  },
  {
    slug: 'policy-enforcement',
    name: 'Policy Enforcement',
    blurb: 'Turning a written rule into something a system actually applies, every time.',
    domains: ['cybersecurity'],
    roles: ['network-security-engineer', 'identity-engineer', 'grc-analyst'],
    vector: { 'dom.cybersecurity': 2, 'sty.policy': 3, 'sec.prevention': 2, 'wrk.proactive': 2 },
  },
  {
    slug: 'continuous-monitoring',
    name: 'Continuous Monitoring',
    blurb: 'Knowing the state of everything, all the time, not once a quarter.',
    domains: ['cybersecurity', 'operations'],
    roles: ['soc-analyst', 'network-security-engineer', 'site-reliability-engineer'],
    vector: { 'sty.monitoring': 3, 'wrk.continuous': 2, 'sec.detection': 2 },
  },

  /* ── Identity ───────────────────────────────────────────────────── */
  {
    slug: 'directory-services',
    name: 'Directory Services',
    blurb: 'The central record of every user, group and machine in an organisation.',
    domains: ['systems', 'cybersecurity'],
    roles: ['identity-engineer', 'systems-engineer', 'security-engineer'],
    vector: { 'dom.systems': 3, 'abs.identity': 3, 'sec.identity': 2 },
  },
  {
    slug: 'authentication',
    name: 'Authentication',
    blurb: 'Proving someone is who they claim to be — passwords, MFA, certificates, tokens.',
    domains: ['cybersecurity', 'systems', 'cloud'],
    roles: ['identity-engineer', 'zero-trust-engineer', 'cloud-security-engineer', 'wireless-engineer', 'systems-administrator', 'help-desk-technician'],
    vector: { 'dom.cybersecurity': 2, 'abs.identity': 3, 'sec.identity': 3, 'sec.prevention': 2 },
  },
  {
    slug: 'authorization',
    name: 'Authorization & Least Privilege',
    blurb: 'Deciding what a verified person is allowed to reach — and nothing more.',
    domains: ['cybersecurity', 'systems'],
    roles: ['identity-engineer', 'security-engineer', 'cloud-security-engineer'],
    vector: { 'dom.cybersecurity': 2, 'abs.identity': 3, 'sec.identity': 3, 'sty.policy': 2 },
  },
  {
    slug: 'identity-lifecycle',
    name: 'Identity Lifecycle',
    blurb: 'Accounts appearing on day one and genuinely disappearing on the last day.',
    domains: ['systems', 'cybersecurity'],
    roles: ['identity-engineer', 'grc-analyst', 'systems-engineer', 'systems-administrator'],
    vector: { 'abs.identity': 3, 'sec.identity': 2, 'sec.governance': 2, 'sty.policy': 2, 'wrk.proactive': 1 },
  },
  {
    slug: 'privileged-access',
    name: 'Privileged Access',
    blurb: 'Controlling the handful of accounts that can do anything at all.',
    domains: ['cybersecurity'],
    roles: ['identity-engineer', 'security-engineer', 'security-architect'],
    vector: { 'dom.cybersecurity': 3, 'sec.identity': 3, 'sec.prevention': 3, 'abs.identity': 2 },
  },

  /* ── Systems ────────────────────────────────────────────────────── */
  {
    slug: 'os-administration',
    name: 'Operating System Administration',
    blurb: 'Installing, configuring and keeping servers running day to day.',
    domains: ['systems'],
    roles: ['systems-engineer', 'systems-administrator', 'platform-engineer', 'identity-engineer'],
    vector: { 'dom.systems': 3, 'abs.os': 3, 'wrk.continuous': 2 },
  },
  {
    slug: 'server-hardening',
    name: 'Hardening',
    blurb: 'Removing everything a system does not need, so there is less to attack.',
    domains: ['systems', 'cybersecurity'],
    roles: ['systems-engineer', 'security-engineer', 'cloud-security-engineer'],
    vector: { 'dom.systems': 2, 'dom.cybersecurity': 2, 'sec.endpoint': 3, 'sec.prevention': 3, 'abs.os': 2 },
  },
  {
    slug: 'patch-management',
    name: 'Patch & Vulnerability Remediation',
    blurb: 'Getting fixes onto thousands of machines without breaking any of them.',
    domains: ['systems', 'cybersecurity'],
    roles: ['systems-engineer', 'vulnerability-analyst', 'security-engineer'],
    vector: { 'dom.systems': 2, 'sec.endpoint': 2, 'sec.prevention': 2, 'wrk.project': 2, 'sty.policy': 1 },
  },
  {
    slug: 'virtualization',
    name: 'Virtualization',
    blurb: 'Running many logical machines on shared physical hardware.',
    domains: ['systems', 'cloud'],
    roles: ['systems-engineer', 'data-center-engineer', 'cloud-engineer'],
    vector: { 'dom.systems': 3, 'abs.os': 2, 'sty.architecture': 1, 'dom.cloud': 1 },
  },
  {
    slug: 'storage-management',
    name: 'Storage',
    blurb: 'Capacity, performance and getting the data back when something dies.',
    domains: ['systems'],
    roles: ['systems-engineer', 'data-center-engineer', 'database-administrator', 'systems-administrator'],
    vector: { 'dom.systems': 3, 'abs.physical': 2, 'abs.data': 2, 'wrk.continuous': 2 },
  },
  {
    slug: 'endpoint-management',
    name: 'Endpoint Management',
    blurb: 'Configuring and controlling every laptop and phone in a fleet, centrally.',
    domains: ['systems', 'cybersecurity', 'operations'],
    roles: ['systems-engineer', 'systems-administrator', 'security-engineer', 'vulnerability-analyst'],
    vector: { 'dom.systems': 2, 'sec.endpoint': 2, 'sty.policy': 2, 'abs.os': 2 },
  },

  /* ── Cloud ──────────────────────────────────────────────────────── */
  {
    slug: 'cloud-compute',
    name: 'Cloud Compute',
    blurb: 'Creating and running servers, containers and functions that nobody owns physically.',
    domains: ['cloud'],
    roles: ['cloud-engineer', 'devops-engineer', 'platform-engineer', 'cloud-architect', 'data-engineer'],
    vector: { 'dom.cloud': 3, 'abs.cloud': 3, 'sty.building': 2 },
  },
  {
    slug: 'cloud-networking',
    name: 'Cloud Networking',
    blurb: 'VPCs, subnets, peering and hybrid connectivity, all defined by API.',
    domains: ['cloud', 'networking'],
    roles: ['cloud-network-engineer', 'cloud-engineer', 'network-engineer'],
    vector: { 'dom.cloud': 3, 'dom.networking': 3, 'abs.cloud': 2, 'abs.network': 3 },
  },
  {
    slug: 'cloud-iam',
    name: 'Cloud Identity & Permissions',
    blurb: 'The permission model that is the real perimeter of any cloud account.',
    domains: ['cloud', 'cybersecurity'],
    roles: ['cloud-security-engineer', 'cloud-engineer', 'identity-engineer', 'cloud-architect'],
    vector: { 'dom.cloud': 3, 'dom.cybersecurity': 2, 'sec.identity': 3, 'abs.identity': 2, 'abs.cloud': 2 },
  },
  {
    slug: 'iac',
    name: 'Infrastructure as Code',
    blurb: 'Describing an entire environment in files, so it can be rebuilt identically.',
    domains: ['cloud', 'software'],
    roles: ['devops-engineer', 'cloud-engineer', 'platform-engineer', 'network-automation-engineer', 'cloud-network-engineer', 'cloud-security-engineer', 'devsecops-engineer', 'cloud-architect'],
    vector: { 'dom.cloud': 2, 'dom.automation': 3, 'abs.code': 3, 'wrk.automation': 3, 'sty.building': 2 },
  },
  {
    slug: 'container-orchestration',
    name: 'Containers & Orchestration',
    blurb: 'Packaging applications so they run the same everywhere, and scheduling them at scale.',
    domains: ['cloud', 'software'],
    roles: ['devops-engineer', 'platform-engineer', 'site-reliability-engineer', 'devsecops-engineer'],
    vector: { 'dom.cloud': 3, 'dom.automation': 2, 'abs.cloud': 3, 'sty.building': 2 },
  },
  {
    slug: 'ci-cd',
    name: 'Build & Deployment Pipelines',
    blurb: 'The automated road from a code change to it running in production.',
    domains: ['software', 'cloud'],
    roles: ['devops-engineer', 'devsecops-engineer', 'platform-engineer', 'site-reliability-engineer'],
    vector: { 'dom.automation': 3, 'dom.software': 2, 'abs.code': 2, 'wrk.automation': 3 },
  },

  /* ── Automation & code ──────────────────────────────────────────── */
  {
    slug: 'scripting-automation',
    name: 'Scripting',
    blurb: 'Short code that removes a repetitive job permanently.',
    domains: ['software', 'systems'],
    roles: ['systems-engineer', 'network-automation-engineer', 'devops-engineer', 'soc-analyst', 'network-administrator', 'service-provider-network-engineer', 'application-security-engineer', 'identity-engineer', 'devsecops-engineer', 'systems-administrator', 'site-reliability-engineer', 'software-developer', 'data-engineer', 'data-analyst', 'help-desk-technician'],
    vector: { 'dom.automation': 3, 'abs.code': 2, 'wrk.automation': 3, 'sty.automating': 3 },
  },
  {
    slug: 'config-management',
    name: 'Configuration Management',
    blurb: 'Declaring how hundreds of machines should be, and enforcing it continuously.',
    domains: ['systems', 'cloud'],
    roles: ['devops-engineer', 'systems-engineer', 'network-automation-engineer'],
    vector: { 'dom.automation': 3, 'dom.systems': 2, 'wrk.automation': 3, 'sty.policy': 1 },
  },
  {
    slug: 'api-integration',
    name: 'API Integration',
    blurb: 'Making two systems that were never designed to talk, talk.',
    domains: ['software', 'cloud'],
    roles: ['network-automation-engineer', 'devops-engineer', 'software-developer', 'detection-engineer', 'data-engineer'],
    vector: { 'dom.software': 2, 'dom.automation': 2, 'abs.code': 3, 'sty.building': 2 },
  },
  {
    slug: 'software-engineering',
    name: 'Software Engineering',
    blurb: 'Designing, writing and maintaining applications people depend on.',
    domains: ['software'],
    roles: ['software-developer', 'application-security-engineer', 'data-engineer'],
    vector: { 'dom.software': 3, 'abs.code': 3, 'abs.application': 3, 'sty.building': 3, 'wrk.deep': 2 },
  },

  /* ── Detection & response ───────────────────────────────────────── */
  {
    slug: 'log-analysis',
    name: 'Log Analysis',
    blurb: 'Reading what systems recorded to work out what actually happened.',
    domains: ['cybersecurity', 'operations'],
    roles: ['soc-analyst', 'incident-responder', 'network-security-engineer', 'systems-engineer', 'digital-forensics-analyst', 'site-reliability-engineer', 'noc-technician'],
    vector: { 'dom.cybersecurity': 2, 'sty.investigation': 3, 'sty.analysis': 2, 'sec.detection': 3, 'wrk.deep': 2 },
  },
  {
    slug: 'siem-engineering',
    name: 'SIEM Engineering',
    blurb: 'Getting every system’s logs into one place, in a shape you can actually query.',
    domains: ['cybersecurity', 'data'],
    roles: ['detection-engineer', 'security-engineer', 'soc-analyst'],
    vector: { 'dom.cybersecurity': 3, 'dom.data': 2, 'sec.detection': 3, 'sty.building': 2, 'abs.data': 2 },
  },
  {
    slug: 'detection-engineering',
    name: 'Detection Engineering',
    blurb: 'Writing the rule that catches the attack next time, without crying wolf.',
    domains: ['cybersecurity'],
    roles: ['detection-engineer', 'threat-hunter', 'soc-analyst', 'cloud-security-engineer'],
    vector: { 'dom.cybersecurity': 3, 'sec.detection': 3, 'sty.building': 2, 'sty.analysis': 2, 'wrk.proactive': 3 },
  },
  {
    slug: 'threat-hunting',
    name: 'Threat Hunting',
    blurb: 'Going looking for the intruder nobody has alerted on yet.',
    domains: ['cybersecurity'],
    roles: ['threat-hunter', 'incident-responder', 'soc-analyst', 'digital-forensics-analyst'],
    vector: { 'dom.cybersecurity': 3, 'sec.detection': 3, 'sty.investigation': 3, 'wrk.proactive': 3, 'wrk.deep': 3 },
  },
  {
    slug: 'incident-triage',
    name: 'Incident Triage & Response',
    blurb: 'Deciding fast how bad this is, and taking the first containing action.',
    domains: ['cybersecurity', 'operations'],
    roles: ['incident-responder', 'soc-analyst', 'digital-forensics-analyst'],
    vector: { 'dom.cybersecurity': 3, 'sec.response': 3, 'wrk.reactive': 3, 'sty.investigation': 2 },
  },
  {
    slug: 'forensic-analysis',
    name: 'Forensic Analysis',
    blurb: 'Reconstructing events from disk, memory and traffic, defensibly.',
    domains: ['cybersecurity'],
    roles: ['digital-forensics-analyst', 'incident-responder'],
    vector: { 'dom.cybersecurity': 3, 'sec.response': 2, 'sty.investigation': 3, 'wrk.deep': 3, 'abs.os': 2 },
  },

  /* ── Offensive & assurance ──────────────────────────────────────── */
  {
    slug: 'vulnerability-scanning',
    name: 'Vulnerability Assessment',
    blurb: 'Finding known weaknesses across an estate and ranking what matters.',
    domains: ['cybersecurity'],
    roles: ['vulnerability-analyst', 'security-engineer', 'penetration-tester', 'application-security-engineer', 'cloud-security-engineer', 'devsecops-engineer'],
    vector: { 'dom.cybersecurity': 3, 'sec.prevention': 2, 'sty.analysis': 2, 'wrk.proactive': 2 },
  },
  {
    slug: 'recon-enumeration',
    name: 'Reconnaissance & Enumeration',
    blurb: 'Mapping what is exposed and reachable, before deciding what to try.',
    domains: ['cybersecurity', 'networking'],
    roles: ['penetration-tester', 'network-security-engineer', 'threat-hunter', 'application-security-engineer'],
    vector: { 'dom.cybersecurity': 2, 'sec.offensive': 3, 'sty.investigation': 2, 'abs.network': 2 },
  },
  {
    slug: 'exploitation',
    name: 'Exploitation',
    blurb: 'Proving a weakness is real by using it, under a signed scope.',
    domains: ['cybersecurity'],
    roles: ['penetration-tester', 'application-security-engineer'],
    vector: { 'dom.cybersecurity': 3, 'sec.offensive': 3, 'wrk.deep': 2, 'sty.investigation': 2 },
  },
  {
    slug: 'risk-compliance',
    name: 'Risk & Compliance',
    blurb: 'Deciding what risk is tolerable, and evidencing that controls work.',
    domains: ['cybersecurity'],
    roles: ['grc-analyst', 'security-architect', 'vulnerability-analyst'],
    vector: { 'dom.cybersecurity': 2, 'sec.governance': 3, 'sty.policy': 3, 'wrk.project': 2, 'sty.analysis': 1 },
  },

  /* ── Data ───────────────────────────────────────────────────────── */
  {
    slug: 'query-analysis',
    name: 'Querying & Analysis',
    blurb: 'Asking a dataset a precise question and trusting the answer.',
    domains: ['data', 'cybersecurity'],
    roles: ['data-analyst', 'soc-analyst', 'detection-engineer', 'software-developer'],
    vector: { 'dom.data': 3, 'abs.data': 3, 'sty.analysis': 3, 'wrk.deep': 1 },
  },
  {
    slug: 'data-pipelines',
    name: 'Data Pipelines',
    blurb: 'Moving data reliably from where it is produced to where it is used.',
    domains: ['data', 'software'],
    roles: ['data-engineer', 'devops-engineer'],
    vector: { 'dom.data': 3, 'dom.automation': 2, 'abs.data': 3, 'abs.code': 2, 'sty.building': 2 },
  },
  {
    slug: 'database-administration',
    name: 'Database Administration',
    blurb: 'Keeping the system of record correct, fast and recoverable.',
    domains: ['data', 'systems'],
    roles: ['database-administrator', 'systems-engineer'],
    vector: { 'dom.data': 3, 'dom.systems': 2, 'abs.data': 3, 'wrk.continuous': 2 },
  },

  /* ── Operations & people ────────────────────────────────────────── */
  {
    slug: 'user-support',
    name: 'User Support',
    blurb: 'Working directly with the person who is stuck, until they are not.',
    domains: ['operations'],
    roles: ['help-desk-technician', 'systems-administrator', 'field-engineer'],
    vector: { 'dom.operations': 3, 'sty.support': 3, 'wrk.reactive': 2, 'abs.application': 1 },
  },
  {
    slug: 'physical-infrastructure',
    name: 'Physical Infrastructure',
    blurb: 'Racks, cabling, power and the equipment you can put your hands on.',
    domains: ['operations', 'networking', 'systems'],
    roles: ['field-engineer', 'data-center-engineer', 'wireless-engineer', 'network-administrator', 'service-provider-network-engineer', 'noc-technician'],
    vector: { 'dom.operations': 2, 'abs.physical': 3, 'wrk.project': 2 },
  },
  {
    slug: 'observability',
    name: 'Observability & Reliability',
    blurb: 'Instrumenting systems so you find out before your users do.',
    domains: ['operations', 'cloud'],
    roles: ['site-reliability-engineer', 'devops-engineer', 'platform-engineer'],
    vector: { 'sty.monitoring': 3, 'dom.operations': 2, 'dom.cloud': 2, 'wrk.proactive': 2, 'sty.analysis': 2 },
  },
];

/* ═══════════════════════════════════════════════════════════════════
   BALANCE GUARD

   `roles` is a routing tag, not a scoring input — the engine reads capability
   VECTORS, and an A/B across this whole file's role lists produced byte-identical
   assessment results, inventory matches and domain scores. What it does drive is
   which weekend trials appear on which role page, via `trialsForRole`.

   That makes it quietly breakable in two opposite directions, and this checks
   both:

   • Too thin, which is where it started. Nineteen of thirty-eight roles reached
     exactly one trial because their capability list had one or two entries. The
     page still rendered, so nothing complained.

   • Too broad, which is the tempting fix. If capabilities name most roles, every
     trial appears on every role page and the recommendation stops meaning
     anything. That failure is even quieter than the first.
   ═══════════════════════════════════════════════════════════════════ */

/** Every role needs enough tags to reach a useful set of trials. */
const MIN_CAPABILITIES_PER_ROLE = 2;
/** Past this a capability is a label rather than a distinguishing skill. */
const MAX_ROLE_SHARE_PER_CAPABILITY = 0.55;

export function assertCapabilityGraphIntegrity(roleSlugs: string[]): void {
  const errors: string[] = [];
  const known = new Set(roleSlugs);
  const perRole = new Map<string, number>(roleSlugs.map((r) => [r, 0]));

  for (const cap of CAPABILITIES) {
    if (cap.roles.length === 0) {
      errors.push(`${cap.slug} names no roles — nothing can ever route through it`);
    }
    const dupes = cap.roles.filter((r, i) => cap.roles.indexOf(r) !== i);
    if (dupes.length > 0) errors.push(`${cap.slug} lists ${dupes[0]} twice`);

    for (const role of cap.roles) {
      if (!known.has(role)) {
        errors.push(`${cap.slug} names unknown role "${role}"`);
        continue;
      }
      perRole.set(role, perRole.get(role)! + 1);
    }

    const share = cap.roles.length / roleSlugs.length;
    if (share > MAX_ROLE_SHARE_PER_CAPABILITY) {
      errors.push(
        `${cap.slug} names ${cap.roles.length} of ${roleSlugs.length} roles (${Math.round(share * 100)}%) — ` +
          'a capability this broad stops distinguishing anything',
      );
    }
  }

  for (const [role, count] of perRole) {
    if (count < MIN_CAPABILITIES_PER_ROLE) {
      errors.push(
        `${role} is named by only ${count} capability — it will reach almost no trials, silently`,
      );
    }
  }

  if (errors.length > 0) {
    throw new Error(`Navigator capability graph is unbalanced:\n  ${errors.join('\n  ')}`);
  }
}

export const CAPABILITY_BY_SLUG: Record<string, Capability> = Object.fromEntries(
  CAPABILITIES.map((c) => [c.slug, c]),
);
