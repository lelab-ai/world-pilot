// src/research/datasets/splitManager.ts
// Gestionnaire des sous-ensembles (Splits) d'évaluation pour prévenir toute fuite de benchmark.
// Répartition : 60% Dev (Développement), 20% Validation (Calibrage), 20% Held-Out (Test final verrouillé).

import type { EditOrderExperimentCase } from '../editOrder/experimentTypes';
import { EDIT_ORDER_BENCHMARK_CASES } from './editOrderDataset';

export type DatasetSplit = 'dev' | 'val' | 'test_locked' | 'all';

/**
 * Filtre les cas de test selon le split demandé en protégeant le sous-ensemble TEST_LOCKED.
 */
export function getDatasetSplit(
  split: DatasetSplit = 'dev',
  allowLocked: boolean = false
): EditOrderExperimentCase[] {
  const isFinalEval = allowLocked || (typeof process !== 'undefined' && process.env?.RESEARCH_FINAL_EVAL === '1');

  if (split === 'all') {
    if (!isFinalEval) {
      console.warn('[Research] Split TEST_LOCKED inclus uniquement car allowLocked=true ou RESEARCH_FINAL_EVAL=1');
    }
    return EDIT_ORDER_BENCHMARK_CASES;
  }

  if (split === 'test_locked' && !isFinalEval) {
    throw new Error('[Benchmark Security] Accès au split TEST_LOCKED refusé sans variable RESEARCH_FINAL_EVAL=1.');
  }

  return EDIT_ORDER_BENCHMARK_CASES.filter(c => c.split === split);
}
