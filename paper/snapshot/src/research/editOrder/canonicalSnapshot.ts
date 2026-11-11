// src/research/editOrder/canonicalSnapshot.ts
// Extraction et normalisation de l'état observable canonique multi-couche.
// Élimine les bruits non sémantiques (UUIDs, timestamps, ordre arbitraire des tableaux).

import type { WorldState, EntitySpec } from '../../core/types';
import type {
  CanonicalWorldSnapshot,
  CanonicalEntityState,
  GeometryState,
  PhysicsState,
  NavigationState,
  InteractionState,
  CanonicalCausalGraph,
  TaskOutcomeState,
  InvariantEvaluation
} from './experimentTypes';
import { computeDeterministicHash } from './worldCloneManager';

/**
 * Capture un snapshot canonique à partir d'un état de monde après exécution d'une branche.
 */
export function captureCanonicalSnapshot(
  world: WorldState,
  experimentId: string,
  branch: 'AB' | 'BA' | 'W0' | 'WA' | 'WB',
  runtimeMs: number = 0
): CanonicalWorldSnapshot {
  const entities = world.ir?.entities || {};
  const rules = world.ir?.rules || {};
  const invariants = world.ir?.invariants || {};
  const quests = world.ir?.quests || {};
  const activeQuestId = world.ir?.activeQuestId || null;

  // 1. Entités canoniques (triées par nom / type)
  const canonicalEntities: CanonicalEntityState[] = Object.values(entities)
    .map(ent => extractCanonicalEntity(ent))
    .sort((a, b) => a.name.localeCompare(b.name) || a.canonicalId.localeCompare(b.canonicalId));

  // 2. Géométrie
  const geometry: GeometryState = computeGeometryState(canonicalEntities);

  // 3. Physique
  const physics: PhysicsState = computePhysicsState(canonicalEntities, world);

  // 4. Navigation
  const navigation: NavigationState = computeNavigationState(canonicalEntities, world);

  // 5. Interactions
  const interactions: InteractionState = computeInteractionState(canonicalEntities, rules);

  // 6. Graphe causal
  const causalGraph: CanonicalCausalGraph = computeCanonicalCausalGraph(rules);

  // 7. État des tâches / quêtes
  const taskState: TaskOutcomeState = computeTaskOutcomeState(quests, activeQuestId);

  // 8. Invariants
  const invariantEvaluations: InvariantEvaluation[] = evaluateInvariants(invariants, world);

  // 9. Calcul du hash global du snapshot canonique
  const snapshotData = {
    entities: canonicalEntities,
    geometry,
    physics,
    navigation,
    interactions,
    causalGraph,
    taskState,
    invariants: invariantEvaluations
  };
  const snapshotHash = computeDeterministicHash(snapshotData);

  return {
    experimentId,
    branch,
    entities: canonicalEntities,
    geometry,
    physics,
    navigation,
    interactions,
    causalGraph,
    taskState,
    invariants: invariantEvaluations,
    snapshotHash,
    runtimeMs
  };
}

/**
 * Extrait les propriétés canoniques d'une entité en arrondissant les coordonnées flottantes.
 */
function extractCanonicalEntity(ent: EntitySpec): CanonicalEntityState {
  const transformCap = (ent.capabilities || []).find(c => c.type === 'transform');
  const pos = transformCap?.position || { x: 0, y: 0, z: 0 };
  const rot = transformCap?.rotation || { x: 0, y: 0, z: 0 };
  const scl = transformCap?.scale || { x: 1, y: 1, z: 1 };

  const round = (n: number) => Math.round((Number.isFinite(n) ? n : 0) * 1000) / 1000;
  const toVec3 = (v: any, def = 0): [number, number, number] => {
    if (Array.isArray(v)) {
      return [round(v[0] ?? def), round(v[1] ?? def), round(v[2] ?? def)];
    }
    return [round(v?.x ?? def), round(v?.y ?? def), round(v?.z ?? def)];
  };

  const caps = (ent.capabilities || [])
    .map(c => c.type)
    .sort();

  const isFixed = !ent.capabilities?.some(c => c.type === 'draggable');

  return {
    canonicalId: ent.id,
    name: ent.name || ent.id,
    position: toVec3(pos, 0),
    rotation: toVec3(rot, 0),
    scale: toVec3(scl, 1),
    shape: ent.visuals?.shape,
    assetId: ent.visuals?.assetId,
    isFixed,
    capabilities: caps
  };
}

/**
 * Analyse l'enveloppe géométrique et le centre de masse du monde.
 */
function computeGeometryState(entities: CanonicalEntityState[]): GeometryState {
  let totalVol = 0;
  let comX = 0, comY = 0, comZ = 0;

  entities.forEach(ent => {
    const [sx, sy, sz] = ent.scale;
    const vol = sx * sy * sz;
    totalVol += vol;
    comX += ent.position[0];
    comY += ent.position[1];
    comZ += ent.position[2];
  });

  const count = entities.length || 1;
  const com: [number, number, number] = [
    Math.round((comX / count) * 1000) / 1000,
    Math.round((comY / count) * 1000) / 1000,
    Math.round((comZ / count) * 1000) / 1000
  ];

  return {
    entityCount: entities.length,
    boundingVolumeTotal: Math.round(totalVol * 1000) / 1000,
    centerOfMass: com,
    spatialHash: computeDeterministicHash({ count: entities.length, com, totalVol })
  };
}

/**
 * Analyse l'état physique (colliders, pénétrations, corps dynamiques vs fixes).
 */
function computePhysicsState(entities: CanonicalEntityState[], _world: WorldState): PhysicsState {
  let colliderCount = 0;
  let dynamicCount = 0;
  let fixedCount = 0;

  entities.forEach(ent => {
    if (ent.capabilities.includes('collider')) colliderCount++;
    if (!ent.isFixed) dynamicCount++;
    else fixedCount++;
  });

  // Détection de pénétrations basiques (objets occupant le même volume exact)
  let penetrationCount = 0;
  for (let i = 0; i < entities.length; i++) {
    for (let j = i + 1; j < entities.length; j++) {
      const e1 = entities[i];
      const e2 = entities[j];
      const dist = Math.hypot(
        e1.position[0] - e2.position[0],
        e1.position[1] - e2.position[1],
        e1.position[2] - e2.position[2]
      );
      if (dist < 0.05 && e1.capabilities.includes('collider') && e2.capabilities.includes('collider')) {
        penetrationCount++;
      }
    }
  }

  const stabilityScore = Math.max(0, 1.0 - (penetrationCount * 0.2));

  return {
    colliderCount,
    dynamicCount,
    fixedCount,
    penetrationCount,
    stabilityScore
  };
}

/**
 * Évalue la structure de navigation et les obstacles dans l'espace.
 */
function computeNavigationState(entities: CanonicalEntityState[], world: WorldState): NavigationState {
  const obstacles: [number, number, number][] = entities
    .filter(e => e.capabilities.includes('collider'))
    .map(e => e.position)
    .sort((a, b) => a[0] - b[0] || a[2] - b[2]);

  // Inspecter les trajectoires actives des agents dans le monde
  const activeRoutes: any[] = [];
  const rawEntities = world.ir?.entities || {};
  for (const ent of Object.values(rawEntities)) {
    const nav = (ent.capabilities || []).find(c => c.type === 'navigation_path');
    if (nav) {
      let collision = false;
      if (nav.waypoints && !nav.hasDetour) {
        // En ligne droite directe, vérifier si un obstacle bloque le passage central
        for (const obs of obstacles) {
          if (Math.abs(obs[0]) < 0.8 && obs[2] > -4 && obs[2] < 4) {
            collision = true;
            break;
          }
        }
      }
      activeRoutes.push({
        id: ent.id,
        waypoints: nav.waypoints,
        hasDetour: nav.hasDetour,
        collision
      });
    }
  }

  const clearanceHash = computeDeterministicHash({
    obstacles,
    activeRoutes
  });

  const reachableCount = activeRoutes.some(r => r.collision) ? 5 : Math.max(1, 10 - obstacles.length);

  return {
    reachableWaypointCount: reachableCount,
    obstaclePositions: obstacles,
    clearanceHash
  };
}

/**
 * Extrait les interactions disponibles et les zones d'activation.
 */
function computeInteractionState(entities: CanonicalEntityState[], rules: Record<string, any>): InteractionState {
  const draggableEntityIds = entities
    .filter(e => e.capabilities.includes('draggable'))
    .map(e => e.canonicalId)
    .sort();

  const clickableEntityIds = entities
    .filter(e => e.capabilities.includes('clickable') || e.capabilities.includes('button'))
    .map(e => e.canonicalId)
    .sort();

  const triggerZones: { id: string; targetId?: string; radius?: number; position?: [number, number, number] }[] = [];
  const round = (n: number) => Math.round(n * 1000) / 1000;
  Object.values(rules).forEach(rule => {
    (rule.conditions || []).forEach((cond: any) => {
      if (cond.type === 'proximity' || cond.type === 'in_zone') {
        const tl = cond.triggerLocation;
        const pos: [number, number, number] | undefined = tl
          ? Array.isArray(tl)
            ? [round(tl[0] || 0), round(tl[1] || 0), round(tl[2] || 0)]
            : [round(tl.x || 0), round(tl.y || 0), round(tl.z || 0)]
          : undefined;

        triggerZones.push({
          id: rule.id,
          targetId: cond.targetId || cond.value,
          radius: cond.radius || 1.0,
          position: pos
        });
      }
    });
  });

  return {
    draggableEntityIds,
    clickableEntityIds,
    triggerZones: triggerZones.sort((a, b) => a.id.localeCompare(b.id))
  };
}

/**
 * Construit la vue canonique du graphe causal (déclencheurs, cibles, actions).
 */
function computeCanonicalCausalGraph(rules: Record<string, any>): CanonicalCausalGraph {
  const edges: { trigger: string; targetId: string; action: string }[] = [];

  Object.values(rules).forEach(rule => {
    const trigger = rule.trigger || 'manual';
    (rule.actions || []).forEach((act: any) => {
      edges.push({
        trigger,
        targetId: act.targetId || act.entityId || 'world',
        action: act.type
      });
    });
  });

  edges.sort((a, b) => a.trigger.localeCompare(b.trigger) || a.targetId.localeCompare(b.targetId) || a.action.localeCompare(b.action));

  return {
    ruleCount: Object.keys(rules).length,
    edgeCount: edges.length,
    edges,
    graphHash: computeDeterministicHash(edges)
  };
}

/**
 * Évalue la faisabilité et la progression des quêtes / objectifs.
 */
function computeTaskOutcomeState(quests: Record<string, any>, activeQuestId: string | null): TaskOutcomeState {
  if (!activeQuestId || !quests[activeQuestId]) {
    return {
      activeQuestId: null,
      totalSteps: 0,
      completedSteps: 0,
      status: 'idle',
      isSolvable: true
    };
  }

  const q = quests[activeQuestId];
  const steps = q.steps || [];
  const completed = steps.filter((s: any) => s.completed).length;

  return {
    activeQuestId,
    totalSteps: steps.length,
    completedSteps: completed,
    status: q.status || 'in_progress',
    isSolvable: steps.length > 0 && steps.every((s: any) => !!s.requiredEvent)
  };
}

/**
 * Évalue les invariants de sécurité et d'intégrité causale.
 */
function evaluateInvariants(invariants: Record<string, any>, world: WorldState): InvariantEvaluation[] {
  return Object.values(invariants).map(inv => {
    let satisfied = inv.satisfied !== false;

    // Exemple : invariant never_state without_flag / stateFlag + requiredFlag
    if (inv.condition?.type === 'never_state') {
      const forbiddenState = inv.condition.stateFlag || inv.condition.state;
      const requiredFlag = inv.condition.requiredFlag || inv.condition.without_flag;
      if (forbiddenState && world.flags && world.flags[forbiddenState] && (!requiredFlag || !world.flags[requiredFlag])) {
        satisfied = false;
      }
    }

    return {
      invariantId: inv.id,
      description: inv.description || inv.id,
      satisfied,
      severity: inv.severity || 'CRITICAL'
    };
  });
}
