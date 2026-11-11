import { EntitySpec, WorldPatch, SoundEffect } from '../core/types';

export type AffordanceType = 
  | 'slice_chop'
  | 'cook_simmer'
  | 'pour_liquid'
  | 'ignite_fire'
  | 'read_study'
  | 'unlock_circuit'
  | 'stack_contain'
  | 'generic_dock';

export interface CausalityAffordance {
  type: AffordanceType;
  sourceEntity: EntitySpec;
  targetEntity: EntitySpec;
  label: string;
  icon: string;
  sound: SoundEffect;
  hapticFeedback?: string;
  snapPosition: { x: number; y: number; z: number };
  toastMessage: string;
  particleType: 'steam' | 'spark' | 'splash' | 'chop' | 'chime' | 'glow';
  resultingPatch?: Partial<WorldPatch>;
}

const SHORT_EXACT_KEYWORDS = new Set(['cle', 'ail', 'vin', 'pot', 'pain', 'bol', 'mug', 'wok', 'adn']);

function normalizeText(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Normalise les identifiants et libellés pour détecter les familles sémantiques
 */
function matchEntityKeyword(entity: EntitySpec, keywords: string[]): boolean {
  const haystack = normalizeText(
    [
      entity.id,
      entity.name || '',
      entity.visuals?.assetId || '',
      entity.visuals?.modelUrl || '',
      ...(entity.capabilities?.map(c => `${c.type} ${c.url || ''} ${c.text || ''} ${(c as any).assetId || ''}`) || [])
    ].join(' ')
  );

  return keywords.some(rawKw => {
    const kw = normalizeText(rawKw).trim();
    if (!kw) return false;
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (SHORT_EXACT_KEYWORDS.has(kw)) {
      const re = new RegExp(`(^|[^a-z0-9])${escaped}s?(?=$|[^a-z0-9])`, 'i');
      return re.test(haystack);
    }
    const re = new RegExp(`(^|[^a-z0-9])${escaped}`, 'i');
    return re.test(haystack);
  });
}

function normalizeVec3(
  raw: any,
  fallback: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 }
): { x: number; y: number; z: number } {
  if (!raw) return { ...fallback };
  if (Array.isArray(raw)) {
    return {
      x: typeof raw[0] === 'number' && !Number.isNaN(raw[0]) ? raw[0] : fallback.x,
      y: typeof raw[1] === 'number' && !Number.isNaN(raw[1]) ? raw[1] : fallback.y,
      z: typeof raw[2] === 'number' && !Number.isNaN(raw[2]) ? raw[2] : fallback.z
    };
  }
  if (typeof raw === 'object') {
    return {
      x: typeof raw.x === 'number' && !Number.isNaN(raw.x) ? raw.x : fallback.x,
      y: typeof raw.y === 'number' && !Number.isNaN(raw.y) ? raw.y : fallback.y,
      z: typeof raw.z === 'number' && !Number.isNaN(raw.z) ? raw.z : fallback.z
    };
  }
  return { ...fallback };
}

/**
 * Évalue la compatibilité sémantique et physique entre deux entités 3D
 */
export function evaluateSpatialCausality(
  source: EntitySpec,
  target: EntitySpec
): CausalityAffordance | null {
  if (source.id === target.id) return null;

  const rawTargetPos =
    (target as any).transform?.position ||
    target.capabilities?.find(c => c.type === 'transform')?.position;
  const targetTransform = normalizeVec3(rawTargetPos, { x: 0, y: 0, z: 0 });

  // 1. DÉCOUPE & PRÉPARATION : Couteau / Outil tranchant sur Planche à découper
  const isKnife = matchEntityKeyword(source, ['couteau', 'knife', 'lame', 'cleaver']);
  const isCuttingBoard = matchEntityKeyword(target, ['planche', 'board', 'decouper', 'etabli']);
  if (isKnife && isCuttingBoard) {
    return {
      type: 'slice_chop',
      sourceEntity: source,
      targetEntity: target,
      label: 'Émincer et découper les ingrédients',
      icon: '🔪',
      sound: 'knife_chop',
      hapticFeedback: 'snap_connect',
      snapPosition: { x: targetTransform.x, y: targetTransform.y + 0.05, z: targetTransform.z },
      toastMessage: `🔪 Geste de précision : ${source.name} est en position de découpe sur ${target.name} !`,
      particleType: 'chop'
    };
  }

  // 2. INGRÉDIENT SUR PLANCHE À DÉCOUPER
  const isFoodIngredient = matchEntityKeyword(source, [
    'tomate', 'courgette', 'aubergine', 'oignon', 'poivron', 'ail',
    'carotte', 'pomme', 'pain', 'fromage', 'boeuf', 'champignon'
  ]);
  if (isFoodIngredient && isCuttingBoard) {
    return {
      type: 'slice_chop',
      sourceEntity: source,
      targetEntity: target,
      label: 'Placer pour découpe au couteau',
      icon: '🥕',
      sound: 'switch_click',
      snapPosition: { x: targetTransform.x, y: targetTransform.y + 0.06, z: targetTransform.z },
      toastMessage: `🥕 ${source.name} est prêt(e) sur ${target.name} à être émincé(e) finement !`,
      particleType: 'chop'
    };
  }

  // 3. CUISSON & MIJOTAGE : Ingrédient ou Ustensile dans Cocotte / Poêle / Marmite / Casserole
  const isCookware = matchEntityKeyword(target, ['cocotte', 'poele', 'marmite', 'casserole', 'wok', 'four', 'stove']);
  const isUtensil = matchEntityKeyword(source, ['spatule', 'fouet', 'cuillere', 'louche']);
  if (isCookware && (isFoodIngredient || isUtensil)) {
    return {
      type: 'cook_simmer',
      sourceEntity: source,
      targetEntity: target,
      label: isUtensil ? 'Remuer et mélanger la cuisson' : 'Plonger pour mijotage thermal',
      icon: '🥘',
      sound: isUtensil ? 'stir_whisk' : 'sizzle_cook',
      hapticFeedback: 'warning_shock',
      snapPosition: { x: targetTransform.x, y: targetTransform.y + 0.08, z: targetTransform.z },
      toastMessage: isUtensil
        ? `🥄 ${source.name} remue harmonieusement la préparation dans ${target.name} !`
        : `🥘 ${source.name} plonge dans ${target.name} : infusion thermique et fusion des arômes !`,
      particleType: 'steam'
    };
  }

  // 4. VERSEMENT & FLUIDES : Bouteille / Carafe / Pichet / Théière vers Verre / Tasse / Bol
  const isLiquidSource = matchEntityKeyword(source, ['bouteille', 'carafe', 'pichet', 'theiere', 'flacon', 'pot', 'lait', 'vinaigre', 'vin', 'huile']);
  const isLiquidReceiver = matchEntityKeyword(target, ['verre', 'tasse', 'coupe', 'bol', 'mug', 'coquetier', 'assiette']);
  if (isLiquidSource && isLiquidReceiver) {
    return {
      type: 'pour_liquid',
      sourceEntity: source,
      targetEntity: target,
      label: 'Verser le liquide avec précision',
      icon: '🍶',
      sound: 'pour_water',
      hapticFeedback: 'subtle_tap',
      snapPosition: { x: targetTransform.x, y: targetTransform.y + 0.12, z: targetTransform.z },
      toastMessage: `🍶 Versement délicat : ${source.name} remplit ${target.name} avec un filet continu !`,
      particleType: 'splash'
    };
  }

  // 4b. DÉGLAÇAGE & ARROSAGE CULINAIRE : Bouteille de vin / Huile d’olive vers Cocotte / Poêle
  if (isLiquidSource && isCookware) {
    return {
      type: 'pour_liquid',
      sourceEntity: source,
      targetEntity: target,
      label: 'Déglacer et arroser la cuisson',
      icon: '🍷',
      sound: 'pour_water',
      hapticFeedback: 'warning_shock',
      snapPosition: { x: targetTransform.x, y: targetTransform.y + 0.14, z: targetTransform.z },
      toastMessage: `🍷 Déglaçage aromatique : ${source.name} arrose ${target.name} et infuse instantanément le bouillon !`,
      particleType: 'steam'
    };
  }

  // 5. LECTURE & ÉTUDE SPATIALE : Livre / Codex / Journal / Tablette / Plan sur Pupitre / Table / Bureau / Étagère / Bibliothèque
  const isBookOrDoc = matchEntityKeyword(source, ['livre', 'book', 'codex', 'journal', 'cahier', 'document', 'parchemin', 'recette', 'plan', 'dossier', 'blueprint', 'porte-documents']);
  const isReadingSurface = matchEntityKeyword(target, ['pupitre', 'lectern', 'bureau', 'table', 'podium', 'etagere', 'socle', 'bibliotheque', 'bookshelf', 'etagere']);
  if (isBookOrDoc && isReadingSurface) {
    return {
      type: 'read_study',
      sourceEntity: source,
      targetEntity: target,
      label: 'Disposer le document en mode consultation',
      icon: '📖',
      sound: 'chime',
      hapticFeedback: 'subtle_tap',
      snapPosition: { x: targetTransform.x, y: targetTransform.y + 0.06, z: targetTransform.z },
      toastMessage: `📖 ${source.name} est disposé sur ${target.name} pour étude spatiale approfondie !`,
      particleType: 'glow'
    };
  }

  // 5b. ANALYSE SCIENTIFIQUE & OBSERVATION : Lame de microscope, Échantillon, Fiole vers Microscope ou Paillasse
  const isSpecimenOrSlide = matchEntityKeyword(source, ['lame', 'slide', 'echantillon', 'specimen', 'petri', 'fiole', 'tube', 'cellule', 'adn']);
  const isMicroscopeTarget = matchEntityKeyword(target, ['microscope', 'paillasse', 'laboratoire', 'analyseur']);
  if (isSpecimenOrSlide && isMicroscopeTarget) {
    return {
      type: 'read_study',
      sourceEntity: source,
      targetEntity: target,
      label: 'Placer l’échantillon sous l’objectif optique',
      icon: '🔬',
      sound: 'switch_click',
      hapticFeedback: 'snap_connect',
      snapPosition: { x: targetTransform.x, y: targetTransform.y + 0.16, z: targetTransform.z },
      toastMessage: `🔬 ${source.name} est sous l’objectif de ${target.name} : micrographie confocale active !`,
      particleType: 'glow'
    };
  }
  const isFlameSource = matchEntityKeyword(source, ['bougie', 'candle', 'allumette', 'briquet', 'flamme', 'torche']);
  const isCombustible = matchEntityKeyword(target, ['feu', 'campfire', 'lanterne', 'lantern', 'cheminee', 'poele']);
  if (isFlameSource && isCombustible) {
    return {
      type: 'ignite_fire',
      sourceEntity: source,
      targetEntity: target,
      label: 'Allumer et embraser le foyer',
      icon: '🔥',
      sound: 'ignite_fire',
      hapticFeedback: 'warning_shock',
      snapPosition: { x: targetTransform.x, y: targetTransform.y + 0.08, z: targetTransform.z },
      toastMessage: `🔥 Transfert thermique : ${source.name} embrase ${target.name} d’une lumière chaleureuse !`,
      particleType: 'spark'
    };
  }

  // 7. SÉCURITÉ & CIRCUITS : Clé / Badge / Batterie vers Serrure / Coffre / Console / Terminal / Cockpit
  const isKeyOrBattery = matchEntityKeyword(source, [
    'cle', 'key', 'badge', 'carte', 'batterie', 'battery', 'jeton', 'token',
    'telecommande', 'fob', 'smart_key', 'transpondeur'
  ]);
  const isLockOrTerminal = matchEntityKeyword(target, [
    'serrure', 'lock', 'coffre', 'chest', 'porte', 'door', 'console', 'terminal', 'socket',
    'recepteur', 'cockpit', 'dock', 'auth', 'authentification', 'lecteur', 'transpondeur', 'demarrage', 'ignition', 'contact', 'zone-interactive'
  ]);
  if (isKeyOrBattery && isLockOrTerminal) {
    return {
      type: 'unlock_circuit',
      sourceEntity: source,
      targetEntity: target,
      label: 'Connecter et déverrouiller le mécanisme',
      icon: '🔑',
      sound: 'switch_click',
      hapticFeedback: 'snap_connect',
      snapPosition: { x: targetTransform.x, y: targetTransform.y + 0.05, z: targetTransform.z },
      toastMessage: `⚡ Connexion validée : ${source.name} active et déverrouille ${target.name} !`,
      particleType: 'chime'
    };
  }

  // 8. DRESSAGE & CONTENEMENT GÉNÉRIQUE : Assiette, Plateau de service, Panier, Socle (hors plateau tournant de véhicule)
  const isTurntableOrVehicle = matchEntityKeyword(target, ['tournant', 'turntable', 'showroom', 'voiture', 'supercar']);
  const receptacleKeywords = ['assiette', 'plate', 'plateau', 'tray', 'panier', 'basket', 'socle', 'podium'];
  const isReceptacle = !isTurntableOrVehicle && matchEntityKeyword(target, receptacleKeywords);
  const isSourceAlsoReceptacle = matchEntityKeyword(source, receptacleKeywords);
  if (isReceptacle && (!target.capabilities?.some(c => c.type === 'draggable') || !isSourceAlsoReceptacle)) {
    return {
      type: 'stack_contain',
      sourceEntity: source,
      targetEntity: target,
      label: `Dresser sur ${target.name}`,
      icon: '🍽️',
      sound: 'chime',
      hapticFeedback: 'subtle_tap',
      snapPosition: { x: targetTransform.x, y: targetTransform.y + 0.045, z: targetTransform.z },
      toastMessage: `✨ ${source.name} est délicatement dressé(e) sur ${target.name} !`,
      particleType: 'chime'
    };
  }

  return null;
}

/**
 * Recherche l'entité compatible la plus proche dans le rayon de capture
 */
export function findNearestCausalityAffordance(
  draggedEntity: EntitySpec,
  allEntities: EntitySpec[] | Record<string, EntitySpec>,
  currentWorldPos: { x: number; y: number; z: number } | [number, number, number],
  maxSnapDist = 0.42
): CausalityAffordance | null {
  let bestAffordance: CausalityAffordance | null = null;
  let minDistance = maxSnapDist;
  const entityList = Array.isArray(allEntities) ? allEntities : Object.values(allEntities);
  const normCurrentPos = normalizeVec3(currentWorldPos, { x: 0, y: 0, z: 0 });

  for (const other of entityList) {
    if (other.id === draggedEntity.id) continue;

    const rawOtherPos =
      (other as any).transform?.position ||
      other.capabilities?.find(c => c.type === 'transform')?.position;
    if (!rawOtherPos) continue;
    const otherPos = normalizeVec3(rawOtherPos, { x: 0, y: 0, z: 0 });

    const dy = Math.abs(normCurrentPos.y - otherPos.y);
    if (dy > 0.85) continue;

    const dist = Math.hypot(normCurrentPos.x - otherPos.x, normCurrentPos.z - otherPos.z);
    if (dist <= maxSnapDist) {
      const affordance = evaluateSpatialCausality(draggedEntity, other);
      if (affordance) {
        const isCurrentGeneric = bestAffordance?.type === 'stack_contain';
        const isNewSpecific = affordance.type !== 'stack_contain';
        if (
          !bestAffordance ||
          (isCurrentGeneric && isNewSpecific) ||
          (isCurrentGeneric === !isNewSpecific && dist < minDistance)
        ) {
          minDistance = dist;
          bestAffordance = affordance;
        }
      }
    }
  }

  return bestAffordance;
}
