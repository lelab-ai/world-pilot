import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useWorldStore } from '../engine/store';
import { CausalityAffordance, evaluateSpatialCausality } from '../engine/spatialCausality';
import { getSupportingSurfaceHeight } from '../engine/spatialSurface';

interface SpatialCursorVisualizerProps {
  activeAffordance?: CausalityAffordance | null;
}

export const SpatialCursorVisualizer: React.FC<SpatialCursorVisualizerProps> = ({ activeAffordance: propAffordance }) => {
  const isDragging3D = useWorldStore(state => state.isDragging3D);
  const draggedEntityId = useWorldStore(state => state.draggedEntityId);
  const snappedTargetId = useWorldStore(state => state.snappedTargetId);
  const entities = useWorldStore(state => state.world.ir.entities);

  const shadowGroupRef = useRef<THREE.Group>(null);
  const shadowMeshRef = useRef<THREE.Mesh>(null);
  const laserRef = useRef<THREE.Mesh>(null);
  const resonanceRingRef = useRef<THREE.Mesh>(null);

  const draggedEntity = draggedEntityId ? entities[draggedEntityId] : null;
  const targetEntity = snappedTargetId ? entities[snappedTargetId] : null;
  const draggedPos = draggedEntity?.capabilities.find(c => c.type === 'transform')?.position || { x: 0, y: 0, z: 0 };

  const effectiveAffordance = propAffordance || ((draggedEntity && targetEntity) ? evaluateSpatialCausality(draggedEntity, targetEntity) : null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    if (!isDragging3D || !draggedEntity) return;

    // 1. Compute exact supporting surface altitude beneath the dragged object
    const surfaceInfo = getSupportingSurfaceHeight(draggedPos.x, draggedPos.z, entities, draggedEntityId || undefined);
    const surfaceY = surfaceInfo.surfaceY;
    const altitude = Math.max(0, draggedPos.y - surfaceY);

    // 2. Position dynamic contact drop shadow directly on the surface
    if (shadowGroupRef.current) {
      shadowGroupRef.current.position.set(draggedPos.x, surfaceY + 0.004, draggedPos.z);
    }

    // 3. Modulate shadow scale and opacity according to altitude
    if (shadowMeshRef.current) {
      const radius = 0.22 + Math.min(altitude * 0.45, 0.55);
      shadowMeshRef.current.scale.set(radius, radius, radius);

      const mat = shadowMeshRef.current.material as THREE.MeshBasicMaterial;
      if (mat) {
        mat.opacity = Math.max(0.12, 0.65 / (1 + altitude * 2.2));
      }
    }

    // 4. Update vertical laser guide
    if (laserRef.current) {
      const laserHeight = Math.max(0.01, altitude);
      laserRef.current.position.set(draggedPos.x, surfaceY + laserHeight * 0.5, draggedPos.z);
      laserRef.current.scale.set(1, laserHeight, 1);
    }

    // 5. Resonance ring pulse on snap target
    if (resonanceRingRef.current) {
      const pulse = 1 + Math.sin(time * 7) * 0.09;
      resonanceRingRef.current.scale.set(pulse, pulse, pulse);
      resonanceRingRef.current.rotation.z = time * 0.9;
    }
  });

  if (!isDragging3D || !draggedEntity) return null;

  const surfaceInfo = getSupportingSurfaceHeight(draggedPos.x, draggedPos.z, entities, draggedEntityId || undefined);
  const surfaceY = surfaceInfo.surfaceY;
  const altitude = Math.max(0, draggedPos.y - surfaceY);
  const isSnapped = !!snappedTargetId;

  return (
    <group>
      {/* 1. Dynamic Vertical Laser Altitude Guide */}
      {altitude > 0.03 && (
        <mesh ref={laserRef}>
          <cylinderGeometry args={[0.0025, 0.0025, 1, 12]} />
          <meshBasicMaterial
            color={isSnapped ? "#10b981" : "#38bdf8"}
            transparent
            opacity={0.65}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* 2. Dynamic Contact Grounding Shadow Group on Surface */}
      <group ref={shadowGroupRef} position={[draggedPos.x, surfaceY + 0.004, draggedPos.z]}>
        {/* Soft Ambient Occlusion Disc */}
        <mesh ref={shadowMeshRef} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[1, 32]} />
          <meshBasicMaterial
            color="#000000"
            transparent
            opacity={0.5}
            depthWrite={false}
          />
        </mesh>

        {/* Concentric Precision Reticle Ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.18, 0.22, 32]} />
          <meshBasicMaterial
            color={isSnapped ? "#10b981" : "#38bdf8"}
            transparent
            opacity={0.8}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>

        {/* Center Contact Spot */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.03, 16]} />
          <meshBasicMaterial
            color={isSnapped ? "#34d399" : "#ffffff"}
            transparent
            opacity={0.9}
            depthWrite={false}
          />
        </mesh>

        {/* Floating Altitude Chip for Desktop Precision */}
        <Html
          position={[0, 0.08, 0]}
          center
          distanceFactor={7}
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '2px 8px',
              background: 'rgba(15, 23, 42, 0.88)',
              border: isSnapped ? '1px solid #10b981' : '1px solid rgba(56, 189, 248, 0.5)',
              boxShadow: isSnapped ? '0 0 10px rgba(16, 185, 129, 0.35)' : '0 2px 8px rgba(0,0,0,0.4)',
              borderRadius: '10px',
              color: isSnapped ? '#34d399' : '#f8fafc',
              fontSize: '10px',
              fontWeight: 650,
              whiteSpace: 'nowrap',
              backdropFilter: 'blur(8px)',
              pointerEvents: 'none'
            }}
          >
            <span>{isSnapped ? '🧲' : '↕'}</span>
            <span>
              {isSnapped 
                ? (effectiveAffordance?.label || `Aimanté sur ${targetEntity?.name || 'Cible'}`)
                : `${(altitude * 100).toFixed(0)} cm · ${surfaceInfo.surfaceName}`}
            </span>
          </div>
        </Html>
      </group>

      {/* 3. Magnetic Snap Target Resonance Field & Visual Arc */}
      {(effectiveAffordance || targetEntity) && (() => {
        const snapPos = effectiveAffordance?.snapPosition || targetEntity?.capabilities.find(c => c.type === 'transform')?.position;
        if (!snapPos) return null;

        return (
          <group position={[snapPos.x, snapPos.y + 0.02, snapPos.z]}>
            {/* Concentric Glow Rings on Target */}
            <mesh ref={resonanceRingRef} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.22, 0.28, 32]} />
              <meshBasicMaterial
                color="#10b981"
                transparent
                opacity={0.8}
                depthWrite={false}
                side={THREE.DoubleSide}
              />
            </mesh>

            {/* Secondary Outer Ripple */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.34, 0.38, 32]} />
              <meshBasicMaterial
                color="#34d399"
                transparent
                opacity={0.4}
                depthWrite={false}
                side={THREE.DoubleSide}
              />
            </mesh>

            {/* Contextual Action Badge in 3D Space */}
            <Html
              position={[0, 0.32, 0]}
              center
              distanceFactor={6}
              style={{
                pointerEvents: 'none',
                userSelect: 'none',
                whiteSpace: 'nowrap'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  background: 'linear-gradient(135deg, rgba(5, 150, 105, 0.95), rgba(16, 185, 129, 0.95))',
                  border: '1.5px solid rgba(255, 255, 255, 0.4)',
                  borderRadius: '16px',
                  boxShadow: '0 4px 20px rgba(16, 185, 129, 0.5)',
                  color: '#ffffff',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  pointerEvents: 'none'
                }}
              >
                <span style={{ fontSize: '14px' }}>{effectiveAffordance?.icon || '🧲'}</span>
                <span>{effectiveAffordance?.label || `Déposer sur ${targetEntity?.name}`}</span>
                <span style={{ opacity: 0.8, fontSize: '9px', fontWeight: 500 }}>(Relâcher)</span>
              </div>
            </Html>
          </group>
        );
      })()}
    </group>
  );
};
