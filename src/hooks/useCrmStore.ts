import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

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
  const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

const fetchProjects = async () => {
  const { data, error } = await supabase.from('projects').select('*, customers(name)').order('created_at', { ascending: false });
  if (error) throw error;
  
  // Transform the data to add a simple 'customer' name property
  const transformedData = data.map(p => {
    const { customers, ...rest } = p;
    return {
      ...rest,
      customer: customers?.name ?? 'Onbekende klant'
    };
  });
  return transformedData as ProjectWithCustomerName[];
};

// --- Main hook ---
export const useCrmStore = () => {
  const queryClient = useQueryClient();

  // --- QUERIES ---
  const { data: customers = [], isLoading: isLoadingCustomers } = useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: fetchCustomers,
  });

  const { data: projects = [], isLoading: isLoadingProjects } = useQuery<ProjectWithCustomerName[]>({
    queryKey: ['projects'],
    queryFn: fetchProjects,
  });

  // --- MUTATIONS ---
  const addCustomerMutation = useMutation({
    mutationFn: async (customerData: NewCustomer) => {
      const { data, error } = await supabase.from('customers').insert(customerData).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (newCustomer) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast({
        title: "Klant toegevoegd",
        description: `${newCustomer.name} is succesvol toegevoegd.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Fout bij toevoegen klant",
        description: error.message,
        variant: "destructive",
      });
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
      return data;
    },
    onSuccess: (newProject) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({
        title: "Project aangemaakt",
        description: `${newProject.title} is succesvol aangemaakt.`,
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
      // Ensure 'customer' field is not sent to Supabase
      const { customer, ...restData } = projectData as any;
      const { data, error } = await supabase.from('projects').update(restData).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (updatedProject) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({
        title: "Project bijgewerkt",
        description: `Project "${updatedProject.title}" is succesvol bijgewerkt.`,
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
  };
};
