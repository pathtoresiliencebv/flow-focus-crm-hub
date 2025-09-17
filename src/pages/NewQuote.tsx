import React, { Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { MultiBlockQuoteForm } from '@/components/quotes/MultiBlockQuoteForm';

const QuoteFormSkeleton = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
    <Skeleton className="h-32 w-full" />
    <Skeleton className="h-64 w-full" />
  </div>
);

export function NewQuote() {
  const navigate = useNavigate();

  const handleClose = () => {
    navigate('/quotes'); // Always go back to quotes list
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
        
        <div className="bg-card rounded-lg shadow-sm border p-6">
          <Suspense fallback={<QuoteFormSkeleton />}>
            <MultiBlockQuoteForm onClose={handleClose} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}