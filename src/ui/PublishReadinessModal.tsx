// src/ui/PublishReadinessModal.tsx
// Interface des contrôles locaux de préparation WorldPilot.

import React, { useState, useEffect } from 'react';
import { useWorldStore } from '../engine/store';
import {
  LOCAL_PARCEL_PRESETS,
  LandPresetType,
  CheckCategory,
  exportReadinessReportJSON
} from '../engine/publishReadiness';
import { playAudioFx } from '../engine/evaluator';

export const PublishReadinessModal: React.FC = () => {
  const show = useWorldStore(s => s.showPublishReadinessModal);
  const close = useWorldStore(s => s.closePublishReadinessModal);
  const report = useWorldStore(s => s.publishReadinessReport);
  const activePreset = useWorldStore(s => s.activeLandPreset);
  const setActivePreset = useWorldStore(s => s.setActiveLandPreset);
  const runReadinessChecks = useWorldStore(s => s.runPublishReadinessCheck);
  const openPlaytester = useWorldStore(s => s.openSyntheticPlaytesterModal);
  const uiLanguage = useWorldStore(s => s.uiLanguage);
  const isFr = uiLanguage === 'fr';

  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'all' | CheckCategory>('all');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if ((e.key === 'p' || e.key === 'P') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (show) close();
        else useWorldStore.getState().openPublishReadinessModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [show, close]);

  if (!show || !report) return null;

  const currentPresetData = LOCAL_PARCEL_PRESETS[activePreset] || LOCAL_PARCEL_PRESETS.standard;

  const filteredChecks = activeCategoryFilter === 'all'
    ? report.checks
    : report.checks.filter(c => c.category === activeCategoryFilter);

  const handleCopyManifest = () => {
    const jsonStr = exportReadinessReportJSON(report);
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(jsonStr).then(() => {
        setCopied(true);
        playAudioFx('chime');
        setTimeout(() => setCopied(false), 2200);
        useWorldStore.setState(s => ({
          warnings: [...s.warnings, '📋 Rapport de contrôles WorldPilot copié dans le presse-papiers.']
        }));
      });
    }
  };

  const handleDownloadManifest = () => {
    const jsonStr = exportReadinessReportJSON(report);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `worldpilot_readiness_${report.worldId}_v${report.worldVersion}.json`;
    a.click();
    URL.revokeObjectURL(url);
    playAudioFx('chime');
  };

  const statusColors = {
    CHECKS_PASSED: { bg: 'rgba(16, 185, 129, 0.15)', border: '#10b981', text: '#34d399', label: isFr ? 'CONTRÔLES LOCAUX PASSÉS' : 'LOCAL CHECKS PASSED', icon: '✅' },
    WARNINGS: { bg: 'rgba(245, 158, 11, 0.15)', border: '#f59e0b', text: '#fbbf24', label: isFr ? 'ATTENTION / WARNINGS' : 'WARNINGS DETECTED', icon: '⚠️' },
    BLOCKED: { bg: 'rgba(239, 68, 68, 0.15)', border: '#ef4444', text: '#f87171', label: isFr ? 'BLOQUÉ PAR LES CONTRÔLES LOCAUX' : 'BLOCKED BY LOCAL CHECKS', icon: '🚫' }
  };

  const currentStatusConfig = statusColors[report.overallStatus];

  return (
    <div
      className="modal-backdrop"
      onClick={close}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(3, 7, 18, 0.78)',
        backdropFilter: 'blur(12px)',
        zIndex: 99999,
        display: 'grid',
        placeItems: 'center',
        padding: '24px'
      }}
    >
      <div
        className="modal-content publish-readiness-modal"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '920px',
          width: '95%',
          maxHeight: '90vh',
          background: 'radial-gradient(circle at top, #0f172a 0%, #020617 100%)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: '16px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(56, 189, 248, 0.1)',
          color: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(90deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.4) 100%)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>🛡️</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em', color: '#f8fafc' }}>
                  {isFr ? 'Contrôles locaux WorldPilot' : 'WorldPilot Local Readiness Report'}
                </h2>
                <span
                  style={{
                    background: 'rgba(56, 189, 248, 0.2)',
                    color: '#38bdf8',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    border: '1px solid rgba(56, 189, 248, 0.4)'
                  }}
                >
                  {isFr ? 'RAPPORT LOCAL' : 'AUDIT REPORT'}
                </span>
              </div>
              <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#94a3b8' }}>
                {isFr
                  ? 'Contrôles heuristiques sur les données de la scène. Ils ne mesurent ni les appareils, ni les performances, ni la conformité de publication.'
                  : 'Heuristic checks of scene data only. No device performance, physical ergonomics, platform compatibility, or publication compliance is measured.'}
              </p>
            </div>
          </div>
          <button
            onClick={close}
            aria-label={isFr ? "Fermer" : "Close"}
            title={isFr ? "Fermer" : "Close"}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: '#94a3b8',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
          >
            ✕
          </button>
        </div>

        {/* Local geometry preset selector */}
        <div
          style={{
            padding: '12px 24px',
            background: 'rgba(15, 23, 42, 0.8)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#cbd5e1' }}>{isFr ? '📐 Gabarit local :' : '📐 Local bounds preset:'}</span>
            {(['standard', 'large', 'estate'] as LandPresetType[]).map(pKey => {
              const p = LOCAL_PARCEL_PRESETS[pKey];
              const isSelected = activePreset === pKey;
              return (
                <button
                  key={pKey}
                  onClick={() => {
                    setActivePreset(pKey);
                    playAudioFx('tink');
                  }}
                  style={{
                    background: isSelected ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                    border: isSelected ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                    color: isSelected ? '#38bdf8' : '#94a3b8',
                    borderRadius: '6px',
                    padding: '5px 12px',
                    fontSize: '12px',
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {isFr ? p.title : (pKey === 'standard' ? 'Compact (10m × 10m)' : pKey === 'large' ? 'Medium (20m × 20m)' : 'Extended (40m × 40m)')}
                </button>
              );
            })}
          </div>

          <div style={{ fontSize: '11px', color: '#94a3b8' }}>
            {isFr
              ? `${currentPresetData.description} Ce gabarit est local et ne correspond pas à une spécification officielle.`
              : 'Local coordinate bounds only; these presets are not official Victoria VR parcel specifications or safety bounds.'}
          </div>
        </div>

        {/* Scrollable Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Hero Audit Banner */}
          <div
            style={{
              background: currentStatusConfig.bg,
              border: `1px solid ${currentStatusConfig.border}`,
              borderRadius: '12px',
              padding: '18px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '20px',
              boxShadow: `0 8px 30px ${currentStatusConfig.bg}`
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: `2px solid ${currentStatusConfig.border}`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '18px',
                  color: currentStatusConfig.text
                }}
              >
                <span>{report.score}</span>
                <span style={{ fontSize: '9px', color: '#94a3b8', marginTop: '-2px' }}>/ 100</span>
              </div>
              <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                {isFr ? 'score heuristique local' : 'local heuristic score'}
              </span>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '16px' }}>{currentStatusConfig.icon}</span>
                  <span style={{ fontSize: '16px', fontWeight: 800, letterSpacing: '0.05em', color: currentStatusConfig.text }}>
                    {currentStatusConfig.label}
                  </span>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#cbd5e1' }}>
                  {isFr
                    ? `${report.summary.passCount} tests validés • ${report.summary.warnCount} avertissements • `
                    : `${report.summary.passCount} checks passed • ${report.summary.warnCount} warnings • `}
                  <strong style={{ color: report.summary.failCount > 0 ? '#ef4444' : '#10b981' }}>
                    {isFr ? `${report.summary.failCount} bloquant(s)` : `${report.summary.failCount} blocker(s)`}
                  </strong>
                </p>
                <div style={{ marginTop: '4px', fontSize: '11px', color: '#94a3b8' }}>
                  {isFr ? 'ID du rapport local :' : 'Local report ID:'} <code style={{ color: '#38bdf8' }}>{report.reportId}</code>
                </div>
              </div>
            </div>

            {/* Quick Cross-Platform Badges */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
                {isFr ? 'SEUILS DE BUDGET ESTIMÉS' : 'ESTIMATED BUDGET CHECKS'}
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 600,
                    background: report.estimatedBudgetChecks.desktopWeb ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                    color: report.estimatedBudgetChecks.desktopWeb ? '#34d399' : '#f87171'
                  }}
                  title={isFr ? 'Seuil géométrique estimé pour le web desktop ; aucun FPS mesuré' : 'Estimated geometry budget for desktop web; no FPS measured'}
                >
                  🖥️ PC budget
                </span>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 600,
                    background: report.estimatedBudgetChecks.mobileWeb ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                    color: report.estimatedBudgetChecks.mobileWeb ? '#34d399' : '#fbbf24'
                  }}
                  title={isFr ? 'Seuil géométrique estimé pour mobile ; aucun test tactile effectué' : 'Estimated geometry budget for mobile; no touch test performed'}
                >
                  📱 Mobile budget
                </span>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 600,
                    background: report.estimatedBudgetChecks.vrHeadset ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                    color: report.estimatedBudgetChecks.vrHeadset ? '#34d399' : '#f87171'
                  }}
                  title={isFr ? 'Seuil géométrique heuristique pour casque VR ; aucun casque ni FPS mesuré' : 'Heuristic geometry budget for VR; no headset or FPS measured'}
                >
                  🥽 VR budget
                </span>
              </div>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '12px' }}>
            {[
              { id: 'all', label: isFr ? 'Tous les tests' : 'All Checks', count: report.checks.length },
              { id: 'logic', label: isFr ? '⚙️ Logique Causale' : '⚙️ Causal Logic', count: report.checks.filter(c => c.category === 'logic').length },
              { id: 'invariants', label: isFr ? '📜 Invariants' : '📜 Invariants', count: report.checks.filter(c => c.category === 'invariants').length },
              { id: 'spatial', label: isFr ? '📐 Bornes locales' : '📐 Spatial Bounds', count: report.checks.filter(c => c.category === 'spatial').length },
              { id: 'performance', label: isFr ? '⚡ Performance' : '⚡ Performance', count: report.checks.filter(c => c.category === 'performance').length },
              { id: 'compliance', label: isFr ? '⚖️ Revue manuelle' : '⚖️ Manual review', count: report.checks.filter(c => c.category === 'compliance').length }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveCategoryFilter(tab.id as any);
                  playAudioFx('tink');
                }}
                style={{
                  background: activeCategoryFilter === tab.id ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  border: activeCategoryFilter === tab.id ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                  color: activeCategoryFilter === tab.id ? '#38bdf8' : '#94a3b8',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: activeCategoryFilter === tab.id ? 700 : 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>{tab.label}</span>
                <span
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    padding: '1px 5px',
                    borderRadius: '8px',
                    fontSize: '10px'
                  }}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Audit Checks Checklist */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredChecks.map(check => {
              const isWarn = check.status === 'WARN';
              const isFail = check.status === 'FAIL';

              const cardBorder = isFail ? 'rgba(239, 68, 68, 0.4)' : isWarn ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.25)';
              const badgeBg = isFail ? 'rgba(239, 68, 68, 0.2)' : isWarn ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)';
              const badgeText = isFail ? '#f87171' : isWarn ? '#fbbf24' : '#34d399';

              return (
                <div
                  key={check.id}
                  style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: `1px solid ${cardBorder}`,
                    borderRadius: '10px',
                    padding: '14px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span
                        style={{
                          background: badgeBg,
                          color: badgeText,
                          fontSize: '10px',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          letterSpacing: '0.04em'
                        }}
                      >
                        {check.status}
                      </span>
                      <strong style={{ fontSize: '13px', color: '#f1f5f9' }}>{check.title}</strong>
                    </div>

                    {check.metric && (
                      <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 600, background: 'rgba(56, 189, 248, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                        {check.metric}
                      </span>
                    )}
                  </div>

                  <p style={{ margin: 0, fontSize: '12px', color: '#cbd5e1', lineHeight: 1.5 }}>
                    {check.message}
                  </p>

                  {check.details && (
                    <div style={{ fontSize: '11px', color: '#94a3b8', background: 'rgba(0, 0, 0, 0.3)', padding: '6px 10px', borderRadius: '6px' }}>
                      💡 <em>{isFr ? 'Détails :' : 'Details:'}</em> {check.details}
                    </div>
                  )}

                  {check.fixAdvice && (
                    <div style={{ fontSize: '11px', color: isFail ? '#fca5a5' : '#fde68a', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>{isFr ? '🔧 Action recommandée :' : '🔧 Recommended Action:'}</span>
                      <span>{check.fixAdvice}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'rgba(15, 23, 42, 0.95)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleCopyManifest}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#f8fafc',
                borderRadius: '8px',
                padding: '8px 14px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>{copied ? (isFr ? '✓ Copié !' : '✓ Copied!') : (isFr ? '📋 Copier le rapport JSON' : '📋 Copy JSON Report')}</span>
            </button>

            <button
              onClick={handleDownloadManifest}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#f8fafc',
                borderRadius: '8px',
                padding: '8px 14px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>💾 {isFr ? 'Télécharger le rapport' : 'Download Report'}</span>
            </button>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => {
                close();
                openPlaytester();
              }}
              style={{
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid #38bdf8',
                color: '#38bdf8',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>🤖 {isFr ? 'Lancer l’estimation de parcours' : 'Run Path Estimation'}</span>
            </button>

            <button
              onClick={() => runReadinessChecks(activePreset)}
              style={{
                background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                border: '1px solid #10b981',
                color: '#ffffff',
                borderRadius: '8px',
                padding: '8px 20px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>↻ {isFr ? 'Relancer les contrôles locaux' : 'Rerun Local Checks'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
