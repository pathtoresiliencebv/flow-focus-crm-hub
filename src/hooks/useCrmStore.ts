import React, { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';

// --- Types based on Supabase schema ---
export type Customer = Database['public']['Tables']['customers']['Row'];
export type Project = Database['public']['Tables']['projects']['Row'];
export type NewCustomer = Database['public']['Tables']['customers']['Insert'];
export type UpdateCustomer = Database['public']['Tables']['customers']['Update'];
export type NewProject = Database['public']['Tables']['projects']['Insert'];
export type UpdateProject = Database['public']['Tables']['projects']['Update'];

// This is the type we get from the query, with the customer name joined.
export type ProjectWithCustomerName = Project & {
  customer: string;
};

// --- API functions for react-query ---
const fetchCustomers = async (): Promise<Customer[]> => {
  // OPTIMIZATION: Only fetch recent/active customers (last 2 years)
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
  
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .gte('created_at', twoYearsAgo.toISOString())
    .order('created_at', { ascending: false })
    .limit(500); // Reasonable limit
  
  if (error) throw error;
  console.log(`✅ Fetched ${data.length} customers (filtered to last 2 years)`);
  return data;
};

const fetchProjects = async () => {
  // OPTIMIZATION: Only fetch recent/active projects (last year + active status)
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  
  const { data, error } = await supabase
    .from('projects')
    .select('*, customers(name)')
    .or(`status.neq.afgerond,created_at.gte.${oneYearAgo.toISOString()}`)
    .order('created_at', { ascending: false })
    .limit(500); // Reasonable limit
  
  if (error) throw error;
  
  // Transform the data to add a simple 'customer' name property
  const transformedData = data.map(p => {
    const { customers, ...rest } = p;
    return {
      ...rest,
      customer: customers?.name ?? 'Onbekende klant'
    };
  });
  
  console.log(`✅ Fetched ${transformedData.length} projects (filtered to last year + active)`);
  return transformedData as ProjectWithCustomerName[];
};

// --- Main hook ---
export const useCrmStore = () => {
  const queryClient = useQueryClient();
  const { profile, user } = useAuth();

  // --- QUERIES ---
  const { data: allCustomers = [], isLoading: isLoadingCustomers } = useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: fetchCustomers,
  });

  const { data: allProjects = [], isLoading: isLoadingProjects } = useQuery<ProjectWithCustomerName[]>({
    queryKey: ['projects'],
    queryFn: fetchProjects,
  });

  // Filter data based on user role
  const filteredProjects = useMemo(() => {
    if (profile?.role === 'Installateur') {
      // Installateurs only see projects assigned to them
      console.log('Filtering projects for installateur:', user?.id);
      console.log('All projects:', allProjects);
      const userProjects = allProjects.filter(p => p.assigned_user_id === user?.id);
      console.log('Filtered projects for installateur:', userProjects);
      return userProjects;
    }
    return allProjects;
  }, [allProjects, profile?.role, user?.id]);

  const filteredCustomers = useMemo(() => {
    if (profile?.role === 'Installateur') {
      // Installateurs only see customers from their assigned projects
      const assignedProjectCustomerIds = filteredProjects.map(p => p.customer_id);
      return allCustomers.filter(c => assignedProjectCustomerIds.includes(c.id));
    }
    return allCustomers;
  }, [allCustomers, filteredProjects, profile?.role]);

  // Expose filtered data
  const customers = filteredCustomers;
  const projects = filteredProjects;

  // --- MUTATIONS ---
  const addCustomerMutation = useMutation({
    mutationFn: async (customerData: NewCustomer) => {
      const { data, error } = await supabase.from('customers').insert(customerData).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (newCustomer) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      // Remove toast - let components handle their own notifications
    },
    onError: (error) => {
      // Remove toast - let components handle their own error notifications
      throw error;
    },
  });

  const updateCustomerMutation = useMutation({
    mutationFn: async ({ id, ...customerData }: UpdateCustomer & { id: string }) => {
      const { data, error } = await supabase.from('customers').update(customerData).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (updatedCustomer) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({
        title: "Klant bijgewerkt",
        description: `${updatedCustomer.name} is succesvol bijgewerkt.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Fout bij bijwerken klant",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteCustomerMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('customers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({
        title: "Klant verwijderd",
        description: "Klant is succesvol verwijderd.",
      });
    },
    onError: (error) => {
      toast({
        title: "Fout bij verwijderen klant",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addProjectMutation = useMutation({
    mutationFn: async (projectData: NewProject) => {
      const { data, error } = await supabase.from('projects').insert(projectData).select().single();
      if (error) throw error;
      
      // Create planning if user is assigned
      if (projectData.assigned_user_id) {
        const planningData = {
          project_id: data.id,
          assigned_user_id: projectData.assigned_user_id,
          user_id: projectData.assigned_user_id,
          title: `Project: ${data.title}`,
          description: data.description || 'Project uitvoering',
          start_date: data.date,
          start_time: '08:00:00',
          end_time: '17:00:00',
          status: 'gepland',
        };
        
        await supabase.from('planning_items').insert([planningData]);
      }
      
      return data;
    },
    onSuccess: (newProject) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['planning'] });
      toast({
        title: "Project aangemaakt",
        description: `${newProject.title} is succesvol aangemaakt. ${newProject.assigned_user_id ? 'Planning is automatisch aangemaakt.' : ''}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Fout bij aanmaken project",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: async ({ id, ...projectData }: UpdateProject & { id: string }) => {
      // Store old assigned_user_id for planning logic
      const oldProject = allProjects.find(p => p.id === id);
      const oldAssignedUserId = oldProject?.assigned_user_id;
      const newAssignedUserId = projectData.assigned_user_id;
      
      // Ensure 'customer' field is not sent to Supabase
      const { customer, ...restData } = projectData as any;
      const { data, error } = await supabase.from('projects').update(restData).eq('id', id).select().single();
      if (error) throw error;
      
      // Handle planning when assignment changes
      if (oldAssignedUserId !== newAssignedUserId) {
        // Remove old planning if there was an assigned user
        if (oldAssignedUserId) {
          await supabase
            .from('planning_items')
            .delete()
            .eq('project_id', id)
            .eq('assigned_user_id', oldAssignedUserId);
        }
        
        // Create new planning if there's a new assigned user
        if (newAssignedUserId) {
          const planningData = {
            project_id: id,
            assigned_user_id: newAssignedUserId,
            user_id: newAssignedUserId,
            title: `Project: ${data.title}`,
            description: data.description || 'Project uitvoering',
            start_date: data.date,
            start_time: '08:00:00',
            end_time: '17:00:00',
            status: 'gepland',
          };
          
          await supabase.from('planning_items').upsert([planningData]);
        }
      }
      
      return data;
    },
    onSuccess: (updatedProject) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['planning'] });
      toast({
        title: "Project bijgewerkt",
        description: `Project "${updatedProject.title}" is succesvol bijgewerkt. ${updatedProject.assigned_user_id ? 'Planning is automatisch aangemaakt.' : ''}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Fout bij bijwerken project",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({
        title: "Project verwijderd",
        description: "Project is succesvol verwijderd.",
      });
    },
    onError: (error) => {
      toast({
        title: "Fout bij verwijderen project",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    customers,
    projects, // Components will now receive the transformed project object
    isLoading: isLoadingCustomers || isLoadingProjects,
    
    // Provide async functions for components to call
    addCustomer: addCustomerMutation.mutateAsync,
    updateCustomer: (id: string, data: UpdateCustomer) => updateCustomerMutation.mutateAsync({ id, ...data }),
    deleteCustomer: deleteCustomerMutation.mutateAsync,
    
    addProject: addProjectMutation.mutateAsync,
    updateProject: (id: string, data: UpdateProject) => updateProjectMutation.mutateAsync({ id, ...data }),
    deleteProject: deleteProjectMutation.mutateAsync,
    
    // Debug info
    debug: {
      isLoadingCustomers,
      isLoadingProjects,
      allProjectsCount: allProjects.length,
      filteredProjectsCount: projects.length,
      userRole: profile?.role,
      userId: user?.id
    }
  };
};
