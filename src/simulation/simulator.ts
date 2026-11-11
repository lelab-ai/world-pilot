import { WorldState, WorldEvent } from '../core/types';
import { evaluateEvent } from '../engine/evaluator';

export interface SimulationResult {
  invariantBroken: boolean;
  brokenInvariantId?: string;
  trace: WorldEvent[];
}

// Very basic bounded DFS for MVP
export function findCounterExample(
  initialState: WorldState,
  possibleEvents: WorldEvent[],
  maxDepth: number = 3
): SimulationResult {
  
  function search(currentState: WorldState, currentTrace: WorldEvent[], depth: number): SimulationResult | null {
    // 1. Check invariants
    for (const invariant of Object.values(currentState.ir?.invariants || {})) {
      if (invariant?.condition?.type === 'never_state') {
        const stateFlag = invariant.condition.stateFlag || invariant.condition.state;
        const requiredFlag = invariant.condition.requiredFlag || invariant.condition.without_flag || invariant.condition.withoutFlag;
        const flags = currentState.flags || {};
        if (stateFlag && flags[stateFlag] && (!requiredFlag || !flags[requiredFlag])) {
          return {
            invariantBroken: true,
            brokenInvariantId: invariant.id,
            trace: currentTrace
          };
        }
      }
    }

    if (depth >= maxDepth) return null;

    // 2. Branch out
    for (const event of possibleEvents) {
      const { newState } = evaluateEvent(currentState, event);
      const res = search(newState, [...currentTrace, event], depth + 1);
      if (res) return res;
    }

    return null;
  }

  const result = search(initialState, [], 0);
  
  return result || { invariantBroken: false, trace: [] };
}
