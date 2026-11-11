import React, { useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { EntitySpec } from '../core/types';
import { useWorldStore } from '../engine/store';
import { playAudioFx } from '../engine/evaluator';
import { getBlueprintCanvasTexture } from './spatialWebTextures';

export const SpatialBlueprintModel: React.FC<{ entity: EntitySpec }> = ({ entity }) => {
  const openWebModal = useWorldStore(state => state.openWebModal);
  const [isHovered, setIsHovered] = useState(false);
  const groupRef = useRef<THREE.Group>(null);

  const webCap = entity.capabilities.find(c => c.type === 'web_screen');
  const eduCap = entity.capabilities.find(c => c.type === 'educational');

  const title = entity.name || 'Dossier Technique & Plans CAO';
  const defaultPdfUrl = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
  const targetUrl = webCap?.url || eduCap?.url || defaultPdfUrl;
  const entityPos = entity.capabilities.find(c => c.type === 'transform')?.position;
  const blueprintTexture = React.useMemo(() => getBlueprintCanvasTexture(title), [title]);

  const handleClick = (e: any) => {
    e.stopPropagation();
    useWorldStore.getState().setSpatialContext(entity.id, null);
    if (entityPos) {
      useWorldStore.getState().setCameraFocusTarget([entityPos.x, entityPos.y, entityPos.z]);
    }
    playAudioFx('paper_turn', entityPos);
    openWebModal(targetUrl, `📐 ${title} (Plans & Schémas PDF)`);
  };

  useFrame(() => {
    if (groupRef.current) {
      const targetY = isHovered ? 0.025 : 0;
      groupRef.current.position.y += (targetY - groupRef.current.position.y) * 0.15;
    }
  });

  return (
    <group
      ref={groupRef}
      onClick={handleClick}
      onPointerOver={(e) => { e.stopPropagation(); setIsHovered(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setIsHovered(false); document.body.style.cursor = 'auto'; }}
    >
      {/* Portfolio Folder Base (Stiff Slate Cardboard) */}
      <mesh position={[0, 0.008, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.54, 0.015, 0.42]} />
        <meshStandardMaterial
          color={isHovered ? '#1e293b' : '#0f172a'}
          roughness={0.7}
          metalness={0.2}
        />
      </mesh>

      {/* Blueprint Sheet (Cyan / Blue Paper with Grid) */}
      <mesh position={[0.01, 0.018, 0]} castShadow>
        <boxGeometry args={[0.50, 0.006, 0.38]} />
        <meshStandardMaterial
          color="#0284c7"
          roughness={0.8}
          metalness={0.1}
          emissive={isHovered ? '#0369a1' : '#000000'}
          emissiveIntensity={isHovered ? 0.3 : 0}
        />
      </mesh>

      {/* High-DPI Cyanotype Architectural CAD Texture */}
      <mesh position={[0.01, 0.023, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.48, 0.36]} />
        <meshBasicMaterial map={blueprintTexture} />
      </mesh>

      {/* Metallic Binder Clips on Left Margin */}
      {[-0.14, 0.14].map((z) => (
        <group key={z} position={[-0.24, 0.022, z]}>
          <mesh castShadow>
            <boxGeometry args={[0.035, 0.02, 0.04]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
      ))}

      {/* Technical Cartouche Stamp Badge */}
      <mesh position={[0.16, 0.022, 0.12]}>
        <boxGeometry args={[0.12, 0.002, 0.06]} />
        <meshStandardMaterial color="#ffffff" roughness={0.9} />
      </mesh>

      {/* Floating Hover Badge */}
      {isHovered && (
        <Html position={[0, 0.22, 0]} center style={{ pointerEvents: 'none', userSelect: 'none' }}>
          <div style={{
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1.5px solid #0284c7',
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
            <span>📐</span>
            <span>Consulter les Plans & Schémas PDF</span>
            <span style={{ color: '#38bdf8' }}>↗</span>
          </div>
        </Html>
      )}
    </group>
  );
};
