import { WorldPatch, EntitySpec, RuleSpec } from '../core/types';

export interface DataPoint {
  id: string;
  label: string;
  value: number;
  unit?: string;
  category?: string;
  color?: string;
  description?: string;
}

export interface SemanticDataset {
  id: string;
  title: string;
  category: string;
  description: string;
  unit: string;
  points: DataPoint[];
  archetype?: 'towers' | 'terrain' | 'orbital';
}

export const curatedDatasets: SemanticDataset[] = [
  {
    id: 'business-quarterly',
    title: 'Performance Financière & Revenus Trimestriels',
    category: 'Entreprise & Finance',
    description: 'Progression du chiffre d’affaires et investissements R&D matérialisés en piliers architecturaux.',
    unit: 'M€',
    archetype: 'towers',
    points: [
      { id: 'q1', label: 'T1 · Q1 (Lancement)', value: 42.5, unit: 'M€', color: '#38bdf8', description: 'Revenus du 1er trimestre : 42.5 M€ (+12% vs N-1)' },
      { id: 'q2', label: 'T2 · Q2 (Croissance)', value: 68.2, unit: 'M€', color: '#34d399', description: 'Revenus du 2ème trimestre : 68.2 M€ (+24% vs T1)' },
      { id: 'q3', label: 'T3 · Q3 (Expansion)', value: 94.8, unit: 'M€', color: '#fbbf24', description: 'Revenus du 3ème trimestre : 94.8 M€ (+39% vs T2)' },
      { id: 'q4', label: 'T4 · Q4 (Record)', value: 128.4, unit: 'M€', color: '#f87171', description: 'Revenus du 4ème trimestre : 128.4 M€ (Pic annuel historique)' },
      { id: 'rd', label: 'R&D · Innovation', value: 35.0, unit: 'M€', color: '#a78bfa', description: 'Investissement en Recherche & Développement IA Spatiale : 35 M€' }
    ]
  },
  {
    id: 'energy-consumption',
    title: 'Mix Énergétique & Décarbonation Globale',
    category: 'Énergie & Climat',
    description: 'Capacité de production décarbonée par filière matérialisée en skyline d’énergie verte.',
    unit: 'GW',
    archetype: 'towers',
    points: [
      { id: 'solar', label: 'Solaire Photovoltaïque', value: 78.4, unit: 'GW', color: '#f59e0b', description: 'Production solaire : 78.4 GW (Rendement estival optimal)' },
      { id: 'wind', label: 'Éolien Offshore & Terrestre', value: 64.2, unit: 'GW', color: '#06b6d4', description: 'Parcs éoliens : 64.2 GW (Facteur de charge 38%)' },
      { id: 'nuclear', label: 'Nucléaire Décarboné', value: 115.0, unit: 'GW', color: '#10b981', description: 'Base pilotable décarbonée : 115.0 GW (Disponibilité 88%)' },
      { id: 'hydro', label: 'Hydroélectricité & Retenues', value: 48.6, unit: 'GW', color: '#3b82f6', description: 'Réservoirs hydrauliques : 48.6 GW (Stockage gravitaire)' },
      { id: 'biomass', label: 'Biomasse & Géothermie', value: 22.8, unit: 'GW', color: '#84cc16', description: 'Énergie de cogénération locale : 22.8 GW' }
    ]
  },
  {
    id: 'space-telemetry',
    title: 'Télémétrie Rover Martien Jezero',
    category: 'Aérospatial & Science',
    description: 'Flux de télémesures en temps réel des sous-systèmes du rover martien explorant le cratère Jezero.',
    unit: '% / °C / Bar',
    archetype: 'towers',
    points: [
      { id: 'batt', label: 'Batterie Nucléaire RTG', value: 92, unit: '%', color: '#10b981', description: 'État de charge RTG : 92% (Autonomie nominale 420 sols)' },
      { id: 'temp', label: 'Température Châssis', value: 35, unit: 'pts', color: '#38bdf8', description: 'Température interne régulée : -45°C stabilisée (Indice 35/100)' },
      { id: 'pressure', label: 'Pression Atmosphérique', value: 61, unit: 'Pa x10', color: '#f43f5e', description: 'Pression atmosphérique martienne : 610 Pascals (Indice 61/100)' },
      { id: 'speed', label: 'Vitesse de Déplacement', value: 42, unit: 'mm/s', color: '#eab308', description: 'Vitesse d’avance motorisée : 42 mm/s en navigation autonome' },
      { id: 'signal', label: 'Signal Antenne Orbiteur', value: 98, unit: 'dBm', color: '#8b5cf6', description: 'Gain de liaison montante UHF vers Mars Reconnaissance Orbiter : 98%' }
    ]
  },
  {
    id: 'victoria-vr-tokenomics',
    title: 'Économie Virtuelle & Web3 Victoria VR',
    category: 'Métavers & Web3',
    description: 'Répartition des flux et de la gouvernance de l’écosystème Victoria VR en anneau métrique spatial.',
    unit: 'M VR',
    archetype: 'orbital',
    points: [
      { id: 'staking', label: 'Staking & Sécurité Réseau', value: 150, unit: 'M VR', color: '#00d2ff', description: '150 Millions de tokens VR verrouillés en Staking de consensus' },
      { id: 'dao', label: 'Trésorerie DAO & Projets', value: 120, unit: 'M VR', color: '#a855f7', description: '120 Millions alloués au financement communautaire décentralisé' },
      { id: 'rewards', label: 'Récompenses Créateurs', value: 85, unit: 'M VR', color: '#ec4899', description: '85 Millions réservés aux architectes et bâtisseurs d’expériences' },
      { id: 'liquidity', label: 'Pools de Liquidité DEX', value: 65, unit: 'M VR', color: '#f59e0b', description: '65 Millions assurant la profondeur de marché sur DEX' },
      { id: 'circulation', label: 'Circulation Libre', value: 210, unit: 'M VR', color: '#10b981', description: '210 Millions en échange actif sur les marchés mondiaux' }
    ]
  },
  {
    id: 'server-infrastructure',
    title: 'Latence & Débit Cluster Cloud Mondial',
    category: 'Infrastructure Cloud',
    description: 'Cartographie spatiale des temps de réponse et de la charge réseau des centres de calcul mondiaux.',
    unit: 'ms',
    archetype: 'towers',
    points: [
      { id: 'eu', label: 'Nœud Francfort (EU-Central)', value: 14, unit: 'ms', color: '#22c55e', description: 'Latence Ultra-Basse : 14 ms (Trafic : 480 Gbps, Santé : 100%)' },
      { id: 'us', label: 'Nœud Virginie (US-East)', value: 38, unit: 'ms', color: '#3b82f6', description: 'Latence Transatlantique : 38 ms (Trafic : 620 Gbps, Santé : 99.8%)' },
      { id: 'tokyo', label: 'Nœud Tokyo (AP-Northeast)', value: 82, unit: 'ms', color: '#f97316', description: 'Latence Pacifique : 82 ms (Trafic : 310 Gbps, Santé : 99.9%)' },
      { id: 'sg', label: 'Nœud Singapour (AP-Southeast)', value: 95, unit: 'ms', color: '#eab308', description: 'Latence Asie du Sud : 95 ms (Trafic : 280 Gbps, Santé : 99.7%)' },
      { id: 'sa', label: 'Nœud São Paulo (SA-East)', value: 130, unit: 'ms', color: '#ef4444', description: 'Latence Amérique du Sud : 130 ms (Trafic : 190 Gbps, Santé : 99.4%)' }
    ]
  }
];

export function getSemanticDataset(id: string): SemanticDataset {
  return curatedDatasets.find(d => d.id === id) || curatedDatasets[0];
}

/**
 * Parses raw JSON or CSV into a standardized SemanticDataset.
 */
export function parseRawData(rawInput: string, titleOverride: string = 'Jeu de données personnalisé'): SemanticDataset {
  const trimmed = rawInput.trim();
  const palette = ['#38bdf8', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#f59e0b', '#06b6d4', '#ec4899'];

  // 1. Try parsing JSON
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);
      let items: any[];
      if (Array.isArray(parsed)) {
        items = parsed;
      } else if (Array.isArray(parsed.data)) {
        items = parsed.data;
      } else if (Array.isArray(parsed.points)) {
        items = parsed.points;
      } else {
        items = Object.entries(parsed).map(([k, v]) =>
          v && typeof v === 'object' ? { label: k, ...v } : { label: k, value: v }
        );
      }
      const points: DataPoint[] = items.slice(0, 10).map((item, index) => {
        const isObj = item !== null && typeof item === 'object';
        const label = isObj
          ? (item.label ?? item.name ?? item.title ?? item.category ?? `Donnée ${index + 1}`)
          : `Donnée ${index + 1}`;
        const rawVal = isObj ? (item.value ?? item.count ?? item.amount ?? 10) : item;
        const val = typeof rawVal === 'number' ? rawVal : parseFloat(String(rawVal));
        const unit = isObj ? (item.unit || '') : '';
        const safeVal = isNaN(val) ? 10 : val;
        return {
          id: `point_${index + 1}`,
          label: String(label),
          value: safeVal,
          unit: String(unit),
          color: (isObj && item.color) || palette[index % palette.length],
          description: (isObj && item.description) || `${label} : ${safeVal} ${unit}`.trim()
        };
      });

      return {
        id: `custom_${Date.now()}`,
        title: titleOverride,
        category: 'Personnalisé',
        description: `Matérialisation sémantique de ${points.length} points de données.`,
        unit: points[0]?.unit || 'pts',
        points
      };
    } catch (_) {}
  }

  // 2. Parse CSV
  const lines = trimmed.split('\n').map(l => l.trim()).filter(Boolean);
  const points: DataPoint[] = [];

  for (let i = 0; i < lines.length && points.length < 10; i++) {
    // Skip header row if present
    if (i === 0 && (lines[i].toLowerCase().includes('label') || lines[i].toLowerCase().includes('nom') || lines[i].toLowerCase().includes('titre'))) {
      continue;
    }
    const parts = lines[i].split(/[,;]/).map(p => p.trim());
    if (parts.length >= 2) {
      const label = parts[0];
      const val = parseFloat(parts[1]);
      const unit = parts[2] || '';
      if (!isNaN(val)) {
        points.push({
          id: `point_${points.length + 1}`,
          label,
          value: val,
          unit,
          color: palette[points.length % palette.length],
          description: `${label} : ${val} ${unit}`.trim()
        });
      }
    }
  }

  if (points.length === 0) {
    // Fallback default
    return curatedDatasets[0];
  }

  return {
    id: `custom_${Date.now()}`,
    title: titleOverride,
    category: 'Personnalisé',
    description: `Matérialisation sémantique de ${points.length} lignes CSV.`,
    unit: points[0]?.unit || 'pts',
    points
  };
}

/**
 * Materializes any SemanticDataset into a 3D architectural WorldPatch with physical entities,
 * glowing caps, telemetry indicators and causal rules.
 */
export function materializeDataTo3D(
  dataset: SemanticDataset,
  layout: 'linear' | 'circular' | 'grid' = 'linear'
): WorldPatch {
  const points = dataset.points;
  if (!points || points.length === 0) return {};

  const entitiesCreated: EntitySpec[] = [];
  const rulesChanged: RuleSpec[] = [];

  const values = points.map(p => Number.isFinite(p.value) ? p.value : 0);
  const maxVal = Math.max(...values);
  const minVal = Math.min(...values);
  const range = maxVal === minVal ? 1 : (maxVal - minVal);

  const minHeight = 0.5;
  const maxHeight = 3.8;

  const cols = layout === 'grid' ? Math.max(1, Math.ceil(Math.sqrt(points.length))) : points.length;
  const rows = layout === 'grid' ? Math.max(1, Math.ceil(points.length / cols)) : 1;
  const plinthWidth = layout === 'grid' ? Math.max(4.5, cols * 1.5) : Math.max(5.5, points.length * 1.3);
  const plinthDepth = layout === 'grid' ? Math.max(3.2, rows * 1.5) : (layout === 'circular' ? 3.6 : 2.4);

  // 1. Base Stage Runner / Plinth (socle architectural porteur)
  const baseRunnerId = `data_plinth_${dataset.id}`;
  entitiesCreated.push({
    id: baseRunnerId,
    name: `Socle · ${dataset.title}`,
    capabilities: [
      {
        type: 'transform',
        position: { x: 0, y: 0.04, z: -0.8 },
        scale: { x: plinthWidth, y: 0.08, z: plinthDepth }
      }
    ],
    visuals: {
      shape: 'box',
      color: '#1a221d'
    }
  });

  // 2. Data Towers & Telemetry Caps
  points.forEach((point, index) => {
    // Height normalized to [minHeight, maxHeight]
    const safeVal = Number.isFinite(point.value) ? point.value : 0;
    const normalized = maxVal === minVal ? 0.5 : Math.max(0, Math.min(1, (safeVal - minVal) / range));
    const height = minHeight + normalized * (maxHeight - minHeight);
    const radius = 0.32;
    const towerColor = point.color || '#38bdf8';

    let posX = 0;
    let posZ = 0;

    if (layout === 'circular') {
      const angle = (index / points.length) * Math.PI * 1.6 - Math.PI * 0.8;
      const r = 2.4;
      posX = Math.sin(angle) * r;
      posZ = -0.8 - Math.cos(angle) * (r * 0.6);
    } else if (layout === 'grid') {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const spacingX = 1.35;
      const spacingZ = 1.35;
      const startX = -((cols - 1) * spacingX) / 2;
      const startZ = -0.8 - ((rows - 1) * spacingZ) / 2;
      posX = Number((startX + col * spacingX).toFixed(3));
      posZ = Number((startZ + row * spacingZ).toFixed(3));
    } else {
      // Linear layout across X
      const spacing = Math.min(1.4, 6.0 / Math.max(1, points.length - 1));
      const startX = -((points.length - 1) * spacing) / 2;
      posX = startX + index * spacing;
      posZ = -0.8;
    }

    const towerId = `data_pillar_${point.id}`;
    const capId = `data_cap_${point.id}`;

    // Main 3D Data Tower
    entitiesCreated.push({
      id: towerId,
      name: `${point.label} (${point.value} ${dataset.unit})`,
      capabilities: [
        {
          type: 'transform',
          position: { x: posX, y: height / 2 + 0.08, z: posZ },
          scale: { x: radius * 2, y: height, z: radius * 2 }
        },
        { type: 'collider' },
        { type: 'interactive' },
        { type: 'data_telemetry', value: point.value, unit: dataset.unit, description: point.description }
      ],
      visuals: {
        shape: 'cylinder',
        color: towerColor
      }
    });

    // Glowing Emissive Telemetry Cap
    entitiesCreated.push({
      id: capId,
      name: `Capteur · ${point.label}`,
      capabilities: [
        {
          type: 'transform',
          position: { x: posX, y: height + 0.12, z: posZ },
          scale: { x: radius * 2.2, y: 0.08, z: radius * 2.2 }
        }
      ],
      visuals: {
        shape: 'cylinder',
        color: '#ffffff'
      }
    });

    // Interactive Rule on Click / Touch
    rulesChanged.push({
      id: `rule_inspect_${point.id}`,
      trigger: 'INTERACT',
      conditions: [
        { type: 'is_source', sourceId: towerId }
      ],
      actions: [
        {
          type: 'show_warning',
          message: `📊 [${dataset.title}] ${point.label} : ${point.value} ${dataset.unit}. ${point.description || ''}`
        },
        {
          type: 'play_sound',
          sound: 'ping'
        }
      ]
    });
  });

  return {
    entitiesCreated,
    rulesChanged
  };
}
