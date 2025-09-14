import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { MultiBlockQuotePreview } from '@/components/quotes/MultiBlockQuotePreview';
import { useQuotes } from '@/hooks/useQuotes';

export function QuotePreview() {
  const { quoteId } = useParams<{ quoteId: string }>();
  const navigate = useNavigate();
  const { quotes } = useQuotes();

  const quote = quotes.find(q => q.id === quoteId);

  const handleBack = () => {
    navigate(-1);
  };

  if (!quote) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Terug
            </Button>
            <h1 className="text-2xl font-bold">Offerte niet gevonden</h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Terug
          </Button>
          <h1 className="text-2xl font-bold">Offerte Preview - {quote.quote_number}</h1>
        </div>
        
        <div className="bg-card rounded-lg shadow-sm border p-6">
          <MultiBlockQuotePreview quote={quote} />
        </div>
      </div>
    </div>
  );
}