// src/scene/CoWorker3DAgent.tsx
// Agent Co-équipier Incarné 3D (Camille / Alex / Victor) dans la scène WorldPilot.
// Présence physique collaborative, déplacement fluide entre postes de travail,
// infobulle interactive, barre de progression et menu de délégation contextuel.

import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { useWorldStore } from '../engine/store';
import { isFemaleName } from '../engine/agentDialogues';

export const CoWorker3DAgent: React.FC = () => {
  const coWorker = useWorldStore(state => state.coWorker);
  const delegateTask = useWorldStore(state => state.delegateCoWorkerTask);
  const isCoWorkerActive = useWorldStore(state => state.isCoWorkerActive);
  const toggleCoWorker = useWorldStore(state => state.toggleCoWorker);
  const isFemale = isFemaleName(coWorker.name, coWorker.role);

  const groupRef = useRef<THREE.Group>(null);
  const currentPosRef = useRef(new THREE.Vector3(coWorker.position.x, coWorker.position.y, coWorker.position.z));
  const [showMenu, setShowMenu] = useState(false);

  useFrame((state, delta) => {
    if (!isCoWorkerActive || !groupRef.current) return;

    // Smooth position interpolation towards coWorker.position
    const target = new THREE.Vector3(coWorker.position.x, coWorker.position.y, coWorker.position.z);
    currentPosRef.current.lerp(target, Math.min(1, delta * 4.5));
    groupRef.current.position.copy(currentPosRef.current);

    // Subtle breathing / bobbing animation when working or idle
    const t = state.clock.getElapsedTime();
    if (coWorker.status === 'working') {
      groupRef.current.position.y = coWorker.position.y + Math.sin(t * 8) * 0.02;
    } else if (coWorker.status === 'walking') {
      groupRef.current.position.y = coWorker.position.y + Math.abs(Math.sin(t * 7)) * 0.04;
    } else {
      groupRef.current.position.y = coWorker.position.y + Math.sin(t * 2) * 0.01;
    }

    // Face towards the table or the movement vector
    if (coWorker.status === 'walking') {
      const dirX = coWorker.targetPosition.x - currentPosRef.current.x;
      const dirZ = coWorker.targetPosition.z - currentPosRef.current.z;
      if (Math.hypot(dirX, dirZ) > 0.05) {
        const targetRot = Math.atan2(dirX, dirZ);
        groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRot, delta * 6);
      }
    } else {
      // Look towards center workstation
      const targetRot = Math.atan2(-currentPosRef.current.x, -currentPosRef.current.z);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRot, delta * 3);
    }
  });

  if (!isCoWorkerActive) return null;

  const isWorking = coWorker.status === 'working';
  const isWalking = coWorker.status === 'walking';

  return (
    <group ref={groupRef} position={[coWorker.position.x, coWorker.position.y, coWorker.position.z]}>
      {/* 1. Ombre portée douce */}
      <mesh position={[0, -0.88, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.32, 24]} />
        <meshBasicMaterial color="#000000" opacity={0.35} transparent />
      </mesh>

      {/* 2. Chaussures de travail / Sneakers anatomiques sculptées */}
      {[-0.10, 0.10].map((x, xi) => (
        <group key={xi} position={[x, -0.86, 0.02]}>
          {/* Semelle blanche amortissante */}
          <RoundedBox args={[0.078, 0.026, 0.19]} radius={0.008} smoothness={4} position={[0, 0, 0]}>
            <meshStandardMaterial color="#f8fafc" roughness={0.35} />
          </RoundedBox>
          {/* Tige en cuir de sécurité stylisée */}
          <RoundedBox args={[0.072, 0.048, 0.17]} radius={0.014} smoothness={4} position={[0, 0.03, -0.01]}>
            <meshStandardMaterial color="#0f172a" roughness={0.4} />
          </RoundedBox>
          {/* Languette & lacets */}
          <mesh position={[0, 0.052, 0.03]} rotation={[-0.22, 0, 0]}>
            <boxGeometry args={[0.04, 0.016, 0.07]} />
            <meshStandardMaterial color="#cbd5e1" roughness={0.5} />
          </mesh>
        </group>
      ))}

      {/* 3. Jambes & Pantalon ajusté avec coupe moderne */}
      {[-0.10, 0.10].map((x, xi) => (
        <group key={xi}>
          {/* Mollet fuselé */}
          <mesh position={[x, -0.70, 0]} castShadow>
            <cylinderGeometry args={[0.048, 0.042, 0.28, 16]} />
            <meshStandardMaterial color="#1e293b" roughness={0.5} />
          </mesh>
          {/* Genou & Cuisse */}
          <mesh position={[x, -0.46, 0]} castShadow>
            <cylinderGeometry args={[0.055, 0.048, 0.26, 16]} />
            <meshStandardMaterial color="#1e293b" roughness={0.5} />
          </mesh>
        </group>
      ))}

      {/* 4. Ceinture & Boucle métallique */}
      <mesh position={[0, -0.32, 0]}>
        <cylinderGeometry args={[0.155, 0.155, 0.035, 24]} />
        <meshStandardMaterial color="#0f172a" roughness={0.4} />
      </mesh>
      <mesh position={[0, -0.32, 0.15]}>
        <boxGeometry args={[0.045, 0.030, 0.012]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* 5. Buste & Torso Taillé avec Uniforme Métier */}
      <group position={[0, -0.14, 0]}>
        {/* Buste fuselé selon morphologie */}
        <RoundedBox 
          args={isFemale ? [0.23, 0.30, 0.16] : [0.27, 0.32, 0.17]} 
          radius={0.04} 
          smoothness={4} 
          position={[0, 0, 0]} 
          castShadow
        >
          <meshStandardMaterial 
            color={coWorker.personaId === 'sous-chef-camille' ? '#ffffff' : coWorker.personaId === 'facilitateur-alex' ? '#1e3a8a' : '#334155'} 
            roughness={0.4} 
          />
        </RoundedBox>

        {/* Galbe naturel de buste féminin en uniforme */}
        {isFemale && (
          <group position={[0, 0.05, 0.078]}>
            {[-0.052, 0.052].map((bx, bi) => (
              <mesh key={bi} position={[bx, 0, 0]} rotation={[-0.1, bi === 0 ? 0.06 : -0.06, 0]}>
                <sphereGeometry args={[0.050, 16, 16]} />
                <meshStandardMaterial 
                  color={coWorker.personaId === 'sous-chef-camille' ? '#ffffff' : '#1e3a8a'} 
                  roughness={0.4} 
                />
              </mesh>
            ))}
          </group>
        )}

        {/* Détail spécifique selon le persona */}
        {coWorker.personaId === 'sous-chef-camille' && (
          <group position={[0, 0, 0.088]}>
            {/* Veste de cuisine double boutonnage & liseré de brigade */}
            <mesh position={[-0.04, 0.03, 0]}>
              <boxGeometry args={[0.03, 0.22, 0.008]} />
              <meshStandardMaterial color={coWorker.avatarColor} roughness={0.3} />
            </mesh>
            {/* Boutons de brigade */}
            {[-0.06, 0.02].map((bx, bi) => (
              [-0.06, 0, 0.06].map((by, byi) => (
                <mesh key={`${bi}-${byi}`} position={[bx, by, 0.004]} rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.006, 0.006, 0.004, 8]} />
                  <meshStandardMaterial color="#e2e8f0" roughness={0.2} metalness={0.5} />
                </mesh>
              ))
            ))}
          </group>
        )}

        {coWorker.personaId === 'facilitateur-alex' && (
          <group position={[0, 0.04, 0.088]}>
            {/* Badge tour de cou & carte d'accès séminaire */}
            <mesh position={[0, 0.08, 0]}>
              <boxGeometry args={[0.12, 0.015, 0.005]} />
              <meshStandardMaterial color={coWorker.avatarColor} />
            </mesh>
            <mesh position={[0, -0.04, 0.004]}>
              <boxGeometry args={[0.05, 0.07, 0.004]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.3} />
            </mesh>
          </group>
        )}

        {coWorker.personaId === 'auditeur-victor' && (
          <group position={[0, 0.02, 0.088]}>
            {/* Revers de veston & insigne d'audit */}
            <mesh position={[-0.07, 0.06, 0]} rotation={[0, 0, 0.2]}>
              <boxGeometry args={[0.035, 0.16, 0.01]} />
              <meshStandardMaterial color="#1e293b" />
            </mesh>
            <mesh position={[-0.08, 0.09, 0.008]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.008, 0.008, 0.004, 8]} />
              <meshStandardMaterial color={coWorker.accentColor} metalness={0.8} />
            </mesh>
          </group>
        )}

        {/* Col montant ajusté */}
        <mesh position={[0, 0.19, 0]}>
          <cylinderGeometry args={[0.065, 0.075, 0.06, 16]} />
          <meshStandardMaterial color={coWorker.personaId === 'sous-chef-camille' ? '#f8fafc' : '#0f172a'} />
        </mesh>
      </group>

      {/* 6. Tête & Visage Expressif Stylisé Réaliste */}
      <group position={[0, 0.28, 0]}>
        {/* Crâne modelé */}
        <RoundedBox args={[0.20, 0.22, 0.19]} radius={0.06} smoothness={4} position={[0, 0, 0]} castShadow>
          <meshStandardMaterial color="#fed7aa" roughness={0.42} metalness={0.05} />
        </RoundedBox>

        {/* Menton modelé */}
        <mesh position={[0, -0.085, 0.03]} rotation={[0.3, 0, 0]}>
          <cylinderGeometry args={[0.048, 0.030, 0.045, 16]} />
          <meshStandardMaterial color="#fed7aa" roughness={0.45} />
        </mesh>

        {/* Oreilles anatomiques */}
        {[-0.105, 0.105].map((ex, ei) => (
          <group key={ei} position={[ex, 0, 0]}>
            <mesh rotation={[0, 0, ex > 0 ? 0.2 : -0.2]}>
              <cylinderGeometry args={[0.018, 0.014, 0.036, 12]} />
              <meshStandardMaterial color="#fed7aa" roughness={0.45} />
            </mesh>
            {/* Micro-oreillette de liaison d'équipe */}
            {ex > 0 && (
              <mesh position={[0.008, 0, 0.008]}>
                <boxGeometry args={[0.01, 0.022, 0.015]} />
                <meshStandardMaterial color={coWorker.avatarColor} metalness={0.8} roughness={0.2} emissive={coWorker.accentColor} emissiveIntensity={0.5} />
              </mesh>
            )}
          </group>
        ))}

        {/* Regard Vivant & Expressif : Sclère, Iris, Pupille & Catchlight spéculaire */}
        {[-0.038, 0.038].map((eyex, eyei) => (
          <group key={eyei} position={[eyex, 0.016, 0.096]}>
            {/* Sclère blanche brillante */}
            <mesh scale={[1.15, 0.85, 0.5]}>
              <sphereGeometry args={[0.018, 16, 16]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.15} />
            </mesh>
            {/* Iris coloré selon le co-équipier */}
            <mesh position={[0, 0, 0.008]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.010, 0.010, 0.003, 16]} />
              <meshStandardMaterial color={coWorker.avatarColor} roughness={0.25} />
            </mesh>
            {/* Pupille noire profonde */}
            <mesh position={[0, 0, 0.010]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.005, 0.005, 0.003, 16]} />
              <meshStandardMaterial color="#020617" roughness={0.1} />
            </mesh>
            {/* Catchlight éclat de vie */}
            <mesh position={[0.003, 0.0035, 0.012]}>
              <sphereGeometry args={[0.0025, 8, 8]} />
              <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1} />
            </mesh>
            {/* Paupière supérieure */}
            <mesh position={[0, 0.010, 0.005]} rotation={[-0.15, 0, 0]}>
              <boxGeometry args={[0.038, 0.004, 0.008]} />
              <meshStandardMaterial color="#451a03" roughness={0.5} />
            </mesh>
            {/* Cils supérieurs délicats féminins */}
            {isFemale && (
              <group position={[0, 0.012, 0.006]}>
                {[-0.012, -0.004, 0.004, 0.012].map((lx, li) => (
                  <mesh key={li} position={[lx, 0.002, 0]} rotation={[0, 0, (eyei === 0 ? -1 : 1) * (0.15 + li * 0.12)]}>
                    <boxGeometry args={[0.0025, 0.005, 0.002]} />
                    <meshStandardMaterial color="#020617" roughness={0.2} />
                  </mesh>
                ))}
              </group>
            )}
          </group>
        ))}

        {/* Pommettes & blush délicat féminin */}
        {isFemale && (
          <group>
            {[-0.058, 0.058].map((cx, ci) => (
              <mesh key={ci} position={[cx, -0.005, 0.092]}>
                <sphereGeometry args={[0.018, 12, 12]} />
                <meshStandardMaterial color="#fbcfe8" roughness={0.6} transparent opacity={0.65} />
              </mesh>
            ))}
          </group>
        )}

        {/* Sourcils expressifs */}
        {[-0.038, 0.038].map((bx, bi) => (
          <mesh key={bi} position={[bx, 0.042, 0.098]} rotation={[0, 0, bx < 0 ? -0.1 : 0.1]}>
            <boxGeometry args={[0.034, 0.006, 0.006]} />
            <meshStandardMaterial color="#1e293b" roughness={0.65} />
          </mesh>
        ))}

        {/* Nez fin stylisé */}
        <mesh position={[0, -0.004, 0.104]} rotation={[0.2, 0, 0]}>
          <cylinderGeometry args={[0.005, 0.009, 0.026, 8]} />
          <meshStandardMaterial color="#fbcfe8" roughness={0.45} />
        </mesh>
        <mesh position={[0, -0.016, 0.111]}>
          <sphereGeometry args={[0.008, 12, 12]} />
          <meshStandardMaterial color="#fbcfe8" roughness={0.45} />
        </mesh>

        {/* Sourire bienveillant */}
        <mesh position={[0, -0.048, 0.102]}>
          <boxGeometry args={[0.026, 0.004, 0.005]} />
          <meshStandardMaterial color="#be123c" roughness={0.35} />
        </mesh>

        {/* Coiffure / Couvre-chef selon Persona */}
        {coWorker.personaId === 'sous-chef-camille' && (
          <group position={[0, 0.12, 0]}>
            {/* Frange châtain sous la toque */}
            <mesh position={[0, -0.03, 0.04]} rotation={[0.2, 0, 0]}>
              <boxGeometry args={[0.14, 0.03, 0.06]} />
              <meshStandardMaterial color="#3f2e22" roughness={0.4} />
            </mesh>
            {/* Mèches châtaines encadrant les joues */}
            {[-0.088, 0.088].map((tx, ti) => (
              <mesh key={ti} position={[tx, -0.07, 0.02]} rotation={[0, 0, ti === 0 ? 0.12 : -0.12]}>
                <cylinderGeometry args={[0.018, 0.014, 0.14, 12]} />
                <meshStandardMaterial color="#3f2e22" roughness={0.4} />
              </mesh>
            ))}
            {/* Longue tresse féminine élégante sous la toque retombant dans le dos */}
            <group position={[0, -0.14, -0.11]}>
              {[0, -0.05, -0.10, -0.15].map((py, pi) => (
                <mesh key={pi} position={[0, py, 0]} rotation={[0.08, 0, (pi % 2 === 0 ? 0.10 : -0.10)]}>
                  <sphereGeometry args={[0.026 - pi * 0.0035, 12, 12]} />
                  <meshStandardMaterial color="#3f2e22" roughness={0.4} />
                </mesh>
              ))}
              {/* Élastique de tresse noir sobre */}
              <mesh position={[0, -0.17, 0]}>
                <torusGeometry args={[0.012, 0.004, 8, 16]} />
                <meshStandardMaterial color="#020617" />
              </mesh>
            </group>
            {/* Toque Blanche Brigade */}
            <mesh position={[0, 0.01, 0]}>
              <cylinderGeometry args={[0.125, 0.125, 0.045, 24]} />
              <meshStandardMaterial color="#f1f5f9" roughness={0.3} />
            </mesh>
            <mesh position={[0, 0.11, 0]} castShadow>
              <cylinderGeometry args={[0.15, 0.12, 0.18, 24]} />
              <meshStandardMaterial color="#ffffff" roughness={0.5} />
            </mesh>
            <mesh position={[0, 0.20, 0]}>
              <sphereGeometry args={[0.14, 16, 16]} />
              <meshStandardMaterial color="#ffffff" roughness={0.5} />
            </mesh>
          </group>
        )}

        {coWorker.personaId === 'facilitateur-alex' && (
          <group>
            {/* Coiffure moderne texturée sombre */}
            <mesh position={[0, 0.05, -0.01]}>
              <sphereGeometry args={[0.115, 20, 20]} />
              <meshStandardMaterial color="#1e293b" roughness={0.35} />
            </mesh>
            <mesh position={[0, 0.10, 0.02]} rotation={[0.1, 0, 0]}>
              <boxGeometry args={[0.14, 0.04, 0.12]} />
              <meshStandardMaterial color="#1e293b" roughness={0.35} />
            </mesh>
            {/* Lunettes design monture fine */}
            <group position={[0, 0.016, 0.106]}>
              {[-0.038, 0.038].map((lx, li) => (
                <mesh key={li} position={[lx, 0, 0]}>
                  <torusGeometry args={[0.017, 0.0025, 8, 16]} />
                  <meshStandardMaterial color="#0f172a" metalness={0.8} />
                </mesh>
              ))}
              <mesh position={[0, 0, 0]}>
                <boxGeometry args={[0.024, 0.002, 0.002]} />
                <meshStandardMaterial color="#0f172a" metalness={0.8} />
              </mesh>
            </group>
          </group>
        )}

        {coWorker.personaId === 'auditeur-victor' && (
          <group>
            {/* Chevelure poivre et sel soignée en arrière */}
            <mesh position={[0, 0.05, -0.01]}>
              <sphereGeometry args={[0.115, 20, 20]} />
              <meshStandardMaterial color="#64748b" roughness={0.5} />
            </mesh>
          </group>
        )}
      </group>

      {/* 7. Bras Gauche & Main Articulée */}
      <group position={[-0.20, -0.08, 0]}>
        <mesh position={[0, -0.08, 0]} castShadow>
          <cylinderGeometry args={[0.042, 0.036, 0.18, 16]} />
          <meshStandardMaterial color={coWorker.personaId === 'sous-chef-camille' ? '#ffffff' : '#1e293b'} />
        </mesh>
        <mesh position={[0, -0.22, 0]} castShadow>
          <cylinderGeometry args={[0.036, 0.030, 0.16, 16]} />
          <meshStandardMaterial color={coWorker.personaId === 'sous-chef-camille' ? '#ffffff' : '#1e293b'} />
        </mesh>
        {/* Poignet & Main déliée */}
        <group position={[0, -0.33, 0]}>
          <mesh>
            <boxGeometry args={[0.040, 0.048, 0.020]} />
            <meshStandardMaterial color="#fed7aa" roughness={0.45} />
          </mesh>
          <mesh position={[0.022, 0.004, 0.004]} rotation={[0, 0, -0.3]}>
            <boxGeometry args={[0.012, 0.026, 0.012]} />
            <meshStandardMaterial color="#fed7aa" roughness={0.45} />
          </mesh>
        </group>
      </group>

      {/* 8. Bras Droit & Outil Métier Kinématique */}
      <group position={[0.20, -0.08, 0]}>
        <mesh position={[0, -0.08, 0]} castShadow>
          <cylinderGeometry args={[0.042, 0.036, 0.18, 16]} />
          <meshStandardMaterial color={coWorker.personaId === 'sous-chef-camille' ? '#ffffff' : '#1e293b'} />
        </mesh>
        <mesh position={[0, -0.22, 0]} castShadow>
          <cylinderGeometry args={[0.036, 0.030, 0.16, 16]} />
          <meshStandardMaterial color={coWorker.personaId === 'sous-chef-camille' ? '#ffffff' : '#1e293b'} />
        </mesh>
        {/* Main tenant l'ustensile ou relâchée */}
        <group position={[0, -0.33, 0]}>
          <mesh>
            <boxGeometry args={[0.040, 0.048, 0.020]} />
            <meshStandardMaterial color="#fed7aa" roughness={0.45} />
          </mesh>
          {/* Ustensile en main quand l'agent travaille */}
          {isWorking && (
            <group position={[0, -0.04, 0.08]} rotation={[Math.PI / 3.5, 0, Math.PI / 8]}>
              <mesh>
                <cylinderGeometry args={[0.012, 0.012, 0.28, 8]} />
                <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.2} />
              </mesh>
            </group>
          )}
        </group>
      </group>

      {/* 9. Balise Holographique Halo */}
      <mesh position={[0, 0.68, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.24, 0.016, 16, 32]} />
        <meshBasicMaterial color={coWorker.accentColor} transparent opacity={0.75} />
      </mesh>

      {/* Drei HTML Status & Dialogue Bubble */}
      <Html position={[0, 0.85, 0]} center distanceFactor={8} zIndexRange={[100, 0]}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          pointerEvents: 'auto',
          userSelect: 'none',
          fontFamily: 'Inter, system-ui, sans-serif'
        }}>
          {/* Active Speech Bubble */}
          {coWorker.speechBubble && (
            <div style={{
              background: 'rgba(15, 23, 42, 0.92)',
              backdropFilter: 'blur(8px)',
              border: `1.5px solid ${coWorker.avatarColor}`,
              borderRadius: '12px',
              padding: '6px 12px',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 500,
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              marginBottom: '6px',
              maxWidth: '240px',
              textAlign: 'center',
              animation: 'fadeIn 0.25s ease-out'
            }}>
              💬 {coWorker.speechBubble}
            </div>
          )}

          {/* Nameplate & Work Badge */}
          <div 
            onClick={() => setShowMenu(!showMenu)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(15, 23, 42, 0.85)',
              border: `1.5px solid ${coWorker.avatarColor}88`,
              borderRadius: '20px',
              padding: '4px 10px',
              cursor: 'pointer',
              color: '#fff',
              fontSize: '11px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              transition: 'transform 0.15s ease'
            }}
          >
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: isWorking ? '#f59e0b' : isWalking ? '#3b82f6' : '#10b981',
              boxShadow: `0 0 8px ${isWorking ? '#f59e0b' : '#10b981'}`
            }} />
            <span style={{ fontWeight: 600 }}>{coWorker.name}</span>
            <span style={{ opacity: 0.7, fontSize: '10px' }}>({coWorker.role})</span>
            {isWorking && (
              <span style={{
                background: 'rgba(245, 158, 11, 0.25)',
                color: '#f59e0b',
                padding: '2px 6px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '9.5px'
              }}>
                {coWorker.progress}%
              </span>
            )}
          </div>

          {/* Quick Delegation Interactive Menu */}
          {showMenu && (
            <div style={{
              marginTop: '6px',
              background: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '12px',
              padding: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              minWidth: '180px',
              boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
              backdropFilter: 'blur(12px)'
            }}>
              <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
                🤝 Déléguer une tâche à {coWorker.name} :
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  delegateTask('chop_vegetables');
                  setShowMenu(false);
                }}
                style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  color: '#34d399',
                  borderRadius: '6px',
                  padding: '5px 8px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                🔪 Découper les légumes
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  delegateTask('monitor_heat');
                  setShowMenu(false);
                }}
                style={{
                  background: 'rgba(245, 158, 11, 0.15)',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  color: '#fbbf24',
                  borderRadius: '6px',
                  padding: '5px 8px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                🔥 Surveiller la cuisson
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  delegateTask('season_dish');
                  setShowMenu(false);
                }}
                style={{
                  background: 'rgba(59, 130, 246, 0.15)',
                  border: '1px solid rgba(59, 130, 246, 0.4)',
                  color: '#60a5fa',
                  borderRadius: '6px',
                  padding: '5px 8px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                🧂 Assaisonner & Lier
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  delegateTask('plate_garniture');
                  setShowMenu(false);
                }}
                style={{
                  background: 'rgba(168, 85, 247, 0.15)',
                  border: '1px solid rgba(168, 85, 247, 0.4)',
                  color: '#c084fc',
                  borderRadius: '6px',
                  padding: '5px 8px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                🍽️ Dresser la garniture
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCoWorker();
                  setShowMenu(false);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ef4444',
                  fontSize: '10px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  marginTop: '4px'
                }}
              >
                Masquer l'agent co-équipier
              </button>
            </div>
          )}
        </div>
      </Html>
    </group>
  );
};
