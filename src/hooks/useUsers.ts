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
  const { data: users = [], isLoading, error } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });

  // Filter monteurs (Installateur role)
  const monteurs = users.filter(user => user.role === 'Installateur');

  return {
    users,
    monteurs,
    isLoading,
    error,
  };
};