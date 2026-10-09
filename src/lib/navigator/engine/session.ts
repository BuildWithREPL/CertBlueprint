import type { Answer, SessionState } from '../types';
import { EMPTY_PLAN, type PlanStore } from './plan';

/* ═══════════════════════════════════════════════════════════════════
   LOCAL STATE

   Everything about a person's assessment stays in their browser. Nothing is
   sent anywhere, there is no account, and there is no identifier.

   The split between the two storages is deliberate:

   • sessionStorage holds the in-progress assessment. It survives a refresh or
     an accidental back-navigation, and disappears when the tab closes. That is
     the right default for something this personal.

   • localStorage holds only what the user explicitly asked to keep — a saved
     result, or their technology inventory. Writing to it is always the result
     of a click, never a side effect of using the tool.

   The `explored` list is local-only and exists so the Explore and Assessment
   modes can connect ("you spent time on these"). It is never used to silently
   weight results — the user has to opt in on the results page — and there is a
   one-click clear.
   ═══════════════════════════════════════════════════════════════════ */

const SESSION_KEY = 'cb-nav-session-v1';
const SAVED_KEY = 'cb-nav-saved-v1';
const INVENTORY_KEY = 'cb-nav-inventory-v1';
const EXPLORED_KEY = 'cb-nav-explored-v1';
const MILITARY_KEY = 'cb-nav-military-v1';
const PLAN_KEY = 'cb-nav-plan-v1';

const VERSION = 1;

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function hasStorage(kind: 'session' | 'local'): boolean {
  try {
    const store = kind === 'session' ? window.sessionStorage : window.localStorage;
    const probe = '__cb_probe__';
    store.setItem(probe, '1');
    store.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

/**
 * In-memory fallback for private browsing modes and locked-down browsers.
 * The assessment still works end to end; it simply does not survive a refresh.
 */
const memory = new Map<string, string>();

function read(kind: 'session' | 'local', key: string): string | null {
  if (typeof window === 'undefined') return null;
  if (!hasStorage(kind)) return memory.get(key) ?? null;
  return (kind === 'session' ? window.sessionStorage : window.localStorage).getItem(key);
}

function write(kind: 'session' | 'local', key: string, value: string): void {
  if (typeof window === 'undefined') return;
  if (!hasStorage(kind)) {
    memory.set(key, value);
    return;
  }
  (kind === 'session' ? window.sessionStorage : window.localStorage).setItem(key, value);
}

function remove(kind: 'session' | 'local', key: string): void {
  if (typeof window === 'undefined') return;
  memory.delete(key);
  if (!hasStorage(kind)) return;
  (kind === 'session' ? window.sessionStorage : window.localStorage).removeItem(key);
}

/* ── In-progress assessment ──────────────────────────────────────── */

export function loadSession(): SessionState {
  const fallback: SessionState = {
    version: VERSION,
    answers: [],
    inventory: loadInventory(),
    explored: loadExplored(),
    military: loadMilitary(),
    startedAt: Date.now(),
  };
  const state = safeParse<SessionState>(read('session', SESSION_KEY), fallback);
  if (state.version !== VERSION) return fallback;
  // Inventory, explored and military live in localStorage; always take the
  // current values rather than whatever the session was written with.
  return { ...state, inventory: loadInventory(), explored: loadExplored(), military: loadMilitary() };
}

export function saveSession(state: SessionState): void {
  const { inventory: _inventory, explored: _explored, military: _military, ...rest } = state;
  write('session', SESSION_KEY, JSON.stringify({ ...rest, inventory: [], explored: [], military: [] }));
}

/**
 * Replace the answer list wholesale and persist.
 *
 * Deliberately not an `addAnswer` helper. The assessment is adaptive, so
 * question N+1 was chosen *because of* the answer to question N. If someone goes
 * back and changes an earlier answer, every question after it was selected on a
 * premise that no longer holds and has to be discarded. Making the caller pass
 * the whole list keeps that truncation visible at the call site instead of
 * hiding it behind an append that silently reorders the array.
 */
export function setAnswers(state: SessionState, answers: Answer[]): SessionState {
  const next = { ...state, answers };
  saveSession(next);
  return next;
}

export function clearSession(): void {
  remove('session', SESSION_KEY);
}

/* ── Explicitly saved result ─────────────────────────────────────── */

export interface SavedResult {
  savedAt: number;
  answers: Answer[];
  inventory: string[];
  topRoles: string[];
}

export function saveResult(result: SavedResult): void {
  write('local', SAVED_KEY, JSON.stringify(result));
}

export function loadSavedResult(): SavedResult | null {
  return safeParse<SavedResult | null>(read('local', SAVED_KEY), null);
}

export function clearSavedResult(): void {
  remove('local', SAVED_KEY);
}

/* ── Technology inventory ────────────────────────────────────────── */

export function loadInventory(): string[] {
  return safeParse<string[]>(read('local', INVENTORY_KEY), []);
}

export function saveInventory(slugs: string[]): void {
  write('local', INVENTORY_KEY, JSON.stringify(slugs));
}

export function clearInventory(): void {
  remove('local', INVENTORY_KEY);
}

/* ── Military capability selection ───────────────────────────────── */

/**
 * Capability slugs, not an occupation code.
 *
 * Storing "25B" would mean storing the fact of someone's service in their
 * browser, which is more than this feature needs to do its job. Storing what
 * they can do is enough for the scoring and says nothing about where they
 * learned it — and it is what the person edited and confirmed anyway.
 */
export function loadMilitary(): string[] {
  return safeParse<string[]>(read('local', MILITARY_KEY), []);
}

export function saveMilitary(capabilities: string[]): void {
  write('local', MILITARY_KEY, JSON.stringify(capabilities));
}

export function clearMilitary(): void {
  remove('local', MILITARY_KEY);
}

/* ── Path progress ───────────────────────────────────────────────── */

/**
 * Kept per path rather than for one current path, so changing direction costs
 * nothing. Every write is the direct result of ticking something.
 */
export function loadPlan(): PlanStore {
  const stored = safeParse<PlanStore | null>(read('local', PLAN_KEY), null);
  if (!stored || typeof stored !== 'object' || !stored.byPath) return { ...EMPTY_PLAN, byPath: {} };
  return { chosen: stored.chosen ?? null, byPath: stored.byPath };
}

export function savePlan(plan: PlanStore): void {
  write('local', PLAN_KEY, JSON.stringify(plan));
}

export function clearPlan(): void {
  remove('local', PLAN_KEY);
}

/* ── Explore history ─────────────────────────────────────────────── */

export function loadExplored(): string[] {
  return safeParse<string[]>(read('local', EXPLORED_KEY), []);
}

/** Records that a role page was opened. Capped so it stays a hint, not a profile. */
export function recordExplored(slug: string): void {
  const current = loadExplored().filter((s) => s !== slug);
  current.unshift(slug);
  write('local', EXPLORED_KEY, JSON.stringify(current.slice(0, 20)));
}

export function clearExplored(): void {
  remove('local', EXPLORED_KEY);
}

/** One button on the results page wipes everything this feature has ever stored. */
export function clearEverything(): void {
  clearSession();
  clearSavedResult();
  clearInventory();
  clearExplored();
  clearMilitary();
  clearPlan();
}
