// src/scene/ResearchSpatialOverlay3D.tsx
// Visualiseur 3D spatial temps-réel pour le Cœur de Recherche WorldPilot :
// 1. Vecteurs & Arcs d'Intention Inverse (Affordances Émergentes)
// 2. Ondes de Choc & Halos d'Invariants (Semantic Blast Radius)
// 3. Grille de Densité d'Activité Spatiale (SAD) sur les parcelles Victoria VR

import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useWorldStore } from '../engine/store';
import { xrHaptics } from './xrHaptics';

function getEntityPos(entity?: any): [number, number, number] {
  if (!entity) return [0, 0.5, 0];
  const tr = entity.capabilities?.find((c: any) => c.type === 'transform');
  const pos = tr?.position || entity.transform?.position;
  if (!pos) return [0, 0.5, 0];
  if (Array.isArray(pos)) {
    return [pos[0] ?? 0, pos[1] ?? 0.5, pos[2] ?? 0];
  }
  return [pos.x ?? 0, pos.y ?? 0.5, pos.z ?? 0];
}

function getViolationLabel(type: string): string {
  switch (type) {
    case 'COLLIDER_DEADLOCK':
      return 'Obstruction physique (Collision)';
    case 'QUEST_UNREACHABLE':
      return 'Objectif de quête inaccessible';
    case 'INVARIANT_BROKEN':
      return 'Règle de sécurité violée';
    case 'ORPHAN_DEPENDENCY':
      return 'Dépendance manquante';
    default:
      return type;
  }
}

function getGestureLabel(gesture: string, isFr: boolean = true): string {
  switch (gesture) {
    case 'STRIKE':
    case 'DROP':
      return isFr ? 'Impulsion physique' : 'Physical impulse';
    case 'POUR':
      return isFr ? 'Versement' : 'Pouring';
    case 'INSERT':
      return isFr ? 'Insertion' : 'Insertion';
    case 'HEAT':
      return isFr ? 'Chauffe' : 'Heating';
    case 'MEASURE':
      return isFr ? 'Mesure & Diagnostic' : 'Measurement & Diagnosis';
    default:
      return gesture;
  }
}

interface MetaBeaconItemProps {
  entity: any;
  position: [number, number, number];
  color: string;
  label: string;
  onInteract: () => void;
}

const MetaBeaconItem: React.FC<MetaBeaconItemProps> = ({ position, color, label, onInteract }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = clock.getElapsedTime() * 1.8;
      meshRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 2) * 0.2;
    }
  });

  return (
    <group position={position}>
      {/* Prisme / Octaèdre rotatif holographique */}
      <mesh ref={meshRef}>
        <octahedronGeometry args={[0.09, 0]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} wireframe />
      </mesh>

      {/* Anneau pulsant au sol */}
      <mesh position={[0, -0.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.18, 0.22, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>

      {/* Étiquette Holographique 3D avec action interactive */}
      <Html position={[0, 0.22, 0]} center zIndexRange={[50, 0]}>
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.94)',
            border: `1.5px solid ${color}`,
            borderRadius: '8px',
            padding: '5px 10px',
            color: '#f8fafc',
            fontSize: '11px',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            boxShadow: `0 0 16px ${color}40`,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            pointerEvents: 'auto',
          }}
          onClick={(e) => {
            e.stopPropagation();
            onInteract();
          }}
        >
          <span>{label}</span>
          <span
            style={{
              fontSize: '9px',
              background: `${color}30`,
              color: color,
              padding: '2px 5px',
              borderRadius: '4px',
              fontWeight: 700,
            }}
          >
            Épreuve E2
          </span>
        </div>
      </Html>
    </group>
  );
};

interface VictoriaFrictionHalo3DProps {
  entityId: string;
  entityName: string;
  position: [number, number, number];
  consecutiveFrictionCount: number;
  lastAttemptedAction?: string;
  onResolve: () => void;
  onDismiss: () => void;
}

const VictoriaFrictionHalo3D: React.FC<VictoriaFrictionHalo3DProps> = ({
  entityName,
  position,
  consecutiveFrictionCount,
  lastAttemptedAction,
  onResolve,
  onDismiss,
}) => {
  const haloRingRef = useRef<THREE.Mesh>(null);
  const arrowRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (haloRingRef.current) {
      const scale = 1.0 + Math.sin(t * 3.2) * 0.12;
      haloRingRef.current.scale.set(scale, scale, 1);
    }
    if (arrowRef.current) {
      arrowRef.current.position.y = 0.52 + Math.sin(t * 4.2) * 0.06;
    }
  });

  const tipText = lastAttemptedAction === 'drag'
    ? `Déplacez "${entityName}" vers sa cible`
    : lastAttemptedAction === 'drop'
    ? `Relâchez "${entityName}" dans la zone réceptrice`
    : `Cliquez pour interagir avec "${entityName}"`;

  return (
    <group position={position}>
      {/* 1. Halo lumineux pulsé au sol */}
      <mesh ref={haloRingRef} position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.32, 0.46, 36]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.75} side={THREE.DoubleSide} />
      </mesh>
      
      {/* Disque diffus intérieur */}
      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.32, 32]} />
        <meshBasicMaterial color="#0284c7" transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>

      {/* 2. Flèche holographique descendante */}
      <group ref={arrowRef} position={[0, 0.52, 0]}>
        <mesh rotation={[0, 0, Math.PI]}>
          <coneGeometry args={[0.07, 0.16, 16]} />
          <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={0.9} />
        </mesh>
      </group>

      {/* 3. Micro-Badge Spatial 3D Victoria */}
      <Html position={[0, 0.82, 0]} center zIndexRange={[50, 0]}>
        <div
          style={{
            background: 'radial-gradient(ellipse at top left, rgba(15, 23, 42, 0.96), rgba(30, 41, 59, 0.94))',
            border: '1.5px solid rgba(56, 189, 248, 0.6)',
            borderRadius: '10px',
            padding: '8px 12px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6), 0 0 20px rgba(56, 189, 248, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            minWidth: '220px',
            maxWidth: '280px',
            pointerEvents: 'auto',
            animation: 'fadeIn 0.25s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '15px' }}>👩‍🚀</span>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8', letterSpacing: '0.02em' }}>
                Indice de Victoria
              </span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDismiss();
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: '13px',
                padding: '0 3px',
                lineHeight: 1,
              }}
              title="Fermer l'indice"
            >
              ✕
            </button>
          </div>

          <div style={{ fontSize: '11.5px', color: '#f8fafc', fontWeight: 600, lineHeight: 1.35 }}>
            {tipText}
          </div>

          <div style={{ fontSize: '10px', color: '#cbd5e1' }}>
            {consecutiveFrictionCount} tentative(s) sans déclenchement d'effet.
          </div>

          <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                xrHaptics.triggerHaptic('snap_connect');
                onResolve();
              }}
              style={{
                flex: 1,
                background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                border: 'none',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '10px',
                fontWeight: 700,
                padding: '5px 8px',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(2, 132, 199, 0.4)',
              }}
            >
              ⚡ Adapter avec Victoria
            </button>
          </div>
        </div>
      </Html>
    </group>
  );
};

export const ResearchSpatialOverlay3D: React.FC = () => {
  const uiLanguage = useWorldStore(s => s.uiLanguage);
  const isFr = uiLanguage === 'fr';
  const showCausalObservability = useWorldStore(s => s.showCausalObservability);
  const showResearchDashboardModal = useWorldStore(s => s.showResearchDashboardModal);
  const shadowGraph = useWorldStore(s => s.shadowGraph);
  const blastRadiusReport = useWorldStore(s => s.blastRadiusReport);
  const entities = useWorldStore(s => s.world.ir.entities);
  const promoteAffordance = useWorldStore(s => s.promoteEmergentAffordance);
  const dismissAffordance = useWorldStore(s => s.dismissEmergentAffordance);
  const dispatch = useWorldStore(s => s.dispatch);
  const userFrictionState = useWorldStore(s => s.userFrictionState);
  const triggerAdaptiveCycle = useWorldStore(s => s.triggerAdaptiveCycle);
  const [dismissedFrictionId, setDismissedFrictionId] = useState<string | null>(null);

  const isObservabilityVisible = showResearchDashboardModal || showCausalObservability;

  const activeFrictionHalo = useMemo(() => {
    if (!isObservabilityVisible || Object.keys(entities).length === 0) return null;
    if (!userFrictionState || (userFrictionState.consecutiveFrictionCount || 0) < 2) return null;
    const failedId = userFrictionState.lastFailedEntityId;
    if (!failedId || failedId === dismissedFrictionId) return null;
    const targetEntity = entities[failedId];
    if (!targetEntity) return null;

    const pos = getEntityPos(targetEntity);
    return {
      entity: targetEntity,
      position: pos,
      consecutiveFrictionCount: userFrictionState.consecutiveFrictionCount,
      lastAttemptedAction: userFrictionState.lastAttemptedAction,
    };
  }, [userFrictionState, entities, dismissedFrictionId, isObservabilityVisible]);

  const shockwaveGroupRef = useRef<THREE.Group>(null);
  const arcPulseRef = useRef<THREE.Group>(null);

  // Animation d'oscillation continue des effets holographiques
  useFrame(({ clock }) => {
    if (!isObservabilityVisible || !shockwaveGroupRef.current) return;
    const t = clock.getElapsedTime();
    const scale = 1.0 + Math.sin(t * 3.5) * 0.08;
    shockwaveGroupRef.current.scale.set(scale, scale, scale);
  });

  // 1. Calcul des arcs d'intention émergente (unique et non dédoublonné pour éviter toute superposition)
  const candidateArcs = useMemo(() => {
    if (Object.keys(entities).length === 0) return [];
    const unpromoted = shadowGraph.observations.filter(
      o => o.status !== 'promoted' && entities[o.sourceEntityId] && entities[o.targetEntityId]
    );
    if (unpromoted.length === 0) return [];
    // Strictement 1 observation active unique pour éviter tout dédoublement visuel ou chevauchement
    const activeObservations = unpromoted.slice(0, 1);

    return activeObservations.map(obs => {
      const src = entities[obs.sourceEntityId];
      const tgt = entities[obs.targetEntityId];

      const p1 = getEntityPos(src);
      const p2 = getEntityPos(tgt);

      const v1 = new THREE.Vector3(p1[0], p1[1] + 0.1, p1[2]);
      const v2 = new THREE.Vector3(p2[0], p2[1] + 0.1, p2[2]);
      const mid = new THREE.Vector3().addVectors(v1, v2).multiplyScalar(0.5);
      // Surélève la popin pour flotter au-dessus du plan de travail et des cartes de sélection d'objets
      mid.y += Math.max(0.55, v1.distanceTo(v2) * 0.45);

      const curve = new THREE.QuadraticBezierCurve3(v1, mid, v2);
      const points = curve.getPoints(24);
      const geometry = new THREE.BufferGeometry().setFromPoints(points);

      return {
        obs,
        points,
        geometry,
        midPoint: [mid.x, mid.y + 0.1, mid.z] as [number, number, number],
      };
    });
  }, [shadowGraph.observations, entities]);

  // Nettoyage des géométries d'arcs
  React.useEffect(() => {
    return () => {
      candidateArcs.forEach(a => a.geometry?.dispose());
    };
  }, [candidateArcs]);

  // 2. Calcul des zones d'impact sémantique (Blast Radius Violations)
  const violationMarkers = useMemo(() => {
    if (!isObservabilityVisible) return [];
    if (!blastRadiusReport || blastRadiusReport.violations.length === 0) return [];
    if (Object.keys(entities).length === 0) return [];

    return blastRadiusReport.violations
      .filter(v => v.affectedEntityId && entities[v.affectedEntityId])
      .map(v => {
        const ent = entities[v.affectedEntityId!];
        const pos = getEntityPos(ent);
        return {
          violation: v,
          position: [pos[0], pos[1] + 0.35, pos[2]] as [number, number, number],
        };
      });
  }, [blastRadiusReport, entities, isObservabilityVisible]);

  // 3. Sondes & Balises Adaptatives (Méta-Contrôleur E2)
  const metaBeacons = useMemo(() => {
    if (Object.keys(entities).length === 0) return [];
    return Object.values(entities)
      .filter(e =>
        e.id.startsWith('adaptive_probe_') ||
        e.id.startsWith('adaptive_transfer_') ||
        e.id.startsWith('adaptive_falsifier_')
      )
      .map(e => {
        const pos = getEntityPos(e);
        const isProbe = e.id.startsWith('adaptive_probe_');
        const isTransfer = e.id.startsWith('adaptive_transfer_');
        const color = isProbe ? '#38bdf8' : isTransfer ? '#a855f7' : '#f97316';
        const label = isProbe
          ? '🔬 Sonde Contrefactuelle'
          : isTransfer
          ? '🔮 Balise de Transfert Invariant'
          : '⚠️ Contrainte Épistémique';
        return {
          entity: e,
          position: [pos[0], pos[1] + 0.35, pos[2]] as [number, number, number],
          color,
          label,
          type: isProbe ? 'probe' : isTransfer ? 'transfer' : 'falsifier',
        };
      });
  }, [entities]);

  return (
    <group>
      {/* 1. Arcs d'Intention & Affordances Émergentes */}
      <group ref={arcPulseRef}>
        {candidateArcs.map(({ obs, points, geometry, midPoint }) => {
          const isHighConfidence = obs.intentConfidence >= 0.7;
          const arcColor = isHighConfidence ? '#10b981' : '#f59e0b';

          return (
            <group key={obs.id}>
              {/* Ligne Spline 3D de la trajectoire d'intention */}
              <line {...({ geometry } as any)}>
                <lineBasicMaterial
                  color={arcColor}
                  linewidth={2}
                  transparent
                  opacity={0.85}
                />
              </line>

              {/* Sphères d'énergie lumineuse réparties sur la spline 3D pour visibilité éclatante */}
              <group>
                {points.filter((_, idx) => idx % 4 === 0).map((pt, pIdx) => (
                  <mesh key={pIdx} position={[pt.x, pt.y, pt.z]}>
                    <sphereGeometry args={[0.024, 10, 10]} />
                    <meshBasicMaterial color={arcColor} transparent opacity={0.9} />
                  </mesh>
                ))}
              </group>

              {/* Réticules d'embase holographique aux deux extrémités */}
              {points.length > 0 && (
                <>
                  <group position={[points[0].x, points[0].y, points[0].z]}>
                    <mesh rotation={[-Math.PI / 2, 0, 0]}>
                      <ringGeometry args={[0.06, 0.10, 24]} />
                      <meshBasicMaterial color={arcColor} transparent opacity={0.85} side={THREE.DoubleSide} />
                    </mesh>
                  </group>
                  <group position={[points[points.length - 1].x, points[points.length - 1].y, points[points.length - 1].z]}>
                    <mesh rotation={[-Math.PI / 2, 0, 0]}>
                      <ringGeometry args={[0.08, 0.13, 24]} />
                      <meshBasicMaterial color={arcColor} transparent opacity={0.85} side={THREE.DoubleSide} />
                    </mesh>
                  </group>
                </>
              )}

              {/* Étiquette Holographique Spatiale 3D */}
              <Html position={midPoint} center zIndexRange={[50, 0]}>
                <div
                  style={{
                    position: 'relative',
                    background: 'rgba(15, 23, 42, 0.95)',
                    backdropFilter: 'blur(12px)',
                    border: `1.5px solid ${arcColor}`,
                    borderRadius: '10px',
                    padding: '8px 12px',
                    color: '#f8fafc',
                    fontSize: '11px',
                    boxShadow: `0 6px 20px rgba(0, 0, 0, 0.6), 0 0 16px ${isHighConfidence ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '5px',
                    pointerEvents: 'auto',
                    maxWidth: 'min(360px, 85vw)',
                    boxSizing: 'border-box',
                  }}
                >
                  {/* Bouton de fermeture rapide de l'hypothèse */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      dismissAffordance(obs.id);
                    }}
                    style={{
                      position: 'absolute',
                      top: '3px',
                      right: '4px',
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 'bold',
                      padding: '2px 5px',
                      lineHeight: 1,
                    }}
                    title="Fermer cette hypothèse"
                  >
                    ✕
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingRight: '14px' }}>
                    <span style={{ fontWeight: 700, color: arcColor }}>
                      ⚡ {getGestureLabel(obs.gestureType, isFr)} ({Math.round(obs.intentConfidence * 100)}%)
                    </span>
                    <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                      · {obs.repetitionCount} {isFr ? (obs.repetitionCount > 1 ? 'essais' : 'essai') : (obs.repetitionCount > 1 ? 'attempts' : 'attempt')}
                    </span>
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#cbd5e1', textAlign: 'center', lineHeight: 1.35 }}>
                    {obs.hypotheticalEffect}
                  </div>
                  {obs.status !== 'promoted' && (
                    <div style={{ display: 'flex', gap: '6px', marginTop: '3px' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          xrHaptics.triggerHaptic('snap_connect');
                          promoteAffordance(obs.id);
                        }}
                        style={{
                          background: 'linear-gradient(135deg, #10b981, #059669)',
                          border: 'none',
                          borderRadius: '4px',
                          color: '#ffffff',
                          fontSize: '9px',
                          fontWeight: 700,
                          padding: '4px 8px',
                          cursor: 'pointer',
                        }}
                        title={isFr ? "Intégrer définitivement cette règle d'interaction au monde 3D" : "Permanently integrate this interaction rule into the 3D world"}
                      >
                        ✨ {isFr ? 'Promouvoir en Règle Active' : 'Promote to Active Rule'}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          dismissAffordance(obs.id);
                        }}
                        style={{
                          background: 'rgba(239, 68, 68, 0.15)',
                          border: '1px solid rgba(239, 68, 68, 0.4)',
                          borderRadius: '4px',
                          color: '#f87171',
                          fontSize: '9px',
                          fontWeight: 600,
                          padding: '4px 7px',
                          cursor: 'pointer',
                        }}
                        title={isFr ? "Ignorer et masquer cette suggestion" : "Ignore and dismiss this suggestion"}
                      >
                        ✕ {isFr ? 'Ignorer' : 'Ignore'}
                      </button>
                    </div>
                  )}
                </div>
              </Html>
            </group>
          );
        })}
      </group>

      {/* 2. Ondes de Choc Sémantiques (Semantic Blast Radius Violations) */}
      <group ref={shockwaveGroupRef}>
        {violationMarkers.map(({ violation, position }) => {
          const isCritical = violation.severity === 'CRITICAL';
          const ringColor = isCritical ? '#ef4444' : '#eab308';

          return (
            <group key={violation.id} position={position}>
              {/* Sphère filaire holographique */}
              <mesh>
                <sphereGeometry args={[0.35, 16, 16]} />
                <meshBasicMaterial color={ringColor} wireframe transparent opacity={0.35} />
              </mesh>

              {/* Anneau d'onde de choc */}
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.35, 0.42, 32]} />
                <meshBasicMaterial color={ringColor} transparent opacity={0.7} side={THREE.DoubleSide} />
              </mesh>

              {/* Tag d'alerte spatial */}
              <Html position={[0, 0.4, 0]} center zIndexRange={[50, 0]}>
                <div
                  style={{
                    background: isCritical ? 'rgba(239, 68, 68, 0.95)' : 'rgba(234, 179, 8, 0.95)',
                    color: '#ffffff',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '10px',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                  }}
                >
                  ⚠️ {getViolationLabel(violation.type)}
                </div>
              </Html>
            </group>
          );
        })}
      </group>

      {/* 3. Balises & Sondes Holographiques du Méta-Contrôleur E2 */}
      <group>
        {metaBeacons.map(({ entity, position, color, label }) => (
          <MetaBeaconItem
            key={entity.id}
            entity={entity}
            position={position}
            color={color}
            label={label}
            onInteract={() => {
              xrHaptics.triggerHaptic('quantum_chime');
              dispatch({ type: 'INTERACT', sourceId: 'user', targetId: entity.id });
            }}
          />
        ))}
      </group>

      {/* 4. Halo Lumineux In-Situ & Micro-Badge Victoria (Anti-Friction Temps Réel) */}
      {activeFrictionHalo && (
        <VictoriaFrictionHalo3D
          entityId={activeFrictionHalo.entity.id}
          entityName={activeFrictionHalo.entity.name || activeFrictionHalo.entity.id}
          position={activeFrictionHalo.position}
          consecutiveFrictionCount={activeFrictionHalo.consecutiveFrictionCount}
          lastAttemptedAction={activeFrictionHalo.lastAttemptedAction}
          onResolve={() => {
            triggerAdaptiveCycle();
            useWorldStore.setState(s => ({
              warnings: [...s.warnings, "⚡ Victoria a adapté la règle pour relancer le joueur !"]
            }));
          }}
          onDismiss={() => {
            setDismissedFrictionId(activeFrictionHalo.entity.id);
          }}
        />
      )}
    </group>
  );
};
