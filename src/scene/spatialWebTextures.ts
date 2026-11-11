import * as THREE from 'three';

/**
 * Générateur de textures procédurales haute fidélité pour le Web 3D.
 * Générées en mémoire via l'API Canvas 2D, légères, sans dépendances externes,
 * et parfaitement intégrées au pipeline Three.js / WebGL.
 */

// Cache mémoire pour réutiliser les textures identiques
const textureCache = new Map<string, THREE.CanvasTexture>();

/**
 * Crée une texture de terminal informatique pour le SpatialLaptop
 */
export function getTerminalCanvasTexture(): THREE.CanvasTexture {
  const cacheKey = 'laptop_terminal';
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey)!;

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 640;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Fond terminal sombre style Matrix / Cyberpunk
    ctx.fillStyle = '#050c0d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Barre supérieure de fenêtre
    ctx.fillStyle = '#0b191c';
    ctx.fillRect(0, 0, canvas.width, 48);

    // Boutons de fenêtre Mac OS rétro
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(32, 24, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(58, 24, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(84, 24, 8, 0, Math.PI * 2);
    ctx.fill();

    // Titre de l'onglet
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('bash — worldpilot-agent@spatial-web: ~', 120, 31);

    // Lignes de code / commande
    ctx.font = '24px "Courier New", Courier, monospace';

    const lines: Array<{ text: string; color: string }> = [
      { text: '┌──(worldpilot㉿core)-[~/spatial-web-3d]', color: '#38bdf8' },
      { text: '└─$ ./init_spatial_engine --mode=contrarian --fps=60', color: '#f8fafc' },
      { text: '[SYSTEM] Initializing WebGL 2.0 WebXR Kernel...', color: '#10b981' },
      { text: '[ENGINE] Spatial Causality Engine: ACTIVATED (7 Affordances)', color: '#34d399' },
      { text: '[AFFORDANCES] slice_chop, cook_simmer, pour_liquid, read_study', color: '#a7f3d0' },
      { text: '[WEB 3D] Materialized portals: Book, Dossier, Laptop, Canvas, Turntable', color: '#6ee7b7' },
      { text: '[AUDIO] HRTF 3D Spatial Panner connected (48kHz stereo)', color: '#fbbf24' },
      { text: '[PHYSICS] Spring inertia banking + Magnetic tether lock: OK', color: '#38bdf8' },
      { text: '-------------------------------------------------------', color: '#334155' },
      { text: 'const portal = new SpatialWeb3D({ diegetic: true });', color: '#ec4899' },
      { text: 'await portal.materializeResources(document.all);', color: '#f43f5e' },
      { text: 'worldpilot: Ready for tactile spatial interaction.', color: '#10b981' },
      { text: '> root@worldpilot:~$ █', color: '#22c55e' }
    ];

    let y = 92;
    for (const line of lines) {
      ctx.fillStyle = line.color;
      ctx.fillText(line.text, 36, y);
      y += 38;
    }

    // Grille de balayage CRT subtile
    ctx.fillStyle = 'rgba(0, 255, 120, 0.03)';
    for (let sy = 0; sy < canvas.height; sy += 4) {
      ctx.fillRect(0, sy, canvas.width, 1.5);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * Crée une texture de parchemin ancien enluminé pour le SpatialBookModel
 */
export function getBookParchmentCanvasTexture(title?: string, pageIndex: number = 0): THREE.CanvasTexture {
  const normPageIndex = Math.max(0, Math.min(2, pageIndex));
  const cacheKey = `book_parchment_${title || 'default'}_p${normPageIndex}`;
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey)!;

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Fond parchemin chaud crème / vélin
    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Ombrage de pli central (reliure)
    const spineGradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    spineGradient.addColorStop(0, '#fde68a');
    spineGradient.addColorStop(0.46, '#fef9c3');
    spineGradient.addColorStop(0.5, '#d97706');
    spineGradient.addColorStop(0.54, '#fef9c3');
    spineGradient.addColorStop(1, '#fde68a');
    ctx.fillStyle = spineGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Bordure dorée filigrane
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 4;
    ctx.strokeRect(30, 30, canvas.width / 2 - 50, canvas.height - 60);
    ctx.strokeRect(canvas.width / 2 + 20, 30, canvas.width / 2 - 50, canvas.height - 60);

    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(36, 36, canvas.width / 2 - 62, canvas.height - 72);
    ctx.strokeRect(canvas.width / 2 + 26, 36, canvas.width / 2 - 62, canvas.height - 72);

    if (normPageIndex === 0) {
      // PAGE 0 : CHAPITRE I — De Spatio Computatrali
      ctx.fillStyle = '#78350f';
      ctx.font = 'bold 36px "Georgia", "Times New Roman", serif';
      ctx.textAlign = 'center';
      ctx.fillText('LIBER PRIMUS', canvas.width / 4, 90);

      ctx.font = 'italic 22px "Georgia", serif';
      ctx.fillStyle = '#92400e';
      ctx.fillText(title || 'De Spatio Computatrali', canvas.width / 4, 125);

      // Lettrine W majuscule enluminée
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(55, 155, 80, 80);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      ctx.strokeRect(55, 155, 80, 80);

      ctx.fillStyle = '#fef3c7';
      ctx.font = 'bold 64px "Georgia", serif';
      ctx.fillText('W', 95, 218);

      ctx.fillStyle = '#451a03';
      ctx.font = '19px "Georgia", serif';
      ctx.textAlign = 'left';

      const leftLines = [
        'orldPilot inaugurat novam',
        'dimensionem textualem.',
        'Corpora spatialia veritatem',
        'digitalem incarnant. Non iam',
        'solum computatrum per speculum',
        'planum aspicimus, sed per',
        'artificia tridimensionale',
        'manibus nostris contingimus.',
        '',
        'Hic liber nectit paginas',
        'mundi interretialis cum',
        'sensus tactus et ponderis.',
        'Omnis pagina vivit et',
        'resonance sonora respondet.'
      ];

      let ly = 180;
      for (let i = 0; i < leftLines.length; i++) {
        if (i < 2) ctx.fillText(leftLines[i], 145, ly);
        else ctx.fillText(leftLines[i], 58, ly);
        ly += 30;
      }

      // Page de droite
      ctx.textAlign = 'center';
      ctx.fillStyle = '#78350f';
      ctx.font = 'bold 32px "Georgia", serif';
      ctx.fillText('SPATIAL CAUSALITY', (canvas.width * 3) / 4, 90);

      ctx.font = 'italic 20px "Georgia", serif';
      ctx.fillStyle = '#92400e';
      ctx.fillText('De Causalitate Rerum', (canvas.width * 3) / 4, 125);

      const cx = (canvas.width * 3) / 4;
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, 260, 90, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, 260, 60, 0, Math.PI * 2);
      ctx.stroke();

      for (let a = 0; a < 8; a++) {
        const angle = (a * Math.PI) / 4;
        ctx.moveTo(cx, 260);
        ctx.lineTo(cx + Math.cos(angle) * 85, 260 + Math.sin(angle) * 85);
      }
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.fillStyle = '#451a03';
      ctx.font = '19px "Georgia", serif';
      const rightLines = [
        'Schema Causale Rerum :',
        '1. Sectio per ferrum cultelli',
        '2. Coctio per ignem fornacis',
        '3. Fusio per calicem vitri',
        '4. Lectio per oculos animi',
        '',
        '« Veritas in spatio reperitur »'
      ];
      let ry = 400;
      for (const rline of rightLines) {
        ctx.fillText(rline, canvas.width / 2 + 60, ry);
        ry += 32;
      }

      ctx.textAlign = 'center';
      ctx.font = 'italic 18px "Georgia", serif';
      ctx.fillStyle = '#92400e';
      ctx.fillText('— XII —', canvas.width / 4, canvas.height - 45);
      ctx.fillText('— XIII —', (canvas.width * 3) / 4, canvas.height - 45);
    } else if (normPageIndex === 1) {
      // PAGE 1 : CHAPITRE II — De Affordantiis
      ctx.fillStyle = '#78350f';
      ctx.font = 'bold 36px "Georgia", serif';
      ctx.textAlign = 'center';
      ctx.fillText('LIBER SECUNDUS', canvas.width / 4, 90);

      ctx.font = 'italic 22px "Georgia", serif';
      ctx.fillStyle = '#92400e';
      ctx.fillText('De Affordantiis & Materia', canvas.width / 4, 125);

      // Lettrine A
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(55, 155, 80, 80);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.strokeRect(55, 155, 80, 80);

      ctx.fillStyle = '#fef3c7';
      ctx.font = 'bold 64px "Georgia", serif';
      ctx.fillText('A', 95, 218);

      ctx.fillStyle = '#451a03';
      ctx.font = '19px "Georgia", serif';
      ctx.textAlign = 'left';

      const leftLines = [
        'ffordantia est facultas',
        'corporis cum altero uniri.',
        'Non per casum physicum,',
        'sed per ordinem logicum.',
        'Cum cultellus appropinquat,',
        'materia finditur in particulas.',
        'Cum olla calefit, vapor ascendit',
        'et calor cibum transformat.',
        '',
        'Tether magneticus ducit manum',
        'ad punctum convenientem,',
        'ut omnis actio sit facilis',
        'et oculo grata.'
      ];

      let ly = 180;
      for (let i = 0; i < leftLines.length; i++) {
        if (i < 2) ctx.fillText(leftLines[i], 145, ly);
        else ctx.fillText(leftLines[i], 58, ly);
        ly += 30;
      }

      // Page de droite
      ctx.textAlign = 'center';
      ctx.fillStyle = '#78350f';
      ctx.font = 'bold 32px "Georgia", serif';
      ctx.fillText('SEPTEM AFFORDANTIAE', (canvas.width * 3) / 4, 90);

      ctx.font = 'italic 20px "Georgia", serif';
      ctx.fillStyle = '#92400e';
      ctx.fillText('Canon Septem Legum', (canvas.width * 3) / 4, 125);

      ctx.textAlign = 'left';
      ctx.fillStyle = '#451a03';
      ctx.font = '19px "Georgia", serif';
      const rightLines = [
        'I.   slice_chop : sectio subtilis',
        'II.  cook_simmer : vapor thermalis',
        'III. pour_liquid : fluxus continuus',
        'IV.  read_study : lectio librorum',
        'V.   ignite_fire : flamma ardens',
        'VI.  unlock_circuit : clavis electrica',
        'VII. stack_contain : ordo planitie',
        '',
        '« Ordo rerum in spatio clarescit »'
      ];
      let ry = 190;
      for (const rline of rightLines) {
        ctx.fillText(rline, canvas.width / 2 + 60, ry);
        ry += 38;
      }

      ctx.textAlign = 'center';
      ctx.font = 'italic 18px "Georgia", serif';
      ctx.fillStyle = '#92400e';
      ctx.fillText('— XIV —', canvas.width / 4, canvas.height - 45);
      ctx.fillText('— XV —', (canvas.width * 3) / 4, canvas.height - 45);
    } else {
      // PAGE 2 : CHAPITRE III — De Portalis Web 3D
      ctx.fillStyle = '#78350f';
      ctx.font = 'bold 36px "Georgia", serif';
      ctx.textAlign = 'center';
      ctx.fillText('LIBER TERTIUS', canvas.width / 4, 90);

      ctx.font = 'italic 22px "Georgia", serif';
      ctx.fillStyle = '#92400e';
      ctx.fillText('De Portalis Web 3D & PDF', canvas.width / 4, 125);

      // Lettrine P
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(55, 155, 80, 80);
      ctx.strokeStyle = '#4ade80';
      ctx.lineWidth = 3;
      ctx.strokeRect(55, 155, 80, 80);

      ctx.fillStyle = '#fef3c7';
      ctx.font = 'bold 64px "Georgia", serif';
      ctx.fillText('P', 95, 218);

      ctx.fillStyle = '#451a03';
      ctx.font = '19px "Georgia", serif';
      ctx.textAlign = 'left';

      const leftLines = [
        'aginae retis mundialis',
        'non amplius sunt solum',
        'textus in fenestra clausus,',
        'sed corpora viva in conclavi.',
        'PDF documenta fiunt libri,',
        'musica fit discus gyronis,',
        'picturae fiunt tabulae musei,',
        'scientia fit instrumentum.',
        '',
        'Cum quisque trahit nexum',
        'in hoc spatium tridimensionalem,',
        'materia statim respondet',
        'et formam accipit aptam.'
      ];

      let ly = 180;
      for (let i = 0; i < leftLines.length; i++) {
        if (i < 2) ctx.fillText(leftLines[i], 145, ly);
        else ctx.fillText(leftLines[i], 58, ly);
        ly += 30;
      }

      // Page de droite
      ctx.textAlign = 'center';
      ctx.fillStyle = '#78350f';
      ctx.font = 'bold 32px "Georgia", serif';
      ctx.fillText('BIBLIOTHECA DIGITALIS', (canvas.width * 3) / 4, 90);

      ctx.font = 'italic 20px "Georgia", serif';
      ctx.fillStyle = '#92400e';
      ctx.fillText('Index Rerum Spatialis', (canvas.width * 3) / 4, 125);

      ctx.textAlign = 'left';
      ctx.fillStyle = '#451a03';
      ctx.font = '19px "Georgia", serif';
      const rightLines = [
        'Artefacta Spatiales :',
        '• Liber (PDF Reader & Whitepapers)',
        '• Dossier (CAD Blueprints & Plans)',
        '• Terminal (GitHub & Three.js Doc)',
        '• Canvas (Louvre & Art Galleries)',
        '• Turntable (Audiophile Vinyl Radio)',
        '• Globe (World Atlas & Geography)',
        '',
        '« Mundus totus in manu tua est »'
      ];
      let ry = 190;
      for (const rline of rightLines) {
        ctx.fillText(rline, canvas.width / 2 + 60, ry);
        ry += 38;
      }

      ctx.textAlign = 'center';
      ctx.font = 'italic 18px "Georgia", serif';
      ctx.fillStyle = '#92400e';
      ctx.fillText('— XVI —', canvas.width / 4, canvas.height - 45);
      ctx.fillText('— XVII —', (canvas.width * 3) / 4, canvas.height - 45);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * Crée une texture de plan technique Cyanotype CAD pour le SpatialBlueprintModel
 */
export function getBlueprintCanvasTexture(title?: string): THREE.CanvasTexture {
  const cacheKey = `blueprint_cad_${title || 'default'}`;
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey)!;

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Fond bleu profond d'épreuve cyanotype
    ctx.fillStyle = '#0369a1';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grille millimétrique
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Grille majeure
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.lineWidth = 1.5;
    for (let x = 0; x < canvas.width; x += 128) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 128) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Plan d'architecture & pièces cotées
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    // Murs extérieurs
    ctx.strokeRect(100, 100, 824, 660);

    // Murs intérieurs / cloisons
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    // Cloison A
    ctx.moveTo(100, 420);
    ctx.lineTo(540, 420);
    // Cloison B
    ctx.moveTo(540, 100);
    ctx.lineTo(540, 560);
    // Cloison C
    ctx.moveTo(540, 560);
    ctx.lineTo(924, 560);
    ctx.stroke();

    // Arcs d'ouverture de portes (symboles CAO)
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(540, 420, 64, 0, Math.PI / 2);
    ctx.stroke();

    // Côtes dimensionnelles
    ctx.strokeStyle = '#facc15';
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 20px monospace';
    // Côte 12.50m
    ctx.beginPath();
    ctx.moveTo(100, 70);
    ctx.lineTo(924, 70);
    ctx.stroke();
    ctx.fillText('◄─────── 12.50 m (SPATIAL WORKSPACE) ───────►', 260, 62);

    // Côte 8.20m latérale
    ctx.save();
    ctx.translate(60, 440);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('◄──── 8.20 m (LABORATORY) ────►', -150, 0);
    ctx.restore();

    // Noms des espaces
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText('ESPACE RECHERCHE & CAUSALITÉ', 140, 260);
    ctx.font = '18px monospace';
    ctx.fillStyle = '#bae6fd';
    ctx.fillText('SURFACE: 44.5 m² | CHARGE: 500 kg/m²', 140, 295);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText('PORTAL HUB WEB 3D', 580, 260);
    ctx.font = '18px monospace';
    ctx.fillStyle = '#bae6fd';
    ctx.fillText('DOCS / PDF / THREE.JS STACK', 580, 295);

    // Cartouche technique de dessin officiel en bas
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.strokeRect(100, 800, 824, 160);

    ctx.fillStyle = '#0284c7';
    ctx.fillRect(102, 802, 820, 156);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText(title || 'WORLDPILOT ARCHITECTURAL SPECIFICATION', 130, 845);

    ctx.font = '18px monospace';
    ctx.fillStyle = '#e0f2fe';
    ctx.fillText('ECHELLE : 1:50  |  SYSTEM : CAUSAL IR v2.5  |  DATE : 2026-09-30', 130, 885);
    ctx.fillText('DOCUMENT TYPE : SCHEMA TECHNIQUE DIRECT & VISUALISATION PDF', 130, 920);

    // Sceau d'approbation circulaire
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(840, 880, 52, 0, Math.PI * 2);
    ctx.stroke();

    ctx.save();
    ctx.translate(840, 880);
    ctx.rotate(-0.25);
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CERTIFIED', 0, -6);
    ctx.fillText('SPATIAL 3D', 0, 16);
    ctx.restore();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * Crée une texture de peinture à l'huile impressionniste pour le SpatialArtCanvas
 */
export function getArtPaintingCanvasTexture(title?: string): THREE.CanvasTexture {
  const cacheKey = `art_painting_${title || 'default'}`;
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey)!;

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Fond dégradé ciel crépusculaire alpin
    const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
    sky.addColorStop(0, '#1e1b4b'); // Nuit indigo
    sky.addColorStop(0.35, '#4c1d95'); // Violet mystique
    sky.addColorStop(0.65, '#ea580c'); // Orange solaire
    sky.addColorStop(0.85, '#facc15'); // Jaune d'or flamboyant
    sky.addColorStop(1, '#0f172a'); // Lac sombre
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Soleild'or rasant
    const sunGrad = ctx.createRadialGradient(512, 640, 20, 512, 640, 180);
    sunGrad.addColorStop(0, '#fffbeb');
    sunGrad.addColorStop(0.4, '#fde047');
    sunGrad.addColorStop(1, 'rgba(234, 88, 12, 0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(512, 640, 180, 0, Math.PI * 2);
    ctx.fill();

    // Silhouettes de crêtes montagneuses alpines (touches d'huile)
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(0, 680);
    ctx.lineTo(160, 480);
    ctx.lineTo(340, 560);
    ctx.lineTo(512, 390); // Pic majestueux
    ctx.lineTo(680, 520);
    ctx.lineTo(860, 440);
    ctx.lineTo(1024, 620);
    ctx.lineTo(1024, 760);
    ctx.lineTo(0, 760);
    ctx.closePath();
    ctx.fill();

    // Neige éternelle rose/dorée sur les sommets
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.moveTo(512, 390);
    ctx.lineTo(470, 460);
    ctx.lineTo(512, 450);
    ctx.lineTo(550, 470);
    ctx.closePath();
    ctx.fill();

    // Reflets dans le lac alpin au premier plan
    ctx.fillStyle = 'rgba(250, 204, 21, 0.45)';
    for (let ly = 780; ly < 980; ly += 16) {
      const width = 200 + Math.sin(ly * 0.1) * 80;
      ctx.fillRect(512 - width / 2, ly, width, 6);
    }

    // Touches de pinceau impressionnistes (impasto texture)
    for (let i = 0; i < 600; i++) {
      const px = Math.random() * canvas.width;
      const py = Math.random() * canvas.height;
      const len = 10 + Math.random() * 25;
      const angle = (Math.random() - 0.5) * 0.5;

      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(angle);
      ctx.fillStyle = `rgba(255, 255, 255, ${0.03 + Math.random() * 0.05})`;
      ctx.fillRect(0, 0, len, 3);
      ctx.restore();
    }

    // Signature d'artiste discrète en bas à droite
    ctx.font = 'italic bold 22px "Brush Script MT", cursive, sans-serif';
    ctx.fillStyle = '#fde68a';
    ctx.textAlign = 'right';
    ctx.fillText('WorldPilot · 2026', canvas.width - 50, canvas.height - 40);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * Crée une texture de micrographie cellulaire haute résolution pour le SpatialMicroscope
 */
export function getMicroscopeCanvasTexture(): THREE.CanvasTexture {
  const cacheKey = 'microscope_specimen_slide';
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey)!;

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Fond noir profond de microscopie à fluorescence
    ctx.fillStyle = '#030712';
    ctx.fillRect(0, 0, 1024, 1024);

    // Champ de vision circulaire de l'oculaire optique
    const cx = 512;
    const cy = 512;
    const radius = 460;

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.clip();

    // Fond interne bioluminescent bleu-nuit
    const bgGrad = ctx.createRadialGradient(cx, cy, 50, cx, cy, radius);
    bgGrad.addColorStop(0, '#061325');
    bgGrad.addColorStop(0.7, '#020b18');
    bgGrad.addColorStop(1, '#00040a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1024, 1024);

    // Réseau de cellules végétales hexagonales / polygonales
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 3;

    const cellCols = 8;
    const cellRows = 8;
    const cellW = 110;
    const cellH = 110;

    for (let row = 0; row < cellRows; row++) {
      for (let col = 0; col < cellCols; col++) {
        const cellX = 80 + col * cellW + ((row % 2) * cellW * 0.5);
        const cellY = 80 + row * cellH;

        // Paroi cellulaire
        ctx.beginPath();
        for (let a = 0; a < 6; a++) {
          const angle = (a * Math.PI) / 3;
          const px = cellX + Math.cos(angle) * (cellW * 0.45);
          const py = cellY + Math.sin(angle) * (cellH * 0.45);
          if (a === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fillStyle = 'rgba(16, 185, 129, 0.08)';
        ctx.fill();
        ctx.stroke();

        // Noyau cellulaire fluorescent (DAPI cyan / GFP vert)
        const nucleusX = cellX + (Math.sin(col + row) * 12);
        const nucleusY = cellY + (Math.cos(col * row) * 10);
        const nGrad = ctx.createRadialGradient(nucleusX, nucleusY, 2, nucleusX, nucleusY, 18);
        nGrad.addColorStop(0, '#38bdf8');
        nGrad.addColorStop(0.4, 'rgba(56, 189, 248, 0.8)');
        nGrad.addColorStop(1, 'rgba(14, 165, 233, 0)');
        ctx.fillStyle = nGrad;
        ctx.beginPath();
        ctx.arc(nucleusX, nucleusY, 18, 0, Math.PI * 2);
        ctx.fill();

        // Chloroplastes périphériques fluorescents
        for (let cp = 0; cp < 4; cp++) {
          const cpAngle = cp * (Math.PI / 2) + col;
          const cpx = cellX + Math.cos(cpAngle) * 32;
          const cpy = cellY + Math.sin(cpAngle) * 32;
          ctx.fillStyle = 'rgba(52, 211, 153, 0.75)';
          ctx.beginPath();
          ctx.arc(cpx, cpy, 5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Réticule micrométrique central
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - 60, cy);
    ctx.lineTo(cx + 60, cy);
    ctx.moveTo(cx, cy - 60);
    ctx.lineTo(cx, cy + 60);
    ctx.stroke();

    // Graduations du réticule
    for (let g = -50; g <= 50; g += 10) {
      if (g === 0) continue;
      ctx.beginPath();
      ctx.moveTo(cx + g, cy - (g % 20 === 0 ? 8 : 4));
      ctx.lineTo(cx + g, cy + (g % 20 === 0 ? 8 : 4));
      ctx.stroke();
    }

    // Échelle microscopique en bas à droite
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(720, 880, 160, 4);
    ctx.font = 'bold 20px monospace';
    ctx.fillText('25 µm', 775, 870);

    // Métadonnées d'acquisition scientifique
    ctx.fillStyle = '#94a3b8';
    ctx.font = '18px monospace';
    ctx.fillText('OBJECTIF: Plan-Apochromat 40x / 1.30 Oil DIC', 120, 870);
    ctx.fillText('CANAL: DAPI (358nm) / GFP (488nm) Confocal', 120, 895);
    ctx.fillText('REF: NCBI BioSample · Arabidopsis Thaliana', 120, 920);

    ctx.restore();

    // Diaphragme noir externe
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 20;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(cacheKey, texture);
  return texture;
}

