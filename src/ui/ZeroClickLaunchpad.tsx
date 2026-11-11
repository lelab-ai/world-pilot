import React from 'react';
import { useWorldStore, CameraPreset } from '../engine/store';
import { playAudioFx } from '../engine/evaluator';
import { translations } from '../i18n/translations';
import { useDraggableModal } from './useDraggableModal';

interface ZeroClickLaunchpadProps {
  onLaunchPrompt: (prompt: string, title: string, cameraPreset?: CameraPreset) => void;
  onLaunchSpatialWebHub: () => void;
  onOpenPitchDirector: () => void;
  onClose?: () => void;
}

interface ShowcaseCard {
  id: string;
  icon: string;
  title: string;
  badge: string;
  badgeColor: string;
  badgeBg: string;
  description: string;
  highlights: string[];
  actionPrompt?: string;
  isSpatialHub?: boolean;
  cameraPreset?: CameraPreset;
  cinematicPreset?: 'cinematic' | 'golden_hour' | 'studio_neutral';
  accentBorder: string;
}

const SHOWCASE_CARDS: ShowcaseCard[] = [
  {
    id: 'victoria_vr_supercar',
    icon: '🏎️',
    title: 'Showroom Victoria VR & Supercar',
    badge: 'Démo guidée · scène de démonstration',
    badgeColor: '#38bdf8',
    badgeBg: 'rgba(56, 189, 248, 0.15)',
    description: 'Hypercar profilée sur estrade rotative, baie vitrée panoramique avec vue sur la mégapole, salon VIP et teinte nacrée.',
    highlights: ['Scène 3D interactive', 'Règles visibles', 'Test et diagnostic'],
    actionPrompt: 'Showcase Victoria VR Supercar dans le showroom de luxe avec configurateur et clé intelligente',
    cameraPreset: 'supercar_hero',
    cinematicPreset: 'cinematic',
    accentBorder: 'rgba(56, 189, 248, 0.35)'
  },
  {
    id: 'battery_training_safety',
    icon: '🔋',
    title: 'Maintenance Batterie B-17 & Sécurité',
    badge: 'Invariants Formels · 100/100',
    badgeColor: '#34d399',
    badgeBg: 'rgba(52, 211, 153, 0.15)',
    description: 'Berline compartiment moteur ouvert, batterie AGM 12V neuve sur établi, multimètre digital et interdiction de court-circuit.',
    highlights: ['Mesure préalable 12.6V', 'Pose aimantée moteur', 'Invariant de sécurité certifié'],
    actionPrompt: 'Montrer comment changer une batterie dans une voiture avec diagnostic de tension et règles de sécurité',
    cameraPreset: 'overview',
    cinematicPreset: 'studio_neutral',
    accentBorder: 'rgba(52, 211, 153, 0.35)'
  },
  {
    id: 'gastronomy_ratatouille',
    icon: '🍳',
    title: 'Atelier Culinaire & Gastronomie',
    badge: 'Thermodynamique & Dressage',
    badgeColor: '#fbbf24',
    badgeBg: 'rgba(251, 191, 36, 0.15)',
    description: 'Cocotte en fonte émaillée, plaque à induction 4 allures, découpe de légumes, assaisonnement de Guérande et dressage étoilé.',
    highlights: ['Mijotage thermodynamique', 'Assaisonnement interactif', 'Dressage gastronomique'],
    actionPrompt: 'Préparer une ratatouille provençale gastronomique avec cocotte et légumes frais',
    cameraPreset: 'table',
    cinematicPreset: 'golden_hour',
    accentBorder: 'rgba(251, 191, 36, 0.35)'
  },
  {
    id: 'spatial_web_studio',
    icon: '🏛️',
    title: 'Hub Spatial Web 3D & Étude',
    badge: 'Productivité Spatiale · 7 Artefacts',
    badgeColor: '#a78bfa',
    badgeBg: 'rgba(167, 139, 250, 0.15)',
    description: 'Espace d’étude complet avec livre 3D PDF interactif, documentation Three.js en direct, platine vinyle hi-fi et globe atlas.',
    highlights: ['Lecteur PDF spatial', 'Web 3D immersif', 'Platine audiophile'],
    isSpatialHub: true,
    cameraPreset: 'overview',
    cinematicPreset: 'cinematic',
    accentBorder: 'rgba(167, 139, 250, 0.35)'
  },
  {
    id: 'procedural_diagnostic_roguelike',
    icon: '🎲',
    title: 'Défi Diagnostic & Roguelike 3D',
    badge: 'Graines Déterministes · 3 Mesures',
    badgeColor: '#ec4899',
    badgeBg: 'rgba(236, 72, 153, 0.15)',
    description: 'Panne technique masquée tirée procéduralement, bruit de tolérances réelles, multimètre à quota limité et score d’efficience.',
    highlights: ['Graines reproductibles', 'Panne masquée aléatoire', 'Budget de mesures fini'],
    actionPrompt: 'crée un défi de dépannage électrique avec graine #402',
    cameraPreset: 'table',
    accentBorder: 'rgba(236, 72, 153, 0.35)'
  },
  {
    id: 'mindel_bag_capacity',
    icon: '🎒',
    title: 'Mindel : Sac 42L & Capacité Spatiale',
    badge: 'Web 3D Hybride · Sémantique WoT',
    badgeColor: '#10b981',
    badgeBg: 'rgba(16, 185, 129, 0.15)',
    description: 'Démonstrateur Mindel : Sac 42L, compartiments ordi/gourde, test physique de logeabilité PC 15.6", vue éclatée et fiches 2D synchronisées.',
    highlights: ['Test géométrique PC 15.6"', 'États Ouvert / Fermé', 'Manifeste W3C WoT'],
    actionPrompt: 'Tester la capacité du Sac Voyageur Pro 42L et son compartiment ordinateur',
    cameraPreset: 'table',
    accentBorder: 'rgba(16, 185, 129, 0.35)'
  }
];

export const ZeroClickLaunchpad: React.FC<ZeroClickLaunchpadProps> = ({
  onLaunchPrompt,
  onLaunchSpatialWebHub,
  onOpenPitchDirector,
  onClose
}) => {
  const [isMinimized, setIsMinimized] = React.useState(false);
  const { offset, dragProps } = useDraggableModal();
  const setCinematicPreset = useWorldStore(state => state.setCinematicPreset);
  const uiLanguage = useWorldStore(state => state.uiLanguage);
  const t = translations[uiLanguage] || translations.fr;

  const featuredCard = React.useMemo(() => {
    const base = SHOWCASE_CARDS[0];
    return {
      ...base,
      title: t.showcaseSupercarTitle,
      badge: t.showcaseSupercarBadge,
      description: t.showcaseSupercarDesc,
      highlights: t.showcaseSupercarHighlights
    };
  }, [t]);

  const handleCardClick = (card: ShowcaseCard) => {
    playAudioFx('chime');
    if (card.cinematicPreset) {
      setCinematicPreset(card.cinematicPreset);
    }
    if (card.isSpatialHub) {
      onLaunchSpatialWebHub();
    } else if (card.actionPrompt) {
      onLaunchPrompt(card.actionPrompt, card.title, card.cameraPreset);
    }
  };

  if (isMinimized) {
    return (
      <div
        style={{
          position: 'absolute',
          top: `${24 + offset.y}px`,
          left: `calc(50% + ${offset.x}px)`,
          transform: 'translateX(-50%)',
          zIndex: 800,
          pointerEvents: 'auto'
        }}
      >
        <button
          onClick={() => setIsMinimized(false)}
          className="button primary"
          style={{
            background: 'rgba(15, 23, 42, 0.92)',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5), 0 0 15px rgba(56, 189, 248, 0.25)',
            color: '#38bdf8',
            padding: '8px 16px',
            fontSize: '12px',
            fontWeight: 650,
            borderRadius: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backdropFilter: 'blur(12px)',
            cursor: 'pointer'
          }}
        >
          <span>🚀</span>
          <span>{t.reopenLaunchpad}</span>
        </button>
      </div>
    );
  }

  return (
    <div
      className="zero-click-launchpad-container"
      style={{
        position: 'absolute',
        top: `${16 + offset.y}px`,
        left: `${16 + offset.x}px`,
        zIndex: 800,
        pointerEvents: 'auto',
        maxWidth: '400px',
        width: 'calc(100% - 32px)',
        maxHeight: 'calc(100dvh - 32px)',
        overflowY: 'auto',
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.94), rgba(24, 24, 27, 0.95))',
        border: '1px solid rgba(255, 255, 255, 0.14)',
        boxShadow: '0 24px 60px rgba(0, 0, 0, 0.75), 0 0 30px rgba(56, 189, 248, 0.12)',
        borderRadius: '20px',
        padding: '24px 28px',
        backdropFilter: 'blur(24px)',
        color: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px'
      }}
    >
      {/* Top Banner Header with Drag Handle */}
      <div
        {...dragProps}
        style={{
          ...dragProps.style,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          paddingBottom: '14px',
          userSelect: 'none',
        }}
        title={uiLanguage === 'fr' ? "Cliquer-glisser pour déplacer la fenêtre" : "Click and drag to move window"}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 800,
                letterSpacing: '1.2px',
                color: '#34d399',
                background: 'rgba(52, 211, 153, 0.15)',
                border: '1px solid rgba(52, 211, 153, 0.35)',
                borderRadius: '12px',
                padding: '3px 9px',
                textTransform: 'uppercase'
              }}
            >
              🚀 {t.launchpadTitle}
            </span>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>{t.hackathonVictoria}</span>
          </div>
          <h2 style={{ fontSize: '19px', fontWeight: 700, margin: 0, color: '#ffffff', letterSpacing: '-0.3px' }}>
            {t.launchpadSubtitle}
          </h2>
          <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 0 0', lineHeight: 1.4 }}>
            {t.launchpadDesc}
          </p>
        </div>

        <button
          onClick={() => {
            if (onClose) onClose();
            else setIsMinimized(true);
          }}
          title={t.blankCanvasTooltip}
          aria-label="Fermer"
          style={{
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '50%',
            width: '28px',
            height: '28px',
            color: '#94a3b8',
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            flexShrink: 0,
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color = '#f1f5f9';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.16)';
            e.currentTarget.style.transform = 'scale(1.08)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = '#94a3b8';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          ✕
        </button>
      </div>

      {/* One featured path keeps the initial choice and scene uncluttered. */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr)',
          gap: '14px'
        }}
      >
        {[featuredCard].map(card => (
          <div
            key={card.id}
            onClick={() => handleCardClick(card)}
            style={{
              background: 'rgba(255, 255, 255, 0.035)',
              border: `1px solid ${card.accentBorder}`,
              borderRadius: '14px',
              padding: '16px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '12px',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = `0 12px 28px rgba(0, 0, 0, 0.5), 0 0 20px ${card.badgeBg}`;
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.07)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.035)';
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '24px' }}>{card.icon}</span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: card.badgeColor,
                    background: card.badgeBg,
                    border: `1px solid ${card.accentBorder}`,
                    padding: '2px 8px',
                    borderRadius: '8px'
                  }}
                >
                  {card.badge}
                </span>
              </div>
              <h3 style={{ fontSize: '14px', fontWeight: 650, margin: '0 0 6px 0', color: '#f8fafc' }}>
                {card.title}
              </h3>
              <p style={{ fontSize: '11.5px', color: '#94a3b8', margin: 0, lineHeight: 1.45 }}>
                {card.description}
              </p>
            </div>

            {/* Highlights Tags & Action Prompt */}
            <div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '10px' }}>
                {card.highlights.map((h, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: '9.5px',
                      color: '#cbd5e1',
                      background: 'rgba(255, 255, 255, 0.06)',
                      padding: '2px 6px',
                      borderRadius: '5px'
                    }}
                  >
                    ✓ {h}
                  </span>
                ))}
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                  paddingTop: '8px'
                }}
              >
                <span style={{ fontSize: '11px', fontWeight: 600, color: card.badgeColor }}>
                  {t.loadSimulation}
                </span>
                <span style={{ fontSize: '12px', color: card.badgeColor }}>→</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* The one guided action is the default next step. */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          paddingTop: '6px'
        }}
      >
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => {
              playAudioFx('tink');
              onOpenPitchDirector();
            }}
            style={{
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.15), rgba(2, 132, 199, 0.25))',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              color: '#38bdf8',
              borderRadius: '9px',
              padding: '8px 14px',
              fontSize: '12px',
              fontWeight: 650,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '7px'
            }}
          >
            <span>🎬</span>
            <span>{t.guidedTourButton}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              playAudioFx('switch_click');
              useWorldStore.getState().toggleCausalObservability();
            }}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#e2e8f0',
              borderRadius: '9px',
              padding: '8px 14px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '7px'
            }}
            title={t.observabilityTooltip}
          >
            <span>⚡</span>
            <span>{t.observabilityGizmo}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
