import type { Scenario } from '../../types';

/**
 * Differentiator scenarios — the second pass.
 *
 * These only fire when the dimensions in `triggers` are already contested, so a
 * user who showed no security interest never gets asked to choose between
 * detection and prevention. This is what keeps the assessment short: instead of
 * asking everyone fifty questions, we ask the ten that would actually change the
 * answer for THIS person.
 *
 * They are allowed to be more specific than the broad set, because by the time
 * one fires we know the user is already engaged with that material.
 */
export const DIFFERENTIATOR_SCENARIOS: Scenario[] = [
  {
    id: 'd01-route-or-policy',
    stage: 'differentiator',
    category: 'network-vs-netsec',
    triggers: ['dom.networking', 'dom.cybersecurity'],
    setup:
      'Two pieces of work are on the board for next sprint. Both are yours if you want them, and you only have time for one.',
    frame: 'Which do you take?',
    options: [
      {
        id: 'a',
        label: 'Redesign how traffic routes between four sites so failover actually works',
        terms: ['ospf'],
        weights: { 'dom.networking': 3, 'abs.network': 3, 'sty.architecture': 3, 'wrk.design': 2 },
        rationale: 'choosing routing design over access policy',
      },
      {
        id: 'b',
        label: 'Rebuild the firewall rule set that has grown to 900 rules nobody understands',
        terms: ['firewall-rule'],
        weights: { 'dom.cybersecurity': 3, 'sec.network': 3, 'sty.policy': 3, 'sec.prevention': 2 },
        rationale: 'choosing to untangle security policy over network design',
      },
      {
        id: 'c',
        label: 'Write the tooling that keeps both of those in a known state automatically',
        terms: ['iac'],
        weights: { 'dom.automation': 3, 'sty.automating': 3, 'abs.code': 3, 'wrk.automation': 3 },
        rationale: 'choosing to automate the problem rather than solve either instance',
      },
    ],
  },

  {
    id: 'd02-prevent-or-detect',
    stage: 'differentiator',
    category: 'security-posture',
    triggers: ['dom.cybersecurity'],
    setup:
      'You have budget and headcount for exactly one of two programmes this year. Both are defensible. Both have people arguing for them.',
    frame: 'Which one do you argue for?',
    options: [
      {
        id: 'a',
        label: 'Controls that stop the attack happening — access, hardening, segmentation',
        terms: ['segmentation'],
        weights: { 'dom.cybersecurity': 2, 'sec.prevention': 3, 'sec.network': 2, 'sty.policy': 2, 'wrk.proactive': 3 },
        rationale: 'preferring to prevent an attack rather than catch it',
      },
      {
        id: 'b',
        label: 'Visibility that means you would actually notice within minutes',
        terms: ['siem'],
        weights: { 'dom.cybersecurity': 2, 'sec.detection': 3, 'sty.monitoring': 3, 'sty.investigation': 2 },
        rationale: 'preferring to detect an attack rather than assume it can be blocked',
      },
      {
        id: 'c',
        label: 'The ability to respond properly when it happens anyway',
        weights: { 'dom.cybersecurity': 2, 'sec.response': 3, 'wrk.reactive': 3, 'sty.troubleshooting': 2 },
        rationale: 'preferring to be ready to respond over trying to prevent everything',
      },
      {
        id: 'd',
        label: 'Knowing what you actually have, and which of it matters most',
        weights: { 'sec.governance': 3, 'sty.analysis': 3, 'sty.policy': 3, 'wrk.project': 2 },
        rationale: 'preferring to understand and prioritise risk before spending on controls',
      },
    ],
  },

  {
    id: 'd03-alert-lifecycle',
    stage: 'differentiator',
    category: 'security-operations',
    triggers: ['dom.cybersecurity', 'sec.detection'],
    setup:
      'An alert fires. Over the next six hours it turns out to be real, gets contained, and is written up.',
    frame: 'Which hour of that would you most want to be in the room for?',
    options: [
      {
        id: 'a',
        label: 'The first twenty minutes — deciding whether this is real at all',
        weights: { 'dom.operations': 2, 'sec.detection': 3, 'sty.monitoring': 3, 'wrk.reactive': 3, 'wrk.continuous': 2 },
        rationale: 'wanting the fast triage decision at the front of an incident',
      },
      {
        id: 'b',
        label: 'The containment call — what gets cut off, and what that costs',
        weights: { 'sec.response': 3, 'wrk.reactive': 3, 'sty.troubleshooting': 2 },
        rationale: 'wanting the containment decision and its consequences',
      },
      {
        id: 'c',
        label: 'The reconstruction — proving exactly what happened, in order',
        weights: { 'sec.response': 2, 'sty.investigation': 3, 'wrk.deep': 3, 'abs.os': 2 },
        rationale: 'wanting the careful reconstruction of what actually happened',
      },
      {
        id: 'd',
        label: 'The bit afterwards where you make sure it cannot happen the same way twice',
        weights: { 'sec.prevention': 3, 'sec.architecture': 2, 'wrk.proactive': 3, 'sty.building': 2 },
        rationale: 'wanting the follow-up that stops a repeat',
      },
    ],
  },

  {
    id: 'd04-access-request',
    stage: 'differentiator',
    category: 'identity',
    triggers: ['sec.identity', 'abs.identity'],
    setup:
      'A team of eight needs access to a system they have never used. Their manager has asked for "the same as what Sarah has". Sarah has been here nine years.',
    frame: 'What is your instinct?',
    options: [
      {
        id: 'a',
        label: 'Work out what they actually need, and grant only that',
        terms: ['least-privilege'],
        weights: { 'sec.identity': 3, 'abs.identity': 3, 'sty.policy': 3, 'sec.prevention': 2 },
        rationale: 'granting only what is needed rather than copying existing access',
      },
      {
        id: 'b',
        label: 'Look at what Sarah has accumulated in nine years and be quietly alarmed',
        weights: { 'sec.governance': 3, 'sty.analysis': 3, 'sec.identity': 2, 'wrk.proactive': 2 },
        rationale: 'noticing accumulated access as a systemic problem',
      },
      {
        id: 'c',
        label: 'Build proper roles so nobody ever has to ask for "the same as Sarah" again',
        terms: ['rbac'],
        weights: { 'sec.identity': 3, 'sec.architecture': 3, 'sty.architecture': 3, 'wrk.design': 3, 'abs.identity': 2 },
        rationale: 'designing an access model rather than handling requests one at a time',
      },
      {
        id: 'd',
        label: 'Automate the whole request so it is granted and revoked without you',
        weights: { 'dom.automation': 3, 'sty.automating': 3, 'wrk.automation': 3, 'abs.identity': 2 },
        rationale: 'automating access provisioning end to end',
      },
    ],
  },

  {
    id: 'd05-cloud-account',
    stage: 'differentiator',
    category: 'cloud',
    triggers: ['dom.cloud', 'abs.cloud'],
    setup:
      'A team has been given their own cloud account. In three weeks they have created two hundred resources, and nobody outside the team knows what any of them do.',
    frame: 'Which of these would you rather take on?',
    options: [
      {
        id: 'a',
        label: 'Get it all described in code so it can be rebuilt and reviewed',
        terms: ['iac'],
        weights: { 'dom.cloud': 3, 'dom.automation': 3, 'abs.code': 2, 'sty.automating': 3, 'wrk.automation': 3 },
        rationale: 'bringing an environment under infrastructure-as-code control',
      },
      {
        id: 'b',
        // Carries dom.cloud as well as dom.cybersecurity: auditing an IAM policy
        // IS cloud work, and weighting it as security-only made cloud security
        // engineering unreachable for the people most suited to it.
        label: 'Audit the permissions and find out how much of the account they can actually reach',
        terms: ['iam'],
        weights: { 'dom.cloud': 3, 'dom.cybersecurity': 3, 'sec.identity': 3, 'sec.prevention': 3, 'abs.identity': 2, 'abs.cloud': 3 },
        rationale: 'auditing cloud permissions to find unintended reach',
      },
      {
        id: 'c',
        label: 'Work out what it costs and which resources are burning money for nothing',
        weights: { 'dom.cloud': 3, 'sty.analysis': 3, 'abs.cloud': 2, 'wrk.project': 2 },
        rationale: 'treating cost as an engineering problem',
      },
      {
        id: 'd',
        label: 'Design guardrails so the next team cannot create the same mess',
        weights: { 'dom.cloud': 3, 'dom.cybersecurity': 3, 'sec.architecture': 3, 'sec.prevention': 2, 'sty.architecture': 3, 'abs.cloud': 2, 'wrk.design': 3, 'wrk.proactive': 3 },
        rationale: 'building guardrails that prevent a class of mistake',
      },
    ],
  },

  {
    id: 'd06-platform-choice',
    stage: 'differentiator',
    category: 'devops',
    triggers: ['dom.automation', 'dom.cloud'],
    setup:
      'Deploys take forty minutes, fail about one time in six, and everyone has a personal workaround. You have been given three months to fix it.',
    frame: 'Where do you start?',
    options: [
      {
        id: 'a',
        label: 'Rebuild the pipeline itself so a deploy is fast, boring and reversible',
        terms: ['ci-cd'],
        weights: { 'dom.automation': 3, 'dom.software': 2, 'sty.automating': 3, 'wrk.automation': 3, 'sty.building': 2 },
        rationale: 'rebuilding the delivery pipeline itself',
      },
      {
        id: 'b',
        label: 'Build a platform teams deploy onto, so the pipeline stops being their problem',
        weights: { 'dom.cloud': 3, 'sty.building': 3, 'sty.architecture': 3, 'wrk.design': 3, 'abs.cloud': 2 },
        rationale: 'building a platform other engineers use rather than fixing one pipeline',
      },
      {
        id: 'c',
        label: 'Measure what actually fails, and fix in order of what costs the most',
        terms: ['slo'],
        weights: { 'dom.operations': 3, 'sty.analysis': 3, 'sty.monitoring': 3, 'wrk.proactive': 2 },
        rationale: 'measuring before fixing, and prioritising by cost',
      },
      {
        id: 'd',
        label: 'Put the security and quality checks in first, while everyone is rebuilding anyway',
        weights: { 'dom.cybersecurity': 3, 'dom.automation': 2, 'sec.prevention': 3, 'sty.policy': 2, 'wrk.proactive': 3 },
        rationale: 'taking the chance to build controls into a process being rebuilt',
      },
    ],
  },

  {
    id: 'd07-thousand-devices',
    stage: 'differentiator',
    category: 'automation',
    triggers: ['dom.automation', 'dom.networking'],
    setup:
      'A configuration setting has to change on 1,400 network devices. Doing it by hand would take a team two weeks and produce roughly forty mistakes.',
    frame: 'What is the version of this you would enjoy?',
    options: [
      {
        id: 'a',
        label: 'Write the automation, test it on ten devices, then run it everywhere',
        terms: ['ansible'],
        weights: { 'dom.automation': 3, 'dom.networking': 3, 'abs.code': 3, 'sty.automating': 3, 'wrk.automation': 3 },
        rationale: 'writing automation to make a mass change safely',
      },
      {
        id: 'b',
        label: 'Work out what the change actually does to traffic before anyone runs anything',
        weights: { 'dom.networking': 3, 'abs.network': 3, 'sty.architecture': 3, 'wrk.design': 2, 'sty.analysis': 2 },
        rationale: 'understanding the effect of a change before executing it',
      },
      {
        id: 'c',
        label: 'Build the verification that proves all 1,400 ended up in the right state',
        weights: { 'dom.automation': 2, 'sty.monitoring': 3, 'sty.building': 2, 'wrk.proactive': 3, 'sty.analysis': 2 },
        rationale: 'building verification that a change actually took effect everywhere',
      },
      {
        id: 'd',
        label: 'Plan and run it as a controlled change with a rollback everyone has agreed',
        weights: { 'dom.operations': 3, 'sty.policy': 2, 'wrk.project': 3, 'wrk.continuous': 2 },
        rationale: 'running a large change as a controlled, reversible project',
      },
    ],
  },

  {
    id: 'd08-onprem-or-cloud',
    stage: 'differentiator',
    category: 'systems-vs-cloud',
    triggers: ['dom.systems', 'dom.cloud'],
    setup:
      'The same application has to run reliably. You can build it on hardware in a room you can walk into, or on infrastructure you will only ever see through an API.',
    frame: 'Which version of the job appeals more?',
    options: [
      {
        id: 'a',
        label: 'The one where you can physically see it, and you own every layer',
        weights: { 'dom.systems': 3, 'abs.physical': 3, 'abs.os': 3, 'wrk.continuous': 2 },
        rationale: 'preferring infrastructure you own end to end and can physically reach',
      },
      {
        id: 'b',
        label: 'The one where the whole environment is a file you can rebuild in ten minutes',
        terms: ['iac'],
        weights: { 'dom.cloud': 3, 'dom.automation': 3, 'abs.cloud': 3, 'abs.code': 2, 'wrk.automation': 3 },
        rationale: 'preferring infrastructure that is describable and rebuildable in code',
      },
      {
        id: 'c',
        label: 'Whichever one — the interesting part is designing how it survives failure',
        weights: { 'sty.architecture': 3, 'wrk.design': 3, 'sty.analysis': 2 },
        rationale: 'caring about failure design more than the platform it runs on',
      },
    ],
  },

  {
    id: 'd09-attack-or-defend',
    stage: 'differentiator',
    category: 'security-orientation',
    triggers: ['dom.cybersecurity'],
    setup:
      'A new customer-facing system goes live in six weeks. You get one week on it, and you can choose how to spend it.',
    frame: 'Which week sounds better?',
    options: [
      {
        id: 'a',
        label: 'Trying to break into it, and proving exactly how far you could get',
        weights: { 'sec.offensive': 3, 'sty.investigation': 3, 'wrk.deep': 3, 'abs.application': 2 },
        rationale: 'wanting to break a system to prove what is possible',
      },
      {
        id: 'b',
        label: 'Making sure that if anyone did, you would see it within minutes',
        weights: { 'sec.detection': 3, 'sty.monitoring': 3, 'sty.building': 2, 'wrk.proactive': 3 },
        rationale: 'wanting to be certain an attack would be noticed',
      },
      {
        id: 'c',
        label: 'Reviewing the design and closing the gaps before it exists',
        weights: { 'sec.architecture': 3, 'sec.prevention': 3, 'sty.architecture': 3, 'wrk.design': 3 },
        rationale: 'wanting to close gaps at the design stage',
      },
      {
        id: 'd',
        label: 'Checking it against what you are obliged to prove, and evidencing that',
        weights: { 'sec.governance': 3, 'sty.policy': 3, 'wrk.project': 3, 'sty.analysis': 2 },
        rationale: 'wanting to prove compliance obligations are genuinely met',
      },
    ],
  },

  {
    id: 'd10-build-or-design',
    stage: 'differentiator',
    category: 'seniority-style',
    triggers: ['sty.architecture', 'sty.building'],
    setup:
      'A large piece of work is starting. There is a role designing what gets built, and a role building it. Both are respected. Both are needed.',
    frame: 'Which would you rather have on your name?',
    options: [
      {
        id: 'a',
        label: 'The design — deciding the shape, and defending why, in writing',
        weights: { 'sty.architecture': 3, 'wrk.design': 3, 'sty.policy': 2, 'sec.architecture': 1 },
        rationale: 'preferring to decide the shape of a system and justify it',
      },
      {
        id: 'b',
        label: 'The build — hands on it, making the design survive contact with reality',
        weights: { 'sty.building': 3, 'wrk.project': 3, 'sty.troubleshooting': 2, 'wrk.deep': 2 },
        rationale: 'preferring to build the thing and make the design work in practice',
      },
      {
        id: 'c',
        label: 'The running of it afterwards, because that is where the truth shows up',
        weights: { 'dom.operations': 3, 'sty.monitoring': 3, 'wrk.continuous': 3, 'wrk.reactive': 2 },
        rationale: 'preferring to operate a system, where its real behaviour appears',
      },
    ],
  },

  {
    id: 'd11-log-pipeline',
    stage: 'differentiator',
    category: 'detection-vs-data',
    triggers: ['sec.detection', 'dom.data'],
    setup:
      'The alerting is bad. Half the systems do not send logs at all, and the ones that do produce noise the team has learned to ignore.',
    frame: 'Which half of that problem do you want?',
    options: [
      {
        id: 'a',
        label: 'Getting the missing data in, and into a shape that can actually be queried',
        weights: { 'dom.data': 3, 'abs.data': 3, 'sty.building': 3, 'dom.automation': 2 },
        rationale: 'building the data pipeline that makes analysis possible',
      },
      {
        id: 'b',
        label: 'Writing the rules that turn that data into alerts worth waking up for',
        weights: { 'dom.cybersecurity': 3, 'sec.detection': 3, 'sty.building': 2, 'sty.analysis': 3 },
        rationale: 'writing the detections that make data actionable',
      },
      {
        id: 'c',
        label: 'Going through the noise by hand first, to learn what normal actually looks like',
        terms: ['baseline'],
        weights: { 'sty.investigation': 3, 'sty.analysis': 3, 'wrk.deep': 3, 'sec.detection': 2 },
        rationale: 'learning what normal looks like before automating judgement about it',
      },
    ],
  },

  {
    id: 'd12-enterprise-or-carrier',
    stage: 'differentiator',
    category: 'networking-scale',
    triggers: ['dom.networking', 'abs.network'],
    setup:
      'Two networking jobs, same pay. One is a company with 40 sites and 6,000 staff. The other is a provider whose network other companies buy access to.',
    frame: 'Which network would you rather be responsible for?',
    options: [
      {
        id: 'a',
        label: 'The company one — you know the users, the applications and why each thing exists',
        weights: { 'dom.networking': 3, 'dom.operations': 2, 'sty.troubleshooting': 3, 'sty.support': 2 },
        rationale: 'preferring a network where you know the users and the applications',
      },
      {
        id: 'b',
        label: 'The provider one — enormous scale, and the protocols are the whole job',
        terms: ['bgp', 'mpls'],
        weights: { 'dom.networking': 3, 'abs.network': 3, 'sty.architecture': 3, 'wrk.deep': 3, 'wrk.continuous': 2 },
        rationale: 'preferring scale and protocol depth over proximity to users',
      },
      {
        id: 'c',
        label: 'Either, as long as I am the one deciding what gets allowed across it',
        weights: { 'dom.cybersecurity': 3, 'sec.network': 3, 'sty.policy': 3, 'sec.prevention': 2 },
        rationale: 'caring about controlling what crosses a network more than its scale',
      },
    ],
  },

  {
    id: 'd13-factory-network',
    stage: 'differentiator',
    category: 'ot',
    triggers: ['sec.network', 'abs.physical'],
    setup:
      'A production line runs on equipment installed in 2009. It cannot be patched, cannot be rebooted during working hours, and speaks a protocol with no authentication at all.',
    frame: 'How does that problem strike you?',
    options: [
      {
        id: 'a',
        label: 'Genuinely interesting — the constraints make the usual answers unavailable',
        terms: ['ot', 'plc'],
        weights: { 'dom.cybersecurity': 3, 'dom.networking': 3, 'sec.network': 3, 'sec.architecture': 3, 'abs.physical': 3, 'wrk.design': 2 },
        rationale: 'being drawn to security problems where the standard answers do not apply',
      },
      {
        id: 'b',
        label: 'Solvable — wall it off completely and watch everything crossing the boundary',
        terms: ['segmentation'],
        weights: { 'dom.cybersecurity': 3, 'sec.network': 3, 'sec.prevention': 3, 'sty.architecture': 2 },
        rationale: 'reaching for isolation and boundary monitoring as the answer',
      },
      {
        id: 'c',
        label: 'A risk decision — document it, quantify it, and get someone to own it',
        weights: { 'sec.governance': 3, 'sty.policy': 3, 'sty.analysis': 2, 'wrk.project': 2 },
        rationale: 'treating an unfixable technical problem as a risk to be owned',
      },
      {
        id: 'd',
        label: 'Not for me — I would rather work where things can actually be fixed',
        weights: { 'sty.building': 2, 'dom.software': 1, 'dom.cloud': 1, 'wrk.project': 1 },
        rationale: 'preferring environments where problems can be properly fixed',
      },
    ],
  },

  {
    id: 'd14-shift-or-project',
    stage: 'differentiator',
    category: 'work-rhythm',
    triggers: ['wrk.reactive', 'wrk.proactive'],
    setup:
      'Two teams want you. One works a rota covering a system that never stops. The other works project by project, with deadlines but predictable hours.',
    frame: 'Which do you take?',
    options: [
      {
        id: 'a',
        label: 'The rota — I like a job where something is always actually happening',
        weights: { 'dom.operations': 3, 'wrk.continuous': 3, 'wrk.reactive': 3, 'sty.monitoring': 2 },
        rationale: 'preferring continuous operations over project cycles',
      },
      {
        id: 'b',
        label: 'The projects — I want to finish things and see them delivered',
        weights: { 'wrk.project': 3, 'sty.building': 3, 'wrk.design': 2 },
        rationale: 'preferring defined projects with an end point',
      },
      {
        id: 'c',
        label: 'Neither, really — I want long stretches on one hard problem',
        weights: { 'wrk.deep': 3, 'sty.investigation': 2, 'sty.analysis': 2 },
        rationale: 'preferring long uninterrupted work on a single hard problem',
      },
    ],
  },

  {
    id: 'd15-someone-is-stuck',
    stage: 'differentiator',
    category: 'support',
    triggers: ['sty.support', 'dom.operations'],
    setup:
      'Someone is at your desk. They cannot do their job, they are already frustrated, and the cause is something they will not understand even after you explain it.',
    frame: 'How does that land with you?',
    options: [
      {
        id: 'a',
        label: 'Fine — fixing it for them is the satisfying part',
        weights: { 'dom.operations': 3, 'sty.support': 3, 'wrk.reactive': 3 },
        rationale: 'finding direct help satisfying rather than draining',
      },
      {
        id: 'b',
        label: 'Fine once, but I would rather fix why it keeps happening to everyone',
        weights: { 'sty.building': 2, 'wrk.proactive': 3, 'dom.systems': 2, 'sty.automating': 2 },
        rationale: 'preferring to fix the cause for everyone over fixing each instance',
      },
      {
        id: 'c',
        label: 'I would rather work on systems than on the conversation about systems',
        weights: { 'wrk.deep': 3, 'sty.architecture': 2, 'abs.code': 1, 'sty.troubleshooting': 2 },
        rationale: 'preferring to work on systems rather than with the people using them',
      },
    ],
  },

  {
    id: 'd16-thousand-findings',
    stage: 'differentiator',
    category: 'vulnerability',
    triggers: ['sec.prevention', 'sty.analysis'],
    setup:
      'A scan returns 11,400 findings across the estate. Roughly 300 are genuinely urgent. Nobody has capacity to fix even those this quarter.',
    frame: 'What is the part of this you want to own?',
    options: [
      {
        id: 'a',
        label: 'Working out which 300 those are, and being able to defend the ranking',
        terms: ['cve'],
        weights: { 'dom.cybersecurity': 3, 'sty.analysis': 3, 'sec.prevention': 3, 'sec.governance': 2 },
        rationale: 'turning an overwhelming list into a defensible priority order',
      },
      {
        id: 'b',
        label: 'Proving which ones are actually exploitable here, rather than in theory',
        weights: { 'sec.offensive': 3, 'sty.investigation': 3, 'wrk.deep': 2 },
        rationale: 'proving real exploitability rather than accepting theoretical severity',
      },
      {
        id: 'c',
        label: 'Building the automation that fixes the boring 8,000 without anyone touching them',
        terms: ['patch'],
        weights: { 'dom.automation': 3, 'dom.systems': 2, 'sty.automating': 3, 'wrk.automation': 3 },
        rationale: 'automating remediation at scale',
      },
      {
        id: 'd',
        label: 'Getting agreement on what the organisation will accept, and what it will not',
        weights: { 'sec.governance': 3, 'sty.policy': 3, 'wrk.project': 3 },
        rationale: 'establishing what level of risk an organisation formally accepts',
      },
    ],
  },

  {
    id: 'd17-code-depth',
    stage: 'differentiator',
    category: 'code',
    triggers: ['abs.code', 'dom.software'],
    setup:
      'You have written something useful. It works. Other people now depend on it, and they keep asking for changes.',
    frame: 'Which of these do you actually want?',
    options: [
      {
        id: 'a',
        label: 'To keep going — build it properly, with tests, structure and a real interface',
        weights: { 'dom.software': 3, 'abs.code': 3, 'abs.application': 3, 'sty.building': 3, 'wrk.deep': 3 },
        rationale: 'wanting to build software properly rather than keep it as a script',
      },
      {
        id: 'b',
        label: 'To keep it small — it is a tool that removes a chore, not a product',
        weights: { 'dom.automation': 3, 'sty.automating': 3, 'wrk.automation': 3, 'dom.systems': 2 },
        rationale: 'wanting code as a means of removing work rather than as a product',
      },
      {
        id: 'c',
        label: 'To use it to pull data out of five systems that do not talk to each other',
        terms: ['api'],
        weights: { 'dom.automation': 3, 'dom.data': 2, 'abs.code': 2, 'sty.building': 2, 'sty.analysis': 2 },
        rationale: 'using code to connect systems that were not designed to connect',
      },
    ],
  },

  {
    id: 'd18-monitor-what',
    stage: 'differentiator',
    category: 'monitoring',
    triggers: ['sty.monitoring'],
    setup:
      'You are building a dashboard from scratch, and you get to decide what goes on it. Everyone will look at it every morning.',
    frame: 'What goes at the top?',
    options: [
      {
        id: 'a',
        label: 'Whether users are actually having a good experience right now',
        terms: ['slo'],
        weights: { 'dom.operations': 3, 'sty.monitoring': 3, 'sty.analysis': 2, 'wrk.continuous': 2 },
        rationale: 'measuring the experience users are actually having',
      },
      {
        id: 'b',
        label: 'Anything on the network that has changed since yesterday',
        weights: { 'dom.networking': 3, 'abs.network': 3, 'sty.monitoring': 2, 'sec.detection': 2 },
        rationale: 'watching for change on the network as the primary signal',
      },
      {
        id: 'c',
        label: 'Anything that looks like someone doing something they should not',
        weights: { 'dom.cybersecurity': 3, 'sec.detection': 3, 'sty.investigation': 2 },
        rationale: 'prioritising signs of misuse over signs of failure',
      },
      {
        id: 'd',
        label: 'What is drifting away from how it is supposed to be configured',
        weights: { 'dom.automation': 3, 'sty.policy': 3, 'wrk.automation': 2, 'sec.prevention': 2 },
        rationale: 'watching for configuration drift from an intended state',
      },
    ],
  },

  {
    id: 'd19-data-role',
    stage: 'differentiator',
    category: 'data',
    triggers: ['dom.data', 'abs.data'],
    setup:
      'A dataset that matters to the business is unreliable, slow, and nobody fully understands how it is produced.',
    frame: 'Which of these would you rather be responsible for?',
    options: [
      {
        id: 'a',
        label: 'The questions people ask of it, and giving honest answers',
        weights: { 'dom.data': 3, 'sty.analysis': 3, 'abs.data': 3, 'sty.support': 2 },
        rationale: 'answering questions from data and standing behind the answer',
      },
      {
        id: 'b',
        label: 'How it gets built and delivered, reliably, every day',
        weights: { 'dom.data': 3, 'dom.automation': 3, 'sty.building': 3, 'abs.code': 2 },
        rationale: 'owning the pipeline that produces data reliably',
      },
      {
        id: 'c',
        label: 'The database underneath — that it is correct, fast and recoverable',
        weights: { 'dom.data': 3, 'dom.systems': 2, 'abs.data': 3, 'wrk.continuous': 3, 'sty.troubleshooting': 2 },
        rationale: 'owning correctness, performance and recoverability of stored data',
      },
      {
        id: 'd',
        label: 'Who is allowed to see it, and proving that rule holds',
        weights: { 'dom.cybersecurity': 2, 'sec.governance': 3, 'sec.identity': 2, 'sty.policy': 3 },
        rationale: 'controlling and evidencing who may access data',
      },
    ],
  },

  {
    id: 'd20-hardening-target',
    stage: 'differentiator',
    category: 'endpoint',
    triggers: ['sec.endpoint', 'dom.systems'],
    setup:
      'You have been asked to make the environment "more secure" with no further guidance and a reasonable budget.',
    frame: 'Where would you actually start?',
    options: [
      {
        id: 'a',
        label: 'The machines themselves — hardening, patching, removing what is not needed',
        weights: { 'dom.systems': 3, 'sec.endpoint': 3, 'sec.prevention': 3, 'abs.os': 3 },
        rationale: 'starting with hardening the machines themselves',
      },
      {
        id: 'b',
        label: 'The accounts — who can do what, and how much of it is unnecessary',
        terms: ['least-privilege'],
        weights: { 'sec.identity': 3, 'abs.identity': 3, 'sec.prevention': 2, 'sty.policy': 3 },
        rationale: 'starting with who can do what',
      },
      {
        id: 'c',
        label: 'The paths between things — what can reach what, and why it needs to',
        terms: ['segmentation'],
        weights: { 'dom.networking': 2, 'sec.network': 3, 'sec.architecture': 3, 'abs.network': 3 },
        rationale: 'starting with what is allowed to reach what',
      },
      {
        id: 'd',
        label: 'Visibility — you cannot secure what you cannot see, so measure first',
        weights: { 'sec.detection': 3, 'sty.monitoring': 3, 'sty.analysis': 3, 'wrk.proactive': 2 },
        rationale: 'starting with visibility before controls',
      },
    ],
  },

  {
    id: 'd21-two-hours',
    stage: 'differentiator',
    category: 'preference',
    setup:
      'You have two free hours and nobody is asking anything of you. Both of these are available and neither is work you owe anyone.',
    frame: 'Which do you actually pick?',
    options: [
      {
        id: 'a',
        label: 'Take apart something that already works to understand exactly how it does',
        weights: { 'sty.investigation': 3, 'wrk.deep': 3, 'abs.network': 1, 'abs.os': 1, 'sty.analysis': 2 },
        rationale: 'taking systems apart to understand them, without needing a reason',
      },
      {
        id: 'b',
        label: 'Build something small that did not exist this morning',
        weights: { 'sty.building': 3, 'abs.code': 2, 'dom.software': 2, 'wrk.project': 2 },
        rationale: 'building something new for its own sake',
      },
      {
        id: 'c',
        label: 'Improve something that annoys you every single week',
        weights: { 'sty.automating': 3, 'dom.automation': 3, 'wrk.automation': 3, 'wrk.proactive': 2 },
        rationale: 'removing a recurring annoyance permanently',
      },
      {
        id: 'd',
        label: 'Map out how a whole system fits together, on paper, properly',
        weights: { 'sty.architecture': 3, 'wrk.design': 3, 'sty.analysis': 2 },
        rationale: 'mapping how a whole system fits together',
      },
    ],
  },

  {
    /* Added after measuring: exactly ONE option in the whole bank carried both
       cloud and cybersecurity weight, so Cloud Security Engineer (cloud 10 +
       cyber 10) was unreachable no matter how a cloud-security-shaped person
       answered. Every option here is genuinely both, and they separate the
       sub-specialisations from each other rather than from "not security". */
    id: 'd23-leaked-key',
    stage: 'differentiator',
    category: 'cloud-security',
    triggers: ['dom.cloud', 'dom.cybersecurity', 'abs.cloud'],
    setup:
      'An access key for the company’s cloud environment has been sitting in a public code repository. It is three months old, it still works, and it belongs to an account nobody can name an owner for.',
    frame: 'Which piece of this do you want?',
    options: [
      {
        id: 'a',
        label: 'Establish exactly what that key could reach — and what it actually did reach',
        terms: ['iam', 'log'],
        weights: {
          'dom.cloud': 3, 'dom.cybersecurity': 3,
          'sty.investigation': 3, 'sec.detection': 3, 'sec.identity': 2,
          'abs.cloud': 3, 'abs.identity': 2, 'wrk.reactive': 2,
        },
        rationale: 'establishing the real reach of an exposed cloud credential',
      },
      {
        id: 'b',
        label: 'Make long-lived keys impossible, so workloads get short-lived identities instead',
        terms: ['iam', 'zero-trust'],
        weights: {
          'dom.cloud': 3, 'dom.cybersecurity': 3,
          'sec.identity': 3, 'sec.prevention': 3, 'sec.architecture': 2,
          'abs.identity': 3, 'abs.cloud': 3, 'wrk.proactive': 3, 'sty.architecture': 2,
        },
        rationale: 'removing a whole class of credential risk rather than rotating one key',
      },
      {
        id: 'c',
        label: 'Get a check into the pipeline so a secret can never be committed again',
        terms: ['ci-cd'],
        weights: {
          'dom.cloud': 2, 'dom.cybersecurity': 3, 'dom.automation': 3, 'dom.software': 2,
          'sec.prevention': 3, 'sty.automating': 3, 'abs.code': 3, 'wrk.automation': 3,
        },
        rationale: 'putting the guardrail into the delivery pipeline itself',
      },
      {
        id: 'd',
        label: 'Redesign the account boundaries so any single key’s blast radius is small',
        terms: ['segmentation', 'least-privilege'],
        weights: {
          'dom.cloud': 3, 'dom.cybersecurity': 3,
          'sec.architecture': 3, 'sec.prevention': 2, 'sty.architecture': 3,
          'abs.cloud': 3, 'wrk.design': 3,
        },
        rationale: 'designing boundaries so one compromise cannot become total',
      },
      {
        id: 'e',
        label: 'Find every other credential like it across the whole estate, automatically',
        weights: {
          'dom.cloud': 2, 'dom.cybersecurity': 3, 'dom.automation': 3,
          'sec.detection': 2, 'sec.governance': 2, 'sty.automating': 3, 'sty.analysis': 2,
          'abs.cloud': 2, 'wrk.automation': 3,
        },
        rationale: 'sweeping an entire estate for the same weakness rather than fixing one instance',
      },
    ],
  },

  {
    id: 'd22-blame-and-pressure',
    stage: 'differentiator',
    category: 'work-rhythm',
    triggers: ['wrk.reactive', 'wrk.continuous'],
    setup:
      'Something is broken, forty people cannot work, and three of them are standing behind you asking for an estimate you do not have yet.',
    frame: 'Honestly — how is that for you?',
    options: [
      {
        id: 'a',
        label: 'Fine. The pressure helps, and I would rather be the one holding it',
        weights: { 'wrk.reactive': 3, 'dom.operations': 3, 'sec.response': 2, 'sty.troubleshooting': 3 },
        rationale: 'working well under live pressure',
      },
      {
        id: 'b',
        label: 'Survivable, but I would rather have built the thing that prevented it',
        weights: { 'wrk.proactive': 3, 'sec.prevention': 2, 'sty.architecture': 2, 'wrk.design': 2 },
        rationale: 'preferring to prevent the emergency than to handle it',
      },
      {
        id: 'c',
        label: 'I would rather have the version of this where I get to think properly first',
        weights: { 'wrk.deep': 3, 'sty.investigation': 2, 'sty.analysis': 3 },
        rationale: 'needing time to think properly rather than working at incident pace',
      },
    ],
  },
];
