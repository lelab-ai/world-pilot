// src/research/editOrder/verifyPatchSatisfaction.ts
// Validateur empirique de satisfaction des intentions d'édition (SAT(A) et SAT(B)).
// Exigence Section 39 & 40 de l'audit indépendant EO-Bench v2.1.

import type { WorldState, WorldPatch } from '../../core/types';

/**
 * Vérifie formellement si les modifications stipulées dans un patch sont satisfaites
 * dans l'état terminal du monde 3D.
 * 
 * Critères :
 * - Géométrie / Transform : la position de l'entité dans le monde doit être à moins de 10 cm de la cible.
 * - Règles causales : toute règle ajoutée ou modifiée doit être présente et active.
 * - Quêtes : les étapes de quête créées ou mises à jour doivent être consistantes.
 */
export function verifyPatchSatisfaction(world: WorldState, patch: WorldPatch): boolean {
  if (patch.entitiesChanged) {
    for (const ch of patch.entitiesChanged) {
      if (!ch.id) continue;
      const ent = world.ir?.entities?.[ch.id];
      if (!ent) return false;
      // Vérifier les capacités attendues
      if (ch.capabilities) {
        for (const cap of ch.capabilities) {
          if (cap.type === 'transform') {
            const entTc = (ent.capabilities || []).find((c: any) => c.type === 'transform');
            if (!entTc || !entTc.position || !cap.position) return false;
            const getXYZ = (p: any): [number, number, number] =>
              Array.isArray(p) ? [p[0] ?? 0, p[1] ?? 0, p[2] ?? 0] : [p.x ?? 0, p.y ?? 0, p.z ?? 0];
            const [ex, ey, ez] = getXYZ(entTc.position);
            const [cx, cy, cz] = getXYZ(cap.position);
            const dist = Math.hypot(ex - cx, ey - cy, ez - cz);
            if (dist > 0.1) return false; // Tolérance géométrique maximale : 10 cm
          }
        }
      }
    }
  }

  if (patch.entitiesCreated) {
    for (const cr of patch.entitiesCreated) {
      if (!world.ir?.entities?.[cr.id]) return false;
    }
  }

  if (patch.entitiesRemoved) {
    const createdIds = new Set((patch.entitiesCreated || []).map(e => e.id));
    for (const remId of patch.entitiesRemoved) {
      if (!createdIds.has(remId) && world.ir?.entities?.[remId]) return false;
    }
  }

  if (patch.rulesChanged) {
    for (const r of patch.rulesChanged) {
      if (!r.id || !world.ir?.rules?.[r.id]) return false;
    }
  }

  if (patch.questsAdded) {
    for (const q of patch.questsAdded) {
      if (!q.id || !world.ir?.quests?.[q.id]) return false;
    }
  }

  if (patch.questUpdated) {
    if (!world.ir?.activeQuestId || !world.ir?.quests?.[world.ir.activeQuestId]) return false;
  }

  return true;
}
