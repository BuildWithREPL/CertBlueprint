import type { RoleCore } from '../../types';

/**
 * Role cores — the ONLY role data that reaches the browser.
 *
 * Each entry is what the matcher needs to rank a role and what the results
 * page needs to render it: identity, the domains it spans, and its position in
 * dimension space. Everything else about a role — what you actually do, the
 * technologies, the certifications, the honest downside — lives in the content
 * files beside this one and is never shipped to a client. Role data was 51% of
 * the client bundle before this split, almost all of it prose the matcher never
 * reads.
 *
 * Vectors are SPARSE: list only what genuinely describes the role, because an
 * omitted dimension is zero. A role that is mid-high on everything correlates
 * with everyone and becomes a false attractor in every single result.
 *
 * Scale is 0-10, and only relative magnitude WITHIN a role matters — the
 * similarity metric compares direction, not size. See engine/scoring.ts.
 */
export const ROLE_CORES: RoleCore[] = [
  {
    slug: "network-engineer",
    name: "Network Engineer",
    purpose: "Decide how information gets from one place to another — and find out why it suddenly does not.",
    domains: ["networking"],
    vector: {
      "dom.networking": 10, "dom.operations": 4, "dom.cybersecurity": 3, "dom.systems": 3, "dom.automation": 3, "dom.cloud": 3,
      "sty.troubleshooting": 9, "sty.architecture": 6, "sty.investigation": 5, "sty.monitoring": 5, "sty.building": 4, "sty.policy": 3,
      "abs.network": 10, "abs.physical": 5, "abs.os": 3, "abs.cloud": 3,
      "sec.network": 4, "sec.prevention": 2,
      "wrk.reactive": 7, "wrk.proactive": 5, "wrk.deep": 6, "wrk.project": 5, "wrk.design": 5, "wrk.continuous": 5,
    },
  },
  {
    slug: "network-administrator",
    name: "Network Administrator",
    purpose: "Keep an existing network healthy, and be the person who fixes it when it is not.",
    domains: ["networking", "operations"],
    vector: {
      "dom.networking": 8, "dom.operations": 8, "dom.systems": 3, "dom.cybersecurity": 2,
      "sty.troubleshooting": 9, "sty.monitoring": 7, "sty.support": 5, "sty.investigation": 4, "sty.architecture": 2,
      "abs.network": 8, "abs.physical": 5, "abs.os": 3,
      "sec.network": 2,
      "wrk.reactive": 9, "wrk.continuous": 7, "wrk.proactive": 3, "wrk.project": 3,
    },
  },
  {
    slug: "service-provider-network-engineer",
    name: "Service Provider Network Engineer",
    purpose: "Run the backbone everyone else’s network plugs into.",
    domains: ["networking"],
    vector: {
      "dom.networking": 10, "dom.operations": 5, "dom.automation": 4, "dom.cybersecurity": 2, "dom.cloud": 3,
      "sty.architecture": 8, "sty.troubleshooting": 8, "sty.investigation": 6, "sty.monitoring": 5, "sty.building": 4,
      "abs.network": 10, "abs.physical": 6,
      "sec.network": 2,
      "wrk.design": 7, "wrk.deep": 8, "wrk.reactive": 6, "wrk.continuous": 7, "wrk.project": 5,
    },
  },
  {
    slug: "network-security-engineer",
    name: "Network Security Engineer",
    purpose: "Protect the pathways that information travels through.",
    domains: ["cybersecurity", "networking"],
    vector: {
      "dom.cybersecurity": 10, "dom.networking": 9, "dom.systems": 3, "dom.cloud": 4, "dom.automation": 4, "dom.operations": 4,
      "sty.troubleshooting": 9, "sty.investigation": 7, "sty.architecture": 7, "sty.policy": 8, "sty.monitoring": 7, "sty.building": 5,
      "abs.network": 10, "abs.identity": 5, "abs.os": 3, "abs.cloud": 4, "abs.physical": 3,
      "sec.network": 10, "sec.prevention": 9, "sec.detection": 6, "sec.identity": 5, "sec.endpoint": 4, "sec.architecture": 6,
      "wrk.proactive": 7, "wrk.reactive": 6, "wrk.deep": 6, "wrk.design": 6, "wrk.project": 6, "wrk.continuous": 5,
    },
  },
  {
    slug: "network-automation-engineer",
    name: "Network Automation Engineer",
    purpose: "Configure a thousand network devices with code instead of a thousand logins.",
    domains: ["networking", "software"],
    vector: {
      "dom.networking": 8, "dom.automation": 10, "dom.software": 6, "dom.cloud": 5, "dom.systems": 4,
      "sty.automating": 10, "sty.building": 8, "sty.troubleshooting": 5, "sty.architecture": 5, "sty.analysis": 4,
      "abs.network": 8, "abs.code": 9, "abs.cloud": 4,
      "sec.network": 2,
      "wrk.automation": 10, "wrk.proactive": 8, "wrk.deep": 7, "wrk.project": 6, "wrk.design": 5,
    },
  },
  {
    slug: "cloud-network-engineer",
    name: "Cloud Network Engineer",
    purpose: "Solve routing problems that exist only as API calls.",
    domains: ["cloud", "networking"],
    vector: {
      "dom.cloud": 9, "dom.networking": 9, "dom.automation": 5, "dom.cybersecurity": 4, "dom.systems": 3,
      "sty.architecture": 8, "sty.troubleshooting": 7, "sty.building": 6, "sty.policy": 4, "sty.automating": 5,
      "abs.cloud": 9, "abs.network": 9, "abs.code": 4, "abs.identity": 4,
      "sec.network": 5, "sec.prevention": 3,
      "wrk.design": 7, "wrk.project": 6, "wrk.automation": 6, "wrk.deep": 6, "wrk.reactive": 4,
    },
  },
  {
    slug: "wireless-engineer",
    name: "Wireless Engineer",
    purpose: "Make a radio signal work reliably in a building full of obstacles and interference.",
    domains: ["networking"],
    vector: {
      "dom.networking": 9, "dom.operations": 5, "dom.cybersecurity": 3,
      "sty.troubleshooting": 9, "sty.analysis": 6, "sty.architecture": 5, "sty.investigation": 5,
      "abs.physical": 9, "abs.network": 7, "abs.identity": 3,
      "sec.network": 3,
      "wrk.project": 7, "wrk.reactive": 6, "wrk.deep": 5, "wrk.design": 5,
    },
  },
  {
    slug: "data-center-engineer",
    name: "Data Center Engineer",
    purpose: "Run the physical place where thousands of machines live and talk to each other.",
    domains: ["networking", "systems"],
    vector: {
      "dom.networking": 8, "dom.systems": 7, "dom.operations": 6, "dom.cloud": 3,
      "sty.architecture": 6, "sty.troubleshooting": 7, "sty.building": 7, "sty.monitoring": 4,
      "abs.physical": 10, "abs.network": 7, "abs.os": 4,
      "wrk.project": 8, "wrk.continuous": 6, "wrk.reactive": 5, "wrk.design": 5,
    },
  },
  {
    slug: "security-engineer",
    name: "Security Engineer",
    purpose: "Build and run the controls that everyone else’s safety quietly depends on.",
    domains: ["cybersecurity", "systems"],
    vector: {
      "dom.cybersecurity": 10, "dom.systems": 7, "dom.cloud": 5, "dom.automation": 5, "dom.networking": 4, "dom.operations": 4,
      "sty.building": 8, "sty.architecture": 7, "sty.policy": 7, "sty.troubleshooting": 6, "sty.investigation": 5, "sty.automating": 6, "sty.monitoring": 5,
      "abs.os": 7, "abs.identity": 6, "abs.network": 5, "abs.cloud": 5, "abs.code": 4, "abs.application": 4,
      "sec.prevention": 9, "sec.endpoint": 8, "sec.detection": 7, "sec.identity": 6, "sec.architecture": 6, "sec.network": 5, "sec.governance": 4,
      "wrk.proactive": 9, "wrk.project": 7, "wrk.design": 6, "wrk.deep": 6, "wrk.automation": 6, "wrk.reactive": 4,
    },
  },
  {
    slug: "soc-analyst",
    name: "SOC Analyst",
    purpose: "Decide, quickly, which of today’s thousand alerts is the one that matters.",
    domains: ["cybersecurity", "operations"],
    vector: {
      "dom.cybersecurity": 10, "dom.operations": 8, "dom.networking": 4, "dom.systems": 4, "dom.data": 3,
      "sty.investigation": 9, "sty.monitoring": 9, "sty.analysis": 7, "sty.troubleshooting": 5, "sty.support": 3,
      "abs.os": 5, "abs.network": 6, "abs.identity": 4, "abs.data": 4, "abs.application": 3,
      "sec.detection": 10, "sec.response": 7, "sec.endpoint": 6, "sec.network": 5, "sec.identity": 4,
      "wrk.reactive": 9, "wrk.continuous": 8, "wrk.deep": 4, "wrk.proactive": 3,
    },
  },
  {
    slug: "incident-responder",
    name: "Incident Responder",
    purpose: "Take control of a compromise that is happening right now.",
    domains: ["cybersecurity"],
    vector: {
      "dom.cybersecurity": 10, "dom.operations": 6, "dom.systems": 5, "dom.networking": 4,
      "sty.investigation": 10, "sty.troubleshooting": 7, "sty.analysis": 7, "sty.monitoring": 4,
      "abs.os": 7, "abs.network": 6, "abs.identity": 5, "abs.application": 3,
      "sec.response": 10, "sec.detection": 8, "sec.endpoint": 7, "sec.identity": 5, "sec.network": 5,
      "wrk.reactive": 10, "wrk.deep": 7, "wrk.continuous": 5, "wrk.proactive": 3,
    },
  },
  {
    slug: "threat-hunter",
    name: "Threat Hunter",
    purpose: "Go looking for the intruder nobody has raised an alert about.",
    domains: ["cybersecurity", "data"],
    vector: {
      "dom.cybersecurity": 10, "dom.data": 6, "dom.operations": 4, "dom.automation": 4,
      "sty.investigation": 10, "sty.analysis": 9, "sty.monitoring": 5, "sty.building": 4,
      "abs.data": 7, "abs.os": 6, "abs.network": 6, "abs.code": 4,
      "sec.detection": 10, "sec.response": 6, "sec.endpoint": 6, "sec.network": 5, "sec.offensive": 4,
      "wrk.proactive": 10, "wrk.deep": 10, "wrk.reactive": 3,
    },
  },
  {
    slug: "detection-engineer",
    name: "Detection Engineer",
    purpose: "Write the rule that catches it next time — without crying wolf.",
    domains: ["cybersecurity", "data", "software"],
    vector: {
      "dom.cybersecurity": 10, "dom.data": 7, "dom.software": 6, "dom.automation": 7,
      "sty.building": 9, "sty.analysis": 8, "sty.investigation": 7, "sty.automating": 7, "sty.monitoring": 6,
      "abs.data": 8, "abs.code": 7, "abs.os": 5, "abs.network": 5,
      "sec.detection": 10, "sec.endpoint": 5, "sec.network": 5, "sec.response": 4,
      "wrk.proactive": 9, "wrk.deep": 8, "wrk.automation": 8, "wrk.project": 5,
    },
  },
  {
    slug: "digital-forensics-analyst",
    name: "Digital Forensics Analyst",
    purpose: "Reconstruct exactly what happened, in a way that would survive a courtroom.",
    domains: ["cybersecurity"],
    vector: {
      "dom.cybersecurity": 10, "dom.data": 4, "dom.systems": 5,
      "sty.investigation": 10, "sty.analysis": 8, "sty.policy": 4,
      "abs.os": 9, "abs.data": 6, "abs.network": 4, "abs.physical": 3,
      "sec.response": 8, "sec.detection": 6, "sec.endpoint": 7, "sec.governance": 4,
      "wrk.deep": 10, "wrk.project": 6, "wrk.reactive": 5,
    },
  },
  {
    slug: "penetration-tester",
    name: "Penetration Tester",
    purpose: "Break in on purpose, with permission, so the gaps get closed first.",
    domains: ["cybersecurity"],
    vector: {
      "dom.cybersecurity": 10, "dom.software": 5, "dom.networking": 5, "dom.systems": 5, "dom.automation": 4,
      "sty.investigation": 9, "sty.analysis": 7, "sty.building": 4, "sty.troubleshooting": 5,
      "abs.application": 7, "abs.network": 6, "abs.os": 7, "abs.code": 6, "abs.identity": 5,
      "sec.offensive": 10, "sec.prevention": 4, "sec.detection": 3, "sec.identity": 4,
      "wrk.project": 8, "wrk.deep": 9, "wrk.proactive": 6,
    },
  },
  {
    slug: "application-security-engineer",
    name: "Application Security Engineer",
    purpose: "Find and fix the flaws in software before it ships.",
    domains: ["cybersecurity", "software"],
    vector: {
      "dom.cybersecurity": 9, "dom.software": 9, "dom.cloud": 5, "dom.automation": 5,
      "sty.investigation": 7, "sty.building": 7, "sty.architecture": 6, "sty.analysis": 6, "sty.policy": 4,
      "abs.code": 10, "abs.application": 10, "abs.cloud": 4,
      "sec.offensive": 7, "sec.prevention": 8, "sec.architecture": 6,
      "wrk.deep": 8, "wrk.proactive": 8, "wrk.project": 6, "wrk.design": 6,
    },
  },
  {
    slug: "identity-engineer",
    name: "Identity Engineer",
    purpose: "Own the system that decides who everyone is and what they may reach.",
    domains: ["cybersecurity", "systems", "cloud"],
    vector: {
      "dom.cybersecurity": 9, "dom.systems": 8, "dom.cloud": 6, "dom.automation": 5, "dom.operations": 3,
      "sty.policy": 9, "sty.architecture": 7, "sty.building": 6, "sty.troubleshooting": 6, "sty.automating": 5,
      "abs.identity": 10, "abs.os": 6, "abs.cloud": 6, "abs.application": 5, "abs.code": 3,
      "sec.identity": 10, "sec.prevention": 8, "sec.architecture": 6, "sec.governance": 6, "sec.endpoint": 4,
      "wrk.proactive": 8, "wrk.project": 7, "wrk.design": 6, "wrk.deep": 6, "wrk.reactive": 4,
    },
  },
  {
    slug: "zero-trust-engineer",
    name: "Zero Trust Engineer",
    purpose: "Stop trusting anything for being \"inside\", and build what replaces that assumption.",
    domains: ["cybersecurity", "networking", "cloud"],
    vector: {
      "dom.cybersecurity": 10, "dom.networking": 8, "dom.cloud": 6, "dom.systems": 6, "dom.automation": 4,
      "sty.architecture": 10, "sty.policy": 9, "sty.building": 6, "sty.troubleshooting": 5, "sty.investigation": 4,
      "abs.network": 8, "abs.identity": 9, "abs.cloud": 5, "abs.os": 4,
      "sec.architecture": 10, "sec.network": 9, "sec.identity": 9, "sec.prevention": 9, "sec.endpoint": 6, "sec.governance": 5,
      "wrk.design": 9, "wrk.proactive": 9, "wrk.project": 8, "wrk.deep": 6,
    },
  },
  {
    slug: "cloud-security-engineer",
    name: "Cloud Security Engineer",
    purpose: "Secure infrastructure that can be created, changed and destroyed in seconds.",
    domains: ["cloud", "cybersecurity"],
    vector: {
      "dom.cloud": 10, "dom.cybersecurity": 10, "dom.automation": 7, "dom.systems": 5, "dom.networking": 5, "dom.software": 4,
      "sty.policy": 8, "sty.architecture": 8, "sty.building": 7, "sty.investigation": 6, "sty.automating": 7, "sty.monitoring": 5,
      "abs.cloud": 10, "abs.identity": 8, "abs.code": 6, "abs.network": 5, "abs.os": 4,
      "sec.prevention": 9, "sec.identity": 8, "sec.architecture": 7, "sec.detection": 6, "sec.network": 5, "sec.governance": 5,
      "wrk.proactive": 9, "wrk.automation": 8, "wrk.design": 7, "wrk.project": 6, "wrk.deep": 6,
    },
  },
  {
    slug: "devsecops-engineer",
    name: "DevSecOps Engineer",
    purpose: "Put the security checks inside the pipeline, so nobody has to remember them.",
    domains: ["software", "cloud", "cybersecurity"],
    vector: {
      "dom.software": 8, "dom.cloud": 9, "dom.cybersecurity": 9, "dom.automation": 10,
      "sty.automating": 10, "sty.building": 8, "sty.policy": 7, "sty.architecture": 6,
      "abs.code": 9, "abs.cloud": 8, "abs.application": 6, "abs.identity": 5,
      "sec.prevention": 9, "sec.architecture": 6, "sec.governance": 5, "sec.identity": 5,
      "wrk.automation": 10, "wrk.proactive": 9, "wrk.project": 6, "wrk.deep": 6,
    },
  },
  {
    slug: "vulnerability-analyst",
    name: "Vulnerability Management Analyst",
    purpose: "Know what is broken across ten thousand machines, and what to fix first.",
    domains: ["cybersecurity", "systems"],
    vector: {
      "dom.cybersecurity": 9, "dom.systems": 6, "dom.operations": 5, "dom.data": 4,
      "sty.analysis": 8, "sty.policy": 6, "sty.investigation": 5, "sty.monitoring": 6,
      "abs.os": 6, "abs.application": 4, "abs.network": 4, "abs.data": 4,
      "sec.prevention": 8, "sec.endpoint": 6, "sec.governance": 6, "sec.detection": 4, "sec.offensive": 3,
      "wrk.proactive": 8, "wrk.project": 6, "wrk.continuous": 5,
    },
  },
  {
    slug: "grc-analyst",
    name: "GRC Analyst",
    purpose: "Decide what risk is acceptable, and prove the controls actually work.",
    domains: ["cybersecurity"],
    vector: {
      "dom.cybersecurity": 8, "dom.operations": 4, "dom.data": 4,
      "sty.policy": 10, "sty.analysis": 7, "sty.architecture": 4, "sty.investigation": 3, "sty.support": 3,
      "abs.identity": 4, "abs.application": 3, "abs.data": 4,
      "sec.governance": 10, "sec.prevention": 5, "sec.identity": 4, "sec.architecture": 4,
      "wrk.project": 9, "wrk.proactive": 6, "wrk.design": 4, "wrk.deep": 4,
    },
  },
  {
    slug: "ot-security-engineer",
    name: "OT / ICS Security Engineer",
    purpose: "Secure the systems running factories, utilities and physical processes — where a reboot is not an option.",
    domains: ["cybersecurity", "networking"],
    vector: {
      "dom.cybersecurity": 9, "dom.networking": 8, "dom.operations": 6, "dom.systems": 4,
      "sty.architecture": 8, "sty.policy": 6, "sty.monitoring": 7, "sty.troubleshooting": 6, "sty.investigation": 5,
      "abs.physical": 8, "abs.network": 9, "abs.os": 4,
      "sec.network": 9, "sec.architecture": 7, "sec.prevention": 8, "sec.detection": 6, "sec.governance": 5,
      "wrk.design": 7, "wrk.project": 7, "wrk.proactive": 7, "wrk.continuous": 5,
    },
  },
  {
    slug: "security-architect",
    name: "Security Architect",
    purpose: "Decide the shape of defence before anything is built — then defend the decision.",
    domains: ["cybersecurity", "cloud", "networking"],
    vector: {
      "dom.cybersecurity": 10, "dom.cloud": 7, "dom.networking": 7, "dom.systems": 6, "dom.operations": 3,
      "sty.architecture": 10, "sty.policy": 8, "sty.analysis": 6, "sty.building": 3, "sty.investigation": 4,
      "abs.network": 6, "abs.identity": 7, "abs.cloud": 7, "abs.application": 5, "abs.os": 4,
      "sec.architecture": 10, "sec.prevention": 8, "sec.governance": 8, "sec.identity": 7, "sec.network": 7, "sec.detection": 5,
      "wrk.design": 10, "wrk.proactive": 8, "wrk.project": 7, "wrk.deep": 6, "wrk.reactive": 2,
    },
  },
  {
    slug: "systems-engineer",
    name: "Systems Engineer",
    purpose: "Own the servers, platforms and services every application quietly depends on.",
    domains: ["systems"],
    vector: {
      "dom.systems": 10, "dom.operations": 6, "dom.cloud": 5, "dom.cybersecurity": 5, "dom.automation": 6, "dom.networking": 4,
      "sty.troubleshooting": 8, "sty.building": 7, "sty.automating": 6, "sty.architecture": 5, "sty.monitoring": 5, "sty.policy": 4,
      "abs.os": 10, "abs.identity": 6, "abs.physical": 5, "abs.cloud": 5, "abs.application": 5, "abs.network": 4,
      "sec.endpoint": 6, "sec.prevention": 5, "sec.identity": 5,
      "wrk.continuous": 8, "wrk.project": 7, "wrk.reactive": 6, "wrk.proactive": 6, "wrk.automation": 5, "wrk.deep": 5,
    },
  },
  {
    slug: "systems-administrator",
    name: "Systems Administrator",
    purpose: "Keep the servers, accounts and services running that everyone uses without thinking about them.",
    domains: ["systems", "operations"],
    vector: {
      "dom.systems": 9, "dom.operations": 9, "dom.cloud": 3, "dom.cybersecurity": 3, "dom.automation": 4,
      "sty.troubleshooting": 8, "sty.support": 7, "sty.monitoring": 6, "sty.building": 4, "sty.automating": 4,
      "abs.os": 9, "abs.identity": 5, "abs.application": 5, "abs.physical": 4,
      "sec.endpoint": 4, "sec.identity": 4,
      "wrk.reactive": 9, "wrk.continuous": 7, "wrk.project": 4, "wrk.proactive": 4,
    },
  },
  {
    slug: "cloud-engineer",
    name: "Cloud Engineer",
    purpose: "Build and run infrastructure that exists only as an API call.",
    domains: ["cloud"],
    vector: {
      "dom.cloud": 10, "dom.systems": 6, "dom.automation": 8, "dom.networking": 5, "dom.software": 5, "dom.operations": 5, "dom.cybersecurity": 4,
      "sty.building": 9, "sty.architecture": 7, "sty.automating": 8, "sty.troubleshooting": 6, "sty.monitoring": 5,
      "abs.cloud": 10, "abs.os": 6, "abs.code": 6, "abs.network": 5, "abs.identity": 5,
      "sec.prevention": 4, "sec.identity": 4,
      "wrk.automation": 8, "wrk.project": 8, "wrk.proactive": 7, "wrk.design": 6, "wrk.deep": 6, "wrk.continuous": 5,
    },
  },
  {
    slug: "cloud-architect",
    name: "Cloud Architect",
    purpose: "Choose the shape of a system, then live with the trade-offs you picked.",
    domains: ["cloud"],
    vector: {
      "dom.cloud": 10, "dom.systems": 5, "dom.networking": 5, "dom.automation": 6, "dom.cybersecurity": 5, "dom.software": 4,
      "sty.architecture": 10, "sty.policy": 6, "sty.analysis": 6, "sty.building": 4,
      "abs.cloud": 10, "abs.network": 5, "abs.identity": 6, "abs.code": 4,
      "sec.architecture": 6, "sec.prevention": 4,
      "wrk.design": 10, "wrk.project": 8, "wrk.proactive": 7, "wrk.deep": 5, "wrk.reactive": 2,
    },
  },
  {
    slug: "devops-engineer",
    name: "DevOps Engineer",
    purpose: "Make shipping software boring — automated, repeatable and reversible.",
    domains: ["cloud", "software"],
    vector: {
      "dom.cloud": 9, "dom.automation": 10, "dom.software": 8, "dom.systems": 6, "dom.operations": 6, "dom.networking": 3,
      "sty.automating": 10, "sty.building": 9, "sty.monitoring": 6, "sty.troubleshooting": 6, "sty.architecture": 5,
      "abs.code": 9, "abs.cloud": 9, "abs.os": 6, "abs.application": 6,
      "sec.prevention": 3,
      "wrk.automation": 10, "wrk.proactive": 8, "wrk.project": 7, "wrk.deep": 6, "wrk.reactive": 5, "wrk.continuous": 5,
    },
  },
  {
    slug: "platform-engineer",
    name: "Platform Engineer",
    purpose: "Build the internal platform other engineers deploy onto, so they stop reinventing it.",
    domains: ["cloud", "systems", "software"],
    vector: {
      "dom.cloud": 9, "dom.automation": 9, "dom.software": 8, "dom.systems": 7, "dom.operations": 5,
      "sty.building": 10, "sty.architecture": 8, "sty.automating": 9, "sty.monitoring": 5,
      "abs.cloud": 9, "abs.code": 8, "abs.os": 7, "abs.application": 5,
      "wrk.automation": 9, "wrk.design": 8, "wrk.proactive": 8, "wrk.deep": 8, "wrk.project": 6,
    },
  },
  {
    slug: "site-reliability-engineer",
    name: "Site Reliability Engineer",
    purpose: "Decide how reliable a system needs to be, and engineer it to stay there.",
    domains: ["cloud", "operations", "software"],
    vector: {
      "dom.cloud": 8, "dom.operations": 9, "dom.automation": 8, "dom.software": 7, "dom.systems": 6,
      "sty.monitoring": 10, "sty.troubleshooting": 8, "sty.automating": 8, "sty.analysis": 7, "sty.building": 6, "sty.architecture": 6,
      "abs.cloud": 8, "abs.code": 7, "abs.os": 7, "abs.application": 6,
      "wrk.continuous": 9, "wrk.reactive": 8, "wrk.automation": 8, "wrk.proactive": 8, "wrk.deep": 6,
    },
  },
  {
    slug: "database-administrator",
    name: "Database Administrator",
    purpose: "Keep the system of record correct, fast, and recoverable.",
    domains: ["data", "systems"],
    vector: {
      "dom.data": 10, "dom.systems": 7, "dom.operations": 5, "dom.cloud": 4,
      "sty.analysis": 7, "sty.troubleshooting": 7, "sty.monitoring": 6, "sty.policy": 4, "sty.architecture": 5,
      "abs.data": 10, "abs.os": 6, "abs.application": 4,
      "sec.governance": 3, "sec.identity": 3,
      "wrk.continuous": 8, "wrk.deep": 7, "wrk.reactive": 6, "wrk.proactive": 5,
    },
  },
  {
    slug: "software-developer",
    name: "Software Developer",
    purpose: "Build the applications other people use to get their work done.",
    domains: ["software"],
    vector: {
      "dom.software": 10, "dom.automation": 5, "dom.cloud": 5, "dom.data": 4,
      "sty.building": 10, "sty.architecture": 6, "sty.troubleshooting": 7, "sty.analysis": 5,
      "abs.code": 10, "abs.application": 9, "abs.data": 5, "abs.cloud": 4,
      "wrk.deep": 9, "wrk.project": 7, "wrk.design": 5, "wrk.proactive": 4,
    },
  },
  {
    slug: "data-engineer",
    name: "Data Engineer",
    purpose: "Get data reliably from where it is created to where it can be used.",
    domains: ["data", "software"],
    vector: {
      "dom.data": 10, "dom.software": 7, "dom.automation": 8, "dom.cloud": 6,
      "sty.building": 8, "sty.automating": 8, "sty.analysis": 7, "sty.troubleshooting": 6, "sty.architecture": 6,
      "abs.data": 10, "abs.code": 8, "abs.cloud": 6,
      "wrk.automation": 8, "wrk.deep": 8, "wrk.project": 6, "wrk.proactive": 6,
    },
  },
  {
    slug: "data-analyst",
    name: "Data Analyst",
    purpose: "Turn a messy pile of information into an answer someone can act on.",
    domains: ["data"],
    vector: {
      "dom.data": 10, "dom.operations": 3, "dom.software": 3,
      "sty.analysis": 10, "sty.investigation": 7, "sty.support": 4, "sty.building": 3,
      "abs.data": 10, "abs.application": 3, "abs.code": 4,
      "wrk.deep": 6, "wrk.project": 6, "wrk.proactive": 4,
    },
  },
  {
    slug: "help-desk-technician",
    name: "Help Desk Technician",
    purpose: "Be the first person who hears about every problem — and the reason it gets solved.",
    domains: ["operations"],
    vector: {
      "dom.operations": 10, "dom.systems": 5, "dom.networking": 3, "dom.cybersecurity": 2,
      "sty.support": 10, "sty.troubleshooting": 8, "sty.monitoring": 3,
      "abs.os": 6, "abs.application": 6, "abs.physical": 5, "abs.identity": 4, "abs.network": 3,
      "wrk.reactive": 10, "wrk.continuous": 5, "wrk.project": 2,
    },
  },
  {
    slug: "noc-technician",
    name: "NOC Technician",
    purpose: "Watch the whole network at once, and catch what is failing before anyone calls.",
    domains: ["operations", "networking"],
    vector: {
      "dom.operations": 10, "dom.networking": 7, "dom.systems": 3, "dom.cybersecurity": 2,
      "sty.monitoring": 10, "sty.troubleshooting": 7, "sty.support": 4, "sty.investigation": 4,
      "abs.network": 7, "abs.physical": 4, "abs.os": 3,
      "wrk.continuous": 10, "wrk.reactive": 9, "wrk.proactive": 2,
    },
  },
  {
    slug: "field-engineer",
    name: "Field / Infrastructure Engineer",
    purpose: "Do the work that only happens with your hands on the actual equipment.",
    domains: ["operations", "networking"],
    vector: {
      "dom.operations": 9, "dom.networking": 6, "dom.systems": 3,
      "sty.troubleshooting": 7, "sty.building": 6, "sty.support": 4,
      "abs.physical": 10, "abs.network": 5,
      "wrk.project": 8, "wrk.reactive": 7, "wrk.continuous": 4,
    },
  },
];

export const ROLE_CORE_BY_SLUG: Record<string, RoleCore> = Object.fromEntries(
  ROLE_CORES.map((r) => [r.slug, r]),
);

export const ROLE_SLUGS: string[] = ROLE_CORES.map((r) => r.slug);

