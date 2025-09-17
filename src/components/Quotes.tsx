
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCrmStore } from "@/hooks/useCrmStore";
import { useQuotes } from "@/hooks/useQuotes";
import { useToast } from '@/hooks/use-toast';
import { QuotesHeader } from './quotes/QuotesHeader';
import { QuotesSearch } from './quotes/QuotesSearch';
import { QuotesTable } from './quotes/QuotesTable';
import { Quote } from '@/types/quote';
import { convertQuoteToInvoice } from '@/services/quoteToInvoiceService';
import { supabase } from "@/integrations/supabase/client";
import { MultiBlockQuoteForm } from './quotes/MultiBlockQuoteForm';

export function Quotes() {
  const navigate = useNavigate();
  const { customers, projects } = useCrmStore();
  const { quotes, loading, fetchQuotes, deleteQuote, restoreQuote, permanentDeleteQuote, duplicateQuote } = useQuotes();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [converting, setConverting] = useState(false);
  const [activeTab, setActiveTab] = useState("active");
  const [showNewQuoteForm, setShowNewQuoteForm] = useState(window.location.pathname === "/quotes/new");

  const activeQuotes = quotes.filter(quote => !quote.is_archived);
  const archivedQuotes = quotes.filter(quote => quote.is_archived);

  const filteredActiveQuotes = activeQuotes.filter(quote =>
    quote.quote_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quote.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (quote.project_title && quote.project_title.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredArchivedQuotes = archivedQuotes.filter(quote =>
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

  const handleCloseNewQuote = () => {
    setShowNewQuoteForm(false);
    navigate('/');
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

  if (showNewQuoteForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Nieuwe offerte aanmaken</h1>
        </div>
        <MultiBlockQuoteForm onClose={handleCloseNewQuote} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <QuotesHeader
        onQuoteCreated={() => fetchQuotes(true)}
      />

      <Card>
        <CardHeader>
          <QuotesSearch
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="active">
                Actieve Offertes ({activeQuotes.length})
              </TabsTrigger>
              <TabsTrigger value="archived">
                Verwijderde Offertes ({archivedQuotes.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="active" className="mt-4">
              <QuotesTable
                quotes={filteredActiveQuotes}
                onPreview={handlePreview}
                onViewPublic={handleViewPublic}
                onDelete={deleteQuote}
                onApprove={handleApproveQuote}
                onSendEmail={handleSendEmail}
                onDuplicate={duplicateQuote}
              />
            </TabsContent>
            
            <TabsContent value="archived" className="mt-4">
              <QuotesTable
                quotes={filteredArchivedQuotes}
                onPreview={handlePreview}
                onViewPublic={handleViewPublic}
                onDelete={permanentDeleteQuote}
                onRestore={restoreQuote}
                isArchived={true}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
