import React, { useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { EntitySpec } from '../core/types';
import { useWorldStore } from '../engine/store';
import { playAudioFx } from '../engine/evaluator';
import { getArtPaintingCanvasTexture } from './spatialWebTextures';

export const SpatialArtCanvas: React.FC<{ entity: EntitySpec }> = ({ entity }) => {
  const openWebModal = useWorldStore(state => state.openWebModal);
  const [isHovered, setIsHovered] = useState(false);
  const groupRef = useRef<THREE.Group>(null);

  const webCap = entity.capabilities.find(c => c.type === 'web_screen');
  const eduCap = entity.capabilities.find(c => c.type === 'educational');

  const title = entity.name || 'Chef-d’œuvre & Toile de Maître';
  const defaultUrl = 'https://fr.wikipedia.org/wiki/La_Joconde';
  const targetUrl = webCap?.url || eduCap?.url || defaultUrl;
  const entityPos = entity.capabilities.find(c => c.type === 'transform')?.position;
  const paintingTexture = React.useMemo(() => getArtPaintingCanvasTexture(title), [title]);

  const handleClick = (e: any) => {
    e.stopPropagation();
    useWorldStore.getState().setSpatialContext(entity.id, null);
    if (entityPos) {
      useWorldStore.getState().setCameraFocusTarget([entityPos.x, entityPos.y, entityPos.z]);
    }
    playAudioFx('chime', entityPos);
    openWebModal(targetUrl, `🎨 ${title}`);
  };

  useFrame(() => {
    if (groupRef.current) {
      const targetZ = isHovered ? 0.03 : 0;
      groupRef.current.position.z += (targetZ - groupRef.current.position.z) * 0.15;
    }
  });

  return (
    <group
      ref={groupRef}
      onClick={handleClick}
      onPointerOver={(e) => { e.stopPropagation(); setIsHovered(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setIsHovered(false); document.body.style.cursor = 'auto'; }}
    >
      {/* Outer Molded Gilded Frame */}
      <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.92, 1.16, 0.06]} />
        <meshStandardMaterial
          color={isHovered ? '#b45309' : '#78350f'}
          metalness={0.65}
          roughness={0.35}
        />
      </mesh>

      {/* Inner Bevel Border */}
      <mesh position={[0, 0.6, 0.02]}>
        <boxGeometry args={[0.82, 1.06, 0.03]} />
        <meshStandardMaterial color="#d97706" metalness={0.8} roughness={0.25} />
      </mesh>

      {/* Canvas Face with High-DPI Impressionist Painting Texture */}
      <mesh position={[0, 0.6, 0.038]}>
        <planeGeometry args={[0.76, 1.00]} />
        <meshStandardMaterial map={paintingTexture} roughness={0.8} />
      </mesh>

      {/* Museum Brass Plaque */}
      <mesh position={[0, -0.04, 0.03]}>
        <boxGeometry args={[0.26, 0.05, 0.012]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.85} roughness={0.2} />
      </mesh>

      {/* Overhead Brass Gallery Picture Light Fixture */}
      <group position={[0, 1.25, 0.12]}>
        {/* Arm */}
        <mesh position={[0, -0.04, -0.06]} rotation={[0.4, 0, 0]}>
          <cylinderGeometry args={[0.006, 0.006, 0.14, 12]} />
          <meshStandardMaterial color="#d97706" metalness={0.85} roughness={0.2} />
        </mesh>
        {/* Horizontal shade */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.018, 0.018, 0.42, 16]} />
          <meshStandardMaterial color="#d97706" metalness={0.85} roughness={0.2} />
        </mesh>
        {/* Warm museum spotlight */}
        <pointLight color="#fef3c7" intensity={isHovered ? 2.5 : 1.2} distance={2.5} />
      </group>

      {/* Floating Hover Badge */}
      {isHovered && (
        <Html position={[0, 1.45, 0]} center style={{ pointerEvents: 'none', userSelect: 'none' }}>
          <div style={{
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1.5px solid #ec4899',
            borderRadius: '16px',
            padding: '6px 14px',
            color: '#fdf2f8',
            fontSize: '11px',
            fontWeight: 600,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            whiteSpace: 'nowrap'
          }}>
            <span>🎨</span>
            <span>Explorer l'Œuvre en Galerie HD</span>
            <span style={{ color: '#f472b6' }}>↗</span>
          </div>
        </Html>
      )}
    </group>
  );
};
