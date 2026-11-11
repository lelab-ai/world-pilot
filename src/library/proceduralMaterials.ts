import * as THREE from 'three';

// Cache for generated procedural textures so we only create them once
const textureCache = new Map<string, THREE.CanvasTexture>();

/**
 * Creates a directional brushed metal canvas texture for roughness / bump maps.
 */
export function getBrushedMetalTexture(width = 256, height = 256): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const key = `brushed_${width}_${height}`;
  if (textureCache.has(key)) return textureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const imgData = ctx.createImageData(width, height);
  // Generate horizontal striations
  const rowNoise: number[] = [];
  let seed = 42;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };

  for (let y = 0; y < height; y++) {
    rowNoise[y] = random() * 60;
  }

  for (let y = 0; y < height; y++) {
    const baseVal = rowNoise[y];
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const grain = (random() - 0.5) * 20;
      const val = Math.max(0, Math.min(255, 128 + baseVal * 0.6 + grain));
      imgData.data[idx] = val;
      imgData.data[idx + 1] = val;
      imgData.data[idx + 2] = val;
      imgData.data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 4);
  textureCache.set(key, texture);
  return texture;
}

/**
 * Creates a diamond knurling texture (cross-hatched pattern found on high-precision knobs).
 */
export function getKnurledTexture(size = 128): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const key = `knurled_${size}`;
  if (textureCache.has(key)) return textureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);

  const step = 8;
  ctx.lineWidth = 1.5;
  // Diagonals 1
  ctx.strokeStyle = '#202020';
  for (let d = -size; d < size * 2; d += step) {
    ctx.beginPath();
    ctx.moveTo(d, 0);
    ctx.lineTo(d + size, size);
    ctx.stroke();
  }
  // Diagonals 2
  ctx.strokeStyle = '#ffffff';
  for (let d = -size; d < size * 2; d += step) {
    ctx.beginPath();
    ctx.moveTo(d, size);
    ctx.lineTo(d + size, 0);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 2);
  textureCache.set(key, texture);
  return texture;
}

/**
 * Procedural optical glass with physical transmission and refraction.
 */
export function createOpticalGlassMaterial(tint = '#eef8fc'): THREE.Material {
  return new THREE.MeshPhysicalMaterial({
    color: tint,
    transmission: 0.94,
    opacity: 1,
    transparent: true,
    roughness: 0.05,
    ior: 1.52, // Crown glass refractive index
    thickness: 0.08,
    specularIntensity: 1.0,
    specularColor: new THREE.Color(0xffffff),
    depthWrite: false,
  });
}

/**
 * High-precision chrome / stainless steel material with anisotropic micro-brushing.
 */
export function createChromeMaterial(isBrushed = true): THREE.MeshStandardMaterial {
  const brushedMap = isBrushed ? getBrushedMetalTexture() : null;
  const mat = new THREE.MeshStandardMaterial({
    color: '#d6dbe0',
    metalness: 0.92,
    roughness: isBrushed ? 0.22 : 0.1,
  });
  if (brushedMap) {
    mat.roughnessMap = brushedMap;
    mat.bumpMap = brushedMap;
    mat.bumpScale = 0.0008;
  }
  return mat;
}

/**
 * Knurled adjustment wheel material for precision dials.
 */
export function createKnurledMetalMaterial(color = '#b0b8bc'): THREE.MeshStandardMaterial {
  const knurl = getKnurledTexture();
  const mat = new THREE.MeshStandardMaterial({
    color,
    metalness: 0.85,
    roughness: 0.35,
  });
  if (knurl) {
    mat.bumpMap = knurl;
    mat.bumpScale = 0.003;
  }
  return mat;
}

/**
 * High-grade laboratory enamel with protective clearcoat.
 */
export function createEnamelMaterial(color: string, clearcoat = 0.75): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color,
    metalness: 0.1,
    roughness: 0.32,
    clearcoat,
    clearcoatRoughness: 0.18,
    reflectivity: 0.6,
  });
}

/**
 * Emissive condenser / LED illumination source.
 */
export function createEmissiveSourceMaterial(color = '#e2f4ff', intensity = 2.5): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: '#ffffff',
    emissive: color,
    emissiveIntensity: intensity,
    roughness: 0.15,
  });
}

/**
 * Creates a procedural natural wood grain canvas texture.
 */
export function getWoodTexture(width = 256, height = 256): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const key = `wood_${width}_${height}`;
  if (textureCache.has(key)) return textureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const imgData = ctx.createImageData(width, height);
  let seed = 123;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      // Wavy longitudinal wood fiber lines
      const wave = Math.sin(y * 0.08 + Math.sin(x * 0.04) * 2.5);
      const ring = Math.sin(Math.sqrt((x - width * 0.5) ** 2 + ((y - height * 0.5) * 0.25) ** 2) * 0.1);
      const grain = (random() - 0.5) * 18;
      const v = Math.max(0, Math.min(255, 128 + wave * 22 + ring * 14 + grain));

      imgData.data[idx] = v;
      imgData.data[idx + 1] = v;
      imgData.data[idx + 2] = v;
      imgData.data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 4);
  textureCache.set(key, texture);
  return texture;
}

/**
 * Realistic satin PBR wood material with fine grain relief.
 */
export function createPBRWoodMaterial(color = '#aa7850'): THREE.MeshStandardMaterial {
  const woodMap = getWoodTexture();
  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.42,
    metalness: 0.02,
  });
  if (woodMap) {
    mat.roughnessMap = woodMap;
    mat.bumpMap = woodMap;
    mat.bumpScale = 0.001;
  }
  return mat;
}

/**
 * Transparent liquid material with real physical refraction and meniscus.
 */
export function createLiquidMaterial(color = '#38a169', opacity = 0.88): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color,
    transmission: 0.86,
    opacity,
    transparent: true,
    roughness: 0.06,
    ior: 1.333, // Water refractive index
    thickness: 0.15,
    depthWrite: false,
  });
}

/**
 * Modern glossy glass screen material for monitors and terminal displays.
 */
export function createGlossyScreenMaterial(): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: '#0f1416',
    metalness: 0.1,
    roughness: 0.12,
    clearcoat: 0.9,
    clearcoatRoughness: 0.08,
    reflectivity: 0.8,
  });
}
