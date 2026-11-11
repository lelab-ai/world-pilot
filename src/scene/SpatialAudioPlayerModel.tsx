import React, { useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { EntitySpec } from '../core/types';
import { useWorldStore } from '../engine/store';
import { playAudioFx } from '../engine/evaluator';

export const SpatialAudioPlayerModel: React.FC<{ entity: EntitySpec }> = ({ entity }) => {
  const openWebModal = useWorldStore(state => state.openWebModal);
  const [isHovered, setIsHovered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const groupRef = useRef<THREE.Group>(null);
  const vinylRef = useRef<THREE.Group>(null);
  const armRef = useRef<THREE.Group>(null);
  const wavesRef = useRef<THREE.Group>(null);

  const webCap = entity.capabilities.find(c => c.type === 'web_screen');
  const eduCap = entity.capabilities.find(c => c.type === 'educational');

  const title = entity.name || 'Platine Vinyle Hi-Fi & Radio Spatiale';
  const defaultUrl = 'https://fr.wikipedia.org/wiki/Disque_microsillon';
  const targetUrl = webCap?.url || eduCap?.url || defaultUrl;
  const entityPos = entity.capabilities.find(c => c.type === 'transform')?.position;

  const handleClick = (e: any) => {
    e.stopPropagation();
    useWorldStore.getState().setSpatialContext(entity.id, null);
    const nextPlaying = !isPlaying;
    setIsPlaying(nextPlaying);
    if (entityPos) {
      useWorldStore.getState().setCameraFocusTarget([entityPos.x, entityPos.y, entityPos.z]);
    }
    playAudioFx(nextPlaying ? 'fanfare' : 'switch_click', entityPos);

    // Synchronize directly with real ambient music soundscape
    const store = useWorldStore.getState();
    if (nextPlaying && !store.isAmbientAudioActive) {
      store.toggleAmbientAudio();
    } else if (!nextPlaying && store.isAmbientAudioActive) {
      store.toggleAmbientAudio();
    }

    useWorldStore.setState(s => ({
      warnings: [...s.warnings, nextPlaying ? '📻 Platine vinyle active : lecture de la musique d’ambiance spatiale (33 tours) !' : '📻 Platine vinyle arrêtée.']
    }));
  };

  useFrame(({ clock }, delta) => {
    if (groupRef.current) {
      const targetY = isHovered ? 0.02 : 0;
      groupRef.current.position.y += (targetY - groupRef.current.position.y) * 0.15;
    }

    if (vinylRef.current && isPlaying) {
      // 33 RPM rotation
      vinylRef.current.rotation.y += delta * 3.5;
    }

    if (armRef.current) {
      // Swing arm toward record when playing
      const targetRotY = isPlaying ? 0.42 : 0;
      armRef.current.rotation.y += (targetRotY - armRef.current.rotation.y) * 0.1;
    }

    if (wavesRef.current && isPlaying) {
      const t = clock.getElapsedTime();
      wavesRef.current.children.forEach((child: any, idx) => {
        const offset = (t * 1.6 + idx * 0.35) % 1.0;
        child.scale.set(1 + offset * 0.7, 1 + offset * 0.7, 1);
        child.position.y = 0.10 + offset * 0.14;
        if (child.material) {
          child.material.opacity = (1 - offset) * 0.7;
        }
      });
    }
  });

  return (
    <group
      ref={groupRef}
      onClick={handleClick}
      onDoubleClick={(e) => {
        e.stopPropagation();
        openWebModal(targetUrl, `📻 ${title}`);
      }}
      onPointerOver={(e) => { e.stopPropagation(); setIsHovered(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setIsHovered(false); document.body.style.cursor = 'auto'; }}
    >
      {/* Wooden / Brushed Aluminum Plinth */}
      <mesh position={[0, 0.04, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.52, 0.08, 0.44]} />
        <meshStandardMaterial
          color={isHovered ? '#78350f' : '#451a03'}
          roughness={0.4}
          metalness={0.2}
        />
      </mesh>

      {/* Top Brushed Metal Deck Plate */}
      <mesh position={[0, 0.082, 0]}>
        <boxGeometry args={[0.49, 0.005, 0.41]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.25} />
      </mesh>

      {/* Vinyl Platter & Disc (Rotating Group) */}
      <group ref={vinylRef} position={[-0.06, 0.088, 0]}>
        {/* Metal Sub-platter */}
        <mesh>
          <cylinderGeometry args={[0.18, 0.18, 0.012, 32]} />
          <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Vinyl Record */}
        <mesh position={[0, 0.008, 0]}>
          <cylinderGeometry args={[0.17, 0.17, 0.004, 32]} />
          <meshStandardMaterial
            color="#09090b"
            roughness={0.25}
            metalness={0.7}
          />
        </mesh>
        {/* Center Paper Label */}
        <mesh position={[0, 0.011, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.002, 24]} />
          <meshStandardMaterial color="#f59e0b" roughness={0.8} />
        </mesh>
        {/* Center Spindle Pin */}
        <mesh position={[0, 0.018, 0]}>
          <cylinderGeometry args={[0.006, 0.006, 0.02, 12]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.1} />
        </mesh>
      </group>

      {/* Tonearm Assembly */}
      <group position={[0.16, 0.09, -0.12]}>
        {/* Arm Base Pivot */}
        <mesh position={[0, 0.02, 0]}>
          <cylinderGeometry args={[0.022, 0.022, 0.04, 16]} />
          <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Pivoting Tonearm Wand */}
        <group ref={armRef}>
          <mesh position={[-0.11, 0.035, 0.11]} rotation={[0, -Math.PI / 4, 0]}>
            <cylinderGeometry args={[0.004, 0.004, 0.28, 12]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.1} />
          </mesh>
          {/* Cartridge Head & Stylus */}
          <mesh position={[-0.18, 0.028, 0.18]}>
            <boxGeometry args={[0.016, 0.012, 0.03]} />
            <meshStandardMaterial color="#ef4444" roughness={0.3} />
          </mesh>
        </group>
      </group>

      {/* Control Dials & Speed Buttons */}
      <group position={[0.16, 0.09, 0.12]}>
        <mesh position={[0, 0.01, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.018, 16]} />
          <meshStandardMaterial color="#d97706" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.008, -0.06]}>
          <cylinderGeometry args={[0.012, 0.012, 0.014, 16]} />
          <meshStandardMaterial color="#64748b" metalness={0.7} roughness={0.3} />
        </mesh>
      </group>

      {/* Visualizer Sound Rings when Playing */}
      {isPlaying && (
        <group ref={wavesRef} position={[-0.06, 0.12, 0]}>
          {[0.14, 0.20, 0.26].map((r) => (
            <mesh key={r} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[r, r + 0.015, 32]} />
              <meshBasicMaterial color="#f59e0b" transparent opacity={0.6} side={THREE.DoubleSide} />
            </mesh>
          ))}
        </group>
      )}

      {/* Floating Hover Badge */}
      {isHovered && (
        <Html position={[0, 0.28, 0]} center style={{ pointerEvents: 'none', userSelect: 'none' }}>
          <div style={{
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1.5px solid #f59e0b',
            borderRadius: '16px',
            padding: '6px 14px',
            color: '#fef3c7',
            fontSize: '11px',
            fontWeight: 600,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            whiteSpace: 'nowrap'
          }}>
            <span>📻</span>
            <span>{isPlaying ? 'Arrêter le vinyle (Pause)' : 'Lancer le vinyle 33T (Musique spatiale)'}</span>
          </div>
        </Html>
      )}
    </group>
  );
};
