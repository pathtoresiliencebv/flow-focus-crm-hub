/**
 * PDF Generation Service
 * Simple PDF generation using browser's print functionality
 */

export interface PDFOptions {
  filename?: string;
  title?: string;
  orientation?: 'portrait' | 'landscape';
  margin?: number;
}

export class PDFService {
  /**
   * Generate PDF from HTML element using browser print
   */
  static async generatePDF(element: HTMLElement, options: PDFOptions = {}): Promise<void> {
    const {
      filename = 'document.pdf',
      title = 'Document',
      orientation = 'portrait',
      margin = 20
    } = options;

    // Create a temporary container for the PDF content
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '-9999px';
    tempContainer.style.width = '210mm'; // A4 width
    tempContainer.style.minHeight = '297mm'; // A4 height
    tempContainer.style.backgroundColor = 'white';
    tempContainer.style.padding = `${margin}mm`;
    tempContainer.style.fontFamily = 'Arial, sans-serif';
    tempContainer.style.fontSize = '12px';
    tempContainer.style.lineHeight = '1.4';
    tempContainer.style.color = '#000';

    // Clone the content
    const clonedContent = element.cloneNode(true) as HTMLElement;
    tempContainer.appendChild(clonedContent);

    // Add print styles
    const printStyles = document.createElement('style');
    printStyles.textContent = `
      @media print {
        @page {
          size: A4 ${orientation};
          margin: ${margin}mm;
        }
        
        body {
          margin: 0;
          padding: 0;
          font-family: Arial, sans-serif;
          font-size: 12px;
          line-height: 1.4;
          color: #000;
        }
        
        .no-print {
          display: none !important;
        }
        
        .page-break {
          page-break-before: always;
        }
        
        h1, h2, h3, h4, h5, h6 {
          margin-top: 0;
          margin-bottom: 10px;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15px;
        }
        
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        
        th {
          background-color: #f5f5f5;
          font-weight: bold;
        }
      }
    `;

    // Create print window
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      throw new Error('Could not open print window. Please allow popups.');
    }

    // Write content to print window
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          ${printStyles.outerHTML}
        </head>
        <body>
          ${tempContainer.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();

    // Wait for content to load
    await new Promise(resolve => {
      printWindow.onload = resolve;
    });

    // Trigger print dialog
    printWindow.focus();
    printWindow.print();

    // Clean up
    document.body.removeChild(tempContainer);
  }

  /**
   * Generate PDF and download it
   */
  static async downloadPDF(element: HTMLElement, options: PDFOptions = {}): Promise<void> {
    // For now, we'll use the print functionality
    // In a real implementation, you might want to use a library like jsPDF
    await this.generatePDF(element, options);
  }

  /**
   * Generate PDF and return as blob
   */
  static async generatePDFBlob(element: HTMLElement, options: PDFOptions = {}): Promise<Blob> {
    // This is a placeholder - in a real implementation, you would use a PDF library
    // For now, we'll return an empty blob
    return new Blob(['PDF generation not implemented'], { type: 'application/pdf' });
  }

  /**
   * Open PDF in new window
   */
  static async openPDF(element: HTMLElement, options: PDFOptions = {}): Promise<void> {
    await this.generatePDF(element, options);
  }
}

/**
 * React hook for PDF generation
 */
export function usePDF() {
  const generatePDF = async (element: HTMLElement, options?: PDFOptions) => {
    await PDFService.generatePDF(element, options);
  };

  const downloadPDF = async (element: HTMLElement, options?: PDFOptions) => {
    await PDFService.downloadPDF(element, options);
  };

  const openPDF = async (element: HTMLElement, options?: PDFOptions) => {
    await PDFService.openPDF(element, options);
  };

  return {
    generatePDF,
    downloadPDF,
    openPDF
  };
}
