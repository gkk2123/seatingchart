// src/App.tsx
import React, { useState, useCallback, useMemo } from 'react';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import type { Guest, Table } from './types';

import { Header } from './components/Header';
import { GuestImporter } from './components/GuestImporter';
import { TableConfiguration } from './components/TableConfiguration';
import { UnassignedGuestList } from './components/UnassignedGuestList';
import { SeatingArea } from './components/SeatingArea';
import { DraggableGuestPill } from './components/GuestPill';
import { ProjectControls } from './components/ProjectControls';
import { ExportControls } from './components/ExportControls';
import { autoSeatGuests } from './utils/autoSeating';
import { generateSeatingChartPDF } from './utils/pdfExport';
import { GuestListManager } from './components/GuestListManager';
import { GuestEditModal } from './components/GuestEditModal';

export const App: React.FC = () => {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  
  // Drag-and-drop state
  const [activeId, setActiveId] = useState<string | null>(null);

  // UI State
  const [loadError, setLoadError] = useState<string | null>(null);
  const [splitGroupsNotification, setSplitGroupsNotification] = useState<string | null>(null);
  const [editingGuest, setEditingGuest] = useState<Guest | null | 'new'>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [rsvpFilter, setRsvpFilter] = useState('All');

  const guestsById = useMemo(() => new Map(guests.map(g => [g.id, g])), [guests]);
  const activeGuest = activeId ? guestsById.get(parseInt(activeId.split('-')[1])) : null;

  const assignedGuestIds = useMemo(() => new Set(tables.flatMap(t => t.assignedGuestIds)), [tables]);
  const unassignedGuests = useMemo(() => guests.filter(g => g.rsvp === 'Attending' && !assignedGuestIds.has(g.id)), [guests, assignedGuestIds]);
  const isAnythingAssigned = useMemo(() => tables.some(t => t.assignedGuestIds.length > 0), [tables]);

  const handleGuestsImported = useCallback((importedGuests: Guest[]) => {
      setGuests(importedGuests);
      setTables([]); // Reset tables when a new list is imported
      setLoadError(null);
      setSplitGroupsNotification(null);
  }, []);

  const handleAddTable = useCallback((newTableData: Omit<Table, 'id' | 'assignedGuestIds'>) => {
    setTables(prevTables => [
      ...prevTables,
      {
        ...newTableData,
        id: Date.now(),
        assignedGuestIds: [],
      }
    ]);
     setSplitGroupsNotification(null);
  }, []);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
    setSplitGroupsNotification(null);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;

    if (!over || !active.id) return;

    const guestId = parseInt(String(active.id).split('-')[1]);
    const targetId = String(over.id);
    
    const sourceTable = tables.find(t => t.assignedGuestIds.includes(guestId));
    
    if (sourceTable && targetId === `table-${sourceTable.id}`) return;
    if (!sourceTable && targetId === 'unassigned-area') return;

    if (targetId.startsWith('table-')) {
        const targetTableId = parseInt(targetId.split('-')[1]);
        const targetTable = tables.find(t => t.id === targetTableId);
        
        if (targetTable && targetTable.assignedGuestIds.length < targetTable.capacity) {
            setTables(prevTables => {
                const tablesWithoutGuest = prevTables.map(t => ({
                    ...t,
                    assignedGuestIds: t.assignedGuestIds.filter(id => id !== guestId),
                }));
                return tablesWithoutGuest.map(t => 
                    t.id === targetTableId 
                    ? { ...t, assignedGuestIds: [...t.assignedGuestIds, guestId] }
                    : t
                );
            });
        }
    } else if (targetId === 'unassigned-area') {
        setTables(prevTables => prevTables.map(t => ({
            ...t,
            assignedGuestIds: t.assignedGuestIds.filter(id => id !== guestId),
        })));
    }
  }, [tables]);

  const handleSaveProject = useCallback(() => {
    setLoadError(null);
    try {
        const stateToSave = { version: '1.0', guests, tables };
        const blob = new Blob([JSON.stringify(stateToSave, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'seating-chart-project.json';
        a.click();
        URL.revokeObjectURL(url);
    } catch(err) {
        setLoadError("Failed to save the project. Please try again.");
    }
  }, [guests, tables]);

  const handleLoadProject = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text);

        if (!data || !Array.isArray(data.guests) || !Array.isArray(data.tables)) {
          throw new Error('Invalid file format.');
        }

        setGuests(data.guests);
        setTables(data.tables);
        setLoadError(null);
        setSplitGroupsNotification(null);
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : 'Error loading file.');
      }
    };
    reader.onerror = () => setLoadError('Failed to read the file.');
    reader.readAsText(file);
  }, []);

  const handleAutoSeat = useCallback(() => {
    const clearedTables = tables.map(t => ({ ...t, assignedGuestIds: [] }));
    const { updatedTables, splitGroups } = autoSeatGuests(guests, clearedTables);
    setTables(updatedTables);
    
    if (splitGroups.length > 0) {
      setSplitGroupsNotification(`Groups split: ${splitGroups.join(', ')}.`);
    } else if (guests.filter(g => g.rsvp === 'Attending').length > 0) {
      setSplitGroupsNotification('All attending guests seated without splitting groups.');
    } else {
      setSplitGroupsNotification(null);
    }
  }, [guests, tables]);

  const handleClearAllAssignments = useCallback(() => {
    setTables(prevTables => prevTables.map(t => ({ ...t, assignedGuestIds: [] })));
    setSplitGroupsNotification(null);
  }, []);

  const handleExportPdf = useCallback(async () => {
    if (tables.length === 0) return;
    try {
        const pdfBytes = await generateSeatingChartPDF(tables, guestsById);
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'seating-chart.pdf';
        a.click();
        URL.revokeObjectURL(url);
    } catch(err) {
        console.error("Failed to generate PDF", err);
    }
  }, [tables, guestsById]);
  
  const handleSaveGuest = useCallback((guestData: Guest) => {
    // If guest is being updated and is now "Not Attending", un-seat them
    if(guestData.rsvp !== 'Attending') {
        setTables(prev => prev.map(t => ({
            ...t,
            assignedGuestIds: t.assignedGuestIds.filter(id => id !== guestData.id)
        })));
    }

    setGuests(prev => {
        const existingIndex = prev.findIndex(g => g.id === guestData.id);
        if (existingIndex > -1) {
            const updatedGuests = [...prev];
            updatedGuests[existingIndex] = guestData;
            return updatedGuests;
        } else {
            return [...prev, guestData];
        }
    });
    setEditingGuest(null);
  }, []);

  const handleDeleteGuest = useCallback((guestId: number) => {
    if (window.confirm("Are you sure you want to delete this guest?")) {
        setGuests(prev => prev.filter(g => g.id !== guestId));
        setTables(prev => prev.map(t => ({
            ...t,
            assignedGuestIds: t.assignedGuestIds.filter(id => id !== guestId),
        })));
    }
  }, []);

  const filteredGuests = useMemo(() => {
    return guests.filter(guest => {
      const matchesSearch = guest.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = rsvpFilter === 'All' || guest.rsvp === rsvpFilter;
      return matchesSearch && matchesFilter;
    }).sort((a,b) => a.name.localeCompare(b.name));
  }, [guests, searchTerm, rsvpFilter]);

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="min-h-screen bg-gray-100 font-sans">
          <Header />
          <main className="container mx-auto p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-1 space-y-6">
                    <GuestImporter onGuestsImported={handleGuestsImported} />
                    <TableConfiguration onAddTable={handleAddTable} />
                    <GuestListManager 
                        guests={filteredGuests}
                        onEditGuest={setEditingGuest}
                        onDeleteGuest={handleDeleteGuest}
                        onAddGuest={() => setEditingGuest('new')}
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        rsvpFilter={rsvpFilter}
                        setRsvpFilter={setRsvpFilter}
                    />
                    <UnassignedGuestList guests={unassignedGuests} />
                    <ProjectControls
                        onSave={handleSaveProject}
                        onLoad={handleLoadProject}
                        loadError={loadError}
                        clearLoadError={() => setLoadError(null)}
                     />
                    <ExportControls 
                        onExport={handleExportPdf}
                        isDisabled={!isAnythingAssigned}
                    />
                </div>
                <div className="lg:col-span-2">
                     <SeatingArea
                        tables={tables}
                        guestsById={guestsById}
                        onAutoSeat={handleAutoSeat}
                        onClear={handleClearAllAssignments}
                        splitGroupsNotification={splitGroupsNotification}
                        isSeatingDisabled={guests.filter(g => g.rsvp === 'Attending').length === 0}
                     />
                </div>
            </div>
          </main>
        </div>
        <DragOverlay>
            {activeGuest ? <DraggableGuestPill guest={activeGuest} isOverlay /> : null}
        </DragOverlay>
        {editingGuest && (
            <GuestEditModal
                guest={editingGuest === 'new' ? null : editingGuest}
                onClose={() => setEditingGuest(null)}
                onSave={handleSaveGuest}
                maxId={guests.reduce((max, g) => Math.max(max, g.id), 0)}
            />
        )}
    </DndContext>
  );
};