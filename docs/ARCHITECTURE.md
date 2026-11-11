# WorldPilot Architecture Overview

## Product Priority

WorldPilot is built first as an intuitive, high-performance browser authoring tool and spatial compiler for the Victoria VR hackathon.

Research observability and verifiable causal modeling are integrated as core engineering capabilities, ensuring that runtime state, event cascades, and physics stay deterministic across multi-turn interactions.

The architecture is designed to optimize for:

1. A reliable end-to-end natural-language authoring experience;
2. Deterministic, collision-accurate executable behavior at 60 FPS (WebGL/WebXR);
3. Clear provenance, inspection, and rollback of spatial edits;
4. Fast, client-side consistency and invariant checks;
5. Open-standard interoperability (GLTF 2.0 / USD / JSON-LD) bridging web authoring into Victoria VR (Unreal Engine 5).

---

## Repository Structure

```text
src/
├── core/            # WorldIR data models, EntitySpec, capabilities, rules, and patches
├── authoring/       # Natural language parser, AST grounding, and LLM edge client
├── engine/          # Deterministic state machine, evaluator, audio, quests, and invariants
├── scene/           # React Three Fiber, Three.js renderer, Rapier Wasm physics, and procedural shaders
├── simulation/      # Local simulator, synthetic playtester, and counterfactual explorer
├── observability/   # Causality tracker, edit recording, and live state inspection
├── ui/              # Desktop HUD, spatial inspector, node-graph editor, and Gatekeeper modal
└── library/         # 500-model procedural catalog, visual archetypes, and material presets
functions/
└── api/llm.ts       # Cloudflare Pages serverless edge proxy (zero client key exposure)
```

## Core: Semantic Source of Truth

The canonical representation of any WorldPilot environment is the **WorldIR (World Intermediate Representation)**, rather than mutable runtime Three.js scene-graph objects.

- **`EntitySpec`**: Unique entity ID, display name, physical capabilities (transform, collider, kinematic, trigger_zone), visual archetypes, and procedural dimensions.
- **`RuleSpec`**: Deterministic causal rules binding an event (e.g. `COLLISION`, `DROP`, `PROXIMITY`) to conditions and actions (`play_sound`, `mint_nft`, `set_flag`, `show_warning`).
- **`Invariants`**: Formal safety and pedagogical contracts ensuring that goals cannot be achieved without meeting prerequisite physical or state conditions.
- **`WorldPatch`**: Atomic diffs expressing entity creations, removals, modifications, rule changes, and active quest transitions.

## Authoring: Prompt-to-IR Compiler

```text
Natural language prompt (or voice) + spatial context ("THIS", "HERE") + active WorldIR
      ↓
Intent parsing & entity grounding against surface heights (e.g. table=0.912m)
      ↓
CommandPlan & validated WorldPatch
      ↓
Local verification & deterministic patch application
```

Rather than generating arbitrary, unverified code that frequently crashes 3D runtimes, WorldPilot compiles natural language into strongly-typed, verifiable JSON patches that modify the WorldIR cleanly.

## Engine: Deterministic Execution Runtime

```text
Event → Rules → Conditions → Actions → Updated WorldState & Causal Graph
```

The runtime executes deterministically at 60 FPS using Rapier WebAssembly physics. The user can interact via 6-DoF mouse/touch drag-and-drop or WebXR controllers. Causal state updates are reactive, powering HUD alerts, sound synthesis, and multi-step quest progressions.

## Cloud & Edge Architecture

In production, LLM inference calls are routed through a serverless edge proxy (`/api/llm` on Cloudflare Pages Functions). API credentials (`DEEPSEEK_API_KEY`) and evaluation passcodes (`ACCESS_PASSCODE`) reside exclusively in encrypted serverless environment variables, ensuring zero credential leakage in client-side bundles or public repositories.
