// src/library/domainPacks.ts
// Decoupled Domain Cartridges & Open Source Packaging Architecture
// Isolates domain verticals (Gastronomy, FLE, Executive Seminars, Games)
// while keeping Web3 / Victoria VR native to the core runtime.

import type { WorldPatch } from '../core/types';

export interface DomainPackManifest {
  id: string;
  name: string;
  version: string;
  category: 'core' | 'cuisine' | 'education' | 'collaboration' | 'gaming' | 'robotics';
  description: string;
  isOpenSourceDefault: boolean; // Only the core sandbox is bundled in minimal open-source release
  isExternalCartridge: boolean;
  author: string;
  license: string;
  thumbnailIcon: string;
  entitiesCount: number;
  features: string[];
  recommendedQuests: string[];
}

export const CORE_STARTER_PACK: DomainPackManifest = {
  id: 'core-sandbox',
  name: 'WorldPilot Core Sandbox (Open-Source Starter)',
  version: '1.0.0',
  category: 'core',
  description: 'Environnement épuré et universel pour le déploiement open-source. Comprend l’établi technique, le substrat physique Rapier, le terminal Web3 Victoria VR et la transduction tactile 3D.',
  isOpenSourceDefault: true,
  isExternalCartridge: false,
  author: 'WorldPilot Open Source Community',
  license: 'Apache-2.0',
  thumbnailIcon: '🌐',
  entitiesCount: 6,
  features: [
    'Substrat Neuro-Symbolique Spatial (WorldIR)',
    'Écosystème 4-Agents (Humain, Playtester, Garant, Jumeau)',
    'Connecteur Web3 Victoria VR Lands natif',
    'Transduction physique et manipulation sans collision'
  ],
  recommendedQuests: ['quest_core_sandbox_orientation']
};

export const ESCOFFIER_PACK: DomainPackManifest = {
  id: 'escoffier-gastronomy',
  name: 'Cartouche Haute Gastronomie (Escoffier Studio)',
  version: '1.2.0',
  category: 'cuisine',
  description: 'Simulation thermochimique de cuisine professionnelle : découpe au couteau de chef, mijotage en cocotte, gestion du feu, assaisonnement et dressage d’étoile Michelin.',
  isOpenSourceDefault: false,
  isExternalCartridge: true,
  author: 'Escoffier Interactive Labs',
  license: 'Commercial / Add-on Cartridge',
  thumbnailIcon: '👨‍🍳',
  entitiesCount: 14,
  features: [
    'Cinématique de découpe d’ingrédients (brunoise, émincé)',
    'Simulateur thermique de mijotage et évaporation',
    'Évaluation par le Chef IA des équilibres gustatifs',
    'Dressage en dôme ou géométrique avec garnitures'
  ],
  recommendedQuests: ['quest_ratatouille_provencale', 'quest_boeuf_bourguignon']
};

export const FLE_PARIS_PACK: DomainPackManifest = {
  id: 'paris-fle',
  name: 'Cartouche FLE & Immersion Parisienne (Bistrot FLE)',
  version: '1.1.0',
  category: 'education',
  description: 'Immersion linguistique en français langue étrangère : interactions orales avec Victoria, tableau de vocabulaire interactif et commande au comptoir bistrot.',
  isOpenSourceDefault: false,
  isExternalCartridge: true,
  author: 'Paris FLE Alliance',
  license: 'Educational / Cartridge',
  thumbnailIcon: '🥐',
  entitiesCount: 10,
  features: [
    'Studio de prononciation vocale avec score phonétique',
    'Flashcards spatiales ancrées sur le mobilier',
    'Dialogue immersif contextuel bistrot'
  ],
  recommendedQuests: ['quest_fle_cafe_parisien', 'quest_fle_boulangerie']
};

export const EXECUTIVE_SEMINAR_PACK: DomainPackManifest = {
  id: 'executive-seminar',
  name: 'Cartouche Séminaire & Brainstorming Collaboratif',
  version: '1.0.0',
  category: 'collaboration',
  description: 'Salle de conférence exécutive avec tableau blanc 3D collaboratif, clusters de post-its réactifs, votes en temps réel et partage de documents PDF.',
  isOpenSourceDefault: false,
  isExternalCartridge: true,
  author: 'WorldPilot Enterprise',
  license: 'Enterprise / Cartridge',
  thumbnailIcon: '📊',
  entitiesCount: 8,
  features: [
    'Tableau Kanban spatial de post-its synchronisés',
    'Mobilier exécutif ergonomique et projecteur 3D',
    'Gestion des tours de parole et synthèse de réunion'
  ],
  recommendedQuests: ['quest_seminar_brainstorm']
};

export const ARCADE_GAMES_PACK: DomainPackManifest = {
  id: 'games-arcade',
  name: 'Cartouche Stratégie & Arcade (Go 9x9 & Stand de Tir)',
  version: '1.0.0',
  category: 'gaming',
  description: 'Modules de jeu physique et de réflexion stratégique : Goban 9x9 avec prise en main tactile des pierres, stand de tir réactif et taquin 5x5.',
  isOpenSourceDefault: false,
  isExternalCartridge: true,
  author: 'WorldPilot Games Guild',
  license: 'Open Gaming Cartridge',
  thumbnailIcon: '🎲',
  entitiesCount: 22,
  features: [
    'Goban 9x9 avec règles de capture et impact sonore réaliste',
    'Dégagement automatique de l’avatar Victoria en posture d’adversaire',
    'Stand de tir avec réarmement et cibles basculantes'
  ],
  recommendedQuests: ['quest_game_of_go', 'quest_arcade_range']
};

/**
 * Registry of all available domain cartridges.
 */
export const DOMAIN_PACKS_REGISTRY: Record<string, DomainPackManifest> = {
  [CORE_STARTER_PACK.id]: CORE_STARTER_PACK,
  [ESCOFFIER_PACK.id]: ESCOFFIER_PACK,
  [FLE_PARIS_PACK.id]: FLE_PARIS_PACK,
  [EXECUTIVE_SEMINAR_PACK.id]: EXECUTIVE_SEMINAR_PACK,
  [ARCADE_GAMES_PACK.id]: ARCADE_GAMES_PACK
};

/**
 * Returns all registered domain packs.
 */
export function getRegisteredDomainPacks(): DomainPackManifest[] {
  return Object.values(DOMAIN_PACKS_REGISTRY);
}

/**
 * Returns the lean default open-source starter pack.
 */
export function getOpenSourceDefaultPack(): DomainPackManifest {
  return CORE_STARTER_PACK;
}

/**
 * Looks up a domain cartridge by its ID.
 */
export function getDomainPack(packId: string): DomainPackManifest | undefined {
  return DOMAIN_PACKS_REGISTRY[packId];
}

/**
 * Generates the minimal initial patch for the open-source starter pack.
 */
export function buildCoreStarterPatch(): WorldPatch {
  return {
    entitiesCreated: [
      {
        id: 'technical_bench_core',
        name: 'Établi de Recherche Modulaire',
        capabilities: [
          { type: 'transform', position: { x: 0, y: 0.45, z: 0 }, scale: { x: 2.2, y: 0.9, z: 1.1 } },
          { type: 'collider' }
        ],
        visuals: {
          assetId: 'technical-bench',
          modelUrl: '/library/technical-bench.glb'
        }
      },
      {
        id: 'victoria_vr_terminal',
        name: 'Terminal Web3 Victoria VR Lands',
        capabilities: [
          { type: 'transform', position: { x: -0.6, y: 0.95, z: 0 } },
          { type: 'draggable' },
          { type: 'collider' },
          { type: 'web_screen', url: 'https://victoriavr.com' },
          { type: 'educational', text: 'Portail Web3 Victoria VR Lands', value: 1, active: true }
        ],
        visuals: {
          assetId: 'ordinateur',
          modelUrl: '/library/ordinateur.glb'
        }
      },
      {
        id: 'core_data_cube',
        name: 'Cube Causal Déterministe',
        capabilities: [
          { type: 'transform', position: { x: 0.5, y: 0.95, z: 0 } },
          { type: 'draggable' },
          { type: 'collider' },
          { type: 'interactive' }
        ],
        visuals: {
          assetId: 'cube',
          color: '#38bdf8'
        }
      }
    ],
    rulesChanged: [
      {
        id: 'rule_core_sandbox_interact',
        trigger: 'INTERACT',
        conditions: [{ type: 'is_source', sourceId: 'core_data_cube' }],
        actions: [
          { type: 'play_sound', sound: 'chime' },
          { type: 'show_warning', message: '🌐 Écosystème Open Source WorldPilot actif : Substrat Déterministe validé.' }
        ]
      }
    ],
    invariantsAdded: [
      {
        id: 'inv_core_integrity',
        description: 'L’établi central et le terminal Web3 restent dans le repère de simulation.',
        satisfied: true,
        severity: 'critical'
      }
    ],
    questsAdded: [
      {
        id: 'quest_core_sandbox_orientation',
        title: 'Orientation Sandbox Open-Source',
        description: 'Découvrir le substrat déterministe WorldPilot et interagir avec le Cube Causal.',
        category: 'formation',
        status: 'in_progress',
        currentStepIndex: 0,
        steps: [
          {
            id: 'step_core_interact_cube',
            title: 'Activer le Cube Causal Déterministe',
            description: 'Cliquez sur le Cube Causal Déterministe posé sur l’établi.',
            targetEntityId: 'core_data_cube',
            requiredEvent: 'INTERACT',
            completed: false
          }
        ]
      }
    ],
    activeQuestId: 'quest_core_sandbox_orientation'
  };
}
