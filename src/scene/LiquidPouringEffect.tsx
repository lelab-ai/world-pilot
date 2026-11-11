import React, { useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useWorldStore } from '../engine/store';

interface ActivePourStream {
  id: number;
  sourceId: string;
  targetId: string;
  startTime: number;
}

export const LiquidPouringEffect: React.FC = () => {
  const [activeStreams, setActiveStreams] = useState<ActivePourStream[]>([]);
  const entities = useWorldStore(state => state.world.ir.entities);

  useEffect(() => {
    const handlePour = (e: any) => {
      const detail = e.detail || {};
      if (!detail.sourceId) return;

      const newStream: ActivePourStream = {
        id: Date.now() + Math.random(),
        sourceId: detail.sourceId,
        targetId: detail.targetId,
        startTime: performance.now()
      };

      setActiveStreams(prev => [...prev.slice(-2), newStream]);
    };

    window.addEventListener('worldpilot_pour_liquid', handlePour);
    return () => window.removeEventListener('worldpilot_pour_liquid', handlePour);
  }, []);

  useFrame(() => {
    if (activeStreams.length === 0) return;
    const now = performance.now();
    const valid = activeStreams.filter(s => now - s.startTime < 2800);
    if (valid.length !== activeStreams.length) {
      setActiveStreams(valid);
    }
  });

  if (activeStreams.length === 0) return null;

  return (
    <group>
      {activeStreams.map(stream => {
        const sourceEntity = entities[stream.sourceId];
        const targetEntity = entities[stream.targetId];
        if (!sourceEntity) return null;

        const sPos = sourceEntity.capabilities.find(c => c.type === 'transform')?.position || { x: 0, y: 1, z: 0 };
        const tPos = targetEntity?.capabilities.find(c => c.type === 'transform')?.position || { x: sPos.x, y: sPos.y - 0.25, z: sPos.z };

        const start = new THREE.Vector3(sPos.x, sPos.y + 0.08, sPos.z);
        const end = new THREE.Vector3(tPos.x, tPos.y + 0.02, tPos.z);
        const dir = new THREE.Vector3().subVectors(end, start);
        const streamLength = dir.length();
        const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
        const orientation = new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          dir.clone().normalize()
        );

        // Fluid color depending on source name
        const sName = (sourceEntity.name || '').toLowerCase();
        const isWine = sName.includes('vin') || sName.includes('rouge');
        const isOil = sName.includes('huile') || sName.includes('olive');
        const fluidColor = isWine ? '#991b1b' : isOil ? '#eab308' : '#38bdf8';

        return (
          <group key={stream.id}>
            {/* Stream Curve Cylinder accurately oriented towards target */}
            <mesh position={[midpoint.x, midpoint.y, midpoint.z]} quaternion={orientation}>
              <cylinderGeometry args={[0.007, 0.009, Math.max(0.01, streamLength), 12]} />
              <meshStandardMaterial
                color={fluidColor}
                transparent
                opacity={0.82}
                roughness={0.1}
                metalness={0.1}
                emissive={fluidColor}
                emissiveIntensity={0.25}
              />
            </mesh>

            {/* Impact Fluid Ripple in target vessel */}
            <mesh position={[end.x, end.y + 0.005, end.z]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.045, 24]} />
              <meshBasicMaterial color={fluidColor} transparent opacity={0.7} />
            </mesh>
            <mesh position={[end.x, end.y + 0.006, end.z]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.04, 0.055, 24]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={0.5} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};
