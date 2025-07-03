import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface ProjectDeliveryData {
  project_id: string;
  client_name: string;
  delivery_summary: string;
  client_signature_data?: string;
  monteur_signature_data?: string;
  delivery_photos?: string[];
}

export const useProjectDelivery = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isStarting, setIsStarting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  // Start project mutation
  const startProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { error } = await supabase.rpc('start_project', {
        p_project_id: projectId,
        p_user_id: user.id
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({
        title: "Project gestart",
        description: "Het project is succesvol gestart en staat nu 'in uitvoering'.",
      });
    },
    onError: (error) => {
      toast({
        title: "Fout bij starten project",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Complete project delivery mutation
  const completeProjectMutation = useMutation({
    mutationFn: async (deliveryData: ProjectDeliveryData) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('project_deliveries')
        .insert({
          ...deliveryData,
          delivered_by: user.id,
          delivery_photos: deliveryData.delivery_photos || []
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project_deliveries'] });
      toast({
        title: "Project opgeleverd",
        description: "Het project is succesvol opgeleverd en afgerond.",
      });
    },
    onError: (error) => {
      toast({
        title: "Fout bij opleveren project",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const startProject = async (projectId: string) => {
    setIsStarting(true);
    try {
      await startProjectMutation.mutateAsync(projectId);
    } finally {
      setIsStarting(false);
    }
  };

  const completeProject = async (deliveryData: ProjectDeliveryData) => {
    setIsCompleting(true);
    try {
      await completeProjectMutation.mutateAsync(deliveryData);
    } finally {
      setIsCompleting(false);
    }
  };

  return {
    startProject,
    completeProject,
    isStarting,
    isCompleting,
  };
};