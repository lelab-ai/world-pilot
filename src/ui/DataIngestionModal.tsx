import React, { useState, useEffect, useMemo } from 'react';
import { 
  curatedDatasets, 
  parseRawData, 
  materializeDataTo3D, 
  SemanticDataset 
} from '../engine/dataIngestion';
import { useWorldStore } from '../engine/store';

interface DataIngestionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SAMPLE_JSON = `[
  { "label": "IA Spatiale & Synthèse", "value": 142.5, "unit": "M€", "color": "#38bdf8" },
  { "label": "Moteur Physique WebXR", "value": 98.2, "unit": "M€", "color": "#34d399" },
  { "label": "Jumeaux Numériques", "value": 115.0, "unit": "M€", "color": "#fbbf24" },
  { "label": "Écosystème Métavers VR", "value": 164.8, "unit": "M€", "color": "#f87171" },
  { "label": "Infrastructure Cloud Décentralisée", "value": 85.0, "unit": "M€", "color": "#a78bfa" }
]`;

const SAMPLE_CSV = `Métrique, Valeur, Unité
Production Éolienne Offshore, 84.5, GW
Parc Photovoltaïque Territorial, 68.2, GW
Nucléaire Pilotable Décarboné, 112.0, GW
Stockage Hydroélectrique de Pointe, 45.3, GW
Biomasse & Cogénération, 28.6, GW`;

export const DataIngestionModal: React.FC<DataIngestionModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'curated' | 'custom'>('curated');
  const [selectedCuratedId, setSelectedCuratedId] = useState<string>(curatedDatasets[0].id);
  const [layoutMode, setLayoutMode] = useState<'linear' | 'circular'>('linear');

  // Custom data state
  const [customTitle, setCustomTitle] = useState('Mon flux de données');
  const [rawText, setRawText] = useState(SAMPLE_JSON);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Selected curated dataset
  const currentCurated = useMemo(() => {
    return curatedDatasets.find(d => d.id === selectedCuratedId) || curatedDatasets[0];
  }, [selectedCuratedId]);

  // Parsed custom dataset
  const parsedCustomDataset = useMemo(() => {
    try {
      return parseRawData(rawText, customTitle);
    } catch {
      return null;
    }
  }, [rawText, customTitle]);

  const activeDataset: SemanticDataset = activeTab === 'curated' 
    ? currentCurated 
    : (parsedCustomDataset || currentCurated);

  const handleMaterialize = () => {
    if (!activeDataset || !activeDataset.points || activeDataset.points.length === 0) return;

    const patch = materializeDataTo3D(activeDataset, layoutMode);
    const store = useWorldStore.getState();

    store.applyPatch(
      patch,
      `Matérialisation 3D : ${activeDataset.title}`,
      {
        intent: 'materialize_data_3d',
        actions: [{ action: 'create_data_towers', target: activeDataset.id }]
      }
    );

    // Notify listeners (Spatial Agent, UI notifications, Web Audio)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('worldpilot_data_materialized', {
        detail: {
          dataset: activeDataset,
          title: activeDataset.title,
          pointsCount: activeDataset.points.length
        }
      }));
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="library-backdrop" role="dialog" aria-modal="true" aria-labelledby="data-ingestion-title">
      <div className="library-dialog data-modal-dialog">
        <header>
          <div>
            <div className="eyebrow">DATA-TO-3D · INGESTION SÉMANTIQUE SPATIALE</div>
            <h2 id="data-ingestion-title">Matérialiser vos données en architectures 3D</h2>
            <p>
              Transformez des flux tabulaires (KPIs, énergie, télémétrie spatiale, tokenomics Web3) en véritables structures 3D tangibles et interactives.
            </p>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Fermer">×</button>
        </header>

        {/* Tab selection */}
        <div className="data-tabs-row" role="tablist">
          <button
            className={`button ${activeTab === 'curated' ? 'primary' : 'subtle'}`}
            onClick={() => setActiveTab('curated')}
            role="tab"
            aria-selected={activeTab === 'curated'}
          >
            📊 Datasets Curés ({curatedDatasets.length})
          </button>
          <button
            className={`button ${activeTab === 'custom' ? 'primary' : 'subtle'}`}
            onClick={() => setActiveTab('custom')}
            role="tab"
            aria-selected={activeTab === 'custom'}
          >
            ✏️ Données Personnalisées (JSON / CSV)
          </button>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Disposition :</span>
            <button
              className={`button ${layoutMode === 'linear' ? 'primary' : 'subtle'}`}
              onClick={() => setLayoutMode('linear')}
              title="Alignement linéaire sur socle"
            >
              Piliers Linéaires
            </button>
            <button
              className={`button ${layoutMode === 'circular' ? 'primary' : 'subtle'}`}
              onClick={() => setLayoutMode('circular')}
              title="Disposition en anneau orbital 180°"
            >
              Anneau Circulaire
            </button>
          </div>
        </div>

        <div className="data-modal-body">
          {activeTab === 'curated' ? (
            <div className="data-curated-container">
              <div className="data-cards-grid">
                {curatedDatasets.map(dataset => {
                  const isSelected = dataset.id === selectedCuratedId;
                  return (
                    <div
                      key={dataset.id}
                      className={`data-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedCuratedId(dataset.id)}
                    >
                      <div className="data-card-header">
                        <span className="data-category-badge">{dataset.category}</span>
                        <span className="data-unit-badge">{dataset.unit}</span>
                      </div>
                      <h4 className="data-card-title">{dataset.title}</h4>
                      <p className="data-card-desc">{dataset.description}</p>
                      <div className="data-card-footer">
                        <span>{dataset.points.length} piliers de données</span>
                        <span className="data-preview-dots">
                          {dataset.points.map(p => (
                            <span 
                              key={p.id} 
                              className="data-color-dot" 
                              style={{ backgroundColor: p.color || '#38bdf8' }} 
                              title={`${p.label}: ${p.value} ${dataset.unit}`}
                            />
                          ))}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Detail view of active curated dataset */}
              <div className="data-active-detail">
                <div className="data-detail-header">
                  <h3>{currentCurated.title}</h3>
                  <span className="data-category-tag">{currentCurated.category}</span>
                </div>
                <div className="data-points-list">
                  {currentCurated.points.map(pt => (
                    <div key={pt.id} className="data-point-row">
                      <span className="point-indicator" style={{ backgroundColor: pt.color || '#38bdf8' }} />
                      <span className="point-label">{pt.label}</span>
                      <span className="point-value">{pt.value} <small>{currentCurated.unit}</small></span>
                      <span className="point-desc">{pt.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="data-custom-container">
              <div className="data-custom-controls">
                <div className="custom-input-field">
                  <label htmlFor="custom-dataset-title">Titre du jeu de données :</label>
                  <input
                    id="custom-dataset-title"
                    type="text"
                    value={customTitle}
                    onChange={e => setCustomTitle(e.target.value)}
                    placeholder="Ex : Ventes Trimestrielles 2026..."
                  />
                </div>
                <div className="custom-presets">
                  <span>Modèles :</span>
                  <button className="button subtle small" onClick={() => setRawText(SAMPLE_JSON)}>Charger JSON</button>
                  <button className="button subtle small" onClick={() => setRawText(SAMPLE_CSV)}>Charger CSV</button>
                </div>
              </div>

              <div className="data-editor-layout">
                <div className="data-editor-col">
                  <label htmlFor="raw-data-textarea">Flux Brut (JSON ou CSV) :</label>
                  <textarea
                    id="raw-data-textarea"
                    value={rawText}
                    onChange={e => setRawText(e.target.value)}
                    rows={11}
                    placeholder="Collez votre JSON ou CSV ici..."
                  />
                </div>

                <div className="data-preview-col">
                  <label>Aperçu Détecté ({parsedCustomDataset?.points.length || 0} grandeurs) :</label>
                  <div className="data-points-list preview-mode">
                    {parsedCustomDataset?.points.map(pt => (
                      <div key={pt.id} className="data-point-row">
                        <span className="point-indicator" style={{ backgroundColor: pt.color || '#38bdf8' }} />
                        <span className="point-label">{pt.label}</span>
                        <span className="point-value">{pt.value} <small>{pt.unit || parsedCustomDataset.unit}</small></span>
                      </div>
                    ))}
                    {(!parsedCustomDataset || parsedCustomDataset.points.length === 0) && (
                      <p className="empty-preview-note">Aucun point détecté. Vérifiez la syntaxe JSON ou CSV.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <footer className="data-modal-footer">
          <div className="footer-info">
            <span>Matérialisation : <b>{activeDataset.points.length}</b> structures architecturales avec balises luminescentes et règles causales.</span>
          </div>
          <div className="footer-actions">
            <button className="button subtle" onClick={onClose}>Annuler</button>
            <button className="button primary" onClick={handleMaterialize}>
              Matérialiser en 3D ({activeDataset.points.length} Piliers)
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};
