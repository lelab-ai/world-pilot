import { useSyncExternalStore } from 'react';
import { create, useStore } from 'zustand';
import { xrStore } from './xrStore';
import { getRenderBudget, type RenderQuality } from './renderingPolicy';

// Rendering preferences are local to the client, never part of WorldIR.
export const useRenderSettings = create<{
  quality: RenderQuality;
  setQuality: (quality: RenderQuality) => void;
}>(set => ({
  quality: 'auto',
  setQuality: quality => set({ quality }),
}));

function subscribePointer(onChange: () => void) {
  const media = window.matchMedia('(pointer: coarse)');
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

function hasCoarsePointer() {
  return window.matchMedia('(pointer: coarse)').matches;
}

export function useRenderBudget() {
  const quality = useRenderSettings(state => state.quality);
  const isXR = useStore(xrStore, state => Boolean(state.session));
  const coarsePointer = useSyncExternalStore(subscribePointer, hasCoarsePointer, () => false);
  return getRenderBudget(quality, coarsePointer, isXR);
}
