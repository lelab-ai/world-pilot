// src/ui/LoadExperienceConfirmationModal.tsx
import React, { useEffect } from 'react';
import { useDraggableModal } from './useDraggableModal';
import { useWorldStore } from '../engine/store';

interface LoadExperienceConfirmationModalProps {
  isOpen: boolean;
  experienceTitle: string;
  itemCount: number;
  onConfirmClearAndLoad: () => void;
  onKeepAndMerge: () => void;
  onCancel: () => void;
  hasCustomSaved?: boolean;
  onResetToOriginal?: () => void;
}

export const LoadExperienceConfirmationModal: React.FC<LoadExperienceConfirmationModalProps> = ({
  isOpen,
  experienceTitle,
  itemCount,
  onConfirmClearAndLoad,
  onKeepAndMerge,
  onCancel,
  hasCustomSaved,
  onResetToOriginal,
}) => {
  const { offset, dragProps } = useDraggableModal();
  const uiLanguage = useWorldStore(state => state.uiLanguage);
  const isFr = uiLanguage === 'fr';

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="clear-scene-modal-title"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(5, 11, 24, 0.82)',
        backdropFilter: 'blur(10px)',
        zIndex: 10005,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.15s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          backgroundColor: '#0f172a',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: '16px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8), 0 0 32px rgba(56, 189, 248, 0.15)',
          overflow: 'hidden',
          color: '#f8fafc',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          display: 'flex',
          flexDirection: 'column',
          transform: `translate(${offset.x}px, ${offset.y}px)`,
        }}
      >
        {/* En-tête avec poignée de déplacement */}
        <div
          {...dragProps}
          style={{
            ...dragProps.style,
            padding: '20px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            background: 'linear-gradient(180deg, rgba(56, 189, 248, 0.1) 0%, rgba(15, 23, 42, 0.3) 100%)',
            userSelect: 'none',
          }}
          title={isFr ? "Cliquer-glisser pour déplacer la boîte de dialogue" : "Click and drag to move dialog"}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px'
            }}
          >
            📦
          </div>
          <div>
            <h3
              id="clear-scene-modal-title"
              style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#f1f5f9' }}
            >
              {isFr ? 'Charger une nouvelle expérience' : 'Load New Experience'}
            </h3>
            <p style={{ margin: '3px 0 0 0', fontSize: '13px', color: '#94a3b8' }}>
              {isFr ? 'Transition vers :' : 'Transition to:'} <strong style={{ color: '#38bdf8' }}>{experienceTitle}</strong>
            </p>
          </div>
        </div>

        {/* Corps */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.5, color: '#cbd5e1' }}>
            {isFr ? (
              <>
                Votre scène contient actuellement{' '}
                <strong style={{ color: '#f8fafc' }}>
                  {itemCount} objet{itemCount > 1 ? 's' : ''}
                </strong>
                . Pour une expérience optimale et sans encombrement visuel, WorldPilot vous propose de faire place nette.
              </>
            ) : (
              <>
                Your scene currently contains{' '}
                <strong style={{ color: '#f8fafc' }}>
                  {itemCount} object{itemCount !== 1 ? 's' : ''}
                </strong>
                . For an optimal experience without visual clutter, WorldPilot recommends starting fresh.
              </>
            )}
          </p>

          <div
            style={{
              padding: '12px 14px',
              borderRadius: '8px',
              backgroundColor: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              fontSize: '12.5px',
              color: '#34d399',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>💡</span>
            <span>
              <strong>{isFr ? 'Conseil :' : 'Tip:'}</strong>{' '}
              {isFr
                ? 'Vider la scène garantit que les objets et colliders physiques de la nouvelle démo sont parfaitement isolés et immédiatement visibles.'
                : 'Clearing the scene ensures objects and physics colliders of the new experience are isolated and immediately visible.'}
            </span>
          </div>

          {hasCustomSaved && (
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '8px',
                backgroundColor: 'rgba(56, 189, 248, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                fontSize: '12.5px',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px'
              }}
            >
              <span>{isFr ? '💾 Une version personnalisée sauvegardée existe pour cette expérience.' : '💾 A custom saved version exists for this experience.'}</span>
              {onResetToOriginal && (
                <button
                  type="button"
                  onClick={onResetToOriginal}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    background: 'rgba(245, 158, 11, 0.15)',
                    color: '#fbbf24',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                  title={isFr ? "Effacer vos modifications et réinitialiser au modèle d'origine" : "Erase modifications and reset to default preset"}
                >
                  {isFr ? "↺ Modèle d'origine" : "↺ Default preset"}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '10px'
          }}
        >
          <button
            onClick={onCancel}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              color: '#94a3b8',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {isFr ? 'Annuler' : 'Cancel'}
          </button>

          <button
            onClick={onKeepAndMerge}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              color: '#e2e8f0',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title={isFr ? "Conserver les objets existants sur la scène et ajouter la nouvelle expérience par-dessus" : "Keep existing objects and append the new experience on top"}
          >
            {isFr ? 'Conserver & Fusionner' : 'Keep & Merge'}
          </button>

          <button
            onClick={onConfirmClearAndLoad}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
            title={isFr ? "Vider tous les objets actuels et charger la nouvelle expérience sur une scène propre" : "Clear all current objects and load the new experience on a fresh scene"}
          >
            <span>🧹</span>
            <span>{isFr ? 'Vider la scène & Charger' : 'Clear Scene & Load'}</span>
            <span
              style={{
                fontSize: '10px',
                padding: '2px 6px',
                borderRadius: '6px',
                backgroundColor: 'rgba(255, 255, 255, 0.25)',
                fontWeight: 800,
                textTransform: 'uppercase'
              }}
            >
              {isFr ? 'Recommandé' : 'Recommended'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
