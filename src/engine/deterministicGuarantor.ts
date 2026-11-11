// src/engine/deterministicGuarantor.ts
// Vérifications déterministes et bornées de propriétés déclarées du monde.

import { WorldState, WorldPatch } from '../core/types';
import { evaluateSemanticBlastRadius, BlastRadiusReport } from '../research/semanticBlastRadius';

export type GuarantorAuditStatus = 'CHECKS_PASSED' | 'CHECKS_FAILED' | 'INCOMPLETE';

export interface GuarantorInvariantCheck {
  id: string;
  name: string;
  category: 'SAFETY' | 'LIVENESS' | 'AFFORDANCE' | 'NON_REGRESSION';
  satisfied: boolean;
  evaluated: boolean;
  details: string;
}

export interface GuarantorAudit {
  timestamp: number;
  approved: boolean;
  status: GuarantorAuditStatus;
  blastRadiusScore: number;
  isRegressionFree: boolean;
  sbrEvaluated: boolean;
  checksPassed: boolean;
  passedCheckCount: number;
  evaluatedCheckCount: number;
  skippedCheckCount: number;
  checks: GuarantorInvariantCheck[];
  violations: string[];
  summary: string;
  limitations: string[];
  paretoRepairPatch?: WorldPatch;
}

export interface HumanFrictionDiagnostic {
  verifiedDeadlock: boolean;
  entityId: string;
  entityName: string;
  cause: 'MISSING_DRAGGABLE' | 'MISSING_COLLIDER' | 'OUT_OF_REACH' | 'MISSING_CAUSAL_RULE' | 'NONE';
  explanation: string;
  suggestedParetoPatch?: WorldPatch;
}

/**
 * Vérifie quelques propriétés structurelles du monde et, si fourni, évalue un patch
 * avec l'analyse heuristique Semantic Blast Radius. Ce n'est pas une preuve formelle.
 */
export function certifyWorldInvariants(
  world: WorldState,
  proposedPatch?: WorldPatch
): GuarantorAudit {
  const timestamp = Date.now();
  // Construction de l'état spéculatif résultant de l'application éventuelle du patch
  const entities = { ...(world.ir?.entities || {}) };
  if (proposedPatch?.entitiesCreated) {
    proposedPatch.entitiesCreated.forEach(e => { entities[e.id] = e; });
  }
  if (proposedPatch?.entitiesChanged) {
    proposedPatch.entitiesChanged.forEach(e => {
      if (e.id && entities[e.id]) {
        entities[e.id] = {
          ...entities[e.id],
          ...e,
          capabilities: e.capabilities || entities[e.id].capabilities
        };
      }
    });
  }
  if (proposedPatch?.entitiesRemoved) {
    proposedPatch.entitiesRemoved.forEach(id => { delete entities[id]; });
  }

  const rules = { ...(world.ir?.rules || {}) };
  if (proposedPatch?.rulesChanged) {
    proposedPatch.rulesChanged.forEach(r => {
      if (r.id) {
        rules[r.id] = { ...(rules[r.id] || {}), ...r } as any;
      }
    });
  }

  const quests = { ...(world.ir?.quests || {}) };
  if (proposedPatch?.questsAdded) {
    proposedPatch.questsAdded.forEach(q => { quests[q.id] = q; });
  }

  const activeQuestId = proposedPatch?.activeQuestId || world.ir?.activeQuestId;
  const activeQuest = activeQuestId && quests ? quests[activeQuestId] : null;

  const checks: GuarantorInvariantCheck[] = [];
  const violations: string[] = [];
  let paretoRepairPatch: WorldPatch | undefined = undefined;

  // 1. Invariant de Sûreté Spatiale (Ergonomic Reachability)
  let reachabilitySatisfied = true;
  Object.values(entities).forEach(e => {
    const tr = e.capabilities.find(c => c.type === 'transform');
    if (tr && tr.position) {
      const rawPos: any = tr.position;
      const posY = Array.isArray(rawPos) ? Number(rawPos[1]) || 0 : Number(rawPos.y) || 0;
      // Les luminaires de plafond / éléments purement architecturaux non interactifs peuvent dépasser 2.1m
      const sig = `${e.id || ''} ${e.name || ''} ${e.visuals?.assetId || ''}`.toLowerCase();
      const isCeilingOrScenery = /\b(suspension|lustre|plafonnier|plafond|toit|roof|ceiling|nuage|soleil|lune)\b/i.test(sig) &&
        !e.capabilities.some(c => c.type === 'draggable' || c.type === 'trigger_zone' || c.type === 'interactive');
      if (!isCeilingOrScenery && (posY > 2.1 || posY < -0.3)) {
        reachabilitySatisfied = false;
        violations.push(`Entité "${e.name || e.id}" hors de la sphère ergonomique humaine (Y=${posY.toFixed(2)}m).`);
      }
    }
  });

  checks.push({
    id: 'inv_spatial_reachability',
    name: 'Enveloppe verticale déclarée (-0.3m à 2.1m)',
    category: 'SAFETY',
    satisfied: reachabilitySatisfied,
    evaluated: true,
    details: reachabilitySatisfied
      ? 'Les coordonnées Y des entités sont dans la plage choisie. Cela ne vérifie ni la portée 3D réelle ni les collisions.'
      : 'Certaines coordonnées Y sont hors de la plage choisie. La règle ne vérifie pas l\'accessibilité réelle.'
  });

  // 2. Invariant de Vivacité des Quêtes (Liveness / Non-Deadlock)
  const livenessEvaluated = Boolean(activeQuest && activeQuest.steps.length > 0);
  let livenessSatisfied = true;
  if (livenessEvaluated && activeQuest) {
    activeQuest.steps.forEach((step, idx) => {
      if (!step.completed) {
        // Vérifier si l'événement requis cible une entité existante (sauf étapes FLAG:xxx qui ciblent un drapeau d'état)
        const req = step.requiredEvent || '';
        const parts = req.split(':');
        const eventPrefix = (parts[0] || '').toUpperCase();
        if (eventPrefix !== 'FLAG') {
          const candidateSourceId = parts[1] || step.targetEntityId;
          if (candidateSourceId && candidateSourceId !== '*' && !candidateSourceId.includes('any')) {
            const cidLower = candidateSourceId.toLowerCase();
            const entityExists =
              Boolean(entities[candidateSourceId]) ||
              Boolean(step.targetEntityId && entities[step.targetEntityId]) ||
              Object.values(entities).some(e => {
                const eid = e.id.toLowerCase();
                return eid.startsWith(cidLower) || eid.includes(cidLower) || cidLower.includes(eid);
              });
            if (!entityExists) {
              livenessSatisfied = false;
              violations.push(`Étape de quête ${idx + 1} ("${step.title}") requiert l'entité orpheline "${candidateSourceId}".`);
            }
          }
        }
      }
    });
  }

  checks.push({
    id: 'inv_quest_liveness',
    name: 'Vivacité & Résolubilité des Objectifs de Quête',
    category: 'LIVENESS',
    satisfied: livenessEvaluated && livenessSatisfied,
    evaluated: livenessEvaluated,
    details: !livenessEvaluated
      ? 'Non évalué : aucune quête active avec étapes.'
      : livenessSatisfied
        ? 'Les références d\'entité extraites des événements requis existent. Les transitions runtime ne sont pas simulées ici.'
        : 'Des références d\'entité extraites des événements requis sont absentes.'
  });

  // 3. Invariant d'Affordance de Manipulation (Manipulability)
  const dropSteps = activeQuest?.steps.filter(step => (step.requiredEvent || '').startsWith('DROP:')) || [];
  const affordanceEvaluated = dropSteps.length > 0;
  let affordanceSatisfied = true;
  if (affordanceEvaluated) {
    dropSteps.forEach(step => {
      const req = step.requiredEvent || '';
      if (req.startsWith('DROP:')) {
        const parts = req.split(':');
        const srcId = parts[1];
        const stoneOrObj = srcId
          ? (entities[srcId] || Object.values(entities).find(e => e.id.startsWith(srcId) || e.id.includes(srcId)))
          : undefined;
        if (stoneOrObj) {
          const hasDraggable = stoneOrObj.capabilities.some(c => c.type === 'draggable');
          if (!hasDraggable) {
            affordanceSatisfied = false;
            violations.push(`L'objet "${stoneOrObj.name || stoneOrObj.id}" requis pour un DROP n'est pas marqué 'draggable'.`);
            paretoRepairPatch = {
              entitiesChanged: [{
                ...stoneOrObj,
                capabilities: [...stoneOrObj.capabilities, { type: 'draggable' } as any]
              }]
            };
          }
        }
      }
    });
  }

  checks.push({
    id: 'inv_affordance_consistency',
    name: 'Cohérence Formelle des Affordances Physiques',
    category: 'AFFORDANCE',
    satisfied: affordanceEvaluated && affordanceSatisfied,
    evaluated: affordanceEvaluated,
    details: !affordanceEvaluated
      ? 'Non évalué : aucune étape DROP dans la quête active.'
      : affordanceSatisfied
        ? 'Les objets source des étapes DROP déclarent la capacité draggable. Les colliders runtime ne sont pas éprouvés.'
        : 'Un objet source d\'une étape DROP ne déclare pas la capacité draggable.'
  });

  // 4. Analyse différentielle de Semantic Blast Radius (si un patch est proposé)
  let sbrReport: BlastRadiusReport | null = null;
  let blastRadiusScore = 0.0;
  let isRegressionFree = true;
  const sbrEvaluated = Boolean(proposedPatch);

  if (proposedPatch) {
    sbrReport = evaluateSemanticBlastRadius(world, proposedPatch);
    blastRadiusScore = sbrReport.blastRadiusScore;
    isRegressionFree = sbrReport.isRegressionFree;

    checks.push({
      id: 'inv_sbr_non_regression',
      name: 'Non-Régression Sémantique (SBR)',
      category: 'NON_REGRESSION',
      satisfied: isRegressionFree,
      evaluated: true,
      details: isRegressionFree
        ? `L'analyse heuristique n'a pas relevé de régression selon ses règles (score SBR : ${(blastRadiusScore * 100).toFixed(1)}%).`
        : `L'analyse heuristique a relevé des régressions possibles : ${sbrReport.violations.map(v => v.description).join('; ')}`
    });

    if (sbrReport.paretoRepairPatch && !paretoRepairPatch) {
      paretoRepairPatch = sbrReport.paretoRepairPatch;
    }
  } else {
    checks.push({
      id: 'inv_sbr_non_regression',
      name: 'Non-Régression Sémantique (SBR)',
      category: 'NON_REGRESSION',
      satisfied: false,
      evaluated: false,
      details: 'Non évalué : aucun patch n’a été fourni à l’analyse SBR.'
    });
  }

  const evaluatedChecks = checks.filter(check => check.evaluated);
  const passedCheckCount = evaluatedChecks.filter(check => check.satisfied).length;
  const evaluatedCheckCount = evaluatedChecks.length;
  const skippedCheckCount = checks.length - evaluatedCheckCount;
  const checksPassed = evaluatedCheckCount > 0 && passedCheckCount === evaluatedCheckCount;
  const status: GuarantorAuditStatus = !checksPassed
    ? 'CHECKS_FAILED'
    : skippedCheckCount > 0
      ? 'INCOMPLETE'
      : 'CHECKS_PASSED';
  const approved = checksPassed && (!sbrEvaluated || blastRadiusScore <= 0.65);
  const summary = `Contrôles WorldPilot : ${passedCheckCount}/${evaluatedCheckCount} réussis ; ${skippedCheckCount} non évalué(s). Résultat limité aux règles listées, sans preuve formelle de jouabilité.`;
  const limitations = [
    'La vérification spatiale compare uniquement les coordonnées verticales à une plage fixe ; elle ne calcule pas les trajets ni les collisions réelles.',
    'La vérification de quête contrôle certaines références d’entités et la capacité draggable des étapes DROP ; elle ne simule pas les transitions runtime.',
    'Le score Semantic Blast Radius est une heuristique de non-régression, pas une preuve exhaustive.'
  ];

  return {
    timestamp,
    approved,
    status,
    blastRadiusScore,
    isRegressionFree,
    sbrEvaluated,
    checksPassed,
    passedCheckCount,
    evaluatedCheckCount,
    skippedCheckCount,
    checks,
    violations,
    summary,
    limitations,
    paretoRepairPatch
  };
}

/**
 * Diagnostic déterministe ciblé d'une friction humaine observée.
 * Détermine mathématiquement si l'interaction de l'utilisateur a échoué à cause d'une affordance manquante,
 * d'un obstacle ou d'une règle absente.
 */
export function diagnoseHumanFrictionDeterministically(
  world: WorldState,
  failedEntityId: string,
  attemptedAction: string = 'drag'
): HumanFrictionDiagnostic {
  const entities = world.ir?.entities || {};
  const rules = world.ir?.rules || {};
  const entity = entities[failedEntityId] || Object.values(entities).find(e => e.id === failedEntityId);

  if (!entity) {
    return {
      verifiedDeadlock: true,
      entityId: failedEntityId,
      entityName: failedEntityId,
      cause: 'MISSING_COLLIDER',
      explanation: `L'entité "${failedEntityId}" n'existe pas dans le graphe spatial.`,
    };
  }

  const caps = entity.capabilities || [];
  const hasDraggable = caps.some(c => c.type === 'draggable');
  const hasInteractive = caps.some(c => c.type === 'interactive');
  const tr = caps.find(c => c.type === 'transform');

  // Si l'utilisateur tente un drag sur un objet sans draggable
  if (attemptedAction === 'drag' && !hasDraggable) {
    const suggestedParetoPatch: WorldPatch = {
      entitiesChanged: [{
        ...entity,
        capabilities: [
          ...caps,
          { type: 'draggable' } as any,
          ...(!hasInteractive ? [{ type: 'interactive' } as any] : [])
        ]
      }]
    };

    return {
      verifiedDeadlock: true,
      entityId: entity.id,
      entityName: entity.name || entity.id,
      cause: 'MISSING_DRAGGABLE',
      explanation: `L'objet "${entity.name || entity.id}" a été manipulé en drag-and-drop mais ne possède pas la capability 'draggable'.`,
      suggestedParetoPatch
    };
  }

  // Vérification de hauteur ergonomique
  if (tr && tr.position) {
    const rawPos: any = tr.position;
    const px = Array.isArray(rawPos) ? Number(rawPos[0]) || 0 : Number(rawPos.x) || 0;
    const py = Array.isArray(rawPos) ? Number(rawPos[1]) || 0 : Number(rawPos.y) || 0;
    const pz = Array.isArray(rawPos) ? Number(rawPos[2]) || 0 : Number(rawPos.z) || 0;
    if (py > 2.0 || py < -0.2) {
      const suggestedParetoPatch: WorldPatch = {
        entitiesChanged: [{
          ...entity,
          capabilities: caps.map(c =>
            c.type === 'transform' ? { ...c, position: { x: px, y: 0.85, z: pz } } : c
          )
        }]
      };

      return {
        verifiedDeadlock: true,
        entityId: entity.id,
        entityName: entity.name || entity.id,
        cause: 'OUT_OF_REACH',
        explanation: `L'objet "${entity.name || entity.id}" est positionné à Y=${py.toFixed(2)}m, hors d'atteinte ergonomique.`,
        suggestedParetoPatch
      };
    }
  }

  // Vérification de règles causales associées
  const hasMatchingRule = Object.values(rules).some(r =>
    r.conditions?.some(c => c.type === 'is_source' && (c.sourceId === entity.id || entity.id.startsWith(c.sourceId || '___')))
  );

  if (!hasMatchingRule && attemptedAction === 'click') {
    return {
      verifiedDeadlock: false,
      entityId: entity.id,
      entityName: entity.name || entity.id,
      cause: 'MISSING_CAUSAL_RULE',
      explanation: `Aucune règle causale ne lie le clic sur "${entity.name || entity.id}". L'action s'exécute dans le vide.`
    };
  }

  return {
    verifiedDeadlock: false,
    entityId: entity.id,
    entityName: entity.name || entity.id,
    cause: 'NONE',
    explanation: `L'entité dispose de toutes les affordances requises.`
  };
}
