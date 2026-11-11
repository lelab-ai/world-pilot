import React, { useState } from 'react';
import { useWorldStore, getCookingDonenessStage } from '../engine/store';
import { TaskStep } from '../core/types';
import { speakAgentDialogue } from '../engine/agentDialogues';
import { playAudioFx } from '../engine/evaluator';

export const QuestHUD: React.FC = () => {
  const quests = useWorldStore(s => s.world.ir.quests);
  const activeQuestId = useWorldStore(s => s.world.ir.activeQuestId);
  const resetQuest = useWorldStore(s => s.resetQuest);
  const entities = useWorldStore(s => s.world.ir.entities);
  const selectedEntityId = useWorldStore(s => s.spatialContext.selectedEntityId);
  const setSpatialContext = useWorldStore(s => s.setSpatialContext);
  const cookingHeatLevel = useWorldStore(s => s.cookingHeatLevel);
  const cycleCookingHeatLevel = useWorldStore(s => s.cycleCookingHeatLevel);
  const cookingDoneness = useWorldStore(s => s.cookingDoneness);
  const cookingTimerRemaining = useWorldStore(s => s.cookingTimerRemaining);
  const isCookingTimerRunning = useWorldStore(s => s.isCookingTimerRunning);
  const startCookingTimer = useWorldStore(s => s.startCookingTimer);
  const stopCookingTimer = useWorldStore(s => s.stopCookingTimer);
  const setCameraPreset = useWorldStore(s => s.setCameraPreset);
  const isDishPlated = useWorldStore(s => s.isDishPlated);
  const openDegustationModal = useWorldStore(s => s.openDegustationModal);
  const seasoningProfile = useWorldStore(s => s.seasoningProfile);
  const addSeasoning = useWorldStore(s => s.addSeasoning);
  const getDishEvaluation = useWorldStore(s => s.getDishEvaluation);
  const choppingProgress = useWorldStore(s => s.choppingProgress);
  const chopIngredient = useWorldStore(s => s.chopIngredient);
  const setIsDishPlated = useWorldStore(s => s.setIsDishPlated);
  const cookingTemperature = useWorldStore(s => s.cookingTemperature);
  const platingStyle = useWorldStore(s => s.platingStyle);
  const cyclePlatingStyle = useWorldStore(s => s.cyclePlatingStyle);
  const platingGarnish = useWorldStore(s => s.platingGarnish);
  const cyclePlatingGarnish = useWorldStore(s => s.cyclePlatingGarnish);
  const isDishSauced = useWorldStore(s => s.isDishSauced);
  const toggleSauceDish = useWorldStore(s => s.toggleSauceDish);
  const triggerTasting = useWorldStore(s => s.triggerTasting);
  const collaborationNotes = useWorldStore(s => s.collaborationNotes);
  const setShowCollaborationBoardModal = useWorldStore(s => s.setShowCollaborationBoardModal);
  const appMode = useWorldStore(s => s.appMode);
  const showResearchDashboardModal = useWorldStore(s => s.showResearchDashboardModal);
  const uiLanguage = useWorldStore(s => s.uiLanguage);
  const isFr = uiLanguage === 'fr';
  const [isMinimized, setIsMinimized] = useState(false);
  const [hudOffset, setHudOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isHudDragging, setIsHudDragging] = useState(false);

  const handleHudPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button, input, a, select, textarea, [data-no-drag]')) return;
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const initialOffsetX = hudOffset.x;
    const initialOffsetY = hudOffset.y;
    setIsHudDragging(true);

    const onMove = (moveEvt: PointerEvent) => {
      const dx = moveEvt.clientX - startX;
      const dy = moveEvt.clientY - startY;
      setHudOffset({
        x: initialOffsetX + dx,
        y: initialOffsetY + dy,
      });
    };

    const onUp = () => {
      setIsHudDragging(false);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  };

  const activeAnomalies = useWorldStore(s => s.activeAnomalies);
  const injectAnomaly = useWorldStore(s => s.injectAnomaly);
  const resolveAnomaly = useWorldStore(s => s.resolveAnomaly);
  const getCognitiveLoad = useWorldStore(s => s.getCognitiveLoad);
  const coWorker = useWorldStore(s => s.coWorker);
  const isCoWorkerActive = useWorldStore(s => s.isCoWorkerActive);
  const delegateCoWorkerTask = useWorldStore(s => s.delegateCoWorkerTask);
  const isHeatmapVisible = useWorldStore(s => s.spatialAttention.isHeatmapVisible);
  const toggleAttentionHeatmap = useWorldStore(s => s.toggleAttentionHeatmap);

  const currentQuestId = activeQuestId === null ? null : (activeQuestId || (quests ? Object.keys(quests)[0] : ''));
  const quest = quests && currentQuestId ? quests[currentQuestId] : null;

  const totalSteps = quest ? quest.steps.length : 0;
  const completedSteps = quest ? quest.steps.filter(s => s.completed).length : 0;
  const progressPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
  const isCompleted = quest ? (quest.status === 'completed' || completedSteps === totalSteps) : false;

  const cookingIngredients = React.useMemo(() => {
    if (!quest || quest.category !== 'cuisine') return [];

    const cocotte = Object.values(entities).find(e => 
      e.visuals?.assetId?.includes('cocotte') || e.name?.toLowerCase().includes('cocotte')
    );
    const poele = Object.values(entities).find(e => 
      e.visuals?.assetId?.includes('poele') || e.name?.toLowerCase().includes('poele')
    );
    const board = Object.values(entities).find(e => 
      e.visuals?.assetId?.includes('planche') || e.name?.toLowerCase().includes('planche')
    );
    const toXZ = (v: any): { x: number; z: number } | undefined => {
      if (!v) return undefined;
      if (Array.isArray(v) && v.length >= 3) return { x: Number(v[0]) || 0, z: Number(v[2]) || 0 };
      if (typeof v === 'object') return { x: Number(v.x) || 0, z: Number(v.z) || 0 };
      return undefined;
    };
    const cocottePos = toXZ(cocotte?.capabilities.find(c => c.type === 'transform')?.position);
    const poelePos = toXZ(poele?.capabilities.find(c => c.type === 'transform')?.position);
    const boardPos = toXZ(board?.capabilities.find(c => c.type === 'transform')?.position);

    return Object.values(entities).filter(e => {
      const nameLow = (e.name || '').toLowerCase();
      const assetLow = (e.visuals?.assetId || '').toLowerCase();
      return assetLow.includes('tomate') || assetLow.includes('courgette') || assetLow.includes('oignon') ||
        assetLow.includes('ail') || assetLow.includes('carotte') || assetLow.includes('vin') ||
        assetLow.includes('beurre') || assetLow.includes('echalote') || assetLow.includes('bouquet') ||
        nameLow.includes('tomate') || nameLow.includes('courgette') || nameLow.includes('oignon') ||
        nameLow.includes('ail') || nameLow.includes('carotte') || nameLow.includes('vin') ||
        nameLow.includes('beurre') || nameLow.includes('légume') || nameLow.includes('viande');
    }).map(e => {
      const pos = toXZ(e.capabilities.find(c => c.type === 'transform')?.position);
      let loc: 'board' | 'pot' | 'table' = 'table';
      if (pos) {
        if (cocottePos && Math.hypot(pos.x - cocottePos.x, pos.z - cocottePos.z) < 0.38) {
          loc = 'pot';
        } else if (poelePos && Math.hypot(pos.x - poelePos.x, pos.z - poelePos.z) < 0.38) {
          loc = 'pot';
        } else if (boardPos && Math.hypot(pos.x - boardPos.x, pos.z - boardPos.z) < 0.38) {
          loc = 'board';
        }
      }
      const nameLow = (e.name || '').toLowerCase();
      let icon = '🥗';
      if (nameLow.includes('tomate')) icon = '🍅';
      else if (nameLow.includes('courgette')) icon = '🥒';
      else if (nameLow.includes('oignon')) icon = '🧅';
      else if (nameLow.includes('ail')) icon = '🧄';
      else if (nameLow.includes('carotte')) icon = '🥕';
      else if (nameLow.includes('vin')) icon = '🍷';
      else if (nameLow.includes('beurre')) icon = '🧈';

      return {
        id: e.id,
        name: e.name,
        icon,
        location: loc
      };
    });
  }, [entities, quest?.category]);

  React.useEffect(() => {
    if (isCompleted) {
      const prevAtmosphere = useWorldStore.getState().currentAtmosphere;
      if (prevAtmosphere !== 'celebration') {
        useWorldStore.setState({ currentAtmosphere: 'celebration' });
        const timer = setTimeout(() => {
          useWorldStore.setState({ currentAtmosphere: prevAtmosphere });
        }, 7500);
        return () => clearTimeout(timer);
      }
    }
  }, [isCompleted]);

  if (!quest) return null;

  const getCategoryBadge = (cat?: string) => {
    switch (cat) {
      case 'nature':
      case 'botanique':
      case 'mycologie': return { icon: '🌲', label: isFr ? 'Exploration naturelle' : 'Nature Exploration', color: '#15803d' };
      case 'mecanique':
      case 'automobile': return { icon: '🔧', label: isFr ? 'Atelier mécanique' : 'Mechanical Workshop', color: '#ea580c' };
      case 'science':
      case 'chimie':
      case 'physique': return { icon: '⚗️', label: isFr ? 'Laboratoire scientifique' : 'Scientific Lab', color: '#0284c7' };
      case 'cuisine': return { icon: '🍳', label: isFr ? 'Atelier culinaire' : 'Culinary Workshop', color: '#f59e0b' };
      case 'luxury':
      case 'maroquinerie': return { icon: '💎', label: isFr ? 'Haute maroquinerie' : 'Leather Goods', color: '#d97706' };
      case 'formation': return { icon: '🛠️', label: isFr ? 'Procédure technique' : 'Technical Procedure', color: '#06b6d4' };
      case 'fle': return { icon: '🥖', label: isFr ? 'Immersion FLE' : 'French Immersion (FLE)', color: '#a855f7' };
      case 'seminaire': return { icon: '🏛️', label: isFr ? 'Espace réunion' : 'Meeting Space', color: '#3b82f6' };
      default: return { icon: '🎯', label: isFr ? 'Expérience guidée' : 'Guided Experience', color: '#10b981' };
    }
  };

  const badge = getCategoryBadge(quest?.category);

  const getLocalizedQuestTitle = (q: any) => {
    if (!q) return '';
    if (!isFr && q.titleEn) return q.titleEn;
    if (isFr) return q.title;
    const t = q.title || '';
    if (t.includes('Remplacement de Batterie Automobile')) return 'Procedure: 12V Car Battery Replacement';
    if (t.includes('Maintenance de la Batterie B-17')) return 'Procedure: B-17 Battery Maintenance';
    if (t.includes('Maroquinerie d’Excellence') || t.includes('Louis Vuitton')) return 'VIP Visit: Louis Vuitton Leather Goods';
    if (t.includes('Cookies aux Pépites')) return 'Pastry Workshop: Chocolate Chip Cookies';
    if (t.includes('Montage du Meuble')) return 'Assembly: IKEA Smart Furniture';
    if (t.includes('GameDev Level Studio')) return 'GameDev Level Studio: 3D Platformer';
    if (t.includes('Penthouse') || t.includes('Galerie')) return 'Victoria Penthouse: Digital Art Gallery';
    if (t.includes('Coupole Orbitale') || t.includes('Gravité Zéro')) return 'Zero-G Orbital Cupola Experience';
    if (t.includes('Web Spatial 3D')) return 'Spatial Web 3D Showcase';
    if (t.includes('Sac Mindel')) return 'Mindel Bag: Volume & Capacity';
    if (t.includes('Ébullition') || t.includes('Ballon de Chimie')) return 'Chemistry: Boiling Flask Experiment';
    if (t.includes('Loi d’Ohm') || t.includes('Physique')) return "Physics Lab: Ohm's Law";
    if (t.includes('Espresso') || t.includes('Barista')) return 'Barista Masterclass: Authentic Espresso';
    if (t.includes('Showroom Supercar')) return 'Supercar Showroom Experience';
    if (t.startsWith('Procédure :')) return t.replace('Procédure :', 'Procedure:');
    return t;
  };

  const getLocalizedStepTitle = (step: any) => {
    if (!isFr && step.titleEn) return step.titleEn;
    if (isFr) return step.title;
    const st = step.title || '';
    if (st.includes('Inspecter la nouvelle batterie') || st.includes('Inspecter la batterie')) return 'Inspect the new 12V battery';
    if (st.includes('Installer la batterie dans le compartiment')) return 'Install the battery in the engine compartment';
    if (st.includes('Examiner le sac iconique Monogram')) return 'Examine the iconic Monogram bag';
    if (st.includes('Examiner le sac Capucines')) return 'Examine the Capucines Taurillon bag';
    if (st.includes('Présenter le sac sur le podium')) return 'Present the bag on the VIP podium';
    if (st.includes('Émincer les légumes')) return 'Chop vegetables on the board';
    if (st.includes('Mijoter')) return 'Simmer in the cocotte';
    if (st.includes('Dresser')) return 'Plate the preparation';
    return st;
  };

  const getLocalizedStepDesc = (step: any) => {
    if (!isFr && step.descriptionEn) return step.descriptionEn;
    if (isFr) return step.description || '';
    const sd = step.description || '';
    if (sd.includes('Cliquez sur la batterie neuve sur l’établi pour mesurer sa tension')) return 'Click on the new battery on the workbench to measure its resting voltage (12.6V).';
    if (sd.includes('Glissez et déposez la batterie dans le bac récepteur')) return 'Drag and drop the battery into the engine bay receiver tray.';
    if (sd.includes('Cliquez sur le sac Monogram')) return 'Click on the Monogram bag to inspect the canvas, grain, and golden hardware.';
    if (sd.includes('Cliquez sur le sac Capucines')) return 'Click on the Capucines bag to inspect the LV jewel clasp and full-grain leather.';
    if (sd.includes('Glissez le sac Monogram vers le podium')) return 'Drag the Monogram bag to the central inspection podium to generate the certificate.';
    return sd;
  };

  const getLocalizedStepHint = (step: any) => {
    if (!isFr && step.hintEn) return step.hintEn;
    if (isFr) return step.hint || '';
    const sh = step.hint || '';
    if (sh.includes('Cliquez sur la batterie 12V')) return 'Click on the 12V battery.';
    if (sh.includes('Glissez la batterie jusqu’au bac')) return 'Drag the battery into the engine tray.';
    if (sh.includes('Cliquez sur le sac Monogram')) return 'Click on the Monogram bag.';
    if (sh.includes('Cliquez sur le sac Capucines')) return 'Click on the Capucines bag.';
    if (sh.includes('Déposez le sac sur le podium')) return 'Place the bag on the central podium.';
    return sh;
  };

  return (
    <div 
      className={`quest-hud-container ${isMinimized ? 'minimized' : ''}`}
      style={{
        transform: `translate(${hudOffset.x}px, ${hudOffset.y}px)`,
        transition: isHudDragging ? 'none' : 'box-shadow 0.2s ease, width 0.25s ease',
        cursor: isHudDragging ? 'grabbing' : 'auto',
      }}
      onPointerDown={isMinimized ? handleHudPointerDown : undefined}
    >
      {/* HUD Header */}
      <div 
        className="quest-hud-header"
        onPointerDown={handleHudPointerDown}
        style={{ cursor: isHudDragging ? 'grabbing' : 'grab', userSelect: 'none' }}
        title={isFr ? "Glisser pour déplacer le panneau (double-clic pour réinitialiser)" : "Drag to reposition panel (double-click to reset)"}
        onDoubleClick={() => setHudOffset({ x: 0, y: 0 })}
      >
        <div className="quest-hud-title-area">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ cursor: isHudDragging ? 'grabbing' : 'grab', opacity: 0.6, fontSize: '13px', lineHeight: 1 }} title={isFr ? "Déplacer" : "Move"}>⠿</span>
            <div className="quest-hud-badge" style={{ borderColor: badge.color, color: badge.color }}>
              <span>{badge.icon}</span>
              <span>{badge.label}</span>
            </div>
          </div>
          <h4 className="quest-hud-title" title={quest ? getLocalizedQuestTitle(quest) : ''}>
            {quest ? getLocalizedQuestTitle(quest) : ''}
          </h4>
        </div>
        <div className="quest-hud-controls">
          {(hudOffset.x !== 0 || hudOffset.y !== 0) && (
            <button
              className="quest-hud-btn"
              onClick={() => setHudOffset({ x: 0, y: 0 })}
              title={isFr ? "Réinitialiser la position du panneau" : "Reset panel position"}
            >
              ↺
            </button>
          )}
          {quest?.category === 'cuisine' && (
            <button
              className="quest-hud-btn"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('worldpilot_open_cooking_modal'));
                }
              }}
              title={isFr ? "Changer de recette culinaire [Alt+R]" : "Change culinary recipe [Alt+R]"}
            >
              📖
            </button>
          )}
          {quest?.category === 'seminaire' && (
            <button
              className="quest-hud-btn"
              onClick={() => {
                useWorldStore.getState().setShowCollaborationBoardModal(true);
              }}
              title={isFr ? "Tableau de post-its & idéation collaborative" : "Ideation board & sticky notes"}
            >
              📋
            </button>
          )}
          <button
            className="quest-hud-btn"
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? (isFr ? "Déplier les objectifs" : "Expand objectives") : (isFr ? "Minimiser le panneau" : "Minimize panel")}
            aria-label={isMinimized ? (isFr ? "Déplier les objectifs" : "Expand objectives") : (isFr ? "Minimiser le panneau" : "Minimize panel")}
          >
            {isMinimized ? '▲' : '▼'}
          </button>
          <button
            className="quest-hud-btn"
            onClick={() => {
              useWorldStore.getState().stopActiveQuest();
              playAudioFx('tink');
            }}
            title={isFr ? "Arrêter et quitter la mission" : "Stop and exit quest"}
            aria-label={isFr ? "Arrêter la mission" : "Stop quest"}
            style={{ fontSize: '12px', lineHeight: 1 }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="quest-hud-progress-wrap">
        <div className="quest-hud-progress-bar">
          <div
            className={`quest-hud-progress-fill ${isCompleted ? 'completed' : ''}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="quest-hud-progress-text">
          <span>{isCompleted ? (isFr ? '🎉 Objectifs atteints !' : '🎉 Objectives achieved!') : (isFr ? `Étape ${Math.min(quest.currentStepIndex + 1, totalSteps)} sur ${totalSteps}` : `Step ${Math.min(quest.currentStepIndex + 1, totalSteps)} of ${totalSteps}`)}</span>
          <span>{progressPercent}%</span>
        </div>
      </div>

      {/* Active Anomalies Emergency Cards */}
      {!isMinimized && activeAnomalies.some(a => a.status === 'pending') && (
        <div className="quest-hud-anomalies-list">
          {activeAnomalies.filter(a => a.status === 'pending').map(anom => (
            <div key={anom.id} className={`hud-anomaly-card ${anom.severity}`}>
              <div className="anomaly-card-top">
                <span className="anomaly-title">{anom.title}</span>
                <span className="anomaly-timer">⏱️ {Math.ceil(anom.timeRemainingSec)}s</span>
              </div>
              <p className="anomaly-desc">{anom.description}</p>
              <div className="anomaly-action-row">
                <span className="anomaly-action-hint">🎯 {anom.suggestedAction}</span>
                <button
                  className="anomaly-resolve-btn"
                  onClick={() => resolveAnomaly(anom.id)}
                  title={isFr ? "Valider la résolution d'urgence" : "Validate emergency resolution"}
                >
                  ✓ {isFr ? 'Résoudre' : 'Resolve'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cognitive Load & Stress Testing Bar (réservé au mode Observatoire ou cockpit de recherche) */}
      {!isMinimized && (appMode === 'observatoire' || showResearchDashboardModal) && (
        <div className="quest-hud-cli-bar">
          {(() => {
            const cli = getCognitiveLoad();
            return (
              <>
                <div className="cli-status-indicator" style={{ borderLeftColor: cli.color }}>
                  <span className="cli-label">🧠 {isFr ? 'Charge Cognitive :' : 'Cognitive Load:'}</span>
                  <b style={{ color: cli.color }}>{cli.index}%</b>
                  <span className="cli-badge" style={{ color: cli.color, backgroundColor: `${cli.color}25` }}>
                    {cli.level === 'calm' ? (isFr ? '🟢 Fluide' : '🟢 Fluid') : cli.level === 'alert' ? (isFr ? '🟡 Soutenue' : '🟡 Moderate') : (isFr ? '🔴 Crise' : '🔴 Critical')}
                  </span>
                </div>
                {quest.category === 'cuisine' && (
                  <div className="hud-stress-test-triggers">
                    <span className="stress-test-label">⚡ {isFr ? 'Stress-Test :' : 'Stress-Test:'}</span>
                    <button
                      className="stress-btn flare"
                      onClick={() => injectAnomaly('thermal_flare')}
                      title={isFr ? "Déclencher un coup de feu thermique d'urgence (210°C)" : "Trigger emergency thermal flare (210°C)"}
                    >
                      🔥 {isFr ? 'Coup de feu' : 'Flare'}
                    </button>
                    <button
                      className="stress-btn salt"
                      onClick={() => injectAnomaly('seasoning_imbalance')}
                      title={isFr ? "Déclencher un excès de sel imprévu" : "Trigger accidental salt excess"}
                    >
                      🧂 {isFr ? 'Sel max' : 'Max Salt'}
                    </button>
                    <button
                      className="stress-btn crunch"
                      onClick={() => injectAnomaly('time_crunch')}
                      title={isFr ? "Accélérer le chronomètre (Arrivée de l'inspecteur)" : "Accelerate timer (Inspector arrival)"}
                    >
                      ⏱️ Sprint
                    </button>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* Embodied Co-Worker Quick Teaming Bar */}
      {!isMinimized && isCoWorkerActive && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '8px',
          padding: '6px 10px',
          margin: '8px 12px',
          fontSize: '11px',
          color: '#ffffff'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '14px' }}>👥</span>
            <span>
              <strong>{coWorker.name}</strong>{' '}
              <span style={{ opacity: 0.8, color: '#34d399' }}>
                ({coWorker.status === 'working' ? (isFr ? `Travail en cours · ${coWorker.progress}%` : `In progress · ${coWorker.progress}%`) : coWorker.status === 'walking' ? (isFr ? 'En déplacement...' : 'Moving...') : (isFr ? 'Prêt(e)' : 'Ready')})
              </span>
            </span>
          </div>

          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={() => delegateCoWorkerTask('chop_vegetables')}
              style={{
                background: 'rgba(16, 185, 129, 0.25)',
                border: '1px solid rgba(16, 185, 129, 0.5)',
                color: '#34d399',
                borderRadius: '5px',
                padding: '3px 7px',
                fontSize: '10.5px',
                cursor: 'pointer',
                fontWeight: 600
              }}
              title={isFr ? "Déléguer la découpe des légumes sur la planche" : "Delegate vegetable chopping on board"}
            >
              🔪 {isFr ? 'Découper' : 'Chop'}
            </button>
            <button
              onClick={() => delegateCoWorkerTask('monitor_heat')}
              style={{
                background: 'rgba(245, 158, 11, 0.25)',
                border: '1px solid rgba(245, 158, 11, 0.5)',
                color: '#fbbf24',
                borderRadius: '5px',
                padding: '3px 7px',
                fontSize: '10.5px',
                cursor: 'pointer',
                fontWeight: 600
              }}
              title={isFr ? "Déléguer la surveillance thermique de la cocotte" : "Delegate heat monitoring"}
            >
              🔥 {isFr ? 'Surveiller' : 'Monitor'}
            </button>
            <button
              onClick={() => toggleAttentionHeatmap()}
              style={{
                background: isHeatmapVisible ? 'rgba(236, 72, 153, 0.4)' : 'rgba(236, 72, 153, 0.2)',
                border: '1px solid rgba(236, 72, 153, 0.5)',
                color: '#f472b6',
                borderRadius: '5px',
                padding: '3px 7px',
                fontSize: '10.5px',
                cursor: 'pointer',
                fontWeight: 600
              }}
              title={isFr ? "Afficher/Masquer la heatmap d'attention spatiale et le scanpath 3D" : "Toggle spatial attention heatmap and 3D scanpath"}
            >
              👁️ Heatmap
            </button>
          </div>
        </div>
      )}

      {/* Seminar Collaboration Board Quick Banner */}
      {!isMinimized && quest.category === 'seminaire' && (
        <div className="quest-hud-seminar-banner">
          <div className="quest-hud-seminar-info">
            <span className="quest-hud-seminar-icon">💡</span>
            <div className="quest-hud-seminar-text">
              <span className="quest-hud-seminar-title">{isFr ? "Tableau d'Idéation & Post-it" : "Ideation & Sticky Note Board"}</span>
              <span className="quest-hud-seminar-sub">{isFr ? "Brainstorming, vote et priorisation d'équipe" : "Team brainstorming, voting & prioritization"}</span>
            </div>
          </div>
          <button
            className="quest-hud-seminar-open-btn"
            onClick={() => useWorldStore.getState().setShowCollaborationBoardModal(true)}
            title={isFr ? "Ouvrir le tableau de post-its collaboratifs" : "Open collaborative sticky note board"}
          >
            📋 {isFr ? 'Ouvrir' : 'Open'}
          </button>
        </div>
      )}

      {/* Mise en Place Ingredient Tracker (Culinary Mode) */}
      {!isMinimized && cookingIngredients.length > 0 && (
        <div className="quest-hud-mep-container">
          <div className="quest-hud-mep-header">
            <span>🥗 {isFr ? 'Ingrédients & Atelier Culinaire' : 'Ingredients & Culinary Workshop'}</span>
            <span className="quest-hud-mep-count">
              {cookingIngredients.filter(i => i.location !== 'table').length} / {cookingIngredients.length} {isFr ? 'placés' : 'placed'}
            </span>
          </div>

          {/* Quick Cooking Action Row: uncluttered and clearly cliquable */}
          <div className="quest-hud-kitchen-actions-row">
            <button
              className="quest-hud-chef-advice-btn"
              onClick={() => {
                useWorldStore.getState().askChefAdvice();
              }}
              title={isFr ? "Consulter le conseil du Chef Auguste Escoffier" : "Consult Chef Auguste Escoffier's advice"}
            >
              👨‍🍳 {isFr ? 'Conseil' : 'Advice'}
            </button>
            <button
              className="quest-hud-quick-stir-btn"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('worldpilot_stir_cookware'));
                }
              }}
              title={isFr ? "Remuer vigoureusement la cocotte ou la poêle" : "Stir cocotte or pan vigorously"}
            >
              🌀 {isFr ? 'Remuer' : 'Stir'}
            </button>
            <button
              className={`quest-hud-quick-heat-btn heat-${cookingHeatLevel}`}
              onClick={() => {
                const next = cycleCookingHeatLevel();
                playAudioFx(next === 0 ? 'game_over' : next === 3 ? 'sizzle' : 'bubbles');
                if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                  try {
                    const patterns: number[][] = [[40], [30], [25, 30, 25], [30, 25, 30, 25, 30]];
                    navigator.vibrate(patterns[next] || [30]);
                  } catch (_) {}
                }
                const labels = isFr
                  ? ['Éteint (0°C)', 'Feu Doux (85°C)', 'Feu Moyen (100°C)', 'Feu Vif (180°C)']
                  : ['Off (0°C)', 'Low Heat (85°C)', 'Medium Heat (100°C)', 'High Heat (180°C)'];
                useWorldStore.setState(s => ({
                  warnings: [...s.warnings, `🔥 ${isFr ? 'Allure de chauffe :' : 'Heat level:'} ${labels[next]}`]
                }));
              }}
              title={isFr ? `Allure du feu de cuisson : ${['Éteint (0°C)', 'Feu Doux (85°C)', 'Feu Moyen (100°C)', 'Feu Vif (180°C)'][cookingHeatLevel]}. Cliquer pour changer.` : `Cooking heat: ${['Off (0°C)', 'Low Heat (85°C)', 'Medium Heat (100°C)', 'High Heat (180°C)'][cookingHeatLevel]}. Click to cycle.`}
            >
              {cookingHeatLevel === 0 && (isFr ? '⚪ Feu Off' : '⚪ Off')}
              {cookingHeatLevel === 1 && (isFr ? '🟡 Feu Doux' : '🟡 Low Heat')}
              {cookingHeatLevel === 2 && (isFr ? '🟠 Feu Moyen' : '🟠 Medium')}
              {cookingHeatLevel === 3 && (isFr ? '🔥 Feu Vif' : '🔥 High Heat')}
            </button>
            <button
              className={`quest-hud-quick-timer-btn ${isCookingTimerRunning ? 'active' : ''}`}
              onClick={() => {
                if (isCookingTimerRunning) {
                  stopCookingTimer();
                  playAudioFx('tink');
                } else {
                  startCookingTimer(cookingTimerRemaining && cookingTimerRemaining > 0 ? cookingTimerRemaining : 180);
                  playAudioFx('tink');
                }
              }}
              title={isCookingTimerRunning ? (isFr ? "Mettre en pause le minuteur de cuisson" : "Pause cooking timer") : (isFr ? "Lancer le minuteur de cuisine (3 min)" : "Start cooking timer (3 min)")}
            >
              ⏱️ {isCookingTimerRunning && cookingTimerRemaining !== null ? `${Math.floor(cookingTimerRemaining / 60)}:${Math.floor(cookingTimerRemaining % 60).toString().padStart(2, '0')}` : (isFr ? 'Minuteur' : 'Timer')}
            </button>
            {cookingDoneness > 0 && (
              <div
                className="quest-hud-doneness-badge"
                title={`${isFr ? 'Progression de cuisson :' : 'Cooking progression:'} ${Math.round(cookingDoneness)}% (${getCookingDonenessStage(cookingDoneness).label})`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  fontSize: '9.5px',
                  fontWeight: 700,
                  padding: '3px 6px',
                  borderRadius: '5px',
                  background: `${getCookingDonenessStage(cookingDoneness).color}22`,
                  border: `1px solid ${getCookingDonenessStage(cookingDoneness).color}66`,
                  color: getCookingDonenessStage(cookingDoneness).color
                }}
              >
                <span>{getCookingDonenessStage(cookingDoneness).icon}</span>
                <span>{Math.round(cookingDoneness)}%</span>
              </div>
            )}
            <button
              className="quest-hud-quick-tasting-btn"
              onClick={() => {
                openDegustationModal();
                playAudioFx('chime');
              }}
              title={isFr ? `Ouvrir la carte de dégustation (${getDishEvaluation().totalScore}/100 pts · ${getDishEvaluation().stars} étoiles)` : `Open tasting card (${getDishEvaluation().totalScore}/100 pts · ${getDishEvaluation().stars} stars)`}
            >
              🍷 {getDishEvaluation().stars}★
            </button>
          </div>
          {cookingDoneness > 0 && (
            <div style={{ padding: '0 12px 6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${cookingDoneness}%`,
                  background: getCookingDonenessStage(cookingDoneness).color,
                  boxShadow: `0 0 8px ${getCookingDonenessStage(cookingDoneness).color}`,
                  transition: 'width 0.4s ease'
                }} />
              </div>
              <span style={{ fontSize: '9px', fontWeight: 600, color: getCookingDonenessStage(cookingDoneness).color }}>
                {getCookingDonenessStage(cookingDoneness).label}
              </span>
            </div>
          )}
          <div className="quest-hud-seasoning-row">
            <span className="quest-hud-seasoning-label">⚖️ {isFr ? 'Assaisonnement :' : 'Seasoning:'}</span>
            <div className="quest-hud-seasoning-chips">
              <button
                className={`seasoning-chip ${seasoningProfile.salt >= 20 ? 'seasoned' : ''}`}
                onClick={() => {
                  addSeasoning('salt', 25);
                  playAudioFx('sparkle');
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('worldpilot_pour_seasoning', { detail: { type: 'salt' } }));
                    window.dispatchEvent(new CustomEvent('worldpilot_seasoning_event', { detail: { type: 'salt', amount: 25 } }));
                  }
                }}
                title={isFr ? "Saupoudrer une pincée de fleur de sel (+25%)" : "Sprinkle a pinch of sea salt (+25%)"}
              >
                🧂 {isFr ? 'Sel' : 'Salt'} {seasoningProfile.salt}%
              </button>
              <button
                className={`seasoning-chip ${seasoningProfile.oil >= 20 ? 'seasoned' : ''}`}
                onClick={() => {
                  addSeasoning('oil', 25);
                  playAudioFx('pour_water');
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('worldpilot_pour_seasoning', { detail: { type: 'oil' } }));
                    window.dispatchEvent(new CustomEvent('worldpilot_seasoning_event', { detail: { type: 'oil', amount: 25 } }));
                  }
                }}
                title={isFr ? "Verser un filet d'huile d'olive (+25%)" : "Drizzle olive oil (+25%)"}
              >
                🫒 {isFr ? 'Huile' : 'Oil'} {seasoningProfile.oil}%
              </button>
              <button
                className={`seasoning-chip ${seasoningProfile.herbs >= 25 ? 'seasoned' : ''}`}
                onClick={() => {
                  addSeasoning('herbs', 35);
                  playAudioFx('chime');
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('worldpilot_pour_seasoning', { detail: { type: 'herbs' } }));
                    window.dispatchEvent(new CustomEvent('worldpilot_seasoning_event', { detail: { type: 'herbs', amount: 35 } }));
                  }
                }}
                title={isFr ? "Infuser le bouquet garni & aromates (+35%)" : "Infuse herbs & bouquet garni (+35%)"}
              >
                🌿 {isFr ? 'Herbes' : 'Herbs'} {seasoningProfile.herbs}%
              </button>
              <button
                className={`seasoning-chip ${Object.values(choppingProgress).reduce((a, b) => a + b, 0) >= 3 ? 'seasoned' : ''}`}
                onClick={() => {
                  chopIngredient();
                  playAudioFx('knife_chop');
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('worldpilot_chop_action', { detail: { timestamp: Date.now() } }));
                  }
                }}
                title={isFr ? "Émincer les légumes sur la planche (tronçons, dés, brunoise de chef)" : "Chop vegetables on board (sliced, diced, fine brunoise)"}
              >
                🔪 {isFr ? 'Découpe' : 'Cut'} {Object.values(choppingProgress).reduce((a, b) => a + b, 0) >= 6 ? (isFr ? 'Brunoise' : 'Brunoise') : Object.values(choppingProgress).reduce((a, b) => a + b, 0) >= 2 ? (isFr ? 'Émincé' : 'Sliced') : (isFr ? 'Brut' : 'Raw')}
              </button>
            </div>
          </div>
          <div className="quest-hud-mep-chips">
            {cookingIngredients.map(ing => {
              const isSelected = selectedEntityId === ing.id;
              return (
                <button
                  key={ing.id}
                  className={`quest-mep-chip loc-${ing.location} ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSpatialContext(ing.id, null)}
                  title={`${ing.name} : ${ing.location === 'pot' ? (isFr ? 'Dans la cocotte / poêle 🔥' : 'In the pot / pan 🔥') : ing.location === 'board' ? (isFr ? 'Sur la planche à découper 🔪' : 'On chopping board 🔪') : (isFr ? 'Sur le plan de travail ✋' : 'On the countertop ✋')}. ${isFr ? 'Cliquer pour cibler dans la vue 3D.' : 'Click to target in 3D view.'}`}
                >
                  <span className="mep-chip-icon">{ing.icon}</span>
                  <span className="mep-chip-name">{ing.name}</span>
                  <span className="mep-chip-badge">
                    {ing.location === 'pot' ? (isFr ? '🔥 Cocotte' : '🔥 Pot') : ing.location === 'board' ? (isFr ? '🔪 Planche' : '🔪 Board') : (isFr ? '✋ Comptoir' : '✋ Counter')}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Plating Atelier & Culinary Thermometer */}
          <div className="quest-hud-plating-atelier-bar">
            <div
              className="quest-hud-thermometer-badge"
              style={{
                borderColor: cookingTemperature >= 120 ? '#ef4444' : cookingTemperature >= 80 ? '#f97316' : cookingTemperature >= 40 ? '#facc15' : '#38bdf8',
                color: cookingTemperature >= 120 ? '#fca5a5' : cookingTemperature >= 80 ? '#fdba74' : cookingTemperature >= 40 ? '#fde047' : '#7dd3fc'
              }}
              title={`${isFr ? 'Thermomètre de cuisson :' : 'Cooking thermometer:'} ${Math.round(cookingTemperature)}°C (${cookingTemperature >= 140 ? (isFr ? 'Réaction de Maillard' : 'Maillard Reaction') : cookingTemperature >= 95 ? (isFr ? 'Ébullition' : 'Boiling') : cookingTemperature >= 65 ? (isFr ? 'Mijotage doux' : 'Gentle Simmer') : (isFr ? 'Température ambiante' : 'Room Temperature')})`}
            >
              <span>🌡️</span>
              <span className="thermo-val">{Math.round(cookingTemperature)}°C</span>
            </div>

            <button
              className="quest-hud-plating-action-btn"
              onClick={() => {
                if (!isDishPlated) {
                  setIsDishPlated(true);
                  playAudioFx('chime');
                } else {
                  cyclePlatingStyle();
                  playAudioFx('sparkle');
                }
              }}
              title={isDishPlated ? (isFr ? `Changer le style de dressage (actuel : ${platingStyle})` : `Cycle plating style (current: ${platingStyle})`) : (isFr ? "Dresser la préparation sur l'assiette de dégustation" : "Plate the preparation on tasting plate")}
            >
              🍽️ {!isDishPlated ? (isFr ? 'Dresser' : 'Plate') : platingStyle === 'classic-dome' ? (isFr ? 'Dôme' : 'Dome') : platingStyle === 'deconstructed-arc' ? (isFr ? 'Arc Moderne' : 'Modern Arc') : 'Tian'}
            </button>

            {isDishPlated && (
              <>
                <button
                  className="quest-hud-garnish-action-btn"
                  onClick={() => {
                    cyclePlatingGarnish();
                    playAudioFx('sparkle');
                  }}
                  title={isFr ? `Changer la garniture de finition (actuel : ${platingGarnish})` : `Cycle finishing garnish (current: ${platingGarnish})`}
                >
                  ✨ {platingGarnish === 'tuile-dentelle' ? (isFr ? 'Tuile' : 'Tuile') : platingGarnish === 'fleur-de-sel' ? (isFr ? 'Fleur Sel' : 'Sea Salt') : platingGarnish === 'micro-greens' ? (isFr ? 'Pousses' : 'Greens') : (isFr ? 'Truffe' : 'Truffle')}
                </button>

                <button
                  className={`quest-hud-sauce-action-btn ${isDishSauced ? 'sauced' : ''}`}
                  onClick={() => {
                    toggleSauceDish();
                    playAudioFx('pour_water');
                  }}
                  title={isDishSauced ? (isFr ? "Retirer le nappage de jus gastronomique" : "Remove gourmet jus drizzle") : (isFr ? "Napper l'assiette d'un cordon de jus réduit" : "Drizzle plate with reduced jus")}
                >
                  🫗 {isDishSauced ? (isFr ? 'Nappé' : 'Sauced') : (isFr ? 'Napper' : 'Sauce')}
                </button>

                <button
                  className="quest-hud-taste-action-btn"
                  onClick={() => {
                    triggerTasting('fork');
                    playAudioFx('chime');
                  }}
                  title={isFr ? "Activer la dégustation animée 3D à la fourchette" : "Trigger animated 3D fork tasting"}
                >
                  🍴 {isFr ? 'Déguster' : 'Taste'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Seminar Collaboration Board Banner */}
      {!isMinimized && (quest.category === 'seminaire' || (currentQuestId && currentQuestId.includes('seminar')) || quest.title.toLowerCase().includes('séminaire')) && (
        <div className="quest-seminar-collaboration-box">
          <div className="seminar-board-header">
            <span className="seminar-board-title">📋 {isFr ? 'Espace Collaboratif' : 'Collaborative Space'}</span>
            <span className="seminar-notes-count">{collaborationNotes.length} {isFr ? 'idées' : 'ideas'}</span>
          </div>
          <p className="seminar-board-desc">
            {isFr ? 'Organisez les brainstormings, votez pour les actions et partagez vos post-its en 3D.' : 'Organize brainstorms, vote on actions, and share 3D sticky notes.'}
          </p>
          <button
            className="quest-seminar-open-board-btn"
            onClick={(e) => {
              e.stopPropagation();
              setShowCollaborationBoardModal(true);
              playAudioFx('chime');
            }}
          >
            🚀 {isFr ? 'Tableau de Post-its & Kanban (N)' : 'Post-its & Kanban Board (N)'}
          </button>
        </div>
      )}

      {/* Step List */}
      {!isMinimized && (
        <div className="quest-hud-steps">
          {quest.steps.map((step: TaskStep, idx: number) => {
            const isStepCompleted = step.completed;
            const isCurrent = idx === quest.currentStepIndex && !isCompleted;
            const isUpcoming = idx > quest.currentStepIndex && !isCompleted;

            const colonParts = step.requiredEvent && step.requiredEvent.includes(':')
              ? step.requiredEvent.split(':').map(p => p.trim()).filter(Boolean)
              : null;
            const resolveEntityFuzzy = (refId: string | undefined): string | undefined => {
              if (!refId) return undefined;
              if (entities[refId]) return refId;
              const low = refId.toLowerCase();
              const found = Object.values(entities).find(e => {
                const eid = (e.id || '').toLowerCase();
                const ename = (e.name || '').toLowerCase();
                const easset = (e.visuals?.assetId || '').toLowerCase();
                if (eid.includes(low) || low.includes(eid) || ename.includes(low)) return true;
                if ((low.includes('configur') || low.includes('console') || low.includes('borne')) &&
                    (ename.includes('configur') || ename.includes('console') || ename.includes('holograph') || easset.includes('configur'))) {
                  return true;
                }
                if ((low.includes('auth') || low.includes('cockpit') || low.includes('dock') || low.includes('zone')) &&
                    (ename.includes('auth') || ename.includes('cockpit') || ename.includes('dock') || e.capabilities.some(c => c.type === 'trigger_zone'))) {
                  return true;
                }
                if ((low.includes('key') || low.includes('cle') || low.includes('clé')) &&
                    (ename.includes('clé') || ename.includes('cle') || eid.includes('key') || eid.includes('cle'))) {
                  return true;
                }
                return false;
              });
              return found?.id;
            };
            const isDropStep =
              step.requiredEvent === 'DROP' ||
              Boolean(colonParts && colonParts[0] === 'DROP');
            const resolvedTargetId = isDropStep && colonParts && colonParts.length >= 3
              ? (resolveEntityFuzzy(colonParts[1]) || resolveEntityFuzzy(step.targetEntityId))
              : (resolveEntityFuzzy(step.targetEntityId) || (colonParts && colonParts[1] ? resolveEntityFuzzy(colonParts[1]) : undefined));
            const resolvedDropZoneId = isDropStep
              ? (resolveEntityFuzzy(step.targetZoneId) || (colonParts && colonParts[2] ? resolveEntityFuzzy(colonParts[2]) : undefined) || Object.values(entities).find(e => e.capabilities.some(c => c.type === 'trigger_zone'))?.id)
              : undefined;
            const isInteractOrClickStep =
              step.requiredEvent === 'INTERACT' ||
              step.requiredEvent === 'CLICK' ||
              Boolean(colonParts && (colonParts[0] === 'INTERACT' || colonParts[0] === 'CLICK' || colonParts[0] === 'INSPECT'));

            const targetName = resolvedTargetId && entities[resolvedTargetId] 
              ? entities[resolvedTargetId].name 
              : null;
            const quizCap = resolvedTargetId && entities[resolvedTargetId]
              ? entities[resolvedTargetId].capabilities?.find((c: any) => c.type === 'educational' && c.correctAnswer)
              : null;
            const stepTitleLow = (step.title || '').toLowerCase();
            const stepDescLow = (step.description || '').toLowerCase();
            const targetNameLow = (targetName || '').toLowerCase();
            const isConfiguratorStep =
              stepTitleLow.includes('configur') ||
              stepTitleLow.includes('finition') ||
              stepTitleLow.includes('teinte') ||
              stepTitleLow.includes('couleur') ||
              stepDescLow.includes('configur') ||
              stepDescLow.includes('console holographique') ||
              stepDescLow.includes('teinte') ||
              targetNameLow.includes('configur') ||
              targetNameLow.includes('console holographique');

            return (
              <div
                key={step.id || idx}
                className={`quest-step-card ${isStepCompleted ? 'step-completed' : ''} ${isCurrent ? 'step-active' : ''} ${isUpcoming ? 'step-upcoming' : ''}`}
                onClick={() => {
                  if (resolvedTargetId) {
                    setSpatialContext(resolvedTargetId, null);
                  }
                  const lowTitle = (step.title || '').toLowerCase();
                  const lowDesc = (step.description || '').toLowerCase();
                  if (lowTitle.includes('cocotte') || lowTitle.includes('poele') || lowTitle.includes('mijoter') || lowTitle.includes('cuir') || lowDesc.includes('cocotte')) {
                    setCameraPreset('cocotte');
                    playAudioFx('tink');
                  } else if (lowTitle.includes('planche') || lowTitle.includes('couteau') || lowTitle.includes('emincer') || lowTitle.includes('couper') || lowDesc.includes('planche')) {
                    setCameraPreset('chopping');
                    playAudioFx('tink');
                  } else if (lowTitle.includes('assiette') || lowTitle.includes('dresser') || lowTitle.includes('service') || lowDesc.includes('assiette')) {
                    setCameraPreset('plate');
                    playAudioFx('tink');
                  } else if (resolvedTargetId && entities[resolvedTargetId]) {
                    useWorldStore.getState().focusEntity(resolvedTargetId);
                  } else {
                    setCameraPreset('table');
                    playAudioFx('tink');
                  }
                }}
                style={{ cursor: 'pointer' }}
                title={isFr ? "Cliquer pour cadrer la caméra et cibler l'objectif de cette étape" : "Click to frame camera and target this step objective"}
              >
                <div className="quest-step-marker">
                  {isStepCompleted ? '✓' : isCurrent ? '➔' : '○'}
                </div>
                <div className="quest-step-content">
                  <div className="quest-step-header-row">
                    <div className="quest-step-title">
                      {getLocalizedStepTitle(step)}
                    </div>
                    {isCurrent && (
                      <button
                        className="quest-step-audio-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          const titleToSpeak = getLocalizedStepTitle(step);
                          const descToSpeak = getLocalizedStepDesc(step);
                          const hintToSpeak = getLocalizedStepHint(step);
                          const textToSpeak = `${titleToSpeak}. ${descToSpeak}. ${hintToSpeak ? (isFr ? 'Conseil : ' : 'Hint: ') + hintToSpeak : ''}`;
                          speakAgentDialogue(textToSpeak);
                        }}
                        title={isFr ? "Écouter la consigne de cette étape" : "Listen to step instruction"}
                        aria-label={isFr ? "Écouter la consigne" : "Listen to instruction"}
                      >
                        🗣️ {isFr ? 'Écouter' : 'Listen'}
                      </button>
                    )}
                  </div>
                  {isCurrent && step.description && (
                    <div className="quest-step-desc">
                      {getLocalizedStepDesc(step)}
                    </div>
                  )}
                  {isCurrent && (step.hint || targetName) && (
                    <div className="quest-step-meta">
                      {targetName && (
                        <span className="quest-step-target">
                          🎯 {isFr ? 'Cible :' : 'Target:'} <b>{targetName}</b>
                        </span>
                      )}
                      {step.hint && (
                        <span className="quest-step-hint">
                          💡 {getLocalizedStepHint(step)}
                        </span>
                      )}
                    </div>
                  )}
                  {isCurrent && !isStepCompleted && (
                    <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {isConfiguratorStep && (
                        <button
                          type="button"
                          className="button primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            playAudioFx('chime');
                            useWorldStore.getState().openSupercarConfigurator();
                          }}
                          style={{
                            background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                            border: '1px solid #38bdf8',
                            borderRadius: '8px',
                            color: '#ffffff',
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '6px 12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 2px 10px rgba(2, 132, 199, 0.4)'
                          }}
                          title={isFr ? 'Ouvrir le configurateur WorldPilot' : 'Open WorldPilot configurator'}
                        >
                          <span>⚙️</span>
                          <span>{isFr ? 'Ouvrir le configurateur' : 'Open Configurator'}</span>
                        </button>
                      )}

                      {isInteractOrClickStep && resolvedTargetId && !isConfiguratorStep && (
                        <button
                          type="button"
                          className="button primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            playAudioFx('switch_click');
                            if (resolvedTargetId) {
                              useWorldStore.getState().dispatch({ type: 'INTERACT', sourceId: resolvedTargetId });
                            }
                          }}
                          style={{
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            border: '1px solid #34d399',
                            borderRadius: '8px',
                            color: '#ffffff',
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '6px 12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 2px 10px rgba(16, 185, 129, 0.4)'
                          }}
                          title={isFr ? "Exécuter l'interaction requise" : "Execute required interaction"}
                        >
                          <span>⚡</span>
                          <span>{isFr ? "Lancer l'action" : "Launch action"}</span>
                        </button>
                      )}

                      {isDropStep && resolvedTargetId && resolvedDropZoneId && (
                        <button
                          type="button"
                          className="button primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            playAudioFx('chime');
                            const stateNow = useWorldStore.getState();
                            const srcEnt = stateNow.world.ir.entities[resolvedTargetId];
                            const zoneEnt = stateNow.world.ir.entities[resolvedDropZoneId];
                            if (srcEnt && zoneEnt) {
                              const rawZPos: any = zoneEnt.capabilities.find(c => c.type === 'transform')?.position || { x: 0, y: 0.3, z: 0 };
                              const zx = Array.isArray(rawZPos) ? Number(rawZPos[0]) || 0 : Number(rawZPos.x) || 0;
                              const zy = Array.isArray(rawZPos) ? Number(rawZPos[1]) || 0.3 : Number(rawZPos.y ?? 0.3);
                              const zz = Array.isArray(rawZPos) ? Number(rawZPos[2]) || 0 : Number(rawZPos.z) || 0;
                              stateNow.applyPatch(
                                {
                                  entitiesChanged: [
                                    {
                                      id: srcEnt.id,
                                      capabilities: srcEnt.capabilities.map(c =>
                                        c.type === 'transform' ? { ...c, position: { x: zx, y: Number((zy + 0.04).toFixed(3)), z: zz } } : c
                                      )
                                    }
                                  ]
                                },
                                `Poser ${srcEnt.name} sur ${zoneEnt.name}`,
                                { intent: `Poser ${srcEnt.name} sur ${zoneEnt.name}`, recordUndo: true }
                              );
                            }
                            stateNow.dispatch({
                              type: 'DROP',
                              sourceId: resolvedTargetId,
                              targetId: resolvedDropZoneId
                            });
                          }}
                          style={{
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            border: '1px solid #34d399',
                            borderRadius: '8px',
                            color: '#ffffff',
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '6px 12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 2px 10px rgba(16, 185, 129, 0.4)'
                          }}
                          title={isFr ? "Déposer l'objet sur la zone cible" : "Drop object on target zone"}
                        >
                          <span>🎯</span>
                          <span>{isFr ? 'Déposer sur la cible' : 'Drop on target'}</span>
                        </button>
                      )}
                    </div>
                  )}
                  {isCurrent && quizCap && (
                    <div className="quest-step-inline-quiz" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-quiz-prompt">
                        🎓 {quizCap.text?.split('\n')[0]}
                      </div>
                      <div className="inline-quiz-options">
                        {quizCap.text?.split('\n').slice(1).map((opt: string, i: number) => {
                          const answerKey = ['A', 'B', 'C'][i] as 'A' | 'B' | 'C';
                          return (
                            <button
                              key={answerKey}
                              className="inline-quiz-opt-btn"
                              onClick={() => {
                                const isCorrect = answerKey === quizCap.correctAnswer;
                                if (isCorrect) {
                                  playAudioFx('fanfare');
                                  useWorldStore.getState().dispatch({
                                    type: 'ANSWER_CORRECT',
                                    sourceId: resolvedTargetId || step.targetEntityId || '',
                                    payload: { answer: answerKey }
                                  });
                                  useWorldStore.setState(s => ({
                                    warnings: [...s.warnings, `🎉 Réponse ${answerKey} exacte ! Quiz culinaire validé avec brio.`]
                                  }));
                                } else {
                                  playAudioFx('game_over');
                                  useWorldStore.getState().dispatch({
                                    type: 'ANSWER_INCORRECT',
                                    sourceId: resolvedTargetId || step.targetEntityId || '',
                                    payload: { answer: answerKey }
                                  });
                                  useWorldStore.setState(s => ({
                                    warnings: [...s.warnings, `❌ Réponse ${answerKey} incorrecte. Réessayez une autre réponse !`]
                                  }));
                                }
                              }}
                            >
                              <span>{opt}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isCompleted && (
            <div className="quest-hud-congrats">
              <div className="congrats-stars">✨ 🌟 ✨</div>
              <p>{isFr ? 'Félicitations ! Tous les gestes et objectifs ont été validés avec brio.' : 'Congratulations! All gestures and objectives have been brilliantly validated.'}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', marginTop: '8px' }}>
                <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                  <button
                    className="button primary"
                    style={{ flex: 1 }}
                    onClick={() => {
                      resetQuest(quest.id);
                      if (quest.category === 'cuisine') {
                        useWorldStore.getState().restartCurrentRecipe();
                      }
                    }}
                  >
                    🔄 {isFr ? 'Recommencer' : 'Restart'}
                  </button>
                  <button
                    className="button subtle"
                    style={{
                      flex: 1,
                      background: 'rgba(239, 68, 68, 0.12)',
                      border: '1px solid rgba(239, 68, 68, 0.35)',
                      color: '#fca5a5',
                      fontWeight: 600,
                    }}
                    onClick={() => {
                      useWorldStore.getState().stopActiveQuest();
                      playAudioFx('tink');
                    }}
                    title={isFr ? "Arrêter la mission et repasser en mode libre" : "Stop quest and return to free mode"}
                  >
                    ⏹️ {isFr ? 'Arrêter' : 'Stop'}
                  </button>
                </div>
                {quest.category === 'cuisine' && (
                  <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                    <button
                      className="button"
                      style={{ flex: 1.2, background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#451a03', fontWeight: 700, border: '1px solid #fbbf24' }}
                      onClick={() => {
                        openDegustationModal();
                        playAudioFx('fanfare');
                      }}
                      title={isFr ? "Consulter la note du chef et l'analyse gastronomique" : "View chef's evaluation and gastronomic review"}
                    >
                      🍷 {isFr ? 'Évaluer' : 'Review'} ({getDishEvaluation().stars}★)
                    </button>
                    <button
                      className="button"
                      style={{ flex: 1, background: 'rgba(255, 255, 255, 0.08)', borderColor: 'rgba(255, 255, 255, 0.2)' }}
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          window.dispatchEvent(new CustomEvent('worldpilot_open_cooking_modal'));
                        }
                      }}
                    >
                      📖 {isFr ? 'Recettes' : 'Recipes'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
