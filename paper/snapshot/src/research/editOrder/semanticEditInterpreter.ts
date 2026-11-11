// src/research/editOrder/semanticEditInterpreter.ts
// Parseur et interpréteur sémantique pour le benchmark d'expérimentation d'ordre d'edits.
// Traduit les instructions en modifications concrètes sur la géométrie, physique, interactions, règles et quêtes.

import type { WorldState, WorldPatch, EntitySpec, RuleSpec } from '../../core/types';
import { computeDeterministicHash } from './worldCloneManager';

export interface SemanticEditResult {
  patch: WorldPatch;
  category: string;
  targetEntityId: string;
}

function toVec3Obj(
  v: any,
  fallback: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 }
): { x: number; y: number; z: number } {
  if (Array.isArray(v) && v.length >= 3) {
    return {
      x: Number.isFinite(Number(v[0])) ? Number(v[0]) : fallback.x,
      y: Number.isFinite(Number(v[1])) ? Number(v[1]) : fallback.y,
      z: Number.isFinite(Number(v[2])) ? Number(v[2]) : fallback.z
    };
  }
  if (v && typeof v === 'object') {
    return {
      x: Number.isFinite(Number(v.x)) ? Number(v.x) : fallback.x,
      y: Number.isFinite(Number(v.y)) ? Number(v.y) : fallback.y,
      z: Number.isFinite(Number(v.z)) ? Number(v.z) : fallback.z
    };
  }
  return { ...fallback };
}


/**
 * Interprète une instruction en langage naturel dans le contexte d'un monde WorldState donné.
 */
export function interpretSemanticEdit(
  instruction: string,
  world: WorldState
): SemanticEditResult {
  const norm = instruction.toLowerCase().trim();
  const entities = world.ir?.entities || {};
  const entityList = Object.values(entities);

  // Recherche ordonnée des entités mentionnées dans l'instruction
  const matchedEntities: { entity: EntitySpec; index: number; length: number }[] = [];
  for (const e of entityList) {
    const nameLower = (e.name || '').toLowerCase();
    const idLower = e.id.toLowerCase();
    let idx = norm.indexOf(nameLower);
    let len = nameLower.length;
    if (idx === -1) {
      idx = norm.indexOf(idLower);
      len = idLower.length;
    }
    if (idx !== -1) {
      matchedEntities.push({ entity: e, index: idx, length: len });
    }
  }

  // Trier par position d'apparition (la première mentionnée est le sujet direct de l'action)
  matchedEntities.sort((a, b) => a.index - b.index);
  let subjectEntity = matchedEntities.length > 0 ? matchedEntities[0].entity : undefined;
  let targetSecondaryEntity = matchedEntities.length > 1 ? matchedEntities[1].entity : undefined;

  // Fallbacks de matching partiel si aucune correspondance exacte
  if (!subjectEntity) {
    if (norm.includes('bouton') || norm.includes('arrêt')) subjectEntity = entityList.find(e => e.id.includes('button') || e.name.toLowerCase().includes('bouton'));
    else if (norm.includes('armoire') || norm.includes('armoire électrique')) subjectEntity = entityList.find(e => e.id.includes('cabinet') || e.name.toLowerCase().includes('armoire'));
    else if (norm.includes('robot') || norm.includes('mobile') || norm.includes('agv') || norm.includes('opérateur')) subjectEntity = entityList.find(e => e.id.includes('robot') || e.name.toLowerCase().includes('robot') || (e.capabilities || []).some(c => c.type === 'agent'));
    else if (norm.includes('cloison') || norm.includes('plexiglas')) subjectEntity = entityList.find(e => e.id.includes('wall') || e.name.toLowerCase().includes('cloison'));
    else if (norm.includes('barrière') || norm.includes('meuble') || norm.includes('équipement encombrant')) subjectEntity = entityList.find(e => e.id.includes('barrier') || e.name.toLowerCase().includes('barrière') || e.name.toLowerCase().includes('encombrant'));
    else if (norm.includes('issue') || norm.includes('porte')) subjectEntity = entityList.find(e => e.id.includes('door') || e.name.toLowerCase().includes('issue') || e.name.toLowerCase().includes('porte'));
    else if (norm.includes('support')) subjectEntity = entityList.find(e => e.id.includes('support') || e.name.toLowerCase().includes('support'));
    else if (norm.includes('voyant') || norm.includes('led')) subjectEntity = entityList.find(e => e.id.includes('led') || e.name.toLowerCase().includes('voyant'));
    else if (norm.includes('palan')) subjectEntity = entityList.find(e => e.id.includes('hoist') || e.name.toLowerCase().includes('palan'));
    else if (norm.includes('capteur')) subjectEntity = entityList.find(e => e.id.includes('sensor') || e.name.toLowerCase().includes('capteur'));
    else if (norm.includes('fiole') || norm.includes('acide') || norm.includes('flacon') || norm.includes('solvant')) subjectEntity = entityList.find(e => e.id.includes('flask') || e.id.includes('flacon') || e.id.includes('solvant') || e.name.toLowerCase().includes('flacon') || e.name.toLowerCase().includes('fiole'));
    else if (norm.includes('générateur')) subjectEntity = entityList.find(e => e.id.includes('generator') || e.name.toLowerCase().includes('générateur'));
    else if (norm.includes('bec bunsen') || norm.includes('bunsen') || norm.includes('vanne de gaz')) subjectEntity = entityList.find(e => e.id.includes('bunsen') || e.name.toLowerCase().includes('bunsen'));
    else if (norm.includes('centrifugeuse') || norm.includes('rotor')) subjectEntity = entityList.find(e => e.id.includes('rotor') || e.name.toLowerCase().includes('rotor') || e.name.toLowerCase().includes('centrifugeuse'));
    else if (norm.includes('coffret') || norm.includes('alimentation')) subjectEntity = entityList.find(e => e.id.includes('box') || e.id.includes('power') || e.name.toLowerCase().includes('coffret'));
    else if (norm.includes('spectro') || norm.includes('cuvette')) subjectEntity = entityList.find(e => e.id.includes('spectro') || e.name.toLowerCase().includes('spectro') || e.id.includes('cuvette'));
    else if (norm.includes('bain-marie') || norm.includes('bécher') || norm.includes('becher') || norm.includes('thermomètre')) subjectEntity = entityList.find(e => e.id.includes('becher') || e.name.toLowerCase().includes('becher') || e.id.includes('bain'));
    else if (norm.includes('tour') || norm.includes('grille')) subjectEntity = entityList.find(e => e.id.includes('tour') || e.id.includes('lathe') || e.name.toLowerCase().includes('tour') || e.name.toLowerCase().includes('grille'));
    else if (norm.includes('sas') || norm.includes('clapet')) subjectEntity = entityList.find(e => e.id.includes('sas') || e.name.toLowerCase().includes('sas') || e.id.includes('door'));
    else if (norm.includes('pompe')) subjectEntity = entityList.find(e => e.id.includes('pump') || e.id.includes('pompe') || e.name.toLowerCase().includes('pompe'));
  }

  // Si toujours aucune entité trouvée, extraire le syntagme nominal de manière déterministe
  if (!subjectEntity) {
    const nounMatch = instruction.match(/(?:déplace|remplace|installe|modifie|règle|regle|calibre|accroche|pose|mets|lie|connecte|attribue|allume|peins|ajuste|coupe|nettoie|change)\s+(?:le|la|les|l'|un|une|des)?\s*([a-zA-Z0-9_éèêëàâôûùç\s\-]+?)(?:\s+(?:vers|sur|à|dans|pour|par|au|en|du|de la|de l'|des|d'|avec)\b|$)/i);
    let candidateName = nounMatch ? nounMatch[1].trim() : '';
    let canonicalId = candidateName
      ? candidateName
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '_')
          .replace(/^_+|_+$/g, '')
      : '';

    if (canonicalId) {
      subjectEntity = entityList.find(e => e.id === canonicalId || e.id.includes(canonicalId) || canonicalId.includes(e.id));
      if (!subjectEntity) {
        subjectEntity = {
          id: canonicalId,
          name: candidateName,
          capabilities: [
            { type: 'transform', position: { x: 0, y: 0.5, z: 0 } },
            { type: 'collider' }
          ]
        };
      }
    } else {
      const fallbackId = `item_${computeDeterministicHash(instruction).slice(0, 6)}`;
      subjectEntity = {
        id: fallbackId,
        name: instruction.slice(0, 25),
        capabilities: [{ type: 'transform', position: { x: 0, y: 0.5, z: 0 } }, { type: 'collider' }]
      };
    }
  }

  // 1. ACTION DE REMPLACEMENT RÉEL (REPLACE - Priorité absolue avant MOVE/PHYSICS)
  if (norm.includes('remplace') || norm.includes('substitue')) {
    let replacementId = `${subjectEntity.id}_replaced`;
    let newName = `${subjectEntity.name} (Remplacé)`;

    const splitPar = instruction.split(/ par | en /i);
    if (splitPar.length > 1) {
      newName = splitPar[1].trim();
      replacementId = newName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
    }

    if (norm.includes('laser')) replacementId = 'laser_head';
    else if (norm.includes('electrovanne') || norm.includes('électrovanne')) replacementId = 'solenoid_valve';
    else if (norm.includes('rotor')) replacementId = 'high_speed_rotor';

    return {
      category: 'REPLACE',
      targetEntityId: replacementId,
      patch: {
        entitiesRemoved: [subjectEntity.id],
        entitiesCreated: [
          {
            id: replacementId,
            name: newName,
            visuals: { shape: 'cylinder', color: '#38bdf8' },
            capabilities: [
              { type: 'transform', position: { x: 1.5, y: 1.0, z: 0.0 } },
              { type: 'physical_property', value: 1000, active: true },
              { type: 'collider' }
            ]
          }
        ]
      }
    };
  }

  // 2. ACTION D'ATTRIBUTION DE TRAJECTOIRE / NAVIGATION (CHANGE_NAVIGATION)
  if (
    !norm.includes('seuil d\'alerte') &&
    !norm.includes('capteur de pression') &&
    (
      norm.includes('trajectoire') ||
      norm.includes('itinéraire') ||
      norm.includes('itineraire') ||
      norm.includes('route') ||
      norm.includes('patrouille') ||
      norm.includes('traversant') ||
      norm.includes('traverse') ||
      norm.includes('marcher') ||
      norm.includes('tâche prioritaire') ||
      norm.includes('tache prioritaire') ||
      (norm.includes('quête') && norm.includes('évacuation'))
    )
  ) {
    const agentEntity = subjectEntity.capabilities?.some(c => c.type === 'agent')
      ? subjectEntity
      : entityList.find(e => e.capabilities?.some(c => c.type === 'agent')) || subjectEntity;

    const destEntity = targetSecondaryEntity ||
      entityList.find(e => e.capabilities?.some(c => c.type === 'destination') || e.id === 'charging_bay' || e.id === 'escape_door') ||
      { id: 'charging_bay', capabilities: [{ type: 'transform', position: { x: 0, y: 0.5, z: 5.0 } }] };

    const tcAgent = (agentEntity.capabilities || []).find(c => c.type === 'transform');
    const startPos = toVec3Obj(tcAgent?.position, { x: 0, y: 0.3, z: -5.0 });

    const tcDest = (destEntity.capabilities || []).find(c => c.type === 'transform');
    const endPos = toVec3Obj(tcDest?.position, { x: 0, y: 0.5, z: 5.0 });

    // Vérifier si un obstacle physique avec collider obstrue actuellement la trajectoire directe en Z
    // entre l'agent et la destination (zone critique : X proche de 0, Z entre -4 et +4)
    let isObstacleInCorridor = false;
    let obstacleEntityName = '';
    for (const other of entityList) {
      if (other.id !== agentEntity.id && other.id !== destEntity.id) {
        const tcOther = (other.capabilities || []).find(c => c.type === 'transform');
        const hasCollider = (other.capabilities || []).some(c => c.type === 'collider');
        if (tcOther?.position && hasCollider) {
          const otherPos = toVec3Obj(tcOther.position, { x: 0, y: 0, z: 0 });
          const isBetween = otherPos.z > startPos.z && otherPos.z < endPos.z;
          const isCentered = Math.abs(otherPos.x) < 0.8;
          if (isBetween && isCentered) {
            isObstacleInCorridor = true;
            obstacleEntityName = other.name || other.id;
            break;
          }
        }
      }
    }

    // Si un obstacle est déjà présent lors de la planification : calcul de waypoints d'évitement (détour)
    // Sinon : trajectoire directe en ligne droite
    const waypoints: [number, number, number][] = isObstacleInCorridor
      ? [
          [startPos.x, startPos.y, startPos.z],
          [-1.5, 0.3, 0.0], // Contournement sécurisé
          [endPos.x, endPos.y, endPos.z]
        ]
      : [
          [startPos.x, startPos.y, startPos.z],
          [0.0, 0.3, 0.0],  // Ligne directe
          [endPos.x, endPos.y, endPos.z]
        ];

    return {
      category: 'CHANGE_NAVIGATION',
      targetEntityId: agentEntity.id,
      patch: {
        entitiesChanged: [
          {
            id: agentEntity.id,
            capabilities: [
              ...(agentEntity.capabilities || []).filter(c => c.type !== 'navigation_path'),
              {
                type: 'navigation_path',
                targetId: destEntity.id,
                waypoints,
                hasDetour: isObstacleInCorridor,
                obstructed: false,
                obstacleEncountered: obstacleEntityName || null
              }
            ]
          }
        ]
      }
    };
  }

  // 3. ACTION DE DÉPLACEMENT D'ENTITÉ (MOVE)
  if (
    !norm.includes('remplace') &&
    !norm.includes('substitue') &&
    (
      norm.includes('déplace') ||
      norm.includes('deplace') ||
      norm.includes('décale') ||
      norm.includes('decale') ||
      norm.includes('basculer') ||
      norm.includes('move') ||
      norm.includes('pose') ||
      norm.includes('mets') ||
      (/\bplace\b/).test(norm) ||
      norm.includes('installe') ||
      norm.includes('accroche') ||
      norm.includes('positionne')
    )
  ) {
    let targetX = 1.5;
    let targetY = 0.9;
    let targetZ = 0.0;

    // Déplacement spécifique au milieu du couloir de transit / allée principale
    if (
      norm.includes('milieu de l\'allée') ||
      norm.includes('axe de transit') ||
      norm.includes('couloir de circulation') ||
      norm.includes('en travers')
    ) {
      targetX = 0.0;
      targetY = 1.0;
      targetZ = 0.0; // Place l'entité en plein milieu du corridor
    } else if (norm.includes('devant l\'issue') || norm.includes('devant la porte') || norm.includes('devant l\'accès')) {
      targetX = 0.0;
      targetY = 1.0;
      targetZ = 4.5; // Bloque directement l'accès
    } else if (norm.includes('nord') || norm.includes('north')) {
      targetX = 0.0;
      targetY = 0.9;
      targetZ = -8.0; // Zone nord distante
    } else if (norm.includes('sud') || norm.includes('south') || norm.includes('vestiaire')) {
      targetX = 0.0;
      targetY = 0.9;
      targetZ = 8.0; // Zone sud distante
    } else if (norm.includes('est') || norm.includes('east')) {
      targetX = 8.0;
      targetY = 0.9;
      targetZ = 0.0;
    } else if (norm.includes('ouest') || norm.includes('west')) {
      targetX = -8.0;
      targetY = 0.9;
      targetZ = 0.0;
    } else if (norm.includes('gauche')) {
      targetX = -1.8;
    } else if (norm.includes('droite')) {
      targetX = 1.8;
    } else if (norm.includes('crochet du palan') || norm.includes('4 mètres')) {
      targetX = 0.0;
      targetY = 4.0;
      targetZ = 0.0;
    } else if (norm.includes('étagère') || norm.includes('etagere')) {
      targetX = 0.0;
      targetY = 1.4;
      targetZ = 0.0;
    }

    const caps: any[] = [
      ...(subjectEntity.capabilities || []).filter(c => c.type !== 'transform' && c.type !== 'collider' && c.type !== 'mass_stack'),
      { type: 'transform', position: { x: targetX, y: targetY, z: targetZ } },
      { type: 'collider' },
      { type: 'draggable' }
    ];
    if (norm.includes('3 tonnes') || norm.includes('bloc d\'acier')) {
      caps.push({ type: 'mass_stack', massKg: 3000 });
    }

    return {
      category: 'MOVE',
      targetEntityId: subjectEntity.id,
      patch: {
        entitiesChanged: [
          {
            id: subjectEntity.id,
            capabilities: caps
          }
        ]
      }
    };
  }

  // 4. ACTION DE LIAISON CAUSALE OU DÉCLENCHEUR (CONNECT_CAUSAL / CHANGE_TRIGGER)
  if (
    norm.includes('connecte') ||
    norm.includes('associe') ||
    norm.includes('attribue') ||
    norm.includes('relie') ||
    (/\blie\b/).test(norm) ||
    norm.includes('active le seuil') ||
    (/\bactive\b/).test(norm) ||
    norm.includes('programme') ||
    norm.includes('enclenche') ||
    (/\btare\b/).test(norm)
  ) {
    const ruleId = `rule_${subjectEntity.id}_action`;
    const targetEntity = targetSecondaryEntity || entityList.find(e => e.id !== subjectEntity!.id) || { id: 'generator' };

    // Dépendance spatiale forte : la règle mémorise la position spatiale actuelle de l'entité sujet !
    // Si l'entité a bougé avant, les coordonnées concordent. Si elle bouge après, les coordonnées divergent !
    const currentTc = (subjectEntity.capabilities || []).find(c => c.type === 'transform');
    const triggerPos = currentTc?.position ? toVec3Obj(currentTc.position, { x: 0, y: 0.5, z: 0 }) : { x: 0, y: 0.5, z: 0 };

    // Si capteur de pression / pesée : vérifier si une masse lourde est suspendue au-dessus
    const hasHeavyLoad = entityList.some(e => (e.capabilities || []).some((c: any) => c.type === 'mass_stack' && c.massKg >= 1000));

    const rule: RuleSpec = {
      id: ruleId,
      trigger: 'proximity',
      conditions: [
        { type: 'proximity', targetId: subjectEntity.id, radius: 0.4, triggerLocation: triggerPos }
      ],
      actions: [
        { type: 'set_flag', flag: 'activated', targetId: targetEntity.id },
        { type: 'play_sound', sound: 'switch_click' }
      ]
    };

    const extraCaps: any[] = [
      ...(subjectEntity.capabilities || []).filter(c => c.type !== 'clickable' && c.type !== 'sensor'),
      { type: 'clickable', actionTarget: ruleId }
    ];
    if (norm.includes('pesée') || norm.includes('capteur de pression') || subjectEntity.id === 'pressure_sensor') {
      extraCaps.push({ type: 'sensor', active: true, triggered: hasHeavyLoad, readingKg: hasHeavyLoad ? 3000 : 0 });
    }

    return {
      category: 'CONNECT_CAUSAL',
      targetEntityId: subjectEntity.id,
      patch: {
        rulesChanged: [rule],
        entitiesChanged: [
          {
            id: subjectEntity.id,
            capabilities: extraCaps
          }
        ]
      }
    };
  }

  // 4. ACTION COSMÉTIQUE VISUELLE PURE (CHANGE_VISUAL - Strate S3)
  if (norm.includes('couleur') || norm.includes('noir mat') || norm.includes('peins') || norm.includes('teinte')) {
    return {
      category: 'CHANGE_VISUAL',
      targetEntityId: subjectEntity.id,
      patch: {
        entitiesChanged: [
          {
            id: subjectEntity.id,
            visuals: { ...(subjectEntity.visuals || {}), color: '#111827' }
          }
        ]
      }
    };
  }

  // 5. ACTION LUMINEUSE PURE (CHANGE_LIGHT - Strate S3/S4)
  if (norm.includes('intensité') || norm.includes('lumineuse') || norm.includes('50%') || norm.includes('allume')) {
    const lightCaps = (subjectEntity.capabilities || []).filter(c => c.type !== 'light');
    let lightPos: { x: number; y: number; z: number } | undefined = undefined;
    if (norm.includes('sud') || norm.includes('south') || norm.includes('vestiaire')) {
      lightPos = { x: 0.0, y: 2.5, z: 8.0 };
    } else if (norm.includes('nord') || norm.includes('north')) {
      lightPos = { x: 0.0, y: 2.5, z: -8.0 };
    }
    const newCaps: any[] = [...lightCaps.filter(c => !lightPos || c.type !== 'transform'), { type: 'light', intensity: 0.5 }];
    if (lightPos) newCaps.push({ type: 'transform', position: lightPos });

    return {
      category: 'CHANGE_LIGHT',
      targetEntityId: subjectEntity.id,
      patch: {
        entitiesChanged: [
          {
            id: subjectEntity.id,
            capabilities: newCaps
          }
        ]
      }
    };
  }

  // 6. ACTION DE PARAMÉTRAGE PHYSIQUE (CHANGE_PHYSICS)
  if (
    norm.includes('température') ||
    norm.includes('temperature') ||
    norm.includes('puissance') ||
    norm.includes('4500') ||
    norm.includes('calibre') ||
    norm.includes('bars') ||
    norm.includes('seuil') ||
    norm.includes('degrés') ||
    norm.includes('degres') ||
    norm.includes('flamme') ||
    norm.includes('gaz') ||
    norm.includes('vitesse') ||
    norm.includes('rotor') ||
    norm.includes('tours') ||
    norm.includes('débit') ||
    norm.includes('debit') ||
    norm.includes('tension') ||
    norm.includes('lumens') ||
    norm.includes('minuterie') ||
    norm.includes('coupe l\'alimentation') ||
    norm.includes('règle') ||
    norm.includes('regle') ||
    norm.includes('ajuste') ||
    norm.includes('calibre')
  ) {
    let targetId = subjectEntity.id;
    if (norm.includes('laser')) targetId = entityList.find(e => e.id === 'laser_head')?.id || 'laser_head';
    else if (norm.includes('electrovanne') || norm.includes('électrovanne')) targetId = entityList.find(e => e.id === 'solenoid_valve')?.id || 'solenoid_valve';
    else if (norm.includes('rotor')) targetId = entityList.find(e => e.id.includes('rotor'))?.id || 'high_speed_rotor';

    let value = 500;
    const numMatch = norm.match(/\b(\d+(?:\.\d+)?)\b/);
    if (numMatch) {
      value = parseFloat(numMatch[1]);
    } else if (norm.includes('coupe')) {
      value = 0;
    }

    return {
      category: 'CHANGE_PHYSICS',
      targetEntityId: targetId,
      patch: {
        entitiesChanged: [
          {
            id: targetId,
            capabilities: [
              ...(subjectEntity.capabilities || []).filter(c => c.type !== 'physical_property'),
              { type: 'physical_property', value, active: true }
            ]
          }
        ]
      }
    };
  }

  // 8. ACTION DE MODIFICATION DE QUÊTE / OBJECTIF (CHANGE_QUEST)
  if (
    norm.includes('quête') ||
    norm.includes('quete') ||
    norm.includes('objectif') ||
    norm.includes('mission') ||
    norm.includes('exige')
  ) {
    const targetId = subjectEntity.id;
    const hasObstruction = entityList.some(e => {
      if (e.id === targetId) return false;
      const tc = (e.capabilities || []).find((c: any) => c.type === 'transform');
      const targetTc = (subjectEntity.capabilities || []).find((c: any) => c.type === 'transform');
      if (tc?.position && targetTc?.position) {
        const p1 = toVec3Obj(tc.position, { x: 0, y: 0, z: 0 });
        const p2 = toVec3Obj(targetTc.position, { x: 0, y: 0, z: 0 });
        return Math.hypot(p1.x - p2.x, p1.z - p2.z) < 1.2;
      }
      return false;
    }) || (norm.includes('vide') && entityList.some(e => (e.capabilities || []).some((c: any) => c.type === 'physical_property' && c.value === 0)));

    const questId = `quest_${targetId}`;
    return {
      category: 'CHANGE_QUEST',
      targetEntityId: targetId,
      patch: {
        questsAdded: [
          {
            id: questId,
            title: `Mission ${subjectEntity.name}`,
            status: 'in_progress',
            currentStepIndex: 0,
            steps: [
              {
                id: `step_${targetId}`,
                title: `Interagir avec ${subjectEntity.name}`,
                hint: hasObstruction ? 'Dégager la zone avant interaction' : undefined,
                targetEntityId: targetId,
                requiredEvent: 'INTERACT',
                completed: false
              }
            ]
          }
        ],
        activeQuestId: questId
      }
    };
  }

  // Fallback générique
  return {
    category: 'COMPOSITE',
    targetEntityId: subjectEntity.id,
    patch: {
      entitiesChanged: [
        {
          id: subjectEntity.id,
          capabilities: [
            ...(subjectEntity.capabilities || []).filter(c => c.type !== 'state_updated'),
            { type: 'state_updated', timestamp: 0 }
          ]
        }
      ]
    }
  };
}

export { verifyPatchSatisfaction } from './verifyPatchSatisfaction';
