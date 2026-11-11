// src/research/editOrder/v2/trueAblationRunnerV2.ts
// Exécute la véritable étude d'ablation des composantes de défense (Sections 12-15).
// Base = C5 (Full Defense). Chaque configuration retire exactement une composante à la fois.
// Fournit les comptages appariés k/N et le test statistique apparié de McNemar.

import type { EditOrderExperimentCaseV2, TrueAblationId } from './experimentTypesV2';
import { runBatchExperimentsV2 } from './experimentRunnerV2';

export interface AblationOutcomeRow {
  ablationId: TrueAblationId;
  name: string;
  failureCount: number;
  totalCases: number;
  residualFailureRate: number;
  deltaFailuresVsC5: number;
  mcnemarChi2: number;
  mcnemarPValue: string;
  satA: number;
  satB: number;
  meanRuntimeMs: number;
  modifiedEntities: number;
  modifiedRules: number;
  invariantViolations: number;
  description: string;
}

export const TRUE_ABLATIONS: { id: TrueAblationId; name: string; desc: string }[] = [
  { id: 'ABL-0_FullC5', name: 'Full C5 Defense', desc: 'Complete pipeline with all defensive layers active' },
  { id: 'ABL-1_NoIdentityPreservation', name: 'C5 - Identity Preservation', desc: 'Disables canonical entity ID mapping' },
  { id: 'ABL-2_NoTriggerReconciliation', name: 'C5 - Trigger Reconciliation', desc: 'Disables dynamic spatial trigger anchor updates' },
  { id: 'ABL-3_NoPhysicsTracking', name: 'C5 - Physics Dependency Tracking', desc: 'Ignores mass stacks and rigid body anchors' },
  { id: 'ABL-4_NoNavigationTracking', name: 'C5 - Navigation Dependency Tracking', desc: 'Disables NavMesh clearance re-evaluation' },
  { id: 'ABL-5_NoCausalRuleReconciliation', name: 'C5 - Causal Rule Reconciliation', desc: 'Disables ECA rule target retargeting' },
  { id: 'ABL-6_NoTaskDependencyTracking', name: 'C5 - Task Dependency Tracking', desc: 'Disables MDP goal prerequisite tracking' },
  { id: 'ABL-7_NoInvariantVerification', name: 'C5 - Invariant Verification', desc: 'Removes final BFS safety model checker' },
  { id: 'ABL-8_NoParetoRepair', name: 'C5 - Pareto Minimal Repair', desc: 'Detects violations but skips automated patch synthesis' },
  { id: 'ABL-D0_Depth0', name: 'Depth = 0 (No Propagation)', desc: 'Only evaluates 0-hop local changes' },
  { id: 'ABL-D1_Depth1', name: 'Depth = 1 (Direct)', desc: 'Propagates dependencies strictly 1 hop' },
  { id: 'ABL-D2_Depth2', name: 'Depth = 2 (Two Hops)', desc: 'Propagates dependencies up to 2 hops' },
  { id: 'ABL-D3_Depth3Plus', name: 'Depth >= 3 (Deep Propagation)', desc: 'Full multi-hop transitive closure' }
];

function computeMcNemar(n01: number, n10: number): { chi2: number; pValue: string } {
  const sum = n01 + n10;
  if (sum === 0) return { chi2: 0, pValue: '1.000' };
  const diff = Math.abs(n01 - n10);
  const chi2 = Math.pow(Math.max(0, diff - 1), 2) / sum;
  let pValue = '> 0.05';
  if (chi2 >= 10.828) pValue = '< 0.001';
  else if (chi2 >= 6.635) pValue = '< 0.01';
  else if (chi2 >= 3.841) pValue = '< 0.05';
  return { chi2: parseFloat(chi2.toFixed(3)), pValue };
}

/**
 * Exécute l'ensemble des vraies ablations sur un sous-ensemble stratifié de cas.
 */
export async function runAllTrueAblations(
  cases: EditOrderExperimentCaseV2[]
): Promise<AblationOutcomeRow[]> {
  const rows: AblationOutcomeRow[] = [];

  // Exécution de référence C5
  const baseRuns = await runBatchExperimentsV2(cases, { ablationId: 'ABL-0_FullC5' });
  const baseFailures = new Set<string>();
  baseRuns.forEach(r => {
    if (!r.comparison.equivalent) baseFailures.add(r.experimentId);
  });
  const c5FailureCount = baseFailures.size;

  const totalCasesDenom = cases.length > 0 ? cases.length : 1;

  for (const abl of TRUE_ABLATIONS) {
    const runs = abl.id === 'ABL-0_FullC5' ? baseRuns : await runBatchExperimentsV2(cases, { ablationId: abl.id });
    const failures = runs.filter(r => !r.comparison.equivalent);
    const failureCount = failures.length;
    const failureRate = cases.length > 0 ? failureCount / cases.length : 0;

    // Calcul apparié McNemar contre C5
    let n01 = 0; // C5 a échoué mais pas Ablation
    let n10 = 0; // Ablation a échoué mais pas C5
    for (const r of runs) {
      const c5Failed = baseFailures.has(r.experimentId);
      const ablFailed = !r.comparison.equivalent;
      if (c5Failed && !ablFailed) n01++;
      if (!c5Failed && ablFailed) n10++;
    }
    const { chi2, pValue } = computeMcNemar(n01, n10);

    const totalRuntime = runs.reduce((acc, r) => acc + r.instrumentation.runtimeMs, 0);
    const meanRuntime = cases.length > 0 ? Math.round(totalRuntime / totalCasesDenom) : 0;

    let modEnt = 0;
    let modRules = 0;
    let invViol = 0;

    for (const r of runs) {
      if (r.repair?.triggered) {
        modEnt += r.repair.cost.entitiesModified;
        modRules += r.repair.cost.rulesModified;
      }
      if (!r.comparison.invariants.equivalent) {
        invViol++;
      }
    }

    rows.push({
      ablationId: abl.id,
      name: abl.name,
      failureCount,
      totalCases: cases.length,
      residualFailureRate: parseFloat((failureRate * 100).toFixed(1)),
      deltaFailuresVsC5: failureCount - c5FailureCount,
      mcnemarChi2: chi2,
      mcnemarPValue: pValue,
      satA: cases.length > 0 ? parseFloat(((runs.filter(r => r.repair?.satisfiedA).length / totalCasesDenom) * 100).toFixed(1)) : 0,
      satB: cases.length > 0 ? parseFloat(((runs.filter(r => r.repair?.satisfiedB).length / totalCasesDenom) * 100).toFixed(1)) : 0,
      meanRuntimeMs: meanRuntime,
      modifiedEntities: cases.length > 0 ? Math.round(modEnt / totalCasesDenom) : 0,
      modifiedRules: cases.length > 0 ? Math.round(modRules / totalCasesDenom) : 0,
      invariantViolations: invViol,
      description: abl.desc
    });
  }

  return rows;
}

/**
 * Formate les résultats d'ablation en CSV officiel avec comptages appariés et McNemar.
 */
export function formatAblationCsv(rows: AblationOutcomeRow[]): string {
  const header = 'Ablation Setting,Failure Count,Total Cases,Residual Rate,Delta vs C5,McNemar Chi2,McNemar p-value,SAT(A),SAT(B),Mean Runtime (ms),Invariant Violations,Description';
  const lines = rows.map(r =>
    `${r.ablationId},${r.failureCount},${r.totalCases},${r.residualFailureRate}%,${r.deltaFailuresVsC5 >= 0 ? '+' : ''}${r.deltaFailuresVsC5},${r.mcnemarChi2},${r.mcnemarPValue},${r.satA}%,${r.satB}%,${r.meanRuntimeMs},${r.invariantViolations},"${r.description}"`
  );
  return [header, ...lines].join('\n');
}
