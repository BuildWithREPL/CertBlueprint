/**
 * Cluster-level audit of the career map.
 *
 * The build already fails on the things that are provably wrong: a move to a
 * role that does not exist, a role nothing links to, a field no role can reach.
 * This script asks the softer question those checks cannot — is the map's shape
 * still honest, and how close is it to breaking?
 *
 * It exists because of the Data gap. Nineteen of thirty-eight roles had no
 * authored route into the Data field, and every per-role check passed the whole
 * time, because no single role was isolated — an entire cluster was. A node-level
 * check cannot see a cluster-level hole. So this looks at clusters.
 *
 *     npm run build && node scripts/audit-map.mjs
 *
 * It exits non-zero only on a true break (a field unreachable from some role),
 * which the build also catches. Everything else is printed for a human to judge:
 * an asymmetry is often the honest answer rather than a bug. Nobody moves back
 * to the help desk, and there is no entry-level cloud job — a map that showed
 * those as balanced would be the one that was lying.
 */
import fs from 'node:fs';
import path from 'node:path';

const DATA = path.join(process.cwd(), 'dist', 'navigator', 'graph-data.json');
if (!fs.existsSync(DATA)) {
  console.error('No dist/navigator/graph-data.json — run `npx astro build` first.');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(DATA, 'utf8'));
const roles = new Map(data.roles.map((r) => [r.slug, r]));
const fields = new Map(data.fields.map((f) => [f.id, f.name]));
const moves = data.moves.map((m) => [m.from, m.to]);
const members = new Map(
  [...fields.keys()].map((f) => [f, new Set([...roles.values()].filter((r) => r.domains.includes(f)).map((r) => r.slug))]),
);

const adjacency = (skip) => {
  const out = new Map();
  for (const [a, b] of moves) {
    if (skip && a === skip[0] && b === skip[1]) continue;
    if (!out.has(a)) out.set(a, []);
    out.get(a).push(b);
  }
  return out;
};

/** Fewest authored moves from `start` into any role in `targets`, or null. */
function hopsInto(out, start, targets) {
  if (targets.has(start)) return 0;
  const seen = new Set([start]);
  const queue = [[start, 0]];
  while (queue.length > 0) {
    const [current, depth] = queue.shift();
    for (const next of out.get(current) ?? []) {
      if (seen.has(next)) continue;
      if (targets.has(next)) return depth + 1;
      seen.add(next);
      queue.push([next, depth + 1]);
    }
  }
  return null;
}

const out = adjacency();
let broken = 0;

console.log('Every role can reach every field?\n');
for (const [id, name] of fields) {
  const distances = [...roles.keys()].map((slug) => [slug, hopsInto(out, slug, members.get(id))]);
  const stranded = distances.filter(([, h]) => h === null).map(([s]) => s);
  const reached = distances.filter(([, h]) => h !== null).map(([, h]) => h);
  const worst = distances.filter(([, h]) => h !== null).sort((a, b) => b[1] - a[1])[0];
  broken += stranded.length;
  const verdict = stranded.length > 0 ? `BROKEN — ${stranded.join(', ')}` : 'yes';
  console.log(
    `  ${name.padEnd(26)} ${verdict.padEnd(12)} furthest ${String(worst[1]).padStart(2)} moves (${roles.get(worst[0]).name})`,
  );
}

console.log('\nIs any field held up by a single move?');
console.log('(one bridge between two clusters is how the Data gap happened)\n');
const critical = [];
for (const move of moves) {
  const reduced = adjacency(move);
  const lost = [];
  for (const [id] of fields) {
    for (const slug of roles.keys()) {
      if (hopsInto(out, slug, members.get(id)) !== null && hopsInto(reduced, slug, members.get(id)) === null) {
        lost.push([fields.get(id), slug]);
      }
    }
  }
  if (lost.length > 0) critical.push([lost.length, move, [...new Set(lost.map(([f]) => f))]]);
}
if (critical.length === 0) {
  console.log('  No. Every field survives the loss of any single authored move.');
} else {
  for (const [count, [a, b], affected] of critical.sort((x, y) => y[0] - x[0])) {
    console.log(`  ${String(count).padStart(3)} role/field pairs rest on ${roles.get(a).name} → ${roles.get(b).name} (${affected.join(', ')})`);
  }
}

console.log('\nShape of each field — read these, do not "fix" them:\n');
for (const [id, name] of fields) {
  const ms = members.get(id);
  const entries = [...ms].filter((s) => roles.get(s).entry === 'first-job').length;
  const into = moves.filter(([a, b]) => ms.has(b) && !ms.has(a)).length;
  const outOf = moves.filter(([a, b]) => ms.has(a) && !ms.has(b)).length;
  console.log(
    `  ${name.padEnd(26)} ${String(ms.size).padStart(2)} roles · ${entries} reachable as a first job · ${String(into).padStart(2)} moves in · ${String(outOf).padStart(2)} moves out`,
  );
}

const noOut = [...roles.keys()].filter((s) => (out.get(s) ?? []).length === 0);
const arrivals = new Set(moves.map(([, b]) => b));
const noIn = [...roles.keys()].filter((s) => !arrivals.has(s));
console.log('\nDead ends and entry points:\n');
console.log(`  ${noOut.length} role(s) with nowhere to go next${noOut.length ? ': ' + noOut.join(', ') : ' — good'}`);
console.log(`  ${noIn.length} role(s) nobody moves into: ${noIn.map((s) => roles.get(s).name).join(', ')}`);
console.log('    (expected for first jobs — they are where people start, not where people arrive)');

process.exit(broken > 0 ? 1 : 0);
