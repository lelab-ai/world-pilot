// src/ui/SyntheticPlaytesterModal.tsx
// Interface utilisateur pour une estimation géométrique du parcours et ses diagnostics.

import React, { useState, useEffect } from 'react';
import { useWorldStore } from '../engine/store';
import {
  PLAYTESTER_PERSONAS,
  PlaytesterPersona
} from '../engine/syntheticPlaytester';
import { playAudioFx } from '../engine/evaluator';

export const SyntheticPlaytesterModal: React.FC = () => {
  const show = useWorldStore(s => s.showSyntheticPlaytesterModal);
  const close = useWorldStore(s => s.closeSyntheticPlaytesterModal);
  const result = useWorldStore(s => s.playtesterResult);
  const activePersona = useWorldStore(s => s.activePlaytesterPersona);
  const setActivePersona = useWorldStore(s => s.setActivePlaytesterPersona);
  const runPlaytest = useWorldStore(s => s.runPlaytest);
  const isVisualizerActive = useWorldStore(s => s.isPlaytesterVisualizerActive);
  const toggleVisualizer = useWorldStore(s => s.togglePlaytesterVisualizer);
  const applyRepair = useWorldStore(s => s.applyMinimalPatchAndRetest);
  const openPublishGate = useWorldStore(s => s.openPublishReadinessModal);
  const userFrictionState = useWorldStore(s => s.userFrictionState);
  const shadowGraph = useWorldStore(s => s.shadowGraph);
  const lastGuarantorAudit = useWorldStore(s => s.lastGuarantorAudit);
  const uiLanguage = useWorldStore(s => s.uiLanguage);
  const isFr = uiLanguage === 'fr';

  const [isRunning, setIsRunning] = useState(false);
  const [copiedPatch, setCopiedPatch] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if ((e.key === 'y' || e.key === 'Y') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (show) close();
        else useWorldStore.getState().openSyntheticPlaytesterModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [show, close]);

  if (!show || !result) return null;

  const currentPersonaInfo = PLAYTESTER_PERSONAS[activePersona] || PLAYTESTER_PERSONAS.speedrunner;

  const handleRerun = () => {
    setIsRunning(true);
    playAudioFx('tink');
    setTimeout(() => {
      runPlaytest(activePersona);
      setIsRunning(false);
      playAudioFx('sparkle');
    }, 450);
  };

  const handleApplyFix = () => {
    const res = applyRepair();
    if (res.success) {
      playAudioFx('fanfare');
    }
  };

  const handleCopyPatch = () => {
    if (!result.minimalPatch) return;
    const str = JSON.stringify(result.minimalPatch, null, 2);
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(str).then(() => {
        setCopiedPatch(true);
        playAudioFx('chime');
        setTimeout(() => setCopiedPatch(false), 2000);
      });
    }
  };

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
        className="modal-content synthetic-playtester-modal"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '960px',
          width: '95%',
          maxHeight: '92vh',
          background: 'radial-gradient(circle at top, #0f172a 0%, #030712 100%)',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          borderRadius: '16px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(16, 185, 129, 0.1)',
          color: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(90deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.4) 100%)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '26px' }}>🤖</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em', color: '#f8fafc' }}>
                  {isFr ? 'Vérification spatiale estimée' : 'Estimated Spatial Verification'}
                </h2>
                <span
                  style={{
                    background: 'rgba(16, 185, 129, 0.2)',
                    color: '#34d399',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    border: '1px solid rgba(16, 185, 129, 0.4)'
                  }}
                >
                  {isFr ? 'HEURISTIQUE GÉOMÉTRIQUE' : 'GEOMETRIC HEURISTIC'}
                </span>
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
                  {isFr ? 'PATCH SUGGÉRÉ' : 'SUGGESTED PATCH'}
                </span>
              </div>
              <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#94a3b8' }}>
                {isFr ? 'Estime un parcours depuis les positions et capacités déclarées. Ne pilote pas Rapier et ne prouve pas la jouabilité.' : 'Estimates path from declared positions & capabilities. Does not simulate Rapier or replace full gameplay.'}
              </p>
            </div>
          </div>

          <button
            onClick={close}
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

        {/* Persona Selector Bar */}
        <div
          style={{
            padding: '12px 24px',
            background: 'rgba(15, 23, 42, 0.85)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#cbd5e1' }}>{isFr ? 'Profil Cognitif :' : 'Cognitive Profile:'}</span>
            {(['speedrunner', 'explorer', 'adversarial', 'novice', 'human_cloned'] as PlaytesterPersona[]).map(pKey => {
              const p = PLAYTESTER_PERSONAS[pKey];
              const isSelected = activePersona === pKey;
              return (
                <button
                  key={pKey}
                  onClick={() => {
                    setActivePersona(pKey);
                    playAudioFx('tink');
                  }}
                  style={{
                    background: isSelected ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                    border: isSelected ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.1)',
                    color: isSelected ? '#34d399' : '#94a3b8',
                    borderRadius: '6px',
                    padding: '5px 12px',
                    fontSize: '12px',
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>{p.avatar}</span>
                  <span>{pKey === 'human_cloned' ? (isFr ? 'Clone Humain' : 'Human Clone') : pKey === 'speedrunner' ? 'Speedrunner' : pKey === 'explorer' ? (isFr ? 'Explorateur' : 'Explorer') : pKey === 'adversarial' ? 'Playtester' : (isFr ? 'Apprenti' : 'Novice')}</span>
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={toggleVisualizer}
              style={{
                background: isVisualizerActive ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                border: isVisualizerActive ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.12)',
                color: isVisualizerActive ? '#38bdf8' : '#cbd5e1',
                borderRadius: '6px',
                padding: '5px 12px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              👁️ {isFr ? 'Trajectoire 3D :' : '3D Trajectory:'} <strong>{isVisualizerActive ? (isFr ? 'VISIBLE' : 'VISIBLE') : (isFr ? 'MASQUÉE' : 'HIDDEN')}</strong>
            </button>

            <button
              onClick={handleRerun}
              disabled={isRunning}
              style={{
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid #10b981',
                color: '#34d399',
                borderRadius: '6px',
                padding: '5px 14px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: isRunning ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>{isRunning ? (isFr ? '⏳ Simulation…' : '⏳ Simulating…') : (isFr ? '▶️ Relancer le Playtest' : '▶️ Rerun Playtest')}</span>
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Multi-Agent Closed Loop Banner when in human_cloned mode */}
          {activePersona === 'human_cloned' && (
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.1) 100%)',
                border: '1px solid rgba(168, 85, 247, 0.35)',
                borderRadius: '12px',
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '28px' }}>🧠</span>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#c084fc', letterSpacing: '0.04em' }}>
                      {isFr ? "BOUCLE D'APPRENTISSAGE MULTI-AGENTS ACTIVE" : "MULTI-AGENT CLOSED-LOOP ACTIVE"}
                    </span>
                    <span style={{ fontSize: '10px', background: 'rgba(168, 85, 247, 0.25)', color: '#e9d5ff', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>
                      {isFr ? "MIMÉTISME COMPORTEMENTAL" : "BEHAVIORAL MIMICRY"}
                    </span>
                  </div>
                  <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#cbd5e1' }}>
                    {isFr
                      ? `Le rapport peut prendre en compte la dernière friction enregistrée (${userFrictionState?.consecutiveFrictionCount || 0} sur ${userFrictionState?.lastFailedEntityName || 'aucun objet'}). Les contrôles bornés et les vérifications ignorées sont détaillés ci-dessous.`
                      : `Incorporates latest recorded user friction (${userFrictionState?.consecutiveFrictionCount || 0} on ${userFrictionState?.lastFailedEntityName || 'none'}). Bounded verification and limitations detailed below.`}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ textAlign: 'right', fontSize: '11px' }}>
                      <div style={{ color: '#94a3b8' }}>{isFr ? 'Contrôles déterministes :' : 'Deterministic Checks:'}</div>
                      <div style={{ fontWeight: 700, color: lastGuarantorAudit?.approved ? '#4ade80' : '#fbbf24' }}>
                        🛡️ {lastGuarantorAudit?.status || (isFr ? 'AUCUN CONTRÔLE EXÉCUTÉ' : 'NO AUDIT EXECUTED')}
                      </div>
                      {lastGuarantorAudit && (
                        <div style={{ maxWidth: '420px', marginTop: '4px', color: '#94a3b8', lineHeight: 1.4 }}>
                          {lastGuarantorAudit.summary}
                          <details style={{ marginTop: '4px' }}>
                            <summary style={{ cursor: 'pointer' }}>{isFr ? 'Portée et limites' : 'Scope & Limitations'}</summary>
                            <ul style={{ margin: '4px 0 0', paddingLeft: '16px', textAlign: 'left' }}>
                              {lastGuarantorAudit.limitations.map((limitation, index) => <li key={index}>{limitation}</li>)}
                            </ul>
                          </details>
                        </div>
                      )}
                </div>
                <div style={{ textAlign: 'right', fontSize: '11px', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '10px' }}>
                  <div style={{ color: '#94a3b8' }}>Shadow Graph :</div>
                  <div style={{ fontWeight: 700, color: '#38bdf8' }}>
                    ⚡ {shadowGraph.observations.length} {isFr ? 'geste(s)' : 'action(s)'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Hero Run Status */}
          <div
            style={{
              background: result.success ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
              border: `1px solid ${result.success ? '#10b981' : '#f59e0b'}`,
              borderRadius: '12px',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: `2px solid ${result.success ? '#10b981' : '#f59e0b'}`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '16px',
                  color: result.success ? '#34d399' : '#fbbf24'
                }}
              >
                <span>{result.verificationStatus === 'unverifiable' ? 'N/A' : `${result.completionRate}%`}</span>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '15px', fontWeight: 800, color: result.success ? '#34d399' : '#fbbf24' }}>
                    {result.verificationStatus === 'unverifiable'
                      ? (isFr ? 'NON VÉRIFIABLE : AUCUNE CIBLE' : 'UNVERIFIABLE: NO TARGET')
                      : result.verificationStatus === 'passed'
                        ? (isFr ? 'PARCOURS ESTIMÉ FRANCHISSABLE' : 'ESTIMATED PATH CLEAR')
                        : (isFr ? 'BLOCAGE ESTIMÉ DÉTECTÉ' : 'ESTIMATED BOTTLENECK DETECTED')}
                  </span>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                    ({result.stepsCompleted}/{result.totalStepsExpected} {isFr ? 'étapes franchies' : 'steps completed'})
                  </span>
                </div>
                <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#cbd5e1' }}>
                  {isFr ? 'Scénario :' : 'Scenario:'} <strong>{result.scenarioTitle}</strong> • {isFr ? 'Durée estimée :' : 'Est. Duration:'} {result.totalDurationSec}s • {result.waypoints.length} {isFr ? 'waypoints spatiaux' : 'spatial waypoints'}
                </p>
                <div style={{ marginTop: '2px', fontSize: '11px', color: '#94a3b8' }}>
                  {isFr ? 'Méthode :' : 'Method:'} <strong>{isFr ? 'heuristique géométrique' : 'geometric heuristic'}</strong> • {isFr ? 'confiance limitée' : 'bounded confidence'} • Focus : <em>{currentPersonaInfo.focus}</em>
                </div>
                <details style={{ marginTop: '5px', fontSize: '11px', color: '#94a3b8' }}>
                  <summary style={{ cursor: 'pointer' }}>{isFr ? 'Limites de cette estimation' : 'Limitations of this estimation'}</summary>
                  <ul style={{ margin: '5px 0 0', paddingLeft: '18px' }}>
                    {result.limitations.map((limitation, index) => <li key={index}>{limitation}</li>)}
                  </ul>
                </details>
              </div>
            </div>

            {/* If minimal patch is available */}
            {result.minimalPatch && !result.patchApplied && (
              <button
                onClick={handleApplyFix}
                style={{
                  background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                  border: '1px solid #34d399',
                  color: '#ffffff',
                  borderRadius: '8px',
                  padding: '10px 18px',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 4px 18px rgba(16, 185, 129, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span>✨ {isFr ? 'Réparer en 1 Clic (Minimal Patch)' : '1-Click Invariant-Guided Auto-Heal'}</span>
              </button>
            )}

            {result.patchApplied && (
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.2)',
                  border: '1px solid #10b981',
                  color: '#34d399',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700
                }}
              >
                {isFr ? '✓ Minimal Patch Appliqué' : '✓ Minimal Patch Applied'}
              </div>
            )}
          </div>

          {/* Minimal Patch Auto-Repair Section if diagnostic exists */}
          {result.diagnostics.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#f87171', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>⚠️</span>
                <span>{isFr ? `Diagnostics & Goulots d'Étranglement Détectés (${result.diagnostics.length})` : `Detected Diagnostics & Bottlenecks (${result.diagnostics.length})`}</span>
              </div>

              {result.diagnostics.map(diag => (
                <div
                  key={diag.id}
                  style={{
                    background: 'rgba(30, 41, 59, 0.5)',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    borderRadius: '10px',
                    padding: '14px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          background: 'rgba(239, 68, 68, 0.2)',
                          color: '#f87171',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: 800
                        }}
                      >
                        {diag.type}
                      </span>
                      <strong style={{ fontSize: '13px', color: '#f8fafc' }}>{diag.title}</strong>
                    </div>

                    {diag.location && (
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                        Coord : ({diag.location.map(n => n.toFixed(2)).join(', ')})
                      </span>
                    )}
                  </div>

                  <p style={{ margin: 0, fontSize: '12px', color: '#cbd5e1', lineHeight: 1.5 }}>
                    {diag.message}
                  </p>

                  <div style={{ fontSize: '11px', color: '#38bdf8', background: 'rgba(0, 0, 0, 0.3)', padding: '6px 10px', borderRadius: '6px' }}>
                    💡 <em>{isFr ? 'Diagnostic :' : 'Diagnostic:'}</em> {diag.details}
                  </div>

                  <div style={{ fontSize: '11px', color: '#fde68a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{isFr ? '🔧 Solution recommandée :' : '🔧 Recommended Fix:'}</span>
                    <span>{diag.suggestedFix}</span>
                  </div>
                </div>
              ))}

              {/* Minimal Patch Diff Card */}
              {result.minimalPatch && (
                <div
                  style={{
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    borderRadius: '10px',
                    padding: '14px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px' }}>✨</span>
                      <strong style={{ fontSize: '12px', color: '#38bdf8' }}>
                        {isFr ? "Minimal Patch Calculé par l'IA :" : 'AI-Computed Minimal Patch:'} {result.patchDescription}
                      </strong>
                    </div>

                    <button
                      onClick={handleCopyPatch}
                      style={{
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#94a3b8',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        cursor: 'pointer'
                      }}
                    >
                      {copiedPatch ? (isFr ? '✓ Copié' : '✓ Copied') : (isFr ? '📋 Copier Diff' : '📋 Copy Diff')}
                    </button>
                  </div>

                  <pre
                    style={{
                      margin: 0,
                      background: 'rgba(0, 0, 0, 0.5)',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      color: '#a5f3fc',
                      overflowX: 'auto',
                      maxHeight: '120px'
                    }}
                  >
                    {JSON.stringify(result.minimalPatch, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Waypoints Trajectory Log */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>📍</span>
              <span>{isFr ? `Trajectoire Spatiale & Journal d'Exécution (${result.waypoints.length} points)` : `Spatial Trajectory & Execution Log (${result.waypoints.length} points)`}</span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '8px'
              }}
            >
              {result.waypoints.map((wp) => {
                const isSuccess = wp.status === 'success';
                const isBlocked = wp.status === 'blocked' || wp.status === 'error';
                const statusColor = isBlocked ? '#ef4444' : isSuccess ? '#10b981' : '#38bdf8';

                return (
                  <div
                    key={wp.id}
                    style={{
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: `1px solid ${statusColor}44`,
                      borderRadius: '8px',
                      padding: '10px 12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>
                        T+{wp.timestampSec.toFixed(1)}s • {isFr ? 'Étape' : 'Step'} {wp.stepIndex}
                      </span>
                      <span
                        style={{
                          fontSize: '9px',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: `${statusColor}22`,
                          color: statusColor
                        }}
                      >
                        {wp.action.toUpperCase()}
                      </span>
                    </div>

                    <strong style={{ fontSize: '11px', color: '#f1f5f9' }}>{wp.label}</strong>

                    <div style={{ fontSize: '10px', color: '#64748b' }}>
                      Position : ({wp.position.map(n => n.toFixed(2)).join(', ')})
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'rgba(15, 23, 42, 0.95)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>
            <span>{isFr ? 'Statut : ' : 'Status: '}</span>
            <strong style={{ color: result.success ? '#10b981' : '#f59e0b' }}>
              {result.verificationStatus === 'unverifiable'
                ? (isFr ? '⚠️ Résultat non vérifiable' : '⚠️ Unverifiable Result')
                : result.success
                  ? (isFr ? '✓ Estimation locale sans blocage détecté' : '✓ 100% Reachable, Zero Dead-End Detected')
                  : (isFr ? '⚠️ Blocage estimé à examiner' : '⚠️ Estimated Bottleneck to Inspect')}
            </strong>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => {
                close();
                openPublishGate();
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
              <span>🛡️ {isFr ? 'Ouvrir Publish Readiness Gate' : 'Open Publish Readiness Gate'}</span>
            </button>

            <button
              onClick={close}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#f8fafc',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {isFr ? 'Fermer' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
