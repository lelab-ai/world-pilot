import React from 'react';
import { Html } from '@react-three/drei';
import { EntitySpec } from '../core/types';
import { useWorldStore } from '../engine/store';
import { playAudioFx } from '../engine/evaluator';

interface SpatialWebChipProps {
  entity: EntitySpec;
  position?: [number, number, number];
}

export const SpatialWebChip: React.FC<SpatialWebChipProps> = ({
  entity,
  position = [0, 0.35, 0]
}) => {
  const openWebModal = useWorldStore(state => state.openWebModal);

  const webCap = entity.capabilities.find(c => c.type === 'web_screen');
  const eduCap = entity.capabilities.find(c => c.type === 'educational');
  const url = webCap?.url || eduCap?.url;

  if (!url) return null;

  // Extract clean domain hostname
  let domain = 'web';
  try {
    const parsed = new URL(url);
    domain = parsed.hostname.replace('www.', '').replace('fr.m.', '').replace('fr.', '');
  } catch (_) {
    domain = url.length > 20 ? url.substring(0, 18) + '...' : url;
  }

  const isPdf = url.toLowerCase().endsWith('.pdf');
  const icon = isPdf
    ? '📄'
    : entity.visuals?.assetId?.includes('book') || entity.name?.toLowerCase().includes('livre')
    ? '📖'
    : entity.visuals?.assetId?.includes('ordinateur') || entity.visuals?.assetId?.includes('laptop')
    ? '💻'
    : entity.visuals?.assetId?.includes('toile') || entity.name?.toLowerCase().includes('peinture')
    ? '🎨'
    : entity.visuals?.assetId?.includes('porte-documents') || entity.name?.toLowerCase().includes('plan')
    ? '📐'
    : entity.visuals?.assetId?.includes('turntable') || entity.name?.toLowerCase().includes('radio')
    ? '📻'
    : entity.visuals?.assetId?.includes('globe') || entity.name?.toLowerCase().includes('globe')
    ? '🌍'
    : entity.visuals?.assetId?.includes('microscope') || entity.name?.toLowerCase().includes('microscope')
    ? '🔬'
    : '🌐';

  const title = entity.name || 'Ressource Web 3D';
  const entityPos = entity.capabilities.find(c => c.type === 'transform')?.position;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    playAudioFx('chime', entityPos);
    openWebModal(url, `${icon} ${title}`);
  };

  const handleEditLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newUrl = window.prompt(`Modifier l'URL Web / PDF pour "${entity.name}" :`, url);
    if (newUrl && newUrl.trim() && newUrl.trim() !== url) {
      const cleanUrl = newUrl.trim();
      const updatedCaps = entity.capabilities.map(c => {
        if (c.type === 'web_screen') return { ...c, url: cleanUrl };
        if (c.type === 'educational' && c.url) return { ...c, url: cleanUrl };
        return c;
      });
      if (!updatedCaps.some(c => c.type === 'web_screen')) {
        updatedCaps.push({ type: 'web_screen', url: cleanUrl });
      }
      useWorldStore.getState().applyPatch({
        entitiesChanged: [{ id: entity.id, capabilities: updatedCaps }]
      }, `Modifier lien Web de ${entity.name}`, { intent: 'edit_web_chip_url' });
      playAudioFx('quantum_ping', entityPos);
    }
  };

  return (
    <Html position={position} center style={{ pointerEvents: 'auto', userSelect: 'none' }}>
      <div
        onClick={handleClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(15, 23, 42, 0.94)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(16, 185, 129, 0.55)',
          borderRadius: '24px',
          padding: '4px 12px 4px 10px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.75), 0 0 14px rgba(16, 185, 129, 0.25)',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          transition: 'transform 0.15s ease, border-color 0.15s ease'
        }}
      >
        <span style={{ fontSize: '14px' }}>{icon}</span>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', maxWidth: '170px' }}>
          <span style={{
            fontSize: '11px',
            fontWeight: 700,
            color: '#f8fafc',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '100%'
          }}>
            {title}
          </span>
          <span style={{
            fontSize: '9.5px',
            color: '#34d399',
            fontFamily: 'monospace',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '100%'
          }}>
            {domain}
          </span>
        </div>

        {/* Action icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '4px' }}>
          <span
            title="Ouvrir le portail 3D"
            style={{
              background: '#10b981',
              color: '#ffffff',
              borderRadius: '50%',
              width: '18px',
              height: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              fontWeight: 'bold'
            }}
          >
            ↗
          </span>
          <span
            onClick={handleEditLink}
            title="Modifier l'adresse URL / PDF"
            style={{
              background: 'rgba(255, 255, 255, 0.12)',
              color: '#cbd5e1',
              borderRadius: '50%',
              width: '18px',
              height: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              cursor: 'pointer'
            }}
          >
            ✏️
          </span>
        </div>
      </div>
    </Html>
  );
};
