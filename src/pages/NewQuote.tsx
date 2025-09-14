import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { MultiBlockQuoteForm } from '@/components/quotes/MultiBlockQuoteForm';

export function NewQuote() {
  const navigate = useNavigate();

  const handleClose = () => {
    navigate(-1); // Go back to previous page
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Terug
          </Button>
          <h1 className="text-2xl font-bold">Nieuwe offerte aanmaken</h1>
        </div>
        
        <MultiBlockQuoteForm onClose={handleClose} />
      </div>
    </div>
  );
}