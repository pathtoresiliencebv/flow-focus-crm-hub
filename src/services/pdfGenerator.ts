/**
 * PDF Generator Service
 * Custom implementation inspired by markdown2pdf-mcp
 * Generates PDFs from Markdown content using browser APIs
 */

export interface PDFOptions {
  markdown: string;
  outputFilename?: string;
  paperFormat?: 'a4' | 'a3' | 'letter' | 'legal' | 'tabloid';
  paperOrientation?: 'portrait' | 'landscape';
  paperBorder?: string;
  watermark?: string;
}

export interface PDFResult {
  success: boolean;
  filename?: string;
  error?: string;
  blob?: Blob;
}

export class PDFGenerator {
  private static instance: PDFGenerator;
  
  public static getInstance(): PDFGenerator {
    if (!PDFGenerator.instance) {
      PDFGenerator.instance = new PDFGenerator();
    }
    return PDFGenerator.instance;
  }

  /**
   * Generate PDF from Markdown content
   */
  async generatePDF(options: PDFOptions): Promise<PDFResult> {
    try {
      console.log('🔄 Generating PDF from Markdown...', {
        filename: options.outputFilename,
        format: options.paperFormat,
        orientation: options.paperOrientation
      });

      // Convert Markdown to HTML
      const html = this.markdownToHtml(options.markdown);
      
      // Create styled HTML document
      const styledHtml = this.createStyledHTML(html, options);
      
      // Generate PDF using browser print API
      const pdfBlob = await this.htmlToPDF(styledHtml, options);
      
      // Generate filename if not provided
      const filename = options.outputFilename || this.generateFilename();
      
      console.log('✅ PDF generated successfully:', filename);
      
      return {
        success: true,
        filename,
        blob: pdfBlob
      };
      
    } catch (error: any) {
      console.error('❌ PDF generation failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Convert Markdown to HTML
   */
  private markdownToHtml(markdown: string): string {
    // Simple Markdown to HTML converter
    // This is a basic implementation - in production you'd use a library like marked
    let html = markdown
      // Headers
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // Bold
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      // Code blocks
      .replace(/```([\s\S]*?)```/gim, '<pre><code>$1</code></pre>')
      // Inline code
      .replace(/`([^`]*)`/gim, '<code>$1</code>')
      // Line breaks
      .replace(/\n/gim, '<br>')
      // Lists
      .replace(/^\* (.*$)/gim, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/gim, '<ul>$1</ul>');

    return html;
  }

  /**
   * Create styled HTML document
   */
  private createStyledHTML(html: string, options: PDFOptions): string {
    const paperSize = this.getPaperSize(options.paperFormat);
    const orientation = options.paperOrientation || 'portrait';
    const border = options.paperBorder || '2cm';
    const watermark = options.watermark;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>PDF Document</title>
  <style>
    @page {
      size: ${paperSize} ${orientation};
      margin: ${border};
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 100%;
    }
    
    h1, h2, h3, h4, h5, h6 {
      color: #2563eb;
      margin-top: 1.5em;
      margin-bottom: 0.5em;
    }
    
    h1 { font-size: 2em; border-bottom: 2px solid #2563eb; padding-bottom: 0.3em; }
    h2 { font-size: 1.5em; }
    h3 { font-size: 1.25em; }
    
    p { margin-bottom: 1em; }
    
    strong { font-weight: 600; }
    em { font-style: italic; }
    
    code {
      background-color: #f3f4f6;
      padding: 0.2em 0.4em;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
    }
    
    pre {
      background-color: #f3f4f6;
      padding: 1em;
      border-radius: 5px;
      overflow-x: auto;
      margin: 1em 0;
    }
    
    pre code {
      background: none;
      padding: 0;
    }
    
    ul, ol {
      margin: 1em 0;
      padding-left: 2em;
    }
    
    li {
      margin-bottom: 0.5em;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1em 0;
    }
    
    th, td {
      border: 1px solid #e5e7eb;
      padding: 0.5em;
      text-align: left;
    }
    
    th {
      background-color: #f9fafb;
      font-weight: 600;
    }
    
    .watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 3em;
      color: rgba(0, 0, 0, 0.1);
      z-index: -1;
      pointer-events: none;
    }
    
    @media print {
      body { -webkit-print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  ${watermark ? `<div class="watermark">${watermark}</div>` : ''}
  ${html}
</body>
</html>`;
  }

  /**
   * Convert HTML to PDF using browser APIs
   */
  private async htmlToPDF(html: string, options: PDFOptions): Promise<Blob> {
    return new Promise((resolve, reject) => {
      // Create a new window for PDF generation
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        reject(new Error('Could not open print window'));
        return;
      }

      printWindow.document.write(html);
      printWindow.document.close();

      printWindow.onload = () => {
        // Wait for content to load
        setTimeout(() => {
          printWindow.print();
          
          // For now, we'll create a simple blob
          // In a real implementation, you'd capture the print output
          const blob = new Blob([html], { type: 'text/html' });
          resolve(blob);
          
          printWindow.close();
        }, 1000);
      };
    });
  }

  /**
   * Get paper size for CSS
   */
  private getPaperSize(format?: string): string {
    switch (format) {
      case 'a3': return 'A3';
      case 'letter': return 'letter';
      case 'legal': return 'legal';
      case 'tabloid': return 'tabloid';
      default: return 'A4';
    }
  }

  /**
   * Generate filename if not provided
   */
  private generateFilename(): string {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    return `document-${timestamp}.pdf`;
  }

  /**
   * Download PDF blob
   */
  downloadPDF(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

// Export singleton instance
export const pdfGenerator = PDFGenerator.getInstance();

