import React from 'react';
import { SlidePanel } from '@/components/ui/slide-panel';
import { MultiBlockInvoicePreview } from './MultiBlockInvoicePreview';

interface InvoicePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: any | null;
}

export const InvoicePreviewDialog: React.FC<InvoicePreviewDialogProps> = ({
  open,
  onOpenChange,
  invoice
}) => {
  return (
    <SlidePanel
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title={`Factuur Preview - ${invoice?.invoice_number || ''}`}
      size="xl"
    >
      {invoice && (
        <div className="h-full overflow-y-auto">
          <MultiBlockInvoicePreview invoice={invoice} />
        </div>
      )}
    </SlidePanel>
  );
};

