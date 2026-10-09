/* ═══════════════════════════════════════════════════════════════════
   PROGRESS AGAINST A CHOSEN PATH

   The one feature on this site with a real chance of becoming something
   dishonest, so the constraints came before the code:

   • No single readiness number. "You are 62% of the way to being a SOC
     Analyst" is a lie with a decimal point in it — people get hired
     halfway down a roadmap all the time, and others finish one and get
     nothing. Progress is reported per section, as counts, against an
     authored roadmap. What it measures is how much of the plan you have
     worked through. That is all it can honestly claim.

   • No streaks, no badges, no nudges. Nothing here should make someone
     feel they are failing at a career they have not started yet.

   • Nothing leaves the browser, and nothing is written without a click —
     every write here is the direct result of ticking something.

   Progress is stored per path rather than for one "current" path, so
   changing your mind is free. Someone who explores the SOC route for a
   month and then switches to networking has not lost anything, and does
   not have to weigh that against a warning about erasing their history.
   ═══════════════════════════════════════════════════════════════════ */

export type StageStatus = 'doing' | 'done';
export type CertStatus = 'studying' | 'earned';

export interface PathProgress {
  /** Keyed by the roadmap stage number, as authored. */
  stages: Record<string, StageStatus>;
  /** Keyed by the authored skill name. */
  skills: Record<string, true>;
  /** Keyed by certification slug. */
  certs: Record<string, CertStatus>;
  trialDone?: true;
  updatedAt: number;
}

export interface PlanStore {
  /** The path most recently worked on — used only to offer a way back in. */
  chosen: string | null;
  byPath: Record<string, PathProgress>;
}

export const EMPTY_PLAN: PlanStore = { chosen: null, byPath: {} };

export function emptyProgress(): PathProgress {
  return { stages: {}, skills: {}, certs: {}, updatedAt: 0 };
}

export interface SectionCount {
  label: string;
  done: number;
  total: number;
  /** Items started but not finished. Shown separately so "doing" is never counted as "done". */
  inProgress?: number;
}

/**
 * Per-section counts, deliberately never summed.
 *
 * Combining these into one figure would require deciding that a certification
 * is worth some number of skills, which is not a thing anybody knows.
 */
export function summarise(
  progress: PathProgress,
  totals: { stages: number; skills: number; certs: number; hasTrial: boolean },
): SectionCount[] {
  const stageValues = Object.values(progress.stages);
  const certValues = Object.values(progress.certs);

  const sections: SectionCount[] = [
    {
      label: 'Roadmap stages',
      done: stageValues.filter((s) => s === 'done').length,
      inProgress: stageValues.filter((s) => s === 'doing').length,
      total: totals.stages,
    },
    {
      label: 'Skills you have',
      done: Object.keys(progress.skills).length,
      total: totals.skills,
    },
    {
      label: 'Certifications earned',
      done: certValues.filter((c) => c === 'earned').length,
      inProgress: certValues.filter((c) => c === 'studying').length,
      total: totals.certs,
    },
  ];

  if (totals.hasTrial) {
    sections.push({ label: 'Hands-on trial', done: progress.trialDone ? 1 : 0, total: 1 });
  }

  return sections;
}

/** True once anything at all has been recorded — used to decide whether to offer a way back. */
export function hasProgress(progress: PathProgress | undefined): boolean {
  if (!progress) return false;
  return (
    Object.keys(progress.stages).length > 0 ||
    Object.keys(progress.skills).length > 0 ||
    Object.keys(progress.certs).length > 0 ||
    progress.trialDone === true
  );
}
