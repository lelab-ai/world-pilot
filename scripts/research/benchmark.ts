import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

type Version = 'v1' | 'v2';
type Snapshot = 'paper' | 'current';
type Action = 'benchmark' | 'replay';
type RunRecord = any;

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);

function option(name: string, fallback: string): string {
  const index = args.indexOf(name);
  return index === -1 ? fallback : args[index + 1] || fallback;
}

function assertChoice<T extends string>(value: string, choices: readonly T[], name: string): T {
  if (!choices.includes(value as T)) {
    throw new Error(`${name} must be one of: ${choices.join(', ')}`);
  }
  return value as T;
}

const snapshot = assertChoice(option('--snapshot', 'paper'), ['paper', 'current'], '--snapshot');
const version = assertChoice(option('--version', 'v2'), ['v1', 'v2'], '--version');
const action = assertChoice(option('--action', 'benchmark'), ['benchmark', 'replay'], '--action');
const isV2 = version === 'v2';
const source = snapshot === 'paper' ? path.join(root, 'paper/snapshot/src') : path.join(root, 'src');

if (snapshot === 'paper') {
  const manifestPath = path.join(root, 'paper/snapshot/SHA256SUMS.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as Record<string, string>;
  for (const [relativePath, expectedHash] of Object.entries(manifest)) {
    const file = path.join(root, 'paper/snapshot', relativePath);
    const actualHash = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
    if (actualHash !== expectedHash) throw new Error(`Frozen source integrity failure: ${relativePath}`);
  }
}

const datasetFile = `research/datasets/editOrderDataset${isV2 ? 'V2' : ''}.ts`;
const runnerFile = `research/editOrder/${isV2 ? 'v2/experimentRunnerV2' : 'experimentRunner'}.ts`;
const dataset = await import(pathToFileURL(path.join(source, datasetFile)).href);
const runner = await import(pathToFileURL(path.join(source, runnerFile)).href);

let cases = dataset[isV2 ? 'EDIT_ORDER_BENCHMARK_CASES_V2' : 'EDIT_ORDER_BENCHMARK_CASES'];
if (action === 'replay') {
  const caseId = option('--case', isV2 ? 'WP2-EO-001' : 'WP-EO-001');
  cases = cases.filter((testCase: { id: string }) => testCase.id === caseId);
  if (cases.length === 0) throw new Error(`Unknown case: ${caseId}`);
}

const conditions = isV2
  ? [
      'C0_NaiveSequential',
      'C_HASH_ONLY',
      'C_HASH_RECONCILED',
      'C_DEP_NO_HASH',
      'C4_DependencyAwareExecution',
      'C5_DependencyAwareMinimalRepair',
    ]
  : [
      'C0_NaiveSequential',
      'C1_FullHistory',
      'C2_MergedIntent',
      'C3_DependencyDetectionOnly',
      'C4_DependencyAwareExecution',
      'C5_DependencyAwareMinimalRepair',
    ];

const defaultOutput = path.join(
  root,
  'benchmark-results',
  `${snapshot}-${version}-${action}-${new Date().toISOString().replace(/[:.]/g, '-')}`,
);
const output = path.resolve(option('--out', defaultOutput));
if (fs.existsSync(output)) throw new Error(`Refusing to overwrite output directory: ${output}`);
fs.mkdirSync(output, { recursive: true });

const rawResults: RunRecord[] = [];
const summary: Array<{ condition: string; total: number; equivalent: number; satBoth: number }> = [];

for (const condition of conditions) {
  const runs: RunRecord[] = [];
  for (const testCase of cases) {
    const result = isV2
      ? await runner.runPermutationExperimentV2(testCase, { condition })
      : await runner.runPermutationExperiment(testCase, condition);
    runs.push(result);
    rawResults.push(result);
  }

  const row = {
    condition,
    total: runs.length,
    equivalent: runs.filter(run => run.comparison.equivalent).length,
    satBoth: runs.filter(run => run.repair.satisfiedA && run.repair.satisfiedB).length,
  };
  summary.push(row);
  console.log(JSON.stringify(row));
}

fs.writeFileSync(path.join(output, 'raw_results.jsonl'), `${rawResults.map(run => JSON.stringify(run)).join('\n')}\n`);
fs.writeFileSync(path.join(output, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
fs.writeFileSync(
  path.join(output, 'main_conditions.csv'),
  `Condition,TotalCases,EquivalenceCount,SatisfiedBothCount\n${summary
    .map(row => [row.condition, row.total, row.equivalent, row.satBoth].join(','))
    .join('\n')}\n`,
);

let differences: Array<{ condition: string; expected: object; actual: object }> = [];
if (isV2 && action === 'benchmark') {
  const referenceFile = path.join(root, 'paper/reference_main_conditions.csv');
  const lines = fs.readFileSync(referenceFile, 'utf8').trim().split(/\r?\n/);
  const columns = lines.shift()!.split(',');
  const reference = new Map(lines.map(line => {
    const values = line.split(',');
    return [values[0], values] as const;
  }));

  differences = summary.flatMap(row => {
    const values = reference.get(row.condition);
    if (!values) throw new Error(`Missing reference condition: ${row.condition}`);
    const expected = {
      total: Number(values[columns.indexOf('TotalCases')]),
      equivalent: Number(values[columns.indexOf('EquivalenceCount')]),
      satBoth: Number(values[columns.indexOf('SatisfiedBothCount')]),
    };
    return row.total === expected.total && row.equivalent === expected.equivalent && row.satBoth === expected.satBoth
      ? []
      : [{ condition: row.condition, expected, actual: row }];
  });
}

fs.writeFileSync(path.join(output, 'paper_comparison.json'), `${JSON.stringify({ snapshot, version, differences }, null, 2)}\n`);

let commit = 'unavailable';
try {
  commit = execFileSync('git', ['rev-parse', 'HEAD'], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();
} catch {
  // Source archives may not contain .git metadata.
}
const packageLockHash = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, 'package-lock.json'))).digest('hex');
fs.writeFileSync(
  path.join(output, 'manifest.json'),
  `${JSON.stringify({
    snapshot,
    version,
    action,
    commit,
    node: process.version,
    packageLockSha256: packageLockHash,
    cases: cases.length,
    conditions,
    created: new Date().toISOString(),
    sourceIntegrityChecked: snapshot === 'paper',
  }, null, 2)}\n`,
);

console.log(`Output: ${output}`);
console.log(`Paper-reference differences: ${differences.length}`);
if (snapshot === 'paper' && differences.length > 0) process.exitCode = 1;
