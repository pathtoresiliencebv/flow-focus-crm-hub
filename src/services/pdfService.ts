/**
 * Simple PDF Generation Service
 * Uses browser print functionality for PDF generation
 */

export interface PDFOptions {
  filename?: string;
  title?: string;
  orientation?: 'portrait' | 'landscape';
  margin?: number;
}

export class PDFService {
  static async generatePDF(element: HTMLElement, options: PDFOptions = {}): Promise<void> {
    const { filename = 'document.pdf', title = 'Document' } = options;

    // Create print window
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Could not open print window');
    }

    // Write content to print window
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <meta charset="utf-8">
          <style>
            @media print {
              @page { size: A4; margin: 20mm; }
              body { font-family: Arial, sans-serif; font-size: 12px; }
            }
          </style>
        </head>
        <body>
          ${element.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }
}
