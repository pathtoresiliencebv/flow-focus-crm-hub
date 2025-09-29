import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useProjectPlanning = () => {
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const createPlanningForProject = async (projectId: string, assignedUserId: string, projectTitle: string, projectDate: string, description?: string) => {
    setIsCreating(true);
    try {
      // Controleer of er al een planning bestaat
      const { data: existingPlanning } = await supabase
        .from('planning_items')
        .select('id')
        .eq('project_id', projectId)
        .eq('assigned_user_id', assignedUserId)
        .maybeSingle();

      const planningData = {
        project_id: projectId,
        assigned_user_id: assignedUserId,
        user_id: assignedUserId,
        title: `Project: ${projectTitle}`,
        description: description || 'Project uitvoering',
        start_date: projectDate,
        start_time: '08:00:00',
        end_time: '17:00:00',
        status: 'gepland',
        location: null
      };

      if (existingPlanning) {
        // Update bestaande planning
        const { error } = await supabase
          .from('planning_items')
          .update({
            ...planningData,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingPlanning.id);

        if (error) throw error;

        toast({
          title: "Planning bijgewerkt",
          description: `Planning voor ${projectTitle} is bijgewerkt.`,
        });
      } else {
        // Maak nieuwe planning aan
        const { error } = await supabase
          .from('planning_items')
          .insert([planningData]);

        if (error) throw error;

        toast({
          title: "Planning aangemaakt",
          description: `Planning voor ${projectTitle} is aangemaakt.`,
        });
      }

      return true;
    } catch (error) {
      console.error('Error creating/updating project planning:', error);
      toast({
        title: "Fout bij planning",
        description: "Er is een fout opgetreden bij het aanmaken van de planning.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsCreating(false);
    }
  };

  const removePlanningForProject = async (projectId: string, assignedUserId: string) => {
    try {
      const { error } = await supabase
        .from('planning_items')
        .delete()
        .eq('project_id', projectId)
        .eq('assigned_user_id', assignedUserId);

      if (error) throw error;

      toast({
        title: "Planning verwijderd",
        description: "De planning voor dit project is verwijderd.",
      });

      return true;
    } catch (error) {
      console.error('Error removing project planning:', error);
      toast({
        title: "Fout bij verwijderen",
        description: "Er is een fout opgetreden bij het verwijderen van de planning.",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    createPlanningForProject,
    removePlanningForProject,
    isCreating
  };
};