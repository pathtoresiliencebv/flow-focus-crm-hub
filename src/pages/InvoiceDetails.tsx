import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { InvoiceDetails as InvoiceDetailsComponent } from '@/components/InvoiceDetails';
import { useInvoices } from '@/hooks/useInvoices';

export function InvoiceDetailsPage() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  const { invoices, fetchInvoiceItems } = useInvoices();
  const [invoiceItems, setInvoiceItems] = useState<any[]>([]);

  const invoice = invoices.find(inv => inv.id === invoiceId);

  useEffect(() => {
    if (invoiceId) {
      fetchInvoiceItems(invoiceId).then(setInvoiceItems);
    }
  }, [invoiceId, fetchInvoiceItems]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleSend = (id: number) => {
    navigate(`/invoices/${invoiceId}/send`);
  };

  if (!invoice) {
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
            <h1 className="text-2xl font-bold">Factuur niet gevonden</h1>
          </div>
        </div>
      </div>
    );
  }

  // Convert database invoice to InvoiceDetails expected format
  const invoiceDetail = {
    id: parseInt(invoice.id.slice(-8), 16),
    number: invoice.invoice_number,
    customer: invoice.customer_name,
    project: invoice.project_title || 'Geen project',
    date: new Date(invoice.invoice_date).toLocaleDateString('nl-NL'),
    dueDate: new Date(invoice.due_date).toLocaleDateString('nl-NL'),
    status: invoice.status === 'concept' ? 'Concept' : 
            invoice.status === 'verzonden' ? 'Verzonden' :
            invoice.status === 'betaald' ? 'Betaald' : 'Verlopen',
    amount: invoice.total_amount.toFixed(2)
  };

  // Convert invoice items to expected format
  const convertedInvoiceItems = invoiceItems.map((item, index) => ({
    id: index + 1,
    invoiceId: 1,
    description: item.description,
    quantity: item.quantity || 1,
    price: (item.unit_price || 0).toFixed(2),
    vatRate: item.vat_rate,
    total: (item.total || 0).toFixed(2)
  }));

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
          <h1 className="text-2xl font-bold">Factuur Details - {invoice.invoice_number}</h1>
        </div>
        
        <div className="bg-card rounded-lg shadow-sm border p-6">
          <InvoiceDetailsComponent
            invoice={invoiceDetail}
            items={convertedInvoiceItems}
            onSend={handleSend}
            onClose={handleBack}
          />
        </div>
      </div>
    </div>
  );
}