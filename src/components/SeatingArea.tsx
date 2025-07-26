// src/components/SeatingArea.tsx
import React, { useMemo } from 'react';
import { TableCard } from './TableCard';
import { SeatingControls } from './SeatingControls';
import type { Table, Guest } from '../types';

export const SeatingArea: React.FC<{
  tables: Table[];
  guestsById: Map<number, Guest>;
  onAutoSeat: () => void;
  onClear: () => void;
  splitGroupsNotification: string | null;
  isSeatingDisabled: boolean;
}> = ({ tables, guestsById, onAutoSeat, onClear, splitGroupsNotification, isSeatingDisabled }) => {
    const attendingCount = useMemo(() => Array.from(guestsById.values()).filter(g => g.rsvp === 'Attending').length, [guestsById]);
    const totalCapacity = tables.reduce((sum, table) => sum + table.capacity, 0);

    if (tables.length === 0) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-lg h-full flex flex-col justify-center items-center text-center min-h-[400px]">
                <h3 className="text-xl font-semibold text-gray-700">Seating Area</h3>
                <p className="text-gray-500 mt-2">Add some tables using the form on the left to begin planning.</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg">
             <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-semibold text-gray-700">Seating Plan</h3>
                <div className="text-right">
                    <p className="font-semibold text-gray-800">Capacity: {totalCapacity}</p>
                    <p className={`text-sm ${attendingCount > totalCapacity ? 'text-red-500 font-bold' : 'text-gray-600'}`}>
                        Attending: {attendingCount}
                    </p>
                </div>
            </div>
            
            <SeatingControls onAutoSeat={onAutoSeat} onClear={onClear} isSeatingDisabled={isSeatingDisabled} />

            {splitGroupsNotification && (
                <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded mb-4" role="alert">
                    <p className="font-bold">Auto-Seat Status</p>
                    <p>{splitGroupsNotification}</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-8">
                {tables.map(table => {
                    const assignedGuests = table.assignedGuestIds.map(id => guestsById.get(id)).filter(Boolean) as Guest[];
                    return <TableCard key={table.id} table={table} assignedGuests={assignedGuests} />
                })}
            </div>
        </div>
    );
};