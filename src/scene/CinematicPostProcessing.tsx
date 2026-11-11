import React, { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { useWorldStore } from '../engine/store';
import { getCinematicSettings } from './renderingPolicy';
import { useRenderBudget } from './renderQuality';

/**
 * Custom GLSL color-grading and lens effects for the WebGL scene:
 * - Radial Chromatic Aberration (Simulating anamorphic optics & VR lens dispersion)
 * - Cinematic Color Grading (Warm specular bounce, contrast enhancement)
 * - Natural Lens Vignetting (Anamorphic depth framing)
 * - Micro 35mm Film Grain (Eliminates 8-bit banding on gradients and dark tones)
 */
export const CinematicColorGradingShader = {
  name: 'CinematicColorGradingShader',
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uPreset: { value: 0 }, // 0: Cinematic, 1: Golden Hour, 2: Cyberpunk, 3: Studio, 4: Off
    uExposure: { value: 1.0 },
    uContrast: { value: 1.14 },
    uSaturation: { value: 1.06 },
    uVignetteDarkness: { value: 0.65 },
    uVignetteOffset: { value: 1.10 },
    uChromaticAberration: { value: 0.002 },
    uFilmGrain: { value: 0.015 }
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform int uPreset;
    uniform float uExposure;
    uniform float uContrast;
    uniform float uSaturation;
    uniform float uVignetteDarkness;
    uniform float uVignetteOffset;
    uniform float uChromaticAberration;
    uniform float uFilmGrain;
    varying vec2 vUv;

    // High frequency pseudo-random micro grain generator
    float hashGrain(vec2 p) {
      vec3 p3 = fract(vec3(p.xyx) * 0.1031);
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.x + p3.y) * p3.z);
    }

    void main() {
      if (uPreset == 4) {
        // Raw WebGL bypass mode
        gl_FragColor = texture2D(tDiffuse, vUv);
        return;
      }

      vec2 uv = vUv;
      vec2 distFromCenter = uv - 0.5;

      // 1. Radial Chromatic Aberration (Optical dispersion increases toward corners)
      float distSq = dot(distFromCenter, distFromCenter);
      vec2 caOffset = distFromCenter * distSq * uChromaticAberration * 4.0;
      
      float r = texture2D(tDiffuse, uv + caOffset).r;
      float g = texture2D(tDiffuse, uv).g;
      float b = texture2D(tDiffuse, uv - caOffset).b;
      vec3 color = vec3(r, g, b);

      // 2. Exposure & S-Curve Contrast Adjustment
      color *= uExposure;
      color = (color - 0.5) * uContrast + 0.5;

      // 3. Preset-specific Color Grading Profiles
      if (uPreset == 0) {
        // Cinematic: restrained warmth and contrast, with neutral highlights.
        vec3 toneBalance = vec3(1.02, 1.01, 0.98);
        color *= toneBalance;
      } else if (uPreset == 1) {
        // Golden Hour: Amber warmth, heightened sunset glow & rich brass reflections
        color *= vec3(1.14, 1.04, 0.86);
      } else if (uPreset == 2) {
        // Cyberpunk Neon: Cyan and magenta push with punchy contrast
        color.r = pow(max(0.0, color.r), 0.92) * 1.08;
        color.b = pow(max(0.0, color.b), 0.90) * 1.18;
      }

      // 4. Perceptual Saturation Control
      float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
      color = mix(vec3(luma), color, uSaturation);

      // OutputPass applies renderer tone mapping and the final sRGB conversion once.
      // 5. Subtle lens vignette
      if (uVignetteDarkness > 0.0) {
        float d = length(distFromCenter);
        float vignette = 1.0 - smoothstep(uVignetteOffset - uVignetteDarkness, uVignetteOffset, d);
        color *= vignette;
      }

      // 6. Fine film grain
      if (uFilmGrain > 0.0) {
        float grain = (hashGrain(uv * 1024.0 + fract(uTime * 0.05)) - 0.5) * uFilmGrain;
        color += grain * (1.0 - smoothstep(0.7, 1.0, luma));
      }

      // Preserve highlights above 1.0 for the final tone mapper.
      gl_FragColor = vec4(max(color, vec3(0.0)), 1.0);
    }
  `
};

export const CinematicPostProcessing: React.FC = () => {
  const { gl, scene, camera, size, viewport } = useThree();
  const budget = useRenderBudget();

  const cinematicPreset = useWorldStore(state => state.cinematicPreset);
  const bloomIntensity = useWorldStore(state => state.bloomIntensity);
  const vignetteStrength = useWorldStore(state => state.vignetteStrength);
  const chromaticAberration = useWorldStore(state => state.chromaticAberration);

  const settings = getCinematicSettings(cinematicPreset, { bloomIntensity, vignetteStrength, chromaticAberration });
  const active = budget.postprocessing && settings.useComposer;
  const pipeline = useRef<{
    composer: EffectComposer;
    bloom: UnrealBloomPass;
    grade: ShaderPass;
  } | null>(null);

  // Allocate GPU resources only for artistic presets, with symmetric StrictMode cleanup.
  useEffect(() => {
    if (!active) return;
    const target = new THREE.WebGLRenderTarget(1, 1, {
      type: THREE.HalfFloatType,
      samples: Math.min(budget.samples, gl.capabilities.maxSamples),
    });
    const composer = new EffectComposer(gl, target);
    const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0, 0.25, 2);
    const grade = new ShaderPass(CinematicColorGradingShader);
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(bloom);
    composer.addPass(grade);
    composer.addPass(new OutputPass());
    pipeline.current = { composer, bloom, grade };
    return () => {
      pipeline.current = null;
      composer.passes.forEach(pass => pass.dispose());
      composer.dispose();
    };
  }, [active, gl, scene, camera, budget.samples]);

  useEffect(() => {
    const composer = pipeline.current?.composer;
    if (!composer) return;
    composer.setPixelRatio(viewport.dpr);
    composer.setSize(size.width, size.height);
  }, [active, gl, scene, camera, budget.samples, size.width, size.height, viewport.dpr]);

  useFrame(({ clock }) => {
    const current = pipeline.current;
    if (gl.xr.isPresenting || !active || !current) {
      gl.render(scene, camera);
      return;
    }
    current.bloom.enabled = settings.bloomStrength > 0;
    current.bloom.strength = settings.bloomStrength;
    current.bloom.radius = settings.bloomRadius;
    current.bloom.threshold = settings.bloomThreshold;
    const uniforms = current.grade.uniforms;
    uniforms.uPreset.value = settings.presetIndex;
    uniforms.uExposure.value = settings.exposure;
    uniforms.uContrast.value = settings.contrast;
    uniforms.uSaturation.value = settings.saturation;
    uniforms.uVignetteDarkness.value = settings.vignette;
    uniforms.uChromaticAberration.value = settings.chromaticAberration;
    uniforms.uFilmGrain.value = settings.filmGrain;
    uniforms.uTime.value = clock.getElapsedTime();
    current.composer.render();
  }, 1);

  return null;
};
