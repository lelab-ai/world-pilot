/**
 * Semantic Blast Radius (SBR) Engine
 * Research Pillar: Differential Causal Invariant Checking & Pareto Minimal Repair
 * Target Publication: IEEE VR / CAV / POPL (Formal Methods in Spatial & Generative Systems)
 */

import { WorldState, WorldPatch, WorldEvent } from '../core/types';
import { findCounterExample } from '../simulation/simulator';

export interface BlastRadiusViolation {
  id: string;
  severity: 'CRITICAL' | 'WARNING' | 'NOTICE';
  type: 'QUEST_UNREACHABLE' | 'COLLIDER_DEADLOCK' | 'INVARIANT_BROKEN' | 'ORPHAN_DEPENDENCY';
  affectedEntityId?: string;
  affectedRuleId?: string;
  description: string;
  mitigationSuggestion: string;
}

export interface BlastRadiusReport {
  timestamp: number;
  patchSummary: {
    entitiesCreatedCount: number;
    entitiesChangedCount: number;
    entitiesRemovedCount: number;
    rulesChangedCount: number;
  };
  impactedEntityIds: string[];
  impactedRuleIds: string[];
  blastRadiusScore: number; // 0.0 (strictly local) to 1.0 (systemic global impact)
  isRegressionFree: boolean;
  violations: BlastRadiusViolation[];
  paretoRepairPatch?: WorldPatch;
}

/**
 * Calculates the Causal Blast Radius and checks for backward semantic regressions
 */
export function evaluateSemanticBlastRadius(
  initialWorld: WorldState,
  proposedPatch: WorldPatch
): BlastRadiusReport {
  const impactedEntityIds = new Set<string>();
  const impactedRuleIds = new Set<string>();
  const violations: BlastRadiusViolation[] = [];

  const entities = initialWorld.ir?.entities || (initialWorld as any).entities || {};
  const rules = initialWorld.ir?.rules || (initialWorld as any).rules || {};
  const quests = initialWorld.ir?.quests || (initialWorld as any).quests || {};
  const activeQuestId = initialWorld.ir?.activeQuestId || (initialWorld as any).activeQuestId;

  // 1. Identify directly mutated entities and rules
  (proposedPatch.entitiesCreated || []).forEach(e => impactedEntityIds.add(e.id));
  (proposedPatch.entitiesChanged || []).forEach(e => { if (e.id) impactedEntityIds.add(e.id); });
  (proposedPatch.entitiesRemoved || []).forEach(id => impactedEntityIds.add(id));
  (proposedPatch.rulesChanged || []).forEach(r => { if (r.id) impactedRuleIds.add(r.id); });

  // 1b. Spatial Zone, Corridor, and Proximity Impact
  const toPosObj = (pos: any): { x: number; y: number; z: number } | undefined => {
    if (Array.isArray(pos) && pos.length >= 3) {
      return { x: Number(pos[0]) || 0, y: Number(pos[1]) || 0, z: Number(pos[2]) || 0 };
    }
    if (pos && typeof pos === 'object' && ('x' in pos || 'y' in pos || 'z' in pos)) {
      return { x: Number(pos.x) || 0, y: Number(pos.y) || 0, z: Number(pos.z) || 0 };
    }
    return undefined;
  };
  const patchPositions: { x: number; y: number; z: number }[] = [];
  const patchWaypoints: { x: number; z: number }[] = [];

  const inspectCapabilities = (caps: any[] = []) => {
    caps.forEach(c => {
      if (c.type === 'transform' && c.position) {
        const pObj = toPosObj(c.position);
        if (pObj) patchPositions.push(pObj);
      }
      if (Array.isArray(c.waypoints)) {
        c.waypoints.forEach((wp: any) => {
          if (Array.isArray(wp)) {
            patchWaypoints.push({ x: wp[0], z: wp[2] ?? wp[1] });
          } else if (wp && typeof wp === 'object') {
            patchWaypoints.push({ x: wp.x ?? 0, z: wp.z ?? 0 });
          }
        });
      }
      if (c.targetId) {
        impactedEntityIds.add(c.targetId);
      }
    });
  };

  (proposedPatch.entitiesCreated || []).forEach(e => inspectCapabilities(e.capabilities));
  (proposedPatch.entitiesChanged || []).forEach(e => inspectCapabilities(e.capabilities));

  // Check spatial containment in zones / corridors and proximity to existing entities
  Object.values(entities).forEach((existingEnt: any) => {
    const caps = existingEnt.capabilities || [];
    const zoneCap = caps.find((c: any) => (c.type === 'zone' || c.type === 'corridor' || c.bounds) && c.bounds);
    const tc = caps.find((c: any) => c.type === 'transform' && c.position);
    const tcPos = toPosObj(tc?.position);

    // Corridor / Zone containment check
    if (zoneCap && zoneCap.bounds) {
      const b = zoneCap.bounds;
      const posInside = patchPositions.some(p => p.x >= b.minX && p.x <= b.maxX && p.z >= b.minZ && p.z <= b.maxZ);
      const wpInside = patchWaypoints.some(w => w.x >= b.minX && w.x <= b.maxX && w.z >= b.minZ && w.z <= b.maxZ);
      if (posInside || wpInside) {
        impactedEntityIds.add(existingEnt.id);
      }
    }

    // Proximity / Obstruction check (within 1.2m of an existing entity)
    if (tcPos) {
      const isNearbyPos = patchPositions.some(p => {
        const dx = p.x - tcPos.x;
        const dz = p.z - tcPos.z;
        return Math.hypot(dx, dz) <= 1.2;
      });
      const isNearbyWp = patchWaypoints.some(w => {
        const dx = w.x - tcPos.x;
        const dz = w.z - tcPos.z;
        return Math.hypot(dx, dz) <= 1.2;
      });
      if (isNearbyPos || isNearbyWp) {
        impactedEntityIds.add(existingEnt.id);
      }
    }
  });

  // 2. Identify multi-hop causal dependencies in the existing graph (transitive closure up to depth 3)
  let causalHops = 0;
  let causalChanged = true;
  while (causalChanged && causalHops < 3) {
    causalChanged = false;
    causalHops++;

    Object.values(rules).forEach((rule: any) => {
      const referencesImpactedEntity = (rule.conditions || []).some(
        (c: any) => (c.sourceId && impactedEntityIds.has(c.sourceId)) ||
                    (c.targetId && impactedEntityIds.has(c.targetId)) ||
                    (c.entityA && impactedEntityIds.has(c.entityA)) ||
                    (c.entityB && impactedEntityIds.has(c.entityB)) ||
                    (c.value && typeof c.value === 'string' && impactedEntityIds.has(c.value))
      ) || (rule.actions || []).some(
        (a: any) => (a.entityId && impactedEntityIds.has(a.entityId)) ||
                    (a.targetId && impactedEntityIds.has(a.targetId)) ||
                    (a.sourceEntityId && impactedEntityIds.has(a.sourceEntityId)) ||
                    (a.targetEntityId && impactedEntityIds.has(a.targetEntityId))
      );

      if (referencesImpactedEntity && !impactedRuleIds.has(rule.id)) {
        impactedRuleIds.add(rule.id);
        causalChanged = true;
      }

      if (impactedRuleIds.has(rule.id)) {
        (rule.actions || []).forEach((a: any) => {
          const target = a.targetId || a.entityId || a.targetEntityId;
          if (target && !impactedEntityIds.has(target)) {
            impactedEntityIds.add(target);
            causalChanged = true;
          }
        });
      }
    });
  }

  // 3. Check for Orphan Dependencies (e.g. removing an entity that is referenced by a required rule and not re-created)
  const createdIdsSet = new Set((proposedPatch.entitiesCreated || []).map(e => e.id).filter(Boolean));
  const effectiveRules: Record<string, any> = { ...rules };
  (proposedPatch.rulesChanged || []).forEach(r => {
    if (r.id) effectiveRules[r.id] = r;
  });

  (proposedPatch.entitiesRemoved || []).forEach(removedId => {
    if (createdIdsSet.has(removedId)) return; // Homonymous replacement preserves the entity ID
    Object.values(effectiveRules).forEach((rule: any) => {
      const isReferencedInCondition = (rule.conditions || []).some(
        (c: any) => c.sourceId === removedId || c.targetId === removedId || c.entityA === removedId || c.entityB === removedId || c.value === removedId
      );
      const isReferencedInAction = (rule.actions || []).some(
        (a: any) => a.entityId === removedId || a.targetId === removedId || a.sourceEntityId === removedId || a.targetEntityId === removedId
      );

      if (isReferencedInCondition || isReferencedInAction) {
        violations.push({
          id: `orphan_${removedId}_${rule.id}`,
          severity: 'CRITICAL',
          type: 'ORPHAN_DEPENDENCY',
          affectedEntityId: removedId,
          affectedRuleId: rule.id,
          description: `L'entité '${removedId}' supprimée est requise par la règle causale active '${rule.id}'.`,
          mitigationSuggestion: `Préserver l'entité '${removedId}' ou neutraliser la règle dépendante '${rule.id}'.`,
        });
      }
    });
  });

  // 4. Check for Quest Reachability Regressions
  const activeQuest = activeQuestId ? quests[activeQuestId] : undefined;

  if (activeQuest && activeQuest.steps) {
    activeQuest.steps.forEach((step: any, idx: number) => {
      const req = typeof step.requiredEvent === 'string' ? step.requiredEvent : '';
      const reqParts = req ? req.split(':') : [];
      const isFlag = reqParts[0]?.toUpperCase() === 'FLAG';
      const stepReferencedIds = [
        step.targetEntityId,
        step.targetZoneId,
        !isFlag ? reqParts[1] : undefined,
        !isFlag ? reqParts[2] : undefined,
      ].filter((id): id is string => Boolean(id && id !== '*' && !id.includes('any')));

      for (const refId of stepReferencedIds) {
        if ((proposedPatch.entitiesRemoved || []).includes(refId) && !createdIdsSet.has(refId)) {
          violations.push({
            id: `quest_broken_step_${idx}_${refId}`,
            severity: 'CRITICAL',
            type: 'QUEST_UNREACHABLE',
            affectedEntityId: refId,
            description: `L'étape ${idx + 1} de la quête '${activeQuest.title}' exige l'entité supprimée '${refId}'.`,
            mitigationSuggestion: `Restaurer l'entité cible ou réassigner l'objectif de la quête.`,
          });
          break;
        }
      }
    });
  }

  // 5. Differential Invariants Model Checking (Simulation of Counter-Example)
  const speculativeWorld: WorldState = {
    version: initialWorld.version || 1,
    ir: {
      entities: { ...entities },
      rules: { ...rules },
      invariants: { ...(initialWorld.ir?.invariants || (initialWorld as any).invariants || {}) },
      quests: { ...quests },
      activeQuestId,
    },
    flags: { ...(initialWorld.flags || {}) },
  };

  // Apply mutations speculatively
  (proposedPatch.entitiesRemoved || []).forEach(id => delete speculativeWorld.ir.entities[id]);
  (proposedPatch.entitiesCreated || []).forEach(e => {
    speculativeWorld.ir.entities[e.id] = e;
  });
  (proposedPatch.entitiesChanged || []).forEach(e => {
    if (e.id && speculativeWorld.ir.entities[e.id]) {
      const prev = speculativeWorld.ir.entities[e.id];
      speculativeWorld.ir.entities[e.id] = {
        ...prev,
        ...e,
        visuals: e.visuals ? { ...prev.visuals, ...e.visuals } : prev.visuals,
        capabilities: Array.isArray(e.capabilities) && e.capabilities.length > 0 ? e.capabilities : prev.capabilities,
      } as any;
    }
  });
  (proposedPatch.rulesChanged || []).forEach(r => {
    if (r.id) speculativeWorld.ir.rules[r.id] = r as any;
  });
  (proposedPatch.invariantsAdded || []).forEach(inv => {
    if (inv.id) speculativeWorld.ir.invariants[inv.id] = inv as any;
  });

  // Check invariants using formal bounded verification
  const invariantsList = speculativeWorld.ir.invariants ? Object.values(speculativeWorld.ir.invariants) : [];
  if (invariantsList.length > 0) {
    const possibleEvents: WorldEvent[] = [
      { type: 'DROP', sourceId: 'player' },
      { type: 'COMPLETE_TRAINING', sourceId: 'player' },
      { type: 'INTERACT', sourceId: 'player' },
    ];
    Object.values(speculativeWorld.ir.rules || {}).forEach((r: any) => {
      const trig = typeof r.trigger === 'string' && r.trigger.trim() ? r.trigger.trim().toUpperCase() : 'INTERACT';
      let srcId: string | undefined;
      let tgtId: string | undefined;
      (r.conditions || []).forEach((c: any) => {
        if (c.type === 'is_source' && c.sourceId) srcId = c.sourceId;
        if ((c.type === 'is_target' || c.type === 'proximity' || c.type === 'in_zone') && c.targetId) tgtId = c.targetId;
      });
      if (srcId || tgtId) {
        possibleEvents.push({
          type: trig,
          sourceId: srcId || tgtId || 'player',
          targetId: tgtId || srcId
        });
      }
    });
    const res = findCounterExample(speculativeWorld, possibleEvents, 3);
    if (res && res.invariantBroken) {
      violations.push({
        id: `invariant_regression_${res.brokenInvariantId || 'unknown'}`,
        severity: 'CRITICAL',
        type: 'INVARIANT_BROKEN',
        description: `Un invariant formel est violé par le patch. Invariant brisé : ${res.brokenInvariantId || 'inconnu'}`,
        mitigationSuggestion: `Ajuster les conditions de garde pour interdire la séquence contrefactuelle.`,
      });
    }
  }

  // 6. Compute Spatial Obstruction Deadlocks
  const toVec3Tuple = (raw: any): [number, number, number] | undefined => {
    if (!raw) return undefined;
    if (Array.isArray(raw) && raw.length >= 3) {
      return [Number(raw[0]) || 0, Number(raw[1]) || 0, Number(raw[2]) || 0];
    }
    if (typeof raw === 'object' && ('x' in raw || 'y' in raw || 'z' in raw)) {
      return [Number(raw.x) || 0, Number(raw.y) || 0, Number(raw.z) || 0];
    }
    return undefined;
  };

  let paretoRepairPatch: WorldPatch | undefined = undefined;
  const changedEntities = proposedPatch.entitiesChanged || [];
  for (const changed of changedEntities) {
    const rawChangedPos =
      (changed as any).transform?.position ||
      (changed as any).capabilities?.find((c: any) => c.type === 'transform')?.position;
    const changedPos = toVec3Tuple(rawChangedPos);

    if (changedPos && changed.id) {
      if (activeQuest && activeQuest.steps) {
        for (const step of activeQuest.steps) {
          const req = typeof step.requiredEvent === 'string' ? step.requiredEvent : '';
          const reqParts = req ? req.split(':') : [];
          const candidateTargetIds = Array.from(
            new Set(
              [
                step.targetEntityId,
                step.targetZoneId,
                reqParts[0]?.toUpperCase() !== 'FLAG' ? reqParts[1] : undefined,
              ].filter((id): id is string => Boolean(id))
            )
          );
          for (const stepTargetId of candidateTargetIds) {
            if (stepTargetId && stepTargetId !== changed.id) {
              const targetEnt = speculativeWorld.ir.entities[stepTargetId];
              if (targetEnt) {
                const rawTargetPos =
                  (targetEnt as any).transform?.position ||
                  (targetEnt as any).capabilities?.find((c: any) => c.type === 'transform')?.position;
                const targetPos: [number, number, number] = toVec3Tuple(rawTargetPos) || [0, 0, 0];

                const dx = changedPos[0] - targetPos[0];
                const dz = changedPos[2] - targetPos[2];
                const dist = Math.sqrt(dx * dx + dz * dz);
                if (dist < 0.35) {
                  violations.push({
                    id: `collider_deadlock_${changed.id}`,
                    severity: 'WARNING',
                    type: 'COLLIDER_DEADLOCK',
                    affectedEntityId: changed.id,
                    description: `Le déplacement de '${changed.id}' obstrue la zone d'accès de l'objectif '${targetEnt.name || targetEnt.id}' (distance: ${dist.toFixed(2)}m).`,
                    mitigationSuggestion: `Décaler l'entité d'au moins 0.6m pour préserver le volume d'accès utilisateur.`,
                  });

                  const angle = Math.atan2(dz, dx) || 0;
                  const safeDistance = 0.75;
                  const repairedPosition: [number, number, number] = [
                    Number((targetPos[0] + Math.cos(angle) * safeDistance).toFixed(2)),
                    changedPos[1],
                    Number((targetPos[2] + Math.sin(angle) * safeDistance).toFixed(2)),
                  ];
                  const repairedPosObj = {
                    x: repairedPosition[0],
                    y: repairedPosition[1],
                    z: repairedPosition[2],
                  };
                  const existingEnt = speculativeWorld.ir.entities[changed.id];
                  const existingCaps = Array.isArray(existingEnt?.capabilities) ? existingEnt.capabilities : [];
                  const updatedCaps = existingCaps.length > 0
                    ? existingCaps.map((c: any) =>
                        c.type === 'transform'
                          ? { ...c, position: Array.isArray(c.position) ? repairedPosition : repairedPosObj }
                          : c
                      )
                    : [{ type: 'transform', position: Array.isArray(rawChangedPos) ? repairedPosition : repairedPosObj }];

                  paretoRepairPatch = {
                    entitiesChanged: [
                      {
                        ...(existingEnt || {}),
                        id: changed.id,
                        capabilities: updatedCaps,
                      } as any,
                    ],
                  };
                }
              }
            }
          }
        }
      }
    }
  }

  // 7. Calculate Blast Radius Score
  const totalEntities = Math.max(1, Object.keys(entities).length);
  const totalRules = Math.max(1, Object.keys(rules).length);
  const entityFraction = impactedEntityIds.size / totalEntities;
  const ruleFraction = impactedRuleIds.size / totalRules;
  const blastRadiusScore = Number(Math.min(1.0, entityFraction * 0.6 + ruleFraction * 0.4).toFixed(3));

  const isRegressionFree = violations.filter(v => v.severity === 'CRITICAL').length === 0;

  return {
    timestamp: Date.now(),
    patchSummary: {
      entitiesCreatedCount: (proposedPatch.entitiesCreated || []).length,
      entitiesChangedCount: (proposedPatch.entitiesChanged || []).length,
      entitiesRemovedCount: (proposedPatch.entitiesRemoved || []).length,
      rulesChangedCount: (proposedPatch.rulesChanged || []).length,
    },
    impactedEntityIds: Array.from(impactedEntityIds),
    impactedRuleIds: Array.from(impactedRuleIds),
    blastRadiusScore,
    isRegressionFree,
    violations,
    paretoRepairPatch,
  };
}
