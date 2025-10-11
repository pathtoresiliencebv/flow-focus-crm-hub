
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useCrmStore } from "@/hooks/useCrmStore";
import { useQuotes } from "@/hooks/useQuotes";
import { useToast } from '@/hooks/use-toast';
import { IconBox } from '@/components/ui/icon-box';
import { FileText, Archive } from 'lucide-react';
import { QuotesTable } from './quotes/QuotesTable';
import { MultiBlockQuoteForm } from './quotes/MultiBlockQuoteForm';
import { QuotesPreviewDialog } from './quotes/QuotesPreviewDialog';
import { SendQuoteSheet } from './quotes/SendQuoteSheet';
import { ApproveQuoteDialog } from './quotes/ApproveQuoteDialog';
import { Quote } from '@/types/quote';
import { convertQuoteToInvoice } from '@/services/quoteToInvoiceService';
import { supabase } from "@/integrations/supabase/client";

export function Quotes() {
  const navigate = useNavigate();
  const location = useLocation();
  const { customers, projects, isLoading: crmLoading } = useCrmStore();
  const { quotes, loading: quotesLoading, fetchQuotes, deleteQuote, restoreQuote, permanentDeleteQuote, duplicateQuote } = useQuotes();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [converting, setConverting] = useState(false);
  const [activeTab, setActiveTab] = useState("active");
  const [showNewQuoteForm, setShowNewQuoteForm] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  
  // Effect to detect route and show new quote form
  useEffect(() => {
    setShowNewQuoteForm(location.pathname === "/quotes/new");
  }, [location.pathname]);

  // Timeout fallback to prevent infinite loading
  useEffect(() => {
    if (quotesLoading || crmLoading) {
      const timer = setTimeout(() => {
        console.warn('⚠️ Loading timeout reached, forcing render');
        setLoadingTimeout(true);
      }, 5000); // 5 second timeout
      
      return () => clearTimeout(timer);
    } else {
      setLoadingTimeout(false);
    }
  }, [quotesLoading, crmLoading]);

  // Combined loading state with timeout fallback
  const loading = (quotesLoading || crmLoading) && !loadingTimeout;
  
  // Show loading state if data is being fetched (with timeout)
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Offertes laden...</p>
        </div>
      </div>
    );
  }

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
    setSelectedQuote(quote);
    setPreviewDialogOpen(true);
  };

  const handleViewPublic = (publicToken: string) => {
    // Use current domain instead of hardcoded production URL
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/quote/${publicToken}`;
    console.log('🔗 Opening public quote URL:', url);
    window.open(url, '_blank');
  };

  const handleSendEmail = (quote: Quote) => {
    setSelectedQuote(quote);
    setSendDialogOpen(true);
  };

  const handleApprove = (quote: Quote) => {
    setSelectedQuote(quote);
    setApproveDialogOpen(true);
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
      
      // Force refresh quotes including archived
      await fetchQuotes(true);
      
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
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Offertes laden...</p>
          <p className="text-sm text-muted-foreground mt-2">
            Debug: quotes={quotesLoading ? 'loading' : 'loaded'}, crm={crmLoading ? 'loading' : 'loaded'}
          </p>
        </div>
      </div>
    );
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
    <div className="container mx-auto p-6 space-y-6">
      {/* Icon Boxes Navigation */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <IconBox
          icon={<FileText className="h-6 w-6" />}
          label="Actieve Offertes"
          active={activeTab === "active"}
          onClick={() => setActiveTab("active")}
          count={activeQuotes.length}
        />
        <IconBox
          icon={<Archive className="h-6 w-6" />}
          label="Gearchiveerde Offertes"
          active={activeTab === "archived"}
          onClick={() => setActiveTab("archived")}
          count={archivedQuotes.length}
        />
      </div>
      
      {/* Content */}
      {activeTab === "active" && (
        <div className="mt-0">
          <QuotesTable
            quotes={filteredActiveQuotes}
            onPreview={handlePreview}
            onViewPublic={handleViewPublic}
            onDelete={deleteQuote}
            onApprove={handleApprove}
            onSendEmail={handleSendEmail}
            onDuplicate={duplicateQuote}
          />
        </div>
      )}
      
      {activeTab === "archived" && (
        <div className="mt-0">
          <QuotesTable
            quotes={filteredArchivedQuotes}
            onPreview={handlePreview}
            onViewPublic={handleViewPublic}
            onDelete={permanentDeleteQuote}
            onRestore={restoreQuote}
            isArchived={true}
          />
        </div>
      )}

      <QuotesPreviewDialog
        open={previewDialogOpen}
        onOpenChange={setPreviewDialogOpen}
        quote={selectedQuote}
      />

      <SendQuoteSheet
        isOpen={sendDialogOpen}
        onClose={() => setSendDialogOpen(false)}
        quote={selectedQuote}
        onSent={() => {
          fetchQuotes(true); // Force refresh including archived quotes
          setSendDialogOpen(false);
        }}
      />

      <ApproveQuoteDialog
        isOpen={approveDialogOpen}
        onClose={() => setApproveDialogOpen(false)}
        quote={selectedQuote}
        onApproved={() => {
          fetchQuotes(true); // Force refresh including archived quotes
          setApproveDialogOpen(false);
        }}
      />
    </div>
  );
}
