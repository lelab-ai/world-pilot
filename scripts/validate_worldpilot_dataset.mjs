#!/usr/bin/env node

/**
 * Structural checks for the JSON samples exported by WorldPilot.
 * This does not validate Hugging Face LeRobot/Open-X compatibility, robot data,
 * physical ergonomics, or platform requirements.
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const sample = {
  dataset_name: 'worldpilot_spatial_demo_dataset',
  format_version: 'worldpilot-spatial-demo/v1',
  episodes_count: 1,
  total_frames: 1,
  features: {},
  episodes: [{
    episode_id: 'sample-episode',
    task_description: 'Synthetic example',
    fps: 10,
    total_frames: 1,
    success: true,
    evaluation_score: 1,
    meta: { agent_platform: 'WorldPilot simulation', world_version: 1, multiverse_branches_count: 0, robot_embodiment_type: 'simulated', date: new Date().toISOString() },
    frames: [{
      frame_index: 0,
      timestamp: Date.now(),
      observation: { state: [0, 0, 0, 0, 0, 0, 0], active_affordances: [], camera_view: 'synthetic', language_instruction: 'Synthetic example' },
      action: { delta_position: [0, 0, 0], tool_action: 'sample', intensity: 0 },
      cognitive_telemetry: { hesitation_latency_ms: 0, cognitive_load_index: 0, error_recovery: false },
      reward: 0,
      is_terminal: true,
    }],
  }],
};

const input = process.argv[2];
if (input && !existsSync(resolve(input))) {
  console.error(`File not found: ${input}`);
  process.exit(1);
}
const data = input ? JSON.parse(readFileSync(resolve(input), 'utf8')) : sample;
console.log(input ? `Checking WorldPilot JSON file: ${input}` : 'Checking the built-in WorldPilot JSON example.');

const results = [];
const check = (name, ok) => results.push({ name, ok: Boolean(ok) });
const episodes = data?.episodes;
check('WorldPilot export schema identifier is supported', data?.format_version === 'worldpilot-spatial-demo/v1');
check('Episode list is present and non-empty', Array.isArray(episodes) && episodes.length > 0);
check('Declared episode count matches the list', Array.isArray(episodes) && data.episodes_count === episodes.length);

let validEpisodeTotals = Array.isArray(episodes) && episodes.length > 0;
let validFrames = validEpisodeTotals;
let terminalFrames = validEpisodeTotals;
let actualFrames = 0;
for (const episode of episodes || []) {
  const frames = episode?.frames;
  if (!Array.isArray(frames) || frames.length === 0 || episode.total_frames !== frames.length) {
    validEpisodeTotals = false;
    validFrames = false;
    continue;
  }
  actualFrames += frames.length;
  for (const frame of frames) {
    const state = frame?.observation?.state;
    const delta = frame?.action?.delta_position;
    if (!Array.isArray(state) || state.length !== 7 || !Array.isArray(delta) || delta.length !== 3 || typeof frame.reward !== 'number') {
      validFrames = false;
    }
  }
  if (frames[frames.length - 1]?.is_terminal !== true) terminalFrames = false;
}
check('Each episode frame count matches its frames', validEpisodeTotals);
check('Frames have the required WorldPilot state/action structure', validFrames);
check('Declared total frame count matches the export', actualFrames > 0 && data.total_frames === actualFrames);
check('Every episode ends with a terminal frame', terminalFrames);

for (const result of results) {
  console.log(`${result.ok ? 'PASS' : 'FAIL'}: ${result.name}`);
}
console.log(`\n${results.filter(result => result.ok).length}/${results.length} structural checks passed.`);
console.log('These checks do not establish LeRobot/Open-X compatibility or validate real robot or ergonomics data.');
if (results.some(result => !result.ok)) process.exitCode = 1;
