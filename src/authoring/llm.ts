import { fullCatalog, resolveCanonicalAssetId } from '../library/catalog';
import { GoogleGenAI } from '@google/genai';
import { WorldPatch, EntitySpec } from '../core/types';
import { CommandPlan } from './parser';
import config from '../worldpilot.config.json';

function getEnvKey(key: string): string {
  if (typeof (import.meta as any) !== 'undefined' && (import.meta as any).env && (import.meta as any).env[key]) {
    return (import.meta as any).env[key];
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key]!;
  }
  return '';
}

export function getDeepSeekKey(): string {
  return getEnvKey('VITE_DEEPSEEK_API_KEY');
}

export function getGeminiKey(): string {
  return getEnvKey('VITE_GEMINI_API_KEY');
}

export function hasLLMKey(): boolean {
  return true;
}

let ai: any = null;
function getGeminiClient(): any {
  const key = getGeminiKey();
  if (key && !ai) {
    ai = new GoogleGenAI({ apiKey: key });
  }
  return ai;
}

let INVENTORY_CONTEXT = "";
for (const [category, items] of Object.entries(config.inventory)) {
  INVENTORY_CONTEXT += `\n[${category.toUpperCase()}]\n`;
  for (const [name, url] of Object.entries(items)) {
    INVENTORY_CONTEXT += `- "${name}": ${url}\n`;
  }
}

const SYSTEM_PROMPT = `
You are the intelligence core of WorldPilot, an AI authoring system for interactive 3D environments.
Your job is to translate the user's natural language instruction into a precise JSON patch that modifies the World IR.

Capabilities & Schema:
1. SPATIAL POSITIONING & RELATIONS:
- "SUR" / "ON" / "SUR LA TABLE" / "SUR LA CHEMINÉE":
  Find the target entity in "Current Environment Entities":
  - If placing on a fireplace ("cheminee"), its top mantel is at y = 2.2m. Place objects on top at y = fireplace.y + 2.2m!
  - If placing on a table / kitchen island / luxury counter / desk, its tabletop surface is at y = 0.912m! Place objects on top at y = 0.912.
  - If placing on a pedestal/socle, place on top at y = 1.02.
  - If target doesn't exist, create it! If placing object already exists, use "entitiesChanged" to move it.
- "A CÔTÉ DE" / "NEXT TO":
  Place next to target along X axis. For large objects like a fireplace, offset by at least 1.8m (e.g. x = target.x + 1.8m or -1.8m, y = 0 on the ground).
- "EMPILER" / "STACK":
  Stack items vertically with increasing Y positions:
  - Books have a flat thickness of 0.06m (6 cm).
  - Book 1: y = base_y
  - Book 2: y = base_y + 0.06
  - Book 3: y = base_y + 0.12
  - Candle on top of stack: y = base_y + 0.18
- "DEVANT" / "IN FRONT OF":
  Place in front of target along Z axis: x = target.position.x, z = target.position.z + 1.2, y = 0.
- "DERRIÈRE" / "BEHIND":
  Place behind target along Z axis: x = target.position.x, z = target.position.z - 1.8, y = 0.
- "AVATAR" / "GUIDE":
  WorldPilot already contains an interactive embodied spatial guide avatar (Chef Auguste in cooking scenes, Éléonore in luxury, Nova in engineering).
  If the user asks to display, show, place or move the avatar / guide ("affiche l'avatar devant...", "place l'avatar...", "positionne le guide..."):
  - DO NOT create a 3D entity in entitiesCreated with modelUrl or /library/avatar.glb (that file does not exist).
  - Calculate target position: x = target.position.x - 0.25, y = 0, z = target.position.z + 0.9.
  - Set plan.intent to "position_spatial_avatar".
  - In plan.actions: [{ "action": "position_spatial_avatar", "position": { "x": target.position.x - 0.25, "y": 0, "z": target.position.z + 0.9 }, "toastMessage": "👤 Avatar du guide spatial positionné devant la cible." }].
  - Leave patch entitiesCreated and entitiesChanged empty for avatar positioning.
- "ALIGNER" / "ALIGN":
  Space out entities along the X or Z axis with regular increments (e.g. x = -4, -2, 0, 2, 4).
- FLOOR / SOL:
  WorldPilot automatically renders a realistic procedural architectural floor for every worldTheme ("supercar-showroom", "luxury-salon", "cozy-bistrot", "high-tech-lab", etc.). Do NOT create a separate ground/sol entity unless the user explicitly asks to modify the floor itself; if you do create a floor slab, use scale {x: 16, y: 0.01, z: 16} at position {x: 0, y: -0.02, z: 0} (NEVER thick boxes with y >= 0.05 or green colors for marble/showroom floors).
- CLEAR / RESET SCENE:
  If the user asks to clear, wipe, or reset the scene (e.g. "supprime tout", "efface tout", "vide la scène", "repars de zéro"), put ALL IDs from "Current Environment Entities" into "entitiesRemoved"!

2. INVENTORY & 3D MODELS:
- When the user asks to spawn or use an object from the "User's Known Asset Inventory", you MUST set "modelUrl" inside the "visuals" block to the exact URL from the inventory. DO NOT use basic shapes for inventory items.

3. SPATIAL CONTEXT:
- "THIS" (selectedEntityId): The object currently selected by the user. If user says "change sa couleur", "mets le sur la table", "fais le disparaître", refer to THIS entity ID.
- "HERE" (pointedEntityId): The target zone/object pointed to by the user.

4. INTERACTIVE RULES & BEHAVIORS:
- "trigger": "COLLISION" (when two objects touch/collide) or "DROP" (when an object is dropped on another or in a zone).
- "conditions":
  - { "type": "is_source", "sourceId": "id" }
  - { "type": "is_target", "targetId": "id" }
  - { "type": "min_force", "force": 5 }
  - { "type": "require_flag", "flag": "flag_name" }
- "actions":
  - { "type": "open_url", "url": "https://..." } -> Opens a webpage in a new tab.
  - { "type": "show_warning", "message": "Text to display" } -> Displays a UI alert notification.
  - { "type": "destroy_entity", "entityId": "id" } -> Destroys/removes an entity from the scene.
  - { "type": "play_sound", "sound": "laser" | "chime" | "explosion" | "ping" } -> Synthesizes an audio sound effect.
  - { "type": "change_color", "entityId": "id", "color": "#ff0000" } -> Changes object color dynamically.
  - { "type": "reset_position", "entityId": "id", "position": { "x": 0, "y": 1, "z": 0 } } -> Teleports object back.
  - { "type": "fire_webhook", "url": "https://..." } -> Calls an external API/webhook.
  - { "type": "mint_nft", "nftName": "Nom de l'actif", "token": "VR" } -> Triggers a Victoria VR Smart Contract NFT Mint with on-chain modal.
  - { "type": "set_flag", "flag": "flag_name", "value": true } -> Sets a world state flag.

5. PEDAGOGICAL CURRICULUM & LEARNING OBJECTIVE SYNTHESIS:
- If the user provides a pedagogical or training objective (e.g., "Je veux apprendre à...", "Entraîne un astronaute...", "Crée un module d'apprentissage pour...", "L'objectif est de former..."):
  You MUST architect a COMPLETE interactive cyber-physical simulation:
  1. The learning subject artifact (e.g. battery, tool, helmet, NFT artifact) with physics & colliders.
  2. The inspection / authentication zone or pedestal (where prerequisites are met).
  3. The target / completion / transaction zone.
  4. Causal rules:
     - If completed correctly: plays 'chime', sets success flag, or triggers Victoria VR mint.
     - If completed unsafely (e.g. without prior inspection): displays educational warning, resets object.
  5. Invariants (in "invariantsAdded"): formal safety proof that the goal cannot be completed without fulfilling the learning prerequisite!
     Each invariant MUST include a structured condition:
     { "id": "INV_SAFETY_1", "description": "...", "condition": { "type": "never_state", "stateFlag": "car_running", "requiredFlag": "battery_inspected" } }

6. 3D OBJECT IDENTIFICATION & CATALOG SELECTION (MANDATORY):
- WorldPilot contains an extensive 3D catalog covering vehicles, tools, batteries, generators, cooking equipment, furniture, laboratory items, sports, nature, and gaming assets.
- For ANY object or concept requested by the user that exists in the "WorldPilot built-in library" below:
  * You MUST select its exact catalog "visuals.assetId" and set "visuals.modelUrl" to "/library/<assetId>.glb".
  * NEVER use generic cubes, cylinders, or rubber ducks when a matching 3D asset exists in the library!
  * Example mappings:
    - Automobile / voiture berline -> visuals.assetId: "wp-voiture"
    - Batterie automobile 12V -> visuals.assetId: "wp-batterie-automobile"
    - Générateur de secours portable -> visuals.assetId: "wp-generateur-secours"
    - Établi technique / workbench -> visuals.assetId: "technical-bench"
    - Table / îlot de cuisine -> visuals.assetId: "wp-ilot-de-cuisine"
    - Cuillère en bois -> visuals.assetId: "wp-cuillere-bois"
    - Supercar -> visuals.assetId: "wp-supercar-showroom"
    - Plateau tournant -> visuals.assetId: "wp-plateau-tournant"
    - Clé intelligente / télécommande -> visuals.assetId: "wp-telecommande-sport"
    - Voilier -> visuals.assetId: "wp-voilier"
    - Coquillage -> visuals.assetId: "wp-coquillage"
    - Cèpe de Bordeaux -> visuals.assetId: "wp-cepe-de-bordeaux"
    - Amanite tue-mouches -> visuals.assetId: "wp-amanite-tue-mouches"
    - Sac de luxe monogramme -> visuals.assetId: "wp-sac-monogram"
    - Plateau d'ingrédients -> visuals.assetId: "wp-ingredients-cookies"

6b. SPATIAL POSITIONING & SUPPORT COHERENCE:
- Floor-standing objects & vehicles (role=floor_furniture, static): ground at y = 0.
- Support furniture (tables, workbenches, kitchen islands, desks): tabletop surface height is y = 0.9m.
- Props resting ON a support (e.g. battery on workbench, cutting board on table, key on console):
  * Place at the support's (x, z) coordinates, with y = support_surface_height (e.g. y = 0.9m).
  * NEVER place a tabletop prop and its workbench at the same floor position (y = 0)!
- Insertion / Target zones:
  * Use visuals.assetId: "socket" and visuals.modelUrl: "/library/socket.glb" with capabilities: [{"type": "collider"}, {"type": "trigger_zone", "radius": 0.5}]. (NOTE: every entity with a trigger_zone MUST also have {"type": "collider"}).
  * Place the zone at its intended functional socket position (e.g. inside the car's engine bay at x = 1.02, y = 0.85, z = 1.12).
- Entity Replacement ("Remplace X par Y"):
  * When replacing an entity (e.g. "Remplace la batterie par un générateur"):
    - Put the replaced entity ID into "entitiesRemoved".
    - Create the new entity in "entitiesCreated" with its new visuals.assetId (e.g. "wp-generateur-secours") while PRESERVING the transform position of the old entity!

7. MINIMUM VIABLE EXPERIENCE (MVE) MANDATE:
- Every interactive scene, game, puzzle, or training activity generated MUST be a Minimum Viable Experience (MVE).
- It MUST NOT be a passive pile of 3D objects with no purpose.
- It MUST include:
  1. An explicit Quest in "questsAdded" with:
     - "id": unique id (e.g. "quest_interactive_scene", "quest_puzzle", "quest_challenge")
     - "title": clear human-readable title (e.g. "Mission : Résoudre le Taquin", "Épreuve de Tir")
     - "description": explaining what the player must do to win or complete the experience
     - "currentStepIndex": 0
     - "status": "in_progress"
     - "steps": array of task steps with "id", "title", "description", "requiredEvent" (e.g. "CLICK:entity_id", "DROP:source:target"), "completed": false.
       IMPORTANT: "title" and "description" MUST ALWAYS be actionable imperatives for the player (e.g. "Consulter la recette", "Découper les légumes"). NEVER use passive retrospective statements or placement confirmations like "L'objet est désormais situé..." or "L'élément a été déplacé" !
     - Set "activeQuestId" in the patch to this quest ID!
  2. Causal affordances in "rulesChanged" connecting clicks or collisions with sound effects ('chime', 'target_hit', 'laser', 'fanfare'), visual reactions, and score/status changes.
  3. A victory condition rewarding completion with 'fanfare'.
- If the instruction is so vague that it cannot form a complete experience without guessing (e.g. "fais un jeu", "crée un puzzle" without details), set "plan.clarification":
  {
    "needed": true,
    "question": "Précisez l'objectif de votre univers :",
    "options": ["Jeu d'adresse / tir sur cibles", "Puzzle 3D interactif", "Atelier découverte"]
  }

8. OUT-OF-CATALOG 3D OBJECT CREATION (AUTONOMOUS PROCEDURAL SYNTHESIS):
WorldPilot is a truly OPEN-ENDED generative AI spatial engine. If the user's prompt requests concepts or objects NOT in the catalog:
YOU MUST SYNTHESIZE / CREATE THE OBJECT PROCEDURALLY using composite "parts":
- "name": Full descriptive technical or natural name.
- "capabilities":
  - {"type": "transform", "position": {"x": 0, "y": 0, "z": 0}, "scale": {"x": 1, "y": 1, "z": 1}}
  - {"type": "collider"}
  - {"type": "draggable"} (if manipulable)
  - {"type": "educational", "text": "Deep theoretical knowledge, criteria of identification, or scientific context."}
- "parts": For composite multi-component 3D items, specify sub-parts with relative shapes, positions, rotations, scales, colors and PBR material params:
  Example for mushroom:
  [
    {"id": "stipe", "name": "Pied", "shape": "cylinder", "position": {"x": 0, "y": 0.1, "z": 0}, "scale": {"x": 0.08, "y": 0.2, "z": 0.08}, "color": "#fef9c3", "roughness": 0.7},
    {"id": "cap", "name": "Chapeau", "shape": "sphere", "position": {"x": 0, "y": 0.22, "z": 0}, "scale": {"x": 0.26, "y": 0.12, "z": 0.26}, "color": "#78350f", "clearcoat": 0.4}
  ]
- "visuals":
  - "shape": "box" | "cylinder" | "sphere" | "cone" | "torus"
  - "color": Precise realistic hex color code
  - "materialPreset": "wood" | "metal" | "glass" | "marble" | "ceramic" | "stone" | "leather" | "organic" | "gold" | "plastic"
  - "roughness": 0.0 to 1.0, "metalness": 0.0 to 1.0, "clearcoat": 0.0 to 1.0

9. CONTEXTUAL PARAMETRIC AVATAR & WORLD THEME:
Adapt the companion avatar and atmospheric theme to the domain:
- In "patch":
  - "worldTheme": "forest-clearing" | "high-tech-lab" | "cozy-bistrot" | "supercar-showroom" | "luxury-salon" | "zen-garden" | "martian-surface" | "orbital-zerog"
  - "persona": {
      "name": "Nom de l'Avatar Expert",
      "role": "Rôle / Métier (ex: Expert Biodiversité & Mycologie)",
      "theme": "naturalist" | "mechanic" | "scientist" | "chef" | "luxury" | "engineer" | "guide" | "custom",
      "icon": "🌲",
      "color": "#15803d",
      "greeting": "Message d'accueil vocal / textuel chaleureux et immersif..."
    }

WorldPilot built-in library (meter scale, origin at the bottom; no normalization):
${fullCatalog.map(a => `- ${a.name}: visuals.assetId="${a.id}", visuals.modelUrl="/library/${a.id}.glb"; size approximately ${a.size.join(' x ')}m${(a as any).role ? `; role=${(a as any).role}` : ''}`).join('\n')}
For these built-in objects ALWAYS use visuals.assetId and visuals.modelUrl. Preserve assetId on edits. Ground placement y=0 for floor furniture.

User's Known Asset Inventory:
${INVENTORY_CONTEXT}

Return ONLY a valid JSON object matching this schema:
{
  "plan": { 
    "intent": "string", 
    "actions": [ { "action": "string", "target": "string" } ],
    "clarification": { "needed": false, "question": "string", "options": ["string"] }
  },
  "patch": {
    "worldTheme": "forest-clearing",
    "persona": {
      "name": "Sylvain, Guide Naturaliste & Mycologue",
      "role": "Expert Biodiversité et Mycologie",
      "theme": "naturalist",
      "icon": "🌲",
      "color": "#15803d",
      "greeting": "Bienvenue au cœur de la forêt..."
    },
    "entitiesCreated": [
      {
        "id": "string",
        "name": "string",
        "capabilities": [
          { "type": "transform", "position": { "x": 0, "y": 0, "z": 0 }, "scale": { "x": 1, "y": 1, "z": 1 } },
          { "type": "draggable" },
          { "type": "collider" },
          { "type": "educational", "text": "Explications pédagogiques" }
        ],
        "visuals": { "assetId": "wp-batterie-automobile", "modelUrl": "/library/wp-batterie-automobile.glb", "color": "#1e293b", "roughness": 0.4 },
        "resources": [
          { "role": "details", "url": "https://fr.wikipedia.org/wiki/...", "label": "Fiche complète" }
        ]
      }
    ],
    "entitiesChanged": [
      {
        "id": "string",
        "capabilities": [
          { "type": "transform", "position": { "x": 0, "y": 0, "z": 0 } }
        ],
        "visuals": { "assetId": "string", "modelUrl": "url", "color": "string" }
      }
    ],
    "entitiesRemoved": [ "id1", "id2" ],
    "rulesChanged": [
      {
        "id": "R_unique_id",
        "trigger": "COLLISION",
        "conditions": [ { "type": "is_source", "sourceId": "id" } ],
        "actions": [ { "type": "play_sound", "sound": "chime" } ]
      }
    ],
    "questsAdded": [
      {
        "id": "quest_id",
        "title": "Titre de l'Objectif",
        "description": "Que doit accomplir le joueur ?",
        "currentStepIndex": 0,
        "status": "in_progress",
        "steps": [
          {
            "id": "step_1",
            "title": "Première action concrète",
            "description": "Indication pour le joueur",
            "requiredEvent": "CLICK:id",
            "completed": false
          }
        ]
      }
    ],
    "activeQuestId": "quest_id",
    "invariantsAdded": []
  }
}
`;

export async function generatePatchFromLLM(
  instruction: string,
  spatialContext: { selectedEntityId: string | null, pointedEntityId: string | null },
  entities: Record<string, EntitySpec>,
  existingQuestIds: string[] = []
): Promise<{ plan: CommandPlan, patch: WorldPatch } | null> {
  if (instruction.length > 2000) return null;
  const prompt = `
Current Environment Entities:
${JSON.stringify(Object.values(entities).map(e => ({ id: e.id, name: e.name, capabilities: e.capabilities, visuals: e.visuals })), null, 2)}

Spatial Context:
THIS: ${spatialContext.selectedEntityId || 'null'}
HERE: ${spatialContext.pointedEntityId || 'null'}

Instruction: ${instruction}
`;

  try {
    // 1. Try secure server-side proxy first (Cloudflare Pages Function, zero client key exposure)
    try {
      const passcode = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('worldpilot_passcode') || '' : '';
      const proxyResponse = await fetch('/api/llm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-worldpilot-passcode': passcode
        },
        body: JSON.stringify({
          instruction,
          systemPrompt: SYSTEM_PROMPT,
          userPrompt: prompt,
          passcode
        })
      });

      if (proxyResponse.ok) {
        const proxyData = await proxyResponse.json();
        const text = proxyData?.choices?.[0]?.message?.content;
        if (text) {
          return normalizeAndValidateModelResponse(text, entities, existingQuestIds);
        }
      }
    } catch (_) {
      // Server proxy not available (e.g. running local standalone dev server)
    }

    // 2. Fall back to client-configured API keys if present
    const deepseekKey = getDeepSeekKey();
    const geminiKey = getGeminiKey();

    if (config.llm_provider === 'deepseek' && deepseekKey) {
      console.log("Calling DeepSeek API with instruction:", instruction);
      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${deepseekKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: prompt }
          ],
          response_format: {
            type: 'json_object'
          }
        })
      });

      if (!response.ok) {
        throw new Error(`DeepSeek API error: ${response.statusText}`);
      }

      const data = await response.json();
      const text = data?.choices?.[0]?.message?.content;
      return normalizeAndValidateModelResponse(text, entities, existingQuestIds);
    } 
    else if (geminiKey) {
      const gemini = getGeminiClient();
      if (gemini) {
        console.log("Calling Gemini API with instruction:", instruction);
        const response = await gemini.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            { role: 'user', parts: [{ text: SYSTEM_PROMPT + '\n\n' + prompt }] }
          ],
          config: {
            responseMimeType: 'application/json',
          }
        });
        const text = response.text();
        return normalizeAndValidateModelResponse(text, entities, existingQuestIds);
      }
    }
  } catch (e) {
    console.error("LLM Generation failed:", e);
    return null;
  }
  return null;
}

const MAX_MODEL_OUTPUT_CHARS = 100_000;
const MAX_PATCH_ITEMS = 100;
const ALLOWED_PATCH_KEYS = new Set([
  'entitiesCreated', 'entitiesRemoved', 'entitiesChanged', 'rulesChanged',
  'invariantsAdded', 'questsAdded', 'activeQuestId', 'questUpdated', 'gameplayPatch',
  'persona', 'worldTheme'
]);
const ALLOWED_ACTION_TYPES = new Set([
  'set_flag', 'teleport', 'fire_webhook', 'open_url', 'show_warning', 'reset_position',
  'destroy_entity', 'play_sound', 'change_color', 'mint_nft', 'emit_particles',
  'trigger_animation', 'spawn_entity', 'set_atmosphere', 'increment_score',
  'decrement_score', 'adjust_lives', 'set_timer', 'trigger_victory', 'trigger_game_over',
  'reset_game', 'apply_impulse', 'toggle_state', 'set_entity_state', 'highlight_part',
  'open_2d_sheet', 'test_spatial_capacity', 'set_relation', 'attach_relation', 'detach_relation'
]);

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertString(value: unknown, label: string, maxLength: number): asserts value is string {
  if (typeof value !== 'string' || value.trim().length === 0 || value.length > maxLength) {
    throw new Error(`Invalid model response: ${label} must be a non-empty string of at most ${maxLength} characters.`);
  }
}

function assertBoundedArray(value: unknown, label: string, maxLength = MAX_PATCH_ITEMS): asserts value is unknown[] {
  if (!Array.isArray(value) || value.length > maxLength) {
    throw new Error(`Invalid model response: ${label} must be an array with at most ${maxLength} items.`);
  }
}

function validateEntity(value: unknown, label: string): asserts value is EntitySpec {
  if (!isRecord(value)) throw new Error(`Invalid model response: ${label} must be an object.`);
  assertString(value.id, `${label}.id`, 128);
  assertString(value.name, `${label}.name`, 200);
  assertBoundedArray(value.capabilities, `${label}.capabilities`, 64);
  for (const [index, capability] of value.capabilities.entries()) {
    if (!isRecord(capability)) throw new Error(`Invalid model response: ${label}.capabilities[${index}] must be an object.`);
    assertString(capability.type, `${label}.capabilities[${index}].type`, 80);
    if (capability.type === 'transform' && capability.position !== undefined) {
      const position = capability.position;
      if (!isRecord(position) || !['x', 'y', 'z'].every(axis => Number.isFinite(position[axis]))) {
        throw new Error(`Invalid model response: ${label} has an invalid transform position.`);
      }
    }
  }
  if (value.visuals !== undefined && value.visuals !== null && !isRecord(value.visuals)) {
    throw new Error(`Invalid model response: ${label}.visuals must be an object.`);
  }
}

export function normalizeAndValidateModelResponse(
  rawInput: unknown,
  currentEntities: Record<string, EntitySpec> = {},
  existingQuestIds: string[] = []
): { plan: CommandPlan; patch: WorldPatch } | null {
  let parsed: any;
  if (typeof rawInput === 'string') {
    if (rawInput.length > MAX_MODEL_OUTPUT_CHARS) {
      throw new Error('Invalid model response: output is missing or exceeds the size limit.');
    }
    try {
      parsed = JSON.parse(rawInput);
    } catch (e: any) {
      const match = rawInput.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (match) {
        try {
          parsed = JSON.parse(match[1]);
        } catch {
          const jsonMatch = rawInput.match(/(\{[\s\S]*\})/);
          if (jsonMatch) parsed = JSON.parse(jsonMatch[1]);
          else throw e;
        }
      } else {
        const jsonMatch = rawInput.match(/(\{[\s\S]*\})/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[1]);
        } else {
          throw e;
        }
      }
    }
  } else if (isRecord(rawInput)) {
    parsed = JSON.parse(JSON.stringify(rawInput));
  } else {
    throw new Error('Invalid model response: output is missing or invalid.');
  }

  if (isRecord(parsed) && parsed.type === 'json_object') {
    delete parsed.type;
  }

  if (isRecord(parsed) && isRecord(parsed.plan)) {
    if (typeof parsed.plan.intent !== 'string' || !parsed.plan.intent.trim()) {
      parsed.plan.intent = 'create_scene';
    }
    if (!Array.isArray(parsed.plan.actions)) {
      parsed.plan.actions = [{ action: 'modify_scene' }];
    }
  }

  if (isRecord(parsed) && isRecord(parsed.patch)) {
    if (parsed.patch.activeQuestId === '' || parsed.patch.activeQuestId === null) {
      delete parsed.patch.activeQuestId;
    }

    // Key aliases from diverse LLM outputs
    if (!parsed.patch.invariantsAdded && parsed.patch.invariants) {
      parsed.patch.invariantsAdded = parsed.patch.invariants;
      delete parsed.patch.invariants;
    }
    if (!parsed.patch.rulesChanged && parsed.patch.rules) {
      parsed.patch.rulesChanged = parsed.patch.rules;
      delete parsed.patch.rules;
    }
    if (!parsed.patch.questsAdded && parsed.patch.quests) {
      parsed.patch.questsAdded = parsed.patch.quests;
      delete parsed.patch.quests;
    }
    if (!parsed.patch.entitiesCreated && parsed.patch.entities) {
      parsed.patch.entitiesCreated = parsed.patch.entities;
      delete parsed.patch.entities;
    }
    if (!parsed.patch.entitiesRemoved && parsed.patch.entitiesToDelete) {
      parsed.patch.entitiesRemoved = parsed.patch.entitiesToDelete;
      delete parsed.patch.entitiesToDelete;
    }
    if (!parsed.patch.entitiesRemoved && parsed.patch.removedEntities) {
      parsed.patch.entitiesRemoved = parsed.patch.removedEntities;
      delete parsed.patch.removedEntities;
    }

    // Convert object dictionaries to arrays
    for (const field of ['entitiesCreated', 'entitiesRemoved', 'entitiesChanged', 'rulesChanged', 'invariantsAdded', 'questsAdded'] as const) {
      if (isRecord(parsed.patch[field])) {
        parsed.patch[field] = Object.values(parsed.patch[field]);
      }
    }

    if (Array.isArray(parsed.patch.entitiesRemoved)) {
      const seenRemoved = new Set<string>();
      parsed.patch.entitiesRemoved = parsed.patch.entitiesRemoved.filter((id: unknown): id is string => {
        if (typeof id !== 'string' || !currentEntities[id] || seenRemoved.has(id)) return false;
        seenRemoved.add(id);
        return true;
      });
    }
    const removedSet = new Set<string>(
      Array.isArray(parsed.patch.entitiesRemoved) ? parsed.patch.entitiesRemoved : []
    );

    // If the model proposed creating an entity that already exists (and is not being removed in the same patch), normalize it into entitiesChanged
    if (Array.isArray(parsed.patch.entitiesCreated)) {
      const remainingCreated: any[] = [];
      parsed.patch.entitiesChanged = Array.isArray(parsed.patch.entitiesChanged) ? parsed.patch.entitiesChanged : [];
      for (const item of parsed.patch.entitiesCreated) {
        if (isRecord(item) && typeof item.id === 'string' && currentEntities[item.id] && !removedSet.has(item.id)) {
          parsed.patch.entitiesChanged.push(item);
        } else {
          remainingCreated.push(item);
        }
      }
      parsed.patch.entitiesCreated = remainingCreated;
    }

    // Solveur d'Assise Physique & Normalisation des Vecteurs Transform (sur entitiesCreated ET entitiesChanged)
    const normalizeVec3 = (v: any, fallback: { x: number; y: number; z: number }) => {
      if (Array.isArray(v) && v.length >= 3) {
        return {
          x: Number.isFinite(Number(v[0])) ? Number(v[0]) : fallback.x,
          y: Number.isFinite(Number(v[1])) ? Number(v[1]) : fallback.y,
          z: Number.isFinite(Number(v[2])) ? Number(v[2]) : fallback.z,
        };
      }
      if (isRecord(v)) {
        return {
          x: Number.isFinite(Number(v.x)) ? Number(v.x) : fallback.x,
          y: Number.isFinite(Number(v.y)) ? Number(v.y) : fallback.y,
          z: Number.isFinite(Number(v.z)) ? Number(v.z) : fallback.z,
        };
      }
      return undefined;
    };

    for (const list of [parsed.patch.entitiesCreated, parsed.patch.entitiesChanged]) {
      if (!Array.isArray(list)) continue;
      for (const ent of list) {
        if (!isRecord(ent)) continue;
        if (isRecord((ent as any).transform)) {
          const rawTf = (ent as any).transform;
          if (!Array.isArray(ent.capabilities)) ent.capabilities = [];
          const existingTf = ent.capabilities.find((c: any) => isRecord(c) && c.type === 'transform');
          if (existingTf) {
            if (existingTf.position === undefined && rawTf.position !== undefined) existingTf.position = rawTf.position;
            if (existingTf.rotation === undefined && rawTf.rotation !== undefined) existingTf.rotation = rawTf.rotation;
            if (existingTf.scale === undefined && rawTf.scale !== undefined) existingTf.scale = rawTf.scale;
          } else {
            ent.capabilities.unshift({
              type: 'transform',
              ...(rawTf.position !== undefined ? { position: rawTf.position } : {}),
              ...(rawTf.rotation !== undefined ? { rotation: rawTf.rotation } : {}),
              ...(rawTf.scale !== undefined ? { scale: rawTf.scale } : {})
            });
          }
          delete (ent as any).transform;
        }
        if (Array.isArray(ent.capabilities)) {
          for (const cap of ent.capabilities) {
            if (isRecord(cap) && cap.type === 'transform') {
              if (cap.position !== undefined) {
                cap.position = normalizeVec3(cap.position, { x: 0, y: 0, z: 0 });
              }
              if (cap.rotation !== undefined) {
                cap.rotation = normalizeVec3(cap.rotation, { x: 0, y: 0, z: 0 });
              }
              if (cap.scale !== undefined) {
                cap.scale = normalizeVec3(cap.scale, { x: 1, y: 1, z: 1 });
              }
              if (isRecord(cap.position)) {
                const pos = cap.position;
                const idLow = typeof ent.id === 'string' ? ent.id.toLowerCase() : '';
                const isFloor =
                  !idLow.includes('console') &&
                  !idLow.includes('parasol') &&
                  !idLow.includes('tournesol') &&
                  !idLow.includes('boussole') &&
                  (idLow === 'ground' || idLow.startsWith('ground_') || idLow.endsWith('_ground') ||
                   idLow === 'sol' || idLow.startsWith('sol_') || idLow.endsWith('_sol') ||
                   idLow === 'floor' || idLow.startsWith('floor_') || idLow.endsWith('_floor'));
                if (!isFloor && typeof pos.y === 'number' && pos.y < 0) {
                  pos.y = 0;
                }
              }
            }
          }
        }

        // Capabilities Normalization & Validation Guards:
        // Si l'entité dispose d'une trigger_zone, elle DOIT posséder un collider pour que les contrôles de validation du monde passent.
        if (!Array.isArray(ent.capabilities)) ent.capabilities = [];
        const hasTriggerZone = ent.capabilities.some((c: any) => isRecord(c) && c.type === 'trigger_zone');
        const hasCollider = ent.capabilities.some((c: any) => isRecord(c) && c.type === 'collider');
        if (hasTriggerZone && !hasCollider) {
          ent.capabilities.push({ type: 'collider' });
        }

        // Canonical Visuals & Asset Normalization:
        // Le LLM sélectionne l'objet 3D dans le catalogue unifié.
        // On résout ici les éventuels alias ou modelUrl vers le canonical assetId.
        const rawAsset = ent.visuals?.assetId || (ent as any).assetId;
        const rawModel = ent.visuals?.modelUrl || (ent as any).modelUrl;
        const canonicalId = resolveCanonicalAssetId(rawAsset, rawModel);
        if (canonicalId) {
          if (!ent.visuals || !isRecord(ent.visuals)) {
            ent.visuals = { assetId: canonicalId };
          } else {
            ent.visuals.assetId = canonicalId;
          }
        }
        if ((ent as any).assetId) delete (ent as any).assetId;
        if ((ent as any).modelUrl) delete (ent as any).modelUrl;
      }
    }

    // Normalize invariantsAdded so string invariants or loose shapes from LLMs don't fail validation
    if (parsed.patch.invariantsAdded !== undefined) {
      if (!Array.isArray(parsed.patch.invariantsAdded)) {
        parsed.patch.invariantsAdded = isRecord(parsed.patch.invariantsAdded) ? Object.values(parsed.patch.invariantsAdded) : [];
      }
      const rawInvariants = parsed.patch.invariantsAdded;
      // Extract candidate flags from rulesChanged so LLM invariants always have a formal executable condition
      const ruleFlags: string[] = [];
      let inferredRequiredFlag = '';
      if (Array.isArray(parsed.patch.rulesChanged)) {
        for (const r of parsed.patch.rulesChanged) {
          if (!isRecord(r)) continue;
          if (Array.isArray(r.conditions)) {
            for (const c of r.conditions) {
              if (isRecord(c) && typeof c.flag === 'string' && c.flag.trim()) {
                inferredRequiredFlag = inferredRequiredFlag || c.flag.trim();
              }
            }
          }
          if (Array.isArray(r.actions)) {
            for (const a of r.actions) {
              if (isRecord(a) && a.type === 'set_flag' && typeof a.flag === 'string' && a.flag.trim()) {
                ruleFlags.push(a.flag.trim());
              }
            }
          }
        }
      }
      const fallbackRequiredFlag = inferredRequiredFlag || ruleFlags[0] || 'battery_inspected';
      const fallbackStateFlag = ruleFlags.find(f => f !== fallbackRequiredFlag) || 'car_running';

      parsed.patch.invariantsAdded = rawInvariants.map((inv: any, idx: number) => {
        if (typeof inv === 'string' && inv.trim()) {
          return {
            id: `inv_model_${idx + 1}_${Date.now().toString(36)}`,
            description: inv.trim().slice(0, 500),
            condition: { type: 'never_state', stateFlag: fallbackStateFlag, requiredFlag: fallbackRequiredFlag }
          };
        }
        if (isRecord(inv)) {
          const id = typeof inv.id === 'string' && inv.id.trim()
            ? inv.id.trim().slice(0, 128)
            : `inv_model_${idx + 1}_${Date.now().toString(36)}`;
          const rawDesc = inv.description || inv.name || inv.text || inv.rule || inv.invariant || inv.label || `Invariant de sécurité ${idx + 1}`;
          const description = typeof rawDesc === 'string' && rawDesc.trim() ? rawDesc.trim() : `Invariant de sécurité ${idx + 1}`;
          const hasValidCondition =
            isRecord(inv.condition) &&
            typeof inv.condition.stateFlag === 'string' &&
            typeof inv.condition.requiredFlag === 'string';
          return {
            ...inv,
            id,
            description: description.slice(0, 500),
            condition: hasValidCondition
              ? { type: 'never_state', stateFlag: inv.condition.stateFlag, requiredFlag: inv.condition.requiredFlag }
              : { type: 'never_state', stateFlag: fallbackStateFlag, requiredFlag: fallbackRequiredFlag }
          };
        }
        return {
          id: `inv_model_${idx + 1}_${Date.now().toString(36)}`,
          description: `Invariant de sécurité ${idx + 1}`,
          condition: { type: 'never_state', stateFlag: fallbackStateFlag, requiredFlag: fallbackRequiredFlag }
        };
      });
    }

    // Normalize rulesChanged
    if (Array.isArray(parsed.patch.rulesChanged)) {
      const createdList: any[] = Array.isArray(parsed.patch.entitiesCreated) ? parsed.patch.entitiesCreated : [];
      const createdIds = new Set<string>();
      const partIds = new Set<string>();
      Object.entries(currentEntities).forEach(([id, ent]) => {
        if (removedSet.has(id)) return;
        if (Array.isArray(ent?.parts)) {
          ent.parts.forEach((p: any) => {
            if (isRecord(p) && typeof p.id === 'string') {
              partIds.add(p.id);
            }
          });
        }
      });
      createdList.forEach((ent: any) => {
        if (isRecord(ent) && typeof ent.id === 'string') {
          createdIds.add(ent.id);
          if (Array.isArray(ent.parts)) {
            ent.parts.forEach((p: any) => {
              if (isRecord(p) && typeof p.id === 'string') {
                partIds.add(p.id);
              }
            });
          }
        }
      });
      const validEntityIds = new Set([
        ...Object.keys(currentEntities).filter(id => !removedSet.has(id)),
        ...createdIds,
        ...partIds,
        'player',
        'world',
        'system',
        '*'
      ]);

      parsed.patch.rulesChanged = parsed.patch.rulesChanged.map((rule: any, idx: number) => {
        if (!isRecord(rule)) return null;
        let conditions = Array.isArray(rule.conditions) ? rule.conditions : [];
        let actions = Array.isArray(rule.actions) ? rule.actions : [];

        // Sanitize and remap conditions referencing sub-parts or related entities
        conditions = conditions.filter((condition: any) => {
          if (!isRecord(condition)) return false;
          for (const key of ['sourceId', 'targetId'] as const) {
            const id = condition[key];
            if (typeof id === 'string' && id !== '*' && !id.toLowerCase().includes('any') && !validEntityIds.has(id)) {
              // Try to find a matching created entity or part (e.g. "voile_principale" matching "bateau")
              const matched = Array.from(createdIds).find(cId => {
                const lowerId = id.toLowerCase();
                const lowerCId = cId.toLowerCase();
                return lowerId.includes(lowerCId) || lowerCId.includes(lowerId) ||
                       (lowerId.includes('voile') && (lowerCId.includes('bateau') || lowerCId.includes('voilier'))) ||
                       (lowerId.includes('moteur') && lowerCId.includes('voiture'));
              });
              if (matched) {
                condition[key] = matched;
              } else if (createdIds.size > 0) {
                condition[key] = Array.from(createdIds)[0];
              } else {
                return false;
              }
            }
          }
          return true;
        });

        // Sanitize and remap actions referencing sub-parts or related entities
        actions = actions.filter((action: any) => {
          if (!isRecord(action)) return false;
          for (const key of ['entityId', 'targetId', 'sourceEntityId', 'targetEntityId'] as const) {
            const id = action[key];
            if (typeof id === 'string' && id !== 'player' && id !== 'world' && id !== '*' && !validEntityIds.has(id)) {
              const matched = Array.from(createdIds).find(cId => {
                const lowerId = id.toLowerCase();
                const lowerCId = cId.toLowerCase();
                return lowerId.includes(lowerCId) || lowerCId.includes(lowerId) ||
                       (lowerId.includes('voile') && (lowerCId.includes('bateau') || lowerCId.includes('voilier')));
              });
              if (matched) {
                action[key] = matched;
              } else if (createdIds.size > 0) {
                action[key] = Array.from(createdIds)[0];
              } else {
                return false;
              }
            }
          }
          return true;
        });

        return {
          ...rule,
          id: typeof rule.id === 'string' && rule.id.trim() ? rule.id.trim().slice(0, 128) : `rule_model_${idx + 1}_${Date.now().toString(36)}`,
          trigger: typeof rule.trigger === 'string' && rule.trigger.trim() ? rule.trigger.trim() : 'COLLISION',
          conditions,
          actions
        };
      }).filter(Boolean);
    }

    // Normalize questsAdded: ensure valid status, boolean completed, unique IDs, and populate targetEntityId / targetZoneId from colon syntax (CLICK:id, DROP:src:tgt)
    if (Array.isArray(parsed.patch.questsAdded)) {
      const createdList: any[] = Array.isArray(parsed.patch.entitiesCreated) ? parsed.patch.entitiesCreated : [];
      const allEntityIds = new Set<string>([
        ...Object.keys(currentEntities).filter(id => !removedSet.has(id)),
        ...createdList.filter((e: any) => isRecord(e) && typeof e.id === 'string').map((e: any) => e.id as string)
      ]);
      const seenQuestIds = new Set<string>(existingQuestIds);

      parsed.patch.questsAdded = parsed.patch.questsAdded.map((quest: any, qIdx: number) => {
        if (!isRecord(quest)) return null;
        let qId = typeof quest.id === 'string' && quest.id.trim() ? quest.id.trim().slice(0, 100) : `quest_model_${qIdx + 1}`;
        if (seenQuestIds.has(qId)) {
          const nextId = `${qId}_${Date.now().toString(36).slice(-4)}`;
          if (parsed.patch.activeQuestId === qId) {
            parsed.patch.activeQuestId = nextId;
          }
          qId = nextId;
        }
        seenQuestIds.add(qId);

        const status = ['idle', 'in_progress', 'completed'].includes(quest.status) ? quest.status : 'in_progress';
        const rawSteps = Array.isArray(quest.steps) ? quest.steps : [];
        const steps = rawSteps.map((step: any, sIdx: number) => {
          if (!isRecord(step)) return null;
          const sId = typeof step.id === 'string' && step.id.trim() ? step.id.trim().slice(0, 100) : `step_${sIdx + 1}`;
          let sTitle = typeof step.title === 'string' && step.title.trim() ? step.title.trim().slice(0, 180) : `Étape ${sIdx + 1}`;
          let sDesc = typeof step.description === 'string' ? step.description.trim().slice(0, 250) : '';
          if (/^(?:la|le|l'|les).+(?:est désormais|a été|sont désormais|ont été)/i.test(sDesc)) {
            sDesc = `Consulter l'élément : ${sDesc}`;
          }
          if (/^(?:la|le|l'|les).+(?:est désormais|a été|sont désormais|ont été)/i.test(sTitle)) {
            sTitle = `Interagir avec l'élément en place`;
          }
          const reqEv = typeof step.requiredEvent === 'string' && step.requiredEvent.trim() ? step.requiredEvent.trim().slice(0, 250) : 'INTERACT';

          let targetEntityId = typeof step.targetEntityId === 'string' ? step.targetEntityId : undefined;
          let targetZoneId = typeof step.targetZoneId === 'string' ? step.targetZoneId : undefined;

          if (reqEv.includes(':')) {
            const parts = reqEv.split(':').map((p: string) => p.trim()).filter(Boolean);
            const baseEvt = (parts[0] || '').toUpperCase();
            const isDualTargetEvt = baseEvt === 'DROP' || baseEvt === 'PROXIMITY' || baseEvt === 'COLLIDE' || baseEvt === 'TRANSFER';
            if (parts.length >= 3 && isDualTargetEvt) {
              if (!targetEntityId || targetEntityId === parts[2]) {
                targetEntityId = parts[1];
              }
              if (!targetZoneId) {
                targetZoneId = parts[2];
              }
            } else {
              if (!targetEntityId && parts[1]) targetEntityId = parts[1];
              if (!targetZoneId && parts[2]) targetZoneId = parts[2];
            }
          }

          const resolveValidEntityId = (cand: string | undefined): string | undefined => {
            if (!cand) return undefined;
            if (allEntityIds.has(cand)) return cand;
            const low = cand.toLowerCase();
            return Array.from(allEntityIds).find(eid => eid.toLowerCase().includes(low) || low.includes(eid.toLowerCase()));
          };

          const resolvedTargetEntityId = resolveValidEntityId(targetEntityId);
          const resolvedTargetZoneId = resolveValidEntityId(targetZoneId);

          const normalizedStep: Record<string, any> = {
            ...step,
            id: sId,
            title: sTitle,
            ...(sDesc ? { description: sDesc } : {}),
            requiredEvent: reqEv,
            completed: typeof step.completed === 'boolean' ? step.completed : false,
          };
          if (resolvedTargetEntityId) normalizedStep.targetEntityId = resolvedTargetEntityId;
          else delete normalizedStep.targetEntityId;
          if (resolvedTargetZoneId) normalizedStep.targetZoneId = resolvedTargetZoneId;
          else delete normalizedStep.targetZoneId;
          return normalizedStep;
        }).filter(Boolean);

        return {
          ...quest,
          id: qId,
          title: typeof quest.title === 'string' && quest.title.trim() ? quest.title.trim().slice(0, 180) : 'Mission Interactive',
          status,
          currentStepIndex: typeof quest.currentStepIndex === 'number' ? quest.currentStepIndex : 0,
          steps
        };
      }).filter(Boolean);
    }
  }

  validateModelResponse(parsed, currentEntities, existingQuestIds);
  const normalized = ensureMinimumViableExperience(parsed as { plan: CommandPlan; patch: WorldPatch }, existingQuestIds);
  validateModelResponse(normalized, currentEntities, existingQuestIds);
  return normalized;
}

function validateModelResponse(
  value: unknown,
  currentEntities: Record<string, EntitySpec>,
  existingQuestIds: string[]
): asserts value is { plan: CommandPlan; patch: WorldPatch } {
  if (!isRecord(value) || !isRecord(value.plan) || !isRecord(value.patch)) {
    throw new Error('Invalid model response: expected plan and patch objects.');
  }
  if (isRecord(value) && (value as any).type === 'json_object') {
    delete (value as any).type;
  }
  assertString(value.plan.intent, 'plan.intent', 250);
  assertBoundedArray(value.plan.actions, 'plan.actions', 64);
  if (value.plan.clarification !== undefined) {
    if (!isRecord(value.plan.clarification) || typeof value.plan.clarification.needed !== 'boolean') {
      throw new Error('Invalid model response: plan.clarification has an invalid shape.');
    }
    if (value.plan.clarification.needed && value.plan.clarification.question) {
      assertString(value.plan.clarification.question, 'plan.clarification.question', 500);
    }
    if (value.plan.clarification.options !== undefined && Array.isArray(value.plan.clarification.options) && value.plan.clarification.options.length > 0) {
      assertBoundedArray(value.plan.clarification.options, 'plan.clarification.options', 10);
      value.plan.clarification.options.forEach((option: unknown, index: number) => assertString(option, `plan.clarification.options[${index}]`, 200));
    }
  }

  const patch = value.patch;
  if (Object.keys(patch).some(key => !ALLOWED_PATCH_KEYS.has(key))) {
    throw new Error('Invalid model response: patch contains an unsupported field.');
  }
  for (const field of ['entitiesCreated', 'entitiesRemoved', 'entitiesChanged', 'rulesChanged', 'invariantsAdded', 'questsAdded'] as const) {
    if (patch[field] !== undefined) assertBoundedArray(patch[field], `patch.${field}`);
  }
  for (const field of ['questUpdated', 'gameplayPatch'] as const) {
    if (patch[field] !== undefined && !isRecord(patch[field])) {
      throw new Error(`Invalid model response: patch.${field} must be an object.`);
    }
  }
  if (patch.worldTheme !== undefined) {
    assertString(patch.worldTheme, 'patch.worldTheme', 100);
  }
  if (patch.persona !== undefined && !isRecord(patch.persona)) {
    throw new Error('Invalid model response: patch.persona must be an object.');
  }

  const removed = new Set<string>();
  (patch.entitiesRemoved || []).forEach((id: unknown) => {
    assertString(id, 'patch.entitiesRemoved[]', 128);
    if (!currentEntities[id] || removed.has(id)) {
      throw new Error(`Invalid model response: entity "${id}" cannot be removed because it is missing or duplicated.`);
    }
    removed.add(id);
  });

  const created = patch.entitiesCreated || [];
  const createdIds = new Set<string>();
  const partIds = new Set<string>();
  Object.entries(currentEntities).forEach(([id, ent]) => {
    if (removed.has(id)) return;
    if (Array.isArray(ent?.parts)) {
      ent.parts.forEach((p: any) => {
        if (isRecord(p) && typeof p.id === 'string') {
          partIds.add(p.id);
        }
      });
    }
  });
  created.forEach((entity: unknown, index: number) => {
    validateEntity(entity, `patch.entitiesCreated[${index}]`);
    if (createdIds.has(entity.id) || (currentEntities[entity.id] && !removed.has(entity.id))) {
      throw new Error(`Invalid model response: entity id "${entity.id}" is duplicated or already exists.`);
    }
    createdIds.add(entity.id);
    if (isRecord(entity) && Array.isArray(entity.parts)) {
      entity.parts.forEach((p: any) => {
        if (isRecord(p) && typeof p.id === 'string') {
          partIds.add(p.id);
        }
      });
    }
  });

  const availableEntityIds = new Set([
    ...Object.keys(currentEntities).filter(id => !removed.has(id)),
    ...createdIds,
    ...partIds,
    'player',
    'world',
    'system'
  ]);
  (patch.entitiesChanged || []).forEach((entity: unknown, index: number) => {
    if (!isRecord(entity)) throw new Error(`Invalid model response: patch.entitiesChanged[${index}] must be an object.`);
    assertString(entity.id, `patch.entitiesChanged[${index}].id`, 128);
    if (!availableEntityIds.has(entity.id)) throw new Error(`Invalid model response: changed entity "${entity.id}" does not exist.`);
    if (entity.capabilities !== undefined) {
      assertBoundedArray(entity.capabilities, `patch.entitiesChanged[${index}].capabilities`, 64);
      entity.capabilities.forEach((capability: unknown, capabilityIndex: number) => {
        if (!isRecord(capability)) throw new Error(`Invalid model response: changed capability ${capabilityIndex} must be an object.`);
        assertString(capability.type, `patch.entitiesChanged[${index}].capabilities[${capabilityIndex}].type`, 80);
        if (capability.type === 'transform' && capability.position !== undefined) {
          const position = capability.position;
          if (!isRecord(position) || !['x', 'y', 'z'].every(axis => Number.isFinite(position[axis]))) {
            throw new Error(`Invalid model response: patch.entitiesChanged[${index}] has an invalid transform position.`);
          }
        }
      });
    }
  });

  (patch.rulesChanged || []).forEach((rule: unknown, index: number) => {
    if (!isRecord(rule)) throw new Error(`Invalid model response: patch.rulesChanged[${index}] must be an object.`);
    assertString(rule.id, `patch.rulesChanged[${index}].id`, 128);
    assertString(rule.trigger, `patch.rulesChanged[${index}].trigger`, 80);
    assertBoundedArray(rule.conditions, `patch.rulesChanged[${index}].conditions`, 64);
    assertBoundedArray(rule.actions, `patch.rulesChanged[${index}].actions`, 64);
    rule.conditions.forEach((condition: unknown, conditionIndex: number) => {
      if (!isRecord(condition)) throw new Error(`Invalid model response: rule condition ${conditionIndex} must be an object.`);
      assertString(condition.type, `rule condition ${conditionIndex}.type`, 80);
      for (const key of ['sourceId', 'targetId'] as const) {
        const id = condition[key];
        if (typeof id === 'string' && id !== '*' && !id.toLowerCase().includes('any') && !availableEntityIds.has(id)) {
          throw new Error(`Invalid model response: rule condition references missing entity "${id}".`);
        }
      }
    });
    rule.actions.forEach((action: unknown, actionIndex: number) => {
      if (!isRecord(action) || typeof action.type !== 'string' || !ALLOWED_ACTION_TYPES.has(action.type)) {
        throw new Error(`Invalid model response: rule action ${actionIndex} has an unsupported type.`);
      }
      for (const key of ['entityId', 'targetId', 'sourceEntityId', 'targetEntityId'] as const) {
        const id = action[key];
        if (typeof id === 'string' && id !== 'player' && id !== 'world' && id !== '*' && !availableEntityIds.has(id)) {
          throw new Error(`Invalid model response: action references missing entity "${id}".`);
        }
      }
    });
  });

  const questsAdded = patch.questsAdded || [];
  const questIds = new Set(existingQuestIds);
  questsAdded.forEach((quest: unknown, index: number) => {
    if (!isRecord(quest)) throw new Error(`Invalid model response: patch.questsAdded[${index}] must be an object.`);
    assertString(quest.id, `patch.questsAdded[${index}].id`, 128);
    assertString(quest.title, `patch.questsAdded[${index}].title`, 200);
    assertBoundedArray(quest.steps, `patch.questsAdded[${index}].steps`, 50);
    if (!['idle', 'in_progress', 'completed'].includes(quest.status)) {
      throw new Error(`Invalid model response: quest "${quest.id}" has an unsupported status.`);
    }
    if (questIds.has(quest.id)) throw new Error(`Invalid model response: quest id "${quest.id}" is duplicated.`);
    questIds.add(quest.id);
    quest.steps.forEach((step: unknown, stepIndex: number) => {
      if (!isRecord(step)) throw new Error(`Invalid model response: quest step ${stepIndex} must be an object.`);
      assertString(step.id, `quest step ${stepIndex}.id`, 128);
      assertString(step.title, `quest step ${stepIndex}.title`, 200);
      assertString(step.requiredEvent, `quest step ${stepIndex}.requiredEvent`, 300);
      if (typeof step.completed !== 'boolean') throw new Error(`Invalid model response: quest step ${stepIndex}.completed must be boolean.`);
      for (const key of ['targetEntityId', 'targetZoneId'] as const) {
        if (typeof step[key] === 'string' && !availableEntityIds.has(step[key])) {
          throw new Error(`Invalid model response: quest step references missing entity "${step[key]}".`);
        }
      }
    });
  });

  (patch.invariantsAdded || []).forEach((invariant: unknown, index: number) => {
    if (!isRecord(invariant)) throw new Error(`Invalid model response: invariant ${index} must be an object.`);
    assertString(invariant.id, `patch.invariantsAdded[${index}].id`, 128);
    assertString(invariant.description, `patch.invariantsAdded[${index}].description`, 500);
  });

  if (patch.activeQuestId !== undefined && patch.activeQuestId !== null && patch.activeQuestId !== '') {
    assertString(patch.activeQuestId, 'patch.activeQuestId', 128);
    if (!questIds.has(patch.activeQuestId)) throw new Error(`Invalid model response: active quest "${patch.activeQuestId}" is not present.`);
  }
}

function ensureMinimumViableExperience(
  parsed: { plan: CommandPlan; patch: WorldPatch },
  existingQuestIds: string[] = []
): { plan: CommandPlan; patch: WorldPatch } {
  if (!parsed || !parsed.patch) return parsed;
  const p = parsed.patch;

  // Seules les expériences entièrement vierges sans aucune quête active méritent une quête MVE de découverte
  if (existingQuestIds.length === 0 && (!p.questsAdded || p.questsAdded.length === 0)) {
    const nonAvatarEntities = (p.entitiesCreated || []).filter(e => 
      !e.id?.toLowerCase().includes('avatar') && 
      !e.name?.toLowerCase().includes('avatar') &&
      !e.id?.toLowerCase().includes('guide')
    );
    if (nonAvatarEntities.length > 0) {
      const first = nonAvatarEntities[0];
      const questId = `quest_mve_${Date.now()}`;
      p.questsAdded = [
        {
          id: questId,
          title: `Objectif : Découverte de ${first.name || 'la Scène'}`,
          description: `Interagissez avec ${first.name || 'les objets'} pour explorer l'environnement.`,
          currentStepIndex: 0,
          status: 'in_progress',
          steps: [
            {
              id: `step_${first.id}`,
              title: `Interagir avec ${first.name || 'l\'objet'}`,
              description: `Manipulez ou touchez ${first.name || 'l\'objet'}.`,
              targetEntityId: first.id,
              requiredEvent: `CLICK:${first.id}`,
              completed: false,
            },
          ],
        },
      ];
      p.activeQuestId = questId;
    }
  }
  return parsed;
}
