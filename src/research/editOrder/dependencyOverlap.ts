// src/research/editOrder/dependencyOverlap.ts
// Calcul du chevauchement structurel des dépendances causales (Dependency Overlap).
// Formule : J(A, B) = |BR(A) ∩ BR(B)| / |BR(A) ∪ BR(B)| avec pondérations inter-couches.

import type { WorldState, WorldPatch } from '../../core/types';
import { evaluateSemanticBlastRadius, BlastRadiusReport } from '../semanticBlastRadius';

export const DEPENDENCY_EDGE_WEIGHTS = {
  visual: 1,
  transform: 1,
  collider: 2,
  navigation: 3,
  trigger: 4,
  causalRule: 5,
  questDependency: 5,
  safetyInvariant: 6
};

export interface DependencyOverlapMetrics {
  jaccardOverlap: number;       // 0.0 à 1.0 (non pondéré)
  weightedOverlap: number;      // 0.0 à 1.0 (pondéré selon criticité causale)
  sharedEntityCount: number;
  sharedRuleCount: number;
  causalGraphDistance: number;  // Distance en nombre de sauts
  centralityImpact: number;     // Mesure de centralité des nœuds impactés
  blastRadiusA: BlastRadiusReport;
  blastRadiusB: BlastRadiusReport;
}

/**
 * Évalue le chevauchement structurel entre deux modifications candidates A et B sur un monde W0.
 */
export function computeDependencyOverlap(
  world: WorldState,
  patchA: WorldPatch,
  patchB: WorldPatch
): DependencyOverlapMetrics {
  const brA = evaluateSemanticBlastRadius(world, patchA);
  const brB = evaluateSemanticBlastRadius(world, patchB);

  const setEntA = new Set(brA.impactedEntityIds);
  const setEntB = new Set(brB.impactedEntityIds);

  const setRuleA = new Set(brA.impactedRuleIds);
  const setRuleB = new Set(brB.impactedRuleIds);

  // Union & Intersection des entités
  const sharedEntities = [...setEntA].filter(id => setEntB.has(id));
  const unionEntities = new Set([...setEntA, ...setEntB]);

  // Union & Intersection des règles
  const sharedRules = [...setRuleA].filter(id => setRuleB.has(id));
  const unionRules = new Set([...setRuleA, ...setRuleB]);

  const totalShared = sharedEntities.length + sharedRules.length;
  const totalUnion = unionEntities.size + unionRules.size;

  const jaccardOverlap = totalUnion === 0 ? 0 : Math.round((totalShared / totalUnion) * 1000) / 1000;

  // Calcul pondéré
  let weightedSharedSum = 0;
  let weightedUnionSum = 0;

  sharedEntities.forEach(_id => {
    weightedSharedSum += DEPENDENCY_EDGE_WEIGHTS.collider;
  });
  sharedRules.forEach(_id => {
    weightedSharedSum += DEPENDENCY_EDGE_WEIGHTS.causalRule;
  });

  unionEntities.forEach(_id => {
    weightedUnionSum += DEPENDENCY_EDGE_WEIGHTS.collider;
  });
  unionRules.forEach(_id => {
    weightedUnionSum += DEPENDENCY_EDGE_WEIGHTS.causalRule;
  });

  const weightedOverlap = weightedUnionSum === 0 ? 0 : Math.round((weightedSharedSum / weightedUnionSum) * 1000) / 1000;

  // Distance causale symétrique (si intersection directe: 0, si voisins A<->B: 1, sinon: 2)
  let causalGraphDistance = 2;
  if (sharedEntities.length > 0 || sharedRules.length > 0) {
    causalGraphDistance = 0;
  } else {
    const allRulesMap: Record<string, any> = { ...(world.ir?.rules || {}) };
    (patchA.rulesChanged || []).forEach(r => { if (r.id) allRulesMap[r.id] = r; });
    (patchB.rulesChanged || []).forEach(r => { if (r.id) allRulesMap[r.id] = r; });

    const ruleTouchesEntitySet = (ruleIds: Set<string>, entSet: Set<string>): boolean => {
      for (const ruleId of ruleIds) {
        const r = allRulesMap[ruleId];
        if (!r) continue;
        if ((r.actions || []).some((a: any) => entSet.has(a.targetId || a.entityId))) return true;
        if ((r.conditions || []).some((c: any) => entSet.has(c.targetId || c.sourceId || c.value))) return true;
      }
      return false;
    };

    const isNeighbor =
      ruleTouchesEntitySet(setRuleA, setEntB) ||
      ruleTouchesEntitySet(setRuleB, setEntA);
    causalGraphDistance = isNeighbor ? 1 : 2;
  }

  // Centralité estimée (nombre de règles connectées aux entités touchées)
  const centralityImpact = Math.min(1.0, (setRuleA.size + setRuleB.size) / 8);

  return {
    jaccardOverlap,
    weightedOverlap,
    sharedEntityCount: sharedEntities.length,
    sharedRuleCount: sharedRules.length,
    causalGraphDistance,
    centralityImpact,
    blastRadiusA: brA,
    blastRadiusB: brB
  };
}
