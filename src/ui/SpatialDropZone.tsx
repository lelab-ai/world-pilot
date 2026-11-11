import React, { useState, useCallback } from 'react';
import { useWorldStore } from '../engine/store';
import { playAudioFx } from '../engine/evaluator';

export const SpatialDropZone: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragFeedback, setDragFeedback] = useState<string | null>(null);

  const applyPatch = useWorldStore(state => state.applyPatch);
  const openWebModal = useWorldStore(state => state.openWebModal);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragOver) {
      setIsDragOver(true);
      const hasFiles = e.dataTransfer.types.includes('Files');
      setDragFeedback(hasFiles ? '📄 Fichier détecté (PDF / Document)' : '🌐 Lien Web détecté');
    }
  }, [isDragOver]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Verify if left the actual container
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragOver(false);
    setDragFeedback(null);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setDragFeedback(null);

    let targetUrl = '';
    let targetTitle = '';
    let targetType: 'book' | 'blueprint' | 'laptop' | 'art' | 'audio' | 'globe' | 'microscope' | 'web' = 'web';

    // 1. Check if local files were dropped
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const lowerName = file.name.toLowerCase();
      targetUrl = URL.createObjectURL(file);
      targetTitle = file.name;

      if (lowerName.endsWith('.glb') || lowerName.endsWith('.gltf')) {
        const idSuffix = Math.random().toString(36).substring(2, 6);
        const cleanName = file.name.replace(/\.(glb|gltf)$/i, '').replace(/[-_]/g, ' ');
        const entityId = `custom_model_${idSuffix}`;
        const newEntity = {
          id: entityId,
          name: cleanName.charAt(0).toUpperCase() + cleanName.slice(1),
          capabilities: [
            { type: 'transform', position: { x: 0, y: 0.85, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
            { type: 'collider' },
            { type: 'draggable' }
          ],
          visuals: {
            modelUrl: targetUrl,
            shape: 'box',
            color: '#38bdf8'
          },
          fallback2D: {
            description: `Modèle 3D local importé : ${file.name}`,
            specificationSheetUrl: targetUrl
          }
        };
        applyPatch({ entitiesCreated: [newEntity as any] }, `Importer le modèle 3D ${file.name}`, { intent: 'import_custom_3d_model' });
        playAudioFx('fanfare');
        useWorldStore.getState().setSpatialContext(entityId, null);
        return;
      }

      if (file.name.toLowerCase().endsWith('.pdf')) {
        targetType = file.name.toLowerCase().includes('plan') || file.name.toLowerCase().includes('cad')
          ? 'blueprint'
          : 'book';
      } else if (file.type.startsWith('image/')) {
        targetType = 'art';
      } else if (file.type.startsWith('audio/')) {
        targetType = 'audio';
      } else {
        targetType = 'book';
      }
    } else {
      // 2. Check if text or URL was dropped
      const uri = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain') || '';
      let trimmed = uri.trim();
      if (!trimmed) return;
      if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
        if (trimmed.includes('.') && !trimmed.includes(' ') && trimmed.length > 3) {
          trimmed = 'https://' + trimmed;
        } else {
          return;
        }
      }

      targetUrl = trimmed;
      const lower = targetUrl.toLowerCase();

      // Extract domain/path for title
      try {
        const parsed = new URL(targetUrl);
        targetTitle = parsed.hostname.replace('www.', '') + (parsed.pathname.length > 1 ? parsed.pathname.slice(0, 16) : '');
      } catch {
        targetTitle = 'Ressource Web';
      }

      // Classify resource type
      if (lower.endsWith('.pdf') || lower.includes('/pdf/') || lower.includes('.pdf?')) {
        targetType = lower.includes('cad') || lower.includes('plan') || lower.includes('schema') ? 'blueprint' : 'book';
      } else if (lower.includes('github') || lower.includes('threejs') || lower.includes('npm') || lower.includes('stackoverflow') || lower.includes('developer') || lower.includes('doc')) {
        targetType = 'laptop';
      } else if (lower.includes('spotify') || lower.includes('soundcloud') || lower.includes('bandcamp') || lower.includes('radio') || lower.includes('music')) {
        targetType = 'audio';
      } else if (lower.includes('art') || lower.includes('louvre') || lower.includes('museum') || lower.includes('gallery') || lower.includes('painting') || lower.endsWith('.jpg') || lower.endsWith('.png') || lower.endsWith('.webp')) {
        targetType = 'art';
      } else if (lower.includes('earth') || lower.includes('map') || lower.includes('world') || lower.includes('globe') || lower.includes('geography') || lower.includes('openstreetmap')) {
        targetType = 'globe';
      } else if (lower.includes('ncbi') || lower.includes('pubmed') || lower.includes('biology') || lower.includes('microbiolog') || lower.includes('science') || lower.includes('nature.com') || lower.includes('cell')) {
        targetType = 'microscope';
      } else {
        targetType = 'web';
      }
    }

    // Materialize in 3D in front of camera
    const timestamp = Date.now();
    const entityId = `${targetType}_drop_${timestamp}`;

    // Compute spawn position
    const spawnX = (Math.random() - 0.5) * 0.4;
    const spawnZ = 0.2 + (Math.random() - 0.5) * 0.2;
    const spawnY = targetType === 'art' ? 1.6 : targetType === 'web' ? 1.8 : 0.94;

    const typeConfig: Record<string, { name: string; assetId: string; sound: any }> = {
      book: { name: `📖 ${targetTitle}`, assetId: 'book', sound: 'paper_turn' },
      blueprint: { name: `📐 ${targetTitle}`, assetId: 'porte-documents', sound: 'paper_turn' },
      laptop: { name: `💻 ${targetTitle}`, assetId: 'ordinateur', sound: 'switch_click' },
      art: { name: `🎨 ${targetTitle}`, assetId: 'wp-toile-encadree', sound: 'chime' },
      audio: { name: `📻 ${targetTitle}`, assetId: 'turntable', sound: 'fanfare' },
      globe: { name: `🌍 ${targetTitle}`, assetId: 'globe', sound: 'chime' },
      microscope: { name: `🔬 ${targetTitle}`, assetId: 'microscope', sound: 'switch_click' },
      web: { name: `🌐 ${targetTitle}`, assetId: 'web-screen', sound: 'snap_connect' }
    };

    const cfg = typeConfig[targetType] || typeConfig.web;

    const newEntity: any = {
      id: entityId,
      name: cfg.name,
      capabilities: [
        {
          type: 'transform',
          position: { x: spawnX, y: spawnY, z: spawnZ },
          rotation: { x: 0, y: (Math.random() - 0.5) * 0.2, z: 0 },
          scale: { x: 1, y: 1, z: 1 }
        },
        ...(targetType !== 'art' && targetType !== 'web' ? [{ type: 'draggable' }] : []),
        { type: 'collider' },
        { type: 'web_screen', url: targetUrl }
      ],
      visuals: { assetId: cfg.assetId }
    };

    applyPatch({ entitiesCreated: [newEntity] }, `Matérialiser ${cfg.name} depuis glisser-déposer`, { intent: 'drop_to_3d' });
    useWorldStore.getState().setSpatialContext(entityId, null);
    useWorldStore.getState().setCameraFocusTarget([spawnX, spawnY, spawnZ]);

    playAudioFx(cfg.sound, { x: spawnX, y: spawnY, z: spawnZ });

    useWorldStore.setState(s => ({
      warnings: [...s.warnings, `✨ Ressource matérialisée en 3D : ${cfg.name} !`]
    }));

    // Auto open modal
    setTimeout(() => {
      openWebModal(targetUrl, cfg.name);
    }, 400);
  }, [applyPatch, openWebModal]);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{ position: 'relative', width: '100%', height: '100%' }}
    >
      {children}

      {/* Diegetic Drop Visualizer Overlay */}
      {isDragOver && (
        <div
          style={{
            position: 'absolute',
            inset: 12,
            border: '2.5px dashed #38bdf8',
            borderRadius: '16px',
            background: 'radial-gradient(circle at center, rgba(14, 165, 233, 0.18) 0%, rgba(15, 23, 42, 0.75) 100%)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '14px',
            zIndex: 1000,
            pointerEvents: 'none',
            boxShadow: '0 0 40px rgba(56, 189, 248, 0.35) inset, 0 16px 48px rgba(0, 0, 0, 0.7)'
          }}
        >
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              boxShadow: '0 0 24px #38bdf8',
              animation: 'bounce 1s infinite alternate ease-in-out'
            }}
          >
            📥
          </div>

          <div style={{ textAlign: 'center' }}>
            <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '18px', fontWeight: 700, letterSpacing: '-0.01em' }}>
              Matérialisation Spatiale Immédiate
            </h3>
            <p style={{ margin: '6px 0 0 0', color: '#93c5fd', fontSize: '13px', fontWeight: 500 }}>
              {dragFeedback || 'Relâchez le lien ou le fichier pour l’incarner en objet 3D interactif'}
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '12px',
              marginTop: '4px',
              fontSize: '11px',
              color: '#cbd5e1'
            }}
          >
            <span style={{ padding: '3px 8px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.1)' }}>📖 PDF → Livre</span>
            <span style={{ padding: '3px 8px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.1)' }}>💻 GitHub / Docs → Laptop</span>
            <span style={{ padding: '3px 8px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.1)' }}>🎨 Image → Toile</span>
            <span style={{ padding: '3px 8px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.1)' }}>📻 Audio → Vinyle</span>
          </div>
        </div>
      )}
    </div>
  );
};
