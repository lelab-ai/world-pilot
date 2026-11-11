// src/scene/PlaytesterTrajectory3D.tsx
// Visualiseur 3D de la trajectoire du Synthetic AI Playtester dans l'espace WorldPilot.
// Matérialise les waypoints, les points d'interaction, les alertes d'obstacles
// et le trajet de navigation de l'agent virtuel autonome.

import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useWorldStore } from '../engine/store';

export const PlaytesterTrajectory3D: React.FC = () => {
  const isVisualizerActive = useWorldStore(s => s.isPlaytesterVisualizerActive);
  const playtestResult = useWorldStore(s => s.playtesterResult);
  const toggleVisualizer = useWorldStore(s => s.togglePlaytesterVisualizer);
  const applyRepair = useWorldStore(s => s.applyMinimalPatchAndRetest);
  const entities = useWorldStore(s => s.world.ir.entities);

  const tracerGroupRef = useRef<THREE.Group>(null);
  const pulseSphereRef = useRef<THREE.Mesh>(null);

  const waypoints = playtestResult?.waypoints || [];

  // Construction de la courbe de navigation reliant les points clés
  const { curvePoints, botPosition, blockedWaypoint } = useMemo(() => {
    if (waypoints.length === 0) {
      return { curvePoints: [], botPosition: null, blockedWaypoint: null };
    }

    const vectors = waypoints.map(wp => new THREE.Vector3(wp.position[0], Math.max(0.1, wp.position[1]), wp.position[2]));

    // Trouver le point bloquant éventuel
    const blocked = waypoints.find(wp => wp.status === 'blocked' || wp.status === 'error');

    // Dernier waypoint atteint par le bot
    const lastWp = waypoints[waypoints.length - 1];
    const botPos = new THREE.Vector3(lastWp.position[0], lastWp.position[1] + 0.15, lastWp.position[2]);

    // Échantillonnage de courbe douce si au moins 2 points
    if (vectors.length >= 2) {
      const curve = new THREE.CatmullRomCurve3(vectors, false, 'centripetal', 0.5);
      return { curvePoints: curve.getPoints(40), botPosition: botPos, blockedWaypoint: blocked || null };
    }

    return { curvePoints: vectors, botPosition: botPos, blockedWaypoint: blocked || null };
  }, [waypoints]);

  // Animation douce de pulsation et de balayage lumineux
  useFrame((state) => {
    if (!isVisualizerActive || waypoints.length === 0) return;
    const t = state.clock.getElapsedTime();
    if (tracerGroupRef.current) {
      tracerGroupRef.current.position.y = Math.sin(t * 3.0) * 0.02;
    }
    if (pulseSphereRef.current) {
      const scale = 1.0 + Math.sin(t * 5.0) * 0.2;
      pulseSphereRef.current.scale.set(scale, scale, scale);
    }
  });

  if (!isVisualizerActive || waypoints.length === 0 || Object.keys(entities || {}).length === 0) return null;

  return (
    <group name="synthetic-playtester-trajectory">
      {/* 1. Ligne de trajectoire continue reliant les waypoints */}
      {curvePoints.length > 1 && (
        <line>
          <bufferGeometry
            attach="geometry"
            onUpdate={(self) => {
              self.setFromPoints(curvePoints);
            }}
          />
          <lineBasicMaterial
            attach="material"
            color={playtestResult?.success ? '#10b981' : '#f59e0b'}
            linewidth={3}
            transparent
            opacity={0.85}
          />
        </line>
      )}

      {/* 2. Marqueurs 3D de Waypoints */}
      {waypoints.map((wp) => {
        const isSuccess = wp.status === 'success';
        const isBlocked = wp.status === 'blocked' || wp.status === 'error';
        const isMoving = wp.status === 'moving';

        const color = isBlocked ? '#ef4444' : isSuccess ? '#10b981' : isMoving ? '#38bdf8' : '#eab308';
        const radius = isBlocked ? 0.09 : isSuccess ? 0.07 : 0.05;

        return (
          <group key={wp.id} position={[wp.position[0], Math.max(0.08, wp.position[1]), wp.position[2]]}>
            <mesh>
              <sphereGeometry args={[radius, 16, 16]} />
              <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={0.6}
                roughness={0.2}
                metalness={0.3}
              />
            </mesh>

            {/* Anneau d'onde au sol pour chaque point d'action */}
            {isSuccess && (
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -radius + 0.02, 0]}>
                <ringGeometry args={[radius * 1.3, radius * 1.8, 24]} />
                <meshBasicMaterial color={color} transparent opacity={0.4} side={THREE.DoubleSide} />
              </mesh>
            )}

            {/* Balise d'alerte rouge pulsante sur l'obstacle */}
            {isBlocked && (
              <mesh ref={pulseSphereRef} position={[0, 0.25, 0]}>
                <octahedronGeometry args={[0.12, 0]} />
                <meshBasicMaterial color="#ef4444" wireframe />
              </mesh>
            )}
          </group>
        );
      })}

      {/* 3. Tête d'Agent Robotique Virtuel (Bot Cursor) */}
      {botPosition && (
        <group ref={tracerGroupRef} position={[botPosition.x, botPosition.y + 0.25, botPosition.z]}>
          <mesh>
            <sphereGeometry args={[0.1, 24, 24]} />
            <meshPhysicalMaterial
              color="#0284c7"
              emissive="#0284c7"
              emissiveIntensity={0.5}
              roughness={0.1}
              metalness={0.8}
              clearcoat={0.9}
            />
          </mesh>
          {/* Visière lumineuse du bot */}
          <mesh position={[0, 0, 0.08]}>
            <boxGeometry args={[0.12, 0.04, 0.05]} />
            <meshBasicMaterial color={playtestResult?.success ? '#34d399' : '#f87171'} />
          </mesh>

          {/* Badge spatial flottant */}
          <Html position={[0, 0.40, 0]} center distanceFactor={16}>
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.94)',
                border: `1.5px solid ${playtestResult?.success ? '#10b981' : '#f59e0b'}`,
                borderRadius: '8px',
                padding: '7px 14px',
                color: '#f8fafc',
                fontSize: '12px',
                fontWeight: 700,
                whiteSpace: 'nowrap',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                pointerEvents: 'auto'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>🤖 Playtester ({playtestResult?.persona})</span>
                <span
                  style={{
                    background: playtestResult?.success ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                    color: playtestResult?.success ? '#10b981' : '#ef4444',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    fontSize: '10px'
                  }}
                >
                  {playtestResult?.completionRate}% complété
                </span>
                <button
                  onClick={toggleVisualizer}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    fontSize: '12px',
                    marginLeft: '4px'
                  }}
                  title="Fermer le visualiseur 3D"
                >
                  ✕
                </button>
              </div>

              {blockedWaypoint && (
                <div style={{ fontSize: '10px', color: '#fca5a5' }}>
                  ⚠️ Obstacle : {blockedWaypoint.targetName || 'Bloqué'}
                </div>
              )}

              {playtestResult?.minimalPatch && !playtestResult?.patchApplied && (
                <button
                  onClick={() => applyRepair()}
                  style={{
                    marginTop: '4px',
                    background: 'linear-gradient(135deg, #059669, #10b981)',
                    border: 'none',
                    borderRadius: '4px',
                    color: '#fff',
                    padding: '3px 8px',
                    fontSize: '10px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  ✨ Réparer (Minimal Patch)
                </button>
              )}
            </div>
          </Html>
        </group>
      )}
    </group>
  );
};
