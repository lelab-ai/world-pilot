// src/engine/slices/runtimeUISlice.ts
// Viewport, Post-Processing, Audio, Domain Modals & Real-Time Interactions

import type { StateCreator } from 'zustand';
import type { StoreState, RuntimeUISlice, StickyNote, CameraPreset, CinematicPreset, PlatingStyle, PlatingGarnish, ChefEvaluation } from './types';
import { getWorldTheme } from '../../library/worldThemes';
import { ambientAudio } from '../ambientAudio';
import { getAchievement } from '../achievements';
import { evaluatePublishReadiness, LandPresetType } from '../publishReadiness';
import { playAudioFx } from '../evaluator';
import { speakAgentDialogue } from '../agentDialogues';
import { tickCoWorker } from '../coWorkerAgent';
import { evaluateAnomalyResolution } from '../anomalyEngine';

export const DEFAULT_COLLABORATION_NOTES: StickyNote[] = [
  {
    id: 'note-1',
    text: 'Cartographier le parcours utilisateur et identifier les points de friction majeurs.',
    category: 'idea',
    color: 'yellow',
    author: 'Facilitateur Sprint',
    column: 'in_progress',
    votes: 4,
    createdAt: 1790000000000,
  },
  {
    id: 'note-2',
    text: 'Tester l’ergonomie spatiale 3D avec un groupe pilote de 5 participants.',
    category: 'action',
    color: 'green',
    author: 'Designer UX',
    column: 'backlog',
    votes: 3,
    createdAt: 1790001000000,
  },
  {
    id: 'note-3',
    text: 'Intégrer les retours sonores haptiques pour confirmer les validations d\'étapes.',
    category: 'idea',
    color: 'pink',
    author: 'Dev Audio',
    column: 'done',
    votes: 6,
    createdAt: 1790002000000,
  },
  {
    id: 'note-4',
    text: 'Quel est le ratio optimal entre repères visuels 3D et consignes vocales ?',
    category: 'question',
    color: 'blue',
    author: 'Ergonome',
    column: 'in_progress',
    votes: 2,
    createdAt: 1790003000000,
  },
  {
    id: 'note-5',
    text: 'Adopter la convention des micro-toasts dorés pour les récompenses d\'apprentissage.',
    category: 'decision',
    color: 'orange',
    author: 'Chef de Projet',
    column: 'done',
    votes: 5,
    createdAt: 1790004000000,
  },
];

const loadInitialAchievements = (): Record<string, number> => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem('worldpilot_unlocked_achievements');
    return raw ? JSON.parse(raw) : {};
  } catch (_) {
    return {};
  }
};

const loadInitialMasteredVocab = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('worldpilot_mastered_vocab');
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
};

const loadInitialCollaborationNotes = (): StickyNote[] => {
  if (typeof window === 'undefined') return DEFAULT_COLLABORATION_NOTES;
  try {
    const raw = localStorage.getItem('worldpilot_collaboration_notes');
    return raw ? JSON.parse(raw) : DEFAULT_COLLABORATION_NOTES;
  } catch (_) {
    return DEFAULT_COLLABORATION_NOTES;
  }
};

export function getCookingDonenessStage(doneness: number): { label: string; color: string; icon: string } {
  if (doneness <= 0) return { label: 'Cru / Préparé', color: '#94a3b8', icon: '❄️' };
  if (doneness < 30) return { label: 'Saisie & Chauffage', color: '#38bdf8', icon: '🟡' };
  if (doneness < 75) return { label: 'Mijotage à point', color: '#10b981', icon: '🟢' };
  if (doneness < 100) return { label: 'Réduction parfumée', color: '#f59e0b', icon: '✨' };
  return { label: 'Confit caramélisé', color: '#ea580c', icon: '🔥' };
}

export function evaluateDish(params: {
  doneness: number;
  seasoning: { salt: number; oil: number; herbs: number };
  isPlated: boolean;
  heatLevel: number;
}): ChefEvaluation {
  const { doneness, seasoning, isPlated } = params;

  let cookingScore = 0;
  let cookingFeedback = '';
  if (doneness >= 80 && doneness <= 95) {
    cookingScore = 40;
    cookingFeedback = "Cuisson d'orfèvre : réduction soyeuse, sucs concentrés et texture fondante parfaite.";
  } else if (doneness >= 65 && doneness < 80) {
    cookingScore = 34;
    cookingFeedback = "Très belle cuisson : texture tendre et fondante, mijotage bien mené.";
  } else if (doneness > 95) {
    cookingScore = 32;
    cookingFeedback = "Réduction très poussée : texture confite et arômes concentrés avec légère caramélisation.";
  } else if (doneness >= 40 && doneness < 65) {
    cookingScore = 24;
    cookingFeedback = "Légère sous-cuisson : les ingrédients méritent quelques minutes de mijotage supplémentaires.";
  } else if (doneness >= 15 && doneness < 40) {
    cookingScore = 14;
    cookingFeedback = "Cuisson insuffisante : textures encore trop fermes et saveurs insuffisamment liées.";
  } else {
    cookingScore = 6;
    cookingFeedback = "Plat quasi cru : le feu n'a pas eu le temps de révéler les arômes.";
  }

  let saltPts = 0;
  if (seasoning.salt >= 20 && seasoning.salt <= 60) saltPts = 12;
  else if (seasoning.salt > 60 && seasoning.salt <= 80) saltPts = 8;
  else if (seasoning.salt > 0 && seasoning.salt < 20) saltPts = 7;
  else if (seasoning.salt > 80) saltPts = 4;
  else saltPts = 2;

  let oilPts = 0;
  if (seasoning.oil >= 20 && seasoning.oil <= 60) oilPts = 12;
  else if (seasoning.oil > 60 && seasoning.oil <= 80) oilPts = 8;
  else if (seasoning.oil > 0 && seasoning.oil < 20) oilPts = 7;
  else if (seasoning.oil > 80) oilPts = 4;
  else oilPts = 2;

  let herbsPts = 0;
  if (seasoning.herbs >= 25 && seasoning.herbs <= 75) herbsPts = 11;
  else if (seasoning.herbs > 75) herbsPts = 8;
  else if (seasoning.herbs > 0 && seasoning.herbs < 25) herbsPts = 6;
  else herbsPts = 2;

  const seasoningScore = saltPts + oilPts + herbsPts;
  let seasoningFeedback = '';
  if (seasoningScore >= 30) {
    seasoningFeedback = "Harmonie aromatique exemplaire : l'huile fruitée, la fleur de sel et les aromates sont en symbiose.";
  } else if (seasoningScore >= 22) {
    seasoningFeedback = "Bel assaisonnement : les saveurs sont agréables et équilibrées.";
  } else if (seasoning.salt === 0 && seasoning.oil === 0 && seasoning.herbs === 0) {
    seasoningFeedback = "Assaisonnement absent : pensez à ajouter fleur de sel, huile d'olive et bouquet garni.";
  } else {
    seasoningFeedback = "Équilibre perfectible : ajustez le sel ou l'infusion d'herbes pour rehausser le profil.";
  }

  let platingScore = 0;
  let platingFeedback = '';
  if (isPlated) {
    platingScore = 25;
    platingFeedback = "Dressage d'exception : service sur assiette gastronomique avec harmonie visuelle et cordon de sauce.";
  } else {
    platingScore = 8;
    platingFeedback = "Présentation en cocotte : dressez sur l'assiette porcelaine pour sublimer le service.";
  }

  const totalScore = Math.min(100, Math.max(10, cookingScore + seasoningScore + platingScore));

  let stars = 1;
  let title = "Commis Débutant";
  if (totalScore >= 90) {
    stars = 5;
    title = "Chef Étoilé d'Exception";
  } else if (totalScore >= 78) {
    stars = 4;
    title = "Maître Restaurateur";
  } else if (totalScore >= 60) {
    stars = 3;
    title = "Cuisinier Confirmé";
  } else if (totalScore >= 45) {
    stars = 2;
    title = "Apprenti Cuisinier";
  } else {
    stars = 1;
    title = "Commis Débutant";
  }

  const recommendations: string[] = [];
  if (doneness < 80) recommendations.push("Prolongez le mijotage pour atteindre entre 80% et 95% de doneness.");
  if (seasoning.salt < 20) recommendations.push("Ajoutez une pincée de fleur de sel (+25%) pour réveiller les sucs.");
  if (seasoning.oil < 20) recommendations.push("Versez un filet d'huile d'olive vierge pour lier la réduction.");
  if (seasoning.herbs < 25) recommendations.push("Infusez le bouquet garni pour diffuser les huiles essentielles.");
  if (!isPlated) recommendations.push("Cliquez sur 'Dresser l'assiette' pour obtenir les 25 points de présentation.");

  return {
    totalScore,
    stars,
    title,
    cookingScore,
    seasoningScore,
    platingScore,
    cookingFeedback,
    seasoningFeedback,
    platingFeedback,
    recommendations
  };
}

export const createRuntimeUISlice: StateCreator<StoreState, [], [], RuntimeUISlice> = (set, get) => ({
  cinematicPreset: 'studio_neutral',
  setCinematicPreset: (cinematicPreset: CinematicPreset) => {
    set(state => ({
      cinematicPreset,
      warnings: [
        ...state.warnings,
        cinematicPreset === 'cinematic'
          ? '🌟 Preset cinématique activé (colorimétrie, bloom et vignettage)'
          : cinematicPreset === 'golden_hour'
          ? '🌅 Ambiance Golden Hour activée (Chaleur solaire, diffusion dorée & flare)'
          : cinematicPreset === 'cyberpunk_neon'
          ? '⚡ Esthétique Cyberpunk Neon activée (Contraste saturé, lueurs néon cyan & magenta)'
          : cinematicPreset === 'studio_neutral'
          ? '📷 Rendu Studio Neutre activé (Étalonnage haute fidélité & netteté chirurgicale)'
          : '🖥️ Rendu Standard WebGL activé (Sans post-traitement cinématographique)'
      ]
    }));
  },
  bloomIntensity: 1.0,
  setBloomIntensity: (bloomIntensity: number) => set({ bloomIntensity }),
  vignetteStrength: 0.12,
  setVignetteStrength: (vignetteStrength: number) => set({ vignetteStrength }),
  chromaticAberration: 0,
  setChromaticAberration: (chromaticAberration: number) => set({ chromaticAberration }),
  showCinematicModal: false,
  setShowCinematicModal: (showCinematicModal: boolean) => set({ showCinematicModal }),

  isDragging3D: false,
  draggedEntityId: null,
  snappedTargetId: null,
  hoveredEntityId: null,
  setDragging3D: (isDragging3D: boolean) => set({ isDragging3D }),
  setDraggedEntityId: (draggedEntityId: string | null) => set({ draggedEntityId }),
  setSnappedTargetId: (snappedTargetId: string | null) => set({ snappedTargetId }),
  setHoveredEntityId: (hoveredEntityId: string | null) => set({ hoveredEntityId }),

  cameraPreset: 'overview',
  setCameraPreset: (cameraPreset: CameraPreset) => set({ cameraPreset }),
  cycleCameraPreset: () => {
    const presets: CameraPreset[] = ['overview', 'table', 'cocotte', 'plate', 'chopping', 'board'];
    const cur = get().cameraPreset;
    const curIdx = presets.indexOf(cur);
    const nextIdx = (curIdx + 1) % presets.length;
    const next = presets[nextIdx];
    get().setCameraPreset(next);
    return next;
  },
  isCinematicTourActive: false,
  toggleCinematicTour: () => {
    const next = !get().isCinematicTourActive;
    if (next) {
      get().unlockAchievement('cinematic_director');
    }
    set({ isCinematicTourActive: next });
  },

  currentAtmosphere: 'atelier',
  setAtmosphere: (atmosphere: string) => {
    const theme = getWorldTheme(atmosphere);
    ambientAudio.setAtmosphere(theme.id);
    set({
      currentAtmosphere: theme.id,
      currentWorldThemeId: theme.id,
      currentGravity: theme.gravity
    });
  },
  currentWorldThemeId: 'earth-atelier',
  currentGravity: [0, -9.81, 0],
  shiftWorldTheme: (themeId: string, customGravity?: [number, number, number]) => {
    const theme = getWorldTheme(themeId);
    const gravity = customGravity || theme.gravity;
    ambientAudio.playWorldShiftSweep();
    ambientAudio.setAtmosphere(theme.id);
    if (theme.id === 'le-refuge') {
      get().unlockAchievement('refuge_alpin');
    }
    set(state => ({
      currentWorldThemeId: theme.id,
      currentAtmosphere: theme.id,
      currentGravity: gravity,
      warnings: [
        ...state.warnings,
        `🌌 Métamorphose de l'univers : ${theme.name} (Gravité : ${theme.gravityLabel})`
      ]
    }));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('worldpilot_theme_shifted', {
        detail: { theme, gravity }
      }));
    }
  },
  setWorldTheme: (themeId: string) => get().shiftWorldTheme(themeId),
  setCustomGravity: (gravity: [number, number, number]) => {
    set(state => ({
      currentGravity: gravity,
      warnings: [
        ...state.warnings,
        `⚙️ Gravité ajustée : [${gravity[0]}, ${gravity[1]}, ${gravity[2]}] m/s²`
      ]
    }));
  },
  isAmbientAudioActive: false,
  toggleAmbientAudio: () => {
    const active = ambientAudio.toggle();
    set({ isAmbientAudioActive: active });
  },
  audioVolume: 0.8,
  isAudioMuted: false,
  setAudioVolume: (volume: number) => {
    const clamped = Math.max(0, Math.min(1, volume));
    ambientAudio.setVolume(clamped);
    if (typeof window !== 'undefined') {
      try { localStorage.setItem('worldpilot_audio_volume', clamped.toString()); } catch (_) {}
    }
    set({ audioVolume: clamped });
  },
  toggleAudioMute: () => {
    const muted = ambientAudio.toggleMute();
    if (typeof window !== 'undefined') {
      try { localStorage.setItem('worldpilot_audio_muted', muted.toString()); } catch (_) {}
      if (muted && window.speechSynthesis) window.speechSynthesis.cancel();
    }
    set({ isAudioMuted: muted });
    return muted;
  },
  isVoiceModeEnabled: false,
  setVoiceModeEnabled: (enabled: boolean) => {
    if (!enabled && typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    set({ isVoiceModeEnabled: enabled });
  },
  toggleVoiceMode: () => {
    const next = !get().isVoiceModeEnabled;
    if (!next && typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    set({ isVoiceModeEnabled: next });
  },
  isSpatialAgentActive: true,
  setSpatialAgentActive: (active: boolean) => set({ isSpatialAgentActive: active }),
  toggleSpatialAgent: () => set(s => ({ isSpatialAgentActive: !s.isSpatialAgentActive })),
  spatialAgentPositionOverride: null,
  setSpatialAgentPositionOverride: (pos: { x: number; y: number; z: number } | null) => set({ spatialAgentPositionOverride: pos }),
  isAgentSpeechEnabled: false,
  toggleAgentSpeech: () => set(s => ({ isAgentSpeechEnabled: !s.isAgentSpeechEnabled })),

  activeWebModalUrl: null,
  activeWebModalTitle: null,
  activeWebModalContent: null,
  activeWebModalEntityId: null,
  openWebModal: (url: string, title?: string, content?: string | null, entityId?: string | null) => {
    set({
      activeWebModalUrl: url,
      activeWebModalTitle: title || 'Navigateur Web',
      activeWebModalContent: content || null,
      activeWebModalEntityId: entityId || null
    });
    if (entityId) {
      try {
        get().dispatch({ type: 'INTERACT', sourceId: entityId });
      } catch (_) {}
    }
  },
  closeWebModal: () => set({ activeWebModalUrl: null, activeWebModalTitle: null, activeWebModalContent: null, activeWebModalEntityId: null }),

  appMode: 'conception',
  setAppMode: (mode: 'conception' | 'simulation' | 'observatoire') => {
    set({ appMode: mode });
    if (mode === 'simulation') {
      set({ isSimulating: true });
    } else if (mode === 'observatoire') {
      get().openResearchDashboard();
    }
  },

  uiLanguage: (typeof localStorage !== 'undefined' && (localStorage.getItem('worldpilot_lang') as 'fr' | 'en')) || 'en',
  setUiLanguage: (uiLanguage: 'fr' | 'en') => {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('worldpilot_lang', uiLanguage);
      } catch (_) {}
    }
    set({ uiLanguage });
  },

  pitchDirectorActId: 1,
  setPitchDirectorActId: (pitchDirectorActId: number) => set({ pitchDirectorActId }),

  // Supercar & Victoria VR Configurator Domain
  isSupercarConfiguratorOpen: false,
  openSupercarConfigurator: () => {
    set({ isSupercarConfiguratorOpen: true });
    get().logCognitiveAction('open_supercar_configurator');
  },
  closeSupercarConfigurator: () => set({ isSupercarConfiguratorOpen: false }),
  applySupercarConfiguration: (paintColor = '#dc2626', paintName = 'Rouge Victoria Nacré', brakeCalipers = 'gold', carbonPackActive = true) => {
    const world = get().world;
    const entities = world.ir.entities;
    const targetEnt = Object.values(entities).find(e => 
      e.id === 'demo_color_terminal' || 
      e.visuals?.assetId === 'wp-borne-configurateur' ||
      e.name?.toLowerCase().includes('configurateur') ||
      e.id.toLowerCase().includes('configurateur') ||
      e.name?.toLowerCase().includes('console') ||
      e.id.toLowerCase().includes('console') ||
      e.name?.toLowerCase().includes('holograph')
    ) || Object.values(entities).find(e => 
      e.name?.toLowerCase().includes('supercar') ||
      e.id.toLowerCase().includes('supercar')
    );

    const sourceId = targetEnt ? targetEnt.id : 'demo_color_terminal';

    const carEnt = Object.values(entities).find(e =>
      e.visuals?.assetId === 'wp-supercar-showroom' ||
      ((e.name?.toLowerCase().includes('supercar') || e.id.toLowerCase().includes('supercar')) &&
        !e.name?.toLowerCase().includes('configur') &&
        !e.name?.toLowerCase().includes('console') &&
        !e.name?.toLowerCase().includes('borne') &&
        !e.name?.toLowerCase().includes('clé') &&
        !e.name?.toLowerCase().includes('cle') &&
        !e.capabilities.some(c => c.type === 'trigger_zone'))
    );

    // Set supercar_configured flag and synchronize carEnt.visuals.color BEFORE dispatch so evaluateEvent immediately validates Step 1
    set(s => {
      const nextEntities = { ...s.world.ir.entities };
      if (carEnt && nextEntities[carEnt.id]) {
        nextEntities[carEnt.id] = {
          ...nextEntities[carEnt.id],
          visuals: {
            ...nextEntities[carEnt.id].visuals,
            color: paintColor
          }
        };
      }
      return {
        isSupercarConfiguratorOpen: false,
        supercarCustomPaint: paintColor,
        supercarBrakeCalipers: brakeCalipers,
        supercarCarbonPack: carbonPackActive,
        world: {
          ...s.world,
          ir: {
            ...s.world.ir,
            entities: nextEntities
          },
          flags: {
            ...s.world.flags,
            supercar_configured: true
          }
        }
      };
    });

    // Dispatch INTERACT event through world engine
    get().dispatch({
      type: 'INTERACT',
      sourceId,
      payload: { paintColor, paintName, brakeCalipers, carbonPackActive }
    });

    set(s => ({
      warnings: [
        ...s.warnings,
        `🎨 Configuration validée ! Teinte ${paintName} appliquée à la supercar.`,
        `👉 Étape suivante : Démarrez le moteur V12 de la Supercar.`
      ]
    }));

    get().addLiveCausalEvent({
      type: 'action',
      icon: '🎨',
      source: targetEnt?.name || 'Configurateur Supercar',
      message: `Configuration ${paintName} appliquée avec succès`,
      badge: 'Validé',
      productive: true
    });
  },

  supercarCustomPaint: null,
  setSupercarCustomPaint: (supercarCustomPaint: string | null) => set({ supercarCustomPaint }),
  supercarBrakeCalipers: 'gold',
  supercarCarbonPack: true,

  isDishPlated: false,
  setIsDishPlated: (isDishPlated: boolean) => {
    set({ isDishPlated });
    get().logCognitiveAction(isDishPlated ? 'plate' : 'unplate');
    if (isDishPlated) {
      get().unlockAchievement('first_dish_plated');
    }
  },
  activeDegustationRecipeId: null,
  openDegustationModal: (recipeId?: string) => {
    const curRecipe = recipeId || get().world.ir.activeQuestId?.replace('quest_', '') || 'recipe-ratatouille';
    set({ activeDegustationRecipeId: curRecipe });
  },
  closeDegustationModal: () => set({ activeDegustationRecipeId: null }),
  cookingHeatLevel: 0,
  setCookingHeatLevel: (level: number) => {
    const clamped = Math.max(0, Math.min(3, Math.round(level)));
    set({ cookingHeatLevel: clamped });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('worldpilot_heat_level_changed', { detail: { level: clamped } }));
    }
  },
  cycleCookingHeatLevel: () => {
    const current = get().cookingHeatLevel;
    const next = (current + 1) % 4;
    get().setCookingHeatLevel(next);
    get().logCognitiveAction('heat_change', { sourceEntityName: `heat_${next}` });
    return next;
  },
  seasoningProfile: { salt: 0, herbs: 0, oil: 0 },
  addSeasoning: (type: 'salt' | 'herbs' | 'oil', amount = 25) => {
    const cur = get().seasoningProfile;
    const nextVal = Math.min(100, Math.max(0, (cur[type] || 0) + amount));
    const updated = { ...cur, [type]: nextVal };
    set({ seasoningProfile: updated });
    get().logCognitiveAction('season', { sourceEntityName: type });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('worldpilot_seasoning_event', { detail: { type, amount, profile: updated } }));
    }
  },
  resetSeasoning: () => set({ seasoningProfile: { salt: 0, herbs: 0, oil: 0 } }),

  cookingDoneness: 0,
  setCookingDoneness: (val: number) => {
    const clamped = Math.min(100, Math.max(0, val));
    set(s => ({
      cookingDoneness: clamped,
      lastAnnouncedDonenessStage:
        clamped < 30 ? 0 :
        clamped < 75 ? Math.min(s.lastAnnouncedDonenessStage, 30) :
        clamped < 100 ? Math.min(s.lastAnnouncedDonenessStage, 75) :
        s.lastAnnouncedDonenessStage
    }));
  },
  cookingTimerRemaining: null,
  isCookingTimerRunning: false,
  startCookingTimer: (seconds = 180) => {
    set({ cookingTimerRemaining: seconds, isCookingTimerRunning: true });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('worldpilot_timer_started', { detail: { seconds } }));
    }
  },
  stopCookingTimer: () => {
    set({ isCookingTimerRunning: false });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('worldpilot_timer_stopped', {}));
    }
  },
  resetCookingTimer: () => set({ cookingTimerRemaining: null, isCookingTimerRunning: false }),
  tickCooking: (deltaSec: number = 0.5) => {
    const { cookingHeatLevel, cookingDoneness, cookingTimerRemaining, isCookingTimerRunning, cookingTemperature } = get();
    const hasPendingAnomalies = get().activeAnomalies.some(a => a.status === 'pending');
    const curCoWorker = get().coWorker;
    const hasActiveCoWorker = curCoWorker && (curCoWorker.currentTask !== 'idle' || curCoWorker.status !== 'idle');

    if (cookingHeatLevel <= 0 && cookingTemperature <= 20 && (!isCookingTimerRunning || cookingTimerRemaining === null) && !hasPendingAnomalies && !hasActiveCoWorker) {
      return;
    }

    let newDoneness = cookingDoneness;
    if (cookingHeatLevel > 0) {
      const rate = cookingHeatLevel === 1 ? 1.0 : cookingHeatLevel === 2 ? 2.5 : 5.0;
      newDoneness = Math.min(100, cookingDoneness + rate * deltaSec);

      const hasCookingContext = Object.values(get().world.ir.entities).some(e => 
        e.visuals?.assetId?.includes('cocotte') || 
        e.visuals?.assetId?.includes('poele') || 
        e.visuals?.assetId?.includes('recipe') || 
        (e.name || '').toLowerCase().includes('cocotte') ||
        (e.name || '').toLowerCase().includes('recette') ||
        (e.name || '').toLowerCase().includes('cuisine') ||
        (e.name || '').toLowerCase().includes('tomate')
      ) || get().world.ir.quests?.[get().world.ir.activeQuestId || '']?.category === 'cuisine';

      const { lastAnnouncedDonenessStage } = get();
      if (newDoneness >= 100 && lastAnnouncedDonenessStage < 100) {
        set({ lastAnnouncedDonenessStage: 100 });
        if (hasCookingContext) {
          speakAgentDialogue("Cuisson optimale atteinte ! Retirez la cocotte du feu et passez au dressage.");
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('worldpilot_doneness_reached', { detail: { doneness: 100 } }));
          }
          set(s => ({
            warnings: [...s.warnings, '✨ Cuisson parfaite à point atteinte ! Les arômes sont sublimes.']
          }));
        }
      } else if (newDoneness >= 75 && lastAnnouncedDonenessStage < 75) {
        set({ lastAnnouncedDonenessStage: 75 });
        if (hasCookingContext) {
          speakAgentDialogue("Mijotage optimal ! Les arômes infusent à merveille. Vérifiez l'assaisonnement.");
        }
      } else if (newDoneness >= 30 && lastAnnouncedDonenessStage < 30) {
        set({ lastAnnouncedDonenessStage: 30 });
        if (hasCookingContext) {
          speakAgentDialogue("Saisie réussie ! Les sucs commencent à dorer. Baissez légèrement le feu pour mijoter.");
        }
      }
    }

    let newTimer = cookingTimerRemaining;
    let newTimerRunning = isCookingTimerRunning;
    if (isCookingTimerRunning && cookingTimerRemaining !== null) {
      newTimer = Math.max(0, cookingTimerRemaining - deltaSec);
      if (newTimer <= 0) {
        newTimer = 0;
        newTimerRunning = false;
        speakAgentDialogue("Ding ! Le minuteur de cuisson est arrivé à terme !");
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('worldpilot_timer_completed', {}));
        }
        set(s => ({
          warnings: [...s.warnings, '⏱️ DING ! Le minuteur de cuisine est arrivé à terme !']
        }));
      }
    }

    const { activeAnomalies, choppingProgress, seasoningProfile, isDishPlated } = get();
    const targetTemp = cookingHeatLevel === 0 ? 20 : cookingHeatLevel === 1 ? 85 : cookingHeatLevel === 2 ? 120 : 205;
    const tempSpeed = cookingHeatLevel > 0 ? 0.35 : 0.15;
    const newTemp = Math.round((cookingTemperature + (targetTemp - cookingTemperature) * Math.min(1, deltaSec * tempSpeed)) * 10) / 10;

    let updatedAnomalies = activeAnomalies;
    if (activeAnomalies.some(a => a.status === 'pending')) {
      const choppingCount = Object.values(choppingProgress || {}).reduce((sum, n) => sum + (Number(n) || 0), 0);
      const worldFlags = get().world.flags || {};
      updatedAnomalies = activeAnomalies.map(anom => {
        if (anom.status !== 'pending') return anom;
        const newTime = Math.max(0, anom.timeRemainingSec - deltaSec);
        const isResolved = evaluateAnomalyResolution(anom, {
          cookingHeatLevel,
          cookingTemperature: newTemp,
          seasoningSalt: seasoningProfile.salt,
          seasoningOil: seasoningProfile.oil,
          seasoningHerbs: seasoningProfile.herbs,
          isDishPlated,
          choppingCount,
          worldFlags
        });
        if (isResolved) {
          get().unlockAchievement('crisis_manager');
          if (anom.type === 'thermal_flare') get().unlockAchievement('zen_operator');
          playAudioFx('fanfare');
          get().logCognitiveAction('anomaly_resolved', { sourceEntityName: anom.type, isErrorRecovery: true });
          return { ...anom, status: 'resolved' as const, timeRemainingSec: newTime };
        } else if (newTime <= 0) {
          return { ...anom, status: 'failed' as const, timeRemainingSec: 0 };
        }
        return { ...anom, timeRemainingSec: newTime };
      });
    }

    const { coWorker, teamingMetrics } = get();
    let updatedCoWorker = coWorker;
    let updatedTeaming = teamingMetrics;
    if (coWorker.currentTask !== 'idle' || coWorker.status !== 'idle' || coWorker.speechBubble) {
      const coStep = tickCoWorker(coWorker, teamingMetrics, deltaSec);
      updatedCoWorker = coStep.nextState;
      updatedTeaming = coStep.nextMetrics;
      if (coStep.taskCompleted) {
        if (coStep.completedTaskType === 'chop_vegetables') {
          get().chopIngredient();
        } else if (coStep.completedTaskType === 'monitor_heat') {
          if (get().cookingHeatLevel > 1) {
            set({ cookingHeatLevel: 1 });
          }
        } else if (coStep.completedTaskType === 'season_dish') {
          const prof = get().seasoningProfile;
          set({ seasoningProfile: { ...prof, herbs: Math.min(100, prof.herbs + 25), oil: Math.min(100, prof.oil + 20) } });
        } else if (coStep.completedTaskType === 'plate_garniture') {
          set({ isDishPlated: true });
        }
        if (coStep.completionMessage) {
          speakAgentDialogue(coStep.completionMessage);
          set(s => ({ warnings: [...s.warnings, `✅ ${coStep.completionMessage}`] }));
        }
        playAudioFx('fanfare');
        get().unlockAchievement('symbiotic_duo');
      }
    }

    if (
      newDoneness !== cookingDoneness || 
      newTimer !== cookingTimerRemaining || 
      newTimerRunning !== isCookingTimerRunning || 
      newTemp !== cookingTemperature ||
      updatedAnomalies !== activeAnomalies ||
      updatedCoWorker !== coWorker ||
      updatedTeaming !== teamingMetrics
    ) {
      set({ 
        cookingDoneness: newDoneness, 
        cookingTimerRemaining: newTimer, 
        isCookingTimerRunning: newTimerRunning, 
        cookingTemperature: newTemp,
        activeAnomalies: updatedAnomalies,
        coWorker: updatedCoWorker,
        teamingMetrics: updatedTeaming
      });
    }
  },
  resetCookingProgress: () => set({
    cookingDoneness: 0,
    cookingTimerRemaining: null,
    isCookingTimerRunning: false,
    lastAnnouncedDonenessStage: 0,
    cookingTemperature: 20
  }),
  getDishEvaluation: () => {
    const s = get();
    const evalResult = evaluateDish({
      doneness: s.cookingDoneness,
      seasoning: s.seasoningProfile,
      isPlated: s.isDishPlated,
      heatLevel: s.cookingHeatLevel
    });
    if (evalResult.stars >= 3) {
      get().unlockAchievement('chef_3_stars');
    }
    return evalResult;
  },
  restartCurrentRecipe: () => {
    if (get().world.ir?.activeQuestId) {
      get().resetQuest();
    }
    set({
      cookingDoneness: 0,
      cookingTimerRemaining: null,
      isCookingTimerRunning: false,
      isDishPlated: false,
      seasoningProfile: { salt: 0, herbs: 0, oil: 0 },
      cookingHeatLevel: 0,
      choppingProgress: {},
      isTastingActive: false,
      isDishSauced: false,
      lastAnnouncedDonenessStage: 0,
      cookingTemperature: 20,
      platingStyle: 'classic-dome',
      platingGarnish: 'tuile-dentelle',
      activeAnomalies: []
    });
    get().setCameraPreset('table');
    set(s => ({
      warnings: [...s.warnings, '🔄 Recette réinitialisée : plan de travail prêt pour une nouvelle préparation !']
    }));
  },
  cookingTemperature: 20,
  platingStyle: 'classic-dome',
  setPlatingStyle: (style: PlatingStyle) => {
    set({ platingStyle: style });
    get().logCognitiveAction('plate_style', { sourceEntityName: style });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('worldpilot_plating_style_changed', { detail: { style } }));
    }
  },
  cyclePlatingStyle: () => {
    const styles: PlatingStyle[] = ['classic-dome', 'deconstructed-arc', 'geometric-tian'];
    const cur = get().platingStyle;
    const next = styles[(styles.indexOf(cur) + 1) % styles.length];
    get().setPlatingStyle(next);
    return next;
  },
  platingGarnish: 'tuile-dentelle',
  setPlatingGarnish: (garnish: PlatingGarnish) => {
    set({ platingGarnish: garnish });
    get().logCognitiveAction('garnish', { sourceEntityName: garnish });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('worldpilot_plating_garnish_changed', { detail: { garnish } }));
    }
  },
  cyclePlatingGarnish: () => {
    const garnishes: PlatingGarnish[] = ['tuile-dentelle', 'fleur-de-sel', 'micro-greens', 'truffle-specks'];
    const cur = get().platingGarnish;
    const next = garnishes[(garnishes.indexOf(cur) + 1) % garnishes.length];
    get().setPlatingGarnish(next);
    return next;
  },
  lastAnnouncedDonenessStage: 0,
  getChefCookingAdvice: () => {
    const s = get();
    const cuts = Object.values(s.choppingProgress);
    const totalCuts = cuts.reduce((a, b) => a + b, 0);

    if (s.isDishPlated && s.isDishSauced) {
      return {
        step: 'Dégustation & Évaluation',
        message: 'Votre chef-d’œuvre est dressé et nappé à la perfection ! Prenez vos couverts pour la dégustation 3D et découvrez vos étoiles au guide.'
      };
    }

    if (s.isDishPlated && !s.isDishSauced) {
      return {
        step: 'Nappage du Plat',
        message: 'Sublime dressage ! Nappez maintenant le plat d’un ruban soyeux de réduction de jus pour sublimer la brillance et les contrastes.'
      };
    }

    if (s.cookingDoneness >= 100) {
      return {
        step: 'Dressage sur Assiette',
        message: 'Cuisson optimale atteinte ! Coupez immédiatement la flamme du brûleur et dressez délicatement votre garniture au centre de l’assiette.'
      };
    }

    if (s.cookingHeatLevel > 0 && s.cookingDoneness >= 75) {
      return {
        step: 'Réduction & Finition',
        message: 'Le mijotage est exemplaire ! Baissez le feu à niveau doux (50%) et surveillez la concentration des sucs aromatiques.'
      };
    }

    if (s.cookingHeatLevel > 0 && s.cookingDoneness >= 30) {
      return {
        step: 'Assaisonnement & Mijotage',
        message: 'La saisie est réussie ! Saupoudrez votre cascade de sel fin, poivre du moulin ou herbes fraîches, puis couvrez pour mijoter.'
      };
    }

    if (s.cookingHeatLevel > 0 && s.cookingDoneness < 30) {
      return {
        step: 'Saisie Initiale',
        message: 'La poêle monte en température. Remuez délicatement vos ingrédients avec la spatule pour assurer une coloration dorée et homogène.'
      };
    }

    if (totalCuts === 0 && Object.keys(s.world.ir.entities).some(k => k.includes('legume') || k.includes('poivron') || k.includes('tomate') || k.includes('aubergine'))) {
      return {
        step: 'Découpe & Mise en Place',
        message: 'Avant toute cuisson, préparez vos légumes sur la planche à découper. Taillez-les en rondelles, émincé ou brunoise fine.'
      };
    }

    return {
      step: 'Mise en Chauffe',
      message: 'Vos ingrédients sont parés ! Allumez le brûleur sous la cocotte pour démarrer la cuisson gastronomique.'
    };
  },
  askChefAdvice: () => {
    const { step, message } = get().getChefCookingAdvice();
    get().logCognitiveAction('ask_advice', { sourceEntityName: step });
    speakAgentDialogue(`Conseil du Chef Auguste pour l'étape : ${step}. ${message}`);
    get().unlockAchievement('chef_advice_sought');
    set(s => ({
      warnings: [...s.warnings, `👨‍🍳 Chef Auguste (${step}) : ${message}`]
    }));
    return message;
  },
  isTastingActive: false,
  tastingUtensil: 'fork',
  triggerTasting: (utensil: 'fork' | 'spoon' = 'fork') => {
    set({ isTastingActive: true, tastingUtensil: utensil });
    get().logCognitiveAction('taste', { sourceEntityName: utensil });
    get().unlockAchievement('connoisseur_tasting');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('worldpilot_tasting_start', { detail: { utensil, fromStore: true } }));
    }
  },
  stopTasting: () => set({ isTastingActive: false }),
  isDishSauced: false,
  toggleSauceDish: () => {
    set(state => {
      const next = !state.isDishSauced;
      get().logCognitiveAction(next ? 'sauce' : 'unsauce');
      if (next) {
        get().unlockAchievement('sauce_artist');
      }
      return {
        isDishSauced: next,
        warnings: [...state.warnings, next ? '🥄 Nappage de chef appliqué avec un filet de jus réduit !' : '🥄 Nappage retiré.']
      };
    });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('worldpilot_dish_sauced', { detail: { fromStore: true } }));
    }
  },
  choppingProgress: {},
  chopIngredient: (entityId?: string) => {
    get().logCognitiveAction('chop', { sourceEntityId: entityId });
    set(state => {
      const next = { ...state.choppingProgress };
      if (entityId) {
        next[entityId] = Math.min(3, (next[entityId] || 0) + 1);
        if (next[entityId] >= 3) {
          get().unlockAchievement('master_cut');
        }
      } else {
        const entities = Object.values(state.world.ir.entities);
        const board = entities.find(e => {
          const a = (e.visuals?.assetId || '').toLowerCase();
          const n = (e.name || '').toLowerCase();
          return a.includes('planche') || n.includes('planche');
        });
        const boardPos = board?.capabilities.find(c => c.type === 'transform')?.position;

        let choppedAny = false;
        entities.forEach(e => {
          const a = (e.visuals?.assetId || '').toLowerCase();
          const n = (e.name || '').toLowerCase();
          const isIng = a.includes('courgette') || a.includes('tomate') || a.includes('oignon') ||
                        a.includes('ail') || a.includes('carotte') || a.includes('champignon') ||
                        a.includes('légume') || a.includes('pomme') || a.includes('viande') ||
                        n.includes('courgette') || n.includes('tomate') || n.includes('oignon') ||
                        n.includes('ail') || n.includes('carotte') || n.includes('champignon') ||
                        n.includes('légume') || n.includes('viande');
          if (!isIng) return;

          if (boardPos) {
            const ePos = e.capabilities.find(c => c.type === 'transform')?.position;
            const bx = Array.isArray(boardPos) ? (boardPos[0] ?? 0) : (boardPos.x ?? 0);
            const bz = Array.isArray(boardPos) ? (boardPos[2] ?? 0) : (boardPos.z ?? 0);
            const ex = Array.isArray(ePos) ? (ePos[0] ?? 0) : (ePos?.x ?? 0);
            const ez = Array.isArray(ePos) ? (ePos[2] ?? 0) : (ePos?.z ?? 0);
            if (ePos && Math.hypot(ex - bx, ez - bz) < 0.48) {
              next[e.id] = Math.min(3, (next[e.id] || 0) + 1);
              choppedAny = true;
            }
          } else {
            next[e.id] = Math.min(3, (next[e.id] || 0) + 1);
            choppedAny = true;
          }
        });

        if (!choppedAny) {
          entities.forEach(e => {
            const a = (e.visuals?.assetId || '').toLowerCase();
            const n = (e.name || '').toLowerCase();
            const isIng = a.includes('courgette') || a.includes('tomate') || a.includes('oignon') ||
                          a.includes('ail') || a.includes('carotte') || a.includes('champignon') ||
                          n.includes('courgette') || n.includes('tomate') || n.includes('oignon') ||
                          n.includes('ail') || n.includes('carotte');
            if (isIng) {
              next[e.id] = Math.min(3, (next[e.id] || 0) + 1);
            }
          });
        }
        if (Object.values(next).some(v => v >= 3)) {
          get().unlockAchievement('master_cut');
        }
      }
      return { choppingProgress: next };
    });
  },
  resetChopping: () => set({ choppingProgress: {} }),

  unlockedAchievements: loadInitialAchievements(),
  unlockAchievement: (id: string) => {
    const current = get().unlockedAchievements;
    if (current[id]) return false;
    const ach = getAchievement(id);
    if (!ach) return false;
    const updated = { ...current, [id]: Date.now() };
    set(state => ({
      unlockedAchievements: updated,
      recentUnlockedAchievement: ach,
      warnings: [...state.warnings, `🏆 Trophée Débloqué : ${ach.icon} ${ach.title} !`]
    }));
    playAudioFx((ach.rewardSound as any) || 'fanfare');
    if (typeof window !== 'undefined') {
      try { localStorage.setItem('worldpilot_unlocked_achievements', JSON.stringify(updated)); } catch (_) {}
      window.dispatchEvent(new CustomEvent('worldpilot_achievement_unlocked', { detail: { achievement: ach } }));
    }
    return true;
  },
  recentUnlockedAchievement: null,
  dismissAchievementToast: () => set({ recentUnlockedAchievement: null }),
  showAchievementsModal: false,
  setShowAchievementsModal: (show: boolean) => set({ showAchievementsModal: show }),

  masteredVocab: loadInitialMasteredVocab(),
  toggleVocabMastery: (word: string) => {
    const cur = get().masteredVocab;
    const isMastered = cur.includes(word);
    const next = isMastered ? cur.filter(w => w !== word) : [...cur, word];
    set({ masteredVocab: next });
    if (typeof window !== 'undefined') {
      try { localStorage.setItem('worldpilot_mastered_vocab', JSON.stringify(next)); } catch (_) {}
    }
    return !isMastered;
  },
  isVocabMastered: (word: string) => get().masteredVocab.includes(word),
  showFlashcardStudyModal: false,
  setShowFlashcardStudyModal: (show: boolean) => set({ showFlashcardStudyModal: show }),
  studyModalSceneId: null,
  openFlashcardStudyModal: (sceneId?: string) => set({ showFlashcardStudyModal: true, studyModalSceneId: sceneId || null }),
  closeFlashcardStudyModal: () => set({ showFlashcardStudyModal: false, studyModalSceneId: null }),

  collaborationNotes: loadInitialCollaborationNotes(),
  addCollaborationNote: (noteData) => {
    const id = `note-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newNote: StickyNote = {
      id,
      text: noteData.text,
      category: noteData.category || 'idea',
      color: noteData.color || 'yellow',
      author: noteData.author || 'Participant',
      column: noteData.column || 'in_progress',
      votes: 1,
      createdAt: Date.now()
    };
    set(s => {
      const updated = [newNote, ...s.collaborationNotes];
      if (typeof window !== 'undefined') {
        try { localStorage.setItem('worldpilot_collaboration_notes', JSON.stringify(updated)); } catch (_) {}
      }
      return { collaborationNotes: updated };
    });
    get().logCognitiveAction('note_create', { sourceEntityName: noteData.category });
    get().unlockAchievement('sticky_note_innovator');
    playAudioFx('tink');
  },
  voteCollaborationNote: (noteId: string) => {
    set(s => {
      const updated = s.collaborationNotes.map(n => n.id === noteId ? { ...n, votes: n.votes + 1 } : n);
      if (typeof window !== 'undefined') {
        try { localStorage.setItem('worldpilot_collaboration_notes', JSON.stringify(updated)); } catch (_) {}
      }
      return { collaborationNotes: updated };
    });
    get().logCognitiveAction('note_vote', { sourceEntityId: noteId });
    get().unlockAchievement('sticky_note_innovator');
    playAudioFx('chime');
  },
  moveCollaborationNote: (noteId: string, column: 'backlog' | 'in_progress' | 'done') => {
    set(s => {
      const updated = s.collaborationNotes.map(n => n.id === noteId ? { ...n, column } : n);
      if (typeof window !== 'undefined') {
        try { localStorage.setItem('worldpilot_collaboration_notes', JSON.stringify(updated)); } catch (_) {}
      }
      return { collaborationNotes: updated };
    });
  },
  deleteCollaborationNote: (noteId: string) => {
    set(s => {
      const updated = s.collaborationNotes.filter(n => n.id !== noteId);
      if (typeof window !== 'undefined') {
        try { localStorage.setItem('worldpilot_collaboration_notes', JSON.stringify(updated)); } catch (_) {}
      }
      return { collaborationNotes: updated };
    });
  },
  showCollaborationBoardModal: false,
  setShowCollaborationBoardModal: (show: boolean) => set({ showCollaborationBoardModal: show }),

  showPublishReadinessModal: false,
  setShowPublishReadinessModal: (show: boolean) => set({ showPublishReadinessModal: show }),
  openPublishReadinessModal: (preset?: LandPresetType) => {
    const activePreset = preset || get().activeLandPreset || 'standard';
    const report = evaluatePublishReadiness(get().world, activePreset);
    set({
      showPublishReadinessModal: true,
      activeLandPreset: activePreset,
      publishReadinessReport: report
    });
    get().unlockAchievement('publish_readiness_auditor');
  },
  closePublishReadinessModal: () => set({ showPublishReadinessModal: false }),
  showEditOrderLabModal: false,
  setShowEditOrderLabModal: (show: boolean) => set({ showEditOrderLabModal: show }),
  openEditOrderLabModal: () => set({ showEditOrderLabModal: true }),
  closeEditOrderLabModal: () => set({ showEditOrderLabModal: false }),
  activeLandPreset: 'standard',
  setActiveLandPreset: (preset: LandPresetType) => {
    const report = evaluatePublishReadiness(get().world, preset);
    set({ activeLandPreset: preset, publishReadinessReport: report });
  },
  publishReadinessReport: null,
  runPublishReadinessCheck: (preset?: LandPresetType) => {
    const activePreset = preset || get().activeLandPreset || 'standard';
    const report = evaluatePublishReadiness(get().world, activePreset);
    set({ publishReadinessReport: report, activeLandPreset: activePreset });
    return report;
  }
});
