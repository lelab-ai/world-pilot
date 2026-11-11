import React, { useState, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { EntitySpec } from '../core/types';
import { useWorldStore } from '../engine/store';
import { playAudioFx } from '../engine/evaluator';

/**
 * 1. CIBLE DE TIR ARCADE HAUTE PRÉCISION (Bullseye Target)
 * Véritable cible de tir circulaire avec anneaux concentriques,
 * cinématique de translation sur rail (moving targets), bascule cinétique (knockdown 48°),
 * éclat néon et score flottant dynamique.
 */
export const SpatialShootingTarget: React.FC<{ entity: EntitySpec; isSelected?: boolean }> = ({ entity }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [floatingScore, setFloatingScore] = useState<number | null>(null);

  const groupRef = useRef<THREE.Group>(null);
  const targetHeadRef = useRef<THREE.Group>(null);
  const tiltAngleRef = useRef<number>(0);
  const lastColorRef = useRef<string | undefined>(entity.visuals?.color);
  const currentOffsetRef = useRef<number>(0);

  const color = entity.visuals?.color || '#f97316';
  const isHit = color === '#22c55e' || entity.name?.includes('abattue');
  const entityPos = entity.capabilities?.find(c => c.type === 'transform')?.position;
  const initialX = entityPos?.x || 0;

  // Detect when target was just hit via color change
  useEffect(() => {
    if (entity.visuals?.color === '#22c55e' && lastColorRef.current !== '#22c55e') {
      // Trigger knockdown physics kickback
      tiltAngleRef.current = 0.85; // 48 degrees tilt backward
      setFloatingScore(50);
      playAudioFx('target_hit', entityPos);
      setTimeout(() => setFloatingScore(null), 1400);
    }
    lastColorRef.current = entity.visuals?.color;
  }, [entity.visuals?.color, entityPos]);

  useFrame((_, delta) => {
    // Spring physics back to upright posture
    if (targetHeadRef.current) {
      if (tiltAngleRef.current > 0.001) {
        tiltAngleRef.current = THREE.MathUtils.lerp(tiltAngleRef.current, 0, delta * 5.5);
      } else {
        tiltAngleRef.current = 0;
      }
      targetHeadRef.current.rotation.x = -tiltAngleRef.current;
    }

    // Kinematic Horizontal Rail Motion (Cibles Mouvantes)
    if (groupRef.current) {
      if (!isHit) {
        const t = performance.now() * 0.0012;
        // Each target has an asynchronous speed & phase along its rail
        const speed = 1.0 + (Math.abs(initialX * 7) % 3) * 0.25;
        const amplitude = 0.38; // 38cm lateral travel
        const phase = initialX * 2.2;
        currentOffsetRef.current = Math.sin(t * speed + phase) * amplitude;
        groupRef.current.position.x = currentOffsetRef.current;
        groupRef.current.position.y = Math.sin(t * 2 + initialX) * 0.01;
      }
    }
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    tiltAngleRef.current = 0.95; // immediate kinetic response on click
    setFloatingScore(50);
    playAudioFx('laser', entityPos);
    setTimeout(() => setFloatingScore(null), 1400);
    useWorldStore.getState().setSpatialContext(entity.id, null);
    useWorldStore.getState().dispatch({ type: 'INTERACT', sourceId: entity.id });
  };

  return (
    <group>
      {/* 1. Stationary Linear Chrome Rail & Bumpers (anchored on floor) */}
      <group position={[0, 0.01, 0]}>
        {/* Front & Back chrome sliding rails */}
        <mesh position={[0, 0.01, 0.06]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.008, 0.008, 1.05, 16]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.15} />
        </mesh>
        <mesh position={[0, 0.01, -0.06]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.008, 0.008, 1.05, 16]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.15} />
        </mesh>
        {/* High-visibility yellow/black hazard rail sleepers */}
        {[-0.45, -0.15, 0.15, 0.45].map((sx, idx) => (
          <mesh key={idx} position={[sx, 0.006, 0]}>
            <boxGeometry args={[0.04, 0.012, 0.18]} />
            <meshStandardMaterial color="#1e293b" roughness={0.6} />
          </mesh>
        ))}
        {/* Left & Right Mechanical Rubber Bumpers */}
        {[-0.53, 0.53].map((bx, idx) => (
          <mesh key={idx} position={[bx, 0.025, 0]}>
            <boxGeometry args={[0.035, 0.04, 0.18]} />
            <meshStandardMaterial color="#ef4444" metalness={0.5} roughness={0.3} />
          </mesh>
        ))}
      </group>

      {/* 2. Moving Target Carriage Assembly (slides along X) */}
      <group
        ref={groupRef}
        onClick={handleClick}
        onPointerOver={(e) => { e.stopPropagation(); setIsHovered(true); document.body.style.cursor = 'crosshair'; }}
        onPointerOut={() => { setIsHovered(false); document.body.style.cursor = 'auto'; }}
      >
        {/* Heavy Weighted Cast Iron Floor Base & Rail Carriage */}
        <mesh position={[0, 0.03, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.18, 0.22, 0.04, 32]} />
          <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.7} />
        </mesh>

        {/* Outer Neon Floor Ring */}
        <mesh position={[0, 0.052, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.14, 0.17, 32]} />
          <meshStandardMaterial
            color={isHit ? '#22c55e' : color}
            emissive={isHit ? '#22c55e' : color}
            emissiveIntensity={isHovered ? 0.9 : 0.4}
          />
        </mesh>

        {/* Vertical Brushed Steel Support Post */}
        <mesh position={[0, 0.42, 0]} castShadow>
          <cylinderGeometry args={[0.025, 0.03, 0.80, 24]} />
          <meshStandardMaterial color="#475569" roughness={0.3} metalness={0.8} />
        </mesh>

        {/* Mechanical Swivel Hinge Joint */}
        <mesh position={[0, 0.82, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.045, 0.045, 0.08, 16]} />
          <meshStandardMaterial color="#1e293b" roughness={0.5} metalness={0.6} />
        </mesh>

        {/* Tilting Target Assembly (Head & Rings) */}
        <group ref={targetHeadRef} position={[0, 0.82, 0]}>
          {/* Back Support Arm */}
          <mesh position={[0, 0.24, -0.02]} castShadow>
            <boxGeometry args={[0.06, 0.46, 0.03]} />
            <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
          </mesh>

          {/* Circular Target Main Casing & Rim */}
          <mesh position={[0, 0.38, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.32, 0.32, 0.035, 48]} />
            <meshStandardMaterial
              color={isHit ? '#14532d' : '#0f172a'}
              roughness={0.25}
              metalness={0.8}
            />
          </mesh>

          {/* Outer Ring (Score: 10) - White Enamel */}
          <mesh position={[0, 0.38, 0.02]} rotation={[0, 0, 0]}>
            <ringGeometry args={[0.22, 0.30, 48]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.4} />
          </mesh>

          {/* Mid Ring (Score: 25) - Color Accent or Emerald when hit */}
          <mesh position={[0, 0.38, 0.022]}>
            <ringGeometry args={[0.13, 0.22, 48]} />
            <meshStandardMaterial
              color={isHit ? '#22c55e' : color}
              emissive={isHit ? '#22c55e' : color}
              emissiveIntensity={isHovered ? 0.7 : 0.25}
              roughness={0.3}
            />
          </mesh>

          {/* Inner Ring (Score: 50) - White Enamel */}
          <mesh position={[0, 0.38, 0.024]}>
            <ringGeometry args={[0.06, 0.13, 48]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.3} />
          </mesh>

          {/* Center Bullseye (Score: 100) - Red/Gold Core */}
          <mesh position={[0, 0.38, 0.026]}>
            <circleGeometry args={[0.06, 32]} />
            <meshStandardMaterial
              color={isHit ? '#22c55e' : '#ef4444'}
              emissive={isHit ? '#22c55e' : '#ef4444'}
              emissiveIntensity={0.8}
              roughness={0.2}
            />
          </mesh>

          {/* Precision Crosshair Lines (Reticle overlay) */}
          <mesh position={[0, 0.38, 0.028]}>
            <planeGeometry args={[0.54, 0.006]} />
            <meshBasicMaterial color="#0f172a" />
          </mesh>
          <mesh position={[0, 0.38, 0.028]}>
            <planeGeometry args={[0.006, 0.54]} />
            <meshBasicMaterial color="#0f172a" />
          </mesh>

          {/* Hover / Target State Label */}
          {isHovered && !isHit && (
            <Html position={[0, 0.78, 0]} center style={{ pointerEvents: 'none' }}>
              <div style={{
                background: 'rgba(15, 23, 42, 0.92)',
                border: `1.5px solid ${color}`,
                boxShadow: `0 0 16px ${color}88`,
                borderRadius: '20px',
                padding: '4px 10px',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 700,
                whiteSpace: 'nowrap',
                fontFamily: 'monospace'
              }}>
                🎯 VISER (+50 PTS)
              </div>
            </Html>
          )}

          {/* Hit Floating Score Badge */}
          {floatingScore !== null && (
            <Html position={[0, 0.85, 0]} center style={{ pointerEvents: 'none' }}>
              <div style={{
                color: '#22c55e',
                fontSize: '18px',
                fontWeight: 900,
                textShadow: '0 0 10px #22c55e, 0 0 20px #22c55e',
                animation: 'bounce 0.4s ease-out',
                fontFamily: 'Impact, system-ui, sans-serif',
                whiteSpace: 'nowrap'
              }}>
                +{floatingScore} PTS !
              </div>
            </Html>
          )}
        </group>
      </group>
    </group>
  );
};

/**
 * 2. CONSOLE D'ARCADE DU STAND DE TIR (Blaster Console)
 * Pupitre cybernétique avec tableau de bord diégétique incliné,
 * écran LED intégré, gros bouton poussoir arcade rouge champignon
 * avec compression mécanique réelle au clic pour réinitialiser directement.
 */
export const SpatialBlasterConsole: React.FC<{ entity: EntitySpec }> = ({ entity }) => {
  const gameplay = useWorldStore(s => s.world.gameplay);
  const score = gameplay?.score || 0;
  const timer = gameplay?.timer ?? 30;
  const isRunning = gameplay?.gameStatus === 'running';

  const [isConsoleHovered, setIsConsoleHovered] = useState(false);
  const buttonDepressRef = useRef<number>(0);
  const plungerMeshRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    // Smooth mechanical return spring for arcade plunger
    buttonDepressRef.current = THREE.MathUtils.lerp(buttonDepressRef.current, 0, delta * 14);
    if (plungerMeshRef.current) {
      plungerMeshRef.current.position.y = 0.04 - buttonDepressRef.current;
    }
  });

  const triggerResetAction = (e?: any) => {
    if (e) e.stopPropagation();
    buttonDepressRef.current = 0.024; // Immediate 2.4cm physical compression
    playAudioFx('switch_click');
    useWorldStore.getState().setSpatialContext(entity.id, null);
    useWorldStore.getState().dispatch({ type: 'INTERACT', sourceId: entity.id });
  };

  return (
    <group
      onClick={triggerResetAction}
      onPointerOver={(e) => { e.stopPropagation(); setIsConsoleHovered(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setIsConsoleHovered(false); document.body.style.cursor = 'auto'; }}
    >
      {/* Heavy Base Pedestal Plinth */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.92, 0.85, 0.54]} />
        <meshStandardMaterial color="#0f172a" roughness={0.35} metalness={0.7} />
      </mesh>

      {/* Cyber Neon Accent Edge Trim */}
      <mesh position={[0, 0.43, 0]}>
        <boxGeometry args={[0.94, 0.02, 0.56]} />
        <meshStandardMaterial
          color="#06b6d4"
          emissive="#06b6d4"
          emissiveIntensity={isConsoleHovered ? 0.9 : 0.5}
        />
      </mesh>

      {/* Angled Control Dashboard - tilted up towards the player (positive X rotation) */}
      <group position={[0, 0.45, 0]} rotation={[Math.PI / 6, 0, 0]}>
        {/* Dashboard Surface Plate */}
        <mesh position={[0, 0.02, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.88, 0.04, 0.44]} />
          <meshStandardMaterial color="#1e293b" roughness={0.25} metalness={0.8} />
        </mesh>

        {/* 1. Futuristic Laser Blaster on its Magnetic Dock (Left Side) */}
        <group position={[-0.24, 0.05, 0]}>
          {/* Magnetic Dock Cradle */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.1, 0.02, 0.22]} />
            <meshStandardMaterial color="#0f172a" roughness={0.5} />
          </mesh>
          {/* Gun Barrel */}
          <mesh position={[0, 0.025, -0.04]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.016, 0.02, 0.16, 16]} />
            <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.2} />
          </mesh>
          {/* Laser Core Tube */}
          <mesh position={[0, 0.025, -0.02]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.12, 16]} />
            <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={0.9} />
          </mesh>
          {/* Handle Grip */}
          <mesh position={[0, -0.02, 0.04]} rotation={[Math.PI / 6, 0, 0]}>
            <boxGeometry args={[0.024, 0.07, 0.032]} />
            <meshStandardMaterial color="#0f172a" roughness={0.6} />
          </mesh>
        </group>

        {/* 2. Diegetic Embedded LED Dashboard Display (Center) */}
        <group position={[0.04, 0.042, -0.08]}>
          {/* Recessed Glass Screen Bezel */}
          <mesh position={[0, 0, 0]}>
            <planeGeometry args={[0.34, 0.14]} />
            <meshStandardMaterial color="#020617" roughness={0.2} metalness={0.9} />
          </mesh>
          {/* Neon Border */}
          <mesh position={[0, 0, 0.001]}>
            <ringGeometry args={[0.16, 0.17, 4]} />
            <meshBasicMaterial color="#06b6d4" />
          </mesh>
          {/* Screen Content as Clean Diegetic Surface */}
          <Html position={[0, 0, 0.005]} transform distanceFactor={1.3} style={{ pointerEvents: 'none' }}>
            <div style={{
              width: '180px',
              padding: '6px 8px',
              background: 'transparent',
              fontFamily: 'monospace',
              color: '#f8fafc',
              textAlign: 'center',
              userSelect: 'none'
            }}>
              <div style={{ fontSize: '9px', color: '#38bdf8', fontWeight: 800, letterSpacing: '0.05em' }}>
                STAND DE TIR
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '11px', fontWeight: 700 }}>
                <span style={{ color: '#fbbf24' }}>{score} pts</span>
                <span style={{ color: timer <= 5 ? '#ef4444' : '#38bdf8' }}>{timer}s</span>
              </div>
            </div>
          </Html>
        </group>

        {/* 3. Big Red Arcade Plunger Push-Button (Right Side) */}
        <group position={[0.26, 0.03, 0.04]} onClick={triggerResetAction}>
          {/* Heavy Chrome Bezel Collar Ring */}
          <mesh position={[0, 0.01, 0]}>
            <cylinderGeometry args={[0.085, 0.095, 0.02, 32]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.1} />
          </mesh>
          <mesh position={[0, 0.005, 0]}>
            <ringGeometry args={[0.095, 0.11, 32]} />
            <meshBasicMaterial color={isConsoleHovered ? '#ef4444' : '#38bdf8'} />
          </mesh>

          {/* Compressible Red Arcade Mushroom Cap */}
          <group ref={plungerMeshRef} position={[0, 0.04, 0]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.075, 0.08, 0.035, 32]} />
              <meshStandardMaterial
                color="#dc2626"
                emissive="#ef4444"
                emissiveIntensity={isRunning ? 0.75 : 0.35}
                roughness={0.2}
              />
            </mesh>
            {/* Top Gloss Dome */}
            <mesh position={[0, 0.018, 0]}>
              <cylinderGeometry args={[0.065, 0.075, 0.008, 32]} />
              <meshStandardMaterial color="#f87171" emissive="#ef4444" emissiveIntensity={0.6} />
            </mesh>
          </group>
        </group>

        {/* Hover Cue Label directly above the console button */}
        {isConsoleHovered && (
          <Html position={[0.26, 0.16, 0.04]} center style={{ pointerEvents: 'none' }}>
            <div style={{
              background: 'rgba(15, 23, 42, 0.95)',
              border: '1.5px solid #ef4444',
              boxShadow: '0 0 15px rgba(239, 68, 68, 0.6)',
              borderRadius: '8px',
              padding: '4px 10px',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 800,
              fontFamily: 'monospace',
              whiteSpace: 'nowrap'
            }}>
              🔄 CLIC POUR RÉINITIALISER (30s)
            </div>
          </Html>
        )}
      </group>
    </group>
  );
};

/**
 * 3. PAS DE TIR & VOIE ARCADE (Target Range Base)
 * Socle métallique rétroéclairé avec bordures néon et signalétique de stand de tir.
 */
export const SpatialTargetRangeBase: React.FC<{ entity: EntitySpec }> = () => {
  return (
    <group position={[0, 0.02, -1.2]}>
      {/* Main Heavy Steel Floor Deck */}
      <mesh receiveShadow>
        <boxGeometry args={[5.6, 0.05, 2.4]} />
        <meshStandardMaterial color="#0f172a" roughness={0.35} metalness={0.7} />
      </mesh>

      {/* Cyber Neon Boundary Edge Rails */}
      {[-1.2, 1.2].map((z, idx) => (
        <mesh key={idx} position={[0, 0.035, z]}>
          <boxGeometry args={[5.6, 0.02, 0.04]} />
          <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={0.6} />
        </mesh>
      ))}

      {/* Range Lane Hazard Markings */}
      {[-1.8, -0.6, 0.6, 1.8].map((x, idx) => (
        <mesh key={idx} position={[x, 0.028, 0]}>
          <boxGeometry args={[0.04, 0.005, 2.2]} />
          <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.4} />
        </mesh>
      ))}
    </group>
  );
};
