import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import type { EntitySpec } from '../core/types';
import { buildModel, disposeModel } from './models';
import { getAsset } from './catalog';
import { applyMaterialOverrides } from '../scene/materialOverrides';

export function LibraryModel({entity}:{entity:EntitySpec}) {
  const asset=getAsset(entity.visuals?.assetId)!;
  const settings=entity.capabilities.find(c=>c.type==='educational');
  const [now,setNow]=useState(Date.now());
  useEffect(()=>{if(asset.id!=='timer'||!settings?.active)return;const timer=setInterval(()=>setNow(Date.now()),1000);return ()=>clearInterval(timer);},[asset.id,settings?.active]);
  let text=settings?.text;
  if(asset.id==='timer'){
    const seconds=Math.floor(((settings?.elapsed||0)+(settings?.active?Math.max(0,now-(settings?.startedAt||now)):0))/1000);
    text=`${Math.floor(seconds/60).toString().padStart(2,'0')}:${(seconds%60).toString().padStart(2,'0')}`;
  }
  const model=useMemo(()=>buildModel(asset.id,{active:settings?.active,value:settings?.value,text}),
    [asset.id,settings?.active,settings?.value,text]);
  const visuals = entity.visuals;
  useLayoutEffect(() => applyMaterialOverrides(model, {
    presetId: visuals?.materialPreset || (visuals?.textureUrl?.startsWith('pbr:') ? visuals.textureUrl.slice(4) : undefined),
    color: visuals?.color,
    roughness: visuals?.roughness,
    metalness: visuals?.metalness,
    clearcoat: visuals?.clearcoat,
    repeat: visuals?.repeat,
  }), [model, visuals?.materialPreset, visuals?.textureUrl, visuals?.color, visuals?.roughness, visuals?.metalness, visuals?.clearcoat, visuals?.repeat]);
  useEffect(()=>()=>disposeModel(model),[model]);
  useFrame(({clock})=>{
    if(asset.id==='breathing') {
      const sphere=model.children[1];
      // 10-second gentle visual cycle; geometry remains local to this entity.
      const scale=.85+Math.sin(clock.elapsedTime*Math.PI/5)*.15;
      sphere?.scale.setScalar(scale);
    }
  });
  return <primitive object={model} />;
}
