// src/components/TableCard.tsx
import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { DraggableGuestPill } from './GuestPill';
import type { Table, Guest } from '../types';

export const TableCard: React.FC<{ table: Table; assignedGuests: Guest[] }> = ({ table, assignedGuests }) => {
    const isFull = assignedGuests.length >= table.capacity;
    const { isOver, setNodeRef } = useDroppable({
        id: `table-${table.id}`,
        disabled: isFull,
    });
    
    const isCircle = table.shape === 'Circle';
    const dropzoneClasses = isOver && !isFull ? 'outline-4 outline-blue-500 outline-offset-4 border-blue-500' : 'border-gray-300';

    return (
        <div className="flex flex-col text-center">
            <div 
                ref={setNodeRef}
                className={`bg-white p-4 rounded-lg shadow-md transition-all duration-200 ${isFull ? 'bg-gray-100' : ''}`}
            >
                <div className={`relative border-4 ${dropzoneClasses} flex items-center justify-center mb-3 transition-all duration-200 ${isCircle ? 'w-36 h-36 rounded-full' : 'w-48 h-28 rounded-lg'}`}>
                    <div className="flex flex-col">
                        <span className="font-bold text-lg text-gray-800">{table.name}</span>
                        <span className={`text-sm ${isFull ? 'text-red-500 font-semibold' : 'text-gray-500'}`}>
                            {assignedGuests.length} / {table.capacity} seats
                        </span>
                    </div>
                </div>
                <div className="min-h-[60px] w-full flex-grow flex flex-wrap justify-center items-start gap-2 p-2 bg-gray-50 rounded">
                    {assignedGuests.map(guest => <DraggableGuestPill key={guest.id} guest={guest} />)}
                    {assignedGuests.length === 0 && <span className="text-xs text-gray-400 self-center">Drag guests here</span>}
                </div>
            </div>
        </div>
    );
};
