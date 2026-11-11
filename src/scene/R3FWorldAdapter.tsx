import React from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sphere, OrbitControls, Grid, Edges, RoundedBox, useGLTF, useTexture, Html, TransformControls, GizmoHelper, GizmoViewport } from '@react-three/drei';
import { CinematicPostProcessing } from './CinematicPostProcessing';
import { Physics, RigidBody, CuboidCollider, RapierRigidBody, type RigidBodyProps } from '@react-three/rapier';
import * as RAPIER from '@dimforge/rapier3d-compat';

// Bulletproof protection against Rust WebAssembly unsafe aliasing / recursive borrow in Rapier 3D
function patchRapierWorld(WorldClass: any) {
  if (!WorldClass?.prototype || WorldClass.prototype.__worldpilot_patched) return;
  const proto = WorldClass.prototype;
  proto.__worldpilot_patched = true;

  if (proto.forEachRigidBody) {
    const origForEach = proto.forEachRigidBody;
    proto.forEachRigidBody = function (f: any) {
      try {
        const bodies: any[] = [];
        this.bodies?.forEach((b: any) => bodies.push(b));
        if (bodies.length > 0) {
          for (const b of bodies) {
            try { f(b); } catch (_) {}
          }
          return;
        }
      } catch (_) {}
      try { origForEach.call(this, f); } catch (_) {}
    };
  }

  if (proto.step) {
    const origStep = proto.step;
    proto.step = function (eventQueue: any, hooks: any) {
      try {
        origStep.call(this, eventQueue, hooks);
      } catch (_) {}
    };
  }

  if (proto.removeRigidBody) {
    const origRemoveRigidBody = proto.removeRigidBody;
    proto.removeRigidBody = function (body: any) {
      if (!body) return;
      try {
        origRemoveRigidBody.call(this, body);
      } catch (_) {
        try {
          if (body?.handle !== undefined && this.bodies?.unmap) {
            this.bodies.unmap(body.handle);
          }
        } catch (_) {}
      }
    };
  }

  if (proto.removeCollider) {
    const origRemoveCollider = proto.removeCollider;
    proto.removeCollider = function (collider: any, wakeUp?: boolean) {
      if (!collider) return;
      try {
        origRemoveCollider.call(this, collider, wakeUp);
      } catch (_) {
        try {
          if (collider?.handle !== undefined && this.colliders?.unmap) {
            this.colliders.unmap(collider.handle);
          }
        } catch (_) {}
      }
    };
  }

  if (proto.free) {
    proto.free = function () {
      const safeFree = (obj: any) => {
        if (!obj) return;
        try { if (typeof obj.free === 'function') obj.free(); } catch (_) {}
      };
      safeFree(this.integrationParameters);
      safeFree(this.islands);
      safeFree(this.broadPhase);
      safeFree(this.narrowPhase);
      safeFree(this.bodies);
      safeFree(this.colliders);
      safeFree(this.impulseJoints);
      safeFree(this.multibodyJoints);
      safeFree(this.ccdSolver);
      safeFree(this.physicsPipeline);
      safeFree(this.serializationPipeline);
      safeFree(this.debugRenderPipeline);
      try { this.characterControllers?.forEach?.((c: any) => safeFree(c)); } catch (_) {}
      try { this.pidControllers?.forEach?.((c: any) => safeFree(c)); } catch (_) {}
      try { this.vehicleControllers?.forEach?.((c: any) => safeFree(c)); } catch (_) {}
      this.integrationParameters = void 0;
      this.islands = void 0;
      this.broadPhase = void 0;
      this.narrowPhase = void 0;
      this.bodies = void 0;
      this.colliders = void 0;
      this.ccdSolver = void 0;
      this.impulseJoints = void 0;
      this.multibodyJoints = void 0;
      this.physicsPipeline = void 0;
      this.serializationPipeline = void 0;
      this.debugRenderPipeline = void 0;
      this.characterControllers = void 0;
      this.pidControllers = void 0;
      this.vehicleControllers = void 0;
    };
  }
}

if (typeof RAPIER !== 'undefined') {
  if ((RAPIER as any).World) patchRapierWorld((RAPIER as any).World);
  if (typeof (RAPIER as any).init === 'function') {
    try {
      (RAPIER as any).init().then((r: any) => {
        if (r?.World) patchRapierWorld(r.World);
        if ((RAPIER as any).World) patchRapierWorld((RAPIER as any).World);
      }).catch(() => {});
    } catch (_) {}
  }
}

if (typeof window !== 'undefined') {
  import('@dimforge/rapier3d-compat').then((mod: any) => {
    if (mod?.World) patchRapierWorld(mod.World);
    if (mod?.default?.World) patchRapierWorld(mod.default.World);
  }).catch(() => {});
}

if (typeof window !== 'undefined' && !(window as any).__worldpilot_error_listener_installed) {
  (window as any).__worldpilot_error_listener_installed = true;
  window.addEventListener('error', (event) => {
    const msg = event?.message || (event?.error?.message as string) || '';
    if (
      msg.includes('unsafe aliasing in rust') ||
      msg.includes('recursive use of an object') ||
      msg.includes('wbindgen_throw') ||
      msg.includes('attempted to take ownership of Rust value')
    ) {
      event.preventDefault?.();
      event.stopImmediatePropagation?.();
    }
  }, true);
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event?.reason?.message || String(event?.reason || '');
    if (
      reason.includes('unsafe aliasing in rust') ||
      reason.includes('recursive use of an object') ||
      reason.includes('wbindgen_throw') ||
      reason.includes('attempted to take ownership of Rust value')
    ) {
      event.preventDefault?.();
      event.stopImmediatePropagation?.();
    }
  }, true);
}
import { LibraryModel } from '../library/LibraryModel';
import { WebBillboard } from './WebBillboard';
import { SpatialBookModel } from './SpatialBookModel';
import { SpatialLaptopModel } from './SpatialLaptopModel';
import { SpatialArtCanvas } from './SpatialArtCanvas';
import { SpatialBlueprintModel } from './SpatialBlueprintModel';
import { SpatialAudioPlayerModel } from './SpatialAudioPlayerModel';
import { SpatialGlobeModel } from './SpatialGlobeModel';
import { SpatialMicroscopeModel } from './SpatialMicroscopeModel';
import { SpatialShootingTarget, SpatialBlasterConsole, SpatialTargetRangeBase } from './SpatialTargetRange';
import { SpatialWebChip } from './SpatialWebChip';
import { MagneticTetherBeam } from './MagneticTetherBeam';
import { SpatialCursorVisualizer } from './SpatialCursorVisualizer';
import { AtmosphericParticles } from './AtmosphericParticles';
import { LiquidPouringEffect } from './LiquidPouringEffect';
import { evaluateSpatialCausality, findNearestCausalityAffordance } from '../engine/spatialCausality';
import { getSupportingSurfaceHeight, isSupportEntity, isFloorFurniture, isStaticOrStructuralEntity, getEntityFootprintRadius } from '../engine/spatialSurface';
import { getAsset } from '../library/catalog';
import { ArchitecturalStage } from './ArchitecturalStage';
import { AtmosphereSystem } from './AtmosphereSystem';
import { SpatialAgent } from './SpatialAgent';
import { GhostTrajectoryAgent } from './GhostTrajectoryAgent';
import { PlaytesterTrajectory3D } from './PlaytesterTrajectory3D';
import { CoWorker3DAgent } from './CoWorker3DAgent';
import { SpatialAttentionVisualizer } from './SpatialAttentionVisualizer';
import { DetailedSimulationModel, hasDetailedSimulationModel } from './DetailedSimulationModel';
import { PedagogicalApparatusModel, isPedagogicalApparatus } from './PedagogicalApparatusModel';
import { SemanticProceduralFallback } from './SemanticProceduralFallback';
import { ResearchSpatialOverlay3D } from './ResearchSpatialOverlay3D';
import { XR } from '@react-three/xr';
import { xrStore } from './xrStore';
import { XRPlayerRig } from './XRPlayerRig';
import { useWorldStore, getCookingDonenessStage, CameraPreset } from '../engine/store';
import { EntitySpec, SoundEffect } from '../core/types';
import { playAudioFx } from '../engine/evaluator';
import { ambientAudio } from '../engine/ambientAudio';
import { PBRMaterial, getAllPBRMaterialPresets } from './pbrMaterials';
import { applyMaterialOverrides } from './materialOverrides';
import { useRenderBudget } from './renderQuality';
import * as THREE from 'three';

/**
 * Wrapper compatible React 18 pour RigidBody de @react-three/rapier.
 * Dans @react-three/rapier 2.x, RigidBody est encapsulé dans React.memo sans forwardRef.
 * Passer `ref` directement à <RigidBody ref={...}> en React 18 déclenche l'avertissement
 * 'Function components cannot be given refs' et prive props de `ref`.
 * Appeler le composant interne avec forwardRef résout l'avertissement et injecte correctement la ref.
 */
const RigidBodyInner = ((RigidBody as any).type || RigidBody) as (props: any) => any;

const RigidBodyInnerComponent = React.memo((rawProps: any) => {
  const { _rawRef, ...rest } = rawProps;
  return RigidBodyInner({ ...rest, ref: _rawRef });
});
RigidBodyInnerComponent.displayName = 'RigidBodyInnerComponent';

const ForwardRefRigidBody = React.forwardRef<RapierRigidBody, RigidBodyProps>((props, ref) => {
  return React.createElement(RigidBodyInnerComponent, { ...props, _rawRef: ref });
});
ForwardRefRigidBody.displayName = 'ForwardRefRigidBody';

const GLTFModel: React.FC<{
  url: string;
  materialPreset?: string;
  textureUrl?: string;
  color?: string;
  roughness?: number;
  metalness?: number;
  clearcoat?: number;
  repeat?: [number, number];
}> = ({ url, materialPreset, textureUrl, color, roughness, metalness, clearcoat, repeat }) => {
  const { scene } = useGLTF(url) as any;
  
  const normalizedScene = React.useMemo(() => {
    const clone = scene.clone(true);

    clone.traverse((node: any) => {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });

    if (url.startsWith("/library/")) {
      return clone;
    }

    // 1. Remove Blender default cube if present alongside other meshes
    const meshes: THREE.Mesh[] = [];
    clone.traverse((child: any) => {
      if (child.isMesh) {
        meshes.push(child);
      }
    });

    const hasOtherMeshes = meshes.some(m => m.name !== 'Cube' && !m.name.startsWith('Cube_'));
    if (hasOtherMeshes) {
      const cubesToRemove: THREE.Object3D[] = [];
      clone.traverse((child: any) => {
        if (child.name === 'Cube' || child.name.startsWith('Cube_')) {
          cubesToRemove.push(child);
        }
      });
      cubesToRemove.forEach(cube => {
        cube.visible = false;
        cube.parent?.remove(cube);
      });
    }

    const lowerUrl = url.toLowerCase();
    
    // 2. Filter candles if url specifies size
    if (lowerUrl.includes('candle-big') || lowerUrl.includes('candle_big') || lowerUrl.includes('bougie_grande')) {
      // Big candle is Stick02
      const toRemove: THREE.Object3D[] = [];
      clone.traverse((child: any) => {
        if (child.name && (child.name.includes('Stick01') || child.name.includes('Stick03') || child.name.includes('Wick01') || child.name.includes('Wick03'))) {
          toRemove.push(child);
        }
      });
      toRemove.forEach(obj => {
        obj.visible = false;
        obj.parent?.remove(obj);
      });
    } else if (lowerUrl.includes('candle-medium') || lowerUrl.includes('candle_medium') || lowerUrl.includes('bougie_moyenne')) {
      // Medium candle is Stick03
      const toRemove: THREE.Object3D[] = [];
      clone.traverse((child: any) => {
        if (child.name && (child.name.includes('Stick01') || child.name.includes('Stick02') || child.name.includes('Wick01') || child.name.includes('Wick02'))) {
          toRemove.push(child);
        }
      });
      toRemove.forEach(obj => {
        obj.visible = false;
        obj.parent?.remove(obj);
      });
    } else if (lowerUrl.includes('candle-small') || lowerUrl.includes('candle_small') || lowerUrl.includes('bougie_petite')) {
      // Small candle is Stick01
      const toRemove: THREE.Object3D[] = [];
      clone.traverse((child: any) => {
        if (child.name && (child.name.includes('Stick02') || child.name.includes('Stick03') || child.name.includes('Wick02') || child.name.includes('Wick03'))) {
          toRemove.push(child);
        }
      });
      toRemove.forEach(obj => {
        obj.visible = false;
        obj.parent?.remove(obj);
      });
    }

    // 3. Filter books if url specifies book number
    if (lowerUrl.includes('book-1') || lowerUrl.includes('livre_1')) {
      const toRemove: THREE.Object3D[] = [];
      clone.traverse((child: any) => {
        if (child.name && child.isMesh && !child.name.startsWith('Book_1_')) {
          toRemove.push(child);
        }
      });
      toRemove.forEach(obj => {
        obj.visible = false;
        obj.parent?.remove(obj);
      });
    } else if (lowerUrl.includes('book-2') || lowerUrl.includes('livre_2')) {
      const toRemove: THREE.Object3D[] = [];
      clone.traverse((child: any) => {
        if (child.name && child.isMesh && !child.name.startsWith('Book_2_')) {
          toRemove.push(child);
        }
      });
      toRemove.forEach(obj => {
        obj.visible = false;
        obj.parent?.remove(obj);
      });
    } else if (lowerUrl.includes('book-3') || lowerUrl.includes('livre_3')) {
      const toRemove: THREE.Object3D[] = [];
      clone.traverse((child: any) => {
        if (child.name && child.isMesh && !child.name.startsWith('Book_3_')) {
          toRemove.push(child);
        }
      });
      toRemove.forEach(obj => {
        obj.visible = false;
        obj.parent?.remove(obj);
      });
    }

    // 4. Orient books flat so they can be stacked naturally
    if (lowerUrl.includes('book') || lowerUrl.includes('livre')) {
      clone.rotation.x = -Math.PI / 2;
      clone.updateMatrixWorld(true);
    }

    // Determine realistic real-world target dimension in meters
    const getTargetDimension = (rawUrl: string) => {
      const lower = rawUrl.toLowerCase();
      if (lower.includes('book') || lower.includes('livre')) return 0.35; // 35 cm book
      if (lower.includes('candle') || lower.includes('bougie')) return 0.45; // 45 cm candle
      if (lower.includes('globe')) return 0.6; // 60 cm earth globe
      if (lower.includes('fireplace') || lower.includes('cheminee') || lower.includes('cheminée')) return 2.2; // 2.2m fireplace
      if (lower.includes('wall') || lower.includes('mur')) return 3.0; // 3m wall
      if (lower.includes('ground') || lower.includes('stone') || lower.includes('sol')) return 4.0; // 4m ground
      if (lower.includes('helmet') || lower.includes('casque')) return 0.45; // 45 cm helmet
      if (lower.includes('duck') || lower.includes('canard')) return 0.25; // 25 cm duck
      if (lower.includes('buggy') || lower.includes('vehicule')) return 2.0; // 2m buggy
      if (lower.includes('caisse') || lower.includes('box')) return 0.8; // 80 cm box
      return 1.5;
    };

    // Calculate bounding box after cleanup and rotation
    const box = new THREE.Box3().setFromObject(clone);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    
    // Create a container group to center on X/Z and rest on ground (min.y = 0)
    const group = new THREE.Group();
    if (maxDim > 0) {
      const targetDim = getTargetDimension(url);
      const scale = targetDim / maxDim;
      const lowerUrl = url.toLowerCase();
      const isGroundMesh = lowerUrl.includes('ground') || lowerUrl.includes('floor') || lowerUrl.includes('stone-ground');
      if (isGroundMesh) {
        // Flatten ground slabs and align their TOP surface to y = -0.005 so they never bury objects at y = 0
        const scaleY = Math.min(scale, 0.02 / Math.max(0.01, size.y));
        clone.scale.set(scale, scaleY, scale);
        const center = box.getCenter(new THREE.Vector3());
        clone.position.set(-center.x * scale, -box.max.y * scaleY - 0.005, -center.z * scale);
      } else {
        clone.scale.set(scale, scale, scale);
        // Center on X and Z, align bottom to y=0 so models sit on floors/surfaces!
        const center = box.getCenter(new THREE.Vector3());
        clone.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
      }
    }
    group.add(clone);
    return group;
  }, [scene, url]);

  React.useLayoutEffect(() => applyMaterialOverrides(normalizedScene, {
    presetId: materialPreset || (textureUrl?.startsWith('pbr:') ? textureUrl.slice(4) : undefined),
    color, roughness, metalness, clearcoat, repeat,
  }), [normalizedScene, materialPreset, textureUrl, color, roughness, metalness, clearcoat, repeat]);

  return <primitive object={normalizedScene} dispose={null} />;
};

class ModelErrorBoundary extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any) {
    console.warn("[WorldPilot] Asset failed to load, rendered procedural fallback:", error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

const TexturedMaterial: React.FC<{ url: string, color?: string }> = ({ url }) => {
  const texture = useTexture(url);
  const isLava = url.toLowerCase().includes('lava') || url.toLowerCase().includes('lave');

  React.useEffect(() => {
    if (texture) {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(2, 2);
      texture.needsUpdate = true;
    }
  }, [texture]);

  if (isLava) {
    return (
      <meshStandardMaterial 
        map={texture} 
        emissiveMap={texture} 
        emissive="#ff3300" 
        emissiveIntensity={0.65} 
        roughness={0.4} 
        metalness={0.15} 
      />
    );
  }

  return (
    <meshPhysicalMaterial 
      map={texture} 
      roughness={0.7} 
      metalness={0.05} 
      clearcoat={0.1} 
      clearcoatRoughness={0.2} 
    />
  );
};

const FireFlickerLight: React.FC<{ color?: string; intensity?: number; distance?: number; position?: [number, number, number] }> = ({
  color = "#ff6a00",
  intensity = 4,
  distance = 10,
  position = [0, 0.8, 0]
}) => {
  const lightRef = React.useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    if (lightRef.current) {
      const t = clock.getElapsedTime() * 12;
      const flicker = Math.sin(t) * 0.25 + Math.sin(t * 2.7) * 0.15 + Math.cos(t * 5.1) * 0.1;
      lightRef.current.intensity = Math.max(0.6, intensity * (1 + flicker * 0.35));
    }
  });
  return <pointLight ref={lightRef} color={color} distance={distance} decay={2} position={position} />;
};

const QuestBeacon: React.FC<{ color?: string }> = ({ color = "#f59e0b" }) => {
  const ringRef = React.useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ringRef.current) return;
    const t = clock.getElapsedTime();
    const scale = 1 + Math.sin(t * 3.5) * 0.12;
    ringRef.current.scale.set(scale, scale, 1);
  });

  return (
    <group position={[0, 0.02, 0]}>
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.55, 0.75, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.7} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

const WebResourceBeacon: React.FC<{ type: 'book' | 'web' | 'computer' | 'art' | 'audio' | 'globe' | 'blueprint' | 'microscope' }> = ({ type }) => {
  const meshRef = React.useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    meshRef.current.position.y = Math.sin(t * 3.2) * 0.035;
    meshRef.current.rotation.y = t * 1.2;
  });

  const config = {
    book: { color: '#a855f7' },
    web: { color: '#06b6d4' },
    computer: { color: '#3b82f6' },
    art: { color: '#ec4899' },
    audio: { color: '#f59e0b' },
    globe: { color: '#06b6d4' },
    blueprint: { color: '#3b82f6' },
    microscope: { color: '#10b981' }
  }[type];

  return (
    <group ref={meshRef}>
      <mesh>
        <octahedronGeometry args={[0.045, 0]} />
        <meshStandardMaterial
          color={config.color}
          emissive={config.color}
          emissiveIntensity={0.85}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
    </group>
  );
};

const CulinarySteamPuffs: React.FC = () => {
  const pointsRef = React.useRef<THREE.Points>(null);
  const particleCount = 22;
  const [positions, offsets] = React.useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const offs = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      pos[i3] = (Math.random() - 0.5) * 0.22;
      pos[i3 + 1] = 0.25 + Math.random() * 0.45;
      pos[i3 + 2] = (Math.random() - 0.5) * 0.22;

      offs[i3] = Math.random() * Math.PI * 2;
      offs[i3 + 1] = 0.38 + Math.random() * 0.35;
      offs[i3 + 2] = 0.05 + Math.random() * 0.08;
    }
    return [pos, offs];
  }, []);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const t = clock.getElapsedTime();
    const posAttr = pointsRef.current.geometry.attributes.position;
    const arr = posAttr.array as Float32Array;

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const phase = offsets[i3];
      const speed = offsets[i3 + 1];
      const drift = offsets[i3 + 2];

      const cycle = ((t * speed + phase) % 1.5) / 1.5;
      arr[i3] = Math.sin(t * 1.8 + phase) * drift;
      arr[i3 + 1] = 0.2 + cycle * 0.65;
      arr[i3 + 2] = Math.cos(t * 1.8 + phase) * drift;
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.16}
        color="#e2e8f0"
        transparent
        opacity={0.45}
        depthWrite={false}
      />
    </points>
  );
};

interface ChoppedVeggiesProps {
  ingredients?: { id: string; name: string; assetId: string }[];
  stage?: number;
}

const ChoppedVeggiesCluster: React.FC<ChoppedVeggiesProps> = ({ ingredients = [], stage = 3 }) => {
  const heatLevel = useWorldStore(s => s.cookingHeatLevel);
  const dice = React.useMemo(() => {
    const hasTomato = ingredients.length === 0 || ingredients.some(i => i.assetId.includes('tomate') || i.name.toLowerCase().includes('tomate'));
    const hasCourgette = ingredients.length === 0 || ingredients.some(i => i.assetId.includes('courgette') || i.name.toLowerCase().includes('courgette'));
    const hasOnion = ingredients.length === 0 || ingredients.some(i => i.assetId.includes('oignon') || i.assetId.includes('echalote') || i.name.toLowerCase().includes('oignon'));
    const hasCarrot = ingredients.some(i => i.assetId.includes('carotte') || i.name.toLowerCase().includes('carotte'));
    const hasGarlic = ingredients.some(i => i.assetId.includes('ail') || i.name.toLowerCase().includes('ail'));

    const colors: { color: string; shape: 'cube' | 'disc' | 'sliver'; size: number }[] = [];
    if (hasTomato) {
      colors.push(
        { color: '#e11d48', shape: 'cube', size: 0.024 },
        { color: '#be123c', shape: 'cube', size: 0.022 },
        { color: '#f43f5e', shape: 'cube', size: 0.020 }
      );
    }
    if (hasCourgette) {
      colors.push(
        { color: '#10b981', shape: 'cube', size: 0.023 },
        { color: '#047857', shape: 'cube', size: 0.021 },
        { color: '#34d399', shape: 'disc', size: 0.025 }
      );
    }
    if (hasOnion) {
      colors.push(
        { color: '#f59e0b', shape: 'cube', size: 0.019 },
        { color: '#fbbf24', shape: 'cube', size: 0.017 },
        { color: '#d97706', shape: 'sliver', size: 0.022 }
      );
    }
    if (hasCarrot) {
      colors.push(
        { color: '#ea580c', shape: 'cube', size: 0.022 },
        { color: '#c2410c', shape: 'cube', size: 0.020 },
        { color: '#f97316', shape: 'disc', size: 0.024 }
      );
    }
    if (hasGarlic) {
      colors.push(
        { color: '#fef3c7', shape: 'sliver', size: 0.015 },
        { color: '#fef08a', shape: 'sliver', size: 0.014 }
      );
    }

    if (colors.length === 0) {
      colors.push(
        { color: '#e11d48', shape: 'cube', size: 0.022 },
        { color: '#10b981', shape: 'cube', size: 0.022 },
        { color: '#f59e0b', shape: 'cube', size: 0.020 }
      );
    }

    const currentStage = Math.max(1, stage || 1);
    const sizeMultiplier = currentStage === 1 ? 1.55 : currentStage === 2 ? 1.15 : 0.9;
    const totalCount = currentStage === 1 
      ? Math.max(4, Math.min(8, colors.length * 2)) 
      : currentStage === 2 
      ? Math.max(10, Math.min(18, colors.length * 3)) 
      : Math.min(28, Math.max(16, colors.length * 4));

    const items: any[] = [];
    for (let idx = 0; idx < totalCount; idx++) {
      const colSpec = colors[idx % colors.length];
      const angle = (idx / totalCount) * Math.PI * 2;
      const radius = (0.025 + (idx % 4) * 0.02) * (currentStage === 1 ? 0.6 : 1.0);
      items.push({
        key: idx,
        color: colSpec.color,
        shape: currentStage === 1 ? 'disc' : colSpec.shape,
        size: colSpec.size * sizeMultiplier,
        pos: [
          Math.cos(angle) * radius + (Math.sin(idx * 7) * 0.012),
          0.022 + (idx % 3) * 0.008,
          Math.sin(angle) * radius * 0.72 + (Math.cos(idx * 5) * 0.012)
        ] as [number, number, number],
        rot: [Math.sin(idx) * 0.35, (idx * 0.8) % (Math.PI * 2), Math.cos(idx) * 0.35] as [number, number, number]
      });
    }
    return items;
  }, [ingredients, stage]);

  return (
    <group position={[0, 0.018, 0]}>
      {dice.map(d => (
        <mesh key={d.key} position={d.pos} rotation={d.rot} castShadow>
          {d.shape === 'disc' ? (
            <cylinderGeometry args={[d.size * 0.65, d.size * 0.65, 0.01, 14]} />
          ) : (
            <boxGeometry args={[d.size, d.shape === 'sliver' ? 0.007 : d.size, d.size]} />
          )}
          <meshStandardMaterial
            color={d.color}
            roughness={heatLevel > 0 ? 0.55 : 0.35}
            metalness={0.08}
            emissive={heatLevel === 3 ? '#ea580c' : heatLevel === 2 ? '#b45309' : '#000000'}
            emissiveIntensity={heatLevel === 3 ? 0.35 : heatLevel === 2 ? 0.18 : 0}
          />
        </mesh>
      ))}
    </group>
  );
};

const Whiteboard3DStickyNotes: React.FC<{ entity: EntitySpec }> = ({ entity: _entity }) => {
  const notes = useWorldStore(s => s.collaborationNotes);
  const topNotes = notes.slice(0, 3);
  const setShowModal = useWorldStore(s => s.setShowCollaborationBoardModal);

  const colorStyles: Record<string, { bg: string; text: string; tape: string }> = {
    yellow: { bg: '#fef9c3', text: '#713f12', tape: 'rgba(253, 224, 71, 0.7)' },
    green: { bg: '#dcfce7', text: '#14532d', tape: 'rgba(134, 239, 172, 0.7)' },
    pink: { bg: '#fce7f3', text: '#831843', tape: 'rgba(244, 114, 182, 0.7)' },
    blue: { bg: '#e0f2fe', text: '#0c4a6e', tape: 'rgba(125, 211, 252, 0.7)' },
    orange: { bg: '#ffedd5', text: '#7c2d12', tape: 'rgba(253, 186, 116, 0.7)' }
  };

  return (
    <Html
      position={[0, 1.25, 0.05]}
      center
      distanceFactor={6}
      zIndexRange={[40, 0]}
      style={{ pointerEvents: 'auto' }}
    >
      <div
        className="whiteboard-3d-sticky-cluster"
        onClick={(e) => {
          e.stopPropagation();
          setShowModal(true);
        }}
        title="Tableau collaboratif : cliquer pour ouvrir l'espace de post-its"
      >
        <div className="whiteboard-3d-header">
          <span>📋 Tableau d'Idées ({notes.length})</span>
          <small>Cliquer pour éditer</small>
        </div>
        <div className="whiteboard-3d-notes-grid">
          {topNotes.map((note, idx) => {
            const col = colorStyles[note.color] || colorStyles.yellow;
            const rot = idx === 0 ? -2 : idx === 1 ? 2 : -1;
            return (
              <div
                key={note.id}
                className="whiteboard-3d-note"
                style={{
                  backgroundColor: col.bg,
                  color: col.text,
                  transform: `rotate(${rot}deg)`
                }}
              >
                <div className="whiteboard-3d-tape" style={{ backgroundColor: col.tape }} />
                <div className="whiteboard-3d-note-text">
                  {note.text.length > 36 ? note.text.slice(0, 34) + '...' : note.text}
                </div>
                <div className="whiteboard-3d-note-meta">
                  <span>❤️ {note.votes}</span>
                  <small>{note.author.slice(0, 10)}</small>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Html>
  );
};

interface PlatedDishProps {
  isPlated: boolean;
}

const PlatedDishPresentation: React.FC<PlatedDishProps> = ({ isPlated }) => {
  const platingStyle = useWorldStore(s => s.platingStyle);
  const platingGarnish = useWorldStore(s => s.platingGarnish);
  if (!isPlated) return null;

  return (
    <group position={[0, 0.022, 0]}>
      {/* Plating Style Variations */}
      {platingStyle === 'classic-dome' && (
        <>
          {/* 1. Gourmet Food Mound with Glistening Demi-Glace */}
          <mesh position={[0, 0.024, 0]} castShadow>
            <sphereGeometry args={[0.088, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.52]} />
            <meshPhysicalMaterial
              color="#b91c1c"
              roughness={0.24}
              metalness={0.12}
              clearcoat={0.88}
              clearcoatRoughness={0.14}
              emissive="#7f1d1d"
              emissiveIntensity={0.25}
            />
          </mesh>

          {/* 2. Concentric Glistening Jus Reduction Ring */}
          <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.075, 0.115, 32]} />
            <meshStandardMaterial color="#991b1b" roughness={0.18} metalness={0.15} />
          </mesh>
        </>
      )}

      {platingStyle === 'deconstructed-arc' && (
        <>
          {/* 3 Modern Gourmet Quenelles in a graceful crescent arc */}
          {[
            { pos: [-0.045, 0.02, 0.035], rot: [0.1, 0.4, 0.2], col: '#b91c1c' },
            { pos: [0.015, 0.026, 0.015], rot: [-0.2, 0.8, -0.1], col: '#991b1b' },
            { pos: [0.065, 0.018, -0.035], rot: [0.3, 1.2, 0.3], col: '#7f1d1d' }
          ].map((q, i) => (
            <mesh key={i} position={q.pos as any} rotation={q.rot as any} castShadow>
              <capsuleGeometry args={[0.018, 0.038, 12, 16]} />
              <meshPhysicalMaterial
                color={q.col}
                roughness={0.22}
                metalness={0.15}
                clearcoat={0.9}
                clearcoatRoughness={0.12}
              />
            </mesh>
          ))}
          {/* Sweeping crescent demi-glace curve */}
          <mesh position={[0, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0.4]}>
            <ringGeometry args={[0.045, 0.085, 32, 1, 0, Math.PI * 1.3]} />
            <meshStandardMaterial color="#7f1d1d" roughness={0.15} />
          </mesh>
        </>
      )}

      {platingStyle === 'geometric-tian' && (
        <group position={[0, 0.012, 0]}>
          {/* Layer 1: Grilled Aubergine Disc */}
          <mesh position={[0, 0.012, 0]} castShadow>
            <cylinderGeometry args={[0.062, 0.062, 0.02, 24]} />
            <meshPhysicalMaterial color="#581c87" roughness={0.3} metalness={0.1} clearcoat={0.6} />
          </mesh>
          {/* Layer 2: Zucchini Courgette Disc */}
          <mesh position={[0, 0.032, 0]} castShadow>
            <cylinderGeometry args={[0.058, 0.058, 0.018, 24]} />
            <meshPhysicalMaterial color="#059669" roughness={0.28} metalness={0.1} clearcoat={0.7} />
          </mesh>
          {/* Layer 3: Heirloom Tomato Fondant Disc */}
          <mesh position={[0, 0.05, 0]} castShadow>
            <cylinderGeometry args={[0.054, 0.054, 0.016, 24]} />
            <meshPhysicalMaterial color="#dc2626" roughness={0.2} metalness={0.15} clearcoat={0.9} />
          </mesh>
          {/* Tian Glaze Drizzle */}
          <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.065, 0.098, 28]} />
            <meshStandardMaterial color="#7c2d12" roughness={0.2} />
          </mesh>
        </group>
      )}

      {/* 3. Brunoise garnish specks on the mound */}
      <group position={[0, 0.035, 0]}>
        {[
          { pos: [0.03, 0.03, 0.02], color: '#10b981', size: 0.008 },
          { pos: [-0.03, 0.035, -0.02], color: '#f59e0b', size: 0.009 },
          { pos: [0.01, 0.045, -0.03], color: '#ef4444', size: 0.008 },
          { pos: [-0.02, 0.04, 0.03], color: '#10b981', size: 0.007 },
          { pos: [0.04, 0.02, -0.01], color: '#facc15', size: 0.007 },
        ].map((s, idx) => (
          <mesh key={idx} position={s.pos as [number, number, number]}>
            <boxGeometry args={[s.size, s.size, s.size]} />
            <meshStandardMaterial color={s.color} roughness={0.3} />
          </mesh>
        ))}
      </group>

      {/* Gastronomic Garnish Finishes */}
      {platingGarnish === 'tuile-dentelle' && (
        <group position={[0.015, 0.082, 0.01]} rotation={[0.25, -0.35, 0.2]}>
          <mesh castShadow>
            <boxGeometry args={[0.042, 0.068, 0.003]} />
            <meshPhysicalMaterial
              color="#f59e0b"
              roughness={0.22}
              metalness={0.3}
              clearcoat={1.0}
              clearcoatRoughness={0.1}
              emissive="#d97706"
              emissiveIntensity={0.25}
            />
          </mesh>
          <Edges color="#fef08a" />
        </group>
      )}

      {platingGarnish === 'fleur-de-sel' && (
        <group position={[0, 0.075, 0]}>
          {[
            [-0.015, 0.01, 0.02],
            [0.012, 0.008, -0.015],
            [-0.005, 0.015, -0.01],
            [0.02, 0.012, 0.018],
          ].map((p, i) => (
            <mesh key={i} position={p as any}>
              <boxGeometry args={[0.005, 0.005, 0.005]} />
              <meshPhysicalMaterial color="#ffffff" roughness={0.05} metalness={0.9} clearcoat={1.0} />
            </mesh>
          ))}
        </group>
      )}

      {platingGarnish === 'micro-greens' && (
        <group position={[0, 0.08, 0]}>
          {[-0.02, 0.01, 0.02].map((x, i) => (
            <mesh key={i} position={[x, 0.005, i * 0.01 - 0.01]} rotation={[0.2, i * 1.2, 0]}>
              <coneGeometry args={[0.008, 0.025, 4]} />
              <meshStandardMaterial color={i % 2 === 0 ? '#991b1b' : '#15803d'} roughness={0.3} />
            </mesh>
          ))}
        </group>
      )}

      {platingGarnish === 'truffle-specks' && (
        <group position={[0, 0.075, 0]}>
          {[
            [0.01, 0.01, 0.02],
            [-0.015, 0.012, -0.01],
            [0.005, 0.018, -0.02]
          ].map((p, i) => (
            <mesh key={i} position={p as any} rotation={[0.4, i * 0.8, 0.2]}>
              <boxGeometry args={[0.012, 0.002, 0.016]} />
              <meshPhysicalMaterial color="#1c1917" roughness={0.2} metalness={0.2} clearcoat={0.8} />
            </mesh>
          ))}
        </group>
      )}

      {/* 4. Fresh Parsley / Herb Sprig Crown */}
      <group position={[0, 0.086, 0]}>
        <mesh rotation={[0.2, 0.4, 0]}>
          <coneGeometry args={[0.012, 0.028, 5]} />
          <meshStandardMaterial color="#15803d" roughness={0.4} />
        </mesh>
        <mesh position={[0.008, 0.004, 0]} rotation={[-0.3, 0.8, 0.2]}>
          <coneGeometry args={[0.01, 0.024, 5]} />
          <meshStandardMaterial color="#16a34a" roughness={0.4} />
        </mesh>
        <mesh position={[-0.008, 0.004, 0]} rotation={[0.3, -0.8, -0.2]}>
          <coneGeometry args={[0.01, 0.024, 5]} />
          <meshStandardMaterial color="#15803d" roughness={0.4} />
        </mesh>
      </group>

      {/* 5. Chef balsamic / jus reduction drops on the white porcelain rim */}
      <group position={[0, 0.016, 0]}>
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const angle = (i / 6) * Math.PI * 2 + 0.3;
          const r = 0.155;
          return (
            <mesh key={i} position={[Math.cos(angle) * r, 0, Math.sin(angle) * r]}>
              <sphereGeometry args={[0.004, 8, 8]} />
              <meshStandardMaterial color="#450a0a" roughness={0.1} />
            </mesh>
          );
        })}
      </group>

      {/* 6. Delicate steam puffs */}
      <CulinarySteamPuffs />

      {/* 7. Culinary Gastronomic Aura / Glimmer */}
      <points position={[0, 0.05, 0]}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={12}
            array={new Float32Array([
              -0.05, 0.02, 0.03,
               0.06, 0.04, -0.02,
              -0.03, 0.07, -0.04,
               0.04, 0.06, 0.05,
               0.00, 0.09, 0.00,
              -0.07, 0.03, -0.01,
               0.05, 0.08, -0.03,
              -0.02, 0.05, 0.06,
               0.07, 0.02, 0.02,
              -0.04, 0.08, 0.01,
               0.02, 0.03, -0.06,
              -0.01, 0.10, -0.02
            ])}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.014}
          color="#fbbf24"
          transparent
          opacity={0.7}
          depthWrite={false}
        />
      </points>

      {/* 8. Interactive 3D Tasting Utensil Experience */}
      <PlatedTastingExperience />

      {/* 9. Chef's Glistening Saucing Ribbon */}
      <PlatedSaucingRibbon />
    </group>
  );
};

const PlatedSaucingRibbon: React.FC = () => {
  const isDishSauced = useWorldStore(s => s.isDishSauced);
  const ribbonCurve = React.useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.085, 0.012, 0.045),
      new THREE.Vector3(-0.055, 0.024, 0.02),
      new THREE.Vector3(-0.02, 0.048, 0.005),
      new THREE.Vector3(0.025, 0.051, -0.012),
      new THREE.Vector3(0.062, 0.036, 0.028),
      new THREE.Vector3(0.088, 0.016, 0.055),
      new THREE.Vector3(0.115, 0.010, 0.038)
    ]);
  }, []);

  if (!isDishSauced) return null;

  return (
    <group position={[0, 0.002, 0]}>
      <mesh castShadow>
        <tubeGeometry args={[ribbonCurve, 32, 0.0038, 8, false]} />
        <meshPhysicalMaterial
          color="#7f1d1d"
          roughness={0.16}
          clearcoat={1.0}
          clearcoatRoughness={0.06}
          metalness={0.12}
          emissive="#450a0a"
          emissiveIntensity={0.25}
        />
      </mesh>

      {[
        { pos: [0.126, 0.008, 0.032], r: 0.0028 },
        { pos: [0.136, 0.007, 0.025], r: 0.0022 },
        { pos: [0.144, 0.006, 0.020], r: 0.0016 },
      ].map((drop, dIdx) => (
        <mesh key={dIdx} position={drop.pos as [number, number, number]}>
          <sphereGeometry args={[drop.r, 8, 8]} />
          <meshPhysicalMaterial
            color="#450a0a"
            roughness={0.1}
            clearcoat={1.0}
            clearcoatRoughness={0.05}
          />
        </mesh>
      ))}
    </group>
  );
};

const PlatedTastingExperience: React.FC = () => {
  const isTastingActive = useWorldStore(s => s.isTastingActive);
  const tastingUtensil = useWorldStore(s => s.tastingUtensil);
  const stopTasting = useWorldStore(s => s.stopTasting);
  const utensilGroupRef = React.useRef<THREE.Group>(null);
  const morselRef = React.useRef<THREE.Group>(null);
  const sparklesRef = React.useRef<THREE.Points>(null);
  const [startTime, setStartTime] = React.useState<number | null>(null);
  const [showRatingTag, setShowRatingTag] = React.useState(false);
  const clinkPlayedRef = React.useRef(false);
  const sparklePlayedRef = React.useRef(false);
  const fanfarePlayedRef = React.useRef(false);

  React.useEffect(() => {
    if (isTastingActive) {
      setStartTime(Date.now());
      setShowRatingTag(false);
      clinkPlayedRef.current = false;
      sparklePlayedRef.current = false;
      fanfarePlayedRef.current = false;
      const timer = setTimeout(() => {
        stopTasting();
        setStartTime(null);
        setShowRatingTag(false);
      }, 3400);
      return () => clearTimeout(timer);
    } else {
      setStartTime(null);
      setShowRatingTag(false);
    }
  }, [isTastingActive, stopTasting]);

  useFrame(() => {
    if (!isTastingActive || !startTime || !utensilGroupRef.current) return;
    const elapsed = (Date.now() - startTime) / 1000;

    // Sound effects sequence
    if (elapsed >= 0.6 && !clinkPlayedRef.current) {
      clinkPlayedRef.current = true;
      playAudioFx('chime');
    }
    if (elapsed >= 1.3 && !sparklePlayedRef.current) {
      sparklePlayedRef.current = true;
      playAudioFx('sparkle');
    }
    if (elapsed >= 2.4 && !fanfarePlayedRef.current) {
      fanfarePlayedRef.current = true;
      playAudioFx('fanfare');
    }

    if (elapsed < 0.7) {
      const p = elapsed / 0.7;
      const ease = p * p * (3 - 2 * p);
      utensilGroupRef.current.position.set(
        0.12 * (1 - ease) + 0.02 * ease,
        0.20 * (1 - ease) + 0.045 * ease,
        0.10 * (1 - ease) + 0.02 * ease
      );
      utensilGroupRef.current.rotation.set(
        -0.5 + 0.3 * ease,
        0.3 - 0.1 * ease,
        0.2 - 0.1 * ease
      );
      if (morselRef.current) {
        morselRef.current.scale.set(0, 0, 0);
      }
    } else if (elapsed < 1.1) {
      const p = (elapsed - 0.7) / 0.4;
      const dip = Math.sin(p * Math.PI) * 0.012;
      utensilGroupRef.current.position.set(0.02, 0.045 - dip, 0.02);
      utensilGroupRef.current.rotation.set(-0.2 + p * 0.1, 0.2, 0.1);
      if (morselRef.current) {
        const s = Math.min(1, p * 1.5);
        morselRef.current.scale.set(s, s, s);
      }
    } else if (elapsed < 2.3) {
      const p = (elapsed - 1.1) / 1.2;
      const ease = p * p * (3 - 2 * p);
      utensilGroupRef.current.position.set(
        0.02 * (1 - ease) + 0.0 * ease,
        0.045 * (1 - ease) + 0.22 * ease,
        0.02 * (1 - ease) + 0.14 * ease
      );
      utensilGroupRef.current.rotation.set(
        -0.1 * (1 - ease) - 0.35 * ease,
        0.2 * (1 - ease),
        0.1 * (1 - ease) + Math.sin(p * Math.PI) * 0.08
      );
      if (morselRef.current) {
        morselRef.current.scale.set(1, 1, 1);
      }
      if (p > 0.55 && !showRatingTag) {
        setShowRatingTag(true);
      }
    } else if (elapsed < 3.4) {
      const p = (elapsed - 2.3) / 1.1;
      utensilGroupRef.current.position.set(
        0.0,
        0.22 + Math.sin(p * Math.PI * 2) * 0.008,
        0.14
      );
      if (morselRef.current) {
        const s = Math.max(0, 1 - p * 2.2);
        morselRef.current.scale.set(s, s, s);
      }
      if (sparklesRef.current) {
        const burstScale = 1 + p * 2.2;
        sparklesRef.current.scale.set(burstScale, burstScale, burstScale);
      }
    }
  });

  if (!isTastingActive) return null;

  const isSpoon = tastingUtensil === 'spoon';

  return (
    <group ref={utensilGroupRef} position={[0.02, 0.05, 0.02]}>
      {/* 3D Utensil Mesh: Chrome / Polished Silver Finish */}
      {isSpoon ? (
        <group rotation={[Math.PI / 4, 0, 0]}>
          <mesh position={[0, -0.07, 0]} castShadow>
            <cylinderGeometry args={[0.003, 0.005, 0.15, 12]} />
            <meshStandardMaterial color="#f8fafc" metalness={0.94} roughness={0.14} />
          </mesh>
          <mesh position={[0, 0.015, 0.004]} rotation={[-0.2, 0, 0]} castShadow>
            <sphereGeometry args={[0.018, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
            <meshStandardMaterial color="#f8fafc" metalness={0.95} roughness={0.12} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ) : (
        <group rotation={[Math.PI / 4, 0, 0]}>
          <mesh position={[0, -0.07, 0]} castShadow>
            <cylinderGeometry args={[0.003, 0.005, 0.15, 12]} />
            <meshStandardMaterial color="#f8fafc" metalness={0.94} roughness={0.14} />
          </mesh>
          <mesh position={[0, 0.01, 0]}>
            <boxGeometry args={[0.016, 0.008, 0.003]} />
            <meshStandardMaterial color="#f8fafc" metalness={0.94} roughness={0.14} />
          </mesh>
          {[-0.006, -0.002, 0.002, 0.006].map((xOffset, tIdx) => (
            <mesh key={tIdx} position={[xOffset, 0.024, 0.002]} rotation={[-0.15, 0, 0]}>
              <cylinderGeometry args={[0.0009, 0.0012, 0.022, 6]} />
              <meshStandardMaterial color="#f8fafc" metalness={0.95} roughness={0.12} />
            </mesh>
          ))}
        </group>
      )}

      {/* Savory Gourmet Morsel lifted by the utensil */}
      <group ref={morselRef} position={[0, 0.028, 0.008]}>
        <mesh castShadow>
          <sphereGeometry args={[0.012, 12, 10]} />
          <meshPhysicalMaterial
            color="#b91c1c"
            clearcoat={0.95}
            clearcoatRoughness={0.1}
            roughness={0.2}
            emissive="#7f1d1d"
            emissiveIntensity={0.3}
          />
        </mesh>
        <mesh position={[0.004, 0.008, 0.003]}>
          <boxGeometry args={[0.004, 0.004, 0.004]} />
          <meshStandardMaterial color="#10b981" roughness={0.3} />
        </mesh>
        <mesh position={[-0.004, 0.006, -0.003]}>
          <boxGeometry args={[0.005, 0.005, 0.005]} />
          <meshStandardMaterial color="#fbbf24" roughness={0.3} />
        </mesh>
      </group>

      {/* Shimmering Burst Aura */}
      <points ref={sparklesRef} position={[0, 0.03, 0.01]}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={18}
            array={new Float32Array([
              -0.03, 0.02, 0.02,
               0.03, 0.03, -0.02,
              -0.02, 0.04, -0.03,
               0.02, 0.04, 0.03,
               0.00, 0.05, 0.00,
              -0.04, 0.01, -0.01,
               0.04, 0.05, -0.02,
              -0.01, 0.03, 0.04,
               0.03, 0.01, 0.01,
              -0.03, 0.05, 0.01,
               0.01, 0.02, -0.04,
              -0.01, 0.06, -0.01,
               0.02, -0.02, 0.03,
              -0.02, -0.01, -0.02,
               0.04, 0.02, -0.03,
              -0.03, 0.02, 0.04,
               0.00, 0.07, 0.00,
               0.00, -0.03, 0.01
            ])}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.016}
          color="#fde047"
          transparent
          opacity={0.85}
          depthWrite={false}
        />
      </points>

      {/* Floating Savor Celebration Tag */}
      {showRatingTag && (
        <Html position={[0, 0.08, 0]} center distanceFactor={7} zIndexRange={[40, 0]}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95))',
            border: '1.5px solid #fbbf24',
            borderRadius: '12px',
            padding: '6px 12px',
            color: '#f8fafc',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '12px',
            fontWeight: '700',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5), 0 0 16px rgba(251,191,36,0.3)',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            pointerEvents: 'none'
          }}>
            <span style={{ fontSize: '15px' }}>✨</span>
            <span>Régal de Chef · Accord parfait !</span>
            <span style={{ color: '#fbbf24' }}>★ ★ ★ ★ ★</span>
          </div>
        </Html>
      )}
    </group>
  );
};

interface SimmeringLiquidProps {
  isPan?: boolean;
  ingredients?: { id: string; name: string; assetId: string }[];
}

const SimmeringLiquidSurface: React.FC<SimmeringLiquidProps> = ({ isPan, ingredients = [] }) => {
  const liquidRef = React.useRef<THREE.Mesh>(null);
  const bubbleGroup = React.useRef<THREE.Group>(null);
  const garnishGroup = React.useRef<THREE.Group>(null);
  const vortexRef = React.useRef<THREE.Group>(null);
  const [stirEndTime, setStirEndTime] = React.useState<number>(0);
  const heatLevel = useWorldStore(s => s.cookingHeatLevel);
  const seasoningProfile = useWorldStore(s => s.seasoningProfile);
  const doneness = useWorldStore(s => s.cookingDoneness);
  const count = ingredients.length;

  React.useEffect(() => {
    const handleStir = () => {
      setStirEndTime(Date.now() + 4500);
    };
    window.addEventListener('worldpilot_stir_cookware', handleStir);
    return () => window.removeEventListener('worldpilot_stir_cookware', handleStir);
  }, []);

  const radius = isPan ? 0.22 : 0.18;
  const baseHeight = isPan ? 0.05 : 0.085;
  const height = baseHeight + Math.min(0.045, count * 0.015);

  const hasWine = ingredients.some(i => i.assetId.includes('vin') || i.name.toLowerCase().includes('vin'));
  const hasTomato = ingredients.some(i => i.assetId.includes('tomate') || i.name.toLowerCase().includes('tomate'));
  const hasButter = ingredients.some(i => i.assetId.includes('beurre') || i.name.toLowerCase().includes('beurre'));
  const hasGreen = ingredients.some(i => i.assetId.includes('courgette') || i.assetId.includes('bouquet') || i.name.toLowerCase().includes('courgette'));

  let stewColor = '#991b1b';
  let emissiveColor = '#b45309';
  if (hasWine) {
    stewColor = '#4a044e'; // Bordeaux / Bourgogne vin rouge
    emissiveColor = '#831843';
  } else if (hasButter && count <= 2 && !hasTomato) {
    stewColor = '#d97706'; // Beurre fondu doré
    emissiveColor = '#f59e0b';
  } else if (hasTomato && hasGreen) {
    stewColor = '#b91c1c'; // Ratatouille provençale vive
    emissiveColor = '#d97706';
  }

  const garnishSpecks = React.useMemo(() => {
    const specks: { key: number; x: number; z: number; color: string; size: number; phase: number }[] = [];
    const colors = ['#10b981', '#ef4444', '#f59e0b', '#7c3aed', '#ffffff'];
    const total = Math.max(6, Math.min(18, count * 4));
    for (let i = 0; i < total; i++) {
      const angle = (i / total) * Math.PI * 2 + (i % 2) * 0.4;
      const r = 0.04 + (i % 3) * 0.04;
      specks.push({
        key: i,
        x: Math.cos(angle) * r,
        z: Math.sin(angle) * r * 0.85,
        color: colors[i % colors.length],
        size: 0.007 + (i % 3) * 0.003,
        phase: i * 0.8
      });
    }
    return specks;
  }, [count]);

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();
    const remainingStir = stirEndTime - Date.now();
    const stirFactor = remainingStir > 0 ? Math.min(1, remainingStir / 3800) : 0;
    const heatMultiplier = heatLevel === 0 ? 0.04 : heatLevel === 1 ? 0.6 : heatLevel === 2 ? 1.0 : 1.75;

    if (liquidRef.current) {
      const mat = liquidRef.current.material as THREE.MeshStandardMaterial;
      const pulseSpeed = (2.5 + Math.min(2.5, count * 0.6) + stirFactor * 4.0) * (heatLevel === 0 ? 0.2 : heatMultiplier);
      mat.emissiveIntensity = heatLevel === 0 
        ? 0.04 
        : (0.22 + Math.sin(t * pulseSpeed) * (0.12 + count * 0.02) + stirFactor * 0.35) * Math.min(1.4, heatMultiplier);
    }
    if (vortexRef.current) {
      vortexRef.current.rotation.z += delta * (3.5 + stirFactor * 8.5) * (heatLevel === 0 ? 0.15 : heatMultiplier);
      const vScale = (0.75 + stirFactor * 0.35) * (heatLevel === 0 ? 0.15 : heatLevel === 1 ? 0.8 : heatLevel === 2 ? 1.0 : 1.25);
      vortexRef.current.scale.set(vScale, vScale, vScale);
    }
    if (bubbleGroup.current) {
      bubbleGroup.current.children.forEach((child, i) => {
        const speed = (2.5 + i * 0.7) * (1 + Math.min(1, count * 0.15) + stirFactor * 1.5) * heatMultiplier;
        const phase = i * 1.3;
        const s = heatLevel === 0 ? 0 : (0.8 + Math.sin(t * speed + phase) * 0.35 + stirFactor * 0.25) * heatMultiplier;
        child.scale.set(Math.max(0, s), Math.max(0, s), Math.max(0, s));
      });
      if (stirFactor > 0.01 || heatLevel === 3) {
        bubbleGroup.current.rotation.y += delta * (stirFactor * 2.8 + (heatLevel === 3 ? 1.4 : 0));
      }
    }
    if (garnishGroup.current) {
      garnishGroup.current.children.forEach((child, i) => {
        const speck = garnishSpecks[i];
        if (speck) {
          if (stirFactor > 0.01) {
            const currentAngle = Math.atan2(speck.z, speck.x) + t * (2.2 + stirFactor * 5.2 + (i % 3) * 0.8);
            const dist = Math.hypot(speck.x, speck.z) * (0.85 + Math.sin(t * 4.0 + i) * 0.12);
            child.position.x = Math.cos(currentAngle) * dist;
            child.position.z = Math.sin(currentAngle) * dist;
            child.position.y = Math.sin(t * 5.0 + speck.phase) * 0.0035;
          } else {
            child.position.x = speck.x;
            child.position.z = speck.z;
            child.position.y = Math.sin(t * 3.0 + speck.phase) * 0.002 * heatMultiplier;
          }
        }
      });
    }
  });

  const isStirActive = stirEndTime > Date.now();

  return (
    <group position={[0, height, 0]}>
      <mesh ref={liquidRef} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[radius, 32]} />
        <meshStandardMaterial
          color={stewColor}
          roughness={Math.max(0.12, 0.25 - (doneness / 100) * 0.11)}
          metalness={0.15 + (doneness / 100) * 0.1}
          emissive={emissiveColor}
          emissiveIntensity={(heatLevel === 0 ? 0.05 : 0.3 * (heatLevel === 1 ? 0.7 : heatLevel === 3 ? 1.3 : 1.0)) + (doneness / 100) * 0.12}
        />
      </mesh>
      {/* Glazing reduction sheen when doneness is high */}
      {doneness >= 75 && (
        <mesh position={[0, 0.0035, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius * 0.65, radius * 0.95, 32]} />
          <meshBasicMaterial color="#f59e0b" transparent opacity={0.15 + (doneness - 75) * 0.004} side={THREE.DoubleSide} />
        </mesh>
      )}
      {/* Dynamic swirling fluid vortex rings */}
      <group ref={vortexRef} position={[0, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh>
          <ringGeometry args={[radius * 0.22, radius * 0.82, 32, 1, 0, Math.PI * 1.7]} />
          <meshBasicMaterial color="#fef08a" transparent opacity={heatLevel === 0 ? 0.04 : (isStirActive ? 0.65 : 0.18) * (heatLevel === 3 ? 1.4 : 1.0)} side={THREE.DoubleSide} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI]}>
          <ringGeometry args={[radius * 0.08, radius * 0.55, 32, 1, 0, Math.PI * 1.5]} />
          <meshBasicMaterial color="#f59e0b" transparent opacity={heatLevel === 0 ? 0.03 : (isStirActive ? 0.75 : 0.14) * (heatLevel === 3 ? 1.4 : 1.0)} side={THREE.DoubleSide} />
        </mesh>
      </group>
      <group ref={bubbleGroup} position={[0, 0.004, 0]}>
        {[
          [-0.07, 0.05],
          [0.08, -0.04],
          [0.02, 0.09],
          [-0.04, -0.08],
          [0.06, 0.06],
          [-0.01, -0.02],
          [0.04, 0.03]
        ].map(([bx, bz], idx) => (
          <mesh key={idx} position={[bx, 0, bz]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.011, 0.022, 16]} />
            <meshBasicMaterial color="#fef08a" transparent opacity={heatLevel === 0 ? 0 : 0.65} />
          </mesh>
        ))}
      </group>
      {count > 0 && (
        <group ref={garnishGroup} position={[0, 0.005, 0]}>
          {garnishSpecks.map(s => (
            <mesh key={s.key} position={[s.x, 0, s.z]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[s.size, 8]} />
              <meshBasicMaterial color={s.color} transparent opacity={0.8} />
            </mesh>
          ))}
        </group>
      )}
      {/* Glistening golden olive oil drops on the broth surface */}
      {seasoningProfile.oil > 0 && (
        <group position={[0, 0.004, 0]}>
          {[
            [-0.05, 0.06],
            [0.06, -0.04],
            [-0.04, -0.05],
            [0.04, 0.05],
            [0, 0.02]
          ].map(([ox, oz], idx) => (
            <mesh key={idx} position={[ox, 0, oz]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.016, 16]} />
              <meshBasicMaterial color="#eab308" transparent opacity={0.65} />
            </mesh>
          ))}
        </group>
      )}
      {/* Salt crystal specks dissolved into broth */}
      {seasoningProfile.salt > 0 && (
        <group position={[0, 0.0045, 0]}>
          {[
            [0.02, 0.03],
            [-0.03, 0.02],
            [0.01, -0.03],
            [-0.02, -0.02]
          ].map(([sx, sz], idx) => (
            <mesh key={idx} position={[sx, 0, sz]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.005, 8]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
            </mesh>
          ))}
        </group>
      )}
      <pointLight 
        color={heatLevel === 3 ? '#fb923c' : '#f59e0b'} 
        intensity={heatLevel === 0 ? 0.15 : (0.7 + count * 0.15 + (isStirActive ? 0.6 : 0)) * (heatLevel === 1 ? 0.7 : heatLevel === 3 ? 1.5 : 1.0)} 
        distance={0.85} 
        position={[0, 0.08, 0]} 
      />
    </group>
  );
};

const CookwareThermalBurner: React.FC<{ isPan?: boolean }> = ({ isPan }) => {
  const heatLevel = useWorldStore(s => s.cookingHeatLevel);
  const flameRingRef = React.useRef<THREE.Group>(null);
  const radius = isPan ? 0.21 : 0.17;

  useFrame(({ clock }) => {
    if (heatLevel === 3 && flameRingRef.current) {
      const t = clock.getElapsedTime();
      flameRingRef.current.children.forEach((child, i) => {
        const flicker = 0.8 + Math.sin(t * 22 + i * 1.6) * 0.25;
        child.scale.set(flicker, flicker, flicker);
      });
    }
  });

  if (heatLevel === 0) {
    return (
      <group position={[0, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh>
          <ringGeometry args={[radius * 0.35, radius * 0.95, 32]} />
          <meshBasicMaterial color="#1e293b" transparent opacity={0.25} side={THREE.DoubleSide} />
        </mesh>
      </group>
    );
  }

  const isVif = heatLevel === 3;
  const isMoyen = heatLevel === 2;

  return (
    <group position={[0, 0.004, 0]}>
      {/* Outer heating induction coil / flame base ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius * 0.35, radius * 0.95, 36]} />
        <meshBasicMaterial 
          color={isVif ? '#0284c7' : isMoyen ? '#ea580c' : '#d97706'} 
          transparent 
          opacity={isVif ? 0.85 : isMoyen ? 0.75 : 0.55} 
          side={THREE.DoubleSide} 
        />
      </mesh>
      
      {/* Inner concentrated thermal core */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius * 0.12, radius * 0.42, 28]} />
        <meshBasicMaterial 
          color={isVif ? '#38bdf8' : isMoyen ? '#ef4444' : '#f59e0b'} 
          transparent 
          opacity={isVif ? 0.95 : isMoyen ? 0.85 : 0.65} 
          side={THREE.DoubleSide} 
        />
      </mesh>

      {/* Blue gas flame tips on high heat (level 3) */}
      {isVif && (
        <group ref={flameRingRef} position={[0, 0.003, 0]}>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(i => {
            const angle = (i / 12) * Math.PI * 2;
            const r = radius * 0.86;
            return (
              <mesh key={i} position={[Math.cos(angle) * r, 0.006, Math.sin(angle) * r]} rotation={[0.2, 0, 0]}>
                <coneGeometry args={[0.012, 0.035, 6]} />
                <meshBasicMaterial color="#38bdf8" transparent opacity={0.92} />
              </mesh>
            );
          })}
        </group>
      )}

      {/* Radiated heat point light under the cookware */}
      <pointLight 
        color={isVif ? '#38bdf8' : isMoyen ? '#f97316' : '#f59e0b'} 
        intensity={isVif ? 2.8 : isMoyen ? 1.7 : 0.9} 
        distance={0.7} 
        position={[0, 0.03, 0]} 
      />
    </group>
  );
};

const SeasoningParticleCascade: React.FC = () => {
  const [activeCascades, setActiveCascades] = React.useState<{ id: number; type: 'salt' | 'oil' | 'herbs'; startTime: number }[]>([]);

  React.useEffect(() => {
    const onSeason = (e: any) => {
      const type = e.detail?.type || 'salt';
      const newCascade = { id: Date.now(), type, startTime: Date.now() };
      setActiveCascades(prev => [...prev, newCascade]);
      const timer = setTimeout(() => {
        setActiveCascades(prev => prev.filter(c => c.id !== newCascade.id));
      }, 2400);
      return () => clearTimeout(timer);
    };
    window.addEventListener('worldpilot_seasoning_event', onSeason);
    return () => window.removeEventListener('worldpilot_seasoning_event', onSeason);
  }, []);

  const cascadeGroup = React.useRef<THREE.Group>(null);

  useFrame(() => {
    if (!cascadeGroup.current) return;
    const now = Date.now();
    cascadeGroup.current.children.forEach((child: any) => {
      const age = (now - child.userData.startTime) / 2200;
      if (age >= 0 && age <= 1) {
        const speed = child.userData.speed || 0.35;
        child.position.y = (child.userData.startY || 0.3) - age * speed;
        child.rotation.x += 0.05;
        child.rotation.y += 0.05;
        if (child.material) {
          child.material.opacity = Math.max(0, (1 - age) * 0.95);
        }
      }
    });
  });

  if (activeCascades.length === 0) return null;

  return (
    <group ref={cascadeGroup} position={[0, 0.05, 0]}>
      {activeCascades.map(cas => {
        const isSalt = cas.type === 'salt';
        const isOil = cas.type === 'oil';
        const particleCount = isSalt ? 24 : isOil ? 16 : 10;

        return (
          <group key={cas.id}>
            {Array.from({ length: particleCount }).map((_, idx) => {
              const angle = (idx / particleCount) * Math.PI * 2;
              const r = 0.02 + (idx % 4) * 0.025;
              const startY = 0.22 + (idx % 5) * 0.035;
              return (
                <mesh
                  key={idx}
                  position={[Math.cos(angle) * r, startY, Math.sin(angle) * r]}
                  userData={{ startTime: cas.startTime, startY, speed: isOil ? 0.28 : 0.42 }}
                >
                  {isSalt ? (
                    <>
                      <boxGeometry args={[0.006, 0.006, 0.006]} />
                      <meshBasicMaterial color="#ffffff" transparent opacity={0.95} />
                    </>
                  ) : isOil ? (
                    <>
                      <sphereGeometry args={[0.007, 8, 8]} />
                      <meshBasicMaterial color="#eab308" transparent opacity={0.9} />
                    </>
                  ) : (
                    <>
                      <coneGeometry args={[0.006, 0.015, 4]} />
                      <meshBasicMaterial color="#16a34a" transparent opacity={0.9} />
                    </>
                  )}
                </mesh>
              );
            })}
          </group>
        );
      })}
    </group>
  );
};

const isArchitecturalFloorOrWall = (e: EntitySpec): boolean => {
  const id = (e.id || '').toLowerCase();
  const name = (e.name || '').toLowerCase();
  const assetId = (e.visuals?.assetId || '').toLowerCase();
  if (
    name.includes('console') || name.includes('parasol') || name.includes('tournesol') ||
    name.includes('boussole') || id.includes('console') || assetId.includes('console') ||
    name.includes('au sol') || name.includes('du sol') || name.includes('sur le sol') || name.includes('tapis')
  ) {
    return false;
  }
  return (
    id === 'ground' || id === 'floor' || id === 'ceiling' || id === 'plafond' || id === 'sol' ||
    id.startsWith('sol_') || id.endsWith('_sol') || id.startsWith('ground_') || id.endsWith('_ground') || id.startsWith('floor_') || id.endsWith('_floor') ||
    id.startsWith('mur') || id.endsWith('mur') || id.includes('_mur_') || id.includes('-mur-') || id === 'mur' ||
    id.includes('wall') ||
    name.startsWith('sol ') || name === 'sol' ||
    name.startsWith('dalle de sol') || name.startsWith('plancher') ||
    name.startsWith('mur ') || name.endsWith(' mur') || name.includes(' mur ') || name === 'mur' ||
    name.includes('plafond') ||
    name.includes('baie vitrée') || name.includes('baie panoramique') || name.includes('coupole')
  );
};

const isInteractivePropOrFood = (e: EntitySpec): boolean => {
  if (isArchitecturalFloorOrWall(e)) return false;
  if (e.capabilities.some(c => c.type === 'draggable')) return true;
  if (e.capabilities.some(c => c.type === 'web_screen')) return true;

  const id = (e.id || '').toLowerCase();
  const name = (e.name || '').toLowerCase();
  const assetId = (e.visuals?.assetId || '').toLowerCase();

  // Never treat tables, counters, showrooms, podiums or displays as small food/props
  if (
    name.includes('table') || name.includes('comptoir') || name.includes('îlot') || name.includes('ilot') ||
    name.includes('présentoir') || name.includes('presentoir') || name.includes('vitrine') ||
    name.includes('podium') || name.includes('showroom') || name.includes('plan de travail')
  ) {
    return false;
  }

  const keywords = [
    'beurre', 'butter', 'carotte', 'carrot', 'tomate', 'tomato', 'oignon', 'onion',
    'ail', 'garlic', 'courgette', 'zucchini', 'fromage', 'cheese', 'pain', 'bread',
    'baguette', 'croissant', 'brioche', 'gateau', 'gâteau', 'cake', 'marbré',
    'tarte', 'macaron', 'eclair', 'éclair', 'pomme', 'apple', 'poire', 'pear', 'orange',
    'citron', 'lemon', 'fraise', 'strawberry', 'raisin', 'grape', 'sel', 'salt',
    'poivre', 'pepper', 'huile', 'oil', 'vinaigre', 'vinegar', 'vin', 'wine',
    'oeuf', 'œuf', 'egg', 'miel', 'honey', 'lait', 'milk', 'farine', 'flour',
    'viande', 'meat', 'boeuf', 'bœuf', 'beef', 'poulet', 'chicken', 'chocolat', 'chocolate',
    'champignon', 'mushroom', 'herbe', 'herb', 'bouquet', 'thym', 'laurier', 'persil',
    'basilic', 'romarin', 'echalote', 'échalote', 'assiette', 'plate', 'bol', 'bowl',
    'tasse', 'cup', 'mug', 'verre', 'glass', 'flute', 'flûte', 'carafe', 'couteau',
    'knife', 'fourchette', 'fork', 'cuillere', 'cuillère', 'spoon', 'spatule', 'spatula',
    'fouet', 'whisk', 'louche', 'ladle', 'ecumoire', 'écumoire', 'skimmer', 'eplucheur',
    'éplucheur', 'peeler', 'rape', 'râpe', 'grater', 'rouleau', 'rolling', 'saliere',
    'salière', 'poivriere', 'poivrière', 'cocotte', 'poele', 'poêle', 'pan', 'casserole',
    'pot', 'wok', 'marmite', 'bouilloire', 'kettle', 'grille-pain', 'toaster', 'mixeur',
    'blender', 'livre', 'book', 'journal', 'cahier', 'classeur', 'dossier',
    'microscope', 'cadre', 'tableau-art', 'toile', 'art-numerique', 'peinture',
    'radio', 'vinyle', 'vinyl', 'globe', 'blueprint', 'porte-documents',
    'pion', 'pierre', 'stone', 'jeton', 'token', 'puzzle', 'target', 'cible',
    'blaster', 'cle', 'clé', 'key', 'lock', 'extincteur', 'battery', 'batterie',
    'laptop', 'ordinateur', 'terminal', 'moniteur', 'plateau de fromages', 'plateau-de-fromages'
  ];

  return keywords.some(w => id.includes(w) || name.includes(w) || assetId.includes(w));
};

const FIXED_FURNITURE_ASSETS = new Set([
  'counter', 'technical-bench', 'bench', 'wp-ilot-de-cuisine',
  'wp-bureau-individuel', 'pedestal', 'sofa', 'wp-table-haute-de-reunion',
  'coffee-table', 'meeting-table', 'desk', 'workbench', 'shelf', 'reception-desk',
  'wp-presentoir-luxe', 'wp-vitrine-luxe', 'lv_marble_counter', 'lv_glass_showcase',
  'wp-plan-patisserie', 'wp-four-patisserie', 'pastry_marble_table', 'pastry_oven',
  'wp-supercar-showroom', 'demo_supercar', 'wp-plateau-tournant', 'demo_rotating_turntable',
  'wp-borne-configurateur', 'demo_color_terminal', 'wp-baie-panoramique', 'penthouse_panoramic_window',
  'penthouse_designer_sofa', 'wp-coupole-spatiale', 'station_orbital_cupola',
  'wp-portant-a-vetements', 'lv_garment_rack',
  'wp-tapis-montage-ikea', 'ikea_work_mat', 'ikea_flatpack_box', 'ikea_assembled_shelf',
  'wp-console-level-design', 'wp-spawn-pad', 'wp-portail-victoire', 'gamedev_workbench', 'player_spawn_pad', 'victory_portal_gate'
]);

const isFixedStructuralFurniture = (e: EntitySpec): boolean => {
  if (isStaticOrStructuralEntity(e)) return true;
  if (isArchitecturalFloorOrWall(e)) return true;
  if (e.capabilities.some(c => c.type === 'trigger_zone')) return true;
  if (isInteractivePropOrFood(e)) return false;

  const id = e.id.toLowerCase();
  const name = (e.name || '').toLowerCase();
  const assetId = (e.visuals?.assetId || '').toLowerCase();

  if (FIXED_FURNITURE_ASSETS.has(assetId) || FIXED_FURNITURE_ASSETS.has(id)) return true;

  // Architectural boundary elements
  if (
    id.includes('ground') || id.includes('floor') || id.includes('ceiling') || id.includes('plafond') ||
    id.startsWith('sol') || id.endsWith('sol') || id.includes('_sol_') || id.includes('-sol-') || id === 'sol' ||
    id.startsWith('mur') || id.endsWith('mur') || id.includes('_mur_') || id.includes('-mur-') || id === 'mur' ||
    id.includes('wall') ||
    name.startsWith('sol') || name.endsWith('sol') || name.includes(' sol ') || name === 'sol' ||
    name.startsWith('mur') || name.endsWith('mur') || name.includes(' mur ') || name === 'mur' ||
    name.includes('plafond') || name.includes('plancher') ||
    name.includes('baie vitrée') || name.includes('baie panoramique') || name.includes('coupole')
  ) {
    return true;
  }

  // Large structural furniture by name or assetId (token-safe)
  return (
    assetId.includes('ilot-de-cuisine') || assetId.includes('technical-bench') ||
    assetId.includes('meeting-table') || assetId.includes('coffee-table') ||
    assetId.includes('bureau-individuel') || assetId.includes('table-haute') ||
    assetId.includes('four-patisserie') || assetId.includes('plan-patisserie') ||
    assetId.includes('supercar-showroom') || assetId.includes('plateau-tournant') ||
    assetId.includes('reception-desk') ||
    name.includes('îlot de cuisine') || name.includes('ilot de cuisine') ||
    name.includes('comptoir de vente') || name.includes('comptoir d’accueil') ||
    name.includes('table de réunion') || name.includes('table basse') ||
    name.includes('bureau d’élève') || name.includes('établi technique') ||
    name.includes('poste de travail') || name.includes('four à pâtisserie') ||
    name.includes('four encastrable') || name.includes('plan de travail') ||
    name.includes('plateau tournant') || name.includes('turntable') ||
    name.includes('présentoir commercial') ||
    name.includes('vitrine en verre') || name.includes('socle d’exposition') ||
    name.includes('supercar') || (name.includes('voiture') && !name.includes('miniature')) ||
    name.includes('configurateur') || name.includes('console holographique') ||
    (name.includes('borne') && (name.includes('teinte') || name.includes('supercar') || name.includes('couleur') || name.includes('interactive')))
  );
};

const CookwareHoverStatus: React.FC = React.memo(() => {
  const cookingHeatLevel = useWorldStore(s => s.cookingHeatLevel);
  const seasoningProfile = useWorldStore(s => s.seasoningProfile);
  const cookingDoneness = useWorldStore(s => s.cookingDoneness);
  const cookingTimerRemaining = useWorldStore(s => s.cookingTimerRemaining);
  const isCookingTimerRunning = useWorldStore(s => s.isCookingTimerRunning);

  return (
    <>
      <div className={`entity-hover-tag-status heat-${cookingHeatLevel}`}>
        <span>{cookingHeatLevel === 0 ? '❄️ Hors du feu' : cookingHeatLevel === 1 ? '🟡 Feu doux · 85°C' : cookingHeatLevel === 2 ? '🟠 Feu moyen · 100°C' : '🔥 Feu vif · 180°C'}</span>
        <span style={{ fontSize: '8.5px', opacity: 0.85 }}>• {cookingHeatLevel === 0 ? 'Arrêt' : cookingHeatLevel === 1 ? 'Mijotage' : cookingHeatLevel === 2 ? 'Frémissement' : 'Saisie'}</span>
      </div>
      {(seasoningProfile.salt > 0 || seasoningProfile.oil > 0 || seasoningProfile.herbs > 0) && (
        <div className="entity-hover-tag-status seasoning-balance">
          <span>⚖️ Assaisonnement</span>
          <span style={{ fontSize: '8.5px', opacity: 0.9 }}>
            🧂 {seasoningProfile.salt}% · 🫒 {seasoningProfile.oil}% · 🌿 {seasoningProfile.herbs}%
          </span>
        </div>
      )}
      {cookingDoneness > 0 && (
        <div className="entity-hover-tag-status doneness">
          <span>🍳 Cuisson : {Math.round(cookingDoneness)}%</span>
          <span style={{ fontSize: '8.5px', opacity: 0.9 }}>• {getCookingDonenessStage(cookingDoneness).label}</span>
        </div>
      )}
      {isCookingTimerRunning && cookingTimerRemaining !== null && (
        <div className="entity-hover-tag-status simmering">
          <span>⏱️ Minuteur : {Math.floor(cookingTimerRemaining / 60)}:{Math.floor(cookingTimerRemaining % 60).toString().padStart(2, '0')}</span>
        </div>
      )}
    </>
  );
});

const CookwareHoverActions: React.FC<{ setCameraPreset: (p: any) => void }> = React.memo(({ setCameraPreset }) => {
  const cookingHeatLevel = useWorldStore(s => s.cookingHeatLevel);
  const cycleCookingHeatLevel = useWorldStore(s => s.cycleCookingHeatLevel);
  const cookingDoneness = useWorldStore(s => s.cookingDoneness);
  const cookingTimerRemaining = useWorldStore(s => s.cookingTimerRemaining);
  const isCookingTimerRunning = useWorldStore(s => s.isCookingTimerRunning);
  const startCookingTimer = useWorldStore(s => s.startCookingTimer);
  const stopCookingTimer = useWorldStore(s => s.stopCookingTimer);
  const resetCookingProgress = useWorldStore(s => s.resetCookingProgress);

  return (
    <>
      <button
        className={`entity-hover-action-btn action-heat heat-${cookingHeatLevel}`}
        onClick={(e) => {
          e.stopPropagation();
          const next = cycleCookingHeatLevel();
          playAudioFx(next === 0 ? 'game_over' : next === 3 ? 'sizzle' : 'bubbles');
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            try {
              const patterns: number[][] = [[40], [30], [25, 30, 25], [30, 25, 30, 25, 30]];
              navigator.vibrate(patterns[next] || [30]);
            } catch (_) {}
          }
          const labels = ['Éteint (0°C)', 'Feu Doux (85°C)', 'Feu Moyen (100°C)', 'Feu Vif (180°C)'];
          useWorldStore.setState(s => ({
            warnings: [...s.warnings, `🔥 Allure de chauffe : ${labels[next]}`]
          }));
        }}
        title="Régler l'intensité thermique du feu sous la cocotte / poêle"
      >
        <span>
          {cookingHeatLevel === 0 && '⚪ Allumer le feu'}
          {cookingHeatLevel === 1 && '🟡 Feu Doux (85°C)'}
          {cookingHeatLevel === 2 && '🟠 Feu Moyen (100°C)'}
          {cookingHeatLevel === 3 && '🔥 Feu Vif (180°C)'}
        </span>
        <span className="entity-hover-badge-hint">Régler</span>
      </button>
      <button
        className={`entity-hover-action-btn action-heat ${isCookingTimerRunning ? 'heat-1' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          if (isCookingTimerRunning) {
            stopCookingTimer();
            playAudioFx('tink');
          } else {
            startCookingTimer(cookingTimerRemaining && cookingTimerRemaining > 0 ? cookingTimerRemaining : 180);
            playAudioFx('tink');
          }
        }}
        title="Minuteur de cuisson (3 minutes)"
      >
        <span>⏱️ {isCookingTimerRunning && cookingTimerRemaining !== null ? `${Math.floor(cookingTimerRemaining / 60)}:${Math.floor(cookingTimerRemaining % 60).toString().padStart(2, '0')}` : 'Minuteur 3m'}</span>
        <span className="entity-hover-badge-hint">
          {isCookingTimerRunning ? 'Pause' : 'Start'}
        </span>
      </button>
      {cookingDoneness > 0 && (
        <button
          className="entity-hover-action-btn"
          onClick={(e) => {
            e.stopPropagation();
            resetCookingProgress();
            playAudioFx('tink');
            useWorldStore.setState(s => ({
              warnings: [...s.warnings, '🔄 Progression de cuisson réinitialisée']
            }));
          }}
          title="Réinitialiser la progression de cuisson"
        >
          <span>🔄 Reset cuisson</span>
        </button>
      )}
      <button
        className="entity-hover-action-btn action-camera"
        onClick={(e) => {
          e.stopPropagation();
          setCameraPreset('cocotte');
          playAudioFx('tink');
        }}
        title="Cadrer la caméra sur la cocotte [3]"
      >
        <span>🎥 Vue Cocotte</span>
      </button>
    </>
  );
});

const EMPTY_ENTITIES: Record<string, EntitySpec> = {};
const EMPTY_PROGRESS: Record<string, number> = {};


/**
 * Halo de sélection et survol adaptatif au zoom caméra et aux dimensions réelles de l'objet.
 * - Taille minimale garantie = taille physique réelle de l'objet avec marge ergonomique.
 * - Diminue de taille de façon fluide quand l'utilisateur zoome vers l'objet.
 * - S'élargit doucement quand la caméra s'éloigne pour garantir sa visibilité à distance.
 */
export const AdaptiveSelectionHalo: React.FC<{
  entity: EntitySpec;
  scl: { x: number; y: number; z: number };
  isSelected: boolean;
  isHovered: boolean;
}> = ({ entity, scl, isSelected, isHovered }) => {
  const groupRef = React.useRef<THREE.Group>(null);
  const worldPosRef = React.useRef(new THREE.Vector3());

  // 1. Rayon minimal = taille physique réelle de l'objet dans le monde avec 15% de marge esthétique
  const baseFootprintRadius = React.useMemo(() => {
    const rawR = getEntityFootprintRadius(entity, scl);
    return Math.max(0.045, rawR * 1.15);
  }, [entity, scl]);

  useFrame(({ camera, clock }) => {
    if (!groupRef.current) return;

    // Calcul de la distance réelle entre la caméra et l'objet en coordonnées monde
    groupRef.current.getWorldPosition(worldPosRef.current);
    const cameraDist = camera.position.distanceTo(worldPosRef.current);

    // Formule ergonomique :
    // - Taille minimale : la taille physique de l'objet (baseFootprintRadius)
    // - Au zoom rapproché (caméra proche) : le cercle rétrécit progressivement et se cale
    //   exactement sur la taille minimale de l'objet (sans jamais devenir plus petit que l'objet).
    // - Au dézoom (caméra éloignée) : le cercle s'élargit doucement pour rester toujours
    //   visible et discernable à l'écran (taille angulaire minimale garantie).
    const adaptiveRadius = Math.max(baseFootprintRadius, cameraDist * 0.042);

    // Facteur d'échelle par rapport à la géométrie de base créée
    const dynamicScale = adaptiveRadius / baseFootprintRadius;

    // Respiration subtile d'animation pour l'objet sélectionné
    const pulse = isSelected ? 1 + Math.sin(clock.elapsedTime * 3) * 0.018 : 1;
    const finalScale = dynamicScale * pulse;

    // Annule la déformation due au scale parent pour conserver un cercle parfait en coordonnées monde
    groupRef.current.scale.set(
      finalScale / Math.max(0.001, scl?.x || 1),
      1,
      finalScale / Math.max(0.001, scl?.z || 1)
    );
  });

  const ringThickness = Math.max(0.012, baseFootprintRadius * 0.12);
  const outerRadius = baseFootprintRadius;
  const innerRadius = Math.max(0.01, baseFootprintRadius - ringThickness);

  return (
    <group
      ref={groupRef}
      position={[0, 0.005, 0]}
    >
      {/* Anneau lumineux externe */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[innerRadius, outerRadius, 36]} />
        <meshBasicMaterial
          color={isSelected ? '#38bdf8' : isHovered ? '#10b981' : '#64748b'}
          transparent
          opacity={isSelected ? 0.85 : isHovered ? 0.6 : 0.4}
          depthWrite={false}
        />
      </mesh>

      {/* Disque subtil d'embase interne pour l'objet sélectionné */}
      {isSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[innerRadius * 0.98, 28]} />
          <meshBasicMaterial
            color="#0284c7"
            transparent
            opacity={0.16}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
};

const EntityNode: React.FC<{ entity: EntitySpec }> = React.memo(({ entity }) => {
  const appMode = useWorldStore(s => s.appMode);
  const { camera, gl } = useThree();
  const transform = entity.capabilities.find(c => c.type === 'transform');
  const isZone = entity.capabilities.some(c => c.type === 'trigger_zone');
  const isDraggable = entity.capabilities.some(c => c.type === 'draggable');
  
  const isGamePiece = React.useMemo(() => {
    const id = (entity.id || '').toLowerCase();
    const name = (entity.name || '').toLowerCase();
    const asset = (entity.visuals?.assetId || '').toLowerCase();
    return (
      id.startsWith('puzzle_') || 
      id.startsWith('go_') || 
      id.startsWith('stone_') ||
      id.startsWith('target_') ||
      asset.includes('wp-go') ||
      asset.includes('stone') ||
      asset.includes('pion') ||
      asset.includes('pierre') ||
      name.includes('puzzle') ||
      name.includes('pierre') ||
      name.includes('stone') ||
      name.includes('pion') ||
      name.includes('jeton') ||
      name.includes('taquin') ||
      name.includes('go stone') ||
      name.includes('jeu de go') ||
      name.includes('boule')
    );
  }, [entity.id, entity.name, entity.visuals?.assetId]);

  const anyDraggableInScene = useWorldStore(s => Object.values(s.world.ir.entities).some(e => e.capabilities.some(c => c.type === 'draggable')));
  const isScreen = entity.visuals?.assetId === 'web-screen' || entity.visuals?.assetId === 'captions' || (entity.name || '').toLowerCase().includes('panneau') || (entity.name || '').toLowerCase().includes('recette') || entity.capabilities.some(c => c.type === 'web_screen');
  const isFixed = isFixedStructuralFurniture(entity);
  const isFurnitureOrSupport = React.useMemo(() => {
    if (isInteractivePropOrFood(entity)) return false;
    return Boolean(
      isFixed ||
      entity.visuals?.assetId === 'table' ||
      entity.visuals?.assetId === 'coffee-table' ||
      entity.visuals?.assetId === 'meeting-table' ||
      entity.visuals?.assetId === 'counter' ||
      entity.visuals?.assetId === 'technical-bench' ||
      entity.visuals?.assetId === 'workbench' ||
      entity.visuals?.assetId?.includes('ilot-de-cuisine') ||
      entity.visuals?.assetId?.includes('presentoir') ||
      entity.visuals?.assetId?.includes('podium') ||
      entity.visuals?.assetId?.includes('vitrine') ||
      entity.name.toLowerCase().includes('comptoir') ||
      entity.name.toLowerCase().includes('table de réunion') ||
      entity.name.toLowerCase().includes('table basse') ||
      entity.name.toLowerCase().includes('îlot') ||
      entity.name.toLowerCase().includes('ilot') ||
      entity.name.toLowerCase().includes('établi')
    );
  }, [isFixed, entity.visuals?.assetId, entity.name, entity]);
  const isMovable = !isZone && !isFixed && !isFurnitureOrSupport && (
    appMode === 'conception' 
      ? true 
      : (isScreen || isDraggable || isGamePiece || (!isFixed && !anyDraggableInScene))
  );
  
  const setSpatialContext = useWorldStore(s => s.setSpatialContext);
  const isSelected = useWorldStore(s => s.spatialContext.selectedEntityId === entity.id);
  const isPointed = useWorldStore(s => s.spatialContext.pointedEntityId === entity.id);
  const dispatch = useWorldStore(s => s.dispatch);
  const showLabels = useWorldStore(s => s.showLabels);
  const applyPatch = useWorldStore(s => s.applyPatch);
  const duplicateEntity = useWorldStore(s => s.duplicateEntity);
  const deleteEntity = useWorldStore(s => s.deleteEntity);
  const groundEntity = useWorldStore(s => s.groundEntity);
  const startPlacementMode = useWorldStore(s => s.startPlacementMode);
  const focusEntity = useWorldStore(s => s.focusEntity);
  const uiLanguage = useWorldStore(s => s.uiLanguage);
  const isFr = uiLanguage === 'fr';
  const isExploded = useWorldStore(s => !!s.explodedEntities[entity.id]);
  const selectedPartId = useWorldStore(s => isExploded ? s.selectedPartId : null);
  const setSelectedPartId = useWorldStore(s => s.setSelectedPartId);

  const isDragging3D = useWorldStore(s => s.isDragging3D);
  const isThisEntityDragging = useWorldStore(s => s.isDragging3D && s.draggedEntityId === entity.id);
  const setDragging3D = useWorldStore(s => s.setDragging3D);
  const setDraggedEntityId = useWorldStore(s => s.setDraggedEntityId);
  const setSnappedTargetId = useWorldStore(s => s.setSnappedTargetId);
  const snappedTargetId = useWorldStore(s => s.snappedTargetId);

  const [dragOffset, setDragOffset] = React.useState<{ x: number; y: number; z: number } | null>(null);
  const dragOffsetRef = React.useRef<{ x: number; y: number; z: number } | null>(null);
  const rigidBodyRef = React.useRef<RapierRigidBody>(null);
  const [showMaterialPicker, setShowMaterialPicker] = React.useState(false);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [screenDragOffset, setScreenDragOffset] = React.useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const isCardDraggingRef = React.useRef(false);
  const cardDragOriginRef = React.useRef<{ mouseX: number; mouseY: number; startX: number; startY: number }>({ mouseX: 0, mouseY: 0, startX: 0, startY: 0 });
  const gizmoMode = useWorldStore(s => s.gizmoMode);
  const cycleGizmoMode = useWorldStore(s => s.cycleGizmoMode);

  const pointerDownPos = React.useRef<{ x: number; y: number } | null>(null);
  const [isPointerPressed, setIsPointerPressed] = React.useState(false);
  const dragPlane = React.useRef<THREE.Plane | null>(null);
  const raycaster = React.useRef(new THREE.Raycaster());
  const planeIntersectOffset = React.useRef<THREE.Vector3>(new THREE.Vector3());
  const currentDragTarget = React.useRef<EntitySpec | null>(null);
  const isDraggingRef = React.useRef(false);
  const wasJustDragged = React.useRef(false);
  const showResearchDashboardModal = useWorldStore(s => s.showResearchDashboardModal);

  const normalizeCoord = (c: any, fallback: { x: number; y: number; z: number }) => {
    if (!c) return fallback;
    if (Array.isArray(c)) {
      return {
        x: typeof c[0] === 'number' && !isNaN(c[0]) ? c[0] : fallback.x,
        y: typeof c[1] === 'number' && !isNaN(c[1]) ? c[1] : fallback.y,
        z: typeof c[2] === 'number' && !isNaN(c[2]) ? c[2] : fallback.z,
      };
    }
    return {
      x: typeof c.x === 'number' && !isNaN(c.x) ? c.x : fallback.x,
      y: typeof c.y === 'number' && !isNaN(c.y) ? c.y : fallback.y,
      z: typeof c.z === 'number' && !isNaN(c.z) ? c.z : fallback.z,
    };
  };

  const rawPos = normalizeCoord(transform?.position, { x: 0, y: 0, z: 0 });
  const rawScl = normalizeCoord(transform?.scale, { x: 1, y: 1, z: 1 });
  const rot = normalizeCoord(transform?.rotation, { x: 0, y: 0, z: 0 });

  const isCustomFloorSlab = React.useMemo(() => {
    const id = (entity.id || '').toLowerCase();
    const name = (entity.name || '').toLowerCase();
    const assetId = (entity.visuals?.assetId || '').toLowerCase();
    if (
      name.includes('console') || name.includes('parasol') || name.includes('tournesol') ||
      name.includes('boussole') || id.includes('console') || assetId.includes('console') ||
      name.includes('au sol') || name.includes('du sol') || name.includes('sur le sol') || name.includes('tapis') ||
      assetId === 'wp-sol-forestier'
    ) {
      return false;
    }
    return (
      id === 'ground' || id === 'floor' || id === 'sol' ||
      id.startsWith('sol_') || id.endsWith('_sol') || id.startsWith('ground_') || id.endsWith('_ground') || id.startsWith('floor_') || id.endsWith('_floor') ||
      name.startsWith('sol ') || name === 'sol' ||
      name.startsWith('dalle de sol') || name.startsWith('plancher')
    );
  }, [entity.id, entity.name, entity.visuals?.assetId]);

  const isCalibratedDetailedModel = React.useMemo(() => hasDetailedSimulationModel(entity), [entity]);

  const pos = React.useMemo(() => {
    if (isCustomFloorSlab) {
      return { x: rawPos.x, y: Math.min(-0.015, rawPos.y), z: rawPos.z };
    }
    if (isCalibratedDetailedModel && rawPos.y < 0) {
      return { x: rawPos.x, y: 0, z: rawPos.z };
    }
    return rawPos;
  }, [rawPos.x, rawPos.y, rawPos.z, isCustomFloorSlab, isCalibratedDetailedModel]);

  const scl = React.useMemo(() => {
    if (isCustomFloorSlab) {
      return { x: Math.max(4, rawScl.x), y: Math.min(0.02, Math.max(0.005, rawScl.y)), z: Math.max(4, rawScl.z) };
    }
    if (isCalibratedDetailedModel) {
      // Calibrated 1:1 procedural models (VictoriaVRSupercar, HolographicCarConfigurator, etc.)
      // should never be squashed when LLM passes bounding-box dimensions in scale
      const isNonUniform = Math.abs(rawScl.x - rawScl.y) > 0.05 || Math.abs(rawScl.z - rawScl.y) > 0.05;
      if (isNonUniform || rawScl.y < 0.6 || rawScl.y > 2.5) {
        return { x: 1, y: 1, z: 1 };
      }
    }
    return rawScl;
  }, [rawScl.x, rawScl.y, rawScl.z, isCustomFloorSlab, isCalibratedDetailedModel]);

  const position = React.useMemo(() => new THREE.Vector3(pos.x, pos.y, pos.z), [pos.x, pos.y, pos.z]);
  const scale = React.useMemo(() => new THREE.Vector3(scl.x, scl.y, scl.z), [scl.x, scl.y, scl.z]);
  const rotationTuple = React.useMemo(() => [rot.x, rot.y, rot.z] as [number, number, number], [rot.x, rot.y, rot.z]);

  const isHovered = useWorldStore(s => s.hoveredEntityId === entity.id);
  const setHoveredEntityId = useWorldStore(s => s.setHoveredEntityId);
  const hoverGraceTimerRef = React.useRef<any>(null);

  const handleMeshPointerOver = (e: any) => {
    if (isCustomFloorSlab && appMode === 'simulation') return;
    e.stopPropagation();
    if (hoverGraceTimerRef.current) clearTimeout(hoverGraceTimerRef.current);
    setHoveredEntityId(entity.id);
  };

  const handleMeshPointerOut = () => {
    if (hoverGraceTimerRef.current) clearTimeout(hoverGraceTimerRef.current);
    hoverGraceTimerRef.current = setTimeout(() => {
      if (useWorldStore.getState().hoveredEntityId === entity.id) {
        setHoveredEntityId(null);
      }
    }, 120);
  };

  const handleBadgePointerEnter = () => {
    if (hoverGraceTimerRef.current) clearTimeout(hoverGraceTimerRef.current);
    setHoveredEntityId(entity.id);
  };

  const handleBadgePointerLeave = () => {
    if (hoverGraceTimerRef.current) clearTimeout(hoverGraceTimerRef.current);
    hoverGraceTimerRef.current = setTimeout(() => {
      if (useWorldStore.getState().hoveredEntityId === entity.id) {
        setHoveredEntityId(null);
      }
    }, 120);
  };
  const rules = useWorldStore(s => s.world.ir.rules);

  React.useEffect(() => {
    if (isThisEntityDragging) {
      document.body.style.cursor = 'grabbing';
      return () => { document.body.style.cursor = 'auto'; };
    } else if (isHovered && isMovable) {
      document.body.style.cursor = 'grab';
      return () => { document.body.style.cursor = 'auto'; };
    } else if (isHovered && !isFurnitureOrSupport && !isZone) {
      document.body.style.cursor = 'pointer';
      return () => { document.body.style.cursor = 'auto'; };
    }
  }, [isThisEntityDragging, isHovered, isMovable, isFurnitureOrSupport, isZone]);

  const handlePointerDown = (e: any) => {
    setIsPointerPressed(true);

    const onPointerRelease = () => {
      setIsPointerPressed(false);
      window.removeEventListener('pointerup', onPointerRelease);
      window.removeEventListener('pointercancel', onPointerRelease);
    };
    window.addEventListener('pointerup', onPointerRelease, { once: true });
    window.addEventListener('pointercancel', onPointerRelease, { once: true });

    const canDragImmediately = isMovable;
    if (!canDragImmediately) {
      return;
    }
    e.stopPropagation();
    const cx = e.clientX ?? e.nativeEvent?.clientX ?? 0;
    const cy = e.clientY ?? e.nativeEvent?.clientY ?? 0;
    pointerDownPos.current = { x: cx, y: cy };
    isDraggingRef.current = false;

    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -pos.y);
    dragPlane.current = plane;

    const intersect = new THREE.Vector3();
    if (e.ray && e.ray.intersectPlane(plane, intersect)) {
      planeIntersectOffset.current.copy(position).sub(intersect);
    } else {
      planeIntersectOffset.current.set(0, 0, 0);
    }

    const onWindowPointerMove = (evt: PointerEvent) => {
      if (!pointerDownPos.current) return;
      const dist = Math.hypot(evt.clientX - pointerDownPos.current.x, evt.clientY - pointerDownPos.current.y);

      if (dist > 5) {
        if (!isDraggingRef.current) {
          isDraggingRef.current = true;
          setDragging3D(true);
          setDraggedEntityId(entity.id);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('worldpilot_lock_camera_controls', { detail: { locked: true } }));
          }
          playAudioFx('switch_click');
        }

        const rect = gl.domElement.getBoundingClientRect();
        const ndcX = ((evt.clientX - rect.left) / rect.width) * 2 - 1;
        const ndcY = -((evt.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.current.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);

        const entitiesMap = useWorldStore.getState().world.ir.entities;
        const allEntities = Object.values(entitiesMap);

        // Détection par lancer de rayon contre les plans des surfaces de support du monde
        let worldX = 0;
        let worldZ = 0;
        let detectedSurfaceY = 0;
        let hasHit = false;

        const isDraggingFloor = isFloorFurniture(entity);
        if (isDraggingFloor) {
          const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
          const hit = new THREE.Vector3();
          if (raycaster.current.ray.intersectPlane(groundPlane, hit)) {
            worldX = hit.x;
            worldZ = hit.z;
            detectedSurfaceY = 0;
            hasHit = true;
          }
        } else {
          const supports = allEntities.filter(e => e.id !== entity.id && isSupportEntity(e));
          for (const sup of supports) {
            const sPos = sup.capabilities.find(c => c.type === 'transform')?.position;
            if (!sPos) continue;
            const supHeight = getSupportingSurfaceHeight(sPos.x, sPos.z, entitiesMap, entity.id);
            const planeY = supHeight.surfaceY > 0 ? supHeight.surfaceY : (sPos.y > 0.6 ? sPos.y : 0.912);

            const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -planeY);
            const hit = new THREE.Vector3();
            if (raycaster.current.ray.intersectPlane(plane, hit)) {
              const check = getSupportingSurfaceHeight(hit.x, hit.z, entitiesMap, entity.id);
              if (check.supportEntity?.id === sup.id) {
                worldX = hit.x;
                worldZ = hit.z;
                detectedSurfaceY = check.surfaceY;
                hasHit = true;
                break;
              }
            }
          }

          if (!hasHit) {
            const fallbackPlane = dragPlane.current || new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
            const hit = new THREE.Vector3();
            if (raycaster.current.ray.intersectPlane(fallbackPlane, hit)) {
              worldX = hit.x + (planeIntersectOffset.current?.x || 0);
              worldZ = hit.z + (planeIntersectOffset.current?.z || 0);
              const check = getSupportingSurfaceHeight(worldX, worldZ, entitiesMap, entity.id);
              if (!check.isGround && check.supportEntity) {
                detectedSurfaceY = check.surfaceY;
              } else {
                detectedSurfaceY = 0;
              }
              hasHit = true;
            }
          }
        }

        if (hasHit) {
          // Recherche de cibles d'aimantation causale ou de récipients (cocottes, poêles, planches, assiettes)
          let snappedTarget: EntitySpec | null = null;
          let snapTargetPos: { x: number; y: number; z: number } | null = null;
          let minSnapDist = 0.42;

          const affordance = findNearestCausalityAffordance(entity, allEntities, { x: worldX, y: detectedSurfaceY || pos.y, z: worldZ }, 0.44);

          if (affordance) {
            snappedTarget = affordance.targetEntity;
            snapTargetPos = affordance.snapPosition;
          } else {
            const isGoStone = isGamePiece && (
              entity.id.startsWith('go_stone') ||
              entity.name.toLowerCase().includes('pierre') ||
              entity.visuals?.assetId?.includes('pierre') ||
              entity.visuals?.assetId?.includes('wp-go')
            );

            const potentialTargets = allEntities.filter(other =>
              other.id !== entity.id &&
              (
                other.capabilities.some(c => c.type === 'trigger_zone') ||
                other.id === 'car_sedan_1' ||
                other.id.toLowerCase().includes('car_') ||
                other.id.toLowerCase().includes('voiture') ||
                other.name?.toLowerCase().includes('voiture') ||
                other.name?.toLowerCase().includes('car') ||
                other.visuals?.assetId?.includes('voiture') ||
                other.visuals?.assetId?.includes('automobile') ||
                other.id === 'goban_table' ||
                other.name?.toLowerCase().includes('goban') ||
                other.visuals?.assetId?.includes('goban') ||
                other.visuals?.assetId?.includes('planche') ||
                other.name?.toLowerCase().includes('planche') ||
                other.visuals?.assetId?.includes('cocotte') ||
                other.name?.toLowerCase().includes('cocotte') ||
                other.visuals?.assetId?.includes('poele') ||
                other.name?.toLowerCase().includes('poele') ||
                other.visuals?.assetId?.includes('marmite') ||
                other.name?.toLowerCase().includes('marmite') ||
                other.visuals?.assetId?.includes('assiette') ||
                other.name?.toLowerCase().includes('assiette')
              )
            );

            for (const target of potentialTargets) {
              const tPos = target.capabilities.find(c => c.type === 'transform')?.position;
              if (tPos) {
                const isGoban = target.id === 'goban_table' || target.name?.toLowerCase().includes('goban') || target.visuals?.assetId?.includes('goban');
                const isCar = target.id === 'car_sedan_1' || target.id.toLowerCase().includes('car_') || target.name?.toLowerCase().includes('voiture') || target.visuals?.assetId?.includes('voiture');
                const zoneCap = target.capabilities.find(c => c.type === 'trigger_zone');
                const zoneReach = zoneCap?.radius ? Math.min(0.85, Math.max(0.42, zoneCap.radius)) : minSnapDist;
                const reachDist = (isGoban && isGoStone) ? 0.65 : isCar ? 2.2 : Math.max(minSnapDist, zoneReach);
                const d = Math.hypot(worldX - tPos.x, worldZ - tPos.z);
                if (d < reachDist) {
                  minSnapDist = d;
                  snappedTarget = target;
                  snapTargetPos = isCar ? { x: tPos.x + 0.42, y: tPos.y + 0.85, z: tPos.z + 1.12 } : tPos;
                }
              }
            }
          }

          if (snappedTarget && snapTargetPos) {
            const isTargetGoban = snappedTarget.id === 'goban_table' || snappedTarget.name?.toLowerCase().includes('goban') || snappedTarget.visuals?.assetId?.includes('goban');
            if (currentDragTarget.current?.id !== snappedTarget.id) {
              playAudioFx(isTargetGoban ? 'impact_stone' : 'snap_connect', { x: snapTargetPos.x, y: snapTargetPos.y, z: snapTargetPos.z });
            }
            currentDragTarget.current = snappedTarget;
            setSnappedTargetId(snappedTarget.id);

            const isTargetCar = snappedTarget.id === 'car_sedan_1' || snappedTarget.id.toLowerCase().includes('car_') || snappedTarget.name?.toLowerCase().includes('voiture');
            const isTargetCocotte = snappedTarget.visuals?.assetId?.includes('cocotte') || snappedTarget.name?.toLowerCase().includes('cocotte');
            const isTargetPoele = snappedTarget.visuals?.assetId?.includes('poele') || snappedTarget.name?.toLowerCase().includes('poele');
            const isTargetZone = snappedTarget.capabilities.some(c => c.type === 'trigger_zone');
            const snapLift = isTargetGoban ? 0.015 : isTargetCar ? 0.02 : isTargetCocotte ? 0.08 : (isTargetPoele ? 0.05 : 0.04);
            const baseSnapY = detectedSurfaceY > 0 ? detectedSurfaceY : (isTargetZone ? snapTargetPos.y : (snapTargetPos.y > 0.6 ? snapTargetPos.y : 0.912));
            const targetY = baseSnapY + snapLift;

            let snapX = snapTargetPos.x;
            let snapZ = snapTargetPos.z;
            if (isTargetGoban) {
              const gbScl = snappedTarget.capabilities.find(c => c.type === 'transform')?.scale || { x: 1.05, y: 0.12, z: 1.05 };
              const spacing = (gbScl.x * 0.80) / 8;
              const col = Math.round((worldX - snapTargetPos.x) / spacing);
              const row = Math.round((worldZ - snapTargetPos.z) / spacing);
              const clampedCol = Math.max(-4, Math.min(4, col));
              const clampedRow = Math.max(-4, Math.min(4, row));
              snapX = Number((snapTargetPos.x + clampedCol * spacing).toFixed(3));
              snapZ = Number((snapTargetPos.z + clampedRow * spacing).toFixed(3));
            }

            const newOffset = {
              x: snapX - pos.x,
              y: targetY - pos.y,
              z: snapZ - pos.z
            };
            dragOffsetRef.current = newOffset;
            setDragOffset(newOffset);
          } else {
            if (currentDragTarget.current) {
              playAudioFx('snap_release', { x: worldX, y: pos.y, z: worldZ });
              setSnappedTargetId(null);
            }
            currentDragTarget.current = null;
            const desiredY = detectedSurfaceY > 0 ? (detectedSurfaceY + 0.04) : (Math.max(0, pos.y) + 0.05);
            const newOffset = {
              x: worldX - pos.x,
              y: desiredY - pos.y,
              z: worldZ - pos.z
            };
            dragOffsetRef.current = newOffset;
            setDragOffset(newOffset);
          }
        }
      }
    };

    const onWindowPointerUp = () => {
      setIsPointerPressed(false);
      window.removeEventListener('pointermove', onWindowPointerMove);
      window.removeEventListener('pointerup', onWindowPointerUp);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('worldpilot_lock_camera_controls', { detail: { locked: false } }));
      }

      if (isDraggingRef.current) {
        wasJustDragged.current = true;
        setTimeout(() => { wasJustDragged.current = false; }, 150);

        setDragging3D(false);
        setDraggedEntityId(null);
        setSnappedTargetId(null);
        isDraggingRef.current = false;

        const snapped = currentDragTarget.current;
        if (snapped) {
          const sPos = snapped.capabilities.find(c => c.type === 'transform')?.position || { x: 0, y: 0.9, z: 0 };
          const isTargetCar = snapped.id === 'car_sedan_1' || snapped.id.toLowerCase().includes('car_') || snapped.name?.toLowerCase().includes('voiture');
          const isTargetGoban = snapped.id === 'goban_table' || snapped.name?.toLowerCase().includes('goban') || snapped.visuals?.assetId?.includes('goban');
          const isTargetCocotte = snapped.visuals?.assetId?.includes('cocotte') || snapped.name?.toLowerCase().includes('cocotte');
          const isTargetPoele = snapped.visuals?.assetId?.includes('poele') || snapped.name?.toLowerCase().includes('poele');
          const isTargetBoard = snapped.visuals?.assetId?.includes('planche') || snapped.name?.toLowerCase().includes('planche');
          const isTargetPodium = snapped.visuals?.assetId?.includes('podium') || snapped.name?.toLowerCase().includes('podium') || snapped.id.toLowerCase().includes('podium');

          const snapLift = isTargetGoban ? 0.015 : isTargetCar ? 0.82 : isTargetCocotte ? 0.08 : (isTargetPoele ? 0.05 : isTargetPodium ? 0.04 : 0.04);
          let finalX = isTargetCar ? Number((sPos.x + 0.42).toFixed(3)) : sPos.x;
          let finalZ = isTargetCar ? Number((sPos.z + 1.12).toFixed(3)) : sPos.z;

          if (isTargetGoban) {
            const gbScl = snapped.capabilities.find(c => c.type === 'transform')?.scale || { x: 1.05, y: 0.12, z: 1.05 };
            const spacing = (gbScl.x * 0.80) / 8;
            const curOff = dragOffsetRef.current;
            const curX = pos.x + (curOff?.x || 0);
            const curZ = pos.z + (curOff?.z || 0);
            const col = Math.round((curX - sPos.x) / spacing);
            const row = Math.round((curZ - sPos.z) / spacing);
            const clampedCol = Math.max(-4, Math.min(4, col));
            const clampedRow = Math.max(-4, Math.min(4, row));
            finalX = Number((sPos.x + clampedCol * spacing).toFixed(3));
            finalZ = Number((sPos.z + clampedRow * spacing).toFixed(3));
          }

          const isTargetZone = snapped.capabilities.some(c => c.type === 'trigger_zone');
          const supHeight = getSupportingSurfaceHeight(finalX, finalZ, useWorldStore.getState().world.ir.entities, entity.id);
          const baseSupportY = supHeight.surfaceY > 0 ? supHeight.surfaceY : (isTargetZone ? sPos.y : (sPos.y > 0.6 ? sPos.y : 0.912));
          const finalY = Number((baseSupportY + snapLift).toFixed(3));

          if (rigidBodyRef.current) {
            try {
              rigidBodyRef.current.setTranslation({ x: finalX, y: finalY, z: finalZ }, true);
            } catch (_) {}
          }

          const isDroppedUtensil = 
            entity.visuals?.assetId?.includes('spatule') ||
            entity.visuals?.assetId?.includes('fouet') ||
            entity.id.toLowerCase().includes('spatule') ||
            entity.id.toLowerCase().includes('fouet') ||
            entity.id.toLowerCase().includes('cuillere');

          const isTargetPlate = snapped.visuals?.assetId?.includes('assiette') || snapped.name?.toLowerCase().includes('assiette');
          const isKnifeEntity = entity.visuals?.assetId?.includes('couteau') || entity.id.toLowerCase().includes('couteau');

          const affordance = evaluateSpatialCausality(entity, snapped);

          if (isTargetGoban || isGamePiece) {
            playAudioFx('impact_stone', { x: finalX, y: finalY, z: finalZ });
          } else if (affordance) {
            playAudioFx(affordance.sound, { x: finalX, y: finalY, z: finalZ });
            if (affordance.particleType === 'chop' && typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('worldpilot_chop_action', { detail: { knifeId: entity.id } }));
            }
          } else if (isTargetCocotte || isTargetPoele) {
            playAudioFx('sizzle_cook', { x: finalX, y: finalY, z: finalZ });
            playAudioFx('bubbles', { x: finalX, y: finalY, z: finalZ });
            if (isDroppedUtensil) {
              playAudioFx('stir_whisk', { x: finalX, y: finalY, z: finalZ });
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('worldpilot_stir_cookware', {
                  detail: { utensilId: entity.id, cookwareId: snapped.id, timestamp: Date.now() }
                }));
              }
            }
          } else if (isTargetBoard) {
            playAudioFx('knife_chop');
            if (isKnifeEntity && typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('worldpilot_chop_action', { detail: { knifeId: entity.id } }));
            }
          } else if (isTargetPlate) {
            setIsDishPlated(true);
            playAudioFx('chime');
            playAudioFx('sparkle');
          } else {
            playAudioFx('chime');
          }

          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            try { navigator.vibrate([15, 30, 15]); } catch (_) {}
          }

          const impactType = affordance?.particleType || (isTargetCocotte || isTargetPoele ? 'splash' : isTargetBoard ? 'chop' : isTargetPlate ? 'sparkle' : 'chime');

          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('worldpilot_drop_impact', {
              detail: {
                x: finalX,
                y: finalY,
                z: finalZ,
                type: impactType
              }
            }));
          }

          dispatch({
            type: 'DROP',
            sourceId: entity.id,
            targetId: snapped.id
          });

          // Déclenchement des effets causaux physiques réels
          if (affordance) {
            useWorldStore.setState(s => ({
              warnings: [...s.warnings.slice(-3), affordance.toastMessage]
            }));

            if (affordance.type === 'slice_chop') {
              useWorldStore.getState().chopIngredient(snapped.id);
              useWorldStore.getState().chopIngredient(entity.id);
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('worldpilot_chop_action', { detail: { knifeId: entity.id } }));
              }
            } else if (affordance.type === 'cook_simmer') {
              if (useWorldStore.getState().cookingHeatLevel === 0) {
                useWorldStore.getState().setCookingHeatLevel(1);
              }
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('worldpilot_stir_cookware', { detail: { utensilId: entity.id } }));
              }
            } else if (affordance.type === 'pour_liquid') {
              playAudioFx('pour_water', { x: finalX, y: finalY, z: finalZ });
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('worldpilot_pour_seasoning', { detail: { entityId: entity.id } }));
                window.dispatchEvent(new CustomEvent('worldpilot_pour_liquid', { detail: { sourceId: entity.id, targetId: snapped.id } }));
              }
            } else if (affordance.type === 'ignite_fire') {
              playAudioFx('ignite_fire', { x: finalX, y: finalY, z: finalZ });
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('worldpilot_ignite_fire', {
                  detail: { sourceId: entity.id, targetId: snapped.id, x: finalX, y: finalY, z: finalZ }
                }));
              }
            } else if (affordance.type === 'read_study') {
              playAudioFx('paper_turn', { x: finalX, y: finalY, z: finalZ });
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('worldpilot_read_study', {
                  detail: { sourceId: entity.id, targetId: snapped.id, x: finalX, y: finalY, z: finalZ }
                }));
              }
            } else if (affordance.type === 'unlock_circuit') {
              playAudioFx('switch_click', { x: finalX, y: finalY, z: finalZ });
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('worldpilot_unlock_mechanism', {
                  detail: { sourceId: entity.id, targetId: snapped.id, x: finalX, y: finalY, z: finalZ }
                }));
              }
            } else if (affordance.type === 'stack_contain') {
              playAudioFx('chime', { x: finalX, y: finalY, z: finalZ });
            }
          }

          applyPatch({
            entitiesChanged: [{
              id: entity.id,
              capabilities: entity.capabilities.map(c => c.type === 'transform' ? {
                ...c,
                position: { x: finalX, y: finalY, z: finalZ }
              } : c)
            }]
          }, `Poser ${entity.name} sur ${snapped.name}`, {});

          const toastMsg = affordance?.toastMessage || (isTargetGoban
            ? `⚪ Coup joué au Go ! ${entity.name} posée sur l'intersection du Goban.`
            : (isTargetCocotte || isTargetPoele
              ? `🥘 ${entity.name} plonge dans ${snapped.name} : mijotage et fusion des saveurs !`
              : (isTargetBoard
                ? `🔪 ${entity.name} prêt(e) sur ${snapped.name} pour être émincé(e) !`
                : `✨ ${entity.name} déposé(e) avec succès sur ${snapped.name} !`)));

          useWorldStore.setState(s => ({
            warnings: [...s.warnings, toastMsg]
          }));
        } else {
          const currentOffset = dragOffsetRef.current;
          if (currentOffset) {
            const finalX = Number((pos.x + currentOffset.x).toFixed(3));
            const finalZ = Number((pos.z + currentOffset.z).toFixed(3));
            const surfaceInfo = getSupportingSurfaceHeight(finalX, finalZ, useWorldStore.getState().world.ir.entities, entity.id);
            const isFloorItem = isFloorFurniture(entity);
            const contactLift = surfaceInfo.isGround ? 0 : 0.028;
            const finalY = isFloorItem
              ? 0 
              : (surfaceInfo.isGround ? 0 : Number((surfaceInfo.surfaceY + contactLift).toFixed(3)));

            if (rigidBodyRef.current) {
              try {
                rigidBodyRef.current.setTranslation({ x: finalX, y: finalY, z: finalZ }, true);
              } catch (_) {}
            }
            let dropSound: SoundEffect = 'soft_drop';
            if (isGamePiece || entity.name?.toLowerCase().includes('pierre')) {
              dropSound = 'impact_stone';
            } else if (surfaceInfo.supportEntity) {
              const sName = (surfaceInfo.supportEntity.name || '').toLowerCase();
              const sAsset = (surfaceInfo.supportEntity.visuals?.assetId || '').toLowerCase();
              if (sName.includes('table') || sName.includes('planche') || sAsset.includes('table') || sAsset.includes('board') || sAsset.includes('oak')) {
                dropSound = 'impact_wood';
              } else if (sName.includes('comptoir') || sName.includes('bar') || sName.includes('inox') || sName.includes('four') || sAsset.includes('stove') || sAsset.includes('counter')) {
                dropSound = 'impact_metal';
              } else if (sName.includes('assiette') || sName.includes('podium') || sName.includes('marbre') || sAsset.includes('plate') || sAsset.includes('podium')) {
                dropSound = 'impact_stone';
              } else {
                dropSound = 'impact_wood';
              }
            } else {
              dropSound = 'soft_drop';
            }
            playAudioFx(dropSound, { x: finalX, y: finalY, z: finalZ });
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('worldpilot_drop_impact', {
                detail: { x: finalX, y: finalY, z: finalZ, type: 'chime' }
              }));
            }
            applyPatch({
              entitiesChanged: [{
                id: entity.id,
                capabilities: entity.capabilities.map(c => c.type === 'transform' ? {
                  ...c,
                  position: { x: finalX, y: finalY, z: finalZ }
                } : c)
              }]
            }, `Déplacer ${entity.name}`, {});
            const currentEntities = Object.values(useWorldStore.getState().world.ir.entities);
            const nearbyTarget = currentEntities.find((other: EntitySpec) => {
              if (other.id === entity.id || isFloorFurniture(other)) return false;
              const oPos = other.capabilities?.find(c => c.type === 'transform')?.position;
              if (!oPos) return false;
              const dist = Math.hypot(finalX - oPos.x, finalZ - oPos.z);
              const maxDist = (other.id === 'car_sedan_1' || other.id.toLowerCase().includes('voiture')) ? 2.8 : 1.5;
              return dist <= maxDist;
            });

            if (nearbyTarget) {
              useWorldStore.getState().recordUnanticipatedUserGesture?.(
                entity.id,
                nearbyTarget.id,
                'STRIKE',
                {
                  spatialDistance: 0.15,
                  approachVelocity: 0.25,
                  gazeDwellMs: 350,
                }
              );
              useWorldStore.getState().recordUserActionAttempt?.({
                sourceId: entity.id,
                targetId: nearbyTarget.id,
                actionType: 'drop',
                wasProductive: false,
                context: 'proximity_unanticipated_drop'
              });
            } else {
              useWorldStore.getState().recordUserActionAttempt?.({
                sourceId: entity.id,
                actionType: 'drop',
                wasProductive: true,
                context: 'free_move'
              });
            }
          }
        }

        dragOffsetRef.current = null;
        setDragOffset(null);
        currentDragTarget.current = null;
        setDragging3D(false);
        setDraggedEntityId(null);
      } else {
        setDragging3D(false);
        setDraggedEntityId(null);
        dragOffsetRef.current = null;
        setDragOffset(null);
      }
      isDraggingRef.current = false;
      pointerDownPos.current = null;
      setIsPointerPressed(false);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('worldpilot_lock_camera_controls', { detail: { locked: false } }));
        window.removeEventListener('pointermove', onWindowPointerMove);
        window.removeEventListener('pointerup', onWindowPointerUp);
        window.removeEventListener('pointercancel', onWindowPointerUp);
        window.removeEventListener('blur', onWindowPointerUp);
      }
    };

    window.addEventListener('pointermove', onWindowPointerMove);
    window.addEventListener('pointerup', onWindowPointerUp);
    window.addEventListener('pointercancel', onWindowPointerUp);
    window.addEventListener('blur', onWindowPointerUp);
  };

  const quests = useWorldStore(s => s.world.ir.quests);
  const activeQuestId = useWorldStore(s => s.world.ir.activeQuestId);
  const activeQuest = React.useMemo(() => {
    if (!quests) return null;
    const qId = activeQuestId || Object.keys(quests)[0];
    return qId ? quests[qId] : null;
  }, [quests, activeQuestId]);

  const currentQuestStep = React.useMemo(() => {
    if (!activeQuest || activeQuest.status === 'completed') return null;
    return activeQuest.steps[activeQuest.currentStepIndex] || null;
  }, [activeQuest]);

  const isQuestTarget = React.useMemo(() => {
    if (!currentQuestStep) return false;
    if (currentQuestStep.targetEntityId === entity.id || currentQuestStep.targetZoneId === entity.id) {
      return true;
    }
    if (currentQuestStep.requiredEvent && currentQuestStep.requiredEvent.includes(':')) {
      const parts = currentQuestStep.requiredEvent.split(':');
      if (parts[1] === entity.id || parts[2] === entity.id) return true;
    }
    return false;
  }, [currentQuestStep, entity.id]);

  const interactRule = React.useMemo(() => {
    return Object.values(rules).find(r => 
      r.trigger === 'INTERACT' && r.conditions?.some((c: any) => c.type === 'is_source' && c.sourceId === entity.id)
    );
  }, [rules, entity.id]);

  const isWebScreen = entity.visuals?.assetId === 'web-screen' || 
    entity.visuals?.assetId === 'wall-screen' || 
    entity.capabilities.some(c => c.type === 'web_screen' || (c.type === 'educational' && c.url)) ||
    (entity.visuals?.assetId === 'captions' && (entity.id.includes('recipe') || entity.capabilities.some(c => c.url)));

  const aid = (entity.visuals?.assetId || '').toLowerCase().trim();

  // RÈGLE D'OR : Les modèles spécialisés interactifs sont activés STRICTEMENT par assetId ou capacité,
  // JAMAIS par une recherche par mot-clé (regex) sur le nom français de l'objet !
  const isBook = aid === 'book' || aid === 'wp-livre' || aid === 'wp-livre-interactif' || aid === 'wp-guide-mycologie' || aid === 'wp-livre-champignons';

  const isMicroscope = aid === 'microscope' || aid === 'wp-microscope' || aid === 'wp-microscope-laboratoire';

  const isComputer = !isMicroscope && (aid === 'laptop' || aid === 'wp-ordinateur-portable' || aid === 'computer' || aid === 'facilitator-laptop');

  const isPainting = aid === 'wp-cadre-art-numerique' || aid === 'painting' || aid === 'wp-toile-art';

  const isMusicPlayer = aid === 'wp-gramophone' || aid === 'phonograph' || aid === 'audio-player' || aid === 'wp-synthetiseur';

  const isGlobe = aid === 'globe' || aid === 'wp-globe' || aid === 'wp-globe-terrestre';

  const isBlueprint = aid === 'wp-porte-documents' || aid === 'blueprint' || aid === 'wp-plan-technique';

  const isAudio = aid === 'audio' || entity.capabilities.some(c => c.type === 'audio_emitter');
  const quizCap = entity.capabilities.find(c => c.type === 'educational' && c.correctAnswer);
  const isQuiz = aid === 'quiz' || !!quizCap;

  const hasInteraction = !!interactRule || isQuestTarget || isAudio || isQuiz || isWebScreen || isBook || isComputer || isPainting || isMusicPlayer || isGlobe || isBlueprint || isMicroscope;

  const actionLabel = React.useMemo(() => {
    if (isBook) return '📖 Lire le doc';
    if (isComputer) return '💻 Ouvrir Terminal';
    if (isPainting) return '🎨 Œuvre d’Art';
    if (isMusicPlayer) return '📻 Radio Spatiale';
    if (isGlobe) return '🌍 Atlas Mondial';
    if (isBlueprint) return '📁 Plans CAO';
    if (isMicroscope) return '🔬 Examiner';
    if (isWebScreen) return '🌐 Fiche Web';
    if (isAudio) return '🔊 Astuce du Chef';
    if (isQuiz) return '🎓 Quiz';
    if (isQuestTarget && currentQuestStep) {
      return `🎯 ${currentQuestStep.title.length > 20 ? currentQuestStep.title.slice(0, 18) + '…' : currentQuestStep.title}`;
    }
    if (!interactRule) return null;
    const warningAction = interactRule.actions?.find((a: any) => a.type === 'show_warning');
    if (warningAction?.message) {
      const text = warningAction.message;
      if (text.includes('Espresso') || text.includes('café')) return '☕ Faire couler l’espresso';
      if (text.includes('ratatouille') || text.includes('mijote')) return '🥘 Faire mijoter';
      if (text.includes('Projection') || text.includes('écran')) return '📽️ Allumer le projecteur';
      if (text.includes('Courrier') || text.includes('boîte') || text.includes('B118')) return '📮 Déposer le courrier';
      if (text.includes('Ébullition') || text.includes('chimie')) return '⚗️ Chauffer la fiole';
      if (text.includes('Idée') || text.includes('Sprint') || text.includes('tableau')) return '💡 Valider l’idée';
      if (text.includes('nocturne') || text.includes('salon') || text.includes('foyer')) return '🔥 Allumer le feu';
      if (text.includes('Accord') || text.includes('musique') || text.includes('guitare')) return '🎸 Jouer un accord';
      if (text.includes('Smart Contract') || text.includes('NFT') || text.includes('Victoria VR')) return '💎 Minter le NFT';
      if (text.includes('Badge') || text.includes('séminaire')) return '🎫 Scanner le badge';
      return `⚡ ${text.slice(0, 26)}…`;
    }
    const animAction = interactRule.actions?.find((a: any) => a.type === 'trigger_animation');
    if (animAction) return `✨ Activer (${animAction.animationType})`;
    const soundAction = interactRule.actions?.find((a: any) => a.type === 'play_sound');
    if (soundAction) return `🔊 Écouter (${soundAction.sound})`;
    return '⚡ Déclencher l’action';
  }, [interactRule, isQuestTarget, currentQuestStep]);

  const isIngredient = React.useMemo(() => {
    const oName = (entity.name || '').toLowerCase();
    const oAsset = (entity.visuals?.assetId || '').toLowerCase();
    return oAsset.includes('tomate') || oAsset.includes('courgette') || oAsset.includes('oignon') ||
      oAsset.includes('ail') || oAsset.includes('carotte') || oAsset.includes('vin') ||
      oAsset.includes('beurre') || oAsset.includes('echalote') || oAsset.includes('bouquet') ||
      oName.includes('tomate') || oName.includes('courgette') || oName.includes('oignon') ||
      oName.includes('ail') || oName.includes('carotte') || oName.includes('vin') ||
      oName.includes('beurre') || oName.includes('légume') || oName.includes('viande');
  }, [entity.name, entity.visuals?.assetId]);

  const lowerName = (entity.name || '').toLowerCase();
  const lowerUrl = (entity.visuals?.modelUrl || '').toLowerCase();
  const lowerAsset = (entity.visuals?.assetId || '').toLowerCase();
  const isCocotte = lowerName.includes('cocotte') || lowerAsset.includes('cocotte');
  const isPoele = lowerName.includes('poele') || lowerName.includes('poêle') || lowerAsset.includes('poele');
  const isBoard = lowerName.includes('planche') || lowerAsset.includes('planche');
  const isPlate = lowerAsset.includes('assiette') || lowerName.includes('assiette') || lowerAsset.includes('plate');
  const isKnife = lowerAsset.includes('couteau') || lowerName.includes('couteau');
  const isSalt = lowerAsset.includes('sel') || lowerName.includes('sel');
  const isOil = lowerAsset.includes('huile') || lowerName.includes('huile');
  const isHerbs = lowerAsset.includes('bouquet') || lowerName.includes('bouquet') || lowerAsset.includes('herbe') || lowerName.includes('herbe');
  const isSeasoning = isSalt || isOil || isHerbs;
  const isWhiteboard = !isPainting && !isWebScreen && !isCocotte && !isPoele && !isBoard && (
    lowerAsset === 'mobile-board' ||
    lowerAsset === 'whiteboard' ||
    lowerAsset === 'notes' ||
    lowerAsset.includes('whiteboard') ||
    lowerAsset === 'wp-bloc-de-notes-adhesives' ||
    lowerName.includes('tableau blanc') ||
    lowerName.includes('tableau d’idées') ||
    lowerName.includes('tableau d\'idees') ||
    lowerName.includes('post-it') ||
    lowerName.includes('post it') ||
    (lowerName.includes('tableau') && (lowerName.includes('mobile') || lowerName.includes('collaboratif') || lowerName.includes('sprint') || lowerName.includes('feutre') || lowerName.includes('kanban')))
  );

  const needsSpatialEntities = isIngredient || isCocotte || isPoele || isBoard;
  const allEntities = useWorldStore(React.useCallback(s => needsSpatialEntities ? s.world.ir.entities : EMPTY_ENTITIES, [needsSpatialEntities]));

  const isDishPlated = useWorldStore(s => s.isDishPlated);
  const choppingProgress = useWorldStore(React.useCallback(s => (isIngredient || isBoard) ? s.choppingProgress : EMPTY_PROGRESS, [isIngredient, isBoard]));
  const sliceLevel = isIngredient ? (choppingProgress[entity.id] || 0) : 0;
  const setIsDishPlated = useWorldStore(s => s.setIsDishPlated);
  const openDegustationModal = useWorldStore(s => s.openDegustationModal);
  const getDishEvaluation = useWorldStore(s => s.getDishEvaluation);
  const addSeasoning = useWorldStore(s => s.addSeasoning);
  const setCameraPreset = useWorldStore(s => s.setCameraPreset);

  const isUtensil = 
    lowerAsset.includes('spatule') ||
    lowerAsset.includes('fouet') ||
    lowerAsset.includes('couteau') ||
    lowerName.includes('spatule') ||
    lowerName.includes('fouet') ||
    lowerName.includes('couteau') ||
    lowerName.includes('maryse') ||
    lowerName.includes('cuillere') ||
    lowerName.includes('cuillère') ||
    lowerName.includes('pinceau');

  const isTableCutlery =
    lowerAsset.includes('fourchette') ||
    lowerName.includes('fourchette') ||
    lowerAsset.includes('wp-cuillere-a-soupe') ||
    lowerAsset.includes('wp-petite-cuillere') ||
    lowerName.includes('a soupe') ||
    lowerName.includes('à soupe') ||
    lowerName.includes('a cafe') ||
    lowerName.includes('à café') ||
    lowerName.includes('argent');

  const isStirUtensil = isUtensil && !lowerAsset.includes('couteau') && !lowerName.includes('couteau') && !isTableCutlery;

  const [isStirringThisUtensil, setIsStirringThisUtensil] = React.useState(false);
  React.useEffect(() => {
    const onStir = (e: any) => {
      const detail = e.detail;
      if (isStirUtensil && (!detail?.utensilId || detail.utensilId === entity.id)) {
        setIsStirringThisUtensil(true);
        const timer = setTimeout(() => setIsStirringThisUtensil(false), 4200);
        return () => clearTimeout(timer);
      }
    };
    window.addEventListener('worldpilot_stir_cookware', onStir);
    return () => window.removeEventListener('worldpilot_stir_cookware', onStir);
  }, [isStirUtensil, entity.id]);

  const [isChoppingThisKnife, setIsChoppingThisKnife] = React.useState(false);
  React.useEffect(() => {
    const onChop = (e: any) => {
      const detail = e.detail;
      if (isKnife && (!detail?.knifeId || detail.knifeId === entity.id)) {
        setIsChoppingThisKnife(true);
        const timer = setTimeout(() => setIsChoppingThisKnife(false), 2400);
        return () => clearTimeout(timer);
      }
    };
    window.addEventListener('worldpilot_chop_action', onChop);
    return () => window.removeEventListener('worldpilot_chop_action', onChop);
  }, [isKnife, entity.id]);

  const [isPouringSeasoning, setIsPouringSeasoning] = React.useState(false);
  React.useEffect(() => {
    const onPour = (e: any) => {
      const detail = e.detail;
      if (isSeasoning && (!detail?.entityId || detail.entityId === entity.id)) {
        setIsPouringSeasoning(true);
        const timer = setTimeout(() => setIsPouringSeasoning(false), 2400);
        return () => clearTimeout(timer);
      }
    };
    window.addEventListener('worldpilot_pour_seasoning', onPour);
    return () => window.removeEventListener('worldpilot_pour_seasoning', onPour);
  }, [isSeasoning, entity.id]);

  const isInsideCookware = React.useMemo(() => {
    if (!isIngredient) return false;
    return Object.values(allEntities).some(other => {
      if (other.id === entity.id) return false;
      const oName = (other.name || '').toLowerCase();
      const oAsset = (other.visuals?.assetId || '').toLowerCase();
      const isCook = oAsset.includes('cocotte') || oAsset.includes('poele') || oName.includes('cocotte') || oName.includes('poele');
      if (!isCook) return false;
      const cPos = other.capabilities.find(c => c.type === 'transform')?.position;
      if (!cPos) return false;
      return Math.hypot(pos.x - cPos.x, pos.z - cPos.z) < 0.35;
    });
  }, [allEntities, entity.id, isIngredient, pos.x, pos.z]);

  const isOnBoard = React.useMemo(() => {
    if (!isIngredient) return false;
    return Object.values(allEntities).some(other => {
      if (other.id === entity.id) return false;
      const oName = (other.name || '').toLowerCase();
      const oAsset = (other.visuals?.assetId || '').toLowerCase();
      const isB = oAsset.includes('planche') || oName.includes('planche');
      if (!isB) return false;
      const bPos = other.capabilities.find(c => c.type === 'transform')?.position;
      if (!bPos) return false;
      return Math.hypot(pos.x - bPos.x, pos.z - bPos.z) < 0.38;
    });
  }, [allEntities, entity.id, isIngredient, pos.x, pos.z]);

  const ingredientsInPot = React.useMemo(() => {
    if (!isCocotte && !isPoele) return [];
    return Object.values(allEntities).filter(other => {
      if (other.id === entity.id) return false;
      const oName = (other.name || '').toLowerCase();
      const oAsset = (other.visuals?.assetId || '').toLowerCase();
      const isIng = oAsset.includes('tomate') || oAsset.includes('courgette') || oAsset.includes('oignon') ||
        oAsset.includes('ail') || oAsset.includes('carotte') || oAsset.includes('vin') ||
        oAsset.includes('beurre') || oAsset.includes('echalote') || oAsset.includes('bouquet') ||
        oName.includes('tomate') || oName.includes('courgette') || oName.includes('oignon') ||
        oName.includes('ail') || oName.includes('carotte') || oName.includes('vin') ||
        oName.includes('beurre') || oName.includes('légume') || oName.includes('viande');
      if (!isIng) return false;
      const oPos = other.capabilities.find(c => c.type === 'transform')?.position;
      if (!oPos) return false;
      const d = Math.hypot(oPos.x - pos.x, oPos.z - pos.z);
      return d < 0.38;
    }).map(e => ({ id: e.id, name: e.name, assetId: e.visuals?.assetId || '' }));
  }, [allEntities, entity.id, isCocotte, isPoele, pos.x, pos.z]);

  const ingredientsOnBoard = React.useMemo(() => {
    if (!isBoard) return [];
    return Object.values(allEntities).filter(other => {
      if (other.id === entity.id) return false;
      const oName = (other.name || '').toLowerCase();
      const oAsset = (other.visuals?.assetId || '').toLowerCase();
      const isIng = oAsset.includes('tomate') || oAsset.includes('courgette') || oAsset.includes('oignon') ||
        oAsset.includes('ail') || oAsset.includes('carotte') || oAsset.includes('vin') ||
        oAsset.includes('beurre') || oAsset.includes('echalote') || oAsset.includes('bouquet') ||
        oName.includes('tomate') || oName.includes('courgette') || oName.includes('oignon') ||
        oName.includes('ail') || oName.includes('carotte') || oName.includes('vin') ||
        oName.includes('beurre') || oName.includes('légume') || oName.includes('viande');
      if (!isIng) return false;
      const oPos = other.capabilities.find(c => c.type === 'transform')?.position;
      if (!oPos) return false;
      const d = Math.hypot(oPos.x - pos.x, oPos.z - pos.z);
      return d < 0.38;
    }).map(e => ({ id: e.id, name: e.name, assetId: e.visuals?.assetId || '' }));
  }, [allEntities, entity.id, isBoard, pos.x, pos.z]);

  const boardStage = React.useMemo(() => {
    if (!isBoard || ingredientsOnBoard.length === 0) return 3;
    const stages = ingredientsOnBoard.map(i => choppingProgress[i.id] || 0);
    return Math.max(1, ...stages);
  }, [isBoard, ingredientsOnBoard, choppingProgress]);

  const entityCategoryInfo = React.useMemo(() => {
    const asset = getAsset(entity.visuals?.assetId);
    const cat = asset?.category || '';
    const nameLow = (entity.name || '').toLowerCase();
    const assetLow = (entity.visuals?.assetId || '').toLowerCase();

    if (isSalt) return { label: 'Fleur de sel de Guérande · Assaisonnement', shortLabel: 'Sel', icon: '🧂', color: '#38bdf8' };
    if (isOil) return { label: 'Huile d’olive de Provence · Assaisonnement', shortLabel: 'Huile', icon: '🫒', color: '#eab308' };
    if (isHerbs) return { label: 'Bouquet garni & Aromates · Infusion', shortLabel: 'Aromate', icon: '🌿', color: '#16a34a' };

    if (isIngredient) {
      if (nameLow.includes('tomate') || assetLow.includes('tomate')) return { label: 'Tomate · Légume du soleil', shortLabel: 'Légume', icon: '🍅', color: '#ef4444' };
      if (nameLow.includes('courgette') || assetLow.includes('courgette')) return { label: 'Courgette · Légume du potager', shortLabel: 'Légume', icon: '🥒', color: '#10b981' };
      if (nameLow.includes('oignon') || assetLow.includes('oignon')) return { label: 'Oignon · Aromate & saveurs', shortLabel: 'Aromate', icon: '🧅', color: '#f59e0b' };
      if (nameLow.includes('ail') || assetLow.includes('ail')) return { label: 'Ail · Condiment provençal', shortLabel: 'Aromate', icon: '🧄', color: '#e2e8f0' };
      if (nameLow.includes('carotte') || assetLow.includes('carotte')) return { label: 'Carotte · Légume doux', shortLabel: 'Légume', icon: '🥕', color: '#f97316' };
      if (nameLow.includes('vin') || assetLow.includes('vin')) return { label: 'Vin Rouge · Réduction & bouillon', shortLabel: 'Bouillon', icon: '🍷', color: '#c084fc' };
      if (nameLow.includes('beurre') || assetLow.includes('beurre')) return { label: 'Beurre · Matière grasse', shortLabel: 'Matière grasse', icon: '🧈', color: '#facc15' };
      return { label: 'Ingrédient culinaire', shortLabel: 'Ingrédient', icon: '🥗', color: '#10b981' };
    }
    if (isUtensil) {
      if (assetLow.includes('fouet') || nameLow.includes('fouet')) return { label: 'Fouet de cuisine · Émulsion & battre', shortLabel: 'Fouet', icon: '🌪️', color: '#38bdf8' };
      if (assetLow.includes('spatule') || nameLow.includes('spatule') || nameLow.includes('maryse')) return { label: 'Spatule en bois · Remuer la cocotte', shortLabel: 'Spatule', icon: '🥄', color: '#f59e0b' };
      if (assetLow.includes('cuillere-bois') || nameLow.includes('cuillere en bois') || nameLow.includes('cuillère en bois') || nameLow.includes('cuillere bois') || nameLow.includes('cuillère bois')) {
        return { label: 'Cuillère en bois · Remuer la cocotte', shortLabel: 'Cuillère en bois', icon: '🥄', color: '#d97706' };
      }
      if (assetLow.includes('cuillere') || nameLow.includes('cuillere') || nameLow.includes('cuillère')) {
        return { label: entity.name || 'Cuillère de table', shortLabel: 'Cuillère', icon: '🥄', color: '#94a3b8' };
      }
      if (assetLow.includes('couteau') || nameLow.includes('couteau')) return { label: 'Couteau de chef · Émincer & tailler', shortLabel: 'Découpe', icon: '🔪', color: '#84cc16' };
      return { label: 'Ustensile de cuisine', shortLabel: 'Ustensile', icon: '🥄', color: '#fb923c' };
    }
    if (isPlate) return { label: 'Assiette gastronomique · Service', shortLabel: 'Service', icon: '🍽️', color: '#e2e8f0' };
    if (isCocotte) return { label: 'Cocotte en fonte · Cuisson douce', shortLabel: 'Cuisson', icon: '🥘', color: '#ea580c' };
    if (isPoele) return { label: 'Poêle de chef · Saisir & dorer', shortLabel: 'Cuisson', icon: '🍳', color: '#d97706' };
    if (isBoard) return { label: 'Planche de découpe en bois', shortLabel: 'Découpe', icon: '🔪', color: '#84cc16' };
    if (isWhiteboard) return { label: 'Tableau d’idées & Post-its', shortLabel: 'Post-its', icon: '📋', color: '#f59e0b' };
    if (isWebScreen) return { label: 'Écran interactif 3D', shortLabel: 'Web 3D', icon: '🌐', color: '#38bdf8' };
    if (isAudio) return { label: 'Voix & Audio Guide', shortLabel: 'Audio', icon: '🔊', color: '#ec4899' };
    if (isQuiz) return { label: 'Évaluation & Quiz', shortLabel: 'Quiz', icon: '🎓', color: '#f59e0b' };

    if (nameLow.includes('croissant')) {
      return { label: entity.name || 'Croissant pur beurre', shortLabel: 'Viennoiserie', icon: '🥐', color: '#f59e0b' };
    }
    if (nameLow.includes('baguette') || nameLow.includes('pain') || nameLow.includes('brioche') || nameLow.includes('tradition')) {
      return { label: entity.name || 'Pain artisanal', shortLabel: 'Boulangerie', icon: '🥖', color: '#d97706' };
    }
    if (nameLow.includes('chocolat') || nameLow.includes('éclair') || nameLow.includes('macaron') || nameLow.includes('tarte') || nameLow.includes('cannelé') || nameLow.includes('millefeuille') || nameLow.includes('gateau') || nameLow.includes('gâteau')) {
      return { label: entity.name, shortLabel: 'Pâtisserie', icon: '🧁', color: '#ec4899' };
    }
    if (nameLow.includes('caisse') || assetLow.includes('caisse')) {
      return { label: 'Caisse enregistreuse', shortLabel: 'Point de vente', icon: '💳', color: '#38bdf8' };
    }
    if (nameLow.includes('corbeille') || nameLow.includes('panier')) {
      return { label: entity.name || 'Présentoir', shortLabel: 'Présentoir', icon: '🧺', color: '#a3e635' };
    }

    if (cat) {
      let cleanShort = cat;
      if (cleanShort.includes('·')) {
        const parts = cleanShort.split('·');
        cleanShort = (parts[1] || parts[0]).trim();
      }
      if (cleanShort.toLowerCase().includes('boulangerie')) cleanShort = 'Boulangerie';
      else if (cleanShort.toLowerCase().includes('gastronomie') || cleanShort.toLowerCase().includes('cuisine')) cleanShort = 'Gastronomie';
      else if (cleanShort.toLowerCase().includes('automobile') || cleanShort.toLowerCase().includes('voiture')) cleanShort = 'Automobile';
      else if (cleanShort.toLowerCase().includes('mobilier') || cleanShort.toLowerCase().includes('meuble')) cleanShort = 'Mobilier';
      else if (cleanShort.toLowerCase().includes('nature') || cleanShort.toLowerCase().includes('végétal')) cleanShort = 'Nature';
      else if (cleanShort.toLowerCase().includes('laboratoire') || cleanShort.toLowerCase().includes('science')) cleanShort = 'Science';
      else if (cleanShort.length > 14) {
        cleanShort = cleanShort.split(' ')[0];
      }
      return { label: entity.name || cat, shortLabel: cleanShort, icon: '📦', color: '#94a3b8' };
    }
    return { label: 'Objet 3D', shortLabel: 'Prop 3D', icon: '✨', color: '#94a3b8' };
  }, [entity.visuals?.assetId, entity.name, isIngredient, isUtensil, isPlate, isCocotte, isPoele, isBoard, isWhiteboard, isWebScreen, isAudio, isQuiz, isSalt, isOil, isHerbs]);

  const animatedCap = entity.capabilities.find(c => c.type === 'animated');
  const animRef = React.useRef<THREE.Group>(null);
  const dragInertiaRef = React.useRef({ x: 0, z: 0, tiltX: 0, tiltZ: 0 });

  useFrame(({ clock }) => {
    if (!animRef.current) return;
    const t = clock.getElapsedTime();

    if (isThisEntityDragging && dragOffsetRef.current) {
      const curOffset = dragOffsetRef.current;
      const dx = curOffset.x - dragInertiaRef.current.x;
      const dz = curOffset.z - dragInertiaRef.current.z;
      dragInertiaRef.current.x = curOffset.x;
      dragInertiaRef.current.z = curOffset.z;

      const targetTiltZ = -Math.max(-0.25, Math.min(0.25, dx * 2.5));
      const targetTiltX = Math.max(-0.25, Math.min(0.25, dz * 2.5));
      dragInertiaRef.current.tiltZ += (targetTiltZ - dragInertiaRef.current.tiltZ) * 0.2;
      dragInertiaRef.current.tiltX += (targetTiltX - dragInertiaRef.current.tiltX) * 0.2;

      animRef.current.position.set(0, 0, 0);
      animRef.current.rotation.x = dragInertiaRef.current.tiltX;
      animRef.current.rotation.z = dragInertiaRef.current.tiltZ;
      return;
    } else {
      dragInertiaRef.current.tiltX *= 0.82;
      dragInertiaRef.current.tiltZ *= 0.82;
    }

    if (isChoppingThisKnife) {
      const tapCycle = (t * 14) % (Math.PI * 2);
      animRef.current.position.y = Math.abs(Math.sin(tapCycle)) * 0.05;
      animRef.current.rotation.x = -Math.abs(Math.sin(tapCycle)) * 0.22;
      animRef.current.rotation.z = Math.sin(t * 7) * 0.04;
    } else if (isStirringThisUtensil) {
      animRef.current.position.x = Math.cos(t * 7.5) * 0.08;
      animRef.current.position.z = Math.sin(t * 7.5) * 0.08;
      animRef.current.position.y = 0.07 + Math.sin(t * 15) * 0.012;
      animRef.current.rotation.z = Math.PI / 6 + Math.sin(t * 7.5) * 0.12;
      animRef.current.rotation.x = Math.PI / 10 + Math.cos(t * 7.5) * 0.12;
    } else if (isPouringSeasoning) {
      const shake = Math.sin(t * 18) * 0.08;
      animRef.current.position.y = 0.1 + Math.sin(t * 12) * 0.02;
      animRef.current.rotation.z = (Math.PI / 4) + shake;
      animRef.current.rotation.x = 0.15;
    } else if (animatedCap) {
      if (animatedCap.animationType === 'floating') {
        animRef.current.position.y = Math.sin(t * 2.2) * 0.09;
      } else if (animatedCap.animationType === 'spinning') {
        animRef.current.rotation.y = t * 1.5;
      } else if (animatedCap.animationType === 'pulsing') {
        const s = 1 + Math.sin(t * 4.5) * 0.06;
        animRef.current.scale.set(s, s, s);
      } else if (animatedCap.animationType === 'steaming') {
        animRef.current.position.y = Math.sin(t * 22) * 0.003;
        animRef.current.rotation.z = Math.sin(t * 16) * 0.006;
      } else if (animatedCap.animationType === 'chopping') {
        const cycle = (t * 5.2) % (Math.PI * 2);
        animRef.current.position.y = Math.max(0, Math.sin(cycle)) * 0.07;
        animRef.current.rotation.x = -Math.max(0, Math.sin(cycle)) * 0.25;
      }
    } else if (isInsideCookware) {
      animRef.current.position.y = Math.sin(t * 3.2) * 0.005;
      animRef.current.rotation.z = Math.sin(t * 1.8) * 0.04;
      const s = 0.82 + Math.sin(t * 2.5) * 0.02;
      animRef.current.scale.set(s, s, s);
    } else {
      animRef.current.position.set(0, 0, 0);
      animRef.current.rotation.set(0, 0, 0);
    }
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    if (wasJustDragged.current) return;
    if (isWhiteboard) {
      useWorldStore.getState().setShowCollaborationBoardModal(true);
    }
    if (isMicroscope) {
      const webCap = entity.capabilities.find(c => c.type === 'web_screen' || c.url);
      const defaultUrl = 'https://fr.m.wikipedia.org/wiki/Microbiologie';
      const targetUrl = webCap?.url || defaultUrl;
      useWorldStore.getState().openWebModal(targetUrl, `🔬 ${entity.name || 'Station Scientifique & Microscope'}`);
    } else if (isBook) {
      const webCap = entity.capabilities.find(c => c.type === 'web_screen' || c.url);
      const eduCap = entity.capabilities.find(c => c.type === 'educational');
      const defaultPdfUrl = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
      const targetUrl = webCap?.url || eduCap?.url || defaultPdfUrl;
      useWorldStore.getState().openWebModal(targetUrl, `📖 ${entity.name || 'Livre Spatial & Document'}`);
    } else if (isComputer) {
      const webCap = entity.capabilities.find(c => c.type === 'web_screen' || c.url);
      const eduCap = entity.capabilities.find(c => c.type === 'educational');
      const defaultUrl = 'https://threejs.org/docs/';
      const targetUrl = webCap?.url || eduCap?.url || defaultUrl;
      useWorldStore.getState().openWebModal(targetUrl, `💻 ${entity.name || 'Terminal & Documentation 3D'}`);
    } else if (isPainting) {
      const webCap = entity.capabilities.find(c => c.type === 'web_screen' || c.url);
      const eduCap = entity.capabilities.find(c => c.type === 'educational');
      const defaultUrl = 'https://fr.m.wikipedia.org/wiki/Mus%C3%A9e_du_Louvre';
      const targetUrl = webCap?.url || eduCap?.url || defaultUrl;
      useWorldStore.getState().openWebModal(targetUrl, `🎨 ${entity.name || 'Galerie d’Art & Musée'}`);
    } else if (isMusicPlayer) {
      useWorldStore.getState().toggleAmbientAudio();
      playAudioFx('chime');
      const isActive = useWorldStore.getState().isAmbientAudioActive;
      useWorldStore.setState(s => ({
        warnings: [...s.warnings, isActive ? '📻 Radio Spatiale allumée : diffusion de l’ambiance sonore relaxante !' : '📻 Radio Spatiale éteinte.']
      }));
    } else if (isGlobe) {
      const webCap = entity.capabilities.find(c => c.type === 'web_screen' || c.url);
      const defaultUrl = 'https://www.openstreetmap.org/export/embed.html?bbox=-180%2C-65%2C180%2C80&layer=mapnik';
      const targetUrl = webCap?.url || defaultUrl;
      useWorldStore.getState().openWebModal(targetUrl, `🌍 ${entity.name || 'Atlas & Globe Mondial'}`);
    } else if (isBlueprint) {
      const webCap = entity.capabilities.find(c => c.type === 'web_screen' || c.url);
      const defaultUrl = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
      const targetUrl = webCap?.url || defaultUrl;
      useWorldStore.getState().openWebModal(targetUrl, `📁 ${entity.name || 'Dossier Technique & Plans'}`);
    }
    if (isAudio) {
      const eduCap = entity.capabilities.find(c => c.type === 'educational');
      if (eduCap?.text && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        if (!ambientAudio.isAudioMuted() && ambientAudio.getEffectiveVolume() > 0.01) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(eduCap.text);
          utterance.volume = ambientAudio.getEffectiveVolume();
          utterance.lang = 'fr-FR';
          utterance.rate = 1.0;
          window.speechSynthesis.speak(utterance);
        }
      }
    }
    if (!isZone) {
      const eNameLow = (entity.name || '').toLowerCase();
      const eIdLow = (entity.id || '').toLowerCase();
      const eAssetLow = (entity.visuals?.assetId || '').toLowerCase();

      const isConfiguratorEntity =
        eAssetLow === 'wp-borne-configurateur' ||
        eIdLow.includes('configurateur') ||
        eNameLow.includes('configurateur') ||
        eNameLow.includes('console holographique') ||
        eIdLow.includes('console_holographique') ||
        eIdLow.includes('color_terminal') ||
        (currentQuestStep?.title?.toLowerCase().includes('configur') && eIdLow.includes('supercar'));

      const isSupercarVehicle =
        eAssetLow === 'wp-supercar-showroom' ||
        ((eNameLow.includes('supercar') || eIdLow.includes('supercar')) &&
          !eNameLow.includes('configur') &&
          !eNameLow.includes('console') &&
          !eNameLow.includes('borne') &&
          !eNameLow.includes('terminal'));

      const isStartStopButton =
        eNameLow.includes('start-stop') ||
        eNameLow.includes('start stop') ||
        eNameLow.includes('bouton start') ||
        eNameLow.includes('bouton moteur') ||
        eNameLow.includes('allumage moteur') ||
        eIdLow.includes('start_stop') ||
        eIdLow.includes('bouton_start');

      const isInteractiveFixedMachine =
        hasInteraction ||
        isConfiguratorEntity ||
        isSupercarVehicle ||
        isStartStopButton ||
        eAssetLow === 'wp-four-patisserie' ||
        eAssetLow === 'wp-baie-panoramique' ||
        eAssetLow === 'wp-coupole-spatiale' ||
        eAssetLow === 'wp-meuble-ikea-kit' ||
        eAssetLow === 'wp-console-level-design' ||
        eAssetLow === 'wp-portail-victoire';

      // Support-surface intelligent click delegation:
      // Only passive support furniture / floors delegate clicks to props resting on top
      if ((isFurnitureOrSupport || isCustomFloorSlab) && !isInteractiveFixedMachine) {
        const hitPoint = e.point as THREE.Vector3 | undefined;
        const allEntitiesMap = useWorldStore.getState().world.ir.entities;
        const allEntitiesList = Object.values(allEntitiesMap);

        // Find candidate non-furniture props resting on or directly above this support
        const candidateProps = allEntitiesList.filter(other => {
          if (other.id === entity.id) return false;
          if (isFixedStructuralFurniture(other)) return false;
          const oPos = other.capabilities.find(c => c.type === 'transform')?.position;
          if (!oPos) return false;
          const dy = oPos.y - (pos.y || 0);
          return dy >= -0.2 && dy <= 1.5;
        });

        const currentPointedId = useWorldStore.getState().spatialContext.pointedEntityId;

        if (hitPoint && candidateProps.length > 0) {
          let closestProp: EntitySpec | null = null;
          let closestDist = Infinity;
          for (const prop of candidateProps) {
            const pPos = prop.capabilities.find(c => c.type === 'transform')?.position;
            if (!pPos) continue;
            const dist = Math.hypot(pPos.x - hitPoint.x, pPos.z - hitPoint.z);
            if (dist < closestDist) {
              closestDist = dist;
              closestProp = prop;
            }
          }

          // If user clicked within 0.85m of a prop resting on the support, select that prop!
          if (closestProp && closestDist < 0.85) {
            playAudioFx('switch_click');
            setSpatialContext(closestProp.id, currentPointedId);
            dispatch({
              type: 'INTERACT',
              sourceId: closestProp.id
            });
            return;
          }
        }

        // In simulation mode, clicking an empty support furniture or floor slab never steals selection
        if (appMode === 'simulation') {
          setSpatialContext(null, null);
          return;
        }
      }

      playAudioFx('switch_click');
      const currentPointedId = useWorldStore.getState().spatialContext.pointedEntityId;
      setSpatialContext(entity.id, currentPointedId);

      if (isStartStopButton && appMode === 'simulation') {
        playAudioFx('chime');
        useWorldStore.setState(s => ({
          world: {
            ...s.world,
            flags: {
              ...s.world.flags,
              supercar_started: true,
              ignition_active: true,
            }
          },
          warnings: [
            ...s.warnings,
            '🔥 Moteur V12 Hybride démarré ! Les phares LED laser, le bandeau arrière et la télémétrie s’allument.'
          ]
        }));
      }

      const stepTitleLow = (currentQuestStep?.title || '').toLowerCase();
      if (isSupercarVehicle && appMode === 'simulation' && !stepTitleLow.includes('configur')) {
        const curFlags = useWorldStore.getState().world.flags || {};
        if (curFlags['supercar_started'] || stepTitleLow.includes('piste') || stepTitleLow.includes('essai') || stepTitleLow.includes('simulation')) {
          playAudioFx('chime');
          useWorldStore.setState(s => ({
            world: {
              ...s.world,
              flags: {
                ...s.world.flags,
                supercar_started: true,
                supercar_track_sim: true,
              }
            },
            warnings: [
              ...s.warnings,
              '🏁 Simulation aérodynamique sur piste activée : flux laminaire en soufflerie et rotation haute vitesse des 4 roues forgées !'
            ]
          }));
        }
      }

      dispatch({
        type: 'INTERACT',
        sourceId: entity.id
      });

      if (isConfiguratorEntity && appMode === 'simulation') {
        useWorldStore.getState().openSupercarConfigurator();
      }
    } else {
      playAudioFx('switch_click');
      const stateNow = useWorldStore.getState();
      const { selectedEntityId: currentSelectedId } = stateNow.spatialContext;
      setSpatialContext(currentSelectedId, entity.id);

      // Si un objet manipulable est sélectionné (ou ciblé par une étape de quête DROP active),
      // cliquer sur la zone cible réalise le dépôt (Click-to-Drop assisté) ET déclenche INTERACT.
      const allEntitiesMap = stateNow.world.ir.entities;
      let sourceToDrop: EntitySpec | null = null;
      if (currentSelectedId && currentSelectedId !== entity.id && allEntitiesMap[currentSelectedId]) {
        const selEnt = allEntitiesMap[currentSelectedId];
        if (selEnt.capabilities.some(c => c.type === 'draggable') || !isFixedStructuralFurniture(selEnt)) {
          sourceToDrop = selEnt;
        }
      }
      if (!sourceToDrop && (currentQuestStep?.requiredEvent || '').startsWith('DROP')) {
        const stepSourceId = currentQuestStep?.targetEntityId;
        if (stepSourceId && stepSourceId !== entity.id && allEntitiesMap[stepSourceId]) {
          sourceToDrop = allEntitiesMap[stepSourceId];
        } else {
          sourceToDrop = Object.values(allEntitiesMap).find(
            other => other.id !== entity.id && other.capabilities.some(c => c.type === 'draggable')
          ) || null;
        }
      }

      if (sourceToDrop && appMode === 'simulation') {
        const rawZPos: any = entity.capabilities.find(c => c.type === 'transform')?.position || { x: pos.x, y: pos.y, z: pos.z };
        const zPos = Array.isArray(rawZPos) && rawZPos.length >= 3
          ? { x: Number(rawZPos[0]) || 0, y: Number(rawZPos[1]) || 0, z: Number(rawZPos[2]) || 0 }
          : { x: Number(rawZPos.x) || 0, y: Number(rawZPos.y) || 0, z: Number(rawZPos.z) || 0 };
        const supHeight = getSupportingSurfaceHeight(zPos.x, zPos.z, allEntitiesMap, sourceToDrop.id);
        const dropY = Number(((supHeight.surfaceY > 0 ? supHeight.surfaceY : zPos.y) + 0.04).toFixed(3));
        playAudioFx('chime');
        applyPatch(
          {
            entitiesChanged: [
              {
                id: sourceToDrop.id,
                capabilities: sourceToDrop.capabilities.map(c =>
                  c.type === 'transform' ? { ...c, position: { x: zPos.x, y: dropY, z: zPos.z } } : c
                )
              }
            ]
          },
          `Poser ${sourceToDrop.name} sur ${entity.name}`,
          { intent: `Poser ${sourceToDrop.name} sur ${entity.name}`, recordUndo: true }
        );
        dispatch({
          type: 'DROP',
          sourceId: sourceToDrop.id,
          targetId: entity.id
        });
      }

      dispatch({
        type: 'INTERACT',
        sourceId: entity.id
      });
    }
  };


  const handleDoubleClick = (e: any) => {
    e.stopPropagation();
    if (isWebScreen) {
      const webCap = entity.capabilities.find(c => c.type === 'web_screen' || c.url);
      const eduCap = entity.capabilities.find(c => c.type === 'educational');
      const isCooking = entity.id.includes('recipe') || entity.name.toLowerCase().includes('recette');
      const defaultUrl = isCooking 
        ? 'https://fr.m.wikipedia.org/wiki/Ratatouille' 
        : 'https://fr.m.wikipedia.org/wiki/Gastronomie_fran%C3%A7aise';
      const targetUrl = webCap?.url || eduCap?.url || defaultUrl;
      useWorldStore.getState().openWebModal(targetUrl, entity.name, eduCap?.text, entity.id);
      return;
    }
    const { selectedEntityId: currentSelectedId, pointedEntityId: currentPointedId } = useWorldStore.getState().spatialContext;
    if (!isZone && currentSelectedId === entity.id && currentPointedId) {
      dispatch({
        type: 'DROP',
        sourceId: entity.id,
        targetId: currentPointedId
      });
      return;
    }
    // Norme ergonomique 3D : le double-clic cadre instantanément la caméra sur l'objet ciblé
    focusEntity(entity.id);
    playAudioFx('tink');
  };

  const renderShape = () => {
    const isTarget = entity.id.startsWith('target_') && entity.id !== 'target_range_base';
    const isBlasterConsole = entity.id === 'blaster_console';
    const isTargetRangeBase = entity.id === 'target_range_base';

    if (isTarget) return <SpatialShootingTarget entity={entity} isSelected={isSelected} />;
    if (isBlasterConsole) return <SpatialBlasterConsole entity={entity} />;
    if (isTargetRangeBase) return <SpatialTargetRangeBase entity={entity} />;

    if (entity.id === 'agent_avatar' || entity.visuals?.modelUrl === '/library/avatar.glb' || (entity.id.includes('avatar') && !entity.visuals?.shape)) {
      return null;
    }

    // Ultra-thin architectural floor slab so custom floors (e.g. "Sol showroom marbre noir") never bury objects above y=0
    if (isCustomFloorSlab) {
      const floorName = (entity.name || '').toLowerCase();
      const useStoneGlb = Boolean(
        entity.visuals?.modelUrl &&
        (floorName.includes('pierre') || floorName.includes('stone')) &&
        !floorName.includes('marbre') &&
        !floorName.includes('showroom')
      );
      if (!useStoneGlb) {
        const rawColor = (entity.visuals?.color || '').toLowerCase();
        const isAccidentalGreen = rawColor === '#4ade80' || rawColor === '#22c55e' || rawColor === '#10b981' || rawColor === '#34d399' || rawColor === '#16a34a';
        const isDarkMarbleOrShowroom = floorName.includes('noir') || floorName.includes('showroom') || floorName.includes('marbre');
        const floorColor = (isDarkMarbleOrShowroom && (!rawColor || isAccidentalGreen))
          ? '#111827'
          : (entity.visuals?.color || (isDarkMarbleOrShowroom ? '#111827' : '#334155'));
        return (
          <mesh receiveShadow position={[0, -0.5, 0]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshPhysicalMaterial
              color={floorColor}
              roughness={entity.visuals?.roughness ?? 0.14}
              metalness={entity.visuals?.metalness ?? 0.35}
              clearcoat={0.85}
              clearcoatRoughness={0.12}
            />
          </mesh>
        );
      }
    }

    if (isMicroscope) return <SpatialMicroscopeModel entity={entity} />;
    if (isBook) return <SpatialBookModel entity={entity} />;
    if (isComputer) return <SpatialLaptopModel entity={entity} />;
    if (isPainting) return <SpatialArtCanvas entity={entity} />;
    if (isBlueprint) return <SpatialBlueprintModel entity={entity} />;
    if (isMusicPlayer) return <SpatialAudioPlayerModel entity={entity} />;
    if (isGlobe) return <SpatialGlobeModel entity={entity} />;
    if (isWebScreen) return <WebBillboard entity={entity} />;
    if (isWhiteboard) {
      return (
        <group>
          {getAsset(entity.visuals?.assetId) && <LibraryModel entity={entity} />}
          <Whiteboard3DStickyNotes entity={entity} />
        </group>
      );
    }
    if (isPedagogicalApparatus(entity)) {
      return <PedagogicalApparatusModel entity={entity} isSelected={isSelected} isHovered={isHovered} />;
    }
    if (hasDetailedSimulationModel(entity)) {
      return <DetailedSimulationModel entity={entity} isSelected={isSelected} isHovered={isHovered} />;
    }
    if (getAsset(entity.visuals?.assetId)) return <LibraryModel entity={entity} />;
    if (entity.id === 'Battery_B-17' && !entity.visuals?.modelUrl && !entity.visuals?.shape) {
      return <group>
        <RoundedBox args={[0.95, 0.72, 0.66]} radius={0.055} smoothness={4} castShadow receiveShadow>
          <meshStandardMaterial color="#b58a48" roughness={0.38} metalness={0.55} />
          {isSelected && <Edges color="#e9d09b" />}
        </RoundedBox>
        <RoundedBox position={[0, 0.34, 0]} args={[0.98, 0.08, 0.69]} radius={0.02} smoothness={3} castShadow>
          <meshStandardMaterial color="#303b3d" metalness={0.55} roughness={0.32} />
        </RoundedBox>
        {[-0.3, 0.3].map(x => <mesh key={x} position={[x, 0.44, 0]} castShadow>
          <cylinderGeometry args={[0.065, 0.065, 0.14, 24]} />
          <meshStandardMaterial color={x < 0 ? '#a95140' : '#b2b4ac'} metalness={0.8} roughness={0.25} />
        </mesh>)}
        <mesh position={[0, 0.03, 0.336]}>
          <planeGeometry args={[0.52, 0.26]} />
          <meshStandardMaterial color="#dedaca" roughness={0.85} />
        </mesh>
        {[-0.13, -0.065, 0, 0.065, 0.13].map(x => <mesh key={x} position={[x, 0.03, 0.338]}>
          <planeGeometry args={[0.025, 0.17]} />
          <meshStandardMaterial color="#364443" />
        </mesh>)}
      </group>;
    }
    if (entity.visuals?.modelUrl) {
      return (
        <ModelErrorBoundary fallback={
          <SemanticProceduralFallback entity={entity} isSelected={isSelected} isHovered={isHovered} />
        }>
          <React.Suspense fallback={
            <SemanticProceduralFallback entity={entity} isSelected={isSelected} isHovered={isHovered} />
          }>
            <GLTFModel 
              url={entity.visuals.modelUrl} 
              materialPreset={entity.visuals.materialPreset} 
              textureUrl={entity.visuals.textureUrl} 
              color={entity.visuals.color} 
              roughness={entity.visuals.roughness} 
              metalness={entity.visuals.metalness} 
              clearcoat={entity.visuals.clearcoat} 
              repeat={entity.visuals.repeat} 
            />
          </React.Suspense>
        </ModelErrorBoundary>
      );
    }

    const hasRichProceduralParts = Boolean(
      entity.parts &&
      entity.parts.length >= 3 &&
      !entity.visuals?.modelUrl &&
      entity.parts.some((p: any) => p.shape && p.shape !== 'box')
    );

    if (hasRichProceduralParts && entity.parts) {
      return (
        <group>
          {entity.parts.map((part: any, pIdx: number) => {
            const pShape = part.shape || 'box';
            const pPos = part.position || [0, 0, 0];
            const pRot = part.rotation || [0, 0, 0];
            const pScale = part.scale || [1, 1, 1];
            const pColor = part.color || entity.visuals?.color || '#94a3b8';
            const pPosArr: [number, number, number] = Array.isArray(pPos)
              ? [pPos[0] || 0, pPos[1] || 0, pPos[2] || 0]
              : [pPos.x || 0, pPos.y || 0, pPos.z || 0];
            const pRotArr: [number, number, number] = Array.isArray(pRot)
              ? [pRot[0] || 0, pRot[1] || 0, pRot[2] || 0]
              : [pRot.x || 0, pRot.y || 0, pRot.z || 0];
            const pScaleArr: [number, number, number] = Array.isArray(pScale)
              ? [pScale[0] || 1, pScale[1] || 1, pScale[2] || 1]
              : [pScale.x || 1, pScale.y || 1, pScale.z || 1];
            const roughness = typeof part.roughness === 'number' ? part.roughness : 0.45;
            const metalness = typeof part.metalness === 'number' ? part.metalness : 0.15;
            const clearcoat = typeof part.clearcoat === 'number' ? part.clearcoat : 0.3;
            const opacity = typeof part.opacity === 'number' ? part.opacity : 1;

            return (
              <group key={part.id || `part-${pIdx}`} position={pPosArr} rotation={pRotArr} scale={pScaleArr}>
                {pShape === 'cylinder' ? (
                  <mesh castShadow receiveShadow>
                    <cylinderGeometry args={[0.5, 0.5, 1, 32]} />
                    <meshPhysicalMaterial color={pColor} roughness={roughness} metalness={metalness} clearcoat={clearcoat} opacity={opacity} transparent={opacity < 1} />
                  </mesh>
                ) : pShape === 'sphere' ? (
                  <mesh castShadow receiveShadow>
                    <sphereGeometry args={[0.5, 32, 24]} />
                    <meshPhysicalMaterial color={pColor} roughness={roughness} metalness={metalness} clearcoat={clearcoat} opacity={opacity} transparent={opacity < 1} />
                  </mesh>
                ) : pShape === 'cone' ? (
                  <mesh castShadow receiveShadow>
                    <coneGeometry args={[0.5, 1, 32]} />
                    <meshPhysicalMaterial color={pColor} roughness={roughness} metalness={metalness} clearcoat={clearcoat} opacity={opacity} transparent={opacity < 1} />
                  </mesh>
                ) : pShape === 'torus' ? (
                  <mesh castShadow receiveShadow>
                    <torusGeometry args={[0.4, 0.1, 16, 32]} />
                    <meshPhysicalMaterial color={pColor} roughness={roughness} metalness={metalness} clearcoat={clearcoat} opacity={opacity} transparent={opacity < 1} />
                  </mesh>
                ) : (
                  <RoundedBox args={[1, 1, 1]} radius={0.04} smoothness={4} castShadow receiveShadow>
                    <meshPhysicalMaterial color={pColor} roughness={roughness} metalness={metalness} clearcoat={clearcoat} opacity={opacity} transparent={opacity < 1} />
                  </RoundedBox>
                )}
              </group>
            );
          })}
        </group>
      );
    }

    const isExplicitPrimitiveCube = /^(cube|boîte|boite|bloc|box)\b/i.test((entity.name || '').trim());
    if (
      !isZone &&
      (!entity.visuals?.shape ||
        (!entity.visuals?.textureUrl &&
          !entity.visuals?.materialPreset &&
          entity.visuals?.shape === 'box' &&
          !isExplicitPrimitiveCube))
    ) {
      return <SemanticProceduralFallback entity={entity} isSelected={isSelected} isHovered={isHovered} />;
    }

    const shape = entity.visuals?.shape || (isZone ? 'box' : 'sphere');
    // Using Sci-Fi colors
    const defaultZoneColor = isPointed ? "#00ffff" : "#0044ff";
    const defaultObjColor = isSelected ? "#ffaa00" : "#cccccc";
    const color = entity.visuals?.color || (isZone ? defaultZoneColor : defaultObjColor);
    const materialProps = {
      color,
      roughness: entity.visuals?.roughness ?? 0.38,
      metalness: entity.visuals?.metalness ?? 0.22,
      transparent: isZone,
      opacity: isZone ? 0.18 : 1
    };

    const isPBR = Boolean(entity.visuals?.materialPreset || (entity.visuals?.textureUrl && entity.visuals.textureUrl.startsWith('pbr:')));
    const pbrPresetId = entity.visuals?.materialPreset || (entity.visuals?.textureUrl ? entity.visuals.textureUrl.replace('pbr:', '') : undefined);

    const Material = isPBR
      ? (
        <PBRMaterial
          presetId={pbrPresetId}
          color={entity.visuals?.color}
          roughness={entity.visuals?.roughness}
          metalness={entity.visuals?.metalness}
          clearcoat={entity.visuals?.clearcoat}
          repeat={entity.visuals?.repeat}
        />
      )
      : entity.visuals?.textureUrl 
      ? (
        <ModelErrorBoundary fallback={<meshPhysicalMaterial {...materialProps} />}>
          <React.Suspense fallback={<meshPhysicalMaterial {...materialProps} />}>
            <TexturedMaterial url={entity.visuals.textureUrl} color={materialProps.color} />
          </React.Suspense>
        </ModelErrorBoundary>
      )
      : <meshPhysicalMaterial {...materialProps} />;

    if (shape === 'box') {
      const boxDims: [number, number, number] = isZone
        ? [3, 0.2, 3]
        : (entity.physicalProperties?.dimensions
            ? [entity.physicalProperties.dimensions[0], entity.physicalProperties.dimensions[1], entity.physicalProperties.dimensions[2]]
            : [1, 1, 1]);
      const offsetY = isZone ? 0 : boxDims[1] / 2;
      return (
        <group position={[0, offsetY, 0]}>
          <RoundedBox args={boxDims} radius={0.035} smoothness={4} castShadow={!isZone} receiveShadow>
            {Material}
            {(isZone || isSelected) && <Edges color={isSelected ? "#bd8d49" : "#528f90"} />}
          </RoundedBox>
        </group>
      );
    } else if (shape === 'cylinder') {
      const cylRadius = entity.physicalProperties?.dimensions ? entity.physicalProperties.dimensions[0] / 2 : 0.3;
      const cylHeight = entity.physicalProperties?.dimensions ? entity.physicalProperties.dimensions[1] : 0.8;
      return (
        <group position={[0, isZone ? 0 : cylHeight / 2, 0]}>
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[cylRadius, cylRadius, cylHeight, 48]} />
            {Material}
            {isSelected && <Edges color="#bd8d49" />}
          </mesh>
        </group>
      );
    }
    
    return (
      <Sphere args={[0.25, 48, 48]} castShadow receiveShadow>
        {Material}
      </Sphere>
    );
  };

  const isSimulating = useWorldStore(s => s.isSimulating);
  const rigidBodyType = isZone
    ? "fixed"
    : (isThisEntityDragging
        ? "kinematicPosition"
        : (isSimulating && isDraggable ? "dynamic" : "fixed"));

  const lastCollisionTimeRef = React.useRef<Map<string, number>>(new Map());

  const handleCollision = (e: any) => {
    // Only dispatch if physics is running and entity is not being dragged
    if (!isSimulating || isThisEntityDragging || isDragging3D) return;
    
    // We only care about collisions with other named entities
    const otherId = e.other.rigidBodyObject?.name;
    if (otherId && otherId !== entity.id) {
      const pairKey = [entity.id, otherId].sort().join('::');
      const now = Date.now();
      const last = lastCollisionTimeRef.current.get(pairKey) || 0;
      if (now - last < 600) return;
      lastCollisionTimeRef.current.set(pairKey, now);

      // CRITICAL: Defer dispatch out of Rapier's world.step() callstack to avoid unsafe aliasing in rust
      setTimeout(() => {
        dispatch({
          type: 'COLLISION',
          sourceId: entity.id,
          targetId: otherId,
          payload: { force: e.totalForceMagnitude || 0 }
        });
      }, 0);
    }
  };


  const isFireplace = lowerName.includes('fireplace') || lowerUrl.includes('fireplace') || lowerName.includes('cheminee') || lowerName.includes('cheminée');
  const isCandle = lowerName.includes('candle') || lowerUrl.includes('candle') || lowerName.includes('bougie');
  const isHelmet = lowerName.includes('helmet') || lowerUrl.includes('helmet') || lowerName.includes('casque');

  const flags = useWorldStore(s => s.world.flags || {});
  const isPrepped = Object.entries(flags).some(([k, v]) => k.includes('_prepped') && v);
  const isCooked = Object.entries(flags).some(([k, v]) => k.includes('_cooked') && v);

  const innerContent = (
    <group
      position={dragOffset ? [dragOffset.x, dragOffset.y, dragOffset.z] : [0, 0, 0]}
      scale={scale}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onDoubleClick={handleDoubleClick}
      onPointerOver={handleMeshPointerOver}
      onPointerOut={handleMeshPointerOut}
    >
      <group ref={animRef}>
        {isIngredient && sliceLevel >= 3 ? (
          <ChoppedVeggiesCluster
            ingredients={[{ id: entity.id, name: entity.name, assetId: entity.visuals?.assetId || '' }]}
            stage={3}
          />
        ) : (
          <group scale={isIngredient && sliceLevel === 2 ? [0.55, 0.55, 0.55] : isIngredient && sliceLevel === 1 ? [0.78, 0.78, 0.78] : [1, 1, 1]}>
            {renderShape()}
            {isIngredient && sliceLevel > 0 && (
              <ChoppedVeggiesCluster
                ingredients={[{ id: entity.id, name: entity.name, assetId: entity.visuals?.assetId || '' }]}
                stage={sliceLevel}
              />
            )}
          </group>
        )}
        {animatedCap?.animationType === 'steaming' && <CulinarySteamPuffs />}
        {isBoard && (isPrepped || ingredientsOnBoard.length > 0) && (
          <ChoppedVeggiesCluster ingredients={ingredientsOnBoard} stage={boardStage} />
        )}
        {(isCocotte || isPoele) && (isCooked || animatedCap?.animationType === 'steaming' || ingredientsInPot.length > 0) && (
          <SimmeringLiquidSurface isPan={isPoele} ingredients={ingredientsInPot} />
        )}
        {(isCocotte || isPoele) && (
          <>
            <CookwareThermalBurner isPan={isPoele} />
            <SeasoningParticleCascade />
          </>
        )}
        {isPlate && (isDishPlated || isCooked) && (
          <PlatedDishPresentation isPlated={isDishPlated || isCooked} />
        )}
      </group>
      {/* Proxy invisible de clic et survol calibré pour faciliter la sélection des petits objets (beurre, oignon, épices, dés, etc.) */}
      {!isZone && !isFixed && (() => {
        const meta = getAsset(entity.visuals?.assetId);
        const rawW = meta?.size?.[0] || entity.physicalProperties?.dimensions?.[0] || 0.16;
        const rawH = meta?.size?.[1] || entity.physicalProperties?.dimensions?.[1] || 0.14;
        const rawD = meta?.size?.[2] || entity.physicalProperties?.dimensions?.[2] || 0.16;

        // Boîte d'atteinte confortable (22-38 cm max pour ne pas empiéter sur les voisins ni s'enfoncer sous la table)
        const hitW = Math.max(0.22, Math.min(0.42, rawW * 1.4));
        const hitH = Math.max(0.18, Math.min(0.36, rawH * 1.4));
        const hitD = Math.max(0.22, Math.min(0.42, rawD * 1.4));

        return (
          <mesh
            position={[0, hitH * 0.5, 0]}
            onClick={handleClick}
            onPointerDown={handlePointerDown}
            onPointerOver={handleMeshPointerOver}
            onPointerOut={handleMeshPointerOut}
          >
            <boxGeometry args={[hitW, hitH, hitD]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
        );
      })()}
      {isThisEntityDragging && (
        <>
          {/* 1. Halo néon filaire / boîte englobante dynamique */}
          <mesh>
            <boxGeometry args={[
              (getAsset(entity.visuals?.assetId)?.size?.[0] || scl.x || 0.6) * 1.08,
              (getAsset(entity.visuals?.assetId)?.size?.[1] || scl.y || 0.6) * 1.08,
              (getAsset(entity.visuals?.assetId)?.size?.[2] || scl.z || 0.6) * 1.08
            ]} />
            <meshBasicMaterial
              color={snappedTargetId ? "#10b981" : "#06b6d4"}
              wireframe
              transparent
              opacity={0.4}
            />
          </mesh>

          {/* 2. Disque d'empreinte et ombre portée au sol */}
          <group position={[0, -(pos.y + (dragOffset?.y || 0)) + 0.015, 0]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.20, 0.26, 32]} />
              <meshBasicMaterial color={snappedTargetId ? "#10b981" : "#06b6d4"} transparent opacity={0.7} depthWrite={false} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.07, 24]} />
              <meshBasicMaterial color={snappedTargetId ? "#34d399" : "#22d3ee"} transparent opacity={0.5} depthWrite={false} />
            </mesh>
          </group>
        </>
      )}
      {isThisEntityDragging && dragOffset && snappedTargetId && currentDragTarget.current && (() => {
        const tPos = currentDragTarget.current.capabilities.find(c => c.type === 'transform')?.position;
        if (!tPos) return null;
        const dx = tPos.x - (pos.x + dragOffset.x);
        const dy = (tPos.y + 0.05) - (pos.y + dragOffset.y);
        const dz = tPos.z - (pos.z + dragOffset.z);
        return <MagneticTetherBeam targetOffset={[dx, dy, dz]} color="#10b981" />;
      })()}
      {isFireplace && <FireFlickerLight color="#ff5500" intensity={6} distance={14} position={[0, 0.9, 0.3]} />}
      {isCandle && <FireFlickerLight color="#ffaa33" intensity={2.2} distance={5} position={[0, 0.45, 0]} />}
      {isHelmet && <pointLight color="#dce8ec" intensity={0.3} distance={2} position={[0, 0.3, 0]} />}
      {/* Halo lumineux d'embase adaptatif au zoom et à la taille réelle de l'objet */}
      {isSelected && !isThisEntityDragging && !isZone && !isCustomFloorSlab && (
        <AdaptiveSelectionHalo
          entity={entity}
          scl={scl}
          isSelected={true}
          isHovered={false}
        />
      )}

      {/* Halo d'embase au survol (Feedback visuel d'affordance 3D) */}
      {isHovered && !isSelected && !isThisEntityDragging && !isZone && !isCustomFloorSlab && (
        <AdaptiveSelectionHalo
          entity={entity}
          scl={scl}
          isSelected={false}
          isHovered={true}
        />
      )}

      {(isHovered || isSelected) && !isThisEntityDragging && !isPointerPressed && (
        <group position={[0, (getAsset(entity.visuals?.assetId)?.size?.[1] || scl.y || 0.8) + 0.14, 0]}>
          {isBook ? (
            <WebResourceBeacon type="book" />
          ) : isComputer ? (
            <WebResourceBeacon type="computer" />
          ) : isPainting ? (
            <WebResourceBeacon type="art" />
          ) : isMusicPlayer ? (
            <WebResourceBeacon type="audio" />
          ) : isGlobe ? (
            <WebResourceBeacon type="globe" />
          ) : isBlueprint ? (
            <WebResourceBeacon type="blueprint" />
          ) : isMicroscope ? (
            <WebResourceBeacon type="microscope" />
          ) : isWebScreen ? (
            <WebResourceBeacon type="web" />
          ) : null}

          {/* Puce holographique interactive de ressource Web / PDF (masquée si l'objet est sélectionné pour éviter toute superposition avec la barre d'outils) */}
          {!isSelected && (entity.capabilities.some(c => c.type === 'web_screen' || (c.type === 'educational' && c.url))) && (
            <SpatialWebChip entity={entity} position={[0, 0.16, 0]} />
          )}
        </group>
      )}

      {isQuestTarget && (
        <QuestBeacon 
          color={
            activeQuest?.category === 'luxury' ? '#fbbf24' :
            activeQuest?.category === 'cuisine' ? '#f59e0b' : 
            '#10b981'
          } 
        />
      )}
      {isQuestTarget && !isPointerPressed && !isThisEntityDragging && !showResearchDashboardModal && (
        <Html
          position={[0, Math.min(0.40, (getAsset(entity.visuals?.assetId)?.size?.[1] || 0.4) * 0.5 + 0.15), 0]}
          center
          zIndexRange={[40, 0]}
          style={{ pointerEvents: 'auto' }}
        >
          <div 
            className="quest-target-indicator"
            onPointerEnter={handleBadgePointerEnter}
            onPointerLeave={handleBadgePointerLeave}
            style={{
              background: activeQuest?.category === 'luxury' ? 'rgba(217, 119, 6, 0.94)' : 'rgba(15, 23, 42, 0.94)',
              borderColor: activeQuest?.category === 'luxury' ? '#fbbf24' : isHovered ? '#38bdf8' : '#06b6d4',
              boxShadow: activeQuest?.category === 'luxury' 
                ? '0 4px 15px rgba(0,0,0,0.5), 0 0 10px rgba(251, 191, 36, 0.4)' 
                : isHovered
                  ? '0 6px 20px rgba(0,0,0,0.6), 0 0 16px rgba(56, 189, 248, 0.6)'
                  : '0 4px 15px rgba(0,0,0,0.5), 0 0 10px rgba(6, 182, 212, 0.4)',
              transform: isHovered ? 'scale(1.05)' : 'scale(1)',
              transition: 'all 0.15s ease',
              padding: '5px 12px',
              fontSize: '11px',
              fontWeight: 700,
              borderRadius: '20px',
              cursor: 'pointer',
              pointerEvents: 'auto',
              userSelect: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#f8fafc',
              whiteSpace: 'nowrap'
            }}
            onClick={(e) => {
              e.stopPropagation();
              playAudioFx('switch_click');
              const currentPointedId = useWorldStore.getState().spatialContext.pointedEntityId;
              setSpatialContext(entity.id, currentPointedId);
              const reqEv = currentQuestStep?.requiredEvent || '';
              if (reqEv.startsWith('DROP')) {
                const allEntitiesMap = useWorldStore.getState().world.ir.entities;
                const allEntitiesList = Object.values(allEntitiesMap);
                const sourceEnt = isZone
                  ? (currentQuestStep?.targetEntityId && allEntitiesMap[currentQuestStep.targetEntityId]
                      ? allEntitiesMap[currentQuestStep.targetEntityId]
                      : allEntitiesList.find(o => o.id !== entity.id && o.capabilities.some(c => c.type === 'draggable')) || null)
                  : entity;
                const targetZoneEnt = isZone
                  ? entity
                  : (currentQuestStep?.targetZoneId && allEntitiesMap[currentQuestStep.targetZoneId]
                      ? allEntitiesMap[currentQuestStep.targetZoneId]
                      : allEntitiesList.find(o => o.id !== entity.id && o.capabilities.some(c => c.type === 'trigger_zone')) || null);

                if (sourceEnt && targetZoneEnt && sourceEnt.id !== targetZoneEnt.id) {
                  const zPos = targetZoneEnt.capabilities.find(c => c.type === 'transform')?.position || { x: pos.x, y: pos.y, z: pos.z };
                  const supHeight = getSupportingSurfaceHeight(zPos.x, zPos.z, allEntitiesMap, sourceEnt.id);
                  const dropY = Number(((supHeight.surfaceY > 0 ? supHeight.surfaceY : zPos.y) + 0.04).toFixed(3));
                  playAudioFx('chime');
                  applyPatch(
                    {
                      entitiesChanged: [
                        {
                          id: sourceEnt.id,
                          capabilities: sourceEnt.capabilities.map(c =>
                            c.type === 'transform' ? { ...c, position: { x: zPos.x, y: dropY, z: zPos.z } } : c
                          )
                        }
                      ]
                    },
                    `Poser ${sourceEnt.name} sur ${targetZoneEnt.name}`,
                    { intent: `Poser ${sourceEnt.name} sur ${targetZoneEnt.name}`, recordUndo: true }
                  );
                  dispatch({
                    type: 'DROP',
                    sourceId: sourceEnt.id,
                    targetId: targetZoneEnt.id
                  });
                } else {
                  useWorldStore.setState(s => ({
                    warnings: [...s.warnings, `💡 ${currentQuestStep?.hint || 'Glissez cet objet maintenu au clic vers sa zone cible.'}`]
                  }));
                }
              } else {
                dispatch({ type: 'INTERACT', sourceId: entity.id });
              }

              const isConfig = entity.visuals?.assetId === 'wp-borne-configurateur' ||
                entity.id.toLowerCase().includes('configurateur') ||
                entity.name.toLowerCase().includes('configurateur') ||
                entity.name.toLowerCase().includes('console holographique') ||
                entity.id.toLowerCase().includes('console_holographique') ||
                (currentQuestStep?.title || '').toLowerCase().includes('configur');

              if (isConfig) {
                useWorldStore.getState().openSupercarConfigurator();
              } else if (reqEv.startsWith('INSPECT')) {
                useWorldStore.getState().setShowEntity2DDrawer(true);
              }
            }}
          >
            <span>
              {(() => {
                const reqEv = currentQuestStep?.requiredEvent || '';
                if (reqEv.startsWith('DROP')) {
                  const isDropSource = entity.id === currentQuestStep?.targetEntityId || reqEv.split(':')[1] === entity.id;
                  return isDropSource ? '🖐️ Glisser vers la zone cible' : '🎯 Zone de dépôt';
                }
                if (reqEv.startsWith('INTERACT') || reqEv.startsWith('CLICK')) {
                  const isConfig = (currentQuestStep?.title || '').toLowerCase().includes('configur') ||
                    entity.name.toLowerCase().includes('configur') ||
                    entity.name.toLowerCase().includes('console holographique');
                  if (isConfig) return '⚡ Cliquer pour configurer';
                  const stepLabel = currentQuestStep?.title || 'Cliquer pour interagir';
                  return `⚡ ${stepLabel.length > 28 ? stepLabel.slice(0, 26) + '…' : stepLabel}`;
                }
                return '🔍 Cliquer pour examiner';
              })()}
            </span>
          </div>
        </Html>
      )}

      {isSelected && !isCustomFloorSlab && !isDragging3D && !isThisEntityDragging && !isPointerPressed && !isZone && !isGamePiece && !showResearchDashboardModal && appMode === 'simulation' && (
        <Html
          position={[0, Math.min(0.35, (getAsset(entity.visuals?.assetId)?.size?.[1] || scl.y || 0.3) * 0.5 + 0.12), 0]}
          center
          zIndexRange={[55, 0]}
          style={{ pointerEvents: 'none' }}
        >
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.94)',
              backdropFilter: 'blur(10px)',
              border: '1.5px solid #38bdf8',
              borderRadius: '20px',
              padding: '4px 10px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.65), 0 0 14px rgba(56, 189, 248, 0.35)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#f8fafc',
              fontSize: '11px',
              fontWeight: 700,
              fontFamily: 'system-ui, sans-serif',
              whiteSpace: 'nowrap',
              pointerEvents: 'auto',
              userSelect: 'none'
            }}
          >
            <span>{entityCategoryInfo.icon}</span>
            <span>{entity.name}</span>

            {/* Action contextuelle de configuration ou d'interaction */}
            {(() => {
              const isConfig = entity.visuals?.assetId === 'wp-borne-configurateur' ||
                entity.id.toLowerCase().includes('configurateur') ||
                entity.name.toLowerCase().includes('configurateur') ||
                entity.name.toLowerCase().includes('console holographique') ||
                entity.id.toLowerCase().includes('console_holographique') ||
                entity.id.toLowerCase().includes('supercar') ||
                entity.name.toLowerCase().includes('supercar');

              if (isConfig) {
                return (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      playAudioFx('chime');
                      useWorldStore.getState().openSupercarConfigurator();
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                      border: '1px solid #38bdf8',
                      borderRadius: '6px',
                      color: '#ffffff',
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      boxShadow: '0 0 10px rgba(56, 189, 248, 0.4)'
                    }}
                    title="Ouvrir le configurateur officiel Victoria VR"
                  >
                    <span>⚙️</span>
                    <span>Configurer</span>
                  </button>
                );
              }

              if (isQuestTarget && currentQuestStep?.requiredEvent === 'INTERACT') {
                return (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      playAudioFx('switch_click');
                      dispatch({ type: 'INTERACT', sourceId: entity.id });
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      border: '1px solid #34d399',
                      borderRadius: '6px',
                      color: '#ffffff',
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      boxShadow: '0 0 10px rgba(16, 185, 129, 0.4)'
                    }}
                    title="Valider l'action de cette étape"
                  >
                    <span>⚡</span>
                    <span>Agir</span>
                  </button>
                );
              }

              return null;
            })()}

            {/* Lien Web si applicable */}
            {(() => {
              const webCap = entity.capabilities.find(c => c.type === 'web_screen' || c.url);
              if (webCap?.url) {
                return (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      useWorldStore.getState().openWebModal(webCap.url!, entity.name);
                    }}
                    style={{
                      background: 'rgba(14, 165, 233, 0.25)',
                      border: '1px solid #38bdf8',
                      borderRadius: '6px',
                      color: '#38bdf8',
                      fontSize: '10px',
                      fontWeight: 600,
                      padding: '2px 6px',
                      cursor: 'pointer'
                    }}
                    title="Ouvrir la page Web / ressource associée"
                  >
                    🌐 Ouvrir
                  </button>
                );
              }
              return null;
            })()}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                useWorldStore.getState().setShowEntity2DDrawer(true);
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '6px',
                color: '#e2e8f0',
                fontSize: '10px',
                fontWeight: 600,
                padding: '2px 6px',
                cursor: 'pointer'
              }}
              title="Ouvrir la fiche 2D de cet objet"
            >
              📄 Fiche 2D
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSpatialContext(null, null);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                fontSize: '11px',
                cursor: 'pointer',
                padding: '0 2px'
              }}
              title="Désélectionner"
            >
              ✕
            </button>
          </div>
        </Html>
      )}

      {isSelected && !isDragging3D && !isThisEntityDragging && !isPointerPressed && !isZone && !isGamePiece && !isWebScreen && !showResearchDashboardModal && appMode !== 'simulation' && (
        <Html
          position={[0, Math.min(0.42, (getAsset(entity.visuals?.assetId)?.size?.[1] || scl.y || 0.35) * 0.5 + 0.14), 0]}
          center
          zIndexRange={[50, 0]}
          style={{ pointerEvents: 'none' }}
        >
          <div
            className="entity-3d-selection-card"
            style={{
              pointerEvents: 'auto',
              transform: `translate(${screenDragOffset.x}px, ${screenDragOffset.y}px)`,
              minWidth: isMenuOpen ? '320px' : 'auto',
              maxWidth: '360px',
              padding: isMenuOpen ? '6px 8px' : '4px 6px',
              gap: isMenuOpen ? '4px' : '2px'
            }}
          >
            {/* Header compact avec Drag Handle & Bouton Menu Actions */}
            <div className="entity-3d-selection-header" style={{ borderBottom: isMenuOpen ? '1px solid rgba(255, 255, 255, 0.1)' : 'none', paddingBottom: isMenuOpen ? '4px' : '0' }}>
              {/* Grip de déplacement à la souris */}
              <span
                style={{
                  cursor: isCardDraggingRef.current ? 'grabbing' : 'grab',
                  userSelect: 'none',
                  padding: '2px 4px',
                  color: '#94a3b8',
                  fontSize: '12px',
                  lineHeight: 1,
                  borderRadius: '4px',
                  background: 'rgba(255,255,255,0.06)'
                }}
                title="Glisser pour déplacer librement cette fenêtre (Double-clic pour réinitialiser la position)"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  const target = e.currentTarget;
                  target.setPointerCapture(e.pointerId);
                  isCardDraggingRef.current = true;
                  cardDragOriginRef.current = {
                    mouseX: e.clientX,
                    mouseY: e.clientY,
                    startX: screenDragOffset.x,
                    startY: screenDragOffset.y,
                  };
                }}
                onPointerMove={(e) => {
                  if (!isCardDraggingRef.current) return;
                  e.stopPropagation();
                  const dx = e.clientX - cardDragOriginRef.current.mouseX;
                  const dy = e.clientY - cardDragOriginRef.current.mouseY;
                  setScreenDragOffset({
                    x: cardDragOriginRef.current.startX + dx,
                    y: cardDragOriginRef.current.startY + dy,
                  });
                }}
                onPointerUp={(e) => {
                  if (isCardDraggingRef.current) {
                    isCardDraggingRef.current = false;
                    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (_) {}
                  }
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setScreenDragOffset({ x: 0, y: 0 });
                }}
              >
                ⠿
              </span>

              <div className="entity-3d-selection-title">
                <span>{entityCategoryInfo.icon}</span>
                <span title={entity.name}>{entity.name}</span>
              </div>
              {(() => {
                const webCap = entity.capabilities.find(c => c.type === 'web_screen' || c.url);
                if (webCap?.url) {
                  try {
                    const host = new URL(webCap.url).hostname.replace('www.', '').replace('fr.m.', '').replace('fr.', '');
                    return <span className="entity-3d-selection-url">{host}</span>;
                  } catch (_) {
                    return <span className="entity-3d-selection-url">web</span>;
                  }
                }
                return null;
              })()}

              {/* Bouton rapide Vue Éclatée si composants présents */}
              {entity.parts && entity.parts.length > 0 && (
                <button
                  type="button"
                  className="action-btn"
                  style={{
                    color: isExploded ? '#f59e0b' : '#fbbf24',
                    borderColor: isExploded ? 'rgba(245, 158, 11, 0.7)' : 'rgba(251, 191, 36, 0.5)',
                    background: isExploded ? 'rgba(245, 158, 11, 0.25)' : 'rgba(251, 191, 36, 0.12)',
                    fontWeight: 700,
                    padding: '2px 6px',
                    fontSize: '10px'
                  }}
                  title="Vue éclatée interactive des composants et points d'intérêt (Mindel §7)"
                  onClick={(e) => {
                    e.stopPropagation();
                    useWorldStore.getState().toggleExplodedView(entity.id);
                  }}
                >
                  💥 {isExploded ? 'Assembler' : 'Vue éclatée'}
                </button>
              )}

              {/* Bouton bascule Menu contextuel */}
              <button
                type="button"
                className="action-btn"
                style={{
                  background: isMenuOpen ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                  borderColor: isMenuOpen ? '#38bdf8' : 'rgba(255, 255, 255, 0.2)',
                  color: isMenuOpen ? '#38bdf8' : '#e2e8f0',
                  fontWeight: 600,
                  padding: '2px 7px',
                  fontSize: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px'
                }}
                title={isMenuOpen ? "Fermer le menu d'actions" : "Ouvrir le menu complet d'actions"}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(prev => !prev);
                }}
              >
                <span>📋 Menu</span>
                <span style={{ fontSize: '8px' }}>{isMenuOpen ? '▲' : '▼'}</span>
              </button>

              <button
                type="button"
                className="entity-3d-selection-close"
                onClick={(e) => {
                  e.stopPropagation();
                  setSpatialContext(null, null);
                }}
                title="Désélectionner [Échap]"
              >
                ✕
              </button>
            </div>

            {/* Action Contextuelle Majeure (Quête / Règle Interactive) au 1er plan */}
            {actionLabel && (
              <button
                type="button"
                className="entity-primary-quest-action-btn"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  border: '1px solid #34d399',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '5px 10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  width: '100%',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.35)',
                  marginTop: '4px'
                }}
                title="Exécuter l'action contextuelle"
                onClick={(e) => {
                  e.stopPropagation();
                  playAudioFx('switch_click');
                  dispatch({ type: 'INTERACT', sourceId: entity.id });
                }}
              >
                <span>{actionLabel}</span>
              </button>
            )}

            {/* Outils Spatiaux Essentiels (Ligne Standard Permanente) */}
            {isFixed ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginTop: '4px' }}>
                <span style={{ fontSize: '10px', color: '#94a3b8' }}>🔒 Objet statique</span>
                <button
                  type="button"
                  className="action-btn"
                  style={{ fontSize: '10px', padding: '3px 8px', background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.18)', color: '#f1f5f9' }}
                  title="Centrer la caméra sur cet élément [F]"
                  onClick={(e) => { e.stopPropagation(); focusEntity(entity.id); }}
                >
                  🎯 Focus
                </button>
              </div>
            ) : (
              <div className="entity-3d-action-toolbar" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                <button
                  type="button"
                  className="action-btn primary"
                  style={{
                    background: 'rgba(16, 185, 129, 0.22)',
                    border: '1px solid rgba(16, 185, 129, 0.65)',
                    color: '#6ee7b7',
                    fontWeight: 700,
                    padding: '3px 8px',
                    fontSize: '10.5px'
                  }}
                  title={isFr ? "Mode Déplacement : cliquez où poser cet objet [M ou D]" : "Placement mode: click where to place this object [M or D]"}
                  onClick={(e) => { e.stopPropagation(); startPlacementMode(entity.id); }}
                >
                  🖐️ {isFr ? 'Placer' : 'Place'}
                </button>
                <button
                  type="button"
                  className="action-btn"
                  style={{
                    background: gizmoMode !== 'off' ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                    border: gizmoMode !== 'off' ? '1px solid rgba(56, 189, 248, 0.6)' : '1px solid rgba(255, 255, 255, 0.18)',
                    color: gizmoMode !== 'off' ? '#38bdf8' : '#e2e8f0',
                    fontWeight: 600,
                    padding: '3px 8px',
                    fontSize: '10.5px'
                  }}
                  title="Gizmo 3D (W: Trans, E: Rot, Shift+G)"
                  onClick={(e) => { e.stopPropagation(); cycleGizmoMode(); }}
                >
                  📐 {gizmoMode === 'off' ? 'Gizmo' : gizmoMode === 'translate' ? '⇄ Trans' : '🔄 Rot'}
                </button>
                <button
                  type="button"
                  className="action-btn"
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                    color: '#f1f5f9',
                    fontWeight: 600,
                    padding: '3px 8px',
                    fontSize: '10.5px'
                  }}
                  title="Centrer la caméra sur cet objet [F ou Double-clic]"
                  onClick={(e) => { e.stopPropagation(); focusEntity(entity.id); }}
                >
                  🎯 Focus
                </button>
                <button
                  type="button"
                  className="action-btn"
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                    color: '#f1f5f9',
                    fontWeight: 600,
                    padding: '3px 8px',
                    fontSize: '10.5px'
                  }}
                  title={isFr ? "Poser au sol ou sur son meuble d'appui" : "Drop to ground or onto furniture surface"}
                  onClick={(e) => { e.stopPropagation(); groundEntity(entity.id); }}
                >
                  ⬇️ {isFr ? 'Poser' : 'Ground'}
                </button>
              </div>
            )}

            {/* Menu Déroulant Allégé : Outils secondaires & Utilitaires sans surcharge */}
            {isMenuOpen && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '6px', paddingTop: '6px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="action-btn"
                      style={{ color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.4)', fontSize: '10px', padding: '3px 7px' }}
                      title={isFr ? "Ouvrir la fiche 2D détaillée & accessibilité" : "Open detailed 2D spec sheet & accessibility"}
                      onClick={(e) => {
                        e.stopPropagation();
                        useWorldStore.getState().setShowEntity2DDrawer(true);
                      }}
                    >
                      📄 {isFr ? 'Fiche 2D' : '2D Specs'}
                    </button>
                    <button
                      type="button"
                      className="action-btn"
                      style={{ color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.45)', fontSize: '10px', padding: '3px 7px' }}
                      title={isFr ? "Changer le matériau PBR (Bois, Métal, Cuir...)" : "Change PBR material (Wood, Metal, Leather...)"}
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMaterialPicker(prev => !prev);
                      }}
                    >
                      🎨 PBR
                    </button>
                    {entity.availableStates && entity.availableStates.length > 0 && (
                      <button
                        type="button"
                        className="action-btn"
                        style={{ color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.4)', fontSize: '10px', padding: '3px 7px' }}
                        title={isFr ? `Bascule d'état (${entity.state || 'fermé'})` : `Toggle state (${entity.state || 'closed'})`}
                        onClick={(e) => {
                          e.stopPropagation();
                          useWorldStore.getState().toggleEntityState(entity.id);
                        }}
                      >
                        🔄 {entity.state === 'open' ? (isFr ? 'Fermer' : 'Close') : (isFr ? 'Ouvrir' : 'Open')}
                      </button>
                    )}
                    {entity.parts && entity.parts.length > 0 && (
                      <button
                        type="button"
                        className="action-btn"
                        style={{
                          color: isExploded ? '#f59e0b' : '#fbbf24',
                          borderColor: isExploded ? 'rgba(245, 158, 11, 0.6)' : 'rgba(251, 191, 36, 0.4)',
                          fontSize: '10px',
                          padding: '3px 7px'
                        }}
                        title={isFr ? "Vue éclatée des sous-parties" : "Exploded view of sub-parts"}
                        onClick={(e) => {
                          e.stopPropagation();
                          useWorldStore.getState().toggleExplodedView(entity.id);
                        }}
                      >
                        💥 {isExploded ? (isFr ? 'Réassembler' : 'Reassemble') : (isFr ? 'Vue éclatée' : 'Explode')}
                      </button>
                    )}
                    <button
                      type="button"
                      className="action-btn"
                      style={{ fontSize: '10px', padding: '3px 7px' }}
                      title={isFr ? "Dupliquer cet objet [Alt+D]" : "Duplicate this object [Alt+D]"}
                      onClick={(e) => {
                        e.stopPropagation();
                        duplicateEntity(entity.id);
                      }}
                    >
                      ⧉ {isFr ? 'Copier' : 'Duplicate'}
                    </button>
                  </div>
                  <button
                    type="button"
                    className="action-btn danger"
                    style={{ fontSize: '10px', padding: '3px 7px' }}
                    title={isFr ? "Supprimer cet objet [Suppr]" : "Delete this object [Delete]"}
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteEntity(entity.id);
                    }}
                  >
                    🗑️ {isFr ? 'Supprimer' : 'Delete'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {showMaterialPicker && (
            <div 
              style={{
                marginTop: '8px',
                background: 'rgba(15, 23, 42, 0.95)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(245, 158, 11, 0.5)',
                borderRadius: '12px',
                padding: '10px',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '6px',
                boxShadow: '0 16px 36px rgba(0,0,0,0.85)',
                minWidth: '280px',
                maxWidth: '340px'
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ gridColumn: 'span 3', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#f59e0b' }}>✨ MATÉRIAUX PBR PRÉ-CALIBRÉS</span>
                <span style={{ fontSize: '10px', color: '#94a3b8' }}>Normal Map & Rugosité</span>
              </div>
              <button
                type="button"
                style={{
                  background: !entity.visuals?.materialPreset && !entity.visuals?.textureUrl ? 'rgba(56, 189, 248, 0.25)' : 'rgba(30, 41, 59, 0.8)',
                  border: !entity.visuals?.materialPreset && !entity.visuals?.textureUrl ? '1.5px solid #38bdf8' : '1px solid rgba(148, 163, 184, 0.2)',
                  borderRadius: '8px',
                  padding: '6px 4px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '3px',
                  cursor: 'pointer',
                  color: '#f8fafc',
                  transition: 'all 0.15s ease'
                }}
                title="Rétablir les textures et matériaux d'origine de l'objet"
                onClick={() => {
                  applyPatch({
                    entitiesChanged: [{
                      id: entity.id,
                      visuals: {
                        ...entity.visuals,
                        materialPreset: undefined,
                        textureUrl: undefined,
                        roughness: undefined,
                        metalness: undefined
                      }
                    }]
                  }, `Textures d'origine sur ${entity.name}`);
                  playAudioFx('switch_click');
                  setShowMaterialPicker(false);
                }}
              >
                <span style={{ fontSize: '16px' }}>🔄</span>
                <span style={{ fontSize: '9px', fontWeight: 600, textAlign: 'center', lineHeight: 1.15 }}>D'origine</span>
              </button>
              {getAllPBRMaterialPresets().map(preset => {
                const isCurrent = (entity.visuals?.materialPreset === preset.id) || (entity.visuals?.textureUrl === `pbr:${preset.id}`);
                return (
                  <button
                    key={preset.id}
                    type="button"
                    style={{
                      background: isCurrent ? 'rgba(245, 158, 11, 0.25)' : 'rgba(30, 41, 59, 0.8)',
                      border: isCurrent ? '1.5px solid #f59e0b' : '1px solid rgba(148, 163, 184, 0.2)',
                      borderRadius: '8px',
                      padding: '6px 4px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '3px',
                      cursor: 'pointer',
                      color: '#f8fafc',
                      transition: 'all 0.15s ease'
                    }}
                    title={preset.description}
                    onClick={() => {
                      applyPatch({
                        entitiesChanged: [{
                          id: entity.id,
                          visuals: {
                            ...entity.visuals,
                            materialPreset: preset.id,
                            textureUrl: `pbr:${preset.id}`,
                            color: preset.defaultColor,
                            roughness: preset.roughness,
                            metalness: preset.metalness,
                            clearcoat: preset.clearcoat,
                            repeat: preset.defaultRepeat
                          }
                        }]
                      }, `Matériau ${preset.name} sur ${entity.name}`);
                      playAudioFx(preset.category === 'natural' ? 'impact_wood' : preset.category === 'industrial' ? 'impact_metal' : 'impact_stone');
                      setShowMaterialPicker(false);
                    }}
                  >
                    <span style={{ fontSize: '16px' }}>{preset.icon}</span>
                    <span style={{ fontSize: '9px', fontWeight: 600, textAlign: 'center', lineHeight: 1.15 }}>{preset.name.split(' ')[0]} {preset.name.split(' ')[1] || ''}</span>
                  </button>
                );
              })}
            </div>
          )}
        </Html>
      )}

      {isQuiz && (isHovered || isSelected) && !isPointerPressed && !isThisEntityDragging && !showResearchDashboardModal && (
          <Html
            position={[0, (getAsset(entity.visuals?.assetId)?.size[1] || 1) + 0.5, 0]}
            center
            zIndexRange={[70, 0]}
            style={{ pointerEvents: 'auto' }}
          >
            <div style={{
              background: 'rgba(15, 23, 42, 0.94)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(245, 158, 11, 0.5)',
              borderRadius: '12px',
              padding: '10px 14px',
              boxShadow: '0 12px 30px rgba(0, 0, 0, 0.65), 0 0 16px rgba(245, 158, 11, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              minWidth: '200px',
              maxWidth: '260px',
              textAlign: 'center',
              userSelect: 'none',
              fontFamily: 'system-ui, sans-serif'
            }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                🎓 Quiz Culinaire
              </div>
              <div style={{ fontSize: '11px', color: '#e2e8f0', lineHeight: 1.35, fontWeight: 600 }}>
                {quizCap?.text ? quizCap.text.split('\n')[0] : 'Choisissez la bonne réponse :'}
              </div>
              {quizCap?.text && quizCap.text.split('\n').length > 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', textAlign: 'left', margin: '4px 0', padding: '0 4px' }}>
                  {quizCap.text.split('\n').slice(1).map((opt: string, i: number) => (
                    <div key={i} style={{ fontSize: '10px', color: '#cbd5e1', lineHeight: 1.25 }}>
                      {opt}
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '4px' }}>
                {(['A', 'B', 'C'] as const).map(ans => (
                  <button
                    key={ans}
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(245, 158, 11, 0.4)',
                      color: '#fbbf24',
                      borderRadius: '8px',
                      padding: '5px 12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onPointerEnter={e => (e.currentTarget.style.background = 'rgba(245, 158, 11, 0.35)')}
                    onPointerLeave={e => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)')}
                    onClick={(e) => {
                      e.stopPropagation();
                      const isCorrect = ans === quizCap?.correctAnswer;
                      if (isCorrect) {
                        playAudioFx('fanfare');
                        dispatch({
                          type: 'ANSWER_CORRECT',
                          sourceId: entity.id,
                          payload: { answer: ans }
                        });
                        useWorldStore.setState(s => ({
                          warnings: [...s.warnings, `🎉 Réponse ${ans} exacte ! Quiz validé avec brio.`]
                        }));
                      } else {
                        playAudioFx('game_over');
                        dispatch({
                          type: 'ANSWER_INCORRECT',
                          sourceId: entity.id,
                          payload: { answer: ans }
                        });
                        useWorldStore.setState(s => ({
                          warnings: [...s.warnings, `❌ Réponse ${ans} incorrecte. Réessayez une autre réponse !`]
                        }));
                      }
                    }}
                  >
                    {ans}
                  </button>
                ))}
              </div>
            </div>
          </Html>
        )}

        {/* Discrete, compact hover chip for dense puzzle pieces & board game pieces to prevent swarm occlusions */}
        {isHovered && isGamePiece && !isSelected && !isThisEntityDragging && !isPointerPressed && !showResearchDashboardModal && (
          <Html position={[0, Math.max(0.18, (scl.y || 0.05) + 0.08), 0]} center zIndexRange={[65, 0]} style={{ pointerEvents: 'none' }}>
            <div style={{
              background: 'rgba(15, 23, 42, 0.95)',
              border: entity.name?.toLowerCase().includes('noir') ? '1.5px solid #64748b' : entity.name?.toLowerCase().includes('blanc') ? '1.5px solid #e2e8f0' : '1.5px solid #06b6d4',
              boxShadow: '0 0 12px rgba(0, 0, 0, 0.6)',
              borderRadius: '8px',
              padding: '3px 8px',
              color: '#f8fafc',
              fontSize: '11px',
              fontWeight: 700,
              fontFamily: 'system-ui, sans-serif',
              whiteSpace: 'nowrap',
              userSelect: 'none',
              pointerEvents: 'none'
            }}>
              {entity.name?.toLowerCase().includes('noir') ? '⚫' : entity.name?.toLowerCase().includes('blanc') || entity.name?.toLowerCase().includes('pierre') ? '⚪' : '🧩'} {entity.name}
            </div>
          </Html>
        )}

        {isHovered && !isDragging3D && !isGamePiece && !isSelected && !isQuiz && !isThisEntityDragging && !isPointerPressed && !snappedTargetId && !showResearchDashboardModal && (
          <Html
            position={[0, Math.min(0.60, (getAsset(entity.visuals?.assetId)?.size[1] || (isZone ? 0.35 : 0.4)) * 0.5 + (isQuestTarget ? 0.32 : 0.14)), 0]}
            center
            zIndexRange={[70, 0]}
            style={{ pointerEvents: 'none' }}
          >
            <div
              className="entity-hover-tag"
              style={{ pointerEvents: 'auto', cursor: 'pointer' }}
              onPointerEnter={handleBadgePointerEnter}
              onPointerLeave={handleBadgePointerLeave}
              onClick={(e) => {
                e.stopPropagation();
                handleClick(e);
              }}
            >
              <div className="entity-hover-tag-header">
                <div className="entity-hover-tag-title">
                  <span>{entityCategoryInfo.icon}</span>
                  <span>{entity.name}</span>
                </div>
                <span
                  className="entity-hover-tag-badge"
                  style={{
                    backgroundColor: `${entityCategoryInfo.color}22`,
                    color: entityCategoryInfo.color,
                    border: `1px solid ${entityCategoryInfo.color}55`
                  }}
                >
                  {isZone ? 'Zone d’interaction' : entityCategoryInfo.shortLabel}
                </span>
              </div>

              {/* Status pills based on real-time spatial context */}
              {isInsideCookware && (
                <div className="entity-hover-tag-status simmering">
                  <span>🔥 En mijotage</span>
                  <span style={{ fontSize: '8.5px', opacity: 0.85 }}>• Cuisson active</span>
                </div>
              )}
              {isOnBoard && (
                <div className="entity-hover-tag-status prepped">
                  <span>🔪 {isIngredient ? `Découpe : ${sliceLevel === 0 ? 'Entier' : sliceLevel === 1 ? 'Tronçons' : sliceLevel === 2 ? 'Émincé' : 'Brunoise'} (${sliceLevel}/3)` : 'Sur la planche'}</span>
                  <span style={{ fontSize: '8.5px', opacity: 0.85 }}>• {isIngredient && sliceLevel >= 3 ? 'Cubes prêts pour cuisson' : 'Prêt pour découpe'}</span>
                </div>
              )}
              {ingredientsInPot.length > 0 && (
                <div className="entity-hover-tag-status pot-contents">
                  <span>🥘 Contient {ingredientsInPot.length} ingrédient{ingredientsInPot.length > 1 ? 's' : ''}</span>
                </div>
              )}
              {ingredientsOnBoard.length > 0 && (
                <div className="entity-hover-tag-status prepped">
                  <span>🥗 {ingredientsOnBoard.length} ingrédient{ingredientsOnBoard.length > 1 ? 's' : ''} à découper</span>
                </div>
              )}
              {isPlate && isDishPlated && (
                <div className="entity-hover-tag-status pot-contents">
                  <span>🍽️ Dressage Gastronomique Terminé</span>
                </div>
              )}
              {isCooked && (
                <div className="entity-hover-tag-status pot-contents">
                  <span>✨ Plat cuisiné à point</span>
                </div>
              )}
              {isStirUtensil && (
                <div className="entity-hover-tag-status pot-contents">
                  <span>🥄 Prêt pour remuer la cocotte</span>
                </div>
              )}
              {isTableCutlery && (
                <div className="entity-hover-tag-status pot-contents">
                  <span>🍽️ Prêt pour le service de table</span>
                </div>
              )}
              {lowerName.includes('couteau') && (
                <div className="entity-hover-tag-status prepped">
                  <span>🔪 Prêt pour découpe sur planche</span>
                </div>
              )}
              {(isCocotte || isPoele) && <CookwareHoverStatus />}

              {/* Action buttons and gesture hints */}
              <div className="entity-hover-tag-actions">
                {(isCocotte || isPoele) && <CookwareHoverActions setCameraPreset={setCameraPreset} />}
                {(isStirUtensil || isCocotte || isPoele) && (
                  <button
                    className="entity-hover-action-btn action-stir"
                    onClick={(e) => {
                      e.stopPropagation();
                      playAudioFx('stir_whisk');
                      playAudioFx('bubbles');
                      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                        try { navigator.vibrate([25, 40, 25]); } catch (_) {}
                      }
                      if (typeof window !== 'undefined') {
                        window.dispatchEvent(new CustomEvent('worldpilot_stir_cookware', {
                          detail: { utensilId: isStirUtensil ? entity.id : undefined, timestamp: Date.now() }
                        }));
                        const cPos = (isCocotte || isPoele) ? pos : { x: 0, y: 0.98, z: 0 };
                        window.dispatchEvent(new CustomEvent('worldpilot_drop_impact', {
                          detail: { x: cPos.x, y: cPos.y + 0.08, z: cPos.z, type: 'splash' }
                        }));
                      }
                      dispatch({ type: 'INTERACT', sourceId: entity.id });
                    }}
                    title="Remuer vigoureusement la préparation culinaire"
                  >
                    <span>{lowerAsset.includes('fouet') || lowerName.includes('fouet') ? '🌪️ Fouetter' : '🌀 Remuer la cocotte'}</span>
                    <span className="entity-hover-badge-hint">Clic</span>
                  </button>
                )}
                {(isKnife || isBoard) && (
                  <button
                    className="entity-hover-action-btn action-chop"
                    onClick={(e) => {
                      e.stopPropagation();
                      playAudioFx('knife_chop');
                      useWorldStore.getState().chopIngredient();
                      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                        try { navigator.vibrate([25, 45, 25, 45, 25]); } catch (_) {}
                      }
                      if (typeof window !== 'undefined') {
                        window.dispatchEvent(new CustomEvent('worldpilot_chop_action', {
                          detail: { knifeId: isKnife ? entity.id : undefined, timestamp: Date.now() }
                        }));
                        window.dispatchEvent(new CustomEvent('worldpilot_drop_impact', {
                          detail: { x: pos.x, y: pos.y + 0.05, z: pos.z, type: 'sparkle' }
                        }));
                      }
                      dispatch({ type: 'INTERACT', sourceId: entity.id });
                    }}
                    title="Émincer finement les légumes sur la planche de découpe"
                  >
                    <span>🔪 Émincer les légumes</span>
                    <span className="entity-hover-badge-hint">Clic</span>
                  </button>
                )}
                {isIngredient && isOnBoard && (
                  <button
                    className="entity-hover-action-btn action-chop"
                    onClick={(e) => {
                      e.stopPropagation();
                      playAudioFx('knife_chop');
                      useWorldStore.getState().chopIngredient(entity.id);
                      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                        try { navigator.vibrate([25, 45, 25, 45, 25]); } catch (_) {}
                      }
                      if (typeof window !== 'undefined') {
                        window.dispatchEvent(new CustomEvent('worldpilot_chop_action', {
                          detail: { ingredientId: entity.id, timestamp: Date.now() }
                        }));
                        window.dispatchEvent(new CustomEvent('worldpilot_drop_impact', {
                          detail: { x: pos.x, y: pos.y + 0.05, z: pos.z, type: 'sparkle' }
                        }));
                      }
                      dispatch({ type: 'INTERACT', sourceId: entity.id });
                    }}
                    title="Découper ce légume en tranches et en dés sur la planche"
                  >
                    <span>🔪 {sliceLevel === 0 ? 'Couper' : sliceLevel === 1 ? 'Émincer' : sliceLevel === 2 ? 'En dés' : '✦ Brunoise'}</span>
                    <span className="entity-hover-badge-hint">
                      {sliceLevel}/3
                    </span>
                  </button>
                )}
                {(isKnife || isBoard) && (
                  <button
                    className="entity-hover-action-btn action-camera"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCameraPreset('chopping');
                      playAudioFx('tink');
                    }}
                    title="Cadrer la caméra sur le poste de découpe [5]"
                  >
                    <span>🎥 Vue Découpe</span>
                  </button>
                )}
                {isSalt && (
                  <button
                    className="entity-hover-action-btn action-season"
                    onClick={(e) => {
                      e.stopPropagation();
                      addSeasoning('salt', 25);
                      playAudioFx('sparkle');
                      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                        try { navigator.vibrate([20, 20, 20]); } catch (_) {}
                      }
                      if (typeof window !== 'undefined') {
                        window.dispatchEvent(new CustomEvent('worldpilot_pour_seasoning', {
                          detail: { entityId: entity.id, type: 'salt' }
                        }));
                        window.dispatchEvent(new CustomEvent('worldpilot_seasoning_event', {
                          detail: { type: 'salt', amount: 25 }
                        }));
                      }
                      dispatch({ type: 'INTERACT', sourceId: entity.id });
                    }}
                    title="Saupoudrer une pincée de fleur de sel de Guérande"
                  >
                    <span>🧂 Fleur de sel</span>
                    <span className="entity-hover-badge-hint">+25%</span>
                  </button>
                )}
                {isOil && (
                  <button
                    className="entity-hover-action-btn action-oil"
                    onClick={(e) => {
                      e.stopPropagation();
                      addSeasoning('oil', 25);
                      playAudioFx('pour_water');
                      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                        try { navigator.vibrate([30, 40]); } catch (_) {}
                      }
                      if (typeof window !== 'undefined') {
                        window.dispatchEvent(new CustomEvent('worldpilot_pour_seasoning', {
                          detail: { entityId: entity.id, type: 'oil' }
                        }));
                        window.dispatchEvent(new CustomEvent('worldpilot_seasoning_event', {
                          detail: { type: 'oil', amount: 25 }
                        }));
                      }
                      dispatch({ type: 'INTERACT', sourceId: entity.id });
                    }}
                    title="Verser un généreux filet d'huile d'olive de Provence"
                  >
                    <span>🫒 Filet d'huile</span>
                    <span className="entity-hover-badge-hint">+25%</span>
                  </button>
                )}
                {isHerbs && (
                  <button
                    className="entity-hover-action-btn action-herbs"
                    onClick={(e) => {
                      e.stopPropagation();
                      addSeasoning('herbs', 35);
                      playAudioFx('chime');
                      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                        try { navigator.vibrate([25, 30, 25]); } catch (_) {}
                      }
                      if (typeof window !== 'undefined') {
                        window.dispatchEvent(new CustomEvent('worldpilot_pour_seasoning', {
                          detail: { entityId: entity.id, type: 'herbs' }
                        }));
                        window.dispatchEvent(new CustomEvent('worldpilot_seasoning_event', {
                          detail: { type: 'herbs', amount: 35 }
                        }));
                      }
                      dispatch({ type: 'INTERACT', sourceId: entity.id });
                    }}
                    title="Plonger et infuser le bouquet garni dans la cocotte"
                  >
                    <span>🌿 Infuser le bouquet</span>
                    <span className="entity-hover-badge-hint">+35%</span>
                  </button>
                )}
                {(isPlate || ((isCocotte || isPoele) && (isCooked || ingredientsInPot.length > 0))) && !isDishPlated && (
                  <button
                    className="entity-hover-action-btn action-plate"
                    onClick={(e) => {
                      e.stopPropagation();
                      playAudioFx('chime');
                      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                        try { navigator.vibrate([35, 70, 35]); } catch (_) {}
                      }
                      setIsDishPlated(true);
                      if (typeof window !== 'undefined') {
                        window.dispatchEvent(new CustomEvent('worldpilot_drop_impact', {
                          detail: { x: pos.x, y: pos.y + 0.08, z: pos.z, type: 'sparkle' }
                        }));
                      }
                      useWorldStore.setState(s => ({
                        warnings: [...s.warnings, '🍽️ Le plat a été dressé avec élégance sur l\'assiette gastronomique !']
                      }));
                    }}
                    title="Dresser la préparation sur l'assiette gastronomique"
                  >
                    <span>🍽️ Dresser l'assiette</span>
                    <span className="entity-hover-badge-hint">Clic</span>
                  </button>
                )}
                {(isPlate && (isDishPlated || isCooked)) && (
                  <>
                    <button
                      className="entity-hover-action-btn action-taste"
                      onClick={(e) => {
                        e.stopPropagation();
                        playAudioFx('sparkle');
                        useWorldStore.getState().triggerTasting('fork');
                        setCameraPreset('plate');
                      }}
                      title="Animer la fourchette gastronomique en 3D et savourer une délicieuse bouchée"
                    >
                      <span>🍴 Savourer en 3D</span>
                      <span className="entity-hover-badge-hint">Bouchée</span>
                    </button>
                    <button
                      className="entity-hover-action-btn action-sauce"
                      onClick={(e) => {
                        e.stopPropagation();
                        playAudioFx('pour_water');
                        playAudioFx('sparkle');
                        useWorldStore.getState().toggleSauceDish();
                      }}
                      title="Napper le dôme gastronomique d'un élégant filet de réduction au jus"
                    >
                      <span>🥄 {useWorldStore.getState().isDishSauced ? 'Retirer nappage' : 'Napper de jus'}</span>
                      <span className="entity-hover-badge-hint">Sauce</span>
                    </button>
                    <button
                      className="entity-hover-action-btn action-taste"
                      onClick={(e) => {
                        e.stopPropagation();
                        playAudioFx('fanfare');
                        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                          try { navigator.vibrate([40, 80, 40]); } catch (_) {}
                        }
                        openDegustationModal();
                      }}
                      title="Consulter l'analyse sensorielle, la note gastronomique et l'accord mets-vins"
                    >
                      <span>🍷 Déguster ({getDishEvaluation().stars}★)</span>
                      <span className="entity-hover-badge-hint">
                        {getDishEvaluation().totalScore} pts
                      </span>
                    </button>
                  </>
                )}
                {isPlate && (
                  <button
                    className="entity-hover-action-btn action-camera"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCameraPreset('plate');
                      playAudioFx('tink');
                    }}
                    title="Cadrer la caméra sur l'assiette de dressage [4]"
                  >
                    <span>🎥 Vue Assiette</span>
                  </button>
                )}
                {hasInteraction && (
                  <button
                    className="entity-hover-action-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isWebScreen) {
                        const webCap = entity.capabilities.find(c => c.type === 'web_screen' || c.url);
                        const eduCap = entity.capabilities.find(c => c.type === 'educational');
                        const isCooking = entity.id.includes('recipe') || entity.name.toLowerCase().includes('recette');
                        const isSeminar = entity.id.includes('seminar') || entity.name.toLowerCase().includes('séminaire') || entity.visuals?.assetId === 'wall-screen';
                        const defaultUrl = isCooking 
                          ? 'https://fr.m.wikipedia.org/wiki/Ratatouille' 
                          : isSeminar
                          ? 'https://fr.m.wikipedia.org/wiki/R%C3%A9union_de_travail'
                          : 'https://fr.m.wikipedia.org/wiki/Gastronomie_fran%C3%A7aise';
                        const targetUrl = webCap?.url || eduCap?.url || defaultUrl;
                        useWorldStore.getState().openWebModal(targetUrl, entity.name, eduCap?.text, entity.id);
                        return;
                      }
                      if (isBook) {
                        const webCap = entity.capabilities.find(c => c.type === 'web_screen' || c.url);
                        const eduCap = entity.capabilities.find(c => c.type === 'educational');
                        const defaultPdfUrl = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
                        const targetUrl = webCap?.url || eduCap?.url || defaultPdfUrl;
                        useWorldStore.getState().openWebModal(targetUrl, `📖 ${entity.name || 'Livre Spatial & Document'}`, eduCap?.text, entity.id);
                        return;
                      }
                      if (isComputer) {
                        const webCap = entity.capabilities.find(c => c.type === 'web_screen' || c.url);
                        const eduCap = entity.capabilities.find(c => c.type === 'educational');
                        const defaultUrl = 'https://threejs.org/docs/';
                        const targetUrl = webCap?.url || eduCap?.url || defaultUrl;
                        useWorldStore.getState().openWebModal(targetUrl, `💻 ${entity.name || 'Terminal & Documentation 3D'}`, eduCap?.text, entity.id);
                        return;
                      }
                      if (isPainting) {
                        const webCap = entity.capabilities.find(c => c.type === 'web_screen' || c.url);
                        const eduCap = entity.capabilities.find(c => c.type === 'educational');
                        const defaultUrl = 'https://fr.m.wikipedia.org/wiki/Mus%C3%A9e_du_Louvre';
                        const targetUrl = webCap?.url || eduCap?.url || defaultUrl;
                        useWorldStore.getState().openWebModal(targetUrl, `🎨 ${entity.name || 'Galerie d’Art & Musée'}`, eduCap?.text, entity.id);
                        return;
                      }
                      if (isMusicPlayer) {
                        useWorldStore.getState().toggleAmbientAudio();
                        playAudioFx('chime');
                        const isActive = useWorldStore.getState().isAmbientAudioActive;
                        useWorldStore.setState(s => ({
                          warnings: [...s.warnings, isActive ? '📻 Radio Spatiale allumée : diffusion de l’ambiance sonore relaxante !' : '📻 Radio Spatiale éteinte.']
                        }));
                        return;
                      }
                      if (isGlobe) {
                        const webCap = entity.capabilities.find(c => c.type === 'web_screen' || c.url);
                        const defaultUrl = 'https://fr.m.wikipedia.org/wiki/Terre';
                        const targetUrl = webCap?.url || defaultUrl;
                        useWorldStore.getState().openWebModal(targetUrl, `🌍 ${entity.name || 'Atlas & Globe Mondial'}`);
                        return;
                      }
                      if (isBlueprint) {
                        const webCap = entity.capabilities.find(c => c.type === 'web_screen' || c.url);
                        const defaultUrl = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
                        const targetUrl = webCap?.url || defaultUrl;
                        useWorldStore.getState().openWebModal(targetUrl, `📁 ${entity.name || 'Dossier Technique & Plans'}`);
                        return;
                      }
                      if (isAudio) {
                        const eduCap = entity.capabilities.find(c => c.type === 'educational');
                        if (eduCap?.text && typeof window !== 'undefined' && 'speechSynthesis' in window) {
                          if (!ambientAudio.isAudioMuted() && ambientAudio.getEffectiveVolume() > 0.01) {
                            window.speechSynthesis.cancel();
                            const utterance = new SpeechSynthesisUtterance(eduCap.text);
                            utterance.volume = ambientAudio.getEffectiveVolume();
                            utterance.lang = 'fr-FR';
                            utterance.rate = 1.0;
                            window.speechSynthesis.speak(utterance);
                          }
                        }
                        return;
                      }
                      dispatch({ type: 'INTERACT', sourceId: entity.id });
                    }}
                    title="Cliquer pour déclencher l'action"
                  >
                    <span>{actionLabel || '⚡ Interagir'}</span>
                    <span className="entity-hover-badge-hint">Clic</span>
                  </button>
                )}
                {isDraggable && (
                  <div className="entity-hover-tag-hint">
                    <span>✋</span>
                    <span>Glisser pour déplacer et aimanter</span>
                  </div>
                )}
              </div>
            </div>
          </Html>
        )}
        
        {showLabels && !isFurnitureOrSupport && !isHovered && !isPointerPressed && !isThisEntityDragging && (
          <Html position={[0, entity.visuals?.assetId ? (getAsset(entity.visuals.assetId)?.size[1] || 1) + 0.15 : isZone ? 0.35 : 1.2, 0]} center zIndexRange={[30, 0]} style={{ pointerEvents: 'none' }}>
            <div className={`entity-label ${isSelected || isPointed ? 'selected' : ''}`}>
              <span />{entity.name}
            </div>
          </Html>
        )}
        {/* Mindel §7 & §8 : Vue Éclatée Interactive & Hotspots Sémantiques */}
        {isExploded && entity.parts && entity.parts.length > 0 && (
          <group name={`${entity.id}_exploded_parts`}>
            {entity.parts.map((part, pIdx) => {
              const angle = (pIdx / (entity.parts?.length || 1)) * Math.PI * 2;
              const radius = 0.58;
              const offsetX = Math.cos(angle) * radius;
              const offsetY = 0.15 + (pIdx * 0.18);
              const offsetZ = Math.sin(angle) * radius;
              const isPartSelected = selectedPartId === part.id;
              const pDims = part.fitsMaxDimensions || [0.20, 0.12, 0.15];

              return (
                <group key={part.id} position={[offsetX, offsetY, offsetZ]}>
                  {/* Ligne reliant le centre de l'objet logique à la sous-partie */}
                  <line>
                    <bufferGeometry attach="geometry" {...(() => {
                      const geom = new THREE.BufferGeometry();
                      const vertices = new Float32Array([
                        -offsetX, -offsetY, -offsetZ,
                        0, 0, 0
                      ]);
                      geom.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
                      return geom;
                    })()} />
                    <lineBasicMaterial
                      attach="material"
                      color={isPartSelected ? '#818cf8' : '#64748b'}
                      opacity={0.65}
                      transparent
                    />
                  </line>

                  {/* Volume fantôme du composant / compartiment */}
                  <mesh>
                    <boxGeometry args={[pDims[0] * 0.7, pDims[1] * 0.7, pDims[2] * 0.7]} />
                    <meshStandardMaterial
                      color={isPartSelected ? '#6366f1' : '#38bdf8'}
                      transparent
                      opacity={isPartSelected ? 0.45 : 0.22}
                      wireframe={!isPartSelected}
                      roughness={0.3}
                    />
                  </mesh>

                  {/* Hotspot sémantique interactif */}
                  <Html position={[0, (pDims[1] * 0.7) / 2 + 0.12, 0]} center distanceFactor={7} zIndexRange={[120, 0]}>
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPartId(isPartSelected ? null : part.id);
                        useWorldStore.getState().setShowEntity2DDrawer(true);
                        playAudioFx('switch_click');
                      }}
                      style={{
                        background: isPartSelected ? 'rgba(99, 102, 241, 0.95)' : 'rgba(15, 23, 42, 0.88)',
                        border: isPartSelected ? '2px solid #818cf8' : '1px solid rgba(255, 255, 255, 0.25)',
                        borderRadius: '16px',
                        padding: '3px 8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        color: '#ffffff',
                        fontSize: '10.5px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        boxShadow: isPartSelected ? '0 0 16px rgba(99, 102, 241, 0.8)' : '0 2px 8px rgba(0,0,0,0.5)',
                        transform: isPartSelected ? 'scale(1.08)' : 'scale(1)',
                        transition: 'all 0.2s ease',
                        userSelect: 'none',
                        whiteSpace: 'nowrap'
                      }}
                      title="Cliquer pour inspecter la notice et les accessoires de ce composant"
                    >
                      <span>{isPartSelected ? '🎯' : '🧩'}</span>
                      <span>{part.name}</span>
                      {part.capacityLiters && (
                        <span style={{ fontSize: '9px', background: 'rgba(255,255,255,0.2)', padding: '1px 4px', borderRadius: '4px' }}>
                          {part.capacityLiters}L
                        </span>
                      )}
                    </div>
                  </Html>
                </group>
              );
            })}
          </group>
        )}
      </group>
  );

  if (isZone) {
    return (
      <group
        name={entity.id}
        position={position}
        rotation={rotationTuple}
      >
        {innerContent}
      </group>
    );
  }

  const isStaticOrScreen = isFixed || isScreen;

  return (
    <ForwardRefRigidBody 
      ref={rigidBodyRef}
      name={entity.id}
      type={isFixed ? "fixed" : rigidBodyType} 
      position={position}
      rotation={rotationTuple}
      colliders={isStaticOrScreen ? false : "cuboid"}
      onCollisionEnter={isSimulating && !isFixed ? handleCollision : undefined}
      lockTranslations={isFixed}
      lockRotations={isFixed}
      canSleep={true}
    >
      {innerContent}
    </ForwardRefRigidBody>
  );
});

const SelectedEntityGizmo: React.FC = () => {
  const selectedId = useWorldStore(s => s.spatialContext.selectedEntityId);
  const gizmoMode = useWorldStore(s => s.gizmoMode);
  const entities = useWorldStore(s => s.world.ir.entities);
  const entity = selectedId ? entities[selectedId] : null;
  const applyPatch = useWorldStore(s => s.applyPatch);

  const groupRef = React.useRef<THREE.Group | null>(null);
  const [targetGroup, setTargetGroup] = React.useState<THREE.Group | null>(null);

  const transform = entity?.capabilities.find(c => c.type === 'transform');
  const pos = transform?.position || { x: 0, y: 0, z: 0 };
  const rot = transform?.rotation || { x: 0, y: 0, z: 0 };

  React.useEffect(() => {
    if (groupRef.current) {
      groupRef.current.position.set(pos.x, pos.y, pos.z);
      groupRef.current.rotation.set(rot.x || 0, rot.y || 0, rot.z || 0);
    }
  }, [selectedId, pos.x, pos.y, pos.z, rot.x, rot.y, rot.z]);

  if (!selectedId || !entity || !gizmoMode || gizmoMode === 'off' || isFixedStructuralFurniture(entity)) {
    return null;
  }

  return (
    <>
      <group
        ref={(el) => {
          groupRef.current = el;
          if (el && el !== targetGroup) setTargetGroup(el);
        }}
        position={[pos.x, pos.y, pos.z]}
        rotation={[rot.x || 0, rot.y || 0, rot.z || 0]}
      />
      {targetGroup && (
        <TransformControls
          object={targetGroup}
          mode={gizmoMode}
          size={0.65}
          onMouseDown={() => {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('worldpilot_lock_camera_controls', { detail: { locked: true } }));
            }
          }}
          onMouseUp={() => {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('worldpilot_lock_camera_controls', { detail: { locked: false } }));
            }
            if (groupRef.current) {
              const p = groupRef.current.position;
              const r = groupRef.current.rotation;
              const nextX = Number(p.x.toFixed(3));
              const nextY = Number(p.y.toFixed(3));
              const nextZ = Number(p.z.toFixed(3));
              const nextRx = Number(r.x.toFixed(3));
              const nextRy = Number(r.y.toFixed(3));
              const nextRz = Number(r.z.toFixed(3));

              applyPatch({
                entitiesChanged: [{
                  id: entity.id,
                  capabilities: entity.capabilities.map(c => c.type === 'transform' ? {
                    ...c,
                    position: { x: nextX, y: nextY, z: nextZ },
                    rotation: { x: nextRx, y: nextRy, z: nextRz }
                  } : c)
                }]
              }, `Ajustement spatial Gizmo 3D (${gizmoMode}) sur ${entity.name}`, {});
              playAudioFx('tink');
            }
          }}
        />
      )}
    </>
  );
};

const PlacementModeController: React.FC = () => {
  const placementModeEntityId = useWorldStore(s => s.placementModeEntityId);
  const completePlacement = useWorldStore(s => s.completePlacement);
  const cancelPlacementMode = useWorldStore(s => s.cancelPlacementMode);
  const entities = useWorldStore(s => s.world.ir.entities);
  const entity = placementModeEntityId ? entities[placementModeEntityId] : null;
  const { camera, gl } = useThree();

  const [targetPos, setTargetPos] = React.useState<{ x: number; y: number; z: number; surfaceName: string } | null>(null);
  const raycaster = React.useRef(new THREE.Raycaster());

  React.useEffect(() => {
    if (!placementModeEntityId) {
      setTargetPos(null);
      return;
    }

    const onPointerMove = (e: PointerEvent) => {
      const rect = gl.domElement.getBoundingClientRect();
      const ndcX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ndcY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.current.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);

      const allEntities = useWorldStore.getState().world.ir.entities;
      const placementEntity = placementModeEntityId ? allEntities[placementModeEntityId] : null;
      const isPlacingFloor = placementEntity ? isFloorFurniture(placementEntity) : false;

      let hitPos: { x: number; y: number; z: number; surfaceName: string } | null = null;

      if (!isPlacingFloor) {
        const supports = Object.values(allEntities).filter(ent => ent.id !== placementModeEntityId && isSupportEntity(ent));
        for (const sup of supports) {
          const sPos = sup.capabilities.find(c => c.type === 'transform')?.position;
          if (!sPos) continue;
          const supHeight = getSupportingSurfaceHeight(sPos.x, sPos.z, allEntities, placementModeEntityId);
          const planeY = supHeight.surfaceY > 0 ? supHeight.surfaceY : (sPos.y > 0.6 ? sPos.y : 0.912);

          const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -planeY);
          const hit = new THREE.Vector3();
          if (raycaster.current.ray.intersectPlane(plane, hit)) {
            const check = getSupportingSurfaceHeight(hit.x, hit.z, allEntities, placementModeEntityId);
            if (check.supportEntity?.id === sup.id) {
              hitPos = { x: hit.x, y: check.surfaceY + 0.015, z: hit.z, surfaceName: check.surfaceName };
              break;
            }
          }
        }
      }

      if (!hitPos) {
        const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const hit = new THREE.Vector3();
        if (raycaster.current.ray.intersectPlane(groundPlane, hit)) {
          if (isPlacingFloor) {
            hitPos = {
              x: hit.x,
              y: 0,
              z: hit.z,
              surfaceName: 'le sol'
            };
          } else {
            const check = getSupportingSurfaceHeight(hit.x, hit.z, allEntities, placementModeEntityId);
            hitPos = {
              x: hit.x,
              y: check.isGround ? 0 : check.surfaceY + 0.015,
              z: hit.z,
              surfaceName: check.isGround ? 'le sol' : check.surfaceName
            };
          }
        }
      }

      if (hitPos) {
        setTargetPos(hitPos);
      }
    };

    const onPointerDown = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('button, input, a, select')) return;
      if (e.button === 2) {
        // Clic droit = annuler
        e.preventDefault();
        e.stopPropagation();
        cancelPlacementMode();
        return;
      }
      if (targetPos && e.button === 0) {
        e.stopPropagation();
        completePlacement(targetPos.x, targetPos.y, targetPos.z);
      }
    };

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      cancelPlacementMode();
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerdown', onPointerDown, { capture: true });
    window.addEventListener('contextmenu', onContextMenu);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown, { capture: true });
      window.removeEventListener('contextmenu', onContextMenu);
    };
  }, [placementModeEntityId, targetPos, camera, gl, completePlacement, cancelPlacementMode]);

  if (!placementModeEntityId || !entity || !targetPos) return null;

  return (
    <group position={[targetPos.x, targetPos.y, targetPos.z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <ringGeometry args={[0.22, 0.28, 36]} />
        <meshBasicMaterial color="#10b981" transparent opacity={0.85} depthWrite={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]}>
        <circleGeometry args={[0.21, 32]} />
        <meshBasicMaterial color="#059669" transparent opacity={0.25} depthWrite={false} />
      </mesh>
      <Html position={[0, 0.35, 0]} center zIndexRange={[100, 0]} style={{ pointerEvents: 'none' }}>
        <div style={{
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(8px)',
          border: '1.5px solid #10b981',
          borderRadius: '20px',
          padding: '4px 12px',
          color: '#ffffff',
          fontSize: '11px',
          fontWeight: 700,
          whiteSpace: 'nowrap',
          boxShadow: '0 8px 24px rgba(0,0,0,0.6), 0 0 16px rgba(16, 185, 129, 0.5)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          userSelect: 'none'
        }}>
          <span>🖐️ Clic pour poser sur {targetPos.surfaceName}</span>
        </div>
      </Html>
    </group>
  );
};

const SpatialKeyboardNavigator: React.FC = () => {
  const selectedId = useWorldStore(s => s.spatialContext.selectedEntityId);
  const appMode = useWorldStore(s => s.appMode);
  const entities = useWorldStore(s => s.world.ir.entities);
  const moveEntity = useWorldStore(s => s.moveEntity);
  const startPlacementMode = useWorldStore(s => s.startPlacementMode);
  const cancelPlacementMode = useWorldStore(s => s.cancelPlacementMode);
  const cycleGizmoMode = useWorldStore(s => s.cycleGizmoMode);
  const setGizmoMode = useWorldStore(s => s.setGizmoMode);
  const gizmoMode = useWorldStore(s => s.gizmoMode);
  const focusEntity = useWorldStore(s => s.focusEntity);
  const deleteEntity = useWorldStore(s => s.deleteEntity);
  const setSpatialContext = useWorldStore(s => s.setSpatialContext);
  const placementModeEntityId = useWorldStore(s => s.placementModeEntityId);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || (activeEl as HTMLElement).isContentEditable)) {
        return;
      }
      if (e.key === 'Escape') {
        if (placementModeEntityId) {
          e.preventDefault();
          cancelPlacementMode();
        } else if (selectedId) {
          e.preventDefault();
          setSpatialContext(null, null);
        }
        return;
      }
      if (!selectedId) return;

      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        focusEntity(selectedId);
        return;
      }

      // En mode simulation (Tester/Explorer), les touches Flèches/PageUp/PageDown servent uniquement
      // à déplacer la caméra, et Suppr/Backspace ne doit pas détruire les objets de la scène.
      if (appMode !== 'conception') return;

      const selectedEntity = entities[selectedId];
      if (!selectedEntity || isFixedStructuralFurniture(selectedEntity)) return;

      const step = e.shiftKey ? 0.35 : 0.12;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        moveEntity(selectedId, -step, 0, 0);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        moveEntity(selectedId, step, 0, 0);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        moveEntity(selectedId, 0, 0, -step);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        moveEntity(selectedId, 0, 0, step);
      } else if (e.key === 'PageUp' || e.key === '+') {
        e.preventDefault();
        moveEntity(selectedId, 0, step * 0.7, 0);
      } else if (e.key === 'PageDown' || e.key === '-') {
        e.preventDefault();
        moveEntity(selectedId, 0, -step * 0.7, 0);
      } else if (e.altKey && (e.key === 'm' || e.key === 'M')) {
        e.preventDefault();
        startPlacementMode(selectedId);
      } else if (e.shiftKey && (e.key === 'g' || e.key === 'G')) {
        e.preventDefault();
        cycleGizmoMode();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteEntity(selectedId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, appMode, entities, placementModeEntityId, moveEntity, startPlacementMode, cancelPlacementMode, cycleGizmoMode, setGizmoMode, gizmoMode, focusEntity, deleteEntity, setSpatialContext]);

  return null;
};

const CinematicEffects = CinematicPostProcessing;



interface DropImpactItem {
  id: string;
  x: number;
  y: number;
  z: number;
  type: 'splash' | 'chop' | 'chime';
  startTime: number;
}

const SingleDropVFX: React.FC<{ impact: DropImpactItem; onFinish: () => void }> = ({ impact, onFinish }) => {
  const ringRef = React.useRef<THREE.Mesh>(null);
  const lightRef = React.useRef<THREE.PointLight>(null);
  const dropletsRef = React.useRef<THREE.Group>(null);
  const { clock } = useThree();
  const startT = React.useRef(clock.getElapsedTime());

  const dropletVectors = React.useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const angle = (i / 6) * Math.PI * 2 + (Math.random() * 0.4 - 0.2);
      const dist = 0.08 + Math.random() * 0.12;
      return {
        dx: Math.cos(angle) * dist,
        dz: Math.sin(angle) * dist,
        maxH: 0.06 + Math.random() * 0.06
      };
    });
  }, []);

  useFrame(() => {
    const elapsed = clock.getElapsedTime() - startT.current;
    const progress = elapsed / 0.85; // 850ms lifetime
    if (progress >= 1) {
      onFinish();
      return;
    }

    if (ringRef.current) {
      const s = 1 + progress * 2.8;
      ringRef.current.scale.set(s, s, s);
      const mat = ringRef.current.material as THREE.MeshBasicMaterial;
      if (mat) {
        mat.opacity = Math.max(0, (1 - progress) * 0.85);
      }
    }

    if (lightRef.current) {
      lightRef.current.intensity = Math.max(0, (1 - progress) * (impact.type === 'splash' ? 2.5 : 1.5));
    }

    if (dropletsRef.current) {
      dropletsRef.current.children.forEach((child, idx) => {
        const v = dropletVectors[idx];
        if (v) {
          const arc = Math.sin(Math.min(1, progress * 1.5) * Math.PI);
          child.position.x = v.dx * progress;
          child.position.y = arc * v.maxH;
          child.position.z = v.dz * progress;
          const s = Math.max(0.1, 1 - progress);
          child.scale.set(s, s, s);
        }
      });
    }
  });

  const isSplash = impact.type === 'splash';
  const isChop = impact.type === 'chop';
  const ringColor = isSplash ? '#f59e0b' : isChop ? '#84cc16' : '#38bdf8';
  const particleColor = isSplash ? '#ef4444' : isChop ? '#65a30d' : '#fbbf24';

  return (
    <group position={[impact.x, impact.y + 0.015, impact.z]}>
      {/* Expanding Ripple Ring */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.04, 0.075, 32]} />
        <meshBasicMaterial color={ringColor} transparent opacity={0.85} side={THREE.DoubleSide} />
      </mesh>

      {/* Bursting Droplets / Specks */}
      <group ref={dropletsRef}>
        {dropletVectors.map((_, idx) => (
          <mesh key={idx}>
            {isSplash ? (
              <sphereGeometry args={[0.012, 12, 12]} />
            ) : (
              <boxGeometry args={[0.014, 0.005, 0.014]} />
            )}
            <meshStandardMaterial
              color={particleColor}
              roughness={0.2}
              metalness={0.1}
              emissive={particleColor}
              emissiveIntensity={0.6}
            />
          </mesh>
        ))}
      </group>

      {/* Dynamic Splash Light */}
      <pointLight
        ref={lightRef}
        color={ringColor}
        intensity={isSplash ? 2.5 : 1.5}
        distance={1.2}
      />
    </group>
  );
};

const MagneticDropVFXLayer: React.FC = () => {
  const [impacts, setImpacts] = React.useState<DropImpactItem[]>([]);

  React.useEffect(() => {
    const handleImpact = (e: any) => {
      const { x, y, z, type } = e.detail || {};
      if (typeof x === 'number' && typeof y === 'number' && typeof z === 'number') {
        const item: DropImpactItem = {
          id: Math.random().toString(),
          x,
          y,
          z,
          type: type || 'splash',
          startTime: Date.now()
        };
        setImpacts(prev => [...prev.slice(-4), item]);
      }
    };

    window.addEventListener('worldpilot_drop_impact', handleImpact);
    return () => window.removeEventListener('worldpilot_drop_impact', handleImpact);
  }, []);

  return (
    <group>
      {impacts.map(imp => (
        <SingleDropVFX
          key={imp.id}
          impact={imp}
          onFinish={() => setImpacts(prev => prev.filter(i => i.id !== imp.id))}
        />
      ))}
    </group>
  );
};

interface PhysicsErrorBoundaryProps {
  physicsEpoch?: number;
  children: React.ReactNode | ((worldKey: string, isPaused: boolean) => React.ReactNode);
}

interface PhysicsErrorBoundaryState {
  hasError: boolean;
  resetKey: number;
  isPaused: boolean;
}

class PhysicsErrorBoundary extends React.Component<
  PhysicsErrorBoundaryProps,
  PhysicsErrorBoundaryState
> {
  private timeoutId: any = null;
  private recoveryAttempts: number = 0;
  private stabilityTimer: any = null;

  constructor(props: PhysicsErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, resetKey: 0, isPaused: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any) {
    const errorMsg = error?.message || String(error);
    console.warn('[PhysicsErrorBoundary] Physics step anomaly caught, auto-recovering:', errorMsg);

    if (this.timeoutId) clearTimeout(this.timeoutId);
    this.recoveryAttempts++;
    if (this.recoveryAttempts > 2) {
      console.warn('[PhysicsErrorBoundary] Multiple physics step anomalies detected; pausing active solver to preserve responsive 3D navigation.');
      this.setState({ hasError: false, isPaused: true });
      return;
    }
    const delay = Math.min(80 + this.recoveryAttempts * 40, 200);
    this.timeoutId = setTimeout(() => {
      this.setState(s => ({ hasError: false, resetKey: s.resetKey + 1 }));
    }, delay);
  }

  componentDidMount() {
    this.stabilityTimer = setInterval(() => {
      if (this.recoveryAttempts > 0) this.recoveryAttempts = 0;
    }, 3500);
  }

  componentWillUnmount() {
    if (this.timeoutId) clearTimeout(this.timeoutId);
    if (this.stabilityTimer) clearInterval(this.stabilityTimer);
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    const worldKey = `rapier_world_${this.props.physicsEpoch ?? 1}_${this.state.resetKey}`;
    if (typeof this.props.children === 'function') {
      return this.props.children(worldKey, this.state.isPaused);
    }
    return <React.Fragment key={worldKey}>{this.props.children}</React.Fragment>;
  }
}

function SceneExportBridge() {
  const { gl, scene, camera } = useThree();
  const currentSceneTitle = useWorldStore(s => s.currentSceneTitle);

  React.useEffect(() => {
    const handleCapture = () => {
      try {
        // Force synchronous render to ensure up-to-date canvas content
        gl.render(scene, camera);
        const dataUrl = gl.domElement.toDataURL('image/png');
        const a = document.createElement('a');
        const cleanTitle = (currentSceneTitle || 'scene')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '') || 'scene';
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        a.download = `WorldPilot-${cleanTitle}-${timestamp}.png`;
        a.href = dataUrl;
        a.click();

        playAudioFx('chime');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('worldpilot_camera_flash'));
        }

        useWorldStore.setState(s => ({
          warnings: [...s.warnings, `📸 Capture d'écran HD "${a.download}" enregistrée avec succès !`]
        }));
      } catch (err: any) {
        console.error('Screenshot capture error:', err);
        useWorldStore.setState(s => ({
          warnings: [...s.warnings, `⚠️ Impossible de capturer l'écran HD : ${err.message}`]
        }));
      }
    };

    const handleExportGLB = async (event?: Event) => {
      try {
        const { GLTFExporter } = await import('three/examples/jsm/exporters/GLTFExporter.js');
        const exporter = new GLTFExporter();
        const customDetail = (event as CustomEvent)?.detail;
        const targetEntityId = customDetail?.entityId;
        const targetEntityName = customDetail?.entityName;

        let exportRoot: THREE.Object3D = scene;
        let filenameTitle = currentSceneTitle || 'scene';

        if (targetEntityId) {
          const found = scene.getObjectByName(targetEntityId);
          if (found) {
            exportRoot = found;
            filenameTitle = targetEntityName || targetEntityId;
          }
        }

        const cleanTitle = filenameTitle
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '') || 'scene';

        exporter.parse(
          exportRoot,
          (result) => {
            let blob: Blob;
            if (result instanceof ArrayBuffer) {
              blob = new Blob([result], { type: 'model/gltf-binary' });
            } else {
              const output = JSON.stringify(result, null, 2);
              blob = new Blob([output], { type: 'application/json' });
            }
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `WorldPilot-${cleanTitle}.glb`;
            a.click();
            URL.revokeObjectURL(url);
            playAudioFx('fanfare');
            useWorldStore.setState(s => ({
              warnings: [...s.warnings, `📦 Modèle 3D exporté au format GLB (${a.download}).`]
            }));
          },
          (error) => {
            console.error('GLTF Export error:', error);
            useWorldStore.setState(s => ({
              warnings: [...s.warnings, `⚠️ Échec de l'export GLB : ${error}`]
            }));
          },
          {
            binary: true,
            onlyVisible: true,
          }
        );
      } catch (err: any) {
        console.error('GLTF Export failure:', err);
        useWorldStore.setState(s => ({
          warnings: [...s.warnings, `⚠️ Erreur export GLB : ${err.message}`]
        }));
      }
    };

    const handleExportUSDZ = async () => {
      try {
        const { USDZExporter } = await import('three/examples/jsm/exporters/USDZExporter.js');
        const exporter = new USDZExporter();
        const arrayBuffer = await (exporter as any).parseAsync(scene, {
          quickLookCompatible: true,
          ar: { anchoring: { type: 'plane' }, planeAnchoring: { alignment: 'horizontal' } }
        });
        const cleanTitle = (currentSceneTitle || 'scene')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '') || 'scene';
        const blob = new Blob([arrayBuffer], { type: 'model/vnd.usdz+zip' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `WorldPilot-${cleanTitle}.usdz`;
        a.click();
        URL.revokeObjectURL(url);
        playAudioFx('fanfare');
        useWorldStore.setState(s => ({
          warnings: [...s.warnings, `🥽 Scène exportée au format Apple USDZ (${a.download}) ! Compatible Apple Vision Pro & AR Quick Look.`]
        }));
      } catch (err: any) {
        console.error('USDZ Export failure:', err);
        useWorldStore.setState(s => ({
          warnings: [...s.warnings, `⚠️ Erreur export USDZ : ${err.message}`]
        }));
      }
    };

    window.addEventListener('worldpilot_capture_screenshot', handleCapture);
    window.addEventListener('worldpilot_export_glb', handleExportGLB);
    window.addEventListener('worldpilot_export_usdz', handleExportUSDZ);
    return () => {
      window.removeEventListener('worldpilot_capture_screenshot', handleCapture);
      window.removeEventListener('worldpilot_export_glb', handleExportGLB);
      window.removeEventListener('worldpilot_export_usdz', handleExportUSDZ);
    };
  }, [gl, scene, camera, currentSceneTitle]);

  return null;
}

export const WorldScene: React.FC<{ evening?: boolean; cameraReset?: number }> = React.memo(({ evening = false, cameraReset = 0 }) => {
  const renderBudget = useRenderBudget();
  const entities = useWorldStore(state => state.world.ir.entities);
  const showGrid = useWorldStore(state => state.showGrid);
  const currentAtmosphere = useWorldStore(state => state.currentAtmosphere);
  const currentGravity = useWorldStore(state => state.currentGravity);
  const physicsEpoch = useWorldStore(state => state.physicsEpoch);
  const appMode = useWorldStore(state => state.appMode);
  const isSimulating = useWorldStore(state => state.isSimulating);
  return (
    <Canvas shadows="soft" dpr={[1, renderBudget.maxDpr > 1 ? 2 : renderBudget.maxDpr]}
      tabIndex={0}
      style={{ touchAction: 'none', outline: 'none' }}
      onPointerDown={(e) => {
        const el = document.activeElement;
        if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || (el as HTMLElement).isContentEditable)) {
          (el as HTMLElement).blur();
        }
        // Donner immédiatement le focus natif au canvas 3D
        try {
          (e.target as HTMLElement)?.focus?.();
        } catch (_) {}
        // Si aucun objet n'est en cours de glissement actif, garantir le déverrouillage de la caméra
        if (!useWorldStore.getState().draggedEntityId) {
          useWorldStore.getState().setDragging3D(false);
          window.dispatchEvent(new CustomEvent('worldpilot_lock_camera_controls', { detail: { locked: false } }));
        }
      }}
      onPointerMissed={() => {
        useWorldStore.getState().setHoveredEntityId(null);
        useWorldStore.getState().setSpatialContext(null, null);
      }}
      camera={{ position: [7.8, 4.8, 8.8], fov: 42, near: 0.1, far: 180 }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.12, outputColorSpace: THREE.SRGBColorSpace, preserveDrawingBuffer: true }}>
      <XR store={xrStore}>
        <XRPlayerRig />
        <SceneExportBridge />
        <ArchitecturalStage evening={evening} />
        <AtmosphereSystem atmosphereId={currentAtmosphere} />
        {showGrid && <Grid position={[0, 0.004, 0]} args={[20, 20]} fadeDistance={22}
          sectionColor="#8d9c95" cellColor="#b0b7ad" sectionSize={5} cellSize={1}
          cellThickness={0.45} sectionThickness={0.7} />}
        <SpatialAgent />
        <GhostTrajectoryAgent />
        <PlaytesterTrajectory3D />
        <CoWorker3DAgent />
        <SpatialAttentionVisualizer />
        <ResearchSpatialOverlay3D />
        <React.Suspense fallback={null}>
          <PhysicsErrorBoundary physicsEpoch={physicsEpoch}>
            {(worldKey, isErrorBoundaryPaused) => (
              <Physics 
                key={worldKey}
                gravity={currentGravity}
                interpolate={false}
                paused={Boolean(isErrorBoundaryPaused || (appMode === 'conception' && !isSimulating))}
              >
                <CuboidCollider position={[0, -0.1, 0]} args={[80, 0.1, 80]} />
                {Object.values(entities).map(entity => <EntityNode key={entity.id} entity={entity} />)}
              </Physics>
            )}
          </PhysicsErrorBoundary>
        </React.Suspense>
        <SpatialCursorVisualizer />
        <SelectedEntityGizmo />
        <PlacementModeController />
        <SpatialKeyboardNavigator />
        <MagneticDropVFXLayer />
        <AtmosphericParticles />
        <LiquidPouringEffect />
        <CinematicEffects />
        <CameraRig reset={cameraReset} />
      </XR>
    </Canvas>
  );
});

const CAMERA_PRESETS: Record<CameraPreset, { position: THREE.Vector3; target: THREE.Vector3 }> = {
  overview: {
    position: new THREE.Vector3(7.2, 4.4, 8.2),
    target: new THREE.Vector3(0, 0.6, 0)
  },
  luxury_showroom: {
    position: new THREE.Vector3(0, 1.38, 1.55),
    target: new THREE.Vector3(0, 0.98, 0.02)
  },
  table: {
    position: new THREE.Vector3(0, 1.55, 1.85),
    target: new THREE.Vector3(0, 0.95, 0.05)
  },
  board: {
    position: new THREE.Vector3(0, 1.35, 0.35),
    target: new THREE.Vector3(0, 1.15, -1.9)
  },
  cocotte: {
    position: new THREE.Vector3(0, 1.48, 0.38),
    target: new THREE.Vector3(0, 0.92, -0.2)
  },
  plate: {
    position: new THREE.Vector3(0, 1.55, 0.52),
    target: new THREE.Vector3(0, 0.92, 0.12)
  },
  chopping: {
    position: new THREE.Vector3(0, 1.38, 0.68),
    target: new THREE.Vector3(0, 0.92, 0.3)
  },
  supercar_hero: {
    position: new THREE.Vector3(3.6, 1.35, 4.2),
    target: new THREE.Vector3(0, 0.45, 0)
  }
};

const _audioForward = new THREE.Vector3();
const _audioUp = new THREE.Vector3();

function CameraRig({ reset }: { reset: number }) {
  const { camera } = useThree();
  const isCinematicTourActive = useWorldStore(state => state.isCinematicTourActive);
  const isDragging3D = useWorldStore(state => state.isDragging3D);
  const cameraPreset = useWorldStore(state => state.cameraPreset);
  const controlsRef = React.useRef<any>(null);
  const [isCameraLocked, setIsCameraLocked] = React.useState(false);
  const transitionStartRef = React.useRef<number>(0);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__THREE_CAMERA__ = camera;
    }
  }, [camera]);

  // Sécurité globale : débloque automatiquement les contrôles caméra si un drag a été interrompu
  React.useEffect(() => {
    const handleGlobalSafetyUnlock = () => {
      const draggedId = useWorldStore.getState().draggedEntityId;
      if (!draggedId || useWorldStore.getState().isDragging3D) {
        useWorldStore.getState().setDragging3D(false);
      }
      setIsCameraLocked(false);
    };
    const handlePointerDownSafety = () => {
      if (!useWorldStore.getState().draggedEntityId) {
        if (useWorldStore.getState().isDragging3D) {
          useWorldStore.getState().setDragging3D(false);
        }
        setIsCameraLocked(false);
      }
    };
    window.addEventListener('pointerup', handleGlobalSafetyUnlock, { capture: true });
    window.addEventListener('pointercancel', handleGlobalSafetyUnlock, { capture: true });
    window.addEventListener('blur', handleGlobalSafetyUnlock);
    window.addEventListener('pointerdown', handlePointerDownSafety, { capture: true, passive: true });
    return () => {
      window.removeEventListener('pointerup', handleGlobalSafetyUnlock, { capture: true } as any);
      window.removeEventListener('pointercancel', handleGlobalSafetyUnlock, { capture: true } as any);
      window.removeEventListener('blur', handleGlobalSafetyUnlock);
      window.removeEventListener('pointerdown', handlePointerDownSafety, { capture: true } as any);
    };
  }, []);

  // Déverrouillage automatique de sécurité après 2 secondes si aucun objet n'est manipulé
  React.useEffect(() => {
    if (isCameraLocked) {
      const timer = setTimeout(() => {
        if (!useWorldStore.getState().draggedEntityId) {
          setIsCameraLocked(false);
        }
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [isCameraLocked]);

  // Raccourci Échap universel : réinitialise le focus, désélectionne et déverrouille la caméra
  React.useEffect(() => {
    const handleKeyDownGlobal = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const el = document.activeElement;
        if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || (el as HTMLElement).isContentEditable)) {
          (el as HTMLElement).blur();
        }
        setIsCameraLocked(false);
        useWorldStore.getState().setDragging3D(false);
        useWorldStore.getState().setSpatialContext(null, null);
        useWorldStore.getState().setCameraFocusTarget(null);
      }
    };
    window.addEventListener('keydown', handleKeyDownGlobal);
    return () => window.removeEventListener('keydown', handleKeyDownGlobal);
  }, []);

  React.useEffect(() => {
    const handler = (e: any) => {
      setIsCameraLocked(Boolean(e.detail?.locked));
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('worldpilot_lock_camera_controls', handler);
      return () => window.removeEventListener('worldpilot_lock_camera_controls', handler);
    }
  }, []);

  const isInitialMount = React.useRef(true);
  const isTransitioning = React.useRef(false);
  const targetCamPos = React.useRef(CAMERA_PRESETS[cameraPreset]?.position.clone() || CAMERA_PRESETS.overview.position.clone());
  const targetLookAt = React.useRef(CAMERA_PRESETS[cameraPreset]?.target.clone() || CAMERA_PRESETS.overview.target.clone());

  React.useEffect(() => {
    const config = CAMERA_PRESETS[cameraPreset] || CAMERA_PRESETS.overview;
    targetCamPos.current.copy(config.position);
    targetLookAt.current.copy(config.target);
    if (isInitialMount.current) {
      isInitialMount.current = false;
      camera.position.copy(config.position);
      if (controlsRef.current) {
        controlsRef.current.target.copy(config.target);
        controlsRef.current.update();
      }
      isTransitioning.current = false;
      return;
    }
    transitionStartRef.current = Date.now();
    isTransitioning.current = true;
  }, [cameraPreset, reset, camera]);

  const physicsEpoch = useWorldStore(state => state.physicsEpoch);
  const prevPhysicsEpoch = React.useRef(physicsEpoch);
  React.useEffect(() => {
    if (physicsEpoch !== prevPhysicsEpoch.current) {
      prevPhysicsEpoch.current = physicsEpoch;
      const config = CAMERA_PRESETS.overview;
      targetCamPos.current.copy(config.position);
      targetLookAt.current.copy(config.target);
      camera.position.copy(config.position);
      if (controlsRef.current) {
        controlsRef.current.target.copy(config.target);
        controlsRef.current.update();
      }
      isTransitioning.current = false;
    }
  }, [physicsEpoch, camera]);

  const cameraFocusTarget = useWorldStore(state => state.cameraFocusTarget);
  React.useEffect(() => {
    if (cameraFocusTarget) {
      const st = useWorldStore.getState();
      const selId = st.spatialContext.selectedEntityId;
      const selEnt = selId ? st.world.ir.entities[selId] : null;
      const footprintR = selEnt ? getEntityFootprintRadius(selEnt) : 0.45;
      const distZ = Math.max(1.65, Math.min(4.8, footprintR * 2.6));
      const distY = Math.max(0.65, Math.min(1.85, footprintR * 0.95));

      targetLookAt.current.set(cameraFocusTarget[0], cameraFocusTarget[1], cameraFocusTarget[2]);
      targetCamPos.current.set(
        cameraFocusTarget[0],
        cameraFocusTarget[1] + distY,
        cameraFocusTarget[2] + distZ
      );
      transitionStartRef.current = Date.now();
      isTransitioning.current = true;
    }
  }, [cameraFocusTarget]);

  const lastAudioCamPos = React.useRef(new THREE.Vector3());
  const lastAudioCamQuat = React.useRef(new THREE.Quaternion());
  const pressedKeysRef = React.useRef<{
    forward: boolean;
    backward: boolean;
    left: boolean;
    right: boolean;
    up: boolean;
    down: boolean;
    sprint: boolean;
  }>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    up: false,
    down: false,
    sprint: false
  });
  const _moveForward = React.useRef(new THREE.Vector3());
  const _moveRight = React.useRef(new THREE.Vector3());
  const _moveDelta = React.useRef(new THREE.Vector3());
  const _worldUp = React.useRef(new THREE.Vector3(0, 1, 0));

  React.useEffect(() => {
    const isInputFocused = () => {
      const el = document.activeElement;
      return Boolean(el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || (el as HTMLElement).isContentEditable));
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isInputFocused() || e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      const st = useWorldStore.getState();
      const selId = st.spatialContext.selectedEntityId;
      const selEnt = selId ? st.world.ir.entities[selId] : null;
      const isNudgingInConception = Boolean(
        st.appMode === 'conception' && selEnt && !isFixedStructuralFurniture(selEnt)
      );
      let matched = false;

      if (e.code === 'KeyW' || k === 'z' || k === 'w' || (!isNudgingInConception && e.key === 'ArrowUp')) {
        pressedKeysRef.current.forward = true;
        matched = true;
      }
      if (e.code === 'KeyS' || k === 's' || (!isNudgingInConception && e.key === 'ArrowDown')) {
        pressedKeysRef.current.backward = true;
        matched = true;
      }
      if (e.code === 'KeyA' || k === 'q' || k === 'a' || (!isNudgingInConception && e.key === 'ArrowLeft')) {
        pressedKeysRef.current.left = true;
        matched = true;
      }
      if (e.code === 'KeyD' || k === 'd' || (!isNudgingInConception && e.key === 'ArrowRight')) {
        pressedKeysRef.current.right = true;
        matched = true;
      }
      if (k === 'e' || e.key === ' ' || (!isNudgingInConception && e.key === 'PageUp')) {
        pressedKeysRef.current.up = true;
        matched = true;
      }
      if (k === 'c' || (!isNudgingInConception && e.key === 'PageDown')) {
        pressedKeysRef.current.down = true;
        matched = true;
      }
      if (e.shiftKey) {
        pressedKeysRef.current.sprint = true;
      }
      if (matched) {
        isTransitioning.current = false;
        if (e.key.startsWith('Arrow') || e.key === ' ' || e.key.startsWith('Page')) {
          e.preventDefault();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (e.code === 'KeyW' || k === 'z' || k === 'w' || e.key === 'ArrowUp') {
        pressedKeysRef.current.forward = false;
      }
      if (e.code === 'KeyS' || k === 's' || e.key === 'ArrowDown') {
        pressedKeysRef.current.backward = false;
      }
      if (e.code === 'KeyA' || k === 'q' || k === 'a' || e.key === 'ArrowLeft') {
        pressedKeysRef.current.left = false;
      }
      if (e.code === 'KeyD' || k === 'd' || e.key === 'ArrowRight') {
        pressedKeysRef.current.right = false;
      }
      if (k === 'e' || e.key === ' ' || e.key === 'PageUp') {
        pressedKeysRef.current.up = false;
      }
      if (k === 'c' || e.key === 'PageDown') {
        pressedKeysRef.current.down = false;
      }
      if (!e.shiftKey) {
        pressedKeysRef.current.sprint = false;
      }
    };

    const handleBlur = () => {
      pressedKeysRef.current = {
        forward: false,
        backward: false,
        left: false,
        right: false,
        up: false,
        down: false,
        sprint: false
      };
    };

    const handleCameraMoveStep = (e: any) => {
      const dir = e.detail?.direction;
      const step = typeof e.detail?.step === 'number' ? e.detail.step : 0.75;
      if (!dir) return;
      isTransitioning.current = false;
      if (useWorldStore.getState().cameraFocusTarget) {
        useWorldStore.getState().setCameraFocusTarget(null);
      }

      camera.getWorldDirection(_moveForward.current);
      _moveForward.current.y = 0;
      if (_moveForward.current.lengthSq() < 0.0001) _moveForward.current.set(0, 0, -1);
      _moveForward.current.normalize();
      _moveRight.current.crossVectors(_moveForward.current, _worldUp.current).normalize();

      _moveDelta.current.set(0, 0, 0);
      if (dir === 'forward') _moveDelta.current.addScaledVector(_moveForward.current, step);
      else if (dir === 'backward') _moveDelta.current.addScaledVector(_moveForward.current, -step);
      else if (dir === 'left') _moveDelta.current.addScaledVector(_moveRight.current, -step);
      else if (dir === 'right') _moveDelta.current.addScaledVector(_moveRight.current, step);
      else if (dir === 'up') _moveDelta.current.y += step * 0.6;
      else if (dir === 'down') _moveDelta.current.y -= step * 0.6;

      camera.position.add(_moveDelta.current);
      if (controlsRef.current) {
        controlsRef.current.target.add(_moveDelta.current);
        if (camera.position.y < 0.35) camera.position.y = 0.35;
        if (controlsRef.current.target.y < 0.1) controlsRef.current.target.y = 0.1;
        controlsRef.current.update();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('worldpilot_move_camera', handleCameraMoveStep);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('worldpilot_move_camera', handleCameraMoveStep);
    };
  }, [camera]);

  useFrame((_, delta) => {
    if (controlsRef.current && typeof window !== 'undefined' && !(window as any).__ORBIT_CONTROLS__) {
      (window as any).__ORBIT_CONTROLS__ = controlsRef.current;
    }
    // Synchronize Web Audio 3D spatial listener only when active camera transform changes
    if (camera.position.distanceToSquared(lastAudioCamPos.current) > 0.0001 ||
        camera.quaternion.angleTo(lastAudioCamQuat.current) > 0.001) {
      lastAudioCamPos.current.copy(camera.position);
      lastAudioCamQuat.current.copy(camera.quaternion);
      _audioForward.set(0, 0, -1).applyQuaternion(camera.quaternion);
      _audioUp.set(0, 1, 0).applyQuaternion(camera.quaternion);
      ambientAudio.updateListener(
        camera.position.x, camera.position.y, camera.position.z,
        _audioForward.x, _audioForward.y, _audioForward.z,
        _audioUp.x, _audioUp.y, _audioUp.z
      );
    }

    // Locomotion clavier 60 FPS (ZQSD / WASD / Flèches / E / C)
    const keys = pressedKeysRef.current;
    if (keys.forward || keys.backward || keys.left || keys.right || keys.up || keys.down) {
      isTransitioning.current = false;
      if (useWorldStore.getState().cameraFocusTarget) {
        useWorldStore.getState().setCameraFocusTarget(null);
      }
      const baseSpeed = keys.sprint ? 7.5 : 3.6;
      const moveStep = baseSpeed * Math.min(delta, 0.1);

      camera.getWorldDirection(_moveForward.current);
      _moveForward.current.y = 0;
      if (_moveForward.current.lengthSq() < 0.0001) _moveForward.current.set(0, 0, -1);
      _moveForward.current.normalize();
      _moveRight.current.crossVectors(_moveForward.current, _worldUp.current).normalize();

      _moveDelta.current.set(0, 0, 0);
      if (keys.forward) _moveDelta.current.add(_moveForward.current);
      if (keys.backward) _moveDelta.current.sub(_moveForward.current);
      if (keys.right) _moveDelta.current.add(_moveRight.current);
      if (keys.left) _moveDelta.current.sub(_moveRight.current);
      if (_moveDelta.current.lengthSq() > 0) {
        _moveDelta.current.normalize().multiplyScalar(moveStep);
      }
      if (keys.up) _moveDelta.current.y += moveStep * 0.65;
      if (keys.down) _moveDelta.current.y -= moveStep * 0.65;

      camera.position.add(_moveDelta.current);
      if (controlsRef.current) {
        controlsRef.current.target.add(_moveDelta.current);
        if (camera.position.y < 0.35) camera.position.y = 0.35;
        if (controlsRef.current.target.y < 0.1) controlsRef.current.target.y = 0.1;
        controlsRef.current.update();
      }
      return;
    }

    if (!isTransitioning.current || !controlsRef.current) return;

    // Timeout de sécurité : l'animation de caméra ne doit JAMAIS bloquer l'utilisateur plus de 1.2s
    if (Date.now() - transitionStartRef.current > 1200) {
      isTransitioning.current = false;
      return;
    }

    const factor = Math.min(1, delta * 4.5);
    camera.position.lerp(targetCamPos.current, factor);
    controlsRef.current.target.lerp(targetLookAt.current, factor);
    controlsRef.current.update();

    if (camera.position.distanceTo(targetCamPos.current) < 0.04 && 
        controlsRef.current.target.distanceTo(targetLookAt.current) < 0.04) {
      camera.position.copy(targetCamPos.current);
      controlsRef.current.target.copy(targetLookAt.current);
      isTransitioning.current = false;
    }
  });

  const cancelTransition = React.useCallback(() => {
    isTransitioning.current = false;
    if (controlsRef.current) {
      targetCamPos.current.copy(camera.position);
      targetLookAt.current.copy(controlsRef.current.target);
    }
  }, [camera]);

  React.useEffect(() => {
    const handleUserInteraction = () => cancelTransition();
    window.addEventListener('wheel', handleUserInteraction, { capture: true, passive: true });
    window.addEventListener('pointerdown', handleUserInteraction, { capture: true, passive: true });
    window.addEventListener('mousedown', handleUserInteraction, { capture: true, passive: true });
    window.addEventListener('touchstart', handleUserInteraction, { capture: true, passive: true });
    return () => {
      window.removeEventListener('wheel', handleUserInteraction, { capture: true } as any);
      window.removeEventListener('pointerdown', handleUserInteraction, { capture: true } as any);
      window.removeEventListener('mousedown', handleUserInteraction, { capture: true } as any);
      window.removeEventListener('touchstart', handleUserInteraction, { capture: true } as any);
    };
  }, [cancelTransition]);

  return (
    <>
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enabled={(!isDragging3D || !useWorldStore.getState().draggedEntityId) && !isCameraLocked}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.95}
        zoomSpeed={1.25}
        panSpeed={0.95}
        screenSpacePanning={true}
        autoRotate={isCinematicTourActive && (!isDragging3D || !useWorldStore.getState().draggedEntityId) && !isCameraLocked}
        autoRotateSpeed={1.0}
        minDistance={0.20}
        maxDistance={48}
        maxPolarAngle={Math.PI / 2 - 0.02}
        onStart={cancelTransition}
        onEnd={cancelTransition}
      />
      <GizmoHelper
        alignment="top-right"
        margin={[75, 75]}
        renderPriority={2}
      >
        <GizmoViewport
          axisColors={['#f43f5e', '#10b981', '#38bdf8']}
          labelColor="#ffffff"
        />
      </GizmoHelper>
    </>
  );
}

if (typeof (import.meta as any).hot !== 'undefined') {
  (import.meta as any).hot.accept();
}
