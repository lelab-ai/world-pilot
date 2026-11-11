// src/engine/proceduralChallengeEngine.ts
// Moteur de Variabilité Procédurale, Diagnostic d'Atelier, Graines (Seeds) Déterministes
// et Générateur de Défis / Jeux d'Apprentissage 3D pour WorldPilot.

import type { WorldPatch, EntitySpec, RuleSpec, QuestSpec } from '../core/types';

/**
 * Générateur Pseudo-Aléatoire Déterministe (Linear Congruential Generator - LCG)
 * Permet de reproduire exactement une même simulation aléatoire avec un numéro de graine (seed).
 */
export class SeededPRNG {
  private state: number;

  constructor(seed: number | string = Date.now()) {
    if (typeof seed === 'string') {
      let hash = 0;
      for (let i = 0; i < seed.length; i++) {
        hash = (hash << 5) - hash + seed.charCodeAt(i);
        hash |= 0;
      }
      this.state = Math.abs(hash) || 123456789;
    } else {
      this.state = Math.abs(Math.floor(seed)) || 123456789;
    }
  }

  /**
   * Retourne un flottant pseudo-aléatoire uniforme dans [0, 1[
   */
  next(): number {
    this.state = (this.state * 1664525 + 1013904223) % 4294967296;
    return this.state / 4294967296;
  }

  /**
   * Retourne un entier dans [min, max] inclus
   */
  nextInt(min: number, max: number): number {
    return Math.floor(min + this.next() * (max - min + 1));
  }

  /**
   * Retourne un flottant dans [min, max]
   */
  nextFloat(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /**
   * Choisi un élément aléatoire dans un tableau
   */
  choice<T>(array: readonly T[]): T {
    const idx = Math.floor(this.next() * array.length);
    return array[idx];
  }

  /**
   * Génère une perturbation gaussienne centrée avec écart-type stdDev
   */
  gaussian(mean = 0, stdDev = 1): number {
    const u1 = Math.max(1e-15, this.next());
    const u2 = this.next();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return mean + z0 * stdDev;
  }
}

export type ChallengeDomain = 
  | 'PHYSICS_ELECTRICITY' 
  | 'MECHANICS_ASSEMBLY' 
  | 'THERMODYNAMICS' 
  | 'CHEMISTRY_GASTRONOMY';

export type FaultSeverity = 'mild' | 'moderate' | 'critical';

export interface ProceduralFaultSpec {
  id: string;
  name: string;
  domain: ChallengeDomain;
  targetComponentId: string;
  faultType: string;
  symptomDescription: string;
  hiddenPhysicalEffect: string;
  severity: FaultSeverity;
  nominalValue: number;
  perturbedValue: number;
  unit: string;
  repairAction: string;
  diagnosticProof: string;
}

export interface ProceduralChallengeSession {
  seed: number;
  domain: ChallengeDomain;
  title: string;
  description: string;
  difficulty: 'normal' | 'hard' | 'expert';
  fault: ProceduralFaultSpec;
  budgetMeasuresMax: number;
  measuresUsed: number;
  timeLimitSec: number;
  timeRemainingSec: number;
  status: 'in_progress' | 'diagnosed_success' | 'diagnosed_failure' | 'budget_exhausted' | 'timeout';
  efficiencyScore: number;
  hintsRevealed: number;
  spatialPerturbations: Record<string, [number, number, number]>;
}

export interface CompiledProceduralChallenge {
  session: ProceduralChallengeSession;
  worldPatch: WorldPatch;
  scaffoldingGuidance: string;
}

/**
 * Catalogue des pannes générables procéduralement par domaine
 */
const FAULT_CATALOG = {
  PHYSICS_ELECTRICITY: [
    {
      faultType: 'blown_fuse',
      name: 'Fusible fondu / Circuit ouvert franc',
      symptomDescription: 'Tension normale à vide, mais courant nul I = 0.00 A dès la mise en charge.',
      hiddenPhysicalEffect: 'Résistance interne infinie R -> infiny',
      severity: 'critical' as const,
      nominalValue: 0.1,
      perturbedValue: 999999,
      unit: 'Ω',
      repairAction: 'Remplacer le module fusible par un composant calibré 0.5A.',
      diagnosticProof: 'Mesure de continuité au multimètre (valeur OL / hors limite).'
    },
    {
      faultType: 'short_circuit',
      name: 'Court-circuit franc interne',
      symptomDescription: 'Chute brutale de la tension d\'alimentation, déclenchement du disjoncteur thermique.',
      hiddenPhysicalEffect: 'Résistance nulle R = 0.0 Ω en amont de la charge',
      severity: 'critical' as const,
      nominalValue: 100,
      perturbedValue: 0.02,
      unit: 'Ω',
      repairAction: 'Isoler le court-circuit et réinsérer la résistance de charge.',
      diagnosticProof: 'Résistance mesurée quasi nulle aux bornes du récepteur.'
    },
    {
      faultType: 'drift_resistance',
      name: 'Dérive de valeur ohmique (+85%)',
      symptomDescription: 'Courant nettement inférieur à la consigne nominale (U/R anormalement bas).',
      hiddenPhysicalEffect: 'Dégradation thermique du substrat carboné de la résistance',
      severity: 'moderate' as const,
      nominalValue: 100,
      perturbedValue: 185,
      unit: 'Ω',
      repairAction: 'Réétalonner la boîte à décades sur la résistance nominale 100 Ω.',
      diagnosticProof: 'Mesure de résistance donnant 185 Ω au lieu des 100 Ω nominaux.'
    },
    {
      faultType: 'loose_terminal',
      name: 'Cosse de masse desserrée / Contact intermittent',
      symptomDescription: 'Affichage instable avec micro-coupures et chute de tension parasite.',
      hiddenPhysicalEffect: 'Résistance de contact fluctuante entre 5 Ω et 40 Ω',
      severity: 'mild' as const,
      nominalValue: 0.0,
      perturbedValue: 18.5,
      unit: 'Ω',
      repairAction: 'Resserrer la borne de masse mécanique au tournevis d\'atelier.',
      diagnosticProof: 'Tension fluctuante mesurée entre la masse du châssis et la référence.'
    }
  ],

  MECHANICS_ASSEMBLY: [
    {
      faultType: 'missing_dowel',
      name: 'Tourillon bois manquant dans le kit',
      symptomDescription: 'Jeu structurel asymétrique lors de l\'assemblage du montant latéral.',
      hiddenPhysicalEffect: 'Absence d\'appui d\'alignement sur le champ inférieur',
      severity: 'moderate' as const,
      nominalValue: 8,
      perturbedValue: 7,
      unit: 'pièces',
      repairAction: 'Piocher un tourillon de rechange dans le sachet de quincaillerie.',
      diagnosticProof: 'Comptage de la quincaillerie révélant un manque de 1 unité.'
    },
    {
      faultType: 'loose_cam_lock',
      name: 'Boîtier excentrique mal verrouillé',
      symptomDescription: 'L\'étagère bascule sous une faible charge latérale.',
      hiddenPhysicalEffect: 'Verrouillage à 45° au lieu des 180° requis',
      severity: 'mild' as const,
      nominalValue: 180,
      perturbedValue: 45,
      unit: 'degrés',
      repairAction: 'Effectuer un quart de tour complet à la clé Allen 4mm.',
      diagnosticProof: 'Inspection visuelle de la flèche gravée sur le boîtier de came.'
    },
    {
      faultType: 'missing_wall_anchor',
      name: 'Omission de l\'équerre anti-basculement',
      symptomDescription: 'Non-conformité critique à la norme ASTM F2057-23 (risque de bascule).',
      hiddenPhysicalEffect: 'Centre de gravité non fixé au plancher mural',
      severity: 'critical' as const,
      nominalValue: 1,
      perturbedValue: 0,
      unit: 'équerre',
      repairAction: 'Poser l\'équerre métallique et la verrouiller dans la zone murale.',
      diagnosticProof: 'Test de traction montrant un décollement du meuble du mur.'
    }
  ],

  THERMODYNAMICS: [
    {
      faultType: 'thermal_runaway',
      name: 'Emballement thermique du récepteur',
      symptomDescription: 'Montée rapide en température dépassant 190°C avec début de carbonisation.',
      hiddenPhysicalEffect: 'Thermostat en conduction permanente sans régulation PWM',
      severity: 'critical' as const,
      nominalValue: 110,
      perturbedValue: 215,
      unit: '°C',
      repairAction: 'Couper immédiatement la source ou régler l\'allure thermique à zéro.',
      diagnosticProof: 'Sonde de température affichant plus de 200°C.'
    },
    {
      faultType: 'calorimeter_leak',
      name: 'Défaut d\'isolation adiabatique (Fuite de flux thermique)',
      symptomDescription: 'Chute de température anormale de 0.8°C/minute sans échange utile.',
      hiddenPhysicalEffect: 'Joint de couvercle mal emboîté sur le vase Dewar',
      severity: 'moderate' as const,
      nominalValue: 0.05,
      perturbedValue: 0.85,
      unit: '°C/min',
      repairAction: 'Réajuster l\'emboîtement du couvercle hermétique du calorimètre.',
      diagnosticProof: 'Pente de refroidissement trop abrupte sur le graphe de température.'
    }
  ],

  CHEMISTRY_GASTRONOMY: [
    {
      faultType: 'ingredient_oxidation',
      name: 'Oxydation précoce des sucs aromatiques',
      symptomDescription: 'Brunissement enzymatique et dégradation de la saveur herbacée.',
      hiddenPhysicalEffect: 'Exposition à l\'air libre sans immersion dans le liquide de réduction',
      severity: 'mild' as const,
      nominalValue: 0,
      perturbedValue: 1,
      unit: 'indice',
      repairAction: 'Ajouter une émulsion d\'huile d\'olive et recouvrir la préparation.',
      diagnosticProof: 'Virage de coloration visuel plus sombre au fond de la cocotte.'
    },
    {
      faultType: 'salinity_saturation',
      name: 'Saturation en chlorure de sodium (+120%)',
      symptomDescription: 'Bouillon sursalé agressant les capteurs de dégustation.',
      hiddenPhysicalEffect: 'Masse de sel ajoutée de 15g au lieu de 6g',
      severity: 'moderate' as const,
      nominalValue: 6,
      perturbedValue: 15,
      unit: 'g',
      repairAction: 'Mouiller avec un bouillon neutre ou ajouter un féculent absorbant.',
      diagnosticProof: 'Réfractomètre indiquant une concentration saline hors norme.'
    }
  ]
};

/**
 * Compile un défi procédural complet avec graine déterministe, composants 3D,
 * injection de panne aléatoire, budget de mesures et quête d'investigation.
 */
export function compileProceduralChallenge(options: {
  domain?: ChallengeDomain;
  seed?: number | string;
  difficulty?: 'normal' | 'hard' | 'expert';
  budgetMeasures?: number;
  timeLimitSec?: number;
  randomizeLayout?: boolean;
}): CompiledProceduralChallenge {
  const seedNum = typeof options.seed === 'number' 
    ? options.seed 
    : typeof options.seed === 'string'
    ? Math.abs(options.seed.split('').reduce((acc, c) => ((acc << 5) - acc) + c.charCodeAt(0), 0))
    : Math.floor(100000 + Math.random() * 900000);

  const prng = new SeededPRNG(seedNum);
  const rawDomain = options.domain;
  const domain: ChallengeDomain =
    rawDomain && rawDomain in FAULT_CATALOG
      ? rawDomain
      : prng.choice([
          'PHYSICS_ELECTRICITY',
          'MECHANICS_ASSEMBLY',
          'THERMODYNAMICS',
          'CHEMISTRY_GASTRONOMY'
        ]);

  const difficulty = options.difficulty || 'normal';
  const budgetMeasuresMax = options.budgetMeasures || (difficulty === 'expert' ? 2 : difficulty === 'hard' ? 3 : 5);
  const timeLimitSec = options.timeLimitSec || (difficulty === 'expert' ? 60 : difficulty === 'hard' ? 120 : 180);

  // 1. Tirage de la panne procédurale
  const domainFaults = FAULT_CATALOG[domain] || FAULT_CATALOG.PHYSICS_ELECTRICITY;
  const faultTemplate = prng.choice(domainFaults);

  // Application d'une tolérance physique réelle (bruit de fabrication +/- 5%)
  const toleranceNoise = prng.nextFloat(-0.05, 0.05);
  const perturbedActualValue = Number((faultTemplate.perturbedValue * (1 + toleranceNoise)).toFixed(2));

  const fault: ProceduralFaultSpec = {
    id: `fault_${domain.toLowerCase()}_${seedNum}`,
    name: faultTemplate.name,
    domain,
    targetComponentId: `apparatus_${domain.toLowerCase()}_target`,
    faultType: faultTemplate.faultType,
    symptomDescription: faultTemplate.symptomDescription,
    hiddenPhysicalEffect: faultTemplate.hiddenPhysicalEffect,
    severity: faultTemplate.severity,
    nominalValue: faultTemplate.nominalValue,
    perturbedValue: perturbedActualValue,
    unit: faultTemplate.unit,
    repairAction: faultTemplate.repairAction,
    diagnosticProof: faultTemplate.diagnosticProof
  };

  // 2. Perturbation spatiale de l'établi si demandée
  const spatialPerturbations: Record<string, [number, number, number]> = {};
  if (options.randomizeLayout) {
    spatialPerturbations['pos_supply'] = [prng.nextFloat(-0.7, -0.4), 0.9, prng.nextFloat(-0.3, -0.1)];
    spatialPerturbations['pos_meter'] = [prng.nextFloat(0.4, 0.7), 0.9, prng.nextFloat(-0.3, -0.1)];
    spatialPerturbations['pos_load'] = [prng.nextFloat(-0.1, 0.2), 0.9, prng.nextFloat(0.0, 0.25)];
  }

  // 3. Synthèse de la session de jeu
  const session: ProceduralChallengeSession = {
    seed: seedNum,
    domain,
    title: `Défi Diagnostic #${seedNum} · ${domain === 'PHYSICS_ELECTRICITY' ? 'Électronique' : domain === 'MECHANICS_ASSEMBLY' ? 'Mécanique' : domain === 'THERMODYNAMICS' ? 'Thermique' : 'Gastronomie'}`,
    description: `Une anomalie technique invisible s'est glissée sur cet atelier. Budget de diagnostic : ${budgetMeasuresMax} mesures. Isolez la cause et rétablissez la conformité.`,
    difficulty,
    fault,
    budgetMeasuresMax,
    measuresUsed: 0,
    timeLimitSec,
    timeRemainingSec: timeLimitSec,
    status: 'in_progress',
    efficiencyScore: 100,
    hintsRevealed: 0,
    spatialPerturbations
  };

  // 4. Génération des entités 3D et règles causales
  const entitiesCreated: EntitySpec[] = [];
  const rulesChanged: RuleSpec[] = [];

  const toVec3Obj = (v: [number, number, number]) => ({ x: v[0], y: v[1], z: v[2] });

  // Paillasse d'atelier
  entitiesCreated.push({
    id: `bench_challenge_${seedNum}`,
    name: 'Établi de Diagnostic Haute Précision',
    capabilities: [
      { type: 'transform', position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 2.2, y: 0.9, z: 1.2 } },
      { type: 'collider' }
    ],
    visuals: { assetId: 'technical-bench', modelUrl: '/library/technical-bench.glb' }
  });

  // Multimètre / Outil de diagnostic avec compteur de mesures
  const meterId = `meter_diag_${seedNum}`;
  const meterPos = spatialPerturbations['pos_meter'] || [0.55, 0.92, -0.15];
  entitiesCreated.push({
    id: meterId,
    name: 'Multimètre Numérique de Diagnostic (Sondes)',
    capabilities: [
      { type: 'transform', position: toVec3Obj(meterPos), rotation: { x: 0, y: -0.2, z: 0 }, scale: { x: 0.35, y: 0.25, z: 0.35 } },
      { type: 'collider' },
      { type: 'draggable' },
      { type: 'educational', text: `MULTIMÈTRE CALIBRÉ\nMesures restantes : ${budgetMeasuresMax}\nGraine : #${seedNum}`, value: 0, active: true }
    ],
    visuals: { assetId: 'diagnostic', modelUrl: '/library/diagnostic.glb' }
  });

  // Composant défaillant cible
  const targetId = fault.targetComponentId;
  const targetPos = spatialPerturbations['pos_load'] || [0.0, 0.92, 0.05];
  entitiesCreated.push({
    id: targetId,
    name: `Composant sous Test (${fault.name})`,
    capabilities: [
      { type: 'transform', position: toVec3Obj(targetPos), rotation: { x: 0, y: 0, z: 0 }, scale: { x: 0.3, y: 0.3, z: 0.3 } },
      { type: 'collider' },
      { type: 'draggable' },
      { type: 'educational', text: `COMPOSANT À DIAGNOSTIQUER\nSymptôme : ${fault.symptomDescription}`, value: 0, active: false }
    ],
    visuals: { assetId: 'battery', modelUrl: '/library/battery.glb' }
  });

  // Source d'alimentation / Générateur
  const supplyId = `supply_${seedNum}`;
  const supplyPos = spatialPerturbations['pos_supply'] || [-0.55, 0.92, -0.15];
  entitiesCreated.push({
    id: supplyId,
    name: 'Générateur de Tension Réglable DC',
    capabilities: [
      { type: 'transform', position: toVec3Obj(supplyPos), rotation: { x: 0, y: 0.2, z: 0 }, scale: { x: 0.4, y: 0.3, z: 0.3 } },
      { type: 'collider' },
      { type: 'educational', text: `SOURCE STABILISÉE\n12.0 V nominal (Tolérance ±5%)`, value: 0, active: false }
    ],
    visuals: { assetId: 'control-panel', modelUrl: '/library/control-panel.glb' }
  });

  // Panneau récepteur de validation du diagnostic
  const validatorId = `validator_${seedNum}`;
  entitiesCreated.push({
    id: validatorId,
    name: 'Borne de Diagnostic & Dépannage',
    capabilities: [
      { type: 'transform', position: { x: 0, y: 1.45, z: -0.45 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1.2, y: 0.6, z: 0.1 } },
      { type: 'collider' },
      { type: 'educational', text: `DÉFI #${seedNum}\n${fault.symptomDescription}\n\nCliquez pour valider le verdict une fois isolé.`, value: 0, active: true }
    ],
    visuals: { assetId: 'wall-screen', modelUrl: '/library/wall-screen.glb' }
  });

  // Règle 0 : Calibration / utilisation du multimètre de diagnostic
  rulesChanged.push({
    id: `rule_calibrate_${meterId}`,
    trigger: 'INTERACT',
    conditions: [{ type: 'is_source', sourceId: meterId }],
    actions: [
      { type: 'set_flag', flag: `calibrated_${meterId}`, value: true },
      { type: 'play_sound', sound: 'switch_click' },
      {
        type: 'show_warning',
        message: `📟 Multimètre #${seedNum} prêt (Budget : ${budgetMeasuresMax} mesures). Cliquez sur le composant cible pour relever la mesure.`
      }
    ]
  });

  // Règle 1 : Mesure sur le composant (consomme une mesure du budget et révèle la valeur bruitée)
  rulesChanged.push({
    id: `rule_measure_${targetId}`,
    trigger: 'INTERACT',
    conditions: [{ type: 'is_source', sourceId: targetId }],
    actions: [
      { type: 'set_flag', flag: `measured_${targetId}`, value: true },
      { type: 'play_sound', sound: 'switch_click' },
      { 
        type: 'show_warning', 
        message: `📊 Mesure #${seedNum} : Valeur mesurée = ${perturbedActualValue} ${fault.unit} ! (Nominal : ${fault.nominalValue} ${fault.unit}). Symptôme : ${fault.hiddenPhysicalEffect}.` 
      }
    ]
  });

  // Règle 1b : Consultation initiale du symptôme sur la borne (avant mesure)
  rulesChanged.push({
    id: `rule_observe_${validatorId}`,
    trigger: 'INTERACT',
    conditions: [
      { type: 'is_source', sourceId: validatorId },
      { type: 'require_flag', flag: `measured_${targetId}`, value: false }
    ],
    actions: [
      { type: 'set_flag', flag: `symptom_observed_${seedNum}`, value: true },
      { type: 'play_sound', sound: 'chime' },
      {
        type: 'show_warning',
        message: `🔍 Symptôme observé (Défi #${seedNum}) : ${fault.symptomDescription}. Procédez maintenant à la mesure sur le composant cible.`
      }
    ]
  });

  // Règle 2 : Soumission du diagnostic sur la borne (requiert d'avoir effectué la mesure)
  rulesChanged.push({
    id: `rule_submit_${validatorId}`,
    trigger: 'INTERACT',
    conditions: [
      { type: 'is_source', sourceId: validatorId },
      { type: 'require_flag', flag: `measured_${targetId}`, value: true }
    ],
    actions: [
      { type: 'set_flag', flag: `challenge_diagnosed_${seedNum}`, value: true },
      { type: 'play_sound', sound: 'fanfare' },
      { 
        type: 'show_warning', 
        message: `🏆 Diagnostic Validé (Graine #${seedNum}) ! Panne isolée : ${fault.name}. Remède : ${fault.repairAction}` 
      }
    ]
  });

  // 5. Quête d'investigation méthodique en 4 étapes
  const questId = `quest_challenge_${seedNum}`;
  const quest: QuestSpec = {
    id: questId,
    title: session.title,
    description: session.description,
    category: 'formation',
    currentStepIndex: 0,
    status: 'in_progress',
    rewardSound: 'fanfare',
    steps: [
      {
        id: 'step_1_observe_symptom',
        title: `Prendre connaissance du symptôme sur la borne : « ${fault.symptomDescription} ».`,
        targetEntityId: validatorId,
        requiredEvent: 'INTERACT',
        completed: false
      },
      {
        id: 'step_2_probe_apparatus',
        title: `Effectuer un prélèvement de mesure au multimètre sur le composant cible.`,
        targetEntityId: targetId,
        requiredEvent: 'INTERACT',
        completed: false
      },
      {
        id: 'step_3_identify_root_cause',
        title: `Analyser l'écart entre la valeur mesurée (${perturbedActualValue} ${fault.unit}) et le nominal (${fault.nominalValue} ${fault.unit}).`,
        targetEntityId: targetId,
        requiredEvent: 'INTERACT',
        completed: false
      },
      {
        id: 'step_4_submit_verdict',
        title: `Valider le verdict sur la borne d'atelier et appliquer le remède : ${fault.repairAction}`,
        targetEntityId: validatorId,
        requiredEvent: 'INTERACT',
        completed: false
      }
    ]
  };

  const worldPatch: WorldPatch = {
    entitiesCreated,
    rulesChanged,
    questsAdded: [quest],
    activeQuestId: questId,
    gameplayPatch: {
      title: session.title,
      score: 100,
      lives: budgetMeasuresMax,
      maxLives: budgetMeasuresMax,
      timer: timeLimitSec,
      isTimerActive: true,
      gameStatus: 'running',
      gameMode: 'custom'
    }
  };

  activeProceduralChallenges.set(seedNum, session);

  return {
    session,
    worldPatch,
    scaffoldingGuidance: `Graine déterministe #${seedNum} active. Budget restant : ${budgetMeasuresMax} mesures. La rejouabilité est garantie en partageant ce numéro de graine.`
  };
}

/**
 * Registre global des sessions de défis procéduraux récents
 */
export const activeProceduralChallenges: Map<number, ProceduralChallengeSession> = new Map();
