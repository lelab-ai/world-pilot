import React, { useState, useEffect } from 'react';
import { useWorldStore } from '../engine/store';
import { PERSONA_METADATA, exportToHuggingFaceMDP, exportToMarkdownExecutiveReport } from '../engine/cognitiveTraceRecorder';
import { exportMultiverseDatasetToJSONL, BranchComparisonResult } from '../engine/counterfactualEngine';
import { generateLeRobotDataset } from '../engine/embodiedDataExporter';
import { playAudioFx } from '../engine/evaluator';

export const BehavioralAnalyticsModal: React.FC = () => {
  const show = useWorldStore(s => s.showBehavioralAnalyticsModal);
  const close = useWorldStore(s => s.closeBehavioralAnalyticsModal);
  const report = useWorldStore(s => s.cognitiveReport);
  const cohortSummary = useWorldStore(s => s.cohortSimulationSummary);
  const runCohort = useWorldStore(s => s.runCohortSimulation);
  const activeQuestId = useWorldStore(s => s.world.ir.activeQuestId);
  const quests = useWorldStore(s => s.world.ir.quests);

  // Ghost & Counterfactual Multiverse state
  const isGhostAgentActive = useWorldStore(s => s.isGhostAgentActive);
  const toggleGhostAgent = useWorldStore(s => s.toggleGhostAgent);
  const counterfactualBranches = useWorldStore(s => s.counterfactualBranches);
  const activeBranchId = useWorldStore(s => s.activeBranchId);
  const createCounterfactualFork = useWorldStore(s => s.createCounterfactualFork);
  const runAutonomousBranchRollout = useWorldStore(s => s.runAutonomousBranchRollout);
  const compareActiveBranches = useWorldStore(s => s.compareActiveBranches);
  const switchActiveBranch = useWorldStore(s => s.switchActiveBranch);
  const activeAnomalies = useWorldStore(s => s.activeAnomalies);
  const getCognitiveLoad = useWorldStore(s => s.getCognitiveLoad);

  // CoWorker, Robotics & Certification state
  const coWorker = useWorldStore(s => s.coWorker);
  const teamingMetrics = useWorldStore(s => s.teamingMetrics);
  const exportVLAEmbodiedDataset = useWorldStore(s => s.exportVLAEmbodiedDataset);
  const getCognitiveCertificate = useWorldStore(s => s.getCognitiveCertificate);

  // Digital Twin (Clone) & Spatial Attention state
  const cognitiveClone = useWorldStore(s => s.cognitiveClone);
  const cloneRolloutResult = useWorldStore(s => s.cloneRolloutResult);
  const cloneComparison = useWorldStore(s => s.cloneComparison);
  const synthesizeClone = useWorldStore(s => s.synthesizeClone);
  const simulateCloneRollout = useWorldStore(s => s.simulateCloneRollout);
  const spatialAttention = useWorldStore(s => s.spatialAttention);
  const toggleAttentionHeatmap = useWorldStore(s => s.toggleAttentionHeatmap);

  const [activeTab, setActiveTab] = useState<'profile' | 'cohort' | 'dataset' | 'counterfactual' | 'robotics' | 'certification' | 'clone' | 'attention'>('profile');
  const [copiedType, setCopiedType] = useState<'json' | 'md' | 'multiverse' | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [comparisonResult, setComparisonResult] = useState<BranchComparisonResult | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if ((e.key === 'b' || e.key === 'B') && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        if (show) close();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [show, close]);

  if (!show) return null;

  const currentQuest = activeQuestId && quests ? quests[activeQuestId] : null;
  const personaMeta = PERSONA_METADATA[report.persona];
  const mdpDataset = exportToHuggingFaceMDP(report);

  const handleRunCohort = () => {
    setIsSimulating(true);
    playAudioFx('tink');
    setTimeout(() => {
      runCohort(100);
      setIsSimulating(false);
      playAudioFx('sparkle');
    }, 400);
  };

  const handleCopyJson = () => {
    const str = JSON.stringify(mdpDataset, null, 2);
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(str).then(() => {
        setCopiedType('json');
        playAudioFx('chime');
        setTimeout(() => setCopiedType(null), 2400);
        useWorldStore.setState(s => ({
          warnings: [...s.warnings, '💾 Dataset MDP (HuggingFace / Gym) copié dans le presse-papiers !']
        }));
      });
    }
  };

  const handleCopyMarkdown = () => {
    const md = exportToMarkdownExecutiveReport(report);
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(md).then(() => {
        setCopiedType('md');
        playAudioFx('chime');
        setTimeout(() => setCopiedType(null), 2400);
        useWorldStore.setState(s => ({
          warnings: [...s.warnings, '📄 Rapport exécutif copié dans le presse-papiers !']
        }));
      });
    }
  };

  const handleDownloadJson = () => {
    const str = JSON.stringify(mdpDataset, null, 2);
    const blob = new Blob([str], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `worldpilot_cognitive_trace_${report.sessionId}.json`;
    a.click();
    URL.revokeObjectURL(url);
    playAudioFx('chime');
  };

  return (
    <div className="analytics-modal-overlay" onClick={close}>
      <div className="analytics-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="analytics-modal-header">
          <div className="analytics-header-title-box">
            <span className="analytics-header-badge">BOÎTE NOIRE SÉMANTIQUE</span>
            <h2>🧠 Analyse Comportementale & Empreinte Cognitive</h2>
            <p>
              Cartographie des décisions causales, de la charge cognitive et modélisation de cohortes d'agents IA.
            </p>
          </div>
          <button className="analytics-close-btn" onClick={close} title="Fermer (Échap)">✕</button>
        </div>

        {/* Tab Navigation */}
        <div className="analytics-nav-tabs">
          <button
            className={`analytics-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            📊 Profil ({report.totalDecisions} pas)
          </button>
          <button
            className={`analytics-tab-btn ${activeTab === 'cohort' ? 'active' : ''}`}
            onClick={() => setActiveTab('cohort')}
          >
            🤖 Cohorte IA {cohortSummary ? `· ${cohortSummary.successRate}%` : ''}
          </button>
          <button
            className={`analytics-tab-btn ${activeTab === 'counterfactual' ? 'active' : ''}`}
            onClick={() => setActiveTab('counterfactual')}
          >
            🔀 Multivers & Rejeu ({counterfactualBranches.length})
          </button>
          <button
            className={`analytics-tab-btn ${activeTab === 'robotics' ? 'active' : ''}`}
            onClick={() => setActiveTab('robotics')}
          >
            🦾 Échantillon robotique (JSON WorldPilot)
          </button>
          <button
            className={`analytics-tab-btn ${activeTab === 'certification' ? 'active' : ''}`}
            onClick={() => setActiveTab('certification')}
          >
            📜 Certification & Drills
          </button>
          <button
            className={`analytics-tab-btn ${activeTab === 'clone' ? 'active' : ''}`}
            onClick={() => setActiveTab('clone')}
          >
            🧬 Jumeau & IRL {cognitiveClone ? `· ${cognitiveClone.fidelityScore}%` : ''}
          </button>
          <button
            className={`analytics-tab-btn ${activeTab === 'attention' ? 'active' : ''}`}
            onClick={() => setActiveTab('attention')}
          >
            👁️ Attention 3D ({Object.keys(spatialAttention.fixations).length})
          </button>
          <button
            className={`analytics-tab-btn ${activeTab === 'dataset' ? 'active' : ''}`}
            onClick={() => setActiveTab('dataset')}
          >
            💾 Dataset MDP
          </button>
        </div>

        {/* TAB 1: Profile & Trajectory */}
        {activeTab === 'profile' && (
          <div className="analytics-tab-body">
            {/* Persona Hero Card */}
            <div className="persona-hero-card" style={{ borderLeftColor: personaMeta.badgeColor }}>
              <div className="persona-hero-icon">{personaMeta.icon}</div>
              <div className="persona-hero-info">
                <div className="persona-hero-tag" style={{ backgroundColor: `${personaMeta.badgeColor}25`, color: personaMeta.badgeColor, borderColor: `${personaMeta.badgeColor}60` }}>
                  ARCHÉTYPE COGNITIF DÉTECTÉ
                </div>
                <h3>{personaMeta.label}</h3>
                <p>{personaMeta.description}</p>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="analytics-metrics-grid">
              <div className="analytics-metric-card">
                <span className="metric-label">Efficacité Procédurale</span>
                <span className="metric-value" style={{ color: report.proceduralEfficiency >= 80 ? '#10b981' : report.proceduralEfficiency >= 60 ? '#f59e0b' : '#ef4444' }}>
                  {report.proceduralEfficiency}%
                </span>
                <span className="metric-desc">Pondération fluidité / erreurs</span>
              </div>
              <div className="analytics-metric-card">
                <span className="metric-label">Résilience Post-Alerte</span>
                <span className="metric-value" style={{ color: '#38bdf8' }}>{report.resilienceScore}%</span>
                <span className="metric-desc">{report.recoveryCount} récupération(s) réussie(s)</span>
              </div>
              <div className="analytics-metric-card">
                <span className="metric-label">Latence Décisionnelle</span>
                <span className="metric-value" style={{ color: '#fbbf24' }}>{report.averageLatencyMs} ms</span>
                <span className="metric-desc">Temps moyen de réflexion</span>
              </div>
              <div className="analytics-metric-card">
                <span className="metric-label">Taux d'Hésitation</span>
                <span className="metric-value" style={{ color: report.hesitationRate > 30 ? '#f97316' : '#a7f3d0' }}>
                  {report.hesitationRate}%
                </span>
                <span className="metric-desc">{report.hesitationCount} pause(s) &gt; 3.2s</span>
              </div>
              {(() => {
                const cli = getCognitiveLoad();
                return (
                  <div className="analytics-metric-card" style={{ borderLeft: `3px solid ${cli.color}` }}>
                    <span className="metric-label">Charge Cognitive (CLI)</span>
                    <span className="metric-value" style={{ color: cli.color }}>{cli.index}%</span>
                    <span className="metric-desc">{cli.label}</span>
                  </div>
                );
              })()}
            </div>

            {/* Stress-testing & Anomaly Events Strip if any exist */}
            {activeAnomalies.length > 0 && (
              <div className="analytics-anomalies-strip">
                <h5>🛡️ Journal de Gestion de Crise & Stress-Testing ({activeAnomalies.length} aléas)</h5>
                <div className="anomalies-mini-list">
                  {activeAnomalies.map(anom => (
                    <div key={anom.id} className={`anomaly-mini-item ${anom.status}`}>
                      <span className="anomaly-mini-status">
                        {anom.status === 'resolved' ? '✓ Résolu' : anom.status === 'failed' ? '✗ Échoué' : '⏳ En cours'}
                      </span>
                      <span className="anomaly-mini-title">{anom.title}</span>
                      <span className="anomaly-mini-action">🎯 {anom.recoveryCondition}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Human-AI Teaming & Co-Worker Strip */}
            <div className="analytics-anomalies-strip" style={{ borderColor: 'rgba(52, 211, 153, 0.4)' }}>
              <h5>👥 Collaboration & Teaming Humain-IA ({coWorker.name} · {coWorker.role})</h5>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px', marginTop: '6px' }}>
                <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ fontSize: '10px', color: '#94a3b8' }}>Score de Confiance (Trust)</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#34d399' }}>{teamingMetrics.trustScore}%</div>
                </div>
                <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ fontSize: '10px', color: '#94a3b8' }}>Fluidité d'Équipe</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#60a5fa' }}>{teamingMetrics.teamingFluency}%</div>
                </div>
                <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ fontSize: '10px', color: '#94a3b8' }}>Tâches Déléguées</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#f59e0b' }}>{teamingMetrics.delegatedTasksCount}</div>
                </div>
                <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '6px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ fontSize: '10px', color: '#94a3b8' }}>Reprises Manuelles</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#94a3b8' }}>{teamingMetrics.overriddenTasksCount}</div>
                </div>
              </div>
            </div>

            {/* Causal Step Flow Timeline */}
            <div className="analytics-timeline-box">
              <div className="analytics-timeline-header">
                <h4>Chronologie Causale Sémantique</h4>
                <span className="timeline-count">{report.traces.length} événements discrets enregistrés</span>
              </div>

              {report.traces.length === 0 ? (
                <div className="analytics-empty-state">
                  <p>Aucune interaction causale enregistrée pour le moment dans cette session.</p>
                  <small>Effectuez des découpes, allumez le feu, assaisonnez ou dressez un plat pour tracer votre empreinte cognitive.</small>
                </div>
              ) : (
                <div className="analytics-timeline-list">
                  {report.traces.map((trace) => {
                    const isWarn = Boolean(trace.warningTriggered);
                    const isHesit = trace.isHesitation;
                    return (
                      <div key={trace.stepIndex} className={`timeline-item ${isWarn ? 'is-warning' : isHesit ? 'is-hesitant' : 'is-fluid'}`}>
                        <div className="timeline-step-badge">{trace.stepIndex}</div>
                        <div className="timeline-item-body">
                          <div className="timeline-row-top">
                            <span className="timeline-action-tag">`{trace.actionType}`</span>
                            {trace.sourceEntityName && (
                              <span className="timeline-target-name">{trace.sourceEntityName}</span>
                            )}
                            <span className="timeline-time-tag">+{trace.relativeTimeSec}s</span>
                            <span className="timeline-latency-tag">⚡ {trace.latencyMs}ms</span>
                            {trace.temperature > 20 && (
                              <span className="timeline-temp-tag">🌡️ {Math.round(trace.temperature)}°C</span>
                            )}
                          </div>
                          {trace.warningTriggered && (
                            <div className="timeline-warning-text">⚠️ {trace.warningTriggered}</div>
                          )}
                          {trace.isErrorRecovery && (
                            <div className="timeline-recovery-text">✓ Rebond & ajustement réussi</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: Cohort Simulation (100 Synthetic Agents) */}
        {activeTab === 'cohort' && (
          <div className="analytics-tab-body">
            <div className="cohort-hero-banner">
              <div className="cohort-banner-text">
                <h3>🚀 Simulation Prédictive de Population (100 Agents IA)</h3>
                <p>
                  Déploie une cohorte d'agents synthétiques dotés de personas hétérogènes (Analystes, Explorateurs, Prudents, Impulsifs) pour éprouver la robustesse du scénario :
                  <strong> « {currentQuest?.title || 'Scénario Actif WorldPilot'} »</strong>.
                </p>
              </div>
              <button
                className={`cohort-launch-btn ${isSimulating ? 'simulating' : ''}`}
                onClick={handleRunCohort}
                disabled={isSimulating}
              >
                {isSimulating ? '⏳ Simulation en cours...' : '⚡ Lancer 100 Agents Synthétiques'}
              </button>
            </div>

            {cohortSummary && (
              <div className="cohort-results-container">
                {/* Global Stats */}
                <div className="cohort-kpi-row">
                  <div className="cohort-kpi-card">
                    <span className="kpi-label">Taux de Succès Global</span>
                    <span className="kpi-val" style={{ color: cohortSummary.successRate >= 80 ? '#10b981' : '#f59e0b' }}>
                      {cohortSummary.successRate}%
                    </span>
                    <small>{cohortSummary.cohortSize} agents simulés</small>
                  </div>
                  <div className="cohort-kpi-card">
                    <span className="kpi-label">Durée Moyenne</span>
                    <span className="kpi-val">{cohortSummary.averageDurationSec}s</span>
                    <small>Régulation thermique comprise</small>
                  </div>
                  <div className="cohort-kpi-card">
                    <span className="kpi-label">Note Procédurale Moyenne</span>
                    <span className="kpi-val" style={{ color: '#fbbf24' }}>{cohortSummary.averageScore}/100</span>
                    <small>Critères d'évaluation chef</small>
                  </div>
                </div>

                {/* Persona Breakdown */}
                <div className="cohort-personas-section">
                  <h4>Répartition & Taux de Réussite par Profil Cognitif</h4>
                  <div className="cohort-persona-grid">
                    {(Object.keys(cohortSummary.personaDistribution) as (keyof typeof cohortSummary.personaDistribution)[]).map(pKey => {
                      const count = cohortSummary.personaDistribution[pKey];
                      const rate = cohortSummary.personaSuccessRates[pKey];
                      const pInfo = PERSONA_METADATA[pKey];
                      return (
                        <div key={pKey} className="cohort-persona-card" style={{ borderColor: `${pInfo.badgeColor}50` }}>
                          <div className="persona-card-header">
                            <span>{pInfo.icon} {pInfo.label}</span>
                            <span className="persona-count-badge">{count} agents</span>
                          </div>
                          <div className="persona-success-bar-container">
                            <div
                              className="persona-success-bar"
                              style={{ width: `${rate}%`, backgroundColor: pInfo.badgeColor }}
                            />
                          </div>
                          <div className="persona-success-meta">
                            <span>Taux de succès :</span>
                            <strong>{rate}%</strong>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bottleneck Analysis */}
                <div className="cohort-bottlenecks-section">
                  <h4>Goulots d'Étranglement & Points de Rupture Détectés</h4>
                  <div className="bottleneck-list">
                    {cohortSummary.bottlenecks.map(b => (
                      <div key={b.stepIndex} className="bottleneck-item">
                        <div className="bottleneck-step-num">Étape {b.stepIndex}</div>
                        <div className="bottleneck-content">
                          <div className="bottleneck-title-row">
                            <strong>{b.stepTitle}</strong>
                            <span className="bottleneck-fail-rate">{b.failureRate}% des échecs</span>
                          </div>
                          <div className="bottleneck-risk-desc">⚠️ {b.primaryRisk}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommendations */}
                <div className="cohort-recommendations-box">
                  <h4>💡 Recommandations Pédagogiques & Ergonomiques de l'IA</h4>
                  <ul>
                    {cohortSummary.recommendations.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: AI Dataset Export */}
        {activeTab === 'dataset' && (
          <div className="analytics-tab-body">
            <div className="dataset-export-header">
              <div>
                <h3>💾 Exportation de Données pour Entraînement d'IA</h3>
                <p>
                  Exportez l'historique complet de cette session humaine sous le format mathématique
                  standardisé <strong>Markov Decision Process (MDP)</strong>, prêt pour le fine-tuning
                  de Decision Transformers, d'agents incarnés ou pour l'AI Builder de Victoria VR.
                </p>
              </div>
              <div className="dataset-action-buttons">
                <button className="dataset-btn" onClick={handleCopyJson}>
                  {copiedType === 'json' ? '✓ Copié !' : '📋 Copier Dataset JSON'}
                </button>
                <button className="dataset-btn" onClick={handleCopyMarkdown}>
                  {copiedType === 'md' ? '✓ Copié !' : '📄 Rapport exécutif'}
                </button>
                <button className="dataset-btn primary" onClick={handleDownloadJson}>
                  ⬇️ Télécharger .JSON
                </button>
              </div>
            </div>

            <div className="dataset-json-preview">
              <pre>
                <code>{JSON.stringify(mdpDataset.slice(0, 4), null, 2)}</code>
              </pre>
              {mdpDataset.length > 4 && (
                <div className="dataset-preview-footer">
                  ... et {mdpDataset.length - 4} autres transitions causales formalisées dans ce dataset.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: Counterfactual Multiverse & AI Policy Rollouts */}
        {activeTab === 'counterfactual' && (
          <div className="analytics-tab-body">
            <div className="counterfactual-hero-card">
              <div className="counterfactual-hero-header">
                <div>
                  <div className="counterfactual-tag">ARBRE DÉCISIONNEL & MULTIVERS</div>
                  <h3>🔀 Rejeu Contrefactuel & Agents IA Autonomes</h3>
                  <p>
                    Explorez les embranchements <em>« What-If »</em>. Bifurquez depuis n'importe quelle décision
                    humaine et lancez des simulations autonomes pilotées par différentes politiques d'IA
                    pour comparer les performances, l'équilibre thermique et les temps de complétion.
                  </p>
                </div>
                <div className="counterfactual-ghost-toggle-box">
                  <button
                    className={`counterfactual-ghost-btn ${isGhostAgentActive ? 'active' : ''}`}
                    onClick={toggleGhostAgent}
                    title="Afficher ou masquer la trajectoire fantôme holographique dans le monde 3D"
                  >
                    <span>👻</span>
                    <span>Guide Fantôme 3D : <b>{isGhostAgentActive ? 'ON' : 'OFF'}</b></span>
                  </button>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="counterfactual-action-toolbar">
                <button
                  className="counterfactual-btn primary"
                  onClick={() => {
                    createCounterfactualFork();
                    playAudioFx('fanfare');
                  }}
                >
                  🔀 Créer une bifurcation à l'étape active
                </button>

                <div className="counterfactual-rollout-group">
                  <span className="rollout-label">Lancer un Rollout IA autonome :</span>
                  <button
                    className="rollout-btn analyst"
                    onClick={() => runAutonomousBranchRollout('methodical-analyst')}
                    title="Simuler un agent méthodique (zéro surchauffe, haute régularité)"
                  >
                    🧭 Analyste
                  </button>
                  <button
                    className="rollout-btn explorer"
                    onClick={() => runAutonomousBranchRollout('intuitive-explorer')}
                    title="Simuler un agent agile (assaisonnement créatif, tempo rapide)"
                  >
                    ⚡ Explorateur
                  </button>
                  <button
                    className="rollout-btn impulsive"
                    onClick={() => runAutonomousBranchRollout('impulsive-rushed')}
                    title="Simuler un agent impulsif (rythme effréné, risque thermique)"
                  >
                    🔥 Impulsif
                  </button>
                  <button
                    className="rollout-btn hesitant"
                    onClick={() => runAutonomousBranchRollout('hesitant-learner')}
                    title="Simuler un agent prudent (recherche de conseils, allures douces)"
                  >
                    🌱 Prudent
                  </button>
                </div>
              </div>
            </div>

            {/* Comparison Insights Banner if active */}
            {comparisonResult && (
              <div className="counterfactual-comparison-banner">
                <div className="comparison-banner-header">
                  <h4>⚖️ Comparatif Sémantique : [{comparisonResult.branchA.title}] vs [{comparisonResult.branchB.title}]</h4>
                  <button className="comparison-close-btn" onClick={() => setComparisonResult(null)}>✕</button>
                </div>
                <div className="comparison-kpi-row">
                  <div className={`comparison-kpi-pill ${comparisonResult.scoreDelta >= 0 ? 'positive' : 'negative'}`}>
                    <span>Écart de Score :</span>
                    <b>{comparisonResult.scoreDelta >= 0 ? `+${comparisonResult.scoreDelta}` : comparisonResult.scoreDelta} pts</b>
                  </div>
                  <div className="comparison-kpi-pill info">
                    <span>Écart Temps :</span>
                    <b>{comparisonResult.durationDeltaSec >= 0 ? `+${comparisonResult.durationDeltaSec}s` : `${comparisonResult.durationDeltaSec}s`}</b>
                  </div>
                  <div className={`comparison-kpi-pill ${comparisonResult.stabilityDelta >= 0 ? 'positive' : 'negative'}`}>
                    <span>Stabilité Thermique :</span>
                    <b>{comparisonResult.stabilityDelta >= 0 ? `+${comparisonResult.stabilityDelta}%` : `${comparisonResult.stabilityDelta}%`}</b>
                  </div>
                </div>
                <div className="comparison-verdict-box">{comparisonResult.verdict}</div>
                <ul className="comparison-insights-list">
                  {comparisonResult.keyInsights.map((ins, i) => (
                    <li key={i}>{ins}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Branches List */}
            <div className="counterfactual-branches-container">
              <h4>🌿 Arborescence des Trajectoires ({counterfactualBranches.length} branches)</h4>
              
              {counterfactualBranches.length === 0 ? (
                <div className="empty-branches-card">
                  <span className="empty-icon">🌱</span>
                  <h5>Aucune branche contrefactuelle initialisée</h5>
                  <p>
                    Cliquez sur <b>« Créer une bifurcation »</b> ou choisissez un archétype IA ci-dessus
                    pour générer instantanément une variante contrefactuelle et comparer les décisions.
                  </p>
                </div>
              ) : (
                <div className="branches-grid">
                  {counterfactualBranches.map((branch) => {
                    const isActive = branch.id === activeBranchId;
                    const isRoot = branch.id === 'branch-root-human';
                    return (
                      <div
                        key={branch.id}
                        className={`branch-card ${isActive ? 'active' : ''} ${branch.authorType}`}
                      >
                        <div className="branch-card-header">
                          <div className="branch-author-badge">
                            {branch.authorType === 'human' ? '👤 Trajectoire Humaine' : `🤖 Agent IA (${branch.botPersona})`}
                          </div>
                          {isActive && <span className="branch-active-pill">ACTIVE</span>}
                        </div>

                        <h5 className="branch-title">{branch.title}</h5>
                        <p className="branch-summary">{branch.outcomeSummary}</p>

                        <div className="branch-metrics-row">
                          <div className="branch-metric">
                            <span className="metric-label">Score</span>
                            <span className="metric-value score">{branch.outcomeScore}/100</span>
                          </div>
                          <div className="branch-metric">
                            <span className="metric-label">Stabilité</span>
                            <span className="metric-value">{branch.temperatureStabilityScore}%</span>
                          </div>
                          <div className="branch-metric">
                            <span className="metric-label">Durée</span>
                            <span className="metric-value">{branch.predictedDurationSec}s</span>
                          </div>
                          <div className="branch-metric">
                            <span className="metric-label">Décisions</span>
                            <span className="metric-value">{branch.traces.length}</span>
                          </div>
                        </div>

                        <div className="branch-card-actions">
                          {!isActive && (
                            <button
                              className="branch-action-btn switch"
                              onClick={() => switchActiveBranch(branch.id)}
                            >
                              ⏳ Charger cette branche
                            </button>
                          )}
                          {!isRoot && (
                            <button
                              className="branch-action-btn compare"
                              onClick={() => {
                                const root = counterfactualBranches.find(b => b.id === 'branch-root-human') || counterfactualBranches[0];
                                const comp = compareActiveBranches(root.id, branch.id);
                                setComparisonResult(comp);
                                playAudioFx('tink');
                              }}
                            >
                              ⚖️ Comparer avec Humain
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Export Multiverse dataset */}
            {counterfactualBranches.length > 0 && (
              <div className="multiverse-export-strip">
                <div>
                  <h6>📦 Exportation Multivers Hors-Ligne (Offline RL)</h6>
                  <p>Téléchargez l'arbre complet des trajectoires appariées (Humain vs Agents) au format JSONL.</p>
                </div>
                <button
                  className="dataset-btn"
                  onClick={() => {
                    const jsonl = exportMultiverseDatasetToJSONL(counterfactualBranches);
                    const blob = new Blob([jsonl], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `worldpilot_multiverse_branches_${Date.now()}.jsonl`;
                    a.click();
                    URL.revokeObjectURL(url);
                    playAudioFx('chime');
                  }}
                >
                  ⬇️ Télécharger Branches (.JSONL)
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: WorldPilot-specific synthetic motion sample */}
        {activeTab === 'robotics' && (
          <div className="analytics-tab-body">
            <div className="dataset-intro-box" style={{ borderColor: 'rgba(59, 130, 246, 0.4)' }}>
              <div className="dataset-intro-icon">🦾</div>
              <div>
                <h4>Échantillon de traces spatiales WorldPilot</h4>
                <p>
                  Cette démonstration exporte un échantillon synthétique au format JSON propre à WorldPilot.
                  Il ne s’agit pas d’un fichier compatible Hugging Face LeRobot / Open-X, d’une capture robotique réelle,
                  ni d’une validation pour entraîner un modèle.
                </p>
              </div>
            </div>

            <div className="analytics-metrics-grid" style={{ marginBottom: '16px' }}>
              <div className="analytics-metric-card">
                <span className="metric-label">Format de Données</span>
                <span className="metric-val" style={{ color: '#38bdf8' }}>WorldPilot JSON</span>
                <span className="metric-sub">Schéma local, non standardisé</span>
              </div>
              <div className="analytics-metric-card">
                <span className="metric-label">Épisodes Générés</span>
                <span className="metric-val" style={{ color: '#34d399' }}>{1 + counterfactualBranches.length} épisodes</span>
                <span className="metric-sub">Session locale + {counterfactualBranches.length} branches simulées</span>
              </div>
              <div className="analytics-metric-card">
                <span className="metric-label">Trames Temporelles</span>
                <span className="metric-val" style={{ color: '#f59e0b' }}>{report.traces.length} frames</span>
                <span className="metric-sub">Trames de démonstration, fréquence indicative</span>
              </div>
              <div className="analytics-metric-card">
                <span className="metric-label">Espace d'Action</span>
                <span className="metric-val" style={{ color: '#c084fc' }}>Continuous + Discrete</span>
                <span className="metric-sub">Pose 7D + Affordance tokens</span>
              </div>
            </div>

            <div className="dataset-preview-box">
              <div className="dataset-preview-header">
                <h5>Extrait d’une trame JSON WorldPilot</h5>
                <button
                  className="dataset-btn"
                  onClick={() => {
                    exportVLAEmbodiedDataset();
                    playAudioFx('fanfare');
                  }}
                >
                  📥 Exporter l’échantillon JSON WorldPilot
                </button>
              </div>
              <pre className="dataset-code-block" style={{ maxHeight: '240px' }}>
                {JSON.stringify(
                  generateLeRobotDataset(report, useWorldStore.getState().world, counterfactualBranches).episodes[0]?.frames[0] || { status: 'waiting_for_traces' },
                  null,
                  2
                )}
              </pre>
            </div>
          </div>
        )}

        {/* TAB 6: Cognitive & Motor Skill Certification */}
        {activeTab === 'certification' && (() => {
          const cert = getCognitiveCertificate();
          return (
            <div className="analytics-tab-body">
              {/* Certificate Diploma Card */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.95))',
                border: '2px solid rgba(245, 158, 11, 0.5)',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '-20px',
                  right: '-20px',
                  width: '120px',
                  height: '120px',
                  background: 'radial-gradient(circle, rgba(245, 158, 11, 0.25) 0%, transparent 70%)',
                  pointerEvents: 'none'
                }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <span style={{
                      display: 'inline-block',
                      background: 'rgba(245, 158, 11, 0.2)',
                      border: '1px solid rgba(245, 158, 11, 0.5)',
                      color: '#fbbf24',
                      padding: '3px 10px',
                      borderRadius: '20px',
                      fontSize: '11px',
                      fontWeight: 700,
                      letterSpacing: '0.8px',
                      textTransform: 'uppercase',
                      marginBottom: '8px'
                    }}>
                      CERTIFICAT OFFICIEL D'APTITUDE COGNITIVE
                    </span>
                    <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff', margin: '4px 0' }}>
                      {cert.recipientTitle}
                    </h3>
                    <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                      Délivré le {cert.issueDate} · ID : <code style={{ color: '#38bdf8' }}>{cert.certificateId}</code>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '32px', fontWeight: 900, color: '#fbbf24' }}>
                      {cert.overallScore}<span style={{ fontSize: '18px', color: '#94a3b8' }}>/100</span>
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#34d399' }}>
                      Niveau : {cert.skillLevel}
                    </div>
                  </div>
                </div>

                {/* Radar Metrics Progress Bars */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginTop: '20px' }}>
                  <div style={{ background: 'rgba(0,0,0,0.25)', padding: '10px', borderRadius: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#cbd5e1', marginBottom: '4px' }}>
                      <span>📐 Économie Spatiale</span>
                      <strong style={{ color: '#38bdf8' }}>{cert.radar.spatialEfficiency}%</strong>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${cert.radar.spatialEfficiency}%`, height: '100%', background: '#38bdf8', borderRadius: '3px' }} />
                    </div>
                  </div>

                  <div style={{ background: 'rgba(0,0,0,0.25)', padding: '10px', borderRadius: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#cbd5e1', marginBottom: '4px' }}>
                      <span>🌡️ Contrôle Thermique</span>
                      <strong style={{ color: '#f59e0b' }}>{cert.radar.thermodynamicControl}%</strong>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${cert.radar.thermodynamicControl}%`, height: '100%', background: '#f59e0b', borderRadius: '3px' }} />
                    </div>
                  </div>

                  <div style={{ background: 'rgba(0,0,0,0.25)', padding: '10px', borderRadius: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#cbd5e1', marginBottom: '4px' }}>
                      <span>🛡️ Résilience au Stress</span>
                      <strong style={{ color: '#ef4444' }}>{cert.radar.stressResilience}%</strong>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${cert.radar.stressResilience}%`, height: '100%', background: '#ef4444', borderRadius: '3px' }} />
                    </div>
                  </div>

                  <div style={{ background: 'rgba(0,0,0,0.25)', padding: '10px', borderRadius: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#cbd5e1', marginBottom: '4px' }}>
                      <span>👥 Fluidité Teaming IA</span>
                      <strong style={{ color: '#34d399' }}>{cert.radar.teamingFluency}%</strong>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${cert.radar.teamingFluency}%`, height: '100%', background: '#34d399', borderRadius: '3px' }} />
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#64748b' }}>
                  <span>🔐 Empreinte Cryptographique : <code style={{ color: '#94a3b8' }}>{cert.verificationHash}</code></span>
                </div>
              </div>

              {/* Curricular Adaptive Drills */}
              <div style={{ marginTop: '20px' }}>
                <h4 style={{ fontSize: '15px', color: '#ffffff', marginBottom: '10px' }}>
                  🎯 Défis & Entraînements Curriculaires Recommandés ({cert.recommendedDrills.length})
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {cert.recommendedDrills.map(drill => (
                    <div
                      key={drill.id}
                      style={{
                        background: 'rgba(15, 23, 42, 0.7)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderLeft: `4px solid ${drill.urgency === 'high' ? '#ef4444' : drill.urgency === 'medium' ? '#f59e0b' : '#34d399'}`,
                        borderRadius: '10px',
                        padding: '12px 16px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '10px'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '13px' }}>{drill.title}</div>
                        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{drill.description}</div>
                        <div style={{ fontSize: '11px', color: '#38bdf8', marginTop: '4px' }}>
                          💡 Commande vocale suggérée : <em>« {drill.actionInstruction} »</em>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11px', color: '#94a3b8', background: 'rgba(255,255,255,0.06)', padding: '4px 8px', borderRadius: '6px' }}>
                          ⏱️ {drill.durationSec}s
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}

        {/* TAB 7: Digital Twin & Inverse RL */}
        {activeTab === 'clone' && (
          <div className="analytics-tab-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '18px', fontWeight: 800 }}>
                  🧬 Jumeau numérique cognitif et inverse RL
                </h3>
                <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '13px' }}>
                  Distillation de vos traces d'action en un agent autonome reflétant votre style décisionnel et vos préférences latentes.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => synthesizeClone()}
                  style={{
                    background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 14px',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
                  }}
                >
                  🧬 Distiller mon Jumeau
                </button>
                <button
                  onClick={() => simulateCloneRollout(6)}
                  style={{
                    background: 'rgba(56, 189, 248, 0.15)',
                    color: '#38bdf8',
                    border: '1px solid #38bdf8',
                    borderRadius: '8px',
                    padding: '8px 14px',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  🚀 Lancer Rollout IA
                </button>
              </div>
            </div>

            {!cognitiveClone ? (
              <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px dashed rgba(255, 255, 255, 0.2)', borderRadius: '12px', padding: '32px', textAlign: 'center' }}>
                <div style={{ fontSize: '36px', marginBottom: '10px' }}>🧬</div>
                <h4 style={{ color: '#ffffff', margin: '0 0 6px', fontSize: '16px' }}>Aucun Jumeau Numérique synthétisé</h4>
                <p style={{ color: '#94a3b8', fontSize: '13px', maxWidth: '480px', margin: '0 auto 16px' }}>
                  WorldPilot peut analyser vos temps de réaction, votre tolérance au risque et vos séquences de manipulation pour cloner votre comportement sous forme de modèle de politique.
                </p>
                <button
                  onClick={() => synthesizeClone()}
                  style={{
                    background: '#8b5cf6',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 18px',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  ✨ Générer maintenant à partir de ma session
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Clone Profile Card */}
                <div
                  style={{
                    background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.8), rgba(15, 23, 42, 0.9))',
                    border: '1px solid rgba(139, 92, 246, 0.35)',
                    borderRadius: '14px',
                    padding: '20px',
                    boxShadow: '0 8px 32px rgba(139, 92, 246, 0.15)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                    <div>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(139, 92, 246, 0.2)', color: '#c084fc', border: '1px solid rgba(139, 92, 246, 0.4)', borderRadius: '20px', padding: '3px 10px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>
                        <span>🧬 CLONE DISTILLÉ</span>
                        <span>•</span>
                        <span>{cognitiveClone.dominantArchetype}</span>
                      </div>
                      <h4 style={{ margin: '8px 0 2px', color: '#ffffff', fontSize: '18px' }}>
                        {cognitiveClone.operatorName} <span style={{ fontSize: '12px', color: '#94a3b8' }}>({cognitiveClone.cloneId})</span>
                      </h4>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        Distillé le {new Date(cognitiveClone.synthesizedAt).toLocaleTimeString()} · {cognitiveClone.totalDecisionsDistilled} décisions analysées
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Fidélité Comportementale</div>
                      <div style={{ fontSize: '26px', fontWeight: 900, color: '#38bdf8' }}>{cognitiveClone.fidelityScore}%</div>
                    </div>
                  </div>

                  {/* Latent IRL Weights (Inverse RL) */}
                  <h5 style={{ margin: '0 0 10px', fontSize: '13px', color: '#cbd5e1', fontWeight: 700 }}>
                    🎯 Fonction de Récompense Implicite extraite (IRL Utility Weights)
                  </h5>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#cbd5e1', marginBottom: '4px' }}>
                        <span>⚡ Vitesse</span>
                        <strong style={{ color: '#38bdf8' }}>{cognitiveClone.latentWeights.speed}%</strong>
                      </div>
                      <div style={{ height: '5px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${cognitiveClone.latentWeights.speed}%`, height: '100%', background: '#38bdf8', borderRadius: '3px' }} />
                      </div>
                    </div>

                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#cbd5e1', marginBottom: '4px' }}>
                        <span>🎯 Précision</span>
                        <strong style={{ color: '#10b981' }}>{cognitiveClone.latentWeights.precision}%</strong>
                      </div>
                      <div style={{ height: '5px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${cognitiveClone.latentWeights.precision}%`, height: '100%', background: '#10b981', borderRadius: '3px' }} />
                      </div>
                    </div>

                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#cbd5e1', marginBottom: '4px' }}>
                        <span>🎨 Esthétique</span>
                        <strong style={{ color: '#ec4899' }}>{cognitiveClone.latentWeights.aesthetics}%</strong>
                      </div>
                      <div style={{ height: '5px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${cognitiveClone.latentWeights.aesthetics}%`, height: '100%', background: '#ec4899', borderRadius: '3px' }} />
                      </div>
                    </div>

                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#cbd5e1', marginBottom: '4px' }}>
                        <span>🔥 Risque</span>
                        <strong style={{ color: '#f59e0b' }}>{cognitiveClone.latentWeights.riskTolerance}%</strong>
                      </div>
                      <div style={{ height: '5px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${cognitiveClone.latentWeights.riskTolerance}%`, height: '100%', background: '#f59e0b', borderRadius: '3px' }} />
                      </div>
                    </div>

                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#cbd5e1', marginBottom: '4px' }}>
                        <span>👥 Teaming IA</span>
                        <strong style={{ color: '#a78bfa' }}>{cognitiveClone.latentWeights.collaboration}%</strong>
                      </div>
                      <div style={{ height: '5px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${cognitiveClone.latentWeights.collaboration}%`, height: '100%', background: '#a78bfa', borderRadius: '3px' }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rollout Result & Comparison */}
                {cloneRolloutResult && cloneComparison && (
                  <div
                    style={{
                      background: 'rgba(15, 23, 42, 0.75)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      borderRadius: '14px',
                      padding: '18px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ fontWeight: 700, color: '#38bdf8', fontSize: '14px' }}>
                        📊 Trajectoire Autonome simulée ({cloneRolloutResult.rolloutId})
                      </div>
                      <div style={{ display: 'flex', gap: '12px', fontSize: '12px' }}>
                        <span style={{ color: '#94a3b8' }}>Divergence KL : <strong style={{ color: '#ffffff' }}>{cloneRolloutResult.klDivergence}</strong></span>
                        <span style={{ color: '#94a3b8' }}>Alignement : <strong style={{ color: '#10b981' }}>{cloneRolloutResult.alignmentScore}%</strong></span>
                        <span style={{ color: '#94a3b8' }}>Score Plat : <strong style={{ color: '#f59e0b' }}>{cloneRolloutResult.finalScore}/100</strong></span>
                      </div>
                    </div>

                    <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '10px 14px', borderRadius: '8px', fontSize: '12px', color: '#cbd5e1', marginBottom: '14px' }}>
                      💡 <strong>Verdict :</strong> {cloneComparison.synthesisSummary}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {cloneRolloutResult.simulatedSteps.map(step => (
                        <div
                          key={step.stepIndex}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: 'rgba(255,255,255,0.03)',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '12px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: '#64748b' }}>#{step.stepIndex}</span>
                            <span style={{ color: '#f8fafc', fontWeight: 600 }}>{step.actionType}</span>
                            <span style={{ color: '#f59e0b', fontSize: '11px' }}>🌡️ {step.temperature}°C</span>
                          </div>
                          <span style={{ color: '#94a3b8', fontSize: '11px' }}>{step.simulatedLatencyMs}ms</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 8: Spatial Attention & 3D Gaze Scanpaths */}
        {activeTab === 'attention' && (
          <div className="analytics-tab-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '18px', fontWeight: 800 }}>
                  👁️ Attention spatiale 3D, fixations et scanpaths
                </h3>
                <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '13px' }}>
                  Télémétrie pré-décisionnelle : mesure des temps de fixation visuelle, analyse de dispersion et ruban de trajectoire 3D.
                </p>
              </div>

              <button
                onClick={() => toggleAttentionHeatmap()}
                style={{
                  background: spatialAttention.isHeatmapVisible ? '#ec4899' : 'rgba(236, 72, 153, 0.2)',
                  color: '#ffffff',
                  border: '1px solid #ec4899',
                  borderRadius: '8px',
                  padding: '8px 14px',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  boxShadow: spatialAttention.isHeatmapVisible ? '0 4px 16px rgba(236, 72, 153, 0.4)' : 'none'
                }}
              >
                {spatialAttention.isHeatmapVisible ? '👁️ Masquer Heatmap 3D' : '✨ Afficher Heatmap & Scanpath 3D'}
              </button>
            </div>

            {/* Attention KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '16px' }}>
              <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', padding: '12px' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Temps Total d'Attention</div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#38bdf8', marginTop: '2px' }}>
                  {Math.round(spatialAttention.totalGazeDwellTimeMs / 100) / 10}s
                </div>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', padding: '12px' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Entropie d'Attention</div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#10b981', marginTop: '2px' }}>
                  {spatialAttention.scanpath.attentionEntropy}
                </div>
                <div style={{ fontSize: '10px', color: '#64748b' }}>0 = focus pur, 1 = dispersion</div>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', padding: '12px' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Transitions de Regard</div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#f59e0b', marginTop: '2px' }}>
                  {spatialAttention.scanpath.totalTransitions}
                </div>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', padding: '12px' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Objets 3D Observés</div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#ec4899', marginTop: '2px' }}>
                  {Object.keys(spatialAttention.fixations).length}
                </div>
              </div>
            </div>

            {/* Fixations Leaderboard */}
            <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
              <h4 style={{ margin: '0 0 12px', fontSize: '14px', color: '#ffffff' }}>
                🎯 Classement des Fixations Visuelles par Entité
              </h4>

              {Object.keys(spatialAttention.fixations).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#64748b', fontSize: '13px' }}>
                  Sélectionnez ou survolez des objets dans la scène 3D pour commencer à enregistrer les fixations attentionnelles.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {Object.values(spatialAttention.fixations)
                    .sort((a, b) => b.durationMs - a.durationMs)
                    .map(fix => {
                      const share = Math.round((fix.durationMs / Math.max(1, spatialAttention.totalGazeDwellTimeMs)) * 100);
                      return (
                        <div
                          key={fix.entityId}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: 'rgba(255, 255, 255, 0.03)',
                            padding: '10px 14px',
                            borderRadius: '8px',
                            fontSize: '13px'
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 700, color: '#ffffff' }}>{fix.entityName}</div>
                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                              Fixations : {fix.fixationCount} · Latence pré-décision : {fix.preActionLatencyMs}ms · Effort pupillaire : {Math.round(fix.pupilDilationProxy * 100)}%
                            </div>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 700, color: '#ec4899' }}>{Math.round(fix.durationMs / 100) / 10}s</div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>{share}% du temps total</div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Scanpath Sequence */}
            {spatialAttention.scanpath.points.length > 0 && (
              <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', padding: '16px' }}>
                <h4 style={{ margin: '0 0 10px', fontSize: '14px', color: '#ffffff' }}>
                  🔗 Chronologie du Scanpath Oculaire (Transitions Visuelles)
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                  {spatialAttention.scanpath.points.slice(-12).map((pt, idx) => (
                    <React.Fragment key={idx}>
                      <span
                        style={{
                          background: 'rgba(56, 189, 248, 0.15)',
                          color: '#38bdf8',
                          border: '1px solid rgba(56, 189, 248, 0.3)',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 600
                        }}
                      >
                        {pt.entityId}
                      </span>
                      {idx < Math.min(12, spatialAttention.scanpath.points.length) - 1 && (
                        <span style={{ color: '#64748b', fontSize: '12px' }}>→</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
