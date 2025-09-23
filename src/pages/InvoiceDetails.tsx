import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useInvoices, Invoice } from '@/hooks/useInvoices';
import { InvoiceDetailView } from '@/components/invoicing/InvoiceDetailView';
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';

export function InvoiceDetailsPage() {
  const { invoiceId, id } = useParams<{ invoiceId?: string; id?: string }>();
  const navigate = useNavigate();
  const { fetchInvoiceById, fetchInvoiceItems, updateInvoiceStatus } = useInvoices();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [invoiceItems, setInvoiceItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use either invoiceId or id parameter
  const currentInvoiceId = invoiceId || id;

  useEffect(() => {
    if (currentInvoiceId) {
      setLoading(true);
      setError(null);
      
      Promise.all([
        fetchInvoiceById(currentInvoiceId),
        fetchInvoiceItems(currentInvoiceId)
      ])
      .then(([invoiceData, itemsData]) => {
        if (invoiceData) {
          setInvoice(invoiceData);
          setInvoiceItems(itemsData);
        } else {
          setError('Factuur niet gevonden');
        }
      })
      .catch((err) => {
        console.error('Error fetching invoice:', err);
        setError('Er is een fout opgetreden bij het laden van de factuur');
      })
      .finally(() => {
        setLoading(false);
      });
    }
  }, [currentInvoiceId, fetchInvoiceById, fetchInvoiceItems]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleMarkAsPaid = async (invoiceId: string) => {
    await updateInvoiceStatus(invoiceId, 'betaald');
    // Refresh the invoice data
    if (currentInvoiceId) {
      const updatedInvoice = await fetchInvoiceById(currentInvoiceId);
      setInvoice(updatedInvoice);
    }
  };

  const handleDownloadPdf = async (invoiceId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-invoice-pdf', {
        body: { invoiceId }
      });

      if (error) throw error;

      // Create blob and download
      const blob = new Blob([data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoice?.invoice_number || 'invoice'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
    }
  };

  if (loading) {
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
            <Skeleton className="h-8 w-64" />
          </div>
          <div className="bg-card rounded-lg shadow-sm border p-6">
            <div className="space-y-4">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <div className="space-y-2 mt-8">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
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
            <h1 className="text-2xl font-bold">{error || 'Factuur niet gevonden'}</h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <InvoiceDetailView
        invoice={invoice}
        invoiceItems={invoiceItems}
        onBack={handleBack}
        onMarkAsPaid={handleMarkAsPaid}
        onDownloadPdf={handleDownloadPdf}
      />
    </div>
  );
}