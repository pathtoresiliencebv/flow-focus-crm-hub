import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';

export interface CompletionData {
  notes: string;
  completion_date: string;
  customer_satisfaction: number;
  work_performed: string;
  materials_used: string;
  recommendations: string;
  customer_signature: string;
  installer_signature: string;
  photos: Array<{
    id: string;
    url: string;
    description: string;
    category: 'before' | 'during' | 'after' | 'detail' | 'overview';
    file_name: string;
    file_size: number;
  }>;
}

export interface ProjectCompletionStatus {
  id?: string;
  status: 'draft' | 'completed' | 'sent';
  pdf_url?: string;
  email_sent_at?: string;
  created_at?: string;
}

export const useProjectCompletion = (projectId?: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [completionStatus, setCompletionStatus] = useState<ProjectCompletionStatus | null>(null);

  // Check if project already has a completion record
  const checkCompletionStatus = useCallback(async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('project_completions')
        .select('id, status, pdf_url, email_sent_at, created_at')
        .eq('project_id', projectId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setCompletionStatus(data);
      } else {
        setCompletionStatus({ status: 'draft' });
      }
    } catch (error) {
      console.error('Error checking completion status:', error);
      toast({
        title: "Error",
        description: "Failed to check project completion status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [projectId, toast]);

  // Upload photos to Supabase Storage
  const uploadPhotos = useCallback(async (photos: any[]): Promise<CompletionData['photos']> => {
    if (!projectId || photos.length === 0) return [];

    const uploadedPhotos: CompletionData['photos'] = [];

    for (const photo of photos) {
      try {
        const fileName = `project-${projectId}/${photo.id}_${Date.now()}_${photo.file.name}`;
        
        const { data, error } = await supabase.storage
          .from('project-photos')
          .upload(fileName, photo.file, {
            contentType: photo.file.type,
            upsert: false,
          });

        if (error) {
          console.error('Photo upload error:', error);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('project-photos')
          .getPublicUrl(fileName);

        uploadedPhotos.push({
          id: photo.id,
          url: publicUrl,
          description: photo.description,
          category: photo.category,
          file_name: photo.file.name,
          file_size: photo.file.size,
        });
      } catch (error) {
        console.error('Error uploading photo:', error);
      }
    }

    return uploadedPhotos;
  }, [projectId]);

  // Submit project completion
  const submitCompletion = useCallback(async (completionData: CompletionData): Promise<boolean> => {
    if (!projectId || !user?.id) {
      toast({
        title: "Error",
        description: "Missing project ID or user authentication",
        variant: "destructive",
      });
      return false;
    }

    setSubmitting(true);
    try {
      // Upload photos first
      const uploadedPhotos = await uploadPhotos(completionData.photos);

      // Prepare completion data for API
      const apiData = {
        project_id: projectId,
        installer_id: user.id,
        completion_date: completionData.completion_date,
        work_performed: completionData.work_performed,
        materials_used: completionData.materials_used || null,
        recommendations: completionData.recommendations || null,
        notes: completionData.notes || null,
        customer_satisfaction: completionData.customer_satisfaction,
        customer_signature: completionData.customer_signature,
        installer_signature: completionData.installer_signature,
        photos: uploadedPhotos,
      };

      // Call the completion processing function
      const { data, error } = await supabase.functions.invoke('generate-completion-pdf', {
        body: { completionData: apiData },
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to process completion');
      }

      // Update local status
      setCompletionStatus({
        id: data.completion_id,
        status: 'completed',
        pdf_url: data.pdf_url,
        created_at: new Date().toISOString(),
      });

      toast({
        title: "Project Completed",
        description: "Work completion report has been generated and sent to the customer",
      });

      return true;
    } catch (error: any) {
      console.error('Error submitting completion:', error);
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit project completion",
        variant: "destructive",
      });
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [projectId, user?.id, uploadPhotos, toast]);

  // Save draft completion (without generating PDF)
  const saveDraft = useCallback(async (completionData: Partial<CompletionData>): Promise<boolean> => {
    if (!projectId || !user?.id) return false;

    try {
      setLoading(true);
      
      const draftData = {
        project_id: projectId,
        installer_id: user.id,
        completion_date: completionData.completion_date || new Date().toISOString().split('T')[0],
        work_performed: completionData.work_performed || '',
        materials_used: completionData.materials_used,
        recommendations: completionData.recommendations,
        notes: completionData.notes,
        customer_satisfaction: completionData.customer_satisfaction || 5,
        customer_signature: completionData.customer_signature || '',
        installer_signature: completionData.installer_signature || '',
        status: 'draft',
      };

      let result;
      if (completionStatus?.id) {
        // Update existing draft
        result = await supabase
          .from('project_completions')
          .update(draftData)
          .eq('id', completionStatus.id)
          .select()
          .single();
      } else {
        // Create new draft
        result = await supabase
          .from('project_completions')
          .insert(draftData)
          .select()
          .single();
      }

      if (result.error) throw result.error;

      setCompletionStatus({
        id: result.data.id,
        status: 'draft',
        created_at: result.data.created_at,
      });

      toast({
        title: "Draft Saved",
        description: "Your progress has been saved",
      });

      return true;
    } catch (error: any) {
      console.error('Error saving draft:', error);
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save draft",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [projectId, user?.id, completionStatus?.id, toast]);

  // Load existing draft
  const loadDraft = useCallback(async (): Promise<Partial<CompletionData> | null> => {
    if (!completionStatus?.id) return null;

    try {
      const { data, error } = await supabase
        .from('project_completions')
        .select(`
          *,
          completion_photos (
            id,
            photo_url,
            description,
            category,
            file_name,
            file_size
          )
        `)
        .eq('id', completionStatus.id)
        .single();

      if (error) throw error;

      return {
        notes: data.notes || '',
        completion_date: data.completion_date,
        customer_satisfaction: data.customer_satisfaction,
        work_performed: data.work_performed || '',
        materials_used: data.materials_used || '',
        recommendations: data.recommendations || '',
        customer_signature: data.customer_signature || '',
        installer_signature: data.installer_signature || '',
        photos: data.completion_photos?.map((photo: any) => ({
          id: photo.id,
          url: photo.photo_url,
          description: photo.description,
          category: photo.category,
          file_name: photo.file_name,
          file_size: photo.file_size,
        })) || [],
      };
    } catch (error) {
      console.error('Error loading draft:', error);
      return null;
    }
  }, [completionStatus?.id]);

  // Get completion statistics for the installer
  const getCompletionStats = useCallback(async () => {
    if (!user?.id) return null;

    try {
      const { data, error } = await supabase
        .rpc('get_completion_stats', { days_back: 30 });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting completion stats:', error);
      return null;
    }
  }, [user?.id]);

  return {
    // State
    loading,
    submitting,
    completionStatus,

    // Actions
    checkCompletionStatus,
    submitCompletion,
    saveDraft,
    loadDraft,
    getCompletionStats,

    // Computed
    canSubmit: completionStatus?.status === 'draft',
    isCompleted: completionStatus?.status === 'completed',
    pdfUrl: completionStatus?.pdf_url,
  };
};