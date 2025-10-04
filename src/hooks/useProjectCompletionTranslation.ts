/**
 * Hook for handling project completion translations
 * 
 * Automatically translates installer's project completion summary back to Dutch
 * for storage in the platform.
 */

import { useState, useCallback } from 'react';
import { useI18n } from '@/contexts/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface ProjectCompletionData {
  work_performed: string;
  materials_used?: string;
  recommendations?: string;
  notes?: string;
  customer_satisfaction?: number;
}

export interface TranslatedCompletionData extends ProjectCompletionData {
  original_work_performed?: string;
  original_materials_used?: string;
  original_recommendations?: string;
  original_notes?: string;
  installer_language?: string;
}

export function useProjectCompletionTranslation() {
  const { translateToNL, language } = useI18n();
  const { user } = useAuth();
  const [isTranslating, setIsTranslating] = useState(false);

  /**
   * Translate project completion data back to Dutch if needed
   */
  const translateCompletionData = useCallback(async (
    data: ProjectCompletionData
  ): Promise<TranslatedCompletionData> => {
    // If user is already in Dutch, no translation needed
    if (language === 'nl') {
      return data;
    }

    setIsTranslating(true);

    try {
      const translatedData: TranslatedCompletionData = {
        ...data,
        installer_language: language
      };

      // Translate work performed (required field)
      if (data.work_performed) {
        translatedData.original_work_performed = data.work_performed;
        translatedData.work_performed = await translateToNL(data.work_performed, language);
        console.log('✅ Translated work_performed:', {
          original: data.work_performed.substring(0, 50),
          translated: translatedData.work_performed.substring(0, 50)
        });
      }

      // Translate materials used (optional)
      if (data.materials_used && data.materials_used.trim()) {
        translatedData.original_materials_used = data.materials_used;
        translatedData.materials_used = await translateToNL(data.materials_used, language);
        console.log('✅ Translated materials_used');
      }

      // Translate recommendations (optional)
      if (data.recommendations && data.recommendations.trim()) {
        translatedData.original_recommendations = data.recommendations;
        translatedData.recommendations = await translateToNL(data.recommendations, language);
        console.log('✅ Translated recommendations');
      }

      // Translate notes (optional)
      if (data.notes && data.notes.trim()) {
        translatedData.original_notes = data.notes;
        translatedData.notes = await translateToNL(data.notes, language);
        console.log('✅ Translated notes');
      }

      return translatedData;
    } catch (error) {
      console.error('❌ Failed to translate completion data:', error);
      // Return original data on error
      return {
        ...data,
        installer_language: language
      };
    } finally {
      setIsTranslating(false);
    }
  }, [language, translateToNL]);

  /**
   * Save project completion with automatic translation
   */
  const saveProjectCompletion = useCallback(async (
    projectId: string,
    completionData: ProjectCompletionData
  ): Promise<{ success: boolean; completion_id?: string; error?: string }> => {
    try {
      // Translate data to Dutch
      const translatedData = await translateCompletionData(completionData);

      // Save to database
      const { data, error } = await supabase
        .from('project_completions')
        .insert({
          project_id: projectId,
          installer_id: user?.id,
          work_performed: translatedData.work_performed,
          materials_used: translatedData.materials_used,
          recommendations: translatedData.recommendations,
          notes: translatedData.notes,
          customer_satisfaction: translatedData.customer_satisfaction,
          // Store original texts if translated
          original_work_performed: translatedData.original_work_performed,
          original_materials_used: translatedData.original_materials_used,
          original_recommendations: translatedData.original_recommendations,
          original_notes: translatedData.original_notes,
          installer_language: translatedData.installer_language,
          completion_date: new Date().toISOString(),
          status: 'completed'
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Failed to save project completion:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Project completion saved successfully:', data.id);
      
      // Update project status
      await supabase
        .from('projects')
        .update({
          status: 'completed',
          completion_id: data.id,
          completed_at: new Date().toISOString()
        })
        .eq('id', projectId);

      return { success: true, completion_id: data.id };
    } catch (error: any) {
      console.error('❌ Error saving project completion:', error);
      return { success: false, error: error.message };
    }
  }, [translateCompletionData, user?.id]);

  return {
    translateCompletionData,
    saveProjectCompletion,
    isTranslating
  };
}

