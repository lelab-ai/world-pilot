import { WorldPatch, EntitySpec, RuleSpec, Invariant, GameplayState } from '../core/types';

export const defaultGameplayState: GameplayState = {
  score: 0,
  highScore: 0,
  lives: 3,
  maxLives: 3,
  timer: null,
  isTimerActive: false,
  gameStatus: 'idle',
  title: 'Exploration Libre',
  gameMode: 'custom'
};

export interface GameplayPresetSpec {
  id: string;
  title: string;
  category: string;
  description: string;
  icon: string;
  gameMode: GameplayState['gameMode'];
  createPatch: () => WorldPatch;
}

/**
 * 1. STAND DE TIR PHYSIQUE RAPIER
 * Cibles physiques Rapier basculantes et réactives avec chronomètre de 30 secondes et scoring.
 */
export function createTargetRangeGame(): WorldPatch {
  const entitiesCreated: EntitySpec[] = [
    // Base Plinth Runner
    {
      id: 'target_range_base',
      name: 'Stand de Tir · Socle de tir',
      capabilities: [
        { type: 'transform', position: { x: 0, y: 0.05, z: -1.2 }, scale: { x: 5.5, y: 0.1, z: 2.2 } }
      ],
      visuals: { shape: 'box', color: '#1e293b' }
    },
    // Target 1
    {
      id: 'target_alpha',
      name: 'Cible Alpha (50 pts)',
      capabilities: [
        { type: 'transform', position: { x: -1.8, y: 0.75, z: -1.2 }, scale: { x: 0.5, y: 0.9, z: 0.15 } },
        { type: 'interactive' },
        { type: 'draggable' }
      ],
      visuals: { shape: 'cylinder', color: '#f97316' }
    },
    // Target 2
    {
      id: 'target_beta',
      name: 'Cible Bêta (50 pts)',
      capabilities: [
        { type: 'transform', position: { x: -0.6, y: 0.95, z: -1.4 }, scale: { x: 0.45, y: 1.1, z: 0.15 } },
        { type: 'interactive' },
        { type: 'draggable' }
      ],
      visuals: { shape: 'cylinder', color: '#06b6d4' }
    },
    // Target 3
    {
      id: 'target_gamma',
      name: 'Cible Gamma (50 pts)',
      capabilities: [
        { type: 'transform', position: { x: 0.6, y: 0.95, z: -1.4 }, scale: { x: 0.45, y: 1.1, z: 0.15 } },
        { type: 'interactive' },
        { type: 'draggable' }
      ],
      visuals: { shape: 'cylinder', color: '#eab308' }
    },
    // Target 4
    {
      id: 'target_delta',
      name: 'Cible Delta (50 pts)',
      capabilities: [
        { type: 'transform', position: { x: 1.8, y: 0.75, z: -1.2 }, scale: { x: 0.5, y: 0.9, z: 0.15 } },
        { type: 'interactive' },
        { type: 'draggable' }
      ],
      visuals: { shape: 'cylinder', color: '#ec4899' }
    },
    // Blaster Display Console
    {
      id: 'blaster_console',
      name: 'Console de Contrôle du Stand',
      capabilities: [
        { type: 'transform', position: { x: 0, y: 0.45, z: 0.5 }, scale: { x: 0.8, y: 0.8, z: 0.5 } },
        { type: 'interactive' }
      ],
      visuals: { shape: 'box', color: '#334155' }
    }
  ];

  const rulesChanged: RuleSpec[] = [
    // Rule Target 1 Hit
    {
      id: 'rule_hit_alpha',
      trigger: 'INTERACT',
      conditions: [{ type: 'is_source', sourceId: 'target_alpha' }],
      actions: [
        { type: 'increment_score', scoreDelta: 50 },
        { type: 'play_sound', sound: 'target_hit' },
        { type: 'change_color', entityId: 'target_alpha', color: '#22c55e' },
        { type: 'set_flag', flag: 'hit_target_alpha', value: true },
        { type: 'show_warning', message: '🎯 Cible Alpha abattue ! +50 points' }
      ]
    },
    // Rule Target 2 Hit
    {
      id: 'rule_hit_beta',
      trigger: 'INTERACT',
      conditions: [{ type: 'is_source', sourceId: 'target_beta' }],
      actions: [
        { type: 'increment_score', scoreDelta: 50 },
        { type: 'play_sound', sound: 'target_hit' },
        { type: 'change_color', entityId: 'target_beta', color: '#22c55e' },
        { type: 'set_flag', flag: 'hit_target_beta', value: true },
        { type: 'show_warning', message: '🎯 Cible Bêta abattue ! +50 points' }
      ]
    },
    // Rule Target 3 Hit
    {
      id: 'rule_hit_gamma',
      trigger: 'INTERACT',
      conditions: [{ type: 'is_source', sourceId: 'target_gamma' }],
      actions: [
        { type: 'increment_score', scoreDelta: 50 },
        { type: 'play_sound', sound: 'target_hit' },
        { type: 'change_color', entityId: 'target_gamma', color: '#22c55e' },
        { type: 'set_flag', flag: 'hit_target_gamma', value: true },
        { type: 'show_warning', message: '🎯 Cible Gamma abattue ! +50 points' }
      ]
    },
    // Rule Target 4 Hit
    {
      id: 'rule_hit_delta',
      trigger: 'INTERACT',
      conditions: [{ type: 'is_source', sourceId: 'target_delta' }],
      actions: [
        { type: 'increment_score', scoreDelta: 50 },
        { type: 'play_sound', sound: 'target_hit' },
        { type: 'change_color', entityId: 'target_delta', color: '#22c55e' },
        { type: 'set_flag', flag: 'hit_target_delta', value: true },
        { type: 'show_warning', message: '🎯 Cible Delta abattue ! +50 points' }
      ]
    },
    // Reset / Restart from Console
    {
      id: 'rule_reset_stand',
      trigger: 'INTERACT',
      conditions: [{ type: 'is_source', sourceId: 'blaster_console' }],
      actions: [
        { type: 'reset_game' },
        { type: 'set_timer', duration: 30 },
        { type: 'change_color', entityId: 'target_alpha', color: '#f97316' },
        { type: 'change_color', entityId: 'target_beta', color: '#06b6d4' },
        { type: 'change_color', entityId: 'target_gamma', color: '#eab308' },
        { type: 'change_color', entityId: 'target_delta', color: '#ec4899' },
        { type: 'show_warning', message: '🔄 Stand de tir réinitialisé ! Chronomètre 30s enclenché.' }
      ]
    }
  ];

  const invariantsAdded: Invariant[] = [
    {
      id: 'inv_target_range_victory',
      description: 'La victoire au stand de tir requiert d’abattre toutes les cibles (200 points)',
      condition: { type: 'never_state', stateFlag: 'victory_achieved', requiredFlag: 'score_ge_200' }
    }
  ];

  return {
    entitiesCreated,
    rulesChanged,
    invariantsAdded,
    gameplayPatch: {
      score: 0,
      lives: 3,
      maxLives: 3,
      timer: 30,
      isTimerActive: true,
      gameStatus: 'running',
      title: 'Stand de Tir Spatial Rapier',
      gameMode: 'target_range'
    }
  };
}

/**
 * 2. ÉNIGME SPATIALE DES 3 TOTEMS
 * Dalles causales séquentielles déverrouillant un coffre ancestral avec fanfare.
 */
export function createPuzzleLocksGame(): WorldPatch {
  const entitiesCreated: EntitySpec[] = [
    // Totem 1: Soleil (Or)
    {
      id: 'totem_sun',
      name: 'Totem Solaire · Sceau I',
      capabilities: [
        { type: 'transform', position: { x: -1.6, y: 0.5, z: -0.8 }, scale: { x: 0.55, y: 1.0, z: 0.55 } },
        { type: 'interactive' }
      ],
      visuals: { shape: 'cylinder', color: '#eab308' }
    },
    // Totem 2: Lune (Argent)
    {
      id: 'totem_moon',
      name: 'Totem Lunaire · Sceau II',
      capabilities: [
        { type: 'transform', position: { x: 0, y: 0.5, z: -1.2 }, scale: { x: 0.55, y: 1.0, z: 0.55 } },
        { type: 'interactive' }
      ],
      visuals: { shape: 'cylinder', color: '#94a3b8' }
    },
    // Totem 3: Étoile (Améthyste)
    {
      id: 'totem_star',
      name: 'Totem Astral · Sceau III',
      capabilities: [
        { type: 'transform', position: { x: 1.6, y: 0.5, z: -0.8 }, scale: { x: 0.55, y: 1.0, z: 0.55 } },
        { type: 'interactive' }
      ],
      visuals: { shape: 'cylinder', color: '#a855f7' }
    },
    // Le Coffre Ancestral
    {
      id: 'mystery_chest',
      name: 'Coffre Scellé des Anciens',
      capabilities: [
        { type: 'transform', position: { x: 0, y: 0.35, z: 0.2 }, scale: { x: 0.8, y: 0.65, z: 0.6 } },
        { type: 'interactive' }
      ],
      visuals: { shape: 'box', color: '#451a03' }
    }
  ];

  const rulesChanged: RuleSpec[] = [
    // Step 1: Click Sun Totem
    {
      id: 'rule_totem_sun',
      trigger: 'INTERACT',
      conditions: [{ type: 'is_source', sourceId: 'totem_sun' }],
      actions: [
        { type: 'set_flag', flag: 'sun_aligned', value: true },
        { type: 'change_color', entityId: 'totem_sun', color: '#fef08a' },
        { type: 'play_sound', sound: 'switch_click' },
        { type: 'show_warning', message: '☀️ Sceau Solaire activé ! Le totem brille d’un éclat d’or.' }
      ]
    },
    // Step 2: Click Moon Totem (Requires Sun)
    {
      id: 'rule_totem_moon',
      trigger: 'INTERACT',
      conditions: [
        { type: 'is_source', sourceId: 'totem_moon' },
        { type: 'require_flag', flag: 'sun_aligned' }
      ],
      actions: [
        { type: 'set_flag', flag: 'moon_aligned', value: true },
        { type: 'change_color', entityId: 'totem_moon', color: '#f1f5f9' },
        { type: 'play_sound', sound: 'switch_click' },
        { type: 'show_warning', message: '🌙 Sceau Lunaire activé ! L’onde de résonance s’étend.' }
      ]
    },
    // Step 3: Click Star Totem (Requires Moon)
    {
      id: 'rule_totem_star',
      trigger: 'INTERACT',
      conditions: [
        { type: 'is_source', sourceId: 'totem_star' },
        { type: 'require_flag', flag: 'moon_aligned' }
      ],
      actions: [
        { type: 'set_flag', flag: 'all_totems_aligned', value: true },
        { type: 'change_color', entityId: 'totem_star', color: '#d8b4fe' },
        { type: 'play_sound', sound: 'chime' },
        { type: 'show_warning', message: '⭐ Alignement parfait ! Les 3 sceaux sont rompus, le coffre brille.' },
        { type: 'change_color', entityId: 'mystery_chest', color: '#f59e0b' }
      ]
    },
    // Open the Chest
    {
      id: 'rule_open_chest',
      trigger: 'INTERACT',
      conditions: [
        { type: 'is_source', sourceId: 'mystery_chest' },
        { type: 'require_flag', flag: 'all_totems_aligned' }
      ],
      actions: [
        { type: 'set_flag', flag: 'chest_opened', value: true },
        { type: 'increment_score', scoreDelta: 300 },
        { type: 'trigger_victory', message: '✨ VICTOIRE ! Le Coffre des Anciens a été descellé (+300 pts) !' },
        { type: 'emit_particles', entityId: 'mystery_chest', animationType: 'steaming' },
        { type: 'play_sound', sound: 'fanfare' }
      ]
    }
  ];

  const invariantsAdded: Invariant[] = [
    {
      id: 'inv_chest_never_without_totems',
      description: 'Le coffre des Anciens ne peut jamais s’ouvrir sans l’alignement des 3 totems',
      condition: { type: 'never_state', stateFlag: 'chest_opened', requiredFlag: 'all_totems_aligned' }
    }
  ];

  return {
    entitiesCreated,
    rulesChanged,
    invariantsAdded,
    gameplayPatch: {
      score: 0,
      lives: 3,
      maxLives: 3,
      timer: null,
      isTimerActive: false,
      gameStatus: 'running',
      title: 'Énigme des 3 Totems Célestes',
      gameMode: 'puzzle_locks'
    }
  };
}

/**
 * 3. COURSE AUX ORBES CÉLESTES
 * 5 gemmes étincelantes en lévitation, collecte rapide avec sons sparkle et victoire à 500 points.
 */
export function createGemCollectorGame(): WorldPatch {
  const gemPositions = [
    { id: 'gem_1', pos: { x: -2.0, y: 1.2, z: -1.0 }, color: '#38bdf8', val: 100 },
    { id: 'gem_2', pos: { x: -1.0, y: 1.6, z: -0.4 }, color: '#34d399', val: 100 },
    { id: 'gem_3', pos: { x: 0.0, y: 1.3, z: -1.2 }, color: '#fbbf24', val: 100 },
    { id: 'gem_4', pos: { x: 1.0, y: 1.7, z: -0.6 }, color: '#f43f5e', val: 100 },
    { id: 'gem_5', pos: { x: 2.0, y: 1.4, z: -1.0 }, color: '#a855f7', val: 100 }
  ];

  const entitiesCreated: EntitySpec[] = gemPositions.map(g => ({
    id: g.id,
    name: `Orbe Céleste (${g.val} pts)`,
    capabilities: [
      { type: 'transform', position: g.pos, scale: { x: 0.35, y: 0.35, z: 0.35 } },
      { type: 'animated', animationType: 'floating', active: true },
      { type: 'interactive' }
    ],
    visuals: { shape: 'sphere', color: g.color }
  }));

  const rulesChanged: RuleSpec[] = gemPositions.map(g => ({
    id: `rule_collect_${g.id}`,
    trigger: 'INTERACT',
    conditions: [{ type: 'is_source', sourceId: g.id }],
    actions: [
      { type: 'destroy_entity', entityId: g.id },
      { type: 'increment_score', scoreDelta: g.val },
      { type: 'play_sound', sound: 'sparkle' },
      { type: 'emit_particles', entityId: g.id, animationType: 'pulsing' },
      { type: 'set_flag', flag: `collected_${g.id}`, value: true },
      { type: 'show_warning', message: `💎 Orbe collecté ! +${g.val} points` }
    ]
  }));

  return {
    entitiesCreated,
    rulesChanged,
    gameplayPatch: {
      score: 0,
      lives: 3,
      maxLives: 3,
      timer: 45,
      isTimerActive: true,
      gameStatus: 'running',
      title: 'Course aux Orbes Célestes',
      gameMode: 'gem_collector'
    }
  };
}

/**
 * 4. SURVIE EN ZONE RADIOACTIVE
 * Cœur instable à zone de danger où l'on perd des vies si on y entre, avec module de régénération.
 */
export function createSurvivalHazardGame(): WorldPatch {
  const entitiesCreated: EntitySpec[] = [
    // Le Cœur Radioactive
    {
      id: 'radioactive_core',
      name: 'Réacteur Instable',
      capabilities: [
        { type: 'transform', position: { x: -1.2, y: 0.6, z: -1.0 }, scale: { x: 0.8, y: 1.2, z: 0.8 } },
        { type: 'animated', animationType: 'pulsing', active: true },
        { type: 'interactive' }
      ],
      visuals: { shape: 'cylinder', color: '#ef4444' }
    },
    // Zone de Danger
    {
      id: 'hazard_zone',
      name: 'Périmètre Radioactif Critique',
      capabilities: [
        { type: 'transform', position: { x: -1.2, y: 0.04, z: -1.0 }, scale: { x: 3.2, y: 0.06, z: 3.2 } },
        { type: 'trigger_zone', radius: 1.6 },
        { type: 'collider' },
        { type: 'interactive' }
      ],
      visuals: { shape: 'box', color: '#7f1d1d' }
    },
    // Module de Régénération
    {
      id: 'healing_pod',
      name: 'Station Médicale de Décontamination',
      capabilities: [
        { type: 'transform', position: { x: 1.5, y: 0.6, z: 0.2 }, scale: { x: 0.7, y: 1.2, z: 0.7 } },
        { type: 'interactive' }
      ],
      visuals: { shape: 'box', color: '#10b981' }
    }
  ];

  const rulesChanged: RuleSpec[] = [
    // Hazard Zone damage
    {
      id: 'rule_hazard_hit',
      trigger: 'INTERACT',
      conditions: [{ type: 'is_source', sourceId: 'hazard_zone' }],
      actions: [
        { type: 'adjust_lives', livesDelta: -1 },
        { type: 'play_sound', sound: 'laser' },
        { type: 'show_warning', message: '⚠️ Radiations détectées ! -1 Point de Vie' }
      ]
    },
    // Radioactive Core damage
    {
      id: 'rule_core_hit',
      trigger: 'INTERACT',
      conditions: [{ type: 'is_source', sourceId: 'radioactive_core' }],
      actions: [
        { type: 'adjust_lives', livesDelta: -1 },
        { type: 'play_sound', sound: 'explosion' },
        { type: 'show_warning', message: '💥 Choc thermique réacteur ! -1 Point de Vie' }
      ]
    },
    // Healing Pod restore
    {
      id: 'rule_heal',
      trigger: 'INTERACT',
      conditions: [{ type: 'is_source', sourceId: 'healing_pod' }],
      actions: [
        { type: 'adjust_lives', livesDelta: +1 },
        { type: 'play_sound', sound: 'chime' },
        { type: 'increment_score', scoreDelta: 50 },
        { type: 'show_warning', message: '🛡️ Décontamination réussie : +1 Vie, +50 pts !' }
      ]
    }
  ];

  return {
    entitiesCreated,
    rulesChanged,
    gameplayPatch: {
      score: 0,
      lives: 3,
      maxLives: 3,
      timer: 60,
      isTimerActive: true,
      gameStatus: 'running',
      title: 'Survie en Zone Radioactive',
      gameMode: 'survival_hazard'
    }
  };
}

/**
 * 5. TAQUIN 3D & PUZZLE COULISSANT 5x5
 * Plateau de puzzle avec 24 dalles coulissantes numérotées, cadre biseauté et commandes de jeu.
 */
export function create3DPuzzleGame(gridSize = 5): WorldPatch {
  const entitiesCreated: EntitySpec[] = [];
  const rulesChanged: RuleSpec[] = [];

  // 1. Cadre et socle en bois laqué / métal du plateau de puzzle
  entitiesCreated.push({
    id: 'puzzle_board_tray',
    name: 'Plateau du Taquin 3D 5x5',
    capabilities: [
      { type: 'transform', position: { x: 0, y: 0.04, z: -0.1 }, scale: { x: 2.7, y: 0.08, z: 2.7 } },
      { type: 'collider' }
    ],
    visuals: { shape: 'box', color: '#0f172a' }
  });

  // Bouton de mélange
  entitiesCreated.push({
    id: 'puzzle_scramble_btn',
    name: 'Bouton Mélanger (Scramble)',
    capabilities: [
      { type: 'transform', position: { x: -0.75, y: 0.12, z: 1.35 }, scale: { x: 0.45, y: 0.06, z: 0.25 } },
      { type: 'interactive' }
    ],
    visuals: { shape: 'box', color: '#0284c7' }
  });

  // Bouton de résolution
  entitiesCreated.push({
    id: 'puzzle_solve_btn',
    name: 'Bouton Résoudre (Solve)',
    capabilities: [
      { type: 'transform', position: { x: 0.75, y: 0.12, z: 1.35 }, scale: { x: 0.45, y: 0.06, z: 0.25 } },
      { type: 'interactive' }
    ],
    visuals: { shape: 'box', color: '#16a34a' }
  });

  const colors = [
    '#38bdf8', '#0ea5e9', '#0284c7', '#0369a1', '#075985',
    '#2dd4bf', '#14b8a6', '#0d9488', '#0f766e', '#115e59',
    '#4ade80', '#22c55e', '#16a34a', '#15803d', '#166534',
    '#fbbf24', '#f59e0b', '#d97706', '#b45309', '#92400e',
    '#f87171', '#ef4444', '#dc2626', '#b91c1c'
  ];

  const step = 0.48;
  const startOffset = -((gridSize - 1) * step) / 2; // -0.96

  let tileNumber = 1;
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      if (row === gridSize - 1 && col === gridSize - 1) {
        // Slot 25 is the empty slot!
        continue;
      }
      const x = Number((startOffset + col * step).toFixed(3));
      const z = Number((startOffset + row * step - 0.1).toFixed(3));
      const tileId = `puzzle_tile_${String(tileNumber).padStart(2, '0')}`;
      const tileColor = colors[(tileNumber - 1) % colors.length];

      entitiesCreated.push({
        id: tileId,
        name: `Tuile N°${tileNumber}`,
        capabilities: [
          { type: 'transform', position: { x, y: 0.11, z }, scale: { x: 0.44, y: 0.045, z: 0.44 } },
          { type: 'interactive' },
          { type: 'draggable' }
        ],
        visuals: { shape: 'box', color: tileColor }
      });

      // Interactive rule for clicking tile
      rulesChanged.push({
        id: `rule_click_${tileId}`,
        trigger: 'INTERACT',
        conditions: [{ type: 'is_source', sourceId: tileId }],
        actions: [
          { type: 'play_sound', sound: 'impact_wood' },
          { type: 'increment_score', scoreDelta: 1 },
          { type: 'show_warning', message: `🧩 Tuile N°${tileNumber} déplacée (+1 coup)` }
        ]
      });

      tileNumber++;
    }
  }

  // Scramble rule
  rulesChanged.push({
    id: 'rule_puzzle_scramble',
    trigger: 'INTERACT',
    conditions: [{ type: 'is_source', sourceId: 'puzzle_scramble_btn' }],
    actions: [
      { type: 'play_sound', sound: 'switch_click' },
      { type: 'show_warning', message: '🔀 Puzzle 5x5 mélangé ! Faites glisser les tuiles pour reconstituer la suite.' }
    ]
  });

  // Solve rule
  rulesChanged.push({
    id: 'rule_puzzle_solve',
    trigger: 'INTERACT',
    conditions: [{ type: 'is_source', sourceId: 'puzzle_solve_btn' }],
    actions: [
      { type: 'play_sound', sound: 'fanfare' },
      { type: 'trigger_victory', message: '🏆 Puzzle 5x5 résolu à la perfection !' }
    ]
  });

  return {
    entitiesCreated,
    rulesChanged,
    gameplayPatch: {
      score: 0,
      lives: 3,
      maxLives: 3,
      timer: null,
      isTimerActive: false,
      gameStatus: 'running',
      title: 'Taquin 3D · Puzzle 5x5',
      gameMode: 'custom'
    }
  };
}

/**
 * 6. JEU DE GO TRADITIONNEL (GOBAN 9x9 & PIERRES NOIR ET BLANC)
 * Plateau traditionnel Goban en bois de Kaya avec grille 9x9, hoshi, bols Goke et pierres de go (Kuroishi/Shiroishi)
 * équipées de saisie 3D fluide, sans fenêtres intrusives, snap-to-grid aux intersections et son d'impact de pierre authentique (impact_stone).
 */
export function createGoGame(): WorldPatch {
  const entitiesCreated: EntitySpec[] = [
    // 1. Goban Table (Traditional Kaya wood Go board with chamfered profile and feet)
    {
      id: 'goban_table',
      name: 'Goban traditionnel en bois de Kaya (9x9)',
      capabilities: [
        { type: 'transform', position: { x: 0, y: 0.72, z: 0 }, scale: { x: 1.05, y: 0.12, z: 1.05 } },
        { type: 'collider' }
      ],
      visuals: { shape: 'box', color: '#d49b52', assetId: 'wp-goban' }
    },
    // 2. Bol Goke Noir (Joueur Noir)
    {
      id: 'goke_bowl_black',
      name: 'Bol de pierres noires (Goke)',
      capabilities: [
        { type: 'transform', position: { x: 0.68, y: 0.78, z: 0.35 }, scale: { x: 0.22, y: 0.10, z: 0.22 } },
        { type: 'collider' },
        { type: 'interactive' }
      ],
      visuals: { shape: 'cylinder', color: '#271c19', assetId: 'wp-goke' }
    },
    // 3. Bol Goke Blanc (Joueur Blanc)
    {
      id: 'goke_bowl_white',
      name: 'Bol de pierres blanches (Goke)',
      capabilities: [
        { type: 'transform', position: { x: -0.68, y: 0.78, z: -0.35 }, scale: { x: 0.22, y: 0.10, z: 0.22 } },
        { type: 'collider' },
        { type: 'interactive' }
      ],
      visuals: { shape: 'cylinder', color: '#4a3728', assetId: 'wp-goke' }
    },
    // 4. Bouton Tour / Passer
    {
      id: 'go_pass_btn',
      name: 'Passer son tour (Pass)',
      capabilities: [
        { type: 'transform', position: { x: 0.68, y: 0.78, z: -0.35 }, scale: { x: 0.18, y: 0.05, z: 0.12 } },
        { type: 'interactive' }
      ],
      visuals: { shape: 'box', color: '#0284c7' }
    },
    // 5. Bouton Nouvelle Partie / Reset
    {
      id: 'go_reset_btn',
      name: 'Nouvelle partie de Go',
      capabilities: [
        { type: 'transform', position: { x: -0.68, y: 0.78, z: 0.35 }, scale: { x: 0.18, y: 0.05, z: 0.12 } },
        { type: 'interactive' }
      ],
      visuals: { shape: 'box', color: '#e11d48' }
    }
  ];

  const rulesChanged: RuleSpec[] = [];

  // Spawn playable Black stones (Kuroishi)
  for (let i = 1; i <= 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const px = Number((0.68 + Math.cos(angle) * 0.08).toFixed(3));
    const pz = Number((0.35 + Math.sin(angle) * 0.08).toFixed(3));
    const stoneId = `go_stone_black_${i}`;

    entitiesCreated.push({
      id: stoneId,
      name: `Pierre noire N°${i}`,
      capabilities: [
        { type: 'transform', position: { x: px, y: 0.84, z: pz }, scale: { x: 0.076, y: 0.022, z: 0.076 } },
        { type: 'interactive' },
        { type: 'draggable' }
      ],
      visuals: { shape: 'cylinder', color: '#18181b', assetId: 'wp-pierre-go' }
    });

    rulesChanged.push({
      id: `rule_click_${stoneId}`,
      trigger: 'INTERACT',
      conditions: [{ type: 'is_source', sourceId: stoneId }],
      actions: [
        { type: 'play_sound', sound: 'impact_stone' },
        { type: 'increment_score', scoreDelta: 1 },
        { type: 'show_warning', message: `⚫ Pierre noire N°${i} jouée (+1 coup)` }
      ]
    });
  }

  // Spawn playable White stones (Shiroishi)
  for (let i = 1; i <= 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const px = Number((-0.68 + Math.cos(angle) * 0.08).toFixed(3));
    const pz = Number((-0.35 + Math.sin(angle) * 0.08).toFixed(3));
    const stoneId = `go_stone_white_${i}`;

    entitiesCreated.push({
      id: stoneId,
      name: `Pierre blanche N°${i}`,
      capabilities: [
        { type: 'transform', position: { x: px, y: 0.84, z: pz }, scale: { x: 0.076, y: 0.022, z: 0.076 } },
        { type: 'interactive' },
        { type: 'draggable' }
      ],
      visuals: { shape: 'cylinder', color: '#f8fafc', assetId: 'wp-pierre-go' }
    });

    rulesChanged.push({
      id: `rule_click_${stoneId}`,
      trigger: 'INTERACT',
      conditions: [{ type: 'is_source', sourceId: stoneId }],
      actions: [
        { type: 'play_sound', sound: 'impact_stone' },
        { type: 'increment_score', scoreDelta: 1 },
        { type: 'show_warning', message: `⚪ Pierre blanche N°${i} jouée (+1 coup)` }
      ]
    });
  }

  // Pre-placed Black stone at Tengen (centre)
  entitiesCreated.push({
    id: 'go_stone_black_tengen',
    name: 'Pierre noire de Tengen (Centre)',
    capabilities: [
      { type: 'transform', position: { x: 0, y: 0.79, z: 0 }, scale: { x: 0.076, y: 0.022, z: 0.076 } },
      { type: 'interactive' },
      { type: 'draggable' }
    ],
    visuals: { shape: 'cylinder', color: '#18181b', assetId: 'wp-pierre-go' }
  });

  rulesChanged.push({
    id: 'rule_click_tengen',
    trigger: 'INTERACT',
    conditions: [{ type: 'is_source', sourceId: 'go_stone_black_tengen' }],
    actions: [
      { type: 'play_sound', sound: 'impact_stone' },
      { type: 'show_warning', message: '⚫ Pierre noire posée au centre céleste (Tengen) !' }
    ]
  });

  // Pass rule
  rulesChanged.push({
    id: 'rule_go_pass',
    trigger: 'INTERACT',
    conditions: [{ type: 'is_source', sourceId: 'go_pass_btn' }],
    actions: [
      { type: 'play_sound', sound: 'chime' },
      { type: 'show_warning', message: '⚪ Tour passé ! À votre adversaire de jouer.' }
    ]
  });

  // Reset rule
  rulesChanged.push({
    id: 'rule_go_reset',
    trigger: 'INTERACT',
    conditions: [{ type: 'is_source', sourceId: 'go_reset_btn' }],
    actions: [
      { type: 'play_sound', sound: 'switch_click' },
      { type: 'show_warning', message: '🔄 Plateau de Go réinitialisé. Noir a le trait.' }
    ]
  });

  return {
    entitiesCreated,
    rulesChanged,
    questsAdded: [
      {
        id: 'quest_game_of_go',
        title: 'Partie de Go Traditionnelle',
        description: 'Prenez une pierre dans votre bol et déposez-la sur une intersection du Goban pour capturer le territoire.',
        currentStepIndex: 0,
        status: 'in_progress',
        steps: [
          {
            id: 'step_go_open',
            title: 'Jouer le premier coup',
            description: 'Glissez une pierre noire vers une intersection du Goban en bois.',
            requiredEvent: 'DROP:go_stone_black_1:goban_table',
            targetEntityId: 'go_stone_black_1',
            targetZoneId: 'goban_table',
            completed: false
          },
          {
            id: 'step_go_reply',
            title: 'Répondre avec Blanc',
            description: 'Déposez une pierre blanche pour établir une base de vie solide.',
            requiredEvent: 'DROP:go_stone_white_1:goban_table',
            targetEntityId: 'go_stone_white_1',
            targetZoneId: 'goban_table',
            completed: false
          },
          {
            id: 'step_go_pass',
            title: 'Conclure le combat',
            description: 'Appuyez sur le bouton Passer son tour une fois le territoire consolidé.',
            requiredEvent: 'INTERACT:go_pass_btn',
            targetEntityId: 'go_pass_btn',
            completed: false
          }
        ]
      }
    ],
    activeQuestId: 'quest_game_of_go',
    gameplayPatch: {
      score: 0,
      lives: 3,
      maxLives: 3,
      timer: null,
      isTimerActive: false,
      gameStatus: 'running',
      title: 'Partie de Go · Goban 9x9',
      gameMode: 'custom'
    }
  };
}

export const gameplayPresets: GameplayPresetSpec[] = [
  {
    id: 'target-range',
    title: 'Stand de Tir Spatial Rapier',
    category: 'Précision & Physique Rapier',
    description: 'Abattez 4 cibles dynamiques avant la fin du compte à rebours de 30 secondes.',
    icon: '🎯',
    gameMode: 'target_range',
    createPatch: createTargetRangeGame
  },
  {
    id: 'puzzle-locks',
    title: 'Énigme des 3 Totems Célestes',
    category: 'Causalité & Réflexion',
    description: 'Activez les 3 sceaux dans l’ordre exact (Soleil → Lune → Étoile) pour desceller le coffre.',
    icon: '🧩',
    gameMode: 'puzzle_locks',
    createPatch: createPuzzleLocksGame
  },
  {
    id: 'gem-collector',
    title: 'Course aux Orbes Célestes',
    category: 'Collecte & Agilité',
    description: 'Collectez les 5 orbes en lévitation pour marquer 500 points avant la fin du temps imparti.',
    icon: '💎',
    gameMode: 'gem_collector',
    createPatch: createGemCollectorGame
  },
  {
    id: 'survival-hazard',
    title: 'Survie en Zone Radioactive',
    category: 'Survie & Gestion des Vies',
    description: 'Évitez les radiations du réacteur ou soignez-vous à la station médicale pour survivre.',
    icon: '⚠️',
    gameMode: 'survival_hazard',
    createPatch: createSurvivalHazardGame
  },
  {
    id: 'puzzle-5x5',
    title: 'Taquin 3D · Puzzle 5x5',
    category: 'Logique & Puzzle Coulissant',
    description: 'Reconstituez les 24 tuiles numérotées sur le plateau coulissant 5x5.',
    icon: '🧩',
    gameMode: 'custom',
    createPatch: () => create3DPuzzleGame(5)
  },
  {
    id: 'go-game',
    title: 'Partie de Go Traditionnelle',
    category: 'Stratégie Millénaire & Goban 3D',
    description: 'Posez vos pierres sur la grille en bois de Kaya avec snappage magnétique et son d’impact de pierre authentique.',
    icon: '⚪',
    gameMode: 'custom',
    createPatch: createGoGame
  }
];

export function getGameplayPreset(id: string): GameplayPresetSpec {
  return gameplayPresets.find(p => p.id === id) || gameplayPresets[0];
}
