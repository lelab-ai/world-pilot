// src/engine/slices/worldSlice.ts
// Pure Deterministic World Representation, Verified Patch Pipeline & Spatial Editing

import type { StateCreator } from 'zustand';
import type { StoreState, WorldSlice, LiveCausalEvent } from './types';
import type { WorldState, WorldPatch, EntitySpec, QuestSpec, SavedSpatialLayout } from '../../core/types';
import { defaultGameplayState } from '../gameplayPresets';
import { validateWorld } from '../validator';
import { applyAutonomousSpatialEngine, autoLockStructuralFurniture, autoGroundEntities, autoDeoverlapFloorEntities } from '../autonomousSpatialEngine';
import { getSupportingSurfaceHeight, isFloorFurniture, isStaticOrStructuralEntity } from '../spatialSurface';
import { evaluateEvent, playAudioFx } from '../evaluator';
import { tracker } from '../../observability/tracker';
import { metaController } from '../../research/metaController';
import { getWorldTheme } from '../../library/worldThemes';
import { ambientAudio } from '../ambientAudio';
import { speakAgentDialogue } from '../agentDialogues';
import { downloadWorldFile, exportWorldToJson, parseWorldFromYaml, parseYaml } from '../worldFormat';
import { createInitialShadowGraph } from '../../research/inverseIntentEngine';

export const initialWorld: WorldState = {
  version: 1,
  ir: {
    entities: {},
    rules: {},
    invariants: {},
    quests: {},
    activeQuestId: null
  },
  flags: {},
  gameplay: { ...defaultGameplayState }
};

function toVec3Obj(
  v: any,
  fallback: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 }
): { x: number; y: number; z: number } {
  if (Array.isArray(v) && v.length >= 3) {
    return {
      x: Number.isFinite(Number(v[0])) ? Number(v[0]) : fallback.x,
      y: Number.isFinite(Number(v[1])) ? Number(v[1]) : fallback.y,
      z: Number.isFinite(Number(v[2])) ? Number(v[2]) : fallback.z
    };
  }
  if (v && typeof v === 'object') {
    return {
      x: Number.isFinite(Number(v.x)) ? Number(v.x) : fallback.x,
      y: Number.isFinite(Number(v.y)) ? Number(v.y) : fallback.y,
      z: Number.isFinite(Number(v.z)) ? Number(v.z) : fallback.z
    };
  }
  return { ...fallback };
}

function getFloorFurnitureTargetY(entity: EntitySpec, allEntities: Record<string, EntitySpec>): number {
  const aid = (entity.visuals?.assetId || '').toLowerCase();
  const id = (entity.id || '').toLowerCase();
  const name = (entity.name || '').toLowerCase();
  const isVehicle =
    aid === 'wp-supercar-showroom' ||
    aid.includes('supercar') ||
    id.includes('supercar') ||
    name.includes('supercar') ||
    name.includes('voiture');
  if (!isVehicle) return 0;
  const hasTurntable = Object.values(allEntities).some(e => {
    const eAid = (e.visuals?.assetId || '').toLowerCase();
    const eId = (e.id || '').toLowerCase();
    const eName = (e.name || '').toLowerCase();
    return eAid === 'wp-plateau-tournant' || eAid.includes('turntable') || eId.includes('turntable') || eName.includes('plateau tournant');
  });
  return hasTurntable ? 0.09 : 0;
}

function sanitizeRestoredWorld(worldObj: any): void {
  if (!worldObj || !worldObj.ir) return;
  if (worldObj.ir.entities) {
    Object.values(worldObj.ir.entities).forEach((e: any) => {
      if (!e) return;
      if (!e.visuals) e.visuals = {};
      const nameKey = (e.name || e.id || '').toLowerCase();
      const idKey = (e.id || '').toLowerCase();
      const isFloorSlab =
        !nameKey.includes('console') &&
        !nameKey.includes('parasol') &&
        !nameKey.includes('tournesol') &&
        !nameKey.includes('boussole') &&
        !nameKey.includes('au sol') &&
        !nameKey.includes('du sol') &&
        !nameKey.includes('sur le sol') &&
        !nameKey.includes('tapis') &&
        (nameKey.startsWith('sol ') || nameKey === 'sol' || nameKey.startsWith('dalle de sol') || nameKey.startsWith('plancher') ||
         idKey === 'sol' || idKey.startsWith('sol_') || idKey.endsWith('_sol') ||
         idKey === 'ground' || idKey.startsWith('ground_') || idKey.endsWith('_ground') ||
         idKey === 'floor' || idKey.startsWith('floor_') || idKey.endsWith('_floor'));
      const anyTf = Array.isArray(e.capabilities) ? e.capabilities.find((c: any) => c.type === 'transform') : null;
      if (anyTf) {
        if (Array.isArray(anyTf.position)) {
          anyTf.position = {
            x: Number(anyTf.position[0]) || 0,
            y: Number(anyTf.position[1]) || 0,
            z: Number(anyTf.position[2]) || 0
          };
        }
        if (Array.isArray(anyTf.rotation)) {
          anyTf.rotation = {
            x: Number(anyTf.rotation[0]) || 0,
            y: Number(anyTf.rotation[1]) || 0,
            z: Number(anyTf.rotation[2]) || 0
          };
        }
        if (Array.isArray(anyTf.scale)) {
          anyTf.scale = {
            x: Number(anyTf.scale[0]) || 1,
            y: Number(anyTf.scale[1]) || 1,
            z: Number(anyTf.scale[2]) || 1
          };
        }
      }
      if (isFloorSlab) {
        if (nameKey.includes('marbre') || nameKey.includes('showroom') || nameKey.includes('noir') || nameKey.includes('carrelage') || nameKey.includes('parquet')) {
          if (e.visuals.modelUrl === '/3d-objects/stone-ground.glb') {
            delete e.visuals.modelUrl;
          }
          const cLow = (e.visuals.color || '').toLowerCase();
          if (!cLow || cLow === '#4ade80' || cLow === '#22c55e' || cLow === '#10b981' || cLow === '#34d399' || cLow === '#16a34a') {
            e.visuals.color = '#111827';
          }
        }
        if (Array.isArray(e.capabilities)) {
          e.capabilities = e.capabilities.filter((c: any) => c.type !== 'draggable' && c.type !== 'trigger_zone');
        }
        const tf = Array.isArray(e.capabilities) ? e.capabilities.find((c: any) => c.type === 'transform') : null;
        if (tf) {
          const px = Array.isArray(tf.position) ? (tf.position[0] || 0) : (tf.position?.x || 0);
          const py = Array.isArray(tf.position) ? (tf.position[1] || 0) : (tf.position?.y || 0);
          const pz = Array.isArray(tf.position) ? (tf.position[2] || 0) : (tf.position?.z || 0);
          tf.position = { x: px, y: Math.min(-0.015, py), z: pz };
          const sx = Array.isArray(tf.scale) ? (tf.scale[0] || 10) : (tf.scale?.x || 10);
          const sy = Array.isArray(tf.scale) ? (tf.scale[1] || 0.02) : (tf.scale?.y || 0.02);
          const sz = Array.isArray(tf.scale) ? (tf.scale[2] || 10) : (tf.scale?.z || 10);
          tf.scale = { x: Math.max(4, sx), y: Math.min(0.02, Math.max(0.005, sy)), z: Math.max(4, sz) };
        }
      }
    });
    autoLockStructuralFurniture(worldObj.ir.entities);
    autoGroundEntities(worldObj.ir.entities, false);
    autoDeoverlapFloorEntities(worldObj.ir.entities);
    Object.values(worldObj.ir.entities).forEach((e: any) => {
      if (!e || !Array.isArray(e.capabilities)) return;
      if (e.capabilities.some((c: any) => c.type === 'trigger_zone')) return;
      const tf = e.capabilities.find((c: any) => c.type === 'transform');
      if (!tf || !tf.position) return;
      const px = Array.isArray(tf.position) ? (tf.position[0] || 0) : (tf.position.x || 0);
      const py = Array.isArray(tf.position) ? (tf.position[1] || 0) : (tf.position.y || 0);
      const pz = Array.isArray(tf.position) ? (tf.position[2] || 0) : (tf.position.z || 0);
      if (py >= 0.70 && py <= 0.80) {
        const sup = getSupportingSurfaceHeight(px, pz, worldObj.ir.entities, e.id);
        if (sup.isGround) {
          tf.position = { x: px, y: 0.05, z: pz };
        }
      }
    });
  }
  if (worldObj.ir.quests && worldObj.ir.entities) {
    const entityList = Object.values(worldObj.ir.entities) as any[];
    Object.values(worldObj.ir.quests).forEach((q: any) => {
      if (!q || !Array.isArray(q.steps)) return;
      q.steps.forEach((step: any) => {
        if (!step) return;
        if (typeof step.requiredEvent === 'string' && step.requiredEvent.includes(':')) {
          const parts = step.requiredEvent.split(':').map((p: string) => p.trim()).filter(Boolean);
          const baseEvt = parts[0].toUpperCase();
          const isDualTargetEvt = baseEvt === 'DROP' || baseEvt === 'PROXIMITY' || baseEvt === 'COLLIDE' || baseEvt === 'TRANSFER';
          if (parts.length >= 3 && isDualTargetEvt) {
            if (!step.targetEntityId || step.targetEntityId === parts[2]) {
              step.targetEntityId = parts[1];
            }
            if (!step.targetZoneId) {
              step.targetZoneId = parts[2];
            }
          } else {
            if (!step.targetEntityId && parts[1]) step.targetEntityId = parts[1];
            if (!step.targetZoneId && parts[2] && isDualTargetEvt) {
              step.targetZoneId = parts[2];
            }
          }
        }
        if (!step.targetEntityId || !worldObj.ir.entities[step.targetEntityId]) {
          const stepText = `${step.title || ''} ${step.description || ''} ${step.targetEntityId || ''}`.toLowerCase();
          const matched = entityList.find((ent: any) => {
            if (!ent || ent.id === 'ground' || ent.id === 'agent_avatar') return false;
            const eName = (ent.name || '').toLowerCase();
            const eId = (ent.id || '').toLowerCase();
            if ((eName.length >= 4 && stepText.includes(eName)) || (eId.length >= 4 && stepText.includes(eId))) return true;
            if ((stepText.includes('console') || stepText.includes('configur') || stepText.includes('holograph')) && (eName.includes('console') || eName.includes('configur') || eId.includes('console') || eId.includes('configur'))) return true;
            if ((stepText.includes('start') || stepText.includes('moteur') || stepText.includes('allumage') || stepText.includes('bouton')) && (eName.includes('start') || eName.includes('bouton') || eId.includes('start') || eId.includes('bouton'))) return true;
            if ((stepText.includes('supercar') || stepText.includes('voiture') || stepText.includes('piste') || stepText.includes('essai') || stepText.includes('aérodynamique') || stepText.includes('aerodynamique')) && (eName.includes('supercar') || eId.includes('supercar')) && !eName.includes('console') && !eName.includes('configur')) return true;
            return false;
          });
          if (matched) {
            step.targetEntityId = matched.id;
          }
        }
      });
    });
  }
}

function patchEntityVisuals(e: any): void {
  if (!e.visuals) e.visuals = {};
  const nameKey = (e.name || e.id || '').toLowerCase();
  const idKey = (e.id || '').toLowerCase();
  const isFloorSlab =
    !nameKey.includes('console') &&
    !nameKey.includes('parasol') &&
    !nameKey.includes('tournesol') &&
    !nameKey.includes('boussole') &&
    !nameKey.includes('au sol') &&
    !nameKey.includes('du sol') &&
    !nameKey.includes('sur le sol') &&
    !nameKey.includes('tapis') &&
    (nameKey.startsWith('sol ') || nameKey === 'sol' || nameKey.startsWith('dalle de sol') || nameKey.startsWith('plancher') ||
     idKey === 'sol' || idKey.startsWith('sol_') || idKey.endsWith('_sol') ||
     idKey === 'ground' || idKey.startsWith('ground_') || idKey.endsWith('_ground') ||
     idKey === 'floor' || idKey.startsWith('floor_') || idKey.endsWith('_floor'));

  const anyTf = Array.isArray(e.capabilities) ? e.capabilities.find((c: any) => c.type === 'transform') : null;
  if (anyTf) {
    if (Array.isArray(anyTf.position)) {
      anyTf.position = {
        x: Number(anyTf.position[0]) || 0,
        y: Number(anyTf.position[1]) || 0,
        z: Number(anyTf.position[2]) || 0
      };
    }
    if (Array.isArray(anyTf.rotation)) {
      anyTf.rotation = {
        x: Number(anyTf.rotation[0]) || 0,
        y: Number(anyTf.rotation[1]) || 0,
        z: Number(anyTf.rotation[2]) || 0
      };
    }
    if (Array.isArray(anyTf.scale)) {
      anyTf.scale = {
        x: Number(anyTf.scale[0]) || 1,
        y: Number(anyTf.scale[1]) || 1,
        z: Number(anyTf.scale[2]) || 1
      };
    }
  }

  if (isFloorSlab) {
    if (nameKey.includes('marbre') || nameKey.includes('showroom') || nameKey.includes('noir') || nameKey.includes('carrelage') || nameKey.includes('parquet')) {
      if (e.visuals.modelUrl === '/3d-objects/stone-ground.glb') {
        delete e.visuals.modelUrl;
      }
      const cLow = (e.visuals.color || '').toLowerCase();
      if (!cLow || cLow === '#4ade80' || cLow === '#22c55e' || cLow === '#10b981' || cLow === '#34d399' || cLow === '#16a34a') {
        e.visuals.color = '#111827';
      }
    }
    if (Array.isArray(e.capabilities)) {
      e.capabilities = e.capabilities.filter((c: any) => c.type !== 'draggable' && c.type !== 'trigger_zone');
    }
    const tf = Array.isArray(e.capabilities) ? e.capabilities.find((c: any) => c.type === 'transform') : null;
    if (tf) {
      const px = Array.isArray(tf.position) ? (tf.position[0] || 0) : (tf.position?.x || 0);
      const py = Array.isArray(tf.position) ? (tf.position[1] || 0) : (tf.position?.y || 0);
      const pz = Array.isArray(tf.position) ? (tf.position[2] || 0) : (tf.position?.z || 0);
      tf.position = { x: px, y: Math.min(-0.015, py), z: pz };
      const sx = Array.isArray(tf.scale) ? (tf.scale[0] || 10) : (tf.scale?.x || 10);
      const sy = Array.isArray(tf.scale) ? (tf.scale[1] || 0.02) : (tf.scale?.y || 0.02);
      const sz = Array.isArray(tf.scale) ? (tf.scale[2] || 10) : (tf.scale?.z || 10);
      tf.scale = { x: Math.max(4, sx), y: Math.min(0.02, Math.max(0.005, sy)), z: Math.max(4, sz) };
    }
  }


}

export const createWorldSlice: StateCreator<StoreState, [], [], WorldSlice> = (set, get) => ({
  world: initialWorld,
  spatialContext: {
    selectedEntityId: null,
    pointedEntityId: null,
  },
  instruction: '',
  isSimulating: false,
  showGrid: true,
  showLabels: false,
  physicsEpoch: 1,
  incrementPhysicsEpoch: () => set(s => ({ physicsEpoch: s.physicsEpoch + 1 })),
  currentSceneTitle: 'Nouvelle scène',
  setCurrentSceneTitle: (currentSceneTitle: string) => set({ currentSceneTitle }),
  undoStack: [],
  redoStack: [],
  canUndo: false,
  canRedo: false,
  cameraFocusTarget: null,
  setCameraFocusTarget: (cameraFocusTarget: [number, number, number] | null) => set({ cameraFocusTarget }),
  warnings: [],

  setShowGrid: (showGrid: boolean) => set({ showGrid }),
  setShowLabels: (showLabels: boolean) => set({ showLabels }),
  setInstruction: (instruction: string) => set({ instruction }),
  setSimulating: (isSimulating: boolean) => set({ isSimulating }),
  gizmoMode: 'off',
  setGizmoMode: (gizmoMode: 'off' | 'translate' | 'rotate') => set({ gizmoMode }),
  cycleGizmoMode: () => {
    const cur = get().gizmoMode;
    const next = cur === 'off' ? 'translate' : cur === 'translate' ? 'rotate' : 'off';
    set({ gizmoMode: next });
    playAudioFx('switch_click');
    const label = next === 'off' ? 'Gizmo 3D désactivé' : next === 'translate' ? 'Gizmo 3D Translation (Flèches X/Y/Z)' : 'Gizmo 3D Rotation (Anneaux)';
    set(s => ({ warnings: [...s.warnings, `📐 ${label}`] }));
  },
  placementModeEntityId: null,
  setPlacementModeEntityId: (placementModeEntityId: string | null) => set({ placementModeEntityId }),
  showCausalObservability: false,
  setShowCausalObservability: (showCausalObservability: boolean) => set({ showCausalObservability }),
  toggleCausalObservability: () => {
    const next = !get().showCausalObservability;
    set({ showCausalObservability: next });
    playAudioFx('switch_click');
  },
  liveCausalFeed: [],
  addLiveCausalEvent: (event) => {
    const id = `causal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const fullEvent: LiveCausalEvent = {
      ...event,
      id,
      timestamp: Date.now()
    };
    set(state => ({
      liveCausalFeed: [fullEvent, ...state.liveCausalFeed].slice(0, 35)
    }));
  },
  clearLiveCausalFeed: () => set({ liveCausalFeed: [] }),
  savedSpatialLayouts: (() => {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('worldpilot_saved_layouts');
        if (stored) return JSON.parse(stored);
      }
    } catch (_) {}
    return [];
  })(),
  showLayoutsModal: false,
  setShowLayoutsModal: (showLayoutsModal: boolean) => set({ showLayoutsModal }),
  showObjectCompatibilityModal: false,
  setShowObjectCompatibilityModal: (showObjectCompatibilityModal: boolean) => set({ showObjectCompatibilityModal }),
  compatibilityTargetEntityId: null,
  setCompatibilityTargetEntityId: (compatibilityTargetEntityId: string | null) => set({ compatibilityTargetEntityId }),
  explodedEntities: {},
  toggleExplodedView: (entityId: string) => {
    set(state => {
      const isCurrentlyExploded = !!state.explodedEntities[entityId];
      const next = { ...state.explodedEntities, [entityId]: !isCurrentlyExploded };
      return { explodedEntities: next };
    });
    playAudioFx('drag_whoosh');
  },
  selectedPartId: null,
  setSelectedPartId: (selectedPartId: string | null) => set({ selectedPartId }),
  showEntity2DDrawer: false,
  setShowEntity2DDrawer: (showEntity2DDrawer: boolean) => set({ showEntity2DDrawer }),
  showImportUrlModal: false,
  setShowImportUrlModal: (showImportUrlModal: boolean) => set({ showImportUrlModal }),
  setWorldFlag: (flag: string, value: any) => {
    get().addLiveCausalEvent({
      type: 'flag',
      icon: '🚩',
      message: `Drapeau "${flag}" défini à ${String(value)}`,
      badge: 'État',
      productive: true
    });
    set(state => {
      const nextFlags = { ...(state.world.flags || {}), [flag]: value };
      let newWorld = { ...state.world, flags: nextFlags };
      const evalRes = evaluateEvent(newWorld, {
        type: 'FLAG_CHANGED' as any,
        sourceId: flag,
        payload: { flag, value }
      });
      newWorld = evalRes.newState;
      const extraWarnings = evalRes.warnings || [];
      return {
        world: newWorld,
        warnings: [...state.warnings, `🚩 Drapeau "${flag}" forcé à : ${String(value)}`, ...extraWarnings]
      };
    });
    playAudioFx(value ? 'quantum_ping' : 'snap_release');
  },
  triggerRuleManually: (ruleId: string) => {
    const world = get().world;
    const rule = world.ir.rules[ruleId];
    if (!rule) return;
    const sourceId = rule.conditions?.find(c => c.type === 'is_source')?.sourceId || Object.keys(world.ir.entities)[0] || 'manual_source';
    const targetId = rule.conditions?.find(c => c.type === 'is_target')?.targetId;
    get().addLiveCausalEvent({
      type: 'rule',
      icon: '⚡',
      message: `Règle "${ruleId}" déclenchée manuellement`,
      badge: 'Test Règle',
      productive: true
    });
    get().dispatch({
      type: rule.trigger as any,
      sourceId,
      targetId
    });
    playAudioFx('sparkle');
    set(state => ({
      warnings: [...state.warnings, `⚡ Règle "${ruleId}" déclenchée manuellement !`]
    }));
  },

  setWorldState: (newIR: any) => {
    const s = get();
    const prevSnapshot = {
      ir: JSON.parse(JSON.stringify(s.world.ir)),
      flags: JSON.parse(JSON.stringify(s.world.flags || {})),
      gameplay: s.world.gameplay ? JSON.parse(JSON.stringify(s.world.gameplay)) : undefined,
      title: s.currentSceneTitle,
      instruction: 'Modification du monde'
    };
    const nextUndoStack = [...s.undoStack.slice(-29), prevSnapshot];

    set(state => ({
      undoStack: nextUndoStack,
      redoStack: [],
      canUndo: true,
      canRedo: false,
      physicsEpoch: state.physicsEpoch + 1,
      world: {
        ...state.world,
        version: state.world.version + 1,
        ir: newIR.entities ? newIR : (newIR.ir || newIR)
      }
    }));
  },

  setSpatialContext: (selected, pointed) => {
    set({ spatialContext: { selectedEntityId: selected, pointedEntityId: pointed } });
    const targetId = selected || pointed;
    if (targetId) {
      const ent = get().world.ir.entities[targetId];
      if (ent) {
        const transformCap = ent.capabilities?.find(c => c.type === 'transform');
        const pos = toVec3Obj(transformCap?.position, { x: 0, y: 0.9, z: 0 });
        get().recordVisualFixation(targetId, ent.name || targetId, pos);
      }
    }
  },

  clearWarnings: () => {
    set({ warnings: [] });
  },

  resetWorld: () => {
    const s = get();
    const prevSnapshot = {
      ir: JSON.parse(JSON.stringify(s.world.ir)),
      flags: JSON.parse(JSON.stringify(s.world.flags || {})),
      gameplay: s.world.gameplay ? JSON.parse(JSON.stringify(s.world.gameplay)) : undefined,
      title: s.currentSceneTitle,
      instruction: 'Réinitialisation'
    };
    const nextUndoStack = [...s.undoStack.slice(-29), prevSnapshot];

    set(state => ({
      undoStack: nextUndoStack,
      redoStack: [],
      canUndo: true,
      canRedo: false,
      physicsEpoch: state.physicsEpoch + 1,
      world: {
        version: 1,
        ir: { entities: {}, rules: {}, invariants: {}, quests: {}, activeQuestId: null },
        flags: {},
        gameplay: { ...defaultGameplayState }
      },
      spatialContext: { selectedEntityId: null, pointedEntityId: null },
      warnings: [],
      instruction: '',
      isSimulating: false,
      gizmoMode: 'off',
      isDishPlated: false,
      seasoningProfile: { salt: 0, herbs: 0, oil: 0 },
      cookingHeatLevel: 0,
      cookingDoneness: 0,
      lastAnnouncedDonenessStage: 0,
      cookingTemperature: 20,
      cookingTimerRemaining: null,
      isCookingTimerRunning: false,
      isCoWorkerActive: false,
      currentWorldThemeId: 'earth-atelier',
      currentAtmosphere: 'atelier',
      currentGravity: [0, -9.81, 0],
      currentSceneTitle: 'Nouvelle scène',
      customAgentPersona: null,
      supercarCustomPaint: null,
      supercarBrakeCalipers: 'gold',
      supercarCarbonPack: true,
      isSupercarConfiguratorOpen: false,
      explodedEntities: {},
      selectedPartId: null,
      placementModeEntityId: null,
      hoveredEntityId: null,
      showEntity2DDrawer: false,

      // Remise à zéro complète des simulateurs IA, blast radius & graphes d'intentions
      blastRadiusReport: null,
      isPlaytesterVisualizerActive: false,
      playtesterResult: null,
      showSyntheticPlaytesterModal: false,
      lastGuarantorAudit: null,
      shadowGraph: createInitialShadowGraph(),
      userFrictionState: {
        consecutiveFrictionCount: 0,
        lastFailedEntityId: null,
        lastFailedEntityName: null,
        lastAttemptedAction: undefined,
        recentInteractions: [],
        lastHesitationAlertTime: 0
      },
      showResearchDashboardModal: false,
      cameraFocusTarget: null,
      liveCausalFeed: [],
      spatialAgentPositionOverride: null
    }));

    try {
      ambientAudio.setAtmosphere('atelier');
    } catch (_) {}
  },

  applyPatch: (patch: WorldPatch, instruction: string, plan?: any) => {
    set((state) => {
      const newWorld = JSON.parse(JSON.stringify(state.world));

      patch.entitiesRemoved?.forEach((id, idx) => {
        const oldEntityName = newWorld.ir.entities[id]?.name || id;
        delete newWorld.ir.entities[id];
        const replacementEntity = patch.entitiesCreated?.[idx] || patch.entitiesCreated?.[0];
        if (replacementEntity && replacementEntity.id !== id) {
          (replacementEntity as any).semantic_replaces = id;
          (replacementEntity as any).semantic_replaces_name = oldEntityName;
          Object.values(newWorld.ir.entities).forEach((ent: any) => {
            ent?.relations?.forEach((rel: any) => {
              if (rel.targetId === id) rel.targetId = replacementEntity.id;
            });
          });
          Object.values(newWorld.ir.rules).forEach((rule: any) => {
            if (typeof rule.trigger === 'string' && rule.trigger.includes(':')) {
              rule.trigger = rule.trigger
                .split(':')
                .map((p: string) => (p.trim() === id ? replacementEntity.id : p))
                .join(':');
            }
            rule.conditions?.forEach((cond: any) => {
              if (cond.type === 'is_source' && cond.sourceId === id) {
                cond.sourceId = replacementEntity.id;
              }
              if (cond.type === 'is_target' && cond.targetId === id) {
                cond.targetId = replacementEntity.id;
              }
            });
            rule.actions?.forEach((act: any) => {
              if (act.entityId === id) act.entityId = replacementEntity.id;
              if (act.targetId === id) act.targetId = replacementEntity.id;
              if (act.sourceEntityId === id) act.sourceEntityId = replacementEntity.id;
              if (act.targetEntityId === id) act.targetEntityId = replacementEntity.id;
            });
          });
          if (newWorld.ir.quests) {
            Object.values(newWorld.ir.quests).forEach((q: any) => {
              q?.steps?.forEach((step: any) => {
                if (step.targetEntityId === id) step.targetEntityId = replacementEntity.id;
                if (step.targetZoneId === id) step.targetZoneId = replacementEntity.id;
                if (typeof step.requiredEvent === 'string' && step.requiredEvent.includes(':')) {
                  step.requiredEvent = step.requiredEvent
                    .split(':')
                    .map((p: string) => (p.trim() === id ? replacementEntity.id : p))
                    .join(':');
                }
              });
            });
          }
        } else if (!replacementEntity) {
          Object.entries(newWorld.ir.rules).forEach(([ruleId, rule]: [string, any]) => {
            const condRefsRemoved = rule.conditions?.some(
              (c: any) =>
                (c.type === 'is_source' && c.sourceId === id) ||
                (c.type === 'is_target' && c.targetId === id)
            );
            const actRefsRemoved = rule.actions?.some(
              (a: any) =>
                a.entityId === id ||
                a.targetId === id ||
                a.sourceEntityId === id ||
                a.targetEntityId === id
            );
            if (condRefsRemoved || actRefsRemoved) {
              delete newWorld.ir.rules[ruleId];
            }
          });
        }
      });
      patch.entitiesCreated?.forEach(e => {
        patchEntityVisuals(e);
        if (Array.isArray(e.capabilities) && e.capabilities.some((c: any) => c.type === 'trigger_zone') && !e.capabilities.some((c: any) => c.type === 'collider')) {
          e.capabilities.push({ type: 'collider' });
        }
        if (!newWorld.ir.entities[e.id]) {
          newWorld.ir.entities[e.id] = { ...e, capabilities: e.capabilities || [] };
        } else {
          newWorld.ir.entities[e.id] = {
            ...newWorld.ir.entities[e.id],
            ...e,
            capabilities: e.capabilities || newWorld.ir.entities[e.id].capabilities,
            visuals: { ...newWorld.ir.entities[e.id].visuals, ...e.visuals }
          };
        }
      });
      patch.entitiesChanged?.forEach(e => {
        if (Array.isArray(e.capabilities) && e.capabilities.some((c: any) => c.type === 'trigger_zone') && !e.capabilities.some((c: any) => c.type === 'collider')) {
          e.capabilities.push({ type: 'collider' });
        }
        const previous = newWorld.ir.entities[e.id!];
        if (previous) {
          const merged = { ...previous, ...e, visuals: { ...previous.visuals, ...e.visuals } };
          patchEntityVisuals(merged);
          newWorld.ir.entities[e.id!] = merged;
        }
      });
      patch.rulesChanged?.forEach(r => {
        if (newWorld.ir.rules[r.id!]) {
          newWorld.ir.rules[r.id!] = { ...newWorld.ir.rules[r.id!], ...r };
        } else {
          newWorld.ir.rules[r.id!] = r as any;
        }
      });
      patch.invariantsAdded?.forEach(inv => {
        newWorld.ir.invariants[inv.id] = inv;
      });
      patch.questsAdded?.forEach(q => {
        if (!newWorld.ir.quests) newWorld.ir.quests = {};
        newWorld.ir.quests[q.id] = q;
        if (!newWorld.ir.activeQuestId) {
          newWorld.ir.activeQuestId = q.id;
        }
      });
      if (patch.activeQuestId !== undefined) {
        newWorld.ir.activeQuestId = patch.activeQuestId;
      }
      if (patch.questUpdated && newWorld.ir.quests) {
        const qId = patch.questUpdated.id || newWorld.ir.activeQuestId;
        if (qId && newWorld.ir.quests[qId]) {
          newWorld.ir.quests[qId] = { ...newWorld.ir.quests[qId], ...patch.questUpdated };
        }
      }
      if (newWorld.ir.quests && newWorld.ir.entities) {
        const entityList = Object.values(newWorld.ir.entities) as any[];
        Object.values(newWorld.ir.quests).forEach((q: any) => {
          if (!q || !Array.isArray(q.steps)) return;
          q.steps.forEach((step: any) => {
            if (!step) return;
            if (typeof step.requiredEvent === 'string' && step.requiredEvent.includes(':')) {
              const parts = step.requiredEvent.split(':').map((p: string) => p.trim()).filter(Boolean);
              const baseEvt = parts[0].toUpperCase();
              const isDualTargetEvt = baseEvt === 'DROP' || baseEvt === 'PROXIMITY' || baseEvt === 'COLLIDE' || baseEvt === 'TRANSFER';
              if (parts.length >= 3 && isDualTargetEvt) {
                if (!step.targetEntityId || step.targetEntityId === parts[2]) {
                  step.targetEntityId = parts[1];
                }
                if (!step.targetZoneId) {
                  step.targetZoneId = parts[2];
                }
              } else {
                if (!step.targetEntityId && parts[1]) step.targetEntityId = parts[1];
                if (!step.targetZoneId && parts[2] && isDualTargetEvt) {
                  step.targetZoneId = parts[2];
                }
              }
            }
            if (!step.targetEntityId || !newWorld.ir.entities[step.targetEntityId]) {
              const stepText = `${step.title || ''} ${step.description || ''} ${step.targetEntityId || ''}`.toLowerCase();
              const matched = entityList.find((ent: any) => {
                if (!ent || ent.id === 'ground' || ent.id === 'agent_avatar') return false;
                const eName = (ent.name || '').toLowerCase();
                const eId = (ent.id || '').toLowerCase();
                if ((eName.length >= 4 && stepText.includes(eName)) || (eId.length >= 4 && stepText.includes(eId))) return true;
                if ((stepText.includes('console') || stepText.includes('configur') || stepText.includes('holograph')) && (eName.includes('console') || eName.includes('configur') || eId.includes('console') || eId.includes('configur'))) return true;
                if ((stepText.includes('start') || stepText.includes('moteur') || stepText.includes('allumage') || stepText.includes('bouton')) && (eName.includes('start') || eName.includes('bouton') || eId.includes('start') || eId.includes('bouton'))) return true;
                if ((stepText.includes('supercar') || stepText.includes('voiture') || stepText.includes('piste') || stepText.includes('essai') || stepText.includes('aérodynamique') || stepText.includes('aerodynamique')) && (eName.includes('supercar') || eId.includes('supercar')) && !eName.includes('console') && !eName.includes('configur')) return true;
                return false;
              });
              if (matched) {
                step.targetEntityId = matched.id;
              }
            }
          });
        });
      }
      if (patch.gameplayPatch) {
        newWorld.gameplay = {
          ...(newWorld.gameplay || defaultGameplayState),
          ...patch.gameplayPatch
        };
      }

      // Moteur d'Intelligence Spatiale Autonome
      const spatialResult = applyAutonomousSpatialEngine(
        newWorld.ir.entities,
        plan?.intent || instruction || ''
      );

      // Run Cheap Checks
      const validation = validateWorld(newWorld);
      if (!validation.valid) {
        throw new Error(`Patch rejected by cheap checks: ${validation.errors.join(', ')}`);
      }

      newWorld.version += 1;

      tracker.recordEdit(
        instruction,
        plan,
        patch,
        state.world.version,
        state.world.ir,
        newWorld.ir
      );

      let nextSceneTitle = state.currentSceneTitle;
      if (instruction && instruction.startsWith('Démonstration : ')) {
        nextSceneTitle = instruction.replace('Démonstration : ', '').trim();
      } else if (instruction && state.currentSceneTitle === 'Nouvelle scène' && instruction.length <= 60 && !instruction.startsWith('patch_') && !instruction.startsWith('Fix:')) {
        nextSceneTitle = instruction.charAt(0).toUpperCase() + instruction.slice(1);
      }

      const prevSnapshot = {
        ir: JSON.parse(JSON.stringify(state.world.ir)),
        flags: JSON.parse(JSON.stringify(state.world.flags || {})),
        gameplay: state.world.gameplay ? JSON.parse(JSON.stringify(state.world.gameplay)) : undefined,
        title: state.currentSceneTitle,
        instruction: instruction || 'Action'
      };
      const nextUndoStack = [...state.undoStack.slice(-29), prevSnapshot];

      const isNewSceneOrGame = Boolean(
        patch.questsAdded ||
        (patch.entitiesCreated && patch.entitiesCreated.length >= 3) ||
        patch.gameplayPatch ||
        (instruction && (
          instruction.toLowerCase().includes('créer') ||
          instruction.toLowerCase().includes('jeu') ||
          instruction.toLowerCase().includes('puzzle') ||
          instruction.toLowerCase().includes('taquin') ||
          instruction.toLowerCase().includes('go')
        ))
      );
      if (isNewSceneOrGame) {
        metaController.resetLoop();
      }

      const nextTheme = patch.worldTheme || plan?.worldTheme || (isNewSceneOrGame ? spatialResult.worldThemeId : state.currentWorldThemeId);
      const isExplicitPersonaChange = Boolean(
        instruction && (
          instruction.toLowerCase().includes('avatar') ||
          instruction.toLowerCase().includes('guide') ||
          instruction.toLowerCase().includes('persona')
        )
      );
      const nextPersona = isExplicitPersonaChange
        ? (patch.persona || plan?.persona || (state as any).customAgentPersona)
        : (isNewSceneOrGame ? (patch.persona || plan?.persona || null) : (state as any).customAgentPersona);

      return {
        world: newWorld,
        currentSceneTitle: nextSceneTitle,
        undoStack: nextUndoStack,
        redoStack: [],
        canUndo: true,
        canRedo: false,
        physicsEpoch: state.physicsEpoch + 1,
        customAgentPersona: nextPersona,
        ...(spatialResult.cameraPreset && spatialResult.cameraPreset !== 'overview'
          ? { cameraPreset: spatialResult.cameraPreset }
          : {}),
        ...(nextTheme && nextTheme !== state.currentWorldThemeId
          ? { currentWorldThemeId: nextTheme, currentAtmosphere: nextTheme }
          : {}),
        ...(isNewSceneOrGame ? {
          metaHypotheses: metaController.getHypotheses(),
          metaStrategy: metaController.getActiveStrategy(),
          userFrictionState: {
            consecutiveFrictionCount: 0,
            lastFailedEntityId: null,
            lastFailedEntityName: null,
            recentInteractions: [],
            lastHesitationAlertTime: 0,
          }
        } : {})
      };
    });
  },

  undo: () => {
    const state = get();
    if (state.undoStack.length === 0) return false;
    const nextUndoStack = [...state.undoStack];
    const previousSnapshot = nextUndoStack.pop()!;
    const currentSnapshot = {
      ir: JSON.parse(JSON.stringify(state.world.ir)),
      flags: JSON.parse(JSON.stringify(state.world.flags || {})),
      gameplay: state.world.gameplay ? JSON.parse(JSON.stringify(state.world.gameplay)) : undefined,
      title: state.currentSceneTitle,
      instruction: 'Annulation'
    };
    const nextRedoStack = [...state.redoStack, currentSnapshot];

    const restoredWorld = {
      ...state.world,
      version: state.world.version + 1,
      ir: JSON.parse(JSON.stringify(previousSnapshot.ir)),
      flags: previousSnapshot.flags !== undefined ? JSON.parse(JSON.stringify(previousSnapshot.flags)) : state.world.flags,
      gameplay: previousSnapshot.gameplay !== undefined ? JSON.parse(JSON.stringify(previousSnapshot.gameplay)) : state.world.gameplay
    };

    set({
      world: restoredWorld,
      currentSceneTitle: previousSnapshot.title || state.currentSceneTitle,
      undoStack: nextUndoStack,
      redoStack: nextRedoStack,
      canUndo: nextUndoStack.length > 0,
      canRedo: true,
      physicsEpoch: state.physicsEpoch + 1,
      warnings: [...state.warnings, `↶ Action annulée (${previousSnapshot.instruction || 'Précédente action'})`]
    });
    playAudioFx('switch_click');
    return true;
  },

  redo: () => {
    const state = get();
    if (state.redoStack.length === 0) return false;
    const nextRedoStack = [...state.redoStack];
    const nextSnapshot = nextRedoStack.pop()!;
    const currentSnapshot = {
      ir: JSON.parse(JSON.stringify(state.world.ir)),
      flags: JSON.parse(JSON.stringify(state.world.flags || {})),
      gameplay: state.world.gameplay ? JSON.parse(JSON.stringify(state.world.gameplay)) : undefined,
      title: state.currentSceneTitle,
      instruction: 'Rétablissement'
    };
    const nextUndoStack = [...state.undoStack, currentSnapshot];

    const restoredWorld = {
      ...state.world,
      version: state.world.version + 1,
      ir: JSON.parse(JSON.stringify(nextSnapshot.ir)),
      flags: nextSnapshot.flags !== undefined ? JSON.parse(JSON.stringify(nextSnapshot.flags)) : state.world.flags,
      gameplay: nextSnapshot.gameplay !== undefined ? JSON.parse(JSON.stringify(nextSnapshot.gameplay)) : state.world.gameplay
    };

    set({
      world: restoredWorld,
      currentSceneTitle: nextSnapshot.title || state.currentSceneTitle,
      undoStack: nextUndoStack,
      redoStack: nextRedoStack,
      canUndo: true,
      canRedo: nextRedoStack.length > 0,
      physicsEpoch: state.physicsEpoch + 1,
      warnings: [...state.warnings, `↷ Action rétablie (${nextSnapshot.instruction || 'Action'})`]
    });
    playAudioFx('switch_click');
    return true;
  },

  rotateEntity: (entityId: string, angleDeltaRad: number) => {
    const entity = get().world.ir.entities[entityId];
    if (!entity) return;
    if (isStaticOrStructuralEntity(entity)) {
      set(s => ({ warnings: [...s.warnings, `🔒 L'objet « ${entity.name || entityId} » est un élément ancré (statique / non déplaçable).`] }));
      playAudioFx('tink');
      return;
    }
    const transform = entity.capabilities.find(c => c.type === 'transform');
    const curRot = toVec3Obj(transform?.rotation, { x: 0, y: 0, z: 0 });
    const nextRotY = (curRot.y || 0) + angleDeltaRad;
    get().applyPatch({
      entitiesChanged: [{
        id: entityId,
        capabilities: entity.capabilities.map(c => c.type === 'transform' ? {
          ...c,
          rotation: { ...curRot, y: nextRotY }
        } : c)
      }]
    }, `Pivoter ${entity.name || entity.id}`, {});
    playAudioFx('switch_click');
  },

  duplicateEntity: (entityId: string) => {
    const entity = get().world.ir.entities[entityId];
    if (!entity) return null;
    const transform = entity.capabilities.find(c => c.type === 'transform');
    const pos = toVec3Obj(transform?.position, { x: 0, y: 0, z: 0 });
    const uniqueSuffix = Math.random().toString(36).substring(2, 6);
    const newId = `${entityId}_copie_${uniqueSuffix}`;
    const newName = entity.name ? `${entity.name} (copie)` : `Copie de ${entityId}`;

    const duplicateSpec: EntitySpec = {
      ...JSON.parse(JSON.stringify(entity)),
      id: newId,
      name: newName,
      capabilities: entity.capabilities.map(c => c.type === 'transform' ? {
        ...c,
        position: { x: pos.x + 0.35, y: pos.y, z: pos.z + 0.35 }
      } : c)
    };

    get().applyPatch({
      entitiesCreated: [duplicateSpec]
    }, `Dupliquer ${entity.name || entity.id}`, {});

    get().setSpatialContext(newId, null);
    playAudioFx('chime');
    return newId;
  },

  deleteEntity: (entityId: string) => {
    const entity = get().world.ir.entities[entityId];
    if (!entity) return;
    if (get().spatialContext.selectedEntityId === entityId) {
      get().setSpatialContext(null, null);
    }
    get().applyPatch({
      entitiesRemoved: [entityId]
    }, `Supprimer ${entity.name || entity.id}`, {});
    playAudioFx('switch_click');
  },

  groundEntity: (entityId: string) => {
    const entity = get().world.ir.entities[entityId];
    if (!entity) return;
    const transform = entity.capabilities.find(c => c.type === 'transform');
    const pos = toVec3Obj(transform?.position, { x: 0, y: 0, z: 0 });
    const allEntities = get().world.ir.entities;

    // Le mobilier de sol repose STRICTEMENT au sol à y = 0 (ou 0.09 sur plateau tournant)
    if (isFloorFurniture(entity)) {
      const targetFloorY = getFloorFurnitureTargetY(entity, allEntities);
      get().applyPatch({
        entitiesChanged: [{
          id: entityId,
          capabilities: entity.capabilities.map(c => c.type === 'transform' ? {
            ...c,
            position: { ...pos, y: targetFloorY }
          } : c)
        }]
      }, `Poser ${entity.name || entity.id} au sol`, {});
      playAudioFx('soft_drop');
      return;
    }

    const surfaceInfo = getSupportingSurfaceHeight(pos.x, pos.z, allEntities, entityId);
    const targetY = surfaceInfo.isGround ? 0 : Number((surfaceInfo.surfaceY + 0.028).toFixed(3));
    get().applyPatch({
      entitiesChanged: [{
        id: entityId,
        capabilities: entity.capabilities.map(c => c.type === 'transform' ? {
          ...c,
          position: { ...pos, y: targetY }
        } : c)
      }]
    }, surfaceInfo.isGround 
      ? `Reposer ${entity.name || entity.id} au sol` 
      : `Poser ${entity.name || entity.id} sur ${surfaceInfo.surfaceName}`, {});
    playAudioFx(surfaceInfo.isGround ? 'soft_drop' : 'tink');
  },

  moveEntity: (entityId: string, dx: number, dy: number, dz: number) => {
    const entity = get().world.ir.entities[entityId];
    if (!entity) return;
    if (isStaticOrStructuralEntity(entity)) {
      set(s => ({ warnings: [...s.warnings, `🔒 L'objet « ${entity.name || entityId} » est un élément ancré (statique / non déplaçable).`] }));
      playAudioFx('tink');
      return;
    }
    const transform = entity.capabilities.find(c => c.type === 'transform');
    const pos = toVec3Obj(transform?.position, { x: 0, y: 0, z: 0 });
    const allEntities = get().world.ir.entities;

    const nextX = Number((pos.x + dx).toFixed(3));
    const nextZ = Number((pos.z + dz).toFixed(3));
    let nextY = Number((pos.y + dy).toFixed(3));

    if (isFloorFurniture(entity)) {
      nextY = getFloorFurnitureTargetY(entity, allEntities);
    } else if (dy === 0) {
      const surfaceInfo = getSupportingSurfaceHeight(nextX, nextZ, allEntities, entityId);
      if (!surfaceInfo.isGround && surfaceInfo.supportEntity) {
        nextY = Number((surfaceInfo.surfaceY + 0.015).toFixed(3));
      } else if (pos.y > 0 && pos.y < 0.2) {
        nextY = 0;
      }
    }

    get().applyPatch({
      entitiesChanged: [{
        id: entityId,
        capabilities: entity.capabilities.map(c => c.type === 'transform' ? {
          ...c,
          position: { x: nextX, y: Math.max(0, nextY), z: nextZ }
        } : c)
      }]
    }, `Déplacer ${entity.name || entityId}`, {});
    playAudioFx('soft_drop');
  },

  startPlacementMode: (entityId: string) => {
    const entity = get().world.ir.entities[entityId];
    if (!entity) return;
    if (isStaticOrStructuralEntity(entity)) {
      set(s => ({ warnings: [...s.warnings, `🔒 L'objet « ${entity.name || entityId} » est un élément fixe (sol / mur / structure) et ne peut pas être déplacé.`] }));
      playAudioFx('tink');
      return;
    }
    set({
      placementModeEntityId: entityId,
      spatialContext: { ...get().spatialContext, selectedEntityId: entityId }
    });
    playAudioFx('switch_click');
    set(s => ({
      warnings: [...s.warnings, `🖐️ Mode Déplacement : Déplacez votre curseur et cliquez sur la table ou le sol pour poser « ${entity.name || entityId} ». (Échap pour annuler)`]
    }));
  },

  cancelPlacementMode: () => {
    if (!get().placementModeEntityId) return;
    set({ placementModeEntityId: null });
    playAudioFx('switch_click');
  },

  completePlacement: (x: number, _y: number, z: number) => {
    const id = get().placementModeEntityId;
    if (!id) return;
    const entity = get().world.ir.entities[id];
    if (!entity) {
      set({ placementModeEntityId: null });
      return;
    }

    const allEntities = get().world.ir.entities;
    if (isFloorFurniture(entity)) {
      const targetFloorY = getFloorFurnitureTargetY(entity, allEntities);
      get().applyPatch({
        entitiesChanged: [{
          id,
          capabilities: entity.capabilities.map(c => c.type === 'transform' ? {
            ...c,
            position: { x: Number(x.toFixed(3)), y: targetFloorY, z: Number(z.toFixed(3)) }
          } : c)
        }]
      }, `Poser ${entity.name || id} au sol`, {});
      set({ placementModeEntityId: null });
      playAudioFx('soft_drop');
      set(s => ({
        warnings: [...s.warnings, `📍 ${entity.name || id} posé au sol.`]
      }));
      return;
    }

    const surfaceInfo = getSupportingSurfaceHeight(x, z, allEntities, id);
    const finalY = surfaceInfo.isGround ? 0 : Number((surfaceInfo.surfaceY + 0.015).toFixed(3));

    get().applyPatch({
      entitiesChanged: [{
        id,
        capabilities: entity.capabilities.map(c => c.type === 'transform' ? {
          ...c,
          position: { x: Number(x.toFixed(3)), y: finalY, z: Number(z.toFixed(3)) }
        } : c)
      }]
    }, `Poser ${entity.name || id}`, {});
    set({ placementModeEntityId: null });
    playAudioFx(surfaceInfo.isGround ? 'soft_drop' : 'tink');
    set(s => ({
      warnings: [...s.warnings, `📍 ${entity.name || id} posé ${surfaceInfo.isGround ? 'au sol' : `sur ${surfaceInfo.surfaceName}`}.`]
    }));
  },

  focusEntity: (entityId: string) => {
    const entity = get().world.ir.entities[entityId];
    if (!entity) return;
    const transform = entity.capabilities.find(c => c.type === 'transform');
    const pos = toVec3Obj(transform?.position, { x: 0, y: 0, z: 0 });
    set({ cameraFocusTarget: [pos.x, pos.y + 0.3, pos.z] });
    playAudioFx('chime');
    setTimeout(() => {
      set({ cameraFocusTarget: null });
    }, 1500);
  },

  dispatch: (event) => {
    const currentState = get().world;
    const { newState, warnings, matchedRulesCount } = evaluateEvent(currentState, event);

    const hasQuestProgression = warnings.some(w => w.startsWith('🎉 Quête accomplie') || w.startsWith('✓ Étape validée'));
    const wasProductive = (matchedRulesCount > 0) || hasQuestProgression || (event.type === 'ANSWER_CORRECT');

    const isUserActionEvent = event.type === 'INTERACT' || event.type === 'DROP' || event.type === 'CLICK' || event.type === 'USE';
    if (isUserActionEvent && event.sourceId) {
      get().recordUserActionAttempt({
        sourceId: event.sourceId,
        targetId: event.targetId || null,
        actionType: event.type === 'DROP' ? 'drop' : 'click',
        wasProductive,
        context: event.type,
      });

      const srcName = currentState.ir.entities[event.sourceId]?.name || event.sourceId;
      const tgtName = event.targetId ? (currentState.ir.entities[event.targetId]?.name || event.targetId) : undefined;
      const actionIcon = event.type === 'DROP' ? '🎯' : event.type === 'CLICK' ? '👆' : '⚡';
      const actionMsg = tgtName ? `${srcName} ➔ ${tgtName}` : `${event.type === 'CLICK' ? 'Clic sur' : 'Action sur'} ${srcName}`;
      get().addLiveCausalEvent({
        type: 'action',
        icon: actionIcon,
        source: srcName,
        target: tgtName,
        message: actionMsg,
        badge: wasProductive ? 'Validé' : 'Neutre',
        productive: wasProductive
      });
    }

    if (matchedRulesCount > 0) {
      get().addLiveCausalEvent({
        type: 'rule',
        icon: '⚡',
        message: `${matchedRulesCount} règle(s) de cause à effet déclenchée(s)`,
        badge: 'Causalité',
        productive: true
      });
    }

    const now = Date.now();
    const lastTime = get().lastInteractionTime;
    if (lastTime > 0) {
      const deltaMs = now - lastTime;
      if (deltaMs >= 300 && deltaMs <= 20000) {
        get().observeMetaInteraction({ type: 'DECISION_LATENCY', data: { value: deltaMs, wasProductive } });
      }
    }
    set({ lastInteractionTime: now });
    
    if (event.type === 'ANSWER_CORRECT') {
      get().addLiveCausalEvent({
        type: 'quest',
        icon: '✅',
        message: 'Quiz : Réponse correcte validée !',
        badge: 'Quiz',
        productive: true
      });
      get().unlockAchievement('fle_quiz_ace');
      get().observeMetaInteraction({ type: 'TRANSFER_SUCCESS', data: { value: 1, context: 'quiz_correct' } });
    } else if (event.type === 'ANSWER_INCORRECT') {
      get().addLiveCausalEvent({
        type: 'safety',
        icon: '❌',
        message: 'Quiz : Réponse incorrecte',
        badge: 'Quiz',
        productive: false
      });
      get().observeMetaInteraction({ type: 'ERROR_TRAP_TRIGGERED', data: { value: 1, context: 'quiz_incorrect' } });
    }
    if (event.type === 'INTERACT' && (event.sourceId?.includes('screen') || event.sourceId?.includes('audio') || event.sourceId?.includes('camera') || event.sourceId?.includes('seminar') || event.sourceId?.includes('board'))) {
      get().unlockAchievement('audiovisual_pro');
    }

    if (matchedRulesCount === 0 && event.type === 'COLLISION') {
      const force = event.payload?.force || 0;
      if (force > 8) {
        set((state) => ({ warnings: [...state.warnings, `[LLM FALLBACK] Unexpected collision detected (Force: ${force.toFixed(1)}). The AI should generate a physical consequence now!`] }));
      }
    }

    if (event.type === 'COLLISION' && matchedRulesCount === 0 && warnings.length === 0) {
      return;
    }

    let invariantViolated: string | null = null;
    for (const inv of Object.values(newState.ir.invariants)) {
      if (inv.condition?.type === 'never_state') {
        const stateFlag = inv.condition.stateFlag || inv.condition.state;
        const requiredFlag = inv.condition.requiredFlag || inv.condition.without_flag || inv.condition.withoutFlag;
        if (stateFlag && newState.flags?.[stateFlag] && (!requiredFlag || !newState.flags?.[requiredFlag])) {
          invariantViolated = inv.description || inv.id || 'Invariant de sécurité violé';
          break;
        }
      }
    }

    if (invariantViolated) {
      get().addLiveCausalEvent({
        type: 'safety',
        icon: '🛡️',
        message: `Condition requise bloquée : ${invariantViolated}`,
        badge: 'Invariant',
        productive: false
      });
      get().observeMetaInteraction({ type: 'ERROR_TRAP_TRIGGERED', data: { value: 1, context: invariantViolated } });
      set((state) => ({ warnings: [...state.warnings, `🛡️ Condition requise : ${invariantViolated}`] }));
      return;
    }

    const questSuccess = warnings.find(w => w.startsWith('🎉 Quête accomplie') || w.startsWith('✓ Étape validée'));
    if (questSuccess) {
      get().addLiveCausalEvent({
        type: 'quest',
        icon: '🏆',
        message: questSuccess.replace(/^[🎉✓]\s*/, ''),
        badge: 'Mission',
        productive: true
      });
      get().observeMetaInteraction({ type: 'TRANSFER_SUCCESS', data: { value: 1, context: 'quest_step_completed' } });
    }

    set((state) => {
      const allWarnings = [...state.warnings, ...warnings];
      return { world: newState, warnings: allWarnings };
    });
  },

  addCustomRule: (rule: any) => {
    get().applyPatch(
      { rulesChanged: [rule] },
      `Règle Zero-Code créée : ${rule.id} (${rule.trigger})`,
      { intent: 'create_custom_rule', actions: [{ action: 'add_rule', ruleId: rule.id }] }
    );
  },

  saveWorldToStorage: () => {
    try {
      if (typeof window === 'undefined') return;
      const state = get();
      const payload = {
        world: state.world,
        atmosphere: state.currentAtmosphere,
        worldThemeId: state.currentWorldThemeId,
        gravity: state.currentGravity,
        currentSceneTitle: state.currentSceneTitle,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem('worldpilot_saved_world', JSON.stringify(payload));
      if (state.currentSceneTitle && state.currentSceneTitle !== 'Nouvelle scène') {
        localStorage.setItem(`worldpilot_exp_saved_${encodeURIComponent(state.currentSceneTitle)}`, JSON.stringify(payload));
      }
      set(s => ({ warnings: [...s.warnings, '💾 Monde actuel sauvegardé avec succès dans votre navigateur !'] }));
    } catch (e: any) {
      set(s => ({ warnings: [...s.warnings, `Erreur de sauvegarde : ${e.message}`] }));
    }
  },

  loadWorldFromStorage: (storageKey: string = 'worldpilot_saved_world') => {
    try {
      if (typeof window === 'undefined') return false;
      const raw = localStorage.getItem(storageKey);
      if (!raw) {
        set(s => ({ warnings: [...s.warnings, 'Aucun monde sauvegardé trouvé dans le stockage local.'] }));
        return false;
      }
      const data = JSON.parse(raw);
      if (data.world) {
        sanitizeRestoredWorld(data.world);
        const themeId = data.worldThemeId || data.atmosphere || 'earth-atelier';
        const theme = getWorldTheme(themeId);
        set({
          world: data.world,
          currentAtmosphere: theme.id,
          currentWorldThemeId: theme.id,
          currentGravity: data.gravity || theme.gravity,
          currentSceneTitle: data.currentSceneTitle || get().currentSceneTitle || 'Monde sauvegardé',
          warnings: ['📂 Monde restauré depuis votre sauvegarde locale.']
        });
        ambientAudio.setAtmosphere(theme.id);
        return true;
      }
      return false;
    } catch (e: any) {
      set(s => ({ warnings: [...s.warnings, `Erreur de chargement : ${e.message}`] }));
      return false;
    }
  },

  exportWorldJson: () => {
    try {
      if (typeof window === 'undefined') return;
      const state = get();
      const jsonStr = exportWorldToJson(state.world);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `worldpilot-scene-v${state.world.version}.json`;
      a.click();
      URL.revokeObjectURL(url);
      set(s => ({ warnings: [...s.warnings, '📦 Fichier .worldpilot.json exporté avec succès !'] }));
    } catch (e: any) {
      set(s => ({ warnings: [...s.warnings, `Erreur d’export JSON : ${e.message}`] }));
    }
  },

  importWorldJson: (jsonStr: string) => {
    try {
      const data = JSON.parse(jsonStr);
      const targetWorld = data.world || (data.ir ? data : null);
      if (!targetWorld || !targetWorld.ir) {
        set(s => ({ warnings: [...s.warnings, 'Format JSON invalide pour une scène WorldPilot.'] }));
        return false;
      }
      sanitizeRestoredWorld(targetWorld);
      const themeId = data.worldThemeId || data.atmosphere || 'earth-atelier';
      const theme = getWorldTheme(themeId);
      set({
        world: targetWorld,
        currentAtmosphere: theme.id,
        currentWorldThemeId: theme.id,
        currentGravity: data.gravity || theme.gravity,
        warnings: ['✨ Scène 3D importée avec succès depuis le fichier JSON !']
      });
      ambientAudio.setAtmosphere(theme.id);
      return true;
    } catch (e: any) {
      set(s => ({ warnings: [...s.warnings, `Erreur lors de l’import JSON : ${e.message}`] }));
      return false;
    }
  },

  exportWorldYaml: () => {
    try {
      if (typeof window === 'undefined') return;
      downloadWorldFile(get().world, 'yaml', get().currentSceneTitle.toLowerCase().replace(/\s+/g, '_'));
      set(s => ({ warnings: [...s.warnings, '📦 Fichier .world.yaml exporté avec succès !'] }));
    } catch (e: any) {
      set(s => ({ warnings: [...s.warnings, `Erreur d’export YAML : ${e.message}`] }));
    }
  },

  importWorldYaml: (yamlStr: string) => {
    try {
      const rawData = parseYaml(yamlStr);
      const parsedIR = parseWorldFromYaml(yamlStr);
      const targetWorld = rawData.world || (rawData.ir ? rawData : { version: 1, ir: parsedIR, flags: {} });
      sanitizeRestoredWorld(targetWorld);
      const themeId = rawData.worldThemeId || rawData.atmosphere || 'earth-atelier';
      const theme = getWorldTheme(themeId);
      set({
        world: targetWorld,
        currentAtmosphere: theme.id,
        currentWorldThemeId: theme.id,
        currentGravity: rawData.gravity || theme.gravity,
        warnings: ['✨ Scène 3D importée avec succès depuis le fichier YAML !']
      });
      ambientAudio.setAtmosphere(theme.id);
      return true;
    } catch (e: any) {
      set(s => ({ warnings: [...s.warnings, `Erreur lors de l’import YAML : ${e.message}`] }));
      return false;
    }
  },

  triggerCaptureScreenshot: () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('worldpilot_capture_screenshot'));
    }
  },

  triggerExportGLB: (entityId?: string, entityName?: string) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('worldpilot_export_glb', { detail: { entityId, entityName } }));
    }
  },

  triggerExportUSDZ: () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('worldpilot_export_usdz'));
    }
  },

  startQuest: (questId: string) => {
    set(state => {
      const newWorld = JSON.parse(JSON.stringify(state.world));
      if (newWorld.ir.quests?.[questId]) {
        newWorld.ir.activeQuestId = questId;
        newWorld.ir.quests[questId].status = 'in_progress';
      }
      return { world: newWorld };
    });
  },

  resetQuest: (questId?: string) => {
    set(state => {
      const newWorld = JSON.parse(JSON.stringify(state.world));
      const targetId = questId || newWorld.ir.activeQuestId;
      if (targetId && newWorld.ir.quests?.[targetId]) {
        const quest = newWorld.ir.quests[targetId];
        quest.currentStepIndex = 0;
        quest.status = 'in_progress';
        quest.steps.forEach((s: any) => s.completed = false);
      }
      return { world: newWorld, warnings: [...state.warnings, '🔄 Quête réinitialisée à la première étape.'] };
    });
  },

  stopActiveQuest: () => {
    set(state => {
      const newWorld = JSON.parse(JSON.stringify(state.world));
      const prevQuestId = newWorld.ir.activeQuestId;
      newWorld.ir.activeQuestId = null;
      if (prevQuestId && newWorld.ir.quests?.[prevQuestId]) {
        newWorld.ir.quests[prevQuestId].status = 'idle';
      }
      return {
        world: newWorld,
        warnings: [...state.warnings, '⏹️ Mission arrêtée. Vous êtes en mode libre.']
      };
    });
  },

  advanceActiveQuestStep: (questId?: string) => {
    set(state => {
      const newWorld = JSON.parse(JSON.stringify(state.world));
      const targetId = questId || newWorld.ir.activeQuestId || (newWorld.ir.quests ? Object.keys(newWorld.ir.quests)[0] : null);
      if (!targetId || !newWorld.ir.quests?.[targetId]) return {};
      const quest = newWorld.ir.quests[targetId];
      if (quest.status === 'completed' || !Array.isArray(quest.steps) || quest.steps.length === 0) return {};

      const curIdx = Math.min(quest.currentStepIndex ?? 0, quest.steps.length - 1);
      const curStep = quest.steps[curIdx];
      if (curStep) {
        curStep.completed = true;
        if (!newWorld.ir.flags) newWorld.ir.flags = {};
        const stepFlagKey = curStep.id.startsWith('step_') ? `${curStep.id}_completed` : `step_${curStep.id}_completed`;
        newWorld.ir.flags[stepFlagKey] = true;
        if (stepFlagKey !== `step_${curStep.id}_completed`) {
          newWorld.ir.flags[`step_${curStep.id}_completed`] = true;
        }
      }

      const nextUnfinished = quest.steps.findIndex((s: any) => !s.completed);
      quest.currentStepIndex = nextUnfinished === -1 ? quest.steps.length : nextUnfinished;

      let sound = 'ping';
      let message = '';
      if (nextUnfinished === -1 || quest.currentStepIndex >= quest.steps.length) {
        quest.status = 'completed';
        if (!newWorld.ir.flags) newWorld.ir.flags = {};
        newWorld.ir.flags[`quest_${quest.id}_completed`] = true;
        sound = quest.rewardSound || 'fanfare';
        message = `🎉 Quête accomplie : ${quest.title} !`;
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('worldpilot_quest_completed', { detail: { quest } }));
        }
      } else {
        const totalDone = quest.steps.filter((s: any) => s.completed).length;
        message = `✓ Étape validée (${totalDone}/${quest.steps.length}) : ${curStep?.title || 'Étape franchie'}`;
      }

      playAudioFx(sound as any);
      return {
        world: newWorld,
        warnings: [...state.warnings, message]
      };
    });
  },

  setActiveQuestId: (questId: string | null) => {
    set(state => {
      const newWorld = JSON.parse(JSON.stringify(state.world));
      newWorld.ir.activeQuestId = questId;
      return { world: newWorld };
    });
  },

  synthesizeQuestForCurrentScene: () => {
    const s = get();
    const entities = s.world.ir.entities;
    const entList = Object.values(entities);
    if (entList.length === 0) return null;

    let questTitle = 'Mission d\'Exploration & Interaction';
    let questDesc = 'Explorez les éléments de la scène et découvrez leurs affordances interactives.';
    let stepTitle = 'Interagir avec un objet';
    let stepDesc = 'Cliquez ou manipulez un objet pour observer ses effets causaux.';
    let targetId = entList[0].id;
    let requiredEvent = `CLICK:${targetId}`;

    const hasPuzzle = entList.some(e => e.id.includes('puzzle') || (e.name || '').toLowerCase().includes('tuile') || (e.name || '').toLowerCase().includes('puzzle') || (e.name || '').toLowerCase().includes('taquin'));
    const hasTargets = entList.some(e => e.id.includes('target') || (e.name || '').toLowerCase().includes('cible'));
    const hasCooking = entList.some(e => e.id.includes('cocotte') || (e.name || '').toLowerCase().includes('cuisson') || (e.name || '').toLowerCase().includes('recette'));
    const hasAuto = entList.some(e => e.id.includes('voiture') || e.id.includes('batterie') || (e.name || '').toLowerCase().includes('voiture'));

    if (hasPuzzle) {
      questTitle = '🧩 Résolution du Taquin 3D';
      questDesc = 'Faites coulisser les tuiles adjacentes à la case vide pour reconstituer la grille numérotée dans l\'ordre.';
      stepTitle = 'Déplacer une première tuile';
      stepDesc = 'Cliquez sur une tuile voisine de la case vide pour amorcer la résolution.';
      const tile = entList.find(e => e.id.includes('puzzle_tile_')) || entList[0];
      targetId = tile.id;
      requiredEvent = `CLICK:${targetId}`;
    } else if (hasTargets) {
      questTitle = '🎯 Entraînement au Stand de Tir';
      questDesc = 'Abattez les cibles mouvantes en cadence pour marquer le maximum de points.';
      stepTitle = 'Toucher la première cible';
      stepDesc = 'Pointez et tirez sur une cible pour l\'abattre.';
      const tgt = entList.find(e => e.id.includes('target_')) || entList[0];
      targetId = tgt.id;
      requiredEvent = `CLICK:${targetId}`;
    } else if (hasCooking) {
      questTitle = '🍳 Préparation Gastronomique';
      questDesc = 'Ajoutez les assaisonnements et surveillez la cuisson dans la cocotte.';
      stepTitle = 'Vérifier la cocotte';
      stepDesc = 'Ajustez le feu ou déposez un ingrédient dans la cocotte.';
      const cocotte = entList.find(e => (e.name || '').toLowerCase().includes('cocotte')) || entList[0];
      targetId = cocotte.id;
      requiredEvent = `CLICK:${targetId}`;
    } else if (hasAuto) {
      questTitle = '🔧 Diagnostic & Réparation Automobile';
      questDesc = 'Inspectez la batterie 12V puis procédez au remplacement dans le compartiment moteur.';
      stepTitle = 'Inspecter la batterie';
      stepDesc = 'Vérifiez les bornes de la batterie avant toute manipulation.';
      const batt = entList.find(e => (e.name || '').toLowerCase().includes('batterie')) || entList[0];
      targetId = batt.id;
      requiredEvent = `CLICK:${targetId}`;
    }

    const questId = `quest_synth_${Date.now()}`;
    const newQuest: QuestSpec = {
      id: questId,
      title: questTitle,
      description: questDesc,
      currentStepIndex: 0,
      status: 'in_progress',
      steps: [
        {
          id: `step_${targetId}`,
          title: stepTitle,
          description: stepDesc,
          targetEntityId: targetId,
          requiredEvent,
          completed: false
        }
      ]
    };

    s.applyPatch({
      questsAdded: [newQuest],
      activeQuestId: questId
    }, `Ajout de la quête : ${questTitle}`, { intent: 'add_synthesized_quest' });

    playAudioFx('chime');
    speakAgentDialogue(`Objectif activé : ${questTitle}. ${stepDesc}`);
    set(state => ({
      warnings: [...state.warnings, `🎯 Quête activée : ${questTitle} !`]
    }));
    return newQuest;
  },

  tickGameplayTimer: () => {
    const gameplay = get().world.gameplay;
    if (!gameplay || !gameplay.isTimerActive || gameplay.timer === null || gameplay.timer <= 0) return;
    
    const nextTimer = gameplay.timer - 1;
    set(state => {
      const newWorld = JSON.parse(JSON.stringify(state.world));
      if (newWorld.gameplay) {
        newWorld.gameplay.timer = nextTimer;
        if (nextTimer <= 0) {
          newWorld.gameplay.isTimerActive = false;
        }
      }
      return { world: newWorld };
    });

    if (nextTimer <= 0) {
      get().dispatch({ type: 'TIMER_EXPIRED', sourceId: 'system' });
    }
  },

  resetGameplay: () => {
    set(state => {
      const newWorld = JSON.parse(JSON.stringify(state.world));
      newWorld.gameplay = { ...defaultGameplayState };
      return { world: newWorld, warnings: [...state.warnings, '🎮 Boucle de jeu réinitialisée.'] };
    });
  },

  saveCurrentSpatialLayout: (name: string, description?: string) => {
    const ir = get().world.ir;
    const snapshots = Object.values(ir.entities).map(ent => {
      const transform = ent.capabilities.find(c => c.type === 'transform');
      return {
        entityId: ent.id,
        position: transform?.position ? toVec3Obj(transform.position, { x: 0, y: 0, z: 0 }) : { x: 0, y: 0, z: 0 },
        rotation: transform?.rotation ? toVec3Obj(transform.rotation, { x: 0, y: 0, z: 0 }) : undefined,
        scale: transform?.scale ? toVec3Obj(transform.scale, { x: 1, y: 1, z: 1 }) : undefined,
        state: ent.state,
        relations: ent.relations ? JSON.parse(JSON.stringify(ent.relations)) : undefined,
      };
    });

    const layout: SavedSpatialLayout = {
      id: `layout_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim() || `Disposition du ${new Date().toLocaleDateString('fr-FR')}`,
      description: description || `${snapshots.length} objet(s) disposé(s)`,
      createdAt: Date.now(),
      entitySnapshots: snapshots,
      activeQuestId: ir.activeQuestId || null
    };

    set(state => {
      const updated = [layout, ...state.savedSpatialLayouts];
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('worldpilot_saved_layouts', JSON.stringify(updated));
        }
      } catch (_) {}
      return {
        savedSpatialLayouts: updated,
        warnings: [...state.warnings, `💾 Disposition "${layout.name}" enregistrée avec succès !`]
      };
    });

    get().addLiveCausalEvent({
      type: 'action',
      icon: '💾',
      message: `Disposition "${layout.name}" sauvegardée (${snapshots.length} objets)`,
      badge: 'Disposition',
      productive: true
    });
    playAudioFx('chime');
    return layout.id;
  },

  loadSpatialLayout: (layoutId: string) => {
    const layout = get().savedSpatialLayouts.find(l => l.id === layoutId);
    if (!layout) return false;

    set(state => {
      const prevSnapshot = {
        ir: JSON.parse(JSON.stringify(state.world.ir)),
        flags: JSON.parse(JSON.stringify(state.world.flags || {})),
        gameplay: state.world.gameplay ? JSON.parse(JSON.stringify(state.world.gameplay)) : undefined,
        title: state.currentSceneTitle,
        instruction: `Restaurer disposition ${layout.name}`
      };
      const nextUndoStack = [...state.undoStack.slice(-29), prevSnapshot];
      const newWorld = JSON.parse(JSON.stringify(state.world));
      layout.entitySnapshots.forEach(snap => {
        const ent = newWorld.ir.entities[snap.entityId];
        if (ent) {
          const tr = ent.capabilities.find((c: any) => c.type === 'transform');
          if (tr) {
            tr.position = toVec3Obj(snap.position, { x: 0, y: 0, z: 0 });
            if (snap.rotation) tr.rotation = toVec3Obj(snap.rotation, { x: 0, y: 0, z: 0 });
            if (snap.scale) tr.scale = toVec3Obj(snap.scale, { x: 1, y: 1, z: 1 });
          }
          if (snap.state) ent.state = snap.state;
          if (snap.relations) ent.relations = JSON.parse(JSON.stringify(snap.relations));
        }
      });
      if (layout.activeQuestId) {
        newWorld.ir.activeQuestId = layout.activeQuestId;
      }
      newWorld.version = (newWorld.version || 1) + 1;
      return {
        world: newWorld,
        undoStack: nextUndoStack,
        redoStack: [],
        canUndo: true,
        canRedo: false,
        physicsEpoch: state.physicsEpoch + 1,
        warnings: [...state.warnings, `📂 Disposition "${layout.name}" restaurée !`]
      };
    });

    get().addLiveCausalEvent({
      type: 'action',
      icon: '📂',
      message: `Disposition "${layout.name}" restaurée avec succès`,
      badge: 'Disposition',
      productive: true
    });
    playAudioFx('chime');
    return true;
  },

  deleteSpatialLayout: (layoutId: string) => {
    set(state => {
      const updated = state.savedSpatialLayouts.filter(l => l.id !== layoutId);
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('worldpilot_saved_layouts', JSON.stringify(updated));
        }
      } catch (_) {}
      return {
        savedSpatialLayouts: updated,
        warnings: [...state.warnings, '🗑️ Disposition supprimée']
      };
    });
    playAudioFx('switch_click');
  },

  toggleEntityState: (entityId: string, targetState?: string) => {
    get().dispatch({
      type: 'INTERACT',
      sourceId: entityId,
      targetId: entityId,
      payload: { targetState }
    });
  },

  testEntityCapacity: (containerId: string, itemId: string) => {
    const container = get().world.ir.entities[containerId];
    const item = get().world.ir.entities[itemId];
    if (!container || !item) {
      return { fits: false, message: 'Objet ou contenant introuvable dans la scène 3D.' };
    }

    const fitsDims = (dims: number[], max: number[]) => {
      const sI = [...dims].sort((a, b) => a - b);
      const sM = [...max].sort((a, b) => a - b);
      return sI[0] <= sM[0] && sI[1] <= sM[1] && sI[2] <= sM[2];
    };

    const itemDims = item.physicalProperties?.dimensions || [0.355, 0.019, 0.245];
    const compatRel =
      item.relations?.find(r => r.type === 'compatible_with' && r.targetId === containerId) ||
      container.relations?.find(r => r.type === 'compatible_with' && r.targetId === itemId);
    const part =
      (compatRel?.metadata?.targetPart
        ? container.parts?.find(p => p.id === compatRel.metadata!.targetPart)
        : undefined) ||
      container.parts?.find(
        p => p.fitsMaxDimensions && fitsDims(itemDims, p.fitsMaxDimensions)
      );

    const maxDims = part?.fitsMaxDimensions || container.physicalProperties?.fitsMaxDimensions || [0.38, 0.03, 0.28];
    const fits =
      Boolean(compatRel) ||
      Boolean(part) ||
      fitsDims(itemDims, maxDims);

    if (fits) {
      const existingRelations = item.relations || [];
      const updatedRelations = [
        ...existingRelations.filter(r => !(r.type === 'inside' && r.targetId === containerId)),
        { type: 'inside' as const, targetId: containerId, metadata: { partId: part?.id || 'part_laptop_sleeve' } }
      ];

      get().applyPatch({
        entitiesChanged: [{
          id: itemId,
          relations: updatedRelations
        }]
      }, `Loger ${item.name} dans ${container.name}`, {});
    }

    get().dispatch({
      type: 'DROP',
      sourceId: itemId,
      targetId: containerId,
      payload: { fits, itemDims, maxDims, partId: part?.id }
    });

    return {
      fits,
      partId: part?.id,
      message: fits
        ? `✅ Succès : ${item.name} rentre parfaitement dans ${container.name}${part ? ` (${part.name})` : ''}.`
        : `⚠️ Incompatible : ${item.name} dépasse le gabarit maximal admissible de ${container.name}.`
    };
  },

  findCompatibleItemsFor: (entityId: string) => {
    const target = get().world.ir.entities[entityId];
    if (!target) return [];
    const all = Object.values(get().world.ir.entities);
    
    const fitsDims = (dims: number[], max: number[]) => {
      const sI = [...dims].sort((a, b) => a - b);
      const sM = [...max].sort((a, b) => a - b);
      return sI[0] <= sM[0] && sI[1] <= sM[1] && sI[2] <= sM[2];
    };

    return all.filter(e => {
      if (e.id === entityId) return false;
      if (e.relations?.some(r => r.type === 'compatible_with' && r.targetId === entityId)) return true;
      if (target.relations?.some(r => r.type === 'compatible_with' && r.targetId === e.id)) return true;
      if (e.physicalProperties?.dimensions) {
        const itemDims = e.physicalProperties.dimensions;
        if (target.physicalProperties?.fitsMaxDimensions) {
          const maxDims = target.physicalProperties.fitsMaxDimensions;
          if (fitsDims(itemDims, maxDims)) {
            return true;
          }
        }
        if (
          target.parts?.some(
            p => p.fitsMaxDimensions && fitsDims(itemDims, p.fitsMaxDimensions)
          )
        ) {
          return true;
        }
      }
      const targetCategory = (target.physicalProperties?.material || target.name).toLowerCase();
      const eCategory = (e.physicalProperties?.material || e.name).toLowerCase();
      if ((targetCategory.includes('ordinateur') || targetCategory.includes('laptop')) && (eCategory.includes('sac') || eCategory.includes('housse'))) return true;
      if ((targetCategory.includes('sac') || targetCategory.includes('valise')) && (eCategory.includes('ordinateur') || eCategory.includes('laptop') || eCategory.includes('gourde') || eCategory.includes('cadenas') || eCategory.includes('passeport'))) return true;
      return false;
    });
  },

  importEntityFromUrl: async (url: string, customName?: string) => {
    const cleanUrl = url.trim();
    if (!cleanUrl) {
      return { success: false, message: 'URL invalide ou vide.' };
    }

    const idSuffix = Math.random().toString(36).substring(2, 6);
    let entity: EntitySpec;

    // 1. Détection modèle 3D direct (.glb / .gltf)
    if (/\.(glb|gltf)($|\?)/i.test(cleanUrl)) {
      const filename = cleanUrl.split('/').pop()?.split('?')[0].replace(/\.(glb|gltf)$/i, '') || 'model_3d';
      const name = customName?.trim() || filename.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      const entityId = `ext_${filename.toLowerCase().replace(/[^a-z0-9_]/g, '_')}_${idSuffix}`;

      entity = {
        id: entityId,
        name,
        capabilities: [
          {
            type: 'transform',
            position: { x: 0, y: 0.85, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 }
          },
          { type: 'collider' },
          { type: 'draggable' }
        ],
        visuals: {
          modelUrl: cleanUrl,
          shape: 'box',
          color: '#6366f1'
        },
        fallback2D: {
          description: `Modèle 3D importé depuis l'URL : ${cleanUrl}`,
          specificationSheetUrl: cleanUrl
        }
      };
    }
    // 2. Détection manifeste sémantique JSON-LD / W3C WoT (.json / .jsonld)
    else if (/\.(jsonld|json)($|\?)/i.test(cleanUrl)) {
      try {
        const res = await fetch(cleanUrl);
        const data = await res.json();
        const entityId = `ext_wot_${idSuffix}`;
        const name = customName?.trim() || data.name || data.title || 'Entité Sémantique WoT';

        const dimensions = (data.width?.value && data.height?.value && data.depth?.value)
          ? [data.width.value, data.height.value, data.depth.value] as [number, number, number]
          : undefined;

        entity = {
          id: entityId,
          name,
          capabilities: [
            {
              type: 'transform',
              position: { x: 0, y: 0.85, z: 0 },
              scale: { x: 1, y: 1, z: 1 }
            },
            { type: 'collider' },
            { type: 'draggable' }
          ],
          visuals: {
            modelUrl: data['wp:spatialRepresentation']?.modelUrl,
            shape: 'box',
            color: '#38bdf8'
          },
          physicalProperties: {
            dimensions,
            weightKg: data.weight?.value,
            sku: data.sku,
            material: data.material
          },
          parts: Array.isArray(data.hasPart) ? data.hasPart.map((p: any, idx: number) => ({
            id: p.identifier || `part_${idx}`,
            name: p.name || `Composant ${idx + 1}`,
            description: p.description,
            capacityLiters: p.capacityLiters,
            fitsMaxDimensions: p.fitsMaxDimensions
          })) : undefined,
          resources: Array.isArray(data.relatedLink) ? data.relatedLink.map((r: any) => ({
            role: r.role || 'details',
            url: r.url,
            label: r.name || r.role
          })) : undefined,
          fallback2D: {
            description: data.description || `Entité W3C WoT importée depuis ${cleanUrl}`,
            thumbnailUrl: data.image
          }
        };
      } catch (_) {
        const entityId = `ext_json_${idSuffix}`;
        entity = {
          id: entityId,
          name: customName?.trim() || 'Objet Sémantique Web',
          capabilities: [
            { type: 'transform', position: { x: 0, y: 0.85, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
            { type: 'collider' },
            { type: 'draggable' },
            { type: 'web_screen', url: cleanUrl }
          ],
          visuals: { shape: 'box', color: '#a855f7' },
          fallback2D: { description: `Ressource distante : ${cleanUrl}` }
        };
      }
    }
    // 3. Page Web e-commerce / Fiche produit distante
    else {
      let hostname = 'web';
      try {
        hostname = new URL(cleanUrl).hostname.replace('www.', '');
      } catch (_) {}
      const name = customName?.trim() || `Produit (${hostname})`;
      const entityId = `ext_web_${idSuffix}`;

      entity = {
        id: entityId,
        name,
        capabilities: [
          {
            type: 'transform',
            position: { x: 0, y: 0.85, z: 0 },
            scale: { x: 1, y: 1, z: 1 }
          },
          { type: 'collider' },
          { type: 'draggable' },
          { type: 'web_screen', url: cleanUrl }
        ],
        visuals: {
          assetId: 'web-screen',
          shape: 'box',
          color: '#0284c7'
        },
        resources: [
          { role: 'details', url: cleanUrl, label: `Consulter sur ${hostname}` },
          { role: 'buy', url: cleanUrl, label: 'Page d\'achat officielle' }
        ],
        fallback2D: {
          description: `Objet connecté à la page web : ${cleanUrl}`,
          specificationSheetUrl: cleanUrl
        }
      };
    }

    get().applyPatch({
      entitiesCreated: [entity]
    }, `Importer objet depuis l'URL : ${cleanUrl}`, {
      intent: 'import_entity_from_url',
      actions: [{ action: 'create_entity', target: entity.id, url: cleanUrl }]
    });

    get().addLiveCausalEvent({
      type: 'action',
      icon: '🌐',
      message: `Objet « ${entity.name} » importé avec succès depuis l'URL`,
      badge: 'Import URL',
      productive: true
    });

    playAudioFx('fanfare');
    return { success: true, entityId: entity.id, message: `« ${entity.name} » a été ajouté à la scène 3D.` };
  },

  replaceEntityPreservingTransform: (targetEntityId: string, newEntitySpecOrAssetId: string | Partial<EntitySpec>) => {
    const existing = get().world.ir.entities[targetEntityId];
    if (!existing) return false;

    const sourceTransform = existing.capabilities.find(c => c.type === 'transform');
    let newEntity: EntitySpec;

    if (typeof newEntitySpecOrAssetId === 'string') {
      const assetId = newEntitySpecOrAssetId;
      newEntity = {
        id: `${assetId}_${Date.now().toString(36).slice(-4)}`,
        name: assetId.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        capabilities: [
          {
            type: 'transform',
            position: sourceTransform?.position ? toVec3Obj(sourceTransform.position, { x: 0, y: 0.85, z: 0 }) : { x: 0, y: 0.85, z: 0 },
            rotation: sourceTransform?.rotation ? toVec3Obj(sourceTransform.rotation, { x: 0, y: 0, z: 0 }) : undefined,
            scale: sourceTransform?.scale ? toVec3Obj(sourceTransform.scale, { x: 1, y: 1, z: 1 }) : undefined
          },
          { type: 'collider' },
          { type: 'draggable' }
        ],
        visuals: { assetId },
        relations: existing.relations ? JSON.parse(JSON.stringify(existing.relations)) : undefined
      };
    } else {
      const patch = newEntitySpecOrAssetId;
      newEntity = {
        id: patch.id || `${targetEntityId}_rep_${Date.now().toString(36).slice(-4)}`,
        name: patch.name || `Remplacement de ${existing.name}`,
        capabilities: [
          {
            type: 'transform',
            position: sourceTransform?.position ? toVec3Obj(sourceTransform.position, { x: 0, y: 0.85, z: 0 }) : { x: 0, y: 0.85, z: 0 },
            rotation: sourceTransform?.rotation ? toVec3Obj(sourceTransform.rotation, { x: 0, y: 0, z: 0 }) : undefined,
            scale: sourceTransform?.scale ? toVec3Obj(sourceTransform.scale, { x: 1, y: 1, z: 1 }) : undefined
          },
          ...(patch.capabilities?.filter(c => c.type !== 'transform') || [{ type: 'collider' }, { type: 'draggable' }])
        ],
        visuals: patch.visuals || existing.visuals,
        physicalProperties: patch.physicalProperties,
        parts: patch.parts,
        resources: patch.resources,
        fallback2D: patch.fallback2D,
        relations: existing.relations ? JSON.parse(JSON.stringify(existing.relations)) : undefined
      };
    }

    get().applyPatch({
      entitiesRemoved: [targetEntityId],
      entitiesCreated: [newEntity]
    }, `Remplacer ${existing.name} par ${newEntity.name} (position conservée)`, {
      intent: 'replace_entity_preserving_transform',
      actions: [
        { action: 'remove_entity', target: targetEntityId },
        { action: 'create_entity', target: newEntity.id }
      ]
    });

    if (get().spatialContext.selectedEntityId === targetEntityId) {
      get().setSpatialContext(newEntity.id, get().spatialContext.pointedEntityId === targetEntityId ? newEntity.id : get().spatialContext.pointedEntityId);
    }

    get().addLiveCausalEvent({
      type: 'action',
      icon: '🔄',
      message: `Remplacement de « ${existing.name} » par « ${newEntity.name} » à la même position`,
      badge: 'Substitution',
      productive: true
    });

    playAudioFx('chime');
    return true;
  }
});
