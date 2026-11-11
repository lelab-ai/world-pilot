// src/ui/AgentCognitiveLedgerModal.tsx
// Modal d'Inspection & d'Arbitrage Décisionnel des Agents IA
// Affiche les observations comportementales, suggestions d'améliorations et matrice d'arbitrage ("quand intégrer ?")

import React, { useState, useMemo } from 'react';
import { useWorldStore } from '../engine/store';
import type { 
  ObservationCategory, 
  ArbitrationDecision,
  IntegrationTiming 
} from '../engine/agentCognitiveLedger';

const CATEGORY_LABELS: Record<ObservationCategory, { label: string; icon: string; color: string }> = {
  ergonomie: { label: 'Ergonomie', icon: '🖐️', color: '#38bdf8' },
  physique_spatiale: { label: 'Physique Spatiale', icon: '⚛️', color: '#a855f7' },
  pedagogie: { label: 'Pédagogie & Gestes', icon: '🎓', color: '#10b981' },
  securite_procedure: { label: 'Sécurité & Procédure', icon: '🛡️', color: '#f59e0b' },
  gameplay_design: { label: 'Game Design & Équilibre', icon: '🎮', color: '#ec4899' }
};

const DECISION_BADGES: Record<ArbitrationDecision, { label: string; bg: string; color: string; border: string }> = {
  approved: { label: 'Accepté', bg: 'rgba(16, 185, 129, 0.2)', color: '#34d399', border: '1px solid #10b981' },
  integrated: { label: 'Intégré (Live)', bg: 'rgba(56, 189, 248, 0.25)', color: '#38bdf8', border: '1px solid #0284c7' },
  pending_samples: { label: 'En attente d’échantillons', bg: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', border: '1px solid #d97706' },
  rejected: { label: 'Rejeté', bg: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid #dc2626' }
};

const TIMING_LABELS: Record<IntegrationTiming, { label: string; icon: string }> = {
  immediate: { label: 'Hot-patch Immédiat (Direct)', icon: '⚡' },
  next_session: { label: 'Prochaine session (Cycle E2)', icon: '🔄' },
  major_milestone: { label: 'Version Majeure (V3.0)', icon: '🚀' },
  conditional_3x: { label: 'Conditionnel (si 3x récurrences)', icon: '📊' }
};

export const AgentCognitiveLedgerModal: React.FC = () => {
  const isOpen = useWorldStore(s => s.showAgentLedgerModal);
  const onClose = useWorldStore(s => s.closeAgentLedgerModal);
  const observations = useWorldStore(s => s.agentObservations);
  const summary = useWorldStore(s => s.agentLedgerSummary);
  const arbitrateObs = useWorldStore(s => s.arbitrateAgentObservation);
  const applyHotPatch = useWorldStore(s => s.applyAgentHotPatch);
  const exportLedger = useWorldStore(s => s.exportAgentLedgerJson);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDecision, setSelectedDecision] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeObsId, setActiveObsId] = useState<string | null>(observations[0]?.id || null);

  const filteredObservations = useMemo(() => {
    return observations.filter(o => {
      if (selectedCategory !== 'all' && o.category !== selectedCategory) return false;
      if (selectedDecision !== 'all' && o.arbitration?.decision !== selectedDecision) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          o.observation.toLowerCase().includes(q) ||
          o.agentName.toLowerCase().includes(q) ||
          o.category.toLowerCase().includes(q) ||
          o.suggestedImprovement?.title.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [observations, selectedCategory, selectedDecision, searchQuery]);

  const activeObs = useMemo(() => {
    return observations.find(o => o.id === activeObsId) || filteredObservations[0] || null;
  }, [observations, activeObsId, filteredObservations]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="agent-ledger-title"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(2, 6, 23, 0.85)',
        backdropFilter: 'blur(16px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1160px',
          height: '86vh',
          maxHeight: '920px',
          background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.98), rgba(10, 15, 29, 0.98))',
          border: '1.5px solid rgba(56, 189, 248, 0.35)',
          borderRadius: '18px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 35px rgba(56, 189, 248, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: '#f8fafc'
        }}
      >
        {/* EN-TÊTE DU MODAL */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(30, 41, 59, 0.4)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ fontSize: '26px' }}>🧠</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 id="agent-ledger-title" style={{ margin: 0, fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em', color: '#f8fafc' }}>
                  Journal cognitif et arbitrage décisionnel des agents IA
                </h2>
                <span
                  style={{
                    background: 'rgba(56, 189, 248, 0.18)',
                    color: '#38bdf8',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: 700
                  }}
                >
                  Mémoire Active
                </span>
              </div>
              <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
                Observations temps réel, suggestions d’améliorations et arbitrage autonome : que retenir, quand intégrer et pourquoi.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => exportLedger()}
              className="button subtle"
              title="Exporter le journal en JSON pour audit externe ou entraînement de modèle"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                fontSize: '12px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#cbd5e1',
                cursor: 'pointer'
              }}
            >
              <span>📥 Exporter JSON</span>
            </button>
            <button
              onClick={onClose}
              aria-label="Fermer le journal cognitif"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                color: '#94a3b8',
                fontSize: '18px',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease'
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* BANDEAU KPI DES DÉCISIONS */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '12px',
            padding: '12px 24px',
            background: 'rgba(15, 23, 42, 0.6)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: '10px', padding: '8px 14px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Observations</span>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#f8fafc', marginTop: '2px' }}>{summary.totalObservations}</div>
          </div>
          <div style={{ background: 'rgba(16, 185, 129, 0.08)', borderRadius: '10px', padding: '8px 14px', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
            <span style={{ fontSize: '11px', color: '#6ee7b7', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Acceptées</span>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#34d399', marginTop: '2px' }}>{summary.approvedCount}</div>
          </div>
          <div style={{ background: 'rgba(56, 189, 248, 0.08)', borderRadius: '10px', padding: '8px 14px', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
            <span style={{ fontSize: '11px', color: '#7dd3fc', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Intégrées (Live)</span>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#38bdf8', marginTop: '2px' }}>{summary.integratedCount}</div>
          </div>
          <div style={{ background: 'rgba(245, 158, 11, 0.08)', borderRadius: '10px', padding: '8px 14px', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
            <span style={{ fontSize: '11px', color: '#fcd34d', textTransform: 'uppercase', letterSpacing: '0.05em' }}>En Attente (3x)</span>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#fbbf24', marginTop: '2px' }}>{summary.pendingCount}</div>
          </div>
          <div style={{ background: 'rgba(168, 85, 247, 0.08)', borderRadius: '10px', padding: '8px 14px', border: '1px solid rgba(168, 85, 247, 0.25)' }}>
            <span style={{ fontSize: '11px', color: '#d8b4fe', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Taux d'Approbation</span>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#c084fc', marginTop: '2px' }}>{summary.approvalRatePercent}%</div>
          </div>
        </div>

        {/* CORPS PRINCIPAL : LISTE GAUCHE (40%) + DÉTAILS ARBITRAGE DROITE (60%) */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '420px 1fr', overflow: 'hidden' }}>
          
          {/* COLONNE GAUCHE : FILTRES & LISTE DES OBSERVATIONS */}
          <div style={{ borderRight: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', background: 'rgba(10, 15, 29, 0.5)' }}>
            {/* Barre de recherche et filtres */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input
                type="text"
                placeholder="🔍 Filtrer les observations ou agents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  padding: '7px 12px',
                  fontSize: '12px',
                  outline: 'none'
                }}
              />
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
                <button
                  onClick={() => setSelectedCategory('all')}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    border: selectedCategory === 'all' ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.08)',
                    background: selectedCategory === 'all' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                    color: selectedCategory === 'all' ? '#38bdf8' : '#94a3b8',
                    fontSize: '11px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  🌐 Toutes
                </button>
                {Object.entries(CATEGORY_LABELS).map(([catKey, catInfo]) => (
                  <button
                    key={catKey}
                    onClick={() => setSelectedCategory(catKey)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: selectedCategory === catKey ? `1px solid ${catInfo.color}` : '1px solid rgba(255,255,255,0.08)',
                      background: selectedCategory === catKey ? `${catInfo.color}22` : 'transparent',
                      color: selectedCategory === catKey ? catInfo.color : '#94a3b8',
                      fontSize: '11px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {catInfo.icon} {catInfo.label}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
                <button
                  onClick={() => setSelectedDecision('all')}
                  style={{
                    padding: '3px 7px',
                    borderRadius: '5px',
                    border: selectedDecision === 'all' ? '1px solid #94a3b8' : '1px solid rgba(255,255,255,0.08)',
                    background: selectedDecision === 'all' ? 'rgba(148, 163, 184, 0.2)' : 'transparent',
                    color: selectedDecision === 'all' ? '#f8fafc' : '#64748b',
                    fontSize: '10px',
                    cursor: 'pointer'
                  }}
                >
                  Tous statuts
                </button>
                <button
                  onClick={() => setSelectedDecision('approved')}
                  style={{
                    padding: '3px 7px',
                    borderRadius: '5px',
                    border: selectedDecision === 'approved' ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.08)',
                    background: selectedDecision === 'approved' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                    color: selectedDecision === 'approved' ? '#34d399' : '#64748b',
                    fontSize: '10px',
                    cursor: 'pointer'
                  }}
                >
                  ✅ Validés
                </button>
                <button
                  onClick={() => setSelectedDecision('integrated')}
                  style={{
                    padding: '3px 7px',
                    borderRadius: '5px',
                    border: selectedDecision === 'integrated' ? '1px solid #0284c7' : '1px solid rgba(255,255,255,0.08)',
                    background: selectedDecision === 'integrated' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                    color: selectedDecision === 'integrated' ? '#38bdf8' : '#64748b',
                    fontSize: '10px',
                    cursor: 'pointer'
                  }}
                >
                  ⚡ Live Hot-patch
                </button>
                <button
                  onClick={() => setSelectedDecision('pending_samples')}
                  style={{
                    padding: '3px 7px',
                    borderRadius: '5px',
                    border: selectedDecision === 'pending_samples' ? '1px solid #d97706' : '1px solid rgba(255,255,255,0.08)',
                    background: selectedDecision === 'pending_samples' ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
                    color: selectedDecision === 'pending_samples' ? '#fbbf24' : '#64748b',
                    fontSize: '10px',
                    cursor: 'pointer'
                  }}
                >
                  ⏳ Attente 3x
                </button>
                <button
                  onClick={() => setSelectedDecision('rejected')}
                  style={{
                    padding: '3px 7px',
                    borderRadius: '5px',
                    border: selectedDecision === 'rejected' ? '1px solid #dc2626' : '1px solid rgba(255,255,255,0.08)',
                    background: selectedDecision === 'rejected' ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
                    color: selectedDecision === 'rejected' ? '#f87171' : '#64748b',
                    fontSize: '10px',
                    cursor: 'pointer'
                  }}
                >
                  ❌ Rejetés
                </button>
              </div>
            </div>

            {/* Liste scrollable */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
              {filteredObservations.map(obs => {
                const isSelected = obs.id === activeObs?.id;
                const cat = CATEGORY_LABELS[obs.category];
                const dec = obs.arbitration ? DECISION_BADGES[obs.arbitration.decision] : null;

                return (
                  <div
                    key={obs.id}
                    onClick={() => setActiveObsId(obs.id)}
                    style={{
                      padding: '12px',
                      marginBottom: '8px',
                      borderRadius: '10px',
                      background: isSelected 
                        ? 'linear-gradient(135deg, rgba(30, 58, 138, 0.4), rgba(15, 23, 42, 0.8))'
                        : 'rgba(255, 255, 255, 0.02)',
                      border: isSelected 
                        ? '1.5px solid #38bdf8' 
                        : '1px solid rgba(255, 255, 255, 0.06)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '11px', color: cat.color, fontWeight: 600 }}>
                        {cat.icon} {cat.label}
                      </span>
                      {dec && (
                        <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: dec.bg, color: dec.color, border: dec.border }}>
                          {dec.label}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#f1f5f9', lineHeight: 1.4, marginBottom: '6px' }}>
                      {obs.observation}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: '#64748b' }}>
                      <span>👤 {obs.agentName}</span>
                      {obs.evidence.hesitationSeconds && (
                        <span style={{ color: '#f59e0b' }}>⏱️ Hésitation : {obs.evidence.hesitationSeconds}s</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* COLONNE DROITE : FEUILLE D'ARBITRAGE DÉTAILLÉE */}
          <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {activeObs ? (
              <>
                {/* 1. FICHE DE L'OBSERVATION */}
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '20px' }}>{CATEGORY_LABELS[activeObs.category].icon}</span>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: CATEGORY_LABELS[activeObs.category].color }}>
                        {CATEGORY_LABELS[activeObs.category].label.toUpperCase()} · SÉVÉRITÉ : {activeObs.severity.toUpperCase()}
                      </span>
                    </div>
                    <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                      Observé le {new Date(activeObs.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <h3 style={{ margin: '0 0 10px 0', fontSize: '15px', color: '#ffffff', lineHeight: 1.4 }}>
                    "{activeObs.observation}"
                  </h3>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', fontSize: '12px', color: '#94a3b8', background: 'rgba(0,0,0,0.2)', padding: '10px 14px', borderRadius: '8px' }}>
                    <div><b>Agent émetteur :</b> {activeObs.agentName}</div>
                    {activeObs.experienceTitle && <div><b>Expérience :</b> {activeObs.experienceTitle}</div>}
                    {activeObs.evidence.targetEntityName && <div><b>Cible :</b> {activeObs.evidence.targetEntityName}</div>}
                    {activeObs.evidence.hesitationSeconds && <div style={{ color: '#fbbf24' }}><b>Temps d'hésitation :</b> {activeObs.evidence.hesitationSeconds}s</div>}
                    {activeObs.evidence.contextNotes && <div style={{ width: '100%', color: '#cbd5e1', fontStyle: 'italic' }}>Note de contexte : {activeObs.evidence.contextNotes}</div>}
                  </div>
                </div>

                {/* 2. PROPOSITION D'AMÉLIORATION RECOMMANDÉE */}
                {activeObs.suggestedImprovement && (
                  <div style={{ background: 'rgba(56, 189, 248, 0.04)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '12px', padding: '18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', letterSpacing: '0.05em' }}>
                        💡 AMÉLIORATION PROPOSÉE PAR L'AGENT
                      </span>
                      <span style={{ fontSize: '11px', background: 'rgba(56, 189, 248, 0.2)', color: '#7dd3fc', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>
                        Confiance : {Math.round(activeObs.suggestedImprovement.confidenceScore * 100)}%
                      </span>
                    </div>

                    <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#f8fafc' }}>
                      {activeObs.suggestedImprovement.title}
                    </h4>
                    <p style={{ margin: '0 0 10px 0', fontSize: '12.5px', color: '#cbd5e1', lineHeight: 1.5 }}>
                      {activeObs.suggestedImprovement.description}
                    </p>

                    <div style={{ fontSize: '12px', color: '#34d399', background: 'rgba(16, 185, 129, 0.1)', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                      <b>Impact attendu :</b> {activeObs.suggestedImprovement.expectedImpact}
                    </div>
                  </div>
                )}

                {/* 3. DÉCISION D'ARBITRAGE & TIMING D'INTÉGRATION */}
                {activeObs.arbitration && (
                  <div style={{ background: 'rgba(15, 23, 42, 0.85)', border: '1.5px solid rgba(255, 255, 255, 0.12)', borderRadius: '12px', padding: '18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc', letterSpacing: '0.05em' }}>
                        ⚖️ Matrice d'arbitrage et échéancier (« Quand intégrer ? »)
                      </span>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                        Évalué par : {activeObs.arbitration.evaluatedBy}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                      <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px', borderRadius: '8px' }}>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>DÉCISION D'INTÉGRATION</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 700, color: DECISION_BADGES[activeObs.arbitration.decision].color }}>
                            {DECISION_BADGES[activeObs.arbitration.decision].label}
                          </span>
                          <span style={{ fontSize: '10px', background: 'rgba(255, 255, 255, 0.1)', padding: '2px 6px', borderRadius: '4px', color: '#e2e8f0' }}>
                            Priorité {activeObs.arbitration.priority}
                          </span>
                        </div>
                      </div>

                      <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px', borderRadius: '8px' }}>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>CALENDRIER (« QUAND ? »)</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
                          <span>{TIMING_LABELS[activeObs.arbitration.timing].icon}</span>
                          <span>{TIMING_LABELS[activeObs.arbitration.timing].label}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ fontSize: '12px', color: '#e2e8f0', background: 'rgba(255, 255, 255, 0.02)', padding: '10px 14px', borderRadius: '8px', borderLeft: '3px solid #38bdf8', marginBottom: '16px' }}>
                      <b>Justification de l'arbitrage :</b> {activeObs.arbitration.rationale}
                    </div>

                    {/* BOUTONS D'ACTION SUR LA DÉCISION */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '14px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => arbitrateObs(activeObs.id, { decision: 'approved', timing: 'immediate' })}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: '1px solid #10b981',
                            background: activeObs.arbitration.decision === 'approved' ? 'rgba(16, 185, 129, 0.25)' : 'transparent',
                            color: '#34d399',
                            fontSize: '11.5px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          ✓ Valider l'Intégration
                        </button>
                        <button
                          onClick={() => arbitrateObs(activeObs.id, { decision: 'pending_samples', timing: 'conditional_3x' })}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: '1px solid #f59e0b',
                            background: activeObs.arbitration.decision === 'pending_samples' ? 'rgba(245, 158, 11, 0.25)' : 'transparent',
                            color: '#fbbf24',
                            fontSize: '11.5px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          ⏳ Mettre en Attente (3x)
                        </button>
                        <button
                          onClick={() => arbitrateObs(activeObs.id, { decision: 'rejected' })}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: '1px solid #ef4444',
                            background: activeObs.arbitration.decision === 'rejected' ? 'rgba(239, 68, 68, 0.25)' : 'transparent',
                            color: '#f87171',
                            fontSize: '11.5px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          ✕ Rejeter
                        </button>
                      </div>

                      {/* BOUTON D'INJECTION HOT-PATCH EN DIRECT */}
                      {activeObs.arbitration.decision !== 'integrated' && (
                        <button
                          onClick={() => applyHotPatch(activeObs.id)}
                          style={{
                            padding: '7px 16px',
                            borderRadius: '8px',
                            border: '1px solid #38bdf8',
                            background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                            color: '#ffffff',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 4px 14px rgba(2, 132, 199, 0.3)'
                          }}
                        >
                          <span>⚡ Injecter Hot-Patch Immédiat</span>
                        </button>
                      )}
                      {activeObs.arbitration.decision === 'integrated' && (
                        <span style={{ color: '#38bdf8', fontSize: '12px', fontWeight: 650, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>✅ Hot-patch actif dans la scène</span>
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
                Sélectionnez une observation dans la colonne de gauche.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
