# WorldPilot · Hackathon Submission Overview

**Project:** WorldPilot  
**Context:** Victoria VR AI Builder Hackathon 2026  
**Repository:** https://github.com/lelab-ai/world-pilot  
**Hosted Demo:** https://worldpilot.lelab.ai (Mirror: https://worldpilot.pages.dev)  
**Demo Evaluation Passcode:** Provided confidentially in the official submission form (Field 9) to protect serverless API quotas.  
**Hands-On Walkthrough Video:** [WorldPilot_HandsOn_EN.mp4](video/WorldPilot_HandsOn_EN.mp4) — 4 min 01 s, ~20 MB, accompanying the [English test checklist](HANDSON_CHECKLIST_TEST_EN.md).  
**Short Submission Video (< 3 min):** Condensed recording derived from the primary walkthrough.  

## Description

WorldPilot is an open-ended, browser-based AI spatial engine and authoring environment for creating and inspecting interactive 3D worlds. Natural language instructions compile into declarative 3D scene graphs (World IR), procedural geometries, physical colliders (Rapier Wasm), causal interaction rules, and step-by-step quests at 60 FPS in WebGL/WebXR.

The engine enables creators and educators to prototype interactive cyber-physical simulations rapidly in the browser before exporting structured scenes and behavioral rules to Victoria VR (Unreal Engine 5).

## Recommended Evaluation Flow

1. Open https://worldpilot.lelab.ai and enter the evaluation passcode.
2. Enter an intent prompt (e.g. `"Show how to change a car battery"`, `"construire une fusée"`, or `"Create an electrical maintenance challenge with seed #402"`).
3. Test physical interactions: grab, drag, and drop 3D entities with collision physics.
4. Complete guided quest objectives on the HUD.
5. Press F2 to inspect the real-time Causal Observability HUD, invariant verification, and behavioral graphs.

## Presentation & Scientific Materials

- [Product & Research Presentation (PPTX)](WorldPilot_VictoriaVR_Hackathon_Product_Research_EN.pptx)
- [Pitch Script & Video Walkthrough Guide](PITCH_DECK_HACKATHON_VICTORIA_VR.md)
- **Author:** Bruno DELB — brunodelb@gmail.com
- **Research Paper (Zenodo DOI):** https://zenodo.org/records/24059294
