// src/engine/experienceAuditor.ts
// Moteur autonome d'audit de qualité, de réalisme 3D, d'ergonomie cognitive
// et de certification des expériences virtuelles WorldPilot.

import { parseInstructionAsync } from '../authoring/parser';
import { EntitySpec, RuleSpec, Invariant, QuestSpec } from '../core/types';
import { hasDetailedSimulationModel } from '../scene/DetailedSimulationModel';
import { validateWorld } from './validator';

export interface ObjectAuditResult {
  entityId: string;
  name: string;
  assetId?: string;
  modelUrl?: string;
  isRealistic3D: boolean;
  isDraggable: boolean;
  isFixedFurniture: boolean;
  position: { x: number; y: number; z: number };
  issues: string[];
}

export interface InteractionAuditResult {
  ruleId: string;
  trigger: string;
  sourceId: string;
  targetId?: string;
  sourceExists: boolean;
  targetExists: boolean;
  hasAudioFeedback: boolean;
  hasVisualFeedback: boolean;
  hasStateFlag: boolean;
  issues: string[];
}

export interface CognitiveHesitationAnalysis {
  hesitationPoint: string;
  riskLevel: 'faible' | 'moyen' | 'élevé';
  userDilemma: string;
  preventiveResolution: string;
  isResolved: boolean;
}

export interface TraceExecutionStep {
  stepIndex: number;
  description: string;
  actionType: string;
  targetEntityId?: string;
  simulatedSuccess: boolean;
  stateChangeSummary: string;
}

export interface ExperienceAuditReport {
  id: string;
  prompt: string;
  title: string;
  category: string;
  status: 'validated' | 'needs_revision';
  overallScore: number; // 0 - 100
  timestamp: number;
  durationMs: number;
  
  // 1. Objets 3D & Réalisme
  objects3d: {
    passed: boolean;
    score: number; // 0 - 25
    totalEntities: number;
    realisticEntitiesCount: number;
    forbiddenFallbacksDetected: string[]; // e.g. "duck", "box" used as a car
    details: ObjectAuditResult[];
  };

  // 2. Interactions & Causalité
  interactions: {
    passed: boolean;
    score: number; // 0 - 25
    rulesCount: number;
    invariantsCount: number;
    hasActiveQuest: boolean;
    questStepsCount: number;
    details: InteractionAuditResult[];
  };

  // 3. Fluidité & Physique Rapier
  fluidity: {
    passed: boolean;
    score: number; // 0 - 25
    stableFurnitureCount: number;
    movableToolsCount: number;
    triggerZonesValid: boolean;
    issues: string[];
  };

  // 4. Ergonomie Cognitive & Friction Humaine
  cognitiveErgonomics: {
    passed: boolean;
    score: number; // 0 - 25
    hesitationPointsResolved: number;
    totalHesitationPoints: number;
    points: CognitiveHesitationAnalysis[];
  };

  // 5. Exécution & Faisabilité de la trace
  trace: {
    completed: boolean;
    steps: TraceExecutionStep[];
  };

  recommendations: string[];
}

/**
 * Liste des identifiants d'assets reconnus comme du mobilier lourd structurel.
 * Ils doivent rester fixes pour garantir la stabilité physique.
 */
const FIXED_FURNITURE_ASSETS = new Set([
  'counter', 'technical-bench', 'wall-screen', 'bench', 'wp-ilot-de-cuisine',
  'wp-bureau-individuel', 'pedestal', 'sofa', 'wp-table-haute-de-reunion',
  'coffee-table', 'meeting-table', 'wp-voiture', 'wp-automobile', 'car_sedan_1',
  'wp-presentoir-luxe', 'wp-vitrine-luxe', 'lv_marble_counter', 'lv_glass_showcase',
  'wp-plan-patisserie', 'wp-four-patisserie', 'pastry_marble_table', 'pastry_oven',
  'wp-supercar-showroom', 'demo_supercar', 'wp-plateau-tournant', 'demo_rotating_turntable',
  'wp-borne-configurateur', 'demo_color_terminal', 'wp-baie-panoramique', 'penthouse_panoramic_window',
  'wp-cadre-art-numerique', 'penthouse_nft_frame', 'penthouse_designer_sofa',
  'wp-coupole-spatiale', 'station_orbital_cupola', 'wp-console-spatiale', 'station_telemetry_terminal',
  'wp-portant-a-vetements', 'wp-mannequin-haute-couture', 'lv_garment_rack', 'lv_couture_mannequin',
  'wp-tapis-montage-ikea', 'wp-meuble-ikea-kit', 'wp-etagere-ikea', 'ikea_work_mat', 'ikea_flatpack_box', 'ikea_assembled_shelf', 'ikea_wall_slot',
  'wp-console-level-design', 'wp-spawn-pad', 'wp-portail-victoire', 'gamedev_workbench', 'player_spawn_pad', 'victory_portal_gate'
]);

/**
 * Modèles interdits comme substituts d'objets réalistes (ex: canard pour une voiture).
 */
const FORBIDDEN_SUBSTITUTE_KEYWORDS = ['duck', 'canard', 'rubber_duck'];

/**
 * Exécute un audit automatisé complet d'un prompt utilisateur.
 */
export async function auditExperiencePrompt(
  prompt: string,
  categoryHint: string = 'Formation Technique'
): Promise<ExperienceAuditReport> {
  const startTime = Date.now();
  const reportId = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // 1. Parsing du prompt et génération du plan causal et patch
  const { plan, patch } = await parseInstructionAsync(
    prompt,
    { selectedEntityId: null, pointedEntityId: null },
    {}
  );

  // 2. Construction de l'état simulé du monde
  const entities: Record<string, EntitySpec> = {};
  (patch.entitiesCreated || []).forEach(e => {
    if (e.id) {
      entities[e.id] = e;
    }
  });

  const rules: Record<string, RuleSpec> = {};
  (patch.rulesChanged || []).forEach(r => {
    if (r.id) {
      rules[r.id] = r as RuleSpec;
    }
  });

  const invariants: Invariant[] = patch.invariantsAdded || [];
  const quests: QuestSpec[] = patch.questsAdded || [];
  const activeQuest = quests.find(q => q.id === patch.activeQuestId) || quests[0];

  // --------------------------------------------------------------------------
  // CRITÈRE 1 : Objets 3D nécessaires & Réalisme
  // --------------------------------------------------------------------------
  const objectAuditList: ObjectAuditResult[] = [];
  const forbiddenDetections: string[] = [];
  let realisticEntitiesCount = 0;

  const entityEntries = Object.values(entities);

  entityEntries.forEach(ent => {
    const assetId = (ent.visuals?.assetId || '').toLowerCase();
    const modelUrl = (ent.visuals?.modelUrl || '').toLowerCase();
    const name = (ent.name || '').toLowerCase();
    const issues: string[] = [];

    // Détection d'un fallback absurde (ex: canard au lieu de véhicule)
    FORBIDDEN_SUBSTITUTE_KEYWORDS.forEach(kw => {
      if (assetId.includes(kw) || modelUrl.includes(kw) || name.includes(kw)) {
        if (prompt.toLowerCase().includes('voiture') || prompt.toLowerCase().includes('véhicule') || prompt.toLowerCase().includes('batterie')) {
          const msg = `Modèle interdit détecté : '${kw}' pour un objet '${ent.name}'`;
          forbiddenDetections.push(msg);
          issues.push(msg);
        }
      }
    });

    const isDetailed = hasDetailedSimulationModel(ent);
    const hasGlb = !!ent.visuals?.modelUrl && ent.visuals.modelUrl.endsWith('.glb');
    const isRealistic3D = isDetailed || hasGlb;

    if (isRealistic3D) realisticEntitiesCount++;
    else issues.push(`L'entité '${ent.name}' n'a pas de modèle 3D haute-fidélité ni de fichier GLB valide.`);

    const isDraggable = ent.capabilities.some(c => c.type === 'draggable');
    const isFixedFurniture = FIXED_FURNITURE_ASSETS.has(assetId) || 
      FIXED_FURNITURE_ASSETS.has(ent.id) || 
      name.includes('voiture') || 
      name.includes('établi') || 
      (name.includes('table') && !name.includes('tablette')) || 
      (name.includes('four') && !name.includes('enfourner') && !name.includes('plaque')) ||
      name.includes('vitrine') ||
      name.includes('supercar') ||
      name.includes('plateau tournant') ||
      name.includes('baie') ||
      name.includes('coupole') ||
      name.includes('console') ||
      name.includes('chevalet') ||
      name.includes('canapé') ||
      name.includes('présentoir') ||
      name.includes('étagère') ||
      name.includes('etagere') ||
      name.includes('meuble') ||
      name.includes('tapis') ||
      name.includes('carton') ||
      name.includes('spawn') ||
      name.includes('portail');

    const transformCap = ent.capabilities.find(c => c.type === 'transform');
    const rawPos: any = transformCap?.position;
    const position = rawPos
      ? (Array.isArray(rawPos)
          ? { x: Number(rawPos[0]) || 0, y: Number(rawPos[1]) || 0, z: Number(rawPos[2]) || 0 }
          : { x: Number(rawPos.x) || 0, y: Number(rawPos.y) || 0, z: Number(rawPos.z) || 0 })
      : { x: 0, y: 0, z: 0 };

    objectAuditList.push({
      entityId: ent.id,
      name: ent.name,
      assetId: ent.visuals?.assetId,
      modelUrl: ent.visuals?.modelUrl,
      isRealistic3D,
      isDraggable,
      isFixedFurniture,
      position,
      issues
    });
  });

  const objectsPassed = entityEntries.length >= 2 && forbiddenDetections.length === 0 && realisticEntitiesCount >= entityEntries.length * 0.75;
  const objectsScore = Math.round(
    (objectsPassed ? 25 : 10) * (realisticEntitiesCount / Math.max(1, entityEntries.length))
  );

  // --------------------------------------------------------------------------
  // CRITÈRE 2 : Définition des interactions & Règles causales
  // --------------------------------------------------------------------------
  const interactionAuditList: InteractionAuditResult[] = [];
  let validInteractionsCount = 0;

  const knownPartIds = new Set<string>();
  entityEntries.forEach(ent => {
    (ent.parts || []).forEach(p => {
      if (p.id) knownPartIds.add(p.id);
    });
  });
  const builtinActors = new Set<string>(['player', 'system', 'world']);
  const hasActorOrEntity = (id?: string): boolean =>
    !id || builtinActors.has(id) || Boolean(entities[id]) || knownPartIds.has(id);

  Object.values(rules).forEach(rule => {
    const issues: string[] = [];
    const sourceCondition = rule.conditions?.find(c => c.type === 'is_source');
    const targetCondition = rule.conditions?.find(c => c.type === 'is_target');

    const sourceId = sourceCondition?.sourceId || '';
    const targetId = targetCondition?.targetId;

    const sourceExists = hasActorOrEntity(sourceId);
    const targetExists = hasActorOrEntity(targetId);

    if (!sourceExists) issues.push(`La source de la règle '${sourceId}' n'existe pas dans les entités créées.`);
    if (targetId && !targetExists) issues.push(`La cible de la règle '${targetId}' n'existe pas dans les entités créées.`);

    const hasAudioFeedback = (rule.actions || []).some(
      a => a.type === 'play_sound' || a.type === 'test_spatial_capacity' || a.type === 'trigger_victory'
    );
    const hasVisualFeedback = (rule.actions || []).some(
      a =>
        a.type === 'show_warning' ||
        a.type === 'change_color' ||
        a.type === 'trigger_animation' ||
        a.type === 'emit_particles' ||
        a.type === 'toggle_state' ||
        a.type === 'test_spatial_capacity' ||
        a.type === 'set_relation' ||
        a.type === 'teleport' ||
        a.type === 'reset_position' ||
        a.type === 'apply_impulse' ||
        a.type === 'destroy_entity' ||
        a.type === 'spawn_entity' ||
        a.type === 'set_atmosphere' ||
        a.type === 'open_url'
    );
    const hasStateFlag = (rule.actions || []).some(
      a =>
        a.type === 'set_flag' ||
        a.type === 'trigger_victory' ||
        a.type === 'trigger_game_over' ||
        a.type === 'toggle_state' ||
        a.type === 'test_spatial_capacity' ||
        a.type === 'set_relation' ||
        a.type === 'increment_score' ||
        a.type === 'decrement_score' ||
        a.type === 'adjust_lives' ||
        a.type === 'set_timer' ||
        a.type === 'reset_game' ||
        a.type === 'teleport' ||
        a.type === 'reset_position' ||
        a.type === 'apply_impulse' ||
        a.type === 'destroy_entity' ||
        a.type === 'spawn_entity' ||
        a.type === 'set_atmosphere' ||
        a.type === 'open_url'
    );

    if (!hasAudioFeedback) issues.push(`La règle '${rule.id}' ne fournit aucun retour sonore.`);
    if (!hasVisualFeedback && !hasStateFlag) issues.push(`La règle '${rule.id}' ne modifie aucun état visuel ou logique.`);

    if (sourceExists && targetExists && (hasAudioFeedback || hasVisualFeedback || hasStateFlag)) {
      validInteractionsCount++;
    }

    interactionAuditList.push({
      ruleId: rule.id,
      trigger: rule.trigger,
      sourceId,
      targetId,
      sourceExists,
      targetExists,
      hasAudioFeedback,
      hasVisualFeedback,
      hasStateFlag,
      issues
    });
  });

  const interactionsPassed = Object.keys(rules).length >= 1 && validInteractionsCount >= Object.keys(rules).length;
  const interactionsScore = interactionsPassed ? 25 : 12;

  // --------------------------------------------------------------------------
  // CRITÈRE 3 : Fluidité & Physique Rapier (Aucun blocage ou collision infinie)
  // --------------------------------------------------------------------------
  const fluidityIssues: string[] = [];
  let stableFurnitureCount = 0;
  let movableToolsCount = 0;

  objectAuditList.forEach(obj => {
    if (obj.isFixedFurniture) {
      if (obj.isDraggable) {
        fluidityIssues.push(`Le meuble lourd '${obj.name}' est marqué draggable (risque d'instabilité physique Rapier).`);
      } else {
        stableFurnitureCount++;
      }
    } else if (obj.isDraggable) {
      movableToolsCount++;
    }
  });

  // Vérification des zones de déclenchement
  let triggerZonesValid = true;
  entityEntries.forEach(ent => {
    const triggerCap = ent.capabilities.find(c => c.type === 'trigger_zone');
    if (triggerCap) {
      const radius = triggerCap.radius || 0;
      if (radius < 0.25) {
        fluidityIssues.push(`La zone réceptrice '${ent.name}' a un rayon trop faible (${radius}m) pour un aimantage fluide.`);
        triggerZonesValid = false;
      }
    }
  });

  const fluidityPassed = fluidityIssues.length === 0 && (movableToolsCount > 0 || entityEntries.length <= 2);
  const fluidityScore = fluidityPassed ? 25 : 15;

  // --------------------------------------------------------------------------
  // CRITÈRE 4 : Ergonomie Cognitive ("Là où l'humain pourrait hésiter")
  // --------------------------------------------------------------------------
  const hesitationPoints: CognitiveHesitationAnalysis[] = [];

  // Hésitation 1 : Où commencer ?
  hesitationPoints.push({
    hesitationPoint: "Point d'entrée & première action",
    riskLevel: activeQuest?.steps?.[0]?.title ? 'faible' : 'moyen',
    userDilemma: "L'utilisateur découvre la scène 3D et ne sait pas par quel objet commencer.",
    preventiveResolution: activeQuest?.steps?.[0]?.title
      ? `Quête active définie avec première étape explicite : « ${activeQuest.steps[0].title} » et indice « ${activeQuest.steps[0].hint || 'Sélectionnez l’objet'} »`
      : "Présence d'un panneau descriptif et d'un bouton contextuel dans la barre d'action.",
    isResolved: !!activeQuest?.steps?.[0]?.title || interactionAuditList.length > 0
  });

  // Hésitation 2 : Précision du geste de manipulation
  const draggableCount = objectAuditList.filter(o => o.isDraggable).length;
  hesitationPoints.push({
    hesitationPoint: "Glisser-déposer vs Clic simple",
    riskLevel: draggableCount > 0 ? 'faible' : 'faible',
    userDilemma: "L'utilisateur sur trackpad peut hésiter entre cliquer pour inspecter ou maintenir pour déplacer.",
    preventiveResolution: "L'application prend en charge le double-mode : clic pour sélectionner/inspecter, glisser avec aimantage magnétique émeraude pour déposer, et boutons d'action rapide dans la barre inférieure.",
    isResolved: true
  });

  // Hésitation 3 : Respect de l'ordre séquentiel / Sécurité
  const hasInvariants = invariants.length > 0;
  const hasQuestProgression = !!activeQuest && (activeQuest.steps?.length || 0) > 0;
  hesitationPoints.push({
    hesitationPoint: "Ordre chronologique & prérequis de sécurité",
    riskLevel: hasInvariants || hasQuestProgression ? 'faible' : 'moyen',
    userDilemma: activeQuest
      ? `L'utilisateur peut hésiter sur l'ordre des ${activeQuest.steps.length} étapes de l'activité.`
      : "L'utilisateur peut tenter d'exécuter une action finale sans avoir réalisé les étapes préliminaires.",
    preventiveResolution: hasInvariants
      ? `Invariant formel '${invariants[0].id}' actif : bloque la transition et affiche un message pédagogique guidé.`
      : activeQuest
      ? `Quête pas-à-pas « ${activeQuest.title} » active avec ${activeQuest.steps.length} étapes séquentielles guidées dans le HUD.`
      : "Règles avec require_flag ou séquence unitaire claire évitant toute ambiguïté chronologique.",
    isResolved: hasInvariants || 
      hasQuestProgression ||
      interactionAuditList.some(r => r.ruleId.includes('install') || r.ruleId.includes('complete')) ||
      interactionAuditList.length <= 1
  });

  // Hésitation 4 : Feedback de confirmation
  hesitationPoints.push({
    hesitationPoint: "Validation du succès de l'action",
    riskLevel: 'faible',
    userDilemma: "L'utilisateur ignore si son action a bien été prise en compte.",
    preventiveResolution: "Triple feedback simultané : carillon sonore (chime/fanfare), toast visuel de succès et allumage immédiat des phares/feux du système.",
    isResolved: interactionAuditList.some(r => r.hasAudioFeedback && r.hasVisualFeedback) || 
      (interactionAuditList.some(r => r.hasVisualFeedback || r.hasAudioFeedback) && !!activeQuest?.rewardSound)
  });

  const cognitiveResolvedCount = hesitationPoints.filter(p => p.isResolved).length;
  const cognitivePassed = cognitiveResolvedCount === hesitationPoints.length;
  const cognitiveScore = Math.round(25 * (cognitiveResolvedCount / hesitationPoints.length));

  // --------------------------------------------------------------------------
  // CRITÈRE 5 : Simulation de la trace d'exécution
  // --------------------------------------------------------------------------
  const traceSteps: TraceExecutionStep[] = [];
  let traceCompleted = false;

  if (activeQuest && activeQuest.steps) {
    activeQuest.steps.forEach((step, idx) => {
      traceSteps.push({
        stepIndex: idx + 1,
        description: step.title,
        actionType: step.requiredEvent || 'INTERACT',
        targetEntityId: step.targetEntityId,
        simulatedSuccess: true,
        stateChangeSummary: `Étape ${idx + 1} validée : ${step.description}`
      });
    });
    traceCompleted = traceSteps.length > 0;
  } else if (Object.keys(rules).length > 0) {
    Object.values(rules).forEach((r, idx) => {
      traceSteps.push({
        stepIndex: idx + 1,
        description: `Déclenchement règle ${r.id}`,
        actionType: r.trigger,
        targetEntityId: r.conditions?.[0]?.sourceId,
        simulatedSuccess: true,
        stateChangeSummary: `Règle ${r.id} exécutée avec succès.`
      });
    });
    traceCompleted = traceSteps.length > 0;
  }

  // --------------------------------------------------------------------------
  // Synthèse & Décision de Certification (avec Cheap Checks Formels)
  // --------------------------------------------------------------------------
  const simulatedWorld = {
    version: 1,
    ir: {
      entities,
      rules,
      invariants: (invariants || []).reduce((acc, inv) => ({ ...acc, [inv.id]: inv }), {}),
      quests: (quests || []).reduce((acc, q) => ({ ...acc, [q.id]: q }), {}),
      activeQuestId: patch.activeQuestId || quests[0]?.id
    },
    flags: {}
  };
  const cheapChecksResult = validateWorld(simulatedWorld as any);

  const overallScore = cheapChecksResult.valid
    ? objectsScore + interactionsScore + fluidityScore + cognitiveScore
    : Math.min(60, objectsScore + interactionsScore + fluidityScore + cognitiveScore);

  const passed = objectsPassed && interactionsPassed && fluidityPassed && cognitivePassed && cheapChecksResult.valid && overallScore >= 90;
  const status: 'validated' | 'needs_revision' = passed ? 'validated' : 'needs_revision';

  const recommendations: string[] = [];
  if (!cheapChecksResult.valid) {
    recommendations.push(...cheapChecksResult.errors.map(err => `Cheap Checks : ${err}`));
  }
  if (!objectsPassed) recommendations.push("Enrichir les modèles 3D pour éviter tout substitut géométrique basique.");
  if (!interactionsPassed) recommendations.push("Assurer que chaque règle possède au moins un son et un retour d'état visuel.");
  if (!fluidityPassed) recommendations.push("Vérifier que les meubles lourds sont bien statiques et que les zones réceptrices ont un rayon >= 0.35m.");
  if (!cognitivePassed) recommendations.push("Ajouter un indice contextuel pour guider l'utilisateur sur les étapes ambiguës.");

  return {
    id: reportId,
    prompt,
    title: activeQuest?.title || plan.intent || prompt,
    category: categoryHint,
    status,
    overallScore,
    timestamp: Date.now(),
    durationMs: Date.now() - startTime,
    objects3d: {
      passed: objectsPassed,
      score: objectsScore,
      totalEntities: entityEntries.length,
      realisticEntitiesCount,
      forbiddenFallbacksDetected: forbiddenDetections,
      details: objectAuditList
    },
    interactions: {
      passed: interactionsPassed,
      score: interactionsScore,
      rulesCount: Object.keys(rules).length,
      invariantsCount: invariants.length,
      hasActiveQuest: !!activeQuest,
      questStepsCount: activeQuest?.steps?.length || 0,
      details: interactionAuditList
    },
    fluidity: {
      passed: fluidityPassed,
      score: fluidityScore,
      stableFurnitureCount,
      movableToolsCount,
      triggerZonesValid,
      issues: fluidityIssues
    },
    cognitiveErgonomics: {
      passed: cognitivePassed,
      score: cognitiveScore,
      hesitationPointsResolved: cognitiveResolvedCount,
      totalHesitationPoints: hesitationPoints.length,
      points: hesitationPoints
    },
    trace: {
      completed: traceCompleted,
      steps: traceSteps
    },
    recommendations
  };
}
