export interface WorldThemeSpec {
  id: string;
  name: string;
  icon: string;
  category: 'Système Solaire & Espace' | 'Sci-Fi & Futurisme' | 'Réalisme Terrestre' | 'Nature & Poésie' | 'Événement & Célébration';
  description: string;
  gravity: [number, number, number];
  gravityLabel: string;
  floor: {
    type: 'stone' | 'martian_regolith' | 'lunar_dust' | 'orbital_metal' | 'cyber_grid' | 'warm_wood' | 'crystal_lattice' | 'forest_soil' | 'golden_sand';
    primaryColor: string;
    accentColor: string;
    roughness: number;
    metalness: number;
    bumpScale?: number;
  };
  stageStyle: 'pavilion' | 'mars_base' | 'orbital_station' | 'lunar_outpost' | 'cyber_monoliths' | 'celestial_ring' | 'alpine_refuge' | 'luxury_gallery' | 'supercar_studio' | 'culinary_studio' | 'high_tech_cleanroom' | 'contemporary_gallery' | 'forest_clearing' | 'coastal_beach';
  lighting: {
    bg: string;
    fog: string;
    fogNear?: number;
    fogFar?: number;
    lightColor: string;
    intensity: number;
    ambient: string;
    ambientIntensity?: number;
  };
  stars?: boolean;
  particleConfig: {
    type: 'none' | 'dust' | 'rain' | 'steam' | 'fireflies' | 'cyber_grid' | 'zen_ripples' | 'confetti' | 'mars_storm' | 'space_debris' | 'energy_motes' | 'embers' | 'falling_leaves';
    count: number;
    color: string;
    speed: number;
    size: number;
  };
  audioCue?: 'bell' | 'coffee_brew' | 'sparkle' | 'fanfare' | 'pour_water' | 'shift_whoosh';
  ambientSoundscape?: 'atelier' | 'paris_rain' | 'cozy_bistrot' | 'starry_night' | 'cyberpunk' | 'zen' | 'celebration' | 'golden_morning' | 'martian_wind' | 'space_station' | 'lunar_silence' | 'antigravity_drone' | 'refuge_binaural' | 'forest_birds' | 'ocean_waves';
}

export const worldThemes: WorldThemeSpec[] = [
  {
    id: 'le-refuge',
    name: 'Le Refuge Vivant (Sanctuaire Alpin)',
    icon: '⛰️',
    category: 'Nature & Poésie',
    description: 'Sanctuaire alpin contemplatif : feu de camp qui crépite, lac paisible, sommets enneigés et ciel crépusculaire.',
    gravity: [0, -9.81, 0],
    gravityLabel: '9.81 m/s² (Terre)',
    floor: {
      type: 'stone',
      primaryColor: '#3d443e',
      accentColor: '#ffa866',
      roughness: 0.85,
      metalness: 0.05,
      bumpScale: 0.03
    },
    stageStyle: 'alpine_refuge',
    lighting: {
      bg: '#7a5c3b',
      fog: '#7a5c3b',
      fogNear: 15,
      fogFar: 140,
      lightColor: '#ffa866',
      intensity: 2.2,
      ambient: '#7d93ad',
      ambientIntensity: 0.85
    },
    stars: true,
    particleConfig: {
      type: 'embers',
      count: 45,
      color: '#ffa347',
      speed: 0.25,
      size: 0.06
    },
    audioCue: 'sparkle',
    ambientSoundscape: 'refuge_binaural'
  },
  {
    id: 'earth-atelier',
    name: "Atelier Terrestre (Salon Haussmannien)",
    icon: '🌍',
    category: 'Réalisme Terrestre',
    description: "Lumière diurne équilibrée, pavillon d'architecture en pierre blonde et gravité standard terrestre.",
    gravity: [0, -9.81, 0],
    gravityLabel: '9.81 m/s² (Terre)',
    floor: {
      type: 'stone',
      primaryColor: '#bcb7a9',
      accentColor: '#8f8160',
      roughness: 0.63,
      metalness: 0.04,
      bumpScale: 0.025
    },
    stageStyle: 'pavilion',
    lighting: {
      bg: '#d4d9d5',
      fog: '#d4d9d5',
      fogNear: 26,
      fogFar: 85,
      lightColor: '#fff0d5',
      intensity: 2.5,
      ambient: '#e4f0ff',
      ambientIntensity: 0.85
    },
    stars: false,
    particleConfig: {
      type: 'dust',
      count: 40,
      color: '#ffffff',
      speed: 0.15,
      size: 0.035
    },
    audioCue: 'shift_whoosh',
    ambientSoundscape: 'atelier'
  },
  {
    id: 'martian-surface',
    name: 'Surface Martienne (Cratère Jezero)',
    icon: '🔴',
    category: 'Système Solaire & Espace',
    description: 'Gravité réduite à 38%, régolithe rouge oxydé, dômes pressurisés et tempête de poussière ocre.',
    gravity: [0, -3.72, 0],
    gravityLabel: '3.72 m/s² (Mars)',
    floor: {
      type: 'martian_regolith',
      primaryColor: '#964426',
      accentColor: '#cf633a',
      roughness: 0.88,
      metalness: 0.12,
      bumpScale: 0.045
    },
    stageStyle: 'mars_base',
    lighting: {
      bg: '#753b26',
      fog: '#82422b',
      fogNear: 16,
      fogFar: 70,
      lightColor: '#ff9966',
      intensity: 3.1,
      ambient: '#b35936',
      ambientIntensity: 0.95
    },
    stars: true,
    particleConfig: {
      type: 'mars_storm',
      count: 140,
      color: '#e66a3b',
      speed: 0.75,
      size: 0.065
    },
    audioCue: 'shift_whoosh',
    ambientSoundscape: 'martian_wind'
  },
  {
    id: 'orbital-zerog',
    name: 'Station Spatiale (Apesanteur Zéro-G)',
    icon: '🛸',
    category: 'Système Solaire & Espace',
    description: 'Gravité nulle absolue ! Les objets dérivent librement dans le vide cosmique entouré d’étoiles.',
    gravity: [0, 0, 0],
    gravityLabel: '0.00 m/s² (Zéro-G)',
    floor: {
      type: 'orbital_metal',
      primaryColor: '#2b3340',
      accentColor: '#00d2ff',
      roughness: 0.35,
      metalness: 0.82,
      bumpScale: 0.035
    },
    stageStyle: 'orbital_station',
    lighting: {
      bg: '#020409',
      fog: '#030712',
      fogNear: 35,
      fogFar: 110,
      lightColor: '#d6edff',
      intensity: 3.4,
      ambient: '#10223d',
      ambientIntensity: 0.55
    },
    stars: true,
    particleConfig: {
      type: 'space_debris',
      count: 100,
      color: '#66ccff',
      speed: 0.18,
      size: 0.05
    },
    audioCue: 'shift_whoosh',
    ambientSoundscape: 'space_station'
  },
  {
    id: 'lunar-base',
    name: 'Base Lunaire (Mer de la Tranquillité)',
    icon: '🌙',
    category: 'Système Solaire & Espace',
    description: 'Gravité légère à 16.5%, sol basaltique gris charbon, ombres franches et silence profond du cosmos.',
    gravity: [0, -1.62, 0],
    gravityLabel: '1.62 m/s² (Lune)',
    floor: {
      type: 'lunar_dust',
      primaryColor: '#4f555e',
      accentColor: '#8a94a3',
      roughness: 0.92,
      metalness: 0.08,
      bumpScale: 0.04
    },
    stageStyle: 'lunar_outpost',
    lighting: {
      bg: '#050608',
      fog: '#0a0d12',
      fogNear: 25,
      fogFar: 95,
      lightColor: '#f0f5fa',
      intensity: 3.6,
      ambient: '#222830',
      ambientIntensity: 0.45
    },
    stars: true,
    particleConfig: {
      type: 'dust',
      count: 65,
      color: '#bcc5d1',
      speed: 0.12,
      size: 0.04
    },
    audioCue: 'shift_whoosh',
    ambientSoundscape: 'lunar_silence'
  },
  {
    id: 'cyberpunk-matrix',
    name: 'Matrice Cyberpunk (Néo-Tokyo)',
    icon: '⚡',
    category: 'Sci-Fi & Futurisme',
    description: 'Dalle d’obsidienne noire à circuits cyan et magenta, monolithes néon et synthétiseurs analogiques.',
    gravity: [0, -9.81, 0],
    gravityLabel: '9.81 m/s² (Terre)',
    floor: {
      type: 'cyber_grid',
      primaryColor: '#0a0814',
      accentColor: '#00ffff',
      roughness: 0.18,
      metalness: 0.92,
      bumpScale: 0.03
    },
    stageStyle: 'cyber_monoliths',
    lighting: {
      bg: '#0a0614',
      fog: '#0a0614',
      fogNear: 18,
      fogFar: 75,
      lightColor: '#00ffff',
      intensity: 2.8,
      ambient: '#ff00aa',
      ambientIntensity: 0.75
    },
    stars: false,
    particleConfig: {
      type: 'cyber_grid',
      count: 120,
      color: '#00ffff',
      speed: 0.8,
      size: 0.065
    },
    audioCue: 'shift_whoosh',
    ambientSoundscape: 'cyberpunk'
  },
  {
    id: 'antigravity-anomaly',
    name: 'Anomalie Antigravitationnelle (Inversion G)',
    icon: '🌀',
    category: 'Sci-Fi & Futurisme',
    description: 'Vecteur gravitationnel inversé vers le haut ! Réseau cristallin iridescent et particules ascendantes.',
    gravity: [0, 2.5, 0],
    gravityLabel: '+2.50 m/s² (Inversée)',
    floor: {
      type: 'crystal_lattice',
      primaryColor: '#27193b',
      accentColor: '#bd66ff',
      roughness: 0.25,
      metalness: 0.75,
      bumpScale: 0.035
    },
    stageStyle: 'celestial_ring',
    lighting: {
      bg: '#1c102b',
      fog: '#231438',
      fogNear: 20,
      fogFar: 80,
      lightColor: '#e0a8ff',
      intensity: 2.6,
      ambient: '#542680',
      ambientIntensity: 0.85
    },
    stars: true,
    particleConfig: {
      type: 'energy_motes',
      count: 110,
      color: '#d68aff',
      speed: 0.5,
      size: 0.07
    },
    audioCue: 'shift_whoosh',
    ambientSoundscape: 'antigravity_drone'
  },
  {
    id: 'paris-rain',
    name: 'Pluie Fine Parisienne',
    icon: '🌧️',
    category: 'Nature & Poésie',
    description: 'Averse poétique sur les pavés parisiens, brume ardoise et gouttes scintillantes.',
    gravity: [0, -9.81, 0],
    gravityLabel: '9.81 m/s² (Terre)',
    floor: {
      type: 'stone',
      primaryColor: '#636c73',
      accentColor: '#7b8791',
      roughness: 0.45,
      metalness: 0.15,
      bumpScale: 0.03
    },
    stageStyle: 'pavilion',
    lighting: {
      bg: '#434d54',
      fog: '#434d54',
      fogNear: 18,
      fogFar: 75,
      lightColor: '#9ec4d4',
      intensity: 1.6,
      ambient: '#6b7d8a',
      ambientIntensity: 0.65
    },
    stars: false,
    particleConfig: {
      type: 'rain',
      count: 220,
      color: '#a3c2d1',
      speed: 3.8,
      size: 0.18
    },
    audioCue: 'pour_water',
    ambientSoundscape: 'paris_rain'
  },
  {
    id: 'cozy-bistrot',
    name: 'Bistrot Chaleureux & Café',
    icon: '☕',
    category: 'Réalisme Terrestre',
    description: 'Ambiance feutrée de salon de thé ou café parisien, volutes de vapeur et sol boisé chaleureux.',
    gravity: [0, -9.81, 0],
    gravityLabel: '9.81 m/s² (Terre)',
    floor: {
      type: 'warm_wood',
      primaryColor: '#69462c',
      accentColor: '#8a5c39',
      roughness: 0.55,
      metalness: 0.05,
      bumpScale: 0.02
    },
    stageStyle: 'culinary_studio',
    lighting: {
      bg: '#4a382a',
      fog: '#4a382a',
      fogNear: 18,
      fogFar: 75,
      lightColor: '#ff944d',
      intensity: 2.2,
      ambient: '#ffd9b3',
      ambientIntensity: 0.75
    },
    stars: false,
    particleConfig: {
      type: 'steam',
      count: 75,
      color: '#fcefdc',
      speed: 0.45,
      size: 0.09
    },
    audioCue: 'coffee_brew',
    ambientSoundscape: 'cozy_bistrot'
  },
  {
    id: 'starry-night',
    name: 'Nuit Étoilée & Lucioles',
    icon: '🌙',
    category: 'Nature & Poésie',
    description: 'Pénombre d’azur nocturne illuminée par des lucioles luminescentes et crépitement de feu de bois.',
    gravity: [0, -9.81, 0],
    gravityLabel: '9.81 m/s² (Terre)',
    floor: {
      type: 'stone',
      primaryColor: '#343c4a',
      accentColor: '#536075',
      roughness: 0.72,
      metalness: 0.08,
      bumpScale: 0.025
    },
    stageStyle: 'pavilion',
    lighting: {
      bg: '#101726',
      fog: '#101726',
      fogNear: 18,
      fogFar: 75,
      lightColor: '#7094db',
      intensity: 0.95,
      ambient: '#203050',
      ambientIntensity: 0.65
    },
    stars: true,
    particleConfig: {
      type: 'fireflies',
      count: 85,
      color: '#c4ff4d',
      speed: 0.35,
      size: 0.075
    },
    audioCue: 'sparkle',
    ambientSoundscape: 'starry_night'
  },
  {
    id: 'zen-garden',
    name: 'Jardin Zen & Pétales',
    icon: '🧘',
    category: 'Nature & Poésie',
    description: 'Sérénité méditative avec pétales roses flottant lentement au gré de la brise et carillon.',
    gravity: [0, -9.81, 0],
    gravityLabel: '9.81 m/s² (Terre)',
    floor: {
      type: 'stone',
      primaryColor: '#a1aba3',
      accentColor: '#7e8a80',
      roughness: 0.78,
      metalness: 0.04,
      bumpScale: 0.02
    },
    stageStyle: 'pavilion',
    lighting: {
      bg: '#5c6b61',
      fog: '#5c6b61',
      fogNear: 18,
      fogFar: 75,
      lightColor: '#e6ffe6',
      intensity: 2.0,
      ambient: '#b3d9c2',
      ambientIntensity: 0.75
    },
    stars: false,
    particleConfig: {
      type: 'zen_ripples',
      count: 70,
      color: '#ffcce6',
      speed: 0.22,
      size: 0.06
    },
    audioCue: 'bell',
    ambientSoundscape: 'zen'
  },
  {
    id: 'celebration-party',
    name: 'Fête & Confettis',
    icon: '🎉',
    category: 'Événement & Célébration',
    description: 'Pluie joyeuse de confettis multicolores scintillants célébrant une réussite ou un succès.',
    gravity: [0, -9.81, 0],
    gravityLabel: '9.81 m/s² (Terre)',
    floor: {
      type: 'stone',
      primaryColor: '#bfa382',
      accentColor: '#ffd700',
      roughness: 0.45,
      metalness: 0.35,
      bumpScale: 0.02
    },
    stageStyle: 'pavilion',
    lighting: {
      bg: '#4a2545',
      fog: '#4a2545',
      fogNear: 18,
      fogFar: 75,
      lightColor: '#ffdd55',
      intensity: 3.0,
      ambient: '#ff66cc',
      ambientIntensity: 0.85
    },
    stars: false,
    particleConfig: {
      type: 'confetti',
      count: 180,
      color: '#ff3366',
      speed: 1.2,
      size: 0.08
    },
    audioCue: 'fanfare',
    ambientSoundscape: 'celebration'
  },
  {
    id: 'golden-morning',
    name: 'Matin Doré (Golden Hour)',
    icon: '🌅',
    category: 'Réalisme Terrestre',
    description: 'Soleil rasant d’aube dorée et poussières féeriques flottant doucement dans la lumière.',
    gravity: [0, -9.81, 0],
    gravityLabel: '9.81 m/s² (Terre)',
    floor: {
      type: 'stone',
      primaryColor: '#bfae95',
      accentColor: '#dba965',
      roughness: 0.58,
      metalness: 0.06,
      bumpScale: 0.025
    },
    stageStyle: 'pavilion',
    lighting: {
      bg: '#877059',
      fog: '#877059',
      fogNear: 18,
      fogFar: 75,
      lightColor: '#ffb366',
      intensity: 3.2,
      ambient: '#ffe6cc',
      ambientIntensity: 0.85
    },
    stars: false,
    particleConfig: {
      type: 'dust',
      count: 90,
      color: '#ffd280',
      speed: 0.25,
      size: 0.05
    },
    audioCue: 'bell',
    ambientSoundscape: 'golden_morning'
  },
  {
    id: 'luxury-showroom',
    name: 'Salon Privé & Flagship Vendôme',
    icon: '👜',
    category: 'Réalisme Terrestre',
    description: 'Cyclorama de haute maroquinerie : marbre Calacatta mat, voiles de lumière champagne 3000K et atmosphère feutrée exclusive.',
    gravity: [0, -9.81, 0],
    gravityLabel: '9.81 m/s² (Terre)',
    floor: {
      type: 'stone',
      primaryColor: '#1e2430',
      accentColor: '#d4af37',
      roughness: 0.45,
      metalness: 0.15,
      bumpScale: 0.015
    },
    stageStyle: 'luxury_gallery',
    lighting: {
      bg: '#141820',
      fog: '#141820',
      fogNear: 28,
      fogFar: 95,
      lightColor: '#fffaed',
      intensity: 1.35,
      ambient: '#1e2430',
      ambientIntensity: 0.55
    },
    stars: false,
    particleConfig: {
      type: 'dust',
      count: 35,
      color: '#fbbf24',
      speed: 0.12,
      size: 0.03
    },
    audioCue: 'bell',
    ambientSoundscape: 'atelier'
  },
  {
    id: 'supercar-showroom',
    name: 'Studio Design Hypercar Victoria VR',
    icon: '🏎️',
    category: 'Sci-Fi & Futurisme',
    description: 'Plateau de studio : sol sombre réfléchissant, réflecteurs linéaires zénithaux et skyline au crépuscule.',
    gravity: [0, -9.81, 0],
    gravityLabel: '9.81 m/s² (Terre)',
    floor: {
      type: 'orbital_metal',
      primaryColor: '#1e293b',
      accentColor: '#38bdf8',
      roughness: 0.25,
      metalness: 0.65,
      bumpScale: 0.01
    },
    stageStyle: 'supercar_studio',
    lighting: {
      bg: '#0f172a',
      fog: '#0f172a',
      fogNear: 25,
      fogFar: 110,
      lightColor: '#f8fafc',
      intensity: 4.2,
      ambient: '#94a3b8',
      ambientIntensity: 1.35
    },
    stars: true,
    particleConfig: {
      type: 'energy_motes',
      count: 45,
      color: '#38bdf8',
      speed: 0.2,
      size: 0.04
    },
    audioCue: 'shift_whoosh',
    ambientSoundscape: 'space_station'
  },
  {
    id: 'high-tech-lab',
    name: 'Laboratoire Haute Technologie & Robotique',
    icon: '🔬',
    category: 'Sci-Fi & Futurisme',
    description: 'Architecture cleanroom épurée : micro-ciment satiné, veines argentées antistatiques, éclairage sans ombre 4500K et télémétrie de précision.',
    gravity: [0, -9.81, 0],
    gravityLabel: '9.81 m/s² (Terre)',
    floor: {
      type: 'stone',
      primaryColor: '#1e293b',
      accentColor: '#06b6d4',
      roughness: 0.28,
      metalness: 0.25,
      bumpScale: 0.015
    },
    stageStyle: 'high_tech_cleanroom',
    lighting: {
      bg: '#0f172a',
      fog: '#0f172a',
      fogNear: 25,
      fogFar: 95,
      lightColor: '#f1f5f9',
      intensity: 2.8,
      ambient: '#38bdf8',
      ambientIntensity: 0.75
    },
    stars: false,
    particleConfig: {
      type: 'energy_motes',
      count: 30,
      color: '#06b6d4',
      speed: 0.15,
      size: 0.03
    },
    audioCue: 'sparkle',
    ambientSoundscape: 'space_station'
  },
  {
    id: 'contemporary-gallery',
    name: "Galerie d'Art Contemporain & Pavillon Séminaire",
    icon: '🏛️',
    category: 'Réalisme Terrestre',
    description: 'Architecture brutaliste épurée : dalles de béton ciré sombre, lattes acoustiques en chêne et anneau lumineux zénithal 3500K.',
    gravity: [0, -9.81, 0],
    gravityLabel: '9.81 m/s² (Terre)',
    floor: {
      type: 'stone',
      primaryColor: '#252a34',
      accentColor: '#d4af37',
      roughness: 0.45,
      metalness: 0.12,
      bumpScale: 0.018
    },
    stageStyle: 'contemporary_gallery',
    lighting: {
      bg: '#161920',
      fog: '#161920',
      fogNear: 28,
      fogFar: 90,
      lightColor: '#fffbeb',
      intensity: 1.4,
      ambient: '#1e2430',
      ambientIntensity: 0.55
    },
    stars: false,
    particleConfig: {
      type: 'dust',
      count: 25,
      color: '#e2e8f0',
      speed: 0.1,
      size: 0.03
    },
    audioCue: 'bell',
    ambientSoundscape: 'atelier'
  },
  {
    id: 'forest-clearing',
    name: "Clairière Forestière & Sous-Bois (Cueillette)",
    icon: '🌲',
    category: 'Nature & Poésie',
    description: "Atmosphère sylvestre immersive : chênes centenaires, brume végétale, canopée dorée, rayons de soleil filtrés et lit de mousses sauvages.",
    gravity: [0, -9.81, 0],
    gravityLabel: '9.81 m/s² (Terre)',
    floor: {
      type: 'forest_soil',
      primaryColor: '#2b1d14',
      accentColor: '#3d5a27',
      roughness: 0.92,
      metalness: 0.04,
      bumpScale: 0.045
    },
    stageStyle: 'forest_clearing',
    lighting: {
      bg: '#1c281e',
      fog: '#243426',
      fogNear: 16,
      fogFar: 60,
      lightColor: '#ffeaad',
      intensity: 3.0,
      ambient: '#335037',
      ambientIntensity: 0.95
    },
    stars: false,
    particleConfig: {
      type: 'falling_leaves',
      count: 90,
      color: '#e07a2a',
      speed: 0.35,
      size: 0.085
    },
    audioCue: 'sparkle',
    ambientSoundscape: 'forest_birds'
  },
  {
    id: 'coastal-beach',
    name: 'Littoral & Plage Océane (Rivage & Dunes)',
    icon: '🏖️',
    category: 'Nature & Poésie',
    description: 'Rivage maritime ensoleillé : sable doré fin, ressac apaisant des vagues océanes, brise iodée et horizon azuré.',
    gravity: [0, -9.81, 0],
    gravityLabel: '9.81 m/s² (Terre)',
    floor: {
      type: 'golden_sand',
      primaryColor: '#e0b57e',
      accentColor: '#38bdf8',
      roughness: 0.88,
      metalness: 0.02,
      bumpScale: 0.035
    },
    stageStyle: 'coastal_beach',
    lighting: {
      bg: '#7dd3fc',
      fog: '#bae6fd',
      fogNear: 25,
      fogFar: 140,
      lightColor: '#fef08a',
      intensity: 2.8,
      ambient: '#93c5fd',
      ambientIntensity: 0.95
    },
    stars: false,
    particleConfig: {
      type: 'none',
      count: 20,
      color: '#fef08a',
      speed: 0.15,
      size: 0.04
    },
    audioCue: 'sparkle',
    ambientSoundscape: 'ocean_waves'
  }
];

export function getWorldTheme(id: string = 'earth-atelier'): WorldThemeSpec {
  // Support aliases for backward compatibility with existing atmosphere IDs
  const aliasMap: Record<string, string> = {
    'atelier': 'earth-atelier',
    'cyberpunk-neon': 'cyberpunk-matrix',
    'luxury-salon': 'luxury-showroom',
    'penthouse': 'penthouse-skyline',
    'alpine-refuge': 'le-refuge',
    'refuge-alpin': 'le-refuge',
    'refuge': 'le-refuge',
    'paris-boulevard': 'contemporary-gallery',
    'art-gallery': 'contemporary-gallery'
  };
  const mappedId = aliasMap[id] || id;
  return (
    worldThemes.find(t => t.id === mappedId) ||
    worldThemes.find(t => t.id === 'earth-atelier') ||
    worldThemes[0]
  );
}

export function getAllWorldThemes(): WorldThemeSpec[] {
  return worldThemes;
}
