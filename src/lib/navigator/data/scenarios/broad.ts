import type { Scenario } from '../../types';

/**
 * Broad scenarios — the opening pass.
 *
 * Authoring rules, enforced by review rather than by types:
 *  1. The setup never names a career, a domain, or a job title.
 *  2. No option is objectively correct. Every option is something a competent
 *     professional might genuinely choose first.
 *  3. Options are roughly equal in length and confidence. An option that sounds
 *     more expert than its neighbours is a leading question.
 *  4. Any term that needs background gets a glossary key, not a rewrite into
 *     vagueness. We want people to be able to choose real work.
 *  5. Frames vary. Asking "what would you investigate first?" fourteen times
 *     trains the user to answer the format rather than the content.
 */
export const BROAD_SCENARIOS: Scenario[] = [
  {
    id: 'b01-night-outage',
    stage: 'broad',
    category: 'outage',
    setup:
      'It is 2:13 AM. Staff can still reach internal applications, but nobody can get to anything on the internet. A change was made to the firewall about twenty minutes before it started.',
    frame: 'Which part of this would you most want to get your hands on?',
    sim: {
      kind: 'topology',
      caption: 'Reported path',
      nodes: [
        { label: 'Laptop', sub: 'internal apps OK', state: 'ok' },
        { label: 'Switch', state: 'ok' },
        { label: 'Router', state: 'ok' },
        { label: 'Firewall', sub: 'changed 20 min ago', state: 'warn' },
        { label: 'Internet', sub: 'unreachable', state: 'fail' },
      ],
    },
    options: [
      {
        id: 'a',
        label: 'Follow the traffic hop by hop and find the exact point where it stops',
        terms: ['routing-table'],
        weights: { 'dom.networking': 3, 'dom.operations': 2, 'sty.troubleshooting': 3, 'abs.network': 3, 'wrk.reactive': 2 },
        rationale: 'tracing traffic to the exact point where it stops',
      },
      {
        id: 'b',
        label: 'Read the firewall’s rules and logs to see what is being dropped and by which rule',
        terms: ['firewall-rule', 'log'],
        weights: { 'dom.cybersecurity': 3, 'dom.networking': 2, 'sec.network': 3, 'sty.policy': 2, 'sty.troubleshooting': 2, 'abs.network': 2 },
        rationale: 'reading firewall policy to find what is being blocked',
      },
      {
        id: 'c',
        label: 'Check whether the servers and supporting services behind it are actually healthy',
        terms: ['dns'],
        weights: { 'dom.systems': 3, 'dom.operations': 2, 'abs.os': 3, 'sty.troubleshooting': 2, 'wrk.continuous': 2 },
        rationale: 'checking whether the underlying systems are healthy',
      },
      {
        id: 'd',
        label: 'Work out whether this could be someone deliberately causing it rather than a mistake',
        weights: { 'dom.cybersecurity': 3, 'sec.detection': 3, 'sec.response': 2, 'sty.investigation': 3, 'wrk.reactive': 2 },
        rationale: 'asking whether an incident was deliberate rather than accidental',
      },
      {
        id: 'e',
        label: 'Write something that collects diagnostics from every affected site at once',
        weights: { 'dom.automation': 3, 'dom.software': 2, 'sty.automating': 3, 'abs.code': 2, 'wrk.automation': 3 },
        rationale: 'building a tool to gather evidence instead of gathering it by hand',
      },
    ],
  },

  {
    id: 'b02-server-memory',
    stage: 'broad',
    category: 'performance',
    setup:
      'An application everyone uses has become unusable. The machine it runs on shows almost no CPU activity, memory nearly full, and storage responding slowly.',
    frame: 'Which of these would you rather be the one to dig into?',
    sim: {
      kind: 'metrics',
      caption: 'app-prod-04',
      items: [
        { label: 'CPU', value: '9%', state: 'ok' },
        { label: 'Memory', value: '98%', state: 'fail' },
        { label: 'Disk latency', value: '240 ms', state: 'fail' },
        { label: 'Application', value: 'not responding', state: 'fail' },
      ],
    },
    options: [
      {
        id: 'a',
        label: 'Get inside the operating system and find what is consuming the memory',
        weights: { 'dom.systems': 3, 'abs.os': 3, 'sty.troubleshooting': 3, 'wrk.reactive': 2 },
        rationale: 'digging into what a server is actually doing under the hood',
      },
      {
        id: 'b',
        label: 'Look at the storage underneath — whether the slowness starts there',
        weights: { 'dom.systems': 3, 'abs.physical': 2, 'abs.data': 2, 'sty.analysis': 2, 'sty.troubleshooting': 2 },
        rationale: 'following a performance problem down to the storage layer',
      },
      {
        id: 'c',
        label: 'Read the application’s own logs to see what it thinks is going wrong',
        terms: ['log'],
        weights: { 'dom.software': 2, 'abs.application': 3, 'sty.investigation': 3, 'sty.troubleshooting': 2, 'wrk.deep': 2 },
        rationale: 'reading application logs to understand its own account of the failure',
      },
      {
        id: 'd',
        label: 'Set up monitoring so next time you get warned an hour before it fails',
        weights: { 'dom.operations': 3, 'sty.monitoring': 3, 'wrk.proactive': 3, 'sty.automating': 2 },
        rationale: 'instrumenting a system so the next failure is caught early',
      },
      {
        id: 'e',
        label: 'Check whether something unexpected is running on the machine that should not be',
        weights: { 'dom.cybersecurity': 3, 'sec.endpoint': 3, 'sec.detection': 2, 'sty.investigation': 2 },
        rationale: 'checking whether unexpected software is running on a machine',
      },
    ],
  },

  {
    id: 'b03-large-transfer',
    stage: 'broad',
    category: 'suspicious-traffic',
    setup:
      'A firewall log line stands out. One internal machine has sent 487 MB to an address nobody recognises, over the same port normal web traffic uses. It was allowed.',
    frame: 'What catches your interest here?',
    sim: {
      kind: 'log',
      caption: 'fw-edge-01 · outbound',
      columns: ['Source', 'Destination', 'Port', 'Action', 'Bytes sent'],
      rows: [
        ['10.20.10.12', '52.94.x.x', '443', 'ALLOW', '2.1 MB'],
        ['10.20.10.44', '185.x.x.x', '443', 'ALLOW', '487 MB'],
        ['10.20.10.31', '104.18.x.x', '443', 'ALLOW', '8.4 MB'],
      ],
      highlight: [1],
    },
    options: [
      {
        id: 'a',
        label: 'Find out what that machine is, who uses it, and what it normally talks to',
        terms: ['baseline'],
        weights: { 'dom.cybersecurity': 3, 'sec.detection': 3, 'sty.investigation': 3, 'sec.endpoint': 2 },
        rationale: 'establishing what normal looks like before judging what is abnormal',
      },
      {
        id: 'b',
        label: 'Capture the actual traffic and read what is inside it',
        terms: ['packet-capture'],
        weights: { 'dom.networking': 2, 'dom.cybersecurity': 2, 'abs.network': 3, 'sty.investigation': 3, 'wrk.deep': 3 },
        rationale: 'reading the raw traffic rather than the summary of it',
      },
      {
        id: 'c',
        label: 'Ask why a rule allows this at all, and what changing it would break',
        terms: ['firewall-rule'],
        weights: { 'dom.cybersecurity': 3, 'sec.network': 3, 'sec.prevention': 3, 'sty.policy': 3 },
        rationale: 'questioning why a policy permits something, and what tightening it costs',
      },
      {
        id: 'd',
        label: 'Go to the machine itself and see what process opened that connection',
        terms: ['edr'],
        weights: { 'dom.cybersecurity': 3, 'sec.endpoint': 3, 'sec.response': 2, 'abs.os': 2, 'sty.investigation': 2 },
        rationale: 'going to the endpoint to find the process behind a connection',
      },
      {
        id: 'e',
        label: 'Write something that flags this pattern automatically across every machine',
        weights: { 'dom.cybersecurity': 2, 'dom.automation': 3, 'sec.detection': 3, 'sty.building': 3, 'wrk.proactive': 3 },
        rationale: 'turning a one-off catch into an automatic detection',
      },
    ],
  },

  {
    id: 'b04-new-office',
    stage: 'broad',
    category: 'architecture',
    setup:
      'Your company is opening a new office for 200 people in four months. Nothing exists there yet — no equipment, no connections, no accounts.',
    frame: 'Which piece would you put your hand up for?',
    options: [
      {
        id: 'a',
        label: 'Designing how the site connects back to everywhere else, and how traffic will flow',
        weights: { 'dom.networking': 3, 'sty.architecture': 3, 'abs.network': 3, 'wrk.design': 3 },
        rationale: 'designing how a site connects to everything else',
      },
      {
        id: 'b',
        label: 'Deciding what is allowed to reach what, and building those rules in before anyone arrives',
        terms: ['segmentation'],
        weights: { 'dom.cybersecurity': 3, 'sec.network': 3, 'sec.prevention': 3, 'sty.policy': 3, 'wrk.proactive': 2 },
        rationale: 'deciding access rules before a system goes live rather than after',
      },
      {
        id: 'c',
        label: 'Standing up the servers, directories and services the office will run on',
        terms: ['active-directory'],
        weights: { 'dom.systems': 3, 'abs.os': 3, 'abs.identity': 2, 'sty.building': 3, 'wrk.project': 3 },
        rationale: 'building the systems and services an organisation runs on',
      },
      {
        id: 'd',
        label: 'Physically installing it — racks, cabling, access points, testing every port',
        weights: { 'dom.operations': 3, 'abs.physical': 3, 'sty.building': 2, 'wrk.project': 3 },
        rationale: 'doing the hands-on physical build',
      },
      {
        id: 'e',
        label: 'Making the whole build repeatable, so the next office takes a fraction of the effort',
        terms: ['iac'],
        weights: { 'dom.automation': 3, 'dom.cloud': 2, 'sty.automating': 3, 'abs.code': 2, 'wrk.automation': 3 },
        rationale: 'making a build repeatable instead of doing it again from scratch',
      },
    ],
  },

  {
    id: 'b05-repetitive-task',
    stage: 'broad',
    category: 'automation',
    setup:
      'A task lands on your team roughly forty times a month. Each one takes about twenty minutes, follows the same eleven steps, and occasionally someone gets step seven wrong.',
    frame: 'What is your first instinct?',
    options: [
      {
        id: 'a',
        label: 'Write something that does all eleven steps and never gets step seven wrong',
        weights: { 'dom.automation': 3, 'abs.code': 3, 'sty.automating': 3, 'wrk.automation': 3 },
        rationale: 'replacing repeated manual work with something that runs itself',
      },
      {
        id: 'b',
        label: 'Ask why the request exists at all, and whether the underlying need could be removed',
        weights: { 'sty.architecture': 3, 'wrk.design': 3, 'sty.analysis': 2, 'wrk.proactive': 3 },
        rationale: 'questioning whether the work needs to exist rather than optimising it',
      },
      {
        id: 'c',
        label: 'Write it down properly so anyone can do it correctly, including at 3 AM',
        weights: { 'dom.operations': 3, 'sty.policy': 2, 'sty.support': 2, 'wrk.continuous': 2 },
        rationale: 'making a procedure repeatable by other people',
      },
      {
        id: 'd',
        label: 'Build a self-service option so the requester never has to ask your team',
        weights: { 'dom.automation': 2, 'dom.cloud': 2, 'dom.software': 2, 'sty.building': 3, 'wrk.automation': 2, 'wrk.design': 2 },
        rationale: 'building self-service tooling so other people are not blocked on you',
      },
      {
        id: 'e',
        label: 'Look at whether step seven going wrong has ever caused a security problem',
        weights: { 'dom.cybersecurity': 3, 'sec.governance': 3, 'sty.policy': 2, 'sty.analysis': 2 },
        rationale: 'asking what a process failure exposes',
      },
    ],
  },

  {
    id: 'b06-region-latency',
    stage: 'broad',
    category: 'cloud',
    setup:
      'Customers in one region say the application takes eight seconds to load. In another region the same application loads in under one second. Nothing was deployed recently.',
    frame: 'Which thread would you rather pull on?',
    sim: {
      kind: 'metrics',
      caption: 'p95 page load by region',
      items: [
        { label: 'Region A', value: '8.2 s', state: 'fail' },
        { label: 'Region B', value: '0.9 s', state: 'ok' },
        { label: 'Error rate', value: '0.1%', state: 'ok' },
        { label: 'Deploys (7d)', value: 'none', state: 'ok' },
      ],
    },
    options: [
      {
        id: 'a',
        label: 'Trace the network path between the customer and the service, and measure each leg',
        weights: { 'dom.networking': 3, 'abs.network': 3, 'sty.troubleshooting': 3, 'dom.cloud': 2 },
        rationale: 'measuring the network path rather than guessing at it',
      },
      {
        id: 'b',
        label: 'Look at how the environment is built in that region and what differs',
        terms: ['vpc'],
        weights: { 'dom.cloud': 3, 'abs.cloud': 3, 'sty.architecture': 2, 'sty.troubleshooting': 2 },
        rationale: 'comparing how two environments are built to find the difference',
      },
      {
        id: 'c',
        label: 'Instrument the application so it reports where its own time is going',
        weights: { 'dom.operations': 2, 'dom.software': 2, 'sty.monitoring': 3, 'abs.application': 3, 'wrk.proactive': 2 },
        rationale: 'instrumenting a system so it explains its own behaviour',
      },
      {
        id: 'd',
        label: 'Check the database — whether queries from that region are slower and why',
        terms: ['sql'],
        weights: { 'dom.data': 3, 'abs.data': 3, 'sty.analysis': 3, 'sty.troubleshooting': 2 },
        rationale: 'following a performance problem into the data layer',
      },
      {
        id: 'e',
        label: 'Check whether a security control in that region is inspecting and slowing the traffic',
        weights: { 'dom.cybersecurity': 3, 'sec.network': 3, 'sty.troubleshooting': 2, 'abs.network': 2 },
        rationale: 'considering that a security control might be the cause of a performance problem',
      },
    ],
  },

  {
    id: 'b07-impossible-login',
    stage: 'broad',
    category: 'identity',
    setup:
      'An account signed in successfully from the office at 09:14, and again from another continent at 09:31. Both attempts passed the second-factor prompt.',
    frame: 'Which part of that would you want to own?',
    sim: {
      kind: 'log',
      caption: 'sign-in activity · j.okafor',
      columns: ['Time', 'Location', 'Device', 'MFA', 'Result'],
      rows: [
        ['09:14', 'Manchester, UK', 'managed laptop', 'passed', 'success'],
        ['09:31', 'Lagos, NG', 'unknown browser', 'passed', 'success'],
      ],
      highlight: [1],
    },
    options: [
      {
        id: 'a',
        label: 'Find out everything that account touched after the second sign-in',
        terms: ['lateral-movement'],
        weights: { 'dom.cybersecurity': 3, 'sec.response': 3, 'sty.investigation': 3, 'wrk.reactive': 3 },
        rationale: 'tracing what a compromised account reached',
      },
      {
        id: 'b',
        label: 'Work out how the second factor was satisfied, and fix that specific weakness',
        terms: ['mfa'],
        weights: { 'dom.cybersecurity': 3, 'sec.identity': 3, 'sec.prevention': 3, 'abs.identity': 3 },
        rationale: 'closing the specific weakness that let authentication be bypassed',
      },
      {
        id: 'c',
        label: 'Redesign the access rules so a sign-in like this is refused automatically next time',
        terms: ['zero-trust', 'rbac'],
        weights: { 'dom.cybersecurity': 3, 'sec.architecture': 3, 'sec.identity': 3, 'sty.architecture': 3, 'wrk.design': 2 },
        rationale: 'redesigning access rules so a whole class of sign-in is refused',
      },
      {
        id: 'd',
        label: 'Write a detection so any pattern like this raises an alert immediately',
        weights: { 'dom.cybersecurity': 3, 'dom.data': 2, 'sec.detection': 3, 'sty.building': 2, 'wrk.proactive': 3 },
        rationale: 'writing a detection so the pattern is caught automatically next time',
      },
      {
        id: 'e',
        label: 'Review every account with similar access and see how many share the same gap',
        weights: { 'dom.cybersecurity': 2, 'sec.governance': 3, 'sty.policy': 3, 'sty.analysis': 2, 'wrk.proactive': 2 },
        rationale: 'checking how widely a weakness applies across an organisation',
      },
    ],
  },

  {
    id: 'b08-release-broke',
    stage: 'broad',
    category: 'software',
    setup:
      'A release went out at 4 PM. By 4:20 support is getting reports that one feature returns an error for about one user in twenty. The rest of the application is fine.',
    frame: 'Which would you rather spend the next two hours on?',
    options: [
      {
        id: 'a',
        label: 'Reproducing it, then reading the code path until you find the exact condition',
        weights: { 'dom.software': 3, 'abs.code': 3, 'abs.application': 3, 'sty.troubleshooting': 3, 'wrk.deep': 3 },
        rationale: 'reading code until the exact failing condition is cornered',
      },
      {
        id: 'b',
        label: 'Getting the previous version back in production first, and diagnosing afterwards',
        weights: { 'dom.operations': 3, 'dom.cloud': 2, 'sty.monitoring': 2, 'wrk.reactive': 3, 'wrk.continuous': 2 },
        rationale: 'restoring service first and diagnosing second',
      },
      {
        id: 'c',
        label: 'Improving the pipeline so a change like this cannot reach everyone at once again',
        terms: ['ci-cd'],
        weights: { 'dom.automation': 3, 'dom.cloud': 2, 'sty.automating': 3, 'wrk.automation': 3, 'wrk.proactive': 3 },
        rationale: 'changing the delivery process so a bad release cannot reach everyone',
      },
      {
        id: 'd',
        label: 'Working out what the one-in-twenty have in common that the others do not',
        weights: { 'dom.data': 3, 'sty.analysis': 3, 'sty.investigation': 3, 'abs.data': 2 },
        rationale: 'finding what a failing subset has in common',
      },
      {
        id: 'e',
        label: 'Checking whether the error leaks anything it should not to the user',
        weights: { 'dom.cybersecurity': 3, 'dom.software': 2, 'sec.prevention': 2, 'sec.offensive': 2, 'abs.application': 2 },
        rationale: 'checking what an error message gives away',
      },
    ],
  },

  {
    id: 'b09-unknown-device',
    stage: 'broad',
    category: 'endpoint',
    setup:
      'Something appeared on the network in a meeting room three days ago. It has an address, it talks to a handful of internal systems, and nobody has claimed it.',
    frame: 'Which responsibility here sounds least annoying to you?',
    options: [
      {
        id: 'a',
        label: 'Working out physically where it is plugged in and what it is',
        weights: { 'dom.networking': 3, 'dom.operations': 2, 'abs.physical': 3, 'sty.troubleshooting': 2 },
        rationale: 'tracking a device down to the physical port it is plugged into',
      },
      {
        id: 'b',
        label: 'Fingerprinting it from its behaviour to identify what kind of device it is',
        weights: { 'dom.cybersecurity': 3, 'sec.detection': 3, 'sty.investigation': 3, 'abs.network': 2 },
        rationale: 'identifying an unknown device from how it behaves',
      },
      {
        id: 'c',
        label: 'Making sure unknown devices cannot get on at all in future',
        terms: ['nac'],
        weights: { 'dom.cybersecurity': 3, 'sec.network': 3, 'sec.prevention': 3, 'sty.policy': 3, 'wrk.proactive': 3 },
        rationale: 'preventing unknown devices from connecting in the first place',
      },
      {
        id: 'd',
        label: 'Building an inventory so "nobody has claimed it" stops being possible',
        weights: { 'dom.operations': 2, 'dom.data': 2, 'sec.governance': 3, 'sty.policy': 3, 'wrk.proactive': 2 },
        rationale: 'building the inventory that makes unknowns impossible',
      },
      {
        id: 'e',
        label: 'Watching exactly what it is talking to, and deciding whether that is a problem',
        weights: { 'dom.cybersecurity': 2, 'dom.networking': 2, 'sec.detection': 3, 'sty.monitoring': 3, 'abs.network': 2 },
        rationale: 'watching what a system communicates with before deciding it is a problem',
      },
    ],
  },

  {
    id: 'b10-wifi-corridor',
    stage: 'broad',
    category: 'wireless',
    setup:
      'On the second floor of one building, people’s devices drop connection as they walk down a specific corridor. Everywhere else in the building is fine. It started about a month ago.',
    frame: 'Which outcome would feel most satisfying to be the one who delivered?',
    options: [
      {
        id: 'a',
        label: 'Walking the corridor with measuring equipment until you find the physical cause',
        weights: { 'dom.networking': 2, 'dom.operations': 2, 'abs.physical': 3, 'sty.troubleshooting': 3, 'wrk.project': 2 },
        rationale: 'going to the physical location and measuring until the cause is found',
      },
      {
        id: 'b',
        label: 'Analysing months of connection data to see exactly when and how it started',
        weights: { 'dom.data': 3, 'sty.analysis': 3, 'sty.investigation': 2, 'abs.data': 2 },
        rationale: 'analysing historical data to pin down when a problem began',
      },
      {
        id: 'c',
        label: 'Reworking the design of coverage in that building so it stops being fragile',
        weights: { 'dom.networking': 3, 'sty.architecture': 3, 'wrk.design': 3, 'abs.physical': 2 },
        rationale: 'redesigning something fragile rather than repairing it repeatedly',
      },
      {
        id: 'd',
        label: 'Checking whether devices are being refused rather than dropped — an access problem, not a signal one',
        terms: ['nac'],
        weights: { 'dom.cybersecurity': 2, 'sec.identity': 2, 'sec.network': 2, 'abs.identity': 2, 'sty.investigation': 2 },
        rationale: 'considering that an apparent connectivity fault is an access-control one',
      },
    ],
  },

  {
    id: 'b11-numbers-dont-match',
    stage: 'broad',
    category: 'data',
    setup:
      'Two reports covering the same month disagree. One says 14,208 transactions, the other says 13,977. Both have been used in meetings. Nobody knows which is right.',
    frame: 'Which part of untangling this appeals to you most?',
    options: [
      {
        id: 'a',
        label: 'Going back to the source data and reconciling the two, row by row if necessary',
        weights: { 'dom.data': 3, 'abs.data': 3, 'sty.analysis': 3, 'wrk.deep': 3 },
        rationale: 'reconciling conflicting numbers back to the source',
      },
      {
        id: 'b',
        label: 'Fixing the pipeline so the two can never diverge again',
        weights: { 'dom.data': 3, 'dom.automation': 3, 'sty.building': 3, 'abs.code': 2, 'wrk.automation': 2 },
        rationale: 'fixing the process so the same discrepancy cannot recur',
      },
      {
        id: 'c',
        label: 'Getting agreement on what the number is actually supposed to mean before counting anything',
        weights: { 'sty.policy': 3, 'sty.analysis': 2, 'sec.governance': 2, 'wrk.design': 2, 'wrk.project': 2 },
        rationale: 'settling the definition before settling the number',
      },
      {
        id: 'd',
        label: 'Checking whether anyone changed the data, and when',
        terms: ['log'],
        weights: { 'dom.cybersecurity': 2, 'sty.investigation': 3, 'sec.detection': 2, 'sec.governance': 2 },
        rationale: 'checking whether data was altered, and by whom',
      },
    ],
  },

  {
    id: 'b12-first-dashboard',
    stage: 'broad',
    category: 'monitoring',
    setup:
      'You have just started a shift. Everything is technically green, but you have twenty minutes before anything is expected of you.',
    frame: 'Which screen do you open first, purely because you want to?',
    options: [
      {
        id: 'a',
        label: 'Traffic flows across the network — what is talking to what, and how much',
        weights: { 'dom.networking': 3, 'abs.network': 3, 'sty.monitoring': 2, 'sty.analysis': 2 },
        rationale: 'looking at how traffic is moving when nothing is wrong',
      },
      {
        id: 'b',
        label: 'The overnight security alerts nobody has looked at yet',
        terms: ['siem'],
        weights: { 'dom.cybersecurity': 3, 'sec.detection': 3, 'sty.investigation': 3, 'sty.monitoring': 2 },
        rationale: 'going through security alerts by choice rather than obligation',
      },
      {
        id: 'c',
        label: 'Server health and capacity trends across the estate',
        weights: { 'dom.systems': 3, 'abs.os': 2, 'sty.monitoring': 3, 'wrk.continuous': 2 },
        rationale: 'watching infrastructure health and capacity trends',
      },
      {
        id: 'd',
        label: 'Deployment history and how the last few releases behaved',
        terms: ['ci-cd'],
        weights: { 'dom.cloud': 2, 'dom.software': 2, 'dom.automation': 2, 'sty.monitoring': 2, 'wrk.automation': 2 },
        rationale: 'tracking how software releases behave after they ship',
      },
      {
        id: 'e',
        label: 'Which accounts have access to what, and whether any of it looks excessive',
        terms: ['least-privilege'],
        weights: { 'dom.cybersecurity': 2, 'sec.identity': 3, 'abs.identity': 3, 'sty.policy': 3 },
        rationale: 'reviewing who has access to what without being asked to',
      },
    ],
  },

  {
    id: 'b13-ransom-note',
    stage: 'broad',
    category: 'incident',
    setup:
      'A file server has thousands of files renamed with an unfamiliar extension, and a text file demanding payment. It is 10:40 on a Tuesday and people are still working.',
    frame: 'In that room, which job would you want?',
    options: [
      {
        id: 'a',
        label: 'Deciding right now what gets disconnected, accepting that it stops people working',
        weights: { 'dom.cybersecurity': 3, 'sec.response': 3, 'wrk.reactive': 3, 'sty.troubleshooting': 2 },
        rationale: 'making containment decisions under pressure',
      },
      {
        id: 'b',
        label: 'Working backwards to find how it got in and how long it has been there',
        terms: ['ioc'],
        weights: { 'dom.cybersecurity': 3, 'sty.investigation': 3, 'sec.detection': 3, 'wrk.deep': 3 },
        rationale: 'reconstructing how an attacker got in and how long they were there',
      },
      {
        id: 'c',
        label: 'Getting the data back — restoring from backup and verifying it is clean',
        weights: { 'dom.systems': 3, 'dom.operations': 2, 'abs.os': 2, 'wrk.reactive': 2, 'wrk.continuous': 2 },
        rationale: 'restoring service and data after a failure',
      },
      {
        id: 'd',
        label: 'Making sure it cannot spread — cutting the paths between systems',
        terms: ['segmentation'],
        weights: { 'dom.cybersecurity': 3, 'dom.networking': 2, 'sec.network': 3, 'sec.prevention': 3, 'sty.architecture': 2 },
        rationale: 'cutting the paths a problem could spread along',
      },
      {
        id: 'e',
        label: 'Handling who gets told what, and when — including regulators and customers',
        weights: { 'dom.cybersecurity': 2, 'sec.governance': 3, 'sty.policy': 3, 'wrk.project': 2 },
        rationale: 'managing obligation and communication during an incident',
      },
    ],
  },

  {
    id: 'b14-acquisition',
    stage: 'broad',
    category: 'architecture',
    setup:
      'Your company has bought another company. They have their own network, their own accounts, their own way of doing everything. In eighteen months it all has to work as one.',
    frame: 'Which part of that would you actually want on your plate?',
    options: [
      {
        id: 'a',
        label: 'Joining the two networks together without either one inheriting the other’s problems',
        weights: { 'dom.networking': 3, 'sty.architecture': 3, 'abs.network': 3, 'wrk.design': 3, 'wrk.project': 2 },
        rationale: 'designing how two networks merge without inheriting each other’s problems',
      },
      {
        id: 'b',
        label: 'Merging the two sets of accounts and permissions into something coherent',
        terms: ['active-directory', 'sso'],
        weights: { 'dom.systems': 2, 'dom.cybersecurity': 2, 'sec.identity': 3, 'abs.identity': 3, 'sty.policy': 3 },
        rationale: 'merging identity systems into something coherent',
      },
      {
        id: 'c',
        label: 'Finding out what security state you have just acquired, before connecting anything',
        weights: { 'dom.cybersecurity': 3, 'sec.governance': 3, 'sty.analysis': 3, 'sec.prevention': 2, 'wrk.proactive': 3 },
        rationale: 'assessing risk before connecting something to your environment',
      },
      {
        id: 'd',
        label: 'Deciding the target architecture and writing down what everyone builds toward',
        weights: { 'sty.architecture': 3, 'sec.architecture': 2, 'wrk.design': 3, 'sty.policy': 2, 'wrk.project': 3 },
        rationale: 'setting the target design others build toward',
      },
      {
        id: 'e',
        label: 'Migrating their systems and data across, and being the one who makes it survive contact',
        weights: { 'dom.systems': 3, 'dom.cloud': 2, 'sty.building': 3, 'wrk.project': 3, 'abs.os': 2 },
        rationale: 'executing migrations and making them survive contact with reality',
      },
    ],
  },

  {
    id: 'b15-vendor-connection',
    stage: 'broad',
    category: 'policy',
    setup:
      'A supplier needs access to one internal system to do their job. They have asked for a permanent connection into your network. Someone senior has already told them it is fine.',
    frame: 'What is the first thing you want to do about that?',
    options: [
      {
        id: 'a',
        label: 'Design access that reaches exactly that one system and nothing else',
        terms: ['least-privilege', 'segmentation'],
        weights: { 'dom.cybersecurity': 3, 'sec.network': 3, 'sec.prevention': 3, 'sty.architecture': 3, 'sty.policy': 2 },
        rationale: 'designing access that reaches exactly one thing and nothing else',
      },
      {
        id: 'b',
        label: 'Set up the connection cleanly and make sure it actually works reliably',
        terms: ['vpn'],
        weights: { 'dom.networking': 3, 'abs.network': 3, 'sty.building': 2, 'wrk.project': 2 },
        rationale: 'building a connection and making it work reliably',
      },
      {
        id: 'c',
        label: 'Establish what happens if the supplier is breached, and get that written down',
        weights: { 'dom.cybersecurity': 2, 'sec.governance': 3, 'sty.policy': 3, 'sty.analysis': 2, 'wrk.project': 2 },
        rationale: 'thinking through third-party risk before it materialises',
      },
      {
        id: 'd',
        label: 'Make sure everything they do through it is recorded and reviewable',
        terms: ['log'],
        weights: { 'dom.cybersecurity': 2, 'sec.detection': 3, 'sty.monitoring': 3, 'sec.governance': 2 },
        rationale: 'ensuring activity is recorded so it can be reviewed later',
      },
      {
        id: 'e',
        label: 'Tie their access to a verified identity rather than to being on the network',
        terms: ['zero-trust', 'iam'],
        weights: { 'dom.cybersecurity': 3, 'sec.identity': 3, 'sec.architecture': 3, 'abs.identity': 3 },
        rationale: 'tying access to verified identity rather than to network location',
      },
    ],
  },

  {
    id: 'b16-branch-cant-reach-hq',
    stage: 'broad',
    category: 'outage',
    setup:
      'A remote office can print, share files and talk to each other perfectly well. They cannot reach anything hosted at head office. It has been like this since 07:00.',
    frame: 'Which part of this sounds most interesting to investigate?',
    sim: {
      kind: 'topology',
      caption: 'Branch → HQ',
      nodes: [
        { label: 'Branch LAN', sub: 'internal OK', state: 'ok' },
        { label: 'Branch router', state: 'unknown' },
        { label: 'WAN link', state: 'unknown' },
        { label: 'HQ firewall', state: 'unknown' },
        { label: 'HQ services', sub: 'unreachable', state: 'fail' },
      ],
    },
    options: [
      {
        id: 'a',
        label: 'Whether the route between the two sites still exists and where it disappears',
        terms: ['routing-table'],
        weights: { 'dom.networking': 3, 'abs.network': 3, 'sty.troubleshooting': 3, 'wrk.reactive': 2 },
        rationale: 'establishing whether a path between two sites still exists',
      },
      {
        id: 'b',
        label: 'Whether the encrypted tunnel between the sites dropped and did not come back',
        terms: ['vpn'],
        weights: { 'dom.networking': 2, 'dom.cybersecurity': 2, 'sec.network': 2, 'abs.network': 3, 'sty.troubleshooting': 2 },
        rationale: 'checking whether a secure tunnel between sites failed',
      },
      {
        id: 'c',
        label: 'Whether something at head office is refusing the branch specifically',
        terms: ['firewall-rule'],
        weights: { 'dom.cybersecurity': 3, 'sec.network': 3, 'sty.policy': 2, 'sty.troubleshooting': 2 },
        rationale: 'checking whether a policy is refusing traffic on purpose',
      },
      {
        id: 'd',
        label: 'Whether the services themselves are up, and the branch is a red herring',
        weights: { 'dom.systems': 3, 'abs.os': 3, 'sty.troubleshooting': 2, 'dom.operations': 2 },
        rationale: 'questioning the reported symptom and checking the systems themselves',
      },
      {
        id: 'e',
        label: 'Whether the carrier is at fault, and getting evidence they will accept',
        weights: { 'dom.networking': 3, 'dom.operations': 3, 'abs.network': 2, 'sty.investigation': 2, 'wrk.continuous': 2 },
        rationale: 'proving a fault lies with an external provider',
      },
    ],
  },

  /* The three scenarios below were added after measuring the bank: support,
     cloud and offensive work were so thinly represented that a person shaped
     that way could barely register it. Exposure normalization stops thin
     coverage from distorting scores, but it cannot manufacture a choice that
     was never offered. */

  {
    id: 'b17-first-week',
    stage: 'broad',
    category: 'people',
    setup:
      'A department of thirty people is getting new laptops next month. Somebody has to own the whole thing — the build, the rollout, and the fortnight of confusion afterwards.',
    frame: 'Which part would you rather be responsible for?',
    options: [
      {
        id: 'a',
        label: 'Being the person on the floor those two weeks, sorting out whatever comes up',
        weights: { 'dom.operations': 3, 'sty.support': 3, 'wrk.reactive': 3, 'abs.application': 2 },
        rationale: 'being the person people come to when they are stuck',
      },
      {
        id: 'b',
        label: 'Building the standard image so all thirty are identical and correct',
        terms: ['group-policy'],
        weights: { 'dom.systems': 3, 'abs.os': 3, 'sty.building': 2, 'sty.policy': 2, 'wrk.project': 2 },
        rationale: 'building a standard configuration rather than handling machines individually',
      },
      {
        id: 'c',
        label: 'Automating the build so the next thirty take an afternoon',
        weights: { 'dom.automation': 3, 'sty.automating': 3, 'wrk.automation': 3, 'abs.code': 2 },
        rationale: 'automating a rollout so the next one is trivial',
      },
      {
        id: 'd',
        label: 'Deciding what the machines are allowed to do, and locking that down properly',
        terms: ['least-privilege'],
        weights: { 'dom.cybersecurity': 2, 'sec.endpoint': 3, 'sec.prevention': 2, 'sty.policy': 3 },
        rationale: 'deciding and enforcing what machines are permitted to do',
      },
      {
        id: 'e',
        label: 'Writing the guidance so people can answer their own questions',
        weights: { 'dom.operations': 2, 'sty.support': 2, 'sty.policy': 2, 'wrk.proactive': 2 },
        rationale: 'documenting things so people can help themselves',
      },
    ],
  },

  {
    id: 'b18-cost-spike',
    stage: 'broad',
    category: 'cloud',
    setup:
      'The monthly bill for the company’s cloud environment has gone from $8,000 to $31,000. Nobody launched anything they thought was expensive, and nothing is obviously broken.',
    frame: 'Which thread do you want?',
    sim: {
      kind: 'metrics',
      caption: 'Month over month',
      items: [
        { label: 'Compute', value: '+$4.1k', state: 'warn' },
        { label: 'Data transfer', value: '+$17.6k', state: 'fail' },
        { label: 'Storage', value: '+$1.2k', state: 'ok' },
        { label: 'Resources', value: '+9', state: 'ok' },
      ],
    },
    options: [
      {
        id: 'a',
        label: 'Find out what is moving that much data, and between which places',
        terms: ['vpc'],
        weights: { 'dom.cloud': 3, 'dom.networking': 3, 'abs.cloud': 3, 'abs.network': 3, 'sty.investigation': 2 },
        rationale: 'tracing data movement through a cloud environment',
      },
      {
        id: 'b',
        label: 'Rebuild the environment properly so its shape is deliberate rather than accidental',
        terms: ['iac'],
        weights: { 'dom.cloud': 3, 'abs.cloud': 3, 'sty.architecture': 3, 'wrk.design': 3, 'dom.automation': 2 },
        rationale: 'redesigning an environment so its shape is deliberate',
      },
      {
        id: 'c',
        label: 'Put controls in place so nobody can create something this expensive unnoticed',
        weights: { 'dom.cloud': 2, 'sty.policy': 3, 'sec.governance': 2, 'wrk.proactive': 3, 'abs.cloud': 2 },
        rationale: 'putting guardrails around what people can create',
      },
      {
        id: 'd',
        label: 'Build the reporting that would have flagged this in week one',
        weights: { 'dom.data': 3, 'sty.monitoring': 3, 'sty.analysis': 3, 'abs.data': 2, 'wrk.proactive': 2 },
        rationale: 'building reporting that surfaces a problem early',
      },
      {
        id: 'e',
        label: 'Check that the extra traffic is legitimate and not something leaving that should not',
        weights: { 'dom.cloud': 2, 'dom.cybersecurity': 3, 'sec.detection': 3, 'abs.cloud': 2, 'sty.investigation': 2 },
        rationale: 'questioning whether unexplained traffic is legitimate',
      },
    ],
  },

  {
    id: 'b19-public-form',
    stage: 'broad',
    category: 'application',
    setup:
      'A form on the company’s public website has been live for two years. Anyone can submit it, it writes straight to a database, and nobody currently working here built it.',
    frame: 'What do you want to do about that?',
    options: [
      {
        id: 'a',
        label: 'See what you can make it do that it was never meant to',
        weights: { 'dom.cybersecurity': 3, 'sec.offensive': 3, 'sty.investigation': 3, 'abs.application': 2, 'wrk.deep': 2 },
        rationale: 'probing a system for what it was never designed to handle',
      },
      {
        id: 'b',
        label: 'Read the code and work out what it actually does before touching anything',
        weights: { 'dom.software': 3, 'abs.code': 3, 'abs.application': 3, 'sty.investigation': 2, 'wrk.deep': 2 },
        rationale: 'reading unfamiliar code to understand it before changing it',
      },
      {
        id: 'c',
        label: 'Put something in front of it that filters what reaches it',
        terms: ['firewall-rule'],
        weights: { 'dom.cybersecurity': 3, 'sec.network': 3, 'sec.prevention': 3, 'abs.network': 2 },
        rationale: 'placing a control in front of something you cannot fix directly',
      },
      {
        id: 'd',
        label: 'Check whether anyone has already been abusing it, going back two years',
        terms: ['log'],
        weights: { 'dom.cybersecurity': 3, 'sec.detection': 3, 'sty.investigation': 3, 'sty.analysis': 3, 'abs.data': 2 },
        rationale: 'searching historical records for evidence of past abuse',
      },
      {
        id: 'e',
        label: 'Rewrite it properly, with tests, so this cannot be the situation again',
        weights: { 'dom.software': 3, 'abs.code': 3, 'sty.building': 3, 'wrk.deep': 2, 'wrk.project': 2 },
        rationale: 'rebuilding something properly rather than patching around it',
      },
    ],
  },
];
