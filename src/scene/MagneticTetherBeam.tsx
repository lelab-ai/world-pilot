import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface MagneticTetherBeamProps {
  targetOffset: [number, number, number]; // [dx, dy, dz] relative to dragged entity
  color?: string;
}

export const MagneticTetherBeam: React.FC<MagneticTetherBeamProps> = ({
  targetOffset,
  color = '#10b981'
}) => {
  const lineRef = useRef<THREE.Line>(null);
  const pulseGroupRef = useRef<THREE.Group>(null);

  const [dx, dy, dz] = targetOffset;
  const dist = Math.hypot(dx, dy, dz);

  // Compute quadratic Bézier curve sagging gracefully under virtual gravitational pull
  const curvePoints = useMemo(() => {
    const start = new THREE.Vector3(0, 0, 0);
    const end = new THREE.Vector3(dx, dy, dz);
    // Midpoint with subtle downward arc
    const mid = new THREE.Vector3(
      dx * 0.5,
      Math.min(0, dy * 0.5) - 0.08,
      dz * 0.5
    );

    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    return curve.getPoints(24);
  }, [dx, dy, dz]);

  const geometry = useMemo(() => new THREE.BufferGeometry(), []);

  useMemo(() => {
    geometry.setFromPoints(curvePoints);
  }, [geometry, curvePoints]);

  React.useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  useFrame(({ clock }) => {
    if (pulseGroupRef.current) {
      // Animate flowing energy pulse along the tether
      const t = (clock.getElapsedTime() * 3.5) % 1;
      const ptIdx = Math.floor(t * (curvePoints.length - 1));
      const pt = curvePoints[ptIdx] || curvePoints[0];
      pulseGroupRef.current.position.set(pt.x, pt.y, pt.z);
    }
  });

  if (dist < 0.02) return null;

  return (
    <group>
      {/* Ethereal Magnetic Spline Line */}
      {/* @ts-ignore */}
      <line ref={lineRef} geometry={geometry}>
        <lineBasicMaterial color={color} transparent opacity={0.75} linewidth={2} />
      </line>

      {/* Traveling Energy Pulse Node */}
      <group ref={pulseGroupRef}>
        <mesh>
          <sphereGeometry args={[0.016, 12, 12]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.035, 12, 12]} />
          <meshBasicMaterial color={color} transparent opacity={0.4} />
        </mesh>
      </group>

      {/* Target Socker Receiver Reticle */}
      <group position={[dx, dy, dz]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.08, 0.11, 24]} />
          <meshBasicMaterial color={color} transparent opacity={0.8} side={THREE.DoubleSide} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.025, 16]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.9} />
        </mesh>
      </group>
    </group>
  );
};
