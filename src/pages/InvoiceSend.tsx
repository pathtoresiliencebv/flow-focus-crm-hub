import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { SendInvoiceDialog } from '@/components/invoicing/SendInvoiceDialog';
import { useInvoices } from '@/hooks/useInvoices';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export function InvoiceSend() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  const { invoices } = useInvoices();
  const { toast } = useToast();

  const invoice = invoices.find(inv => inv.id === invoiceId);

  const handleBack = () => {
    navigate(-1);
  };

  const handleSend = async (emailData: { to: string; subject: string; message: string; includePaymentLink?: boolean }) => {
    if (!invoice) return;
    
    try {
      console.log('Sending invoice email for invoice:', invoice.id);
      
      const { data, error } = await supabase.functions.invoke('send-invoice-email', {
        body: {
          invoiceId: invoice.id,
          recipientEmail: emailData.to,
          recipientName: invoice.customer_name,
          subject: emailData.subject,
          message: emailData.message,
          includePaymentLink: emailData.includePaymentLink ?? true
        }
      });

      console.log('Response from send-invoice-email:', { data, error });

      if (error) {
        console.error('Error sending invoice:', error);
        toast({
          title: "Fout bij verzenden",
          description: `Er is een fout opgetreden: ${error.message || 'Onbekende fout'}`,
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Factuur verzonden",
        description: `Factuur ${invoice.invoice_number} is succesvol per e-mail verzonden naar ${emailData.to}.`,
      });

      navigate(-1);
    } catch (error: any) {
      console.error('Unexpected error sending invoice:', error);
      toast({
        title: "Fout bij verzenden",
        description: `Er is een onverwachte fout opgetreden: ${error.message || 'Onbekende fout'}`,
        variant: "destructive",
      });
    }
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
          <h1 className="text-2xl font-bold">Factuur verzenden - {invoice.invoice_number}</h1>
        </div>
        
        <div className="bg-card rounded-lg shadow-sm border p-6">
          <SendInvoiceDialog 
            invoice={invoice}
            onSend={handleSend}
          />
        </div>
      </div>
    </div>
  );
}