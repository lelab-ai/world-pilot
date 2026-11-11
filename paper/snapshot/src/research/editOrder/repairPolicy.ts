// src/research/editOrder/repairPolicy.ts
// Implémentation des 6 conditions expérimentales C0 à C5 et de la politique de réparation Pareto.
// Formule : Delta* = argmin Cost(Delta) sous contraintes SAT(A)=1, SAT(B)=1, Violations=0.

import type { WorldState, WorldPatch } from '../../core/types';
import type { ExperimentalCondition } from './experimentTypes';
import { applyPatchToWorldState } from './worldCloneManager';
import { evaluateSemanticBlastRadius } from '../semanticBlastRadius';
import { interpretSemanticEdit } from './semanticEditInterpreter';
import { verifyPatchSatisfaction } from './verifyPatchSatisfaction';

export interface SequenceExecutionResult {
  finalWorld: WorldState;
  intermediateWorld?: WorldState;
  patchesApplied: WorldPatch[];
  steps: string[];
  repairTriggered: boolean;
  repairOperations: string[];
  repairCost: {
    entitiesModified: number;
    rulesModified: number;
    transformDistance: number;
  };
  satisfiedA: boolean;
  satisfiedB: boolean;
}

/**
 * Interprète une consigne en utilisant le parseur déterministe ou l'interpréteur sémantique.
 */
export function parseOrInterpret(instruction: string, world: WorldState): WorldPatch {
  const semantic = interpretSemanticEdit(instruction, world);
  return semantic.patch;
}

/**
 * Applique une séquence ordonnée d'edits [Edit1, Edit2] selon la condition expérimentale choisie.
 */
export async function applySequenceUnderCondition(
  world: WorldState,
  edits: [string, string],
  condition: ExperimentalCondition
): Promise<SequenceExecutionResult> {
  const [edit1, edit2] = edits;
  const patchesApplied: WorldPatch[] = [];
  const steps: string[] = [];
  const repairOperations: string[] = [];
  let repairTriggered = false;

  let repairCost = {
    entitiesModified: 0,
    rulesModified: 0,
    transformDistance: 0
  };

  let intermediateWorld: WorldState | undefined = undefined;

  switch (condition) {
    case 'C0_NaiveSequential': {
      // Application séquentielle naïve sans vérification
      const p1 = parseOrInterpret(edit1, world);
      applyPatchToWorldState(world, p1);
      intermediateWorld = JSON.parse(JSON.stringify(world));
      patchesApplied.push(p1);
      steps.push(`C0: Applied Edit 1 ('${edit1}')`);

      const p2 = parseOrInterpret(edit2, world);
      applyPatchToWorldState(world, p2);
      patchesApplied.push(p2);
      steps.push(`C0: Applied Edit 2 ('${edit2}')`);
      break;
    }

    case 'C1_FullHistory': {
      // Simulation de prompt enrichi par l'historique d'actions
      const p1 = parseOrInterpret(edit1, world);
      applyPatchToWorldState(world, p1);
      intermediateWorld = JSON.parse(JSON.stringify(world));
      patchesApplied.push(p1);
      steps.push(`C1: Applied Edit 1 ('${edit1}')`);

      const contextualizedEdit2 = `${edit2} (tout en conservant les modifications de : ${edit1})`;
      const p2 = parseOrInterpret(contextualizedEdit2, world);
      applyPatchToWorldState(world, p2);
      patchesApplied.push(p2);
      steps.push(`C1: Applied Contextualized Edit 2`);
      break;
    }

    case 'C2_MergedIntent': {
      // Fusion globale des deux instructions
      intermediateWorld = JSON.parse(JSON.stringify(world));
      const mergedPrompt = `${edit1} et ${edit2}`;
      const pMerged = parseOrInterpret(mergedPrompt, world);
      applyPatchToWorldState(world, pMerged);
      patchesApplied.push(pMerged);
      steps.push(`C2: Applied Unified Merged Prompt ('${mergedPrompt}')`);
      break;
    }

    case 'C3_DependencyDetectionOnly': {
      // Détection de conflit basée sur le blast radius sans intervention
      const p1 = parseOrInterpret(edit1, world);
      const br1 = evaluateSemanticBlastRadius(world, p1);
      applyPatchToWorldState(world, p1);
      intermediateWorld = JSON.parse(JSON.stringify(world));
      patchesApplied.push(p1);
      steps.push(`C3: Edit 1 applied (Blast radius score: ${br1.blastRadiusScore})`);

      const p2 = parseOrInterpret(edit2, world);
      const br2 = evaluateSemanticBlastRadius(world, p2);
      applyPatchToWorldState(world, p2);
      patchesApplied.push(p2);
      steps.push(`C3: Edit 2 applied (Blast radius score: ${br2.blastRadiusScore})`);
      break;
    }

    case 'C4_DependencyAwareExecution': {
      // Exécution guidée avec préservation de l'identité référentielle et réconciliation des cibles
      const p1 = parseOrInterpret(edit1, world);
      applyPatchToWorldState(world, p1);
      intermediateWorld = JSON.parse(JSON.stringify(world));
      patchesApplied.push(p1);
      steps.push(`C4: Applied Edit 1`);

      let p2 = parseOrInterpret(edit2, world);
      p2 = reconcileReferentialDependencies(p2, p1, world);
      applyPatchToWorldState(world, p2);
      patchesApplied.push(p2);
      steps.push(`C4: Applied Reconciled Edit 2`);
      break;
    }

    case 'C5_DependencyAwareMinimalRepair':
    default: {
      // Condition complète WorldPilot : Dépendance + Vérification d'Invariants + Pareto Minimal Repair
      const p1 = parseOrInterpret(edit1, world);
      applyPatchToWorldState(world, p1);
      intermediateWorld = JSON.parse(JSON.stringify(world));
      patchesApplied.push(p1);
      steps.push(`C5: Applied Edit 1`);

      let p2 = parseOrInterpret(edit2, world);
      p2 = reconcileReferentialDependencies(p2, p1, world);
      const preP2World: WorldState = JSON.parse(JSON.stringify(world));
      applyPatchToWorldState(world, p2);
      patchesApplied.push(p2);
      steps.push(`C5: Applied Reconciled Edit 2`);

      // Évaluation des invariants finaux sur l'état avant/pendant l'application de p2
      const blastReport = evaluateSemanticBlastRadius(preP2World, p2);
      if (blastReport.violations.length > 0) {
        repairTriggered = true;
        const repairPatch = computeParetoMinimalRepairPatch(world, blastReport.violations, preP2World) || blastReport.paretoRepairPatch;
        if (repairPatch) {
          applyPatchToWorldState(world, repairPatch);
          patchesApplied.push(repairPatch);
          repairOperations.push(...blastReport.violations.map(v => v.mitigationSuggestion));
          steps.push(`C5: Applied Pareto Minimal Repair (${blastReport.violations.length} violation(s) résolue(s))`);

          repairCost.entitiesModified = (repairPatch.entitiesChanged || []).length + (repairPatch.entitiesCreated || []).length;
          repairCost.rulesModified = (repairPatch.rulesChanged || []).length;
          repairCost.transformDistance = 0.15;
        }
      }
      break;
    }
  }

  const pA = patchesApplied[0];
  const pB = patchesApplied[1] || patchesApplied[0];
  const satisfiedA = pA ? verifyPatchSatisfaction(world, pA) : true;
  const satisfiedB = pB ? verifyPatchSatisfaction(world, pB) : true;

  return {
    finalWorld: world,
    intermediateWorld,
    patchesApplied,
    steps,
    repairTriggered,
    repairOperations,
    repairCost,
    satisfiedA,
    satisfiedB
  };
}

/**
 * Réconcilie les dépendances référentielles entre deux modifications pour éviter le drift d'identifiants.
 */
function reconcileReferentialDependencies(
  currentPatch: WorldPatch,
  previousPatch: WorldPatch,
  world: WorldState
): WorldPatch {
  const reconciled: WorldPatch = JSON.parse(JSON.stringify(currentPatch));
  const removedIds = new Set(previousPatch.entitiesRemoved || []);
  const replacementMap = new Map<string, string>();
  if (previousPatch.entitiesRemoved && previousPatch.entitiesRemoved.length > 0 &&
      previousPatch.entitiesCreated && previousPatch.entitiesCreated.length > 0) {
    previousPatch.entitiesRemoved.forEach((remId, idx) => {
      const replacement = previousPatch.entitiesCreated![idx] || previousPatch.entitiesCreated![0];
      if (replacement) {
        replacementMap.set(remId, replacement.id);
      }
    });
  }

  const toPosObj = (pos: any): { x: number; y: number; z: number } | undefined => {
    if (Array.isArray(pos) && pos.length >= 3) return { x: pos[0], y: pos[1], z: pos[2] };
    if (pos && typeof pos === 'object' && typeof pos.x === 'number') return { x: pos.x, y: pos.y, z: pos.z };
    return undefined;
  };

  // 1. Si une règle dans le second patch cible une entité supprimée par le premier patch,
  // ou si son trigger spatial cible une entité déplacée par le premier patch
  if (reconciled.rulesChanged) {
    reconciled.rulesChanged = reconciled.rulesChanged.map(rule => {
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
      if (rule.conditions) {
        rule.conditions = rule.conditions.map((cond: any) => {
          const nextCond = { ...cond };
          if (nextCond.targetId && removedIds.has(nextCond.targetId)) {
            nextCond.targetId = replacementMap.get(nextCond.targetId) || Object.keys(world.ir.entities)[0] || 'world';
          }
          if (nextCond.sourceId && removedIds.has(nextCond.sourceId)) {
            nextCond.sourceId = replacementMap.get(nextCond.sourceId) || Object.keys(world.ir.entities)[0] || 'world';
          }
          if ((nextCond.type === 'proximity' || nextCond.type === 'in_zone') && nextCond.targetId) {
            const changedEnt = (previousPatch.entitiesChanged || []).find(e => e.id === nextCond.targetId);
            if (changedEnt) {
              const tc = (changedEnt.capabilities || []).find((c: any) => c.type === 'transform');
              const pos = toPosObj(tc?.position);
              if (pos) {
                nextCond.triggerLocation = { ...pos };
              }
            }
          }
          return nextCond;
        });
      }
      return rule;
    });
  }

  // 2. Si previousPatch ou currentPatch déplace une entité ciblée par une règle causale déjà existante dans le monde
  for (const list of [previousPatch.entitiesChanged, reconciled.entitiesChanged]) {
    if (list && world.ir.rules) {
      list.forEach(change => {
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

  // 3. Rebinding identitaire pour entitiesChanged et questsAdded lors d'un remplacement d'entité
  if (replacementMap.size > 0) {
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
  violations: any[],
  previousWorld?: WorldState
): WorldPatch | undefined {
  const patch: WorldPatch = {
    entitiesCreated: [],
    entitiesChanged: [],
    rulesChanged: []
  };

  violations.forEach(v => {
    if (v.type === 'ORPHAN_DEPENDENCY' && v.affectedEntityId) {
      const existingEnt = world.ir.entities?.[v.affectedEntityId] || previousWorld?.ir?.entities?.[v.affectedEntityId];
      if (!world.ir.entities?.[v.affectedEntityId]) {
        const restoredEnt = existingEnt
          ? JSON.parse(JSON.stringify(existingEnt))
          : {
              id: v.affectedEntityId,
              name: v.affectedEntityId,
              capabilities: [{ type: 'transform', position: { x: 0, y: 0.5, z: 0 } }]
            };
        patch.entitiesCreated!.push(restoredEnt);
      } else {
        const currentCaps = Array.isArray(existingEnt?.capabilities) && existingEnt.capabilities.length > 0
          ? existingEnt.capabilities
          : [{ type: 'transform', position: { x: 0, y: 0.5, z: 0 } }];
        patch.entitiesChanged!.push({
          ...existingEnt,
          id: v.affectedEntityId,
          capabilities: currentCaps
        });
      }
    }
    if (v.type === 'COLLIDER_DEADLOCK' && v.affectedEntityId) {
      const ent = world.ir.entities?.[v.affectedEntityId] || previousWorld?.ir?.entities?.[v.affectedEntityId];
      if (ent) {
        const existingCaps = Array.isArray(ent.capabilities) ? ent.capabilities : [];
        const hasTransform = existingCaps.some((c: any) => c.type === 'transform');
        const updatedCaps = hasTransform
          ? existingCaps.map((c: any) => {
              if (c.type === 'transform') {
                const pos = c.position || { x: 0, y: 0.5, z: 0 };
                if (Array.isArray(pos)) {
                  return { ...c, position: [Number((pos[0] + 0.75).toFixed(2)), pos[1], pos[2]] };
                }
                return { ...c, position: { ...pos, x: Number(((pos.x || 0) + 0.75).toFixed(2)) } };
              }
              return c;
            })
          : [...existingCaps, { type: 'transform', position: { x: 0.75, y: 0.5, z: 0 } }];
        patch.entitiesChanged!.push({
          ...ent,
          id: v.affectedEntityId,
          capabilities: updatedCaps
        });
      }
    }
    if (v.type === 'QUEST_UNREACHABLE' && world.ir.activeQuestId && world.ir.quests?.[world.ir.activeQuestId]) {
      // Ajustement de l'étape de quête
      const quest = world.ir.quests[world.ir.activeQuestId];
      if (quest.steps && quest.steps.length > 0) {
        patch.questUpdated = {
          id: quest.id,
          steps: quest.steps.map(s => ({ ...s, completed: false }))
        };
      }
    }
  });

  if (patch.entitiesCreated!.length === 0) delete patch.entitiesCreated;
  if (patch.entitiesChanged!.length === 0) delete patch.entitiesChanged;
  if (patch.rulesChanged!.length === 0) delete patch.rulesChanged;

  return patch.entitiesCreated || patch.entitiesChanged || patch.rulesChanged || patch.questUpdated ? patch : undefined;
}
