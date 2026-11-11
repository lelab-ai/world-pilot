// src/ui/CertifiedExperiencesModal.tsx
import React, { useState, useMemo } from 'react';
import {
  certifiedExperiencesRegistry,
  CertifiedExperience
} from '../library/certifiedExperiences';
import { auditExperiencePrompt, ExperienceAuditReport } from '../engine/experienceAuditor';
import { playAudioFx } from '../engine/evaluator';
import { useWorldStore } from '../engine/store';
import { parseInstruction } from '../authoring/parser';
import { exportWorldToYaml } from '../engine/worldFormat';

const CATEGORY_ICONS: Record<string, string> = {
  'Tous': '🌐',
  'Mode & Luxe Showroom': '💎',
  'Cuisine & Gastronomie': '🍳',
  'Mécanique & Automobile': '🏎️',
  'Métavers Victoria VR': '🥽',
  'Aérospatial & Futurisme': '🚀',
  'Chimie & Sciences': '⚗️',
  'Physique & Électricité': '⚡',
  'Physique & Réactions': '⚡',
  'Ville Parisienne & FLE': '☕',
  'Réunion & Conférence': '💼',
  'Bureautique & Réunion': '💼',
  'Web3 & Innovation': '🪙',
  'Ameublement & DIY': '🪑',
  'Tech & Game Design': '🎮'
};

const CATEGORY_NAMES_EN: Record<string, string> = {
  'Tous': 'All',
  'Mode & Luxe Showroom': 'Fashion & Luxury Showroom',
  'Cuisine & Gastronomie': 'Culinary Arts & Gastronomy',
  'Mécanique & Automobile': 'Mechanics & Automotive',
  'Métavers Victoria VR': 'Victoria VR Metaverse',
  'Aérospatial & Futurisme': 'Aerospace & Futurism',
  'Chimie & Sciences': 'Chemistry & Sciences',
  'Physique & Électricité': 'Physics & Electricity',
  'Physique & Réactions': 'Physics & Reactions',
  'Ville Parisienne & FLE': 'Parisian City & FLE',
  'Réunion & Conférence': 'Meeting & Conference',
  'Bureautique & Réunion': 'Office & Meeting',
  'Web3 & Innovation': 'Web3 & Innovation',
  'Ameublement & DIY': 'Furniture & DIY',
  'Tech & Game Design': 'Tech & Game Design'
};

interface CertifiedExperiencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchExperience: (prompt: string, title?: string) => void;
  initialSearchQuery?: string;
}

export const CertifiedExperiencesModal: React.FC<CertifiedExperiencesModalProps> = ({
  isOpen,
  onClose,
  onLaunchExperience,
  initialSearchQuery = ''
}) => {
  const uiLanguage = useWorldStore(state => state.uiLanguage);
  const isFr = uiLanguage === 'fr';

  const getExpTitle = (exp: CertifiedExperience) => (!isFr && exp.titleEn ? exp.titleEn : exp.title);
  const getExpDesc = (exp: CertifiedExperience) => (!isFr && exp.descriptionEn ? exp.descriptionEn : exp.description);
  const getExpPrompt = (exp: CertifiedExperience) => (!isFr && exp.promptEn ? exp.promptEn : exp.prompt);
  const getExpCat = (cat: string) => (!isFr && CATEGORY_NAMES_EN[cat] ? CATEGORY_NAMES_EN[cat] : cat);
  const getExpObjects = (exp: CertifiedExperience) => (!isFr && exp.realisticObjectsEn ? exp.realisticObjectsEn : exp.realisticObjects);
  const getExpInteractions = (exp: CertifiedExperience) => (!isFr && exp.interactionHighlightsEn ? exp.interactionHighlightsEn : exp.interactionHighlights);
  const getExpHesitations = (exp: CertifiedExperience) => (!isFr && exp.hesitationsResolvedEn ? exp.hesitationsResolvedEn : exp.hesitationsResolved);

  const [onlyValidated, setOnlyValidated] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');
  const [searchQuery, setSearchQuery] = useState<string>(initialSearchQuery);

  React.useEffect(() => {
    if (initialSearchQuery) {
      setSearchQuery(initialSearchQuery);
      setOnlyValidated(false);
    }
  }, [initialSearchQuery, isOpen]);

  const allExperiences: Array<CertifiedExperience & { isValidated: boolean }> =
    certifiedExperiencesRegistry.map(e => ({ ...e, isValidated: true }));

  const [selectedExp, setSelectedExp] = useState<CertifiedExperience | null>(
    certifiedExperiencesRegistry[0] || null
  );
  const [liveAuditReport, setLiveAuditReport] = useState<ExperienceAuditReport | null>(null);
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [viewMode, setViewMode] = useState<'audit' | 'yaml'>('audit');
  const [yamlCopied, setYamlCopied] = useState<boolean>(false);

  const selectedExpYaml = useMemo(() => {
    if (!selectedExp) return '';
    try {
      const res = parseInstruction(selectedExp.actionPresetCommand, { selectedEntityId: null, pointedEntityId: null });
      const entities: Record<string, any> = {};
      (res.patch.entitiesCreated || []).forEach((e: any) => { entities[e.id] = e; });
      const rules: Record<string, any> = {};
      (res.patch.rulesChanged || []).forEach((r: any) => { rules[r.id] = r; });
      const quests: Record<string, any> = {};
      (res.patch.questsAdded || []).forEach((q: any) => { quests[q.id] = q; });
      const invariants: Record<string, any> = {};
      (res.patch.invariantsAdded || []).forEach((inv: any) => { invariants[inv.id] = inv; });

      return exportWorldToYaml({
        version: 1,
        ir: {
          entities,
          rules,
          quests,
          invariants,
          activeQuestId: res.patch.activeQuestId || null
        },
        flags: {}
      });
    } catch {
      return '# Impossible de compiler le fichier YAML pour cette expérience.';
    }
  }, [selectedExp]);

  if (!isOpen) return null;

  const validatedCount = certifiedExperiencesRegistry.length;
  const baseList = onlyValidated ? allExperiences.filter(e => e.isValidated) : allExperiences;
  const categories = ['Tous', ...Array.from(new Set(allExperiences.map(e => e.category)))];

  const filteredList = baseList.filter(e => {
    const matchesCategory = selectedCategory === 'Tous' || e.category === selectedCategory;
    if (!matchesCategory) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      e.title.toLowerCase().includes(q) ||
      (e.titleEn && e.titleEn.toLowerCase().includes(q)) ||
      e.prompt.toLowerCase().includes(q) ||
      (e.promptEn && e.promptEn.toLowerCase().includes(q)) ||
      e.description.toLowerCase().includes(q) ||
      (e.descriptionEn && e.descriptionEn.toLowerCase().includes(q)) ||
      e.category.toLowerCase().includes(q) ||
      (e.categoryEn && e.categoryEn.toLowerCase().includes(q)) ||
      e.realisticObjects.some(obj => obj.toLowerCase().includes(q)) ||
      (e.realisticObjectsEn && e.realisticObjectsEn.some(obj => obj.toLowerCase().includes(q))) ||
      e.interactionHighlights.some(act => act.toLowerCase().includes(q)) ||
      (e.interactionHighlightsEn && e.interactionHighlightsEn.some(act => act.toLowerCase().includes(q))) ||
      e.hesitationsResolved.some(h => h.toLowerCase().includes(q)) ||
      (e.hesitationsResolvedEn && e.hesitationsResolvedEn.some(h => h.toLowerCase().includes(q)))
    );
  });

  const handleRunLiveAudit = async (promptToAudit: string, categoryHint: string) => {
    setIsAuditing(true);
    playAudioFx('switch_click');
    try {
      const report = await auditExperiencePrompt(promptToAudit, categoryHint);
      setLiveAuditReport(report);
      playAudioFx('chime');
    } catch (err) {
      console.error('Erreur durant l’audit en direct :', err);
    } finally {
      setIsAuditing(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="certified-experiences-title"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(5, 11, 24, 0.85)',
        backdropFilter: 'blur(12px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '95%',
          maxWidth: '1240px',
          maxHeight: '90vh',
          backgroundColor: '#0c1524',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          borderRadius: '16px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.75), 0 0 40px rgba(16, 185, 129, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: '#f8fafc',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}
      >
        {/* EN-TÊTE MODALE */}
        <div
          style={{
            padding: '20px 28px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.12) 0%, rgba(12, 21, 36, 0.4) 100%)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ fontSize: '28px' }}>🌐</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 id="certified-experiences-title" style={{ margin: 0, fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: '#f1f5f9' }}>
                  {isFr ? "Explorateur d'expériences immersives" : "Immersive Experiences Explorer"}
                </h2>
                <span
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    color: '#34d399',
                    border: '1px solid rgba(52, 211, 153, 0.4)',
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: '12px',
                    letterSpacing: '0.03em'
                  }}
                >
                  {allExperiences.length} {isFr ? 'expériences' : 'experiences'} ({validatedCount} {isFr ? 'validées' : 'validated'})
                </span>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#94a3b8' }}>
                {isFr
                  ? "Explorez par domaine ou activez le filtre pour n'afficher que les expériences auditées et validées à 100%."
                  : "Explore by domain or filter to view audited experiences validated at 100%."}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label={isFr ? "Fermer la fenêtre" : "Close window"}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: '8px',
              color: '#94a3b8',
              width: '34px',
              height: '34px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.color = '#94a3b8';
            }}
          >
            ✕
          </button>
        </div>

        {/* BARRE DE RECHERCHE ET FILTRAGE */}
        <div
          style={{
            padding: '12px 28px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
            backgroundColor: 'rgba(10, 16, 28, 0.7)'
          }}
        >
          {/* Moteur de recherche par mots-clés */}
          <div style={{ position: 'relative', width: '280px', maxWidth: '100%' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: '#94a3b8' }}>
              🔍
            </span>
            <input
              type="text"
              placeholder={isFr ? "Rechercher (batterie, chimie, ratatouille, ohm...)" : "Search (battery, chemistry, ratatouille, ohm...)"}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 32px 8px 36px',
                borderRadius: '8px',
                border: searchQuery ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.14)',
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                color: '#f8fafc',
                fontSize: '12.5px',
                outline: 'none',
                boxShadow: searchQuery ? '0 0 10px rgba(16, 185, 129, 0.2)' : 'none'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                aria-label={isFr ? "Effacer la recherche" : "Clear search"}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '12px',
                  padding: '2px'
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* BADGE : 100% CERTIFIÉES ET VALIDÉES */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              padding: '7px 14px',
              borderRadius: '20px',
              border: '1.5px solid #10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.22)',
              color: '#34d399',
              fontSize: '12px',
              fontWeight: 650,
              whiteSpace: 'nowrap'
            }}
            title={isFr ? "Toutes les expériences présentées sont certifiées conformes (audit qualité 100/100, physique et causalité validées)" : "All presented experiences are certified compliant (100/100 quality audit, verified physics and causality)"}
          >
            <span>🛡️</span>
            <span>{isFr ? `Expériences certifiées (${validatedCount})` : `Certified Experiences (${validatedCount})`}</span>
          </div>

          {/* Filtres par catégorie avec icônes et décompte */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', alignItems: 'center' }}>
            {categories.map((cat) => {
              const isActive = selectedCategory === cat;
              const count = cat === 'Tous' ? baseList.length : baseList.filter(e => e.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    playAudioFx('tink');
                  }}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    border: isActive ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.12)',
                    backgroundColor: isActive ? 'rgba(16, 185, 129, 0.22)' : 'rgba(255, 255, 255, 0.04)',
                    color: isActive ? '#34d399' : '#cbd5e1',
                    fontSize: '11.5px',
                    fontWeight: isActive ? 600 : 500,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <span>{CATEGORY_ICONS[cat] || '📦'}</span>
                  <span>{getExpCat(cat)}</span>
                  <span style={{ opacity: 0.65, fontSize: '10px' }}>({count})</span>
                </button>
              );
            })}

            {/* Raccourci vers les 30 Scènes d'Immersion FLE */}
            <button
              onClick={() => {
                onClose();
                window.dispatchEvent(new CustomEvent('worldpilot_open_fle_modal'));
              }}
              title={isFr ? "Ouvrir le module complet d'apprentissage du français avec 30 scènes immersives" : "Open full French learning module with 30 immersive scenes"}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '11.5px',
                fontWeight: 700,
                border: '1px solid rgba(56, 189, 248, 0.45)',
                backgroundColor: 'rgba(56, 189, 248, 0.16)',
                color: '#38bdf8',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 10px rgba(56, 189, 248, 0.2)',
                transition: 'all 0.15s ease',
              }}
            >
              <span>🇫🇷</span>
              <span>{isFr ? 'Immersion FLE' : 'French Immersion'}</span>
              <span style={{ background: '#0284c7', color: '#fff', fontSize: '9.5px', padding: '1px 6px', borderRadius: '8px', fontWeight: 800 }}>30</span>
            </button>
          </div>
        </div>

        {/* CORPS PRINCIPAL : LISTE GAUCHE + INSPECTEUR DROITE */}
        <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          
          {/* LISTE DES EXPÉRIENCES (COLONNE GAUCHE) */}
          <div
            style={{
              width: '380px',
              borderRight: '1px solid rgba(255, 255, 255, 0.08)',
              overflowY: 'auto',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              backgroundColor: 'rgba(10, 16, 28, 0.4)'
            }}
          >
            {/* Compteur de résultats */}
            <div style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', justifyContent: 'space-between', padding: '0 2px' }}>
              <span>{filteredList.length} {isFr ? 'expérience(s) trouvée(s)' : 'experience(s) found'}</span>
              {searchQuery && <span style={{ color: '#10b981' }}>{isFr ? `Filtre actif : « ${searchQuery} »` : `Active filter: "${searchQuery}"`}</span>}
            </div>

            {filteredList.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: '#94a3b8', fontSize: '13px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '32px' }}>🔎</span>
                <div>{isFr ? `Aucune expérience ne correspond à votre recherche « ${searchQuery} »` : `No experience matches your search "${searchQuery}"`}</div>
                <button
                  onClick={() => { setSearchQuery(''); setSelectedCategory('Tous'); }}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#34d399',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  {isFr ? 'Réinitialiser les filtres' : 'Reset filters'}
                </button>
              </div>
            ) : (
              filteredList.map((exp) => {
                const isSelected = selectedExp?.id === exp.id;
                return (
                  <div
                    key={exp.id}
                    onClick={() => {
                      setSelectedExp(exp);
                      setLiveAuditReport(null);
                      playAudioFx('tink');
                    }}
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    border: isSelected ? '1.5px solid #10b981' : '1px solid rgba(255, 255, 255, 0.08)',
                    backgroundColor: isSelected ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '20px' }}>{exp.thumbnailIcon}</span>
                      <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>
                        {getExpCat(exp.category)}
                      </span>
                    </div>
                    <span
                      style={{
                        backgroundColor: 'rgba(16, 185, 129, 0.25)',
                        color: '#34d399',
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '10px',
                        border: '1px solid rgba(52, 211, 153, 0.3)'
                      }}
                    >
                      Score {exp.auditScore}/100
                    </span>
                  </div>

                  <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: isSelected ? '#34d399' : '#f1f5f9', lineHeight: 1.3 }}>
                    {getExpTitle(exp)}
                  </h3>

                  <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', lineClamp: 2, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {getExpDesc(exp)}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '4px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <span style={{ fontSize: '11px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>✅</span> {isFr ? 'Validé · 0 friction' : 'Validated · 0 friction'}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        useWorldStore.getState().setAppMode('simulation');
                        onLaunchExperience(exp.actionPresetCommand, getExpTitle(exp));
                        onClose();
                      }}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: '1px solid rgba(16, 185, 129, 0.4)',
                        backgroundColor: 'rgba(16, 185, 129, 0.2)',
                        color: '#34d399',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <span>🚀</span> {isFr ? 'Lancer' : 'Launch'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

          {/* DÉTAILS DE L'EXPÉRIENCE SÉLECTIONNÉE (COLONNE DROITE) */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {selectedExp ? (
              <>
                {/* BANDEAU SUPÉRIEUR EXPÉRIENCE */}
                <div
                  style={{
                    padding: '18px 22px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span style={{ fontSize: '24px' }}>{selectedExp.thumbnailIcon}</span>
                        <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 600, textTransform: 'uppercase' }}>
                          {getExpCat(selectedExp.category)}
                        </span>
                        <span style={{ color: 'rgba(255, 255, 255, 0.3)' }}>·</span>
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                          {isFr ? `Certifiée le ${selectedExp.certifiedDate}` : `Certified on ${selectedExp.certifiedDate}`}
                        </span>
                      </div>
                      <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#f8fafc' }}>
                        {getExpTitle(selectedExp)}
                      </h2>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          padding: '8px 14px',
                          borderRadius: '10px',
                          backgroundColor: 'rgba(16, 185, 129, 0.2)',
                          border: '1px solid rgba(16, 185, 129, 0.4)',
                          textAlign: 'center'
                        }}
                      >
                        <div style={{ fontSize: '10px', color: '#a7f3d0', fontWeight: 700 }}>
                          {isFr ? 'Statut officiel' : 'Official status'}
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: '#34d399' }}>
                          {(selectedExp as any).isValidated !== false ? (isFr ? 'Validé (100%)' : 'Validated (100%)') : (isFr ? 'Démo interactive' : 'Interactive demo')}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button
                          onClick={() => {
                            useWorldStore.getState().setAppMode('simulation');
                            onLaunchExperience(selectedExp.actionPresetCommand, getExpTitle(selectedExp));
                            onClose();
                          }}
                          style={{
                            padding: '10px 18px',
                            borderRadius: '10px',
                            border: 'none',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: '#ffffff',
                            fontSize: '13.5px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                            transition: 'transform 0.15s ease'
                          }}
                        >
                          <span>🚀</span> {isFr ? "Lancer l'expérience" : "Launch Experience"}
                        </button>
                        <button
                          onClick={() => {
                            onLaunchExperience(selectedExp.actionPresetCommand, getExpTitle(selectedExp));
                            useWorldStore.getState().setAppMode('simulation');
                            if (!useWorldStore.getState().isCinematicTourActive) {
                              useWorldStore.getState().toggleCinematicTour();
                            }
                            onClose();
                          }}
                          style={{
                            padding: '10px 14px',
                            borderRadius: '10px',
                            border: '1px solid rgba(56, 189, 248, 0.4)',
                            background: 'rgba(56, 189, 248, 0.16)',
                            color: '#38bdf8',
                            fontSize: '13px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.15s ease'
                          }}
                          title={isFr ? "Lancer l'expérience en immersion plein écran avec visite guidée cinématique 360°" : "Launch full-screen immersive experience with 360° cinematic tour"}
                        >
                          <span>🎬</span> {isFr ? 'Visite 360°' : '360° Tour'}
                        </button>
                        <button
                          onClick={() => {
                            setViewMode(viewMode === 'yaml' ? 'audit' : 'yaml');
                            playAudioFx('switch_click');
                          }}
                          style={{
                            padding: '10px 14px',
                            borderRadius: '10px',
                            border: viewMode === 'yaml' ? '1.5px solid #0ea5e9' : '1px solid rgba(14, 165, 233, 0.4)',
                            background: viewMode === 'yaml' ? '#0284c7' : 'rgba(14, 165, 233, 0.16)',
                            color: viewMode === 'yaml' ? '#ffffff' : '#38bdf8',
                            fontSize: '13px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.15s ease'
                          }}
                          title={isFr ? "Afficher le fichier .world.yaml complet de cette expérience certifiée" : "Display complete .world.yaml file for this certified experience"}
                        >
                          <span>📄</span> {viewMode === 'yaml' ? (isFr ? 'Fiche Audit' : 'Audit Sheet') : (isFr ? 'Fichier YAML' : 'YAML File')}
                        </button>
                      </div>
                    </div>
                  </div>

                  <p style={{ margin: 0, fontSize: '13.5px', color: '#cbd5e1', lineHeight: 1.5 }}>
                    {getExpDesc(selectedExp)}
                  </p>

                  {/* PROMPT OFFICIEL */}
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(56, 189, 248, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: '13px', color: '#38bdf8', fontWeight: 600 }}>Prompt :</span>
                      <code style={{ fontSize: '12.5px', color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        « {getExpPrompt(selectedExp)} »
                      </code>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(getExpPrompt(selectedExp));
                        playAudioFx('tink');
                      }}
                      title={isFr ? "Copier le prompt" : "Copy prompt"}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        color: '#94a3b8',
                        fontSize: '11px',
                        cursor: 'pointer'
                      }}
                    >
                      📋 {isFr ? 'Copier' : 'Copy'}
                    </button>
                  </div>
                </div>

                {viewMode === 'yaml' ? (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      backgroundColor: '#0a0f1d',
                      borderRadius: '12px',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 16px',
                        backgroundColor: 'rgba(30, 41, 59, 0.9)',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                        flexWrap: 'wrap',
                        gap: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px' }}>📄</span>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc', fontFamily: 'monospace' }}>
                          {selectedExp.id}.world.yaml
                        </span>
                        <span
                          style={{
                            background: '#10b981',
                            color: '#ffffff',
                            borderRadius: '10px',
                            padding: '1px 8px',
                            fontSize: '9px',
                            fontWeight: 800
                          }}
                        >
                          {isFr ? 'SUBSTRAT DÉCLARATIF OFFICIEL' : 'OFFICIAL DECLARATIVE SUBSTRATE'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(selectedExpYaml);
                            setYamlCopied(true);
                            playAudioFx('chime');
                            setTimeout(() => setYamlCopied(false), 2000);
                          }}
                          style={{
                            background: yamlCopied ? '#10b981' : 'rgba(255, 255, 255, 0.08)',
                            color: '#ffffff',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '6px',
                            padding: '5px 10px',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          {yamlCopied ? (isFr ? '✓ Copié !' : '✓ Copied!') : (isFr ? '📋 Copier le YAML' : '📋 Copy YAML')}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const blob = new Blob([selectedExpYaml], { type: 'text/yaml;charset=utf-8' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `${selectedExp.id}.world.yaml`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                            playAudioFx('switch_click');
                          }}
                          style={{
                            background: 'rgba(255, 255, 255, 0.08)',
                            color: '#ffffff',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '6px',
                            padding: '5px 10px',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          {isFr ? '💾 Télécharger .world.yaml' : '💾 Download .world.yaml'}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            useWorldStore.getState().importWorldYaml(selectedExpYaml);
                            playAudioFx('fanfare');
                            onClose();
                          }}
                          style={{
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '5px 12px',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          {isFr ? '⚡ Importer & Lancer ce YAML' : '⚡ Import & Launch YAML'}
                        </button>
                      </div>
                    </div>

                    <pre
                      style={{
                        margin: 0,
                        padding: '14px 18px',
                        maxHeight: '440px',
                        overflowY: 'auto',
                        fontSize: '11.5px',
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                        lineHeight: 1.5,
                        color: '#f1f5f9',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all'
                      }}
                    >
                      {selectedExpYaml}
                    </pre>
                  </div>
                ) : (
                  <>
                    {/* GRILLE DES 3 PILIERS DE CERTIFICATION */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                  
                  {/* PILIER 1 : OBJETS 3D RÉALISTES */}
                  <div
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '16px' }}>🚗</span>
                      <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: 700, color: '#38bdf8' }}>
                        {isFr ? '1. Objets 3D réalistes' : '1. Realistic 3D Objects'}
                      </h4>
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                      {isFr ? 'Zéro fallback absurde · Modèles réalistes validés' : 'Zero fallback shapes · Validated realistic meshes'}
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: '#cbd5e1' }}>
                      {getExpObjects(selectedExp).map((obj, i) => (
                        <li key={i}>{obj}</li>
                      ))}
                    </ul>
                  </div>

                  {/* PILIER 2 : INTERACTIONS & CAUSALITÉ */}
                  <div
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '16px' }}>⚡</span>
                      <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: 700, color: '#f59e0b' }}>
                        {isFr ? '2. Causalité et règles' : '2. Causality and rules'}
                      </h4>
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                      {isFr ? 'Sons procéduraux · Retours visuels · Invariants' : 'Procedural audio · Visual feedback · Invariants'}
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: '#cbd5e1' }}>
                      {getExpInteractions(selectedExp).map((act, i) => (
                        <li key={i}>{act}</li>
                      ))}
                    </ul>
                  </div>

                  {/* PILIER 3 : HÉSITATIONS HUMAINES RÉSOLUES */}
                  <div
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '16px' }}>🧠</span>
                      <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: 700, color: '#ec4899' }}>
                        {isFr ? '3. Ergonomie et hésitations résolues' : '3. Cognitive ergonomics & resolved friction'}
                      </h4>
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                      {isFr ? 'Friction cognitive éliminée · Ordre séquentiel garanti' : 'Cognitive friction eliminated · Enforced sequence'}
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: '#cbd5e1' }}>
                      {getExpHesitations(selectedExp).map((hes, i) => (
                        <li key={i}>{hes}</li>
                      ))}
                    </ul>
                  </div>

                </div>

                {/* SECTION AUDITEUR EN DIRECT */}
                <div
                  style={{
                    padding: '18px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '18px' }}>🤖</span>
                      <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#f8fafc' }}>
                        {isFr ? "Moteur autonome d'audit et de test en direct" : "Autonomous live audit and testing engine"}
                      </h4>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        disabled={isAuditing}
                        onClick={() => handleRunLiveAudit(selectedExp.prompt, selectedExp.category)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '8px',
                          border: '1px solid rgba(56, 189, 248, 0.4)',
                          backgroundColor: isAuditing ? 'rgba(56, 189, 248, 0.1)' : 'rgba(56, 189, 248, 0.2)',
                          color: '#38bdf8',
                          fontSize: '12.5px',
                          fontWeight: 600,
                          cursor: isAuditing ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <span>{isAuditing ? '⏳' : '🔍'}</span>
                        {isAuditing ? (isFr ? 'Audit en cours...' : 'Auditing...') : (isFr ? 'Auditer cette expérience' : 'Audit this experience')}
                      </button>
                    </div>
                  </div>

                  {/* Test d'un prompt personnalisé */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder={isFr ? "Ou tester un autre prompt à auditer..." : "Or test another prompt to audit..."}
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && customPrompt.trim()) {
                          handleRunLiveAudit(customPrompt.trim(), selectedExp?.category || 'Formation Technique');
                        }
                      }}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        backgroundColor: 'rgba(0, 0, 0, 0.3)',
                        color: '#f8fafc',
                        fontSize: '12.5px'
                      }}
                    />
                    <button
                      disabled={isAuditing || !customPrompt.trim()}
                      onClick={() => handleRunLiveAudit(customPrompt.trim(), selectedExp?.category || 'Formation Technique')}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '8px',
                        border: '1px solid rgba(16, 185, 129, 0.4)',
                        backgroundColor: isAuditing || !customPrompt.trim() ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.2)',
                        color: '#34d399',
                        fontSize: '12.5px',
                        fontWeight: 600,
                        cursor: isAuditing || !customPrompt.trim() ? 'not-allowed' : 'pointer',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {isFr ? 'Auditer le prompt' : 'Audit prompt'}
                    </button>
                  </div>

                  {liveAuditReport && (
                    <div
                      style={{
                        padding: '14px',
                        borderRadius: '8px',
                        backgroundColor: liveAuditReport.status === 'validated' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        border: liveAuditReport.status === 'validated' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: liveAuditReport.status === 'validated' ? '#34d399' : '#f87171' }}>
                          {liveAuditReport.status === 'validated' ? '✅' : '⚠️'} {isFr ? `Résultat de l'audit : statut ${liveAuditReport.status.toLowerCase()} (${liveAuditReport.overallScore}/100)` : `Audit result: status ${liveAuditReport.status.toLowerCase()} (${liveAuditReport.overallScore}/100)`}
                        </span>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                          ID : {liveAuditReport.id}
                        </span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '4px' }}>
                        <div style={{ padding: '8px', borderRadius: '6px', backgroundColor: 'rgba(0, 0, 0, 0.2)', textAlign: 'center' }}>
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>{isFr ? 'Objets 3D réalistes' : 'Realistic 3D Objects'}</div>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: '#38bdf8' }}>
                            {liveAuditReport.objects3d.realisticEntitiesCount} / {liveAuditReport.objects3d.totalEntities}
                          </div>
                        </div>
                        <div style={{ padding: '8px', borderRadius: '6px', backgroundColor: 'rgba(0, 0, 0, 0.2)', textAlign: 'center' }}>
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>{isFr ? 'Règles définies' : 'Defined rules'}</div>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: '#f59e0b' }}>
                            {liveAuditReport.interactions.rulesCount}
                          </div>
                        </div>
                        <div style={{ padding: '8px', borderRadius: '6px', backgroundColor: 'rgba(0, 0, 0, 0.2)', textAlign: 'center' }}>
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>{isFr ? 'Stabilité Rapier' : 'Rapier stability'}</div>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: '#10b981' }}>
                            {liveAuditReport.fluidity.passed ? (isFr ? '100% fluide' : '100% smooth') : (isFr ? 'Ajusté' : 'Adjusted')}
                          </div>
                        </div>
                        <div style={{ padding: '8px', borderRadius: '6px', backgroundColor: 'rgba(0, 0, 0, 0.2)', textAlign: 'center' }}>
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>{isFr ? 'Hésitations résolues' : 'Resolved hesitations'}</div>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: '#ec4899' }}>
                            {liveAuditReport.cognitiveErgonomics.hesitationPointsResolved} / {liveAuditReport.cognitiveErgonomics.totalHesitationPoints}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b' }}>
            {isFr ? 'Sélectionnez une expérience certifiée à gauche pour afficher les détails.' : 'Select a certified experience on the left to view details.'}
          </div>
        )}
          </div>

        </div>

      </div>
    </div>
  );
};
