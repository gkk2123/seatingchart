// src/utils/pdfExport.ts
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { Guest, Table } from '../types';

export const generateSeatingChartPDF = async (tables: Table[], guestsById: Map<number, Guest>): Promise<Uint8Array> => {
  const pdfDoc = await PDFDocument.create();
  const pageMargin = 50;
  
  // Embed fonts
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  for (const table of tables) {
    if (table.assignedGuestIds.length === 0) {
      continue; // Skip empty tables
    }

    const page = pdfDoc.addPage(); // A4 is default
    const { height } = page.getSize();
    let y = height - pageMargin;

    // Draw Table Name (Title)
    page.drawText(table.name, {
      x: pageMargin,
      y: y,
      font: helveticaBoldFont,
      size: 24,
      color: rgb(0.1, 0.1, 0.1),
    });
    
    y -= 40; // Space after title

    // Draw Guest List
    const assignedGuests = table.assignedGuestIds
        .map(id => guestsById.get(id))
        .filter((g): g is Guest => !!g);
        
    for (const guest of assignedGuests) {
        if (y < pageMargin) {
            // This is a simple implementation. A more complex one would add a new page
            // if the guest list is too long, but for now we assume it fits.
            break; 
        }
        
        page.drawText(`- ${guest.name}`, {
            x: pageMargin,
            y: y,
            font: helveticaFont,
            size: 12,
            color: rgb(0.2, 0.2, 0.2),
        });
        y -= 20; // Line height
    }
  }

  return pdfDoc.save();
};