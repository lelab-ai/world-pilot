import { WorldIR, WorldPatch } from '../core/types';
import { v4 as uuidv4 } from 'uuid';

export interface SemanticReplacementRecord {
  from: string;
  to: string;
  fromName?: string;
  toName?: string;
}

export interface EditRecord {
  edit_id: string;
  world_version_before: number;
  world_version_after: number;
  original_instruction: string;
  command_plan: any;
  patch: WorldPatch;
  entities_created: string[];
  entities_removed: string[];
  entities_changed: string[];
  rules_changed: string[];
  replaced_entities: SemanticReplacementRecord[];
  rewired_rules: string[];
  rewired_quest_steps: string[];
  warnings: string[];
  cheap_check_results: {
    status: 'ok' | 'warning' | 'violation';
    rulesRewiredCount: number;
    questStepsRewiredCount: number;
    invariantsCount: number;
  };
  timestamp: number;
}

class ObservabilityTracker {
  private records: EditRecord[] = [];

  recordEdit(
    instruction: string,
    plan: any,
    patch: WorldPatch,
    versionBefore: number,
    irBefore: WorldIR,
    irAfter: WorldIR
  ): EditRecord {
    const edit_id = `E${uuidv4().substring(0, 8)}`;

    const removedIds = patch.entitiesRemoved || [];
    const createdEntities = patch.entitiesCreated || [];
    const replaced_entities: SemanticReplacementRecord[] = [];

    if (removedIds.length > 0 && createdEntities.length > 0) {
      removedIds.forEach((oldId, idx) => {
        const replacement = createdEntities[idx] || createdEntities[0];
        if (replacement && replacement.id && replacement.id !== oldId) {
          const oldEnt = irBefore?.entities?.[oldId];
          replaced_entities.push({
            from: oldId,
            to: replacement.id,
            fromName: oldEnt?.name || oldId,
            toName: replacement.name || replacement.id,
          });
        }
      });
    }

    const rewired_rules: string[] = [];
    const rewired_quest_steps: string[] = [];

    if (replaced_entities.length > 0) {
      const toIds = new Set(replaced_entities.map(r => r.to));
      Object.values(irAfter?.rules || {}).forEach((rule: any) => {
        const usesReplacement =
          (rule.conditions || []).some(
            (c: any) => (c.sourceId && toIds.has(c.sourceId)) || (c.targetId && toIds.has(c.targetId))
          ) ||
          (rule.actions || []).some(
            (a: any) =>
              (a.entityId && toIds.has(a.entityId)) ||
              (a.targetId && toIds.has(a.targetId)) ||
              (a.sourceEntityId && toIds.has(a.sourceEntityId)) ||
              (a.targetEntityId && toIds.has(a.targetEntityId))
          );
        if (usesReplacement) {
          rewired_rules.push(rule.id);
        }
      });

      Object.values(irAfter?.quests || {}).forEach((quest: any) => {
        (quest?.steps || []).forEach((step: any) => {
          if (
            (step.targetEntityId && toIds.has(step.targetEntityId)) ||
            (step.targetZoneId && toIds.has(step.targetZoneId))
          ) {
            rewired_quest_steps.push(step.id || `${quest.id}_step`);
          }
        });
      });
    }

    const invariantsCount = Object.keys(irAfter?.invariants || {}).length;

    const record: EditRecord = {
      edit_id,
      world_version_before: versionBefore,
      world_version_after: versionBefore + 1,
      original_instruction: instruction,
      command_plan: plan,
      patch,
      entities_created: createdEntities.map(e => e.id),
      entities_removed: removedIds,
      entities_changed: patch.entitiesChanged?.map(e => e.id!) || [],
      rules_changed: patch.rulesChanged?.map(r => r.id!) || [],
      replaced_entities,
      rewired_rules,
      rewired_quest_steps,
      warnings: [],
      cheap_check_results: {
        status: 'ok',
        rulesRewiredCount: rewired_rules.length,
        questStepsRewiredCount: rewired_quest_steps.length,
        invariantsCount,
      },
      timestamp: Date.now(),
    };

    this.records.push(record);
    console.log(`[Observability] Recorded edit ${edit_id}:`, record);
    return record;
  }

  getRecords(): EditRecord[] {
    return this.records;
  }
}

export const tracker = new ObservabilityTracker();
