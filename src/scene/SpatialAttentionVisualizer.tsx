// src/scene/SpatialAttentionVisualizer.tsx
// Visualiseur 3D d'Attention Spatiale, Heatmap Volumétrique & Ruban de Scanpath Oculaire.
// Matérialise les foyers d'attention humaine et la trajectoire de fixation dans l'espace 3D.

import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import { useWorldStore } from '../engine/store';
import { generateVolumetricHeatmapPoints } from '../engine/spatialAttentionTelemetry';

export const SpatialAttentionVisualizer: React.FC = () => {
  const spatialAttention = useWorldStore(s => s.spatialAttention);
  const isHeatmapVisible = spatialAttention.isHeatmapVisible;

  const pointsRef = useRef<THREE.Group>(null);
  const scanpathLineRef = useRef<THREE.Line>(null);

  // Points de densité volumétrique de la heatmap
  const heatmapPoints = useMemo(() => {
    if (!isHeatmapVisible) return [];
    return generateVolumetricHeatmapPoints(spatialAttention);
  }, [isHeatmapVisible, spatialAttention]);

  // Géométrie de trajectoire de regard (Scanpath Ribbon 3D)
  const scanpathGeometry = useMemo(() => {
    if (!isHeatmapVisible || spatialAttention.scanpath.points.length < 2) return null;

    const vectors = spatialAttention.scanpath.points.map(
      p => new THREE.Vector3(p.x, p.y + 0.18, p.z)
    );

    // Si au moins 3 points, on génère une spline fluide CatmullRom
    if (vectors.length >= 3) {
      const curve = new THREE.CatmullRomCurve3(vectors);
      const points = curve.getPoints(50);
      return new THREE.BufferGeometry().setFromPoints(points);
    }

    return new THREE.BufferGeometry().setFromPoints(vectors);
  }, [isHeatmapVisible, spatialAttention.scanpath.points]);

  // Animation de pulsation douce
  useFrame(({ clock }) => {
    if (!isHeatmapVisible || !pointsRef.current) return;
    const t = clock.getElapsedTime();
    pointsRef.current.children.forEach((child, idx) => {
      const pulse = 1.0 + Math.sin(t * 3.5 + idx * 0.8) * 0.15;
      child.scale.set(pulse, pulse, pulse);
    });
  });

  if (!isHeatmapVisible) return null;

  return (
    <group name="spatial-attention-visualizer">
      {/* 1. Trajectoire de Regard (Scanpath 3D) */}
      {scanpathGeometry && (
        <primitive
          object={
            new THREE.Line(
              scanpathGeometry,
              new THREE.LineBasicMaterial({
                color: 0x38bdf8,
                linewidth: 2,
                transparent: true,
                opacity: 0.75
              })
            )
          }
          ref={scanpathLineRef}
        />
      )}

      {/* 2. Nuage de Points Volumétrique (Attention Heatmap) */}
      <group ref={pointsRef}>
        {heatmapPoints.map((pt, idx) => {
          // Palette chromatique thermique : Cyan (froid/faible) -> Or (moyen) -> Fuchsia (très élevé)
          let colorHex = '#06b6d4'; // Cyan
          if (pt.weight > 0.65) {
            colorHex = '#ec4899'; // Fuchsia intense
          } else if (pt.weight > 0.35) {
            colorHex = '#f59e0b'; // Or
          }

          const radius = 0.08 + pt.weight * 0.14;
          const opacity = 0.35 + pt.weight * 0.45;
          const fixation = spatialAttention.fixations[pt.entityId];

          return (
            <group key={pt.entityId || idx} position={[pt.x, pt.y, pt.z]}>
              <Sphere args={[radius, 16, 16]}>
                <meshStandardMaterial
                  color={colorHex}
                  emissive={colorHex}
                  emissiveIntensity={0.6 + pt.weight * 0.8}
                  transparent
                  opacity={opacity}
                  roughness={0.2}
                />
              </Sphere>

              {/* Étiquette d'attention 3D Drei */}
              {fixation && (
                <Html
                  position={[0, radius + 0.08, 0]}
                  center
                  distanceFactor={6}
                  style={{ pointerEvents: 'none' }}
                >
                  <div
                    style={{
                      background: 'rgba(15, 23, 42, 0.85)',
                      border: `1px solid ${colorHex}`,
                      borderRadius: '8px',
                      padding: '3px 8px',
                      color: '#f8fafc',
                      fontSize: '11px',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      boxShadow: `0 4px 12px ${colorHex}40`,
                      backdropFilter: 'blur(4px)'
                    }}
                  >
                    <span>👁️</span>
                    <span>{Math.round(fixation.durationMs / 100) / 10}s</span>
                    <span style={{ color: colorHex, fontSize: '10px' }}>
                      ({Math.round(pt.weight * 100)}%)
                    </span>
                  </div>
                </Html>
              )}
            </group>
          );
        })}
      </group>
    </group>
  );
};
