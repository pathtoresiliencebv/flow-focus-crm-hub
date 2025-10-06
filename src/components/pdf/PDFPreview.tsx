/**
 * PDF Preview Component
 * Shows a preview of the generated PDF content
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileText, Eye, Download, X } from 'lucide-react';
import { usePDFGenerator } from '@/hooks/usePDFGenerator';

interface PDFPreviewProps {
  template: 'quote' | 'invoice' | 'receipt' | 'project-report';
  data: any;
  options?: {
    paperFormat?: 'a4' | 'a3' | 'letter' | 'legal' | 'tabloid';
    paperOrientation?: 'portrait' | 'landscape';
    paperBorder?: string;
    watermark?: string;
  };
  trigger?: React.ReactNode;
  title?: string;
}

export const PDFPreview: React.FC<PDFPreviewProps> = ({
  template,
  data,
  options = {},
  trigger,
  title = 'PDF Preview'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { generatePDFWithEdgeFunction } = usePDFGenerator();

  const handlePreview = async () => {
    setIsLoading(true);
    try {
      const result = await generatePDFWithEdgeFunction({
        template,
        data,
        options
      });

      if (result.success && result.html) {
        setPreviewContent(result.html);
        setIsOpen(true);
      }
    } catch (error) {
      console.error('Preview generation failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      await generatePDFWithEdgeFunction({
        template,
        data,
        options
      });
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <Eye className="h-4 w-4 mr-2" />
      Preview PDF
    </Button>
  );

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          {trigger || defaultTrigger}
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {title}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                onClick={handlePreview}
                disabled={isLoading}
                variant="outline"
                size="sm"
              >
                {isLoading ? 'Loading...' : 'Generate Preview'}
              </Button>
              
              <Button
                onClick={handleDownload}
                variant="default"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>

            {previewContent && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">PDF Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div 
                    className="border rounded-lg p-4 bg-white"
                    dangerouslySetInnerHTML={{ __html: previewContent }}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

/**
 * Quick PDF Preview components for common use cases
 */
export const QuotePDFPreview: React.FC<Omit<PDFPreviewProps, 'template'>> = (props) => (
  <PDFPreview {...props} template="quote" title="Quote PDF Preview" />
);

export const InvoicePDFPreview: React.FC<Omit<PDFPreviewProps, 'template'>> = (props) => (
  <PDFPreview {...props} template="invoice" title="Invoice PDF Preview" />
);

export const ReceiptPDFPreview: React.FC<Omit<PDFPreviewProps, 'template'>> = (props) => (
  <PDFPreview {...props} template="receipt" title="Receipt PDF Preview" />
);

export const ProjectReportPDFPreview: React.FC<Omit<PDFPreviewProps, 'template'>> = (props) => (
  <PDFPreview {...props} template="project-report" title="Project Report PDF Preview" />
);

