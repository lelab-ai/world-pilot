export interface ParametricAttire {
  jacketColor?: string;
  pantsColor?: string;
  shirtColor?: string;
  accessoryType?: 'helmet' | 'glasses' | 'stethoscope' | 'tool_belt' | 'badge' | 'hat' | 'lanyard' | 'none';
  accessoryColor?: string;
}

export interface AgentPersona {
  name: string;
  role: string;
  theme: 'chef' | 'engineer' | 'guide' | 'assistant' | 'luxury' | 'naturalist' | 'mechanic' | 'scientist' | 'custom';
  color: string;
  accentColor: string;
  icon: string;
  greeting: string;
  attire?: ParametricAttire;
}

export const personas: Record<string, AgentPersona> = {
  naturalist: {
    name: 'Sylvain, Guide Naturaliste & Mycologue',
    role: 'Expert Biodiversité, Botanique & Mycologie',
    theme: 'naturalist',
    color: '#15803d',
    accentColor: '#86efac',
    icon: '🌲',
    greeting: 'Bienvenue au cœur de la forêt. Observons ensemble la flore, le biotope et les critères d’identification du vivant.'
  },
  mechanic: {
    name: 'Marc, Maître Mécanicien',
    role: 'Spécialiste Atelier & Génie Mécanique',
    theme: 'mechanic',
    color: '#ea580c',
    accentColor: '#fed7aa',
    icon: '🔧',
    greeting: 'Bienvenue à l’atelier. Outillage en place, respect des couples de serrage et sécurité d’abord.'
  },
  scientist: {
    name: 'Dr. Aris, Chercheur en Sciences & Chimie',
    role: 'Expérimentateur & Pédagogue Scientifique',
    theme: 'scientist',
    color: '#0284c7',
    accentColor: '#e0f2fe',
    icon: '⚗️',
    greeting: 'Bienvenue dans le laboratoire expérimental. Posons une hypothèse, observons les réactions et vérifions par la preuve.'
  },
  chef: {
    name: 'Chef Auguste',
    role: 'Maître Cuisinier & Pédagogue',
    theme: 'chef',
    color: '#f59e0b',
    accentColor: '#ffffff',
    icon: '👨‍🍳',
    greeting: 'Bienvenue à notre atelier gastronomique ! Je serai à vos côtés pour vous guider geste après geste.'
  },
  luxury: {
    name: 'Éléonore, Conseillère Maison',
    role: 'Experte maroquinerie et joaillerie',
    theme: 'luxury',
    color: '#d97706',
    accentColor: '#fbbf24',
    icon: '👜',
    greeting: 'Bienvenue dans notre salon privé. Laissez-moi vous dévoiler les secrets de confection de nos pièces d’exception.'
  },
  engineer: {
    name: 'Ingénieure Nova',
    role: 'Spécialiste systèmes et télémesures',
    theme: 'engineer',
    color: '#06b6d4',
    accentColor: '#10b981',
    icon: '🛠️',
    greeting: 'Protocole de sécurité initialisé. Suivez rigoureusement chaque étape de vérification technique.'
  },
  guide: {
    name: 'Jean, Guide Parisien',
    role: 'Médiateur culturel et FLE',
    theme: 'guide',
    color: '#a855f7',
    accentColor: '#e9d5ff',
    icon: '🥖',
    greeting: 'Bonjour et bienvenue à Paris ! Explorons ensemble cette scène de vie authentique.'
  },
  assistant: {
    name: 'Victoria Pilot',
    role: 'Guide spatial et causal',
    theme: 'assistant',
    color: '#4ade80',
    accentColor: '#22c55e',
    icon: '🤖',
    greeting: 'Bonjour ! Je suis Victoria, votre copilote spatiale. Cliquez sur un objet pour interagir ou concevoir votre monde.'
  }
};

export interface ContextualPersonaQuery {
  category?: string | null;
  worldTheme?: string | null;
  entities?: Record<string, any> | null;
  instruction?: string | null;
  activeQuestTitle?: string | null;
}

export function getAgentPersona(category?: string, contextHint?: string): AgentPersona {
  if (!category) return personas.assistant;
  const cat = category.toLowerCase().trim();
  const hint = (contextHint || '').toLowerCase();
  if (cat === 'luxury' || cat === 'maroquinerie' || cat === 'louis_vuitton' || cat === 'mode') return personas.luxury;
  if (cat === 'cuisine' || cat === 'gastronomie' || cat === 'recette' || cat === 'culinaire') return personas.chef;
  if (cat === 'nature' || cat === 'botanique' || cat === 'mycologie' || cat === 'foret' || cat === 'forêt' || cat === 'environnement') return personas.naturalist;
  if (cat === 'mecanique' || cat === 'mécanique' || cat === 'automobile' || cat === 'auto' || cat === 'garage') return personas.mechanic;
  if (cat === 'science' || cat === 'chimie' || cat === 'physique' || cat === 'labo' || cat === 'laboratoire') return personas.scientist;
  if (cat === 'formation' || cat === 'ingenierie' || cat === 'ingénierie' || cat === 'spatial' || cat === 'systemes') {
    if (hint.includes('batterie') || hint.includes('voiture') || hint.includes('moteur') || hint.includes('châssis') || hint.includes('chassis') || hint.includes('mécanique') || hint.includes('mecanique') || hint.includes('generateur') || hint.includes('générateur')) {
      return personas.mechanic;
    }
    return personas.engineer;
  }
  if (cat === 'fle' || cat === 'langue' || cat === 'paris' || cat === 'culture') return personas.guide;
  return personas.assistant;
}

/**
 * Moteur décisionnel de sélection de persona incarnée contextuelle.
 * Évalue de façon probabiliste et causale :
 * 1. Catégorie sémantique de la quête active
 * 2. Thème de monde / environnement atmosphérique
 * 3. Empreinte sémantique des entités 3D présentes dans la scène
 * 4. Intention explicite du prompt ou du titre d'activité
 */
export function resolveContextualPersona(query?: ContextualPersonaQuery | string): AgentPersona {
  if (typeof query === 'string') {
    return getAgentPersona(query);
  }
  if (!query) return personas.assistant;

  const { category, worldTheme, entities, instruction, activeQuestTitle } = query;

  // Signal sémantique d'appoint
  const combinedContextText = `${activeQuestTitle || ''} ${instruction || ''} ${Object.values(entities || {}).map(e => `${(e as any).name || ''} ${(e as any).id || ''}`).join(' ')}`.toLowerCase();

  // 1. Priorité aux catégories explicites reconnues
  if (category) {
    const persona = getAgentPersona(category, combinedContextText);
    if (persona.theme !== 'assistant') return persona;
  }

  // 2. Évaluation multi-signaux
  const scores: Record<string, number> = {
    naturalist: 0,
    mechanic: 0,
    scientist: 0,
    chef: 0,
    luxury: 0,
    guide: 0,
    engineer: 0,
  };

  // Signal Environnemental / Thème de Monde
  const wt = (worldTheme || '').toLowerCase();
  if (wt === 'forest-clearing' || wt === 'zen-garden' || wt === 'le-refuge' || wt === 'alpine-refuge') scores.naturalist += 9;
  if (wt === 'supercar-showroom' || wt === 'cyberpunk-hangar' || wt === 'cyberpunk-matrix' || wt === 'cyberpunk-neon') scores.mechanic += 8;
  if (wt === 'high-tech-lab' || wt === 'sci-fi-corridor') scores.scientist += 8;
  if (wt === 'cozy-bistrot') scores.chef += 9;
  if (wt === 'luxury-showroom' || wt === 'luxury-salon' || wt === 'penthouse' || wt === 'penthouse-skyline') scores.luxury += 9;
  if (wt === 'contemporary-gallery' || wt === 'paris-rain' || wt === 'paris-boulevard' || wt === 'art-gallery') scores.guide += 9;
  if (wt === 'orbital-zerog' || wt === 'martian-surface' || wt === 'lunar-base') scores.engineer += 7;

  // Signaux Textuels combinés
  const combinedText = `${activeQuestTitle || ''} ${instruction || ''}`.toLowerCase();
  const naturalKw = ['champignon', 'bolet', 'cèpe', 'cepe', 'amanite', 'forêt', 'foret', 'bois', 'cueillette', 'mycolog', 'arbre', 'mousse', 'chêne', 'chene', 'flore', 'botanique', 'nature', 'feuille', 'sous-bois', 'coquillage', 'coquille', 'plage', 'littoral', 'marée', 'maree', 'mer', 'océan', 'ocean', 'sable', 'crustacé', 'crustace', 'mollusque'];
  const mechanicKw = [
    'moteur', 'batterie', 'battery', 'automobile', 'voiture', 'berline', 'vidange',
    'serrage', 'châssis', 'chassis', 'mécanique', 'mecanique', 'multimètre',
    'multimetre', 'couple', 'générateur', 'generateur', 'generator', 'atelier',
    'outillage', 'cosse', 'alternateur', 'capot', 'mecanicien', 'mécanicien'
  ];
  const scienceKw = ['chimie', 'physique', 'réaction', 'reaction', 'éprouvette', 'eprouvette', 'laboratoire', 'atome', 'molécule', 'molecule', 'acide', 'solution', 'spectre'];
  const chefKw = ['cocotte', 'ratatouille', 'recette', 'mijot', 'gastronomie', 'cuisson', 'émincer', 'emincer', 'cuisin', 'ingrédient culinaire', 'sel de guérande', 'assiette'];
  const luxuryKw = ['vuitton', 'speedy', 'capucines', 'maroquinerie', 'haute couture', 'joaillerie', 'luxe'];
  const guideKw = ['fle', 'vocabulaire', 'dialogue', 'paris', 'tour eiffel', 'touriste'];

  for (const kw of naturalKw) { if (combinedText.includes(kw)) scores.naturalist += 3; }
  for (const kw of mechanicKw) { if (combinedText.includes(kw)) scores.mechanic += 3; }
  for (const kw of scienceKw) { if (combinedText.includes(kw)) scores.scientist += 3; }
  for (const kw of chefKw) { if (combinedText.includes(kw)) scores.chef += 3; }
  for (const kw of luxuryKw) { if (combinedText.includes(kw)) scores.luxury += 3; }
  for (const kw of guideKw) { if (combinedText.includes(kw)) scores.guide += 3; }

  // Signal Empreinte Sémantique des Objets 3D présents
  if (entities) {
    for (const ent of Object.values(entities)) {
      const name = ((ent as any)?.name || '').toLowerCase();
      const asset = ((ent as any)?.visuals?.assetId || '').toLowerCase();
      const id = ((ent as any)?.id || '').toLowerCase();
      const entStr = `${id} ${name} ${asset}`;

      for (const kw of naturalKw) { if (entStr.includes(kw)) scores.naturalist += 2; }
      for (const kw of mechanicKw) { if (entStr.includes(kw)) scores.mechanic += 2; }
      for (const kw of scienceKw) { if (entStr.includes(kw)) scores.scientist += 2; }
      for (const kw of chefKw) { if (entStr.includes(kw)) scores.chef += 2; }
      for (const kw of luxuryKw) { if (entStr.includes(kw)) scores.luxury += 2; }
      for (const kw of guideKw) { if (entStr.includes(kw)) scores.guide += 2; }
    }
  }

  // Trouver la persona dominante dépassant le seuil minimal
  let bestTheme = 'assistant';
  let bestScore = 3;
  for (const [theme, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      bestTheme = theme;
    }
  }

  if (bestTheme !== 'assistant') {
    return personas[bestTheme];
  }

  // 3. Synthèse paramétrique générative pour tout domaine non couvert par le catalogue fixe
  const generativePersona = synthesizeParametricPersona(query);
  if (generativePersona) {
    return generativePersona;
  }

  return personas.assistant;
}

/**
 * Synthétiseur d'Avatar Incarné Paramétrique à la Volée.
 * Extrait les intentions du prompt pour concevoir une persona inédite
 * avec nom, rôle, icône, palette et accessoires 3D personnalisés.
 */
export function synthesizeParametricPersona(query: ContextualPersonaQuery): AgentPersona | null {
  const combined = `${query.category || ''} ${query.activeQuestTitle || ''} ${query.instruction || ''}`.toLowerCase();

  // 1. Pompier / Sécurité Incendie
  if (combined.includes('pompier') || combined.includes('incendie') || combined.includes('extincteur') || combined.includes('flamme') || combined.includes('feu') || (combined.includes('secours') && !combined.includes('medical') && !combined.includes('médical'))) {
    return {
      name: 'Capitaine Lucas',
      role: 'Officier Sapeur-Pompier & Sécurité Incendie',
      theme: 'custom',
      color: '#dc2626',
      accentColor: '#fbbf24',
      icon: '🚒',
      greeting: 'Sécurité et prévention incendie initialisées. Inspectons les issues et le matériel d’extinction.',
      attire: {
        jacketColor: '#ea580c',
        pantsColor: '#1e293b',
        accessoryType: 'helmet',
        accessoryColor: '#fbbf24'
      }
    };
  }

  // 2. Médecin / Santé / Premiers secours / Urgence médicale
  if (combined.includes('medecin') || combined.includes('médecin') || combined.includes('docteur') || combined.includes('infirmier') || combined.includes('patient') || combined.includes('soins') || combined.includes('hopital') || combined.includes('hôpital') || combined.includes('sante') || combined.includes('santé') || combined.includes('ausculter') || combined.includes('clinique') || combined.includes('premiers secours') || combined.includes('reanimation') || combined.includes('réanimation') || (combined.includes('urgenc') && !combined.includes('feu') && !combined.includes('incendie'))) {
    return {
      name: 'Dr. Clara, Médecin Urgentiste',
      role: 'Médecin Urgentiste & Formatrice Gestes de Secours',
      theme: 'custom',
      color: '#0284c7',
      accentColor: '#38bdf8',
      icon: '🩺',
      greeting: 'Bonjour. Apprenons ensemble les gestes précis qui sauvent des vies.',
      attire: {
        jacketColor: '#f8fafc',
        pantsColor: '#1e293b',
        shirtColor: '#e0f2fe',
        accessoryType: 'stethoscope',
        accessoryColor: '#0ea5e9'
      }
    };
  }

  // 3. Apiculteur / Ruche / Abeilles
  if (combined.includes('apiculteur') || combined.includes('ruche') || combined.includes('abeille') || combined.includes('apiculture') || combined.includes('miel')) {
    return {
      name: 'Barnabé, Maître Apiculteur',
      role: 'Éleveur d’Abeilles & Protecteur des Ruches',
      theme: 'custom',
      color: '#d97706',
      accentColor: '#fde047',
      icon: '🐝',
      greeting: 'Approchons calmement de la ruche. Observons la reine et les butineuses.',
      attire: {
        jacketColor: '#fef9c3',
        pantsColor: '#fef08a',
        accessoryType: 'hat',
        accessoryColor: '#fef08a'
      }
    };
  }

  // 4. Astronome / Espace / Télescope / Constellations
  if (combined.includes('astronome') || combined.includes('astrophysique') || combined.includes('telescope') || combined.includes('télescope') || combined.includes('constellation')) {
    return {
      name: 'Dr. Céleste, Astrophysicienne',
      role: 'Observatrice du Ciel Profond & Astrophysique',
      theme: 'custom',
      color: '#4f46e5',
      accentColor: '#a5b4fc',
      icon: '🔭',
      greeting: 'La voûte céleste s’ouvre à nous. Calibrons nos optiques pour observer le ciel nocturne.',
      attire: {
        jacketColor: '#1e1b4b',
        pantsColor: '#0f172a',
        accessoryType: 'glasses',
        accessoryColor: '#818cf8'
      }
    };
  }

  // 5. Artisanat d'Art / Menuiserie / Soudure / Forge
  if (combined.includes('menuisier') || combined.includes('ebeniste') || combined.includes('ébénist') || combined.includes('soudure') || combined.includes('souder') || combined.includes('forge') || combined.includes('ferronnier') || combined.includes('artisan') || combined.includes('ébénisterie')) {
    return {
      name: 'Émile, Maître Artisan',
      role: 'Artisan d’Art & Formateur d’Atelier',
      theme: 'custom',
      color: '#b45309',
      accentColor: '#fed7aa',
      icon: '🪚',
      greeting: 'Bienvenue à l’atelier. Précision du trait, choix des matières et maîtrise du geste.',
      attire: {
        jacketColor: '#78350f',
        pantsColor: '#1e293b',
        accessoryType: 'tool_belt',
        accessoryColor: '#d97706'
      }
    };
  }

  // 6. Archéologie / Histoire / Patrimoine
  if (combined.includes('archeologue') || combined.includes('archéologue') || combined.includes('fouille') || combined.includes('vestige') || combined.includes('paleontolog') || combined.includes('paléontolog')) {
    return {
      name: 'Professeur Antoine',
      role: 'Archéologue & Conservateur du Patrimoine',
      theme: 'custom',
      color: '#854d0e',
      accentColor: '#fef08a',
      icon: '🏛️',
      greeting: 'Chaque strate recèle un fragment d’histoire. Procédons au dégagement minutieux des vestiges.',
      attire: {
        jacketColor: '#713f12',
        pantsColor: '#451a03',
        accessoryType: 'glasses',
        accessoryColor: '#ca8a04'
      }
    };
  }

  // 7. Détection d'un rôle génératif explicite (ex: "un sommelier", "un architecte", "un pilote de drone")
  const roleMatch = combined.match(/\b(un|une|le|la|l'avatar|l’avatar)\s+([a-zéèêàâôûîç-]+(?:\s+[a-zéèêàâôûîç-]+)?)/i);
  if (roleMatch && roleMatch[2]) {
    const rawRole = roleMatch[2].trim();
    if (!['cuisine', 'foret', 'scene', 'objet', 'table', 'vue', 'mode', 'monde'].includes(rawRole)) {
      const capitalized = rawRole.charAt(0).toUpperCase() + rawRole.slice(1);
      return {
        name: `Guide ${capitalized}`,
        role: `Spécialiste ${capitalized}`,
        theme: 'custom',
        color: '#0d9488',
        accentColor: '#5eead4',
        icon: '🎓',
        greeting: `Bienvenue. Je serai votre guide pour cette session dédiée à : ${rawRole}.`,
        attire: {
          jacketColor: '#134e4a',
          pantsColor: '#1e293b',
          accessoryType: 'badge',
          accessoryColor: '#5eead4'
        }
      };
    }
  }

  return null;
}

export function getSpeechDialogue(stepTitle: string, stepDesc?: string, personaTheme: string = 'assistant'): string {
  switch (personaTheme) {
    case 'chef':
      if (stepTitle.includes('astuce') || stepTitle.includes('écoute')) {
        return "Commencez par écouter attentivement mes conseils de chef avant d'allumer le feu.";
      }
      if (stepTitle.includes('émincer') || stepTitle.includes('ingrédients')) {
        return "Munissez-vous du couteau de chef pour parer et tailler les légumes en dés réguliers.";
      }
      if (stepTitle.includes('Mijoter') || stepTitle.includes('cuisson')) {
        return "Faites chauffer la cocotte en fonte et laissez les arômes se concentrer doucement.";
      }
      if (stepTitle.includes('quiz')) {
        return "Validons ensemble votre maîtrise du geste technique sur le pupitre de quiz !";
      }
      return `${stepTitle}. ${stepDesc || ''}`;

    case 'engineer':
      if (stepTitle.includes('Inspecter') || stepTitle.includes('batterie')) {
        return "Contrôlez impérativement les connecteurs de la batterie B-17 avant tout déplacement.";
      }
      if (stepTitle.includes('Installer') || stepTitle.includes('baie')) {
        return "Insérez délicatement la batterie dans son logement en Zone 2.";
      }
      if (stepTitle.includes('diagnostic')) {
        return "Lancez les diagnostics télémétriques pour valider la procédure.";
      }
      if (stepTitle.includes('Agencement') || stepTitle.includes('spatial') || stepTitle.includes('briefing')) {
        return "Observez la disposition des assises et la visibilité de l'écran principal pour optimiser la dynamique d'échanges.";
      }
      if (stepTitle.includes('équipements') || stepTitle.includes('collaboratifs')) {
        return "Vérifiez la connectivité des outils collaboratifs et des systèmes de visioconférence.";
      }
      if (stepTitle.includes('facilitation') || stepTitle.includes('dynamique')) {
        return "Répondez au quiz de facilitation pour valider la bonne gestion du temps et des interactions.";
      }
      return `${stepTitle}. ${stepDesc || ''}`;

    case 'guide':
      if (stepTitle.includes('Dialogue') || stepTitle.includes('Écoute') || stepTitle.includes('dialogue')) {
        return "Observez la scène et écoutez attentivement les intonations du dialogue authentique.";
      }
      if (stepTitle.includes('Vocabulaire') || stepTitle.includes('vocabulaire') || stepTitle.includes('lexique')) {
        return "Explorez les éléments de la scène pour ancrer le vocabulaire en situation réelle.";
      }
      if (stepTitle.includes('Quiz') || stepTitle.includes('compréhension') || stepTitle.includes('quiz')) {
        return "À vous de jouer ! Répondez au quiz de compréhension pour valider vos acquis linguistiques.";
      }
      return `${stepTitle}. ${stepDesc || ''}`;

    case 'luxury':
      if (stepTitle.includes('Inspecter') || stepTitle.includes('sac') || stepTitle.includes('Speedy')) {
        return "Approchez-vous pour admirer la précision des surpiqûres sellier et la patine du cuir de vachette.";
      }
      if (stepTitle.includes('Capucines') || stepTitle.includes('fermoir')) {
        return "Admirez l'incrustation artisanale du fermoir bijou LV dans le cuir Taurillon pleine fleur.";
      }
      if (stepTitle.includes('podium') || stepTitle.includes('VIP')) {
        return "Déposez la création sur le podium VIP pour apprécier son architecture sous un éclairage d'exception.";
      }
      return `${stepTitle}. ${stepDesc || ''}`;

    case 'naturalist':
      if (stepTitle.includes('guide') || stepTitle.includes('Consulter') || stepTitle.includes('clé') || stepTitle.includes('mycologie')) {
        return "Observez la face inférieure du chapeau : des tubes spongieux trahissent le bolet, tandis que des lamelles libres signalent l’amanite.";
      }
      if (stepTitle.includes('Récolter') || stepTitle.includes('Cèpe') || stepTitle.includes('cepe') || stepTitle.includes('champignon')) {
        return "Prélevez délicatement le sporophore d’un mouvement tournant pour préserver le mycélium nourricier dans l’humus.";
      }
      if (stepTitle.includes('Amanite') || stepTitle.includes('toxique') || stepTitle.includes('Signaler')) {
        return "Prudence absolue ! Chapeau rouge à pustules, anneau et volve à la base : cette amanite tue-mouches reste en terre.";
      }
      if (stepTitle.includes('panier') || stepTitle.includes('osier')) {
        return "Toujours un panier en osier aéré : les sacs plastiques étouffent la récolte et accélèrent les fermentations toxiques.";
      }
      return `${stepTitle}. ${stepDesc || ''}`;

    case 'mechanic':
      if (stepTitle.includes('multimètre') || stepTitle.includes('tension') || stepTitle.includes('diagnostic')) {
        return "Mesurez la tension aux bornes avant toute intervention. Une batterie saine délivre au moins 12.6 volts à vide.";
      }
      if (stepTitle.includes('serrage') || stepTitle.includes('cosse') || stepTitle.includes('borne')) {
        return "Connectez d’abord la borne positive rouge, puis la masse noire, et respectez scrupuleusement le couple de serrage.";
      }
      if (stepTitle.includes('moteur') || stepTitle.includes('huile') || stepTitle.includes('vidange')) {
        return "Vérifiez le niveau à la jauge et inspectez l'étanchéité du carter inférieur avant la mise en route.";
      }
      return `${stepTitle}. ${stepDesc || ''}`;

    case 'scientist':
      if (stepTitle.includes('réactif') || stepTitle.includes('éprouvette') || stepTitle.includes('pipette')) {
        return "Dosons avec précision chaque réactif dans l’éprouvette et observons le virage colorimétrique de la solution.";
      }
      if (stepTitle.includes('analyse') || stepTitle.includes('spectre')) {
        return "Mesurons les longueurs d’onde d’absorption pour valider la réaction stœchiométrique.";
      }
      if (stepTitle.includes('hypothèse') || stepTitle.includes('validation')) {
        return "Confrontons nos mesures expérimentales aux lois fondamentales de la thermodynamique.";
      }
      return `${stepTitle}. ${stepDesc || ''}`;

    default:
      return `${stepTitle}. ${stepDesc || ''}`;
  }
}

import { ambientAudio } from './ambientAudio';

let _isAgentSpeakingGlobal = false;
let _speechStopTimeout: any = null;

export type VisemeType = 'silence' | 'aa' | 'e' | 'i' | 'o' | 'u' | 'pbm' | 'fv';

export interface VisemeConfig {
  scaleX: number;
  scaleY: number;
  jawDrop: number;
  lipSpread: number;
  openness: number;
}

export const VISEME_CONFIGS: Record<VisemeType, VisemeConfig> = {
  silence: { scaleX: 1.0, scaleY: 1.0, jawDrop: 0.0, lipSpread: 0.0, openness: 0.0 },
  aa:      { scaleX: 1.15, scaleY: 3.4, jawDrop: 0.016, lipSpread: 0.10, openness: 1.0 },
  e:       { scaleX: 1.38, scaleY: 2.0, jawDrop: 0.009, lipSpread: 0.35, openness: 0.6 },
  i:       { scaleX: 1.50, scaleY: 1.3, jawDrop: 0.005, lipSpread: 0.45, openness: 0.4 },
  o:       { scaleX: 0.78, scaleY: 2.6, jawDrop: 0.013, lipSpread: -0.20, openness: 0.8 },
  u:       { scaleX: 0.62, scaleY: 1.9, jawDrop: 0.008, lipSpread: -0.35, openness: 0.5 },
  pbm:     { scaleX: 1.08, scaleY: 0.35, jawDrop: 0.0, lipSpread: 0.0, openness: 0.0 },
  fv:      { scaleX: 1.12, scaleY: 0.80, jawDrop: 0.003, lipSpread: 0.10, openness: 0.25 }
};

export function extractVisemeFromText(text: string): VisemeType {
  const clean = text.toLowerCase().trim();
  if (!clean) return 'silence';
  if (/^[pbm]/.test(clean)) return 'pbm';
  if (/^[fv]/.test(clean)) return 'fv';

  // Identify first vowel group in the word
  const match = clean.match(/eau|au|ou|ai|ei|[aàâäeéèêëiîïyoôuûü]/);
  if (!match) return 'silence';

  const v = match[0];
  if (v === 'au' || v === 'eau' || v === 'ou' || v.startsWith('o') || v.startsWith('ô')) return 'o';
  if (v.startsWith('u') || v.startsWith('û') || v.startsWith('ü')) return 'u';
  if (v.startsWith('a') || v.startsWith('à') || v.startsWith('â') || v.startsWith('ä')) return 'aa';
  if (v.startsWith('e') || v.startsWith('é') || v.startsWith('è') || v.startsWith('ê') || v.startsWith('ë') || v === 'ai' || v === 'ei') return 'e';
  if (v.startsWith('i') || v.startsWith('î') || v.startsWith('ï') || v.startsWith('y')) return 'i';
  return 'aa';
}

export interface SpeechPhonemeDetail {
  word: string;
  charIndex: number;
  viseme: VisemeType;
  isEmphasis: boolean;
}

export function isAgentSpeakingGlobal(): boolean {
  return _isAgentSpeakingGlobal;
}

export function setAgentSpeakingState(speaking: boolean) {
  _isAgentSpeakingGlobal = speaking;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('worldpilot_agent_speech_state', { detail: { isSpeaking: speaking } }));
  }
}

export function speakAgentDialogue(text: string, rate: number = 1.0) {
  try {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (ambientAudio.isAudioMuted()) return;
    const effVol = ambientAudio.getEffectiveVolume();
    if (effVol <= 0.01) return;

    window.speechSynthesis.cancel();
    setAgentSpeakingState(false);
    if (_speechStopTimeout) {
      clearTimeout(_speechStopTimeout);
      _speechStopTimeout = null;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.volume = effVol;
    utterance.lang = 'fr-FR';
    utterance.rate = rate;
    utterance.pitch = rate < 0.9 ? 1.0 : 1.05;

    utterance.onstart = () => {
      setAgentSpeakingState(true);
    };

    utterance.onboundary = (event: SpeechSynthesisEvent) => {
      if (typeof window !== 'undefined') {
        const charIdx = event.charIndex || 0;
        const charLen = (event as any).charLength || 6;
        const slice = text.slice(charIdx, charIdx + Math.max(charLen, 4)).trim();
        const firstWord = slice.split(/\s+/)[0] || '';
        const viseme = extractVisemeFromText(firstWord);
        const isEmphasis = firstWord.length > 5 || /[!?;:]/.test(text.slice(charIdx, charIdx + 12));
        
        window.dispatchEvent(new CustomEvent('worldpilot_agent_phoneme', {
          detail: {
            word: firstWord,
            charIndex: charIdx,
            viseme,
            isEmphasis
          }
        }));
      }
    };

    utterance.onend = () => {
      setAgentSpeakingState(false);
    };

    utterance.onerror = () => {
      setAgentSpeakingState(false);
    };

    // Fallback safety timeout based on text length (~14 characters per second)
    const estimatedDurationMs = Math.max(1200, (text.length / 14) * 1000 / rate);
    _speechStopTimeout = setTimeout(() => {
      if (_isAgentSpeakingGlobal) {
        setAgentSpeakingState(false);
      }
    }, estimatedDurationMs + 400);

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn("Speech synthesis error", err);
    setAgentSpeakingState(false);
  }
}

export function getWorldShiftDialogue(themeId: string, personaTheme: string = 'assistant'): string {
  switch (themeId) {
    case 'martian-surface':
      if (personaTheme === 'chef') return "Incroyable ! À 38% de gravité martienne, la vapeur monte en spirale et la cuisson demande plus de temps.";
      if (personaTheme === 'engineer') return "Environnement martien configuré. Gravité réduite à 3.72 m/s², atmosphère ténue et dômes géodésiques pressurisés.";
      if (personaTheme === 'guide') return "Bienvenue sur la planète rouge ! Observez le régolithe oxydé et la légèreté de vos mouvements.";
      return "Surface martienne atteinte. Gravité 3.72 m/s² active.";

    case 'orbital-zerog':
      if (personaTheme === 'chef') return "Sacrebleu ! En apesanteur, les sauces et ustensiles s'envolent ! Pensez à tout maintenir fermement.";
      if (personaTheme === 'engineer') return "Apesanteur Zéro-G totale enclenchée ! Tous les corps rigides sont désormais en lévitation inertielle.";
      if (personaTheme === 'guide') return "Nous voici en orbite terrestre basse. Admirez le vide cosmique et les étoiles à perte de vue.";
      return "Mode apesanteur activé. Gravité nulle.";

    case 'lunar-base':
      if (personaTheme === 'chef') return "Gravité lunaire à un sixième de la Terre. Maniez vos casseroles avec délicatesse !";
      if (personaTheme === 'engineer') return "Base lunaire opérationnelle. Gravité 1.62 m/s², régolithe basaltique et télémétrie parée.";
      if (personaTheme === 'guide') return "Bienvenue sur la Mer de la Tranquillité. Le ciel est d'un noir absolu, même en plein jour.";
      return "Base lunaire configurée. Gravité 1.62 m/s².";

    case 'cyberpunk-matrix':
    case 'cyberpunk-neon':
      return "Matrice Cyberpunk activée. Circuits néon illuminés et trame synthétique haute fréquence.";

    case 'antigravity-anomaly':
      return "Alerte de distorsion physique ! Gravité inversée vers le ciel. Observez l'ascension des particules énergétiques.";

    case 'forest-clearing':
      if (personaTheme === 'naturalist') return "Quel biotope remarquable ! L’humus humide, le couvert de chênes et le tapis de mousse sont parfaits pour les champignons.";
      return "Clairière forestière naturelle. Sol riche en humus et canopée d’arbres majestueux.";

    case 'supercar-showroom':
      if (personaTheme === 'mechanic') return "Superbe banc d’atelier ! Éclairage de précision et sol technique pour des diagnostics irréprochables.";
      return "Showroom automobile d’exception.";

    case 'high-tech-lab':
      if (personaTheme === 'scientist') return "Laboratoire d’expérimentation de pointe prêt pour l’analyse spectroscopique et chimique.";
      return "Laboratoire scientifique et d’analyse avancée.";

    case 'le-refuge':
      if (personaTheme === 'chef') return "Bienvenue au Refuge Vivant ! L'air pur des cimes alpines et le feu qui crépite ouvrent un appétit d'ogre.";
      if (personaTheme === 'naturalist') return "Sanctuaire alpin préservé ! Les mélèzes et les roches cristallines abritent une flore montagnarde d’une pureté rare.";
      if (personaTheme === 'engineer') return "Sanctuaire Alpin atteint. Pression barométrique de haute altitude, brise thermique et feu de camp allumé.";
      if (personaTheme === 'guide') return "Respirez ce grand air montagnard face aux sommets et au lac miroitant. Un véritable havre de paix.";
      return "Le Refuge Vivant : sanctuaire alpin naturel sous la voûte céleste.";

    case 'earth-atelier':
    default:
      if (personaTheme === 'chef') return "De retour dans notre atelier culinaire.";
      if (personaTheme === 'naturalist') return "De retour à notre poste d'observation naturaliste.";
      if (personaTheme === 'mechanic') return "De retour à l'atelier mécanique.";
      if (personaTheme === 'scientist') return "De retour au laboratoire.";
      if (personaTheme === 'engineer') return "Paramètres standards de l'atelier.";
      return "Atelier de conception.";
  }
}

export function getDataIngestionDialogue(datasetTitle: string, pointCount: number, personaTheme: string = 'assistant'): string {
  switch (personaTheme) {
    case 'naturalist':
      return `Écosystème de données vivant ! Ces ${pointCount} grandeurs s'élèvent comme des strates géologiques et végétales dans l'espace.`;
    case 'mechanic':
      return `Métriques techniques matérialisées : ${pointCount} paramètres mécaniques calibrés selon les tolérances réelles de ${datasetTitle}.`;
    case 'scientist':
      return `Protocole expérimental quantifié : ${pointCount} variables physiques et chimiques modélisées pour ${datasetTitle}.`;
    case 'engineer':
      return `Matérialisation sémantique achevée. ${pointCount} piliers dimensionnés selon les métriques réelles de ${datasetTitle}. Inspectez chaque balise pour les télémesures.`;
    case 'chef':
      return `Quelle magnifique disposition spatiale ! Les données de ${datasetTitle} prennent vie et relief sous nos yeux.`;
    case 'guide':
      return `Admirez cette transformation anti-skeuomorphique : au lieu d'un écran plat, ${pointCount} grandeurs s'élèvent en architecture 3D tangible.`;
    default:
      return `Visualisation spatiale 3D matérialisée : ${datasetTitle} (${pointCount} indicateurs actifs).`;
  }
}

export function getGameplayDialogue(
  gameMode: string, 
  eventType: 'start' | 'victory' | 'game_over' | 'score', 
  score: number = 0, 
  personaTheme: string = 'assistant'
): string {
  if (eventType === 'start') {
    switch (gameMode) {
      case 'target_range':
        return personaTheme === 'engineer'
          ? "Système balistique Rapier armé. 4 cibles calibrées et chronomètre 30s enclenché. Visez juste !"
          : "Le stand de tir spatial est ouvert ! Visez les cibles avant la fin du temps.";
      case 'puzzle_locks':
        return personaTheme === 'chef'
          ? "Une recette ancestrale de sceaux ! Activez d'abord le soleil, puis la lune, et l'étoile ouvrira le coffre."
          : "Énigme des 3 totems enclenchée. L'ordre de résonance causale est la clé du trésor.";
      case 'gem_collector':
        return "Les orbes célestes lévitent dans l'espace. Ramassez-les tous pour marquer 500 points !";
      case 'survival_hazard':
        return "Attention ! Zone de radiation critique détectée. Surveillez vos vies et regagnez la station médicale.";
      default:
        return "Nouvelle boucle de gameplay émergent active. Que la partie commence !";
    }
  }
  if (eventType === 'victory') {
    return personaTheme === 'chef'
      ? `Magnifique triomphe ! ${score} points au compteur, un vrai chef-d'œuvre !`
      : `Victoire éclatante ! Défi accompli avec un score remarquable de ${score} points !`;
  }
  if (eventType === 'game_over') {
    return "Mission compromise ! Respirez un instant et relancez la boucle pour retenter votre chance.";
  }
  return `Points marqués ! Score actuel : ${score} points. Continuez ainsi !`;
}

const FEMALE_NAMES_SET = new Set([
  'victoria', 'éléonore', 'eleonore', 'nova', 'camille', 'marie', 'sophie',
  'sarah', 'émilie', 'emilie', 'julie', 'chloé', 'chloe', 'léa', 'lea',
  'emma', 'alice', 'juliette', 'claire', 'manon', 'lucie', 'laura', 'pauline',
  'charlotte', 'amélie', 'amelie', 'hélène', 'helene', 'céline', 'celine',
  'audrey', 'nathalie', 'valérie', 'valerie', 'isabelle', 'virginie', 'caroline',
  'delphine', 'stéphanie', 'stephanie', 'sandrine', 'laurence', 'patricia',
  'christine', 'corinne', 'monique', 'anne', 'jeanne', 'catherine', 'françoise',
  'francoise', 'brigitte', 'danielle', 'sylvie', 'martine', 'nicole', 'chantal',
  'alix', 'inès', 'ines', 'louise', 'jade', 'agathe', 'zoé', 'zoe', 'rose',
  'mia', 'lina', 'mila', 'anna', 'julia', 'eva', 'elena', 'sofia', 'elise',
  'élise', 'gabrielle', 'margaux', 'mathilde', 'roxane', 'salomé', 'salome',
  'diane', 'apolline', 'victoire', 'adèle', 'adele', 'capucine', 'constance',
  'héloïse', 'heloise', 'iris', 'clémence', 'clemence', 'valentine', 'romane',
  'océane', 'oceane', 'margot', 'marion', 'justine', 'morgane', 'anaïs', 'anais',
  'noémie', 'noemie', 'mélanie', 'melanie', 'fanny', 'lisa', 'elsa', 'maya',
  'luna', 'clara', 'olivia', 'ava', 'isabella', 'amelia', 'harper',
  'evelyn', 'abigail', 'emily', 'elizabeth', 'ella', 'avery',
  'camila', 'aria', 'scarlett', 'madison', 'grace',
  'penelope', 'layla', 'riley', 'zoey', 'nora', 'lily', 'eleanor', 'hannah',
  'lillian', 'addison', 'aubrey', 'ellie', 'stella', 'natalie', 'leah',
  'hazel', 'violet', 'aurora', 'savannah', 'brooklyn', 'bella',
  'skylar', 'lucy', 'paisley', 'everly', 'genesis', 'emilia', 'kennedy',
  'samantha', 'willow', 'kinsley', 'naomi', 'aaliyah', 'ariana', 'allison',
  'gabriella', 'madelyn', 'cora', 'ruby', 'serenity', 'autumn', 'adeline',
  'hailey', 'gianna', 'valentina', 'isla', 'eliana', 'quinn', 'nevaeh', 'ivy',
  'sadie', 'piper', 'lydia', 'alexa', 'josephine', 'emery', 'delilah',
  'arianna', 'vivian', 'kaylee', 'brielle', 'madeline', 'peyton'
]);

const FEMALE_ROLE_KEYWORDS = [
  'femme', 'conseillère', 'conseillere', 'ingénieure', 'ingenieure', 'cheffe',
  'cuisinière', 'cuisiniere', 'guide_femme', 'dame', 'madame', 'assistante',
  'hôtesse', 'hotesse', 'directrice', 'experte', 'médiatrice', 'mediatrice',
  'créatrice', 'creatrice', 'formatrice', 'auditrice', 'scientifique_femme',
  'vendeuse', 'mannequin', 'woman', 'lady', 'female', 'girl', 'fille'
];

/**
 * Détecte si un prénom ou rôle correspond à une femme pour adapter la morphologie 3D,
 * la chevelure, le maquillage et l'allure générale avec élégance.
 */
export function isFemaleName(name?: string, role?: string): boolean {
  if (!name && !role) return false;
  const rawText = `${name || ''} ${role || ''}`.toLowerCase();

  for (const kw of FEMALE_ROLE_KEYWORDS) {
    if (rawText.includes(kw)) return true;
  }

  const tokens = (name || '')
    .toLowerCase()
    .replace(/[^a-zà-ÿ0-9]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  for (const token of tokens) {
    if (FEMALE_NAMES_SET.has(token)) return true;
  }

  return false;
}
