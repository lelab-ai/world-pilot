# WorldPilot 3D Asset Library

WorldPilot bundles 500 procedural 3D models: 80 core apparatus assets and 420 additional objects organized across 21 domain collections. Each asset features a standalone GLB file and an SVG thumbnail in `public/library/`. The asset manifest (`public/library/manifest.json`) details exported bounding dimensions and file sizes.

## Usage

Open **Library · 500** in the top navigation bar. Search for an asset or filter by category, then click "Add" to spawn it in the active scene. Selecting an entity in the scene or entity list allows adjusting position (in meters), rotation, scale, and color accents.

Local natural-language commands recognized deterministically include: `Add a detachable pump`, `Add an office armchair`, `Create a classroom`. More complex requests route to the configured LLM, which has contextual access to all 500 catalog entries.

Certain assets feature specialized interactive affordances: exploded mechanical views, toggleable doors and chests, quiz modules (A/B/C testing), animated breathing spheres, and timer controls.

## Architecture & Maintenance

- `src/library/catalog.ts`: Catalog schema, placement heuristics, entity instantiation, and rule mapping.
- `src/library/models.ts`: Shared Three.js geometries and procedural materials.
- `src/library/LibraryModel.tsx`: In-scene rendering and animations.
- `src/library/LibraryPanel.tsx`: Interactive asset browser, inspector, and demonstrations.
- `scripts/generate-library.ts`: Reproducible GLB compilation and SVG thumbnail generator.
- `public/library/manifest.json`: Asset inventory and validation metadata.

`npm run generate:library` regenerates the library assets. `npm run test:library` verifies all 500 models, GLB reimport integrity, grounded origins, unique identifiers, and state persistence.

## Scope & Boundaries

These assets are procedural PBR representations designed for real-time 60 FPS WebGL/WebXR performance, not high-polygon photogrammetric scans. Assemblies and demonstrations are illustrative mechanisms suitable for training and interactive spatial simulation.
