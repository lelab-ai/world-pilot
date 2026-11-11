// src/research/editOrder/v2/experimentTypesV2.ts
// WorldPilot Edit-Order Sensitivity Research Program (Version 2.0 - Publication Benchmark).
// Formal definitions for stratified dataset, multi-layer thresholds, true ablations, and fine-grained instrumentation.

import type {
  EditCategory,
  BehavioralComparison,
  PredictorName
} from '../experimentTypes';

export type BenchmarkStratum =
  | 'S1_Direct'              // EntityOverlap > 0 && DependencyOverlap > 0
  | 'S2_Indirect'            // EntityOverlap == 0 && DependencyOverlap > 0 (Key scientific test)
  | 'S3_LexicalFalsePositive'// EntityOverlap > 0 && DependencyOverlap == 0 (False friends)
  | 'S4_TrueIndependence';   // EntityOverlap == 0 && DependencyOverlap == 0 (True negatives)

export type IndirectDependencyType =
  | 'GEOMETRY_NAVIGATION'    // Movement/Placement blocks NavMesh or reduces clearance
  | 'GEOMETRY_INTERACTION'   // Mesh movement detaches spatial trigger volume
  | 'GEOMETRY_PHYSICS'       // Transform alters mass stack or center of gravity
  | 'PHYSICS_NAVIGATION'     // Physical boundary / mass barrier impedes locomotion
  | 'IDENTITY_CAUSAL'        // Target entity renamed/aliased breaking event listener
  | 'IDENTITY_QUEST'         // Quest step target identity uncoupled
  | 'TRIGGER_TASK'           // Sensor trigger required by MDP task progression
  | 'CAUSAL_INTERACTION'     // Relay event triggering secondary spatial interactive volume
  | 'MULTI_HOP_CHAIN'        // Causal propagation depth >= 2
  | 'NONE';

export interface EditOrderExperimentCaseV2 {
  id: string; // WP2-EO-001 to WP2-EO-200
  worldCategory: string;
  initialWorldPrompt: string;
  editA: string;
  editB: string;
  editCategoryA: EditCategory;
  editCategoryB: EditCategory;
  stratum: BenchmarkStratum;
  indirectType: IndirectDependencyType;
  dependencyDepth: number; // 0, 1, 2, 3+
  entityOverlapScore: number; // [0, 1]
  dependencyOverlapScore: number; // [0, 1]
  expectedCompatibility: 'compatible' | 'ambiguous' | 'conflicting';
  manualValidation: {
    humanValidated: boolean;
    annotator1: string;
    annotator2: string;
    agreement: boolean;
    notes?: string;
  };
  seed: number;
  tags: string[];
  split: 'dev' | 'val' | 'test_locked';
}

export interface LayerThresholds {
  tau_geom_position_m: number;      // default 0.02 m
  tau_geom_rotation_deg: number;    // default 1.0 deg
  tau_geom_scale_rel: number;       // default 0.01 (1%)
  tau_phys_volume_rel: number;      // default 0.02 (2%)
  tau_phys_penetration_count: number; // default 0
  tau_nav_waypoint_delta: number;   // default 0
  tau_inter_position_m: number;     // default 0.02 m
  tau_inter_affordance_parity: boolean; // default true
  tau_causal_rule_mismatch: number; // default 0
  tau_task_terminal_mismatch: number; // default 0
  tau_invariant_violations: number; // default 0
}

export const DEFAULT_V2_THRESHOLDS: LayerThresholds = {
  tau_geom_position_m: 0.02,
  tau_geom_rotation_deg: 1.0,
  tau_geom_scale_rel: 0.01,
  tau_phys_volume_rel: 0.02,
  tau_phys_penetration_count: 0,
  tau_nav_waypoint_delta: 0,
  tau_inter_position_m: 0.02,
  tau_inter_affordance_parity: true,
  tau_causal_rule_mismatch: 0,
  tau_task_terminal_mismatch: 0,
  tau_invariant_violations: 0
};

export type TrueAblationId =
  | 'ABL-0_FullC5'
  | 'ABL-1_NoIdentityPreservation'
  | 'ABL-2_NoTriggerReconciliation'
  | 'ABL-3_NoPhysicsTracking'
  | 'ABL-4_NoNavigationTracking'
  | 'ABL-5_NoCausalRuleReconciliation'
  | 'ABL-6_NoTaskDependencyTracking'
  | 'ABL-7_NoInvariantVerification'
  | 'ABL-8_NoParetoRepair'
  | 'ABL-D0_Depth0'
  | 'ABL-D1_Depth1'
  | 'ABL-D2_Depth2'
  | 'ABL-D3_Depth3Plus';

export interface C1FailureAuditRecord {
  caseId: string;
  failed: boolean;
  mechanisms: {
    entityDuplication: boolean;
    triggerDesynchronization: boolean;
    repeatedSpatialOffset: boolean;
    identityDrift: boolean;
    other: boolean;
  };
  evidence: {
    duplicatedIds: string[];
    triggerPositionsAB: [number, number, number][];
    triggerPositionsBA: [number, number, number][];
    offsetDifferenceMeters: number | null;
  };
  notes: string;
}

export interface ExecutionInstrumentation {
  blastRadiusCalls: number;
  modelCheckerCalls: number;
  repairCalls: number;
  runtimeMs: number;
}

export interface ExperimentRunRecordV2 {
  experimentId: string;
  benchmarkVersion: '2.0.0';
  stratum: BenchmarkStratum;
  indirectType: IndirectDependencyType;
  dependencyDepth: number;
  condition: string;
  ablationId?: TrueAblationId;
  seed: number;
  split: 'dev' | 'val' | 'test_locked';
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
  instrumentation: ExecutionInstrumentation;
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
    repairAB?: {
      triggered: boolean;
      operations: string[];
      preViolations: number;
      postViolations: number;
      verified: boolean;
    };
    repairBA?: {
      triggered: boolean;
      operations: string[];
      preViolations: number;
      postViolations: number;
      verified: boolean;
    };
    violationsAB?: string[];
    violationsBA?: string[];
  };
  ordering?: {
    reasonAB: string;
    reasonBA: string;
    orderingChangedAB: boolean;
    orderingChangedBA: boolean;
  };
  finalWorldAB?: any;
  finalWorldBA?: any;
}

