import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { MultiBlockInvoicePreview } from '@/components/invoicing/MultiBlockInvoicePreview';
import { useInvoices } from '@/hooks/useInvoices';

export function InvoiceDetailsPage() {
  const { invoiceId, id } = useParams<{ invoiceId?: string; id?: string }>();
  const navigate = useNavigate();
  const { invoices, fetchInvoiceItems } = useInvoices();
  const [invoiceItems, setInvoiceItems] = useState<any[]>([]);

  // Use either invoiceId or id parameter
  const currentInvoiceId = invoiceId || id;
  const invoice = invoices.find(inv => inv.id === currentInvoiceId);

  useEffect(() => {
    if (currentInvoiceId) {
      fetchInvoiceItems(currentInvoiceId).then(setInvoiceItems);
    }
  }, [currentInvoiceId, fetchInvoiceItems]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleSend = (id: number) => {
    navigate(`/invoices/${currentInvoiceId}/send`);
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

  // Convert to multi-block format for preview
  const convertedInvoice = {
    id: invoice.id,
    invoice_number: invoice.invoice_number,
    customer_name: invoice.customer_name,
    customer_email: invoice.customer_email,
    project_title: invoice.project_title,
    invoice_date: invoice.invoice_date,
    due_date: invoice.due_date,
    status: invoice.status,
    message: invoice.message,
    subtotal: invoice.subtotal,
    vat_amount: invoice.vat_amount,
    total_amount: invoice.total_amount,
    total_vat_amount: invoice.vat_amount,
    blocks: invoiceItems.length > 0 ? [{
      id: '1',
      title: 'Factuurregels',
      type: 'product' as const,
      subtotal: invoice.subtotal,
      vat_amount: invoice.vat_amount,
      items: invoiceItems.map((item, index) => ({
        id: (index + 1).toString(),
        type: (item.type || 'product') as 'product' | 'textblock',
        description: item.description || '',
        quantity: item.quantity || 1,
        unit_price: item.unit_price || 0,
        vat_rate: item.vat_rate || 21,
        total: item.total || 0,
        formatting: item.item_formatting
      }))
    }] : []
  };

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
          <MultiBlockInvoicePreview invoice={convertedInvoice} />
          <div className="mt-6 flex justify-between">
            <Button variant="outline" onClick={handleBack}>
              Terug
            </Button>
            <Button onClick={() => handleSend(1)}>
              Versturen
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}