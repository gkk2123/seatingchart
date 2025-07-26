// src/types.ts

export interface Guest {
  id: number;
  name: string;
  group?: string;
  rsvp?: 'Attending' | 'Not Attending' | 'Pending';
  plusOnes?: number;
}

export interface Table {
  id: number;
  name: string;
  capacity: number;
  shape: 'Circle' | 'Rectangle';
  assignedGuestIds: number[];
}
