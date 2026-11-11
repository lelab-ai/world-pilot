// src/research/editOrder/experimentRunner.ts
// Harnais d'exécution des permutations d'edits W_AB = B(A(W0)) et W_BA = A(B(W0)).
// Exécute les deux branches depuis le même monde W0 gelé et extrait la comparaison multi-couche.

import type {
  EditOrderExperimentCase,
  ExperimentalCondition,
  ExperimentRunRecord
} from './experimentTypes';
import {
  createBaselineWorld,
  freezeWorld,
  cloneFrozenWorld,
  verifyInitialEquivalence
} from './worldCloneManager';
import { captureCanonicalSnapshot } from './canonicalSnapshot';
import { compareBehavior } from './behavioralEquivalence';
import { applySequenceUnderCondition, parseOrInterpret } from './repairPolicy';
import { evaluateAllPredictors } from './riskPredictors';

/**
 * Exécute un cas expérimental complet sur une condition donnée et produit l'enregistrement de run.
 */
export async function runPermutationExperiment(
  testCase: EditOrderExperimentCase,
  condition: ExperimentalCondition = 'C0_NaiveSequential'
): Promise<ExperimentRunRecord> {
  // 1. Instanciation du monde de référence W0
  const baselineWorld = createBaselineWorld(testCase.initialWorldPrompt, testCase.seed);
  const frozen = freezeWorld(baselineWorld, testCase.initialWorldPrompt, testCase.seed);

  // 2. Création de deux clones strictement identiques
  const worldAB = cloneFrozenWorld(frozen);
  const worldBA = cloneFrozenWorld(frozen);

  if (!verifyInitialEquivalence(worldAB, worldBA)) {
    throw new Error(`[ExperimentRunner] Échec d'invariance W0 : les clones AB et BA diffèrent pour le cas ${testCase.id}.`);
  }

  // 3. Extraction préventive des patchs pour l'évaluation des prédicteurs
  const patchA = parseOrInterpret(testCase.editA, baselineWorld);
  const patchB = parseOrInterpret(testCase.editB, baselineWorld);

  const { predictions } = evaluateAllPredictors(
    baselineWorld,
    testCase.editA,
    testCase.editB,
    patchA,
    patchB,
    testCase.seed
  );

  // 4. Exécution de la branche AB : A d'abord, puis B
  const t0_AB = Date.now();
  const resAB = await applySequenceUnderCondition(worldAB, [testCase.editA, testCase.editB], condition);
  const runtimeAB = Date.now() - t0_AB;

  // 5. Exécution de la branche BA : B d'abord, puis A
  const t0_BA = Date.now();
  const resBA = await applySequenceUnderCondition(worldBA, [testCase.editB, testCase.editA], condition);
  const runtimeBA = Date.now() - t0_BA;

  // 6. Capture des snapshots canoniques des états W0, WA, WB, WAB, WBA
  const snapshotW0 = captureCanonicalSnapshot(baselineWorld, testCase.id, 'W0', 0);
  const snapshotWA = resAB.intermediateWorld ? captureCanonicalSnapshot(resAB.intermediateWorld, testCase.id, 'WA', 0) : undefined;
  const snapshotWB = resBA.intermediateWorld ? captureCanonicalSnapshot(resBA.intermediateWorld, testCase.id, 'WB', 0) : undefined;
  const snapshotAB = captureCanonicalSnapshot(resAB.finalWorld, testCase.id, 'AB', runtimeAB);
  const snapshotBA = captureCanonicalSnapshot(resBA.finalWorld, testCase.id, 'BA', runtimeBA);

  // 7. Comparaison comportementale multi-couche
  const comparison = compareBehavior(snapshotAB, snapshotBA);

  // 8. Synthèse des résultats de réparation (si applicable)
  const repair = {
    triggered: resAB.repairTriggered || resBA.repairTriggered,
    operations: [...resAB.repairOperations, ...resBA.repairOperations],
    cost: {
      entitiesModified: Math.max(resAB.repairCost.entitiesModified, resBA.repairCost.entitiesModified),
      rulesModified: Math.max(resAB.repairCost.rulesModified, resBA.repairCost.rulesModified),
      transformDistance: Math.max(resAB.repairCost.transformDistance, resBA.repairCost.transformDistance)
    },
    satisfiedA: resAB.satisfiedA && resBA.satisfiedB,
    satisfiedB: resAB.satisfiedB && resBA.satisfiedA
  };

  return {
    experimentId: testCase.id,
    benchmarkVersion: '1.0.0',
    condition,
    seed: testCase.seed,
    initialWorld: {
      prompt: testCase.initialWorldPrompt,
      hash: frozen.stateHash
    },
    editA: testCase.editA,
    editB: testCase.editB,
    branchAB: {
      steps: resAB.steps,
      snapshotHash: snapshotAB.snapshotHash,
      runtimeMs: runtimeAB
    },
    branchBA: {
      steps: resBA.steps,
      snapshotHash: snapshotBA.snapshotHash,
      runtimeMs: runtimeBA
    },
    comparison,
    predictions: {
      B0_Random: { score: predictions.B0_Random.score, predictedRegression: predictions.B0_Random.predictedRegression },
      B0bis_AlwaysPositive: { score: predictions.B0bis_AlwaysPositive.score, predictedRegression: predictions.B0bis_AlwaysPositive.predictedRegression },
      B1_TextSimilarity: { score: predictions.B1_TextSimilarity.score, predictedRegression: predictions.B1_TextSimilarity.predictedRegression },
      B1a_LexicalSimilarity: { score: predictions.B1a_LexicalSimilarity.score, predictedRegression: predictions.B1a_LexicalSimilarity.predictedRegression },
      B1b_EmbeddingCosine: { score: predictions.B1b_EmbeddingCosine.score, predictedRegression: predictions.B1b_EmbeddingCosine.predictedRegression },
      B2_EntityOverlap: { score: predictions.B2_EntityOverlap.score, predictedRegression: predictions.B2_EntityOverlap.predictedRegression },
      B3_ParsedIdOverlap: { score: predictions.B3_ParsedIdOverlap.score, predictedRegression: predictions.B3_ParsedIdOverlap.predictedRegression },
      B4_GeometricOverlap: { score: predictions.B4_GeometricOverlap.score, predictedRegression: predictions.B4_GeometricOverlap.predictedRegression },
      B5_LLMConflictJudge: { score: predictions.B5_LLMConflictJudge.score, predictedRegression: predictions.B5_LLMConflictJudge.predictedRegression },
      B6_DependencyOverlap: { score: predictions.B6_DependencyOverlap.score, predictedRegression: predictions.B6_DependencyOverlap.predictedRegression }
    },
    repair,
    snapshots: {
      W0: snapshotW0,
      WA: snapshotWA,
      WB: snapshotWB,
      WAB: snapshotAB,
      WBA: snapshotBA
    },
    rawWorlds: {
      W0: baselineWorld,
      WA: resAB.intermediateWorld,
      WB: resBA.intermediateWorld,
      WAB: resAB.finalWorld,
      WBA: resBA.finalWorld
    }
  };
}

/**
 * Exécute un ensemble de cas sur une condition donnée en agrégeant les résultats.
 */
export async function runBatchExperiments(
  cases: EditOrderExperimentCase[],
  condition: ExperimentalCondition = 'C0_NaiveSequential'
): Promise<ExperimentRunRecord[]> {
  const records: ExperimentRunRecord[] = [];
  for (const c of cases) {
    const record = await runPermutationExperiment(c, condition);
    records.push(record);
  }
  return records;
}
