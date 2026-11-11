import React, { useState } from 'react';
import { useWorldStore } from '../engine/store';
import { playAudioFx } from '../engine/evaluator';

export const SpatialWebDock: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [showOmnibar, setShowOmnibar] = useState(false);
  const [inputUrl, setInputUrl] = useState('');

  const entities = useWorldStore(state => state.world.ir.entities);
  const applyPatch = useWorldStore(state => state.applyPatch);
  const setCameraFocusTarget = useWorldStore(state => state.setCameraFocusTarget);
  const setSpatialContext = useWorldStore(state => state.setSpatialContext);
  const openWebModal = useWorldStore(state => state.openWebModal);

  // Helper to find existing entity of specific type
  const findExisting = (type: string) => {
    return Object.values(entities).find(e => {
      const id = e.id.toLowerCase();
      const asset = (e.visuals?.assetId || '').toLowerCase();
      const name = (e.name || '').toLowerCase();
      if (type === 'book') return asset.includes('book') || id.includes('book') || name.includes('livre');
      if (type === 'blueprint') return asset.includes('porte-documents') || id.includes('blueprint') || name.includes('plan');
      if (type === 'laptop') return asset.includes('ordinateur') || id.includes('laptop') || name.includes('terminal');
      if (type === 'art') return asset.includes('toile') || id.includes('art') || name.includes('peinture') || name.includes('musée');
      if (type === 'audio') return asset.includes('turntable') || id.includes('turntable') || name.includes('vinyle') || name.includes('radio');
      if (type === 'globe') return asset.includes('globe') || id.includes('globe');
      if (type === 'microscope') return asset.includes('microscope') || id.includes('microscope') || name.includes('microscope');
      return false;
    });
  };

  const handleAction = (type: string) => {
    const existing = findExisting(type);
    if (existing) {
      // Focus existing entity
      const rawPos: any = existing.capabilities.find(c => c.type === 'transform')?.position;
      const pos = rawPos
        ? (Array.isArray(rawPos) && rawPos.length >= 3
            ? { x: Number(rawPos[0]) || 0, y: Number(rawPos[1]) || 0, z: Number(rawPos[2]) || 0 }
            : { x: Number(rawPos.x) || 0, y: Number(rawPos.y) || 0, z: Number(rawPos.z) || 0 })
        : undefined;
      if (pos) {
        setCameraFocusTarget([pos.x, pos.y, pos.z]);
      }
      setSpatialContext(existing.id, null);
      playAudioFx('chime', pos);
      useWorldStore.setState(s => ({
        warnings: [...s.warnings, `🎯 Cadrage sur ${existing.name}`]
      }));
      return;
    }

    // Spawn new entity
    const timestamp = Date.now();
    let newEntity: any = null;

    if (type === 'book') {
      newEntity = {
        id: `book_${timestamp}`,
        name: 'Livre Spatial & Document Interactif (PDF)',
        capabilities: [
          { type: 'transform', position: { x: -0.35, y: 0.94, z: 0.2 }, rotation: { x: 0, y: 0.15, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          { type: 'draggable' },
          { type: 'collider' },
          { type: 'web_screen', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' }
        ],
        visuals: { assetId: 'book' }
      };
      playAudioFx('paper_turn');
    } else if (type === 'blueprint') {
      newEntity = {
        id: `blueprint_${timestamp}`,
        name: 'Dossier Plans CAO & Schémas Techniques (PDF)',
        capabilities: [
          { type: 'transform', position: { x: 0.35, y: 0.94, z: 0.2 }, rotation: { x: 0, y: -0.15, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          { type: 'draggable' },
          { type: 'collider' },
          { type: 'web_screen', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' }
        ],
        visuals: { assetId: 'porte-documents' }
      };
      playAudioFx('paper_turn');
    } else if (type === 'laptop') {
      newEntity = {
        id: `laptop_${timestamp}`,
        name: 'Station Développeur · Three.js Doc',
        capabilities: [
          { type: 'transform', position: { x: 0, y: 0.94, z: -0.15 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          { type: 'draggable' },
          { type: 'collider' },
          { type: 'web_screen', url: 'https://threejs.org/docs/' }
        ],
        visuals: { assetId: 'ordinateur' }
      };
      playAudioFx('switch_click');
    } else if (type === 'art') {
      newEntity = {
        id: `artwork_${timestamp}`,
        name: 'Galerie d’Art & Musée du Louvre',
        capabilities: [
          { type: 'transform', position: { x: 0, y: 1.8, z: -1.8 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          { type: 'collider' },
          { type: 'web_screen', url: 'https://fr.m.wikipedia.org/wiki/Mus%C3%A9e_du_Louvre' }
        ],
        visuals: { assetId: 'wp-toile-encadree' }
      };
      playAudioFx('chime');
    } else if (type === 'audio') {
      newEntity = {
        id: `turntable_${timestamp}`,
        name: 'Platine Vinyle Hi-Fi Audiophile',
        capabilities: [
          { type: 'transform', position: { x: 0.55, y: 0.94, z: -0.15 }, rotation: { x: 0, y: -0.25, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          { type: 'draggable' },
          { type: 'collider' },
          { type: 'web_screen', url: 'https://fr.wikipedia.org/wiki/Disque_microsillon' }
        ],
        visuals: { assetId: 'turntable' }
      };
      playAudioFx('fanfare');
    } else if (type === 'globe') {
      newEntity = {
        id: `globe_${timestamp}`,
        name: 'Globe Terrestre & Atlas Mondial',
        capabilities: [
          { type: 'transform', position: { x: -0.55, y: 0.94, z: -0.15 }, rotation: { x: 0, y: 0.35, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          { type: 'draggable' },
          { type: 'collider' },
          { type: 'web_screen', url: 'https://fr.wikipedia.org/wiki/Terre' }
        ],
        visuals: { assetId: 'globe' }
      };
      playAudioFx('chime');
    } else if (type === 'microscope') {
      newEntity = {
        id: `microscope_${timestamp}`,
        name: 'Station Scientifique & Microscope Optique',
        capabilities: [
          { type: 'transform', position: { x: 0, y: 0.94, z: 0.22 }, rotation: { x: 0, y: 0.2, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          { type: 'draggable' },
          { type: 'collider' },
          { type: 'web_screen', url: 'https://fr.m.wikipedia.org/wiki/Microbiologie' }
        ],
        visuals: { assetId: 'microscope' }
      };
      playAudioFx('switch_click');
    }

    if (newEntity) {
      applyPatch({ entitiesCreated: [newEntity] }, `Ajouter ${newEntity.name}`, { intent: 'dock_spawn' });
      setSpatialContext(newEntity.id, null);
      const pos = newEntity.capabilities.find((c: any) => c.type === 'transform')?.position;
      if (pos) setCameraFocusTarget([pos.x, pos.y, pos.z]);
      useWorldStore.setState(s => ({
        warnings: [...s.warnings, `✨ Matérialisé en 3D : ${newEntity.name} !`]
      }));
    }
  };

  const handleCustomUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const url = inputUrl.trim();
    if (!url) return;

    let fullUrl = url;
    if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
      fullUrl = `https://${fullUrl}`;
    }

    const timestamp = Date.now();
    const isPdf = fullUrl.toLowerCase().endsWith('.pdf') || fullUrl.toLowerCase().includes('/pdf/');
    const isCode = fullUrl.includes('github') || fullUrl.includes('threejs') || fullUrl.includes('docs');
    const isArt = fullUrl.includes('art') || fullUrl.includes('museum') || fullUrl.includes('louvre');

    const entityType = isPdf ? 'book' : isCode ? 'laptop' : isArt ? 'art' : 'web';
    const entityId = `${entityType}_custom_${timestamp}`;

    let parsedDomain = 'Ressource Web';
    try {
      parsedDomain = new URL(fullUrl).hostname.replace('www.', '');
    } catch { /* ignore */ }

    const newEntity: any = {
      id: entityId,
      name: `🌐 ${parsedDomain}`,
      capabilities: [
        {
          type: 'transform',
          position: { x: 0, y: entityType === 'art' ? 1.8 : 0.94, z: 0.1 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 }
        },
        { type: 'draggable' },
        { type: 'collider' },
        { type: 'web_screen', url: fullUrl }
      ],
      visuals: {
        assetId: isPdf ? 'book' : isCode ? 'ordinateur' : isArt ? 'wp-toile-encadree' : 'web-screen'
      }
    };

    applyPatch({ entitiesCreated: [newEntity] }, `Matérialiser URL personnalisée : ${fullUrl}`, { intent: 'custom_url_spawn' });
    setSpatialContext(entityId, null);
    setCameraFocusTarget([0, 0.94, 0.1]);
    playAudioFx('snap_connect');
    setInputUrl('');
    setShowOmnibar(false);

    useWorldStore.setState(s => ({
      warnings: [...s.warnings, `🌐 URL matérialisée en 3D : ${parsedDomain} !`]
    }));

    setTimeout(() => {
      openWebModal(fullUrl, `🌐 ${parsedDomain}`);
    }, 350);
  };

  const dockButtons = [
    { type: 'book', icon: '📖', label: 'Livre PDF', desc: 'Lecteur d’ouvrages et rapports PDF' },
    { type: 'blueprint', icon: '📐', label: 'Plans CAO', desc: 'Dossier technique & schémas PDF' },
    { type: 'laptop', icon: '💻', label: 'Terminal Doc', desc: 'Documentation Three.js & GitHub' },
    { type: 'art', icon: '🎨', label: 'Galerie d’Art', desc: 'Toile d’exposition & Musée du Louvre' },
    { type: 'audio', icon: '📻', label: 'Vinyle Hi-Fi', desc: 'Platine vinyle & radio spatiale' },
    { type: 'globe', icon: '🌍', label: 'Globe Terrestre', desc: 'Atlas mondial & géographie interactive' },
    { type: 'microscope', icon: '🔬', label: 'Microscope', desc: 'Station scientifique & données NCBI' },
  ];

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '68px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 850,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        pointerEvents: 'auto'
      }}
    >
      {/* Omnibar Popover when 🔍 is active */}
      {showOmnibar && (
        <form
          onSubmit={handleCustomUrlSubmit}
          style={{
            background: 'rgba(15, 23, 42, 0.96)',
            border: '1.5px solid #38bdf8',
            borderRadius: '14px',
            padding: '8px 12px',
            boxShadow: '0 16px 36px rgba(0, 0, 0, 0.8), 0 0 24px rgba(56, 189, 248, 0.25)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            width: '420px',
            maxWidth: '90vw',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <span style={{ fontSize: '16px' }}>🌐</span>
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="Entrez ou collez une URL ou fichier PDF..."
            autoFocus
            style={{
              flex: 1,
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              padding: '6px 10px',
              color: '#f8fafc',
              fontSize: '12px',
              outline: 'none'
            }}
          />
          <button
            type="submit"
            style={{
              background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
              border: 'none',
              borderRadius: '8px',
              color: '#ffffff',
              padding: '6px 12px',
              fontSize: '11.5px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Matérialiser
          </button>
          <button
            type="button"
            onClick={() => setShowOmnibar(false)}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              fontSize: '16px',
              cursor: 'pointer',
              padding: '0 4px'
            }}
          >
            ×
          </button>
        </form>
      )}

      {/* Main Glassmorphic Dock */}
      {isOpen ? (
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.88)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '16px',
            padding: '5px 8px',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.6), 0 0 20px rgba(56, 189, 248, 0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <span
            style={{
              color: '#38bdf8',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              padding: '0 8px 0 4px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span>🌐</span> Web 3D
          </span>

          <div style={{ width: '1px', height: '20px', background: 'rgba(255, 255, 255, 0.15)', margin: '0 2px' }} />

          {dockButtons.map(btn => {
            const exists = !!findExisting(btn.type);
            return (
              <button
                key={btn.type}
                onClick={() => handleAction(btn.type)}
                title={`${btn.label} — ${btn.desc} ${exists ? '(Déjà présent : cliquer pour cadrer)' : '(Cliquer pour matérialiser)'}`}
                style={{
                  background: exists ? 'rgba(56, 189, 248, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                  border: exists ? '1px solid rgba(56, 189, 248, 0.45)' : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  padding: '5px 9px',
                  color: '#f8fafc',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.18s ease'
                }}
                onPointerOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px) scale(1.04)';
                  e.currentTarget.style.background = 'rgba(56, 189, 248, 0.25)';
                }}
                onPointerOut={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.background = exists ? 'rgba(56, 189, 248, 0.18)' : 'rgba(255, 255, 255, 0.04)';
                }}
              >
                <span style={{ fontSize: '15px' }}>{btn.icon}</span>
                <span style={{ fontSize: '11px', fontWeight: 600 }}>{btn.label}</span>
                {exists && <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />}
              </button>
            );
          })}

          <div style={{ width: '1px', height: '20px', background: 'rgba(255, 255, 255, 0.15)', margin: '0 2px' }} />

          {/* Omnibar Toggle Button */}
          <button
            onClick={() => setShowOmnibar(!showOmnibar)}
            title="Saisir ou coller une URL web personnalisée"
            style={{
              background: showOmnibar ? 'rgba(56, 189, 248, 0.3)' : 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              borderRadius: '10px',
              padding: '5px 9px',
              color: '#38bdf8',
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span>🔍</span>
            <span style={{ fontSize: '11px', fontWeight: 600 }}>URL / Web</span>
          </button>

          {/* Collapse Button */}
          <button
            onClick={() => setIsOpen(false)}
            title="Réduire le Dock Web 3D"
            style={{
              background: 'none',
              border: 'none',
              color: '#64748b',
              fontSize: '12px',
              cursor: 'pointer',
              padding: '2px 5px',
              marginLeft: '2px'
            }}
          >
            ▼
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          title="Ouvrir le Dock Web 3D"
          style={{
            background: 'rgba(15, 23, 42, 0.88)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '20px',
            padding: '4px 12px',
            color: '#38bdf8',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)'
          }}
        >
          <span>🌐 Dock Web 3D ▲</span>
        </button>
      )}
    </div>
  );
};
