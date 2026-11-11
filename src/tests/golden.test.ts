import assert from 'assert';
import { useWorldStore } from '../engine/store';
import { parseInstruction } from '../authoring/parser';
import { tracker } from '../observability/tracker';
import { findCounterExample } from '../simulation/simulator';

async function runGoldenTest() {
  console.log('--- RUNNING GOLDEN TEST ---');
  const store = useWorldStore.getState();

  // Act 1: CREATE
  console.log('1. Creating training bay...');
  let { plan, patch } = parseInstruction("Create a rover maintenance training bay.", { selectedEntityId: null, pointedEntityId: null });
  store.applyPatch(patch, "Create a rover maintenance training bay.", plan);
  
  const stateAfterCreate = useWorldStore.getState().world;
  assert(stateAfterCreate.ir.entities['Battery_B-17'], 'Battery should exist');
  assert(stateAfterCreate.ir.entities['Maintenance_Zone_2'], 'Zone should exist');

  // Act 2: PROGRAM
  console.log('2. Programming behavior...');
  // Simulate user selecting the battery and pointing at the zone
  useWorldStore.getState().setSpatialContext('Battery_B-17', 'Maintenance_Zone_2');
  
  const ctx = useWorldStore.getState().spatialContext;
  let res = parseInstruction("If I put this here, trigger a warning and reset it.", ctx);
  store.applyPatch(res.patch, "If I put this here, trigger a warning and reset it.", res.plan);

  const stateAfterProgram = useWorldStore.getState().world;
  const rules = Object.values(stateAfterProgram.ir.rules);
  const dropRule = rules.find(r => r.trigger === 'DROP');
  assert(dropRule, 'DROP rule should be created');
  
  // Act 3: VERIFY (Execution)
  console.log('3. Simulating execution...');
  // Simulate dropping the battery on the zone
  useWorldStore.getState().dispatch({
    type: 'DROP',
    sourceId: 'Battery_B-17',
    targetId: 'Maintenance_Zone_2'
  });

  const warnings = useWorldStore.getState().warnings;
  assert(warnings.length === 1, 'A warning should have been generated');
  assert(warnings[0].includes('INCORRECT PLACEMENT'), 'Warning message should match');

  // Check Observability
  console.log('4. Checking observability records...');
  const records = tracker.getRecords();
  assert(records.length === 2, 'Should have 2 edit records');

  // Act 3: VERIFY INVARIANT
  console.log('5. Adding invariant...');
  let resInv = parseInstruction("Nobody should ever complete this training without inspecting the battery", { selectedEntityId: null, pointedEntityId: null });
  store.applyPatch(resInv.patch, "Nobody should ever complete this training without inspecting the battery", resInv.plan);

  const stateWithInvariant = useWorldStore.getState().world;
  assert(Object.values(stateWithInvariant.ir.invariants).length === 1, 'Invariant should be added');

  // Act 4: TRY TO BREAK IT
  console.log('6. Running simulation to find counter-example...');
  
  // We need to inject the mock event sequence for the test since parser doesn't do it in CLI
  const possibleEvents = [
    { type: 'DROP', sourceId: 'Battery_B-17', targetId: 'Maintenance_Zone_2' },
    { type: 'COMPLETE_TRAINING', sourceId: 'player' }
  ];
  
  // Since we haven't inspected the battery (no flag set), COMPLETE_TRAINING should break the invariant
  const simRes = findCounterExample(stateWithInvariant, possibleEvents, 3);
  
  assert(simRes.invariantBroken === true, 'Simulation should find a counter-example');
  assert(simRes.trace.length > 0, 'Simulation should provide a trace');
  console.log('Counter-example trace found:', simRes.trace.map((t: any) => t.type));

  console.log('--- GOLDEN TEST PASSED ---');
}

runGoldenTest().catch(console.error);
