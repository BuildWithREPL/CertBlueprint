import type { RoleContent } from '../../types';

export const SOFTWARE_DATA_OPS_ROLES: RoleContent[] = [
  {
    slug: 'software-developer',
    shortLabel: 'Designing and writing software',
    subdomains: ['software-development'],
    entry: 'first-job',
    activities: [
      'Turn a vague requirement into something precise enough to build',
      'Write, test and review code, and read far more of it than you write',
      'Debug behaviour that only happens in production',
      'Design how components talk to each other before writing any of them',
      'Refactor something that works but is becoming impossible to change',
    ],
    technologies: ['python', 'git', 'sql', 'docker', 'rest-apis', 'linux', 'aws'],
    concepts: ['Data structures', 'Version control and code review', 'Testing', 'APIs and interfaces', 'Technical debt', 'Design patterns'],
    environments: ['Software companies', 'In-house development teams', 'Startups', 'Agencies and consultancies', 'Remote-friendly across the board'],
    enjoyIf: [
      'You like making something that did not exist before',
      'You can stay with a problem for hours without losing interest',
      'You enjoy the moment where a confusing system suddenly makes sense',
    ],
    reality:
      'The junior market is currently the tightest in IT — listings skew senior and portfolios matter more than certifications. Expect long stretches of debugging and reading other people’s code rather than green-field building.',
    related: ['application-security-engineer', 'devops-engineer', 'data-engineer', 'platform-engineer'],
    adjacent: [
      { slug: 'devops-engineer', reason: 'If the deployment and infrastructure side pulls at you.' },
      { slug: 'application-security-engineer', reason: 'If you find yourself reading code adversarially.' },
      { slug: 'data-engineer', reason: 'If the data side is more interesting than the interface.' },
    ],
    certs: [
      { title: 'AWS Developer Associate', slug: 'aws-developer-associate', vendorSlug: 'aws', stage: 'Adjacent', reason: 'Useful once you are building cloud-hosted applications.' },
      { title: 'Google IT Automation with Python', slug: 'google-it-automation', vendorSlug: 'google', stage: 'Skill building', reason: 'A structured start if you are learning Python from scratch.' },
    ],
    certNote:
      'Certifications matter less here than in any other IT field. A portfolio of working code that someone other than you can run is the credential.',
    pathSlug: 'software-developer',
    seoTitle: 'Software Developer — Building What People Use | CertBlueprint',
    seoDescription: 'What software developers do day to day, the honest state of the junior market, and why a portfolio beats certifications here.',
  },

  {
    slug: 'data-engineer',
    shortLabel: 'Pipelines that do not silently break',
    subdomains: ['data-engineering', 'ai-ml'],
    entry: 'second-job',
    activities: [
      'Build pipelines that pull, reshape and load data on a schedule',
      'Find out why yesterday’s numbers do not match today’s',
      'Model data so the same question always gives the same answer',
      'Build monitoring so a broken pipeline is noticed before a report is wrong',
      'Make a query that took forty minutes take forty seconds',
    ],
    technologies: ['python', 'sql', 'git', 'aws', 'azure', 'terraform', 'docker'],
    concepts: ['ETL and ELT', 'Data modelling', 'Schema evolution', 'Data quality', 'Batch versus streaming', 'Idempotency'],
    environments: ['Technology companies', 'Retail and e-commerce', 'Financial services', 'Healthcare analytics', 'Anywhere with a data team'],
    enjoyIf: [
      'You like building the plumbing rather than the dashboard',
      'You are bothered by numbers that do not reconcile',
      'You enjoy work where correctness is checkable',
    ],
    reality:
      'A lot of the job is cleaning up data that was produced carelessly upstream, and you rarely get to fix the source. Pipelines break quietly, which means the failures find you late.',
    related: ['data-analyst', 'database-administrator', 'devops-engineer', 'detection-engineer'],
    adjacent: [
      { slug: 'detection-engineer', reason: 'A SIEM pipeline is a data pipeline with adversaries — the skills transfer directly.' },
      { slug: 'devops-engineer', reason: 'Same automation instincts, different payload.' },
      { slug: 'data-analyst', reason: 'The consumer side of what you build.' },
      { slug: 'database-administrator', reason: 'When performance, recovery and integrity of the store itself is the part you would rather own.' },
    ],
    certs: [
      { title: 'Microsoft PL-300', slug: 'pl-300', vendorSlug: 'microsoft', stage: 'Adjacent', reason: 'Useful for understanding what your consumers need.' },
      { title: 'AWS Solutions Architect Associate', slug: 'aws-saa', vendorSlug: 'aws', stage: 'Core', reason: 'Most modern data platforms are cloud-native.' },
      { title: 'Google Data Analytics', slug: 'google-data-analytics', vendorSlug: 'google', stage: 'Foundation', reason: 'A structured entry if you are coming from outside data.' },
    ],
    seoTitle: 'Data Engineer — The Plumbing Behind the Dashboard | CertBlueprint',
    seoDescription: 'Pipelines, modelling and data quality: what data engineers build and how the skills overlap with detection engineering and DevOps.',
  },

  {
    slug: 'data-analyst',
    shortLabel: 'Questions, queries and clear answers',
    subdomains: ['data-analytics'],
    entry: 'first-job',
    activities: [
      'Work out what someone is actually asking before answering it',
      'Query and clean data that was never designed to be analysed',
      'Find the pattern, then check whether it is real or coincidence',
      'Build a dashboard people will still trust in six months',
      'Explain a finding plainly, including what it does not prove',
    ],
    technologies: ['sql', 'bi-tools', 'python'],
    concepts: ['Data cleaning', 'Correlation versus causation', 'Statistical significance', 'Visualisation choices', 'Metric definitions'],
    environments: ['Almost every industry', 'Marketing and operations teams', 'Healthcare', 'Finance', 'Highly remote-friendly'],
    enjoyIf: [
      'You like finding the story in a pile of numbers',
      'You enjoy questioning whether the data actually supports the claim',
      'You want an analytical role that does not require heavy programming',
    ],
    reality:
      'You will be asked for the chart that supports a conclusion already reached. Data is usually messier than anyone admits, and requests arrive vague. Title inflation means "analyst" can mean very different jobs.',
    related: ['data-engineer', 'grc-analyst', 'database-administrator'],
    adjacent: [
      { slug: 'data-engineer', reason: 'If you keep wishing the data arrived in better shape.' },
      { slug: 'soc-analyst', reason: 'Security analysis is investigative data work with adversaries in it.' },
      { slug: 'database-administrator', reason: 'If the SQL and the data itself hold your attention more than the reporting on top of it.' },
    ],
    certs: [
      { title: 'Google Data Analytics', slug: 'google-data-analytics', vendorSlug: 'google', stage: 'Start here', reason: 'A genuine structured start for people entering from outside IT.' },
      { title: 'Microsoft PL-300', slug: 'pl-300', vendorSlug: 'microsoft', stage: 'Core', reason: 'Power BI is the tool most job listings actually name.' },
      { title: 'Google Business Intelligence', slug: 'google-business-intelligence', vendorSlug: 'google', stage: 'Level up', reason: 'The step beyond basic analysis.' },
    ],
    pathSlug: 'data-analyst',
    seoTitle: 'Data Analyst — From Messy Data to a Real Answer | CertBlueprint',
    seoDescription: 'Querying, cleaning, and communicating findings: what data analysts do and the Google Data Analytics → PL-300 path.',
  },

  {
    slug: 'help-desk-technician',
    shortLabel: 'The front door to IT',
    subdomains: ['help-desk'],
    entry: 'first-job',
    activities: [
      'Take a vague description of a problem and turn it into something diagnosable',
      'Reproduce the issue, isolate the cause and fix or escalate it',
      'Set up accounts, machines and access for new people',
      'Work through password, printing, connectivity and application problems',
      'Document what you did so the next person does not start from zero',
    ],
    technologies: ['windows-server', 'active-directory', 'intune-sccm', 'dns-dhcp', 'linux'],
    concepts: ['Structured troubleshooting', 'Ticketing and SLAs', 'Escalation', 'Remote support', 'Basic networking'],
    environments: ['Every organisation with employees', 'Managed service providers', 'Schools and universities', 'Retail and healthcare'],
    enjoyIf: [
      'You like solving something and seeing the relief immediately',
      'You are patient with people who are frustrated and not technical',
      'You want to see the entire IT estate before deciding where to specialise',
    ],
    reality:
      'A lot of it is repetitive, and metrics pressure is real. It is sometimes treated as low-status by people who forget they started there. Level 1 phone work is also the most exposed to automation — treat it as a launch pad, not a destination.',
    related: ['systems-administrator', 'noc-technician', 'field-engineer', 'soc-analyst'],
    adjacent: [
      { slug: 'systems-administrator', reason: 'The standard next step once you know the environment.' },
      { slug: 'noc-technician', reason: 'If the network problems are the ones you enjoy.' },
      { slug: 'soc-analyst', reason: 'A realistic route into security within two years.' },
    ],
    certs: [
      { title: 'CompTIA A+', slug: 'a-plus', vendorSlug: 'comptia', stage: 'Start here', reason: 'The recognised entry credential for support roles.' },
      { title: 'Google IT Support', slug: 'google-it-support', vendorSlug: 'google', stage: 'Alternative', reason: 'A gentler, cheaper start if A+ feels like a big first step.' },
      { title: 'CompTIA Network+', slug: 'network-plus', vendorSlug: 'comptia', stage: 'Level up', reason: 'What moves you out of level 1 fastest.' },
      { title: 'Microsoft MS-900', slug: 'ms-900', vendorSlug: 'microsoft', stage: 'Adjacent', reason: 'Most support work touches Microsoft 365 constantly.' },
      { title: 'Cisco CCST IT Support', slug: 'ccst-it-support', vendorSlug: 'cisco', stage: 'Alternative', reason: 'Cisco’s lower-cost entry credential, for when A+ exam fees are the barrier.' },
    ],
    pathSlug: 'help-desk-technician',
    seoTitle: 'Help Desk Technician — The Real Front Door to IT | CertBlueprint',
    seoDescription: 'What help desk work is actually like, why it remains the most reliable way into IT, and the A+ → Network+ path out of level 1.',
  },

  {
    slug: 'noc-technician',
    shortLabel: 'The 24/7 network watch floor',
    subdomains: ['noc', 'enterprise-networking'],
    entry: 'first-job',
    activities: [
      'Monitor dashboards and alarms across every site and circuit',
      'Triage an alarm: is it real, is it spreading, who needs to know',
      'Run first-line diagnostics and restore service where you can',
      'Open and drive carrier tickets when the fault is outside your network',
      'Keep a clear written record while the incident is still moving',
    ],
    technologies: ['monitoring-stack', 'cisco-ios', 'netflow', 'wireshark', 'dns-dhcp'],
    concepts: ['Alarm correlation', 'Severity and escalation', 'Circuit troubleshooting', 'Change windows', 'Runbooks'],
    environments: ['Service providers', 'Managed service providers', 'Large enterprises', 'Government', '24/7 shift operations'],
    enjoyIf: [
      'You stay steady when several things go wrong at once',
      'You like seeing the whole network rather than one corner of it',
      'You want to learn networking on live production systems',
    ],
    reality:
      'It is genuinely 24/7 — nights, weekends and holidays are part of the rota. Alarm fatigue sets in, and much of the work is following a runbook rather than solving something new. It is an excellent launch pad if you push out of it deliberately.',
    related: ['network-administrator', 'network-engineer', 'soc-analyst', 'help-desk-technician'],
    adjacent: [
      { slug: 'network-engineer', reason: 'The engineering step once you understand how things break.' },
      { slug: 'soc-analyst', reason: 'The same watch-floor discipline, aimed at adversaries.' },
      { slug: 'site-reliability-engineer', reason: 'The long-term version of operations done as engineering.' },
    ],
    certs: [
      { title: 'CompTIA Network+', slug: 'network-plus', vendorSlug: 'comptia', stage: 'Start here', reason: 'The entry credential for network operations.' },
      { title: 'Cisco CCST Networking', slug: 'ccst-networking', vendorSlug: 'cisco', stage: 'Optional first rung', reason: 'A cheaper checkpoint if you are new to all of this.' },
      { title: 'Cisco CCNA', slug: 'ccna', vendorSlug: 'cisco', stage: 'Level up', reason: 'The credential that gets you off the watch floor.' },
    ],
    pathSlug: 'network-administrator',
    seoTitle: 'NOC Technician — Watching the Whole Network | CertBlueprint',
    seoDescription: 'Alarm triage, first-line diagnostics and carrier tickets: what NOC work is really like, and why it launches networking careers.',
  },

  {
    slug: 'field-engineer',
    shortLabel: 'On-site, hands on the hardware',
    subdomains: ['field-engineering', 'wireless'],
    entry: 'first-job',
    activities: [
      'Install, terminate and test cabling, then label it properly',
      'Rack, cable and commission switches, radios and appliances',
      'Diagnose faults that could be physical, optical or configuration',
      'Carry out site surveys and document what is actually there',
      'Respond to outages that need someone physically present',
    ],
    technologies: ['wireless-lan', 'cisco-ios', 'monitoring-stack', 'ics-scada'],
    concepts: ['Structured cabling standards', 'Fibre and copper testing', 'Power and grounding', 'Site documentation', 'Safety practice'],
    environments: ['Telecom and ISPs', 'Construction and building fit-out', 'Manufacturing plants', 'Campuses and hospitals', 'Tower and rooftop work'],
    enjoyIf: [
      'You would rather be moving than at a desk',
      'You like finishing a job and being able to see it',
      'You are comfortable working in awkward physical conditions',
    ],
    reality:
      'It is physically demanding, weather-dependent and involves travel. Outage call-outs happen in storms, which is exactly when it is least pleasant. The ceiling is lower unless you move toward engineering or design.',
    related: ['wireless-engineer', 'data-center-engineer', 'network-administrator', 'help-desk-technician'],
    adjacent: [
      { slug: 'network-administrator', reason: 'Moving from the physical layer to the logical one.' },
      { slug: 'wireless-engineer', reason: 'If radio behaviour is what you find interesting.' },
      { slug: 'data-center-engineer', reason: 'The same hands-on work at much greater density.' },
    ],
    certs: [
      { title: 'CompTIA A+', slug: 'a-plus', vendorSlug: 'comptia', stage: 'Start here', reason: 'Hardware fundamentals, and it is widely recognised.' },
      { title: 'CompTIA Network+', slug: 'network-plus', vendorSlug: 'comptia', stage: 'Level up', reason: 'What lets you move from installing to engineering.' },
      { title: 'Cisco Certified Field Technician', slug: 'ccft', vendorSlug: 'cisco', stage: 'Alternative', reason: 'Cisco’s field technician credential — short, and aimed squarely at hands-on install and break/fix work.' },
    ],
    pathSlug: 'field-telecom-technician',
    seoTitle: 'Field / Infrastructure Engineer — Hands on the Hardware | CertBlueprint',
    seoDescription: 'Cabling, racking, site surveys and call-outs: what field engineering really involves, including the honest physical downsides.',
  },
];
