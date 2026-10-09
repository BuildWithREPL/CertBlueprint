import type { RoleContent } from '../../types';

/**
 * Cybersecurity roles.
 *
 * Deliberately granular. The old assessment collapsed all of this into one
 * "Cybersecurity" bucket, which is why it could never tell a person who likes
 * building controls (security engineering) from a person who likes reconstructing
 * events (forensics) from a person who likes arguing about risk (GRC). Those are
 * three unrelated temperaments sharing a job family.
 */
export const SECURITY_ROLES: RoleContent[] = [
  {
    slug: 'security-engineer',
    shortLabel: 'Building and operating security controls',
    subdomains: ['security-engineering', 'endpoint-security', 'vulnerability-management', 'cloud-security'],
    entry: 'second-job',
    activities: [
      'Deploy and tune the tooling that detects and blocks attacks across the estate',
      'Harden systems — remove what is not needed, lock down what is',
      'Design and run the patching and vulnerability remediation process',
      'Build the logging pipeline so investigations are possible at all',
      'Review proposed changes and say what would make them safe',
      'Automate a control so it applies everywhere rather than where someone remembered',
      'Answer the "can we do this?" question with a workable "yes, if"',
    ],
    technologies: ['edr', 'splunk', 'active-directory', 'linux', 'windows-server', 'python', 'vuln-scanners', 'intune-sccm', 'palo-alto', 'aws'],
    concepts: ['Defence in depth', 'Least privilege', 'Attack surface reduction', 'Detection versus prevention', 'Secure baselines', 'Risk-based prioritisation'],
    environments: ['Enterprises with an in-house security team', 'Technology companies', 'Financial services', 'Healthcare', 'Managed security service providers'],
    enjoyIf: [
      'You would rather remove a whole class of problem than fix one instance',
      'You like building things that quietly work rather than things people applaud',
      'You enjoy having to understand systems deeply before you can secure them',
      'You are comfortable being the person who says "not like that"',
    ],
    reality:
      'Nobody notices security engineering when it works. You will be asked to secure systems you were not consulted on, and you will spend real effort on organisational persuasion rather than technology. This is essentially never a first job.',
    related: ['network-security-engineer', 'cloud-security-engineer', 'detection-engineer', 'identity-engineer', 'systems-engineer', 'security-architect'],
    adjacent: [
      { slug: 'security-architect', reason: 'The design-level version of the same judgement.' },
      { slug: 'cloud-security-engineer', reason: 'The same discipline where the estate is an API.' },
      { slug: 'detection-engineer', reason: 'If the detection half of the job is what holds your attention.' },
      { slug: 'network-security-engineer', reason: 'If the network controls are where you keep gravitating.' },
    ],
    certs: [
      { title: 'CompTIA Security+', slug: 'security-plus', vendorSlug: 'comptia', stage: 'Foundation', reason: 'The baseline credential, and a hard requirement in government-adjacent work.' },
      { title: 'CompTIA CySA+', slug: 'cysa-plus', vendorSlug: 'comptia', stage: 'Core', reason: 'Analysis and defensive operations at working depth.' },
      { title: 'Microsoft SC-900', slug: 'sc-900', vendorSlug: 'microsoft', stage: 'Foundation', reason: 'Useful orientation if your estate is Microsoft-centred.' },
      { title: 'ISC2 CISSP', slug: 'cissp', vendorSlug: 'isc2', stage: 'Advanced', reason: 'The breadth credential once you have the five years of experience it requires.' },
    ],
    seoTitle: 'Security Engineer — Building the Controls | CertBlueprint',
    seoDescription:
      'What security engineers actually build and run, how the role differs from SOC analysis and architecture, and the Security+ → CySA+ → CISSP path.',
  },

  {
    slug: 'soc-analyst',
    shortLabel: 'Triage, alerts and first response',
    subdomains: ['security-operations', 'soc-ops', 'endpoint-security'],
    entry: 'first-job',
    activities: [
      'Work an alert queue and decide what is real, what is noise, and what needs waking someone up',
      'Pull the surrounding evidence — logs, process trees, network connections — to test a hypothesis',
      'Escalate with a written narrative that lets the next person act immediately',
      'Isolate a compromised machine before the problem spreads',
      'Feed back into detection rules so the same false positive does not return tomorrow',
      'Track what an attacker did in order, from first access onward',
    ],
    technologies: ['splunk', 'sentinel-elastic', 'edr', 'wireshark', 'netflow', 'suricata-zeek', 'active-directory', 'nmap'],
    concepts: ['Indicators of compromise', 'The kill chain', 'Alert triage and severity', 'True and false positives', 'Lateral movement', 'Containment'],
    environments: ['Managed security service providers', 'Enterprise security operations centres', 'Government', 'Financial services', '24/7 shift environments'],
    enjoyIf: [
      'You like the feeling of catching something nobody else spotted',
      'You are comfortable making a call on incomplete information',
      'You enjoy reconstructing a sequence of events from fragments',
      'You want a security job that is genuinely reachable early',
    ],
    reality:
      'Most alerts are nothing, and the volume is relentless. Shift work including nights is common, and alert fatigue is a real occupational hazard. It is one of the few genuinely entry-accessible security roles — but "entry-level" listings still routinely ask for two years.',
    related: ['incident-responder', 'threat-hunter', 'detection-engineer', 'network-security-engineer', 'digital-forensics-analyst'],
    adjacent: [
      { slug: 'incident-responder', reason: 'The escalation you hand to today becomes your job tomorrow.' },
      { slug: 'detection-engineer', reason: 'If you keep wanting to fix the rule rather than work the alert.' },
      { slug: 'threat-hunter', reason: 'If you would rather go looking than wait for the queue.' },
      { slug: 'network-security-engineer', reason: 'If the network half of every investigation is what interests you.' },
    ],
    certs: [
      { title: 'CompTIA Security+', slug: 'security-plus', vendorSlug: 'comptia', stage: 'Start here', reason: 'The standard entry filter for SOC roles.' },
      { title: 'CompTIA Network+', slug: 'network-plus', vendorSlug: 'comptia', stage: 'Foundation', reason: 'Half of every investigation is a networking question.' },
      { title: 'CompTIA CySA+', slug: 'cysa-plus', vendorSlug: 'comptia', stage: 'Core', reason: 'Purpose-built for exactly this role.' },
      { title: 'Cisco CCNA Cybersecurity', slug: 'ccna-cybersecurity', vendorSlug: 'cisco', stage: 'Alternative', reason: 'A strong operations-focused alternative with a networking spine.' },
      { title: 'Google Cybersecurity Certificate', slug: 'google-cybersecurity', vendorSlug: 'google', stage: 'Alternative', reason: 'A structured, low-risk way to test whether security work suits you before paying for Security+.' },
      { title: 'Cisco CCST Cybersecurity', slug: 'ccst-cybersecurity', vendorSlug: 'cisco', stage: 'Alternative', reason: 'A low-cost first milestone for students and absolute beginners — not a substitute for Security+ in job filters.' },
      { title: 'Cisco CCNP Cybersecurity', slug: 'ccnp-cybersecurity', vendorSlug: 'cisco', stage: 'Advanced', reason: 'The next step after a year or two of real SOC work, toward senior analyst and incident response.' },
    ],
    pathSlug: 'soc-analyst',
    seoTitle: 'SOC Analyst — The Realistic Way Into Security | CertBlueprint',
    seoDescription:
      'Alert triage, evidence gathering and escalation: what SOC analysts really do, the shift-work reality, and the Security+ → CySA+ path.',
  },

  {
    slug: 'incident-responder',
    shortLabel: 'Containment and live response',
    subdomains: ['incident-response', 'security-operations'],
    entry: 'senior',
    activities: [
      'Establish what is actually happening while the situation is still moving',
      'Decide what to isolate and what to leave running, knowing both choices cost something',
      'Reconstruct the attacker’s route in, and find everywhere else they reached',
      'Preserve evidence properly while still moving fast',
      'Brief people who need a decision, not a technical explanation',
      'Run the recovery, then write the honest account of what happened',
    ],
    technologies: ['edr', 'splunk', 'wireshark', 'active-directory', 'linux', 'windows-server', 'python'],
    concepts: ['Containment, eradication, recovery', 'Chain of custody', 'Attacker persistence', 'Blast radius', 'Post-incident review'],
    environments: ['Incident response consultancies', 'Large enterprise security teams', 'Government and defence', 'Financial services'],
    enjoyIf: [
      'You get calmer rather than more scattered when things go badly',
      'You like being the person who makes the call',
      'You enjoy piecing a story together from evidence under time pressure',
    ],
    reality:
      'Incidents arrive at inconvenient times and last longer than anyone plans for. The work is genuinely stressful, and the consulting version involves travel at short notice. This is a role you grow into from SOC or systems work.',
    related: ['soc-analyst', 'digital-forensics-analyst', 'threat-hunter', 'security-engineer'],
    adjacent: [
      { slug: 'digital-forensics-analyst', reason: 'The slower, deeper version of the same reconstruction.' },
      { slug: 'threat-hunter', reason: 'Looking for the incident before it declares itself.' },
      { slug: 'security-architect', reason: 'Seeing enough incidents tends to produce strong design opinions.' },
    ],
    certs: [
      { title: 'CompTIA Security+', slug: 'security-plus', vendorSlug: 'comptia', stage: 'Foundation', reason: 'The baseline.' },
      { title: 'CompTIA CySA+', slug: 'cysa-plus', vendorSlug: 'comptia', stage: 'Core', reason: 'Covers the analysis and response cycle directly.' },
      { title: 'ISC2 CISSP', slug: 'cissp', vendorSlug: 'isc2', stage: 'Advanced', reason: 'Breadth credential for senior response and leadership roles.' },
      { title: 'Cisco CCNP Cybersecurity', slug: 'ccnp-cybersecurity', vendorSlug: 'cisco', stage: 'Advanced', reason: 'Built for working SOC analysts moving into incident response.' },
    ],
    seoTitle: 'Incident Responder — When It Is Happening Now | CertBlueprint',
    seoDescription: 'Containment, evidence and recovery under time pressure: what incident responders do and how people reach the role.',
  },

  {
    slug: 'threat-hunter',
    shortLabel: 'Proactive search for what was missed',
    subdomains: ['security-operations', 'incident-response'],
    entry: 'senior',
    activities: [
      'Form a hypothesis about how an attacker would operate here, then go test it against real data',
      'Query months of logs looking for the pattern that should not exist',
      'Investigate the thing that is technically allowed but makes no sense',
      'Turn a successful hunt into a permanent detection',
      'Study attacker techniques and work out which ones your environment would miss',
    ],
    technologies: ['splunk', 'sentinel-elastic', 'edr', 'netflow', 'python', 'sql', 'suricata-zeek'],
    concepts: ['Hypothesis-driven hunting', 'MITRE ATT&CK', 'Baselining normal behaviour', 'Living-off-the-land techniques', 'Dwell time'],
    environments: ['Mature enterprise security teams', 'Technology companies', 'Government', 'Financial services'],
    enjoyIf: [
      'You are the person who keeps pulling a thread after everyone else stopped',
      'You enjoy long stretches of deep, self-directed investigation',
      'You are comfortable with searches that find nothing, most of the time',
    ],
    reality:
      'Most hunts come back empty, and you have to be fine with that. It requires enough experience to know what normal looks like, so it is not an entry point — it is where good SOC analysts go after a few years.',
    related: ['soc-analyst', 'detection-engineer', 'incident-responder', 'digital-forensics-analyst'],
    adjacent: [
      { slug: 'detection-engineer', reason: 'Turning every successful hunt into something automatic.' },
      { slug: 'incident-responder', reason: 'When a hunt finds something, this becomes the next hour.' },
    ],
    certs: [
      { title: 'CompTIA CySA+', slug: 'cysa-plus', vendorSlug: 'comptia', stage: 'Core', reason: 'The analytical foundation for this work.' },
      { title: 'CompTIA Security+', slug: 'security-plus', vendorSlug: 'comptia', stage: 'Foundation', reason: 'Assumed background.' },
      { title: 'Cisco CCNP Cybersecurity', slug: 'ccnp-cybersecurity', vendorSlug: 'cisco', stage: 'Advanced', reason: 'Built for working SOC analysts moving toward threat hunting.' },
    ],
    certNote: 'Hunting is a skills-and-portfolio field more than a certification field — public writeups of your own analysis carry more weight than another exam.',
    seoTitle: 'Threat Hunter — Looking Before the Alert | CertBlueprint',
    seoDescription: 'Hypothesis-driven hunting, ATT&CK and deep log analysis: what threat hunters do and why it is a mid-career move.',
  },

  {
    slug: 'detection-engineer',
    shortLabel: 'Building detections that actually fire',
    subdomains: ['security-operations', 'security-engineering'],
    entry: 'second-job',
    activities: [
      'Get logs out of systems that were not designed to give them up, and into a usable shape',
      'Write and tune detection rules, then measure how often they are wrong',
      'Test a detection against a simulated version of the real technique',
      'Kill noisy alerts that are wasting the SOC’s attention',
      'Build the enrichment that turns a bare alert into something answerable',
      'Version-control detections and review them like code',
    ],
    technologies: ['splunk', 'sentinel-elastic', 'python', 'git', 'suricata-zeek', 'sql', 'edr'],
    concepts: ['Detection as code', 'Signal-to-noise ratio', 'MITRE ATT&CK coverage', 'Log normalisation', 'Alert fatigue', 'Detection testing'],
    environments: ['Mature security operations teams', 'Technology companies', 'Managed detection providers'],
    enjoyIf: [
      'You would rather fix the rule than work the ticket',
      'You like building something measurable — this rule caught it, that one did not',
      'You enjoy working where security and data engineering overlap',
    ],
    reality:
      'You are judged on things not happening, and on complaints when a rule is too loud. It needs both security knowledge and enough coding to be dangerous, which is why it usually follows SOC or engineering experience.',
    related: ['soc-analyst', 'threat-hunter', 'security-engineer', 'data-engineer'],
    adjacent: [
      { slug: 'threat-hunter', reason: 'Hunting finds what detection is missing; the loop runs both ways.' },
      { slug: 'security-engineer', reason: 'Broader control building beyond detection alone.' },
      { slug: 'data-engineer', reason: 'A SIEM pipeline is a data pipeline — the skills transfer entirely.' },
    ],
    certs: [
      { title: 'CompTIA CySA+', slug: 'cysa-plus', vendorSlug: 'comptia', stage: 'Core', reason: 'The defensive analysis foundation.' },
      { title: 'CompTIA Security+', slug: 'security-plus', vendorSlug: 'comptia', stage: 'Foundation', reason: 'Assumed baseline.' },
      { title: 'Google IT Automation with Python', slug: 'google-it-automation', vendorSlug: 'google', stage: 'Skill building', reason: 'If the coding half is what you need to build.' },
    ],
    seoTitle: 'Detection Engineer — Security Meets Data Engineering | CertBlueprint',
    seoDescription: 'Detection as code, log pipelines and alert tuning: what detection engineers do and how SOC analysts grow into the role.',
  },

  {
    slug: 'digital-forensics-analyst',
    shortLabel: 'Evidence, timelines and proof',
    subdomains: ['incident-response'],
    entry: 'senior',
    activities: [
      'Acquire disk and memory images without altering the original',
      'Build a minute-by-minute timeline from filesystem, registry and log artefacts',
      'Recover deleted or partially overwritten data',
      'Determine whether data actually left, and what',
      'Write findings that hold up to legal or regulatory challenge',
    ],
    technologies: ['linux', 'windows-server', 'wireshark', 'edr', 'python'],
    concepts: ['Chain of custody', 'Forensic imaging', 'Filesystem artefacts', 'Memory analysis', 'Anti-forensics', 'Evidentiary standards'],
    environments: ['Law enforcement', 'Forensic consultancies', 'Large enterprise incident teams', 'Legal and insurance work'],
    enjoyIf: [
      'You are meticulous to a degree other people find excessive',
      'You like slow, careful work where being right matters more than being fast',
      'You enjoy proving something rather than assuming it',
    ],
    reality:
      'Casework can be grim, particularly in law enforcement. The pace is slow and documentation-heavy, and the tooling is expensive. It is a specialist destination, not an entry point.',
    related: ['incident-responder', 'threat-hunter', 'soc-analyst'],
    adjacent: [
      { slug: 'incident-responder', reason: 'The live-fire version of the same skills.' },
      { slug: 'threat-hunter', reason: 'Similar evidence instincts, applied before the incident.' },
    ],
    certs: [
      { title: 'CompTIA Security+', slug: 'security-plus', vendorSlug: 'comptia', stage: 'Foundation', reason: 'The baseline.' },
      { title: 'CompTIA CySA+', slug: 'cysa-plus', vendorSlug: 'comptia', stage: 'Core', reason: 'Analysis fundamentals before specialising.' },
    ],
    certNote: 'The recognised forensics credentials (GCFA, EnCE) sit outside CertBlueprint’s current coverage — treat the certs above as the road to the starting line.',
    seoTitle: 'Digital Forensics Analyst — Proving What Happened | CertBlueprint',
    seoDescription: 'Imaging, timelines and evidentiary standards: what forensic analysts do and the honest route into the specialism.',
  },

  {
    slug: 'penetration-tester',
    shortLabel: 'Authorised attack and proof',
    subdomains: ['offensive-security'],
    entry: 'second-job',
    activities: [
      'Map what is exposed and reachable before deciding what to try',
      'Chain small weaknesses into one that actually matters',
      'Test applications for logic flaws as well as known vulnerabilities',
      'Prove impact concretely rather than reporting theoretical risk',
      'Write a report the defending team can act on, prioritised honestly',
      'Retest after the fixes to confirm they worked',
    ],
    technologies: ['nmap', 'burp-metasploit', 'linux', 'python', 'active-directory', 'wireshark'],
    concepts: ['Scoping and rules of engagement', 'Privilege escalation', 'Lateral movement', 'Web application vulnerabilities', 'Reporting and impact'],
    environments: ['Security consultancies', 'Internal red teams', 'Bug bounty work', 'Government and defence'],
    enjoyIf: [
      'You instinctively look for the thing a system was not designed to handle',
      'You enjoy learning a system deeply enough to find its assumptions',
      'You like work with a clear, provable outcome',
    ],
    reality:
      'It is far more report writing than film suggests. Scopes are narrow, clients are sometimes defensive about findings, and the field is crowded at the entry end — most people arrive from systems, networking or development, not from a course.',
    related: ['application-security-engineer', 'vulnerability-analyst', 'security-engineer', 'threat-hunter'],
    adjacent: [
      { slug: 'application-security-engineer', reason: 'If the software layer is where you keep finding things.' },
      { slug: 'vulnerability-analyst', reason: 'The at-scale, defensive counterpart.' },
      { slug: 'security-architect', reason: 'Knowing how things break is excellent preparation for designing them.' },
    ],
    certs: [
      { title: 'CompTIA Security+', slug: 'security-plus', vendorSlug: 'comptia', stage: 'Foundation', reason: 'Baseline knowledge and a common hiring filter.' },
      { title: 'CompTIA PenTest+', slug: 'pentest-plus', vendorSlug: 'comptia', stage: 'Core', reason: 'The methodology and reporting side, properly covered.' },
      { title: 'CompTIA Network+', slug: 'network-plus', vendorSlug: 'comptia', stage: 'Foundation', reason: 'You cannot attack what you do not understand.' },
    ],
    seoTitle: 'Penetration Tester — The Honest Version of the Job | CertBlueprint',
    seoDescription: 'Scoping, exploitation and the report that follows: what penetration testers really do and the PenTest+ path in.',
  },

  {
    slug: 'application-security-engineer',
    shortLabel: 'Security inside the code',
    subdomains: ['offensive-security', 'devsecops', 'software-development'],
    entry: 'second-job',
    activities: [
      'Review code and designs for the flaw a scanner will never see',
      'Run and tune application security testing inside the build pipeline',
      'Model threats against a feature before it is built',
      'Work with developers on the fix, not just the finding',
      'Triage dependency vulnerabilities into the ones that actually matter here',
    ],
    technologies: ['burp-metasploit', 'python', 'git', 'docker', 'rest-apis', 'linux'],
    concepts: ['OWASP Top 10', 'Threat modelling', 'Secure code review', 'Supply chain security', 'Shift-left security'],
    environments: ['Software companies', 'Fintech', 'Any organisation building its own products'],
    enjoyIf: [
      'You like reading code with an adversarial eye',
      'You enjoy explaining a risk in terms a developer can act on',
      'You want security work that stays close to how software is built',
    ],
    reality:
      'You need genuine development experience to be credible — advice from someone who has never shipped code gets ignored. Expect to spend as much time on persuasion and process as on technical work.',
    related: ['penetration-tester', 'devsecops-engineer', 'software-developer', 'security-engineer'],
    adjacent: [
      { slug: 'devsecops-engineer', reason: 'The same goal, achieved through the pipeline rather than review.' },
      { slug: 'penetration-tester', reason: 'The offensive side of the same knowledge.' },
    ],
    certs: [
      { title: 'CompTIA Security+', slug: 'security-plus', vendorSlug: 'comptia', stage: 'Foundation', reason: 'Security vocabulary and fundamentals.' },
      { title: 'CompTIA PenTest+', slug: 'pentest-plus', vendorSlug: 'comptia', stage: 'Core', reason: 'The attacker perspective, formalised.' },
      { title: 'AWS Developer Associate', slug: 'aws-developer-associate', vendorSlug: 'aws', stage: 'Adjacent', reason: 'Most application security work now happens in cloud-hosted apps.' },
    ],
    seoTitle: 'Application Security Engineer — Security in the Code | CertBlueprint',
    seoDescription: 'Threat modelling, secure code review and pipeline testing: what application security engineers do and why development experience comes first.',
  },

  {
    slug: 'identity-engineer',
    shortLabel: 'Accounts, access and proof of identity',
    subdomains: ['identity-security', 'directory-identity', 'zero-trust'],
    entry: 'second-job',
    activities: [
      'Run the directory that every application authenticates against',
      'Design access models so people get what they need and nothing else',
      'Implement multi-factor authentication and conditional access rules',
      'Build joiner-mover-leaver processes that actually remove access on the last day',
      'Lock down privileged accounts and make their use auditable',
      'Untangle a permissions structure that grew for fifteen years without a plan',
      'Connect a new application to single sign-on without weakening either side',
    ],
    technologies: ['active-directory', 'entra-id', 'okta', 'cisco-ise', 'powershell', 'ipsec-tls-pki', 'aws', 'azure'],
    concepts: ['Authentication versus authorization', 'Least privilege', 'Role-based access control', 'SAML and OIDC', 'Privileged access management', 'Identity lifecycle', 'Zero Trust'],
    environments: ['Enterprises of any size', 'Cloud-first companies', 'Regulated industries', 'Government'],
    enjoyIf: [
      'You like systems where correctness matters more than speed',
      'You enjoy untangling something complicated that nobody else wants to touch',
      'You find satisfaction in a rule that quietly applies everywhere',
      'You like being at the centre of how an organisation actually works',
    ],
    reality:
      'Identity is where security and convenience collide hardest, and you will be in the middle of that argument permanently. Mistakes lock out large numbers of people immediately and visibly. Legacy permission sprawl is genuinely painful to clean up.',
    related: ['security-engineer', 'zero-trust-engineer', 'systems-engineer', 'cloud-security-engineer', 'network-security-engineer'],
    adjacent: [
      { slug: 'zero-trust-engineer', reason: 'Identity is the control plane Zero Trust is built on.' },
      { slug: 'cloud-security-engineer', reason: 'Cloud IAM is this role with a different console.' },
      { slug: 'security-architect', reason: 'Identity design is one of the strongest architecture foundations.' },
    ],
    certs: [
      { title: 'Microsoft SC-900', slug: 'sc-900', vendorSlug: 'microsoft', stage: 'Foundation', reason: 'Identity and security fundamentals in the Microsoft world.' },
      { title: 'CompTIA Security+', slug: 'security-plus', vendorSlug: 'comptia', stage: 'Foundation', reason: 'Vendor-neutral security baseline.' },
      { title: 'Microsoft AZ-104', slug: 'az-104', vendorSlug: 'microsoft', stage: 'Core', reason: 'Covers Entra ID and hybrid identity in practice.' },
      { title: 'ISC2 CISSP', slug: 'cissp', vendorSlug: 'isc2', stage: 'Advanced', reason: 'For the senior and architecture-facing end of the role.' },
    ],
    seoTitle: 'Identity Engineer — Who Gets to Reach What | CertBlueprint',
    seoDescription: 'Directories, MFA, conditional access and privileged accounts: what identity engineers do and why Active Directory experience converts directly.',
  },

  {
    slug: 'zero-trust-engineer',
    shortLabel: 'Verify everything, segment everything',
    subdomains: ['zero-trust', 'identity-security', 'network-security'],
    entry: 'senior',
    activities: [
      'Map what actually talks to what today, before deciding what should be allowed',
      'Design segmentation so a compromise in one place cannot become a compromise everywhere',
      'Tie network access to verified identity and device health rather than to a cable',
      'Roll out access control in stages without breaking the business at each one',
      'Replace flat VPN access with per-application access',
      'Prove the new controls work, and keep proving it',
    ],
    technologies: ['cisco-ise', 'forescout', 'zscaler', 'palo-alto', 'entra-id', 'okta', 'vlans', 'fortigate'],
    concepts: ['Zero Trust architecture', 'Microsegmentation', 'Continuous verification', 'Device posture', 'Least privilege access', 'Policy enforcement points'],
    environments: ['Large enterprises', 'Government and defence', 'Healthcare', 'Financial services', 'Organisations post-breach'],
    enjoyIf: [
      'You like problems that are equal parts network, identity and politics',
      'You enjoy staged, careful rollouts more than big-bang changes',
      'You want to design the model, not just operate the box',
    ],
    reality:
      'Zero Trust programmes fail organisationally far more often than technically. You will spend enormous effort on inventory, on exceptions, and on people who insist their system must stay flat. It is a senior role built on networking plus identity experience.',
    related: ['network-security-engineer', 'identity-engineer', 'security-architect', 'cloud-security-engineer'],
    adjacent: [
      { slug: 'security-architect', reason: 'The natural progression once you are designing the whole model.' },
      { slug: 'network-security-engineer', reason: 'The hands-on foundation this is built from.' },
      { slug: 'identity-engineer', reason: 'The other half of the same control plane.' },
    ],
    certs: [
      { title: 'CompTIA Security+', slug: 'security-plus', vendorSlug: 'comptia', stage: 'Foundation', reason: 'Vocabulary and fundamentals.' },
      { title: 'Cisco CCNP Security', slug: 'ccnp-security', vendorSlug: 'cisco', stage: 'Core', reason: 'ISE, secure access and segmentation at depth.' },
      { title: 'ISC2 CISSP', slug: 'cissp', vendorSlug: 'isc2', stage: 'Advanced', reason: 'The architecture-facing credential for programme-level work.' },
    ],
    seoTitle: 'Zero Trust Engineer — Segmentation, Identity and Enforcement | CertBlueprint',
    seoDescription: 'What Zero Trust engineers actually build, why it is a networking-plus-identity role, and how NAC experience converts.',
  },

  {
    slug: 'cloud-security-engineer',
    shortLabel: 'Identity-first security without a perimeter',
    subdomains: ['cloud-security', 'cloud-security-domain', 'security-engineering', 'devsecops'],
    entry: 'second-job',
    activities: [
      'Review cloud permission policies and find the ones that are far wider than anyone realised',
      'Build guardrails that prevent an insecure configuration from being deployed at all',
      'Investigate what an exposed access key actually reached',
      'Design network and identity boundaries between accounts, subscriptions and workloads',
      'Get meaningful logging out of cloud services and into somewhere you can query it',
      'Automate compliance checks so the answer is current rather than quarterly',
    ],
    technologies: ['aws', 'azure', 'terraform', 'entra-id', 'python', 'sentinel-elastic', 'kubernetes', 'git'],
    concepts: ['Shared responsibility model', 'Cloud IAM and policy evaluation', 'Guardrails and policy as code', 'Workload identity', 'Cloud posture management', 'Blast radius'],
    environments: ['Cloud-native companies', 'Enterprises migrating', 'Fintech and regulated industries', 'Consultancies'],
    enjoyIf: [
      'You like security that is expressed as code rather than as a box on a rack',
      'You enjoy permission models detailed enough that they need careful reading',
      'You want to prevent misconfiguration rather than discover it later',
      'You are comfortable that the perimeter is now an identity, not a wall',
    ],
    reality:
      'Cloud moves faster than security review can, and you will be perpetually catching up with what teams already deployed. Multi-cloud means learning the same concepts three times in three vocabularies. Requires real cloud experience first.',
    related: ['cloud-engineer', 'security-engineer', 'devsecops-engineer', 'identity-engineer', 'cloud-architect'],
    adjacent: [
      { slug: 'devsecops-engineer', reason: 'Pushing the same controls further left, into the pipeline.' },
      { slug: 'security-architect', reason: 'The design-level destination.' },
      { slug: 'identity-engineer', reason: 'Cloud security is mostly identity work wearing a cloud badge.' },
      { slug: 'detection-engineer', reason: 'You already know what the cloud logs mean; writing the detections against them is the next step.' },
    ],
    certs: [
      { title: 'AWS Cloud Practitioner', slug: 'aws-cloud-practitioner', vendorSlug: 'aws', stage: 'Foundation', reason: 'Cheap, fast orientation in the platform vocabulary.' },
      { title: 'CompTIA Security+', slug: 'security-plus', vendorSlug: 'comptia', stage: 'Foundation', reason: 'The security baseline.' },
      { title: 'AWS Solutions Architect Associate', slug: 'aws-saa', vendorSlug: 'aws', stage: 'Core', reason: 'You must understand the architecture to secure it.' },
      { title: 'Microsoft SC-900', slug: 'sc-900', vendorSlug: 'microsoft', stage: 'Foundation', reason: 'The Azure-side identity and security fundamentals.' },
      { title: 'Microsoft AZ-104', slug: 'az-104', vendorSlug: 'microsoft', stage: 'Core', reason: 'Practical Azure administration under the security work.' },
    ],
    seoTitle: 'Cloud Security Engineer — Securing What Has No Perimeter | CertBlueprint',
    seoDescription: 'Cloud IAM, guardrails, policy as code and posture management: what cloud security engineers do and the AWS/Azure certification path.',
  },

  {
    slug: 'devsecops-engineer',
    shortLabel: 'Security automated into delivery',
    subdomains: ['devsecops', 'cloud-security', 'infrastructure-as-code'],
    entry: 'senior',
    activities: [
      'Build security scanning into the build pipeline, at a noise level teams will tolerate',
      'Write policy as code that blocks an unsafe deployment before it exists',
      'Manage secrets so credentials stop living in repositories',
      'Automate evidence collection so audits stop being a two-week project',
      'Work with developers on making the secure path also the easy path',
    ],
    technologies: ['git', 'terraform', 'kubernetes', 'docker', 'python', 'aws', 'azure'],
    concepts: ['Shift-left security', 'Policy as code', 'Secrets management', 'Supply chain security', 'Continuous compliance'],
    environments: ['Product engineering organisations', 'Cloud-native companies', 'Regulated technology firms'],
    enjoyIf: [
      'You like removing a decision rather than reviewing it every time',
      'You enjoy working across security, development and operations at once',
      'You would rather build the guardrail than police the road',
    ],
    reality:
      'This role sits between three teams and is owned by none of them. It requires credibility in both development and security, which is why it is a third job rather than a first or second one.',
    related: ['devops-engineer', 'cloud-security-engineer', 'application-security-engineer', 'platform-engineer'],
    adjacent: [
      { slug: 'cloud-security-engineer', reason: 'The infrastructure-side sibling of the same work.' },
      { slug: 'platform-engineer', reason: 'If building the paved road interests you more than the checks on it.' },
      { slug: 'detection-engineer', reason: 'Detection-as-code is this job pointed at the SIEM: same pipelines, tests and version control.' },
    ],
    certs: [
      { title: 'CompTIA Security+', slug: 'security-plus', vendorSlug: 'comptia', stage: 'Foundation', reason: 'Security fundamentals.' },
      { title: 'AWS Developer Associate', slug: 'aws-developer-associate', vendorSlug: 'aws', stage: 'Core', reason: 'The build-and-deploy side of cloud, properly.' },
      { title: 'AWS Solutions Architect Associate', slug: 'aws-saa', vendorSlug: 'aws', stage: 'Core', reason: 'The architecture context around the pipeline.' },
    ],
    seoTitle: 'DevSecOps Engineer — Security in the Pipeline | CertBlueprint',
    seoDescription: 'Policy as code, pipeline scanning and secrets management: what DevSecOps engineers do and why it is a third-job role.',
  },

  {
    slug: 'vulnerability-analyst',
    shortLabel: 'Finding weaknesses and driving the fix',
    subdomains: ['vulnerability-management'],
    entry: 'first-job',
    activities: [
      'Run scanning across the estate and keep the asset picture honest',
      'Separate the thousand findings that do not matter from the ten that do',
      'Work out real exposure — is it reachable, is it exploited in the wild, what does it protect',
      'Chase remediation across teams who all have other priorities',
      'Report trends that show whether the organisation is getting better or worse',
    ],
    technologies: ['vuln-scanners', 'nmap', 'splunk', 'windows-server', 'linux', 'sql'],
    concepts: ['CVSS and risk scoring', 'Exploitability versus severity', 'Asset inventory', 'Patch cycles', 'Compensating controls'],
    environments: ['Enterprise security teams', 'Managed security providers', 'Regulated industries', 'Government'],
    enjoyIf: [
      'You like turning an overwhelming list into a defensible priority order',
      'You are comfortable persuading other teams to do work they did not plan',
      'You want a security role that is genuinely reachable early',
    ],
    reality:
      'A great deal of the job is chasing people. The findings list never reaches zero, and you have to be at peace with that. It can become repetitive if you do not push toward engineering or analysis.',
    related: ['security-engineer', 'penetration-tester', 'systems-engineer', 'grc-analyst'],
    adjacent: [
      { slug: 'security-engineer', reason: 'Moving from reporting the gap to closing it systemically.' },
      { slug: 'penetration-tester', reason: 'If proving exploitability is the part you enjoy.' },
    ],
    certs: [
      { title: 'CompTIA Security+', slug: 'security-plus', vendorSlug: 'comptia', stage: 'Start here', reason: 'The standard entry credential.' },
      { title: 'CompTIA CySA+', slug: 'cysa-plus', vendorSlug: 'comptia', stage: 'Core', reason: 'Covers vulnerability management explicitly.' },
    ],
    seoTitle: 'Vulnerability Management Analyst — Prioritising the Fix | CertBlueprint',
    seoDescription: 'Scanning, prioritisation and remediation chasing: an honest look at vulnerability management as a security entry point.',
  },

  {
    slug: 'grc-analyst',
    shortLabel: 'Governance, risk and evidence',
    subdomains: ['grc'],
    entry: 'first-job',
    activities: [
      'Map what a regulation requires onto what the organisation actually does',
      'Collect and test evidence that a control is operating, not just documented',
      'Assess a proposed system or vendor for risk before it is adopted',
      'Write policy that engineers can follow without hating it',
      'Prepare for audits and translate between auditors and engineers',
    ],
    technologies: ['bi-tools', 'sql', 'splunk', 'entra-id', 'vuln-scanners'],
    concepts: ['Risk assessment', 'Control frameworks', 'Audit evidence', 'Third-party risk', 'Policy and standards', 'Compliance versus security'],
    environments: ['Regulated industries', 'Government contractors', 'Large enterprises', 'Consultancies'],
    enjoyIf: [
      'You like written precision and can tell a real answer from a plausible one',
      'You enjoy structure, and building it where none existed',
      'You are comfortable working through people rather than through systems',
    ],
    reality:
      'It is document-heavy, and you will meet organisations that want the certificate rather than the security. Career growth depends on staying technically literate — GRC people who cannot talk to engineers stall.',
    related: ['security-architect', 'vulnerability-analyst', 'identity-engineer', 'data-analyst'],
    adjacent: [
      { slug: 'security-architect', reason: 'If you want to shape the controls rather than assess them.' },
      { slug: 'identity-engineer', reason: 'Access reviews are the technical end of governance.' },
    ],
    certs: [
      { title: 'CompTIA Security+', slug: 'security-plus', vendorSlug: 'comptia', stage: 'Start here', reason: 'Technical vocabulary — non-negotiable for credibility.' },
      { title: 'ISACA CISM', slug: 'cism', vendorSlug: 'isaca', stage: 'Advanced', reason: 'The management-side credential this track leads toward.' },
      { title: 'ISC2 CISSP', slug: 'cissp', vendorSlug: 'isc2', stage: 'Advanced', reason: 'Broad security knowledge for senior governance roles.' },
      { title: 'ITIL 4 Foundation', slug: 'itil-4-foundation', vendorSlug: 'peoplecert', stage: 'Adjacent', reason: 'Useful where governance and service management meet.' },
    ],
    seoTitle: 'GRC Analyst — Risk, Controls and Evidence | CertBlueprint',
    seoDescription: 'What governance, risk and compliance analysts actually do, why technical literacy matters, and the Security+ → CISM path.',
  },

  {
    slug: 'ot-security-engineer',
    shortLabel: 'Security where downtime is dangerous',
    subdomains: ['ot-security', 'network-security'],
    entry: 'senior',
    activities: [
      'Build an inventory of control-system devices that were never designed to be inventoried',
      'Segment operational networks from corporate ones, and from each other',
      'Monitor traffic passively, because active scanning can stop a production line',
      'Work with engineers whose priority is safety and uptime, not confidentiality',
      'Plan security changes around maintenance windows measured in months',
    ],
    technologies: ['ics-scada', 'forescout', 'fortigate', 'suricata-zeek', 'wireshark', 'vlans'],
    concepts: ['Purdue model', 'Safety versus security', 'Passive monitoring', 'Legacy protocol risk', 'Air gaps and why they rarely exist'],
    environments: ['Manufacturing', 'Energy and utilities', 'Water treatment', 'Transport and rail', 'Oil and gas'],
    enjoyIf: [
      'You like constraints that make the easy answer unavailable',
      'You are interested in where digital systems meet physical consequences',
      'You enjoy working with people from a completely different engineering tradition',
    ],
    reality:
      'Equipment can be thirty years old and unpatchable by design. Site work is common, in industrial environments with real safety requirements. It needs both networking and security experience first.',
    related: ['network-security-engineer', 'zero-trust-engineer', 'security-architect', 'field-engineer'],
    adjacent: [
      { slug: 'network-security-engineer', reason: 'The IT-side foundation of the same segmentation work.' },
      { slug: 'security-architect', reason: 'OT programmes are architecture problems as much as technical ones.' },
    ],
    certs: [
      { title: 'CompTIA Security+', slug: 'security-plus', vendorSlug: 'comptia', stage: 'Foundation', reason: 'The security baseline.' },
      { title: 'CompTIA Network+', slug: 'network-plus', vendorSlug: 'comptia', stage: 'Foundation', reason: 'Segmentation is a networking skill first.' },
      { title: 'Cisco CCNA', slug: 'ccna', vendorSlug: 'cisco', stage: 'Core', reason: 'Practical networking depth for industrial network design.' },
    ],
    certNote: 'The specialist OT credentials (GICSP, ISA/IEC 62443) sit outside CertBlueprint’s coverage today — the certs above get you to the point where they make sense.',
    seoTitle: 'OT / ICS Security Engineer — Security With Physical Consequences | CertBlueprint',
    seoDescription: 'Segmentation, passive monitoring and legacy protocols in industrial environments: what OT security engineers do and how networking experience converts.',
  },

  {
    slug: 'security-architect',
    shortLabel: 'Designing how it all fits together',
    subdomains: ['security-architecture', 'zero-trust', 'cloud-security', 'grc'],
    entry: 'senior',
    activities: [
      'Design the security model for a new platform, programme or acquisition',
      'Make trade-offs explicit: what this design does not protect against, and why that is acceptable',
      'Set standards and reference patterns other engineers build against',
      'Review proposals and turn "no" into a workable alternative',
      'Translate risk into terms executives can actually decide on',
      'Sequence a multi-year programme so each stage delivers something real',
    ],
    technologies: ['aws', 'azure', 'entra-id', 'palo-alto', 'cisco-ise', 'terraform', 'active-directory'],
    concepts: ['Threat modelling', 'Defence in depth', 'Zero Trust architecture', 'Risk appetite', 'Reference architecture', 'Security patterns'],
    environments: ['Large enterprises', 'Government and defence', 'Financial services', 'Consultancies', 'Cloud-native scale-ups'],
    enjoyIf: [
      'You enjoy the whole picture more than any single component',
      'You like reasoning about trade-offs where every option costs something',
      'You are willing to write things down and be argued with',
      'You want influence over how systems are built rather than how they are run',
    ],
    reality:
      'A great deal of this job is meetings, documents and persuasion. You will be responsible for outcomes you do not directly control, and you will watch good designs get compromised by budget. It is reached after eight to fifteen years in hands-on roles — never before.',
    related: ['network-security-engineer', 'cloud-security-engineer', 'zero-trust-engineer', 'identity-engineer', 'security-engineer', 'cloud-architect'],
    adjacent: [
      { slug: 'cloud-architect', reason: 'The same design discipline with a wider, less security-specific remit.' },
      { slug: 'zero-trust-engineer', reason: 'Often the programme an architect is actually designing.' },
      { slug: 'grc-analyst', reason: 'The governance side of the same decisions.' },
    ],
    certs: [
      { title: 'ISC2 CISSP', slug: 'cissp', vendorSlug: 'isc2', stage: 'Core', reason: 'The default expectation for architecture roles, and it requires real experience.' },
      { title: 'ISACA CISM', slug: 'cism', vendorSlug: 'isaca', stage: 'Advanced', reason: 'For the governance and programme-leadership end.' },
      { title: 'AWS Solutions Architect Associate', slug: 'aws-saa', vendorSlug: 'aws', stage: 'Adjacent', reason: 'Architecture credibility in cloud environments.' },
      { title: 'Cisco CCDE', slug: 'ccde', vendorSlug: 'cisco', stage: 'Adjacent', reason: 'For architects whose centre of gravity stays in network design.' },
    ],
    seoTitle: 'Security Architect — Designing the Whole Defence | CertBlueprint',
    seoDescription: 'Threat modelling, reference architecture and trade-off decisions: what security architects do, and the years of hands-on work that come first.',
  },
];
