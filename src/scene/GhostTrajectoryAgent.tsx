// src/scene/GhostTrajectoryAgent.tsx
// Composant 3D d'Agent Fantôme Holographique & Trajectoire Cognitive Optimale.
// Matérialise dans l'espace 3D la trajectoire préconisée par l'IA ou issue de la cohorte d'agents.

import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Sphere, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { useWorldStore } from '../engine/store';
import { speakAgentDialogue } from '../engine/agentDialogues';

export const GhostTrajectoryAgent: React.FC = () => {
  const isGhostAgentActive = useWorldStore(s => s.isGhostAgentActive);
  const toggleGhostAgent = useWorldStore(s => s.toggleGhostAgent);
  const activeQuestId = useWorldStore(s => s.world.ir.activeQuestId);
  const quests = useWorldStore(s => s.world.ir.quests);
  const entities = useWorldStore(s => s.world.ir.entities);
  const cookingTemperature = useWorldStore(s => s.cookingTemperature);
  const cookingHeatLevel = useWorldStore(s => s.cookingHeatLevel);

  const ghostGroupRef = useRef<THREE.Group>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const beaconRef = useRef<THREE.Mesh>(null);

  const activeQuest = useMemo(() => {
    if (!quests) return null;
    const qId = activeQuestId || Object.keys(quests)[0];
    return qId ? quests[qId] : null;
  }, [quests, activeQuestId]);

  // Détermination de l'entité et position cible recommandée
  const { targetPos, targetName, actionLabel, hintAdvice } = useMemo(() => {
    // Cas de surchauffe thermique urgente
    if (cookingTemperature > 185 && cookingHeatLevel > 1) {
      return {
        targetPos: new THREE.Vector3(0, 0.95, -0.2),
        targetName: 'Cocotte en fonte (Bouton thermique)',
        actionLabel: 'Réduire le feu au niveau 1',
        hintAdvice: 'Alerte thermique ! Réduisez immédiatement la flamme pour éviter la carbonisation.'
      };
    }

    const stepIdx = activeQuest?.currentStepIndex ?? 0;
    if (stepIdx === 0) {
      return {
        targetPos: new THREE.Vector3(-0.8, 1.0, 0.2),
        targetName: 'Haut-parleur du Chef',
        actionLabel: 'Écouter les conseils d’Escoffier',
        hintAdvice: 'L’écoute des conseils valide la première étape et calibre la recette.'
      };
    } else if (stepIdx === 1) {
      return {
        targetPos: new THREE.Vector3(0, 0.96, 0.3),
        targetName: 'Planche à découper',
        actionLabel: 'Découper les ingrédients',
        hintAdvice: 'Glissez un légume sur la planche ou utilisez le couteau pour émincer.'
      };
    } else if (stepIdx === 2) {
      return {
        targetPos: new THREE.Vector3(0, 0.96, -0.2),
        targetName: 'Cocotte en fonte',
        actionLabel: 'Mijoter à feu doux',
        hintAdvice: 'Déposez les légumes découpés et réglez le feu doux (85°C-120°C).'
      };
    } else {
      return {
        targetPos: new THREE.Vector3(0, 0.96, 0.12),
        targetName: 'Assiette de dégustation',
        actionLabel: 'Dresser et savourer',
        hintAdvice: 'Sélectionnez un style de dressage et dégustez avec la fourchette 3D.'
      };
    }
  }, [activeQuest?.currentStepIndex, cookingTemperature, cookingHeatLevel]);

  // Position du Fantôme IA (décalé pour observer la zone cible)
  const ghostAvatarPos = useMemo(() => {
    return new THREE.Vector3(targetPos.x + 0.35, targetPos.y + 0.3, targetPos.z + 0.4);
  }, [targetPos]);

  // Courbe de trajectoire prédictive (Spline) reliant l'utilisateur à la cible
  const trajectoryPoints = useMemo(() => {
    const start = new THREE.Vector3(-0.4, 0.95, 0.6);
    const mid = new THREE.Vector3(
      (start.x + targetPos.x) / 2,
      Math.max(start.y, targetPos.y) + 0.25,
      (start.z + targetPos.z) / 2
    );
    const curve = new THREE.QuadraticBezierCurve3(start, mid, targetPos);
    return curve.getPoints(24);
  }, [targetPos]);

  // Animation douce de pulsation holographique
  useFrame((state) => {
    if (!isGhostAgentActive) return;
    const t = state.clock.getElapsedTime();
    if (ghostGroupRef.current) {
      ghostGroupRef.current.position.y = ghostAvatarPos.y + Math.sin(t * 2.2) * 0.04;
    }
    if (haloRef.current) {
      haloRef.current.rotation.y = t * 0.8;
      haloRef.current.rotation.z = Math.sin(t) * 0.2;
    }
    if (beaconRef.current) {
      const scale = 1 + Math.sin(t * 3.5) * 0.15;
      beaconRef.current.scale.set(scale, scale, scale);
    }
  });

  if (!isGhostAgentActive || !activeQuest || Object.keys(entities || {}).length === 0) return null;

  return (
    <group>
      {/* 1. Ligne de Trajectoire Holographique Shimmer */}
      <line>
        <bufferGeometry attach="geometry">
          <bufferAttribute
            attach="attributes-position"
            count={trajectoryPoints.length}
            array={new Float32Array(trajectoryPoints.flatMap(p => [p.x, p.y, p.z]))}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial
          attach="material"
          color="#a855f7"
          linewidth={2}
          transparent
          opacity={0.75}
        />
      </line>

      {/* 2. Réticule / Balise d'Affordance Lumineuse sur la cible */}
      <group position={[targetPos.x, targetPos.y + 0.02, targetPos.z]}>
        <mesh ref={beaconRef} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.08, 0.14, 32]} />
          <meshBasicMaterial
            color="#818cf8"
            transparent
            opacity={0.85}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.18, 0.22, 32]} />
          <meshBasicMaterial
            color="#c084fc"
            transparent
            opacity={0.4}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* 3. Avatar Holographique Ethereal (Ghost Agent) */}
      <group ref={ghostGroupRef} position={[ghostAvatarPos.x, ghostAvatarPos.y, ghostAvatarPos.z]}>
        {/* Tête holographique translucide */}
        <Sphere args={[0.09, 24, 24]} position={[0, 0.16, 0]}>
          <meshStandardMaterial
            color="#818cf8"
            emissive="#6366f1"
            emissiveIntensity={0.6}
            roughness={0.1}
            metalness={0.8}
            transparent
            opacity={0.65}
            wireframe={false}
          />
        </Sphere>

        {/* Halo orbital pulsant */}
        <mesh ref={haloRef} position={[0, 0.26, 0]} rotation={[Math.PI / 5, 0, 0]}>
          <torusGeometry args={[0.13, 0.012, 16, 32]} />
          <meshBasicMaterial
            color="#c084fc"
            transparent
            opacity={0.8}
          />
        </mesh>

        {/* Torse & Cape d'énergie éthérée */}
        <RoundedBox args={[0.14, 0.22, 0.1]} radius={0.04} smoothness={4} position={[0, 0, 0]}>
          <meshStandardMaterial
            color="#6366f1"
            emissive="#4f46e5"
            emissiveIntensity={0.4}
            transparent
            opacity={0.55}
          />
        </RoundedBox>

        {/* Source de lumière ponctuelle d'ambiance holographique */}
        <pointLight color="#a855f7" intensity={1.2} distance={1.8} />

        {/* Bulle Flottante Holographique */}
        <Html
          position={[0, 0.42, 0]}
          center
          distanceFactor={5.5}
          style={{ pointerEvents: 'auto', userSelect: 'none' }}
        >
          <div className="ghost-trajectory-bubble">
            <div className="ghost-bubble-badge">
              <span className="ghost-spark">👻</span>
              <span className="ghost-title">Trajectoire Fantôme IA (96% confiance)</span>
              <button 
                className="ghost-close-mini"
                onClick={toggleGhostAgent}
                title="Masquer le guide fantôme"
              >
                ✕
              </button>
            </div>
            <div className="ghost-bubble-content">
              <div className="ghost-action-chip">
                🎯 <b>{actionLabel}</b>
              </div>
              <p className="ghost-advice-text">{hintAdvice}</p>
            </div>
            <div className="ghost-bubble-footer">
              <button
                className="ghost-voice-btn"
                onClick={() => speakAgentDialogue(`Conseil du guide fantôme : ${hintAdvice}`)}
              >
                🔊 Écouter
              </button>
              <span className="ghost-target-indicator">Cible : {targetName}</span>
            </div>
          </div>
        </Html>
      </group>
    </group>
  );
};
