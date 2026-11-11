export type EntityId = string;
export type Capability = { type: string; [key: string]: any };

export interface SemanticRelation {
  type: 'inside' | 'on_top_of' | 'attached_to' | 'adjacent_to' | 'compatible_with';
  targetId: EntityId;
  metadata?: Record<string, any>;
}

export interface PhysicalProperties {
  dimensions?: [number, number, number]; // [width_x, height_y, depth_z] in meters
  capacityLiters?: number;
  weightKg?: number;
  sku?: string;
  material?: string;
  fitsMaxDimensions?: [number, number, number]; // max allowed object size for a container
}

export interface TypedResource {
  role: 'manual' | 'buy' | 'details' | 'video' | 'audio' | 'documentation' | 'compatibleWith';
  url: string;
  label: string;
  icon?: string;
}

export interface SemanticPart {
  id: string;
  name: string;
  nodeName?: string;
  description?: string;
  capacityLiters?: number;
  fitsMaxDimensions?: [number, number, number]; // [width, height, depth] in meters
  isHighlighted?: boolean;
}

export interface EntityVisuals {
  assetId?: string;
  shape?: 'box' | 'sphere' | 'cylinder';
  color?: string;
  modelUrl?: string;
  textureUrl?: string;
  materialPreset?: string;
  roughness?: number;
  metalness?: number;
  clearcoat?: number;
  normalScale?: number;
  repeat?: [number, number];
}

export interface EntitySpec {
  id: EntityId;
  name: string;
  capabilities: Capability[];
  visuals?: EntityVisuals;
  state?: string; // e.g. 'open' | 'closed' | 'default'
  availableStates?: string[]; // e.g. ['closed', 'open']
  relations?: SemanticRelation[];
  physicalProperties?: PhysicalProperties;
  resources?: TypedResource[];
  parts?: SemanticPart[];
  fallback2D?: {
    thumbnailUrl?: string;
    description: string;
    specificationSheetUrl?: string;
  };
}

export interface SavedSpatialLayout {
  id: string;
  name: string;
  createdAt: number;
  description?: string;
  entitySnapshots: {
    entityId: string;
    position: { x: number; y: number; z: number };
    rotation?: { x: number; y: number; z: number };
    scale?: { x: number; y: number; z: number };
    state?: string;
    relations?: SemanticRelation[];
  }[];
  activeQuestId?: string | null;
}

export type ActionType = 
  | 'set_flag'
  | 'teleport'
  | 'fire_webhook'
  | 'open_url'
  | 'show_warning'
  | 'reset_position'
  | 'destroy_entity'
  | 'play_sound'
  | 'change_color'
  | 'mint_nft'
  | 'emit_particles'
  | 'trigger_animation'
  | 'spawn_entity'
  | 'set_atmosphere'
  | 'increment_score'
  | 'decrement_score'
  | 'adjust_lives'
  | 'set_timer'
  | 'trigger_victory'
  | 'trigger_game_over'
  | 'reset_game'
  | 'apply_impulse'
  | 'toggle_state'
  | 'test_spatial_capacity'
  | 'set_relation';

export type SoundEffect = 
  | 'laser' 
  | 'chime' 
  | 'explosion' 
  | 'ping' 
  | 'coffee_brew' 
  | 'bell' 
  | 'switch_click' 
  | 'pour_water' 
  | 'sizzle_cook' 
  | 'sizzle'
  | 'knife_chop'
  | 'fanfare' 
  | 'bubbles' 
  | 'sparkle'
  | 'game_over'
  | 'target_hit'
  | 'countdown_beep'
  | 'stir_whisk'
  | 'electric_spark'
  | 'quantum_ping'
  | 'paper_turn'
  | 'snap_connect'
  | 'snap_release'
  | 'impact_wood'
  | 'impact_metal'
  | 'impact_stone'
  | 'drag_whoosh'
  | 'soft_drop'
  | 'ignite_fire'
  | 'tink';

export interface Action {
  type: ActionType;
  flag?: string;
  value?: any;
  targetId?: string;
  url?: string;
  payload?: any;
  message?: string;
  entityId?: string;
  sound?: SoundEffect;
  color?: string;
  nftName?: string;
  contractAddress?: string;
  token?: string;
  position?: { x: number, y: number, z: number };
  atmosphere?: string;
  animationType?: 'floating' | 'spinning' | 'pulsing' | 'steaming' | 'chopping';
  spawnEntitySpec?: EntitySpec;
  scoreDelta?: number;
  livesDelta?: number;
  duration?: number;
  impulse?: { x: number, y: number, z: number };
  state?: string;
  relation?: SemanticRelation;
  partId?: string;
  sourceEntityId?: string;
  targetEntityId?: string;
}

export interface RuleSpec {
  id: string;
  trigger: string;
  conditions: any[];
  actions: Action[];
}

export interface TaskStep {
  id: string;
  title: string;
  description?: string;
  targetEntityId?: string;
  targetZoneId?: string;
  requiredEvent: string;
  hint?: string;
  completed: boolean;
  interactRadius?: number;
}

export interface QuestSpec {
  id: string;
  title: string;
  description?: string;
  category?: 'cuisine' | 'formation' | 'fle' | 'seminaire' | 'luxury' | 'nature' | 'science' | 'mecanique' | 'personnalise';
  steps: TaskStep[];
  currentStepIndex: number;
  status: 'idle' | 'in_progress' | 'completed';
  rewardSound?: SoundEffect;
}

export interface Invariant {
  id: string;
  description: string;
  condition?: any; // e.g., { type: 'never_state', state: 'completed', without_flag: 'inspected' }
  satisfied?: boolean;
  severity?: string;
}

export interface WorldIR {
  entities: Record<EntityId, EntitySpec>;
  rules: Record<string, RuleSpec>;
  invariants: Record<string, Invariant>;
  quests?: Record<string, QuestSpec>;
  activeQuestId?: string | null;
}

export interface GameplayState {
  score: number;
  highScore: number;
  lives: number;
  maxLives: number;
  timer: number | null;
  isTimerActive: boolean;
  gameStatus: 'idle' | 'running' | 'victory' | 'game_over';
  title?: string;
  gameMode?: 'target_range' | 'puzzle_locks' | 'gem_collector' | 'survival_hazard' | 'custom';
}

export interface WorldState {
  version: number;
  ir: WorldIR;
  flags: Record<string, boolean>; // for tracking runtime state like "inspected"
  gameplay?: GameplayState;
}

export interface WorldPatch {
  entitiesCreated?: EntitySpec[];
  entitiesRemoved?: EntityId[];
  entitiesChanged?: Partial<EntitySpec>[];
  rulesChanged?: Partial<RuleSpec>[];
  invariantsAdded?: Invariant[];
  questsAdded?: QuestSpec[];
  activeQuestId?: string | null;
  questUpdated?: Partial<QuestSpec>;
  gameplayPatch?: Partial<GameplayState>;
  persona?: any;
  worldTheme?: string;
}

export interface WorldEvent {
  type: string;
  sourceId: string;
  targetId?: string;
  payload?: any;
}


