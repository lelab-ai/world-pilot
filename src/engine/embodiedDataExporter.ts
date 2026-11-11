// src/engine/embodiedDataExporter.ts
// Pipeline d'exportation de données d'apprentissage pour la Robotique & l'IA Incarnée (Embodied AI).
// Convertit les trajectoires sémantiques 3D et les traces multivers de WorldPilot
// into a WorldPilot-specific JSON sample with robotics-oriented fields.

import { CognitiveSessionReport, CognitiveTraceStep } from './cognitiveTraceRecorder';
import { CounterfactualBranch } from './counterfactualEngine';
import { WorldState } from '../core/types';

export interface LeRobotFrame {
  frame_index: number;
  timestamp: number;
  observation: {
    state: number[]; // [px, py, pz, ry, cookingTemp, cookingDoneness, heatLevel]
    active_affordances: string[];
    camera_view: string;
    language_instruction: string;
  };
  action: {
    delta_position: [number, number, number];
    tool_action: string;
    intensity: number;
  };
  cognitive_telemetry: {
    hesitation_latency_ms: number;
    cognitive_load_index: number;
    error_recovery: boolean;
  };
  reward: number;
  is_terminal: boolean;
}

export interface LeRobotEpisode {
  episode_id: string;
  task_description: string;
  fps: number;
  total_frames: number;
  success: boolean;
  evaluation_score: number;
  meta: {
    agent_platform: string;
    world_version: number;
    multiverse_branches_count: number;
    robot_embodiment_type: string;
    date: string;
  };
  frames: LeRobotFrame[];
}

export interface LeRobotDatasetExport {
  dataset_name: string;
  format_version: 'worldpilot-spatial-demo/v1';
  episodes_count: number;
  total_frames: number;
  features: Record<string, string>;
  episodes: LeRobotEpisode[];
}

function resolveStepPose(step: CognitiveTraceStep, world?: WorldState): [number, number, number, number] {
  const entityId = step.targetEntityId || step.sourceEntityId;
  if (entityId && world?.ir?.entities?.[entityId]) {
    const ent = world.ir.entities[entityId];
    const tc = (ent.capabilities || []).find((c: any) => c.type === 'transform') as any;
    const pos = tc?.position;
    const rot = tc?.rotation;
    if (pos) {
      const px = Array.isArray(pos) ? Number(pos[0]) || 0 : Number(pos.x) || 0;
      const py = Array.isArray(pos) ? Number(pos[1]) || 0.92 : Number(pos.y ?? 0.92);
      const pz = Array.isArray(pos) ? Number(pos[2]) || 0.15 : Number(pos.z ?? 0.15);
      const ry = Array.isArray(rot) ? Number(rot[1]) || 0 : Number(rot?.y) || 0;
      return [Number(px.toFixed(3)), Number(py.toFixed(3)), Number(pz.toFixed(3)), Number(ry.toFixed(3))];
    }
  }
  return [0.0, 0.92, 0.15, 0.0];
}

/**
 * Maps an application interaction to a WorldPilot JSON sample frame.
 */
export function mapTraceStepToLeRobotFrame(
  step: CognitiveTraceStep,
  index: number,
  totalSteps: number,
  prevStep?: CognitiveTraceStep,
  world?: WorldState
): LeRobotFrame {
  // Calcul de l'action différentielle relative
  const prevTemp = prevStep?.temperature ?? step.temperature;
  const deltaTemp = step.temperature - prevTemp;

  // Détermination de l'affordance sémantique active
  const affordance = step.sourceEntityName || step.actionType;

  const [px, py, pz, ry] = resolveStepPose(step, world);
  const [prevPx, prevPy, prevPz] = prevStep ? resolveStepPose(prevStep, world) : [px, py, pz];
  const deltaPosition: [number, number, number] = [
    Number((px - prevPx).toFixed(3)),
    Number((py - prevPy).toFixed(3)),
    Number((pz - prevPz).toFixed(3))
  ];

  // Calcul du vecteur d'état robotique 7D [x, y, z, yaw, temp, doneness, heatLevel]
  const stateVector = [
    px, // x end-effector
    py, // y table height
    pz, // z distance
    ry, // yaw
    step.temperature,
    step.doneness,
    step.heatLevel
  ];

  // Récompense dense intermédiaire (récompense la régularité et pénalise les surchauffes)
  let stepReward = 1.0;
  if (step.temperature > 185) stepReward -= 2.5; // pénalité surchauffe
  if (step.warningTriggered) stepReward -= 1.0;
  if (step.isErrorRecovery) stepReward += 1.5;

  return {
    frame_index: index,
    timestamp: step.timestamp,
    observation: {
      state: stateVector,
      active_affordances: [affordance],
      camera_view: 'overview_and_table_rgb',
      language_instruction: step.activeQuestId ? `Execute step: ${step.actionType}` : 'Master culinary preparation with optimal thermodynamics'
    },
    action: {
      delta_position: deltaPosition,
      tool_action: step.actionType,
      intensity: step.heatLevel > 0 ? step.heatLevel / 3 : deltaTemp !== 0 ? 0.5 : 0.2
    },
    cognitive_telemetry: {
      hesitation_latency_ms: step.latencyMs,
      cognitive_load_index: step.temperature > 140 ? 65 : 25,
      error_recovery: !!step.isErrorRecovery
    },
    reward: stepReward,
    is_terminal: index === totalSteps - 1
  };
}

/**
 * Creates a synthetic WorldPilot motion sample. This is not the Hugging Face LeRobot dataset format.
 */
export function generateLeRobotDataset(
  report: CognitiveSessionReport,
  world: WorldState,
  counterfactualBranches: CounterfactualBranch[] = []
): LeRobotDatasetExport {
  const episodes: LeRobotEpisode[] = [];

  // If the session has no interaction trace, generate an explicitly synthetic sample.
  // Keep the export non-empty even when the user opens the tool from a blank scene.
  const sceneEntities = Object.values(world.ir.entities || {}).slice(0, 3);
  const exportTraces: CognitiveTraceStep[] = report.traces.length > 0
    ? report.traces
    : Array.from({ length: Math.max(sceneEntities.length, 3) }, (_, index) => ({
        stepIndex: index,
        timestamp: Date.now() + index * 100,
        relativeTimeSec: index / 10,
        actionType: 'SYNTHETIC_SAMPLE_INTERACTION',
        sourceEntityId: sceneEntities[index]?.id,
        sourceEntityName: sceneEntities[index]?.name || 'Scene origin (synthetic)',
        targetEntityId: sceneEntities[index]?.id,
        latencyMs: 0,
        isHesitation: false,
        heatLevel: 0,
        temperature: 0,
        doneness: 0,
        activeQuestId: world.ir.activeQuestId || null,
        activeQuestStepIndex: index,
        isErrorRecovery: false,
      }));

  // Main local sample episode; it may combine recorded app interactions or the synthetic fallback above.
  const mainFrames = exportTraces.map((step, idx) =>
    mapTraceStepToLeRobotFrame(step, idx, exportTraces.length, idx > 0 ? exportTraces[idx - 1] : undefined, world)
  );

  episodes.push({
    episode_id: `wp-human-ep-001-${Date.now()}`,
    task_description: world.ir.activeQuestId ? `WorldPilot scene task: ${world.ir.activeQuestId}` : 'Synthetic WorldPilot scene trace',
    fps: 10,
    total_frames: mainFrames.length,
    success: (report.proceduralEfficiency ?? 80) >= 60,
    evaluation_score: report.proceduralEfficiency ?? 80,
    meta: {
      agent_platform: 'WorldPilot 3D Simulation Platform',
      world_version: world.version,
      multiverse_branches_count: counterfactualBranches.length,
      robot_embodiment_type: 'bimanual_kitchen_manipulator_dof7',
      date: new Date().toISOString()
    },
    frames: mainFrames
  });

  // Épisodes 2..N : Dérivations Contrefactuelles IA (Synthetic Policy Rollouts)
  counterfactualBranches.forEach((branch, bIdx) => {
    const branchSteps = branch.traces || [];
    const branchFrames: LeRobotFrame[] = branchSteps.map((st, fIdx) => {
      const prevSt = fIdx > 0 ? branchSteps[fIdx - 1] : undefined;
      const [px, py, pz, ry] = resolveStepPose(st, world);
      const [prevPx, prevPy, prevPz] = prevSt ? resolveStepPose(prevSt, world) : [px, py, pz];
      const deltaPosition: [number, number, number] = [
        Number((px - prevPx).toFixed(3)),
        Number((py - prevPy).toFixed(3)),
        Number((pz - prevPz).toFixed(3))
      ];
      return {
        frame_index: fIdx,
        timestamp: branch.createdAt + fIdx * 1000,
        observation: {
          state: [
            px,
            py,
            pz,
            ry,
            st.temperature ?? branch.snapshot.cookingTemperature,
            st.doneness ?? branch.snapshot.cookingDoneness,
            st.heatLevel ?? branch.snapshot.cookingHeatLevel
          ],
          active_affordances: [st.sourceEntityName || st.actionType || 'action'],
          camera_view: 'agent_head_view',
          language_instruction: `Autonomous policy rollout (${branch.botPersona || 'synthetic'})`
        },
        action: {
          delta_position: deltaPosition,
          tool_action: st.actionType || 'interact',
          intensity: 0.5
        },
        cognitive_telemetry: {
          hesitation_latency_ms: st.latencyMs || 400,
          cognitive_load_index: 30,
          error_recovery: !!st.isErrorRecovery
        },
        reward: branch.outcomeScore / 100,
        is_terminal: fIdx === branchSteps.length - 1
      };
    });

    episodes.push({
      episode_id: `wp-counterfactual-${branch.id}-${bIdx + 2}`,
      task_description: `Counterfactual Policy Rollout: ${branch.title}`,
      fps: 10,
      total_frames: branchFrames.length,
      success: branch.outcomeScore >= 70,
      evaluation_score: branch.outcomeScore,
      meta: {
        agent_platform: 'WorldPilot Decision Multiverse Engine',
        world_version: world.version,
        multiverse_branches_count: 1,
        robot_embodiment_type: 'autonomous_vla_agent',
        date: new Date(branch.createdAt).toISOString()
      },
      frames: branchFrames
    });
  });

  const totalFramesCount = episodes.reduce((acc, ep) => acc + ep.total_frames, 0);

  return {
    dataset_name: 'worldpilot_embodied_vla_dataset',
    format_version: 'worldpilot-spatial-demo/v1',
    episodes_count: episodes.length,
    total_frames: totalFramesCount,
    features: {
      'observation.state': 'Sequence(Float32, length=7)',
      'observation.active_affordances': 'Sequence(String)',
      'action.delta_position': 'Array(Float32, shape=(3,))',
      'action.tool_action': 'String',
      'reward': 'Float32',
      'cognitive_telemetry': 'Dict(hesitation=Int32, cli=Float32, recovery=Bool)'
    },
    episodes
  };
}

/**
 * Downloads a WorldPilot-specific JSON motion sample.
 */
export function triggerLeRobotDatasetDownload(dataset: LeRobotDatasetExport): void {
  if (typeof window === 'undefined') return;
  const jsonStr = JSON.stringify(dataset, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `worldpilot_spatial_demo_${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
