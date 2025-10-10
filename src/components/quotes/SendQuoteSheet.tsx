import React, { useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Mail, Send } from 'lucide-react';
import { Quote } from '@/types/quote';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SendQuoteSheetProps {
  isOpen: boolean;
  onClose: () => void;
  quote: Quote | null;
  onSent?: () => void;
}

export const SendQuoteSheet: React.FC<SendQuoteSheetProps> = ({
  isOpen,
  onClose,
  quote,
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
      if (quote && isOpen) {
        console.log('📧 SendQuoteSheet: Loading customer data for quote:', {
          quote_id: quote.id,
          customer_email: quote.customer_email,
          customer_id: (quote as any).customer_id
        });
        
        let customerEmail = quote.customer_email || '';
        let customerName = quote.customer_name || '';
        
        // Als er geen email is maar wel een customer_id, haal dan de email op
        if (!customerEmail && (quote as any).customer_id) {
          console.log('📧 SendQuoteSheet: No email in quote, fetching from customer_id:', (quote as any).customer_id);
          try {
            const { data: customer, error } = await supabase
              .from('customers')
              .select('email, name')
              .eq('id', (quote as any).customer_id)
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
        
        console.log('📧 SendQuoteSheet: Final email values:', {
          customerEmail,
          customerName,
          quote_customer_email: quote.customer_email,
          quote_customer_id: (quote as any).customer_id
        });

        if (!customerEmail) {
          console.warn('⚠️ No customer email found for quote:', quote.id);
          toast({
            title: "Geen email gevonden",
            description: "Voeg een email adres toe aan de klant om de offerte te kunnen versturen.",
            variant: "destructive"
          });
        }
        
        setFormData({
          recipientEmail: customerEmail,
          recipientName: customerName,
          subject: `Offerte ${quote.quote_number} - SMANS BV`,
          message: `Beste ${customerName || 'klant'},

Hierbij ontvangt u onze offerte voor het project "${quote.project_title || 'uw project'}".

U kunt de offerte bekijken en digitaal goedkeuren via de link in deze email. De offerte is geldig tot ${new Date(quote.valid_until).toLocaleDateString('nl-NL')}.

Voor vragen kunt u altijd contact met ons opnemen.

Met vriendelijke groet,
SMANS BV`
        });
      }
    };
    
    loadCustomerEmail();
  }, [quote, isOpen, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quote) return;

    // Validate quote ID is a proper UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(quote.id)) {
      toast({
        title: "Offerte niet opgeslagen",
        description: "Deze offerte moet eerst worden opgeslagen voordat deze kan worden verstuurd.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log('📧 SENDING EMAIL for quote:', quote.id);
      console.log('📧 EMAIL DATA:', {
        quoteId: quote.id,
        recipientEmail: formData.recipientEmail,
        recipientName: formData.recipientName
      });
      
      const { data, error } = await supabase.functions.invoke('send-quote-email', {
        body: {
          quoteId: quote.id,
          recipientEmail: formData.recipientEmail,
          recipientName: formData.recipientName,
          subject: formData.subject,
          message: formData.message
        }
      });

      console.log('📧 RESPONSE from send-quote-email:', { data, error });

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
        title: "🎉 Offerte verstuurd!",
        description: `De offerte is succesvol per e-mail verstuurd naar ${formData.recipientEmail}`,
      });

      onSent?.();
      onClose();
    } catch (error: any) {
      console.error('Unexpected error sending quote:', error);
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

  if (!quote) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Offerte versturen per email
          </SheetTitle>
          <SheetDescription>
            Verstuur offerte {quote.quote_number} naar de klant
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="recipientEmail">Email adres *</Label>
              <Input
                id="recipientEmail"
                type="email"
                value={formData.recipientEmail}
                onChange={(e) => handleInputChange('recipientEmail', e.target.value)}
                required
                placeholder="klant@example.com"
                className="mt-1.5"
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
                className="mt-1.5"
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
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="message">Bericht</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              rows={10}
              placeholder="Persoonlijk bericht voor de klant..."
              className="mt-1.5"
            />
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border">
            <h4 className="font-medium mb-3 text-sm">Offerte details:</h4>
            <div className="text-sm text-gray-600 space-y-2">
              <p><strong>Nummer:</strong> {quote.quote_number}</p>
              <p><strong>Project:</strong> {quote.project_title || 'Niet gespecificeerd'}</p>
              <p><strong>Bedrag:</strong> €{quote.total_amount.toFixed(2)}</p>
              <p><strong>Geldig tot:</strong> {new Date(quote.valid_until).toLocaleDateString('nl-NL')}</p>
            </div>
          </div>

          <div className="flex gap-2 pt-4 sticky bottom-0 bg-background pb-6">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Annuleren
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !formData.recipientEmail || !formData.recipientName}
              className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
            >
              <Send className="h-4 w-4 mr-2" />
              {isLoading ? 'Bezig...' : 'Verstuur'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};

