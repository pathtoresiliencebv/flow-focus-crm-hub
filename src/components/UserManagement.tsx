
import React, { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { CreateUserDialog } from './CreateUserDialog';
import { useAuth } from '@/contexts/AuthContext';
import { fetchUsers, deleteUser, resetUserPassword } from '@/api/users';
import { EditUserDialog } from './users/EditUserDialog';
import { UserTable } from './users/UserTable';
import { DeleteUserDialog } from './users/DeleteUserDialog';
import { ResetPasswordDialog } from './users/ResetPasswordDialog';
import { UserAvailabilityDialog } from './users/UserAvailabilityDialog';
import { Profile } from '@/types/user';
import { usePageHeader } from "@/contexts/PageHeaderContext";

const UserManagement = () => {
  const { setTitle } = usePageHeader();
  const queryClient = useQueryClient();
  const { hasPermission, profile } = useAuth();

  React.useEffect(() => {
    setTitle("Gebruikers");
  }, [setTitle]);
  
  // Check if user has permission to view users
  const canViewUsers = hasPermission('users_view');
  
  const { data: users, isLoading, error } = useQuery({ 
    queryKey: ['users'], 
    queryFn: fetchUsers,
    retry: false,
    enabled: canViewUsers // Only fetch if user has permission
  });
  
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [deletingUser, setDeletingUser] = useState<Profile | null>(null);
  const [resettingPasswordUser, setResettingPasswordUser] = useState<Profile | null>(null);
  const [availabilityUser, setAvailabilityUser] = useState<Profile | null>(null);
  const [isCreateUserOpen, setCreateUserOpen] = useState(false);

  const deleteUserMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDeletingUser(null);
    },
    onError: () => {
      // Error handling is done in the deleteUser function
    }
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ userId, password }: { userId: string; password: string }) => 
      resetUserPassword(userId, password),
    onSuccess: () => {
      setResettingPasswordUser(null);
    },
  });

  // Show permission error if user doesn't have access
  if (!canViewUsers) {
    return (
      <div className="text-center py-8">
        <div className="max-w-md mx-auto">
          <h3 className="text-lg font-semibold mb-2">Geen Toegang</h3>
          <p className="text-muted-foreground mb-4">
            U heeft niet de benodigde rechten om gebruikers te beheren.
          </p>
          <p className="text-sm text-muted-foreground">
            Huidige rol: <span className="font-medium">{profile?.role || 'Onbekend'}</span>
          </p>
        </div>
      </div>
    );
  }

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
        <div className="max-w-md mx-auto">
          <h3 className="text-lg font-semibold mb-2 text-destructive">Fout bij laden van gebruikers</h3>
          <p className="text-muted-foreground mb-4">{error.message}</p>
          <p className="text-sm text-muted-foreground">
            Controleer uw rechten of neem contact op met een administrator.
          </p>
        </div>
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
        <UserTable 
          users={Array.isArray(users) ? users : []} 
          onEdit={setEditingUser}
          onDelete={setDeletingUser}
          onResetPassword={setResettingPasswordUser}
          onManageAvailability={setAvailabilityUser}
        />
      </Card>
      {editingUser && (
        <EditUserDialog user={editingUser} onClose={() => setEditingUser(null)} />
      )}
      {deletingUser && (
        <DeleteUserDialog
          user={deletingUser}
          open={!!deletingUser}
          onClose={() => setDeletingUser(null)}
          onConfirm={() => deleteUserMutation.mutate(deletingUser.id)}
          isLoading={deleteUserMutation.isPending}
        />
      )}
      {resettingPasswordUser && (
        <ResetPasswordDialog
          user={resettingPasswordUser}
          open={!!resettingPasswordUser}
          onClose={() => setResettingPasswordUser(null)}
          onConfirm={(password) => 
            resetPasswordMutation.mutate({ 
              userId: resettingPasswordUser.id, 
              password 
            })
          }
          isLoading={resetPasswordMutation.isPending}
        />
      )}
      {availabilityUser && (
        <UserAvailabilityDialog
          user={availabilityUser}
          open={!!availabilityUser}
          onClose={() => setAvailabilityUser(null)}
        />
      )}
      {hasPermission('users_edit') && (
        <CreateUserDialog open={isCreateUserOpen} onOpenChange={setCreateUserOpen} />
      )}
    </div>
  );
};

export default UserManagement;
