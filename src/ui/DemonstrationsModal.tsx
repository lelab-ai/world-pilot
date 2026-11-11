import { useState, useEffect } from 'react';
import { demonstrationScenarios, createDemonstrationPatch, type DemonstrationScenario } from '../library/demonstrations';
import { certifiedExperiencesRegistry } from '../library/certifiedExperiences';
import { parseInstruction } from '../authoring/parser';
import { PEDAGOGICAL_PRESETS } from '../research/pedagogicalCompiler';
import { useWorldStore } from '../engine/store';

interface DemonstrationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestDeploy?: (title: string, onExecute: (clearFirst: boolean) => void) => void;
}

const LOW_RICHNESS_DEMO_IDS = new Set([
  'demo-postal-deposit',
  'demo-music-jam',
  'demo-seminar-checkin',
  'demo-cozy-fireplace',
  'demo-victoria-vr-mint',
  'demo-pitch-projection',
  'demo-design-sprint',
  'demo-espresso-barista',
  'demo-ratatouille-simmer',
  'demo-chemistry-boil'
]);

export function DemonstrationsModal({ isOpen, onClose, onRequestDeploy }: DemonstrationsModalProps) {
  const [activeTab, setActiveTab] = useState<'demos' | 'pedagogy'>('demos');
  const [categoryFilter, setCategoryFilter] = useState<string>('Toutes');
  const [onlyValidated, setOnlyValidated] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [selectedLabKey, setSelectedLabKey] = useState<string>('electricity_ohm');
  const uiLanguage = useWorldStore(state => state.uiLanguage);
  const isFr = uiLanguage === 'fr';

  const certifiedAsDemos: DemonstrationScenario[] = certifiedExperiencesRegistry
    .filter(c => !demonstrationScenarios.some(d => d.prompt === c.actionPresetCommand))
    .map((c, idx) => ({
      id: c.id,
      number: demonstrationScenarios.length + idx + 1,
      title: (!isFr && c.titleEn) ? c.titleEn : c.title,
      category: (c.category.includes('Luxe') ? 'Mode & Luxe Showroom' : c.category.includes('Cuisine') ? 'Cuisine & Gastronomie' : c.category.includes('Auto') ? 'Physique & Réactions' : 'Web3 & Innovation') as any,
      prompt: (!isFr && c.promptEn) ? c.promptEn : c.prompt,
      description: (!isFr && c.descriptionEn) ? c.descriptionEn : c.description,
      interactionSummary: (!isFr && c.interactionHighlightsEn) ? c.interactionHighlightsEn.join(' · ') : c.interactionHighlights.join(' · '),
      triggerButtonLabel: isFr ? '⚡ Lancer l’expérience' : '⚡ Launch Experience',
      primaryEntityId: 'primary_entity',
      equipment: ((!isFr && c.realisticObjectsEn) ? c.realisticObjectsEn : c.realisticObjects).map(obj => ({ name: obj, assetId: 'cube' })),
      assetPlacements: [],
      rules: []
    }));

  const allAvailableDemos = [
    ...demonstrationScenarios.filter(d => !LOW_RICHNESS_DEMO_IDS.has(d.id)),
    ...certifiedAsDemos
  ];
  const [selectedDemo, setSelectedDemo] = useState<DemonstrationScenario>(allAvailableDemos[0]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const pedagogicalList = Object.values(PEDAGOGICAL_PRESETS);
  const selectedLab = PEDAGOGICAL_PRESETS[selectedLabKey] || pedagogicalList[0];

  const filteredDemos = allAvailableDemos.filter(d => {
    const matchesCat = categoryFilter === 'Toutes' || d.category === categoryFilter;
    const matchesSearch = !search.trim() ||
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.description.toLowerCase().includes(search.toLowerCase()) ||
      d.prompt.toLowerCase().includes(search.toLowerCase()) ||
      d.equipment.some(e => e.name.toLowerCase().includes(search.toLowerCase()));
    const isVal = certifiedExperiencesRegistry.some(c => c.actionPresetCommand === d.prompt || c.id.includes(d.id.replace('demo-', '')));
    const matchesValidated = !onlyValidated || isVal;
    return matchesCat && matchesSearch && matchesValidated;
  });

  const handleDeploy = (demo: DemonstrationScenario, autoTrigger: boolean = false) => {
    const execute = (clearFirst: boolean) => {
      const store = useWorldStore.getState();
      if (clearFirst) {
        store.resetWorld();
      }
      if (demo.assetPlacements && demo.assetPlacements.length > 0) {
        const patch = createDemonstrationPatch(demo, store.world.ir.entities);
        store.applyPatch(
          patch,
          `Démonstration : ${demo.title}`,
          { intent: 'load_demonstration', actions: [{ action: 'create_demo_scenario', target: demo.id }] }
        );
        if (demo.atmosphere) {
          store.setAtmosphere(demo.atmosphere);
        }
        store.setSpatialContext(demo.primaryEntityId, null);

        if (autoTrigger) {
          // Small timeout to allow R3F and store to register before triggering interaction
          setTimeout(() => {
            store.dispatch({
              type: 'INTERACT',
              sourceId: demo.primaryEntityId
            });
          }, 350);
        }
      } else {
        const parseResult = parseInstruction(demo.prompt, store.spatialContext, store.world.ir.entities);
        if (parseResult.patch) {
          store.applyPatch(parseResult.patch, `Démonstration : ${demo.title}`, parseResult.plan);
        }
      }
      store.setCurrentSceneTitle(demo.title);
      onClose();
    };

    if (onRequestDeploy) {
      onRequestDeploy(demo.title, execute);
    } else {
      execute(false);
    }
  };

  const handleDeployLab = (presetId: string) => {
    const executeLab = (clearFirst: boolean) => {
      const store = useWorldStore.getState();
      if (clearFirst) {
        store.resetWorld();
      }
      store.compileAndLoadPedagogicalSimulation(presetId);
      store.setCurrentSceneTitle(selectedLab.title);
      onClose();
    };

    if (onRequestDeploy) {
      onRequestDeploy(selectedLab.title, executeLab);
    } else {
      executeLab(false);
    }
  };

  const categories = [
    { id: 'Toutes', label: isFr ? 'Toutes' : 'All' },
    { id: 'Mode & Luxe Showroom', label: isFr ? 'Mode et luxe' : 'Fashion & Luxury' },
    { id: 'Cuisine & Gastronomie', label: isFr ? 'Cuisine et gastronomie' : 'Culinary & Gastronomy' },
    { id: 'Réunion & Conférence', label: isFr ? 'Réunion et conférence' : 'Meeting & Seminar' },
    { id: 'Ville Parisienne & FLE', label: isFr ? 'Ville parisienne et FLE' : 'Parisian City & FLE' },
    { id: 'Physique & Réactions', label: isFr ? 'Physique et réactions' : 'Physics & Reactions' },
    { id: 'Web3 & Innovation', label: isFr ? 'Web3 et innovation' : 'Web3 & Innovation' }
  ];

  return (
    <div className="library-backdrop" role="dialog" aria-modal="true" aria-labelledby="demo-title">
      <div className="library-dialog fle-modal-dialog">
        <header>
          <div>
            <div className="eyebrow">
              {activeTab === 'demos' 
                ? (isFr ? "Chorégraphies d'interactions et causalité · 10 démonstrations" : "Interaction Choreographies & Causality · 10 Demos")
                : (isFr ? "Recherche cognitive Bloom-3D · Laboratoires physiques actifs" : "Bloom-3D Cognitive Research · Active Physical Labs")}
            </div>
            <h2 id="demo-title">
              {activeTab === 'demos' ? (isFr ? "Catalogue de démonstrations interactives" : "Interactive Demonstrations Catalog") : (isFr ? "Laboratoires pédagogiques et pièges cognitifs" : "Pedagogical Labs & Cognitive Traps")}
            </h2>
            <p>
              {activeTab === 'demos'
                ? (isFr ? "Prompts naturels · Objets communicants · Réactions en chaîne · Sons et particules réactifs" : "Natural Prompts · Communicating Objects · Chain Reactions · Reactive Audio & FX")
                : (isFr ? "Action-Graph Compiler · Erreurs fécondes délibérées · Appareillage expérimental modélisé en 3D" : "Action-Graph Compiler · Deliberate Productive Failures · 3D Physical Apparatus")}
            </p>
          </div>
          <button className="icon-button" onClick={onClose} aria-label={isFr ? "Fermer" : "Close"}>×</button>
        </header>

        <div style={{ display: 'flex', gap: '10px', padding: '4px 24px 14px 24px', borderBottom: '1px solid #ffffff15' }}>
          <button
            className={`button ${activeTab === 'demos' ? 'primary' : 'subtle'}`}
            onClick={() => setActiveTab('demos')}
            style={{ flex: 1, padding: '10px 16px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <span>🌟</span>
            <span>{isFr ? `Démonstrations et expériences (${allAvailableDemos.length})` : `Demonstrations & Experiences (${allAvailableDemos.length})`}</span>
          </button>
          <button
            className={`button ${activeTab === 'pedagogy' ? 'primary' : 'subtle'}`}
            onClick={() => setActiveTab('pedagogy')}
            style={{
              flex: 1,
              padding: '10px 16px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              background: activeTab === 'pedagogy' ? 'linear-gradient(135deg, #1565c0, #0d47a1)' : undefined,
              borderColor: activeTab === 'pedagogy' ? '#64b5f6' : undefined,
            }}
          >
            <span>🔬</span>
            <span>{isFr ? 'Laboratoires actifs Bloom-3D (3)' : 'Active Bloom-3D Labs (3)'}</span>
          </button>
        </div>

        {activeTab === 'demos' ? (
          <>
            <div className="library-filters">
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '100%' }}>
                <input
                  type="text"
                  placeholder={isFr ? "Rechercher une expérience (Louis Vuitton, café, pitch, ratatouille, boîte, fiole...)" : "Search experience (Louis Vuitton, coffee, pitch, ratatouille, box, flask...)"}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  aria-label={isFr ? "Recherche" : "Search"}
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  className={`button ${onlyValidated ? 'primary' : 'subtle'}`}
                  onClick={() => setOnlyValidated(!onlyValidated)}
                  style={{
                    whiteSpace: 'nowrap',
                    fontSize: '0.82rem',
                    padding: '8px 12px',
                    borderColor: onlyValidated ? '#81c784' : undefined,
                    background: onlyValidated ? 'rgba(76, 175, 80, 0.2)' : undefined,
                    color: onlyValidated ? '#c8e6c9' : undefined
                  }}
                >
                  {onlyValidated ? (isFr ? '🛡️ Filtre : validées uniquement' : '🛡️ Filter: validated only') : (isFr ? '🛡️ Filtre : toutes' : '🛡️ Filter: all')}
                </button>
              </div>
              <div className="fle-level-tabs" role="tablist">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    className={`button ${categoryFilter === cat.id ? 'primary' : 'subtle'}`}
                    onClick={() => setCategoryFilter(cat.id)}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="fle-layout-container">
              <div className="fle-scene-list">
                {filteredDemos.map(demo => (
                  <div
                    key={demo.id}
                    className={`fle-scene-item ${selectedDemo.id === demo.id ? 'active' : ''}`}
                    onClick={() => setSelectedDemo(demo)}
                  >
                    <div className="fle-item-header">
                      <span className="fle-badge">{demo.category.split(' & ')[0]}</span>
                      <span className="fle-number">#{demo.number.toString().padStart(2, '0')}</span>
                    </div>
                    <h4>{demo.title}</h4>
                    <p className="fle-cat">« {demo.prompt.slice(0, 48)}… »</p>
                    <div className="fle-vocab-tags">
                      {demo.equipment.map((eq, i) => (
                        <span key={i} className="fle-tag">{eq.name}</span>
                      ))}
                    </div>
                  </div>
                ))}
                {filteredDemos.length === 0 && (
                  <p className="empty-message">{isFr ? "Aucune démonstration ne correspond à votre recherche." : "No demonstration matches your search."}</p>
                )}
              </div>

              <div className="fle-preview-panel">
                <div className="fle-preview-header">
                  <span className="fle-badge large">{isFr ? 'Démo' : 'Demo'} #{selectedDemo.number.toString().padStart(2, '0')}</span>
                  <div>
                    <h3>{selectedDemo.title}</h3>
                    <span className="fle-cat">{selectedDemo.category}</span>
                  </div>
                </div>

                <div className="fle-section">
                  <div className="section-title"><span>{isFr ? "Prompt en langage naturel (à écrire ou dicter)" : "Natural language prompt (text or speech)"}</span></div>
                  <pre className="fle-dialogue-box" style={{ color: '#c7e6b1', fontWeight: 600 }}>
                    « {selectedDemo.prompt} »
                  </pre>
                </div>

                <p className="fle-desc">{selectedDemo.description}</p>

                <div className="fle-section">
                  <div className="section-title"><span>{isFr ? "Chorégraphie d’interaction et réactions en chaîne" : "Interaction choreography & chain reactions"}</span></div>
                  <p className="fle-desc" style={{ background: '#111a14', padding: '12px 14px', borderRadius: '8px', border: '1px solid #62775644' }}>
                    💡 {selectedDemo.interactionSummary}
                  </p>
                </div>

                <div className="fle-section">
                  <div className="section-title"><span>{isFr ? "Objets 3D mobilisés sur la scène" : "3D Entities involved in scene"}</span></div>
                  <div className="fle-vocab-full">
                    {selectedDemo.equipment.map((eq, i) => (
                      <span key={i} className="fle-tag highlight">
                        ✦ {eq.name}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="fle-preview-actions" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button
                    className="button primary large-btn"
                    onClick={() => handleDeploy(selectedDemo, true)}
                    style={{ background: 'linear-gradient(135deg, #2e7d32, #1b5e20)', borderColor: '#81c784' }}
                  >
                    ⚡ {isFr ? "Déployer et déclencher l’interaction en direct" : "Deploy and trigger interaction live"} ({selectedDemo.triggerButtonLabel})
                  </button>
                  <button
                    className="button subtle large-btn"
                    onClick={() => handleDeploy(selectedDemo, false)}
                  >
                    ✦ {isFr ? "Déployer la scène sans déclenchement immédiat" : "Deploy scene without immediate trigger"}
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="fle-layout-container" style={{ marginTop: '16px' }}>
            <div className="fle-scene-list">
              {pedagogicalList.map(lab => (
                <div
                  key={lab.id}
                  className={`fle-scene-item ${selectedLab.id === lab.id ? 'active' : ''}`}
                  onClick={() => setSelectedLabKey(lab.id)}
                  style={{ borderLeft: selectedLab.id === lab.id ? '3px solid #64b5f6' : undefined }}
                >
                  <div className="fle-item-header">
                    <span className="fle-badge" style={{ background: '#1976d2', color: '#fff' }}>
                      {lab.domain.replace('_', ' ')}
                    </span>
                    <span className="fle-number" style={{ color: '#90caf9', fontWeight: 'bold' }}>
                      Bloom: {lab.bloomLevel}
                    </span>
                  </div>
                  <h4>{lab.title}</h4>
                  <p className="fle-cat" style={{ color: '#ffb74d' }}>
                    ⚠️ {lab.misconceptionTrap.slice(0, 70)}…
                  </p>
                  <div className="fle-vocab-tags">
                    {lab.apparatusSpecs.map((app, i) => (
                      <span key={i} className="fle-tag">
                        ⚙️ {app.name} ({app.initialReading} {app.metricUnit})
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="fle-preview-panel">
              <div className="fle-preview-header">
                <span className="fle-badge large" style={{ background: '#0d47a1', color: '#90caf9', border: '1px solid #1976d2' }}>
                  Labo Bloom-3D
                </span>
                <div>
                  <h3>{selectedLab.title}</h3>
                  <span className="fle-cat" style={{ color: '#64b5f6' }}>
                    Domaine : {selectedLab.domain} · Palier cognitif : {selectedLab.bloomLevel}
                  </span>
                </div>
              </div>

              <div className="fle-section">
                <div className="section-title"><span>Piège cognitif et erreur féconde délibérée</span></div>
                <div style={{ background: '#2c1505', border: '1px solid #e65100', padding: '12px 14px', borderRadius: '8px', color: '#ffe0b2', fontSize: '0.9rem', lineHeight: 1.5 }}>
                  <strong>⚠️ Dispositif de contrainte épistémique :</strong> {selectedLab.misconceptionTrap}
                </div>
              </div>

              <div className="fle-section">
                <div className="section-title"><span>Objectifs d'apprentissage visés</span></div>
                <ul style={{ margin: 0, paddingLeft: '20px', color: '#cfd8dc', fontSize: '0.88rem', lineHeight: 1.6 }}>
                  {selectedLab.learningObjectives.map((obj, i) => (
                    <li key={i}>{obj}</li>
                  ))}
                </ul>
              </div>

              <div className="fle-section">
                <div className="section-title"><span>Appareillage physique sur la paillasse (3D)</span></div>
                <div className="fle-vocab-full">
                  {selectedLab.apparatusSpecs.map((app, i) => (
                    <span key={i} className="fle-tag highlight" style={{ background: '#102a45', borderColor: '#2196f3' }}>
                      🔬 {app.name} — <strong style={{ color: '#90caf9' }}>{app.initialReading} {app.metricUnit}</strong>
                    </span>
                  ))}
                </div>
              </div>

              <div className="fle-preview-actions" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
                <button
                  className="button primary large-btn"
                  onClick={() => handleDeployLab(selectedLab.id)}
                  style={{ background: 'linear-gradient(135deg, #1565c0, #0d47a1)', borderColor: '#64b5f6', boxShadow: '0 4px 14px rgba(21, 101, 192, 0.4)' }}
                >
                  ⚡ Compiler et charger le laboratoire actif (Bloom-3D)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
