import { useEffect, useState } from 'react';
import { catalog, createLibraryPatch, getAsset, lessonKit, normalize, type AssetId } from './catalog';
import { useWorldStore } from '../engine/store';
import type { EntitySpec } from '../core/types';
import { getAllPBRMaterialPresets, getPBRMaterialPreset } from '../scene/pbrMaterials';
import { playAudioFx } from '../engine/evaluator';

export function LibraryPanel({onClose}:{onClose:()=>void}) {
  const [search,setSearch]=useState('');
  const [category,setCategory]=useState('Toutes');
  const [added,setAdded]=useState('');
  const [page,setPage]=useState(0);
  const categories=['Toutes',...new Set(catalog.map(a=>a.category))];
  const items=catalog.filter(a=>(category==='Toutes'||a.category===category)&&normalize(a.name+' '+a.category+' '+a.description).includes(normalize(search)));
  const pageItems=items.slice(page*12,page*12+12);
  const add=(ids:readonly AssetId[])=>{
    const store=useWorldStore.getState();
    const patch=createLibraryPatch(ids,store.world.ir.entities);
    store.applyPatch(patch,`Bibliothèque : ${ids.map(id=>getAsset(id)!.name).join(', ')}`,{intent:'add_library_objects'});
    const entity=patch.entitiesCreated![0];
    const zone=entity.capabilities.some(c=>c.type==='trigger_zone');
    store.setSpatialContext(zone?null:entity.id,zone?entity.id:null);
    setAdded(ids.length===1?entity.name:`${ids.length} objets pédagogiques`);
  };
  useEffect(()=>{
    const previous=document.activeElement as HTMLElement|null;
    const dialog=document.querySelector<HTMLDivElement>('.library-dialog')!;
    dialog.querySelector<HTMLInputElement>('input')?.focus();
    const key=(e:KeyboardEvent)=>{if(e.key==='Escape')onClose();if(e.key==='Tab'){
      const nodes=Array.from(dialog.querySelectorAll<HTMLElement>('button:not(:disabled),input,select,a[href]'));
      const first=nodes[0],last=nodes[nodes.length-1];
      if(e.shiftKey && document.activeElement===first){e.preventDefault();last?.focus();}
      else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first?.focus();}
    }};
    document.addEventListener('keydown',key);
    return ()=>{document.removeEventListener('keydown',key);previous?.focus();};
  },[onClose]);
  return <div className="library-backdrop"><div className="library-dialog" role="dialog" aria-modal="true" aria-labelledby="library-title">
    <header><div><div className="eyebrow">WORLDPILOT · COLLECTION 01</div><h2 id="library-title">Une bibliothèque de possibles.</h2><p>{catalog.length} objets 3D · échelle ajustable · fichiers GLB disponibles</p></div><button className="icon-button" onClick={onClose} aria-label="Fermer la bibliothèque">×</button></header>
    <div className="library-filters"><input aria-label="Rechercher un objet" placeholder="Rechercher un objet, une activité…" value={search} onChange={e=>{setSearch(e.target.value);setPage(0);}}/><select aria-label="Catégorie" value={category} onChange={e=>{setCategory(e.target.value);setPage(0);}}>{categories.map(c=><option key={c}>{c}</option>)}</select><button className="button primary" onClick={()=>add(lessonKit)}>Ajouter le kit de cours · 8 objets</button></div>
    <div className="library-feedback" role="status">{added?<><span>✓ {added} ajouté à la scène.</span><button className="button" onClick={onClose}>Voir la scène →</button></>:<span>{items.length} objets disponibles. Cliquez sur Ajouter pour les placer dans votre monde.</span>}</div>
    <div className="library-grid">{pageItems.map(item=><article key={item.id}><img src={`/library/${item.id}.svg`} alt={`Aperçu 3D : ${item.name}`} loading="lazy"/><div className="library-card-copy"><small>{item.category}</small><h3>{item.name}</h3><p>{item.description}</p><div><button className="button primary" onClick={()=>add([item.id])} aria-label={`Ajouter ${item.name}`}>＋ Ajouter</button><a className="button" href={`/library/${item.id}.glb`} download={`${item.id}.glb`} aria-label={`Télécharger ${item.name} en GLB`}>GLB ↓</a></div></div></article>)}{!items.length&&<p>Aucun objet ne correspond à votre recherche.</p>}</div>
    <footer><span>{items.length ? page*12+1 : 0}–{Math.min((page+1)*12,items.length)} sur {items.length}</span><div><button className="button" disabled={page===0} onClick={()=>setPage(p=>p-1)}>← Précédent</button><button className="button" disabled={(page+1)*12>=items.length} onClick={()=>setPage(p=>p+1)}>Suivant →</button></div><span>Objets procéduraux · usage local ou export</span></footer>
  </div></div>;
}

export function LibraryInspector({entity}:{entity:EntitySpec}) {
  const asset=getAsset(entity.visuals?.assetId);
  const effectiveAsset = asset || {
    id: entity.visuals?.assetId || entity.id,
    name: entity.name,
    category: 'Objet Spatial 3D',
    description: 'Composant 3D personnalisable avec matériaux PBR et propriétés physiques.'
  };
  const [,tick]=useState(0);
  const [message,setMessage]=useState('');
  const [showPreciseCoords, setShowPreciseCoords] = useState(false);
  const settings=entity.capabilities.find(c=>c.type==='educational')||{type:'educational'};
  const transform=entity.capabilities.find(c=>c.type==='transform')||{type:'transform'};
  const interaction=asset && 'interaction' in asset ? asset.interaction : undefined;
  useEffect(()=>{if(interaction!=='timer'||!settings.active)return;const timer=setInterval(()=>tick(n=>n+1),500);return ()=>clearInterval(timer);},[interaction,settings.active]);
  useEffect(()=>{setMessage('');return ()=>{if(typeof speechSynthesis!=='undefined')speechSynthesis.cancel();};},[entity.id]);
  const patch=(changes:Partial<EntitySpec>,description:string)=>useWorldStore.getState().applyPatch({entitiesChanged:[{id:entity.id,...changes}]},description,{intent:'edit_library_object'});
  const configure=(changes:Record<string,unknown>)=>patch({capabilities:entity.capabilities.map(c=>c.type==='educational'?{...c,...changes}:c)},`Régler ${entity.name}`);
  const setTransform=(field:'position'|'scale'|'rotation',axis:string,value:number)=>{
    if(!Number.isFinite(value))return;
    const defaults=field==='scale'?{x:1,y:1,z:1}:{x:0,y:0,z:0};
    patch({capabilities:entity.capabilities.map(c=>c.type==='transform'?{...c,[field]:{...defaults,...c[field],[axis]:value}}:c)},`Déplacer / dimensionner ${entity.name}`);
  };
  const activate=()=>{configure({active:!settings.active});useWorldStore.getState().dispatch({type:'INTERACT',sourceId:entity.id});};
  const elapsed=(settings.elapsed||0)+(settings.active?Math.max(0,Date.now()-(settings.startedAt||Date.now())):0);
  const timerText=`${Math.floor(elapsed/60000).toString().padStart(2,'0')}:${Math.floor(elapsed/1000)%60<10?'0':''}${Math.floor(elapsed/1000)%60}`;
  const quiz=(answer:string)=>{
    const correct=answer===(settings.correctAnswer||'B');
    configure({answer,active:correct});
    useWorldStore.getState().dispatch({type:correct?'ANSWER_CORRECT':'ANSWER_INCORRECT',sourceId:entity.id,payload:{answer}});
    setMessage(correct?'Bonne réponse.':'Essayez une autre réponse.');
  };
    const [customSound, setCustomSound] = useState<string>('switch_click');
    const [customAnim, setCustomAnim] = useState<string>('pulsing');
    const [customNotice, setCustomNotice] = useState<string>('');

    const handleSaveCustomInteraction = () => {
      const store = useWorldStore.getState();
      const ruleId = `rule_custom_${entity.id}`;
      const actions: any[] = [
        { type: 'set_flag', flag: `${entity.id}_interacted`, value: true }
      ];
      if (customSound) {
        actions.push({ type: 'play_sound', sound: customSound });
      }
      if (customAnim) {
        actions.push({ type: 'trigger_animation', entityId: entity.id, animationType: customAnim });
      }
      const labelMsg = customNotice.trim() || `Interaction activée sur ${entity.name} !`;
      actions.push({ type: 'show_warning', message: labelMsg });

      const patch = {
        rulesChanged: [
          {
            id: ruleId,
            trigger: 'INTERACT',
            conditions: [{ type: 'is_source', sourceId: entity.id }],
            actions
          }
        ]
      };
      store.applyPatch(patch, `Interaction configurée pour ${entity.name}`, { intent: 'program_behavior' });
      setMessage(`⚡ Règle causale enregistrée ! Survolez et cliquez sur ${entity.name} dans la scène 3D.`);
    };

    const allEntities = useWorldStore(s => s.world.ir.entities);
    const cuttingBoard = Object.values(allEntities).find(e => 
      e.id !== entity.id && (e.visuals?.assetId?.includes('planche') || e.name.toLowerCase().includes('planche'))
    );
    const cocotte = Object.values(allEntities).find(e => 
      e.id !== entity.id && (e.visuals?.assetId?.includes('cocotte') || e.name.toLowerCase().includes('cocotte'))
    );

    return <section className="library-inspector">
      <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3>{entity.name}</h3>
          <small>{effectiveAsset.category}</small>
        </div>
        <button
          type="button"
          className="button subtle small"
          onClick={() => useWorldStore.getState().setSpatialContext(null, null)}
          title="Désélectionner cet objet (Échap)"
          style={{ padding: '2px 8px', fontSize: '11px', height: '22px', borderRadius: '4px', color: '#94a3b8' }}
        >
          ✕ Désélectionner
        </button>
      </div>
      <p>{effectiveAsset.description}</p>
    
    {/* Quick Placement Actions */}
    <div className="object-interaction" style={{ margin: '8px 0', background: 'rgba(255, 170, 0, 0.08)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255, 170, 0, 0.25)' }}>
      <div className="eyebrow" style={{ color: '#ffaa00', marginBottom: '6px', fontWeight: 'bold' }}>🎯 DÉPLACER & POSER DANS LA PIÈCE</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {cuttingBoard && (
          <button
            className="button primary"
            style={{ width: '100%', fontSize: '11px', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'linear-gradient(90deg, #10b981, #059669)', border: 'none' }}
            onClick={() => {
              const bPos = cuttingBoard.capabilities.find(c => c.type === 'transform')?.position || { x: 0, y: 0.9, z: 0.3 };
              patch({
                capabilities: entity.capabilities.map(c => c.type === 'transform' ? {
                  ...c,
                  position: { x: bPos.x, y: bPos.y + 0.06, z: bPos.z }
                } : c)
              }, `Poser ${entity.name} sur la planche à découper`);
              useWorldStore.getState().dispatch({ type: 'DROP', sourceId: entity.id, targetId: cuttingBoard.id });
              useWorldStore.setState(s => ({
                warnings: [...s.warnings, `🔪 ${entity.name} posée avec succès sur la planche à découper !`]
              }));
            }}
          >
            🔪 Poser sur la planche à découper
          </button>
        )}
        {cocotte && (
          <button
            className="button"
            style={{ width: '100%', fontSize: '11px', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'rgba(249, 115, 22, 0.2)', borderColor: '#f97316' }}
            onClick={() => {
              const cPos = cocotte.capabilities.find(c => c.type === 'transform')?.position || { x: 0, y: 0.9, z: -0.2 };
              patch({
                capabilities: entity.capabilities.map(c => c.type === 'transform' ? {
                  ...c,
                  position: { x: cPos.x, y: cPos.y + 0.08, z: cPos.z }
                } : c)
              }, `Mettre ${entity.name} dans la cocotte`);
              useWorldStore.getState().dispatch({ type: 'DROP', sourceId: entity.id, targetId: cocotte.id });
              useWorldStore.setState(s => ({
                warnings: [...s.warnings, `🥘 ${entity.name} ajoutée dans la cocotte en fonte pour mijoter !`]
              }));
            }}
          >
            🥘 Mettre dans la cocotte
          </button>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', marginTop: '2px' }}>
          <button
            className="button subtle"
            style={{ fontSize: '10px', padding: '4px' }}
            title="Déplacer à gauche (-0.15m)"
            onClick={() => setTransform('position', 'x', (transform.position?.x ?? 0) - 0.15)}
          >
            ← Gauche
          </button>
          <button
            className="button subtle"
            style={{ fontSize: '10px', padding: '4px' }}
            title="Déplacer à droite (+0.15m)"
            onClick={() => setTransform('position', 'x', (transform.position?.x ?? 0) + 0.15)}
          >
            Droite →
          </button>
          <button
            className="button subtle"
            style={{ fontSize: '10px', padding: '4px' }}
            title="Avancer vers vous (+0.15m)"
            onClick={() => setTransform('position', 'z', (transform.position?.z ?? 0) + 0.15)}
          >
            ↑ Avancer
          </button>
          <button
            className="button subtle"
            style={{ fontSize: '10px', padding: '4px' }}
            title="Reculer au fond (-0.15m)"
            onClick={() => setTransform('position', 'z', (transform.position?.z ?? 0) - 0.15)}
          >
            ↓ Reculer
          </button>
        </div>
      </div>
    </div>

    {/* Vue Éclatée Interactive (Mindel §7) */}
    {entity.parts && entity.parts.length > 0 && (() => {
      const isExploded = (entity.capabilities.find(c => c.type === 'exploded_view') as any)?.isExploded ?? false;
      return (
        <div className="object-interaction exploded-view-panel" style={{ margin: '8px 0', padding: '10px', background: 'rgba(245, 158, 11, 0.08)', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
          <div className="eyebrow" style={{ color: '#fbbf24', marginBottom: '6px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>💥 VUE ÉCLATÉE ({entity.parts.length} COMPOSANTS)</span>
            <span style={{ fontSize: '9px', color: isExploded ? '#34d399' : '#94a3b8' }}>{isExploded ? 'DÉPLOYÉ' : 'ASSEMBLÉ'}</span>
          </div>
          <p style={{ fontSize: '11px', color: '#cbd5e1', margin: '0 0 8px 0', lineHeight: 1.4 }}>
            Dissociez ou réassemblez les sous-systèmes techniques en 3D pour inspecter chaque composant individuellement.
          </p>
          <button
            type="button"
            className="button primary"
            style={{
              width: '100%',
              fontSize: '11px',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              background: isExploded ? 'linear-gradient(90deg, #f59e0b, #d97706)' : 'linear-gradient(90deg, #0284c7, #2563eb)',
              border: 'none',
              fontWeight: 700
            }}
            onClick={() => useWorldStore.getState().toggleExplodedView(entity.id)}
          >
            <span>{isExploded ? '🔄' : '💥'}</span>
            <span>{isExploded ? 'Réassembler les composants 3D' : 'Déployer la vue éclatée 3D'}</span>
          </button>
        </div>
      );
    })()}

    {(entity.visuals?.assetId === 'web-screen' || entity.capabilities.some(c => c.type === 'web_screen' || c.url)) && (
      <div style={{ margin: '10px 0', padding: '10px', background: 'rgba(16, 185, 129, 0.12)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.35)' }}>
        <div className="eyebrow" style={{ color: '#34d399', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span>🌐 SITE WEB EMBARQUÉ</span>
        </div>
        <input 
          type="text" 
          defaultValue={entity.capabilities.find(c => c.type === 'web_screen' || c.url)?.url || (settings as any).url || 'https://fr.m.wikipedia.org/wiki/Ratatouille'} 
          placeholder="https://..." 
          onBlur={(e) => {
            const newUrl = e.target.value;
            patch({
              capabilities: entity.capabilities.map(c => 
                (c.type === 'web_screen' || c.type === 'educational') ? { ...c, url: newUrl } : c
              )
            }, `Modifier l'URL de ${entity.name}`);
          }}
          style={{ width: '100%', fontSize: '11px', padding: '6px 8px', borderRadius: '4px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.18)', color: '#fff', marginBottom: '8px', boxSizing: 'border-box' }}
        />
        <button 
          className="button primary" 
          style={{ width: '100%', fontSize: '11px', padding: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'linear-gradient(90deg, #10b981, #059669)', border: 'none', color: '#fff' }}
          onClick={() => {
            const url = entity.capabilities.find(c => c.type === 'web_screen' || c.url)?.url || (settings as any).url || 'https://fr.m.wikipedia.org/wiki/Ratatouille';
            useWorldStore.getState().openWebModal(url, entity.name);
          }}
        >
          <span>🔍 Ouvrir le site web en grand</span>
          <span>↗</span>
        </button>
      </div>
    )}

    {(settings.text || asset?.text || entity.capabilities.some(c => c.type === 'educational')) && (
      <label style={{ margin: '6px 0', display: 'block', fontSize: '10px', color: '#94a3b8' }}>
        <span>📝 Texte pédagogique embarqué (3D)</span>
        <textarea
          key={entity.id+':text'}
          defaultValue={settings.text||asset?.text||''}
          placeholder="Texte consigne affiché sur l'objet en 3D (pour les prompts IA, utilisez la zone 'Votre intention' en haut)"
          onBlur={e=>{if(e.target.value!==settings.text)configure({text:e.target.value});}}
          rows={2}
        />
      </label>
    )}

    {/* Coordonnées & Précision (Condensé & Repliable pour libérer l'espace) */}
    <div className="object-interaction precise-coordinates-panel" style={{ margin: '8px 0', padding: '8px 10px', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', cursor: 'pointer', userSelect: 'none' }} onClick={() => setShowPreciseCoords(!showPreciseCoords)}>
        <span style={{ color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>📐</span>
          <span><b>Position & Précision</b></span>
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '10px', color: '#94a3b8' }}>
            ({(transform.position?.x ?? 0).toFixed(2)}, {(transform.position?.y ?? 0).toFixed(2)}, {(transform.position?.z ?? 0).toFixed(2)}) · {Math.round((transform.rotation?.y || 0) * 180 / Math.PI)}°
          </span>
          <span style={{ fontSize: '9px', color: '#38bdf8' }}>{showPreciseCoords ? 'Fermer ▲' : 'Modifier ▾'}</span>
        </div>
      </div>

      {showPreciseCoords && (
        <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div className="object-coordinates" style={{ marginTop: 0 }}>
            {(['x','y','z'] as const).map(axis => (
              <label key={axis}>{axis.toUpperCase()} · m
                <input type="number" step="0.1" aria-label={`Position ${axis}`} value={transform.position?.[axis] ?? 0} onChange={e => setTransform('position', axis, e.target.valueAsNumber)} />
              </label>
            ))}
          </div>
          <div className="object-coordinates" style={{ marginTop: 0 }}>
            <label>Taille
              <input aria-label="Échelle" type="number" min="0.1" max="10" step="0.1" value={transform.scale?.x ?? 1} onChange={e => {
                const n = e.target.valueAsNumber;
                if (n >= .1 && n <= 10) patch({ capabilities: entity.capabilities.map(c => c.type === 'transform' ? { ...c, scale: { x: n, y: n, z: n } } : c) }, `Redimensionner ${entity.name}`);
              }} />
            </label>
            <label>Rotation · °
              <input type="number" step="15" aria-label="Rotation" value={Math.round((transform.rotation?.y || 0) * 180 / Math.PI)} onChange={e => setTransform('rotation', 'y', e.target.valueAsNumber * Math.PI / 180)} />
            </label>
          </div>
        </div>
      )}
    </div>
    
    {/* Matériaux PBR Pré-Calibrés */}
    <div className="object-interaction pbr-materials-picker" style={{ margin: '10px 0', padding: '10px', background: 'rgba(245, 158, 11, 0.08)', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
      <div className="eyebrow" style={{ color: '#f59e0b', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>✨ MATÉRIAUX PBR (NORMAL MAP & RUGOSITÉ)</span>
        <span style={{ fontSize: '9px', color: '#94a3b8' }}>{entity.visuals?.materialPreset ? getPBRMaterialPreset(entity.visuals.materialPreset)?.name : 'Standard'}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', marginBottom: '8px' }}>
        <button
          type="button"
          className="button subtle"
          style={{
            padding: '4px 2px',
            fontSize: '10px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            background: !entity.visuals?.materialPreset && !entity.visuals?.textureUrl ? 'rgba(56, 189, 248, 0.3)' : 'rgba(0, 0, 0, 0.25)',
            border: !entity.visuals?.materialPreset && !entity.visuals?.textureUrl ? '1.5px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
            color: !entity.visuals?.materialPreset && !entity.visuals?.textureUrl ? '#38bdf8' : '#e2e8f0',
            borderRadius: '6px'
          }}
          title="Rétablir les textures et matériaux natifs d'origine"
          onClick={() => {
            patch({
              visuals: {
                ...entity.visuals,
                materialPreset: undefined,
                textureUrl: undefined,
                roughness: undefined,
                metalness: undefined
              }
            }, `Rétablir textures d'origine sur ${entity.name}`);
          }}
        >
          <span style={{ fontSize: '14px' }}>🔄</span>
          <span style={{ fontSize: '8px', lineHeight: 1.1 }}>D'origine</span>
        </button>
        {getAllPBRMaterialPresets().map(preset => {
          const isSelected = entity.visuals?.materialPreset === preset.id || entity.visuals?.textureUrl === `pbr:${preset.id}`;
          return (
            <button
              key={preset.id}
              type="button"
              className="button subtle"
              style={{
                padding: '4px 2px',
                fontSize: '10px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
                background: isSelected ? 'rgba(245, 158, 11, 0.3)' : 'rgba(0, 0, 0, 0.25)',
                border: isSelected ? '1.5px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.1)',
                color: isSelected ? '#fbbf24' : '#e2e8f0',
                borderRadius: '6px'
              }}
              title={preset.description}
              onClick={() => {
                patch({
                  visuals: {
                    ...entity.visuals,
                    materialPreset: preset.id,
                    textureUrl: `pbr:${preset.id}`,
                    color: preset.defaultColor,
                    roughness: preset.roughness,
                    metalness: preset.metalness,
                    clearcoat: preset.clearcoat,
                    repeat: preset.defaultRepeat
                  }
                }, `Matériau ${preset.name} sur ${entity.name}`);
              }}
            >
              <span style={{ fontSize: '14px' }}>{preset.icon}</span>
              <span style={{ fontSize: '8px', lineHeight: 1.1 }}>{preset.name.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <label style={{ fontSize: '9px', color: '#94a3b8' }}>
          Rugosité : {Math.round((entity.visuals?.roughness ?? 0.38) * 100)}%
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.05" 
            value={entity.visuals?.roughness ?? 0.38} 
            onChange={e => patch({ visuals: { ...entity.visuals, roughness: parseFloat(e.target.value) } }, `Rugosité ${entity.name}`)}
            style={{ width: '100%', marginTop: '3px' }} 
          />
        </label>
        <label style={{ fontSize: '9px', color: '#94a3b8' }}>
          Métallisation : {Math.round((entity.visuals?.metalness ?? 0.22) * 100)}%
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.05" 
            value={entity.visuals?.metalness ?? 0.22} 
            onChange={e => patch({ visuals: { ...entity.visuals, metalness: parseFloat(e.target.value) } }, `Métallisation ${entity.name}`)}
            style={{ width: '100%', marginTop: '3px' }} 
          />
        </label>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', background: 'rgba(0,0,0,0.25)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)', marginTop: '8px' }}>
        <span style={{ fontSize: '11px', color: '#cbd5e1' }}>🎨 Teinte & Accent personnalisé :</span>
        <input type="color" aria-label="Couleur de l’objet" value={entity.visuals?.color || '#548e89'} onChange={e => patch({ visuals: { ...entity.visuals, color: e.target.value } }, `Couleur de ${entity.name}`)} style={{ width: '38px', height: '24px', padding: 0, border: 'none', borderRadius: '4px', cursor: 'pointer' }} />
      </div>
    </div>

    <div className="object-interaction custom-rule-builder">
      <div className="eyebrow" style={{ color: '#a3c299' }}>RÈGLE CAUSALE AU CLIC (NO-CODE)</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', margin: '8px 0' }}>
        <label style={{ fontSize: '9px', color: '#adc2a9' }}>
          Effet sonore
          <select
            value={customSound}
            onChange={e => setCustomSound(e.target.value)}
            style={{ width: '100%', marginTop: '3px', background: '#121a15', border: '1px solid #ffffff25', borderRadius: '4px', color: '#e5eee3', padding: '4px', fontSize: '9px' }}
          >
            <option value="">(Aucun son)</option>
            <option value="coffee_brew">☕ Percolation café</option>
            <option value="sizzle_cook">🥘 Crépitement cuisine</option>
            <option value="bell">🔔 Carillon / Cloche</option>
            <option value="switch_click">🔘 Clic interrupteur</option>
            <option value="fanfare">🎺 Fanfare triomphe</option>
            <option value="bubbles">🫧 Bulles / Ébullition</option>
            <option value="sparkle">✨ Scintillement</option>
            <option value="pour_water">💧 Écoulement d’eau</option>
            <option value="chime">🎐 Carillon doux</option>
            <option value="laser">⚡ Impulsion laser</option>
            <option value="ping">📍 Ping de succès</option>
          </select>
        </label>
        <label style={{ fontSize: '9px', color: '#adc2a9' }}>
          Animation 3D
          <select
            value={customAnim}
            onChange={e => setCustomAnim(e.target.value)}
            style={{ width: '100%', marginTop: '3px', background: '#121a15', border: '1px solid #ffffff25', borderRadius: '4px', color: '#e5eee3', padding: '4px', fontSize: '9px' }}
          >
            <option value="">(Aucune animation)</option>
            <option value="steaming">♨️ Vapeur (steaming)</option>
            <option value="pulsing">💓 Respiration (pulsing)</option>
            <option value="floating">🛸 Sustentation (floating)</option>
            <option value="spinning">🔄 Rotation (spinning)</option>
          </select>
        </label>
      </div>
      <input
        type="text"
        placeholder="Message HUD optionnel (ex: Café servi !)"
        value={customNotice}
        onChange={e => setCustomNotice(e.target.value)}
        style={{ width: '100%', background: '#121a15', border: '1px solid #ffffff20', borderRadius: '4px', color: '#d9e8d4', padding: '5px 8px', fontSize: '9px', marginBottom: '8px' }}
      />
      <button
        className="button primary"
        style={{ width: '100%', fontSize: '10px', padding: '7px' }}
        onClick={handleSaveCustomInteraction}
      >
        ⚡ Enregistrer l’interaction
      </button>
    </div>

    {interaction && <div className="object-interaction"><div className="eyebrow">ESSAYER L’OBJET</div>
      {['activate','explode','pose','assemble'].includes(interaction)&&<button className="button primary" onClick={activate}>{interaction==='explode'?(settings.active?'Rassembler les pièces':'Afficher la vue éclatée'):interaction==='assemble'?(settings.active?'Séparer les pièces':'Assembler les pièces'):interaction==='pose'?'Changer la posture':settings.active?'Désactiver / fermer':'Activer / ouvrir'}</button>}
      {['progress','temperature','balance','breathing'].includes(interaction)&&<label>{interaction==='temperature'?`Température illustrative : ${settings.value||0} °C`:interaction==='balance'?'Répartition illustrative des masses':interaction==='breathing'?'Amplitude de la sphère':'Progression'}<input type="range" min="0" max="100" value={settings.value||0} onChange={e=>configure({value:Number(e.target.value)})}/></label>}
      {interaction==='quiz'&&<><label>Réponse attendue<select value={settings.correctAnswer||'B'} onChange={e=>configure({correctAnswer:e.target.value})}>{['A','B','C'].map(a=><option key={a}>{a}</option>)}</select></label><div className="quiz-answers">{['A','B','C'].map(a=><button className="button" onClick={()=>quiz(a)} key={a}>Réponse {a}</button>)}</div></>}
      {interaction==='help'&&<button className="button" onClick={()=>{setMessage(settings.text||asset?.text||'');useWorldStore.getState().dispatch({type:'REQUEST_HELP',sourceId:entity.id});}}>Afficher le contenu</button>}
      {interaction==='timer'&&<><output className="timer-display">{timerText}</output><div className="quiz-answers"><button className="button" onClick={()=>configure(settings.active?{active:false,elapsed,text:timerText}:{active:true,startedAt:Date.now()})}>{settings.active?'Pause':'Démarrer'}</button><button className="button" onClick={()=>configure({active:false,elapsed:0,text:'00:00'})}>Remise à zéro</button></div></>}
      {interaction==='audio'&&<div className="quiz-answers"><button className="button" onClick={()=>{if(!('speechSynthesis' in window)){setMessage('Lecture vocale indisponible dans ce navigateur.');return;}speechSynthesis.cancel();const speech=new SpeechSynthesisUtterance(settings.text||asset?.text||'');speech.lang='fr-FR';speechSynthesis.speak(speech);setMessage('Lecture du contenu en cours.');}}>Lire le texte</button><button className="button" onClick={()=>{window.speechSynthesis?.cancel();setMessage('Lecture arrêtée.');}}>Arrêter</button></div>}
    </div>}
    {message&&<p className="object-feedback" role="status">{message}</p>}
    <div className="inspector-links" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
      <button
        type="button"
        className="button primary"
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          padding: '8px 12px',
          fontWeight: 600,
          fontSize: '12px',
          background: 'linear-gradient(135deg, #0284c7, #0369a1)',
          borderColor: '#38bdf8',
          color: '#ffffff',
          boxShadow: '0 2px 8px rgba(2, 132, 199, 0.35)',
          cursor: 'pointer'
        }}
        onClick={() => {
          useWorldStore.getState().saveWorldToStorage();
          playAudioFx('switch_click');
        }}
        title="Sauvegarder immédiatement toutes vos modifications dans le navigateur (Ctrl+S / ⌘S)"
      >
        <span>💾</span> <span>Sauvegarder les changements</span>
      </button>
      <div style={{ display: 'flex', gap: '6px', width: '100%' }}>
        {asset && <a className="button" style={{ flex: 1, textAlign: 'center', fontSize: '11px', padding: '6px' }} href={`/library/${asset.id}.glb`} download>Modèle GLB ↓</a>}
        {asset && (
          <button className="button" style={{ flex: 1, fontSize: '11px', padding: '6px' }} onClick={()=>{
            const store=useWorldStore.getState();
            const p=createLibraryPatch([asset.id],store.world.ir.entities);
            store.applyPatch(p,`Ajouter un autre ${effectiveAsset.name}`,{intent:'add_library_object'});
            store.setSpatialContext(p.entitiesCreated![0].id,null);
          }}>＋ Exemplaire</button>
        )}
      </div>
    </div>
  </section>;
}
