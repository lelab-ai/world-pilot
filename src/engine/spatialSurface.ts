import type { EntitySpec } from '../core/types';
import { getAsset } from '../library/catalog';

export interface SurfaceResult {
  surfaceY: number;
  supportEntity: EntitySpec | null;
  isGround: boolean;
  surfaceName: string;
}

/**
 * Détermine si une entité est un meuble ou une structure reposant directement au sol
 * (table, îlot, comptoir, bureau, établi, banc, présentoir, estrade, etc.).
 * Une entité de sol doit toujours avoir sa base à y = 0 et ne peut jamais être posée
 * sur des ingrédients, des ustensiles, une planche à découper ou un autre meuble.
 */
export function isFloorFurniture(entity: EntitySpec): boolean {
  // 0. Si un assetId du catalogue est disponible, utiliser en priorité ses métadonnées sémantiques formelles
  if (entity.visuals?.assetId) {
    const asset = getAsset(entity.visuals.assetId) as any;
    if (asset) {
      if (asset.role === 'prop') return false;
      if (asset.role === 'floor_furniture') return true;
      if (asset.role === 'support') {
        if (asset.id === 'wp-podium-vip') return false;
        if (asset.size && asset.size[1] >= 0.5) return true;
        return false;
      }
    }
  }

  const name = (entity.name || '').toLowerCase();
  const assetId = (entity.visuals?.assetId || '').toLowerCase();
  const id = (entity.id || '').toLowerCase();

  // 1. Exclure formellement tout ingrédient, aliment, condiment, boisson
  const isIngredientOrFood = 
    assetId.includes('tomate') || name.includes('tomate') || id.includes('tomate') ||
    assetId.includes('courgette') || name.includes('courgette') || id.includes('courgette') ||
    assetId.includes('carotte') || name.includes('carotte') || id.includes('carotte') ||
    assetId.includes('oignon') || name.includes('oignon') || id.includes('oignon') ||
    assetId.includes('ail') || name.includes('ail') || id.includes('ail') ||
    assetId.includes('huile') || name.includes('huile') || id.includes('huile') ||
    assetId.includes('sel') || name.includes('sel') || id.includes('sel') || id.includes('saliere') ||
    assetId.includes('poivre') || name.includes('poivre') || id.includes('poivriere') ||
    assetId.includes('beurre') || name.includes('beurre') || id.includes('beurre') ||
    assetId.includes('fromage') || name.includes('fromage') ||
    assetId.includes('pain') || name.includes('pain') || name.includes('baguette') || name.includes('croissant') ||
    assetId.includes('viande') || name.includes('viande') || assetId.includes('boeuf') || name.includes('boeuf') ||
    assetId.includes('poulet') || name.includes('poulet') || assetId.includes('saumon') || name.includes('saumon') ||
    assetId.includes('chocolat') || name.includes('chocolat') ||
    assetId.includes('farine') || name.includes('farine') || assetId.includes('sucre') || name.includes('sucre') ||
    assetId.includes('lait') || name.includes('lait') || assetId.includes('creme') || name.includes('crème') ||
    assetId.includes('oeuf') || name.includes('oeuf') || name.includes('œuf') ||
    assetId.includes('vin') || name.includes('vin') || assetId.includes('bouteille') || name.includes('bouteille') ||
    assetId.includes('bouquet') || name.includes('bouquet') || name.includes('herbe') ||
    assetId.includes('pomme') || name.includes('pomme') || assetId.includes('echalote') || name.includes('échalote') || name.includes('echalote');

  if (isIngredientOrFood) {
    return false;
  }

  // 2. Exclure les ustensiles, petits contenants et accessoires posés sur meubles
  if (
    assetId === 'wp-podium-vip' ||
    id.includes('vip-inspection-podium') ||
    id.includes('lv_inspection_podium') ||
    id.includes('inspection_podium') ||
    name.includes('podium d’inspection') ||
    name.includes("podium d'inspection") ||
    name.includes('podium vip') ||
    name.includes('couteau') || id.includes('couteau') ||
    name.includes('fourchette') || id.includes('fourchette') ||
    name.includes('cuillere') || name.includes('cuillère') || id.includes('cuillere') ||
    name.includes('louche') || id.includes('louche') ||
    name.includes('spatule') || id.includes('spatule') ||
    name.includes('fouet') || id.includes('fouet') ||
    name.includes('bougeoir') || name.includes('bougie') ||
    name.includes('assiette') || id.includes('assiette') || assetId.includes('assiette') ||
    name.includes('planche') || id.includes('planche') || assetId.includes('planche') ||
    name.includes('cocotte') || id.includes('cocotte') || assetId.includes('cocotte') ||
    name.includes('poele') || name.includes('poêle') || id.includes('poele') || assetId.includes('poele') ||
    name.includes('marmite') || id.includes('marmite') || assetId.includes('marmite') ||
    name.includes('saladier') || id.includes('saladier') || assetId.includes('saladier') ||
    name.includes('casserole') || id.includes('casserole') || assetId.includes('casserole') ||
    name.includes('plat') || id.includes('plat') || assetId.includes('plat') ||
    name.includes('livre') || id.includes('book') || assetId.includes('book') ||
    name.includes('laptop') || id.includes('laptop') || assetId.includes('laptop') ||
    name.includes('gourde') || id.includes('gourde') || assetId.includes('gourde') ||
    name.includes('carton') || id.includes('carton') || assetId.includes('carton') ||
    name.includes('sac') || id.includes('sac') || assetId.includes('sac') ||
    name.includes('clé') || name.includes('cle') || id.includes('smart_key') || id.includes('cle_intelligente') ||
    name.includes('télécommande') || name.includes('telecommande') ||
    name.includes('bouton') || id.includes('start_stop') || id.includes('bouton_start') ||
    name.includes('cockpit') || name.includes('récepteur') || name.includes('recepteur') ||
    id.includes('cockpit') || id.includes('dock') || id.includes('authentification') ||
    name.includes('batterie') || id.includes('battery') || assetId.includes('batterie') ||
    name.includes('générateur') || name.includes('generateur') || id.includes('generator') || assetId.includes('generateur')
  ) {
    return false;
  }

  return Boolean(
    assetId === 'wp-ilot-de-cuisine' || assetId.includes('ilot') || id.includes('ilot') || name.startsWith('îlot') || name.startsWith('ilot') || name.includes('îlot de cuisine') || name.includes('ilot de cuisine') ||
    assetId === 'counter' || assetId.includes('counter') || id.includes('counter') || id.includes('comptoir') || name.includes('comptoir') || (name.includes('counter') && !name.includes('encounter')) ||
    assetId.includes('table') || id.includes('table') || (name.includes('table') && !name.includes('tablette')) ||
    assetId.includes('desk') || id.includes('desk') || id.includes('bureau') || name.includes('bureau') || name.includes('desk') ||
    assetId.includes('bench') || id.includes('bench') || id.includes('etabli') || name.includes('etabli') || name.includes('établi') || name.includes('bench') ||
    assetId.includes('presentoir') || id.includes('presentoir') || name.includes('présentoir') || name.includes('presentoir') ||
    assetId.includes('vitrine') || id.includes('vitrine') || id.includes('showcase') || name.includes('vitrine') ||
    ((assetId.includes('podium') || id.includes('podium') || name.includes('podium')) && !assetId.includes('vip') && !id.includes('vip') && !name.includes('vip')) ||
    assetId.includes('estrade') || id.includes('estrade') || name.includes('estrade') ||
    assetId.includes('socle') || id.includes('socle') || name.includes('socle') ||
    assetId.includes('turntable') || id.includes('turntable') || name.includes('plateau tournant') ||
    assetId.includes('pastry_table') || assetId.includes('plan-patisserie') || name.includes('plan de travail') ||
    assetId.includes('chaise') || assetId.includes('chair') || name.includes('chaise') || name.includes('chair') ||
    assetId.includes('sofa') || name.includes('canapé') || name.includes('sofa') ||
    assetId.includes('etagere') || name.includes('étagère') || name.includes('etagere') || assetId.includes('shelf') ||
    assetId === 'wp-supercar-showroom' || assetId === 'wp-voiture-automobile' || name.includes('supercar') || (name.includes('voiture') && !name.includes('miniature')) || (name.includes('automobile') && !name.includes('batterie') && !name.includes('miniature')) || (name.includes('véhicule') && !name.includes('miniature')) || (name.includes('vehicule') && !name.includes('miniature')) ||
    assetId.includes('voilier') || name.includes('voilier') || (name.includes('bateau') && !name.includes('papier')) ||
    assetId === 'wp-borne-configurateur' || name.includes('configurateur') || name.includes('console holographique') || (name.includes('borne') && (name.includes('teinte') || name.includes('supercar') || name.includes('couleur') || name.includes('interactive'))) ||
    assetId === 'wp-four-patisserie' || name.includes('four à pâtisserie') || name.includes('four encastrable') ||
    id.startsWith('pedagogical_bench')
  );
}

/**
 * Détermine si une entité est un élément statique, ancré ou structurel (sol, terrain, mur, architecture, arbre enraciné, etc.)
 * qui doit être strictement non déplaçable.
 */
export function isStaticOrStructuralEntity(entity: EntitySpec): boolean {
  if (!entity) return false;
  if (entity.capabilities?.some(c => c.type === 'static' || (c as any).isStatic || (c as any).locked === true || c.type === 'fixed')) {
    return true;
  }
  if (entity.visuals?.assetId) {
    const asset = getAsset(entity.visuals.assetId) as any;
    if (asset?.role === 'static') return true;
  }
  const id = (entity.id || '').toLowerCase();
  const name = (entity.name || '').toLowerCase();
  const assetId = (entity.visuals?.assetId || '').toLowerCase();

  // Sols, terrains, planchers (exclure console, parasol, tournesol, boussole, "tombé au sol", "posé au sol", "tapis de sol")
  const isFalsePositiveSol =
    name.includes('console') || id.includes('console') || assetId.includes('console') ||
    name.includes('parasol') || id.includes('parasol') || assetId.includes('parasol') ||
    name.includes('tournesol') || id.includes('tournesol') || assetId.includes('tournesol') ||
    name.includes('boussole') || id.includes('boussole') || assetId.includes('boussole') ||
    name.includes('au sol') || name.includes('du sol') || name.includes('sur le sol') ||
    name.includes('tapis') || name.includes('coussin');

  if (
    !isFalsePositiveSol && (
      id === 'ground' || id === 'floor' || id === 'ceiling' || id === 'plafond' || id === 'sol' ||
      id.startsWith('sol_') || id.startsWith('sol-') || id.endsWith('_sol') || id.endsWith('-sol') ||
      id.startsWith('ground_') || id.endsWith('_ground') || id.startsWith('floor_') || id.endsWith('_floor') ||
      assetId === 'wp-sol-forestier' || assetId.includes('ground') || assetId.includes('floor') ||
      id.includes('terrain') || name.startsWith('terrain') ||
      name.startsWith('sol ') || name === 'sol' ||
      name.includes('sol forestier') || name.includes('sol en pierre') || name.includes('sol parquet') ||
      name.startsWith('plancher') || name.startsWith('dalle de sol')
    )
  ) {
    return true;
  }

  // Murs, cloisons, plafonds, architecture fixe
  if (
    id.startsWith('mur') || id.endsWith('mur') || id.includes('_mur_') || id.includes('-mur-') || id === 'mur' ||
    id.includes('wall') || name.startsWith('mur') || name.endsWith('mur') || name.includes(' mur ') || name === 'mur' ||
    assetId.includes('wall') || assetId.includes('mur') ||
    name.includes('cloison') || name.includes('baie vitrée') || name.includes('baie panoramique') || name.includes('coupole')
  ) {
    return true;
  }

  // Arbres enracinés, rochers massifs, éléments naturels fixes, troncs massifs
  // (exclure les meubles/planches "en chêne", "en sapin", etc.)
  const isWoodFurnitureOrProp =
    name.includes('table') || name.includes('bureau') || name.includes('comptoir') ||
    name.includes('îlot') || name.includes('ilot') || name.includes('planche') ||
    name.includes('étagère') || name.includes('etagere') || name.includes('chaise') ||
    name.includes('banc') || name.includes('établi') || name.includes('etabli') ||
    name.includes('tonneau') || name.includes('coffre') || name.includes('en chêne') || name.includes('en chene');

  if (
    !isWoodFurnitureOrProp && (
      id.includes('arbre') || name.includes('arbre') || assetId.includes('arbre') ||
      name.includes('chêne') || name.includes('chene') || id.includes('chene') || assetId.includes('chene') ||
      name.includes('sapin') || name.includes('bouleau') ||
      name.includes('rocher') || id.includes('rocher') || assetId.includes('rocher') || name.includes('falaise') ||
      name.includes('tronc') || id.includes('tronc') || assetId.includes('tronc')
    )
  ) {
    return true;
  }

  return false;
}

/**
 * Détermine si une entité est un support d'accueil physique (table, bureau, comptoir, planche, etc.).
 */
export function isSupportEntity(entity: EntitySpec): boolean {
  if (!entity) return false;

  // 0. Si un assetId du catalogue est disponible, utiliser en priorité ses métadonnées sémantiques formelles
  if (entity.visuals?.assetId) {
    const asset = getAsset(entity.visuals.assetId) as any;
    if (asset) {
      if (asset.role === 'support') return true;
      if (asset.role === 'prop') return false;
      if (asset.role === 'static') return false;
      if (asset.role === 'floor_furniture') {
        const aId = asset.id;
        if (['workbench', 'meeting-table', 'counter', 'pedestal', 'wp-ilot-de-cuisine', 'wp-plan-patisserie', 'wp-console-level-design', 'wp-plateau-tournant'].includes(aId)) {
          return true;
        }
        if (asset.category === 'Réunions' && aId.includes('table')) return true;
        return false;
      }
    }
  }

  const name = (entity.name || '').toLowerCase();
  const assetId = (entity.visuals?.assetId || '').toLowerCase();
  const id = (entity.id || '').toLowerCase();

  // Les sols, murs, arbres, véhicules, bateaux, bornes/consoles verticales, fours encastrés, chaises et canapés
  // reposent au sol mais ne sont pas des tables d'accueil horizontales pour poser des accessoires.
  if (
    (!name.includes('console') && !id.includes('console') && !assetId.includes('console') && !name.includes('au sol') && !name.includes('du sol') && (
      id === 'ground' || id === 'floor' || id.startsWith('sol_') || id.endsWith('_sol') || id === 'sol' ||
      name.startsWith('sol ') || name === 'sol' || name.startsWith('plancher') || name.startsWith('dalle de sol')
    )) ||
    id.startsWith('mur') || id.includes('wall') || name.startsWith('mur') ||
    assetId === 'wp-supercar-showroom' || name.includes('supercar') || name.includes('voiture') || name.includes('véhicule') || name.includes('vehicule') ||
    assetId.includes('voilier') || name.includes('voilier') || name.includes('bateau') ||
    assetId === 'wp-borne-configurateur' || name.includes('configurateur') || name.includes('console holographique') || (name.includes('borne') && (name.includes('teinte') || name.includes('supercar') || name.includes('couleur') || name.includes('interactive'))) ||
    assetId === 'wp-four-patisserie' || name.includes('four à pâtisserie') || name.includes('four encastrable') ||
    assetId.includes('chaise') || assetId.includes('chair') || name.includes('chaise') || name.includes('chair') ||
    assetId.includes('sofa') || name.includes('canapé') || name.includes('sofa')
  ) {
    return false;
  }

  if (isFloorFurniture(entity)) return true;

  // Exclude food, utensils, devices that might contain 'four' (fourchette), 'table' (couteau de table, sel de table), etc.
  if (
    name.includes('fourchette') || id.includes('fourchette') ||
    name.includes('couteau') || id.includes('couteau') ||
    name.includes('cuillere') || name.includes('cuillère') ||
    name.includes('beurre') || id.includes('beurre') ||
    name.includes('carotte') || id.includes('carotte') ||
    name.includes('sel de table') || id.includes('saliere') ||
    name.includes('plateau de fromages') || id.includes('plateau-de-fromages') ||
    name.includes('bougeoir')
  ) {
    return false;
  }

  return Boolean(
    assetId === 'wp-podium-vip' || id.includes('vip-inspection-podium') || name.includes('podium vip') ||
    name.includes('planche') || assetId.includes('planche') || id.includes('planche') ||
    name.includes('assiette') || assetId.includes('assiette') || id.includes('assiette') ||
    (name.includes('plateau') && !name.includes('fromage')) || (assetId.includes('plateau') && !assetId.includes('fromage')) ||
    name.includes('cocotte') || assetId.includes('cocotte') || id.includes('cocotte') ||
    name.includes('poele') || name.includes('poêle') || assetId.includes('poele') || id.includes('poele') ||
    name.includes('marmite') || assetId.includes('marmite') ||
    name.includes('saladier') || assetId.includes('saladier')
  );
}

/**
 * Calculates the exact supporting surface altitude beneath coordinate (x, z).
 * Inspects all furniture, tables, counters, desks, workbenches, podiums, and sub-supports (cutting boards, plates, pots).
 */
export function getSupportingSurfaceHeight(
  x: number,
  z: number,
  entities: Record<string, EntitySpec> | EntitySpec[],
  excludeEntityId?: string
): SurfaceResult {
  const allEntities = Array.isArray(entities) ? entities : Object.values(entities);

  // Si l'entité interrogée est un meuble de sol ou un élément structurel, sa surface de pose naturelle est STRICTEMENT le sol (y = 0)
  if (excludeEntityId) {
    const queryEntity = allEntities.find(e => e.id === excludeEntityId);
    if (queryEntity && (isFloorFurniture(queryEntity) || isStaticOrStructuralEntity(queryEntity))) {
      return {
        surfaceY: 0,
        supportEntity: null,
        isGround: true,
        surfaceName: 'Sol'
      };
    }
  }

  let highestSurfaceY = 0;
  let highestSupport: EntitySpec | null = null;

  for (const entity of allEntities) {
    if (excludeEntityId && entity.id === excludeEntityId) continue;
    if (!isSupportEntity(entity)) continue;

    const tCap = entity.capabilities.find(c => c.type === 'transform');
    const tPosRaw = tCap?.position;
    if (!tPosRaw) continue;
    const tPos = Array.isArray(tPosRaw)
      ? { x: typeof tPosRaw[0] === 'number' && !isNaN(tPosRaw[0]) ? tPosRaw[0] : 0, y: typeof tPosRaw[1] === 'number' && !isNaN(tPosRaw[1]) ? tPosRaw[1] : 0, z: typeof tPosRaw[2] === 'number' && !isNaN(tPosRaw[2]) ? tPosRaw[2] : 0 }
      : { x: typeof tPosRaw.x === 'number' && !isNaN(tPosRaw.x) ? tPosRaw.x : 0, y: typeof tPosRaw.y === 'number' && !isNaN(tPosRaw.y) ? tPosRaw.y : 0, z: typeof tPosRaw.z === 'number' && !isNaN(tPosRaw.z) ? tPosRaw.z : 0 };

    const name = (entity.name || '').toLowerCase();
    const assetId = (entity.visuals?.assetId || '').toLowerCase();
    const id = entity.id.toLowerCase();

    const isBoard = name.includes('planche') || assetId.includes('planche') || id.includes('planche');
    const isPlate = name.includes('assiette') || assetId.includes('assiette') || id.includes('assiette') || (name.includes('plateau') && !name.includes('tournant'));
    const isCocotte = name.includes('cocotte') || assetId.includes('cocotte') || id.includes('cocotte');
    const isPoele = name.includes('poele') || name.includes('poêle') || assetId.includes('poele') || id.includes('poele') || name.includes('marmite');
    const isVipPodium = assetId === 'wp-podium-vip' || id.includes('vip-inspection-podium') || name.includes('podium vip');
    const isSubSupport = isBoard || isPlate || isCocotte || isPoele || isVipPodium;

    const isPodium = (name.includes('podium') && !name.includes('vip')) || (assetId.includes('podium') && assetId !== 'wp-podium-vip') || name.includes('estrade') || name.includes('socle') || assetId.includes('turntable') || name.includes('plateau tournant');
    const isIsland = assetId.includes('ilot') || name.includes('ilot') || name.includes('îlot') || id.includes('ilot');
    const isCounter = assetId.includes('counter') || name.includes('comptoir') || name.includes('counter') || id.includes('comptoir') || id.includes('counter') || assetId.includes('presentoir') || name.includes('présentoir') || name.includes('plan-patisserie');
    const isWorkbench = assetId.includes('workbench') || assetId.includes('etabli') || name.includes('etabli') || name.includes('établi') || name.includes('bench') || id.includes('technical-bench');
    const isStove = name.includes('four') || name.includes('induction') || name.includes('cuisiniere') || assetId.includes('stove') || assetId.includes('oven');
    const isTable = name.includes('table') || assetId.includes('table') || id.includes('table') ||
                    name.includes('bureau') || assetId.includes('bureau') || id.includes('bureau') ||
                    name.includes('desk') || assetId.includes('desk') ||
                    name.includes('paillasse') || name.includes('pupitre') || assetId.includes('lectern');

    // Détermination de l'empreinte au sol (largeur X et profondeur Z avec tolérance)
    const tScaleRaw = tCap?.scale;
    const tScale = Array.isArray(tScaleRaw)
      ? { x: typeof tScaleRaw[0] === 'number' && !isNaN(tScaleRaw[0]) ? tScaleRaw[0] : 1, y: typeof tScaleRaw[1] === 'number' && !isNaN(tScaleRaw[1]) ? tScaleRaw[1] : 1, z: typeof tScaleRaw[2] === 'number' && !isNaN(tScaleRaw[2]) ? tScaleRaw[2] : 1 }
      : { x: typeof tScaleRaw?.x === 'number' && !isNaN(tScaleRaw.x) ? tScaleRaw.x : 1, y: typeof tScaleRaw?.y === 'number' && !isNaN(tScaleRaw.y) ? tScaleRaw.y : 1, z: typeof tScaleRaw?.z === 'number' && !isNaN(tScaleRaw.z) ? tScaleRaw.z : 1 };

    const catalogItem = getAsset(entity.visuals?.assetId);

    let baseSizeX = 1.0;
    let baseSizeZ = 1.0;

    if (catalogItem?.size) {
      baseSizeX = catalogItem.size[0];
      baseSizeZ = catalogItem.size[2];
    } else if (entity.physicalProperties?.dimensions) {
      baseSizeX = entity.physicalProperties.dimensions[0];
      baseSizeZ = entity.physicalProperties.dimensions[2];
    } else if (entity.id.startsWith('pedagogical_bench')) {
      baseSizeX = 2.2;
      baseSizeZ = 1.2;
    } else if (isIsland) {
      baseSizeX = 1.5;
      baseSizeZ = 0.95;
    } else if (isBoard) {
      baseSizeX = 0.45;
      baseSizeZ = 0.32;
    } else if (isPlate) {
      baseSizeX = 0.32;
      baseSizeZ = 0.32;
    } else if (isCocotte) {
      baseSizeX = 0.34;
      baseSizeZ = 0.34;
    } else if (isPoele) {
      baseSizeX = 0.32;
      baseSizeZ = 0.32;
    } else if (isVipPodium) {
      baseSizeX = 0.42;
      baseSizeZ = 0.38;
    } else if (isPodium) {
      baseSizeX = 3.2;
      baseSizeZ = 2.4;
    } else if (isCounter) {
      baseSizeX = 2.0;
      baseSizeZ = 0.85;
    } else if (isWorkbench) {
      baseSizeX = 2.0;
      baseSizeZ = 0.80;
    } else if (isTable) {
      baseSizeX = 1.6;
      baseSizeZ = 0.85;
    }

    // Marge de préhension : serrée (4 cm) pour les sous-supports, adaptée (10 cm) pour le mobilier
    const margin = isSubSupport ? 0.04 : 0.10;
    const halfX = (baseSizeX * Math.abs(tScale.x || 1)) / 2 + margin;
    const halfZ = (baseSizeZ * Math.abs(tScale.z || 1)) / 2 + margin;

    // Test d'inclusion sous rotation
    const dx = x - tPos.x;
    const dz = z - tPos.z;
    const tRotRaw = tCap?.rotation;
    const rotY = Array.isArray(tRotRaw)
      ? (typeof tRotRaw[1] === 'number' && !isNaN(tRotRaw[1]) ? tRotRaw[1] : 0)
      : (typeof tRotRaw?.y === 'number' && !isNaN(tRotRaw.y) ? tRotRaw.y : 0);

    const localX = rotY ? dx * Math.cos(-rotY) - dz * Math.sin(-rotY) : dx;
    const localZ = rotY ? dx * Math.sin(-rotY) + dz * Math.cos(-rotY) : dz;

    const isInsideBox = Math.abs(localX) <= halfX && Math.abs(localZ) <= halfZ;
    const isRound = isPlate || (isPodium && (assetId.includes('turntable') || name.includes('tournant')));
    const isInsideCircle = isRound && Math.hypot(dx, dz) <= Math.max(halfX, halfZ);
    const isInside = isRound ? (isInsideBox || isInsideCircle) : isInsideBox;

    if (isInside) {
      let topY = tPos.y;
      if (entity.id.startsWith('pedagogical_bench')) {
        topY = 0.84;
      } else if (isBoard) {
        topY = tPos.y + 0.03;
      } else if (isPlate) {
        topY = tPos.y + 0.025;
      } else if (isCocotte) {
        topY = tPos.y + 0.08;
      } else if (isPoele) {
        topY = tPos.y + 0.05;
      } else if (isVipPodium) {
        topY = tPos.y + 0.04;
      } else if (isPodium) {
        topY = tPos.y + 0.15;
      } else if (isIsland || isCounter || isTable || isStove) {
        topY = tPos.y > 0.6 ? tPos.y : (tPos.y + 0.912);
      } else if (isWorkbench) {
        topY = tPos.y > 0.6 ? tPos.y : (tPos.y + 0.882);
      } else {
        topY = tPos.y + 0.44;
      }

      const roundedTopY = Number(topY.toFixed(3));
      if (roundedTopY > highestSurfaceY) {
        highestSurfaceY = roundedTopY;
        highestSupport = entity;
      }
    }
  }

  return {
    surfaceY: highestSurfaceY,
    supportEntity: highestSupport,
    isGround: highestSupport === null,
    surfaceName: highestSupport ? (highestSupport.name || highestSupport.id) : 'Sol'
  };
}

/**
 * Calcule l'empreinte géométrique au sol d'une entité (rayon en mètres)
 * en tenant compte de ses dimensions réelles d'asset, de sa forme ou de sa catégorie sémantique.
 */
export function getEntityFootprintRadius(entity: EntitySpec, scl?: { x?: number; y?: number; z?: number }): number {
  const asset = getAsset(entity.visuals?.assetId);
  const dims = asset?.size || entity.physicalProperties?.dimensions;
  const scaleMul = scl ? Math.max(scl.x || 1, scl.z || 1) : 1;

  if (dims && dims.length >= 3) {
    const rawW = (dims[0] || 0.3) * scaleMul;
    const rawD = (dims[2] || 0.3) * scaleMul;
    // Rayon au sol : demi-dimension horizontale maximale pour englober la base
    const baseR = Math.max(rawW, rawD) * 0.5;
    return Math.max(0.045, baseR);
  }

  const shape = entity.visuals?.shape;
  if (shape === 'cylinder') {
    return 0.32 * scaleMul;
  }
  if (shape === 'sphere') {
    return 0.28 * scaleMul;
  }
  if (shape === 'box') {
    return 0.55 * scaleMul;
  }

  const id = (entity.id || '').toLowerCase();
  const name = (entity.name || '').toLowerCase();
  const assetId = (entity.visuals?.assetId || '').toLowerCase();

  // Objets maritimes & plage
  if (name.includes('voilier') || name.includes('bateau') || id.includes('voilier') || id.includes('bateau') || assetId.includes('voilier')) {
    return 0.75 * scaleMul;
  }
  if (name.includes('coquillage') || id.includes('coquillage') || assetId.includes('coquillage')) {
    return 0.07 * scaleMul;
  }
  if (name.includes('parasol') || assetId.includes('parasol')) {
    return 0.65 * scaleMul;
  }
  if (name.includes('transat') || assetId.includes('transat')) {
    return 0.55 * scaleMul;
  }
  if (name.includes('etoile') || name.includes('étoile') || id.includes('starfish')) {
    return 0.08 * scaleMul;
  }
  if (name.includes('galet') || name.includes('pierre') || id.includes('pebble')) {
    return 0.06 * scaleMul;
  }

  // Véhicules & gros mobilier
  if (name.includes('voiture') || name.includes('supercar') || name.includes('vehicule') || id.includes('supercar')) {
    return 1.35 * scaleMul;
  }
  if (name.includes('ilot') || name.includes('table') || name.includes('bureau') || name.includes('workbench') || id.includes('ilot')) {
    return 0.85 * scaleMul;
  }

  // Cuisine & petits objets
  if (name.includes('cocotte') || name.includes('poele') || name.includes('casserole') || id.includes('cocotte')) {
    return 0.22 * scaleMul;
  }
  if (name.includes('assiette') || name.includes('plate') || id.includes('assiette')) {
    return 0.18 * scaleMul;
  }
  if (name.includes('couteau') || name.includes('fourchette') || name.includes('cuillere') || id.includes('couteau')) {
    return 0.16 * scaleMul;
  }
  if (name.includes('planche') || id.includes('planche')) {
    return 0.28 * scaleMul;
  }
  if (name.includes('tasse') || name.includes('cup') || name.includes('verre') || name.includes('mug')) {
    return 0.08 * scaleMul;
  }
  if (name.includes('tomate') || name.includes('oignon') || name.includes('pomme') || name.includes('ail') || name.includes('citron')) {
    return 0.07 * scaleMul;
  }

  // High-tech & éducation
  if (name.includes('ordinateur') || name.includes('laptop') || id.includes('laptop')) {
    return 0.24 * scaleMul;
  }
  if (name.includes('livre') || name.includes('book') || id.includes('book')) {
    return 0.16 * scaleMul;
  }
  if (name.includes('microscope') || id.includes('microscope')) {
    return 0.18 * scaleMul;
  }

  return 0.20 * scaleMul;
}
