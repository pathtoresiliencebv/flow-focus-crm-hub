
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { CreateUserDialog } from './CreateUserDialog';
import { useAuth } from '@/hooks/useAuth';
import { fetchUsers } from '@/api/users';
import { EditUserDialog } from './users/EditUserDialog';
import { UserTable } from './users/UserTable';
import { Profile } from '@/types/user';

const UserManagement = () => {
  const { data: users, isLoading, error } = useQuery({ 
    queryKey: ['users'], 
    queryFn: fetchUsers,
    retry: false
  });
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [isCreateUserOpen, setCreateUserOpen] = useState(false);
  const { hasPermission } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Laden van gebruikers...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">Fout bij laden van gebruikers</p>
        <p className="text-muted-foreground">{error.message}</p>
      </div>
    );
  }

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
        <UserTable users={Array.isArray(users) ? users : []} onEdit={setEditingUser} />
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
