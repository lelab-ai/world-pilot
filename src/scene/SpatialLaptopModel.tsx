import React, { useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { EntitySpec } from '../core/types';
import { useWorldStore } from '../engine/store';
import { playAudioFx } from '../engine/evaluator';
import { getTerminalCanvasTexture } from './spatialWebTextures';

export const SpatialLaptopModel: React.FC<{ entity: EntitySpec }> = ({ entity }) => {
  const openWebModal = useWorldStore(state => state.openWebModal);
  const [isHovered, setIsHovered] = useState(false);
  const groupRef = useRef<THREE.Group>(null);
  const screenRef = useRef<THREE.Group>(null);

  const webCap = entity.capabilities.find(c => c.type === 'web_screen');
  const eduCap = entity.capabilities.find(c => c.type === 'educational');

  const title = entity.name || 'Station Dev & Terminal';
  const defaultUrl = 'https://threejs.org/docs/';
  const targetUrl = webCap?.url || eduCap?.url || defaultUrl;
  const entityPos = entity.capabilities.find(c => c.type === 'transform')?.position;

  const handleClick = (e: any) => {
    e.stopPropagation();
    useWorldStore.getState().setSpatialContext(entity.id, null);
    if (entityPos) {
      useWorldStore.getState().setCameraFocusTarget([entityPos.x, entityPos.y, entityPos.z]);
    }
    playAudioFx('switch_click', entityPos);
    openWebModal(targetUrl, `💻 ${title}`);
  };

  useFrame(({ clock }) => {
    if (groupRef.current) {
      const targetY = isHovered ? 0.02 : 0;
      groupRef.current.position.y += (targetY - groupRef.current.position.y) * 0.15;
    }
    if (screenRef.current) {
      // Gentle breathing screen angle
      const t = clock.getElapsedTime();
      const baseAngle = -0.38; // ~112 degrees open
      screenRef.current.rotation.x = baseAngle + (isHovered ? Math.sin(t * 2) * 0.015 : 0);
    }
  });

  const terminalTexture = React.useMemo(() => getTerminalCanvasTexture(), []);

  return (
    <group
      ref={groupRef}
      onClick={handleClick}
      onPointerOver={(e) => { e.stopPropagation(); setIsHovered(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setIsHovered(false); document.body.style.cursor = 'auto'; }}
    >
      {/* Laptop Base (Aluminum Unibody) */}
      <mesh position={[0, 0.012, 0.04]} castShadow receiveShadow>
        <boxGeometry args={[0.48, 0.018, 0.34]} />
        <meshStandardMaterial
          color={isHovered ? '#64748b' : '#334155'}
          metalness={0.85}
          roughness={0.25}
        />
      </mesh>

      {/* Rubber Feet */}
      {[-0.2, 0.2].map(x => (
        [-0.1, 0.18].map(z => (
          <mesh key={`${x}-${z}`} position={[x, 0.002, z]}>
            <cylinderGeometry args={[0.012, 0.012, 0.004, 12]} />
            <meshBasicMaterial color="#0f172a" />
          </mesh>
        ))
      ))}

      {/* Recessed Keyboard Well */}
      <mesh position={[0, 0.022, -0.01]}>
        <boxGeometry args={[0.42, 0.003, 0.18]} />
        <meshStandardMaterial color="#0f172a" roughness={0.7} />
      </mesh>

      {/* Glowing Keyboard Grid Lines */}
      {[-0.06, -0.025, 0.01, 0.045].map((z) => (
        <group key={z} position={[0, 0.024, z]}>
          <mesh>
            <boxGeometry args={[0.40, 0.003, 0.026]} />
            <meshStandardMaterial
              color="#1e293b"
              emissive={isHovered ? '#38bdf8' : '#0284c7'}
              emissiveIntensity={isHovered ? 0.35 : 0.15}
              roughness={0.4}
            />
          </mesh>
        </group>
      ))}

      {/* Precision Trackpad */}
      <mesh position={[0, 0.022, 0.13]}>
        <boxGeometry args={[0.18, 0.002, 0.12]} />
        <meshStandardMaterial
          color={isHovered ? '#475569' : '#1e293b'}
          metalness={0.5}
          roughness={0.3}
        />
      </mesh>

      {/* Cylindrical Display Hinge */}
      <mesh position={[0, 0.022, -0.128]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.009, 0.009, 0.44, 16]} />
        <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Display Lid Assembly (Pivots at the Hinge) */}
      <group ref={screenRef} position={[0, 0.022, -0.128]}>
        {/* Lid Shell */}
        <mesh position={[0, 0.16, -0.006]} castShadow>
          <boxGeometry args={[0.48, 0.32, 0.012]} />
          <meshStandardMaterial
            color={isHovered ? '#64748b' : '#334155'}
            metalness={0.85}
            roughness={0.25}
          />
        </mesh>

        {/* Glossy Bezel */}
        <mesh position={[0, 0.16, 0.001]}>
          <boxGeometry args={[0.46, 0.30, 0.002]} />
          <meshStandardMaterial color="#020617" roughness={0.1} />
        </mesh>

        {/* High-DPI Procedural Terminal Screen Surface */}
        <mesh position={[0, 0.16, 0.003]}>
          <planeGeometry args={[0.44, 0.28]} />
          <meshBasicMaterial map={terminalTexture} toneMapped={false} />
        </mesh>

        {/* Mini Web Camera Dot */}
        <mesh position={[0, 0.305, 0.003]}>
          <circleGeometry args={[0.003, 12]} />
          <meshBasicMaterial color="#22c55e" />
        </mesh>
      </group>

      {/* Floating Hover Badge */}
      {isHovered && (
        <Html position={[0, 0.28, 0]} center style={{ pointerEvents: 'none', userSelect: 'none' }}>
          <div style={{
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1.5px solid #0ea5e9',
            borderRadius: '16px',
            padding: '6px 14px',
            color: '#e0f2fe',
            fontSize: '11px',
            fontWeight: 600,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            whiteSpace: 'nowrap'
          }}>
            <span>💻</span>
            <span>Ouvrir la Console & Doc Web</span>
            <span style={{ color: '#38bdf8' }}>↗</span>
          </div>
        </Html>
      )}
    </group>
  );
};
