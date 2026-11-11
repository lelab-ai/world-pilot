import React, { useRef, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { XROrigin, TeleportTarget, useXRControllerLocomotion } from '@react-three/xr';
import * as THREE from 'three';
import { xrHaptics } from './xrHaptics';
import { playAudioFx } from '../engine/evaluator';

interface TeleportRipple {
  id: string;
  x: number;
  y: number;
  z: number;
  startTime: number;
}

export const XRPlayerRig: React.FC = () => {
  const originRef = useRef<THREE.Group>(null);
  const [ripples, setRipples] = useState<TeleportRipple[]>([]);

  // 1. Dual-Thumbstick Locomotion:
  // - Left controller: Smooth translation (1.8 m/s comfort speed)
  // - Right controller: 45-degree snap rotation (Gold standard anti-motion sickness)
  useXRControllerLocomotion(
    originRef,
    { speed: 1.8 },
    { type: 'snap', degrees: 45, deadZone: 0.22 },
    'left'
  );

  // 2. Parabolic Teleportation Handler
  const handleTeleport = useCallback((point: THREE.Vector3) => {
    if (!originRef.current) return;

    // Teleport origin to landing spot
    originRef.current.position.set(point.x, point.y, point.z);

    // Tactile haptic pulse on VR controllers
    xrHaptics.triggerHaptic('teleport_dash');

    // Positional audio feedback
    playAudioFx('chime', { x: point.x, y: point.y, z: point.z });

    // Visual ripple effect
    const newRipple: TeleportRipple = {
      id: Math.random().toString(),
      x: point.x,
      y: point.y,
      z: point.z,
      startTime: Date.now()
    };
    setRipples(prev => [...prev.slice(-3), newRipple]);
  }, []);

  return (
    <group>
      {/* VR Player Physical Origin */}
      <XROrigin ref={originRef} position={[0, 0, 1.8]} />

      {/* Full-Floor Teleportation Target */}
      <TeleportTarget onTeleport={handleTeleport}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]} visible={false}>
          <planeGeometry args={[120, 120]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      </TeleportTarget>

      {/* Teleport Landing Visual Ripples */}
      {ripples.map(ripple => (
        <TeleportRippleVisual
          key={ripple.id}
          ripple={ripple}
          onDone={() => setRipples(prev => prev.filter(r => r.id !== ripple.id))}
        />
      ))}
    </group>
  );
};

const TeleportRippleVisual: React.FC<{
  ripple: TeleportRipple;
  onDone: () => void;
}> = ({ ripple, onDone }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const startRef = useRef(Date.now());

  useFrame(() => {
    const elapsed = (Date.now() - startRef.current) / 600; // 600ms lifetime
    if (elapsed >= 1) {
      onDone();
      return;
    }

    if (meshRef.current) {
      const scale = 0.3 + elapsed * 1.8;
      meshRef.current.scale.set(scale, scale, scale);
      const mat = meshRef.current.material as THREE.MeshBasicMaterial;
      if (mat) {
        mat.opacity = Math.max(0, (1 - elapsed) * 0.85);
      }
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={[ripple.x, ripple.y + 0.015, ripple.z]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <ringGeometry args={[0.18, 0.28, 36]} />
      <meshBasicMaterial
        color="#38bdf8"
        transparent
        opacity={0.85}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
};
