import React, { useState, useRef, useEffect } from 'react';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { EntitySpec } from '../core/types';
import { useWorldStore } from '../engine/store';
import { playAudioFx } from '../engine/evaluator';

export const WebBillboard: React.FC<{ entity: EntitySpec }> = ({ entity }) => {
  const openWebModal = useWorldStore(state => state.openWebModal);
  const applyPatch = useWorldStore(state => state.applyPatch);
  const webCap = entity.capabilities.find(c => c.type === 'web_screen' || c.url);
  const eduCap = entity.capabilities.find(c => c.type === 'educational');
  
  const isCooking = entity.id.includes('recipe') || entity.name.toLowerCase().includes('recette');
  const rawUrl = webCap?.url || eduCap?.url;
  const isPdf = !!rawUrl && rawUrl.toLowerCase().includes('.pdf');
  const defaultUrl = isCooking 
    ? 'https://fr.m.wikipedia.org/wiki/Ratatouille' 
    : (isPdf ? 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' : 'https://fr.wikipedia.org/wiki/Portail:Sciences');
  const url = rawUrl || defaultUrl;

  const title = entity.name || 'Panneau web interactif';
  const [isHovered, setIsHovered] = useState(false);
  const recipeText = eduCap?.text || '';
  const currentPos = entity.capabilities.find(c => c.type === 'transform')?.position;
  const isWallMounted = (currentPos?.y || 0) >= 0.35;

  const spatialAgentPositionOverride = useWorldStore(s => s.spatialAgentPositionOverride);
  const isSpatialAgentActive = useWorldStore(s => s.isSpatialAgentActive);

  // Detect if an avatar is placed between the frontal camera and this screen
  const isAvatarInFront = Boolean(
    isSpatialAgentActive &&
    spatialAgentPositionOverride &&
    (currentPos?.z || 0) < (spatialAgentPositionOverride.z || 0) &&
    Math.abs((currentPos?.x || 0) - (spatialAgentPositionOverride.x || 0)) < 1.35
  );

  const [activeTab, setActiveTab] = useState<'recipe' | 'web'>(recipeText ? 'recipe' : 'web');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(recipeText);

  useEffect(() => {
    setEditedText(recipeText);
  }, [recipeText]);

  const [posOffset, setPosOffset] = useState<{ x: number; y: number; z: number }>({ x: 0, y: 0, z: 0 });
  const latestPosOffset = useRef(posOffset);
  latestPosOffset.current = posOffset;
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initPos: { x: number; y: number; z: number } } | null>(null);

  const groupRef = useRef<THREE.Group>(null);
  const [isFacingCamera, setIsFacingCamera] = useState(true);
  const [isOccluded, setIsOccluded] = useState(false);
  const forwardVec = useRef(new THREE.Vector3());
  const toCamVec = useRef(new THREE.Vector3());
  const worldPos = useRef(new THREE.Vector3());
  const worldQuat = useRef(new THREE.Quaternion());

  // Backface culling: hide HTML projection when camera orbits behind the board
  useFrame(({ camera }) => {
    if (!groupRef.current) return;
    groupRef.current.getWorldPosition(worldPos.current);
    groupRef.current.getWorldQuaternion(worldQuat.current);

    // Normal vector pointing out from front of screen
    forwardVec.current.set(0, 0, 1).applyQuaternion(worldQuat.current);
    toCamVec.current.subVectors(camera.position, worldPos.current);

    // dot > 0.05: camera is in front; <= 0.05: camera is behind or edge-on
    const facing = forwardVec.current.dot(toCamVec.current) > 0.05;
    if (facing !== isFacingCamera) {
      setIsFacingCamera(facing);
    }
  });

  const moveBillboardTo = (newX: number, newY: number, newZ: number, rotY: number, label: string) => {
    const liveEntity = useWorldStore.getState().world.ir.entities[entity.id] || entity;
    const hasTransform = liveEntity.capabilities.some(c => c.type === 'transform');
    const updatedCapabilities = hasTransform
      ? liveEntity.capabilities.map(c => {
          if (c.type === 'transform') {
            return {
              ...c,
              position: { x: newX, y: newY, z: newZ },
              rotation: { x: c.rotation?.x || 0, y: rotY, z: c.rotation?.z || 0 }
            };
          }
          return c;
        })
      : [
          ...liveEntity.capabilities,
          {
            type: 'transform' as const,
            position: { x: newX, y: newY, z: newZ },
            rotation: { x: 0, y: rotY, z: 0 },
            scale: { x: 1, y: 1, z: 1 }
          }
        ];

    applyPatch({
      entitiesChanged: [{
        id: entity.id,
        capabilities: updatedCapabilities
      }]
    }, `Déplacer ${liveEntity.name || entity.name} (${label})`, {});
    setPosOffset({ x: 0, y: 0, z: 0 });
    playAudioFx('switch_click');
    useWorldStore.setState(s => ({
      warnings: [...s.warnings, `📍 ${liveEntity.name || entity.name} repositionné : ${label}`]
    }));
  };

  const handleSaveText = () => {
    const hasEdu = entity.capabilities.some(c => c.type === 'educational');
    const updatedCaps = hasEdu 
      ? entity.capabilities.map(c => c.type === 'educational' ? { ...c, text: editedText } : c)
      : [...entity.capabilities, { type: 'educational', text: editedText, active: true }];

    applyPatch({
      entitiesChanged: [{
        id: entity.id,
        capabilities: updatedCaps
      }]
    }, `Modifier le contenu de ${entity.name}`, {});
    playAudioFx('quantum_ping');
    setIsEditing(false);
    useWorldStore.setState(s => ({
      warnings: [...s.warnings, `💾 Fiche mise à jour pour ${entity.name}`]
    }));
  };

  const handleOpen = (e?: any) => {
    if (e && e.stopPropagation) e.stopPropagation();
    openWebModal(url, title, recipeText, entity.id);
  };

  const handleHeaderPointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName.toLowerCase() === 'button' || target.closest('button') || target.tagName.toLowerCase() === 'textarea' || target.tagName.toLowerCase() === 'input') {
      e.stopPropagation();
      return;
    }
    e.stopPropagation();
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initPos: { ...posOffset }
    };
    setIsDragging(true);
    playAudioFx('switch_click');

    const onPointerMove = (ev: PointerEvent) => {
      if (!dragStartRef.current) return;
      // Drag in 3D: horizontal mouse movement shifts X, vertical shifts Z
      const dx = (ev.clientX - dragStartRef.current.startX) * 0.005;
      const dz = (ev.clientY - dragStartRef.current.startY) * 0.005;
      setPosOffset({
        x: dragStartRef.current.initPos.x + dx,
        y: dragStartRef.current.initPos.y,
        z: dragStartRef.current.initPos.z + dz
      });
    };

    const onPointerUp = () => {
      setIsDragging(false);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      if (dragStartRef.current) {
        const finalOffset = latestPosOffset.current;
        if (Math.hypot(finalOffset.x, finalOffset.z) > 0.04) {
          const currentPos = entity.capabilities.find(c => c.type === 'transform')?.position || { x: 0, y: 0, z: -1.9 };
          const newX = Number((currentPos.x + finalOffset.x).toFixed(2));
          const newZ = Number((currentPos.z + finalOffset.z).toFixed(2));
          applyPatch({
            entitiesChanged: [{
              id: entity.id,
              capabilities: entity.capabilities.map(c => c.type === 'transform' ? {
                ...c,
                position: { x: newX, y: currentPos.y, z: newZ }
              } : c)
            }]
          }, `Déplacer ${entity.name}`, {});
          setPosOffset({ x: 0, y: 0, z: 0 });
          playAudioFx('soft_drop');
        }
      }
      dragStartRef.current = null;
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  return (
    <group ref={groupRef} position={[posOffset.x, posOffset.y, posOffset.z]}>
      {/* Structural Support: Floor Stand Legs OR Wall-Mount Brackets */}
      {!isCollapsed && !isWallMounted && [-0.9, 0.9].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          {/* Base foot on floor */}
          <mesh position={[0, 0.04, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.3, 0.08, 0.6]} />
            <meshStandardMaterial color="#2d3748" metalness={0.7} roughness={0.3} />
          </mesh>
          {/* Vertical Pole */}
          <mesh position={[0, 0.75, 0]} castShadow>
            <cylinderGeometry args={[0.035, 0.035, 1.5, 16]} />
            <meshStandardMaterial color="#4a5568" metalness={0.8} roughness={0.2} />
          </mesh>
        </group>
      ))}

      {!isCollapsed && isWallMounted && [-0.75, 0.75].map((x) => (
        <group key={x} position={[x, 1.55, -0.06]}>
          {/* Sleek horizontal wall bracket arm extending backward */}
          <mesh position={[0, 0, -0.15]} castShadow>
            <boxGeometry args={[0.06, 0.12, 0.28]} />
            <meshStandardMaterial color="#334155" metalness={0.85} roughness={0.25} />
          </mesh>
          {/* Steel wall anchor plate */}
          <mesh position={[0, 0, -0.29]} receiveShadow>
            <boxGeometry args={[0.12, 0.26, 0.02]} />
            <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
      ))}

      {/* Screen Frame Housing */}
      {!isCollapsed ? (
        <>
          <mesh position={[0, 1.55, 0]} castShadow receiveShadow>
            <boxGeometry args={[2.3, 1.45, 0.1]} />
            <meshStandardMaterial color="#1a202c" metalness={0.6} roughness={0.4} />
          </mesh>

          {/* Emissive Screen Edge Border */}
          <mesh position={[0, 1.55, 0.045]}>
            <boxGeometry args={[2.22, 1.37, 0.02]} />
            <meshStandardMaterial color="#059669" emissive="#10b981" emissiveIntensity={0.3} />
          </mesh>

          {/* 3D Dark Screen Surface in WebGL (pure WebGL depth buffer, never leaks) */}
          <mesh position={[0, 1.55, 0.051]}>
            <planeGeometry args={[2.2, 1.35]} />
            <meshStandardMaterial color="#0b1120" roughness={0.7} metalness={0.2} />
          </mesh>
        </>
      ) : (
        /* Minimal Sleek Pod when collapsed */
        <mesh position={[0, 0.85, 0]} castShadow>
          <cylinderGeometry args={[0.04, 0.08, 1.6, 16]} />
          <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.2} />
        </mesh>
      )}

      {/* 3D Interactive HTML Web Screen Display */}
      {isCollapsed ? (
        /* Compact Collapsed Widget: completely frees up the view! */
        <Html
          transform
          occlude="raycast"
          onOcclude={(hidden) => setIsOccluded(hidden)}
          position={[0, 1.35, 0.06]}
          distanceFactor={2.0}
          zIndexRange={[10, 0]}
          style={{
            display: isFacingCamera ? (isOccluded ? 'none' : 'block') : 'none',
            opacity: isFacingCamera && !isOccluded ? 1 : 0,
            pointerEvents: isFacingCamera && !isOccluded ? 'auto' : 'none',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transition: 'opacity 0.2s ease',
            width: '420px',
            borderRadius: '10px',
            overflow: 'hidden',
            background: 'rgba(15, 23, 42, 0.96)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.75)',
            border: '2px solid rgba(16, 185, 129, 0.7)',
            backdropFilter: 'blur(12px)',
            userSelect: 'none',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}
        >
          <div style={{
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>📋</span>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {title}
                </div>
                <div style={{ fontSize: '9.5px', color: '#10b981' }}>
                  Panneau replié · Vue 3D dégagée
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); setIsCollapsed(false); }}
                style={{
                  background: 'linear-gradient(90deg, #10b981, #059669)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '5px 12px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)'
                }}
                title="Déplier le panneau de projection"
              >
                <span>🗖 Déplier</span>
              </button>
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); handleOpen(); }}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#94a3b8',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '6px',
                  padding: '5px 9px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
                title="Ouvrir en plein écran"
              >
                ↗
              </button>
            </div>
          </div>
        </Html>
      ) : (
        /* Full Expanded Projection Board with Drag Handle & Position Presets */
        <Html
          transform
          occlude="raycast"
          onOcclude={(hidden) => setIsOccluded(hidden)}
          position={[0, 1.55, 0.06]}
          distanceFactor={1.9}
          zIndexRange={[10, 0]}
          style={{
            display: isFacingCamera ? (isOccluded ? 'none' : 'flex') : 'none',
            opacity: isFacingCamera && !isOccluded ? (isAvatarInFront ? 0.88 : 1) : 0,
            pointerEvents: isFacingCamera && !isOccluded ? 'auto' : 'none',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            width: '760px',
            height: '470px',
            borderRadius: '8px',
            overflow: 'hidden',
            background: '#0f172a',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.85)',
            border: isAvatarInFront ? '2px solid rgba(245, 158, 11, 0.85)' : '2px solid rgba(16, 185, 129, 0.6)',
            flexDirection: 'column',
            userSelect: 'none',
            transition: 'border-color 0.25s ease, opacity 0.2s ease',
            cursor: isDragging ? 'grabbing' : 'default',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}
          onPointerOver={() => setIsHovered(true)}
          onPointerOut={() => setIsHovered(false)}
        >
          {/* Top Interactive Toolbar Header */}
          <div
            onPointerDown={handleHeaderPointerDown}
            onDoubleClick={(e) => {
              e.stopPropagation();
              setIsCollapsed(prev => !prev);
              playAudioFx('switch_click');
            }}
            style={{
              padding: '7px 12px',
              background: isDragging ? 'rgba(5, 150, 105, 0.35)' : 'rgba(15, 23, 42, 0.98)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              cursor: isDragging ? 'grabbing' : 'grab'
            }}
            title="Glissez pour déplacer · Double-cliquez pour replier / déplier"
          >
            {/* Left: View Mode Tabs & Edit Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '2px', background: 'rgba(0, 0, 0, 0.5)', padding: '2px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setActiveTab('recipe'); }}
                  style={{
                    background: activeTab === 'recipe' ? '#059669' : 'transparent',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '3px 8px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {isCooking ? '📋 Fiche recette' : (isPdf ? '📄 Document' : '📖 Fiche')}
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setActiveTab('web'); }}
                  style={{
                    background: activeTab === 'web' ? '#059669' : 'transparent',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '3px 8px',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {isPdf ? '📄 PDF' : '🌐 Web'}
                </button>
              </div>

              {activeTab === 'recipe' && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isEditing) {
                      handleSaveText();
                    } else {
                      setIsEditing(true);
                    }
                  }}
                  style={{
                    background: isEditing ? '#10b981' : 'rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    border: isEditing ? 'none' : '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '5px',
                    padding: '3px 8px',
                    fontSize: '10.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title={isEditing ? 'Valider et sauvegarder le texte' : 'Modifier le contenu manuellement'}
                >
                  <span>{isEditing ? '💾 Valider' : '✏️ Modifier'}</span>
                </button>
              )}
            </div>

            {/* Center: Position Presets & Occlusion Status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {isAvatarInFront && (
                <span
                  style={{
                    background: 'rgba(245, 158, 11, 0.25)',
                    color: '#fbbf24',
                    border: '1px solid rgba(245, 158, 11, 0.5)',
                    padding: '2px 7px',
                    borderRadius: '4px',
                    fontSize: '9.5px',
                    fontWeight: 700,
                    marginRight: '4px',
                    whiteSpace: 'nowrap'
                  }}
                  title="L'avatar est placé devant l'écran : cliquez sur ⬅️ Gauche ou ➡️ Droite pour dégager la vue"
                >
                  👤 Avatar devant l'écran
                </span>
              )}
              <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginRight: '2px' }}>Position :</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  moveBillboardTo(-2.6, 0.2, -1.2, 0.4, 'côté gauche');
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#cbd5e1',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '4px',
                  padding: '3px 7px',
                  fontSize: '10.5px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
                title="Placer le panneau sur la gauche orienté vers vous"
              >
                ⬅️ Gauche
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  moveBillboardTo(0, 0.55, -2.4, 0, 'centré derrière la table');
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#cbd5e1',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '4px',
                  padding: '3px 7px',
                  fontSize: '10.5px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
                title="Centrer le panneau en hauteur derrière la table"
              >
                🎯 Centre
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  moveBillboardTo(2.6, 0.2, -1.2, -0.4, 'côté droit');
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#cbd5e1',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '4px',
                  padding: '3px 7px',
                  fontSize: '10.5px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
                title="Placer le panneau sur la droite orienté vers vous"
              >
                ➡️ Droite
              </button>
            </div>

            {/* Right: Window Controls (Single Replier + Plein écran) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCollapsed(true);
                  playAudioFx('switch_click');
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#94a3b8',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '5px',
                  padding: '4px 8px',
                  fontSize: '10.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="Replier le panneau pour dégager totalement la vue 3D"
              >
                <span>🗕 Replier</span>
              </button>

              <button
                type="button"
                onClick={handleOpen}
                style={{
                  background: 'linear-gradient(90deg, #10b981, #059669)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '5px',
                  padding: '4px 10px',
                  fontSize: '10.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)'
                }}
                title="Agrandir en plein écran"
              >
                <span>↗ Plein écran</span>
              </button>
            </div>
          </div>

          {/* Content Viewport */}
          {activeTab === 'recipe' ? (
            isEditing ? (
              <div 
                style={{
                  flex: 1,
                  padding: '16px 20px',
                  background: 'linear-gradient(145deg, #0f172a 0%, #1e293b 100%)',
                  color: '#f8fafc',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#34d399' }}>
                    ✏️ Édition manuelle du document / de la fiche
                  </span>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                    Modifiez le contenu directement :
                  </span>
                </div>
                <textarea
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  onPointerDown={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                  placeholder="Écrivez votre texte, vos ingrédients, vos étapes ou vos notes..."
                  style={{
                    flex: 1,
                    background: 'rgba(0, 0, 0, 0.5)',
                    border: '1px solid rgba(16, 185, 129, 0.5)',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    color: '#f8fafc',
                    fontSize: '12.5px',
                    lineHeight: 1.55,
                    fontFamily: 'inherit',
                    resize: 'none',
                    outline: 'none'
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button
                    type="button"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditedText(recipeText);
                      setIsEditing(false);
                    }}
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: '#94a3b8',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '6px',
                      padding: '6px 14px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSaveText();
                    }}
                    style={{
                      background: 'linear-gradient(90deg, #10b981, #059669)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '6px 18px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)'
                    }}
                  >
                    💾 Sauvegarder dans la scène
                  </button>
                </div>
              </div>
            ) : (
              <div 
                style={{
                  flex: 1,
                  padding: '18px 22px',
                  background: 'linear-gradient(145deg, #0f172a 0%, #1e293b 100%)',
                  color: '#f8fafc',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '22px' }}>🥘</span>
                      <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#34d399' }}>{title}</h2>
                    </div>
                    <span style={{
                      background: 'rgba(16, 185, 129, 0.2)',
                      color: '#6ee7b7',
                      border: '1px solid rgba(16, 185, 129, 0.4)',
                      padding: '3px 10px',
                      borderRadius: '12px',
                      fontSize: '10.5px',
                      fontWeight: 600
                    }}>
                      {isWallMounted ? '📺 Écran mural suspendu' : (isCooking ? 'Atelier culinaire spatial' : (isPdf ? 'Centre de documentation PDF' : 'Fiche documentaire 3D'))}
                    </span>
                  </div>

                  {recipeText ? (
                    <div style={{
                      background: 'rgba(0, 0, 0, 0.35)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '8px',
                      padding: '12px 14px',
                      fontSize: '12.5px',
                      lineHeight: 1.55,
                      color: '#e2e8f0',
                      whiteSpace: 'pre-line',
                      userSelect: 'text'
                    }}>
                      {recipeText}
                    </div>
                  ) : (
                    <div style={{ fontSize: '12.5px', color: '#94a3b8' }}>
                      Consultez la fiche complète ou cliquez sur « ✏️ Modifier » pour saisir votre propre contenu.
                    </div>
                  )}
                </div>

                {/* Informative footer */}
                <div style={{
                  marginTop: '12px',
                  padding: '8px 12px',
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <span style={{ fontSize: '11px', color: '#a7f3d0' }}>
                    💡 <strong>Astuce :</strong> Cliquez sur <strong>✏️ Modifier</strong> pour ajuster le texte, ou <strong>🗕 Replier</strong> pour dégager la vue.
                  </span>
                  <button
                    type="button"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={handleOpen}
                    style={{
                      background: '#10b981',
                      color: '#ffffff',
                      padding: '4px 10px',
                      borderRadius: '5px',
                      fontSize: '10.5px',
                      fontWeight: 600,
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    Plein écran ↗
                  </button>
                </div>
              </div>
            )
          ) : (
            <div 
              style={{ flex: 1, position: 'relative', background: '#ffffff', overflow: 'hidden' }}
            >
              <iframe
                src={url}
                title={title}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  pointerEvents: 'none'
                }}
                loading="lazy"
              />

              {/* Hover overlay enticing user to click */}
              <div 
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: isHovered ? 'rgba(5, 150, 105, 0.16)' : 'rgba(0, 0, 0, 0.02)',
                  transition: 'background 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {isHovered && (
                  <button
                    type="button"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={handleOpen}
                    style={{
                      background: 'rgba(0, 0, 0, 0.88)',
                      color: '#ffffff',
                      padding: '8px 18px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: 600,
                      border: '1px solid #10b981',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.6)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    <span>🔍 Cliquer pour ouvrir le site en grand</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </Html>
      )}
    </group>
  );
};
