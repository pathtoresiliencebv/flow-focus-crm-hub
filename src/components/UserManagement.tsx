import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Edit, UserPlus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { UserRole } from '@/types/permissions';
import { Input } from './ui/input';
import { CreateUserDialog } from './CreateUserDialog';
import { useAuth } from '@/hooks/useAuth';


type Profile = {
  id: string;
  full_name: string;
  role: UserRole;
  status: 'Actief' | 'Inactief';
  // Note: email is not in the profiles table but we will fetch it separately
  email?: string;
};

// We use a postgres function to securely fetch all user details.
// This function can only be called by an 'Administrator'.
async function fetchUsers() {
  const { data, error } = await supabase.rpc('get_all_user_details');
  
  if (error) {
    // Provide a more user-friendly error message for permission issues
    if (error.message.includes('U heeft geen rechten om gebruikersgegevens op te halen.')) {
        toast({ title: 'Geen Toegang', description: 'U heeft niet de benodigde rechten om gebruikers te zien.', variant: 'destructive' });
    }
    throw new Error(error.message);
  }

  // The RPC function returns all necessary fields, including email.
  return data as (Profile & { email: string })[];
}

async function updateUser(profile: Partial<Profile> & { id: string }) {
  const { id, ...updateData } = profile;
  // remove email if it exists, as it's not in the profiles table
  delete (updateData as any).email; 
  const { data, error } = await supabase.from('profiles').update(updateData).eq('id', id).select().single();
  if (error) throw new Error(error.message);

  // If role is updated to Administrator, demote other admins
  if (updateData.role === 'Administrator') {
    const { error: rpcError } = await supabase.rpc('demote_other_admins', {
      p_user_id_to_keep: id,
    });
    if (rpcError) {
      // Don't throw, just toast a warning that this part failed.
      toast({ title: 'Waarschuwing', description: `Gebruikersrol is bijgewerkt, maar het degraderen van andere beheerders is mislukt: ${rpcError.message}`, variant: 'destructive' });
    }
  }

  return data;
}

const EditUserDialog = ({ user, onClose }: { user: Profile; onClose: () => void }) => {
  const queryClient = useQueryClient();
  const [role, setRole] = useState(user.role);
  const [status, setStatus] = useState(user.status);

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
          <div>
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={(value) => setRole(value as Profile['role'])}>
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
            <Select value={status} onValueChange={(value) => setStatus(value as Profile['status'])}>
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
          <Button onClick={handleSave} disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const UserManagement = () => {
  const { data: users, isLoading, error } = useQuery({ queryKey: ['users'], queryFn: fetchUsers });
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [isCreateUserOpen, setCreateUserOpen] = useState(false);
  const { hasPermission } = useAuth();

  if (isLoading) return <div>Loading users...</div>;
  if (error) return <div>Error fetching users: {error.message}</div>;

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gebruikersbeheer</h2>
        {hasPermission('users_edit') && (
          <Button onClick={() => setCreateUserOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Nieuwe Gebruiker
          </Button>
        )}
      </div>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.full_name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${user.status === 'Actief' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {user.status}
                  </span>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => setEditingUser(user)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      {editingUser && (
        <EditUserDialog user={editingUser} onClose={() => setEditingUser(null)} />
      )}
      {hasPermission('users_edit') && (
        <CreateUserDialog open={isCreateUserOpen} onOpenChange={setCreateUserOpen} />
      )}
    </div>
  );
};

export default UserManagement;
