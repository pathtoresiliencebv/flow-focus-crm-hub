import { useState } from 'react';
import { generateUUID } from '@/utils/uuid';
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
        title: "✅ Project Gestart!",
        description: "Tijdsregistratie loopt automatisch mee. Succes met je werk!",
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
      
      // ℹ️ INFO: Check for incomplete tasks (for logging only - no blocking)
      console.log('🔍 Checking for incomplete tasks...');
      const { data: incompleteTasks, error: tasksError } = await supabase
        .from('project_tasks')
        .select('id, block_title, is_info_block')
        .eq('project_id', completionData.project_id)
        .eq('is_completed', false)
        .eq('is_info_block', false); // Don't count info blocks as tasks
      
      if (!tasksError && incompleteTasks && incompleteTasks.length > 0) {
        console.log(`ℹ️ Project has ${incompleteTasks.length} incomplete task(s) - these will remain in planning`);
      } else {
        console.log('✅ All tasks completed');
      }
      
      // Build data object with ONLY the fields that exist in the database
      // Do NOT use spread operator to avoid accidentally sending extra fields
      const dataWithInstaller = {
        project_id: completionData.project_id,
        installer_id: user.id,
        completion_date: completionData.completion_date,
        work_performed: completionData.work_performed,
        materials_used: completionData.materials_used || null,
        recommendations: completionData.recommendations || null,
        notes: completionData.notes || null,
        customer_satisfaction: completionData.customer_satisfaction,
        customer_signature: completionData.customer_signature,
        installer_signature: completionData.installer_signature,
        customer_name: completionData.customer_name,
        status: 'draft', // Initial status
        follow_up_required: completionData.follow_up_required || false,
        follow_up_notes: completionData.follow_up_notes || null,
        // Store selected_task_ids as JSON string to avoid serialization issues
        selected_task_ids: (completionData.selectedTaskIds && completionData.selectedTaskIds.length > 0)
          ? JSON.stringify(completionData.selectedTaskIds)
          : null
      };
      
      console.log('🔍 [useProjectCompletion] Data to insert:', dataWithInstaller);

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
        const { data: workTimeLog, error: workTimeError } = await supabase
          .from('work_time_logs')
          .select('*')
          .eq('id', completionData.work_time_log_id)
          .single();
        
        if (!workTimeError && workTimeLog) {
          // Update work_time_log as completed
          await supabase
            .from('work_time_logs')
            .update({ 
              ended_at: new Date().toISOString(),
              status: 'completed'
            })
            .eq('id', completionData.work_time_log_id);
          
          // ✅ AUTOMATICALLY create project_registration from work_time_log
          // This makes the time registration visible in the Time Registration page
          console.log('⏱️ Creating automatic project_registration from work_time_log...');
          
          const startTime = new Date(workTimeLog.started_at);
          const endTime = new Date();
          const totalHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
          
          const { error: registrationError } = await supabase
            .from('project_registrations')
            .insert({
              project_id: completionData.project_id,
              user_id: user.id,
              registration_type: 'hours',
              start_time: workTimeLog.started_at,
              end_time: new Date().toISOString(),
              hours_type: 'normaal', // Default to normal hours
              quantity: totalHours,
              description: `Automatisch geregistreerd bij project oplevering`,
              is_approved: false // Needs approval
            });
          
          if (registrationError) {
            console.error('⚠️ Error creating project_registration:', registrationError);
            // Don't throw - completion should still succeed
          } else {
            console.log('✅ Automatic project_registration created:', totalHours.toFixed(2), 'hours');
          }
        }
      }

      return completion;
    },
    onSuccess: (completion) => {
      // Only invalidate essential queries - reduced to prevent loading loop
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project-activities', completion.project_id] });
      
      toast({
        title: "✅ Project Opgeleverd!",
        description: "Project afgerond. Werkbon wordt op de achtergrond gegenereerd en verstuurd.",
      });

      // Generate work order PDF in background (non-blocking)
      // Using Promise without await to prevent blocking
      console.log('🔄 [useProjectCompletion] Invoking generate-work-order edge function...')
      console.log('   Completion ID:', completion.id)
      
      supabase.functions.invoke('generate-work-order', {
        body: { completionId: completion.id }
      }).then(({ data, error }) => {
        if (error) {
          console.error('❌ [useProjectCompletion] Work order generation ERROR:', error)
          console.error('   Error details:', JSON.stringify(error, null, 2))
        } else {
          console.log('✅ [useProjectCompletion] Work order generated:', data)
          // Refresh work orders after generation
          queryClient.invalidateQueries({ queryKey: ['project_work_orders'] })
          queryClient.invalidateQueries({ queryKey: ['project_completions'] })
          
          // Dispatch custom event to trigger ProjectDetail refresh
          window.dispatchEvent(new CustomEvent('workorder-generated', { 
            detail: { project_id: completion.project_id }
          }))
          
          // Also refresh page after a short delay to ensure database writes are complete
          setTimeout(() => {
            window.location.reload()
          }, 2000)
        }
      }).catch((error) => {
        console.error('❌ [useProjectCompletion] Unexpected error during work order generation:', error)
        console.error('   Error type:', error?.constructor?.name)
        console.error('   Full error:', JSON.stringify(error, null, 2))
      })
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
      const fileName = `${completionId}/${generateUUID()}.${fileExt}`;
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

