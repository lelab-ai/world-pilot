// src/tests/proceduralChallenge.test.ts
// Test suite pour le générateur procédural de pannes, les graines déterministes (seeds),
// le mode Roguelike Pédagogique et l'intégration au compilateur NLP.

import assert from 'assert';
import { 
  SeededPRNG, 
  compileProceduralChallenge 
} from '../engine/proceduralChallengeEngine';
import { parseInstruction } from '../authoring/parser';

async function runProceduralTests() {
  console.log('🎲 ========================================================');
  console.log('🎲 TEST SUITE : GÉNÉRATEUR PROCÉDURAL DE PANNES & GRAINES');
  console.log('🎲 ========================================================\n');

  // Test 1 : Reproductibilité déterministe du PRNG par graine
  console.log('--- TEST 1 : Reproductibilité Déterministe (Seeded PRNG) ---');
  const rng1 = new SeededPRNG(402);
  const val1A = rng1.next();
  const val1B = rng1.next();
  const val1C = rng1.nextInt(10, 50);

  const rng2 = new SeededPRNG(402);
  const val2A = rng2.next();
  const val2B = rng2.next();
  const val2C = rng2.nextInt(10, 50);

  assert.strictEqual(val1A, val2A, 'Même graine doit produire exactement le même premier tirage');
  assert.strictEqual(val1B, val2B, 'Même graine doit produire exactement le même deuxième tirage');
  assert.strictEqual(val1C, val2C, 'Même graine doit produire le même entier aléatoire');

  const rngDifferent = new SeededPRNG(999);
  assert.notStrictEqual(rng1.next(), rngDifferent.next(), 'Des graines différentes doivent diverger');
  console.log('  ✅ [PASS] Déterminisme et reproductibilité formelle validés.\n');

  // Test 2 : Compilation d'un défi électrique procédural
  console.log('--- TEST 2 : Défi Procédural Électricité (Graine #402) ---');
  const challengeElec = compileProceduralChallenge({
    domain: 'PHYSICS_ELECTRICITY',
    seed: 402,
    difficulty: 'hard'
  });

  assert.strictEqual(challengeElec.session.seed, 402);
  assert.strictEqual(challengeElec.session.domain, 'PHYSICS_ELECTRICITY');
  assert.strictEqual(challengeElec.session.budgetMeasuresMax, 3, 'Difficulté hard = 3 mesures max');
  assert(challengeElec.session.fault.perturbedValue > 0, 'La panne doit comporter une valeur physique perturbée');
  assert(challengeElec.worldPatch.entitiesCreated!.length >= 4, 'Doit générer établi, multimètre, charge et borne');
  assert(challengeElec.worldPatch.rulesChanged!.length >= 2, 'Règles de mesure et de soumission requises');
  assert.strictEqual(challengeElec.worldPatch.questsAdded!.length, 1);
  assert.strictEqual(challengeElec.worldPatch.questsAdded![0].steps.length, 4, 'La quête de diagnostic doit comporter 4 étapes');
  assert.strictEqual(challengeElec.worldPatch.gameplayPatch?.lives, 3, 'Vies initiales calquées sur le budget de mesures');
  console.log(`  ⚡ Panne tirée pour graine #402 : « ${challengeElec.session.fault.name} »`);
  console.log(`  📊 Symptôme : ${challengeElec.session.fault.symptomDescription}`);
  console.log('  ✅ [PASS] Défi électrique compilé avec succès.\n');

  // Test 3 : Compilation d'un défi mécanique avec perturbation spatiale
  console.log('--- TEST 3 : Défi Mécanique & Agencement Aléatoire ---');
  const challengeMech = compileProceduralChallenge({
    domain: 'MECHANICS_ASSEMBLY',
    seed: 777,
    difficulty: 'normal',
    randomizeLayout: true
  });

  assert.strictEqual(challengeMech.session.domain, 'MECHANICS_ASSEMBLY');
  assert(Object.keys(challengeMech.session.spatialPerturbations).length >= 3, 'Doit générer des décalages spatiaux');
  console.log(`  🪑 Panne mécanique : « ${challengeMech.session.fault.name} »`);
  console.log(`  🔧 Remède requis : ${challengeMech.session.fault.repairAction}`);
  console.log('  ✅ [PASS] Défi mécanique avec disposition spatiale bruitée validé.\n');

  // Test 4 : Parseur NLP - Reconnait "défi de dépannage électrique avec graine #402"
  console.log('--- TEST 4 : Parseur NLP en Langage Naturel ---');
  const parsed1 = parseInstruction('crée un défi de dépannage électrique avec graine #402', { selectedEntityId: null, pointedEntityId: null }, {});
  assert.strictEqual(parsed1.plan.intent, 'start_procedural_challenge');
  assert.strictEqual(parsed1.plan.actions[0].seed, 402);
  assert.strictEqual(parsed1.plan.actions[0].domain, 'PHYSICS_ELECTRICITY');
  assert(parsed1.patch.entitiesCreated!.length >= 4);

  // Test 5 : Parseur NLP - Reconnait "panne mécanique aléatoire"
  const parsed2 = parseInstruction('génère une panne mécanique aléatoire avec agencement aléatoire', { selectedEntityId: null, pointedEntityId: null }, {});
  assert.strictEqual(parsed2.plan.intent, 'start_procedural_challenge');
  assert.strictEqual(parsed2.plan.actions[0].domain, 'MECHANICS_ASSEMBLY');
  assert(parsed2.patch.questsAdded![0].title.includes('Mécanique'));

  // Test 6 : Parseur NLP - Reconnait "mode roguelike pédagogique"
  const parsed3 = parseInstruction('lance le mode roguelike pédagogique avec budget de mesures', { selectedEntityId: null, pointedEntityId: null }, {});
  assert.strictEqual(parsed3.plan.intent, 'start_procedural_challenge');
  assert.strictEqual(parsed3.patch.gameplayPatch?.isTimerActive, true);
  console.log('  ✅ [PASS] Toutes les directives NLP (graines, roguelike, pannes) sont reconnues.\n');

  console.log('🎉 ========================================================');
  console.log('🎉 TOUS LES TESTS DU MOTEUR PROCÉDURAL SONT AU VERT !');
  console.log('🎉 ========================================================');
}

runProceduralTests().catch(err => {
  console.error('❌ Échec des tests procéduraux :', err);
  process.exit(1);
});
