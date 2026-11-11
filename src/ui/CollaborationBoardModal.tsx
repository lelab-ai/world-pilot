import { useState, useEffect } from 'react';
import { useWorldStore, type StickyNote } from '../engine/store';

interface CollaborationBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CollaborationBoardModal({ isOpen, onClose }: CollaborationBoardModalProps) {
  const notes = useWorldStore(state => state.collaborationNotes);
  const addNote = useWorldStore(state => state.addCollaborationNote);
  const voteNote = useWorldStore(state => state.voteCollaborationNote);
  const moveNote = useWorldStore(state => state.moveCollaborationNote);
  const deleteNote = useWorldStore(state => state.deleteCollaborationNote);
  const uiLanguage = useWorldStore(state => state.uiLanguage);
  const isFr = uiLanguage === 'fr';

  const [newText, setNewText] = useState('');
  const [newAuthor, setNewAuthor] = useState(isFr ? 'Facilitateur' : 'Facilitator');
  const [newCategory, setNewCategory] = useState<StickyNote['category']>('idea');
  const [newColor, setNewColor] = useState<StickyNote['color']>('yellow');
  const [newColumn, setNewColumn] = useState<StickyNote['column']>('in_progress');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [copiedExport, setCopiedExport] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const totalVotes = notes.reduce((sum, n) => sum + n.votes, 0);
  const topVotedNote = [...notes].sort((a, b) => b.votes - a.votes)[0];

  const filteredNotes = notes.filter(n => {
    if (filterCategory === 'all') return true;
    return n.category === filterCategory;
  });

  const columns: { id: StickyNote['column']; title: string; icon: string; count: number }[] = [
    { id: 'backlog', title: isFr ? 'À explorer (Idéation)' : 'Backlog (Ideation)', icon: '💡', count: filteredNotes.filter(n => n.column === 'backlog').length },
    { id: 'in_progress', title: isFr ? 'En cours (Test & Prototypage)' : 'In Progress (Testing)', icon: '⚡', count: filteredNotes.filter(n => n.column === 'in_progress').length },
    { id: 'done', title: isFr ? 'Validé (Décisions & Consensus)' : 'Done (Consensus)', icon: '✅', count: filteredNotes.filter(n => n.column === 'done').length }
  ];

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;
    addNote({
      text: newText.trim(),
      category: newCategory,
      color: newColor,
      author: newAuthor.trim() || (isFr ? 'Participant' : 'Participant'),
      column: newColumn
    });
    setNewText('');
  };

  const handleExportMarkdown = () => {
    const lines = [
      isFr ? `# Compte-Rendu de Session Collaborative — WorldPilot` : `# Collaborative Session Minutes — WorldPilot`,
      `${isFr ? 'Date :' : 'Date:'} ${new Date().toLocaleDateString(isFr ? 'fr-FR' : 'en-US')} ${new Date().toLocaleTimeString(isFr ? 'fr-FR' : 'en-US')}`,
      `${isFr ? 'Total de notes :' : 'Total notes:'} ${notes.length} | ${isFr ? 'Total de votes :' : 'Total votes:'} ${totalVotes}`,
      '',
      `## 💡 ${isFr ? 'À explorer (Idéation)' : 'Backlog (Ideation)'}`,
      ...notes.filter(n => n.column === 'backlog').map(n => `- [${n.category.toUpperCase()}] ${n.text} (${n.votes} votes, by ${n.author})`),
      '',
      `## ⚡ ${isFr ? 'En cours (Test & Prototypage)' : 'In Progress (Testing)'}`,
      ...notes.filter(n => n.column === 'in_progress').map(n => `- [${n.category.toUpperCase()}] ${n.text} (${n.votes} votes, by ${n.author})`),
      '',
      `## ✅ ${isFr ? 'Validé (Décisions & Consensus)' : 'Done (Consensus)'}`,
      ...notes.filter(n => n.column === 'done').map(n => `- [${n.category.toUpperCase()}] ${n.text} (${n.votes} votes, by ${n.author})`),
      ''
    ];
    const md = lines.join('\n');
    navigator.clipboard?.writeText(md);
    setCopiedExport(true);
    setTimeout(() => setCopiedExport(false), 2500);
  };

  const colorStyles: Record<StickyNote['color'], { bg: string; border: string; text: string; tape: string }> = {
    yellow: { bg: '#fef9c3', border: '#fde047', text: '#713f12', tape: 'rgba(253, 224, 71, 0.6)' },
    green: { bg: '#dcfce7', border: '#86efac', text: '#14532d', tape: 'rgba(134, 239, 172, 0.6)' },
    pink: { bg: '#fce7f3', border: '#f472b6', text: '#831843', tape: 'rgba(244, 114, 182, 0.6)' },
    blue: { bg: '#e0f2fe', border: '#7dd3fc', text: '#0c4a6e', tape: 'rgba(125, 211, 252, 0.6)' },
    orange: { bg: '#ffedd5', border: '#fdba74', text: '#7c2d12', tape: 'rgba(253, 186, 116, 0.6)' }
  };

  const categoryLabels: Record<StickyNote['category'], { label: string; icon: string }> = {
    idea: { label: isFr ? 'Idée' : 'Idea', icon: '💡' },
    action: { label: isFr ? 'Action' : 'Action', icon: '🎯' },
    question: { label: isFr ? 'Question' : 'Question', icon: '❓' },
    decision: { label: isFr ? 'Décision' : 'Decision', icon: '⚖️' }
  };

  return (
    <div className="collab-board-overlay" onClick={onClose}>
      <div className="collab-board-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="collab-board-header">
          <div className="collab-board-title-wrap">
            <div className="collab-board-badge">
              <span>📋</span>
              <span>{isFr ? 'Tableau Partagé & Idéation Collaborative' : 'Shared Board & Collaborative Ideation'}</span>
            </div>
            <h2>{isFr ? 'Espace Séminaire & Design Sprint' : 'Seminar & Design Sprint Space'}</h2>
            <p>{isFr ? 'Partagez vos hypothèses, priorisez les post-its et votez en temps réel avec votre équipe.' : 'Share hypotheses, prioritize sticky notes, and vote in real time with your team.'}</p>
          </div>
          <div className="collab-board-header-actions">
            <button
              className={`collab-export-btn ${copiedExport ? 'copied' : ''}`}
              onClick={handleExportMarkdown}
              title={isFr ? "Copier le compte-rendu dans le presse-papiers" : "Copy session minutes to clipboard"}
            >
              {copiedExport ? (isFr ? '✓ Compte-rendu copié !' : '✓ Minutes copied!') : (isFr ? '📄 Exporter le compte-rendu' : '📄 Export Minutes')}
            </button>
            <button className="collab-close-btn" onClick={onClose} title={isFr ? "Fermer (Échap)" : "Close (Esc)"}>
              ✕
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="collab-board-stats">
          <div className="collab-stat-item">
            <span className="collab-stat-icon">📌</span>
            <div>
              <div className="collab-stat-val">{notes.length}</div>
              <div className="collab-stat-lbl">{isFr ? 'Notes épinglées' : 'Pinned notes'}</div>
            </div>
          </div>
          <div className="collab-stat-item">
            <span className="collab-stat-icon">❤️</span>
            <div>
              <div className="collab-stat-val">{totalVotes}</div>
              <div className="collab-stat-lbl">{isFr ? 'Votes cumulés' : 'Total votes'}</div>
            </div>
          </div>
          {topVotedNote && (
            <div className="collab-stat-item top-note">
              <span className="collab-stat-icon">🏆</span>
              <div>
                <div className="collab-stat-val">{isFr ? 'Top : ' : 'Top: '} {topVotedNote.votes} votes</div>
                <div className="collab-stat-lbl truncate" title={topVotedNote.text}>"{topVotedNote.text.slice(0, 48)}..."</div>
              </div>
            </div>
          )}
        </div>

        {/* Create Note Bar */}
        <form className="collab-create-form" onSubmit={handleAddSubmit}>
          <div className="collab-input-row">
            <input
              type="text"
              className="collab-text-input"
              placeholder={isFr ? "Écrivez une idée, hypothèse ou action à épingler..." : "Write an idea, hypothesis, or action to pin..."}
              value={newText}
              onChange={e => setNewText(e.target.value)}
              maxLength={180}
            />
            <input
              type="text"
              className="collab-author-input"
              placeholder={isFr ? "Auteur" : "Author"}
              value={newAuthor}
              onChange={e => setNewAuthor(e.target.value)}
              maxLength={24}
            />
          </div>

          <div className="collab-options-row">
            <div className="collab-option-group">
              <span className="collab-option-label">{isFr ? 'Catégorie :' : 'Category:'}</span>
              {(['idea', 'action', 'question', 'decision'] as const).map(cat => (
                <button
                  type="button"
                  key={cat}
                  className={`collab-pill-btn ${newCategory === cat ? 'active' : ''}`}
                  onClick={() => setNewCategory(cat)}
                >
                  {categoryLabels[cat].icon} {categoryLabels[cat].label}
                </button>
              ))}
            </div>

            <div className="collab-option-group">
              <span className="collab-option-label">{isFr ? 'Couleur :' : 'Color:'}</span>
              {(['yellow', 'green', 'pink', 'blue', 'orange'] as const).map(col => (
                <button
                  type="button"
                  key={col}
                  className={`collab-color-dot ${newColor === col ? 'selected' : ''}`}
                  style={{ backgroundColor: colorStyles[col].bg, borderColor: colorStyles[col].border }}
                  onClick={() => setNewColor(col)}
                  title={col}
                />
              ))}
            </div>

            <div className="collab-option-group">
              <span className="collab-option-label">{isFr ? 'Colonne :' : 'Column:'}</span>
              <select
                className="collab-column-select"
                value={newColumn}
                onChange={e => setNewColumn(e.target.value as any)}
              >
                <option value="backlog">💡 {isFr ? 'À explorer' : 'Backlog'}</option>
                <option value="in_progress">⚡ {isFr ? 'En cours' : 'In Progress'}</option>
                <option value="done">✅ {isFr ? 'Validé' : 'Done'}</option>
              </select>
            </div>

            <button type="submit" className="collab-submit-btn" disabled={!newText.trim()}>
              📌 {isFr ? 'Épingler' : 'Pin Note'}
            </button>
          </div>
        </form>

        {/* Filter bar */}
        <div className="collab-filters-bar">
          <span className="collab-filters-title">{isFr ? 'Filtrer par type :' : 'Filter by type:'}</span>
          <button
            className={`collab-filter-tag ${filterCategory === 'all' ? 'active' : ''}`}
            onClick={() => setFilterCategory('all')}
          >
            {isFr ? 'Tous' : 'All'} ({notes.length})
          </button>
          {(['idea', 'action', 'question', 'decision'] as const).map(cat => (
            <button
              key={cat}
              className={`collab-filter-tag ${filterCategory === cat ? 'active' : ''}`}
              onClick={() => setFilterCategory(cat)}
            >
              {categoryLabels[cat].icon} {categoryLabels[cat].label} ({notes.filter(n => n.category === cat).length})
            </button>
          ))}
        </div>

        {/* Kanban Board Columns */}
        <div className="collab-kanban-grid">
          {columns.map(col => {
            const colNotes = filteredNotes.filter(n => n.column === col.id);
            return (
              <div key={col.id} className="collab-kanban-col">
                <div className="collab-col-header">
                  <span className="collab-col-icon">{col.icon}</span>
                  <span className="collab-col-title">{col.title}</span>
                  <span className="collab-col-badge">{col.count}</span>
                </div>

                <div className="collab-notes-list">
                  {colNotes.length === 0 ? (
                    <div className="collab-empty-col">
                      <span>{isFr ? 'Aucune note dans cette colonne' : 'No notes in this column'}</span>
                    </div>
                  ) : (
                    colNotes.map((note, index) => {
                      const style = colorStyles[note.color] || colorStyles.yellow;
                      const catInfo = categoryLabels[note.category] || categoryLabels.idea;
                      const rotation = (index % 3 === 0 ? -1 : index % 3 === 1 ? 1 : 0);

                      return (
                        <div
                          key={note.id}
                          className="collab-sticky-note"
                          style={{
                            backgroundColor: style.bg,
                            borderColor: style.border,
                            color: style.text,
                            transform: `rotate(${rotation}deg)`
                          }}
                        >
                          {/* Top scotch tape decoration */}
                          <div className="collab-scotch-tape" style={{ backgroundColor: style.tape }} />

                          {/* Note header: tag + delete */}
                          <div className="collab-note-meta">
                            <span className="collab-note-tag" style={{ borderColor: style.border }}>
                              {catInfo.icon} {catInfo.label}
                            </span>
                            <button
                              className="collab-note-del-btn"
                              onClick={() => deleteNote(note.id)}
                              title={isFr ? "Retirer cette note" : "Remove this note"}
                            >
                              ✕
                            </button>
                          </div>

                          {/* Note content */}
                          <p className="collab-note-text">{note.text}</p>

                          {/* Note footer: author + voting + move */}
                          <div className="collab-note-footer">
                            <span className="collab-note-author">✍️ {note.author}</span>
                            <div className="collab-note-actions">
                              <button
                                className="collab-vote-btn"
                                onClick={() => voteNote(note.id)}
                                title={isFr ? "Voter pour cette idée (+1)" : "Vote for this idea (+1)"}
                              >
                                ❤️ <b>{note.votes}</b>
                              </button>
                              
                              {/* Move column buttons */}
                              {col.id !== 'backlog' && (
                                <button
                                  className="collab-move-btn"
                                  onClick={() => moveNote(note.id, col.id === 'done' ? 'in_progress' : 'backlog')}
                                  title={isFr ? "Déplacer vers la gauche" : "Move left"}
                                >
                                  ◀
                                </button>
                              )}
                              {col.id !== 'done' && (
                                <button
                                  className="collab-move-btn"
                                  onClick={() => moveNote(note.id, col.id === 'backlog' ? 'in_progress' : 'done')}
                                  title={isFr ? "Déplacer vers la droite" : "Move right"}
                                >
                                  ▶
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
