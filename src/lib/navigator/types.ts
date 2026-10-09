/**
 * CertBlueprint Navigator — type system.
 *
 * The whole point of this file: careers are described as SPARSE VECTORS over a
 * fixed dimension registry, never as membership in one exclusive bucket. That is
 * what lets "Network Security Engineer" exist as a real destination instead of
 * being averaged away into either "Networking" or "Cybersecurity".
 *
 * Nothing here imports UI. Data and scoring stay renderer-agnostic on purpose.
 */

/* ═══════════════════════════════════════════════════════════════════
   DIMENSIONS
   Five groups. A user's interest profile and a role's profile are both
   vectors over the same ids, which is what makes them comparable.
   ═══════════════════════════════════════════════════════════════════ */

export type DimensionGroup =
  | 'domain' // which world of IT
  | 'style' // what kind of problem
  | 'abstraction' // what layer of the stack
  | 'security' // which flavour of security work
  | 'work'; // rhythm of the job

/** Domain affinity — the major worlds of IT. */
export type DomainDimensionId =
  | 'dom.networking'
  | 'dom.cybersecurity'
  | 'dom.systems'
  | 'dom.cloud'
  | 'dom.software'
  | 'dom.data'
  | 'dom.automation'
  | 'dom.operations';

/** Problem style — the shape of work someone gravitates toward. */
export type StyleDimensionId =
  | 'sty.troubleshooting'
  | 'sty.investigation'
  | 'sty.architecture'
  | 'sty.building'
  | 'sty.monitoring'
  | 'sty.automating'
  | 'sty.analysis'
  | 'sty.policy'
  | 'sty.support';

/** Technical abstraction — the layer someone wants to live at. */
export type AbstractionDimensionId =
  | 'abs.physical'
  | 'abs.network'
  | 'abs.os'
  | 'abs.application'
  | 'abs.identity'
  | 'abs.cloud'
  | 'abs.code'
  | 'abs.data';

/** Security affinity — only meaningful once cybersecurity signal exists. */
export type SecurityDimensionId =
  | 'sec.detection'
  | 'sec.prevention'
  | 'sec.identity'
  | 'sec.network'
  | 'sec.endpoint'
  | 'sec.offensive'
  | 'sec.response'
  | 'sec.architecture'
  | 'sec.governance';

/** Work style — the rhythm and posture of the job. */
export type WorkDimensionId =
  | 'wrk.reactive'
  | 'wrk.proactive'
  | 'wrk.deep'
  | 'wrk.continuous'
  | 'wrk.project'
  | 'wrk.design'
  | 'wrk.automation';

export type DimensionId =
  | DomainDimensionId
  | StyleDimensionId
  | AbstractionDimensionId
  | SecurityDimensionId
  | WorkDimensionId;

export interface Dimension {
  id: DimensionId;
  group: DimensionGroup;
  /** Shown to the user on the results page. Plain English, no jargon. */
  label: string;
  /** One line explaining what a high score here actually means. */
  blurb: string;
}

/**
 * A sparse vector. Omitted dimensions are 0 — authoring a role means listing
 * only what genuinely describes it, which keeps the data files readable and
 * keeps cosine similarity honest (see engine/scoring.ts).
 */
export type Vector = Partial<Record<DimensionId, number>>;

/* ═══════════════════════════════════════════════════════════════════
   DOMAIN TAXONOMY
   ═══════════════════════════════════════════════════════════════════ */

export type DomainId =
  | 'networking'
  | 'cybersecurity'
  | 'systems'
  | 'cloud'
  | 'software'
  | 'data'
  | 'operations';

export interface Subdomain {
  slug: string;
  name: string;
  /** What this corner of the domain is actually about. */
  blurb: string;
  /** Roles that live here. A role may appear under several subdomains. */
  roles: string[];
}

export interface Domain {
  id: DomainId;
  name: string;
  /** The one-line pitch shown on the domain map. */
  purpose: string;
  /** Two or three sentences for the domain page header. */
  intro: string;
  order: number;
  /** Drives the accent colour and iconography of the domain card. */
  accent: 'blue' | 'red' | 'violet' | 'cyan' | 'amber' | 'emerald' | 'slate';
  subdomains: Subdomain[];
  /** The dimensions most associated with this domain — powers the domain map. */
  signature: DimensionId[];
}

/* ═══════════════════════════════════════════════════════════════════
   CAPABILITY + TECHNOLOGY GRAPH
   technology → capability → domain → role → certification
   ═══════════════════════════════════════════════════════════════════ */

export interface Capability {
  slug: string;
  name: string;
  /** Plain-English: what someone with this capability can actually do. */
  blurb: string;
  domains: DomainId[];
  /** Roles for which this capability is load-bearing. */
  roles: string[];
  /** Contribution to a user's vector when they claim a technology carrying it. */
  vector: Vector;
}

export type TechnologyCategory =
  | 'Network platform'
  | 'Routing & switching'
  | 'Network security'
  | 'Access control'
  | 'Directory & identity'
  | 'Operating system'
  | 'Virtualization'
  | 'Cloud platform'
  | 'Analysis tooling'
  | 'Security tooling'
  | 'Automation & scripting'
  | 'Data platform';

export interface Technology {
  slug: string;
  name: string;
  /** Alternate spellings people actually type. Powers inventory search. */
  aka?: string[];
  category: TechnologyCategory;
  /** One line, written for someone who has never heard of it. */
  blurb: string;
  /** Capability slugs. This is the spine of the graph. */
  capabilities: string[];
  domains: DomainId[];
  /** Roles where this technology is common, most-central first. */
  roles: string[];
  /** Certification slugs (matching src/content/certifications) worth knowing about. */
  certs: string[];
  /**
   * Direct vector contribution, ON TOP of the capabilities it carries. Use this
   * for signal the capability list alone would understate.
   */
  vector?: Vector;
  /**
   * The "you may have more of X than you realise" line. This is the whole point
   * of the inventory feature for experienced people.
   */
  revelation?: string;
}

/* ═══════════════════════════════════════════════════════════════════
   ROLES
   ═══════════════════════════════════════════════════════════════════ */

export interface RoleCert {
  title: string;
  /** Matches a certifications collection entry — enables a real link. */
  slug?: string;
  vendorSlug?: string;
  /** "Foundation" | "Core" | "Vendor" | "Advanced" — free text, rendered as a band. */
  stage: string;
  reason: string;
}

export interface AdjacentRole {
  slug: string;
  /** Why this move is a natural next step, in one line. */
  reason: string;
}

/**
 * The part of a role the SCORING ENGINE needs — and nothing else.
 *
 * This split exists for one measured reason: role data was 117 KB minified,
 * 51% of the client bundle, and almost all of it was prose the matcher never
 * reads. Cosine similarity needs a vector and enough identity to render a
 * result row. Activities, certifications, environments and the honest-downside
 * copy are page content that no browser running the assessment should have to
 * download.
 *
 * Cores live in `data/roles/cores.ts`; prose lives in the per-domain content
 * files. `index.ts` merges them for pages, and asserts at build time that the
 * two halves line up — so the split cannot silently drift.
 */
export interface RoleCore {
  slug: string;
  name: string;
  /** One line. Written to make the work sound like what it is, not to sell. */
  purpose: string;
  /** Every domain this role genuinely spans. Order matters: primary first. */
  domains: DomainId[];
  /** The role's position in dimension space. Sparse by design. */
  vector: Vector;
}

/** Everything a role page renders. Server-side only — never shipped to the client. */
export interface RoleContent {
  slug: string;
  /** Subdomain slugs this role appears under. */
  subdomains: string[];
  /** Honest entry reality — is this a first job or a second one? */
  entry: 'first-job' | 'second-job' | 'senior';
  /** 3–5 word positioning shown on the compact card. */
  shortLabel: string;

  /** What you actually do — concrete activities, never responsibilities-speak. */
  activities: string[];
  /** Technology slugs (data/technologies.ts) plus free-text names. */
  technologies: string[];
  /** Concepts you will learn. Glossary keys where one exists. */
  concepts: string[];
  /** Where this work happens. */
  environments: string[];
  /** "You may enjoy this if…" — behaviours, never personality stereotypes. */
  enjoyIf: string[];
  /** The honest downside. Every role has one; omitting it is a lie. */
  reality: string;

  related: string[];
  adjacent: AdjacentRole[];
  certs: RoleCert[];
  certNote?: string;

  /** Links into the existing /paths/<slug>/ roadmap where one exists. */
  pathSlug?: string;

  seoTitle: string;
  seoDescription: string;
}

/** A whole role — core plus prose. Pages use this; the engine must not. */
export type Role = RoleCore & RoleContent;

/* ═══════════════════════════════════════════════════════════════════
   SCENARIOS
   ═══════════════════════════════════════════════════════════════════ */

/** Micro-simulation payloads. Rendered by engine-agnostic view code. */
export type SimBlock =
  | {
      kind: 'topology';
      caption?: string;
      /** Rendered top-to-bottom (mobile) or left-to-right (wide). */
      nodes: Array<{
        label: string;
        sub?: string;
        state?: 'ok' | 'warn' | 'fail' | 'unknown';
      }>;
      /** Optional annotation rendered under the chain. */
      note?: string;
    }
  | {
      kind: 'log';
      caption?: string;
      columns: string[];
      rows: string[][];
      /** Row indices to visually flag. */
      highlight?: number[];
    }
  | {
      kind: 'metrics';
      caption?: string;
      items: Array<{ label: string; value: string; state?: 'ok' | 'warn' | 'fail' }>;
    }
  | {
      kind: 'terminal';
      caption?: string;
      lines: string[];
    }
  | {
      kind: 'ticket';
      caption?: string;
      from: string;
      subject: string;
      body: string;
    };

export interface ScenarioOption {
  id: string;
  /** The activity. Phrased as work, not as a career label. */
  label: string;
  /** Glossary keys appearing in this option, surfaced as inline explainers. */
  terms?: string[];
  /** What choosing this says about the person. Sparse. Typical range 1–3. */
  weights: Vector;
  /**
   * Author-facing justification. Also surfaced in the "why these appeared"
   * explanation, so write it as a phrase that completes "you were drawn to …".
   */
  rationale: string;
}

export type ScenarioStage = 'broad' | 'differentiator';

export interface Scenario {
  id: string;
  stage: ScenarioStage;
  /** Bucket used to avoid asking three routing questions in a row. */
  category: string;
  /** The situation. Present tense, concrete, no career vocabulary. */
  setup: string;
  /** The question. Vary this — see the wording bank in the design doc. */
  frame: string;
  sim?: SimBlock;
  options: ScenarioOption[];
  /**
   * Differentiator scenarios only fire when the named dimensions are already
   * contested. Empty means "always eligible".
   */
  triggers?: DimensionId[];
}

/* ═══════════════════════════════════════════════════════════════════
   SALARY

   See data/salary.ts for the reasoning. The short version: a figure that cannot
   be traced to a published occupation does not get presented as one, and the
   median never appears without the entry figure beside it.
   ═══════════════════════════════════════════════════════════════════ */

export interface RoleSalary {
  /** Key into BLS_ANCHORS. Anchors carry the citable median and growth. */
  anchor?: string;
  /**
   * How far to trust the number, which decides the caveat the reader is shown.
   * `no-official-category` is the honest majority case: BLS has no occupation
   * called "Zero Trust Engineer", and pretending otherwise would be inventing
   * authority.
   */
  basis: 'bls-direct' | 'bls-adjacent' | 'no-official-category';
  /** Directional band, used only when there is no defensible official median. */
  median?: string;
  /** What people actually start on. Never omitted — this is the honest number. */
  entry: string;
  /** Where the path leads, when that is meaningfully different. */
  senior?: string;
  /** Why the mapping is what it is, and what it fails to capture. */
  note: string;
}

/* ═══════════════════════════════════════════════════════════════════
   WEEKEND TRIALS

   A match percentage is a hypothesis. A trial is the cheap experiment that
   tests it — before someone spends $300 and three months on a certification
   for work they turn out to dislike.

   Trials attach to CAPABILITIES rather than to roles, for the same reason the
   technology graph does: one well-written trial about reading logs serves the
   SOC analyst, the incident responder and the systems engineer at once, and it
   keeps working when the role taxonomy shifts underneath it.
   ═══════════════════════════════════════════════════════════════════ */

export interface TrialStep {
  title: string;
  detail: string;
  /** Commands differ by OS; omit where the step is platform-neutral. */
  commands?: Array<{ platform: 'Windows' | 'macOS' | 'Linux' | 'Any'; run: string }>;
}

export interface Trial {
  slug: string;
  name: string;
  /** What you will FEEL, not what you will learn. That distinction is the point. */
  objective: string;
  time: string;
  cost: string;
  /**
   * How much stands between the user and starting. Stated up front and
   * honestly — "free" that quietly needs a credit card is worse than saying so.
   */
  barrier: 'local' | 'account' | 'purchase';
  barrierNote: string;
  /** Resolves to roles through the existing capability graph. */
  capabilities: string[];
  steps: TrialStep[];
  /** Signals that this kind of work suits you. */
  enjoyedIf: string[];
  /** Disliking it is just as informative, and the page must say so. */
  dislikedMeans: string;
  /**
   * Scope limits. Mandatory for anything security-adjacent: a career site
   * casually suggesting people scan networks they do not own would be
   * indefensible, and in many jurisdictions criminal.
   */
  safety?: string;
}

/* ═══════════════════════════════════════════════════════════════════
   GLOSSARY
   ═══════════════════════════════════════════════════════════════════ */

export interface GlossaryTerm {
  key: string;
  term: string;
  /** One or two sentences. Assume zero background. Never recursive jargon. */
  plain: string;
}

/* ═══════════════════════════════════════════════════════════════════
   ASSESSMENT STATE + RESULTS
   ═══════════════════════════════════════════════════════════════════ */

export interface Answer {
  scenarioId: string;
  optionId: string;
  /** Milliseconds since epoch. Local only; never transmitted. */
  at: number;
}

export interface RoleMatch {
  slug: string;
  /** Core only — the results page renders a name, a purpose and domain pills. */
  role: RoleCore;
  /** 0–1 weighted cosine similarity. */
  score: number;
  /** 0–100, presentation-ready. */
  percent: number;
  /** Dimensions that contributed most to this match, strongest first. */
  drivers: DimensionId[];
  /** True when this role's strength comes from spanning two contested domains. */
  intersection?: [DomainId, DomainId];
}

export type ConfidenceLevel = 'low' | 'moderate' | 'high';

export interface Confidence {
  level: ConfidenceLevel;
  /** Gap between #1 and #2, normalized. Small gap = say so. */
  margin: number;
  /** Share of dimension groups that received any signal at all. */
  coverage: number;
  /** Human sentence rendered on the results page. */
  message: string;
  /** Role slugs that are statistically tied with the leader. */
  tied: string[];
}

export interface AssessmentResult {
  vector: Vector;
  /** Per-group normalized vector used for display bars. */
  normalized: Vector;
  matches: RoleMatch[];
  confidence: Confidence;
  /** Ranked domain affinities, for the interest-pattern chart. */
  domainScores: Array<{ id: DomainId; score: number }>;
  /** "Why these appeared" — deduplicated rationale phrases. */
  drivers: string[];
  answered: number;
}

export interface SessionState {
  version: number;
  answers: Answer[];
  /** Technologies claimed in the inventory, by slug. */
  inventory: string[];
  /** Role slugs the user opened in Explore. Local only, user-clearable. */
  explored: string[];
  /** Capabilities confirmed on the military translator. Never an occupation code. */
  military: string[];
  startedAt: number;
}
