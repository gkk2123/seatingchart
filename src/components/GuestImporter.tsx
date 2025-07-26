// src/components/GuestImporter.tsx
import React, { useState } from 'react';
import type { Guest } from '../types';

// Assume SheetJS is loaded from a CDN and available on window.XLSX
declare var XLSX: any;

export const GuestImporter: React.FC<{ onGuestsImported: (guests: Guest[]) => void }> = ({ onGuestsImported }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseFile = (file: File): Promise<Omit<Guest, 'id'>[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          if (!sheetName) {
            throw new Error(`File ${file.name} contains no sheets.`);
          }
          const worksheet = workbook.Sheets[sheetName];
          const json: any[] = XLSX.utils.sheet_to_json(worksheet);

          if (json.length === 0) {
            resolve([]); // Resolve with empty array for empty files
            return;
          }

          const importedGuests = json.map((row, index) => {
            const nameKey = Object.keys(row).find(k => k.toLowerCase() === 'name');
            const groupKey = Object.keys(row).find(k => k.toLowerCase() === 'group');
            const rsvpKey = Object.keys(row).find(k => k.toLowerCase() === 'rsvp');
            const plusOnesKey = Object.keys(row).find(k => k.toLowerCase().replace(/ /g, '') === 'plusones');
            
            if (!nameKey || !row[nameKey]) {
              throw new Error(`Row ${index + 2} in ${file.name}: 'Name' column is missing or empty.`);
            }

            return {
              name: String(row[nameKey]),
              group: groupKey ? String(row[groupKey]) : undefined,
              rsvp: rsvpKey ? row[rsvpKey] : 'Pending',
              plusOnes: plusOnesKey ? parseInt(String(row[plusOnesKey]), 10) || 0 : 0,
            };
          });
          resolve(importedGuests);
        } catch (err) {
          reject(err instanceof Error ? err : new Error(String(err)));
        }
      };
      reader.onerror = () => {
        reject(new Error(`Failed to read the file: ${file.name}.`));
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsLoading(true);
    setError(null);

    let allRawGuests: Omit<Guest, 'id'>[] = [];
    const errors: string[] = [];

    for (const file of Array.from(files)) {
      try {
        const guestsFromFile = await parseFile(file);
        allRawGuests.push(...guestsFromFile);
      } catch (err) {
        const message = err instanceof Error ? err.message : `An unknown error occurred with ${file.name}`;
        errors.push(message);
      }
    }
    
    // De-duplicate guests from all files based on name
    const guestNames = new Set<string>();
    const uniqueGuests: Omit<Guest, 'id'>[] = [];
    for (const guest of allRawGuests) {
      const lowerCaseName = guest.name.toLowerCase().trim();
      if (lowerCaseName && !guestNames.has(lowerCaseName)) {
        guestNames.add(lowerCaseName);
        uniqueGuests.push(guest);
      }
    }

    // Expand plus-ones and assign final IDs
    const finalGuests: Guest[] = [];
    let idCounter = 0;
    uniqueGuests.forEach(guest => {
      finalGuests.push({ ...guest, id: idCounter++ });
      if (guest.plusOnes && guest.plusOnes > 0) {
        for (let i = 0; i < guest.plusOnes; i++) {
          finalGuests.push({
            id: idCounter++,
            name: `${guest.name}'s Guest ${i + 1}`,
            group: guest.group,
            rsvp: guest.rsvp,
            plusOnes: 0,
          });
        }
      }
    });

    if (errors.length > 0) {
      setError(errors.join('\n'));
    }
    
    onGuestsImported(finalGuests);
    
    setIsLoading(false);
    event.target.value = '';
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold mb-4 text-gray-700">Import Guest List</h2>
      <p className="text-gray-600 mb-4">
        Upload one or more Excel (.xlsx, .xls) or CSV (.csv) files. Columns: <strong>Name</strong> (required), <strong>Group</strong>, <strong>RSVP</strong>, <strong>PlusOnes</strong>.
      </p>
      <div className="flex items-center space-x-4">
        <label htmlFor="file-upload" className={`inline-block px-6 py-3 text-white font-semibold rounded-lg shadow-md cursor-pointer transition-colors duration-300 ${isLoading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}>
          {isLoading ? 'Processing...' : 'Upload File(s)'}
        </label>
        <input
          id="file-upload"
          type="file"
          accept=".xlsx, .xls, .csv"
          className="hidden"
          onChange={handleFileChange}
          disabled={isLoading}
          multiple
          aria-label="Upload guest list file"
        />
      </div>
      {error && <p className="mt-4 text-red-500 font-semibold whitespace-pre-wrap">{error}</p>}
    </div>
  );
};