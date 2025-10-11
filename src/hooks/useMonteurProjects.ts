import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface MonteurProject {
  id: string;
  name: string;
  description?: string;
  status: string;
  start_date?: string;
  end_date?: string;
  budget?: number;
  customer_id: string;
  assigned_user_id?: string;
  created_at: string;
  updated_at: string;
  customer: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    zip_code?: string;
  };
}

export const useMonteurProjects = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Check if user is a monteur (Installateur)
  const isMonteur = profile?.role === 'Installateur';

  // Fetch monteur's assigned projects
  const fetchMonteurProjects = useCallback(async (): Promise<MonteurProject[]> => {
    if (!user?.id || !isMonteur) {
      console.log('🔍 useMonteurProjects: Not a monteur or no user ID');
      return [];
    }

    console.log('🔍 useMonteurProjects: Fetching projects for monteur:', user.id);

    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          customers:customer_id (
            id,
            name,
            email,
            phone,
            address,
            city,
            zip_code
          )
        `)
        .eq('assigned_user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ useMonteurProjects: Error fetching projects:', error);
        throw error;
      }

      console.log(`✅ useMonteurProjects: Fetched ${data?.length || 0} projects for monteur`);
      console.log('🔍 useMonteurProjects: Sample project:', data?.[0]);

      return data || [];
    } catch (error: any) {
      console.error('❌ useMonteurProjects: Error in fetchMonteurProjects:', error);
      toast({
        title: "Fout bij laden projecten",
        description: "Kon uw projecten niet laden. Probeer opnieuw.",
        variant: "destructive",
      });
      return [];
    }
  }, [user?.id, isMonteur, toast]);

  // React Query for projects
  const { 
    data: projects = [], 
    isLoading, 
    error,
    refetch 
  } = useQuery<MonteurProject[]>({
    queryKey: ['monteur-projects', user?.id],
    queryFn: fetchMonteurProjects,
    enabled: !!user?.id && isMonteur,
    staleTime: 0, // Always refetch
    gcTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  // Manual refresh function
  const refreshProjects = useCallback(async () => {
    if (!user?.id || !isMonteur) return;

    try {
      setIsRefreshing(true);
      console.log('🔄 useMonteurProjects: Manual refresh triggered');
      
      // Invalidate and refetch
      await queryClient.invalidateQueries({ queryKey: ['monteur-projects', user.id] });
      await refetch();
      
      console.log('✅ useMonteurProjects: Manual refresh completed');
    } catch (error) {
      console.error('❌ useMonteurProjects: Error during manual refresh:', error);
      toast({
        title: "Fout bij vernieuwen",
        description: "Kon projecten niet vernieuwen.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [user?.id, isMonteur, queryClient, refetch, toast]);

  // Filter projects by status
  const getActiveProjects = useCallback(() => {
    return projects.filter(project => project.status !== 'afgerond');
  }, [projects]);

  const getCompletedProjects = useCallback(() => {
    return projects.filter(project => project.status === 'afgerond');
  }, [projects]);

  // Get projects by status
  const getProjectsByStatus = useCallback((status: string) => {
    return projects.filter(project => project.status === status);
  }, [projects]);

  // Get project by ID
  const getProjectById = useCallback((projectId: string) => {
    return projects.find(project => project.id === projectId);
  }, [projects]);

  // Check if project is assigned to current monteur
  const isProjectAssigned = useCallback((projectId: string) => {
    const project = getProjectById(projectId);
    return project && project.assigned_user_id === user?.id;
  }, [getProjectById, user?.id]);

  // Get project statistics
  const getProjectStats = useCallback(() => {
    const activeProjects = getActiveProjects();
    const completedProjects = getCompletedProjects();
    
    return {
      total: projects.length,
      active: activeProjects.length,
      completed: completedProjects.length,
      byStatus: {
        'te-plannen': getProjectsByStatus('te-plannen').length,
        'gepland': getProjectsByStatus('gepland').length,
        'in-uitvoering': getProjectsByStatus('in-uitvoering').length,
        'herkeuring': getProjectsByStatus('herkeuring').length,
        'afgerond': getProjectsByStatus('afgerond').length,
      }
    };
  }, [projects, getActiveProjects, getCompletedProjects, getProjectsByStatus]);

  // Removed auto-refresh on user change to prevent infinite loading
  // The useQuery hook already handles this with refetchOnMount: true

  return {
    projects,
    isLoading,
    error,
    isRefreshing,
    refreshProjects,
    getActiveProjects,
    getCompletedProjects,
    getProjectsByStatus,
    getProjectById,
    isProjectAssigned,
    getProjectStats,
    isMonteur,
  };
};
