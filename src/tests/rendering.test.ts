import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { CinematicColorGradingShader } from '../scene/CinematicPostProcessing';

// Dynamic imports let independent regressions run even before the new modules exist.
async function policy() {
  const path = '../scene/renderingPolicy';
  const module = await import(path).catch(() => null);
  assert.ok(module, 'La politique de rendu doit exister');
  return module;
}

async function materials() {
  const path = '../scene/materialOverrides';
  const module = await import(path).catch(() => null);
  assert.ok(module, 'Les modifications de materiaux doivent etre isolees et testables');
  return module;
}

test('le shader conserve les valeurs HDR avant OutputPass', () => {
  assert.doesNotMatch(CinematicColorGradingShader.fragmentShader, /clamp\(color,\s*0\.0,\s*1\.0\)/);
  assert.match(CinematicColorGradingShader.fragmentShader, /vec4\(max\(color,\s*vec3\(0\.0\)\),\s*1\.0\)/);
});

test('le vignettage nul evite smoothstep avec des bornes egales ou inversees', () => {
  assert.match(CinematicColorGradingShader.fragmentShader, /if \(uVignetteDarkness > 0\.0\)/);
  assert.match(CinematicColorGradingShader.fragmentShader, /1\.0 - smoothstep/);
});

test('studio et standard restent neutres meme apres un preset artistique', async () => {
  const { getCinematicSettings } = await policy();
  for (const preset of ['studio_neutral', 'standard']) {
    const settings = getCinematicSettings(preset, { bloomIntensity: 2, vignetteStrength: 1.5, chromaticAberration: 0.008 });
    assert.equal(settings.bloomStrength, 0);
    assert.equal(settings.contrast, 1);
    assert.equal(settings.saturation, 1);
    assert.equal(settings.exposure, 1);
    assert.equal(settings.vignette, 0);
    assert.equal(settings.chromaticAberration, 0);
    assert.equal(settings.filmGrain, 0);
    assert.equal(settings.useComposer, false);
  }
});

test('les presets artistiques conservent leurs effets sans bloom lorsque son intensite est nulle', async () => {
  const { getCinematicSettings } = await policy();
  const settings = getCinematicSettings('golden_hour', { bloomIntensity: 0, vignetteStrength: 0.4, chromaticAberration: 0.002 });
  assert.equal(settings.useComposer, true);
  assert.equal(settings.bloomStrength, 0);
  assert.equal(settings.vignette, 0.26);
  assert.equal(settings.chromaticAberration, 0.002);
  assert.ok(settings.filmGrain > 0);
});

test('la qualite automatique est prudente sur tactile et le XR ignore les post-effets', async () => {
  const { getRenderBudget } = await policy();
  assert.equal(getRenderBudget('auto', false, false).maxDpr, 1.5);
  assert.equal(getRenderBudget('auto', true, false).maxDpr, 1);
  assert.equal(getRenderBudget('high', true, false).shadowMapSize, 2048);
  assert.equal(getRenderBudget('economy', false, false).shadowMapSize, 1024);
  assert.equal(getRenderBudget('economy', false, false).postprocessing, false);
  assert.equal(getRenderBudget('high', false, true).postprocessing, false);
  assert.equal(getRenderBudget('high', false, true).shadowMapSize, 1024);
});

test('les maps auteur, groupes, couleur et lightmap survivent a une modification de rugosite', async () => {
  const { applyMaterialOverrides } = await materials();
  const source = new THREE.MeshPhysicalMaterial({ color: '#a36b32', roughness: 0.7, metalness: 0.2 });
  const keys = ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap', 'lightMap'] as const;
  for (const key of keys) source[key] = new THREE.Texture();
  source.map!.colorSpace = THREE.SRGBColorSpace;
  const glass = new THREE.MeshPhysicalMaterial({ transmission: 0.95, opacity: 1 });
  const geometry = new THREE.BoxGeometry();
  const mesh = new THREE.Mesh(geometry, [source, glass]);
  const groups = structuredClone(geometry.groups);
  const dispose = applyMaterialOverrides(mesh, { roughness: 0.35 });
  assert.notEqual(mesh.material[0], source);
  assert.equal(mesh.material[0].roughness, 0.35);
  assert.equal(source.roughness, 0.7);
  assert.equal(mesh.material[0].color.getHex(), source.color.getHex());
  for (const key of keys) assert.equal(mesh.material[0][key], source[key], key);
  assert.equal(mesh.material[1].transmission, 0.95);
  assert.deepEqual(geometry.groups, groups);
  let originalDisposed = false;
  source.addEventListener('dispose', () => { originalDisposed = true; });
  dispose();
  assert.equal(mesh.material[0], source, 'Le nettoyage restaure les materiaux source');
  assert.equal(originalDisposed, false);
  geometry.dispose();
  source.dispose();
  glass.dispose();
  for (const key of keys) source[key]?.dispose();
});

test('un preset conserve les textures auteur et protege verre et emissifs', async () => {
  const { applyMaterialOverrides } = await materials();
  const wood = new THREE.MeshStandardMaterial({ color: '#ae7654' });
  wood.map = new THREE.Texture();
  const glass = new THREE.MeshPhysicalMaterial({ transmission: 0.9, roughness: 0.1 });
  const emissive = new THREE.MeshStandardMaterial({ emissive: '#ffaa00', emissiveIntensity: 2 });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(), [wood, glass, emissive]);
  const dispose = applyMaterialOverrides(mesh, { presetId: 'brushed_steel' });
  assert.notEqual(mesh.material[0], wood);
  assert.equal(mesh.material[0].map, wood.map);
  assert.equal(mesh.material[0].color.getHex(), wood.color.getHex());
  assert.equal(mesh.material[1], glass);
  assert.equal(mesh.material[2], emissive);
  dispose();
});

test('sans modification les materiaux sont partages sans allocation', async () => {
  const { applyMaterialOverrides } = await materials();
  const mesh = new THREE.Mesh();
  const original = mesh.material;
  const dispose = applyMaterialOverrides(mesh, {});
  assert.equal(mesh.material, original);
  dispose();
  assert.equal(mesh.material, original);
});

test('les repetitions sont locales et ne touchent jamais aux lightmaps', async () => {
  const { applyMaterialOverrides } = await materials();
  const original = new THREE.MeshStandardMaterial({ map: new THREE.Texture(), lightMap: new THREE.Texture() });
  original.map!.repeat.set(2, 2);
  original.map!.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(), original);
  const dispose = applyMaterialOverrides(mesh, { repeat: [4, 3] });
  assert.notEqual(mesh.material.map, original.map);
  assert.deepEqual(mesh.material.map!.repeat.toArray(), [4, 3]);
  assert.deepEqual(original.map!.repeat.toArray(), [2, 2]);
  assert.equal(mesh.material.map!.colorSpace, THREE.SRGBColorSpace);
  assert.equal(mesh.material.lightMap, original.lightMap);
  let disposed = 0;
  mesh.material.map!.addEventListener('dispose', () => disposed++);
  dispose();
  dispose();
  assert.equal(disposed, 1, 'Nettoyage idempotent des seules copies locales');
});

test('les flammes decoratives ne produisent plus six shadow maps', () => {
  const source = readFileSync(new URL('../scene/R3FWorldAdapter.tsx', import.meta.url), 'utf8');
  const flame = source.slice(source.indexOf('const FireFlickerLight'), source.indexOf('const FireFlickerLight') + 1100);
  assert.doesNotMatch(flame, /castShadow(?:\s|[/>])/);
});

test('les scenes utilisent le budget des ombres et ne generent pas tous les sols au demarrage', () => {
  const stage = readFileSync(new URL('../scene/ArchitecturalStage.tsx', import.meta.url), 'utf8');
  assert.match(stage, /renderBudget\.shadowMapSize/);
  assert.doesNotMatch(stage, /stone:\s*makeStoneTexture\(\)/);
});

test('le compositeur suit le DPR et ne calcule pas les passes desactivees', () => {
  const source = readFileSync(new URL('../scene/CinematicPostProcessing.tsx', import.meta.url), 'utf8');
  assert.match(source, /setPixelRatio\(viewport\.dpr\)/);
  assert.match(source, /bloom\.enabled = settings\.bloomStrength > 0/);
  assert.match(source, /if \(!active\) return/);
});

test('la stack declare une version de Rapier compatible et une seule chaine de post-traitement', () => {
  const pkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));
  assert.match(pkg.dependencies['@react-three/rapier'], /^\^?2\./);
  assert.equal(pkg.dependencies['@react-three/postprocessing'], undefined);
  assert.equal(pkg.dependencies.postprocessing, undefined);
});
