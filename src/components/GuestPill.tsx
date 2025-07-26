// src/components/GuestPill.tsx
import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import type { Guest } from '../types';

export const DraggableGuestPill: React.FC<{ guest: Guest; isOverlay?: boolean }> = ({ guest, isOverlay }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `guest-${guest.id}`,
  });

  const style = transform && !isOverlay ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      title={guest.group ? `Group: ${guest.group}` : 'No group assigned'}
      className={`px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full shadow-sm text-sm font-medium cursor-grab ${isDragging && !isOverlay ? 'opacity-30' : ''} ${isOverlay ? 'ring-2 ring-blue-500' : ''}`}
      aria-label={`Draggable guest: ${guest.name}`}
    >
      {guest.name}
    </div>
  );
};