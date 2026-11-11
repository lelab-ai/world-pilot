# WorldPilot public hands-on

This guide follows the public repository build. It covers the two included demo scenes: a car-battery workshop and a 42 L travel-bag showcase.

## Before you start

Run WorldPilot in a desktop browser with `npm ci` and `npm run dev` (see the repository README). Use the **Your intent** field to enter prompts. The app combines English and French labels in places; the quoted English commands below are recognized by the deterministic local parser. Voice input and an external LLM are not required for these steps.

Some panels are demonstrations or heuristics. The Observatory buttons simulate example events; the playtester and readiness panel are local tools. They do not represent real user studies, physical VR gesture recognition, Victoria VR certification, or the EO-Bench paper's aggregate results.

## 1. Build the battery workshop and inspect its rules

1. Enter `clear` and press Enter.
2. Enter `Show how to change a car battery` and press Enter.
3. Check the scene list and Quest HUD. The public build creates a car, battery-tray zone, workbench, and battery, along with a two-step quest, two rules, and an invariant.
4. Select the battery and use the Quest HUD's **Launch action** button to advance the first task. The HUD and causal state should update.
5. Open **Observability & Causality** at the bottom-right. Inspect the current flags, rules, and invariant. Where the panel offers a flag toggle or rule simulation, use it to observe the state change.

## 2. Try an invariant counterexample

1. In **Your intent**, enter `Nobody should complete this training without inspecting the battery`.
2. Enter `Try to break this experience`.
3. Inspect the counterexample and invariant status in the observability panel.
4. Enter `Lock battery inspection before finishing the training`, then run the break check again.

The counterexample search is bounded by the application's configured search depth. Treat its result as a local check, not a general proof that every possible interaction is safe.

## 3. Compare edit order in the interactive lab

1. Enter `test ab ba` to open **Edit-Order Commutativity Lab**.
2. Click **Simulate C0 Naive** and then **Simulate C5 WorldPilot**.
3. Compare the result for the currently selected built-in case and close the panel.

This panel is a small interactive illustration using its own built-in cases. Its bar-chart percentages are not the EO-Bench v2.5 paper results. To reproduce the paper's fixed 200-case table, use `npm run research:paper` as described in the README.

## 4. Inspect spatial repair

1. In the workshop, enter `Move the workbench right in front of the engine compartment`.
2. Inspect the resulting scene and local diagnostics.
3. Enter `Fix the spatial conflict without cancelling my intent` and inspect the resulting scene again.

The repair is an application heuristic. Do not interpret a visual change as a measured clearance or a formal Pareto guarantee.

## 5–6. Explore the Observatory examples

1. Click **Observatory** in the top navigation.
2. In **1. Anti-Disposable (E1➔E2)**, click **Simulate H1 Trap**, **Simulate H2 Mastery**, and **Mutate 3D Scene to E2**. These buttons run scripted example transitions; H1/H2 are not live Bayesian estimates from a user study.
3. In **2. Neuro-Symbolic**, click **Trace 3D Intention Arc**, then **Compile to Rule**. This runs the panel's simulated intention-arc flow. It is not a tracked physical VR gesture.
4. Return to **Observability & Causality** to inspect any resulting rule or state changes.

## 7. Run local playtesting and readiness checks

1. Open **Agents** in the top navigation and choose **Heuristic Scenario Playtester**, or enter `playtest` in **Your intent**.
2. Review the heuristic path checks and suggested patch in the modal.
3. Open **WorldPilot Local Readiness** from **Agents** and review its checks. A JSON report can be downloaded from the panel.

The personas and readiness checks are local heuristics. The report is not an official Victoria VR certification or approval.

## 8. Load the bag scene and export a robotics-oriented JSON sample

1. Enter `Show the capacity of a 42L travel bag` in **Your intent**.
2. Confirm the scene list contains the 42 L bag, laptop, bottle, oversized box, and display table.
3. Click **Observatory** and open **3. Robotics (JSON Sample)**.
4. Click **Generate Sample Trace**, then **Export WorldPilot JSON Sample**. Confirm that the browser downloads a JSON file.

This walkthrough checks that the public demo scene and WorldPilot JSON export path are available. The file uses a WorldPilot-specific schema; it is not a Hugging Face LeRobot/Open-X dataset, a real robot session, a measured ergonomics result, or a validated physical 1:1 insertion test. The validator checks only that WorldPilot sample's structure.

## Research benchmark commands

The public source includes a separate reproducibility runner for EO-Bench v2.5:

```bash
npm run research:paper
npm run research:v2:benchmark
npm run research:v2:replay -- --case WP2-EO-001
```

The paper command checks the frozen snapshot hashes and the six aggregate rows. It does not rerun every ablation or supplementary geometric audit; see [`paper/README.md`](../paper/README.md).
