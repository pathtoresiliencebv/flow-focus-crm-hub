import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Save } from 'lucide-react';

interface ExitConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveAndExit: () => void;
  onExitWithoutSaving: () => void;
}

export const ExitConfirmDialog: React.FC<ExitConfirmDialogProps> = ({
  isOpen,
  onClose,
  onSaveAndExit,
  onExitWithoutSaving
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Offerte sluiten?
          </DialogTitle>
          <DialogDescription>
            Er zijn niet-opgeslagen wijzigingen in deze offerte. Wat wil je doen?
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2 pt-4">
          <Button 
            onClick={onSaveAndExit}
            className="justify-start"
          >
            <Save className="h-4 w-4 mr-2" />
            Opslaan als concept en sluiten
          </Button>
          <Button 
            variant="outline"
            onClick={onExitWithoutSaving}
            className="justify-start text-red-600 hover:text-red-700"
          >
            Sluiten zonder opslaan
          </Button>
          <Button 
            variant="secondary"
            onClick={onClose}
            className="justify-start"
          >
            Terug naar offerte
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};