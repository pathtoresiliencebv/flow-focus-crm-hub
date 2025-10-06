/**
 * React Hook for PDF Generation
 * Integrates with the PDF generation service and Edge Function
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { pdfGenerator, PDFOptions, PDFResult } from '@/services/pdfGenerator';
import { quoteTemplate, QuoteData } from '@/templates/quoteTemplate';
import { invoiceTemplate, InvoiceData } from '@/templates/invoiceTemplate';

export interface PDFGenerationOptions {
  template: 'quote' | 'invoice' | 'receipt' | 'project-report';
  data: any;
  options?: {
    paperFormat?: 'a4' | 'a3' | 'letter' | 'legal' | 'tabloid';
    paperOrientation?: 'portrait' | 'landscape';
    paperBorder?: string;
    watermark?: string;
  };
}

export const usePDFGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Generate PDF using Edge Function
   */
  const generatePDFWithEdgeFunction = useCallback(async (options: PDFGenerationOptions): Promise<PDFResult> => {
    setIsGenerating(true);
    setError(null);

    try {
      console.log('🔄 Generating PDF via Edge Function...', options);

      const response = await supabase.functions.invoke('generate-pdf', {
        body: {
          template: options.template,
          data: options.data,
          options: options.options
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const result = response.data;
      console.log('✅ PDF generated via Edge Function:', result);

      // If we have HTML content, we can display it or convert to PDF
      if (result.html) {
        // Open in new window for printing
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(result.html);
          printWindow.document.close();
          printWindow.focus();
          
          // Auto-print after a short delay
          setTimeout(() => {
            printWindow.print();
          }, 1000);
        }
      }

      return {
        success: true,
        filename: result.filename,
        message: result.message
      };

    } catch (err: any) {
      console.error('❌ PDF generation failed:', err);
      setError(err.message);
      return {
        success: false,
        error: err.message
      };
    } finally {
      setIsGenerating(false);
    }
  }, []);

  /**
   * Generate PDF using client-side service
   */
  const generatePDFClientSide = useCallback(async (options: PDFGenerationOptions): Promise<PDFResult> => {
    setIsGenerating(true);
    setError(null);

    try {
      console.log('🔄 Generating PDF client-side...', options);

      // Generate markdown from template
      let markdown: string;
      switch (options.template) {
        case 'quote':
          markdown = quoteTemplate(options.data as QuoteData);
          break;
        case 'invoice':
          markdown = invoiceTemplate(options.data as InvoiceData);
          break;
        default:
          throw new Error(`Unsupported template: ${options.template}`);
      }

      // Generate PDF using the service
      const pdfOptions: PDFOptions = {
        markdown,
        outputFilename: options.options?.watermark ? `${options.template}-${options.data.quoteNumber || options.data.invoiceNumber}.pdf` : undefined,
        paperFormat: options.options?.paperFormat || 'a4',
        paperOrientation: options.options?.paperOrientation || 'portrait',
        paperBorder: options.options?.paperBorder || '2cm',
        watermark: options.options?.watermark
      };

      const result = await pdfGenerator.generatePDF(pdfOptions);

      if (result.success && result.blob) {
        // Download the PDF
        pdfGenerator.downloadPDF(result.blob, result.filename || 'document.pdf');
      }

      return result;

    } catch (err: any) {
      console.error('❌ Client-side PDF generation failed:', err);
      setError(err.message);
      return {
        success: false,
        error: err.message
      };
    } finally {
      setIsGenerating(false);
    }
  }, []);

  /**
   * Generate quote PDF
   */
  const generateQuotePDF = useCallback(async (quoteData: QuoteData, options?: any) => {
    return generatePDFWithEdgeFunction({
      template: 'quote',
      data: quoteData,
      options: {
        paperFormat: 'a4',
        paperOrientation: 'portrait',
        watermark: 'OFFERTE',
        ...options
      }
    });
  }, [generatePDFWithEdgeFunction]);

  /**
   * Generate invoice PDF
   */
  const generateInvoicePDF = useCallback(async (invoiceData: InvoiceData, options?: any) => {
    return generatePDFWithEdgeFunction({
      template: 'invoice',
      data: invoiceData,
      options: {
        paperFormat: 'a4',
        paperOrientation: 'portrait',
        watermark: 'FACTUUR',
        ...options
      }
    });
  }, [generatePDFWithEdgeFunction]);

  /**
   * Generate receipt PDF
   */
  const generateReceiptPDF = useCallback(async (receiptData: any, options?: any) => {
    return generatePDFWithEdgeFunction({
      template: 'receipt',
      data: receiptData,
      options: {
        paperFormat: 'a4',
        paperOrientation: 'portrait',
        watermark: 'BONNETJE',
        ...options
      }
    });
  }, [generatePDFWithEdgeFunction]);

  /**
   * Generate project report PDF
   */
  const generateProjectReportPDF = useCallback(async (reportData: any, options?: any) => {
    return generatePDFWithEdgeFunction({
      template: 'project-report',
      data: reportData,
      options: {
        paperFormat: 'a4',
        paperOrientation: 'portrait',
        watermark: 'RAPPORT',
        ...options
      }
    });
  }, [generatePDFWithEdgeFunction]);

  return {
    isGenerating,
    error,
    generatePDFWithEdgeFunction,
    generatePDFClientSide,
    generateQuotePDF,
    generateInvoicePDF,
    generateReceiptPDF,
    generateProjectReportPDF,
    clearError: () => setError(null)
  };
};

