import * as T from 'three';
import data from './publicModels.json';
import type {AssetId} from './catalog';
export interface ModelState {active?:boolean;value?:number;text?:string;color?:string;}
/** Public geometry snapshots only. Full procedural generators live in the private repository. */
export function buildModel(id:AssetId,state:ModelState={}):T.Group {
 const snapshot=(data as Record<string,unknown>)[id];
 if(!snapshot)throw new Error(`Model unavailable in public edition: ${id}`);
 const root=new T.ObjectLoader().parse(snapshot as any) as T.Group;
 if(state.color)root.traverse(o=>{if(o instanceof T.Mesh)for(const m of Array.isArray(o.material)?o.material:[o.material])if(m instanceof T.MeshStandardMaterial)m.color.set(state.color!)});
 return root;
}
export function disposeModel(root:T.Object3D){const gs=new Set<T.BufferGeometry>(),ms=new Set<T.Material>();root.traverse(o=>{if(o instanceof T.Mesh){gs.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])ms.add(m)}});gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());}
