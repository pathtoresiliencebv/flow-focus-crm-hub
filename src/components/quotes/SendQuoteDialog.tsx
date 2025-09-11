import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Mail, Send } from 'lucide-react';
import { Quote } from '@/types/quote';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SendQuoteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  quote: Quote | null;
  onSent?: () => void;
}

export const SendQuoteDialog: React.FC<SendQuoteDialogProps> = ({
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
    if (quote && isOpen) {
      setFormData({
        recipientEmail: quote.customer_email || '',
        recipientName: quote.customer_name || '',
        subject: `Offerte ${quote.quote_number} - SMANS BV`,
        message: `Beste ${quote.customer_name || 'klant'},

Hierbij ontvangt u onze offerte voor het project "${quote.project_title || 'uw project'}".

U kunt de offerte bekijken en digitaal goedkeuren via de link in deze email. De offerte is geldig tot ${new Date(quote.valid_until).toLocaleDateString('nl-NL')}.

Voor vragen kunt u altijd contact met ons opnemen.

Met vriendelijke groet,
SMANS BV`
      });
    }
  }, [quote, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quote) return;

    setIsLoading(true);
    try {
      const response = await supabase.functions.invoke('send-quote-email', {
        body: {
          quoteId: quote.id,
          recipientEmail: formData.recipientEmail,
          recipientName: formData.recipientName,
          subject: formData.subject,
          message: formData.message
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Fout bij verzenden van offerte');
      }

      toast({
        title: "Offerte verstuurd!",
        description: `De offerte is succesvol verstuurd naar ${formData.recipientEmail}`,
      });

      onSent?.();
      onClose();
    } catch (error) {
      console.error('Error sending quote:', error);
      toast({
        title: "Fout bij versturen",
        description: "Er ging iets mis bij het versturen van de offerte.",
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Offerte versturen per email
          </DialogTitle>
          <DialogDescription>
            Verstuur offerte {quote.quote_number} naar de klant
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

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Offerte details:</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Nummer:</strong> {quote.quote_number}</p>
              <p><strong>Project:</strong> {quote.project_title || 'Niet gespecificeerd'}</p>
              <p><strong>Bedrag:</strong> €{quote.total_amount.toFixed(2)}</p>
              <p><strong>Geldig tot:</strong> {new Date(quote.valid_until).toLocaleDateString('nl-NL')}</p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuleren
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !formData.recipientEmail || !formData.recipientName}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Send className="h-4 w-4 mr-2" />
              {isLoading ? 'Bezig met versturen...' : 'Verstuur Offerte'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};