
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface QuotesHeaderProps {
  onQuoteCreated: () => void;
}

export const QuotesHeader: React.FC<QuotesHeaderProps> = ({
  onQuoteCreated
}) => {
  const navigate = useNavigate();

  const handleNewQuote = () => {
    navigate('/quotes/new');
  };

  return (
    <div className="flex justify-between items-center">
      <h2 className="text-2xl font-bold">Offertes</h2>
      <Button onClick={handleNewQuote}>
        <Plus className="mr-2 h-4 w-4" />
        Nieuwe Offerte
      </Button>
    </div>
  );
};
