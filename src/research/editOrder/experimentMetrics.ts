// src/research/editOrder/experimentMetrics.ts
// Calcul des métriques statistiques globales : AUROC, AUPRC, taux de régression par couche, et réduction de pannes.

import type { ExperimentRunRecord, PredictorName, RegressionClass } from './experimentTypes';

export interface BenchmarkSummaryMetrics {
  totalRuns: number;
  equivalentCount: number;
  divergentCount: number;
  prevalenceRate: number; // Taux de divergence globale (ex: 35%)
  layerRegressionRates: {
    geometry: number;
    physics: number;
    navigation: number;
    interaction: number;
    causal: number;
    tasks: number;
    invariants: number;
  };
  regressionClassCounts: Record<RegressionClass, number>;
  crossLayerDesyncRate: number;
  predictorMetrics: Record<PredictorName, {
    auroc: number;
    auprc: number;
    precision: number;
    recall: number;
    f1: number;
  }>;
  conditionFailureRates: Record<string, {
    failureRate: number;
    reductionVsC0: number;
    avgRuntimeMs: number;
  }>;
}

/**
 * Agrége un ensemble de runs pour produire les statistiques complètes du benchmark.
 */
export function computeBenchmarkSummaryMetrics(
  c0Runs: ExperimentRunRecord[],
  allConditionRuns?: Record<string, ExperimentRunRecord[]>
): BenchmarkSummaryMetrics {
  const actualTotal = c0Runs.length;
  const denom = actualTotal || 1;
  const divergentRuns = c0Runs.filter(r => !r.comparison.equivalent);
  const equivalentCount = actualTotal - divergentRuns.length;
  const prevalenceRate = actualTotal === 0 ? 0 : Math.round((divergentRuns.length / denom) * 1000) / 1000;

  // Taux par couche
  let countGeo = 0, countPhys = 0, countNav = 0, countInter = 0, countCausal = 0, countTask = 0, countInv = 0;
  let crossLayerCount = 0;

  const classCounts: Record<RegressionClass, number> = {
    NONE: 0,
    VISUAL_ONLY: 0,
    GEOMETRY: 0,
    PHYSICS: 0,
    NAVIGATION: 0,
    INTERACTION: 0,
    CAUSAL_REFERENCE: 0,
    TASK_FAILURE: 0,
    CROSS_LAYER_DESYNC: 0,
    IDENTITY_DRIFT: 0,
    DEADLOCK: 0,
    SAFETY_INVARIANT: 0,
    UNKNOWN: 0
  };

  c0Runs.forEach(r => {
    if (!r.comparison.geometry.equivalent) countGeo++;
    if (!r.comparison.physics.equivalent) countPhys++;
    if (!r.comparison.navigation.equivalent) countNav++;
    if (!r.comparison.interactions.equivalent) countInter++;
    if (!r.comparison.causal.equivalent) countCausal++;
    if (!r.comparison.tasks.equivalent) countTask++;
    if (!r.comparison.invariants.equivalent) countInv++;

    r.comparison.regressionClasses.forEach(c => {
      classCounts[c] = (classCounts[c] || 0) + 1;
    });

    if (r.comparison.regressionClasses.includes('CROSS_LAYER_DESYNC')) {
      crossLayerCount++;
    }
  });

  // Évaluation de tous les prédicteurs (B0 à B6 + variantes)
  const predictors: PredictorName[] = [
    'B0_Random',
    'B0bis_AlwaysPositive',
    'B1_TextSimilarity',
    'B1a_LexicalSimilarity',
    'B1b_EmbeddingCosine',
    'B2_EntityOverlap',
    'B3_ParsedIdOverlap',
    'B4_GeometricOverlap',
    'B5_LLMConflictJudge',
    'B6_DependencyOverlap'
  ];

  const groundTruth = c0Runs.map(r => !r.comparison.equivalent);

  const predictorMetrics: any = {};
  predictors.forEach(pred => {
    const scores = c0Runs.map(r => r.predictions[pred]?.score || 0);
    const predictedClasses = c0Runs.map(r => r.predictions[pred]?.predictedRegression || false);

    let tp = 0, fp = 0, fn = 0, tn = 0;
    for (let i = 0; i < actualTotal; i++) {
      const actual = groundTruth[i];
      const predVal = predictedClasses[i];
      if (predVal && actual) tp++;
      else if (predVal && !actual) fp++;
      else if (!predVal && actual) fn++;
      else tn++;
    }

    const precision = (tp + fp) === 0 ? 0 : Math.round((tp / (tp + fp)) * 1000) / 1000;
    const recall = (tp + fn) === 0 ? 0 : Math.round((tp / (tp + fn)) * 1000) / 1000;
    const f1 = (precision + recall) === 0 ? 0 : Math.round((2 * precision * recall / (precision + recall)) * 1000) / 1000;

    // Calcul empirique de l'AUROC (séparabilité des distributions)
    const auroc = computeEmpiricalAUROC(scores, groundTruth);
    const auprc = computeEmpiricalAUPRC(scores, groundTruth);

    predictorMetrics[pred] = {
      auroc,
      auprc,
      precision,
      recall,
      f1
    };
  });

  // Taux de pannes par condition
  const conditionFailureRates: any = {};
  if (allConditionRuns) {
    const baselineFailures = divergentRuns.length;
    Object.entries(allConditionRuns).forEach(([cond, runs]) => {
      const fails = runs.filter(r => !r.comparison.equivalent).length;
      const rate = runs.length === 0 ? 0 : fails / runs.length;
      const reduction = baselineFailures === 0 ? 0 : (baselineFailures - fails) / baselineFailures;
      const avgRuntime = runs.reduce((acc, r) => acc + r.branchAB.runtimeMs + r.branchBA.runtimeMs, 0) / (runs.length || 1);

      conditionFailureRates[cond] = {
        failureRate: Math.round(rate * 1000) / 1000,
        reductionVsC0: Math.round(reduction * 1000) / 1000,
        avgRuntimeMs: Math.round(avgRuntime)
      };
    });
  }

  return {
    totalRuns: actualTotal,
    equivalentCount,
    divergentCount: divergentRuns.length,
    prevalenceRate,
    layerRegressionRates: {
      geometry: Math.round((countGeo / denom) * 1000) / 1000,
      physics: Math.round((countPhys / denom) * 1000) / 1000,
      navigation: Math.round((countNav / denom) * 1000) / 1000,
      interaction: Math.round((countInter / denom) * 1000) / 1000,
      causal: Math.round((countCausal / denom) * 1000) / 1000,
      tasks: Math.round((countTask / denom) * 1000) / 1000,
      invariants: Math.round((countInv / denom) * 1000) / 1000
    },
    regressionClassCounts: classCounts,
    crossLayerDesyncRate: Math.round((crossLayerCount / denom) * 1000) / 1000,
    predictorMetrics,
    conditionFailureRates
  };
}

/**
 * Calcule l'Aire sous la Courbe ROC (AUROC) par classement rangé (Wilcoxon-Mann-Whitney).
 */
function computeEmpiricalAUROC(scores: number[], labels: boolean[]): number {
  const positives = scores.filter((_, i) => labels[i]);
  const negatives = scores.filter((_, i) => !labels[i]);

  if (positives.length === 0 || negatives.length === 0) return 0.5;

  let concordant = 0;
  let ties = 0;

  positives.forEach(p => {
    negatives.forEach(n => {
      if (p > n) concordant++;
      else if (p === n) ties++;
    });
  });

  const totalPairs = positives.length * negatives.length;
  return Math.round(((concordant + 0.5 * ties) / totalPairs) * 1000) / 1000;
}

/**
 * Calcule l'Aire sous la Courbe Precision-Recall (AUPRC).
 */
function computeEmpiricalAUPRC(scores: number[], labels: boolean[]): number {
  const pairs = scores.map((s, i) => ({ score: s, label: labels[i] }));
  pairs.sort((a, b) => b.score - a.score);

  const totalPositives = labels.filter(Boolean).length;
  if (totalPositives === 0) return 0;

  let truePositives = 0;
  let falsePositives = 0;
  let prevRecall = 0;
  let area = 0;

  pairs.forEach(p => {
    if (p.label) truePositives++;
    else falsePositives++;

    const precision = truePositives / (truePositives + falsePositives);
    const recall = truePositives / totalPositives;

    area += (recall - prevRecall) * precision;
    prevRecall = recall;
  });

  return Math.round(area * 1000) / 1000;
}
