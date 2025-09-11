import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Mail, AlertCircle } from 'lucide-react';
import { Quote } from '@/types/quote';

interface ConfirmSendDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  quote: Quote | null;
}

export const ConfirmSendDialog: React.FC<ConfirmSendDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  quote
}) => {
  if (!quote) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Offerte versturen?
          </DialogTitle>
          <DialogDescription>
            Weet je zeker dat je deze offerte wilt versturen?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-900">Te versturen offerte:</span>
            </div>
            <div className="text-sm text-blue-800 space-y-1">
              <p><strong>Nummer:</strong> {quote.quote_number}</p>
              <p><strong>Klant:</strong> {quote.customer_name}</p>
              <p><strong>Email:</strong> {quote.customer_email || 'Geen email beschikbaar'}</p>
              <p><strong>Bedrag:</strong> €{quote.total_amount.toFixed(2)}</p>
            </div>
          </div>

          {!quote.customer_email && (
            <div className="bg-yellow-50 p-3 rounded-lg">
              <p className="text-yellow-800 text-sm">
                <strong>Let op:</strong> Er is geen email adres beschikbaar voor deze klant. 
                Je kunt handmatig een email adres toevoegen in de volgende stap.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Annuleren
          </Button>
          <Button onClick={onConfirm} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Mail className="h-4 w-4 mr-2" />
            Verstuur Offerte
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};