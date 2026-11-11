import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as T from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {catalog,createLibraryPatch} from '../library/catalog';
import {buildModel,disposeModel} from '../library/models';
import {parseInstruction} from '../authoring/parser';
import {useWorldStore} from '../engine/store';
import {hasDetailedSimulationModel} from '../scene/DetailedSimulationModel';
const expected=['socket','technical-bench','wp-ordinateur-portable'];
assert.deepEqual(catalog.map(a=>a.id).sort(),expected);
assert.deepEqual(fs.readdirSync('public/library').filter(f=>f.endsWith('.glb')).map(f=>f.slice(0,-4)).sort(),expected);
const loader=new GLTFLoader();
for(const asset of catalog){const g=buildModel(asset.id),box=new T.Box3().setFromObject(g);assert(!box.isEmpty());assert(Math.abs(box.min.y)<1e-5);const b=fs.readFileSync(`public/library/${asset.id}.glb`);const gltf=await loader.parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');assert(new T.Box3().setFromObject(gltf.scene).getSize(new T.Vector3()).distanceTo(box.getSize(new T.Vector3()))<1e-4);assert(fs.existsSync(`public/library/${asset.id}.svg`));disposeModel(g);disposeModel(gltf.scene);}
const store=useWorldStore.getState();store.resetWorld();
for(const prompt of ['Show how to change a car battery','Replace the battery with a generator while keeping its position','Move the workbench right in front of the engine compartment','Fix the spatial conflict without cancelling my intent','Show the capacity of a 42L travel bag']){const state=useWorldStore.getState();const r=parseInstruction(prompt,{selectedEntityId:null,pointedEntityId:null},state.world.ir.entities);state.applyPatch(r.patch,prompt,r.plan);}
for(const id of ['wp-voiture','wp-batterie-automobile','wp-sac-voyageur-42l','wp-gourde-isotherme','wp-carton-oversized'])assert(hasDetailedSimulationModel({id,visuals:{assetId:id},capabilities:[],name:id}));
assert(!hasDetailedSimulationModel({id:'private',visuals:{assetId:'wp-sac-monogram'},capabilities:[],name:'private'}));
assert.equal(createLibraryPatch(expected,{}).entitiesCreated?.length,3);
console.log('PASS: public geometry snapshots, GLB roundtrip, floor origins, exact allowlist and hands-on scene commands.');
