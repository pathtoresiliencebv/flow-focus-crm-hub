
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1200px] h-[90vh]">
        <DialogHeader>
          <DialogTitle>Offerte Preview - {quote?.quote_number}</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto">
          {quote && <MultiBlockQuotePreview quote={quote} />}
        </div>
      </DialogContent>
    </Dialog>
  );
};
