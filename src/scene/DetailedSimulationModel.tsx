// src/scene/DetailedSimulationModel.tsx
// Modèles 3D procéduraux haute-fidélité pour les simulations culinaires, de séminaire et FLE.
// Fournit des géométries réalistes, matériaux PBR physiques (cuivre, verre optique, bois noble, porcelaine)
// pour les objets clés des scénarios WorldPilot.
import React from 'react';
import { RoundedBox } from '@react-three/drei';
import type { EntitySpec } from '../core/types';
import { useWorldStore } from '../engine/store';
import {resolveCanonicalAssetId} from '../library/catalog';
export const AutomobileCarEngineBay: React.FC<{ isSelected?: boolean; isHovered?: boolean }> = ({ isSelected, isHovered }) => {
  const flags = useWorldStore(s => s.world.flags || {});
  const isBatteryInstalled = flags['battery_installed'] || flags['battery_connected'] || false;
  const isCarRunning = flags['car_running'] || flags['engine_started'] || isBatteryInstalled;

  return (
    <group position={[0, 0, 0]}>
      {/* 1. Carrosserie principale Berline Compacte (Bleu Alpin Éclatant Métallisé Haute Visibilité) */}
      <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.7, 0.5, 3.4]} />
        <meshPhysicalMaterial
          color={isHovered ? "#3b82f6" : isSelected ? "#60a5fa" : "#2563eb"}
          metalness={0.85}
          roughness={0.2}
          clearcoat={1.0}
          clearcoatRoughness={0.08}
        />
      </mesh>

      {/* 2. Habitacle / Toit avec montants profilés */}
      <mesh position={[0, 0.88, -0.2]} castShadow>
        <boxGeometry args={[1.45, 0.48, 1.8]} />
        <meshPhysicalMaterial
          color={isHovered ? "#3b82f6" : isSelected ? "#60a5fa" : "#2563eb"}
          metalness={0.85}
          roughness={0.2}
          clearcoat={1.0}
        />
      </mesh>

      {/* 3. Pare-brise avant incliné fumé */}
      <mesh position={[0, 0.84, 0.78]} rotation={[-Math.PI / 4.2, 0, 0]}>
        <boxGeometry args={[1.38, 0.45, 0.05]} />
        <meshPhysicalMaterial color="#0f172a" transmission={0.7} roughness={0.1} ior={1.5} />
      </mesh>
      {/* Lunette arrière */}
      <mesh position={[0, 0.84, -1.18]} rotation={[Math.PI / 4.2, 0, 0]}>
        <boxGeometry args={[1.38, 0.45, 0.05]} />
        <meshPhysicalMaterial color="#0f172a" transmission={0.7} roughness={0.1} ior={1.5} />
      </mesh>

      {/* 4. Les 4 Roues pneumatiques avec jantes alu et disques de freins */}
      {[
        [-0.88, 0.28, 1.05],  // Avant gauche
        [0.88, 0.28, 1.05],   // Avant droit
        [-0.88, 0.28, -1.05], // Arrière gauche
        [0.88, 0.28, -1.05]   // Arrière droit
      ].map(([wx, wy, wz], wIdx) => (
        <group key={`car-wheel-${wIdx}`} position={[wx, wy, wz]}>
          {/* Pneu gomme noire sculptée */}
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.32, 0.32, 0.24, 28]} />
            <meshStandardMaterial color="#0f172a" roughness={0.9} />
          </mesh>
          {/* Jante alliage 5 branches alu brossé */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.22, 0.22, 0.25, 16]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.15} />
          </mesh>
          {/* Étriers de frein sport rouge vif */}
          <mesh position={[wx > 0 ? -0.06 : 0.06, 0.12, 0]}>
            <boxGeometry args={[0.06, 0.1, 0.12]} />
            <meshStandardMaterial color="#ef4444" metalness={0.6} roughness={0.3} />
          </mesh>
        </group>
      ))}

      {/* 5. Calandre avant chromée & Logo */}
      <mesh position={[0, 0.38, 1.71]}>
        <boxGeometry args={[1.2, 0.22, 0.04]} />
        <meshStandardMaterial color="#020617" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.38, 1.72]}>
        <torusGeometry args={[0.08, 0.015, 8, 24]} />
        <meshStandardMaterial color="#f8fafc" metalness={0.95} roughness={0.1} />
      </mesh>

      {/* 6. Phares avant (Allumés si batterie branchée / moteur démarré !) */}
      {[-0.65, 0.65].map((hx, hIdx) => (
        <group key={`headlight-${hIdx}`} position={[hx, 0.46, 1.68]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.12, 0.14, 0.06, 16]} />
            <meshStandardMaterial
              color={isCarRunning ? "#e0f2fe" : "#94a3b8"}
              emissive={isCarRunning ? "#38bdf8" : "#000000"}
              emissiveIntensity={isCarRunning ? 3.0 : 0}
              roughness={0.1}
            />
          </mesh>
          {isCarRunning && (
            <pointLight position={[0, 0, 0.3]} color="#38bdf8" intensity={2.5} distance={6} />
          )}
        </group>
      ))}

      {/* Feux arrière rouge rubis */}
      {[-0.65, 0.65].map((tx, tIdx) => (
        <mesh key={`taillight-${tIdx}`} position={[tx, 0.48, -1.71]}>
          <boxGeometry args={[0.26, 0.1, 0.04]} />
          <meshStandardMaterial
            color="#dc2626"
            emissive={isCarRunning ? "#ef4444" : "#7f1d1d"}
            emissiveIntensity={isCarRunning ? 2.0 : 0.4}
            roughness={0.2}
          />
        </mesh>
      ))}

      {/* 7. COMPARTIMENT MOTEUR OUVERT (ENGINE BAY) AVEC CAPOT RELEVÉ */}
      {/* Capot ouvert incliné à 38° maintenu par vérin */}
      <group position={[0, 0.65, 0.8]} rotation={[-Math.PI / 4.8, 0, 0]}>
        <mesh position={[0, 0, 0.55]} castShadow>
          <boxGeometry args={[1.5, 0.04, 1.15]} />
          <meshPhysicalMaterial
            color={isHovered ? "#3b82f6" : isSelected ? "#60a5fa" : "#2563eb"}
            metalness={0.85}
            roughness={0.2}
            clearcoat={1.0}
          />
        </mesh>
        {/* Béquille / Vérin télescopique chromé */}
        <mesh position={[0.68, -0.22, 0.45]} rotation={[Math.PI / 6, 0, 0]}>
          <cylinderGeometry args={[0.01, 0.01, 0.55, 12]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.1} />
        </mesh>
      </group>

      {/* Cuve creuse du compartiment moteur */}
      <mesh position={[0, 0.45, 1.15]} receiveShadow>
        <boxGeometry args={[1.45, 0.32, 1.05]} />
        <meshStandardMaterial color="#1e293b" roughness={0.7} />
      </mesh>

      {/* Bloc Moteur en fonte alu avec nervures et culasse */}
      <mesh position={[-0.15, 0.52, 1.15]} castShadow>
        <boxGeometry args={[0.65, 0.38, 0.72]} />
        <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.25} />
      </mesh>
      {/* Cache-culbuteur supérieur nervuré */}
      <mesh position={[-0.15, 0.72, 1.15]}>
        <boxGeometry args={[0.55, 0.06, 0.62]} />
        <meshStandardMaterial color="#334155" roughness={0.4} />
      </mesh>
      {/* Conduit d'admission d'air et filtre à air */}
      <mesh position={[-0.15, 0.65, 0.74]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.06, 0.06, 0.35, 16]} />
        <meshStandardMaterial color="#020617" roughness={0.8} />
      </mesh>

      {/* 8. BAC RÉCEPTEUR DE BATTERIE AUTOMOBILE 12V (BATTERY TRAY) */}
      <group position={[0.42, 0.48, 1.12]}>
        {/* Support métallique / Bac à batterie */}
        <mesh>
          <boxGeometry args={[0.38, 0.08, 0.3]} />
          <meshStandardMaterial color="#334155" roughness={0.4} metalness={0.6} />
        </mesh>
        {/* Liseré lumineux récepteur */}
        <mesh position={[0, 0.042, 0]}>
          <boxGeometry args={[0.36, 0.008, 0.28]} />
          <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={0.65} roughness={0.2} />
        </mesh>

        {/* Câble & Cosse POSITIVE (+) Rouge avec bague en cuivre */}
        <group position={[0.11, 0.12, -0.06]}>
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.022, 0.022, 0.06, 16]} />
            <meshStandardMaterial color="#ef4444" roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.04, 0]}>
            <torusGeometry args={[0.024, 0.007, 8, 16]} />
            <meshStandardMaterial color="#d97706" metalness={0.9} roughness={0.2} />
          </mesh>
          {/* Câble souple rouge vers alternateur */}
          <mesh position={[0.06, -0.04, 0]} rotation={[0, 0, Math.PI / 3]}>
            <cylinderGeometry args={[0.012, 0.012, 0.14, 10]} />
            <meshStandardMaterial color="#ef4444" roughness={0.5} />
          </mesh>
        </group>

        {/* Câble & Cosse NÉGATIVE (-) Noire / Masse châssis */}
        <group position={[-0.11, 0.12, -0.06]}>
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.022, 0.022, 0.06, 16]} />
            <meshStandardMaterial color="#1e293b" roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.04, 0]}>
            <torusGeometry args={[0.024, 0.007, 8, 16]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
          </mesh>
          {/* Câble souple noir vers masse châssis */}
          <mesh position={[-0.06, -0.04, 0]} rotation={[0, 0, -Math.PI / 3]}>
            <cylinderGeometry args={[0.012, 0.012, 0.14, 10]} />
            <meshStandardMaterial color="#020617" roughness={0.5} />
          </mesh>
        </group>

        {/* Si la batterie est installée dans le bac : affiche la batterie en place connectée */}
        {isBatteryInstalled && (
          <group position={[0, 0.12, 0]}>
            <mesh castShadow>
              <boxGeometry args={[0.32, 0.22, 0.22]} />
              <meshStandardMaterial color="#0f172a" roughness={0.4} />
            </mesh>
            {/* Étiquette 12V connectée */}
            <mesh position={[0, 0.02, 0.112]}>
              <planeGeometry args={[0.22, 0.12]} />
              <meshBasicMaterial color="#10b981" />
            </mesh>
            {/* Voyant LED témoin de tension 12.6V */}
            <mesh position={[0.06, 0.115, 0.05]}>
              <sphereGeometry args={[0.014, 12, 12]} />
              <meshBasicMaterial color="#22c55e" />
            </mesh>
          </group>
        )}
      </group>
    </group>
  );
};

export const CarBattery12V: React.FC<{ entity?: EntitySpec; isSelected?: boolean; isHovered?: boolean }> = ({ entity, isSelected }) => {
  const customColor = entity?.visuals?.color;
  const customRoughness = entity?.visuals?.roughness;
  const customMetalness = entity?.visuals?.metalness;
  return (
    <group position={[0, 0.16, 0]} scale={1.35}>
      {/* Boîtier principal en polypropylène renforcé AGM haute lisibilité */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.36, 0.22, 0.24]} />
        <meshStandardMaterial
          color={customColor || (isSelected ? "#2563eb" : "#1e293b")}
          roughness={customRoughness ?? 0.35}
          metalness={customMetalness ?? 0.25}
        />
      </mesh>

      {/* Couvercle supérieur scellé AGM contrasté avec bandeau technique */}
      <mesh position={[0, 0.115, 0]} castShadow>
        <boxGeometry args={[0.37, 0.035, 0.25]} />
        <meshStandardMaterial
          color={customColor || (isSelected ? "#3b82f6" : "#334155")}
          roughness={customRoughness ?? 0.28}
          metalness={customMetalness ?? 0.3}
        />
      </mesh>

      {/* 6 Bouchons de cellules scellées étanches argentées */}
      {[-0.125, -0.075, -0.025, 0.025, 0.075, 0.125].map((cx, cIdx) => (
        <mesh key={`battery-cell-${cIdx}`} position={[cx, 0.134, 0]}>
          <cylinderGeometry args={[0.016, 0.016, 0.006, 12]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.2} />
        </mesh>
      ))}

      {/* Poignée de transport rabattable ergonomique rouge vif */}
      <group position={[0, 0.14, 0]}>
        <mesh position={[0, 0.045, 0]}>
          <boxGeometry args={[0.28, 0.024, 0.035]} />
          <meshStandardMaterial color="#ef4444" emissive="#7f1d1d" emissiveIntensity={0.25} roughness={0.3} />
        </mesh>
        {[-0.125, 0.125].map((px, pIdx) => (
          <mesh key={`handle-pivot-${pIdx}`} position={[px, 0.015, 0]}>
            <cylinderGeometry args={[0.014, 0.014, 0.05, 12]} />
            <meshStandardMaterial color="#dc2626" roughness={0.3} />
          </mesh>
        ))}
      </group>

      {/* Borne positive (+) cylindrique en plomb avec capuchon/bague d'isolation rouge lumineux */}
      <group position={[0.115, 0.145, -0.05]}>
        <mesh position={[0, 0.01, 0]}>
          <cylinderGeometry args={[0.024, 0.026, 0.048, 16]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.92} roughness={0.15} />
        </mesh>
        <mesh position={[0, -0.012, 0]}>
          <cylinderGeometry args={[0.034, 0.034, 0.02, 16]} />
          <meshStandardMaterial color="#ef4444" emissive="#dc2626" emissiveIntensity={0.4} roughness={0.25} />
        </mesh>
        {/* Symbole '+' sérigraphié */}
        <mesh position={[0, 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.024, 0.024]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
      </group>

      {/* Borne négative (-) cylindrique en plomb avec bague d'isolation bleu/noir */}
      <group position={[-0.115, 0.145, -0.05]}>
        <mesh position={[0, 0.01, 0]}>
          <cylinderGeometry args={[0.024, 0.026, 0.048, 16]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.92} roughness={0.15} />
        </mesh>
        <mesh position={[0, -0.012, 0]}>
          <cylinderGeometry args={[0.034, 0.034, 0.02, 16]} />
          <meshStandardMaterial color="#0284c7" emissive="#0369a1" emissiveIntensity={0.35} roughness={0.25} />
        </mesh>
      </group>

      {/* Voyant de contrôle optique 'Magic Eye' vert (État de charge 12.6V OK) */}
      <mesh position={[0, 0.132, 0.05]}>
        <cylinderGeometry args={[0.02, 0.02, 0.012, 16]} />
        <meshStandardMaterial color="#22c55e" emissive="#10b981" emissiveIntensity={1.1} roughness={0.15} />
      </mesh>

      {/* Étiquette technique constructeur haute lisibilité (Avant & Arrière) */}
      {[0.122, -0.122].map((pz, idx) => (
        <group key={`battery-label-${idx}`} position={[0, 0, pz]} rotation={[0, pz < 0 ? Math.PI : 0, 0]}>
          <mesh position={[0, 0.005, 0]}>
            <planeGeometry args={[0.28, 0.15]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.045, 0.001]}>
            <planeGeometry args={[0.25, 0.042]} />
            <meshBasicMaterial color="#2563eb" />
          </mesh>
          <mesh position={[0, -0.015, 0.001]}>
            <planeGeometry args={[0.25, 0.028]} />
            <meshBasicMaterial color="#f59e0b" />
          </mesh>
          <mesh position={[0, -0.05, 0.001]}>
            <planeGeometry args={[0.25, 0.02]} />
            <meshBasicMaterial color="#0f172a" />
          </mesh>
        </group>
      ))}
    </group>
  );
};

export const EmergencyGenerator12V: React.FC<{ entity?: EntitySpec; isSelected?: boolean; isHovered?: boolean }> = ({ entity, isSelected }) => {
  const customColor = entity?.visuals?.color;
  return (
    <group position={[0, 0.16, 0]}>
      {/* Châssis moteur/onduleur principal jaune industriel & acier */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.42, 0.28, 0.28]} />
        <meshStandardMaterial
          color={customColor && customColor !== '#475569' ? customColor : (isSelected ? "#fbbf24" : "#f59e0b")}
          roughness={0.35}
          metalness={0.35}
        />
      </mesh>
      {/* Bloc alternateur cylindrique latéral en cuivre/acier */}
      <mesh position={[0.12, -0.02, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.09, 0.09, 0.22, 20]} />
        <meshStandardMaterial color="#334155" metalness={0.75} roughness={0.28} />
      </mesh>
      {/* Arceau tubulaire supérieur de protection */}
      <mesh position={[0, 0.16, 0]} castShadow>
        <boxGeometry args={[0.44, 0.025, 0.26]} />
        <meshStandardMaterial color="#0f172a" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Panneau de contrôle frontal avec afficheur numérique 12.8V et prises */}
      <mesh position={[0, 0.02, 0.142]}>
        <planeGeometry args={[0.32, 0.18]} />
        <meshStandardMaterial color="#0f172a" roughness={0.4} />
      </mesh>
      {/* Écran LED de télémétrie vert */}
      <mesh position={[-0.07, 0.05, 0.144]}>
        <planeGeometry args={[0.11, 0.05]} />
        <meshBasicMaterial color="#10b981" />
      </mesh>
      {/* Bornes de puissance 12V Rouge (+) et Noire (-) */}
      <mesh position={[0.07, 0.04, 0.15]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.025, 16]} />
        <meshStandardMaterial color="#ef4444" roughness={0.3} />
      </mesh>
      <mesh position={[0.12, 0.04, 0.15]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.025, 16]} />
        <meshStandardMaterial color="#38bdf8" roughness={0.3} />
      </mesh>
    </group>
  );
};

const LaboratoryTechnicalBench: React.FC<{ isSelected?: boolean; isHovered?: boolean }> = () => {
  return (
    <group position={[0, 0, 0]}>
      {/* Plateau supérieur d'atelier en acier galvanisé brossé satiné haute visibilité */}
      <mesh position={[0, 0.88, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 0.045, 0.85]} />
        <meshPhysicalMaterial
          color="#cbd5e1"
          roughness={0.28}
          metalness={0.65}
          clearcoat={0.3}
          clearcoatRoughness={0.12}
        />
      </mesh>

      {/* Cadre de cerclage biseauté en aluminium d'atelier */}
      <mesh position={[0, 0.88, 0]}>
        <boxGeometry args={[1.515, 0.046, 0.865]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.2} wireframe={false} />
      </mesh>

      {/* Dosseret technique arrière vertical gris clair technique */}
      <mesh position={[0, 0.96, -0.40]} castShadow>
        <boxGeometry args={[1.5, 0.12, 0.03]} />
        <meshStandardMaterial color="#475569" roughness={0.35} metalness={0.4} />
      </mesh>
      {/* 3 Prises électriques industrielles 230V sur le dosseret */}
      {[-0.3, 0, 0.3].map((px, pIdx) => (
        <group key={`socket-${pIdx}`} position={[px, 0.96, -0.38]}>
          <mesh>
            <boxGeometry args={[0.045, 0.045, 0.015]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.25} />
          </mesh>
          <mesh position={[0, 0, 0.008]}>
            <circleGeometry args={[0.014, 16]} />
            <meshBasicMaterial color="#0284c7" />
          </mesh>
        </group>
      ))}

      {/* 4 Pieds métalliques en profilés carrés d'acier anthracite */}
      {[-0.7, 0.7].map((x) =>
        [-0.36, 0.36].map((z) => (
          <group key={`bench-leg-${x}-${z}`} position={[x, 0.43, z]}>
            <mesh castShadow>
              <boxGeometry args={[0.06, 0.86, 0.06]} />
              <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
            </mesh>
            {/* Vérin de réglage au sol chromé */}
            <mesh position={[0, -0.43, 0]}>
              <cylinderGeometry args={[0.035, 0.035, 0.015, 20]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
            </mesh>
          </group>
        ))
      )}

      {/* Traverses de renfort mécano-soudées */}
      <mesh position={[0, 0.15, -0.36]}>
        <boxGeometry args={[1.36, 0.04, 0.04]} />
        <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
      </mesh>
      {[-0.7, 0.7].map((x, xIdx) => (
        <mesh key={`leg-brace-${xIdx}`} position={[x, 0.15, 0]}>
          <boxGeometry args={[0.04, 0.04, 0.7]} />
          <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
        </mesh>
      ))}

      {/* Bloc suspendu à 2 tiroirs sous le plan de travail à droite */}
      <group position={[0.42, 0.72, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.42, 0.24, 0.72]} />
          <meshStandardMaterial color="#475569" roughness={0.4} />
        </mesh>
        {/* Façades et poignées profilées aluminium des 2 tiroirs */}
        {[-0.05, 0.05].map((ty, tIdx) => (
          <group key={`drawer-${tIdx}`} position={[0, ty, 0.362]}>
            <mesh>
              <boxGeometry args={[0.39, 0.09, 0.005]} />
              <meshStandardMaterial color="#64748b" roughness={0.3} />
            </mesh>
            <mesh position={[0, 0, 0.008]}>
              <boxGeometry args={[0.12, 0.012, 0.012]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
};

const VictoriaVRCockpitDock: React.FC<{ isSelected?: boolean; isHovered?: boolean }> = ({ isSelected, isHovered }) => {
  const flags = useWorldStore(s => s.world.flags || {});
  const isStarted = Boolean(flags['supercar_started'] || flags['engine_started'] || flags['v12_started'] || flags['car_started']);

  return (
    <group position={[0, 0, 0]}>
      {/* Embase réceptrice circulaire dans le tunnel central du cockpit */}
      <mesh receiveShadow position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.35, 0.38, 0.04, 32]} />
        <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.25} />
      </mesh>
      {/* Cible d'aimantage magnétique avec anneau cyan pulsant */}
      <mesh position={[0, 0.042, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.24, 0.32, 32]} />
        <meshStandardMaterial
          color={isStarted ? '#22c55e' : '#38bdf8'}
          emissive={isStarted ? '#16a34a' : '#0284c7'}
          emissiveIntensity={isStarted ? 3.0 : 2.0}
        />
      </mesh>
      {/* Logement clé creusé */}
      <mesh position={[0, 0.041, 0]}>
        <boxGeometry args={[0.18, 0.01, 0.28]} />
        <meshStandardMaterial color="#0f172a" roughness={0.6} />
      </mesh>
      {(isSelected || isHovered) && (
        <pointLight position={[0, 0.2, 0]} color="#38bdf8" intensity={2.0} distance={1.5} />
      )}
    </group>
  );
};

const TechnicalTravelBackpack42L: React.FC<{ entity?: EntitySpec; isSelected?: boolean; isHovered?: boolean }> = ({ entity, isSelected, isHovered }) => {
  const isOpen = entity?.state === 'open';
  const customColor = entity?.visuals?.color || '#1e293b';

  return (
    <group position={[0, 0, 0]}>
      {/* 1. Base et coque principale 42L en nylon balistique mat */}
      <mesh position={[0, 0.24, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.34, 0.48, 0.22]} />
        <meshStandardMaterial
          color={customColor}
          roughness={0.7}
          metalness={0.12}
        />
      </mesh>

      {/* 2. Compartiment arrière PC 15-16" matelassé avec liseré contrasté */}
      <mesh position={[0, 0.25, -0.09]} castShadow>
        <boxGeometry args={[0.32, 0.46, 0.04]} />
        <meshStandardMaterial color="#0f172a" roughness={0.6} metalness={0.2} />
      </mesh>

      {/* 3. Volet d'ouverture / Clamshell Deck (Bascule selon isOpen) */}
      <group position={[0, isOpen ? 0.38 : 0.32, isOpen ? -0.05 : 0.09]} rotation={[isOpen ? -0.7 : 0, 0, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.32, isOpen ? 0.24 : 0.30, 0.05]} />
          <meshStandardMaterial color="#334155" roughness={0.65} metalness={0.15} />
        </mesh>
        {/* Liseré et tirettes de fermeture éclair haute visibilité orange */}
        <mesh position={[0, 0, 0.028]}>
          <boxGeometry args={[0.30, 0.008, 0.004]} />
          <meshStandardMaterial color="#f97316" roughness={0.3} metalness={0.7} />
        </mesh>
      </group>

      {/* 4. Intérieur visible si ouvert (Poche molletonnée laptop avec guide néon) */}
      {isOpen && (
        <group position={[0, 0.26, -0.02]}>
          {/* Manchon intérieur rembourré */}
          <mesh>
            <boxGeometry args={[0.29, 0.38, 0.02]} />
            <meshStandardMaterial color="#3b82f6" roughness={0.5} transparent opacity={0.85} />
          </mesh>
          {/* Guide visuel néon pour glisser l'ordinateur */}
          <mesh position={[0, 0.16, 0.015]}>
            <boxGeometry args={[0.27, 0.01, 0.005]} />
            <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={0.8} />
          </mesh>
        </group>
      )}

      {/* 5. Poche latérale élastique porte-gourde sur le flanc gauche */}
      <group position={[-0.175, 0.15, 0.02]}>
        <mesh castShadow>
          <boxGeometry args={[0.02, 0.22, 0.12]} />
          <meshStandardMaterial color="#0f172a" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.10, 0]}>
          <boxGeometry args={[0.022, 0.015, 0.125]} />
          <meshStandardMaterial color="#f97316" roughness={0.4} />
        </mesh>
      </group>

      {/* 6. Poignée supérieure renforcée en sangle néoprène */}
      <mesh position={[0, 0.49, -0.02]} castShadow>
        <cylinderGeometry args={[0.012, 0.012, 0.14, 16]} />
        <meshStandardMaterial color="#0f172a" roughness={0.5} metalness={0.4} />
      </mesh>

      {/* 7. Sangles bretelles ergonomiques dorsales */}
      {[-0.08, 0.08].map((sx, sIdx) => (
        <group key={`tech-strap-${sIdx}`} position={[sx, 0.24, -0.115]}>
          <mesh castShadow>
            <boxGeometry args={[0.045, 0.42, 0.012]} />
            <meshStandardMaterial color="#0f172a" roughness={0.8} />
          </mesh>
          {/* Boucle sangle sternale en polyamide injecté */}
          <mesh position={[0, -0.04, -0.008]}>
            <boxGeometry args={[0.038, 0.025, 0.008]} />
            <meshStandardMaterial color="#f97316" roughness={0.4} metalness={0.6} />
          </mesh>
        </group>
      ))}

      {/* Halo de sélection / survol */}
      {(isSelected || isHovered) && (
        <mesh position={[0, 0.24, 0]}>
          <boxGeometry args={[0.38, 0.52, 0.26]} />
          <meshBasicMaterial color={isSelected ? '#38bdf8' : '#fbbf24'} wireframe transparent opacity={0.5} />
        </mesh>
      )}
    </group>
  );
};

const FacilitatorLaptop: React.FC<{ isSelected?: boolean; isHovered?: boolean }> = () => {
  return (
    <group position={[0, 0, 0]}>
      {/* Base châssis aluminium */}
      <RoundedBox args={[0.28, 0.009, 0.20]} radius={0.004} smoothness={2} position={[0, 0.005, 0]} castShadow>
        <meshStandardMaterial color="#cbd5e1" metalness={0.88} roughness={0.25} />
      </RoundedBox>

      {/* Clavier chiclet noir encastré */}
      <mesh position={[0, 0.010, -0.02]}>
        <boxGeometry args={[0.24, 0.002, 0.10]} />
        <meshStandardMaterial color="#1e293b" roughness={0.6} />
      </mesh>

      {/* Trackpad en verre poli */}
      <mesh position={[0, 0.010, 0.06]}>
        <boxGeometry args={[0.09, 0.001, 0.055]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.7} roughness={0.15} />
      </mesh>

      {/* Écran ouvert incliné à 110 degrés */}
      <group position={[0, 0.01, -0.10]} rotation={[-0.35, 0, 0]}>
        {/* Capot aluminium fin */}
        <RoundedBox args={[0.28, 0.19, 0.006]} radius={0.004} smoothness={2} position={[0, 0.095, 0]} castShadow>
          <meshStandardMaterial color="#cbd5e1" metalness={0.88} roughness={0.25} />
        </RoundedBox>

        {/* Dalle écran allumée avec dashboard WorldPilot */}
        <mesh position={[0, 0.095, 0.0035]}>
          <planeGeometry args={[0.26, 0.17]} />
          <meshBasicMaterial color="#0f172a" />
        </mesh>
        {/* Graphiques et analytics affichés sur l'écran */}
        <mesh position={[-0.04, 0.11, 0.004]}>
          <planeGeometry args={[0.14, 0.07]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
        <mesh position={[0.07, 0.11, 0.004]}>
          <planeGeometry args={[0.06, 0.07]} />
          <meshBasicMaterial color="#10b981" />
        </mesh>
        <mesh position={[0, 0.045, 0.004]}>
          <planeGeometry args={[0.22, 0.03]} />
          <meshBasicMaterial color="#6366f1" />
        </mesh>
      </group>
    </group>
  );
};

const ThermalWaterBottle: React.FC<{ isSelected?: boolean; isHovered?: boolean }> = ({ isSelected, isHovered }) => {
  return (
    <group position={[0, 0, 0]}>
      {/* Corps cylindrique inox thermo double paroi */}
      <mesh position={[0, 0.12, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.038, 0.038, 0.22, 24]} />
        <meshStandardMaterial color="#0284c7" metalness={0.7} roughness={0.25} />
      </mesh>
      {/* Goulot fileté brossé */}
      <mesh position={[0, 0.235, 0]} castShadow>
        <cylinderGeometry args={[0.022, 0.024, 0.025, 24]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.15} />
      </mesh>
      {/* Bouchon avec anneau en bambou / inox */}
      <mesh position={[0, 0.255, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.025, 0.02, 24]} />
        <meshStandardMaterial color="#78350f" roughness={0.6} />
      </mesh>
      {(isSelected || isHovered) && (
        <mesh position={[0, 0.13, 0]}>
          <cylinderGeometry args={[0.045, 0.045, 0.26, 16]} />
          <meshBasicMaterial color={isSelected ? '#38bdf8' : '#fbbf24'} wireframe transparent opacity={0.5} />
        </mesh>
      )}
    </group>
  );
};

const ShippingCardboardBox: React.FC<{ isSelected?: boolean; isHovered?: boolean }> = ({ isSelected, isHovered }) => {
  return (
    <group position={[0, 0, 0]}>
      {/* Boîte carton ondulé kraft */}
      <mesh position={[0, 0.16, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.44, 0.32, 0.30]} />
        <meshStandardMaterial color="#b45309" roughness={0.85} metalness={0.04} />
      </mesh>
      {/* Ruban adhésif d'emballage kraft renforcé */}
      <mesh position={[0, 0.322, 0]}>
        <boxGeometry args={[0.445, 0.002, 0.06]} />
        <meshStandardMaterial color="#92400e" roughness={0.4} />
      </mesh>
      {/* Étiquette d'expédition code-barres */}
      <mesh position={[0.12, 0.323, 0.06]}>
        <boxGeometry args={[0.12, 0.001, 0.08]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.3} />
      </mesh>
      {(isSelected || isHovered) && (
        <mesh position={[0, 0.16, 0]}>
          <boxGeometry args={[0.46, 0.34, 0.32]} />
          <meshBasicMaterial color={isSelected ? '#38bdf8' : '#fbbf24'} wireframe transparent opacity={0.5} />
        </mesh>
      )}
    </group>
  );
};

const KitchenIslandWorkbench: React.FC<{ isSelected?: boolean; isHovered?: boolean }> = ({ isSelected = false, isHovered = false }) => {
  return (
    <group position={[0, 0, 0]}>
      {/* 1. Plateau supérieur en marbre de Carrare blanc adouci (fini satiné mat anti-éblouissement) */}
      <mesh position={[0, 0.88, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 0.06, 0.95]} />
        <meshPhysicalMaterial
          color="#f1f5f9"
          roughness={0.44}
          metalness={0.03}
          clearcoat={0.12}
          clearcoatRoughness={0.38}
          emissive={isSelected ? '#38bdf8' : isHovered ? '#fbbf24' : '#000000'}
          emissiveIntensity={isSelected ? 0.4 : isHovered ? 0.2 : 0}
        />
      </mesh>

      {/* Cadre de rive / alèse périphérique en chêne massif autour du marbre pour une lisibilité parfaite sous tous les angles */}
      <mesh position={[0, 0.88, 0.49]} castShadow>
        <boxGeometry args={[1.54, 0.065, 0.03]} />
        <meshStandardMaterial color="#9a6235" roughness={0.65} />
      </mesh>
      <mesh position={[0, 0.88, -0.49]} castShadow>
        <boxGeometry args={[1.54, 0.065, 0.03]} />
        <meshStandardMaterial color="#9a6235" roughness={0.65} />
      </mesh>
      <mesh position={[0.76, 0.88, 0]} castShadow>
        <boxGeometry args={[0.03, 0.065, 1.01]} />
        <meshStandardMaterial color="#9a6235" roughness={0.65} />
      </mesh>
      <mesh position={[-0.76, 0.88, 0]} castShadow>
        <boxGeometry args={[0.03, 0.065, 1.01]} />
        <meshStandardMaterial color="#9a6235" roughness={0.65} />
      </mesh>

      {/* Ceinture sous plateau en chêne massif */}
      <mesh position={[0, 0.835, 0]} castShadow>
        <boxGeometry args={[1.44, 0.04, 0.90]} />
        <meshStandardMaterial color="#9a6235" roughness={0.65} />
      </mesh>

      {/* 2. 4 Pieds massifs carrés en chêne qui reposent STRICTEMENT au sol */}
      {[-0.63, 0.63].map((lx, lxi) =>
        [-0.38, 0.38].map((lz, lzi) => (
          <group key={`island-leg-${lxi}-${lzi}`} position={[lx, 0, lz]}>
            {/* Montant vertical du pied de table (du sol y=0 jusqu'au plateau y=0.85) */}
            <mesh position={[0, 0.425, 0]} castShadow receiveShadow>
              <boxGeometry args={[0.075, 0.85, 0.075]} />
              <meshStandardMaterial color="#a16207" roughness={0.62} />
            </mesh>
            {/* Bague de finition décorative en laiton brossé */}
            <mesh position={[0, 0.05, 0]}>
              <boxGeometry args={[0.082, 0.02, 0.082]} />
              <meshStandardMaterial color="#d97706" metalness={0.85} roughness={0.25} />
            </mesh>
            {/* Patin / sabot de protection niveleur au sol à y = 0 */}
            <mesh position={[0, 0.012, 0]}>
              <cylinderGeometry args={[0.042, 0.046, 0.024, 16]} />
              <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.4} />
            </mesh>
          </group>
        ))
      )}

      {/* 3. Caisson suspendu à mi-hauteur avec tiroirs (dégagé du sol de 38 cm !) */}
      <mesh position={[0, 0.625, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.22, 0.42, 0.74]} />
        <meshStandardMaterial color="#b47846" roughness={0.65} />
      </mesh>

      {/* Façades de 4 tiroirs à fermeture douce avec poignées en laiton moleté */}
      {[-0.30, 0.30].map((tx, xIdx) => (
        <group key={`drawer-col-${xIdx}`}>
          {[0.72, 0.52].map((ty, yIdx) => (
            <group key={`drawer-${xIdx}-${yIdx}`}>
              {/* Façade de tiroir */}
              <mesh position={[tx, ty, 0.375]} castShadow>
                <boxGeometry args={[0.56, 0.18, 0.015]} />
                <meshStandardMaterial color="#9a6235" roughness={0.6} />
              </mesh>
              {/* Poignée barre en laiton brossé */}
              <mesh position={[tx, ty, 0.392]} rotation={[0, 0, Math.PI * 0.5]}>
                <cylinderGeometry args={[0.006, 0.006, 0.16, 12]} />
                <meshStandardMaterial color="#d97706" metalness={0.88} roughness={0.2} />
              </mesh>
              {/* 2 Plots de fixation de poignée */}
              {[-0.07, 0.07].map((px, pIdx) => (
                <mesh key={`post-${pIdx}`} position={[tx + px, ty, 0.385]}>
                  <cylinderGeometry args={[0.005, 0.005, 0.012, 8]} />
                  <meshStandardMaterial color="#b45309" metalness={0.85} roughness={0.25} />
                </mesh>
              ))}
            </group>
          ))}
        </group>
      ))}

      {/* 4. Étagère basse à claire-voie en lattes de chêne (surélevée à y = 0.16m, bien visible au-dessus du sol) */}
      <mesh position={[0, 0.16, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.22, 0.02, 0.72]} />
        <meshStandardMaterial color="#854d0e" roughness={0.7} />
      </mesh>
      {/* Lattes ajourées pour ranger cocottes et casseroles */}
      {[-0.28, -0.14, 0, 0.14, 0.28].map((lz, li) => (
        <mesh key={`shelf-slat-${li}`} position={[0, 0.175, lz]} castShadow>
          <boxGeometry args={[1.20, 0.012, 0.08]} />
          <meshStandardMaterial color="#a16207" roughness={0.65} />
        </mesh>
      ))}
    </group>
  );
};
const publicModelIds = {
  "wp-voiture": "AutomobileCarEngineBay",
  "wp-batterie-automobile": "CarBattery12V",
  "wp-generateur-secours": "EmergencyGenerator12V",
  "technical-bench": "LaboratoryTechnicalBench",
  "socket": "VictoriaVRCockpitDock",
  "wp-sac-voyageur-42l": "TechnicalTravelBackpack42L",
  "wp-ordinateur-portable": "FacilitatorLaptop",
  "wp-gourde-isotherme": "ThermalWaterBottle",
  "wp-carton-oversized": "ShippingCardboardBox",
  "table": "KitchenIslandWorkbench"
};
function resolvePublicModel(entity: EntitySpec) {
 const raw=entity.visuals?.assetId||'';
 const key=(raw in publicModelIds?raw:resolveCanonicalAssetId(raw,entity.visuals?.modelUrl)||raw) as keyof typeof publicModelIds;
 const models: Record<string,React.ComponentType<any>>={AutomobileCarEngineBay,CarBattery12V,EmergencyGenerator12V,LaboratoryTechnicalBench,VictoriaVRCockpitDock,TechnicalTravelBackpack42L,FacilitatorLaptop,ThermalWaterBottle,ShippingCardboardBox,KitchenIslandWorkbench};
 return models[publicModelIds[key]];
}
export function hasDetailedSimulationModel(entity:EntitySpec){return !!resolvePublicModel(entity);}
export const DetailedSimulationModel: React.FC<{entity:EntitySpec;isSelected?:boolean;isHovered?:boolean}> = props => {const Model=resolvePublicModel(props.entity);return Model?<Model {...props}/>:null;};
