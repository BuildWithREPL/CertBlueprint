import type { RoleContent } from '../../types';

/**
 * Networking roles.
 *
 * Note how many of these carry non-trivial `dom.cybersecurity` weight. That is
 * not padding — it is the honest shape of the work, and it is what allows a user
 * whose answers straddle both worlds to be matched to the intersection role
 * rather than being pushed into one bucket or the other.
 */
export const NETWORKING_ROLES: RoleContent[] = [
  {
    slug: 'network-engineer',
    shortLabel: 'Routing, switching, and the path traffic takes',
    subdomains: ['enterprise-networking', 'data-center-networking', 'wireless', 'cloud-networking'],
    entry: 'second-job',
    activities: [
      'Configure routers and switches, and design the addressing scheme behind them',
      'Trace a connectivity problem hop by hop until you find the exact device where traffic stops',
      'Run and read packet captures when the logs are not enough',
      'Build VLANs and routing policies so the right systems can reach each other and the wrong ones cannot',
      'Plan and execute change windows for upgrades, without taking the business offline',
      'Investigate why an application is slow when the network "looks fine"',
      'Document topologies so the next person can follow what you built',
    ],
    technologies: ['cisco-ios', 'ospf', 'bgp', 'vlans', 'wireshark', 'junos', 'sd-wan', 'dns-dhcp', 'monitoring-stack'],
    concepts: [
      'TCP/IP and subnetting',
      'Routing versus switching',
      'Spanning tree and redundancy',
      'North-south and east-west traffic',
      'Latency, jitter and packet loss',
      'Quality of Service',
      'Network convergence',
    ],
    environments: [
      'Enterprise campuses and multi-site organisations',
      'Data centres',
      'Managed service providers',
      'Government, healthcare and financial services',
      'Anywhere with more than a few hundred users',
    ],
    enjoyIf: [
      'You want to know why something works, not only that it does',
      'You enjoy narrowing a problem down until only one possible cause is left',
      'You like holding a whole system in your head at once',
      'You find it satisfying when a change you planned lands with nobody noticing',
      'You would rather read the evidence than guess',
    ],
    reality:
      'Change windows happen at 2am because that is when nobody is using the network. When something breaks, a lot of people notice at once, and some of them will assume it is your fault before anyone has looked. Progress without certifications is slow in this field.',
    related: ['network-security-engineer', 'network-automation-engineer', 'cloud-network-engineer', 'service-provider-network-engineer', 'noc-technician'],
    adjacent: [
      { slug: 'network-security-engineer', reason: 'You already own the paths; securing them is the same job with policy added.' },
      { slug: 'network-automation-engineer', reason: 'Add Python and Ansible and you configure a thousand devices instead of one.' },
      { slug: 'cloud-network-engineer', reason: 'The same routing problems, expressed as API calls.' },
      { slug: 'service-provider-network-engineer', reason: 'Same protocols, far larger scale, and BGP becomes the whole job.' },
      { slug: 'security-architect', reason: 'A long-term destination for people who like designing the whole shape.' },
    ],
    certs: [
      { title: 'CompTIA Network+', slug: 'network-plus', vendorSlug: 'comptia', stage: 'Foundation', reason: 'Vendor-neutral proof you understand how networks actually work.' },
      { title: 'Cisco CCNA', slug: 'ccna', vendorSlug: 'cisco', stage: 'Core', reason: 'The recognised hands-on networking credential — this is the one that opens doors.' },
      { title: 'Cisco CCNP Enterprise', slug: 'ccnp-enterprise', vendorSlug: 'cisco', stage: 'Advanced', reason: 'Depth in routing, switching and enterprise design once you are working in the field.' },
      { title: 'Juniper JNCIA-Junos', slug: 'jncia-junos', vendorSlug: 'juniper', stage: 'Alternative', reason: 'If your employer runs Juniper rather than Cisco.' },
      { title: 'Cisco CCIE Enterprise Infrastructure', slug: 'ccie-enterprise-infrastructure', vendorSlug: 'cisco', stage: 'Advanced', reason: 'The expert-level lab — worth it once you already work at senior CCNP level and your market values the number.' },
    ],
    pathSlug: 'network-administrator',
    seoTitle: 'Network Engineer — What the Job Actually Involves | CertBlueprint',
    seoDescription:
      'What network engineers really do day to day, the technologies you will touch, the concepts you will learn, and the certification path that follows — CCNA and beyond.',
  },

  {
    slug: 'network-administrator',
    shortLabel: 'Operating the network day to day',
    subdomains: ['enterprise-networking', 'noc', 'technical-operations'],
    entry: 'first-job',
    activities: [
      'Work the overnight alerts and decide what actually needs attention',
      'Trace "the internet is slow in Building C" down to a single switch port',
      'Add VLANs, update firewall rules and reconfigure ports as teams move around',
      'Manage IP addressing, DHCP scopes and DNS records',
      'Replace failed hardware and coordinate vendor RMAs',
      'Keep the monitoring system telling the truth',
    ],
    technologies: ['cisco-ios', 'vlans', 'dns-dhcp', 'monitoring-stack', 'wireless-lan', 'wireshark'],
    concepts: ['Subnetting', 'VLANs and trunking', 'Basic routing', 'Change control', 'Escalation and severity'],
    environments: ['Mid-size businesses', 'Schools and universities', 'Hospitals', 'Managed service providers', 'NOC floors'],
    enjoyIf: [
      'You like closing a problem the same day you opened it',
      'You want a job where the feedback loop is immediate',
      'You do not mind being the person people come to when something is broken',
      'You would rather learn on live systems than in theory',
    ],
    reality:
      'This is often shift work, and networks do not respect office hours. Early on you will do a lot of repetitive triage, and the career ladder is slow unless you deliberately push into engineering, security or automation.',
    related: ['network-engineer', 'noc-technician', 'network-security-engineer', 'systems-administrator'],
    adjacent: [
      { slug: 'network-engineer', reason: 'The natural step up once you are designing rather than maintaining.' },
      { slug: 'network-security-engineer', reason: 'If the firewall and access-control work is what you find interesting.' },
      { slug: 'network-automation-engineer', reason: 'If you keep thinking "I should script this".' },
    ],
    certs: [
      { title: 'CompTIA Network+', slug: 'network-plus', vendorSlug: 'comptia', stage: 'Start here', reason: 'The entry signal employers recognise for network roles.' },
      { title: 'Cisco CCST Networking', slug: 'ccst-networking', vendorSlug: 'cisco', stage: 'Optional first rung', reason: 'A cheaper confidence checkpoint if you are starting from zero.' },
      { title: 'Cisco CCNA', slug: 'ccna', vendorSlug: 'cisco', stage: 'Level up', reason: 'What moves you from administering a network to engineering one.' },
    ],
    pathSlug: 'network-administrator',
    seoTitle: 'Network Administrator — Day-to-Day Reality and Path In | CertBlueprint',
    seoDescription:
      'What a network administrator actually does, why the NOC is a genuine launch pad into IT, and the certifications that move you forward — Network+, CCNA and beyond.',
  },

  {
    slug: 'service-provider-network-engineer',
    shortLabel: 'Carrier-scale routing and transport',
    subdomains: ['service-provider', 'data-center-networking'],
    entry: 'second-job',
    activities: [
      'Design and operate BGP peering with other networks and internet exchanges',
      'Build MPLS label-switched paths and per-customer L3VPNs that must never leak into each other',
      'Turn up new customer circuits and troubleshoot the ones that came up wrong',
      'Investigate why traffic from one region is taking a path halfway around the world',
      'Plan capacity for links measured in hundreds of gigabits',
      'Handle transport faults — optical, microwave, fibre cuts — with a clock running',
    ],
    technologies: ['bgp', 'mpls', 'junos', 'cisco-ios', 'netflow', 'wireshark'],
    concepts: [
      'BGP path selection and route policy',
      'MPLS and label switching',
      'Route reflectors and iBGP scaling',
      'Peering and transit economics',
      'Carrier-grade redundancy',
      'Optical transport',
    ],
    environments: ['Internet service providers', 'Telecom carriers', 'Content delivery networks', 'Internet exchanges', 'Large cloud providers'],
    enjoyIf: [
      'You want to understand how the internet itself decides where traffic goes',
      'You like problems where a single policy change affects millions of people',
      'You enjoy protocols deeply enough to argue about their edge cases',
      'You are comfortable with the fact that a mistake here is very visible',
    ],
    reality:
      'The blast radius is enormous and the maintenance windows are unforgiving. Fibre cuts happen at 3am and in bad weather. It is also a smaller job market than enterprise networking, concentrated around a limited number of employers.',
    related: ['network-engineer', 'cloud-network-engineer', 'data-center-engineer', 'network-automation-engineer'],
    adjacent: [
      { slug: 'network-engineer', reason: 'The enterprise side of the same protocol knowledge, with a wider job market.' },
      { slug: 'cloud-network-engineer', reason: 'Cloud hybrid connectivity is BGP — your existing skill, new platform.' },
      { slug: 'network-automation-engineer', reason: 'Carrier networks are too large to configure by hand; automation is the growth path.' },
    ],
    certs: [
      { title: 'Cisco CCNA', slug: 'ccna', vendorSlug: 'cisco', stage: 'Foundation', reason: 'You still need the fundamentals before carrier scale means anything.' },
      { title: 'Cisco CCNP Service Provider', slug: 'ccnp-service-provider', vendorSlug: 'cisco', stage: 'Core', reason: 'The specific track for BGP, MPLS and carrier architecture.' },
      { title: 'Juniper JNCIA-Junos', slug: 'jncia-junos', vendorSlug: 'juniper', stage: 'Vendor', reason: 'Juniper is heavily represented in provider networks.' },
      { title: 'Cisco CCIE Service Provider', slug: 'ccie-service-provider', vendorSlug: 'cisco', stage: 'Advanced', reason: 'The expert-level credential for people who make this their career.' },
    ],
    seoTitle: 'Service Provider Network Engineer — BGP, MPLS and Carrier Scale | CertBlueprint',
    seoDescription:
      'What service provider network engineers do, why BGP and MPLS define the role, the honest downsides of carrier-scale work, and the CCNP/CCIE Service Provider path.',
  },

  {
    slug: 'network-security-engineer',
    shortLabel: 'Firewalls, segmentation and access control',
    subdomains: ['network-security', 'enterprise-networking', 'security-engineering', 'zero-trust'],
    entry: 'second-job',
    activities: [
      'Configure and troubleshoot firewalls, and work out which rule is silently dropping traffic',
      'Analyse traffic to understand what is actually talking to what',
      'Build segmentation policies so a problem in one part of the network cannot spread',
      'Deploy and maintain VPNs and encrypted tunnels between sites and users',
      'Investigate suspicious connections — where they went, how much left, and whether it mattered',
      'Implement network access control so unknown devices do not simply get an address',
      'Apply Zero Trust controls: verify the device and the user, then allow the specific thing',
      'Inspect logs from firewalls, proxies and sensors',
      'Harden network devices themselves — management planes, credentials, protocols',
      'Configure intrusion detection and prevention, and tune out the noise',
      'Troubleshoot the connectivity problems your own security policy caused',
    ],
    technologies: ['fortigate', 'palo-alto', 'cisco-firepower', 'forescout', 'cisco-ise', 'wireshark', 'nmap', 'splunk', 'ipsec-tls-pki', 'vlans', 'bgp', 'ospf', 'suricata-zeek', 'zscaler'],
    concepts: [
      'Zero Trust',
      'Network segmentation and microsegmentation',
      'Least privilege',
      'Deep packet inspection',
      'Authentication and authorization',
      'Encryption in transit',
      'Network access control',
      'Intrusion detection and prevention',
      'East-west versus north-south traffic',
      'Defence in depth',
    ],
    environments: [
      'Enterprise networks',
      'Government and defence',
      'Healthcare',
      'Financial services',
      'Cloud environments',
      'Data centres',
      'Managed security service providers',
    ],
    enjoyIf: [
      'You enjoy figuring out why traffic is not flowing',
      'You like understanding exactly what systems are communicating, and why',
      'You enjoy troubleshooting complicated infrastructure that several teams touch',
      'You like enforcing technical rules through systems rather than through email',
      'You enjoy investigating network behaviour that does not look right',
      'You are satisfied by closing a gap rather than by cleaning up after it',
    ],
    reality:
      'You will spend real time being blamed for outages your policy correctly caused, and defending rules to people who want them removed. It is rarely a first job — the road in runs through networking or systems. On-call is common because firewalls sit in the path of everything.',
    related: ['network-engineer', 'security-engineer', 'cloud-security-engineer', 'zero-trust-engineer', 'security-architect', 'soc-analyst'],
    adjacent: [
      { slug: 'zero-trust-engineer', reason: 'Segmentation and NAC taken to their logical conclusion.' },
      { slug: 'cloud-security-engineer', reason: 'The same controls, rebuilt as identity and API policy in the cloud.' },
      { slug: 'security-architect', reason: 'The design-level destination once you have run enough of these systems.' },
      { slug: 'network-engineer', reason: 'Step sideways if you find the routing more interesting than the policy.' },
      { slug: 'ot-security-engineer', reason: 'The same segmentation problem, in factories and utilities.' },
    ],
    certs: [
      { title: 'CompTIA Network+', slug: 'network-plus', vendorSlug: 'comptia', stage: 'Foundation', reason: 'You cannot secure a network you do not understand.' },
      { title: 'CompTIA Security+', slug: 'security-plus', vendorSlug: 'comptia', stage: 'Foundation', reason: 'The baseline security credential, and a hiring filter in government work.' },
      { title: 'Cisco CCNA', slug: 'ccna', vendorSlug: 'cisco', stage: 'Core', reason: 'Hands-on networking depth — the strongest foundation for this role.' },
      { title: 'Cisco CCNP Security', slug: 'ccnp-security', vendorSlug: 'cisco', stage: 'Advanced', reason: 'Firewalls, VPN, ISE and secure access at professional depth.' },
      { title: 'Cisco CCIE Security', slug: 'ccie-security', vendorSlug: 'cisco', stage: 'Expert', reason: 'For people who make network security their whole career.' },
    ],
    certNote:
      'Vendor certifications (Fortinet NSE, Palo Alto PCNSE) matter a great deal here, but only for the vendor your employer actually runs. Get the platform-neutral foundation first.',
    seoTitle: 'Network Security Engineer — What the Job Really Is | CertBlueprint',
    seoDescription:
      'Firewalls, segmentation, NAC, VPN and traffic investigation: what network security engineers actually do all day, the technologies involved, and the honest certification path.',
  },

  {
    slug: 'network-automation-engineer',
    shortLabel: 'Networking, expressed as code',
    subdomains: ['network-automation', 'network-automation-domain', 'scripting'],
    entry: 'second-job',
    activities: [
      'Write scripts that pull the running configuration from every device and tell you what drifted',
      'Build templates so a new site is deployed identically to the last forty',
      'Test network changes in a virtual lab before they touch production',
      'Integrate network devices with ticketing, monitoring and source control through their APIs',
      'Turn a repetitive change request into a self-service pipeline',
      'Build the tooling that lets the rest of the team stop doing something by hand',
    ],
    technologies: ['python', 'ansible', 'git', 'rest-apis', 'cisco-ios', 'arista-eos', 'junos', 'terraform'],
    concepts: [
      'Infrastructure as code',
      'Idempotency',
      'Configuration drift',
      'Source control and code review',
      'Network APIs and structured data',
      'CI/CD applied to infrastructure',
    ],
    environments: ['Large enterprises', 'Data centres', 'Service providers', 'Cloud providers', 'Anywhere with too many devices to touch individually'],
    enjoyIf: [
      'You keep thinking "why am I doing this by hand?"',
      'You like building the tool more than performing the task',
      'You enjoy making something repeatable and then never worrying about it again',
      'You want networking depth without accepting networking’s manual work',
    ],
    reality:
      'You need real networking knowledge first — automating a network you do not understand produces outages at machine speed. You will also spend time convincing colleagues to give up the CLI habits they trust.',
    related: ['network-engineer', 'devops-engineer', 'platform-engineer', 'cloud-network-engineer'],
    adjacent: [
      { slug: 'devops-engineer', reason: 'The same instincts applied to applications and cloud infrastructure.' },
      { slug: 'cloud-network-engineer', reason: 'Cloud networking is automation-native by default.' },
      { slug: 'network-engineer', reason: 'The foundation this role is built on — worth deepening in parallel.' },
    ],
    certs: [
      { title: 'Cisco CCNA', slug: 'ccna', vendorSlug: 'cisco', stage: 'Foundation', reason: 'The networking knowledge that makes automation safe rather than dangerous.' },
      { title: 'Cisco CCNA Automation', slug: 'ccna-automation', vendorSlug: 'cisco', stage: 'Core', reason: 'Purpose-built for exactly this intersection.' },
      { title: 'Cisco CCNP Automation', slug: 'ccnp-automation', vendorSlug: 'cisco', stage: 'Advanced', reason: 'Professional-level network programmability.' },
      { title: 'Google IT Automation with Python', slug: 'google-it-automation', vendorSlug: 'google', stage: 'Skill building', reason: 'If you need the Python itself before the network application of it.' },
      { title: 'Cisco CCIE Automation', slug: 'ccie-automation', vendorSlug: 'cisco', stage: 'Advanced', reason: 'The expert-level lab, for engineers already automating Cisco networks with APIs and pipelines at work.' },
    ],
    seoTitle: 'Network Automation Engineer — Networking Meets Code | CertBlueprint',
    seoDescription:
      'What network automation engineers do, why Python and Ansible change the job, and the CCNA Automation / CCNP Automation path into this intersection role.',
  },

  {
    slug: 'cloud-network-engineer',
    shortLabel: 'Networking inside AWS and Azure',
    subdomains: ['cloud-networking', 'cloud-networking-domain', 'data-center-networking'],
    entry: 'second-job',
    activities: [
      'Design VPC and virtual network layouts, and the address plan that has to last',
      'Connect cloud environments back to offices and data centres over VPN or dedicated circuits',
      'Work out why one subnet can reach a service and an apparently identical one cannot',
      'Build transit and peering architectures across many accounts or subscriptions',
      'Define network security groups and cloud firewall policy',
      'Investigate latency between regions, and decide whether it is the network or the application',
    ],
    technologies: ['aws', 'azure', 'bgp', 'terraform', 'ipsec-tls-pki', 'wireshark', 'python'],
    concepts: [
      'Virtual private clouds and subnets',
      'Hybrid connectivity',
      'Transit gateways and hub-and-spoke design',
      'Cloud-native firewalling',
      'Address space planning',
      'Availability zones and regions',
    ],
    environments: ['Cloud-first companies', 'Enterprises mid-migration', 'Managed service providers', 'Financial services and regulated industries'],
    enjoyIf: [
      'You like networking but want to build it rather than rack it',
      'You enjoy problems where the answer is in a policy document, not a cable',
      'You want the routing knowledge you already have to earn more',
      'You are comfortable that "the network" is now a text file',
    ],
    reality:
      'Cloud networking hides the failure modes rather than removing them — when something breaks you have fewer tools to look with, and less visibility than you would have on physical kit. Costs are also your problem in a way they never were on-prem.',
    related: ['network-engineer', 'cloud-engineer', 'cloud-security-engineer', 'cloud-architect', 'devops-engineer'],
    adjacent: [
      { slug: 'cloud-architect', reason: 'The design-level version of the same decisions.' },
      { slug: 'cloud-security-engineer', reason: 'Cloud network policy and cloud identity policy are the same conversation.' },
      { slug: 'network-engineer', reason: 'The on-prem foundation this builds on.' },
    ],
    certs: [
      { title: 'AWS Cloud Practitioner', slug: 'aws-cloud-practitioner', vendorSlug: 'aws', stage: 'Foundation', reason: 'Cheap orientation in the vocabulary before anything else.' },
      { title: 'Cisco CCNA', slug: 'ccna', vendorSlug: 'cisco', stage: 'Foundation', reason: 'The networking fundamentals still apply, unchanged.' },
      { title: 'AWS Solutions Architect Associate', slug: 'aws-saa', vendorSlug: 'aws', stage: 'Core', reason: 'The credential that covers VPC design properly.' },
      { title: 'Microsoft AZ-104', slug: 'az-104', vendorSlug: 'microsoft', stage: 'Core', reason: 'The Azure equivalent, if your organisation is a Microsoft shop.' },
    ],
    pathSlug: 'cloud-engineer',
    seoTitle: 'Cloud Network Engineer — Routing Without Cables | CertBlueprint',
    seoDescription:
      'VPC design, hybrid connectivity and cloud firewalling: what cloud network engineers do, and how existing networking skills convert into this role.',
  },

  {
    slug: 'wireless-engineer',
    shortLabel: 'Wi-Fi, coverage and radio behaviour',
    subdomains: ['wireless', 'enterprise-networking', 'field-engineering'],
    entry: 'second-job',
    activities: [
      'Survey a site and work out where access points actually need to go',
      'Diagnose why devices drop connection in one corridor and nowhere else',
      'Tune channels and power to stop access points fighting each other',
      'Configure secure wireless authentication tied into the directory',
      'Investigate interference from equipment nobody thought was a radio',
      'Validate coverage after the installers have left',
    ],
    technologies: ['wireless-lan', 'cisco-ise', 'cisco-ios', 'wireshark', 'monitoring-stack'],
    concepts: ['RF propagation', 'Channel planning and co-channel interference', 'Roaming', '802.1X wireless authentication', 'Signal-to-noise ratio', 'Client behaviour'],
    environments: ['Hospitals', 'Warehouses and manufacturing', 'Universities and schools', 'Stadiums and venues', 'Corporate campuses'],
    enjoyIf: [
      'You like problems where the physical world is part of the system',
      'You enjoy work that mixes walking a site with reading data',
      'You find it satisfying to fix something everyone complained about and nobody could explain',
    ],
    reality:
      'Wireless is blamed for every problem that happens to occur on a wireless device, most of which are not wireless problems. Site surveys mean travel, ladders and warehouses in summer.',
    related: ['network-engineer', 'field-engineer', 'network-security-engineer'],
    adjacent: [
      { slug: 'network-engineer', reason: 'The wired foundation underneath every wireless deployment.' },
      { slug: 'network-security-engineer', reason: 'Wireless authentication is where networking and identity meet.' },
    ],
    certs: [
      { title: 'CompTIA Network+', slug: 'network-plus', vendorSlug: 'comptia', stage: 'Foundation', reason: 'Wireless sits on top of ordinary networking.' },
      { title: 'Cisco CCNA', slug: 'ccna', vendorSlug: 'cisco', stage: 'Core', reason: 'Covers wireless fundamentals in their proper context.' },
      { title: 'Cisco CCNP Wireless', slug: 'ccnp-wireless', vendorSlug: 'cisco', stage: 'Advanced', reason: 'The dedicated professional track for this specialisation.' },
      { title: 'Cisco CCIE Wireless', slug: 'ccie-wireless', vendorSlug: 'cisco', stage: 'Advanced', reason: 'The expert-level lab for genuine RF specialists in markets that pay for the depth.' },
    ],
    seoTitle: 'Wireless Engineer — RF, Coverage and Real Buildings | CertBlueprint',
    seoDescription:
      'Site surveys, channel planning, roaming and 802.1X: what wireless engineers do, where they work, and the CCNP Wireless path.',
  },

  {
    slug: 'data-center-engineer',
    shortLabel: 'Racks, fabrics, power and density',
    subdomains: ['data-center-networking', 'virtualization', 'storage', 'field-engineering'],
    entry: 'second-job',
    activities: [
      'Design and build the switching fabric connecting thousands of servers',
      'Plan rack layout, power draw and cooling before equipment arrives',
      'Install, cable and commission hardware, and label it so it can be found again',
      'Troubleshoot faults that could be optical, electrical or logical',
      'Manage storage networks and the paths to them',
      'Coordinate maintenance in an environment that is never supposed to go down',
    ],
    technologies: ['arista-eos', 'cisco-ios', 'vmware', 'bgp', 'vlans', 'monitoring-stack'],
    concepts: ['Leaf-spine architecture', 'East-west traffic', 'Redundant power and cooling', 'Storage networking', 'Capacity planning', 'Structured cabling'],
    environments: ['Colocation providers', 'Cloud provider facilities', 'Large enterprise data centres', 'Financial trading infrastructure'],
    enjoyIf: [
      'You like being able to touch the thing you are responsible for',
      'You enjoy work that is half design and half physical execution',
      'You find scale genuinely interesting rather than intimidating',
    ],
    reality:
      'Data centres are loud, cold and often far from where you live. Some of the work is physically demanding, and the schedule follows equipment deliveries and change windows rather than office hours.',
    related: ['network-engineer', 'systems-engineer', 'field-engineer', 'cloud-engineer'],
    adjacent: [
      { slug: 'network-engineer', reason: 'The logical side of what you are physically building.' },
      { slug: 'systems-engineer', reason: 'If the servers interest you more than the fabric.' },
      { slug: 'cloud-engineer', reason: 'The same infrastructure, rented rather than owned.' },
    ],
    certs: [
      { title: 'CompTIA Network+', slug: 'network-plus', vendorSlug: 'comptia', stage: 'Foundation', reason: 'Fundamentals first.' },
      { title: 'Cisco CCNA', slug: 'ccna', vendorSlug: 'cisco', stage: 'Core', reason: 'The networking baseline for fabric work.' },
      { title: 'Cisco CCNP Data Center', slug: 'ccnp-data-center', vendorSlug: 'cisco', stage: 'Advanced', reason: 'The dedicated track for data centre networking and compute.' },
      { title: 'Cisco Certified Field Technician', slug: 'ccft', vendorSlug: 'cisco', stage: 'Alternative', reason: 'Formalises data centre floor and smart-hands work before you move onto the networking track.' },
      { title: 'Cisco CCIE Data Center', slug: 'ccie-data-center', vendorSlug: 'cisco', stage: 'Advanced', reason: 'The expert-level lab, for engineers already running large Cisco fabrics day to day.' },
    ],
    seoTitle: 'Data Center Engineer — Where the Machines Actually Live | CertBlueprint',
    seoDescription:
      'Fabric design, racking, power, cooling and storage networking: what data centre engineers do and the CCNP Data Center path.',
  },
];
