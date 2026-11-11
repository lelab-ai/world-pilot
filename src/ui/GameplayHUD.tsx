import React, { useEffect } from 'react';
import { useWorldStore } from '../engine/store';

export const GameplayHUD: React.FC = () => {
  const gameplay = useWorldStore(s => s.world.gameplay);
  const tickGameplayTimer = useWorldStore(s => s.tickGameplayTimer);
  const resetGameplay = useWorldStore(s => s.resetGameplay);

  // Timer countdown loop
  useEffect(() => {
    if (!gameplay?.isTimerActive || gameplay.timer === null || gameplay.timer <= 0) return;
    const timerId = setInterval(() => {
      tickGameplayTimer();
    }, 1000);
    return () => clearInterval(timerId);
  }, [gameplay?.isTimerActive, gameplay?.timer, tickGameplayTimer]);

  // Don't display HUD if no gameplay session is running and score is 0
  const isGameActive = gameplay && (
    gameplay.gameStatus !== 'idle' ||
    gameplay.score > 0 ||
    gameplay.timer !== null ||
    gameplay.gameMode !== 'custom'
  );

  if (!isGameActive || !gameplay) return null;

  const hearts = Array.from({ length: gameplay.maxLives || 3 }, (_, i) => i < gameplay.lives);

  return (
    <div className="gameplay-hud-container" aria-label="Tableau de bord de jeu">
      {/* Top HUD Bar */}
      <div className="gameplay-hud-bar">
        {/* Game Title & Mode */}
        {gameplay.title && (
          <div className="hud-pill hud-title-pill">
            <span className="hud-dot" />
            <span className="hud-title">{gameplay.title}</span>
          </div>
        )}

        {/* Score & High Score */}
        <div className="hud-pill hud-score-pill">
          <span className="hud-icon">🏆</span>
          <div className="hud-score-col">
            <span className="hud-label">SCORE</span>
            <span className="hud-value">{gameplay.score}</span>
          </div>
          {gameplay.highScore > 0 && (
            <span className="hud-highscore" title="Meilleur score">
              <small>BEST</small> {gameplay.highScore}
            </span>
          )}
        </div>

        {/* Lives / Health */}
        <div className="hud-pill hud-lives-pill" title={`${gameplay.lives} vies restantes`}>
          <span className="hud-icon">❤️</span>
          <div className="hud-hearts-row">
            {hearts.map((alive, i) => (
              <span key={i} className={`hud-heart ${alive ? 'alive' : 'lost'}`}>
                {alive ? '♥' : '♡'}
              </span>
            ))}
          </div>
        </div>

        {/* Countdown Timer */}
        {gameplay.timer !== null && (
          <div className={`hud-pill hud-timer-pill ${gameplay.timer <= 5 ? 'urgent' : ''}`}>
            <span className="hud-icon">⏱️</span>
            <span className="hud-timer-val">{gameplay.timer}s</span>
          </div>
        )}

        {/* Quick Reset & Seed Reroll */}
        {gameplay.title?.includes('Défi Diagnostic') && (
          <button
            className="hud-reset-btn"
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('worldpilot_reroll_seed'));
              }
            }}
            title="Tirer une nouvelle graine aléatoire (Nouvelle panne procédurale)"
            aria-label="Nouvelle graine"
            style={{ padding: '0 8px', fontSize: '11px', width: 'auto', fontWeight: 600, color: '#38bdf8' }}
          >
            🎲 Nouvelle Graine
          </button>
        )}
        <button
          className="hud-reset-btn"
          onClick={resetGameplay}
          title="Réinitialiser la partie"
          aria-label="Réinitialiser"
        >
          🔄
        </button>
      </div>

      {/* Victory Banner Overlay */}
      {gameplay.gameStatus === 'victory' && (
        <div className="gameplay-banner victory-banner" role="alert">
          <div className="banner-content">
            <span className="banner-emoji">🌟</span>
            <h3>VICTOIRE !</h3>
            <p>Score final : <b>{gameplay.score} points</b></p>
            <div className="banner-actions">
              <button className="button primary" onClick={resetGameplay}>
                Recommencer 🔄
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over Banner Overlay */}
      {gameplay.gameStatus === 'game_over' && (
        <div className="gameplay-banner gameover-banner" role="alert">
          <div className="banner-content">
            <span className="banner-emoji">💀</span>
            <h3>MISSION ÉCHOUÉE</h3>
            <p>Score atteint : <b>{gameplay.score} points</b></p>
            <div className="banner-actions">
              <button className="button primary" onClick={resetGameplay}>
                Réessayer 🔄
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
