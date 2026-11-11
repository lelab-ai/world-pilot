// src/library/bagShowcase.ts
// Démonstrateur central Mindel / Web 3D :
// Le Sac à Dos Technique 42L & le Test de Capacité Spatiale (Laptop 15 pouces)
// Démontre la valeur ajoutée tangible de la 3D vs 2D :
// 1. Forme, volume et compartiments intérieurs visibles
// 2. États sémantiques ouverts / fermés (sans simulation physique inutile)
// 3. Test géométrique de capacité (« Mon laptop 15" rentre-t-il dedans ? »)
// 4. Relations spatiales en données (INSIDE, ATTACHED_TO, COMPATIBLE_WITH)
// 5. Recherche contextuelle d'accessoires compatibles

import type { WorldPatch, EntitySpec, RuleSpec, QuestSpec } from '../core/types';

export const BAG_SHOWCASE_EXPERIENCE_ID = 'mindel_bag_showcase';

export function createBagShowcasePatch(): WorldPatch {
  const entitiesCreated: EntitySpec[] = [];
  const rulesChanged: RuleSpec[] = [];

  // 1. L'Entité Sac Logique (42 Litres)
  const bagId = 'sac_nomade_42';
  entitiesCreated.push({
    id: bagId,
    name: 'Sac Nomade Pro 42L',
    state: 'closed',
    availableStates: ['closed', 'open'],
    capabilities: [
      {
        type: 'transform',
        position: { x: -0.18, y: 0.912, z: -0.02 },
        rotation: { x: 0, y: 0.15, z: 0 },
        scale: { x: 1, y: 1, z: 1 }
      },
      { type: 'collider' }
    ],
    visuals: {
      assetId: 'wp-sac-voyageur-42l',
      shape: 'box',
      color: '#1e293b',
      materialPreset: 'leather',
      roughness: 0.65,
      metalness: 0.1
    },
    physicalProperties: {
      dimensions: [0.34, 0.52, 0.24], // 34cm x 52cm x 24cm (Gabarit cabine IATA)
      capacityLiters: 42,
      weightKg: 1.35,
      sku: 'MIN-BAG-42-BLK',
      material: 'Nylon balistique 1680D & Cuir vegan déperlant',
      fitsMaxDimensions: [0.38, 0.03, 0.28] // Accepte un laptop jusqu'à 38 x 28 x 3 cm
    },
    resources: [
      { role: 'details', label: 'Fiche Technique & Matériaux', url: 'https://mindel.web3d/specs/bag-42' },
      { role: 'documentation', label: 'Normes Cabine IATA & Compagnies Aériennes', url: 'https://mindel.web3d/docs/cabin-standards' },
      { role: 'manual', label: 'Guide d’Entretien & Garantie 10 ans', url: 'https://mindel.web3d/care-guide' },
      { role: 'buy', label: 'Boutique Officielle · 189 €', url: 'https://mindel.web3d/shop/bag-42' }
    ],
    parts: [
      {
        id: 'part_laptop_sleeve',
        name: 'Compartiment PC 15-16" Rembourré',
        description: 'Manchon antichoc suspendu avec doublure polaire microfibre',
        capacityLiters: 4.5,
        fitsMaxDimensions: [0.38, 0.028, 0.27]
      },
      {
        id: 'part_main_cavity',
        name: 'Volume Principal Vêtements',
        description: 'Capacité 32L avec sangles de compression internes',
        capacityLiters: 32,
        fitsMaxDimensions: [0.34, 0.50, 0.22]
      },
      {
        id: 'part_side_bottle',
        name: 'Poche Gourde Élastique',
        description: 'Poche latérale zippée soufflet pour bouteille jusqu’à 1L',
        capacityLiters: 1.2,
        fitsMaxDimensions: [0.10, 0.30, 0.10]
      }
    ],
    fallback2D: {
      description: 'Sac à dos technique 42 Litres conçu pour les nomades numériques. Compartiment ordinateur suspendu 15.6", ouverture grand angle et volume cabine conforme.',
      specificationSheetUrl: 'https://mindel.web3d/specs/bag-42.pdf'
    }
  });

  // 2. L'Entité Ordinateur Portable 15.6 Pouces
  const laptopId = 'laptop_pro_15';
  entitiesCreated.push({
    id: laptopId,
    name: 'Ordinateur Pro 15.6"',
    state: 'default',
    capabilities: [
      {
        type: 'transform',
        position: { x: 0.20, y: 0.912, z: 0.05 },
        rotation: { x: 0, y: -0.2, z: 0 },
        scale: { x: 1, y: 1, z: 1 }
      },
      { type: 'draggable' },
      { type: 'collider' }
    ],
    visuals: {
      assetId: 'wp-ordinateur-portable',
      shape: 'box',
      color: '#94a3b8',
      materialPreset: 'metal_aluminum',
      roughness: 0.35,
      metalness: 0.75
    },
    physicalProperties: {
      dimensions: [0.355, 0.019, 0.245], // 35.5cm x 1.9cm x 24.5cm (Laptop 15.6 standard)
      weightKg: 1.82,
      sku: 'MIN-LAP-15-ALU',
      material: 'Aluminium anodisé CNC'
    },
    relations: [
      { type: 'compatible_with', targetId: bagId, metadata: { targetPart: 'part_laptop_sleeve' } }
    ],
    resources: [
      { role: 'details', label: 'Dimensions précises 355 x 245 x 19 mm', url: 'https://mindel.web3d/specs/laptop-15' }
    ],
    fallback2D: {
      description: 'PC Portable 15.6 pouces haute performance (35.5 x 24.5 x 1.9 cm).'
    }
  });

  // 3. Gourde Isotherme (Accessoire compatible)
  const bottleId = 'gourde_isotherme';
  entitiesCreated.push({
    id: bottleId,
    name: 'Gourde Isotherme 750ml',
    capabilities: [
      {
        type: 'transform',
        position: { x: -0.56, y: 0.912, z: 0.15 },
        scale: { x: 1, y: 1, z: 1 }
      },
      { type: 'draggable' },
      { type: 'collider' }
    ],
    visuals: {
      assetId: 'wp-gourde-isotherme',
      shape: 'cylinder',
      color: '#0284c7',
      roughness: 0.3,
      metalness: 0.5
    },
    physicalProperties: {
      dimensions: [0.08, 0.26, 0.08],
      capacityLiters: 0.75,
      weightKg: 0.32,
      material: 'Inox double paroi isolante'
    },
    relations: [
      { type: 'compatible_with', targetId: bagId, metadata: { targetPart: 'part_side_bottle' } }
    ]
  });

  // 4. Objet Incompatible pour démontrer le test négatif (Carton volumineux)
  const oversizedBoxId = 'carton_oversized';
  entitiesCreated.push({
    id: oversizedBoxId,
    name: 'Gros Carton Dépassant (Incompatible)',
    capabilities: [
      {
        type: 'transform',
        position: { x: 0.58, y: 0.912, z: -0.12 },
        scale: { x: 1, y: 1, z: 1 }
      },
      { type: 'draggable' },
      { type: 'collider' }
    ],
    visuals: {
      assetId: 'wp-carton-oversized',
      shape: 'box',
      color: '#b45309',
      roughness: 0.8,
      metalness: 0.05
    },
    physicalProperties: {
      dimensions: [0.46, 0.38, 0.32], // 46cm x 38cm x 32cm (Dépasse le gabarit du sac !)
      weightKg: 3.2
    }
  });

  // 5. Table de Présentation Épurée
  const tableId = 'table_showroom_mindel';
  entitiesCreated.push({
    id: tableId,
    name: 'Table de Présentation Studio',
    capabilities: [
      {
        type: 'transform',
        position: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 }
      },
      { type: 'collider' }
    ],
    visuals: {
      assetId: 'table',
      shape: 'box',
      color: '#334155',
      roughness: 0.4,
      metalness: 0.2
    }
  });

  // RÈGLE 1 : Bascule Ouvrir / Fermer le sac (Toggle State)
  rulesChanged.push({
    id: 'rule_toggle_bag_state',
    trigger: 'INTERACT',
    conditions: [{ type: 'is_source', sourceId: bagId }],
    actions: [
      { type: 'toggle_state', entityId: bagId },
      { type: 'play_sound', sound: 'switch_click' },
      { type: 'set_flag', flag: 'bag_opened_inspected', value: true },
      { type: 'show_warning', message: '🎒 Sac ouvert : Vous pouvez inspecter les compartiments intérieurs.' }
    ]
  });

  // RÈGLE 2 : Test de Capacité Spatiale du Laptop 15"
  rulesChanged.push({
    id: 'rule_test_laptop_capacity',
    trigger: 'DROP',
    conditions: [
      { type: 'is_source', sourceId: laptopId },
      { type: 'is_target', targetId: bagId }
    ],
    actions: [
      {
        type: 'test_spatial_capacity',
        sourceEntityId: laptopId,
        targetEntityId: bagId,
        partId: 'part_laptop_sleeve'
      },
      { type: 'set_flag', flag: 'laptop_capacity_verified', value: true }
    ]
  });

  // RÈGLE 3 : Test de Capacité de la Gourde
  rulesChanged.push({
    id: 'rule_test_bottle_capacity',
    trigger: 'DROP',
    conditions: [
      { type: 'is_source', sourceId: bottleId },
      { type: 'is_target', targetId: bagId }
    ],
    actions: [
      {
        type: 'set_relation',
        sourceEntityId: bottleId,
        targetEntityId: bagId,
        relation: { type: 'attached_to', targetId: bagId, metadata: { part: 'part_side_bottle' } }
      },
      { type: 'play_sound', sound: 'snap_connect' },
      { type: 'set_flag', flag: 'bottle_attached', value: true },
      { type: 'show_warning', message: '🧃 Gourde logée avec succès dans la poche latérale !' }
    ]
  });

  // RÈGLE 4 : Test de Capacité de l'Objet Trop Grand (Test Négatif d'encombrement)
  rulesChanged.push({
    id: 'rule_test_oversized_capacity',
    trigger: 'DROP',
    conditions: [
      { type: 'is_source', sourceId: oversizedBoxId },
      { type: 'is_target', targetId: bagId }
    ],
    actions: [
      {
        type: 'test_spatial_capacity',
        sourceEntityId: oversizedBoxId,
        targetEntityId: bagId
      }
    ]
  });

  // QUÊTE PÉDAGOGIQUE & E-COMMERCE : Valider le Gabarit 42L
  const questId = 'quest_mindel_bag_capacity';
  const quest: QuestSpec = {
    id: questId,
    title: 'Mindel : Test de Volume & Gabarit Spatiale 3D',
    description: 'Vérifier par la manipulation 3D si votre matériel informatique et vos accessoires rentrent dans le sac 42L.',
    category: 'formation',
    rewardSound: 'fanfare',
    currentStepIndex: 0,
    status: 'in_progress',
    steps: [
      {
        id: 'step_open_bag',
        title: 'Ouvrir le sac pour inspecter les compartiments',
        description: 'Cliquez sur le sac 42L pour basculer son état entre fermé et ouvert.',
        targetEntityId: bagId,
        requiredEvent: 'INTERACT',
        hint: 'Cliquez sur le Sac Nomade Pro 42L ou utilisez le bouton d’état.',
        completed: false
      },
      {
        id: 'step_insert_laptop',
        title: 'Tester si le Laptop 15.6" rentre dans le manchon',
        description: 'Faites glisser l’ordinateur portable sur le sac pour tester sa compatibilité géométrique.',
        targetEntityId: laptopId,
        targetZoneId: bagId,
        requiredEvent: `DROP:${laptopId}:${bagId}`,
        hint: 'Glissez-déposez le Laptop sur le sac pour déclencher le calcul spatial de gabarit.',
        completed: false
      },
      {
        id: 'step_attach_bottle',
        title: 'Loger la gourde dans la poche latérale',
        description: 'Glissez la gourde sur le sac pour établir la relation spatiale ATTACHED_TO.',
        targetEntityId: bottleId,
        targetZoneId: bagId,
        requiredEvent: `DROP:${bottleId}:${bagId}`,
        hint: 'Déposez la gourde sur le sac.',
        completed: false
      }
    ]
  };

  return {
    entitiesCreated,
    rulesChanged,
    invariantsAdded: [
      {
        id: 'inv_bag_laptop_safety',
        description: 'Un objet dépassant le gabarit maximal ne doit jamais être forcé dans le sac',
        condition: {
          type: 'never_state',
          stateFlag: 'capacity_test_carton_oversized_in_sac_nomade_42',
          requiredFlag: 'bag_expanded'
        }
      }
    ],
    questsAdded: [quest],
    activeQuestId: questId
  };
}
