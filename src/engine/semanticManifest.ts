import { EntitySpec, WorldIR } from '../core/types';

/**
 * Mindel Manifeste Sémantique d'Objet & de Scène (Mindel §4, §5, §6, §11, §21)
 * Sérialisation standardisée en JSON-LD (Schema.org & W3C Web of Things / WoT)
 * Séparant l'entité logique de sa représentation 3D (glTF/GLB/procedural).
 */

export interface SemanticEntityJsonLd {
  '@context': (string | Record<string, string>)[];
  '@type': string[];
  '@id': string;
  name: string;
  description: string;
  image?: string;
  sku?: string;
  material?: string;
  weight?: {
    '@type': 'QuantitativeValue';
    value: number;
    unitCode: 'KGM';
  };
  depth?: {
    '@type': 'QuantitativeValue';
    value: number;
    unitCode: 'MTR';
  };
  width?: {
    '@type': 'QuantitativeValue';
    value: number;
    unitCode: 'MTR';
  };
  height?: {
    '@type': 'QuantitativeValue';
    value: number;
    unitCode: 'MTR';
  };
  additionalProperty?: Array<{
    '@type': 'PropertyValue';
    name: string;
    value: string | number;
    unitText?: string;
  }>;
  hasPart?: Array<{
    '@type': 'ProductPart';
    identifier: string;
    name: string;
    description?: string;
    capacityLiters?: number;
    fitsMaxDimensions?: [number, number, number];
  }>;
  relatedLink?: Array<{
    '@type': 'WebResource';
    role: string;
    name: string;
    url: string;
  }>;
  'wot:actions'?: Record<string, {
    title: string;
    description: string;
    targetState?: string;
  }>;
  'wp:spatialRepresentation'?: {
    format: 'glTF' | 'procedural' | 'box' | 'sphere' | 'cylinder' | string;
    modelUrl?: string;
    fallback2DUrl?: string;
    availableStates?: string[];
  };
}

export function exportEntityToJsonLd(entity: EntitySpec): SemanticEntityJsonLd {
  const jsonLd: SemanticEntityJsonLd = {
    '@context': [
      'https://schema.org/',
      {
        wot: 'https://www.w3.org/2019/wot/td/v1#',
        wp: 'https://worldpilot.ai/ns/spatial#'
      }
    ],
    '@type': ['Product', 'wot:Thing'],
    '@id': `urn:worldpilot:entity:${entity.id}`,
    name: entity.name,
    description: entity.fallback2D?.description || `Objet interactif ${entity.name}`,
  };

  if (entity.fallback2D?.thumbnailUrl) {
    jsonLd.image = entity.fallback2D.thumbnailUrl;
  }

  if (entity.physicalProperties) {
    const p = entity.physicalProperties;
    if (p.sku) jsonLd.sku = p.sku;
    if (p.material) jsonLd.material = p.material;
    if (p.weightKg !== undefined) {
      jsonLd.weight = {
        '@type': 'QuantitativeValue',
        value: p.weightKg,
        unitCode: 'KGM'
      };
    }
    if (p.dimensions) {
      const [w, h, d] = p.dimensions;
      jsonLd.width = { '@type': 'QuantitativeValue', value: w, unitCode: 'MTR' };
      jsonLd.height = { '@type': 'QuantitativeValue', value: h, unitCode: 'MTR' };
      jsonLd.depth = { '@type': 'QuantitativeValue', value: d, unitCode: 'MTR' };
    }

    const additionalProps: SemanticEntityJsonLd['additionalProperty'] = [];
    if (p.capacityLiters !== undefined) {
      additionalProps.push({
        '@type': 'PropertyValue',
        name: 'volumeCapacity',
        value: p.capacityLiters,
        unitText: 'L'
      });
    }
    if (p.fitsMaxDimensions) {
      additionalProps.push({
        '@type': 'PropertyValue',
        name: 'fitsMaxDimensionsMeters',
        value: p.fitsMaxDimensions.join('x'),
        unitText: 'm'
      });
    }
    if (additionalProps.length > 0) {
      jsonLd.additionalProperty = additionalProps;
    }
  }

  if (entity.parts && entity.parts.length > 0) {
    jsonLd.hasPart = entity.parts.map(pt => ({
      '@type': 'ProductPart',
      identifier: pt.id,
      name: pt.name,
      description: pt.description,
      capacityLiters: pt.capacityLiters,
      fitsMaxDimensions: pt.fitsMaxDimensions
    }));
  }

  if (entity.resources && entity.resources.length > 0) {
    jsonLd.relatedLink = entity.resources.map(r => ({
      '@type': 'WebResource',
      role: r.role,
      name: r.label,
      url: r.url
    }));
  }

  // W3C WoT Semantic Actions
  const actions: Record<string, { title: string; description: string; targetState?: string }> = {};
  if (entity.availableStates && entity.availableStates.length > 0) {
    entity.availableStates.forEach(st => {
      actions[`set_${st}`] = {
        title: `Passer à l'état ${st}`,
        description: `Bascule l'état fonctionnel de l'objet vers ${st}`,
        targetState: st
      };
    });
  }
  if (entity.parts && entity.parts.length > 0) {
    actions['toggle_exploded_view'] = {
      title: 'Vue éclatée interactive',
      description: 'Déploie les composants internes et révèle les points d\'intérêt sémantiques.'
    };
  }
  if (entity.physicalProperties?.fitsMaxDimensions) {
    actions['test_capacity'] = {
      title: 'Test de compatibilité spatiale',
      description: 'Vérifie si un objet physique externe rentre dans les compartiments de ce produit.'
    };
  }
  if (Object.keys(actions).length > 0) {
    jsonLd['wot:actions'] = actions;
  }

  // Séparation représentation 3D (Mindel §4 & §12)
  jsonLd['wp:spatialRepresentation'] = {
    format: entity.visuals?.modelUrl ? 'glTF' : (entity.visuals?.shape || 'procedural'),
    modelUrl: entity.visuals?.modelUrl,
    fallback2DUrl: entity.fallback2D?.specificationSheetUrl,
    availableStates: entity.availableStates
  };

  return jsonLd;
}

export function exportSceneToJsonLd(ir: WorldIR, sceneTitle?: string): string {
  const entitiesJsonLd = Object.values(ir.entities).map(exportEntityToJsonLd);

  // Composition spatiale (Mindel §10 : manifeste de scène -> instances -> transforms + relations)
  const spatialComposition = Object.values(ir.entities).map(e => {
    const transform = e.capabilities.find(c => c.type === 'transform');
    return {
      '@type': 'wp:SpatialInstance',
      targetEntity: `urn:worldpilot:entity:${e.id}`,
      name: e.name,
      transform: transform ? {
        position: transform.position,
        rotation: transform.rotation,
        scale: transform.scale
      } : undefined,
      state: e.state || 'default',
      relations: e.relations?.map(r => ({
        type: `wp:${r.type}`,
        target: `urn:worldpilot:entity:${r.targetId}`
      }))
    };
  });

  const root = {
    '@context': [
      'https://schema.org/',
      {
        wot: 'https://www.w3.org/2019/wot/td/v1#',
        wp: 'https://worldpilot.ai/ns/spatial#',
        iiif: 'https://iiif.io/api/presentation/4#'
      }
    ],
    '@type': ['SpatialScene', 'wot:ThingCollection'],
    '@id': `urn:worldpilot:scene:${Date.now()}`,
    name: sceneTitle || 'Scène interactive WorldPilot',
    about: "Scène 3D hybride sémantique avec physique, causalité et contrats d'objets (Mindel §10 & §21).",
    conformsTo: [
      'https://www.w3.org/TR/wot-thing-description11/',
      'https://schema.org/SpatialScene',
      'https://iiif.io/api/presentation/4.0/'
    ],
    hasPart: entitiesJsonLd,
    'wp:spatialComposition': spatialComposition,
    activeQuestId: ir.activeQuestId || null,
    rulesCount: Object.keys(ir.rules || {}).length,
    invariantsCount: Object.keys(ir.invariants || {}).length
  };
  return JSON.stringify(root, null, 2);
}

