// src/engine/cognitiveTraceRecorder.ts
// Module d'observabilité causale & capture de trajectoires cognitives humaines pour WorldPilot.
// Transforme les interactions spatiales 3D en séquences d'apprentissage formelles exploitables par l'IA.

export type CognitivePersonaType = 
  | 'methodical-analyst' // Démarche posée, rigoureuse, temps de réflexion maîtrisé, zéro warning thermique
  | 'intuitive-explorer' // Dynamique, teste différentes affordances et assaisonnements, récupération agile
  | 'hesitant-learner'   // Latences plus longues (>3.5s), recours fréquent aux conseils du Chef Auguste, allures douces
  | 'impulsive-rushed';  // Actions très rapides, emballement thermique (feu vif répété), alertes récurrentes

export interface CognitiveTraceStep {
  stepIndex: number;
  timestamp: number; // Date.now()
  relativeTimeSec: number; // Secondes écoulées depuis le début de la session
  actionType: string; // 'select', 'interact', 'chop', 'heat_change', 'season', 'sauce', 'taste', 'plate', 'ask_advice', 'drop', 'quiz_answer', 'note_create', 'note_vote'
  sourceEntityId?: string;
  sourceEntityName?: string;
  targetEntityId?: string;
  latencyMs: number; // Temps de latence cognitive écoulé depuis l'action précédente
  isHesitation: boolean; // Latence cognitive > 3200ms
  heatLevel: number;
  temperature: number;
  doneness: number;
  activeQuestId: string | null;
  activeQuestStepIndex: number;
  warningTriggered?: string;
  isErrorRecovery: boolean; // Action menée immédiatement après un avertissement ou une anomalie
  systemScaffoldOffered?: boolean; // Le système a proposé une aide juste-à-temps
}

export interface CognitiveSessionReport {
  sessionId: string;
  startTime: number;
  endTime: number;
  durationSec: number;
  totalDecisions: number;
  averageLatencyMs: number;
  hesitationCount: number;
  hesitationRate: number; // Pourcentage de pas d'hésitation (0 - 100)
  errorWarningsCount: number;
  recoveryCount: number;
  adviceSoughtCount: number;
  proceduralEfficiency: number; // Score d'efficacité procédurale 0 - 100%
  resilienceScore: number; // Capacité de rebond après alerte 0 - 100%
  persona: CognitivePersonaType;
  personaLabel: string;
  personaDescription: string;
  traces: CognitiveTraceStep[];
}

export const PERSONA_METADATA: Record<CognitivePersonaType, { label: string; icon: string; description: string; badgeColor: string }> = {
  'methodical-analyst': {
    label: 'Analyste Méthodique',
    icon: '🧭',
    description: 'Progression linéaire et réfléchie. Faible taux d’erreur, respect strict des étapes et maîtrise thermique exemplaire.',
    badgeColor: '#10b981'
  },
  'intuitive-explorer': {
    label: 'Explorateur Intuitif',
    icon: '⚡',
    description: 'Approche empirique créative. Multiplie les essais, ajuste prestement les assaisonnements et récupère rapidement en cas d’aléa.',
    badgeColor: '#3b82f6'
  },
  'hesitant-learner': {
    label: 'Apprenant Prudent',
    icon: '🌱',
    description: 'Rythme posé avec phases d’observation prolongées. Sollicite volontiers le tuteur IA et privilégie les allures douces de cuisson.',
    badgeColor: '#f59e0b'
  },
  'impulsive-rushed': {
    label: 'Pionnier Impulsif',
    icon: '🔥',
    description: 'Exécution ultra-rapide avec prise de risque élevée. Tendance aux surchauffes thermiques ou sauts d’étapes préalables.',
    badgeColor: '#ef4444'
  }
};

/**
 * Initialise un rapport de session cognitive vierge.
 */
export function createInitialCognitiveReport(sessionId?: string): CognitiveSessionReport {
  const now = Date.now();
  const id = sessionId || `session_${Math.random().toString(36).substring(2, 9)}`;
  return {
    sessionId: id,
    startTime: now,
    endTime: now,
    durationSec: 0,
    totalDecisions: 0,
    averageLatencyMs: 0,
    hesitationCount: 0,
    hesitationRate: 0,
    errorWarningsCount: 0,
    recoveryCount: 0,
    adviceSoughtCount: 0,
    proceduralEfficiency: 100,
    resilienceScore: 100,
    persona: 'methodical-analyst',
    personaLabel: PERSONA_METADATA['methodical-analyst'].label,
    personaDescription: PERSONA_METADATA['methodical-analyst'].description,
    traces: []
  };
}

/**
 * Enregistre une étape causale dans la trajectoire de la session et met à jour les métriques cognitives.
 */
export function recordCognitiveTraceStep(
  report: CognitiveSessionReport,
  actionData: {
    actionType: string;
    sourceEntityId?: string;
    sourceEntityName?: string;
    targetEntityId?: string;
    heatLevel: number;
    temperature: number;
    doneness: number;
    activeQuestId?: string | null;
    activeQuestStepIndex: number;
    warningTriggered?: string;
    isErrorRecovery?: boolean;
    now?: number;
  }
): { updatedReport: CognitiveSessionReport; step: CognitiveTraceStep; isHesitation: boolean; shouldOfferScaffolding: boolean } {
  const now = actionData.now || Date.now();
  const lastStep = report.traces[report.traces.length - 1];
  const latencyMs = lastStep ? Math.max(50, now - lastStep.timestamp) : 800;
  const isHesitation = latencyMs >= 3200;
  const wasLastWarning = Boolean(lastStep?.warningTriggered);
  const isRecovery = actionData.isErrorRecovery ?? wasLastWarning;

  // Alerte d'aide juste-à-temps : 2 hésitations consécutives ou hésitation prolongée post-erreur
  const shouldOfferScaffolding = (isHesitation && wasLastWarning) || (isHesitation && (lastStep?.isHesitation ?? false));

  const newStep: CognitiveTraceStep = {
    stepIndex: report.traces.length + 1,
    timestamp: now,
    relativeTimeSec: Math.round(((now - report.startTime) / 1000) * 10) / 10,
    actionType: actionData.actionType,
    sourceEntityId: actionData.sourceEntityId,
    sourceEntityName: actionData.sourceEntityName,
    targetEntityId: actionData.targetEntityId,
    latencyMs,
    isHesitation,
    heatLevel: actionData.heatLevel,
    temperature: actionData.temperature,
    doneness: actionData.doneness,
    activeQuestId: actionData.activeQuestId || null,
    activeQuestStepIndex: actionData.activeQuestStepIndex,
    warningTriggered: actionData.warningTriggered,
    isErrorRecovery: isRecovery,
    systemScaffoldOffered: shouldOfferScaffolding
  };

  const updatedTraces = [...report.traces, newStep];
  const totalDecisions = updatedTraces.length;
  const durationSec = Math.max(1, Math.round((now - report.startTime) / 1000));
  const sumLatency = updatedTraces.reduce((acc, t) => acc + t.latencyMs, 0);
  const averageLatencyMs = Math.round(sumLatency / totalDecisions);
  const hesitationCount = updatedTraces.filter(t => t.isHesitation).length;
  const hesitationRate = Math.round((hesitationCount / totalDecisions) * 100);
  const errorWarningsCount = updatedTraces.filter(t => t.warningTriggered).length;
  const recoveryCount = updatedTraces.filter(t => t.isErrorRecovery).length;
  const adviceSoughtCount = updatedTraces.filter(t => t.actionType === 'ask_advice').length;

  // Calcul du score d'efficacité procédurale : pénalise les sur-erreurs et l'hésitation excessive
  const rawEfficiency = 100 - (hesitationRate * 0.45) - (errorWarningsCount * 8);
  const proceduralEfficiency = Math.max(25, Math.min(100, Math.round(rawEfficiency)));

  // Calcul du score de résilience : ratio des récupérations réussies après warning
  const resilienceScore = errorWarningsCount === 0 
    ? 100 
    : Math.min(100, Math.round((recoveryCount / errorWarningsCount) * 100));

  // Classification dynamique du persona cognitif
  let persona: CognitivePersonaType = 'methodical-analyst';
  if (errorWarningsCount >= 2 || (averageLatencyMs < 900 && errorWarningsCount > 0) || actionData.temperature > 195) {
    persona = 'impulsive-rushed';
  } else if (hesitationRate >= 35 || adviceSoughtCount >= 2 || averageLatencyMs > 3200) {
    persona = 'hesitant-learner';
  } else if (totalDecisions >= 6 && (adviceSoughtCount > 0 || updatedTraces.some(t => t.actionType === 'season' || t.actionType === 'sauce'))) {
    persona = 'intuitive-explorer';
  } else {
    persona = 'methodical-analyst';
  }

  const updatedReport: CognitiveSessionReport = {
    ...report,
    endTime: now,
    durationSec,
    totalDecisions,
    averageLatencyMs,
    hesitationCount,
    hesitationRate,
    errorWarningsCount,
    recoveryCount,
    adviceSoughtCount,
    proceduralEfficiency,
    resilienceScore,
    persona,
    personaLabel: PERSONA_METADATA[persona].label,
    personaDescription: PERSONA_METADATA[persona].description,
    traces: updatedTraces
  };

  return {
    updatedReport,
    step: newStep,
    isHesitation,
    shouldOfferScaffolding
  };
}

/**
 * Exporte les traces cognitives de la session au format standard Markov Decision Process (MDP) pour HuggingFace / OpenAI Gym.
 * Permet d'alimenter directement des modèles de décision incarnés (Decision Transformers / Embodied AI).
 */
export function exportToHuggingFaceMDP(report: CognitiveSessionReport): any[] {
  return report.traces.map((step, idx) => {
    const nextStep = report.traces[idx + 1];
    
    // Calcul de la fonction de récompense procédurale
    let reward = 1.0;
    if (step.warningTriggered) reward -= 2.5;
    if (step.isErrorRecovery) reward += 2.0;
    if (step.isHesitation) reward -= 0.5;
    if (step.actionType === 'plate' || step.actionType === 'taste') reward += 3.0;

    return {
      step: step.stepIndex,
      time_relative_sec: step.relativeTimeSec,
      latency_ms: step.latencyMs,
      state: {
        quest_id: step.activeQuestId,
        quest_step: step.activeQuestStepIndex,
        heat_level: step.heatLevel,
        temperature_c: step.temperature,
        doneness_pct: step.doneness,
        has_warning: Boolean(step.warningTriggered)
      },
      action: {
        type: step.actionType,
        source_entity: step.sourceEntityName || step.sourceEntityId || null,
        target_entity: step.targetEntityId || null
      },
      reward,
      next_state: nextStep ? {
        quest_step: nextStep.activeQuestStepIndex,
        heat_level: nextStep.heatLevel,
        temperature_c: nextStep.temperature,
        doneness_pct: nextStep.doneness,
        has_warning: Boolean(nextStep.warningTriggered)
      } : null,
      is_done: idx === report.traces.length - 1,
      metadata: {
        is_hesitation: step.isHesitation,
        is_error_recovery: step.isErrorRecovery,
        session_persona: report.persona
      }
    };
  });
}

/**
 * Génère une synthèse exécutive structurée en Markdown pour les formateurs, ergonomes ou chercheurs.
 */
export function exportToMarkdownExecutiveReport(report: CognitiveSessionReport): string {
  const pMeta = PERSONA_METADATA[report.persona];

  return `# 🧠 WorldPilot · Rapport d'Analyse Comportementale & Empreinte Cognitive

**Identifiant de Session** : \`${report.sessionId}\`  
**Date d'exécution** : ${new Date(report.startTime).toLocaleString('fr-FR')}  
**Durée de la simulation** : ${report.durationSec}s (${report.totalDecisions} décisions causales enregistrées)  

---

## 1. Profil & Archétype Cognitif
- **Archétype Détecté** : **${pMeta.icon} ${pMeta.label}** (\`${report.persona}\`)
- **Description** : ${pMeta.description}
- **Score d'Efficacité Procédurale** : **${report.proceduralEfficiency}/100**
- **Résilience Post-Alerte** : **${report.resilienceScore}/100**
- **Latence Décisionnelle Moyenne** : **${report.averageLatencyMs} ms**

## 2. Métriques de Friction & Scaffolding
- **Nombre de phases d'hésitation (>3.2s)** : ${report.hesitationCount} (${report.hesitationRate}% du temps de décision)
- **Avertissements & anomalies thermiques** : ${report.errorWarningsCount}
- **Actions de récupération réussies** : ${report.recoveryCount}
- **Conseils du tuteur IA sollicités** : ${report.adviceSoughtCount}

## 3. Déroulé Causal Sémantique (Extrait des 10 premiers pas)
| Pas | Temps | Action | Entité Cible | T°C | Latence | Friction |
| :---: | :---: | :--- | :--- | :---: | :---: | :---: |
${report.traces.slice(0, 10).map(t => 
  `| ${t.stepIndex} | ${t.relativeTimeSec}s | \`${t.actionType}\` | ${t.sourceEntityName || t.sourceEntityId || '-'} | ${Math.round(t.temperature)}°C | ${t.latencyMs}ms | ${t.warningTriggered ? '⚠️ Alerte' : t.isHesitation ? '⏳ Pause' : '✓ Fluide'} |`
).join('\n')}

---
*Généré automatiquement par le CognitiveTraceRecorder de WorldPilot · Prêt pour exportation HuggingFace / RL Gymnasium.*
`;
}
