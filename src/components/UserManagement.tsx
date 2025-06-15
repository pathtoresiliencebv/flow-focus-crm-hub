
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
        <UserTable users={users || []} onEdit={setEditingUser} />
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
