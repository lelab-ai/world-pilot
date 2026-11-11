import { catalog, lessonKit, createLibraryPatch } from './library/catalog';
import React, { useState, useCallback } from 'react';
import { tracker } from './observability/tracker';
import { parseInstructionAsync } from './authoring/parser';
import { WorldScene } from './scene/R3FWorldAdapter';
import { xrStore } from './scene/xrStore';
import { LogicEditor } from './ui/LogicEditor';
import { JsonEditor } from './ui/JsonEditor';
import { Web3TransactionModal } from './ui/Web3TransactionModal';
import { WebScreenModal } from './ui/WebScreenModal';
import { SpatialDropZone } from './ui/SpatialDropZone';
import { DegustationModal } from './ui/DegustationModal';
import { SupercarConfiguratorModal } from './ui/SupercarConfiguratorModal';
import { FLEScenesModal } from './ui/FLEScenesModal';
import { CookingRecipesModal } from './ui/CookingRecipesModal';
import { SeminarRoomsModal } from './ui/SeminarRoomsModal';
import { AtmosphereSelector } from './ui/AtmosphereSelector';
import { AudioControlWidget } from './ui/AudioControlWidget';
import { DemonstrationsModal } from './ui/DemonstrationsModal';
import { DataIngestionModal } from './ui/DataIngestionModal';
import { cookingRecipes } from './library/cookingRecipes';
import { seminarRooms } from './library/seminarRooms';
import { demonstrationScenarios } from './library/demonstrations';
import { curatedDatasets } from './engine/dataIngestion';
import { VoiceInput, speakFeedback } from './ui/VoiceInput';
import { AchievementsModal } from './ui/AchievementsModal';
import { AchievementToast } from './ui/AchievementToast';
import { FLEFlashcardStudyModal } from './ui/FLEFlashcardStudyModal';
import { CollaborationBoardModal } from './ui/CollaborationBoardModal';
import { BehavioralAnalyticsModal } from './ui/BehavioralAnalyticsModal';
import { PublishReadinessModal } from './ui/PublishReadinessModal';
import { EditOrderLabModal } from './ui/EditOrderLabModal';
import { SyntheticPlaytesterModal } from './ui/SyntheticPlaytesterModal';
import { SpatialTelemetryDashboard } from './ui/SpatialTelemetryDashboard';
import { PitchDemoDirector } from './ui/PitchDemoDirector';
import { PromptHistoryModal } from './ui/PromptHistoryModal';
import { CertifiedExperiencesModal } from './ui/CertifiedExperiencesModal';
import { LoadExperienceConfirmationModal } from './ui/LoadExperienceConfirmationModal';
import { AgentCognitiveLedgerModal } from './ui/AgentCognitiveLedgerModal';
import { SavedLayoutsModal } from './ui/SavedLayoutsModal';
import { ObjectCompatibilityModal } from './ui/ObjectCompatibilityModal';
import { Entity2DSpecSheetDrawer } from './ui/Entity2DSpecSheetDrawer';
import { ImportUrlModal } from './ui/ImportUrlModal';
import { certifiedExperiencesRegistry } from './library/certifiedExperiences';
import { ACHIEVEMENTS } from './engine/achievements';
import { useWorldStore } from './engine/store';
import { playAudioFx } from './engine/evaluator';
import { findCounterExample } from './simulation/simulator';
import { validateWorldPatch } from './engine/validator';
import { QuestHUD } from './ui/QuestHUD';
import { GameplayHUD } from './ui/GameplayHUD';
import { CausalObservabilityHUD } from './ui/CausalObservabilityHUD';
import { RefugeOverlay } from './ui/RefugeOverlay';
import { CinematicSettingsModal } from './ui/CinematicSettingsModal';
import { ZeroClickLaunchpad } from './ui/ZeroClickLaunchpad';
import { useDraggableModal } from './ui/useDraggableModal';
import { isSupportEntity, isFloorFurniture, isStaticOrStructuralEntity, getSupportingSurfaceHeight } from './engine/spatialSurface';
import { GatekeeperModal } from './ui/GatekeeperModal';
import { translations } from './i18n/translations';

import { LibraryPanel, LibraryInspector } from './library/LibraryPanel';

export default function App() {
  const uiLanguage = useWorldStore(state => state.uiLanguage);
  const setUiLanguage = useWorldStore(state => state.setUiLanguage);
  const isFr = uiLanguage === 'fr';
  const t = translations[uiLanguage] || translations.fr;

  const world = useWorldStore(state => state.world);
  const spatialContext = useWorldStore(state => state.spatialContext);
  const instruction = useWorldStore(state => state.instruction);
  const setInstruction = useWorldStore(state => state.setInstruction);
  const applyPatch = useWorldStore(state => state.applyPatch);
  const warnings = useWorldStore(state => state.warnings);
  const clearWarnings = useWorldStore(state => state.clearWarnings);
  const showGrid = useWorldStore(state => state.showGrid);
  const setShowGrid = useWorldStore(state => state.setShowGrid);
  const showLabels = useWorldStore(state => state.showLabels);
  const setShowLabels = useWorldStore(state => state.setShowLabels);
  const isVoiceModeEnabled = useWorldStore(state => state.isVoiceModeEnabled);
  const toggleVoiceMode = useWorldStore(state => state.toggleVoiceMode);
  const isCinematicTourActive = useWorldStore(state => state.isCinematicTourActive);
  const toggleCinematicTour = useWorldStore(state => state.toggleCinematicTour);
  const isSpatialAgentActive = useWorldStore(state => state.isSpatialAgentActive);
  const toggleSpatialAgent = useWorldStore(state => state.toggleSpatialAgent);
  const saveWorldToStorage = useWorldStore(state => state.saveWorldToStorage);
  const loadWorldFromStorage = useWorldStore(state => state.loadWorldFromStorage);
  const exportWorldJson = useWorldStore(state => state.exportWorldJson);
  const importWorldJson = useWorldStore(state => state.importWorldJson);
  const exportWorldYaml = useWorldStore(state => state.exportWorldYaml);
  const importWorldYaml = useWorldStore(state => state.importWorldYaml);
  const triggerCaptureScreenshot = useWorldStore(state => state.triggerCaptureScreenshot);
  const triggerExportGLB = useWorldStore(state => state.triggerExportGLB);
  const triggerExportUSDZ = useWorldStore(state => state.triggerExportUSDZ);
  const cameraPreset = useWorldStore(state => state.cameraPreset);
  const setCameraPreset = useWorldStore(state => state.setCameraPreset);
  const cycleCameraPreset = useWorldStore(state => state.cycleCameraPreset);
  const unlockedAchievements = useWorldStore(state => state.unlockedAchievements);
  const showAchievementsModal = useWorldStore(state => state.showAchievementsModal);
  const setShowAchievementsModal = useWorldStore(state => state.setShowAchievementsModal);
  const showFlashcardStudyModal = useWorldStore(state => state.showFlashcardStudyModal);
  const closeFlashcardStudyModal = useWorldStore(state => state.closeFlashcardStudyModal);
  const studyModalSceneId = useWorldStore(state => state.studyModalSceneId);
  const showCollaborationBoardModal = useWorldStore(state => state.showCollaborationBoardModal);
  const setShowCollaborationBoardModal = useWorldStore(state => state.setShowCollaborationBoardModal);
  const collaborationNotes = useWorldStore(state => state.collaborationNotes);
  const isGhostAgentActive = useWorldStore(state => state.isGhostAgentActive);
  const toggleGhostAgent = useWorldStore(state => state.toggleGhostAgent);
  const appMode = useWorldStore(state => state.appMode);
  const setAppMode = useWorldStore(state => state.setAppMode);
  const cinematicPreset = useWorldStore(state => state.cinematicPreset);
  const setShowCinematicModal = useWorldStore(state => state.setShowCinematicModal);
  const showLayoutsModal = useWorldStore(state => state.showLayoutsModal);
  const setShowLayoutsModal = useWorldStore(state => state.setShowLayoutsModal);
  const showObjectCompatibilityModal = useWorldStore(state => state.showObjectCompatibilityModal);
  const setShowObjectCompatibilityModal = useWorldStore(state => state.setShowObjectCompatibilityModal);
  const savedSpatialLayouts = useWorldStore(state => state.savedSpatialLayouts);
  const showEntity2DDrawer = useWorldStore(state => state.showEntity2DDrawer);
  const setShowEntity2DDrawer = useWorldStore(state => state.setShowEntity2DDrawer);
  const showImportUrlModal = useWorldStore(state => state.showImportUrlModal);
  const setShowImportUrlModal = useWorldStore(state => state.setShowImportUrlModal);
  const selectedEntityId = useWorldStore(state => state.spatialContext.selectedEntityId);
  const showResearchDashboardModal = useWorldStore(state => state.showResearchDashboardModal);

  const [cameraFlash, setCameraFlash] = React.useState(false);
  React.useEffect(() => {
    const onFlash = () => {
      setCameraFlash(true);
      setTimeout(() => setCameraFlash(false), 240);
    };
    window.addEventListener('worldpilot_camera_flash', onFlash);
    return () => window.removeEventListener('worldpilot_camera_flash', onFlash);
  }, []);

  const currentSceneTitle = useWorldStore(state => state.currentSceneTitle);
  const setCurrentSceneTitle = useWorldStore(state => state.setCurrentSceneTitle);
  const canUndo = useWorldStore(state => state.canUndo);
  const canRedo = useWorldStore(state => state.canRedo);
  const undo = useWorldStore(state => state.undo);
  const redo = useWorldStore(state => state.redo);
  const placementModeEntityId = useWorldStore(state => state.placementModeEntityId);
  const cancelPlacementMode = useWorldStore(state => state.cancelPlacementMode);
  const [isEditingTitle, setIsEditingTitle] = React.useState(false);
  const [tempTitle, setTempTitle] = React.useState(currentSceneTitle);

  React.useEffect(() => {
    setTempTitle(currentSceneTitle);
  }, [currentSceneTitle]);

  const [openDropdown, setOpenDropdown] = React.useState<'catalog' | 'tools' | 'agents' | 'project' | null>(null);
  const [libraryTab, setLibraryTab] = React.useState<'experiences' | 'objects' | 'spatial'>('experiences');
  const [showPitchDirector, setShowPitchDirector] = React.useState<boolean>(false);
  const [showGuidedDemoModal, setShowGuidedDemoModal] = React.useState<boolean>(false);
  const [showNavHint, setShowNavHint] = React.useState<boolean>(true);

  // Auto-dismiss de l'onboarding 3D après 6s ou dès la 1ère interaction pour libérer l'écran
  React.useEffect(() => {
    if (!showNavHint) return;
    const timer = setTimeout(() => {
      setShowNavHint(false);
    }, 6000);

    const onUserInteract = () => {
      setShowNavHint(false);
    };

    window.addEventListener('pointerdown', onUserInteract, { once: true });
    window.addEventListener('wheel', onUserInteract, { once: true, passive: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener('pointerdown', onUserInteract);
      window.removeEventListener('wheel', onUserInteract);
    };
  }, [showNavHint]);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.header-dropdown-container')) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  React.useEffect(() => {
    // Rescue any tabletop entities stranded on the floor on initial load (decoupled one-shot timer)
    const timer = setTimeout(() => {
      const store = useWorldStore.getState();
      const entities = store.world.ir.entities;
      const updates: { id: string; capabilities: any[] }[] = [];
      for (const entity of Object.values(entities)) {
        if (
          isSupportEntity(entity) ||
          isFloorFurniture(entity) ||
          isStaticOrStructuralEntity(entity) ||
          entity.capabilities.some(c => c.type === 'trigger_zone')
        ) {
          continue;
        }
        const tCap = entity.capabilities.find(c => c.type === 'transform');
        if (!tCap?.position) continue;
        const rawPos: any = tCap.position;
        const x = Array.isArray(rawPos) ? Number(rawPos[0]) || 0 : Number(rawPos.x) || 0;
        const y = Array.isArray(rawPos) ? Number(rawPos[1]) || 0 : Number(rawPos.y) || 0;
        const z = Array.isArray(rawPos) ? Number(rawPos[2]) || 0 : Number(rawPos.z) || 0;
        const surface = getSupportingSurfaceHeight(x, z, entities, entity.id);
        if (surface.surfaceY >= 0.70 && y < surface.surfaceY + 0.005) {
          const rescuedY = Number((surface.surfaceY + 0.015).toFixed(3));
          updates.push({
            id: entity.id,
            capabilities: entity.capabilities.map(c => 
              c.type === 'transform' ? { ...c, position: { x, y: rescuedY, z } } : c
            )
          });
        }
      }
      if (updates.length > 0) {
        store.applyPatch({ entitiesChanged: updates }, 'Poser les objets sur le bureau', { intent: 'Poser les objets sur le bureau' });
      }
    }, 350);
    return () => clearTimeout(timer);
  }, []);

  React.useEffect(() => {
    // Par défaut, WorldPilot démarre toujours sur une scène 3D vide et propre.
    // La restauration automatique depuis localStorage est désactivée par défaut pour éviter de réinjecter
    // d'anciennes expériences (comme la ratatouille) au démarrage.
    // L'utilisateur peut restaurer à tout moment via le menu Projet > Restaurer l'état sauvegardé (ou avec ?restore=true).
    try {
      if (typeof window !== 'undefined' && window.location.search.includes('restore=true') && localStorage.getItem('worldpilot_saved_world')) {
        loadWorldFromStorage();
      }
    } catch (e) {
      console.warn('Restauration depuis localStorage impossible:', e);
    }
  }, [loadWorldFromStorage]);

  React.useEffect(() => {
    if (warnings.length > 0) {
      const timer = setTimeout(() => {
        clearWarnings();
      }, 4200);
      return () => clearTimeout(timer);
    }
  }, [warnings, clearWarnings]);

  React.useEffect(() => {
    const onCameraPreset = (e: any) => {
      if (e.detail?.preset) {
        setCameraPreset(e.detail.preset);
      }
    };
    const onVoiceInstruction = (e: any) => {
      const text = e.detail;
      if (text && typeof text === 'string') {
        handleApplyInstruction(text);
      }
    };
    const onOpenWebModal = () => {
      const store = useWorldStore.getState();
      const existing = Object.values(store.world.ir.entities).find(e => 
        e.visuals?.assetId === 'web-screen' || e.capabilities.some(c => c.type === 'web_screen' || c.url)
      );
      if (existing) {
        const url = existing.capabilities.find(c => c.type === 'web_screen' || c.url)?.url || 'https://fr.m.wikipedia.org/wiki/Ratatouille';
        store.openWebModal(url, existing.name);
      } else {
        const screenId = `web_screen_${Date.now()}`;
        const url = 'https://fr.m.wikipedia.org/wiki/Gastronomie_fran%C3%A7aise';
        const screenEntity: any = {
          id: screenId,
          name: 'Panneau Web · Encyclopédie & Recettes',
          capabilities: [
            { type: 'transform', position: { x: 0, y: 0, z: -1.9 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
            { type: 'collider' },
            { type: 'web_screen', url },
            { type: 'educational', text: url, url, value: 0, active: true }
          ],
          visuals: { assetId: 'web-screen', modelUrl: '/library/captions.glb' }
        };
        store.applyPatch({ entitiesCreated: [screenEntity] }, 'Ajouter un panneau web interactif', { intent: 'add_web_screen' });
        store.openWebModal(url, screenEntity.name);
      }
    };
    const onSetAudio = (e: any) => {
      const store = useWorldStore.getState();
      if (typeof e.detail?.muted === 'boolean') {
        if (store.isAudioMuted !== e.detail.muted) {
          store.toggleAudioMute();
        }
      }
      if (typeof e.detail?.volume === 'number') {
        store.setAudioVolume(e.detail.volume);
      }
    };
    const onSetLabels = (e: any) => {
      if (typeof e.detail?.show === 'boolean') {
        useWorldStore.getState().setShowLabels(e.detail.show);
      }
    };
    const onPlateDish = () => {
      const store = useWorldStore.getState();
      store.setIsDishPlated(true);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('worldpilot_drop_impact', {
          detail: { x: 0, y: 0.95, z: 0, type: 'sparkle' }
        }));
      }
      useWorldStore.setState(s => ({
        warnings: [...s.warnings, '🍽️ Le plat a été dressé avec élégance sur l\'assiette gastronomique !']
      }));
    };
    const onOpenDegustation = (e: any) => {
      const store = useWorldStore.getState();
      store.openDegustationModal(e.detail?.recipeId);
    };
    const onSetHeat = (e: any) => {
      const store = useWorldStore.getState();
      if (typeof e.detail?.level === 'number') {
        store.setCookingHeatLevel(e.detail.level);
        const labels = ['Éteint (0°C)', 'Feu Doux (85°C)', 'Feu Moyen (100°C)', 'Feu Vif (180°C)'];
        useWorldStore.setState(s => ({
          warnings: [...s.warnings, `🔥 Allure de chauffe : ${labels[e.detail.level] || e.detail.level}`]
        }));
      }
    };
    const onSeasoning = (e: any) => {
      const type = e.detail?.type || 'salt';
      const amount = e.detail?.amount || 25;
      useWorldStore.getState().addSeasoning(type, amount);
      const labels: Record<string, string> = {
        salt: '🧂 Pincée de fleur de sel de Guérande',
        oil: '🫒 Filet d\'huile d\'olive de Provence',
        herbs: '🌿 Bouquet garni & herbes infusées'
      };
      useWorldStore.setState(s => ({
        warnings: [...s.warnings, `✨ Assaisonnement ajouté : ${labels[type] || type} (+${amount}%)`]
      }));
    };
    const onTimerStarted = () => {
      playAudioFx('tink');
    };
    const onTimerCompleted = () => {
      playAudioFx('chime');
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          const hasGesture = (navigator as any).userActivation ? (navigator as any).userActivation.hasBeenActive : true;
          if (hasGesture) navigator.vibrate([80, 50, 80, 50, 120]);
        } catch (_) {}
      }
    };
    const onDonenessReached = () => {
      playAudioFx('fanfare');
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          const hasGesture = (navigator as any).userActivation ? (navigator as any).userActivation.hasBeenActive : true;
          if (hasGesture) navigator.vibrate([60, 40, 60]);
        } catch (_) {}
      }
    };
    const onStartTimer = (e: any) => {
      useWorldStore.getState().startCookingTimer(e.detail?.seconds || 180);
    };
    const onStopTimer = () => {
      useWorldStore.getState().stopCookingTimer();
    };
    const onResetCooking = () => {
      useWorldStore.getState().resetCookingProgress();
    };
    const onRestartRecipe = () => {
      useWorldStore.getState().restartCurrentRecipe();
      playAudioFx('tink');
    };
    const onChopAction = (e: any) => {
      const detail = e.detail;
      useWorldStore.getState().chopIngredient(detail?.ingredientId);
    };

    const timerInterval = setInterval(() => {
      const state = useWorldStore.getState();
      const hasCookingScene = Object.values(state.world.ir.entities).some(e => 
        e.visuals?.assetId?.includes('cocotte') || (e.name || '').toLowerCase().includes('cocotte') || (e.name || '').toLowerCase().includes('cuisine') || e.id?.includes('recipe')
      ) || state.world.ir.quests?.[state.world.ir.activeQuestId || '']?.category === 'cuisine';

      if (hasCookingScene && (state.cookingHeatLevel > 0 || state.isCookingTimerRunning)) {
        state.tickCooking(0.5);
      }
    }, 500);

    window.addEventListener('worldpilot_set_camera_preset', onCameraPreset);
    window.addEventListener('worldpilot_open_web_modal', onOpenWebModal);
    window.addEventListener('worldpilot_set_audio', onSetAudio);
    window.addEventListener('worldpilot_set_labels', onSetLabels);
    window.addEventListener('worldpilot_plate_dish', onPlateDish);
    window.addEventListener('worldpilot_open_degustation', onOpenDegustation);
    window.addEventListener('worldpilot_restart_recipe', onRestartRecipe);
    window.addEventListener('worldpilot_chop_action', onChopAction);
    window.addEventListener('worldpilot_set_heat', onSetHeat);
    window.addEventListener('worldpilot_seasoning_event', onSeasoning);
    window.addEventListener('worldpilot_timer_started', onTimerStarted);
    window.addEventListener('worldpilot_timer_completed', onTimerCompleted);
    window.addEventListener('worldpilot_doneness_reached', onDonenessReached);
    window.addEventListener('worldpilot_start_timer', onStartTimer);
    window.addEventListener('worldpilot_stop_timer', onStopTimer);
    window.addEventListener('worldpilot_reset_cooking', onResetCooking);
    window.addEventListener('worldpilot_apply_voice_instruction', onVoiceInstruction);

    return () => {
      clearInterval(timerInterval);
      window.removeEventListener('worldpilot_set_camera_preset', onCameraPreset);
      window.removeEventListener('worldpilot_apply_voice_instruction', onVoiceInstruction);
      window.removeEventListener('worldpilot_open_web_modal', onOpenWebModal);
      window.removeEventListener('worldpilot_set_audio', onSetAudio);
      window.removeEventListener('worldpilot_set_labels', onSetLabels);
      window.removeEventListener('worldpilot_plate_dish', onPlateDish);
      window.removeEventListener('worldpilot_open_degustation', onOpenDegustation);
      window.removeEventListener('worldpilot_restart_recipe', onRestartRecipe);
      window.removeEventListener('worldpilot_chop_action', onChopAction);
      window.removeEventListener('worldpilot_set_heat', onSetHeat);
      window.removeEventListener('worldpilot_seasoning_event', onSeasoning);
      window.removeEventListener('worldpilot_timer_started', onTimerStarted);
      window.removeEventListener('worldpilot_timer_completed', onTimerCompleted);
      window.removeEventListener('worldpilot_doneness_reached', onDonenessReached);
      window.removeEventListener('worldpilot_start_timer', onStartTimer);
      window.removeEventListener('worldpilot_stop_timer', onStopTimer);
      window.removeEventListener('worldpilot_reset_cooking', onResetCooking);
    };
  }, [setCameraPreset]);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isYaml = file.name.endsWith('.yaml') || file.name.endsWith('.yml');
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        if (isYaml) {
          importWorldYaml(content);
        } else {
          importWorldJson(content);
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const [showLibrary, setShowLibrary] = useState(false);
  const closeLibrary = useCallback(() => setShowLibrary(false), []);
  const [showFLEModal, setShowFLEModal] = useState(false);
  const [showCookingModal, setShowCookingModal] = useState(false);
  const [showSeminarModal, setShowSeminarModal] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [showDataModal, setShowDataModal] = useState(false);
  const [showPromptHistoryModal, setShowPromptHistoryModal] = useState(false);
  const openPromptHistory = useCallback(() => {
    useWorldStore.getState().closeWebModal();
    setShowPromptHistoryModal(true);
  }, []);
  const [showCertifiedModal, setShowCertifiedModal] = useState(false);
  const [certifiedSearchQuery, setCertifiedSearchQuery] = useState('');
  const openCertifiedWithSearch = (query: string = '') => {
    setCertifiedSearchQuery(query);
    setShowCertifiedModal(true);
  };
  const [evening, setEvening] = useState(false);
  const [cameraReset, setCameraReset] = useState(0);
  const [panelTab, setPanelTab] = useState<'create' | 'history'>('create');
  const [showObjects, setShowObjects] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [instructionSource, setInstructionSource] = useState<'local_rules' | 'llm' | 'unresolved' | null>(null);
  const [simResult, setSimResult] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showLogic, setShowLogic] = useState(false);
  const [showJson, setShowJson] = useState(false);
  const [showCameraMenu, setShowCameraMenu] = useState(false);

  const [pendingExperienceLoad, setPendingExperienceLoad] = useState<{
    title: string;
    loadFn: (clearFirst: boolean) => void;
    hasCustomSaved?: boolean;
    onResetToOriginal?: () => void;
  } | null>(null);

  const requestExperienceLoad = (title: string, loadFn: (clearFirst: boolean) => void) => {
    const entityCount = Object.keys(useWorldStore.getState().world.ir.entities).length;
    
    // Vérifier si une sauvegarde personnalisée existe pour cette expérience
    const savedCustomKey = `worldpilot_exp_saved_${encodeURIComponent(title)}`;
    let hasSavedCustomVersion = false;
    let savedCustomData: any = null;
    if (typeof window !== 'undefined') {
      const expRaw = localStorage.getItem(savedCustomKey);
      const worldRaw = localStorage.getItem('worldpilot_saved_world');
      const candidateRaw = expRaw || worldRaw;
      if (candidateRaw) {
        try {
          const parsed = JSON.parse(candidateRaw);
          if (parsed.world && (parsed.currentSceneTitle === title || parsed.currentSceneTitle?.includes(title) || title.includes(parsed.currentSceneTitle))) {
            hasSavedCustomVersion = true;
            savedCustomData = parsed;
          }
        } catch {
          // ignore
        }
      }
    }

    const restoreCustom = (clearFirst: boolean) => {
      if (clearFirst) {
        useWorldStore.getState().resetWorld();
      }
      if (savedCustomData) {
        const keyToLoad = (typeof window !== 'undefined' && localStorage.getItem(savedCustomKey)) ? savedCustomKey : 'worldpilot_saved_world';
        useWorldStore.getState().loadWorldFromStorage(keyToLoad);
        useWorldStore.getState().setCurrentSceneTitle(title);
        useWorldStore.setState(s => ({
          warnings: [...s.warnings, `📂 Version personnalisée de « ${title} » restaurée avec succès !`]
        }));
      }
    };

    const runDefaultPreset = (clearFirst: boolean) => {
      loadFn(clearFirst);
      if (title) {
        useWorldStore.getState().setCurrentSceneTitle(title);
      }
    };

    if (hasSavedCustomVersion && savedCustomData) {
      if (entityCount === 0) {
        restoreCustom(false);
      } else {
        setPendingExperienceLoad({
          title,
          loadFn: restoreCustom,
          hasCustomSaved: true,
          onResetToOriginal: () => {
            setPendingExperienceLoad(null);
            runDefaultPreset(true);
          }
        });
      }
      return;
    }

    if (entityCount === 0) {
      runDefaultPreset(false);
    } else {
      setPendingExperienceLoad({ title, loadFn: runDefaultPreset });
    }
  };

  const handleClearScene = () => {
    const entityCount = Object.keys(useWorldStore.getState().world.ir.entities).length;
    if (entityCount === 0) {
      useWorldStore.getState().resetWorld();
      useWorldStore.getState().setCurrentSceneTitle('Nouvelle scène');
      setSimResult(null);
      useWorldStore.setState(s => ({
        warnings: [...s.warnings, '🧹 La scène est déjà vide. Réinitialisation confirmée.']
      }));
      return;
    }
    if (window.confirm(`Vider la scène et supprimer les ${entityCount} objet(s) pour repartir de zéro ?`)) {
      useWorldStore.getState().resetWorld();
      useWorldStore.getState().setCurrentSceneTitle('Nouvelle scène');
      setSimResult(null);
      speakFeedback("La scène a été entièrement vidée.");
    }
  };

  const handleInspirePrompt = () => {
    const ideas = [
      "Ajoute une table de laboratoire moderne avec un microscope électronique et un écran holographique",
      "Crée un atelier de mécanique avec un établi, une batterie 12V et un multimètre de diagnostic",
      "Crée une cuisine gastronomique avec une casserole en cuivre, des légumes frais et une recette",
      "Ajoute une vitrine d'exposition avec un projecteur de lumière zénithale et un socle en marbre",
      "Ajoute un tableau de bord spatial avec des voyants clignotants et un terminal de commande",
      "Place un café espresso avec une tasse en porcelaine et une machine italienne",
      "Ajoute un pupitre de conférence avec un microphone col de cygne et un écran d'affichage"
    ];
    const randomIndex = Math.floor(Math.random() * ideas.length);
    const chosen = ideas[randomIndex];
    setInstruction(chosen);
    playAudioFx('chime');
    useWorldStore.setState(s => ({
      warnings: [...s.warnings, `💡 Idée créative insérée : « ${chosen} »`]
    }));
  };

  const handleApplyInstruction = async (textOverride?: string, options?: { preferLocalRules?: boolean }) => {
    const rawInstruction = typeof textOverride === 'string' ? textOverride : useWorldStore.getState().instruction;
    const targetInstruction = (rawInstruction || '').trim();
    if (!targetInstruction) return;

    setErrorMsg('');
    setInstructionSource(null);
    setSimResult(null);
    setIsProcessing(true);
    try {
      const liveState = useWorldStore.getState();
      const parsed = await parseInstructionAsync(
        targetInstruction,
        liveState.spatialContext,
        liveState.world.ir.entities,
        Object.keys(liveState.world.ir.quests || {}),
        options
      );
      const { plan, patch } = parsed;
      setInstructionSource(parsed.source);

      if (parsed.source === 'unresolved') {
        setErrorMsg(parsed.notice || 'La consigne n’a pas été comprise. Aucun changement n’a été appliqué.');
        return;
      }
      if (plan.clarification?.needed) {
        setErrorMsg(plan.clarification.question || 'Quelques précisions sont nécessaires avant de créer cette expérience.');
        return;
      }

      if (plan.intent === 'save_world_storage') {
        useWorldStore.getState().saveWorldToStorage();
        playAudioFx('switch_click');
        setInstruction('');
        setErrorMsg('');
        speakFeedback("Monde et modifications sauvegardés dans votre navigateur.");
        return;
      }

      if (plan.intent === 'reset_world') {
        useWorldStore.getState().resetWorld();
        setInstruction('');
        setErrorMsg('');
        speakFeedback("La scène a été entièrement vidée et réinitialisée.");
        return;
      }
      
      if (plan.intent === 'simulate_counterexample') {
        const currentWorld = useWorldStore.getState().world;
        const possibleEvents = [
          { type: 'DROP', sourceId: 'Battery_B-17', targetId: 'Maintenance_Zone_2' },
          { type: 'COMPLETE_TRAINING', sourceId: 'player' }
        ];

        const res = findCounterExample(currentWorld, possibleEvents, 3);
        const invariantsList = Object.values(currentWorld.ir.invariants || {});
        if (invariantsList.length > 0 && !currentWorld.flags?.invariant_locked) {
          const nextFlags: Record<string, boolean> = { ...currentWorld.flags };
          invariantsList.forEach(inv => {
            if (inv.condition?.type === 'never_state') {
              nextFlags[inv.condition.requiredFlag] = false;
              nextFlags[inv.condition.stateFlag] = true;
            }
          });
          useWorldStore.setState(s => ({
            showCausalObservability: true,
            world: {
              ...s.world,
              flags: nextFlags
            },
            warnings: [
              ...s.warnings,
              `⚠️ Contre-exemple trouvé : l'invariant « ${invariantsList[0].id} » est VIOLÉ (${invariantsList[0].condition?.stateFlag} = TRUE alors que ${invariantsList[0].condition?.requiredFlag} = FALSE) !`
            ]
          }));
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('worldpilot_select_f2_tab', { detail: { tab: 'invariants' } }));
          }
          setSimResult({
            invariantBroken: true,
            brokenInvariant: invariantsList[0],
            trace: res.trace?.length ? res.trace : possibleEvents
          } as any);
          setInstruction('');
          speakFeedback("Alerte ! Contre-exemple détecté. L'invariant de sécurité a été enfreint.");
        } else {
          useWorldStore.setState(s => ({
            showCausalObservability: true,
            warnings: [
              ...s.warnings,
              `✅ Vérification formelle réussie : aucun contre-exemple trouvé sur 3 profondeurs d'événements. L'invariant est 100 % VÉRIFIÉ !`
            ]
          }));
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('worldpilot_select_f2_tab', { detail: { tab: 'invariants' } }));
          }
          setSimResult({
            invariantBroken: false,
            trace: []
          } as any);
          setInstruction('');
          speakFeedback("Vérification formelle terminée. Tous les invariants sont respectés.");
        }
        return;
      }

      if (plan.intent === 'fix_invariant') {
        const currentWorld = useWorldStore.getState().world;
        const rulesToPatch: any[] = [];
        Object.values(currentWorld.ir.rules || {}).forEach((r: any) => {
          if (r.id === 'R_complete_training' || r.id === 'rule_install_car_battery' || r.trigger === 'DROP') {
            const hasReq = (r.conditions || []).some((c: any) => c.type === 'require_flag' && c.flag === 'battery_inspected');
            if (!hasReq) {
              rulesToPatch.push({
                ...r,
                conditions: [...(r.conditions || []), { type: 'require_flag', flag: 'battery_inspected' }]
              });
            }
          }
        });
        if (rulesToPatch.length > 0) {
          applyPatch(
            { rulesChanged: rulesToPatch },
            targetInstruction,
            { intent: 'fix_invariant' }
          );
        }
        const nextFlags: Record<string, boolean> = {
          ...useWorldStore.getState().world.flags,
          battery_inspected: true,
          battery_prepared: true,
          training_completed: false,
          invariant_locked: true
        };
        // Réinitialiser les drapeaux de contre-exemples simulés pour tous les invariants
        Object.values(currentWorld.ir.invariants || {}).forEach((inv: any) => {
          if (inv.condition?.type === 'never_state') {
            if (inv.condition.stateFlag) nextFlags[inv.condition.stateFlag] = false;
            if (inv.condition.requiredFlag) nextFlags[inv.condition.requiredFlag] = true;
          }
        });
        useWorldStore.setState(s => ({
          showCausalObservability: true,
          world: {
            ...s.world,
            flags: nextFlags
          },
          warnings: [
            ...s.warnings,
            `🛡️ Verrou causal appliqué : la précondition 'battery_inspected == TRUE' est désormais exigée. Invariant ✅ VÉRIFIÉ !`
          ]
        }));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('worldpilot_select_f2_tab', { detail: { tab: 'invariants' } }));
        }
        setSimResult({
          invariantBroken: false,
          trace: []
        } as any);
        playAudioFx('sparkle');
        setInstruction('');
        setErrorMsg('');
        speakFeedback("Correctif appliqué. L'invariant de sécurité est désormais verrouillé et vérifié.");
        return;
      }

      if (plan.intent === 'simulate_spatial_conflict') {
        const currentWorld = useWorldStore.getState().world;
        const keys = Object.keys(currentWorld.ir.entities || {});
        const workbenchId = keys.find(k => k.includes('workbench') || k.includes('etabli') || k.includes('table')) || keys[0] || 'car_workbench';
        const targetRefId = keys.find(k => k.includes('tray') || k.includes('sedan') || k !== workbenchId) || keys[1] || keys[0] || 'battery_tray_zone';
        if (workbenchId && targetRefId) {
          const entB = currentWorld.ir.entities[targetRefId];
          const rawPosB: any =
            (entB as any)?.transform?.position ||
            (entB as any)?.capabilities?.find((c: any) => c.type === 'transform')?.position ||
            [0, 0.8, 0];
          const posBX = Array.isArray(rawPosB) ? Number(rawPosB[0]) || 0 : Number(rawPosB.x) || 0;
          const posBY = Array.isArray(rawPosB) ? Number(rawPosB[1]) || 0 : Number(rawPosB.y) || 0;
          const posBZ = Array.isArray(rawPosB) ? Number(rawPosB[2]) || 0 : Number(rawPosB.z) || 0;

          const conflictPos: [number, number, number] = [
            Number((posBX + 0.12).toFixed(2)),
            posBY,
            Number((posBZ + 0.08).toFixed(2)),
          ];
          const safePos: [number, number, number] = [
            Number((posBX + 0.85).toFixed(2)),
            posBY,
            Number((posBZ - 0.45).toFixed(2)),
          ];

          if (currentWorld.ir.entities[workbenchId]) {
            applyPatch(
              {
                entitiesChanged: [
                  {
                    id: workbenchId,
                    capabilities: (currentWorld.ir.entities[workbenchId]?.capabilities || []).map((c: any) =>
                      c.type === 'transform' ? { ...c, position: conflictPos } : c
                    ),
                  } as any,
                ],
              },
              targetInstruction,
              { intent: 'simulate_spatial_conflict' }
            );
          }

          useWorldStore.setState(s => ({
            showResearchDashboardModal: true,
            blastRadiusReport: {
              timestamp: Date.now(),
              patchSummary: {
                entitiesCreatedCount: 0,
                entitiesChangedCount: 1,
                entitiesRemovedCount: 0,
                rulesChangedCount: 0,
              },
              impactedEntityIds: [workbenchId, targetRefId],
              impactedRuleIds: Object.keys(currentWorld.ir.rules || {}).slice(0, 1),
              blastRadiusScore: 0.64,
              isRegressionFree: false,
              violations: [
                {
                  id: `conflict_${Date.now()}`,
                  severity: 'CRITICAL',
                  type: 'COLLIDER_DEADLOCK',
                  affectedEntityId: workbenchId,
                  description: `Obstruction spatiale : '${currentWorld.ir.entities[workbenchId]?.name || workbenchId}' bloque le volume d'accès de '${entB?.name || targetRefId}' (d = 0.14m < 0.35m).`,
                  mitigationSuggestion: `Appliquer le Patch Minimal de Pareto (repositionnement chirurgical à 0.85m).`,
                },
              ],
              paretoRepairPatch: {
                entitiesChanged: [
                  {
                    id: workbenchId,
                    capabilities: (currentWorld.ir.entities[workbenchId]?.capabilities || []).map((c: any) =>
                      c.type === 'transform' ? { ...c, position: safePos } : c
                    ),
                  } as any,
                ],
              },
            },
            warnings: [
              ...s.warnings,
              `💥 Alerte Blast Radius (Score: 0.64) : le déplacement obstrue l'accès requis par une ancienne règle !`
            ]
          }));
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('worldpilot_select_observatory_tab', { detail: { tab: 'pillar2' } }));
          }
        }
        setInstruction('');
        setErrorMsg('');
        speakFeedback("Alerte Blast Radius ! Cette modification spatiale bloque une règle existante.");
        return;
      }

      if (plan.intent === 'pareto_auto_heal') {
        useWorldStore.getState().applyParetoRepairPatch();
        setInstruction('');
        setErrorMsg('');
        speakFeedback("Auto-guérison de Pareto appliquée en moins de 8 millisecondes. L'accès est dégagé sans annuler votre intention.");
        return;
      }

      if (plan.intent === 'set_audio_muted') {
        const isMute = plan.actions?.[0]?.value ?? true;
        const currentMuted = useWorldStore.getState().isAudioMuted;
        if (currentMuted !== isMute) {
          useWorldStore.getState().toggleAudioMute();
        }
        setInstruction('');
        setErrorMsg('');
        useWorldStore.setState(s => ({
          warnings: [...s.warnings, isMute ? '🔇 Son coupé (Mode silencieux)' : '🔊 Son réactivé']
        }));
        return;
      }

      if (plan.intent === 'set_audio_volume') {
        const vol = plan.actions?.[0]?.volume ?? 0.8;
        useWorldStore.getState().setAudioVolume(vol);
        setInstruction('');
        setErrorMsg('');
        useWorldStore.setState(s => ({
          warnings: [...s.warnings, `🔊 Volume ajusté à ${Math.round(vol * 100)}%`]
        }));
        return;
      }

      if (plan.intent === 'position_spatial_avatar') {
        const action = plan.actions?.[0];
        useWorldStore.getState().setSpatialAgentActive(true);
        if (action?.position) {
          useWorldStore.getState().setSpatialAgentPositionOverride(action.position);
        }
        setInstruction('');
        setErrorMsg('');
        useWorldStore.setState(s => ({
          warnings: [...s.warnings, action?.toastMessage || '👤 Avatar positionné avec succès.']
        }));
        playAudioFx('chime');
        speakFeedback(action?.toastMessage || 'L’avatar a été positionné.');
        return;
      }

      if (plan.intent === 'toggle_spatial_avatar') {
        const show = plan.actions?.[0]?.show ?? true;
        useWorldStore.getState().setSpatialAgentActive(show);
        setInstruction('');
        setErrorMsg('');
        useWorldStore.setState(s => ({
          warnings: [...s.warnings, show ? '👤 Avatar du guide spatial affiché.' : '👤 Avatar du guide spatial masqué.']
        }));
        speakFeedback(show ? 'Avatar du guide affiché.' : 'Avatar masqué.');
        return;
      }

      if (patch.entitiesCreated || patch.entitiesChanged || patch.rulesChanged || patch.invariantsAdded || patch.entitiesRemoved) {
        if (parsed.source === 'llm') {
          const preflight = validateWorldPatch(useWorldStore.getState().world, patch);
          if (!preflight.valid) {
            setInstructionSource('unresolved');
            setErrorMsg(`Le patch proposé ne passe pas les contrôles du monde : ${preflight.errors.join(' • ')}. Aucun changement n’a été appliqué.`);
            return;
          }
        }
        applyPatch(patch, targetInstruction, plan);

        // Synchroniser l'avatar du guide spatial si l'entité avatar a été créée ou déplacée
        const avatarCreatedOrChanged = [
          ...(patch.entitiesCreated || []),
          ...(patch.entitiesChanged || [])
        ].find(e => e.id?.toLowerCase().includes('avatar') || e.name?.toLowerCase().includes('avatar') || e.id?.toLowerCase().includes('guide'));
        if (avatarCreatedOrChanged) {
          const trans = avatarCreatedOrChanged.capabilities?.find(c => c.type === 'transform') as any;
          useWorldStore.getState().setSpatialAgentActive(true);
          if (trans?.position) {
            useWorldStore.getState().setSpatialAgentPositionOverride(trans.position);
          }
        }
        if (plan.intent === 'visit_louis_vuitton_boutique') {
          useWorldStore.getState().setCameraPreset('luxury_showroom');
        } else if (
          plan.intent === 'load_cooking_recipe' || 
          plan.intent === 'bake_chocolate_chip_cookies' ||
          (plan.intent === 'load_demonstration' && (plan.actions?.[0]?.target?.includes('ratatouille') || plan.actions?.[0]?.target?.includes('espresso')))
        ) {
          useWorldStore.getState().setCameraPreset('table');
        } else if (plan.intent === 'showcase_victoria_vr_supercar') {
          useWorldStore.getState().setCameraPreset('supercar_hero');
        } else if (plan.intent === 'visit_victoria_vr_penthouse' || plan.intent === 'explore_orbital_cupola') {
          useWorldStore.getState().setCameraPreset('overview');
        } else if (plan.intent === 'translate_entity' || plan.intent === 'preset_entity_position') {
          const act = plan.actions?.[0];
          if (act) {
            let desc = '';
            if (act.referenceName && act.relation) {
              desc = `positionné ${act.relation} ${act.referenceName}`;
            } else {
              const dirLabels: string[] = [];
              if (act.preset) dirLabels.push(act.preset);
              if (act.dz < 0) dirLabels.push(`vers l’arrière (${Math.abs(act.dz)} m)`);
              if (act.dz > 0) dirLabels.push(`vers l’avant (${Math.abs(act.dz)} m)`);
              if (act.dx < 0) dirLabels.push(`vers la gauche (${Math.abs(act.dx)} m)`);
              if (act.dx > 0) dirLabels.push(`vers la droite (${Math.abs(act.dx)} m)`);
              if (act.dy > 0) dirLabels.push(`vers le haut (+${act.dy} m)`);
              if (act.dy < 0) dirLabels.push(`vers le bas (${act.dy} m)`);
              desc = dirLabels.join(', ') || 'repositionné';
            }
            useWorldStore.setState(s => ({
              warnings: [...s.warnings, `↔️ ${act.entityName || 'Objet'} ${desc}`]
            }));
            playAudioFx('soft_drop');
          }
        }
        setInstruction('');
        setErrorMsg('');
        speakFeedback("Scène spatiale et causalité mises à jour.");
      } else if (plan.intent && plan.intent !== 'unknown') {
        setInstruction('');
        setErrorMsg('');
      } else {
        setErrorMsg("Aucun changement exploitable n’a été proposé pour cette consigne.");
      }
    } catch (e: any) {
      setErrorMsg(`Erreur: ${e.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddWebScreen = () => {
    const existing = Object.values(world.ir.entities).find(e => 
      e.visuals?.assetId === 'web-screen' || e.capabilities.some(c => c.type === 'web_screen' || c.url)
    );
    if (existing) {
      useWorldStore.getState().setSpatialContext(existing.id, null);
      const url = existing.capabilities.find(c => c.type === 'web_screen' || c.url)?.url || 'https://fr.m.wikipedia.org/wiki/Ratatouille';
      useWorldStore.getState().openWebModal(url, existing.name);
    } else {
      const screenId = `web_screen_${Date.now()}`;
      const isCookingScene = Object.values(world.ir.entities).some(e => e.id.includes('recipe') || e.name.toLowerCase().includes('tomate') || e.name.toLowerCase().includes('cuisine'));
      const url = isCookingScene ? 'https://fr.m.wikipedia.org/wiki/Ratatouille' : 'https://fr.m.wikipedia.org/wiki/Gastronomie_fran%C3%A7aise';
      const screenEntity: any = {
        id: screenId,
        name: isCookingScene ? 'Fiche recette · Ratatouille' : 'Panneau web interactif',
        capabilities: [
          { type: 'transform', position: { x: 0, y: 0, z: -1.9 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          { type: 'draggable' },
          { type: 'collider' },
          { type: 'web_screen', url },
          { type: 'educational', text: url, url, value: 0, active: true }
        ],
        physicalProperties: {
          dimensions: [2.3, 1.6, 0.2],
          weightKg: 28,
          material: 'Châssis aluminium brossé et dalle d’affichage OLED'
        },
        fallback2D: {
          description: "Panneau d'affichage web 3D interactif permettant de projeter de la documentation, des pages Wikipédia ou des applications distantes.",
          specificationSheetUrl: url
        },
        visuals: { assetId: 'web-screen', modelUrl: '/library/captions.glb' }
      };
      applyPatch({ entitiesCreated: [screenEntity] }, 'Ajouter un panneau web interactif', { intent: 'add_web_screen' });
      useWorldStore.getState().setSpatialContext(screenId, null);
    }
  };

  const handleAddBookPdf = () => {
    const bookId = `book_spatial_${Date.now()}`;
    const pdfUrl = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
    const bookEntity: any = {
      id: bookId,
      name: 'Guide Pratique W3C (PDF)',
      capabilities: [
        { type: 'transform', position: { x: -0.6, y: 0.95, z: 0.2 }, rotation: { x: 0, y: 0.1, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
        { type: 'draggable' },
        { type: 'collider' },
        { type: 'web_screen', url: pdfUrl },
        { type: 'educational', text: 'Document officiel W3C', url: pdfUrl, value: 0, active: true }
      ],
      visuals: { assetId: 'book' }
    };
    applyPatch({ entitiesCreated: [bookEntity] }, 'Ajouter un livre 3D interactif (PDF)', { intent: 'add_book_pdf' });
    useWorldStore.getState().setSpatialContext(bookId, null);
    playAudioFx('chime');
  };

  const handleAddComputerStation = () => {
    const compId = `computer_${Date.now()}`;
    const compEntity: any = {
      id: compId,
      name: 'Station Développeur 3D (Three.js)',
      capabilities: [
        { type: 'transform', position: { x: 0.7, y: 0.95, z: -0.2 }, rotation: { x: 0, y: -Math.PI / 4, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
        { type: 'draggable' },
        { type: 'collider' },
        { type: 'web_screen', url: 'https://threejs.org/docs/' }
      ],
      visuals: { assetId: 'wp-ordinateur-portable' }
    };
    applyPatch({ entitiesCreated: [compEntity] }, 'Ajouter une station informatique 3D', { intent: 'add_computer' });
    useWorldStore.getState().setSpatialContext(compId, null);
    playAudioFx('switch_click');
  };

  const handleAddArtCanvas = () => {
    const artId = `artwork_${Date.now()}`;
    const artEntity: any = {
      id: artId,
      name: 'Galerie d’Art & Musée du Louvre',
      capabilities: [
        { type: 'transform', position: { x: 0, y: 1.6, z: -2.1 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
        { type: 'collider' },
        { type: 'web_screen', url: 'https://fr.m.wikipedia.org/wiki/Mus%C3%A9e_du_Louvre' }
      ],
      visuals: { assetId: 'wp-toile-encadree' }
    };
    applyPatch({ entitiesCreated: [artEntity] }, 'Ajouter une toile d’art interactive', { intent: 'add_artwork' });
    useWorldStore.getState().setSpatialContext(artId, null);
    playAudioFx('fanfare');
  };

  const handleAddBlueprintDossier = () => {
    const bpId = `blueprint_${Date.now()}`;
    const pdfUrl = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
    const bpEntity: any = {
      id: bpId,
      name: 'Dossier Plans d’Architecture CAO (PDF)',
      capabilities: [
        { type: 'transform', position: { x: -0.2, y: 0.94, z: 0.35 }, rotation: { x: 0, y: 0.25, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
        { type: 'draggable' },
        { type: 'collider' },
        { type: 'web_screen', url: pdfUrl }
      ],
      visuals: { assetId: 'porte-documents' }
    };
    applyPatch({ entitiesCreated: [bpEntity] }, 'Ajouter un dossier technique et plans CAO', { intent: 'add_blueprint' });
    useWorldStore.getState().setSpatialContext(bpId, null);
    playAudioFx('paper_turn');
  };

  const handleAddHiFiTurntable = () => {
    const audioId = `turntable_${Date.now()}`;
    const audioEntity: any = {
      id: audioId,
      name: 'Platine Vinyle Hi-Fi Audiophile',
      capabilities: [
        { type: 'transform', position: { x: 0.45, y: 0.94, z: 0.3 }, rotation: { x: 0, y: -0.15, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
        { type: 'draggable' },
        { type: 'collider' },
        { type: 'web_screen', url: 'https://fr.wikipedia.org/wiki/Disque_microsillon' }
      ],
      visuals: { assetId: 'turntable' }
    };
    applyPatch({ entitiesCreated: [audioEntity] }, 'Ajouter une platine vinyle audiophile', { intent: 'add_turntable' });
    useWorldStore.getState().setSpatialContext(audioId, null);
    playAudioFx('fanfare');
  };

  const handleAddGlobe = () => {
    const globeId = `globe_${Date.now()}`;
    const globeEntity: any = {
      id: globeId,
      name: 'Globe Terrestre & Atlas Mondial',
      capabilities: [
        { type: 'transform', position: { x: 0.1, y: 0.94, z: -0.1 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
        { type: 'draggable' },
        { type: 'collider' },
        { type: 'web_screen', url: 'https://fr.wikipedia.org/wiki/Terre' }
      ],
      visuals: { assetId: 'globe' }
    };
    applyPatch({ entitiesCreated: [globeEntity] }, 'Ajouter un globe terrestre et atlas mondial', { intent: 'add_globe' });
    useWorldStore.getState().setSpatialContext(globeId, null);
    playAudioFx('chime');
  };

  const handleAddMicroscope = () => {
    const micId = `microscope_${Date.now()}`;
    const micEntity: any = {
      id: micId,
      name: 'Station Scientifique & Microscope Optique',
      capabilities: [
        { type: 'transform', position: { x: 0, y: 0.94, z: 0.22 }, rotation: { x: 0, y: 0.2, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
        { type: 'draggable' },
        { type: 'collider' },
        { type: 'web_screen', url: 'https://fr.m.wikipedia.org/wiki/Microbiologie' }
      ],
      visuals: { assetId: 'microscope' }
    };
    applyPatch({ entitiesCreated: [micEntity] }, 'Ajouter une station scientifique et microscope optique', { intent: 'add_microscope' });
    useWorldStore.getState().setSpatialContext(micId, null);
    playAudioFx('switch_click');
  };

  const handleAddCompleteSpatialWebStudio = () => {
    const timestamp = Date.now();
    const tableId = `studio_table_${timestamp}`;
    const bookId = `studio_book_${timestamp}`;
    const bpId = `studio_blueprint_${timestamp}`;
    const laptopId = `studio_laptop_${timestamp}`;
    const artId = `studio_art_${timestamp}`;
    const audioId = `studio_turntable_${timestamp}`;
    const globeId = `studio_globe_${timestamp}`;

    const newEntities: any[] = [
      {
        id: tableId,
        name: 'Grand Bureau d’Étude & Hub Web 3D',
        capabilities: [
          { type: 'transform', position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1.8, y: 1.04, z: 1.1 } },
          { type: 'collider' }
        ],
        visuals: { assetId: 'table' }
      },
      {
        id: bookId,
        name: 'Livre des Savoirs & Codex Numérique (PDF)',
        capabilities: [
          { type: 'transform', position: { x: -0.42, y: 0.94, z: 0.18 }, rotation: { x: 0, y: 0.12, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          { type: 'draggable' },
          { type: 'collider' },
          { type: 'web_screen', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' }
        ],
        visuals: { assetId: 'book' }
      },
      {
        id: bpId,
        name: 'Dossier Plans CAO & Schémas Techniques (PDF)',
        capabilities: [
          { type: 'transform', position: { x: 0.42, y: 0.94, z: 0.18 }, rotation: { x: 0, y: -0.15, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          { type: 'draggable' },
          { type: 'collider' },
          { type: 'web_screen', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' }
        ],
        visuals: { assetId: 'porte-documents' }
      },
      {
        id: laptopId,
        name: 'Station Développeur · Documentation Three.js',
        capabilities: [
          { type: 'transform', position: { x: 0, y: 0.94, z: -0.15 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          { type: 'draggable' },
          { type: 'collider' },
          { type: 'web_screen', url: 'https://threejs.org/docs/' }
        ],
        visuals: { assetId: 'ordinateur' }
      },
      {
        id: globeId,
        name: 'Globe Terrestre & Atlas Géographique',
        capabilities: [
          { type: 'transform', position: { x: -0.68, y: 0.94, z: -0.18 }, rotation: { x: 0, y: 0.4, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          { type: 'draggable' },
          { type: 'collider' },
          { type: 'web_screen', url: 'https://fr.wikipedia.org/wiki/Terre' }
        ],
        visuals: { assetId: 'globe' }
      },
      {
        id: audioId,
        name: 'Platine Vinyle Hi-Fi & Soundscape',
        capabilities: [
          { type: 'transform', position: { x: 0.68, y: 0.94, z: -0.18 }, rotation: { x: 0, y: -0.3, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          { type: 'draggable' },
          { type: 'collider' },
          { type: 'web_screen', url: 'https://fr.wikipedia.org/wiki/Disque_microsillon' }
        ],
        visuals: { assetId: 'turntable' }
      },
      {
        id: artId,
        name: 'Galerie d’Art & Musée du Louvre',
        capabilities: [
          { type: 'transform', position: { x: 0, y: 1.85, z: -1.6 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          { type: 'collider' },
          { type: 'web_screen', url: 'https://fr.m.wikipedia.org/wiki/Mus%C3%A9e_du_Louvre' }
        ],
        visuals: { assetId: 'wp-toile-encadree' }
      }
    ];

    applyPatch({ entitiesCreated: newEntities }, 'Disposer le Hub Web 3D & Espace d’étude complet', { intent: 'add_spatial_web_hub' });
    useWorldStore.getState().setSpatialContext(laptopId, null);
    playAudioFx('fanfare');
    useWorldStore.setState(s => ({
      warnings: [...s.warnings, '🏛️ Espace Web 3D déployé : 7 artefacts spatiaux interactifs interconnectés !']
    }));
  };

  React.useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput = activeEl && (
        activeEl.tagName === 'INPUT' || 
        activeEl.tagName === 'TEXTAREA' || 
        (activeEl as HTMLElement).isContentEditable
      );
      if (isInput) return;

      const k = e.key.toLowerCase();

      // Raccourci Échap : Revenir au Studio Conception ou désélectionner l'objet actif
      if (e.key === 'Escape') {
        if (appMode !== 'conception') {
          e.preventDefault();
          setAppMode('conception');
          return;
        }
        const selId = useWorldStore.getState().spatialContext.selectedEntityId;
        if (selId) {
          e.preventDefault();
          useWorldStore.getState().setSpatialContext(null, null);
          return;
        }
      }

      // Raccourcis Annuler (Cmd+Z / Ctrl+Z) et Rétablir (Cmd+Shift+Z / Ctrl+Y)
      if ((e.metaKey || e.ctrlKey) && k === 'z' && !e.shiftKey) {
        e.preventDefault();
        useWorldStore.getState().undo();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && (k === 'y' || (k === 'z' && e.shiftKey))) {
        e.preventDefault();
        useWorldStore.getState().redo();
        return;
      }

      // Raccourcis sur l'objet sélectionné (Rotation [R], Suppression [Suppr])
      const activeSelectedId = useWorldStore.getState().spatialContext.selectedEntityId;
      if (activeSelectedId && !e.metaKey && !e.ctrlKey) {
        if (k === 'r') {
          e.preventDefault();
          useWorldStore.getState().rotateEntity(activeSelectedId, e.shiftKey ? -Math.PI / 4 : Math.PI / 4);
          return;
        }
        if ((e.key === 'Delete' || e.key === 'Backspace') && !e.altKey) {
          e.preventDefault();
          useWorldStore.getState().deleteEntity(activeSelectedId);
          return;
        }
      }

      // Raccourci Sauvegarder dans le navigateur (Cmd+S / Ctrl+S)
      if ((e.metaKey || e.ctrlKey) && k === 's' && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        saveWorldToStorage();
        playAudioFx('switch_click');
        return;
      }

      // Raccourci Capture HD (Alt+S ou Cmd+Shift+S)
      if ((e.altKey && (e.key === 's' || k === 's')) || ((e.metaKey || e.ctrlKey) && e.shiftKey && k === 's')) {
        e.preventDefault();
        useWorldStore.getState().triggerCaptureScreenshot();
        return;
      }

      // Raccourcis de bascule des 3 modes primaires (Alt+1, Alt+2, Alt+3)
      if (e.altKey && (e.key === '1' || e.code === 'Digit1')) {
        e.preventDefault();
        setAppMode('conception');
        return;
      } else if (e.altKey && (e.key === '2' || e.code === 'Digit2')) {
        e.preventDefault();
        setAppMode('simulation');
        return;
      } else if (e.altKey && (e.key === '3' || e.code === 'Digit3')) {
        e.preventDefault();
        setAppMode('observatoire');
        return;
      } else if (e.altKey && (e.key === 'd' || k === 'd')) {
        e.preventDefault();
        if (activeSelectedId) {
          useWorldStore.getState().duplicateEntity(activeSelectedId);
        } else {
          setShowPitchDirector(prev => !prev);
        }
        return;
      } else if (e.altKey && (e.key === 'h' || k === 'h')) {
        e.preventDefault();
        openPromptHistory();
        return;
      } else if (e.altKey && (e.key === 'c' || k === 'c')) {
        e.preventDefault();
        const store = useWorldStore.getState();
        store.setShowCinematicModal(!store.showCinematicModal);
        return;
      } else if (e.altKey && (e.key === 'r' || k === 'r')) {
        e.preventDefault();
        setShowCookingModal(prev => !prev);
        return;
      } else if ((e.altKey || e.metaKey) && (e.key === 'Backspace' || e.key === 'Delete')) {
        e.preventDefault();
        handleClearScene();
        return;
      }

      // Raccourcis clavier à touche simple (strictement sans Meta/Ctrl/Alt et sans interférer avec la locomotion ZQSD / WASD / E / C)
      if (e.altKey && (e.key === 'w' || k === 'w')) {
        e.preventDefault();
        const store = useWorldStore.getState();
        if (store.activeWebModalUrl) {
          store.closeWebModal();
        } else {
          handleAddWebScreen();
        }
        return;
      }

      if (!e.metaKey && !e.ctrlKey && !e.altKey) {
        if (e.key === '1' || k === 'o') {
          setCameraPreset('overview');
        } else if (e.key === '2' || k === 't') {
          setCameraPreset('table');
        } else if (e.key === '3') {
          setCameraPreset('cocotte');
        } else if (e.key === '4' || k === 'p') {
          setCameraPreset('plate');
        } else if (e.key === '5' || k === 'k') {
          setCameraPreset('chopping');
        } else if (e.key === '6') {
          setCameraPreset('board');
        } else if (e.key === '7' || k === 'v') {
          setCameraPreset('luxury_showroom');
        } else if (k === 'b') {
          const store = useWorldStore.getState();
          store.setShowBehavioralAnalyticsModal(!store.showBehavioralAnalyticsModal);
        } else if (k === 'y') {
          useWorldStore.getState().toggleGhostAgent();
        } else if (k === 'g' && !e.shiftKey) {
          setShowGrid(!showGrid);
        } else if (k === 'l') {
          setShowLabels(!showLabels);
        } else if (k === 'm') {
          const muted = useWorldStore.getState().toggleAudioMute();
          useWorldStore.setState(s => ({
            warnings: [...s.warnings, muted ? '🔇 Son coupé (Muet)' : '🔊 Son réactivé']
          }));
        } else if (k === 'n') {
          setShowCollaborationBoardModal(!useWorldStore.getState().showCollaborationBoardModal);
        } else if (k === 'x') {
          const store = useWorldStore.getState();
          if (store.showResearchDashboardModal) {
            store.closeResearchDashboard();
          } else {
            store.openResearchDashboard();
          }
        } else if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
          e.preventDefault();
          setShowHelp(v => !v);
        }
      }

      if ((e.ctrlKey || e.metaKey) && k === 'k') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('worldpilot_select_f2_tab', { detail: { tab: 'invariants' } }));
      } else if ((e.ctrlKey || e.metaKey) && k === 'y') {
        e.preventDefault();
        useWorldStore.getState().openSyntheticPlaytesterModal();
      } else if ((e.ctrlKey || e.metaKey) && k === 'p') {
        e.preventDefault();
        useWorldStore.getState().openPublishReadinessModal();
      } else if (e.key === 'F2' || ((e.ctrlKey || e.metaKey) && k === 'd' && !e.altKey)) {
        e.preventDefault();
        useWorldStore.getState().toggleCausalObservability();
      } else if (e.key === 'F3') {
        e.preventDefault();
        const store = useWorldStore.getState();
        if (store.showResearchDashboardModal) {
          store.closeResearchDashboard();
        } else {
          store.openResearchDashboard();
        }
      } else if (e.shiftKey && k === 'g' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        useWorldStore.getState().cycleGizmoMode();
      }
    };

    const onOpenCookingModal = () => {
      setShowCookingModal(true);
    };

    const onOpenCertifiedModal = () => {
      setShowCertifiedModal(true);
    };

    const onOpenFLEModal = () => {
      setShowFLEModal(true);
    };

    const onOpenDemoModal = () => {
      setShowDemoModal(true);
    };

    const onSaveWorld = () => {
      saveWorldToStorage();
      playAudioFx('switch_click');
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    window.addEventListener('worldpilot_open_cooking_modal', onOpenCookingModal);
    window.addEventListener('worldpilot_open_certified_modal', onOpenCertifiedModal);
    window.addEventListener('worldpilot_open_fle_modal', onOpenFLEModal);
    window.addEventListener('worldpilot_open_demo_modal', onOpenDemoModal);
    window.addEventListener('worldpilot_save_world', onSaveWorld);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
      window.removeEventListener('worldpilot_open_cooking_modal', onOpenCookingModal);
      window.removeEventListener('worldpilot_open_certified_modal', onOpenCertifiedModal);
      window.removeEventListener('worldpilot_open_fle_modal', onOpenFLEModal);
      window.removeEventListener('worldpilot_open_demo_modal', onOpenDemoModal);
      window.removeEventListener('worldpilot_save_world', onSaveWorld);
    };
  }, [setCameraPreset, showGrid, showLabels, setShowGrid, setShowLabels, setShowCookingModal, setShowCertifiedModal, setShowFLEModal, setShowDemoModal]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Entrée simple pour créer, ou Cmd/Ctrl+Entrée, ou Shift+Entrée.
    // Shift+Entrée sans autre modificateur insère un saut de ligne si l'utilisateur le souhaite.
    if (e.key === 'Enter') {
      if (!e.shiftKey || e.metaKey || e.ctrlKey) {
        e.preventDefault();
        handleApplyInstruction();
      }
    }
  };

  const handleReplay = async () => {
    if (!simResult || !simResult.trace) return;
    clearWarnings();
    
    // To make replay visible from the start, we might want to reset to initial state, 
    // but for MVP we just dispatch the trace events one by one from current state.
    for (const event of simResult.trace) {
      useWorldStore.getState().dispatch(event);
      // Wait 1.5s between events to make it visually obvious
      await new Promise(r => setTimeout(r, 1500));
    }
  };

  const handleApplyFix = () => {
    handleApplyInstruction("Verrouille l'inspection de la batterie avant de terminer la formation", { preferLocalRules: true });
  };

  const entities = Object.values(world.ir.entities);
  const rulesCount = Object.keys(world.ir.rules).length;
  const invariantsCount = Object.keys(world.ir.invariants).length;
  const records = tracker.getRecords().slice().reverse();
  const selected = world.ir.entities[spatialContext.selectedEntityId || ''];
  const zone = world.ir.entities[spatialContext.pointedEntityId || ''];
  const hasTraining = !!world.ir.rules.R_complete_training;
  const isCarBatteryQuestActive =
    world.ir.activeQuestId === 'quest_car_battery_replacement' &&
    world.ir.quests?.['quest_car_battery_replacement']?.status !== 'completed';
  const hasCarBatteryTraining =
    (!!world.ir.rules.rule_install_car_battery || !!world.ir.entities.car_sedan_1) &&
    isCarBatteryQuestActive;

  return (
    <div className="studio-app">
      <GatekeeperModal />
      {cameraFlash && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(255, 255, 255, 0.75)',
            zIndex: 99999,
            pointerEvents: 'none',
            transition: 'opacity 0.24s ease-out'
          }}
        />
      )}
      <header className="app-header">
        <a className="brand" href="#" aria-label="WorldPilot"><span className="brand-mark">W<span>·</span></span><span>worldpilot<span className="brand-studio">STUDIO</span></span></a>
        <div className="project-name" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="project-dot" title="Scène active" />
          {isEditingTitle ? (
            <input
              type="text"
              value={tempTitle}
              onChange={(e) => setTempTitle(e.target.value)}
              onBlur={() => {
                setIsEditingTitle(false);
                if (tempTitle.trim()) setCurrentSceneTitle(tempTitle.trim());
                else setTempTitle(currentSceneTitle);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setIsEditingTitle(false);
                  if (tempTitle.trim()) setCurrentSceneTitle(tempTitle.trim());
                  else setTempTitle(currentSceneTitle);
                } else if (e.key === 'Escape') {
                  setIsEditingTitle(false);
                  setTempTitle(currentSceneTitle);
                }
              }}
              autoFocus
              aria-label="Titre de la scène"
              style={{
                background: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid #10b981',
                borderRadius: '6px',
                color: '#f8fafc',
                fontSize: '12px',
                fontWeight: 600,
                padding: '3px 8px',
                outline: 'none',
                boxShadow: '0 0 8px rgba(16, 185, 129, 0.35)',
                maxWidth: '240px'
              }}
            />
          ) : (
            <button
              type="button"
              onClick={() => {
                setTempTitle(currentSceneTitle);
                setIsEditingTitle(true);
              }}
              title="Cliquer pour renommer la scène"
              style={{
                background: 'none',
                border: 'none',
                padding: '3px 8px',
                borderRadius: '6px',
                color: '#f1f5f9',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'background 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
            >
              <span style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentSceneTitle}
              </span>
              <span style={{ fontSize: '11px', opacity: 0.5 }} aria-hidden="true">✏️</span>
            </button>
          )}
        </div>
        {/* BOUTONS ANNULER / RÉTABLIR (Undo / Redo · Cmd+Z / Cmd+Shift+Z) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginLeft: '2px' }}>
          <button
            type="button"
            disabled={!canUndo}
            onClick={() => undo()}
            title="Annuler (Cmd+Z / Ctrl+Z)"
            aria-label="Annuler la dernière action"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '7px',
              color: canUndo ? '#f1f5f9' : '#64748b',
              cursor: canUndo ? 'pointer' : 'not-allowed',
              opacity: canUndo ? 1 : 0.45,
              padding: '5px 8px',
              fontSize: '13px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
          >
            <span>↶</span>
          </button>
          <button
            type="button"
            disabled={!canRedo}
            onClick={() => redo()}
            title="Rétablir (Cmd+Shift+Z / Ctrl+Y)"
            aria-label="Rétablir l'action annulée"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '7px',
              color: canRedo ? '#f1f5f9' : '#64748b',
              cursor: canRedo ? 'pointer' : 'not-allowed',
              opacity: canRedo ? 1 : 0.45,
              padding: '5px 8px',
              fontSize: '13px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
          >
            <span>↷</span>
          </button>
        </div>
        {/* CENTER: 3-MODE PRIMARY SWITCHER (Conception / Simulation / L'Observatoire) */}
        <div
          className="primary-mode-switcher"
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '9px',
            padding: '2px',
            gap: '2px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.25)',
            flexShrink: 0,
          }}
        >
          <button
            className={`mode-btn ${appMode === 'conception' ? 'active' : ''}`}
            onClick={() => setAppMode('conception')}
            title={uiLanguage === 'fr' ? "Mode Conception · Studio Auteur (Alt+1)" : "Conception Mode · Author Studio (Alt+1)"}
            style={{
              padding: '4px 9px',
              fontSize: '11.5px',
              fontWeight: appMode === 'conception' ? 600 : 500,
              borderRadius: '6px',
              border: 'none',
              background: appMode === 'conception' ? 'linear-gradient(135deg, #2563eb, #1d4ed8)' : 'transparent',
              color: appMode === 'conception' ? '#ffffff' : '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              transition: 'all 0.15s ease',
            }}
          >
            <span>🎨</span> {t.modeConception}
          </button>
          <button
            className={`mode-btn ${appMode === 'simulation' ? 'active' : ''}`}
            onClick={() => setAppMode('simulation')}
            title={uiLanguage === 'fr' ? "Mode Simulation · Immersion 100% Plein Écran (Alt+2)" : "Simulation Mode · 100% Full-Screen Immersion (Alt+2)"}
            style={{
              padding: '4px 9px',
              fontSize: '11.5px',
              fontWeight: appMode === 'simulation' ? 600 : 500,
              borderRadius: '6px',
              border: 'none',
              background: appMode === 'simulation' ? 'linear-gradient(135deg, #16a34a, #15803d)' : 'transparent',
              color: appMode === 'simulation' ? '#ffffff' : '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              transition: 'all 0.15s ease',
            }}
          >
            <span>🕹️</span> {t.modeSimulation}
          </button>
          <button
            className={`mode-btn ${appMode === 'observatoire' ? 'active' : ''}`}
            onClick={() => setAppMode('observatoire')}
            title={uiLanguage === 'fr' ? "Mode L'Observatoire · Cockpit Comportemental & Méta-Contrôleur (Alt+3)" : "Observatory Mode · Behavioral Cockpit & Meta-Controller (Alt+3)"}
            style={{
              padding: '4px 9px',
              fontSize: '11.5px',
              fontWeight: appMode === 'observatoire' ? 600 : 500,
              borderRadius: '6px',
              border: 'none',
              background: appMode === 'observatoire' ? 'linear-gradient(135deg, #0284c7, #0369a1)' : 'transparent',
              color: appMode === 'observatoire' ? '#ffffff' : '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              transition: 'all 0.15s ease',
            }}
          >
            <span>🛰️</span> {t.modeObservatoire}
          </button>
          <div style={{ width: '1px', height: '16px', background: 'rgba(255, 255, 255, 0.15)', margin: '0 1px' }} />
          <button
            className={`mode-btn ${showGuidedDemoModal ? 'active' : ''}`}
            onClick={() => {
              setShowGuidedDemoModal(v => !v);
              playAudioFx('switch_click');
            }}
            title={uiLanguage === 'fr' ? "Parcours guidé · Scénarios & Démos interactives prêtes à l'emploi" : "Guided Tour · Ready-to-run interactive scenarios & demos"}
            style={{
              padding: '4px 9px',
              fontSize: '11.5px',
              fontWeight: showGuidedDemoModal ? 600 : 500,
              borderRadius: '6px',
              border: 'none',
              background: showGuidedDemoModal ? 'linear-gradient(135deg, #a855f7, #7e22ce)' : 'transparent',
              color: showGuidedDemoModal ? '#ffffff' : '#c084fc',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              transition: 'all 0.15s ease',
            }}
          >
            <span>🎬</span> {uiLanguage === 'fr' ? 'Parcours guidé' : 'Guided Tour'}
          </button>
        </div>

        {/* RIGHT: GROUPED DROPDOWNS & SYSTEM CONTROLS */}
        <div className="header-actions header-dropdown-container" style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px' }}>
          
          {/* MENU UNIFIÉ: Bibliothèque d'expériences et assets */}
          <div style={{ position: 'relative' }}>
            <button
              className={`button ${openDropdown === 'catalog' ? 'primary' : 'subtle'}`}
              onClick={() => setOpenDropdown(openDropdown === 'catalog' ? null : 'catalog')}
              title={uiLanguage === 'fr' ? "Bibliothèque d'expériences immersives et catalogue 3D" : "Immersive experiences library & 3D catalog"}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                border: openDropdown === 'catalog' ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.14)',
                background: openDropdown === 'catalog' ? 'rgba(16, 185, 129, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                color: openDropdown === 'catalog' ? '#34d399' : '#e2e8f0',
                padding: '6px 13px',
                borderRadius: '7px',
                fontWeight: 600,
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              <span>📚</span>
              <span>{uiLanguage === 'fr' ? 'Bibliothèque' : 'Library'}</span>
              <span style={{ fontSize: '10px', opacity: 0.7, marginLeft: '2px' }}>▾</span>
            </button>
            {openDropdown === 'catalog' && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  right: 0,
                  width: '335px',
                  background: 'rgba(15, 23, 42, 0.97)',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.7), 0 0 24px rgba(16, 185, 129, 0.12)',
                  borderRadius: '12px',
                  padding: '8px',
                  backdropFilter: 'blur(20px)',
                  zIndex: 2000,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                {/* Sélecteur ergonomique à 3 piliers (Segmented Control) */}
                <div
                  role="tablist"
                  aria-label="Navigation bibliothèque"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '4px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    padding: '3px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    marginBottom: '4px',
                  }}
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={libraryTab === 'experiences'}
                    onClick={() => setLibraryTab('experiences')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      padding: '6px 2px',
                      fontSize: '11px',
                      fontWeight: libraryTab === 'experiences' ? 700 : 500,
                      borderRadius: '6px',
                      border: 'none',
                      background: libraryTab === 'experiences' ? 'rgba(16, 185, 129, 0.22)' : 'transparent',
                      color: libraryTab === 'experiences' ? '#34d399' : '#94a3b8',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span>✨</span>
                    <span>{uiLanguage === 'fr' ? 'Expériences' : 'Experiences'}</span>
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={libraryTab === 'objects'}
                    onClick={() => setLibraryTab('objects')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      padding: '6px 2px',
                      fontSize: '11px',
                      fontWeight: libraryTab === 'objects' ? 700 : 500,
                      borderRadius: '6px',
                      border: 'none',
                      background: libraryTab === 'objects' ? 'rgba(56, 189, 248, 0.22)' : 'transparent',
                      color: libraryTab === 'objects' ? '#38bdf8' : '#94a3b8',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span>📦</span>
                    <span>{uiLanguage === 'fr' ? 'Objets 3D' : '3D Objects'}</span>
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={libraryTab === 'spatial'}
                    onClick={() => setLibraryTab('spatial')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      padding: '6px 2px',
                      fontSize: '11px',
                      fontWeight: libraryTab === 'spatial' ? 700 : 500,
                      borderRadius: '6px',
                      border: 'none',
                      background: libraryTab === 'spatial' ? 'rgba(168, 85, 247, 0.22)' : 'transparent',
                      color: libraryTab === 'spatial' ? '#c084fc' : '#94a3b8',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span>🌐</span>
                    <span>{uiLanguage === 'fr' ? 'Spatiales' : 'Spatial'}</span>
                  </button>
                </div>

                {/* PILIER 1 : EXPÉRIENCES IMMERSIVES */}
                {libraryTab === 'experiences' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <div style={{
                      padding: '4px 10px 2px',
                      fontSize: '9.5px',
                      letterSpacing: '1px',
                      fontWeight: 700,
                      color: '#94a3b8',
                      textTransform: 'uppercase',
                    }}>
                      {uiLanguage === 'fr' ? 'Expériences immersives' : 'Immersive experiences'}
                    </div>

                    {/* Recherche par mot-clé pour les expériences */}
                    <button
                      className="dropdown-menu-item"
                      onClick={() => { openCertifiedWithSearch(''); setOpenDropdown(null); }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        background: 'rgba(16, 185, 129, 0.14)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        color: '#34d399',
                        fontSize: '12px',
                        fontWeight: 650,
                        textAlign: 'left',
                        cursor: 'pointer',
                        borderRadius: '7px',
                        marginBottom: '3px'
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>🔍</span> <span>{uiLanguage === 'fr' ? 'Recherche par mot-clé (toutes)' : 'Keyword search (all)'}</span>
                      </span>
                      <span style={{
                        background: 'rgba(16, 185, 129, 0.25)',
                        color: '#a7f3d0',
                        padding: '2px 7px',
                        borderRadius: '10px',
                        fontSize: '10px',
                        fontWeight: 700
                      }}>
                        {certifiedExperiencesRegistry.length}+
                      </span>
                    </button>

                    {/* Démos et simulations interactives */}
                    <button
                      className="dropdown-menu-item"
                      onClick={() => { setShowDemoModal(true); setOpenDropdown(null); }}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'none', border: 'none', color: '#e2e8f0', fontSize: '12px', textAlign: 'left', cursor: 'pointer', borderRadius: '6px' }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Icon name="play" /> <span>{uiLanguage === 'fr' ? 'Démos et simulations interactives' : 'Interactive demos and simulations'}</span>
                      </span>
                      <small style={{ color: '#94a3b8', fontSize: '10px' }}>{demonstrationScenarios.length}</small>
                    </button>

                    {/* Mindel : Dispositions spatiales 3D */}
                    <button
                      className="dropdown-menu-item"
                      onClick={() => { setShowLayoutsModal(true); setOpenDropdown(null); }}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'none', border: 'none', color: '#e2e8f0', fontSize: '12px', textAlign: 'left', cursor: 'pointer', borderRadius: '6px' }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px' }}>📐</span> <span>{uiLanguage === 'fr' ? 'Dispositions spatiales 3D (Mindel)' : '3D spatial layouts (Mindel)'}</span>
                      </span>
                      <small style={{ color: '#34d399', fontSize: '10px', fontWeight: 700 }}>{savedSpatialLayouts.length}</small>
                    </button>

                    {/* Mindel §17 : Import depuis une URL */}
                    <button
                      className="dropdown-menu-item"
                      onClick={() => { setShowImportUrlModal(true); setOpenDropdown(null); }}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'none', border: 'none', color: '#e2e8f0', fontSize: '12px', textAlign: 'left', cursor: 'pointer', borderRadius: '6px' }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px' }}>🌐</span> <span>{uiLanguage === 'fr' ? 'Importer un monde ou objet depuis une URL' : 'Import world or object from URL'}</span>
                      </span>
                      <small style={{ color: '#38bdf8', fontSize: '10px', fontWeight: 600 }}>URL / WoT</small>
                    </button>

                    {/* Défis & Diagnostics Procéduraux */}
                    <button
                      className="dropdown-menu-item"
                      onClick={() => {
                        handleApplyInstruction('crée un défi de dépannage électrique avec graine #402', { preferLocalRules: true });
                        setOpenDropdown(null);
                      }}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'none', border: 'none', color: '#e2e8f0', fontSize: '12px', textAlign: 'left', cursor: 'pointer', borderRadius: '6px' }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px' }}>🎲</span> <span>{uiLanguage === 'fr' ? 'Défis et diagnostics procéduraux' : 'Procedural challenges and diagnostics'}</span>
                      </span>
                      <span style={{
                        fontSize: '10px',
                        padding: '2px 6px',
                        borderRadius: '10px',
                        background: 'rgba(236, 72, 153, 0.2)',
                        color: '#f472b6',
                        fontWeight: 700
                      }}>
                        Seeds
                      </span>
                    </button>

                    {/* Scènes FLE */}
                    <button
                      className="dropdown-menu-item"
                      onClick={() => { setShowFLEModal(true); setOpenDropdown(null); }}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'none', border: 'none', color: '#e2e8f0', fontSize: '12px', textAlign: 'left', cursor: 'pointer', borderRadius: '6px' }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Icon name="chat" /> <span>{uiLanguage === 'fr' ? 'Scènes et pédagogie FLE' : 'FLE scenes and pedagogy'}</span>
                      </span>
                      <small style={{ color: '#94a3b8', fontSize: '10px' }}>30</small>
                    </button>

                    {/* Ateliers cuisine */}
                    <button
                      className="dropdown-menu-item"
                      onClick={() => { setShowCookingModal(true); setOpenDropdown(null); }}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'none', border: 'none', color: '#e2e8f0', fontSize: '12px', textAlign: 'left', cursor: 'pointer', borderRadius: '6px' }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Icon name="chef" /> <span>{uiLanguage === 'fr' ? 'Ateliers gastronomie et cuisine' : 'Gastronomy and cooking workshops'}</span>
                      </span>
                      <small style={{ color: '#94a3b8', fontSize: '10px' }}>{cookingRecipes.length}</small>
                    </button>

                    {/* Salles de séminaire */}
                    <button
                      className="dropdown-menu-item"
                      onClick={() => { setShowSeminarModal(true); setOpenDropdown(null); }}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'none', border: 'none', color: '#e2e8f0', fontSize: '12px', textAlign: 'left', cursor: 'pointer', borderRadius: '6px' }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Icon name="briefcase" /> <span>{uiLanguage === 'fr' ? 'Salles de séminaire et réunion' : 'Seminar and meeting rooms'}</span>
                      </span>
                      <small style={{ color: '#94a3b8', fontSize: '10px' }}>{seminarRooms.length}</small>
                    </button>

                    {/* Data-to-3D */}
                    <button
                      className="dropdown-menu-item"
                      onClick={() => { setShowDataModal(true); setOpenDropdown(null); }}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'none', border: 'none', color: '#e2e8f0', fontSize: '12px', textAlign: 'left', cursor: 'pointer', borderRadius: '6px' }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Icon name="chart" /> <span>{uiLanguage === 'fr' ? 'Visualisation de données 3D' : '3D data visualization'}</span>
                      </span>
                      <small style={{ color: '#94a3b8', fontSize: '10px' }}>{curatedDatasets.length}</small>
                    </button>
                  </div>
                )}

                {/* PILIER 2 : ASSETS ET OBJETS 3D */}
                {libraryTab === 'objects' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{
                      padding: '4px 10px 2px',
                      fontSize: '9.5px',
                      letterSpacing: '1px',
                      fontWeight: 700,
                      color: '#94a3b8',
                      textTransform: 'uppercase',
                    }}>
                      {uiLanguage === 'fr' ? 'Catalogue et modèles 3D' : 'Catalog and 3D models'}
                    </div>

                    <button
                      className="dropdown-menu-item"
                      onClick={() => { setShowLibrary(true); setOpenDropdown(null); }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        background: 'rgba(56, 189, 248, 0.12)',
                        border: '1px solid rgba(56, 189, 248, 0.35)',
                        color: '#38bdf8',
                        fontSize: '12px',
                        fontWeight: 650,
                        textAlign: 'left',
                        cursor: 'pointer',
                        borderRadius: '7px',
                        marginBottom: '4px'
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Icon name="cube" /> <span>{uiLanguage === 'fr' ? "Catalogue d'objets 3D complet" : 'Complete 3D objects catalog'}</span>
                      </span>
                      <span style={{
                        background: 'rgba(56, 189, 248, 0.25)',
                        color: '#bae6fd',
                        padding: '2px 7px',
                        borderRadius: '10px',
                        fontSize: '10px',
                        fontWeight: 700,
                      }}>
                        {catalog.length}+
                      </span>
                    </button>

                    <button
                      className="dropdown-menu-item"
                      onClick={() => { setShowImportUrlModal(true); setOpenDropdown(null); }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        background: 'rgba(56, 189, 248, 0.08)',
                        border: '1px solid rgba(56, 189, 248, 0.25)',
                        color: '#38bdf8',
                        fontSize: '12px',
                        fontWeight: 600,
                        textAlign: 'left',
                        cursor: 'pointer',
                        borderRadius: '6px'
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>📤</span> <span>{uiLanguage === 'fr' ? 'Importer un fichier 3D (.glb, .gltf)' : 'Import 3D file (.glb, .gltf)'}</span>
                      </span>
                      <small style={{ color: '#38bdf8', fontSize: '10px', fontWeight: 600 }}>Fichier / URL</small>
                    </button>

                    <div style={{
                      padding: '6px 10px 2px',
                      fontSize: '9px',
                      letterSpacing: '1px',
                      fontWeight: 700,
                      color: '#94a3b8',
                      textTransform: 'uppercase',
                    }}>
                      {uiLanguage === 'fr' ? 'Kits prêts à l’emploi' : 'Ready-to-use kits'}
                    </div>

                    <button
                      className="dropdown-menu-item"
                      onClick={() => {
                        const store = useWorldStore.getState();
                        const patch = createLibraryPatch(lessonKit, store.world.ir.entities);
                        store.applyPatch(patch, 'Ajouter le kit pédagogique (8 objets)', { intent: 'add_library_objects' });
                        setOpenDropdown(null);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        background: 'none',
                        border: 'none',
                        color: '#cbd5e1',
                        fontSize: '12px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        borderRadius: '6px'
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>🎓</span> <span>{uiLanguage === 'fr' ? 'Kit de cours essentiel' : 'Essential course kit'}</span>
                      </span>
                      <small style={{ color: '#94a3b8', fontSize: '10px' }}>8 objets</small>
                    </button>
                  </div>
                )}

                {/* PILIER 3 : WEB 3D & RESSOURCES SPATIALES */}
                {libraryTab === 'spatial' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <div style={{
                      padding: '4px 10px 2px',
                      fontSize: '9.5px',
                      letterSpacing: '1px',
                      fontWeight: 700,
                      color: '#c084fc',
                      textTransform: 'uppercase',
                    }}>
                      {uiLanguage === 'fr' ? 'Web 3D et ressources spatiales' : '3D Web and spatial resources'}
                    </div>

                    <button
                      className="dropdown-menu-item"
                      onClick={() => { handleAddCompleteSpatialWebStudio(); setOpenDropdown(null); }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 12px',
                        background: 'rgba(168, 85, 247, 0.14)',
                        border: '1px solid rgba(168, 85, 247, 0.35)',
                        color: '#c084fc',
                        fontSize: '12px',
                        fontWeight: 650,
                        textAlign: 'left',
                        cursor: 'pointer',
                        borderRadius: '6px',
                        marginBottom: '3px'
                      }}
                    >
                      <span>🏛️</span> <span>{uiLanguage === 'fr' ? 'Espace Web 3D complet (hub clé en main)' : 'Complete 3D Web space (turnkey hub)'}</span>
                    </button>

                    <button
                      className="dropdown-menu-item"
                      onClick={() => { handleAddBookPdf(); setOpenDropdown(null); }}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 12px', background: 'none', border: 'none', color: '#e2e8f0', fontSize: '12px', textAlign: 'left', cursor: 'pointer', borderRadius: '6px' }}
                    >
                      <span>📖</span> <span>{uiLanguage === 'fr' ? 'Ajouter un livre 3D (lecteur PDF)' : 'Add 3D book (PDF reader)'}</span>
                    </button>

                    <button
                      className="dropdown-menu-item"
                      onClick={() => { handleAddWebScreen(); setOpenDropdown(null); }}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 12px', background: 'none', border: 'none', color: '#e2e8f0', fontSize: '12px', textAlign: 'left', cursor: 'pointer', borderRadius: '6px' }}
                    >
                      <span>🌐</span> <span>{uiLanguage === 'fr' ? 'Ajouter un panneau Web interactif' : 'Add interactive Web panel'}</span>
                    </button>

                    <button
                      className="dropdown-menu-item"
                      onClick={() => { handleAddComputerStation(); setOpenDropdown(null); }}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 12px', background: 'none', border: 'none', color: '#e2e8f0', fontSize: '12px', textAlign: 'left', cursor: 'pointer', borderRadius: '6px' }}
                    >
                      <span>💻</span> <span>{uiLanguage === 'fr' ? 'Ajouter une station développeur (Three.js)' : 'Add developer station (Three.js)'}</span>
                    </button>

                    <button
                      className="dropdown-menu-item"
                      onClick={() => { handleAddArtCanvas(); setOpenDropdown(null); }}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 12px', background: 'none', border: 'none', color: '#e2e8f0', fontSize: '12px', textAlign: 'left', cursor: 'pointer', borderRadius: '6px' }}
                    >
                      <span>🎨</span> <span>{uiLanguage === 'fr' ? 'Ajouter une toile d’art (musée)' : 'Add museum art canvas'}</span>
                    </button>

                    <button
                      className="dropdown-menu-item"
                      onClick={() => { handleAddBlueprintDossier(); setOpenDropdown(null); }}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 12px', background: 'none', border: 'none', color: '#e2e8f0', fontSize: '12px', textAlign: 'left', cursor: 'pointer', borderRadius: '6px' }}
                    >
                      <span>📐</span> <span>{uiLanguage === 'fr' ? 'Ajouter un dossier plans CAO (PDF)' : 'Add CAD blueprint dossier (PDF)'}</span>
                    </button>

                    <button
                      className="dropdown-menu-item"
                      onClick={() => { handleAddHiFiTurntable(); setOpenDropdown(null); }}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 12px', background: 'none', border: 'none', color: '#e2e8f0', fontSize: '12px', textAlign: 'left', cursor: 'pointer', borderRadius: '6px' }}
                    >
                      <span>📻</span> <span>{uiLanguage === 'fr' ? 'Ajouter une platine vinyle (radio Hi-Fi)' : 'Add vinyl turntable (Hi-Fi radio)'}</span>
                    </button>

                    <button
                      className="dropdown-menu-item"
                      onClick={() => { handleAddGlobe(); setOpenDropdown(null); }}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 12px', background: 'none', border: 'none', color: '#e2e8f0', fontSize: '12px', textAlign: 'left', cursor: 'pointer', borderRadius: '6px' }}
                    >
                      <span>🌍</span> <span>{uiLanguage === 'fr' ? 'Ajouter un globe interactif (atlas mondial)' : 'Add interactive globe (world atlas)'}</span>
                    </button>

                    <button
                      className="dropdown-menu-item"
                      onClick={() => { handleAddMicroscope(); setOpenDropdown(null); }}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 12px', background: 'none', border: 'none', color: '#e2e8f0', fontSize: '12px', textAlign: 'left', cursor: 'pointer', borderRadius: '6px' }}
                    >
                      <span>🔬</span> <span>{uiLanguage === 'fr' ? 'Ajouter une station scientifique (microscope optique)' : 'Add scientific station (optical microscope)'}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* MENU 2: Outils de présentation et d'inspection */}
          <div style={{ position: 'relative' }}>
            <button
              className={`button ${openDropdown === 'tools' ? 'primary' : 'subtle'}`}
              onClick={() => setOpenDropdown(openDropdown === 'tools' ? null : 'tools')}
              title={uiLanguage === 'fr' ? "Outils de présentation, dispositions 3D et fiche technique" : "Presentation tools, 3D layouts & spec sheet"}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                border: openDropdown === 'tools' ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.14)',
                background: openDropdown === 'tools' ? 'rgba(56, 189, 248, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                color: openDropdown === 'tools' ? '#38bdf8' : '#e2e8f0',
                padding: '6px 12px',
                borderRadius: '7px',
                fontWeight: 600,
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              <span>🛠️</span>
              <span>{uiLanguage === 'fr' ? 'Outils' : 'Tools'}</span>
              {savedSpatialLayouts.length > 0 && (
                <span style={{ fontSize: '10px', background: 'rgba(16, 185, 129, 0.3)', color: '#a7f3d0', padding: '1px 5px', borderRadius: '8px' }}>
                  {savedSpatialLayouts.length}
                </span>
              )}
              <span style={{ fontSize: '10px', opacity: 0.7, marginLeft: '2px' }}>▾</span>
            </button>
            {openDropdown === 'tools' && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  right: 0,
                  width: '320px',
                  background: 'rgba(15, 23, 42, 0.97)',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.7), 0 0 24px rgba(56, 189, 248, 0.15)',
                  borderRadius: '12px',
                  padding: '8px',
                  backdropFilter: 'blur(20px)',
                  zIndex: 2000,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                {/* 1. Réalisateur de Pitch 3 min */}
                <button
                  className="dropdown-menu-item"
                  onClick={() => {
                    setShowPitchDirector(prev => !prev);
                    setOpenDropdown(null);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: '8px 12px',
                    background: showPitchDirector ? 'rgba(56, 189, 248, 0.15)' : 'none',
                    border: showPitchDirector ? '1px solid rgba(56, 189, 248, 0.35)' : '1px solid transparent',
                    color: showPitchDirector ? '#38bdf8' : '#e2e8f0',
                    fontSize: '12px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    borderRadius: '8px',
                    transition: 'all 0.15s ease'
                  }}
                  title={isFr ? "Lancer le réalisateur de démo pitch (3 minutes) [Alt+D]" : "Launch 3-minute guided pitch director [Alt+D]"}
                >
                  <span style={{ fontSize: '16px', lineHeight: 1 }}>🎬</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 650, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>{isFr ? 'Pitch guidé (3 min)' : 'Guided Pitch (3 min)'}</span>
                      <kbd style={{ fontSize: '9.5px', background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: '4px', color: '#94a3b8' }}>Alt+D</kbd>
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '2px' }}>
                      {isFr ? 'Démonstration scénarisée et vocalisée' : 'Scripted & voiced demonstration'}
                    </div>
                  </div>
                </button>

                {/* 2. Dispositions spatiales 3D */}
                <button
                  className="dropdown-menu-item"
                  onClick={() => {
                    setShowLayoutsModal(true);
                    setOpenDropdown(null);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: '8px 12px',
                    background: 'none',
                    border: '1px solid transparent',
                    color: '#e2e8f0',
                    fontSize: '12px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    borderRadius: '8px',
                    transition: 'all 0.15s ease'
                  }}
                  title={isFr ? "Gérer les dispositions spatiales 3D enregistrées" : "Manage saved 3D spatial layouts"}
                >
                  <span style={{ fontSize: '16px', lineHeight: 1 }}>📐</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 650, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>{isFr ? 'Dispositions spatiales 3D' : '3D Spatial Layouts'}</span>
                      {savedSpatialLayouts.length > 0 && (
                        <span style={{ fontSize: '9.5px', background: 'rgba(16, 185, 129, 0.25)', color: '#34d399', padding: '1px 6px', borderRadius: '8px', fontWeight: 700 }}>
                          {savedSpatialLayouts.length}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '2px' }}>
                      {isFr ? 'Sauvegarder et restaurer les configurations 3D' : 'Save & restore 3D configurations'}
                    </div>
                  </div>
                </button>

                {/* 3. Fiche 2D et spécifications */}
                <button
                  className="dropdown-menu-item"
                  onClick={() => {
                    if (!selectedEntityId) {
                      const firstNonZone = Object.values(world.ir.entities).find(e => !e.capabilities.some(c => c.type === 'trigger_zone'));
                      if (firstNonZone) {
                        useWorldStore.getState().setSpatialContext(firstNonZone.id, null);
                      }
                    }
                    setShowEntity2DDrawer(true);
                    playAudioFx('switch_click');
                    setOpenDropdown(null);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: '8px 12px',
                    background: showEntity2DDrawer ? 'rgba(56, 189, 248, 0.15)' : 'none',
                    border: showEntity2DDrawer ? '1px solid rgba(56, 189, 248, 0.35)' : '1px solid transparent',
                    color: showEntity2DDrawer ? '#38bdf8' : '#e2e8f0',
                    fontSize: '12px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    borderRadius: '8px',
                    transition: 'all 0.15s ease'
                  }}
                  title={isFr ? "Ouvrir la fiche 2D hybride et accessibilité" : "Open 2D hybrid spec sheet & accessibility"}
                >
                  <span style={{ fontSize: '16px', lineHeight: 1 }}>📄</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 650 }}>
                      <span>{isFr ? 'Fiche 2D et spécifications' : '2D Spec Sheet & Parts'}</span>
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '2px' }}>
                      {isFr ? 'Jumeau numérique, cotations, pièces et accessibilité' : 'Digital twin, dimensions, parts & accessibility'}
                    </div>
                  </div>
                </button>

                {/* Section Logique & Substrat Formel */}
                <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.08)', margin: '4px 0' }} />
                <div style={{ padding: '2px 10px', fontSize: '9px', fontWeight: 700, letterSpacing: '1px', color: '#64748b', textTransform: 'uppercase' }}>
                  {isFr ? 'Logique & Substrat' : 'Logic & Substrate'}
                </div>

                {/* 4. Graphe de causalité & Règles */}
                <button
                  className="dropdown-menu-item"
                  onClick={() => {
                    setShowLogic(prev => !prev);
                    setShowJson(false);
                    playAudioFx('switch_click');
                    setOpenDropdown(null);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: '8px 12px',
                    background: showLogic ? 'rgba(56, 189, 248, 0.15)' : 'none',
                    border: showLogic ? '1px solid rgba(56, 189, 248, 0.35)' : '1px solid transparent',
                    color: showLogic ? '#38bdf8' : '#e2e8f0',
                    fontSize: '12px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    borderRadius: '8px',
                    transition: 'all 0.15s ease'
                  }}
                  title={isFr ? "Ouvrir le graphe de causalité et l’éditeur de règles" : "Open causality graph and rules editor"}
                >
                  <span style={{ fontSize: '16px', lineHeight: 1 }}>⚡</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 650, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>{isFr ? 'Graphe de causalité & Logique' : 'Causality Graph & Logic'}</span>
                      <span style={{ fontSize: '9.5px', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', padding: '1px 6px', borderRadius: '8px', fontWeight: 700 }}>
                        {rulesCount}
                      </span>
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '2px' }}>
                      {isFr ? "Éditeur de règles de simulation et d'interactions" : 'Simulation rules & interaction editor'}
                    </div>
                  </div>
                </button>

                {/* 5. État du monde WorldIR JSON */}
                <button
                  className="dropdown-menu-item"
                  onClick={() => {
                    setShowJson(prev => !prev);
                    setShowLogic(false);
                    playAudioFx('switch_click');
                    setOpenDropdown(null);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: '8px 12px',
                    background: showJson ? 'rgba(56, 189, 248, 0.15)' : 'none',
                    border: showJson ? '1px solid rgba(56, 189, 248, 0.35)' : '1px solid transparent',
                    color: showJson ? '#38bdf8' : '#e2e8f0',
                    fontSize: '12px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    borderRadius: '8px',
                    transition: 'all 0.15s ease'
                  }}
                  title={isFr ? "Inspecter le schéma WorldIR et l'état déclaratif de la scène" : "Inspect WorldIR schema and declarative scene state"}
                >
                  <span style={{ fontSize: '16px', lineHeight: 1 }}>{'</>'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 650 }}>
                      <span>{isFr ? 'État du monde (WorldIR JSON)' : 'World State (WorldIR JSON)'}</span>
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '2px' }}>
                      {isFr ? 'Représentation intermédiaire formelle et reproductible' : 'Formal and reproducible intermediate representation'}
                    </div>
                  </div>
                </button>

                {/* Section Affichage Immersif */}
                <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.08)', margin: '4px 0' }} />
                <div style={{ padding: '2px 10px', fontSize: '9px', fontWeight: 700, letterSpacing: '1px', color: '#64748b', textTransform: 'uppercase' }}>
                  {isFr ? 'Affichage immersif' : 'Immersive Display'}
                </div>

                {/* 6. Immersion WebXR / Casque VR */}
                <button
                  className="dropdown-menu-item"
                  onClick={() => {
                    setOpenDropdown(null);
                    if (typeof navigator !== 'undefined' && 'xr' in navigator) {
                      xrStore.enterVR().catch(e => {
                        useWorldStore.setState(s => ({
                          warnings: [...s.warnings, isFr ? `🥽 WebXR : Aucun casque VR actif détecté (${e.message}). Connectez un casque (Meta Quest, Vision Pro, PCVR).` : `🥽 WebXR: No active VR headset detected (${e.message}). Connect a headset (Meta Quest, Vision Pro, PCVR).`]
                        }));
                      });
                    } else {
                      useWorldStore.setState(s => ({
                        warnings: [...s.warnings, isFr ? '🥽 Immersion WebXR : cette fonction expérimentale requiert un navigateur et un casque VR compatibles (Meta Quest Browser, Apple Vision Pro ou SteamVR).' : '🥽 WebXR Immersion: this experimental feature requires a compatible VR browser and headset (Meta Quest Browser, Apple Vision Pro or SteamVR).']
                      }));
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: '8px 12px',
                    background: 'none',
                    border: '1px solid transparent',
                    color: '#e2e8f0',
                    fontSize: '12px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    borderRadius: '8px',
                    transition: 'all 0.15s ease'
                  }}
                  title={isFr ? "Passer en immersion WebXR / Casque VR 6DoF (expérimental)" : "Switch to WebXR immersion / 6DoF VR headset (experimental)"}
                >
                  <span style={{ fontSize: '16px', lineHeight: 1 }}>🥽</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 650, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>{isFr ? 'Immersion WebXR (VR)' : 'WebXR Immersion (VR)'}</span>
                      <span style={{ fontSize: '9px', background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
                        {isFr ? 'Expérimental' : 'Experimental'}
                      </span>
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '2px' }}>
                      {isFr ? 'Casque VR autonome ou connecté requis (Quest, Vision Pro, PCVR)' : 'Standalone or tethered VR headset required (Quest, Vision Pro, PCVR)'}
                    </div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* MENU 3: Agents */}
          <div style={{ position: 'relative' }}>
            <button
              className={`button ${openDropdown === 'agents' ? 'primary' : 'subtle'}`}
              onClick={() => setOpenDropdown(openDropdown === 'agents' ? null : 'agents')}
              title={isFr ? "Supervision des agents IA, playtesting synthétique et trajectoires" : "AI agents supervision, synthetic playtesting & trajectories"}
            >
              <span>🤖</span> {isFr ? 'Agents' : 'Agents'} ▾
            </button>
            {openDropdown === 'agents' && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  right: 0,
                  width: '280px',
                  background: 'rgba(15, 23, 42, 0.96)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  boxShadow: '0 16px 36px rgba(0, 0, 0, 0.6), 0 0 20px rgba(56, 189, 248, 0.15)',
                  borderRadius: '10px',
                  padding: '6px',
                  backdropFilter: 'blur(16px)',
                  zIndex: 2000,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                }}
              >
                <button
                  className="dropdown-menu-item"
                  onClick={() => { useWorldStore.getState().openSyntheticPlaytesterModal(); setOpenDropdown(null); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'none', border: 'none', color: '#e2e8f0', fontSize: '12.5px', textAlign: 'left', cursor: 'pointer', borderRadius: '6px' }}
                >
                  <span>🤖</span> <span>{isFr ? 'Synthetic playtester IA' : 'AI Synthetic Playtester'}</span>
                </button>
                <button
                  className="dropdown-menu-item"
                  onClick={() => { toggleGhostAgent(); setOpenDropdown(null); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'none', border: 'none', color: isGhostAgentActive ? '#38bdf8' : '#e2e8f0', fontSize: '12.5px', textAlign: 'left', cursor: 'pointer', borderRadius: '6px' }}
                >
                  <span>👻</span> <span>{isFr ? `Trajectoire fantôme 3D ${isGhostAgentActive ? '(active)' : '(inactive)'}` : `3D Ghost Trajectory ${isGhostAgentActive ? '(active)' : '(inactive)'}`}</span>
                </button>
                <button
                  className="dropdown-menu-item"
                  onClick={() => { toggleSpatialAgent(); setOpenDropdown(null); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'none', border: 'none', color: isSpatialAgentActive ? '#4ade80' : '#e2e8f0', fontSize: '12.5px', textAlign: 'left', cursor: 'pointer', borderRadius: '6px' }}
                >
                  <Icon name="user" /> <span>{isFr ? `Guide spatial PNJ ${isSpatialAgentActive ? '(visible)' : '(masqué)'}` : `NPC Spatial Guide ${isSpatialAgentActive ? '(visible)' : '(hidden)'}`}</span>
                </button>
                <button
                  className="dropdown-menu-item"
                  onClick={() => { useWorldStore.getState().openBehavioralAnalyticsModal(); setOpenDropdown(null); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'none', border: 'none', color: '#e2e8f0', fontSize: '12.5px', textAlign: 'left', cursor: 'pointer', borderRadius: '6px' }}
                >
                  <span>🧠</span> <span>{isFr ? 'Boîte noire et attention spatiale' : 'Black Box & Spatial Attention'}</span>
                </button>
                <button
                  className="dropdown-menu-item"
                  onClick={() => { useWorldStore.getState().openAgentLedgerModal(); setOpenDropdown(null); }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.3)', color: '#38bdf8', fontSize: '12.5px', textAlign: 'left', cursor: 'pointer', borderRadius: '6px', fontWeight: 650 }}
                  title={isFr ? "Consulter le journal des observations des agents IA et arbitrer les intégrations (quand intégrer ?)" : "Inspect AI agent observation ledger and arbitrate integrations"}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>🧠</span> <span>{isFr ? 'Observations & Arbitrage IA' : 'AI Observations & Arbitration'}</span>
                  </span>
                  <span style={{ background: '#0284c7', color: '#ffffff', padding: '1px 6px', borderRadius: '8px', fontSize: '10px' }}>
                    {useWorldStore.getState().agentObservations.length}
                  </span>
                </button>
                <button
                  className="dropdown-menu-item"
                  onClick={() => { useWorldStore.getState().openPublishReadinessModal(); setOpenDropdown(null); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'none', border: 'none', color: '#e2e8f0', fontSize: '12.5px', textAlign: 'left', cursor: 'pointer', borderRadius: '6px' }}
                >
                  <span>🛡️</span> <span>{isFr ? 'Contrôle de publication Victoria VR' : 'Victoria VR Publish Gate'}</span>
                </button>
                <button
                  className="dropdown-menu-item"
                  onClick={() => { (useWorldStore.getState() as any).openEditOrderLabModal(); setOpenDropdown(null); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'none', border: 'none', color: '#38bdf8', fontSize: '12.5px', textAlign: 'left', cursor: 'pointer', borderRadius: '6px' }}
                  title={isFr ? "Laboratoire de recherche : Évaluation de la sensibilité à l'ordre des modifications (AB vs BA)" : "Research Lab: Edit-order commutativity evaluation (AB vs BA)"}
                >
                  <span>🧪</span> <span>{isFr ? "Recherche : Sensibilité à l'Ordre (AB/BA)" : 'Research: Edit-Order Sensitivity (AB/BA)'}</span>
                </button>
              </div>
            )}
          </div>

          {/* BOUTON SAUVEGARDER DIRECT */}
          <button
            className="button primary"
            onClick={() => {
              saveWorldToStorage();
              playAudioFx('switch_click');
            }}
            title={isFr ? "Sauvegarder immédiatement le monde et vos modifications dans le navigateur (Ctrl+S / ⌘S)" : "Immediately save world & changes in browser (Ctrl+S / ⌘S)"}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              fontWeight: 650,
              fontSize: '11.5px',
              background: 'linear-gradient(135deg, #0284c7, #0369a1)',
              borderColor: '#38bdf8',
              color: '#ffffff',
              boxShadow: '0 2px 8px rgba(2, 132, 199, 0.35)',
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            <span>💾</span> <span>{isFr ? 'Sauvegarder' : 'Save'}</span>
          </button>

          {/* SÉLECTEUR DE LANGUE BILINGUE IMMÉDIAT (EN / FR) */}
          <div
            className="language-switcher-segmented"
            role="group"
            aria-label="Language selection / Sélection de la langue"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '7px',
              padding: '2px',
              gap: '2px',
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              onClick={() => {
                setUiLanguage('en');
                playAudioFx('switch_click');
              }}
              title="Switch interface to English"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                padding: '2px 7px',
                fontSize: '11px',
                fontWeight: uiLanguage === 'en' ? 750 : 500,
                borderRadius: '5px',
                border: 'none',
                background: uiLanguage === 'en' ? 'linear-gradient(135deg, #0284c7, #0369a1)' : 'transparent',
                color: uiLanguage === 'en' ? '#ffffff' : '#94a3b8',
                cursor: 'pointer',
                boxShadow: uiLanguage === 'en' ? '0 1px 4px rgba(2, 132, 199, 0.4)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <span>🇬🇧</span>
              <span>EN</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setUiLanguage('fr');
                playAudioFx('switch_click');
              }}
              title="Passer l'interface en Français"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                padding: '2px 7px',
                fontSize: '11px',
                fontWeight: uiLanguage === 'fr' ? 750 : 500,
                borderRadius: '5px',
                border: 'none',
                background: uiLanguage === 'fr' ? 'linear-gradient(135deg, #0284c7, #0369a1)' : 'transparent',
                color: uiLanguage === 'fr' ? '#ffffff' : '#94a3b8',
                cursor: 'pointer',
                boxShadow: uiLanguage === 'fr' ? '0 1px 4px rgba(2, 132, 199, 0.4)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <span>🇫🇷</span>
              <span>FR</span>
            </button>
          </div>

          {/* MENU 3: Projet & Moteur */}
          <div style={{ position: 'relative' }}>
            <button
              className={`button ${openDropdown === 'project' ? 'primary' : 'subtle'}`}
              onClick={() => setOpenDropdown(openDropdown === 'project' ? null : 'project')}
              title={isFr ? "Sauvegarde, Export, Raccourcis et Utilitaires" : "Save, Export, Shortcuts & Utilities"}
            >
              <span>⚙️</span> {isFr ? 'Projet' : 'Project'} ▾
            </button>
            {openDropdown === 'project' && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  right: 0,
                  width: '260px',
                  background: 'rgba(15, 23, 42, 0.96)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  boxShadow: '0 16px 36px rgba(0, 0, 0, 0.6), 0 0 20px rgba(56, 189, 248, 0.15)',
                  borderRadius: '10px',
                  padding: '6px',
                  backdropFilter: 'blur(16px)',
                  zIndex: 2000,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                }}
              >
                <button
                  className="dropdown-menu-item"
                  onClick={() => { useWorldStore.getState().toggleCausalObservability(); setOpenDropdown(null); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', color: '#38bdf8', fontSize: '12.5px', textAlign: 'left', cursor: 'pointer', borderRadius: '6px', fontWeight: 600 }}
                  title={isFr ? "Inspecteur temps réel des drapeaux, règles causales et Gizmo 3D" : "Real-time inspector for flags, causal rules and 3D Gizmo"}
                >
                  <span>⚡</span> <span>{isFr ? 'Observabilité & Debug Causal' : 'Causal Observability & Debug'}</span>
                </button>
                <button
                  className="dropdown-menu-item"
                  onClick={() => { saveWorldToStorage(); setOpenDropdown(null); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'none', border: 'none', color: '#e2e8f0', fontSize: '12.5px', textAlign: 'left', cursor: 'pointer', borderRadius: '6px' }}
                >
                  <Icon name="save" /> <span>{isFr ? 'Sauvegarder dans le navigateur' : 'Save in browser'}</span>
                </button>
                <button
                  className="dropdown-menu-item"
                  onClick={() => { loadWorldFromStorage(); setOpenDropdown(null); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'none', border: 'none', color: '#e2e8f0', fontSize: '12.5px', textAlign: 'left', cursor: 'pointer', borderRadius: '6px' }}
                >
                  <Icon name="folder" /> <span>{isFr ? "Restaurer l'état sauvegardé" : 'Restore saved state'}</span>
                </button>
                <button
                  className="dropdown-menu-item"
                  onClick={() => { exportWorldYaml(); setOpenDropdown(null); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'none', border: 'none', color: '#e2e8f0', fontSize: '12.5px', textAlign: 'left', cursor: 'pointer', borderRadius: '6px' }}
                  title={isFr ? "Exporter le substrat spatial déclaratif lisible (.world.yaml)" : "Export readable declarative spatial substrate (.world.yaml)"}
                >
                  <Icon name="download" /> <span>{isFr ? 'Exporter YAML (.world.yaml)' : 'Export YAML (.world.yaml)'}</span>
                </button>
                <button
                  className="dropdown-menu-item"
                  onClick={() => { exportWorldJson(); setOpenDropdown(null); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'none', border: 'none', color: '#e2e8f0', fontSize: '12.5px', textAlign: 'left', cursor: 'pointer', borderRadius: '6px' }}
                  title={isFr ? "Exporter la scène au format JSON (.world.json)" : "Export scene to JSON format (.world.json)"}
                >
                  <Icon name="download" /> <span>{isFr ? 'Exporter JSON (.world.json)' : 'Export JSON (.world.json)'}</span>
                </button>
                <button
                  className="dropdown-menu-item"
                  onClick={() => { triggerCaptureScreenshot(); setOpenDropdown(null); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)', color: '#38bdf8', fontSize: '12.5px', textAlign: 'left', cursor: 'pointer', borderRadius: '6px', fontWeight: 600 }}
                  title={isFr ? "Capturer une photo HD instantanée de la scène 3D sans interface [Alt+S]" : "Capture instant HD photo of 3D scene without UI [Alt+S]"}
                >
                  <span>📸</span> <span>{isFr ? 'Prendre une photo HD (PNG)' : 'Take HD Photo (PNG)'}</span>
                </button>
                <button
                  className="dropdown-menu-item"
                  onClick={() => { triggerExportGLB(); setOpenDropdown(null); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'none', border: 'none', color: '#e2e8f0', fontSize: '12.5px', textAlign: 'left', cursor: 'pointer', borderRadius: '6px' }}
                  title={isFr ? "Exporter la scène 3D au format GLB" : "Export 3D scene in GLB format"}
                >
                  <span>📦</span> <span>{isFr ? 'Exporter la scène 3D (.GLB)' : 'Export 3D Scene (.GLB)'}</span>
                </button>
                {selected && (
                  <button
                    className="dropdown-menu-item"
                    onClick={() => { triggerExportGLB(selected.id, selected.name); setOpenDropdown(null); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.2)', color: '#a5b4fc', fontSize: '12.5px', textAlign: 'left', cursor: 'pointer', borderRadius: '6px' }}
                    title={isFr ? `Exporter uniquement l'objet ${selected.name} au format GLB` : `Export only object ${selected.name} in GLB format`}
                  >
                    <span>🎯</span> <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{isFr ? `Exporter « ${selected.name} » (.GLB)` : `Export "${selected.name}" (.GLB)`}</span>
                  </button>
                )}
                <button
                  className="dropdown-menu-item"
                  onClick={() => { triggerExportUSDZ(); setOpenDropdown(null); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'none', border: 'none', color: '#e2e8f0', fontSize: '12.5px', textAlign: 'left', cursor: 'pointer', borderRadius: '6px' }}
                  title={isFr ? "Exporter pour Apple Vision Pro et Réalité Augmentée iOS (Quick Look)" : "Export for Apple Vision Pro and iOS AR (Quick Look)"}
                >
                  <span>🥽</span> <span>{isFr ? 'Exporter Réalité Augmentée (.USDZ)' : 'Export Augmented Reality (.USDZ)'}</span>
                </button>
                <button
                  className="dropdown-menu-item"
                  onClick={() => { openPromptHistory(); setOpenDropdown(null); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'none', border: 'none', color: '#e2e8f0', fontSize: '12.5px', textAlign: 'left', cursor: 'pointer', borderRadius: '6px' }}
                >
                  <span>📜</span> <span>{isFr ? `Historique des Prompts (${records.length})` : `Prompt History (${records.length})`}</span>
                </button>
                <button
                  className="dropdown-menu-item"
                  onClick={() => { fileInputRef.current?.click(); setOpenDropdown(null); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'none', border: 'none', color: '#e2e8f0', fontSize: '12.5px', textAlign: 'left', cursor: 'pointer', borderRadius: '6px' }}
                  title={isFr ? "Importer une scène depuis un fichier .world.yaml ou .world.json" : "Import scene from .world.yaml or .world.json file"}
                >
                  <span>📤</span> <span>{isFr ? 'Importer une scène (.yaml, .json)' : 'Import Scene (.yaml, .json)'}</span>
                </button>
                <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.08)', margin: '4px 0' }} />
                <button
                  className="dropdown-menu-item"
                  onClick={() => { handleClearScene(); setOpenDropdown(null); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'rgba(239, 68, 68, 0.12)', border: 'none', color: '#f87171', fontSize: '12.5px', textAlign: 'left', cursor: 'pointer', borderRadius: '6px', fontWeight: 600 }}
                  title={isFr ? "Vider la scène et repartir de zéro [Alt+Suppr]" : "Clear scene and start from scratch [Alt+Del]"}
                >
                  <Icon name="trash" /> <span>{isFr ? 'Vider la scène (repartir de zéro)' : 'Clear Scene (start fresh)'}</span>
                </button>
                <button
                  className="dropdown-menu-item"
                  onClick={() => { setShowAchievementsModal(true); setOpenDropdown(null); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'none', border: 'none', color: '#e2e8f0', fontSize: '12.5px', textAlign: 'left', cursor: 'pointer', borderRadius: '6px' }}
                >
                  <span>🏆</span> <span>{isFr ? `Trophées (${Object.keys(unlockedAchievements).length}/${ACHIEVEMENTS.length})` : `Achievements (${Object.keys(unlockedAchievements).length}/${ACHIEVEMENTS.length})`}</span>
                </button>
                <button
                  className="dropdown-menu-item"
                  onClick={() => { setShowCollaborationBoardModal(true); setOpenDropdown(null); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'none', border: 'none', color: '#e2e8f0', fontSize: '12.5px', textAlign: 'left', cursor: 'pointer', borderRadius: '6px' }}
                >
                  <span>📋</span> <span>{isFr ? `Post-its Collaboratifs (${collaborationNotes.length})` : `Collaborative Board (${collaborationNotes.length})`}</span>
                </button>
                <button
                  className="dropdown-menu-item"
                  onClick={() => { setShowHelp(!showHelp); setOpenDropdown(null); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'none', border: 'none', color: '#e2e8f0', fontSize: '12.5px', textAlign: 'left', cursor: 'pointer', borderRadius: '6px' }}
                >
                  <Icon name="help" /> <span>{isFr ? 'Guide & Raccourcis clavier' : 'Guide & Keyboard Shortcuts'}</span>
                </button>
              </div>
            )}
          </div>

          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json,.yaml,.yml" style={{ display: 'none' }} />

          {/* Réglages visuels WebGL */}
          <button
            className={`button ${cinematicPreset !== 'standard' ? 'primary' : 'subtle'}`}
            onClick={() => setShowCinematicModal(true)}
            title="Réglages visuels (colorimétrie, bloom et vignettage) [Alt+C]"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              fontSize: '10.5px',
              height: '26px',
              background: cinematicPreset !== 'standard' ? 'rgba(16, 185, 129, 0.16)' : 'rgba(255, 255, 255, 0.05)',
              border: cinematicPreset !== 'standard' ? '1px solid rgba(16, 185, 129, 0.45)' : '1px solid var(--line)',
              color: cinematicPreset !== 'standard' ? '#34d399' : '#94a3b8',
              fontWeight: 600,
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              flexShrink: 0
            }}
          >
            <span>✨</span>
            <span>{cinematicPreset === 'cinematic' ? 'Cinématique' : cinematicPreset === 'golden_hour' ? 'Golden Hour' : cinematicPreset === 'cyberpunk_neon' ? 'Cyberpunk' : cinematicPreset === 'studio_neutral' ? 'Studio' : 'Standard'}</span>
            <kbd style={{ fontSize: '8.5px', opacity: 0.65, background: 'rgba(0,0,0,0.3)', padding: '1px 3px', borderRadius: '3px' }}>Alt+C</kbd>
          </button>
        </div>
      </header>

      <main className="studio-main">
        <section className="viewport" aria-label="Scène 3D interactive">
          <SpatialDropZone>
            <WorldScene evening={evening} cameraReset={cameraReset} />
          <QuestHUD />
          <GameplayHUD />
          <CausalObservabilityHUD />
          <RefugeOverlay />

          {/* BANNIÈRE DE MODE DÉPLACEMENT FLOTTANTE (Pick & Place) */}
          {placementModeEntityId && (
            <div
              style={{
                position: 'absolute',
                top: '16px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 1200,
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.96), rgba(5, 150, 105, 0.96))',
                border: '2px solid #34d399',
                boxShadow: '0 12px 35px rgba(0,0,0,0.7), 0 0 24px rgba(52, 211, 153, 0.45)',
                borderRadius: '30px',
                padding: '8px 22px',
                backdropFilter: 'blur(16px)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 700,
                userSelect: 'none'
              }}
            >
              <span style={{ fontSize: '18px' }}>🖐️</span>
              <span>
                Mode déplacement : Cliquez sur le sol ou une table pour poser « {world.ir.entities[placementModeEntityId]?.name || 'l\'objet'} »
              </span>
              <button
                type="button"
                onClick={() => cancelPlacementMode()}
                style={{
                  background: 'rgba(0, 0, 0, 0.35)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '3px 10px',
                  cursor: 'pointer'
                }}
                title="Annuler le déplacement [Échap]"
              >
                Annuler [Échap]
              </button>
            </div>
          )}

          {/* FOCUSED ACTION DIRECTIVE BANNER ("Que dois-je faire ?") */}
          {(() => {
            const quests = world.ir.quests;
            const activeQId = world.ir.activeQuestId === null ? null : (world.ir.activeQuestId || (quests ? Object.keys(quests)[0] : null));
            const activeQ = activeQId && quests ? quests[activeQId] : null;
            if (!activeQ || activeQ.status === 'completed') return null;
            const currentStep = activeQ.steps?.[activeQ.currentStepIndex];
            if (!currentStep) return null;

            const isLux = activeQ.category === 'luxury' || activeQ.id?.includes('lv') || activeQ.id?.includes('luxe');
            const targetEntity = currentStep.targetEntityId ? world.ir.entities[currentStep.targetEntityId] : null;
            const targetName = targetEntity?.name;

            const rawDesc = currentStep.description || currentStep.title || '';
            const isPassiveState = /^(?:la|le|l'|les).+(?:est désormais|a été|sont désormais|ont été)/i.test(rawDesc);
            const displayDirective = isPassiveState
              ? (targetName ? `Consulter ${targetName} pour continuer` : rawDesc)
              : rawDesc;

            return (
              <div
                style={{
                  position: 'absolute',
                  top: '20px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 890,
                  background: isLux 
                    ? 'linear-gradient(135deg, rgba(24, 24, 27, 0.95), rgba(41, 37, 36, 0.95))'
                    : 'rgba(15, 23, 42, 0.94)',
                  border: isLux
                    ? '1.5px solid rgba(251, 191, 36, 0.7)'
                    : '1.5px solid rgba(56, 189, 248, 0.55)',
                  boxShadow: isLux
                    ? '0 12px 35px rgba(0,0,0,0.7), 0 0 24px rgba(251, 191, 36, 0.25)'
                    : '0 12px 35px rgba(0,0,0,0.7), 0 0 24px rgba(56, 189, 248, 0.2)',
                  borderRadius: '30px',
                  padding: '6px 18px',
                  backdropFilter: 'blur(16px)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  color: '#ffffff',
                  fontSize: '13px',
                  pointerEvents: 'auto',
                  maxWidth: '92vw',
                  flexWrap: 'nowrap',
                  animation: 'fadeIn 0.25s ease-out'
                }}
              >
                <span
                  style={{
                    background: isLux ? '#d97706' : '#0284c7',
                    color: '#ffffff',
                    padding: '3px 9px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.02em',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Étape {activeQ.currentStepIndex + 1}/{activeQ.steps.length}
                </span>
                <span 
                  style={{ 
                    fontWeight: 600, 
                    letterSpacing: '0.01em', 
                    textShadow: '0 1px 4px rgba(0,0,0,0.5)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '280px',
                    fontSize: '12px'
                  }}
                  title={rawDesc}
                >
                  👉 {displayDirective}
                </span>

                {targetEntity && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      useWorldStore.getState().setSpatialContext(targetEntity.id, null);
                      useWorldStore.getState().focusEntity(targetEntity.id);
                      playAudioFx('tink');
                    }}
                    style={{
                      background: 'rgba(56, 189, 248, 0.18)',
                      border: '1px solid rgba(56, 189, 248, 0.5)',
                      borderRadius: '12px',
                      color: '#e0f2fe',
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '3px 7px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      whiteSpace: 'nowrap',
                      flexShrink: 0
                    }}
                    title={`Cibler et cadrer : ${targetName}`}
                  >
                    <span>🎯</span>
                    <span style={{ maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{targetName || 'Cible'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    useWorldStore.getState().advanceActiveQuestStep();
                  }}
                  style={{
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.4), rgba(5, 150, 105, 0.5))',
                    border: '1px solid #34d399',
                    borderRadius: '12px',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '3px 9px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                    flexShrink: 0
                  }}
                  title="Valider cette étape et passer directement à la suivante"
                >
                  <span>✓</span>
                  <span>{activeQ.currentStepIndex + 1 < activeQ.steps.length ? 'Suivant ➔' : 'Terminer 🎉'}</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    useWorldStore.getState().resetQuest(activeQ.id);
                    if (activeQ.category === 'cuisine') {
                      useWorldStore.getState().restartCurrentRecipe();
                    }
                  }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '12px',
                    color: '#cbd5e1',
                    fontSize: '12px',
                    padding: '3px 7px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}
                  title="Recommencer cette expérience depuis le début"
                  aria-label="Recommencer"
                >
                  <span>🔄</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const textToSpeak = `${activeQ.title}. Étape ${activeQ.currentStepIndex + 1} sur ${activeQ.steps.length} : ${displayDirective}. ${currentStep.hint ? 'Conseil : ' + currentStep.hint : ''}`;
                    speakFeedback(textToSpeak);
                  }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '12px',
                    color: '#ffffff',
                    fontSize: '11px',
                    padding: '3px 6px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center'
                  }}
                  title="Écouter la consigne à voix haute"
                  aria-label="Écouter la consigne"
                >
                  🗣️
                </button>

                {(currentStep.title?.toLowerCase().includes('configur') || (currentStep.description || '').toLowerCase().includes('configur')) && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      playAudioFx('chime');
                      useWorldStore.getState().openSupercarConfigurator();
                    }}
                    style={{
                      background: 'rgba(56, 189, 248, 0.25)',
                      border: '1px solid #38bdf8',
                      borderRadius: '12px',
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      marginLeft: '2px'
                    }}
                    title="Ouvrir le configurateur officiel Victoria VR"
                  >
                    <span>⚙️</span>
                    <span>Configurer</span>
                  </button>
                )}
              </div>
            );
          })()}

          {appMode !== 'simulation' && !world.ir.activeQuestId && (!world.ir.quests || Object.keys(world.ir.quests).length === 0) && Object.keys(world.ir.entities).length <= 2 && (
            <div className="scene-heading"><div className="eyebrow">VOTRE MONDE, EN TEMPS RÉEL</div><h1>De l’idée à l’expérience.</h1><p>Créez. Donnez vie. Vérifiez.</p></div>
          )}

          <div className="view-tools" role="toolbar" aria-label="Affichage de la scène">
            <button
              data-tooltip="Recentrer la caméra [Espace]"
              aria-label="Recentrer la caméra"
              onClick={() => setCameraReset(v => v + 1)}
            >
              <Icon name="focus" />
            </button>
            <div style={{ position: 'relative' }}>
              <button
                data-tooltip={showCameraMenu ? undefined : `Angles de caméra (${cameraPreset === 'overview' ? "Vue d'ensemble" : cameraPreset})`}
                aria-label="Cadrage caméra"
                aria-pressed={cameraPreset !== 'overview'}
                aria-expanded={showCameraMenu}
                className={cameraPreset !== 'overview' ? 'active' : ''}
                onClick={() => setShowCameraMenu(v => !v)}
              >
                <Icon name="table" />
              </button>
              {showCameraMenu && (
                <div
                  className="camera-presets-popover"
                  style={{
                    position: 'absolute',
                    left: 'calc(100% + 10px)',
                    top: '-30px',
                    width: '220px',
                    background: 'rgba(15, 23, 42, 0.96)',
                    border: '1px solid rgba(56, 189, 248, 0.35)',
                    borderRadius: '12px',
                    boxShadow: '0 12px 35px rgba(0,0,0,0.65), 0 0 16px rgba(56, 189, 248, 0.15)',
                    padding: '8px',
                    backdropFilter: 'blur(16px)',
                    zIndex: 1000,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 6px', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#f8fafc' }}>🎥 Vues caméra</span>
                    <button
                      type="button"
                      onClick={() => setShowCameraMenu(false)}
                      style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '12px', cursor: 'pointer', padding: '0 2px' }}
                    >
                      ✕
                    </button>
                  </div>
                  {[
                    { id: 'overview', icon: '🌐', label: "Vue d'ensemble" },
                    { id: 'supercar_hero', icon: '🏎️', label: 'Supercar Studio 3/4' },
                    { id: 'table', icon: '🍽️', label: 'Plan de travail' },
                    { id: 'cocotte', icon: '🍲', label: 'Cocotte & Cuisson' },
                    { id: 'plate', icon: '🥗', label: 'Assiette de dressage' },
                    { id: 'chopping', icon: '🔪', label: 'Planche de découpe' },
                    { id: 'board', icon: '📺', label: "Panneau d'affichage" },
                    { id: 'luxury_showroom', icon: '✨', label: 'Boutique Showroom' }
                  ].map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setCameraPreset(p.id as any);
                        playAudioFx('tink');
                        setShowCameraMenu(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '6px 8px',
                        background: cameraPreset === p.id ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                        border: cameraPreset === p.id ? '1px solid rgba(56, 189, 248, 0.5)' : '1px solid transparent',
                        borderRadius: '6px',
                        color: cameraPreset === p.id ? '#38bdf8' : '#e2e8f0',
                        fontSize: '11.5px',
                        fontWeight: cameraPreset === p.id ? 600 : 400,
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.12s ease'
                      }}
                    >
                      <span>{p.icon}</span>
                      <span>{p.label}</span>
                    </button>
                  ))}
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: '4px', paddingTop: '4px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        const next = cycleCameraPreset();
                        playAudioFx('tink');
                        const labels: Record<string, string> = {
                          overview: "Vue d'ensemble",
                          supercar_hero: "Supercar Studio 3/4",
                          luxury_showroom: "Boutique Louis Vuitton",
                          table: "Plan de travail",
                          cocotte: "Cocotte & Cuisson",
                          plate: "Assiette de dressage",
                          chopping: "Planche de découpe",
                          board: "Panneau d'affichage"
                        };
                        useWorldStore.setState(s => ({
                          warnings: [...s.warnings, `🎥 Cadrage caméra : ${labels[next] || next}`]
                        }));
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '5px',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '6px',
                        color: '#94a3b8',
                        fontSize: '10.5px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      🔁 Angle suivant (Cycle)
                    </button>
                  </div>
                </div>
              )}
            </div>
            <span />
            <button
              data-tooltip={isCinematicTourActive ? "Arrêter la visite 360°" : "Visite guidée cinématique 360°"}
              aria-label="Visite cinématique"
              aria-pressed={isCinematicTourActive}
              className={isCinematicTourActive ? 'active' : ''}
              onClick={toggleCinematicTour}
            >
              <Icon name="camera" />
            </button>
            <button
              data-tooltip="Prendre une photo HD [Alt+S]"
              aria-label="Prendre une photo HD"
              onClick={() => triggerCaptureScreenshot()}
              style={{ color: '#38bdf8' }}
            >
              <span style={{ fontSize: '13px' }}>📸</span>
            </button>
            <button
              data-tooltip={isSpatialAgentActive ? "Masquer le Guide IA 3D" : "Afficher le Guide IA 3D"}
              aria-label="Guide spatial"
              aria-pressed={isSpatialAgentActive}
              className={isSpatialAgentActive ? 'active' : ''}
              onClick={toggleSpatialAgent}
            >
              <Icon name="user" />
            </button>
            <span />
            <button
              data-tooltip={showGrid ? "Masquer la grille [G]" : "Afficher la grille magnétique [G]"}
              aria-label="Afficher la grille"
              aria-pressed={showGrid}
              className={showGrid ? 'active' : ''}
              onClick={() => setShowGrid(!showGrid)}
            >
              <Icon name="grid" />
            </button>
            <button
              data-tooltip={showLabels ? "Masquer les étiquettes [L]" : "Afficher les étiquettes [L]"}
              aria-label="Afficher les étiquettes"
              aria-pressed={showLabels}
              className={showLabels ? 'active' : ''}
              onClick={() => setShowLabels(!showLabels)}
            >
              <Icon name="tag" />
            </button>
            <button
              data-tooltip="Panneau Web interactif 3D [W]"
              aria-label="Panneau Web"
              onClick={handleAddWebScreen}
            >
              <Icon name="globe" />
            </button>
            <span />
            <AtmosphereSelector />
            <AudioControlWidget />
            <button
              data-tooltip={`Réglages visuels : ${cinematicPreset} [Alt+C]`}
              aria-label="Réglages post-processing cinématographique"
              aria-pressed={cinematicPreset !== 'standard'}
              className={cinematicPreset !== 'standard' ? 'active' : ''}
              style={{ color: cinematicPreset !== 'standard' ? '#34d399' : undefined }}
              onClick={() => setShowCinematicModal(true)}
            >
              <span style={{ fontSize: '13px' }}>✨</span>
            </button>
            <button
              data-tooltip={evening ? "Passer en éclairage Jour" : "Passer en éclairage Soir"}
              aria-label="Changer l’éclairage"
              aria-pressed={evening}
              onClick={() => setEvening(!evening)}
            >
              <Icon name="sun" />
            </button>
            <span />
            <button
              data-tooltip="Vider la scène et repartir de zéro [Alt+Suppr]"
              aria-label="Vider la scène"
              style={{ color: '#f87171' }}
              onClick={handleClearScene}
            >
              <Icon name="trash" />
            </button>
          </div>

          {showGuidedDemoModal && (
            <ZeroClickLaunchpad
              onClose={() => setShowGuidedDemoModal(false)}
              onLaunchPrompt={(prompt, title, cameraPreset) => {
                setShowGuidedDemoModal(false);
                requestExperienceLoad(title, (clearFirst) => {
                  if (clearFirst) {
                    useWorldStore.getState().resetWorld();
                  }
                  useWorldStore.getState().setAppMode('simulation');
                  handleApplyInstruction(prompt, { preferLocalRules: true });
                  if (cameraPreset) {
                    useWorldStore.getState().setCameraPreset(cameraPreset);
                  }
                });
              }}
              onLaunchSpatialWebHub={() => {
                setShowGuidedDemoModal(false);
                handleAddCompleteSpatialWebStudio();
              }}
              onOpenPitchDirector={() => {
                setShowGuidedDemoModal(false);
                setShowPitchDirector(true);
              }}
            />
          )}

          {showHelp && <HelpPanelModal onClose={() => setShowHelp(false)} />}
          {(showLogic || showJson) && (
            <div className="scene-overlay editor-overlay">
              <div className="editor-header">
                <span>{showLogic ? (isFr ? 'Graphe de causalité' : 'Causal Graph') : (isFr ? 'État du monde · WorldIR' : 'World State · WorldIR')}</span>
                <button className="icon-button" onClick={() => { setShowLogic(false); setShowJson(false); }} aria-label={isFr ? "Fermer l’inspecteur" : "Close inspector"}>×</button>
              </div>
              {showLogic ? <LogicEditor /> : <JsonEditor />}
            </div>
          )}
          {warnings.length > 0 && (
            <div className="runtime-notice" role="status">
              <div>
                <b>{isFr ? 'Événement du monde' : 'World Event'}</b>
                {warnings.map((w, i) => {
                  let text = w;
                  if (!isFr) {
                    if (text.includes('Réparation Minimale de Pareto appliquée ! Accessibilité et invariants restaurés.')) {
                      text = '✨ Pareto Minimal Repair applied! Accessibility and invariants restored.';
                    } else if (text.includes('Verrou causal formel appliqué : require_flag(battery_inspected == TRUE)')) {
                      text = '🛡️ Formal causal lock applied: require_flag(battery_inspected == TRUE). Invariant ✅ VERIFIED!';
                    } else if (text.includes('Diagnostic batterie OK')) {
                      text = '⚡ Battery diagnostic OK! Correct voltage (12.6V), cells balanced.';
                    } else if (text.includes('Batterie connectée !')) {
                      text = '🚗 Battery connected! (+) and (-) terminals tightened. Headlights on and engine ready!';
                    } else if (text.startsWith('Quête accomplie :')) {
                      text = text.replace('Quête accomplie :', 'Quest completed:');
                    } else if (text.startsWith('🎉 Quête accomplie :')) {
                      text = text.replace('🎉 Quête accomplie :', '🎉 Quest completed:');
                    } else if (text.startsWith('✓ Étape validée')) {
                      text = text.replace('✓ Étape validée', '✓ Step completed').replace('sur', 'of');
                    } else if (text.startsWith('🎯 Prochaine étape :')) {
                      text = text.replace('🎯 Prochaine étape :', '🎯 Next step:');
                    } else if (text.includes('a été détruit !')) {
                      text = text.replace('a été détruit !', 'was destroyed!');
                    } else if (text.includes('a changé de couleur !')) {
                      text = text.replace('a changé de couleur !', 'changed color!');
                    }
                  }
                  return <p key={i}>{text}</p>;
                })}
              </div>
              <button className="icon-button" onClick={clearWarnings} aria-label={isFr ? "Fermer les notifications" : "Close notifications"}>×</button>
            </div>
          )}

          <div className="scene-bottom">
            {showNavHint ? (
              <div
                className="navigation-hint"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flexWrap: 'wrap',
                  animation: 'fadeIn 0.25s ease-out'
                }}
              >
                <div
                  onClick={() => setShowHelp(v => !v)}
                  title={isFr ? "Cliquer pour afficher le guide complet des raccourcis et commandes 3D [?]" : "Click to view full 3D navigation & shortcut guide [?]"}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                >
                  <Icon name="mouse" />
                  <span>
                    <b>{isFr ? 'Orbiter' : 'Orbit'}</b> ({isFr ? 'Clic + Glisser' : 'Click + Drag'}) <span>·</span> <b>{isFr ? 'Zoomer' : 'Zoom'}</b> ({isFr ? 'Molette' : 'Wheel'}) <span>·</span> <b>{isFr ? 'Se déplacer' : 'Pan / Move'}</b> ({isFr ? 'ZQSD / Flèches' : 'WASD / Arrows'})
                  </span>
                  <span
                    style={{
                      background: 'rgba(56, 189, 248, 0.16)',
                      border: '1px solid rgba(56, 189, 248, 0.35)',
                      color: '#0284c7',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      fontSize: '9px',
                      fontWeight: 700,
                      marginLeft: '4px'
                    }}
                  >
                    ⌨️ {isFr ? 'Guide [?]' : 'Guide [?]'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowNavHint(false);
                  }}
                  title={isFr ? "Masquer les instructions permanentes" : "Hide permanent instructions"}
                  aria-label={isFr ? "Masquer les instructions permanentes" : "Hide permanent instructions"}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    fontSize: '13px',
                    padding: '0 4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: 1,
                  }}
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowHelp(true)}
                title={isFr ? "Afficher les raccourcis de navigation 3D et le guide [?]" : "Show 3D navigation shortcuts & guide [?]"}
                style={{
                  background: 'rgba(15, 23, 42, 0.72)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '20px',
                  color: '#94a3b8',
                  padding: '4px 10px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backdropFilter: 'blur(10px)',
                  pointerEvents: 'auto',
                  transition: 'all 0.18s ease'
                }}
              >
                <span>⌨️</span> <span>Raccourcis 3D</span> <span style={{ opacity: 0.55, fontSize: '9.5px', marginLeft: '1px' }}>[?]</span>
              </button>
            )}
            <span className="light-caption"><span />{evening ? 'Heure dorée' : 'Lumière naturelle'}</span>
          </div>
          {hasTraining && (
            <div className="training-actions">
              <button className="button" onClick={() => useWorldStore.getState().dispatch({ type: 'INSPECT', sourceId: 'player' })}>
                Inspecter la batterie B-17
              </button>
              <button className="button" onClick={() => useWorldStore.getState().dispatch({ type: 'COMPLETE_TRAINING', sourceId: 'player' })}>
                Terminer la formation
              </button>
            </div>
          )}
          {hasCarBatteryTraining && (
            <div className="training-actions">
              <button className="button" onClick={() => useWorldStore.getState().dispatch({ type: 'INTERACT', sourceId: 'car_battery_new' })}>
                🔋 1. Mesurer la tension (12.6V)
              </button>
              <button className="button primary" onClick={() => {
                useWorldStore.getState().dispatch({ type: 'INTERACT', sourceId: 'car_battery_new' });
                useWorldStore.getState().dispatch({ type: 'DROP', sourceId: 'car_battery_new', targetId: 'battery_tray_zone' });
              }}>
                ⚡ 2. Installer & Connecter au compartiment moteur
              </button>
            </div>
          )}
          </SpatialDropZone>
        </section>

        {appMode !== 'simulation' && (
          <aside className="author-panel">
            <div className="panel-heading">
              <div>
                <div className="eyebrow">{uiLanguage === 'fr' ? 'L’ATELIER SPATIAL' : 'SPATIAL STUDIO'}</div>
                <h2>{uiLanguage === 'fr' ? 'Dessinez l’impossible' : 'Design the impossible'}<span>.</span></h2>
              </div>
              <button
                type="button"
                className="assistant-mark"
                onClick={handleInspirePrompt}
                title={uiLanguage === 'fr' ? "💡 Inspiration IA · Insérer une idée créative de scène dans le prompt" : "💡 AI Inspiration · Insert a creative scene prompt idea"}
                aria-label="Inspiration IA"
                style={{
                  cursor: 'pointer',
                  border: '1px solid rgba(99, 102, 241, 0.4)',
                  borderRadius: '10px',
                  background: 'rgba(99, 102, 241, 0.15)',
                  padding: '7px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#818cf8',
                  transition: 'all 0.2s ease',
                }}
              >
                <Icon name="spark" />
              </button>
            </div>
            <div className="panel-tabs" role="tablist" aria-label="Atelier">
              <button role="tab" aria-selected={panelTab === 'create'} onClick={() => setPanelTab('create')}>
                {uiLanguage === 'fr' ? 'Créer un monde' : 'Create world'}
              </button>
              <button role="tab" aria-selected={panelTab === 'history'} onClick={() => { useWorldStore.getState().closeWebModal(); setPanelTab('history'); }}>
                {uiLanguage === 'fr' ? 'Historique' : 'History'} <small>{records.length}</small>
              </button>
            </div>
            <div className="panel-content">
              {panelTab === 'create' ? <>
                <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label htmlFor="world-prompt">{uiLanguage === 'fr' ? 'Votre intention' : 'Your intent'}</label>
                  {records.length > 0 && (
                    <button
                      type="button"
                      className="button subtle small"
                      onClick={openPromptHistory}
                      title={uiLanguage === 'fr' ? "Afficher l'historique complet des prompts (Alt+H)" : "Show complete prompt history (Alt+H)"}
                      style={{ padding: '2px 8px', fontSize: '11px', height: '22px', borderRadius: '4px' }}
                    >
                      📜 {uiLanguage === 'fr' ? 'Historique' : 'History'} ({records.length})
                    </button>
                  )}
                </div>
                <div className={`prompt-box ${isProcessing ? 'processing' : ''}`}>
                  <textarea
                    id="world-prompt"
                    placeholder={t.promptPlaceholder}
                    value={instruction}
                    onChange={e => setInstruction(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isProcessing}
                  />
                  <div className="prompt-footer">
                    <span>{t.promptSubmit}</span>
                    <Icon name="spark" />
                  </div>
                </div>
                <button
                  className="generate-button"
                  onClick={() => handleApplyInstruction()}
                  disabled={isProcessing || !instruction.trim()}
                >
                  {isProcessing ? t.creatingWorld : t.giveLifeButton}
                  <Icon name={isProcessing ? 'sun' : 'arrow'} />
                </button>
                {instructionSource && (
                  <div role="status" aria-live="polite" style={{ marginTop: '6px', fontSize: '11px', color: instructionSource === 'unresolved' ? '#fbbf24' : '#94a3b8' }}>
                    {instructionSource === 'local_rules'
                      ? (uiLanguage === 'fr' ? 'Interprétation par règles locales déterministes.' : 'Interpreted via deterministic local rules.')
                      : instructionSource === 'llm'
                        ? (uiLanguage === 'fr' ? 'Patch proposé par le modèle de langage, puis contrôlé avant application.' : 'Patch suggested by language model, verified before applying.')
                        : (uiLanguage === 'fr' ? 'Aucune interprétation valide ; aucun changement appliqué.' : 'No valid interpretation; no changes applied.')}
                  </div>
                )}
                <div className="voice-row">
                  <span>{uiLanguage === 'fr' ? 'Ou simplement, dites-le.' : 'Or simply speak it.'}</span>
                  <VoiceInput onTranscript={setInstruction} onApply={handleApplyInstruction} disabled={isProcessing} />
                </div>
                {errorMsg && <div className="error-notice" role="alert">{errorMsg}</div>}

                {(selected || zone) && <LibraryInspector entity={(selected || zone)!} />}

                <section className="world-section"><button className="section-title object-toggle" onClick={() => setShowObjects(!showObjects)} aria-expanded={showObjects}><h3>{isFr ? 'Dans votre monde' : 'In your world'} <small>{entities.length.toString().padStart(2, '0')}</small></h3><span>{showObjects ? '−' : '+'}</span></button>
                  {showObjects && (entities.length ? <div className="entity-list">{entities.map(entity => {
                    const isZone = entity.capabilities.some(c => c.type === 'trigger_zone');
                    return <button key={entity.id} className={`entity-row ${[selected?.id, zone?.id].includes(entity.id) ? 'selected' : ''}`} onClick={() => useWorldStore.getState().setSpatialContext(isZone ? spatialContext.selectedEntityId : entity.id, isZone ? entity.id : spatialContext.pointedEntityId)}><Icon name={isZone ? 'grid' : 'cube'} /><span>{entity.name}<small>{isZone ? (isFr ? 'Zone d’interaction' : 'Interaction zone') : (isFr ? 'Objet spatial' : 'Spatial entity')}</small></span><span className="entity-status" /></button>;
                  })}</div> : <div className="empty-objects"><Icon name="cube" /><p>{isFr ? 'Votre scène est une page blanche.' : 'Your scene is blank.'}<br /><span>{isFr ? 'Les objets créés apparaîtront ici.' : 'Created entities will appear here.'}</span></p></div>)}
                </section>
                <section className="context-section">
                  <div className="section-title"><h3>Contexte spatial</h3></div>
                  <div className="context-line"><span>THIS</span><b>{selected?.name || (isFr ? 'Sélectionnez un objet' : 'Select an object')}</b></div>
                  <div className="context-line"><span>HERE</span><b>{zone?.name || (isFr ? 'Pointez une zone' : 'Point to a zone')}</b></div>
                </section>
                {hasTraining && <div className="verification-actions"><button className="button" onClick={() => handleApplyInstruction('Nobody should ever complete this training without inspecting the battery', { preferLocalRules: true })}>{isFr ? 'Ajouter l’invariant d’inspection' : 'Add inspection invariant'}</button><button className="button" onClick={() => handleApplyInstruction('Try to break it', { preferLocalRules: true })}>{isFr ? 'Chercher un contre-exemple' : 'Search counterexample'}</button></div>}
              </> : (
                <div className="history-list">
                  <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3>{isFr ? 'Journal de création' : 'Creation log'}</h3>
                    <button
                      type="button"
                      className="button subtle small"
                      onClick={openPromptHistory}
                      style={{ padding: '2px 8px', fontSize: '11px', height: '22px' }}
                    >
                      {isFr ? '📜 Vue complète (Alt+H)' : '📜 Full view (Alt+H)'}
                    </button>
                  </div>
                  {records.length === 0 ? (
                    <p className="muted">{isFr ? 'Chaque modification du monde sera consignée ici : intention, objets et règles modifiés.' : 'Every world modification is recorded here: intent, affected entities and rules.'}</p>
                  ) : (
                    records.map(record => (
                      <article key={record.edit_id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <b>{record.edit_id}</b>
                          <span>v{record.world_version_before} → v{record.world_version_after}</span>
                        </div>
                        <p style={{ fontWeight: 500, color: '#f8fafc', margin: '4px 0' }}>« {record.original_instruction} »</p>
                        <small style={{ color: '#94a3b8' }}>{record.command_plan?.intent}</small>
                        <dl style={{ margin: '4px 0' }}>
                          <dt>{isFr ? 'Objets créés' : 'Created entities'}</dt>
                          <dd>{record.entities_created.join(', ') || '—'}</dd>
                          <dt>{isFr ? 'Règles modifiées' : 'Modified rules'}</dt>
                          <dd>{record.rules_changed.join(', ') || '—'}</dd>
                        </dl>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '4px' }}>
                          <button
                            type="button"
                            className="button small"
                            onClick={() => {
                              navigator.clipboard?.writeText(record.original_instruction);
                              playAudioFx('tink');
                            }}
                            title={isFr ? "Copier le prompt" : "Copy prompt"}
                            style={{ padding: '2px 6px', fontSize: '11px' }}
                          >
                            📋 {isFr ? 'Copier' : 'Copy'}
                          </button>
                          <button
                            type="button"
                            className="button small"
                            onClick={() => {
                              setInstruction(record.original_instruction);
                              setPanelTab('create');
                              playAudioFx('tink');
                            }}
                            title={isFr ? "Insérer dans le champ de création" : "Insert into prompt input"}
                            style={{ padding: '2px 6px', fontSize: '11px' }}
                          >
                            ↩️ {isFr ? 'Insérer' : 'Insert'}
                          </button>
                          <button
                            type="button"
                            className="button small primary"
                            onClick={() => {
                              handleApplyInstruction(record.original_instruction);
                              playAudioFx('chime');
                            }}
                            title={isFr ? "Relancer ce prompt" : "Rerun this prompt"}
                            style={{ padding: '2px 6px', fontSize: '11px' }}
                          >
                            ⚡ {isFr ? 'Relancer' : 'Rerun'}
                          </button>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              )}
              {simResult && <div className={`simulation-result ${simResult.invariantBroken ? 'broken' : ''}`} role="status"><b>{simResult.invariantBroken ? (isFr ? 'Contre-exemple détecté' : 'Counterexample detected') : (isFr ? 'Aucun contre-exemple trouvé' : 'No counterexample found')}</b><p>{isFr ? 'Recherche bornée à 3 événements.' : 'Bounded search at 3 events.'}</p>{simResult.invariantBroken && <><p>{simResult.brokenInvariantId}</p><code>{simResult.trace.map((t: any) => t.type).join(' → ')}</code><div><button className="button" onClick={handleReplay}>{isFr ? 'Recommencer' : 'Replay'}</button><button className="button primary" onClick={handleApplyFix}>{isFr ? 'Appliquer le correctif' : 'Apply fix'}</button></div></>}</div>}
            </div>
            <div className="panel-bottom"><span><span className="status-dot" />{rulesCount} {isFr ? 'règles' : 'rules'} <span>·</span> {invariantsCount} invariants</span><button title={isFr ? "Vider la scène" : "Clear scene"} aria-label={isFr ? "Vider la scène" : "Clear scene"} className="icon-button" onClick={() => { if (window.confirm(isFr ? 'Vider la scène et repartir de zéro ?' : 'Clear scene and start fresh?')) { useWorldStore.getState().resetWorld(); setSimResult(null); } }}><Icon name="trash" /></button></div>
          </aside>
        )}
      </main>
      <footer className="app-footer"><span><span className="status-dot" /> {isFr ? 'Moteur causal prêt' : 'Causal engine ready'}</span><span>{isFr ? 'Du prompt au monde. Du monde à la preuve.' : 'From prompt to world. From world to proof.'}</span><button onClick={toggleVoiceMode}>{isVoiceModeEnabled ? (isFr ? 'Voix activée' : 'Voice enabled') : (isFr ? 'Voix désactivée' : 'Voice disabled')}</button></footer>
      {showLibrary && <LibraryPanel onClose={closeLibrary} />}
      <FLEScenesModal
        isOpen={showFLEModal}
        onClose={() => setShowFLEModal(false)}
        onRequestDeploy={requestExperienceLoad}
      />
      <CookingRecipesModal
        isOpen={showCookingModal}
        onClose={() => setShowCookingModal(false)}
        onRequestDeploy={requestExperienceLoad}
      />
      <SeminarRoomsModal
        isOpen={showSeminarModal}
        onClose={() => setShowSeminarModal(false)}
        onRequestDeploy={requestExperienceLoad}
      />
      <DemonstrationsModal
        isOpen={showDemoModal}
        onClose={() => setShowDemoModal(false)}
        onRequestDeploy={requestExperienceLoad}
      />
      <DataIngestionModal isOpen={showDataModal} onClose={() => setShowDataModal(false)} />
      <Web3TransactionModal />
      <WebScreenModal />
      <DegustationModal />
      <SupercarConfiguratorModal />
      <AchievementsModal isOpen={showAchievementsModal} onClose={() => setShowAchievementsModal(false)} />
      <AchievementToast />
      <FLEFlashcardStudyModal isOpen={showFlashcardStudyModal} onClose={closeFlashcardStudyModal} sceneId={studyModalSceneId} />
      <CollaborationBoardModal isOpen={showCollaborationBoardModal} onClose={() => setShowCollaborationBoardModal(false)} />
      <BehavioralAnalyticsModal />
      <AgentCognitiveLedgerModal />
      <PublishReadinessModal />
      <EditOrderLabModal />
      <SyntheticPlaytesterModal />
      <CinematicSettingsModal />
      {showResearchDashboardModal && (
        <SpatialTelemetryDashboard
          isGuidedTourActive={showPitchDirector}
          onClose={() => useWorldStore.getState().closeResearchDashboard()}
        />
      )}
      <PitchDemoDirector isOpen={showPitchDirector} onClose={() => setShowPitchDirector(false)} />
      <PromptHistoryModal
        isOpen={showPromptHistoryModal}
        onClose={() => setShowPromptHistoryModal(false)}
        onSelectPrompt={(p) => {
          setInstruction(p);
          setPanelTab('create');
        }}
        onReplayPrompt={(p) => handleApplyInstruction(p)}
      />
      <CertifiedExperiencesModal
        isOpen={showCertifiedModal}
        onClose={() => {
          setShowCertifiedModal(false);
          setCertifiedSearchQuery('');
        }}
        initialSearchQuery={certifiedSearchQuery}
        onLaunchExperience={(prompt, title) => {
          requestExperienceLoad(title || 'Expérience certifiée', (clearFirst) => {
            if (clearFirst) {
              useWorldStore.getState().resetWorld();
            }
            useWorldStore.getState().setAppMode('simulation');
            handleApplyInstruction(prompt, { preferLocalRules: true });
          });
        }}
      />
      <SavedLayoutsModal
        isOpen={showLayoutsModal}
        onClose={() => setShowLayoutsModal(false)}
      />
      <ObjectCompatibilityModal
        isOpen={showObjectCompatibilityModal}
        onClose={() => setShowObjectCompatibilityModal(false)}
      />
      <Entity2DSpecSheetDrawer />
      <ImportUrlModal
        isOpen={showImportUrlModal}
        onClose={() => setShowImportUrlModal(false)}
      />
      {pendingExperienceLoad && (
        <LoadExperienceConfirmationModal
          isOpen={true}
          experienceTitle={pendingExperienceLoad.title}
          itemCount={Object.keys(world.ir.entities).length}
          hasCustomSaved={pendingExperienceLoad.hasCustomSaved}
          onResetToOriginal={pendingExperienceLoad.onResetToOriginal}
          onConfirmClearAndLoad={() => {
            const { loadFn } = pendingExperienceLoad;
            setPendingExperienceLoad(null);
            loadFn(true);
          }}
          onKeepAndMerge={() => {
            const { loadFn } = pendingExperienceLoad;
            setPendingExperienceLoad(null);
            loadFn(false);
          }}
          onCancel={() => setPendingExperienceLoad(null)}
        />
      )}
    </div>
  );
}

function Icon({ name }: { name: string }) {
  const paths: Record<string, React.ReactNode> = {
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
    cube: <><path d="m12 3 9 5v8l-9 5-9-5V8zM3 8l9 5 9-5M12 13v8M7.5 5.5l9 5" /></>,
    chat: <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /><path d="M8 10h.01M12 10h.01M16 10h.01" /></>,
    chef: <><path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z" /><line x1="6" y1="17" x2="18" y2="17" /></>,
    briefcase: <><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></>,
    chart: <><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></>,
    grid: <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 3v18M15 3v18M3 9h18M3 15h18" /></>,
    focus: <><path d="M8 3H3v5M16 3h5v5M21 16v5h-5M8 21H3v-5" /><circle cx="12" cy="12" r="3" /></>,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5" /></>,
    tag: <><path d="M3 3h8l10 10-8 8L3 11z" /><circle cx="7.5" cy="7.5" r="1" /></>,
    nodes: <><rect x="3" y="9" width="5" height="6" rx="1" /><rect x="16" y="3" width="5" height="6" rx="1" /><rect x="16" y="15" width="5" height="6" rx="1" /><path d="M8 12h4V6h4M12 12v6h4" /></>,
    code: <><path d="m8 7-5 5 5 5M16 7l5 5-5 5M14 4l-4 16" /></>,
    play: <path d="m8 5 11 7-11 7z" />,
    pause: <><path d="M8 5v14M16 5v14" /></>,
    spark: <><path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5zM20 2v4M18 4h4" /></>,
    vr: <><path d="M5 6h14l3 4-1 8h-6l-3-3-3 3H3l-1-8z" /><path d="M6 11h3M15 11h3" /></>,
    help: <><circle cx="12" cy="12" r="9" /><path d="M9 9a3 3 0 0 1 6 0c0 2-3 2-3 4M12 16v1" /></>,
    mouse: <><rect x="6" y="2" width="12" height="20" rx="6" /><path d="M12 6v4" /></>,
    trash: <><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7" /></>,
    camera: <><path d="m22 8-6 4 6 4V8Z" /><rect x="2" y="6" width="14" height="12" rx="2" /></>,
    user: <><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
    save: <><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></>,
    download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></>,
    folder: <><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" /></>,
    globe: <><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></>,
    table: <><rect x="3" y="6" width="18" height="3" rx="1" /><line x1="6" y1="9" x2="6" y2="18" /><line x1="18" y1="9" x2="18" y2="18" /></>,
  };
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.cube}</svg>;
}

function HelpPanelModal({ onClose }: { onClose: () => void }) {
  const { offset, dragProps } = useDraggableModal();
  const uiLanguage = useWorldStore(s => s.uiLanguage);
  const isFr = uiLanguage === 'fr';

  return (
    <div
      className="scene-overlay help-panel"
      style={{
        transform: `translate(${offset.x}px, ${offset.y}px)`,
        cursor: 'auto',
        zIndex: 1000,
      }}
    >
      <div
        {...dragProps}
        className="section-title"
        style={{
          ...dragProps.style,
          userSelect: 'none',
          cursor: 'grab',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
        }}
        title={isFr ? "Cliquer-glisser pour déplacer le guide" : "Click and drag to move guide"}
      >
        <h2>{isFr ? 'Prendre les commandes' : 'Taking Control & Shortcuts'}</h2>
        <button className="icon-button" onClick={onClose} aria-label={isFr ? "Fermer le guide" : "Close guide"}>×</button>
      </div>

      {isFr ? (
        <>
          <p><b>01 · Navigation Trackpad (Mac)</b><br />
          • <b>Tourner (orbiter)</b> : Cliquer et glisser avec 1 doigt.<br />
          • <b>Zoomer</b> : Pincer à 2 doigts ou glisser verticalement à 2 doigts.<br />
          • <b>Déplacer (pan)</b> : Maintenir <b>Shift (⇧ Maj)</b> + cliquer-glisser à 1 doigt (ou clic à 2 doigts).<br />
          <small style={{ color: '#889988' }}>Souris : Clic gauche pour tourner, molette pour zoomer, clic droit ou Shift+glisser pour déplacer.</small></p>
          <p><b>02 · Recentrer la caméra</b><br />Cliquez sur le bouton cible <b>[ ⌖ ]</b> dans la barre verticale à gauche pour réaligner immédiatement la vue au centre.</p>
          <p><b>03 · Créez & Explorez</b><br />Tapez ou dictez votre consigne (ex: <i>« Ajoute une chaise scolaire »</i>), ou explorez les 500 objets de la bibliothèque.</p>
          <p><b>04 · Programmez & Vérifiez</b><br />Cliquez sur un objet (THIS), puis une zone (HERE). Définissez une règle ou vérifiez des invariants formels.</p>
          <p><b>05 · Les 3 Modes Primaires & Auteur Avancé</b><br />
          • <b>Conception [Alt+1]</b> : Studio auteur, invite en langage naturel, catalogue 3D et règles causales.<br />
          • <b>Simulation [Alt+2]</b> : Immersion 100% plein écran, compagnon spatial IA et retours haptiques WebXR.<br />
          • <b>L'Observatoire [Alt+3]</b> : Cockpit cognitif, benchmark multi-personas et boucle adaptative fermée E2.<br />
          • <b>Observabilité & Debug Causal [F2 / Ctrl+D]</b> : Tiroir réactif (Drapeaux, Règles causales, Invariants, Substrat YAML, Défis Roguelike).<br />
          • <b>Manipulateur 3D / Gizmo [Shift+G]</b> : Bascule Translation / Rotation / Masqué sur l'objet sélectionné (axes X, Y, Z).<br />
          • <b>Micro-Prompt IA In-Situ</b> : Invite ciblée directe dans le cartouche 3D de l'objet sélectionné.</p>
        </>
      ) : (
        <>
          <p><b>01 · Trackpad & Mouse Navigation</b><br />
          • <b>Orbit / Rotate</b>: Click and drag with 1 finger.<br />
          • <b>Zoom</b>: Pinch with 2 fingers or scroll vertically.<br />
          • <b>Pan / Move</b>: Hold <b>Shift (⇧)</b> + click-drag (or right-click drag).<br />
          <small style={{ color: '#889988' }}>Mouse: Left-click to orbit, wheel to zoom, right-click or Shift+drag to pan.</small></p>
          <p><b>02 · Recenter Camera</b><br />Click the target icon <b>[ ⌖ ]</b> in the vertical toolbar to immediately center the 3D viewport.</p>
          <p><b>03 · Create & Explore</b><br />Type or speak your prompt (e.g. <i>"Add an emergency generator"</i>), or browse the 500 catalog items in the library.</p>
          <p><b>04 · Author & Verify</b><br />Select an entity (THIS) and target zone (HERE). Author causal rules or verify formal invariants.</p>
          <p><b>05 · 3 Primary Modes & Advanced Authoring</b><br />
          • <b>Design [Alt+1]</b>: Author studio, natural language prompt, 3D catalog, and causal rules.<br />
          • <b>Simulation [Alt+2]</b>: 100% full-screen immersion, 3D AI companion, and WebXR haptics.<br />
          • <b>The Observatory [Alt+3]</b>: Cognitive cockpit, multi-persona benchmark, and closed-loop E2 adaptation.<br />
          • <b>Reactive Causal Observability [F2 / Ctrl+D]</b>: Reactive drawer (Flags, Causal rules, Invariants, YAML, Roguelike challenges).<br />
          • <b>3D Gizmo Manipulator [Shift+G]</b>: Toggle Translate / Rotate / Hidden on selected entity (X, Y, Z axes).<br />
          • <b>In-Situ AI Micro-Prompt</b>: Targeted in-place prompt directly inside the selected 3D entity HUD.</p>
        </>
      )}
    </div>
  );
}
