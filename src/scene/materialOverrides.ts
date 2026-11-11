import * as THREE from 'three';
import { getPBRMaterialPreset, type PBRMaterialProps } from './pbrMaterials';

/**
 * Edits a model instance without modifying loader caches or discarding authored maps.
 * The returned cleanup restores borrowed materials and frees only local copies.
 */
export function applyMaterialOverrides(root: THREE.Object3D, options: PBRMaterialProps): () => void {
  const preset = options.presetId ? getPBRMaterialPreset(options.presetId) : undefined;
  const hasChanges = preset || options.color !== undefined || options.roughness !== undefined
    || options.metalness !== undefined || options.clearcoat !== undefined || options.repeat !== undefined;
  if (!hasChanges) return () => {};

  const copies = new Map<THREE.Material, THREE.Material>();
  const textures = new Set<THREE.Texture>();
  const restore: Array<() => void> = [];

  function edit(source: THREE.Material): THREE.Material {
    if (!(source instanceof THREE.MeshStandardMaterial)) return source;
    // A global finish must not turn glass, screens or luminous details into metal.
    if (preset && (source.transparent || source.alphaTest > 0 || source.emissiveMap
      || source.emissive.getHex() !== 0
      || (source instanceof THREE.MeshPhysicalMaterial && source.transmission > 0))) return source;
    const existing = copies.get(source);
    if (existing) return existing;

    const needsPhysical = options.clearcoat !== undefined || preset?.clearcoat !== undefined
      || preset?.transmission !== undefined || preset?.sheen !== undefined;
    let material: THREE.MeshStandardMaterial;
    if (needsPhysical && !(source instanceof THREE.MeshPhysicalMaterial)) {
      material = new THREE.MeshPhysicalMaterial();
      THREE.MeshStandardMaterial.prototype.copy.call(material, source);
      material.defines = { STANDARD: '', PHYSICAL: '' };
    } else {
      material = source.clone();
    }
    copies.set(source, material);

    // A texture already contains its base colour. Do not multiply it by a preset tint.
    const color = options.color ?? (source.map || source.vertexColors ? undefined : preset?.defaultColor);
    if (color !== undefined) material.color.set(color);
    material.roughness = options.roughness ?? preset?.roughness ?? source.roughness;
    material.metalness = options.metalness ?? preset?.metalness ?? source.metalness;
    if (material instanceof THREE.MeshPhysicalMaterial) {
      material.clearcoat = options.clearcoat ?? preset?.clearcoat ?? material.clearcoat;
      if (preset) {
        material.clearcoatRoughness = preset.clearcoatRoughness ?? material.clearcoatRoughness;
        material.transmission = preset.transmission ?? material.transmission;
        material.ior = preset.ior ?? material.ior;
        material.sheen = preset.sheen ?? material.sheen;
        if (preset.sheenColor) material.sheenColor.set(preset.sheenColor);
      }
    }
    if (options.repeat) {
      const localTextures = new Map<THREE.Texture, THREE.Texture>();
      for (const [key, value] of Object.entries(material)) {
        // Lightmaps use their own non-overlapping UVs; environments are not tiled.
        if (!(value instanceof THREE.Texture) || key === 'lightMap' || key === 'envMap') continue;
        let texture = localTextures.get(value);
        if (!texture) {
          texture = value.clone();
          texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
          texture.repeat.set(...options.repeat);
          texture.needsUpdate = true;
          localTextures.set(value, texture);
          textures.add(texture);
        }
        Object.assign(material, { [key]: texture });
      }
    }
    return material;
  }

  root.traverse(node => {
    if (!(node instanceof THREE.Mesh)) return;
    const original = node.material;
    node.material = Array.isArray(original) ? original.map(edit) : edit(original);
    restore.push(() => { node.material = original; });
  });

  let disposed = false;
  return () => {
    if (disposed) return;
    disposed = true;
    restore.forEach(reset => reset());
    copies.forEach(material => material.dispose());
    textures.forEach(texture => texture.dispose());
  };
}
