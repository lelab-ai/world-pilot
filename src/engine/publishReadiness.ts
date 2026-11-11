// src/engine/publishReadiness.ts
// Contrôles locaux estimatifs de préparation d'un monde WorldPilot.
// Ces résultats ne constituent ni une certification Victoria VR, ni une approbation de publication.

import { WorldState, WorldEvent } from '../core/types';
import { validateWorld } from './validator';
import { findCounterExample } from '../simulation/simulator';

export type LandPresetType = 'standard' | 'large' | 'estate';

export interface LandPreset {
  id: LandPresetType;
  title: string;
  width: number; // Taille X en mètres
  depth: number; // Taille Z en mètres
  maxHeight: number; // Hauteur maximale Y autorisée
  description: string;
}

export const LOCAL_PARCEL_PRESETS: Record<LandPresetType, LandPreset> = {
  standard: {
    id: 'standard',
    title: 'Compact (10m × 10m)',
    width: 10,
    depth: 10,
    maxHeight: 8,
    description: 'Gabarit géométrique local pour une scène compacte ; ces dimensions ne sont pas une spécification officielle.'
  },
  large: {
    id: 'large',
    title: 'Moyen (20m × 20m)',
    width: 20,
    depth: 20,
    maxHeight: 15,
    description: 'Gabarit géométrique local de taille moyenne ; ces dimensions ne sont pas une spécification officielle.'
  },
  estate: {
    id: 'estate',
    title: 'Étendu (40m × 40m)',
    width: 40,
    depth: 40,
    maxHeight: 25,
    description: 'Gabarit géométrique local de grande taille ; ces dimensions ne sont pas une spécification officielle.'
  }
};

export type CheckCategory = 'logic' | 'invariants' | 'spatial' | 'performance' | 'compliance';

export interface CheckResult {
  id: string;
  category: CheckCategory;
  title: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  message: string;
  details?: string;
  metric?: string;
  fixAdvice?: string;
}

export interface PublishReadinessReport {
  overallStatus: 'CHECKS_PASSED' | 'WARNINGS' | 'BLOCKED';
  score: number; // 0 à 100
  worldId: string;
  worldVersion: number;
  timestamp: number;
  reportId: string;
  landPreset: LandPreset;
  entityCount: number;
  rulesCount: number;
  invariantsCount: number;
  checks: CheckResult[];
  categoryScores: Record<CheckCategory, number>;
  estimatedBudgetChecks: {
    desktopWeb: boolean;
    mobileWeb: boolean;
    vrHeadset: boolean;
  };
  summary: {
    passCount: number;
    warnCount: number;
    failCount: number;
  };
}

/** Creates a human-readable local report identifier; it is not a digest or signature. */
function createLocalReportId(worldId: string, version: number, timestamp: number): string {
  const safeWorldId = worldId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40) || 'world';
  return `wp-report-${safeWorldId}-v${version}-${timestamp}`;
}

/**
 * Exécute les contrôles WorldPilot locaux. Les seuils et résultats ne valent pas conformité officielle.
 */
export function evaluatePublishReadiness(
  state: WorldState,
  presetId: LandPresetType = 'standard'
): PublishReadinessReport {
  const landPreset = LOCAL_PARCEL_PRESETS[presetId] || LOCAL_PARCEL_PRESETS.standard;
  const checks: CheckResult[] = [];
  const entities = Object.values(state.ir.entities);
  const rules = Object.values(state.ir.rules);
  const invariants = Object.values(state.ir.invariants);

  // =========================================================================
  // 1. LOGIQUE CAUSALE & GRAPH STRUCTURAL
  // =========================================================================
  const validation = validateWorld(state);
  if (validation.valid) {
    checks.push({
      id: 'logic_graph_consistency',
      category: 'logic',
      title: 'Cohérence du graphe de causalité',
      status: 'PASS',
      message: 'Toutes les règles pointent vers des entités existantes et leurs triggers sont bien formés.',
      metric: `${rules.length} règles vérifiées`
    });
  } else {
    checks.push({
      id: 'logic_graph_consistency',
      category: 'logic',
      title: 'Incohérence du graphe de causalité',
      status: 'FAIL',
      message: `${validation.errors.length} anomalie(s) détectée(s) dans les liaisons logiques.`,
      details: validation.errors.join(' • '),
      fixAdvice: 'Vérifiez que les sourceId et targetId des règles correspondent bien à des objets déclarés.'
    });
  }

  // Vérification des zones de déclenchement (trigger zones)
  const triggerZones = entities.filter(e => e.capabilities.some(c => c.type === 'trigger_zone'));
  const colliders = entities.filter(e => e.capabilities.some(c => c.type === 'collider'));
  if (triggerZones.length > 0 && colliders.length === 0) {
    checks.push({
      id: 'logic_trigger_colliders',
      category: 'logic',
      title: 'Zones d\'interaction sans objets physiques',
      status: 'WARN',
      message: 'Des zones de détection sont présentes mais la scène ne contient aucun objet manipulable avec collider.',
      fixAdvice: 'Ajoutez au moins un objet physique susceptible d\'entrer dans la zone de détection.'
    });
  } else {
    checks.push({
      id: 'logic_trigger_colliders',
      category: 'logic',
      title: 'Couplage déclencheurs / physiques',
      status: 'PASS',
      message: `${triggerZones.length} zone(s) active(s) et ${colliders.length} objet(s) interactif(s) prêts.`,
      metric: `${triggerZones.length} zones / ${colliders.length} colliders`
    });
  }

  // =========================================================================
  // 2. Recherche bornée d'invariants déclarés
  // =========================================================================
  if (invariants.length === 0) {
    checks.push({
      id: 'invariants_coverage',
      category: 'invariants',
      title: 'Couverture des invariants déclarés',
      status: 'WARN',
      message: 'Aucun invariant n\'est défini. Aucun contrôle de ces propriétés ne peut être exécuté.',
      fixAdvice: 'Ajoutez une règle d\'invariant (ex: « Nobody should complete training without inspecting the battery »).'
    });
  } else {
    // Épreuve du simulateur de contre-exemples
    const possibleEvents: WorldEvent[] = [
      { type: 'INSPECT', sourceId: 'player' },
      { type: 'COMPLETE_TRAINING', sourceId: 'player' },
      { type: 'DROP', sourceId: 'player' },
      { type: 'CLICK', sourceId: 'player' },
      { type: 'RESET', sourceId: 'player' }
    ];
    const counterExampleResult = findCounterExample(state, possibleEvents, 3);

    if (counterExampleResult.invariantBroken) {
      checks.push({
        id: 'invariants_bounded_search',
        category: 'invariants',
        title: 'Violation d\'invariant détectée (Contre-exemple trouvé)',
        status: 'FAIL',
        message: `L'invariant '${counterExampleResult.brokenInvariantId}' peut être violé par la séquence : [${counterExampleResult.trace.map(t => t.type).join(' → ')}].`,
        details: 'Un chemin d\'exécution permet à l\'utilisateur d\'enfreindre la spécification de sécurité.',
        fixAdvice: 'Ajoutez une condition de garde bloquant l\'action avant la validation du pré-requis.'
      });
    } else {
      checks.push({
        id: 'invariants_bounded_search',
        category: 'invariants',
        title: 'Recherche bornée sans contre-exemple trouvé',
        status: 'PASS',
        message: `${invariants.length} invariant(s) ont été examinés avec un ensemble fixe d’événements et une profondeur maximale de 3. Aucun contre-exemple n’a été trouvé dans cette recherche limitée ; cela ne prouve pas la sûreté générale du monde.`,
        metric: `${invariants.length} invariants ; profondeur 3`
      });
    }
  }

  // =========================================================================
  // 3. Bornes spatiales selon un preset local non officiel
  // =========================================================================
  const halfW = landPreset.width / 2;
  const halfD = landPreset.depth / 2;
  const outOfBoundsEntities: { name: string; pos: { x: number; y: number; z: number }; overflow: string }[] = [];

  for (const ent of entities) {
    const transform = ent.capabilities.find(c => c.type === 'transform');
    if (transform && transform.position) {
      const rawPos: any = transform.position;
      const x = Array.isArray(rawPos) ? Number(rawPos[0]) || 0 : Number(rawPos.x) || 0;
      const y = Array.isArray(rawPos) ? Number(rawPos[1]) || 0 : Number(rawPos.y) || 0;
      const z = Array.isArray(rawPos) ? Number(rawPos[2]) || 0 : Number(rawPos.z) || 0;
      const xOverflow = Math.abs(x) - halfW;
      const zOverflow = Math.abs(z) - halfD;
      const yOverflow = y - landPreset.maxHeight;

      if (xOverflow > 0.05 || zOverflow > 0.05 || yOverflow > 0.05) {
        const reasons: string[] = [];
        if (xOverflow > 0.05) reasons.push(`Largeur X (+${xOverflow.toFixed(2)}m)`);
        if (zOverflow > 0.05) reasons.push(`Profondeur Z (+${zOverflow.toFixed(2)}m)`);
        if (yOverflow > 0.05) reasons.push(`Hauteur Y (+${yOverflow.toFixed(2)}m)`);
        outOfBoundsEntities.push({
          name: ent.name || ent.id,
          pos: { x, y, z },
          overflow: reasons.join(', ')
        });
      }
    }
  }

  if (outOfBoundsEntities.length === 0) {
    checks.push({
      id: 'spatial_land_bounds',
      category: 'spatial',
      title: `Bornes du preset local ${landPreset.title}`,
      status: 'PASS',
      message: `Les origines des entités (${entities.length}) restent dans le gabarit de coordonnées local (${landPreset.width}m × ${landPreset.depth}m, hauteur max ${landPreset.maxHeight}m). Ce test ne mesure ni l’emprise complète des objets ni une parcelle Victoria VR.`,
      metric: '0 origine hors limites'
    });
  } else {
    checks.push({
      id: 'spatial_land_bounds',
      category: 'spatial',
      title: `Débordement du preset local (${outOfBoundsEntities.length} objets hors limites)`,
      status: 'FAIL',
      message: `${outOfBoundsEntities.length} élément(s) dépassent les limites du gabarit local « ${landPreset.title} ».`,
      details: outOfBoundsEntities.slice(0, 3).map(o => `${o.name} (${o.overflow})`).join(' • ') + (outOfBoundsEntities.length > 3 ? ` et ${outOfBoundsEntities.length - 3} autres` : ''),
      fixAdvice: `Recentrez les éléments ou basculez sur un gabarit de parcelle supérieur (${landPreset.id === 'standard' ? 'Large 20x20m' : 'Estate 40x40m'}).`
    });
  }

  // Vérification de la hauteur minimale du sol
  const sunkenEntities = entities.filter(e => {
    const t = e.capabilities.find(c => c.type === 'transform');
    if (!t || !t.position) return false;
    const rawPos: any = t.position;
    const py = Array.isArray(rawPos) ? Number(rawPos[1]) || 0 : Number(rawPos.y) || 0;
    return py < -0.15;
  });
  if (sunkenEntities.length > 0) {
    checks.push({
      id: 'spatial_ground_penetration',
      category: 'spatial',
      title: 'Pénétration d\'objets sous le sol',
      status: 'WARN',
      message: `${sunkenEntities.length} objet(s) sont positionnés sous le niveau zéro du sol.`,
      details: sunkenEntities.map(e => e.name || e.id).slice(0, 3).join(', '),
      fixAdvice: 'Relevez ces éléments à Y >= 0 pour éviter tout clipping visuel avec le terrain.'
    });
  } else {
    checks.push({
      id: 'spatial_ground_penetration',
      category: 'spatial',
      title: 'Alignement vertical au sol',
      status: 'PASS',
      message: 'Aucune origine d’entité ne passe sous le seuil local. La géométrie des modèles n’est pas examinée ici.',
      metric: 'Origine Y >= -0.15m'
    });
  }

  // =========================================================================
  // 4. PERFORMANCE MULTI-PLATEFORMES & BUDGETS
  // =========================================================================
  // Very rough application-level proxy; this does not inspect rendered meshes or measure FPS.
  const estimatedPolysPerEntity = 450; // Moyenne pour nos modèles détaillés
  const totalEstimatedPolys = entities.length * estimatedPolysPerEntity;
  const drawCalls = entities.length + 8; // R3F batches + lighting/skybox

  // Heuristic desktop budget; these estimates do not measure the rendered device frame.
  const desktopPass = totalEstimatedPolys <= 600000 && drawCalls <= 200;

  // Budget Mobile Web (Touch) : max 180k polys, max 60 draw calls
  const mobilePass = totalEstimatedPolys <= 180000 && drawCalls <= 80;

  // Budget Casques VR (Meta Quest 3 & Apple Vision Pro) : max 280k polys, max 100 draw calls
  const vrPass = totalEstimatedPolys <= 280000 && drawCalls <= 120;

  if (vrPass && mobilePass) {
    checks.push({
      id: 'performance_polygon_budget',
      category: 'performance',
      title: 'Estimation grossière de complexité',
      status: 'PASS',
      message: `Estimation simplifiée à partir du nombre d’entités (~${Math.round(totalEstimatedPolys / 1000)}k polygones estimés, ${drawCalls} draw calls estimés). Aucun appareil ni framerate réel n’a été mesuré.`,
      metric: `Estimation : ${Math.round(totalEstimatedPolys / 1000)}k polys / ${drawCalls} draw calls`
    });
  } else if (vrPass) {
    checks.push({
      id: 'performance_polygon_budget',
      category: 'performance',
      title: 'Estimation dans le budget VR heuristique',
      status: 'WARN',
      message: `L’estimation simplifiée respecte le seuil VR interne mais dépasse le seuil mobile. Aucun appareil ni framerate réel n’a été mesuré (~${Math.round(totalEstimatedPolys / 1000)}k polygones estimés).`,
      fixAdvice: 'Réduisez le nombre d’entités puis mesurez le rendu sur les appareils cibles.'
    });
  } else {
    checks.push({
      id: 'performance_polygon_budget',
      category: 'performance',
      title: 'Seuil d’estimation de complexité dépassé',
      status: 'FAIL',
      message: `Le proxy interne de complexité dépasse son seuil. Il compte environ ${Math.round(totalEstimatedPolys / 1000)}k polygones et ${drawCalls} draw calls par des règles fixes ; ce n’est pas une mesure du temps réel.`,
      fixAdvice: 'Réduisez les entités et profilez le rendu réel sur chaque appareil cible.'
    });
  }

  // Vérification de la taille des hitboxes d'interaction pour mobile et VR Hand-Tracking
  const smallHitboxes = entities.filter(e => {
    const isInteractive = e.capabilities.some(c => c.type === 'collider' || c.type === 'trigger_zone');
    if (!isInteractive) return false;
    const triggerCap = e.capabilities.find(c => c.type === 'trigger_zone');
    if (triggerCap?.radius && triggerCap.radius * 2 >= 0.08) return false;
    const t = e.capabilities.find(c => c.type === 'transform');
    if (t && t.scale) {
      const rawScale: any = t.scale;
      const sx = Array.isArray(rawScale) ? (Number(rawScale[0]) || 1) : (rawScale.x || 1);
      const sy = Array.isArray(rawScale) ? (Number(rawScale[1]) || 1) : (rawScale.y || 1);
      const sz = Array.isArray(rawScale) ? (Number(rawScale[2]) || 1) : (rawScale.z || 1);
      // Flat plates/tiles/mats have a thin vertical thickness (sy) but a wide horizontal footprint (sx, sz)
      const graspableSpan = Math.max(sx, sy, sz);
      return graspableSpan < 0.08;
    }
    return false;
  });

  if (smallHitboxes.length > 0) {
    checks.push({
      id: 'performance_ergonomics_touch_vr',
      category: 'performance',
      title: 'Heuristique de taille des interactions',
      status: 'WARN',
      message: `${smallHitboxes.length} entité(s) interactive(s) passent sous le seuil d’échelle interne. Ce contrôle ne mesure pas la taille réelle des hitboxes ni l’ergonomie sur écran tactile ou casque.`,
      details: smallHitboxes.slice(0, 3).map(e => e.name || e.id).join(', '),
      fixAdvice: 'Augmentez la zone de détection ou le collider de préhension à au moins 12cm.'
    });
  } else {
    checks.push({
      id: 'performance_ergonomics_touch_vr',
      category: 'performance',
      title: 'Seuil heuristique de taille des interactions',
      status: 'PASS',
      message: 'Les échelles et rayons déclarés dépassent le seuil interne. Aucun test tactile, de préhension ou de suivi des mains n’a été effectué.',
      metric: 'Seuil interne >= 8cm'
    });
  }

  // =========================================================================
  // 5. Provenance des actifs : non auditée automatiquement
  // =========================================================================
  checks.push({
    id: 'compliance_ip_assets',
    category: 'compliance',
    title: 'Provenance et licences des actifs',
    status: 'WARN',
    message: 'Ce contrôle ne lit pas d’inventaire de provenance et ne peut pas confirmer les licences. Vérifiez manuellement la source et les conditions de chaque asset livré.',
    metric: 'Vérification manuelle requise',
    fixAdvice: 'Fournissez un inventaire des sources, licences et crédits pour les assets réellement utilisés.'
  });

  checks.push({
    id: 'compliance_web3_compatibility',
    category: 'compliance',
    title: 'Intégration officielle Victoria VR',
    status: 'WARN',
    message: 'Aucune API, certification ou intégration officielle Victoria VR n’est vérifiée par ce rapport local.',
    metric: 'Non intégrée'
  });

  // =========================================================================
  // CALCUL DES SCORES ET DU STATUT GLOBAL
  // =========================================================================
  const passCount = checks.filter(c => c.status === 'PASS').length;
  const warnCount = checks.filter(c => c.status === 'WARN').length;
  const failCount = checks.filter(c => c.status === 'FAIL').length;

  // Calcul du score sur 100 (Chaque pass = +points, warn = -5, fail = -25)
  const baseScore = Math.round((passCount / checks.length) * 100);
  const penalty = (failCount * 25) + (warnCount * 5);
  const score = Math.max(10, Math.min(100, baseScore - penalty));

  let overallStatus: 'CHECKS_PASSED' | 'WARNINGS' | 'BLOCKED' = 'CHECKS_PASSED';
  if (failCount > 0) {
    overallStatus = 'BLOCKED';
  } else if (warnCount > 0 || score < 85) {
    overallStatus = 'WARNINGS';
  }

  // Calcul des scores par catégorie
  const categories: CheckCategory[] = ['logic', 'invariants', 'spatial', 'performance', 'compliance'];
  const categoryScores: Record<CheckCategory, number> = {
    logic: 100,
    invariants: 100,
    spatial: 100,
    performance: 100,
    compliance: 100
  };

  for (const cat of categories) {
    const catChecks = checks.filter(c => c.category === cat);
    if (catChecks.length > 0) {
      const catPass = catChecks.filter(c => c.status === 'PASS').length;
      const catFails = catChecks.filter(c => c.status === 'FAIL').length;
      const catWarns = catChecks.filter(c => c.status === 'WARN').length;
      categoryScores[cat] = Math.max(0, Math.min(100, Math.round(((catPass / catChecks.length) * 100) - (catFails * 40) - (catWarns * 15))));
    }
  }

  const timestamp = Date.now();
  const worldId = state.ir.activeQuestId || 'world';
  const reportId = createLocalReportId(worldId, state.version, timestamp);

  return {
    overallStatus,
    score,
    worldId,
    worldVersion: state.version,
    timestamp,
    reportId,
    landPreset,
    entityCount: entities.length,
    rulesCount: rules.length,
    invariantsCount: invariants.length,
    checks,
    categoryScores,
    estimatedBudgetChecks: {
      desktopWeb: desktopPass,
      mobileWeb: mobilePass,
      vrHeadset: vrPass
    },
    summary: {
      passCount,
      warnCount,
      failCount
    }
  };
}

/**
 * Exports a WorldPilot local readiness report; this is not a platform manifest or certificate.
 */
export function exportReadinessReportJSON(report: PublishReadinessReport): string {
  const payload = {
    reportType: 'WorldPilot local readiness report',
    schemaVersion: 'worldpilot-readiness-report/v2',
    reportId: report.reportId,
    generatedAt: new Date(report.timestamp).toISOString(),
    disclaimer: 'Local heuristic checks on application data only. Device performance, physical ergonomics, platform compatibility and approval were not measured. Not an official Victoria VR certification, publication approval, cryptographic signature, or blockchain record.',
    world: {
      worldId: report.worldId,
      version: report.worldVersion,
      overallStatus: report.overallStatus,
      localScore: `${report.score}/100`,
      entitiesCount: report.entityCount,
      rulesCount: report.rulesCount,
      invariantsCount: report.invariantsCount
    },
    localSpatialPreset: {
      presetId: report.landPreset.id,
      label: report.landPreset.title,
      dimensions: `${report.landPreset.width}m x ${report.landPreset.depth}m x ${report.landPreset.maxHeight}m`,
      officialSpecification: false
    },
    estimatedDeviceBudgets: report.estimatedBudgetChecks,
    categoryScores: report.categoryScores,
    auditTrail: report.checks.map(c => ({
      id: c.id,
      category: c.category,
      status: c.status,
      title: c.title,
      message: c.message,
      metric: c.metric,
      details: c.details || null
    }))
  };

  return JSON.stringify(payload, null, 2);
}
