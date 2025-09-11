import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Profile } from '@/types/user';

interface DeleteUserDialogProps {
  user: Profile | null;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export const DeleteUserDialog = ({ 
  user, 
  open, 
  onClose, 
  onConfirm, 
  isLoading = false 
}: DeleteUserDialogProps) => {
  const [confirmName, setConfirmName] = useState('');
  
  const isConfirmValid = confirmName === user?.full_name;
  
  const handleConfirm = () => {
    if (isConfirmValid) {
      onConfirm();
      setConfirmName('');
    }
  };

  const handleClose = () => {
    setConfirmName('');
    onClose();
  };

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Gebruiker Verwijderen</AlertDialogTitle>
          <AlertDialogDescription>
            Deze actie kan niet ongedaan worden gemaakt. Dit zal de gebruiker permanent verwijderen 
            en alle bijbehorende gegevens wissen.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        {user && (
          <div className="space-y-4">
            <div className="p-4 bg-destructive/10 rounded-md">
              <h4 className="font-medium text-destructive">
                U staat op het punt {user.full_name} ({user.email}) te verwijderen
              </h4>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirm-name">
                Typ "{user.full_name}" om te bevestigen
              </Label>
              <Input
                id="confirm-name"
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                placeholder={user.full_name}
                disabled={isLoading}
              />
            </div>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleClose} disabled={isLoading}>
            Annuleren
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!isConfirmValid || isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? 'Verwijderen...' : 'Verwijderen'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};