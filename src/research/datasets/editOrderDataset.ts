// src/research/datasets/editOrderDataset.ts
// Dataset canonique du programme de recherche WorldPilot Edit-Order Sensitivity (Version 1.0).
// Comprend 24 cas certifiés répartis sur 12 familles de mondes exécutables multi-couches.

import type { EditOrderExperimentCase } from '../editOrder/experimentTypes';

export const EDIT_ORDER_BENCHMARK_CASES: EditOrderExperimentCase[] = [
  // ==========================================================================
  // FAMILLE 1 : MAINTENANCE INDUSTRIELLE
  // ==========================================================================
  {
    id: 'WP-EO-001',
    worldCategory: 'Maintenance industrielle',
    worldCategoryEn: 'Industrial Maintenance',
    initialWorldPrompt: 'Crée un atelier de maintenance industrielle avec un générateur diesel, un bouton d\'arrêt d\'urgence sur le pupitre, une porte coupe-feu et une zone de sécurité.',
    initialWorldPromptEn: 'Create an industrial maintenance workshop with a diesel generator, an emergency stop button on the desk, a fire door, and a safety zone.',
    editA: 'Déplace le bouton d\'arrêt d\'urgence sur le mur de contrôle à côté de la porte coupe-feu',
    editAEn: 'Move the emergency stop button to the control wall next to the fire door',
    editB: 'Connecte le bouton d\'arrêt d\'urgence pour qu\'il coupe le générateur et déverrouille immédiatement la porte coupe-feu',
    editBEn: 'Wire the emergency stop button to cut the generator and immediately unlock the fire door',
    editCategoryA: 'MOVE',
    editCategoryB: 'CONNECT_CAUSAL',
    expectedCompatibility: 'compatible',
    manualValidation: {
      approved: true,
      reviewerIds: ['expert_sys_1', 'human_annotator_2'],
      notes: 'Paire classique Déplacement + Reconnexion causale. Ordre AB versus BA teste la synchronisation des triggers.'
    },
    seed: 101,
    tags: ['causal_link', 'spatial_trigger', 'safety_door'],
    split: 'dev'
  },
  {
    id: 'WP-EO-002',
    worldCategory: 'Maintenance industrielle',
    initialWorldPrompt: 'Crée une salle des machines avec une armoire électrique haute tension, une balise lumineuse d\'alarme et une barrière de protection jaune.',
    editA: 'Remplace la barrière de protection jaune par un sas d\'accès biométrique sécurisé',
    editB: 'Associe la balise lumineuse à la détection d\'intrusion dans la zone de haute tension',
    editCategoryA: 'REPLACE',
    editCategoryB: 'CONNECT_CAUSAL',
    expectedCompatibility: 'compatible',
    manualValidation: {
      approved: true,
      reviewerIds: ['expert_sys_1', 'human_annotator_1'],
      notes: 'Remplacement de géométrie + trigger de sécurité.'
    },
    seed: 102,
    tags: ['security', 'replace_geometry', 'sensor_trigger'],
    split: 'dev'
  },

  // ==========================================================================
  // FAMILLE 2 : LABORATOIRE CHIMIQUE
  // ==========================================================================
  {
    id: 'WP-EO-003',
    worldCategory: 'Laboratoire chimique',
    initialWorldPrompt: 'Crée un laboratoire de chimie avec une paillasse carrelée, un brûleur Bunsen, une fiole jaugée d\'acide sulfurique et un bac de neutralisation.',
    editA: 'Déplace la fiole d\'acide sur le plateau supérieur de la hotte aspirante',
    editB: 'Règle la température de consigne du brûleur Bunsen à 250 degrés avec flamme d\'oxydation bleue',
    editCategoryA: 'MOVE',
    editCategoryB: 'CHANGE_PHYSICS',
    expectedCompatibility: 'compatible',
    manualValidation: {
      approved: true,
      reviewerIds: ['chem_rev_1', 'chem_rev_2'],
      notes: 'Déplacement de réactif + variation d\'état thermodynamique.'
    },
    seed: 201,
    tags: ['chemistry', 'thermal_state', 'hazardous_material'],
    split: 'dev'
  },
  {
    id: 'WP-EO-004',
    worldCategory: 'Laboratoire chimique',
    initialWorldPrompt: 'Crée une station d\'analyse chimique avec un porte-tubes à essai, un microscope optique et une fiole Erlenmeyer.',
    editA: 'Ajoute un flacon réactif de nitrate d\'argent sur la paillasse à droite du microscope',
    editB: 'Configure une règle de précipitation blanche lors du mélange entre la fiole et le nitrate d\'argent',
    editCategoryA: 'ADD',
    editCategoryB: 'CONNECT_CAUSAL',
    expectedCompatibility: 'compatible',
    manualValidation: {
      approved: true,
      reviewerIds: ['chem_rev_1', 'expert_sys_2'],
      notes: 'Création d\'entité réactive puis liaison causale de synthèse.'
    },
    seed: 202,
    tags: ['entity_creation', 'reaction_rule', 'chemical_synthesis'],
    split: 'val'
  },

  // ==========================================================================
  // FAMILLE 3 : ATELIER PÂTISSERIE & CUISSON DE COOKIES
  // ==========================================================================
  {
    id: 'WP-EO-005',
    worldCategory: 'Atelier Pâtisserie & Culinaire',
    initialWorldPrompt: 'Crée un atelier de pâtisserie avec un plan de travail en marbre blanc, un saladier de pâte avec fouet, une plaque de cuisson garnie de cookies et un four professionnel.',
    editA: 'Déplace la plaque de cookies vers le centre du plan de travail en marbre',
    editB: 'Règle la cuisson du four à 175 degrés avec minuterie de 12 minutes pour caramélisation dorée',
    editCategoryA: 'MOVE',
    editCategoryB: 'CHANGE_PHYSICS',
    expectedCompatibility: 'compatible',
    manualValidation: {
      approved: true,
      reviewerIds: ['culinary_exp_1', 'human_annotator_1'],
      notes: 'Alignement spatial des ustensiles + paramétrage thermique du four.'
    },
    seed: 301,
    tags: ['baking_cookies', 'spatial_alignment', 'oven_temperature'],
    split: 'dev'
  },
  {
    id: 'WP-EO-006',
    worldCategory: 'Atelier Pâtisserie & Culinaire',
    initialWorldPrompt: 'Crée une cuisine de restaurant avec un îlot central, une balance de précision électronique, un sac de farine T55 et un rouleau à pâtisserie en hêtre.',
    editA: 'Pose le sac de farine directement sur la balance de précision',
    editB: 'Active la tare automatique de la balance pour calibrer à zéro gramme',
    editCategoryA: 'MOVE',
    editCategoryB: 'CHANGE_TRIGGER',
    expectedCompatibility: 'compatible',
    manualValidation: {
      approved: true,
      reviewerIds: ['culinary_exp_1', 'expert_sys_1'],
      notes: 'Contact physique avec balance + déclenchement de tare.'
    },
    seed: 302,
    tags: ['weighing_scale', 'tare_calibration', 'physical_contact'],
    split: 'test_locked'
  },

  // ==========================================================================
  // FAMILLE 4 : AMEUBLEMENT & DIY (MONTAGE IKEA)
  // ==========================================================================
  {
    id: 'WP-EO-007',
    worldCategory: 'Ameublement & DIY',
    initialWorldPrompt: 'Crée un atelier de montage de meuble IKEA avec un tapis de protection au sol, un panneau d\'étagère pré-percé, un sachet de tourillons en bois et une clé Allen 4mm.',
    editA: 'Déplace le sachet de tourillons sur le bord gauche du tapis de montage',
    editB: 'Enclenche les deux premiers tourillons en bois dans les perforations latérales du panneau',
    editCategoryA: 'MOVE',
    editCategoryB: 'CONNECT_CAUSAL',
    expectedCompatibility: 'compatible',
    manualValidation: {
      approved: true,
      reviewerIds: ['diy_expert_1', 'human_annotator_2'],
      notes: 'Déplacement de quincaillerie + assemblage géométrique dépendant.'
    },
    seed: 401,
    tags: ['ikea_assembly', 'dowel_insertion', 'hardware_handling'],
    split: 'dev'
  },
  {
    id: 'WP-EO-008',
    worldCategory: 'Ameublement & DIY',
    initialWorldPrompt: 'Crée une pièce à meubler avec une étagère à mi-montage, une équerre murale en acier zingué et une perceuse visseuse sans fil.',
    editA: 'Positionne l\'équerre murale sur le chant supérieur de l\'étagère',
    editB: 'Ajoute une règle d\'interdiction de déplacement du meuble une fois l\'équerre fixée',
    editCategoryA: 'MOVE',
    editCategoryB: 'CHANGE_PERMISSION',
    expectedCompatibility: 'compatible',
    manualValidation: {
      approved: true,
      reviewerIds: ['diy_expert_1', 'safety_auditor_1'],
      notes: 'Fixation anti-basculement + verrouillage de cinématique.'
    },
    seed: 402,
    tags: ['anti_tip_safety', 'kinematic_freeze', 'wall_bracket'],
    split: 'val'
  },

  // ==========================================================================
  // FAMILLE 5 : GAME DESIGN LAB & PLAYTEST IA
  // ==========================================================================
  {
    id: 'WP-EO-009',
    worldCategory: 'Game Design Lab & Escape Room',
    initialWorldPrompt: 'Crée une arène de jeu de plateforme 3D avec un plot de départ joueur, une plateforme flottante suspendue, une gemme dorée collectable et un portail de victoire.',
    editA: 'Surélève la plateforme flottante de 1.5 mètre dans les airs',
    editB: 'Associe l\'ouverture du portail de victoire à la collecte préalable de la gemme dorée',
    editCategoryA: 'MOVE',
    editCategoryB: 'CHANGE_QUEST',
    expectedCompatibility: 'compatible',
    manualValidation: {
      approved: true,
      reviewerIds: ['gamedev_rev_1', 'human_annotator_1'],
      notes: 'Élévation de plateforme (accessibilité saut) + condition de quête.'
    },
    seed: 501,
    tags: ['platformer', 'jump_reachability', 'quest_condition'],
    split: 'dev'
  },
  {
    id: 'WP-EO-010',
    worldCategory: 'Game Design Lab & Escape Room',
    initialWorldPrompt: 'Crée une salle d\'escape game avec un coffre verrouillé par digicode, une torche murale vacillante et un grimoire ancien posé sur un lutrin.',
    editA: 'Change le code secret du coffre fort pour afficher la combinaison 7-4-2',
    editB: 'Fais apparaître la combinaison 7-4-2 gravée sur les pages du grimoire ancien sous la lumière de la torche',
    editCategoryA: 'CHANGE_TRIGGER',
    editCategoryB: 'CONNECT_CAUSAL',
    expectedCompatibility: 'compatible',
    manualValidation: {
      approved: true,
      reviewerIds: ['gamedev_rev_1', 'expert_sys_2'],
      notes: 'Configuration du verrou + révélation d\'indice d\'énigme.'
    },
    seed: 502,
    tags: ['escape_puzzle', 'clue_revelation', 'digicode_lock'],
    split: 'test_locked'
  },

  // ==========================================================================
  // FAMILLE 6 : ATELIER AUTOMOBILE (BATTERIE 12V)
  // ==========================================================================
  {
    id: 'WP-EO-011',
    worldCategory: 'Atelier mécanique',
    initialWorldPrompt: 'Crée un atelier mécanique avec une voiture capot ouvert, un bac à batterie sous le capot, une batterie 12V neuve sur l\'établi et un multimètre numérique.',
    editA: 'Déplace la batterie 12V dans le bac à batterie du compartiment moteur',
    editB: 'Connecte les bornes rouge et noire du multimètre pour afficher une tension de 12.8 volts',
    editCategoryA: 'MOVE',
    editCategoryB: 'CONNECT_CAUSAL',
    expectedCompatibility: 'compatible',
    manualValidation: {
      approved: true,
      reviewerIds: ['auto_expert_1', 'human_annotator_2'],
      notes: 'Installation mécanique de batterie + mesure électrique multimètre.'
    },
    seed: 601,
    tags: ['car_battery', 'voltage_measurement', 'engine_bay'],
    split: 'dev'
  },
  {
    id: 'WP-EO-012',
    worldCategory: 'Atelier mécanique',
    initialWorldPrompt: 'Crée une baie de diagnostic automobile avec un pont élévateur hydraulique, une berline sur le pont et une boîte à clés à cliquet.',
    editA: 'Monte le pont élévateur hydraulique à 1.80 mètre du sol',
    editB: 'Active la goupille mécanique de sécurité antichute du pont élévateur',
    editCategoryA: 'MOVE',
    editCategoryB: 'CHANGE_PERMISSION',
    expectedCompatibility: 'compatible',
    manualValidation: {
      approved: true,
      reviewerIds: ['auto_expert_1', 'safety_auditor_1'],
      notes: 'Levage de véhicule + verrouillage de sécurité mécanique.'
    },
    seed: 602,
    tags: ['hydraulic_lift', 'safety_lock', 'fall_prevention'],
    split: 'val'
  },

  // ==========================================================================
  // FAMILLE 7 : BOUTIQUE LUXE & MAROQUINERIE HAUTE COUTURE
  // ==========================================================================
  {
    id: 'WP-EO-013',
    worldCategory: 'Musée interactif & Haute Couture',
    initialWorldPrompt: 'Crée un salon de maroquinerie de luxe avec un comptoir en marbre noir, un sac Monogram en cuir naturel, une vitrine éclairée et un présentoir VIP.',
    editA: 'Pose le sac Monogram sur le podium VIP sous les spots directionnels',
    editB: 'Active l\'éclairage d\'accentuation chaud et le zoom d\'inspection des surpiqûres du sac',
    editCategoryA: 'MOVE',
    editCategoryB: 'CHANGE_TRIGGER',
    expectedCompatibility: 'compatible',
    manualValidation: {
      approved: true,
      reviewerIds: ['luxury_expert_1', 'human_annotator_1'],
      notes: 'Positionnement sur podium + déclenchement de caméra macro et lumière.'
    },
    seed: 701,
    tags: ['luxury_retail', 'spotlight_trigger', 'craftsmanship_zoom'],
    split: 'dev'
  },
  {
    id: 'WP-EO-014',
    worldCategory: 'Musée interactif & Haute Couture',
    initialWorldPrompt: 'Crée une boutique de prêt-à-porter de créateur avec un portant en laiton doré, un mannequin de couture haute couture et un miroir en pied sans tain.',
    editA: 'Habille le mannequin de couture avec le manteau en cachemire beige',
    editB: 'Oriente le miroir en pied face au mannequin avec un angle de 15 degrés',
    editCategoryA: 'REPLACE',
    editCategoryB: 'ROTATE',
    expectedCompatibility: 'compatible',
    manualValidation: {
      approved: true,
      reviewerIds: ['luxury_expert_1', 'expert_sys_2'],
      notes: 'Habillage de mannequin + orientation de miroir de réflexion.'
    },
    seed: 702,
    tags: ['fashion_mannequin', 'mirror_alignment', 'cashmere_coat'],
    split: 'val'
  },

  // ==========================================================================
  // FAMILLE 8 : STATION SPATIALE ORBITALE
  // ==========================================================================
  {
    id: 'WP-EO-015',
    worldCategory: 'Station spatiale orbitale',
    initialWorldPrompt: 'Crée une coupole d\'observation orbitale avec une baie vitrée panoramique sur la Terre, une console de télémétrie spatiale, un casque EVA et un sas étanche.',
    editA: 'Verrouille la porte du sas étanche en mode dépressurisation extérieure',
    editB: 'Affiche la trajectoire orbitale de réentrée sur l\'écran holographique de la console',
    editCategoryA: 'CHANGE_PERMISSION',
    editCategoryB: 'CHANGE_TRIGGER',
    expectedCompatibility: 'compatible',
    manualValidation: {
      approved: true,
      reviewerIds: ['space_expert_1', 'human_annotator_2'],
      notes: 'Sécurité de sas orbital + projection télémétrique.'
    },
    seed: 801,
    tags: ['orbital_station', 'airlock_seal', 'telemetry_display'],
    split: 'dev'
  },
  {
    id: 'WP-EO-016',
    worldCategory: 'Station spatiale orbitale',
    initialWorldPrompt: 'Crée un module d\'amarrage spatial avec un bras robotique Canadarm, un adaptateur de sas universel et un panneau solaire articulé.',
    editA: 'Déploie le panneau solaire articulé avec un angle d\'orientation de 45 degrés vers le Soleil',
    editB: 'Positionne l\'adaptateur de sas universel dans l\'axe de capture du bras robotique',
    editCategoryA: 'ROTATE',
    editCategoryB: 'MOVE',
    expectedCompatibility: 'compatible',
    manualValidation: {
      approved: true,
      reviewerIds: ['space_expert_1', 'expert_sys_1'],
      notes: 'Orientation de capture solaire + alignement géométrique d\'amarrage.'
    },
    seed: 802,
    tags: ['solar_array', 'robotic_docking', 'kinematic_alignment'],
    split: 'test_locked'
  },

  // ==========================================================================
  // FAMILLE 9 : MAISON INTELLIGENTE (SMART HOME & IOT)
  // ==========================================================================
  {
    id: 'WP-EO-017',
    worldCategory: 'Maison intelligente',
    initialWorldPrompt: 'Crée un salon domotique contemporain avec un canapé d\'angle, un lampadaire connecté, un thermostat d\'ambiance mural et une enceinte vocale intelligente.',
    editA: 'Diminue l\'intensité du lampadaire connecté à 30% en blanc chaud tamisé',
    editB: 'Règle le thermostat mural à 20 degrés Celsius en mode soirée confort',
    editCategoryA: 'CHANGE_PHYSICS',
    editCategoryB: 'CHANGE_PHYSICS',
    expectedCompatibility: 'compatible',
    manualValidation: {
      approved: true,
      reviewerIds: ['iot_expert_1', 'human_annotator_1'],
      notes: 'Deux consignes d\'ambiance indépendantes qui peuvent interagir sur le confort global.'
    },
    seed: 901,
    tags: ['smart_home', 'ambient_lighting', 'thermostat_comfort'],
    split: 'dev'
  },
  {
    id: 'WP-EO-018',
    worldCategory: 'Maison intelligente',
    initialWorldPrompt: 'Crée une cuisine domotique avec une cafetière connectée, un distributeur d\'eau fraîche filtrée et un panneau de commande mural tactile.',
    editA: 'Place la tasse en céramique blanche sous la buse de la cafetière connectée',
    editB: 'Programme l\'infusion d\'un café expresso intense de 40 ml lors de la détection de la tasse',
    editCategoryA: 'MOVE',
    editCategoryB: 'CONNECT_CAUSAL',
    expectedCompatibility: 'compatible',
    manualValidation: {
      approved: true,
      reviewerIds: ['iot_expert_1', 'expert_sys_2'],
      notes: 'Positionnement de récepteur + liaison causale de déclenchement d\'infusion.'
    },
    seed: 902,
    tags: ['smart_coffee', 'proximity_trigger', 'beverage_dispensing'],
    split: 'val'
  },

  // ==========================================================================
  // FAMILLE 10 : ÉCOLE / LABORATOIRE PÉDAGOGIQUE
  // ==========================================================================
  {
    id: 'WP-EO-019',
    worldCategory: 'École / laboratoire pédagogique',
    initialWorldPrompt: 'Crée une salle de classe interactive avec un tableau blanc mural, un bureau de professeur, 4 tables d\'élèves et un globe terrestre en rotation.',
    editA: 'Déplace le globe terrestre sur le coin avant droit du bureau du professeur',
    editB: 'Affiche sur le tableau blanc interactif la carte des fuseaux horaires synchronisée avec le globe',
    editCategoryA: 'MOVE',
    editCategoryB: 'CONNECT_CAUSAL',
    expectedCompatibility: 'compatible',
    manualValidation: {
      approved: true,
      reviewerIds: ['edu_expert_1', 'human_annotator_2'],
      notes: 'Déplacement de support didactique + synchronisation cartographique.'
    },
    seed: 1001,
    tags: ['classroom_pedagogy', 'globe_sync', 'whiteboard_display'],
    split: 'dev'
  },
  {
    id: 'WP-EO-020',
    worldCategory: 'École / laboratoire pédagogique',
    initialWorldPrompt: 'Crée une salle de cours de physique avec un pendule oscillant, un banc optique avec lentille convergente et une source lumineuse laser rouge.',
    editA: 'Aligne la lentille convergente au foyer principal à 20 cm de la source laser',
    editB: 'Ajoute un écran récepteur blanc pour visualiser le point focal lumineux',
    editCategoryA: 'MOVE',
    editCategoryB: 'ADD',
    expectedCompatibility: 'compatible',
    manualValidation: {
      approved: true,
      reviewerIds: ['edu_expert_1', 'expert_sys_1'],
      notes: 'Alignement optique géométrique + ajout de détecteur visuel.'
    },
    seed: 1002,
    tags: ['optics_bench', 'focal_alignment', 'laser_projection'],
    split: 'test_locked'
  },

  // ==========================================================================
  // FAMILLE 11 : ENTREPÔT & ZONE LOGISTIQUE
  // ==========================================================================
  {
    id: 'WP-EO-021',
    worldCategory: 'Entrepôt',
    initialWorldPrompt: 'Crée une zone logistique d\'entrepôt avec un rack de stockage lourd à palettes, un chariot élévateur, un bac de tri RFID et une palette de cartons scellés.',
    editA: 'Charge la palette de cartons sur les fourches du chariot élévateur',
    editB: 'Active le scan RFID automatique au franchissement du portique de quai',
    editCategoryA: 'MOVE',
    editCategoryB: 'CONNECT_CAUSAL',
    expectedCompatibility: 'compatible',
    manualValidation: {
      approved: true,
      reviewerIds: ['logistics_expert_1', 'human_annotator_1'],
      notes: 'Chargement physique de palette + activation de portique RFID.'
    },
    seed: 1101,
    tags: ['logistics', 'forklift_pallet', 'rfid_gateway'],
    split: 'dev'
  },
  {
    id: 'WP-EO-022',
    worldCategory: 'Entrepôt',
    initialWorldPrompt: 'Crée un quai d\'expédition avec un convoyeur à rouleaux motorisé, un robot de tri AGV et un conteneur maritime ouvert.',
    editA: 'Augmente la vitesse d\'avancement du convoyeur à rouleaux à 1.2 mètre par seconde',
    editB: 'Définit une trajectoire de contournement du convoyeur pour le robot de tri AGV',
    editCategoryA: 'CHANGE_PHYSICS',
    editCategoryB: 'CHANGE_NAVIGATION',
    expectedCompatibility: 'compatible',
    manualValidation: {
      approved: true,
      reviewerIds: ['logistics_expert_1', 'safety_auditor_1'],
      notes: 'Vitesse de convoyeur physique + mise à jour du navmesh / trajectoire AGV.'
    },
    seed: 1102,
    tags: ['conveyor_speed', 'agv_navmesh', 'collision_clearance'],
    split: 'val'
  },

  // ==========================================================================
  // FAMILLE 12 : CENTRE MÉDICAL SIMULÉ
  // ==========================================================================
  {
    id: 'WP-EO-023',
    worldCategory: 'Centre médical simulé',
    initialWorldPrompt: 'Crée une salle de réanimation hospitalière avec un lit médicalisé, un chariot d\'urgence avec défibrillateur, un moniteur multiparamétrique ECG et un pied à perfusion.',
    editA: 'Rapproche le chariot de réanimation au chevet gauche du lit médicalisé',
    editB: 'Connecte les électrodes ECG du patient pour afficher le tracé cardiaque sur le moniteur',
    editCategoryA: 'MOVE',
    editCategoryB: 'CONNECT_CAUSAL',
    expectedCompatibility: 'compatible',
    manualValidation: {
      approved: true,
      reviewerIds: ['medical_expert_1', 'human_annotator_2'],
      notes: 'Positionnement ergonomique soignant + télémétrie vitale ECG.'
    },
    seed: 1201,
    tags: ['medical_sim', 'crash_cart', 'ecg_telemetry'],
    split: 'dev'
  },
  {
    id: 'WP-EO-024',
    worldCategory: 'Centre médical simulé',
    initialWorldPrompt: 'Crée une pharmacie hospitalière sécurisée avec une armoire à pharmacie blindée, un lecteur de badge RFID et une table de préparation de seringues stériles.',
    editA: 'Verrouille l\'accès à l\'armoire à pharmacie aux seuls porteurs de badge médecin',
    editB: 'Ajoute un capteur de température interne d\'armoire déclenchant une alerte si T > 8 degrés',
    editCategoryA: 'CHANGE_PERMISSION',
    editCategoryB: 'CONNECT_CAUSAL',
    expectedCompatibility: 'compatible',
    manualValidation: {
      approved: true,
      reviewerIds: ['medical_expert_1', 'safety_auditor_1'],
      notes: 'Contrôle d\'accès sécurisé + invariant de chaîne du froid.'
    },
    seed: 1202,
    tags: ['cold_chain_safety', 'access_control', 'pharmacy_lock'],
    split: 'test_locked'
  }
];
