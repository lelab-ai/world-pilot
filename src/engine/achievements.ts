export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: 'cuisine' | 'fle' | 'seminaire' | 'exploration';
  icon: string;
  rewardSound?: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  // Cuisine
  {
    id: 'first_dish_plated',
    title: 'Premier Dressage',
    description: 'Dresser avec élégance un plat gastronomique sur assiette.',
    category: 'cuisine',
    icon: '🍽️',
    rewardSound: 'sparkle'
  },
  {
    id: 'sauce_artist',
    title: 'Maître Saucier',
    description: 'Napper un plat du ruban de jus/demi-glace 3D lustré.',
    category: 'cuisine',
    icon: '🥄',
    rewardSound: 'sparkle'
  },
  {
    id: 'connoisseur_tasting',
    title: 'Fin Dégustateur',
    description: 'Savourer une bouchée 3D interactive avec les couverts en argent.',
    category: 'cuisine',
    icon: '🍴',
    rewardSound: 'fanfare'
  },
  {
    id: 'chef_3_stars',
    title: 'Grand Chef 3 Étoiles',
    description: 'Obtenir la note suprême de 3 étoiles lors de l\'évaluation gastronomique.',
    category: 'cuisine',
    icon: '⭐',
    rewardSound: 'fanfare'
  },
  {
    id: 'sommelier_accord',
    title: 'Accord Sommelier',
    description: 'Sélectionner un grand cru en accord mets-vins parfait.',
    category: 'cuisine',
    icon: '🍷',
    rewardSound: 'chime'
  },
  {
    id: 'master_cut',
    title: 'Précision Brunoise',
    description: 'Découper un ingrédient jusqu\'au stade ultime de la brunoise.',
    category: 'cuisine',
    icon: '🔪',
    rewardSound: 'tink'
  },
  {
    id: 'chef_advice_sought',
    title: "Disciple d'Escoffier",
    description: "Consulter les conseils vocaux du Chef Auguste Escoffier en pleine préparation.",
    category: 'cuisine',
    icon: '👨‍🍳',
    rewardSound: 'tink'
  },

  // FLE
  {
    id: 'first_fle_quest',
    title: 'Premier Pas en Français',
    description: 'Accomplir avec succès une quête d\'immersion linguistique FLE.',
    category: 'fle',
    icon: '🥖',
    rewardSound: 'fanfare'
  },
  {
    id: 'fle_vocab_master',
    title: 'Polyglotte des Saveurs',
    description: 'Maîtriser 100% des cartes de vocabulaire d\'une scène FLE.',
    category: 'fle',
    icon: '🎓',
    rewardSound: 'fanfare'
  },
  {
    id: 'phonetic_listener',
    title: 'Oreille Attentive',
    description: 'Écouter la prononciation vocale en cadence ralentie (0.75x).',
    category: 'fle',
    icon: '🐢',
    rewardSound: 'tink'
  },
  {
    id: 'fle_quiz_ace',
    title: 'Zéro Faute FLE',
    description: 'Répondre avec exactitude au quiz de compréhension en situation.',
    category: 'fle',
    icon: '🎯',
    rewardSound: 'fanfare'
  },
  {
    id: 'voice_virtuoso',
    title: "Prononciation d'Or",
    description: "S'entraîner à l'oral avec l'analyseur vocal et l'enregistrement phonétique.",
    category: 'fle',
    icon: '🎤',
    rewardSound: 'sparkle'
  },

  // Séminaires
  {
    id: 'first_seminar_quest',
    title: 'Facilitateur Certifié',
    description: 'Agencer et valider une salle de séminaire professionnelle.',
    category: 'seminaire',
    icon: '🏛️',
    rewardSound: 'fanfare'
  },
  {
    id: 'audiovisual_pro',
    title: 'Maître de Conférence',
    description: 'Vérifier les équipements audiovisuels et collaboratifs d\'une salle.',
    category: 'seminaire',
    icon: '📺',
    rewardSound: 'chime'
  },
  {
    id: 'sticky_note_innovator',
    title: 'Innovateur Collaboratif',
    description: "Épingler une note d'idéation ou voter pour une proposition sur le tableau d'équipe.",
    category: 'seminaire',
    icon: '💡',
    rewardSound: 'sparkle'
  },

  // Exploration 3D
  {
    id: 'refuge_alpin',
    title: 'Gardien des Cimes',
    description: 'S\'immerger dans le Sanctuaire Alpin du Refuge Vivant.',
    category: 'exploration',
    icon: '⛰️',
    rewardSound: 'wind'
  },
  {
    id: 'cinematic_director',
    title: 'Cinéaste Virtuel',
    description: 'Activer la visite cinématique ou explorer tous les cadrages caméra.',
    category: 'exploration',
    icon: '🎥',
    rewardSound: 'chime'
  },
  {
    id: 'cognitive_analyst',
    title: 'Boîte Noire Cognitive',
    description: 'Consulter l\'analyse comportementale et le profil IA de votre session.',
    category: 'exploration',
    icon: '🧠',
    rewardSound: 'fanfare'
  },
  {
    id: 'cohort_commander',
    title: 'Commandant de Cohorte',
    description: 'Lancer une simulation prédictive de 100 agents IA synthétiques.',
    category: 'exploration',
    icon: '🤖',
    rewardSound: 'sparkle'
  },
  {
    id: 'ghost_trainee',
    title: "Apprenti de l'Ombre",
    description: 'Activer le guidage fantôme IA pour visualiser une trajectoire recommandée.',
    category: 'exploration',
    icon: '👻',
    rewardSound: 'sparkle'
  },
  {
    id: 'counterfactual_pioneer',
    title: 'Architecte du Multivers',
    description: 'Créer une branche contrefactuelle et comparer la trajectoire humaine à une simulation IA autonome.',
    category: 'exploration',
    icon: '🔀',
    rewardSound: 'fanfare'
  },
  {
    id: 'crisis_manager',
    title: 'Maître de Crise',
    description: 'Résoudre avec succès une anomalie critique injectée pendant la simulation.',
    category: 'exploration',
    icon: '🛡️',
    rewardSound: 'fanfare'
  },
  {
    id: 'zen_operator',
    title: 'Sang-Froid Olympien',
    description: 'Surmonter un coup de feu thermique sans panique ni surchauffe prolongée.',
    category: 'exploration',
    icon: '🧘',
    rewardSound: 'sparkle'
  },
  {
    id: 'symbiotic_duo',
    title: 'Duo Symbiotique',
    description: 'Collaborer avec un agent co-équipier IA incarné et lui déléguer avec succès une tâche de préparation.',
    category: 'exploration',
    icon: '👥',
    rewardSound: 'fanfare'
  },
  {
    id: 'vla_dataset_curator',
    title: "Échantillon JSON exporté",
    description: "Exporter un exemple de trace simulée au format JSON propre à WorldPilot.",
    category: 'exploration',
    icon: '🤖',
    rewardSound: 'sparkle'
  },
  {
    id: 'cognitive_clone_created',
    title: 'Double Virtuel',
    description: 'Générer son premier Jumeau Numérique Cognitif par distillation comportementale et Inverse RL.',
    category: 'exploration',
    icon: '🧬',
    rewardSound: 'fanfare'
  },
  {
    id: 'deep_focus_master',
    title: "Regard d'Aigle",
    description: "Explorer les points d'attention spatiale et visualiser le ruban de scanpath 3D des fixations visuelles.",
    category: 'exploration',
    icon: '👁️',
    rewardSound: 'sparkle'
  },
  {
    id: 'publish_readiness_auditor',
    title: 'Contrôles locaux exécutés',
    description: 'Exécuter les heuristiques locales de WorldPilot sur une scène.',
    category: 'exploration',
    icon: '🛡️',
    rewardSound: 'chime'
  },
  {
    id: 'ai_verse_certified',
    title: 'Contrôles locaux réussis',
    description: 'Obtenir un résultat positif aux vérifications heuristiques locales. Cela ne certifie pas une publication sur une plateforme.',
    category: 'exploration',
    icon: '💎',
    rewardSound: 'fanfare'
  },
  {
    id: 'synthetic_playtester_deployed',
    title: 'Playtester Déployé',
    description: 'Envoyer un agent autonome explorer la scène, éprouver les quêtes et tracer son parcours.',
    category: 'exploration',
    icon: '🤖',
    rewardSound: 'sparkle'
  },
  {
    id: 'minimal_patch_repaired',
    title: 'Auto-Réparation Réussie',
    description: 'Appliquer un Minimal Patch calculé par l\'IA pour résoudre un blocage physique ou causal.',
    category: 'exploration',
    icon: '✨',
    rewardSound: 'sparkle'
  },
  {
    id: 'emergent_affordance_synthesized',
    title: 'Affordance Émergente',
    description: 'Promouvoir une interaction non anticipée captée par le Graphe Causal Fantôme.',
    category: 'exploration',
    icon: '💡',
    rewardSound: 'chime'
  },
  {
    id: 'semantic_blast_radius_proved',
    title: 'Preuve Non-Régression',
    description: 'Établir la preuve formelle d\'invariance causale et de non-régression via le Semantic Blast Radius.',
    category: 'exploration',
    icon: '🛡️',
    rewardSound: 'fanfare'
  },
  {
    id: 'pedagogical_lab_compiled',
    title: 'Simulateur Scientifique Bloom 3D',
    description: 'Compiler un banc d\'expérimentation pédagogique avec appareils réactifs et piège formateur.',
    category: 'exploration',
    icon: '🎓',
    rewardSound: 'sparkle'
  },
  {
    id: 'mdp_dataset_exported',
    title: 'Dataset Robotique MDP',
    description: 'Exporter un dataset de trajectoires spatio-temporelles au standard Open X-Embodiment.',
    category: 'exploration',
    icon: '📥',
    rewardSound: 'fanfare'
  }
];

export function getAchievement(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find(a => a.id === id);
}

export function getAchievementsByCategory(category?: string): Achievement[] {
  if (!category || category === 'all') return ACHIEVEMENTS;
  return ACHIEVEMENTS.filter(a => a.category === category);
}
