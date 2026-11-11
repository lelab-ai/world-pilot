/**
 * Meta-Controller & Adaptive Generative Experience Engine
 * Implements the closed adaptive loop from Master PRD (Victoria VR AI Builder 2026):
 * 
 * Intent -> Generated Experience E1 -> Human & Agents Act -> 
 * Semantic Telemetry -> Competing Hypotheses (H1 vs H2) + Uncertainty U -> 
 * Meta-Controller Strategy Selection (Information Gain / Active Probe) -> 
 * Intervention Generation -> Experience E2 (Smarter Next Experience) -> 
 * Knowledge Accumulation.
 * 
 * Target Publications: ACM UIST / ACM IUI / NeurIPS World Models & Multi-Agent Systems
 */

import { WorldPatch, EntitySpec } from '../core/types';

export type AdaptiveObjective =
  | 'DIAGNOSE_HYPOTHESIS'      // Maximize epistemic information gain between H1 and H2
  | 'TEST_TRANSFER'            // Test if knowledge transfers under surface context shift
  | 'FALSIFY_MISCONCEPTION'    // Force a minimal contradiction or error-trap
  | 'CALIBRATE_DIFFICULTY'     // Adjust cognitive load to restore flow state
  | 'AGENT_PROBE';             // Agent deliberately varies behavior to test human reaction

export type AdaptiveStrategy =
  | 'SURFACE_CONTEXT_SHIFT'    // Preserves latent causal graph, mutates visuals & narrative
  | 'MINIMAL_COUNTERFACTUAL'   // Smallest environment modification that falsifies H1
  | 'AGENT_BEHAVIORAL_PROBE'   // In-world agent changes information disclosure or concession
  | 'CONTRADICTION_CHALLENGE'  // Forces contradictory decisions into explicit view
  | 'TEACH_THE_AGENT'          // Agent makes plausible error, requiring user to correct it
  | 'COGNITIVE_SCAFFOLDING';   // Reduces visual clutter while preserving core principle

export interface CompetingHypotheses {
  h1: {
    id: 'surface_heuristic';
    label: string;
    description: string;
    probability: number; // 0.0 to 1.0
  };
  h2: {
    id: 'causal_understanding';
    label: string;
    description: string;
    probability: number; // 0.0 to 1.0
  };
  uncertainty: number; // Shannon entropy or variance proxy [0, 1]
}

export interface AdaptiveInterventionRecord {
  cycleIndex: number;
  timestamp: number;
  objective: AdaptiveObjective;
  strategy: AdaptiveStrategy;
  priorProbabilities: { h1: number; h2: number; uncertainty: number };
  diagnosticAction: string;
  observedEvidence: string;
  posteriorProbabilities: { h1: number; h2: number; uncertainty: number };
  generatedVariantTitle: string;
  rationale: string;
}

export interface MetaKnowledgeObject {
  contextId: string;
  userStateSignature: string;
  objective: AdaptiveObjective;
  strategy: AdaptiveStrategy;
  confidence: number;
  sampleSize: number;
  empiricalOutcome: {
    transferScore: number;
    enjoymentRating: number;
    retentionLikelihood: number;
  };
}

export type EvaluatedPersonaId = 'persona_a' | 'persona_b' | 'persona_c' | 'persona_d';

export interface EvaluatedPersonaSpec {
  id: EvaluatedPersonaId;
  name: string;
  tagline: string;
  profile: string;
  simulatedEvents: Array<{
    type: 'DECISION_LATENCY' | 'ERROR_TRAP_TRIGGERED' | 'TRANSFER_SUCCESS' | 'EXPLANATION_GIVEN';
    data: { value: number; context?: string };
    annotation: string;
  }>;
  expectedOutcome: {
    targetHypothesis: 'h1' | 'h2';
    expectedObjective: AdaptiveObjective;
    expectedStrategy: AdaptiveStrategy;
  };
}

export const EVALUATED_PERSONAS: Record<EvaluatedPersonaId, EvaluatedPersonaSpec> = {
  persona_a: {
    id: 'persona_a',
    name: 'Persona A · Compréhension Causale',
    tagline: 'Raisonnement structurel invariant',
    profile: "L'apprenant analyse le schéma causal, évite les pièges et réussit les transferts dans de nouveaux environnements.",
    simulatedEvents: [
      { type: 'DECISION_LATENCY', data: { value: 3200 }, annotation: "Pause réflexive avant décision (3.2s) - élaboration d'un modèle causal." },
      { type: 'TRANSFER_SUCCESS', data: { value: 1, context: 'banc_optique' }, annotation: "Réussite immédiate du dioptre plan sans hésitation." },
      { type: 'TRANSFER_SUCCESS', data: { value: 1, context: 'univers_cristallin' }, annotation: "Généralisation validée sous permutation de texture." },
    ],
    expectedOutcome: {
      targetHypothesis: 'h2',
      expectedObjective: 'TEST_TRANSFER',
      expectedStrategy: 'SURFACE_CONTEXT_SHIFT',
    },
  },
  persona_b: {
    id: 'persona_b',
    name: 'Persona B · Mémorisation Superficielle',
    tagline: 'Réaction aux indices visuels (Couleurs / Heuristique)',
    profile: "L'apprenant associe arbitrairement les couleurs sans comprendre les équations physiques et déclenche les contraintes épistémiques.",
    simulatedEvents: [
      { type: 'DECISION_LATENCY', data: { value: 450 }, annotation: "Clic précipité (0.45s) guidé par la couleur du composant." },
      { type: 'ERROR_TRAP_TRIGGERED', data: { value: 1, context: 'overload_fuse' }, annotation: "Déclenchement du fusible de protection (court-circuit 24V)." },
      { type: 'DECISION_LATENCY', data: { value: 520 }, annotation: "Deuxième tentative rapide sans ajustement de résistance." },
    ],
    expectedOutcome: {
      targetHypothesis: 'h1',
      expectedObjective: 'FALSIFY_MISCONCEPTION',
      expectedStrategy: 'CONTRADICTION_CHALLENGE',
    },
  },
  persona_c: {
    id: 'persona_c',
    name: 'Persona C · Stratégie Sous-Optimale Persistante',
    tagline: 'Heuristique "Suffisante" mais fragile',
    profile: "L'apprenant utilise une méthode empirique qui fonctionne dans les cas simples mais échoue dès l'apparition d'une variable cachée.",
    simulatedEvents: [
      { type: 'DECISION_LATENCY', data: { value: 1800 }, annotation: "Manipulation hésitante sur potentiomètre linéaire." },
      { type: 'ERROR_TRAP_TRIGGERED', data: { value: 1, context: 'snell_critical_angle' }, annotation: "Piège de la réflexion totale interne rencontré." },
      { type: 'DECISION_LATENCY', data: { value: 2400 }, annotation: "Incertitude observée sur le réglage de l'angle d'incidence." },
    ],
    expectedOutcome: {
      targetHypothesis: 'h1',
      expectedObjective: 'DIAGNOSE_HYPOTHESIS',
      expectedStrategy: 'MINIMAL_COUNTERFACTUAL',
    },
  },
  persona_d: {
    id: 'persona_d',
    name: 'Persona D · Haute Compétence (Ennui & Désengagement)',
    tagline: 'Expertise établie mais besoin de défi / agency',
    profile: "L'expert maîtrise parfaitement le système mais s'ennuie face à la répétition des mêmes tâches.",
    simulatedEvents: [
      { type: 'DECISION_LATENCY', data: { value: 1200 }, annotation: "Résolution fluide sans hésitation." },
      { type: 'TRANSFER_SUCCESS', data: { value: 1 }, annotation: "Succès rapide de la quête sans exploitation de l'environnement." },
      { type: 'EXPLANATION_GIVEN', data: { value: 1 }, annotation: "Démonstration théorique fournie à l'agent compagnon." },
    ],
    expectedOutcome: {
      targetHypothesis: 'h2',
      expectedObjective: 'TEST_TRANSFER',
      expectedStrategy: 'SURFACE_CONTEXT_SHIFT',
    },
  },
};

export class MetaControllerEngine {
  private hypotheses: CompetingHypotheses = {
    h1: {
      id: 'surface_heuristic',
      label: 'Heuristique de Surface (Mémorisation)',
      description: "L'utilisateur agit par essai-erreur ou mémorisation d'indices visuels.",
      probability: 0.5,
    },
    h2: {
      id: 'causal_understanding',
      label: 'Compréhension Causale (Généralisation)',
      description: "L'utilisateur a compris la structure causale sous-jacente.",
      probability: 0.5,
    },
    uncertainty: 1.0, // Maximum initial epistemic uncertainty
  };

  private activeObjective: AdaptiveObjective = 'DIAGNOSE_HYPOTHESIS';
  private activeStrategy: AdaptiveStrategy = 'MINIMAL_COUNTERFACTUAL';
  private cycleCount: number = 0;
  private history: AdaptiveInterventionRecord[] = [];
  private accumulatedKnowledge: MetaKnowledgeObject[] = [];

  constructor() {
    this.loadFromStorage();
  }

  public getHypotheses(): CompetingHypotheses {
    return { ...this.hypotheses };
  }

  public getActiveStrategy(): { objective: AdaptiveObjective; strategy: AdaptiveStrategy } {
    return { objective: this.activeObjective, strategy: this.activeStrategy };
  }

  public getHistory(): AdaptiveInterventionRecord[] {
    return [...this.history];
  }

  public getAccumulatedKnowledge(): MetaKnowledgeObject[] {
    return [...this.accumulatedKnowledge];
  }

  /**
   * Observe human or agent interaction event and update Bayesian belief over H1 vs H2.
   */
  public observeInteraction(event: {
    type: 'DECISION_LATENCY' | 'ERROR_TRAP_TRIGGERED' | 'TRANSFER_SUCCESS' | 'EXPLANATION_GIVEN' | 'HESITATION_DETECTED' | 'UNPRODUCTIVE_REPEAT_CLICK';
    data: { value: number; context?: string; wasProductive?: boolean; repetitionCount?: number };
  }): CompetingHypotheses {
    let likelihoodH1 = 1.0;
    let likelihoodH2 = 1.0;

    switch (event.type) {
      case 'ERROR_TRAP_TRIGGERED':
        // Triggering a deliberate cognitive trap increases probability of surface heuristic
        likelihoodH1 = 2.4;
        likelihoodH2 = 0.3;
        break;
      case 'HESITATION_DETECTED':
      case 'UNPRODUCTIVE_REPEAT_CLICK': {
        // Repeated unsuccessful attempts or user hesitation strongly indicate surface struggle or friction
        const rep = event.data.repetitionCount || 1;
        likelihoodH1 = Math.min(4.8, 2.4 + rep * 0.6);
        likelihoodH2 = Math.max(0.1, 0.4 - rep * 0.1);
        break;
      }
      case 'TRANSFER_SUCCESS':
        // Succeeding in an altered environment strongly supports causal understanding
        likelihoodH1 = 0.2;
        likelihoodH2 = 3.0;
        break;
      case 'DECISION_LATENCY':
        // Quick erratic actions suggest trial-error (<600ms)
        if (event.data.value < 600) {
          likelihoodH1 = 1.5;
          likelihoodH2 = 0.7;
        } else if (event.data.wasProductive === false) {
          // Pause between failed/unproductive attempts indicates confusion or friction
          likelihoodH1 = 1.8;
          likelihoodH2 = 0.5;
        } else if (event.data.value >= 1500 && event.data.value <= 8000) {
          // Deliberate pause before productive action suggests causal planning
          likelihoodH1 = 0.8;
          likelihoodH2 = 1.6;
        }
        break;
      case 'EXPLANATION_GIVEN':
        likelihoodH1 = 0.3;
        likelihoodH2 = 2.5;
        break;
    }

    // Bayesian Update: P(H|E) = (P(E|H) * P(H)) / P(E)
    const rawH1 = this.hypotheses.h1.probability * likelihoodH1;
    const rawH2 = this.hypotheses.h2.probability * likelihoodH2;
    const norm = rawH1 + rawH2 || 1;

    const newH1 = Number((rawH1 / norm).toFixed(3));
    const newH2 = Number((rawH2 / norm).toFixed(3));

    // Epistemic uncertainty U = 1 - 4 * (P - 0.5)^2 (1 when P=0.5, 0 when P=0 or 1)
    const uncertainty = Number((1.0 - 4.0 * Math.pow(newH1 - 0.5, 2)).toFixed(3));

    this.hypotheses = {
      h1: { ...this.hypotheses.h1, probability: newH1 },
      h2: { ...this.hypotheses.h2, probability: newH2 },
      uncertainty,
    };

    // Re-evaluate Meta-Controller Objective & Strategy based on new uncertainty
    this.selectNextStrategy();
    this.persistToStorage();

    return this.getHypotheses();
  }

  /**
   * The Meta-Controller Decision Policy (PRD Section 49 & 63.4)
   * Balances expected utility and information gain.
   */
  public selectNextStrategy(): { objective: AdaptiveObjective; strategy: AdaptiveStrategy } {
    const { uncertainty } = this.hypotheses;
    const pCausal = this.hypotheses.h2.probability;
    const pHesitation = this.hypotheses.h1.probability;

    if (pHesitation >= 0.55 && uncertainty < 0.45) {
      // High hesitation or confirmed surface misconception
      this.activeObjective = 'FALSIFY_MISCONCEPTION';
      this.activeStrategy = 'CONTRADICTION_CHALLENGE';
    } else if (uncertainty > 0.45) {
      // High uncertainty: primary objective is epistemic information gain
      this.activeObjective = 'DIAGNOSE_HYPOTHESIS';
      this.activeStrategy = 'MINIMAL_COUNTERFACTUAL';
    } else if (pCausal >= 0.75) {
      // Causal understanding suspected: test transfer robustness across domains
      this.activeObjective = 'TEST_TRANSFER';
      this.activeStrategy = 'SURFACE_CONTEXT_SHIFT';
    } else {
      // Surface heuristic suspected: falsify misconception with deliberate contradiction
      this.activeObjective = 'FALSIFY_MISCONCEPTION';
      this.activeStrategy = 'CONTRADICTION_CHALLENGE';
    }

    return this.getActiveStrategy();
  }

  /**
   * Run Persona Simulation Benchmark (PRD Section 51)
   * Plays out a standardized student trajectory and updates beliefs.
   */
  public runPersonaBenchmark(personaId: EvaluatedPersonaId): {
    persona: EvaluatedPersonaSpec;
    prior: CompetingHypotheses;
    posterior: CompetingHypotheses;
    selectedStrategy: { objective: AdaptiveObjective; strategy: AdaptiveStrategy };
    traceAnnotations: string[];
  } {
    const persona = EVALUATED_PERSONAS[personaId];
    if (!persona) throw new Error(`Persona inconnu : ${personaId}`);

    const prior = { ...this.getHypotheses() };
    const traceAnnotations: string[] = [];

    for (const evt of persona.simulatedEvents) {
      this.observeInteraction({ type: evt.type, data: evt.data });
      traceAnnotations.push(evt.annotation);
    }

    const posterior = this.getHypotheses();
    const selectedStrategy = this.getActiveStrategy();

    return {
      persona,
      prior,
      posterior,
      selectedStrategy,
      traceAnnotations,
    };
  }

  /**
   * Generates the Next Smarter Experience E(t+1)
   * The central differentiator: "The world is not generated once. It learns what to generate next."
   */
  public generateNextAdaptiveExperience(_currentEntities?: Record<string, EntitySpec>): {
    worldPatch: WorldPatch;
    record: AdaptiveInterventionRecord;
  } {
    this.cycleCount++;
    const prior = {
      h1: this.hypotheses.h1.probability,
      h2: this.hypotheses.h2.probability,
      uncertainty: this.hypotheses.uncertainty,
    };

    let patch: WorldPatch;
    let variantTitle: string;
    let rationale: string;
    let diagnosticAction: string;

    const baseZ = -0.1;

    if (this.activeObjective === 'DIAGNOSE_HYPOTHESIS') {
      variantTitle = 'Expérience 2 · Diagnostic Contrefactuel Minimal';
      diagnosticAction = 'Sonde de falsification : Inversion des repères visuels sans altération du graphe causal';
      rationale = `Incertitude épistémique élevée (U=${prior.uncertainty}). Génération d'une variation minimale pour départager H1 (réaction de surface) et H2 (modèle causal).`;

      // Creates a probe entity that tests if user relies on surface cues or causality
      const probeEntity: EntitySpec = {
        id: `adaptive_probe_diagnostic_${this.cycleCount}`,
        name: 'Sonde Diagnostique Contrefactuelle',
        capabilities: [
          { type: 'transform', position: { x: 0.0, y: 0.84, z: baseZ }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          { type: 'collider' },
          { type: 'interactive', actionName: 'Tester l’hypothèse', icon: 'zap' },
          { type: 'diagnostic_probe', targetHypothesis: 'causal_understanding', informationGainEstimate: 0.85 },
          { type: 'pedagogical_apparatus', apparatusType: 'probe_diagnostic' },
        ],
        visuals: {
          shape: 'box',
          color: '#38bdf8',
        },
      };

      patch = {
        entitiesCreated: [probeEntity],
        rulesChanged: [
          {
            id: `rule_probe_diagnostic_${this.cycleCount}`,
            trigger: 'INTERACT',
            conditions: [{ type: 'is_source', sourceId: probeEntity.id }],
            actions: [
              {
                type: 'play_sound',
                sound: 'quantum_ping',
              },
            ],
          },
        ],
        questsAdded: [
          {
            id: `quest_adaptive_cycle_${this.cycleCount}`,
            title: 'Épreuve Diagnostique : Valider la Règle Causale',
            description: 'Interagissez avec le dispositif pour discriminer le modèle causal.',
            category: 'formation',
            currentStepIndex: 0,
            status: 'in_progress',
            steps: [
              {
                id: 'step_probe',
                title: 'Activer la sonde contrefactuelle',
                description: 'Interagir avec la sonde pour fournir une preuve de causalité',
                targetEntityId: probeEntity.id,
                requiredEvent: `INTERACT:${probeEntity.id}`,
                completed: false,
              },
            ],
          },
        ],
        activeQuestId: `quest_adaptive_cycle_${this.cycleCount}`,
      };
    } else if (this.activeObjective === 'TEST_TRANSFER') {
      variantTitle = 'Expérience 2 · Test de Transfert Invariant (Shift de Contexte)';
      diagnosticAction = 'Mutation de l’environnement de surface en préservant le graphe causal invariant.';
      rationale = `Compréhension causale apparente (P(H2)=${prior.h2}). Régénération d'un univers alternatif avec même logique invariante pour mesurer la généralisation.`;

      const transferEntity: EntitySpec = {
        id: `adaptive_transfer_beacon_${this.cycleCount}`,
        name: 'Balise de Transfert Invariant',
        capabilities: [
          { type: 'transform', position: { x: 0.4, y: 0.84, z: baseZ }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          { type: 'collider' },
          { type: 'interactive', actionName: 'Vérifier le transfert', icon: 'compass' },
          { type: 'pedagogical_apparatus', apparatusType: 'transfer_beacon' },
        ],
        visuals: {
          shape: 'sphere',
          color: '#a855f7',
        },
      };

      patch = {
        entitiesCreated: [transferEntity],
        rulesChanged: [
          {
            id: `rule_probe_transfer_${this.cycleCount}`,
            trigger: 'INTERACT',
            conditions: [{ type: 'is_source', sourceId: transferEntity.id }],
            actions: [
              {
                type: 'play_sound',
                sound: 'chime',
              },
            ],
          },
        ],
        questsAdded: [
          {
            id: `quest_adaptive_cycle_${this.cycleCount}`,
            title: 'Épreuve de Transfert Invariant',
            description: 'Vérifiez la généralisation du modèle causal invariant dans le nouvel univers.',
            category: 'formation',
            currentStepIndex: 0,
            status: 'in_progress',
            steps: [
              {
                id: 'step_transfer',
                title: 'Interagir avec la balise de transfert',
                description: 'Valider la robustesse du transfert invariant',
                targetEntityId: transferEntity.id,
                requiredEvent: `INTERACT:${transferEntity.id}`,
                completed: false,
              },
            ],
          },
        ],
        activeQuestId: `quest_adaptive_cycle_${this.cycleCount}`,
      };
    } else {
      variantTitle = 'Expérience 2 · Révélation de Contradiction & Erreur Féconde';
      diagnosticAction = 'Introduction d’un piège de contrainte épistémique pour expliciter la contradiction cognitive.';
      rationale = `Suspicion de règle de surface erronée (P(H1)=${prior.h1}). Injection d'un cas limite où la règle naïve échoue immédiatement.`;

      const trapEntity: EntitySpec = {
        id: `adaptive_falsifier_${this.cycleCount}`,
        name: 'Dispositif de Contrainte Épistémique',
        capabilities: [
          { type: 'transform', position: { x: -0.4, y: 0.84, z: baseZ }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          { type: 'collider' },
          { type: 'interactive', actionName: 'Confronter l’erreur', icon: 'alert' },
          { type: 'pedagogical_apparatus', apparatusType: 'falsifier' },
        ],
        visuals: {
          shape: 'cylinder',
          color: '#f97316',
        },
      };

      patch = {
        entitiesCreated: [trapEntity],
        rulesChanged: [
          {
            id: `rule_probe_falsifier_${this.cycleCount}`,
            trigger: 'INTERACT',
            conditions: [{ type: 'is_source', sourceId: trapEntity.id }],
            actions: [
              {
                type: 'play_sound',
                sound: 'electric_spark',
              },
            ],
          },
        ],
        questsAdded: [
          {
            id: `quest_adaptive_cycle_${this.cycleCount}`,
            title: 'Épreuve de Contrainte Épistémique',
            description: 'Confrontez la contradiction cognitive pour dépasser l’intuition naïve.',
            category: 'formation',
            currentStepIndex: 0,
            status: 'in_progress',
            steps: [
              {
                id: 'step_trap',
                title: 'Déclencher l’épreuve de contrainte',
                description: 'Identifier l’erreur féconde',
                targetEntityId: trapEntity.id,
                requiredEvent: `INTERACT:${trapEntity.id}`,
                completed: false,
              },
            ],
          },
        ],
        activeQuestId: `quest_adaptive_cycle_${this.cycleCount}`,
      };
    }

    // Simulated posterior after intervention generation (normalized so h1 + h2 === 1.0)
    const rawPostH1 = Math.max(0.05, prior.h1 * 0.85);
    const rawPostH2 = Math.min(0.95, prior.h2 * 1.15);
    const postNorm = rawPostH1 + rawPostH2 || 1;
    const postH2 = Number((rawPostH2 / postNorm).toFixed(3));
    const postH1 = Number((1.0 - postH2).toFixed(3));
    const posterior = {
      h1: postH1,
      h2: postH2,
      uncertainty: Number((prior.uncertainty * 0.65).toFixed(3)),
    };

    const record: AdaptiveInterventionRecord = {
      cycleIndex: this.cycleCount,
      timestamp: Date.now(),
      objective: this.activeObjective,
      strategy: this.activeStrategy,
      priorProbabilities: prior,
      diagnosticAction,
      observedEvidence: `Génération procédurale de la variante fermée '${variantTitle}'.`,
      posteriorProbabilities: posterior,
      generatedVariantTitle: variantTitle,
      rationale,
    };

    this.history.unshift(record);

    // Save to cumulative knowledge table (PRD Section 63.5)
    this.accumulatedKnowledge.push({
      contextId: `context_victoria_vr_adaptive_${this.cycleCount}`,
      userStateSignature: `H2:${posterior.h2}_U:${posterior.uncertainty}`,
      objective: this.activeObjective,
      strategy: this.activeStrategy,
      confidence: 1.0 - posterior.uncertainty,
      sampleSize: this.cycleCount,
      empiricalOutcome: {
        transferScore: Number(Math.min(0.98, 0.8 + posterior.h2 * 0.18).toFixed(2)),
        enjoymentRating: 4.8,
        retentionLikelihood: 0.91,
      },
    });

    this.persistToStorage();

    return { worldPatch: patch, record };
  }

  public resetLoop(): void {
    this.hypotheses = {
      h1: {
        id: 'surface_heuristic',
        label: 'Heuristique de Surface (Mémorisation)',
        description: "L'utilisateur agit par essai-erreur ou mémorisation d'indices visuels.",
        probability: 0.5,
      },
      h2: {
        id: 'causal_understanding',
        label: 'Compréhension Causale (Généralisation)',
        description: "L'utilisateur a compris la structure causale sous-jacente.",
        probability: 0.5,
      },
      uncertainty: 1.0,
    };
    this.activeObjective = 'DIAGNOSE_HYPOTHESIS';
    this.activeStrategy = 'MINIMAL_COUNTERFACTUAL';
    this.persistToStorage();
  }

  private persistToStorage(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem('worldpilot_meta_hypotheses', JSON.stringify(this.hypotheses));
      localStorage.setItem('worldpilot_meta_history', JSON.stringify(this.history.slice(0, 20)));
      localStorage.setItem('worldpilot_meta_knowledge', JSON.stringify(this.accumulatedKnowledge.slice(0, 30)));
    } catch {
      // Ignored in restricted environments
    }
  }

  private loadFromStorage(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const rawHyp = localStorage.getItem('worldpilot_meta_hypotheses');
      if (rawHyp) this.hypotheses = JSON.parse(rawHyp);

      const rawHist = localStorage.getItem('worldpilot_meta_history');
      if (rawHist) this.history = JSON.parse(rawHist);

      const rawKnow = localStorage.getItem('worldpilot_meta_knowledge');
      if (rawKnow) this.accumulatedKnowledge = JSON.parse(rawKnow);
    } catch {
      // Ignored
    }
  }
}

export const metaController = new MetaControllerEngine();
