import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Mail, Send, CreditCard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SendInvoiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: any | null;
  onSent?: () => void;
}

export const SendInvoiceDialog: React.FC<SendInvoiceDialogProps> = ({
  isOpen,
  onClose,
  invoice,
  onSent
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    recipientEmail: '',
    recipientName: '',
    subject: '',
    message: ''
  });

  React.useEffect(() => {
    const loadCustomerEmail = async () => {
      if (invoice && isOpen) {
        console.log('📧 SendInvoiceDialog: Loading customer data for invoice:', {
          invoice_id: invoice.id,
          customer_email: invoice.customer_email,
          customer_id: invoice.customer_id
        });
        
        let customerEmail = invoice.customer_email || '';
        let customerName = invoice.customer_name || '';
        
        // Als er geen email is maar wel een customer_id, haal dan de email op
        if (!customerEmail && invoice.customer_id) {
          console.log('📧 SendInvoiceDialog: No email in invoice, fetching from customer_id:', invoice.customer_id);
          try {
            const { data: customer, error } = await supabase
              .from('customers')
              .select('email, name')
              .eq('id', invoice.customer_id)
              .single();
            
            if (error) {
              console.error('❌ Error fetching customer:', error);
            } else if (customer) {
              console.log('✅ Fetched customer email:', customer.email);
              customerEmail = customer.email || '';
              if (!customerName) customerName = customer.name || '';
            }
          } catch (err) {
            console.error('❌ Exception fetching customer:', err);
          }
        }
        
        console.log('📧 SendInvoiceDialog: Setting form data with email:', customerEmail);
        
        setFormData({
          recipientEmail: customerEmail,
          recipientName: customerName,
          subject: `Factuur ${invoice.invoice_number} - SMANS BV`,
          message: `Beste ${customerName || 'klant'},

Hierbij ontvangt u onze factuur voor het project "${invoice.project_title || 'uw project'}".

Factuurbedrag: €${invoice.total_amount?.toFixed(2)}
Vervaldatum: ${new Date(invoice.due_date).toLocaleDateString('nl-NL')}

U kunt deze factuur eenvoudig online betalen via de betaalknop in deze email.

Voor vragen kunt u altijd contact met ons opnemen.

Met vriendelijke groet,
SMANS BV`
        });
      }
    };
    
    loadCustomerEmail();
  }, [invoice, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice) return;

    // Validate invoice ID is a proper UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(invoice.id)) {
      toast({
        title: "Factuur niet opgeslagen",
        description: "Deze factuur moet eerst worden opgeslagen voordat deze kan worden verstuurd.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log('📧 SENDING EMAIL for invoice:', invoice.id);
      console.log('📧 EMAIL DATA:', {
        invoiceId: invoice.id,
        recipientEmail: formData.recipientEmail,
        recipientName: formData.recipientName
      });
      
      const { data, error } = await supabase.functions.invoke('send-invoice-email', {
        body: {
          invoiceId: invoice.id,
          recipientEmail: formData.recipientEmail,
          recipientName: formData.recipientName,
          subject: formData.subject,
          message: formData.message,
          includePaymentLink: true
        }
      });

      console.log('📧 RESPONSE from send-invoice-email:', { data, error });

      if (error) {
        console.error('❌ EMAIL ERROR:', error);
        toast({
          title: "Fout bij versturen",
          description: `Email kon niet worden verstuurd: ${error.message || 'Onbekende fout'}`,
          variant: "destructive",
        });
        return;
      }

      console.log('✅ EMAIL SENT SUCCESSFULLY');
      toast({
        title: "🎉 Factuur verstuurd!",
        description: `De factuur is succesvol per e-mail verstuurd naar ${formData.recipientEmail}`,
      });

      onSent?.();
      onClose();
    } catch (error: any) {
      console.error('Unexpected error sending invoice:', error);
      toast({
        title: "Fout bij versturen",
        description: `Er is een onverwachte fout opgetreden: ${error.message || 'Onbekende fout'}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!invoice) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Factuur versturen per email
          </DialogTitle>
          <DialogDescription>
            Verstuur factuur {invoice.invoice_number} naar de klant
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="recipientEmail">Email adres *</Label>
              <Input
                id="recipientEmail"
                type="email"
                value={formData.recipientEmail}
                onChange={(e) => handleInputChange('recipientEmail', e.target.value)}
                required
                placeholder="klant@example.com"
              />
            </div>
            <div>
              <Label htmlFor="recipientName">Naam *</Label>
              <Input
                id="recipientName"
                value={formData.recipientName}
                onChange={(e) => handleInputChange('recipientName', e.target.value)}
                required
                placeholder="Klantnaam"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="subject">Onderwerp *</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="message">Bericht</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              rows={8}
              placeholder="Persoonlijk bericht voor de klant..."
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Online betaling inbegrepen</span>
            </div>
            <p className="text-sm text-blue-700">
              Een Stripe betaallink wordt automatisch toegevoegd aan de email zodat de klant direct online kan betalen.
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Factuur details:</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Nummer:</strong> {invoice.invoice_number}</p>
              <p><strong>Project:</strong> {invoice.project_title || 'Niet gespecificeerd'}</p>
              <p><strong>Bedrag:</strong> €{invoice.total_amount?.toFixed(2)}</p>
              <p><strong>Vervaldatum:</strong> {new Date(invoice.due_date).toLocaleDateString('nl-NL')}</p>
              {invoice.payment_status === 'paid' && invoice.payment_date && (
                <p className="text-green-600"><strong>Status:</strong> ✅ Betaald op {new Date(invoice.payment_date).toLocaleDateString('nl-NL')}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuleren
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !formData.recipientEmail || !formData.recipientName}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Send className="h-4 w-4 mr-2" />
              {isLoading ? 'Bezig met versturen...' : 'Verstuur Factuur'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
