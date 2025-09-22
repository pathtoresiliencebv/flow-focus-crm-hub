import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SendInvoiceDialogProps {
  invoice: any;
  onSend: (emailData: { to: string; subject: string; message: string }) => Promise<void>;
}

export function SendInvoiceDialog({ invoice, onSend }: SendInvoiceDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPaymentLink, setShowPaymentLink] = useState(false);
  const [paymentLink, setPaymentLink] = useState('');
  
  const [formData, setFormData] = useState({
    to: invoice.customer_email || '',
    subject: `Factuur ${invoice.invoice_number} - ${invoice.customer_name}`,
    message: `Beste ${invoice.customer_name},

Hierbij ontvangt u factuur ${invoice.invoice_number} voor het project "${invoice.project_title || 'Project'}".

Factuurbedrag: €${invoice.total_amount?.toFixed(2)}
Vervaldatum: ${new Date(invoice.due_date).toLocaleDateString('nl-NL')}

U kunt deze factuur online betalen via de betaallink in deze email.

Met vriendelijke groet,
Uw bedrijf`
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice) return;

    setIsLoading(true);
    try {
      await onSend(formData);
    } finally {
      setIsLoading(false);
    }
  };

  const generatePaymentLink = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.functions.invoke('create-invoice-payment', {
        body: { invoice_id: invoice.id }
      });

      if (error) throw error;

      setPaymentLink(data.url);
      setShowPaymentLink(true);
      
      // Add payment link to message
      setFormData(prev => ({
        ...prev,
        message: prev.message + `\n\nBetaal deze factuur online: ${data.url}`
      }));

    } catch (error) {
      console.error('Error creating payment link:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Factuur verzenden via email
          </CardTitle>
          <CardDescription>
            Verzend factuur {invoice.invoice_number} naar de klant
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="to">Naar</Label>
              <Input
                id="to"
                type="email"
                value={formData.to}
                onChange={(e) => setFormData(prev => ({ ...prev, to: e.target.value }))}
                placeholder="klant@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Onderwerp</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Bericht</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                rows={10}
                className="resize-none"
              />
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={generatePaymentLink}
                disabled={isLoading || showPaymentLink}
                className="flex items-center gap-2"
              >
                <CreditCard className="h-4 w-4" />
                {showPaymentLink ? 'Betaallink toegevoegd' : 'Betaallink genereren'}
              </Button>
              
              <Button 
                type="submit" 
                disabled={isLoading || !formData.to}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isLoading ? 'Verzenden...' : 'Factuur verzenden'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {showPaymentLink && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-green-600" />
              Betaallink gegenereerd
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-3 rounded-md">
              <Label className="text-sm font-medium">Betaallink:</Label>
              <p className="text-sm font-mono mt-1 break-all">{paymentLink}</p>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Deze link is automatisch toegevoegd aan het email bericht.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}