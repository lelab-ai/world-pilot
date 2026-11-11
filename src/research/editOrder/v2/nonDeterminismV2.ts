// src/research/editOrder/v2/nonDeterminismV2.ts
// Contrôle de non-déterminisme stochastique (Section 27).
// Exécute AB et BA K fois (K=3) pour mesurer la variance within-order vs between-order.

import type { EditOrderExperimentCaseV2 } from './experimentTypesV2';
import { runPermutationExperimentV2 } from './experimentRunnerV2';

export interface StochasticVarianceReport {
  totalEvaluated: number;
  kRepetitions: number;
  withinOrderDivergenceCount: number;
  withinOrderVariance: number;
  betweenOrderDivergenceCount: number;
  betweenOrderVariance: number;
  isDeterministic: boolean;
  verdict: 'STRICTLY_DETERMINISTIC' | 'STOCHASTIC_NOISE_DETECTED';
}

/**
 * Mesure la variance intra-ordre vs inter-ordre sur un échantillon représentatif de cas.
 */
export async function measureStochasticVariance(
  sampleCases: EditOrderExperimentCaseV2[],
  k = 3
): Promise<StochasticVarianceReport> {
  let withinDivergences = 0;
  let betweenDivergences = 0;

  for (const c of sampleCases) {
    const runsAB: string[] = [];
    const runsBA: string[] = [];

    for (let rep = 0; rep < k; rep++) {
      const rec = await runPermutationExperimentV2(c, { condition: 'C0_NaiveSequential' });
      runsAB.push(rec.branchAB.snapshotHash);
      runsBA.push(rec.branchBA.snapshotHash);
    }

    // Variance within AB
    const uniqueAB = new Set(runsAB).size;
    const uniqueBA = new Set(runsBA).size;
    if (uniqueAB > 1 || uniqueBA > 1) {
      withinDivergences++;
    }

    // Variance between AB vs BA
    if (runsAB[0] !== runsBA[0]) {
      betweenDivergences++;
    }
  }

  const denom = sampleCases.length > 0 ? sampleCases.length : 1;
  const withinVariance = withinDivergences / denom;
  const betweenVariance = betweenDivergences / denom;

  return {
    totalEvaluated: sampleCases.length,
    kRepetitions: k,
    withinOrderDivergenceCount: withinDivergences,
    withinOrderVariance: parseFloat(withinVariance.toFixed(4)),
    betweenOrderDivergenceCount: betweenDivergences,
    betweenOrderVariance: parseFloat(betweenVariance.toFixed(4)),
    isDeterministic: withinDivergences === 0,
    verdict: withinDivergences === 0 ? 'STRICTLY_DETERMINISTIC' : 'STOCHASTIC_NOISE_DETECTED'
  };
}
