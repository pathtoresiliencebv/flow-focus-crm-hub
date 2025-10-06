/**
 * PDF Generator Button Component
 * Reusable button component for generating PDFs
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Download, Loader2 } from 'lucide-react';
import { usePDFGenerator } from '@/hooks/usePDFGenerator';
import { useToast } from '@/hooks/use-toast';

interface PDFGeneratorButtonProps {
  template: 'quote' | 'invoice' | 'receipt' | 'project-report';
  data: any;
  options?: {
    paperFormat?: 'a4' | 'a3' | 'letter' | 'legal' | 'tabloid';
    paperOrientation?: 'portrait' | 'landscape';
    paperBorder?: string;
    watermark?: string;
  };
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  children?: React.ReactNode;
  className?: string;
}

export const PDFGeneratorButton: React.FC<PDFGeneratorButtonProps> = ({
  template,
  data,
  options = {},
  variant = 'outline',
  size = 'default',
  children,
  className
}) => {
  const { isGenerating, error, generatePDFWithEdgeFunction, clearError } = usePDFGenerator();
  const { toast } = useToast();

  const handleGeneratePDF = async () => {
    try {
      clearError();
      
      const result = await generatePDFWithEdgeFunction({
        template,
        data,
        options
      });

      if (result.success) {
        toast({
          title: "PDF gegenereerd! ✓",
          description: `PDF is succesvol gegenereerd en geopend voor afdrukken.`,
        });
      } else {
        toast({
          title: "Fout bij PDF generatie",
          description: result.error || "Er is een onbekende fout opgetreden.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error('PDF generation error:', err);
      toast({
        title: "Fout bij PDF generatie",
        description: err.message || "Er is een onbekende fout opgetreden.",
        variant: "destructive",
      });
    }
  };

  const getButtonText = () => {
    if (children) return children;
    
    switch (template) {
      case 'quote': return 'Offerte PDF';
      case 'invoice': return 'Factuur PDF';
      case 'receipt': return 'Bonnetje PDF';
      case 'project-report': return 'Rapport PDF';
      default: return 'PDF Genereren';
    }
  };

  const getButtonIcon = () => {
    if (isGenerating) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }
    
    return <FileText className="h-4 w-4" />;
  };

  return (
    <Button
      onClick={handleGeneratePDF}
      disabled={isGenerating}
      variant={variant}
      size={size}
      className={className}
    >
      {getButtonIcon()}
      {size !== 'icon' && (
        <span className="ml-2">
          {getButtonText()}
        </span>
      )}
    </Button>
  );
};

/**
 * Quick PDF Generator Buttons for common use cases
 */
export const QuotePDFButton: React.FC<Omit<PDFGeneratorButtonProps, 'template'>> = (props) => (
  <PDFGeneratorButton {...props} template="quote" />
);

export const InvoicePDFButton: React.FC<Omit<PDFGeneratorButtonProps, 'template'>> = (props) => (
  <PDFGeneratorButton {...props} template="invoice" />
);

export const ReceiptPDFButton: React.FC<Omit<PDFGeneratorButtonProps, 'template'>> = (props) => (
  <PDFGeneratorButton {...props} template="receipt" />
);

export const ProjectReportPDFButton: React.FC<Omit<PDFGeneratorButtonProps, 'template'>> = (props) => (
  <PDFGeneratorButton {...props} template="project-report" />
);

