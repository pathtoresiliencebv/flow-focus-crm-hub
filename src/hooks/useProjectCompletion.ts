import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

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

/**
 * Hook for managing project completions
 * This is the unified hook that replaces useProjectDelivery
 */
export const useProjectCompletion = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isStarting, setIsStarting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  /**
   * Start project mutation
   * Creates a work_time_log entry with GPS coordinates
   */
  const startProjectMutation = useMutation({
    mutationFn: async ({ 
      projectId, 
      planningId,
      gpsCoords 
    }: { 
      projectId: string;
      planningId?: string;
      gpsCoords?: { latitude: number; longitude: number; accuracy: number }
    }) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('work_time_logs')
        .insert({
          project_id: projectId,
          installer_id: user.id,
          planning_id: planningId,
          started_at: new Date().toISOString(),
          start_location_lat: gpsCoords?.latitude,
          start_location_lng: gpsCoords?.longitude,
          status: 'active'
        })
        .select()
        .single();
      
      if (error) throw error;

      // Update project status
      await supabase
        .from('projects')
        .update({ status: 'in-uitvoering' })
        .eq('id', projectId);
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['work_time_logs'] });
      toast({
        title: "Project gestart ✅",
        description: "Tijdsregistratie is gestart. Succes met je werk!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fout bij starten project",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  /**
   * Complete project mutation
   * Creates a project_completion entry with all details
   */
  const completeProjectMutation = useMutation({
    mutationFn: async (completionData: ProjectCompletionData) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      // Ensure installer_id is set
      const dataWithInstaller = {
        ...completionData,
        installer_id: user.id,
        status: 'draft' // Initial status, will be updated to 'completed' after PDF generation
      };

      // Insert completion record
      const { data: completion, error: completionError } = await supabase
        .from('project_completions')
        .insert(dataWithInstaller)
        .select()
        .single();
      
      if (completionError) throw completionError;

      // Update project with completion link
      const { error: projectError } = await supabase.rpc('complete_project', {
        p_project_id: completionData.project_id,
        p_completion_id: completion.id
      });

      if (projectError) {
        console.error('Error completing project via RPC:', projectError);
        // Fallback: Update manually
        await supabase
          .from('projects')
          .update({ 
            status: 'afgerond',
            completion_date: completionData.completion_date,
            completion_id: completion.id
          })
          .eq('id', completionData.project_id);
      }

      // Update work_time_log if provided
      if (completionData.work_time_log_id) {
        await supabase
          .from('work_time_logs')
          .update({ 
            ended_at: new Date().toISOString(),
            status: 'completed'
          })
          .eq('id', completionData.work_time_log_id);
      }
      
      return completion;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project_completions'] });
      queryClient.invalidateQueries({ queryKey: ['work_time_logs'] });
      toast({
        title: "Project opgeleverd ✅",
        description: "Het project is succesvol opgeleverd en afgerond.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fout bij opleveren project",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  /**
   * Upload photo for completion
   * Uploads photo to Storage and links to completion record
   */
  const uploadPhotoMutation = useMutation({
    mutationFn: async ({
      completionId,
      file,
      category,
      description
    }: {
      completionId: string;
      file: File;
      category: CompletionPhotoData['category'];
      description?: string;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${completionId}/${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload to Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('completion-reports')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('completion-reports')
        .getPublicUrl(filePath);

      // Insert photo record
      const { data: photo, error: photoError } = await supabase
        .from('completion_photos')
        .insert({
          completion_id: completionId,
          photo_url: publicUrl,
          category,
          description,
          file_name: file.name,
          file_size: file.size
        })
        .select()
        .single();

      if (photoError) throw photoError;

      return photo;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['completion_photos'] });
      toast({
        title: "Foto toegevoegd ✅",
        description: "De foto is succesvol geüpload.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fout bij uploaden foto",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  /**
   * Generate PDF werkbon for completion
   * Calls Edge Function to generate PDF and send email
   */
  const generatePDFMutation = useMutation({
    mutationFn: async (completionId: string) => {
      const { data, error } = await supabase.functions.invoke('generate-work-order', {
        body: { completionId }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'PDF generation failed');

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['project_completions'] });
      toast({
        title: "Werkbon gegenereerd ✅",
        description: data.emailSent 
          ? "Werkbon PDF is gegenereerd en naar klant verstuurd."
          : "Werkbon PDF is gegenereerd.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fout bij genereren werkbon",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  /**
   * Start project wrapper
   */
  const startProject = async (
    projectId: string, 
    planningId?: string,
    gpsCoords?: { latitude: number; longitude: number; accuracy: number }
  ) => {
    setIsStarting(true);
    try {
      return await startProjectMutation.mutateAsync({ projectId, planningId, gpsCoords });
    } finally {
      setIsStarting(false);
    }
  };

  /**
   * Complete project wrapper
   */
  const completeProject = async (completionData: ProjectCompletionData) => {
    setIsCompleting(true);
    try {
      return await completeProjectMutation.mutateAsync(completionData);
    } finally {
      setIsCompleting(false);
    }
  };

  /**
   * Upload photo wrapper
   */
  const uploadPhoto = async (
    completionId: string,
    file: File,
    category: CompletionPhotoData['category'],
    description?: string
  ) => {
    return await uploadPhotoMutation.mutateAsync({ completionId, file, category, description });
  };

  /**
   * Generate PDF wrapper
   */
  const generatePDF = async (completionId: string) => {
    setIsGeneratingPDF(true);
    try {
      return await generatePDFMutation.mutateAsync(completionId);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return {
    // Actions
    startProject,
    completeProject,
    uploadPhoto,
    generatePDF,
    
    // Loading states
    isStarting,
    isCompleting,
    isGeneratingPDF,
    isUploadingPhoto: uploadPhotoMutation.isPending,
    
    // Mutation objects (for advanced usage)
    startProjectMutation,
    completeProjectMutation,
    uploadPhotoMutation,
    generatePDFMutation,
  };
};

