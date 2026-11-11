# EO-Bench reproduction files

This folder contains a bounded, reproducible package for the paper's main EO-Bench v2.5 condition table.

## Reproduce

From the repository root, install the lockfile dependencies and run:

```bash
npm ci
npm run research:paper
```

The command verifies each file listed in `snapshot/SHA256SUMS.json`, evaluates all 200 cases under the six reported main conditions, writes per-run records and aggregate files under a new `benchmark-results/` directory, and compares aggregate equivalence and joint-satisfaction counts with `reference_main_conditions.csv`. A mismatch exits with a non-zero status.

For one case, run:

```bash
npm run research:v2:replay -- --case WP2-EO-001
```

## What is frozen here

`snapshot/src/` is the dependency closure for the v2.5 dataset, current experiment runner, state/equivalence logic, and the generic helpers needed by those files. It is intentionally independent of the private 3D model library. `snapshot/SHA256SUMS.json` records the SHA-256 digest for every included source file.

`reference_main_conditions.csv` records the six aggregate rows to compare against. The execution script also supports the current source tree (`npm run research:v2:benchmark`) to make implementation drift visible.

## Scope and limits

This package reproduces the paper's six main-condition aggregate table and preserves case-level run records. It is not a complete archival copy of every artifact cited by the paper: ablation tables, geometric validation, lexical baselines, and supplementary audits are outside this runner's scope. The benchmark is a fixed synthetic set for one implementation; its results do not establish prevalence in other systems. Equivalence and satisfaction are computed using the implementation's internal evaluators.

The interactive **Edit-Order Commutativity Lab** in the application is a separate, smaller demonstration. Its built-in bars must not be cited as the v2.5 paper results.
