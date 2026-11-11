import React, { useState, useEffect } from 'react';
import { useWorldStore } from '../engine/store';
import { playAudioFx } from '../engine/evaluator';
import type { LiveCausalEvent } from '../engine/slices/types';
import { useDraggableModal } from './useDraggableModal';

export const LiveCausalTicker: React.FC = () => {
  const liveCausalFeed = useWorldStore(s => s.liveCausalFeed);
  const clearLiveCausalFeed = useWorldStore(s => s.clearLiveCausalFeed);
  const openResearchDashboard = useWorldStore(s => s.openResearchDashboard);
  const userFrictionState = useWorldStore(s => s.userFrictionState);

  const { offset, isDragging, dragProps } = useDraggableModal();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [now, setNow] = useState(Date.now());

  // Update relative timestamps every 3s
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 3000);
    return () => clearInterval(timer);
  }, []);

  // When a new event arrives, re-enable ticker if dismissed
  useEffect(() => {
    if (liveCausalFeed.length > 0) {
      setIsDismissed(false);
    }
  }, [liveCausalFeed.length]);

  if (isDismissed) {
    return (
      <button
        onClick={() => {
          setIsDismissed(false);
          playAudioFx('switch_click');
        }}
        style={{
          position: 'absolute',
          bottom: `${16 - offset.y}px`,
          left: `calc(50% + ${offset.x}px)`,
          transform: 'translateX(-50%)',
          zIndex: 850,
          background: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: '20px',
          padding: '6px 14px',
          color: '#38bdf8',
          fontSize: '11px',
          fontWeight: 600,
          cursor: 'pointer',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        }}
        title="Afficher le flux causal en direct"
        aria-label="Afficher le flux causal en direct"
      >
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e' }} />
        <span>Bandeau Causal Direct ({liveCausalFeed.length})</span>
      </button>
    );
  }

  const latestEvent: LiveCausalEvent | undefined = liveCausalFeed[0];
  const hasFriction = (userFrictionState?.consecutiveFrictionCount || 0) >= 2;

  const formatRelativeTime = (timestamp: number) => {
    const diffSec = Math.max(0, Math.floor((now - timestamp) / 1000));
    if (diffSec < 4) return "À l'instant";
    if (diffSec < 60) return `il y a ${diffSec}s`;
    const diffMin = Math.floor(diffSec / 60);
    return `il y a ${diffMin}m`;
  };

  const getBadgeStyle = (type: LiveCausalEvent['type']) => {
    switch (type) {
      case 'rule':
        return { background: 'rgba(168, 85, 247, 0.18)', border: '1px solid rgba(168, 85, 247, 0.4)', color: '#c084fc' };
      case 'quest':
        return { background: 'rgba(34, 197, 94, 0.18)', border: '1px solid rgba(34, 197, 94, 0.4)', color: '#4ade80' };
      case 'safety':
        return { background: 'rgba(239, 68, 68, 0.18)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#f87171' };
      case 'victoria':
        return { background: 'rgba(245, 158, 11, 0.18)', border: '1px solid rgba(245, 158, 11, 0.4)', color: '#fbbf24' };
      case 'flag':
        return { background: 'rgba(56, 189, 248, 0.18)', border: '1px solid rgba(56, 189, 248, 0.4)', color: '#38bdf8' };
      default:
        return { background: 'rgba(148, 163, 184, 0.15)', border: '1px solid rgba(148, 163, 184, 0.3)', color: '#cbd5e1' };
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        bottom: `${18 - offset.y}px`,
        left: `calc(50% + ${offset.x}px)`,
        transform: 'translateX(-50%)',
        zIndex: 850,
        maxWidth: '92%',
        width: isExpanded ? '640px' : 'auto',
        transition: isDragging ? 'none' : 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        pointerEvents: 'auto',
      }}
      aria-live="polite"
    >
      <div
        {...dragProps}
        style={{
          ...dragProps.style,
          background: 'rgba(15, 23, 42, 0.92)',
          border: hasFriction 
            ? '1px solid rgba(245, 158, 11, 0.5)'
            : '1px solid rgba(56, 189, 248, 0.3)',
          boxShadow: hasFriction
            ? '0 12px 36px rgba(0,0,0,0.65), 0 0 20px rgba(245, 158, 11, 0.2)'
            : '0 12px 36px rgba(0,0,0,0.6), 0 0 20px rgba(56, 189, 248, 0.12)',
          borderRadius: isExpanded ? '16px' : '30px',
          backdropFilter: 'blur(16px)',
          padding: isExpanded ? '14px 18px' : '8px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: isExpanded ? '12px' : '0px',
          color: '#f8fafc',
          fontSize: '12px',
          userSelect: 'none',
        }}
        title="Cliquer-glisser pour déplacer la barre"
      >
        {/* Main Single-Line Ticker Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px' }}>
          {/* Live Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: '#22c55e',
                boxShadow: '0 0 8px #22c55e',
                display: 'inline-block',
                animation: 'pulse 2s infinite',
              }}
            />
            <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.06em', color: '#4ade80' }}>
              LIVE CAUSAL
            </span>
          </div>

          <span style={{ color: '#475569' }}>|</span>

          {/* Current Latest Event or Idle Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', flexGrow: 1 }}>
            {latestEvent ? (
              <>
                <span style={{ fontSize: '14px' }}>{latestEvent.icon}</span>
                <span style={{ fontWeight: 600, color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {latestEvent.message}
                </span>
                {latestEvent.badge && (
                  <span
                    style={{
                      ...getBadgeStyle(latestEvent.type),
                      padding: '1px 7px',
                      borderRadius: '10px',
                      fontSize: '10px',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {latestEvent.badge}
                  </span>
                )}
                <span style={{ fontSize: '10px', color: '#94a3b8', flexShrink: 0 }}>
                  ({formatRelativeTime(latestEvent.timestamp)})
                </span>
              </>
            ) : (
              <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '11px' }}>
                Prêt · Glissez ou cliquez un objet
              </span>
            )}
          </div>

          {/* Controls: Journal / Observatoire / Dismiss */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            {liveCausalFeed.length > 0 && (
              <button
                onClick={() => {
                  setIsExpanded(!isExpanded);
                  playAudioFx('switch_click');
                }}
                style={{
                  background: isExpanded ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                  border: isExpanded ? '1px solid rgba(56, 189, 248, 0.5)' : '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '14px',
                  padding: '3px 9px',
                  color: isExpanded ? '#38bdf8' : '#cbd5e1',
                  fontSize: '10.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
                title={isExpanded ? 'Réduire le journal' : 'Déplier l’historique causal'}
              >
                <span>⏱️ Journal</span>
                <span style={{ background: 'rgba(0,0,0,0.3)', padding: '0px 5px', borderRadius: '8px', fontSize: '9.5px' }}>
                  {liveCausalFeed.length}
                </span>
                <span>{isExpanded ? '▲' : '▼'}</span>
              </button>
            )}

            <button
              onClick={() => {
                openResearchDashboard();
                playAudioFx('chime');
              }}
              style={{
                background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.25), rgba(3, 105, 161, 0.35))',
                border: '1px solid rgba(56, 189, 248, 0.45)',
                borderRadius: '14px',
                padding: '3px 10px',
                color: '#38bdf8',
                fontSize: '10.5px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
              title="Ouvrir l'Observatoire simplifié (Stepper 1-2-3 & Carte Mission)"
            >
              <span>🛰️</span>
              <span>Comprendre</span>
            </button>

            <button
              onClick={() => {
                setIsDismissed(true);
                playAudioFx('switch_click');
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                padding: '2px 6px',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Masquer le bandeau (réactivable en bas à gauche)"
              aria-label="Masquer le bandeau"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Expanded History Drawer */}
        {isExpanded && (
          <div
            style={{
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              paddingTop: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              maxHeight: '190px',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Chaîne causale récente (du plus récent au plus ancien)
              </span>
              <button
                onClick={() => {
                  clearLiveCausalFeed();
                  playAudioFx('switch_click');
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#64748b',
                  fontSize: '10px',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Effacer l'historique
              </button>
            </div>

            {liveCausalFeed.slice(0, 8).map((evt, idx) => (
              <div
                key={evt.id || idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '5px 10px',
                  borderRadius: '8px',
                  background: idx === 0 ? 'rgba(56, 189, 248, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                  border: idx === 0 ? '1px solid rgba(56, 189, 248, 0.25)' : '1px solid rgba(255, 255, 255, 0.05)',
                  fontSize: '11.5px',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                  <span style={{ fontSize: '13px' }}>{evt.icon}</span>
                  <span style={{ color: idx === 0 ? '#f8fafc' : '#cbd5e1', fontWeight: idx === 0 ? 600 : 400 }}>
                    {evt.message}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  {evt.badge && (
                    <span
                      style={{
                        ...getBadgeStyle(evt.type),
                        padding: '1px 6px',
                        borderRadius: '6px',
                        fontSize: '9.5px',
                        fontWeight: 700,
                      }}
                    >
                      {evt.badge}
                    </span>
                  )}
                  <span style={{ fontSize: '10px', color: '#64748b' }}>
                    {formatRelativeTime(evt.timestamp)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
