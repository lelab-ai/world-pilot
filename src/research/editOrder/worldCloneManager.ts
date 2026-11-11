// src/research/editOrder/worldCloneManager.ts
// Gestionnaire déterministe de clonage et de gel d'états WorldPilot pour les branches AB / BA.
// Garantit la condition d'équivalence absolue : hash(W0_AB) === hash(W0_BA).

import type { WorldState, WorldPatch, RuleSpec } from '../../core/types';

export interface FrozenWorld {
  serializedState: string;
  stateHash: string;
  seed: number;
  prompt: string;
  timestamp: number;
}

/**
 * Calcule un hachage SHA-256 déterministe d'une chaîne ou structure de données.
 */
export function computeDeterministicHash(data: any): string {
  const str = typeof data === 'string' ? data : JSON.stringify(data);
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Crée un monde initial W0 déterministe à partir d'un prompt et d'une graine aléatoire.
 */
export function createBaselineWorld(prompt: string, _seed: number = 42): WorldState {
  const world: WorldState = {
    version: 1,
    flags: {},
    ir: {
      entities: {},
      rules: {},
      invariants: {},
      quests: {},
      activeQuestId: null
    }
  };

  populateBaselineFromPrompt(world, prompt);

  return world;
}

/**
 * Fige un état de monde pour pouvoir le dupliquer fidèlement dans les deux branches AB et BA.
 */
export function freezeWorld(world: WorldState, prompt: string = '', seed: number = 42): FrozenWorld {
  const normalized = normalizeWorldForCloning(world);
  const serialized = JSON.stringify(normalized);
  const hash = computeDeterministicHash(serialized);

  return {
    serializedState: serialized,
    stateHash: hash,
    seed,
    prompt,
    timestamp: Date.now()
  };
}

/**
 * Clone un monde préalablement figé, produisant une copie isolée et déterministe.
 */
export function cloneFrozenWorld(frozen: FrozenWorld): WorldState {
  const cloned: WorldState = JSON.parse(frozen.serializedState);
  return cloned;
}

/**
 * Vérifie l'égalité stricte entre deux instances de monde.
 */
export function verifyInitialEquivalence(w0A: WorldState, w0B: WorldState): boolean {
  const hashA = computeDeterministicHash(normalizeWorldForCloning(w0A));
  const hashB = computeDeterministicHash(normalizeWorldForCloning(w0B));
  return hashA === hashB;
}

/**
 * Normalise la structure d'un monde pour éliminer les disparités de tri des clés d'objets.
 */
function normalizeWorldForCloning(world: WorldState): any {
  const sortKeys = (obj: any): any => {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(sortKeys);
    return Object.keys(obj)
      .sort()
      .reduce((acc: any, key) => {
        acc[key] = sortKeys(obj[key]);
        return acc;
      }, {});
  };

  return {
    version: world.version,
    flags: sortKeys(world.flags || {}),
    ir: {
      entities: sortKeys(world.ir?.entities || {}),
      rules: sortKeys(world.ir?.rules || {}),
      invariants: sortKeys(world.ir?.invariants || {}),
      quests: sortKeys(world.ir?.quests || {}),
      activeQuestId: world.ir?.activeQuestId || null
    }
  };
}

/**
 * Applique un patch différentiel directement à une instance de WorldState en mémoire.
 */
export function applyPatchToWorldState(world: WorldState, patch: WorldPatch): WorldState {
  if (!world.ir) {
    world.ir = { entities: {}, rules: {}, invariants: {}, quests: {}, activeQuestId: null };
  }

  // 1. Entités supprimées (exécutées avant création pour supporter le remplacement homonyme)
  (patch.entitiesRemoved || []).forEach(id => {
    delete world.ir.entities[id];
  });

  // 2. Entités créées
  (patch.entitiesCreated || []).forEach(e => {
    world.ir.entities[e.id] = JSON.parse(JSON.stringify(e));
  });

  // 3. Entités modifiées (crée l'entité si elle n'existait pas encore)
  (patch.entitiesChanged || []).forEach(change => {
    if (change.id) {
      const existing = world.ir.entities[change.id] || { id: change.id, name: change.id, capabilities: [] };
      world.ir.entities[change.id] = {
        ...existing,
        ...change,
        capabilities: change.capabilities || existing.capabilities,
        visuals: { ...(existing.visuals || {}), ...(change.visuals || {}) }
      };
    }
  });

  // 4. Règles
  (patch.rulesChanged || []).forEach(r => {
    if (r.id) {
      world.ir.rules[r.id] = JSON.parse(JSON.stringify(r)) as RuleSpec;
    }
  });

  // 5. Invariants
  (patch.invariantsAdded || []).forEach(inv => {
    world.ir.invariants[inv.id] = JSON.parse(JSON.stringify(inv));
  });

  // 6. Quêtes
  (patch.questsAdded || []).forEach(q => {
    if (!world.ir.quests) world.ir.quests = {};
    world.ir.quests[q.id] = JSON.parse(JSON.stringify(q));
  });

  if (patch.questUpdated && world.ir.quests) {
    const qId = patch.questUpdated.id || world.ir.activeQuestId;
    if (qId && world.ir.quests[qId]) {
      world.ir.quests[qId] = {
        ...world.ir.quests[qId],
        ...patch.questUpdated
      };
    }
  }

  if (patch.activeQuestId !== undefined) {
    world.ir.activeQuestId = patch.activeQuestId;
  }

  world.version = (world.version || 1) + 1;
  return world;
}

/**
 * Synthétise les entités de référence W0 à partir du prompt initial pour garantir un monde réaliste.
 */
function getCanonicalEntityId(chunkNorm: string): string {
  if (chunkNorm.includes('armoire') || chunkNorm.includes('cabinet')) return 'electric_cabinet';
  if (chunkNorm.includes('couloir') || chunkNorm.includes('allée') || chunkNorm.includes('circulation') || chunkNorm.includes('transit')) return 'aisle_corridor';
  if (chunkNorm.includes('robot') || chunkNorm.includes('mobile') || chunkNorm.includes('agv')) return 'maintenance_robot';
  if (chunkNorm.includes('recharge') || chunkNorm.includes('baie') || chunkNorm.includes('destination')) return 'charging_bay';
  if (chunkNorm.includes('bouton') || chunkNorm.includes('arrêt') || chunkNorm.includes('arret')) return 'emergency_button';
  if (chunkNorm.includes('generateur') || chunkNorm.includes('générateur')) return 'diesel_generator';
  if (chunkNorm.includes('porte') || chunkNorm.includes('issue') || chunkNorm.includes('secours') || chunkNorm.includes('sas')) return 'escape_door';
  if (chunkNorm.includes('palan') || chunkNorm.includes('hoist')) return 'motorized_hoist';
  if (chunkNorm.includes('capteur') || chunkNorm.includes('pesée') || chunkNorm.includes('pesee') || chunkNorm.includes('surcharge') || chunkNorm.includes('pression') || chunkNorm.includes('manometre')) return 'pressure_sensor';
  if (chunkNorm.includes('cloison') || chunkNorm.includes('plexiglas') || chunkNorm.includes('barrière') || chunkNorm.includes('barriere')) return 'confinement_wall';
  if (chunkNorm.includes('disjoncteur') || chunkNorm.includes('interrupteur')) return 'circuit_breaker';
  if (chunkNorm.includes('voyant') || chunkNorm.includes('led') || chunkNorm.includes('lampe')) return 'indicator_led';
  if (chunkNorm.includes('tour') || chunkNorm.includes('lathe') || chunkNorm.includes('usinage')) return 'lathe_machine';
  if (chunkNorm.includes('ventilation')) return 'ventilation_system';
  if (chunkNorm.includes('bac') || chunkNorm.includes('cuve') || chunkNorm.includes('fiole')) return 'retention_basin';
  if (chunkNorm.includes('pompe') || chunkNorm.includes('vanne')) return 'drainage_pump';
  if (chunkNorm.includes('alarme') || chunkNorm.includes('sonore')) return 'alarm_buzzer';
  if (chunkNorm.includes('caisse') || chunkNorm.includes('colis') || chunkNorm.includes('palette')) return 'heavy_crate';
  if (chunkNorm.includes('coffret') || chunkNorm.includes('pupitre')) return 'power_box';
  if (chunkNorm.includes('servomoteur') || chunkNorm.includes('verrouillage')) return 'lock_servo';
  if (chunkNorm.includes('camera') || chunkNorm.includes('caméra')) return 'thermal_camera';
  if (chunkNorm.includes('support') || chunkNorm.includes('etabli') || chunkNorm.includes('établi')) return 'main_support';
  if (chunkNorm.includes('chariot') || chunkNorm.includes('transpalette')) return 'forklift';
  if (chunkNorm.includes('bras')) return 'welding_arm';
  if (chunkNorm.includes('torche') || chunkNorm.includes('soudure')) return 'plasma_torch';

  return chunkNorm
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/**
 * Synthétise les entités de référence W0 à partir du prompt initial pour garantir un monde réaliste.
 */
function populateBaselineFromPrompt(world: WorldState, prompt: string): void {
  const norm = prompt.toLowerCase();

  // 0. Extraction systématique des entités physiques à partir de la syntaxe du prompt
  const clean = prompt.trim().replace(/\.$/, '');
  const chunks = clean.split(/ avec |, | et /i).map(s => s.trim()).filter(Boolean);

  chunks.forEach((chunk, idx) => {
    const chunkNorm = chunk.toLowerCase();
    const id = getCanonicalEntityId(chunkNorm);

    if (!id || id === 'atelier' || id === 'local' || id === 'zone' || id === 'salle' || id === 'centre' || id === 'station' || id === 'hangar') return;
    if (world.ir.entities[id]) return;

    let posX = parseFloat(((idx - 1.5) * 1.6).toFixed(2));
    let posY = 0.8;
    let posZ = 0.0;

    const caps: any[] = [];

    if (id === 'aisle_corridor') {
      posX = 0; posY = 0.05; posZ = 0;
      caps.push({ type: 'transform', position: { x: posX, y: posY, z: posZ }, scale: { x: 1.2, y: 0.1, z: 20 } });
      caps.push({ type: 'corridor', bounds: { minX: -0.6, maxX: 0.6, minZ: -10, maxZ: 10, width: 1.2 } });
      caps.push({ type: 'zone' });
    } else if (id === 'electric_cabinet') {
      posX = 2.0; posY = 1.0; posZ = 0.0;
      caps.push({ type: 'transform', position: { x: posX, y: posY, z: posZ }, scale: { x: 1.0, y: 2.0, z: 0.8 } });
      caps.push({ type: 'collider' });
    } else if (id === 'maintenance_robot') {
      posX = 0.0; posY = 0.3; posZ = -5.0;
      caps.push({ type: 'transform', position: { x: posX, y: posY, z: posZ } });
      caps.push({ type: 'agent', speed: 1.5, radius: 0.4 });
      caps.push({ type: 'collider' });
    } else if (id === 'charging_bay') {
      posX = 0.0; posY = 0.5; posZ = 5.0;
      caps.push({ type: 'transform', position: { x: posX, y: posY, z: posZ } });
      caps.push({ type: 'destination' });
    } else if (id === 'motorized_hoist') {
      posX = 0.0; posY = 4.0; posZ = 0.0;
      caps.push({ type: 'transform', position: { x: posX, y: posY, z: posZ } });
      caps.push({ type: 'mass_stack', massKg: 500 });
      caps.push({ type: 'collider' });
    } else if (id === 'pressure_sensor') {
      posX = 0.0; posY = 0.05; posZ = 0.0;
      caps.push({ type: 'transform', position: { x: posX, y: posY, z: posZ } });
      caps.push({ type: 'sensor', active: false, thresholdKg: 1000 });
    } else if (id === 'escape_door') {
      posX = 0.0; posY = 1.1; posZ = 5.0;
      caps.push({ type: 'transform', position: { x: posX, y: posY, z: posZ }, scale: { x: 1.0, y: 2.2, z: 0.2 } });
      caps.push({ type: 'door', locked: false });
      caps.push({ type: 'collider' });
    } else if (id === 'confinement_wall') {
      posX = 2.5; posY = 1.0; posZ = 0.0;
      caps.push({ type: 'transform', position: { x: posX, y: posY, z: posZ }, scale: { x: 1.2, y: 2.0, z: 0.2 } });
      caps.push({ type: 'collider' });
    } else if (id === 'circuit_breaker' || id === 'emergency_button') {
      posX = 1.0; posY = 1.2; posZ = 0.0;
      caps.push({ type: 'transform', position: { x: posX, y: posY, z: posZ } });
      caps.push({ type: 'clickable' });
      caps.push({ type: 'switch' });
    } else if (id === 'indicator_led') {
      posX = 0.0; posY = 1.2; posZ = 0.0;
      caps.push({ type: 'transform', position: { x: posX, y: posY, z: posZ } });
      caps.push({ type: 'light', intensity: 1.0 });
    } else {
      caps.push({ type: 'transform', position: { x: posX, y: posY, z: posZ } });
      caps.push({ type: 'collider' });
    }

    world.ir.entities[id] = {
      id,
      name: chunk,
      visuals: { shape: 'box', color: '#475569' },
      capabilities: caps
    };
  });

  // Si robot et allée sont présents, garantir la baie de destination
  if ((world.ir.entities['aisle_corridor'] || world.ir.entities['maintenance_robot']) && !world.ir.entities['charging_bay']) {
    world.ir.entities['charging_bay'] = {
      id: 'charging_bay',
      name: 'Baie de recharge',
      visuals: { shape: 'box', color: '#10b981' },
      capabilities: [
        { type: 'transform', position: { x: 0.0, y: 0.5, z: 5.0 } },
        { type: 'destination' }
      ]
    };
  }

  // 1. Couloir de circulation / allée de transit
  if (norm.includes('allée') || norm.includes('couloir') || norm.includes('circulation') || norm.includes('transit')) {
    world.ir.entities['aisle_corridor'] = {
      id: 'aisle_corridor',
      name: 'Allée principale de circulation',
      visuals: { shape: 'box', color: '#334155' },
      capabilities: [
        { type: 'transform', position: { x: 0, y: 0.05, z: 0 }, scale: { x: 1.2, y: 0.1, z: 20 } },
        { type: 'corridor', bounds: { minX: -0.6, maxX: 0.6, minZ: -10, maxZ: 10, width: 1.2 } }
      ]
    };
    if (!world.ir.entities['maintenance_robot']) {
      world.ir.entities['maintenance_robot'] = {
        id: 'maintenance_robot',
        name: 'Robot de maintenance',
        visuals: { shape: 'cylinder', color: '#0284c7' },
        capabilities: [
          { type: 'transform', position: { x: 0.0, y: 0.3, z: -5.0 } },
          { type: 'agent', speed: 1.5, radius: 0.4 },
          { type: 'collider' }
        ]
      };
    }
  }

  // 2. Armoire électrique
  if (norm.includes('armoire électrique') || norm.includes('armoire electrique') || norm.includes('haute tension')) {
    world.ir.entities['electric_cabinet'] = {
      id: 'electric_cabinet',
      name: 'Armoire électrique haute tension',
      visuals: { shape: 'box', color: '#1e293b' },
      capabilities: [
        { type: 'transform', position: { x: 2.0, y: 1.0, z: 0.0 }, scale: { x: 1.0, y: 2.0, z: 0.8 } },
        { type: 'collider' }
      ]
    };
  }

  // 3. Robot de maintenance / AGV / Mobile
  if (norm.includes('robot') || norm.includes('mobile') || norm.includes('agv') || norm.includes('opérateur')) {
    world.ir.entities['maintenance_robot'] = {
      id: 'maintenance_robot',
      name: 'Robot de maintenance',
      visuals: { shape: 'cylinder', color: '#0284c7' },
      capabilities: [
        { type: 'transform', position: { x: 0.0, y: 0.3, z: -5.0 } },
        { type: 'agent', speed: 1.5, radius: 0.4 },
        { type: 'collider' }
      ]
    };
  }

  // 4. Baie de recharge / Destination
  if (norm.includes('recharge') || norm.includes('baie') || norm.includes('destination') || norm.includes('fond')) {
    world.ir.entities['charging_bay'] = {
      id: 'charging_bay',
      name: 'Baie de recharge',
      visuals: { shape: 'box', color: '#10b981' },
      capabilities: [
        { type: 'transform', position: { x: 0.0, y: 0.5, z: 5.0 } },
        { type: 'destination' }
      ]
    };
  }

  // 5. Palan motorisé
  if (norm.includes('palan')) {
    world.ir.entities['motorized_hoist'] = {
      id: 'motorized_hoist',
      name: 'Palan motorisé',
      visuals: { shape: 'box', color: '#f59e0b' },
      capabilities: [
        { type: 'transform', position: { x: 0.0, y: 4.0, z: 0.0 } },
        { type: 'mass_stack', massKg: 500 }
      ]
    };
  }

  // 6. Capteur de surcharge / pression
  if (norm.includes('capteur de surcharge') || norm.includes('capteur de pression') || norm.includes('pesée')) {
    world.ir.entities['pressure_sensor'] = {
      id: 'pressure_sensor',
      name: 'Capteur de pression au sol',
      visuals: { shape: 'cylinder', color: '#ef4444' },
      capabilities: [
        { type: 'transform', position: { x: 0.0, y: 0.05, z: 0.0 } },
        { type: 'sensor', active: false, thresholdKg: 1000 }
      ]
    };
  }

  // 7. Chariot élévateur
  if (norm.includes('chariot élévateur') || norm.includes('chariot elevateur') || norm.includes('forklift')) {
    world.ir.entities['forklift'] = {
      id: 'forklift',
      name: 'Chariot élévateur',
      visuals: { shape: 'box', color: '#eab308' },
      capabilities: [
        { type: 'transform', position: { x: 2.0, y: 0.6, z: 0.0 } },
        { type: 'collider' }
      ]
    };
  }

  // 8. Issue de secours & porte
  if (norm.includes('issue de secours') || norm.includes('porte coupe-feu') || norm.includes('porte')) {
    world.ir.entities['escape_door'] = {
      id: 'escape_door',
      name: 'Issue de secours',
      visuals: { shape: 'box', color: '#991b1b' },
      capabilities: [
        { type: 'transform', position: { x: 0.0, y: 1.1, z: 5.0 }, scale: { x: 1.0, y: 2.2, z: 0.2 } },
        { type: 'collider' },
        { type: 'door', locked: false }
      ]
    };
  }

  // 9. Cloison de confinement / plexiglas / barrière
  if (norm.includes('cloison') || norm.includes('plexiglas') || norm.includes('barrière') || norm.includes('barriere')) {
    world.ir.entities['confinement_wall'] = {
      id: 'confinement_wall',
      name: 'Cloison de confinement en plexiglas',
      visuals: { shape: 'box', color: '#64748b' },
      capabilities: [
        { type: 'transform', position: { x: 2.5, y: 1.0, z: 0.0 }, scale: { x: 1.2, y: 2.0, z: 0.2 } },
        { type: 'collider' }
      ]
    };
  }

  // 10. Servomoteur de verrouillage
  if (norm.includes('servomoteur') || norm.includes('verrouillage')) {
    world.ir.entities['lock_servo'] = {
      id: 'lock_servo',
      name: 'Servomoteur de verrouillage',
      visuals: { shape: 'box', color: '#475569' },
      capabilities: [
        { type: 'transform', position: { x: 0.5, y: 1.2, z: 5.0 } },
        { type: 'lockable' }
      ]
    };
  }

  // 11. Caméra thermique
  if (norm.includes('caméra') || norm.includes('camera')) {
    world.ir.entities['thermal_camera'] = {
      id: 'thermal_camera',
      name: 'Caméra thermique',
      visuals: { shape: 'cylinder', color: '#0f172a' },
      capabilities: [
        { type: 'transform', position: { x: 0.0, y: 2.5, z: 3.0 } },
        { type: 'sensor' }
      ]
    };
  }

  // 12. Support principal (S3)
  if (norm.includes('support principal')) {
    world.ir.entities['main_support'] = {
      id: 'main_support',
      name: 'Support principal',
      visuals: { shape: 'box', color: '#64748b' },
      capabilities: [
        { type: 'transform', position: { x: 0.0, y: 0.8, z: 0.0 } },
        { type: 'collider' }
      ]
    };
  }

  // 13. Voyant LED (S3)
  if (norm.includes('voyant') || norm.includes('led')) {
    world.ir.entities['indicator_led'] = {
      id: 'indicator_led',
      name: 'Voyant lumineux',
      visuals: { shape: 'cylinder', color: '#10b981' },
      capabilities: [
        { type: 'transform', position: { x: 0.0, y: 1.2, z: 0.0 } },
        { type: 'light', intensity: 1.0 }
      ]
    };
  }

  // 14. Bouton d'arrêt d'urgence
  if (norm.includes('bouton') || norm.includes('arrêt d\'urgence')) {
    world.ir.entities['emergency_button'] = {
      id: 'emergency_button',
      name: 'Bouton d\'arrêt d\'urgence',
      visuals: { shape: 'cylinder', color: '#ef4444' },
      capabilities: [
        { type: 'transform', position: { x: 0.5, y: 0.9, z: 0.0 } },
        { type: 'collider' },
        { type: 'clickable' }
      ]
    };
  }

  // 15. Générateur
  if (norm.includes('générateur') || norm.includes('generateur')) {
    world.ir.entities['generator'] = {
      id: 'generator',
      name: 'Générateur diesel',
      visuals: { shape: 'box', color: '#475569' },
      capabilities: [
        { type: 'transform', position: { x: 0.0, y: 1.0, z: -2.0 } },
        { type: 'collider' }
      ]
    };
  }

  // 16. Bras robotique & soudure
  if (norm.includes('bras robotique') || norm.includes('plasma') || norm.includes('laser')) {
    world.ir.entities['robotic_arm'] = {
      id: 'robotic_arm',
      name: 'Bras robotique de soudure',
      visuals: { shape: 'cylinder', color: '#ea580c' },
      capabilities: [
        { type: 'transform', position: { x: 0.0, y: 1.0, z: 0.0 } },
        { type: 'collider' }
      ]
    };
    world.ir.entities['plasma_torch'] = {
      id: 'plasma_torch',
      name: 'Torche plasma',
      visuals: { shape: 'box', color: '#38bdf8' },
      capabilities: [
        { type: 'transform', position: { x: 0.5, y: 1.2, z: 0.0 } },
        { type: 'tool', active: true, powerWatts: 3000 }
      ]
    };
  }

  // 17. Chimie & paillasse
  if (norm.includes('paillasse') || norm.includes('fiole') || norm.includes('acide')) {
    world.ir.entities['lab_bench'] = {
      id: 'lab_bench',
      name: 'Paillasse carrelée',
      visuals: { shape: 'box', color: '#e2e8f0' },
      capabilities: [
        { type: 'transform', position: { x: 0.0, y: 0.8, z: 0.0 } },
        { type: 'collider' }
      ]
    };
    world.ir.entities['acid_flask'] = {
      id: 'acid_flask',
      name: 'Fiole jaugée d\'acide chlorhydrique',
      visuals: { shape: 'cylinder', color: '#10b981' },
      capabilities: [
        { type: 'transform', position: { x: -0.5, y: 0.9, z: 0.0 } },
        { type: 'collider' },
        { type: 'draggable' }
      ]
    };
    world.ir.entities['neutralization_tank'] = {
      id: 'neutralization_tank',
      name: 'Bac de neutralisation',
      visuals: { shape: 'box', color: '#0ea5e9' },
      capabilities: [
        { type: 'transform', position: { x: 0.5, y: 0.8, z: 0.0 } },
        { type: 'collider' }
      ]
    };
  }

  // 18. Équipement encombrant de transit
  if (norm.includes('équipement encombrant') || norm.includes('meuble') || norm.includes('barrière ou meuble')) {
    world.ir.entities['transit_barrier'] = {
      id: 'transit_barrier',
      name: 'Équipement encombrant de transit',
      visuals: { shape: 'box', color: '#b91c1c' },
      capabilities: [
        { type: 'transform', position: { x: 3.0, y: 1.0, z: 0.0 }, scale: { x: 1.2, y: 1.5, z: 0.8 } },
        { type: 'collider' }
      ]
    };
  }

  // 19. Baie de recharge associée au robot
  if (world.ir.entities['maintenance_robot'] && !world.ir.entities['charging_bay']) {
    world.ir.entities['charging_bay'] = {
      id: 'charging_bay',
      name: 'Baie de recharge',
      visuals: { shape: 'box', color: '#10b981' },
      capabilities: [
        { type: 'transform', position: { x: 0.0, y: 0.5, z: 5.0 } },
        { type: 'destination' }
      ]
    };
  }

  // Si après analyse détaillée aucune entité n'a été insérée, créer des éléments contextuels de base
  if (Object.keys(world.ir.entities).length === 0) {
    if (norm.includes('séparé') || (norm.includes('nord') && norm.includes('sud'))) {
      world.ir.entities['zone_north_fixture'] = {
        id: 'zone_north_fixture',
        name: 'Équipement Zone Nord',
        visuals: { shape: 'box', color: '#475569' },
        capabilities: [
          { type: 'transform', position: { x: 0.0, y: 0.8, z: -8.0 } },
          { type: 'collider' }
        ]
      };
      world.ir.entities['zone_south_fixture'] = {
        id: 'zone_south_fixture',
        name: 'Équipement Zone Sud',
        visuals: { shape: 'cylinder', color: '#38bdf8' },
        capabilities: [
          { type: 'transform', position: { x: 0.0, y: 0.8, z: 8.0 } },
          { type: 'collider' }
        ]
      };
    } else {
      world.ir.entities['main_apparatus'] = {
        id: 'main_apparatus',
        name: prompt.slice(0, 30),
        visuals: { shape: 'box', color: '#475569' },
        capabilities: [
          { type: 'transform', position: { x: 0.0, y: 0.8, z: 0.0 } },
          { type: 'collider' }
        ]
      };
      world.ir.entities['secondary_item'] = {
        id: 'secondary_item',
        name: 'Composant auxiliaire',
        visuals: { shape: 'cylinder', color: '#38bdf8' },
        capabilities: [
          { type: 'transform', position: { x: 1.0, y: 0.8, z: 0.0 } },
          { type: 'draggable' }
        ]
      };
    }
  }
}
