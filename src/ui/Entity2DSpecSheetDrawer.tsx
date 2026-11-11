// src/ui/Entity2DSpecSheetDrawer.tsx
// Tiroir Fiche 2D Hybride & Fallback d'Accessibilité (Mindel §3, §14, §18 & §21)
// Permet la lecture détaillée, l'inspection textuelle, la consultation des ressources typées,
// des parties sémantiques et l'export JSON-LD sans forcer l'utilisateur à tout faire dans la 3D.

import React, { useState, useMemo } from 'react';
import { useWorldStore } from '../engine/store';
import { playAudioFx } from '../engine/evaluator';
import { exportEntityToJsonLd } from '../engine/semanticManifest';
import { TypedResource } from '../core/types';
import { getAsset } from '../library/catalog';

export const Entity2DSpecSheetDrawer: React.FC = () => {
  const isOpen = useWorldStore(s => s.showEntity2DDrawer);
  const setIsOpen = useWorldStore(s => s.setShowEntity2DDrawer);
  const selectedEntityId = useWorldStore(s => s.spatialContext.selectedEntityId);
  const entities = useWorldStore(s => s.world.ir.entities);
  const entity = selectedEntityId ? entities[selectedEntityId] : null;
  const uiLanguage = useWorldStore(s => s.uiLanguage);
  const isFr = uiLanguage === 'fr';

  const explodedEntities = useWorldStore(s => s.explodedEntities);
  const toggleExplodedView = useWorldStore(s => s.toggleExplodedView);
  const selectedPartId = useWorldStore(s => s.selectedPartId);
  const setSelectedPartId = useWorldStore(s => s.setSelectedPartId);
  const setShowCompatibilityModal = useWorldStore(s => s.setShowObjectCompatibilityModal);
  const setCompatibilityTarget = useWorldStore(s => s.setCompatibilityTargetEntityId);
  const toggleEntityState = useWorldStore(s => s.toggleEntityState);
  const openWebModal = useWorldStore(s => s.openWebModal);
  const setCameraPreset = useWorldStore(s => s.setCameraPreset);

  const [copiedJsonLd, setCopiedJsonLd] = useState(false);
  const [activeTab, setActiveTab] = useState<'specs' | 'parts' | 'resources' | 'jsonld'>('specs');

  const asset = entity?.visuals?.assetId ? getAsset(entity.visuals.assetId) : null;
  const isExploded = entity ? !!explodedEntities[entity.id] : false;
  const phys = entity?.physicalProperties;
  const webCap = entity?.capabilities.find(c => c.type === 'web_screen' || c.url);

  // Spécifications déduites intelligentes si l'objet n'a pas encore de contrat physique complet
  const derivedSpecs = useMemo(() => {
    if (!entity) return null;
    const nameLow = (entity.name || '').toLowerCase();
    const assetIdLow = (entity.visuals?.assetId || '').toLowerCase();

    // Dimensions
    const dims: [number, number, number] = phys?.dimensions || (
      asset?.size ? [asset.size[0], asset.size[1], asset.size[2]] : [1.0, 0.8, 1.0]
    );

    // Matière
    let mat = phys?.material;
    if (!mat) {
      if (nameLow.includes('carbone') || nameLow.includes('supercar') || assetIdLow.includes('supercar') || nameLow.includes('voiture')) {
        mat = 'Fibre de carbone pré-imprégnée & titane aérospatial';
      } else if (nameLow.includes('cuir') || nameLow.includes('sac') || nameLow.includes('valise')) {
        mat = 'Cuir pleine fleur taurillon & ferrures laiton palladié';
      } else if (nameLow.includes('bois') || nameLow.includes('table') || nameLow.includes('planche')) {
        mat = 'Bois d’hévéa massif sélectionné et huilé';
      } else if (nameLow.includes('cocotte') || nameLow.includes('poele')) {
        mat = 'Fonte émaillée triple épaisseur haute inertie';
      } else if (nameLow.includes('écran') || nameLow.includes('panneau') || nameLow.includes('terminal')) {
        mat = 'Châssis aluminium brossé et dalle d’affichage OLED';
      } else {
        mat = entity.visuals?.materialPreset ? `Matériau PBR (${entity.visuals.materialPreset})` : 'Composite standardisé';
      }
    }

    // Poids
    let weight = phys?.weightKg;
    if (weight === undefined) {
      if (nameLow.includes('supercar') || nameLow.includes('voiture')) weight = 1380;
      else if (nameLow.includes('sac') || nameLow.includes('valise')) weight = 1.45;
      else if (nameLow.includes('cocotte')) weight = 4.2;
      else if (nameLow.includes('couteau') || nameLow.includes('cle') || nameLow.includes('clé')) weight = 0.18;
      else if (nameLow.includes('panneau') || nameLow.includes('écran')) weight = 28;
      else weight = Math.round(dims[0] * dims[1] * dims[2] * 420 * 10) / 10;
    }

    // Volume / Capacité
    let capLiters = phys?.capacityLiters;
    if (capLiters === undefined) {
      if (nameLow.includes('sac') || nameLow.includes('valise')) capLiters = 42;
      else if (nameLow.includes('cocotte')) capLiters = 5.5;
      else if (nameLow.includes('supercar')) capLiters = 140;
    }

    // SKU / Référence
    const sku = phys?.sku || `WP-${(entity.visuals?.assetId || entity.id).replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 8)}-2026`;

    // Description textuelle
    let desc = entity.fallback2D?.description;
    if (!desc || desc === 'Aucune description textuelle détaillée disponible.') {
      if (nameLow.includes('supercar') || nameLow.includes('voiture')) {
        desc = 'Supercar d’ingénierie haute performance motorisée par un V12 biturbo développant 850 ch, avec aérodynamique active et cockpit numérique en réalité spatiale.';
      } else if (nameLow.includes('panneau') || nameLow.includes('écran')) {
        desc = "Panneau d'affichage web 3D interactif permettant de projeter de la documentation, des pages Wikipédia ou des applications distantes.";
      } else if (nameLow.includes('cocotte')) {
        desc = 'Cocotte de cuisson gastronomique en fonte émaillée conçue pour le mijotage lent des arômes et la fusion thermique des légumes.';
      } else if (nameLow.includes('clé') || nameLow.includes('cle')) {
        desc = 'Clé holographique intelligente et transpondeur numérique d’autorisation de démarrage et de télémétrie embarquée.';
      } else if (nameLow.includes('sac')) {
        desc = 'Sac de voyage modulable et compartimenté répondant aux exigences strictes de transport nomade et de protection électronique.';
      } else {
        desc = `Entité spatiale tridimensionnelle interactive conforme aux recommandations Mindel pour le Web 3D sémantique.`;
      }
    }

    // Composants déduits
    let partsList = entity.parts || [];
    if (partsList.length === 0) {
      if (nameLow.includes('supercar') || nameLow.includes('voiture')) {
        partsList = [
          { id: 'engine_v12', name: 'Moteur V12 6.0L biturbo central', description: 'Groupe motopropulseur hybride de 850 ch avec cartographie sport et échappement titane.' },
          { id: 'chassis_carbon', name: 'Châssis monocoque en carbone', description: 'Structure ultralégère en composite carbone tissé haute résistance à la torsion.' },
          { id: 'active_wing', name: 'Aileron aérodynamique actif', description: 'Déflecteur mobile adaptatif faisant office d’aéro-frein stabilisateur à haute vitesse.' },
          { id: 'cockpit_telemetry', name: 'Cockpit et télémétrie embarquée', description: 'Poste de pilotage sport alcantara avec affichage tête haute et récepteur de clé numérique.' }
        ];
      } else if (nameLow.includes('cocotte')) {
        partsList = [
          { id: 'cocotte_body', name: 'Cuve en fonte émaillée 5.5L', description: 'Corps principal à fond épais garantissant une diffusion thermique homogène.' },
          { id: 'cocotte_lid', name: 'Couvercle à picots de condensation', description: 'Système d’arrosage continu des sucs préservant le moelleux des préparations.' },
          { id: 'cocotte_handles', name: 'Poignées monobloc ergonomiques', description: 'Prises en main intégrées conçues pour une manipulation sécurisée.' }
        ];
      } else if (nameLow.includes('panneau') || nameLow.includes('écran')) {
        partsList = [
          { id: 'panel_screen', name: 'Dalle d’affichage OLED 4K', description: 'Écran antireflet haute luminance calibré pour un contraste optimal en scène 3D.' },
          { id: 'panel_stand', name: 'Pieds tubulaires et socle lourd', description: 'Armature métallique équilibrée au sol pour un maintien stable.' },
          { id: 'panel_controller', name: 'Module réseau et navigateur embarqué', description: 'Contrôleur WebGL temps réel pour la projection des flux web distants.' }
        ];
      }
    }

    return {
      dimensions: dims,
      material: mat,
      weightKg: weight,
      capacityLiters: capLiters,
      sku,
      description: desc,
      parts: partsList
    };
  }, [entity, phys, asset]);

  if (!isOpen || !entity || !derivedSpecs) return null;

  const parts = derivedSpecs.parts;
  const resources = entity.resources || [];

  const getResourceIcon = (role: TypedResource['role']) => {
    switch (role) {
      case 'manual': return '📖';
      case 'video': return '🎥';
      case 'audio': return '🎧';
      case 'buy': return '🛒';
      case 'details': return 'ℹ️';
      case 'documentation': return '📑';
      case 'compatibleWith': return '🧩';
      default: return '🔗';
    }
  };

  const handleCopyJsonLd = () => {
    const jsonLd = exportEntityToJsonLd(entity);
    navigator.clipboard.writeText(JSON.stringify(jsonLd, null, 2));
    playAudioFx('fanfare');
    setCopiedJsonLd(true);
    setTimeout(() => setCopiedJsonLd(false), 2500);
  };

  const handleTestCapacity = () => {
    setCompatibilityTarget(entity.id);
    setShowCompatibilityModal(true);
    playAudioFx('switch_click');
  };

  const handleFocusCamera = () => {
    playAudioFx('switch_click');
    const nameLow = (entity.name || '').toLowerCase();
    if (nameLow.includes('supercar') || nameLow.includes('voiture')) {
      setCameraPreset('luxury_showroom');
    } else if (nameLow.includes('cocotte') || nameLow.includes('poele')) {
      setCameraPreset('cocotte');
    } else if (nameLow.includes('planche') || nameLow.includes('couteau')) {
      setCameraPreset('chopping');
    } else if (nameLow.includes('assiette')) {
      setCameraPreset('plate');
    } else {
      setCameraPreset('table');
    }
  };

  return (
    <aside
      role="complementary"
      aria-label={`Fiche 2D détaillée de ${entity.name}`}
      className="spec-sheet-drawer"
    >
      {/* Drawer Header */}
      <div className="spec-sheet-header">
        <div className="spec-sheet-header-info">
          <div className="spec-sheet-badges">
            <span className="spec-sheet-badge-pill semantic">
              {isFr ? 'Contrat sémantique 2D' : '2D Semantic Contract'}
            </span>
            {entity.state && (
              <span className="spec-sheet-badge-pill state">
                {isFr ? 'État' : 'State'} : {entity.state}
              </span>
            )}
            <span className="spec-sheet-badge-pill sku">
              SKU : {derivedSpecs.sku}
            </span>
          </div>
          <h2 className="spec-sheet-title">
            {entity.name}
          </h2>
          <p className="spec-sheet-subtitle">
            {derivedSpecs.description}
          </p>
        </div>

        <button
          onClick={() => {
            playAudioFx('switch_click');
            setIsOpen(false);
          }}
          className="spec-sheet-close-btn"
          title={isFr ? "Fermer la fiche 2D [Échap]" : "Close 2D spec sheet [Esc]"}
          aria-label={isFr ? "Fermer la fiche" : "Close sheet"}
        >
          ✕
        </button>
      </div>

      {/* Quick Action Bar (3D ↔ 2D bridge) */}
      <div className="spec-sheet-quick-actions">
        <button
          type="button"
          onClick={handleFocusCamera}
          className="spec-sheet-action-btn primary"
          title={isFr ? "Cadrer la caméra 3D sur cet objet" : "Frame 3D camera on entity"}
        >
          <span>🎥</span>
          <span>{isFr ? 'Cadrer en 3D' : 'Focus in 3D'}</span>
        </button>

        {entity.availableStates && entity.availableStates.length > 1 && (
          <button
            type="button"
            onClick={() => {
              const nextState = entity.state === 'open' ? 'closed' : 'open';
              toggleEntityState(entity.id, nextState);
            }}
            className="spec-sheet-action-btn"
          >
            <span>{entity.state === 'open' ? '🔒' : '🔓'}</span>
            <span>{entity.state === 'open' ? (isFr ? 'Fermer' : 'Close') : (isFr ? 'Ouvrir' : 'Open')}</span>
          </button>
        )}

        {parts.length > 0 && (
          <button
            type="button"
            onClick={() => toggleExplodedView(entity.id)}
            className="spec-sheet-action-btn"
            style={{
              borderColor: isExploded ? 'rgba(245, 158, 11, 0.6)' : undefined,
              color: isExploded ? '#fbbf24' : undefined
            }}
            title={isFr ? "Décomposer l'objet en vue éclatée 3D (Mindel §7)" : "Explode entity in 3D exploded view"}
          >
            <span>💥</span>
            <span>{isExploded ? (isFr ? 'Réassembler 3D' : 'Reassemble 3D') : (isFr ? 'Vue éclatée' : 'Exploded view')}</span>
          </button>
        )}

        <button
          type="button"
          onClick={handleTestCapacity}
          className="spec-sheet-action-btn"
          title={isFr ? "Vérifier la compatibilité physique ou tester la capacité spatiale (Mindel §21)" : "Check physical compatibility or test spatial capacity"}
        >
          <span>📏</span>
          <span>{isFr ? 'Test de capacité' : 'Capacity test'}</span>
        </button>

        <button
          type="button"
          onClick={handleCopyJsonLd}
          className="spec-sheet-action-btn"
          style={{ marginLeft: 'auto' }}
          title={isFr ? "Copier le manifeste sémantique JSON-LD / W3C WoT" : "Copy W3C WoT JSON-LD semantic manifest"}
        >
          <span>{copiedJsonLd ? '✓' : '📋'}</span>
          <span>{copiedJsonLd ? (isFr ? 'Copié !' : 'Copied!') : 'JSON-LD'}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="spec-sheet-tabs">
        <button
          type="button"
          onClick={() => setActiveTab('specs')}
          className={`spec-sheet-tab-btn ${activeTab === 'specs' ? 'active' : ''}`}
        >
          <span>📊</span> {isFr ? 'Spécifications' : 'Specifications'}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('parts')}
          className={`spec-sheet-tab-btn ${activeTab === 'parts' ? 'active' : ''}`}
        >
          <span>🧩</span> {isFr ? 'Composants' : 'Components'} ({parts.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('resources')}
          className={`spec-sheet-tab-btn ${activeTab === 'resources' ? 'active' : ''}`}
        >
          <span>🔗</span> {isFr ? 'Ressources' : 'Resources'} ({resources.length + (webCap?.url ? 1 : 0)})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('jsonld')}
          className={`spec-sheet-tab-btn ${activeTab === 'jsonld' ? 'active' : ''}`}
        >
          <span>⚡</span> {isFr ? 'Manifeste WoT' : 'WoT Manifest'}
        </button>
      </div>

      {/* Content Area */}
      <div className="spec-sheet-body">
        {activeTab === 'specs' && (
          <>
            {/* Description Block */}
            <div className="spec-sheet-card">
              <h3 className="spec-sheet-card-title">
                <span>📝</span> {isFr ? 'Description et fonctionnalité' : 'Description & Functionality'}
              </h3>
              <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.6, color: '#e2e8f0' }}>
                {derivedSpecs.description}
              </p>
            </div>

            {/* Physical Properties Table */}
            <div className="spec-sheet-card">
              <h3 className="spec-sheet-card-title">
                <span>📐</span> {isFr ? 'Propriétés physiques réelles' : 'Real Physical Properties'}
              </h3>
              <div className="spec-sheet-prop-grid">
                <div className="spec-sheet-prop-item">
                  <span className="spec-sheet-prop-label">{isFr ? 'Dimensions (L × H × P)' : 'Dimensions (W × H × D)'}</span>
                  <span className="spec-sheet-prop-value" style={{ fontFamily: 'monospace' }}>
                    {(derivedSpecs.dimensions[0] * 100).toFixed(0)} × {(derivedSpecs.dimensions[1] * 100).toFixed(0)} × {(derivedSpecs.dimensions[2] * 100).toFixed(0)} cm
                  </span>
                </div>

                <div className="spec-sheet-prop-item">
                  <span className="spec-sheet-prop-label">{isFr ? 'Poids à vide' : 'Dry weight'}</span>
                  <span className="spec-sheet-prop-value">
                    {derivedSpecs.weightKg >= 100 ? `${derivedSpecs.weightKg} kg` : `${derivedSpecs.weightKg.toFixed(1)} kg`}
                  </span>
                </div>

                {derivedSpecs.capacityLiters !== undefined && (
                  <div className="spec-sheet-prop-item">
                    <span className="spec-sheet-prop-label">{isFr ? 'Volume / Capacité' : 'Volume / Capacity'}</span>
                    <span className="spec-sheet-prop-value" style={{ color: '#38bdf8' }}>
                      {derivedSpecs.capacityLiters} L
                    </span>
                  </div>
                )}

                <div className="spec-sheet-prop-item" style={{ gridColumn: derivedSpecs.capacityLiters !== undefined ? 'span 1' : 'span 2' }}>
                  <span className="spec-sheet-prop-label">{isFr ? 'Matière principale' : 'Primary material'}</span>
                  <span className="spec-sheet-prop-value" style={{ fontSize: '11.5px', fontWeight: 600 }}>
                    {derivedSpecs.material}
                  </span>
                </div>
              </div>
            </div>

            {/* Relations */}
            {entity.relations && entity.relations.length > 0 && (
              <div className="spec-sheet-card">
                <h3 className="spec-sheet-card-title">
                  <span>🔗</span> {isFr ? 'Relations spatiales et fonctionnelles' : 'Spatial & Functional Relations'}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {entity.relations.map((rel, idx) => {
                    const targetEnt = entities[rel.targetId];
                    return (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '7px 10px',
                          borderRadius: '8px',
                          background: 'rgba(15, 23, 42, 0.65)',
                          border: '1px solid rgba(148, 163, 184, 0.18)',
                          fontSize: '12px'
                        }}
                      >
                        <span style={{ color: '#818cf8', fontWeight: 600 }}>
                          {rel.type === 'inside' ? (isFr ? '📦 À l’intérieur de :' : '📦 Inside:') :
                           rel.type === 'on_top_of' ? (isFr ? '⬆️ Posé sur :' : '⬆️ On top of:') :
                           rel.type === 'attached_to' ? (isFr ? '🔗 Attaché à :' : '🔗 Attached to:') :
                           rel.type === 'adjacent_to' ? (isFr ? '↔️ Adjacent à :' : '↔️ Adjacent to:') :
                           (isFr ? '🧩 Compatible avec :' : '🧩 Compatible with:')}
                        </span>
                        <span style={{ color: '#f8fafc', fontWeight: 600 }}>
                          {targetEnt?.name || rel.targetId}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'parts' && (
          <>
            <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', fontSize: '11.5px', color: '#c7d2fe', lineHeight: 1.45 }}>
              💡 <strong>{isFr ? 'Vue éclatée et points d’intérêt (Mindel §7)' : 'Exploded view & points of interest'}</strong> : {isFr ? 'chaque sous-système dispose d’une identité technique propre et peut être examiné ou dissocié.' : 'each sub-system has distinct technical identity and can be examined or decoupled.'}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {parts.map(part => {
                const isSelected = selectedPartId === part.id;
                return (
                  <div
                    key={part.id}
                    onClick={() => {
                      setSelectedPartId(isSelected ? null : part.id);
                      playAudioFx('switch_click');
                    }}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '10px',
                      border: isSelected ? '1.5px solid #6366f1' : '1px solid rgba(148, 163, 184, 0.2)',
                      background: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'rgba(30, 41, 59, 0.5)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{isSelected ? '🎯' : '◽'}</span>
                        <span>{part.name}</span>
                      </span>
                      {part.capacityLiters && (
                        <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', fontWeight: 700 }}>
                          {part.capacityLiters} L
                        </span>
                      )}
                    </div>
                    {part.description && (
                      <p style={{ margin: 0, fontSize: '11.5px', color: '#94a3b8', lineHeight: 1.4 }}>
                        {part.description}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {activeTab === 'resources' && (
          <>
            <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(6, 182, 212, 0.15)', border: '1px solid rgba(6, 182, 212, 0.3)', fontSize: '11.5px', color: '#a5f3fc', lineHeight: 1.45 }}>
              🔗 <strong>{isFr ? 'Ressources web et spatiales (Mindel §6)' : 'Spatial and web resources'}</strong> : {isFr ? 'documentation technique, fiches constructeur, manuels PDF et applications web associées.' : 'technical documentation, manufacturer spec sheets, manuals, and connected web apps.'}
            </div>

            {webCap?.url ? (
              <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(30, 41, 59, 0.55)', border: '1px solid rgba(148, 163, 184, 0.4)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>🌐</span>
                    <span>{isFr ? 'Lien spatial web connecté' : 'Connected spatial web link'}</span>
                  </span>
                  <span style={{ fontSize: '9.5px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(14, 165, 233, 0.2)', color: '#38bdf8', fontWeight: 700 }}>
                    web_screen
                  </span>
                </div>
                <div style={{ padding: '6px 10px', borderRadius: '6px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(148, 163, 184, 0.2)', fontFamily: 'monospace', fontSize: '11px', color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {webCap.url}
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      playAudioFx('switch_click');
                      openWebModal(webCap.url!, entity.name);
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                      border: 'none',
                      borderRadius: '6px',
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '6px 12px',
                      cursor: 'pointer'
                    }}
                  >
                    🌐 {isFr ? 'Ouvrir dans WorldPilot' : 'Open in WorldPilot'}
                  </button>
                  <a
                    href={webCap.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      background: 'rgba(51, 65, 85, 0.7)',
                      border: '1px solid rgba(148, 163, 184, 0.3)',
                      borderRadius: '6px',
                      color: '#e2e8f0',
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '6px 10px',
                      textDecoration: 'none'
                    }}
                  >
                    {isFr ? '↗ Onglet externe' : '↗ External tab'}
                  </a>
                </div>
              </div>
            ) : null}

            {resources.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {resources.map((res, idx) => (
                  <a
                    key={idx}
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => playAudioFx('snap_connect')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: 'rgba(30, 41, 59, 0.5)',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      textDecoration: 'none',
                      color: '#f8fafc',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '18px' }}>{res.icon || getResourceIcon(res.role)}</span>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc' }}>
                          {res.label}
                        </div>
                        <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>
                          {res.url}
                        </div>
                      </div>
                    </div>
                    <span style={{ fontSize: '9.5px', padding: '2px 7px', borderRadius: '4px', background: 'rgba(148, 163, 184, 0.18)', color: '#cbd5e1', fontWeight: 700 }}>
                      {res.role}
                    </span>
                  </a>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'jsonld' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#cbd5e1' }}>
                W3C Web of Things / Schema.org JSON-LD
              </span>
              <button
                type="button"
                onClick={handleCopyJsonLd}
                style={{
                  background: 'rgba(99, 102, 241, 0.25)',
                  border: '1px solid rgba(99, 102, 241, 0.5)',
                  color: '#c7d2fe',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {copiedJsonLd ? (isFr ? '✓ Copié !' : '✓ Copied!') : (isFr ? '📋 Copier le JSON-LD' : '📋 Copy JSON-LD')}
              </button>
            </div>
            <pre style={{
              margin: 0,
              padding: '12px 14px',
              borderRadius: '10px',
              background: '#090d16',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              fontFamily: 'monospace',
              fontSize: '11px',
              color: '#34d399',
              lineHeight: 1.5,
              maxHeight: '400px',
              overflow: 'auto'
            }}>
              {JSON.stringify(exportEntityToJsonLd(entity), null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Drawer Footer */}
      <div className="spec-sheet-footer">
        <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#94a3b8' }}>
          {isFr ? 'Identifiant :' : 'Identifier:'} {entity.id}
        </span>
        <button
          type="button"
          onClick={() => {
            playAudioFx('switch_click');
            setIsOpen(false);
          }}
          className="spec-sheet-action-btn"
        >
          {isFr ? 'Fermer la fiche' : 'Close spec sheet'}
        </button>
      </div>
    </aside>
  );
};
