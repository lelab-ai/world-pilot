import React, { useState, useEffect, useRef } from 'react';
import { useWorldStore } from '../engine/store';
import { playAudioFx } from '../engine/evaluator';
import { ambientAudio } from '../engine/ambientAudio';
import { useDraggableModal } from './useDraggableModal';

export const WebScreenModal: React.FC = () => {
  const url = useWorldStore(state => state.activeWebModalUrl);
  const title = useWorldStore(state => state.activeWebModalTitle);
  const content = useWorldStore(state => state.activeWebModalContent);
  const entityId = useWorldStore(state => state.activeWebModalEntityId);
  const closeWebModal = useWorldStore(state => state.closeWebModal);
  const uiLanguage = useWorldStore(state => state.uiLanguage);
  const isFr = uiLanguage === 'fr';

  const [currentUrl, setCurrentUrl] = useState(url || '');
  const [iframeKey, setIframeKey] = useState(0);
  const [activeTab, setActiveTab] = useState<'live' | 'reader' | 'pdf' | 'art'>(content ? 'reader' : 'live');
  const [docText, setDocText] = useState(content || '');
  const [isEditingDoc, setIsEditingDoc] = useState(false);
  const [pdfZoom, setPdfZoom] = useState(100);
  const originalVolRef = useRef<number | null>(null);
  const { offset, dragProps } = useDraggableModal();

  const isPdf = currentUrl.toLowerCase().endsWith('.pdf') || 
                (title && (title.toLowerCase().includes('pdf') || title.toLowerCase().includes('livre')));
  const isArt = (title && (title.toLowerCase().includes('art') || title.toLowerCase().includes('toile') || title.toLowerCase().includes('peinture') || title.toLowerCase().includes('louvre') || title.toLowerCase().includes('joconde') || title.toLowerCase().includes('chef-d’œuvre'))) ||
                currentUrl.includes('louvre') || currentUrl.includes('joconde');

  // Audio ducking for reading comfort (saved once when modal opens, restored when closed)
  useEffect(() => {
    if (url) {
      if (originalVolRef.current === null) {
        originalVolRef.current = ambientAudio.getVolume();
        ambientAudio.setVolume(originalVolRef.current * 0.35);
      }
    } else {
      if (originalVolRef.current !== null) {
        ambientAudio.setVolume(originalVolRef.current);
        originalVolRef.current = null;
      }
    }
    return () => {
      if (originalVolRef.current !== null) {
        ambientAudio.setVolume(originalVolRef.current);
        originalVolRef.current = null;
      }
    };
  }, [url]);

  useEffect(() => {
    if (url) {
      setCurrentUrl(url);
      if (content) {
        setDocText(content);
        setActiveTab('reader');
      } else if (url.toLowerCase().endsWith('.pdf') || (title && (title.toLowerCase().includes('pdf') || title.toLowerCase().includes('livre')))) {
        setActiveTab('pdf');
      } else if (isArt) {
        setActiveTab('art');
      } else {
        setActiveTab('live');
      }
    }
  }, [url, title, content, isArt]);

  const handleSaveDoc = () => {
    if (entityId) {
      const targetEntity = useWorldStore.getState().world.ir.entities[entityId];
      if (targetEntity) {
        const hasEdu = targetEntity.capabilities.some((c: any) => c.type === 'educational');
        const updatedCaps = hasEdu
          ? targetEntity.capabilities.map((c: any) => c.type === 'educational' ? { ...c, text: docText } : c)
          : [...targetEntity.capabilities, { type: 'educational', text: docText, active: true }];
        useWorldStore.getState().applyPatch({
          entitiesChanged: [{
            id: entityId,
            capabilities: updatedCaps
          }]
        }, `Modifier la fiche de ${targetEntity.name}`, {});
      }
    }
    playAudioFx('quantum_ping');
    setIsEditingDoc(false);
    useWorldStore.setState(s => ({
      warnings: [...s.warnings, `💾 Fiche synchronisée avec l'objet 3D !`]
    }));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeWebModal();
      }
    };
    if (url) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [url, closeWebModal]);

  if (!url) return null;

  const handleNavigate = (e: React.FormEvent) => {
    e.preventDefault();
    let target = currentUrl.trim();
    if (!target) return;
    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      target = 'https://' + target;
      setCurrentUrl(target);
    }
    setIframeKey(k => k + 1);
  };

  const handleOpenExternal = () => {
    if (currentUrl) {
      window.open(currentUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handlePinToSpatialWorld = () => {
    const id = `web_pin_${Date.now()}`;
    const cleanTitle = title || (currentUrl.includes('wikipedia') ? 'Article Encyclopédique' : 'Ressource Web 3D');
    
    // Choose appropriate 3D visual archetype based on content
    let assetId = 'web-screen';
    let entityName = cleanTitle;
    let spawnY = 1.2;
    let spawnZ = -1.2;

    if (activeTab === 'pdf' || currentUrl.toLowerCase().endsWith('.pdf')) {
      if (cleanTitle.toLowerCase().includes('plan') || cleanTitle.toLowerCase().includes('schéma') || cleanTitle.toLowerCase().includes('cad')) {
        assetId = 'porte-documents';
        entityName = `📐 ${cleanTitle}`;
        spawnY = 0.95;
      } else {
        assetId = 'book';
        entityName = `📖 ${cleanTitle}`;
        spawnY = 0.95;
      }
    } else if (currentUrl.includes('threejs') || currentUrl.includes('github') || currentUrl.includes('docs')) {
      assetId = 'wp-ordinateur-portable';
      entityName = `💻 ${cleanTitle}`;
      spawnY = 0.95;
    } else if (currentUrl.includes('louvre') || currentUrl.includes('art') || currentUrl.includes('peinture')) {
      assetId = 'wp-toile-encadree';
      entityName = `🎨 ${cleanTitle}`;
      spawnY = 1.6;
      spawnZ = -2.0;
    } else if (currentUrl.includes('audio') || currentUrl.includes('musique') || currentUrl.includes('microsillon')) {
      assetId = 'turntable';
      entityName = `📻 ${cleanTitle}`;
      spawnY = 0.95;
    } else if (currentUrl.includes('terre') || currentUrl.includes('globe') || currentUrl.includes('geography')) {
      assetId = 'globe';
      entityName = `🌍 ${cleanTitle}`;
      spawnY = 0.95;
    } else if (currentUrl.includes('microbiolog') || currentUrl.includes('biology') || currentUrl.includes('ncbi') || currentUrl.includes('pubmed') || currentUrl.includes('cell') || currentUrl.includes('science')) {
      assetId = 'microscope';
      entityName = `🔬 ${cleanTitle}`;
      spawnY = 0.95;
    }

    const newEntity: any = {
      id,
      name: entityName,
      capabilities: [
        { type: 'transform', position: { x: (Math.random() - 0.5) * 0.8, y: spawnY, z: spawnZ }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
        { type: 'draggable' },
        { type: 'collider' },
        { type: 'web_screen', url: currentUrl },
        { type: 'educational', text: cleanTitle, url: currentUrl, value: 0, active: true }
      ],
      visuals: { assetId }
    };

    useWorldStore.getState().applyPatch({ entitiesCreated: [newEntity] }, `Épingler la ressource 3D : ${entityName}`, { intent: 'pin_web_resource' });
    useWorldStore.getState().setSpatialContext(id, null);
    playAudioFx('quantum_ping');
    closeWebModal();
  };

  // Curated Spatial Web bookmarks for quick discovery
  const spatialBookmarks = [
    { label: '🍲 Wiki : Ratatouille & Gastronomie', url: 'https://fr.m.wikipedia.org/wiki/Ratatouille', type: 'live' as const },
    { label: '📄 PDF : Spécifications W3C Accessibility', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', type: 'pdf' as const },
    { label: '📐 Three.js : Documentation 3D', url: 'https://threejs.org/docs/', type: 'live' as const },
    { label: '🔬 NCBI : Microbiologie & Cellule', url: 'https://fr.m.wikipedia.org/wiki/Microbiologie', type: 'live' as const },
    { label: '📜 ArXiv : Spatial AI & Robots', url: 'https://arxiv.org/html/2402.14781v1', type: 'live' as const }
  ];

  return (
    <div className="library-backdrop" role="dialog" aria-modal="true" aria-labelledby="web-modal-title" style={{ zIndex: 1000 }}>
      <div 
        className="library-dialog" 
        style={{ 
          maxWidth: '1180px', 
          width: '94vw', 
          height: '88vh', 
          display: 'flex', 
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          borderRadius: '16px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          background: '#0f172a',
          transform: `translate(${offset.x}px, ${offset.y}px)`
        }}
      >
        {/* Top Browser Navigation Bar with Drag Handle */}
        <div
          {...dragProps}
          style={{
            ...dragProps.style,
            padding: '10px 16px',
            background: 'rgba(15, 23, 42, 0.98)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            userSelect: 'none'
          }}
          title="Cliquer-glisser pour déplacer la fenêtre"
        >
          {/* Mac-style traffic lights */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <button 
              onClick={closeWebModal}
              title="Fermer (Échap)"
              style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444', border: 'none', cursor: 'pointer', padding: 0 }}
            />
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
            <button 
              onClick={handleOpenExternal}
              title="Plein écran externe"
              style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10b981', border: 'none', cursor: 'pointer', padding: 0 }}
            />
          </div>

          {/* Mode Switcher Tabs */}
          <div style={{ display: 'flex', gap: '4px', background: 'rgba(0, 0, 0, 0.45)', padding: '2px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            {content && (
              <button
                type="button"
                onClick={() => setActiveTab('reader')}
                style={{
                  background: activeTab === 'reader' ? '#10b981' : 'transparent',
                  color: activeTab === 'reader' ? '#ffffff' : '#94a3b8',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <span>📄</span>
                <span>{isFr ? 'Fiche / Page' : 'Doc / Sheet'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveTab('live')}
              style={{
                background: activeTab === 'live' ? '#10b981' : 'transparent',
                color: activeTab === 'live' ? '#ffffff' : '#94a3b8',
                border: 'none',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <span>🌐</span>
              <span>{isFr ? 'Web Live' : 'Live Web'}</span>
            </button>

            {!content && (
              <button
                type="button"
                onClick={() => setActiveTab('reader')}
                style={{
                  background: activeTab === 'reader' ? '#10b981' : 'transparent',
                  color: activeTab === 'reader' ? '#ffffff' : '#94a3b8',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <span>📖</span>
                <span>{isFr ? 'Mode Lecture' : 'Reader Mode'}</span>
              </button>
            )}

            {isPdf && (
              <button
                type="button"
                onClick={() => setActiveTab('pdf')}
                style={{
                  background: activeTab === 'pdf' ? '#d97706' : 'transparent',
                  color: activeTab === 'pdf' ? '#ffffff' : '#94a3b8',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <span>📄</span>
                <span>{isFr ? 'Lecteur PDF' : 'PDF Reader'}</span>
              </button>
            )}

            {isArt && (
              <button
                type="button"
                onClick={() => setActiveTab('art')}
                style={{
                  background: activeTab === 'art' ? '#d97706' : 'transparent',
                  color: activeTab === 'art' ? '#ffffff' : '#94a3b8',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <span>🎨</span>
                <span>{isFr ? 'Tableau d’Art' : 'Art Gallery'}</span>
              </button>
            )}
          </div>

          {/* Title and Icon */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: '140px', maxWidth: '220px' }}>
            <span style={{ fontSize: '14px' }}>{isPdf ? '📄' : '🌐'}</span>
            <span id="web-modal-title" style={{ fontSize: '12px', fontWeight: 600, color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {title || 'Ressource Spatiale'}
            </span>
          </div>

          {/* URL Omnibar */}
          <form onSubmit={handleNavigate} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              padding: '4px 10px',
              gap: '6px'
            }}>
              <span style={{ fontSize: '11px', color: '#10b981' }}>🔒</span>
              <input
                type="text"
                value={currentUrl}
                onChange={(e) => setCurrentUrl(e.target.value)}
                placeholder="https://..."
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  outline: 'none',
                  padding: 0
                }}
              />
            </div>
            <button
              type="submit"
              className="button subtle"
              style={{ padding: '6px 12px', fontSize: '11px', whiteSpace: 'nowrap' }}
              title="Charger l'adresse"
            >
              Aller →
            </button>
          </form>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <button
              onClick={() => setIframeKey(k => k + 1)}
              className="button subtle"
              style={{ padding: '6px 10px', fontSize: '11px' }}
              title="Actualiser la ressource"
            >
              🔄
            </button>
            <button
              onClick={handlePinToSpatialWorld}
              className="button subtle"
              style={{
                padding: '6px 12px',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(6, 182, 212, 0.25))',
                border: '1px solid rgba(16, 185, 129, 0.5)',
                color: '#6ee7b7',
                fontWeight: 600
              }}
              title="Créer un objet 3D lié à cette page web dans votre scène"
            >
              <span>📍</span>
              <span>Épingler en 3D</span>
            </button>
            <button
              onClick={handleOpenExternal}
              className="button primary"
              style={{ padding: '6px 12px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
              title="Ouvrir dans un nouvel onglet"
            >
              <span>Ouvrir externe</span>
              <span>↗</span>
            </button>
            <button
              onClick={closeWebModal}
              className="icon-button"
              style={{ marginLeft: '4px' }}
              aria-label="Fermer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Bookmarks Quick Bar (hidden when viewing a scene document / recipe) */}
        {!content ? (
          <div style={{
            padding: '6px 16px',
            background: 'rgba(15, 23, 42, 0.75)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            overflowX: 'auto'
          }}>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Ressources Web 3D :
            </span>
            {spatialBookmarks.map((bm, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setCurrentUrl(bm.url);
                  setActiveTab(bm.type);
                  setIframeKey(k => k + 1);
                }}
                style={{
                  background: currentUrl === bm.url ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  border: currentUrl === bm.url ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.1)',
                  color: currentUrl === bm.url ? '#6ee7b7' : '#cbd5e1',
                  padding: '3px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {bm.label}
              </button>
            ))}
          </div>
        ) : (
          <div style={{
            padding: '6px 16px',
            background: 'rgba(15, 23, 42, 0.75)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11.5px',
            color: '#94a3b8'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#10b981', fontWeight: 700 }}>📄 Document spatial connecté</span>
              <span>•</span>
              <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{title}</span>
            </div>
            <span style={{ color: '#64748b', fontSize: '11px' }}>
              Modifiable manuellement ou actualisable par l’IA
            </span>
          </div>
        )}

        {/* Content Viewport Container */}
        <div style={{ flex: 1, position: 'relative', background: '#0b0f19', overflow: 'hidden', display: 'flex' }}>
          {activeTab === 'live' && (
            <div style={{ flex: 1, position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <iframe
                key={iframeKey}
                src={currentUrl}
                title={title || "Web Screen Viewport"}
                style={{
                  flex: 1,
                  width: '100%',
                  border: 'none',
                  background: '#ffffff'
                }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              />
              <div style={{
                padding: '4px 12px',
                background: 'rgba(15, 23, 42, 0.92)',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                fontSize: '11px',
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0
              }}>
                <span>💡 Si le site externe restreint l’iframe (X-Frame-Options/CSP) et apparaît blanc :</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setActiveTab('reader')}
                    style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', padding: 0, textDecoration: 'underline', fontSize: '11px' }}
                  >
                    Mode Lecture
                  </button>
                  <span>•</span>
                  <button
                    onClick={handleOpenExternal}
                    style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', padding: 0, textDecoration: 'underline', fontSize: '11px' }}
                  >
                    Ouvrir externe ↗
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'pdf' && (
            <div style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', background: '#1e293b' }}>
              <div style={{
                padding: '8px 16px',
                background: 'rgba(0, 0, 0, 0.4)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: '#e2e8f0',
                fontSize: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>📄 <strong>Document PDF Spatial</strong></span>
                  <span style={{ color: '#94a3b8' }}>• Vue vectorielle haute définition</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => setPdfZoom(z => Math.max(50, z - 15))}
                    className="button subtle"
                    style={{ padding: '3px 8px', fontSize: '11px' }}
                  >
                    🔍 -
                  </button>
                  <span style={{ fontSize: '11px', fontFamily: 'monospace' }}>{pdfZoom}%</span>
                  <button
                    onClick={() => setPdfZoom(z => Math.min(200, z + 15))}
                    className="button subtle"
                    style={{ padding: '3px 8px', fontSize: '11px' }}
                  >
                    🔍 +
                  </button>
                  <button
                    onClick={handleOpenExternal}
                    className="button primary"
                    style={{ padding: '4px 10px', fontSize: '11px' }}
                  >
                    📥 Télécharger le PDF
                  </button>
                </div>
              </div>

              <div style={{ flex: 1, position: 'relative', overflow: 'auto', display: 'flex', justifyContent: 'center', padding: '16px' }}>
                <object
                  data={currentUrl}
                  type="application/pdf"
                  style={{
                    width: `${pdfZoom}%`,
                    height: '100%',
                    minHeight: '600px',
                    borderRadius: '8px',
                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6)'
                  }}
                >
                  <div style={{ padding: '40px', textAlign: 'center', color: '#cbd5e1' }}>
                    <p style={{ fontSize: '16px' }}>📄 Aperçu du document PDF</p>
                    <p style={{ fontSize: '13px', color: '#94a3b8' }}>Si votre navigateur ne supporte pas l'affichage direct :</p>
                    <button onClick={handleOpenExternal} className="button primary" style={{ marginTop: '12px' }}>
                      Ouvrir le fichier PDF ↗
                    </button>
                  </div>
                </object>
              </div>
            </div>
          )}

          {activeTab === 'reader' && (
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '36px 48px',
              maxWidth: '880px',
              margin: '0 auto',
              width: '100%',
              color: '#e2e8f0',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              lineHeight: 1.7
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.12)', paddingBottom: '18px', marginBottom: '24px', gap: '16px' }}>
                <div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(16, 185, 129, 0.2)', color: '#6ee7b7', padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, marginBottom: '8px' }}>
                    <span>📋</span>
                    <span>{entityId ? 'Fiche documentaire 3D connectée' : 'Page générée'}</span>
                  </div>
                  <h1 style={{ fontSize: '26px', fontWeight: 700, margin: '4px 0 8px 0', color: '#ffffff' }}>
                    {title || 'Document spatial'}
                  </h1>
                  <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
                    {entityId ? `Objet de la scène : ${entityId}` : `Source : ${currentUrl}`}
                  </p>
                </div>

                {/* Edit / Save controls */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {isEditingDoc ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setDocText(content || '');
                          setIsEditingDoc(false);
                        }}
                        className="button subtle"
                        style={{ padding: '6px 14px', fontSize: '12px' }}
                      >
                        Annuler
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveDoc}
                        className="button primary"
                        style={{
                          background: 'linear-gradient(90deg, #10b981, #059669)',
                          padding: '6px 18px',
                          fontSize: '12px',
                          fontWeight: 700
                        }}
                      >
                        💾 Sauvegarder dans la scène 3D
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsEditingDoc(true)}
                      className="button primary"
                      style={{
                        background: 'rgba(16, 185, 129, 0.2)',
                        color: '#34d399',
                        border: '1px solid #10b981',
                        padding: '6px 14px',
                        fontSize: '12px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <span>✏️</span>
                      <span>Modifier la fiche</span>
                    </button>
                  )}
                </div>
              </div>

              {isEditingDoc ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', minHeight: '380px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <p style={{ margin: 0, fontSize: '13px', color: '#cbd5e1' }}>
                      Modifiez le contenu ou générez une page prédéfinie adaptée à cet objet :
                    </p>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => setDocText(generateTemplateForEntity(title, entityId))}
                        className="button subtle"
                        style={{ padding: '4px 10px', fontSize: '11px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.4)' }}
                        title="Générer automatiquement une page adaptée au type d'objet"
                      >
                        ✨ Générer automatiquement
                      </button>
                      <button
                        type="button"
                        onClick={() => setDocText(generateTemplateForEntity('recette', entityId))}
                        className="button subtle"
                        style={{ padding: '4px 8px', fontSize: '11px' }}
                      >
                        🍳 Modèle Recette
                      </button>
                      <button
                        type="button"
                        onClick={() => setDocText(generateTemplateForEntity('technique', entityId))}
                        className="button subtle"
                        style={{ padding: '4px 8px', fontSize: '11px' }}
                      >
                        🛠️ Modèle Fiche Technique
                      </button>
                      <button
                        type="button"
                        onClick={() => setDocText(generateTemplateForEntity('chimie', entityId))}
                        className="button subtle"
                        style={{ padding: '4px 8px', fontSize: '11px' }}
                      >
                        🔬 Protocole
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={docText}
                    onChange={(e) => setDocText(e.target.value)}
                    placeholder="Écrivez le contenu de la fiche..."
                    style={{
                      width: '100%',
                      minHeight: '340px',
                      background: 'rgba(0, 0, 0, 0.45)',
                      border: '1px solid rgba(16, 185, 129, 0.5)',
                      borderRadius: '10px',
                      padding: '16px 20px',
                      color: '#f8fafc',
                      fontSize: '14px',
                      lineHeight: 1.6,
                      fontFamily: 'inherit',
                      resize: 'vertical',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              ) : (
                <div style={{ fontSize: '15px', color: '#cbd5e1', lineHeight: 1.7 }}>
                  <StructuredWebPageRenderer text={docText} />

                  <div style={{ display: 'flex', gap: '12px', marginTop: '28px' }}>
                    <button onClick={() => setActiveTab('live')} className="button primary">
                      🌐 Basculer sur la page Web Live
                    </button>
                    <button onClick={handleOpenExternal} className="button subtle">
                      Ouvrir le site externe ↗
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'art' && (
            <div style={{
              flex: 1,
              display: 'flex',
              background: '#0a0d14',
              overflow: 'hidden'
            }}>
              {/* Left Column: Visual Canvas Viewer */}
              <div style={{
                flex: 1.2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'radial-gradient(circle at center, #1e293b 0%, #090d16 100%)',
                padding: '24px',
                position: 'relative'
              }}>
                <div style={{
                  padding: '14px',
                  background: 'linear-gradient(135deg, #78350f, #451a03, #b45309)',
                  borderRadius: '12px',
                  boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), inset 0 2px 4px rgba(255, 255, 255, 0.25)',
                  maxWidth: '480px',
                  width: '100%',
                  textAlign: 'center'
                }}>
                  <div style={{
                    padding: '8px',
                    background: '#1c1917',
                    borderRadius: '8px',
                    overflow: 'hidden'
                  }}>
                    <img 
                      src="/library/painting.png"
                      alt={title || "Chef-d’œuvre artistique"}
                      style={{
                        width: '100%',
                        maxHeight: '52vh',
                        objectFit: 'contain',
                        borderRadius: '4px',
                        display: 'block'
                      }}
                      onError={(e) => {
                        // Fallback to Wikipedia Mona Lisa public image if local file is unavailable
                        (e.target as HTMLImageElement).src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg/402px-Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg';
                      }}
                    />
                  </div>
                </div>
                <div style={{ marginTop: '14px', fontSize: '11px', color: '#94a3b8', display: 'flex', gap: '8px' }}>
                  <span>🔍 Zoom optique natif</span>
                  <span>•</span>
                  <span>Résolution Masterclass</span>
                </div>
              </div>

              {/* Right Column: Museum Curatorial Placard */}
              <div style={{
                flex: 0.9,
                borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '28px 32px',
                overflowY: 'auto',
                color: '#e2e8f0',
                background: 'rgba(15, 23, 42, 0.65)'
              }}>
                <div style={{ display: 'inline-block', background: 'rgba(217, 119, 6, 0.2)', color: '#fbbf24', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, marginBottom: '12px' }}>
                  Cartel de Musée National
                </div>
                <h2 style={{ fontSize: '22px', fontWeight: 700, margin: '0 0 4px 0', color: '#ffffff' }}>
                  {title || 'La Joconde (Portrait de Monna Lisa)'}
                </h2>
                <div style={{ fontSize: '14px', color: '#cbd5e1', fontStyle: 'italic', marginBottom: '18px' }}>
                  Léonard de Vinci · Vers 1503 – 1519
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', background: 'rgba(0, 0, 0, 0.3)', padding: '14px 16px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <div><strong style={{ color: '#94a3b8' }}>Technique :</strong> Huile sur panneau de peuplier (sfumato)</div>
                  <div><strong style={{ color: '#94a3b8' }}>Dimensions :</strong> 77 cm × 53 cm</div>
                  <div><strong style={{ color: '#94a3b8' }}>Conservation :</strong> Musée du Louvre, Salle des États, Paris</div>
                  <div><strong style={{ color: '#94a3b8' }}>Département :</strong> Peintures de la Renaissance italienne</div>
                </div>

                <div style={{ marginTop: '18px' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Palette chromatique dominante
                  </h4>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[
                      { name: "Terre d'Ombre", hex: '#3d2817' },
                      { name: 'Glacis Ambré', hex: '#854d0e' },
                      { name: 'Vert Céladon', hex: '#14532d' },
                      { name: 'Or Antique', hex: '#d97706' },
                      { name: 'Crépuscule Sfumato', hex: '#1e293b' }
                    ].map(c => (
                      <div key={c.hex} title={`${c.name} (${c.hex})`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: c.hex, border: '1px solid rgba(255, 255, 255, 0.2)' }} />
                        <span style={{ fontSize: '9px', color: '#94a3b8' }}>{c.hex}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <p style={{ marginTop: '20px', fontSize: '13px', lineHeight: 1.6, color: '#cbd5e1' }}>
                  Chef-d'œuvre absolu de la Renaissance, cette œuvre illustre la perfection du <em>sfumato</em>, cette transition vaporeuse entre ombres et lumières sans aucun contour net, conférant au regard et au sourire leur présence magnétique universelle.
                </p>

                <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
                  <button onClick={() => setActiveTab('live')} className="button primary" style={{ fontSize: '12px' }}>
                    🌐 Notice Musée du Louvre (Web Live)
                  </button>
                  <button onClick={handleOpenExternal} className="button subtle" style={{ fontSize: '12px' }}>
                    Site du Louvre ↗
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function generateTemplateForEntity(title?: string | null, entityId?: string | null): string {
  const norm = ((title || '') + ' ' + (entityId || '')).toLowerCase();
  
  if (norm.includes('recette') || norm.includes('cuisin') || norm.includes('ratatouille') || norm.includes('bourguignon') || norm.includes('plat') || norm.includes('crepe') || norm.includes('galette')) {
    return (
      `★ RECETTE : ${(title || 'Atelier Gastronomique').toUpperCase()}\n` +
      `⏱ Prépa : 25 min | Cuisson : 45 min | Niveau : Intermédiaire\n\n` +
      `## INGRÉDIENTS :\n` +
      `• 1 pièce principale fraîche de premier choix\n` +
      `• 2 cuillères à soupe d'huile d'olive vierge extra\n` +
      `• 1 bouquet garni d'herbes aromatiques fraîches\n` +
      `• Sel de Guérande et poivre noir concassé\n` +
      `• 2 gousses d'ail rose et 1 oignon doux émincé\n\n` +
      `### ÉTAPES DE PRÉPARATION :\n` +
      `1. Disposer les ingrédients sur le plan de travail et tailler les légumes en brunoise régulière.\n` +
      `2. Faire chauffer la cocotte ou la poêle à feu moyen avec un filet d'huile d'olive.\n` +
      `3. Saisir délicatement les ingrédients pour libérer les sucs et parfums.\n` +
      `4. Couvrir et laisser mijoter à feu doux en surveillant la réduction.\n` +
      `5. Dresser harmonieusement à l'assiette chaude avant de servir.\n\n` +
      `CONSEIL DU CHEF : Goûtez régulièrement l'assaisonnement et laissez reposer 2 minutes hors du feu avant le dressage.`
    );
  }

  if (norm.includes('technique') || norm.includes('batterie') || norm.includes('voiture') || norm.includes('auto') || norm.includes('moteur') || norm.includes('mecanic') || norm.includes('atelier')) {
    return (
      `★ FICHE TECHNIQUE : ${(title || 'Procédure Atelier').toUpperCase()}\n` +
      `⏱ Durée estimée : 15 min | Norme : ISO-9001 / Sécurité Basse Tension\n\n` +
      `## MATÉRIEL & OUTILLAGE :\n` +
      `• 1 batterie automobile certifiée 12V 70Ah\n` +
      `• 1 clé isolée de 10mm pour bornes\n` +
      `• Gants de protection diélectriques homologués\n` +
      `• Graisse protectrice pour cosses de batterie\n\n` +
      `### PROTOCOLE OPÉRATOIRE :\n` +
      `1. Couper le contact et sécuriser le périmètre de travail.\n` +
      `2. Inspecter visuellement l'état physique de la batterie et des câbles.\n` +
      `3. Déconnecter en priorité la borne négative (masse noire -).\n` +
      `4. Déconnecter ensuite la borne positive (+ rouge).\n` +
      `5. Installer la nouvelle unité dans le bac d'ancrage et reconnecter dans l'ordre inverse (+ puis -).\n\n` +
      `SÉCURITÉ : Ne jamais court-circuiter les deux bornes avec un outil métallique. Port de lunettes impératif.`
    );
  }

  if (norm.includes('chimie') || norm.includes('lab') || norm.includes('microscop') || norm.includes('science') || norm.includes('fiole')) {
    return (
      `★ PROTOCOLE EXPÉRIMENTAL : ${(title || 'Laboratoire Scientifique').toUpperCase()}\n` +
      `⏱ Durée : 30 min | Discipline : Sciences Physico-Chimiques\n\n` +
      `## COMPOSANTS REQUIS :\n` +
      `• Échantillon test calibré en solution aqueuse\n` +
      `• Tube à essai stérile et pipette graduée\n` +
      `• Source de chauffage régulée ou bain-marie\n` +
      `• Indicateur colorimétrique de pH\n\n` +
      `### DÉMARCHE EXPÉRIMENTALE :\n` +
      `1. Calibrer les instruments de mesure et noter la température ambiante.\n` +
      `2. Prélever 10 ml de la solution à l'aide de la pipette.\n` +
      `3. Ajouter 3 gouttes de l'indicateur et observer la réaction chromatique.\n` +
      `4. Enregistrer les données de télémétrie dans le registre spatial.\n\n` +
      `NOTE : Porter blouse et gants de protection en permanence dans la zone active.`
    );
  }

  return (
    `★ DOSSIER DOCUMENTAIRE : ${(title || 'Ressource Spatiale').toUpperCase()}\n` +
    `Objet connecté : ${entityId || 'Entité 3D'}\n\n` +
    `## CARACTÉRISTIQUES :\n` +
    `• Détection spatiale en temps réel dans l'univers 3D\n` +
    `• Synchronisation bidirectionnelle avec le graphe World IR\n` +
    `• Visualisation interactive et documentation enrichie\n\n` +
    `### DIRECTIVES D'UTILISATION :\n` +
    `1. Positionner l'objet au sein de l'environnement selon vos besoins.\n` +
    `2. Renseigner les annotations ou spécifications fonctionnelles.\n` +
    `3. Enregistrer pour propager les changements à tous les observateurs.\n\n` +
    `CONSEIL : Utilisez les boutons de présélection de position pour adapter l'affichage spatial.`
  );
}

const StructuredWebPageRenderer: React.FC<{ text: string }> = ({ text }) => {
  if (!text || !text.trim()) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
        <p style={{ fontSize: '15px' }}>Aucun contenu textuel pour l'instant.</p>
        <p style={{ fontSize: '13px' }}>Cliquez sur « ✏️ Modifier la fiche » pour saisir des notes ou générer un modèle automatique.</p>
      </div>
    );
  }

  const lines = text.split('\n');
  const blocks: React.ReactNode[] = [];
  let inIngredients = false;
  let inSteps = false;
  let listItems: string[] = [];

  const flushList = (key: string) => {
    if (listItems.length === 0) return;
    if (inIngredients) {
      blocks.push(
        <div key={key} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '8px', margin: '12px 0 20px 0' }}>
          {listItems.map((item, idx) => (
            <div key={idx} style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              color: '#e2e8f0'
            }}>
              <span style={{ color: '#10b981', fontSize: '15px' }}>✓</span>
              <span>{item.replace(/^[•\-\*]\s*/, '')}</span>
            </div>
          ))}
        </div>
      );
    } else if (inSteps) {
      blocks.push(
        <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '10px', margin: '12px 0 20px 0' }}>
          {listItems.map((item, idx) => {
            const clean = item.replace(/^(?:\d+[\.\)]|[•\-\*])\s*/, '');
            return (
              <div key={idx} style={{
                background: 'rgba(15, 23, 42, 0.65)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: '10px',
                padding: '12px 16px',
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start'
              }}>
                <span style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '11px',
                  borderRadius: '16px',
                  padding: '2px 8px',
                  flexShrink: 0,
                  marginTop: '2px'
                }}>
                  Étape {idx + 1}
                </span>
                <span style={{ fontSize: '13.5px', color: '#f1f5f9', lineHeight: 1.6 }}>{clean}</span>
              </div>
            );
          })}
        </div>
      );
    } else {
      blocks.push(
        <ul key={key} style={{ margin: '8px 0 16px 20px', padding: 0 }}>
          {listItems.map((item, idx) => (
            <li key={idx} style={{ fontSize: '13.5px', color: '#cbd5e1', marginBottom: '6px' }}>
              {item.replace(/^[•\-\*]\s*/, '')}
            </li>
          ))}
        </ul>
      );
    }
    listItems = [];
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList(`list_${index}`);
      return;
    }

    if (trimmed.startsWith('# ') || trimmed.startsWith('★ ')) {
      flushList(`list_${index}`);
      blocks.push(
        <h2 key={index} style={{
          fontSize: '20px',
          fontWeight: 700,
          color: '#ffffff',
          borderBottom: '2px solid rgba(16, 185, 129, 0.4)',
          paddingBottom: '8px',
          margin: '20px 0 12px 0'
        }}>
          {trimmed.replace(/^#\s*|^★\s*/, '')}
        </h2>
      );
      return;
    }

    if (trimmed.startsWith('## ') || /^(?:INGRÉDIENTS|COMPOSANTS|MATÉRIEL|OUTILS)\s*:/i.test(trimmed)) {
      flushList(`list_${index}`);
      inIngredients = true;
      inSteps = false;
      blocks.push(
        <h3 key={index} style={{
          fontSize: '15px',
          fontWeight: 700,
          color: '#34d399',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          margin: '22px 0 10px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>📦</span>
          <span>{trimmed.replace(/^##\s*/, '')}</span>
        </h3>
      );
      return;
    }

    if (trimmed.startsWith('### ') || /^(?:ÉTAPES|INSTRUCTIONS|PROTOCOLE|PROCÉDURE)\s*:/i.test(trimmed)) {
      flushList(`list_${index}`);
      inIngredients = false;
      inSteps = true;
      blocks.push(
        <h3 key={index} style={{
          fontSize: '15px',
          fontWeight: 700,
          color: '#38bdf8',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          margin: '22px 0 10px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>⚡</span>
          <span>{trimmed.replace(/^###\s*/, '')}</span>
        </h3>
      );
      return;
    }

    if (/^(?:CONSEIL|SECRET|ASTUCE|SÉCURITÉ|ATTENTION|NOTE)\s*:/i.test(trimmed)) {
      flushList(`list_${index}`);
      blocks.push(
        <div key={index} style={{
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(245, 158, 11, 0.05))',
          borderLeft: '4px solid #f59e0b',
          borderRadius: '0 8px 8px 0',
          padding: '12px 18px',
          margin: '18px 0',
          fontSize: '13.5px',
          color: '#fef3c7'
        }}>
          💡 <strong>{trimmed}</strong>
        </div>
      );
      return;
    }

    if (/^[•\-\*]\s+/.test(trimmed) || (inSteps && /^\d+[\.\)]\s+/.test(trimmed))) {
      listItems.push(trimmed);
      return;
    }

    flushList(`list_${index}`);
    blocks.push(
      <p key={index} style={{ margin: '8px 0', fontSize: '14px', lineHeight: 1.65, color: '#cbd5e1' }}>
        {trimmed}
      </p>
    );
  });

  flushList('final_list');

  return (
    <div style={{
      background: 'rgba(0, 0, 0, 0.35)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '12px',
      padding: '24px 28px',
      boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
      userSelect: 'text'
    }}>
      {blocks}
    </div>
  );
};
