
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { UserRole } from '@/types/permissions';

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateUserDialog = ({ open, onOpenChange }: CreateUserDialogProps) => {
  const { signUp } = useAuth();
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('Bekijker');
  const [isCreating, setIsCreating] = useState(false);
  const [bulkCreateMode, setBulkCreateMode] = useState(false);

  // Predefined users for bulk creation
  const predefinedUsers = [
    { fullName: 'Luke Smans', email: 'luke@smanscrm.nl', password: 'LukeSmansOnderhoud1256!@', role: 'Installateur' as UserRole },
    { fullName: 'Andre Smans', email: 'andre@smanscrm.nl', password: 'AndreSmansOnderhoud1256!@', role: 'Installateur' as UserRole },
    { fullName: 'Michal Smans', email: 'michal@smanscrm.nl', password: 'MichalSmansOnderhoud1256!@', role: 'Installateur' as UserRole },
    { fullName: 'Gregory Smans', email: 'gregory@smanscrm.nl', password: 'GregorySmansOnderhoud1256!@', role: 'Installateur' as UserRole },
    { fullName: 'Tomek Smans', email: 'tomek@smanscrm.nl', password: 'TomekSmansOnderhoud1256!@', role: 'Installateur' as UserRole },
  ];

  const handleCreate = async () => {
    if (!fullName || !email || !password) {
      toast({ title: 'Fout', description: 'Vul alstublieft alle velden in.', variant: 'destructive' });
      return;
    }
    setIsCreating(true);
    // De signUp functie van useAuth toont zelf de toast-berichten
    await signUp(email, password, fullName, role);
    setIsCreating(false);
    queryClient.invalidateQueries({ queryKey: ['users'] });
    onOpenChange(false);
    // Reset het formulier
    setFullName('');
    setEmail('');
    setPassword('');
    setRole('Bekijker');
  };

  const handleBulkCreate = async () => {
    setIsCreating(true);
    let successCount = 0;
    let errorCount = 0;

    for (const user of predefinedUsers) {
      try {
        await signUp(user.email, user.password, user.fullName, user.role);
        successCount++;
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Failed to create user ${user.email}:`, error);
        errorCount++;
      }
    }

    toast({
      title: 'Bulk gebruiker aanmaak voltooid',
      description: `${successCount} gebruikers succesvol aangemaakt, ${errorCount} fouten.`,
      variant: successCount > 0 ? 'default' : 'destructive'
    });

    setIsCreating(false);
    setBulkCreateMode(false);
    queryClient.invalidateQueries({ queryKey: ['users'] });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {bulkCreateMode ? 'Bulk Installateurs Aanmaken' : 'Nieuwe Gebruiker Aanmaken'}
          </DialogTitle>
          <DialogDescription>
            {bulkCreateMode 
              ? 'Er worden 5 installateur accounts aangemaakt met de vooraf gedefinieerde gegevens.'
              : 'Vul de gegevens in voor de nieuwe gebruiker. De gebruiker ontvangt een bevestigingsmail.'
            }
          </DialogDescription>
        </DialogHeader>
        
        {!bulkCreateMode ? (
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="fullName">Volledige Naam</Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="password">Wachtwoord</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="role">Rol</Label>
              <Select value={role} onValueChange={(value: UserRole) => setRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bekijker">Bekijker</SelectItem>
                  <SelectItem value="Verkoper">Verkoper</SelectItem>
                  <SelectItem value="Installateur">Installateur</SelectItem>
                  <SelectItem value="Administratie">Administratie</SelectItem>
                  <SelectItem value="Administrator">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Te maken installateurs:</h4>
              <ul className="space-y-1 text-sm">
                {predefinedUsers.map((user, index) => (
                  <li key={index} className="flex justify-between">
                    <span>{user.fullName}</span>
                    <span className="text-muted-foreground">{user.email}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <div className="flex gap-2 flex-1">
            {!bulkCreateMode && (
              <Button 
                variant="secondary" 
                onClick={() => setBulkCreateMode(true)}
                disabled={isCreating}
                className="text-xs"
              >
                🚀 Bulk: 5 Installateurs
              </Button>
            )}
            {bulkCreateMode && (
              <Button 
                variant="outline" 
                onClick={() => setBulkCreateMode(false)}
                disabled={isCreating}
              >
                ← Terug naar Handmatig
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <DialogClose asChild>
              <Button variant="outline" disabled={isCreating}>Annuleren</Button>
            </DialogClose>
            <Button 
              onClick={bulkCreateMode ? handleBulkCreate : handleCreate} 
              disabled={isCreating}
            >
              {isCreating ? 'Aanmaken...' : bulkCreateMode ? '5 Installateurs Aanmaken' : 'Aanmaken'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
