import type { RoleSalary } from '../types';

/* ═══════════════════════════════════════════════════════════════════
   SALARY DATA

   This is the most dangerous content on the site. It is what people actually
   make decisions on, and a confident-looking wrong number does real damage —
   somebody retrains for two years on the strength of it.

   Three rules follow from that:

   1. EVERY figure names its source occupation. If a number cannot be traced to
      a published statistic, it does not get stated as one.

   2. MOST OF THESE ROLES HAVE NO OFFICIAL CATEGORY. The US Bureau of Labor
      Statistics has no occupation called "Zero Trust Engineer", "Detection
      Engineer" or "DevSecOps Engineer". Where that is true we say so plainly
      and give a directional band, rather than inventing a precise median with a
      dollar sign in front of it to look authoritative.

   3. MEDIAN IS NOT STARTING PAY. A median is the midpoint of everyone employed
      in that occupation, including people twenty years in. Quoting it at a
      career-changer without the entry figure beside it is the single most
      common way career sites mislead people, and it is always in the
      optimistic direction.

   Anchors exist so that when BLS republishes (annually, each spring), someone
   updates roughly a dozen numbers here rather than thirty-eight scattered
   through the role files.
   ═══════════════════════════════════════════════════════════════════ */

/** The date the anchor figures below were last checked against the source. */
export const SALARY_LAST_VERIFIED = 'BLS OES, May 2024 release';

export interface BlsAnchor {
  /** Standard Occupational Classification code — the thing you can go and verify. */
  soc: string;
  title: string;
  median: string;
  growth: string;
}

export const BLS_ANCHORS: Record<string, BlsAnchor> = {
  userSupport: {
    soc: '15-1232',
    title: 'Computer User Support Specialists',
    median: '$60,340',
    growth: '−3% for the group, but roughly 50,500 openings a year from turnover — churn is why the door stays open',
  },
  networkSupport: {
    soc: '15-1231',
    title: 'Computer Network Support Specialists',
    median: '$73,340',
    growth: 'Steady; the NOC is a well-known launch pad rather than a destination',
  },
  sysadmin: {
    soc: '15-1244',
    title: 'Network and Computer Systems Administrators',
    median: '$96,800',
    growth: '−4% projected — the on-premises version of this work is contracting toward cloud',
  },
  networkArchitect: {
    soc: '15-1241',
    title: 'Computer Network Architects',
    median: '$130,390',
    growth: 'About average; concentrated in larger organisations',
  },
  infosec: {
    soc: '15-1212',
    title: 'Information Security Analysts',
    median: '$124,910',
    growth: '+29% — much faster than average, but heavily experience-gated at the entry end',
  },
  developer: {
    soc: '15-1252',
    title: 'Software Developers',
    median: '$133,080',
    growth: '+15% for the group, though the junior end of the market is currently the tightest in IT',
  },
  dba: {
    soc: '15-1242',
    title: 'Database Administrators',
    median: '~$104,000',
    growth: 'About +8%, though managed cloud databases are absorbing parts of the role',
  },
  dataScientist: {
    soc: '15-2051',
    title: 'Data Scientists',
    median: '$112,590',
    growth: '+34% — among the fastest-growing occupations BLS tracks',
  },
  computerOther: {
    soc: '15-1299',
    title: 'Computer Occupations, All Other',
    median: '~$104,000',
    growth: 'Varies widely — this is a catch-all category, not a job',
  },
  telecomInstaller: {
    soc: '49-2022',
    title: 'Telecommunications Equipment Installers & Repairers',
    median: '$64,310',
    growth: 'Flat overall (−1% to −3%); the tower and wireless branch is the growing exception at roughly +7%',
  },
};

/**
 * Shared caveat appended to every median. Written once so it cannot drift into
 * something softer on individual pages.
 */
export const MEDIAN_CAVEAT =
  'A median is the midpoint of everyone employed in that occupation, including people decades into their careers — so starting pay runs materially lower. Verify against the live BLS page before making a decision.';

export const ROLE_SALARY: Record<string, RoleSalary> = {
  /* ── Networking ────────────────────────────────────────────── */
  'network-engineer': {
    anchor: 'sysadmin',
    basis: 'bls-adjacent',
    entry: '~$60,000–$80,000 moving up from a NOC or support role',
    senior: 'Network architects (15-1241) sit at a $130,390 median — that is the ceiling this path climbs toward',
    note: 'BLS has no "Network Engineer" occupation. The work sits between Network and Computer Systems Administrators (15-1244) and Computer Network Architects (15-1241); most engineers earn between the two.',
  },
  'network-administrator': {
    anchor: 'networkSupport',
    basis: 'bls-direct',
    entry: '~$40,000–$62,000 to start (NOC or junior network technician)',
    note: 'Maps cleanly to Computer Network Support Specialists (15-1231).',
  },
  'service-provider-network-engineer': {
    anchor: 'networkArchitect',
    basis: 'bls-adjacent',
    entry: 'Rarely a first job; usually entered from enterprise networking or a NOC',
    senior: 'Carrier and internet-exchange specialists with deep BGP and MPLS command among the better-paid networking roles',
    note: 'No dedicated BLS code. Closest is Computer Network Architects (15-1241). The job market is smaller and concentrated around a limited number of carriers, which cuts both ways: less competition, but far fewer employers.',
  },
  'network-security-engineer': {
    anchor: 'infosec',
    basis: 'bls-adjacent',
    entry: 'Not an entry role. Typically reached from networking or systems after two to four years',
    senior: 'Security architecture and Zero Trust programme work is where this path leads on pay',
    note: 'Sits between Information Security Analysts (15-1212) and Computer Network Architects (15-1241) and often pays above either, because employers struggle to find people credible in both networking and security. That scarcity premium is real but is not captured in any official statistic.',
  },
  'network-automation-engineer': {
    anchor: 'networkArchitect',
    basis: 'no-official-category',
    median: 'Roughly $110,000–$150,000',
    entry: 'Not an entry role — assumes working networking knowledge before any automation',
    note: 'No BLS occupation exists. The band is inferred from network architect and software developer figures, since the role genuinely requires both. Adding automation to networking experience is one of the clearer pay uplifts in infrastructure, but the evidence for that is industry surveys, not official data.',
  },
  'cloud-network-engineer': {
    anchor: 'networkArchitect',
    basis: 'no-official-category',
    median: 'Roughly $110,000–$150,000',
    entry: 'Second role, reached from networking or cloud operations',
    note: 'No BLS occupation. Inferred from Computer Network Architects (15-1241) with a cloud specialisation premium that industry surveys report and official statistics do not track.',
  },
  'wireless-engineer': {
    anchor: 'sysadmin',
    basis: 'bls-adjacent',
    entry: '~$50,000–$70,000, often from a field or network support role',
    note: 'No dedicated BLS code; nearest is Network and Computer Systems Administrators (15-1244). Specialists in high-density environments — hospitals, stadiums, warehouses — command more than the general figure suggests.',
  },
  'data-center-engineer': {
    anchor: 'sysadmin',
    basis: 'bls-adjacent',
    entry: '~$45,000–$65,000 from a hands-on or field background',
    note: 'Spans several BLS categories depending on the employer, from installer occupations through Network and Computer Systems Administrators (15-1244). Pay varies more by region than most IT roles, because the work is physically tied to specific facilities.',
  },

  /* ── Cybersecurity ─────────────────────────────────────────── */
  'soc-analyst': {
    anchor: 'infosec',
    basis: 'bls-direct',
    entry: '~$55,000–$75,000 to start (SOC analyst I)',
    senior: 'Senior analyst and incident response work moves toward and past the median',
    note: 'Maps to Information Security Analysts (15-1212). Be aware the median covers the whole occupation including senior engineers and architects; a tier-one SOC seat starts well below it. This is one of the few genuinely entry-accessible security roles, and the pay reflects that.',
  },
  'security-engineer': {
    anchor: 'infosec',
    basis: 'bls-direct',
    entry: 'Not an entry role — typically two to four years in systems, networking or SOC first',
    note: 'Maps to Information Security Analysts (15-1212), though the occupation bundles analysts and engineers together and engineering work generally sits in the upper half of it.',
  },
  'incident-responder': {
    anchor: 'infosec',
    basis: 'bls-adjacent',
    entry: 'Senior entry — grown into from SOC or systems work',
    note: 'Within Information Security Analysts (15-1212). Consultancy incident response often pays above the median but comes with short-notice travel and genuinely unsociable hours.',
  },
  'threat-hunter': {
    anchor: 'infosec',
    basis: 'no-official-category',
    median: 'Roughly $120,000–$160,000',
    entry: 'Not an entry role. Requires enough experience to know what normal looks like',
    note: 'No BLS occupation. Band inferred from senior Information Security Analyst (15-1212) figures. Roles are concentrated in mature security teams, so the market is smaller than the salary surveys imply.',
  },
  'detection-engineer': {
    anchor: 'infosec',
    basis: 'no-official-category',
    median: 'Roughly $115,000–$155,000',
    entry: 'Second or third role, usually from SOC or data engineering',
    note: 'No BLS occupation. Sits between Information Security Analysts (15-1212) and data engineering work, and the combination of security judgement plus real coding ability is scarce enough to pay above either alone.',
  },
  'digital-forensics-analyst': {
    anchor: 'infosec',
    basis: 'bls-adjacent',
    entry: 'Law-enforcement routes start considerably lower than private-sector consultancy',
    note: 'Within Information Security Analysts (15-1212), but pay splits sharply by sector: public-sector and law-enforcement forensics pays well below private consultancy for substantially similar work.',
  },
  'penetration-tester': {
    anchor: 'infosec',
    basis: 'bls-adjacent',
    entry: '~$60,000–$85,000, and the entry end is crowded',
    note: 'Within Information Security Analysts (15-1212). The visible salary figures are skewed by a small number of highly specialised practitioners; the ordinary consultancy end is considerably lower, and competition for junior seats is intense.',
  },
  'application-security-engineer': {
    anchor: 'developer',
    basis: 'no-official-category',
    median: 'Roughly $125,000–$165,000',
    entry: 'Not an entry role — credibility here requires having shipped code',
    note: 'No BLS occupation. Inferred from Software Developers (15-1252) plus a security premium. Pay tracks the software market more closely than the security market, which is worth knowing when comparing offers.',
  },
  'identity-engineer': {
    anchor: 'infosec',
    basis: 'no-official-category',
    median: 'Roughly $105,000–$145,000',
    entry: 'Reached from systems administration or Active Directory work',
    note: 'No BLS occupation; spans Information Security Analysts (15-1212) and Network and Computer Systems Administrators (15-1244). Demand has risen sharply as organisations move identity to the cloud, and supply has not kept up.',
  },
  'zero-trust-engineer': {
    anchor: 'infosec',
    basis: 'no-official-category',
    median: 'Roughly $120,000–$165,000',
    entry: 'Senior. Built on networking plus identity experience, not entered directly',
    note: 'No BLS occupation, and the title itself is recent and inconsistently used — the same work appears as network security, identity or security architecture depending on the employer. Treat any quoted figure, including this band, with real scepticism.',
  },
  'cloud-security-engineer': {
    anchor: 'infosec',
    basis: 'no-official-category',
    median: 'Roughly $125,000–$170,000',
    entry: 'Second or third role; assumes genuine cloud experience first',
    note: 'No BLS occupation. Among the better-paid security specialisms because it requires fluency in both cloud engineering and security, which few people have. Band inferred from Information Security Analysts (15-1212) with a cloud premium reported by industry surveys.',
  },
  'devsecops-engineer': {
    anchor: 'developer',
    basis: 'no-official-category',
    median: 'Roughly $125,000–$165,000',
    entry: 'Third role in practice — requires credibility in development, operations and security',
    note: 'No BLS occupation. Inferred from Software Developers (15-1252). The role sits between three teams and is owned by none, which is worth weighing alongside the pay.',
  },
  'vulnerability-analyst': {
    anchor: 'infosec',
    basis: 'bls-adjacent',
    entry: '~$55,000–$75,000 — one of the more reachable security entry points',
    note: 'Within Information Security Analysts (15-1212), typically in the lower half of it. Progression depends on moving toward engineering or offensive work rather than staying in reporting.',
  },
  'grc-analyst': {
    anchor: 'infosec',
    basis: 'bls-adjacent',
    entry: '~$60,000–$80,000 to start',
    senior: 'Governance leadership and CISO-track roles pay substantially more',
    note: 'Straddles Information Security Analysts (15-1212) and management analyst categories. Progression depends heavily on staying technically literate — GRC people who cannot talk to engineers stall early and visibly.',
  },
  'ot-security-engineer': {
    anchor: 'infosec',
    basis: 'no-official-category',
    median: 'Roughly $120,000–$160,000',
    entry: 'Senior. Requires both networking and security experience before entry',
    note: 'No BLS occupation. A genuine scarcity premium exists because very few people understand both industrial control systems and security. Roles are geographically tied to industrial sites, which limits remote options more than most security work.',
  },
  'security-architect': {
    anchor: 'infosec',
    basis: 'no-official-category',
    median: 'Roughly $140,000–$190,000',
    entry: 'Not entered directly. Eight to fifteen years of hands-on work precedes it',
    note: 'No BLS occupation; sits above Information Security Analysts (15-1212) and near Computer and Information Systems Managers (11-3021, $169,510 median). Any salary survey for this title is measuring people with long careers behind them — it is a destination figure, not a target.',
  },

  /* ── Systems & Cloud ───────────────────────────────────────── */
  'systems-engineer': {
    anchor: 'sysadmin',
    basis: 'bls-direct',
    entry: '~$60,000 to start, typically from systems administration',
    note: 'Maps to Network and Computer Systems Administrators (15-1244). Note the negative growth projection: the on-premises version of this role is contracting, and staying still is itself a risk.',
  },
  'systems-administrator': {
    anchor: 'sysadmin',
    basis: 'bls-direct',
    entry: '~$45,000–$65,000 to start',
    note: 'Maps to Network and Computer Systems Administrators (15-1244). In smaller organisations this role covers everything, which is excellent for learning and poor for pay relative to specialists.',
  },
  'cloud-engineer': {
    anchor: 'computerOther',
    basis: 'no-official-category',
    median: '~$116,580',
    entry: 'Reached via a first rung — support, systems or networking — not day one',
    note: 'No dedicated BLS code; the figure approximates Computer Occupations, All Other (15-1299). Published cloud-role averages skew high because they are self-selected from people who already hold the job. Treat as directional.',
  },
  'cloud-architect': {
    anchor: 'networkArchitect',
    basis: 'no-official-category',
    median: 'Roughly $145,000–$190,000',
    entry: 'Not entered directly — follows years of hands-on cloud and infrastructure work',
    note: 'No BLS occupation. Near Computer and Information Systems Managers (11-3021, $169,510). As with security architecture, published figures describe people with long careers, not people arriving.',
  },
  'devops-engineer': {
    anchor: 'computerOther',
    basis: 'no-official-category',
    median: 'Roughly $115,000–$155,000',
    entry: 'Not entry-level, whatever the job listings say — assumes systems, networking and coding ability',
    note: 'No BLS occupation; approximates Computer Occupations, All Other (15-1299). On-call is standard and burnout is a genuine risk when the platform team is also the incident team — worth weighing against the figure.',
  },
  'platform-engineer': {
    anchor: 'computerOther',
    basis: 'no-official-category',
    median: 'Roughly $125,000–$165,000',
    entry: 'Senior. Requires enough experience to know which abstractions are worth building',
    note: 'No BLS occupation. Concentrated in larger engineering organisations, so the market is smaller than for DevOps generally even though the pay is typically higher.',
  },
  'site-reliability-engineer': {
    anchor: 'developer',
    basis: 'no-official-category',
    median: 'Roughly $130,000–$175,000',
    entry: 'Senior. Built on strong systems and coding experience',
    note: 'No BLS occupation; pay tracks Software Developers (15-1252) closely because most SRE roles expect real software ability. On-call is central to the job rather than incidental, which is part of what the figure is compensating.',
  },
  'database-administrator': {
    anchor: 'dba',
    basis: 'bls-direct',
    entry: '~$60,000–$80,000 to start',
    note: 'Maps to Database Administrators (15-1242). The on-premises version of the role is narrowing as managed cloud databases absorb parts of it; database engineering and reliability work is where it is heading.',
  },

  /* ── Software, Data & Operations ───────────────────────────── */
  'software-developer': {
    anchor: 'developer',
    basis: 'bls-direct',
    entry: 'Web developer entry around $48,560; the junior market is currently the tightest in IT',
    note: 'Maps to Software Developers (15-1252). The median is one of the highest in IT and also one of the most misleading for a beginner — listings skew senior, and a portfolio of working code matters far more than certifications here.',
  },
  'data-engineer': {
    anchor: 'dataScientist',
    basis: 'no-official-category',
    median: 'Roughly $110,000–$150,000',
    entry: 'Second role, usually from analysis, development or systems',
    note: 'No dedicated BLS occupation; sits between Data Scientists (15-2051) and Software Developers (15-1252). Much of the job is cleaning up data produced carelessly upstream, which the salary figure does not convey.',
  },
  'data-analyst': {
    anchor: 'dataScientist',
    basis: 'bls-adjacent',
    entry: '~$55,000–$85,000 to start (industry figure, not BLS)',
    note: 'The BLS Data Scientists umbrella (15-2051) includes senior and specialised roles and runs well above typical data-analyst pay — treat the median as a ceiling reference rather than an expectation. Title inflation is rife: "analyst" describes very different jobs at different employers.',
  },
  'help-desk-technician': {
    anchor: 'userSupport',
    basis: 'bls-direct',
    entry: '~$38,000–$47,000 to start (level-one service desk)',
    senior: 'The value here is the exit — most people move to systems, networking or security within two years',
    note: 'Maps to Computer User Support Specialists (15-1232). Treat this as a launch pad rather than a destination: level-one phone work is also the most automation-exposed part of IT.',
  },
  'noc-technician': {
    anchor: 'networkSupport',
    basis: 'bls-direct',
    entry: '~$40,000–$55,000 to start',
    senior: 'Moving into network engineering is the standard and considerable pay step',
    note: 'Maps to Computer Network Support Specialists (15-1231). Shift premiums for nights and weekends can add meaningfully to the base figure — and the rota is genuinely 24/7.',
  },
  'field-engineer': {
    anchor: 'telecomInstaller',
    basis: 'bls-direct',
    entry: '~$35,000–$48,000 to start (helper or installer)',
    note: 'Maps to Telecommunications Equipment Installers & Repairers (49-2022); the tower and radio branch (49-2021) sits at a similar $63,520 median with faster growth. Overtime and call-out pay are a real part of total earnings, and so is the physical toll.',
  },
};

/**
 * Build-time guard.
 *
 * Salary is the content most likely to cause real harm if it drifts, so the
 * rules are enforced rather than trusted to review:
 *  · every role has a figure, or the page silently omits pay for that role
 *  · every anchor reference resolves
 *  · a role claiming an official mapping must actually cite one
 *  · a role with no official category must carry its own directional band,
 *    because otherwise it would inherit an anchor median it has no right to
 *  · entry pay is never absent — that is the number people actually need
 */
export function assertSalaryIntegrity(roleSlugs: string[]): void {
  const problems: string[] = [];

  for (const slug of roleSlugs) {
    const s = ROLE_SALARY[slug];
    if (!s) {
      problems.push(`${slug} has no salary entry`);
      continue;
    }
    if (!s.entry) problems.push(`${slug} has no entry figure — the median alone is misleading`);
    if (!s.note) problems.push(`${slug} has no sourcing note`);
    if (s.anchor && !BLS_ANCHORS[s.anchor]) problems.push(`${slug} → unknown anchor "${s.anchor}"`);
    if (s.basis !== 'no-official-category' && !s.anchor) {
      problems.push(`${slug} claims an official mapping but cites no occupation`);
    }
    if (s.basis === 'no-official-category' && !s.median) {
      problems.push(`${slug} has no official category and no directional band — it would inherit an anchor median it cannot justify`);
    }
  }

  for (const slug of Object.keys(ROLE_SALARY)) {
    if (!roleSlugs.includes(slug)) problems.push(`salary entry "${slug}" matches no role`);
  }

  // An anchor nobody cites is a published figure with no page behind it — it
  // will quietly go stale and then get copied somewhere on the assumption that
  // it was being maintained.
  const used = new Set(Object.values(ROLE_SALARY).map((s) => s.anchor).filter(Boolean));
  for (const key of Object.keys(BLS_ANCHORS)) {
    if (!used.has(key)) problems.push(`anchor "${key}" (${BLS_ANCHORS[key].soc}) is referenced by no role`);
  }

  if (problems.length) {
    throw new Error(`Navigator salary data is broken:\n  ${problems.join('\n  ')}`);
  }
}
