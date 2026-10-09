import type { GlossaryTerm } from '../types';

/**
 * Plain-English explanations attached to any technical term that appears in a
 * scenario option.
 *
 * The rule that makes this work: an explanation may not use another term that
 * itself needs explaining. "BGP is an exterior gateway protocol" is useless.
 * "BGP is how networks tell each other how to reach one another" is not.
 *
 * A user should never have to decline an option because they did not recognise
 * a word. That is the single biggest failure mode of technical aptitude tests.
 */
export const GLOSSARY: GlossaryTerm[] = [
  { key: 'bgp', term: 'BGP', plain: 'The system networks use to tell each other how to reach one another. It is how the internet decides which way traffic goes.' },
  { key: 'ospf', term: 'OSPF', plain: 'A way for routers inside one organisation to work out the best internal path automatically, and re-route when something fails.' },
  { key: 'routing-table', term: 'routing table', plain: 'A device’s list of "traffic for this destination goes out that way". If the entry is missing or wrong, traffic goes nowhere useful.' },
  { key: 'packet-capture', term: 'packet capture', plain: 'A recording of the actual conversation between two machines, which you can replay and read line by line.' },
  { key: 'vlan', term: 'VLAN', plain: 'A way to split one physical network into several separate ones, so groups of machines cannot see each other.' },
  { key: 'subnet', term: 'subnet', plain: 'A block of addresses treated as one small network. Machines in the same subnet can talk directly; crossing subnets needs a router.' },
  { key: 'firewall-rule', term: 'firewall rule', plain: 'A line in a list that says which traffic is allowed and which is blocked. The order of the list matters.' },
  { key: 'ids-ips', term: 'IDS / IPS', plain: 'A sensor that watches traffic for attack patterns. An IDS reports what it sees; an IPS also blocks it.' },
  { key: 'nac', term: 'NAC', plain: 'Network access control — a system that checks a device before letting it onto the network at all.' },
  { key: 'segmentation', term: 'segmentation', plain: 'Splitting a network into parts so a problem in one part cannot spread to the rest.' },
  { key: 'zero-trust', term: 'Zero Trust', plain: 'An approach that stops trusting anything just because it is "inside the network", and verifies every request instead.' },
  { key: 'vpn', term: 'VPN', plain: 'An encrypted tunnel that carries private traffic safely across a public network like the internet.' },
  { key: 'dns', term: 'DNS', plain: 'The service that turns a name like example.com into the numeric address a machine actually connects to.' },
  { key: 'dhcp', term: 'DHCP', plain: 'The service that hands out network addresses to devices automatically when they connect.' },
  { key: 'siem', term: 'SIEM', plain: 'A system that collects logs from everything in one place so you can search across all of it at once.' },
  { key: 'edr', term: 'EDR', plain: 'Software on each computer that records what programs do and can isolate the machine if it looks compromised.' },
  { key: 'ioc', term: 'indicator of compromise', plain: 'A specific trace an attacker leaves behind — a file, an address, a pattern — that you can search for elsewhere.' },
  { key: 'lateral-movement', term: 'lateral movement', plain: 'An attacker who is already inside moving from the first machine to more valuable ones.' },
  { key: 'privilege-escalation', term: 'privilege escalation', plain: 'Going from a limited account to one that can do far more than it should.' },
  { key: 'mfa', term: 'MFA', plain: 'Requiring a second proof of identity beyond a password — a phone prompt, a code, or a hardware key.' },
  { key: 'active-directory', term: 'Active Directory', plain: 'The Microsoft system that holds every user and computer account in an organisation and decides what each one can open.' },
  { key: 'least-privilege', term: 'least privilege', plain: 'Giving an account exactly the access it needs to do its job, and nothing beyond that.' },
  { key: 'iam', term: 'IAM', plain: 'Identity and access management — the rules deciding who someone is and what they are allowed to reach.' },
  { key: 'group-policy', term: 'Group Policy', plain: 'A Windows feature that pushes settings and restrictions to thousands of machines from one place.' },
  { key: 'hypervisor', term: 'hypervisor', plain: 'Software that runs several virtual computers on one physical machine.' },
  { key: 'container', term: 'container', plain: 'An application packaged with everything it needs, so it runs the same way on any machine.' },
  { key: 'kubernetes', term: 'Kubernetes', plain: 'A system that runs containers across many machines and restarts them automatically when they fail.' },
  { key: 'iac', term: 'infrastructure as code', plain: 'Describing servers and networks in text files, so an entire environment can be built again identically.' },
  { key: 'ci-cd', term: 'CI/CD pipeline', plain: 'The automated path a code change takes from a developer’s laptop to running in production.' },
  { key: 'vpc', term: 'VPC / virtual network', plain: 'Your own private network inside a cloud provider, with subnets and routing you define.' },
  { key: 'api', term: 'API', plain: 'A defined way for one program to ask another to do something, without a person involved.' },
  { key: 'iops', term: 'disk latency', plain: 'How long the storage takes to answer a request. When it climbs, everything on top of it feels slow.' },
  { key: 'log', term: 'logs', plain: 'The running record systems keep of what they did. Most investigations start here.' },
  { key: 'sql', term: 'SQL', plain: 'The language used to ask a database a precise question.' },
  { key: 'cve', term: 'CVE', plain: 'A publicly catalogued software vulnerability, with an identifier everyone uses to refer to the same flaw.' },
  { key: 'patch', term: 'patch', plain: 'A vendor’s fix for a flaw. Applying it is easy on one machine and hard on ten thousand.' },
  { key: 'baseline', term: 'baseline', plain: 'A record of what normal looks like, so you can recognise when something is not.' },
  { key: 'east-west', term: 'east-west traffic', plain: 'Traffic between machines inside the same network, rather than in and out of it.' },
  { key: 'nat', term: 'NAT', plain: 'Translating private internal addresses into a public one so internal machines can reach the internet.' },
  { key: 'tls', term: 'TLS / certificates', plain: 'The encryption that protects a connection, plus the certificates that prove you are talking to who you think.' },
  { key: 'mpls', term: 'MPLS', plain: 'A carrier technique that tags traffic so it can be steered across a provider’s backbone and kept separate per customer.' },
  { key: 'sso', term: 'single sign-on', plain: 'One login that unlocks many applications, instead of a separate password for each.' },
  { key: 'ansible', term: 'Ansible', plain: 'A tool that applies the same configuration to hundreds of machines at once, repeatably.' },
  { key: 'terraform', term: 'Terraform', plain: 'A tool that creates cloud infrastructure from a description in a file, and can rebuild it identically.' },
  { key: 'slo', term: 'SLO', plain: 'An agreed target for how reliable a system should be — which also defines how much unreliability is acceptable.' },
  { key: 'ot', term: 'OT / industrial systems', plain: 'The computers that control physical processes — production lines, power, water. Stopping them has physical consequences.' },
  { key: 'plc', term: 'PLC', plain: 'A small industrial computer that directly controls a physical machine or process.' },
  { key: 'ttp', term: 'attacker techniques', plain: 'The catalogued methods attackers use, so defenders can check which ones they would actually notice.' },
  { key: 'sandbox', term: 'sandbox', plain: 'An isolated environment where you can safely run something suspicious and watch what it tries to do.' },
  { key: 'rbac', term: 'role-based access', plain: 'Granting permissions to a job role rather than to individuals, so access is consistent and reviewable.' },
];

export const GLOSSARY_BY_KEY: Record<string, GlossaryTerm> = Object.fromEntries(
  GLOSSARY.map((g) => [g.key, g]),
);
