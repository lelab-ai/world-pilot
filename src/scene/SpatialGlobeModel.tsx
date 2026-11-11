import React, { useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { EntitySpec } from '../core/types';
import { useWorldStore } from '../engine/store';
import { playAudioFx } from '../engine/evaluator';

interface GeoHotspot {
  id: string;
  name: string;
  lat: number;
  lon: number;
  url: string;
}

const GEO_HOTSPOTS: GeoHotspot[] = [
  { id: 'paris', name: 'Paris (France)', lat: 48.85, lon: 2.35, url: 'https://www.openstreetmap.org/export/embed.html?bbox=2.25%2C48.81%2C2.42%2C48.90&layer=mapnik&marker=48.8566%2C2.3522' },
  { id: 'tokyo', name: 'Tokyo (Japon)', lat: 35.68, lon: 139.69, url: 'https://www.openstreetmap.org/export/embed.html?bbox=139.65%2C35.65%2C139.75%2C35.72&layer=mapnik&marker=35.6895%2C139.6917' },
  { id: 'newyork', name: 'New York (USA)', lat: 40.71, lon: -74.00, url: 'https://www.openstreetmap.org/export/embed.html?bbox=-74.05%2C40.68%2C-73.90%2C40.80&layer=mapnik&marker=40.7128%2C-74.0060' },
  { id: 'cairo', name: 'Le Caire (Égypte)', lat: 30.04, lon: 31.23, url: 'https://www.openstreetmap.org/export/embed.html?bbox=31.18%2C29.98%2C31.32%2C30.08&layer=mapnik&marker=30.0444%2C31.2357' },
  { id: 'sf', name: 'San Francisco (Silicon Valley)', lat: 37.77, lon: -122.41, url: 'https://www.openstreetmap.org/export/embed.html?bbox=-122.52%2C37.70%2C-122.35%2C37.82&layer=mapnik&marker=37.7749%2C-122.4194' },
  { id: 'sydney', name: 'Sydney (Australie)', lat: -33.86, lon: 151.20, url: 'https://www.openstreetmap.org/export/embed.html?bbox=151.15%2C-33.92%2C151.28%2C-33.82&layer=mapnik&marker=-33.8688%2C151.2093' }
];

const getHotspotPos = (lat: number, lon: number): [number, number, number] => {
  const radLat = (lat * Math.PI) / 180;
  const radLon = (lon * Math.PI) / 180;
  const R = 0.186;
  return [
    R * Math.cos(radLat) * Math.sin(radLon),
    R * Math.sin(radLat),
    R * Math.cos(radLat) * Math.cos(radLon)
  ];
};

export const SpatialGlobeModel: React.FC<{ entity: EntitySpec }> = ({ entity }) => {
  const openWebModal = useWorldStore(state => state.openWebModal);
  const [isHovered, setIsHovered] = useState(false);
  const [hoveredHotspot, setHoveredHotspot] = useState<GeoHotspot | null>(null);
  const groupRef = useRef<THREE.Group>(null);
  const sphereRef = useRef<THREE.Group>(null);

  const webCap = entity.capabilities.find(c => c.type === 'web_screen');
  const eduCap = entity.capabilities.find(c => c.type === 'educational');

  const title = entity.name || 'Globe Terrestre & Atlas Mondial';
  const defaultUrl = 'https://www.openstreetmap.org/export/embed.html?bbox=-180%2C-65%2C180%2C80&layer=mapnik';
  const targetUrl = webCap?.url || eduCap?.url || defaultUrl;
  const entityPos = entity.capabilities.find(c => c.type === 'transform')?.position;

  const handleHotspotClick = (e: any, spot: GeoHotspot) => {
    e.stopPropagation();
    useWorldStore.getState().setSpatialContext(entity.id, null);
    if (entityPos) {
      useWorldStore.getState().setCameraFocusTarget([entityPos.x, entityPos.y, entityPos.z]);
    }
    playAudioFx('chime', entityPos);
    openWebModal(spot.url, `🌍 ${spot.name} · Atlas`);
  };

  const handleClick = (e: any) => {
    e.stopPropagation();
    useWorldStore.getState().setSpatialContext(entity.id, null);
    if (entityPos) {
      useWorldStore.getState().setCameraFocusTarget([entityPos.x, entityPos.y, entityPos.z]);
    }
    playAudioFx('chime', entityPos);
    openWebModal(targetUrl, `🌍 ${title}`);
  };

  useFrame((_, delta) => {
    if (groupRef.current) {
      const targetY = isHovered ? 0.025 : 0;
      groupRef.current.position.y += (targetY - groupRef.current.position.y) * 0.15;
    }

    if (sphereRef.current) {
      // Continuous gentle planetary rotation
      sphereRef.current.rotation.y += delta * (isHovered ? 1.2 : 0.4);
    }
  });

  return (
    <group
      ref={groupRef}
      onClick={handleClick}
      onPointerOver={(e) => { e.stopPropagation(); setIsHovered(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setIsHovered(false); document.body.style.cursor = 'auto'; }}
    >
      {/* Turned Mahogany Wooden Base Stand */}
      <mesh position={[0, 0.02, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.16, 0.18, 0.04, 24]} />
        <meshStandardMaterial color="#451a03" roughness={0.4} metalness={0.15} />
      </mesh>

      {/* Vertical Brass Pillar Stem */}
      <mesh position={[0, 0.12, 0]} castShadow>
        <cylinderGeometry args={[0.016, 0.022, 0.16, 16]} />
        <meshStandardMaterial color="#d97706" metalness={0.85} roughness={0.2} />
      </mesh>

      {/* Brass Meridian Gimbal Ring (Curving around the globe) */}
      <group position={[0, 0.32, 0]}>
        <mesh rotation={[0, 0, Math.PI / 8]}>
          <torusGeometry args={[0.22, 0.012, 12, 32]} />
          <meshStandardMaterial color="#f59e0b" metalness={0.88} roughness={0.2} />
        </mesh>
      </group>

      {/* Globe Sphere Assembly Tilted at Earth's 23.4° Axial Tilt */}
      <group position={[0, 0.32, 0]} rotation={[0, 0, 0.41]}>
        {/* Central Spindle Axis Pin */}
        <mesh>
          <cylinderGeometry args={[0.005, 0.005, 0.48, 12]} />
          <meshStandardMaterial color="#d97706" metalness={0.9} roughness={0.15} />
        </mesh>

        {/* Rotating Earth Sphere */}
        <group ref={sphereRef}>
          {/* Deep Ocean Blue Sphere */}
          <mesh castShadow receiveShadow>
            <sphereGeometry args={[0.18, 32, 32]} />
            <meshStandardMaterial
              color="#0369a1"
              roughness={0.35}
              metalness={0.2}
              emissive={isHovered ? '#0284c7' : '#000000'}
              emissiveIntensity={isHovered ? 0.3 : 0}
            />
          </mesh>

          {/* Latitude / Longitude Parallels & Meridians Wireframe */}
          <mesh>
            <sphereGeometry args={[0.182, 12, 12]} />
            <meshBasicMaterial color="#38bdf8" wireframe transparent opacity={0.35} />
          </mesh>

          {/* Procedural Continents Patches */}
          {/* Eurasia / Africa */}
          <mesh position={[0.08, 0.05, 0.12]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshStandardMaterial color="#15803d" roughness={0.7} />
          </mesh>
          {/* Americas */}
          <mesh position={[-0.12, 0.02, -0.06]}>
            <sphereGeometry args={[0.075, 8, 8]} />
            <meshStandardMaterial color="#16a34a" roughness={0.7} />
          </mesh>
          {/* Polar Ice Caps */}
          <mesh position={[0, 0.175, 0]}>
            <cylinderGeometry args={[0.05, 0.07, 0.015, 16]} />
            <meshStandardMaterial color="#ffffff" roughness={0.2} />
          </mesh>
          <mesh position={[0, -0.175, 0]}>
            <cylinderGeometry args={[0.06, 0.04, 0.015, 16]} />
            <meshStandardMaterial color="#ffffff" roughness={0.2} />
          </mesh>
          {/* Interactive Geographic Pins */}
          {GEO_HOTSPOTS.map(spot => {
            const [hx, hy, hz] = getHotspotPos(spot.lat, spot.lon);
            const isThisHovered = hoveredHotspot?.id === spot.id;
            const normal = new THREE.Vector3(hx, hy, hz).normalize();
            const orientation = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
            return (
              <group
                key={spot.id}
                position={[hx, hy, hz]}
                quaternion={orientation}
                onClick={(e) => handleHotspotClick(e, spot)}
                onPointerOver={(e) => { e.stopPropagation(); setHoveredHotspot(spot); }}
                onPointerOut={() => setHoveredHotspot(null)}
              >
                {/* Pin Tip */}
                <mesh position={[0, 0.006, 0]}>
                  <sphereGeometry args={[isThisHovered ? 0.014 : 0.008, 12, 12]} />
                  <meshStandardMaterial
                    color={isThisHovered ? '#f59e0b' : '#38bdf8'}
                    emissive={isThisHovered ? '#fbbf24' : '#0284c7'}
                    emissiveIntensity={isHovered ? 1.0 : 0.6}
                  />
                </mesh>
                {/* Subtle needle pin stem pointing radially inward into the globe */}
                <mesh position={[0, 0, 0]}>
                  <cylinderGeometry args={[0.0015, 0.0015, 0.012, 8]} />
                  <meshStandardMaterial color="#d97706" metalness={0.9} />
                </mesh>
              </group>
            );
          })}
        </group>
      </group>

      {/* Floating Hover Badge */}
      {isHovered && (
        <Html position={[0, 0.62, 0]} center style={{ pointerEvents: 'none', userSelect: 'none' }}>
          <div style={{
            background: 'rgba(15, 23, 42, 0.95)',
            border: `1.5px solid ${hoveredHotspot ? '#fbbf24' : '#06b6d4'}`,
            borderRadius: '16px',
            padding: '6px 14px',
            color: hoveredHotspot ? '#fef3c7' : '#cffafe',
            fontSize: '11px',
            fontWeight: 600,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            whiteSpace: 'nowrap'
          }}>
            <span>🌍</span>
            <span>{hoveredHotspot ? `📍 ${hoveredHotspot.name} · Cliquer pour explorer` : "Explorer l'Atlas Mondial & Géographie"}</span>
            <span style={{ color: hoveredHotspot ? '#fbbf24' : '#22d3ee' }}>↗</span>
          </div>
        </Html>
      )}
    </group>
  );
};
