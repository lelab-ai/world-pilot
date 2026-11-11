import type {EntitySpec,WorldPatch,RuleSpec} from '../core/types';
import data from './publicCatalog.json';
import specialized from './publicSpecialized.json';
import aliases from './publicAliases.json';
export interface DetailedCatalogItem {id:string;name:string;category:string;description:string;size:readonly[number,number,number];text?:string;role?:'floor_furniture'|'support'|'prop'|'zone'|'static';interaction?:string;zone?:boolean;recipe?:string;variant?:number;}
export type CatalogItem=DetailedCatalogItem;
export type AssetId=string;
export const catalog:CatalogItem[]=data.map(a=>({...a,size:[a.size[0],a.size[1],a.size[2]] as [number,number,number]}));
export const SPECIALIZED_DETAILED_ASSETS:Record<string,DetailedCatalogItem>=specialized as unknown as Record<string,DetailedCatalogItem>;
export const ASSET_ALIASES:Record<string,string>=aliases;
export const fullCatalog=[...catalog,...Object.values(SPECIALIZED_DETAILED_ASSETS).filter(a=>!catalog.some(c=>c.id===a.id))];
export function resolveCanonicalAssetId(rawId?:string,modelUrl?:string){const raw=(rawId||modelUrl?.split('/').pop()?.replace(/\.glb$/i,'')||'').toLowerCase().trim();return ASSET_ALIASES[raw]||raw||undefined;}
export function getAsset(id?:string){return fullCatalog.find(a=>a.id===(resolveCanonicalAssetId(id)||id));}
export function normalize(text: string) { return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[’']/g, ' '); }

export function createLibraryPatch(ids: readonly AssetId[], existing: Record<string, EntitySpec>): WorldPatch {
  const occupied = Object.values(existing).map(e => e.capabilities.find(c => c.type === 'transform')?.position).filter(Boolean);
  const entitiesCreated = ids.filter(id=>getAsset(id)).map((id, i): EntitySpec => {
    const asset = getAsset(id);
    const rawName = id.replace(/^wp-/, '').replace(/[-_]/g, ' ');
    const entityName = asset?.name || (rawName.charAt(0).toUpperCase() + rawName.slice(1));
    let slot = 0;
    // Stable spacing, including repeated additions and non-library objects.
    let position = { x: 0, y: 0, z: 0 };
    do {
      const columns = 4;
      position = { x: Number(((slot % columns - 1.5) * 2.8).toFixed(2)), y: 0, z: Math.floor(slot / columns) * 2.8 - 2.8 };
      slot++;
    } while (occupied.some(p => Math.abs(p.x - position.x) < 2.4 && Math.abs(p.z - position.z) < 2.4));
    occupied.push(position);
    return {
      id: `asset_${id}_${i + 1}`, name: entityName,
      capabilities: [{ type: 'transform', position, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } }, { type: 'collider' },
        { type: 'educational', text: asset?.text, value: 0, active: false, correctAnswer: 'B' },
        ...(asset && 'zone' in asset && (asset as any).zone ? [{ type: 'trigger_zone', radius: 0.4 }] : [])],
      visuals: { assetId: id, modelUrl: `/library/${id}.glb` },
    };
  });
  // IDs are unique across both the existing world and this batch.
  const used = new Set(Object.keys(existing));
  entitiesCreated.forEach(entity => {
    const base = entity.id;
    let suffix = 1;
    while (used.has(entity.id)) entity.id = `${base}_${suffix++}`;
    used.add(entity.id);
  });
  const rulesChanged: RuleSpec[] = [];
  for (const entity of entitiesCreated) {
    const asset = getAsset(entity.visuals?.assetId)!;
    if ('interaction' in asset) {
      const trigger = asset.interaction === 'quiz' ? 'ANSWER_CORRECT' : asset.interaction === 'help' ? 'REQUEST_HELP' : 'INTERACT';
      rulesChanged.push({ id: `rule_${entity.id}`, trigger, conditions: [{type:'is_source',sourceId:entity.id}], actions: [{type:'set_flag',flag:`${entity.id}_${trigger.toLowerCase()}`,value:true}] });
    }
    if ('zone' in asset && asset.zone) rulesChanged.push({id:`rule_${entity.id}_drop`,trigger:'DROP',conditions:[{type:'is_target',targetId:entity.id}],actions:[{type:'set_flag',flag:`${entity.id}_occupied`,value:true}]});
  }
  return { entitiesCreated, rulesChanged };
}

export const lessonKit: AssetId[] = ['socket', 'technical-bench', 'wp-ordinateur-portable'];

const COMPLEX_INTENT_KEYWORDS = [
  'jeu', 'game', 'gameplay', 'loop', 'stand de tir', 'target range',
  'enigme', 'puzzle', 'course', 'collector', 'survie', 'survival',
  'simulation', 'laboratoire', 'demonstration', 'recette', 'seminaire',
  'rover', 'maintenance', 'showroom', 'exposition', 'post-processing',
  'lumen', 'cinematique', 'texture', 'materiau', 'matériau', 'matiere', 'matière'
];

export function parseLibraryInstruction(instruction: string, existing: Record<string, EntitySpec>): WorldPatch | null {
  const norm = normalize(instruction).trim().replace(/[.!]$/, '');
  if (/^(cree|creer|ajoute|ajouter|create|add) (un |une |le |la )?(atelier pedagogique|salle de cours|cours interactif|kit pedagogique)$/.test(norm)) return createLibraryPatch(lessonKit, existing);
  const verb = /^(?:cree|creer|ajoute|ajouter|create|add|pose|poser|place|placer|mets|mettre|remets|remettre|restaure|restaurer|affiche|afficher|recharge|recharger|charge|charger|instancie|instancier|spawn)\s+(?:(?:un|une|le|la|l|l'|l’|des|les|du|de la|de l'|de l’)\s+)?/i;
  if (!verb.test(norm)) return null;
  const requested = norm.replace(verb, '').trim();

  // If the instruction targets a complex gameplay loop or procedural macro, bypass single-asset library match
  if (COMPLEX_INTENT_KEYWORDS.some(kw => requested === kw || requested.startsWith(kw + ' '))) {
    return null;
  }

  // Common synonyms / semantic aliases
  const SYNONYMS: Record<string, string> = {
    'table de cuisine': 'wp-ilot-de-cuisine',
    'table cuisine': 'wp-ilot-de-cuisine',
    'ilot': 'wp-ilot-de-cuisine',
    'ilot de cuisine': 'wp-ilot-de-cuisine',
    'ilot central': 'wp-ilot-de-cuisine',
    'plan de travail': 'wp-ilot-de-cuisine',
    'etabli de cuisine': 'wp-ilot-de-cuisine',
    'table culinaire': 'wp-ilot-de-cuisine',
    'cuillere en bois': 'wp-cuillere-bois',
    'cuillere bois': 'wp-cuillere-bois',
    'cuillère en bois': 'wp-cuillere-bois',
    'cuillère bois': 'wp-cuillere-bois',
    'cuillere de cuisine': 'wp-cuillere-bois',
    'cuillère de cuisine': 'wp-cuillere-bois',
  };

  // If kitchen context (cocotte, vegetables, chef) and requested is generic 'table' -> wp-ilot-de-cuisine
  const isKitchenContext = Object.values(existing).some(e => {
    const a = (e.visuals?.assetId || '').toLowerCase();
    const n = (e.name || '').toLowerCase();
    return a.includes('cocotte') || a.includes('courgette') || a.includes('tomate') || a.includes('recette') || n.includes('cocotte') || n.includes('recette');
  });

  if ((requested === 'table' || requested === 'la table') && isKitchenContext) {
    return createLibraryPatch(['wp-ilot-de-cuisine'], existing);
  }

  if (SYNONYMS[requested]) {
    return createLibraryPatch([SYNONYMS[requested]], existing);
  }

  // 1. Exact match on normalized name
  let asset = catalog.find(item => normalize(item.name) === requested);
  if (asset) return createLibraryPatch([asset.id], existing);

  // 2. Direct ID or Alias match
  asset = catalog.find(item => item.id === requested || item.id === `wp-${requested}` || item.id.replace('wp-', '') === requested);
  if (asset) return createLibraryPatch([asset.id], existing);

  // 3. Name starts with requested word (e.g. "table" -> "Table de réunion", "pomme" -> "Pomme rouge")
  asset = catalog.find(item => {
    const itemNorm = normalize(item.name);
    return itemNorm.startsWith(requested + ' ') || itemNorm.endsWith(' ' + requested);
  });
  if (asset) return createLibraryPatch([asset.id], existing);

  // 4. Exact word token match (e.g. "chaise", "bouteille", "verre", "ordinateur")
  asset = catalog.find(item => {
    const tokens = normalize(item.name).split(/[\s-]+/);
    return tokens.includes(requested);
  });
  if (asset) return createLibraryPatch([asset.id], existing);

  // 5. General substring match if length > 3
  if (requested.length >= 4) {
    asset = catalog.find(item => normalize(item.name).includes(requested));
    if (asset) return createLibraryPatch([asset.id], existing);
  }

  return null;
}
