// src/engine/counterfactualEngine.ts
// Moteur de rejeu contrefactuel & branching de trajectoires décisionnelles pour WorldPilot.
// Permet de bifurquer à n'importe quelle étape t_k d'une session humaine,
// et de comparer l'issue avec un déroulement autonome conduit par un agent IA.

import { CognitivePersonaType, CognitiveSessionReport, CognitiveTraceStep, PERSONA_METADATA } from './cognitiveTraceRecorder';

export interface SimulationSnapshot {
  stepIndex: number;
  timestamp: number;
  cookingHeatLevel: number;
  cookingTemperature: number;
  cookingDoneness: number;
  isDishPlated: boolean;
  platingStyle: string;
  platingGarnish: string;
  isDishSauced: boolean;
  activeQuestId: string | null;
  activeQuestStepIndex: number;
  choppedIngredientsCount: number;
}

export interface CounterfactualBranch {
  id: string;
  parentBranchId: string | null;
  forkStepIndex: number;
  title: string;
  authorType: 'human' | 'ai-bot';
  botPersona?: CognitivePersonaType;
  createdAt: number;
  snapshot: SimulationSnapshot;
  traces: CognitiveTraceStep[];
  outcomeScore: number; // 0 à 100
  outcomeSummary: string;
  predictedDurationSec: number;
  divergenceReason?: string;
  temperatureStabilityScore: number; // 0 à 100
  efficiencyScore: number; // 0 à 100
}

export interface BranchComparisonResult {
  branchA: CounterfactualBranch;
  branchB: CounterfactualBranch;
  scoreDelta: number; // branchB - branchA
  durationDeltaSec: number;
  stabilityDelta: number;
  divergencePointStep: number;
  verdict: string;
  keyInsights: string[];
}

/**
 * Crée la branche racine issue de la trajectoire humaine actuelle.
 */
export function createRootBranch(
  report: CognitiveSessionReport,
  snapshot: SimulationSnapshot
): CounterfactualBranch {
  const traces = [...report.traces];
  const totalDecisions = traces.length;
  const tempVariance = calculateTemperatureStability(traces);
  const efficiency = report.proceduralEfficiency;
  
  // Calcul du score d'issue global
  const outcomeScore = Math.max(30, Math.min(100, Math.round(
    (efficiency * 0.4) + (report.resilienceScore * 0.3) + (tempVariance * 0.3)
  )));

  return {
    id: 'branch-root-human',
    parentBranchId: null,
    forkStepIndex: 0,
    title: 'Trajectoire Humaine (Session Actuelle)',
    authorType: 'human',
    createdAt: report.startTime,
    snapshot,
    traces,
    outcomeScore,
    outcomeSummary: `Session humaine avec ${totalDecisions} décisions enregistrées. Profil : ${report.personaLabel}.`,
    predictedDurationSec: report.durationSec || 60,
    temperatureStabilityScore: tempVariance,
    efficiencyScore: efficiency
  };
}

/**
 * Crée une nouvelle branche contrefactuelle à partir d'une étape spécifique.
 */
export function forkCounterfactualBranch(
  parentBranch: CounterfactualBranch,
  forkStepIndex: number,
  customTitle?: string
): CounterfactualBranch {
  const safeForkIndex = Math.max(0, Math.min(forkStepIndex, parentBranch.traces.length));
  const tracesUpToFork = parentBranch.traces.slice(0, safeForkIndex);
  const forkStep = safeForkIndex > 0 ? parentBranch.traces[safeForkIndex - 1] : undefined;

  const snapshot: SimulationSnapshot = {
    ...parentBranch.snapshot,
    stepIndex: safeForkIndex,
    cookingHeatLevel: forkStep ? forkStep.heatLevel : 1,
    cookingTemperature: forkStep ? forkStep.temperature : 85,
    cookingDoneness: forkStep ? forkStep.doneness : 50,
    activeQuestStepIndex: forkStep ? forkStep.activeQuestStepIndex : 0,
    isDishPlated: tracesUpToFork.some(t => t.actionType.includes('plate')),
    isDishSauced: tracesUpToFork.some(t => t.actionType.includes('sauce'))
  };

  const id = `branch-fork-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const title = customTitle || `Bifurcation à l'étape #${safeForkIndex} (${forkStep ? forkStep.actionType : 'début'})`;

  return {
    id,
    parentBranchId: parentBranch.id,
    forkStepIndex: safeForkIndex,
    title,
    authorType: 'human',
    createdAt: Date.now(),
    snapshot,
    traces: tracesUpToFork,
    outcomeScore: parentBranch.outcomeScore,
    outcomeSummary: `Branche interactive prête. L'utilisateur ou l'IA peut explorer une suite alternative à partir du pas #${safeForkIndex}.`,
    predictedDurationSec: Math.round(parentBranch.predictedDurationSec * (safeForkIndex / Math.max(1, parentBranch.traces.length))),
    temperatureStabilityScore: parentBranch.temperatureStabilityScore,
    efficiencyScore: parentBranch.efficiencyScore
  };
}

/**
 * Simule le déroulement autonome d'un agent IA (Policy Rollout) depuis le point de bifurcation
 * selon un persona cognitif donné (Analyste, Explorateur, Impulsif, Hésitant).
 */
export function generateAIBotRollout(
  branch: CounterfactualBranch,
  botPersona: CognitivePersonaType,
  questTitle?: string
): CounterfactualBranch {
  const personaMeta = PERSONA_METADATA[botPersona];
  const startTraces = [...branch.traces];
  const forkTrace = branch.traces[branch.forkStepIndex - 1];
  
  let currentTemp = forkTrace ? forkTrace.temperature : (branch.snapshot.cookingTemperature || 80);
  let currentDoneness = forkTrace ? forkTrace.doneness : (branch.snapshot.cookingDoneness || 40);
  let currentHeat = forkTrace ? forkTrace.heatLevel : (branch.snapshot.cookingHeatLevel || 1);
  let activeStep = forkTrace ? forkTrace.activeQuestStepIndex : (branch.snapshot.activeQuestStepIndex || 1);
  const now = Date.now();

  const simulatedTraces: CognitiveTraceStep[] = [...startTraces];
  let stepIndex = simulatedTraces.length + 1;
  let relTimeSec = startTraces.length > 0 ? startTraces[startTraces.length - 1].relativeTimeSec : 0;

  // Modélisation des politiques comportementales par persona
  const remainingStepsToSimulate = Math.max(2, 5 - activeStep);

  for (let s = 0; s < remainingStepsToSimulate; s++) {
    activeStep = Math.min(4, activeStep + 1);
    
    // Latence et cinétique selon le persona
    let latencyMs = 1200;
    let actionType = 'heat_change';
    let target = 'wp-cocotte';
    let warning: string | undefined = undefined;
    let isErrorRecovery = false;

    const prevTrace = simulatedTraces[simulatedTraces.length - 1];
    const hadRecentOverheatOrWarning = Boolean(prevTrace?.warningTriggered) || currentTemp > 150;

    if (botPersona === 'methodical-analyst') {
      latencyMs = 1800 + Math.floor(Math.random() * 400);
      currentHeat = 1; // Feu doux constant
      currentTemp = currentTemp > 105 ? Math.max(105, currentTemp - 25) : Math.min(105, currentTemp + 10);
      currentDoneness = Math.min(100, currentDoneness + 20);
      actionType = s === remainingStepsToSimulate - 1 ? 'plate' : (s === 0 ? 'chop' : 'season');
      target = s === 0 ? 'wp-planche-a-decouper' : (s === remainingStepsToSimulate - 1 ? 'wp-assiette' : 'wp-cocotte');
      isErrorRecovery = hadRecentOverheatOrWarning && s === 0;
    } else if (botPersona === 'intuitive-explorer') {
      latencyMs = 1100 + Math.floor(Math.random() * 500);
      currentHeat = 2; // Allure dynamique
      currentTemp = currentTemp > 135 ? Math.max(135, currentTemp - 20) : Math.min(135, currentTemp + 18);
      currentDoneness = Math.min(100, currentDoneness + 22);
      actionType = s === 1 ? 'season' : (s === remainingStepsToSimulate - 1 ? 'sauce' : 'taste');
      target = 'wp-cocotte';
    } else if (botPersona === 'impulsive-rushed') {
      latencyMs = 600 + Math.floor(Math.random() * 300);
      currentHeat = 3; // Plein feu
      currentTemp = Math.min(205, currentTemp + 35);
      currentDoneness = Math.min(115, currentDoneness + 30);
      actionType = s === 0 ? 'heat_change' : 'plate';
      target = 'wp-cocotte';
      if (currentTemp > 180) {
        warning = 'Surchauffe thermique détectée (>190°C) sans bouillon protecteur.';
      }
    } else { // hesitant-learner
      latencyMs = 3800 + Math.floor(Math.random() * 1200);
      currentHeat = 1;
      currentTemp = currentTemp > 90 ? Math.max(90, currentTemp - 30) : Math.min(90, currentTemp + 5);
      currentDoneness = Math.min(95, currentDoneness + 12);
      actionType = s === 0 ? 'ask_advice' : 'season';
      target = 'agent_auguste';
      isErrorRecovery = hadRecentOverheatOrWarning || s === 0;
    }

    relTimeSec += Math.round((latencyMs / 1000) * 10) / 10;

    simulatedTraces.push({
      stepIndex,
      timestamp: now + (relTimeSec * 1000),
      relativeTimeSec: Math.round(relTimeSec * 10) / 10,
      actionType,
      targetEntityId: target,
      latencyMs,
      isHesitation: latencyMs > 3200,
      heatLevel: currentHeat,
      temperature: Math.round(currentTemp),
      doneness: Math.min(100, Math.round(currentDoneness)),
      activeQuestId: branch.snapshot.activeQuestId,
      activeQuestStepIndex: activeStep,
      warningTriggered: warning,
      isErrorRecovery
    });

    stepIndex++;
  }

  // Évaluation de l'issue de la simulation
  const tempVariance = calculateTemperatureStability(simulatedTraces);
  let outcomeScore = 80;
  let summary = '';

  if (botPersona === 'methodical-analyst') {
    outcomeScore = 96;
    summary = `Déroulement IA méthodique parfait : régulation thermique exemplaire (${Math.round(currentTemp)}°C), zéro friction, cuisson à cœur optimale.`;
  } else if (botPersona === 'intuitive-explorer') {
    outcomeScore = 91;
    summary = `Déroulement IA exploratoire agile : créativité aromatique, bonne vivacité d'exécution (${Math.round(relTimeSec)}s), cuisson maîtrisée.`;
  } else if (botPersona === 'impulsive-rushed') {
    outcomeScore = 68;
    summary = `Déroulement IA impulsif : complétion ultra-rapide mais pénalité thermique sévère due à une surchauffe à ${Math.round(currentTemp)}°C.`;
  } else {
    outcomeScore = 83;
    summary = `Déroulement IA prudent : recherche d'assistance et cadence modérée, garantissant l'absence de brûlage.`;
  }

  if (questTitle) {
    summary += ` Scénario : [${questTitle}].`;
  }

  const id = `branch-ai-${botPersona}-${Date.now()}`;
  const title = `Rollout IA · ${personaMeta.icon} ${personaMeta.label}`;

  return {
    id,
    parentBranchId: branch.id,
    forkStepIndex: branch.forkStepIndex,
    title,
    authorType: 'ai-bot',
    botPersona,
    createdAt: Date.now(),
    snapshot: {
      ...branch.snapshot,
      cookingHeatLevel: currentHeat,
      cookingTemperature: currentTemp,
      cookingDoneness: Math.min(100, currentDoneness),
      activeQuestStepIndex: activeStep,
      isDishPlated: true
    },
    traces: simulatedTraces,
    outcomeScore,
    outcomeSummary: summary,
    predictedDurationSec: Math.round(relTimeSec),
    divergenceReason: `Contrefactuel simulé à partir du pas #${branch.forkStepIndex} avec la politique IA : ${personaMeta.label}.`,
    temperatureStabilityScore: tempVariance,
    efficiencyScore: botPersona === 'impulsive-rushed' ? 60 : (botPersona === 'methodical-analyst' ? 98 : 88)
  };
}

/**
 * Compare deux branches contrefactuelles (ex: Humain vs Agent IA).
 */
export function compareBranches(
  branchA: CounterfactualBranch,
  branchB: CounterfactualBranch
): BranchComparisonResult {
  const scoreDelta = branchB.outcomeScore - branchA.outcomeScore;
  const durationDeltaSec = branchB.predictedDurationSec - branchA.predictedDurationSec;
  const stabilityDelta = branchB.temperatureStabilityScore - branchA.temperatureStabilityScore;
  const divergencePoint = Math.min(branchA.forkStepIndex, branchB.forkStepIndex);

  let verdict = '';
  if (scoreDelta > 8) {
    verdict = `🏆 La branche [${branchB.title}] surpasse significativement [${branchA.title}] (+${scoreDelta} pts d'évaluation).`;
  } else if (scoreDelta < -8) {
    verdict = `⚠️ La branche [${branchB.title}] présente une dégradation de performance par rapport à [${branchA.title}] (${scoreDelta} pts).`;
  } else {
    verdict = `⚖️ Performance comparable entre les deux branches (|Δ| ≤ 8 pts), avec un compromis temps/précision différent.`;
  }

  const keyInsights: string[] = [];
  if (durationDeltaSec < -15) {
    keyInsights.push(`⚡ Gain de temps majeur : l'agent a complété la tâche avec ${Math.abs(durationDeltaSec)}s d'avance.`);
  } else if (durationDeltaSec > 15) {
    keyInsights.push(`⏳ Cadence plus mesurée : l'agent a pris ${durationDeltaSec}s supplémentaires pour sécuriser l'opération.`);
  }

  if (stabilityDelta > 15) {
    keyInsights.push(`🌡️ Maîtrise thermique nettement supérieure (+${stabilityDelta}% de régularité sans surchauffe).`);
  } else if (stabilityDelta < -15) {
    keyInsights.push(`🔥 Risque d'emballement thermique accru (${stabilityDelta}% de stabilité).`);
  }

  keyInsights.push(`🎯 Point de divergence sémantique au pas #${divergencePoint}.`);

  return {
    branchA,
    branchB,
    scoreDelta,
    durationDeltaSec,
    stabilityDelta,
    divergencePointStep: divergencePoint,
    verdict,
    keyInsights
  };
}

/**
 * Calcule l'indice de stabilité thermique (0 à 100%) d'une série de traces.
 */
function calculateTemperatureStability(traces: CognitiveTraceStep[]): number {
  if (traces.length === 0) return 100;
  const temps = traces.map(t => t.temperature);
  const overHeatedCount = temps.filter(t => t > 185).length;
  if (overHeatedCount >= 3) return 40;
  if (overHeatedCount >= 1) return 65;
  return 95;
}

/**
 * Exporte un ensemble de branches contrefactuelles au format JSONL standardisé
 * pour entraîner des modèles d'alignement ou des Decision Transformers (Offline RL).
 */
export function exportMultiverseDatasetToJSONL(branches: CounterfactualBranch[]): string {
  const records = branches.map(b => ({
    branch_id: b.id,
    parent_id: b.parentBranchId,
    fork_step: b.forkStepIndex,
    author_type: b.authorType,
    bot_persona: b.botPersona || 'human',
    outcome_score: b.outcomeScore,
    temperature_stability: b.temperatureStabilityScore,
    duration_sec: b.predictedDurationSec,
    traces_count: b.traces.length,
    mdp_sequence: b.traces.map(t => ({
      step: t.stepIndex,
      action: t.actionType,
      target: t.targetEntityId,
      temp: t.temperature,
      heat: t.heatLevel,
      latency_ms: t.latencyMs,
      warning: Boolean(t.warningTriggered)
    }))
  }));

  return records.map(r => JSON.stringify(r)).join('\n');
}
