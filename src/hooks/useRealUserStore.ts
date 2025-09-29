import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface RealUser {
  id: string;
  full_name: string | null;
  role: string;
  status: string;
  email?: string;
}

const fetchUsers = async (): Promise<RealUser[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, role, status')
    .eq('status', 'Actief')
    .order('full_name');
    
  if (error) throw error;
  
  return data || [];
};

export const useRealUserStore = () => {
  const { data: users = [], isLoading } = useQuery<RealUser[]>({
    queryKey: ['realUsers'],
    queryFn: fetchUsers,
  });

  // Filter for installers
  const installers = users.filter(user => 
    user.role === 'Installateur' || user.role === 'Administrator'
  );

  return {
    users,
    installers,
    isLoading
  };
};