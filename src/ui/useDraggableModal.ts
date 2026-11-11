import { useState, useRef, useCallback } from 'react';

export interface DragPosition {
  x: number;
  y: number;
}

export function useDraggableModal(initialOffset: DragPosition = { x: 0, y: 0 }) {
  const [offset, setOffset] = useState<DragPosition>(initialOffset);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; startX: number; startY: number } | null>(null);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button, input, textarea, a, select, [data-no-drag]')) return;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: offset.x,
      startY: offset.y,
    };
    setIsDragging(true);
  }, [offset]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.mouseX;
    const dy = e.clientY - dragStartRef.current.mouseY;
    setOffset({
      x: dragStartRef.current.startX + dx,
      y: dragStartRef.current.startY + dy,
    });
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    dragStartRef.current = null;
    setIsDragging(false);
  }, []);

  const resetOffset = useCallback(() => setOffset(initialOffset), [initialOffset]);

  return {
    offset,
    isDragging,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    resetOffset,
    dragProps: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      style: { cursor: isDragging ? 'grabbing' : 'grab' }
    }
  };
}
