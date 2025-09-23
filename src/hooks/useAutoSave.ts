import { useCallback, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseAutoSaveOptions {
  onSave: (data: any) => Promise<boolean>;
  data: any;
  enabled?: boolean;
  delay?: number;
}

export const useAutoSave = ({ onSave, data, enabled = true, delay = 1500 }: UseAutoSaveOptions) => {
  const { toast } = useToast();
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const lastSavedDataRef = useRef<any>();
  const isSavingRef = useRef(false);

  const debouncedSave = useCallback(async () => {
    if (!enabled || isSavingRef.current) return;

    // Check if data has actually changed
    const currentDataString = JSON.stringify(data);
    const lastDataString = JSON.stringify(lastSavedDataRef.current);
    
    if (currentDataString === lastDataString) {
      return;
    }

    try {
      isSavingRef.current = true;
      console.log('🔄 Auto-saving data...');
      
      const success = await onSave(data);
      
      if (success) {
        lastSavedDataRef.current = JSON.parse(currentDataString);
        console.log('✅ Auto-save completed successfully');
      }
    } catch (error) {
      console.error('❌ Auto-save failed:', error);
      // Don't show toast for auto-save failures to prevent spam
      // Only log the error silently
    } finally {
      isSavingRef.current = false;
    }
  }, [data, enabled, onSave]);

  const scheduleAutoSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(debouncedSave, delay) as ReturnType<typeof setTimeout>;
  }, [debouncedSave, delay]);

  const saveNow = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    return debouncedSave();
  }, [debouncedSave]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    scheduleAutoSave,
    saveNow,
    isSaving: isSavingRef.current
  };
};