# WorldPilot

> **WorldPilot v1.0 is an open reference release published for the Victoria VR Hackathon and the EO-Bench research paper.**

WorldPilot is a browser based editor for interactive 3D scenes. It combines natural language authoring, a Three.js/React Three Fiber viewport, physics interactions, and local tools for inspecting scene rules and testing selected interactions.

The project was built for the Victoria VR hackathon. The current repository is a prototype: test results, heuristics and local readiness checks should be described according to what they actually measure, not as platform certification or a formal proof.

## Watch the hands-on walkthrough

**[Watch or download the WorldPilot Hands-On video (MP4)](docs/video/WorldPilot_HandsOn_EN.mp4)** — 4 min 01 s, 1600 × 900, approximately 20 MB, without an audio track.

This video accompanies the **[English step-by-step hands-on checklist](docs/HANDSON_CHECKLIST_TEST_EN.md)**. Watch it for a visual walkthrough of the application, then follow the checklist to reproduce the hands-on exercises locally. The written guide provides the commands, expected observations and individual checks.

The hands-on has two blocks: Hands-On 1–7 share the mechanical-workshop scene, while Hands-On 8 starts a new travel-bag and robotics scene. The detailed [Observability & Causality guide](docs/HANDSON_WORLDPILOT_OBSERVABILITY_EN.md) explains the mechanisms behind the exercises.

The recording is stored in [`docs/video/`](docs/video/). If GitHub does not show an inline player, open the video file and use **Download raw file** to play it locally. The video becomes available through the repository once the file and this README are committed and pushed.

For the hackathon submission, prepare a separate cut under three minutes. This longer walkthrough remains the documentation video.

## What is in the prototype

- Create and edit scene entities with text and voice instructions.
- Inspect world state and interaction rules.
- Run heuristic playtest scenarios and view their limitations.
- Review local scene readiness checks and export a report.
- Explore bundled GLB objects created directly by WorldPilot, alongside procedural Three.js models.
- Use the browser based 3D viewport and its WebXR entry point where supported.

## Architecture

```text
Prompt / voice
      ↓
Instruction parser and optional language model
      ↓
WorldIR and validated WorldPatch
      ↓
Three.js / React Three Fiber scene + Rapier physics
      ↓
Rule evaluation, heuristic playtesting, local diagnostics
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for implementation context and design principles. Asset provenance is documented in [docs/ASSET_PROVENANCE.md](docs/ASSET_PROVENANCE.md) and third-party open-source notices in [docs/THIRD_PARTY_NOTICES.md](docs/THIRD_PARTY_NOTICES.md).

## Hands-On Guides & Documentation

All project documentation is located in the [`docs/`](docs/) directory:
- **[Step-by-Step Test Checklist](docs/HANDSON_CHECKLIST_TEST_EN.md)**: Concise step-by-step walkthrough to reproduce the complete demo (Hands-On 1 to 8).
- **[Complete Observability & Causality Guide](docs/HANDSON_WORLDPILOT_OBSERVABILITY_EN.md)**: Comprehensive architectural guide detailing the 4 pillars, formal counter-examples, AB/BA commutativity, and Bayesian mutations.
- **[Victoria VR Hackathon Presentation (PPTX)](docs/WorldPilot_VictoriaVR_Hackathon_Product_Research_EN.pptx)** & **[Pitch Script (Markdown)](docs/PITCH_DECK_HACKATHON_VICTORIA_VR.md)**.
- **[Scientific Research Paper (Preprint DOI: 10.5281/zenodo.24059294)](https://doi.org/10.5281/zenodo.24059294)**: *Edit Order Sensitivity in Language-Driven Executable 3D Worlds: A Benchmark for Cross-Layer Semantic-State Divergence* (5-page formal benchmark on EO-Bench v2.5, $N=200$).

## Run locally

Requirements: Node.js 18+ and npm.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. Build and verification commands are listed in `package.json`; run them from the project root when you need to verify a change.

## Scope and limits

The scene tests are bounded heuristics and do not replace testing by a person in the target browser or headset. Local readiness reports are not an official Victoria VR publication decision. Check dependency notices and review the assets actually included in any public build.
