import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, CreditCard, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SendInvoiceDialogProps {
  invoice: any;
  onSend: (emailData: { to: string; subject: string; message: string; includePaymentLink?: boolean }) => Promise<void>;
}

export function SendInvoiceDialog({ invoice, onSend }: SendInvoiceDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    to: invoice.customer_email || '',
    subject: `Factuur ${invoice.invoice_number} - ${invoice.customer_name}`,
    message: `Beste ${invoice.customer_name},

Hierbij ontvangt u factuur ${invoice.invoice_number} voor het project "${invoice.project_title || 'Project'}".

Factuurbedrag: €${invoice.total_amount?.toFixed(2)}
Vervaldatum: ${new Date(invoice.due_date).toLocaleDateString('nl-NL')}

U kunt deze factuur eenvoudig online betalen met de knop in deze email.

Met vriendelijke groet,
SMANS BV`
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice) return;

    setIsLoading(true);
    try {
      await onSend({
        ...formData,
        includePaymentLink: true // Always include payment link
      });
    } finally {
      setIsLoading(false);
    }
  };


  const getPaymentStatusBadge = () => {
    if (!invoice.payment_status || invoice.payment_status === 'pending') {
      return <Badge variant="outline" className="flex items-center gap-1"><Clock className="h-3 w-3" />Nog niet betaald</Badge>;
    }
    if (invoice.payment_status === 'paid') {
      return <Badge variant="default" className="bg-green-600 flex items-center gap-1"><CheckCircle className="h-3 w-3" />Betaald</Badge>;
    }
    if (invoice.payment_status === 'failed') {
      return <Badge variant="destructive" className="flex items-center gap-1"><AlertCircle className="h-3 w-3" />Betaling mislukt</Badge>;
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Factuur verzenden via email
            </div>
            {getPaymentStatusBadge()}
          </CardTitle>
          <CardDescription>
            Verzend factuur {invoice.invoice_number} naar de klant
            {invoice.payment_date && (
              <span className="block text-green-600 mt-1">
                Betaald op {new Date(invoice.payment_date).toLocaleDateString('nl-NL')}
              </span>
            )}
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

            <div className="bg-muted/50 border border-border rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Online betaling</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Een betaallink wordt automatisch gegenereerd en toegevoegd aan de email zodat de klant direct online kan betalen.
              </p>
            </div>

            <Button 
              type="submit" 
              disabled={isLoading || !formData.to}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isLoading ? 'Verzenden...' : 'Factuur verzenden'}
            </Button>
          </form>
        </CardContent>
      </Card>

    </div>
  );
}