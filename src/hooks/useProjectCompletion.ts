import { useState } from 'react';
import { generateUUID } from '@/utils/uuid';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

/**
 * Interface for project completion data
 * This is the unified structure for project completions
 */
export interface ProjectCompletionData {
  project_id: string;
  installer_id?: string; // Will be auto-filled from auth
  completion_date: string; // ISO date string (YYYY-MM-DD)
  work_performed: string;
  materials_used?: string;
  recommendations?: string;
  notes?: string;
  customer_satisfaction: number; // 1-5
  customer_signature: string; // Base64 signature image
  installer_signature: string; // Base64 signature image
  
  // Additional fields from enhanced workflow
  customer_name: string;
  customer_email?: string;
  work_time_log_id?: string;
  
  // Optional extended fields
  total_work_hours?: number;
  break_duration_minutes?: number;
  materials_cost?: number;
  labor_cost?: number;
  follow_up_required?: boolean;
  follow_up_notes?: string;
  
  // Selected tasks for work order
  selectedTaskIds?: string[]; // Only these tasks will appear in the work order
}

/**
 * Interface for photo upload
 */
export interface CompletionPhotoData {
  completion_id: string;
  photo_url: string;
  description?: string;
  category: 'before' | 'during' | 'after' | 'detail' | 'overview';
  file_name?: string;
  file_size?: number;
}

interface CompletionPayload {
  completionData: ProjectCompletionData;
  photos: { url: string; category: string; description: string }[];
  selectedTasks: Set<string>; // Added selectedTasks to the interface
}

/**
 * Hook for managing project completions
 * This is the unified hook that replaces useProjectDelivery
 */
export const useProjectCompletion = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { mutateAsync: completeProject, isLoading: isCompleting } = useMutation<any, Error, CompletionPayload>({
    mutationFn: async ({ completionData, photos, selectedTasks }) => {
      // Explicitly get the current session to ensure the auth token is fresh
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error("Kon geen actieve sessie vinden. Log opnieuw in.");
      }

      // Delegate the entire completion process to the secure edge function
      const { data, error } = await supabase.functions.invoke('create-completion', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: {
          completionData: {
            ...completionData,
            installer_id: profile.id,
          },
          photos: photos.map(p => ({
            photo_url: p.url,
            category: p.category,
            description: p.description,
            uploader_id: profile.id
          })),
          taskIds: Array.from(selectedTasks) // Pass the selected task IDs
        },
      });

      if (error) {
        throw new Error(error.message || "Er is een fout opgetreden bij het aanroepen van de afrondingsfunctie.");
      }

      return data.completion;
    },
    onSuccess: (completion) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project-activities', completion.project_id] });
      queryClient.invalidateQueries({ queryKey: ['project_tasks', completion.project_id] });
      toast({ title: "✅ Project succesvol opgeleverd!" });
      console.log('Project completion successful, handled by edge function.');
    },
    onError: (error: Error) => {
      toast({
        title: "Fout bij opleveren",
        description: error.message || "Er is een onbekende fout opgetreden.",
        variant: "destructive",
      });
    },
  });

  return { completeProject, isCompleting };
};

