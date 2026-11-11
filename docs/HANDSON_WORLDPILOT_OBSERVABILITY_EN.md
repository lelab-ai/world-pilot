# WorldPilot hands-on: what the prototype demonstrates

This note explains the visible parts of the public WorldPilot prototype and how to interpret them. For the exact click-by-click flow, use the [public hands-on checklist](HANDSON_CHECKLIST_TEST_EN.md).

## The problem being explored

Editing a 3D world through successive instructions can leave earlier objects, rules, or goals out of sync with later edits. WorldPilot represents the scene and its rules as application state, applies supported edits to that state, and offers local panels for inspecting selected changes.

The public hands-on makes this concrete with two scripted examples:

- A battery-replacement workshop with a two-step quest, rules, and an inspection invariant.
- A 42 L travel-bag showcase with a bag, laptop, bottle, oversized box, and a WorldPilot-specific JSON sample export.

The prototype's English parser uses deterministic local rules for these supported prompts. It does not require an external language model for the checklist.

## What the panels do

### Observability & Causality

The panel displays selected world flags, rules, and invariants. Depending on the scene state, it offers actions to toggle a flag or manually simulate a rule. This is a debugger for the current application state; the displayed state is not an independent external oracle.

### Counterexample search

The workshop can search a bounded set of action sequences for a violation of the configured invariant. A found trace is useful evidence that the current rule set has a flaw. A clean search means no counterexample was found within the configured search space and depth; it does not prove safety for all possible actions.

### Edit-Order Commutativity Lab

Typing `test ab ba` opens an interactive comparison for a selected built-in case. Its chart and buttons illustrate differences between the local C0 and C5 conditions. This panel uses a smaller demonstration set and its own displayed figures. **Do not cite those figures as EO-Bench v2.5 results.**

The paper benchmark is a separate command-line runner over 200 fixed cases. `npm run research:paper` checks the frozen source hashes and reproduces the six main-condition aggregate rows. `paper/README.md` defines exactly what is and is not included in that reproduction.

### Spatial repair

The workshop prompts can trigger a scripted spatial-conflict example and a local repair response. Treat the visual outcome as a prototype heuristic. The current public hands-on does not measure real-world clearance, establish a Pareto optimum, or guarantee that arbitrary scene edits preserve intent.

### Observatory

The three Observatory tabs provide scripted demonstrations:

- **Anti-Disposable (E1➔E2):** buttons simulate H1 and H2 example events and an E2 scene transition. The gauges are not live measurements of a participant's understanding or results from a user study.
- **Neuro-Symbolic:** the intention-arc and compile-to-rule controls demonstrate an application flow. They do not track physical controller motion or establish real VR gesture recognition.
- **Robotics (JSON Sample):** a button creates a synthetic trace and another downloads a WorldPilot-specific JSON sample. The file is not in the Hugging Face LeRobot/Open-X format and is not a physical robot recording.

### Synthetic playtester and readiness panel

The playtester runs local heuristic checks and shows suggested paths or patches. The readiness panel summarizes application-defined checks and can export a JSON report. Neither is an official Victoria VR certification, an independent usability study, or a platform publishing decision.

## Research scope and limits

EO-Bench v2.5 is a fixed synthetic benchmark for one language-driven 3D authoring implementation. Its equivalence and satisfaction metrics are calculated using that implementation's internal evaluators. The benchmark does not establish how common edit-order sensitivity is in other systems, and the geometric checks should not be described as visual user evaluation.

For reproducibility:

```bash
npm ci
npm run research:paper
npm run research:v2:benchmark
npm run research:v2:replay -- --case WP2-EO-055
```

`research:paper` evaluates the frozen paper snapshot. `research:v2:benchmark` evaluates the current public source. Both write raw runs to a new timestamped directory under `benchmark-results/`; those generated files are local and ignored by Git.

## Claims to avoid

When presenting the current public prototype, do not describe its demo controls as:

- real-time external LLM reasoning (for the deterministic hands-on prompts);
- physical VR gesture sensing or a measured 1:1 bag insertion study;
- a proof of unrestricted scene safety or a measured general-purpose repair optimum;
- official Victoria VR certification;
- the complete set of EO-Bench paper analyses or supplementary audits.

The [checklist](HANDSON_CHECKLIST_TEST_EN.md) and [paper reproduction notes](../paper/README.md) are the operational sources of truth for the public hands-on and benchmark commands.
