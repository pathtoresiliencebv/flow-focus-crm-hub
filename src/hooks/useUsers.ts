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
  console.log('🔍 fetchUsers: Starting...');
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role, email')
      .order('created_at', { ascending: false });
    
    console.log('📦 fetchUsers: Response -', { data: data?.length, error });
    
    if (error) {
      console.warn('Error fetching users:', error);
      // Return empty array instead of throwing
      return [];
    }
    
    const result = data || [];
    console.log('✅ fetchUsers: Loaded', result.length, 'users');
    return result;
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
    retry: 1, // Retry once on errors
    enabled: canViewUsers, // Only fetch if user has permission
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
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