// src/engine/worldFormat.ts
// WorldPilot Declarative World Representation (JSON & YAML)
// Allows bidirectional serialization, editing, validation and file export/import
// without requiring heavy external dependencies.

import type { WorldIR, WorldState, WorldPatch } from '../core/types';

/**
 * Validates a declarative WorldIR data structure.
 */
export function validateWorldIR(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Le document du monde doit être un objet racine valide.'] };
  }

  const ir = data.ir || data;

  if (!ir.entities || typeof ir.entities !== 'object') {
    errors.push('La clé "entities" est requise et doit être un dictionnaire.');
  } else {
    for (const [id, entity] of Object.entries(ir.entities) as [string, any][]) {
      if (!entity || typeof entity !== 'object') {
        errors.push(`Entité "${id}" invalide : doit être un objet.`);
        continue;
      }
      if (!entity.id) {
        errors.push(`Entité "${id}" manque d'un identifiant "id".`);
      }
      if (!Array.isArray(entity.capabilities)) {
        errors.push(`Entité "${id}" doit contenir une liste de "capabilities".`);
      }
    }
  }

  if (ir.rules && typeof ir.rules !== 'object') {
    errors.push('La clé "rules" doit être un dictionnaire si elle est spécifiée.');
  }

  if (ir.invariants && typeof ir.invariants !== 'object') {
    errors.push('La clé "invariants" doit être un dictionnaire si elle est spécifiée.');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Serializes any JavaScript object or primitive into clean, human-readable YAML.
 */
export function stringifyYaml(obj: any, indentLevel = 0): string {
  const indent = '  '.repeat(indentLevel);

  if (obj === null || obj === undefined) {
    return 'null';
  }

  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return String(obj);
  }

  if (typeof obj === 'string') {
    if (obj.includes('\n')) {
      const lines = obj.split('\n');
      return '|\n' + lines.map(l => `${indent}  ${l}`).join('\n');
    }
    // Quote string if it contains special YAML characters, leading/trailing whitespace, or looks like a number/bool
    if (/[:#\[\]{},&*?|<>=!%@`~-]/.test(obj) || obj === '' || /^\s|\s$/.test(obj) || /^(true|false|null|[0-9]+(\.[0-9]+)?)$/i.test(obj)) {
      return JSON.stringify(obj);
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]';
    // Compact representation for small numeric vectors like [0, 1, 0]
    if (obj.length <= 4 && obj.every(x => typeof x === 'number')) {
      return `[${obj.join(', ')}]`;
    }

    return obj.map(item => {
      if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
        const itemYaml = stringifyYaml(item, indentLevel + 1);
        const trimmed = itemYaml.trim();
        // If the object has multiple lines, format nicely with the first line following '-'
        const lines = trimmed.split('\n');
        return lines.length === 1
          ? `${indent}- ${lines[0]}`
          : `${indent}- ${lines[0]}\n${lines.slice(1).join('\n')}`;
      } else {
        return `${indent}- ${stringifyYaml(item, indentLevel + 1)}`;
      }
    }).join('\n');
  }

  if (typeof obj === 'object') {
    const keys = Object.keys(obj);
    if (keys.length === 0) return '{}';

    return keys.map(key => {
      const val = obj[key];
      if (val === undefined) return null;
      if (typeof val === 'object' && val !== null) {
        if (Array.isArray(val) && val.length === 0) {
          return `${indent}${key}: []`;
        }
        if (Array.isArray(val) && val.length <= 4 && val.every(x => typeof x === 'number')) {
          return `${indent}${key}: [${val.join(', ')}]`;
        }
        if (!Array.isArray(val) && Object.keys(val).length === 0) {
          return `${indent}${key}: {}`;
        }
        return `${indent}${key}:\n${stringifyYaml(val, indentLevel + 1)}`;
      } else {
        return `${indent}${key}: ${stringifyYaml(val, indentLevel)}`;
      }
    }).filter(Boolean).join('\n');
  }

  return String(obj);
}

/**
 * Lightweight, robust parser for declarative YAML strings.
 * Falls back to JSON.parse if the content is JSON formatted.
 */
export function parseYaml(yamlString: string): any {
  const trimmed = yamlString.trim();
  if (!trimmed) return {};

  // Direct fast path if user supplied standard JSON
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      return JSON.parse(trimmed);
    } catch (_) {}
  }

  const lines = yamlString.split('\n');
  const root: any = {};
  
  // Track hierarchy via an indentation stack
  interface StackEntry {
    indent: number;
    container: any;
    key?: string | number;
    isList: boolean;
  }

  const stack: StackEntry[] = [{ indent: -1, container: root, isList: false }];

  function parsePrimitive(val: string): any {
    const clean = val.trim();
    if (clean === 'null' || clean === '~' || clean === '') return null;
    if (clean === 'true') return true;
    if (clean === 'false') return false;
    if (/^-?[0-9]+(\.[0-9]+)?$/.test(clean)) return Number(clean);
    if ((clean.startsWith('"') && clean.endsWith('"')) || (clean.startsWith("'") && clean.endsWith("'"))) {
      try {
        return JSON.parse(clean);
      } catch {
        return clean.slice(1, -1);
      }
    }
    if (clean.startsWith('[') && clean.endsWith(']')) {
      try {
        return JSON.parse(clean);
      } catch {
        const inner = clean.slice(1, -1).split(',').map(s => parsePrimitive(s.trim()));
        return inner;
      }
    }
    if (clean === '{}') return {};
    if (clean === '[]') return [];
    return clean;
  }

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const rawLine = lines[lineIndex];
    // Ignore comments and blank lines
    if (!rawLine.trim() || rawLine.trim().startsWith('#')) continue;

    const indent = rawLine.search(/\S/);
    const content = rawLine.trim();

    // Pop stack entries that are at equal or deeper indentation
    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
      stack.pop();
    }

    const currentContext = stack[stack.length - 1];

    if (content.startsWith('- ')) {
      // Array item
      const itemContent = content.slice(2).trim();
      if (!Array.isArray(currentContext.container)) {
        // Convert container or parent key to array if needed
        continue;
      }

      if (itemContent.includes(': ') && !itemContent.startsWith('{') && !itemContent.startsWith('"') && !itemContent.startsWith("'")) {
        // Inline object in list item, e.g.: - type: transform
        const obj: any = {};
        const colonIdx = itemContent.indexOf(':');
        const k = itemContent.slice(0, colonIdx).trim();
        const v = itemContent.slice(colonIdx + 1).trim();
        obj[k] = parsePrimitive(v);
        currentContext.container.push(obj);
        stack.push({ indent, container: obj, isList: false });
      } else if (itemContent.endsWith(':') && !itemContent.startsWith('"') && !itemContent.startsWith("'")) {
        // List item starting with a nested container key, e.g.: - position:
        const k = itemContent.slice(0, -1).trim();
        let isNextList = false;
        for (let j = lineIndex + 1; j < lines.length; j++) {
          const nextTrim = lines[j].trim();
          if (!nextTrim || nextTrim.startsWith('#')) continue;
          isNextList = nextTrim.startsWith('- ');
          break;
        }
        const obj: any = {};
        const newContainer = isNextList ? [] : {};
        obj[k] = newContainer;
        currentContext.container.push(obj);
        stack.push({ indent, container: obj, isList: false });
        stack.push({ indent: indent + 2, container: newContainer, key: k, isList: isNextList });
      } else if (itemContent === '') {
        const obj: any = {};
        currentContext.container.push(obj);
        stack.push({ indent, container: obj, isList: false });
      } else {
        currentContext.container.push(parsePrimitive(itemContent));
      }
    } else if (content.includes(':')) {
      const colonIdx = content.indexOf(':');
      const key = content.slice(0, colonIdx).trim();
      const rest = content.slice(colonIdx + 1).trim();

      if (rest === '|') {
        const blockLines: string[] = [];
        let blockIndent = -1;
        while (lineIndex + 1 < lines.length) {
          const nextLine = lines[lineIndex + 1];
          if (nextLine.trim() === '') {
            blockLines.push('');
            lineIndex++;
            continue;
          }
          const nextIndent = nextLine.search(/\S/);
          if (nextIndent <= indent) break;
          if (blockIndent === -1) blockIndent = nextIndent;
          blockLines.push(nextLine.slice(blockIndent));
          lineIndex++;
        }
        while (blockLines.length > 0 && blockLines[blockLines.length - 1] === '') {
          blockLines.pop();
        }
        const blockVal = blockLines.join('\n');
        if (Array.isArray(currentContext.container)) {
          const obj: any = {};
          obj[key] = blockVal;
          currentContext.container.push(obj);
        } else {
          currentContext.container[key] = blockVal;
        }
      } else if (rest === '') {
        // Lookahead to see if next child is a list item or sub-object
        let isNextList = false;
        for (let j = lineIndex + 1; j < lines.length; j++) {
          const nextTrim = lines[j].trim();
          if (!nextTrim || nextTrim.startsWith('#')) continue;
          isNextList = nextTrim.startsWith('- ');
          break;
        }

        const newContainer = isNextList ? [] : {};
        if (Array.isArray(currentContext.container)) {
          const obj: any = {};
          obj[key] = newContainer;
          currentContext.container.push(obj);
        } else {
          currentContext.container[key] = newContainer;
        }
        stack.push({ indent, container: newContainer, key, isList: isNextList });
      } else {
        const val = parsePrimitive(rest);
        if (Array.isArray(currentContext.container)) {
          const obj: any = {};
          obj[key] = val;
          currentContext.container.push(obj);
        } else {
          currentContext.container[key] = val;
        }
      }
    }
  }

  return root;
}

/**
 * Exports a WorldState or WorldIR to a structured .world.yaml document string.
 */
export function exportWorldToYaml(worldOrIR: WorldState | WorldIR): string {
  const ir: WorldIR = 'ir' in worldOrIR ? worldOrIR.ir : worldOrIR;
  const header = [
    '# =========================================================================',
    '# WorldPilot Declarative Spatial Substrate (.world.yaml)',
    '# Schema: WorldIR v1.0 · Neural-Symbolic Architecture',
    '# =========================================================================',
    ''
  ].join('\n');

  const payload = {
    version: 'ir' in worldOrIR ? (worldOrIR.version ?? 1) : 1,
    ir: {
      entities: ir.entities || {},
      rules: ir.rules || {},
      invariants: ir.invariants || {},
      quests: ir.quests || {},
      activeQuestId: ir.activeQuestId || null
    },
    ...('flags' in worldOrIR ? { flags: worldOrIR.flags } : {})
  };

  return header + stringifyYaml(payload);
}

/**
 * Parses a .world.yaml string and extracts a normalized WorldIR.
 */
export function parseWorldFromYaml(yamlStr: string): WorldIR {
  const parsed = parseYaml(yamlStr);
  const ir = parsed.ir || parsed;

  const normalized: WorldIR = {
    entities: ir.entities || {},
    rules: ir.rules || {},
    invariants: ir.invariants || {},
    quests: ir.quests || {},
    activeQuestId: ir.activeQuestId || null
  };

  const validation = validateWorldIR(normalized);
  if (!validation.valid) {
    console.warn('[WorldFormat] Avertissements lors du chargement YAML :', validation.errors);
  }

  return normalized;
}

/**
 * Exports a WorldState or WorldIR to a formatted .world.json document string.
 */
export function exportWorldToJson(worldOrIR: WorldState | WorldIR): string {
  const ir: WorldIR = 'ir' in worldOrIR ? worldOrIR.ir : worldOrIR;
  const payload = {
    format: 'worldpilot.world.json',
    version: 'ir' in worldOrIR ? (worldOrIR.version ?? 1) : 1,
    ir: {
      entities: ir.entities || {},
      rules: ir.rules || {},
      invariants: ir.invariants || {},
      quests: ir.quests || {},
      activeQuestId: ir.activeQuestId || null
    },
    ...('flags' in worldOrIR ? { flags: worldOrIR.flags } : {})
  };

  return JSON.stringify(payload, null, 2);
}

/**
 * Parses a .world.json string and extracts a normalized WorldIR.
 */
export function parseWorldFromJson(jsonStr: string): WorldIR {
  const parsed = JSON.parse(jsonStr);
  const ir = parsed.ir || parsed;

  return {
    entities: ir.entities || {},
    rules: ir.rules || {},
    invariants: ir.invariants || {},
    quests: ir.quests || {},
    activeQuestId: ir.activeQuestId || null
  };
}

/**
 * Exports a WorldPatch to YAML format.
 */
export function exportPatchToYaml(patch: WorldPatch): string {
  return stringifyYaml(patch);
}

/**
 * Parses a WorldPatch from YAML format.
 */
export function parsePatchFromYaml(yamlStr: string): WorldPatch {
  return parseYaml(yamlStr) as WorldPatch;
}

import { exportSceneToJsonLd } from './semanticManifest';

/**
 * Browser download helper for saving a .world.yaml, .world.json, or .scene.jsonld file to local disk.
 */
export function downloadWorldFile(worldOrIR: WorldState | WorldIR, format: 'json' | 'yaml' | 'jsonld' = 'yaml', filename?: string): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const ir: WorldIR = 'ir' in worldOrIR ? (worldOrIR as WorldState).ir : (worldOrIR as WorldIR);
  let content = '';
  let mime = '';
  let ext = '';

  if (format === 'yaml') {
    content = exportWorldToYaml(worldOrIR);
    mime = 'text/yaml;charset=utf-8';
    ext = '.world.yaml';
  } else if (format === 'jsonld') {
    content = exportSceneToJsonLd(ir, (worldOrIR as any).name || (worldOrIR as any).currentSceneTitle || 'Scene WorldPilot');
    mime = 'application/ld+json;charset=utf-8';
    ext = '.scene.jsonld';
  } else {
    content = exportWorldToJson(worldOrIR);
    mime = 'application/json;charset=utf-8';
    ext = '.world.json';
  }

  const fname = filename ? (filename.endsWith(ext) ? filename : `${filename}${ext}`) : `scene_${Date.now()}${ext}`;

  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fname;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
