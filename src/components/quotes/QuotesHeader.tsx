
import React from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { MultiBlockQuoteForm } from './MultiBlockQuoteForm';

interface QuotesHeaderProps {
  showNewQuote: boolean;
  setShowNewQuote: (show: boolean) => void;
  onQuoteCreated: () => void;
  customers: Array<{ id: string; name: string; email?: string }>;
  projects: Array<{ id: string; title: string; value: string; customer: string }>;
}

export const QuotesHeader: React.FC<QuotesHeaderProps> = ({
  showNewQuote,
  setShowNewQuote,
  onQuoteCreated,
  customers,
  projects
}) => {
  return (
    <div className="flex justify-between items-center">
      <h2 className="text-2xl font-bold">Offertes</h2>
      <Dialog open={showNewQuote} onOpenChange={setShowNewQuote}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nieuwe Offerte
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[1400px] h-[90vh]">
          <DialogHeader>
            <DialogTitle>Nieuwe offerte aanmaken</DialogTitle>
          </DialogHeader>
          <MultiBlockQuoteForm 
            onClose={() => {
              setShowNewQuote(false);
              onQuoteCreated();
            }}
            customers={customers}
            projects={projects}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};
