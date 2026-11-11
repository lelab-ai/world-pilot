import React, { useState, useEffect, useMemo } from 'react';
import { useWorldStore } from '../engine/store';
import { exportWorldToYaml, downloadWorldFile, validateWorldIR } from '../engine/worldFormat';
import { exportSceneToJsonLd } from '../engine/semanticManifest';
import { playAudioFx } from '../engine/evaluator';

export const JsonEditor: React.FC = () => {
  const world = useWorldStore(s => s.world);
  const currentSceneTitle = useWorldStore(s => s.currentSceneTitle);
  const setWorldState = useWorldStore(s => s.setWorldState);
  const importWorldYaml = useWorldStore(s => s.importWorldYaml);
  const toggleCausalObservability = useWorldStore(s => s.toggleCausalObservability);

  const [formatMode, setFormatMode] = useState<'yaml' | 'json' | 'jsonld'>('yaml');
  const [editorText, setEditorText] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [applySuccess, setApplySuccess] = useState<boolean>(false);
  const [isDirty, setIsDirty] = useState<boolean>(false);

  // Entities and rules metrics
  const entityCount = useMemo(() => Object.keys(world.ir.entities || {}).length, [world.ir.entities]);
  const ruleCount = useMemo(() => Object.keys(world.ir.rules || {}).length, [world.ir.rules]);
  const invariantCount = useMemo(() => Object.keys(world.ir.invariants || {}).length, [world.ir.invariants]);

  // Sync content with world state when world version changes (unless user is currently editing)
  useEffect(() => {
    if (!isDirty) {
      if (formatMode === 'yaml') {
        setEditorText(exportWorldToYaml(world));
      } else if (formatMode === 'jsonld') {
        setEditorText(exportSceneToJsonLd(world.ir, currentSceneTitle || (world as any).name || 'Scène WorldPilot'));
      } else {
        setEditorText(JSON.stringify(world.ir, null, 2));
      }
      setError(null);
    }
  }, [world.version, formatMode, isDirty, world, currentSceneTitle]);

  // Handle format switch
  const handleSwitchFormat = (newMode: 'yaml' | 'json' | 'jsonld') => {
    setFormatMode(newMode);
    setIsDirty(false);
    setError(null);
    if (newMode === 'yaml') {
      setEditorText(exportWorldToYaml(world));
    } else if (newMode === 'jsonld') {
      setEditorText(exportSceneToJsonLd(world.ir, currentSceneTitle || (world as any).name || 'Scène WorldPilot'));
    } else {
      setEditorText(JSON.stringify(world.ir, null, 2));
    }
    playAudioFx('switch_click');
  };

  // Live syntax check during typing
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setEditorText(val);
    setIsDirty(true);

    if (formatMode === 'json') {
      try {
        const parsed = JSON.parse(val);
        const check = validateWorldIR(parsed);
        if (!check.valid) {
          setError(check.errors[0]);
        } else {
          setError(null);
        }
      } catch (err: any) {
        setError(`JSON invalide : ${err.message}`);
      }
    } else if (formatMode === 'jsonld') {
      try {
        JSON.parse(val);
        setError(null);
      } catch (err: any) {
        setError(`JSON-LD invalide : ${err.message}`);
      }
    } else {
      // In YAML mode, validate non-empty string and check for obvious tabs
      if (val.includes('\t')) {
        setError('Attention : les tabulations sont déconseillées en YAML, utilisez 2 espaces.');
      } else {
        setError(null);
      }
    }
  };

  // Apply changes to the live 3D scene
  const handleApplyToWorld = () => {
    if (formatMode === 'jsonld') {
      setError('Le format JSON-LD (WoT / Mindel) est un format d\'export et d\'interopérabilité sémantique. Pour éditer la scène 3D, basculez en YAML ou JSON.');
      playAudioFx('game_over');
      return;
    }

    if (formatMode === 'yaml') {
      const ok = importWorldYaml(editorText);
      if (ok) {
        setError(null);
        setIsDirty(false);
        setApplySuccess(true);
        playAudioFx('fanfare');
        setTimeout(() => setApplySuccess(false), 2500);
      } else {
        setError('Échec du parsing YAML. Vérifiez la syntaxe et les indentations.');
        playAudioFx('game_over');
      }
    } else {
      try {
        const parsed = JSON.parse(editorText);
        const check = validateWorldIR(parsed);
        if (!check.valid) {
          setError(check.errors.join(' | '));
          playAudioFx('game_over');
          return;
        }
        if (setWorldState) {
          setWorldState(parsed);
        }
        setError(null);
        setIsDirty(false);
        setApplySuccess(true);
        playAudioFx('fanfare');
        setTimeout(() => setApplySuccess(false), 2500);
      } catch (err: any) {
        setError(`Erreur JSON : ${err.message}`);
        playAudioFx('game_over');
      }
    }
  };

  // Reset to live scene
  const handleResetToScene = () => {
    setIsDirty(false);
    setError(null);
    if (formatMode === 'yaml') {
      setEditorText(exportWorldToYaml(world));
    } else if (formatMode === 'jsonld') {
      setEditorText(exportSceneToJsonLd(world.ir, currentSceneTitle || (world as any).name || 'Scène WorldPilot'));
    } else {
      setEditorText(JSON.stringify(world.ir, null, 2));
    }
    playAudioFx('chime');
  };

  // Copy to clipboard
  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(editorText);
      setCopied(true);
      playAudioFx('chime');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Download file
  const handleDownload = () => {
    downloadWorldFile(world, formatMode, `worldpilot_${Date.now()}`);
    playAudioFx('switch_click');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0f172a', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif' }}>
      {/* Top Header & Actions */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 14px',
          background: 'rgba(30, 41, 59, 0.85)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          gap: '8px'
        }}
      >
        {/* Format Selector Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div
            style={{
              display: 'inline-flex',
              background: 'rgba(15, 23, 42, 0.8)',
              padding: '2px',
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.15)'
            }}
          >
            <button
              type="button"
              onClick={() => handleSwitchFormat('yaml')}
              style={{
                background: formatMode === 'yaml' ? '#0ea5e9' : 'transparent',
                color: formatMode === 'yaml' ? '#ffffff' : '#94a3b8',
                border: 'none',
                borderRadius: '4px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="Substrat universel lisible par les humains et les LLMs"
            >
              📄 YAML
            </button>
            <button
              type="button"
              onClick={() => handleSwitchFormat('json')}
              style={{
                background: formatMode === 'json' ? '#0ea5e9' : 'transparent',
                color: formatMode === 'json' ? '#ffffff' : '#94a3b8',
                border: 'none',
                borderRadius: '4px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="Format JSON brut du WorldIR"
            >
              ⚙️ JSON
            </button>
            <button
              type="button"
              onClick={() => handleSwitchFormat('jsonld')}
              style={{
                background: formatMode === 'jsonld' ? '#8b5cf6' : 'transparent',
                color: formatMode === 'jsonld' ? '#ffffff' : '#94a3b8',
                border: 'none',
                borderRadius: '4px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="Manifeste sémantique standardisé W3C Web of Things & Schema.org (Mindel §10 & §21)"
            >
              🌐 JSON-LD (WoT)
            </button>
          </div>

          {/* Quick Metrics */}
          <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: '6px' }}>
            📦 <b>{entityCount}</b> entités <span>·</span> ⚡ <b>{ruleCount}</b> règles <span>·</span> 🛡️ <b>{invariantCount}</b> invariants
          </span>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {error ? (
            <span style={{ color: '#f87171', fontSize: '11px', fontWeight: 600, maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={error}>
              ⚠️ {error}
            </span>
          ) : (
            <span style={{ color: '#34d399', fontSize: '11px', fontWeight: 600 }}>
              {isDirty ? '✏️ Modifications non appliquées' : '✓ En direct avec la scène 3D'}
            </span>
          )}

          {isDirty && (
            <>
              <button
                type="button"
                onClick={handleResetToScene}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#cbd5e1',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '5px',
                  padding: '4px 8px',
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
                title="Rétablir l'état actuel de la scène 3D"
              >
                ↺ Réinitialiser
              </button>

              <button
                type="button"
                onClick={handleApplyToWorld}
                style={{
                  background: applySuccess ? '#10b981' : 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '5px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)'
                }}
                title="Appliquer ces modifications à la scène 3D en temps réel"
              >
                {applySuccess ? '✓ Appliqué !' : '⚡ Appliquer au monde'}
              </button>
            </>
          )}

          <button
            type="button"
            onClick={handleCopy}
            style={{
              background: copied ? '#059669' : 'rgba(255, 255, 255, 0.08)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '5px',
              padding: '4px 8px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
            title="Copier le document dans le presse-papiers"
          >
            {copied ? '✓ Copié' : '📋 Copier'}
          </button>

          <button
            type="button"
            onClick={handleDownload}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '5px',
              padding: '4px 8px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
            title={`Télécharger le fichier .world.${formatMode}`}
          >
            💾 Télécharger
          </button>

          <button
            type="button"
            onClick={toggleCausalObservability}
            style={{
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '5px',
              padding: '4px 8px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              marginLeft: '4px'
            }}
            title="Ouvrir le HUD d'Observabilité Réactive & Debug Causal [F2]"
          >
            🔍 F2 Observabilité
          </button>
        </div>
      </div>

      {/* Editor Content Area */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <textarea
          style={{
            width: '100%',
            height: '100%',
            background: '#0b1120',
            color: '#f1f5f9',
            border: 'none',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            fontSize: '11.5px',
            lineHeight: 1.55,
            padding: '12px 16px',
            outline: 'none',
            resize: 'none',
            tabSize: 2
          }}
          value={editorText}
          onChange={handleTextChange}
          placeholder={`Collez ou éditez votre substrat ${formatMode.toUpperCase()} ici...`}
          spellCheck={false}
        />
      </div>

      {/* Footer Info Strip */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '6px 14px',
          background: '#0a0f1d',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          fontSize: '10px',
          color: '#64748b'
        }}
      >
        <span>
          💡 <b>Astuce</b> : Le format <b>YAML</b> est le substrat universel recommandé pour l'interopérabilité LLM, le versionnage Git et l'édition déclarative fine.
        </span>
        <span>
          Version du monde : <b>v{world.version}</b> <span>·</span> Raccourci Debug : <b>[F2]</b>
        </span>
      </div>
    </div>
  );
};
