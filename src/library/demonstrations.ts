import type { WorldPatch, EntitySpec, RuleSpec } from '../core/types';
import { getAsset } from './catalog';
import { createBagShowcasePatch } from './bagShowcase';

export interface DemonstrationScenario {
  id: string;
  number: number;
  title: string;
  category: 'Cuisine & Gastronomie' | 'Réunion & Conférence' | 'Ville Parisienne & FLE' | 'Physique & Réactions' | 'Web3 & Innovation' | 'Mode & Luxe Showroom';
  prompt: string;
  description: string;
  interactionSummary: string;
  triggerButtonLabel: string;
  primaryEntityId: string;
  atmosphere?: string;
  equipment: { name: string; assetId: string }[];
  assetPlacements: { assetId: string; pos: [number, number, number]; rot?: [number, number, number]; scale?: [number, number, number]; text?: string }[];
  rules: RuleSpec[];
}

export const demonstrationScenarios: DemonstrationScenario[] = [{
    id: 'demo-mindel-bag-capacity',
    number: 12,
    title: 'Mindel : Sac 42L & Test de Capacité Spatiale',
    category: 'Mode & Luxe Showroom',
    prompt: 'Tester la capacité du Sac Voyageur Pro 42L et son compartiment ordinateur',
    description: 'Démonstrateur de référence Mindel (Web 3D hybride sémantique) : Sac 42L avec parties sémantiques (housse ordi, cavité principale, poche gourde), bascule d’états ouvert/fermé, test géométrique de capacité spatiale pour Laptop 15.6", détection d’incompatibilité et fiches 2D enrichies.',
    interactionSummary: 'Ouvrez le sac pour inspecter ses 3 compartiments, faites glisser le laptop 15.6" pour valider qu’il rentre sans forcer, logez la gourde latérale et testez le gros carton incompatible.',
    triggerButtonLabel: '🎒 Tester la capacité du sac',
    primaryEntityId: 'sac_nomade_42',
    atmosphere: 'atelier',
    equipment: [
      { name: 'Sac Nomade Pro 42L', assetId: 'wp-sac-voyageur-42l' },
      { name: 'Ordinateur Pro 15.6"', assetId: 'ordinateur' },
      { name: 'Gourde Isotherme 750ml', assetId: 'wp-gourde-isotherme' },
      { name: 'Gros Carton Incompatible', assetId: 'wp-carton-oversized' },
      { name: 'Table de Présentation Studio', assetId: 'table' }
    ],
    assetPlacements: [
      { assetId: 'table', pos: [0, 0.4, 0], scale: [2.2, 0.8, 1.4] },
      { assetId: 'wp-sac-voyageur-42l', pos: [0, 0.85, 0], rot: [0, 0.15, 0] },
      { assetId: 'ordinateur', pos: [0.65, 0.82, 0.1], rot: [0, -0.2, 0] },
      { assetId: 'wp-gourde-isotherme', pos: [-0.6, 0.82, 0.15] },
      { assetId: 'wp-carton-oversized', pos: [0.7, 0.82, -0.45] }
    ],
    rules: []
  }];

export function createDemonstrationPatch(demo: DemonstrationScenario, existing: Record<string, EntitySpec> = {}): WorldPatch {
  const existingIds = Object.keys(existing || {});
  const entitiesRemoved = existingIds.length > 0 ? existingIds : undefined;

  if (demo.id === 'demo-mindel-bag-capacity') {
    const patch = createBagShowcasePatch();
    return {
      ...patch,
      worldTheme: 'luxury-showroom',
      ...(entitiesRemoved ? { entitiesRemoved } : {})
    };
  }

  const entitiesCreated: EntitySpec[] = [];
  const prefix = demo.id.replace('demo-', 'demo_');

  // 1. Interactive explanation board (center rear)
  entitiesCreated.push({
    id: `${prefix}_board`,
    name: `Démonstration · ${demo.title}`,
    capabilities: [
      { type: 'transform', position: { x: -1.85, y: 0, z: -0.4 }, rotation: { x: 0, y: 0.35, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
      { type: 'collider' },
      {
        type: 'educational',
        text: `★ DÉMO INTERACTIVE : ${demo.title.toUpperCase()}\n${demo.description}\n\nACTION DU SCÉNARIO :\n${demo.interactionSummary}\n\nPrompt vocal/texte : « ${demo.prompt} »`,
        value: 0,
        active: true
      }
    ],
    visuals: { assetId: 'captions', modelUrl: '/library/captions.glb' }
  });

  // 2. Physical props mapped with demo IDs
  demo.assetPlacements.forEach((placement, idx) => {
    const meta = getAsset(placement.assetId);
    let entityId = `${prefix}_obj_${idx + 1}`;

    // Precise semantic entity ID mapping for demonstration interactions:
    if (demo.id === 'demo-espresso-barista') {
      if (placement.assetId === 'coffee-machine') entityId = 'demo_espresso_machine';
      else if (placement.assetId === 'wp-tasse-a-the') entityId = 'demo_espresso_cup';
      else if (placement.assetId === 'counter') entityId = 'demo_espresso_counter';
    } else if (demo.id === 'demo-ratatouille-simmer') {
      if (placement.assetId === 'wp-cocotte') entityId = 'demo_ratatouille_cocotte';
      else if (placement.assetId === 'wp-ilot-de-cuisine') entityId = 'demo_ratatouille_ilot';
    } else if (demo.id === 'demo-pitch-projection') {
      if (placement.assetId === 'wp-videoprojecteur') entityId = 'demo_pitch_projector';
      else if (placement.assetId === 'wall-screen') entityId = 'demo_pitch_screen';
    } else if (demo.id === 'demo-postal-deposit') {
      if (placement.assetId === 'wp-boite-aux-lettres-de-rue') entityId = 'demo_postal_mailbox';
    } else if (demo.id === 'demo-chemistry-boil') {
      if (placement.assetId === 'wp-bruleur-de-laboratoire') entityId = 'demo_chemistry_burner';
      else if (placement.assetId === 'wp-fiole-erlenmeyer') entityId = 'demo_chemistry_flask';
      else if (placement.assetId === 'technical-bench') entityId = 'demo_chemistry_bench';
    } else if (demo.id === 'demo-design-sprint') {
      if (placement.assetId === 'mobile-board') entityId = 'demo_sprint_board';
    } else if (demo.id === 'demo-cozy-fireplace') {
      if (placement.assetId === 'coffee-table') entityId = 'demo_cozy_table';
    } else if (demo.id === 'demo-music-jam') {
      if (placement.assetId === 'wp-guitare-acoustique') entityId = 'demo_music_guitar';
    } else if (demo.id === 'demo-victoria-vr-mint') {
      if (placement.assetId === 'pedestal') entityId = 'demo_vr_pedestal';
      else if (placement.assetId === 'wp-casque-vr') entityId = 'demo_vr_helmet';
    } else if (demo.id === 'demo-seminar-checkin') {
      if (placement.assetId === 'wp-badge-de-participant') entityId = 'demo_checkin_badge';
      else if (placement.assetId === 'counter') entityId = 'demo_checkin_counter';
    } else if (demo.id === 'demo-spatial-web-3d') {
      if (placement.assetId === 'table') entityId = 'demo_cabinet_table';
      else if (placement.assetId === 'book') entityId = 'demo_cabinet_book';
      else if (placement.assetId === 'ordinateur') entityId = 'demo_cabinet_laptop';
      else if (placement.assetId === 'globe') entityId = 'demo_cabinet_globe';
      else if (placement.assetId === 'turntable') entityId = 'demo_cabinet_turntable';
      else if (placement.assetId === 'microscope') entityId = 'demo_cabinet_microscope';
      else if (placement.assetId === 'porte-documents') entityId = 'demo_cabinet_blueprint';
    } else if (idx === 0) {
      entityId = demo.primaryEntityId;
    }

    const isFixedFurniture = [
      'counter', 'technical-bench', 'wall-screen', 'bench', 'wp-ilot-de-cuisine',
      'wp-bureau-individuel', 'pedestal', 'sofa', 'wp-table-haute-de-reunion', 'coffee-table', 'table',
      'wp-reverbere-de-rue', 'wp-boite-aux-lettres-de-rue', 'floor-lamp', 'planter', 'mobile-board', 'bar-chart'
    ].includes(placement.assetId);

    const webUrls: Record<string, string> = {
      'book': 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      'porte-documents': 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      'ordinateur': 'https://threejs.org/docs/',
      'globe': 'https://fr.wikipedia.org/wiki/Terre',
      'turntable': 'https://fr.wikipedia.org/wiki/Disque_microsillon',
      'microscope': 'https://fr.m.wikipedia.org/wiki/Microbiologie'
    };
    const targetWebUrl = webUrls[placement.assetId];

    const safeY = (!isFixedFurniture && placement.pos[1] >= 0.85 && placement.pos[1] <= 0.915)
      ? 0.925
      : (!isFixedFurniture && placement.pos[1] >= 0.38 && placement.pos[1] <= 0.425)
      ? 0.435
      : (!isFixedFurniture && placement.pos[1] >= 0.72 && placement.pos[1] <= 0.78)
      ? 0.785
      : placement.pos[1];

    entitiesCreated.push({
      id: entityId,
      name: meta?.name || placement.assetId,
      capabilities: [
        {
          type: 'transform',
          position: { x: placement.pos[0], y: safeY, z: placement.pos[2] },
          rotation: placement.rot ? { x: placement.rot[0], y: placement.rot[1], z: placement.rot[2] } : { x: 0, y: 0, z: 0 },
          scale: placement.scale ? { x: placement.scale[0], y: placement.scale[1], z: placement.scale[2] } : { x: 1, y: 1, z: 1 }
        },
        ...(!isFixedFurniture ? [{ type: 'draggable' as const }] : []),
        { type: 'collider' as const },
        ...(targetWebUrl ? [{ type: 'web_screen' as const, url: targetWebUrl }] : []),
        { type: 'educational' as const, text: placement.text || meta?.name || placement.assetId, value: 0, active: false }
      ],
      visuals: {
        assetId: placement.assetId,
        modelUrl: `/library/${placement.assetId}.glb`
      }
    });
  });

  return {
    entitiesCreated,
    rulesChanged: demo.rules,
    invariantsAdded: [],
    ...(entitiesRemoved ? { entitiesRemoved } : {})
  };
}

for(let i=demonstrationScenarios.length-1;i>=0;i--)if(!["demo-mindel-bag-capacity"].includes(demonstrationScenarios[i].id))demonstrationScenarios.splice(i,1);
