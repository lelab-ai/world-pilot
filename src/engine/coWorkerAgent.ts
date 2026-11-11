// src/engine/coWorkerAgent.ts
// Moteur d'Agent Co-équipier Incarné (Mixed-Initiative Human-AI Teaming) pour WorldPilot.
// Permet la co-présence d'agents autonomes collaboratifs dans l'espace 3D,
// la délégation partagée de tâches physiques, et la mesure haute fidélité du trust & teaming humain-IA.

export type CoWorkerPersonaId = 'sous-chef-camille' | 'facilitateur-alex' | 'auditeur-victor';

export type CoWorkerTaskType = 
  | 'chop_vegetables'     // Découpe des ingrédients sur la planche
  | 'monitor_heat'        // Surveillance thermique et régulation du brûleur
  | 'season_dish'         // Ajustement de l'assaisonnement (huile, herbes)
  | 'plate_garniture'     // Pose de la garniture de dressage
  | 'organize_notes'      // Tri et agencement des post-its en séminaire
  | 'idle';

export interface CoWorkerPersona {
  id: CoWorkerPersonaId;
  name: string;
  role: string;
  avatarColor: string;
  accentColor: string;
  defaultPosition: { x: number; y: number; z: number };
  greeting: string;
}

export const COWORKER_PERSONAS: Record<CoWorkerPersonaId, CoWorkerPersona> = {
  'sous-chef-camille': {
    id: 'sous-chef-camille',
    name: 'Camille',
    role: 'Sous-Chef de Brigade',
    avatarColor: '#10b981', // Émeraude chef
    accentColor: '#34d399',
    defaultPosition: { x: 1.35, y: 0.9, z: 0.2 },
    greeting: "Prêt(e) à dresser la brigade ! Dis-moi ce que je peux préparer."
  },
  'facilitateur-alex': {
    id: 'facilitateur-alex',
    name: 'Alex',
    role: 'Facilitateur Séminaire',
    avatarColor: '#3b82f6', // Bleu collaboratif
    accentColor: '#60a5fa',
    defaultPosition: { x: 1.2, y: 0.9, z: -1.2 },
    greeting: "Tableau blanc synchronisé. Je veille à la cadence des idées."
  },
  'auditeur-victor': {
    id: 'auditeur-victor',
    name: 'Victor',
    role: 'Auditeur Pédagogique',
    avatarColor: '#8b5cf6', // Violet mentor
    accentColor: '#a78bfa',
    defaultPosition: { x: -1.35, y: 0.9, z: 0.2 },
    greeting: "Observateur attentif de votre fluidité opératoire et de vos réflexes."
  }
};

export interface CoWorkerState {
  personaId: CoWorkerPersonaId;
  name: string;
  role: string;
  avatarColor: string;
  accentColor: string;
  currentTask: CoWorkerTaskType;
  position: { x: number; y: number; z: number };
  targetPosition: { x: number; y: number; z: number };
  progress: number; // 0 to 100%
  status: 'idle' | 'walking' | 'working' | 'speaking';
  speechBubble: string | null;
  speechTimeout: number;
  taskDurationSec: number;
  taskElapsedSec: number;
}

export interface HumanAITeamingMetrics {
  delegatedTasksCount: number;
  completedTasksCount: number;
  overriddenTasksCount: number;
  trustScore: number;       // 0 - 100% (croît avec la délégation et l'absence d'override)
  teamingFluency: number;   // 0 - 100% (harmonie spatiale et temporelle)
  collaborationLog: Array<{
    id: string;
    timestamp: number;
    event: 'delegation' | 'completion' | 'override' | 'speech';
    detail: string;
  }>;
}

/**
 * Initialise l'état du co-équipier IA incarné.
 */
export function createInitialCoWorkerState(personaId: CoWorkerPersonaId = 'sous-chef-camille'): CoWorkerState {
  const p = COWORKER_PERSONAS[personaId];
  return {
    personaId,
    name: p.name,
    role: p.role,
    avatarColor: p.avatarColor,
    accentColor: p.accentColor,
    currentTask: 'idle',
    position: { ...p.defaultPosition },
    targetPosition: { ...p.defaultPosition },
    progress: 0,
    status: 'idle',
    speechBubble: p.greeting,
    speechTimeout: Date.now() + 4500,
    taskDurationSec: 0,
    taskElapsedSec: 0
  };
}

/**
 * Initialise les métriques d'équipe humain-IA.
 */
export function createInitialTeamingMetrics(): HumanAITeamingMetrics {
  return {
    delegatedTasksCount: 0,
    completedTasksCount: 0,
    overriddenTasksCount: 0,
    trustScore: 75, // Confiance initiale bienveillante
    teamingFluency: 80,
    collaborationLog: [
      {
        id: `collab-init-${Date.now()}`,
        timestamp: Date.now(),
        event: 'speech',
        detail: "Connexion de l'agent co-équipier incarné établie."
      }
    ]
  };
}

/**
 * Renvoie les coordonnées du poste de travail selon la tâche déléguée.
 */
export function getWorkstationCoords(task: CoWorkerTaskType): { x: number; y: number; z: number } {
  switch (task) {
    case 'chop_vegetables':
      return { x: 0.55, y: 0.9, z: 0.35 }; // À côté de la planche à découper
    case 'monitor_heat':
      return { x: 0.45, y: 0.9, z: -0.25 }; // Face au brûleur et à la cocotte
    case 'season_dish':
      return { x: -0.45, y: 0.9, z: -0.15 }; // Côté assaisonnements
    case 'plate_garniture':
      return { x: 0.45, y: 0.9, z: 0.15 }; // Face à l'assiette de dressage
    case 'organize_notes':
      return { x: 0.6, y: 0.9, z: -1.7 }; // Devant le tableau blanc
    case 'idle':
    default:
      return { x: 1.35, y: 0.9, z: 0.2 };
  }
}

/**
 * Durée estimée en secondes pour chaque tâche déléguée.
 */
export function getTaskStandardDuration(task: CoWorkerTaskType): number {
  switch (task) {
    case 'chop_vegetables': return 4.5;
    case 'monitor_heat': return 6.0;
    case 'season_dish': return 3.5;
    case 'plate_garniture': return 4.0;
    case 'organize_notes': return 5.0;
    case 'idle': default: return 0;
  }
}

/**
 * Délègue une tâche concrète au co-équipier IA.
 */
export function delegateTaskToCoWorker(
  currentState: CoWorkerState,
  task: CoWorkerTaskType,
  metrics: HumanAITeamingMetrics
): {
  nextState: CoWorkerState;
  nextMetrics: HumanAITeamingMetrics;
  announcement: string;
} {
  const targetPos = getWorkstationCoords(task);
  const duration = getTaskStandardDuration(task);

  const taskTitles: Record<CoWorkerTaskType, string> = {
    chop_vegetables: "la découpe des légumes en brunoise",
    monitor_heat: "la régulation thermique du brûleur",
    season_dish: "l'infusion aromatique et l'huile d'olive",
    plate_garniture: "la touche finale de dressage",
    organize_notes: "l'organisation des idées sur le tableau",
    idle: "le repos"
  };

  if (task === 'idle') {
    const p = COWORKER_PERSONAS[currentState.personaId];
    const defaultPos = p ? { ...p.defaultPosition } : targetPos;
    const nextState: CoWorkerState = {
      ...currentState,
      currentTask: 'idle',
      targetPosition: defaultPos,
      status: 'idle',
      progress: 0,
      taskDurationSec: 0,
      taskElapsedSec: 0,
      speechBubble: 'En attente de votre prochaine consigne.',
      speechTimeout: Date.now() + 3000
    };
    return {
      nextState,
      nextMetrics: metrics,
      announcement: `${currentState.name} : « Je reste en veille à mon poste. »`
    };
  }

  const title = taskTitles[task] || task;
  const announcement = `${currentState.name} : « C'est noté ! Je prends en charge ${title}. »`;

  const nextState: CoWorkerState = {
    ...currentState,
    currentTask: task,
    targetPosition: targetPos,
    status: 'walking',
    progress: 0,
    taskDurationSec: duration,
    taskElapsedSec: 0,
    speechBubble: `Je m'occupe de ${title} !`,
    speechTimeout: Date.now() + 4000
  };

  const newTrust = Math.min(100, metrics.trustScore + 3);
  const newFluency = Math.min(100, metrics.teamingFluency + 2);

  const nextMetrics: HumanAITeamingMetrics = {
    ...metrics,
    delegatedTasksCount: metrics.delegatedTasksCount + 1,
    trustScore: newTrust,
    teamingFluency: newFluency,
    collaborationLog: [
      {
        id: `collab-del-${Date.now()}`,
        timestamp: Date.now(),
        event: 'delegation',
        detail: `Délégation de la tâche [${task}] à ${currentState.name}.`
      },
      ...metrics.collaborationLog
    ]
  };

  return { nextState, nextMetrics, announcement };
}

/**
 * Effectue un pas de simulation pour le co-équipier IA (animation, travail et complétion).
 */
export function tickCoWorker(
  currentState: CoWorkerState,
  metrics: HumanAITeamingMetrics,
  deltaSec: number = 0.5
): {
  nextState: CoWorkerState;
  nextMetrics: HumanAITeamingMetrics;
  taskCompleted: boolean;
  completedTaskType?: CoWorkerTaskType;
  completionMessage?: string;
} {
  // Clear speech bubble if expired
  let bubble = currentState.speechBubble;
  if (bubble && Date.now() > currentState.speechTimeout) {
    bubble = null;
  }

  if (currentState.currentTask === 'idle') {
    const px = currentState.position.x;
    const py = currentState.position.y;
    const pz = currentState.position.z;
    const tx = currentState.targetPosition.x;
    const tz = currentState.targetPosition.z;
    const dist = Math.hypot(tx - px, tz - pz);
    if (dist > 0.05) {
      const moveDist = Math.min(dist, 1.6 * deltaSec);
      const angle = Math.atan2(tz - pz, tx - px);
      return {
        nextState: {
          ...currentState,
          position: {
            x: px + Math.cos(angle) * moveDist,
            y: py,
            z: pz + Math.sin(angle) * moveDist
          },
          status: 'walking',
          speechBubble: bubble
        },
        nextMetrics: metrics,
        taskCompleted: false
      };
    }
    return {
      nextState: {
        ...currentState,
        position: { x: tx, y: py, z: tz },
        status: 'idle',
        speechBubble: bubble
      },
      nextMetrics: metrics,
      taskCompleted: false
    };
  }

  // Position interpolation (walking towards workstation)
  const px = currentState.position.x;
  const py = currentState.position.y;
  const pz = currentState.position.z;
  const tx = currentState.targetPosition.x;
  const tz = currentState.targetPosition.z;

  const dist = Math.hypot(tx - px, tz - pz);
  const speed = 1.6; // m/s
  let nextX = px;
  let nextZ = pz;
  let newStatus = currentState.status;

  if (dist > 0.05) {
    const moveDist = Math.min(dist, speed * deltaSec);
    const angle = Math.atan2(tz - pz, tx - px);
    nextX = px + Math.cos(angle) * moveDist;
    nextZ = pz + Math.sin(angle) * moveDist;
    newStatus = 'walking';
  } else {
    nextX = tx;
    nextZ = tz;
    newStatus = 'working';
  }

  // Work progress
  const newElapsed = currentState.taskElapsedSec + deltaSec;
  const duration = Math.max(0.1, currentState.taskDurationSec);
  const newProgress = Math.min(100, Math.round((newElapsed / duration) * 100));

  if (newProgress >= 100) {
    const finishedTask = currentState.currentTask;
    const p = COWORKER_PERSONAS[currentState.personaId];
    const completionMsg = `${currentState.name} a terminé avec succès : ${finishedTask} !`;

    const nextState: CoWorkerState = {
      ...currentState,
      position: { x: nextX, y: py, z: nextZ },
      currentTask: 'idle',
      targetPosition: { ...p.defaultPosition },
      progress: 100,
      status: 'idle',
      speechBubble: "Mission accomplie !",
      speechTimeout: Date.now() + 3500,
      taskElapsedSec: 0,
      taskDurationSec: 0
    };

    const nextMetrics: HumanAITeamingMetrics = {
      ...metrics,
      completedTasksCount: metrics.completedTasksCount + 1,
      trustScore: Math.min(100, metrics.trustScore + 4),
      teamingFluency: Math.min(100, metrics.teamingFluency + 3),
      collaborationLog: [
        {
          id: `collab-comp-${Date.now()}`,
          timestamp: Date.now(),
          event: 'completion',
          detail: `Tâche [${finishedTask}] achevée par ${currentState.name}.`
        },
        ...metrics.collaborationLog
      ]
    };

    return {
      nextState,
      nextMetrics,
      taskCompleted: true,
      completedTaskType: finishedTask,
      completionMessage: completionMsg
    };
  }

  return {
    nextState: {
      ...currentState,
      position: { x: nextX, y: py, z: nextZ },
      progress: newProgress,
      status: newStatus,
      speechBubble: bubble,
      taskElapsedSec: newElapsed
    },
    nextMetrics: metrics,
    taskCompleted: false
  };
}

/**
 * Enregistre une interruption ou reprise de contrôle par l'opérateur humain.
 */
export function recordHumanOverride(
  metrics: HumanAITeamingMetrics,
  reason: string = "Reprise de contrôle manuelle par l'opérateur"
): HumanAITeamingMetrics {
  return {
    ...metrics,
    overriddenTasksCount: metrics.overriddenTasksCount + 1,
    trustScore: Math.max(20, metrics.trustScore - 5),
    teamingFluency: Math.max(30, metrics.teamingFluency - 4),
    collaborationLog: [
      {
        id: `collab-over-${Date.now()}`,
        timestamp: Date.now(),
        event: 'override',
        detail: reason
      },
      ...metrics.collaborationLog
    ]
  };
}
