import type { Scenario } from '../../types';
import { BROAD_SCENARIOS } from './broad';
import { DIFFERENTIATOR_SCENARIOS } from './differentiators';

export { BROAD_SCENARIOS, DIFFERENTIATOR_SCENARIOS };

export const SCENARIOS: Scenario[] = [...BROAD_SCENARIOS, ...DIFFERENTIATOR_SCENARIOS];

export const SCENARIO_BY_ID: Record<string, Scenario> = Object.fromEntries(
  SCENARIOS.map((s) => [s.id, s]),
);
