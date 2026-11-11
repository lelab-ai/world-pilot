// src/engine/anomalyEngine.ts
// Moteur d'adaptation curriculaire dynamique, injection d'anomalies & stress-testing cognitif pour WorldPilot.
// Transforme la simulation en banc d'essai haute valeur en introduisant des événements imprévus
// et en mesurant l'indice de charge cognitive (Cognitive Load Index - CLI) et le sang-froid humain.

export type AnomalyType = 
  | 'thermal_flare'          // Coup de feu thermique soudain (brûleur à 210°C, risque de carbonisation)
  | 'seasoning_imbalance'    // Surchauffe aromatique ou excès de sel nécessitant compensation
  | 'time_crunch'            // Arrivée surprise d'un critique gastronomique (minuteur accéléré)
  | 'ingredient_spoilage'    // Légume paré non conforme nécessitant une recoupe d'urgence
  | 'seminar_av_glitch';     // Interférence de projection ou grésillement audio en séminaire

export interface SimulationAnomaly {
  id: string;
  type: AnomalyType;
  title: string;
  description: string;
  severity: 'mild' | 'moderate' | 'critical';
  timestamp: number;
  status: 'pending' | 'resolved' | 'failed';
  timeLimitSec: number;
  timeRemainingSec: number;
  recoveryCondition: string;
  suggestedAction: string;
  penaltyScore: number;
}

export const ANOMALY_PRESETS: Record<AnomalyType, {
  title: string;
  description: string;
  severity: 'mild' | 'moderate' | 'critical';
  timeLimitSec: number;
  recoveryCondition: string;
  suggestedAction: string;
  penaltyScore: number;
}> = {
  'thermal_flare': {
    title: '🔥 Coup de Feu Thermique Imprévu',
    description: 'Une saute de puissance du brûleur propulse la cocotte à 210°C ! Risque immédiat de carbonisation des sucs.',
    severity: 'critical',
    timeLimitSec: 15,
    recoveryCondition: 'Réduire l\'allure de chauffe au niveau 0 ou 1 pour redescendre sous 115°C.',
    suggestedAction: 'Baissez immédiatement le feu ou retirez la cocotte du brûleur.',
    penaltyScore: 20
  },
  'seasoning_imbalance': {
    title: '🧂 Déséquilibre Aromatique Excessif',
    description: 'Une pincée trop généreuse a saturé le bouillon en chlorure de sodium. Les papilles sont agressées.',
    severity: 'moderate',
    timeLimitSec: 25,
    recoveryCondition: 'Ajouter un filet d\'huile d\'olive ou un bouquet garni pour lier et adoucir la réduction.',
    suggestedAction: 'Versez de l\'huile d\'olive ou infusez des aromates pour rééquilibrer le profil.',
    penaltyScore: 12
  },
  'time_crunch': {
    title: '⏱️ Visite Surprise du Guide Gastronomique',
    description: 'L\'inspecteur s\'est assis en salle avec 10 minutes d\'avance ! Le dressage doit être finalisé d\'urgence.',
    severity: 'critical',
    timeLimitSec: 20,
    recoveryCondition: 'Dresser le plat sur assiette porcelaine et appliquer la garniture de finition sans délai.',
    suggestedAction: 'Activez le dressage et la finition tuile ou micro-pousses immédiatement.',
    penaltyScore: 18
  },
  'ingredient_spoilage': {
    title: '🥕 Émincé Hétérogène / Recoupe Requise',
    description: 'Un morceau de légume s\'est révélé trop épais pour cuire uniformément.',
    severity: 'mild',
    timeLimitSec: 30,
    recoveryCondition: 'Effectuer 2 découpes supplémentaires sur la planche à découper.',
    suggestedAction: 'Prenez le couteau de chef et découpez à nouveau un ingrédient sur la planche.',
    penaltyScore: 8
  },
  'seminar_av_glitch': {
    title: '📺 Grésillement Écran & Interférence Micro',
    description: 'Le tableau interactif affiche un bruit vidéo et le micro du facilitateur sature.',
    severity: 'moderate',
    timeLimitSec: 25,
    recoveryCondition: 'Recentrer la caméra sur le panneau ou réajuster le volume audio général.',
    suggestedAction: 'Activez la vue panneau [6] ou réglez le potentiomètre audio [M].',
    penaltyScore: 10
  }
};

/**
 * Instancie une nouvelle anomalie de stress-test dans la simulation.
 */
export function createAnomalyInstance(type: AnomalyType): SimulationAnomaly {
  const preset = ANOMALY_PRESETS[type];
  const id = `anomaly-${type}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  return {
    id,
    type,
    title: preset.title,
    description: preset.description,
    severity: preset.severity,
    timestamp: Date.now(),
    status: 'pending',
    timeLimitSec: preset.timeLimitSec,
    timeRemainingSec: preset.timeLimitSec,
    recoveryCondition: preset.recoveryCondition,
    suggestedAction: preset.suggestedAction,
    penaltyScore: preset.penaltyScore
  };
}

/**
 * Calcule l'indice de charge cognitive (Cognitive Load Index : 0 à 100%).
 * Reflète en temps réel la pression mentale du sujet :
 * - Taux d'hésitations récentes
 * - Rythme erratique (panic clicks vs freeze)
 * - Anomalies critiques actives non résolues
 * - Température hors tolérance
 */
export function calculateCognitiveLoadIndex(params: {
  hesitationRate: number; // 0 - 100
  averageLatencyMs: number;
  activeAnomaliesCount: number;
  cookingTemperature: number;
  resilienceScore: number;
}): { index: number; label: string; color: string; level: 'calm' | 'alert' | 'overload' } {
  const {
    hesitationRate,
    averageLatencyMs,
    activeAnomaliesCount,
    cookingTemperature,
    resilienceScore
  } = params;

  let score = 20; // Charge cognitive de base

  // Impact des anomalies actives
  score += activeAnomaliesCount * 25;

  // Impact de l'hésitation
  score += Math.round(hesitationRate * 0.35);

  // Impact du rythme précipité (< 800ms) ou paralysé (> 3500ms)
  if (averageLatencyMs < 800 && averageLatencyMs > 0) {
    score += 18; // Précipitation / stress temporel
  } else if (averageLatencyMs > 3500) {
    score += 15; // Confusion / saturation d'informations
  }

  // Impact du risque thermique
  if (cookingTemperature > 180) {
    score += 22;
  } else if (cookingTemperature > 130) {
    score += 10;
  }

  // Modération par la résilience acquise
  score -= Math.round((resilienceScore - 50) * 0.2);

  const clamped = Math.max(10, Math.min(100, score));

  if (clamped < 40) {
    return {
      index: clamped,
      label: 'Zone de Maîtrise & Calme (Flux Optimal)',
      color: '#10b981',
      level: 'calm'
    };
  } else if (clamped < 75) {
    return {
      index: clamped,
      label: 'Vigilance Active & Charge Soutenue',
      color: '#f59e0b',
      level: 'alert'
    };
  } else {
    return {
      index: clamped,
      label: 'Surcharge Cognitive & Gestion de Crise',
      color: '#ef4444',
      level: 'overload'
    };
  }
}

/**
 * Vérifie si une action contextuelle récente résout l'une des anomalies en cours.
 */
export function evaluateAnomalyResolution(
  anomaly: SimulationAnomaly,
  context: {
    cookingHeatLevel: number;
    cookingTemperature: number;
    seasoningSalt: number;
    seasoningOil: number;
    seasoningHerbs: number;
    isDishPlated: boolean;
    choppingCount: number;
    worldFlags?: Record<string, boolean>;
  }
): boolean {
  if (anomaly.status !== 'pending') return false;

  switch (anomaly.type) {
    case 'thermal_flare':
      // Résolu si le feu est coupé ou doux (<= 1) et que la température est redescendue sous 130°C
      return context.cookingHeatLevel <= 1 && context.cookingTemperature < 135;

    case 'seasoning_imbalance':
      // Résolu si de l'huile d'olive ou des herbes ont été ajoutées pour adoucir
      return context.seasoningOil >= 25 || context.seasoningHerbs >= 25;

    case 'time_crunch':
      // Résolu dès que le plat est dressé sur l'assiette
      return context.isDishPlated;

    case 'ingredient_spoilage':
      // Résolu si au moins 2 découpes ont été effectuées
      return context.choppingCount >= 2;

    case 'seminar_av_glitch':
      // Résolu si l'équipement AV ou un canal de secours a été réactivé dans les flags du monde
      return Boolean(
        context.worldFlags &&
        Object.entries(context.worldFlags).some(
          ([k, v]) =>
            Boolean(v) &&
            (k === 'presentation_active' ||
              k === 'av_backup_switched' ||
              k === 'projector_restarted' ||
              k.endsWith('_prop_ready') ||
              k.endsWith('_brief_read'))
        )
      );

    default:
      return false;
  }
}
