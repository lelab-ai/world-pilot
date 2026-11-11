/**
 * Pedagogical Action-Graph Compiler
 * Research Pillar: Compiling Natural Language Prompts into Active Kinesthetic Error-Traps & Physical Apparatus
 * Target Publication: ACM CHI / AIED (Artificial Intelligence in Education) & IEEE TLT
 */

import { WorldPatch, EntitySpec, RuleSpec, QuestSpec } from '../core/types';

export type BloomLevel = 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE' | 'EVALUATE';

export interface PedagogicalTopicPreset {
  id: string;
  title: string;
  domain: 'PHYSICS_ELECTRICITY' | 'OPTICS' | 'THERMODYNAMICS' | 'AEROSPACE';
  bloomLevel: BloomLevel;
  misconceptionTrap: string;
  learningObjectives: string[];
  apparatusSpecs: Array<{
    name: string;
    type: string;
    initialReading: string | number;
    metricUnit: string;
    position: [number, number, number];
  }>;
}

export const PEDAGOGICAL_PRESETS: Record<string, PedagogicalTopicPreset> = {
  electricity_ohm: {
    id: 'electricity_ohm',
    title: "Laboratoire d'Électrocinétique : Loi d'Ohm & Protection Court-Circuit",
    domain: 'PHYSICS_ELECTRICITY',
    bloomLevel: 'ANALYZE',
    misconceptionTrap: "Intuition erronée : brancher le fil de dérivation sans résistance pour 'augmenter le courant' déclenche la fusion du fusible de protection.",
    learningObjectives: [
      "Vérifier expérimentalement la relation linéaire U = R × I.",
      "Expérimenter l'emballement thermique d'un court-circuit dans un environnement virtuel sécurisé.",
      "Diagnostiquer la rupture du fusible et rétablir le circuit avec une résistance calibrée.",
    ],
    apparatusSpecs: [
      { name: "Alimentation Stabilisée DC 12V", type: "power_supply", initialReading: 12.0, metricUnit: "V", position: [-0.6, 0.9, -0.2] },
      { name: "Boîte à Décades de Résistance", type: "rheostat", initialReading: 100, metricUnit: "Ω", position: [0.0, 0.9, -0.2] },
      { name: "Multimètre Numérique d'Établi", type: "multimeter", initialReading: 0.12, metricUnit: "A", position: [0.6, 0.9, -0.2] },
      { name: "Fusible de Protection Rapide (0.5A)", type: "fuse_module", initialReading: "INTACT", metricUnit: "état", position: [0.0, 0.9, 0.2] },
    ],
  },
  optics_snell: {
    id: 'optics_snell',
    title: "Banc d'Optique Géométrique : Réfraction de Snell-Descartes & Angle Limite",
    domain: 'OPTICS',
    bloomLevel: 'EVALUATE',
    misconceptionTrap: "Intuition erronée : croire que la lumière pénètre toujours dans le second milieu quel que soit l'angle d'incidence (piège de la réflexion totale interne).",
    learningObjectives: [
      "Mesurer les angles d'incidence et de réfraction sur un demi-cylindre de plexiglas.",
      "Observer la disparition du rayon réfracté au franchissement de l'angle critique θ_c.",
      "Calculer l'indice de réfraction absolu n du matériau.",
    ],
    apparatusSpecs: [
      { name: "Source Laser Collimatée 532nm", type: "laser_source", initialReading: 532, metricUnit: "nm", position: [-0.7, 0.9, -0.1] },
      { name: "Disque Gradué de Hartl (0-360°)", type: "goniometer", initialReading: 30, metricUnit: "°", position: [-0.22, 0.9, -0.1] },
      { name: "Demi-Cylindre Dioptrique Plexiglas", type: "prism", initialReading: 1.49, metricUnit: "n", position: [0.22, 0.9, -0.1] },
      { name: "Photodétecteur Récepteur", type: "detector", initialReading: 94.2, metricUnit: "%", position: [0.7, 0.9, -0.1] },
    ],
  },
  thermo_calorimetry: {
    id: 'thermo_calorimetry',
    title: "Thermodynamique : Calorimétrie Adiabatique & Chaleur Latente",
    domain: 'THERMODYNAMICS',
    bloomLevel: 'APPLY',
    misconceptionTrap: "Intuition erronée : imaginer que l'ajout d'énergie thermique augmente continuellement la température pendant la transition de phase.",
    learningObjectives: [
      "Constater le palier thermique invariant lors de la fusion de la glace à 0°C.",
      "Mesurer la chaleur massique d'un lingot métallique immergé.",
      "Établir le bilan énergétique du système fermé calorimétrique.",
    ],
    apparatusSpecs: [
      { name: "Vase Dewar Calorimétrique Isolé", type: "calorimeter", initialReading: 18.5, metricUnit: "°C", position: [-0.4, 0.9, 0.0] },
      { name: "Sonde Thermocouple Haute Précision", type: "thermometer", initialReading: 18.5, metricUnit: "°C", position: [0.0, 0.9, 0.0] },
      { name: "Agitateur Magnétique Chauffant", type: "stirrer", initialReading: 250, metricUnit: "RPM", position: [0.4, 0.9, 0.0] },
    ],
  },
};

export interface CompiledPedagogicalSimulation {
  preset: PedagogicalTopicPreset;
  worldPatch: WorldPatch;
  diagnosticFeedback: {
    misconceptionTrap: string;
    scaffoldingGuidance: string;
  };
}

/**
 * Compiles a natural language educational intent into an active physical simulation
 */
export function compilePedagogicalSimulation(
  prompt: string,
  userLevel: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'
): CompiledPedagogicalSimulation {
  const trimmedKey = prompt.trim();
  const norm = trimmedKey
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  let selectedKey = 'electricity_ohm';

  if (PEDAGOGICAL_PRESETS[trimmedKey]) {
    selectedKey = trimmedKey;
  } else if (PEDAGOGICAL_PRESETS[trimmedKey.toLowerCase()]) {
    selectedKey = trimmedKey.toLowerCase();
  } else if (norm.includes('optique') || norm.includes('optics') || norm.includes('snell') || norm.includes('lumiere') || norm.includes('laser') || norm.includes('refraction') || norm.includes('prisme') || norm.includes('dioptre') || norm.includes('lentille')) {
    selectedKey = 'optics_snell';
  } else if (norm.includes('thermo') || norm.includes('chaleur') || norm.includes('calorimetr') || norm.includes('temperature') || norm.includes('adiabatique') || norm.includes('dewar') || norm.includes('enthalpie')) {
    selectedKey = 'thermo_calorimetry';
  }

  const preset = PEDAGOGICAL_PRESETS[selectedKey];

  // Synthesize Entities
  const entitiesCreated: EntitySpec[] = [];
  const rulesChanged: RuleSpec[] = [];

  // 1. Physical Lab Workbench
  const benchId = `pedagogical_bench_${preset.id}`;
  entitiesCreated.push({
    id: benchId,
    name: "Paillasse de Manipulation Expérimentale",
    capabilities: [
      { type: 'transform', position: { x: 0, y: 0.42, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
      { type: 'collider' },
      { type: 'static_mesh', isStatic: true },
    ],
    physicalProperties: {
      dimensions: [2.2, 0.84, 1.2],
      material: 'epoxy_resin',
      weightKg: 85,
    },
    visuals: {
      shape: 'box',
      color: '#1e293b',
      assetId: 'pedagogical_bench',
    },
  });

  // 2. Procedural Apparatus Carving
  preset.apparatusSpecs.forEach((spec, idx) => {
    const apparatusId = `apparatus_${preset.id}_${idx}`;
    const posObj = Array.isArray(spec.position)
      ? { x: spec.position[0], y: spec.position[1], z: spec.position[2] }
      : spec.position;
    const scaleObj = { x: 1, y: 1, z: 1 };

    entitiesCreated.push({
      id: apparatusId,
      name: spec.name,
      capabilities: [
        {
          type: 'transform',
          position: posObj,
          rotation: { x: 0, y: 0, z: 0 },
          scale: scaleObj,
        },
        { type: 'interactive', enabled: true },
        { type: 'pedagogical_apparatus', apparatusType: spec.type },
        { type: 'collider' },
        { type: 'draggable' },
        { type: spec.type },
      ],
      physicalProperties: {
        dimensions: spec.type === 'prism' ? [0.25, 0.15, 0.25] : [0.35, 0.25, 0.25],
      },
      visuals: {
        shape: spec.type === 'prism' ? 'cylinder' : 'box',
        color: idx === 0 ? '#38bdf8' : idx === 1 ? '#f59e0b' : '#10b981',
        assetId: `apparatus_${spec.type}`,
      },
    });

    // Associated Reactive Causal Rule
    rulesChanged.push({
      id: `rule_${apparatusId}_measure`,
      trigger: 'INTERACT',
      conditions: [
        { type: 'is_source', sourceId: apparatusId }
      ],
      actions: [
        {
          type: 'set_flag',
          flag: `measurement_${apparatusId}`,
          value: spec.initialReading,
        },
        {
          type: 'play_sound',
          sound: 'chime',
        },
        {
          type: 'show_warning',
          message: `Mesure prise sur ${spec.name} : ${spec.initialReading} ${spec.metricUnit}`,
        },
      ],
    });
  });

  // 3. Cognitive Error Trap Entity (e.g. Fusible de dérivation ou Angle critique)
  const trapEntityId = `trap_${preset.id}`;
  entitiesCreated.push({
    id: trapEntityId,
    name: "Composant de Dérivation à Risque (Piège Formateur)",
    capabilities: [
      { type: 'transform', position: { x: 0.35, y: 0.9, z: 0.35 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
      { type: 'interactive', enabled: true },
      { type: 'cognitive_trap', enabled: true },
      { type: 'collider' },
      { type: 'draggable' },
    ],
    physicalProperties: {
      dimensions: [0.18, 0.18, 0.18],
    },
    visuals: {
      shape: 'sphere',
      color: '#ef4444',
      assetId: 'cognitive_trap_module',
    },
  });

  const trapWarningMessage =
    preset.domain === 'OPTICS'
      ? '🔦 Réflexion totale interne franchie (θ > θ_c) ! Aucun rayon réfracté ne traverse le dioptre.'
      : preset.domain === 'THERMODYNAMICS'
      ? '🌡️ Palier enthalpique de transition de phase ! L\'apport calorifique fond la glace à température constante (0°C).'
      : '⚡ Court-circuit détecté ! Le fusible de protection s\'est déclenché.';

  // Error Trap Rule: Triggers immediate physical consequence without crashing
  rulesChanged.push({
    id: `rule_trigger_trap_${preset.id}`,
    trigger: 'INTERACT',
    conditions: [
      { type: 'is_source', sourceId: trapEntityId }
    ],
    actions: [
      {
        type: 'set_flag',
        flag: `state_${trapEntityId}`,
        value: 'OVERLOAD_TRIGGERED',
      },
      {
        type: 'play_sound',
        sound: 'electric_spark',
      },
      {
        type: 'show_warning',
        message: trapWarningMessage,
      },
    ],
  });

  // 4. Construct 4-Step Formative Quest
  const questId = `quest_pedagogical_${preset.id}`;
  const quest: QuestSpec = {
    id: questId,
    title: preset.title,
    description: `Simulation active : ${preset.learningObjectives[0]}`,
    category: 'formation',
    currentStepIndex: 0,
    status: 'in_progress',
    rewardSound: 'fanfare',
    steps: [
      {
        id: 'step_1_observe',
        title: `Inspecter les réglages initiaux de l'appareil '${preset.apparatusSpecs[0].name}'.`,
        targetEntityId: `apparatus_${preset.id}_0`,
        requiredEvent: `INTERACT:apparatus_${preset.id}_0`,
        completed: false,
      },
      {
        id: 'step_2_calibrate',
        title: `Régler et coupler '${preset.apparatusSpecs[1].name}'.`,
        targetEntityId: `apparatus_${preset.id}_1`,
        requiredEvent: `INTERACT:apparatus_${preset.id}_1`,
        completed: false,
      },
      {
        id: 'step_3_trap_experience',
        title: `Éprouver la limite du système en manipulant le composant de test (Déclenchement du conflit cognitif).`,
        targetEntityId: trapEntityId,
        requiredEvent: `INTERACT:${trapEntityId}`,
        completed: false,
      },
      {
        id: 'step_4_synthesize',
        title: `Rétablir l'équilibre du banc de mesure et valider la consigne finale.`,
        targetEntityId: `apparatus_${preset.id}_2`,
        requiredEvent: `INTERACT:apparatus_${preset.id}_2`,
        completed: false,
      },
    ],
  };

  const worldPatch: WorldPatch = {
    entitiesCreated,
    rulesChanged,
    questsAdded: [quest],
    activeQuestId: questId,
  };

  return {
    preset,
    worldPatch,
    diagnosticFeedback: {
      misconceptionTrap: preset.misconceptionTrap,
      scaffoldingGuidance: `Mode guidé (${userLevel}) : L'aimantation ergonomique est active à 0.38m pour faciliter le calibrage physique.`,
    },
  };
}
