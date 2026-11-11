import React, { useState, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { EntitySpec } from '../core/types';
import { useWorldStore } from '../engine/store';
import { playAudioFx } from '../engine/evaluator';
import { getMicroscopeCanvasTexture } from './spatialWebTextures';

export const SpatialMicroscopeModel: React.FC<{ entity: EntitySpec }> = ({ entity }) => {
  const openWebModal = useWorldStore(state => state.openWebModal);
  const [isHovered, setIsHovered] = useState(false);
  const groupRef = useRef<THREE.Group>(null);
  const turretRef = useRef<THREE.Group>(null);
  const fineKnobRef = useRef<THREE.Group>(null);

  const webCap = entity.capabilities.find(c => c.type === 'web_screen');
  const eduCap = entity.capabilities.find(c => c.type === 'educational');

  const title = entity.name || 'Station Scientifique & Microscope Optique';
  const defaultUrl = 'https://fr.m.wikipedia.org/wiki/Microbiologie';
  const targetUrl = webCap?.url || eduCap?.url || defaultUrl;
  const entityPos = entity.capabilities.find(c => c.type === 'transform')?.position;

  const handleClick = (e: any) => {
    e.stopPropagation();
    useWorldStore.getState().setSpatialContext(entity.id, null);
    if (entityPos) {
      useWorldStore.getState().setCameraFocusTarget([entityPos.x, entityPos.y + 0.15, entityPos.z]);
    }
    playAudioFx('switch_click', entityPos);
    openWebModal(targetUrl, `🔬 ${title}`);
  };

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (groupRef.current) {
      const targetY = isHovered ? 0.02 : 0;
      groupRef.current.position.y += (targetY - groupRef.current.position.y) * 0.15;
    }
    if (fineKnobRef.current && isHovered) {
      fineKnobRef.current.rotation.x = t * 1.5;
    }
    if (turretRef.current) {
      turretRef.current.rotation.y = isHovered ? Math.sin(t * 0.8) * 0.08 : 0;
    }
  });

  const micrographTexture = useMemo(() => getMicroscopeCanvasTexture(), []);

  return (
    <group
      ref={groupRef}
      onClick={handleClick}
      onPointerOver={(e) => { e.stopPropagation(); setIsHovered(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setIsHovered(false); document.body.style.cursor = 'auto'; }}
    >
      {/* 1. Heavy Horseshoe Base (Cast Iron & Enameled Dark Slate) */}
      <mesh position={[0, 0.02, 0.03]} castShadow receiveShadow>
        <boxGeometry args={[0.26, 0.038, 0.30]} />
        <meshStandardMaterial
          color={isHovered ? '#334155' : '#1e293b'}
          metalness={0.7}
          roughness={0.3}
        />
      </mesh>

      {/* Horseshoe Front Cutout */}
      <mesh position={[0, 0.02, 0.14]}>
        <boxGeometry args={[0.10, 0.04, 0.09]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>

      {/* Vibration-Damping Rubber Pads */}
      {[-0.1, 0.1].map(x => (
        [-0.1, 0.12].map(z => (
          <mesh key={`${x}-${z}`} position={[x, 0.002, z]}>
            <cylinderGeometry args={[0.015, 0.015, 0.004, 16]} />
            <meshBasicMaterial color="#020617" />
          </mesh>
        ))
      ))}

      {/* 2. Sub-stage Illuminator & Field Diaphragm Housing */}
      <mesh position={[0, 0.05, 0.02]}>
        <cylinderGeometry args={[0.045, 0.055, 0.03, 24]} />
        <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.25} />
      </mesh>

      {/* Sub-stage Transillumination Light Lens */}
      <mesh position={[0, 0.068, 0.02]}>
        <circleGeometry args={[0.032, 24]} />
        <meshBasicMaterial color={isHovered ? '#67e8f9' : '#38bdf8'} />
      </mesh>

      {/* Focused Light Beam pointing upward through the stage */}
      <pointLight
        position={[0, 0.09, 0.02]}
        color="#38bdf8"
        intensity={isHovered ? 2.5 : 0.8}
        distance={0.65}
      />

      {/* 3. Curved Back Pillar & Main Stand Arm */}
      <group position={[0, 0.18, -0.09]}>
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[0.065, 0.28, 0.07]} />
          <meshStandardMaterial color="#1e293b" metalness={0.75} roughness={0.3} />
        </mesh>
        {/* Forward Arc over the Stage */}
        <mesh position={[0, 0.14, 0.05]} rotation={[0.42, 0, 0]} castShadow>
          <boxGeometry args={[0.06, 0.12, 0.065]} />
          <meshStandardMaterial color="#1e293b" metalness={0.75} roughness={0.3} />
        </mesh>
      </group>

      {/* 4. Coaxial Coarse & Fine Focus Adjustment Knobs */}
      <group position={[0, 0.15, -0.09]}>
        {[-0.055, 0.055].map((x, idx) => (
          <group key={idx} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            {/* Coarse knob (Large, knurled) */}
            <mesh>
              <cylinderGeometry args={[0.032, 0.032, 0.022, 24]} />
              <meshStandardMaterial color="#475569" metalness={0.85} roughness={0.2} />
            </mesh>
            {/* Fine focus knob (Smaller, outer tier) */}
            <group ref={idx === 0 ? fineKnobRef : undefined} position={[0, x > 0 ? 0.016 : -0.016, 0]}>
              <mesh>
                <cylinderGeometry args={[0.018, 0.018, 0.012, 18]} />
                <meshStandardMaterial color="#f59e0b" metalness={0.9} roughness={0.15} />
              </mesh>
            </group>
          </group>
        ))}
      </group>

      {/* 5. Precision Mechanical Stage & Slide Clips */}
      <group position={[0, 0.15, 0.02]}>
        {/* Stage Plate (Black anodized aluminum) */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.22, 0.014, 0.18]} />
          <meshStandardMaterial color="#0f172a" metalness={0.5} roughness={0.4} />
        </mesh>

        {/* Central Aperture Hole */}
        <mesh position={[0, 0.008, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.025, 0.035, 24]} />
          <meshBasicMaterial color="#334155" />
        </mesh>

        {/* Mechanical Stage Specimen Slide (Glass) */}
        <group position={[0, 0.012, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.13, 0.004, 0.048]} />
            <meshPhysicalMaterial
              color="#e0f2fe"
              transparent
              opacity={0.88}
              roughness={0.05}
              transmission={0.92}
              ior={1.52}
            />
          </mesh>

          {/* Micrograph Specimen Circular Cover Slip with High-DPI Texture */}
          <mesh position={[0, 0.0035, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.021, 32]} />
            <meshBasicMaterial map={micrographTexture} toneMapped={false} />
          </mesh>

          {/* Brass Slide Clips */}
          {[-0.055, 0.055].map((x) => (
            <mesh key={x} position={[x, 0.006, 0.012]}>
              <boxGeometry args={[0.008, 0.004, 0.042]} />
              <meshStandardMaterial color="#d97706" metalness={0.9} roughness={0.2} />
            </mesh>
          ))}
        </group>
      </group>

      {/* 6. Revolving Objective Turret & Quadruple Nosepiece */}
      <group position={[0, 0.27, 0.02]}>
        {/* Revolving Turret Disk */}
        <group ref={turretRef}>
          <mesh rotation={[0, 0, 0]}>
            <cylinderGeometry args={[0.042, 0.048, 0.018, 24]} />
            <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.2} />
          </mesh>

          {/* 3 Objective Lenses pointing down towards the stage */}
          {[0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].map((angle, idx) => {
            const ox = Math.cos(angle) * 0.025;
            const oz = Math.sin(angle) * 0.025;
            const lensColors = ['#e11d48', '#2563eb', '#f59e0b']; // Standard color rings: 10x yellow, 40x blue, 100x red
            const lensLen = 0.045 + idx * 0.01;
            return (
              <group key={idx} position={[ox, -lensLen / 2, oz]} rotation={[0.06 * Math.sin(angle), 0, 0.06 * Math.cos(angle)]}>
                {/* Brass barrel */}
                <mesh>
                  <cylinderGeometry args={[0.009, 0.008, lensLen, 16]} />
                  <meshStandardMaterial color="#e2e8f0" metalness={0.92} roughness={0.15} />
                </mesh>
                {/* Magnification ID Color Band */}
                <mesh position={[0, 0.008, 0]}>
                  <cylinderGeometry args={[0.0092, 0.0092, 0.004, 16]} />
                  <meshBasicMaterial color={lensColors[idx]} />
                </mesh>
                {/* Front lens optical glass element */}
                <mesh position={[0, -lensLen / 2 + 0.001, 0]} rotation={[Math.PI / 2, 0, 0]}>
                  <circleGeometry args={[0.005, 12]} />
                  <meshBasicMaterial color="#38bdf8" />
                </mesh>
              </group>
            );
          })}
        </group>
      </group>

      {/* 7. Binocular Head & Eyepieces */}
      <group position={[0, 0.32, -0.01]}>
        {/* Prism Housing (Inclined 30 degrees) */}
        <mesh position={[0, 0.03, -0.02]} rotation={[-0.45, 0, 0]} castShadow>
          <boxGeometry args={[0.08, 0.07, 0.09]} />
          <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
        </mesh>

        {/* Dual Eyepiece Tubes (Interpupillary distance adjustment) */}
        {[-0.032, 0.032].map((x, idx) => (
          <group key={idx} position={[x, 0.08, -0.05]} rotation={[-0.45, 0, 0]}>
            {/* Tube body */}
            <mesh>
              <cylinderGeometry args={[0.014, 0.013, 0.06, 18]} />
              <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.25} />
            </mesh>
            {/* Rubber Eye Guard */}
            <mesh position={[0, 0.032, 0]}>
              <cylinderGeometry args={[0.016, 0.014, 0.012, 18]} />
              <meshStandardMaterial color="#020617" roughness={0.9} />
            </mesh>
            {/* Ocular Glass Lens */}
            <mesh position={[0, 0.034, 0]}>
              <circleGeometry args={[0.011, 16]} />
              <meshPhysicalMaterial
                color="#38bdf8"
                transparent
                opacity={0.75}
                roughness={0.1}
                transmission={0.85}
              />
            </mesh>
          </group>
        ))}
      </group>

      {/* Floating Hover Badge */}
      {isHovered && (
        <Html position={[0, 0.46, 0]} center style={{ pointerEvents: 'none', userSelect: 'none' }}>
          <div style={{
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1.5px solid #06b6d4',
            borderRadius: '16px',
            padding: '6px 14px',
            color: '#e0f2fe',
            fontSize: '11px',
            fontWeight: 600,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.8), 0 0 16px rgba(6, 182, 212, 0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            whiteSpace: 'nowrap'
          }}>
            <span>🔬</span>
            <span>Microbiologie & Données NCBI</span>
            <span style={{ color: '#38bdf8' }}>↗</span>
          </div>
        </Html>
      )}
    </group>
  );
};
