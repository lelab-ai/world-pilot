import React, { useState, useMemo } from 'react';
import ReactFlow, { Background, Controls } from 'reactflow';
import 'reactflow/dist/style.css';
import { useWorldStore } from '../engine/store';
import { RuleSpec, Action, SoundEffect } from '../core/types';
import { gameplayPresets, GameplayPresetSpec } from '../engine/gameplayPresets';

export const LogicEditor: React.FC = () => {
  const world = useWorldStore(s => s.world);
  const applyPatch = useWorldStore(s => s.applyPatch);
  const [activeTab, setActiveTab] = useState<'graph' | 'builder' | 'presets'>('graph');

  // Zero-Code Builder Form State
  const [ruleId, setRuleId] = useState(`rule_${Date.now().toString().slice(-4)}`);
  const [trigger, setTrigger] = useState<string>('INTERACT');
  const [sourceEntityId, setSourceEntityId] = useState<string>('');
  const [conditionType, setConditionType] = useState<'none' | 'require_flag' | 'min_score'>('none');
  const [conditionFlag, setConditionFlag] = useState<string>('');
  const [conditionScore, setConditionScore] = useState<number>(100);

  // Actions in Builder
  const [actionType, setActionType] = useState<Action['type']>('increment_score');
  const [scoreDelta, setScoreDelta] = useState<number>(50);
  const [soundEffect, setSoundEffect] = useState<SoundEffect>('ping');
  const [customMessage, setCustomMessage] = useState<string>('Règle déclenchée avec succès !');
  const [timerDuration, setTimerDuration] = useState<number>(30);
  const [actionColor, setActionColor] = useState<string>('#38bdf8');
  const [createdNotice, setCreatedNotice] = useState<string>('');

  const entitiesList = Object.values(world.ir.entities);

  const handleCreateRule = () => {
    const conditions: any[] = [];
    if (sourceEntityId) {
      conditions.push({ type: 'is_source', sourceId: sourceEntityId });
    }
    if (conditionType === 'require_flag' && conditionFlag.trim()) {
      conditions.push({ type: 'require_flag', flag: conditionFlag.trim() });
    }
    if (conditionType === 'min_score') {
      conditions.push({ type: 'min_score', minScore: conditionScore });
    }

    const actions: Action[] = [];
    if (actionType === 'increment_score') {
      actions.push({ type: 'increment_score', scoreDelta });
      actions.push({ type: 'play_sound', sound: 'target_hit' });
      actions.push({ type: 'show_warning', message: `🎯 Points marqués : +${scoreDelta}` });
    } else if (actionType === 'adjust_lives') {
      actions.push({ type: 'adjust_lives', livesDelta: -1 });
      actions.push({ type: 'play_sound', sound: 'laser' });
      actions.push({ type: 'show_warning', message: '⚠️ Dégâts subis : -1 Vie' });
    } else if (actionType === 'trigger_victory') {
      actions.push({ type: 'trigger_victory', message: customMessage });
      actions.push({ type: 'play_sound', sound: 'fanfare' });
    } else if (actionType === 'trigger_game_over') {
      actions.push({ type: 'trigger_game_over', message: customMessage });
      actions.push({ type: 'play_sound', sound: 'game_over' });
    } else if (actionType === 'play_sound') {
      actions.push({ type: 'play_sound', sound: soundEffect });
    } else if (actionType === 'change_color' && sourceEntityId) {
      actions.push({ type: 'change_color', entityId: sourceEntityId, color: actionColor });
    } else if (actionType === 'set_timer') {
      actions.push({ type: 'set_timer', duration: timerDuration });
      actions.push({ type: 'show_warning', message: `⏱️ Chronomètre lancé : ${timerDuration}s` });
    } else {
      actions.push({ type: actionType, message: customMessage });
    }

    const newRule: RuleSpec = {
      id: ruleId.trim() || `rule_${Date.now()}`,
      trigger,
      conditions,
      actions
    };

    applyPatch(
      { rulesChanged: [newRule] },
      `Création Zero-Code de la règle : ${newRule.id}`,
      { intent: 'create_custom_rule', actions: [{ action: 'add_rule', ruleId: newRule.id }] }
    );

    setCreatedNotice(`✓ Règle ${newRule.id} insérée avec succès dans le monde !`);
    setRuleId(`rule_${Date.now().toString().slice(-4)}`);
    setTimeout(() => setCreatedNotice(''), 4000);
  };

  const handleLoadPreset = (preset: GameplayPresetSpec) => {
    const patch = preset.createPatch();
    applyPatch(
      patch,
      `Chargement du jeu : ${preset.title}`,
      { intent: 'load_gameplay_preset', actions: [{ action: 'load_preset', presetId: preset.id }] }
    );
    setCreatedNotice(`🎮 Jeu "${preset.title}" matérialisé avec succès !`);
    setTimeout(() => setCreatedNotice(''), 4000);
  };

  // ReactFlow Nodes & Edges Generation
  const { nodes, edges } = useMemo(() => {
    const nds: any[] = [];
    const eds: any[] = [];
    
    let y = 50;
    
    Object.values(world.ir.rules).forEach((rule) => {
      // Event Node
      const eventNodeId = `event-${rule.id}`;
      nds.push({
        id: eventNodeId,
        position: { x: 50, y },
        data: { label: `DÉCLENCHEUR\n${rule.trigger} [${rule.id}]` },
        style: { 
          background: '#0f172a', 
          color: '#38bdf8', 
          border: '1px solid #38bdf8', 
          borderRadius: 8,
          fontSize: 11,
          fontWeight: 600,
          padding: 8
        }
      });
      
      // Actions
      rule.actions.forEach((action, aIdx) => {
        const actionNodeId = `action-${rule.id}-${aIdx}`;
        let actionLabel = action.type;
        if (action.scoreDelta) actionLabel += ` (+${action.scoreDelta} pts)`;
        if (action.sound) actionLabel += ` 🔊 ${action.sound}`;
        if (action.message) actionLabel += `\n"${action.message.slice(0, 30)}..."`;

        nds.push({
          id: actionNodeId,
          position: { x: 380, y: y + (aIdx * 75) },
          data: { label: `ACTION\n${actionLabel}` },
          style: { 
            background: '#1c1917', 
            color: '#fbbf24', 
            border: '1px solid #fbbf24', 
            borderRadius: 8,
            fontSize: 10,
            padding: 8
          }
        });
        eds.push({
          id: `e-${eventNodeId}-${actionNodeId}`,
          source: eventNodeId,
          target: actionNodeId,
          animated: true,
          style: { stroke: '#38bdf8' }
        });
      });
      
      y += (Math.max(1, rule.actions.length) * 90) + 20;
    });

    return { nodes: nds, edges: eds };
  }, [world.ir.rules]);

  return (
    <div className="logic-editor-wrapper">
      {/* Subheader Navigation */}
      <div className="logic-editor-nav">
        <div className="logic-tabs">
          <button
            className={`logic-tab-btn ${activeTab === 'graph' ? 'active' : ''}`}
            onClick={() => setActiveTab('graph')}
          >
            🕸️ Graphe Causal ({Object.keys(world.ir.rules).length} règles)
          </button>
          <button
            className={`logic-tab-btn ${activeTab === 'builder' ? 'active' : ''}`}
            onClick={() => setActiveTab('builder')}
          >
            ⚡ Créateur Zero-Code (SI / QUAND / ALORS)
          </button>
          <button
            className={`logic-tab-btn ${activeTab === 'presets' ? 'active' : ''}`}
            onClick={() => setActiveTab('presets')}
          >
            🎮 Boucles de Gameplay Émergent ({gameplayPresets.length})
          </button>
        </div>
        {createdNotice && <span className="logic-notice-badge">{createdNotice}</span>}
      </div>

      {/* TAB 1: Graph Flow */}
      {activeTab === 'graph' && (
        <div className="logic-flow-container">
          <ReactFlow nodes={nodes} edges={edges} fitView>
            <Background color="#1e293b" gap={16} />
            <Controls />
          </ReactFlow>
        </div>
      )}

      {/* TAB 2: Zero-Code Rule Builder */}
      {activeTab === 'builder' && (
        <div className="zero-code-builder-panel">
          <div className="builder-header">
            <h3>Générateur de Règle Spatiale Zero-Code</h3>
            <p>Définissez un déclencheur, des conditions et des actions sans écrire une seule ligne de code.</p>
          </div>

          <div className="builder-grid">
            {/* Step 1: Trigger & Source */}
            <div className="builder-card">
              <span className="step-num">01</span>
              <h4>QUAND (Déclencheur)</h4>
              <div className="field-group">
                <label>Événement :</label>
                <select value={trigger} onChange={e => setTrigger(e.target.value)}>
                  <option value="INTERACT">INTERACT (Clic / Toucher sur l'objet)</option>
                  <option value="COLLISION">COLLISION (Impact physique Rapier)</option>
                  <option value="DROP">DROP (Dépôt d'un objet sur un autre)</option>
                  <option value="TIMER_EXPIRED">TIMER_EXPIRED (Fin du compte à rebours)</option>
                  <option value="INSPECT">INSPECT (Regard / Pointage)</option>
                </select>
              </div>

              <div className="field-group">
                <label>Entité Source :</label>
                <select value={sourceEntityId} onChange={e => setSourceEntityId(e.target.value)}>
                  <option value="">-- N'importe quelle entité --</option>
                  {entitiesList.map(ent => (
                    <option key={ent.id} value={ent.id}>
                      {ent.name} ({ent.id})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Step 2: Condition */}
            <div className="builder-card">
              <span className="step-num">02</span>
              <h4>SI (Condition Optionnelle)</h4>
              <div className="field-group">
                <label>Type de Condition :</label>
                <select value={conditionType} onChange={e => setConditionType(e.target.value as any)}>
                  <option value="none">Aucune (Toujours exécuter)</option>
                  <option value="require_flag">Flag d'état requis (ex: clé obtenue)</option>
                  <option value="min_score">Score minimum atteint</option>
                </select>
              </div>

              {conditionType === 'require_flag' && (
                <div className="field-group">
                  <label>Nom du Flag Requis :</label>
                  <input
                    type="text"
                    value={conditionFlag}
                    onChange={e => setConditionFlag(e.target.value)}
                    placeholder="ex: battery_inspected, key_found..."
                  />
                </div>
              )}

              {conditionType === 'min_score' && (
                <div className="field-group">
                  <label>Score Minimum :</label>
                  <input
                    type="number"
                    value={conditionScore}
                    onChange={e => setConditionScore(parseInt(e.target.value) || 0)}
                  />
                </div>
              )}
            </div>

            {/* Step 3: Action */}
            <div className="builder-card">
              <span className="step-num">03</span>
              <h4>ALORS (Action Immédiate)</h4>
              <div className="field-group">
                <label>Action de Gameplay :</label>
                <select value={actionType} onChange={e => setActionType(e.target.value as any)}>
                  <option value="increment_score">🏆 Ajouter des points (+Score)</option>
                  <option value="adjust_lives">❤️ Infliger des dégâts (-1 Vie)</option>
                  <option value="trigger_victory">🌟 Déclencher la Victoire</option>
                  <option value="trigger_game_over">💀 Déclencher l'Échec (Game Over)</option>
                  <option value="set_timer">⏱️ Démarrer un Chronomètre</option>
                  <option value="play_sound">🔊 Jouer un son procédural</option>
                  <option value="change_color">🎨 Changer la couleur de l'objet</option>
                  <option value="show_warning">💬 Afficher un message de warning</option>
                </select>
              </div>

              {actionType === 'increment_score' && (
                <div className="field-group">
                  <label>Points à ajouter :</label>
                  <input
                    type="number"
                    value={scoreDelta}
                    onChange={e => setScoreDelta(parseInt(e.target.value) || 10)}
                  />
                </div>
              )}

              {actionType === 'play_sound' && (
                <div className="field-group">
                  <label>Effet Sonore Web Audio :</label>
                  <select value={soundEffect} onChange={e => setSoundEffect(e.target.value as any)}>
                    <option value="target_hit">Impact Cible (target_hit)</option>
                    <option value="laser">Tir Laser (laser)</option>
                    <option value="chime">Carillon Cristallin (chime)</option>
                    <option value="fanfare">Fanfare Triomphale (fanfare)</option>
                    <option value="explosion">Explosion Grave (explosion)</option>
                    <option value="sparkle">Étincelles Magiques (sparkle)</option>
                  </select>
                </div>
              )}

              {actionType === 'set_timer' && (
                <div className="field-group">
                  <label>Durée en Secondes :</label>
                  <input
                    type="number"
                    value={timerDuration}
                    onChange={e => setTimerDuration(parseInt(e.target.value) || 30)}
                  />
                </div>
              )}

              {actionType === 'change_color' && (
                <div className="field-group">
                  <label>Nouvelle Couleur :</label>
                  <input
                    type="color"
                    value={actionColor}
                    onChange={e => setActionColor(e.target.value)}
                  />
                </div>
              )}

              {(actionType === 'trigger_victory' || actionType === 'trigger_game_over' || actionType === 'show_warning') && (
                <div className="field-group">
                  <label>Message vocal / texte :</label>
                  <input
                    type="text"
                    value={customMessage}
                    onChange={e => setCustomMessage(e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="builder-footer">
            <button className="button primary" onClick={handleCreateRule}>
              ⚡ Ajouter la Règle au Monde Spatiale
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: Gameplay Presets */}
      {activeTab === 'presets' && (
        <div className="gameplay-presets-panel">
          <div className="presets-header">
            <h3>4 Boucles de Gameplay Émergent</h3>
            <p>Choisissez un jeu pour matérialiser instantanément les règles, les cibles et le tableau de bord.</p>
          </div>

          <div className="presets-grid">
            {gameplayPresets.map(preset => (
              <div key={preset.id} className="preset-card">
                <div className="preset-icon">{preset.icon}</div>
                <div className="preset-info">
                  <span className="preset-cat">{preset.category}</span>
                  <h4>{preset.title}</h4>
                  <p>{preset.description}</p>
                </div>
                <button
                  className="button primary small"
                  onClick={() => handleLoadPreset(preset)}
                >
                  Charger ce jeu
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
