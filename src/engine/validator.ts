import { WorldPatch, WorldState } from '../core/types';

const BUILTIN_RULE_ACTORS = new Set<string>(['player', 'system', 'world']);

export function validateWorld(state: WorldState): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  const knownPartIds = new Set<string>();
  for (const entity of Object.values(state.ir.entities)) {
    for (const part of entity.parts || []) {
      if (part.id) knownPartIds.add(part.id);
    }
  }
  const hasEntityOrPart = (id: string): boolean =>
    Boolean(BUILTIN_RULE_ACTORS.has(id) || state.ir.entities[id] || knownPartIds.has(id));

  // 1. Cross-layer consistency check: Every rule's conditions must reference existing entities or sub-parts
  for (const rule of Object.values(state.ir.rules)) {
    for (const cond of rule.conditions) {
      if (cond.type === 'is_source' && cond.sourceId) {
        if (!hasEntityOrPart(cond.sourceId)) {
          errors.push(`Rule ${rule.id} references non-existent sourceId: ${cond.sourceId}`);
        }
      }
      if (cond.type === 'is_target' && cond.targetId) {
        if (!hasEntityOrPart(cond.targetId)) {
          errors.push(`Rule ${rule.id} references non-existent targetId: ${cond.targetId}`);
        }
      }
    }
  }

  // 2. Capabilities check: An entity cannot have a trigger_zone without a collider
  for (const entity of Object.values(state.ir.entities)) {
    const hasTriggerZone = entity.capabilities.some(c => c.type === 'trigger_zone');
    const hasCollider = entity.capabilities.some(c => c.type === 'collider');
    if (hasTriggerZone && !hasCollider) {
      errors.push(`Entity ${entity.id} has a trigger_zone but no collider.`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates a candidate patch against a projected copy of the current world.
 * This is a preflight only; the store still validates the committed state.
 */
export function validateWorldPatch(state: WorldState, patch: WorldPatch): { valid: boolean; errors: string[] } {
  const entities = { ...state.ir.entities };
  for (const id of patch.entitiesRemoved || []) delete entities[id];
  for (const entity of patch.entitiesCreated || []) {
    if (Array.isArray(entity.capabilities) && entity.capabilities.some(c => c.type === 'trigger_zone') && !entity.capabilities.some(c => c.type === 'collider')) {
      entity.capabilities.push({ type: 'collider' });
    }
    const existing = entities[entity.id];
    entities[entity.id] = existing
      ? { ...existing, ...entity, capabilities: entity.capabilities || existing.capabilities, visuals: { ...existing.visuals, ...entity.visuals } }
      : entity;
  }
  for (const entity of patch.entitiesChanged || []) {
    if (!entity.id || !entities[entity.id]) continue;
    if (Array.isArray(entity.capabilities) && entity.capabilities.some(c => c.type === 'trigger_zone') && !entity.capabilities.some(c => c.type === 'collider')) {
      entity.capabilities.push({ type: 'collider' });
    }
    const previous = entities[entity.id];
    entities[entity.id] = {
      ...previous,
      ...entity,
      capabilities: entity.capabilities || previous.capabilities,
      visuals: { ...previous.visuals, ...entity.visuals }
    };
  }

  const rules = { ...state.ir.rules };
  for (const rule of patch.rulesChanged || []) {
    if (!rule.id) continue;
    rules[rule.id] = { ...(rules[rule.id] || {}), ...rule } as (typeof rules)[string];
  }

  // Mirror applyPatch's entity replacement rebinding and orphan rule pruning on entitiesRemoved
  if (patch.entitiesRemoved && patch.entitiesRemoved.length > 0) {
    const removedIds = patch.entitiesRemoved;
    const createdEntities = patch.entitiesCreated || [];
    const replacementMap = new Map<string, string>();
    if (removedIds.length === 1 && createdEntities.length === 1 && createdEntities[0].id) {
      replacementMap.set(removedIds[0], createdEntities[0].id);
    } else if (createdEntities.length > 0 && removedIds.length === createdEntities.length) {
      removedIds.forEach((oldId, idx) => {
        if (createdEntities[idx]?.id) {
          replacementMap.set(oldId, createdEntities[idx].id);
        }
      });
    }

    const unreplacedRemovedSet = new Set(removedIds.filter(id => !replacementMap.has(id) && !entities[id]));

    for (const [rId, rule] of Object.entries(rules)) {
      if (!rule || !Array.isArray(rule.conditions)) continue;
      let rebindNeeded = false;
      const reboundConditions = rule.conditions.map(cond => {
        if (cond.type === 'is_source' && cond.sourceId && replacementMap.has(cond.sourceId)) {
          rebindNeeded = true;
          return { ...cond, sourceId: replacementMap.get(cond.sourceId)! };
        }
        if (cond.type === 'is_target' && cond.targetId && replacementMap.has(cond.targetId)) {
          rebindNeeded = true;
          return { ...cond, targetId: replacementMap.get(cond.targetId)! };
        }
        return cond;
      });
      if (rebindNeeded) {
        rules[rId] = { ...rule, conditions: reboundConditions };
      }
      const referencesDeletedEntity = (rules[rId].conditions || []).some(
        c =>
          (c.type === 'is_source' && c.sourceId && unreplacedRemovedSet.has(c.sourceId)) ||
          (c.type === 'is_target' && c.targetId && unreplacedRemovedSet.has(c.targetId))
      );
      if (referencesDeletedEntity) {
        delete rules[rId];
      }
    }
  }

  const quests = { ...(state.ir.quests || {}) };
  for (const quest of patch.questsAdded || []) quests[quest.id] = quest;
  if (patch.questUpdated) {
    const questId = patch.questUpdated.id || patch.activeQuestId || state.ir.activeQuestId;
    if (questId && quests[questId]) quests[questId] = { ...quests[questId], ...patch.questUpdated };
  }

  const candidate: WorldState = {
    ...state,
    ir: {
      ...state.ir,
      entities,
      rules,
      quests,
      activeQuestId: patch.activeQuestId !== undefined ? patch.activeQuestId : state.ir.activeQuestId
    }
  };
  return validateWorld(candidate);
}
