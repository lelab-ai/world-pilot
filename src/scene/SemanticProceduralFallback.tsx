// src/scene/SemanticProceduralFallback.tsx
// Moteur procédural sémantique haute-fidélité de secours (Universal Semantic Fallback Engine).
// Synthétise des objets 3D réalistes (matériaux PBR, géométries riches, biseaux et détails physiques)
// directement dans l'application pour n'importe quel objet créé par prompt ou en cas d'absence/échec de GLB externe.

import React from 'react';
import * as THREE from 'three';
import { RoundedBox } from '@react-three/drei';
import type { EntitySpec } from '../core/types';

interface SemanticProps {
  entity: EntitySpec;
  isSelected?: boolean;
  isHovered?: boolean;
}

/**
 * Détecte l'archétype fonctionnel et physique d'une entité à partir de son nom et métadonnées.
 */
function getEntityArchetype(entity: EntitySpec): {
  type: 'table' | 'chair' | 'pedestal' | 'appliance' | 'screen' | 'container' | 'vessel' | 'dish' | 'tool' | 'generic';
  materialHint: 'marble' | 'wood' | 'glass' | 'metal' | 'plastic' | 'ceramic' | 'default';
} {
  const text = `${entity.name || ''} ${entity.visuals?.assetId || ''} ${entity.id || ''}`.toLowerCase();

  // Détection du matériau suggéré
  let materialHint: 'marble' | 'wood' | 'glass' | 'metal' | 'plastic' | 'ceramic' | 'default' = 'default';
  if (text.includes('marbre') || text.includes('marble')) materialHint = 'marble';
  else if (text.includes('bois') || text.includes('chêne') || text.includes('chene') || text.includes('noyer') || text.includes('hêtre') || text.includes('wood')) materialHint = 'wood';
  else if (text.includes('verre') || text.includes('glass') || text.includes('cristal')) materialHint = 'glass';
  else if (text.includes('inox') || text.includes('acier') || text.includes('métal') || text.includes('metal') || text.includes('chrome') || text.includes('alu')) materialHint = 'metal';
  else if (text.includes('céramique') || text.includes('ceramique') || text.includes('porcelaine') || text.includes('grès') || text.includes('gres')) materialHint = 'ceramic';
  else if (text.includes('plastique') || text.includes('résine')) materialHint = 'plastic';

  // 0. Socles d'exposition, Piédestaux, Podiums, Stèles & Vitrines
  if (
    text.includes('socle') ||
    text.includes('podium') ||
    text.includes('piédestal') ||
    text.includes('piedestal') ||
    text.includes('pedestal') ||
    text.includes('estrade') ||
    text.includes('stèle') ||
    text.includes('stele') ||
    text.includes('vitrine') ||
    text.includes('présentoir') ||
    text.includes('presentoir') ||
    text.includes('totem') ||
    text.includes('pilier')
  ) {
    return { type: 'pedestal', materialHint };
  }

  // 1. Mobilier de support : Tables, Bureaux, Plans de travail, Comptoirs
  if (
    text.includes('table') ||
    text.includes('bureau') ||
    text.includes('desk') ||
    text.includes('plan de travail') ||
    text.includes('etabli') ||
    text.includes('établi') ||
    text.includes('comptoir') ||
    text.includes('ilot') ||
    text.includes('îlot') ||
    text.includes('buffet') ||
    text.includes('meuble') ||
    text.includes('support')
  ) {
    return { type: 'table', materialHint };
  }

  // 2. Assises : Chaises, Fauteuils, Tabourets, Bancs
  if (
    text.includes('chaise') ||
    text.includes('chair') ||
    text.includes('fauteuil') ||
    text.includes('tabouret') ||
    text.includes('stool') ||
    text.includes('seat') ||
    text.includes('banc') ||
    text.includes('pouf') ||
    text.includes('sofa')
  ) {
    return { type: 'chair', materialHint };
  }

  // 3. Électroménager, Machines & Équipements de laboratoire/cuisine
  if (
    text.includes('four') ||
    text.includes('oven') ||
    text.includes('micro-ondes') ||
    text.includes('machine') ||
    text.includes('robot') ||
    text.includes('mixeur') ||
    text.includes('blender') ||
    text.includes('toaster') ||
    text.includes('frigo') ||
    text.includes('refrigerateur') ||
    text.includes('appareil') ||
    text.includes('bruleur') ||
    text.includes('brûleur') ||
    text.includes('pompe')
  ) {
    return { type: 'appliance', materialHint };
  }

  // 4. Écrans, Moniteurs, Ordinateurs, Bornes
  if (
    text.includes('ecran') ||
    text.includes('écran') ||
    text.includes('screen') ||
    text.includes('moniteur') ||
    text.includes('monitor') ||
    text.includes('tv') ||
    text.includes('ordinateur') ||
    text.includes('terminal') ||
    text.includes('borne') ||
    text.includes('tablette') ||
    text.includes('display')
  ) {
    return { type: 'screen', materialHint };
  }

  // 5. Contenants, Boîtes, Caisses, Cartons
  if (
    text.includes('boite') ||
    text.includes('boîte') ||
    text.includes('box') ||
    text.includes('caisse') ||
    text.includes('crate') ||
    text.includes('carton') ||
    text.includes('kit') ||
    text.includes('bac') ||
    text.includes('panier') ||
    text.includes('coffre') ||
    text.includes('valise')
  ) {
    return { type: 'container', materialHint };
  }

  // 6. Flacons, Bouteilles, Fioles, Vases
  if (
    text.includes('bouteille') ||
    text.includes('bottle') ||
    text.includes('flacon') ||
    text.includes('fiole') ||
    text.includes('pot') ||
    text.includes('bocal') ||
    text.includes('vase') ||
    text.includes('carafe')
  ) {
    return { type: 'vessel', materialHint };
  }

  // 7. Vaisselle, Bols, Saladiers, Plats, Plateaux
  if (
    text.includes('saladier') ||
    text.includes('bol') ||
    text.includes('bowl') ||
    text.includes('assiette') ||
    text.includes('plat') ||
    text.includes('plateau') ||
    text.includes('tray') ||
    text.includes('tasse') ||
    text.includes('verre') ||
    text.includes('mug') ||
    text.includes('coupelle')
  ) {
    return { type: 'dish', materialHint };
  }

  // 8. Outils, Ustensiles, Accessoires
  if (
    text.includes('outil') ||
    text.includes('tool') ||
    text.includes('cle') ||
    text.includes('clé') ||
    text.includes('tournevis') ||
    text.includes('marteau') ||
    text.includes('spatule') ||
    text.includes('fouet') ||
    text.includes('couteau') ||
    text.includes('cuillere') ||
    text.includes('cuillère') ||
    text.includes('spoon') ||
    text.includes('louche') ||
    text.includes('ladle') ||
    text.includes('ecumoire') ||
    text.includes('écumoire') ||
    text.includes('rouleau') ||
    text.includes('pince') ||
    text.includes('règle') ||
    text.includes('regle')
  ) {
    return { type: 'tool', materialHint };
  }

  return { type: 'generic', materialHint };
}

// ============================================================================
// COMPOSANTS PROCÉDURAUX PAR ARCHÉTYPE
// ============================================================================

/**
 * Table procédurale avec plateau noble, chanfrein, piétement à 4 pieds et patins.
 */
const ProceduralTable: React.FC<SemanticProps & { materialHint: string }> = ({ materialHint, isSelected, isHovered }) => {
  let topColor = '#cbd5e1';
  let roughness = 0.65;
  let metalness = 0.05;
  let clearcoat = 0.0;

  if (materialHint === 'marble') {
    topColor = '#e2e8f0';
    roughness = 0.4;
    clearcoat = 0.15;
  } else if (materialHint === 'wood') {
    topColor = '#a16207';
    roughness = 0.65;
    clearcoat = 0.0;
  } else if (materialHint === 'metal') {
    topColor = '#64748b';
    metalness = 0.85;
    roughness = 0.35;
    clearcoat = 0.0;
  }

  return (
    <group position={[0, 0, 0]}>
      {/* Plateau principal */}
      <mesh position={[0, 0.88, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 0.05, 0.85]} />
        <meshPhysicalMaterial
          color={topColor}
          roughness={roughness}
          metalness={metalness}
          clearcoat={clearcoat}
        />
      </mesh>
      {/* Cadre de ceinture sous plateau */}
      <mesh position={[0, 0.83, 0]} castShadow>
        <boxGeometry args={[1.42, 0.04, 0.77]} />
        <meshStandardMaterial color="#334155" roughness={0.4} metalness={0.7} />
      </mesh>
      {/* 4 Pieds massifs */}
      {[-0.66, 0.66].map((px, xi) =>
        [-0.34, 0.34].map((pz, zi) => (
          <group key={`leg-${xi}-${zi}`} position={[px, 0.41, pz]}>
            <mesh castShadow>
              <boxGeometry args={[0.065, 0.82, 0.065]} />
              <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.8} />
            </mesh>
            <mesh position={[0, -0.40, 0]}>
              <cylinderGeometry args={[0.035, 0.04, 0.02, 16]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
            </mesh>
          </group>
        ))
      )}
      {(isSelected || isHovered) && (
        <mesh position={[0, 0.906, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.52, 0.87]} />
          <meshBasicMaterial color={isSelected ? '#f59e0b' : '#38bdf8'} wireframe transparent opacity={0.6} />
        </mesh>
      )}
    </group>
  );
};

/**
 * Chaise / Siège ergonomique procédural.
 */
const ProceduralChair: React.FC<SemanticProps> = ({ isSelected }) => {
  return (
    <group position={[0, 0, 0]}>
      {/* Assise rembourrée galbée */}
      <mesh position={[0, 0.46, 0]} castShadow>
        <boxGeometry args={[0.46, 0.06, 0.44]} />
        <meshStandardMaterial color="#374151" roughness={0.7} />
      </mesh>
      {/* Dossier galbé */}
      <mesh position={[0, 0.76, -0.19]} rotation={[-0.08, 0, 0]} castShadow>
        <boxGeometry args={[0.44, 0.36, 0.04]} />
        <meshStandardMaterial color="#4b5563" roughness={0.7} />
      </mesh>
      {/* 4 Pieds fuselés */}
      {[-0.18, 0.18].map((px, xi) =>
        [-0.17, 0.17].map((pz, zi) => (
          <mesh key={`chair-leg-${xi}-${zi}`} position={[px, 0.22, pz]} castShadow>
            <cylinderGeometry args={[0.014, 0.022, 0.44, 12]} />
            <meshStandardMaterial color="#111827" metalness={0.8} roughness={0.25} />
          </mesh>
        ))
      )}
      {isSelected && (
        <mesh position={[0, 0.495, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.48, 0.46]} />
          <meshBasicMaterial color="#f59e0b" wireframe transparent opacity={0.6} />
        </mesh>
      )}
    </group>
  );
};

/**
 * Appareil électroménager / machine de laboratoire avec porte vitrée, commandes et LED.
 */
const ProceduralAppliance: React.FC<SemanticProps> = ({ isSelected, isHovered }) => {
  return (
    <group position={[0, 0.25, 0]}>
      {/* Caisson principal en métal brossé */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.54, 0.46, 0.44]} />
        <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Porte frontale vitrée */}
      <mesh position={[0, -0.02, 0.225]} castShadow>
        <boxGeometry args={[0.46, 0.32, 0.015]} />
        <meshPhysicalMaterial color="#0f172a" roughness={0.1} clearcoat={1} transparent opacity={0.85} />
      </mesh>
      {/* Poignée de porte horizontale */}
      <mesh position={[0, 0.11, 0.25]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.007, 0.007, 0.34, 12]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.15} />
      </mesh>
      {(isSelected || isHovered) && (
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.56, 0.48, 0.46]} />
          <meshBasicMaterial color={isSelected ? '#f59e0b' : '#38bdf8'} wireframe transparent opacity={0.6} />
        </mesh>
      )}
      {/* Panneau de commande supérieur */}
      <mesh position={[0, 0.17, 0.222]}>
        <boxGeometry args={[0.48, 0.07, 0.01]} />
        <meshStandardMaterial color="#1e293b" roughness={0.5} />
      </mesh>
      {/* Bouton rotatif */}
      <mesh position={[-0.14, 0.17, 0.23]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.012, 16]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Afficheur digital LED lumineux */}
      <mesh position={[0.08, 0.17, 0.23]}>
        <planeGeometry args={[0.12, 0.035]} />
        <meshBasicMaterial color="#0284c7" />
      </mesh>
    </group>
  );
};

/**
 * Écran / Moniteur / Borne avec pied design et dalle luminescente.
 */
const ProceduralScreen: React.FC<SemanticProps> = ({ isSelected, isHovered }) => {
  return (
    <group position={[0, 0.28, 0]}>
      {/* Dalle écran plate avec liseré fin */}
      <mesh position={[0, 0.14, 0]} castShadow>
        <boxGeometry args={[0.66, 0.42, 0.025]} />
        <meshStandardMaterial color="#0f172a" roughness={0.2} metalness={0.8} />
      </mesh>
      {/* Surface luminescente de l'écran */}
      <mesh position={[0, 0.14, 0.014]}>
        <planeGeometry args={[0.63, 0.39]} />
        <meshBasicMaterial color="#0284c7" />
      </mesh>
      {/* Mât support vertical */}
      <mesh position={[0, -0.06, -0.04]} castShadow>
        <cylinderGeometry args={[0.018, 0.022, 0.24, 16]} />
        <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Pied socle plat circulaire */}
      <mesh position={[0, -0.17, -0.04]} receiveShadow>
        <cylinderGeometry args={[0.13, 0.14, 0.015, 24]} />
        <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.3} />
      </mesh>
      {(isSelected || isHovered) && (
        <mesh position={[0, 0.14, 0]}>
          <boxGeometry args={[0.68, 0.44, 0.04]} />
          <meshBasicMaterial color={isSelected ? '#f59e0b' : '#38bdf8'} wireframe transparent opacity={0.6} />
        </mesh>
      )}
    </group>
  );
};

/**
 * Caisse / Boîte / Conteneur de rangement industriel ou logistique.
 */
const ProceduralContainer: React.FC<SemanticProps & { materialHint: string }> = ({ materialHint }) => {
  const isWood = materialHint === 'wood';
  const bodyColor = isWood ? '#b45309' : '#0284c7';

  return (
    <group position={[0, 0.16, 0]}>
      {/* Corps du bac / caisse */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.48, 0.32, 0.34]} />
        <meshStandardMaterial color={bodyColor} roughness={0.5} />
      </mesh>
      {/* Bordure renforcée supérieure */}
      <mesh position={[0, 0.155, 0]}>
        <boxGeometry args={[0.50, 0.025, 0.36]} />
        <meshStandardMaterial color="#1e293b" roughness={0.4} />
      </mesh>
      {/* Poignées latérales évidées */}
      {[-0.245, 0.245].map((hx, hi) => (
        <mesh key={`handle-${hi}`} position={[hx, 0.05, 0]}>
          <boxGeometry args={[0.01, 0.04, 0.12]} />
          <meshStandardMaterial color="#0f172a" roughness={0.8} />
        </mesh>
      ))}
      {/* Porte-étiquette frontale */}
      <mesh position={[0, 0.02, 0.173]}>
        <planeGeometry args={[0.12, 0.07]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.9} />
      </mesh>
    </group>
  );
};

/**
 * Flacon / Bouteille / Récipient étanche.
 */
const ProceduralVessel: React.FC<SemanticProps> = () => {
  return (
    <group position={[0, 0.15, 0]}>
      {/* Fût cylindrique */}
      <mesh castShadow>
        <cylinderGeometry args={[0.065, 0.065, 0.22, 24]} />
        <meshPhysicalMaterial color="#38bdf8" roughness={0.15} transmission={0.7} transparent opacity={0.85} />
      </mesh>
      {/* Épaulement conique */}
      <mesh position={[0, 0.13, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.065, 0.05, 24]} />
        <meshPhysicalMaterial color="#38bdf8" roughness={0.15} transmission={0.7} transparent opacity={0.85} />
      </mesh>
      {/* Goulot étroit */}
      <mesh position={[0, 0.17, 0]} castShadow>
        <cylinderGeometry args={[0.024, 0.024, 0.04, 20]} />
        <meshPhysicalMaterial color="#38bdf8" roughness={0.15} transmission={0.7} transparent opacity={0.85} />
      </mesh>
      {/* Bouchon en liège ou métal */}
      <mesh position={[0, 0.20, 0]}>
        <cylinderGeometry args={[0.026, 0.026, 0.025, 18]} />
        <meshStandardMaterial color="#b45309" roughness={0.8} />
      </mesh>
    </group>
  );
};

/**
 * Saladier / Bol / Récipient évasé.
 */
const ProceduralDish: React.FC<SemanticProps> = () => {
  return (
    <group position={[0, 0.08, 0]}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.17, 0.09, 0.14, 28, 1, true]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.2} side={THREE.DoubleSide} />
      </mesh>
      {/* Fond du bol */}
      <mesh position={[0, -0.068, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 0.015, 24]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.3} />
      </mesh>
      {/* Rebord supérieur arrondi */}
      <mesh position={[0, 0.07, 0]}>
        <torusGeometry args={[0.17, 0.007, 12, 28]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.3} />
      </mesh>
    </group>
  );
};

/**
 * Outil / Ustensile ergonomique avec manche bi-matière et tête métallique.
 */
const ProceduralTool: React.FC<SemanticProps & { materialHint?: string }> = ({ entity, materialHint, isSelected, isHovered }) => {
  const text = `${entity?.name || ''} ${entity?.visuals?.assetId || ''} ${entity?.id || ''}`.toLowerCase();
  const isSpoon = text.includes('cuillere') || text.includes('cuillère') || text.includes('spoon');
  const isSpatula = text.includes('spatule') || text.includes('spatula') || text.includes('maryse');
  const isRollingPin = text.includes('rouleau');
  const isWoodMaterial = materialHint === 'wood' || text.includes('bois');

  if (isSpoon) {
    const isMetalSpoon = text.includes('argent') || text.includes('inox') || text.includes('metal') || text.includes('métal');
    return (
      <group position={[0, 0.012, 0]} rotation={[0.04, -0.35, 0.02]}>
        <mesh position={[0, 0.008, -0.06]} rotation={[-0.04, 0, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.007, 0.009, 0.22, 16]} />
          <meshStandardMaterial color={isMetalSpoon ? "#cbd5e1" : "#c28442"} roughness={isMetalSpoon ? 0.2 : 0.68} metalness={isMetalSpoon ? 0.95 : 0.02} />
        </mesh>
        <mesh position={[0, 0.012, -0.165]} castShadow>
          <sphereGeometry args={[0.010, 16, 16]} />
          <meshStandardMaterial color={isMetalSpoon ? "#cbd5e1" : "#b47535"} roughness={isMetalSpoon ? 0.2 : 0.7} metalness={isMetalSpoon ? 0.95 : 0.02} />
        </mesh>
        <mesh position={[0, 0.004, 0.05]} rotation={[0.02, 0, 0]} castShadow>
          <cylinderGeometry args={[0.011, 0.008, 0.03, 16]} />
          <meshStandardMaterial color={isMetalSpoon ? "#cbd5e1" : "#c28442"} roughness={isMetalSpoon ? 0.2 : 0.68} metalness={isMetalSpoon ? 0.95 : 0.02} />
        </mesh>
        <mesh position={[0, 0.003, 0.095]} scale={[1.1, 0.45, 1.45]} castShadow receiveShadow>
          <sphereGeometry args={[0.026, 24, 20, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
          <meshStandardMaterial color={isMetalSpoon ? "#cbd5e1" : "#bf7e3b"} roughness={isMetalSpoon ? 0.2 : 0.65} metalness={isMetalSpoon ? 0.95 : 0.02} />
        </mesh>
        {(isSelected || isHovered) && (
          <mesh position={[0, 0.008, -0.01]} rotation={[-0.04, 0, 0]}>
            <boxGeometry args={[0.07, 0.025, 0.36]} />
            <meshBasicMaterial color={isSelected ? "#f59e0b" : "#38bdf8"} wireframe transparent opacity={0.5} />
          </mesh>
        )}
      </group>
    );
  }

  if (isSpatula) {
    return (
      <group position={[0, 0.015, 0]} rotation={[0.02, -0.25, 0.01]}>
        {/* Manche de spatule */}
        <mesh position={[0, 0.008, -0.07]} rotation={[-0.03, 0, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.008, 0.01, 0.20, 16]} />
          <meshStandardMaterial color={isWoodMaterial ? "#c28442" : "#ea580c"} roughness={isWoodMaterial ? 0.68 : 0.4} metalness={isWoodMaterial ? 0.02 : 0.1} />
        </mesh>
        {/* Palette biseautée et ajourée */}
        <mesh position={[0, 0.005, 0.09]} rotation={[-0.05, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.055, 0.008, 0.12]} />
          <meshStandardMaterial color={isWoodMaterial ? "#bf7e3b" : "#94a3b8"} roughness={isWoodMaterial ? 0.65 : 0.2} metalness={isWoodMaterial ? 0.02 : 0.85} />
        </mesh>
        {(isSelected || isHovered) && (
          <mesh position={[0, 0.007, 0.01]}>
            <boxGeometry args={[0.075, 0.02, 0.34]} />
            <meshBasicMaterial color={isSelected ? "#f59e0b" : "#38bdf8"} wireframe transparent opacity={0.5} />
          </mesh>
        )}
      </group>
    );
  }

  if (isRollingPin) {
    return (
      <group position={[0, 0.025, 0]} rotation={[0, 0, Math.PI / 4]}>
        {/* Rouleau central en bois de hêtre */}
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.03, 0.03, 0.26, 24]} />
          <meshStandardMaterial color="#c28442" roughness={0.65} metalness={0.02} />
        </mesh>
        {/* Poignées latérales tournées */}
        {[-0.17, 0.17].map((pz, idx) => (
          <mesh key={idx} position={[0, 0, pz]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.012, 0.016, 0.08, 16]} />
            <meshStandardMaterial color="#b47535" roughness={0.7} />
          </mesh>
        ))}
        {(isSelected || isHovered) && (
          <mesh>
            <boxGeometry args={[0.08, 0.08, 0.44]} />
            <meshBasicMaterial color={isSelected ? "#f59e0b" : "#38bdf8"} wireframe transparent opacity={0.5} />
          </mesh>
        )}
      </group>
    );
  }

  // Outil générique (tournevis / clé / marteau / outil mécanique)
  const handleColor = isWoodMaterial ? "#c28442" : "#ea580c";
  const handleRoughness = isWoodMaterial ? 0.65 : 0.5;

  return (
    <group position={[0, 0.03, 0]} rotation={[0, 0, Math.PI / 4]}>
      {/* Manche ergonomique */}
      <mesh position={[0, -0.08, 0]} castShadow>
        <cylinderGeometry args={[0.016, 0.02, 0.16, 16]} />
        <meshStandardMaterial color={handleColor} roughness={handleRoughness} />
      </mesh>
      {/* Grip caoutchouc sombre (si non-bois) */}
      {!isWoodMaterial && (
        <mesh position={[0, -0.08, 0]}>
          <cylinderGeometry args={[0.018, 0.018, 0.07, 16]} />
          <meshStandardMaterial color="#1e293b" roughness={0.8} />
        </mesh>
      )}
      {/* Tige / Tête métallique */}
      <mesh position={[0, 0.09, 0]} castShadow>
        <cylinderGeometry args={[0.006, 0.006, 0.18, 12]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.95} roughness={0.15} />
      </mesh>
      <mesh position={[0, 0.18, 0]} castShadow>
        <boxGeometry args={[0.035, 0.02, 0.01]} />
        <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.2} />
      </mesh>
      {(isSelected || isHovered) && (
        <mesh position={[0, 0.05, 0]}>
          <boxGeometry args={[0.06, 0.30, 0.06]} />
          <meshBasicMaterial color={isSelected ? "#f59e0b" : "#38bdf8"} wireframe transparent opacity={0.5} />
        </mesh>
      )}
    </group>
  );
};

/**
 * Piédestal / Socle d'exposition de galerie & showroom (marbre ou titane brossé, joint LED lumineux, couronne vitrée).
 */
const ProceduralPedestal: React.FC<SemanticProps & { materialHint: string }> = ({ entity, materialHint, isSelected, isHovered }) => {
  const isMarble = materialHint === 'marble';
  const baseColor = entity.visuals?.color || (isMarble ? '#f1f5f9' : '#1e293b');
  const accentColor = isSelected ? '#f59e0b' : isHovered ? '#60a5fa' : '#38bdf8';

  return (
    <group position={[0, 0, 0]}>
      {/* Socle d'assise chanfreiné en titane sombre */}
      <mesh position={[0, 0.04, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.38, 0.44, 0.08, 32]} />
        <meshPhysicalMaterial color="#0f172a" metalness={0.85} roughness={0.22} clearcoat={0.6} />
      </mesh>
      {/* Anneau lumineux d'ancrage au sol */}
      <mesh position={[0, 0.082, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.37, 0.395, 32]} />
        <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={2.2} />
      </mesh>
      {/* Fût architectural sculpté */}
      <RoundedBox args={[0.56, 0.78, 0.56]} radius={0.06} smoothness={6} position={[0, 0.47, 0]} castShadow receiveShadow>
        <meshPhysicalMaterial
          color={baseColor}
          metalness={isMarble ? 0.08 : 0.65}
          roughness={isMarble ? 0.18 : 0.24}
          clearcoat={0.9}
          clearcoatRoughness={0.08}
        />
      </RoundedBox>
      {/* Couronne supérieure en verre saphir dépoli & cadre platine */}
      <RoundedBox args={[0.60, 0.04, 0.60]} radius={0.015} smoothness={4} position={[0, 0.88, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#cbd5e1" metalness={0.92} roughness={0.14} />
      </RoundedBox>
      <mesh position={[0, 0.905, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.20, 0.24, 32]} />
        <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={2.5} />
      </mesh>
    </group>
  );
};

/**
 * Module universel de haute technologie (Fallback intelligent pour tout objet non répertorié).
 * Remplace tout cube ou sphère brute par un module élégant avec chanfrein, plaque titane, LED et badge.
 */
const UniversalHighTechModule: React.FC<SemanticProps> = ({ entity, isSelected, isHovered }) => {
  const customColor = entity.visuals?.color && entity.visuals.color.toLowerCase() !== '#ffffff' && entity.visuals.color.toLowerCase() !== '#cccccc'
    ? entity.visuals.color
    : '#1e293b';
  return (
    <group position={[0, 0.22, 0]}>
      {/* Boîtier principal arrondi biseauté à vernis clearcoat */}
      <RoundedBox args={[0.48, 0.36, 0.36]} radius={0.045} smoothness={6} castShadow receiveShadow>
        <meshPhysicalMaterial color={customColor} roughness={0.22} metalness={0.65} clearcoat={0.9} clearcoatRoughness={0.08} />
      </RoundedBox>

      {/* Plaque d'accentuation supérieure en alliage brossé */}
      <mesh position={[0, 0.182, 0]}>
        <boxGeometry args={[0.42, 0.006, 0.30]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.92} roughness={0.16} />
      </mesh>

      {/* Diode LED luminescente avec lueur ambiante */}
      <mesh position={[-0.16, 0.186, -0.10]}>
        <cylinderGeometry args={[0.014, 0.014, 0.008, 16]} />
        <meshStandardMaterial color={isSelected ? '#f59e0b' : '#38bdf8'} emissive={isSelected ? '#f59e0b' : '#0ea5e9'} emissiveIntensity={2.5} />
      </mesh>

      {/* Grilles d'aération latérales */}
      {[-0.243, 0.243].map((gx, gi) => (
        <group key={`vent-${gi}`} position={[gx, 0, 0]}>
          {[-0.06, 0, 0.06].map((vy, vi) => (
            <mesh key={`slot-${vi}`} position={[0, vy, 0]}>
              <boxGeometry args={[0.004, 0.018, 0.22]} />
              <meshStandardMaterial color="#0f172a" roughness={0.8} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Badge d'identification technique en façade */}
      <mesh position={[0, 0, 0.183]}>
        <planeGeometry args={[0.34, 0.10]} />
        <meshStandardMaterial color="#0f172a" roughness={0.35} metalness={0.5} />
      </mesh>
      {/* Filet lumineux autour du badge */}
      <mesh position={[0, 0, 0.184]}>
        <planeGeometry args={[0.32, 0.08]} />
        <meshBasicMaterial color="#38bdf8" wireframe />
      </mesh>

      {/* Surbrillance de sélection / survol */}
      {(isSelected || isHovered) && (
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.50, 0.38, 0.38]} />
          <meshBasicMaterial
            color={isSelected ? '#f59e0b' : '#38bdf8'}
            wireframe
            transparent
            opacity={0.65}
          />
        </mesh>
      )}
    </group>
  );
};

// ============================================================================
// COMPOSANT PRINCIPAL EXPORTÉ
// ============================================================================

export const SemanticProceduralFallback: React.FC<SemanticProps> = (props) => {
  const archetype = getEntityArchetype(props.entity);

  switch (archetype.type) {
    case 'pedestal':
      return <ProceduralPedestal {...props} materialHint={archetype.materialHint} />;
    case 'table':
      return <ProceduralTable {...props} materialHint={archetype.materialHint} />;
    case 'chair':
      return <ProceduralChair {...props} />;
    case 'appliance':
      return <ProceduralAppliance {...props} />;
    case 'screen':
      return <ProceduralScreen {...props} />;
    case 'container':
      return <ProceduralContainer {...props} materialHint={archetype.materialHint} />;
    case 'vessel':
      return <ProceduralVessel {...props} />;
    case 'dish':
      return <ProceduralDish {...props} />;
    case 'tool':
      return <ProceduralTool {...props} materialHint={archetype.materialHint} />;
    case 'generic':
    default:
      return <UniversalHighTechModule {...props} />;
  }
};
