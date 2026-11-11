import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useWorldStore } from '../engine/store';

interface ImpactWave {
  id: number;
  x: number;
  y: number;
  z: number;
  type: string;
  startTime: number;
}

const ShockwaveRing: React.FC<{ wave: ImpactWave }> = ({ wave }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const color = 
    wave.type === 'chop' ? '#f59e0b' : 
    wave.type === 'splash' ? '#06b6d4' : 
    wave.type === 'fire' || wave.type === 'spark' ? '#f97316' : 
    wave.type === 'glow' ? '#38bdf8' : 
    wave.type === 'unlock' ? '#a855f7' : 
    '#10b981';

  useFrame(() => {
    if (!meshRef.current) return;
    const elapsed = (performance.now() - wave.startTime) / 1000;
    const progress = Math.min(1, elapsed / 0.9);
    const scale = 1 + progress * 4.8;
    meshRef.current.scale.set(scale, scale, 1);
    const mat = meshRef.current.material as THREE.MeshBasicMaterial;
    if (mat) {
      mat.opacity = Math.max(0, (1 - progress) * 0.75);
    }
  });

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[wave.x, wave.y + 0.008, wave.z]}
    >
      <ringGeometry args={[0.068, 0.08, 32]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.75}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

export const AtmosphericParticles: React.FC = () => {
  const currentAtmosphere = useWorldStore(state => state.currentAtmosphere);
  const entities = useWorldStore(state => state.world.ir.entities);

  // 1. Ambient Sunbeam Dust Motes (45 lightweight particles)
  const dustCount = 45;
  const dustPointsRef = useRef<THREE.Points>(null);

  const dustPositions = useMemo(() => {
    const pos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      pos[i * 3 + 0] = (Math.random() - 0.5) * 8;
      pos[i * 3 + 1] = 0.4 + Math.random() * 2.6;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    return pos;
  }, [dustCount]);

  // 2. Dynamic Impact Shockwaves (triggered on drop or interaction)
  const [impactWaves, setImpactWaves] = useState<ImpactWave[]>([]);

  useEffect(() => {
    const handleImpact = (e: any) => {
      const detail = e.detail || {};
      const newWave: ImpactWave = {
        id: Date.now() + Math.random(),
        x: detail.x || 0,
        y: detail.y || 0.88,
        z: detail.z || 0,
        type: detail.type || 'chime',
        startTime: performance.now()
      };
      setImpactWaves(prev => [...prev.slice(-4), newWave]);
    };

    const handleIgnite = (e: any) => {
      const detail = e.detail || {};
      const newWave: ImpactWave = {
        id: Date.now() + Math.random(),
        x: detail.x || 0,
        y: detail.y || 0.88,
        z: detail.z || 0,
        type: 'fire',
        startTime: performance.now()
      };
      setImpactWaves(prev => [...prev.slice(-4), newWave]);
    };

    const handleReadStudy = (e: any) => {
      const detail = e.detail || {};
      const newWave: ImpactWave = {
        id: Date.now() + Math.random(),
        x: detail.x || 0,
        y: detail.y || 0.88,
        z: detail.z || 0,
        type: 'glow',
        startTime: performance.now()
      };
      setImpactWaves(prev => [...prev.slice(-4), newWave]);
    };

    const handleUnlock = (e: any) => {
      const detail = e.detail || {};
      const newWave: ImpactWave = {
        id: Date.now() + Math.random(),
        x: detail.x || 0,
        y: detail.y || 0.88,
        z: detail.z || 0,
        type: 'unlock',
        startTime: performance.now()
      };
      setImpactWaves(prev => [...prev.slice(-4), newWave]);
    };

    window.addEventListener('worldpilot_drop_impact', handleImpact);
    window.addEventListener('worldpilot_ignite_fire', handleIgnite);
    window.addEventListener('worldpilot_read_study', handleReadStudy);
    window.addEventListener('worldpilot_unlock_mechanism', handleUnlock);
    return () => {
      window.removeEventListener('worldpilot_drop_impact', handleImpact);
      window.removeEventListener('worldpilot_ignite_fire', handleIgnite);
      window.removeEventListener('worldpilot_read_study', handleReadStudy);
      window.removeEventListener('worldpilot_unlock_mechanism', handleUnlock);
    };
  }, []);

  // Find cooking / heat sources for steam
  const cookwareEntities = useMemo(() => {
    return Object.values(entities).filter(e => {
      const id = e.id.toLowerCase();
      const asset = e.visuals?.assetId?.toLowerCase() || '';
      return id.includes('cocotte') || id.includes('poele') || id.includes('marmite') ||
             asset.includes('cocotte') || asset.includes('poele') || id.includes('coffee-machine');
    });
  }, [entities]);

  // Animate dust particles
  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    if (dustPointsRef.current) {
      dustPointsRef.current.rotation.y = time * 0.015;
      dustPointsRef.current.position.y = Math.sin(time * 0.25) * 0.04;
    }

    // Clean expired impact waves (> 1.2s)
    if (impactWaves.length > 0) {
      const now = performance.now();
      const valid = impactWaves.filter(w => now - w.startTime < 1200);
      if (valid.length !== impactWaves.length) {
        setImpactWaves(valid);
      }
    }
  });

  return (
    <group>
      {/* 1. Golden Ambient Dust Motes */}
      <points ref={dustPointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[dustPositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.035}
          color={currentAtmosphere === 'night' || currentAtmosphere === 'dusk' ? '#a5b4fc' : '#fef08a'}
          transparent
          opacity={currentAtmosphere === 'night' ? 0.22 : 0.38}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* 2. Rising Cooking Steam Wisps above Cookware */}
      {cookwareEntities.map(cw => {
        const tPos = cw.capabilities.find(c => c.type === 'transform')?.position || { x: 0, y: 0.9, z: 0 };
        return (
          <group key={cw.id} position={[tPos.x, tPos.y + 0.15, tPos.z]}>
            {[0, 1, 2].map(i => (
              <mesh key={i} position={[(i - 1) * 0.04, i * 0.08, 0]}>
                <sphereGeometry args={[0.045 + i * 0.02, 12, 12]} />
                <meshStandardMaterial
                  color="#ffffff"
                  transparent
                  opacity={0.25 - i * 0.06}
                  roughness={0.9}
                  metalness={0.1}
                />
              </mesh>
            ))}
          </group>
        );
      })}

      {/* 3. Surface Impact Shockwaves */}
      {impactWaves.map(wave => (
        <ShockwaveRing key={wave.id} wave={wave} />
      ))}
    </group>
  );
};
