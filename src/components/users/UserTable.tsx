
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Key } from 'lucide-react';
import { Profile } from '@/types/user';
import { useAuth } from '@/contexts/AuthContext';

interface UserTableProps {
  users: (Profile & { email: string })[];
  onEdit: (user: Profile) => void;
  onDelete: (user: Profile) => void;
  onResetPassword: (user: Profile) => void;
}

export const UserTable = ({ users, onEdit, onDelete, onResetPassword }: UserTableProps) => {
  const { hasPermission, user: currentUser } = useAuth();
  
  return (
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
        {users.map((user) => (
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
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => onEdit(user)}>
                  <Edit className="h-4 w-4" />
                </Button>
                {hasPermission('users_edit') && user.id !== currentUser?.id && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => onResetPassword(user)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Key className="h-4 w-4" />
                  </Button>
                )}
                {hasPermission('users_delete') && user.id !== currentUser?.id && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => onDelete(user)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
