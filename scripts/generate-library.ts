import fs from 'node:fs/promises';
import * as T from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { catalog } from '../src/library/catalog';
import { buildModel, disposeModel } from '../src/library/models';

// GLTFExporter uses FileReader even for binary buffers; Node supplies Blob.
class NodeFileReader {
  result: ArrayBuffer | string | null = null;
  onloadend: (()=>void) | null = null;
  readAsArrayBuffer(blob:Blob){blob.arrayBuffer().then(buffer=>{this.result=buffer;this.onloadend?.();});}
  readAsDataURL(blob:Blob){blob.arrayBuffer().then(buffer=>{this.result=`data:${blob.type};base64,${Buffer.from(buffer).toString('base64')}`;this.onloadend?.();});}
}
Object.assign(globalThis,{FileReader:NodeFileReader});

function thumbnail(root:T.Group) {
  const bounds=new T.Box3().setFromObject(root),center=bounds.getCenter(new T.Vector3());
  const size=bounds.getSize(new T.Vector3()),extent=Math.max(size.x,size.y,size.z)*.8;
  const camera=new T.OrthographicCamera(-extent,extent,extent,-extent,.01,100);
  camera.position.copy(center).add(new T.Vector3(4,2.7,5).multiplyScalar(Math.max(1,extent)));camera.lookAt(center);camera.updateMatrixWorld();
  const faces:{z:number;points:string;color:string;opacity:number}[]=[];
  const light=new T.Vector3(-.4,1,.7).normalize();
  root.traverse(o=>{
    if(!(o instanceof T.Mesh))return;
    const p=o.geometry.getAttribute('position'),idx=o.geometry.index,mat=(Array.isArray(o.material)?o.material[0]:o.material) as T.MeshStandardMaterial;
    for(let i=0;i<(idx?idx.count:p.count);i+=3){
      const pts=[0,1,2].map(j=>new T.Vector3().fromBufferAttribute(p,idx?idx.getX(i+j):i+j).applyMatrix4(o.matrixWorld));
      const normal=pts[1].clone().sub(pts[0]).cross(pts[2].clone().sub(pts[0])).normalize();
      if(normal.dot(camera.position.clone().sub(pts[0]))<0)continue;
      const shade=.5+.5*Math.max(0,normal.dot(light));
      const color=mat.color.clone().multiplyScalar(shade).getStyle();
      const projected=pts.map(pt=>pt.project(camera));
      faces.push({z:projected.reduce((sum,pt)=>sum+pt.z,0)/3,points:projected.map(pt=>`${((pt.x+1)*160).toFixed(1)},${((1-pt.y)*160).toFixed(1)}`).join(' '),color,opacity:mat.opacity});
    }
  });
  faces.sort((a,b)=>b.z-a.z);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320"><rect width="320" height="320" rx="18" fill="#e3e4d9"/><ellipse cx="160" cy="275" rx="94" ry="12" fill="#566457" opacity=".12"/>${faces.map(f=>`<polygon points="${f.points}" fill="${f.color}" opacity="${f.opacity}"/>`).join('')}</svg>`;
}

await fs.mkdir('public/library',{recursive:true});
const manifest=[];
for(const item of catalog){
  const root=buildModel(item.id);
  const result=await new GLTFExporter().parseAsync(root,{binary:true});
  if(!(result instanceof ArrayBuffer))throw new Error('Expected GLB');
  await fs.writeFile(`public/library/${item.id}.glb`,Buffer.from(result));
  await fs.writeFile(`public/library/${item.id}.svg`,thumbnail(root));
  const box=new T.Box3().setFromObject(root);
  manifest.push({id:item.id,name:item.name,category:item.category,bytes:result.byteLength,bounds:box.getSize(new T.Vector3()).toArray()});
  disposeModel(root);
}
await fs.writeFile('public/library/manifest.json',JSON.stringify(manifest,null,2));
console.log(`Generated ${manifest.length} GLB models and matching SVG previews; ${(manifest.reduce((sum,m)=>sum+m.bytes,0)/1024/1024).toFixed(1)} MB total.`);
