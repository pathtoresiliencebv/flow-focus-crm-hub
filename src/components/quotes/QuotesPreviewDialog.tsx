
import React from 'react';
import { SlidePanel } from '@/components/ui/slide-panel';
import { MultiBlockQuotePreview } from './MultiBlockQuotePreview';
import { Quote } from '@/types/quote';

interface QuotesPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote: Quote | null;
}

export const QuotesPreviewDialog: React.FC<QuotesPreviewDialogProps> = ({
  open,
  onOpenChange,
  quote
}) => {
  return (
    <SlidePanel
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title={`Offerte Preview - ${quote?.quote_number || ''}`}
      size="xl"
    >
      {quote && (
        <div className="h-full overflow-y-auto">
          <MultiBlockQuotePreview quote={quote} />
        </div>
      )}
    </SlidePanel>
  );
};
