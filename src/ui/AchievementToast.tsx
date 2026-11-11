import { useEffect } from 'react';
import { useWorldStore } from '../engine/store';

export function AchievementToast() {
  const recentAchievement = useWorldStore(state => state.recentUnlockedAchievement);
  const dismissToast = useWorldStore(state => state.dismissAchievementToast);

  useEffect(() => {
    if (recentAchievement) {
      const timer = setTimeout(() => {
        dismissToast();
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [recentAchievement, dismissToast]);

  if (!recentAchievement) return null;

  return (
    <aside className="achievement-toast-container" onClick={dismissToast} role="status" aria-live="polite">
      <div className="achievement-toast-card">
        <div className="achievement-toast-glow" />
        <div className="achievement-toast-icon">
          <span>{recentAchievement.icon}</span>
        </div>
        <div className="achievement-toast-content">
          <div className="achievement-toast-eyebrow">
            <span>🏆 NOUVEAU TROPHÉE DÉBLOQUÉ</span>
          </div>
          <h4 className="achievement-toast-title">{recentAchievement.title}</h4>
          <p className="achievement-toast-desc">{recentAchievement.description}</p>
        </div>
        <button
          className="achievement-toast-close"
          onClick={e => {
            e.stopPropagation();
            dismissToast();
          }}
          aria-label="Fermer la notification"
        >
          ×
        </button>
      </div>
    </aside>
  );
}
