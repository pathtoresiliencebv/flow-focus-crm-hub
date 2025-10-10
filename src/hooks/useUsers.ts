import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface User {
  id: string;
  full_name: string | null;
  role: string | null;
  email: string;
}

const fetchUsers = async (): Promise<User[]> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role, email')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.warn('Error fetching users:', error);
      return [];
    }
    
    return data || [];
  } catch (err) {
    console.warn('Exception fetching users:', err);
    return [];
  }
};

export const useUsers = () => {
  const { hasPermission } = useAuth();
  const canViewUsers = hasPermission('users_view');
  
  const { data: users = [], isLoading, error, refetch } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: fetchUsers,
    retry: false, // Don't retry on permission errors
    enabled: canViewUsers, // Only fetch if user has permission
  });

  // Filter monteurs (Installateur role)
  const monteurs = users.filter(user => user.role === 'Installateur');

  // DEBUG LOGGING
  console.log('🔍 [useUsers Debug]');
  console.log('Total users fetched:', users.length);
  console.log('All users:', users);
  console.log('Filtered monteurs:', monteurs);
  console.log('Loading state:', isLoading);
  console.log('Error state:', error);

  return {
    users,
    monteurs,
    isLoading,
    error,
    refreshUsers: refetch,
  };
};