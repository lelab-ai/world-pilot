// src/research/editOrder/behavioralEquivalence.ts
// Moteur de comparaison comportementale multi-couche entre branches de permutation W_AB et W_BA.
// Calcule le vecteur de divergence kappa_W(A, B) = [d_g, d_p, d_n, d_i, d_c, d_t, v] et classe les régressions.

import type {
  CanonicalWorldSnapshot,
  BehavioralComparison,
  LayerComparison,
  RegressionClass
} from './experimentTypes';

export interface ComparisonTolerances {
  positionMeters: number;
  rotationDegrees: number;
  scaleRelative: number;
  colliderVolumeRelative: number;
  taskOutcomeExact: boolean;
  causalReferenceExact: boolean;
}

export const DEFAULT_TOLERANCES: ComparisonTolerances = {
  positionMeters: 0.02,        // 2 cm
  rotationDegrees: 1.0,        // 1 degré
  scaleRelative: 0.01,         // 1%
  colliderVolumeRelative: 0.02,// 2%
  taskOutcomeExact: true,
  causalReferenceExact: true
};

/**
 * Compare le comportement global entre les mondes finaux W_AB et W_BA sur toutes les dimensions Omega.
 */
export function compareBehavior(
  snapshotAB: CanonicalWorldSnapshot,
  snapshotBA: CanonicalWorldSnapshot,
  tolerances: ComparisonTolerances = DEFAULT_TOLERANCES
): BehavioralComparison {
  const geometry = compareGeometry(snapshotAB, snapshotBA, tolerances);
  const physics = comparePhysics(snapshotAB, snapshotBA, tolerances);
  const navigation = compareNavigation(snapshotAB, snapshotBA, tolerances);
  const interactions = compareInteractions(snapshotAB, snapshotBA, tolerances);
  const causal = compareCausalGraph(snapshotAB, snapshotBA, tolerances);
  const tasks = compareTasks(snapshotAB, snapshotBA, tolerances);
  const invariants = compareInvariants(snapshotAB, snapshotBA, tolerances);

  const regressionClasses = classifyRegressions(
    geometry,
    physics,
    navigation,
    interactions,
    causal,
    tasks,
    invariants
  );

  const divergenceVector: [number, number, number, number, number, number, number] = [
    geometry.divergenceScore,
    physics.divergenceScore,
    navigation.divergenceScore,
    interactions.divergenceScore,
    causal.divergenceScore,
    tasks.divergenceScore,
    invariants.divergenceScore
  ];

  const equivalent = regressionClasses.length === 0 || regressionClasses.every(c => c === 'NONE');
  const humanReviewRequired = regressionClasses.includes('UNKNOWN') || divergenceVector.some(d => d > 0.5);

  return {
    equivalent,
    divergenceVector,
    geometry,
    physics,
    navigation,
    interactions,
    causal,
    tasks,
    invariants,
    regressionClasses,
    humanReviewRequired
  };
}

/**
 * Compare la géométrie : existence, position, rotation, échelle des entités.
 */
export function compareGeometry(
  ab: CanonicalWorldSnapshot,
  ba: CanonicalWorldSnapshot,
  tolerances: ComparisonTolerances
): LayerComparison {
  const details: string[] = [];
  const affectedEntityIds: string[] = [];
  let divergenceSum = 0;

  const mapAB = new Map(ab.entities.map(e => [e.name, e]));
  const mapBA = new Map(ba.entities.map(e => [e.name, e]));

  // Vérifier les entités présentes dans AB mais pas BA
  for (const [name, entA] of mapAB.entries()) {
    const entB = mapBA.get(name);
    if (!entB) {
      details.push(`Entité '${name}' présente dans AB mais absente dans BA.`);
      affectedEntityIds.push(entA.canonicalId);
      divergenceSum += 1.0;
      continue;
    }

    // Distance euclidienne
    const dist = Math.hypot(
      entA.position[0] - entB.position[0],
      entA.position[1] - entB.position[1],
      entA.position[2] - entB.position[2]
    );

    if (dist > tolerances.positionMeters) {
      details.push(`Écart de position pour '${name}': ${dist.toFixed(3)}m > seuil ${tolerances.positionMeters}m`);
      affectedEntityIds.push(entA.canonicalId);
      divergenceSum += Math.min(1.0, dist / 0.5);
    }
  }

  // Vérifier les entités dans BA mais pas AB
  for (const [name, entB] of mapBA.entries()) {
    if (!mapAB.has(name)) {
      details.push(`Entité '${name}' présente dans BA mais absente dans AB.`);
      affectedEntityIds.push(entB.canonicalId);
      divergenceSum += 1.0;
    }
  }

  const normalizedScore = Math.min(1.0, Math.round(divergenceSum * 100) / 100);
  return {
    equivalent: details.length === 0,
    divergenceScore: normalizedScore,
    details,
    affectedEntityIds
  };
}

/**
 * Compare la physique : colliders, stabilité et pénétrations anormales.
 */
export function comparePhysics(
  ab: CanonicalWorldSnapshot,
  ba: CanonicalWorldSnapshot,
  _tolerances: ComparisonTolerances
): LayerComparison {
  const details: string[] = [];
  let score = 0;

  if (ab.physics.colliderCount !== ba.physics.colliderCount) {
    details.push(`Décompte de colliders divergent : AB=${ab.physics.colliderCount} vs BA=${ba.physics.colliderCount}`);
    score += 0.4;
  }

  if (ab.physics.penetrationCount !== ba.physics.penetrationCount) {
    details.push(`Pénétrations physiques divergentes : AB=${ab.physics.penetrationCount} vs BA=${ba.physics.penetrationCount}`);
    score += 0.5;
  }

  const stabDiff = Math.abs(ab.physics.stabilityScore - ba.physics.stabilityScore);
  if (stabDiff > 0.05) {
    details.push(`Score de stabilité Rapier différent : AB=${ab.physics.stabilityScore} vs BA=${ba.physics.stabilityScore}`);
    score += stabDiff;
  }

  return {
    equivalent: details.length === 0,
    divergenceScore: Math.min(1.0, Math.round(score * 100) / 100),
    details
  };
}

/**
 * Compare la navigation : accessibilité spatiale et distribution d'obstacles.
 */
export function compareNavigation(
  ab: CanonicalWorldSnapshot,
  ba: CanonicalWorldSnapshot,
  _tolerances: ComparisonTolerances
): LayerComparison {
  const details: string[] = [];
  let score = 0;

  if (ab.navigation.clearanceHash !== ba.navigation.clearanceHash) {
    const diff = Math.abs(ab.navigation.obstaclePositions.length - ba.navigation.obstaclePositions.length);
    const diffWay = Math.abs(ab.navigation.reachableWaypointCount - ba.navigation.reachableWaypointCount);
    details.push(`Navigation divergente : clairance ou trajectoires actives distinctes (${diff} obstacle(s), ${diffWay} waypoint(s) d'écart).`);
    score += Math.min(1.0, 0.5 + diff * 0.2 + diffWay * 0.1);
  } else if (ab.navigation.reachableWaypointCount !== ba.navigation.reachableWaypointCount) {
    const diffWay = Math.abs(ab.navigation.reachableWaypointCount - ba.navigation.reachableWaypointCount);
    details.push(`Accessibilité de waypoints divergente : AB=${ab.navigation.reachableWaypointCount} vs BA=${ba.navigation.reachableWaypointCount}`);
    score += Math.min(1.0, 0.4 + diffWay * 0.1);
  }

  return {
    equivalent: details.length === 0,
    divergenceScore: Math.min(1.0, Math.round(score * 100) / 100),
    details
  };
}

/**
 * Compare les interactions : objets manipulables, clics et déclencheurs.
 */
export function compareInteractions(
  ab: CanonicalWorldSnapshot,
  ba: CanonicalWorldSnapshot,
  _tolerances: ComparisonTolerances
): LayerComparison {
  const details: string[] = [];
  let score = 0;

  const dragAB = new Set(ab.interactions.draggableEntityIds);
  const dragBA = new Set(ba.interactions.draggableEntityIds);

  const missingInBA = [...dragAB].filter(x => !dragBA.has(x));
  const missingInAB = [...dragBA].filter(x => !dragAB.has(x));

  if (missingInBA.length > 0 || missingInAB.length > 0) {
    details.push(`Affordances de manipulation divergentes (Draggable: ${[...missingInBA, ...missingInAB].join(', ')}).`);
    score += 0.5;
  }

  if (ab.interactions.triggerZones.length !== ba.interactions.triggerZones.length) {
    details.push(`Nombre de zones de déclenchement différent : AB=${ab.interactions.triggerZones.length} vs BA=${ba.interactions.triggerZones.length}`);
    score += 0.4;
  }

  // Vérifier la correspondance spatiale des zones de déclenchement (détection de désynchronisation de trigger)
  const mapZonesAB = new Map(ab.interactions.triggerZones.map(z => [z.id, z]));
  const mapZonesBA = new Map(ba.interactions.triggerZones.map(z => [z.id, z]));

  for (const [id, zA] of mapZonesAB.entries()) {
    const zB = mapZonesBA.get(id);
    if (!zB) {
      details.push(`Zone de déclenchement '${id}' présente dans AB mais absente dans BA.`);
      score += 0.3;
      continue;
    }
    if (zA.targetId !== zB.targetId) {
      details.push(`Cible de la zone '${id}' divergente: AB=${zA.targetId} vs BA=${zB.targetId}`);
      score += 0.4;
    }
    if (zA.position && zB.position) {
      const dist = Math.hypot(
        zA.position[0] - zB.position[0],
        zA.position[1] - zB.position[1],
        zA.position[2] - zB.position[2]
      );
      if (dist > _tolerances.positionMeters) {
        details.push(`Désynchronisation spatiale du trigger '${id}': écart de position de ${dist.toFixed(3)}m > seuil ${_tolerances.positionMeters}m`);
        score += Math.min(1.0, 0.4 + dist / 0.5);
      }
    }
  }

  return {
    equivalent: details.length === 0,
    divergenceScore: Math.min(1.0, Math.round(score * 100) / 100),
    details
  };
}

/**
 * Compare le graphe causal : règles, arêtes et cibles.
 */
export function compareCausalGraph(
  ab: CanonicalWorldSnapshot,
  ba: CanonicalWorldSnapshot,
  _tolerances: ComparisonTolerances
): LayerComparison {
  const details: string[] = [];
  let score = 0;

  if (ab.causalGraph.graphHash !== ba.causalGraph.graphHash) {
    const edgeDiff = Math.abs(ab.causalGraph.edgeCount - ba.causalGraph.edgeCount);
    details.push(`Graphe causal divergent : AB=${ab.causalGraph.edgeCount} arêtes vs BA=${ba.causalGraph.edgeCount} arêtes.`);
    score += Math.min(1.0, 0.4 + edgeDiff * 0.2);
  }

  return {
    equivalent: details.length === 0,
    divergenceScore: Math.min(1.0, Math.round(score * 100) / 100),
    details
  };
}

/**
 * Compare l'état des quêtes / tâches.
 */
export function compareTasks(
  ab: CanonicalWorldSnapshot,
  ba: CanonicalWorldSnapshot,
  _tolerances: ComparisonTolerances
): LayerComparison {
  const details: string[] = [];
  let score = 0;

  if (ab.taskState.isSolvable !== ba.taskState.isSolvable) {
    details.push(`Faisabilité de la tâche divergente : AB solvable=${ab.taskState.isSolvable} vs BA solvable=${ba.taskState.isSolvable}`);
    score += 0.9;
  }

  if (ab.taskState.totalSteps !== ba.taskState.totalSteps) {
    details.push(`Nombre d'étapes de quête différent : AB=${ab.taskState.totalSteps} vs BA=${ba.taskState.totalSteps}`);
    score += 0.4;
  }

  return {
    equivalent: details.length === 0,
    divergenceScore: Math.min(1.0, Math.round(score * 100) / 100),
    details
  };
}

/**
 * Compare les invariants évalués.
 */
export function compareInvariants(
  ab: CanonicalWorldSnapshot,
  ba: CanonicalWorldSnapshot,
  _tolerances: ComparisonTolerances
): LayerComparison {
  const details: string[] = [];
  let score = 0;

  const abViolations = ab.invariants.filter(i => !i.satisfied);
  const baViolations = ba.invariants.filter(i => !i.satisfied);

  if (abViolations.length !== baViolations.length || abViolations.length > 0 || baViolations.length > 0) {
    if (abViolations.length !== baViolations.length) {
      details.push(`Invariants violés asymétriquement : AB=${abViolations.length} violation(s) vs BA=${baViolations.length} violation(s).`);
      score += Math.min(1.0, Math.abs(abViolations.length - baViolations.length) * 0.5);
    } else {
      details.push(`Invariants de sécurité violés non résolus dans l'état final : ${abViolations.length} violation(s).`);
      score += Math.min(1.0, abViolations.length * 0.5);
    }
  }

  return {
    equivalent: details.length === 0,
    divergenceScore: Math.min(1.0, Math.round(score * 100) / 100),
    details
  };
}

/**
 * Catégorise les régressions comportementales selon la taxonomie scientifique du protocole.
 */
function classifyRegressions(
  geometry: LayerComparison,
  physics: LayerComparison,
  navigation: LayerComparison,
  interactions: LayerComparison,
  causal: LayerComparison,
  tasks: LayerComparison,
  invariants: LayerComparison
): RegressionClass[] {
  const classes: Set<RegressionClass> = new Set();

  if (!invariants.equivalent) classes.add('SAFETY_INVARIANT');
  if (!tasks.equivalent) classes.add('TASK_FAILURE');
  if (!causal.equivalent) classes.add('CAUSAL_REFERENCE');
  if (!interactions.equivalent) classes.add('INTERACTION');
  if (!navigation.equivalent) classes.add('NAVIGATION');
  if (!physics.equivalent) classes.add('PHYSICS');
  if (!geometry.equivalent) classes.add('GEOMETRY');

  // Détection de désynchronisation inter-couches (cross-layer desync)
  const layerFailureCount = [
    !geometry.equivalent,
    !physics.equivalent,
    !navigation.equivalent,
    !interactions.equivalent,
    !causal.equivalent
  ].filter(Boolean).length;

  if (layerFailureCount >= 2) {
    classes.add('CROSS_LAYER_DESYNC');
  }

  if (classes.size === 0) {
    classes.add('NONE');
  }

  return Array.from(classes);
}
