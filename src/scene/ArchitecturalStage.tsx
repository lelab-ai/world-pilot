import { useMemo, useEffect } from 'react';
import { Environment, Lightformer, Stars, RoundedBox, ContactShadows, MeshReflectorMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { getWorldTheme } from '../library/worldThemes';
import { useWorldStore } from '../engine/store';
import { useRenderBudget } from './renderQuality';

// 1. Procedural Stone Texture (Earth / Atelier)
function makeStoneTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  const pixels = ctx.createImageData(512, 512);
  let seed = 17;
  for (let y = 0; y < 512; y++) {
    for (let x = 0; x < 512; x++) {
      seed = (seed * 16807) % 2147483647;
      const grain = (seed / 2147483647 - 0.5) * 14;
      const vein = Math.sin(y * 0.09 + Math.sin(x * 0.016) * 2) * 3;
      const i = (y * 512 + x) * 4;
      pixels.data[i] = 187 + grain + vein;
      pixels.data[i + 1] = 180 + grain + vein;
      pixels.data[i + 2] = 163 + grain + vein;
      pixels.data[i + 3] = 255;
    }
  }
  ctx.putImageData(pixels, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(10, 10);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

// 2. Procedural Martian Regolith Texture (Mars / Jezero Crater)
function makeMartianRegolithTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  const pixels = ctx.createImageData(512, 512);
  let seed = 42;
  for (let y = 0; y < 512; y++) {
    for (let x = 0; x < 512; x++) {
      seed = (seed * 16807) % 2147483647;
      const grain = (seed / 2147483647 - 0.5) * 26;
      const dune = Math.sin(y * 0.04 + Math.cos(x * 0.03) * 2.5) * 12;
      const microCrater = Math.sin(x * 0.12) * Math.cos(y * 0.12) * 8;
      const i = (y * 512 + x) * 4;
      pixels.data[i] = Math.min(255, Math.max(0, 160 + grain + dune + microCrater)); // Red
      pixels.data[i + 1] = Math.min(255, Math.max(0, 68 + grain * 0.6 + dune * 0.5)); // Green
      pixels.data[i + 2] = Math.min(255, Math.max(0, 36 + grain * 0.4)); // Blue
      pixels.data[i + 3] = 255;
    }
  }
  ctx.putImageData(pixels, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(12, 12);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

// 3. Procedural Lunar Dust Texture (Moon / Basalt Dust)
function makeLunarDustTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  const pixels = ctx.createImageData(512, 512);
  let seed = 99;
  for (let y = 0; y < 512; y++) {
    for (let x = 0; x < 512; x++) {
      seed = (seed * 16807) % 2147483647;
      const grain = (seed / 2147483647 - 0.5) * 22;
      const craterRipples = Math.sin(x * 0.06 + y * 0.06) * 6;
      const i = (y * 512 + x) * 4;
      const shade = Math.min(255, Math.max(0, 85 + grain + craterRipples));
      pixels.data[i] = shade;
      pixels.data[i + 1] = shade * 1.02;
      pixels.data[i + 2] = shade * 1.08;
      pixels.data[i + 3] = 255;
    }
  }
  ctx.putImageData(pixels, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(12, 12);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

// 4. Procedural Orbital Titanium Metal Deck (Space Station / Zero-G)
function makeOrbitalMetalTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#222834';
  ctx.fillRect(0, 0, 512, 512);

  // Metal panel seam lines
  ctx.strokeStyle = '#10151f';
  ctx.lineWidth = 3;
  for (let i = 0; i <= 512; i += 64) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 512);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(512, i);
    ctx.stroke();
  }

  // Cyan illuminated circuitry seam accents
  ctx.strokeStyle = '#00d2ff';
  ctx.lineWidth = 1.5;
  for (let i = 128; i < 512; i += 128) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 512);
    ctx.stroke();
  }

  // Rivets on intersections
  ctx.fillStyle = '#4f5e73';
  for (let y = 32; y < 512; y += 64) {
    for (let x = 32; x < 512; x += 64) {
      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 8);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

// 5. Procedural Cyber Grid Texture (Neo-Tokyo / Matrix)
function makeCyberGridTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#07050d';
  ctx.fillRect(0, 0, 512, 512);

  // Subtle dark grid
  ctx.strokeStyle = '#1b132e';
  ctx.lineWidth = 2;
  for (let i = 0; i <= 512; i += 32) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 512);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(512, i);
    ctx.stroke();
  }

  // Neon Cyan & Magenta high-energy power conduits
  ctx.strokeStyle = '#00ffff';
  ctx.lineWidth = 1.5;
  for (let i = 128; i <= 512; i += 256) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 512);
    ctx.stroke();
  }
  ctx.strokeStyle = '#ff007f';
  for (let i = 256; i <= 512; i += 256) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(512, i);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 8);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

// 6. Procedural Warm Wood Parquet Texture (Cozy Bistrot)
function makeWarmWoodTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  const pixels = ctx.createImageData(512, 512);
  let seed = 73;
  for (let y = 0; y < 512; y++) {
    for (let x = 0; x < 512; x++) {
      seed = (seed * 16807) % 2147483647;
      const grain = (seed / 2147483647 - 0.5) * 16;
      const plank = Math.floor(y / 32) % 2 === 0 ? 8 : -8;
      const stripe = Math.sin(x * 0.4) * 4;
      const i = (y * 512 + x) * 4;
      pixels.data[i] = Math.min(255, Math.max(0, 118 + grain + plank + stripe));
      pixels.data[i + 1] = Math.min(255, Math.max(0, 78 + grain * 0.7 + plank * 0.7));
      pixels.data[i + 2] = Math.min(255, Math.max(0, 48 + grain * 0.5));
      pixels.data[i + 3] = 255;
    }
  }
  ctx.putImageData(pixels, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 8);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

// 7. Procedural Italian Calacatta Gold Marble Texture
function makeCalacattaMarbleTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  const pixels = ctx.createImageData(512, 512);
  let seed = 88;
  for (let y = 0; y < 512; y++) {
    for (let x = 0; x < 512; x++) {
      seed = (seed * 16807) % 2147483647;
      const grain = (seed / 2147483647 - 0.5) * 8;
      // Fluid branching marble veins
      const vein1 = Math.sin(x * 0.02 + y * 0.03 + Math.sin(x * 0.05 + y * 0.02) * 3);
      const vein2 = Math.cos(x * 0.015 - y * 0.025 + Math.cos(y * 0.04) * 2);
      const isVein = Math.abs(vein1 * vein2) < 0.08 ? 1 : 0;
      const veinShade = isVein ? 35 : 0;
      const goldTint = isVein ? 12 : 0;
      const i = (y * 512 + x) * 4;
      pixels.data[i] = Math.min(255, 248 - veinShade + goldTint + grain);
      pixels.data[i + 1] = Math.min(255, 246 - veinShade + goldTint * 0.7 + grain);
      pixels.data[i + 2] = Math.min(255, 242 - veinShade + grain);
      pixels.data[i + 3] = 255;
    }
  }
  ctx.putImageData(pixels, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 6);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

// 8. Procedural Architectural Honed Terrazzo Texture
function makeTerrazzoTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#e8e4dc';
  ctx.fillRect(0, 0, 512, 512);
  let seed = 123;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const chipColors = ['#292524', '#78716c', '#b45309', '#ca8a04', '#44403c', '#d6d3d1'];
  for (let n = 0; n < 450; n++) {
    const cx = random() * 512;
    const cy = random() * 512;
    const radius = 1.5 + random() * 3.5;
    ctx.fillStyle = chipColors[Math.floor(random() * chipColors.length)];
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 6);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function Block({ position, size, color = '#d1c8b7', roughness = 0.82, metalness = 0.05 }: {
  position: [number, number, number]; size: [number, number, number]; color?: string; roughness?: number; metalness?: number;
}) {
  return <mesh position={position} castShadow receiveShadow>
    <boxGeometry args={size} />
    <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} />
  </mesh>;
}

// 10. Procedural Forest Soil Texture (Moss, Damp Loam & Autumn Leaves)
function makeForestSoilTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#24160e';
  ctx.fillRect(0, 0, 512, 512);

  let seed = 73;
  const pixels = ctx.getImageData(0, 0, 512, 512);
  for (let y = 0; y < 512; y++) {
    for (let x = 0; x < 512; x++) {
      seed = (seed * 16807) % 2147483647;
      const noise = seed / 2147483647;
      const mossVal = Math.sin(x * 0.035) * Math.cos(y * 0.035) + Math.sin((x + y) * 0.05) * 0.45;
      const i = (y * 512 + x) * 4;
      if (mossVal > 0.25) {
        pixels.data[i] = Math.min(255, 45 + Math.floor(noise * 30));
        pixels.data[i + 1] = Math.min(255, 82 + Math.floor(noise * 45));
        pixels.data[i + 2] = Math.min(255, 30 + Math.floor(noise * 20));
      } else {
        pixels.data[i] = Math.min(255, 36 + Math.floor(noise * 25));
        pixels.data[i + 1] = Math.min(255, 22 + Math.floor(noise * 18));
        pixels.data[i + 2] = Math.min(255, 14 + Math.floor(noise * 12));
      }
    }
  }
  ctx.putImageData(pixels, 0, 0);

  const leafColors = ['#b45309', '#c2410c', '#d97706', '#854d0e'];
  for (let l = 0; l < 90; l++) {
    const lx = (Math.sin(l * 12.3) * 0.5 + 0.5) * 500;
    const ly = (Math.cos(l * 17.7) * 0.5 + 0.5) * 500;
    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(l * 0.85);
    ctx.fillStyle = leafColors[l % leafColors.length];
    ctx.beginPath();
    ctx.ellipse(0, 0, 6.5, 3.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(12, 12);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

// 11. Procedural Golden Sand Texture (Beach & Dunes)
function makeGoldenSandTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 512, 512);
  grad.addColorStop(0, '#e5c290');
  grad.addColorStop(0.5, '#d4a86a');
  grad.addColorStop(1, '#dfb983');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  const pixels = ctx.createImageData(512, 512);
  const d = pixels.data;
  let seed = 42;
  for (let i = 0; i < d.length; i += 4) {
    seed = (seed * 16807) % 2147483647;
    const noise = (seed / 2147483647 - 0.5) * 22;
    d[i] = Math.max(0, Math.min(255, 220 + noise));
    d[i + 1] = Math.max(0, Math.min(255, 185 + noise * 0.9));
    d[i + 2] = Math.max(0, Math.min(255, 138 + noise * 0.7));
    d[i + 3] = 255;
  }
  ctx.putImageData(pixels, 0, 0);

  ctx.strokeStyle = 'rgba(255, 248, 220, 0.18)';
  ctx.lineWidth = 2.5;
  for (let y = 16; y < 512; y += 36) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= 512; x += 32) {
      const cy = y + Math.sin(x * 0.035) * 5;
      ctx.lineTo(x, cy);
    }
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(12, 12);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

const FLOOR_TEXTURE_FACTORIES: Record<string, () => THREE.CanvasTexture> = {
  stone: makeStoneTexture,
  martian_regolith: makeMartianRegolithTexture,
  lunar_dust: makeLunarDustTexture,
  orbital_metal: makeOrbitalMetalTexture,
  cyber_grid: makeCyberGridTexture,
  warm_wood: makeWarmWoodTexture,
  crystal_lattice: makeCyberGridTexture,
  calacatta_marble: makeCalacattaMarbleTexture,
  terrazzo: makeTerrazzoTexture,
  forest_soil: makeForestSoilTexture,
  golden_sand: makeGoldenSandTexture,
};

export function ArchitecturalStage({ evening }: { evening: boolean }) {
  const renderBudget = useRenderBudget();
  const currentWorldThemeId = useWorldStore(state => state.currentWorldThemeId);
  const theme = getWorldTheme(currentWorldThemeId);
  const floorType = theme.stageStyle === 'luxury_gallery'
    ? 'calacatta_marble'
    : theme.stageStyle === 'contemporary_gallery'
    ? 'terrazzo'
    : theme.stageStyle === 'forest_clearing'
    ? 'forest_soil'
    : theme.stageStyle === 'coastal_beach'
    ? 'golden_sand'
    : theme.floor.type;
  const activeFloorTexture = useMemo(() => floorType === null ? null
    : (FLOOR_TEXTURE_FACTORIES[floorType] || makeStoneTexture)(), [floorType]);

  useEffect(() => () => activeFloorTexture?.dispose(), [activeFloorTexture]);

  const isCustomAtmo = currentWorldThemeId !== 'earth-atelier';

  const bgColor = isCustomAtmo ? theme.lighting.bg : (evening ? '#676a6b' : '#d4d9d5');
  const fogColor = isCustomAtmo ? theme.lighting.fog : (evening ? '#676a6b' : '#d4d9d5');
  const dirLightColor = isCustomAtmo ? theme.lighting.lightColor : (evening ? '#ffc18a' : '#fff0d5');
  // Normalisation photométrique universelle (Anti-Washout / Anti-Éblouissement) :
  // Borne l'éclairement cumulé (Directional + Ambient + Hemisphere) pour éviter tout écrêtage blanc saturé
  const rawIntensity = isCustomAtmo ? theme.lighting.intensity : (evening ? 1.55 : 1.7);
  const normalizedIntensity = Math.min(rawIntensity, 1.85);
  const normalizedAmbient = Math.min(isCustomAtmo ? (theme.lighting.ambientIntensity ?? 0.52) : 0.45, 0.60);
  const normalizedHemi = Math.min(evening || isCustomAtmo ? 0.45 : 0.40, 0.50);

  const hemiSky = isCustomAtmo ? theme.lighting.ambient : '#e4f0ff';
  const hemiGround = isCustomAtmo ? theme.lighting.fog : (evening ? '#8b7d6b' : '#a7997e');
  const fogNear = theme.lighting.fogNear ?? (isCustomAtmo ? 18 : 60);
  const fogFar = theme.lighting.fogFar ?? (isCustomAtmo ? 75 : 160);

  return <>
    <color attach="background" args={[bgColor]} />
    <fog attach="fog" args={[fogColor, fogNear, fogFar]} />
    <ambientLight intensity={normalizedAmbient} color="#f8fafc" />
    <hemisphereLight args={[hemiSky, hemiGround, normalizedHemi]} />
    <directionalLight key={renderBudget.shadowMapSize} position={[-8, 12, 5]} color={dirLightColor}
      intensity={normalizedIntensity} castShadow
      shadow-mapSize={[renderBudget.shadowMapSize, renderBudget.shadowMapSize]} shadow-camera-left={isCustomAtmo ? -14 : -9} shadow-camera-right={isCustomAtmo ? 14 : 9}
      shadow-camera-top={isCustomAtmo ? 14 : 9} shadow-camera-bottom={isCustomAtmo ? -14 : -9} shadow-camera-far={45}
      shadow-normalBias={0.035} shadow-bias={-0.00015} />

    {theme.stars && (
      <Stars
        radius={95}
        depth={50}
        count={theme.id === 'orbital-zerog' ? 2600 : 1400}
        factor={3.8}
        saturation={0.15}
        fade
        speed={0.8}
      />
    )}

    <Environment key={`${String(evening)}_${currentWorldThemeId}`} resolution={512} frames={1}>
      <Lightformer position={[-5, 7, 3]} scale-x={12} scale-y={8} intensity={evening ? 1.1 : 1.35} color={dirLightColor} target={[0, 0, 0]} />
      <Lightformer position={[6, 4, 0]} scale-x={6} scale-y={8} intensity={0.9} color="#dbe9ef" target={[0, 0, 0]} />
      <Lightformer position={[0, 6, -8]} scale-x={14} scale-y={3} intensity={0.85} color="#ffffff" target={[0, 0, 0]} />
      <Lightformer position={[0, 7.5, 0]} rotation={[Math.PI / 2, 0, 0]} scale-x={10} scale-y={4} intensity={1.8} color="#f8fafc" />
      <Lightformer position={[-4.2, 6.8, 0]} rotation={[Math.PI / 2, 0, 0]} scale-x={2} scale-y={9.5} intensity={2.2} color="#e0f2fe" />
      <Lightformer position={[4.2, 6.8, 0]} rotation={[Math.PI / 2, 0, 0]} scale-x={2} scale-y={9.5} intensity={2.2} color="#e0f2fe" />
    </Environment>

    {/* Ombres de contact douces au sol pour ancrer physiquement les véhicules, meubles et avatars */}
    <ContactShadows
      position={[0, 0.003, 0]}
      opacity={0.55}
      scale={14}
      blur={2.1}
      far={4.2}
      resolution={256}
      color="#020617"
    />

    {/* Primary Metamorphic Ground Plane */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.018, 0]} receiveShadow>
      <planeGeometry args={[160, 160]} />
      <meshStandardMaterial
        map={activeFloorTexture}
        bumpMap={activeFloorTexture}
        bumpScale={theme.floor.bumpScale || 0.025}
        roughness={theme.floor.roughness}
        metalness={theme.floor.metalness}
      />
    </mesh>

    {/* Flush circular work area, kept at y=0 to match the world's physics floor (omitted in supercar_studio which has its own mirror dais) */}
    {theme.stageStyle !== 'supercar_studio' && (
      <>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.006, 0]} receiveShadow>
          <circleGeometry args={[5.6, 128]} />
          <meshStandardMaterial
            color={theme.floor.primaryColor}
            roughness={theme.floor.roughness}
            metalness={theme.floor.metalness}
          />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.004, 0]}>
          <ringGeometry args={[5.59, 5.63, 128]} />
          <meshStandardMaterial
            color={theme.floor.accentColor}
            roughness={0.25}
            metalness={0.85}
            emissive={theme.id === 'cyberpunk-matrix' || theme.id === 'orbital-zerog' ? theme.floor.accentColor : '#000000'}
            emissiveIntensity={theme.id === 'cyberpunk-matrix' || theme.id === 'orbital-zerog' ? 0.6 : 0}
          />
        </mesh>
      </>
    )}

    {/* Adaptive Modular Stage Architecture ("Design +++") */}
    {theme.stageStyle === 'pavilion' && (
      // Avant-Garde Architectural Open Pavilion ("Design +++"):
      // Stepped floating travertine plinth, rhythmic fluted oak louvers at Z=-17, floating halo light ring at Y=7.2, 0 camera occlusion
      <>
        {/* Stepped floating travertine dais with negative reveal LED shadow gap */}
        <group position={[0, -0.01, 0]}>
          <RoundedBox args={[8.4, 0.05, 6.4]} radius={0.03} smoothness={4} position={[0, 0, 0]} receiveShadow>
            <meshStandardMaterial color="#ded7c8" roughness={0.5} metalness={0.06} />
          </RoundedBox>
          {/* Recessed perimeter LED trough */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
            <ringGeometry args={[4.2, 4.25, 64]} />
            <meshStandardMaterial color="#fef3c7" emissive="#fef3c7" emissiveIntensity={0.8} />
          </mesh>
        </group>

        {/* Curved crescent of 11 vertical fluted white oak louvers at Z=-17 */}
        {[-14, -11, -8, -5, -2, 1, 4, 7, 10, 13, 16].map((x, i) => {
          const zOffset = -17 - Math.cos((i / 10 - 0.5) * Math.PI) * 2.2;
          const rotY = -(i / 10 - 0.5) * 0.45;
          return (
            <group key={i} position={[x, 0, zOffset]} rotation={[0, rotY, 0]}>
              <RoundedBox args={[0.38, 7.8, 0.12]} radius={0.02} smoothness={2} position={[0, 3.9, 0]} castShadow>
                <meshStandardMaterial color="#cbbba5" roughness={0.65} metalness={0.05} />
              </RoundedBox>
              {/* Recessed vertical grazing LED strip */}
              <mesh position={[0, 3.9, 0.07]}>
                <boxGeometry args={[0.04, 7.4, 0.02]} />
                <meshStandardMaterial color="#fffbeb" emissive="#fffbeb" emissiveIntensity={1.2} />
              </mesh>
              {(i === 1 || i === 5 || i === 9) && <pointLight position={[0, 0.6, 0.4]} color="#ffe0a2" intensity={2.8} distance={9} />}
            </group>
          );
        })}

        {/* Floating Minimalist Halo Chandelier at Y=7.2 */}
        <mesh position={[0, 7.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[4.2, 0.04, 16, 64]} />
          <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.2} emissive="#fef3c7" emissiveIntensity={0.9} />
        </mesh>
        <pointLight position={[0, 7.0, 0]} color="#fff7ed" intensity={3.5} distance={14} />
      </>
    )}

    {theme.stageStyle === 'luxury_gallery' && (
      // Flagship Salon Privé & Haute Joaillerie ("Design +++"):
      // Italian Calacatta Gold marble dais, champagne bronze inlays, crescent travertine colonnade at Z=-16.5, suspended bronze halo
      <>
        {/* Floating chamfered Calacatta Gold dais with brass negative reveal */}
        <group position={[0, -0.005, 0]}>
          <RoundedBox args={[7.6, 0.05, 5.6]} radius={0.035} smoothness={4} position={[0, 0, 0]} receiveShadow>
            <meshStandardMaterial color="#222834" roughness={0.4} metalness={0.2} />
          </RoundedBox>
          {/* Brushed brass inlay border */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.026, 0]}>
            <ringGeometry args={[3.45, 3.50, 64]} />
            <meshStandardMaterial color="#d4af37" metalness={0.95} roughness={0.12} />
          </mesh>
          {/* Recessed warm champagne cove underglow */}
          <pointLight position={[0, 0.05, 0]} color="#fbbf24" intensity={1.2} distance={8} />
        </group>

        {/* Distant crescent of 7 fluted architectural travertine columns at Z=-16.5 */}
        {[-13.5, -9, -4.5, 0, 4.5, 9, 13.5].map((x, i) => {
          const zOffset = -16.5 - Math.cos((i / 6 - 0.5) * Math.PI) * 1.8;
          return (
            <group key={i} position={[x, 0, zOffset]}>
              {/* Fluted column shaft */}
              <mesh position={[0, 4.5, 0]} castShadow>
                <cylinderGeometry args={[0.32, 0.42, 9, 32]} />
                <meshStandardMaterial color="#333b4d" roughness={0.5} metalness={0.1} />
              </mesh>
              {/* Plinth base in brushed champagne bronze */}
              <mesh position={[0, 0.14, 0]}>
                <cylinderGeometry args={[0.52, 0.60, 0.28, 32]} />
                <meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.18} />
              </mesh>
              {/* Recessed vertical grazing uplight */}
              {(i === 1 || i === 3 || i === 5) && <pointLight position={[0, 1.2, 0.6]} color="#fef3c7" intensity={2.0} distance={12} />}
            </group>
          );
        })}

        {/* Floating cantilevered bronze display console at the rear horizon */}
        <group position={[0, 1.2, -15.8]}>
          <RoundedBox args={[14, 0.08, 0.7]} radius={0.02} smoothness={3}>
            <meshStandardMaterial color="#d4af37" metalness={0.88} roughness={0.2} />
          </RoundedBox>
          <mesh position={[0, -0.06, 0]}>
            <boxGeometry args={[13.6, 0.02, 0.02]} />
            <meshStandardMaterial color="#fef3c7" emissive="#fef3c7" emissiveIntensity={1.8} />
          </mesh>
        </group>

        {/* Floating Minimalist Halo at Y=7.2 */}
        <mesh position={[0, 7.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[4.4, 0.035, 16, 64]} />
          <meshStandardMaterial color="#d4af37" metalness={0.92} roughness={0.15} emissive="#fef3c7" emissiveIntensity={0.8} />
        </mesh>
        <pointLight position={[0, 6.8, 0]} color="#fffbeb" intensity={4} distance={14} />
      </>
    )}

    {theme.stageStyle === 'supercar_studio' && (
      // Automotive design studio:
      // Sleek architectural dais with mirror-polished reflector floor, champagne/titanium chamfer, ice-cyan neon ring, studio key spotlight, twin rim backlights, overhead softbox lightformers
      <>
        {/* Architectural stage dais with real-time mirror floor */}
        <group position={[0, -0.008, 0]}>
          <mesh receiveShadow position={[0, -0.01, 0]}>
            <cylinderGeometry args={[5.2, 5.3, 0.04, 64]} />
            <meshStandardMaterial color="#0f172a" roughness={0.2} metalness={0.8} />
          </mesh>
          {/* Mirror-polished obsidian showroom reflector surface */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.011, 0]} receiveShadow>
            <circleGeometry args={[5.08, 64]} />
            <MeshReflectorMaterial
              blur={[300, 100]}
              resolution={512}
              mixBlur={0.9}
              mixStrength={1.6}
              roughness={0.22}
              depthScale={1.0}
              minDepthThreshold={0.4}
              maxDepthThreshold={1.4}
              color="#0f172a"
              metalness={0.75}
              mirror={0.55}
            />
          </mesh>
          {/* Polished bevel ring */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.013, 0]}>
            <ringGeometry args={[5.16, 5.26, 64]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.92} roughness={0.15} />
          </mesh>
          {/* Inset flush ice-cyan ring */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.014, 0]}>
            <ringGeometry args={[5.08, 5.16, 64]} />
            <meshStandardMaterial color="#38bdf8" emissive="#0ea5e9" emissiveIntensity={3.2} />
          </mesh>
        </group>

        {/* Distant minimalist architectural skyline at Z = -25 */}
        {[-18, -12, -6, 0, 6, 12, 18].map((x, i) => (
          <group key={i} position={[x, 0, -25]}>
            <RoundedBox args={[4.8, 12 + (i % 3) * 3, 0.6]} radius={0.08} smoothness={2} position={[0, 6 + (i % 3) * 1.5, 0]}>
              <meshStandardMaterial color="#1e293b" roughness={0.8} metalness={0.2} />
            </RoundedBox>
            {/* Architectural vertical light seam */}
            <mesh position={[2.2, 6, 0.32]}>
              <boxGeometry args={[0.04, 11, 0.02]} />
              <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={1.2} />
            </mesh>
          </group>
        ))}

        {/* Dual suspended aerodynamic softbox canopies at Y=7.0 */}
        {[-4.2, 4.2].map(x => (
          <group key={x} position={[x, 7.0, 0]}>
            {/* Softbox frame */}
            <RoundedBox args={[1.8, 0.08, 9.8]} radius={0.03} smoothness={2} position={[0, 0.04, 0]}>
              <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.2} />
            </RoundedBox>
            {/* Softbox luminous diffuser */}
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
              <planeGeometry args={[1.7, 9.6]} />
              <meshStandardMaterial color="#ffffff" emissive="#f8fafc" emissiveIntensity={2.5} />
            </mesh>
            <pointLight position={[0, -0.5, 0]} color="#ffffff" intensity={4.5} distance={12} />
          </group>
        ))}

        {/* Studio Lighting Rig: Zenithal Center Key + Workbench Task Light + Twin Aerodynamic Rim Spotlights + Front Fill */}
        <pointLight position={[0, 6.5, 0]} color="#f0f9ff" intensity={9.0} distance={20} />
        <spotLight position={[0, 8.0, 2.0]} angle={0.7} penumbra={0.5} intensity={13.0} color="#ffffff" distance={22} castShadow />
        {/* Éclairage dédié établi & zone de travail mécanique */}
        <spotLight position={[-1.8, 6.0, 1.2]} angle={0.8} penumbra={0.6} intensity={14.0} color="#f8fafc" distance={15} />
        <pointLight position={[-1.8, 4.2, 0.3]} color="#ffffff" intensity={6.0} distance={10} />
        <spotLight position={[-4.5, 3.8, -4.0]} angle={0.75} penumbra={0.6} intensity={9.5} color="#bae6fd" distance={18} />
        <spotLight position={[4.5, 3.8, -4.0]} angle={0.75} penumbra={0.6} intensity={9.5} color="#bae6fd" distance={18} />
        <spotLight position={[0, 2.5, 5.0]} angle={0.8} penumbra={0.6} intensity={8.5} color="#f8fafc" distance={16} />
      </>
    )}

    {theme.stageStyle === 'high_tech_cleanroom' && (
      // Cleanroom & Robotic Innovation Pavilion ("Design +++"):
      // Micro-cement deck, anti-static conductive silver seams, cyan status perimeter, acoustic basalt slats, shadowless ceiling coffer
      <>
        {/* Floating micro-cement tech deck */}
        <group position={[0, -0.008, 0]}>
          <RoundedBox args={[8.0, 0.05, 6.0]} radius={0.03} smoothness={4} position={[0, 0, 0]} receiveShadow>
            <meshStandardMaterial color="#1e293b" roughness={0.28} metalness={0.25} />
          </RoundedBox>
          {/* Anti-static conductive silver trace lines */}
          {[-2.5, 0, 2.5].map((lx, li) => (
            <mesh key={li} rotation={[-Math.PI / 2, 0, 0]} position={[lx, 0.026, 0]}>
              <planeGeometry args={[0.02, 5.6]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.95} roughness={0.15} />
            </mesh>
          ))}
          {/* Perimeter cyan status glow */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.026, 0]}>
            <ringGeometry args={[3.8, 3.84, 64]} />
            <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={1.2} />
          </mesh>
        </group>

        {/* Acoustic basalt slats & telemetry stanchions at Z=-16 */}
        {[-12, -8, -4, 4, 8, 12].map((x, i) => (
          <group key={i} position={[x, 0, -16]}>
            <RoundedBox args={[0.35, 7.5, 0.25]} radius={0.02} smoothness={2} position={[0, 3.75, 0]} castShadow>
              <meshStandardMaterial color="#0f172a" metalness={0.85} roughness={0.25} />
            </RoundedBox>
            {/* Integrated vertical diagnostic LED bar */}
            <mesh position={[0, 3.75, 0.14]}>
              <boxGeometry args={[0.03, 7.0, 0.02]} />
              <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={2.0} />
            </mesh>
            <pointLight position={[0, 3.75, 0.4]} color="#06b6d4" intensity={1.5} distance={8} />
          </group>
        ))}

        {/* Overhead shadowless laboratory light coffer at Y=7.2 */}
        <group position={[0, 7.2, 0]}>
          <RoundedBox args={[7.2, 0.10, 5.2]} radius={0.04} smoothness={2} position={[0, 0.05, 0]}>
            <meshStandardMaterial color="#0f172a" metalness={0.8} />
          </RoundedBox>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
            <planeGeometry args={[7.0, 5.0]} />
            <meshStandardMaterial color="#f1f5f9" emissive="#f8fafc" emissiveIntensity={1.5} />
          </mesh>
        </group>
        <pointLight position={[0, 6.8, 0]} color="#f1f5f9" intensity={5.0} distance={16} />
      </>
    )}

    {theme.stageStyle === 'contemporary_gallery' && (
      // Contemporary Art Gallery & Seminar Loft ("Design +++"):
      // Polished concrete terrace slabs, brass expansion joints, fluted oak acoustic slats at Z=-16, floating halo ring
      <>
        {/* Polished concrete terrace with brass expansion grid */}
        <group position={[0, -0.008, 0]}>
          <RoundedBox args={[8.4, 0.05, 6.4]} radius={0.03} smoothness={4} position={[0, 0, 0]} receiveShadow>
            <meshStandardMaterial color="#e2e8f0" roughness={0.38} metalness={0.08} />
          </RoundedBox>
          {/* Subtle brass expansion grid joints */}
          {[-2.2, 2.2].map((x, xi) => (
            <mesh key={xi} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.026, 0]}>
              <planeGeometry args={[0.015, 6.2]} />
              <meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.2} />
            </mesh>
          ))}
          {/* Cantilevered stone monolith bench */}
          <group position={[-4.2, 0.25, -2.2]}>
            <RoundedBox args={[1.4, 0.45, 0.55]} radius={0.02} smoothness={3} castShadow receiveShadow>
              <meshStandardMaterial color="#cbd5e1" roughness={0.4} />
            </RoundedBox>
          </group>
        </group>

        {/* Curving crescent of vertical fluted oak acoustic louvers at Z=-16 */}
        {[-13, -9.5, -6, -2.5, 1, 4.5, 8, 11.5].map((x, i) => {
          const zOffset = -16.0 - Math.cos((i / 7 - 0.5) * Math.PI) * 1.6;
          return (
            <group key={i} position={[x, 0, zOffset]}>
              <RoundedBox args={[0.32, 7.2, 0.12]} radius={0.02} smoothness={2} position={[0, 3.6, 0]} castShadow>
                <meshStandardMaterial color="#d7cdbe" roughness={0.6} metalness={0.05} />
              </RoundedBox>
              {/* Floor-recessed museum grazing spotlight */}
              <pointLight position={[0, 0.5, 0.5]} color="#fffbeb" intensity={2.2} distance={8} />
            </group>
          );
        })}

        {/* Suspended Minimalist Halo Luminaire at Y=6.8 */}
        <mesh position={[0, 6.8, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[4.0, 0.035, 16, 64]} />
          <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.2} emissive="#f8fafc" emissiveIntensity={0.8} />
        </mesh>
        <pointLight position={[0, 6.5, 0]} color="#fffbeb" intensity={3.8} distance={14} />
      </>
    )}

    {theme.stageStyle === 'culinary_studio' && (
      // Open Gourmet Atelier ("Design +++"):
      // Honed terrazzo floor, smoked oak vertical louvers at Z=-15, warm copper sconces, floating linear brass pendant
      <>
        {/* Honed terrazzo floor with brushed bronze circular ring */}
        <group position={[0, -0.008, 0]}>
          <RoundedBox args={[7.8, 0.05, 5.8]} radius={0.03} smoothness={4} position={[0, 0, 0]} receiveShadow>
            <meshStandardMaterial color="#d6cfc5" roughness={0.45} metalness={0.08} />
          </RoundedBox>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.026, 0]}>
            <ringGeometry args={[3.2, 3.25, 64]} />
            <meshStandardMaterial color="#b45309" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>

        {/* Slatted smoked oak partition screen at Z=-15 */}
        {[-12, -7.5, -3, 3, 7.5, 12].map((x, i) => (
          <group key={i} position={[x, 0, -15]}>
            <RoundedBox args={[0.32, 7.5, 0.22]} radius={0.02} smoothness={2} position={[0, 3.75, 0]} castShadow>
              <meshStandardMaterial color="#3f2e22" roughness={0.65} />
            </RoundedBox>
            {/* Warm copper wall sconce */}
            <mesh position={[0, 3.2, 0.13]}>
              <cylinderGeometry args={[0.04, 0.05, 0.12, 16]} />
              <meshStandardMaterial color="#b45309" metalness={0.9} roughness={0.2} />
            </mesh>
            <pointLight position={[0, 3.1, 0.25]} color="#ffedd5" intensity={2.8} distance={7} />
          </group>
        ))}

        {/* Floating horizontal culinary display beam */}
        <mesh position={[0, 7.2, -15]}>
          <boxGeometry args={[26, 0.18, 0.18]} />
          <meshStandardMaterial color="#2c1d11" roughness={0.7} />
        </mesh>

        {/* Floating linear brass pendant fixture over workstation at Y=6.5 */}
        <group position={[0, 6.5, 0]}>
          <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.03, 0.03, 4.5, 16]} />
            <meshStandardMaterial color="#d4af37" metalness={0.92} roughness={0.18} />
          </mesh>
          <mesh position={[0, -0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <planeGeometry args={[4.4, 0.05]} />
            <meshStandardMaterial color="#fff7ed" emissive="#ffedd5" emissiveIntensity={1.8} />
          </mesh>
        </group>
        <pointLight position={[0, 6.2, 0]} color="#ffedd5" intensity={4.5} distance={14} />
      </>
    )}

    {theme.stageStyle === 'mars_base' && (
      // Martian pressurized habitat arches & telemetry mast
      <>
        <Block position={[0, 1.5, -9]} size={[26, 3, 0.4]} color="#753522" roughness={0.9} />
        {/* Geodesic Arch Ribs */}
        {[-8, -4, 0, 4, 8].map(x => (
          <group key={x} position={[x, 0, -7.5]}>
            <Block position={[0, 2.2, 0]} size={[0.35, 4.4, 0.35]} color="#d9724a" metalness={0.4} roughness={0.5} />
            <mesh position={[0, 4.4, 1.2]} rotation={[0.3, 0, 0]}>
              <boxGeometry args={[0.3, 0.3, 3]} />
              <meshStandardMaterial color="#d9724a" metalness={0.4} roughness={0.5} />
            </mesh>
          </group>
        ))}
        {/* Communication & Weather Mast */}
        <mesh position={[10, 3.5, -6]}>
          <cylinderGeometry args={[0.06, 0.08, 7, 16]} />
          <meshStandardMaterial color="#ffffff" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[10, 7.1, -6]}>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshStandardMaterial color="#ff3b30" emissive="#ff3b30" emissiveIntensity={3} />
        </mesh>
        <pointLight position={[10, 7.1, -6]} color="#ff4444" intensity={4} distance={12} />
      </>
    )}

    {theme.stageStyle === 'orbital_station' && (
      // Space Station titanium truss and airlock docking collar
      <>
        <Block position={[0, 0.2, -8.5]} size={[28, 0.4, 1.2]} color="#1a202c" metalness={0.9} roughness={0.25} />
        {[-9, -4.5, 4.5, 9].map(x => (
          <group key={x} position={[x, 0, -8]}>
            <Block position={[0, 2.8, 0]} size={[0.4, 5.6, 0.4]} color="#374151" metalness={0.85} roughness={0.3} />
            <mesh position={[0, 5.6, 1.5]} rotation={[0.4, 0, 0]}>
              <boxGeometry args={[0.35, 0.35, 3.5]} />
              <meshStandardMaterial color="#4b5563" metalness={0.85} roughness={0.3} />
            </mesh>
          </group>
        ))}
        {/* Circular Airlock Docking Collar */}
        <mesh position={[0, 3.2, -8.4]} rotation={[0, 0, 0]}>
          <torusGeometry args={[2.8, 0.18, 16, 64]} />
          <meshStandardMaterial color="#00d2ff" emissive="#00d2ff" emissiveIntensity={1.8} metalness={0.9} />
        </mesh>
        <pointLight position={[0, 3.2, -7.8]} color="#00d2ff" intensity={8} distance={14} />
      </>
    )}

    {theme.stageStyle === 'lunar_outpost' && (
      // High-contrast lunar antenna pylon and solar reflectors
      <>
        <Block position={[0, 1.2, -9]} size={[24, 2.4, 0.5]} color="#2d333b" roughness={0.95} />
        {[-8, 0, 8].map(x => (
          <group key={x} position={[x, 0, -7.5]}>
            <Block position={[0, 2.5, 0]} size={[0.3, 5, 0.3]} color="#57606a" metalness={0.7} roughness={0.3} />
            {/* Solar reflector panel */}
            <mesh position={[0, 4.5, 0.8]} rotation={[0.5, 0, 0]}>
              <boxGeometry args={[2.2, 1.4, 0.08]} />
              <meshStandardMaterial color="#0f2b48" metalness={0.95} roughness={0.1} />
            </mesh>
          </group>
        ))}
        {/* Signal beacon */}
        <mesh position={[0, 5.8, -7.5]}>
          <sphereGeometry args={[0.16, 16, 16]} />
          <meshStandardMaterial color="#58a6ff" emissive="#58a6ff" emissiveIntensity={3} />
        </mesh>
        <pointLight position={[0, 5.8, -7.5]} color="#58a6ff" intensity={5} distance={12} />
      </>
    )}

    {theme.stageStyle === 'cyber_monoliths' && (
      // Neo-Tokyo holographic neon columns and wireframe portals
      <>
        {[-10, -5, 5, 10].map((x, idx) => (
          <group key={x} position={[x, 0, -7.5]}>
            <Block position={[0, 3, 0]} size={[0.5, 6, 0.5]} color="#0f091f" metalness={0.95} roughness={0.1} />
            {/* Glowing vertical neon strip */}
            <mesh position={[0, 3, 0.28]}>
              <boxGeometry args={[0.08, 5.8, 0.05]} />
              <meshStandardMaterial
                color={idx % 2 === 0 ? '#00ffff' : '#ff007f'}
                emissive={idx % 2 === 0 ? '#00ffff' : '#ff007f'}
                emissiveIntensity={3.5}
              />
            </mesh>
            <pointLight
              position={[0, 3, 0.6]}
              color={idx % 2 === 0 ? '#00ffff' : '#ff007f'}
              intensity={4.5}
              distance={8}
            />
          </group>
        ))}
        {/* Holographic Header Beam */}
        <mesh position={[0, 5.9, -7.5]}>
          <boxGeometry args={[22, 0.08, 0.08]} />
          <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={2.5} />
        </mesh>
      </>
    )}

    {theme.stageStyle === 'celestial_ring' && (
      // Levitating crystalline energy rings
      <>
        <mesh position={[0, 4, -8]} rotation={[0.4, 0, 0]}>
          <torusGeometry args={[4.5, 0.12, 16, 64]} />
          <meshStandardMaterial color="#bd66ff" emissive="#bd66ff" emissiveIntensity={2.8} />
        </mesh>
        {[-7, 7].map(x => (
          <mesh key={x} position={[x, 2.5, -7]} rotation={[0, 0, 0]}>
            <octahedronGeometry args={[0.9, 0]} />
            <meshStandardMaterial color="#d68aff" emissive="#9933ff" emissiveIntensity={1.8} wireframe />
          </mesh>
        ))}
        <pointLight position={[0, 4, -7.5]} color="#d68aff" intensity={6} distance={14} />
      </>
    )}

    {theme.stageStyle === 'forest_clearing' && (
      // Immersion Sylvestre & Clairière Forestière Authentique
      <group position={[0, 0, 0]}>
        {/* Rayons de soleil filtrés zénithaux (Dappled volumetric canopy light shafts) */}
        {[-3.5, 0.5, 4.2].map((x, i) => (
          <mesh
            key={i}
            position={[x, 4.5, -1.8 + i * 1.8]}
            rotation={[0.35, 0, -0.22 + i * 0.08]}
          >
            <cylinderGeometry args={[0.25, 1.35, 10, 16, 1, true]} />
            <meshBasicMaterial
              color="#ffeaad"
              transparent
              opacity={0.065}
              side={THREE.DoubleSide}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        ))}

        {/* Lisière d'arbres de fond à l'horizon circulaire (Deep forest background tree line) */}
        {Array.from({ length: 16 }, (_, k) => {
          const angle = (k / 16) * Math.PI * 2;
          const dist = 21 + (k % 3) * 2.2;
          const px = Math.cos(angle) * dist;
          const pz = Math.sin(angle) * dist;
          const trunkH = 7.5 + (k % 4) * 1.8;
          return (
            <group key={k} position={[px, 0, pz]}>
              <mesh position={[0, trunkH / 2, 0]}>
                <cylinderGeometry args={[0.3, 0.48, trunkH, 8]} />
                <meshStandardMaterial color="#1a120c" roughness={0.9} />
              </mesh>
              <mesh position={[0, trunkH + 1.8, 0]}>
                <coneGeometry args={[2.6, 5.2, 8]} />
                <meshStandardMaterial color="#132414" roughness={0.88} />
              </mesh>
              <mesh position={[0, trunkH + 4.2, 0]}>
                <coneGeometry args={[1.9, 4.0, 8]} />
                <meshStandardMaterial color="#172e18" roughness={0.85} />
              </mesh>
            </group>
          );
        })}
      </group>
    )}

    {theme.stageStyle === 'coastal_beach' && (
      // Immersion Littorale & Plage Océane (Ocean horizon, surf line & sand dunes)
      <group position={[0, 0, 0]}>
        {/* 1. Étendue Océane Azurée & Émeraude (Ocean Water Expanse) */}
        <mesh position={[0, -0.04, -48]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[140, 70, 32, 32]} />
          <meshPhysicalMaterial
            color="#0284c7"
            roughness={0.08}
            metalness={0.1}
            transmission={0.65}
            transparent
            opacity={0.92}
            ior={1.333}
            clearcoat={0.9}
          />
        </mesh>

        {/* 2. Ligne d'écume blanche de ressac en bordure de plage (Foam surf wave line) */}
        <mesh position={[0, -0.015, -13.2]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[120, 2.4, 16, 2]} />
          <meshStandardMaterial
            color="#f8fafc"
            roughness={0.7}
            transparent
            opacity={0.68}
          />
        </mesh>

        {/* 3. Dunes côtières ondulées aux flancs (Coastal Sand Dunes) */}
        {[-32, 32].map((sideX, idx) => (
          <group key={idx} position={[sideX, 0, -8]}>
            <mesh position={[0, 1.8, 0]} rotation={[0, idx === 0 ? 0.3 : -0.3, 0]}>
              <coneGeometry args={[16, 4.2, 12]} />
              <meshStandardMaterial color="#d4a373" roughness={0.92} />
            </mesh>
            <mesh position={[0, 2.8, -12]} rotation={[0, idx === 0 ? -0.2 : 0.2, 0]}>
              <coneGeometry args={[18, 5.8, 12]} />
              <meshStandardMaterial color="#c59b6c" roughness={0.95} />
            </mesh>
          </group>
        ))}

        {/* 4. Touffes d'oyats et herbes marines sur les crêtes de sable (Sea grass tufts) */}
        {[-22, -18, -14, 14, 18, 22].map((gx, i) => (
          <group key={i} position={[gx, 0.4, 4 + (i % 3) * 3]}>
            {[0, 0.4, 0.8, 1.2].map((rotY, j) => (
              <mesh key={j} position={[0, 0.45, 0]} rotation={[0.15, rotY, 0]}>
                <cylinderGeometry args={[0.015, 0.04, 0.9, 6]} />
                <meshStandardMaterial color={j % 2 === 0 ? '#65a30d' : '#84cc16'} roughness={0.8} />
              </mesh>
            ))}
          </group>
        ))}

        {/* 5. Rayons de soleil marins et réverbération zénithale */}
        <pointLight position={[0, 12, -25]} color="#fef08a" intensity={3.5} distance={60} decay={1.2} />
      </group>
    )}
  </>;
}
