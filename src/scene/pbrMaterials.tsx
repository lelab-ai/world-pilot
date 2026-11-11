import React, { useMemo } from 'react';
import * as THREE from 'three';

export type PBRCategory = 'luxury' | 'natural' | 'industrial' | 'architectural';

export interface PBRMaterialPreset {
  id: string;
  name: string;
  nameEn: string;
  category: PBRCategory;
  icon: string;
  description: string;
  defaultColor: string;
  roughness: number;
  metalness: number;
  clearcoat?: number;
  clearcoatRoughness?: number;
  transmission?: number;
  ior?: number;
  sheen?: number;
  sheenColor?: string;
  transparent?: boolean;
  opacity?: number;
  normalScale: number;
  defaultRepeat: [number, number];
  keywords: string[];
}

export const PBR_PRESETS: Record<string, PBRMaterialPreset> = {
  carrara_marble: {
    id: 'carrara_marble',
    name: 'Marbre Blanc de Carrare',
    nameEn: 'Carrara White Marble',
    category: 'luxury',
    icon: '🏛️',
    description: 'Marbre italien poli miroir avec veinage gris délicat et vernis cristallin.',
    defaultColor: '#f8fafc',
    roughness: 0.16,
    metalness: 0.04,
    clearcoat: 0.85,
    clearcoatRoughness: 0.08,
    normalScale: 0.35,
    defaultRepeat: [2, 2],
    keywords: ['marbre', 'marble', 'carrara', 'carrare', 'pierre', 'luxe', 'comptoir', 'blanc']
  },
  walnut_wood: {
    id: 'walnut_wood',
    name: 'Bois de Noyer Massif',
    nameEn: 'Solid Walnut Wood',
    category: 'natural',
    icon: '🪵',
    description: 'Ébénisterie haut de gamme aux fibres chaleureuses et au grain soyeux.',
    defaultColor: '#451a03',
    roughness: 0.42,
    metalness: 0.02,
    clearcoat: 0.25,
    clearcoatRoughness: 0.20,
    normalScale: 0.75,
    defaultRepeat: [3, 1],
    keywords: ['noyer', 'walnut', 'bois', 'wood', 'table', 'meuble', 'ebenisterie', 'marron', 'chene_sombre']
  },
  oak_wood: {
    id: 'oak_wood',
    name: 'Chêne Doré Français',
    nameEn: 'French Golden Oak',
    category: 'natural',
    icon: '🌲',
    description: 'Bois blond naturel équilibré idéal pour planchers et comptoirs scandinaves.',
    defaultColor: '#d97706',
    roughness: 0.48,
    metalness: 0.01,
    clearcoat: 0.15,
    clearcoatRoughness: 0.25,
    normalScale: 0.65,
    defaultRepeat: [2, 2],
    keywords: ['chene', 'oak', 'bois_clair', 'parquet', 'planche', 'dore', 'naturel']
  },
  grained_leather: {
    id: 'grained_leather',
    name: 'Cuir Taurillon Pleine Fleur',
    nameEn: 'Full Grain Taurillon Leather',
    category: 'luxury',
    icon: '👜',
    description: 'Maroquinerie d\'exception au grain tactile souple et velouté.',
    defaultColor: '#5c270d',
    roughness: 0.52,
    metalness: 0.02,
    sheen: 0.92,
    sheenColor: '#fde68a',
    clearcoat: 0.08,
    clearcoatRoughness: 0.40,
    normalScale: 1.20,
    defaultRepeat: [6, 6],
    keywords: ['cuir', 'leather', 'taurillon', 'sac', 'fauteuil', 'maroquinerie', 'caramel', 'sellerie']
  },
  brushed_steel: {
    id: 'brushed_steel',
    name: 'Acier Inox Brossé',
    nameEn: 'Brushed Stainless Steel',
    category: 'industrial',
    icon: '⚙️',
    description: 'Inox brossé linéaire anti-reflets, robuste pour cuisines et outillages.',
    defaultColor: '#94a3b8',
    roughness: 0.26,
    metalness: 0.94,
    clearcoat: 0.18,
    clearcoatRoughness: 0.35,
    normalScale: 0.55,
    defaultRepeat: [4, 1],
    keywords: ['inox', 'acier', 'steel', 'metal', 'brosse', 'cuisine', 'argent', 'fer']
  },
  space_titanium: {
    id: 'space_titanium',
    name: 'Titane Spatial Anodisé',
    nameEn: 'Space Anodized Titanium',
    category: 'industrial',
    icon: '🚀',
    description: 'Alliage ultra-résistant de qualité aérospatiale aux reflets sombres furtifs.',
    defaultColor: '#334155',
    roughness: 0.32,
    metalness: 0.98,
    clearcoat: 0.45,
    clearcoatRoughness: 0.18,
    normalScale: 0.40,
    defaultRepeat: [2, 2],
    keywords: ['titane', 'titanium', 'spatial', 'aerospace', 'furtif', 'gris_fonce', 'coque']
  },
  waxed_concrete: {
    id: 'waxed_concrete',
    name: 'Béton Ciré Loft & Galerie',
    nameEn: 'Waxed Gallery Concrete',
    category: 'architectural',
    icon: '🧱',
    description: 'Enduit minéral contemporain avec nuances de truellage et porosité naturelle.',
    defaultColor: '#64748b',
    roughness: 0.82,
    metalness: 0.03,
    clearcoat: 0.08,
    normalScale: 0.85,
    defaultRepeat: [2, 2],
    keywords: ['beton', 'concrete', 'cire', 'sol', 'mur', 'loft', 'galerie', 'mineral', 'gris']
  },
  imperial_brass: {
    id: 'imperial_brass',
    name: 'Laiton & Or Impérial',
    nameEn: 'Imperial Polished Brass',
    category: 'luxury',
    icon: '👑',
    description: 'Dorure joaillière lustrée pour fermoirs, luminaires et parures prestige.',
    defaultColor: '#eab308',
    roughness: 0.22,
    metalness: 0.92,
    clearcoat: 0.40,
    clearcoatRoughness: 0.12,
    normalScale: 0.30,
    defaultRepeat: [2, 2],
    keywords: ['or', 'gold', 'laiton', 'brass', 'dore', 'bijou', 'fermoir', 'precieux']
  },
  smoked_glass: {
    id: 'smoked_glass',
    name: 'Verre Fumé & Cristal Teinté',
    nameEn: 'Smoked Obsidian Glass',
    category: 'luxury',
    icon: '🍷',
    description: 'Verre teinté translucide avec indice de réfraction fidèle et reflets purs.',
    defaultColor: '#1e293b',
    roughness: 0.10,
    metalness: 0.08,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04,
    transmission: 0.82,
    ior: 1.52,
    transparent: true,
    opacity: 0.88,
    normalScale: 0.10,
    defaultRepeat: [1, 1],
    keywords: ['verre', 'glass', 'cristal', 'fume', 'transparent', 'vitre', 'flacon', 'noir']
  },
  royal_velvet: {
    id: 'royal_velvet',
    name: 'Velours Royal Nuit',
    nameEn: 'Royal Midnight Velvet',
    category: 'luxury',
    icon: '🧵',
    description: 'Tissu texturé absorbant et velouté à diffusion spéculaire rasante.',
    defaultColor: '#1e1b4b',
    roughness: 0.88,
    metalness: 0.0,
    sheen: 1.0,
    sheenColor: '#818cf8',
    normalScale: 0.70,
    defaultRepeat: [4, 4],
    keywords: ['velours', 'velvet', 'tissu', 'textile', 'drap', 'bleu', 'rideau', 'coussin']
  },
  carbon_fiber: {
    id: 'carbon_fiber',
    name: 'Fibre de Carbone 3K',
    nameEn: '3K Twill Carbon Fiber',
    category: 'industrial',
    icon: '🏎️',
    description: 'Trame sergé composite carbone avec vernis laqué ultra-profond.',
    defaultColor: '#090d16',
    roughness: 0.22,
    metalness: 0.48,
    clearcoat: 0.95,
    clearcoatRoughness: 0.06,
    normalScale: 0.90,
    defaultRepeat: [8, 8],
    keywords: ['carbone', 'carbon', 'fiber', 'composite', 'course', 'sport', 'trame']
  },
  terracotta_clay: {
    id: 'terracotta_clay',
    name: 'Terre Cuite d\'Atelier',
    nameEn: 'Artisan Terracotta Clay',
    category: 'architectural',
    icon: '🏺',
    description: 'Argile méditerranéenne cuite au feu au grain chaleureux et mat.',
    defaultColor: '#c2410c',
    roughness: 0.80,
    metalness: 0.02,
    clearcoat: 0.0,
    normalScale: 0.70,
    defaultRepeat: [2, 2],
    keywords: ['terracotta', 'argile', 'poterie', 'terre_cuite', 'rouge', 'brique', 'ceramique']
  }
};

export function getPBRMaterialPreset(presetId: string): PBRMaterialPreset | undefined {
  const normId = presetId.toLowerCase().replace('pbr:', '').trim();
  return PBR_PRESETS[normId];
}

export function getAllPBRMaterialPresets(): PBRMaterialPreset[] {
  return Object.values(PBR_PRESETS);
}

export function findPBRMaterialByQuery(query: string): PBRMaterialPreset | undefined {
  const q = query.toLowerCase().trim();
  const direct = getPBRMaterialPreset(q);
  if (direct) return direct;

  for (const preset of Object.values(PBR_PRESETS)) {
    if (preset.name.toLowerCase().includes(q) || preset.nameEn.toLowerCase().includes(q)) {
      return preset;
    }
    for (const kw of preset.keywords) {
      if (q.includes(kw) || kw.includes(q)) {
        return preset;
      }
    }
  }
  return undefined;
}

// Memory caches to avoid re-generating canvas maps repeatedly
const albedoCache = new Map<string, THREE.CanvasTexture>();
const normalCache = new Map<string, THREE.CanvasTexture>();
const roughnessCache = new Map<string, THREE.CanvasTexture>();

/**
 * Procedural normal map builder from height canvas
 */
function createNormalMapFromHeight(heightCanvas: HTMLCanvasElement, strength: number = 2.0): THREE.CanvasTexture {
  const width = heightCanvas.width;
  const height = heightCanvas.height;
  const normalCanvas = document.createElement('canvas');
  normalCanvas.width = width;
  normalCanvas.height = height;
  const hCtx = heightCanvas.getContext('2d');
  const nCtx = normalCanvas.getContext('2d');

  if (hCtx && nCtx) {
    const hData = hCtx.getImageData(0, 0, width, height).data;
    const nImgData = nCtx.createImageData(width, height);
    const nData = nImgData.data;

    const getHeight = (x: number, y: number) => {
      const px = (x + width) % width;
      const py = (y + height) % height;
      return hData[(py * width + px) * 4] / 255.0;
    };

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const left = getHeight(x - 1, y);
        const right = getHeight(x + 1, y);
        const top = getHeight(x, y - 1);
        const bottom = getHeight(x, y + 1);

        const dx = (right - left) * strength;
        const dy = (bottom - top) * strength;
        const dz = 1.0;

        const len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1.0;
        const nx = dx / len;
        const ny = dy / len;
        const nz = dz / len;

        const idx = (y * width + x) * 4;
        nData[idx] = Math.floor((nx * 0.5 + 0.5) * 255);
        nData[idx + 1] = Math.floor((ny * 0.5 + 0.5) * 255);
        nData[idx + 2] = Math.floor((nz * 0.5 + 0.5) * 255);
        nData[idx + 3] = 255;
      }
    }
    nCtx.putImageData(nImgData, 0, 0);
  }

  const texture = new THREE.CanvasTexture(normalCanvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Generates calibrated procedural maps for a preset
 */
export function getMaterialMaps(presetId: string, repeat?: [number, number]): {
  map: THREE.CanvasTexture | null;
  normalMap: THREE.CanvasTexture | null;
  roughnessMap: THREE.CanvasTexture | null;
} {
  const preset = getPBRMaterialPreset(presetId) || PBR_PRESETS.carrara_marble;
  const rep = repeat || preset.defaultRepeat;

  if (typeof document === 'undefined') {
    const dummy = new THREE.Texture() as unknown as THREE.CanvasTexture;
    return { map: dummy, normalMap: dummy, roughnessMap: dummy };
  }

  const cacheKey = `${preset.id}_${rep[0]}x${rep[1]}`;
  if (albedoCache.has(cacheKey) && normalCache.has(cacheKey) && roughnessCache.has(cacheKey)) {
    return {
      map: albedoCache.get(cacheKey)!,
      normalMap: normalCache.get(cacheKey)!,
      roughnessMap: roughnessCache.get(cacheKey)!
    };
  }

  const size = 512;
  const albedoCanvas = document.createElement('canvas');
  albedoCanvas.width = size;
  albedoCanvas.height = size;
  const aCtx = albedoCanvas.getContext('2d');

  const heightCanvas = document.createElement('canvas');
  heightCanvas.width = size;
  heightCanvas.height = size;
  const hCtx = heightCanvas.getContext('2d');

  const roughnessCanvas = document.createElement('canvas');
  roughnessCanvas.width = size;
  roughnessCanvas.height = size;
  const rCtx = roughnessCanvas.getContext('2d');

  if (aCtx && hCtx && rCtx) {
    if (preset.id === 'carrara_marble') {
      // Base blanc / ivoire délicat
      aCtx.fillStyle = '#f8fafc';
      aCtx.fillRect(0, 0, size, size);
      hCtx.fillStyle = '#808080';
      hCtx.fillRect(0, 0, size, size);
      rCtx.fillStyle = '#292929'; // très poli
      rCtx.fillRect(0, 0, size, size);

      // Veinage gris fumé
      aCtx.strokeStyle = 'rgba(100, 116, 139, 0.45)';
      hCtx.strokeStyle = '#a0a0a0';
      rCtx.strokeStyle = '#404040';

      for (let i = 0; i < 7; i++) {
        const startX = (i * 85) % size;
        aCtx.beginPath();
        hCtx.beginPath();
        rCtx.beginPath();
        aCtx.lineWidth = 2 + (i % 3) * 1.5;
        hCtx.lineWidth = aCtx.lineWidth;
        rCtx.lineWidth = aCtx.lineWidth;

        aCtx.moveTo(startX, 0);
        hCtx.moveTo(startX, 0);
        rCtx.moveTo(startX, 0);

        aCtx.bezierCurveTo(startX + 120, 150, startX - 90, 320, startX + 60, size);
        hCtx.bezierCurveTo(startX + 120, 150, startX - 90, 320, startX + 60, size);
        rCtx.bezierCurveTo(startX + 120, 150, startX - 90, 320, startX + 60, size);

        aCtx.stroke();
        hCtx.stroke();
        rCtx.stroke();
      }
    } else if (preset.id === 'walnut_wood' || preset.id === 'oak_wood') {
      const isOak = preset.id === 'oak_wood';
      const baseCol = isOak ? '#d97706' : '#451a03';
      const grainCol = isOak ? '#92400e' : '#271004';
      aCtx.fillStyle = baseCol;
      aCtx.fillRect(0, 0, size, size);
      hCtx.fillStyle = '#808080';
      hCtx.fillRect(0, 0, size, size);
      rCtx.fillStyle = isOak ? '#787878' : '#6b6b6b';
      rCtx.fillRect(0, 0, size, size);

      // Lignes de fil du bois
      for (let y = 0; y < size; y += 4) {
        const tone = (Math.sin(y * 0.08) * 0.5 + 0.5) * 0.35;
        aCtx.fillStyle = grainCol;
        aCtx.globalAlpha = tone;
        aCtx.fillRect(0, y, size, 2);

        hCtx.fillStyle = `rgb(${Math.floor(100 + tone * 120)}, ${Math.floor(100 + tone * 120)}, ${Math.floor(100 + tone * 120)})`;
        hCtx.fillRect(0, y, size, 2);
      }
      aCtx.globalAlpha = 1.0;
    } else if (preset.id === 'grained_leather') {
      // Fond profond de cuir pleine fleur noble (sillons et base dermique)
      aCtx.fillStyle = '#381607';
      aCtx.fillRect(0, 0, size, size);
      hCtx.fillStyle = '#404040'; // creux profonds
      hCtx.fillRect(0, 0, size, size);
      rCtx.fillStyle = '#a8a8a8'; // mat dans les sillons
      rCtx.fillRect(0, 0, size, size);

      // Grain cellulaire organique Voronoi jitteré de maroquinerie d'art
      const step = 7;
      for (let y = 0; y < size; y += step) {
        for (let x = 0; x < size; x += step) {
          const pseudoHash = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
          const jitterX = ((pseudoHash - Math.floor(pseudoHash)) - 0.5) * (step * 0.45);
          const pseudoHash2 = Math.sin(x * 93.9898 + y * 67.345) * 24634.6345;
          const jitterY = ((pseudoHash2 - Math.floor(pseudoHash2)) - 0.5) * (step * 0.45);

          const cx = x + step * 0.5 + jitterX;
          const cy = y + step * 0.5 + jitterY;
          const radius = (step * 0.46) + ((pseudoHash - Math.floor(pseudoHash)) * 0.15);

          // Dôme de galuchat / grain Taurillon (dégradé radial)
          const grad = aCtx.createRadialGradient(cx - radius * 0.2, cy - radius * 0.2, radius * 0.1, cx, cy, radius);
          grad.addColorStop(0, '#853d19'); // crête patinée brillante
          grad.addColorStop(0.65, '#5c270d'); // corps du grain
          grad.addColorStop(1, '#2b1005'); // sillon d'ombrage

          aCtx.fillStyle = grad;
          aCtx.beginPath();
          aCtx.arc(cx, cy, radius, 0, Math.PI * 2);
          aCtx.fill();

          // Dôme de hauteur bombé pour la normal map
          const hGrad = hCtx.createRadialGradient(cx, cy, 0, cx, cy, radius);
          hGrad.addColorStop(0, '#e5e5e5');
          hGrad.addColorStop(0.7, '#9e9e9e');
          hGrad.addColorStop(1, '#404040');
          hCtx.fillStyle = hGrad;
          hCtx.beginPath();
          hCtx.arc(cx, cy, radius, 0, Math.PI * 2);
          hCtx.fill();

          // Rugosité satinée soyeuse sur le dôme
          const rGrad = rCtx.createRadialGradient(cx, cy, 0, cx, cy, radius);
          rGrad.addColorStop(0, '#4a4a4a'); // soyeux poli au sommet
          rGrad.addColorStop(1, '#a8a8a8'); // mat au creux
          rCtx.fillStyle = rGrad;
          rCtx.beginPath();
          rCtx.arc(cx, cy, radius, 0, Math.PI * 2);
          rCtx.fill();
        }
      }
    } else if (preset.id === 'brushed_steel' || preset.id === 'space_titanium') {
      const isTitanium = preset.id === 'space_titanium';
      aCtx.fillStyle = isTitanium ? '#334155' : '#94a3b8';
      aCtx.fillRect(0, 0, size, size);
      hCtx.fillStyle = '#808080';
      hCtx.fillRect(0, 0, size, size);
      rCtx.fillStyle = isTitanium ? '#525252' : '#444444';
      rCtx.fillRect(0, 0, size, size);

      // Micro-stries horizontales anisotropiques
      for (let y = 0; y < size; y += 2) {
        const rand = (Math.sin(y * 11.3) * 0.5 + 0.5);
        aCtx.fillStyle = rand > 0.5 ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.15)';
        aCtx.fillRect(0, y, size, 1);

        hCtx.fillStyle = rand > 0.5 ? '#9c9c9c' : '#6e6e6e';
        hCtx.fillRect(0, y, size, 1);
      }
    } else if (preset.id === 'carbon_fiber') {
      aCtx.fillStyle = '#0f172a';
      aCtx.fillRect(0, 0, size, size);
      hCtx.fillStyle = '#808080';
      hCtx.fillRect(0, 0, size, size);
      rCtx.fillStyle = '#383838';
      rCtx.fillRect(0, 0, size, size);

      const twill = 16;
      for (let y = 0; y < size; y += twill) {
        for (let x = 0; x < size; x += twill) {
          const isDiag = ((Math.floor(x / twill) + Math.floor(y / twill)) % 2) === 0;
          aCtx.fillStyle = isDiag ? '#1e293b' : '#020617';
          aCtx.fillRect(x, y, twill, twill);

          hCtx.fillStyle = isDiag ? '#adadad' : '#525252';
          hCtx.fillRect(x, y, twill, twill);
        }
      }
    } else {
      // Béton ciré, laiton, velours, terre cuite (mottled shader canvas)
      aCtx.fillStyle = preset.defaultColor;
      aCtx.fillRect(0, 0, size, size);
      hCtx.fillStyle = '#808080';
      hCtx.fillRect(0, 0, size, size);
      rCtx.fillStyle = `rgb(${Math.floor(preset.roughness * 255)}, ${Math.floor(preset.roughness * 255)}, ${Math.floor(preset.roughness * 255)})`;
      rCtx.fillRect(0, 0, size, size);

      for (let i = 0; i < 40; i++) {
        const rx = (i * 73) % size;
        const ry = (i * 91) % size;
        const rr = 20 + (i % 5) * 8;
        aCtx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        aCtx.beginPath();
        aCtx.arc(rx, ry, rr, 0, Math.PI * 2);
        aCtx.fill();

        hCtx.fillStyle = '#707070';
        hCtx.beginPath();
        hCtx.arc(rx, ry, rr, 0, Math.PI * 2);
        hCtx.fill();
      }
    }
  }

  const albedoTex = new THREE.CanvasTexture(albedoCanvas);
  albedoTex.colorSpace = THREE.SRGBColorSpace;
  albedoTex.wrapS = THREE.RepeatWrapping;
  albedoTex.wrapT = THREE.RepeatWrapping;
  albedoTex.repeat.set(rep[0], rep[1]);
  albedoTex.needsUpdate = true;

  const normalTex = createNormalMapFromHeight(heightCanvas, preset.normalScale * 2.5);
  normalTex.wrapS = THREE.RepeatWrapping;
  normalTex.wrapT = THREE.RepeatWrapping;
  normalTex.repeat.set(rep[0], rep[1]);

  const roughTex = new THREE.CanvasTexture(roughnessCanvas);
  roughTex.wrapS = THREE.RepeatWrapping;
  roughTex.wrapT = THREE.RepeatWrapping;
  roughTex.repeat.set(rep[0], rep[1]);
  roughTex.needsUpdate = true;

  albedoCache.set(cacheKey, albedoTex);
  normalCache.set(cacheKey, normalTex);
  roughnessCache.set(cacheKey, roughTex);

  return { map: albedoTex, normalMap: normalTex, roughnessMap: roughTex };
}

export interface PBRMaterialProps {
  presetId?: string;
  color?: string;
  roughness?: number;
  metalness?: number;
  clearcoat?: number;
  repeat?: [number, number];
}

/**
 * High-fidelity PBR Material component using Three.js meshPhysicalMaterial
 */
export const PBRMaterial: React.FC<PBRMaterialProps> = ({
  presetId = 'carrara_marble',
  color,
  roughness,
  metalness,
  clearcoat,
  repeat
}) => {
  const preset = getPBRMaterialPreset(presetId) || PBR_PRESETS.carrara_marble;
  const maps = useMemo(() => getMaterialMaps(preset.id, repeat), [preset.id, repeat]);

  const matRoughness = roughness ?? preset.roughness;
  const matMetalness = metalness ?? preset.metalness;
  const matClearcoat = clearcoat ?? preset.clearcoat ?? 0;
  const matColor = color || preset.defaultColor;

  return (
    <meshPhysicalMaterial
      map={maps.map || undefined}
      normalMap={maps.normalMap || undefined}
      roughnessMap={maps.roughnessMap || undefined}
      color={matColor}
      roughness={matRoughness}
      metalness={matMetalness}
      clearcoat={matClearcoat}
      clearcoatRoughness={preset.clearcoatRoughness ?? 0.1}
      transmission={preset.transmission ?? 0}
      ior={preset.ior ?? 1.5}
      transparent={preset.transparent ?? false}
      opacity={preset.opacity ?? 1.0}
      sheen={preset.sheen ?? 0}
      sheenColor={preset.sheenColor}
    />
  );
};

/**
 * Factory creating a standalone Three.js MeshPhysicalMaterial instance for PBR overrides on GLTF models
 */
export function createPBRMaterial(presetId: string, options: {
  color?: string;
  roughness?: number;
  metalness?: number;
  clearcoat?: number;
  repeat?: [number, number];
} = {}): THREE.MeshPhysicalMaterial {
  const preset = getPBRMaterialPreset(presetId) || PBR_PRESETS.carrara_marble;
  const maps = getMaterialMaps(preset.id, options.repeat);

  const matRoughness = options.roughness ?? preset.roughness;
  const matMetalness = options.metalness ?? preset.metalness;
  const matClearcoat = options.clearcoat ?? preset.clearcoat ?? 0;
  const matColor = options.color || preset.defaultColor;

  const matParams: THREE.MeshPhysicalMaterialParameters = {
    map: maps.map || undefined,
    normalMap: maps.normalMap || undefined,
    roughnessMap: maps.roughnessMap || undefined,
    color: new THREE.Color(matColor),
    roughness: matRoughness,
    metalness: matMetalness,
    clearcoat: matClearcoat,
    clearcoatRoughness: preset.clearcoatRoughness ?? 0.1,
    transmission: preset.transmission ?? 0,
    ior: preset.ior ?? 1.5,
    transparent: preset.transparent ?? false,
    opacity: preset.opacity ?? 1.0,
    sheen: preset.sheen ?? 0
  };
  if (preset.sheenColor) {
    matParams.sheenColor = new THREE.Color(preset.sheenColor);
  }
  return new THREE.MeshPhysicalMaterial(matParams);
}
