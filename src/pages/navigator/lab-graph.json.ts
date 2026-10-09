import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { LAB_FIELDS, assertLabFieldIntegrity } from '../../lib/navigator/data/lab-fields';
import { ROLE_CORE_BY_SLUG } from '../../lib/navigator/data/roles/cores';
import { TRIAL_BY_SLUG } from '../../lib/navigator/data/trials';

/**
 * The graph the conversational lab resolves its answers against.
 *
 * Generated from the same role and trial data every other page is built from,
 * so the lab cannot drift out of sync with the site around it. It is a static
 * file: fetched once, cached, no server involved.
 *
 * Deliberately narrow — names, purposes and one trial per field. The lab needs
 * enough to render real links and nothing more, and role prose is exactly the
 * payload the core/content split exists to keep out of browsers.
 */

/** The worker holds its own copy of the key list, because that is where the
 *  model reads it. Drift between the two would silently degrade every reading
 *  to the unresolved fallback, which looks like the feature simply not working
 *  — so it fails the build instead. */
function assertWorkerKeysMatch(keys: string[]): void {
  const workerPath = fileURLToPath(new URL('../../../worker/index.js', import.meta.url));
  let source: string;
  try {
    source = readFileSync(workerPath, 'utf8');
  } catch {
    throw new Error(`Navigator lab: cannot read the worker at ${workerPath} to verify its field keys.`);
  }

  const match = source.match(/const FIELD_KEYS = \[([\s\S]*?)\];/);
  if (!match) {
    throw new Error('Navigator lab: the worker no longer declares `const FIELD_KEYS = [...]`.');
  }
  const workerKeys = [...match[1].matchAll(/"([a-z0-9-]+)"/g)].map((m) => m[1]);

  const missing = keys.filter((k) => !workerKeys.includes(k));
  const extra = workerKeys.filter((k) => !keys.includes(k));
  if (missing.length > 0 || extra.length > 0) {
    throw new Error(
      'Navigator lab field keys are out of sync with the worker prompt:\n' +
        (missing.length ? `  in lab-fields.ts but not the worker: ${missing.join(', ')}\n` : '') +
        (extra.length ? `  in the worker but not lab-fields.ts: ${extra.join(', ')}` : ''),
    );
  }
}

export function GET() {
  assertLabFieldIntegrity();
  assertWorkerKeysMatch(LAB_FIELDS.map((f) => f.key));

  const fields = LAB_FIELDS.map((field) => {
    const trial = field.trial ? TRIAL_BY_SLUG[field.trial] : undefined;
    return {
      key: field.key,
      label: field.label,
      track: field.track,
      gap: field.gap ?? null,
      roles: field.roles.map((slug) => {
        const role = ROLE_CORE_BY_SLUG[slug]!;
        return { slug, name: role.name, purpose: role.purpose };
      }),
      trial: trial
        ? {
            slug: trial.slug,
            name: trial.name,
            objective: trial.objective,
            time: trial.time,
            cost: trial.cost,
            barrierNote: trial.barrierNote,
            safety: trial.safety ?? null,
          }
        : null,
    };
  });

  return new Response(JSON.stringify({ fields }), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  });
}
