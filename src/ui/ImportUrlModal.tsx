import React, { useState, useEffect } from 'react';
import { useWorldStore } from '../engine/store';
import { playAudioFx } from '../engine/evaluator';
import { useDraggableModal } from './useDraggableModal';

interface ImportUrlModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_URLS = [
  {
    type: 'glb',
    title: 'Modèle 3D Direct (GLB)',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF-Binary/Duck.glb',
    name: 'Canard en Plastique Jaune',
    icon: '🦆',
    desc: 'Asset glTF binaire standard avec maillages et textures PBR.'
  },
  {
    type: 'wot',
    title: 'Manifeste Sémantique WoT',
    url: 'https://mindel.web3d/manifests/bag-42.jsonld',
    name: 'Sac Nomade Cabine W3C WoT',
    icon: '📄',
    desc: 'Contrat d’objet avec cotes physiques, compartiments et actions.'
  },
  {
    type: 'web',
    title: 'Fiche Produit Web Distante',
    url: 'https://store.leica-camera.com/fr/fr/m11-monochrom',
    name: 'Boîtier Leica M11 Web',
    icon: '📷',
    desc: 'Liaison directe avec ressources e-commerce et notice en ligne.'
  }
];

export const ImportUrlModal: React.FC<ImportUrlModalProps> = ({ isOpen, onClose }) => {
  const importEntityFromUrl = useWorldStore(s => s.importEntityFromUrl);
  const [url, setUrl] = useState('');
  const [customName, setCustomName] = useState('');
  const { offset, dragProps } = useDraggableModal();
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsLoading(true);
    setStatusMsg(null);

    try {
      const res = await importEntityFromUrl(url.trim(), customName.trim() || undefined);
      if (res.success) {
        setStatusMsg({ text: `✓ ${res.message}` });
        playAudioFx('fanfare');
        setTimeout(() => {
          onClose();
          setUrl('');
          setCustomName('');
          setStatusMsg(null);
        }, 1200);
      } else {
        setStatusMsg({ text: res.message, isError: true });
        playAudioFx('bell');
      }
    } catch (err: any) {
      setStatusMsg({ text: `Erreur d'import : ${err.message || 'Échec réseau'}`, isError: true });
      playAudioFx('bell');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPreset = (preset: typeof PRESET_URLS[0]) => {
    setUrl(preset.url);
    setCustomName(preset.name);
    playAudioFx('switch_click');
  };

  const handleLocalFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const blobUrl = URL.createObjectURL(file);
    const cleanName = customName.trim() || file.name.replace(/\.(glb|gltf)$/i, '').replace(/[-_]/g, ' ');
    const idSuffix = Math.random().toString(36).substring(2, 6);
    const entityId = `ext_${cleanName.toLowerCase().replace(/[^a-z0-9_]/g, '_')}_${idSuffix}`;
    const newEntity = {
      id: entityId,
      name: cleanName.charAt(0).toUpperCase() + cleanName.slice(1),
      capabilities: [
        { type: 'transform', position: { x: 0, y: 0.85, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
        { type: 'collider' },
        { type: 'draggable' }
      ],
      visuals: {
        modelUrl: blobUrl,
        shape: 'box',
        color: '#38bdf8'
      },
      fallback2D: {
        description: `Modèle 3D local importé : ${file.name}`,
        specificationSheetUrl: blobUrl
      }
    };
    useWorldStore.getState().applyPatch({ entitiesCreated: [newEntity as any] }, `Importer le modèle 3D ${file.name}`, { intent: 'import_custom_3d_model' });
    playAudioFx('fanfare');
    useWorldStore.getState().setSpatialContext(entityId, null);
    setStatusMsg({ text: `✓ Modèle 3D ${file.name} importé avec succès !` });
    setTimeout(() => {
      onClose();
      setStatusMsg(null);
    }, 1000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-url-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 5000,
        background: 'rgba(15, 23, 42, 0.82)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.96)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '560px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.65)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          transform: `translate(${offset.x}px, ${offset.y}px)`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER avec poignée de déplacement */}
        <div
          {...dragProps}
          style={{
            ...dragProps.style,
            padding: '20px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.03)',
            userSelect: 'none',
          }}
          title="Cliquer-glisser pour déplacer la boîte de dialogue"
        >
          <div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.6px',
                textTransform: 'uppercase',
                color: '#38bdf8',
                background: 'rgba(56, 189, 248, 0.15)',
                padding: '2px 8px',
                borderRadius: '6px'
              }}
            >
              Mindel §17 — Interopérabilité Web 3D
            </span>
            <h2 id="import-url-title" style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', marginTop: '6px', margin: 0 }}>
              🌐 Importer un Objet 3D (Fichier local ou URL)
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              fontSize: '18px',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px'
            }}
            title="Fermer"
          >
            ✕
          </button>
        </div>

        {/* BODY */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.5', margin: 0 }}>
            Importez directement un <strong>fichier 3D .glb/.gltf depuis votre ordinateur</strong> ou via une <strong>URL Web / manifeste WoT</strong>. L'objet sera immédiatement instancié dans la scène 3D avec sa fiche 2D et ses propriétés manipulables.
          </p>

          {/* LOCAL FILE UPLOAD */}
          <div>
            <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
              📁 Importer depuis votre ordinateur :
            </label>
            <div
              style={{
                padding: '18px 20px',
                borderRadius: '12px',
                border: '1.5px dashed rgba(56, 189, 248, 0.45)',
                background: 'rgba(56, 189, 248, 0.06)',
                textAlign: 'center',
                transition: 'all 0.2s ease',
              }}
            >
              <input
                type="file"
                accept=".glb,.gltf"
                style={{ display: 'none' }}
                id="modal-glb-file-picker"
                onChange={handleLocalFile}
              />
              <label htmlFor="modal-glb-file-picker" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '28px' }}>📦</span>
                <span style={{ fontSize: '13.5px', fontWeight: 650, color: '#38bdf8' }}>
                  Choisir un fichier 3D local (.glb, .gltf)
                </span>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                  Glissez-déposez votre modèle 3D ici ou cliquez pour parcourir vos dossiers
                </span>
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '-4px 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
            <span style={{ fontSize: '10.5px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              ou importer via une URL
            </span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
          </div>

          {/* PRESETS */}
          <div>
            <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
              Exemples prêts à l'emploi :
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {PRESET_URLS.map(preset => (
                <button
                  key={preset.type}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  style={{
                    background: url === preset.url ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${url === preset.url ? '#38bdf8' : 'rgba(255, 255, 255, 0.1)'}`,
                    borderRadius: '10px',
                    padding: '10px 8px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <span style={{ fontSize: '18px' }}>{preset.icon}</span>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#ffffff' }}>
                    {preset.title}
                  </span>
                  <span style={{ fontSize: '9.5px', color: '#94a3b8', lineHeight: '1.2' }}>
                    {preset.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* FORM */}
          <form onSubmit={handleImport} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#e2e8f0', display: 'block', marginBottom: '6px' }}>
                Adresse URL de l'objet (GLB, JSON-LD, Web) :
              </label>
              <input
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://.../modele.glb ou https://.../manifest.jsonld"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '9px',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  background: 'rgba(0, 0, 0, 0.4)',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontFamily: 'monospace',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#e2e8f0', display: 'block', marginBottom: '6px' }}>
                Nom ou libellé de l'objet (optionnel) :
              </label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Ex : Appareil photo télémétrique"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '9px',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  background: 'rgba(0, 0, 0, 0.4)',
                  color: '#ffffff',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
            </div>

            {statusMsg && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 600,
                  background: statusMsg.isError ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                  border: `1px solid ${statusMsg.isError ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
                  color: statusMsg.isError ? '#f87171' : '#34d399'
                }}
              >
                {statusMsg.text}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '9px 16px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: '#cbd5e1',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isLoading || !url.trim()}
                style={{
                  padding: '9px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #0284c7, #2563eb)',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: isLoading || !url.trim() ? 'not-allowed' : 'pointer',
                  opacity: isLoading || !url.trim() ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span>{isLoading ? '⏳' : '📥'}</span>
                <span>{isLoading ? 'Importation...' : 'Importer dans la scène 3D'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
