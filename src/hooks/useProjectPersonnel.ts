import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface ProjectPersonnelAssignment {
  id: string;
  project_id: string;
  user_id: string;
  project_role: string;
  hourly_rate: number;
  estimated_hours: number;
  assigned_by: string;
  created_at: string;
  updated_at: string;
  // Joined data from profiles
  user_name?: string;
  user_email?: string;
}

interface CreatePersonnelAssignment {
  project_id: string;
  user_id: string;
  project_role: string;
  hourly_rate: number;
  estimated_hours: number;
}

export const useProjectPersonnel = (projectId: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<ProjectPersonnelAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPersonnel = async () => {
    if (!user || !projectId) return;

    try {
      setLoading(true);
      
      // Fetch personnel assignments with user details
      const { data, error } = await supabase
        .from('project_personnel')
        .select(`
          *,
          profiles!project_personnel_user_id_fkey (
            full_name,
            id
          )
        `)
        .eq('project_id', projectId);

      if (error) {
        console.error('Error fetching project personnel:', error);
        throw error;
      }

      // Transform the data to include user names
      const transformedData = data?.map(item => ({
        ...item,
        user_name: item.profiles?.full_name || 'Onbekend',
        user_email: ''
      })) || [];

      setAssignments(transformedData);
    } catch (error) {
      console.error('Error in fetchPersonnel:', error);
      toast({
        title: "Fout bij ophalen personeel",
        description: "Er ging iets mis bij het ophalen van het personeel.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addPersonnel = async (newAssignment: CreatePersonnelAssignment) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('project_personnel')
        .insert({
          ...newAssignment,
          assigned_by: user.id
        })
        .select(`
          *,
          profiles!project_personnel_user_id_fkey (
            full_name,
            id
          )
        `)
        .single();

      if (error) {
        console.error('Error adding personnel:', error);
        throw error;
      }

      // Transform the data
      const transformedData = {
        ...data,
        user_name: data.profiles?.full_name || 'Onbekend',
        user_email: ''
      };

      setAssignments(prev => [...prev, transformedData]);
      
      toast({
        title: "Personeel toegewezen",
        description: "Het personeel is succesvol toegewezen aan het project.",
      });

      return transformedData;
    } catch (error) {
      console.error('Error adding personnel:', error);
      toast({
        title: "Fout bij toewijzen",
        description: "Er ging iets mis bij het toewijzen van personeel.",
        variant: "destructive"
      });
      return null;
    }
  };

  const updatePersonnel = async (id: string, updates: Partial<ProjectPersonnelAssignment>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('project_personnel')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          profiles!project_personnel_user_id_fkey (
            full_name,
            id
          )
        `)
        .single();

      if (error) {
        console.error('Error updating personnel:', error);
        throw error;
      }

      // Transform the data
      const transformedData = {
        ...data,
        user_name: data.profiles?.full_name || 'Onbekend',
        user_email: ''
      };

      setAssignments(prev => 
        prev.map(item => item.id === id ? transformedData : item)
      );

      toast({
        title: "Personeel bijgewerkt",
        description: "De personeelstoewijzing is succesvol bijgewerkt.",
      });

      return transformedData;
    } catch (error) {
      console.error('Error updating personnel:', error);
      toast({
        title: "Fout bij bijwerken",
        description: "Er ging iets mis bij het bijwerken van de personeelstoewijzing.",
        variant: "destructive"
      });
      return null;
    }
  };

  const deletePersonnel = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('project_personnel')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting personnel:', error);
        throw error;
      }

      setAssignments(prev => prev.filter(item => item.id !== id));
      
      toast({
        title: "Personeel verwijderd",
        description: "De personeelstoewijzing is succesvol verwijderd.",
      });
    } catch (error) {
      console.error('Error deleting personnel:', error);
      toast({
        title: "Fout bij verwijderen",
        description: "Er ging iets mis bij het verwijderen van de personeelstoewijzing.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchPersonnel();
  }, [user, projectId]);

  return {
    assignments,
    loading,
    fetchPersonnel,
    addPersonnel,
    updatePersonnel,
    deletePersonnel
  };
};