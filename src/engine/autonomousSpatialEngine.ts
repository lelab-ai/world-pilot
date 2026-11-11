// src/engine/autonomousSpatialEngine.ts
// Moteur Autonome d'Intelligence Spatiale, de Calibrage Physique et de Réalisme 3D pour WorldPilot.
//
// Prend automatiquement toutes les décisions d'agencement, de contact physique,
// de stabilité du mobilier et de mise en valeur esthétique sans aucune intervention manuelle.

import type { EntitySpec } from '../core/types';
import type { CameraPreset } from './store';
import { isFloorFurniture } from './spatialSurface';

export interface SupportSurfaceProfile {
  assetIdPattern: string[];
  nameKeywords: string[];
  surfaceY: number;
  usableWidthX: [number, number]; // [minX, maxX]
  usableDepthZ: [number, number]; // [minZ, maxZ]
  defaultCameraPreset: CameraPreset;
}

/**
 * Registre des profils de surfaces et meubles supports de WorldPilot.
 */
export const SUPPORT_SURFACE_PROFILES: SupportSurfaceProfile[] = [
  {
    assetIdPattern: ['wp-presentoir-luxe', 'presentoir-luxe'],
    nameKeywords: ['comptoir de présentation', 'présentoir de luxe', 'marbre calacatta', 'comptoir'],
    surfaceY: 0.912,
    usableWidthX: [-0.65, 0.65],
    usableDepthZ: [-0.25, 0.25],
    defaultCameraPreset: 'luxury_showroom'
  },
  {
    assetIdPattern: ['wp-plan-patisserie', 'plan-patisserie'],
    nameKeywords: ['plan de travail', 'pâtisserie', 'table de pâtisserie', 'marbre blanc'],
    surfaceY: 0.912,
    usableWidthX: [-0.70, 0.70],
    usableDepthZ: [-0.25, 0.25],
    defaultCameraPreset: 'table'
  },
  {
    assetIdPattern: ['wp-ilot-de-cuisine', 'ilot-de-cuisine', 'counter'],
    nameKeywords: ['îlot de cuisine', 'ilot', 'comptoir de cuisine', 'plan de cuisson'],
    surfaceY: 0.912,
    usableWidthX: [-0.70, 0.70],
    usableDepthZ: [-0.44, 0.44],
    defaultCameraPreset: 'table'
  },
  {
    assetIdPattern: ['workbench', 'wp-etabli', 'technical-bench'],
    nameKeywords: ['établi', 'etabli', 'banc technique', 'table d atelier', 'atelier'],
    surfaceY: 0.882,
    usableWidthX: [-0.75, 0.75],
    usableDepthZ: [-0.28, 0.28],
    defaultCameraPreset: 'table'
  },
  {
    assetIdPattern: ['wp-plateau-tournant', 'turntable'],
    nameKeywords: ['plateau tournant', 'podium tournant', 'socle supercar'],
    surfaceY: 0.152,
    usableWidthX: [-1.8, 1.8],
    usableDepthZ: [-2.2, 2.2],
    defaultCameraPreset: 'overview'
  },
  {
    assetIdPattern: ['table', 'wp-table', 'desk', 'bureau'],
    nameKeywords: ['grand bureau', 'bureau d’étude', "bureau d'étude", 'table', 'hub web 3d'],
    surfaceY: 0.912,
    usableWidthX: [-1.25, 1.25],
    usableDepthZ: [-0.55, 0.55],
    defaultCameraPreset: 'table'
  }
];

/**
 * Détermine si une entité est un meuble ou une structure fixe non manipulable.
 */
export function isAutonomousFixedFurniture(entity: EntitySpec): boolean {
  const id = (entity.id || '').toLowerCase();
  const name = (entity.name || '').toLowerCase();
  const assetId = (entity.visuals?.assetId || '').toLowerCase();

  // Les accessoires, ustensiles et objets de table ne sont JAMAIS des meubles ou structures fixes
  if (
    assetId.includes('cocotte') || name.includes('cocotte') || id.includes('cocotte') ||
    assetId.includes('poele') || name.includes('poele') || id.includes('poele') ||
    assetId.includes('couteau') || name.includes('couteau') || id.includes('couteau') ||
    assetId.includes('assiette') || name.includes('assiette') || id.includes('assiette') ||
    assetId.includes('plat') || name.includes('plat') || id.includes('plat') ||
    assetId.includes('verre') || name.includes('verre') || id.includes('verre') ||
    assetId.includes('bouteille') || name.includes('bouteille') || id.includes('bouteille') ||
    assetId.includes('planche') || name.includes('planche') || id.includes('planche') ||
    assetId.includes('livre') || name.includes('livre') || id.includes('book') ||
    assetId.includes('laptop') || name.includes('laptop') || id.includes('laptop') ||
    assetId.includes('sac') || name.includes('sac') || id.includes('bag')
  ) {
    return false;
  }

  // Structures architecturales réelles (murs, sols)
  if (
    id === 'sol' || id === 'floor' || id === 'ground' ||
    id.startsWith('sol_') || id.startsWith('floor_') || id.startsWith('ground_') ||
    id === 'mur' || id === 'wall' || id.startsWith('mur_') || id.startsWith('wall_') ||
    id.endsWith('_floor') || id.endsWith('_wall') || id.endsWith('_mur')
  ) {
    return true;
  }
  return isFloorFurniture(entity);
}

/**
 * Trouve le profil de support correspondant pour un meuble donné.
 */
export function findSupportProfile(entity: EntitySpec): SupportSurfaceProfile | null {
  const assetId = (entity.visuals?.assetId || '').toLowerCase();
  const name = (entity.name || '').toLowerCase();

  for (const profile of SUPPORT_SURFACE_PROFILES) {
    if (profile.assetIdPattern.some(p => assetId.includes(p))) return profile;
    if (profile.nameKeywords.some(k => name.includes(k))) return profile;
  }

  // Fallback support générique si c'est un meuble support identifié
  if (isAutonomousFixedFurniture(entity) && (name.includes('table') || name.includes('comptoir') || name.includes('plan'))) {
    return {
      assetIdPattern: [],
      nameKeywords: [],
      surfaceY: 0.912,
      usableWidthX: [-0.65, 0.65],
      usableDepthZ: [-0.25, 0.25],
      defaultCameraPreset: 'table'
    };
  }

  return null;
}

function getPosCoord(pos: any, axis: 'x' | 'y' | 'z', fallback = 0): number {
  if (!pos) return fallback;
  if (Array.isArray(pos)) {
    const idx = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
    return typeof pos[idx] === 'number' ? pos[idx] : fallback;
  }
  return typeof pos[axis] === 'number' ? pos[axis] : fallback;
}

function setPosCoord(pos: any, axis: 'x' | 'y' | 'z', val: number): void {
  if (!pos) return;
  if (Array.isArray(pos)) {
    const idx = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
    pos[idx] = val;
  } else {
    pos[axis] = val;
  }
}

/**
 * 1. Auto-Grounding & Surface Snapping :
 * Calcule au millimètre la hauteur d'appui de chaque objet sur son support pour éradiquer
 * tout flottement dans les airs ou enfoncement.
 */
export function autoGroundEntities(entities: Record<string, EntitySpec>, isExplicitUserPlacement: boolean = false): void {
  const entityList = Object.values(entities);

  // Recherche de TOUS les meubles supports dans la scène
  const supports = entityList.filter(e => isAutonomousFixedFurniture(e) && findSupportProfile(e));
  if (supports.length === 0) return;

  supports.forEach(support => {
    // Le meuble support au sol repose STRICTEMENT au sol (y = 0)
    const supTrans = support.capabilities.find(c => c.type === 'transform') as any;
    if (supTrans?.position) {
      setPosCoord(supTrans.position, 'y', 0);
    }

    const profile = findSupportProfile(support)!;
    const supX = getPosCoord(supTrans?.position, 'x', 0);
    const supY = getPosCoord(supTrans?.position, 'y', 0);
    const supZ = getPosCoord(supTrans?.position, 'z', 0);
    const effectiveSurfaceY = supY + profile.surfaceY;

    const isPrimaryTurntable =
      support.visuals?.assetId === 'wp-plateau-tournant' ||
      support.id.toLowerCase().includes('turntable') ||
      (support.name || '').toLowerCase().includes('plateau tournant');

    entityList.forEach(e => {
      if (e.id === support.id || isAutonomousFixedFurniture(e)) return;

      const eIdLow = (e.id || '').toLowerCase();
      const eNameLow = (e.name || '').toLowerCase();
      const eAssetLow = (e.visuals?.assetId || '').toLowerCase();

      // Sur un plateau tournant de showroom, seul le véhicule central y est ancré
      if (isPrimaryTurntable) {
        const isVehicle =
          eAssetLow.includes('supercar') || eIdLow.includes('supercar') || eNameLow.includes('supercar') ||
          eNameLow.includes('voiture') || eAssetLow.includes('car');
        if (!isVehicle) return;
        const vTrans = e.capabilities.find(c => c.type === 'transform') as any;
        if (vTrans?.position) {
          setPosCoord(vTrans.position, 'y', 0.09);
        }
        return;
      }

      const transformCap = e.capabilities.find(c => c.type === 'transform') as any;
      if (!transformCap || !transformCap.position) return;

      const curX = getPosCoord(transformCap.position, 'x', 0);
      const curY = getPosCoord(transformCap.position, 'y', 0);
      const curZ = getPosCoord(transformCap.position, 'z', 0);

      // Si l'objet est spatialement au-dessus de l'emprise du meuble (en coordonnées MONDE)
      if (
        curX >= supX + profile.usableWidthX[0] - 0.20 &&
        curX <= supX + profile.usableWidthX[1] + 0.20 &&
        curZ >= supZ + profile.usableDepthZ[0] - 0.20 &&
        curZ <= supZ + profile.usableDepthZ[1] + 0.20
      ) {
        // Détecter si l'objet repose sur un sous-support surélevé (podium VIP, planche à découper, assiette, poêle, etc.)
        const subSupport = entityList.find(sub => {
          if (sub.id === e.id || sub.id === support.id) return false;
          const subTrans = sub.capabilities.find(c => c.type === 'transform') as any;
          if (!subTrans?.position) return false;
          const isSubPlatform = 
            sub.capabilities.some(c => c.type === 'trigger_zone') ||
            sub.visuals?.assetId?.includes('podium') ||
            sub.visuals?.assetId?.includes('planche') ||
            sub.visuals?.assetId?.includes('assiette') ||
            sub.visuals?.assetId?.includes('poele') ||
            sub.visuals?.assetId?.includes('cocotte') ||
            sub.name?.toLowerCase().includes('podium') ||
            sub.name?.toLowerCase().includes('planche') ||
            sub.name?.toLowerCase().includes('assiette');
          if (!isSubPlatform) return false;
          const dist = Math.hypot(curX - getPosCoord(subTrans.position, 'x', 0), curZ - getPosCoord(subTrans.position, 'z', 0));
          return dist < 0.28;
        });

        if (subSupport) {
          const subTrans = subSupport.capabilities.find(c => c.type === 'transform') as any;
          const isCocotte = subSupport.visuals?.assetId?.includes('cocotte') || subSupport.name?.toLowerCase().includes('cocotte');
          const isPoele = subSupport.visuals?.assetId?.includes('poele') || subSupport.name?.toLowerCase().includes('poele');
          const lift = isCocotte ? 0.08 : (isPoele ? 0.05 : 0.04);
          const subY = getPosCoord(subTrans.position, 'y', effectiveSurfaceY);
          setPosCoord(transformCap.position, 'y', Number((subY + lift).toFixed(3)));
          return;
        }

        // Auto-guérison : si l'objet est tombé au sol ou enfoncé sous le plateau, on le remonte immédiatement sur le plateau
        if (curY < effectiveSurfaceY) {
          setPosCoord(transformCap.position, 'y', effectiveSurfaceY);
          return;
        }

        // Si l'objet vient d'être posé explicitement par l'utilisateur et a déjà une hauteur valide, ne pas l'écraser
        if (isExplicitUserPlacement && curY >= effectiveSurfaceY) {
          return;
        }

        // Ajustement automatique millimétrique de la hauteur d'appui
        setPosCoord(transformCap.position, 'y', effectiveSurfaceY);
      }
    });
  });
}

/**
 * 2. Auto-Layout & Merchandising Spacing Solver :
 * Si plusieurs objets reposent sur le même support, calcule une distribution équilibrée
 * avec marges d'exposition, supprime les chevauchements et applique un angle d'orientation
 * esthétique tourné vers l'utilisateur.
 */
export function autoLayoutSupportItems(entities: Record<string, EntitySpec>): void {
  const entityList = Object.values(entities);
  const supports = entityList.filter(e => isAutonomousFixedFurniture(e) && findSupportProfile(e));
  if (supports.length === 0) return;

  supports.forEach(support => {
    const profile = findSupportProfile(support)!;
    const supTrans = support.capabilities.find(c => c.type === 'transform') as any;
    const supX = getPosCoord(supTrans?.position, 'x', 0);
    const supY = getPosCoord(supTrans?.position, 'y', 0);
    const supZ = getPosCoord(supTrans?.position, 'z', 0);
    const effectiveSurfaceY = supY + profile.surfaceY;

    // Filtrer les objets manipulables ou d'exposition posés sur ce meuble
    // Les zones cibles (trigger_zone) et plateformes d'accueil (podiums, planches) ont une position d'ancrage fixe
    const itemsOnSupport = entityList.filter(e => {
      if (e.id === support.id || isAutonomousFixedFurniture(e)) return false;
      if (e.capabilities.some(c => c.type === 'trigger_zone')) return false;
      if (e.id.includes('podium') || e.visuals?.assetId?.includes('podium') || e.name?.toLowerCase().includes('podium')) return false;

      const transformCap = e.capabilities.find(c => c.type === 'transform') as any;
      if (!transformCap || !transformCap.position) return false;
      const curX = getPosCoord(transformCap.position, 'x', 0);
      const curZ = getPosCoord(transformCap.position, 'z', 0);

      // Si l'objet est déjà posé sur un sous-support dédié (podium, planche, etc.), il a trouvé sa destination et ne doit pas être réarrangé
      const isOnDedicatedZone = entityList.some(target => {
        if (target.id === e.id) return false;
        const isTarget = target.capabilities.some(c => c.type === 'trigger_zone') ||
          target.id.includes('podium') || target.visuals?.assetId?.includes('podium') ||
          target.visuals?.assetId?.includes('planche') || target.name?.toLowerCase().includes('planche');
        if (!isTarget) return false;
        const tPos = target.capabilities.find(c => c.type === 'transform')?.position;
        if (!tPos) return false;
        return Math.hypot(curX - getPosCoord(tPos, 'x', 0), curZ - getPosCoord(tPos, 'z', 0)) < 0.35;
      });
      if (isOnDedicatedZone) return false;

      return (
        curX >= supX + profile.usableWidthX[0] - 0.25 &&
        curX <= supX + profile.usableWidthX[1] + 0.25 &&
        curZ >= supZ + profile.usableDepthZ[0] - 0.25 &&
        curZ <= supZ + profile.usableDepthZ[1] + 0.25
      );
    });

    // S'il n'y a qu'un objet ou aucun, pas de conflit d'espacement
    if (itemsOnSupport.length < 2) return;

    // Détecter les conflits d'espacement (chevauchement physique ou coordonnées identiques)
    const hasConflict = itemsOnSupport.some((itemA, i) => {
      const posA = (itemA.capabilities.find(c => c.type === 'transform') as any)?.position;
      const ax = getPosCoord(posA, 'x', 0);
      const az = getPosCoord(posA, 'z', 0);
      return itemsOnSupport.slice(i + 1).some(itemB => {
        const posB = (itemB.capabilities.find(c => c.type === 'transform') as any)?.position;
        const bx = getPosCoord(posB, 'x', 0);
        const bz = getPosCoord(posB, 'z', 0);
        const dist = Math.hypot(ax - bx, az - bz);
        return dist < 0.28; // Distance minimale de 28cm entre objets d'exposition
      });
    }) || itemsOnSupport.some(item => {
      const pos = (item.capabilities.find(c => c.type === 'transform') as any)?.position;
      const x = getPosCoord(pos, 'x', 0);
      return x < supX + profile.usableWidthX[0] - 0.05 || x > supX + profile.usableWidthX[1] + 0.05;
    });

    // Si les objets sont déjà bien espacés sans chevauchement, on ajuste uniquement l'orientation esthétique si neutre
    if (!hasConflict) {
      itemsOnSupport.forEach(item => {
        const transformCap = item.capabilities.find(c => c.type === 'transform') as any;
        if (!transformCap) return;
        if (!transformCap.rotation) transformCap.rotation = { x: 0, y: 0, z: 0 };
        const rotY = getPosCoord(transformCap.rotation, 'y', 0);
        const posX = getPosCoord(transformCap.position, 'x', 0) - supX;
        if (rotY === 0) {
          if (posX < -0.15) setPosCoord(transformCap.rotation, 'y', 0.16);
          else if (posX > 0.15) setPosCoord(transformCap.rotation, 'y', -0.16);
        }
      });
      return;
    }

    // Trier les objets de gauche à droite selon leur X actuel
    itemsOnSupport.sort((a, b) => {
      const ax = getPosCoord((a.capabilities.find(c => c.type === 'transform') as any)?.position, 'x', 0);
      const bx = getPosCoord((b.capabilities.find(c => c.type === 'transform') as any)?.position, 'x', 0);
      return ax - bx;
    });

    const count = itemsOnSupport.length;
    const minX = supX + profile.usableWidthX[0];
    const maxX = supX + profile.usableWidthX[1];
    const totalSpan = maxX - minX;

    // Répartition harmonieuse avec marges proportionnelles
    itemsOnSupport.forEach((item, index) => {
      const transformCap = item.capabilities.find(c => c.type === 'transform') as any;
      if (!transformCap || !transformCap.position) return;

      // Calcul de la coordonnée X idéale
      const ratio = count === 1 ? 0.5 : (index + 0.5) / count;
      const targetX = minX + ratio * totalSpan;
      setPosCoord(transformCap.position, 'x', Number(targetX.toFixed(3)));
      setPosCoord(transformCap.position, 'y', effectiveSurfaceY);

      // Angle d'orientation esthétique : tourné légèrement vers le regard du visiteur
      if (!transformCap.rotation) transformCap.rotation = { x: 0, y: 0, z: 0 };
      if (index === 0 && count > 1) {
        setPosCoord(transformCap.rotation, 'y', 0.18); // ~10° vers la droite
      } else if (index === count - 1 && count > 1) {
        setPosCoord(transformCap.rotation, 'y', -0.18); // ~10° vers la gauche
      } else {
        setPosCoord(transformCap.rotation, 'y', 0);
      }
    });
  });
}

/**
 * 3. Auto-Locking du Mobilier Structurel :
 * Empêche strictement toute disparition, chute ou translation physique involontaire des meubles.
 */
export function autoLockStructuralFurniture(entities: Record<string, EntitySpec>): void {
  const allList = Object.values(entities);
  const hasTurntable = allList.some(e => {
    const aid = (e.visuals?.assetId || '').toLowerCase();
    const id = (e.id || '').toLowerCase();
    const name = (e.name || '').toLowerCase();
    return aid === 'wp-plateau-tournant' || aid.includes('turntable') || id.includes('turntable') || name.includes('plateau tournant');
  });

  allList.forEach(entity => {
    if (isAutonomousFixedFurniture(entity)) {
      // Supprimer toute capacité 'draggable' involontaire
      entity.capabilities = entity.capabilities.filter(c => c.type !== 'draggable');
      
      // Assurer la présence du collider pour que les objets puissent s'y appuyer
      if (!entity.capabilities.some(c => c.type === 'collider')) {
        entity.capabilities.push({ type: 'collider' });
      }

      // Le mobilier de sol repose STRICTEMENT au sol à y = 0 (ou 0.09 pour un véhicule sur plateau tournant)
      if (isFloorFurniture(entity)) {
        const aid = (entity.visuals?.assetId || '').toLowerCase();
        const id = (entity.id || '').toLowerCase();
        const name = (entity.name || '').toLowerCase();
        const isCarOnTurntable = hasTurntable && (
          aid === 'wp-supercar-showroom' || name.includes('supercar') || id.includes('supercar') || name.includes('voiture')
        );
        const targetFloorY = isCarOnTurntable ? 0.09 : 0;
        const transformCap = entity.capabilities.find(c => c.type === 'transform') as any;
        if (transformCap && transformCap.position) {
          setPosCoord(transformCap.position, 'y', targetFloorY);
        }
      }
    }
  });
}

/**
 * 4. Auto-Camera Director :
 * Détermine automatiquement le meilleur préréglage caméra à hauteur d'homme.
 */
export function autoDetermineCameraPreset(
  entities: Record<string, EntitySpec>,
  intentHint?: string
): CameraPreset {
  const norm = (intentHint || '').toLowerCase();
  
  if (norm.includes('louis vuitton') || norm.includes('maroquinerie') || norm.includes('sac') || norm.includes('luxe')) {
    return 'luxury_showroom';
  }
  if (norm.includes('cookie') || norm.includes('four') || norm.includes('patisserie') || norm.includes('pâtisserie')) {
    return 'table';
  }
  if (norm.includes('supercar') || norm.includes('hypercar') || norm.includes('sport')) {
    return 'supercar_hero';
  }
  if (norm.includes('penthouse') || norm.includes('coupole')) {
    return 'overview';
  }
  if (norm.includes('ratatouille') || norm.includes('cocotte') || norm.includes('mijot')) {
    return 'cocotte';
  }

  // Détection selon les entités présentes
  const entityTexts = Object.values(entities).map(e => `${e.name || ''} ${e.id || ''} ${e.visuals?.assetId || ''}`).join(' ').toLowerCase();
  if (entityTexts.includes('supercar') || entityTexts.includes('hypercar')) {
    return 'supercar_hero';
  }
  if (entityTexts.includes('louis vuitton') || entityTexts.includes('monogram') || entityTexts.includes('capucines')) {
    return 'luxury_showroom';
  }
  if (entityTexts.includes('cookie') || entityTexts.includes('four') || entityTexts.includes('saladier')) {
    return 'table';
  }

  return 'overview';
}

/**
 * 5. Auto-Environment & Contextual Architecture Director :
 * Détermine automatiquement et sans intervention le meilleur environnement spatial ouvert ("Design +++")
 * selon l'empreinte sémantique de l'expérience, ses entités actives et ses objectifs pédagogiques.
 */
export function autoDetermineWorldTheme(
  entities: Record<string, EntitySpec>,
  intentHint?: string
): string {
  // Concaténation de tout le contexte textuel (instruction, noms d'entités, assetIds)
  const entityTexts = Object.values(entities)
    .map(e => `${e.name || ''} ${e.id || ''} ${e.visuals?.assetId || ''}`)
    .join(' ')
    .toLowerCase();
  const context = `${(intentHint || '').toLowerCase()} ${entityTexts}`;

  // 1. Haute Maroquinerie, Luxe, Haute Joaillerie & Horlogerie
  if (
    context.includes('louis vuitton') || context.includes('capucines') || context.includes('sac') ||
    context.includes('sacoche') || context.includes('maroquinerie') || context.includes('luxe') ||
    context.includes('monogram') || context.includes('cuir') || context.includes('vendôme') ||
    context.includes('vendome') || context.includes('bijou') || context.includes('joaillerie') ||
    context.includes('diamant') || context.includes('montre') || context.includes('horlogerie') ||
    context.includes('rolex') || context.includes('patek') || context.includes('cartier') ||
    context.includes('parfum') || context.includes('flacon') || context.includes('podium vip')
  ) {
    return 'luxury-showroom';
  }

  // 2. Automobile d'Exception, Hypercars & Aérodynamique
  if (
    context.includes('supercar') || context.includes('hypercar') || context.includes('voiture') ||
    context.includes('ferrari') || context.includes('porsche') || context.includes('mclaren') ||
    context.includes('bugatti') || context.includes('carrosserie') || context.includes('chassis') ||
    context.includes('v12') || context.includes('plateau tournant') || context.includes('socle supercar')
  ) {
    return 'supercar-showroom';
  }

  // 3. Laboratoire Haute Technologie, Robotique LeRobot, Électronique, Atelier Mécanique & Chimie
  if (
    context.includes('batterie') || context.includes('multimètre') || context.includes('multimetre') ||
    context.includes('etabli') || context.includes('établi') || context.includes('cle dynamometrique') ||
    context.includes('chimie') || context.includes('fiole') || context.includes('bunsen') ||
    context.includes('laboratoire') || context.includes('labo') || context.includes('eprouvette') ||
    context.includes('robot') || context.includes('lerobot') || context.includes('pompe') ||
    context.includes('circuit') || context.includes('electronique') || context.includes('soudure') ||
    context.includes('moteur') || context.includes('maintenance')
  ) {
    return 'high-tech-lab';
  }

  // 4. Gastronomie, Cuisine, Pâtisserie & Art Culinaire
  if (
    context.includes('cookie') || context.includes('four') || context.includes('patisserie') ||
    context.includes('pâtisserie') || context.includes('cuisine') || context.includes('ratatouille') ||
    context.includes('recette') || context.includes('chef') || context.includes('cuisson') ||
    context.includes('chocolat') || context.includes('bistrot') || context.includes('cafe') ||
    context.includes('café') || context.includes('espresso') || context.includes('couteau') ||
    context.includes('poele') || context.includes('poêle') || context.includes('sauteuse') ||
    context.includes('degustation') || context.includes('dégustation') || context.includes('boulangerie') ||
    context.includes('plan-patisserie') || context.includes('ilot-de-cuisine')
  ) {
    return 'cozy-bistrot';
  }

  // 5. Galerie d'Art Contemporain, Séminaires, Design Sprints, Pédagogie FLE
  if (
    context.includes('seminaire') || context.includes('séminaire') || context.includes('sprint') ||
    context.includes('post-it') || context.includes('tableau blanc') || context.includes('ideation') ||
    context.includes('fle') || context.includes('vocabulaire') || context.includes('galerie') ||
    context.includes('sculpture') || context.includes('vernissage') || context.includes('exposition') ||
    context.includes('musee') || context.includes('musée') || context.includes('conference') ||
    context.includes('reunion') || context.includes('réunion')
  ) {
    return 'contemporary-gallery';
  }

  // 6. Espace, Zéro-G & Station Orbitale
  if (
    context.includes('orbite') || context.includes('spatial') || context.includes('zéro-g') ||
    context.includes('zero-g') || context.includes('coupole') || context.includes('satellite') ||
    context.includes('iss') || context.includes('astronaute')
  ) {
    return 'orbital-zerog';
  }

  // 7. Exploration Martienne
  if (context.includes('mars') || context.includes('martien') || context.includes('rover') || context.includes('jezero')) {
    return 'martian-surface';
  }

  // 8. Base Lunaire
  if (context.includes('lune') || context.includes('lunaire') || context.includes('apollo') || context.includes('artemis')) {
    return 'lunar-base';
  }

  // 9. Nature, Zen & Sanctuaire Alpin
  if (context.includes('refuge') || context.includes('montagne') || context.includes('alpin')) {
    return 'le-refuge';
  }
  if (context.includes('zen') || context.includes('thé') || context.includes('bambou') || context.includes('meditation')) {
    return 'zen-garden';
  }

  // 10. Cyberpunk & Matrice Néon
  if (context.includes('cyber') || context.includes('matrix') || context.includes('matrice') || context.includes('neon')) {
    return 'cyberpunk-matrix';
  }

  // Fallback universel : Pavillon d'Architecture Avant-Garde Ouvert
  return 'earth-atelier';
}

/**
 * 6. Auto-Deoverlap Floor Entities :
 * Empêche le chevauchement d'entités posées au sol, notamment lorsqu'un véhicule
 * ou élément central volumineux occupe le centre (0, 0, 0) et qu'un totem/pupitre/piédestal est généré à proximité.
 */
export function autoDeoverlapFloorEntities(entities: Record<string, EntitySpec>): void {
  const entityList = Object.values(entities);
  if (entityList.length < 2) return;

  // Repérer un véhicule ou une pièce maîtresse au sol
  const carCenterpiece = entityList.find(e => {
    const aid = (e.visuals?.assetId || '').toLowerCase();
    const name = (e.name || '').toLowerCase();
    const id = (e.id || '').toLowerCase();
    if (
      name.includes('configur') || name.includes('console') || name.includes('borne') ||
      name.includes('clé') || name.includes('cle') || name.includes('cockpit') ||
      name.includes('authentification') || name.includes('plateau') ||
      e.capabilities.some(c => c.type === 'trigger_zone' || c.type === 'draggable')
    ) {
      return false;
    }
    return aid.includes('car') || aid.includes('supercar') || aid.includes('chassis') ||
           name.includes('supercar') || name.includes('voiture') || id.includes('supercar');
  });

  if (carCenterpiece) {
    const cTrans = carCenterpiece.capabilities.find(c => c.type === 'transform') as any;
    const cx = cTrans?.position?.x ?? (Array.isArray(cTrans?.position) ? cTrans.position[0] : 0);
    const cz = cTrans?.position?.z ?? (Array.isArray(cTrans?.position) ? cTrans.position[2] : 0);

    entityList.forEach(other => {
      if (other.id === carCenterpiece.id) return;
      // Ne pas décaler le sol, le mur ou le plateau tournant sous le véhicule
      const otherId = other.id.toLowerCase();
      const otherAid = (other.visuals?.assetId || '').toLowerCase();
      const otherName = (other.name || '').toLowerCase();
      if (
        otherId.includes('sol') || otherId.includes('ground') || otherId.includes('floor') ||
        otherId.includes('mur') || otherId.includes('wall') ||
        otherAid.includes('turntable') || otherAid.includes('plateau-tournant') || otherName.includes('plateau') ||
        otherId.includes('cockpit') || otherId.includes('dock') || otherAid === 'socket' ||
        otherName.includes('cockpit') || otherName.includes('récepteur') || otherName.includes('recepteur') ||
        other.capabilities.some(c => c.type === 'trigger_zone')
      ) {
        return;
      }

      const oTrans = other.capabilities.find(c => c.type === 'transform') as any;
      if (!oTrans?.position) return;
      const ox = typeof oTrans.position.x === 'number' ? oTrans.position.x : (Array.isArray(oTrans.position) ? oTrans.position[0] : 0);
      const oz = typeof oTrans.position.z === 'number' ? oTrans.position.z : (Array.isArray(oTrans.position) ? oTrans.position[2] : 0);

      const dist = Math.hypot(ox - cx, oz - cz);
      const isSmartKey =
        otherId.includes('smart_key') || otherId.includes('cle_intelligente') ||
        otherAid === 'wp-telecommande-sport' || otherName.includes('clé') || otherName.includes('cle');
      const minCarSafetyRadius = isSmartKey ? 1.8 : 2.2;
      if (dist < minCarSafetyRadius) {
        // Déplacer vers un point d'exposition élégant sur le flanc avant-gauche ou avant-droit
        const targetX = isSmartKey ? -1.55 : (ox <= cx ? -2.5 : 2.5);
        const targetZ = isSmartKey ? 1.55 : (oz >= cz ? 1.4 : -1.4);
        if (Array.isArray(oTrans.position)) {
          oTrans.position[0] = targetX;
          oTrans.position[2] = targetZ;
        } else {
          oTrans.position.x = targetX;
          oTrans.position.z = targetZ;
        }
        // Tourner légèrement l'objet vers le centre du véhicule
        if (!oTrans.rotation) oTrans.rotation = { x: 0, y: 0, z: 0 };
        const angle = Math.atan2(cx - targetX, cz - targetZ);
        setPosCoord(oTrans.rotation, 'y', Number(angle.toFixed(2)));
      }
    });

    // Empêcher qu'un objet draggable (ex: Clé intelligente) et une trigger_zone (ex: Zone d'authentification)
    // générés par le LLM soient superposés exactement aux mêmes coordonnées au sol devant la supercar
    const triggerZones = entityList.filter(e => e.capabilities.some(c => c.type === 'trigger_zone'));
    const draggables = entityList.filter(e => e.capabilities.some(c => c.type === 'draggable') && !e.capabilities.some(c => c.type === 'trigger_zone'));
    for (const dragEnt of draggables) {
      const dTrans = dragEnt.capabilities.find(c => c.type === 'transform') as any;
      if (!dTrans?.position) continue;
      const dx = typeof dTrans.position.x === 'number' ? dTrans.position.x : (Array.isArray(dTrans.position) ? dTrans.position[0] : 0);
      const dz = typeof dTrans.position.z === 'number' ? dTrans.position.z : (Array.isArray(dTrans.position) ? dTrans.position[2] : 0);
      for (const zoneEnt of triggerZones) {
        const zTrans = zoneEnt.capabilities.find(c => c.type === 'transform') as any;
        if (!zTrans?.position) continue;
        const zx = typeof zTrans.position.x === 'number' ? zTrans.position.x : (Array.isArray(zTrans.position) ? zTrans.position[0] : 0);
        const zz = typeof zTrans.position.z === 'number' ? zTrans.position.z : (Array.isArray(zTrans.position) ? zTrans.position[2] : 0);
        if (Math.hypot(dx - zx, dz - zz) < 0.65) {
          const newX = Number((zx <= 0 ? zx - 1.15 : zx + 1.15).toFixed(2));
          const newZ = Number((zz + 0.35).toFixed(2));
          if (Array.isArray(dTrans.position)) {
            dTrans.position[0] = newX;
            dTrans.position[2] = newZ;
          } else {
            dTrans.position.x = newX;
            dTrans.position.z = newZ;
          }
        }
      }
    }
  }
}

/**
 * Orchestrateur Principal Autonome :
 * Exécute l'ensemble des optimisations spatiales, physiques et atmosphériques sur la scène.
 */
export function applyAutonomousSpatialEngine(
  entities: Record<string, EntitySpec>,
  intentHint?: string
): { cameraPreset: CameraPreset; worldThemeId: string } {
  const isExplicitUserPlacement = !!intentHint && (
    intentHint.startsWith('Poser ') ||
    intentHint.startsWith('Déplacer ') ||
    intentHint.startsWith('Move ') ||
    intentHint.startsWith('Drop ') ||
    intentHint.toLowerCase().includes('poser ') ||
    intentHint.toLowerCase().includes('déplacer ') ||
    intentHint.toLowerCase().includes('gardant sa position') ||
    intentHint.toLowerCase().includes('position conservée') ||
    intentHint.toLowerCase().includes('replace_entity_preserving_transform') ||
    intentHint.toLowerCase().includes('substitution') ||
    intentHint === 'drag_drop'
  );

  // 1. Verrouillage systématique des meubles
  autoLockStructuralFurniture(entities);

  // 2. Calibrage millimétrique d'appui sur support
  autoGroundEntities(entities, isExplicitUserPlacement);

  // 3. Distribution harmonieuse et espacement d'exposition (uniquement hors placement explicite de l'utilisateur)
  if (!isExplicitUserPlacement) {
    autoLayoutSupportItems(entities);
    autoDeoverlapFloorEntities(entities);
  }

  // 4. Cadrage caméra optimal
  const cameraPreset = autoDetermineCameraPreset(entities, intentHint);

  // 5. Cyclorama atmosphérique ouvert adapté
  const worldThemeId = autoDetermineWorldTheme(entities, intentHint);

  return { cameraPreset, worldThemeId };
}
