import { WorldPatch, EntitySpec, RuleSpec, Invariant, QuestSpec } from '../core/types';
import { parseLibraryInstruction, normalize, catalog, fullCatalog, resolveCanonicalAssetId } from '../library/catalog';
import { demonstrationScenarios, createDemonstrationPatch } from '../library/demonstrations';
import { getSemanticDataset, materializeDataTo3D } from '../engine/dataIngestion';
import { 
  createTargetRangeGame, 
  createPuzzleLocksGame, 
  createGemCollectorGame, 
  createSurvivalHazardGame,
  create3DPuzzleGame,
  createGoGame
} from '../engine/gameplayPresets';
import { findPBRMaterialByQuery } from '../scene/pbrMaterials';
import { compilePedagogicalSimulation } from '../research/pedagogicalCompiler';
import { compileProceduralChallenge, type ChallengeDomain } from '../engine/proceduralChallengeEngine';
import { isFloorFurniture } from '../engine/spatialSurface';
import { v4 as uuidv4 } from 'uuid';

export interface CommandPlan {
  intent: string;
  actions: any[];
  clarification?: { needed: boolean; question?: string; options?: string[] };
}

export type InstructionSource = 'local_rules' | 'llm' | 'unresolved';

function toVec3Obj(
  v: any,
  fallback: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 }
): { x: number; y: number; z: number } {
  if (Array.isArray(v) && v.length >= 3) {
    return {
      x: Number.isFinite(Number(v[0])) ? Number(v[0]) : fallback.x,
      y: Number.isFinite(Number(v[1])) ? Number(v[1]) : fallback.y,
      z: Number.isFinite(Number(v[2])) ? Number(v[2]) : fallback.z
    };
  }
  if (v && typeof v === 'object') {
    return {
      x: Number.isFinite(Number(v.x)) ? Number(v.x) : fallback.x,
      y: Number.isFinite(Number(v.y)) ? Number(v.y) : fallback.y,
      z: Number.isFinite(Number(v.z)) ? Number(v.z) : fallback.z
    };
  }
  return { ...fallback };
}


export interface ParsedInstruction {
  plan: CommandPlan;
  patch: WorldPatch;
  source: InstructionSource;
  notice?: string;
}

function parseInstructionImpl(
  instruction: string, 
  context?: { selectedEntityId: string | null, pointedEntityId: string | null } | Record<string, EntitySpec>,
  entities: Record<string, EntitySpec> = {}
): { plan: CommandPlan, patch: WorldPatch } {
  if (
    context &&
    typeof context === 'object' &&
    !('selectedEntityId' in context) &&
    !('pointedEntityId' in context) &&
    Object.keys(entities).length === 0
  ) {
    entities = context as Record<string, EntitySpec>;
    context = { selectedEntityId: null, pointedEntityId: null };
  }
  const resolvedContext = (context as { selectedEntityId: string | null, pointedEntityId: string | null }) || { selectedEntityId: null, pointedEntityId: null };
  context = resolvedContext;
  const libraryPatch = parseLibraryInstruction(instruction, entities);
  if (libraryPatch) return { plan: { intent: "add_library_objects", actions: [{ action: "create_library_objects" }] }, patch: libraryPatch };

  const normClean = normalize(instruction).trim().replace(/[.!]$/, '');

  // NLP Mindel §20 : "Remplace ce produit par le modèle B en gardant sa position"
  // (Prompt-to-structured-world préservant l'identité et la disposition spatiale)
  const isReplacementInstruction = 
    /^(?:remplace|remplacer|substitue|substituer|change|changer|echange|echanger|replace|substitute)\s+/i.test(normClean) &&
    (normClean.includes(' par ') || normClean.includes(' with '));

  if (isReplacementInstruction) {
    const separator = normClean.includes(' par ') ? ' par ' : ' with ';
    const parts = normClean.split(separator);
    const sourcePartRaw = parts[0].replace(/^(?:remplace|remplacer|substitue|substituer|change|changer|echange|echanger|replace|substitute)\s+/i, '').trim();
    const targetPartRaw = parts[1].replace(/\b(?:en gardant|gardant|tout en gardant|en conservant|conservant|while keeping|keeping|preserving)\s+(?:sa|leur|la|its|their|the)?\s*(?:position|place|disposition|orientation|transformation)?\b.*$/i, '').trim();

    // Trouver l'entité source : soit celle sélectionnée, soit par matching de nom (en privilégiant les objets non-zones)
    let sourceEntity: EntitySpec | undefined;
    if ((sourcePartRaw.includes('ce produit') || sourcePartRaw.includes('cet objet') || sourcePartRaw.includes('l\'objet') || sourcePartRaw.includes('selection') || sourcePartRaw.includes('this item') || sourcePartRaw.includes('this object')) && context?.selectedEntityId && entities[context.selectedEntityId]) {
      sourceEntity = entities[context.selectedEntityId];
    } else {
      const orderedCandidates = [...Object.values(entities)].sort((a, b) => {
        const aZone = a.capabilities?.some(c => c.type === 'trigger_zone') ? 1 : 0;
        const bZone = b.capabilities?.some(c => c.type === 'trigger_zone') ? 1 : 0;
        return aZone - bZone;
      });
      const sourceCleanWords = sourcePartRaw.replace(/^(?:un|une|le|la|du|des|les|a|an|the)\s+/i, '').trim().split(/\s+/).filter(w => w.length >= 3);
      sourceEntity = orderedCandidates.find(e => {
        const normName = normalize(e.name).toLowerCase();
        return (
          normClean.includes(normName) ||
          sourcePartRaw.includes(normName) ||
          (e.id && sourcePartRaw.includes(e.id)) ||
          (normName.includes('batterie') && sourcePartRaw.includes('battery')) ||
          (normName.includes('battery') && sourcePartRaw.includes('batterie')) ||
          (sourceCleanWords.length > 0 && sourceCleanWords.every(w => normName.includes(w)))
        );
      });
      if (!sourceEntity && context?.selectedEntityId && entities[context.selectedEntityId]) {
        sourceEntity = entities[context.selectedEntityId];
      }
      if (!sourceEntity && (sourcePartRaw.includes('ce produit') || sourcePartRaw.includes('cet objet') || sourcePartRaw.includes('l\'objet') || sourcePartRaw.includes('this object'))) {
        sourceEntity = orderedCandidates.find(e => e.capabilities?.some(c => c.type === 'draggable')) || orderedCandidates[0];
      }
    }

    if (sourceEntity) {
      const sourceTransform = sourceEntity.capabilities.find(c => c.type === 'transform');
      const targetClean = targetPartRaw.replace(/^(?:un|une|le|la|du|des|les|a|an|the)\s+/i, '').trim();
      
      const matchedAsset = catalog.find(item => {
        const itemNorm = normalize(item.name).toLowerCase();
        return itemNorm === targetClean || itemNorm.includes(targetClean) || item.id === targetClean || item.id === `wp-${targetClean}`;
      });

      const newEntityId = `${(matchedAsset?.id || targetClean.replace(/[^a-z0-9_]/gi, '_').toLowerCase())}_${Date.now().toString(36).slice(-4)}`;
      const newEntityName = matchedAsset?.name || (targetClean.charAt(0).toUpperCase() + targetClean.slice(1));

      const newEntity: EntitySpec = {
        id: newEntityId,
        name: newEntityName,
        capabilities: [
          {
            type: 'transform',
            position: sourceTransform?.position ? toVec3Obj(sourceTransform.position, { x: 0, y: 0.85, z: 0 }) : { x: 0, y: 0.85, z: 0 },
            rotation: sourceTransform?.rotation ? toVec3Obj(sourceTransform.rotation, { x: 0, y: 0, z: 0 }) : undefined,
            scale: sourceTransform?.scale ? toVec3Obj(sourceTransform.scale, { x: 1, y: 1, z: 1 }) : undefined
          },
          { type: 'collider' },
          { type: 'draggable' }
        ],
        visuals: {
          assetId: matchedAsset?.id,
          shape: matchedAsset ? undefined : 'box',
          color: matchedAsset ? undefined : '#475569'
        },
        state: sourceEntity.state || 'default',
        relations: sourceEntity.relations ? JSON.parse(JSON.stringify(sourceEntity.relations)) : undefined
      };

      return {
        plan: {
          intent: 'replace_entity_preserving_transform',
          actions: [
            { action: 'remove_entity', target: sourceEntity.id },
            { action: 'create_entity', target: newEntityId }
          ]
        },
        patch: {
          entitiesRemoved: [sourceEntity.id],
          entitiesCreated: [newEntity]
        }
      };
    }
  }

  // NLP: Application de textures et matériaux PBR pré-calibrés
  const hasExplicitMaterialVerb =
    normClean.includes('texture') ||
    normClean.includes('materiau') ||
    normClean.includes('matériau') ||
    normClean.includes('matiere') ||
    normClean.includes('matière') ||
    normClean.includes('revêtement') ||
    normClean.includes('revetement') ||
    normClean.includes('habille') ||
    normClean.includes('recouvre');

  const isSceneCreationIntent =
    !hasExplicitMaterialVerb &&
    /\b(?:showroom|supercar|hypercar|bolide|atelier|boutique|laboratoire|penthouse|station|demonstration|demo|recette|scene|univers|jeu|mission|louis vuitton|cookie|cookies|ikea)\b/i.test(normClean);

  const hasMaterialWord = !isSceneCreationIntent && (
    hasExplicitMaterialVerb ||
    normClean.includes('marbre') ||
    normClean.includes('noyer') ||
    normClean.includes('chêne') ||
    normClean.includes('chene') ||
    (/\bcuir\b/.test(normClean) && !normClean.includes('cuire') && !normClean.includes('cuisson')) ||
    normClean.includes('acier') ||
    normClean.includes('inox') ||
    normClean.includes('titane') ||
    normClean.includes('béton') ||
    normClean.includes('beton') ||
    normClean.includes('laiton') ||
    normClean.includes('velours') ||
    normClean.includes('carbone') ||
    normClean.includes('terracotta')
  );

  if (hasMaterialWord) {
    const matchedPreset = findPBRMaterialByQuery(normClean);
    if (matchedPreset) {
      let targetEntity: EntitySpec | undefined;

      // 1. Search for an explicitly named entity in the prompt first (prioritizing non-zone objects)
      const entList = [...Object.values(entities)].sort((a, b) => {
        const aZone = a.capabilities?.some(c => c.type === 'trigger_zone') ? 1 : 0;
        const bZone = b.capabilities?.some(c => c.type === 'trigger_zone') ? 1 : 0;
        return aZone - bZone;
      });
      for (const ent of entList) {
        const normName = normalize(ent.name).toLowerCase();
        const normId = normalize(ent.id).toLowerCase();
        const words = normName.split(/\s+/).filter(w => w.length > 2);
        if (words.some(w => normClean.includes(w)) || (normId && normClean.includes(normId))) {
          targetEntity = ent;
          break;
        }
      }
      if (!targetEntity) {
        if (normClean.includes('table')) {
          targetEntity = entList.find(e => normalize(e.name).includes('table'));
        } else if (normClean.includes('comptoir')) {
          targetEntity = entList.find(e => normalize(e.name).includes('comptoir'));
        } else if (normClean.includes('socle')) {
          targetEntity = entList.find(e => normalize(e.name).includes('socle'));
        } else if (normClean.includes('sol')) {
          targetEntity = entList.find(e => normalize(e.name).includes('sol') || normalize(e.name).includes('floor'));
        } else if (normClean.includes('fauteuil') || normClean.includes('chaise')) {
          targetEntity = entList.find(e => normalize(e.name).includes('fauteuil') || normalize(e.name).includes('chaise'));
        } else if (normClean.includes('podium')) {
          targetEntity = entList.find(e => normalize(e.name).includes('podium'));
        }
      }

      // 2. Fallback to currently selected entity
      if (!targetEntity && context?.selectedEntityId && entities[context.selectedEntityId]) {
        targetEntity = entities[context.selectedEntityId];
      }

      if (targetEntity) {
        return {
          plan: {
            intent: 'apply_pbr_material',
            actions: [{
              action: 'set_material',
              entityId: targetEntity.id,
              materialPreset: matchedPreset.id,
              materialName: matchedPreset.name
            }]
          },
          patch: {
            entitiesChanged: [{
              id: targetEntity.id,
              visuals: {
                ...targetEntity.visuals,
                materialPreset: matchedPreset.id,
                textureUrl: `pbr:${matchedPreset.id}`,
                color: matchedPreset.defaultColor,
                roughness: matchedPreset.roughness,
                metalness: matchedPreset.metalness,
                clearcoat: matchedPreset.clearcoat,
                repeat: matchedPreset.defaultRepeat
              }
            }]
          }
        };
      }
    }
  }

  // Match World-Shifting Instantané commands (Mars, Zero-G, Lune, Terre, Cyberpunk, Antigravité)
  if (normClean.includes('surface martienne') || normClean.includes('base martienne') || normClean.includes('mode mars') || normClean.includes('sur mars') || normClean.includes('planete mars') || normClean.includes('cratere jezero') || normClean.includes('vers mars')) {
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('worldpilot_shift_world', { detail: { theme: 'martian-surface', gravity: [0, -3.72, 0] } }));
    return { plan: { intent: 'shift_world_theme', actions: [{ action: 'shift_theme', theme: 'martian-surface', gravity: [0, -3.72, 0] }] }, patch: {} };
  }

  if (
    !normClean.includes('coupole') &&
    !normClean.includes('observation') &&
    !normClean.includes('sas') &&
    !normClean.includes('casque') &&
    !normClean.includes('telemetrie') &&
    (normClean === 'apesanteur' || normClean === 'zero g' || normClean === 'zero gravite' || normClean === 'station spatiale' || normClean === 'mode station spatiale' || normClean === 'en orbite' || normClean === 'mode orbite' || normClean === 'sans pesanteur' || normClean.includes('mode apesanteur') || normClean.includes('mode zero g'))
  ) {
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('worldpilot_shift_world', { detail: { theme: 'orbital-zerog', gravity: [0, 0, 0] } }));
    return { plan: { intent: 'shift_world_theme', actions: [{ action: 'shift_theme', theme: 'orbital-zerog', gravity: [0, 0, 0] }] }, patch: {} };
  }

  if (normClean.includes('base lunaire') || normClean.includes('mode lune') || normClean.includes('gravite lunaire') || normClean.includes('sur la lune') || normClean.includes('mer de la tranquillite')) {
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('worldpilot_shift_world', { detail: { theme: 'lunar-base', gravity: [0, -1.62, 0] } }));
    return { plan: { intent: 'shift_world_theme', actions: [{ action: 'shift_theme', theme: 'lunar-base', gravity: [0, -1.62, 0] }] }, patch: {} };
  }

  if (normClean.includes('mode terre') || normClean.includes('salon terrestre') || normClean.includes('atelier terrestre') || normClean.includes('gravite normale') || normClean.includes('gravite terrestre') || normClean.includes('retour sur terre')) {
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('worldpilot_shift_world', { detail: { theme: 'earth-atelier', gravity: [0, -9.81, 0] } }));
    return { plan: { intent: 'shift_world_theme', actions: [{ action: 'shift_theme', theme: 'earth-atelier', gravity: [0, -9.81, 0] }] }, patch: {} };
  }

  if (normClean.includes('matrice cyberpunk') || normClean.includes('mode cyberpunk') || normClean.includes('neo tokyo') || normClean.includes('univers cyberpunk')) {
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('worldpilot_shift_world', { detail: { theme: 'cyberpunk-matrix', gravity: [0, -9.81, 0] } }));
    return { plan: { intent: 'shift_world_theme', actions: [{ action: 'shift_theme', theme: 'cyberpunk-matrix', gravity: [0, -9.81, 0] }] }, patch: {} };
  }

  if (normClean.includes('antigravite') || normClean.includes('gravite inversee') || normClean.includes('anomalie gravitationnelle') || normClean.includes('inversion de gravite')) {
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('worldpilot_shift_world', { detail: { theme: 'antigravity-anomaly', gravity: [0, 2.5, 0] } }));
    return { plan: { intent: 'shift_world_theme', actions: [{ action: 'shift_theme', theme: 'antigravity-anomaly', gravity: [0, 2.5, 0] }] }, patch: {} };
  }

  // Match Semantic Data-to-3D Commands (Anti-Skeuomorphic Data Visualization)
  if (normClean.includes('ventes trimestrielles') || normClean.includes('resultats financiers') || normClean.includes('performance financiere') || normClean.includes('chiffre d\'affaires') || normClean.includes('business quarterly')) {
    const dataset = getSemanticDataset('business-quarterly');
    const patch = materializeDataTo3D(dataset, 'linear');
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('worldpilot_data_materialized', { detail: { dataset } }));
    return { plan: { intent: 'materialize_data_3d', actions: [{ action: 'create_data_towers', dataset: dataset.id }] }, patch };
  }

  if (normClean.includes('donnees energetiques') || normClean.includes('mix energetique') || normClean.includes('graphique energie') || normClean.includes('decarbonation') || normClean.includes('energie 3d')) {
    const dataset = getSemanticDataset('energy-consumption');
    const patch = materializeDataTo3D(dataset, 'linear');
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('worldpilot_data_materialized', { detail: { dataset } }));
    return { plan: { intent: 'materialize_data_3d', actions: [{ action: 'create_data_towers', dataset: dataset.id }] }, patch };
  }

  if (normClean.includes('telemetrie du rover') || normClean.includes('telemetrie martienne') || normClean.includes('telemetrie spatiale') || normClean.includes('capteurs spatiaux') || normClean.includes('donnees telemetriques')) {
    const dataset = getSemanticDataset('space-telemetry');
    const patch = materializeDataTo3D(dataset, 'linear');
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('worldpilot_data_materialized', { detail: { dataset } }));
    return { plan: { intent: 'materialize_data_3d', actions: [{ action: 'create_data_towers', dataset: dataset.id }] }, patch };
  }

  if (normClean.includes('tokenomic') || normClean.includes('tokens vr') || normClean.includes('vr token') || normClean.includes('economie virtuelle') || normClean.includes('staking vr')) {
    const dataset = getSemanticDataset('victoria-vr-tokenomics');
    const patch = materializeDataTo3D(dataset, 'circular');
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('worldpilot_data_materialized', { detail: { dataset } }));
    return { plan: { intent: 'materialize_data_3d', actions: [{ action: 'create_data_towers', dataset: dataset.id }] }, patch };
  }

  if (normClean.includes('infrastructure cloud') || normClean.includes('cluster cloud') || normClean.includes('serveurs cloud') || normClean.includes('serveurs mondiaux') || normClean.includes('latence reseau') || normClean.includes('latence des serveurs') || normClean.includes('latence') || normClean.includes('centres de calcul') || normClean.includes('noeuds cloud')) {
    const dataset = getSemanticDataset('server-infrastructure');
    const patch = materializeDataTo3D(dataset, 'linear');
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('worldpilot_data_materialized', { detail: { dataset } }));
    return { plan: { intent: 'materialize_data_3d', actions: [{ action: 'create_data_towers', dataset: dataset.id }] }, patch };
  }

  if (normClean.includes('data to 3d') || normClean.includes('graphique 3d') || normClean.includes('visualise les donnees') || normClean.includes('materialise les donnees') || normClean.includes('piliers de donnees')) {
    const dataset = getSemanticDataset('business-quarterly');
    const patch = materializeDataTo3D(dataset, 'linear');
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('worldpilot_data_materialized', { detail: { dataset } }));
    return { plan: { intent: 'materialize_data_3d', actions: [{ action: 'create_data_towers', dataset: dataset.id }] }, patch };
  }

  // Match Emergent Gameplay Loops (Rapier Physics, Puzzle Locks, Gem Collector, Survival)
  if (normClean.includes('stand de tir') || normClean.includes('jeu de tir') || normClean.includes('tir sur cibles') || normClean.includes('cibles mouvantes') || normClean.includes('cibles rapier') || normClean.includes('tir rapier') || normClean.includes('jeu d\'action') || normClean.includes('jeu d action') || normClean.includes('jeu video d\'action') || normClean.includes('jeux d\'action') || normClean.includes('jeu d\'action simple') || normClean.includes('mini-jeu d\'action') || normClean.includes('mini jeu d\'action') || (normClean.includes('jeu') && normClean.includes('action')) || normClean.includes('target shooter') || normClean.includes('target range') || normClean.includes('shooting range') || normClean.includes('shooter') || normClean.includes('shooting gallery')) {
    const patch = createTargetRangeGame();
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('worldpilot_gameplay_started', { detail: { gameMode: 'target_range', title: 'Stand de Tir Spatial Rapier' } }));
    return { plan: { intent: 'create_gameplay_loop', actions: [{ action: 'load_preset', presetId: 'target-range' }] }, patch };
  }

  if (normClean.includes('puzzle 3d') || normClean.includes('puzzle 5x5') || normClean.includes('puzzle 5 x 5') || normClean.includes('puzzle en 5 x 5') || normClean.includes('puzzle en 5x5') || normClean.includes('taquin 3d') || normClean.includes('taquin') || normClean.includes('sliding puzzle')) {
    const patch = create3DPuzzleGame(5);
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('worldpilot_gameplay_started', { detail: { gameMode: 'custom', title: 'Taquin 3D · Puzzle 5x5' } }));
    return { plan: { intent: 'create_gameplay_loop', actions: [{ action: 'load_preset', presetId: 'puzzle-5x5' }] }, patch };
  }

  if (normClean.includes('jeu de go') || normClean.includes('jeu du go') || normClean.includes('partie de go') || normClean.includes('plateau de go') || normClean.includes('goban') || normClean.includes('go game') || normClean.includes('game of go') || (normClean.includes('go') && (normClean.includes('pierre') || normClean.includes('plateau') || normClean.includes('grille')))) {
    const patch = createGoGame();
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('worldpilot_gameplay_started', { detail: { gameMode: 'custom', title: 'Partie de Go · Goban 9x9' } }));
    return { plan: { intent: 'create_gameplay_loop', actions: [{ action: 'load_preset', presetId: 'go-game' }] }, patch };
  }

  if (normClean.includes('enigme des totems') || normClean.includes('enigme des 3 totems') || normClean.includes('enigme spatiale') || normClean.includes('escape room') || normClean.includes('coffre scelle') || normClean.includes('trois totems') || normClean.includes('3 totems') || normClean.includes('jeu de puzzle') || normClean.includes('jeu d\'enigme')) {
    const patch = createPuzzleLocksGame();
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('worldpilot_gameplay_started', { detail: { gameMode: 'puzzle_locks', title: 'Énigme des 3 Totems Célestes' } }));
    return { plan: { intent: 'create_gameplay_loop', actions: [{ action: 'load_preset', presetId: 'puzzle-locks' }] }, patch };
  }

  if (normClean.includes('course aux orbes') || normClean.includes('collecte de gemmes') || normClean.includes('orbes celestes') || normClean.includes('ramasse les gemmes') || normClean.includes('collecte d\'orbes') || normClean.includes('collecte des orbes') || normClean.includes('coin collector') || normClean.includes('jeu de collecte') || normClean.includes('collecter des gemmes') || normClean.includes('collecter des orbes')) {
    const patch = createGemCollectorGame();
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('worldpilot_gameplay_started', { detail: { gameMode: 'gem_collector', title: 'Course aux Orbes Célestes' } }));
    return { plan: { intent: 'create_gameplay_loop', actions: [{ action: 'load_preset', presetId: 'gem-collector' }] }, patch };
  }

  if (normClean.includes('mode survie') || normClean.includes('zone radioactive') || normClean.includes('jeu de survie') || normClean.includes('zone toxique') || normClean.includes('survie en zone') || normClean.includes('jeu d\'esquive') || normClean.includes('jeu d esquive')) {
    const patch = createSurvivalHazardGame();
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('worldpilot_gameplay_started', { detail: { gameMode: 'survival_hazard', title: 'Survie en Zone Radioactive' } }));
    return { plan: { intent: 'create_gameplay_loop', actions: [{ action: 'load_preset', presetId: 'survival-hazard' }] }, patch };
  }

  // --- Quick Action : Écran mural suspendu / Surélévation automatique derrière la table ---
  const isElevateSuspendedScreen = (
    normClean.includes('surelever') ||
    normClean.includes('surélever') ||
    normClean.includes('ecran mural suspendu') ||
    normClean.includes('écran mural suspendu') ||
    normClean.includes('mural suspendu') ||
    normClean.includes('suspendre le panneau') ||
    normClean.includes('suspendre la recette')
  ) && (
    normClean.includes('panneau') ||
    normClean.includes('recette') ||
    normClean.includes('ecran') ||
    normClean.includes('écran') ||
    normClean.includes('table') ||
    normClean.includes('derriere') ||
    normClean.includes('derrière') ||
    normClean.includes('hauteur') ||
    normClean.includes('choisis') ||
    normClean.includes('option')
  );

  if (isElevateSuspendedScreen) {
    const allEntities = Object.values(entities);
    const boardEntity = allEntities.find(e => 
      e.id.includes('board') ||
      e.id.includes('recipe') ||
      (e.name && normalize(e.name).toLowerCase().includes('recette')) ||
      e.capabilities.some(c => c.type === 'web_screen') ||
      e.visuals?.assetId === 'web-screen' ||
      e.visuals?.assetId === 'captions'
    );
    if (boardEntity) {
      const updatedCapabilities = boardEntity.capabilities.some(c => c.type === 'transform')
        ? boardEntity.capabilities.map(c => c.type === 'transform' ? {
            ...c,
            position: { x: 0, y: 0.55, z: -2.4 },
            rotation: { ...(c.rotation || { x: 0, y: 0, z: 0 }), y: 0 }
          } : c)
        : [...boardEntity.capabilities, { type: 'transform', position: { x: 0, y: 0.55, z: -2.4 }, rotation: { x: 0, y: 0, z: 0 } }];

      return {
        plan: {
          intent: 'elevate_screen_to_wall',
          actions: [{
            action: 'move_entity',
            target: boardEntity.id,
            entityName: boardEntity.name,
            preset: 'Écran mural suspendu',
            newPosition: { x: 0, y: 0.55, z: -2.4 }
          }]
        },
        patch: {
          entitiesChanged: [{
            id: boardEntity.id,
            capabilities: updatedCapabilities
          }]
        }
      };
    }
  }

  // --- Hands-On : Réparation d'Invariant Formel (Prompt correctif Hands-On n°2) ---
  if (
    (normClean.includes('verrouille') && (normClean.includes('inspection') || normClean.includes('batterie') || normClean.includes('invariant'))) ||
    (normClean.includes('lock') && (normClean.includes('inspection') || normClean.includes('battery') || normClean.includes('invariant'))) ||
    (normClean.includes('corrige') && (normClean.includes('faille') || normClean.includes('invariant') || normClean.includes('contre exemple'))) ||
    (normClean.includes('bloque') && normClean.includes('sans inspection')) ||
    normClean.includes('fix the security invariant') ||
    normClean.includes('fix the invariant') ||
    normClean.includes('require battery inspection') ||
    normClean.includes('lock battery inspection')
  ) {
    return {
      plan: { intent: 'fix_invariant', actions: [{ action: 'lock_invariant_precondition' }] },
      patch: {}
    };
  }

  // --- Hands-On : Injection de Conflit Spatial / Blast Radius par Prompt (Hands-On n°4) ---
  if (
    ((normClean.includes('etabli') || normClean.includes('workbench') || normClean.includes('bench')) && (normClean.includes('compartiment moteur') || normClean.includes('engine compartment') || normClean.includes('bac moteur') || normClean.includes('bac a batterie') || normClean.includes('engine') || normClean.includes('motor'))) ||
    normClean.includes('injecte un conflit') ||
    normClean.includes('inject conflict') ||
    normClean.includes('provoque un conflit') ||
    normClean.includes('cause conflict') ||
    normClean.includes('provoque une collision') ||
    normClean.includes('cause collision') ||
    normClean.includes('simule un conflit spatial')
  ) {
    return {
      plan: { intent: 'simulate_spatial_conflict', actions: [{ action: 'inject_spatial_conflict' }] },
      patch: {}
    };
  }

  // --- Hands-On : Auto-Guérison Pareto par Prompt (Hands-On n°4) ---
  if (
    (normClean.includes('corrige') && (normClean.includes('conflit spatial') || normClean.includes('collision') || normClean.includes('blast radius'))) ||
    (normClean.includes('repare') && (normClean.includes('conflit spatial') || normClean.includes('collision') || normClean.includes('blast radius'))) ||
    (normClean.includes('fix') && (normClean.includes('spatial conflict') || normClean.includes('conflict') || normClean.includes('collision') || normClean.includes('blast radius'))) ||
    (normClean.includes('resolve') && (normClean.includes('spatial conflict') || normClean.includes('conflict') || normClean.includes('collision') || normClean.includes('blast radius'))) ||
    normClean.includes('auto guerir') ||
    normClean.includes('auto heal') ||
    normClean.includes('patch de pareto') ||
    normClean.includes('pareto patch') ||
    normClean.includes('pareto repair') ||
    normClean.includes('reparation de pareto') ||
    normClean.includes('heal blast radius')
  ) {
    return {
      plan: { intent: 'pareto_auto_heal', actions: [{ action: 'apply_pareto_repair' }] },
      patch: {}
    };
  }

  // --- NLP Spatial Translation & Object Positioning ---
  // Ex: "recule la fiche recette vers l'arrière", "avance la fiche recette", "déplace la cocotte vers la droite", "monte l'étagère de 30 cm", "recentre le panneau"
  const isCameraTargeted = /\b(?:camera|caméra|vue|point de vue)\b/i.test(normClean);
  
  if (!isCameraTargeted) {
    const isMovementVerb = /\b(?:recule|reculer|recules|reculez|avance|avancer|avances|avancez|deplace|deplacer|deplaces|deplacez|déplace|déplacer|déplaces|déplacez|decale|decaler|decales|decalez|décale|décaler|décales|décalez|pousse|pousser|pousses|poussez|tire|tirer|tires|tirez|glisse|glisser|glisses|glissez|bouge|bouger|bouges|bougez|monte|monter|montes|montez|remonte|remonter|remontes|remontez|eleve|elever|élève|releve|relever|descends|descendre|descend|baisse|baisser|baisses|baissez|abaisse|abaisser|abaisses|abaissez|rapproche|rapprocher|rapproches|rapprochez|eloigne|eloigner|eloignes|éloigne|éloigner|translate|translater)\b/i.test(normClean);

    const hasDirectionalPhrase = /\b(?:vers l\s*arriere|en arriere|a l\s*arriere|au fond|vers le fond|plus loin|vers l\s*avant|en avant|a l\s*avant|au premier plan|devant|plus pres|vers la gauche|a gauche|sur la gauche|cote gauche|vers la droite|a droite|sur la droite|cote droit|vers le haut|en haut|plus haut|vers le ciel|en l\s*air|vers le bas|en bas|plus bas|vers le sol|au sol)\b/i.test(normClean);

    const relRefMatch = normClean.match(/\b(derriere|derrière|devant|a cote de|à côté de|a gauche de|à gauche de|a droite de|à droite de|sur)\s+(.+)/i);
    const hasRelativeRefPhrase = Boolean(relRefMatch);
    const isPlacementVerb = /\b(?:mets|mettre|place|placer|positionne|positionner|pose|poser|glisse|glisser|installe|installer)\b/i.test(normClean);

    const isPlacementWithDirection = (hasDirectionalPhrase || hasRelativeRefPhrase) && isPlacementVerb;

    const isPositionPreset = /\b(?:centre|centrer|recentre|recentrer|au centre|sur le cote gauche|sur le cote droit)\b/i.test(normClean) &&
      (/\bmets\b|\bmettre\b|\bplace\b|\bplacer\b|\bpositionne\b|\bpositionner\b|\bcentre\b|\brecentre\b|\baligne\b/.test(normClean));

    if (isMovementVerb || isPlacementWithDirection || isPositionPreset || (isPlacementVerb && hasRelativeRefPhrase)) {
      // Find target entity
      const allEntities = Object.values(entities);
      let targetEntity: EntitySpec | undefined;

      // Extract target candidate text before any relative preposition (e.g. "déplacer [la recette] derrière [la table de cuisson]")
      let targetCandidateText = normClean;
      if (relRefMatch && relRefMatch.index !== undefined) {
        const candidate = normClean.slice(0, relRefMatch.index).trim();
        const withoutVerb = candidate.replace(/\b(?:mets|mettre|place|placer|positionne|positionner|pose|poser|glisse|glisser|installe|installer|recule|reculer|avance|avancer|deplace|deplacer|déplace|déplacer|decale|decaler|décale|décaler|pousse|pousser|tire|tirer|bouge|bouger|monte|monter|descends|descendre|baisse|baisser|rapproche|rapprocher|eloigne|eloigner)\b/gi, '').trim();
        if (withoutVerb.length > 0) {
          targetCandidateText = withoutVerb;
        }
      }

      // 1. Explicit reference to selected entity
      if (context?.selectedEntityId && entities[context.selectedEntityId]) {
        if (/\b(?:cet objet|l objet|la selection|ceci|l element)\b/i.test(targetCandidateText) ||
            /\b(?:recule|avance|deplace|decale|monte|descends|pousse|tire)(?:-le|-la)?\s*$/i.test(targetCandidateText) ||
            /\b(?:recule|avance|deplace|decale|monte|descends|pousse|tire)(?:-le|-la)?\s+(?:de\s+\d+|vers|a\s+gauche|a\s+droite|en\s+arriere|en\s+avant|plus)/i.test(targetCandidateText)) {
          targetEntity = entities[context.selectedEntityId];
        }
      }

      // 2. Specific matching for Billboard / Fiche recette / Panneau / Écran
      if (!targetEntity) {
        const mentionsBoard =
          targetCandidateText.includes('fiche recette') ||
          targetCandidateText.includes('fiche de recette') ||
          targetCandidateText.includes('fiche') ||
          targetCandidateText.includes('recette') ||
          targetCandidateText.includes('panneau d affichage') ||
          targetCandidateText.includes('panneau daffichage') ||
          targetCandidateText.includes('panneau') ||
          targetCandidateText.includes('tableau blanc') ||
          targetCandidateText.includes('tableau') ||
          targetCandidateText.includes('billboard') ||
          targetCandidateText.includes('ecran') ||
          targetCandidateText.includes('web screen');

        if (mentionsBoard) {
          targetEntity = allEntities.find(e => {
            const n = normalize(e.name || '').toLowerCase();
            const id = e.id.toLowerCase();
            return (
              n.includes('fiche recette') ||
              n.includes('recette') ||
              id.includes('board') ||
              (id.includes('recipe') && id.includes('board')) ||
              e.capabilities.some(c => c.type === 'web_screen') ||
              e.visuals?.assetId === 'web-screen' ||
              n.includes('panneau') ||
              n.includes('tableau') ||
              n.includes('ecran') ||
              id.includes('screen')
            );
          });
        }
      }

      // 3. Specific matching for Table / Îlot / Comptoir
      if (!targetEntity) {
        const mentionsTable =
          targetCandidateText.includes('table') ||
          targetCandidateText.includes('ilot') ||
          targetCandidateText.includes('plan de travail') ||
          targetCandidateText.includes('comptoir') ||
          targetCandidateText.includes('bureau') ||
          targetCandidateText.includes('etabli');

        if (mentionsTable) {
          targetEntity = allEntities.find(e => {
            const n = normalize(e.name || '').toLowerCase();
            const id = e.id.toLowerCase();
            const assetId = (e.visuals?.assetId || '').toLowerCase();
            return (
              n.includes('ilot') ||
              id.includes('ilot') ||
              assetId.includes('ilot') ||
              n.includes('table') ||
              id.includes('table') ||
              n.includes('comptoir') ||
              n.includes('plan de travail') ||
              isFloorFurniture(e)
            );
          });
        }
      }

      // 4. General match by name length descending in targetCandidateText (prioritizing non-zone objects unless 'zone' or 'bac' is mentioned)
      const mentionsZoneOrBac = /\b(?:zone|bac)\b/i.test(normClean);
      const sortEntitiesForMove = (list: EntitySpec[]) =>
        [...list].sort((a, b) => {
          if (!mentionsZoneOrBac) {
            const aZone = a.capabilities?.some(c => c.type === 'trigger_zone') ? 1 : 0;
            const bZone = b.capabilities?.some(c => c.type === 'trigger_zone') ? 1 : 0;
            if (aZone !== bZone) return aZone - bZone;
          }
          return (b.name?.length || 0) - (a.name?.length || 0);
        });

      if (!targetEntity) {
        const sorted = sortEntitiesForMove(allEntities);
        for (const ent of sorted) {
          if (!ent.name) continue;
          const normName = normalize(ent.name).toLowerCase();
          const normId = normalize(ent.id).toLowerCase();
          if (targetCandidateText.includes(normName) || (normId && targetCandidateText.includes(normId))) {
            targetEntity = ent;
            break;
          }
          const words = normName.split(/[\s·•\-]+/).filter(w => w.length >= 3 && !['les', 'des', 'une', 'qui', 'pour', 'avec', 'dans', 'chef', 'frais', 'fraiche', 'jaune'].includes(w));
          if (words.some(w => new RegExp(`\\b${w}\\b`, 'i').test(targetCandidateText))) {
            targetEntity = ent;
            break;
          }
        }
      }

      // 4b. Fallback: if targetCandidateText did not find an entity, search normClean
      if (!targetEntity && targetCandidateText !== normClean) {
        const sorted = sortEntitiesForMove(allEntities);
        for (const ent of sorted) {
          if (!ent.name) continue;
          const normName = normalize(ent.name).toLowerCase();
          const normId = normalize(ent.id).toLowerCase();
          if (normClean.includes(normName) || (normId && normClean.includes(normId))) {
            targetEntity = ent;
            break;
          }
          const words = normName.split(/[\s·•\-]+/).filter(w => w.length >= 3 && !['les', 'des', 'une', 'qui', 'pour', 'avec', 'dans', 'chef', 'frais', 'fraiche', 'jaune'].includes(w));
          if (words.some(w => new RegExp(`\\b${w}\\b`, 'i').test(normClean))) {
            targetEntity = ent;
            break;
          }
        }
      }

      // 5. Fallback to selection or single entity
      if (!targetEntity && context?.selectedEntityId && entities[context.selectedEntityId]) {
        targetEntity = entities[context.selectedEntityId];
      } else if (!targetEntity && allEntities.length === 1) {
        targetEntity = allEntities[0];
      }

      if (targetEntity) {
        const curTransform = targetEntity.capabilities.find(c => c.type === 'transform');
        const curPos = curTransform?.position ? toVec3Obj(curTransform.position, { x: 0, y: 0, z: 0 }) : { x: 0, y: 0, z: 0 };

        // Check Position Presets (Centrer, Côté gauche, Côté droit)
        if (isPositionPreset) {
          const isBoard = targetEntity.id.includes('board') || 
            (targetEntity.name && normalize(targetEntity.name).toLowerCase().includes('recette')) ||
            targetEntity.capabilities.some(c => c.type === 'web_screen') ||
            targetEntity.visuals?.assetId === 'web-screen' ||
            targetEntity.visuals?.assetId === 'captions';

          let presetX = curPos.x;
          let presetY = curPos.y;
          let presetZ = curPos.z;
          let presetName = 'repositionné';
          let rotY = 0;

          if (normClean.includes('centre') || normClean.includes('recentre')) {
            presetX = 0;
            presetY = isBoard ? 0.55 : curPos.y; // Surélévation automatique en écran mural suspendu
            presetZ = (normClean.includes('haut') || normClean.includes('suspendu') || normClean.includes('derriere')) ? -2.4 : -2.1;
            presetName = (presetY >= 0.35) ? 'centré haut (écran mural suspendu)' : 'centré';
            rotY = 0;
          } else if (normClean.includes('gauche')) {
            presetX = -2.6;
            presetY = isBoard ? 0.2 : curPos.y;
            presetZ = -1.2;
            presetName = 'côté gauche';
            rotY = 0.45;
          } else if (normClean.includes('droite')) {
            presetX = 2.6;
            presetY = isBoard ? 0.2 : curPos.y;
            presetZ = -1.2;
            presetName = 'côté droit';
            rotY = -0.45;
          }

          const updatedCapabilities = targetEntity.capabilities.some(c => c.type === 'transform')
            ? targetEntity.capabilities.map(c => c.type === 'transform' ? {
                ...c,
                position: { x: presetX, y: presetY, z: presetZ },
                rotation: { ...toVec3Obj(c.rotation, { x: 0, y: 0, z: 0 }), y: rotY }
              } : c)
            : [...targetEntity.capabilities, { type: 'transform', position: { x: presetX, y: presetY, z: presetZ }, rotation: { x: 0, y: rotY, z: 0 } }];

          return {
            plan: {
              intent: 'preset_entity_position',
              actions: [{
                action: 'move_entity',
                target: targetEntity.id,
                entityName: targetEntity.name,
                preset: presetName,
                newPosition: { x: presetX, y: presetY, z: presetZ }
              }]
            },
            patch: {
              entitiesChanged: [{
                id: targetEntity.id,
                capabilities: updatedCapabilities
              }]
            }
          };
        }

        // Relative Reference Entity Positioning (ex: "derrière la table", "devant l'îlot", "à côté de l'établi", "sur la table")
        if (relRefMatch) {
          const relType = relRefMatch[1].toLowerCase().replace('à', 'a').replace('é', 'e');
          const refQuery = relRefMatch[2].toLowerCase();

          // Find the reference entity among other entities
          const otherEntities = allEntities.filter(e => e.id !== targetEntity!.id);
          let refEntity = otherEntities.find(e => {
            const n = normalize(e.name || '').toLowerCase();
            const id = e.id.toLowerCase();
            const assetId = (e.visuals?.assetId || '').toLowerCase();
            if (refQuery.includes('table') || refQuery.includes('ilot') || refQuery.includes('comptoir') || refQuery.includes('plan de travail') || refQuery.includes('cuisson') || refQuery.includes('etabli')) {
              return n.includes('ilot') || n.includes('table') || id.includes('ilot') || id.includes('table') || assetId.includes('ilot') || isFloorFurniture(e);
            }
            if (refQuery.includes('recette') || refQuery.includes('panneau') || refQuery.includes('fiche')) {
              return n.includes('recette') || n.includes('panneau') || id.includes('board') || assetId.includes('screen');
            }
            return false;
          });

          if (!refEntity) {
            const words = refQuery.split(/\s+/).filter(w => w.length >= 3 && !['les', 'des', 'une', 'qui', 'pour', 'avec', 'dans'].includes(w));
            refEntity = otherEntities.find(e => {
              const n = normalize(e.name || '').toLowerCase();
              return words.some(w => n.includes(w));
            });
          }

          if (refEntity) {
            const refTransform = refEntity.capabilities.find(c => c.type === 'transform');
            const refPos = refTransform?.position ? toVec3Obj(refTransform.position, { x: 0, y: 0, z: 0 }) : { x: 0, y: 0, z: 0 };
            const isBoardTarget = targetEntity.id.includes('board') || 
              (targetEntity.name && normalize(targetEntity.name).toLowerCase().includes('recette')) ||
              targetEntity.capabilities.some(c => c.type === 'web_screen') ||
              targetEntity.visuals?.assetId === 'web-screen' ||
              targetEntity.visuals?.assetId === 'captions';

            let newX = refPos.x;
            let newZ = refPos.z;
            let newY = isFloorFurniture(targetEntity) ? 0 : Math.max(0, curPos.y);
            let rotY: number | undefined = undefined;

            if (relType.includes('derriere')) {
              // Placé derrière l'objet de référence (profondeur Z négative vers l'arrière-plan)
              newX = Number(refPos.x.toFixed(3));
              rotY = 0; // Face vers la caméra et la table

              // Mode Écran mural suspendu : surélévation automatique à 0.55m au-dessus de la table/îlot
              if (isBoardTarget || isFloorFurniture(refEntity)) {
                newZ = Number((refPos.z - 2.4).toFixed(3));
                newY = 0.55;
              } else {
                newZ = Number((refPos.z - 1.8).toFixed(3));
              }
            } else if (relType.includes('devant')) {
              // Placé devant l'objet de référence (profondeur Z positive vers l'avant-plan)
              newX = Number(refPos.x.toFixed(3));
              newZ = Number((refPos.z + 1.4).toFixed(3));
              rotY = 0;
            } else if (relType.includes('a gauche')) {
              newX = Number((refPos.x - 1.8).toFixed(3));
              newZ = Number(refPos.z.toFixed(3));
            } else if (relType.includes('a droite') || relType.includes('a cote')) {
              // à droite / à côté
              newX = Number((refPos.x + 1.8).toFixed(3));
              newZ = Number(refPos.z.toFixed(3));
            } else if (relType.includes('sur')) {
              // Placé sur la surface de support
              newX = Number(refPos.x.toFixed(3));
              newZ = Number(refPos.z.toFixed(3));
              newY = Number((refPos.y + 0.922).toFixed(3));
            }

            const updatedCapabilities = targetEntity.capabilities.some(c => c.type === 'transform')
              ? targetEntity.capabilities.map(c => c.type === 'transform' ? {
                  ...c,
                  position: { x: newX, y: newY, z: newZ },
                  ...(rotY !== undefined ? { rotation: { ...toVec3Obj(c.rotation, { x: 0, y: 0, z: 0 }), y: rotY } } : {})
                } : c)
              : [
                  ...targetEntity.capabilities,
                  { type: 'transform', position: { x: newX, y: newY, z: newZ }, ...(rotY !== undefined ? { rotation: { x: 0, y: rotY, z: 0 } } : {}) }
                ];

            return {
              plan: {
                intent: 'translate_entity',
                actions: [{
                  action: 'move_entity',
                  target: targetEntity.id,
                  entityName: targetEntity.name,
                  referenceEntityId: refEntity.id,
                  referenceName: refEntity.name,
                  relation: relRefMatch[1],
                  newPosition: { x: newX, y: newY, z: newZ }
                }]
              },
              patch: {
                entitiesChanged: [{
                  id: targetEntity.id,
                  capabilities: updatedCapabilities
                }]
              }
            };
          }
        }

        // Relative Spatial Movement (dx, dy, dz)
        let distance = 0.5;
        let customDist = false;

        const cmMatch = normClean.match(/(?:de\s+|d'|d\s+)?(\d+(?:[.,]\d+)?)\s*(?:cm|centimetre|centimetres)\b/i);
        const mMatch = normClean.match(/(?:de\s+|d'|d\s+)?(\d+(?:[.,]\d+)?)\s*(?:m|metre|metres)\b/i);
        const unMetreMatch = /(?:de\s+|d\s+)?(?:un|1)\s*(?:metre|m\b)/i.test(normClean);
        const demiMetreMatch = /(?:de\s+|d\s+)?(?:demi|0\.5)\s*(?:metre|m\b)/i.test(normClean);
        const unPeuMatch = /(?:un peu|legerement|doucement)/i.test(normClean);
        const beaucoupMatch = /(?:beaucoup|nettement|loin)/i.test(normClean);

        if (cmMatch) {
          const val = parseFloat(cmMatch[1].replace(',', '.'));
          if (!isNaN(val) && val > 0) {
            distance = val / 100;
            customDist = true;
          }
        } else if (mMatch && !cmMatch) {
          const val = parseFloat(mMatch[1].replace(',', '.'));
          if (!isNaN(val) && val > 0) {
            distance = val;
            customDist = true;
          }
        } else if (demiMetreMatch) {
          distance = 0.5;
          customDist = true;
        } else if (unMetreMatch) {
          distance = 1.0;
          customDist = true;
        } else if (unPeuMatch) {
          distance = 0.2;
          customDist = true;
        } else if (beaucoupMatch) {
          distance = 1.0;
          customDist = true;
        }

        let isBack = false;
        let isFront = false;
        let isLeft = false;
        let isRight = false;
        let isUp = false;
        let isDown = false;

        // 1. Explicit directional phrases
        if (/\b(?:vers l\s*arriere|en arriere|a l\s*arriere|au fond|vers le fond|plus loin)\b/i.test(normClean)) {
          isBack = true;
        }
        if (/\b(?:vers l\s*avant|en avant|a l\s*avant|au premier plan|devant|plus pres)\b/i.test(normClean)) {
          isFront = true;
        }
        if (/\b(?:vers la gauche|a gauche|sur la gauche|a ma gauche|cote gauche)\b/i.test(normClean)) {
          isLeft = true;
        }
        if (/\b(?:vers la droite|a droite|sur la droite|a ma droite|cote droit)\b/i.test(normClean)) {
          isRight = true;
        }
        if (/\b(?:vers le haut|en haut|plus haut|vers le ciel|en l\s*air)\b/i.test(normClean)) {
          isUp = true;
        }
        if (/\b(?:vers le bas|en bas|plus bas|vers le sol|au sol)\b/i.test(normClean)) {
          isDown = true;
        }

        // 2. Inferred from movement verbs
        if (!isBack && !isFront && !isLeft && !isRight && !isUp && !isDown) {
          if (/\b(?:recule|reculer|recules|reculez|eloigne|eloigner|éloigne|éloigner)\b/i.test(normClean)) {
            isBack = true;
          } else if (/\b(?:avance|avancer|avances|avancez|rapproche|rapprocher|rapproches|rapprochez)\b/i.test(normClean)) {
            isFront = true;
          } else if (/\b(?:monte|monter|montes|montez|remonte|remonter|remontes|remontez|eleve|elever|élève|releve|relever)\b/i.test(normClean)) {
            isUp = true;
          } else if (/\b(?:descends|descendre|descend|baisse|baisser|baisses|baissez|abaisse|abaisser|abaisses|abaissez)\b/i.test(normClean)) {
            isDown = true;
          }
        }

        let dx = 0;
        let dy = 0;
        let dz = 0;
        const stepX = distance;
        const stepZ = distance;
        const stepY = customDist ? distance : 0.3;

        if (isLeft) dx -= stepX;
        if (isRight) dx += stepX;
        if (isBack) dz -= stepZ;
        if (isFront) dz += stepZ;
        if (isUp) dy += stepY;
        if (isDown) dy -= stepY;

        if (dx === 0 && dy === 0 && dz === 0) {
          return {
            plan: {
              intent: 'translate_entity',
              actions: [],
              clarification: {
                needed: true,
                question: `Dans quelle direction souhaitez-vous déplacer ${targetEntity.name} ?`,
                options: ['Vers l’arrière', 'Vers l’avant', 'Vers la gauche', 'Vers la droite', 'Vers le haut']
              }
            },
            patch: {}
          };
        }

        const newX = Number((curPos.x + dx).toFixed(3));
        const newZ = Number((curPos.z + dz).toFixed(3));
        let newY = Number((curPos.y + dy).toFixed(3));

        if (isFloorFurniture(targetEntity)) {
          newY = 0;
        } else if (dy === 0) {
          newY = Math.max(0, curPos.y);
        } else {
          newY = Math.max(0, newY);
        }

        const updatedCapabilities = targetEntity.capabilities.some(c => c.type === 'transform')
          ? targetEntity.capabilities.map(c => c.type === 'transform' ? {
              ...c,
              position: { x: newX, y: newY, z: newZ }
            } : c)
          : [
              ...targetEntity.capabilities,
              { type: 'transform', position: { x: newX, y: newY, z: newZ } }
            ];

        return {
          plan: {
            intent: 'translate_entity',
            actions: [{
              action: 'move_entity',
              target: targetEntity.id,
              entityName: targetEntity.name,
              dx, dy, dz,
              newPosition: { x: newX, y: newY, z: newZ }
            }]
          },
          patch: {
            entitiesChanged: [{
              id: targetEntity.id,
              capabilities: updatedCapabilities
            }]
          }
        };
      } else if (allEntities.length > 0) {
        return {
          plan: {
            intent: 'translate_entity',
            actions: [],
            clarification: {
              needed: true,
              question: `Quel objet souhaitez-vous déplacer dans la scène ?`,
              options: allEntities.slice(0, 5).map(e => e.name || e.id)
            }
          },
          patch: {}
        };
      }
    }
  }

  // Match Fullscreen Web Screen Modal commands
  if (normClean.includes('ouvre le site en grand') || normClean.includes('ouvre le site web') || normClean.includes('agrandis le panneau') || normClean.includes('agrandit le panneau') || normClean.includes('agrandir le panneau') || normClean.includes('plein ecran web') || normClean.includes('affiche le site en grand')) {
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('worldpilot_open_web_modal', {}));
    return { plan: { intent: 'open_web_modal', actions: [{ action: 'open_fullscreen_browser' }] }, patch: {} };
  }

  // Match Web Billboard & Interactive Screen commands
  if (normClean.includes('panneau web') || normClean.includes('ecran web') || normClean.includes('panneau d\'affichage') || normClean.includes('panneau daffichage') || normClean.includes('remets le panneau') || normClean.includes('remet le panneau') || normClean.includes('affiche le panneau') || normClean.includes('site web') || normClean.includes('wikipedia')) {
    let url = 'https://fr.m.wikipedia.org/wiki/Ratatouille';
    const urlMatch = instruction.match(/https?:\/\/[^\s]+/i);
    if (urlMatch) url = urlMatch[0];
    else if (normClean.includes('paris')) url = 'https://fr.m.wikipedia.org/wiki/Paris';
    else if (normClean.includes('cuisine') || normClean.includes('recette')) url = 'https://fr.m.wikipedia.org/wiki/Gastronomie_fran%C3%A7aise';
    
    const panelId = `web_screen_${Date.now()}`;
    const screenEntity: EntitySpec = {
      id: panelId,
      name: 'Panneau Web · Encyclopédie & Recettes',
      capabilities: [
        { type: 'transform', position: { x: 0, y: 0, z: -1.9 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
        { type: 'collider' },
        { type: 'web_screen', url },
        { type: 'educational', text: url, url, value: 0, active: true }
      ],
      visuals: { assetId: 'web-screen', modelUrl: '/library/captions.glb' }
    };
    return {
      plan: { intent: 'add_web_screen', actions: [{ action: 'create_entity', target: panelId, url }] },
      patch: { entitiesCreated: [screenEntity] }
    };
  }


  // Match Camera view commands
  if (normClean.includes('vue table') || normClean.includes('vue atelier') || normClean.includes('plan de travail') || normClean.includes('zoom table') || normClean.includes('rapproche la camera') || normClean.includes('avance la camera')) {
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('worldpilot_set_camera_preset', { detail: { preset: 'table' } }));
    return { plan: { intent: 'set_camera_preset', actions: [{ action: 'set_preset', preset: 'table' }] }, patch: {} };
  }
  if (normClean.includes('vue globale') || normClean.includes('vue d\'ensemble') || normClean.includes('vue d ensemble') || normClean.includes('reculer la camera') || normClean.includes('recule la camera') || normClean.includes('reculez la camera') || normClean.includes('vue large') || normClean.includes('dezoome')) {
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('worldpilot_set_camera_preset', { detail: { preset: 'overview' } }));
    return { plan: { intent: 'set_camera_preset', actions: [{ action: 'set_preset', preset: 'overview' }] }, patch: {} };
  }
  if (normClean.includes('vue panneau') || normClean.includes('zoom panneau') || normClean.includes('face au panneau') || normClean.includes('regarde le panneau')) {
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('worldpilot_set_camera_preset', { detail: { preset: 'board' } }));
    return { plan: { intent: 'set_camera_preset', actions: [{ action: 'set_preset', preset: 'board' }] }, patch: {} };
  }
  if (normClean.includes('vue cocotte') || normClean.includes('zoom cocotte') || normClean.includes('zoome sur la cocotte') || normClean.includes('vue poele') || normClean.includes('vue cuisson')) {
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('worldpilot_set_camera_preset', { detail: { preset: 'cocotte' } }));
    return { plan: { intent: 'set_camera_preset', actions: [{ action: 'set_preset', preset: 'cocotte' }] }, patch: {} };
  }
  if (normClean.includes('vue assiette') || normClean.includes('zoom assiette') || normClean.includes('zoome sur l assiette') || normClean.includes('zoome sur l\'assiette') || normClean.includes('vue dressage') || normClean.includes('regarde l assiette') || normClean.includes('regarde l\'assiette')) {
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('worldpilot_set_camera_preset', { detail: { preset: 'plate' } }));
    return { plan: { intent: 'set_camera_preset', actions: [{ action: 'set_preset', preset: 'plate' }] }, patch: {} };
  }
  if (normClean.includes('vue planche') || normClean.includes('zoom planche') || normClean.includes('vue decoupe') || normClean.includes('zoome sur la planche') || normClean.includes('vue couteau')) {
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('worldpilot_set_camera_preset', { detail: { preset: 'chopping' } }));
    return { plan: { intent: 'set_camera_preset', actions: [{ action: 'set_preset', preset: 'chopping' }] }, patch: {} };
  }

  // Match atmosphere and theme commands
  if (normClean.includes('le refuge') || normClean.includes('sanctuaire alpin') || normClean.includes('ambiance refuge') || normClean.includes('mode refuge') || normClean.includes('vous n\'avez rien a reussir') || normClean.includes('montagne et lac') || normClean.includes('feu de camp alpin')) {
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('worldpilot_set_theme', { detail: { themeId: 'le-refuge' } }));
    return { plan: { intent: 'set_world_theme', actions: [{ action: 'set_theme', themeId: 'le-refuge' }] }, patch: {} };
  }
  if (normClean.includes('ambiance pluie') || normClean.includes('il pleut')) {
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('worldpilot_set_atmosphere', { detail: { atmosphere: 'paris-rain' } }));
    return { plan: { intent: 'set_atmosphere', actions: [{ action: 'set_atmosphere', atmosphere: 'paris-rain' }] }, patch: {} };
  }
  if (normClean.includes('ambiance zen')) {
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('worldpilot_set_atmosphere', { detail: { atmosphere: 'zen-garden' } }));
    return { plan: { intent: 'set_atmosphere', actions: [{ action: 'set_atmosphere', atmosphere: 'zen-garden' }] }, patch: {} };
  }
  if (normClean.includes('ambiance fete') || normClean.includes('ambiance confettis')) {
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('worldpilot_set_atmosphere', { detail: { atmosphere: 'celebration-party' } }));
    return { plan: { intent: 'set_atmosphere', actions: [{ action: 'set_atmosphere', atmosphere: 'celebration-party' }] }, patch: {} };
  }
  if (normClean.includes('ambiance nuit') || normClean.includes('ambiance luciole')) {
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('worldpilot_set_atmosphere', { detail: { atmosphere: 'starry-night' } }));
    return { plan: { intent: 'set_atmosphere', actions: [{ action: 'set_atmosphere', atmosphere: 'starry-night' }] }, patch: {} };
  }
  if (normClean.includes('ambiance cyberpunk') || normClean.includes('ambiance neon')) {
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('worldpilot_set_atmosphere', { detail: { atmosphere: 'cyberpunk-neon' } }));
    return { plan: { intent: 'set_atmosphere', actions: [{ action: 'set_atmosphere', atmosphere: 'cyberpunk-neon' }] }, patch: {} };
  }
  if (normClean.includes('ambiance cafe') || normClean.includes('ambiance bistrot')) {
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('worldpilot_set_atmosphere', { detail: { atmosphere: 'cozy-bistrot' } }));
    return { plan: { intent: 'set_atmosphere', actions: [{ action: 'set_atmosphere', atmosphere: 'cozy-bistrot' }] }, patch: {} };
  }
  if (normClean.includes('ambiance matin') || normClean.includes('ambiance doree') || normClean.includes('golden hour')) {
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('worldpilot_set_atmosphere', { detail: { atmosphere: 'golden-morning' } }));
    return { plan: { intent: 'set_atmosphere', actions: [{ action: 'set_atmosphere', atmosphere: 'golden-morning' }] }, patch: {} };
  }

  // Match Spatial Agent / Guide commands
  if (!normClean.includes('fantome') && (normClean.includes('affiche le guide') || normClean.includes('appelle le guide') || normClean.includes('fais venir le guide') || normClean.includes('fais venir le chef') || normClean.includes('active le guide') || normClean === 'guide')) {
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('worldpilot_toggle_agent', { detail: { active: true } }));
    return { plan: { intent: 'toggle_spatial_agent', actions: [{ action: 'show_agent' }] }, patch: {} };
  }
  if (!normClean.includes('fantome') && (normClean.includes('masque le guide') || normClean.includes('cache le guide') || normClean.includes('cache l\'instructeur') || normClean.includes('desactive le guide'))) {
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('worldpilot_toggle_agent', { detail: { active: false } }));
    return { plan: { intent: 'toggle_spatial_agent', actions: [{ action: 'hide_agent' }] }, patch: {} };
  }

  // Match audio master volume & mute commands
  if (normClean === 'mute' || normClean === 'muet' || normClean.includes('coupe le son') || normClean.includes('silence') || normClean.includes('desactive le son') || normClean.includes('couper le son') || normClean.includes('mode silencieux')) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('worldpilot_set_audio', { detail: { muted: true } }));
    }
    return { plan: { intent: 'set_audio_muted', actions: [{ action: 'mute', value: true }] }, patch: {} };
  }
  if (normClean === 'unmute' || normClean.includes('remets le son') || normClean.includes('active le son') || normClean.includes('retablis le son') || normClean.includes('reactive le son')) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('worldpilot_set_audio', { detail: { muted: false } }));
    }
    return { plan: { intent: 'set_audio_muted', actions: [{ action: 'mute', value: false }] }, patch: {} };
  }
  if (normClean.includes('baisse le son') || normClean.includes('diminue le son') || normClean.includes('volume bas') || normClean.includes('volume doux')) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('worldpilot_set_audio', { detail: { volume: 0.3 } }));
    }
    return { plan: { intent: 'set_audio_volume', actions: [{ action: 'set_volume', volume: 0.3 }] }, patch: {} };
  }
  if (normClean.includes('monte le son') || normClean.includes('augmente le son') || normClean.includes('volume fort') || normClean.includes('volume max')) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('worldpilot_set_audio', { detail: { volume: 1.0 } }));
    }
    return { plan: { intent: 'set_audio_volume', actions: [{ action: 'set_volume', volume: 1.0 }] }, patch: {} };
  }

  // Match 3D labels toggle commands
  if (normClean.includes('masque les etiquettes') || normClean.includes('cache les etiquettes') || normClean.includes('desactive les etiquettes') || normClean === 'hide labels') {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('worldpilot_set_labels', { detail: { show: false } }));
    }
    return { plan: { intent: 'set_labels_visible', actions: [{ action: 'set_labels', show: false }] }, patch: {} };
  }
  if (normClean.includes('affiche les etiquettes') || normClean.includes('montre les etiquettes') || normClean.includes('active les etiquettes') || normClean === 'show labels') {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('worldpilot_set_labels', { detail: { show: true } }));
    }
    return { plan: { intent: 'set_labels_visible', actions: [{ action: 'set_labels', show: true }] }, patch: {} };
  }

  // Match Spatial Agent / Avatar visibility and positioning commands
  const mentionsAvatar = !normClean.includes('fantome') && /\b(?:avatar|guide|pnj|hote|victoria)\b/i.test(normClean);
  if (mentionsAvatar) {
    // Check if hiding avatar
    if (/\b(?:masque|cache|desactive|retire|enlève|enleve|hide)\b/i.test(normClean) && !/\b(?:devant|derriere|derrière|a cote|sur)\b/i.test(normClean)) {
      return {
        plan: {
          intent: 'toggle_spatial_avatar',
          actions: [{ action: 'set_visibility', show: false }]
        },
        patch: {}
      };
    }

    // Check if relative positioning relative to an entity: "devant le panneau de recette", "derrière la table", "à côté de l'îlot"
    const relMatch = normClean.match(/\b(devant|derriere|derrière|a cote de|à côté de|a droite de|à droite de|a gauche de|à gauche de)\s+(.+)/i);
    if (relMatch) {
      const relType = relMatch[1].toLowerCase().replace('à', 'a').replace('é', 'e');
      const refQuery = relMatch[2].toLowerCase();

      // Find reference entity
      const allEnts = Object.values(entities);
      let refEnt = allEnts.find(e => {
        const n = normalize(e.name || '').toLowerCase();
        const id = e.id.toLowerCase();
        if (refQuery.includes('recette') || refQuery.includes('panneau') || refQuery.includes('fiche') || refQuery.includes('tableau')) {
          return n.includes('recette') || n.includes('panneau') || id.includes('board') || id.includes('recipe') || e.capabilities.some(c => c.type === 'web_screen');
        }
        if (refQuery.includes('table') || refQuery.includes('ilot') || refQuery.includes('comptoir')) {
          return n.includes('ilot') || n.includes('table') || id.includes('ilot') || id.includes('table') || isFloorFurniture(e);
        }
        return false;
      });

      if (!refEnt) {
        const words = refQuery.split(/\s+/).filter(w => w.length >= 3 && !['les', 'des', 'une', 'qui', 'pour', 'avec', 'dans'].includes(w));
        refEnt = allEnts.find(e => {
          const n = normalize(e.name || '').toLowerCase();
          return words.some(w => n.includes(w));
        });
      }

      if (refEnt) {
        const refTransform = refEnt.capabilities.find(c => c.type === 'transform');
        const refPos = refTransform?.position ? toVec3Obj(refTransform.position, { x: 0, y: 0, z: 0 }) : { x: 0, y: 0, z: 0 };
        let targetX = refPos.x;
        let targetZ = refPos.z;

        if (relType.includes('devant')) {
          // Devant l'entité (profondeur Z positive vers l'avant / la caméra)
          targetX = Number((refPos.x - 0.25).toFixed(3));
          targetZ = Number((refPos.z + 0.85).toFixed(3));
        } else if (relType.includes('derriere')) {
          targetX = Number((refPos.x).toFixed(3));
          targetZ = Number((refPos.z - 1.2).toFixed(3));
        } else if (relType.includes('a gauche')) {
          targetX = Number((refPos.x - 1.4).toFixed(3));
          targetZ = Number((refPos.z + 0.2).toFixed(3));
        } else {
          // à droite / à côté
          targetX = Number((refPos.x + 1.4).toFixed(3));
          targetZ = Number((refPos.z + 0.2).toFixed(3));
        }

        return {
          plan: {
            intent: 'position_spatial_avatar',
            actions: [{
              action: 'position_avatar',
              referenceEntityId: refEnt.id,
              referenceName: refEnt.name,
              position: { x: targetX, y: 0, z: targetZ },
              toastMessage: `👤 Avatar positionné ${relMatch[1]} ${refEnt.name}.`
            }]
          },
          patch: {}
        };
      }
    }

    // Default: make avatar visible
    if (/\b(?:affiche|montre|active|fais apparaitre|viens|approche|show)\b/i.test(normClean)) {
      return {
        plan: {
          intent: 'toggle_spatial_avatar',
          actions: [{ action: 'set_visibility', show: true }]
        },
        patch: {}
      };
    }
  }

  // Match cooking recipes modal open commands (strictly for catalogue / choosing recipes)
  const isExcludedFromRecipeModal = (
    normClean.includes('avatar') || 
    normClean.includes('panneau') || 
    /\bfiche\b/i.test(normClean) || 
    normClean.includes('tableau') || 
    normClean.includes('devant') || 
    normClean.includes('derriere') || 
    normClean.includes('derrière') ||
    normClean.includes('place') || 
    normClean.includes('recule') || 
    normClean.includes('avance') ||
    normClean.includes('deplace')
  );
  if (!isExcludedFromRecipeModal && normClean.includes('recette') && (
    normClean.includes('catalogue') || 
    normClean.includes('liste') || 
    normClean.includes('choisir') || 
    normClean.includes('changer') || 
    normClean.includes('ouvre') ||
    normClean === 'affiche les recettes' ||
    normClean === 'voir les recettes' ||
    normClean === 'toutes les recettes'
  )) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('worldpilot_open_cooking_modal'));
    }
    return { plan: { intent: 'open_cooking_recipes_modal', actions: [{ action: 'open_modal' }] }, patch: {} };
  }

  // Match stirring / mixing cooking commands
  if (
    normClean.includes('remue') || 
    normClean.includes('remuer') || 
    normClean.includes('melange') || 
    normClean.includes('melanger') || 
    normClean.includes('fouetter') || 
    normClean.includes('fouette') || 
    normClean.includes('stir the pot') || 
    normClean === 'stir'
  ) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('worldpilot_stir_cookware', { detail: { source: 'parser', timestamp: Date.now() } }));
    }
    return { plan: { intent: 'stir_cookware', actions: [{ action: 'stir' }] }, patch: {} };
  }

  // Match Co-Worker Agent delegation & teaming commands
  if (
    normClean.includes('camille') ||
    normClean.includes('coequipier') ||
    normClean.includes('co-equipier') ||
    normClean.includes('delegue') ||
    normClean.includes('deleguer') ||
    normClean.includes('aide moi a') ||
    normClean.includes('alex organise')
  ) {
    let task = 'chop_vegetables';
    if (normClean.includes('feu') || normClean.includes('cuisson') || normClean.includes('surveille') || normClean.includes('chaleur')) {
      task = 'monitor_heat';
    } else if (normClean.includes('sel') || normClean.includes('assaisonne') || normClean.includes('herbe') || normClean.includes('huile')) {
      task = 'season_dish';
    } else if (normClean.includes('dresse') || normClean.includes('garniture') || normClean.includes('assiette')) {
      task = 'plate_garniture';
    } else if (normClean.includes('post it') || normClean.includes('tableau') || normClean.includes('organise') || normClean.includes('idee')) {
      task = 'organize_notes';
    } else {
      task = 'chop_vegetables';
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('worldpilot_delegate_coworker_task', { detail: { task } }));
    }
    return { plan: { intent: 'delegate_coworker_task', actions: [{ action: 'delegate_task', task }] }, patch: {} };
  }

  // Match chopping / cutting ingredients commands
  if (
    normClean.includes('emince') || 
    normClean.includes('emincer') || 
    normClean.includes('decoupe') || 
    normClean.includes('decouper') || 
    normClean.includes('coupe') || 
    normClean.includes('couper') || 
    normClean.includes('hache') || 
    normClean.includes('hacher') || 
    normClean.includes('taille') || 
    normClean.includes('tailler') || 
    normClean.includes('chop the veggies') || 
    normClean.includes('chop the vegetables') || 
    normClean === 'chop' || 
    normClean === 'cut'
  ) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('worldpilot_chop_action', { detail: { source: 'parser', timestamp: Date.now() } }));
    }
    return { plan: { intent: 'chop_ingredients', actions: [{ action: 'chop' }] }, patch: {} };
  }

  // Match 3D tasting animation commands (fork / spoon)
  if (
    normClean.includes('savoure en 3d') ||
    normClean.includes('savoure a la fourchette') ||
    normClean.includes('goute a la fourchette') ||
    normClean.includes('deguste a la fourchette') ||
    normClean.includes('fourchette')
  ) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('worldpilot_tasting_start', { detail: { utensil: 'fork' } }));
    }
    return { plan: { intent: 'tasting_start', actions: [{ action: 'taste', utensil: 'fork' }] }, patch: {} };
  }

  if (
    normClean.includes('savoure a la cuillere') ||
    normClean.includes('goute a la cuillere') ||
    normClean.includes('deguste a la cuillere') ||
    normClean.includes('cuillere')
  ) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('worldpilot_tasting_start', { detail: { utensil: 'spoon' } }));
    }
    return { plan: { intent: 'tasting_start', actions: [{ action: 'taste', utensil: 'spoon' }] }, patch: {} };
  }

  // Match dish saucing / nappage commands
  if (
    normClean.includes('nappe le plat') ||
    normClean.includes('sauce le plat') ||
    normClean.includes('nappe l assiette') ||
    normClean.includes('ajoute le nappage') ||
    normClean.includes('verse la sauce') ||
    normClean.includes('nappage')
  ) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('worldpilot_dish_sauced', { detail: { source: 'parser' } }));
    }
    return { plan: { intent: 'dish_sauced', actions: [{ action: 'toggle_sauce' }] }, patch: {} };
  }

  // Match plating style commands
  if (
    normClean.includes('style de dressage') || 
    normClean.includes('style dressage') || 
    normClean.includes('change le style') || 
    normClean.includes('dome classique') || 
    normClean.includes('arc moderne') || 
    normClean.includes('tian')
  ) {
    let targetStyle: 'classic-dome' | 'deconstructed-arc' | 'geometric-tian' | undefined = undefined;
    if (normClean.includes('dome')) targetStyle = 'classic-dome';
    else if (normClean.includes('arc')) targetStyle = 'deconstructed-arc';
    else if (normClean.includes('tian')) targetStyle = 'geometric-tian';

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('worldpilot_set_plating_style', { detail: { style: targetStyle } }));
    }
    return { plan: { intent: 'set_plating_style', actions: [{ action: 'set_style', style: targetStyle }] }, patch: {} };
  }

  // Match plating garnish commands
  if (
    !normClean.includes('pincee') && 
    (
      normClean.includes('garniture de finition') || 
      normClean.includes('finition du plat') || 
      normClean.includes('en finition') || 
      normClean.includes('tuile dentelle') || 
      normClean.includes('fleur de sel croustillante') || 
      normClean.includes('finition fleur de sel') || 
      normClean.includes('micro pousses') || 
      normClean.includes('pousses pourpres') || 
      normClean.includes('lamelles de truffe') || 
      normClean.includes('truffe')
    )
  ) {
    let targetGarnish: 'tuile-dentelle' | 'fleur-de-sel' | 'micro-greens' | 'truffle-specks' | undefined = undefined;
    if (normClean.includes('tuile')) targetGarnish = 'tuile-dentelle';
    else if (normClean.includes('fleur de sel') || normClean.includes('sel')) targetGarnish = 'fleur-de-sel';
    else if (normClean.includes('pousse')) targetGarnish = 'micro-greens';
    else if (normClean.includes('truffe')) targetGarnish = 'truffle-specks';

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('worldpilot_set_plating_garnish', { detail: { garnish: targetGarnish } }));
    }
    return { plan: { intent: 'set_plating_garnish', actions: [{ action: 'set_garnish', garnish: targetGarnish }] }, patch: {} };
  }

  // Match plating / dressage commands
  if (
    normClean.includes('dresse') || 
    normClean.includes('dresser') || 
    normClean.includes('dressage') || 
    normClean.includes('plate the dish') || 
    normClean.includes('plate dish') || 
    normClean.includes('sers le plat') || 
    normClean.includes('servir le plat')
  ) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('worldpilot_plate_dish', { detail: { source: 'parser', timestamp: Date.now() } }));
    }
    return { plan: { intent: 'plate_dish', actions: [{ action: 'plate' }] }, patch: {} };
  }

  // Match Chef Auguste Escoffier advice commands
  if (
    normClean.includes('conseil du chef') ||
    normClean.includes('aide du chef') ||
    normClean.includes('aide culinaire') ||
    normClean.includes('avis du chef') ||
    normClean.includes('chef quelle est la prochaine etape') ||
    normClean.includes('prochaine etape chef') ||
    normClean.includes('que dois je faire chef')
  ) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('worldpilot_chef_ask_advice', { detail: { source: 'parser' } }));
    }
    return { plan: { intent: 'ask_chef_advice', actions: [{ action: 'get_chef_advice' }] }, patch: {} };
  }

  // Match Table population / replenishment commands
  // (ex: "il manque des objets sur la table", "ajoute des objets sur la table", "remplis la table", "garnis la table")
  const isPopulateTableQuery = (
    normClean.includes('manque des objets') || 
    normClean.includes('manquent des objets') ||
    normClean.includes('objet manquant') ||
    normClean.includes('objets manquants') ||
    normClean.includes('garnir la table') ||
    normClean.includes('garnis la table') ||
    normClean.includes('remplir la table') ||
    normClean.includes('remplis la table') ||
    normClean.includes('mettre des objets sur la table') ||
    normClean.includes('mets des objets sur la table') ||
    normClean.includes('ajoute des objets sur la table') ||
    normClean.includes('ajouter des objets sur la table') ||
    (normClean.includes('table') && (normClean.includes('manque') || normClean.includes('vide') || normClean.includes('garnir') || normClean.includes('garnis') || normClean.includes('remplir') || normClean.includes('remplis') || normClean.includes('completer') || normClean.includes('complete')))
  );

  if (isPopulateTableQuery) {
    const entList = Object.values(entities);
    let table = entList.find(e => {
      const n = normalize(e.name || '').toLowerCase();
      const id = e.id.toLowerCase();
      const assetId = (e.visuals?.assetId || '').toLowerCase();
      return n.includes('table') || n.includes('ilot') || n.includes('comptoir') || n.includes('etabli') || n.includes('bureau') ||
             id.includes('table') || id.includes('ilot') || id.includes('comptoir') || id.includes('etabli') || id.includes('bureau') ||
             assetId.includes('table') || assetId.includes('ilot') || assetId.includes('comptoir') || assetId.includes('etabli') || assetId.includes('bureau') ||
             isFloorFurniture(e);
    });

    const entitiesCreated: EntitySpec[] = [];
    if (!table) {
      table = {
        id: 'wp_ilot_central',
        name: 'Îlot de cuisine en chêne & marbre',
        capabilities: [
          { type: 'transform', position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          { type: 'collider' }
        ],
        visuals: { assetId: 'wp-ilot-de-cuisine', modelUrl: '/library/wp-ilot-de-cuisine.glb' }
      };
      entitiesCreated.push(table);
    }

    const tPos = toVec3Obj(table.capabilities.find(c => c.type === 'transform')?.position, { x: 0, y: 0, z: 0 });
    const tableTopY = Number((tPos.y + 0.922).toFixed(3));

    const isNature = entList.some(e => (e.name || '').toLowerCase().includes('champignon') || (e.name || '').toLowerCase().includes('foret') || (e.visuals?.assetId || '').includes('cepe'));
    const isOffice = entList.some(e => (e.name || '').toLowerCase().includes('reunion') || (e.name || '').toLowerCase().includes('seminaire') || (e.name || '').toLowerCase().includes('bureau') || (e.visuals?.assetId || '').includes('laptop'));
    const isWorkshop = entList.some(e => (e.name || '').toLowerCase().includes('mecanique') || (e.name || '').toLowerCase().includes('garage') || (e.name || '').toLowerCase().includes('voiture') || (e.visuals?.assetId || '').includes('batterie'));

    interface CandidateItem {
      assetId: string;
      name: string;
      pos: [number, number, number];
      rot?: [number, number, number];
    }

    let candidates: CandidateItem[] = [];

    if (isNature) {
      candidates = [
        { assetId: 'wp-panier-cueillette', name: 'Panier de cueillette en osier', pos: [tPos.x - 0.35, tableTopY, tPos.z] },
        { assetId: 'wp-guide-mycologie', name: 'Guide mycologique & Loupe de terrain', pos: [tPos.x + 0.32, tableTopY, tPos.z] },
        { assetId: 'wp-cepe-de-bordeaux', name: 'Cèpe de Bordeaux (Boletus edulis)', pos: [tPos.x, tableTopY, tPos.z + 0.15] }
      ];
    } else if (isOffice) {
      candidates = [
        { assetId: 'laptop', name: 'Ordinateur portable Pro', pos: [tPos.x, tableTopY, tPos.z] },
        { assetId: 'book', name: 'Carnet de notes & Stylo', pos: [tPos.x + 0.35, tableTopY, tPos.z + 0.1] }
      ];
    } else if (isWorkshop) {
      candidates = [
        { assetId: 'wp-batterie-automobile', name: 'Batterie automobile 12V 70Ah', pos: [tPos.x, tableTopY, tPos.z] },
        { assetId: 'wp-couteau-chef', name: 'Outil de coupe d’atelier', pos: [tPos.x - 0.35, tableTopY, tPos.z] }
      ];
    } else {
      // Cuisine / Bistrot gastronomique par défaut
      candidates = [
        { assetId: 'wp-planche-a-decouper', name: 'Planche à découper en hêtre massif', pos: [tPos.x - 0.38, tableTopY, tPos.z + 0.06] },
        { assetId: 'wp-couteau-chef', name: 'Couteau de chef japonais forgé', pos: [tPos.x - 0.38, tableTopY, tPos.z + 0.26], rot: [0, Math.PI / 2, 0] },
        { assetId: 'wp-cocotte-en-fonte', name: 'Cocotte en fonte émaillée Le Creuset', pos: [tPos.x + 0.38, tableTopY, tPos.z - 0.04] },
        { assetId: 'wp-cuillere-bois', name: 'Cuillère en bois tourné de hêtre', pos: [tPos.x + 0.38, tableTopY, tPos.z + 0.14], rot: [0, 0.4, 0] },
        { assetId: 'wp-assiette-gastronomique', name: 'Assiette gastronomique en porcelaine', pos: [tPos.x, tableTopY, tPos.z + 0.22] },
        { assetId: 'wp-saliere-guerande', name: 'Fleur de sel de Guérande', pos: [tPos.x + 0.44, tableTopY, tPos.z + 0.26] },
        { assetId: 'wp-bouteille-huile', name: 'Bouteille d’huile d’olive de Provence', pos: [tPos.x + 0.30, tableTopY, tPos.z + 0.28] },
        { assetId: 'wp-tomate', name: 'Tomate mûre de Provence', pos: [tPos.x - 0.16, tableTopY, tPos.z + 0.10] },
        { assetId: 'wp-courgette', name: 'Courgette maraîchère fraîche', pos: [tPos.x - 0.24, tableTopY, tPos.z + 0.02], rot: [0, 0.8, 0] },
        { assetId: 'wp-oignon', name: 'Oignon doux de Tournon', pos: [tPos.x - 0.12, tableTopY, tPos.z - 0.05] }
      ];
    }

    candidates.forEach((cand, idx) => {
      const exists = entList.some(e => {
        const ea = (e.visuals?.assetId || '').toLowerCase();
        const en = (e.name || '').toLowerCase();
        const mainKeyword = cand.name.toLowerCase().split(' ')[0];
        return ea === cand.assetId || (cand.assetId.includes('wp-') && (en.includes(mainKeyword) || ea.includes(mainKeyword)));
      });

      if (!exists) {
        entitiesCreated.push({
          id: `wp_${cand.assetId.replace(/-/g, '_')}_p${idx + 1}`,
          name: cand.name,
          capabilities: [
            {
              type: 'transform',
              position: { x: cand.pos[0], y: cand.pos[1], z: cand.pos[2] },
              rotation: cand.rot ? { x: cand.rot[0], y: cand.rot[1], z: cand.rot[2] } : { x: 0, y: 0, z: 0 },
              scale: { x: 1, y: 1, z: 1 }
            },
            { type: 'draggable' },
            { type: 'collider' },
            { type: 'educational', text: cand.name, value: 0, active: false }
          ],
          visuals: {
            assetId: cand.assetId,
            modelUrl: `/library/${cand.assetId}.glb`
          }
        });
      }
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('worldpilot_table_populated', { detail: { count: entitiesCreated.length } }));
    }

    return {
      plan: {
        intent: 'populate_table',
        actions: [{
          action: 'populate_table',
          count: entitiesCreated.length,
          toastMessage: `✨ La table a été garnie avec ${entitiesCreated.length} objet(s) et ustensile(s) manquant(s).`
        }]
      },
      patch: {
        entitiesCreated
      }
    };
  }

  // Match Flashcards revision modal commands
  if (
    normClean.includes('mode revision') ||
    normClean.includes('ouvre les flashcards') ||
    normClean.includes('ouvre les cartes') ||
    normClean.includes('etudie le vocabulaire') ||
    normClean.includes('cartes de vocabulaire') ||
    normClean.includes('flashcard') ||
    normClean.includes('flashcards')
  ) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('worldpilot_open_flashcard_study', { detail: { source: 'parser' } }));
    }
    return { plan: { intent: 'open_flashcard_study', actions: [{ action: 'open_flashcards' }] }, patch: {} };
  }

  // Match Achievements / Hall of Fame modal commands
  if (
    normClean.includes('mes trophees') ||
    normClean.includes('hall of fame') ||
    normClean.includes('ouvre les succes') ||
    normClean.includes('mes succes') ||
    normClean.includes('tableau des trophees') ||
    normClean.includes('trophees')
  ) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('worldpilot_open_achievements_modal', { detail: { source: 'parser' } }));
    }
    return { plan: { intent: 'open_achievements_modal', actions: [{ action: 'open_achievements' }] }, patch: {} };
  }

  // Match Seminar Collaboration Board & Sticky Notes commands
  if (
    !normClean.includes('ideation') &&
    !normClean.includes('design sprint') &&
    !normClean.includes('atelier de design') &&
    !normClean.includes('tableau blanc mobile') &&
    (
      normClean.includes('tableau blanc') ||
      normClean.includes('tableau collaboratif') ||
      normClean.includes('notes adhesives') ||
      normClean.includes('post it') ||
      normClean.includes('collaboration board') ||
      normClean.includes('brainstorming') ||
      normClean.includes('tableau d idees') ||
      normClean.includes('ajoute un post it') ||
      normClean.includes('ajouter un post it')
    )
  ) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('worldpilot_open_collaboration_board', { detail: { source: 'parser' } }));
    }
    return { plan: { intent: 'open_collaboration_board', actions: [{ action: 'open_board' }] }, patch: {} };
  }

  // Match Behavioral Analytics & Cognitive Trace commands
  if (
    normClean.includes('analyse comportementale') ||
    normClean.includes('boite noire') ||
    normClean.includes('profil cognitif') ||
    normClean.includes('trajectoire cognitive') ||
    normClean.includes('metriques session') ||
    normClean.includes('charge cognitive') ||
    normClean.includes('empreinte cognitive') ||
    normClean.includes('behavioral analytics') ||
    normClean.includes('cognitive trace')
  ) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('worldpilot_open_behavioral_analytics', { detail: { source: 'parser' } }));
    }
    return { plan: { intent: 'open_behavioral_analytics', actions: [{ action: 'open_analytics' }] }, patch: {} };
  }

  // Match synthetic agent cohort simulation commands
  if (
    normClean.includes('simulation de cohorte') ||
    normClean.includes('simule 100 agents') ||
    normClean.includes('simuler 100 agents') ||
    normClean.includes('agents synthetiques') ||
    normClean.includes('cohorte ia') ||
    normClean.includes('monte carlo') ||
    normClean.includes('cohort simulation')
  ) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('worldpilot_run_cohort_simulation', { detail: { cohortSize: 100 } }));
    }
    return { plan: { intent: 'run_cohort_simulation', actions: [{ action: 'run_cohort', cohortSize: 100 }] }, patch: {} };
  }

  // Match Ghost Trajectory Agent commands
  if (
    normClean.includes('fantome ia') ||
    normClean.includes('guide fantome') ||
    normClean.includes('trajectoire fantome') ||
    normClean.includes('mode fantome') ||
    normClean.includes('affiche le fantome') ||
    normClean.includes('active le fantome') ||
    normClean.includes('masque le fantome') ||
    normClean.includes('trajectoire recommandee')
  ) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('worldpilot_toggle_ghost_agent', { detail: { source: 'parser' } }));
    }
    return { plan: { intent: 'toggle_ghost_agent', actions: [{ action: 'toggle_ghost' }] }, patch: {} };
  }

  // Match Counterfactual Branching commands
  if (
    normClean.includes('branche contrefactuelle') ||
    normClean.includes('bifurcation contrefactuelle') ||
    normClean.includes('rejoue a partir d ici') ||
    normClean.includes('bifurquer') ||
    normClean.includes('multivers') ||
    normClean.includes('arbre decisionnel')
  ) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('worldpilot_create_counterfactual', { detail: { source: 'parser' } }));
    }
    return { plan: { intent: 'create_counterfactual_branch', actions: [{ action: 'create_branch' }] }, patch: {} };
  }

  // Match Autonomous AI Policy Rollout commands
  if (
    normClean.includes('rollout ia') ||
    normClean.includes('laisse l ia terminer') ||
    normClean.includes('complete avec un agent ia') ||
    normClean.includes('complete avec l ia') ||
    normClean.includes('simulation autonome ia')
  ) {
    let persona = 'methodical-analyst';
    if (normClean.includes('explorateur')) persona = 'intuitive-explorer';
    else if (normClean.includes('impulsif')) persona = 'impulsive-rushed';
    else if (normClean.includes('prudent')) persona = 'hesitant-learner';

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('worldpilot_run_ai_rollout', { detail: { persona } }));
    }
    return { plan: { intent: 'run_ai_rollout', actions: [{ action: 'rollout', persona }] }, patch: {} };
  }

  // Match anomaly injection & stress-test commands
  if (
    normClean.includes('coup de feu') ||
    normClean.includes('exces de sel') ||
    normClean.includes('assaisonnement desequilibre') ||
    normClean.includes('anomalie') ||
    normClean.includes('stress test') ||
    normClean.includes('visite de l inspecteur') ||
    normClean.includes('crise de temps') ||
    normClean.includes('panne ecran') ||
    normClean.includes('probleme audiovisuel') ||
    normClean.includes('interference micro') ||
    normClean.includes('legume avarie') ||
    normClean.includes('recoupe requise')
  ) {
    let anomalyType = 'thermal_flare';
    if (normClean.includes('sel') || normClean.includes('assaisonnement')) anomalyType = 'seasoning_imbalance';
    else if (normClean.includes('inspecteur') || normClean.includes('temps') || normClean.includes('sprint')) anomalyType = 'time_crunch';
    else if (normClean.includes('panne') || normClean.includes('ecran') || normClean.includes('micro') || normClean.includes('audiovisuel')) anomalyType = 'seminar_av_glitch';
    else if (normClean.includes('avarie') || normClean.includes('recoupe') || normClean.includes('legume')) anomalyType = 'ingredient_spoilage';

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('worldpilot_inject_anomaly', { detail: { type: anomalyType } }));
    }
    return { plan: { intent: 'inject_simulation_anomaly', actions: [{ action: 'inject_anomaly', anomalyType }] }, patch: {} };
  }

  // Match LeRobot Embodied VLA dataset export
  if (
    normClean.includes('dataset lerobot') ||
    normClean.includes('exporte lerobot') ||
    normClean.includes('export lerobot') ||
    normClean.includes('donnees robotiques') ||
    normClean.includes('open x embodiment') ||
    normClean.includes('export vla')
  ) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('worldpilot_export_lerobot_dataset', {}));
    }
    return { plan: { intent: 'export_lerobot_dataset', actions: [{ action: 'export_lerobot' }] }, patch: {} };
  }

  // Match GLB 3D Export
  if (
    normClean.includes('exporte en glb') ||
    normClean.includes('exporter en glb') ||
    normClean.includes('export glb') ||
    normClean.includes('telecharge en glb') ||
    normClean.includes('telecharger en glb') ||
    normClean.includes('telecharger le glb') ||
    normClean.includes('telecharge le glb') ||
    normClean.includes('exporte le glb') ||
    normClean.includes('exporte la scene en glb') ||
    normClean.includes('exporte le fichier glb')
  ) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('worldpilot_export_glb', {}));
    }
    return { plan: { intent: 'export_glb_scene', actions: [{ action: 'export_glb' }] }, patch: {} };
  }

  // Match USDZ Augmented Reality Export
  if (
    normClean.includes('exporte en usdz') ||
    normClean.includes('exporter en usdz') ||
    normClean.includes('export usdz') ||
    normClean.includes('exporte pour vision pro') ||
    normClean.includes('apple vision pro') ||
    normClean.includes('realite augmentee') ||
    normClean.includes('quick look')
  ) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('worldpilot_export_usdz', {}));
    }
    return { plan: { intent: 'export_usdz_scene', actions: [{ action: 'export_usdz' }] }, patch: {} };
  }

  // Match HD Screenshot
  if (
    normClean.includes('prends une photo') ||
    normClean.includes('capture d ecran') ||
    normClean.includes('capture d\'ecran') ||
    normClean.includes('capture hd') ||
    normClean.includes('screenshot') ||
    normClean.includes('photo hd')
  ) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('worldpilot_capture_screenshot', {}));
    }
    return { plan: { intent: 'capture_hd_screenshot', actions: [{ action: 'capture_screenshot' }] }, patch: {} };
  }

  // Match Local Save Command
  if (
    normClean === 'sauvegarde' ||
    normClean === 'sauvegarder' ||
    normClean === 'enregistre' ||
    normClean === 'enregistrer' ||
    normClean === 'save' ||
    normClean.includes('sauvegarde le monde') ||
    normClean.includes('sauvegarder le monde') ||
    normClean.includes('sauvegarder la scene') ||
    normClean.includes('sauvegarde la scene') ||
    normClean.includes('sauvegarder mes changements') ||
    normClean.includes('sauvegarde mes changements') ||
    normClean.includes('sauvegarder les changements') ||
    normClean.includes('sauvegarde les changements') ||
    normClean.includes('sauvegarder les modifications') ||
    normClean.includes('sauvegarde les modifications') ||
    normClean.includes('sauvegarde mes modifications') ||
    normClean.includes('sauvegarder mes modifications') ||
    normClean.includes('enregistre le monde') ||
    normClean.includes('enregistrer le monde') ||
    normClean.includes('enregistre les changements') ||
    normClean.includes('enregistrer les changements') ||
    normClean.includes('enregistrer mes changements') ||
    normClean.includes('enregistre les modifications') ||
    normClean.includes('enregistrer les modifications') ||
    normClean.includes('enregistre mes modifications') ||
    normClean.includes('enregistrer mes modifications') ||
    normClean.includes('save world')
  ) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('worldpilot_save_world', {}));
    }
    return { plan: { intent: 'save_world_storage', actions: [{ action: 'save_world' }] }, patch: {} };
  }

  // Match Cognitive Digital Twin (Clone) & IRL commands
  if (
    normClean.includes('jumeau numerique') ||
    normClean.includes('distille mon clone') ||
    normClean.includes('distiller mon clone') ||
    normClean.includes('clone cognitif') ||
    normClean.includes('distillation comportementale') ||
    normClean.includes('jumeau ia') ||
    normClean.includes('inverse rl')
  ) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('worldpilot_synthesize_clone', { detail: { operatorName: 'Opérateur WorldPilot' } }));
    }
    return { plan: { intent: 'synthesize_cognitive_clone', actions: [{ action: 'synthesize_clone' }] }, patch: {} };
  }

  // Match Spatial Attention & 3D Gaze Heatmap commands
  if (
    normClean.includes('heatmap') ||
    normClean.includes('attention spatiale') ||
    normClean.includes('scanpath') ||
    normClean.includes('fixations visuelles') ||
    normClean.includes('points d attention') ||
    normClean.includes('trajectoire de regard')
  ) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('worldpilot_toggle_attention_heatmap', {}));
    }
    return { plan: { intent: 'toggle_attention_heatmap', actions: [{ action: 'toggle_heatmap' }] }, patch: {} };
  }

  // Open the local WorldPilot readiness report. This does not certify a scene or platform integration.
  if (
    normClean.includes('publish readiness') ||
    normClean.includes('publish gate') ||
    normClean.includes('check local readiness') ||
    normClean.includes('run local readiness') ||
    normClean.includes('local scene readiness') ||
    normClean.includes('verifier la preparation locale') ||
    normClean.includes('controle local de la scene') ||
    normClean.includes('pret a publier') ||
    normClean.includes('prêt à publier') ||
    normClean.includes('audit de publication') ||
    normClean.includes('conformite de publication') ||
    (normClean.includes('conformite') && (normClean.includes('publication') || normClean.includes('parcelle') || normClean.includes('victoria'))) ||
    normClean.includes('bornes parcellaires')
  ) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('worldpilot_open_publish_gate', { detail: { source: 'parser' } }));
    }
    return { plan: { intent: 'open_publish_readiness_gate', actions: [{ action: 'open_publish_gate' }] }, patch: {} };
  }

  // Match Synthetic AI Playtester commands (sauf si création de niveau/studio gamedev)
  if (
    !normClean.includes('creer') &&
    !normClean.includes('créer') &&
    !normClean.includes('studio') &&
    !normClean.includes('gamedev') &&
    !normClean.includes('game design') &&
    !normClean.includes('level design') &&
    (
      normClean.includes('playtest') ||
      normClean.includes('lance le playtest') ||
      normClean.includes('lancer le playtest') ||
      normClean.includes('playtester ia') ||
      normClean.includes('synthetic playtest') ||
      normClean.includes('synthetic playtester') ||
      normClean.includes('teste mon monde') ||
      normClean.includes('teste le monde') ||
      normClean.includes('robot playtester') ||
      normClean.includes('agent playtest') ||
      normClean.includes('repare le monde') ||
      normClean.includes('minimal patch')
    )
  ) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('worldpilot_run_playtest', { detail: { source: 'parser' } }));
    }
    return { plan: { intent: 'run_synthetic_playtester', actions: [{ action: 'run_playtest' }] }, patch: {} };
  }

  // Match Research Console & Scientific Telemetry commands
  if (
    normClean.includes('console de recherche') ||
    normClean.includes('dashboard recherche') ||
    normClean.includes('research dashboard') ||
    normClean.includes('recherche scientifique') ||
    normClean.includes('graphe fantome') ||
    normClean.includes('affordance emergente') ||
    normClean.includes('telemetrie spatiale') ||
    normClean.includes('tenseurs mdp')
  ) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('worldpilot_open_research_dashboard', { detail: { source: 'parser' } }));
    }
    return { plan: { intent: 'open_research_dashboard', actions: [{ action: 'open_research' }] }, patch: {} };
  }

  // Match Edit-Order Sensitivity Lab (W_AB ≈_Ω W_BA)
  if (
    normClean.includes('test ab ba') ||
    normClean.includes('test ab/ba') ||
    normClean.includes('labo ab ba') ||
    normClean.includes('labo ab/ba') ||
    normClean.includes('labo ordre') ||
    normClean.includes('sensibilite a l ordre') ||
    normClean.includes('edit order lab') ||
    normClean.includes('permutation ab ba')
  ) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('worldpilot_open_edit_order_lab', { detail: { source: 'parser' } }));
    }
    return { plan: { intent: 'open_edit_order_lab', actions: [{ action: 'open_edit_order_lab' }] }, patch: {} };
  }

  // Match Semantic Blast Radius & Regression Check
  if (
    normClean.includes('blast radius') ||
    normClean.includes('rayon d impact') ||
    normClean.includes('verifie les regressions') ||
    normClean.includes('non regression') ||
    normClean.includes('audit invariant')
  ) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('worldpilot_audit_blast_radius', { detail: { source: 'parser' } }));
    }
    return { plan: { intent: 'audit_blast_radius', actions: [{ action: 'audit_sbr' }] }, patch: {} };
  }

  // Match Pedagogical Simulation Generation (Bloom 3D)
  if (
    normClean.includes('loi d ohm') ||
    normClean.includes('electricite') ||
    normClean.includes('optique') ||
    normClean.includes('snell') ||
    normClean.includes('thermodynamique') ||
    normClean.includes('calorimetrie') ||
    normClean.includes('banc d optique') ||
    normClean.includes('simulation pedagogique') ||
    (normClean.includes('laboratoire') && (normClean.includes('thermo') || normClean.includes('optique') || normClean.includes('ohm') || normClean.includes('electricite')))
  ) {
    let presetKey = 'electricity_ohm';
    if (normClean.includes('optique') || normClean.includes('snell') || normClean.includes('lumiere')) {
      presetKey = 'optics_snell';
    } else if (normClean.includes('thermo') || normClean.includes('calorimetr') || normClean.includes('chaleur')) {
      presetKey = 'thermo_calorimetry';
    }

    const sim = compilePedagogicalSimulation(presetKey);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('worldpilot_compile_pedagogy', { detail: { presetKey } }));
    }
    return {
      plan: { intent: 'compile_pedagogical_simulation', actions: [{ action: 'compile_pedagogy', presetKey }] },
      patch: sim.worldPatch
    };
  }

  // Match Procedural Challenge & Random Fault Diagnostics (Roguelike Pédagogique & Graines / Seeds)
  if (
    normClean.includes('defi de depannage') ||
    normClean.includes('defi diagnostic') ||
    normClean.includes('panne aleatoire') ||
    normClean.includes('panne procedurale') ||
    normClean.includes('diagnostic aleatoire') ||
    normClean.includes('mode roguelike') ||
    normClean.includes('roguelike pedagogique') ||
    normClean.includes('panne electrique aleatoire') ||
    normClean.includes('panne mecanique aleatoire') ||
    normClean.includes('panne thermique aleatoire') ||
    normClean.includes('tolerances reelles') ||
    normClean.includes('budget de mesures') ||
    normClean.includes('agencement aleatoire') ||
    (/\b(?:graine|seed)\s*#?\d+\b/.test(normClean))
  ) {
    let domain: ChallengeDomain = 'PHYSICS_ELECTRICITY';
    if (normClean.includes('mecanique') || normClean.includes('assemblage') || normClean.includes('vis') || normClean.includes('meuble')) {
      domain = 'MECHANICS_ASSEMBLY';
    } else if (normClean.includes('thermique') || normClean.includes('chaleur') || normClean.includes('calorimetre') || normClean.includes('fuite')) {
      domain = 'THERMODYNAMICS';
    } else if (normClean.includes('chimie') || normClean.includes('cuisine') || normClean.includes('sel') || normClean.includes('recette')) {
      domain = 'CHEMISTRY_GASTRONOMY';
    }

    // Extract seed if present
    const seedMatch = normClean.match(/\b(?:graine|seed)\s*#?(\d+)\b/);
    const seed = seedMatch ? parseInt(seedMatch[1], 10) : undefined;

    const difficulty = normClean.includes('expert') ? 'expert' : normClean.includes('difficile') || normClean.includes('hard') ? 'hard' : 'normal';
    const randomizeLayout = normClean.includes('agencement aleatoire') || normClean.includes('disposition aleatoire');

    const challenge = compileProceduralChallenge({
      domain,
      seed,
      difficulty,
      randomizeLayout
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('worldpilot_procedural_challenge', { detail: challenge.session }));
    }

    return {
      plan: { 
        intent: 'start_procedural_challenge', 
        actions: [{ action: 'init_procedural_challenge', seed: challenge.session.seed, domain: challenge.session.domain }] 
      },
      patch: challenge.worldPatch
    };
  }

  // Match tasting card / sommelier wine pairing commands
  if (
    normClean.includes('degustation') || 
    normClean.includes('carte de degustation') || 
    normClean.includes('fiche de degustation') || 
    normClean.includes('accord mets vins') || 
    normClean.includes('accords mets vins') || 
    normClean.includes('sommelier') || 
    normClean.includes('gouter') || 
    normClean.includes('goute') || 
    normClean.includes('note mon plat') || 
    normClean.includes('evalue mon plat') || 
    normClean.includes('score du chef') || 
    normClean.includes('combien d etoiles') || 
    normClean.includes('analyse gastronomique') || 
    normClean.includes('taste the dish')
  ) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('worldpilot_open_degustation', { detail: { source: 'parser', timestamp: Date.now() } }));
    }
    return { plan: { intent: 'open_degustation', actions: [{ action: 'open_degustation' }] }, patch: {} };
  }

  if (
    normClean.includes('recommence la recette') || 
    normClean.includes('recommencer la recette') || 
    normClean.includes('refais la recette') || 
    normClean.includes('refaire la recette') || 
    normClean.includes('restart recipe') || 
    normClean.includes('repart de zero')
  ) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('worldpilot_restart_recipe', { detail: { source: 'parser', timestamp: Date.now() } }));
    }
    return { plan: { intent: 'restart_recipe', actions: [{ action: 'restart_recipe' }] }, patch: {} };
  }

  // Match burner / stove heat control commands
  if (
    normClean.includes('feu doux') || 
    normClean.includes('baisse le feu') || 
    normClean.includes('baisser le feu') || 
    normClean.includes('low heat') || 
    (normClean.includes('doux') && normClean.includes('feu')) ||
    normClean.includes('mijotage doux')
  ) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('worldpilot_set_heat', { detail: { level: 1 } }));
    }
    return { plan: { intent: 'set_cooking_heat', actions: [{ action: 'set_heat', level: 1 }] }, patch: {} };
  }

  if (
    normClean.includes('feu moyen') || 
    normClean.includes('medium heat') || 
    (normClean.includes('moyen') && normClean.includes('feu')) ||
    normClean.includes('fremissement') ||
    normClean.includes('frémissement')
  ) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('worldpilot_set_heat', { detail: { level: 2 } }));
    }
    return { plan: { intent: 'set_cooking_heat', actions: [{ action: 'set_heat', level: 2 }] }, patch: {} };
  }

  if (
    normClean.includes('feu vif') || 
    normClean.includes('augmente le feu') || 
    normClean.includes('augmenter le feu') || 
    normClean.includes('high heat') || 
    (normClean.includes('vif') && normClean.includes('feu')) || 
    normClean.includes('saisir') ||
    normClean.includes('porter a ebullition') ||
    normClean.includes('faire bouillir')
  ) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('worldpilot_set_heat', { detail: { level: 3 } }));
    }
    return { plan: { intent: 'set_cooking_heat', actions: [{ action: 'set_heat', level: 3 }] }, patch: {} };
  }

  if (
    normClean.includes('eteins le feu') || 
    normClean.includes('eteindre le feu') || 
    normClean.includes('coupe le feu') || 
    normClean.includes('couper le feu') || 
    normClean.includes('turn off heat') || 
    normClean.includes('arrete le feu') ||
    normClean.includes('feu off') ||
    normClean.includes('hors du feu')
  ) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('worldpilot_set_heat', { detail: { level: 0 } }));
    }
    return { plan: { intent: 'set_cooking_heat', actions: [{ action: 'set_heat', level: 0 }] }, patch: {} };
  }

  // Match seasoning commands (fleur de sel, huile d'olive, bouquet garni)
  if (
    normClean.includes('fleur de sel') ||
    normClean.includes('pincee de sel') ||
    normClean.includes('pincée de sel') ||
    normClean.includes('sale la cocotte') ||
    normClean.includes('sale le plat') ||
    normClean.includes('sale la poele') ||
    normClean.includes('sale la poêle') ||
    normClean.includes('assaisonne') ||
    normClean.includes('assaisonner') ||
    normClean.includes('assaisonnement') ||
    /(?:^|\s)sel(?:$|\s)/.test(normClean) ||
    normClean.includes('add salt')
  ) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('worldpilot_seasoning_event', { detail: { type: 'salt', amount: 25 } }));
      window.dispatchEvent(new CustomEvent('worldpilot_pour_seasoning', { detail: { type: 'salt' } }));
    }
    return { plan: { intent: 'season_dish', actions: [{ action: 'add_seasoning', seasoningType: 'salt', amount: 25 }] }, patch: {} };
  }

  if (
    normClean.includes('huile') ||
    normClean.includes('filet d\'huile') ||
    normClean.includes('filet dhuile') ||
    normClean.includes('verse l\'huile') ||
    normClean.includes('verse lhuile') ||
    normClean.includes('ajoute l\'huile') ||
    normClean.includes('ajoute lhuile') ||
    normClean.includes('olive oil')
  ) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('worldpilot_seasoning_event', { detail: { type: 'oil', amount: 25 } }));
      window.dispatchEvent(new CustomEvent('worldpilot_pour_seasoning', { detail: { type: 'oil' } }));
    }
    return { plan: { intent: 'season_dish', actions: [{ action: 'add_seasoning', seasoningType: 'oil', amount: 25 }] }, patch: {} };
  }

  if (
    normClean.includes('bouquet garni') ||
    normClean.includes('herbes de provence') ||
    normClean.includes('ajoute le bouquet') ||
    normClean.includes('infuse le bouquet') ||
    normClean.includes('infuser le bouquet') ||
    normClean.includes('aromates') ||
    normClean.includes('herbes') ||
    normClean.includes('herbs')
  ) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('worldpilot_seasoning_event', { detail: { type: 'herbs', amount: 35 } }));
      window.dispatchEvent(new CustomEvent('worldpilot_pour_seasoning', { detail: { type: 'herbs' } }));
    }
    return { plan: { intent: 'season_dish', actions: [{ action: 'add_seasoning', seasoningType: 'herbs', amount: 35 }] }, patch: {} };
  }

  // Match cooking timer and doneness commands
  if (
    normClean.includes('lance le minuteur') ||
    normClean.includes('lance un minuteur') ||
    normClean.includes('minuteur de cuisson') ||
    normClean.includes('mets un minuteur') ||
    normClean.includes('active le minuteur') ||
    normClean.includes('demarre le minuteur') ||
    normClean.includes('minuteur 3') ||
    normClean.includes('start timer') ||
    (normClean.includes('minuteur') && !normClean.includes('arrete') && !normClean.includes('coupe') && !normClean.includes('pause')) ||
    (normClean.includes('timer') && !normClean.includes('stop') && !normClean.includes('pause'))
  ) {
    let seconds = 180;
    const numMatch = instruction.match(/(\d+)\s*(?:min|minute)/i);
    if (numMatch) seconds = parseInt(numMatch[1], 10) * 60;
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('worldpilot_start_timer', { detail: { seconds } }));
    }
    return { plan: { intent: 'start_cooking_timer', actions: [{ action: 'start_timer', seconds }] }, patch: {} };
  }

  if (
    normClean.includes('arrete le minuteur') ||
    normClean.includes('arreter le minuteur') ||
    normClean.includes('coupe le minuteur') ||
    normClean.includes('pause le minuteur') ||
    normClean.includes('stop timer') ||
    normClean.includes('pause timer')
  ) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('worldpilot_stop_timer', {}));
    }
    return { plan: { intent: 'stop_cooking_timer', actions: [{ action: 'stop_timer' }] }, patch: {} };
  }

  if (
    normClean.includes('reinitialise la cuisson') ||
    normClean.includes('remets la cuisson a zero') ||
    normClean.includes('reset cuisson') ||
    normClean.includes('reset cooking') ||
    normClean.includes('annule la cuisson')
  ) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('worldpilot_reset_cooking', {}));
    }
    return { plan: { intent: 'reset_cooking_doneness', actions: [{ action: 'reset_cooking' }] }, patch: {} };
  }



  // Match any of the 10 demonstration scenarios by prompt, title, slug, number or semantic keywords
  const demoAliases: Record<string, string[]> = {
    'demo-espresso-barista': ['cafe', 'espresso', 'barista', 'percolation', 'machine a cafe'],
    'demo-ratatouille-simmer': ['ratatouille', 'cocotte', 'mijotage', 'cuisine'],
    'demo-pitch-projection': ['pitch', 'videoprojecteur', 'projection', 'ecran pitch'],
    'demo-postal-deposit': ['poste', 'boite aux lettres', 'courrier', 'lettre', 'postal'],
    'demo-chemistry-boil': ['chimie', 'fiole', 'erlenmeyer', 'bruleur', 'ebullition'],
    'demo-design-sprint': ['design sprint', 'sprint', 'tableau blanc', 'post it'],
    'demo-cozy-fireplace': ['cheminee', 'feu', 'feu de bois', 'salon vip'],
    'demo-music-jam': ['musique', 'jam', 'guitare', 'djembe', 'concert'],
    'demo-victoria-vr-mint': ['victoria vr', 'mint', 'nft', 'casque vr', 'socle lave'],
    'demo-seminar-checkin': ['badge', 'checkin', 'borne', 'rfid', 'accueil seminaire'],
    'demo-mindel-bag-capacity': ['sac', 'sac voyageur', 'sac a dos', 'laptop sac', 'capacite sac', 'mindel', 'sac 42l']
  };

  for (const demo of demonstrationScenarios) {
    const promptNorm = normalize(demo.prompt);
    const titleNorm = normalize(demo.title);
    const key = demo.id.replace('demo-', '');
    const aliases = demoAliases[demo.id] || [];
    const matchesAlias = aliases.some(a => normClean.includes(`demo ${a}`) || normClean.includes(`demonstration ${a}`) || normClean === `demo ${a}`) ||
      (demo.id === 'demo-mindel-bag-capacity' && (
        normClean.includes('sac de voyage') ||
        normClean.includes('travel bag') ||
        (normClean.includes('bag') && (normClean.includes('capacity') || normClean.includes('42l') || normClean.includes('travel') || normClean.includes('compartment'))) ||
        (normClean.includes('sac') && (normClean.includes('capacite') || normClean.includes('capacité') || normClean.includes('42l') || normClean.includes('voyage') || normClean.includes('compartiment'))) ||
        normClean.includes('mindel')
      ));
    if (
      normClean.includes(promptNorm) ||
      normClean.includes(titleNorm) ||
      normClean.includes(`demo ${key}`) ||
      normClean.includes(`demonstration ${key}`) ||
      normClean.includes(`demo ${demo.number}`) ||
      normClean.includes(`demonstration ${demo.number}`) ||
      matchesAlias
    ) {
      const patch = createDemonstrationPatch(demo, entities);
      if (demo.atmosphere && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('worldpilot_set_atmosphere', { detail: { atmosphere: demo.atmosphere } }));
      }
      return {
        plan: { intent: 'load_demonstration', actions: [{ action: 'create_demo_scenario', target: demo.id }] },
        patch
      };
    }
  }
  if (/^(cree|creer|lance|lancer|charge|charger|ouvre|ouvrir|affiche|afficher)\s+(?:une\s+)?(?:demo|demonstration|scene interactive)$/.test(normClean)) {
    const patch = createDemonstrationPatch(demonstrationScenarios[0], entities);
    return {
      plan: { intent: 'load_demonstration', actions: [{ action: 'create_demo_scenario', target: demonstrationScenarios[0].id }] },
      patch
    };
  }

  const norm = instruction.toLowerCase().trim();

  // Instant Reset / Clear All
  if (
    norm === 'reset' || 
    norm === 'clear' || 
    norm === 'vider' || 
    norm === 'vide' || 
    norm === 'effacer' || 
    norm.includes('efface tout') || 
    norm.includes('supprime tout') || 
    norm.includes('vide la scène') || 
    norm.includes('vide la scene') || 
    norm.includes('vider la scène') || 
    norm.includes('vider la scene') || 
    norm.includes('clear scene') || 
    norm.includes('repartir de zéro') || 
    norm.includes('repartir de zero') || 
    norm.includes('repartir à zéro') || 
    norm.includes('recommencer de zéro') || 
    norm.includes('recommencer de zero') || 
    norm.includes('recommencer à zéro') || 
    norm.includes('recommencer a zero') || 
    norm.includes('recommencer l\'expérience de zéro') || 
    norm.includes('reset world')
  ) {
    return {
      plan: { intent: 'reset_world', actions: [{ action: 'clear_all' }] },
      patch: {
        entitiesRemoved: Object.keys(entities),
        rulesChanged: [],
        invariantsAdded: []
      }
    };
  }

  // 🚗 Formation Atelier Automobile : Remplacement de Batterie de Voiture
  if (
    ((norm.includes('batterie') || norm.includes('battery')) &&
     (norm.includes('voiture') || norm.includes('automobile') || /\b(car|cars)\b/i.test(norm) || norm.includes('véhicule') || norm.includes('vehicule') || norm.includes('moteur'))) ||
    (norm.includes('changer') && (norm.includes('batterie') || norm.includes('battery'))) ||
    norm.includes('changer une batterie') ||
    norm.includes('changer la batterie')
  ) {
    const car: EntitySpec = {
      id: 'car_sedan_1',
      name: 'Voiture avec compartiment moteur ouvert',
      visuals: {
        assetId: 'wp-voiture',
        modelUrl: '/library/wp-voiture.glb'
      },
      capabilities: [
        { type: 'transform', position: { x: 0.6, y: 0, z: 0 } },
        { type: 'collider' },
        { type: 'educational', text: 'Véhicule automobile avec capot relevé et compartiment moteur. Bac récepteur pour batterie 12V avec cosses (+) et (-).', value: 0, active: false }
      ]
    };

    const batteryTray: EntitySpec = {
      id: 'battery_tray_zone',
      name: 'Bac à batterie (Compartiment moteur)',
      visuals: {
        assetId: 'socket',
        modelUrl: '/library/socket.glb'
      },
      capabilities: [
        { type: 'transform', position: { x: 1.02, y: 0.85, z: 1.12 } },
        { type: 'collider' },
        { type: 'trigger_zone', radius: 0.6 }
      ]
    };

    const newBattery: EntitySpec = {
      id: 'car_battery_new',
      name: 'Batterie Automobile 12V 70Ah AGM',
      visuals: {
        assetId: 'wp-batterie-automobile',
        modelUrl: '/library/wp-batterie-automobile.glb'
      },
      capabilities: [
        { type: 'transform', position: { x: -1.8, y: 0.9, z: 0.3 } },
        { type: 'draggable' },
        { type: 'collider', radius: 0.35 },
        { type: 'educational', text: 'Batterie neuve 12V AGM. Vérifier la tension (12.6V) et nettoyer les bornes avant connexion.', value: 0, active: false }
      ]
    };

    const workbench: EntitySpec = {
      id: 'car_workbench',
      name: 'Établi technique de préparation',
      visuals: {
        assetId: 'technical-bench',
        modelUrl: '/library/technical-bench.glb'
      },
      capabilities: [
        { type: 'transform', position: { x: -1.8, y: 0, z: 0.3 } },
        { type: 'collider' }
      ]
    };

    const inspectRule: RuleSpec = {
      id: 'rule_inspect_car_battery',
      trigger: 'INTERACT',
      conditions: [{ type: 'is_source', sourceId: 'car_battery_new' }],
      actions: [
        { type: 'set_flag', flag: 'battery_inspected', value: true },
        { type: 'play_sound', sound: 'chime' },
        { type: 'show_warning', message: '🔋 Diagnostic batterie OK : Tension 12.6V, cellules AGM intactes, bornes prêtes au raccordement.' }
      ]
    };

    const dropRule: RuleSpec = {
      id: 'rule_install_car_battery',
      trigger: 'DROP',
      conditions: [
        { type: 'is_source', sourceId: 'car_battery_new' },
        { type: 'is_target', targetId: 'battery_tray_zone' },
        { type: 'require_flag', flag: 'battery_inspected' }
      ],
      actions: [
        { type: 'set_flag', flag: 'battery_installed', value: true },
        { type: 'set_flag', flag: 'car_running', value: true },
        { type: 'play_sound', sound: 'fanfare' },
        { type: 'show_warning', message: '🚗 Batterie connectée ! Cosses (+) puis (-) serrées. Phares allumés et moteur prêt !' }
      ]
    };

    const carQuest: QuestSpec = {
      id: 'quest_car_battery_replacement',
      title: 'Procédure : Remplacement de Batterie Automobile 12V',
      category: 'mecanique',
      description: 'Procédure certifiée en atelier : inspecter la nouvelle batterie 12V, la déposer dans le bac du compartiment moteur, puis valider le démarrage.',
      currentStepIndex: 0,
      status: 'in_progress',
      rewardSound: 'fanfare',
      steps: [
        {
          id: 'step_battery_1',
          title: 'Inspecter la nouvelle batterie 12V',
          description: 'Cliquez sur la batterie neuve sur l’établi pour mesurer sa tension de repos (12.6V).',
          targetEntityId: 'car_battery_new',
          requiredEvent: 'INTERACT',
          hint: 'Cliquez sur la batterie 12V.',
          completed: false
        },
        {
          id: 'step_battery_2',
          title: 'Installer la batterie dans le compartiment moteur',
          description: 'Glissez et déposez la batterie dans le bac récepteur du compartiment moteur de la voiture.',
          targetEntityId: 'car_battery_new',
          targetZoneId: 'battery_tray_zone',
          requiredEvent: 'DROP',
          hint: 'Glissez la batterie jusqu’au bac du moteur.',
          completed: false
        }
      ]
    };

    const carInvariant = {
      id: 'INV_CAR_BATTERY_INSPECT_FIRST',
      description: 'Sécurité Électrique : La batterie automobile doit être inspectée avant d’être raccordée au circuit du véhicule.',
      condition: { type: 'never_state' as const, stateFlag: 'car_running', requiredFlag: 'battery_inspected' }
    };

    return {
      plan: {
        intent: 'teach_car_battery_replacement',
        actions: [
          { action: 'spawn_car', target: 'car_sedan_1' },
          { action: 'spawn_battery', target: 'car_battery_new' },
          { action: 'create_quest', target: 'quest_car_battery_replacement' }
        ]
      },
      patch: {
        entitiesCreated: [car, batteryTray, workbench, newBattery],
        rulesChanged: [inspectRule, dropRule],
        questsAdded: [carQuest],
        activeQuestId: carQuest.id,
        invariantsAdded: [carInvariant]
      }
    };
  }

  // 👗 Ajout de Vêtements & Prêt-à-Porter Haute Couture (Louis Vuitton, Portant garni, Mannequin, Vestes)
  if (
    norm.includes('vetement') || norm.includes('vêtement') || 
    norm.includes('habit') || norm.includes('pret a porter') || norm.includes('prêt-à-porter') || 
    norm.includes('garde robe') || norm.includes('garde-robe') ||
    norm.includes('tenue') || norm.includes('fringue') || norm.includes('dressing') ||
    norm.includes('robe') || norm.includes('costume') || norm.includes('chemise') ||
    norm.includes('fashion') || norm.includes('garment') || norm.includes('clothes') || norm.includes('clothing') ||
    norm.includes('penderie') || norm.includes('cintre') ||
    ((norm.includes('ajouter') || norm.includes('ajoute') || norm.includes('mettre') || norm.includes('mets') || norm.includes('creer') || norm.includes('crée')) && 
     (norm.includes('veste') || norm.includes('manteau') || norm.includes('blouson') || norm.includes('portant') || norm.includes('mannequin') || norm.includes('mode') || norm.includes('luxe')))
  ) {
    const rackId = 'garment_rack_' + uuidv4().substring(0, 4);
    const mannequinId = 'couture_mannequin_' + uuidv4().substring(0, 4);
    const jacketId = 'monogram_jacket_' + uuidv4().substring(0, 4);

    const garmentRack: EntitySpec = {
      id: rackId,
      name: 'Portant à vêtements avec collection prêt-à-porter',
      visuals: {
        assetId: 'wp-portant-a-vetements',
        modelUrl: '/library/wp-portant-a-vetements.glb'
      },
      capabilities: [
        { type: 'transform', position: { x: -1.4, y: 0, z: 0.8 }, rotation: { x: 0, y: 0.15, z: 0 } },
        { type: 'collider' },
        { type: 'educational', text: 'Collection Prêt-à-Porter : blousons Monogram, manteaux en cachemire et chemises en soie sur cintres précieux.', value: 0, active: false }
      ]
    };

    const coutureMannequin: EntitySpec = {
      id: mannequinId,
      name: 'Mannequin haute couture habillé',
      visuals: {
        assetId: 'wp-mannequin-haute-couture',
        modelUrl: '/library/wp-mannequin-haute-couture.glb'
      },
      capabilities: [
        { type: 'transform', position: { x: 1.4, y: 0, z: -0.4 } },
        { type: 'collider' },
        { type: 'educational', text: 'Silhouette Haute Couture : ensemble sur-mesure avec finitions soyeuses et détails dorés.', value: 0, active: false }
      ]
    };

    const monogramJacket: EntitySpec = {
      id: jacketId,
      name: 'Veste zippée Monogram en cuir d’agneau',
      visuals: {
        assetId: 'wp-veste-monogram-luxe',
        modelUrl: '/library/wp-veste-monogram-luxe.glb'
      },
      capabilities: [
        { type: 'transform', position: { x: 1.3, y: 0, z: 0.7 } },
        { type: 'collider' },
        { type: 'draggable' },
        { type: 'educational', text: 'Veste Monogram en cuir d’agneau souple : finitions laiton doré, doublure en soie jacquard et coupe bomber contemporaine.', value: 0, active: false }
      ]
    };

    const inspectRackRule: RuleSpec = {
      id: `rule_inspect_${rackId}`,
      trigger: 'INTERACT',
      conditions: [{ type: 'is_source', sourceId: rackId }],
      actions: [
        { type: 'play_sound', sound: 'chime' },
        { type: 'show_warning', message: '👔 Collection Prêt-à-Porter : blousons Monogram, trenchs en cachemire et soieries sur cintres en bois précieux.' }
      ]
    };

    const inspectMannequinRule: RuleSpec = {
      id: `rule_inspect_${mannequinId}`,
      trigger: 'INTERACT',
      conditions: [{ type: 'is_source', sourceId: mannequinId }],
      actions: [
        { type: 'play_sound', sound: 'chime' },
        { type: 'show_warning', message: '👗 Silhouette Haute Couture : ensemble sur-mesure confectionné dans les ateliers de la Maison.' }
      ]
    };

    const inspectJacketRule: RuleSpec = {
      id: `rule_inspect_${jacketId}`,
      trigger: 'INTERACT',
      conditions: [{ type: 'is_source', sourceId: jacketId }],
      actions: [
        { type: 'play_sound', sound: 'chime' },
        { type: 'show_warning', message: '🧥 Veste Monogram en cuir d’agneau : finitions laiton doré, doublure jacquard et fermeture éclair dorée.' }
      ]
    };

    return {
      plan: {
        intent: 'add_luxury_clothing_collection',
        actions: [
          { action: 'create_entity', target: rackId },
          { action: 'create_entity', target: mannequinId },
          { action: 'create_entity', target: jacketId }
        ]
      },
      patch: {
        entitiesCreated: [garmentRack, coutureMannequin, monogramJacket],
        rulesChanged: [inspectRackRule, inspectMannequinRule, inspectJacketRule]
      }
    };
  }

  // 👜 Expérience Boutique de Luxe Louis Vuitton & Maroquinerie
  if (
    (norm.includes('louis vuitton') || (norm.includes('boutique') && (norm.includes('sac') || norm.includes('luxe') || norm.includes('maroquinerie')))) ||
    (norm.includes('maroquinerie') && (norm.includes('luxe') || norm.includes('sac'))) ||
    (norm.includes('visite') && norm.includes('boutique') && norm.includes('sac'))
  ) {
    const marbleCounter: EntitySpec = {
      id: 'lv_marble_counter',
      name: 'Comptoir de présentation en marbre Calacatta et laiton',
      visuals: {
        assetId: 'wp-presentoir-luxe',
        modelUrl: '/library/wp-presentoir-luxe.glb'
      },
      capabilities: [
        { type: 'transform', position: { x: 0, y: 0, z: 0 } },
        { type: 'collider' }
      ]
    };

    const monogramBag: EntitySpec = {
      id: 'lv_monogram_speedy',
      name: 'Sac Monogram Speedy en toile enduite et cuir naturel',
      visuals: {
        assetId: 'wp-sac-monogram',
        modelUrl: '/library/wp-sac-monogram.glb'
      },
      capabilities: [
        { type: 'transform', position: { x: -0.38, y: 0.912, z: 0.04 }, rotation: { x: 0, y: 0.20, z: 0 } },
        { type: 'draggable' },
        { type: 'collider', radius: 0.25 },
        { type: 'educational', text: 'Sac iconique Louis Vuitton : toile Monogram imperméable, finitions cuir de vachette naturel, fermoir zippé doré et cadenas numéroté.', value: 0, active: false }
      ]
    };

    const capucinesBag: EntitySpec = {
      id: 'lv_capucines_noir',
      name: 'Sac Capucines Haute Maroquinerie en cuir Taurillon noir',
      visuals: {
        assetId: 'wp-sac-capucines',
        modelUrl: '/library/wp-sac-capucines.glb'
      },
      capabilities: [
        { type: 'transform', position: { x: 0.06, y: 0.912, z: 0.04 }, rotation: { x: 0, y: -0.16, z: 0 } },
        { type: 'draggable' },
        { type: 'collider', radius: 0.25 },
        { type: 'educational', text: 'Haute Maroquinerie : cuir Taurillon pleine fleur, fermoir bijou LV en laiton doré et bandoulière amovible.', value: 0, active: false }
      ]
    };

    const showcase: EntitySpec = {
      id: 'lv_glass_showcase',
      name: 'Vitrine d’exposition haute joaillerie rétroéclairée LED',
      visuals: {
        assetId: 'wp-vitrine-luxe',
        modelUrl: '/library/wp-vitrine-luxe.glb'
      },
      capabilities: [
        { type: 'transform', position: { x: -1.8, y: 0, z: -0.8 } },
        { type: 'collider' }
      ]
    };

    const garmentRack: EntitySpec = {
      id: 'lv_garment_rack',
      name: 'Portant à vêtements avec collection prêt-à-porter',
      visuals: {
        assetId: 'wp-portant-a-vetements',
        modelUrl: '/library/wp-portant-a-vetements.glb'
      },
      capabilities: [
        { type: 'transform', position: { x: -1.7, y: 0, z: 0.9 }, rotation: { x: 0, y: 0.20, z: 0 } },
        { type: 'collider' },
        { type: 'educational', text: 'Collection Prêt-à-Porter : blousons Monogram, manteaux en cachemire et chemises en soie sur cintres précieux.', value: 0, active: false }
      ]
    };

    const coutureMannequin: EntitySpec = {
      id: 'lv_couture_mannequin',
      name: 'Mannequin haute couture habillé',
      visuals: {
        assetId: 'wp-mannequin-haute-couture',
        modelUrl: '/library/wp-mannequin-haute-couture.glb'
      },
      capabilities: [
        { type: 'transform', position: { x: 1.6, y: 0, z: -0.4 } },
        { type: 'collider' },
        { type: 'educational', text: 'Silhouette Haute Couture : ensemble couture noir satiné avec chaîne dorée et finitions d’exception.', value: 0, active: false }
      ]
    };

    const inspectionPodium: EntitySpec = {
      id: 'lv_inspection_podium',
      name: 'Podium d’inspection VIP & éclairage zénithal',
      visuals: {
        assetId: 'wp-podium-vip',
        modelUrl: '/library/wp-podium-vip.glb'
      },
      capabilities: [
        { type: 'transform', position: { x: 0.54, y: 0.912, z: 0.02 } },
        { type: 'collider', radius: 0.28 },
        { type: 'trigger_zone', radius: 0.45 }
      ]
    };

    const inspectMonogramRule: RuleSpec = {
      id: 'rule_inspect_monogram',
      trigger: 'INTERACT',
      conditions: [{ type: 'is_source', sourceId: 'lv_monogram_speedy' }],
      actions: [
        { type: 'set_flag', flag: 'monogram_inspected', value: true },
        { type: 'play_sound', sound: 'chime' },
        { type: 'show_warning', message: '✨ Sac Monogram inspecté : toile enduite imperméable, finitions cuir de vachette naturel et cadenas doré numéroté.' }
      ]
    };

    const inspectCapucinesRule: RuleSpec = {
      id: 'rule_inspect_capucines',
      trigger: 'INTERACT',
      conditions: [{ type: 'is_source', sourceId: 'lv_capucines_noir' }],
      actions: [
        { type: 'set_flag', flag: 'capucines_inspected', value: true },
        { type: 'play_sound', sound: 'chime' },
        { type: 'show_warning', message: '💎 Sac Capucines inspecté : cuir pleine fleur Taurillon, fermoir bijou LV incrusté et doublure cuir rose poudré.' }
      ]
    };

    const inspectRackRule: RuleSpec = {
      id: 'rule_inspect_rack',
      trigger: 'INTERACT',
      conditions: [{ type: 'is_source', sourceId: 'lv_garment_rack' }],
      actions: [
        { type: 'play_sound', sound: 'chime' },
        { type: 'show_warning', message: '👔 Collection Prêt-à-Porter : blousons Monogram, trenchs en cachemire et soieries sur cintres en bois précieux.' }
      ]
    };

    const inspectMannequinRule: RuleSpec = {
      id: 'rule_inspect_mannequin',
      trigger: 'INTERACT',
      conditions: [{ type: 'is_source', sourceId: 'lv_couture_mannequin' }],
      actions: [
        { type: 'play_sound', sound: 'chime' },
        { type: 'show_warning', message: '👗 Silhouette Haute Couture : ensemble sur-mesure confectionné dans les ateliers de la Maison.' }
      ]
    };

    const displayPodiumRule: RuleSpec = {
      id: 'rule_display_podium',
      trigger: 'DROP',
      conditions: [
        { type: 'is_source', sourceId: 'lv_monogram_speedy' },
        { type: 'is_target', targetId: 'lv_inspection_podium' }
      ],
      actions: [
        { type: 'set_flag', flag: 'monogram_inspected', value: true },
        { type: 'set_flag', flag: 'bag_presented_podium', value: true },
        { type: 'play_sound', sound: 'fanfare' },
        { type: 'show_warning', message: '🌟 Présentation VIP sur le podium validée : examen sous éclairage zénithal réussi et certificat d’authenticité blockchain Victoria VR généré !' }
      ]
    };

    const lvQuest: QuestSpec = {
      id: 'quest_lv_boutique',
      title: 'Visite VIP : Maroquinerie d’Excellence Louis Vuitton',
      category: 'luxury',
      description: 'Expérience d’exception en boutique de luxe : examiner le sac iconique Monogram, inspecter la haute maroquinerie Capucines, puis présenter la création sur le podium VIP.',
      currentStepIndex: 0,
      status: 'in_progress',
      rewardSound: 'fanfare',
      steps: [
        {
          id: 'step_lv_1',
          title: 'Examiner le sac iconique Monogram',
          description: 'Cliquez sur le sac Monogram pour apprécier la toile, le grain et les finitions dorées.',
          targetEntityId: 'lv_monogram_speedy',
          requiredEvent: 'INTERACT',
          hint: 'Cliquez sur le sac Monogram.',
          completed: false
        },
        {
          id: 'step_lv_2',
          title: 'Examiner le sac Capucines Taurillon',
          description: 'Cliquez sur le sac Capucines pour inspecter le fermoir bijou LV et le cuir pleine fleur.',
          targetEntityId: 'lv_capucines_noir',
          requiredEvent: 'INTERACT',
          hint: 'Cliquez sur le sac Capucines.',
          completed: false
        },
        {
          id: 'step_lv_3',
          title: 'Présenter le sac sur le podium VIP',
          description: 'Glissez le sac Monogram vers le podium central d’inspection pour générer le certificat d’authenticité.',
          targetEntityId: 'lv_monogram_speedy',
          targetZoneId: 'lv_inspection_podium',
          requiredEvent: 'DROP',
          hint: 'Déposez le sac sur le podium central.',
          completed: false
        }
      ]
    };

    const lvInvariant: Invariant = {
      id: 'INV_LV_AUTHENTICITY_VERIFIED',
      description: 'Authenticité Certifiée : Le sac de luxe doit être examiné avant sa présentation sur le podium d’exposition VIP.',
      condition: { type: 'never_state', stateFlag: 'bag_presented_podium', requiredFlag: 'monogram_inspected' }
    };

    return {
      plan: {
        intent: 'visit_louis_vuitton_boutique',
        actions: [
          { action: 'spawn_luxury_showroom', target: 'lv_marble_counter' },
          { action: 'create_quest', target: 'quest_lv_boutique' }
        ]
      },
      patch: {
        entitiesCreated: [marbleCounter, monogramBag, capucinesBag, showcase, inspectionPodium, garmentRack, coutureMannequin],
        rulesChanged: [inspectMonogramRule, inspectCapucinesRule, displayPodiumRule, inspectRackRule, inspectMannequinRule],
        questsAdded: [lvQuest],
        activeQuestId: lvQuest.id,
        invariantsAdded: [lvInvariant]
      }
    };
  }

  // 🍪 Expérience Atelier Pâtisserie : Cuisson des Cookies aux Pépites de Chocolat (Masterclass Complète)
  if (
    (norm.includes('cookie') || norm.includes('cookies')) &&
    (norm.includes('cuisiner') || norm.includes('cuire') || norm.includes('preparer') || norm.includes('préparer') || norm.includes('faire') || norm.includes('four') || norm.includes('pépites') || norm.includes('pepites') || norm.includes('recette') || norm.includes('chocolat'))
  ) {
    const pastryTable: EntitySpec = {
      id: 'pastry_marble_table',
      name: 'Plan de travail de pâtisserie en marbre blanc',
      visuals: {
        assetId: 'wp-plan-patisserie',
        modelUrl: '/library/wp-plan-patisserie.glb'
      },
      capabilities: [
        { type: 'transform', position: { x: 0, y: 0, z: 0 } },
        { type: 'collider' }
      ]
    };

    const ingredientsTray: EntitySpec = {
      id: 'cookie_ingredients_tray',
      name: 'Plateau des ingrédients dosés (farine tamisée, cassonade, beurre AOP)',
      visuals: {
        assetId: 'wp-ingredients-cookies',
        modelUrl: '/library/wp-ingredients-cookies.glb'
      },
      capabilities: [
        { type: 'transform', position: { x: -0.9, y: 0.92, z: 0 } },
        { type: 'draggable' },
        { type: 'collider', radius: 0.3 },
        { type: 'educational', text: 'Ingrédients de première qualité : farine T55 tamisée, cassonade brune pour le moelleux, et beurre pommade.', value: 0, active: false }
      ]
    };

    const doughBowl: EntitySpec = {
      id: 'cookie_dough_bowl',
      name: 'Saladier de pâte à cookies aux pépites de chocolat',
      visuals: {
        assetId: 'wp-saladier-cookies',
        modelUrl: '/library/wp-saladier-cookies.glb'
      },
      capabilities: [
        { type: 'transform', position: { x: -0.2, y: 0.92, z: 0 } },
        { type: 'collider' },
        { type: 'educational', text: 'Pâte à cookies artisanale : émulsion beurre-sucre, vanille bourbon et pépites de chocolat noir 70%.', value: 0, active: false }
      ]
    };

    const bakingSheet: EntitySpec = {
      id: 'cookie_baking_sheet',
      name: 'Plaque de cuisson avec 6 cookies façonnés prêts à enfourner',
      visuals: {
        assetId: 'wp-plaque-cookies',
        modelUrl: '/library/wp-plaque-cookies.glb'
      },
      capabilities: [
        { type: 'transform', position: { x: 0.6, y: 0.92, z: 0 } },
        { type: 'draggable' },
        { type: 'collider', radius: 0.35 },
        { type: 'educational', text: 'Plaque pâtissière antiadhésive avec 6 pâtons calibrés de 75g disposés en quinconce.', value: 0, active: false }
      ]
    };

    const oven: EntitySpec = {
      id: 'pastry_oven',
      name: 'Four professionnel encastrable à convection (180°C)',
      visuals: {
        assetId: 'wp-four-patisserie',
        modelUrl: '/library/wp-four-patisserie.glb'
      },
      capabilities: [
        { type: 'transform', position: { x: 1.8, y: 0, z: 0 } },
        { type: 'collider' }
      ]
    };

    const ovenSlot: EntitySpec = {
      id: 'oven_baking_slot',
      name: 'Glissière centrale du four de cuisson',
      visuals: {
        assetId: 'socket',
        modelUrl: '/library/socket.glb'
      },
      capabilities: [
        { type: 'transform', position: { x: 1.8, y: 0.85, z: 0 } },
        { type: 'collider', radius: 0.45 },
        { type: 'trigger_zone', radius: 0.65 }
      ]
    };

    const measureIngredientsRule: RuleSpec = {
      id: 'rule_measure_cookie_ingredients',
      trigger: 'INTERACT',
      conditions: [{ type: 'is_source', sourceId: 'cookie_ingredients_tray' }],
      actions: [
        { type: 'set_flag', flag: 'ingredients_creamed', value: true },
        { type: 'play_sound', sound: 'chime' },
        { type: 'show_warning', message: '🧈 Émulsion réussie : beurre doux AOP pommade et cassonade battus jusqu’à texture crémeuse et ruban parfait.' }
      ]
    };

    const inspectDoughRule: RuleSpec = {
      id: 'rule_inspect_cookie_dough',
      trigger: 'INTERACT',
      conditions: [{ type: 'is_source', sourceId: 'cookie_dough_bowl' }],
      actions: [
        { type: 'set_flag', flag: 'dough_inspected', value: true },
        { type: 'play_sound', sound: 'chime' },
        { type: 'show_warning', message: '🥣 Pâte à cookies pétrie avec précision : farine incorporée sans trop de réseau glutineux et pépites 70% équilibrées.' }
      ]
    };

    const shapeDoughRule: RuleSpec = {
      id: 'rule_shape_cookie_dough',
      trigger: 'INTERACT',
      conditions: [{ type: 'is_source', sourceId: 'cookie_baking_sheet' }],
      actions: [
        { type: 'set_flag', flag: 'dough_shaped', value: true },
        { type: 'play_sound', sound: 'chime' },
        { type: 'show_warning', message: '✨ Façonnage des cookies validé : 6 boules de pâte régulières espacées sur le papier sulfurisé pour un étalement uniforme.' }
      ]
    };

    const bakeRule: RuleSpec = {
      id: 'rule_bake_cookies',
      trigger: 'DROP',
      conditions: [
        { type: 'is_source', sourceId: 'cookie_baking_sheet' },
        { type: 'is_target', targetId: 'oven_baking_slot' }
      ],
      actions: [
        { type: 'set_flag', flag: 'cookies_baked', value: true },
        { type: 'play_sound', sound: 'fanfare' },
        { type: 'show_warning', message: '🍪 Cuisson terminée à 180°C pendant 12 minutes : arômes vanille bourbon, dorure croustillante et cœur fondant garantis !' }
      ]
    };

    const cookieQuest: QuestSpec = {
      id: 'quest_baking_cookies',
      title: 'Atelier Pâtisserie : Cuisson des Cookies Américains',
      category: 'formation',
      description: 'Masterclass de pâtisserie : émulsionner le beurre pommade et la cassonade, pétrir la pâte aux pépites, façonner les 6 pâtons, puis enfourner à 180°C.',
      currentStepIndex: 0,
      status: 'in_progress',
      rewardSound: 'fanfare',
      steps: [
        {
          id: 'step_cookie_1',
          title: 'Doser et crémer les ingrédients nobles',
          description: 'Émulsionnez le beurre doux AOP pommade avec la cassonade brune et la fleur de sel.',
          targetEntityId: 'cookie_ingredients_tray',
          requiredEvent: 'INTERACT',
          hint: 'Cliquez sur le plateau des ingrédients pour battre le beurre.',
          completed: false
        },
        {
          id: 'step_cookie_2',
          title: 'Inspecter et pétrir la pâte à cookies',
          description: 'Incorporez la farine tamisée et les pépites de chocolat noir sans corser la pâte.',
          targetEntityId: 'cookie_dough_bowl',
          requiredEvent: 'INTERACT',
          hint: 'Cliquez sur le saladier de pâte pour vérifier la texture.',
          completed: false
        },
        {
          id: 'step_cookie_3',
          title: 'Façonner les 6 pâtons réguliers sur plaque',
          description: 'Vérifiez la disposition régulière des pâtons de 75g sur la plaque sulfurisée.',
          targetEntityId: 'cookie_baking_sheet',
          requiredEvent: 'INTERACT',
          hint: 'Cliquez sur la plaque de cuisson pour valider le façonnage.',
          completed: false
        },
        {
          id: 'step_cookie_4',
          title: 'Enfourner la plaque de cuisson à 180°C',
          description: 'Glissez la plaque de cuisson dans la glissière centrale du four de pâtisserie.',
          targetEntityId: 'cookie_baking_sheet',
          targetZoneId: 'oven_baking_slot',
          requiredEvent: 'DROP',
          hint: 'Glissez la plaque vers la glissière du four.',
          completed: false
        }
      ]
    };

    const cookieInvariant: Invariant = {
      id: 'INV_COOKIE_PREHEAT_SAFE',
      description: 'Contrôle Pâtissier : La pâte à cookies doit être inspectée avant d’enfourner la plaque à 180°C.',
      condition: { type: 'never_state', stateFlag: 'cookies_baked', requiredFlag: 'dough_inspected' }
    };

    return {
      plan: {
        intent: 'bake_chocolate_chip_cookies',
        actions: [
          { action: 'spawn_bakery', target: 'pastry_marble_table' },
          { action: 'create_quest', target: 'quest_baking_cookies' }
        ]
      },
      patch: {
        entitiesCreated: [pastryTable, ingredientsTray, doughBowl, bakingSheet, oven, ovenSlot],
        rulesChanged: [measureIngredientsRule, inspectDoughRule, shapeDoughRule, bakeRule],
        questsAdded: [cookieQuest],
        activeQuestId: cookieQuest.id,
        invariantsAdded: [cookieInvariant]
      }
    };
  }

  // 🪑 Expérience B2B IKEA : Montage d’un Meuble en Kit & Sécurité Murale
  if (
    (norm.includes('ikea') || norm.includes('meuble') || norm.includes('flat pack') || norm.includes('flatpack') || norm.includes('etagere') || norm.includes('étagère') || norm.includes('bibliotheque') || norm.includes('bibliothèque')) &&
    (norm.includes('monter') || norm.includes('montage') || norm.includes('assembler') || norm.includes('notice') || norm.includes('kit') || norm.includes('tourillon') || norm.includes('ikea'))
  ) {
    const workMat: EntitySpec = {
      id: 'ikea_work_mat',
      name: 'Tapis de feutre de protection au sol anti-rayures',
      visuals: {
        assetId: 'wp-tapis-montage-ikea',
        modelUrl: '/library/wp-tapis-montage-ikea.glb'
      },
      capabilities: [
        { type: 'transform', position: { x: 0, y: 0.01, z: 0 } },
        { type: 'collider' }
      ]
    };

    const flatpackBox: EntitySpec = {
      id: 'ikea_flatpack_box',
      name: 'Carton du kit meuble IKEA ouvert avec panneaux et notice',
      visuals: {
        assetId: 'wp-meuble-ikea-kit',
        modelUrl: '/library/wp-meuble-ikea-kit.glb'
      },
      capabilities: [
        { type: 'transform', position: { x: -0.7, y: 0.05, z: 0 } },
        { type: 'collider' },
        { type: 'educational', text: 'Kit meuble plat IKEA : montants pré-percés, tablette intermédiaire et notice visuelle universelle.', value: 0, active: false }
      ]
    };

    const dowelBag: EntitySpec = {
      id: 'ikea_dowel_bag',
      name: 'Sachet de quincaillerie (tourillons bois de hêtre et cames excentriques)',
      visuals: {
        assetId: 'wp-quincaillerie-ikea',
        modelUrl: '/library/wp-quincaillerie-ikea.glb'
      },
      capabilities: [
        { type: 'transform', position: { x: 0.4, y: 0.08, z: 0.3 } },
        { type: 'draggable' },
        { type: 'collider', radius: 0.25 },
        { type: 'educational', text: 'Quincaillerie calibrée : tourillons hêtre 8x30mm et cames de serrage quart de tour en zamak.', value: 0, active: false }
      ]
    };

    const allenKey: EntitySpec = {
      id: 'ikea_allen_key',
      name: 'Clé Allen hexagonale 4mm en acier trempé',
      visuals: {
        assetId: 'wp-cle-allen',
        modelUrl: '/library/wp-cle-allen.glb'
      },
      capabilities: [
        { type: 'transform', position: { x: 0.6, y: 0.08, z: 0 } },
        { type: 'draggable' },
        { type: 'collider', radius: 0.2 },
        { type: 'educational', text: 'Outil de montage iconique : clé 6 pans 4mm pour serrage sans jeu mécanique.', value: 0, active: false }
      ]
    };

    const wallBracket: EntitySpec = {
      id: 'ikea_wall_bracket',
      name: 'Équerre métallique de sécurité anti-basculement murale',
      visuals: {
        assetId: 'wp-equerre-murale',
        modelUrl: '/library/wp-equerre-murale.glb'
      },
      capabilities: [
        { type: 'transform', position: { x: 0.4, y: 0.08, z: -0.3 } },
        { type: 'draggable' },
        { type: 'collider', radius: 0.25 },
        { type: 'educational', text: 'Équerre obligatoire de retenue murale : prévient tout basculement selon la norme ASTM F2057-23.', value: 0, active: false }
      ]
    };

    const assembledShelf: EntitySpec = {
      id: 'ikea_assembled_shelf',
      name: 'Étagère bibliothèque IKEA en cours d’assemblage',
      visuals: {
        assetId: 'wp-etagere-ikea',
        modelUrl: '/library/wp-etagere-ikea.glb'
      },
      capabilities: [
        { type: 'transform', position: { x: 0, y: 0.75, z: -0.7 } },
        { type: 'collider' }
      ]
    };

    const wallSlot: EntitySpec = {
      id: 'ikea_wall_slot',
      name: 'Zone d’ancrage mural anti-basculement',
      visuals: {
        assetId: 'socket',
        modelUrl: '/library/socket.glb'
      },
      capabilities: [
        { type: 'transform', position: { x: 0, y: 1.45, z: -0.7 } },
        { type: 'collider', radius: 0.4 },
        { type: 'trigger_zone', radius: 0.55 }
      ]
    };

    const unpackKitRule: RuleSpec = {
      id: 'rule_ikea_unpack_kit',
      trigger: 'INTERACT',
      conditions: [{ type: 'is_source', sourceId: 'ikea_flatpack_box' }],
      actions: [
        { type: 'set_flag', flag: 'ikea_unpacked', value: true },
        { type: 'play_sound', sound: 'chime' },
        { type: 'show_warning', message: '📦 Déballage kit IKEA : notice dépliée, montants mélaminés vérifiés et quincaillerie comptée sans manque.' }
      ]
    };

    const insertDowelsRule: RuleSpec = {
      id: 'rule_ikea_insert_dowels',
      trigger: 'INTERACT',
      conditions: [{ type: 'is_source', sourceId: 'ikea_dowel_bag' }],
      actions: [
        { type: 'set_flag', flag: 'ikea_dowels_inserted', value: true },
        { type: 'play_sound', sound: 'chime' },
        { type: 'show_warning', message: '🪵 Tourillons de hêtre insérés à la main dans les chants des montants verticaux sans fendre le bois.' }
      ]
    };

    const tightenScrewsRule: RuleSpec = {
      id: 'rule_ikea_tighten_screws',
      trigger: 'INTERACT',
      conditions: [{ type: 'is_source', sourceId: 'ikea_allen_key' }],
      actions: [
        { type: 'set_flag', flag: 'ikea_screws_tightened', value: true },
        { type: 'play_sound', sound: 'chime' },
        { type: 'show_warning', message: '🔧 Serrage quart de tour des vis excentriques à la clé Allen 4mm : caisson rigide et équerrage vérifié.' }
      ]
    };

    const anchorWallRule: RuleSpec = {
      id: 'rule_ikea_anchor_wall',
      trigger: 'DROP',
      conditions: [
        { type: 'is_source', sourceId: 'ikea_wall_bracket' },
        { type: 'is_target', targetId: 'ikea_wall_slot' }
      ],
      actions: [
        { type: 'set_flag', flag: 'ikea_wall_anchored', value: true },
        { type: 'play_sound', sound: 'fanfare' },
        { type: 'show_warning', message: '🛡️ Sécurité anti-basculement solidarisée au mur : meuble certifié conforme aux normes internationales de sécurité enfant !' }
      ]
    };

    const ikeaQuest: QuestSpec = {
      id: 'quest_assemble_ikea_furniture',
      title: 'Atelier Ameublement : Montage d’un Meuble IKEA & Sécurité Murale',
      category: 'formation',
      description: 'Atelier de montage de meuble en kit : inventorier la quincaillerie, insérer les tourillons bois, serrer à la clé Allen et solidariser l’ancrage mural anti-basculement.',
      currentStepIndex: 0,
      status: 'in_progress',
      rewardSound: 'fanfare',
      steps: [
        {
          id: 'step_ikea_1',
          title: 'Déballer le kit flat-pack et la notice',
          description: 'Inspectez le carton de montage, les panneaux mélaminés et la notice graphique universelle.',
          targetEntityId: 'ikea_flatpack_box',
          requiredEvent: 'INTERACT',
          hint: 'Cliquez sur le carton de meuble ouvert pour vérifier l’inventaire.',
          completed: false
        },
        {
          id: 'step_ikea_2',
          title: 'Insérer les tourillons en bois de hêtre',
          description: 'Positionnez les tourillons bois dans les trous borgnes des montants verticaux.',
          targetEntityId: 'ikea_dowel_bag',
          requiredEvent: 'INTERACT',
          hint: 'Cliquez sur le sachet de quincaillerie.',
          completed: false
        },
        {
          id: 'step_ikea_3',
          title: 'Serrer les cames excentriques à la clé Allen 4mm',
          description: 'Verrouillez les boîtiers excentriques par un quart de tour précis avec la clé Allen.',
          targetEntityId: 'ikea_allen_key',
          requiredEvent: 'INTERACT',
          hint: 'Cliquez sur la clé Allen hexagonale.',
          completed: false
        },
        {
          id: 'step_ikea_4',
          title: 'Fixer l’équerre de sécurité anti-basculement au mur',
          description: 'Glissez l’équerre métallique sur la zone réceptrice murale pour sécuriser définitivement le meuble.',
          targetEntityId: 'ikea_wall_bracket',
          targetZoneId: 'ikea_wall_slot',
          requiredEvent: 'DROP',
          hint: 'Glissez l’équerre métallique vers la zone d’ancrage murale.',
          completed: false
        }
      ]
    };

    const ikeaSafetyInvariant: Invariant = {
      id: 'INV_IKEA_SAFETY_WALL_ANCHOR',
      description: 'Sécurité Ameublement : Le meuble doit être solidarisé avec son équerre murale avant d’être homologué.',
      condition: { type: 'never_state', stateFlag: 'ikea_wall_anchored', requiredFlag: 'ikea_screws_tightened' }
    };

    return {
      plan: {
        intent: 'assemble_ikea_furniture',
        actions: [
          { action: 'spawn_flatpack_kit', target: 'ikea_work_mat' },
          { action: 'create_quest', target: 'quest_assemble_ikea_furniture' }
        ]
      },
      patch: {
        entitiesCreated: [workMat, flatpackBox, dowelBag, allenKey, wallBracket, assembledShelf, wallSlot],
        rulesChanged: [unpackKitRule, insertDowelsRule, tightenScrewsRule, anchorWallRule],
        questsAdded: [ikeaQuest],
        activeQuestId: ikeaQuest.id,
        invariantsAdded: [ikeaSafetyInvariant]
      }
    };
  }

  // 🎮 Expérience B2B Tech : Studio de Création de Jeu Vidéo 3D (Level Design & Playtest IA)
  if (
    !norm.includes('jeu de cle') && !norm.includes('jeu de clé') &&
    (norm.includes('jeu video') || norm.includes('jeu vidéo') || norm.includes('gamedev') || norm.includes('game design') || norm.includes('level design') || norm.includes('creer un jeu') || norm.includes('créer un jeu') || (norm.includes('plateforme') && (norm.includes('playtest') || norm.includes('gemme'))))
  ) {
    const workbench: EntitySpec = {
      id: 'gamedev_workbench',
      name: 'Console holographique de Level Design & Grille 3D',
      visuals: {
        assetId: 'wp-console-level-design',
        modelUrl: '/library/wp-console-level-design.glb'
      },
      capabilities: [
        { type: 'transform', position: { x: 0, y: 0, z: -1.2 } },
        { type: 'collider' }
      ]
    };

    const spawnPad: EntitySpec = {
      id: 'player_spawn_pad',
      name: 'Socle de réapparition joueur (Spawn Pad Néon Cyan)',
      visuals: {
        assetId: 'wp-spawn-pad',
        modelUrl: '/library/wp-spawn-pad.glb'
      },
      capabilities: [
        { type: 'transform', position: { x: -1.5, y: 0.05, z: 0 } },
        { type: 'collider' },
        { type: 'educational', text: 'Point de départ joueur avec boussole d’orientation et anneau lumineux néon.', value: 0, active: false }
      ]
    };

    const platformsKit: EntitySpec = {
      id: 'floating_platforms_kit',
      name: 'Plateforme magnétique flottante luminescente',
      visuals: {
        assetId: 'wp-plateforme-flottante',
        modelUrl: '/library/wp-plateforme-flottante.glb'
      },
      capabilities: [
        { type: 'transform', position: { x: -0.4, y: 0.8, z: 0 } },
        { type: 'draggable' },
        { type: 'collider', radius: 0.4 },
        { type: 'educational', text: 'Plateforme en lévitation magnétique : paramétrée pour une portée de saut maximale de 2.6m.', value: 0, active: false }
      ]
    };

    const energyGems: EntitySpec = {
      id: 'energy_gems_cluster',
      name: 'Lot de gemmes ambrées luminescentes à collecter',
      visuals: {
        assetId: 'wp-gemme-collectable',
        modelUrl: '/library/wp-gemme-collectable.glb'
      },
      capabilities: [
        { type: 'transform', position: { x: 0.5, y: 0.7, z: 0 } },
        { type: 'draggable' },
        { type: 'collider', radius: 0.3 },
        { type: 'educational', text: 'Collectables guidant le regard du joueur et récompensant les trajectoires de saut audacieuses.', value: 0, active: false }
      ]
    };

    const hazardLaser: EntitySpec = {
      id: 'hazard_laser_trap',
      name: 'Tourelle piège laser oscillant rouge rubis',
      visuals: {
        assetId: 'wp-piege-laser',
        modelUrl: '/library/wp-piege-laser.glb'
      },
      capabilities: [
        { type: 'transform', position: { x: 1.2, y: 0.4, z: 0 } },
        { type: 'draggable' },
        { type: 'collider', radius: 0.35 },
        { type: 'educational', text: 'Obstacle dynamique avec faisceau laser oscillant : rythme le timing de franchissement.', value: 0, active: false }
      ]
    };

    const victoryPortal: EntitySpec = {
      id: 'victory_portal_gate',
      name: 'Portail dimensionnel de victoire avec arche dorée',
      visuals: {
        assetId: 'wp-portail-victoire',
        modelUrl: '/library/wp-portail-victoire.glb'
      },
      capabilities: [
        { type: 'transform', position: { x: 2.2, y: 1.2, z: 0 } },
        { type: 'collider' }
      ]
    };

    const portalSlot: EntitySpec = {
      id: 'portal_activation_slot',
      name: 'Récepteur d’énergie d’activation du portail de victoire',
      visuals: {
        assetId: 'socket',
        modelUrl: '/library/socket.glb'
      },
      capabilities: [
        { type: 'transform', position: { x: 2.2, y: 1.2, z: 0 } },
        { type: 'collider', radius: 0.45 },
        { type: 'trigger_zone', radius: 0.65 }
      ]
    };

    const placePlatformsRule: RuleSpec = {
      id: 'rule_gamedev_place_platforms',
      trigger: 'INTERACT',
      conditions: [{ type: 'is_source', sourceId: 'floating_platforms_kit' }],
      actions: [
        { type: 'set_flag', flag: 'platforms_placed', value: true },
        { type: 'play_sound', sound: 'chime' },
        { type: 'show_warning', message: '🧱 Plateformes magnétiques calibrées à 2.55m : saut parfaitement accessible sans risque de chute infranchissable.' }
      ]
    };

    const placeGemsRule: RuleSpec = {
      id: 'rule_gamedev_place_gems',
      trigger: 'INTERACT',
      conditions: [{ type: 'is_source', sourceId: 'energy_gems_cluster' }],
      actions: [
        { type: 'set_flag', flag: 'gems_placed', value: true },
        { type: 'play_sound', sound: 'chime' },
        { type: 'show_warning', message: '💎 Gemmes ambrées disposées au zénith de la parabole de saut : signalétique visuelle claire et gratification immédiate.' }
      ]
    };

    const tuneHazardRule: RuleSpec = {
      id: 'rule_gamedev_tune_hazard',
      trigger: 'INTERACT',
      conditions: [{ type: 'is_source', sourceId: 'hazard_laser_trap' }],
      actions: [
        { type: 'set_flag', flag: 'hazard_tuned', value: true },
        { type: 'play_sound', sound: 'chime' },
        { type: 'show_warning', message: '⚠️ Piège laser cadencé à 1.5s : fenêtre d’esquive équitable et zone d’avertissement visuelle active.' }
      ]
    };

    const launchPlaytestRule: RuleSpec = {
      id: 'rule_gamedev_launch_playtest',
      trigger: 'DROP',
      conditions: [
        { type: 'is_source', sourceId: 'energy_gems_cluster' },
        { type: 'is_target', targetId: 'portal_activation_slot' }
      ],
      actions: [
        { type: 'set_flag', flag: 'game_level_validated', value: true },
        { type: 'play_sound', sound: 'fanfare' },
        { type: 'show_warning', message: '🏆 Playtest IA autonome terminé : 100% de complétion, 3/3 gemmes récoltées, niveau validé pour publication !' }
      ]
    };

    const gamedevQuest: QuestSpec = {
      id: 'quest_design_3d_platformer',
      title: 'Game Design Lab : Édition de Niveau 3D & Playtest Autonome',
      category: 'formation',
      description: 'Atelier de création de jeu vidéo : calibrer l’espacement des plateformes de saut, disposer les gemmes ambrées, paramétrer le piège laser et valider par playtest IA.',
      currentStepIndex: 0,
      status: 'in_progress',
      rewardSound: 'fanfare',
      steps: [
        {
          id: 'step_gamedev_1',
          title: 'Calibrer les plateformes de saut',
          description: 'Ajustez la distance entre plateformes à 2.55m max pour garantir un saut franchissable.',
          targetEntityId: 'floating_platforms_kit',
          requiredEvent: 'INTERACT',
          hint: 'Cliquez sur la plateforme flottante néon pour calibrer l’espacement.',
          completed: false
        },
        {
          id: 'step_gamedev_2',
          title: 'Disposer les gemmes d’énergie ambrées',
          description: 'Placez les gemmes collectables le long de la ligne de vue de l’arche de saut.',
          targetEntityId: 'energy_gems_cluster',
          requiredEvent: 'INTERACT',
          hint: 'Cliquez sur le lot de gemmes ambrées pour les positionner.',
          completed: false
        },
        {
          id: 'step_gamedev_3',
          title: 'Paramétrer le cycle du piège laser',
          description: 'Réglez l’oscillation de la tourelle laser pour offrir une fenêtre d’esquive équitable.',
          targetEntityId: 'hazard_laser_trap',
          requiredEvent: 'INTERACT',
          hint: 'Cliquez sur la tourelle piège laser pour synchroniser la cadence.',
          completed: false
        },
        {
          id: 'step_gamedev_4',
          title: 'Lancer le Playtester IA et activer le portail de victoire',
          description: 'Déposez les gemmes dans le portail de victoire pour lancer la simulation kinématique de franchissement.',
          targetEntityId: 'energy_gems_cluster',
          targetZoneId: 'portal_activation_slot',
          requiredEvent: 'DROP',
          hint: 'Glissez les gemmes vers le portail doré pour lancer le playtest.',
          completed: false
        }
      ]
    };

    const gamedevReachableInvariant: Invariant = {
      id: 'INV_GAMEDEV_REACHABLE_GOAL',
      description: 'Level Design Invariant : Le niveau ne peut être validé sans avoir calibré les plateformes et le danger.',
      condition: { type: 'never_state', stateFlag: 'game_level_validated', requiredFlag: 'platforms_placed' }
    };

    return {
      plan: {
        intent: 'design_3d_platformer_game',
        actions: [
          { action: 'spawn_gamedev_studio', target: 'gamedev_workbench' },
          { action: 'create_quest', target: 'quest_design_3d_platformer' }
        ]
      },
      patch: {
        entitiesCreated: [workbench, spawnPad, platformsKit, energyGems, hazardLaser, victoryPortal, portalSlot],
        rulesChanged: [placePlatformsRule, placeGemsRule, tuneHazardRule, launchPlaytestRule],
        questsAdded: [gamedevQuest],
        activeQuestId: gamedevQuest.id,
        invariantsAdded: [gamedevReachableInvariant]
      }
    };
  }

  // Showroom automobile de démonstration.
  if (
    norm.includes('supercar') ||
    norm.includes('hypercar') ||
    norm.includes('voiture de sport') ||
    (norm.includes('showroom') && (norm.includes('automobile') || norm.includes('voiture') || norm.includes('bolide')))
  ) {
    const supercar: EntitySpec = {
      id: 'demo_supercar',
      name: 'Supercar aérodynamique Victoria VR (V12 biturbo et carbone)',
      visuals: {
        assetId: 'wp-supercar-showroom'
      },
      physicalProperties: {
        dimensions: [4.65, 1.18, 2.05],
        weightKg: 1380,
        capacityLiters: 140,
        material: 'Monocoque en fibre de carbone pré-imprégnée et titane aérospatial',
        sku: 'VVR-SC-2026-X1'
      },
      fallback2D: {
        description: 'Supercar d’ingénierie haute performance motorisée par un V12 biturbo développant 850 ch, avec aérodynamique active et cockpit numérique en réalité spatiale.',
        specificationSheetUrl: 'https://victoriavr.com'
      },
      parts: [
        { id: 'engine_v12', name: 'Moteur V12 6.0L biturbo central', description: 'Groupe motopropulseur hybride de 850 ch avec cartographie sport et échappement titane.' },
        { id: 'chassis_carbon', name: 'Châssis monocoque en carbone', description: 'Structure ultralégère en composite carbone tissé haute résistance à la torsion.' },
        { id: 'active_wing', name: 'Aileron aérodynamique actif', description: 'Déflecteur mobile adaptatif faisant office d’aéro-frein stabilisateur à haute vitesse.' },
        { id: 'cockpit_telemetry', name: 'Cockpit et télémétrie embarquée', description: 'Poste de pilotage sport alcantara avec affichage tête haute et récepteur de clé numérique.' }
      ],
      relations: [
        { type: 'on_top_of', targetId: 'demo_rotating_turntable' }
      ],
      resources: [
        { role: 'details', label: 'Fiche technique Victoria VR', url: 'https://victoriavr.com' },
        { role: 'manual', label: 'Manuel de bord et télémétrie', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' }
      ],
      capabilities: [
        { type: 'transform', position: { x: 0, y: 0.1, z: 0 } },
        { type: 'collider' },
        { type: 'educational', text: 'Véhicule de démonstration avec carrosserie sportive et interaction de personnalisation.', value: 0, active: false }
      ]
    };

    const turntable: EntitySpec = {
      id: 'demo_rotating_turntable',
      name: 'Plateau tournant motorisé de showroom avec spots LED',
      visuals: {
        assetId: 'wp-plateau-tournant',
        modelUrl: '/library/wp-plateau-tournant.glb'
      },
      capabilities: [
        { type: 'transform', position: { x: 0, y: 0, z: 0 } },
        { type: 'collider' }
      ]
    };

    const colorTerminal: EntitySpec = {
      id: 'demo_color_terminal',
      name: 'Console holographique de configuration teintes & finitions',
      visuals: {
        assetId: 'wp-borne-configurateur',
        modelUrl: '/library/wp-borne-configurateur.glb'
      },
      capabilities: [
        { type: 'transform', position: { x: -2.2, y: 0, z: 1.2 } },
        { type: 'collider' }
      ]
    };

    const smartKey: EntitySpec = {
      id: 'demo_smart_key',
      name: 'Clé intelligente holographique et badge de télémétrie',
      visuals: {
        assetId: 'wp-telecommande-sport',
        modelUrl: '/library/wp-telecommande-sport.glb'
      },
      capabilities: [
        { type: 'transform', position: { x: -1.45, y: 0.05, z: 1.45 } },
        { type: 'draggable' },
        { type: 'collider', radius: 0.25 }
      ]
    };

    const cockpitDock: EntitySpec = {
      id: 'demo_cockpit_dock',
      name: 'Récepteur de clé du cockpit central',
      visuals: {
        assetId: 'socket',
        modelUrl: '/library/socket.glb'
      },
      capabilities: [
        { type: 'transform', position: { x: 0, y: 0.6, z: 0 } },
        { type: 'collider', radius: 0.45 },
        { type: 'trigger_zone', radius: 0.70 }
      ]
    };

    const configRule: RuleSpec = {
      id: 'rule_configure_supercar',
      trigger: 'INTERACT',
      conditions: [{ type: 'is_source', sourceId: 'demo_color_terminal' }],
      actions: [
        { type: 'set_flag', flag: 'supercar_configured', value: true },
        { type: 'change_color', entityId: 'demo_supercar', color: '#dc2626' },
        { type: 'play_sound', sound: 'switch_click' },
        { type: 'show_warning', message: '🎨 Teinte Rouge Victoria Nacré appliquée avec étriers de frein dorés et pack carbone actif !' }
      ]
    };

    const startRule: RuleSpec = {
      id: 'rule_start_supercar',
      trigger: 'DROP',
      conditions: [
        { type: 'is_source', sourceId: 'demo_smart_key' },
        { type: 'is_target', targetId: 'demo_cockpit_dock' }
      ],
      actions: [
        { type: 'set_flag', flag: 'supercar_started', value: true },
        { type: 'play_sound', sound: 'fanfare' },
        { type: 'show_warning', message: '🏎️ V12 850 ch démarré ! Échappement titane actif, compte-tours numérique et certificat de propriété Victoria VR vérifié.' }
      ]
    };

    const carQuest: QuestSpec = {
      id: 'quest_supercar_showroom',
      title: 'Showroom supercar et personnalisation',
      category: 'formation',
      description: 'Showroom de démonstration : personnaliser la teinte sur le configurateur, puis insérer la clé pour démarrer le véhicule.',
      currentStepIndex: 0,
      status: 'in_progress',
      rewardSound: 'fanfare',
      steps: [
        {
          id: 'step_car_1',
          title: 'Sélectionner la teinte et finition sur le configurateur',
          description: 'Cliquez sur la borne de configuration pour choisir la livrée Rouge Victoria Nacré.',
          targetEntityId: 'demo_color_terminal',
          requiredEvent: 'INTERACT',
          hint: 'Cliquez sur le configurateur holographique.',
          completed: false
        },
        {
          id: 'step_car_2',
          title: 'Insérer la clé pour démarrer le moteur V12',
          description: 'Glissez la clé intelligente vers le cockpit de la supercar.',
          targetEntityId: 'demo_smart_key',
          targetZoneId: 'demo_cockpit_dock',
          requiredEvent: 'DROP',
          hint: 'Glissez la clé intelligente dans la voiture.',
          completed: false
        }
      ]
    };

    const supercarInvariant: Invariant = {
      id: 'INV_SUPERCAR_CONFIG_FIRST',
      description: 'Homologation Showroom : La configuration aérodynamique doit être validée avant l’allumage du groupe motopropulseur V12.',
      condition: { type: 'never_state', stateFlag: 'supercar_started', requiredFlag: 'supercar_configured' }
    };

    return {
      plan: {
        intent: 'showcase_victoria_vr_supercar',
        actions: [
          { action: 'spawn_supercar_showroom', target: 'demo_supercar' },
          { action: 'create_quest', target: 'quest_supercar_showroom' }
        ]
      },
      patch: {
        entitiesCreated: [supercar, turntable, colorTerminal, smartKey, cockpitDock],
        rulesChanged: [configRule, startRule],
        questsAdded: [carQuest],
        activeQuestId: carQuest.id,
        invariantsAdded: [supercarInvariant]
      }
    };
  }

  // 🌆 Métavers Victoria VR : Penthouse Panoramique & Galerie NFT
  if (
    (norm.includes('penthouse') || norm.includes('galerie nft') || norm.includes('appartement de luxe')) &&
    (norm.includes('victoria vr') || norm.includes('panoramique') || norm.includes('vue') || norm.includes('visite'))
  ) {
    const windowPanoramic: EntitySpec = {
      id: 'penthouse_panoramic_window',
      name: 'Grande baie vitrée panoramique sur le skyline Victoria VR',
      visuals: {
        assetId: 'wp-baie-panoramique',
        modelUrl: '/library/wp-baie-panoramique.glb'
      },
      capabilities: [
        { type: 'transform', position: { x: 0, y: 0, z: -2.5 } },
        { type: 'collider' }
      ]
    };

    const nftFrame: EntitySpec = {
      id: 'penthouse_nft_frame',
      name: 'Chevalet d’art numérique avec cadre holographique NFT',
      visuals: {
        assetId: 'wp-cadre-art-numerique',
        modelUrl: '/library/wp-cadre-art-numerique.glb'
      },
      capabilities: [
        { type: 'transform', position: { x: -1.6, y: 0, z: -0.5 } },
        { type: 'collider' },
        { type: 'educational', text: 'Œuvre d’art numérique certifiée ERC-721 Victoria Genesis : toile générative dynamique et signature d’artiste.', value: 0, active: false }
      ]
    };

    const sofa: EntitySpec = {
      id: 'penthouse_designer_sofa',
      name: 'Canapé lounge d’architecte en cuir beige et velours',
      visuals: {
        assetId: 'sofa',
        modelUrl: '/library/sofa.glb'
      },
      capabilities: [
        { type: 'transform', position: { x: 1.2, y: 0, z: 0.8 } },
        { type: 'collider' }
      ]
    };

    const atmosphereCube: EntitySpec = {
      id: 'penthouse_atmosphere_cube',
      name: 'Cube holographique de contrôle domotique et d’ambiance lumineuse',
      visuals: {
        assetId: 'wp-cube-domotique',
        modelUrl: '/library/wp-cube-domotique.glb'
      },
      capabilities: [
        { type: 'transform', position: { x: 0, y: 0.45, z: 0.8 } },
        { type: 'draggable' },
        { type: 'collider', radius: 0.25 }
      ]
    };

    const loungeZone: EntitySpec = {
      id: 'penthouse_lounge_zone',
      name: 'Socle récepteur domotique de la table basse',
      visuals: {
        assetId: 'socket',
        modelUrl: '/library/socket.glb'
      },
      capabilities: [
        { type: 'transform', position: { x: 0, y: 0.42, z: 0.8 } },
        { type: 'collider', radius: 0.45 },
        { type: 'trigger_zone', radius: 0.65 }
      ]
    };

    const inspectNftRule: RuleSpec = {
      id: 'rule_inspect_nft_art',
      trigger: 'INTERACT',
      conditions: [{ type: 'is_source', sourceId: 'penthouse_nft_frame' }],
      actions: [
        { type: 'set_flag', flag: 'nft_art_inspected', value: true },
        { type: 'play_sound', sound: 'chime' },
        { type: 'show_warning', message: '🎨 Œuvre numérique "Victoria Genesis #001" inspectée : certificat ERC-721 vérifié sur la blockchain, signature d’artiste certifiée.' }
      ]
    };

    const moodRule: RuleSpec = {
      id: 'rule_activate_penthouse_mood',
      trigger: 'DROP',
      conditions: [
        { type: 'is_source', sourceId: 'penthouse_atmosphere_cube' },
        { type: 'is_target', targetId: 'penthouse_lounge_zone' }
      ],
      actions: [
        { type: 'set_flag', flag: 'penthouse_mood_active', value: true },
        { type: 'play_sound', sound: 'fanfare' },
        { type: 'show_warning', message: '🌆 Ambiance Golden Hour activée : lueurs dorées sur le skyline, musique lounge feutrée et cheminée allumée.' }
      ]
    };

    const penthouseQuest: QuestSpec = {
      id: 'quest_penthouse_gallery',
      title: 'Victoria VR : Visite du Penthouse Panoramique & Galerie NFT',
      category: 'formation',
      description: 'Penthouse contemporain sur les toits du métavers Victoria VR : contempler l’œuvre numérique certifiée, puis activer l’ambiance lumineuse Golden Hour.',
      currentStepIndex: 0,
      status: 'in_progress',
      rewardSound: 'fanfare',
      steps: [
        {
          id: 'step_ph_1',
          title: 'Examiner l’œuvre d’art numérique NFT',
          description: 'Cliquez sur le cadre holographique pour vérifier le certificat ERC-721 de l’œuvre.',
          targetEntityId: 'penthouse_nft_frame',
          requiredEvent: 'INTERACT',
          hint: 'Cliquez sur le tableau NFT.',
          completed: false
        },
        {
          id: 'step_ph_2',
          title: 'Activer l’ambiance Golden Hour sur le socle domotique',
          description: 'Déposez le cube de contrôle sur le socle de la table basse pour illuminer le penthouse.',
          targetEntityId: 'penthouse_atmosphere_cube',
          targetZoneId: 'penthouse_lounge_zone',
          requiredEvent: 'DROP',
          hint: 'Placez le cube domotique sur le socle.',
          completed: false
        }
      ]
    };

    const penthouseInvariant: Invariant = {
      id: 'INV_PENTHOUSE_ART_FIRST',
      description: 'Curation Artistique : L’œuvre d’art numérique doit être consultée avant de régler l’ambiance lumineuse du penthouse.',
      condition: { type: 'never_state', stateFlag: 'penthouse_mood_active', requiredFlag: 'nft_art_inspected' }
    };

    return {
      plan: {
        intent: 'visit_victoria_vr_penthouse',
        actions: [
          { action: 'spawn_penthouse', target: 'penthouse_panoramic_window' },
          { action: 'create_quest', target: 'quest_penthouse_gallery' }
        ]
      },
      patch: {
        entitiesCreated: [windowPanoramic, nftFrame, sofa, atmosphereCube, loungeZone],
        rulesChanged: [inspectNftRule, moodRule],
        questsAdded: [penthouseQuest],
        activeQuestId: penthouseQuest.id,
        invariantsAdded: [penthouseInvariant]
      }
    };
  }

  // 🚀 Métavers Victoria VR : Coupole Spatiale Orbitale Zéro-G
  if (
    (norm.includes('station spatiale') || norm.includes('coupole spatiale') || norm.includes('observation de la terre') || norm.includes('orbite terrestre')) &&
    (norm.includes('zero g') || norm.includes('apesanteur') || norm.includes('victoria vr') || norm.includes('sas'))
  ) {
    const cupola: EntitySpec = {
      id: 'station_orbital_cupola',
      name: 'Coupole panoramique d’observation avec vue à 360° sur la Terre',
      visuals: {
        assetId: 'wp-coupole-spatiale',
        modelUrl: '/library/wp-coupole-spatiale.glb'
      },
      capabilities: [
        { type: 'transform', position: { x: 0, y: 0, z: -2.0 } },
        { type: 'collider' }
      ]
    };

    const telemetry: EntitySpec = {
      id: 'station_telemetry_terminal',
      name: 'Console de commande de télémétrie orbitale',
      visuals: {
        assetId: 'wp-console-spatiale',
        modelUrl: '/library/wp-console-spatiale.glb'
      },
      capabilities: [
        { type: 'transform', position: { x: -1.6, y: 0, z: 0 } },
        { type: 'collider' },
        { type: 'educational', text: 'Console spatiale : altitude orbitale 408 km, vitesse 27 600 km/h, télémétrie thermique et propulsion ionique.', value: 0, active: false }
      ]
    };

    const helmet: EntitySpec = {
      id: 'station_floating_helmet',
      name: 'Casque de combinaison extravéhiculaire EVA en apesanteur',
      visuals: {
        assetId: 'wp-casque-spatial',
        modelUrl: '/library/wp-casque-spatial.glb'
      },
      capabilities: [
        { type: 'transform', position: { x: 0.8, y: 1.1, z: 0.3 } },
        { type: 'draggable' },
        { type: 'collider', radius: 0.3 },
        { type: 'educational', text: 'Casque EVA pressurisé avec visière en or réfléchissant les radiations solaires et micro-caméra HD.', value: 0, active: false }
      ]
    };

    const airlockDock: EntitySpec = {
      id: 'station_airlock_dock',
      name: 'Sas d’arrimage et d’équilibrage de pression',
      visuals: {
        assetId: 'socket',
        modelUrl: '/library/socket.glb'
      },
      capabilities: [
        { type: 'transform', position: { x: 1.6, y: 0.85, z: 0 } },
        { type: 'collider', radius: 0.45 },
        { type: 'trigger_zone', radius: 0.65 }
      ]
    };

    const scanRule: RuleSpec = {
      id: 'rule_scan_earth_telemetry',
      trigger: 'INTERACT',
      conditions: [{ type: 'is_source', sourceId: 'station_telemetry_terminal' }],
      actions: [
        { type: 'set_flag', flag: 'telemetry_verified', value: true },
        { type: 'play_sound', sound: 'chime' },
        { type: 'show_warning', message: '🌍 Télémétrie orbitale validée : trajectoire stable à 408 km, vitesse 27 600 km/h, aurores polaires visibles.' }
      ]
    };

    const dockRule: RuleSpec = {
      id: 'rule_dock_space_helmet',
      trigger: 'DROP',
      conditions: [
        { type: 'is_source', sourceId: 'station_floating_helmet' },
        { type: 'is_target', targetId: 'station_airlock_dock' }
      ],
      actions: [
        { type: 'set_flag', flag: 'airlock_pressurized', value: true },
        { type: 'play_sound', sound: 'fanfare' },
        { type: 'show_warning', message: '🚀 Équilibrage de pression du sas effectué : étanchéité 100%, prêt pour la sortie extravéhiculaire dans le métavers Victoria VR !' }
      ]
    };

    const spaceQuest: QuestSpec = {
      id: 'quest_orbital_cupola',
      title: 'Victoria VR : Coupole Spatiale Orbitale Zéro-G',
      category: 'formation',
      description: 'Expérience immersive en orbite basse : analyser la télémétrie de la Terre depuis la console, puis arrimer le casque EVA dans le sas de décompression.',
      currentStepIndex: 0,
      status: 'in_progress',
      rewardSound: 'fanfare',
      steps: [
        {
          id: 'step_space_1',
          title: 'Consulter la télémétrie de la Terre sur la console',
          description: 'Cliquez sur la console spatiale pour vérifier les données orbitales.',
          targetEntityId: 'station_telemetry_terminal',
          requiredEvent: 'INTERACT',
          hint: 'Cliquez sur la console de télémétrie.',
          completed: false
        },
        {
          id: 'step_space_2',
          title: 'Arrimer le casque spatial dans le sas de décompression',
          description: 'Glissez le casque flottant vers le support d’arrimage du sas.',
          targetEntityId: 'station_floating_helmet',
          targetZoneId: 'station_airlock_dock',
          requiredEvent: 'DROP',
          hint: 'Arrivez le casque dans le sas.',
          completed: false
        }
      ]
    };

    const spaceInvariant: Invariant = {
      id: 'INV_SPACE_PRESSURE_CHECK',
      description: 'Sécurité Spatiale : La télémétrie orbitale doit être vérifiée avant la pressurisation et l’arrimage dans le sas.',
      condition: { type: 'never_state', stateFlag: 'airlock_pressurized', requiredFlag: 'telemetry_verified' }
    };

    return {
      plan: {
        intent: 'explore_orbital_cupola',
        actions: [
          { action: 'spawn_space_station', target: 'station_orbital_cupola' },
          { action: 'create_quest', target: 'quest_orbital_cupola' }
        ]
      },
      patch: {
        entitiesCreated: [cupola, telemetry, helmet, airlockDock],
        rulesChanged: [scanRule, dockRule],
        questsAdded: [spaceQuest],
        activeQuestId: spaceQuest.id,
        invariantsAdded: [spaceInvariant]
      }
    };
  }

  // Act 1: CREATE (Rover Maintenance Training Bay)
  if ((norm.includes('create a rover maintenance training bay') || (norm.includes('batterie') && (norm.includes('objectif') || norm.includes('formation') || norm.includes('entraîne')))) && !norm.includes('without') && !norm.includes('sans')) {
    const battery: EntitySpec = {
      id: 'Battery_B-17',
      name: 'Battery B-17',
      capabilities: [
        { type: 'transform', position: { x: -2, y: 0.5, z: 0 } },
        { type: 'draggable' },
        { type: 'collider', radius: 0.5 }
      ]
    };

    const zone: EntitySpec = {
      id: 'Maintenance_Zone_2',
      name: 'Maintenance Zone 2',
      capabilities: [
        { type: 'transform', position: { x: 2, y: 0.1, z: 0 } },
        { type: 'collider' },
        { type: 'trigger_zone', radius: 1.5 }
      ]
    };

    const completeRule: RuleSpec = {
      id: 'R_complete_training',
      trigger: 'COMPLETE_TRAINING',
      conditions: [],
      actions: [
        { type: 'set_flag', flag: 'training_completed', value: true },
        { type: 'show_warning', message: 'TRAINING COMPLETED' }
      ]
    };

    const inspectRule: RuleSpec = {
      id: 'R_inspect_battery',
      trigger: 'INSPECT',
      conditions: [],
      actions: [
        { type: 'set_flag', flag: 'battery_inspected', value: true },
        { type: 'show_warning', message: 'Battery inspected successfully.' }
      ]
    };

    const roverQuest: QuestSpec = {
      id: 'quest_rover_maintenance',
      title: 'Procédure : Maintenance de la Batterie B-17',
      category: 'formation',
      description: 'Procédure sécurisée en trois étapes : inspecter la batterie, l’installer dans la zone de maintenance, puis exécuter le diagnostic.',
      currentStepIndex: 0,
      status: 'in_progress',
      rewardSound: 'fanfare',
      steps: [
        {
          id: 'step_rover_1',
          title: 'Inspecter la batterie B-17',
          description: 'Vérifiez l’intégrité des cellules de la batterie avant toute manipulation.',
          targetEntityId: 'Battery_B-17',
          requiredEvent: 'INTERACT',
          hint: 'Cliquez sur la batterie B-17 pour l’inspecter.',
          completed: false
        },
        {
          id: 'step_rover_2',
          title: 'Installer la batterie dans la baie',
          description: 'Placez la batterie B-17 dans la Zone de Maintenance 2.',
          targetEntityId: 'Battery_B-17',
          targetZoneId: 'Maintenance_Zone_2',
          requiredEvent: 'DROP',
          hint: 'Sélectionnez la batterie, cliquez sur la zone puis double-cliquez pour déposer.',
          completed: false
        },
        {
          id: 'step_rover_3',
          title: 'Exécuter le diagnostic final',
          description: 'Lancez la séquence de diagnostic pour finaliser la maintenance.',
          requiredEvent: 'COMPLETE_TRAINING',
          hint: 'Validez la complétion de la formation.',
          completed: false
        }
      ]
    };

    return {
      plan: {
        intent: 'create_scene',
        actions: [{ action: 'create_entity', target: 'battery' }, { action: 'create_entity', target: 'zone' }]
      },
      patch: {
        entitiesCreated: [battery, zone],
        rulesChanged: [completeRule, inspectRule],
        questsAdded: [roverQuest],
        activeQuestId: 'quest_rover_maintenance'
      }
    };
  }

  if (norm.includes('if they collide') || norm.includes('if it hits') || norm.includes('if it touches')) {
    if (!context?.selectedEntityId || !context?.pointedEntityId) {
      throw new Error("Missing spatial context for collision. Please select one entity and point to the other.");
    }
    const rule: RuleSpec = {
      id: `R${uuidv4().substring(0, 4)}`,
      trigger: 'COLLISION',
      conditions: [
        { type: 'is_source', sourceId: context.selectedEntityId },
        { type: 'is_target', targetId: context.pointedEntityId }
      ],
      actions: [
        { type: 'show_warning', message: `BOOM! Physical collision detected!` }
      ]
    };
    return {
      plan: { intent: 'program_physics_behavior', actions: [{ action: 'create_rule', type: 'collision_effect' }] },
      patch: { rulesChanged: [rule] }
    };
  }

  // Act 1.5: VICTORIA VR DEMO (Showroom & Pedagogical Learning Objectives)
  if (norm.includes('showroom') || norm.includes('exposition') || norm.includes('galerie') || norm.includes('socle') || 
      (norm.includes('victoria vr') && (norm.includes('crée') || norm.includes('create'))) ||
      ((norm.includes('victoria') || norm.includes('casque')) && (norm.includes('objectif') || norm.includes('former') || norm.includes('apprentissage') || norm.includes('entraine') || norm.includes('entraîne')))) {
    const socle: EntitySpec = {
      id: 'Socle_Lave',
      name: 'Socle d\'exposition Lave',
      capabilities: [
        { type: 'transform', position: { x: 0, y: 0.4, z: 0 }, scale: { x: 2.2, y: 0.8, z: 2.2 } },
        { type: 'collider', radius: 1.1 }
      ],
      visuals: {
        shape: 'box',
        textureUrl: '/textures/lava.jpg'
      }
    };

    const helmet: EntitySpec = {
      id: 'Casque_Victoria_VR',
      name: 'Casque Victoria VR Alpha',
      capabilities: [
        { type: 'transform', position: { x: 0, y: 1.15, z: 0 } },
        { type: 'draggable' },
        { type: 'collider', radius: 0.5 }
      ],
      visuals: {
        modelUrl: '/3d-objects/helmet.glb'
      }
    };

    const candle: EntitySpec = {
      id: 'Bougie_Showroom',
      name: 'Bougie Mystique',
      capabilities: [
        { type: 'transform', position: { x: 0.65, y: 0.82, z: 0.35 }, scale: { x: 0.8, y: 0.8, z: 0.8 } },
        { type: 'collider', radius: 0.3 }
      ],
      visuals: {
        modelUrl: '/3d-objects/candle-big.glb'
      }
    };

    const transactionZone: EntitySpec = {
      id: 'Zone_Transaction_Web3',
      name: 'Zone de Transaction Victoria VR',
      capabilities: [
        { type: 'transform', position: { x: 0, y: 0.05, z: 2.3 }, scale: { x: 2.4, y: 0.08, z: 2.0 } },
        { type: 'trigger_zone', radius: 1.3 },
        { type: 'collider', radius: 1.3 }
      ],
      visuals: {
        shape: 'box',
        color: '#0055ff'
      }
    };

    const isLearningObjective = norm.includes('objectif') || norm.includes('former') || norm.includes('apprentissage') || norm.includes('entraine') || norm.includes('entraîne');

    const rulesChanged: RuleSpec[] = [];
    const invariantsAdded: Invariant[] = [];

    if (isLearningObjective) {
      rulesChanged.push({
        id: 'Rule_Mint_Victoria_VR',
        trigger: 'DROP',
        conditions: [
          { type: 'is_source', sourceId: 'Casque_Victoria_VR' },
          { type: 'is_target', targetId: 'Zone_Transaction_Web3' }
        ],
        actions: [
          { type: 'play_sound', sound: 'chime' },
          { 
            type: 'mint_nft', 
            nftName: 'Casque Victoria VR Prototype #042', 
            token: 'VR',
            contractAddress: '0x38B21F77eE2f2B3e7c85D7e31AA89d8B66C5a90F'
          },
          { 
            type: 'show_warning', 
            message: '🎓 Objectif Pédagogique Atteint : Casque inspecté et déposé ! Certification Web3 mintée.' 
          }
        ]
      });

      invariantsAdded.push({
        id: 'INV_ANTI_FRAUD_PEDESTAL',
        description: 'Sécurité Formelle Pédagogique: La transaction ne peut être validée sans que le casque soit d\'abord certifié sur le socle.',
        condition: { type: 'never_state', stateFlag: 'transaction_completed', requiredFlag: 'helmet_on_pedestal' }
      });
    }

    return {
      plan: {
        intent: isLearningObjective ? 'synthesize_pedagogical_curriculum' : 'create_victoria_vr_showroom',
        actions: [
          { action: 'create_entity', target: 'Socle_Lave' },
          { action: 'create_entity', target: 'Casque_Victoria_VR' },
          { action: 'create_entity', target: 'Bougie_Showroom' },
          { action: 'create_entity', target: 'Zone_Transaction_Web3' },
          ...(isLearningObjective ? [{ action: 'synthesize_rules_and_invariants', target: 'anti_fraud_protocol' }] : [])
        ]
      },
      patch: {
        entitiesCreated: [socle, helmet, candle, transactionZone],
        rulesChanged,
        invariantsAdded
      }
    };
  }

  // Act 2.5: VICTORIA VR WEB3 CAUSALITY (Drop Helmet in Zone -> Mint NFT)
  if (norm.includes('mint') || (norm.includes('casque') && norm.includes('zone')) || (norm.includes('touche la zone') && norm.includes('chime')) || (norm.includes('transaction') && norm.includes('nft'))) {
    const helmetId = Object.values(entities).find(e => (e.name || '').toLowerCase().includes('casque') || (e.name || '').toLowerCase().includes('helmet'))?.id || context.selectedEntityId || 'Casque_Victoria_VR';
    const zoneId = Object.values(entities).find(e => (e.name || '').toLowerCase().includes('zone') || (e.name || '').toLowerCase().includes('transaction'))?.id || context.pointedEntityId || 'Zone_Transaction_Web3';

    const rule: RuleSpec = {
      id: 'Rule_Mint_Victoria_VR',
      trigger: 'DROP',
      conditions: [
        { type: 'is_source', sourceId: helmetId },
        { type: 'is_target', targetId: zoneId }
      ],
      actions: [
        { type: 'play_sound', sound: 'chime' },
        { 
          type: 'mint_nft', 
          nftName: 'Casque Victoria VR Prototype #042', 
          token: 'VR',
          contractAddress: '0x38B21F77eE2f2B3e7c85D7e31AA89d8B66C5a90F'
        },
        { 
          type: 'show_warning', 
          message: '💎 SMART CONTRACT TRIGGER: Le Casque Victoria VR a touché la Zone de Transaction ! Mint NFT L1 validé.' 
        }
      ]
    };

    return {
      plan: {
        intent: 'program_web3_causality',
        actions: [{ action: 'create_rule', type: 'web3_mint_on_drop' }]
      },
      patch: {
        rulesChanged: [rule]
      }
    };
  }

  // Act 3.5: VICTORIA VR INVARIANT (Anti-Fraud Formally Verified Security)
  if (norm.includes('sans poser le casque') || (norm.includes('valider la transaction') && norm.includes('socle')) || norm.includes('personne ne peut valider') || norm.includes('anti-fraude')) {
    const invariant: Invariant = {
      id: 'INV_ANTI_FRAUD_PEDESTAL',
      description: 'Sécurité Formelle: La transaction Web3 ne peut être validée sans que le Casque Victoria VR soit posé sur le socle d\'exposition.',
      condition: { type: 'never_state', stateFlag: 'transaction_completed', requiredFlag: 'helmet_on_pedestal' }
    };
    return {
      plan: { intent: 'verify_web3_invariant', actions: [{ action: 'add_invariant' }] },
      patch: { invariantsAdded: [invariant] }
    };
  }
  
  if (norm.includes('retirer la batterie') || norm.includes('supprimer la batterie')) {
      const batteryId = Object.values(entities).find(e => e.name.toLowerCase().includes('battery'))?.id;
      if (batteryId) {
          return {
              plan: { intent: 'remove_entity', actions: [{ action: 'remove', target: batteryId }] },
              patch: { entitiesRemoved: [batteryId] }
          };
      }
  }

  // Act 2: PROGRAM (DROP)
  if (
    (norm.includes('if i put this here') && norm.includes('trigger a warning')) ||
    (normClean.includes('si je pose ca ici') && (normClean.includes('alerte') || normClean.includes('avertissement') || normClean.includes('reinitialise') || normClean.includes('réinitialise')))
  ) {
    const resolvedSelectedId =
      context?.selectedEntityId ||
      Object.values(entities).find(e => e.capabilities?.some(c => c.type === 'draggable'))?.id ||
      (entities['car_battery_new'] ? 'car_battery_new' : null) ||
      (entities['generator_portable_1'] ? 'generator_portable_1' : null) ||
      Object.keys(entities).find(k => k.includes('battery') || k.includes('generat')) ||
      Object.keys(entities)[0] ||
      'car_battery_new';
    const resolvedPointedId =
      context?.pointedEntityId ||
      Object.values(entities).find(e => e.capabilities?.some(c => c.type === 'trigger_zone'))?.id ||
      (entities['battery_tray_zone'] ? 'battery_tray_zone' : null) ||
      Object.keys(entities).find(k => k.includes('tray') || k.includes('zone')) ||
      'battery_tray_zone';

    const isFrench = normClean.includes('si je pose') || normClean.includes('alerte');
    const rule: RuleSpec = {
      id: 'rule_alert_and_reset',
      trigger: 'DROP',
      conditions: [
        { type: 'is_source', sourceId: resolvedSelectedId },
        { type: 'is_target', targetId: resolvedPointedId }
      ],
      actions: [
        {
          type: 'show_warning',
          message: isFrench
            ? '⚠️ EMPLACEMENT INCORRECT : La batterie doit être inspectée avant d’être posée !'
            : 'INCORRECT PLACEMENT: Battery must be inspected first!'
        },
        { type: 'reset_position', entityId: resolvedSelectedId, position: { x: -2, y: 0.5, z: 0 } } // Mock original pos
      ]
    };

    return {
      plan: {
        intent: 'program_behavior',
        actions: [{ action: 'create_rule', type: 'collision_warning' }]
      },
      patch: {
        rulesChanged: [rule]
      }
    };
  }

  // Act 3: VERIFY (Invariant)
  if (
    norm.includes('nobody should ever complete this training without inspecting the battery') ||
    ((normClean.includes('nobody') || normClean.includes('no one') || normClean.includes('no-one')) && (normClean.includes('without inspecting') || normClean.includes('inspect the battery') || normClean.includes('inspecting the battery'))) ||
    (normClean.includes('personne ne doit') && normClean.includes('sans inspecter la batterie'))
  ) {
    const isCarScene = !!(
      entities['car_sedan_1'] ||
      entities['car_battery_new'] ||
      entities['battery_tray_zone'] ||
      Object.keys(entities).some(k => k.includes('generateur') || k.includes('car_'))
    );
    const invId = isCarScene ? 'INV_CAR_BATTERY_INSPECT_FIRST' : `INV${uuidv4().substring(0, 4)}`;
    const invariant: Invariant = {
      id: invId,
      description: isCarScene
        ? 'Sécurité Électrique : La batterie automobile doit être inspectée avant d’être raccordée au circuit du véhicule.'
        : 'Training cannot be completed without battery inspection',
      condition: {
        type: 'never_state',
        stateFlag: isCarScene ? 'car_running' : 'training_completed',
        requiredFlag: 'battery_inspected'
      }
    };
    return {
      plan: { intent: 'verify_invariant', actions: [{ action: 'add_invariant' }] },
      patch: { invariantsAdded: [invariant] }
    };
  }

  // Act 4: BREAK IT
  if (
    norm.includes('try to break it') ||
    norm.includes('try to break this experience') ||
    normClean.includes('essaie de casser') ||
    normClean.includes('tente de casser')
  ) {
    return {
      plan: { intent: 'simulate_counterexample', actions: [{ action: 'run_simulation' }] },
      patch: {} // Simulation doesn't patch directly, it runs side effect in UI
    };
  }

  return {
    plan: { intent: 'unknown', actions: [] },
    patch: {}
  };
}

export async function parseInstructionAsync(
  instruction: string, 
  context: { selectedEntityId: string | null, pointedEntityId: string | null },
  entities: Record<string, EntitySpec>,
  existingQuestIds: string[] = [],
  options?: { preferLocalRules?: boolean }
): Promise<ParsedInstruction> {
  const normClean = normalize((instruction || '').trim());

  // RÈGLE D'OR ARCHITECTURALE : LLM-FIRST EN CONCEPTION SPATIALE.
  // Aucun scénario pré-fabriqué (recettes, démonstrations, ateliers certifiés, etc.)
  // ne doit court-circuiter le LLM ! Seuls les contrôles d'interface immédiats (vider, mute, playtest)
  // ou un flag explicite de test unitaire (preferLocalRules) sont résolus localement.
  const isDeterministicSystemCommand = /^(vider|vide|effacer|reinitialiser|reset|clear|aide|help|mute|couper le son|reactiver le son|unmute|playtest|audit blast radius|check local readiness|run local readiness|local scene readiness|verifier la preparation locale|controle local de la scene|exporte lerobot|export lerobot|try to break|essaie de casser)/i.test(normClean);

  const localCandidate = parseInstruction(instruction, context, entities);
  const isSystemOrObservabilityCommand =
    localCandidate.plan.intent === 'reset_world' ||
    localCandidate.plan.intent === 'audit_blast_radius' ||
    localCandidate.plan.intent === 'open_edit_order_lab' ||
    localCandidate.plan.intent === 'open_publish_readiness_gate' ||
    localCandidate.plan.intent === 'run_synthetic_playtester' ||
    localCandidate.plan.intent === 'export_lerobot_dataset' ||
    localCandidate.plan.intent === 'simulate_counterexample' ||
    localCandidate.plan.intent === 'verify_invariant' ||
    localCandidate.plan.intent === 'fix_invariant' ||
    localCandidate.plan.intent === 'program_behavior' ||
    localCandidate.plan.intent === 'teach_car_battery_replacement' ||
    localCandidate.plan.intent === 'replace_entity_preserving_transform' ||
    localCandidate.plan.intent === 'simulate_spatial_conflict' ||
    localCandidate.plan.intent === 'pareto_auto_heal' ||
    localCandidate.plan.intent === 'load_demonstration';
  const isSpatialInstruction =
    localCandidate.plan.intent === 'translate_entity' ||
    localCandidate.plan.intent === 'preset_entity_position' ||
    localCandidate.plan.intent === 'rotate_entity' ||
    localCandidate.plan.intent === 'position_spatial_avatar';

  // RÈGLE D'OR ARCHITECTURALE : LLM-FIRST EN CONCEPTION SPATIALE.
  // Aucun scénario pré-fabriqué (recettes, démonstrations, ateliers certifiés, scènes de cueillette)
  // ne doit court-circuiter le LLM ! Seuls les contrôles système/observabilité immédiats, les instructions
  // spatiales déterministes (déplacements/rotations millimétrés) ou un flag explicite
  // de test unitaire (preferLocalRules) sont résolus localement.
  const shouldPreferLocal = Boolean(options?.preferLocalRules) || isDeterministicSystemCommand || isSystemOrObservabilityCommand || isSpatialInstruction;

  if (shouldPreferLocal) {
    if (localCandidate.plan.intent !== 'unknown') {
      return { ...localCandidate, source: 'local_rules' };
    }
  }

  // The LLM is the primary interpreter for all user instructions
  try {
    const { generatePatchFromLLM, hasLLMKey } = await import('./llm');
    if (hasLLMKey()) {
      const llmResult = await generatePatchFromLLM(instruction, context, entities, existingQuestIds);
      if (llmResult) {
        return { ...llmResult, source: 'llm' };
      }
    }
  } catch (e) {
    console.error("LLM Generation failed:", e);
  }

  // Fallback to local rules only if no LLM key is configured or LLM is offline
  const mockResult = parseInstruction(instruction, context, entities);
  if (mockResult.plan.intent !== 'unknown') {
    return { ...mockResult, source: 'local_rules' };
  }

  return {
    ...mockResult,
    source: 'unresolved',
    notice: 'Le modèle de langage n’a pas pu interpréter cette consigne et aucun changement n’a été appliqué.'
  };
}

/** The public edition exposes the hands-on model pack only. */
export function parseInstruction(...args:Parameters<typeof parseInstructionImpl>):ReturnType<typeof parseInstructionImpl>{
 const result=parseInstructionImpl(...args);
 const available=new Set(fullCatalog.map(a=>a.id));
 const supportedDetailed=new Set(['table','wp-voiture','wp-batterie-automobile','wp-generateur-secours','wp-generateur','wp-sac-voyageur-42l','wp-gourde-isotherme','wp-carton-oversized']);
 const missing=[...(result.patch.entitiesCreated||[]),...(result.patch.entitiesChanged||[])].some(e=>{const id=e.visuals?.assetId;const url=e.visuals?.modelUrl;return !!id&&!available.has(resolveCanonicalAssetId(id)||id)&&!supportedDetailed.has(id)||!!url?.startsWith('/3d-objects/')||!!url?.startsWith('/library/')&&!available.has(url.split('/').pop()!.replace(/\.glb$/i,''))&&!supportedDetailed.has(url.split('/').pop()!.replace(/\.glb$/i,''));});
 if(missing)return {plan:{intent:'unavailable_public_model',actions:[],clarification:{needed:true,question:'This scenario uses models outside the public hands-on pack.'}},patch:{}};
 return result;
}
