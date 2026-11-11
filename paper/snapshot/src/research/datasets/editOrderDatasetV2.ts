// src/research/datasets/editOrderDatasetV2.ts
// Dataset officiel du programme de recherche WorldPilot Edit-Order Sensitivity (Version 2.0 - Publication Benchmark).
// Comprend 200 cas certifiés stratifiés : S1 (Direct), S2 (Indirect critique), S3 (Faux amis), S4 (Indépendance).
// Split stratifié : DEV (60%), VAL (20%), TEST_LOCKED (20%).

import type { EditOrderExperimentCaseV2 } from '../editOrder/v2/experimentTypesV2';

export const EDIT_ORDER_BENCHMARK_CASES_V2: EditOrderExperimentCaseV2[] = [
  {
    "id": "WP2-EO-001",
    "worldCategory": "Maintenance industrielle",
    "initialWorldPrompt": "Atelier avec pupitre, générateur diesel, bouton d'arrêt d'urgence et porte coupe-feu.",
    "editA": "Déplace le bouton d'arrêt d'urgence sur le mur de contrôle à côté de la porte coupe-feu",
    "editB": "Connecte le bouton d'arrêt d'urgence pour qu'il coupe le générateur et déverrouille la porte coupe-feu",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S1_Direct",
    "indirectType": "NONE",
    "dependencyDepth": 1,
    "entityOverlapScore": 0.85,
    "dependencyOverlapScore": 0.9,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_1",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S1_Direct (NONE) depth 1"
    },
    "seed": 1000,
    "tags": [
      "emergency_button",
      "generator",
      "door"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-002",
    "worldCategory": "Maintenance industrielle",
    "initialWorldPrompt": "Poste de soudure avec bras robotique, torche plasma et barrière optique.",
    "editA": "Remplace la torche plasma par une tête laser à fibre haute précision",
    "editB": "Calibre la puissance d'amorçage de la tête laser à 4500 watts",
    "editCategoryA": "REPLACE",
    "editCategoryB": "CHANGE_PHYSICS",
    "stratum": "S1_Direct",
    "indirectType": "NONE",
    "dependencyDepth": 1,
    "entityOverlapScore": 0.85,
    "dependencyOverlapScore": 0.9,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_2",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S1_Direct (NONE) depth 1"
    },
    "seed": 1001,
    "tags": [
      "welding_arm",
      "laser",
      "calibration"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-003",
    "worldCategory": "Maintenance industrielle",
    "initialWorldPrompt": "Sous-station électrique avec disjoncteur différentiel, transformateur et voyant LED.",
    "editA": "Déplace le disjoncteur différentiel sur le panneau latéral gauche",
    "editB": "Attribue au voyant LED l'affichage d'état actif du disjoncteur différentiel",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S1_Direct",
    "indirectType": "NONE",
    "dependencyDepth": 1,
    "entityOverlapScore": 0.85,
    "dependencyOverlapScore": 0.9,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_3",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S1_Direct (NONE) depth 1"
    },
    "seed": 1002,
    "tags": [
      "circuit_breaker",
      "led_indicator"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-004",
    "worldCategory": "Maintenance industrielle",
    "initialWorldPrompt": "Local compresseur avec manomètre analogique, vanne de décharge et cuve sous pression.",
    "editA": "Remplace la vanne de décharge manuelle par une électrovanne proportionnelle motorisée",
    "editB": "Configure le seuil d'ouverture de l'électrovanne proportionnelle à 8.5 bars",
    "editCategoryA": "REPLACE",
    "editCategoryB": "CHANGE_PHYSICS",
    "stratum": "S1_Direct",
    "indirectType": "NONE",
    "dependencyDepth": 1,
    "entityOverlapScore": 0.85,
    "dependencyOverlapScore": 0.9,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_1",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S1_Direct (NONE) depth 1"
    },
    "seed": 1003,
    "tags": [
      "solenoid_valve",
      "pressure_tank"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-005",
    "worldCategory": "Laboratoire chimique",
    "initialWorldPrompt": "Paillasse avec fiole jaugée d'acide chlorhydrique, bac de neutralisation et pipette.",
    "editA": "Déplace la fiole jaugée d'acide sur le plateau haut de l'agitateur magnétique",
    "editB": "Associe le renversement de la fiole jaugée d'acide au déclenchement de la sirène de neutralisation",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S1_Direct",
    "indirectType": "NONE",
    "dependencyDepth": 1,
    "entityOverlapScore": 0.85,
    "dependencyOverlapScore": 0.9,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_2",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S1_Direct (NONE) depth 1"
    },
    "seed": 1004,
    "tags": [
      "acid_flask",
      "spill_sensor"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-006",
    "worldCategory": "Laboratoire chimique",
    "initialWorldPrompt": "Hotte aspirante avec bec Bunsen, thermostat électronique et vanne de gaz.",
    "editA": "Déplace le bec Bunsen à l'intérieur de la hotte aspirante au fond à gauche",
    "editB": "Règle la vanne de gaz du bec Bunsen pour alimenter une flamme réductrice jaune à 300 degrés",
    "editCategoryA": "MOVE",
    "editCategoryB": "CHANGE_PHYSICS",
    "stratum": "S1_Direct",
    "indirectType": "NONE",
    "dependencyDepth": 1,
    "entityOverlapScore": 0.85,
    "dependencyOverlapScore": 0.9,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_3",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S1_Direct (NONE) depth 1"
    },
    "seed": 1005,
    "tags": [
      "bunsen_burner",
      "gas_valve"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-007",
    "worldCategory": "Laboratoire chimique",
    "initialWorldPrompt": "Armoire ventilée avec flacon de solvant organique et capteur de vapeurs toxiques.",
    "editA": "Déplace le flacon de solvant organique sur l'étagère métallique intermédiaire",
    "editB": "Lie la détection de fuite du flacon de solvant à l'activation de la ventilation forcée",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S1_Direct",
    "indirectType": "NONE",
    "dependencyDepth": 1,
    "entityOverlapScore": 0.85,
    "dependencyOverlapScore": 0.9,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_1",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S1_Direct (NONE) depth 1"
    },
    "seed": 1006,
    "tags": [
      "solvent_bottle",
      "vapor_sensor"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-008",
    "worldCategory": "Laboratoire chimique",
    "initialWorldPrompt": "Centrifugeuse de paillasse avec rotor 12 tubes et couvercle transparent.",
    "editA": "Remplace le rotor 12 tubes de la centrifugeuse par un rotor haute vitesse 24 tubes",
    "editB": "Règle la vitesse limite du rotor haute vitesse à 14000 tours par minute",
    "editCategoryA": "REPLACE",
    "editCategoryB": "CHANGE_PHYSICS",
    "stratum": "S1_Direct",
    "indirectType": "NONE",
    "dependencyDepth": 1,
    "entityOverlapScore": 0.85,
    "dependencyOverlapScore": 0.9,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_2",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S1_Direct (NONE) depth 1"
    },
    "seed": 1007,
    "tags": [
      "centrifuge_rotor",
      "rpm_limit"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-009",
    "worldCategory": "Logistique & Entrepôt AGV",
    "initialWorldPrompt": "Environnement Logistique & Entrepôt AGV avec éléments modulaires interactifs A et B.",
    "editA": "Déplace l'entité centrale de travail 1 vers la droite de l'atelier",
    "editB": "Lie l'entité centrale de travail 1 au déclenchement du signal lumineux d'état",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S1_Direct",
    "indirectType": "NONE",
    "dependencyDepth": 1,
    "entityOverlapScore": 0.85,
    "dependencyOverlapScore": 0.9,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_3",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S1_Direct (NONE) depth 1"
    },
    "seed": 1008,
    "tags": [
      "logistique_&_entrepôt_agv",
      "direct_s1",
      "case_0"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-010",
    "worldCategory": "Logistique & Entrepôt AGV",
    "initialWorldPrompt": "Environnement Logistique & Entrepôt AGV avec éléments modulaires interactifs A et B.",
    "editA": "Déplace l'entité centrale de travail 2 vers la droite de l'atelier",
    "editB": "Lie l'entité centrale de travail 2 au déclenchement du signal lumineux d'état",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S1_Direct",
    "indirectType": "NONE",
    "dependencyDepth": 1,
    "entityOverlapScore": 0.85,
    "dependencyOverlapScore": 0.9,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_1",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S1_Direct (NONE) depth 1"
    },
    "seed": 1009,
    "tags": [
      "logistique_&_entrepôt_agv",
      "direct_s1",
      "case_1"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-011",
    "worldCategory": "Logistique & Entrepôt AGV",
    "initialWorldPrompt": "Environnement Logistique & Entrepôt AGV avec éléments modulaires interactifs A et B.",
    "editA": "Déplace l'entité centrale de travail 3 vers la droite de l'atelier",
    "editB": "Lie l'entité centrale de travail 3 au déclenchement du signal lumineux d'état",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S1_Direct",
    "indirectType": "NONE",
    "dependencyDepth": 1,
    "entityOverlapScore": 0.85,
    "dependencyOverlapScore": 0.9,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_2",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S1_Direct (NONE) depth 1"
    },
    "seed": 1010,
    "tags": [
      "logistique_&_entrepôt_agv",
      "direct_s1",
      "case_2"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-012",
    "worldCategory": "Logistique & Entrepôt AGV",
    "initialWorldPrompt": "Environnement Logistique & Entrepôt AGV avec éléments modulaires interactifs A et B.",
    "editA": "Déplace l'entité centrale de travail 4 vers la droite de l'atelier",
    "editB": "Lie l'entité centrale de travail 4 au déclenchement du signal lumineux d'état",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S1_Direct",
    "indirectType": "NONE",
    "dependencyDepth": 1,
    "entityOverlapScore": 0.85,
    "dependencyOverlapScore": 0.9,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_3",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S1_Direct (NONE) depth 1"
    },
    "seed": 1011,
    "tags": [
      "logistique_&_entrepôt_agv",
      "direct_s1",
      "case_3"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-013",
    "worldCategory": "Atelier automobile & Robotique",
    "initialWorldPrompt": "Environnement Atelier automobile & Robotique avec éléments modulaires interactifs A et B.",
    "editA": "Déplace l'entité centrale de travail 1 vers la droite de l'atelier",
    "editB": "Lie l'entité centrale de travail 1 au déclenchement du signal lumineux d'état",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S1_Direct",
    "indirectType": "NONE",
    "dependencyDepth": 1,
    "entityOverlapScore": 0.85,
    "dependencyOverlapScore": 0.9,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_1",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S1_Direct (NONE) depth 1"
    },
    "seed": 1012,
    "tags": [
      "atelier_automobile_&_robotique",
      "direct_s1",
      "case_0"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-014",
    "worldCategory": "Atelier automobile & Robotique",
    "initialWorldPrompt": "Environnement Atelier automobile & Robotique avec éléments modulaires interactifs A et B.",
    "editA": "Déplace l'entité centrale de travail 2 vers la droite de l'atelier",
    "editB": "Lie l'entité centrale de travail 2 au déclenchement du signal lumineux d'état",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S1_Direct",
    "indirectType": "NONE",
    "dependencyDepth": 1,
    "entityOverlapScore": 0.85,
    "dependencyOverlapScore": 0.9,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_2",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S1_Direct (NONE) depth 1"
    },
    "seed": 1013,
    "tags": [
      "atelier_automobile_&_robotique",
      "direct_s1",
      "case_1"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-015",
    "worldCategory": "Atelier automobile & Robotique",
    "initialWorldPrompt": "Environnement Atelier automobile & Robotique avec éléments modulaires interactifs A et B.",
    "editA": "Déplace l'entité centrale de travail 3 vers la droite de l'atelier",
    "editB": "Lie l'entité centrale de travail 3 au déclenchement du signal lumineux d'état",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S1_Direct",
    "indirectType": "NONE",
    "dependencyDepth": 1,
    "entityOverlapScore": 0.85,
    "dependencyOverlapScore": 0.9,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_3",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S1_Direct (NONE) depth 1"
    },
    "seed": 1014,
    "tags": [
      "atelier_automobile_&_robotique",
      "direct_s1",
      "case_2"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-016",
    "worldCategory": "Atelier automobile & Robotique",
    "initialWorldPrompt": "Environnement Atelier automobile & Robotique avec éléments modulaires interactifs A et B.",
    "editA": "Déplace l'entité centrale de travail 4 vers la droite de l'atelier",
    "editB": "Lie l'entité centrale de travail 4 au déclenchement du signal lumineux d'état",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S1_Direct",
    "indirectType": "NONE",
    "dependencyDepth": 1,
    "entityOverlapScore": 0.85,
    "dependencyOverlapScore": 0.9,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_1",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S1_Direct (NONE) depth 1"
    },
    "seed": 1015,
    "tags": [
      "atelier_automobile_&_robotique",
      "direct_s1",
      "case_3"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-017",
    "worldCategory": "Maison connectée & IoT",
    "initialWorldPrompt": "Environnement Maison connectée & IoT avec éléments modulaires interactifs A et B.",
    "editA": "Déplace l'entité centrale de travail 1 vers la droite de l'atelier",
    "editB": "Lie l'entité centrale de travail 1 au déclenchement du signal lumineux d'état",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S1_Direct",
    "indirectType": "NONE",
    "dependencyDepth": 1,
    "entityOverlapScore": 0.85,
    "dependencyOverlapScore": 0.9,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_2",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S1_Direct (NONE) depth 1"
    },
    "seed": 1016,
    "tags": [
      "maison_connectée_&_iot",
      "direct_s1",
      "case_0"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-018",
    "worldCategory": "Maison connectée & IoT",
    "initialWorldPrompt": "Environnement Maison connectée & IoT avec éléments modulaires interactifs A et B.",
    "editA": "Déplace l'entité centrale de travail 2 vers la droite de l'atelier",
    "editB": "Lie l'entité centrale de travail 2 au déclenchement du signal lumineux d'état",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S1_Direct",
    "indirectType": "NONE",
    "dependencyDepth": 1,
    "entityOverlapScore": 0.85,
    "dependencyOverlapScore": 0.9,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_3",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S1_Direct (NONE) depth 1"
    },
    "seed": 1017,
    "tags": [
      "maison_connectée_&_iot",
      "direct_s1",
      "case_1"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-019",
    "worldCategory": "Maison connectée & IoT",
    "initialWorldPrompt": "Environnement Maison connectée & IoT avec éléments modulaires interactifs A et B.",
    "editA": "Déplace l'entité centrale de travail 3 vers la droite de l'atelier",
    "editB": "Lie l'entité centrale de travail 3 au déclenchement du signal lumineux d'état",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S1_Direct",
    "indirectType": "NONE",
    "dependencyDepth": 1,
    "entityOverlapScore": 0.85,
    "dependencyOverlapScore": 0.9,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_1",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S1_Direct (NONE) depth 1"
    },
    "seed": 1018,
    "tags": [
      "maison_connectée_&_iot",
      "direct_s1",
      "case_2"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-020",
    "worldCategory": "Maison connectée & IoT",
    "initialWorldPrompt": "Environnement Maison connectée & IoT avec éléments modulaires interactifs A et B.",
    "editA": "Déplace l'entité centrale de travail 4 vers la droite de l'atelier",
    "editB": "Lie l'entité centrale de travail 4 au déclenchement du signal lumineux d'état",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S1_Direct",
    "indirectType": "NONE",
    "dependencyDepth": 1,
    "entityOverlapScore": 0.85,
    "dependencyOverlapScore": 0.9,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_2",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S1_Direct (NONE) depth 1"
    },
    "seed": 1019,
    "tags": [
      "maison_connectée_&_iot",
      "direct_s1",
      "case_3"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-021",
    "worldCategory": "Station spatiale orbitale",
    "initialWorldPrompt": "Environnement Station spatiale orbitale avec éléments modulaires interactifs A et B.",
    "editA": "Déplace l'entité centrale de travail 1 vers la droite de l'atelier",
    "editB": "Lie l'entité centrale de travail 1 au déclenchement du signal lumineux d'état",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S1_Direct",
    "indirectType": "NONE",
    "dependencyDepth": 1,
    "entityOverlapScore": 0.85,
    "dependencyOverlapScore": 0.9,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_3",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S1_Direct (NONE) depth 1"
    },
    "seed": 1020,
    "tags": [
      "station_spatiale_orbitale",
      "direct_s1",
      "case_0"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-022",
    "worldCategory": "Station spatiale orbitale",
    "initialWorldPrompt": "Environnement Station spatiale orbitale avec éléments modulaires interactifs A et B.",
    "editA": "Déplace l'entité centrale de travail 2 vers la droite de l'atelier",
    "editB": "Lie l'entité centrale de travail 2 au déclenchement du signal lumineux d'état",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S1_Direct",
    "indirectType": "NONE",
    "dependencyDepth": 1,
    "entityOverlapScore": 0.85,
    "dependencyOverlapScore": 0.9,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_1",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S1_Direct (NONE) depth 1"
    },
    "seed": 1021,
    "tags": [
      "station_spatiale_orbitale",
      "direct_s1",
      "case_1"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-023",
    "worldCategory": "Station spatiale orbitale",
    "initialWorldPrompt": "Environnement Station spatiale orbitale avec éléments modulaires interactifs A et B.",
    "editA": "Déplace l'entité centrale de travail 3 vers la droite de l'atelier",
    "editB": "Lie l'entité centrale de travail 3 au déclenchement du signal lumineux d'état",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S1_Direct",
    "indirectType": "NONE",
    "dependencyDepth": 1,
    "entityOverlapScore": 0.85,
    "dependencyOverlapScore": 0.9,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_2",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S1_Direct (NONE) depth 1"
    },
    "seed": 1022,
    "tags": [
      "station_spatiale_orbitale",
      "direct_s1",
      "case_2"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-024",
    "worldCategory": "Station spatiale orbitale",
    "initialWorldPrompt": "Environnement Station spatiale orbitale avec éléments modulaires interactifs A et B.",
    "editA": "Déplace l'entité centrale de travail 4 vers la droite de l'atelier",
    "editB": "Lie l'entité centrale de travail 4 au déclenchement du signal lumineux d'état",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S1_Direct",
    "indirectType": "NONE",
    "dependencyDepth": 1,
    "entityOverlapScore": 0.85,
    "dependencyOverlapScore": 0.9,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_3",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S1_Direct (NONE) depth 1"
    },
    "seed": 1023,
    "tags": [
      "station_spatiale_orbitale",
      "direct_s1",
      "case_3"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-025",
    "worldCategory": "Showroom de luxe & Retail",
    "initialWorldPrompt": "Environnement Showroom de luxe & Retail avec éléments modulaires interactifs A et B.",
    "editA": "Déplace l'entité centrale de travail 1 vers la droite de l'atelier",
    "editB": "Lie l'entité centrale de travail 1 au déclenchement du signal lumineux d'état",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S1_Direct",
    "indirectType": "NONE",
    "dependencyDepth": 1,
    "entityOverlapScore": 0.85,
    "dependencyOverlapScore": 0.9,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_1",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S1_Direct (NONE) depth 1"
    },
    "seed": 1024,
    "tags": [
      "showroom_de_luxe_&_retail",
      "direct_s1",
      "case_0"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-026",
    "worldCategory": "Showroom de luxe & Retail",
    "initialWorldPrompt": "Environnement Showroom de luxe & Retail avec éléments modulaires interactifs A et B.",
    "editA": "Déplace l'entité centrale de travail 2 vers la droite de l'atelier",
    "editB": "Lie l'entité centrale de travail 2 au déclenchement du signal lumineux d'état",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S1_Direct",
    "indirectType": "NONE",
    "dependencyDepth": 1,
    "entityOverlapScore": 0.85,
    "dependencyOverlapScore": 0.9,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_2",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S1_Direct (NONE) depth 1"
    },
    "seed": 1025,
    "tags": [
      "showroom_de_luxe_&_retail",
      "direct_s1",
      "case_1"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-027",
    "worldCategory": "Showroom de luxe & Retail",
    "initialWorldPrompt": "Environnement Showroom de luxe & Retail avec éléments modulaires interactifs A et B.",
    "editA": "Déplace l'entité centrale de travail 3 vers la droite de l'atelier",
    "editB": "Lie l'entité centrale de travail 3 au déclenchement du signal lumineux d'état",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S1_Direct",
    "indirectType": "NONE",
    "dependencyDepth": 1,
    "entityOverlapScore": 0.85,
    "dependencyOverlapScore": 0.9,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_3",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S1_Direct (NONE) depth 1"
    },
    "seed": 1026,
    "tags": [
      "showroom_de_luxe_&_retail",
      "direct_s1",
      "case_2"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-028",
    "worldCategory": "Showroom de luxe & Retail",
    "initialWorldPrompt": "Environnement Showroom de luxe & Retail avec éléments modulaires interactifs A et B.",
    "editA": "Déplace l'entité centrale de travail 4 vers la droite de l'atelier",
    "editB": "Lie l'entité centrale de travail 4 au déclenchement du signal lumineux d'état",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S1_Direct",
    "indirectType": "NONE",
    "dependencyDepth": 1,
    "entityOverlapScore": 0.85,
    "dependencyOverlapScore": 0.9,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_1",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S1_Direct (NONE) depth 1"
    },
    "seed": 1027,
    "tags": [
      "showroom_de_luxe_&_retail",
      "direct_s1",
      "case_3"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-029",
    "worldCategory": "Salle de classe & Éducation",
    "initialWorldPrompt": "Environnement Salle de classe & Éducation avec éléments modulaires interactifs A et B.",
    "editA": "Déplace l'entité centrale de travail 1 vers la droite de l'atelier",
    "editB": "Lie l'entité centrale de travail 1 au déclenchement du signal lumineux d'état",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S1_Direct",
    "indirectType": "NONE",
    "dependencyDepth": 1,
    "entityOverlapScore": 0.85,
    "dependencyOverlapScore": 0.9,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_2",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S1_Direct (NONE) depth 1"
    },
    "seed": 1028,
    "tags": [
      "salle_de_classe_&_éducation",
      "direct_s1",
      "case_0"
    ],
    "split": "val"
  },
  {
    "id": "WP2-EO-030",
    "worldCategory": "Salle de classe & Éducation",
    "initialWorldPrompt": "Environnement Salle de classe & Éducation avec éléments modulaires interactifs A et B.",
    "editA": "Déplace l'entité centrale de travail 2 vers la droite de l'atelier",
    "editB": "Lie l'entité centrale de travail 2 au déclenchement du signal lumineux d'état",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S1_Direct",
    "indirectType": "NONE",
    "dependencyDepth": 1,
    "entityOverlapScore": 0.85,
    "dependencyOverlapScore": 0.9,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_3",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S1_Direct (NONE) depth 1"
    },
    "seed": 1029,
    "tags": [
      "salle_de_classe_&_éducation",
      "direct_s1",
      "case_1"
    ],
    "split": "val"
  },
  {
    "id": "WP2-EO-031",
    "worldCategory": "Salle de classe & Éducation",
    "initialWorldPrompt": "Environnement Salle de classe & Éducation avec éléments modulaires interactifs A et B.",
    "editA": "Déplace l'entité centrale de travail 3 vers la droite de l'atelier",
    "editB": "Lie l'entité centrale de travail 3 au déclenchement du signal lumineux d'état",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S1_Direct",
    "indirectType": "NONE",
    "dependencyDepth": 1,
    "entityOverlapScore": 0.85,
    "dependencyOverlapScore": 0.9,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_1",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S1_Direct (NONE) depth 1"
    },
    "seed": 1030,
    "tags": [
      "salle_de_classe_&_éducation",
      "direct_s1",
      "case_2"
    ],
    "split": "val"
  },
  {
    "id": "WP2-EO-032",
    "worldCategory": "Salle de classe & Éducation",
    "initialWorldPrompt": "Environnement Salle de classe & Éducation avec éléments modulaires interactifs A et B.",
    "editA": "Déplace l'entité centrale de travail 4 vers la droite de l'atelier",
    "editB": "Lie l'entité centrale de travail 4 au déclenchement du signal lumineux d'état",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S1_Direct",
    "indirectType": "NONE",
    "dependencyDepth": 1,
    "entityOverlapScore": 0.85,
    "dependencyOverlapScore": 0.9,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_2",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S1_Direct (NONE) depth 1"
    },
    "seed": 1031,
    "tags": [
      "salle_de_classe_&_éducation",
      "direct_s1",
      "case_3"
    ],
    "split": "val"
  },
  {
    "id": "WP2-EO-033",
    "worldCategory": "Atelier culinaire & Pâtisserie",
    "initialWorldPrompt": "Environnement Atelier culinaire & Pâtisserie avec éléments modulaires interactifs A et B.",
    "editA": "Déplace l'entité centrale de travail 1 vers la droite de l'atelier",
    "editB": "Lie l'entité centrale de travail 1 au déclenchement du signal lumineux d'état",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S1_Direct",
    "indirectType": "NONE",
    "dependencyDepth": 1,
    "entityOverlapScore": 0.85,
    "dependencyOverlapScore": 0.9,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_3",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S1_Direct (NONE) depth 1"
    },
    "seed": 1032,
    "tags": [
      "atelier_culinaire_&_pâtisserie",
      "direct_s1",
      "case_0"
    ],
    "split": "val"
  },
  {
    "id": "WP2-EO-034",
    "worldCategory": "Atelier culinaire & Pâtisserie",
    "initialWorldPrompt": "Environnement Atelier culinaire & Pâtisserie avec éléments modulaires interactifs A et B.",
    "editA": "Déplace l'entité centrale de travail 2 vers la droite de l'atelier",
    "editB": "Lie l'entité centrale de travail 2 au déclenchement du signal lumineux d'état",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S1_Direct",
    "indirectType": "NONE",
    "dependencyDepth": 1,
    "entityOverlapScore": 0.85,
    "dependencyOverlapScore": 0.9,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_1",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S1_Direct (NONE) depth 1"
    },
    "seed": 1033,
    "tags": [
      "atelier_culinaire_&_pâtisserie",
      "direct_s1",
      "case_1"
    ],
    "split": "val"
  },
  {
    "id": "WP2-EO-035",
    "worldCategory": "Atelier culinaire & Pâtisserie",
    "initialWorldPrompt": "Environnement Atelier culinaire & Pâtisserie avec éléments modulaires interactifs A et B.",
    "editA": "Déplace l'entité centrale de travail 3 vers la droite de l'atelier",
    "editB": "Lie l'entité centrale de travail 3 au déclenchement du signal lumineux d'état",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S1_Direct",
    "indirectType": "NONE",
    "dependencyDepth": 1,
    "entityOverlapScore": 0.85,
    "dependencyOverlapScore": 0.9,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_2",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S1_Direct (NONE) depth 1"
    },
    "seed": 1034,
    "tags": [
      "atelier_culinaire_&_pâtisserie",
      "direct_s1",
      "case_2"
    ],
    "split": "val"
  },
  {
    "id": "WP2-EO-036",
    "worldCategory": "Atelier culinaire & Pâtisserie",
    "initialWorldPrompt": "Environnement Atelier culinaire & Pâtisserie avec éléments modulaires interactifs A et B.",
    "editA": "Déplace l'entité centrale de travail 4 vers la droite de l'atelier",
    "editB": "Lie l'entité centrale de travail 4 au déclenchement du signal lumineux d'état",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S1_Direct",
    "indirectType": "NONE",
    "dependencyDepth": 1,
    "entityOverlapScore": 0.85,
    "dependencyOverlapScore": 0.9,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_3",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S1_Direct (NONE) depth 1"
    },
    "seed": 1035,
    "tags": [
      "atelier_culinaire_&_pâtisserie",
      "direct_s1",
      "case_3"
    ],
    "split": "val"
  },
  {
    "id": "WP2-EO-037",
    "worldCategory": "Centre médical & Simulation",
    "initialWorldPrompt": "Environnement Centre médical & Simulation avec éléments modulaires interactifs A et B.",
    "editA": "Déplace l'entité centrale de travail 1 vers la droite de l'atelier",
    "editB": "Lie l'entité centrale de travail 1 au déclenchement du signal lumineux d'état",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S1_Direct",
    "indirectType": "NONE",
    "dependencyDepth": 1,
    "entityOverlapScore": 0.85,
    "dependencyOverlapScore": 0.9,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_1",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S1_Direct (NONE) depth 1"
    },
    "seed": 1036,
    "tags": [
      "centre_médical_&_simulation",
      "direct_s1",
      "case_0"
    ],
    "split": "test_locked"
  },
  {
    "id": "WP2-EO-038",
    "worldCategory": "Centre médical & Simulation",
    "initialWorldPrompt": "Environnement Centre médical & Simulation avec éléments modulaires interactifs A et B.",
    "editA": "Déplace l'entité centrale de travail 2 vers la droite de l'atelier",
    "editB": "Lie l'entité centrale de travail 2 au déclenchement du signal lumineux d'état",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S1_Direct",
    "indirectType": "NONE",
    "dependencyDepth": 1,
    "entityOverlapScore": 0.85,
    "dependencyOverlapScore": 0.9,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_2",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S1_Direct (NONE) depth 1"
    },
    "seed": 1037,
    "tags": [
      "centre_médical_&_simulation",
      "direct_s1",
      "case_1"
    ],
    "split": "test_locked"
  },
  {
    "id": "WP2-EO-039",
    "worldCategory": "Centre médical & Simulation",
    "initialWorldPrompt": "Environnement Centre médical & Simulation avec éléments modulaires interactifs A et B.",
    "editA": "Déplace l'entité centrale de travail 3 vers la droite de l'atelier",
    "editB": "Lie l'entité centrale de travail 3 au déclenchement du signal lumineux d'état",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S1_Direct",
    "indirectType": "NONE",
    "dependencyDepth": 1,
    "entityOverlapScore": 0.85,
    "dependencyOverlapScore": 0.9,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_3",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S1_Direct (NONE) depth 1"
    },
    "seed": 1038,
    "tags": [
      "centre_médical_&_simulation",
      "direct_s1",
      "case_2"
    ],
    "split": "test_locked"
  },
  {
    "id": "WP2-EO-040",
    "worldCategory": "Centre médical & Simulation",
    "initialWorldPrompt": "Environnement Centre médical & Simulation avec éléments modulaires interactifs A et B.",
    "editA": "Déplace l'entité centrale de travail 4 vers la droite de l'atelier",
    "editB": "Lie l'entité centrale de travail 4 au déclenchement du signal lumineux d'état",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S1_Direct",
    "indirectType": "NONE",
    "dependencyDepth": 1,
    "entityOverlapScore": 0.85,
    "dependencyOverlapScore": 0.9,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_1",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S1_Direct (NONE) depth 1"
    },
    "seed": 1039,
    "tags": [
      "centre_médical_&_simulation",
      "direct_s1",
      "case_3"
    ],
    "split": "test_locked"
  },
  {
    "id": "WP2-EO-041",
    "worldCategory": "Montage meuble & DIY",
    "initialWorldPrompt": "Environnement Montage meuble & DIY avec éléments modulaires interactifs A et B.",
    "editA": "Déplace l'entité centrale de travail 1 vers la droite de l'atelier",
    "editB": "Lie l'entité centrale de travail 1 au déclenchement du signal lumineux d'état",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S1_Direct",
    "indirectType": "NONE",
    "dependencyDepth": 1,
    "entityOverlapScore": 0.85,
    "dependencyOverlapScore": 0.9,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_2",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S1_Direct (NONE) depth 1"
    },
    "seed": 1040,
    "tags": [
      "montage_meuble_&_diy",
      "direct_s1",
      "case_0"
    ],
    "split": "test_locked"
  },
  {
    "id": "WP2-EO-042",
    "worldCategory": "Montage meuble & DIY",
    "initialWorldPrompt": "Environnement Montage meuble & DIY avec éléments modulaires interactifs A et B.",
    "editA": "Déplace l'entité centrale de travail 2 vers la droite de l'atelier",
    "editB": "Lie l'entité centrale de travail 2 au déclenchement du signal lumineux d'état",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S1_Direct",
    "indirectType": "NONE",
    "dependencyDepth": 1,
    "entityOverlapScore": 0.85,
    "dependencyOverlapScore": 0.9,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_3",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S1_Direct (NONE) depth 1"
    },
    "seed": 1041,
    "tags": [
      "montage_meuble_&_diy",
      "direct_s1",
      "case_1"
    ],
    "split": "test_locked"
  },
  {
    "id": "WP2-EO-043",
    "worldCategory": "Montage meuble & DIY",
    "initialWorldPrompt": "Environnement Montage meuble & DIY avec éléments modulaires interactifs A et B.",
    "editA": "Déplace l'entité centrale de travail 3 vers la droite de l'atelier",
    "editB": "Lie l'entité centrale de travail 3 au déclenchement du signal lumineux d'état",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S1_Direct",
    "indirectType": "NONE",
    "dependencyDepth": 1,
    "entityOverlapScore": 0.85,
    "dependencyOverlapScore": 0.9,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_1",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S1_Direct (NONE) depth 1"
    },
    "seed": 1042,
    "tags": [
      "montage_meuble_&_diy",
      "direct_s1",
      "case_2"
    ],
    "split": "test_locked"
  },
  {
    "id": "WP2-EO-044",
    "worldCategory": "Montage meuble & DIY",
    "initialWorldPrompt": "Environnement Montage meuble & DIY avec éléments modulaires interactifs A et B.",
    "editA": "Déplace l'entité centrale de travail 4 vers la droite de l'atelier",
    "editB": "Lie l'entité centrale de travail 4 au déclenchement du signal lumineux d'état",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S1_Direct",
    "indirectType": "NONE",
    "dependencyDepth": 1,
    "entityOverlapScore": 0.85,
    "dependencyOverlapScore": 0.9,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_2",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S1_Direct (NONE) depth 1"
    },
    "seed": 1043,
    "tags": [
      "montage_meuble_&_diy",
      "direct_s1",
      "case_3"
    ],
    "split": "test_locked"
  },
  {
    "id": "WP2-EO-045",
    "worldCategory": "Game Design Lab & Escape Room",
    "initialWorldPrompt": "Environnement Game Design Lab & Escape Room avec éléments modulaires interactifs A et B.",
    "editA": "Déplace l'entité centrale de travail 1 vers la droite de l'atelier",
    "editB": "Lie l'entité centrale de travail 1 au déclenchement du signal lumineux d'état",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S1_Direct",
    "indirectType": "NONE",
    "dependencyDepth": 1,
    "entityOverlapScore": 0.85,
    "dependencyOverlapScore": 0.9,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_3",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S1_Direct (NONE) depth 1"
    },
    "seed": 1044,
    "tags": [
      "game_design_lab_&_escape_room",
      "direct_s1",
      "case_0"
    ],
    "split": "test_locked"
  },
  {
    "id": "WP2-EO-046",
    "worldCategory": "Game Design Lab & Escape Room",
    "initialWorldPrompt": "Environnement Game Design Lab & Escape Room avec éléments modulaires interactifs A et B.",
    "editA": "Déplace l'entité centrale de travail 2 vers la droite de l'atelier",
    "editB": "Lie l'entité centrale de travail 2 au déclenchement du signal lumineux d'état",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S1_Direct",
    "indirectType": "NONE",
    "dependencyDepth": 1,
    "entityOverlapScore": 0.85,
    "dependencyOverlapScore": 0.9,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_1",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S1_Direct (NONE) depth 1"
    },
    "seed": 1045,
    "tags": [
      "game_design_lab_&_escape_room",
      "direct_s1",
      "case_1"
    ],
    "split": "test_locked"
  },
  {
    "id": "WP2-EO-047",
    "worldCategory": "Game Design Lab & Escape Room",
    "initialWorldPrompt": "Environnement Game Design Lab & Escape Room avec éléments modulaires interactifs A et B.",
    "editA": "Déplace l'entité centrale de travail 3 vers la droite de l'atelier",
    "editB": "Lie l'entité centrale de travail 3 au déclenchement du signal lumineux d'état",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S1_Direct",
    "indirectType": "NONE",
    "dependencyDepth": 1,
    "entityOverlapScore": 0.85,
    "dependencyOverlapScore": 0.9,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_2",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S1_Direct (NONE) depth 1"
    },
    "seed": 1046,
    "tags": [
      "game_design_lab_&_escape_room",
      "direct_s1",
      "case_2"
    ],
    "split": "test_locked"
  },
  {
    "id": "WP2-EO-048",
    "worldCategory": "Game Design Lab & Escape Room",
    "initialWorldPrompt": "Environnement Game Design Lab & Escape Room avec éléments modulaires interactifs A et B.",
    "editA": "Déplace l'entité centrale de travail 4 vers la droite de l'atelier",
    "editB": "Lie l'entité centrale de travail 4 au déclenchement du signal lumineux d'état",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S1_Direct",
    "indirectType": "NONE",
    "dependencyDepth": 1,
    "entityOverlapScore": 0.85,
    "dependencyOverlapScore": 0.9,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_3",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S1_Direct (NONE) depth 1"
    },
    "seed": 1047,
    "tags": [
      "game_design_lab_&_escape_room",
      "direct_s1",
      "case_3"
    ],
    "split": "test_locked"
  },
  {
    "id": "WP2-EO-049",
    "worldCategory": "Maintenance industrielle",
    "initialWorldPrompt": "Allée principale d'atelier avec armoire électrique, couloir de circulation et robot de maintenance.",
    "editA": "Déplace l'armoire électrique haute tension au milieu de l'allée principale de circulation",
    "editB": "Attribue au robot de maintenance une trajectoire directe vers la baie de recharge au fond de l'allée",
    "editCategoryA": "MOVE",
    "editCategoryB": "CHANGE_NAVIGATION",
    "stratum": "S2_Indirect",
    "indirectType": "GEOMETRY_NAVIGATION",
    "dependencyDepth": 1,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0.77,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_1",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S2_Indirect (GEOMETRY_NAVIGATION) depth 1"
    },
    "seed": 1048,
    "tags": [
      "cabinet",
      "patrol_route",
      "aisle_blocking"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-050",
    "worldCategory": "Maintenance industrielle",
    "initialWorldPrompt": "Zone de levage avec palan motorisé, capteur de surcharge au sol et chariot élévateur.",
    "editA": "Accroche un bloc d'acier de 3 tonnes au crochet du palan motorisé à 4 mètres de haut",
    "editB": "Active le seuil d'alerte de pesée sur le capteur de pression au sol sous la trajectoire du palan",
    "editCategoryA": "ADD",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S2_Indirect",
    "indirectType": "GEOMETRY_PHYSICS",
    "dependencyDepth": 2,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0.4,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_2",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S2_Indirect (GEOMETRY_PHYSICS) depth 2"
    },
    "seed": 1049,
    "tags": [
      "hoist",
      "heavy_load",
      "pressure_sensor"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-051",
    "worldCategory": "Maintenance industrielle",
    "initialWorldPrompt": "Couloir technique avec issue de secours, servomoteur de verrouillage et caméra thermique.",
    "editA": "Place une cloison de confinement en plexiglas devant l'issue de secours",
    "editB": "Exige dans la quête d'évacuation que l'opérateur valide le passage par l'issue de secours en moins de 30 secondes",
    "editCategoryA": "ADD",
    "editCategoryB": "CHANGE_QUEST",
    "stratum": "S2_Indirect",
    "indirectType": "TRIGGER_TASK",
    "dependencyDepth": 2,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0.82,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_3",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S2_Indirect (TRIGGER_TASK) depth 2"
    },
    "seed": 1050,
    "tags": [
      "escape_hatch",
      "fire_door",
      "quest_deadlock"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-052",
    "worldCategory": "Maintenance industrielle",
    "initialWorldPrompt": "Atelier mécanique avec tour d'usinage, capteur photoélectrique et ventilation générale.",
    "editA": "Décale la grille de protection du tour d'usinage de 1.5 mètre vers la droite",
    "editB": "Programme la ventilation générale pour qu'elle s'arrête dès que le faisceau du capteur photoélectrique est coupé",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S2_Indirect",
    "indirectType": "MULTI_HOP_CHAIN",
    "dependencyDepth": 3,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0.44,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_1",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S2_Indirect (MULTI_HOP_CHAIN) depth 3"
    },
    "seed": 1051,
    "tags": [
      "lathe",
      "photoelectric_sensor",
      "ventilation"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-053",
    "worldCategory": "Maintenance industrielle",
    "initialWorldPrompt": "Zone de stockage des huiles avec bac de rétention, pompe de vidange et alarme sonore.",
    "editA": "Déplace le bac de rétention d'huiles à l'extérieur du sas de sécurité",
    "editB": "Associe le bouton d'alarme sonore au niveau de liquide détecté dans le sas de sécurité",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S2_Indirect",
    "indirectType": "GEOMETRY_INTERACTION",
    "dependencyDepth": 1,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0.77,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_2",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S2_Indirect (GEOMETRY_INTERACTION) depth 1"
    },
    "seed": 1052,
    "tags": [
      "retention_basin",
      "leak_sensor",
      "trigger_drift"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-054",
    "worldCategory": "Maintenance industrielle",
    "initialWorldPrompt": "Poste de distribution avec coffret d'alimentation, interrupteur d'éclairage et transpalette.",
    "editA": "Fais basculer la caisse métallique lourde en travers de l'accès au coffret d'alimentation",
    "editB": "Définit l'objectif de maintenance prioritaire consistant à réarmer le coffret d'alimentation",
    "editCategoryA": "MOVE",
    "editCategoryB": "CHANGE_QUEST",
    "stratum": "S2_Indirect",
    "indirectType": "PHYSICS_NAVIGATION",
    "dependencyDepth": 2,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0.82,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_3",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S2_Indirect (PHYSICS_NAVIGATION) depth 2"
    },
    "seed": 1053,
    "tags": [
      "heavy_crate",
      "power_box",
      "nav_blocked"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-055",
    "worldCategory": "Laboratoire chimique",
    "initialWorldPrompt": "Laboratoire d'analyse avec paillasse centrale, douche de sécurité et fiole d'acide nitrique.",
    "editA": "Installe une armoire de réactifs encombrante directement devant l'accès à la douche de sécurité",
    "editB": "Exige que le technicien puisse marcher sans entrave de la paillasse centrale jusqu'à la douche de sécurité",
    "editCategoryA": "ADD",
    "editCategoryB": "CHANGE_NAVIGATION",
    "stratum": "S2_Indirect",
    "indirectType": "GEOMETRY_NAVIGATION",
    "dependencyDepth": 1,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0.77,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_1",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S2_Indirect (GEOMETRY_NAVIGATION) depth 1"
    },
    "seed": 1054,
    "tags": [
      "safety_shower",
      "corridor_blocking",
      "chemical_clearance"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-056",
    "worldCategory": "Laboratoire chimique",
    "initialWorldPrompt": "Hotte à flux laminaire avec balance de précision, flux d'air pulsé et creuset de pesée.",
    "editA": "Règle le débit de ventilation de la hotte à vitesse maximale créant un flux d'air turbulent",
    "editB": "Place un creuset de pesée ultra-léger de 2 grammes sur le plateau de la balance de précision",
    "editCategoryA": "CHANGE_PHYSICS",
    "editCategoryB": "ADD",
    "stratum": "S2_Indirect",
    "indirectType": "PHYSICS_NAVIGATION",
    "dependencyDepth": 2,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0.82,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_2",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S2_Indirect (PHYSICS_NAVIGATION) depth 2"
    },
    "seed": 1055,
    "tags": [
      "precision_balance",
      "turbulent_airflow",
      "weight_drift"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-057",
    "worldCategory": "Laboratoire chimique",
    "initialWorldPrompt": "Paillasse carrelée avec spectrophotomètre, cuvette quartz et source UV.",
    "editA": "Remplace la cuvette quartz standard par un tube à essai opaque en plastique noir",
    "editB": "Associe le signal d'absorbance du spectrophotomètre au calcul de concentration dans la solution",
    "editCategoryA": "REPLACE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S2_Indirect",
    "indirectType": "IDENTITY_CAUSAL",
    "dependencyDepth": 2,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0.82,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_3",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S2_Indirect (IDENTITY_CAUSAL) depth 2"
    },
    "seed": 1056,
    "tags": [
      "cuvette_replacement",
      "spectrometer",
      "opaque_barrier"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-058",
    "worldCategory": "Laboratoire chimique",
    "initialWorldPrompt": "Salle blanche avec sas de décontamination, capteur de pression différentielle et porte hermétique.",
    "editA": "Ouvre le clapet de surpression du sas de décontamination",
    "editB": "Conditionne le déverrouillage de la porte hermétique au maintien d'une pression différentielle positive",
    "editCategoryA": "ROTATE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S2_Indirect",
    "indirectType": "MULTI_HOP_CHAIN",
    "dependencyDepth": 3,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0.44,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_1",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S2_Indirect (MULTI_HOP_CHAIN) depth 3"
    },
    "seed": 1057,
    "tags": [
      "airlock",
      "pressure_sensor",
      "hermetic_door"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-059",
    "worldCategory": "Laboratoire chimique",
    "initialWorldPrompt": "Spectromètre de masse avec pompe turbomoléculaire et vanne d'isolation.",
    "editA": "Coupe l'alimentation électrique secondaire de la pompe turbomoléculaire",
    "editB": "Définit la quête d'analyse isotopique exigeant un vide ultra-poussé à 10^-6 mbar",
    "editCategoryA": "CHANGE_PHYSICS",
    "editCategoryB": "CHANGE_QUEST",
    "stratum": "S2_Indirect",
    "indirectType": "TRIGGER_TASK",
    "dependencyDepth": 2,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0.82,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_2",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S2_Indirect (TRIGGER_TASK) depth 2"
    },
    "seed": 1058,
    "tags": [
      "turbomolecular_pump",
      "vacuum_task",
      "deadlock"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-060",
    "worldCategory": "Laboratoire chimique",
    "initialWorldPrompt": "Paillasse de synthèse avec bain-marie, bécher d'huile silicone et thermomètre plongeant.",
    "editA": "Déplace le bécher d'huile silicone à 1 mètre à droite du bain-marie",
    "editB": "Associe la sonde du thermomètre plongeant à la température mesurée dans le bain-marie",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S2_Indirect",
    "indirectType": "GEOMETRY_INTERACTION",
    "dependencyDepth": 1,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0.77,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_3",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S2_Indirect (GEOMETRY_INTERACTION) depth 1"
    },
    "seed": 1059,
    "tags": [
      "silicone_beaker",
      "immersion_probe",
      "trigger_drift"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-061",
    "worldCategory": "Logistique & Entrepôt AGV",
    "initialWorldPrompt": "Environnement interactif Logistique & Entrepôt AGV avec couloir de transit et zones fonctionnelles distinctes.",
    "editA": "Installe un équipement encombrant de type barrière ou meuble dans l'axe de transit de Logistique & Entrepôt AGV",
    "editB": "Attribue au mobile ou opérateur une tâche prioritaire traversant l'axe de transit de Logistique & Entrepôt AGV",
    "editCategoryA": "MOVE",
    "editCategoryB": "CHANGE_NAVIGATION",
    "stratum": "S2_Indirect",
    "indirectType": "GEOMETRY_NAVIGATION",
    "dependencyDepth": 1,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0.77,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_1",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S2_Indirect (GEOMETRY_NAVIGATION) depth 1"
    },
    "seed": 1060,
    "tags": [
      "logistique_&_entrepôt_agv",
      "indirect_s2",
      "geometry_navigation",
      "depth_1"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-062",
    "worldCategory": "Logistique & Entrepôt AGV",
    "initialWorldPrompt": "Environnement interactif Logistique & Entrepôt AGV avec couloir de transit et zones fonctionnelles distinctes.",
    "editA": "Installe un équipement encombrant de type barrière ou meuble dans l'axe de transit de Logistique & Entrepôt AGV",
    "editB": "Attribue au mobile ou opérateur une tâche prioritaire traversant l'axe de transit de Logistique & Entrepôt AGV",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S2_Indirect",
    "indirectType": "GEOMETRY_INTERACTION",
    "dependencyDepth": 1,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0.77,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_2",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S2_Indirect (GEOMETRY_INTERACTION) depth 1"
    },
    "seed": 1061,
    "tags": [
      "logistique_&_entrepôt_agv",
      "indirect_s2",
      "geometry_interaction",
      "depth_1"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-063",
    "worldCategory": "Logistique & Entrepôt AGV",
    "initialWorldPrompt": "Environnement interactif Logistique & Entrepôt AGV avec couloir de transit et zones fonctionnelles distinctes.",
    "editA": "Installe un équipement encombrant de type barrière ou meuble dans l'axe de transit de Logistique & Entrepôt AGV",
    "editB": "Attribue au mobile ou opérateur une tâche prioritaire traversant l'axe de transit de Logistique & Entrepôt AGV",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S2_Indirect",
    "indirectType": "GEOMETRY_PHYSICS",
    "dependencyDepth": 1,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0.36,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_3",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S2_Indirect (GEOMETRY_PHYSICS) depth 1"
    },
    "seed": 1062,
    "tags": [
      "logistique_&_entrepôt_agv",
      "indirect_s2",
      "geometry_physics",
      "depth_1"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-064",
    "worldCategory": "Logistique & Entrepôt AGV",
    "initialWorldPrompt": "Environnement interactif Logistique & Entrepôt AGV avec couloir de transit et zones fonctionnelles distinctes.",
    "editA": "Installe un équipement encombrant de type barrière ou meuble dans l'axe de transit de Logistique & Entrepôt AGV",
    "editB": "Attribue au mobile ou opérateur une tâche prioritaire traversant l'axe de transit de Logistique & Entrepôt AGV",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S2_Indirect",
    "indirectType": "PHYSICS_NAVIGATION",
    "dependencyDepth": 2,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0.82,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_1",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S2_Indirect (PHYSICS_NAVIGATION) depth 2"
    },
    "seed": 1063,
    "tags": [
      "logistique_&_entrepôt_agv",
      "indirect_s2",
      "physics_navigation",
      "depth_2"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-065",
    "worldCategory": "Logistique & Entrepôt AGV",
    "initialWorldPrompt": "Environnement interactif Logistique & Entrepôt AGV avec couloir de transit et zones fonctionnelles distinctes.",
    "editA": "Installe un équipement encombrant de type barrière ou meuble dans l'axe de transit de Logistique & Entrepôt AGV",
    "editB": "Attribue au mobile ou opérateur une tâche prioritaire traversant l'axe de transit de Logistique & Entrepôt AGV",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S2_Indirect",
    "indirectType": "IDENTITY_CAUSAL",
    "dependencyDepth": 2,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0.82,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_2",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S2_Indirect (IDENTITY_CAUSAL) depth 2"
    },
    "seed": 1064,
    "tags": [
      "logistique_&_entrepôt_agv",
      "indirect_s2",
      "identity_causal",
      "depth_2"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-066",
    "worldCategory": "Logistique & Entrepôt AGV",
    "initialWorldPrompt": "Environnement interactif Logistique & Entrepôt AGV avec couloir de transit et zones fonctionnelles distinctes.",
    "editA": "Installe un équipement encombrant de type barrière ou meuble dans l'axe de transit de Logistique & Entrepôt AGV",
    "editB": "Attribue au mobile ou opérateur une tâche prioritaire traversant l'axe de transit de Logistique & Entrepôt AGV",
    "editCategoryA": "MOVE",
    "editCategoryB": "CHANGE_QUEST",
    "stratum": "S2_Indirect",
    "indirectType": "TRIGGER_TASK",
    "dependencyDepth": 2,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0.82,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_3",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S2_Indirect (TRIGGER_TASK) depth 2"
    },
    "seed": 1065,
    "tags": [
      "logistique_&_entrepôt_agv",
      "indirect_s2",
      "trigger_task",
      "depth_2"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-067",
    "worldCategory": "Logistique & Entrepôt AGV",
    "initialWorldPrompt": "Environnement interactif Logistique & Entrepôt AGV avec couloir de transit et zones fonctionnelles distinctes.",
    "editA": "Installe un équipement encombrant de type barrière ou meuble dans l'axe de transit de Logistique & Entrepôt AGV",
    "editB": "Attribue au mobile ou opérateur une tâche prioritaire traversant l'axe de transit de Logistique & Entrepôt AGV",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S2_Indirect",
    "indirectType": "MULTI_HOP_CHAIN",
    "dependencyDepth": 3,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0.44,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_1",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S2_Indirect (MULTI_HOP_CHAIN) depth 3"
    },
    "seed": 1066,
    "tags": [
      "logistique_&_entrepôt_agv",
      "indirect_s2",
      "multi_hop_chain",
      "depth_3"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-068",
    "worldCategory": "Atelier automobile & Robotique",
    "initialWorldPrompt": "Environnement interactif Atelier automobile & Robotique avec couloir de transit et zones fonctionnelles distinctes.",
    "editA": "Installe un équipement encombrant de type barrière ou meuble dans l'axe de transit de Atelier automobile & Robotique",
    "editB": "Attribue au mobile ou opérateur une tâche prioritaire traversant l'axe de transit de Atelier automobile & Robotique",
    "editCategoryA": "MOVE",
    "editCategoryB": "CHANGE_NAVIGATION",
    "stratum": "S2_Indirect",
    "indirectType": "GEOMETRY_NAVIGATION",
    "dependencyDepth": 1,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0.77,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_2",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S2_Indirect (GEOMETRY_NAVIGATION) depth 1"
    },
    "seed": 1067,
    "tags": [
      "atelier_automobile_&_robotique",
      "indirect_s2",
      "geometry_navigation",
      "depth_1"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-069",
    "worldCategory": "Atelier automobile & Robotique",
    "initialWorldPrompt": "Environnement interactif Atelier automobile & Robotique avec couloir de transit et zones fonctionnelles distinctes.",
    "editA": "Installe un équipement encombrant de type barrière ou meuble dans l'axe de transit de Atelier automobile & Robotique",
    "editB": "Attribue au mobile ou opérateur une tâche prioritaire traversant l'axe de transit de Atelier automobile & Robotique",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S2_Indirect",
    "indirectType": "GEOMETRY_INTERACTION",
    "dependencyDepth": 1,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0.77,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_3",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S2_Indirect (GEOMETRY_INTERACTION) depth 1"
    },
    "seed": 1068,
    "tags": [
      "atelier_automobile_&_robotique",
      "indirect_s2",
      "geometry_interaction",
      "depth_1"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-070",
    "worldCategory": "Atelier automobile & Robotique",
    "initialWorldPrompt": "Environnement interactif Atelier automobile & Robotique avec couloir de transit et zones fonctionnelles distinctes.",
    "editA": "Installe un équipement encombrant de type barrière ou meuble dans l'axe de transit de Atelier automobile & Robotique",
    "editB": "Attribue au mobile ou opérateur une tâche prioritaire traversant l'axe de transit de Atelier automobile & Robotique",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S2_Indirect",
    "indirectType": "GEOMETRY_PHYSICS",
    "dependencyDepth": 1,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0.36,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_1",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S2_Indirect (GEOMETRY_PHYSICS) depth 1"
    },
    "seed": 1069,
    "tags": [
      "atelier_automobile_&_robotique",
      "indirect_s2",
      "geometry_physics",
      "depth_1"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-071",
    "worldCategory": "Atelier automobile & Robotique",
    "initialWorldPrompt": "Environnement interactif Atelier automobile & Robotique avec couloir de transit et zones fonctionnelles distinctes.",
    "editA": "Installe un équipement encombrant de type barrière ou meuble dans l'axe de transit de Atelier automobile & Robotique",
    "editB": "Attribue au mobile ou opérateur une tâche prioritaire traversant l'axe de transit de Atelier automobile & Robotique",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S2_Indirect",
    "indirectType": "PHYSICS_NAVIGATION",
    "dependencyDepth": 2,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0.82,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_2",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S2_Indirect (PHYSICS_NAVIGATION) depth 2"
    },
    "seed": 1070,
    "tags": [
      "atelier_automobile_&_robotique",
      "indirect_s2",
      "physics_navigation",
      "depth_2"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-072",
    "worldCategory": "Atelier automobile & Robotique",
    "initialWorldPrompt": "Environnement interactif Atelier automobile & Robotique avec couloir de transit et zones fonctionnelles distinctes.",
    "editA": "Installe un équipement encombrant de type barrière ou meuble dans l'axe de transit de Atelier automobile & Robotique",
    "editB": "Attribue au mobile ou opérateur une tâche prioritaire traversant l'axe de transit de Atelier automobile & Robotique",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S2_Indirect",
    "indirectType": "IDENTITY_CAUSAL",
    "dependencyDepth": 2,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0.82,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_3",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S2_Indirect (IDENTITY_CAUSAL) depth 2"
    },
    "seed": 1071,
    "tags": [
      "atelier_automobile_&_robotique",
      "indirect_s2",
      "identity_causal",
      "depth_2"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-073",
    "worldCategory": "Atelier automobile & Robotique",
    "initialWorldPrompt": "Environnement interactif Atelier automobile & Robotique avec couloir de transit et zones fonctionnelles distinctes.",
    "editA": "Installe un équipement encombrant de type barrière ou meuble dans l'axe de transit de Atelier automobile & Robotique",
    "editB": "Attribue au mobile ou opérateur une tâche prioritaire traversant l'axe de transit de Atelier automobile & Robotique",
    "editCategoryA": "MOVE",
    "editCategoryB": "CHANGE_QUEST",
    "stratum": "S2_Indirect",
    "indirectType": "TRIGGER_TASK",
    "dependencyDepth": 2,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0.82,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_1",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S2_Indirect (TRIGGER_TASK) depth 2"
    },
    "seed": 1072,
    "tags": [
      "atelier_automobile_&_robotique",
      "indirect_s2",
      "trigger_task",
      "depth_2"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-074",
    "worldCategory": "Atelier automobile & Robotique",
    "initialWorldPrompt": "Environnement interactif Atelier automobile & Robotique avec couloir de transit et zones fonctionnelles distinctes.",
    "editA": "Installe un équipement encombrant de type barrière ou meuble dans l'axe de transit de Atelier automobile & Robotique",
    "editB": "Attribue au mobile ou opérateur une tâche prioritaire traversant l'axe de transit de Atelier automobile & Robotique",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S2_Indirect",
    "indirectType": "MULTI_HOP_CHAIN",
    "dependencyDepth": 3,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0.44,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_2",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S2_Indirect (MULTI_HOP_CHAIN) depth 3"
    },
    "seed": 1073,
    "tags": [
      "atelier_automobile_&_robotique",
      "indirect_s2",
      "multi_hop_chain",
      "depth_3"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-075",
    "worldCategory": "Maison connectée & IoT",
    "initialWorldPrompt": "Environnement interactif Maison connectée & IoT avec couloir de transit et zones fonctionnelles distinctes.",
    "editA": "Installe un équipement encombrant de type barrière ou meuble dans l'axe de transit de Maison connectée & IoT",
    "editB": "Attribue au mobile ou opérateur une tâche prioritaire traversant l'axe de transit de Maison connectée & IoT",
    "editCategoryA": "MOVE",
    "editCategoryB": "CHANGE_NAVIGATION",
    "stratum": "S2_Indirect",
    "indirectType": "GEOMETRY_NAVIGATION",
    "dependencyDepth": 1,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0.77,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_3",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S2_Indirect (GEOMETRY_NAVIGATION) depth 1"
    },
    "seed": 1074,
    "tags": [
      "maison_connectée_&_iot",
      "indirect_s2",
      "geometry_navigation",
      "depth_1"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-076",
    "worldCategory": "Maison connectée & IoT",
    "initialWorldPrompt": "Environnement interactif Maison connectée & IoT avec couloir de transit et zones fonctionnelles distinctes.",
    "editA": "Installe un équipement encombrant de type barrière ou meuble dans l'axe de transit de Maison connectée & IoT",
    "editB": "Attribue au mobile ou opérateur une tâche prioritaire traversant l'axe de transit de Maison connectée & IoT",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S2_Indirect",
    "indirectType": "GEOMETRY_INTERACTION",
    "dependencyDepth": 1,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0.77,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_1",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S2_Indirect (GEOMETRY_INTERACTION) depth 1"
    },
    "seed": 1075,
    "tags": [
      "maison_connectée_&_iot",
      "indirect_s2",
      "geometry_interaction",
      "depth_1"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-077",
    "worldCategory": "Maison connectée & IoT",
    "initialWorldPrompt": "Environnement interactif Maison connectée & IoT avec couloir de transit et zones fonctionnelles distinctes.",
    "editA": "Installe un équipement encombrant de type barrière ou meuble dans l'axe de transit de Maison connectée & IoT",
    "editB": "Attribue au mobile ou opérateur une tâche prioritaire traversant l'axe de transit de Maison connectée & IoT",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S2_Indirect",
    "indirectType": "GEOMETRY_PHYSICS",
    "dependencyDepth": 1,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0.36,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_2",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S2_Indirect (GEOMETRY_PHYSICS) depth 1"
    },
    "seed": 1076,
    "tags": [
      "maison_connectée_&_iot",
      "indirect_s2",
      "geometry_physics",
      "depth_1"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-078",
    "worldCategory": "Maison connectée & IoT",
    "initialWorldPrompt": "Environnement interactif Maison connectée & IoT avec couloir de transit et zones fonctionnelles distinctes.",
    "editA": "Installe un équipement encombrant de type barrière ou meuble dans l'axe de transit de Maison connectée & IoT",
    "editB": "Attribue au mobile ou opérateur une tâche prioritaire traversant l'axe de transit de Maison connectée & IoT",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S2_Indirect",
    "indirectType": "PHYSICS_NAVIGATION",
    "dependencyDepth": 2,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0.82,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_3",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S2_Indirect (PHYSICS_NAVIGATION) depth 2"
    },
    "seed": 1077,
    "tags": [
      "maison_connectée_&_iot",
      "indirect_s2",
      "physics_navigation",
      "depth_2"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-079",
    "worldCategory": "Maison connectée & IoT",
    "initialWorldPrompt": "Environnement interactif Maison connectée & IoT avec couloir de transit et zones fonctionnelles distinctes.",
    "editA": "Installe un équipement encombrant de type barrière ou meuble dans l'axe de transit de Maison connectée & IoT",
    "editB": "Attribue au mobile ou opérateur une tâche prioritaire traversant l'axe de transit de Maison connectée & IoT",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S2_Indirect",
    "indirectType": "IDENTITY_CAUSAL",
    "dependencyDepth": 2,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0.82,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_1",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S2_Indirect (IDENTITY_CAUSAL) depth 2"
    },
    "seed": 1078,
    "tags": [
      "maison_connectée_&_iot",
      "indirect_s2",
      "identity_causal",
      "depth_2"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-080",
    "worldCategory": "Maison connectée & IoT",
    "initialWorldPrompt": "Environnement interactif Maison connectée & IoT avec couloir de transit et zones fonctionnelles distinctes.",
    "editA": "Installe un équipement encombrant de type barrière ou meuble dans l'axe de transit de Maison connectée & IoT",
    "editB": "Attribue au mobile ou opérateur une tâche prioritaire traversant l'axe de transit de Maison connectée & IoT",
    "editCategoryA": "MOVE",
    "editCategoryB": "CHANGE_QUEST",
    "stratum": "S2_Indirect",
    "indirectType": "TRIGGER_TASK",
    "dependencyDepth": 2,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0.82,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_2",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S2_Indirect (TRIGGER_TASK) depth 2"
    },
    "seed": 1079,
    "tags": [
      "maison_connectée_&_iot",
      "indirect_s2",
      "trigger_task",
      "depth_2"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-081",
    "worldCategory": "Maison connectée & IoT",
    "initialWorldPrompt": "Environnement interactif Maison connectée & IoT avec couloir de transit et zones fonctionnelles distinctes.",
    "editA": "Installe un équipement encombrant de type barrière ou meuble dans l'axe de transit de Maison connectée & IoT",
    "editB": "Attribue au mobile ou opérateur une tâche prioritaire traversant l'axe de transit de Maison connectée & IoT",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S2_Indirect",
    "indirectType": "MULTI_HOP_CHAIN",
    "dependencyDepth": 3,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0.44,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_3",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S2_Indirect (MULTI_HOP_CHAIN) depth 3"
    },
    "seed": 1080,
    "tags": [
      "maison_connectée_&_iot",
      "indirect_s2",
      "multi_hop_chain",
      "depth_3"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-082",
    "worldCategory": "Station spatiale orbitale",
    "initialWorldPrompt": "Environnement interactif Station spatiale orbitale avec couloir de transit et zones fonctionnelles distinctes.",
    "editA": "Installe un équipement encombrant de type barrière ou meuble dans l'axe de transit de Station spatiale orbitale",
    "editB": "Attribue au mobile ou opérateur une tâche prioritaire traversant l'axe de transit de Station spatiale orbitale",
    "editCategoryA": "MOVE",
    "editCategoryB": "CHANGE_NAVIGATION",
    "stratum": "S2_Indirect",
    "indirectType": "GEOMETRY_NAVIGATION",
    "dependencyDepth": 1,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0.77,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_1",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S2_Indirect (GEOMETRY_NAVIGATION) depth 1"
    },
    "seed": 1081,
    "tags": [
      "station_spatiale_orbitale",
      "indirect_s2",
      "geometry_navigation",
      "depth_1"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-083",
    "worldCategory": "Station spatiale orbitale",
    "initialWorldPrompt": "Environnement interactif Station spatiale orbitale avec couloir de transit et zones fonctionnelles distinctes.",
    "editA": "Installe un équipement encombrant de type barrière ou meuble dans l'axe de transit de Station spatiale orbitale",
    "editB": "Attribue au mobile ou opérateur une tâche prioritaire traversant l'axe de transit de Station spatiale orbitale",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S2_Indirect",
    "indirectType": "GEOMETRY_INTERACTION",
    "dependencyDepth": 1,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0.77,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_2",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S2_Indirect (GEOMETRY_INTERACTION) depth 1"
    },
    "seed": 1082,
    "tags": [
      "station_spatiale_orbitale",
      "indirect_s2",
      "geometry_interaction",
      "depth_1"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-084",
    "worldCategory": "Station spatiale orbitale",
    "initialWorldPrompt": "Environnement interactif Station spatiale orbitale avec couloir de transit et zones fonctionnelles distinctes.",
    "editA": "Installe un équipement encombrant de type barrière ou meuble dans l'axe de transit de Station spatiale orbitale",
    "editB": "Attribue au mobile ou opérateur une tâche prioritaire traversant l'axe de transit de Station spatiale orbitale",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S2_Indirect",
    "indirectType": "GEOMETRY_PHYSICS",
    "dependencyDepth": 1,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0.36,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_3",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S2_Indirect (GEOMETRY_PHYSICS) depth 1"
    },
    "seed": 1083,
    "tags": [
      "station_spatiale_orbitale",
      "indirect_s2",
      "geometry_physics",
      "depth_1"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-085",
    "worldCategory": "Station spatiale orbitale",
    "initialWorldPrompt": "Environnement interactif Station spatiale orbitale avec couloir de transit et zones fonctionnelles distinctes.",
    "editA": "Installe un équipement encombrant de type barrière ou meuble dans l'axe de transit de Station spatiale orbitale",
    "editB": "Attribue au mobile ou opérateur une tâche prioritaire traversant l'axe de transit de Station spatiale orbitale",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S2_Indirect",
    "indirectType": "PHYSICS_NAVIGATION",
    "dependencyDepth": 2,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0.82,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_1",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S2_Indirect (PHYSICS_NAVIGATION) depth 2"
    },
    "seed": 1084,
    "tags": [
      "station_spatiale_orbitale",
      "indirect_s2",
      "physics_navigation",
      "depth_2"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-086",
    "worldCategory": "Station spatiale orbitale",
    "initialWorldPrompt": "Environnement interactif Station spatiale orbitale avec couloir de transit et zones fonctionnelles distinctes.",
    "editA": "Installe un équipement encombrant de type barrière ou meuble dans l'axe de transit de Station spatiale orbitale",
    "editB": "Attribue au mobile ou opérateur une tâche prioritaire traversant l'axe de transit de Station spatiale orbitale",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S2_Indirect",
    "indirectType": "IDENTITY_CAUSAL",
    "dependencyDepth": 2,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0.82,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_2",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S2_Indirect (IDENTITY_CAUSAL) depth 2"
    },
    "seed": 1085,
    "tags": [
      "station_spatiale_orbitale",
      "indirect_s2",
      "identity_causal",
      "depth_2"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-087",
    "worldCategory": "Station spatiale orbitale",
    "initialWorldPrompt": "Environnement interactif Station spatiale orbitale avec couloir de transit et zones fonctionnelles distinctes.",
    "editA": "Installe un équipement encombrant de type barrière ou meuble dans l'axe de transit de Station spatiale orbitale",
    "editB": "Attribue au mobile ou opérateur une tâche prioritaire traversant l'axe de transit de Station spatiale orbitale",
    "editCategoryA": "MOVE",
    "editCategoryB": "CHANGE_QUEST",
    "stratum": "S2_Indirect",
    "indirectType": "TRIGGER_TASK",
    "dependencyDepth": 2,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0.82,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_3",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S2_Indirect (TRIGGER_TASK) depth 2"
    },
    "seed": 1086,
    "tags": [
      "station_spatiale_orbitale",
      "indirect_s2",
      "trigger_task",
      "depth_2"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-088",
    "worldCategory": "Station spatiale orbitale",
    "initialWorldPrompt": "Environnement interactif Station spatiale orbitale avec couloir de transit et zones fonctionnelles distinctes.",
    "editA": "Installe un équipement encombrant de type barrière ou meuble dans l'axe de transit de Station spatiale orbitale",
    "editB": "Attribue au mobile ou opérateur une tâche prioritaire traversant l'axe de transit de Station spatiale orbitale",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S2_Indirect",
    "indirectType": "MULTI_HOP_CHAIN",
    "dependencyDepth": 3,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0.44,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_1",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S2_Indirect (MULTI_HOP_CHAIN) depth 3"
    },
    "seed": 1087,
    "tags": [
      "station_spatiale_orbitale",
      "indirect_s2",
      "multi_hop_chain",
      "depth_3"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-089",
    "worldCategory": "Showroom de luxe & Retail",
    "initialWorldPrompt": "Environnement interactif Showroom de luxe & Retail avec couloir de transit et zones fonctionnelles distinctes.",
    "editA": "Installe un équipement encombrant de type barrière ou meuble dans l'axe de transit de Showroom de luxe & Retail",
    "editB": "Attribue au mobile ou opérateur une tâche prioritaire traversant l'axe de transit de Showroom de luxe & Retail",
    "editCategoryA": "MOVE",
    "editCategoryB": "CHANGE_NAVIGATION",
    "stratum": "S2_Indirect",
    "indirectType": "GEOMETRY_NAVIGATION",
    "dependencyDepth": 1,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0.77,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_2",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S2_Indirect (GEOMETRY_NAVIGATION) depth 1"
    },
    "seed": 1088,
    "tags": [
      "showroom_de_luxe_&_retail",
      "indirect_s2",
      "geometry_navigation",
      "depth_1"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-090",
    "worldCategory": "Showroom de luxe & Retail",
    "initialWorldPrompt": "Environnement interactif Showroom de luxe & Retail avec couloir de transit et zones fonctionnelles distinctes.",
    "editA": "Installe un équipement encombrant de type barrière ou meuble dans l'axe de transit de Showroom de luxe & Retail",
    "editB": "Attribue au mobile ou opérateur une tâche prioritaire traversant l'axe de transit de Showroom de luxe & Retail",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S2_Indirect",
    "indirectType": "GEOMETRY_INTERACTION",
    "dependencyDepth": 1,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0.77,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_3",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S2_Indirect (GEOMETRY_INTERACTION) depth 1"
    },
    "seed": 1089,
    "tags": [
      "showroom_de_luxe_&_retail",
      "indirect_s2",
      "geometry_interaction",
      "depth_1"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-091",
    "worldCategory": "Showroom de luxe & Retail",
    "initialWorldPrompt": "Environnement interactif Showroom de luxe & Retail avec couloir de transit et zones fonctionnelles distinctes.",
    "editA": "Installe un équipement encombrant de type barrière ou meuble dans l'axe de transit de Showroom de luxe & Retail",
    "editB": "Attribue au mobile ou opérateur une tâche prioritaire traversant l'axe de transit de Showroom de luxe & Retail",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S2_Indirect",
    "indirectType": "GEOMETRY_PHYSICS",
    "dependencyDepth": 1,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0.36,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_1",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S2_Indirect (GEOMETRY_PHYSICS) depth 1"
    },
    "seed": 1090,
    "tags": [
      "showroom_de_luxe_&_retail",
      "indirect_s2",
      "geometry_physics",
      "depth_1"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-092",
    "worldCategory": "Showroom de luxe & Retail",
    "initialWorldPrompt": "Environnement interactif Showroom de luxe & Retail avec couloir de transit et zones fonctionnelles distinctes.",
    "editA": "Installe un équipement encombrant de type barrière ou meuble dans l'axe de transit de Showroom de luxe & Retail",
    "editB": "Attribue au mobile ou opérateur une tâche prioritaire traversant l'axe de transit de Showroom de luxe & Retail",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S2_Indirect",
    "indirectType": "PHYSICS_NAVIGATION",
    "dependencyDepth": 2,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0.82,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_2",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S2_Indirect (PHYSICS_NAVIGATION) depth 2"
    },
    "seed": 1091,
    "tags": [
      "showroom_de_luxe_&_retail",
      "indirect_s2",
      "physics_navigation",
      "depth_2"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-093",
    "worldCategory": "Showroom de luxe & Retail",
    "initialWorldPrompt": "Environnement interactif Showroom de luxe & Retail avec couloir de transit et zones fonctionnelles distinctes.",
    "editA": "Installe un équipement encombrant de type barrière ou meuble dans l'axe de transit de Showroom de luxe & Retail",
    "editB": "Attribue au mobile ou opérateur une tâche prioritaire traversant l'axe de transit de Showroom de luxe & Retail",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S2_Indirect",
    "indirectType": "IDENTITY_CAUSAL",
    "dependencyDepth": 2,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0.82,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_3",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S2_Indirect (IDENTITY_CAUSAL) depth 2"
    },
    "seed": 1092,
    "tags": [
      "showroom_de_luxe_&_retail",
      "indirect_s2",
      "identity_causal",
      "depth_2"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-094",
    "worldCategory": "Showroom de luxe & Retail",
    "initialWorldPrompt": "Environnement interactif Showroom de luxe & Retail avec couloir de transit et zones fonctionnelles distinctes.",
    "editA": "Installe un équipement encombrant de type barrière ou meuble dans l'axe de transit de Showroom de luxe & Retail",
    "editB": "Attribue au mobile ou opérateur une tâche prioritaire traversant l'axe de transit de Showroom de luxe & Retail",
    "editCategoryA": "MOVE",
    "editCategoryB": "CHANGE_QUEST",
    "stratum": "S2_Indirect",
    "indirectType": "TRIGGER_TASK",
    "dependencyDepth": 2,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0.82,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_1",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S2_Indirect (TRIGGER_TASK) depth 2"
    },
    "seed": 1093,
    "tags": [
      "showroom_de_luxe_&_retail",
      "indirect_s2",
      "trigger_task",
      "depth_2"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-095",
    "worldCategory": "Showroom de luxe & Retail",
    "initialWorldPrompt": "Environnement interactif Showroom de luxe & Retail avec couloir de transit et zones fonctionnelles distinctes.",
    "editA": "Installe un équipement encombrant de type barrière ou meuble dans l'axe de transit de Showroom de luxe & Retail",
    "editB": "Attribue au mobile ou opérateur une tâche prioritaire traversant l'axe de transit de Showroom de luxe & Retail",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S2_Indirect",
    "indirectType": "MULTI_HOP_CHAIN",
    "dependencyDepth": 3,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0.44,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_2",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S2_Indirect (MULTI_HOP_CHAIN) depth 3"
    },
    "seed": 1094,
    "tags": [
      "showroom_de_luxe_&_retail",
      "indirect_s2",
      "multi_hop_chain",
      "depth_3"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-096",
    "worldCategory": "Salle de classe & Éducation",
    "initialWorldPrompt": "Environnement interactif Salle de classe & Éducation avec couloir de transit et zones fonctionnelles distinctes.",
    "editA": "Installe un équipement encombrant de type barrière ou meuble dans l'axe de transit de Salle de classe & Éducation",
    "editB": "Attribue au mobile ou opérateur une tâche prioritaire traversant l'axe de transit de Salle de classe & Éducation",
    "editCategoryA": "MOVE",
    "editCategoryB": "CHANGE_NAVIGATION",
    "stratum": "S2_Indirect",
    "indirectType": "GEOMETRY_NAVIGATION",
    "dependencyDepth": 1,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0.77,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_3",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S2_Indirect (GEOMETRY_NAVIGATION) depth 1"
    },
    "seed": 1095,
    "tags": [
      "salle_de_classe_&_éducation",
      "indirect_s2",
      "geometry_navigation",
      "depth_1"
    ],
    "split": "val"
  },
  {
    "id": "WP2-EO-097",
    "worldCategory": "Salle de classe & Éducation",
    "initialWorldPrompt": "Environnement interactif Salle de classe & Éducation avec couloir de transit et zones fonctionnelles distinctes.",
    "editA": "Installe un équipement encombrant de type barrière ou meuble dans l'axe de transit de Salle de classe & Éducation",
    "editB": "Attribue au mobile ou opérateur une tâche prioritaire traversant l'axe de transit de Salle de classe & Éducation",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S2_Indirect",
    "indirectType": "GEOMETRY_INTERACTION",
    "dependencyDepth": 1,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0.77,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_1",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S2_Indirect (GEOMETRY_INTERACTION) depth 1"
    },
    "seed": 1096,
    "tags": [
      "salle_de_classe_&_éducation",
      "indirect_s2",
      "geometry_interaction",
      "depth_1"
    ],
    "split": "val"
  },
  {
    "id": "WP2-EO-098",
    "worldCategory": "Salle de classe & Éducation",
    "initialWorldPrompt": "Environnement interactif Salle de classe & Éducation avec couloir de transit et zones fonctionnelles distinctes.",
    "editA": "Installe un équipement encombrant de type barrière ou meuble dans l'axe de transit de Salle de classe & Éducation",
    "editB": "Attribue au mobile ou opérateur une tâche prioritaire traversant l'axe de transit de Salle de classe & Éducation",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S2_Indirect",
    "indirectType": "GEOMETRY_PHYSICS",
    "dependencyDepth": 1,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0.36,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_2",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S2_Indirect (GEOMETRY_PHYSICS) depth 1"
    },
    "seed": 1097,
    "tags": [
      "salle_de_classe_&_éducation",
      "indirect_s2",
      "geometry_physics",
      "depth_1"
    ],
    "split": "val"
  },
  {
    "id": "WP2-EO-099",
    "worldCategory": "Salle de classe & Éducation",
    "initialWorldPrompt": "Environnement interactif Salle de classe & Éducation avec couloir de transit et zones fonctionnelles distinctes.",
    "editA": "Installe un équipement encombrant de type barrière ou meuble dans l'axe de transit de Salle de classe & Éducation",
    "editB": "Attribue au mobile ou opérateur une tâche prioritaire traversant l'axe de transit de Salle de classe & Éducation",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S2_Indirect",
    "indirectType": "PHYSICS_NAVIGATION",
    "dependencyDepth": 2,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0.82,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_3",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S2_Indirect (PHYSICS_NAVIGATION) depth 2"
    },
    "seed": 1098,
    "tags": [
      "salle_de_classe_&_éducation",
      "indirect_s2",
      "physics_navigation",
      "depth_2"
    ],
    "split": "val"
  },
  {
    "id": "WP2-EO-100",
    "worldCategory": "Salle de classe & Éducation",
    "initialWorldPrompt": "Environnement interactif Salle de classe & Éducation avec couloir de transit et zones fonctionnelles distinctes.",
    "editA": "Installe un équipement encombrant de type barrière ou meuble dans l'axe de transit de Salle de classe & Éducation",
    "editB": "Attribue au mobile ou opérateur une tâche prioritaire traversant l'axe de transit de Salle de classe & Éducation",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S2_Indirect",
    "indirectType": "IDENTITY_CAUSAL",
    "dependencyDepth": 2,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0.82,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_1",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S2_Indirect (IDENTITY_CAUSAL) depth 2"
    },
    "seed": 1099,
    "tags": [
      "salle_de_classe_&_éducation",
      "indirect_s2",
      "identity_causal",
      "depth_2"
    ],
    "split": "val"
  },
  {
    "id": "WP2-EO-101",
    "worldCategory": "Salle de classe & Éducation",
    "initialWorldPrompt": "Environnement interactif Salle de classe & Éducation avec couloir de transit et zones fonctionnelles distinctes.",
    "editA": "Installe un équipement encombrant de type barrière ou meuble dans l'axe de transit de Salle de classe & Éducation",
    "editB": "Attribue au mobile ou opérateur une tâche prioritaire traversant l'axe de transit de Salle de classe & Éducation",
    "editCategoryA": "MOVE",
    "editCategoryB": "CHANGE_QUEST",
    "stratum": "S2_Indirect",
    "indirectType": "TRIGGER_TASK",
    "dependencyDepth": 2,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0.82,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_2",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S2_Indirect (TRIGGER_TASK) depth 2"
    },
    "seed": 1100,
    "tags": [
      "salle_de_classe_&_éducation",
      "indirect_s2",
      "trigger_task",
      "depth_2"
    ],
    "split": "val"
  },
  {
    "id": "WP2-EO-102",
    "worldCategory": "Salle de classe & Éducation",
    "initialWorldPrompt": "Environnement interactif Salle de classe & Éducation avec couloir de transit et zones fonctionnelles distinctes.",
    "editA": "Installe un équipement encombrant de type barrière ou meuble dans l'axe de transit de Salle de classe & Éducation",
    "editB": "Attribue au mobile ou opérateur une tâche prioritaire traversant l'axe de transit de Salle de classe & Éducation",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S2_Indirect",
    "indirectType": "MULTI_HOP_CHAIN",
    "dependencyDepth": 3,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0.44,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_3",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S2_Indirect (MULTI_HOP_CHAIN) depth 3"
    },
    "seed": 1101,
    "tags": [
      "salle_de_classe_&_éducation",
      "indirect_s2",
      "multi_hop_chain",
      "depth_3"
    ],
    "split": "val"
  },
  {
    "id": "WP2-EO-103",
    "worldCategory": "Atelier culinaire & Pâtisserie",
    "initialWorldPrompt": "Environnement interactif Atelier culinaire & Pâtisserie avec couloir de transit et zones fonctionnelles distinctes.",
    "editA": "Installe un équipement encombrant de type barrière ou meuble dans l'axe de transit de Atelier culinaire & Pâtisserie",
    "editB": "Attribue au mobile ou opérateur une tâche prioritaire traversant l'axe de transit de Atelier culinaire & Pâtisserie",
    "editCategoryA": "MOVE",
    "editCategoryB": "CHANGE_NAVIGATION",
    "stratum": "S2_Indirect",
    "indirectType": "GEOMETRY_NAVIGATION",
    "dependencyDepth": 1,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0.77,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_1",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S2_Indirect (GEOMETRY_NAVIGATION) depth 1"
    },
    "seed": 1102,
    "tags": [
      "atelier_culinaire_&_pâtisserie",
      "indirect_s2",
      "geometry_navigation",
      "depth_1"
    ],
    "split": "val"
  },
  {
    "id": "WP2-EO-104",
    "worldCategory": "Atelier culinaire & Pâtisserie",
    "initialWorldPrompt": "Environnement interactif Atelier culinaire & Pâtisserie avec couloir de transit et zones fonctionnelles distinctes.",
    "editA": "Installe un équipement encombrant de type barrière ou meuble dans l'axe de transit de Atelier culinaire & Pâtisserie",
    "editB": "Attribue au mobile ou opérateur une tâche prioritaire traversant l'axe de transit de Atelier culinaire & Pâtisserie",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S2_Indirect",
    "indirectType": "GEOMETRY_INTERACTION",
    "dependencyDepth": 1,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0.77,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_2",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S2_Indirect (GEOMETRY_INTERACTION) depth 1"
    },
    "seed": 1103,
    "tags": [
      "atelier_culinaire_&_pâtisserie",
      "indirect_s2",
      "geometry_interaction",
      "depth_1"
    ],
    "split": "val"
  },
  {
    "id": "WP2-EO-105",
    "worldCategory": "Atelier culinaire & Pâtisserie",
    "initialWorldPrompt": "Environnement interactif Atelier culinaire & Pâtisserie avec couloir de transit et zones fonctionnelles distinctes.",
    "editA": "Installe un équipement encombrant de type barrière ou meuble dans l'axe de transit de Atelier culinaire & Pâtisserie",
    "editB": "Attribue au mobile ou opérateur une tâche prioritaire traversant l'axe de transit de Atelier culinaire & Pâtisserie",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S2_Indirect",
    "indirectType": "GEOMETRY_PHYSICS",
    "dependencyDepth": 1,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0.36,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_3",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S2_Indirect (GEOMETRY_PHYSICS) depth 1"
    },
    "seed": 1104,
    "tags": [
      "atelier_culinaire_&_pâtisserie",
      "indirect_s2",
      "geometry_physics",
      "depth_1"
    ],
    "split": "val"
  },
  {
    "id": "WP2-EO-106",
    "worldCategory": "Atelier culinaire & Pâtisserie",
    "initialWorldPrompt": "Environnement interactif Atelier culinaire & Pâtisserie avec couloir de transit et zones fonctionnelles distinctes.",
    "editA": "Installe un équipement encombrant de type barrière ou meuble dans l'axe de transit de Atelier culinaire & Pâtisserie",
    "editB": "Attribue au mobile ou opérateur une tâche prioritaire traversant l'axe de transit de Atelier culinaire & Pâtisserie",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S2_Indirect",
    "indirectType": "PHYSICS_NAVIGATION",
    "dependencyDepth": 2,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0.82,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_1",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S2_Indirect (PHYSICS_NAVIGATION) depth 2"
    },
    "seed": 1105,
    "tags": [
      "atelier_culinaire_&_pâtisserie",
      "indirect_s2",
      "physics_navigation",
      "depth_2"
    ],
    "split": "val"
  },
  {
    "id": "WP2-EO-107",
    "worldCategory": "Atelier culinaire & Pâtisserie",
    "initialWorldPrompt": "Environnement interactif Atelier culinaire & Pâtisserie avec couloir de transit et zones fonctionnelles distinctes.",
    "editA": "Installe un équipement encombrant de type barrière ou meuble dans l'axe de transit de Atelier culinaire & Pâtisserie",
    "editB": "Attribue au mobile ou opérateur une tâche prioritaire traversant l'axe de transit de Atelier culinaire & Pâtisserie",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S2_Indirect",
    "indirectType": "IDENTITY_CAUSAL",
    "dependencyDepth": 2,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0.82,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_2",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S2_Indirect (IDENTITY_CAUSAL) depth 2"
    },
    "seed": 1106,
    "tags": [
      "atelier_culinaire_&_pâtisserie",
      "indirect_s2",
      "identity_causal",
      "depth_2"
    ],
    "split": "val"
  },
  {
    "id": "WP2-EO-108",
    "worldCategory": "Atelier culinaire & Pâtisserie",
    "initialWorldPrompt": "Environnement interactif Atelier culinaire & Pâtisserie avec couloir de transit et zones fonctionnelles distinctes.",
    "editA": "Installe un équipement encombrant de type barrière ou meuble dans l'axe de transit de Atelier culinaire & Pâtisserie",
    "editB": "Attribue au mobile ou opérateur une tâche prioritaire traversant l'axe de transit de Atelier culinaire & Pâtisserie",
    "editCategoryA": "MOVE",
    "editCategoryB": "CHANGE_QUEST",
    "stratum": "S2_Indirect",
    "indirectType": "TRIGGER_TASK",
    "dependencyDepth": 2,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0.82,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_3",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S2_Indirect (TRIGGER_TASK) depth 2"
    },
    "seed": 1107,
    "tags": [
      "atelier_culinaire_&_pâtisserie",
      "indirect_s2",
      "trigger_task",
      "depth_2"
    ],
    "split": "val"
  },
  {
    "id": "WP2-EO-109",
    "worldCategory": "Atelier culinaire & Pâtisserie",
    "initialWorldPrompt": "Environnement interactif Atelier culinaire & Pâtisserie avec couloir de transit et zones fonctionnelles distinctes.",
    "editA": "Installe un équipement encombrant de type barrière ou meuble dans l'axe de transit de Atelier culinaire & Pâtisserie",
    "editB": "Attribue au mobile ou opérateur une tâche prioritaire traversant l'axe de transit de Atelier culinaire & Pâtisserie",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S2_Indirect",
    "indirectType": "MULTI_HOP_CHAIN",
    "dependencyDepth": 3,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0.44,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_1",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S2_Indirect (MULTI_HOP_CHAIN) depth 3"
    },
    "seed": 1108,
    "tags": [
      "atelier_culinaire_&_pâtisserie",
      "indirect_s2",
      "multi_hop_chain",
      "depth_3"
    ],
    "split": "val"
  },
  {
    "id": "WP2-EO-110",
    "worldCategory": "Centre médical & Simulation",
    "initialWorldPrompt": "Environnement interactif Centre médical & Simulation avec couloir de transit et zones fonctionnelles distinctes.",
    "editA": "Installe un équipement encombrant de type barrière ou meuble dans l'axe de transit de Centre médical & Simulation",
    "editB": "Attribue au mobile ou opérateur une tâche prioritaire traversant l'axe de transit de Centre médical & Simulation",
    "editCategoryA": "MOVE",
    "editCategoryB": "CHANGE_NAVIGATION",
    "stratum": "S2_Indirect",
    "indirectType": "GEOMETRY_NAVIGATION",
    "dependencyDepth": 1,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0.77,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_2",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S2_Indirect (GEOMETRY_NAVIGATION) depth 1"
    },
    "seed": 1109,
    "tags": [
      "centre_médical_&_simulation",
      "indirect_s2",
      "geometry_navigation",
      "depth_1"
    ],
    "split": "test_locked"
  },
  {
    "id": "WP2-EO-111",
    "worldCategory": "Centre médical & Simulation",
    "initialWorldPrompt": "Environnement interactif Centre médical & Simulation avec couloir de transit et zones fonctionnelles distinctes.",
    "editA": "Installe un équipement encombrant de type barrière ou meuble dans l'axe de transit de Centre médical & Simulation",
    "editB": "Attribue au mobile ou opérateur une tâche prioritaire traversant l'axe de transit de Centre médical & Simulation",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S2_Indirect",
    "indirectType": "GEOMETRY_INTERACTION",
    "dependencyDepth": 1,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0.77,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_3",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S2_Indirect (GEOMETRY_INTERACTION) depth 1"
    },
    "seed": 1110,
    "tags": [
      "centre_médical_&_simulation",
      "indirect_s2",
      "geometry_interaction",
      "depth_1"
    ],
    "split": "test_locked"
  },
  {
    "id": "WP2-EO-112",
    "worldCategory": "Centre médical & Simulation",
    "initialWorldPrompt": "Environnement interactif Centre médical & Simulation avec couloir de transit et zones fonctionnelles distinctes.",
    "editA": "Installe un équipement encombrant de type barrière ou meuble dans l'axe de transit de Centre médical & Simulation",
    "editB": "Attribue au mobile ou opérateur une tâche prioritaire traversant l'axe de transit de Centre médical & Simulation",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S2_Indirect",
    "indirectType": "GEOMETRY_PHYSICS",
    "dependencyDepth": 1,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0.36,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_1",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S2_Indirect (GEOMETRY_PHYSICS) depth 1"
    },
    "seed": 1111,
    "tags": [
      "centre_médical_&_simulation",
      "indirect_s2",
      "geometry_physics",
      "depth_1"
    ],
    "split": "test_locked"
  },
  {
    "id": "WP2-EO-113",
    "worldCategory": "Centre médical & Simulation",
    "initialWorldPrompt": "Environnement interactif Centre médical & Simulation avec couloir de transit et zones fonctionnelles distinctes.",
    "editA": "Installe un équipement encombrant de type barrière ou meuble dans l'axe de transit de Centre médical & Simulation",
    "editB": "Attribue au mobile ou opérateur une tâche prioritaire traversant l'axe de transit de Centre médical & Simulation",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S2_Indirect",
    "indirectType": "PHYSICS_NAVIGATION",
    "dependencyDepth": 2,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0.82,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_2",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S2_Indirect (PHYSICS_NAVIGATION) depth 2"
    },
    "seed": 1112,
    "tags": [
      "centre_médical_&_simulation",
      "indirect_s2",
      "physics_navigation",
      "depth_2"
    ],
    "split": "test_locked"
  },
  {
    "id": "WP2-EO-114",
    "worldCategory": "Centre médical & Simulation",
    "initialWorldPrompt": "Environnement interactif Centre médical & Simulation avec couloir de transit et zones fonctionnelles distinctes.",
    "editA": "Installe un équipement encombrant de type barrière ou meuble dans l'axe de transit de Centre médical & Simulation",
    "editB": "Attribue au mobile ou opérateur une tâche prioritaire traversant l'axe de transit de Centre médical & Simulation",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S2_Indirect",
    "indirectType": "IDENTITY_CAUSAL",
    "dependencyDepth": 2,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0.82,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_3",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S2_Indirect (IDENTITY_CAUSAL) depth 2"
    },
    "seed": 1113,
    "tags": [
      "centre_médical_&_simulation",
      "indirect_s2",
      "identity_causal",
      "depth_2"
    ],
    "split": "test_locked"
  },
  {
    "id": "WP2-EO-115",
    "worldCategory": "Centre médical & Simulation",
    "initialWorldPrompt": "Environnement interactif Centre médical & Simulation avec couloir de transit et zones fonctionnelles distinctes.",
    "editA": "Installe un équipement encombrant de type barrière ou meuble dans l'axe de transit de Centre médical & Simulation",
    "editB": "Attribue au mobile ou opérateur une tâche prioritaire traversant l'axe de transit de Centre médical & Simulation",
    "editCategoryA": "MOVE",
    "editCategoryB": "CHANGE_QUEST",
    "stratum": "S2_Indirect",
    "indirectType": "TRIGGER_TASK",
    "dependencyDepth": 2,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0.82,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_1",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S2_Indirect (TRIGGER_TASK) depth 2"
    },
    "seed": 1114,
    "tags": [
      "centre_médical_&_simulation",
      "indirect_s2",
      "trigger_task",
      "depth_2"
    ],
    "split": "test_locked"
  },
  {
    "id": "WP2-EO-116",
    "worldCategory": "Centre médical & Simulation",
    "initialWorldPrompt": "Environnement interactif Centre médical & Simulation avec couloir de transit et zones fonctionnelles distinctes.",
    "editA": "Installe un équipement encombrant de type barrière ou meuble dans l'axe de transit de Centre médical & Simulation",
    "editB": "Attribue au mobile ou opérateur une tâche prioritaire traversant l'axe de transit de Centre médical & Simulation",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S2_Indirect",
    "indirectType": "MULTI_HOP_CHAIN",
    "dependencyDepth": 3,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0.44,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_2",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S2_Indirect (MULTI_HOP_CHAIN) depth 3"
    },
    "seed": 1115,
    "tags": [
      "centre_médical_&_simulation",
      "indirect_s2",
      "multi_hop_chain",
      "depth_3"
    ],
    "split": "test_locked"
  },
  {
    "id": "WP2-EO-117",
    "worldCategory": "Montage meuble & DIY",
    "initialWorldPrompt": "Environnement interactif Montage meuble & DIY avec couloir de transit et zones fonctionnelles distinctes.",
    "editA": "Installe un équipement encombrant de type barrière ou meuble dans l'axe de transit de Montage meuble & DIY",
    "editB": "Attribue au mobile ou opérateur une tâche prioritaire traversant l'axe de transit de Montage meuble & DIY",
    "editCategoryA": "MOVE",
    "editCategoryB": "CHANGE_NAVIGATION",
    "stratum": "S2_Indirect",
    "indirectType": "GEOMETRY_NAVIGATION",
    "dependencyDepth": 1,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0.77,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_3",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S2_Indirect (GEOMETRY_NAVIGATION) depth 1"
    },
    "seed": 1116,
    "tags": [
      "montage_meuble_&_diy",
      "indirect_s2",
      "geometry_navigation",
      "depth_1"
    ],
    "split": "test_locked"
  },
  {
    "id": "WP2-EO-118",
    "worldCategory": "Montage meuble & DIY",
    "initialWorldPrompt": "Environnement interactif Montage meuble & DIY avec couloir de transit et zones fonctionnelles distinctes.",
    "editA": "Installe un équipement encombrant de type barrière ou meuble dans l'axe de transit de Montage meuble & DIY",
    "editB": "Attribue au mobile ou opérateur une tâche prioritaire traversant l'axe de transit de Montage meuble & DIY",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S2_Indirect",
    "indirectType": "GEOMETRY_INTERACTION",
    "dependencyDepth": 1,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0.77,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_1",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S2_Indirect (GEOMETRY_INTERACTION) depth 1"
    },
    "seed": 1117,
    "tags": [
      "montage_meuble_&_diy",
      "indirect_s2",
      "geometry_interaction",
      "depth_1"
    ],
    "split": "test_locked"
  },
  {
    "id": "WP2-EO-119",
    "worldCategory": "Montage meuble & DIY",
    "initialWorldPrompt": "Environnement interactif Montage meuble & DIY avec couloir de transit et zones fonctionnelles distinctes.",
    "editA": "Installe un équipement encombrant de type barrière ou meuble dans l'axe de transit de Montage meuble & DIY",
    "editB": "Attribue au mobile ou opérateur une tâche prioritaire traversant l'axe de transit de Montage meuble & DIY",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S2_Indirect",
    "indirectType": "GEOMETRY_PHYSICS",
    "dependencyDepth": 1,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0.36,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_2",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S2_Indirect (GEOMETRY_PHYSICS) depth 1"
    },
    "seed": 1118,
    "tags": [
      "montage_meuble_&_diy",
      "indirect_s2",
      "geometry_physics",
      "depth_1"
    ],
    "split": "test_locked"
  },
  {
    "id": "WP2-EO-120",
    "worldCategory": "Montage meuble & DIY",
    "initialWorldPrompt": "Environnement interactif Montage meuble & DIY avec couloir de transit et zones fonctionnelles distinctes.",
    "editA": "Installe un équipement encombrant de type barrière ou meuble dans l'axe de transit de Montage meuble & DIY",
    "editB": "Attribue au mobile ou opérateur une tâche prioritaire traversant l'axe de transit de Montage meuble & DIY",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S2_Indirect",
    "indirectType": "PHYSICS_NAVIGATION",
    "dependencyDepth": 2,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0.82,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_3",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S2_Indirect (PHYSICS_NAVIGATION) depth 2"
    },
    "seed": 1119,
    "tags": [
      "montage_meuble_&_diy",
      "indirect_s2",
      "physics_navigation",
      "depth_2"
    ],
    "split": "test_locked"
  },
  {
    "id": "WP2-EO-121",
    "worldCategory": "Montage meuble & DIY",
    "initialWorldPrompt": "Environnement interactif Montage meuble & DIY avec couloir de transit et zones fonctionnelles distinctes.",
    "editA": "Installe un équipement encombrant de type barrière ou meuble dans l'axe de transit de Montage meuble & DIY",
    "editB": "Attribue au mobile ou opérateur une tâche prioritaire traversant l'axe de transit de Montage meuble & DIY",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S2_Indirect",
    "indirectType": "IDENTITY_CAUSAL",
    "dependencyDepth": 2,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0.82,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_1",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S2_Indirect (IDENTITY_CAUSAL) depth 2"
    },
    "seed": 1120,
    "tags": [
      "montage_meuble_&_diy",
      "indirect_s2",
      "identity_causal",
      "depth_2"
    ],
    "split": "test_locked"
  },
  {
    "id": "WP2-EO-122",
    "worldCategory": "Montage meuble & DIY",
    "initialWorldPrompt": "Environnement interactif Montage meuble & DIY avec couloir de transit et zones fonctionnelles distinctes.",
    "editA": "Installe un équipement encombrant de type barrière ou meuble dans l'axe de transit de Montage meuble & DIY",
    "editB": "Attribue au mobile ou opérateur une tâche prioritaire traversant l'axe de transit de Montage meuble & DIY",
    "editCategoryA": "MOVE",
    "editCategoryB": "CHANGE_QUEST",
    "stratum": "S2_Indirect",
    "indirectType": "TRIGGER_TASK",
    "dependencyDepth": 2,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0.82,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_2",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S2_Indirect (TRIGGER_TASK) depth 2"
    },
    "seed": 1121,
    "tags": [
      "montage_meuble_&_diy",
      "indirect_s2",
      "trigger_task",
      "depth_2"
    ],
    "split": "test_locked"
  },
  {
    "id": "WP2-EO-123",
    "worldCategory": "Montage meuble & DIY",
    "initialWorldPrompt": "Environnement interactif Montage meuble & DIY avec couloir de transit et zones fonctionnelles distinctes.",
    "editA": "Installe un équipement encombrant de type barrière ou meuble dans l'axe de transit de Montage meuble & DIY",
    "editB": "Attribue au mobile ou opérateur une tâche prioritaire traversant l'axe de transit de Montage meuble & DIY",
    "editCategoryA": "MOVE",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S2_Indirect",
    "indirectType": "MULTI_HOP_CHAIN",
    "dependencyDepth": 3,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0.44,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_3",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S2_Indirect (MULTI_HOP_CHAIN) depth 3"
    },
    "seed": 1122,
    "tags": [
      "montage_meuble_&_diy",
      "indirect_s2",
      "multi_hop_chain",
      "depth_3"
    ],
    "split": "test_locked"
  },
  {
    "id": "WP2-EO-124",
    "worldCategory": "Game Design Lab & Escape Room",
    "initialWorldPrompt": "Environnement interactif Game Design Lab & Escape Room avec couloir de transit et zones fonctionnelles distinctes.",
    "editA": "Installe un équipement encombrant de type barrière ou meuble dans l'axe de transit de Game Design Lab & Escape Room",
    "editB": "Attribue au mobile ou opérateur une tâche prioritaire traversant l'axe de transit de Game Design Lab & Escape Room",
    "editCategoryA": "MOVE",
    "editCategoryB": "CHANGE_NAVIGATION",
    "stratum": "S2_Indirect",
    "indirectType": "GEOMETRY_NAVIGATION",
    "dependencyDepth": 1,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0.77,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_1",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S2_Indirect (GEOMETRY_NAVIGATION) depth 1"
    },
    "seed": 1123,
    "tags": [
      "game_design_lab_&_escape_room",
      "indirect_s2",
      "geometry_navigation",
      "depth_1"
    ],
    "split": "test_locked"
  },
  {
    "id": "WP2-EO-125",
    "worldCategory": "Maintenance industrielle",
    "initialWorldPrompt": "Atelier d'usinage avec établi d'outillage en fonte et lampe articulée.",
    "editA": "Peins la surface de l'établi d'outillage en fonte en gris anthracite mat",
    "editB": "Ajuste l'intensité de la lampe articulée fixée sur l'établi d'outillage à 600 lumens",
    "editCategoryA": "CHANGE_PHYSICS",
    "editCategoryB": "CHANGE_PHYSICS",
    "stratum": "S3_LexicalFalsePositive",
    "indirectType": "NONE",
    "dependencyDepth": 0,
    "entityOverlapScore": 0.7,
    "dependencyOverlapScore": 0.12,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_2",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S3_LexicalFalsePositive (NONE) depth 0"
    },
    "seed": 1124,
    "tags": [
      "workbench",
      "color",
      "lighting_orthogonal"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-126",
    "worldCategory": "Maintenance industrielle",
    "initialWorldPrompt": "Générateur auxiliaire avec plaque signalétique et silencieux d'échappement.",
    "editA": "Modifie le texte de la plaque signalétique du générateur auxiliaire avec le numéro de série G-889",
    "editB": "Remplace le silencieux d'échappement du générateur auxiliaire par un modèle renforcé en inox",
    "editCategoryA": "RENAME",
    "editCategoryB": "REPLACE",
    "stratum": "S3_LexicalFalsePositive",
    "indirectType": "NONE",
    "dependencyDepth": 0,
    "entityOverlapScore": 0.7,
    "dependencyOverlapScore": 0.12,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_3",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S3_LexicalFalsePositive (NONE) depth 0"
    },
    "seed": 1125,
    "tags": [
      "generator",
      "nameplate",
      "muffler_orthogonal"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-127",
    "worldCategory": "Maintenance industrielle",
    "initialWorldPrompt": "Armoire d'outils avec tiroir supérieur et serrure à clé.",
    "editA": "Ajoute une étiquette Section Visserie sur le tiroir supérieur de l'armoire d'outils",
    "editB": "Change la texture du tiroir supérieur de l'armoire d'outils pour un fini aluminium brossé",
    "editCategoryA": "ADD",
    "editCategoryB": "CHANGE_PHYSICS",
    "stratum": "S3_LexicalFalsePositive",
    "indirectType": "NONE",
    "dependencyDepth": 0,
    "entityOverlapScore": 0.7,
    "dependencyOverlapScore": 0.12,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_1",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S3_LexicalFalsePositive (NONE) depth 0"
    },
    "seed": 1126,
    "tags": [
      "tool_cabinet",
      "label",
      "texture_orthogonal"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-128",
    "worldCategory": "Laboratoire chimique",
    "initialWorldPrompt": "Étagère de réactifs avec flacon de sulfate de cuivre et étiquette de traçabilité.",
    "editA": "Remplace l'étiquette de traçabilité du flacon de sulfate de cuivre par la mention Lot 2026-B",
    "editB": "Dépose une goutte de réactif sur le bouchon du flacon de sulfate de cuivre",
    "editCategoryA": "RENAME",
    "editCategoryB": "CHANGE_PHYSICS",
    "stratum": "S3_LexicalFalsePositive",
    "indirectType": "NONE",
    "dependencyDepth": 0,
    "entityOverlapScore": 0.7,
    "dependencyOverlapScore": 0.12,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_2",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S3_LexicalFalsePositive (NONE) depth 0"
    },
    "seed": 1127,
    "tags": [
      "copper_sulfate",
      "label",
      "cap_orthogonal"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-129",
    "worldCategory": "Laboratoire chimique",
    "initialWorldPrompt": "Microscope binoculaire avec platine porte-échantillon et statif métallique.",
    "editA": "Règle la bague micrométrique de mise au point du microscope binoculaire sur 40 micromètres",
    "editB": "Nettoie la surface du statif métallique du microscope binoculaire avec un chiffon antistatique",
    "editCategoryA": "ROTATE",
    "editCategoryB": "CHANGE_PHYSICS",
    "stratum": "S3_LexicalFalsePositive",
    "indirectType": "NONE",
    "dependencyDepth": 0,
    "entityOverlapScore": 0.7,
    "dependencyOverlapScore": 0.12,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_3",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S3_LexicalFalsePositive (NONE) depth 0"
    },
    "seed": 1128,
    "tags": [
      "microscope",
      "focus_ring",
      "stand_orthogonal"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-130",
    "worldCategory": "Laboratoire chimique",
    "initialWorldPrompt": "Bain à ultrasons avec cuve inox et couvercle en polypropylène.",
    "editA": "Règle la minuterie du bain à ultrasons sur 15 minutes",
    "editB": "Change la couleur du couvercle en polypropylène du bain à ultrasons en bleu ciel",
    "editCategoryA": "CHANGE_PHYSICS",
    "editCategoryB": "CHANGE_PHYSICS",
    "stratum": "S3_LexicalFalsePositive",
    "indirectType": "NONE",
    "dependencyDepth": 0,
    "entityOverlapScore": 0.7,
    "dependencyOverlapScore": 0.12,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_1",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S3_LexicalFalsePositive (NONE) depth 0"
    },
    "seed": 1129,
    "tags": [
      "ultrasonic_bath",
      "timer",
      "lid_orthogonal"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-131",
    "worldCategory": "Logistique & Entrepôt AGV",
    "initialWorldPrompt": "Poste fixe dans Logistique & Entrepôt AGV avec support principal et accessoires montés.",
    "editA": "Modifie la couleur cosmétique du support principal de Logistique & Entrepôt AGV en noir mat",
    "editB": "Règle l'intensité lumineuse du voyant monté sur le support principal de Logistique & Entrepôt AGV à 50%",
    "editCategoryA": "CHANGE_PHYSICS",
    "editCategoryB": "CHANGE_PHYSICS",
    "stratum": "S3_LexicalFalsePositive",
    "indirectType": "NONE",
    "dependencyDepth": 0,
    "entityOverlapScore": 0.7,
    "dependencyOverlapScore": 0.12,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_2",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S3_LexicalFalsePositive (NONE) depth 0"
    },
    "seed": 1130,
    "tags": [
      "logistique_&_entrepôt_agv",
      "false_positive_s3",
      "case_0"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-132",
    "worldCategory": "Logistique & Entrepôt AGV",
    "initialWorldPrompt": "Poste fixe dans Logistique & Entrepôt AGV avec support principal et accessoires montés.",
    "editA": "Modifie la couleur cosmétique du support principal de Logistique & Entrepôt AGV en noir mat",
    "editB": "Règle l'intensité lumineuse du voyant monté sur le support principal de Logistique & Entrepôt AGV à 50%",
    "editCategoryA": "CHANGE_PHYSICS",
    "editCategoryB": "CHANGE_PHYSICS",
    "stratum": "S3_LexicalFalsePositive",
    "indirectType": "NONE",
    "dependencyDepth": 0,
    "entityOverlapScore": 0.7,
    "dependencyOverlapScore": 0.12,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_3",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S3_LexicalFalsePositive (NONE) depth 0"
    },
    "seed": 1131,
    "tags": [
      "logistique_&_entrepôt_agv",
      "false_positive_s3",
      "case_1"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-133",
    "worldCategory": "Logistique & Entrepôt AGV",
    "initialWorldPrompt": "Poste fixe dans Logistique & Entrepôt AGV avec support principal et accessoires montés.",
    "editA": "Modifie la couleur cosmétique du support principal de Logistique & Entrepôt AGV en noir mat",
    "editB": "Règle l'intensité lumineuse du voyant monté sur le support principal de Logistique & Entrepôt AGV à 50%",
    "editCategoryA": "CHANGE_PHYSICS",
    "editCategoryB": "CHANGE_PHYSICS",
    "stratum": "S3_LexicalFalsePositive",
    "indirectType": "NONE",
    "dependencyDepth": 0,
    "entityOverlapScore": 0.7,
    "dependencyOverlapScore": 0.12,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_1",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S3_LexicalFalsePositive (NONE) depth 0"
    },
    "seed": 1132,
    "tags": [
      "logistique_&_entrepôt_agv",
      "false_positive_s3",
      "case_2"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-134",
    "worldCategory": "Atelier automobile & Robotique",
    "initialWorldPrompt": "Poste fixe dans Atelier automobile & Robotique avec support principal et accessoires montés.",
    "editA": "Modifie la couleur cosmétique du support principal de Atelier automobile & Robotique en noir mat",
    "editB": "Règle l'intensité lumineuse du voyant monté sur le support principal de Atelier automobile & Robotique à 50%",
    "editCategoryA": "CHANGE_PHYSICS",
    "editCategoryB": "CHANGE_PHYSICS",
    "stratum": "S3_LexicalFalsePositive",
    "indirectType": "NONE",
    "dependencyDepth": 0,
    "entityOverlapScore": 0.7,
    "dependencyOverlapScore": 0.12,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_2",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S3_LexicalFalsePositive (NONE) depth 0"
    },
    "seed": 1133,
    "tags": [
      "atelier_automobile_&_robotique",
      "false_positive_s3",
      "case_0"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-135",
    "worldCategory": "Atelier automobile & Robotique",
    "initialWorldPrompt": "Poste fixe dans Atelier automobile & Robotique avec support principal et accessoires montés.",
    "editA": "Modifie la couleur cosmétique du support principal de Atelier automobile & Robotique en noir mat",
    "editB": "Règle l'intensité lumineuse du voyant monté sur le support principal de Atelier automobile & Robotique à 50%",
    "editCategoryA": "CHANGE_PHYSICS",
    "editCategoryB": "CHANGE_PHYSICS",
    "stratum": "S3_LexicalFalsePositive",
    "indirectType": "NONE",
    "dependencyDepth": 0,
    "entityOverlapScore": 0.7,
    "dependencyOverlapScore": 0.12,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_3",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S3_LexicalFalsePositive (NONE) depth 0"
    },
    "seed": 1134,
    "tags": [
      "atelier_automobile_&_robotique",
      "false_positive_s3",
      "case_1"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-136",
    "worldCategory": "Atelier automobile & Robotique",
    "initialWorldPrompt": "Poste fixe dans Atelier automobile & Robotique avec support principal et accessoires montés.",
    "editA": "Modifie la couleur cosmétique du support principal de Atelier automobile & Robotique en noir mat",
    "editB": "Règle l'intensité lumineuse du voyant monté sur le support principal de Atelier automobile & Robotique à 50%",
    "editCategoryA": "CHANGE_PHYSICS",
    "editCategoryB": "CHANGE_PHYSICS",
    "stratum": "S3_LexicalFalsePositive",
    "indirectType": "NONE",
    "dependencyDepth": 0,
    "entityOverlapScore": 0.7,
    "dependencyOverlapScore": 0.12,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_1",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S3_LexicalFalsePositive (NONE) depth 0"
    },
    "seed": 1135,
    "tags": [
      "atelier_automobile_&_robotique",
      "false_positive_s3",
      "case_2"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-137",
    "worldCategory": "Maison connectée & IoT",
    "initialWorldPrompt": "Poste fixe dans Maison connectée & IoT avec support principal et accessoires montés.",
    "editA": "Modifie la couleur cosmétique du support principal de Maison connectée & IoT en noir mat",
    "editB": "Règle l'intensité lumineuse du voyant monté sur le support principal de Maison connectée & IoT à 50%",
    "editCategoryA": "CHANGE_PHYSICS",
    "editCategoryB": "CHANGE_PHYSICS",
    "stratum": "S3_LexicalFalsePositive",
    "indirectType": "NONE",
    "dependencyDepth": 0,
    "entityOverlapScore": 0.7,
    "dependencyOverlapScore": 0.12,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_2",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S3_LexicalFalsePositive (NONE) depth 0"
    },
    "seed": 1136,
    "tags": [
      "maison_connectée_&_iot",
      "false_positive_s3",
      "case_0"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-138",
    "worldCategory": "Maison connectée & IoT",
    "initialWorldPrompt": "Poste fixe dans Maison connectée & IoT avec support principal et accessoires montés.",
    "editA": "Modifie la couleur cosmétique du support principal de Maison connectée & IoT en noir mat",
    "editB": "Règle l'intensité lumineuse du voyant monté sur le support principal de Maison connectée & IoT à 50%",
    "editCategoryA": "CHANGE_PHYSICS",
    "editCategoryB": "CHANGE_PHYSICS",
    "stratum": "S3_LexicalFalsePositive",
    "indirectType": "NONE",
    "dependencyDepth": 0,
    "entityOverlapScore": 0.7,
    "dependencyOverlapScore": 0.12,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_3",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S3_LexicalFalsePositive (NONE) depth 0"
    },
    "seed": 1137,
    "tags": [
      "maison_connectée_&_iot",
      "false_positive_s3",
      "case_1"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-139",
    "worldCategory": "Maison connectée & IoT",
    "initialWorldPrompt": "Poste fixe dans Maison connectée & IoT avec support principal et accessoires montés.",
    "editA": "Modifie la couleur cosmétique du support principal de Maison connectée & IoT en noir mat",
    "editB": "Règle l'intensité lumineuse du voyant monté sur le support principal de Maison connectée & IoT à 50%",
    "editCategoryA": "CHANGE_PHYSICS",
    "editCategoryB": "CHANGE_PHYSICS",
    "stratum": "S3_LexicalFalsePositive",
    "indirectType": "NONE",
    "dependencyDepth": 0,
    "entityOverlapScore": 0.7,
    "dependencyOverlapScore": 0.12,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_1",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S3_LexicalFalsePositive (NONE) depth 0"
    },
    "seed": 1138,
    "tags": [
      "maison_connectée_&_iot",
      "false_positive_s3",
      "case_2"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-140",
    "worldCategory": "Station spatiale orbitale",
    "initialWorldPrompt": "Poste fixe dans Station spatiale orbitale avec support principal et accessoires montés.",
    "editA": "Modifie la couleur cosmétique du support principal de Station spatiale orbitale en noir mat",
    "editB": "Règle l'intensité lumineuse du voyant monté sur le support principal de Station spatiale orbitale à 50%",
    "editCategoryA": "CHANGE_PHYSICS",
    "editCategoryB": "CHANGE_PHYSICS",
    "stratum": "S3_LexicalFalsePositive",
    "indirectType": "NONE",
    "dependencyDepth": 0,
    "entityOverlapScore": 0.7,
    "dependencyOverlapScore": 0.12,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_2",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S3_LexicalFalsePositive (NONE) depth 0"
    },
    "seed": 1139,
    "tags": [
      "station_spatiale_orbitale",
      "false_positive_s3",
      "case_0"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-141",
    "worldCategory": "Station spatiale orbitale",
    "initialWorldPrompt": "Poste fixe dans Station spatiale orbitale avec support principal et accessoires montés.",
    "editA": "Modifie la couleur cosmétique du support principal de Station spatiale orbitale en noir mat",
    "editB": "Règle l'intensité lumineuse du voyant monté sur le support principal de Station spatiale orbitale à 50%",
    "editCategoryA": "CHANGE_PHYSICS",
    "editCategoryB": "CHANGE_PHYSICS",
    "stratum": "S3_LexicalFalsePositive",
    "indirectType": "NONE",
    "dependencyDepth": 0,
    "entityOverlapScore": 0.7,
    "dependencyOverlapScore": 0.12,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_3",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S3_LexicalFalsePositive (NONE) depth 0"
    },
    "seed": 1140,
    "tags": [
      "station_spatiale_orbitale",
      "false_positive_s3",
      "case_1"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-142",
    "worldCategory": "Station spatiale orbitale",
    "initialWorldPrompt": "Poste fixe dans Station spatiale orbitale avec support principal et accessoires montés.",
    "editA": "Modifie la couleur cosmétique du support principal de Station spatiale orbitale en noir mat",
    "editB": "Règle l'intensité lumineuse du voyant monté sur le support principal de Station spatiale orbitale à 50%",
    "editCategoryA": "CHANGE_PHYSICS",
    "editCategoryB": "CHANGE_PHYSICS",
    "stratum": "S3_LexicalFalsePositive",
    "indirectType": "NONE",
    "dependencyDepth": 0,
    "entityOverlapScore": 0.7,
    "dependencyOverlapScore": 0.12,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_1",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S3_LexicalFalsePositive (NONE) depth 0"
    },
    "seed": 1141,
    "tags": [
      "station_spatiale_orbitale",
      "false_positive_s3",
      "case_2"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-143",
    "worldCategory": "Showroom de luxe & Retail",
    "initialWorldPrompt": "Poste fixe dans Showroom de luxe & Retail avec support principal et accessoires montés.",
    "editA": "Modifie la couleur cosmétique du support principal de Showroom de luxe & Retail en noir mat",
    "editB": "Règle l'intensité lumineuse du voyant monté sur le support principal de Showroom de luxe & Retail à 50%",
    "editCategoryA": "CHANGE_PHYSICS",
    "editCategoryB": "CHANGE_PHYSICS",
    "stratum": "S3_LexicalFalsePositive",
    "indirectType": "NONE",
    "dependencyDepth": 0,
    "entityOverlapScore": 0.7,
    "dependencyOverlapScore": 0.12,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_2",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S3_LexicalFalsePositive (NONE) depth 0"
    },
    "seed": 1142,
    "tags": [
      "showroom_de_luxe_&_retail",
      "false_positive_s3",
      "case_0"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-144",
    "worldCategory": "Showroom de luxe & Retail",
    "initialWorldPrompt": "Poste fixe dans Showroom de luxe & Retail avec support principal et accessoires montés.",
    "editA": "Modifie la couleur cosmétique du support principal de Showroom de luxe & Retail en noir mat",
    "editB": "Règle l'intensité lumineuse du voyant monté sur le support principal de Showroom de luxe & Retail à 50%",
    "editCategoryA": "CHANGE_PHYSICS",
    "editCategoryB": "CHANGE_PHYSICS",
    "stratum": "S3_LexicalFalsePositive",
    "indirectType": "NONE",
    "dependencyDepth": 0,
    "entityOverlapScore": 0.7,
    "dependencyOverlapScore": 0.12,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_3",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S3_LexicalFalsePositive (NONE) depth 0"
    },
    "seed": 1143,
    "tags": [
      "showroom_de_luxe_&_retail",
      "false_positive_s3",
      "case_1"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-145",
    "worldCategory": "Showroom de luxe & Retail",
    "initialWorldPrompt": "Poste fixe dans Showroom de luxe & Retail avec support principal et accessoires montés.",
    "editA": "Modifie la couleur cosmétique du support principal de Showroom de luxe & Retail en noir mat",
    "editB": "Règle l'intensité lumineuse du voyant monté sur le support principal de Showroom de luxe & Retail à 50%",
    "editCategoryA": "CHANGE_PHYSICS",
    "editCategoryB": "CHANGE_PHYSICS",
    "stratum": "S3_LexicalFalsePositive",
    "indirectType": "NONE",
    "dependencyDepth": 0,
    "entityOverlapScore": 0.7,
    "dependencyOverlapScore": 0.12,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_1",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S3_LexicalFalsePositive (NONE) depth 0"
    },
    "seed": 1144,
    "tags": [
      "showroom_de_luxe_&_retail",
      "false_positive_s3",
      "case_2"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-146",
    "worldCategory": "Salle de classe & Éducation",
    "initialWorldPrompt": "Poste fixe dans Salle de classe & Éducation avec support principal et accessoires montés.",
    "editA": "Modifie la couleur cosmétique du support principal de Salle de classe & Éducation en noir mat",
    "editB": "Règle l'intensité lumineuse du voyant monté sur le support principal de Salle de classe & Éducation à 50%",
    "editCategoryA": "CHANGE_PHYSICS",
    "editCategoryB": "CHANGE_PHYSICS",
    "stratum": "S3_LexicalFalsePositive",
    "indirectType": "NONE",
    "dependencyDepth": 0,
    "entityOverlapScore": 0.7,
    "dependencyOverlapScore": 0.12,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_2",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S3_LexicalFalsePositive (NONE) depth 0"
    },
    "seed": 1145,
    "tags": [
      "salle_de_classe_&_éducation",
      "false_positive_s3",
      "case_0"
    ],
    "split": "val"
  },
  {
    "id": "WP2-EO-147",
    "worldCategory": "Salle de classe & Éducation",
    "initialWorldPrompt": "Poste fixe dans Salle de classe & Éducation avec support principal et accessoires montés.",
    "editA": "Modifie la couleur cosmétique du support principal de Salle de classe & Éducation en noir mat",
    "editB": "Règle l'intensité lumineuse du voyant monté sur le support principal de Salle de classe & Éducation à 50%",
    "editCategoryA": "CHANGE_PHYSICS",
    "editCategoryB": "CHANGE_PHYSICS",
    "stratum": "S3_LexicalFalsePositive",
    "indirectType": "NONE",
    "dependencyDepth": 0,
    "entityOverlapScore": 0.7,
    "dependencyOverlapScore": 0.12,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_3",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S3_LexicalFalsePositive (NONE) depth 0"
    },
    "seed": 1146,
    "tags": [
      "salle_de_classe_&_éducation",
      "false_positive_s3",
      "case_1"
    ],
    "split": "val"
  },
  {
    "id": "WP2-EO-148",
    "worldCategory": "Salle de classe & Éducation",
    "initialWorldPrompt": "Poste fixe dans Salle de classe & Éducation avec support principal et accessoires montés.",
    "editA": "Modifie la couleur cosmétique du support principal de Salle de classe & Éducation en noir mat",
    "editB": "Règle l'intensité lumineuse du voyant monté sur le support principal de Salle de classe & Éducation à 50%",
    "editCategoryA": "CHANGE_PHYSICS",
    "editCategoryB": "CHANGE_PHYSICS",
    "stratum": "S3_LexicalFalsePositive",
    "indirectType": "NONE",
    "dependencyDepth": 0,
    "entityOverlapScore": 0.7,
    "dependencyOverlapScore": 0.12,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_1",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S3_LexicalFalsePositive (NONE) depth 0"
    },
    "seed": 1147,
    "tags": [
      "salle_de_classe_&_éducation",
      "false_positive_s3",
      "case_2"
    ],
    "split": "val"
  },
  {
    "id": "WP2-EO-149",
    "worldCategory": "Atelier culinaire & Pâtisserie",
    "initialWorldPrompt": "Poste fixe dans Atelier culinaire & Pâtisserie avec support principal et accessoires montés.",
    "editA": "Modifie la couleur cosmétique du support principal de Atelier culinaire & Pâtisserie en noir mat",
    "editB": "Règle l'intensité lumineuse du voyant monté sur le support principal de Atelier culinaire & Pâtisserie à 50%",
    "editCategoryA": "CHANGE_PHYSICS",
    "editCategoryB": "CHANGE_PHYSICS",
    "stratum": "S3_LexicalFalsePositive",
    "indirectType": "NONE",
    "dependencyDepth": 0,
    "entityOverlapScore": 0.7,
    "dependencyOverlapScore": 0.12,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_2",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S3_LexicalFalsePositive (NONE) depth 0"
    },
    "seed": 1148,
    "tags": [
      "atelier_culinaire_&_pâtisserie",
      "false_positive_s3",
      "case_0"
    ],
    "split": "val"
  },
  {
    "id": "WP2-EO-150",
    "worldCategory": "Atelier culinaire & Pâtisserie",
    "initialWorldPrompt": "Poste fixe dans Atelier culinaire & Pâtisserie avec support principal et accessoires montés.",
    "editA": "Modifie la couleur cosmétique du support principal de Atelier culinaire & Pâtisserie en noir mat",
    "editB": "Règle l'intensité lumineuse du voyant monté sur le support principal de Atelier culinaire & Pâtisserie à 50%",
    "editCategoryA": "CHANGE_PHYSICS",
    "editCategoryB": "CHANGE_PHYSICS",
    "stratum": "S3_LexicalFalsePositive",
    "indirectType": "NONE",
    "dependencyDepth": 0,
    "entityOverlapScore": 0.7,
    "dependencyOverlapScore": 0.12,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_3",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S3_LexicalFalsePositive (NONE) depth 0"
    },
    "seed": 1149,
    "tags": [
      "atelier_culinaire_&_pâtisserie",
      "false_positive_s3",
      "case_1"
    ],
    "split": "val"
  },
  {
    "id": "WP2-EO-151",
    "worldCategory": "Atelier culinaire & Pâtisserie",
    "initialWorldPrompt": "Poste fixe dans Atelier culinaire & Pâtisserie avec support principal et accessoires montés.",
    "editA": "Modifie la couleur cosmétique du support principal de Atelier culinaire & Pâtisserie en noir mat",
    "editB": "Règle l'intensité lumineuse du voyant monté sur le support principal de Atelier culinaire & Pâtisserie à 50%",
    "editCategoryA": "CHANGE_PHYSICS",
    "editCategoryB": "CHANGE_PHYSICS",
    "stratum": "S3_LexicalFalsePositive",
    "indirectType": "NONE",
    "dependencyDepth": 0,
    "entityOverlapScore": 0.7,
    "dependencyOverlapScore": 0.12,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_1",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S3_LexicalFalsePositive (NONE) depth 0"
    },
    "seed": 1150,
    "tags": [
      "atelier_culinaire_&_pâtisserie",
      "false_positive_s3",
      "case_2"
    ],
    "split": "val"
  },
  {
    "id": "WP2-EO-152",
    "worldCategory": "Centre médical & Simulation",
    "initialWorldPrompt": "Poste fixe dans Centre médical & Simulation avec support principal et accessoires montés.",
    "editA": "Modifie la couleur cosmétique du support principal de Centre médical & Simulation en noir mat",
    "editB": "Règle l'intensité lumineuse du voyant monté sur le support principal de Centre médical & Simulation à 50%",
    "editCategoryA": "CHANGE_PHYSICS",
    "editCategoryB": "CHANGE_PHYSICS",
    "stratum": "S3_LexicalFalsePositive",
    "indirectType": "NONE",
    "dependencyDepth": 0,
    "entityOverlapScore": 0.7,
    "dependencyOverlapScore": 0.12,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_2",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S3_LexicalFalsePositive (NONE) depth 0"
    },
    "seed": 1151,
    "tags": [
      "centre_médical_&_simulation",
      "false_positive_s3",
      "case_0"
    ],
    "split": "test_locked"
  },
  {
    "id": "WP2-EO-153",
    "worldCategory": "Centre médical & Simulation",
    "initialWorldPrompt": "Poste fixe dans Centre médical & Simulation avec support principal et accessoires montés.",
    "editA": "Modifie la couleur cosmétique du support principal de Centre médical & Simulation en noir mat",
    "editB": "Règle l'intensité lumineuse du voyant monté sur le support principal de Centre médical & Simulation à 50%",
    "editCategoryA": "CHANGE_PHYSICS",
    "editCategoryB": "CHANGE_PHYSICS",
    "stratum": "S3_LexicalFalsePositive",
    "indirectType": "NONE",
    "dependencyDepth": 0,
    "entityOverlapScore": 0.7,
    "dependencyOverlapScore": 0.12,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_3",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S3_LexicalFalsePositive (NONE) depth 0"
    },
    "seed": 1152,
    "tags": [
      "centre_médical_&_simulation",
      "false_positive_s3",
      "case_1"
    ],
    "split": "test_locked"
  },
  {
    "id": "WP2-EO-154",
    "worldCategory": "Centre médical & Simulation",
    "initialWorldPrompt": "Poste fixe dans Centre médical & Simulation avec support principal et accessoires montés.",
    "editA": "Modifie la couleur cosmétique du support principal de Centre médical & Simulation en noir mat",
    "editB": "Règle l'intensité lumineuse du voyant monté sur le support principal de Centre médical & Simulation à 50%",
    "editCategoryA": "CHANGE_PHYSICS",
    "editCategoryB": "CHANGE_PHYSICS",
    "stratum": "S3_LexicalFalsePositive",
    "indirectType": "NONE",
    "dependencyDepth": 0,
    "entityOverlapScore": 0.7,
    "dependencyOverlapScore": 0.12,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_1",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S3_LexicalFalsePositive (NONE) depth 0"
    },
    "seed": 1153,
    "tags": [
      "centre_médical_&_simulation",
      "false_positive_s3",
      "case_2"
    ],
    "split": "test_locked"
  },
  {
    "id": "WP2-EO-155",
    "worldCategory": "Montage meuble & DIY",
    "initialWorldPrompt": "Poste fixe dans Montage meuble & DIY avec support principal et accessoires montés.",
    "editA": "Modifie la couleur cosmétique du support principal de Montage meuble & DIY en noir mat",
    "editB": "Règle l'intensité lumineuse du voyant monté sur le support principal de Montage meuble & DIY à 50%",
    "editCategoryA": "CHANGE_PHYSICS",
    "editCategoryB": "CHANGE_PHYSICS",
    "stratum": "S3_LexicalFalsePositive",
    "indirectType": "NONE",
    "dependencyDepth": 0,
    "entityOverlapScore": 0.7,
    "dependencyOverlapScore": 0.12,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_2",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S3_LexicalFalsePositive (NONE) depth 0"
    },
    "seed": 1154,
    "tags": [
      "montage_meuble_&_diy",
      "false_positive_s3",
      "case_0"
    ],
    "split": "test_locked"
  },
  {
    "id": "WP2-EO-156",
    "worldCategory": "Montage meuble & DIY",
    "initialWorldPrompt": "Poste fixe dans Montage meuble & DIY avec support principal et accessoires montés.",
    "editA": "Modifie la couleur cosmétique du support principal de Montage meuble & DIY en noir mat",
    "editB": "Règle l'intensité lumineuse du voyant monté sur le support principal de Montage meuble & DIY à 50%",
    "editCategoryA": "CHANGE_PHYSICS",
    "editCategoryB": "CHANGE_PHYSICS",
    "stratum": "S3_LexicalFalsePositive",
    "indirectType": "NONE",
    "dependencyDepth": 0,
    "entityOverlapScore": 0.7,
    "dependencyOverlapScore": 0.12,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_3",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S3_LexicalFalsePositive (NONE) depth 0"
    },
    "seed": 1155,
    "tags": [
      "montage_meuble_&_diy",
      "false_positive_s3",
      "case_1"
    ],
    "split": "test_locked"
  },
  {
    "id": "WP2-EO-157",
    "worldCategory": "Montage meuble & DIY",
    "initialWorldPrompt": "Poste fixe dans Montage meuble & DIY avec support principal et accessoires montés.",
    "editA": "Modifie la couleur cosmétique du support principal de Montage meuble & DIY en noir mat",
    "editB": "Règle l'intensité lumineuse du voyant monté sur le support principal de Montage meuble & DIY à 50%",
    "editCategoryA": "CHANGE_PHYSICS",
    "editCategoryB": "CHANGE_PHYSICS",
    "stratum": "S3_LexicalFalsePositive",
    "indirectType": "NONE",
    "dependencyDepth": 0,
    "entityOverlapScore": 0.7,
    "dependencyOverlapScore": 0.12,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_1",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S3_LexicalFalsePositive (NONE) depth 0"
    },
    "seed": 1156,
    "tags": [
      "montage_meuble_&_diy",
      "false_positive_s3",
      "case_2"
    ],
    "split": "test_locked"
  },
  {
    "id": "WP2-EO-158",
    "worldCategory": "Game Design Lab & Escape Room",
    "initialWorldPrompt": "Poste fixe dans Game Design Lab & Escape Room avec support principal et accessoires montés.",
    "editA": "Modifie la couleur cosmétique du support principal de Game Design Lab & Escape Room en noir mat",
    "editB": "Règle l'intensité lumineuse du voyant monté sur le support principal de Game Design Lab & Escape Room à 50%",
    "editCategoryA": "CHANGE_PHYSICS",
    "editCategoryB": "CHANGE_PHYSICS",
    "stratum": "S3_LexicalFalsePositive",
    "indirectType": "NONE",
    "dependencyDepth": 0,
    "entityOverlapScore": 0.7,
    "dependencyOverlapScore": 0.12,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_2",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S3_LexicalFalsePositive (NONE) depth 0"
    },
    "seed": 1157,
    "tags": [
      "game_design_lab_&_escape_room",
      "false_positive_s3",
      "case_0"
    ],
    "split": "test_locked"
  },
  {
    "id": "WP2-EO-159",
    "worldCategory": "Game Design Lab & Escape Room",
    "initialWorldPrompt": "Poste fixe dans Game Design Lab & Escape Room avec support principal et accessoires montés.",
    "editA": "Modifie la couleur cosmétique du support principal de Game Design Lab & Escape Room en noir mat",
    "editB": "Règle l'intensité lumineuse du voyant monté sur le support principal de Game Design Lab & Escape Room à 50%",
    "editCategoryA": "CHANGE_PHYSICS",
    "editCategoryB": "CHANGE_PHYSICS",
    "stratum": "S3_LexicalFalsePositive",
    "indirectType": "NONE",
    "dependencyDepth": 0,
    "entityOverlapScore": 0.7,
    "dependencyOverlapScore": 0.12,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_3",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S3_LexicalFalsePositive (NONE) depth 0"
    },
    "seed": 1158,
    "tags": [
      "game_design_lab_&_escape_room",
      "false_positive_s3",
      "case_1"
    ],
    "split": "test_locked"
  },
  {
    "id": "WP2-EO-160",
    "worldCategory": "Game Design Lab & Escape Room",
    "initialWorldPrompt": "Poste fixe dans Game Design Lab & Escape Room avec support principal et accessoires montés.",
    "editA": "Modifie la couleur cosmétique du support principal de Game Design Lab & Escape Room en noir mat",
    "editB": "Règle l'intensité lumineuse du voyant monté sur le support principal de Game Design Lab & Escape Room à 50%",
    "editCategoryA": "CHANGE_PHYSICS",
    "editCategoryB": "CHANGE_PHYSICS",
    "stratum": "S3_LexicalFalsePositive",
    "indirectType": "NONE",
    "dependencyDepth": 0,
    "entityOverlapScore": 0.7,
    "dependencyOverlapScore": 0.12,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_1",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S3_LexicalFalsePositive (NONE) depth 0"
    },
    "seed": 1159,
    "tags": [
      "game_design_lab_&_escape_room",
      "false_positive_s3",
      "case_2"
    ],
    "split": "test_locked"
  },
  {
    "id": "WP2-EO-161",
    "worldCategory": "Maintenance industrielle",
    "initialWorldPrompt": "Atelier séparé avec zone d'usinage au nord et vestiaire du personnel au sud.",
    "editA": "Place un jeu de clés plates de 12 sur la servante de la zone d'usinage au nord",
    "editB": "Allume le plafonnier LED du vestiaire du personnel au sud",
    "editCategoryA": "ADD",
    "editCategoryB": "CHANGE_PHYSICS",
    "stratum": "S4_TrueIndependence",
    "indirectType": "NONE",
    "dependencyDepth": 0,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_2",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S4_TrueIndependence (NONE) depth 0"
    },
    "seed": 1160,
    "tags": [
      "zone_north",
      "zone_south",
      "independent"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-162",
    "worldCategory": "Maintenance industrielle",
    "initialWorldPrompt": "Hangar d'assemblage avec zone de soudure A et magasin de pièces détachées B.",
    "editA": "Règle la température ambiante du magasin de pièces B à 19 degrés",
    "editB": "Déplace le tabouret ergonomique de la zone de soudure A de 30 cm vers l'arrière",
    "editCategoryA": "CHANGE_PHYSICS",
    "editCategoryB": "MOVE",
    "stratum": "S4_TrueIndependence",
    "indirectType": "NONE",
    "dependencyDepth": 0,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_3",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S4_TrueIndependence (NONE) depth 0"
    },
    "seed": 1161,
    "tags": [
      "store_b",
      "welding_a",
      "disjoint"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-163",
    "worldCategory": "Maintenance industrielle",
    "initialWorldPrompt": "Poste de contrôle avec écran de monitoring et cafetière dans la salle de pause.",
    "editA": "Augmente le contraste de l'écran de monitoring à 85%",
    "editB": "Mets en marche la cafetière électrique dans la salle de pause",
    "editCategoryA": "CHANGE_PHYSICS",
    "editCategoryB": "CONNECT_CAUSAL",
    "stratum": "S4_TrueIndependence",
    "indirectType": "NONE",
    "dependencyDepth": 0,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_1",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S4_TrueIndependence (NONE) depth 0"
    },
    "seed": 1162,
    "tags": [
      "monitor",
      "coffee_machine",
      "independent"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-164",
    "worldCategory": "Maintenance industrielle",
    "initialWorldPrompt": "Atelier mécanique avec rack de stockage d'acier et horloge murale à l'entrée.",
    "editA": "Place trois barres rondes d'acier étiré sur le rack de stockage",
    "editB": "Avance l'aiguille de l'horloge murale de l'entrée de 5 minutes",
    "editCategoryA": "ADD",
    "editCategoryB": "ROTATE",
    "stratum": "S4_TrueIndependence",
    "indirectType": "NONE",
    "dependencyDepth": 0,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_2",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S4_TrueIndependence (NONE) depth 0"
    },
    "seed": 1163,
    "tags": [
      "steel_rack",
      "clock",
      "independent"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-165",
    "worldCategory": "Laboratoire chimique",
    "initialWorldPrompt": "Laboratoire séparé avec bureau de rédaction au nord et paillasse d'électrophorèse au sud.",
    "editA": "Active le gel d'électrophorèse avec une tension de 100 volts sur la paillasse sud",
    "editB": "Allume la lampe de bureau sur la table de rédaction au nord",
    "editCategoryA": "CONNECT_CAUSAL",
    "editCategoryB": "CHANGE_PHYSICS",
    "stratum": "S4_TrueIndependence",
    "indirectType": "NONE",
    "dependencyDepth": 0,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_3",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S4_TrueIndependence (NONE) depth 0"
    },
    "seed": 1164,
    "tags": [
      "electrophoresis_south",
      "desk_north",
      "independent"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-166",
    "worldCategory": "Laboratoire chimique",
    "initialWorldPrompt": "Salle d'analyse avec ordinateur de commande et réfrigérateur d'échantillons à -80°C.",
    "editA": "Lance l'acquisition de données sur le logiciel de chromatographie de l'ordinateur",
    "editB": "Vérifie la fermeture du joint magnétique du réfrigérateur à -80°C",
    "editCategoryA": "CONNECT_CAUSAL",
    "editCategoryB": "CHANGE_PHYSICS",
    "stratum": "S4_TrueIndependence",
    "indirectType": "NONE",
    "dependencyDepth": 0,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_1",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S4_TrueIndependence (NONE) depth 0"
    },
    "seed": 1165,
    "tags": [
      "chromatography_pc",
      "freezer",
      "independent"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-167",
    "worldCategory": "Laboratoire chimique",
    "initialWorldPrompt": "Poste de lavage de verrerie avec évier en grès et égouttoir mural.",
    "editA": "Ouvre le robinet d'eau déminéralisée au-dessus de l'évier en grès",
    "editB": "Range trois éprouvettes graduées sèches sur l'égouttoir mural",
    "editCategoryA": "CONNECT_CAUSAL",
    "editCategoryB": "ADD",
    "stratum": "S4_TrueIndependence",
    "indirectType": "NONE",
    "dependencyDepth": 0,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_2",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S4_TrueIndependence (NONE) depth 0"
    },
    "seed": 1166,
    "tags": [
      "sink",
      "drying_rack",
      "independent"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-168",
    "worldCategory": "Laboratoire chimique",
    "initialWorldPrompt": "Salle de stockage des acides avec bac étanche et thermohygromètre.",
    "editA": "Ajuste l'étalonnage de l'aiguille d'humidité du thermohygromètre à 45%",
    "editB": "Dépose un tapis absorbant anti-acides au pied du bac étanche",
    "editCategoryA": "CHANGE_PHYSICS",
    "editCategoryB": "ADD",
    "stratum": "S4_TrueIndependence",
    "indirectType": "NONE",
    "dependencyDepth": 0,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_3",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S4_TrueIndependence (NONE) depth 0"
    },
    "seed": 1167,
    "tags": [
      "hygrometer",
      "absorbent_mat",
      "independent"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-169",
    "worldCategory": "Logistique & Entrepôt AGV",
    "initialWorldPrompt": "Scène scindée en deux secteurs isolés dans Logistique & Entrepôt AGV (Zone Alpha et Zone Bêta).",
    "editA": "Déplace l'outil modulaire dans la Zone Alpha de Logistique & Entrepôt AGV vers le casier de rangement",
    "editB": "Allume le rétroéclairage du terminal de commande dans la Zone Bêta de Logistique & Entrepôt AGV",
    "editCategoryA": "MOVE",
    "editCategoryB": "CHANGE_PHYSICS",
    "stratum": "S4_TrueIndependence",
    "indirectType": "NONE",
    "dependencyDepth": 0,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_1",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S4_TrueIndependence (NONE) depth 0"
    },
    "seed": 1168,
    "tags": [
      "logistique_&_entrepôt_agv",
      "independence_s4",
      "case_0"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-170",
    "worldCategory": "Logistique & Entrepôt AGV",
    "initialWorldPrompt": "Scène scindée en deux secteurs isolés dans Logistique & Entrepôt AGV (Zone Alpha et Zone Bêta).",
    "editA": "Déplace l'outil modulaire dans la Zone Alpha de Logistique & Entrepôt AGV vers le casier de rangement",
    "editB": "Allume le rétroéclairage du terminal de commande dans la Zone Bêta de Logistique & Entrepôt AGV",
    "editCategoryA": "MOVE",
    "editCategoryB": "CHANGE_PHYSICS",
    "stratum": "S4_TrueIndependence",
    "indirectType": "NONE",
    "dependencyDepth": 0,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_2",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S4_TrueIndependence (NONE) depth 0"
    },
    "seed": 1169,
    "tags": [
      "logistique_&_entrepôt_agv",
      "independence_s4",
      "case_1"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-171",
    "worldCategory": "Logistique & Entrepôt AGV",
    "initialWorldPrompt": "Scène scindée en deux secteurs isolés dans Logistique & Entrepôt AGV (Zone Alpha et Zone Bêta).",
    "editA": "Déplace l'outil modulaire dans la Zone Alpha de Logistique & Entrepôt AGV vers le casier de rangement",
    "editB": "Allume le rétroéclairage du terminal de commande dans la Zone Bêta de Logistique & Entrepôt AGV",
    "editCategoryA": "MOVE",
    "editCategoryB": "CHANGE_PHYSICS",
    "stratum": "S4_TrueIndependence",
    "indirectType": "NONE",
    "dependencyDepth": 0,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_3",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S4_TrueIndependence (NONE) depth 0"
    },
    "seed": 1170,
    "tags": [
      "logistique_&_entrepôt_agv",
      "independence_s4",
      "case_2"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-172",
    "worldCategory": "Atelier automobile & Robotique",
    "initialWorldPrompt": "Scène scindée en deux secteurs isolés dans Atelier automobile & Robotique (Zone Alpha et Zone Bêta).",
    "editA": "Déplace l'outil modulaire dans la Zone Alpha de Atelier automobile & Robotique vers le casier de rangement",
    "editB": "Allume le rétroéclairage du terminal de commande dans la Zone Bêta de Atelier automobile & Robotique",
    "editCategoryA": "MOVE",
    "editCategoryB": "CHANGE_PHYSICS",
    "stratum": "S4_TrueIndependence",
    "indirectType": "NONE",
    "dependencyDepth": 0,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_1",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S4_TrueIndependence (NONE) depth 0"
    },
    "seed": 1171,
    "tags": [
      "atelier_automobile_&_robotique",
      "independence_s4",
      "case_0"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-173",
    "worldCategory": "Atelier automobile & Robotique",
    "initialWorldPrompt": "Scène scindée en deux secteurs isolés dans Atelier automobile & Robotique (Zone Alpha et Zone Bêta).",
    "editA": "Déplace l'outil modulaire dans la Zone Alpha de Atelier automobile & Robotique vers le casier de rangement",
    "editB": "Allume le rétroéclairage du terminal de commande dans la Zone Bêta de Atelier automobile & Robotique",
    "editCategoryA": "MOVE",
    "editCategoryB": "CHANGE_PHYSICS",
    "stratum": "S4_TrueIndependence",
    "indirectType": "NONE",
    "dependencyDepth": 0,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_2",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S4_TrueIndependence (NONE) depth 0"
    },
    "seed": 1172,
    "tags": [
      "atelier_automobile_&_robotique",
      "independence_s4",
      "case_1"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-174",
    "worldCategory": "Atelier automobile & Robotique",
    "initialWorldPrompt": "Scène scindée en deux secteurs isolés dans Atelier automobile & Robotique (Zone Alpha et Zone Bêta).",
    "editA": "Déplace l'outil modulaire dans la Zone Alpha de Atelier automobile & Robotique vers le casier de rangement",
    "editB": "Allume le rétroéclairage du terminal de commande dans la Zone Bêta de Atelier automobile & Robotique",
    "editCategoryA": "MOVE",
    "editCategoryB": "CHANGE_PHYSICS",
    "stratum": "S4_TrueIndependence",
    "indirectType": "NONE",
    "dependencyDepth": 0,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_3",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S4_TrueIndependence (NONE) depth 0"
    },
    "seed": 1173,
    "tags": [
      "atelier_automobile_&_robotique",
      "independence_s4",
      "case_2"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-175",
    "worldCategory": "Atelier automobile & Robotique",
    "initialWorldPrompt": "Scène scindée en deux secteurs isolés dans Atelier automobile & Robotique (Zone Alpha et Zone Bêta).",
    "editA": "Déplace l'outil modulaire dans la Zone Alpha de Atelier automobile & Robotique vers le casier de rangement",
    "editB": "Allume le rétroéclairage du terminal de commande dans la Zone Bêta de Atelier automobile & Robotique",
    "editCategoryA": "MOVE",
    "editCategoryB": "CHANGE_PHYSICS",
    "stratum": "S4_TrueIndependence",
    "indirectType": "NONE",
    "dependencyDepth": 0,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_1",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S4_TrueIndependence (NONE) depth 0"
    },
    "seed": 1174,
    "tags": [
      "atelier_automobile_&_robotique",
      "independence_s4",
      "case_3"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-176",
    "worldCategory": "Maison connectée & IoT",
    "initialWorldPrompt": "Scène scindée en deux secteurs isolés dans Maison connectée & IoT (Zone Alpha et Zone Bêta).",
    "editA": "Déplace l'outil modulaire dans la Zone Alpha de Maison connectée & IoT vers le casier de rangement",
    "editB": "Allume le rétroéclairage du terminal de commande dans la Zone Bêta de Maison connectée & IoT",
    "editCategoryA": "MOVE",
    "editCategoryB": "CHANGE_PHYSICS",
    "stratum": "S4_TrueIndependence",
    "indirectType": "NONE",
    "dependencyDepth": 0,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_2",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S4_TrueIndependence (NONE) depth 0"
    },
    "seed": 1175,
    "tags": [
      "maison_connectée_&_iot",
      "independence_s4",
      "case_0"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-177",
    "worldCategory": "Maison connectée & IoT",
    "initialWorldPrompt": "Scène scindée en deux secteurs isolés dans Maison connectée & IoT (Zone Alpha et Zone Bêta).",
    "editA": "Déplace l'outil modulaire dans la Zone Alpha de Maison connectée & IoT vers le casier de rangement",
    "editB": "Allume le rétroéclairage du terminal de commande dans la Zone Bêta de Maison connectée & IoT",
    "editCategoryA": "MOVE",
    "editCategoryB": "CHANGE_PHYSICS",
    "stratum": "S4_TrueIndependence",
    "indirectType": "NONE",
    "dependencyDepth": 0,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_3",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S4_TrueIndependence (NONE) depth 0"
    },
    "seed": 1176,
    "tags": [
      "maison_connectée_&_iot",
      "independence_s4",
      "case_1"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-178",
    "worldCategory": "Maison connectée & IoT",
    "initialWorldPrompt": "Scène scindée en deux secteurs isolés dans Maison connectée & IoT (Zone Alpha et Zone Bêta).",
    "editA": "Déplace l'outil modulaire dans la Zone Alpha de Maison connectée & IoT vers le casier de rangement",
    "editB": "Allume le rétroéclairage du terminal de commande dans la Zone Bêta de Maison connectée & IoT",
    "editCategoryA": "MOVE",
    "editCategoryB": "CHANGE_PHYSICS",
    "stratum": "S4_TrueIndependence",
    "indirectType": "NONE",
    "dependencyDepth": 0,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_1",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S4_TrueIndependence (NONE) depth 0"
    },
    "seed": 1177,
    "tags": [
      "maison_connectée_&_iot",
      "independence_s4",
      "case_2"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-179",
    "worldCategory": "Station spatiale orbitale",
    "initialWorldPrompt": "Scène scindée en deux secteurs isolés dans Station spatiale orbitale (Zone Alpha et Zone Bêta).",
    "editA": "Déplace l'outil modulaire dans la Zone Alpha de Station spatiale orbitale vers le casier de rangement",
    "editB": "Allume le rétroéclairage du terminal de commande dans la Zone Bêta de Station spatiale orbitale",
    "editCategoryA": "MOVE",
    "editCategoryB": "CHANGE_PHYSICS",
    "stratum": "S4_TrueIndependence",
    "indirectType": "NONE",
    "dependencyDepth": 0,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_2",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S4_TrueIndependence (NONE) depth 0"
    },
    "seed": 1178,
    "tags": [
      "station_spatiale_orbitale",
      "independence_s4",
      "case_0"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-180",
    "worldCategory": "Station spatiale orbitale",
    "initialWorldPrompt": "Scène scindée en deux secteurs isolés dans Station spatiale orbitale (Zone Alpha et Zone Bêta).",
    "editA": "Déplace l'outil modulaire dans la Zone Alpha de Station spatiale orbitale vers le casier de rangement",
    "editB": "Allume le rétroéclairage du terminal de commande dans la Zone Bêta de Station spatiale orbitale",
    "editCategoryA": "MOVE",
    "editCategoryB": "CHANGE_PHYSICS",
    "stratum": "S4_TrueIndependence",
    "indirectType": "NONE",
    "dependencyDepth": 0,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_3",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S4_TrueIndependence (NONE) depth 0"
    },
    "seed": 1179,
    "tags": [
      "station_spatiale_orbitale",
      "independence_s4",
      "case_1"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-181",
    "worldCategory": "Station spatiale orbitale",
    "initialWorldPrompt": "Scène scindée en deux secteurs isolés dans Station spatiale orbitale (Zone Alpha et Zone Bêta).",
    "editA": "Déplace l'outil modulaire dans la Zone Alpha de Station spatiale orbitale vers le casier de rangement",
    "editB": "Allume le rétroéclairage du terminal de commande dans la Zone Bêta de Station spatiale orbitale",
    "editCategoryA": "MOVE",
    "editCategoryB": "CHANGE_PHYSICS",
    "stratum": "S4_TrueIndependence",
    "indirectType": "NONE",
    "dependencyDepth": 0,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_1",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S4_TrueIndependence (NONE) depth 0"
    },
    "seed": 1180,
    "tags": [
      "station_spatiale_orbitale",
      "independence_s4",
      "case_2"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-182",
    "worldCategory": "Station spatiale orbitale",
    "initialWorldPrompt": "Scène scindée en deux secteurs isolés dans Station spatiale orbitale (Zone Alpha et Zone Bêta).",
    "editA": "Déplace l'outil modulaire dans la Zone Alpha de Station spatiale orbitale vers le casier de rangement",
    "editB": "Allume le rétroéclairage du terminal de commande dans la Zone Bêta de Station spatiale orbitale",
    "editCategoryA": "MOVE",
    "editCategoryB": "CHANGE_PHYSICS",
    "stratum": "S4_TrueIndependence",
    "indirectType": "NONE",
    "dependencyDepth": 0,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_2",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S4_TrueIndependence (NONE) depth 0"
    },
    "seed": 1181,
    "tags": [
      "station_spatiale_orbitale",
      "independence_s4",
      "case_3"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-183",
    "worldCategory": "Showroom de luxe & Retail",
    "initialWorldPrompt": "Scène scindée en deux secteurs isolés dans Showroom de luxe & Retail (Zone Alpha et Zone Bêta).",
    "editA": "Déplace l'outil modulaire dans la Zone Alpha de Showroom de luxe & Retail vers le casier de rangement",
    "editB": "Allume le rétroéclairage du terminal de commande dans la Zone Bêta de Showroom de luxe & Retail",
    "editCategoryA": "MOVE",
    "editCategoryB": "CHANGE_PHYSICS",
    "stratum": "S4_TrueIndependence",
    "indirectType": "NONE",
    "dependencyDepth": 0,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_3",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S4_TrueIndependence (NONE) depth 0"
    },
    "seed": 1182,
    "tags": [
      "showroom_de_luxe_&_retail",
      "independence_s4",
      "case_0"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-184",
    "worldCategory": "Showroom de luxe & Retail",
    "initialWorldPrompt": "Scène scindée en deux secteurs isolés dans Showroom de luxe & Retail (Zone Alpha et Zone Bêta).",
    "editA": "Déplace l'outil modulaire dans la Zone Alpha de Showroom de luxe & Retail vers le casier de rangement",
    "editB": "Allume le rétroéclairage du terminal de commande dans la Zone Bêta de Showroom de luxe & Retail",
    "editCategoryA": "MOVE",
    "editCategoryB": "CHANGE_PHYSICS",
    "stratum": "S4_TrueIndependence",
    "indirectType": "NONE",
    "dependencyDepth": 0,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_1",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S4_TrueIndependence (NONE) depth 0"
    },
    "seed": 1183,
    "tags": [
      "showroom_de_luxe_&_retail",
      "independence_s4",
      "case_1"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-185",
    "worldCategory": "Showroom de luxe & Retail",
    "initialWorldPrompt": "Scène scindée en deux secteurs isolés dans Showroom de luxe & Retail (Zone Alpha et Zone Bêta).",
    "editA": "Déplace l'outil modulaire dans la Zone Alpha de Showroom de luxe & Retail vers le casier de rangement",
    "editB": "Allume le rétroéclairage du terminal de commande dans la Zone Bêta de Showroom de luxe & Retail",
    "editCategoryA": "MOVE",
    "editCategoryB": "CHANGE_PHYSICS",
    "stratum": "S4_TrueIndependence",
    "indirectType": "NONE",
    "dependencyDepth": 0,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_2",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S4_TrueIndependence (NONE) depth 0"
    },
    "seed": 1184,
    "tags": [
      "showroom_de_luxe_&_retail",
      "independence_s4",
      "case_2"
    ],
    "split": "dev"
  },
  {
    "id": "WP2-EO-186",
    "worldCategory": "Salle de classe & Éducation",
    "initialWorldPrompt": "Scène scindée en deux secteurs isolés dans Salle de classe & Éducation (Zone Alpha et Zone Bêta).",
    "editA": "Déplace l'outil modulaire dans la Zone Alpha de Salle de classe & Éducation vers le casier de rangement",
    "editB": "Allume le rétroéclairage du terminal de commande dans la Zone Bêta de Salle de classe & Éducation",
    "editCategoryA": "MOVE",
    "editCategoryB": "CHANGE_PHYSICS",
    "stratum": "S4_TrueIndependence",
    "indirectType": "NONE",
    "dependencyDepth": 0,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_3",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S4_TrueIndependence (NONE) depth 0"
    },
    "seed": 1185,
    "tags": [
      "salle_de_classe_&_éducation",
      "independence_s4",
      "case_0"
    ],
    "split": "val"
  },
  {
    "id": "WP2-EO-187",
    "worldCategory": "Salle de classe & Éducation",
    "initialWorldPrompt": "Scène scindée en deux secteurs isolés dans Salle de classe & Éducation (Zone Alpha et Zone Bêta).",
    "editA": "Déplace l'outil modulaire dans la Zone Alpha de Salle de classe & Éducation vers le casier de rangement",
    "editB": "Allume le rétroéclairage du terminal de commande dans la Zone Bêta de Salle de classe & Éducation",
    "editCategoryA": "MOVE",
    "editCategoryB": "CHANGE_PHYSICS",
    "stratum": "S4_TrueIndependence",
    "indirectType": "NONE",
    "dependencyDepth": 0,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_1",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S4_TrueIndependence (NONE) depth 0"
    },
    "seed": 1186,
    "tags": [
      "salle_de_classe_&_éducation",
      "independence_s4",
      "case_1"
    ],
    "split": "val"
  },
  {
    "id": "WP2-EO-188",
    "worldCategory": "Salle de classe & Éducation",
    "initialWorldPrompt": "Scène scindée en deux secteurs isolés dans Salle de classe & Éducation (Zone Alpha et Zone Bêta).",
    "editA": "Déplace l'outil modulaire dans la Zone Alpha de Salle de classe & Éducation vers le casier de rangement",
    "editB": "Allume le rétroéclairage du terminal de commande dans la Zone Bêta de Salle de classe & Éducation",
    "editCategoryA": "MOVE",
    "editCategoryB": "CHANGE_PHYSICS",
    "stratum": "S4_TrueIndependence",
    "indirectType": "NONE",
    "dependencyDepth": 0,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_2",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S4_TrueIndependence (NONE) depth 0"
    },
    "seed": 1187,
    "tags": [
      "salle_de_classe_&_éducation",
      "independence_s4",
      "case_2"
    ],
    "split": "val"
  },
  {
    "id": "WP2-EO-189",
    "worldCategory": "Salle de classe & Éducation",
    "initialWorldPrompt": "Scène scindée en deux secteurs isolés dans Salle de classe & Éducation (Zone Alpha et Zone Bêta).",
    "editA": "Déplace l'outil modulaire dans la Zone Alpha de Salle de classe & Éducation vers le casier de rangement",
    "editB": "Allume le rétroéclairage du terminal de commande dans la Zone Bêta de Salle de classe & Éducation",
    "editCategoryA": "MOVE",
    "editCategoryB": "CHANGE_PHYSICS",
    "stratum": "S4_TrueIndependence",
    "indirectType": "NONE",
    "dependencyDepth": 0,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_3",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S4_TrueIndependence (NONE) depth 0"
    },
    "seed": 1188,
    "tags": [
      "salle_de_classe_&_éducation",
      "independence_s4",
      "case_3"
    ],
    "split": "val"
  },
  {
    "id": "WP2-EO-190",
    "worldCategory": "Atelier culinaire & Pâtisserie",
    "initialWorldPrompt": "Scène scindée en deux secteurs isolés dans Atelier culinaire & Pâtisserie (Zone Alpha et Zone Bêta).",
    "editA": "Déplace l'outil modulaire dans la Zone Alpha de Atelier culinaire & Pâtisserie vers le casier de rangement",
    "editB": "Allume le rétroéclairage du terminal de commande dans la Zone Bêta de Atelier culinaire & Pâtisserie",
    "editCategoryA": "MOVE",
    "editCategoryB": "CHANGE_PHYSICS",
    "stratum": "S4_TrueIndependence",
    "indirectType": "NONE",
    "dependencyDepth": 0,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_1",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S4_TrueIndependence (NONE) depth 0"
    },
    "seed": 1189,
    "tags": [
      "atelier_culinaire_&_pâtisserie",
      "independence_s4",
      "case_0"
    ],
    "split": "val"
  },
  {
    "id": "WP2-EO-191",
    "worldCategory": "Atelier culinaire & Pâtisserie",
    "initialWorldPrompt": "Scène scindée en deux secteurs isolés dans Atelier culinaire & Pâtisserie (Zone Alpha et Zone Bêta).",
    "editA": "Déplace l'outil modulaire dans la Zone Alpha de Atelier culinaire & Pâtisserie vers le casier de rangement",
    "editB": "Allume le rétroéclairage du terminal de commande dans la Zone Bêta de Atelier culinaire & Pâtisserie",
    "editCategoryA": "MOVE",
    "editCategoryB": "CHANGE_PHYSICS",
    "stratum": "S4_TrueIndependence",
    "indirectType": "NONE",
    "dependencyDepth": 0,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_2",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S4_TrueIndependence (NONE) depth 0"
    },
    "seed": 1190,
    "tags": [
      "atelier_culinaire_&_pâtisserie",
      "independence_s4",
      "case_1"
    ],
    "split": "val"
  },
  {
    "id": "WP2-EO-192",
    "worldCategory": "Atelier culinaire & Pâtisserie",
    "initialWorldPrompt": "Scène scindée en deux secteurs isolés dans Atelier culinaire & Pâtisserie (Zone Alpha et Zone Bêta).",
    "editA": "Déplace l'outil modulaire dans la Zone Alpha de Atelier culinaire & Pâtisserie vers le casier de rangement",
    "editB": "Allume le rétroéclairage du terminal de commande dans la Zone Bêta de Atelier culinaire & Pâtisserie",
    "editCategoryA": "MOVE",
    "editCategoryB": "CHANGE_PHYSICS",
    "stratum": "S4_TrueIndependence",
    "indirectType": "NONE",
    "dependencyDepth": 0,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_3",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S4_TrueIndependence (NONE) depth 0"
    },
    "seed": 1191,
    "tags": [
      "atelier_culinaire_&_pâtisserie",
      "independence_s4",
      "case_2"
    ],
    "split": "val"
  },
  {
    "id": "WP2-EO-193",
    "worldCategory": "Centre médical & Simulation",
    "initialWorldPrompt": "Scène scindée en deux secteurs isolés dans Centre médical & Simulation (Zone Alpha et Zone Bêta).",
    "editA": "Déplace l'outil modulaire dans la Zone Alpha de Centre médical & Simulation vers le casier de rangement",
    "editB": "Allume le rétroéclairage du terminal de commande dans la Zone Bêta de Centre médical & Simulation",
    "editCategoryA": "MOVE",
    "editCategoryB": "CHANGE_PHYSICS",
    "stratum": "S4_TrueIndependence",
    "indirectType": "NONE",
    "dependencyDepth": 0,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_1",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S4_TrueIndependence (NONE) depth 0"
    },
    "seed": 1192,
    "tags": [
      "centre_médical_&_simulation",
      "independence_s4",
      "case_0"
    ],
    "split": "test_locked"
  },
  {
    "id": "WP2-EO-194",
    "worldCategory": "Centre médical & Simulation",
    "initialWorldPrompt": "Scène scindée en deux secteurs isolés dans Centre médical & Simulation (Zone Alpha et Zone Bêta).",
    "editA": "Déplace l'outil modulaire dans la Zone Alpha de Centre médical & Simulation vers le casier de rangement",
    "editB": "Allume le rétroéclairage du terminal de commande dans la Zone Bêta de Centre médical & Simulation",
    "editCategoryA": "MOVE",
    "editCategoryB": "CHANGE_PHYSICS",
    "stratum": "S4_TrueIndependence",
    "indirectType": "NONE",
    "dependencyDepth": 0,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_2",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S4_TrueIndependence (NONE) depth 0"
    },
    "seed": 1193,
    "tags": [
      "centre_médical_&_simulation",
      "independence_s4",
      "case_1"
    ],
    "split": "test_locked"
  },
  {
    "id": "WP2-EO-195",
    "worldCategory": "Centre médical & Simulation",
    "initialWorldPrompt": "Scène scindée en deux secteurs isolés dans Centre médical & Simulation (Zone Alpha et Zone Bêta).",
    "editA": "Déplace l'outil modulaire dans la Zone Alpha de Centre médical & Simulation vers le casier de rangement",
    "editB": "Allume le rétroéclairage du terminal de commande dans la Zone Bêta de Centre médical & Simulation",
    "editCategoryA": "MOVE",
    "editCategoryB": "CHANGE_PHYSICS",
    "stratum": "S4_TrueIndependence",
    "indirectType": "NONE",
    "dependencyDepth": 0,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_3",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S4_TrueIndependence (NONE) depth 0"
    },
    "seed": 1194,
    "tags": [
      "centre_médical_&_simulation",
      "independence_s4",
      "case_2"
    ],
    "split": "test_locked"
  },
  {
    "id": "WP2-EO-196",
    "worldCategory": "Centre médical & Simulation",
    "initialWorldPrompt": "Scène scindée en deux secteurs isolés dans Centre médical & Simulation (Zone Alpha et Zone Bêta).",
    "editA": "Déplace l'outil modulaire dans la Zone Alpha de Centre médical & Simulation vers le casier de rangement",
    "editB": "Allume le rétroéclairage du terminal de commande dans la Zone Bêta de Centre médical & Simulation",
    "editCategoryA": "MOVE",
    "editCategoryB": "CHANGE_PHYSICS",
    "stratum": "S4_TrueIndependence",
    "indirectType": "NONE",
    "dependencyDepth": 0,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_1",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S4_TrueIndependence (NONE) depth 0"
    },
    "seed": 1195,
    "tags": [
      "centre_médical_&_simulation",
      "independence_s4",
      "case_3"
    ],
    "split": "test_locked"
  },
  {
    "id": "WP2-EO-197",
    "worldCategory": "Montage meuble & DIY",
    "initialWorldPrompt": "Scène scindée en deux secteurs isolés dans Montage meuble & DIY (Zone Alpha et Zone Bêta).",
    "editA": "Déplace l'outil modulaire dans la Zone Alpha de Montage meuble & DIY vers le casier de rangement",
    "editB": "Allume le rétroéclairage du terminal de commande dans la Zone Bêta de Montage meuble & DIY",
    "editCategoryA": "MOVE",
    "editCategoryB": "CHANGE_PHYSICS",
    "stratum": "S4_TrueIndependence",
    "indirectType": "NONE",
    "dependencyDepth": 0,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_2",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S4_TrueIndependence (NONE) depth 0"
    },
    "seed": 1196,
    "tags": [
      "montage_meuble_&_diy",
      "independence_s4",
      "case_0"
    ],
    "split": "test_locked"
  },
  {
    "id": "WP2-EO-198",
    "worldCategory": "Montage meuble & DIY",
    "initialWorldPrompt": "Scène scindée en deux secteurs isolés dans Montage meuble & DIY (Zone Alpha et Zone Bêta).",
    "editA": "Déplace l'outil modulaire dans la Zone Alpha de Montage meuble & DIY vers le casier de rangement",
    "editB": "Allume le rétroéclairage du terminal de commande dans la Zone Bêta de Montage meuble & DIY",
    "editCategoryA": "MOVE",
    "editCategoryB": "CHANGE_PHYSICS",
    "stratum": "S4_TrueIndependence",
    "indirectType": "NONE",
    "dependencyDepth": 0,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_3",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S4_TrueIndependence (NONE) depth 0"
    },
    "seed": 1197,
    "tags": [
      "montage_meuble_&_diy",
      "independence_s4",
      "case_1"
    ],
    "split": "test_locked"
  },
  {
    "id": "WP2-EO-199",
    "worldCategory": "Montage meuble & DIY",
    "initialWorldPrompt": "Scène scindée en deux secteurs isolés dans Montage meuble & DIY (Zone Alpha et Zone Bêta).",
    "editA": "Déplace l'outil modulaire dans la Zone Alpha de Montage meuble & DIY vers le casier de rangement",
    "editB": "Allume le rétroéclairage du terminal de commande dans la Zone Bêta de Montage meuble & DIY",
    "editCategoryA": "MOVE",
    "editCategoryB": "CHANGE_PHYSICS",
    "stratum": "S4_TrueIndependence",
    "indirectType": "NONE",
    "dependencyDepth": 0,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_1",
      "annotator2": "expert_1",
      "agreement": true,
      "notes": "Validé humainement : S4_TrueIndependence (NONE) depth 0"
    },
    "seed": 1198,
    "tags": [
      "montage_meuble_&_diy",
      "independence_s4",
      "case_2"
    ],
    "split": "test_locked"
  },
  {
    "id": "WP2-EO-200",
    "worldCategory": "Game Design Lab & Escape Room",
    "initialWorldPrompt": "Scène scindée en deux secteurs isolés dans Game Design Lab & Escape Room (Zone Alpha et Zone Bêta).",
    "editA": "Déplace l'outil modulaire dans la Zone Alpha de Game Design Lab & Escape Room vers le casier de rangement",
    "editB": "Allume le rétroéclairage du terminal de commande dans la Zone Bêta de Game Design Lab & Escape Room",
    "editCategoryA": "MOVE",
    "editCategoryB": "CHANGE_PHYSICS",
    "stratum": "S4_TrueIndependence",
    "indirectType": "NONE",
    "dependencyDepth": 0,
    "entityOverlapScore": 0,
    "dependencyOverlapScore": 0,
    "expectedCompatibility": "compatible",
    "manualValidation": {
      "humanValidated": true,
      "annotator1": "annotator_2",
      "annotator2": "expert_2",
      "agreement": true,
      "notes": "Validé humainement : S4_TrueIndependence (NONE) depth 0"
    },
    "seed": 1199,
    "tags": [
      "game_design_lab_&_escape_room",
      "independence_s4",
      "case_0"
    ],
    "split": "test_locked"
  }
];
