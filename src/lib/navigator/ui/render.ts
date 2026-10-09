import type { Scenario, ScenarioOption, SimBlock } from '../types';
import { GLOSSARY_BY_KEY } from '../data/glossary';

/**
 * DOM builders for the assessment.
 *
 * The assessment is client-rendered because it is adaptive — which scenario
 * comes next depends on the answers so far, so there is nothing to prerender.
 * Everything here builds real elements rather than assembling HTML strings:
 * scenario text is authored content, but building nodes means an authoring
 * mistake can never become an injection, and it keeps event wiring local.
 */

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/* ═══ Micro-simulations ═══════════════════════════════════════════ */

function renderTopology(sim: Extract<SimBlock, { kind: 'topology' }>): HTMLElement {
  const wrap = el('div', 'nav-topo');
  sim.nodes.forEach((node, i) => {
    if (i > 0) wrap.appendChild(el('div', 'nav-topo__link'));
    const box = el('div', 'nav-topo__node');
    const dot = el('span', 'nav-topo__dot');
    dot.dataset.state = node.state ?? 'unknown';
    box.appendChild(dot);
    const labels = el('span');
    labels.appendChild(el('span', undefined, node.label));
    if (node.sub) {
      const sub = el('span');
      sub.style.color = 'var(--cb-text-muted)';
      sub.style.display = 'block';
      sub.style.fontSize = '0.68rem';
      sub.textContent = node.sub;
      labels.appendChild(sub);
    }
    box.appendChild(labels);
    wrap.appendChild(box);
  });
  return wrap;
}

function renderLog(sim: Extract<SimBlock, { kind: 'log' }>): HTMLElement {
  const scroll = el('div', 'nav-sim__scroll');
  const table = el('table', 'nav-logtable');

  const thead = el('thead');
  const headRow = el('tr');
  for (const column of sim.columns) headRow.appendChild(el('th', undefined, column));
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = el('tbody');
  sim.rows.forEach((row, i) => {
    const tr = el('tr');
    if (sim.highlight?.includes(i)) tr.dataset.flag = '1';
    for (const cell of row) tr.appendChild(el('td', undefined, cell));
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);

  scroll.appendChild(table);
  return scroll;
}

function renderMetrics(sim: Extract<SimBlock, { kind: 'metrics' }>): HTMLElement {
  const grid = el('div');
  grid.style.display = 'grid';
  grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(8rem, 1fr))';
  grid.style.gap = '0.5rem';
  grid.style.padding = '0.75rem';

  for (const item of sim.items) {
    const cell = el('div');
    cell.style.padding = '0.5rem 0.65rem';
    cell.style.border = '1px solid var(--cb-border)';
    cell.style.borderRadius = '0.4rem';
    cell.style.background = 'var(--cb-bg-card)';

    const label = el('div', undefined, item.label);
    label.style.color = 'var(--cb-text-muted)';
    label.style.fontSize = '0.66rem';
    label.style.textTransform = 'uppercase';
    label.style.letterSpacing = '0.06em';

    const value = el('div', undefined, item.value);
    value.style.fontSize = '1rem';
    value.style.fontWeight = '600';
    value.style.marginTop = '0.15rem';
    value.style.color =
      item.state === 'fail'
        ? 'var(--nav-fail)'
        : item.state === 'warn'
          ? 'var(--nav-warn)'
          : item.state === 'ok'
            ? 'var(--nav-ok)'
            : 'var(--cb-text)';

    cell.append(label, value);
    grid.appendChild(cell);
  }
  return grid;
}

function renderTerminal(sim: Extract<SimBlock, { kind: 'terminal' }>): HTMLElement {
  const pre = el('pre');
  pre.style.padding = '0.75rem';
  pre.style.margin = '0';
  pre.style.overflowX = 'auto';
  pre.style.color = 'var(--cb-text-sub)';
  pre.textContent = sim.lines.join('\n');
  return pre;
}

function renderTicket(sim: Extract<SimBlock, { kind: 'ticket' }>): HTMLElement {
  const wrap = el('div');
  wrap.style.padding = '0.75rem';
  const from = el('div', undefined, `From: ${sim.from}`);
  from.style.color = 'var(--cb-text-muted)';
  const subject = el('div', undefined, `Subject: ${sim.subject}`);
  subject.style.fontWeight = '600';
  subject.style.margin = '0.2rem 0 0.5rem';
  const body = el('div', undefined, sim.body);
  body.style.color = 'var(--cb-text-sub)';
  body.style.whiteSpace = 'pre-wrap';
  wrap.append(from, subject, body);
  return wrap;
}

export function renderSim(sim: SimBlock): HTMLElement {
  const shell = el('div', 'nav-sim');
  if (sim.caption) shell.appendChild(el('div', 'nav-sim__caption', sim.caption));

  switch (sim.kind) {
    case 'topology':
      shell.appendChild(renderTopology(sim));
      if (sim.note) {
        const note = el('p', undefined, sim.note);
        note.style.padding = '0 0.75rem 0.7rem';
        note.style.color = 'var(--cb-text-muted)';
        shell.appendChild(note);
      }
      break;
    case 'log':
      shell.appendChild(renderLog(sim));
      break;
    case 'metrics':
      shell.appendChild(renderMetrics(sim));
      break;
    case 'terminal':
      shell.appendChild(renderTerminal(sim));
      break;
    case 'ticket':
      shell.appendChild(renderTicket(sim));
      break;
  }
  return shell;
}

/* ═══ Options ═════════════════════════════════════════════════════ */

/**
 * Glossary entries for an option are rendered UNDER the button rather than
 * inside it. Putting an expandable explainer inside a clickable control means
 * every attempt to read a definition also submits an answer — which would
 * punish exactly the beginners this feature exists for.
 */
function renderTerms(option: ScenarioOption): HTMLElement | null {
  if (!option.terms || option.terms.length === 0) return null;
  const wrap = el('div');
  wrap.style.margin = '0.35rem 0 0 0.6rem';
  wrap.style.display = 'flex';
  wrap.style.flexWrap = 'wrap';
  wrap.style.gap = '0.75rem';

  for (const key of option.terms) {
    const entry = GLOSSARY_BY_KEY[key];
    if (!entry) continue;
    const details = el('details', 'nav-term');
    details.style.fontSize = '0.78rem';
    details.style.color = 'var(--cb-text-muted)';
    const summary = el('summary', undefined, `what is ${entry.term}?`);
    summary.setAttribute('aria-label', `Explain ${entry.term}`);
    const body = el('span', 'nav-term__body');
    body.textContent = `${entry.term} — ${entry.plain}`;
    details.append(summary, body);
    wrap.appendChild(details);
  }
  return wrap.childElementCount > 0 ? wrap : null;
}

/**
 * Sentinel option id for "none of these". It intentionally matches no real
 * option, so the scoring pass adds nothing for it while still counting the
 * scenario toward exposure.
 */
export const NONE_OPTION_ID = '__none__';

export interface ScenarioView {
  root: HTMLElement;
  /** Focus target for keyboard users after the question changes. */
  heading: HTMLElement;
}

export function renderScenario(
  scenario: Scenario,
  onChoose: (optionId: string) => void,
  selectedId?: string,
): ScenarioView {
  const root = el('div');

  const setup = el('p');
  setup.textContent = scenario.setup;
  setup.style.fontSize = '1.05rem';
  setup.style.lineHeight = '1.65';
  setup.style.color = 'var(--cb-text)';
  setup.style.maxWidth = '62ch';
  root.appendChild(setup);

  if (scenario.sim) {
    const sim = renderSim(scenario.sim);
    sim.style.margin = '1rem 0';
    root.appendChild(sim);
  }

  // The frame is the actual question, so it is the heading and the focus target.
  const frame = el('h2');
  frame.textContent = scenario.frame;
  frame.tabIndex = -1;
  frame.style.fontSize = '1rem';
  frame.style.fontWeight = '700';
  frame.style.margin = '1.25rem 0 0.15rem';
  frame.style.color = 'var(--cb-text)';
  root.appendChild(frame);

  const hint = el('p', undefined, 'There is no correct answer here — pick the one you would actually want.');
  hint.style.fontSize = '0.78rem';
  hint.style.color = 'var(--cb-text-muted)';
  hint.style.marginBottom = '0.9rem';
  root.appendChild(hint);

  const list = el('div');
  list.setAttribute('role', 'group');
  list.setAttribute('aria-labelledby', '');
  list.style.display = 'flex';
  list.style.flexDirection = 'column';
  list.style.gap = '0.6rem';

  for (const option of scenario.options) {
    const item = el('div');

    const button = el('button', 'nav-option');
    button.type = 'button';
    button.textContent = option.label;
    button.setAttribute('aria-pressed', String(option.id === selectedId));
    button.addEventListener('click', () => onChoose(option.id));
    item.appendChild(button);

    const terms = renderTerms(option);
    if (terms) item.appendChild(terms);

    list.appendChild(item);
  }

  root.appendChild(list);

  /* Declining is a real answer.
     Without this, someone with no interest in any of the five options has to
     pick one anyway, and that forced pick is recorded as genuine attraction —
     noise that accumulates across a whole assessment and drags people toward
     whichever field happens to be over-represented in the bank. The scenario
     still counts toward exposure, so "I was offered this kind of work four
     times and wanted none of it" is scored as the negative signal it is. */
  const skipWrap = el('div');
  skipWrap.style.marginTop = '0.9rem';
  const skip = el('button', undefined, 'None of these appeal to me');
  skip.type = 'button';
  skip.style.background = 'none';
  skip.style.border = 'none';
  skip.style.padding = '0';
  skip.style.cursor = 'pointer';
  skip.style.fontSize = '0.82rem';
  skip.style.textDecoration = 'underline';
  skip.style.color = 'var(--cb-text-muted)';
  skip.setAttribute('aria-pressed', String(selectedId === NONE_OPTION_ID));
  skip.addEventListener('click', () => onChoose(NONE_OPTION_ID));
  skipWrap.appendChild(skip);
  root.appendChild(skipWrap);

  return { root, heading: frame };
}
