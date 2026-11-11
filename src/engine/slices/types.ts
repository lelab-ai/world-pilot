// src/engine/slices/types.ts
// Unified Store Types and Slice Interfaces for WorldPilot

import type { WorldState, WorldPatch, WorldEvent, WorldIR, QuestSpec, SavedSpatialLayout, EntitySpec } from '../../core/types';
import type { Achievement } from '../achievements';
import type { CognitivePersonaType, CognitiveSessionReport } from '../cognitiveTraceRecorder';
import type { CohortSimulationSummary } from '../cohortSimulator';
import type { CounterfactualBranch, BranchComparisonResult } from '../counterfactualEngine';
import type { AnomalyType, SimulationAnomaly } from '../anomalyEngine';
import type { CoWorkerPersonaId, CoWorkerTaskType, CoWorkerState, HumanAITeamingMetrics } from '../coWorkerAgent';
import type { LeRobotDatasetExport } from '../embodiedDataExporter';
import type { CognitiveCertificate } from '../skillCertification';
import type { CognitiveClone, CloneRolloutResult, CloneComparisonAnalysis } from '../cognitiveCloneEngine';
import type { SpatialAttentionState } from '../spatialAttentionTelemetry';
import type { PublishReadinessReport, LandPresetType } from '../publishReadiness';
import type { PlaytesterRunResult, PlaytesterPersona } from '../syntheticPlaytester';
import type { GuarantorAudit } from '../deterministicGuarantor';
import type { ShadowCausalGraph, GestureType } from '../../research/inverseIntentEngine';
import type { BlastRadiusReport } from '../../research/semanticBlastRadius';
import type {
  CompetingHypotheses,
  AdaptiveObjective,
  AdaptiveStrategy,
  AdaptiveInterventionRecord,
  MetaKnowledgeObject
} from '../../research/metaController';
import type {
  AgentObservation,
  CognitiveLedgerSummary,
  AgentDecisionArbitration
} from '../agentCognitiveLedger';

export interface StickyNote {
  id: string;
  text: string;
  category: 'idea' | 'action' | 'question' | 'decision';
  color: 'yellow' | 'green' | 'pink' | 'blue' | 'orange';
  author: string;
  column: 'backlog' | 'in_progress' | 'done';
  votes: number;
  createdAt: number;
}

export type CameraPreset = 'overview' | 'table' | 'luxury_showroom' | 'board' | 'cocotte' | 'plate' | 'chopping' | 'supercar_hero';
export type CinematicPreset = 'cinematic' | 'golden_hour' | 'cyberpunk_neon' | 'studio_neutral' | 'standard';
export type PlatingStyle = 'classic-dome' | 'deconstructed-arc' | 'geometric-tian';
export type PlatingGarnish = 'fleur-de-sel' | 'tuile-dentelle' | 'micro-greens' | 'truffle-specks';

export interface ChefEvaluation {
  totalScore: number;
  stars: number;
  title: string;
  cookingScore: number;
  seasoningScore: number;
  platingScore: number;
  cookingFeedback: string;
  seasoningFeedback: string;
  platingFeedback: string;
  recommendations: string[];
}

export interface WorldSlice {
  world: WorldState;
  spatialContext: {
    selectedEntityId: string | null;
    pointedEntityId: string | null;
  };
  instruction: string;
  isSimulating: boolean;
  warnings: string[];
  physicsEpoch: number;
  incrementPhysicsEpoch: () => void;
  currentSceneTitle: string;
  setCurrentSceneTitle: (title: string) => void;
  undoStack: { ir: WorldIR; flags?: Record<string, any>; gameplay?: any; title: string; instruction: string }[];
  redoStack: { ir: WorldIR; flags?: Record<string, any>; gameplay?: any; title: string; instruction: string }[];
  undo: () => boolean;
  redo: () => boolean;
  canUndo: boolean;
  canRedo: boolean;
  cameraFocusTarget: [number, number, number] | null;
  setCameraFocusTarget: (target: [number, number, number] | null) => void;
  showGrid: boolean;
  showLabels: boolean;
  setShowGrid: (show: boolean) => void;
  setShowLabels: (show: boolean) => void;
  setInstruction: (instruction: string) => void;
  setSimulating: (isSimulating: boolean) => void;
  setWorldState: (ir: any) => void;
  setSpatialContext: (selected: string | null, pointed: string | null) => void;
  clearWarnings: () => void;
  resetWorld: () => void;
  applyPatch: (patch: WorldPatch, instruction: string, plan?: any) => void;
  dispatch: (event: WorldEvent) => void;
  addCustomRule: (rule: any) => void;
  rotateEntity: (entityId: string, angleDeltaRad: number) => void;
  duplicateEntity: (entityId: string) => string | null;
  deleteEntity: (entityId: string) => void;
  groundEntity: (entityId: string) => void;
  moveEntity: (entityId: string, dx: number, dy: number, dz: number) => void;
  placementModeEntityId: string | null;
  setPlacementModeEntityId: (id: string | null) => void;
  startPlacementMode: (entityId: string) => void;
  cancelPlacementMode: () => void;
  completePlacement: (x: number, y: number, z: number) => void;
  focusEntity: (entityId: string) => void;
  saveWorldToStorage: () => void;
  loadWorldFromStorage: (storageKey?: string) => boolean;
  exportWorldJson: () => void;
  importWorldJson: (jsonStr: string) => boolean;
  exportWorldYaml: () => void;
  importWorldYaml: (yamlStr: string) => boolean;
  triggerCaptureScreenshot: () => void;
  triggerExportGLB: (entityId?: string, entityName?: string) => void;
  triggerExportUSDZ: () => void;
  startQuest: (questId: string) => void;
  resetQuest: (questId?: string) => void;
  stopActiveQuest: () => void;
  advanceActiveQuestStep: (questId?: string) => void;
  setActiveQuestId: (questId: string | null) => void;
  synthesizeQuestForCurrentScene: () => QuestSpec | null;
  tickGameplayTimer: () => void;
  resetGameplay: () => void;
  gizmoMode: 'off' | 'translate' | 'rotate';
  setGizmoMode: (mode: 'off' | 'translate' | 'rotate') => void;
  cycleGizmoMode: () => void;
  setWorldFlag: (flag: string, value: any) => void;
  triggerRuleManually: (ruleId: string) => void;
  showCausalObservability: boolean;
  setShowCausalObservability: (show: boolean) => void;
  toggleCausalObservability: () => void;
  liveCausalFeed: LiveCausalEvent[];
  addLiveCausalEvent: (event: Omit<LiveCausalEvent, 'id' | 'timestamp'>) => void;
  clearLiveCausalFeed: () => void;
  savedSpatialLayouts: SavedSpatialLayout[];
  saveCurrentSpatialLayout: (name: string, description?: string) => string;
  loadSpatialLayout: (layoutId: string) => boolean;
  deleteSpatialLayout: (layoutId: string) => void;
  toggleEntityState: (entityId: string, targetState?: string) => void;
  testEntityCapacity: (containerId: string, itemId: string) => { fits: boolean; partId?: string; message: string };
  findCompatibleItemsFor: (entityId: string) => EntitySpec[];
  showLayoutsModal: boolean;
  setShowLayoutsModal: (show: boolean) => void;
  showObjectCompatibilityModal: boolean;
  setShowObjectCompatibilityModal: (show: boolean) => void;
  compatibilityTargetEntityId: string | null;
  setCompatibilityTargetEntityId: (id: string | null) => void;
  explodedEntities: Record<string, boolean>;
  toggleExplodedView: (entityId: string) => void;
  selectedPartId: string | null;
  setSelectedPartId: (partId: string | null) => void;
  showEntity2DDrawer: boolean;
  setShowEntity2DDrawer: (show: boolean) => void;
  showImportUrlModal: boolean;
  setShowImportUrlModal: (show: boolean) => void;
  importEntityFromUrl: (url: string, customName?: string) => Promise<{ success: boolean; entityId?: string; message: string }>;
  replaceEntityPreservingTransform: (targetEntityId: string, newEntitySpecOrAssetId: string | Partial<EntitySpec>) => boolean;
  customAgentPersona?: any | null;
}

export interface LiveCausalEvent {
  id: string;
  timestamp: number;
  type: 'action' | 'rule' | 'quest' | 'safety' | 'victoria' | 'flag';
  icon: string;
  source?: string;
  target?: string;
  message: string;
  badge?: string;
  productive?: boolean;
}

export interface AgentEcosystemSlice {
  // Synthetic AI Playtester & Deterministic Guarantor (4-Agent Closed Ecosystem)
  showSyntheticPlaytesterModal: boolean;
  setShowSyntheticPlaytesterModal: (show: boolean) => void;
  openSyntheticPlaytesterModal: () => void;
  closeSyntheticPlaytesterModal: () => void;
  playtesterResult: PlaytesterRunResult | null;
  activePlaytesterPersona: PlaytesterPersona;
  setActivePlaytesterPersona: (persona: PlaytesterPersona) => void;
  isPlaytesterVisualizerActive: boolean;
  togglePlaytesterVisualizer: () => void;
  runPlaytest: (persona?: PlaytesterPersona) => PlaytesterRunResult;
  runHumanClonedPlaytest: () => PlaytesterRunResult;
  applyMinimalPatchAndRetest: () => { success: boolean; message: string };
  lastGuarantorAudit: GuarantorAudit | null;
  certifyCurrentWorld: (proposedPatch?: WorldPatch) => GuarantorAudit;

  // Human Agent Friction & Assistance Detection
  userFrictionState: {
    consecutiveFrictionCount: number;
    lastFailedEntityId: string | null;
    lastFailedEntityName: string | null;
    lastAttemptedAction?: string;
    recentInteractions: Array<{
      timestamp: number;
      entityId: string;
      type: string;
      wasProductive: boolean;
    }>;
    lastHesitationAlertTime: number;
  };
  recordUserActionAttempt: (params: {
    sourceId: string;
    targetId?: string | null;
    actionType: 'click' | 'drag' | 'drop';
    wasProductive?: boolean;
    context?: string;
  }) => void;

  // Cognitive Twin (Jumeau Numérique) & Inverse RL
  cognitiveClone: CognitiveClone | null;
  cloneRolloutResult: CloneRolloutResult | null;
  cloneComparison: CloneComparisonAnalysis | null;
  synthesizeClone: (operatorName?: string) => CognitiveClone;
  simulateCloneRollout: (stepsCount?: number) => CloneRolloutResult;

  // Cognitive Ledger & Decision Memory
  agentObservations: AgentObservation[];
  agentLedgerSummary: CognitiveLedgerSummary;
  showAgentLedgerModal: boolean;
  setShowAgentLedgerModal: (show: boolean) => void;
  openAgentLedgerModal: () => void;
  closeAgentLedgerModal: () => void;
  recordAgentObservation: (obs: Omit<AgentObservation, 'id' | 'timestamp'>) => AgentObservation;
  arbitrateAgentObservation: (obsId: string, override?: Partial<AgentDecisionArbitration>) => void;
  applyAgentHotPatch: (obsId: string) => boolean;
  exportAgentLedgerJson: () => string;

  // Closed Adaptive Loop (PRD Master)
  metaHypotheses: CompetingHypotheses;
  metaStrategy: { objective: AdaptiveObjective; strategy: AdaptiveStrategy };
  metaHistory: AdaptiveInterventionRecord[];
  metaKnowledge: MetaKnowledgeObject[];
  lastInteractionTime: number;
  observeMetaInteraction: (event: {
    type: 'DECISION_LATENCY' | 'ERROR_TRAP_TRIGGERED' | 'TRANSFER_SUCCESS' | 'EXPLANATION_GIVEN' | 'HESITATION_DETECTED' | 'UNPRODUCTIVE_REPEAT_CLICK';
    data: { value: number; context?: string; wasProductive?: boolean; repetitionCount?: number };
  }) => void;
  triggerAdaptiveCycle: () => { variantTitle: string; rationale: string };
  resetMetaLoop: () => void;
  runPersonaBenchmark: (personaId: 'persona_a' | 'persona_b' | 'persona_c' | 'persona_d') => any;

  // Research Core: Inverse Intent & Shadow Graph
  showResearchDashboardModal: boolean;
  setShowResearchDashboardModal: (show: boolean) => void;
  openResearchDashboard: () => void;
  closeResearchDashboard: () => void;
  shadowGraph: ShadowCausalGraph;
  blastRadiusReport: BlastRadiusReport | null;
  behavioralMetrics: {
    activeEpisodeLength: number;
    spatialActivityDensity: number;
    postureProxyScore: number;
    totalCompletedEpisodes: number;
  };
  recordUnanticipatedUserGesture: (
    sourceId: string,
    targetId: string,
    gesture: GestureType,
    metrics: { spatialDistance: number; approachVelocity: number; gazeDwellMs: number }
  ) => void;
  promoteEmergentAffordance: (interactionId: string) => void;
  dismissEmergentAffordance: (interactionId: string) => void;
  clearEmergentAffordances: () => void;
  evaluateCurrentWorldBlastRadius: () => BlastRadiusReport;
  applyParetoRepairPatch: () => void;
  compileAndLoadPedagogicalSimulation: (presetKey: string) => void;
  recordSampleBehavioralEpisode: () => void;
  exportMDPDataset: () => string;

  // Embodied Co-Worker Agent & Human-AI Teaming
  isCoWorkerActive: boolean;
  coWorker: CoWorkerState;
  teamingMetrics: HumanAITeamingMetrics;
  toggleCoWorker: () => void;
  setCoWorkerActive: (active: boolean) => void;
  switchCoWorkerPersona: (personaId: CoWorkerPersonaId) => void;
  delegateCoWorkerTask: (task: CoWorkerTaskType) => void;
  recordCoWorkerOverride: (reason?: string) => void;

  // Ghost Trajectory & Counterfactual Multiverse
  isGhostAgentActive: boolean;
  toggleGhostAgent: () => void;
  setGhostAgentActive: (active: boolean) => void;
  counterfactualBranches: CounterfactualBranch[];
  activeBranchId: string;
  createCounterfactualFork: (forkStepIndex?: number, customTitle?: string) => CounterfactualBranch;
  runAutonomousBranchRollout: (persona: CognitivePersonaType, forkStepIndex?: number) => CounterfactualBranch;
  compareActiveBranches: (branchIdA: string, branchIdB: string) => BranchComparisonResult | null;
  switchActiveBranch: (branchId: string) => void;

  // Spatial Attention Telemetry
  spatialAttention: SpatialAttentionState;
  toggleAttentionHeatmap: (force?: boolean) => void;
  recordVisualFixation: (
    entityId: string,
    entityName: string,
    position: { x: number; y: number; z: number },
    dwellMs?: number,
    preActionMs?: number
  ) => void;

  // Cognitive Trace & Cohort Simulation
  cognitiveReport: CognitiveSessionReport;
  showBehavioralAnalyticsModal: boolean;
  setShowBehavioralAnalyticsModal: (show: boolean) => void;
  openBehavioralAnalyticsModal: () => void;
  closeBehavioralAnalyticsModal: () => void;
  logCognitiveAction: (actionType: string, meta?: {
    sourceEntityId?: string;
    sourceEntityName?: string;
    targetEntityId?: string;
    warningTriggered?: string;
    isErrorRecovery?: boolean;
  }) => void;
  resetCognitiveSession: () => void;
  cohortSimulationSummary: CohortSimulationSummary | null;
  runCohortSimulation: (cohortSize?: number) => CohortSimulationSummary;

  // VLA & Dataset Export
  exportVLAEmbodiedDataset: () => LeRobotDatasetExport;
  getCognitiveCertificate: () => CognitiveCertificate;

  // Anomaly Engine & Stress Testing
  activeAnomalies: SimulationAnomaly[];
  injectAnomaly: (type: AnomalyType) => SimulationAnomaly;
  resolveAnomaly: (anomalyId: string) => void;
  clearAnomalies: () => void;
  getCognitiveLoad: () => { index: number; label: string; color: string; level: 'calm' | 'alert' | 'overload' };
}

export interface RuntimeUISlice {
  // Cinematic Presets & Post-Processing
  cinematicPreset: CinematicPreset;
  setCinematicPreset: (preset: CinematicPreset) => void;
  bloomIntensity: number;
  setBloomIntensity: (intensity: number) => void;
  vignetteStrength: number;
  setVignetteStrength: (strength: number) => void;
  chromaticAberration: number;
  setChromaticAberration: (amount: number) => void;
  showCinematicModal: boolean;
  setShowCinematicModal: (show: boolean) => void;

  // 3D Transduction & Drag State
  isDragging3D: boolean;
  draggedEntityId: string | null;
  snappedTargetId: string | null;
  hoveredEntityId: string | null;
  setDragging3D: (isDragging: boolean) => void;
  setDraggedEntityId: (id: string | null) => void;
  setSnappedTargetId: (id: string | null) => void;
  setHoveredEntityId: (id: string | null) => void;

  // Camera & Navigation
  cameraPreset: CameraPreset;
  setCameraPreset: (preset: CameraPreset) => void;
  cycleCameraPreset: () => CameraPreset;
  isCinematicTourActive: boolean;
  toggleCinematicTour: () => void;

  // Audio, Atmospheres & Gravity
  currentAtmosphere: string;
  setAtmosphere: (atmosphere: string) => void;
  currentWorldThemeId: string;
  currentGravity: [number, number, number];
  shiftWorldTheme: (themeId: string, customGravity?: [number, number, number]) => void;
  setWorldTheme: (themeId: string) => void;
  setCustomGravity: (gravity: [number, number, number]) => void;
  isAmbientAudioActive: boolean;
  toggleAmbientAudio: () => void;
  audioVolume: number;
  isAudioMuted: boolean;
  setAudioVolume: (volume: number) => void;
  toggleAudioMute: () => boolean;
  isVoiceModeEnabled: boolean;
  setVoiceModeEnabled: (enabled: boolean) => void;
  toggleVoiceMode: () => void;
  isSpatialAgentActive: boolean;
  setSpatialAgentActive: (active: boolean) => void;
  toggleSpatialAgent: () => void;
  spatialAgentPositionOverride: { x: number; y: number; z: number } | null;
  setSpatialAgentPositionOverride: (pos: { x: number; y: number; z: number } | null) => void;
  isAgentSpeechEnabled: boolean;
  toggleAgentSpeech: () => void;

  // Web Modals
  activeWebModalUrl: string | null;
  activeWebModalTitle: string | null;
  activeWebModalContent?: string | null;
  activeWebModalEntityId?: string | null;
  openWebModal: (url: string, title?: string, content?: string | null, entityId?: string | null) => void;
  closeWebModal: () => void;

  // App Mode & Bilingual Support
  appMode: 'conception' | 'simulation' | 'observatoire';
  setAppMode: (mode: 'conception' | 'simulation' | 'observatoire') => void;
  uiLanguage: 'fr' | 'en';
  setUiLanguage: (lang: 'fr' | 'en') => void;
  pitchDirectorActId: number;
  setPitchDirectorActId: (actId: number) => void;

  // Supercar & Victoria VR Configurator Domain
  isSupercarConfiguratorOpen: boolean;
  openSupercarConfigurator: () => void;
  closeSupercarConfigurator: () => void;
  applySupercarConfiguration: (paintColor?: string, paintName?: string, brakeCalipers?: 'gold' | 'red' | 'cyan', carbonPackActive?: boolean) => void;
  supercarCustomPaint: string | null;
  setSupercarCustomPaint: (paint: string | null) => void;
  supercarBrakeCalipers: 'gold' | 'red' | 'cyan';
  supercarCarbonPack: boolean;

  // Gastronomy & Escoffier Domain
  isDishPlated: boolean;
  setIsDishPlated: (plated: boolean) => void;
  activeDegustationRecipeId: string | null;
  openDegustationModal: (recipeId?: string) => void;
  closeDegustationModal: () => void;
  cookingHeatLevel: number;
  setCookingHeatLevel: (level: number) => void;
  cycleCookingHeatLevel: () => number;
  seasoningProfile: { salt: number; herbs: number; oil: number };
  addSeasoning: (type: 'salt' | 'herbs' | 'oil', amount?: number) => void;
  resetSeasoning: () => void;
  cookingDoneness: number;
  setCookingDoneness: (doneness: number) => void;
  cookingTimerRemaining: number | null;
  isCookingTimerRunning: boolean;
  startCookingTimer: (seconds?: number) => void;
  stopCookingTimer: () => void;
  resetCookingTimer: () => void;
  tickCooking: (deltaSec?: number) => void;
  resetCookingProgress: () => void;
  getDishEvaluation: () => ChefEvaluation;
  restartCurrentRecipe: () => void;
  choppingProgress: Record<string, number>;
  chopIngredient: (entityId?: string) => void;
  resetChopping: () => void;
  isTastingActive: boolean;
  tastingUtensil: 'fork' | 'spoon';
  triggerTasting: (utensil?: 'fork' | 'spoon') => void;
  stopTasting: () => void;
  isDishSauced: boolean;
  toggleSauceDish: () => void;
  lastAnnouncedDonenessStage: number;
  getChefCookingAdvice: () => { message: string; step: string };
  askChefAdvice: () => string;
  cookingTemperature: number;
  platingStyle: PlatingStyle;
  setPlatingStyle: (style: PlatingStyle) => void;
  cyclePlatingStyle: () => PlatingStyle;
  platingGarnish: PlatingGarnish;
  setPlatingGarnish: (garnish: PlatingGarnish) => void;
  cyclePlatingGarnish: () => PlatingGarnish;

  // Achievements & Hall of Fame
  unlockedAchievements: Record<string, number>;
  unlockAchievement: (id: string) => boolean;
  recentUnlockedAchievement: Achievement | null;
  dismissAchievementToast: () => void;
  showAchievementsModal: boolean;
  setShowAchievementsModal: (show: boolean) => void;

  // FLE Flashcards & Vocab Study
  masteredVocab: string[];
  toggleVocabMastery: (word: string) => boolean;
  isVocabMastered: (word: string) => boolean;
  showFlashcardStudyModal: boolean;
  setShowFlashcardStudyModal: (show: boolean) => void;
  studyModalSceneId: string | null;
  openFlashcardStudyModal: (sceneId?: string) => void;
  closeFlashcardStudyModal: () => void;

  // Seminar Collaboration Board & Sticky Notes
  collaborationNotes: StickyNote[];
  addCollaborationNote: (note: { text: string; category?: 'idea' | 'action' | 'question' | 'decision'; color?: 'yellow' | 'green' | 'pink' | 'blue' | 'orange'; author?: string; column?: 'backlog' | 'in_progress' | 'done' }) => void;
  voteCollaborationNote: (noteId: string) => void;
  moveCollaborationNote: (noteId: string, column: 'backlog' | 'in_progress' | 'done') => void;
  deleteCollaborationNote: (noteId: string) => void;
  showCollaborationBoardModal: boolean;
  setShowCollaborationBoardModal: (show: boolean) => void;

  // Publish Readiness & Victoria VR Lands
  showPublishReadinessModal: boolean;
  setShowPublishReadinessModal: (show: boolean) => void;
  openPublishReadinessModal: (preset?: LandPresetType) => void;
  closePublishReadinessModal: () => void;
  showEditOrderLabModal: boolean;
  setShowEditOrderLabModal: (show: boolean) => void;
  openEditOrderLabModal: () => void;
  closeEditOrderLabModal: () => void;
  activeLandPreset: LandPresetType;
  setActiveLandPreset: (preset: LandPresetType) => void;
  publishReadinessReport: PublishReadinessReport | null;
  runPublishReadinessCheck: (preset?: LandPresetType) => PublishReadinessReport;
}

export type StoreState = WorldSlice & AgentEcosystemSlice & RuntimeUISlice;
