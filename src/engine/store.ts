// src/engine/store.ts
// WorldPilot Central State Store · Neural-Symbolic Spatial Substrate (NSS)
// Composed of modular Zustand slices: WorldIR Slice, 4-Agent Ecosystem Slice, Runtime UI Slice

import { create } from 'zustand';
import type { StoreState, StickyNote, CameraPreset, CinematicPreset, PlatingStyle, PlatingGarnish, ChefEvaluation } from './slices/types';
import { createWorldSlice } from './slices/worldSlice';
import { createAgentEcosystemSlice } from './slices/agentEcosystemSlice';
import { createRuntimeUISlice, DEFAULT_COLLABORATION_NOTES, getCookingDonenessStage, evaluateDish } from './slices/runtimeUISlice';
import { exportWorldToYaml, parseWorldFromYaml, exportWorldToJson, parseWorldFromJson, validateWorldIR, downloadWorldFile } from './worldFormat';
import { compileProceduralChallenge } from './proceduralChallengeEngine';

// Re-export core types and domain helpers for full backward compatibility
export type { StoreState, StickyNote, CameraPreset, CinematicPreset, PlatingStyle, PlatingGarnish, ChefEvaluation };
export { DEFAULT_COLLABORATION_NOTES, getCookingDonenessStage, evaluateDish };
export { exportWorldToYaml, parseWorldFromYaml, exportWorldToJson, parseWorldFromJson, validateWorldIR, downloadWorldFile };

/**
 * WorldPilot Master Hook & Reactive State Store.
 * Assembles pure functional slices with zero duplication and formal invariant checking.
 */
export const useWorldStore = create<StoreState>()((set, get, api) => ({
  ...createWorldSlice(set, get, api),
  ...createAgentEcosystemSlice(set, get, api),
  ...createRuntimeUISlice(set, get, api),
}));

// Real-Time Event Dispatchers & Global Bridge Handlers
if (typeof window !== 'undefined') {
  (window as any).__WORLD_STORE__ = useWorldStore;
  window.addEventListener('worldpilot_set_atmosphere', (e: any) => {
    if (e.detail?.atmosphere) {
      useWorldStore.getState().setAtmosphere(e.detail.atmosphere);
    }
  });

  window.addEventListener('worldpilot_toggle_agent', (e: any) => {
    if (typeof e.detail?.active === 'boolean') {
      useWorldStore.setState({ isSpatialAgentActive: e.detail.active });
    }
  });

  window.addEventListener('worldpilot_shift_world', (e: any) => {
    if (e.detail?.theme) {
      useWorldStore.getState().shiftWorldTheme(e.detail.theme, e.detail.gravity);
    }
  });

  window.addEventListener('worldpilot_set_theme', (e: any) => {
    if (e.detail?.themeId) {
      useWorldStore.getState().setWorldTheme(e.detail.themeId);
    }
  });


  window.addEventListener('worldpilot_quest_completed', (e: any) => {
    const quest = e.detail?.quest;
    if (quest?.category === 'fle') {
      useWorldStore.getState().unlockAchievement('first_fle_quest');
    } else if (quest?.category === 'seminaire') {
      useWorldStore.getState().unlockAchievement('first_seminar_quest');
    }
  });

  window.addEventListener('worldpilot_sommelier_wine_selected', () => {
    useWorldStore.getState().unlockAchievement('sommelier_accord');
  });

  window.addEventListener('worldpilot_fle_quiz_correct', () => {
    useWorldStore.getState().unlockAchievement('fle_quiz_ace');
  });

  window.addEventListener('worldpilot_open_flashcard_study', (e: any) => {
    useWorldStore.getState().openFlashcardStudyModal(e.detail?.sceneId);
  });

  window.addEventListener('worldpilot_open_achievements_modal', () => {
    useWorldStore.getState().setShowAchievementsModal(true);
  });

  window.addEventListener('worldpilot_tasting_start', (e: any) => {
    if (e.detail?.fromStore) return;
    useWorldStore.getState().triggerTasting(e.detail?.utensil || 'fork');
  });

  window.addEventListener('worldpilot_dish_sauced', (e: any) => {
    if (e.detail?.fromStore) return;
    useWorldStore.getState().toggleSauceDish();
  });

  window.addEventListener('worldpilot_open_collaboration_board', () => {
    useWorldStore.getState().setShowCollaborationBoardModal(true);
  });

  window.addEventListener('worldpilot_chef_ask_advice', () => {
    useWorldStore.getState().askChefAdvice();
  });

  window.addEventListener('worldpilot_set_plating_style', (e: any) => {
    if (e.detail?.style) {
      useWorldStore.getState().setPlatingStyle(e.detail.style);
    }
  });

  window.addEventListener('worldpilot_set_plating_garnish', (e: any) => {
    if (e.detail?.garnish) {
      useWorldStore.getState().setPlatingGarnish(e.detail.garnish);
    }
  });

  window.addEventListener('worldpilot_open_behavioral_analytics', () => {
    useWorldStore.getState().openBehavioralAnalyticsModal();
  });

  window.addEventListener('worldpilot_run_cohort_simulation', (e: any) => {
    useWorldStore.getState().runCohortSimulation(e.detail?.cohortSize || 100);
    useWorldStore.getState().openBehavioralAnalyticsModal();
  });

  window.addEventListener('worldpilot_toggle_ghost_agent', () => {
    useWorldStore.getState().toggleGhostAgent();
  });

  window.addEventListener('worldpilot_create_counterfactual', (e: any) => {
    useWorldStore.getState().createCounterfactualFork(e.detail?.forkStepIndex, e.detail?.title);
  });

  window.addEventListener('worldpilot_run_ai_rollout', (e: any) => {
    useWorldStore.getState().runAutonomousBranchRollout(e.detail?.persona || 'methodical-analyst', e.detail?.forkStepIndex);
  });

  window.addEventListener('worldpilot_inject_anomaly', (e: any) => {
    useWorldStore.getState().injectAnomaly(e.detail?.type || 'thermal_flare');
  });

  window.addEventListener('worldpilot_resolve_anomaly', (e: any) => {
    if (e.detail?.id) {
      useWorldStore.getState().resolveAnomaly(e.detail.id);
    }
  });

  window.addEventListener('worldpilot_delegate_coworker_task', (e: any) => {
    if (e.detail?.task) {
      useWorldStore.getState().delegateCoWorkerTask(e.detail.task);
    }
  });

  window.addEventListener('worldpilot_toggle_coworker', () => {
    useWorldStore.getState().toggleCoWorker();
  });

  window.addEventListener('worldpilot_export_lerobot_dataset', () => {
    useWorldStore.getState().exportVLAEmbodiedDataset();
  });

  window.addEventListener('worldpilot_synthesize_clone', (e: any) => {
    useWorldStore.getState().synthesizeClone(e.detail?.operatorName);
  });

  window.addEventListener('worldpilot_run_clone_rollout', (e: any) => {
    useWorldStore.getState().simulateCloneRollout(e.detail?.stepsCount);
  });

  window.addEventListener('worldpilot_toggle_attention_heatmap', (e: any) => {
    useWorldStore.getState().toggleAttentionHeatmap(e.detail?.force);
  });

  window.addEventListener('worldpilot_open_publish_gate', (e: any) => {
    useWorldStore.getState().openPublishReadinessModal(e.detail?.preset);
  });

  window.addEventListener('worldpilot_open_edit_order_lab', () => {
    (useWorldStore.getState() as any).openEditOrderLabModal();
  });

  window.addEventListener('worldpilot_run_playtest', (e: any) => {
    useWorldStore.getState().openSyntheticPlaytesterModal();
    if (e.detail?.persona) {
      useWorldStore.getState().setActivePlaytesterPersona(e.detail.persona);
    }
  });

  window.addEventListener('worldpilot_apply_minimal_patch', () => {
    useWorldStore.getState().applyMinimalPatchAndRetest();
  });

  window.addEventListener('worldpilot_open_research_dashboard', () => {
    useWorldStore.getState().openResearchDashboard();
  });

  window.addEventListener('worldpilot_compile_pedagogy', (e: any) => {
    useWorldStore.getState().compileAndLoadPedagogicalSimulation(e.detail?.presetKey || 'electricity_ohm');
  });

  window.addEventListener('worldpilot_audit_blast_radius', () => {
    useWorldStore.getState().evaluateCurrentWorldBlastRadius();
    useWorldStore.getState().openResearchDashboard();
  });

  window.addEventListener('worldpilot_reroll_seed', () => {
    const newSeed = Math.floor(100000 + Math.random() * 900000);
    const state = useWorldStore.getState();
    const activeQuest = state.world.ir.activeQuestId ? state.world.ir.quests?.[state.world.ir.activeQuestId] : undefined;
    const title = `${state.world.gameplay?.title || ''} ${activeQuest?.title || ''} ${state.currentSceneTitle || ''}`;
    const domain = title.includes('Mécanique')
      ? 'MECHANICS_ASSEMBLY'
      : title.includes('Thermique') || title.includes('Thermodynamique') || title.includes('Calorimétrie')
      ? 'THERMODYNAMICS'
      : title.includes('Gastronomie') || title.includes('Chimie')
      ? 'CHEMISTRY_GASTRONOMY'
      : 'PHYSICS_ELECTRICITY';
    const challenge = compileProceduralChallenge({ domain, seed: newSeed });
    useWorldStore.getState().resetWorld();
    useWorldStore.getState().applyPatch(challenge.worldPatch, 'Défi Diagnostic Procédural', { intent: 'reroll_seed' });
  });
}
