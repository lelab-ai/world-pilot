// src/engine/slices/agentEcosystemSlice.ts
// 4-Agent Closed Ecosystem (Human, Playtester, Guarantor, Twin) & Cognitive Telemetry

import type { StateCreator } from 'zustand';
import type { StoreState, AgentEcosystemSlice } from './types';
import type { WorldPatch } from '../../core/types';
import { runSyntheticPlaytest, PlaytesterPersona, FrictionContext } from '../syntheticPlaytester';
import { certifyWorldInvariants } from '../deterministicGuarantor';
import {
  createInitialShadowGraph,
  recordUnanticipatedInteraction,
  promoteInteractionToPatch,
  GestureType
} from '../../research/inverseIntentEngine';
import { evaluateSemanticBlastRadius } from '../../research/semanticBlastRadius';
import { compilePedagogicalSimulation } from '../../research/pedagogicalCompiler';
import { behavioralRecorder } from '../../research/behavioralTensorRecorder';
import { metaController } from '../../research/metaController';
import { createInitialCognitiveReport, recordCognitiveTraceStep, CognitivePersonaType } from '../cognitiveTraceRecorder';
import { simulateAgentCohort } from '../cohortSimulator';
import {
  createRootBranch,
  forkCounterfactualBranch,
  generateAIBotRollout,
  compareBranches,
  SimulationSnapshot
} from '../counterfactualEngine';
import {
  createAnomalyInstance,
  calculateCognitiveLoadIndex,
  AnomalyType
} from '../anomalyEngine';
import {
  createInitialCoWorkerState,
  createInitialTeamingMetrics,
  delegateTaskToCoWorker,
  recordHumanOverride,
  CoWorkerPersonaId,
  CoWorkerTaskType
} from '../coWorkerAgent';
import { generateLeRobotDataset, triggerLeRobotDatasetDownload } from '../embodiedDataExporter';
import { generateCognitiveCertificate } from '../skillCertification';
import { synthesizeCognitiveClone, runCloneRollout, compareCloneWithHuman } from '../cognitiveCloneEngine';
import { createInitialSpatialAttentionState, recordGazeFixation } from '../spatialAttentionTelemetry';
import {
  AgentObservation,
  AgentDecisionArbitration,
  loadAgentCognitiveLedger,
  saveAgentCognitiveLedger,
  autoArbitrateObservation,
  computeLedgerSummary
} from '../agentCognitiveLedger';
import { playAudioFx } from '../evaluator';
import { speakAgentDialogue } from '../agentDialogues';

export const createAgentEcosystemSlice: StateCreator<StoreState, [], [], AgentEcosystemSlice> = (set, get) => ({
  // Synthetic AI Playtester & Deterministic Guarantor (4-Agent Ecosystem)
  showSyntheticPlaytesterModal: false,
  setShowSyntheticPlaytesterModal: (show: boolean) => set({ showSyntheticPlaytesterModal: show }),
  openSyntheticPlaytesterModal: () => {
    const result = get().runPlaytest(get().activePlaytesterPersona || 'speedrunner');
    set({
      showSyntheticPlaytesterModal: true,
      playtesterResult: result,
      isPlaytesterVisualizerActive: true
    });
    get().unlockAchievement('synthetic_playtester_deployed');
  },
  closeSyntheticPlaytesterModal: () => set({ showSyntheticPlaytesterModal: false }),
  playtesterResult: null,
  activePlaytesterPersona: 'speedrunner',
  setActivePlaytesterPersona: (persona: PlaytesterPersona) => {
    set({ activePlaytesterPersona: persona });
    get().runPlaytest(persona);
  },
  isPlaytesterVisualizerActive: false,
  togglePlaytesterVisualizer: () => set(s => ({ isPlaytesterVisualizerActive: !s.isPlaytesterVisualizerActive })),
  lastGuarantorAudit: null,
  certifyCurrentWorld: (proposedPatch?: WorldPatch) => {
    const audit = certifyWorldInvariants(get().world, proposedPatch);
    set({ lastGuarantorAudit: audit });
    return audit;
  },
  runPlaytest: (persona?: PlaytesterPersona) => {
    const activePersona = persona || get().activePlaytesterPersona || 'speedrunner';
    const frictionContext: FrictionContext | undefined = activePersona === 'human_cloned'
      ? {
          lastFailedEntityId: get().userFrictionState?.lastFailedEntityId,
          lastFailedEntityName: get().userFrictionState?.lastFailedEntityName,
          consecutiveFrictionCount: get().userFrictionState?.consecutiveFrictionCount || 0,
          lastAttemptedAction: get().userFrictionState?.lastAttemptedAction || 'drag',
          observations: get().shadowGraph?.observations || []
        }
      : undefined;

    const result = runSyntheticPlaytest(get().world, activePersona, frictionContext);
    const audit = certifyWorldInvariants(get().world, result.minimalPatch);

    set({
      playtesterResult: result,
      activePlaytesterPersona: activePersona,
      lastGuarantorAudit: audit
    });
    return result;
  },
  runHumanClonedPlaytest: () => {
    return get().runPlaytest('human_cloned');
  },
  applyMinimalPatchAndRetest: () => {
    const currentResult = get().playtesterResult;
    if (!currentResult || !currentResult.minimalPatch) {
      return { success: false, message: 'Aucun patch minimal disponible à appliquer.' };
    }

    // Validation formelle par l'Agent Garant Déterministe
    const audit = certifyWorldInvariants(get().world, currentResult.minimalPatch);
    if (audit.sbrEvaluated && !audit.isRegressionFree) {
      return {
        success: false,
        message: `Patch rejeté par le Garant Déterministe : ${audit.violations.join(', ')}`
      };
    }

    get().applyPatch(
      currentResult.minimalPatch,
      currentResult.patchDescription || 'Application du Minimal Patch Auto-Repair Playtester',
      { intent: 'playtester_minimal_repair' }
    );

    if (get().userFrictionState?.lastFailedEntityId) {
      set(s => ({
        userFrictionState: {
          ...s.userFrictionState,
          consecutiveFrictionCount: 0,
          lastFailedEntityId: null,
          lastFailedEntityName: null,
          lastAttemptedAction: undefined
        }
      }));
    }

    const newResult = get().runPlaytest(currentResult.persona);
    newResult.patchApplied = true;
    set({ playtesterResult: newResult });
    playAudioFx('sparkle');
    set(s => ({
      warnings: [
        ...s.warnings,
        `✨ Le patch a passé les contrôles WorldPilot exécutés et a été appliqué. Nouvelle estimation de parcours : ${newResult.verificationStatus === 'unverifiable' ? 'non vérifiable' : `${newResult.completionRate}%`}.`
      ]
    }));
    get().unlockAchievement('minimal_patch_repaired');
    return {
      success: true,
      message: `Patch appliqué. Complétion : ${newResult.completionRate}%.`
    };
  },

  // Human Agent Friction Telemetry
  userFrictionState: {
    consecutiveFrictionCount: 0,
    lastFailedEntityId: null,
    lastFailedEntityName: null,
    recentInteractions: [],
    lastHesitationAlertTime: 0,
  },

  recordUserActionAttempt: (params: {
    sourceId: string;
    targetId?: string | null;
    actionType: 'click' | 'drag' | 'drop';
    wasProductive?: boolean;
    context?: string;
  }) => {
    const { sourceId, targetId, actionType, wasProductive } = params;
    const now = Date.now();
    const currentState = get();
    const recent = currentState.userFrictionState?.recentInteractions || [];
    const filteredRecent = recent.filter(i => (now - i.timestamp) <= 15000);
    const newEntry = {
      timestamp: now,
      entityId: sourceId,
      type: actionType,
      wasProductive: !!wasProductive,
    };
    filteredRecent.push(newEntry);

    const repeatedUnproductiveCount = filteredRecent.filter(
      i => i.entityId === sourceId && !i.wasProductive
    ).length;

    let consecutiveFriction = currentState.userFrictionState?.consecutiveFrictionCount || 0;
    if (!wasProductive) {
      consecutiveFriction += 1;
    } else {
      consecutiveFriction = 0;
    }

    const entity = currentState.world.ir.entities[sourceId];
    const entityName = entity?.name || sourceId;

    if (!wasProductive && sourceId !== 'empty_space' && entity) {
      const gesture: GestureType = actionType === 'drop' ? 'DROP' : 'STRIKE';
      currentState.recordUnanticipatedUserGesture(sourceId, targetId || sourceId, gesture, {
        spatialDistance: 0.15,
        approachVelocity: 0.25,
        gazeDwellMs: 350,
      });
    }

    if (!wasProductive && repeatedUnproductiveCount >= 2) {
      currentState.observeMetaInteraction({
        type: 'HESITATION_DETECTED',
        data: {
          value: repeatedUnproductiveCount,
          context: `Tentatives répétées sur ${entityName}`,
          wasProductive: false,
          repetitionCount: repeatedUnproductiveCount,
        },
      });

      const lastAlert = currentState.userFrictionState?.lastHesitationAlertTime || 0;
      if (repeatedUnproductiveCount >= 3 && (now - lastAlert) > 8000) {
        const isGamePiece = entityName.toLowerCase().includes('pierre') || 
                            entityName.toLowerCase().includes('pion') || 
                            entity?.visuals?.assetId?.includes('pierre');
        const tipMsg = isGamePiece
          ? `💡 Conseil de Victoria : Cliquez et maintenez la pierre pour la faire glisser vers le Goban.`
          : `💡 Conseil de Victoria : Cliquez et glissez "${entityName}" pour le déplacer dans l'espace.`;

        playAudioFx('chime');
        currentState.addLiveCausalEvent?.({
          type: 'victoria',
          icon: '👩‍🚀',
          message: tipMsg.replace('💡 Conseil de Victoria : ', ''),
          badge: 'Assistance Victoria',
          productive: false
        });
        set(s => ({
          warnings: [...s.warnings, tipMsg],
        }));
      }
    }

    set({
      userFrictionState: {
        consecutiveFrictionCount: consecutiveFriction,
        lastFailedEntityId: !wasProductive ? sourceId : null,
        lastFailedEntityName: !wasProductive ? entityName : null,
        lastAttemptedAction: !wasProductive ? actionType : undefined,
        recentInteractions: filteredRecent,
        lastHesitationAlertTime: (repeatedUnproductiveCount >= 3) ? now : (currentState.userFrictionState?.lastHesitationAlertTime || 0),
      },
    });
  },

  // Cognitive Twin (Jumeau Numérique) & Inverse RL
  cognitiveClone: null,
  cloneRolloutResult: null,
  cloneComparison: null,
  synthesizeClone: (operatorName?: string) => {
    const s = get();
    const clone = synthesizeCognitiveClone(s.cognitiveReport, s.teamingMetrics, operatorName || 'Opérateur WorldPilot');
    set({ cognitiveClone: clone });
    get().unlockAchievement('cognitive_clone_created');
    playAudioFx('fanfare');
    speakAgentDialogue(`Votre Jumeau Numérique ${clone.dominantArchetype} a été distillé avec un score de fidélité de ${clone.fidelityScore}%.`);
    set(state => ({
      warnings: [...state.warnings, `🧬 Jumeau Numérique distillé (${clone.dominantArchetype}, fidélité ${clone.fidelityScore}%) !`]
    }));
    return clone;
  },
  simulateCloneRollout: (stepsCount = 6) => {
    const s = get();
    let clone = s.cognitiveClone;
    if (!clone) {
      clone = get().synthesizeClone();
    }
    const rollout = runCloneRollout(clone, 'Master Gastronomic Simulation', stepsCount);
    const comparison = compareCloneWithHuman(s.cognitiveReport, rollout, clone);
    set({
      cloneRolloutResult: rollout,
      cloneComparison: comparison,
      warnings: [...s.warnings, `🚀 Rollout Jumeau exécuté (Alignement: ${rollout.alignmentScore}%, KL: ${rollout.klDivergence}).`]
    });
    playAudioFx('chime');
    return rollout;
  },

  // Cognitive Ledger & Decision Memory
  agentObservations: loadAgentCognitiveLedger(),
  agentLedgerSummary: computeLedgerSummary(loadAgentCognitiveLedger()),
  showAgentLedgerModal: false,
  setShowAgentLedgerModal: (show: boolean) => set({ showAgentLedgerModal: show }),
  openAgentLedgerModal: () => set({ showAgentLedgerModal: true }),
  closeAgentLedgerModal: () => set({ showAgentLedgerModal: false }),
  recordAgentObservation: (obsData) => {
    const s = get();
    const id = (obsData as any).id || `obs-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const fullObs: AgentObservation = {
      ...obsData,
      id,
      timestamp: (obsData as any).timestamp || Date.now()
    };
    if (!fullObs.arbitration) {
      fullObs.arbitration = autoArbitrateObservation(fullObs);
    }
    const updated = [fullObs, ...s.agentObservations];
    saveAgentCognitiveLedger(updated);
    set({
      agentObservations: updated,
      agentLedgerSummary: computeLedgerSummary(updated)
    });
    return fullObs;
  },
  arbitrateAgentObservation: (obsId, override) => {
    const s = get();
    const updated = s.agentObservations.map(obs => {
      if (obs.id !== obsId) return obs;
      const baseArbitration = obs.arbitration || autoArbitrateObservation(obs);
      const newArbitration: AgentDecisionArbitration = {
        ...baseArbitration,
        ...override,
        evaluatedAt: Date.now(),
        evaluatedBy: override?.evaluatedBy || 'Superviseur Décisionnel Humain & IA'
      };
      return {
        ...obs,
        arbitration: newArbitration
      };
    });
    saveAgentCognitiveLedger(updated);
    set({
      agentObservations: updated,
      agentLedgerSummary: computeLedgerSummary(updated),
      warnings: [...s.warnings, `⚖️ Arbitrage mis à jour pour l'observation #${obsId.slice(0, 10)}.`]
    });
  },
  applyAgentHotPatch: (obsId) => {
    const s = get();
    const obs = s.agentObservations.find(o => o.id === obsId);
    if (!obs || !obs.suggestedImprovement) return false;

    const payload = obs.suggestedImprovement.patchPayload;
    if (payload && typeof payload === 'object' && (
      payload.entitiesCreated ||
      payload.entitiesChanged ||
      payload.entitiesRemoved ||
      payload.rulesChanged ||
      payload.invariantsAdded ||
      payload.questsAdded ||
      payload.questUpdated
    )) {
      get().applyPatch(
        payload,
        `Hot-Patch Agent : ${obs.suggestedImprovement.title}`,
        { intent: 'agent_hot_patch' }
      );
    }

    get().arbitrateAgentObservation(obsId, {
      decision: 'integrated',
      timing: 'immediate',
      appliedAt: Date.now()
    });

    playAudioFx('fanfare');
    set(state => ({
      warnings: [
        ...state.warnings,
        `⚡ Hot-Patch appliqué en direct : "${obs.suggestedImprovement!.title}" !`
      ]
    }));
    return true;
  },
  exportAgentLedgerJson: () => {
    const state = get();
    const payload = {
      exportedAt: new Date().toISOString(),
      summary: state.agentLedgerSummary,
      observations: state.agentObservations
    };
    const jsonStr = JSON.stringify(payload, null, 2);
    try {
      if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `WorldPilot-Agent-Ledger-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (_) {}
    return jsonStr;
  },

  // Closed Adaptive Loop
  metaHypotheses: metaController.getHypotheses(),
  metaStrategy: metaController.getActiveStrategy(),
  metaHistory: metaController.getHistory(),
  metaKnowledge: metaController.getAccumulatedKnowledge(),
  lastInteractionTime: 0,

  observeMetaInteraction: (event) => {
    const updatedHyp = metaController.observeInteraction(event);
    set({
      metaHypotheses: updatedHyp,
      metaStrategy: metaController.getActiveStrategy(),
      metaHistory: metaController.getHistory(),
      metaKnowledge: metaController.getAccumulatedKnowledge(),
    });
  },

  triggerAdaptiveCycle: () => {
    const { worldPatch, record } = metaController.generateNextAdaptiveExperience(
      get().world.ir.entities
    );
    get().applyPatch(
      worldPatch,
      `Boucle Adaptative Fermée : ${record.generatedVariantTitle}`,
      { intent: 'adaptive_cycle', actions: [{ action: 'generate_variant_e2', objective: record.objective }] }
    );
    set({
      metaHypotheses: metaController.getHypotheses(),
      metaStrategy: metaController.getActiveStrategy(),
      metaHistory: metaController.getHistory(),
      metaKnowledge: metaController.getAccumulatedKnowledge(),
    });
    playAudioFx('quantum_ping');
    get().unlockAchievement('emergent_affordance_synthesized');
    set(s => ({
      warnings: [
        ...s.warnings,
        `⚡ ${record.generatedVariantTitle} générée ! Rationale : ${record.rationale}`
      ]
    }));
    return { variantTitle: record.generatedVariantTitle, rationale: record.rationale };
  },

  resetMetaLoop: () => {
    metaController.resetLoop();
    set({
      metaHypotheses: metaController.getHypotheses(),
      metaStrategy: metaController.getActiveStrategy(),
      metaHistory: metaController.getHistory(),
      metaKnowledge: metaController.getAccumulatedKnowledge(),
    });
  },

  runPersonaBenchmark: (personaId: any) => {
    const result = metaController.runPersonaBenchmark(personaId);
    set({
      metaHypotheses: metaController.getHypotheses(),
      metaStrategy: metaController.getActiveStrategy(),
      metaHistory: metaController.getHistory(),
      metaKnowledge: metaController.getAccumulatedKnowledge(),
    });
    playAudioFx('chime');
    set(s => ({
      warnings: [
        ...s.warnings,
        `🎭 Benchmark ${result.persona.name} complété ! P(H2)=${(result.posterior.h2.probability * 100).toFixed(0)}%, Stratégie : ${result.selectedStrategy.strategy}`
      ]
    }));
    return result;
  },

  // Research Core Implementation
  showResearchDashboardModal: false,
  setShowResearchDashboardModal: (show: boolean) => set({ showResearchDashboardModal: show }),
  openResearchDashboard: () => {
    get().evaluateCurrentWorldBlastRadius();
    set({
      showResearchDashboardModal: true,
      behavioralMetrics: behavioralRecorder.getLiveMetrics(),
    });
  },
  closeResearchDashboard: () => set({ showResearchDashboardModal: false }),
  shadowGraph: createInitialShadowGraph(),
  blastRadiusReport: null,
  behavioralMetrics: behavioralRecorder.getLiveMetrics(),

  recordUnanticipatedUserGesture: (
    sourceId: string,
    targetId: string,
    gesture: GestureType,
    metrics: { spatialDistance: number; approachVelocity: number; gazeDwellMs: number }
  ) => {
    const { updatedGraph, candidateInteraction } = recordUnanticipatedInteraction(
      get().shadowGraph,
      get().world,
      sourceId,
      targetId,
      gesture,
      metrics
    );
    set({ shadowGraph: updatedGraph });
    behavioralRecorder.recordStep([metrics.spatialDistance, 0.8, 0], [0, 0, 0], [0, 0, -1], sourceId, 'USE', 0.2);
    if (candidateInteraction && candidateInteraction.status === 'speculative') {
      playAudioFx('chime');
      set(s => ({
        warnings: [
          ...s.warnings,
          `💡 Intention émergente détectée (${sourceId} ➔ ${targetId}) ! Confiance : ${(candidateInteraction.intentConfidence * 100).toFixed(0)}%. Prête pour promotion dans le Graphe Fantôme.`
        ]
      }));
    }
  },

  promoteEmergentAffordance: (interactionId: string) => {
    const currentGraph = get().shadowGraph;
    const targetObs = currentGraph.observations.find(o => o.id === interactionId);
    if (!targetObs) return;

    const patch = promoteInteractionToPatch(targetObs);
    if (!patch) return;

    const sbr = evaluateSemanticBlastRadius(get().world, patch);
    if (!sbr.isRegressionFree) {
      playAudioFx('switch_click');
      set(s => ({
        warnings: [
          ...s.warnings,
          `⚠️ Promotion bloquée par le Semantic Blast Radius : la règle briserait un invariant formel ou une quête active !`
        ]
      }));
      return;
    }

    get().applyPatch(
      patch,
      `Promotion d'affordance émergente : ${targetObs.sourceEntityId} ➔ ${targetObs.targetEntityId}`,
      { intent: 'promote_emergent_affordance' }
    );

    const updatedObs = currentGraph.observations.map(o =>
      o.id === interactionId ? { ...o, status: 'promoted' as const } : o
    );

    set({
      shadowGraph: {
        ...currentGraph,
        observations: updatedObs,
        promotedRulesCount: currentGraph.promotedRulesCount + 1,
      },
    });

    playAudioFx('sparkle');
    get().unlockAchievement('emergent_affordance_synthesized');
  },

  dismissEmergentAffordance: (interactionId: string) => {
    const currentGraph = get().shadowGraph;
    const updatedObs = currentGraph.observations.filter(o => o.id !== interactionId);
    set({
      shadowGraph: {
        ...currentGraph,
        observations: updatedObs,
      },
    });
  },

  clearEmergentAffordances: () => {
    const currentGraph = get().shadowGraph;
    set({
      shadowGraph: {
        ...currentGraph,
        observations: [],
      },
    });
  },

  evaluateCurrentWorldBlastRadius: () => {
    const world = get().world;
    const entitiesList = Object.values(world.ir?.entities || (world as any).entities || {});
    const report = evaluateSemanticBlastRadius(world, {
      entitiesChanged: entitiesList.slice(0, 2),
    });
    set({ blastRadiusReport: report });
    if (report.isRegressionFree) {
      get().unlockAchievement('semantic_blast_radius_proved');
    }
    return report;
  },

  applyParetoRepairPatch: () => {
    const report = get().blastRadiusReport;
    if (!report || !report.paretoRepairPatch) return;

    get().applyPatch(
      report.paretoRepairPatch,
      'Application de la Réparation Minimale de Pareto (Blast Radius Guard)',
      { intent: 'pareto_minimal_repair' }
    );
    const newReport = evaluateSemanticBlastRadius(get().world, {});
    set({ blastRadiusReport: newReport });
    playAudioFx('sparkle');
    set(s => ({
      warnings: [
        ...s.warnings,
        '✨ Réparation Minimale de Pareto appliquée ! Accessibilité et invariants restaurés.'
      ]
    }));
  },

  compileAndLoadPedagogicalSimulation: (presetKey: string) => {
    const sim = compilePedagogicalSimulation(presetKey);
    get().applyPatch(
      sim.worldPatch,
      `Compilation de simulation pédagogique active : ${sim.preset.title}`,
      { intent: 'compile_pedagogical_simulation' }
    );
    get().setCameraPreset('table');
    playAudioFx('fanfare');
    get().unlockAchievement('pedagogical_lab_compiled');
    set(s => ({
      warnings: [
        ...s.warnings,
        `🎓 ${sim.preset.title} compilé avec succès ! ${sim.diagnosticFeedback.scaffoldingGuidance}`
      ]
    }));
  },

  recordSampleBehavioralEpisode: () => {
    behavioralRecorder.startNewEpisode('victoria_vr_estate_40m', 'quest_pedagogical_demo');
    behavioralRecorder.recordStep([0.2, 0.85, -0.2], [0.01, 0, 0], [0, 0, -1], 'apparatus_power_supply', 'USE', 0.25);
    behavioralRecorder.recordStep([0.0, 1.1, 0.1], [-0.02, 0.1, 0], [0, 0, -1], 'apparatus_rheostat', 'GRAB', 0.5);
    behavioralRecorder.recordStep([0.3, 0.9, 0.0], [0.0, 0.0, 0], [0, 0, -1], 'apparatus_multimeter', 'USE', 0.8);
    behavioralRecorder.finishCurrentEpisode();
    set({ behavioralMetrics: behavioralRecorder.getLiveMetrics() });
    playAudioFx('quantum_ping');
    get().unlockAchievement('mdp_dataset_exported');
  },

  exportMDPDataset: () => {
    get().unlockAchievement('mdp_dataset_exported');
    return behavioralRecorder.exportDatasetJSON();
  },

  // Embodied Co-Worker Agent & Human-AI Teaming
  isCoWorkerActive: false,
  coWorker: createInitialCoWorkerState('sous-chef-camille'),
  teamingMetrics: createInitialTeamingMetrics(),
  toggleCoWorker: () => {
    const next = !get().isCoWorkerActive;
    set({ isCoWorkerActive: next });
    if (next) {
      playAudioFx('chime');
      speakAgentDialogue(`Bonjour ! ${get().coWorker.name} est à vos côtés pour collaborer.`);
    }
  },
  setCoWorkerActive: (active: boolean) => set({ isCoWorkerActive: active }),
  switchCoWorkerPersona: (personaId: CoWorkerPersonaId) => {
    const newState = createInitialCoWorkerState(personaId);
    set({ coWorker: newState });
    speakAgentDialogue(newState.speechBubble || `Agent changé pour ${newState.name}`);
    playAudioFx('switch_click');
  },
  delegateCoWorkerTask: (task: CoWorkerTaskType) => {
    const s = get();
    const { nextState, nextMetrics, announcement } = delegateTaskToCoWorker(s.coWorker, task, s.teamingMetrics);
    set({
      coWorker: nextState,
      teamingMetrics: nextMetrics,
      warnings: [...s.warnings, `🤝 ${announcement}`]
    });
    get().logCognitiveAction('delegate_task', {
      sourceEntityName: s.coWorker.name,
      warningTriggered: task
    });
    speakAgentDialogue(announcement);
    playAudioFx('switch_click');
    get().unlockAchievement('symbiotic_duo');
  },
  recordCoWorkerOverride: (reason?: string) => {
    const s = get();
    const nextMetrics = recordHumanOverride(s.teamingMetrics, reason);
    set({
      coWorker: { ...s.coWorker, currentTask: 'idle', status: 'idle', speechBubble: "D'accord, je vous laisse la main !" },
      teamingMetrics: nextMetrics,
      warnings: [...s.warnings, `✋ Reprise manuelle par l'opérateur.`]
    });
    playAudioFx('bell');
  },

  // Ghost Trajectory & Counterfactual Multiverse
  isGhostAgentActive: false,
  toggleGhostAgent: () => {
    const next = !get().isGhostAgentActive;
    set({ isGhostAgentActive: next });
    if (next) {
      get().unlockAchievement('ghost_trainee');
      playAudioFx('sparkle');
    }
  },
  setGhostAgentActive: (active: boolean) => {
    set({ isGhostAgentActive: active });
    if (active) get().unlockAchievement('ghost_trainee');
  },
  counterfactualBranches: [],
  activeBranchId: 'branch-root-human',
  createCounterfactualFork: (forkStepIndex?: number, customTitle?: string) => {
    const s = get();
    const activeQuest = s.world.ir.activeQuestId ? s.world.ir.quests?.[s.world.ir.activeQuestId] : null;
    const currentSnapshot: SimulationSnapshot = {
      stepIndex: s.cognitiveReport.traces.length,
      timestamp: Date.now(),
      cookingHeatLevel: s.cookingHeatLevel,
      cookingTemperature: s.cookingTemperature,
      cookingDoneness: s.cookingDoneness,
      isDishPlated: s.isDishPlated,
      platingStyle: s.platingStyle,
      platingGarnish: s.platingGarnish,
      isDishSauced: s.isDishSauced,
      activeQuestId: s.world.ir.activeQuestId || null,
      activeQuestStepIndex: activeQuest?.currentStepIndex || 0,
      choppedIngredientsCount: Object.values(s.choppingProgress || {}).reduce((sum, n) => sum + (Number(n) || 0), 0)
    };

    const rootBranch = createRootBranch(s.cognitiveReport, currentSnapshot);

    const targetStep = forkStepIndex ?? Math.max(1, Math.floor(s.cognitiveReport.traces.length / 2));
    const newFork = forkCounterfactualBranch(rootBranch, targetStep, customTitle);
    
    const existing = s.counterfactualBranches.filter(b => b.id !== newFork.id && b.id !== 'branch-root-human');
    const updatedBranches = [rootBranch, ...existing, newFork];

    set({
      counterfactualBranches: updatedBranches,
      activeBranchId: newFork.id,
      warnings: [...s.warnings, `🔀 Nouvelle branche contrefactuelle créée à l'étape #${targetStep} !`]
    });

    get().unlockAchievement('counterfactual_pioneer');
    playAudioFx('fanfare');
    return newFork;
  },

  runAutonomousBranchRollout: (persona: CognitivePersonaType, forkStepIndex?: number) => {
    const s = get();
    const activeQuest = s.world.ir.activeQuestId ? s.world.ir.quests?.[s.world.ir.activeQuestId] : null;
    const currentSnapshot: SimulationSnapshot = {
      stepIndex: s.cognitiveReport.traces.length,
      timestamp: Date.now(),
      cookingHeatLevel: s.cookingHeatLevel,
      cookingTemperature: s.cookingTemperature,
      cookingDoneness: s.cookingDoneness,
      isDishPlated: s.isDishPlated,
      platingStyle: s.platingStyle,
      platingGarnish: s.platingGarnish,
      isDishSauced: s.isDishSauced,
      activeQuestId: s.world.ir.activeQuestId || null,
      activeQuestStepIndex: activeQuest?.currentStepIndex || 0,
      choppedIngredientsCount: Object.values(s.choppingProgress || {}).reduce((sum, n) => sum + (Number(n) || 0), 0)
    };

    const rootBranch = createRootBranch(s.cognitiveReport, currentSnapshot);
    let baseBranch = s. activeBranchId === 'branch-root-human'
      ? rootBranch
      : s.counterfactualBranches.find(b => b.id === s.activeBranchId);
    if (!baseBranch) {
      baseBranch = rootBranch;
    }

    const targetStep = forkStepIndex ?? (baseBranch.forkStepIndex > 0 ? baseBranch.forkStepIndex : Math.max(1, baseBranch.traces.length));
    const fork = forkCounterfactualBranch(baseBranch, targetStep);
    const botBranch = generateAIBotRollout(fork, persona, activeQuest?.title);

    const others = s.counterfactualBranches.filter(b => b.id !== botBranch.id && b.id !== 'branch-root-human');
    const updatedBranches = [rootBranch, ...others, botBranch];

    set({
      counterfactualBranches: updatedBranches,
      activeBranchId: botBranch.id,
      warnings: [...s.warnings, `🤖 Rollout IA ${botBranch.title} calculé avec succès (Score: ${botBranch.outcomeScore}/100) !`]
    });

    get().unlockAchievement('counterfactual_pioneer');
    playAudioFx('chime');
    return botBranch;
  },

  compareActiveBranches: (branchIdA: string, branchIdB: string) => {
    const s = get();
    const bA = s.counterfactualBranches.find(b => b.id === branchIdA);
    const bB = s.counterfactualBranches.find(b => b.id === branchIdB);
    if (!bA || !bB) return null;
    return compareBranches(bA, bB);
  },

  switchActiveBranch: (branchId: string) => {
    const s = get();
    const branch = s.counterfactualBranches.find(b => b.id === branchId);
    if (!branch) return;

    const newWorld = JSON.parse(JSON.stringify(s.world));
    if (branch.snapshot.activeQuestId !== undefined) {
      newWorld.ir.activeQuestId = branch.snapshot.activeQuestId;
      const q = branch.snapshot.activeQuestId ? newWorld.ir.quests?.[branch.snapshot.activeQuestId] : null;
      if (q && typeof branch.snapshot.activeQuestStepIndex === 'number') {
        q.currentStepIndex = branch.snapshot.activeQuestStepIndex;
        if (Array.isArray(q.steps)) {
          q.steps.forEach((st: any, idx: number) => {
            st.completed = idx < branch.snapshot.activeQuestStepIndex;
          });
          q.status = branch.snapshot.activeQuestStepIndex >= q.steps.length ? 'completed' : 'in_progress';
        }
      }
    }

    set({
      world: newWorld,
      activeBranchId: branchId,
      cookingHeatLevel: branch.snapshot.cookingHeatLevel,
      cookingTemperature: branch.snapshot.cookingTemperature,
      cookingDoneness: branch.snapshot.cookingDoneness,
      isDishPlated: branch.snapshot.isDishPlated,
      platingStyle: (branch.snapshot.platingStyle as any) || 'classic-dome',
      platingGarnish: (branch.snapshot.platingGarnish as any) || 'tuile-dentelle',
      isDishSauced: branch.snapshot.isDishSauced,
      warnings: [...s.warnings, `⏳ Bascule sur la branche [${branch.title}].`]
    });
    playAudioFx('switch_click');
  },

  // Spatial Attention Telemetry
  spatialAttention: createInitialSpatialAttentionState(),
  toggleAttentionHeatmap: (force?: boolean) => {
    const s = get();
    const next = force !== undefined ? force : !s.spatialAttention.isHeatmapVisible;
    set({
      spatialAttention: { ...s.spatialAttention, isHeatmapVisible: next }
    });
    if (next) {
      get().unlockAchievement('deep_focus_master');
      playAudioFx('sparkle');
    }
  },
  recordVisualFixation: (entityId, entityName, position, dwellMs = 450, preActionMs = 250) => {
    const s = get();
    const nextAttention = recordGazeFixation(s.spatialAttention, entityId, entityName, position, dwellMs, preActionMs);
    set({ spatialAttention: nextAttention });
  },

  // Cognitive Trace & Cohort Simulation
  cognitiveReport: createInitialCognitiveReport(),
  showBehavioralAnalyticsModal: false,
  setShowBehavioralAnalyticsModal: (show: boolean) => {
    set({ showBehavioralAnalyticsModal: show });
    if (show) {
      get().unlockAchievement('cognitive_analyst');
    }
  },
  openBehavioralAnalyticsModal: () => {
    set({ showBehavioralAnalyticsModal: true });
    get().unlockAchievement('cognitive_analyst');
  },
  closeBehavioralAnalyticsModal: () => set({ showBehavioralAnalyticsModal: false }),
  logCognitiveAction: (actionType: string, meta?: {
    sourceEntityId?: string;
    sourceEntityName?: string;
    targetEntityId?: string;
    warningTriggered?: string;
    isErrorRecovery?: boolean;
  }) => {
    const s = get();
    const activeQuest = s.world.ir.activeQuestId ? s.world.ir.quests?.[s.world.ir.activeQuestId] : null;
    const { updatedReport, shouldOfferScaffolding } = recordCognitiveTraceStep(s.cognitiveReport, {
      actionType,
      sourceEntityId: meta?.sourceEntityId,
      sourceEntityName: meta?.sourceEntityName,
      targetEntityId: meta?.targetEntityId,
      heatLevel: s.cookingHeatLevel,
      temperature: s.cookingTemperature,
      doneness: s.cookingDoneness,
      activeQuestId: s.world.ir.activeQuestId || null,
      activeQuestStepIndex: activeQuest?.currentStepIndex || 0,
      warningTriggered: meta?.warningTriggered,
      isErrorRecovery: meta?.isErrorRecovery
    });
    set({ cognitiveReport: updatedReport });

    if (shouldOfferScaffolding && (activeQuest?.category === 'cuisine' || s.world.ir.activeQuestId?.includes('cuisine') || s.world.ir.activeQuestId?.includes('recipe'))) {
      speakAgentDialogue("Besoin d'un coup de main ? N'hésitez pas à consulter le conseil du chef pour la prochaine étape.");
    }
  },
  resetCognitiveSession: () => set({
    cognitiveReport: createInitialCognitiveReport(),
    cohortSimulationSummary: null
  }),
  cohortSimulationSummary: null,
  runCohortSimulation: (cohortSize = 100) => {
    const s = get();
    const quest = s.world.ir.activeQuestId ? s.world.ir.quests?.[s.world.ir.activeQuestId] : null;
    const taskSteps = quest?.steps.map(st => ({ title: st.title, hint: st.hint }));
    const summary = simulateAgentCohort({
      cohortSize,
      scenarioTitle: quest?.title || 'Simulation Culinaire & Comportementale WorldPilot',
      taskSteps
    });
    set({ cohortSimulationSummary: summary });
    get().unlockAchievement('cohort_commander');
    return summary;
  },

  // VLA & Dataset Export
  exportVLAEmbodiedDataset: () => {
    const s = get();
    const dataset = generateLeRobotDataset(s.cognitiveReport, s.world, s.counterfactualBranches);
    triggerLeRobotDatasetDownload(dataset);
    get().unlockAchievement('vla_dataset_curator');
    playAudioFx('fanfare');
    set(state => ({
      warnings: [...state.warnings, `🤖 Dataset LeRobot généré avec succès (${dataset.total_frames} trames VLA) !`]
    }));
    return dataset;
  },

  getCognitiveCertificate: () => {
    const s = get();
    const resolvedAnomalies = s.activeAnomalies.filter(a => a.status === 'resolved').length;
    return generateCognitiveCertificate(s.cognitiveReport, s.teamingMetrics, resolvedAnomalies);
  },

  // Anomaly Engine & Stress Testing
  activeAnomalies: [],
  injectAnomaly: (type: AnomalyType) => {
    const anomaly = createAnomalyInstance(type);
    const s = get();

    if (type === 'thermal_flare') {
      set({ cookingHeatLevel: 3, cookingTemperature: 210 });
      playAudioFx('sizzle_cook');
    } else if (type === 'seasoning_imbalance') {
      set({ seasoningProfile: { ...s.seasoningProfile, salt: 95 } });
      playAudioFx('tink');
    }

    set(state => ({
      activeAnomalies: [anomaly, ...state.activeAnomalies],
      warnings: [...state.warnings, `🚨 ANOMALIE INJECTÉE : ${anomaly.title} !`]
    }));

    get().logCognitiveAction('anomaly_injected', {
      sourceEntityName: type,
      warningTriggered: anomaly.title
    });

    speakAgentDialogue(`Alerte imprévue ! ${anomaly.title}. ${anomaly.suggestedAction}`);
    playAudioFx('target_hit');
    return anomaly;
  },

  resolveAnomaly: (anomalyId: string) => {
    const targetAnom = get().activeAnomalies.find(a => a.id === anomalyId);
    set(state => {
      const updated = state.activeAnomalies.map(a => 
        a.id === anomalyId ? { ...a, status: 'resolved' as const } : a
      );
      const patch: Partial<StoreState> = {
        activeAnomalies: updated,
        warnings: [...state.warnings, '🛡️ Anomalie résolue avec succès ! Sang-froid exemplaire.']
      };
      if (targetAnom?.type === 'thermal_flare') {
        patch.cookingHeatLevel = Math.min(1, state.cookingHeatLevel);
        patch.cookingTemperature = Math.min(110, state.cookingTemperature);
      } else if (targetAnom?.type === 'seasoning_imbalance') {
        patch.seasoningProfile = {
          ...state.seasoningProfile,
          salt: Math.min(50, state.seasoningProfile.salt),
          oil: Math.max(25, state.seasoningProfile.oil)
        };
      }
      return patch;
    });
    get().unlockAchievement('crisis_manager');
    if (targetAnom?.type === 'thermal_flare') {
      get().unlockAchievement('zen_operator');
    }
    get().logCognitiveAction('anomaly_resolved', { sourceEntityId: anomalyId, isErrorRecovery: true });
    playAudioFx('fanfare');
  },

  clearAnomalies: () => set({ activeAnomalies: [] }),

  getCognitiveLoad: () => {
    const s = get();
    const activeCount = s.activeAnomalies.filter(a => a.status === 'pending').length;
    return calculateCognitiveLoadIndex({
      hesitationRate: s.cognitiveReport.hesitationRate,
      averageLatencyMs: s.cognitiveReport.averageLatencyMs,
      activeAnomaliesCount: activeCount,
      cookingTemperature: s.cookingTemperature,
      resilienceScore: s.cognitiveReport.resilienceScore
    });
  }
});
