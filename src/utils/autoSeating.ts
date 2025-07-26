// src/utils/autoSeating.ts
import type { Guest, Table } from '../types';

interface AutoSeatResult {
  updatedTables: Table[];
  splitGroups: string[];
}

export const autoSeatGuests = (guests: Guest[], tables: Table[]): AutoSeatResult => {
  const guestsToSeat = guests.filter(g => g.rsvp === 'Attending');
  const availableTables = JSON.parse(JSON.stringify(tables)) as Table[];
  const splitGroups = new Set<string>();

  // Group guests by their "group" property
  const groupedGuests = guestsToSeat.reduce((acc, guest) => {
    const groupName = guest.group || 'Individual';
    if (!acc[groupName]) {
      acc[groupName] = [];
    }
    acc[groupName].push(guest);
    return acc;
  }, {} as Record<string, Guest[]>);

  // Sort groups by size, largest first, to give them priority
  const sortedGroups = Object.entries(groupedGuests).sort(([, a], [, b]) => b.length - a.length);

  for (const [groupName, groupMembers] of sortedGroups) {
    if (groupName === 'Individual') continue; // Handle individuals later

    let membersToSeat = [...groupMembers];
    
    // Try to find a table that fits the whole group
    const tableThatFits = availableTables.find(t => t.capacity - t.assignedGuestIds.length >= membersToSeat.length);
    if (tableThatFits) {
      tableThatFits.assignedGuestIds.push(...membersToSeat.map(m => m.id));
      membersToSeat = [];
    } else {
      // If no single table fits, split the group across multiple tables
      if (groupMembers.length > 0) {
        splitGroups.add(groupName);
      }
      for (const member of membersToSeat) {
        const tableWithSpace = availableTables.find(t => t.capacity - t.assignedGuestIds.length > 0);
        if (tableWithSpace) {
          tableWithSpace.assignedGuestIds.push(member.id);
        }
        // If no space at all, they remain unassigned. The user will see this in the unassigned list.
      }
    }
  }

  // Seat individual guests
  const individuals = groupedGuests['Individual'] || [];
  for (const individual of individuals) {
    // Find the table with the most available space to distribute them evenly
    const tablesWithSpace = availableTables
        .map(t => ({...t, remaining: t.capacity - t.assignedGuestIds.length}))
        .filter(t => t.remaining > 0)
        .sort((a,b) => b.remaining - a.remaining);
        
    if(tablesWithSpace.length > 0) {
        const targetTable = availableTables.find(t => t.id === tablesWithSpace[0].id);
        if(targetTable){
            targetTable.assignedGuestIds.push(individual.id);
        }
    }
  }

  return {
    updatedTables: availableTables,
    splitGroups: Array.from(splitGroups),
  };
};