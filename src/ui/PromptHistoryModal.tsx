import React, { useState } from 'react';
import { tracker } from '../observability/tracker';
import { playAudioFx } from '../engine/evaluator';
import { useDraggableModal } from './useDraggableModal';

interface PromptHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPrompt: (promptText: string) => void;
  onReplayPrompt: (promptText: string) => void;
}

export const PromptHistoryModal: React.FC<PromptHistoryModalProps> = ({
  isOpen,
  onClose,
  onSelectPrompt,
  onReplayPrompt,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { offset, dragProps } = useDraggableModal();

  if (!isOpen) return null;

  const records = tracker.getRecords().slice().reverse();

  const filteredRecords = records.filter(r =>
    !searchTerm.trim() ||
    r.original_instruction.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.command_plan?.intent || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.edit_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    playAudioFx('tink');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatTimestamp = (ts?: number) => {
    if (!ts) return 'Récemment';
    const date = new Date(ts);
    const now = Date.now();
    const diffMin = Math.floor((now - ts) / 60000);
    if (diffMin < 1) return "À l'instant";
    if (diffMin < 60) return `Il y a ${diffMin} min`;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="library-backdrop" role="dialog" aria-modal="true" aria-labelledby="prompt-history-title">
      <div
        className="library-dialog prompt-history-dialog"
        style={{
          maxWidth: '820px',
          maxHeight: '88vh',
          transform: `translate(${offset.x}px, ${offset.y}px)`,
        }}
      >
        <header
          {...dragProps}
          style={{
            ...dragProps.style,
            userSelect: 'none',
          }}
          title="Cliquer-glisser pour déplacer la fenêtre"
        >
          <div>
            <div className="eyebrow">TRAÇABILITÉ & MÉMOIRE CONVERSATIONNELLE</div>
            <h2 id="prompt-history-title">
              📜 Historique des Prompts ({records.length})
            </h2>
            <p>Retrouvez, réutilisez ou rejouez l'ensemble de vos instructions vocales et textuelles.</p>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Fermer" title="Fermer (Échap)">✕</button>
        </header>

        <div className="prompt-history-search-bar" style={{ padding: '0 24px 16px 24px', display: 'flex', gap: '12px' }}>
          <input
            type="text"
            placeholder="Rechercher dans les prompts (voiture, batterie, café, cuisine, chimie...)"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '8px',
              background: '#0f172a',
              border: '1px solid #334155',
              color: '#f8fafc',
              fontSize: '14px'
            }}
            autoFocus
          />
          {searchTerm && (
            <button
              className="button small"
              onClick={() => setSearchTerm('')}
              style={{ alignSelf: 'center' }}
            >
              Effacer
            </button>
          )}
        </div>

        <div className="library-body" style={{ maxHeight: 'calc(88vh - 210px)', overflowY: 'auto', padding: '0 24px 24px 24px' }}>
          {records.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: '#94a3b8' }}>
              <div style={{ fontSize: '42px', marginBottom: '16px' }}>📝</div>
              <h3 style={{ color: '#e2e8f0', marginBottom: '8px' }}>Aucun prompt enregistré</h3>
              <p>Chaque prompt saisi dans l'Atelier Spatial est automatiquement mémorisé ici avec son plan causal et ses entités générées.</p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 20px', color: '#94a3b8' }}>
              <p>Aucun prompt ne correspond à « <strong>{searchTerm}</strong> ».</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {filteredRecords.map((record, index) => {
                const isCopied = copiedId === record.edit_id;
                return (
                  <article
                    key={record.edit_id}
                    style={{
                      background: 'rgba(15, 23, 42, 0.75)',
                      border: '1px solid rgba(51, 65, 85, 0.6)',
                      borderRadius: '10px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      transition: 'border-color 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: 'rgba(56, 189, 248, 0.15)',
                          color: '#38bdf8'
                        }}>
                          #{records.length - index} · {record.edit_id}
                        </span>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>
                          v{record.world_version_before} → v{record.world_version_after}
                        </span>
                      </div>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                        ⏱️ {formatTimestamp(record.timestamp)}
                      </span>
                    </div>

                    <div style={{
                      fontSize: '15px',
                      fontWeight: 500,
                      color: '#f8fafc',
                      background: 'rgba(30, 41, 59, 0.5)',
                      padding: '12px',
                      borderRadius: '8px',
                      borderLeft: '3px solid #38bdf8',
                      lineHeight: '1.4'
                    }}>
                      « {record.original_instruction} »
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', fontSize: '12px', color: '#94a3b8' }}>
                      {record.command_plan?.intent && (
                        <span style={{ background: '#1e293b', padding: '3px 8px', borderRadius: '4px', color: '#cbd5e1' }}>
                          🎯 Intent: {record.command_plan.intent}
                        </span>
                      )}
                      {record.entities_created?.length > 0 && (
                        <span style={{ background: '#1e293b', padding: '3px 8px', borderRadius: '4px', color: '#4ade80' }}>
                          ✨ +{record.entities_created.length} objet(s) ({record.entities_created.slice(0, 3).join(', ')}{record.entities_created.length > 3 ? '…' : ''})
                        </span>
                      )}
                      {record.rules_changed?.length > 0 && (
                        <span style={{ background: '#1e293b', padding: '3px 8px', borderRadius: '4px', color: '#facc15' }}>
                          ⚡ +{record.rules_changed.length} règle(s)
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                      <button
                        className="button small"
                        onClick={() => handleCopy(record.original_instruction, record.edit_id)}
                        title="Copier le prompt dans le presse-papiers"
                      >
                        {isCopied ? '✓ Copié !' : '📋 Copier'}
                      </button>
                      <button
                        className="button small"
                        onClick={() => {
                          onSelectPrompt(record.original_instruction);
                          playAudioFx('tink');
                          onClose();
                        }}
                        title="Injecter ce prompt dans le champ de saisie"
                      >
                        ↩️ Insérer dans le prompt
                      </button>
                      <button
                        className="button small primary"
                        onClick={() => {
                          onReplayPrompt(record.original_instruction);
                          playAudioFx('chime');
                          onClose();
                        }}
                        title="Relancer ce prompt immédiatement"
                      >
                        ⚡ Relancer
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        <footer style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: '1px solid #334155' }}>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            💡 Raccourci clavier global : <strong>Alt + H</strong> pour afficher l'historique à tout moment.
          </span>
          <button className="button" onClick={onClose}>Fermer</button>
        </footer>
      </div>
    </div>
  );
};
