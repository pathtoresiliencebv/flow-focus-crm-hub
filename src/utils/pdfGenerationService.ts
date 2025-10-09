import html2pdf from 'html2pdf.js';
import { supabase } from '@/integrations/supabase/client';

/**
 * PDF Generation Service using html2pdf.js (Context7 MCP)
 * ========================================================
 * 
 * Based on html2pdf.js documentation from Context7 MCP:
 * - Library ID: /ekoopmans/html2pdf.js
 * - Trust Score: 8.5
 * - 27 Code Snippets
 * 
 * Features:
 * - Client-side PDF generation from HTML
 * - Upload to Supabase Storage
 * - Configurable options (margins, quality, etc.)
 * - Promise-based API
 */

export interface PDFOptions {
  filename?: string;
  margin?: number | [number, number] | [number, number, number, number];
  image?: {
    type: 'jpeg' | 'png' | 'webp';
    quality: number;
  };
  html2canvas?: {
    scale: number;
    useCORS?: boolean;
    logging?: boolean;
  };
  jsPDF?: {
    unit: 'pt' | 'px' | 'in' | 'mm' | 'cm' | 'ex' | 'em' | 'pc';
    format: 'a3' | 'a4' | 'a5' | 'letter' | 'legal' | [number, number];
    orientation: 'portrait' | 'landscape';
    compressPDF?: boolean;
  };
  pagebreak?: {
    mode?: string | string[];
    before?: string | string[];
    after?: string | string[];
    avoid?: string | string[];
  };
}

const DEFAULT_PDF_OPTIONS: PDFOptions = {
  filename: 'document.pdf',
  margin: [10, 10, 10, 10], // [top, left, bottom, right] in mm
  image: {
    type: 'jpeg',
    quality: 0.98,
  },
  html2canvas: {
    scale: 2,
    useCORS: true,
    logging: false,
  },
  jsPDF: {
    unit: 'mm',
    format: 'a4',
    orientation: 'portrait',
    compressPDF: true,
  },
  pagebreak: {
    mode: ['css', 'legacy'],
    avoid: ['img', 'table', '.avoid-break'],
  },
};

/**
 * Generate PDF from HTML element and return as Blob
 * @param element HTML element to convert
 * @param options PDF generation options
 * @returns Promise<Blob> PDF blob
 */
export async function generatePDFBlob(
  element: HTMLElement,
  options: Partial<PDFOptions> = {}
): Promise<Blob> {
  const mergedOptions = {
    ...DEFAULT_PDF_OPTIONS,
    ...options,
    image: { ...DEFAULT_PDF_OPTIONS.image, ...options.image },
    html2canvas: { ...DEFAULT_PDF_OPTIONS.html2canvas, ...options.html2canvas },
    jsPDF: { ...DEFAULT_PDF_OPTIONS.jsPDF, ...options.jsPDF },
    pagebreak: { ...DEFAULT_PDF_OPTIONS.pagebreak, ...options.pagebreak },
  };

  try {
    // Generate PDF using html2pdf.js Worker API
    // Based on Context7 MCP documentation
    const worker = html2pdf();
    
    // Set options and generate PDF
    const pdfBlob = await worker
      .set(mergedOptions)
      .from(element)
      .outputPdf('blob') as Blob;

    return pdfBlob;
  } catch (error) {
    console.error('PDF generation error:', error);
    throw new Error(`Failed to generate PDF: ${error.message}`);
  }
}

/**
 * Generate PDF and save to local file (download)
 * @param element HTML element to convert
 * @param filename Filename for downloaded PDF
 * @param options PDF generation options
 */
export async function generateAndDownloadPDF(
  element: HTMLElement,
  filename: string = 'document.pdf',
  options: Partial<PDFOptions> = {}
): Promise<void> {
  const mergedOptions = {
    ...DEFAULT_PDF_OPTIONS,
    ...options,
    filename,
    image: { ...DEFAULT_PDF_OPTIONS.image, ...options.image },
    html2canvas: { ...DEFAULT_PDF_OPTIONS.html2canvas, ...options.html2canvas },
    jsPDF: { ...DEFAULT_PDF_OPTIONS.jsPDF, ...options.jsPDF },
    pagebreak: { ...DEFAULT_PDF_OPTIONS.pagebreak, ...options.pagebreak },
  };

  try {
    // Generate and save PDF using html2pdf.js
    // Based on Context7 MCP documentation: html2pdf().from(element).save()
    await html2pdf()
      .set(mergedOptions)
      .from(element)
      .save();
  } catch (error) {
    console.error('PDF download error:', error);
    throw new Error(`Failed to download PDF: ${error.message}`);
  }
}

/**
 * Generate PDF and upload to Supabase Storage
 * @param element HTML element to convert
 * @param bucket Supabase storage bucket name
 * @param path File path in storage
 * @param options PDF generation options
 * @returns Promise<string> Public URL of uploaded PDF
 */
export async function generateAndUploadPDF(
  element: HTMLElement,
  bucket: string,
  path: string,
  options: Partial<PDFOptions> = {}
): Promise<string> {
  try {
    // Generate PDF blob
    const pdfBlob = await generatePDFBlob(element, options);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, pdfBlob, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (error) {
      throw error;
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('PDF upload error:', error);
    throw new Error(`Failed to upload PDF: ${error.message}`);
  }
}

/**
 * Generate PDF, upload to Supabase, and return both blob and URL
 * @param element HTML element to convert
 * @param bucket Supabase storage bucket name
 * @param path File path in storage
 * @param options PDF generation options
 * @returns Promise<{blob: Blob, url: string}>
 */
export async function generatePDFWithUpload(
  element: HTMLElement,
  bucket: string,
  path: string,
  options: Partial<PDFOptions> = {}
): Promise<{ blob: Blob; url: string }> {
  try {
    // Generate PDF blob
    const blob = await generatePDFBlob(element, options);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, blob, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (error) {
      throw error;
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return {
      blob,
      url: publicUrlData.publicUrl,
    };
  } catch (error) {
    console.error('PDF generation and upload error:', error);
    throw new Error(`Failed to generate and upload PDF: ${error.message}`);
  }
}

/**
 * Open PDF in new browser tab
 * @param element HTML element to convert
 * @param options PDF generation options
 */
export async function generateAndOpenPDF(
  element: HTMLElement,
  options: Partial<PDFOptions> = {}
): Promise<void> {
  try {
    // Generate PDF blob
    const pdfBlob = await generatePDFBlob(element, options);

    // Create object URL
    const blobUrl = URL.createObjectURL(pdfBlob);

    // Open in new tab
    window.open(blobUrl, '_blank');

    // Clean up object URL after a delay
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  } catch (error) {
    console.error('PDF open error:', error);
    throw new Error(`Failed to open PDF: ${error.message}`);
  }
}

/**
 * Helper: Create a temporary container for PDF generation
 * Useful when you need to render HTML without displaying it
 * @param htmlContent HTML string to render
 * @returns HTMLElement temporary container
 */
export function createTempContainer(htmlContent: string): HTMLElement {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  tempDiv.style.top = '0';
  document.body.appendChild(tempDiv);
  return tempDiv;
}

/**
 * Helper: Remove temporary container
 * @param container HTMLElement to remove
 */
export function removeTempContainer(container: HTMLElement): void {
  if (container && container.parentNode) {
    container.parentNode.removeChild(container);
  }
}

