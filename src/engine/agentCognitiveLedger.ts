// src/engine/agentCognitiveLedger.ts
// Système Cognitif d'Observations, Mémoire à Long Terme & Arbitrage Décisionnel des Agents IA
// Permet aux agents (SpatialAgent, GhostAgent, Playtester, Escoffier, Sven) de journaliser leurs observations,
// de formuler des recommandations d'améliorations et d'arbitrer les décisions d'intégration.

export type ObservationCategory = 
  | 'ergonomie' 
  | 'physique_spatiale' 
  | 'pedagogie' 
  | 'securite_procedure' 
  | 'gameplay_design';

export type ObservationSeverity = 'info' | 'notable' | 'critique';

export interface AgentObservation {
  id: string;
  timestamp: number;
  agentId: string;
  agentName: string;
  experienceId?: string;
  experienceTitle?: string;
  category: ObservationCategory;
  severity: ObservationSeverity;
  observation: string;
  evidence: {
    durationMs?: number;
    targetEntityId?: string;
    targetEntityName?: string;
    errorCount?: number;
    hesitationSeconds?: number;
    spatialDistance?: number;
    contextNotes?: string;
  };
  suggestedImprovement?: AgentImprovementProposal;
  arbitration?: AgentDecisionArbitration;
}

export type IntegrationTiming = 
  | 'immediate'       // Hot-patch en direct dans la scène active
  | 'next_session'    // Au prochain lancement / cycle adaptatif E2
  | 'major_milestone' // Prochaine version majeure (Milestone V3)
  | 'conditional_3x'; // Conditionnel (après 3 récurrences statistiques)

export type ArbitrationDecision = 
  | 'approved'         // Accepté pour intégration
  | 'rejected'         // Rejeté avec motif
  | 'pending_samples'  // En attente d'échantillons supplémentaires
  | 'integrated';      // Déjà appliqué dans le monde

export interface AgentImprovementProposal {
  id: string;
  observationId: string;
  title: string;
  description: string;
  targetComponent: '3d_scene' | 'guidage_vocal' | 'causal_rule' | 'ui_overlay' | 'kinematics' | 'physique_spatiale';
  expectedImpact: string;
  confidenceScore: number; // 0.0 à 1.0
  patchPayload?: any;
}

export interface AgentDecisionArbitration {
  id: string;
  observationId: string;
  decision: ArbitrationDecision;
  timing: IntegrationTiming;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  rationale: string;
  evaluatedAt: number;
  evaluatedBy: string; // ex: "Méta-Contrôleur Bayésien", "Agent Spatial", "Superviseur Humain"
  appliedAt?: number;
}

export interface CognitiveLedgerSummary {
  totalObservations: number;
  byCategory: Record<ObservationCategory, number>;
  bySeverity: Record<ObservationSeverity, number>;
  totalDecisions: number;
  approvedCount: number;
  integratedCount: number;
  pendingCount: number;
  rejectedCount: number;
  approvalRatePercent: number;
}

const STORAGE_KEY = 'worldpilot_agent_cognitive_ledger';

/**
 * Crée les observations initiales de référence issues des audits d'expériences
 */
export function createDefaultAgentObservations(): AgentObservation[] {
  return [
    {
      id: 'obs-ikea-dowels-align',
      timestamp: Date.now() - 120000,
      agentId: 'agent-sven-ikea',
      agentName: 'Sven (Maître Formateur IKEA)',
      experienceId: 'cert_ikea_furniture_assembly',
      experienceTitle: 'Montage Meuble IKEA : Étagère & Fixation Anti-Basculement',
      category: 'ergonomie',
      severity: 'notable',
      observation: "L'apprenant passe 11.4s à aligner les tourillons en bois sans repère visuel immédiat entre le montant et la traverse.",
      evidence: {
        hesitationSeconds: 11.4,
        targetEntityId: 'ikea_dowel_pack',
        targetEntityName: 'Tourillons en bois hêtre',
        contextNotes: 'Risque de forçage mécanique et d’éclatement du panneau de particules aggloméré.'
      },
      suggestedImprovement: {
        id: 'imp-ikea-dowels-halo',
        observationId: 'obs-ikea-dowels-align',
        title: 'Halo holographique de guidage d’insertion des tourillons',
        description: 'Afficher une silhouette magnétique cyan pulsante sur les 4 trous récepteurs pour guider l’enfoncement droit à 90°.',
        targetComponent: '3d_scene',
        expectedImpact: 'Réduction de 70% de l’hésitation et zéro risque de casse lors de l’assemblage.',
        confidenceScore: 0.94
      },
      arbitration: {
        id: 'dec-ikea-dowels-halo',
        observationId: 'obs-ikea-dowels-align',
        decision: 'approved',
        timing: 'immediate',
        priority: 'P0',
        rationale: 'Impact ergonomique direct et prévention des défauts de montage irréversibles chez les primo-monteurs.',
        evaluatedAt: Date.now() - 60000,
        evaluatedBy: 'Méta-Contrôleur Bayésien WorldPilot'
      }
    },
    {
      id: 'obs-gamedev-jump-distance',
      timestamp: Date.now() - 240000,
      agentId: 'agent-marcus-gamedev',
      agentName: 'Marcus (Lead Game Designer)',
      experienceId: 'cert_gamedev_level_studio',
      experienceTitle: 'Game Design Lab : Édition de Niveau 3D & Playtest Autonome',
      category: 'gameplay_design',
      severity: 'critique',
      observation: 'L’écart entre la plateforme flottante #2 et #3 est de 3.6m. Avec la gravité standard (-9.81 m/s²), le saut est impossible sans boost.',
      evidence: {
        spatialDistance: 3.6,
        targetEntityId: 'gamedev_platform_2',
        targetEntityName: 'Plateforme flottante Néon',
        errorCount: 3,
        contextNotes: 'Le playtester IA a chuté 3 fois d’affilée lors de la simulation de trajectoire kinématique.'
      },
      suggestedImprovement: {
        id: 'imp-gamedev-rebalance-gap',
        observationId: 'obs-gamedev-jump-distance',
        title: 'Calibrage automatique de l’espacement de saut à 2.6m max',
        description: 'Ajuster automatiquement les coordonnées Z de la plateforme #3 à 2.55m de la précédente et ajouter un pad de propulsion néon.',
        targetComponent: 'physique_spatiale',
        expectedImpact: '100% de taux de franchissement pour les sauts normaux, expérience fluide et gratification du joueur.',
        confidenceScore: 0.98
      },
      arbitration: {
        id: 'dec-gamedev-rebalance-gap',
        observationId: 'obs-gamedev-jump-distance',
        decision: 'integrated',
        timing: 'immediate',
        priority: 'P0',
        rationale: 'Bloquant majeur de gameplay. La distance maximale franchissable sans dash ne doit jamais excéder 2.8m.',
        evaluatedAt: Date.now() - 180000,
        evaluatedBy: 'Playtester IA & Méta-Contrôleur',
        appliedAt: Date.now() - 175000
      }
    },
    {
      id: 'obs-cookies-oven-preheat',
      timestamp: Date.now() - 360000,
      agentId: 'agent-auguste-chef',
      agentName: 'Chef Auguste (Masterclass Escoffier)',
      experienceId: 'cert_baking_cookies_masterclass',
      experienceTitle: 'Masterclass Pâtisserie : Cookies Crousti-Fondants 70% Cacao',
      category: 'securite_procedure',
      severity: 'notable',
      observation: 'Tentative d’enfournement de la plaque alors que la sonde thermique du four affichait 135°C au lieu des 180°C requis.',
      evidence: {
        hesitationSeconds: 4.2,
        targetEntityId: 'wp-plaque-cookies',
        targetEntityName: 'Plaque de cookies façonnés',
        contextNotes: 'Un enfournement sous-température provoque l’étalement excessif du beurre et des cookies plats et gras.'
      },
      suggestedImprovement: {
        id: 'imp-cookies-interlock',
        observationId: 'obs-cookies-oven-preheat',
        title: 'Verrouillage causal thermique avant enfournement',
        description: 'Ajouter un invariant formel interdisant l’aimantage de la plaque tant que le thermostat n’a pas émis le carillon de 180°C.',
        targetComponent: 'causal_rule',
        expectedImpact: 'Respect rigoureux des règles de la chimie pâtissière et obtention garantie de la dorure caramel.',
        confidenceScore: 0.91
      },
      arbitration: {
        id: 'dec-cookies-interlock',
        observationId: 'obs-cookies-oven-preheat',
        decision: 'approved',
        timing: 'next_session',
        priority: 'P1',
        rationale: 'Pédagogiquement indispensable pour ancrer la rigueur thermique chez les apprentis pâtissiers.',
        evaluatedAt: Date.now() - 300000,
        evaluatedBy: 'Chef Auguste'
      }
    },
    {
      id: 'obs-auto-battery-terminal-polarity',
      timestamp: Date.now() - 480000,
      agentId: 'agent-nova-engineer',
      agentName: 'Ingénieure Nova (Atelier Automobile)',
      experienceId: 'cert_auto_battery_12v',
      experienceTitle: 'Remplacement de Batterie Automobile 12V AGM',
      category: 'securite_procedure',
      severity: 'notable',
      observation: 'Hésitation sur l’ordre de déconnexion des cosses (la borne négative noire doit toujours être déconnectée en premier pour éviter les arcs).',
      evidence: {
        hesitationSeconds: 8.5,
        targetEntityId: 'wp-batterie-automobile',
        targetEntityName: 'Câbles de batterie automobile',
        errorCount: 1,
        contextNotes: 'Norme AFNOR / SAE J537 de sécurité atelier.'
      },
      suggestedImprovement: {
        id: 'imp-battery-color-pulse',
        observationId: 'obs-auto-battery-terminal-polarity',
        title: 'Guidage séquentiel par clignotement des cosses',
        description: 'Faire clignoter la cosse (-) noire en premier lors de la dépose, et la cosse (+) rouge en premier lors de la repose.',
        targetComponent: '3d_scene',
        expectedImpact: 'Élimination totale du risque d’arc électrique avec le châssis métallique.',
        confidenceScore: 0.96
      },
      arbitration: {
        id: 'dec-battery-color-pulse',
        observationId: 'obs-auto-battery-terminal-polarity',
        decision: 'approved',
        timing: 'immediate',
        priority: 'P0',
        rationale: 'Norme de sécurité industrielle non négociable.',
        evaluatedAt: Date.now() - 420000,
        evaluatedBy: 'Ingénieure Nova'
      }
    }
  ];
}

/**
 * Récupère le grand livre d'observations depuis le stockage local ou charge les données initiales
 */
export function loadAgentCognitiveLedger(): AgentObservation[] {
  if (typeof window === 'undefined') return createDefaultAgentObservations();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const defaults = createDefaultAgentObservations();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
      return defaults;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : createDefaultAgentObservations();
  } catch (_) {
    return createDefaultAgentObservations();
  }
}

/**
 * Sauvegarde le grand livre d'observations
 */
export function saveAgentCognitiveLedger(observations: AgentObservation[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(observations));
  } catch (_) {}
}

/**
 * Moteur d'arbitrage autonome bayésien pour décider de l'intégration et du timing
 */
export function autoArbitrateObservation(obs: AgentObservation): AgentDecisionArbitration {
  let decision: ArbitrationDecision = 'pending_samples';
  let timing: IntegrationTiming = 'next_session';
  let priority: 'P0' | 'P1' | 'P2' | 'P3' = 'P2';
  let rationale = '';

  const conf = obs.suggestedImprovement?.confidenceScore ?? 0.75;
  const isSecurity = obs.category === 'securite_procedure';
  const isGameplayBlocker = obs.category === 'gameplay_design' && obs.severity === 'critique';

  if (isSecurity || isGameplayBlocker) {
    decision = 'approved';
    timing = 'immediate';
    priority = 'P0';
    rationale = isSecurity 
      ? "Priorité P0 : Sécurité procédurale critique. L'erreur humaine présente un risque physique ou matériel inacceptable."
      : "Priorité P0 : Bloquant d'expérience critique. Le playtest montre une impossibilité physique de progression.";
  } else if (conf >= 0.90 && (obs.severity === 'notable' || obs.severity === 'critique')) {
    decision = 'approved';
    timing = obs.evidence.hesitationSeconds && obs.evidence.hesitationSeconds > 10 ? 'immediate' : 'next_session';
    priority = 'P1';
    rationale = `Score de confiance bayésien élevé (${Math.round(conf * 100)}%). Amélioration nette de l’ergonomie ou de l’apprentissage.`;
  } else if (conf >= 0.70) {
    decision = 'approved';
    timing = 'conditional_3x';
    priority = 'P2';
    rationale = "Amélioration validée sous condition de confirmation sur 3 sessions d'utilisateurs distincts.";
  } else {
    decision = 'pending_samples';
    timing = 'major_milestone';
    priority = 'P3';
    rationale = "Données encore parcellaires. En attente de signaux comportementaux complémentaires lors des prochains playtests.";
  }

  return {
    id: `dec-${obs.id}-${Date.now()}`,
    observationId: obs.id,
    decision,
    timing,
    priority,
    rationale,
    evaluatedAt: Date.now(),
    evaluatedBy: 'Méta-Contrôleur Bayésien Autonome'
  };
}

/**
 * Calcule les métriques globales du grand livre
 */
export function computeLedgerSummary(observations: AgentObservation[]): CognitiveLedgerSummary {
  const summary: CognitiveLedgerSummary = {
    totalObservations: observations.length,
    byCategory: {
      ergonomie: 0,
      physique_spatiale: 0,
      pedagogie: 0,
      securite_procedure: 0,
      gameplay_design: 0
    },
    bySeverity: {
      info: 0,
      notable: 0,
      critique: 0
    },
    totalDecisions: 0,
    approvedCount: 0,
    integratedCount: 0,
    pendingCount: 0,
    rejectedCount: 0,
    approvalRatePercent: 0
  };

  observations.forEach(o => {
    summary.byCategory[o.category] = (summary.byCategory[o.category] || 0) + 1;
    summary.bySeverity[o.severity] = (summary.bySeverity[o.severity] || 0) + 1;

    if (o.arbitration) {
      summary.totalDecisions++;
      if (o.arbitration.decision === 'approved') summary.approvedCount++;
      else if (o.arbitration.decision === 'integrated') summary.integratedCount++;
      else if (o.arbitration.decision === 'pending_samples') summary.pendingCount++;
      else if (o.arbitration.decision === 'rejected') summary.rejectedCount++;
    }
  });

  const totalDecided = summary.approvedCount + summary.integratedCount + summary.rejectedCount;
  summary.approvalRatePercent = totalDecided > 0
    ? Math.round(((summary.approvedCount + summary.integratedCount) / totalDecided) * 100)
    : 100;

  return summary;
}
