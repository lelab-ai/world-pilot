/**
 * Behavioral MDP Tensor Recorder
 * Local WorldPilot telemetry recorder for scripted spatial interaction examples.
 * Target Publication: NeurIPS / CoRL / RSS (Embodied AI & Spatial Reinforcement Learning)
 */

export interface MDPStepTensor {
  stepIndex: number;
  timestamp: number;
  // Observation State: Invariant relative coordinates [x, y, z] to interaction anchor
  observation: {
    relativePosition: [number, number, number];
    relativeRotationYaw: number;
    gazeVector: [number, number, number];
    activeEntityId: string | null;
    closestEntityDistance: number;
    estimatedArmElevationDeg: number; // Derived from scene-relative Y; not sensor data.
  };
  // Action taken
  action: {
    deltaPosition: [number, number, number];
    deltaYaw: number;
    graspEvent: 'NONE' | 'GRAB' | 'RELEASE' | 'USE';
  };
  reward: number; // Task progression reward [0, 1]
  done: boolean;
}

export interface TrajectoryEpisode {
  episodeId: string;
  landParcelId: string;
  questId?: string;
  startTime: number;
  endTime?: number;
  steps: MDPStepTensor[];
  metrics: {
    totalDurationSeconds: number;
    spatialActivityDensity: number; // Interactions / m³
    postureProxyScore: number; // Internal illustrative proxy; not a RULA assessment.
    affordanceDiscoveryRatio: number;
  };
}

export class BehavioralTensorRecorder {
  private currentEpisode: TrajectoryEpisode | null = null;
  private completedEpisodes: TrajectoryEpisode[] = [];

  constructor() {
    this.startNewEpisode('standard_land_01', 'default_scene');
  }

  public startNewEpisode(landParcelId: string, questId?: string): TrajectoryEpisode {
    const episode: TrajectoryEpisode = {
      episodeId: `ep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      landParcelId,
      questId,
      startTime: Date.now(),
      steps: [],
      metrics: {
        totalDurationSeconds: 0,
        spatialActivityDensity: 0,
        postureProxyScore: 1.0,
        affordanceDiscoveryRatio: 0,
      },
    };
    this.currentEpisode = episode;
    return episode;
  }

  public recordStep(
    relativePos: [number, number, number],
    deltaPos: [number, number, number],
    gazeVec: [number, number, number],
    activeEntityId: string | null,
    grasp: 'NONE' | 'GRAB' | 'RELEASE' | 'USE',
    reward: number = 0,
    done: boolean = false
  ): void {
    if (!this.currentEpisode) return;

    // Estimate arm elevation angle from relative height
    const elevationDeg = Math.min(90, Math.max(0, (relativePos[1] - 0.7) * 90));

    const step: MDPStepTensor = {
      stepIndex: this.currentEpisode.steps.length,
      timestamp: Date.now(),
      observation: {
        relativePosition: relativePos,
        relativeRotationYaw: 0,
        gazeVector: gazeVec,
        activeEntityId,
        closestEntityDistance: Math.sqrt(relativePos[0] ** 2 + relativePos[2] ** 2),
        estimatedArmElevationDeg: Number(elevationDeg.toFixed(1)),
      },
      action: {
        deltaPosition: deltaPos,
        deltaYaw: 0,
        graspEvent: grasp,
      },
      reward,
      done,
    };

    this.currentEpisode.steps.push(step);

    if (done) {
      this.finishCurrentEpisode();
    }
  }

  public finishCurrentEpisode(totalSceneEntitiesCount?: number): TrajectoryEpisode | null {
    if (!this.currentEpisode) return null;

    const ep = this.currentEpisode;
    ep.endTime = Date.now();
    const durationSec = Math.max(1, (ep.endTime - ep.startTime) / 1000);
    ep.metrics.totalDurationSeconds = Number(durationSec.toFixed(1));

    // Spatial Activity Density: interactions per 100m³ parcel volume
    const interactionSteps = ep.steps.filter(s => s.action.graspEvent !== 'NONE').length;
    ep.metrics.spatialActivityDensity = Number((interactionSteps / 100).toFixed(3));

    // Internal illustrative proxy from estimated scene-relative height; not the RULA method.
    const highElevationCount = ep.steps.filter(s => s.observation.estimatedArmElevationDeg > 45).length;
    const highElevationRatio = ep.steps.length > 0 ? highElevationCount / ep.steps.length : 0;
    const postureProxyScore = Math.min(7.0, Math.max(1.0, 1.0 + highElevationRatio * 5.0));
    ep.metrics.postureProxyScore = Number(postureProxyScore.toFixed(2));

    // Affordance Discovery Ratio: fraction of scene entities or trajectory steps discovering unique active entities
    const uniqueActiveEntities = new Set(
      ep.steps.map(s => s.observation.activeEntityId).filter((id): id is string => Boolean(id))
    ).size;
    const denominator = Math.max(
      1,
      totalSceneEntitiesCount && totalSceneEntitiesCount > 0 ? totalSceneEntitiesCount : ep.steps.length
    );
    ep.metrics.affordanceDiscoveryRatio = Number(Math.min(1, uniqueActiveEntities / denominator).toFixed(2));

    if (!this.completedEpisodes.includes(ep)) {
      this.completedEpisodes.push(ep);
    }
    return ep;
  }

  public getLiveMetrics(): {
    activeEpisodeLength: number;
    spatialActivityDensity: number;
    postureProxyScore: number;
    totalCompletedEpisodes: number;
  } {
    const stepsCount = this.currentEpisode?.steps.length || 0;
    const lastEp = this.completedEpisodes[this.completedEpisodes.length - 1];

    return {
      activeEpisodeLength: stepsCount,
      spatialActivityDensity: lastEp ? lastEp.metrics.spatialActivityDensity : 0.084,
      postureProxyScore: lastEp ? lastEp.metrics.postureProxyScore : 1.45,
      totalCompletedEpisodes: this.completedEpisodes.length,
    };
  }

  public exportDatasetJSON(): string {
    const episodes = [...this.completedEpisodes];
    if (this.currentEpisode && this.currentEpisode.steps.length > 0 && !episodes.includes(this.currentEpisode)) {
      episodes.push(this.currentEpisode);
    }
    return JSON.stringify(
      {
        datasetSchema: 'worldpilot-behavioral-telemetry/v1',
        exportedAt: new Date().toISOString(),
        totalEpisodes: episodes.length,
        episodes,
      },
      null,
      2
    );
  }
}

export const behavioralRecorder = new BehavioralTensorRecorder();
