import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Trash2, Archive } from 'lucide-react';
import { Quote } from '@/types/quote';

interface ConfirmDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  quote: Quote | null;
  isArchiving?: boolean; // true = archiving, false = permanent delete
}

export const ConfirmDeleteDialog: React.FC<ConfirmDeleteDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  quote,
  isArchiving = false
}) => {
  if (!quote) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isArchiving ? (
              <>
                <Archive className="h-5 w-5 text-orange-600" />
                Offerte archiveren?
              </>
            ) : (
              <>
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Permanent verwijderen?
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isArchiving 
              ? "Deze offerte wordt verplaatst naar het archief en kan later worden hersteld."
              : "Deze actie kan niet ongedaan worden gemaakt. De offerte wordt definitief verwijderd."
            }
          </DialogDescription>
        </DialogHeader>

        <div className={`p-4 rounded-lg ${isArchiving ? 'bg-orange-50' : 'bg-red-50'}`}>
          <div className="text-sm space-y-1">
            <p><strong>Nummer:</strong> {quote.quote_number}</p>
            <p><strong>Klant:</strong> {quote.customer_name}</p>
            <p><strong>Bedrag:</strong> €{quote.total_amount.toFixed(2)}</p>
            {quote.status && (
              <p><strong>Status:</strong> {
                quote.status === 'concept' ? 'Concept' :
                quote.status === 'sent' ? 'Verzonden' :
                quote.status === 'approved' ? 'Goedgekeurd' :
                quote.status
              }</p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Annuleren
          </Button>
          <Button
            variant={isArchiving ? "default" : "destructive"}
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={isArchiving ? "bg-orange-600 hover:bg-orange-700" : ""}
          >
            {isArchiving ? (
              <>
                <Archive className="h-4 w-4 mr-2" />
                Archiveren
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Permanent verwijderen
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

