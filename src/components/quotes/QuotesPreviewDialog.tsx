
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MultiBlockQuotePreview } from './MultiBlockQuotePreview';
import { QuoteActionsDebug } from './QuoteActionsDebug';
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
        
        {quote && (
          <Tabs defaultValue="preview" className="w-full h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="preview">📄 Voorvertoning</TabsTrigger>
              <TabsTrigger value="debug">🧪 Debug & Test</TabsTrigger>
            </TabsList>
            
            <TabsContent value="preview" className="flex-1 overflow-y-auto">
              <MultiBlockQuotePreview quote={quote} />
            </TabsContent>
            
            <TabsContent value="debug" className="flex-1 overflow-y-auto">
              <QuoteActionsDebug quote={quote} />
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};
