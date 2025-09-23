
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { updateUser } from '@/api/users';
import { Profile } from '@/types/user';

export const EditUserDialog = ({ user, onClose }: { user: Profile; onClose: () => void }) => {
  const queryClient = useQueryClient();
  const [role, setRole] = useState(user.role);
  const [status, setStatus] = useState(user.status);
  
  // Check if this is the super admin (joery@smanscrm.nl)
  const isSuperAdmin = user.email === 'joery@smanscrm.nl';

  const mutation = useMutation({
    mutationFn: updateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ title: 'Success', description: 'User updated successfully.' });
      onClose();
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleSave = () => {
    mutation.mutate({ id: user.id, role, status });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit User: {user.full_name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {isSuperAdmin && (
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-4">
              <p className="text-sm text-amber-800">
                🔒 <strong>Super Administrator</strong> - Deze gebruiker heeft permanente Administrator rechten en kan niet worden bewerkt.
              </p>
            </div>
          )}
          <div>
            <Label htmlFor="role">Role</Label>
            <Select 
              value={role} 
              onValueChange={(value) => setRole(value as Profile['role'])}
              disabled={isSuperAdmin}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Administrator">Administrator</SelectItem>
                <SelectItem value="Verkoper">Verkoper</SelectItem>
                <SelectItem value="Installateur">Installateur</SelectItem>
                <SelectItem value="Administratie">Administratie</SelectItem>
                <SelectItem value="Bekijker">Bekijker</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select 
              value={status} 
              onValueChange={(value) => setStatus(value as Profile['status'])}
              disabled={isSuperAdmin}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Actief">Actief</SelectItem>
                <SelectItem value="Inactief">Inactief</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={mutation.isPending || isSuperAdmin}>
            {mutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
