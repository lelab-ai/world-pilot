export interface AtmospherePreset {
  id: string;
  name: string;
  icon: string;
  category: 'Réalisme & Quotidien' | 'Nature & Poésie' | 'Futurisme & Magie' | 'Événement & Célébration';
  description: string;
  lighting: {
    bg: string;
    fog: string;
    lightColor: string;
    intensity: number;
    ambient: string;
  };
  particleConfig: {
    type: 'none' | 'dust' | 'rain' | 'steam' | 'fireflies' | 'cyber_grid' | 'zen_ripples' | 'confetti';
    count: number;
    color: string;
    speed: number;
    size: number;
  };
  audioCue?: 'bell' | 'coffee_brew' | 'sparkle' | 'fanfare' | 'pour_water';
}

export const atmospheres: AtmospherePreset[] = [
  {
    id: 'atelier',
    name: 'Atelier Naturel (Jour)',
    icon: '☀️',
    category: 'Réalisme & Quotidien',
    description: 'Lumière diurne pure et équilibrée mettant en valeur les matières architecturales.',
    lighting: {
      bg: '#d4d9d5',
      fog: '#d4d9d5',
      lightColor: '#fff0d5',
      intensity: 2.5,
      ambient: '#e4f0ff',
    },
    particleConfig: {
      type: 'dust',
      count: 40,
      color: '#ffffff',
      speed: 0.15,
      size: 0.035,
    },
  },
  {
    id: 'golden-morning',
    name: 'Matin Doré (Golden Hour)',
    icon: '🌅',
    category: 'Réalisme & Quotidien',
    description: 'Soleil rasant d’aube dorée et poussières féeriques flottant doucement dans la lumière.',
    lighting: {
      bg: '#877059',
      fog: '#877059',
      lightColor: '#ffb366',
      intensity: 3.2,
      ambient: '#ffe6cc',
    },
    particleConfig: {
      type: 'dust',
      count: 90,
      color: '#ffd280',
      speed: 0.25,
      size: 0.05,
    },
    audioCue: 'bell',
  },
  {
    id: 'paris-rain',
    name: 'Pluie Fine Parisienne',
    icon: '🌧️',
    category: 'Nature & Poésie',
    description: 'Averse poétique sur les pavés parisiens, brume feutrée ardoise et gouttes scintillantes.',
    lighting: {
      bg: '#434d54',
      fog: '#434d54',
      lightColor: '#9ec4d4',
      intensity: 1.6,
      ambient: '#6b7d8a',
    },
    particleConfig: {
      type: 'rain',
      count: 220,
      color: '#a3c2d1',
      speed: 3.8,
      size: 0.18,
    },
    audioCue: 'pour_water',
  },
  {
    id: 'cozy-bistrot',
    name: 'Bistrot Chaleureux & Café',
    icon: '☕',
    category: 'Réalisme & Quotidien',
    description: 'Ambiance feutrée de salon de thé ou café parisien, volutes de vapeur et lueur cuivrée.',
    lighting: {
      bg: '#4a382a',
      fog: '#4a382a',
      lightColor: '#ff944d',
      intensity: 2.2,
      ambient: '#ffd9b3',
    },
    particleConfig: {
      type: 'steam',
      count: 75,
      color: '#fcefdc',
      speed: 0.45,
      size: 0.09,
    },
    audioCue: 'coffee_brew',
  },
  {
    id: 'starry-night',
    name: 'Nuit Étoilée & Lucioles',
    icon: '🌙',
    category: 'Nature & Poésie',
    description: 'Pénombre d’azur nocturne mystique illuminée par des lucioles luminescentes en orbite.',
    lighting: {
      bg: '#101726',
      fog: '#101726',
      lightColor: '#7094db',
      intensity: 0.95,
      ambient: '#203050',
    },
    particleConfig: {
      type: 'fireflies',
      count: 85,
      color: '#c4ff4d',
      speed: 0.35,
      size: 0.075,
    },
    audioCue: 'sparkle',
  },
  {
    id: 'cyberpunk-neon',
    name: 'Cyberpunk & Énergie Néon',
    icon: '🚀',
    category: 'Futurisme & Magie',
    description: 'Univers de science-fiction rétro-futuriste avec lueurs cyan et magenta, et grilles de données.',
    lighting: {
      bg: '#0b0817',
      fog: '#0b0817',
      lightColor: '#00ffff',
      intensity: 2.8,
      ambient: '#ff00aa',
    },
    particleConfig: {
      type: 'cyber_grid',
      count: 120,
      color: '#00ffff',
      speed: 0.8,
      size: 0.065,
    },
    audioCue: 'sparkle',
  },
  {
    id: 'zen-garden',
    name: 'Jardin Zen & Pétales',
    icon: '🧘',
    category: 'Nature & Poésie',
    description: 'Sérénité méditative avec pétales roses flottant lentement au gré de la brise.',
    lighting: {
      bg: '#5c6b61',
      fog: '#5c6b61',
      lightColor: '#e6ffe6',
      intensity: 2.0,
      ambient: '#b3d9c2',
    },
    particleConfig: {
      type: 'zen_ripples',
      count: 70,
      color: '#ffcce6',
      speed: 0.22,
      size: 0.06,
    },
    audioCue: 'bell',
  },
  {
    id: 'celebration-party',
    name: 'Fête & Confettis',
    icon: '🎉',
    category: 'Événement & Célébration',
    description: 'Pluie joyeuse de confettis multicolores scintillants célébrant une réussite ou un succès.',
    lighting: {
      bg: '#4a2545',
      fog: '#4a2545',
      lightColor: '#ffdd55',
      intensity: 3.0,
      ambient: '#ff66cc',
    },
    particleConfig: {
      type: 'confetti',
      count: 180,
      color: '#ff3366',
      speed: 1.2,
      size: 0.08,
    },
    audioCue: 'fanfare',
  }
];

export function getAtmosphere(id: string = 'atelier'): AtmospherePreset {
  return atmospheres.find(a => a.id === id) || atmospheres[0];
}
