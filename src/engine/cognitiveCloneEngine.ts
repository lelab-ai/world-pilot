// src/engine/cognitiveCloneEngine.ts
// Moteur de Jumeau Numérique Cognitif (Cognitive Digital Twin) & Inverse Reinforcement Learning (IRL)
// Permet la distillation comportementale de l'humain en un agent IA autonome reproduisant son style décisionnel.

import { CognitiveSessionReport } from './cognitiveTraceRecorder';
import { HumanAITeamingMetrics } from './coWorkerAgent';

/**
 * Poids de récompense implicites extraits par Inverse Reinforcement Learning (IRL).
 * Représente la fonction d'utilité sous-jacente qui guide les choix de l'opérateur humain.
 */
export interface IRLPreferenceWeights {
  speed: number;          // 0 - 100 : Priorité accordée à la vitesse d'exécution
  precision: number;      // 0 - 100 : Rigueur thermique, respect scrupuleux des paliers
  aesthetics: number;     // 0 - 100 : Soin apporté au dressage, garniture, finitions
  riskTolerance: number;  // 0 - 100 : Sang-froid face aux anomalies et températures élevées
  collaboration: number;  // 0 - 100 : Propension à déléguer aux pairs IA
}

/**
 * Définition synthétisée du Jumeau Numérique Cognitif (Clone de l'opérateur).
 */
export interface CognitiveClone {
  cloneId: string;
  operatorName: string;
  fidelityScore: number;                 // 0 - 100% : Fidélité statistique par rapport aux traces réelles
  latentWeights: IRLPreferenceWeights;   // Fonction d'utilité extraite par IRL
  dominantArchetype: string;             // Profil dominant (ex: "Artisan Équilibré", "Pionnier Audacieux")
  actionProbabilities: Record<string, number>; // Fréquences relatives des actions
  averageDecisionLatencyMs: number;
  latencyStandardDeviationMs: number;
  recoveryPolicy: 'cautious' | 'reactive' | 'creative' | 'aggressive';
  trainingEpisodesCount: number;
  totalDecisionsDistilled: number;
  synthesizedAt: number;
}

/**
 * Résultat d'une simulation exécutée par le Jumeau Numérique (Rollout autonome).
 */
export interface CloneRolloutResult {
  rolloutId: string;
  cloneId: string;
  targetTask: string;
  simulatedSteps: Array<{
    stepIndex: number;
    actionType: string;
    simulatedLatencyMs: number;
    heatLevel: number;
    temperature: number;
    doneness: number;
    explanation: string;
  }>;
  totalDurationSec: number;
  finalScore: number;
  klDivergence: number; // Divergence de Kullback-Leibler par rapport à la session humaine (0 = copie parfaite)
  alignmentScore: number; // 0 - 100% (100 - (klDivergence * 50))
}

/**
 * Analyse comparative entre l'humain réel et son clone numérique.
 */
export interface CloneComparisonAnalysis {
  behavioralSimilarityPercent: number;
  latencyParityPercent: number;
  riskToleranceDelta: number;
  alignmentRating: 'Copie Quasi-Identique' | 'Forte Concordance' | 'Divergence Modérée' | 'Écart Substantiel';
  synthesisSummary: string;
}

/**
 * Extrait les poids de récompense implicites (IRL) à partir d'un rapport de session cognitive.
 */
export function estimateIRLPreferences(
  report: CognitiveSessionReport,
  teaming?: HumanAITeamingMetrics
): IRLPreferenceWeights {
  const traces = report.traces || [];
  const total = Math.max(1, traces.length);

  // 1. Vitesse : Déduite de la latence moyenne et du tempo global
  // Latence < 1200ms -> Poids de vitesse élevé (> 80)
  const speed = Math.min(100, Math.max(10, Math.round(100 - (report.averageLatencyMs / 50))));

  // 2. Précision : Calculée à partir du taux d'erreurs, stabilité thermique et respect de la doneness
  const warningCount = report.errorWarningsCount || 0;
  const tempVariance = traces.reduce((acc, t) => acc + Math.abs(t.temperature - 110), 0) / total;
  const precision = Math.min(100, Math.max(15, Math.round(100 - (warningCount * 12) - (tempVariance * 0.4))));

  // 3. Esthétique : Fréquence des actions de dressage, sauçage, dégustation, style
  const aestheticActions = traces.filter(t => 
    t.actionType.includes('plate') || 
    t.actionType.includes('sauce') || 
    t.actionType.includes('taste') ||
    t.actionType.includes('garnish')
  ).length;
  const aesthetics = Math.min(100, Math.max(20, Math.round(35 + (aestheticActions / total) * 150)));

  // 4. Tolérance au risque : Temps passé à haute température (> 150°C) sans panique
  const highTempSteps = traces.filter(t => t.temperature >= 150).length;
  const rapidRecoveries = traces.filter(t => t.isErrorRecovery && t.latencyMs < 1800).length;
  const riskTolerance = Math.min(100, Math.max(10, Math.round(25 + ((highTempSteps * 8) + (rapidRecoveries * 10)))));

  // 5. Collaboration : Basée sur les métriques de teaming Humain-IA
  let collaboration = 45;
  if (teaming) {
    const delegationRate = Math.min(1.0, teaming.delegatedTasksCount / Math.max(1, total));
    collaboration = Math.min(100, Math.max(10, Math.round((teaming.trustScore * 0.6) + (delegationRate * 80))));
  }

  return {
    speed,
    precision,
    aesthetics,
    riskTolerance,
    collaboration
  };
}

/**
 * Synthétise un Jumeau Numérique Cognitif complet à partir des traces d'interactions humaines.
 */
export function synthesizeCognitiveClone(
  report: CognitiveSessionReport,
  teaming?: HumanAITeamingMetrics,
  operatorName = 'Opérateur Alpha'
): CognitiveClone {
  const traces = report.traces || [];
  const total = Math.max(1, traces.length);

  const irlWeights = estimateIRLPreferences(report, teaming);

  // Distribution des fréquences d'actions
  const actionCounts: Record<string, number> = {};
  traces.forEach(t => {
    actionCounts[t.actionType] = (actionCounts[t.actionType] || 0) + 1;
  });

  const actionProbabilities: Record<string, number> = {};
  Object.keys(actionCounts).forEach(act => {
    actionProbabilities[act] = Math.round((actionCounts[act] / total) * 1000) / 1000;
  });

  // Écart-type de latence
  const avgLatency = report.averageLatencyMs || 1500;
  const variance = traces.reduce((acc, t) => acc + Math.pow(t.latencyMs - avgLatency, 2), 0) / total;
  const latencyStd = Math.round(Math.sqrt(variance));

  // Détermination de la politique de récupération post-friction
  let recoveryPolicy: 'cautious' | 'reactive' | 'creative' | 'aggressive' = 'reactive';
  if (irlWeights.precision > 75 && irlWeights.riskTolerance < 40) {
    recoveryPolicy = 'cautious';
  } else if (irlWeights.riskTolerance > 75) {
    recoveryPolicy = 'aggressive';
  } else if (irlWeights.aesthetics > 70) {
    recoveryPolicy = 'creative';
  }

  // Calcul du score de fidélité (dépend de la richesse de la trace et de la régularité)
  const volumeBonus = Math.min(30, total * 3);
  const consistencyBonus = Math.max(0, 40 - (latencyStd / 80));
  const fidelityScore = Math.min(99, Math.max(52, Math.round(30 + volumeBonus + consistencyBonus)));

  // Archétype dominant
  let dominantArchetype = 'Artisan Équilibré';
  if (irlWeights.speed > 75 && irlWeights.precision > 75) {
    dominantArchetype = 'Maître Exécutant Virtuose';
  } else if (irlWeights.speed > 75) {
    dominantArchetype = 'Pionnier Rapide & Audacieux';
  } else if (irlWeights.precision > 80) {
    dominantArchetype = 'Analyste Rigoureux de Précision';
  } else if (irlWeights.aesthetics > 75) {
    dominantArchetype = 'Styliste Gastronomique Poète';
  } else if (irlWeights.collaboration > 75) {
    dominantArchetype = 'Chef d’Orchestre Symbiotique';
  }

  return {
    cloneId: `CLONE-${Date.now().toString(36).toUpperCase()}`,
    operatorName,
    fidelityScore,
    latentWeights: irlWeights,
    dominantArchetype,
    actionProbabilities,
    averageDecisionLatencyMs: avgLatency,
    latencyStandardDeviationMs: latencyStd,
    recoveryPolicy,
    trainingEpisodesCount: 1,
    totalDecisionsDistilled: total,
    synthesizedAt: Date.now()
  };
}

/**
 * Calcule la divergence de Kullback-Leibler empirique entre deux distributions d'actions.
 */
export function calculateKLDivergence(
  p: Record<string, number>,
  q: Record<string, number>
): number {
  let kl = 0;
  const epsilon = 1e-4; // Lissage de Laplace pour éviter log(0)

  const allKeys = Array.from(new Set([...Object.keys(p), ...Object.keys(q)]));

  for (const key of allKeys) {
    const probP = Math.max(epsilon, p[key] ?? epsilon);
    const probQ = Math.max(epsilon, q[key] ?? epsilon);
    kl += probP * Math.log(probP / probQ);
  }

  return Math.max(0, Math.round(kl * 1000) / 1000);
}

/**
 * Simule un Rollout autonome exécuté par le Jumeau Numérique selon sa politique distillée.
 */
export function runCloneRollout(
  clone: CognitiveClone,
  targetTask = 'Master Gastronomic Simulation',
  stepsCount = 6
): CloneRolloutResult {
  const simulatedSteps: CloneRolloutResult['simulatedSteps'] = [];
  const probEntries = Object.entries(clone.actionProbabilities).filter(([, p]) => p > 0);
  const plannedActions: string[] = [];

  if (probEntries.length > 0 && stepsCount > 0) {
    const probSum = probEntries.reduce((acc, [, p]) => acc + p, 0) || 1;
    const quotas = probEntries.map(([act, p]) => {
      const exact = (p / probSum) * stepsCount;
      const floor = Math.floor(exact);
      return { act, count: floor, remainder: exact - floor };
    });
    let allocated = quotas.reduce((acc, q) => acc + q.count, 0);
    quotas
      .slice()
      .sort((a, b) => b.remainder - a.remainder)
      .forEach(q => {
        if (allocated < stepsCount) {
          const target = quotas.find(item => item.act === q.act);
          if (target) {
            target.count += 1;
            allocated += 1;
          }
        }
      });
    quotas.forEach(q => {
      for (let c = 0; c < q.count; c++) {
        plannedActions.push(q.act);
      }
    });
  }
  const fallbackPool = ['chop', 'heat_change', 'season', 'taste', 'plate', 'sauce'];

  let currentTemp = 20;
  let currentDoneness = 0;
  let currentHeat = 1;
  let totalTimeMs = 0;

  for (let i = 0; i < stepsCount; i++) {
    // Sélection selon les affinités probabilistes distillées du clone
    const chosenAction = plannedActions[i] || fallbackPool[i % fallbackPool.length];

    // Bruit gaussien sur la latence autour de la moyenne de l'humain
    const noise = (Math.random() - 0.5) * clone.latencyStandardDeviationMs * 0.4;
    const simLatency = Math.max(400, Math.round(clone.averageDecisionLatencyMs + noise));
    totalTimeMs += simLatency;

    // Simulation de l'évolution thermodynamique
    if (chosenAction.includes('heat') || clone.latentWeights.speed > 70) {
      currentHeat = clone.latentWeights.riskTolerance > 65 ? 3 : 2;
    }
    currentTemp = Math.min(205, currentTemp + (currentHeat * 18));
    currentDoneness = Math.min(100, Math.round(((i + 1) / stepsCount) * 100));

    simulatedSteps.push({
      stepIndex: i + 1,
      actionType: chosenAction,
      simulatedLatencyMs: simLatency,
      heatLevel: currentHeat,
      temperature: currentTemp,
      doneness: currentDoneness,
      explanation: `Action générée par politique distillée (${clone.dominantArchetype}) : ${chosenAction} à ${currentTemp}°C`
    });
  }

  // Calcul d'une distribution empirique du rollout
  const simCounts: Record<string, number> = {};
  simulatedSteps.forEach(s => {
    simCounts[s.actionType] = (simCounts[s.actionType] || 0) + 1;
  });
  const simProbabilities: Record<string, number> = {};
  Object.keys(simCounts).forEach(act => {
    simProbabilities[act] = simCounts[act] / stepsCount;
  });

  const klDivergence = calculateKLDivergence(clone.actionProbabilities, simProbabilities);
  const alignmentScore = Math.min(100, Math.max(25, Math.round(100 - (klDivergence * 30))));
  const finalScore = Math.min(100, Math.max(50, Math.round((clone.fidelityScore * 0.5) + (alignmentScore * 0.5))));

  return {
    rolloutId: `ROLLOUT-${Date.now().toString(36).toUpperCase()}`,
    cloneId: clone.cloneId,
    targetTask,
    simulatedSteps,
    totalDurationSec: Math.round(totalTimeMs / 1000),
    finalScore,
    klDivergence,
    alignmentScore
  };
}

/**
 * Compare la trajectoire du clone à la session humaine d'origine.
 */
export function compareCloneWithHuman(
  humanReport: CognitiveSessionReport,
  rollout: CloneRolloutResult,
  clone: CognitiveClone
): CloneComparisonAnalysis {
  const behavioralSimilarityPercent = rollout.alignmentScore;

  const humanAvgLatency = humanReport.averageLatencyMs || 1500;
  const cloneAvgLatency = rollout.simulatedSteps.reduce((acc, s) => acc + s.simulatedLatencyMs, 0) / Math.max(1, rollout.simulatedSteps.length);
  const latencyParityPercent = Math.min(100, Math.max(20, Math.round(100 - Math.abs(humanAvgLatency - cloneAvgLatency) / 30)));

  const riskToleranceDelta = Math.round(clone.latentWeights.riskTolerance - 50);

  let alignmentRating: CloneComparisonAnalysis['alignmentRating'] = 'Forte Concordance';
  if (behavioralSimilarityPercent >= 88) {
    alignmentRating = 'Copie Quasi-Identique';
  } else if (behavioralSimilarityPercent < 40) {
    alignmentRating = 'Écart Substantiel';
  } else if (behavioralSimilarityPercent < 60) {
    alignmentRating = 'Divergence Modérée';
  }

  const synthesisSummary = `Le Jumeau Numérique ${clone.cloneId} (${clone.dominantArchetype}) reproduit fidèlement la dynamique décisionnelle avec une fidélité de ${clone.fidelityScore}% et un alignement de ${behavioralSimilarityPercent}%. La fonction de récompense IRL privilégie Précision=${clone.latentWeights.precision} et Vitesse=${clone.latentWeights.speed}.`;

  return {
    behavioralSimilarityPercent,
    latencyParityPercent,
    riskToleranceDelta,
    alignmentRating,
    synthesisSummary
  };
}
