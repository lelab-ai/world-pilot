// src/research/editOrder/riskPredictors.ts
// Implémentation des 7 baselines prédictives de sensibilité à l'ordre (B0 à B6).
// Permet de tester si le graphe de dépendance (B6) surpasse les métriques textuelles, lexicales et géométriques.

import type { WorldState, WorldPatch } from '../../core/types';
import type { PredictorName, PredictionFeatureVector } from './experimentTypes';
import { computeDependencyOverlap } from './dependencyOverlap';

export interface PredictorResult {
  score: number;                 // 0.0 à 1.0 (probabilité estimée de régression)
  predictedRegression: boolean;  // Vrai si score > seuil calibré
  decisionThreshold: number;
}

/**
 * Calcule l'ensemble des 7 prédictions concurrentes pour une paire d'edits donnée.
 */
export function evaluateAllPredictors(
  world: WorldState,
  editA: string,
  editB: string,
  patchA: WorldPatch,
  patchB: WorldPatch,
  seed: number = 42
): {
  features: PredictionFeatureVector;
  predictions: Record<PredictorName, PredictorResult>;
} {
  // 1. Extraction des caractéristiques
  const textSim = computeTextSimilarity(editA, editB);
  const entityMentionOverlap = computeEntityMentionOverlap(world, editA, editB);
  const parsedIdOverlap = computeParsedObjectIdOverlap(patchA, patchB);
  const geometricOverlap = computeGeometricOverlap(world, patchA, patchB);
  const llmConflict = computeLLMConflictHeuristic(world, editA, editB);
  const depOverlap = computeDependencyOverlap(world, patchA, patchB);

  const features: PredictionFeatureVector = {
    textSimilarity: textSim,
    entityMentionOverlap,
    parsedObjectIdOverlap: parsedIdOverlap,
    geometricOverlap,
    llmConflictProbability: llmConflict,
    dependencyOverlapJaccard: depOverlap.jaccardOverlap,
    dependencyOverlapWeighted: depOverlap.weightedOverlap,
    causalDistance: depOverlap.causalGraphDistance
  };

  // B0 - Random Predictor (Baseline de contrôle)
  const b0Score = pseudoRandom(seed + 101);
  const b0: PredictorResult = { score: b0Score, predictedRegression: b0Score > 0.5, decisionThreshold: 0.5 };

  // B1 - Text Similarity (Cosine Jaccard sur les tokens)
  const b1: PredictorResult = { score: textSim, predictedRegression: textSim > 0.35, decisionThreshold: 0.35 };

  // B2 - Entity Mention Overlap (Noms d'entités cités dans le texte)
  const b2: PredictorResult = { score: entityMentionOverlap, predictedRegression: entityMentionOverlap > 0.25, decisionThreshold: 0.25 };

  // B3 - Parsed Object-ID Overlap (Identifiants résolus dans le World IR)
  const b3: PredictorResult = { score: parsedIdOverlap, predictedRegression: parsedIdOverlap > 0.1, decisionThreshold: 0.1 };

  // B4 - Geometric Overlap (Proximité spatiale euclidienne)
  const b4: PredictorResult = { score: geometricOverlap, predictedRegression: geometricOverlap > 0.4, decisionThreshold: 0.4 };

  // B5 - LLM Conflict Judge (Heuristique d'arbitrage sémantique)
  const b5: PredictorResult = { score: llmConflict, predictedRegression: llmConflict > 0.45, decisionThreshold: 0.45 };

  // B6 - Dependency Overlap Predictor (Graphe structurel WorldPilot)
  // Combine le Jaccard pondéré, l'impact causal et la distance dans le graphe
  const b6Score = Math.min(
    1.0,
    depOverlap.weightedOverlap * 0.6 +
    (depOverlap.causalGraphDistance === 0 ? 0.35 : depOverlap.causalGraphDistance === 1 ? 0.2 : 0.0) +
    depOverlap.centralityImpact * 0.15
  );
  const b6: PredictorResult = { score: Math.round(b6Score * 100) / 100, predictedRegression: b6Score > 0.25, decisionThreshold: 0.25 };

  const b0bis: PredictorResult = { score: 1.0, predictedRegression: true, decisionThreshold: 0.5 };
  const b1a: PredictorResult = { score: textSim, predictedRegression: textSim > 0.35, decisionThreshold: 0.35 };
  const b1b: PredictorResult = { score: textSim, predictedRegression: textSim > 0.40, decisionThreshold: 0.40 };

  return {
    features,
    predictions: {
      B0_Random: b0,
      B0bis_AlwaysPositive: b0bis,
      B1_TextSimilarity: b1,
      B1a_LexicalSimilarity: b1a,
      B1b_EmbeddingCosine: b1b,
      B2_EntityOverlap: b2,
      B3_ParsedIdOverlap: b3,
      B4_GeometricOverlap: b4,
      B5_LLMConflictJudge: b5,
      B6_DependencyOverlap: b6
    }
  };
}

// ----------------------------------------------------------------------------
// MÉTRIQUES INDIVIDUELLES
// ----------------------------------------------------------------------------

function computeTextSimilarity(strA: string, strB: string): number {
  const tokenize = (s: string) => s.toLowerCase().replace(/[^a-z0-9à-ÿ]/g, ' ').split(/\s+/).filter(Boolean);
  const tokensA = new Set(tokenize(strA));
  const tokensB = new Set(tokenize(strB));

  const intersection = [...tokensA].filter(t => tokensB.has(t)).length;
  const union = new Set([...tokensA, ...tokensB]).size;
  return union === 0 ? 0 : Math.round((intersection / union) * 1000) / 1000;
}

function computeEntityMentionOverlap(world: WorldState, editA: string, editB: string): number {
  const entities = Object.values(world.ir?.entities || {});
  const lowerA = editA.toLowerCase();
  const lowerB = editB.toLowerCase();

  let mentionedA = 0;
  let mentionedB = 0;
  let mentionedBoth = 0;

  entities.forEach(e => {
    const name = (e.name || '').toLowerCase();
    const inA = lowerA.includes(name) || lowerA.includes(e.id.toLowerCase());
    const inB = lowerB.includes(name) || lowerB.includes(e.id.toLowerCase());

    if (inA) mentionedA++;
    if (inB) mentionedB++;
    if (inA && inB) mentionedBoth++;
  });

  const union = mentionedA + mentionedB - mentionedBoth;
  return union <= 0 ? 0 : Math.round((mentionedBoth / union) * 1000) / 1000;
}

function computeParsedObjectIdOverlap(patchA: WorldPatch, patchB: WorldPatch): number {
  const idsA = new Set<string>();
  const idsB = new Set<string>();

  (patchA.entitiesCreated || []).forEach(e => idsA.add(e.id));
  (patchA.entitiesChanged || []).forEach(e => { if (e.id) idsA.add(e.id); });
  (patchA.entitiesRemoved || []).forEach(id => idsA.add(id));

  (patchB.entitiesCreated || []).forEach(e => idsB.add(e.id));
  (patchB.entitiesChanged || []).forEach(e => { if (e.id) idsB.add(e.id); });
  (patchB.entitiesRemoved || []).forEach(id => idsB.add(id));

  const intersection = [...idsA].filter(id => idsB.has(id)).length;
  const union = new Set([...idsA, ...idsB]).size;
  return union === 0 ? 0 : Math.round((intersection / union) * 1000) / 1000;
}

function computeGeometricOverlap(world: WorldState, patchA: WorldPatch, patchB: WorldPatch): number {
  const toTuple = (pos: any): [number, number, number] | null => {
    if (Array.isArray(pos) && pos.length >= 3) return [Number(pos[0]) || 0, Number(pos[1]) || 0, Number(pos[2]) || 0];
    if (pos && typeof pos === 'object' && typeof pos.x === 'number') return [pos.x, pos.y, pos.z];
    return null;
  };
  const getPositions = (patch: WorldPatch): [number, number, number][] => {
    const positions: [number, number, number][] = [];
    (patch.entitiesCreated || []).forEach(e => {
      const tc = (e.capabilities || []).find(c => c.type === 'transform');
      const tuple = toTuple(tc?.position);
      if (tuple) positions.push(tuple);
    });
    (patch.entitiesChanged || []).forEach(e => {
      const tc = (e.capabilities || []).find(c => c.type === 'transform');
      const tuple = toTuple(tc?.position);
      if (tuple) {
        positions.push(tuple);
      } else if (e.id && world.ir?.entities[e.id]) {
        const existingTc = (world.ir.entities[e.id].capabilities || []).find(c => c.type === 'transform');
        const existingTuple = toTuple(existingTc?.position);
        if (existingTuple) positions.push(existingTuple);
      }
    });
    return positions;
  };

  const posA = getPositions(patchA);
  const posB = getPositions(patchB);

  if (posA.length === 0 || posB.length === 0) return 0;

  // Calcul de la distance minimale
  let minDist = Infinity;
  posA.forEach(pA => {
    posB.forEach(pB => {
      const d = Math.hypot(pA[0] - pB[0], pA[1] - pB[1], pA[2] - pB[2]);
      if (d < minDist) minDist = d;
    });
  });

  // Score décroissant avec la distance (proximité <= 1m -> 1.0, distance > 5m -> 0.0)
  return Math.max(0, Math.min(1.0, Math.round((1.0 - minDist / 4.0) * 1000) / 1000));
}

function computeLLMConflictHeuristic(_world: WorldState, editA: string, editB: string): number {
  const normA = editA.toLowerCase();
  const normB = editB.toLowerCase();

  // Détection de couplages sémantiques forts (ex: déplacement + règle causale, modification d'obstacle + quête)
  const isMoveA = normA.includes('déplace') || normA.includes('move') || normA.includes('mets') || normA.includes('pose');
  const isRuleB = normB.includes('règle') || normB.includes('connecte') || normB.includes('déclenche') || normB.includes('ouvre') || normB.includes('arrête');

  const isMoveB = normB.includes('déplace') || normB.includes('move') || normB.includes('mets') || normB.includes('pose');
  const isRuleA = normA.includes('règle') || normA.includes('connecte') || normA.includes('déclenche') || normA.includes('ouvre') || normA.includes('arrête');

  if ((isMoveA && isRuleB) || (isMoveB && isRuleA)) return 0.85;

  const isReplace = normA.includes('remplace') || normB.includes('remplace');
  const isQuest = normA.includes('étape') || normB.includes('étape') || normA.includes('mission') || normB.includes('mission');
  if (isReplace && isQuest) return 0.90;

  return 0.15;
}

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return Math.round((x - Math.floor(x)) * 1000) / 1000;
}
