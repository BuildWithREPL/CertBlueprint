import type { Answer } from '../types';
import { SCENARIOS, SCENARIO_BY_ID } from '../data/scenarios';

/* ═══════════════════════════════════════════════════════════════════
   SHAREABLE RESULTS, WITHOUT A SERVER

   A result lives in one browser tab and dies with it. That is the right default
   and it is also the reason people cannot show anyone — a mentor, a partner,
   someone in a forum who asked what they got.

   The answers go in the URL fragment. Fragments are never sent to a server:
   they are not part of the HTTP request, so Cloudflare, the logs and any
   intermediary see `/navigator/results/` and nothing else. The link carries the
   result to the recipient's browser, which recomputes it locally. No database,
   no share table, no identifier, nothing to leak later.

   What is encoded is the ANSWERS, not the scores. Two reasons:

   • It is smaller, and it is the truth. The scores are derived; shipping them
     would let a stale link display numbers this site would no longer produce.
   • If the engine improves, an old link improves with it, and what the person
     actually chose is still exactly what it was.

   Anyone holding the link can see the answers. That is the honest trade and the
   share UI says so.
   ═══════════════════════════════════════════════════════════════════ */

/** Bumped only if the token grammar changes. Old links then fail loudly. */
const FORMAT = '1';
const SEPARATOR = '.';

/** Guards against a pathological hash — a browser will accept far more than this. */
export const MAX_CODE_LENGTH = 400;

/**
 * Scenarios are addressed by their numeric prefix (`b01`, `d23`), not their full
 * id, which keeps a shared link to a few dozen characters. It also survives
 * rewording: renaming `b01-night-outage` to `b01-2am-outage` does not break
 * links that were already sent.
 */
function codeOf(scenarioId: string): string {
  return scenarioId.split('-')[0];
}

const BY_CODE: Map<string, string> = new Map(SCENARIOS.map((s) => [codeOf(s.id), s.id]));

export function encodeAnswers(answers: Answer[]): string {
  const tokens = answers
    .filter((a) => SCENARIO_BY_ID[a.scenarioId])
    .map((a) => `${codeOf(a.scenarioId)}${a.optionId}`);
  return [FORMAT, ...tokens].join(SEPARATOR);
}

export interface DecodedShare {
  answers: Answer[];
  /** Tokens that named a scenario or option this site no longer has. */
  dropped: number;
}

/**
 * Returns null only when the code is unusable. A code carrying a few tokens
 * this build no longer recognises still decodes — the count comes back so the
 * page can say how much of the original is missing rather than quietly
 * presenting a partial result as whole.
 */
export function decodeAnswers(raw: string): DecodedShare | null {
  if (!raw || raw.length > MAX_CODE_LENGTH) return null;

  const parts = raw.split(SEPARATOR);
  if (parts.shift() !== FORMAT) return null;
  if (parts.length === 0) return null;

  const answers: Answer[] = [];
  const seen = new Set<string>();
  let dropped = 0;

  for (const token of parts) {
    const match = /^([a-z][0-9]+)([a-z])$/.exec(token);
    if (!match) {
      dropped++;
      continue;
    }
    const scenarioId = BY_CODE.get(match[1]);
    const scenario = scenarioId ? SCENARIO_BY_ID[scenarioId] : undefined;
    if (!scenario || !scenario.options.some((o) => o.id === match[2])) {
      dropped++;
      continue;
    }
    // One answer per scenario. A duplicated token would otherwise count twice
    // and inflate whatever it points at.
    if (seen.has(scenarioId!)) {
      dropped++;
      continue;
    }
    seen.add(scenarioId!);
    // `at` is deliberately zeroed rather than stamped with the time the link was
    // opened: it is the answering time, and inventing one would be a small lie
    // in a data structure that nothing here needs.
    answers.push({ scenarioId: scenarioId!, optionId: match[2], at: 0 });
  }

  if (answers.length === 0) return null;
  return { answers, dropped };
}

/**
 * Fails the build if the compact encoding could ever be ambiguous.
 *
 * Everything above rests on one assumption — that a scenario's numeric prefix
 * identifies it uniquely. Add `b07-something-else` alongside `b07-impossible-login`
 * and every link containing `b07` starts resolving to whichever one the map
 * happened to keep, silently, in a feature nobody would think to re-test.
 */
export function assertShareCodecIntegrity(): void {
  const errors: string[] = [];
  const byCode = new Map<string, string[]>();

  for (const scenario of SCENARIOS) {
    const code = codeOf(scenario.id);
    if (!/^[a-z][0-9]+$/.test(code)) {
      errors.push(`${scenario.id} has no usable share prefix (expected a letter then digits)`);
    }
    if (!byCode.has(code)) byCode.set(code, []);
    byCode.get(code)!.push(scenario.id);

    for (const option of scenario.options) {
      if (!/^[a-z]$/.test(option.id)) {
        errors.push(`${scenario.id} option "${option.id}" is not a single letter and cannot be shared`);
      }
    }
  }

  for (const [code, ids] of byCode) {
    if (ids.length > 1) {
      errors.push(`share prefix "${code}" is used by ${ids.join(' and ')} — shared links would be ambiguous`);
    }
  }

  // The encoding has to survive the longest assessment anyone can take.
  const longest = [FORMAT, ...SCENARIOS.map((s) => `${codeOf(s.id)}a`)].join(SEPARATOR);
  if (longest.length > MAX_CODE_LENGTH) {
    errors.push(
      `a maximum-length result encodes to ${longest.length} characters, over the ${MAX_CODE_LENGTH} limit`,
    );
  }

  if (errors.length > 0) {
    throw new Error(`Navigator share codec is broken:\n  ${errors.join('\n  ')}`);
  }
}
