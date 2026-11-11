import { useState } from 'react';
import { useWorldStore } from '../engine/store';
import { ACHIEVEMENTS, Achievement } from '../engine/achievements';
import { playAudioFx } from '../engine/evaluator';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function AchievementsModal({ isOpen, onClose }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'cuisine' | 'fle' | 'seminaire' | 'exploration'>('all');
  const unlockedAchievements = useWorldStore(state => state.unlockedAchievements);
  const uiLanguage = useWorldStore(state => state.uiLanguage);
  const isFr = uiLanguage === 'fr';

  if (!isOpen) return null;

  const totalCount = ACHIEVEMENTS.length;
  const unlockedCount = Object.keys(unlockedAchievements).length;
  const progressPercent = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  const filteredAchievements = selectedCategory === 'all'
    ? ACHIEVEMENTS
    : ACHIEVEMENTS.filter(a => a.category === selectedCategory);

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'cuisine': return isFr ? '🍳 Atelier Culinaire' : '🍳 Culinary Workshop';
      case 'fle': return isFr ? '🥖 Immersion FLE' : '🥖 French Immersion (FLE)';
      case 'seminaire': return isFr ? '🏛️ Séminaires' : '🏛️ Seminars';
      case 'exploration': return isFr ? '🌍 Exploration 3D' : '🌍 3D Exploration';
      default: return isFr ? 'Général' : 'General';
    }
  };

  return (
    <div className="achievements-modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label={isFr ? "Trophées et Maîtrise" : "Achievements & Mastery"}>
      <div className="achievements-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="achievements-modal-header">
          <div className="achievements-title-group">
            <span className="achievements-trophy-icon">🏆</span>
            <div>
              <h3>{isFr ? 'Hall of Fame et trophées' : 'Hall of Fame & Trophies'}</h3>
              <p className="achievements-subcaption">
                {isFr ? 'Piliers Gastronomie · Pédagogie FLE · Facilitation Professionnelle · Exploration 3D' : 'Pillars: Gastronomy · French Pedagogy (FLE) · Facilitation · 3D Exploration'}
              </p>
            </div>
          </div>
          <button className="icon-button" onClick={onClose} aria-label={isFr ? "Fermer le tableau des trophées" : "Close achievements board"}>
            ×
          </button>
        </div>

        {/* Global Progress Bar */}
        <div className="achievements-progress-container">
          <div className="achievements-progress-bar-wrap">
            <div
              className={`achievements-progress-fill ${progressPercent === 100 ? 'complete' : ''}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="achievements-progress-info">
            <span>{isFr ? `Progression globale : ${unlockedCount} sur ${totalCount} trophées débloqués` : `Global Progress: ${unlockedCount} of ${totalCount} trophies unlocked`}</span>
            <span className="achievements-percent-badge">{progressPercent}%</span>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="achievements-category-tabs" role="tablist">
          <button
            className={`achievements-tab ${selectedCategory === 'all' ? 'active' : ''}`}
            onClick={() => { setSelectedCategory('all'); playAudioFx('tink'); }}
          >
            {isFr ? 'Tous' : 'All'} ({totalCount})
          </button>
          <button
            className={`achievements-tab ${selectedCategory === 'cuisine' ? 'active' : ''}`}
            onClick={() => { setSelectedCategory('cuisine'); playAudioFx('tink'); }}
          >
            🍳 {isFr ? 'Cuisine' : 'Cooking'} ({ACHIEVEMENTS.filter(a => a.category === 'cuisine').length})
          </button>
          <button
            className={`achievements-tab ${selectedCategory === 'fle' ? 'active' : ''}`}
            onClick={() => { setSelectedCategory('fle'); playAudioFx('tink'); }}
          >
            🥖 FLE ({ACHIEVEMENTS.filter(a => a.category === 'fle').length})
          </button>
          <button
            className={`achievements-tab ${selectedCategory === 'seminaire' ? 'active' : ''}`}
            onClick={() => { setSelectedCategory('seminaire'); playAudioFx('tink'); }}
          >
            🏛️ {isFr ? 'Séminaires' : 'Seminars'} ({ACHIEVEMENTS.filter(a => a.category === 'seminaire').length})
          </button>
          <button
            className={`achievements-tab ${selectedCategory === 'exploration' ? 'active' : ''}`}
            onClick={() => { setSelectedCategory('exploration'); playAudioFx('tink'); }}
          >
            🌍 {isFr ? 'Exploration' : 'Exploration'} ({ACHIEVEMENTS.filter(a => a.category === 'exploration').length})
          </button>
        </div>

        {/* Achievements Grid */}
        <div className="achievements-grid">
          {filteredAchievements.map((item: Achievement) => {
            const isUnlocked = !!unlockedAchievements[item.id];
            const unlockedTimestamp = unlockedAchievements[item.id];
            const dateStr = unlockedTimestamp
              ? new Date(unlockedTimestamp).toLocaleDateString(isFr ? 'fr-FR' : 'en-US', {
                  day: '2-digit',
                  month: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
                })
              : null;

            return (
              <div
                key={item.id}
                className={`achievement-card ${isUnlocked ? 'unlocked' : 'locked'}`}
              >
                <div className="achievement-icon-wrap">
                  <span className="achievement-icon">{item.icon}</span>
                  {isUnlocked && <span className="achievement-sparkle-badge">★</span>}
                </div>
                <div className="achievement-details">
                  <div className="achievement-card-header">
                    <span className="achievement-cat-tag">{getCategoryLabel(item.category)}</span>
                    <span className={`achievement-status-badge ${isUnlocked ? 'obtained' : 'locked'}`}>
                      {isUnlocked ? (isFr ? '✓ Obtenu' : '✓ Unlocked') : (isFr ? '🔒 Verrouillé' : '🔒 Locked')}
                    </span>
                  </div>
                  <h4 className="achievement-title">{item.title}</h4>
                  <p className="achievement-desc">{item.description}</p>
                  {isUnlocked && dateStr && (
                    <div className="achievement-date">{isFr ? `Débloqué le ${dateStr}` : `Unlocked on ${dateStr}`}</div>
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
