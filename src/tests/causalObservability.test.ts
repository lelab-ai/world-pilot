// src/tests/causalObservability.test.ts
// Test suite pour le HUD d'Observabilité Réactive, les modes du Gizmo 3D et les micro-prompts in-situ.

import assert from 'assert';
import { useWorldStore } from '../engine/store';
import { parseInstruction } from '../authoring/parser';
import { exportWorldToYaml, validateWorldIR } from '../engine/worldFormat';

async function runCausalObservabilityTests() {
  console.log('⚡ ========================================================');
  console.log('⚡ TEST SUITE : OBSERVABILITÉ RÉACTIVE & GIZMO 3D');
  console.log('⚡ ========================================================\n');

  // Test 1: Cycle des modes du Gizmo 3D (Off -> Translate -> Rotate -> Off)
  console.log('--- TEST 1 : Cycle des Modes du Gizmo 3D ---');
  const store = useWorldStore.getState();
  store.resetWorld();
  assert.strictEqual(store.gizmoMode, 'off');

  store.cycleGizmoMode();
  assert.strictEqual(useWorldStore.getState().gizmoMode, 'translate');

  store.cycleGizmoMode();
  assert.strictEqual(useWorldStore.getState().gizmoMode, 'rotate');

  store.cycleGizmoMode();
  assert.strictEqual(useWorldStore.getState().gizmoMode, 'off');
  console.log('  ✅ [PASS] Cycle des modes Gizmo validé.\n');

  // Test 2: Forçage réactif des drapeaux (setWorldFlag)
  console.log('--- TEST 2 : Forçage Réactif des Drapeaux ---');
  assert.strictEqual(useWorldStore.getState().world.flags['battery_inspected'], undefined);

  store.setWorldFlag('battery_inspected', true);
  assert.strictEqual(useWorldStore.getState().world.flags['battery_inspected'], true);

  store.setWorldFlag('battery_inspected', false);
  assert.strictEqual(useWorldStore.getState().world.flags['battery_inspected'], false);
  console.log('  ✅ [PASS] setWorldFlag live toggle validé.\n');

  // Test 3: Déclenchement manuel de règles causales (triggerRuleManually)
  console.log('--- TEST 3 : Déclenchement Manuel de Règle Causale ---');
  const res = parseInstruction('Montrer comment changer une batterie dans une voiture', {
    selectedEntityId: null,
    pointedEntityId: null
  });
  store.applyPatch(res.patch, 'Montrer comment changer une batterie dans une voiture', res.plan);

  const world = useWorldStore.getState().world;
  assert(world.ir.rules['rule_inspect_car_battery'] !== undefined);
  assert.strictEqual(world.flags['battery_inspected'], false);

  store.triggerRuleManually('rule_inspect_car_battery');
  assert.strictEqual(useWorldStore.getState().world.flags['battery_inspected'], true);
  assert(useWorldStore.getState().warnings.some(w => w.includes('Diagnostic batterie OK')));
  console.log('  ✅ [PASS] triggerRuleManually validé.\n');

  // Test 4: Micro-prompt in-situ ciblant l’entité sélectionnée sans écraser le monde
  console.log('--- TEST 4 : Micro-Prompt IA In-Situ Isolé ---');
  const batteryId = 'car_battery_new';
  const worldBefore = useWorldStore.getState().world;
  assert(worldBefore.ir.entities[batteryId] !== undefined);
  assert(worldBefore.ir.entities['car_sedan_1'] !== undefined);

  const microRes = parseInstruction(
    'ajoute du marbre blanc',
    { selectedEntityId: batteryId, pointedEntityId: null },
    worldBefore.ir.entities
  );

  assert(microRes.patch !== undefined);
  store.applyPatch(microRes.patch, 'ajoute du marbre blanc', microRes.plan);

  const worldAfter = useWorldStore.getState().world;
  assert(worldAfter.ir.entities['car_sedan_1'] !== undefined, 'La voiture doit être préservée');
  assert(worldAfter.ir.entities[batteryId] !== undefined, 'La batterie doit toujours exister');
  console.log('  ✅ [PASS] Isolation du micro-prompt in-situ validée.\n');

  // Test 5: Bascule d’affichage du HUD d’Observabilité
  console.log('--- TEST 5 : Toggle HUD Observabilité Réactive ---');
  assert.strictEqual(useWorldStore.getState().showCausalObservability, false);

  store.toggleCausalObservability();
  assert.strictEqual(useWorldStore.getState().showCausalObservability, true);

  // Test 6: Substrat Déclaratif YAML & JSON : Round-trip, Validation et Synchronisation
  console.log('--- TEST 6 : Substrat Déclaratif YAML & JSON : Validation & Round-trip ---');
  const currentWorld = useWorldStore.getState().world;
  const validation = validateWorldIR(currentWorld.ir);
  assert.strictEqual(validation.valid, true, 'Le WorldIR courant doit être valide selon le schéma formel');
  assert.strictEqual(validation.errors.length, 0);

  // Test YAML serialization & re-import
  const generatedYaml = exportWorldToYaml(currentWorld);
  assert(generatedYaml.includes('WorldPilot Declarative Spatial Substrate'), 'Le YAML doit inclure l’en-tête WorldPilot');
  assert(generatedYaml.includes('entities:'), 'Le YAML doit déclarer la section entities');
  assert(generatedYaml.includes('car_sedan_1:'), 'Le YAML doit contenir la voiture');
  assert(generatedYaml.includes('car_battery_new:'), 'Le YAML doit contenir la batterie');

  const importSuccess = useWorldStore.getState().importWorldYaml(generatedYaml);
  assert.strictEqual(importSuccess, true, 'L’import du YAML généré doit réussir sans erreur');

  const reloadedWorld = useWorldStore.getState().world;
  assert(reloadedWorld.ir.entities['car_sedan_1'] !== undefined, 'L’entité doit être restaurée depuis le YAML');
  assert(reloadedWorld.ir.entities['car_battery_new'] !== undefined, 'La batterie doit être restaurée');
  console.log('  ✅ [PASS] Substrat Déclaratif YAML & JSON round-trip validé.\n');

  console.log('🎉 TOUS LES TESTS D’OBSERVABILITÉ RÉACTIVE ET GIZMO 3D SONT VALIDÉS !');
}

runCausalObservabilityTests().catch(err => {
  console.error('❌ Échec des tests d’observabilité causale :', err);
  process.exit(1);
});
