// src/components/SeatingControls.tsx
import React from 'react';

const SparklesIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm6 0a1 1 0 011 1v1h1a1 1 0 010 2h-1v1a1 1 0 01-2 0V6h-1a1 1 0 010-2h1V3a1 1 0 011-1zM9 9a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1zm-3 2a1 1 0 100 2h1a1 1 0 100-2H6zm-1-4a1 1 0 011-1h1a1 1 0 110 2H6a1 1 0 01-1-1zm8 6a1 1 0 100 2h1a1 1 0 100-2h-1z" clipRule="evenodd" />
    </svg>
);

const TrashIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
    </svg>
);


export const SeatingControls: React.FC<{
  onAutoSeat: () => void;
  onClear: () => void;
  isSeatingDisabled: boolean;
}> = ({ onAutoSeat, onClear, isSeatingDisabled }) => {
  return (
    <div className="flex items-center justify-end gap-4 mb-4">
      <button
        onClick={onAutoSeat}
        disabled={isSeatingDisabled}
        className="px-4 py-2 text-sm font-semibold rounded-lg shadow-sm flex items-center gap-2 transition-colors duration-200 bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed"
      >
        <SparklesIcon />
        Auto-Seat by Group
      </button>
      <button
        onClick={onClear}
        className="px-4 py-2 text-sm font-semibold rounded-lg shadow-sm flex items-center gap-2 transition-colors duration-200 bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300"
      >
        <TrashIcon />
        Clear All Assignments
      </button>
    </div>
  );
};