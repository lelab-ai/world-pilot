import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getWorldTheme } from '../library/worldThemes';

interface AtmosphereSystemProps {
  atmosphereId: string;
}

export const AtmosphereSystem: React.FC<AtmosphereSystemProps> = ({ atmosphereId }) => {
  const preset = getWorldTheme(atmosphereId);
  const { type, count, color, speed, size } = preset.particleConfig;

  const pointsRef = useRef<THREE.Points>(null);

  // Initialize particles positions, velocities, and colors
  const { positions, velocities, colors, initialData } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const init = new Float32Array(count * 3); // custom params: [initialY, phase, extra]

    const baseColor = new THREE.Color(color);
    const palette = [
      new THREE.Color('#ff3b30'),
      new THREE.Color('#ff9500'),
      new THREE.Color('#ffcc00'),
      new THREE.Color('#34c759'),
      new THREE.Color('#007aff'),
      new THREE.Color('#af52de'),
    ];

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      // Spread across stage
      pos[i3] = (Math.random() - 0.5) * 18;
      pos[i3 + 1] = Math.random() * (type === 'steam' ? 3.5 : 8) + 0.1;
      pos[i3 + 2] = (Math.random() - 0.5) * 18;

      init[i3] = pos[i3];
      init[i3 + 1] = pos[i3 + 1];
      init[i3 + 2] = Math.random() * Math.PI * 2; // Phase

      if (type === 'rain') {
        vel[i3] = (Math.random() - 0.5) * 0.1;
        vel[i3 + 1] = -(speed + Math.random() * 1.5);
        vel[i3 + 2] = (Math.random() - 0.5) * 0.1;
        col[i3] = baseColor.r;
        col[i3 + 1] = baseColor.g;
        col[i3 + 2] = baseColor.b;
      } else if (type === 'steam') {
        vel[i3] = (Math.random() - 0.5) * 0.1;
        vel[i3 + 1] = speed * (0.6 + Math.random() * 0.8);
        vel[i3 + 2] = (Math.random() - 0.5) * 0.1;
        col[i3] = 0.95;
        col[i3 + 1] = 0.92;
        col[i3 + 2] = 0.88;
      } else if (type === 'confetti') {
        vel[i3] = (Math.random() - 0.5) * 0.4;
        vel[i3 + 1] = -(speed * (0.5 + Math.random() * 0.6));
        vel[i3 + 2] = (Math.random() - 0.5) * 0.4;
        const c = palette[i % palette.length];
        col[i3] = c.r;
        col[i3 + 1] = c.g;
        col[i3 + 2] = c.b;
      } else if (type === 'fireflies') {
        vel[i3] = (Math.random() - 0.5) * 0.2;
        vel[i3 + 1] = (Math.random() - 0.5) * 0.15;
        vel[i3 + 2] = (Math.random() - 0.5) * 0.2;
        col[i3] = baseColor.r;
        col[i3 + 1] = baseColor.g;
        col[i3 + 2] = baseColor.b;
      } else {
        // dust, zen, cyber
        vel[i3] = (Math.random() - 0.5) * speed * 0.5;
        vel[i3 + 1] = (Math.random() - 0.5) * speed * 0.3;
        vel[i3 + 2] = (Math.random() - 0.5) * speed * 0.5;
        col[i3] = baseColor.r;
        col[i3 + 1] = baseColor.g;
        col[i3 + 2] = baseColor.b;
      }
    }

    return { positions: pos, velocities: vel, colors: col, initialData: init };
  }, [type, count, color, speed]);

  useFrame(({ clock }) => {
    if (!pointsRef.current || type === 'none') return;
    const geo = pointsRef.current.geometry;
    const posAttr = geo.getAttribute('position') as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;
    const t = clock.getElapsedTime();

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const phase = initialData[i3 + 2];

      if (type === 'rain') {
        arr[i3 + 1] += velocities[i3 + 1] * 0.05;
        if (arr[i3 + 1] < 0) {
          arr[i3 + 1] = 8.5 + Math.random() * 2;
          arr[i3] = (Math.random() - 0.5) * 16;
          arr[i3 + 2] = (Math.random() - 0.5) * 16;
        }
      } else if (type === 'steam') {
        arr[i3 + 1] += velocities[i3 + 1] * 0.04;
        arr[i3] += Math.sin(t * 2 + phase) * 0.008;
        arr[i3 + 2] += Math.cos(t * 1.7 + phase) * 0.008;
        if (arr[i3 + 1] > 4.5) {
          arr[i3 + 1] = 0.2 + Math.random() * 0.4;
          arr[i3] = (Math.random() - 0.5) * 4;
          arr[i3 + 2] = (Math.random() - 0.5) * 4;
        }
      } else if (type === 'confetti') {
        arr[i3 + 1] += velocities[i3 + 1] * 0.04;
        arr[i3] += Math.sin(t * 3 + phase) * 0.02;
        arr[i3 + 2] += Math.cos(t * 2.5 + phase) * 0.02;
        if (arr[i3 + 1] < 0) {
          arr[i3 + 1] = 7.5 + Math.random() * 2;
          arr[i3] = (Math.random() - 0.5) * 16;
          arr[i3 + 2] = (Math.random() - 0.5) * 16;
        }
      } else if (type === 'fireflies') {
        arr[i3] += Math.sin(t * 1.5 + phase) * 0.015;
        arr[i3 + 1] += Math.cos(t * 1.2 + phase) * 0.01;
        arr[i3 + 2] += Math.sin(t * 0.9 + phase) * 0.015;
        if (arr[i3 + 1] < 0.3) arr[i3 + 1] = 0.35;
        if (arr[i3 + 1] > 5) arr[i3 + 1] = 4.8;
      } else if (type === 'mars_storm') {
        arr[i3] += (velocities[i3] + 0.09); // Sweeping across stage horizontally
        arr[i3 + 1] += Math.sin(t * 2.5 + phase) * 0.009;
        arr[i3 + 2] += Math.cos(t * 1.8 + phase) * 0.012;
        if (arr[i3] > 9) arr[i3] = -9;
      } else if (type === 'energy_motes') {
        arr[i3 + 1] += 0.024; // Ascending upwards in antigravity!
        arr[i3] += Math.sin(t * 1.4 + phase) * 0.007;
        arr[i3 + 2] += Math.cos(t * 1.4 + phase) * 0.007;
        if (arr[i3 + 1] > 7.5) arr[i3 + 1] = 0.2;
      } else if (type === 'space_debris') {
        arr[i3] += Math.sin(t * 0.5 + phase) * 0.004;
        arr[i3 + 1] += Math.cos(t * 0.4 + phase) * 0.003;
        arr[i3 + 2] += Math.sin(t * 0.6 + phase) * 0.004;
      } else {
        // Floating dust / zen petals / cyber nodes
        arr[i3] += Math.sin(t * 0.8 + phase) * 0.006;
        arr[i3 + 1] += Math.cos(t * 0.6 + phase) * 0.004;
        arr[i3 + 2] += Math.sin(t * 0.5 + phase) * 0.006;
        if (arr[i3 + 1] < 0.1) arr[i3 + 1] = 6;
      }
    }
    posAttr.needsUpdate = true;
  });

  if (type === 'none') return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={size}
        vertexColors
        transparent
        opacity={type === 'steam' ? 0.45 : type === 'rain' ? 0.75 : 0.85}
        depthWrite={false}
        blending={type === 'fireflies' || type === 'cyber_grid' ? THREE.AdditiveBlending : THREE.NormalBlending}
      />
    </points>
  );
};
