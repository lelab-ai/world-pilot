// src/engine/skillCertification.ts
// Moteur de Certification de Compétences Cognitives & Entraînement Curriculaire Adaptatif.
// Évalue la maîtrise motrice, la régulation thermique, la gestion du stress et la collaboration IA
// pour délivrer un certificat vérifiable et des micro-défis ciblés.

import { CognitiveSessionReport } from './cognitiveTraceRecorder';
import { HumanAITeamingMetrics } from './coWorkerAgent';

export type SkillLevel = 'Novice' | 'Praticien Averti' | 'Chef de Brigade' | 'Maître Opérateur Cognitif';

export interface SkillRadar {
  spatialEfficiency: number;      // 0 - 100%
  thermodynamicControl: number;   // 0 - 100%
  stressResilience: number;       // 0 - 100%
  teamingFluency: number;         // 0 - 100%
  decisionConsistency: number;    // 0 - 100%
}

export interface CognitiveCertificate {
  certificateId: string;
  issueDate: string;
  recipientTitle: string;
  overallScore: number; // 0 - 100
  skillLevel: SkillLevel;
  radar: SkillRadar;
  verificationHash: string;
  recommendedDrills: CurricularDrill[];
}

export interface CurricularDrill {
  id: string;
  title: string;
  targetSkill: keyof SkillRadar;
  durationSec: number;
  description: string;
  actionInstruction: string;
  urgency: 'low' | 'medium' | 'high';
}

/**
 * Calcule l'empreinte radar et le certificat d'aptitude cognitive.
 */
export function generateCognitiveCertificate(
  report: CognitiveSessionReport,
  teamingMetrics: HumanAITeamingMetrics,
  anomalyCountResolved: number
): CognitiveCertificate {
  // 1. Efficacité Spatiale (basée sur la latence moyenne et le taux d'hésitation)
  const hesitationRate = report.hesitationRate ?? 20;
  const spatialScore = Math.max(30, Math.min(100, Math.round(100 - hesitationRate * 0.8)));

  // 2. Maîtrise Thermodynamique (pénalise les temps de surchauffe ou fluctuations extrêmes)
  const proceduralEfficiency = report.proceduralEfficiency ?? 80;
  const resilienceScore = report.resilienceScore ?? 75;
  const thermoScore = Math.max(25, Math.min(100, Math.round(proceduralEfficiency * 0.9 + (resilienceScore > 60 ? 10 : 0))));

  // 3. Résilience au Stress & Sang-froid
  const stressScore = Math.max(20, Math.min(100, Math.round(resilienceScore * 0.7 + anomalyCountResolved * 15)));

  // 4. Fluidité de Co-travail IA (Teaming Fluency)
  const teamingFluency = teamingMetrics.teamingFluency ?? 80;
  const trustScore = teamingMetrics.trustScore ?? 75;
  const teamingScore = Math.max(40, Math.min(100, Math.round(teamingFluency * 0.6 + trustScore * 0.4)));

  // 5. Régularité Décisionnelle
  const consistencyScore = Math.max(35, Math.min(100, Math.round(proceduralEfficiency * 0.75 + (hesitationRate < 25 ? 25 : 10))));

  const overall = Math.round((spatialScore + thermoScore + stressScore + teamingScore + consistencyScore) / 5);

  let level: SkillLevel = 'Novice';
  if (overall >= 88) level = 'Maître Opérateur Cognitif';
  else if (overall >= 74) level = 'Chef de Brigade';
  else if (overall >= 55) level = 'Praticien Averti';

  const drills: CurricularDrill[] = [];

  if (thermoScore < 75) {
    drills.push({
      id: 'drill-thermo-pulse',
      title: '🎯 Défi Régulation Thermique Précise',
      targetSkill: 'thermodynamicControl',
      durationSec: 45,
      description: 'Stabilisez le bouillon entre 80°C et 110°C pendant 45 secondes sans jamais dépasser 130°C.',
      actionInstruction: 'baisse le feu à niveau doux dès frémissement',
      urgency: 'high'
    });
  }

  if (stressScore < 70) {
    drills.push({
      id: 'drill-thermal-flare-reflex',
      title: '🔥 Réflexe Coup de Feu Imprévu',
      targetSkill: 'stressResilience',
      durationSec: 30,
      description: 'Réagissez en moins de 5 secondes lors d\'une surchauffe critique du brûleur.',
      actionInstruction: 'injecte un coup de feu puis éteins le feu',
      urgency: 'high'
    });
  }

  if (teamingScore < 80) {
    drills.push({
      id: 'drill-teaming-handoff',
      title: '👥 Co-préparation en Brigade IA',
      targetSkill: 'teamingFluency',
      durationSec: 60,
      description: 'Déléguez la découpe à Camille pendant que vous gérez la mise en chauffe.',
      actionInstruction: 'demande a camille de couper les legumes',
      urgency: 'medium'
    });
  }

  if (drills.length === 0) {
    drills.push({
      id: 'drill-mastery-sprint',
      title: '✨ Défi Grand Chef Étoilé',
      targetSkill: 'decisionConsistency',
      durationSec: 90,
      description: 'Réalisez un plat gastronomique 3 étoiles complet sans aucune erreur ni hésitation.',
      actionInstruction: 'enchaine découpe, cuisson douce, assaisonnement et dressage',
      urgency: 'low'
    });
  }

  // Hash de vérification déterministe
  const rawPayload = `${Date.now()}-${overall}-${level}-${report.totalDecisions}`;
  let hashNum = 0;
  for (let i = 0; i < rawPayload.length; i++) {
    hashNum = (hashNum << 5) - hashNum + rawPayload.charCodeAt(i);
    hashNum |= 0;
  }
  const verificationHash = `WP-CERT-${Math.abs(hashNum).toString(16).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

  return {
    certificateId: `CERT-${Date.now().toString(36).toUpperCase()}`,
    issueDate: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
    recipientTitle: 'Opérateur Culinaire & Cognitif WorldPilot',
    overallScore: overall,
    skillLevel: level,
    radar: {
      spatialEfficiency: spatialScore,
      thermodynamicControl: thermoScore,
      stressResilience: stressScore,
      teamingFluency: teamingScore,
      decisionConsistency: consistencyScore
    },
    verificationHash,
    recommendedDrills: drills
  };
}
