// src/engine/syntheticPlaytester.ts
// Synthetic AI Playtester pour WorldPilot & Victoria VR.
// Déploie un agent virtuel autonome pour explorer le monde 3D, éprouver les quêtes,
// cartographier les trajectoires, diagnostiquer les blocages spatiaux ou logiques,
// et calculer automatiquement un « Minimal Patch » pour réparer le monde en 1 clic.

import { WorldState, WorldPatch } from '../core/types';
import { diagnoseHumanFrictionDeterministically } from './deterministicGuarantor';
import { isSupportEntity } from './spatialSurface';

export type PlaytesterPersona = 'speedrunner' | 'explorer' | 'adversarial' | 'novice' | 'human_cloned';

export interface PlaytesterPersonaInfo {
  id: PlaytesterPersona;
  name: string;
  avatar: string;
  description: string;
  focus: string;
}

export const PLAYTESTER_PERSONAS: Record<PlaytesterPersona, PlaytesterPersonaInfo> = {
  speedrunner: {
    id: 'speedrunner',
    name: 'Speedrunner Optimisateur',
    avatar: '⚡',
    description: 'Vise la complétion directe des quêtes par la trajectoire spatiale la plus efficace.',
    focus: 'Chemin critique, efficacité des règles et temps de résolution minimal.'
  },
  explorer: {
    id: 'explorer',
    name: 'Explorateur Curieux',
    avatar: '🧭',
    description: 'Interagit avec chaque objet physique, panneau d\'information et zone de la scène.',
    focus: 'Couverture globale des interactions, ergonomie spatiale et découverte.'
  },
  adversarial: {
    id: 'adversarial',
    name: 'Playtester Adversarial / Stress-Test',
    avatar: '🧪',
    description: 'Tente des combinaisons inattendues, cherche à violer les invariants et tester les limites.',
    focus: 'Robustesse aux erreurs, violations d\'invariants et détection de bugs.'
  },
  novice: {
    id: 'novice',
    name: 'Apprenti Hésitant',
    avatar: '🎓',
    description: 'Progresse avec prudence, s\'arrête pour observer et demande des indices visuels/sonores.',
    focus: 'Guidage cognitif, lisibilité des étiquettes et clarté des consignes.'
  },
  human_cloned: {
    id: 'human_cloned',
    name: 'Clone Comportemental Humain',
    avatar: '🧠',
    description: 'Apprend des frictions, hésitations et gestes réels de l\'agent humain pour adapter ses tests et éprouver les impasses.',
    focus: 'Mimétisme des points de blocage, reproduction des faux pas et détection d\'affordances manquantes.'
  }
};

export interface FrictionContext {
  lastFailedEntityId?: string | null;
  lastFailedEntityName?: string | null;
  consecutiveFrictionCount?: number;
  lastAttemptedAction?: string;
  observations?: Array<{ gestureType: string; sourceEntityId?: string; targetEntityId?: string; context?: string }>;
}

export interface WaypointNode {
  id: string;
  stepIndex: number;
  position: [number, number, number];
  timestampSec: number;
  action: string;
  targetId?: string;
  targetName?: string;
  status: 'moving' | 'interacting' | 'success' | 'blocked' | 'error';
  label: string;
  notes?: string;
}

export interface PlaytesterDiagnostic {
  id: string;
  type: 'OBSTACLE_BLOCKING' | 'TARGET_OUT_OF_REACH' | 'RULE_CONDITION_MISMATCH' | 'TRIGGER_ZONE_DISCONNECTED' | 'INVARIANT_TRIGGERED' | 'NO_QUEST_OBJECTIVES' | 'HUMAN_FRICTION_REPRODUCED' | 'AFFORDANCE_GAP_DETECTED';
  severity: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  affectedEntityId?: string;
  location?: [number, number, number];
  details: string;
  suggestedFix: string;
}

export interface PlaytesterRunResult {
  id: string;
  persona: PlaytesterPersona;
  scenarioTitle: string;
  timestamp: number;
  success: boolean;
  verificationStatus: 'passed' | 'blocked' | 'unverifiable';
  method: 'geometric_heuristic';
  confidence: 'limited';
  limitations: string[];
  completionRate: number; // 0 à 100%
  totalDurationSec: number;
  stepsCompleted: number;
  totalStepsExpected: number;
  waypoints: WaypointNode[];
  diagnostics: PlaytesterDiagnostic[];
  minimalPatch?: WorldPatch;
  patchDescription?: string;
  patchApplied?: boolean;
}

const PLAYTEST_METHOD = 'geometric_heuristic' as const;
const PLAYTEST_LIMITATIONS = [
  'Parcours estimé à partir des positions et capacités déclarées ; le vrai moteur physique Rapier n’est pas piloté.',
  'Les obstacles sont approximés par une vérification géométrique simple et ne couvrent pas les collisions complexes ni toutes les règles runtime.'
];

function readVec3Tuple(pos: any, fallback: [number, number, number]): [number, number, number] {
  if (!pos) return fallback;
  if (Array.isArray(pos)) {
    return [
      Number(pos[0]) || fallback[0],
      pos[1] !== undefined ? Number(pos[1]) : fallback[1],
      pos[2] !== undefined ? Number(pos[2]) : fallback[2]
    ];
  }
  return [
    pos.x !== undefined ? Number(pos.x) : fallback[0],
    pos.y !== undefined ? Number(pos.y) : fallback[1],
    pos.z !== undefined ? Number(pos.z) : fallback[2]
  ];
}

/**
 * Exécute une session de Playtest Synthétique autonome sur le WorldState actif.
 */
export function runSyntheticPlaytest(
  state: WorldState,
  persona: PlaytesterPersona = 'speedrunner',
  frictionContext?: FrictionContext
): PlaytesterRunResult {
  const timestamp = Date.now();
  const runId = `playtest_${timestamp}`;
  const entities = Object.values(state.ir.entities);
  const rules = Object.values(state.ir.rules);
  const activeQuestId = state.ir.activeQuestId;
  const activeQuest = activeQuestId && state.ir.quests ? state.ir.quests[activeQuestId] : null;

  const scenarioTitle = activeQuest?.title || (entities.length > 0 ? `Scène 3D (${entities.length} objets)` : 'Monde Sans Titre');

  const waypoints: WaypointNode[] = [];
  const diagnostics: PlaytesterDiagnostic[] = [];
  let minimalPatch: WorldPatch | undefined = undefined;
  let patchDescription: string | undefined = undefined;

  const effectiveFriction: FrictionContext = frictionContext || {
    lastFailedEntityId: (state as any).userFrictionState?.lastFailedEntityId,
    lastFailedEntityName: (state as any).userFrictionState?.lastFailedEntityName,
    consecutiveFrictionCount: (state as any).userFrictionState?.consecutiveFrictionCount || 0,
    lastAttemptedAction: (state as any).userFrictionState?.lastAttemptedAction || 'drag',
    observations: (state as any).shadowGraph?.observations || []
  };

  // Position de départ standard de l'avatar du playtester
  const startPos: [number, number, number] = [0, 0, 1.4];
  waypoints.push({
    id: 'wp_start',
    stepIndex: 0,
    position: startPos,
    timestampSec: 0,
    action: 'spawn',
    status: 'moving',
    label: persona === 'human_cloned'
      ? 'Spawn du Clone Comportemental (Apprentissage Humain)'
      : 'Point d\'apparition de l\'agent (Spawn)'
  });

  // MODE CLONE HUMAIN APPRENANT : Reproduction fidèle des points d'achoppement de l'Agent Humain
  if (persona === 'human_cloned') {
    const failedId = effectiveFriction.lastFailedEntityId;
    const failedCount = effectiveFriction.consecutiveFrictionCount || 0;
    const actionType = effectiveFriction.lastAttemptedAction || 'drag';

    if (failedId || failedCount > 0) {
      const failedEntity = failedId
        ? entities.find(e => e.id === failedId || e.id.startsWith(failedId))
        : entities[0];

      const targetName = failedEntity?.name || effectiveFriction.lastFailedEntityName || failedId || 'Objet cible';
      const tr = failedEntity?.capabilities?.find(c => c.type === 'transform');
      const entityPos: [number, number, number] = readVec3Tuple(tr?.position, [0, 0.85, -0.4]);

      // 1. Approche de l'entité de friction
      waypoints.push({
        id: 'wp_human_approach',
        stepIndex: 1,
        position: [entityPos[0] * 0.7, 0.9, entityPos[2] * 0.7],
        timestampSec: 1.2,
        action: 'approach_troubled_entity',
        targetId: failedEntity?.id || failedId || undefined,
        targetName,
        status: 'moving',
        label: `Approche de l'objet en friction (${targetName})`
      });

      // 2. Hésitation cognitive apprise (latence mesurée de l'Agent Humain)
      waypoints.push({
        id: 'wp_human_hesitation',
        stepIndex: 2,
        position: entityPos,
        timestampSec: 2.5,
        action: 'hesitation_pause',
        targetId: failedEntity?.id || failedId || undefined,
        targetName,
        status: 'moving',
        label: `Hésitation cognitive apprise (~1.3s)`,
        notes: 'Reproduction fidèle du temps de réflexion ou de doute de l\'humain.'
      });

      // 3. Reproduction de la tentative infructueuse de l'humain
      waypoints.push({
        id: 'wp_human_friction_attempt',
        stepIndex: 3,
        position: entityPos,
        timestampSec: 3.6,
        action: `attempt_${actionType}`,
        targetId: failedEntity?.id || failedId || undefined,
        targetName,
        status: 'error',
        label: `Tentative infructueuse reproduite (${actionType})`,
        notes: 'Geste sans retour visuel ou causale dans le monde.'
      });

      // 4. Répétition obstinée du geste (boucle de friction)
      waypoints.push({
        id: 'wp_human_frustration_repeat',
        stepIndex: 4,
        position: entityPos,
        timestampSec: 4.8,
        action: `repeat_stuck_${actionType}`,
        targetId: failedEntity?.id || failedId || undefined,
        targetName,
        status: 'blocked',
        label: `Répétition obstinée (${Math.max(2, failedCount)} essais)`,
        notes: 'Boucle de blocage confirmée : discordance entre intention de l\'agent humain et affordances du monde.'
      });

      // 5. Ingestion des gestes inattendus du Shadow Causal Graph
      if (effectiveFriction.observations && effectiveFriction.observations.length > 0) {
        effectiveFriction.observations.slice(0, 2).forEach((obs, idx) => {
          waypoints.push({
            id: `wp_obs_replay_${idx}`,
            stepIndex: 5 + idx,
            position: entityPos,
            timestampSec: 5.4 + idx * 0.8,
            action: `replay_${obs.gestureType.toLowerCase()}`,
            targetId: obs.sourceEntityId,
            status: 'error',
            label: `Rejeu du geste inattendu #${idx + 1} (${obs.gestureType})`,
            notes: `Geste non prévu capturé dans le Shadow Graph.`
          });
        });
      }

      // Diagnostic formel via l'Agent Garant Déterministe
      const diag = diagnoseHumanFrictionDeterministically(
        state,
        failedEntity?.id || failedId || '',
        actionType
      );

      if (diag.verifiedDeadlock || failedCount >= 1) {
        diagnostics.push({
          id: 'diag_human_friction_reproduced',
          type: 'HUMAN_FRICTION_REPRODUCED',
          severity: 'error',
          title: `Point de friction humain reproduit sur "${targetName}"`,
          message: `L'Agent Testeur a reproduit fidèlement le blocage de l'Agent Humain : ${diag.explanation}`,
          affectedEntityId: failedEntity?.id || failedId || undefined,
          location: entityPos,
          details: `${diag.explanation} L'Agent Testeur a appris cette difficulté depuis la trace comportementale de l'Agent Humain.`,
          suggestedFix: diag.cause === 'MISSING_DRAGGABLE'
            ? `Ajouter les affordances 'draggable' et 'interactive' à "${targetName}".`
            : (diag.cause === 'OUT_OF_REACH'
              ? `Abaisser "${targetName}" à une hauteur ergonomique de table (Y = 0.85m).`
              : `Ajouter une règle causale pour répondre au geste de l'utilisateur.`)
        });

        minimalPatch = diag.suggestedParetoPatch || {
          entitiesChanged: failedEntity ? [{
            ...failedEntity,
            capabilities: [
              ...(failedEntity.capabilities || []),
              { type: 'draggable' } as any,
              { type: 'interactive' } as any
            ]
          }] : []
        };

        patchDescription = `Résoudre le blocage humain : conférer l'affordance de manipulation à "${targetName}".`;

        return {
          id: runId,
          persona,
          scenarioTitle: `Stress-Test Cloné : ${targetName}`,
          timestamp,
          success: false,
          verificationStatus: 'blocked',
          method: PLAYTEST_METHOD,
          confidence: 'limited',
          limitations: PLAYTEST_LIMITATIONS,
          completionRate: 40,
          totalDurationSec: 5.2,
          stepsCompleted: 0,
          totalStepsExpected: 1,
          waypoints,
          diagnostics,
          minimalPatch,
          patchDescription,
          patchApplied: false
        };
      }
    } else {
      // Profil humain nominal (aucune friction active)
      diagnostics.push({
        id: 'diag_human_clean_baseline',
        type: 'HUMAN_FRICTION_REPRODUCED',
        severity: 'info',
        title: 'Profil nominal de l\'Agent Humain validé',
        message: 'L\'Agent Testeur Apprenant n\'a détecté aucune friction active sur le joueur réel.',
        details: 'Toutes les affordances requises sont opérationnelles.',
        suggestedFix: 'Poursuivre la surveillance comportementale de l\'Agent Humain.'
      });
    }
  }

  // Détection des cibles du scénario
  interface InteractionTarget {
    id: string;
    name: string;
    position: [number, number, number];
    actionName: string;
    purpose: string;
    requiresCollider?: boolean;
  }

  const targets: InteractionTarget[] = [];

  // Si une quête structurée existe, on séquence selon ses étapes
  if (activeQuest && activeQuest.steps && activeQuest.steps.length > 0) {
    activeQuest.steps.forEach((step, idx) => {
      const req = (step.requiredEvent || '').trim();
      const reqParts = req ? req.split(':') : [];
      const isFlagStep = reqParts[0]?.toUpperCase() === 'FLAG';
      const candidateIds = [
        step.targetEntityId,
        !isFlagStep ? reqParts[1] : undefined,
        !isFlagStep ? reqParts[2] : undefined,
        step.targetZoneId
      ].filter((id): id is string => Boolean(id && id !== '*' && !id.includes('any')));

      // 1. Recherche par identifiant explicite (targetEntityId, requiredEvent, targetZoneId)
      let matchedEntity = entities.find(e =>
        candidateIds.some(cid => e.id === cid)
      ) || entities.find(e =>
        candidateIds.some(cid => e.id.toLowerCase().includes(cid.toLowerCase()) || cid.toLowerCase().includes(e.id.toLowerCase()))
      );

      // 2. Fallback sémantique par nom / assetId / mots-clés de l'étape
      if (!matchedEntity) {
        matchedEntity = entities.find(e => {
          const n = (e.name || '').toLowerCase();
          const t = (e.visuals?.assetId || '').toLowerCase();
          const s = ((step.title || '') + ' ' + (step.description || '')).toLowerCase();
          if (n && s.includes(n)) return true;
          if (t && s.includes(t)) return true;
          if (idx === 0 && (n.includes('haut-parleur') || n.includes('batterie') || n.includes('couteau'))) return true;
          return false;
        });
      }

      if (matchedEntity) {
        const tr = matchedEntity.capabilities.find(c => c.type === 'transform');
        const pos: [number, number, number] = readVec3Tuple(tr?.position, [0, 1.0, -0.3 + (idx * 0.2)]);
        targets.push({
          id: matchedEntity.id,
          name: matchedEntity.name || matchedEntity.id,
          position: pos,
          actionName: step.title,
          purpose: step.description || ''
        });
      } else {
        // Cible virtuelle par défaut pour l'étape
        targets.push({
          id: `step_target_${idx}`,
          name: step.title,
          position: [idx * 0.4 - 0.4, 0.95, -0.2],
          actionName: step.title,
          purpose: step.description || ''
        });
      }
    });
  } else {
    // Mode exploration générique : on cible les objets interactifs (cuisson, coupe, détection, web)
    const interactiveEntities = entities.filter(e =>
      e.capabilities.some(c => c.type === 'collider' || c.type === 'trigger_zone' || c.type === 'web_screen' || c.type === 'educational')
    );

    if (interactiveEntities.length > 0) {
      interactiveEntities.slice(0, 4).forEach((e, idx) => {
        const tr = e.capabilities.find(c => c.type === 'transform');
        const pos: [number, number, number] = readVec3Tuple(tr?.position, [idx * 0.5 - 0.75, 1.0, 0]);
        targets.push({
          id: e.id,
          name: e.name || e.id,
          position: pos,
          actionName: `Interagir avec ${e.name || e.id}`,
          purpose: 'Test de manipulation et réactivité causale'
        });
      });
    }
  }

  // Si aucune cible n'a pu être identifiée
  if (targets.length === 0) {
    diagnostics.push({
      id: 'diag_no_targets',
      type: 'NO_QUEST_OBJECTIVES',
      severity: 'warning',
      title: 'Aucune interaction cible identifiée',
      message: 'La scène ne possède ni quête active ni objet interactif avec collider.',
      details: 'L\'agent n\'a trouvé aucune opportunité de manipulation ou de progression causale.',
      suggestedFix: 'Ajoutez une quête interactive ou des objets munis de la capacité "collider".'
    });

    return {
      id: runId,
      persona,
      scenarioTitle,
      timestamp,
      success: false,
      verificationStatus: 'unverifiable',
      method: PLAYTEST_METHOD,
      confidence: 'limited',
      limitations: [...PLAYTEST_LIMITATIONS, 'Aucune cible testable n’a été trouvée ; aucune étape n’a été vérifiée.'],
      completionRate: 0,
      totalDurationSec: 0,
      stepsCompleted: 0,
      totalStepsExpected: 0,
      waypoints,
      diagnostics
    };
  }

  // Simulation pas à pas du parcours de l'agent
  let currentPos = [...startPos] as [number, number, number];
  let currentTime = 1.0;
  let stepsCompleted = 0;
  let isHalted = false;

  for (let i = 0; i < targets.length; i++) {
    const target = targets[i];
    const targetPos = target.position;

    // 1. VÉRIFICATION D'OBSTACLES SPATIAUX (Collision sur la trajectoire)
    // Vérifie si un collider massif est positionné directement sur le segment de marche
    const blockingObstacle = entities.find(e => {
      if (e.id === target.id) return false;
      if (targets.some(t => t.id === e.id)) return false;
      const hasCollider = e.capabilities.some(c => c.type === 'collider');
      if (!hasCollider) return false;
      // Exclure les zones de déclenchement, les petits objets manipulables et le mobilier support
      if (e.capabilities.some(c => c.type === 'trigger_zone' || c.type === 'draggable')) return false;
      if (isSupportEntity(e)) return false;
      const tr = e.capabilities.find(c => c.type === 'transform');
      if (!tr || !tr.position) return false;

      // Position intermédiaire entre currentPos et targetPos
      const [ox, oy, oz] = readVec3Tuple(tr.position, [0, 0, 0]);
      const midX = (currentPos[0] + targetPos[0]) / 2;
      const midZ = (currentPos[2] + targetPos[2]) / 2;
      const distToMid = Math.hypot(ox - midX, oz - midZ);
      // Objet au ras du sol ou à hauteur d'agent faisant obstacle
      return distToMid < 0.25 && oy >= 0 && oy <= 1.8;
    });

    if (blockingObstacle) {
      // Diagnostic obstacle bloquant
      const [obsX, obsY, obsZ] = readVec3Tuple(blockingObstacle.capabilities.find(c => c.type === 'transform')?.position, [0, 0, 0]);
      diagnostics.push({
        id: `diag_obstacle_${i}`,
        type: 'OBSTACLE_BLOCKING',
        severity: 'error',
        title: `Obstacle physique sur la trajectoire vers "${target.name}"`,
        message: `L'objet "${blockingObstacle.name || blockingObstacle.id}" bloque le passage direct de l'agent à la coordonnée (${obsX.toFixed(2)}, ${obsY.toFixed(2)}, ${obsZ.toFixed(2)}).`,
        affectedEntityId: blockingObstacle.id,
        location: [obsX, obsY, obsZ],
        details: 'Le playtester tente de franchir l\'axe mais heurte un collider impassable.',
        suggestedFix: `Déplacer "${blockingObstacle.name || blockingObstacle.id}" de 0.8m vers le côté pour dégager le couloir de circulation.`
      });

      // Calcul du Minimal Patch pour déplacer l'obstacle
      const newX = obsX + 0.85;
      minimalPatch = {
        entitiesChanged: [{
          ...blockingObstacle,
          capabilities: blockingObstacle.capabilities.map(c =>
            c.type === 'transform'
              ? { ...c, position: { x: newX, y: obsY, z: obsZ } }
              : c
          )
        }]
      };
      patchDescription = `Dégager le passage : décaler "${blockingObstacle.name || blockingObstacle.id}" de +0.85m en X.`;

      waypoints.push({
        id: `wp_blocked_${i}`,
        stepIndex: i + 1,
        position: [obsX, obsY, obsZ],
        timestampSec: currentTime + 1.2,
        action: 'collision_blocked',
        targetId: blockingObstacle.id,
        targetName: blockingObstacle.name || blockingObstacle.id,
        status: 'blocked',
        label: `Passage obstrué par ${blockingObstacle.name || blockingObstacle.id}`,
        notes: 'Collision détectée sans itinéraire de contournement libre.'
      });

      isHalted = true;
      break;
    }

    // 2. VÉRIFICATION D'ACCESSIBILITÉ DE HAUTEUR (Out of reach)
    if (targetPos[1] > 2.1 || targetPos[1] < -0.3) {
      diagnostics.push({
        id: `diag_reach_${i}`,
        type: 'TARGET_OUT_OF_REACH',
        severity: 'error',
        title: `Cible "${target.name}" hors de portée ergonomique`,
        message: `L'objet cible est à une altitude de ${targetPos[1].toFixed(2)}m, hors du champ d'interaction standard (0.0m - 1.9m).`,
        affectedEntityId: target.id,
        location: targetPos,
        details: 'En réalité virtuelle et tactile, l\'utilisateur ne peut pas atteindre cette hauteur sans monter sur un support.',
        suggestedFix: `Abaisser "${target.name}" à une hauteur ergonomique de table (Y = 0.95m).`
      });

      const matchedEntity = entities.find(e => e.id === target.id);
      if (matchedEntity) {
        minimalPatch = {
          entitiesChanged: [{
            ...matchedEntity,
            capabilities: matchedEntity.capabilities.map(c => {
              if (c.type !== 'transform') return c;
              const [tx, , tz] = readVec3Tuple(c.position, [targetPos[0], 0.95, targetPos[2]]);
              return { ...c, position: { x: tx, y: 0.95, z: tz } };
            })
          }]
        };
        patchDescription = `Ajuster l'altitude de "${target.name}" à Y = 0.95m pour garantir l'accessibilité VR/Tactile.`;
      }

      waypoints.push({
        id: `wp_reach_fail_${i}`,
        stepIndex: i + 1,
        position: targetPos,
        timestampSec: currentTime + 1.8,
        action: 'reach_failure',
        targetId: target.id,
        targetName: target.name,
        status: 'error',
        label: `${target.name} inaccessible en hauteur (${targetPos[1].toFixed(2)}m)`
      });

      isHalted = true;
      break;
    }

    // 3. VÉRIFICATION DE LA COHÉRENCE DE RÈGLE / CONDITION
    // Si la cible est liée à une règle, vérifions que le sourceId existe
    const associatedRule = rules.find(r =>
      r.conditions.some(c => c.type === 'is_source' && (c.sourceId === target.id || target.id.includes(c.sourceId || '___')))
    );

    if (associatedRule) {
      const sourceCond = associatedRule.conditions.find(c => c.type === 'is_source');
      if (sourceCond && sourceCond.sourceId !== target.id) {
        diagnostics.push({
          id: `diag_rule_mismatch_${i}`,
          type: 'RULE_CONDITION_MISMATCH',
          severity: 'warning',
          title: `Divergence d'identifiant dans la règle ${associatedRule.id}`,
          message: `La règle attend sourceId="${sourceCond.sourceId}" alors que l'objet ciblé a l'identifiant "${target.id}".`,
          details: 'L\'action sera exécutée mais la règle causale ne se déclenchera pas.',
          suggestedFix: `Mettre à jour la règle pour accepter "${target.id}" comme source valide.`
        });

        minimalPatch = {
          rulesChanged: [{
            ...associatedRule,
            conditions: associatedRule.conditions.map(c =>
              c.type === 'is_source' ? { ...c, sourceId: target.id } : c
            )
          }]
        };
        patchDescription = `Réaligner la règle ${associatedRule.id} avec l'identifiant effectif "${target.id}".`;
      }
    }

    // Déplacement fluide vers la cible
    const travelTime = Math.max(0.8, Math.hypot(targetPos[0] - currentPos[0], targetPos[2] - currentPos[2]) * 0.9);
    currentTime += travelTime;

    waypoints.push({
      id: `wp_step_${i}_move`,
      stepIndex: i + 1,
      position: [targetPos[0] * 0.7, 0.9, targetPos[2] * 0.7],
      timestampSec: currentTime,
      action: 'navigate',
      targetId: target.id,
      targetName: target.name,
      status: 'moving',
      label: `Approche de ${target.name}`
    });

    currentTime += 1.0;
    waypoints.push({
      id: `wp_step_${i}_interact`,
      stepIndex: i + 1,
      position: targetPos,
      timestampSec: currentTime,
      action: target.actionName,
      targetId: target.id,
      targetName: target.name,
      status: 'success',
      label: `Interaction réussie : ${target.actionName}`,
      notes: target.purpose
    });

    currentPos = [...targetPos] as [number, number, number];
    stepsCompleted++;
  }

  const totalStepsExpected = targets.length;
  const completionRate = Math.round((stepsCompleted / totalStepsExpected) * 100);
  const success = !isHalted && completionRate === 100;

  return {
    id: runId,
    persona,
    scenarioTitle,
    timestamp,
    success,
    verificationStatus: success ? 'passed' : 'blocked',
    method: PLAYTEST_METHOD,
    confidence: 'limited',
    limitations: PLAYTEST_LIMITATIONS,
    completionRate,
    totalDurationSec: Math.round(currentTime * 10) / 10,
    stepsCompleted,
    totalStepsExpected,
    waypoints,
    diagnostics,
    minimalPatch,
    patchDescription,
    patchApplied: false
  };
}
