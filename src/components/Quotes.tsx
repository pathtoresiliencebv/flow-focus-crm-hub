
import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useCrmStore } from "@/hooks/useCrmStore";
import { useQuotes } from "@/hooks/useQuotes";
import { QuotesHeader } from './quotes/QuotesHeader';
import { QuotesSearch } from './quotes/QuotesSearch';
import { QuotesTable } from './quotes/QuotesTable';
import { QuotesPreviewDialog } from './quotes/QuotesPreviewDialog';
import { Quote } from '@/types/quote';

export function Quotes() {
  const { customers, projects } = useCrmStore();
  const { quotes, loading, fetchQuotes, deleteQuote } = useQuotes();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [showNewQuote, setShowNewQuote] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const filteredQuotes = quotes.filter(quote =>
    quote.quote_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quote.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (quote.project_title && quote.project_title.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handlePreview = (quote: Quote) => {
    setSelectedQuote(quote);
    setShowPreview(true);
  };

  const handleViewPublic = (publicToken: string) => {
    const url = `${window.location.origin}/quote/${publicToken}`;
    window.open(url, '_blank');
  };

  const formCustomers = customers.map(customer => ({
    id: customer.id,
    name: customer.name,
    email: customer.email || ''
  }));

  const formProjects = projects.map(project => ({
    id: project.id,
    title: project.title,
    value: project.value?.toString() || '0',
    customer: project.customer
  }));

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <QuotesHeader
        showNewQuote={showNewQuote}
        setShowNewQuote={setShowNewQuote}
        onQuoteCreated={fetchQuotes}
        customers={formCustomers}
        projects={formProjects}
      />

      <Card>
        <CardHeader>
          <QuotesSearch
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
        </CardHeader>
        <CardContent>
          <QuotesTable
            quotes={filteredQuotes}
            onPreview={handlePreview}
            onViewPublic={handleViewPublic}
            onDelete={deleteQuote}
          />
        </CardContent>
      </Card>

      <QuotesPreviewDialog
        open={showPreview}
        onOpenChange={setShowPreview}
        quote={selectedQuote}
      />
    </div>
  );
}
