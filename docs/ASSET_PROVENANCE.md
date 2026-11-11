# WorldPilot 3D Asset Provenance

Last updated: October 2026

## GLB 3D Assets

All GLB 3D models bundled with WorldPilot were created directly by the WorldPilot project. They are not models downloaded from Sketchfab, TurboSquid, or external third-party commercial repositories. The corresponding asset files are located in `public/library/` and cataloged in `src/library/`.

Scenes may also include procedural geometries generated at runtime by Three.js components in `src/scene/`.

## Scope

This statement covers GLB objects packaged with the project. Software dependencies, fonts, audio cues, and web textures adhere to their respective open-source licenses as documented in `THIRD_PARTY_NOTICES.md`.

All bundled 3D assets are released under the Apache 2.0 license.

## Verification

To verify asset distribution, inspect the GLB paths referenced in `public/library/manifest.json` and `src/library/catalog.ts`. All procedural models and source generators are included in this repository.
