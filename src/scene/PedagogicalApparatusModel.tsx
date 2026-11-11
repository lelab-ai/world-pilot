// src/scene/PedagogicalApparatusModel.tsx
// Modèles 3D procéduraux haute-fidélité pour les appareils de laboratoire scientifique
// et pièges cognitifs actifs (Recherche Bloom-3D / WorldPilot).

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Html } from '@react-three/drei';
import * as THREE from 'three';
import type { EntitySpec } from '../core/types';

export function isPedagogicalApparatus(entity: EntitySpec): boolean {
  if (
    entity.id.startsWith('pedagogical_bench') ||
    entity.id.startsWith('apparatus_') ||
    entity.id.startsWith('trap_') ||
    entity.id.startsWith('adaptive_')
  ) {
    return true;
  }
  return entity.capabilities?.some(c =>
    c.type === 'pedagogical_apparatus' ||
    c.type === 'cognitive_trap' ||
    c.type === 'diagnostic_probe'
  ) ?? false;
}

interface PedagogicalApparatusProps {
  entity: EntitySpec;
  isSelected?: boolean;
  isHovered?: boolean;
}

export const PedagogicalApparatusModel: React.FC<PedagogicalApparatusProps> = ({
  entity,
  isSelected = false,
  isHovered = false,
}) => {
  const apparatusType = useMemo(() => {
    const cap = entity.capabilities?.find(c => c.type === 'pedagogical_apparatus');
    if (cap && 'apparatusType' in cap) return (cap as any).apparatusType as string;
    if (entity.id.includes('power_supply')) return 'power_supply';
    if (entity.id.includes('rheostat')) return 'rheostat';
    if (entity.id.includes('multimeter')) return 'multimeter';
    if (entity.id.includes('fuse')) return 'fuse_module';
    if (entity.id.includes('laser')) return 'laser_source';
    if (entity.id.includes('prism')) return 'prism';
    if (entity.id.includes('calorimeter')) return 'calorimeter';
    if (entity.id.startsWith('trap_')) return 'cognitive_trap';
    if (entity.id.startsWith('pedagogical_bench')) return 'bench';
    if (entity.id.includes('transfer_beacon') || entity.id.startsWith('adaptive_transfer')) return 'transfer_beacon';
    if (entity.id.includes('probe_diagnostic') || entity.id.startsWith('adaptive_probe')) return 'probe_diagnostic';
    if (entity.id.includes('falsifier') || entity.id.startsWith('adaptive_falsifier')) return 'falsifier';
    return 'generic';
  }, [entity]);

  switch (apparatusType) {
    case 'bench':
      return <LaboratoryBenchModel entity={entity} isSelected={isSelected} isHovered={isHovered} />;
    case 'power_supply':
      return <PowerSupplyModel entity={entity} isSelected={isSelected} isHovered={isHovered} />;
    case 'rheostat':
      return <RheostatModel entity={entity} isSelected={isSelected} isHovered={isHovered} />;
    case 'multimeter':
      return <MultimeterModel entity={entity} isSelected={isSelected} isHovered={isHovered} />;
    case 'fuse_module':
      return <FuseModuleModel entity={entity} isSelected={isSelected} isHovered={isHovered} />;
    case 'laser_source':
      return <LaserSourceModel entity={entity} isSelected={isSelected} isHovered={isHovered} />;
    case 'prism':
      return <PrismModel entity={entity} isSelected={isSelected} isHovered={isHovered} />;
    case 'calorimeter':
      return <CalorimeterModel entity={entity} isSelected={isSelected} isHovered={isHovered} />;
    case 'cognitive_trap':
      return <CognitiveTrapModel entity={entity} isSelected={isSelected} isHovered={isHovered} />;
    case 'transfer_beacon':
      return <TransferBeaconModel entity={entity} isSelected={isSelected} isHovered={isHovered} />;
    case 'probe_diagnostic':
      return <DiagnosticProbeModel entity={entity} isSelected={isSelected} isHovered={isHovered} />;
    case 'falsifier':
      return <FalsifierModel entity={entity} isSelected={isSelected} isHovered={isHovered} />;
    default:
      return <DefaultApparatusModel entity={entity} isSelected={isSelected} isHovered={isHovered} />;
  }
};

/**
 * 1. Paillasse d'Établi de Laboratoire
 */
const LaboratoryBenchModel: React.FC<PedagogicalApparatusProps> = ({ isSelected }) => {
  return (
    <group>
      {/* Plateau supérieur en résine époxy anti-acide */}
      <RoundedBox args={[2.2, 0.08, 1.2]} radius={0.015} smoothness={4} castShadow receiveShadow position={[0, 0.38, 0]}>
        <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.2} />
      </RoundedBox>

      {/* Cadre métallique porteur */}
      <RoundedBox args={[2.14, 0.05, 1.14]} radius={0.01} smoothness={2} position={[0, 0.32, 0]}>
        <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
      </RoundedBox>

      {/* Pieds tubulaires robustes avec vérins de mise à niveau */}
      {[
        [-1.0, 0.16, -0.5],
        [1.0, 0.16, -0.5],
        [-1.0, 0.16, 0.5],
        [1.0, 0.16, 0.5],
      ].map(([x, y, z], idx) => (
        <group key={idx} position={[x, y, z]}>
          <mesh castShadow position={[0, 0, 0]}>
            <cylinderGeometry args={[0.035, 0.035, 0.32, 16]} />
            <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.25} />
          </mesh>
          <mesh position={[0, -0.15, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.02, 16]} />
            <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
      ))}

      {/* Canal de câblage et rail d'alimentation sécurisé */}
      <mesh position={[0, 0.44, -0.52]}>
        <boxGeometry args={[2.0, 0.06, 0.08]} />
        <meshStandardMaterial color="#475569" metalness={0.6} roughness={0.4} />
      </mesh>

      {isSelected && (
        <mesh position={[0, 0.43, 0]}>
          <planeGeometry args={[2.22, 1.22]} />
          <meshBasicMaterial color="#38bdf8" wireframe transparent opacity={0.6} />
        </mesh>
      )}
    </group>
  );
};

/**
 * 2. Alimentation Stabilisée DC 12V
 */
const PowerSupplyModel: React.FC<PedagogicalApparatusProps> = ({ isHovered }) => {
  const ledRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ledRef.current) {
      const glow = 0.8 + Math.sin(clock.getElapsedTime() * 4) * 0.2;
      (ledRef.current.material as THREE.MeshBasicMaterial).opacity = glow;
    }
  });

  return (
    <group>
      {/* Boîtier principal en tôle d'acier peinte */}
      <RoundedBox args={[0.34, 0.22, 0.26]} radius={0.012} smoothness={3} castShadow receiveShadow>
        <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.35} />
      </RoundedBox>

      {/* Façade inclinée en aluminium brossé */}
      <mesh position={[0, 0, 0.132]}>
        <planeGeometry args={[0.32, 0.2]} />
        <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.25} />
      </mesh>

      {/* Afficheur digital LED rétroéclairé vert émeraude (12.0 V) */}
      <mesh position={[-0.07, 0.04, 0.134]}>
        <planeGeometry args={[0.12, 0.06]} />
        <meshBasicMaterial color="#022c22" />
      </mesh>
      <mesh ref={ledRef} position={[-0.07, 0.04, 0.136]}>
        <planeGeometry args={[0.1, 0.04]} />
        <meshBasicMaterial color="#10b981" transparent opacity={0.9} />
      </mesh>

      {/* Bornes de sortie banane de sécurité 4mm (Rouge +, Noir -) */}
      <mesh position={[-0.04, -0.05, 0.145]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.014, 0.014, 0.03, 16]} />
        <meshStandardMaterial color="#ef4444" roughness={0.2} metalness={0.4} />
      </mesh>
      <mesh position={[0.04, -0.05, 0.145]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.014, 0.014, 0.03, 16]} />
        <meshStandardMaterial color="#111827" roughness={0.2} metalness={0.4} />
      </mesh>

      {/* Bouton rotatif de réglage précis de la tension */}
      <mesh position={[0.08, 0.04, 0.145]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.024, 0.024, 0.025, 24]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
      </mesh>

      {isHovered && (
        <Html position={[0, 0.22, 0]} center distanceFactor={4} zIndexRange={[50, 0]}>
          <div style={{ background: 'rgba(15, 23, 42, 0.9)', color: '#38bdf8', padding: '4px 8px', borderRadius: '4px', border: '1px solid #0284c7', fontSize: '11px', whiteSpace: 'nowrap', fontWeight: 600 }}>
            ⚡ 12.0 V DC Stabilisé
          </div>
        </Html>
      )}
    </group>
  );
};

/**
 * 3. Boîte à Décades de Résistance / Rhéostat
 */
const RheostatModel: React.FC<PedagogicalApparatusProps> = ({ isHovered }) => {
  return (
    <group>
      {/* Boîtier en bois d'acajou verni de précision */}
      <RoundedBox args={[0.36, 0.16, 0.24]} radius={0.01} smoothness={3} castShadow receiveShadow>
        <meshStandardMaterial color="#451a03" roughness={0.4} metalness={0.1} />
      </RoundedBox>

      {/* Plaque supérieure en bakélite noire gravée */}
      <mesh position={[0, 0.081, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.34, 0.22]} />
        <meshStandardMaterial color="#18181b" roughness={0.7} metalness={0.2} />
      </mesh>

      {/* 4 commutateurs rotatifs de décades (x1, x10, x100, x1000 Ohms) */}
      {[-0.12, -0.04, 0.04, 0.12].map((x, idx) => (
        <group key={idx} position={[x, 0.09, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.026, 0.026, 0.018, 20]} />
            <meshStandardMaterial color="#d97706" metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.012, 0.016]}>
            <boxGeometry args={[0.006, 0.008, 0.02]} />
            <meshStandardMaterial color="#fef3c7" roughness={0.2} />
          </mesh>
        </group>
      ))}

      {isHovered && (
        <Html position={[0, 0.18, 0]} center distanceFactor={4} zIndexRange={[50, 0]}>
          <div style={{ background: 'rgba(15, 23, 42, 0.9)', color: '#f59e0b', padding: '4px 8px', borderRadius: '4px', border: '1px solid #d97706', fontSize: '11px', whiteSpace: 'nowrap', fontWeight: 600 }}>
            Boîte Décades : 100 Ω (Rhéostat)
          </div>
        </Html>
      )}
    </group>
  );
};

/**
 * 4. Multimètre Numérique d'Établi
 */
const MultimeterModel: React.FC<PedagogicalApparatusProps> = ({ isHovered }) => {
  return (
    <group>
      {/* Châssis ergonomique jaune et gris de chantier / laboratoire */}
      <RoundedBox args={[0.28, 0.24, 0.22]} radius={0.016} smoothness={3} castShadow receiveShadow>
        <meshStandardMaterial color="#ca8a04" roughness={0.4} metalness={0.2} />
      </RoundedBox>

      {/* Écran LCD incliné */}
      <group position={[0, 0.04, 0.112]} rotation={[-0.15, 0, 0]}>
        <mesh>
          <planeGeometry args={[0.22, 0.09]} />
          <meshBasicMaterial color="#1e293b" />
        </mesh>
        <mesh position={[0, 0, 0.002]}>
          <planeGeometry args={[0.18, 0.07]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
      </group>

      {/* Sélecteur rotatif central */}
      <mesh position={[0, -0.05, 0.118]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.035, 0.02, 24]} />
        <meshStandardMaterial color="#0f172a" metalness={0.7} roughness={0.3} />
      </mesh>

      {isHovered && (
        <Html position={[0, 0.22, 0]} center distanceFactor={4} zIndexRange={[50, 0]}>
          <div style={{ background: 'rgba(15, 23, 42, 0.9)', color: '#38bdf8', padding: '4px 8px', borderRadius: '4px', border: '1px solid #0284c7', fontSize: '11px', whiteSpace: 'nowrap', fontWeight: 600 }}>
            Ampèremètre : 0.12 A
          </div>
        </Html>
      )}
    </group>
  );
};

/**
 * 5. Fusible de Protection Rapide (0.5A)
 */
const FuseModuleModel: React.FC<PedagogicalApparatusProps> = ({ isHovered }) => {
  return (
    <group>
      {/* Socle en céramique blanche isolante */}
      <RoundedBox args={[0.18, 0.06, 0.1]} radius={0.008} smoothness={2} castShadow position={[0, -0.02, 0]}>
        <meshStandardMaterial color="#f8fafc" roughness={0.2} metalness={0.1} />
      </RoundedBox>

      {/* Tube transparent en verre borosilicate */}
      <mesh position={[0, 0.03, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.016, 0.016, 0.12, 16]} />
        <meshPhysicalMaterial transparent opacity={0.6} transmission={0.9} roughness={0.1} color="#e0f2fe" />
      </mesh>

      {/* Embouts métalliques de contact en laiton nickelé */}
      {[-0.05, 0.05].map((x, idx) => (
        <mesh key={idx} position={[x, 0.03, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.018, 0.018, 0.024, 16]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.95} roughness={0.15} />
        </mesh>
      ))}

      {/* Filament de fusible glowing */}
      <mesh position={[0, 0.03, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.002, 0.002, 0.08, 8]} />
        <meshBasicMaterial color="#eab308" />
      </mesh>

      {isHovered && (
        <Html position={[0, 0.12, 0]} center distanceFactor={4} zIndexRange={[50, 0]}>
          <div style={{ background: 'rgba(15, 23, 42, 0.9)', color: '#22c55e', padding: '3px 6px', borderRadius: '4px', border: '1px solid #16a34a', fontSize: '10px', whiteSpace: 'nowrap', fontWeight: 600 }}>
            Fusible 0.5A : INTACT
          </div>
        </Html>
      )}
    </group>
  );
};

/**
 * 6. Source Laser Optique Rouge He-Ne (632.8 nm)
 */
const LaserSourceModel: React.FC<PedagogicalApparatusProps> = ({ isHovered }) => {
  const beamRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (beamRef.current) {
      const pulse = 0.85 + Math.sin(clock.getElapsedTime() * 10) * 0.15;
      (beamRef.current.material as THREE.MeshBasicMaterial).opacity = pulse;
    }
  });

  return (
    <group>
      {/* Corps cylindrique en aluminium anodisé bleu roi */}
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.22, 24]} />
        <meshStandardMaterial color="#1e3a8a" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Collimateur d'émission avant */}
      <mesh rotation={[0, 0, Math.PI / 2]} position={[0.11, 0.05, 0]} castShadow>
        <cylinderGeometry args={[0.02, 0.03, 0.02, 20]} />
        <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Faisceau laser volumétrique rouge traversant la table */}
      <mesh ref={beamRef} position={[0.6, 0.05, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.003, 0.003, 1.0, 8]} />
        <meshBasicMaterial color="#ef4444" transparent opacity={0.85} />
      </mesh>

      {isHovered && (
        <Html position={[0, 0.16, 0]} center distanceFactor={4} zIndexRange={[50, 0]}>
          <div style={{ background: 'rgba(15, 23, 42, 0.9)', color: '#ef4444', padding: '4px 8px', borderRadius: '4px', border: '1px solid #dc2626', fontSize: '11px', whiteSpace: 'nowrap', fontWeight: 600 }}>
            Faisceau Laser : 632.8 nm (Rouge)
          </div>
        </Html>
      )}
    </group>
  );
};

/**
 * 7. Prisme Équilatéral de Verre Crown (Dispersion Optique)
 */
const PrismModel: React.FC<PedagogicalApparatusProps> = ({ isHovered }) => {
  return (
    <group>
      {/* Prisme triangulaire en verre d'optique crown de pureté maximale */}
      <mesh castShadow position={[0, 0.075, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 0.15, 3]} />
        <meshPhysicalMaterial
          color="#ffffff"
          transmission={0.96}
          opacity={0.4}
          transparent
          roughness={0.05}
          ior={1.52}
          reflectivity={0.9}
        />
      </mesh>

      {/* Plateau tournant goniométrique gradué en degrés */}
      <mesh position={[0, 0.005, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.12, 0.01, 32]} />
        <meshStandardMaterial color="#334155" metalness={0.85} roughness={0.2} />
      </mesh>

      {isHovered && (
        <Html position={[0, 0.22, 0]} center distanceFactor={4} zIndexRange={[50, 0]}>
          <div style={{ background: 'rgba(15, 23, 42, 0.9)', color: '#a855f7', padding: '4px 8px', borderRadius: '4px', border: '1px solid #9333ea', fontSize: '11px', whiteSpace: 'nowrap', fontWeight: 600 }}>
            Prisme Crown : n = 1.52
          </div>
        </Html>
      )}
    </group>
  );
};

/**
 * 8. Calorimètre Isolé de Berthelot
 */
const CalorimeterModel: React.FC<PedagogicalApparatusProps> = ({ isHovered }) => {
  return (
    <group>
      {/* Vase externe en acier inoxydable poli miroir */}
      <mesh castShadow position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.24, 28]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.92} roughness={0.15} />
      </mesh>

      {/* Couvercle isolant étanche */}
      <mesh position={[0, 0.245, 0]} castShadow>
        <cylinderGeometry args={[0.108, 0.108, 0.02, 28]} />
        <meshStandardMaterial color="#1e293b" roughness={0.4} />
      </mesh>

      {/* Tige de l'agitateur manuel à boucle */}
      <mesh position={[0.04, 0.29, 0]} castShadow>
        <cylinderGeometry args={[0.005, 0.005, 0.12, 12]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Sonde thermométrique digitale */}
      <mesh position={[-0.04, 0.31, 0]} castShadow>
        <cylinderGeometry args={[0.006, 0.006, 0.16, 12]} />
        <meshStandardMaterial color="#38bdf8" metalness={0.8} roughness={0.2} />
      </mesh>

      {isHovered && (
        <Html position={[0, 0.42, 0]} center distanceFactor={4} zIndexRange={[50, 0]}>
          <div style={{ background: 'rgba(15, 23, 42, 0.9)', color: '#38bdf8', padding: '4px 8px', borderRadius: '4px', border: '1px solid #0284c7', fontSize: '11px', whiteSpace: 'nowrap', fontWeight: 600 }}>
            Calorimètre : 20.0 °C
          </div>
        </Html>
      )}
    </group>
  );
};

/**
 * 9. Piège Cognitif Actif / Disjoncteur Expérimental à Risque
 */
const CognitiveTrapModel: React.FC<PedagogicalApparatusProps> = ({ isHovered }) => {
  const alertLightRef = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    if (alertLightRef.current) {
      alertLightRef.current.intensity = 1.0 + Math.sin(clock.getElapsedTime() * 8) * 0.8;
    }
  });

  return (
    <group>
      {/* Boîtier avec zébrures de sécurité jaune/noir */}
      <RoundedBox args={[0.18, 0.12, 0.14]} radius={0.01} smoothness={2} castShadow position={[0, 0.06, 0]}>
        <meshStandardMaterial color="#eab308" roughness={0.3} metalness={0.2} />
      </RoundedBox>

      {/* Voyant stroboscopique d'avertissement */}
      <mesh position={[0, 0.14, 0]} castShadow>
        <sphereGeometry args={[0.024, 16, 16]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
      <pointLight ref={alertLightRef} color="#ef4444" distance={1.2} decay={2} position={[0, 0.14, 0]} />

      {/* Bornes de court-circuit délibéré */}
      {[-0.04, 0.04].map((x, idx) => (
        <mesh key={idx} position={[x, 0.12, 0.04]} castShadow>
          <cylinderGeometry args={[0.008, 0.008, 0.03, 12]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.95} />
        </mesh>
      ))}

      {isHovered && (
        <Html position={[0, 0.22, 0]} center distanceFactor={4} zIndexRange={[50, 0]}>
          <div style={{ background: 'rgba(239, 68, 68, 0.95)', color: '#ffffff', padding: '4px 8px', borderRadius: '4px', border: '1px solid #b91c1c', fontSize: '10px', whiteSpace: 'nowrap', fontWeight: 700 }}>
            ⚠️ Piège Cognitif Actif : Risque Court-Circuit
          </div>
        </Html>
      )}
    </group>
  );
};

/**
 * 10. Balise de Transfert Invariant (Épreuve E2 / Recherche Meta-Controller)
 */
const TransferBeaconModel: React.FC<PedagogicalApparatusProps> = ({ isHovered }) => {
  const orbRef = useRef<THREE.Mesh>(null);
  const ring1Ref = useRef<THREE.Group>(null);
  const ring2Ref = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (orbRef.current) {
      orbRef.current.position.y = 0.14 + Math.sin(t * 2.5) * 0.012;
    }
    if (ring1Ref.current) {
      ring1Ref.current.rotation.y = t * 0.8;
      ring1Ref.current.rotation.x = Math.sin(t * 0.5) * 0.2;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.z = -t * 0.6;
      ring2Ref.current.rotation.y = Math.cos(t * 0.4) * 0.25;
    }
  });

  return (
    <group>
      {/* Socle d'appui usiné reposant parfaitement sur le plateau */}
      <mesh position={[0, 0.012, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.15, 0.17, 0.024, 32]} />
        <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.7} />
      </mesh>

      {/* Anneau d'ancrage lumineux violet */}
      <mesh position={[0, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.12, 0.145, 32]} />
        <meshBasicMaterial color="#a855f7" />
      </mesh>

      {/* Colonnettes de suspension chromées */}
      {[-0.13, 0.13].map((x, idx) => (
        <group key={idx} position={[x, 0.08, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.008, 0.008, 0.12, 16]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0.06, 0]}>
            <sphereGeometry args={[0.012, 12, 12]} />
            <meshStandardMaterial color="#c084fc" metalness={0.5} roughness={0.2} />
          </mesh>
        </group>
      ))}

      {/* Anneau orbital 1 */}
      <group ref={ring1Ref} position={[0, 0.14, 0]}>
        <mesh>
          <torusGeometry args={[0.11, 0.005, 12, 32]} />
          <meshStandardMaterial color="#8b5cf6" metalness={0.8} roughness={0.25} />
        </mesh>
      </group>

      {/* Anneau orbital 2 */}
      <group ref={ring2Ref} position={[0, 0.14, 0]}>
        <mesh rotation={[Math.PI / 3, 0, 0]}>
          <torusGeometry args={[0.125, 0.004, 12, 32]} />
          <meshStandardMaterial color="#c084fc" metalness={0.8} roughness={0.25} />
        </mesh>
      </group>

      {/* Orbe invariant central lévitant */}
      <mesh ref={orbRef} position={[0, 0.14, 0]} castShadow>
        <sphereGeometry args={[0.075, 32, 32]} />
        <meshPhysicalMaterial
          color="#a855f7"
          emissive="#7c3aed"
          emissiveIntensity={0.5}
          roughness={0.15}
          metalness={0.3}
          clearcoat={0.8}
        />
      </mesh>

      {/* Halo lumineux ponctuel */}
      <pointLight color="#c084fc" distance={1.5} intensity={1.2} position={[0, 0.16, 0]} />

      {/* Badge holographique au survol */}
      {isHovered && (
        <Html position={[0, 0.28, 0]} center distanceFactor={4} zIndexRange={[50, 0]}>
          <div style={{
            background: 'rgba(15, 23, 42, 0.92)',
            color: '#c084fc',
            padding: '4px 10px',
            borderRadius: '6px',
            border: '1px solid #a855f7',
            fontSize: '11px',
            whiteSpace: 'nowrap',
            fontWeight: 700,
            boxShadow: '0 0 16px rgba(168, 85, 247, 0.4)',
            backdropFilter: 'blur(8px)'
          }}>
            🔮 Balise de Transfert Invariant (Épreuve E2)
          </div>
        </Html>
      )}
    </group>
  );
};

/**
 * 11. Sonde Diagnostique Contrefactuelle (Recherche Meta-Controller)
 */
const DiagnosticProbeModel: React.FC<PedagogicalApparatusProps> = ({ isHovered }) => {
  const probePulseRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (probePulseRef.current) {
      const pulse = 0.7 + Math.sin(clock.getElapsedTime() * 6) * 0.3;
      (probePulseRef.current.material as THREE.MeshBasicMaterial).opacity = pulse;
    }
  });

  return (
    <group>
      {/* Embase hexagonale usinée */}
      <mesh position={[0, 0.015, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.12, 0.14, 0.03, 6]} />
        <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Colonne de capture de données contrefactuelles */}
      <RoundedBox args={[0.10, 0.16, 0.10]} radius={0.01} smoothness={2} position={[0, 0.10, 0]} castShadow>
        <meshStandardMaterial color="#1e293b" roughness={0.35} metalness={0.6} />
      </RoundedBox>

      {/* Capteur optique & récepteur de sonde cyan */}
      <mesh ref={probePulseRef} position={[0, 0.20, 0]}>
        <sphereGeometry args={[0.035, 20, 20]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.85} />
      </mesh>
      <pointLight color="#38bdf8" distance={1.2} intensity={0.9} position={[0, 0.20, 0]} />

      {isHovered && (
        <Html position={[0, 0.28, 0]} center distanceFactor={4} zIndexRange={[50, 0]}>
          <div style={{
            background: 'rgba(15, 23, 42, 0.92)',
            color: '#38bdf8',
            padding: '4px 10px',
            borderRadius: '6px',
            border: '1px solid #0284c7',
            fontSize: '11px',
            whiteSpace: 'nowrap',
            fontWeight: 700,
            boxShadow: '0 0 16px rgba(56, 189, 248, 0.4)',
            backdropFilter: 'blur(8px)'
          }}>
            ⚡ Sonde Diagnostique Contrefactuelle
          </div>
        </Html>
      )}
    </group>
  );
};

/**
 * 12. Dispositif de Contrainte Épistémique & Révélation d'Erreur Féconde
 */
const FalsifierModel: React.FC<PedagogicalApparatusProps> = ({ isHovered }) => {
  const warningLightRef = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    if (warningLightRef.current) {
      warningLightRef.current.intensity = 0.8 + Math.sin(clock.getElapsedTime() * 8) * 0.6;
    }
  });

  return (
    <group>
      {/* Embase carrée d'isolation de sécurité */}
      <RoundedBox args={[0.22, 0.03, 0.22]} radius={0.01} smoothness={2} position={[0, 0.015, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.7} />
      </RoundedBox>

      {/* Cage de protection orange */}
      <mesh position={[0, 0.10, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.08, 0.14, 16]} />
        <meshStandardMaterial color="#f97316" roughness={0.4} metalness={0.3} />
      </mesh>

      {/* Balise stroboscopique de contrainte épistémique */}
      <mesh position={[0, 0.19, 0]} castShadow>
        <sphereGeometry args={[0.03, 16, 16]} />
        <meshBasicMaterial color="#ff5500" />
      </mesh>
      <pointLight ref={warningLightRef} color="#f97316" distance={1.2} intensity={1.0} position={[0, 0.20, 0]} />

      {isHovered && (
        <Html position={[0, 0.28, 0]} center distanceFactor={4} zIndexRange={[50, 0]}>
          <div style={{
            background: 'rgba(15, 23, 42, 0.92)',
            color: '#fb923c',
            padding: '4px 10px',
            borderRadius: '6px',
            border: '1px solid #ea580c',
            fontSize: '11px',
            whiteSpace: 'nowrap',
            fontWeight: 700,
            boxShadow: '0 0 16px rgba(249, 115, 22, 0.4)',
            backdropFilter: 'blur(8px)'
          }}>
            ⚠️ Dispositif de Contrainte Épistémique
          </div>
        </Html>
      )}
    </group>
  );
};

/**
 * Modèle générique de secours
 */
const DefaultApparatusModel: React.FC<PedagogicalApparatusProps> = ({ entity }) => {
  return (
    <RoundedBox args={[0.2, 0.2, 0.2]} radius={0.01}>
      <meshStandardMaterial color={entity.visuals?.color || '#38bdf8'} />
    </RoundedBox>
  );
};
