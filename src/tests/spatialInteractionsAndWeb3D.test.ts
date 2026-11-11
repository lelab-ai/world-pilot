import assert from 'assert';
import { evaluateSpatialCausality, findNearestCausalityAffordance } from '../engine/spatialCausality';
import { EntitySpec } from '../core/types';

function runCausalityTests() {
  console.log('--- RUNNING SPATIAL CAUSALITY & WEB 3D TEST SUITE ---');

  // Test 1: Knife + Chopping Board (slice_chop)
  const knife: EntitySpec = {
    id: 'chef_knife_1',
    name: 'Couteau de chef',
    capabilities: [
      { type: 'transform', position: { x: 0, y: 1.05, z: 0.2 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
      { type: 'visual', assetId: 'knife_japanese_pro' }
    ]
  };

  const cuttingBoard: EntitySpec = {
    id: 'cutting_board_oak',
    name: 'Planche à découper en chêne',
    capabilities: [
      { type: 'transform', position: { x: 0, y: 0.9, z: 0.2 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
      { type: 'visual', assetId: 'cutting_board' }
    ]
  };

  const affordanceChop = evaluateSpatialCausality(knife, cuttingBoard);
  assert(affordanceChop !== null, 'Knife + cutting board should produce an affordance');
  assert.strictEqual(affordanceChop?.type, 'slice_chop');
  assert.strictEqual(affordanceChop?.sound, 'knife_chop');
  assert(affordanceChop?.label.includes('Émincer'), 'Label should indicate slicing/chopping');
  console.log('✔ Test 1 (Knife + Cutting Board) passed:', affordanceChop?.label);

  // Test 2: Ingredient (Carrot) + Cookware (Cocotte) (cook_simmer)
  const carrot: EntitySpec = {
    id: 'carotte_bio',
    name: 'Carottes fraîches',
    capabilities: [
      { type: 'transform', position: { x: 0.2, y: 1.1, z: 0.2 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } }
    ]
  };

  const cocotte: EntitySpec = {
    id: 'cocotte_fonte_staub',
    name: 'Cocotte en fonte émaillée',
    capabilities: [
      { type: 'transform', position: { x: 0.2, y: 0.92, z: 0.2 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } }
    ]
  };

  const affordanceCook = evaluateSpatialCausality(carrot, cocotte);
  assert(affordanceCook !== null, 'Ingredient + cocotte should produce cooking affordance');
  assert.strictEqual(affordanceCook?.type, 'cook_simmer');
  assert.strictEqual(affordanceCook?.particleType, 'steam');
  assert.strictEqual(affordanceCook?.sound, 'sizzle_cook');
  console.log('✔ Test 2 (Ingredient + Cookware) passed:', affordanceCook?.label);

  // Test 3: Bottle + Glass / Cup (pour_liquid)
  const bottle: EntitySpec = {
    id: 'bouteille_huile_olive',
    name: 'Huile d’olive de Provence',
    capabilities: [
      { type: 'transform', position: { x: -0.3, y: 1.1, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } }
    ]
  };

  const glass: EntitySpec = {
    id: 'verre_degustation',
    name: 'Verre à dégustation',
    capabilities: [
      { type: 'transform', position: { x: -0.3, y: 0.9, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } }
    ]
  };

  const affordancePour = evaluateSpatialCausality(bottle, glass);
  assert(affordancePour !== null, 'Bottle + Glass should produce pouring affordance');
  assert.strictEqual(affordancePour?.type, 'pour_liquid');
  assert.strictEqual(affordancePour?.particleType, 'splash');
  console.log('✔ Test 3 (Bottle + Glass) passed:', affordancePour?.label);

  // Test 4: Book + Desk / Lectern (read_study)
  const book: EntitySpec = {
    id: 'livre_recettes_escoffier',
    name: 'Le Guide Culinaire - Escoffier',
    capabilities: [
      { type: 'transform', position: { x: 0.5, y: 1.0, z: -0.1 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
      { type: 'web_screen', url: 'https://fr.m.wikipedia.org/wiki/Auguste_Escoffier' }
    ]
  };

  const desk: EntitySpec = {
    id: 'bureau_lecture_noyer',
    name: 'Pupitre de lecture',
    capabilities: [
      { type: 'transform', position: { x: 0.5, y: 0.88, z: -0.1 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } }
    ]
  };

  const affordanceRead = evaluateSpatialCausality(book, desk);
  assert(affordanceRead !== null, 'Book + Desk should produce reading affordance');
  assert.strictEqual(affordanceRead?.type, 'read_study');
  assert.strictEqual(affordanceRead?.particleType, 'glow');
  console.log('✔ Test 4 (Book + Desk) passed:', affordanceRead?.label);

  // Test 5: Key / Battery + Lock / Terminal (unlock_circuit)
  const key: EntitySpec = {
    id: 'cle_securite_cryo',
    name: 'Clé d’accès sécurisée',
    capabilities: [
      { type: 'transform', position: { x: 1.0, y: 1.0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } }
    ]
  };

  const lock: EntitySpec = {
    id: 'serrure_porte_sas',
    name: 'Terminal de verrouillage sas',
    capabilities: [
      { type: 'transform', position: { x: 1.0, y: 0.95, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } }
    ]
  };

  const affordanceUnlock = evaluateSpatialCausality(key, lock);
  assert(affordanceUnlock !== null, 'Key + Lock should produce unlock affordance');
  assert.strictEqual(affordanceUnlock?.type, 'unlock_circuit');
  assert.strictEqual(affordanceUnlock?.particleType, 'chime');
  console.log('✔ Test 5 (Key + Lock) passed:', affordanceUnlock?.label);

  // Test 6: findNearestCausalityAffordance within proximity vs out of reach
  const allEntities: Record<string, EntitySpec> = {
    [knife.id]: knife,
    [cuttingBoard.id]: cuttingBoard,
    [cocotte.id]: cocotte,
    [desk.id]: desk
  };

  // Close to cutting board (distance < 0.7m)
  const nearAffordance = findNearestCausalityAffordance(knife, allEntities, { x: 0.05, y: 0.95, z: 0.22 });
  assert(nearAffordance !== null, 'Near position should find cutting board affordance');
  assert.strictEqual(nearAffordance?.targetEntity.id, cuttingBoard.id);

  // Far away (distance > 2.0m)
  const farAffordance = findNearestCausalityAffordance(knife, allEntities, { x: 5.0, y: 0.95, z: 5.0 });
  assert(farAffordance === null, 'Far position should find no affordance');
  console.log('✔ Test 6 (Proximity lookup & distance filtering) passed');

  // Test 7: Blueprint Dossier + Bookshelf (read_study)
  const blueprint: EntitySpec = {
    id: 'dossier_plans_architecture',
    name: 'Plans CAO & Schémas Techniques',
    capabilities: [
      { type: 'transform', position: { x: 0, y: 1.0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
      { type: 'web_screen', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' }
    ],
    visuals: { assetId: 'porte-documents' }
  };

  const bookshelf: EntitySpec = {
    id: 'bibliotheque_chene',
    name: 'Grande Bibliothèque & Rayonnage',
    capabilities: [
      { type: 'transform', position: { x: 0, y: 0.9, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } }
    ],
    visuals: { assetId: 'etagere' }
  };

  const affordanceBlueprint = evaluateSpatialCausality(blueprint, bookshelf);
  assert(affordanceBlueprint !== null, 'Blueprint + Bookshelf should produce read_study affordance');
  assert.strictEqual(affordanceBlueprint?.type, 'read_study');
  console.log('✔ Test 7 (Blueprint + Bookshelf) passed:', affordanceBlueprint?.label);

  // Test 8: Wine bottle + Cookware (pour_liquid deglazing)
  const wineBottle: EntitySpec = {
    id: 'bouteille_bordeaux',
    name: 'Bouteille de vin rouge pour déglaçage',
    capabilities: [
      { type: 'transform', position: { x: 0.2, y: 1.15, z: 0.2 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } }
    ]
  };

  const affordanceDeglaze = evaluateSpatialCausality(wineBottle, cocotte);
  assert(affordanceDeglaze !== null, 'Wine bottle + Cocotte should produce deglazing affordance');
  assert.strictEqual(affordanceDeglaze?.type, 'pour_liquid');
  assert.strictEqual(affordanceDeglaze?.particleType, 'steam');
  assert(affordanceDeglaze?.label.includes('Déglacer'), 'Label should indicate deglazing');
  console.log('✔ Test 8 (Wine Bottle + Cocotte deglazing) passed:', affordanceDeglaze?.label);

  // Test 9: Match / Candle + Campfire (ignite_fire)
  const match: EntitySpec = {
    id: 'allumette_suedoise',
    name: 'Allumette en bois allumée',
    capabilities: [
      { type: 'transform', position: { x: 0, y: 0.5, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } }
    ]
  };

  const campfire: EntitySpec = {
    id: 'feu_de_bois_cheminee',
    name: 'Foyer et bûches de cheminée',
    capabilities: [
      { type: 'transform', position: { x: 0, y: 0.4, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } }
    ]
  };

  const affordanceFire = evaluateSpatialCausality(match, campfire);
  assert(affordanceFire !== null, 'Match + Campfire should produce fire ignition affordance');
  assert.strictEqual(affordanceFire?.type, 'ignite_fire');
  assert.strictEqual(affordanceFire?.particleType, 'spark');
  assert.strictEqual(affordanceFire?.sound, 'ignite_fire');
  console.log('✔ Test 9 (Match + Campfire ignition) passed:', affordanceFire?.label);

  // Test 10: Ingredient + Ceramic Plate (stack_contain)
  const plate: EntitySpec = {
    id: 'assiette_porcelaine_limoges',
    name: 'Assiette de présentation',
    capabilities: [
      { type: 'transform', position: { x: -0.5, y: 0.85, z: 0.1 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } }
    ]
  };

  const affordancePlate = evaluateSpatialCausality(carrot, plate);
  assert(affordancePlate !== null, 'Food + Plate should produce stack_contain affordance');
  assert.strictEqual(affordancePlate?.type, 'stack_contain');
  assert(affordancePlate?.label.includes('Dresser'), 'Label should indicate plating/dressage');
  console.log('✔ Test 10 (Food + Plate containment) passed:', affordancePlate?.label);

  // Test 11: Specimen Slide + Microscope (read_study confocal observation)
  const slide: EntitySpec = {
    id: 'lame_specimen_arabidopsis',
    name: 'Lame de cellule végétale Arabidopsis',
    capabilities: [
      { type: 'transform', position: { x: 0, y: 1.05, z: 0.2 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } }
    ]
  };

  const microscope: EntitySpec = {
    id: 'microscope_optique_recherche',
    name: 'Microscope Confocal de Recherche',
    capabilities: [
      { type: 'transform', position: { x: 0, y: 0.94, z: 0.2 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
      { type: 'web_screen', url: 'https://fr.m.wikipedia.org/wiki/Microbiologie' }
    ]
  };

  const affordanceMicroscope = evaluateSpatialCausality(slide, microscope);
  assert(affordanceMicroscope !== null, 'Slide + Microscope should produce read_study affordance');
  assert.strictEqual(affordanceMicroscope?.type, 'read_study');
  assert(affordanceMicroscope?.label.includes('échantillon'), 'Label should mention specimen observation');
  assert.strictEqual(affordanceMicroscope?.icon, '🔬');
  console.log('✔ Test 11 (Slide + Microscope confocal study) passed:', affordanceMicroscope?.label);

  console.log('--- ALL SPATIAL CAUSALITY TESTS PASSED SUCCESFULLY ---');
}

runCausalityTests();

