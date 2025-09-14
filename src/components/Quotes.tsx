
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useCrmStore } from "@/hooks/useCrmStore";
import { useQuotes } from "@/hooks/useQuotes";
import { useToast } from '@/hooks/use-toast';
import { QuotesHeader } from './quotes/QuotesHeader';
import { QuotesSearch } from './quotes/QuotesSearch';
import { QuotesTable } from './quotes/QuotesTable';
import { Quote } from '@/types/quote';
import { convertQuoteToInvoice } from '@/services/quoteToInvoiceService';
import { supabase } from "@/integrations/supabase/client";

export function Quotes() {
  const navigate = useNavigate();
  const { customers, projects } = useCrmStore();
  const { quotes, loading, fetchQuotes, deleteQuote, duplicateQuote } = useQuotes();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [converting, setConverting] = useState(false);

  const filteredQuotes = quotes.filter(quote =>
    quote.quote_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quote.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (quote.project_title && quote.project_title.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handlePreview = (quote: Quote) => {
    navigate(`/quotes/${quote.id}/preview`);
  };

  const handleViewPublic = (publicToken: string) => {
    const url = `https://smanscrm.nl/quote/${publicToken}`;
    window.open(url, '_blank');
  };

  const handleSendEmail = (quote: Quote) => {
    navigate(`/quotes/${quote.id}/send`);
  };

  const handleApproveQuote = async (quote: Quote) => {
    if (converting) return;
    
    try {
      setConverting(true);
      console.log('Starting quote approval process for quote:', quote.id);
      
      // Update quote status to 'approved'
      const { error: updateError } = await supabase
        .from('quotes')
        .update({ status: 'approved' })
        .eq('id', quote.id);

      if (updateError) {
        console.error('Error updating quote status:', updateError);
        throw updateError;
      }

      console.log('Quote status updated to approved');

      // Convert to invoice
      const invoiceId = await convertQuoteToInvoice(quote);
      
      // Refresh quotes
      await fetchQuotes();
      
      toast({
        title: "Offerte goedgekeurd",
        description: `Offerte ${quote.quote_number} is goedgekeurd en omgezet naar een conceptfactuur.`,
      });

      console.log('Created invoice with ID:', invoiceId);
    } catch (error) {
      console.error('Error approving quote:', error);
      toast({
        title: "Fout bij goedkeuren",
        description: "Er is een fout opgetreden bij het goedkeuren van de offerte.",
        variant: "destructive",
      });
    } finally {
      setConverting(false);
    }
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
        onQuoteCreated={fetchQuotes}
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
          onApprove={handleApproveQuote}
          onSendEmail={handleSendEmail}
          onDuplicate={duplicateQuote}
        />
        </CardContent>
      </Card>
    </div>
  );
}
