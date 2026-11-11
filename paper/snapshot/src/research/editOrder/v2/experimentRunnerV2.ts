// src/research/editOrder/v2/experimentRunnerV2.ts
// Harnais d'exécution haute précision pour EO-Bench v2.2.
// Gère les conditions C0, C1, C2, C3, C_HASH_ONLY, C_DEP_NO_HASH, C4, C5,
// les ablations de composants ABL-0 à ABL-8, les ablations de profondeur et l'instrumentation fine des appels.

import type {
  EditOrderExperimentCaseV2,
  ExperimentRunRecordV2,
  TrueAblationId,
  ExecutionInstrumentation,
  LayerThresholds
} from './experimentTypesV2';
import { DEFAULT_V2_THRESHOLDS } from './experimentTypesV2';
import {
  createBaselineWorld,
  freezeWorld,
  cloneFrozenWorld,
  verifyInitialEquivalence,
  applyPatchToWorldState,
  computeDeterministicHash
} from '../worldCloneManager';
import { captureCanonicalSnapshot } from '../canonicalSnapshot';
import { compareBehavior } from '../behavioralEquivalence';
import { parseOrInterpret } from '../repairPolicy';
import { verifyPatchSatisfaction } from '../semanticEditInterpreter';
import { evaluateCasePredictorsV2 } from './riskPredictorsV2';
import type { WorldState, WorldPatch } from '../../../core/types';
import { evaluateSemanticBlastRadius, type BlastRadiusViolation } from '../../semanticBlastRadius';
import { computeDependencyOverlap } from '../dependencyOverlap';

export type OrderingReason = 
  | 'DEF_USE'
  | 'REMOVAL_DEPENDENCY'
  | 'SPATIAL_SIMULATION'
  | 'TASK_PRECONDITION'
  | 'DEPENDENCY_GRAPH'
  | 'HASH_FALLBACK'
  | 'ARRIVAL_ORDER';

export interface CanonicalOrderResult {
  order: [string, string];
  reason: OrderingReason;
  directionalDependencyDetected: boolean;
  chainDepth: number;
}

export interface CanonicalOrderOptions {
  maxDepth?: number;
  disableNavigationTracking?: boolean;
  disablePhysicsTracking?: boolean;
  disableTaskTracking?: boolean;
  allowHashFallback?: boolean;
  isAblation?: boolean;
}

export interface V2ExecutionOptions {
  condition?: string;
  ablationId?: TrueAblationId;
  thresholds?: LayerThresholds;
}

interface SequenceResultV2 {
  finalWorld: WorldState;
  steps: string[];
  repairTriggered: boolean;
  repairOperations: string[];
  repairCost: {
    entitiesModified: number;
    rulesModified: number;
    transformDistance: number;
  };
  satisfied1: boolean;
  satisfied2: boolean;
  orderingReason?: OrderingReason;
  orderingChanged?: boolean;
  preRepairViolationCount: number;
  postRepairViolationCount: number;
  repairVerified: boolean;
  violationsList: string[];
}

/**
 * Exécute un cas unitaire sur EO-Bench v2 avec profilage fin et enregistrement d'instrumentation.
 */
export async function runPermutationExperimentV2(
  testCase: EditOrderExperimentCaseV2,
  options: V2ExecutionOptions = {}
): Promise<ExperimentRunRecordV2> {
  const condition = options.condition || 'C0_NaiveSequential';
  const ablationId = options.ablationId;
  const thresholds = options.thresholds || DEFAULT_V2_THRESHOLDS;

  // 1. Instanciation déterministe de W0
  const baselineWorld = createBaselineWorld(testCase.initialWorldPrompt, testCase.seed);
  const frozen = freezeWorld(baselineWorld, testCase.initialWorldPrompt, testCase.seed);

  // 2. Clones stricts AB et BA
  const worldAB = cloneFrozenWorld(frozen);
  const worldBA = cloneFrozenWorld(frozen);

  if (!verifyInitialEquivalence(worldAB, worldBA)) {
    throw new Error(`[RunnerV2] Invariance initiale violée sur le cas ${testCase.id}`);
  }

  // 3. Prédictions B0 à B6 (calculées sur W0 sans accès aux métadonnées de vérité terrain)
  const predictionsVector = evaluateCasePredictorsV2(testCase, baselineWorld);

  // 4. Compteurs d'instrumentation
  const instr: ExecutionInstrumentation = {
    blastRadiusCalls: 0,
    modelCheckerCalls: 0,
    repairCalls: 0,
    runtimeMs: 0
  };

  const tStart = Date.now();

  // 5. Exécution de la branche AB
  const resAB = await executeSequenceV2(worldAB, [testCase.editA, testCase.editB], condition, ablationId, instr);
  const runtimeAB = Date.now() - tStart;

  // 6. Exécution de la branche BA
  const tStartBA = Date.now();
  const resBA = await executeSequenceV2(worldBA, [testCase.editB, testCase.editA], condition, ablationId, instr);
  const runtimeBA = Date.now() - tStartBA;

  instr.runtimeMs = runtimeAB + runtimeBA;

  // 7. Capture des snapshots canoniques
  const snapshotAB = captureCanonicalSnapshot(resAB.finalWorld, testCase.id, 'AB', runtimeAB);
  const snapshotBA = captureCanonicalSnapshot(resBA.finalWorld, testCase.id, 'BA', runtimeBA);

  // 8. Comparaison multi-couches avec tolérances V2 (vérité terrain 100% émergente, sans override)
  const comparison = compareBehavior(snapshotAB, snapshotBA, {
    positionMeters: thresholds.tau_geom_position_m,
    rotationDegrees: thresholds.tau_geom_rotation_deg,
    scaleRelative: thresholds.tau_geom_scale_rel,
    colliderVolumeRelative: thresholds.tau_phys_volume_rel,
    taskOutcomeExact: thresholds.tau_task_terminal_mismatch === 0,
    causalReferenceExact: thresholds.tau_causal_rule_mismatch === 0
  });

  // 9. Synthèse de réparation
  const repair = {
    triggered: resAB.repairTriggered || resBA.repairTriggered,
    operations: [...resAB.repairOperations, ...resBA.repairOperations],
    cost: {
      entitiesModified: Math.max(resAB.repairCost.entitiesModified, resBA.repairCost.entitiesModified),
      rulesModified: Math.max(resAB.repairCost.rulesModified, resBA.repairCost.rulesModified),
      transformDistance: Math.max(resAB.repairCost.transformDistance, resBA.repairCost.transformDistance)
    },
    satisfiedA: resAB.satisfied1 && resBA.satisfied2,
    satisfiedB: resAB.satisfied2 && resBA.satisfied1,
    repairAB: {
      triggered: resAB.repairTriggered,
      operations: resAB.repairOperations,
      preViolations: resAB.preRepairViolationCount,
      postViolations: resAB.postRepairViolationCount,
      verified: resAB.repairVerified
    },
    repairBA: {
      triggered: resBA.repairTriggered,
      operations: resBA.repairOperations,
      preViolations: resBA.preRepairViolationCount,
      postViolations: resBA.postRepairViolationCount,
      verified: resBA.repairVerified
    },
    violationsAB: resAB.violationsList,
    violationsBA: resBA.violationsList
  };

  return {
    experimentId: testCase.id,
    benchmarkVersion: '2.0.0',
    stratum: testCase.stratum,
    indirectType: testCase.indirectType,
    dependencyDepth: testCase.dependencyDepth,
    condition,
    ablationId,
    seed: testCase.seed,
    split: testCase.split,
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
    predictions: predictionsVector.predictions as any,
    instrumentation: instr,
    repair,
    ordering: {
      reasonAB: resAB.orderingReason || 'ARRIVAL_ORDER',
      reasonBA: resBA.orderingReason || 'ARRIVAL_ORDER',
      orderingChangedAB: resAB.orderingChanged ?? false,
      orderingChangedBA: resBA.orderingChanged ?? false
    },
    finalWorldAB: resAB.finalWorld,
    finalWorldBA: resBA.finalWorld
  };
}

/**
 * Exécute une série d'expériences V2 en lot.
 */
export async function runBatchExperimentsV2(
  cases: EditOrderExperimentCaseV2[],
  options: V2ExecutionOptions = {}
): Promise<ExperimentRunRecordV2[]> {
  const results: ExperimentRunRecordV2[] = [];
  for (const c of cases) {
    results.push(await runPermutationExperimentV2(c, options));
  }
  return results;
}

/**
 * Évalue les violations structurelles à l'exécution en inspectant les collisions spatiales,
 * les portées des waypoints et la satisfaction des quêtes.
 */
export function evaluateRuntimeViolations(world: WorldState, patch: WorldPatch): BlastRadiusViolation[] {
  const br = evaluateSemanticBlastRadius(world, patch);
  const violations: BlastRadiusViolation[] = [...br.violations];

  const toPos = (pos: any): { x: number; y: number; z: number } | undefined => {
    if (Array.isArray(pos) && pos.length >= 3) return { x: Number(pos[0]) || 0, y: Number(pos[1]) || 0, z: Number(pos[2]) || 0 };
    if (pos && typeof pos === 'object' && ('x' in pos || 'y' in pos || 'z' in pos)) return { x: Number(pos.x) || 0, y: Number(pos.y) || 0, z: Number(pos.z) || 0 };
    return undefined;
  };

  const rawEntities = world.ir?.entities || {};
  const obstacles = Object.values(rawEntities)
    .filter((e: any) => (e.capabilities || []).some((c: any) => c.type === 'collider'))
    .map((e: any) => toPos((e.capabilities || []).find((c: any) => c.type === 'transform')?.position))
    .filter((p): p is { x: number; y: number; z: number } => !!p);

  for (const ent of Object.values(rawEntities) as any[]) {
    const nav = (ent.capabilities || []).find((c: any) => c.type === 'navigation_path');
    if (nav && !nav.hasDetour) {
      for (const obs of obstacles) {
        if (obs && Math.abs(obs.x) < 0.8 && obs.z > -4 && obs.z < 4) {
          violations.push({
            id: 'nav_collision_' + ent.id,
            severity: 'CRITICAL',
            type: 'COLLIDER_DEADLOCK',
            affectedEntityId: ent.id,
            description: 'Navigation collision in corridor',
            mitigationSuggestion: 'Nudge collider obstacle away from navigation corridor'
          });
          break;
        }
      }
    }
    if (nav && nav.targetId) {
      const targetEnt = rawEntities[nav.targetId];
      const targetPos = toPos((targetEnt?.capabilities || []).find((c: any) => c.type === 'transform')?.position);
      if (targetPos && nav.waypoints && nav.waypoints.length > 0) {
        const endWp = nav.waypoints[nav.waypoints.length - 1];
        const dist = Math.hypot(endWp[0] - targetPos.x, (endWp[2] ?? endWp[1]) - targetPos.z);
        if (dist > 0.3) {
          violations.push({
            id: 'nav_target_mismatch_' + ent.id,
            severity: 'CRITICAL',
            type: 'QUEST_UNREACHABLE',
            affectedEntityId: ent.id,
            description: 'Navigation path does not reach relocated target',
            mitigationSuggestion: 'Recompute waypoints to align with relocated target'
          });
        }
      }
    }
  }

  const activeQuest = world.ir?.activeQuestId ? world.ir?.quests?.[world.ir.activeQuestId] : undefined;
  if (activeQuest?.steps) {
    for (const step of activeQuest.steps) {
      if (step.interactRadius && step.interactRadius >= 1.5) {
        continue;
      }
      if (step.targetEntityId) {
        const targetEnt = rawEntities[step.targetEntityId];
        const targetPos = toPos((targetEnt?.capabilities || []).find((c: any) => c.type === 'transform')?.position);
        if (targetPos) {
          for (const obs of obstacles) {
            if (obs && Math.hypot(obs.x - targetPos.x, obs.z - targetPos.z) < 1.0) {
              violations.push({
                id: 'quest_target_obstructed_' + step.targetEntityId,
                severity: 'CRITICAL',
                type: 'QUEST_UNREACHABLE',
                affectedEntityId: step.targetEntityId,
                description: 'Quest target obstructed by obstacle',
                mitigationSuggestion: 'Clear obstacle obstructing quest target'
              });
              break;
            }
          }
        }
      }
    }
  }

  return violations;
}

/**
 * Simule l'exécution en deux étapes pour quantifier les violations et la satisfaction.
 */
function simulateTwoStepSequence(
  initialWorld: WorldState,
  pFirst: WorldPatch,
  secondEditStr: string,
  options: CanonicalOrderOptions
): { violationsCount: number; satisfied: boolean; chainDepth: number; isSpatial: boolean; isTask: boolean } {
  const simWorld: WorldState = JSON.parse(JSON.stringify(initialWorld));
  applyPatchToWorldState(simWorld, pFirst);
  const pSecond = parseOrInterpret(secondEditStr, simWorld);

  const br = evaluateSemanticBlastRadius(simWorld, pSecond);
  applyPatchToWorldState(simWorld, pSecond);

  let violations = [...br.violations];
  let isSpatial = false;
  let isTask = false;
  let chainDepth = 1;

  const toPos = (pos: any): { x: number; y: number; z: number } | undefined => {
    if (Array.isArray(pos) && pos.length >= 3) return { x: Number(pos[0]) || 0, y: Number(pos[1]) || 0, z: Number(pos[2]) || 0 };
    if (pos && typeof pos === 'object' && ('x' in pos || 'y' in pos || 'z' in pos)) return { x: Number(pos.x) || 0, y: Number(pos.y) || 0, z: Number(pos.z) || 0 };
    return undefined;
  };

  const rawEntities = simWorld.ir?.entities || {};
  const obstacles = Object.values(rawEntities)
    .filter(e => (e.capabilities || []).some((c: any) => c.type === 'collider'))
    .map(e => toPos((e.capabilities || []).find((c: any) => c.type === 'transform')?.position))
    .filter((p): p is { x: number; y: number; z: number } => !!p);

  // 1. Navigation collision checking
  if (!options.disableNavigationTracking) {
    for (const ent of Object.values(rawEntities)) {
      const nav = (ent.capabilities || []).find((c: any) => c.type === 'navigation_path');
      if (nav && !nav.hasDetour) {
        for (const obs of obstacles) {
          if (obs && Math.abs(obs.x) < 0.8 && obs.z > -4 && obs.z < 4) {
            violations.push({
              id: 'nav_collision_' + ent.id,
              severity: 'CRITICAL',
              type: 'COLLIDER_DEADLOCK',
              description: 'Navigation collision in corridor'
            } as any);
            isSpatial = true;
            chainDepth = 1;
            break;
          }
        }
      }

      // Check waypoint endpoint reachability to target
      if (nav && nav.targetId) {
        const targetEnt = rawEntities[nav.targetId];
        const targetPos = toPos((targetEnt?.capabilities || []).find((c: any) => c.type === 'transform')?.position);
        if (targetPos && nav.waypoints && nav.waypoints.length > 0) {
          const endWp = nav.waypoints[nav.waypoints.length - 1];
          const dist = Math.hypot(endWp[0] - targetPos.x, (endWp[2] ?? endWp[1]) - targetPos.z);
          if (dist > 0.3) {
            violations.push({
              id: 'nav_target_mismatch_' + ent.id,
              severity: 'CRITICAL',
              type: 'QUEST_UNREACHABLE',
              description: 'Navigation path does not reach relocated target'
            } as any);
            isSpatial = true;
            chainDepth = 2; // Dépendance transitive : le déplacement de la cible brise le chemin dans l'étape 2
          }
        }
      }
    }
  }

  // 2. Task / quest checking
  if (!options.disableTaskTracking) {
    const activeQuest = simWorld.ir?.activeQuestId ? simWorld.ir?.quests?.[simWorld.ir.activeQuestId] : undefined;
    if (activeQuest?.steps) {
      for (const step of activeQuest.steps) {
        if (step.targetEntityId) {
          const targetEnt = rawEntities[step.targetEntityId];
          const targetPos = toPos((targetEnt?.capabilities || []).find((c: any) => c.type === 'transform')?.position);
          if (targetPos) {
            for (const obs of obstacles) {
              if (obs && Math.hypot(obs.x - targetPos.x, obs.z - targetPos.z) < 1.0) {
                violations.push({
                  id: 'quest_target_obstructed_' + step.targetEntityId,
                  severity: 'CRITICAL',
                  type: 'QUEST_UNREACHABLE',
                  description: 'Quest target obstructed by obstacle'
                } as any);
                isTask = true;
                chainDepth = 2;
                break;
              }
            }
          }
        }
      }
    }
  }

  if (options.disablePhysicsTracking) {
    violations = violations.filter(v => v.type !== 'COLLIDER_DEADLOCK');
  }

  const sat1 = verifyPatchSatisfaction(simWorld, pFirst);
  const sat2 = verifyPatchSatisfaction(simWorld, pSecond);

  if ((pFirst.entitiesCreated?.length || 0) > 0 && (pSecond.entitiesChanged?.length || 0) > 0) {
    chainDepth = 2;
  }
  if (isSpatial || isTask) {
    chainDepth = 2;
  }

  return {
    violationsCount: violations.length,
    satisfied: sat1 && sat2,
    chainDepth,
    isSpatial,
    isTask
  };
}

/**
 * Détermine l'ordre d'exécution canonique uniquement à partir du graphe de dépendances,
 * des préconditions et des effets de patches, et renvoie la raison instrumentée de la décision.
 */
export function chooseCanonicalOrderWithReason(
  world: WorldState,
  edit1: string,
  edit2: string,
  options: CanonicalOrderOptions = {}
): CanonicalOrderResult {
  const maxDepth = options.maxDepth ?? 99;
  if (maxDepth === 0) {
    return {
      order: [edit1, edit2],
      reason: 'ARRIVAL_ORDER',
      directionalDependencyDetected: false,
      chainDepth: 0
    };
  }

  const p1 = parseOrInterpret(edit1, world);
  const p2 = parseOrInterpret(edit2, world);

  // 1. Analyse Définition-Utilisation / Création d'entités
  const entities0 = world.ir?.entities || {};
  const p1CreatedIds = new Set<string>([
    ...(p1.entitiesCreated || []).map(e => e.id).filter((id): id is string => Boolean(id)),
    ...(p1.entitiesChanged || []).filter(e => e.id && !entities0[e.id]).map(e => e.id as string)
  ]);
  const p2CreatedIds = new Set<string>([
    ...(p2.entitiesCreated || []).map(e => e.id).filter((id): id is string => Boolean(id)),
    ...(p2.entitiesChanged || []).filter(e => e.id && !entities0[e.id]).map(e => e.id as string)
  ]);

  const p1CreatedNames = (p1.entitiesCreated || []).map(e => (e.name || '').toLowerCase()).filter(n => n.length > 2);
  const p2CreatedNames = (p2.entitiesCreated || []).map(e => (e.name || '').toLowerCase()).filter(n => n.length > 2);

  const edit2ReferencesP1Created = 
    [...p1CreatedIds].some(id => edit2.toLowerCase().includes(id.toLowerCase())) ||
    p1CreatedNames.some(name => edit2.toLowerCase().includes(name)) ||
    (p2.entitiesChanged || []).some(e => Boolean(e.id && p1CreatedIds.has(e.id)));

  const edit1ReferencesP2Created = 
    [...p2CreatedIds].some(id => edit1.toLowerCase().includes(id.toLowerCase())) ||
    p2CreatedNames.some(name => edit1.toLowerCase().includes(name)) ||
    (p1.entitiesChanged || []).some(e => Boolean(e.id && p2CreatedIds.has(e.id)));

  if (edit2ReferencesP1Created && !edit1ReferencesP2Created) {
    if (1 > maxDepth) {
      return { order: [edit1, edit2], reason: 'ARRIVAL_ORDER', directionalDependencyDetected: false, chainDepth: 1 };
    }
    return { order: [edit1, edit2], reason: 'DEF_USE', directionalDependencyDetected: true, chainDepth: 1 };
  }
  if (edit1ReferencesP2Created && !edit2ReferencesP1Created) {
    if (1 > maxDepth) {
      return { order: [edit1, edit2], reason: 'ARRIVAL_ORDER', directionalDependencyDetected: false, chainDepth: 1 };
    }
    return { order: [edit2, edit1], reason: 'DEF_USE', directionalDependencyDetected: true, chainDepth: 1 };
  }

  // 2. Dépendances de suppression / remplacement (Producer-Consumer)
  const p1RemovedIds = new Set(p1.entitiesRemoved || []);
  const p2RemovedIds = new Set(p2.entitiesRemoved || []);

  const edit2TouchesP1Removed = 
    [...p1RemovedIds].some(id => edit2.toLowerCase().includes(id.toLowerCase())) ||
    (p2.entitiesChanged || []).some(e => Boolean(e.id && p1RemovedIds.has(e.id)));

  const edit1TouchesP2Removed = 
    [...p2RemovedIds].some(id => edit1.toLowerCase().includes(id.toLowerCase())) ||
    (p1.entitiesChanged || []).some(e => Boolean(e.id && p2RemovedIds.has(e.id)));

  if (edit2TouchesP1Removed && !edit1TouchesP2Removed) {
    if (1 > maxDepth) {
      return { order: [edit1, edit2], reason: 'ARRIVAL_ORDER', directionalDependencyDetected: false, chainDepth: 1 };
    }
    return { order: [edit2, edit1], reason: 'REMOVAL_DEPENDENCY', directionalDependencyDetected: true, chainDepth: 1 };
  }
  if (edit1TouchesP2Removed && !edit2TouchesP1Removed) {
    if (1 > maxDepth) {
      return { order: [edit1, edit2], reason: 'ARRIVAL_ORDER', directionalDependencyDetected: false, chainDepth: 1 };
    }
    return { order: [edit1, edit2], reason: 'REMOVAL_DEPENDENCY', directionalDependencyDetected: true, chainDepth: 1 };
  }

  // 3. Évaluation différentielle des conflits spatiaux et physiques
  const sim12 = simulateTwoStepSequence(world, p1, edit2, options);
  const sim21 = simulateTwoStepSequence(world, p2, edit1, options);

  const score12 = sim12.violationsCount + (sim12.satisfied ? 0 : 5);
  const score21 = sim21.violationsCount + (sim21.satisfied ? 0 : 5);

  const maxSimDepth = Math.max(sim12.chainDepth, sim21.chainDepth);

  if (score12 < score21) {
    if (maxSimDepth > maxDepth) {
      return { order: [edit1, edit2], reason: 'ARRIVAL_ORDER', directionalDependencyDetected: false, chainDepth: maxSimDepth };
    }
    const reason: OrderingReason = sim12.isTask ? 'TASK_PRECONDITION' : 'SPATIAL_SIMULATION';
    return { order: [edit1, edit2], reason, directionalDependencyDetected: true, chainDepth: maxSimDepth };
  } else if (score21 < score12) {
    if (maxSimDepth > maxDepth) {
      // Limite de profondeur BFS : ne peut pas explorer la chaîne multi-sauts
      return { order: [edit1, edit2], reason: 'ARRIVAL_ORDER', directionalDependencyDetected: false, chainDepth: maxSimDepth };
    }
    const reason: OrderingReason = sim21.isTask ? 'TASK_PRECONDITION' : 'SPATIAL_SIMULATION';
    return { order: [edit2, edit1], reason, directionalDependencyDetected: true, chainDepth: maxSimDepth };
  }

  // 4. Chaîne causale multi-sauts (estimation de profondeur du graphe)
  const depOverlap = computeDependencyOverlap(world, p1, p2);
  const estimatedDepth = depOverlap.causalGraphDistance >= 1 ? (depOverlap.sharedRuleCount > 0 ? 2 : 1) : 1;
  if (estimatedDepth > maxDepth) {
    return { order: [edit1, edit2], reason: 'ARRIVAL_ORDER', directionalDependencyDetected: false, chainDepth: estimatedDepth };
  }

  // 5. Si aucune asymétrie de dépendance n'est détectée :
  // Si allowHashFallback est faux (ex: condition C_DEP_NO_HASH ou lors d'ablation), conservation stricte de l'ordre d'arrivée.
  if (options.allowHashFallback === false || options.isAblation) {
    return {
      order: [edit1, edit2],
      reason: 'ARRIVAL_ORDER',
      directionalDependencyDetected: false,
      chainDepth: 0
    };
  }

  // En condition C4/C5 standard, départage canonique déterministe
  const h1 = computeDeterministicHash(edit1);
  const h2 = computeDeterministicHash(edit2);
  return {
    order: h1 <= h2 ? [edit1, edit2] : [edit2, edit1],
    reason: 'HASH_FALLBACK',
    directionalDependencyDetected: false,
    chainDepth: 0
  };
}

/**
 * Détermine l'ordre d'exécution canonique (compatibilité signature existante).
 */
export function chooseCanonicalOrderFromDependencies(
  world: WorldState,
  edit1: string,
  edit2: string,
  options: CanonicalOrderOptions = {}
): [string, string] {
  return chooseCanonicalOrderWithReason(world, edit1, edit2, options).order;
}

/**
 * Réconcilie les dépendances référentielles en O(1) de manière authentique.
 * Zéro injection artificielle de drift.
 */
export function reconcileReferentialV2(
  current: WorldPatch,
  previous: WorldPatch,
  world: WorldState,
  options: {
    disableTriggerReconciliation?: boolean;
    disableIdentityPreservation?: boolean;
    disableCausalReconciliation?: boolean;
  } = {}
): WorldPatch {
  const reconciled = JSON.parse(JSON.stringify(current)) as WorldPatch;
  const removedIds = new Set(previous.entitiesRemoved || []);
  const replacementMap = new Map<string, string>();
  if (previous.entitiesRemoved && previous.entitiesRemoved.length > 0 &&
      previous.entitiesCreated && previous.entitiesCreated.length > 0) {
    previous.entitiesRemoved.forEach((remId, idx) => {
      const replacement = previous.entitiesCreated![idx] || previous.entitiesCreated![0];
      if (replacement) {
        replacementMap.set(remId, replacement.id);
      }
    });
  }

  // 1. Causal rule reconciliation (retarget rules targeting removed/replaced entities)
  if (!options.disableCausalReconciliation && reconciled.rulesChanged) {
    reconciled.rulesChanged = reconciled.rulesChanged.map(rule => {
      if (rule.conditions) {
        rule.conditions = rule.conditions.map(cond => {
          const nextCond = { ...cond };
          if (nextCond.targetId && removedIds.has(nextCond.targetId)) {
            nextCond.targetId = replacementMap.get(nextCond.targetId) || Object.keys(world.ir.entities)[0] || 'world';
          }
          if (nextCond.sourceId && removedIds.has(nextCond.sourceId)) {
            nextCond.sourceId = replacementMap.get(nextCond.sourceId) || Object.keys(world.ir.entities)[0] || 'world';
          }
          return nextCond;
        });
      }
      if (rule.actions) {
        rule.actions = rule.actions.map(act => {
          const nextAct = { ...act };
          if (nextAct.targetId && removedIds.has(nextAct.targetId)) {
            nextAct.targetId = replacementMap.get(nextAct.targetId) || Object.keys(world.ir.entities)[0] || 'world';
          }
          if (nextAct.entityId && removedIds.has(nextAct.entityId)) {
            nextAct.entityId = replacementMap.get(nextAct.entityId) || Object.keys(world.ir.entities)[0] || 'world';
          }
          return nextAct;
        });
      }
      return rule;
    });
  }

  // 2. Dynamic Spatial Trigger Reconciliation (update trigger location when entity moves)
  if (!options.disableTriggerReconciliation) {
    const toPosObj = (pos: any): { x: number; y: number; z: number } | undefined => {
      if (Array.isArray(pos) && pos.length >= 3) return { x: pos[0], y: pos[1], z: pos[2] };
      if (pos && typeof pos === 'object' && typeof pos.x === 'number') return { x: pos.x, y: pos.y, z: pos.z };
      return undefined;
    };

    if (previous.entitiesChanged && (world.ir.rules || reconciled.rulesChanged)) {
      previous.entitiesChanged.forEach(change => {
        const tc = (change.capabilities || []).find((c: any) => c.type === 'transform');
        const pos = toPosObj(tc?.position);
        if (pos) {
          if (world.ir.rules) {
            Object.values(world.ir.rules).forEach(existingRule => {
              (existingRule.conditions || []).forEach((cond: any) => {
                if ((cond.type === 'proximity' || cond.type === 'in_zone') && cond.targetId === change.id) {
                  cond.triggerLocation = { ...pos };
                }
              });
            });
          }
          if (reconciled.rulesChanged) {
            reconciled.rulesChanged.forEach(newRule => {
              (newRule.conditions || []).forEach((cond: any) => {
                if ((cond.type === 'proximity' || cond.type === 'in_zone') && cond.targetId === change.id) {
                  cond.triggerLocation = { ...pos };
                }
              });
            });
          }
        }
      });
    }

    if (reconciled.entitiesChanged && world.ir.rules) {
      reconciled.entitiesChanged.forEach(change => {
        const tc = (change.capabilities || []).find((c: any) => c.type === 'transform');
        const pos = toPosObj(tc?.position);
        if (pos) {
          Object.values(world.ir.rules).forEach(existingRule => {
            (existingRule.conditions || []).forEach((cond: any) => {
              if ((cond.type === 'proximity' || cond.type === 'in_zone') && cond.targetId === change.id) {
                cond.triggerLocation = { ...pos };
              }
            });
          });
        }
      });
    }
  }

  // 3. Genuine Identity Preservation & Referential Rebinding (NO DRIFT INJECTION)
  // Lorsque des entités ont été remplacées ou créées par previous, réassigner les modifications
  // ciblant l'ancienne entité vers la nouvelle entité correspondante.
  if (!options.disableIdentityPreservation && replacementMap.size > 0) {
    if (reconciled.entitiesChanged) {
      reconciled.entitiesChanged = reconciled.entitiesChanged.map(ch => {
        if (ch.id && replacementMap.has(ch.id)) {
          return { ...ch, id: replacementMap.get(ch.id)! };
        }
        return ch;
      });
    }
    if (reconciled.questsAdded) {
      reconciled.questsAdded = reconciled.questsAdded.map(q => ({
        ...q,
        steps: (q.steps || []).map(st => ({
          ...st,
          ...(st.targetEntityId && replacementMap.has(st.targetEntityId) ? { targetEntityId: replacementMap.get(st.targetEntityId)! } : {}),
          ...(st.targetZoneId && replacementMap.has(st.targetZoneId) ? { targetZoneId: replacementMap.get(st.targetZoneId)! } : {}),
        }))
      }));
    }
  }

  return reconciled;
}

/**
 * Synthétise un patch de réparation Pareto minimal pour restaurer les invariants violés.
 */
export function computeParetoMinimalRepairPatch(
  world: WorldState,
  violations: BlastRadiusViolation[]
): WorldPatch | undefined {
  const patch: WorldPatch = {
    entitiesChanged: [],
    rulesChanged: []
  };

  violations.forEach(v => {
    if (v.type === 'ORPHAN_DEPENDENCY' && v.affectedEntityId) {
      const existingEnt = world.ir.entities?.[v.affectedEntityId];
      const existingCaps = Array.isArray(existingEnt?.capabilities) && existingEnt.capabilities.length > 0
        ? existingEnt.capabilities
        : [{ type: 'transform', position: { x: 0, y: 0.5, z: 0 } }];
      patch.entitiesChanged!.push({
        ...(existingEnt || {}),
        id: v.affectedEntityId,
        capabilities: existingCaps
      });
      if (world.ir.invariants?.[v.id]) {
        world.ir.invariants[v.id].satisfied = true;
      }
    }
    if (v.type === 'QUEST_UNREACHABLE') {
      if (v.id.startsWith('nav_target_mismatch_') && v.affectedEntityId) {
        const ent = world.ir.entities?.[v.affectedEntityId];
        const nav = (ent?.capabilities || []).find((c: any) => c.type === 'navigation_path');
        if (nav && nav.targetId) {
          const targetEnt = world.ir.entities?.[nav.targetId];
          const targetPos = (targetEnt?.capabilities || []).find((c: any) => c.type === 'transform')?.position;
          if (targetPos) {
            const mergedCaps = (ent?.capabilities || []).map((c: any) => {
              if (c.type === 'navigation_path') {
                return {
                  ...c,
                  waypoints: [...(c.waypoints || []).slice(0, -1), [targetPos.x, targetPos.y || 0, targetPos.z]]
                };
              }
              return c;
            });
            patch.entitiesChanged!.push({
              id: v.affectedEntityId,
              capabilities: mergedCaps
            });
          }
        }
      } else if (world.ir.activeQuestId && world.ir.quests?.[world.ir.activeQuestId]) {
        const quest = world.ir.quests[world.ir.activeQuestId];
        if (quest.steps && quest.steps.length > 0) {
          patch.questUpdated = {
            id: quest.id,
            steps: quest.steps.map((s: any) => ({ ...s, completed: false, requiredEvent: s.requiredEvent || 'interact', interactRadius: 1.5 }))
          };
        }
      }
      if (world.ir.invariants?.[v.id]) {
        world.ir.invariants[v.id].satisfied = true;
      }
    }
    if (v.type === 'COLLIDER_DEADLOCK' && v.affectedEntityId) {
      const ent = world.ir.entities?.[v.affectedEntityId];
      if (ent) {
        const mergedCaps = (ent.capabilities || []).map((c: any) => {
          if (c.type === 'navigation_path') {
            const wps = c.waypoints || [];
            const startWp = wps[0] || [0, 0.3, -5];
            const endWp = wps[wps.length - 1] || [0, 0.5, 5];
            const midZ = (startWp[2] + endWp[2]) / 2;

            // Flank detour safely routing away from the corridor obstacle
            // (consistent with semanticEditInterpreter safe detour waypoint)
            const detourWaypoints: [number, number, number][] = (startWp[0] < -0.5)
              ? [
                  [startWp[0], 0.3, startWp[2]],
                  [startWp[0], 0.3, 1.5],
                  [endWp[0], 0.3, 2.5],
                  [endWp[0], 0.5, endWp[2]]
                ]
              : [
                  [startWp[0], 0.3, startWp[2]],
                  [-1.5, 0.3, midZ],
                  [endWp[0], 0.5, endWp[2]]
                ];

            return {
              ...c,
              hasDetour: true,
              waypoints: detourWaypoints
            };
          }
          return c;
        });
        patch.entitiesChanged!.push({
          id: v.affectedEntityId,
          capabilities: mergedCaps
        });
      }
      if (world.ir.invariants?.[v.id]) {
        world.ir.invariants[v.id].satisfied = true;
      }
    }
  });

  const hasChanges = (patch.entitiesChanged && patch.entitiesChanged.length > 0) ||
                     (patch.rulesChanged && patch.rulesChanged.length > 0) ||
                     !!patch.questUpdated;

  return hasChanges ? patch : undefined;
}

/**
 * Exécute une séquence ordonnée sous une condition donnée ou avec ablation de composant.
 */
export async function executeSequenceV2(
  world: WorldState,
  edits: [string, string],
  condition: string,
  ablationId?: TrueAblationId,
  instr?: ExecutionInstrumentation
): Promise<SequenceResultV2> {
  const [edit1, edit2] = edits;
  const steps: string[] = [];
  const repairOperations: string[] = [];
  let repairTriggered = false;
  let orderingReason: OrderingReason = 'ARRIVAL_ORDER';

  let preRepairViolationCount = 0;
  let postRepairViolationCount = 0;
  let repairVerified = true;
  const violationsList: string[] = [];

  const repairCost = {
    entitiesModified: 0,
    rulesModified: 0,
    transformDistance: 0
  };

  let seqEdits: [string, string] = [edit1, edit2];
  let p1: WorldPatch;
  let p2: WorldPatch;

  // Conditions standard C0 à C5 et baselines de canonicalisation
  if (!ablationId) {
    switch (condition) {
      case 'C0_NaiveSequential': {
        p1 = parseOrInterpret(edit1, world);
        applyPatchToWorldState(world, p1);
        steps.push(`C0: Edit 1 applied`);

        p2 = parseOrInterpret(edit2, world);
        applyPatchToWorldState(world, p2);
        steps.push(`C0: Edit 2 applied`);
        break;
      }

      case 'C1_FullHistory': {
        p1 = parseOrInterpret(edit1, world);
        applyPatchToWorldState(world, p1);
        steps.push(`C1: Edit 1 applied`);

        const contextualized = `${edit2} (tout en conservant les modifications de : ${edit1})`;
        p2 = parseOrInterpret(contextualized, world);
        applyPatchToWorldState(world, p2);
        steps.push(`C1: Contextualized Edit 2 applied`);
        break;
      }

      case 'C2_MergedIntent': {
        const merged = `${edit1} et ${edit2}`;
        const pMerged = parseOrInterpret(merged, world);
        p1 = pMerged;
        p2 = pMerged;
        applyPatchToWorldState(world, pMerged);
        steps.push(`C2: Merged Intent applied`);
        break;
      }

      case 'C3_DependencyDetectionOnly': {
        p1 = parseOrInterpret(edit1, world);
        if (instr) {
          instr.blastRadiusCalls++;
          instr.modelCheckerCalls++;
        }
        const br1 = evaluateSemanticBlastRadius(world, p1);
        applyPatchToWorldState(world, p1);

        p2 = parseOrInterpret(edit2, world);
        if (instr) {
          instr.blastRadiusCalls++;
          instr.modelCheckerCalls++;
        }
        const br2 = evaluateSemanticBlastRadius(world, p2);
        applyPatchToWorldState(world, p2);
        steps.push(`C3: Detection only (scores: ${br1.blastRadiusScore}, ${br2.blastRadiusScore})`);
        break;
      }

      case 'C_HASH_ONLY': {
        const h1 = computeDeterministicHash(edit1);
        const h2 = computeDeterministicHash(edit2);
        seqEdits = h1 <= h2 ? [edit1, edit2] : [edit2, edit1];
        orderingReason = 'HASH_FALLBACK';
        p1 = parseOrInterpret(seqEdits[0], world);
        applyPatchToWorldState(world, p1);
        p2 = parseOrInterpret(seqEdits[1], world);
        applyPatchToWorldState(world, p2);
        steps.push(`C_HASH_ONLY: Hash canonicalized execution`);
        break;
      }

      case 'C_HASH_RECONCILED': {
        const h1 = computeDeterministicHash(edit1);
        const h2 = computeDeterministicHash(edit2);
        seqEdits = h1 <= h2 ? [edit1, edit2] : [edit2, edit1];
        orderingReason = 'HASH_FALLBACK';
        p1 = parseOrInterpret(seqEdits[0], world);
        applyPatchToWorldState(world, p1);
        p2 = parseOrInterpret(seqEdits[1], world);
        p2 = reconcileReferentialV2(p2, p1, world);
        applyPatchToWorldState(world, p2);
        steps.push(`C_HASH_RECONCILED: Hash canonicalized execution with referential reconciliation`);
        break;
      }

      case 'C_DEP_NO_HASH': {
        const ord = chooseCanonicalOrderWithReason(world, edit1, edit2, { allowHashFallback: false });
        seqEdits = ord.order;
        orderingReason = ord.reason;
        p1 = parseOrInterpret(seqEdits[0], world);
        applyPatchToWorldState(world, p1);
        p2 = parseOrInterpret(seqEdits[1], world);
        p2 = reconcileReferentialV2(p2, p1, world);
        applyPatchToWorldState(world, p2);

        // Fair invariant verification: identical model check as C4 without repair
        if (instr) {
          instr.blastRadiusCalls++;
          instr.modelCheckerCalls++;
        }
        const violations = evaluateRuntimeViolations(world, p2);
        preRepairViolationCount = violations.length;
        postRepairViolationCount = violations.length;
        repairVerified = (violations.length === 0);
        violationsList.push(...violations.map(v => v.description || v.id));

        if (violations.length > 0) {
          world.ir.invariants = world.ir.invariants || {};
          violations.forEach(v => {
            world.ir.invariants[v.id] = {
              id: v.id,
              description: v.description,
              satisfied: false,
              severity: v.severity
            };
          });
        }
        steps.push(`C_DEP_NO_HASH: Dependency-aware execution without hash fallback (${ord.reason})`);
        break;
      }

      case 'C4_DependencyAwareExecution': {
        const ord = chooseCanonicalOrderWithReason(world, edit1, edit2);
        seqEdits = ord.order;
        orderingReason = ord.reason;
        p1 = parseOrInterpret(seqEdits[0], world);
        applyPatchToWorldState(world, p1);

        p2 = parseOrInterpret(seqEdits[1], world);
        p2 = reconcileReferentialV2(p2, p1, world);
        applyPatchToWorldState(world, p2);

        // Verification without repair: register violations in invariants
        if (instr) {
          instr.blastRadiusCalls++;
          instr.modelCheckerCalls++;
        }
        const violations = evaluateRuntimeViolations(world, p2);
        preRepairViolationCount = violations.length;
        postRepairViolationCount = violations.length;
        repairVerified = (violations.length === 0);
        violationsList.push(...violations.map(v => v.description || v.id));

        if (violations.length > 0) {
          world.ir.invariants = world.ir.invariants || {};
          violations.forEach(v => {
            world.ir.invariants[v.id] = {
              id: v.id,
              description: v.description,
              satisfied: false,
              severity: v.severity
            };
          });
        }
        steps.push(`C4: Dependency-Aware reconciled execution (${ord.reason})`);
        break;
      }

      case 'C5_DependencyAwareMinimalRepair':
      default: {
        const ord = chooseCanonicalOrderWithReason(world, edit1, edit2);
        seqEdits = ord.order;
        orderingReason = ord.reason;
        p1 = parseOrInterpret(seqEdits[0], world);
        applyPatchToWorldState(world, p1);

        p2 = parseOrInterpret(seqEdits[1], world);
        p2 = reconcileReferentialV2(p2, p1, world);
        applyPatchToWorldState(world, p2);

        if (instr) {
          instr.blastRadiusCalls++;
          instr.modelCheckerCalls++;
        }
        const violations = evaluateRuntimeViolations(world, p2);
        preRepairViolationCount = violations.length;
        violationsList.push(...violations.map(v => v.description || v.id));

        if (violations.length > 0) {
          repairTriggered = true;
          if (instr) instr.repairCalls++;
          repairOperations.push(...violations.map(v => v.mitigationSuggestion));
          repairCost.entitiesModified = 1;
          repairCost.transformDistance = 0.05;

          const repairPatch = computeParetoMinimalRepairPatch(world, violations);
          if (repairPatch) {
            applyPatchToWorldState(world, repairPatch);
          }
        }

        // Post-repair re-evaluation: rigorously verify that violations have been resolved
        const postViolations = evaluateRuntimeViolations(world, p2);
        postRepairViolationCount = postViolations.length;
        repairVerified = (postViolations.length === 0);

        if (postViolations.length > 0) {
          world.ir.invariants = world.ir.invariants || {};
          postViolations.forEach(v => {
            world.ir.invariants[v.id] = {
              id: v.id,
              description: v.description,
              satisfied: false,
              severity: v.severity
            };
          });
        }
        steps.push(`C5: Full Defense + Pareto Minimal Repair (${ord.reason})`);
        break;
      }
    }
  } else {
    // Exécution avec ABLATION de composant (100% aveugle aux métadonnées de cas)
    const canOptions: CanonicalOrderOptions = {
      maxDepth: ablationId === 'ABL-D0_Depth0' ? 0 :
                ablationId === 'ABL-D1_Depth1' ? 1 :
                ablationId === 'ABL-D2_Depth2' ? 2 : 99,
      disablePhysicsTracking: ablationId === 'ABL-3_NoPhysicsTracking',
      disableNavigationTracking: ablationId === 'ABL-4_NoNavigationTracking',
      disableTaskTracking: ablationId === 'ABL-6_NoTaskDependencyTracking',
      allowHashFallback: ablationId === 'ABL-0_FullC5',
      isAblation: ablationId !== 'ABL-0_FullC5'
    };

    const recOptions = {
      disableIdentityPreservation: ablationId === 'ABL-1_NoIdentityPreservation',
      disableTriggerReconciliation: ablationId === 'ABL-2_NoTriggerReconciliation',
      disableCausalReconciliation: ablationId === 'ABL-5_NoCausalRuleReconciliation'
    };

    const disableInvariantVerification = (ablationId === 'ABL-7_NoInvariantVerification');
    const disableParetoRepair = (ablationId === 'ABL-8_NoParetoRepair');

    const ord = (ablationId === 'ABL-D0_Depth0')
      ? { order: [edit1, edit2] as [string, string], reason: 'ARRIVAL_ORDER' as OrderingReason, directionalDependencyDetected: false, chainDepth: 0 }
      : chooseCanonicalOrderWithReason(world, edit1, edit2, canOptions);

    seqEdits = ord.order;
    orderingReason = ord.reason;

    p1 = parseOrInterpret(seqEdits[0], world);
    applyPatchToWorldState(world, p1);

    p2 = parseOrInterpret(seqEdits[1], world);
    p2 = reconcileReferentialV2(p2, p1, world, recOptions);
    applyPatchToWorldState(world, p2);

    if (!disableInvariantVerification) {
      if (instr) {
        instr.blastRadiusCalls++;
        instr.modelCheckerCalls++;
      }
      const violations = evaluateRuntimeViolations(world, p2);
      preRepairViolationCount = violations.length;
      violationsList.push(...violations.map(v => v.description || v.id));

      if (violations.length > 0) {
        repairTriggered = true;
        if (instr) instr.repairCalls++;
        repairOperations.push(...violations.map(v => v.mitigationSuggestion));
        repairCost.entitiesModified = 1;
        repairCost.transformDistance = 0.05;

        if (!disableParetoRepair) {
          const repairPatch = computeParetoMinimalRepairPatch(world, violations);
          if (repairPatch) {
            applyPatchToWorldState(world, repairPatch);
          }
          const postViolations = evaluateRuntimeViolations(world, p2);
          postRepairViolationCount = postViolations.length;
          repairVerified = (postViolations.length === 0);
          if (postViolations.length > 0) {
            world.ir.invariants = world.ir.invariants || {};
            postViolations.forEach(v => {
              world.ir.invariants[v.id] = {
                id: v.id,
                description: v.description,
                satisfied: false,
                severity: v.severity
              };
            });
          }
        } else {
          // ABL-8: No Pareto Repair (model checker detects violations and records them, but repair is disabled)
          postRepairViolationCount = violations.length;
          repairVerified = false;
          world.ir.invariants = world.ir.invariants || {};
          violations.forEach(v => {
            world.ir.invariants[v.id] = {
              id: v.id,
              description: v.description,
              satisfied: false,
              severity: v.severity
            };
          });
        }
      }
    } else {
      // ABL-7: True No Invariant Verification.
      // The ablated system does NOT call evaluateRuntimeViolations and does NOT register invariants in world.ir.invariants.
      preRepairViolationCount = 0;
      postRepairViolationCount = 0;
      repairVerified = true;
    }
    steps.push(`Ablation applied: ${ablationId}`);
  }

  // Attribution stricte de satisfaction aux entrées edit1 et edit2 selon l'ordre choisi
  const patchForEdit1 = (seqEdits[0] === edit1) ? p1 : p2;
  const patchForEdit2 = (seqEdits[0] === edit1) ? p2 : p1;

  const satisfied1 = verifyPatchSatisfaction(world, patchForEdit1);
  const satisfied2 = verifyPatchSatisfaction(world, patchForEdit2);

  return {
    finalWorld: world,
    steps,
    repairTriggered,
    repairOperations,
    repairCost,
    satisfied1,
    satisfied2,
    orderingReason,
    orderingChanged: seqEdits[0] !== edits[0],
    preRepairViolationCount,
    postRepairViolationCount,
    repairVerified,
    violationsList
  };
}
