
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nieuwe Gebruiker Aanmaken</DialogTitle>
          <DialogDescription>
            Vul de gegevens in voor de nieuwe gebruiker. De gebruiker ontvangt een bevestigingsmail.
          </DialogDescription>
        </DialogHeader>
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
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Annuleren</Button>
          </DialogClose>
          <Button onClick={handleCreate} disabled={isCreating}>
            {isCreating ? 'Aanmaken...' : 'Aanmaken'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
