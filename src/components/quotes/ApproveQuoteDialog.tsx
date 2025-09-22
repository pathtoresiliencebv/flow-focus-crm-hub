import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle } from 'lucide-react';
import { Quote } from '@/types/quote';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ApproveQuoteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  quote: Quote | null;
  onApproved?: () => void;
}

export const ApproveQuoteDialog: React.FC<ApproveQuoteDialogProps> = ({
  isOpen,
  onClose,
  quote,
  onApproved
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [approvalNote, setApprovalNote] = useState('');

  const handleApprove = async () => {
    if (!quote) return;

    setIsLoading(true);
    try {
      // Update quote status to approved
      const { error } = await supabase
        .from('quotes')
        .update({ 
          status: 'approved',
          updated_at: new Date().toISOString()
        })
        .eq('id', quote.id);

      if (error) {
        console.error('Error approving quote:', error);
        toast({
          title: "Fout bij goedkeuren",
          description: "Er is een fout opgetreden bij het goedkeuren van de offerte.",
          variant: "destructive",
        });
        return;
      }

      // Trigger automation workflow
      try {
        const { error: automationError } = await supabase.functions.invoke('quote-approval-automation', {
          body: { quote_id: quote.id }
        });

        if (automationError) {
          console.error('Automation error:', automationError);
        }
      } catch (automationError) {
        console.error('Automation invocation error:', automationError);
      }

      toast({
        title: "Offerte goedgekeurd!",
        description: "De offerte is goedgekeurd. Project en concept factuur zijn automatisch aangemaakt.",
      });

      onApproved?.();
      onClose();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Fout",
        description: "Er is een onverwachte fout opgetreden.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!quote) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Offerte goedkeuren
          </DialogTitle>
          <DialogDescription>
            Weet u zeker dat u offerte {quote.quote_number} wilt goedkeuren?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Wat gebeurt er bij goedkeuring:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Project wordt automatisch aangemaakt</li>
              <li>• Concept factuur wordt gegenereerd</li>
              <li>• Klant ontvangt bevestigingsmail</li>
              <li>• Status wordt bijgewerkt naar "Goedgekeurd"</li>
            </ul>
          </div>

          <div>
            <Label htmlFor="approvalNote">Notitie (optioneel)</Label>
            <Textarea
              id="approvalNote"
              value={approvalNote}
              onChange={(e) => setApprovalNote(e.target.value)}
              placeholder="Interne notitie over de goedkeuring..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuleren
            </Button>
            <Button 
              onClick={handleApprove}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {isLoading ? 'Bezig met goedkeuren...' : 'Goedkeuren'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};