import React, { useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { EntitySpec } from '../core/types';
import { useWorldStore } from '../engine/store';
import { playAudioFx } from '../engine/evaluator';
import { getBookParchmentCanvasTexture } from './spatialWebTextures';

export const SpatialBookModel: React.FC<{ entity: EntitySpec }> = ({ entity }) => {
  const openWebModal = useWorldStore(state => state.openWebModal);
  const [isHovered, setIsHovered] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const bookGroupRef = useRef<THREE.Group>(null);
  const coverHingeRef = useRef<THREE.Group>(null);

  const eduCap = entity.capabilities.find(c => c.type === 'educational');
  const webCap = entity.capabilities.find(c => c.type === 'web_screen');

  const title = entity.name || 'Livre Spatial & Codex';
  const defaultPdfUrl = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
  const targetUrl = webCap?.url || eduCap?.url || defaultPdfUrl;
  const entityPos = entity.capabilities.find(c => c.type === 'transform')?.position;
  const parchmentTexture = React.useMemo(() => getBookParchmentCanvasTexture(title, pageIndex), [title, pageIndex]);

  const handleNextPage = (e: any) => {
    e.stopPropagation();
    setIsOpen(true);
    setPageIndex(p => (p + 1) % 3);
    playAudioFx('paper_turn', entityPos);
  };

  const handleClick = (e: any) => {
    e.stopPropagation();
    useWorldStore.getState().setSpatialContext(entity.id, null);
    setIsOpen(true);
    if (entityPos) {
      useWorldStore.getState().setCameraFocusTarget([entityPos.x, entityPos.y, entityPos.z]);
    }
    playAudioFx('paper_turn', entityPos);
    openWebModal(targetUrl, `📖 ${title} (Document Interactif)`);
  };

  useFrame(() => {
    if (bookGroupRef.current) {
      // Subtle hovering breathing when mouse is over
      const targetY = isHovered ? 0.025 : 0;
      bookGroupRef.current.position.y += (targetY - bookGroupRef.current.position.y) * 0.15;
      
      const targetRotZ = isHovered ? -0.04 : 0;
      bookGroupRef.current.rotation.z += (targetRotZ - bookGroupRef.current.rotation.z) * 0.15;
    }

    if (coverHingeRef.current) {
      // Open cover smoothly around the spine hinge
      const targetAngle = isOpen ? -Math.PI * 0.72 : (isHovered ? -0.42 : 0);
      coverHingeRef.current.rotation.z += (targetAngle - coverHingeRef.current.rotation.z) * 0.14;
    }
  });

  return (
    <group
      ref={bookGroupRef}
      onClick={handleClick}
      onPointerOver={(e) => { e.stopPropagation(); setIsHovered(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setIsHovered(false); setIsOpen(false); document.body.style.cursor = 'auto'; }}
    >
      {/* Back Cover (Bottom Leather) */}
      <mesh position={[0, 0.005, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.34, 0.01, 0.46]} />
        <meshStandardMaterial
          color="#381a08"
          roughness={0.7}
          metalness={0.15}
        />
      </mesh>

      {/* Pages Block (Parchment White/Cream) */}
      <mesh position={[0.015, 0.022, 0]} castShadow>
        <boxGeometry args={[0.31, 0.024, 0.43]} />
        <meshStandardMaterial
          color="#fef3c7"
          roughness={0.9}
          metalness={0.05}
        />
      </mesh>

      {/* High-DPI Illuminated Parchment Texture on Top Page Surface */}
      <mesh position={[0.015, 0.035, 0]} rotation={[-Math.PI / 2, 0, -Math.PI / 2]}>
        <planeGeometry args={[0.42, 0.30]} />
        <meshStandardMaterial map={parchmentTexture} roughness={0.88} />
      </mesh>

      {/* Interactive Right-Page Flip Zone */}
      <mesh
        position={[0.10, 0.038, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={handleNextPage}
      >
        <planeGeometry args={[0.18, 0.28]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Spine Binding */}
      <mesh position={[-0.165, 0.02, 0]}>
        <boxGeometry args={[0.014, 0.04, 0.46]} />
        <meshStandardMaterial
          color="#d97706"
          metalness={0.75}
          roughness={0.25}
          emissive={isHovered ? '#b45309' : '#000000'}
          emissiveIntensity={isHovered ? 0.35 : 0}
        />
      </mesh>

      {/* Bookmark Ribbon Hanging Out */}
      <mesh position={[0.08, 0.012, 0.24]} rotation={[0.2, 0, 0]}>
        <boxGeometry args={[0.025, 0.005, 0.08]} />
        <meshStandardMaterial color="#dc2626" roughness={0.4} />
      </mesh>

      {/* Top Hinged Front Cover - Pivots at the spine (-0.165) */}
      <group ref={coverHingeRef} position={[-0.165, 0.035, 0]}>
        <mesh position={[0.165, 0.005, 0]} castShadow>
          <boxGeometry args={[0.33, 0.009, 0.46]} />
          <meshStandardMaterial
            color={isHovered ? '#78350f' : '#451a03'}
            roughness={0.65}
            metalness={0.2}
          />
        </mesh>
        {/* Gold Emblem on Front Cover */}
        <mesh position={[0.165, 0.011, 0]}>
          <circleGeometry args={[0.05, 16]} />
          <meshStandardMaterial color="#f59e0b" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>

      {/* Diegetic Hologram Tag on Hover */}
      {isHovered && (
        <Html position={[0, 0.16, 0]} center style={{ pointerEvents: 'auto', userSelect: 'none' }}>
          <div style={{
            background: 'rgba(15, 23, 42, 0.94)',
            border: '1.5px solid #d97706',
            borderRadius: '16px',
            padding: '6px 14px',
            color: '#fef3c7',
            fontSize: '11px',
            fontWeight: 600,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap'
          }}>
            <button
              onClick={handleNextPage}
              title="Tourner la page en 3D"
              style={{
                background: 'rgba(217, 119, 6, 0.25)',
                border: '1px solid #d97706',
                borderRadius: '8px',
                color: '#fbbf24',
                padding: '2px 8px',
                fontSize: '10px',
                cursor: 'pointer',
                fontWeight: 700
              }}
            >
              📖 Page {pageIndex + 1}/3 ➔
            </button>
            <span style={{ color: '#d97706' }}>·</span>
            <span onClick={handleClick} style={{ cursor: 'pointer' }}>
              Ouvrir PDF Complet <span style={{ color: '#fbbf24' }}>↗</span>
            </span>
          </div>
        </Html>
      )}
    </group>
  );
};
