import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface User {
  id: string;
  full_name: string | null;
  role: string | null;
  email: string;
}

const fetchUsers = async (): Promise<User[]> => {
  const { data, error } = await supabase.rpc('get_all_user_details');
  if (error) throw error;
  return data;
};

export const useUsers = () => {
  const { data: users = [], isLoading, error, refetch } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: fetchUsers,
    retry: false, // Don't retry on permission errors
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