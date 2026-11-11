// src/ui/ObjectCompatibilityModal.tsx
// Modal contextuelle « Rechercher à partir de cet objet » & Test de Capacité Spatiale (Mindel §21 & §8)
// Permet d'analyser la compatibilité géométrique et dimensionnelle entre un objet sélectionné
// et ses accessoires ou contenus possibles (ordinateurs, gourdes, tablettes, boîtes).

import React, { useEffect, useState } from 'react';
import { useWorldStore } from '../engine/store';
import { playAudioFx } from '../engine/evaluator';
import type { EntitySpec } from '../core/types';

interface ObjectCompatibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CatalogCandidate {
  id: string;
  name: string;
  icon: string;
  category: string;
  dimensions: [number, number, number]; // [x, y, z] in meters
  weightKg: number;
  description: string;
  targetPart?: string;
}

const CATALOG_COMPATIBILITY_PRESETS: CatalogCandidate[] = [
  {
    id: 'laptop_pro_15',
    name: 'Ordinateur Pro 15.6" (Aluminium)',
    icon: '💻',
    category: 'Informatique',
    dimensions: [0.355, 0.019, 0.245],
    weightKg: 1.82,
    description: 'Format standard nomade (35.5 × 1.9 × 24.5 cm).',
    targetPart: 'part_laptop_sleeve'
  },
  {
    id: 'laptop_max_16',
    name: 'Station Mobile 16" Haute Performance',
    icon: '💻',
    category: 'Informatique',
    dimensions: [0.378, 0.025, 0.268],
    weightKg: 2.15,
    description: 'Ordinateur grand format (37.8 × 2.5 × 26.8 cm).',
    targetPart: 'part_laptop_sleeve'
  },
  {
    id: 'tablet_pro_11',
    name: 'Tablette Pro 11" avec Clavier',
    icon: '📱',
    category: 'Informatique',
    dimensions: [0.25, 0.009, 0.18],
    weightKg: 0.68,
    description: 'Format compact (25 × 0.9 × 18 cm).',
    targetPart: 'part_laptop_sleeve'
  },
  {
    id: 'gourde_isotherme',
    name: 'Gourde Inox Isotherme 750ml',
    icon: '🧃',
    category: 'Accessoires',
    dimensions: [0.08, 0.26, 0.08],
    weightKg: 0.32,
    description: 'Bouteille cylindrique double paroi (8 × 26 cm).',
    targetPart: 'part_side_bottle'
  },
  {
    id: 'casque_audio_anc',
    name: 'Casque Audio ANC Haute-Fidélité',
    icon: '🎧',
    category: 'Audio',
    dimensions: [0.18, 0.08, 0.19],
    weightKg: 0.25,
    description: 'Casque pliable dans son étui rigide (18 × 8 × 19 cm).',
    targetPart: 'part_main_cavity'
  },
  {
    id: 'carton_oversized',
    name: 'Colis Volumineux XL (Dépassement)',
    icon: '📦',
    category: 'Incompatible',
    dimensions: [0.46, 0.38, 0.32],
    weightKg: 3.2,
    description: 'Carton d’expédition hors gabarit (46 × 38 × 32 cm).'
  }
];

export const ObjectCompatibilityModal: React.FC<ObjectCompatibilityModalProps> = ({ isOpen, onClose }) => {
  const targetEntityId = useWorldStore(s => s.compatibilityTargetEntityId);
  const entities = useWorldStore(s => s.world.ir.entities);
  const testEntityCapacity = useWorldStore(s => s.testEntityCapacity);
  const applyPatch = useWorldStore(s => s.applyPatch);

  const [activeTab, setActiveTab] = useState<'scene' | 'catalog'>('scene');
  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !targetEntityId) return null;

  const targetEntity = entities[targetEntityId];
  if (!targetEntity) return null;

  const otherEntitiesInScene = Object.values(entities).filter(e => e.id !== targetEntityId);
  const q = searchQuery.toLowerCase().trim();

  const filteredSceneEntities = otherEntitiesInScene.filter(e => {
    if (!q) return true;
    return e.name.toLowerCase().includes(q) ||
      e.id.toLowerCase().includes(q) ||
      e.physicalProperties?.material?.toLowerCase().includes(q) ||
      e.fallback2D?.description?.toLowerCase().includes(q);
  });

  const filteredCatalogPresets = CATALOG_COMPATIBILITY_PRESETS.filter(c => {
    if (!q) return true;
    return c.name.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q);
  });

  const targetMaxDims = targetEntity.physicalProperties?.fitsMaxDimensions;
  const targetParts = targetEntity.parts || [];

  // Helper pour vérifier si un objet rentre
  const checkFit = (itemDims?: [number, number, number]) => {
    if (!itemDims) return { fits: true, note: 'Dimensions non spécifiées' };
    if (!targetMaxDims) return { fits: true, note: 'Pas de restriction maximale spécifiée' };

    const [ix, iy, iz] = itemDims;
    const [mx, my, mz] = targetMaxDims;

    const fits = ix <= mx && iy <= my && iz <= mz;
    if (fits) {
      return {
        fits: true,
        note: `Compatible : ${(ix * 100).toFixed(1)} × ${(iy * 100).toFixed(1)} × ${(iz * 100).toFixed(1)} cm rentre dans ${(mx * 100).toFixed(1)} × ${(my * 100).toFixed(1)} × ${(mz * 100).toFixed(1)} cm`
      };
    } else {
      const overX = ix > mx ? `largeur (+${((ix - mx) * 100).toFixed(1)}cm)` : '';
      const overY = iy > my ? `épaisseur (+${((iy - my) * 100).toFixed(1)}cm)` : '';
      const overZ = iz > mz ? `hauteur (+${((iz - mz) * 100).toFixed(1)}cm)` : '';
      const reason = [overX, overY, overZ].filter(Boolean).join(', ');
      return {
        fits: false,
        note: `Dépassement : ${reason}`
      };
    }
  };

  const handleTestInScene = (itemId: string, itemName: string) => {
    const result = testEntityCapacity(targetEntityId, itemId);
    if (result.fits) {
      playAudioFx('fanfare');
      setFeedback(`✅ Succès : « ${itemName} » est parfaitement logé dans ${targetEntity.name} !`);
    } else {
      playAudioFx('bell');
      setFeedback(`⚠️ Incompatible : « ${itemName} » dépasse la capacité maximale de ${targetEntity.name}.`);
    }
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleSpawnAndTest = (candidate: CatalogCandidate) => {
    // Si l'entité existe déjà dans la scène
    if (entities[candidate.id]) {
      handleTestInScene(candidate.id, candidate.name);
      return;
    }

    // Sinon créer l'entité et la tester
    const newEntity: EntitySpec = {
      id: candidate.id,
      name: candidate.name,
      capabilities: [
        {
          type: 'transform',
          position: { x: 0.75, y: 0.85, z: 0.2 },
          scale: { x: 1, y: 1, z: 1 }
        },
        { type: 'draggable' },
        { type: 'collider' }
      ],
      visuals: {
        assetId: candidate.id.includes('laptop') ? 'laptop' : candidate.id.includes('gourde') ? 'gourde' : 'carton',
        shape: candidate.id.includes('gourde') ? 'cylinder' : 'box',
        color: candidate.id.includes('laptop') ? '#94a3b8' : candidate.id.includes('gourde') ? '#0284c7' : '#b45309'
      },
      physicalProperties: {
        dimensions: candidate.dimensions,
        weightKg: candidate.weightKg
      },
      relations: [
        { type: 'compatible_with', targetId: targetEntityId, metadata: { targetPart: candidate.targetPart } }
      ]
    };

    applyPatch({
      entitiesCreated: [newEntity]
    }, `Ajouter accessoire : ${candidate.name}`, {});

    setTimeout(() => {
      handleTestInScene(candidate.id, candidate.name);
    }, 150);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="compatibility-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 5000,
        background: 'rgba(15, 23, 42, 0.84)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '820px',
          maxHeight: '88vh',
          background: 'rgba(30, 41, 59, 0.98)',
          border: '1px solid rgba(255, 255, 255, 0.16)',
          borderRadius: '16px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6), 0 0 30px rgba(168, 85, 247, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* HEADER */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.14), transparent)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '28px' }}>🎒</span>
            <div>
              <h2
                id="compatibility-modal-title"
                style={{
                  margin: 0,
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#f8fafc',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                Rechercher à partir de cet objet · {targetEntity.name}
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    background: 'rgba(168, 85, 247, 0.2)',
                    color: '#c084fc',
                    border: '1px solid rgba(168, 85, 247, 0.4)'
                  }}
                >
                  Mindel §21
                </span>
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: '#94a3b8' }}>
                Test de capacité spatiale, encombrement géométrique et compatibilité d'accessoires.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer la modal"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '8px',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px 10px',
              fontSize: '14px',
              transition: 'all 0.15s'
            }}
          >
            ✕
          </button>
        </div>

        {/* FEEDBACK BANNER */}
        {feedback && (
          <div
            style={{
              padding: '10px 24px',
              background: feedback.includes('Succès') ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)',
              borderBottom: feedback.includes('Succès') ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)',
              color: feedback.includes('Succès') ? '#a7f3d0' : '#fca5a5',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {feedback}
          </div>
        )}

        {/* FICHE SÉMANTIQUE DE L'OBJET CONTENANT */}
        <div
          style={{
            margin: '20px 24px 0',
            padding: '14px 18px',
            background: 'rgba(15, 23, 42, 0.6)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#f1f5f9' }}>
              📐 Propriétés Physiques & Gabarits Internes
            </span>
            <span style={{ fontSize: '11.5px', color: '#10b981', background: 'rgba(16, 185, 129, 0.15)', padding: '2px 8px', borderRadius: '6px' }}>
              État : {targetEntity.state || 'standard'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', fontSize: '12px' }}>
            {targetEntity.physicalProperties?.dimensions && (
              <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '8px 12px', borderRadius: '8px' }}>
                <span style={{ color: '#94a3b8', display: 'block', fontSize: '10.5px' }}>DIMENSIONS EXTERNES</span>
                <span style={{ color: '#f8fafc', fontWeight: 600 }}>
                  {(targetEntity.physicalProperties.dimensions[0] * 100).toFixed(0)} × {(targetEntity.physicalProperties.dimensions[1] * 100).toFixed(0)} × {(targetEntity.physicalProperties.dimensions[2] * 100).toFixed(0)} cm
                </span>
              </div>
            )}
            {targetEntity.physicalProperties?.capacityLiters && (
              <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '8px 12px', borderRadius: '8px' }}>
                <span style={{ color: '#94a3b8', display: 'block', fontSize: '10.5px' }}>VOLUME UTILE</span>
                <span style={{ color: '#f8fafc', fontWeight: 600 }}>
                  {targetEntity.physicalProperties.capacityLiters} Litres
                </span>
              </div>
            )}
            {targetMaxDims && (
              <div style={{ background: 'rgba(168, 85, 247, 0.12)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
                <span style={{ color: '#c084fc', display: 'block', fontSize: '10.5px' }}>GABARIT MAX ADMISSIBLE</span>
                <span style={{ color: '#ffffff', fontWeight: 700 }}>
                  {(targetMaxDims[0] * 100).toFixed(1)} × {(targetMaxDims[1] * 100).toFixed(1)} × {(targetMaxDims[2] * 100).toFixed(1)} cm
                </span>
              </div>
            )}
          </div>

          {/* PARTIES SÉMANTIQUES INTERNES */}
          {targetParts.length > 0 && (
            <div style={{ marginTop: '4px' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                Compartiments identifiés ({targetParts.length}) :
              </span>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                {targetParts.map(part => (
                  <span
                    key={part.id}
                    style={{
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '6px',
                      padding: '3px 8px',
                      fontSize: '11px',
                      color: '#cbd5e1'
                    }}
                  >
                    🏷️ {part.name} {part.capacityLiters ? `(${part.capacityLiters}L)` : ''}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RECHERCHE NATURELLE CONTEXTUELLE (Mindel §16 & §20) */}
        <div style={{ padding: '0 24px', marginTop: '16px' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <span style={{ position: 'absolute', left: '12px', fontSize: '14px', color: '#94a3b8' }}>🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Filtrer ou rechercher un accessoire pour ${targetEntity.name} (ex: "gourde", "ordinateur 16", "casque")...`}
              style={{
                width: '100%',
                padding: '10px 36px 10px 38px',
                borderRadius: '10px',
                border: '1px solid rgba(168, 85, 247, 0.4)',
                background: 'rgba(15, 23, 42, 0.85)',
                color: '#f8fafc',
                fontSize: '12.5px',
                outline: 'none'
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '12px',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* TABS */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', padding: '0 24px', marginTop: '14px', gap: '12px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('scene')}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'scene' ? '2px solid #a855f7' : '2px solid transparent',
              padding: '10px 4px',
              fontSize: '13px',
              fontWeight: activeTab === 'scene' ? 700 : 500,
              color: activeTab === 'scene' ? '#c084fc' : '#94a3b8',
              cursor: 'pointer'
            }}
          >
            Objets scène ({filteredSceneEntities.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('catalog')}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'catalog' ? '2px solid #a855f7' : '2px solid transparent',
              padding: '10px 4px',
              fontSize: '13px',
              fontWeight: activeTab === 'catalog' ? 700 : 500,
              color: activeTab === 'catalog' ? '#c084fc' : '#94a3b8',
              cursor: 'pointer'
            }}
          >
            Accessoires recommandés & Catalogue ({filteredCatalogPresets.length})
          </button>
        </div>

        {/* LIST CONTENT */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {activeTab === 'scene' ? (
            filteredSceneEntities.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                {searchQuery ? `Aucun objet de la scène ne correspond à « ${searchQuery} ».` : 'Aucun autre objet dans la scène 3D pour tester la capacité. Utilisez l\'onglet « Accessoires recommandés » pour en faire apparaître.'}
              </div>
            ) : (
              filteredSceneEntities.map(item => {
                const fitResult = checkFit(item.physicalProperties?.dimensions);
                return (
                  <div
                    key={item.id}
                    style={{
                      background: 'rgba(15, 23, 42, 0.75)',
                      border: `1px solid ${fitResult.fits ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                      borderRadius: '10px',
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '16px'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '16px' }}>{fitResult.fits ? '✅' : '❌'}</span>
                        <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#f8fafc' }}>
                          {item.name}
                        </span>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: '4px',
                            background: fitResult.fits ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                            color: fitResult.fits ? '#6ee7b7' : '#fca5a5'
                          }}
                        >
                          {fitResult.fits ? 'COMPATIBLE' : 'INCOMPATIBLE'}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: fitResult.fits ? '#a7f3d0' : '#f87171', marginTop: '4px' }}>
                        {fitResult.note}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleTestInScene(item.id, item.name)}
                      style={{
                        background: fitResult.fits ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(239, 68, 68, 0.15)',
                        color: fitResult.fits ? '#ffffff' : '#f87171',
                        border: fitResult.fits ? 'none' : '1px solid rgba(239, 68, 68, 0.4)',
                        borderRadius: '7px',
                        padding: '7px 14px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <span>📐</span> Tester dans la 3D
                    </button>
                  </div>
                );
              })
            )
          ) : filteredCatalogPresets.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontSize: '13px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <span>Aucun accessoire catalogué ne correspond à « {searchQuery} ».</span>
              {searchQuery.trim().length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    const cleanName = searchQuery.trim();
                    const isLaptopLike = cleanName.toLowerCase().includes('ordi') || cleanName.toLowerCase().includes('laptop') || cleanName.toLowerCase().includes('pc');
                    const isBottleLike = cleanName.toLowerCase().includes('gourde') || cleanName.toLowerCase().includes('bouteille') || cleanName.toLowerCase().includes('thermos');
                    
                    const customCandidate: CatalogCandidate = {
                      id: `custom_${Date.now().toString(36)}`,
                      name: cleanName.charAt(0).toUpperCase() + cleanName.slice(1),
                      icon: isLaptopLike ? '💻' : isBottleLike ? '🧃' : '📦',
                      category: 'Personnalisé',
                      dimensions: isLaptopLike ? [0.36, 0.02, 0.25] : isBottleLike ? [0.08, 0.25, 0.08] : [0.20, 0.10, 0.15],
                      weightKg: isLaptopLike ? 1.6 : isBottleLike ? 0.35 : 0.8,
                      description: `Accessoire recherché en langage naturel : « ${cleanName} »`,
                      targetPart: isLaptopLike ? 'part_laptop_sleeve' : isBottleLike ? 'part_side_bottle' : 'part_main_cavity'
                    };
                    handleSpawnAndTest(customCandidate);
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 18px',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(168, 85, 247, 0.3)'
                  }}
                >
                  ⚡ Créer & tester « {searchQuery.trim()} » dans la 3D
                </button>
              )}
            </div>
          ) : (
            filteredCatalogPresets.map(candidate => {
              const fitResult = checkFit(candidate.dimensions);
              const isAlreadyInScene = !!entities[candidate.id];

              return (
                <div
                  key={candidate.id}
                  style={{
                    background: 'rgba(15, 23, 42, 0.75)',
                    border: `1px solid ${fitResult.fits ? 'rgba(168, 85, 247, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
                    borderRadius: '10px',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '18px' }}>{candidate.icon}</span>
                      <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#f8fafc' }}>
                        {candidate.name}
                      </span>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: fitResult.fits ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                          color: fitResult.fits ? '#6ee7b7' : '#fca5a5'
                        }}
                      >
                        {fitResult.fits ? 'COMPATIBLE' : 'DÉPASSEMENT'}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                      {candidate.description} — {fitResult.note}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSpawnAndTest(candidate)}
                    style={{
                      background: isAlreadyInScene
                        ? 'rgba(255, 255, 255, 0.08)'
                        : 'linear-gradient(135deg, #a855f7, #7e22ce)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '7px',
                      padding: '7px 14px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>{isAlreadyInScene ? '📐' : '➕'}</span>
                    {isAlreadyInScene ? 'Tester dans la 3D' : 'Ajouter & Tester'}
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* FOOTER */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(15, 23, 42, 0.8)',
            fontSize: '12px',
            color: '#94a3b8'
          }}
        >
          <span>
            💡 Répond précisément à : « Mon matériel rentre-t-il dans cet objet ? » sans ambiguïté 2D.
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              borderRadius: '7px',
              padding: '6px 14px',
              color: '#f1f5f9',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
