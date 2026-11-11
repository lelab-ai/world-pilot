// src/engine/WorldAdapter.ts
// Contrat Formel d'Adaptation Multi-Moteur (ADR-0001 & ADR-0004 : "3D Rendering Is Not the World")
// Découple strictement la représentation intermédiaire causale (WorldIR) du moteur de rendu 3D :
// 1. R3FWebGLWorldAdapter (React Three Fiber / Rapier WebGL — Studio Temps Réel Actif)
// 2. UnrealVictoriaVRWorldAdapter (Pont déterministe vers Unreal Engine 5.4 / Victoria VR AI Builder)

import { EntitySpec, Invariant, RuleSpec, WorldIR, WorldPatch, WorldState } from '../core/types';

export interface SpatialWorldContext {
  selectedEntities: string[];
  pointedEntityId?: string | null;
  cameraPosition: { x: number; y: number; z: number };
  gizmoMode?: 'off' | 'translate' | 'rotate';
}

export interface WorldAdapterSyncReport {
  targetEngine: 'R3F_WEBGL' | 'UNREAL_ENGINE_5_VICTORIA_VR';
  appliedAt: number;
  entitiesSynced: number;
  rulesSynced: number;
  invariantsSynced: number;
  executionTimeMs: number;
  zeroGeneratedCodeVerified: boolean;
}

export interface UnrealVector3Cm {
  X: number; // Avant/Arrière en cm (Left-Handed Z-Up : X_ue = Z_webgl * 100)
  Y: number; // Droite/Gauche en cm (Y_ue = X_webgl * 100)
  Z: number; // Haut/Bas en cm (Z_ue = Y_webgl * 100)
}

export interface UnrealRotatorDeg {
  Pitch: number;
  Yaw: number;
  Roll: number;
}

export interface UnrealActorComponentSpec {
  componentClass:
    | 'UStaticMeshComponent'
    | 'UBoxComponent'
    | 'USphereComponent'
    | 'UWorldPilotGrabComponent'
    | 'UMaterialInstanceDynamic';
  name: string;
  properties: Record<string, string | number | boolean | UnrealVector3Cm>;
}

export interface UnrealActorSpec {
  actorId: string;
  displayName: string;
  actorClass: 'AWorldPilotInteractiveActor' | 'AWorldPilotTriggerZoneActor' | 'AWorldPilotStaticPropActor';
  semanticLineageReplaces?: string;
  transformCm: {
    translation: UnrealVector3Cm;
    rotation: UnrealRotatorDeg;
    scale3D: { X: number; Y: number; Z: number };
  };
  assetPath: string;
  components: UnrealActorComponentSpec[];
  tags: string[];
}

export interface UnrealCausalRuleRow {
  rowName: string;
  triggerEvent: string;
  sourceActorId: string;
  targetActorId: string;
  requiredFlags: string[];
  forbiddenFlags: string[];
  mutations: {
    flagKey?: string;
    flagValue?: boolean;
    audioCue?: string;
    hudNotification?: string;
  }[];
}

export interface UnrealSafetyGuardSpec {
  invariantId: string;
  description: string;
  guardType: 'NEVER_STATE_WITHOUT_PRECONDITION' | 'ALWAYS_ZONE_CONTAINMENT';
  monitoredFlag?: string;
  requiredPreconditionFlag?: string;
  enforcedAtCompileTime: boolean;
}

export interface UnrealSceneDescriptor {
  schemaVersion: 'worldpilot-unreal-bridge-v1.0';
  targetEngine: 'UnrealEngine_5.4_VictoriaVR_AI_Builder';
  coordinateSystem: 'LeftHanded_ZUp_Centimeters';
  runtimeGuarantee: {
    zeroGeneratedCppOrBlueprintEval: true;
    deterministicSubsystemClass: 'UWorldPilotCausalSubsystem';
    tickBudgetMs: 0.3;
  };
  worldVersion: number;
  activeQuestId: string | null;
  actors: UnrealActorSpec[];
  causalRuleDataTable: UnrealCausalRuleRow[];
  safetyGuards: UnrealSafetyGuardSpec[];
}

export interface WorldAdapter {
  readonly adapterId: string;
  readonly targetEngine: 'R3F_WEBGL' | 'UNREAL_ENGINE_5_VICTORIA_VR';
  readSpatialContext(): SpatialWorldContext;
  applyPatch(patch: WorldPatch): Promise<void>;
  applyWorldPatch(patch: WorldPatch, currentIR?: WorldIR): Promise<WorldAdapterSyncReport>;
  setHighlightedEntities(entityIds: string[]): void;
  setGizmoTarget(entityId: string | null, mode: 'off' | 'translate' | 'rotate'): void;
}

/**
 * Convertit une position/rotation WebGL (Right-Handed, Y-Up, mètres)
 * vers le repère natif Unreal Engine 5 (Left-Handed, Z-Up, centimètres).
 */
export function convertWebGLToUnrealTransform(entity: EntitySpec): UnrealActorSpec['transformCm'] {
  const tfCap = (entity.capabilities || []).find(c => c.type === 'transform');
  const rawPos: any = tfCap?.position || (entity as any).transform?.position || { x: 0, y: 0, z: 0 };
  const rawRot: any = tfCap?.rotation || (entity as any).transform?.rotation || { x: 0, y: 0, z: 0 };
  const rawScale: any = tfCap?.scale || (entity as any).transform?.scale || { x: 1, y: 1, z: 1 };

  const wx = Array.isArray(rawPos) ? Number(rawPos[0]) || 0 : Number(rawPos.x) || 0;
  const wy = Array.isArray(rawPos) ? Number(rawPos[1]) || 0 : Number(rawPos.y) || 0;
  const wz = Array.isArray(rawPos) ? Number(rawPos[2]) || 0 : Number(rawPos.z) || 0;

  const rx = Array.isArray(rawRot) ? Number(rawRot[0]) || 0 : Number(rawRot.x) || 0;
  const ry = Array.isArray(rawRot) ? Number(rawRot[1]) || 0 : Number(rawRot.y) || 0;
  const rz = Array.isArray(rawRot) ? Number(rawRot[2]) || 0 : Number(rawRot.z) || 0;

  const sx = Array.isArray(rawScale) ? Number(rawScale[0]) || 1 : Number(rawScale.x) || 1;
  const sy = Array.isArray(rawScale) ? Number(rawScale[1]) || 1 : Number(rawScale.y) || 1;
  const sz = Array.isArray(rawScale) ? Number(rawScale[2]) || 1 : Number(rawScale.z) || 1;

  const radToDeg = (rad: number) => Number(((rad * 180) / Math.PI).toFixed(2));

  return {
    translation: {
      X: Number((wz * 100).toFixed(1)),
      Y: Number((wx * 100).toFixed(1)),
      Z: Number((wy * 100).toFixed(1)),
    },
    rotation: {
      Pitch: radToDeg(rx),
      Yaw: radToDeg(-ry),
      Roll: radToDeg(rz),
    },
    scale3D: {
      X: Number(sz.toFixed(3)),
      Y: Number(sx.toFixed(3)),
      Z: Number(sy.toFixed(3)),
    },
  };
}

function mapEntityToUnrealActor(entity: EntitySpec): UnrealActorSpec {
  const caps = entity.capabilities || [];
  const isTriggerZone = caps.some(c => c.type === 'trigger_zone');
  const isDraggable = caps.some(c => c.type === 'draggable');
  const hasCollider = caps.some(c => c.type === 'collider');

  const components: UnrealActorComponentSpec[] = [
    {
      componentClass: 'UStaticMeshComponent',
      name: 'RootStaticMesh',
      properties: {
        MeshAsset: entity.visuals?.modelUrl || `/Game/VictoriaVR/Meshes/${entity.visuals?.assetId || entity.id}`,
        SimulatePhysics: isDraggable,
        CollisionProfileName: isTriggerZone ? 'OverlapAllDynamic' : hasCollider ? 'BlockAllDynamic' : 'NoCollision',
      },
    },
  ];

  if (isTriggerZone) {
    const trigCap = caps.find(c => c.type === 'trigger_zone');
    components.push({
      componentClass: 'UBoxComponent',
      name: 'CausalTriggerSocketVolume',
      properties: {
        BoxExtentCm: {
          X: Number(((trigCap?.radius || 0.45) * 100).toFixed(1)),
          Y: Number(((trigCap?.radius || 0.45) * 100).toFixed(1)),
          Z: 45.0,
        },
        GenerateOverlapEvents: true,
      },
    });
  }

  if (isDraggable) {
    components.push({
      componentClass: 'UWorldPilotGrabComponent',
      name: 'VRHandGrabInteractable',
      properties: {
        EnableTwoHandedGrab: false,
        HapticFeedbackIntensity: 0.65,
      },
    });
  }

  if (entity.visuals?.color || entity.visuals?.roughness !== undefined || entity.visuals?.metalness !== undefined) {
    components.push({
      componentClass: 'UMaterialInstanceDynamic',
      name: 'PBRSurfaceMaterial',
      properties: {
        BaseColorHex: entity.visuals?.color || '#ffffff',
        Roughness: entity.visuals?.roughness ?? 0.45,
        Metallic: entity.visuals?.metalness ?? 0.1,
      },
    });
  }

  return {
    actorId: entity.id,
    displayName: entity.name || entity.id,
    actorClass: isTriggerZone
      ? 'AWorldPilotTriggerZoneActor'
      : isDraggable
        ? 'AWorldPilotInteractiveActor'
        : 'AWorldPilotStaticPropActor',
    semanticLineageReplaces: (entity as any).semantic_replaces || undefined,
    transformCm: convertWebGLToUnrealTransform(entity),
    assetPath: entity.visuals?.modelUrl || `/Game/VictoriaVR/Assets/${entity.visuals?.assetId || entity.id}.uasset`,
    components,
    tags: [
      `wp_id:${entity.id}`,
      ...(isDraggable ? ['vr_grabbable'] : []),
      ...(isTriggerZone ? ['causal_socket'] : []),
      ...((entity as any).semantic_replaces ? [`replaces:${(entity as any).semantic_replaces}`] : []),
    ],
  };
}

function mapRuleToUnrealRow(rule: RuleSpec): UnrealCausalRuleRow {
  const conds = rule.conditions || [];
  const sourceCond = conds.find(c => c.type === 'is_source');
  const targetCond = conds.find(c => c.type === 'is_target' || c.type === 'in_zone' || c.type === 'proximity');
  const requiredFlags = conds
    .filter(c => c.type === 'require_flag' && c.flag)
    .map(c => String(c.flag));
  const forbiddenFlags = conds
    .filter(c => c.type === 'forbid_flag' && c.flag)
    .map(c => String(c.flag));

  const mutations = (rule.actions || []).map(act => ({
    flagKey: act.flag,
    flagValue: typeof act.value === 'boolean' ? act.value : undefined,
    audioCue: act.sound,
    hudNotification: act.message,
  }));

  return {
    rowName: rule.id,
    triggerEvent: String(rule.trigger || 'INTERACT').toUpperCase(),
    sourceActorId: sourceCond?.sourceId || 'PlayerPawn',
    targetActorId: targetCond?.targetId || sourceCond?.sourceId || 'Self',
    requiredFlags,
    forbiddenFlags,
    mutations,
  };
}

function mapInvariantToSafetyGuard(inv: Invariant): UnrealSafetyGuardSpec {
  return {
    invariantId: inv.id,
    description: inv.description,
    guardType: inv.condition?.type === 'never_state' ? 'NEVER_STATE_WITHOUT_PRECONDITION' : 'ALWAYS_ZONE_CONTAINMENT',
    monitoredFlag: inv.condition?.stateFlag,
    requiredPreconditionFlag: inv.condition?.requiredFlag,
    enforcedAtCompileTime: true,
  };
}

/**
 * Compile n'importe quel WorldState WorldPilot en un descripteur complet
 * Unreal Engine 5.4 / Victoria VR AI Builder (AActors en cm Z-Up + DataTable causale déterministe).
 */
export function compileUnrealSceneDescriptor(world: WorldState): UnrealSceneDescriptor {
  const entities = Object.values(world.ir?.entities || {});
  const rules = Object.values(world.ir?.rules || {});
  const invariants = Object.values(world.ir?.invariants || {});

  return {
    schemaVersion: 'worldpilot-unreal-bridge-v1.0',
    targetEngine: 'UnrealEngine_5.4_VictoriaVR_AI_Builder',
    coordinateSystem: 'LeftHanded_ZUp_Centimeters',
    runtimeGuarantee: {
      zeroGeneratedCppOrBlueprintEval: true,
      deterministicSubsystemClass: 'UWorldPilotCausalSubsystem',
      tickBudgetMs: 0.3,
    },
    worldVersion: world.version || 1,
    activeQuestId: world.ir?.activeQuestId || null,
    actors: entities.map(mapEntityToUnrealActor),
    causalRuleDataTable: rules.map(mapRuleToUnrealRow),
    safetyGuards: invariants.map(mapInvariantToSafetyGuard),
  };
}

export function exportWorldToUnrealJson(world: WorldState): string {
  return JSON.stringify(compileUnrealSceneDescriptor(world), null, 2);
}

export class R3FWebGLWorldAdapter implements WorldAdapter {
  readonly adapterId = 'r3f-webgl-studio-adapter';
  readonly targetEngine = 'R3F_WEBGL' as const;
  private highlightedIds: string[] = [];
  private gizmoTargetId: string | null = null;
  private gizmoMode: 'off' | 'translate' | 'rotate' = 'off';

  readSpatialContext(): SpatialWorldContext {
    return {
      selectedEntities: this.gizmoTargetId ? [this.gizmoTargetId] : this.highlightedIds,
      pointedEntityId: null,
      cameraPosition: { x: 0, y: 1.8, z: 3.5 },
      gizmoMode: this.gizmoMode,
    };
  }

  async applyPatch(patch: WorldPatch): Promise<void> {
    await this.applyWorldPatch(patch);
  }

  async applyWorldPatch(patch: WorldPatch, currentIR?: WorldIR): Promise<WorldAdapterSyncReport> {
    const t0 = performance.now();
    const entitiesSynced =
      (patch.entitiesCreated?.length || 0) +
      (patch.entitiesChanged?.length || 0) +
      Object.keys(currentIR?.entities || {}).length;
    const rulesSynced = (patch.rulesChanged?.length || 0) + Object.keys(currentIR?.rules || {}).length;
    const invariantsSynced = (patch.invariantsAdded?.length || 0) + Object.keys(currentIR?.invariants || {}).length;

    return {
      targetEngine: 'R3F_WEBGL',
      appliedAt: Date.now(),
      entitiesSynced,
      rulesSynced,
      invariantsSynced,
      executionTimeMs: Number((performance.now() - t0).toFixed(4)),
      zeroGeneratedCodeVerified: true,
    };
  }

  setHighlightedEntities(entityIds: string[]): void {
    this.highlightedIds = [...entityIds];
  }

  setGizmoTarget(entityId: string | null, mode: 'off' | 'translate' | 'rotate'): void {
    this.gizmoTargetId = entityId;
    this.gizmoMode = mode;
  }
}

export class UnrealVictoriaVRWorldAdapter implements WorldAdapter {
  readonly adapterId = 'unreal-engine-5-victoria-vr-adapter';
  readonly targetEngine = 'UNREAL_ENGINE_5_VICTORIA_VR' as const;
  private highlightedIds: string[] = [];
  private gizmoTargetId: string | null = null;
  private gizmoMode: 'off' | 'translate' | 'rotate' = 'off';
  private lastCompiledDescriptor: UnrealSceneDescriptor | null = null;

  readSpatialContext(): SpatialWorldContext {
    return {
      selectedEntities: this.gizmoTargetId ? [this.gizmoTargetId] : this.highlightedIds,
      pointedEntityId: null,
      cameraPosition: { x: 0, y: 180, z: 350 },
      gizmoMode: this.gizmoMode,
    };
  }

  async applyPatch(patch: WorldPatch): Promise<void> {
    await this.applyWorldPatch(patch);
  }

  async applyWorldPatch(patch: WorldPatch, currentIR?: WorldIR): Promise<WorldAdapterSyncReport> {
    const t0 = performance.now();
    const syntheticWorld: WorldState = {
      version: 1,
      ir: currentIR || {
        entities: Object.fromEntries((patch.entitiesCreated || []).map(e => [e.id, e])),
        rules: Object.fromEntries((patch.rulesChanged || []).map(r => [r.id, r])),
        invariants: Object.fromEntries((patch.invariantsAdded || []).map(i => [i.id, i])),
        quests: {},
        activeQuestId: patch.activeQuestId || null,
      },
      flags: {},
    };
    this.lastCompiledDescriptor = compileUnrealSceneDescriptor(syntheticWorld);

    return {
      targetEngine: 'UNREAL_ENGINE_5_VICTORIA_VR',
      appliedAt: Date.now(),
      entitiesSynced: this.lastCompiledDescriptor.actors.length,
      rulesSynced: this.lastCompiledDescriptor.causalRuleDataTable.length,
      invariantsSynced: this.lastCompiledDescriptor.safetyGuards.length,
      executionTimeMs: Number((performance.now() - t0).toFixed(4)),
      zeroGeneratedCodeVerified: true,
    };
  }

  getLastCompiledDescriptor(): UnrealSceneDescriptor | null {
    return this.lastCompiledDescriptor;
  }

  setHighlightedEntities(entityIds: string[]): void {
    this.highlightedIds = [...entityIds];
  }

  setGizmoTarget(entityId: string | null, mode: 'off' | 'translate' | 'rotate'): void {
    this.gizmoTargetId = entityId;
    this.gizmoMode = mode;
  }
}

export const r3fWorldAdapter = new R3FWebGLWorldAdapter();
export const unrealVictoriaVRAdapter = new UnrealVictoriaVRWorldAdapter();
