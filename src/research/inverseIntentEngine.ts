/**
 * Inverse Intent Engine (IIE)
 * Research Pillar: Runtime Emergent Affordances via Inverse Intent Discrepancy
 * Target Publication: ACM UIST / ACM SIGGRAPH (Systems & Spatial Interaction)
 */

import { WorldState, WorldPatch, RuleSpec, EntitySpec } from '../core/types';

export type GestureType = 'DROP' | 'STRIKE' | 'POUR' | 'INSERT' | 'HEAT' | 'MEASURE';

export interface UnanticipatedInteraction {
  id: string;
  timestamp: number;
  sourceEntityId: string;
  targetEntityId: string;
  gestureType: GestureType;
  spatialDistance: number; // in meters
  approachVelocity: number; // in m/s
  gazeDwellMs: number;
  repetitionCount: number;
  intentConfidence: number; // [0, 1]
  status: 'observed' | 'speculative' | 'promoted' | 'rejected';
  synthesizedRule?: RuleSpec;
  hypotheticalEffect: string;
}

export interface ShadowCausalGraph {
  observations: UnanticipatedInteraction[];
  promotedRulesCount: number;
  affordanceGapIndex: number; // Ratio of attempted vs authored affordances
}

export function createInitialShadowGraph(): ShadowCausalGraph {
  return {
    observations: [],
    promotedRulesCount: 0,
    affordanceGapIndex: 0,
  };
}

/**
 * 3D Inverse Intent Scoring
 * Evaluates whether an unfulfilled physical interaction stems from motor noise or deliberate human intent.
 * Based on 3D Fitts' Law index of difficulty & ocular fixation dwell time.
 */
export function calculateIntentConfidence(
  spatialDistance: number,
  approachVelocity: number,
  gazeDwellMs: number,
  repetitionCount: number
): number {
  // Bounded distance factor: closer distance implies deliberate targeting
  const distanceFactor = Math.max(0, 1 - Math.min(1, spatialDistance / 0.5));
  
  // Controlled velocity factor: abrupt chaotic motions are filtered out; controlled deceleration implies targeting
  const velocityFactor = approachVelocity < 2.5 ? Math.max(0.2, 1 - approachVelocity / 3.0) : 0.1;
  
  // Gaze dwell: fixating on the contact point for > 200ms is a strong neurological marker of intent
  const gazeFactor = Math.min(1.0, gazeDwellMs / 300);
  
  // Persistence multiplier: repeated trials exponentially increase intent likelihood
  const persistenceFactor = Math.min(1.5, 1.0 + (repetitionCount - 1) * 0.25);

  const rawScore = (distanceFactor * 0.35 + velocityFactor * 0.25 + gazeFactor * 0.40) * persistenceFactor;
  return Number(Math.min(1.0, Math.max(0.0, rawScore)).toFixed(3));
}

/**
 * Infers the semantic hypothesis and synthesizes a candidate rule
 */
export function inferCandidateRule(
  source: EntitySpec,
  target: EntitySpec,
  gesture: GestureType
): { rule: RuleSpec; hypotheticalEffect: string } {
  const sourceName = source.name || source.id;
  const targetName = target.name || target.id;
  const ruleId = `emergent_rule_${source.id}_on_${target.id}_${gesture.toLowerCase()}`;

  const isSingleEntity = source.id === target.id;
  const isDropFamily = !isSingleEntity && (gesture === 'DROP' || gesture === 'POUR' || gesture === 'INSERT');
  let hypotheticalEffect = '';
  const rule: RuleSpec = {
    id: ruleId,
    trigger: isDropFamily ? 'DROP' : 'INTERACTION',
    conditions: isSingleEntity
      ? [{ type: 'is_source', sourceId: source.id, property: 'sourceId', op: '==', value: source.id }]
      : [
          { type: 'is_source', sourceId: source.id, property: 'sourceId', op: '==', value: source.id },
          { type: 'is_target', targetId: target.id, property: 'targetId', op: '==', value: target.id },
        ],
    actions: [],
  };

  switch (gesture) {
    case 'POUR':
    case 'DROP':
      hypotheticalEffect = isSingleEntity
        ? `Tentative de manipulation ou déplacement de ${sourceName}.`
        : `Interaction physique réactive entre ${sourceName} et ${targetName}.`;
      rule.actions.push({
        type: 'set_flag',
        flag: isSingleEntity ? `manipulated_${source.id}` : `interacted_${target.id}_with_${source.id}`,
        value: true,
      });
      rule.actions.push({
        type: 'play_sound',
        sound: 'switch_click',
      });
      break;

    case 'HEAT':
      hypotheticalEffect = `Transfert thermique et réaction d'activation calorifique sur ${targetName}.`;
      rule.actions.push({
        type: 'set_flag',
        flag: `temperature_${target.id}`,
        value: 100,
      });
      rule.actions.push({
        type: 'play_sound',
        sound: 'sizzle',
      });
      break;

    case 'INSERT':
      hypotheticalEffect = `Connexion mécanique et couplage d'alimentation entre ${sourceName} et ${targetName}.`;
      rule.actions.push({
        type: 'set_flag',
        flag: `powerState_${target.id}`,
        value: 'ACTIVE',
      });
      rule.actions.push({
        type: 'play_sound',
        sound: 'chime',
      });
      break;

    case 'STRIKE':
    case 'MEASURE':
    default:
      hypotheticalEffect = `Impulsion cinétique et résonance acoustique transmise à ${targetName}.`;
      rule.actions.push({
        type: 'set_flag',
        flag: `excited_${target.id}`,
        value: true,
      });
      rule.actions.push({
        type: 'play_sound',
        sound: 'bell',
      });
      break;
  }

  return { rule, hypotheticalEffect };
}

/**
 * Registers an unanticipated human interaction in the Shadow Causal Graph.
 * If confidence >= threshold (0.75), proposes a candidate rule for formal verification.
 */
export function recordUnanticipatedInteraction(
  shadowGraph: ShadowCausalGraph,
  world: WorldState,
  sourceId: string,
  targetId: string,
  gesture: GestureType,
  metrics: { spatialDistance: number; approachVelocity: number; gazeDwellMs: number }
): { updatedGraph: ShadowCausalGraph; candidateInteraction?: UnanticipatedInteraction } {
  const entities = world.ir?.entities || (world as any).entities || {};
  const source = entities[sourceId];
  const target = (targetId && entities[targetId]) ? entities[targetId] : source;
  if (!source) {
    return { updatedGraph: shadowGraph };
  }
  const effectiveTargetId = target ? target.id : sourceId;

  // Check for prior attempts to evaluate persistence
  const existing = shadowGraph.observations.find(
    o => o.sourceEntityId === sourceId && o.targetEntityId === effectiveTargetId && o.gestureType === gesture
  );
  const repetitionCount = existing ? existing.repetitionCount + 1 : 1;

  const confidence = calculateIntentConfidence(
    metrics.spatialDistance,
    metrics.approachVelocity,
    metrics.gazeDwellMs,
    repetitionCount
  );

  const { rule, hypotheticalEffect } = inferCandidateRule(source, target, gesture);

  const newRecord: UnanticipatedInteraction = {
    id: existing?.id || `unanticipated_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: Date.now(),
    sourceEntityId: sourceId,
    targetEntityId: effectiveTargetId,
    gestureType: gesture,
    spatialDistance: metrics.spatialDistance,
    approachVelocity: metrics.approachVelocity,
    gazeDwellMs: metrics.gazeDwellMs,
    repetitionCount,
    intentConfidence: confidence,
    status: existing?.status === 'promoted' ? 'promoted' : (confidence >= 0.75 ? 'speculative' : 'observed'),
    synthesizedRule: existing?.synthesizedRule || rule,
    hypotheticalEffect,
  };

  const updatedObservations = existing
    ? shadowGraph.observations.map(o => (o.id === existing.id ? newRecord : o))
    : [newRecord, ...shadowGraph.observations].slice(0, 50);

  const rules = world.ir?.rules || (world as any).rules || {};
  const totalAuthoredRules = Object.keys(rules).length || 1;
  const gapIndex = Number((updatedObservations.length / totalAuthoredRules).toFixed(2));

  const updatedGraph: ShadowCausalGraph = {
    ...shadowGraph,
    observations: updatedObservations,
    affordanceGapIndex: gapIndex,
  };

  return {
    updatedGraph,
    candidateInteraction: confidence >= 0.75 ? newRecord : undefined,
  };
}

/**
 * Promotes a speculative interaction into a validated WorldPatch
 */
export function promoteInteractionToPatch(
  interaction: UnanticipatedInteraction
): WorldPatch | null {
  if (!interaction.synthesizedRule) return null;

  return {
    rulesChanged: [interaction.synthesizedRule],
  };
}
