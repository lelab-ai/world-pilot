// src/research/editOrder/experimentTypes.ts
// WorldPilot Edit-Order Sensitivity Research Program (Version 1.0)
// Types fondamentaux pour l'évaluation empirique des permutations d'instructions en langage naturel.

export type EditCategory =
  | 'MOVE'
  | 'ROTATE'
  | 'SCALE'
  | 'REPLACE'
  | 'ADD'
  | 'REMOVE'
  | 'RENAME'
  | 'CONNECT_CAUSAL'
  | 'CHANGE_TRIGGER'
  | 'CHANGE_NAVIGATION'
  | 'CHANGE_QUEST'
  | 'CHANGE_PHYSICS'
  | 'CHANGE_PERMISSION'
  | 'CHANGE_IDENTITY'
  | 'COMPOSITE';

export type RegressionClass =
  | 'NONE'
  | 'VISUAL_ONLY'
  | 'GEOMETRY'
  | 'PHYSICS'
  | 'NAVIGATION'
  | 'INTERACTION'
  | 'CAUSAL_REFERENCE'
  | 'TASK_FAILURE'
  | 'CROSS_LAYER_DESYNC'
  | 'IDENTITY_DRIFT'
  | 'DEADLOCK'
  | 'SAFETY_INVARIANT'
  | 'UNKNOWN';

export interface EditOrderExperimentCase {
  id: string;
  initialWorldPrompt: string;
  initialWorldPromptEn?: string;
  editA: string;
  editAEn?: string;
  editB: string;
  editBEn?: string;

  worldCategory: string;
  worldCategoryEn?: string;
  editCategoryA: EditCategory;
  editCategoryB: EditCategory;

  expectedCompatibility: 'compatible' | 'ambiguous' | 'conflicting';

  manualValidation: {
    approved: boolean;
    reviewerIds: string[];
    notes?: string;
  };

  seed: number;
  tags: string[];
  split?: 'dev' | 'val' | 'test_locked';
}

// ----------------------------------------------------------------------------
// ÉTAT OBSERVABLE CANONIQUE MULTI-COUCHE
// ----------------------------------------------------------------------------

export interface CanonicalEntityState {
  canonicalId: string;
  name: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  shape?: string;
  assetId?: string;
  isFixed: boolean;
  capabilities: string[];
}

export interface GeometryState {
  entityCount: number;
  boundingVolumeTotal: number;
  centerOfMass: [number, number, number];
  spatialHash: string;
}

export interface PhysicsState {
  colliderCount: number;
  dynamicCount: number;
  fixedCount: number;
  penetrationCount: number;
  stabilityScore: number;
}

export interface NavigationState {
  reachableWaypointCount: number;
  obstaclePositions: [number, number, number][];
  clearanceHash: string;
}

export interface InteractionState {
  draggableEntityIds: string[];
  clickableEntityIds: string[];
  triggerZones: { id: string; targetId?: string; radius?: number; position?: [number, number, number] }[];
}

export interface CanonicalCausalGraph {
  ruleCount: number;
  edgeCount: number;
  edges: { trigger: string; targetId: string; action: string }[];
  graphHash: string;
}

export interface TaskOutcomeState {
  activeQuestId: string | null;
  totalSteps: number;
  completedSteps: number;
  status: 'idle' | 'in_progress' | 'completed';
  isSolvable: boolean;
}

export interface InvariantEvaluation {
  invariantId: string;
  description: string;
  satisfied: boolean;
  severity: 'CRITICAL' | 'WARNING' | 'NOTICE';
}

export interface CanonicalWorldSnapshot {
  experimentId: string;
  branch: 'AB' | 'BA' | 'W0' | 'WA' | 'WB';
  entities: CanonicalEntityState[];
  geometry: GeometryState;
  physics: PhysicsState;
  navigation: NavigationState;
  interactions: InteractionState;
  causalGraph: CanonicalCausalGraph;
  taskState: TaskOutcomeState;
  invariants: InvariantEvaluation[];
  snapshotHash: string;
  runtimeMs: number;
}

// ----------------------------------------------------------------------------
// COMPARAISON COMPORTEMENTALE & DIVERGENCE
// ----------------------------------------------------------------------------

export interface LayerComparison {
  equivalent: boolean;
  divergenceScore: number; // 0.0 = identique, >0 = divergent
  details: string[];
  affectedEntityIds?: string[];
}

export interface BehavioralComparison {
  equivalent: boolean;
  divergenceVector: [number, number, number, number, number, number, number]; // [d_g, d_p, d_n, d_i, d_c, d_t, v]
  geometry: LayerComparison;
  physics: LayerComparison;
  navigation: LayerComparison;
  interactions: LayerComparison;
  causal: LayerComparison;
  tasks: LayerComparison;
  invariants: LayerComparison;
  regressionClasses: RegressionClass[];
  humanReviewRequired: boolean;
}

// ----------------------------------------------------------------------------
// CONDITIONS EXPÉRIMENTALES & BASELINES
// ----------------------------------------------------------------------------

export type ExperimentalCondition =
  | 'C0_NaiveSequential'
  | 'C1_FullHistory'
  | 'C2_MergedIntent'
  | 'C3_DependencyDetectionOnly'
  | 'C4_DependencyAwareExecution'
  | 'C5_DependencyAwareMinimalRepair';

export type PredictorName =
  | 'B0_Random'
  | 'B0bis_AlwaysPositive'
  | 'B1_TextSimilarity'
  | 'B1a_LexicalSimilarity'
  | 'B1b_EmbeddingCosine'
  | 'B2_EntityOverlap'
  | 'B3_ParsedIdOverlap'
  | 'B4_GeometricOverlap'
  | 'B5_LLMConflictJudge'
  | 'B6_DependencyOverlap';

export interface PredictionFeatureVector {
  textSimilarity: number;
  entityMentionOverlap: number;
  parsedObjectIdOverlap: number;
  geometricOverlap: number;
  llmConflictProbability: number;
  dependencyOverlapJaccard: number;
  dependencyOverlapWeighted: number;
  causalDistance: number;
}

export interface ExperimentRunRecord {
  experimentId: string;
  benchmarkVersion: string;
  condition: ExperimentalCondition;
  seed: number;
  initialWorld: {
    prompt: string;
    hash: string;
  };
  editA: string;
  editB: string;
  branchAB: {
    steps: string[];
    snapshotHash: string;
    runtimeMs: number;
  };
  branchBA: {
    steps: string[];
    snapshotHash: string;
    runtimeMs: number;
  };
  comparison: BehavioralComparison;
  predictions: Record<PredictorName, { score: number; predictedRegression: boolean }>;
  repair?: {
    triggered: boolean;
    operations: string[];
    cost: {
      entitiesModified: number;
      rulesModified: number;
      transformDistance: number;
    };
    satisfiedA: boolean;
    satisfiedB: boolean;
  };
  snapshots?: {
    W0: CanonicalWorldSnapshot;
    WA?: CanonicalWorldSnapshot;
    WB?: CanonicalWorldSnapshot;
    WAB: CanonicalWorldSnapshot;
    WBA: CanonicalWorldSnapshot;
  };
  rawWorlds?: {
    W0: any;
    WA?: any;
    WB?: any;
    WAB: any;
    WBA: any;
  };
}
