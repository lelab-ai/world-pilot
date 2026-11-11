import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { useWorldStore } from '../engine/store';
import { 
  resolveContextualPersona,
  getAgentPersona,
  AgentPersona,
  getSpeechDialogue, 
  getWorldShiftDialogue, 
  getDataIngestionDialogue, 
  getGameplayDialogue, 
  speakAgentDialogue,
  isFemaleName,
  VISEME_CONFIGS,
  VisemeConfig,
  SpeechPhonemeDetail
} from '../engine/agentDialogues';
import { getAsset } from '../library/catalog';

const getVec3Coord = (val: any, fallback: { x: number; y: number; z: number }): { x: number; y: number; z: number } => {
  if (!val) return fallback;
  if (Array.isArray(val)) {
    return {
      x: typeof val[0] === 'number' && !isNaN(val[0]) ? val[0] : fallback.x,
      y: typeof val[1] === 'number' && !isNaN(val[1]) ? val[1] : fallback.y,
      z: typeof val[2] === 'number' && !isNaN(val[2]) ? val[2] : fallback.z,
    };
  }
  return {
    x: typeof val.x === 'number' && !isNaN(val.x) ? val.x : fallback.x,
    y: typeof val.y === 'number' && !isNaN(val.y) ? val.y : fallback.y,
    z: typeof val.z === 'number' && !isNaN(val.z) ? val.z : fallback.z,
  };
};

export const SpatialAgent: React.FC = () => {
  const isSpatialAgentActive = useWorldStore(s => s.isSpatialAgentActive);
  const isAgentSpeechEnabled = useWorldStore(s => s.isAgentSpeechEnabled);
  const toggleAgentSpeech = useWorldStore(s => s.toggleAgentSpeech);
  const quests = useWorldStore(s => s.world.ir.quests);
  const activeQuestId = useWorldStore(s => s.world.ir.activeQuestId);
  const entities = useWorldStore(s => s.world.ir.entities);
  const currentWorldThemeId = useWorldStore(s => s.currentWorldThemeId);
  const { camera } = useThree();

  const [bubbleOpen, setBubbleOpen] = React.useState(false);
  const [showHint, setShowHint] = React.useState(false);
  const [themeComment, setThemeComment] = React.useState<string | null>(null);

  const activeQuest = useMemo(() => {
    if (!quests) return null;
    const qId = activeQuestId || Object.keys(quests)[0];
    return qId ? quests[qId] : null;
  }, [quests, activeQuestId]);

  const instruction = useWorldStore(s => s.instruction);

  const customAgentPersona = useWorldStore(s => (s as any).customAgentPersona);

  const persona = useMemo<AgentPersona>(() => {
    // 1. Sanctuarisation du Mentor Métier Canonique :
    // Lorsqu'une quête métier active est en cours (ex: mécanique, cuisine, naturaliste),
    // son expert désigné (Marc pour l'automobile, Auguste pour la gastronomie, Sylvain pour la nature)
    // reste immuable et n'est pas altéré par les prompts transversaux ou le drift de session.
    const questCategory = activeQuest?.category;
    if (questCategory) {
      const canonical = getAgentPersona(questCategory, activeQuest?.title);
      if (canonical && canonical.theme !== 'assistant') {
        return canonical;
      }
    }

    const base = resolveContextualPersona({
      category: activeQuest?.category,
      worldTheme: currentWorldThemeId,
      entities,
      instruction,
      activeQuestTitle: activeQuest?.title
    });
    if (customAgentPersona && typeof customAgentPersona === 'object') {
      return {
        ...base,
        name: customAgentPersona.name || base.name,
        role: customAgentPersona.role || base.role,
        theme: (customAgentPersona.theme as any) || 'custom',
        color: customAgentPersona.color || base.color,
        accentColor: customAgentPersona.accentColor || base.accentColor,
        icon: customAgentPersona.icon || base.icon,
        greeting: customAgentPersona.greeting || base.greeting,
        attire: {
          ...base.attire,
          ...(customAgentPersona.attire || {})
        }
      };
    }
    return base;
  }, [customAgentPersona, activeQuest?.category, activeQuest?.title, currentWorldThemeId, entities, instruction]);

  const isFemale = useMemo(() => {
    return isFemaleName(persona.name, persona.role);
  }, [persona.name, persona.role]);

  // Reaction to world shifting
  useEffect(() => {
    if (currentWorldThemeId && currentWorldThemeId !== 'earth-atelier') {
      const speech = getWorldShiftDialogue(currentWorldThemeId, persona.theme);
      setThemeComment(speech);
      if (isAgentSpeechEnabled) {
        speakAgentDialogue(speech);
      }
      const timer = setTimeout(() => setThemeComment(null), 9000);
      return () => clearTimeout(timer);
    } else {
      setThemeComment(null);
    }
  }, [currentWorldThemeId, persona.theme, isAgentSpeechEnabled]);

  // Reaction to data-to-3d semantic ingestion
  useEffect(() => {
    const handleDataMaterialized = (e: any) => {
      const dataset = e.detail?.dataset;
      const title = dataset?.title || e.detail?.title || 'Données';
      const pointsCount = dataset?.points?.length || e.detail?.pointsCount || 5;
      const speech = getDataIngestionDialogue(title, pointsCount, persona.theme);
      setThemeComment(speech);
      if (isAgentSpeechEnabled) {
        speakAgentDialogue(speech);
      }
      const timer = setTimeout(() => setThemeComment(null), 10000);
      return () => clearTimeout(timer);
    };

    window.addEventListener('worldpilot_data_materialized', handleDataMaterialized);
    return () => window.removeEventListener('worldpilot_data_materialized', handleDataMaterialized);
  }, [persona.theme, isAgentSpeechEnabled]);

  // Reaction to emergent gameplay loops (gameplay start, victory, game over)
  useEffect(() => {
    const handleGameStarted = (e: any) => {
      const mode = e.detail?.gameMode || 'custom';
      const speech = getGameplayDialogue(mode, 'start', 0, persona.theme);
      setThemeComment(speech);
      if (isAgentSpeechEnabled) speakAgentDialogue(speech);
      const timer = setTimeout(() => setThemeComment(null), 9000);
      return () => clearTimeout(timer);
    };

    const handleVictory = (e: any) => {
      const score = e.detail?.score || 0;
      const speech = getGameplayDialogue('custom', 'victory', score, persona.theme);
      setThemeComment(speech);
      if (isAgentSpeechEnabled) speakAgentDialogue(speech);
      const timer = setTimeout(() => setThemeComment(null), 10000);
      return () => clearTimeout(timer);
    };

    const handleGameOver = (_e: any) => {
      const speech = getGameplayDialogue('custom', 'game_over', 0, persona.theme);
      setThemeComment(speech);
      if (isAgentSpeechEnabled) speakAgentDialogue(speech);
      const timer = setTimeout(() => setThemeComment(null), 8000);
      return () => clearTimeout(timer);
    };

    window.addEventListener('worldpilot_gameplay_started', handleGameStarted);
    window.addEventListener('worldpilot_victory', handleVictory);
    window.addEventListener('worldpilot_game_over', handleGameOver);

    return () => {
      window.removeEventListener('worldpilot_gameplay_started', handleGameStarted);
      window.removeEventListener('worldpilot_victory', handleVictory);
      window.removeEventListener('worldpilot_game_over', handleGameOver);
    };
  }, [persona.theme, isAgentSpeechEnabled]);

  const isQuestCompleted = activeQuest?.status === 'completed' || (activeQuest ? activeQuest.currentStepIndex >= activeQuest.steps.length : false);

  const currentStep = useMemo(() => {
    if (!activeQuest || isQuestCompleted) return null;
    return activeQuest.steps[activeQuest.currentStepIndex] || null;
  }, [activeQuest, isQuestCompleted]);

  const targetEntity = useMemo(() => {
    if (!currentStep) return null;
    const colonTargetId = currentStep.requiredEvent && currentStep.requiredEvent.includes(':')
      ? currentStep.requiredEvent.split(':')[1]
      : undefined;
    const targetId = currentStep.targetEntityId || currentStep.targetZoneId || colonTargetId;
    return targetId ? entities[targetId] : null;
  }, [currentStep, entities]);

  const targetPos = useMemo(() => {
    if (!targetEntity) return null;
    const transform = targetEntity.capabilities?.find((c: any) => c.type === 'transform');
    if (transform?.position) {
      const p = getVec3Coord(transform.position, { x: 0, y: 0, z: 0 });
      return new THREE.Vector3(p.x, p.y || 0, p.z);
    }
    return null;
  }, [targetEntity]);

  // Position avatar naturally at the flank of the work area - NEVER obstructing the front camera corridor
  const gameplay = useWorldStore(s => s.world.gameplay);
  const spatialAgentPositionOverride = useWorldStore(s => s.spatialAgentPositionOverride);

  const agentBasePos = useMemo(() => {
    if (spatialAgentPositionOverride) {
      return new THREE.Vector3(
        spatialAgentPositionOverride.x,
        spatialAgentPositionOverride.y ?? 0,
        spatialAgentPositionOverride.z
      );
    }
    let prefX = 1.45;
    let prefZ = 0.25;

    const isTabletopOrGo = Boolean(
      (activeQuest?.category as string) === 'jeux' ||
      activeQuest?.id?.includes('go') ||
      entities['goban_table'] ||
      Object.keys(entities).some(k => k.startsWith('go_'))
    );

    const hasPedagogicalBench = Object.keys(entities).some(
      k => k.startsWith('pedagogical_bench') || k.startsWith('apparatus_') || k.startsWith('adaptive_')
    );
    const isFormationOrPedagogy = Boolean(
      (activeQuest?.category as string) === 'formation' ||
      (activeQuest?.category as string) === 'pedagogy' ||
      hasPedagogicalBench
    );

    const isCookingScene = Boolean(
      (activeQuest?.category as string) === 'cuisine' ||
      persona.theme === 'chef' ||
      activeQuest?.id?.includes('recipe') ||
      activeQuest?.id?.includes('cuisine') ||
      activeQuest?.title?.toLowerCase().includes('ratatouille') ||
      activeQuest?.title?.toLowerCase().includes('recette') ||
      activeQuest?.title?.toLowerCase().includes('cuisine') ||
      Object.keys(entities).some(k => k.includes('recipe_') || k.includes('cocotte') || k.includes('wp-ilot-de-cuisine'))
    );

    if (isTabletopOrGo) {
      prefX = 0.0;
      prefZ = -1.15;
    } else if (gameplay?.gameMode === 'target_range' || Object.keys(entities).some(k => k.startsWith('target_'))) {
      prefX = 2.6;
      prefZ = 0.4;
    } else if (isFormationOrPedagogy) {
      // Natural standing slot beside the scientific workbench (table footprint X: [-1.1, 1.1])
      prefX = 1.65;
      prefZ = 0.20;
    } else if (activeQuest?.category === 'luxury' || activeQuest?.id?.includes('lv') || activeQuest?.id?.includes('luxe')) {
      prefX = 1.45;
      prefZ = 0.25;
    } else if (isCookingScene) {
      prefX = -1.55;
      prefZ = 0.25;
    } else if (activeQuest?.category === 'fle') {
      prefX = -1.40;
      prefZ = 0.25;
    } else if (activeQuest?.category === 'nature' || persona.theme === 'naturalist') {
      prefX = -1.35;
      prefZ = 0.25;
    }

    // 3D Screen / Projected Board Frustum Clearance:
    // Any active web screen or projection billboard uses Drei's <Html> layer which renders on top of the WebGL canvas in DOM order.
    // If the avatar stands directly in front of the screen within its horizontal width, the 2D HTML card cuts through or covers the avatar's 3D mesh.
    // To ensure the avatar is NEVER trapped or obscured behind the projected screen, we calculate the screen's corridor and ensure the avatar
    // stands comfortably on the clear lateral flank (beside the station/island).
    const activeScreen = Object.values(entities).find(e =>
      e.capabilities.some(c => c.type === 'web_screen') ||
      e.visuals?.assetId === 'web-screen' ||
      e.visuals?.assetId === 'captions' ||
      e.id.includes('board') ||
      e.name?.toLowerCase().includes('panneau') ||
      e.name?.toLowerCase().includes('recette')
    );

    if (activeScreen && !isTabletopOrGo) {
      const sTrans = activeScreen.capabilities.find(c => c.type === 'transform');
      if (sTrans?.position) {
        const sPos = getVec3Coord(sTrans.position, { x: 0, y: 0, z: 0 });
        // Screen is centered behind or near the workbench (e.g. |X| <= 0.9)
        if (Math.abs(sPos.x) <= 0.9) {
          if (Math.abs(prefX) < 1.45) {
            prefX = prefX >= 0 ? 1.55 : -1.55;
          }
        } else if (sPos.x < -0.9) {
          // Screen is on the left flank -> place avatar safely on the right flank
          prefX = Math.max(1.50, prefX);
          if (prefZ < 0.35) prefZ = 0.35;
        } else if (sPos.x > 0.9) {
          // Screen is on the right flank -> place avatar safely on the left flank
          prefX = Math.min(-1.50, prefX);
        }
      }
    }

    // Dynamic collision clearance: ensure avatar never intersects or eats any placed table, board, or game entity
    const avatarRadius = 0.48; // Generous safety cylinder for Victoria
    const solidEntities = Object.values(entities).filter(e => {
      const isZone = e.capabilities.some(c => c.type === 'trigger_zone');
      if (isZone || e.id === 'agent_avatar') return false;
      const eid = (e.id || '').toLowerCase();
      const ename = (e.name || '').toLowerCase();
      const eaid = (e.visuals?.assetId || '').toLowerCase();
      const isFloorOrWall =
        eid.includes('ground') || eid.includes('floor') || eid.startsWith('sol') || eid.endsWith('sol') || eid.includes('_sol_') ||
        ename.startsWith('sol') || ename.endsWith('sol') || ename.includes(' sol ') || ename.includes('plancher') ||
        eid.includes('mur') || eid.includes('wall') || ename.startsWith('mur') || ename.includes('baie') || ename.includes('coupole') ||
        eaid.includes('turntable') || eaid.includes('plateau-tournant') || ename.includes('plateau tournant') || eaid === 'wp-sol-forestier';
      return !isFloorOrWall;
    });

    let currentX = prefX;
    let currentZ = prefZ;

    for (const ent of solidEntities) {
      const transform = ent.capabilities.find(c => c.type === 'transform');
      if (!transform?.position) continue;
      const pos = getVec3Coord(transform.position, { x: 0, y: 0, z: 0 });
      const scl = getVec3Coord(transform.scale, { x: 1, y: 1, z: 1 });
      
      const isBench = ent.id.startsWith('pedagogical_bench');
      const catalogSize = ent.physicalProperties?.dimensions || getAsset(ent.visuals?.assetId)?.size;
      const halfW = isBench
        ? 1.1
        : catalogSize
          ? Math.max(0.20, (catalogSize[0] * Math.min(2.5, Math.abs(scl.x))) / 2)
          : Math.max(0.20, Math.min(2.2, Math.abs(scl.x)) / 2);
      const halfD = isBench
        ? 0.6
        : catalogSize
          ? Math.max(0.20, (catalogSize[2] * Math.min(2.5, Math.abs(scl.z))) / 2)
          : Math.max(0.20, Math.min(2.2, Math.abs(scl.z)) / 2);

      const minX = pos.x - halfW - avatarRadius;
      const maxX = pos.x + halfW + avatarRadius;
      const minZ = pos.z - halfD - avatarRadius;
      const maxZ = pos.z + halfD + avatarRadius;

      // If avatar's position falls inside or clips this entity's footprint
      if (currentX >= minX && currentX <= maxX && currentZ >= minZ && currentZ <= maxZ) {
        if (isTabletopOrGo) {
          currentZ = minZ - 0.20;
        } else if (currentX > 1.2 && pos.x > 1.2) {
          // Both avatar and entity are on the right flank: avoid pushing inward towards the center/screen
          if (currentZ < pos.z + halfD + avatarRadius) {
            currentZ = maxZ + 0.15;
          } else {
            currentX = maxX + 0.15;
          }
        } else if (currentX < -1.2 && pos.x < -1.2) {
          // Both avatar and entity are on the left flank: avoid pushing inward towards the center/screen
          if (currentZ < pos.z + halfD + avatarRadius) {
            currentZ = maxZ + 0.15;
          } else {
            currentX = minX - 0.15;
          }
        } else if (currentX >= pos.x) {
          currentX = maxX + 0.15;
        } else {
          currentX = minX - 0.15;
        }
      }
    }

    currentX = THREE.MathUtils.clamp(currentX, -3.2, 3.2);
    currentZ = THREE.MathUtils.clamp(currentZ, -2.5, 1.8);

    return new THREE.Vector3(currentX, 0, currentZ);
  }, [activeQuest?.category, activeQuest?.id, activeQuest?.title, gameplay?.gameMode, entities, spatialAgentPositionOverride, persona.theme]);

  const agentRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const mouthRef = useRef<THREE.Group>(null);
  const jawRef = useRef<THREE.Mesh>(null);
  const leftEyeRef = useRef<THREE.Group>(null);
  const rightEyeRef = useRef<THREE.Group>(null);
  const eyebrowsRef = useRef<THREE.Group>(null);

  // Articulated Hand & Finger Groups
  const rightHandRef = useRef<THREE.Group>(null);
  const rightThumbGroupRef = useRef<THREE.Group>(null);
  const rightIndexGroupRef = useRef<THREE.Group>(null);
  const rightMiddleGroupRef = useRef<THREE.Group>(null);
  const rightOtherFingersGroupRef = useRef<THREE.Group>(null);

  const leftHandRef = useRef<THREE.Group>(null);
  const leftThumbGroupRef = useRef<THREE.Group>(null);
  const leftFingersGroupRef = useRef<THREE.Group>(null);

  // Sonic Aura HUD
  const sonicHaloRef = useRef<THREE.Group>(null);

  // Phoneme-driven viseme states
  const targetVisemeRef = useRef<VisemeConfig>(VISEME_CONFIGS.silence);
  const currentVisemeRef = useRef<VisemeConfig>({ ...VISEME_CONFIGS.silence });
  const emphasisTimerRef = useRef<number>(0);
  const speechIntensityRef = useRef<number>(0);

  // Natural human gaze micro-saccades
  const saccadeGazeRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const nextSaccadeTimeRef = useRef<number>(Date.now() + 2000);

  const isSpeakingRef = useRef(false);

  // Direct Microphone Voice Input
  const [isListeningMic, setIsListeningMic] = useState(false);
  const [micTranscript, setMicTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef<string>('');

  const toggleMicListening = () => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      alert("La reconnaissance vocale n'est pas supportée sur ce navigateur. Veuillez utiliser Google Chrome ou Edge.");
      return;
    }

    if (isListeningMic) {
      try {
        recognitionRef.current?.stop();
      } catch (_) {}
      setIsListeningMic(false);
    } else {
      try {
        const rec = new SpeechRec();
        rec.continuous = false;
        rec.interimResults = true;
        rec.lang = 'fr-FR';

        rec.onstart = () => {
          setIsListeningMic(true);
          setMicTranscript('');
          transcriptRef.current = '';
        };

        rec.onresult = (event: any) => {
          let current = '';
          for (let i = 0; i < event.results.length; i++) {
            current += event.results[i][0].transcript;
          }
          transcriptRef.current = current;
          setMicTranscript(current);
        };

        rec.onerror = (event: any) => {
          console.warn("Speech recognition error:", event.error);
          setIsListeningMic(false);
        };

        rec.onend = () => {
          setIsListeningMic(false);
          const finalTrimmed = transcriptRef.current.trim();
          if (finalTrimmed) {
            window.dispatchEvent(new CustomEvent('worldpilot_apply_voice_instruction', { detail: finalTrimmed }));
            speakAgentDialogue(`Ordre reçu : « ${finalTrimmed} ».`);
          }
        };

        recognitionRef.current = rec;
        rec.start();
      } catch (err) {
        console.warn("Could not start speech recognition:", err);
        setIsListeningMic(false);
      }
    }
  };

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.abort();
      } catch (_) {}
    };
  }, []);

  useEffect(() => {
    const handleSpeechState = (e: any) => {
      isSpeakingRef.current = !!e.detail?.isSpeaking;
      if (!isSpeakingRef.current) {
        targetVisemeRef.current = VISEME_CONFIGS.silence;
      }
    };
    const handlePhoneme = (e: any) => {
      const detail: SpeechPhonemeDetail = e.detail;
      if (detail?.viseme && VISEME_CONFIGS[detail.viseme]) {
        targetVisemeRef.current = VISEME_CONFIGS[detail.viseme];
        if (detail.isEmphasis) {
          emphasisTimerRef.current = 0.55;
        }
      }
    };

    window.addEventListener('worldpilot_agent_speech_state', handleSpeechState);
    window.addEventListener('worldpilot_agent_phoneme', handlePhoneme);
    return () => {
      window.removeEventListener('worldpilot_agent_speech_state', handleSpeechState);
      window.removeEventListener('worldpilot_agent_phoneme', handlePhoneme);
    };
  }, []);

  // Blinking cycle timers
  const nextBlinkTime = useRef<number>(Date.now() + 2500);
  const isBlinking = useRef<boolean>(false);
  const blinkStartTime = useRef<number>(0);

  // Micro-gesture timers: welcome wave, affirmative nod
  const welcomeUntilRef = useRef<number>(3.5);
  const nodUntilRef = useRef<number>(0);
  const prevStepIndexRef = useRef<number>(activeQuest?.currentStepIndex ?? 0);
  const prevQuestIdRef = useRef<string | null>(activeQuest?.id ?? null);

  // When quest changes, re-trigger welcome wave
  useEffect(() => {
    if (activeQuest?.id !== prevQuestIdRef.current) {
      prevQuestIdRef.current = activeQuest?.id ?? null;
      welcomeUntilRef.current = 3.5;
    }
  }, [activeQuest?.id]);

  // When step advances, trigger affirmative nod
  useEffect(() => {
    const curIdx = activeQuest?.currentStepIndex ?? 0;
    if (curIdx > prevStepIndexRef.current) {
      nodUntilRef.current = 1.8;
    }
    prevStepIndexRef.current = curIdx;
  }, [activeQuest?.currentStepIndex]);

  // Auto vocalization when step changes if speech enabled
  useEffect(() => {
    if (!isAgentSpeechEnabled || !currentStep) return;
    const speech = getSpeechDialogue(currentStep.title, currentStep.description, persona.theme);
    speakAgentDialogue(speech);
  }, [currentStep?.id, isAgentSpeechEnabled, currentStep, persona.theme]);

  // Auto vocalization when quest is completed
  useEffect(() => {
    if (!isAgentSpeechEnabled || !isQuestCompleted) return;
    const speech = persona.theme === 'chef'
      ? `Félicitations ! La recette est un succès total. Les arômes sont sublimes !`
      : `Excellente exécution ! La mission est un succès complet.`;
    speakAgentDialogue(speech);
  }, [isQuestCompleted, isAgentSpeechEnabled, persona.theme]);

  // Reset hint view when step changes
  useEffect(() => {
    setShowHint(false);
  }, [currentStep?.id]);

  useFrame(({ clock }, delta) => {
    if (!agentRef.current) return;
    const t = clock.getElapsedTime();

    // Decrement micro-gesture timers
    welcomeUntilRef.current = Math.max(0, welcomeUntilRef.current - delta);
    nodUntilRef.current = Math.max(0, nodUntilRef.current - delta);
    emphasisTimerRef.current = Math.max(0, emphasisTimerRef.current - delta);

    const speakingNow = isSpeakingRef.current;
    if (speakingNow) {
      speechIntensityRef.current = THREE.MathUtils.lerp(speechIntensityRef.current, 1.0, 0.18);
    } else {
      speechIntensityRef.current = THREE.MathUtils.lerp(speechIntensityRef.current, 0, 0.12);
    }

    // 1. Idle breathing, affirmative step nod bounce, or celebration bounce
    if (isQuestCompleted) {
      agentRef.current.position.y = THREE.MathUtils.lerp(
        agentRef.current.position.y,
        agentBasePos.y + Math.abs(Math.sin(t * 3.5)) * 0.035,
        0.15
      );
    } else if (nodUntilRef.current > 0) {
      // Cheerful approval bounce
      agentRef.current.position.y = THREE.MathUtils.lerp(
        agentRef.current.position.y,
        agentBasePos.y + Math.abs(Math.sin((1.8 - nodUntilRef.current) * 10)) * 0.025,
        0.18
      );
    } else {
      agentRef.current.position.y = THREE.MathUtils.lerp(
        agentRef.current.position.y,
        agentBasePos.y + Math.sin(t * 2.5) * 0.015,
        0.1
      );
    }

    // Dynamic horizontal clearance translation: Victoria steps smoothly aside to clear placed boards and furniture
    agentRef.current.position.x = THREE.MathUtils.lerp(agentRef.current.position.x, agentBasePos.x, 0.08);
    agentRef.current.position.z = THREE.MathUtils.lerp(agentRef.current.position.z, agentBasePos.z, 0.08);

    // 2. Dynamic orientation: Face slightly towards the table and user, standing gracefully at the flank
    let aimPoint = targetPos;
    if (!aimPoint) {
      aimPoint = new THREE.Vector3(0, 0.85, 0); // Center of work surface
    }

    if (aimPoint && agentRef.current) {
      const dx = aimPoint.x - agentRef.current.position.x;
      const dz = aimPoint.z - agentRef.current.position.z;
      // Blend 70% toward target and 30% toward camera so the avatar is angled welcomingly towards user
      const camDx = camera.position.x - agentRef.current.position.x;
      const camDz = camera.position.z - agentRef.current.position.z;
      const blendedDx = dx * 0.7 + camDx * 0.3;
      const blendedDz = dz * 0.7 + camDz * 0.3;
      const targetRotationY = Math.atan2(blendedDx, blendedDz);

      // Smooth spherical interpolation of rotation
      let diff = targetRotationY - agentRef.current.rotation.y;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      agentRef.current.rotation.y += diff * 0.05;
    }

    // 3. Right arm & articulated fingers kinematics
    if (rightArmRef.current) {
      if (isQuestCompleted) {
        // Celebratory wave gesture
        const wavePitch = -Math.PI * 0.65 + Math.sin(t * 7) * 0.12;
        const waveRoll = -0.4 + Math.cos(t * 7) * 0.15;
        rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, wavePitch, 0.1);
        rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, waveRoll, 0.1);
        if (rightIndexGroupRef.current) rightIndexGroupRef.current.rotation.x = THREE.MathUtils.lerp(rightIndexGroupRef.current.rotation.x, 0.25, 0.1);
        if (rightMiddleGroupRef.current) rightMiddleGroupRef.current.rotation.x = THREE.MathUtils.lerp(rightMiddleGroupRef.current.rotation.x, 0.35, 0.1);
        if (rightOtherFingersGroupRef.current) rightOtherFingersGroupRef.current.rotation.x = THREE.MathUtils.lerp(rightOtherFingersGroupRef.current.rotation.x, 0.45, 0.1);
      } else if (welcomeUntilRef.current > 0) {
        // Welcoming greeting wave on scene load
        const greetPitch = -Math.PI * 0.62 + Math.sin(t * 8) * 0.14;
        const greetRoll = -0.42 + Math.cos(t * 8) * 0.18;
        rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, greetPitch, 0.12);
        rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, greetRoll, 0.12);
        if (rightHandRef.current) rightHandRef.current.rotation.z = THREE.MathUtils.lerp(rightHandRef.current.rotation.z, -0.3, 0.1);
        if (rightIndexGroupRef.current) rightIndexGroupRef.current.rotation.x = THREE.MathUtils.lerp(rightIndexGroupRef.current.rotation.x, 0.2, 0.1);
        if (rightMiddleGroupRef.current) rightMiddleGroupRef.current.rotation.x = THREE.MathUtils.lerp(rightMiddleGroupRef.current.rotation.x, 0.25, 0.1);
        if (rightOtherFingersGroupRef.current) rightOtherFingersGroupRef.current.rotation.x = THREE.MathUtils.lerp(rightOtherFingersGroupRef.current.rotation.x, 0.3, 0.1);
      } else if (targetPos) {
        // Raise arm to point towards target
        const targetPitch = -Math.PI / 2.8 + Math.sin(t * 3.5) * 0.05;
        rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, targetPitch, 0.08);
        rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, -0.35, 0.08);
        if (rightHandRef.current) rightHandRef.current.rotation.z = THREE.MathUtils.lerp(rightHandRef.current.rotation.z, 0, 0.08);
        // Point pose: index extended forward, thumb tucked, other fingers curled
        if (rightIndexGroupRef.current) rightIndexGroupRef.current.rotation.x = THREE.MathUtils.lerp(rightIndexGroupRef.current.rotation.x, 0.15, 0.15);
        if (rightThumbGroupRef.current) rightThumbGroupRef.current.rotation.x = THREE.MathUtils.lerp(rightThumbGroupRef.current.rotation.x, 0.5, 0.15);
        if (rightMiddleGroupRef.current) rightMiddleGroupRef.current.rotation.x = THREE.MathUtils.lerp(rightMiddleGroupRef.current.rotation.x, 1.25, 0.15);
        if (rightOtherFingersGroupRef.current) rightOtherFingersGroupRef.current.rotation.x = THREE.MathUtils.lerp(rightOtherFingersGroupRef.current.rotation.x, 1.35, 0.15);
      } else if (speakingNow) {
        // Conversational co-speech gestures: alternating open palm, precision pinch, and cadence beat
        const cycle = Math.sin(t * 0.9);
        const beatOffset = emphasisTimerRef.current > 0 ? Math.sin(t * 12) * 0.08 : 0;

        if (cycle > 0.15) {
          // A. Open palm explanation (paume ouverte supination)
          const talkRightPitch = -0.34 + Math.cos(t * 3.8) * 0.10 + beatOffset;
          const talkRightRoll = -0.26 + Math.sin(t * 3.6) * 0.08;
          rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, talkRightPitch, 0.1);
          rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, talkRightRoll, 0.1);
          if (rightHandRef.current) rightHandRef.current.rotation.z = THREE.MathUtils.lerp(rightHandRef.current.rotation.z, -0.45, 0.1);
          if (rightIndexGroupRef.current) rightIndexGroupRef.current.rotation.x = THREE.MathUtils.lerp(rightIndexGroupRef.current.rotation.x, 0.30, 0.12);
          if (rightThumbGroupRef.current) rightThumbGroupRef.current.rotation.z = THREE.MathUtils.lerp(rightThumbGroupRef.current.rotation.z, -0.35, 0.12);
          if (rightMiddleGroupRef.current) rightMiddleGroupRef.current.rotation.x = THREE.MathUtils.lerp(rightMiddleGroupRef.current.rotation.x, 0.38, 0.12);
          if (rightOtherFingersGroupRef.current) rightOtherFingersGroupRef.current.rotation.x = THREE.MathUtils.lerp(rightOtherFingersGroupRef.current.rotation.x, 0.48, 0.12);
        } else {
          // B. Precision pinch nuance gesture (pince index-pouce)
          const talkRightPitch = -0.40 + Math.sin(t * 4.0) * 0.08 + beatOffset;
          const talkRightRoll = -0.18 + Math.cos(t * 3.2) * 0.06;
          rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, talkRightPitch, 0.1);
          rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, talkRightRoll, 0.1);
          if (rightHandRef.current) rightHandRef.current.rotation.z = THREE.MathUtils.lerp(rightHandRef.current.rotation.z, 0.15, 0.1);
          if (rightIndexGroupRef.current) rightIndexGroupRef.current.rotation.x = THREE.MathUtils.lerp(rightIndexGroupRef.current.rotation.x, 0.72, 0.15);
          if (rightThumbGroupRef.current) rightThumbGroupRef.current.rotation.x = THREE.MathUtils.lerp(rightThumbGroupRef.current.rotation.x, 0.52, 0.15);
          if (rightMiddleGroupRef.current) rightMiddleGroupRef.current.rotation.x = THREE.MathUtils.lerp(rightMiddleGroupRef.current.rotation.x, 0.65, 0.12);
          if (rightOtherFingersGroupRef.current) rightOtherFingersGroupRef.current.rotation.x = THREE.MathUtils.lerp(rightOtherFingersGroupRef.current.rotation.x, 0.95, 0.12);
        }
      } else {
        // Relaxed natural idle arm with subtle breathing
        const idlePitch = Math.sin(t * 2.2) * 0.04;
        rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, idlePitch, 0.08);
        rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, -0.08, 0.08);
        if (rightHandRef.current) rightHandRef.current.rotation.z = THREE.MathUtils.lerp(rightHandRef.current.rotation.z, 0, 0.08);
        if (rightIndexGroupRef.current) rightIndexGroupRef.current.rotation.x = THREE.MathUtils.lerp(rightIndexGroupRef.current.rotation.x, 0.55, 0.08);
        if (rightThumbGroupRef.current) rightThumbGroupRef.current.rotation.x = THREE.MathUtils.lerp(rightThumbGroupRef.current.rotation.x, 0.35, 0.08);
        if (rightMiddleGroupRef.current) rightMiddleGroupRef.current.rotation.x = THREE.MathUtils.lerp(rightMiddleGroupRef.current.rotation.x, 0.65, 0.08);
        if (rightOtherFingersGroupRef.current) rightOtherFingersGroupRef.current.rotation.x = THREE.MathUtils.lerp(rightOtherFingersGroupRef.current.rotation.x, 0.75, 0.08);
      }
    }

    // 4. Left arm kinematics: Co-speech explanation gesture or relaxed posture
    if (leftArmRef.current) {
      if (welcomeUntilRef.current > 0) {
        // Welcoming open posture
        leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, -0.18, 0.08);
        leftArmRef.current.rotation.z = THREE.MathUtils.lerp(leftArmRef.current.rotation.z, 0.18, 0.08);
        if (leftFingersGroupRef.current) leftFingersGroupRef.current.rotation.x = THREE.MathUtils.lerp(leftFingersGroupRef.current.rotation.x, 0.25, 0.08);
      } else if (speakingNow) {
        // Expressive open-hand explanation gesture during speech
        const talkPitch = -0.38 + Math.sin(t * 4.2) * 0.14;
        const talkRoll = 0.28 + Math.cos(t * 3.6) * 0.09;
        leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, talkPitch, 0.1);
        leftArmRef.current.rotation.z = THREE.MathUtils.lerp(leftArmRef.current.rotation.z, talkRoll, 0.1);
        if (leftFingersGroupRef.current) leftFingersGroupRef.current.rotation.x = THREE.MathUtils.lerp(leftFingersGroupRef.current.rotation.x, 0.38, 0.1);
      } else {
        // Relaxed natural breathing posture
        const idlePitch = Math.sin(t * 2.0) * 0.035;
        leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, idlePitch, 0.08);
        leftArmRef.current.rotation.z = THREE.MathUtils.lerp(leftArmRef.current.rotation.z, 0.08, 0.08);
        if (leftFingersGroupRef.current) leftFingersGroupRef.current.rotation.x = THREE.MathUtils.lerp(leftFingersGroupRef.current.rotation.x, 0.55, 0.08);
      }
    }

    // 5. Dynamic head gaze tracking towards user camera & affirmative nod + micro-saccades
    const nowMs = Date.now();
    if (nowMs >= nextSaccadeTimeRef.current) {
      saccadeGazeRef.current = {
        x: (Math.random() - 0.5) * 0.030,
        y: (Math.random() - 0.5) * 0.020
      };
      nextSaccadeTimeRef.current = nowMs + 1800 + Math.random() * 2400;
    }

    if (headRef.current && agentRef.current) {
      const headWorldY = agentRef.current.position.y + 1.62;
      const camDy = camera.position.y - headWorldY;
      const camDistXZ = Math.hypot(
        camera.position.x - agentRef.current.position.x,
        camera.position.z - agentRef.current.position.z
      );
      const targetPitch = Math.atan2(camDy, Math.max(camDistXZ, 0.5));
      const clampedPitch = -THREE.MathUtils.clamp(targetPitch, -0.38, 0.35);

      // Add affirmative nod when step is completed
      const nodOffset = nodUntilRef.current > 0
        ? Math.sin((1.8 - nodUntilRef.current) * 11) * 0.16
        : 0;

      // Add gentle welcoming head tilt
      const tiltOffset = welcomeUntilRef.current > 0
        ? Math.sin(t * 3.5) * 0.06
        : 0;

      // Add speech rhythmic micro-cadence & emphasis
      const speechNod = speakingNow ? Math.sin(t * 6.5) * 0.03 : 0;
      const emphasisNod = emphasisTimerRef.current > 0 ? 0.05 : 0;

      headRef.current.rotation.x = THREE.MathUtils.lerp(
        headRef.current.rotation.x,
        clampedPitch + Math.sin(t * 1.8) * 0.02 + nodOffset + speechNod + emphasisNod + saccadeGazeRef.current.y,
        0.08
      );
      headRef.current.rotation.y = THREE.MathUtils.lerp(
        headRef.current.rotation.y,
        saccadeGazeRef.current.x,
        0.08
      );
      headRef.current.rotation.z = THREE.MathUtils.lerp(
        headRef.current.rotation.z,
        tiltOffset,
        0.08
      );
    }

    // 6. Natural Eye Blinking Animation
    if (!isBlinking.current && nowMs >= nextBlinkTime.current) {
      isBlinking.current = true;
      blinkStartTime.current = nowMs;
    }

    let eyeScaleY = 1.0;
    if (isBlinking.current) {
      const elapsed = (nowMs - blinkStartTime.current) / 110; // 110ms blink
      if (elapsed >= 1) {
        isBlinking.current = false;
        nextBlinkTime.current = nowMs + 2800 + Math.random() * 2400;
        eyeScaleY = 1.0;
      } else {
        // Quick closure and snap open
        eyeScaleY = Math.max(0.08, Math.abs(elapsed - 0.5) * 2);
      }
    }
    if (leftEyeRef.current) leftEyeRef.current.scale.y = eyeScaleY;
    if (rightEyeRef.current) rightEyeRef.current.scale.y = eyeScaleY;

    // 7. Advanced Procedural Viseme & Lip-Sync Dynamics
    if (speakingNow) {
      // Harmonic syllable-vowel carrier wave
      const oscSyllable = Math.sin(t * 22) * 0.5 + 0.5;
      const oscVowel = Math.cos(t * 8.5) * 0.3 + 0.7;
      const harmonicAmplitude = oscSyllable * oscVowel;

      const target = targetVisemeRef.current;
      const blendX = THREE.MathUtils.lerp(1.0, target.scaleX, 0.75) + Math.sin(t * 11) * 0.08;
      const blendY = THREE.MathUtils.lerp(1.0, target.scaleY, 0.85) * (0.65 + harmonicAmplitude * 0.45);
      const jawDelta = target.jawDrop * (0.70 + harmonicAmplitude * 0.35);

      currentVisemeRef.current.scaleX = THREE.MathUtils.lerp(currentVisemeRef.current.scaleX, blendX, 0.32);
      currentVisemeRef.current.scaleY = THREE.MathUtils.lerp(currentVisemeRef.current.scaleY, blendY, 0.34);
      currentVisemeRef.current.jawDrop = THREE.MathUtils.lerp(currentVisemeRef.current.jawDrop, jawDelta, 0.34);

      if (mouthRef.current) {
        mouthRef.current.scale.y = currentVisemeRef.current.scaleY;
        mouthRef.current.scale.x = currentVisemeRef.current.scaleX;
        const protrude = target.lipSpread < 0 ? 0.003 : 0;
        mouthRef.current.position.z = THREE.MathUtils.lerp(mouthRef.current.position.z, 0.108 + protrude, 0.2);
      }
      if (jawRef.current) {
        const baseJawY = isFemale ? -0.088 : -0.095;
        jawRef.current.position.y = THREE.MathUtils.lerp(jawRef.current.position.y, baseJawY - currentVisemeRef.current.jawDrop, 0.34);
      }
    } else {
      currentVisemeRef.current.scaleX = THREE.MathUtils.lerp(currentVisemeRef.current.scaleX, 1.0, 0.16);
      currentVisemeRef.current.scaleY = THREE.MathUtils.lerp(currentVisemeRef.current.scaleY, 1.0, 0.16);
      currentVisemeRef.current.jawDrop = THREE.MathUtils.lerp(currentVisemeRef.current.jawDrop, 0, 0.16);

      if (mouthRef.current) {
        mouthRef.current.scale.y = currentVisemeRef.current.scaleY;
        mouthRef.current.scale.x = currentVisemeRef.current.scaleX;
        mouthRef.current.position.z = THREE.MathUtils.lerp(mouthRef.current.position.z, 0.108, 0.16);
      }
      if (jawRef.current) {
        const baseJawY = isFemale ? -0.088 : -0.095;
        jawRef.current.position.y = THREE.MathUtils.lerp(jawRef.current.position.y, baseJawY, 0.16);
      }
    }

    // 8. Eyebrows conversational micro-elevation & emphasis
    if (eyebrowsRef.current) {
      const emphasisOffset = emphasisTimerRef.current > 0 ? 0.008 : 0;
      const targetBrowY = speakingNow ? 0.004 + emphasisOffset : 0.0;
      eyebrowsRef.current.position.y = THREE.MathUtils.lerp(eyebrowsRef.current.position.y, targetBrowY, 0.12);
    }

    // 9. Sonic Aura Halo pulse
    if (sonicHaloRef.current) {
      const intensity = speechIntensityRef.current;
      const pulse = Math.sin(t * 14) * 0.03;
      sonicHaloRef.current.scale.setScalar(1.0 + intensity * 0.12 + pulse * intensity);
      const meshes = sonicHaloRef.current.children as THREE.Mesh[];
      if (meshes[0]?.material) {
        (meshes[0].material as THREE.Material).opacity = intensity * (0.35 + Math.sin(t * 12) * 0.15);
      }
      if (meshes[1]?.material) {
        (meshes[1].material as THREE.Material).opacity = intensity * 0.45;
      }
    }
  });

  if (!isSpatialAgentActive || Object.keys(entities || {}).length === 0) return null;

  const gameplayDialogue = gameplay?.gameMode === 'target_range'
    ? (gameplay.gameStatus === 'victory'
        ? `🎉 Victoire éclatante ! Toutes les cibles du stand de tir ont été abattues (+${gameplay.score} pts) !`
        : gameplay.gameStatus === 'game_over'
        ? `💀 Temps écoulé ! Appuyez sur le bouton rouge de la console pour relancer une manche de 30 secondes.`
        : `🎯 Stand de Tir actif ! Visez et abattez les 4 cibles d'arcade avant la fin des ${gameplay.timer ?? 30} secondes !`)
    : null;

  const baseDialogue = gameplayDialogue || (isQuestCompleted
    ? (persona.theme === 'chef'
        ? `🎉 Bravo Chef ! La recette « ${activeQuest?.title || 'en cours'} » est brillamment terminée. Tous les convives vont se régaler !`
        : persona.theme === 'guide'
        ? `🎉 Félicitations ! Vous avez exploré la scène FLE « ${activeQuest?.title || 'en cours'} » et validé votre compréhension linguistique avec succès.`
        : `🎉 Mission accomplie avec succès ! Toutes les étapes de la procédure ont été validées sans la moindre erreur.`)
    : currentStep 
    ? getSpeechDialogue(currentStep.title, currentStep.description, persona.theme)
    : persona.greeting);
  const currentDialogue = themeComment || baseDialogue;

  return (
    <group 
      ref={agentRef} 
      position={[agentBasePos.x, agentBasePos.y, agentBasePos.z]}
      onClick={(e) => {
        e.stopPropagation();
        setBubbleOpen(true);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto';
      }}
    >
      {/* 1. Socle d'ancrage spatial & anneau d'énergie */}
      <mesh position={[0, 0.015, 0]} receiveShadow>
        <cylinderGeometry args={[0.36, 0.40, 0.03, 32]} />
        <meshStandardMaterial color="#0f172a" roughness={0.35} metalness={0.7} />
      </mesh>
      <mesh position={[0, 0.032, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.32, 0.35, 32]} />
        <meshStandardMaterial color={persona.accentColor || persona.color} emissive={persona.color} emissiveIntensity={0.6} />
      </mesh>
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.38, 32]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.35} />
      </mesh>

      {/* 2. Chaussures / Sneakers de créateur sculptées */}
      {[-0.12, 0.12].map((x, xi) => (
        <group key={xi} position={[x, 0.03, 0.02]}>
          {/* Semelle extérieure épaisse sculptée */}
          <RoundedBox args={[0.084, 0.030, 0.22]} radius={0.008} smoothness={4} position={[0, 0, 0]}>
            <meshStandardMaterial color="#f8fafc" roughness={0.35} />
          </RoundedBox>
          {/* Empeigne en cuir / knit texturé */}
          <RoundedBox args={[0.078, 0.055, 0.19]} radius={0.016} smoothness={4} position={[0, 0.035, -0.01]}>
            <meshStandardMaterial
              color={persona.theme === 'luxury' ? '#1e293b' : persona.theme === 'chef' ? '#334155' : '#0f172a'}
              roughness={0.4}
            />
          </RoundedBox>
          {/* Languette & lacets stylisés */}
          <mesh position={[0, 0.058, 0.03]} rotation={[-0.25, 0, 0]}>
            <boxGeometry args={[0.045, 0.02, 0.08]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.5} />
          </mesh>
        </group>
      ))}

      {/* 3. Jambes & Pantalon ajusté avec coupe anatomique */}
      {[-0.12, 0.12].map((x, xi) => (
        <group key={xi}>
          {/* Mollet / Bas de jambe fuselé */}
          <mesh position={[x, 0.28, 0]} castShadow>
            <cylinderGeometry args={[0.052, 0.046, 0.38, 16]} />
            <meshStandardMaterial
              color={persona.theme === 'chef' ? '#1e293b' : persona.theme === 'luxury' ? '#0f172a' : '#1e293b'}
              roughness={0.65}
            />
          </mesh>
          {/* Articulation du genou sculptée */}
          <mesh position={[x, 0.48, 0.008]}>
            <sphereGeometry args={[0.053, 16, 16]} />
            <meshStandardMaterial
              color={persona.theme === 'chef' ? '#1e293b' : persona.theme === 'luxury' ? '#0f172a' : '#1e293b'}
              roughness={0.65}
            />
          </mesh>
          {/* Cuisse avec galbe naturel */}
          <mesh position={[x, 0.70, 0.005]} castShadow>
            <cylinderGeometry args={[0.068, 0.056, 0.42, 16]} />
            <meshStandardMaterial
              color={persona.theme === 'chef' ? '#1e293b' : persona.theme === 'luxury' ? '#0f172a' : '#1e293b'}
              roughness={0.65}
            />
          </mesh>
        </group>
      ))}

      {/* 4. Bassin & Ceinture en cuir avec boucle polie */}
      <group position={[0, 0.94, 0]}>
        <RoundedBox 
          args={isFemale ? [0.32, 0.13, 0.19] : [0.29, 0.12, 0.18]} 
          radius={0.04} 
          smoothness={4} 
          castShadow
        >
          <meshStandardMaterial
            color={persona.theme === 'chef' ? '#1e293b' : persona.theme === 'luxury' ? '#0f172a' : '#1e293b'}
            roughness={0.65}
          />
        </RoundedBox>
        {/* Ceinture en cuir noir */}
        <mesh position={[0, 0.03, 0]}>
          <boxGeometry args={[isFemale ? 0.325 : 0.295, 0.032, isFemale ? 0.195 : 0.185]} />
          <meshStandardMaterial color="#09090b" roughness={0.3} />
        </mesh>
        {/* Boucle métallique dorée ou argentée */}
        <mesh position={[0, 0.03, isFemale ? 0.10 : 0.095]}>
          <boxGeometry args={[0.036, 0.024, 0.008]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.92} roughness={0.15} />
        </mesh>
      </group>

      {/* 5. Buste / Torso Taillé selon Morphologie */}
      <group position={[0, 1.18, 0]}>
        {/* Abdomen / Taille sablier cintrée pour femme */}
        <RoundedBox 
          args={isFemale ? [0.22, 0.20, 0.16] : [0.31, 0.20, 0.18]} 
          radius={0.04} 
          smoothness={4} 
          position={[0, -0.08, 0]} 
          castShadow
        >
          <meshStandardMaterial
            color={
              persona.theme === 'chef' ? '#ffffff' :
              persona.theme === 'luxury' ? '#172554' :
              persona.theme === 'engineer' ? '#0e7490' :
              persona.theme === 'naturalist' ? '#2d4a22' :
              persona.theme === 'mechanic' ? '#c2410c' :
              persona.theme === 'scientist' ? '#f0fdfa' :
              persona.theme === 'guide' ? '#78350f' :
              '#1e293b'
            }
            roughness={persona.theme === 'luxury' ? 0.35 : 0.55}
          />
        </RoundedBox>

        {/* Torse / Poitrine & Carrure d'épaules */}
        <RoundedBox 
          args={isFemale ? [0.28, 0.22, 0.18] : [0.36, 0.24, 0.20]} 
          radius={0.05} 
          smoothness={6} 
          position={[0, 0.11, 0]} 
          castShadow
        >
          <meshStandardMaterial
            color={
              persona.theme === 'custom' ? (persona.attire?.jacketColor || persona.color) :
              persona.theme === 'chef' ? '#ffffff' :
              persona.theme === 'luxury' ? '#172554' :
              persona.theme === 'engineer' ? '#0e7490' :
              persona.theme === 'naturalist' ? '#2d4a22' :
              persona.theme === 'mechanic' ? '#c2410c' :
              persona.theme === 'scientist' ? '#f0fdfa' :
              persona.theme === 'guide' ? '#78350f' :
              '#1e293b'
            }
            roughness={persona.theme === 'luxury' ? 0.35 : 0.55}
          />
        </RoundedBox>

        {/* Décolleté & Galbe naturel de buste féminin sculpté */}
        {isFemale && (
          <group position={[0, 0.09, 0.082]}>
            {[-0.062, 0.062].map((bx, bi) => (
              <mesh key={bi} position={[bx, 0, 0]} rotation={[-0.12, bi === 0 ? 0.06 : -0.06, 0]}>
                <sphereGeometry args={[0.060, 16, 16]} />
                <meshStandardMaterial
                  color={
                    persona.theme === 'custom' ? (persona.attire?.jacketColor || persona.color) :
                    persona.theme === 'chef' ? '#ffffff' :
                    persona.theme === 'luxury' ? '#172554' :
                    persona.theme === 'engineer' ? '#0e7490' :
                    persona.theme === 'naturalist' ? '#2d4a22' :
                    persona.theme === 'mechanic' ? '#c2410c' :
                    persona.theme === 'scientist' ? '#f0fdfa' :
                    persona.theme === 'guide' ? '#78350f' :
                    '#1e293b'
                  }
                  roughness={persona.theme === 'luxury' ? 0.35 : 0.55}
                />
              </mesh>
            ))}
          </group>
        )}

        {/* Détails Vestimentaires Spécifiques à la Persona */}
        {/* A. Chef : Veste croisée & tablier */}
        {persona.theme === 'chef' && (
          <group position={[0, 0, 0.105]}>
            {/* Liseré tricolore du col */}
            <mesh position={[0, 0.24, 0]}>
              <boxGeometry args={[0.18, 0.015, 0.01]} />
              <meshStandardMaterial color="#dc2626" />
            </mesh>
            {/* Double rangée de boutons noirs de maître cuisinier */}
            {[-0.055, 0.055].map((bx, bxi) =>
              [-0.08, -0.01, 0.06, 0.13].map((by, byi) => (
                <mesh key={`${bxi}_${byi}`} position={[bx, by, 0]} rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.010, 0.010, 0.008, 12]} />
                  <meshStandardMaterial color="#0f172a" roughness={0.4} />
                </mesh>
              ))
            )}
            {/* Tablier noué avec retombée */}
            <mesh position={[0, -0.18, 0]}>
              <boxGeometry args={[isFemale ? 0.26 : 0.30, 0.16, 0.012]} />
              <meshStandardMaterial color="#334155" roughness={0.7} />
            </mesh>
          </group>
        )}

        {/* B. Conseillère Maison Luxe : Blazer bleu nuit, revers en soie, broche dorée monogramme & chemisier ivoire */}
        {persona.theme === 'luxury' && (
          <group position={[0, 0, 0.105]}>
            {/* Chemisier de soie ivoire à col V */}
            <mesh position={[0, 0.14, -0.01]}>
              <boxGeometry args={[0.10, 0.14, 0.01]} />
              <meshStandardMaterial color="#fffbeb" roughness={0.3} />
            </mesh>
            {/* Revers crantés en satin de soie */}
            {[-0.07, 0.07].map((lx, li) => (
              <mesh key={li} position={[lx, 0.09, 0]} rotation={[0, 0, li === 0 ? 0.25 : -0.25]}>
                <boxGeometry args={[0.045, 0.18, 0.012]} />
                <meshStandardMaterial color="#1e3a8a" roughness={0.25} metalness={0.15} />
              </mesh>
            ))}
            {/* Broche dorée fleur monogramme haute joaillerie sur le revers gauche */}
            <mesh position={[-0.09, 0.15, 0.01]} rotation={[0, 0, Math.PI / 4]}>
              <cylinderGeometry args={[0.012, 0.012, 0.005, 4]} />
              <meshStandardMaterial color="#facc15" metalness={0.95} roughness={0.15} />
            </mesh>
          </group>
        )}

        {/* C. Ingénieure Nova : Écusson de grade holographique & sangles techniques */}
        {persona.theme === 'engineer' && (
          <group position={[0, 0, 0.105]}>
            <mesh position={[-0.08, 0.14, 0]}>
              <planeGeometry args={[0.07, 0.05]} />
              <meshStandardMaterial color="#22c55e" emissive="#16a34a" emissiveIntensity={0.8} />
            </mesh>
            <mesh position={[0, 0.02, 0]}>
              <boxGeometry args={[0.26, 0.02, 0.01]} />
              <meshStandardMaterial color="#f59e0b" roughness={0.4} />
            </mesh>
          </group>
        )}

        {/* D. Guide Naturaliste Sylvain : Gilet d'exploration multipoches & baudrier */}
        {persona.theme === 'naturalist' && (
          <group position={[0, 0, 0.105]}>
            {/* Chemise safari couleur sable */}
            <mesh position={[0, 0.16, -0.01]}>
              <boxGeometry args={[0.12, 0.14, 0.01]} />
              <meshStandardMaterial color="#fef3c7" roughness={0.7} />
            </mesh>
            {/* Poches poitrine à soufflet de ranger forestier */}
            {[-0.07, 0.07].map((px, pi) => (
              <mesh key={pi} position={[px, 0.06, 0.01]}>
                <boxGeometry args={[0.065, 0.075, 0.015]} />
                <meshStandardMaterial color="#3f6212" roughness={0.65} />
              </mesh>
            ))}
            {/* Baudrier en cuir pour boussole et carnet de terrain */}
            <mesh position={[0, 0.02, 0.008]} rotation={[0, 0, 0.42]}>
              <boxGeometry args={[0.028, 0.44, 0.008]} />
              <meshStandardMaterial color="#78350f" roughness={0.5} />
            </mesh>
            {/* Écusson forestier */}
            <mesh position={[-0.075, 0.16, 0.012]}>
              <cylinderGeometry args={[0.018, 0.018, 0.005, 16]} />
              <meshStandardMaterial color="#15803d" roughness={0.4} />
            </mesh>
          </group>
        )}

        {/* E. Maître Mécanicien Marc : Veste d'atelier & poches d'outillage */}
        {persona.theme === 'mechanic' && (
          <group position={[0, 0, 0.105]}>
            {[-0.065, 0.065].map((mx, mi) => (
              <mesh key={mi} position={[mx, 0.06, 0.01]}>
                <boxGeometry args={[0.06, 0.07, 0.014]} />
                <meshStandardMaterial color="#9a3412" roughness={0.6} />
              </mesh>
            ))}
            <mesh position={[-0.065, 0.11, 0.015]}>
              <cylinderGeometry args={[0.003, 0.003, 0.04, 8]} />
              <meshStandardMaterial color="#e2e8f0" metalness={0.8} />
            </mesh>
          </group>
        )}

        {/* F. Chercheur Dr. Aris : Blouse blanche & badge de laboratoire */}
        {persona.theme === 'scientist' && (
          <group position={[0, 0, 0.105]}>
            <mesh position={[0, 0.18, 0]}>
              <boxGeometry args={[0.16, 0.08, 0.01]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.3} />
            </mesh>
            <mesh position={[0.07, 0.12, 0.012]}>
              <boxGeometry args={[0.035, 0.05, 0.004]} />
              <meshStandardMaterial color="#0284c7" emissive="#0284c7" emissiveIntensity={0.4} />
            </mesh>
          </group>
        )}

        {/* G. Accessoires Paramétriques pour Avatar Génératif Custom */}
        {persona.theme === 'custom' && (
          <group position={[0, 0, 0.105]}>
            {/* Stéthoscope médical autour du cou */}
            {persona.attire?.accessoryType === 'stethoscope' && (
              <group position={[0, 0.12, 0]}>
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                  <torusGeometry args={[0.075, 0.007, 8, 24, Math.PI * 1.2]} />
                  <meshStandardMaterial color={persona.attire.accessoryColor || '#0284c7'} metalness={0.7} roughness={0.3} />
                </mesh>
                <mesh position={[0.035, -0.11, 0.02]}>
                  <cylinderGeometry args={[0.014, 0.014, 0.006, 16]} />
                  <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.1} />
                </mesh>
              </group>
            )}

            {/* Ceinture d'outils / Sacoche de terrain */}
            {persona.attire?.accessoryType === 'tool_belt' && (
              <group position={[0, -0.06, 0]}>
                <mesh>
                  <boxGeometry args={[0.34, 0.035, 0.02]} />
                  <meshStandardMaterial color="#78350f" roughness={0.6} />
                </mesh>
                {[-0.09, 0, 0.09].map((bx, bi) => (
                  <mesh key={bi} position={[bx, -0.02, 0.012]}>
                    <boxGeometry args={[0.045, 0.05, 0.02]} />
                    <meshStandardMaterial color="#92400e" roughness={0.5} />
                  </mesh>
                ))}
              </group>
            )}

            {/* Badge officiel / Tour de cou lanyard */}
            {(persona.attire?.accessoryType === 'badge' || persona.attire?.accessoryType === 'lanyard') && (
              <group position={[0, 0.08, 0.01]}>
                <mesh position={[0, 0.08, 0]}>
                  <cylinderGeometry args={[0.003, 0.003, 0.22, 8]} />
                  <meshStandardMaterial color={persona.accentColor || '#38bdf8'} />
                </mesh>
                <mesh position={[0, -0.04, 0.005]}>
                  <boxGeometry args={[0.045, 0.065, 0.004]} />
                  <meshStandardMaterial color="#f8fafc" roughness={0.2} />
                </mesh>
              </group>
            )}
          </group>
        )}

        {/* Col anatomique montant */}
        <mesh position={[0, 0.25, 0]}>
          <cylinderGeometry args={[isFemale ? 0.055 : 0.065, isFemale ? 0.065 : 0.075, 0.08, 16]} />
          <meshStandardMaterial
            color={
              persona.theme === 'custom' ? (persona.attire?.jacketColor || persona.color) :
              persona.theme === 'chef' ? '#ffffff' :
              persona.theme === 'luxury' ? '#172554' :
              persona.theme === 'naturalist' ? '#2d4a22' :
              persona.theme === 'mechanic' ? '#9a3412' :
              persona.theme === 'scientist' ? '#f8fafc' :
              '#1e293b'
            }
          />
        </mesh>
      </group>

      {/* 5. Tête & Visage Expressif Stylisé Réaliste */}
      <group ref={headRef} position={[0, 1.62, 0]}>
        {/* Crâne & Base du visage modelé */}
        <RoundedBox 
          args={isFemale ? [0.20, 0.23, 0.19] : [0.22, 0.25, 0.21]} 
          radius={0.065} 
          smoothness={4} 
          position={[0, 0, 0]} 
          castShadow
        >
          <meshStandardMaterial 
            color={!isFemale && persona.theme === 'assistant' ? '#38bdf8' : '#fed7aa'} 
            roughness={0.42} 
            metalness={!isFemale && persona.theme === 'assistant' ? 0.75 : 0.05}
          />
        </RoundedBox>

        {/* Menton & Mâchoire fuselée articulée */}
        <mesh ref={jawRef} position={[0, isFemale ? -0.088 : -0.095, isFemale ? 0.030 : 0.035]} rotation={[0.35, 0, 0]}>
          <cylinderGeometry args={isFemale ? [0.040, 0.022, 0.045, 16] : [0.055, 0.035, 0.05, 16]} />
          <meshStandardMaterial color={!isFemale && persona.theme === 'assistant' ? '#38bdf8' : '#fed7aa'} roughness={0.45} />
        </mesh>

        {/* Pommettes & blush délicat féminin */}
        {isFemale && (
          <group>
            {[-0.062, 0.062].map((cx, ci) => (
              <mesh key={ci} position={[cx, -0.005, 0.096]}>
                <sphereGeometry args={[0.020, 12, 12]} />
                <meshStandardMaterial color="#fbcfe8" roughness={0.6} transparent opacity={0.65} />
              </mesh>
            ))}
          </group>
        )}

        {/* Oreilles anatomiques & Bijoux / Accessoires de communication */}
        {[-0.105, 0.105].map((ex, ei) => (
          <group key={ei} position={[ex, 0, 0]}>
            <mesh rotation={[0, 0, ex > 0 ? 0.22 : -0.22]}>
              <cylinderGeometry args={[0.020, 0.015, 0.038, 12]} />
              <meshStandardMaterial color={!isFemale && persona.theme === 'assistant' ? '#38bdf8' : '#fed7aa'} roughness={0.45} />
            </mesh>
            {/* Boucle d'oreille perle de nacre ou or fin pour les femmes */}
            {isFemale && (
              <mesh position={[ex > 0 ? 0.006 : -0.006, -0.024, 0]}>
                <sphereGeometry args={[0.0065, 12, 12]} />
                <meshStandardMaterial color={persona.theme === 'luxury' ? '#facc15' : '#fffbeb'} roughness={0.12} metalness={0.85} />
              </mesh>
            )}
            {/* Oreillette communicateur holographique pour Nova (Ingénieure) */}
            {persona.theme === 'engineer' && ex > 0 && (
              <mesh position={[0.008, 0.005, 0.01]}>
                <boxGeometry args={[0.012, 0.028, 0.02]} />
                <meshStandardMaterial color="#0891b2" metalness={0.9} roughness={0.2} emissive="#06b6d4" emissiveIntensity={0.6} />
              </mesh>
            )}
          </group>
        ))}

        {/* Regard Vivant & Expressif : Sclère, Iris coloré, Pupille, Catchlight spéculaire & Cils */}
        {[-0.044, 0.044].map((eyex, eyei) => {
          const irisColor = persona.theme === 'luxury' 
            ? '#2563eb' 
            : persona.theme === 'chef' 
            ? '#92400e' 
            : persona.theme === 'engineer' 
            ? '#059669' 
            : persona.theme === 'naturalist'
            ? '#15803d'
            : persona.theme === 'mechanic'
            ? '#ea580c'
            : persona.theme === 'scientist'
            ? '#0284c7'
            : '#0284c7';
          return (
            <group key={eyei} ref={eyei === 0 ? leftEyeRef : rightEyeRef} position={[eyex, 0.018, 0.102]}>
              {/* Sclère blanche brillante */}
              <mesh scale={[1.15, 0.85, 0.5]}>
                <sphereGeometry args={[0.019, 16, 16]} />
                <meshStandardMaterial color="#f8fafc" roughness={0.15} />
              </mesh>
              {/* Iris coloré distinctif */}
              <mesh position={[0, 0, 0.009]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.010, 0.010, 0.003, 16]} />
                <meshStandardMaterial color={irisColor} roughness={0.25} />
              </mesh>
              {/* Pupille noire profonde */}
              <mesh position={[0, 0, 0.011]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.0055, 0.0055, 0.003, 16]} />
                <meshStandardMaterial color="#020617" roughness={0.1} />
              </mesh>
              {/* Point de brillance spéculaire (Catchlight) */}
              <mesh position={[0.0035, 0.004, 0.013]}>
                <sphereGeometry args={[0.0028, 8, 8]} />
                <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1} />
              </mesh>
              {/* Raccord paupière supérieure expressive */}
              <mesh position={[0, 0.011, 0.006]} rotation={[-0.18, 0, 0]}>
                <boxGeometry args={[0.038, 0.004, 0.008]} />
                <meshStandardMaterial color={isFemale ? '#1e293b' : (persona.theme === 'luxury' ? '#0f172a' : '#5c2d16')} roughness={0.4} />
              </mesh>
              {/* Cils supérieurs délicats et recourbés chez la femme */}
              {isFemale && (
                <group position={[0, 0.014, 0.007]}>
                  {[-0.014, -0.005, 0.005, 0.014].map((lx, li) => (
                    <mesh key={li} position={[lx, 0.002, 0]} rotation={[0, 0, (eyei === 0 ? -1 : 1) * (0.15 + li * 0.12)]}>
                      <boxGeometry args={[0.003, 0.006, 0.002]} />
                      <meshStandardMaterial color="#020617" roughness={0.2} />
                    </mesh>
                  ))}
                </group>
              )}
            </group>
          );
        })}

        {/* Sourcils expressifs modelés avec micro-élévation conversationnelle */}
        <group ref={eyebrowsRef}>
          {[-0.044, 0.044].map((bx, bi) => (
            <mesh 
              key={bi} 
              position={[bx, 0.044, 0.106]} 
              rotation={[0, 0, bx < 0 ? (isFemale ? -0.08 : -0.12) : (isFemale ? 0.08 : 0.12)]}
            >
              <boxGeometry args={[isFemale ? 0.034 : 0.038, isFemale ? 0.005 : 0.007, 0.006]} />
              <meshStandardMaterial color={persona.theme === 'chef' ? '#78350f' : '#1e293b'} roughness={0.65} />
            </mesh>
          ))}
        </group>

        {/* Nez fin & Arête nasale stylisée */}
        <mesh position={[0, -0.005, 0.112]} rotation={[0.22, 0, 0]}>
          <cylinderGeometry args={[isFemale ? 0.005 : 0.006, isFemale ? 0.009 : 0.011, 0.028, 8]} />
          <meshStandardMaterial color="#fbcfe8" roughness={0.45} />
        </mesh>
        <mesh position={[0, -0.018, 0.120]}>
          <sphereGeometry args={[isFemale ? 0.0075 : 0.009, 12, 12]} />
          <meshStandardMaterial color="#fbcfe8" roughness={0.45} />
        </mesh>

        {/* Bouche articulée (Lip-Sync réactif & lèvres sculptées) */}
        <group ref={mouthRef} position={[0, -0.050, 0.108]}>
          {/* Lèvre supérieure */}
          <mesh position={[0, 0.0025, 0]}>
            <boxGeometry args={[isFemale ? 0.026 : 0.030, isFemale ? 0.0035 : 0.003, 0.006]} />
            <meshStandardMaterial color={isFemale ? '#e11d48' : '#be123c'} roughness={0.35} />
          </mesh>
          {/* Cavité buccale phonatoire intérieure */}
          <mesh position={[0, 0, -0.003]}>
            <boxGeometry args={[isFemale ? 0.020 : 0.024, 0.005, 0.004]} />
            <meshStandardMaterial color="#2d060f" roughness={0.95} />
          </mesh>
          {/* Lèvre inférieure */}
          <mesh position={[0, -0.0025, 0]}>
            <boxGeometry args={[isFemale ? 0.024 : 0.028, isFemale ? 0.0035 : 0.003, 0.006]} />
            <meshStandardMaterial color={isFemale ? '#e11d48' : '#be123c'} roughness={0.35} />
          </mesh>
        </group>

        {/* --- COIFFURES & COUVRE-CHEFS --- */}

        {/* A. Conseillère Maison Luxe (Éléonore) : Coiffure Haute Couture sculptée & Chignon bas */}
        {persona.theme === 'luxury' && (
          <group position={[0, 0.03, 0]}>
            {/* Chevelure châtain soyeux enveloppant la tête */}
            <mesh position={[0, 0.06, -0.01]}>
              <sphereGeometry args={[0.125, 24, 24]} />
              <meshStandardMaterial color="#271c19" roughness={0.35} />
            </mesh>
            {/* Mèche asymétrique élégante sur le front */}
            <mesh position={[-0.055, 0.05, 0.08]} rotation={[0.25, -0.28, -0.38]}>
              <boxGeometry args={[0.09, 0.08, 0.035]} />
              <meshStandardMaterial color="#271c19" roughness={0.35} />
            </mesh>
            {/* Chignon bas retenu par une boucle d'or */}
            <mesh position={[0, -0.04, -0.12]}>
              <sphereGeometry args={[0.068, 16, 16]} />
              <meshStandardMaterial color="#271c19" roughness={0.35} />
            </mesh>
            <mesh position={[0, -0.04, -0.11]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.052, 0.007, 12, 24]} />
              <meshStandardMaterial color="#d97706" metalness={0.92} roughness={0.18} />
            </mesh>
          </group>
        )}

        {/* B. Victoria Pilot (Assistant / Guide Féminine) : Chevelure soyeuse fluide et barrette lumineuse */}
        {isFemale && persona.theme === 'assistant' && (
          <group position={[0, 0.03, 0]}>
            {/* Chevelure volumineuse enveloppante */}
            <mesh position={[0, 0.06, -0.02]}>
              <sphereGeometry args={[0.128, 24, 24]} />
              <meshStandardMaterial color="#2d1b14" roughness={0.38} />
            </mesh>
            {/* Mèches élégantes sur le front */}
            <mesh position={[0.03, 0.06, 0.08]} rotation={[0.2, 0.2, 0.25]}>
              <boxGeometry args={[0.10, 0.05, 0.04]} />
              <meshStandardMaterial color="#2d1b14" roughness={0.38} />
            </mesh>
            {/* Mèches latérales descendantes encadrant le visage */}
            {[-0.10, 0.10].map((hx, hi) => (
              <mesh key={hi} position={[hx, -0.06, 0.02]} rotation={[0, 0, hi === 0 ? 0.15 : -0.15]}>
                <cylinderGeometry args={[0.028, 0.020, 0.22, 12]} />
                <meshStandardMaterial color="#2d1b14" roughness={0.38} />
              </mesh>
            ))}
            {/* Cascade arrière vers les épaules */}
            <mesh position={[0, -0.10, -0.08]} rotation={[0.15, 0, 0]}>
              <cylinderGeometry args={[0.08, 0.11, 0.24, 16]} />
              <meshStandardMaterial color="#2d1b14" roughness={0.38} />
            </mesh>
            {/* Serre-tête / barrette fine lumineuse cyberpunk discrète */}
            <mesh position={[0, 0.07, 0.03]} rotation={[0.4, 0, 0]}>
              <torusGeometry args={[0.115, 0.005, 8, 24, Math.PI]} />
              <meshStandardMaterial color="#4ade80" emissive="#22c55e" emissiveIntensity={0.6} />
            </mesh>
          </group>
        )}

        {/* C. Ingénieure Nova : Coupe moderne féminine texturée & Visière HUD holographique */}
        {persona.theme === 'engineer' && (
          <group>
            {isFemale ? (
              <group position={[0, 0.03, 0]}>
                <mesh position={[0, 0.06, -0.02]}>
                  <sphereGeometry args={[0.126, 24, 24]} />
                  <meshStandardMaterial color="#1e293b" roughness={0.35} />
                </mesh>
                {/* Frange texturée stylée */}
                <mesh position={[-0.04, 0.06, 0.08]} rotation={[0.2, -0.2, -0.3]}>
                  <boxGeometry args={[0.09, 0.05, 0.035]} />
                  <meshStandardMaterial color="#1e293b" roughness={0.35} />
                </mesh>
                {/* Mèches plongeantes le long des tempes */}
                {[-0.105, 0.105].map((hx, hi) => (
                  <mesh key={hi} position={[hx, -0.03, 0.03]} rotation={[0, 0, hi === 0 ? 0.1 : -0.1]}>
                    <cylinderGeometry args={[0.026, 0.018, 0.15, 12]} />
                    <meshStandardMaterial color="#1e293b" roughness={0.35} />
                  </mesh>
                ))}
                {/* Barrette technologique cyan */}
                <mesh position={[0.08, 0.06, 0.05]} rotation={[0, 0.4, 0.2]}>
                  <boxGeometry args={[0.025, 0.008, 0.004]} />
                  <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={0.8} />
                </mesh>
              </group>
            ) : (
              /* Chevelure courte bleu acier / titane pour homme */
              <mesh position={[0, 0.05, -0.02]}>
                <sphereGeometry args={[0.122, 20, 20]} />
                <meshStandardMaterial color="#334155" roughness={0.4} />
              </mesh>
            )}

            {/* Visière HUD holographique translucide monoculaire au-dessus de l'œil droit */}
            <group position={[-0.044, 0.022, 0.128]}>
              <mesh>
                <boxGeometry args={[0.052, 0.028, 0.008]} />
                <meshStandardMaterial 
                  color="#06b6d4" 
                  transparent 
                  opacity={0.7} 
                  roughness={0.1} 
                  metalness={0.2} 
                  emissive="#0891b2" 
                  emissiveIntensity={0.6} 
                />
              </mesh>
              {/* Monture fine en fibre de carbone */}
              <mesh position={[0.035, 0, -0.015]} rotation={[0, 0.5, 0]}>
                <boxGeometry args={[0.045, 0.006, 0.006]} />
                <meshStandardMaterial color="#0f172a" metalness={0.9} />
              </mesh>
            </group>
          </group>
        )}

        {/* D. Chef Auguste ou Cheffe de cuisine */}
        {persona.theme === 'chef' && (
          <group>
            {/* Moustache gastronomique strictement réservée aux avatars masculins */}
            {!isFemale && (
              <group position={[0, -0.036, 0.124]}>
                {[-0.024, 0.024].map((mx, mi) => (
                  <mesh key={mi} position={[mx, 0, 0]} rotation={[0, 0, mi === 0 ? 0.35 : -0.35]}>
                    <cylinderGeometry args={[0.006, 0.002, 0.042, 8]} />
                    <meshStandardMaterial color="#451a03" roughness={0.65} />
                  </mesh>
                ))}
              </group>
            )}

            {/* Chevelure : Tresse féminine ou cheveux poivre et sel sous la toque */}
            {isFemale ? (
              <group>
                {/* Mèches châtaines sur les tempes sous la toque */}
                {[-0.09, 0.09].map((tx, ti) => (
                  <mesh key={ti} position={[tx, 0.02, 0.04]}>
                    <boxGeometry args={[0.02, 0.08, 0.03]} />
                    <meshStandardMaterial color="#3f2e22" roughness={0.4} />
                  </mesh>
                ))}
                {/* Longue tresse féminine élégante tombant dans le dos */}
                <group position={[0, -0.06, -0.12]}>
                  {[0, -0.06, -0.12, -0.18].map((py, pi) => (
                    <mesh key={pi} position={[0, py, 0]} rotation={[0.1, 0, (pi % 2 === 0 ? 0.12 : -0.12)]}>
                      <sphereGeometry args={[0.032 - pi * 0.004, 12, 12]} />
                      <meshStandardMaterial color="#3f2e22" roughness={0.4} />
                    </mesh>
                  ))}
                  {/* Ruban noué rouge cuisine */}
                  <mesh position={[0, -0.20, 0]}>
                    <torusGeometry args={[0.016, 0.005, 8, 16]} />
                    <meshStandardMaterial color="#dc2626" />
                  </mesh>
                </group>
              </group>
            ) : (
              <mesh position={[0, 0.04, -0.02]}>
                <sphereGeometry args={[0.122, 16, 16]} />
                <meshStandardMaterial color="#475569" roughness={0.6} />
              </mesh>
            )}

            {/* Toque Blanche */}
            <group position={[0, 0.13, 0]}>
              <mesh position={[0, 0.02, 0]}>
                <cylinderGeometry args={[0.135, 0.135, 0.05, 24]} />
                <meshStandardMaterial color="#f1f5f9" roughness={0.3} />
              </mesh>
              <mesh position={[0, 0.14, 0]} castShadow>
                <cylinderGeometry args={[0.17, 0.13, 0.22, 24]} />
                <meshStandardMaterial color="#ffffff" roughness={0.5} />
              </mesh>
              <mesh position={[0, 0.25, 0]}>
                <sphereGeometry args={[0.16, 16, 16]} />
                <meshStandardMaterial color="#ffffff" roughness={0.5} />
              </mesh>
            </group>
          </group>
        )}

        {/* E. Guide FLE : Béret parisien incliné avec panache */}
        {persona.theme === 'guide' && (
          <group>
            {/* Mèche de cheveux bouclés sous le béret */}
            <mesh position={[0, 0.04, -0.02]}>
              <sphereGeometry args={[0.122, 16, 16]} />
              <meshStandardMaterial color="#3f2e22" roughness={0.6} />
            </mesh>
            {isFemale && (
              /* Mèches féminines encadrant les joues */
              <group>
                {[-0.09, 0.09].map((gx, gi) => (
                  <mesh key={gi} position={[gx, -0.04, 0.02]} rotation={[0, 0, gi === 0 ? 0.15 : -0.15]}>
                    <cylinderGeometry args={[0.022, 0.016, 0.18, 12]} />
                    <meshStandardMaterial color="#3f2e22" roughness={0.6} />
                  </mesh>
                ))}
              </group>
            )}
            <group position={[0.02, 0.14, -0.02]} rotation={[0.12, 0, 0.18]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.17, 0.13, 0.06, 24]} />
                <meshStandardMaterial color="#581c87" roughness={0.8} />
              </mesh>
            </group>
          </group>
        )}

        {/* F. Guide Naturaliste & Mycologue (Sylvain) */}
        {persona.theme === 'naturalist' && (
          <group>
            {/* Chevelure châtain naturel */}
            <mesh position={[0, 0.04, -0.02]}>
              <sphereGeometry args={[0.124, 18, 18]} />
              <meshStandardMaterial color="#3b2314" roughness={0.65} />
            </mesh>
            {/* Mèche naturelle sur le front */}
            <mesh position={[0.02, 0.06, 0.08]} rotation={[0.2, 0.1, 0.15]}>
              <boxGeometry args={[0.08, 0.04, 0.03]} />
              <meshStandardMaterial color="#3b2314" roughness={0.65} />
            </mesh>
          </group>
        )}

        {/* G. Maître Mécanicien (Marc) */}
        {persona.theme === 'mechanic' && (
          <group>
            <mesh position={[0, 0.05, -0.02]}>
              <sphereGeometry args={[0.122, 18, 18]} />
              <meshStandardMaterial color="#1f1813" roughness={0.6} />
            </mesh>
          </group>
        )}

        {/* H. Chercheur Scientifique (Dr. Aris) */}
        {persona.theme === 'scientist' && (
          <group>
            <mesh position={[0, 0.05, -0.02]}>
              <sphereGeometry args={[0.122, 18, 18]} />
              <meshStandardMaterial color="#334155" roughness={0.4} />
            </mesh>
            {/* Lunettes de laboratoire fines sur le nez */}
            <group position={[0, 0.015, 0.11]}>
              {[-0.044, 0.044].map((lx, li) => (
                <mesh key={li} position={[lx, 0, 0]}>
                  <torusGeometry args={[0.018, 0.003, 8, 20]} />
                  <meshStandardMaterial color="#0284c7" metalness={0.8} roughness={0.2} />
                </mesh>
              ))}
              <mesh position={[0, 0, 0]}>
                <boxGeometry args={[0.03, 0.003, 0.003]} />
                <meshStandardMaterial color="#0284c7" metalness={0.8} />
              </mesh>
            </group>
          </group>
        )}

        {/* I. Accessoires de tête pour avatar génératif personnalisé (Custom Persona) */}
        {persona.theme === 'custom' && (
          <group>
            {/* Casque pompier / sécurité chantier */}
            {persona.attire?.accessoryType === 'helmet' && (
              <group position={[0, 0.12, 0]}>
                <mesh position={[0, 0.02, 0]}>
                  <sphereGeometry args={[0.135, 18, 18, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
                  <meshStandardMaterial color={persona.attire.accessoryColor || '#ea580c'} roughness={0.3} metalness={0.2} />
                </mesh>
                <mesh position={[0, 0.01, 0.11]} rotation={[0.2, 0, 0]}>
                  <cylinderGeometry args={[0.12, 0.13, 0.06, 16, 1, false, -Math.PI * 0.35, Math.PI * 0.7]} />
                  <meshStandardMaterial color="#0284c7" transparent opacity={0.6} roughness={0.1} />
                </mesh>
                <mesh position={[0, -0.01, 0]}>
                  <cylinderGeometry args={[0.14, 0.14, 0.02, 24]} />
                  <meshStandardMaterial color="#1e293b" roughness={0.5} />
                </mesh>
              </group>
            )}

            {/* Chapeau large bord (apiculteur, ranger, explorateur) */}
            {persona.attire?.accessoryType === 'hat' && (
              <group position={[0, 0.12, 0]}>
                <mesh position={[0, 0.01, 0]}>
                  <cylinderGeometry args={[0.21, 0.22, 0.018, 24]} />
                  <meshStandardMaterial color={persona.attire.accessoryColor || '#78350f'} roughness={0.7} />
                </mesh>
                <mesh position={[0, 0.06, 0]}>
                  <cylinderGeometry args={[0.13, 0.14, 0.08, 24]} />
                  <meshStandardMaterial color={persona.attire.accessoryColor || '#78350f'} roughness={0.7} />
                </mesh>
              </group>
            )}

            {/* Lunettes de vue ou d'observation */}
            {persona.attire?.accessoryType === 'glasses' && (
              <group position={[0, 0.015, 0.11]}>
                {[-0.044, 0.044].map((lx, li) => (
                  <mesh key={li} position={[lx, 0, 0]}>
                    <torusGeometry args={[0.018, 0.003, 8, 20]} />
                    <meshStandardMaterial color={persona.attire?.accessoryColor || '#0284c7'} metalness={0.8} roughness={0.2} />
                  </mesh>
                ))}
                <mesh position={[0, 0, 0]}>
                  <boxGeometry args={[0.03, 0.003, 0.003]} />
                  <meshStandardMaterial color={persona.attire?.accessoryColor || '#0284c7'} metalness={0.8} />
                </mesh>
              </group>
            )}
          </group>
        )}

        {/* J. Fallback universel pour toute autre femme non catégorisée */}
        {isFemale && persona.theme !== 'luxury' && persona.theme !== 'assistant' && persona.theme !== 'engineer' && persona.theme !== 'chef' && persona.theme !== 'guide' && persona.theme !== 'custom' && (
          <group position={[0, 0.03, 0]}>
            <mesh position={[0, 0.06, -0.02]}>
              <sphereGeometry args={[0.128, 24, 24]} />
              <meshStandardMaterial color="#382216" roughness={0.4} />
            </mesh>
            {[-0.10, 0.10].map((hx, hi) => (
              <mesh key={hi} position={[hx, -0.06, 0.02]} rotation={[0, 0, hi === 0 ? 0.15 : -0.15]}>
                <cylinderGeometry args={[0.028, 0.020, 0.20, 12]} />
                <meshStandardMaterial color="#382216" roughness={0.4} />
              </mesh>
            ))}
            <mesh position={[0, -0.08, -0.08]}>
              <cylinderGeometry args={[0.08, 0.10, 0.20, 16]} />
              <meshStandardMaterial color="#382216" roughness={0.4} />
            </mesh>
          </group>
        )}
      </group>

      {/* 6. Bras Gauche (Reposé, ajusté avec manche & montre / bracelet) */}
      <group ref={leftArmRef} position={[isFemale ? -0.19 : -0.24, isFemale ? 1.33 : 1.35, 0]}>
        {/* Épaule & Haut de manche */}
        <mesh position={[0, -0.11, 0]} castShadow>
          <cylinderGeometry args={isFemale ? [0.038, 0.032, 0.22, 16] : [0.046, 0.040, 0.22, 16]} />
          <meshStandardMaterial color={
            persona.attire?.jacketColor || (
              persona.theme === 'chef' ? '#f8fafc' : 
              persona.theme === 'luxury' ? '#172554' : 
              persona.theme === 'naturalist' ? '#3f6212' :
              persona.theme === 'mechanic' ? '#9a3412' :
              persona.theme === 'scientist' ? '#f8fafc' :
              '#334155'
            )
          } />
        </mesh>
        {/* Avant-bras fuselé */}
        <mesh position={[0, -0.30, 0]} castShadow>
          <cylinderGeometry args={isFemale ? [0.032, 0.026, 0.20, 16] : [0.040, 0.032, 0.20, 16]} />
          <meshStandardMaterial color={
            persona.attire?.jacketColor || (
              persona.theme === 'chef' ? '#f8fafc' : 
              persona.theme === 'luxury' ? '#172554' : 
              persona.theme === 'naturalist' ? '#3f6212' :
              persona.theme === 'mechanic' ? '#9a3412' :
              persona.theme === 'scientist' ? '#f8fafc' :
              '#334155'
            )
          } />
        </mesh>
        {/* Poignet & Bracelet de montre fine */}
        <mesh position={[0, -0.41, 0]}>
          <cylinderGeometry args={isFemale ? [0.028, 0.028, 0.022, 16] : [0.033, 0.033, 0.022, 16]} />
          <meshStandardMaterial color={persona.theme === 'luxury' ? '#facc15' : '#0f172a'} metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Main anatomique déliée & articulée */}
        <group ref={leftHandRef} position={[0, -0.45, 0]}>
          <mesh>
            <boxGeometry args={[isFemale ? 0.038 : 0.046, isFemale ? 0.048 : 0.055, 0.020]} />
            <meshStandardMaterial color="#fed7aa" roughness={0.45} />
          </mesh>
          {/* Pouce articulé gauche */}
          <group ref={leftThumbGroupRef} position={[isFemale ? 0.022 : 0.026, 0.005, 0.005]}>
            <mesh position={[0, -0.012, 0]}>
              <boxGeometry args={[0.012, 0.024, 0.012]} />
              <meshStandardMaterial color="#fed7aa" roughness={0.45} />
            </mesh>
          </group>
          {/* Doigts articulés gauches */}
          <group ref={leftFingersGroupRef} position={[0, -0.022, 0.008]}>
            <mesh position={[0, -0.016, 0]}>
              <boxGeometry args={[isFemale ? 0.032 : 0.038, 0.032, 0.014]} />
              <meshStandardMaterial color="#fed7aa" roughness={0.45} />
            </mesh>
          </group>
        </group>
      </group>

      {/* 7. Bras Droit & Main Pointeur Kinématique Articulée */}
      <group ref={rightArmRef} position={[isFemale ? 0.19 : 0.24, isFemale ? 1.33 : 1.35, 0]}>
        {/* Épaule & Bras supérieur */}
        <mesh position={[0, -0.11, 0]} castShadow>
          <cylinderGeometry args={isFemale ? [0.038, 0.032, 0.22, 16] : [0.046, 0.040, 0.22, 16]} />
          <meshStandardMaterial color={
            persona.attire?.jacketColor || (
              persona.theme === 'chef' ? '#f8fafc' : 
              persona.theme === 'luxury' ? '#172554' : 
              persona.theme === 'naturalist' ? '#3f6212' :
              persona.theme === 'mechanic' ? '#9a3412' :
              persona.theme === 'scientist' ? '#f8fafc' :
              '#334155'
            )
          } />
        </mesh>
        {/* Avant-bras cinématique */}
        <mesh position={[0, -0.30, 0]} castShadow>
          <cylinderGeometry args={isFemale ? [0.032, 0.026, 0.20, 16] : [0.040, 0.032, 0.20, 16]} />
          <meshStandardMaterial color={
            persona.attire?.jacketColor || (
              persona.theme === 'chef' ? '#f8fafc' : 
              persona.theme === 'luxury' ? '#172554' : 
              persona.theme === 'naturalist' ? '#3f6212' :
              persona.theme === 'mechanic' ? '#9a3412' :
              persona.theme === 'scientist' ? '#f8fafc' :
              '#334155'
            )
          } />
        </mesh>
        {/* Poignet & Montre connectée spatiale */}
        <group position={[0, -0.41, 0]}>
          <mesh>
            <cylinderGeometry args={isFemale ? [0.028, 0.028, 0.022, 16] : [0.033, 0.033, 0.022, 16]} />
            <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.25} />
          </mesh>
          <mesh position={[0, 0, 0.030]} rotation={[0, 0, 0]}>
            <planeGeometry args={[0.016, 0.012]} />
            <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={0.8} />
          </mesh>
        </group>
        {/* Main Droite Articulée Multi-Doigts pour Co-Speech Gesturing & Désignation */}
        <group ref={rightHandRef} position={[0, -0.46, 0]}>
          {/* Paume anatomique sculptée */}
          <mesh>
            <boxGeometry args={[0.044, 0.050, 0.022]} />
            <meshStandardMaterial color="#fed7aa" roughness={0.45} />
          </mesh>
          {/* Pouce articulé (opposable) */}
          <group ref={rightThumbGroupRef} position={[-0.022, 0.006, 0.006]}>
            <mesh position={[0, -0.012, 0]}>
              <boxGeometry args={[0.012, 0.024, 0.012]} />
              <meshStandardMaterial color="#fed7aa" roughness={0.45} />
            </mesh>
            <mesh position={[0, -0.025, 0.002]} rotation={[-0.2, 0, 0]}>
              <sphereGeometry args={[0.0055, 8, 8]} />
              <meshStandardMaterial color="#fed7aa" roughness={0.45} />
            </mesh>
          </group>
          {/* Index articulé indépendant (Pointeur / Pince) */}
          <group ref={rightIndexGroupRef} position={[0.013, -0.016, 0.015]}>
            {/* Phalange proximale */}
            <mesh position={[0, -0.018, 0]}>
              <cylinderGeometry args={[0.0065, 0.0055, 0.034, 8]} />
              <meshStandardMaterial color="#fed7aa" roughness={0.45} />
            </mesh>
            {/* Phalange distale */}
            <mesh position={[0, -0.042, 0.004]} rotation={[-0.15, 0, 0]}>
              <cylinderGeometry args={[0.0055, 0.0045, 0.028, 8]} />
              <meshStandardMaterial color="#fed7aa" roughness={0.45} />
            </mesh>
            {/* Pulpe tactile */}
            <mesh position={[0, -0.058, 0.006]}>
              <sphereGeometry args={[0.005, 8, 8]} />
              <meshStandardMaterial color="#fed7aa" roughness={0.45} />
            </mesh>
          </group>
          {/* Majeur articulé indépendant */}
          <group ref={rightMiddleGroupRef} position={[0.001, -0.020, 0.014]}>
            <mesh position={[0, -0.018, 0]}>
              <cylinderGeometry args={[0.0065, 0.0055, 0.036, 8]} />
              <meshStandardMaterial color="#fed7aa" roughness={0.45} />
            </mesh>
            <mesh position={[0, -0.042, 0.004]}>
              <cylinderGeometry args={[0.0055, 0.0045, 0.026, 8]} />
              <meshStandardMaterial color="#fed7aa" roughness={0.45} />
            </mesh>
          </group>
          {/* Annulaire & Auriculaire articulés */}
          <group ref={rightOtherFingersGroupRef} position={[-0.012, -0.020, 0.012]}>
            <mesh position={[0, -0.016, 0]}>
              <boxGeometry args={[0.016, 0.030, 0.014]} />
              <meshStandardMaterial color="#fed7aa" roughness={0.45} />
            </mesh>
            <mesh position={[0, -0.036, 0.002]}>
              <boxGeometry args={[0.014, 0.022, 0.012]} />
              <meshStandardMaterial color="#fed7aa" roughness={0.45} />
            </mesh>
          </group>
        </group>
      </group>

      {/* 8. Halo Acoustique Diégétique Lévitant (Visualiseur Phonique Subtil) */}
      <group ref={sonicHaloRef} position={[0, 1.48, 0.05]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.16, 0.004, 12, 32]} />
          <meshBasicMaterial 
            color={persona.accentColor || persona.color} 
            transparent 
            opacity={0} 
            wireframe 
          />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.13, 0.003, 12, 32]} />
          <meshBasicMaterial 
            color="#ffffff" 
            transparent 
            opacity={0} 
          />
        </mesh>
      </group>

      {/* 3D Floating Speech Bubble */}
      {bubbleOpen && (
        <Html
          position={[0, 2.15, 0]}
          center
          zIndexRange={[80, 0]}
          style={{ pointerEvents: 'auto' }}
        >
          <div className="spatial-bubble-3d">
            <div className="spatial-bubble-header">
              <span className="spatial-bubble-avatar">{persona.icon}</span>
              <div className="spatial-bubble-meta">
                <span className="spatial-bubble-name">{persona.name}</span>
                <small className="spatial-bubble-role">{persona.role}</small>
              </div>
              <button 
                className="spatial-bubble-close" 
                onClick={() => setBubbleOpen(false)}
                title="Minimiser le phylactère"
              >
                ✕
              </button>
            </div>

            <div className="spatial-bubble-body">
              <p className="spatial-bubble-text">
                {showHint && currentStep?.hint ? `💡 ${currentStep.hint}` : currentDialogue}
              </p>
              {targetEntity && (
                <div className="spatial-bubble-target-chip">
                  <span>🎯 Cible active : <b>{targetEntity.name}</b></span>
                </div>
              )}
              {isListeningMic && (
                <div style={{
                  marginTop: '8px',
                  padding: '6px 10px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  borderRadius: '6px',
                  fontSize: '11px',
                  color: '#fca5a5',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span style={{ animation: 'pulse 1s infinite' }}>🔴</span>
                  <span>{micTranscript ? `« ${micTranscript} »` : "Je vous écoute..."}</span>
                </div>
              )}
            </div>

            <div className="spatial-bubble-footer">
              <button
                className={`spatial-bubble-btn ${isListeningMic ? 'active' : ''}`}
                onClick={toggleMicListening}
                title={isListeningMic ? "Arrêter l'écoute du micro" : "Parler à Victoria via votre microphone (reconnaissance vocale)"}
                style={isListeningMic ? { background: '#ef4444', borderColor: '#f87171', color: '#ffffff' } : {}}
              >
                {isListeningMic ? '🔴 Écoute...' : '🎙️ Parler'}
              </button>
              <button
                className="spatial-bubble-btn primary"
                onClick={() => speakAgentDialogue(showHint && currentStep?.hint ? currentStep.hint : currentDialogue)}
                title="Écouter le conseil via la synthèse vocale"
              >
                🔊 Écouter
              </button>
              {currentStep?.hint && (
                <button
                  className="spatial-bubble-btn"
                  onClick={() => setShowHint(!showHint)}
                >
                  {showHint ? 'Consigne' : '💡 Indice'}
                </button>
              )}
              <button
                className={`spatial-bubble-btn ${isAgentSpeechEnabled ? 'active' : ''}`}
                onClick={toggleAgentSpeech}
                title={isAgentSpeechEnabled ? "Désactiver la lecture vocale automatique des conseils" : "Activer la lecture vocale automatique des conseils"}
              >
                {isAgentSpeechEnabled ? '🔊 Voix auto ON' : '🔇 Voix auto OFF'}
              </button>
            </div>
            <div className="spatial-bubble-pointer" />
          </div>
        </Html>
      )}

      {/* Re-open button if minimized - discrete, compact luxury badge */}
      {!bubbleOpen && (
        <Html position={[0, 1.95, 0]} center zIndexRange={[35, 0]} style={{ pointerEvents: 'auto' }}>
          <button 
            className="spatial-bubble-trigger"
            onClick={() => setBubbleOpen(true)}
            title={`Consulter ${persona.name}`}
            style={{
              borderColor: `${persona.accentColor || persona.color}88`,
              boxShadow: `0 4px 15px rgba(0, 0, 0, 0.5), 0 0 12px ${persona.color}33`,
              background: 'rgba(15, 23, 42, 0.88)',
              whiteSpace: 'nowrap',
              maxWidth: '340px',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            <span>{persona.icon}</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{persona.name}</span>
          </button>
        </Html>
      )}
    </group>
  );
};
