// src/engine/spatialAttentionTelemetry.ts
// Télémétrie d'Attention Spatiale, Fixations Oculaires 3D & Trajectoires Visuelles (Scanpaths)
// Capture les points de focalisation pré-décisionnels dans l'espace 3D pour révéler l'intention latente.

export interface GazeFixation {
  entityId: string;
  entityName: string;
  position: { x: number; y: number; z: number };
  durationMs: number;
  fixationCount: number;
  lastTimestamp: number;
  preActionLatencyMs: number; // Temps passé à fixer l'objet avant de déclencher l'action
  pupilDilationProxy: number; // 0.0 à 1.0 : Proxy d'effort cognitif et de charge attentionnelle
}

export interface VisualScanpathPoint {
  x: number;
  y: number;
  z: number;
  entityId: string;
  timestamp: number;
}

export interface VisualScanpath {
  points: VisualScanpathPoint[];
  totalTransitions: number;
  attentionEntropy: number; // Entropie de Shannon (0 = focus exclusif sur 1 objet, 1 = dispersion maximale)
  dominantTargetEntityId: string | null;
}

export interface VolumetricHeatmapPoint {
  x: number;
  y: number;
  z: number;
  weight: number; // Poids relatif normalisé 0.0 - 1.0
  entityId: string;
}

export interface SpatialAttentionState {
  fixations: Record<string, GazeFixation>;
  scanpath: VisualScanpath;
  activeFocusEntityId: string | null;
  totalGazeDwellTimeMs: number;
  isHeatmapVisible: boolean;
}

/**
 * Initialise un état d'attention spatiale vierge.
 */
export function createInitialSpatialAttentionState(): SpatialAttentionState {
  return {
    fixations: {},
    scanpath: {
      points: [],
      totalTransitions: 0,
      attentionEntropy: 0,
      dominantTargetEntityId: null
    },
    activeFocusEntityId: null,
    totalGazeDwellTimeMs: 0,
    isHeatmapVisible: false
  };
}

/**
 * Enregistre une fixation d'attention visuelle sur une entité 3D.
 */
export function recordGazeFixation(
  currentState: SpatialAttentionState,
  entityId: string,
  entityName: string,
  position: { x: number; y: number; z: number } | [number, number, number],
  dwellMs = 450,
  preActionMs = 250
): SpatialAttentionState {
  const now = Date.now();
  const normPos = Array.isArray(position)
    ? { x: Number(position[0]) || 0, y: Number(position[1]) || 0, z: Number(position[2]) || 0 }
    : { x: Number(position?.x) || 0, y: Number(position?.y) || 0, z: Number(position?.z) || 0 };
  const existing = currentState.fixations[entityId];

  const updatedFixations = { ...currentState.fixations };
  const prevDuration = existing ? existing.durationMs : 0;
  const prevCount = existing ? existing.fixationCount : 0;

  // Calcul du proxy d'effort pupillaire (augmente lors des fixations longues)
  const pupilProxy = Math.min(1.0, Math.max(0.2, (dwellMs / 2000) * 0.7 + 0.3));

  updatedFixations[entityId] = {
    entityId,
    entityName,
    position: normPos,
    durationMs: prevDuration + dwellMs,
    fixationCount: prevCount + 1,
    lastTimestamp: now,
    preActionLatencyMs: preActionMs,
    pupilDilationProxy: pupilProxy
  };

  // Mise à jour du scanpath séquentiel
  const newScanpathPoints = [
    ...currentState.scanpath.points,
    { x: normPos.x, y: normPos.y, z: normPos.z, entityId, timestamp: now }
  ];
  // Conserver les 32 dernières transitions pour la fluidité 3D
  if (newScanpathPoints.length > 32) {
    newScanpathPoints.shift();
  }

  // Calcul de l'entropie de Shannon sur la distribution du temps de fixation
  const totalDwell = currentState.totalGazeDwellTimeMs + dwellMs;
  let entropy = 0;
  let maxDwellEntityId: string | null = null;
  let maxDwellTime = 0;

  const fixationKeys = Object.keys(updatedFixations);
  for (const k of fixationKeys) {
    const f = updatedFixations[k];
    if (f.durationMs > maxDwellTime) {
      maxDwellTime = f.durationMs;
      maxDwellEntityId = k;
    }
    const p = f.durationMs / Math.max(1, totalDwell);
    if (p > 0) {
      entropy -= p * Math.log2(p);
    }
  }

  // Normalisation de l'entropie entre 0 et 1 (divisé par log2(N))
  const maxPossibleEntropy = fixationKeys.length > 1 ? Math.log2(fixationKeys.length) : 1;
  const normalizedEntropy = Math.min(1.0, Math.max(0.0, Math.round((entropy / maxPossibleEntropy) * 100) / 100));

  return {
    ...currentState,
    fixations: updatedFixations,
    scanpath: {
      points: newScanpathPoints,
      totalTransitions: currentState.scanpath.totalTransitions + 1,
      attentionEntropy: normalizedEntropy,
      dominantTargetEntityId: maxDwellEntityId
    },
    activeFocusEntityId: entityId,
    totalGazeDwellTimeMs: totalDwell
  };
}

/**
 * Génère un nuage de points de densité d'attention spatiale (Heatmap 3D).
 */
export function generateVolumetricHeatmapPoints(
  state: SpatialAttentionState
): VolumetricHeatmapPoint[] {
  const fixations = Object.values(state.fixations);
  if (fixations.length === 0) return [];

  const maxDuration = Math.max(1, ...fixations.map(f => f.durationMs));

  return fixations.map(f => {
    const rawPos: any = f.position;
    const fx = Array.isArray(rawPos) ? Number(rawPos[0]) || 0 : Number(rawPos?.x) || 0;
    const fy = Array.isArray(rawPos) ? Number(rawPos[1]) || 0 : Number(rawPos?.y) || 0;
    const fz = Array.isArray(rawPos) ? Number(rawPos[2]) || 0 : Number(rawPos?.z) || 0;
    return {
      x: fx,
      y: fy + 0.15, // Légèrement surélevé par rapport à l'entité
      z: fz,
      weight: Math.min(1.0, Math.max(0.1, Math.round((f.durationMs / maxDuration) * 100) / 100)),
      entityId: f.entityId
    };
  });
}
